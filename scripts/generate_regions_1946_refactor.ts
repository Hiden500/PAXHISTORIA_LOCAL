/**
 * generate-regions-1946.ts
 *
 * Refactored pipeline for the 1946 scenario.
 *
 * What it does:
 * - Reads client/src/assets/gam_map.json
 * - Rebuilds land regions with historical 1946 ownership and names
 * - Merges very small countries into 1-3 regions
 * - Re-aggregates major countries into more suitable 1946 macro-regions
 * - Creates 4 Berlin occupation sectors
 * - Optionally imports canals / water bodies from extra GeoJSON layers
 * - Writes:
 *    - client/public/world-map-full.geojson
 *    - data/scenarios/1946/regions.json
 *    - server/data/scenarios/1946/regions.json
 *
 * Install:
 *   npm i @turf/turf
 *
 * Run:
 *   npx tsx scripts/generate-regions-1946.ts
 *
 * IMPORTANT:
 * - The current gam_map.json contains only admin polygons, not oceans/seas.
 *   For water regions and canals, provide optional GeoJSON files.
 * - Historical numeric values below are a practical 1946 baseline for the game.
 *   Extend them as you refine the simulation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAM_MAP_PATH = path.join(__dirname, '../client/src/assets/gam_map.json');
const WATER_BODIES_PATH = path.join(__dirname, '../client/src/assets/water_bodies.geojson');
const CANALS_PATH = path.join(__dirname, '../client/src/assets/canals.geojson');

const OUTPUT_GEOJSON_PATH = path.join(__dirname, '../client/public/world-map-full.geojson');
const OUTPUT_REGIONS_PATH = path.join(__dirname, '../data/scenarios/1946/regions.json');
const OUTPUT_SERVER_REGIONS_PATH = path.join(__dirname, '../server/data/scenarios/1946/regions.json');

// -----------------------------
// Types
// -----------------------------

type AnyObj = Record<string, any>;

type GeoJsonFeature = {
  type: 'Feature';
  geometry: any;
  properties: AnyObj;
};

type FeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};

type RegionRecord = {
  id: number;
  geoJsonId: string;
  name: string;
  nameEn: string;
  ownerCountryId: string | null;
  kind: 'land' | 'water' | 'canal' | 'special';
  historicalYear: 1946;
  population: number;
  area: number;
  urbanization: number;
  stability: number;
  infrastructure: number;
  development: number;
  resourceProduction: Record<string, number>;
  neighboringRegionIds: number[];
  sourceAdm1Codes: string[];
  specialStatus?: string;
};

// -----------------------------
// IO helpers
// -----------------------------

function loadJson<T = any>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

function saveJson(filePath: string, value: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
  console.log(`Saved: ${filePath}`);
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

// -----------------------------
// General helpers
// -----------------------------

function normalizeText(s: any): string {
  return String(s ?? '').trim();
}

function pickName(props: AnyObj): string {
  return normalizeText(
    props.name_ru ||
    props.name_en ||
    props.name_local ||
    props.name ||
    props.admin ||
    props.woe_name ||
    props.adm1_code
  );
}

function pickNameEn(props: AnyObj): string {
  return normalizeText(props.name_en || props.name || props.admin || props.adm1_code);
}

function pickAdm1(props: AnyObj): string {
  return normalizeText(props.adm1_code || props.iso_3166_2 || props.code_hasc || props.name_en || props.name);
}

function pickCountryIso(props: AnyObj): string {
  return normalizeText(props.adm0_a3 || props.sov_a3 || props.iso_a3 || props.admin || '');
}

function getAreaSqKm(feature: GeoJsonFeature): number {
  const props = feature.properties || {};
  const area = Number(props.area_sqkm ?? props.area ?? 0);
  if (Number.isFinite(area) && area > 0) return area;
  try {
    return Math.max(0, turf.area(feature) / 1_000_000);
  } catch {
    return 0;
  }
}

function geometryToMultiPolygon(geometry: any): number[][][][] {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function makeFeatureCollection(features: GeoJsonFeature[]): FeatureCollection {
  return { type: 'FeatureCollection', features };
}

function asFeature(geometry: any, properties: AnyObj): GeoJsonFeature {
  return { type: 'Feature', geometry, properties };
}

// -----------------------------
// Historical naming / translation
// -----------------------------

const REGION_TRANSLATIONS: Record<string, string> = {
  // Germany
  'DEU-1601': 'Саксония',
  'DEU-1600': 'Саксония-Анхальт',
  'DEU-3487': 'Бранденбург',
  'DEU-3488': 'Мекленбург-Передняя Померания',
  'DEU-1577': 'Тюрингия',
  'DEU-1591': 'Бавария',
  'DEU-1574': 'Гессен',
  'DEU-1575': 'Бремен',
  'DEU-1573': 'Баден-Вюртемберг',
  'DEU-1576': 'Нижняя Саксония',
  'DEU-1572': 'Северный Рейн-Вестфалия',
  'DEU-1579': 'Шлезвиг-Гольштейн',
  'DEU-1578': 'Гамбург',
  'DEU-1580': 'Рейнланд-Пфальц',
  'DEU-1581': 'Саар',
  'DEU-1599': 'Берлин',

  // USA macro-regions
  'USA-NORTHEAST': 'Северо-Восток США',
  'USA-MIDWEST': 'Средний Запад США',
  'USA-SOUTH': 'Юг США',
  'USA-WEST': 'Запад США',
  'USA-ALASKA': 'Аляска',
  'USA-HAWAII': 'Гавайи',

  // Canada macro-regions
  'CAN-ATLANTIC': 'Атлантическая Канада',
  'CAN-QUEBEC': 'Квебек',
  'CAN-ONTARIO': 'Онтарио',
  'CAN-PRAIRIES': 'Прерии',
  'CAN-BC': 'Британская Колумбия',
  'CAN-NORTH': 'Северные территории',

  // China macro-regions
  'CHN-NORTHEAST': 'Северо-Восточный Китай',
  'CHN-NORTH': 'Северный Китай',
  'CHN-EAST': 'Восточный Китай',
  'CHN-CENTRAL': 'Центральный Китай',
  'CHN-SOUTH': 'Южный Китай',
  'CHN-SOUTHWEST': 'Юго-Западный Китай',
  'CHN-NORTHWEST': 'Северо-Западный Китай',
  'CHN-TIBET': 'Тибет',
  'CHN-TAIWAN': 'Тайвань',
  'CHN-PARACEL': 'Парасельские острова',

  // USSR / ex-USSR macro-regions
  'USSR-RSFSR-NW': 'РСФСР — Северо-Запад',
  'USSR-RSFSR-CENTER': 'РСФСР — Центр',
  'USSR-RSFSR-VOLGA': 'РСФСР — Поволжье',
  'USSR-RSFSR-URALS': 'РСФСР — Урал',
  'USSR-RSFSR-SIBERIA': 'РСФСР — Сибирь',
  'USSR-RSFSR-EAST': 'РСФСР — Дальний Восток',
  'USSR-RSFSR-SOUTH': 'РСФСР — Юг',
  'USSR-UKR': 'Украинская ССР',
  'USSR-BLR': 'Белорусская ССР',
  'USSR-BALTIC': 'Прибалтийские республики',
  'USSR-CAUCASUS': 'Закавказские республики',
  'USSR-CENTRAL-ASIA': 'Среднеазиатские республики',
  'USSR-MDA': 'Молдавская ССР',

  // Germany occupation zones
  'DEU-USSR': 'Германия (Советская зона)',
  'DEU-USA': 'Германия (Американская зона)',
  'DEU-UK': 'Германия (Британская зона)',
  'DEU-FRA': 'Германия (Французская зона)',

  // Water / canals
  'WATER-ATLANTIC': 'Атлантический океан',
  'WATER-PACIFIC': 'Тихий океан',
  'WATER-INDIAN': 'Индийский океан',
  'WATER-NORTH_SEA': 'Северное море',
  'WATER-BALTIC_SEA': 'Балтийское море',
  'WATER-MEDITERRANEAN': 'Средиземное море',
  'WATER-BLACK_SEA': 'Чёрное море',
  'WATER-RED_SEA': 'Красное море',
  'WATER-SUEZ_CANAL': 'Суэцкий канал',
  'WATER-PANAMA_CANAL': 'Панамский канал',
};

function getRussianName(id: string, englishName: string, nameRu?: string): string {
  const ru = normalizeText(nameRu);
  if (ru) return ru;
  if (REGION_TRANSLATIONS[id]) return REGION_TRANSLATIONS[id];
  if (REGION_TRANSLATIONS[englishName]) return REGION_TRANSLATIONS[englishName];
  return englishName || id;
}

// -----------------------------
// Country / ownership profiles
// -----------------------------

const ISO_TO_OWNER_ID: Record<string, string> = {
  // USSR bloc and allies / historical 1946 ownership baseline
  SUN: 'USSR',
  RUS: 'USSR',
  UKR: 'USSR',
  BLR: 'USSR',
  EST: 'USSR',
  LVA: 'USSR',
  LTU: 'USSR',
  MDA: 'USSR',
  GEO: 'USSR',
  ARM: 'USSR',
  AZE: 'USSR',
  KAZ: 'USSR',
  UZB: 'USSR',
  TKM: 'USSR',
  KGZ: 'USSR',
  TJK: 'USSR',

  USA: 'USA',
  CAN: 'CAN',
  GBR: 'UK',
  FRA: 'FRA',
  DEU: 'Germany',
  ITA: 'Italy',
  CHN: 'China',
  TWN: 'Taiwan',
  HKG: 'Taiwan',
  MAC: 'Taiwan',

  // default fallbacks for special cases
  SGP: 'Singapore',
  BRN: 'Brunei',
  MLT: 'Malta',
  LUX: 'Luxembourg',
  AND: 'Andorra',
  MCO: 'Monaco',
  SMR: 'San Marino',
  LIE: 'Liechtenstein',
};

const COUNTRY_COLORS: Record<string, string> = {
  USSR: '#CC0000',
  USA: '#0066CC',
  UK: '#003366',
  FRA: '#0055AA',
  Germany: '#DDDD00',
  Italy: '#00AA00',
  China: '#FF0000',
  Taiwan: '#0000FF',
  Canada: '#3399FF',
  Singapore: '#FF6600',
  Brunei: '#996600',
  Luxembourg: '#9966CC',
  Andorra: '#66CCCC',
  Monaco: '#CC66CC',
  'San Marino': '#999999',
  Liechtenstein: '#669966',

  'DEU-USSR': '#CC0000',
  'DEU-USA': '#0066CC',
  'DEU-UK': '#003366',
  'DEU-FRA': '#0055AA',
  'USA-NORTHEAST': '#004c99',
  'USA-MIDWEST': '#0066cc',
  'USA-SOUTH': '#3385ff',
  'USA-WEST': '#80b3ff',
  'USA-ALASKA': '#99ccff',
  'USA-HAWAII': '#99ddff',
  'CAN-ATLANTIC': '#00a3cc',
  'CAN-QUEBEC': '#00b8d4',
  'CAN-ONTARIO': '#00c4e0',
  'CAN-PRAIRIES': '#00d0ec',
  'CAN-BC': '#00dcf8',
  'CAN-NORTH': '#66e3ff',
};

const COUNTRY_PROFILES: Record<string, { urbanization: number; stability: number; infrastructure: number; development: number }> = {
  USSR: { urbanization: 0.35, stability: 0.58, infrastructure: 0.42, development: 0.49 },
  USA: { urbanization: 0.64, stability: 0.90, infrastructure: 0.88, development: 0.95 },
  UK: { urbanization: 0.80, stability: 0.72, infrastructure: 0.74, development: 0.86 },
  FRA: { urbanization: 0.55, stability: 0.56, infrastructure: 0.55, development: 0.73 },
  Germany: { urbanization: 0.62, stability: 0.30, infrastructure: 0.44, development: 0.71 },
  Canada: { urbanization: 0.55, stability: 0.82, infrastructure: 0.73, development: 0.87 },
  China: { urbanization: 0.18, stability: 0.42, infrastructure: 0.23, development: 0.31 },
  Taiwan: { urbanization: 0.24, stability: 0.52, infrastructure: 0.28, development: 0.37 },
  Italy: { urbanization: 0.48, stability: 0.55, infrastructure: 0.48, development: 0.65 },
  Singapore: { urbanization: 1.0, stability: 0.75, infrastructure: 0.85, development: 0.72 },
  Brunei: { urbanization: 0.5, stability: 0.7, infrastructure: 0.5, development: 0.55 },
};

function profileFor(ownerId: string | null) {
  if (!ownerId) return { urbanization: 0.3, stability: 0.5, infrastructure: 0.4, development: 0.5 };
  return COUNTRY_PROFILES[ownerId] || { urbanization: 0.3, stability: 0.5, infrastructure: 0.4, development: 0.5 };
}

function countryColor(ownerId: string | null): string {
  if (!ownerId) return '#808080';
  return COUNTRY_COLORS[ownerId] || '#808080';
}

function countryName(ownerId: string | null): string {
  if (!ownerId) return 'Neutral';
  const map: Record<string, string> = {
    USSR: 'СССР',
    USA: 'США',
    UK: 'Великобритания',
    FRA: 'Франция',
    Germany: 'Германия',
    Canada: 'Канада',
    China: 'Китай',
    Taiwan: 'Китай (Гоминьдан)',
    Italy: 'Италия',
    Singapore: 'Сингапур',
    Brunei: 'Бруней',
    Luxembourg: 'Люксембург',
    Andorra: 'Андорра',
    Monaco: 'Монако',
    'San Marino': 'Сан-Марино',
    Liechtenstein: 'Лихтенштейн',
    'DEU-USSR': 'Германия (Советская зона)',
    'DEU-USA': 'Германия (Американская зона)',
    'DEU-UK': 'Германия (Британская зона)',
    'DEU-FRA': 'Германия (Французская зона)',
  };
  return map[ownerId] || ownerId;
}

function estimatePopulation(feature: GeoJsonFeature, ownerId: string | null): number {
  const props = feature.properties || {};
  const area = Math.max(1, getAreaSqKm(feature));
  const nameEn = pickNameEn(props).toLowerCase();
  const iso = pickCountryIso(props);

  // Small hard overrides for key 1946 regions. Extend these tables later.
  const popOverrides: Record<string, number> = {
    'DEU-1601': 4_500_000,
    'DEU-1600': 2_800_000,
    'DEU-3487': 2_500_000,
    'DEU-3488': 2_100_000,
    'DEU-1577': 2_300_000,
    'DEU-1591': 7_000_000,
    'DEU-1574': 4_000_000,
    'DEU-1575': 600_000,
    'DEU-1573': 6_500_000,
    'DEU-1576': 6_000_000,
    'DEU-1572': 10_000_000,
    'DEU-1579': 2_200_000,
    'DEU-1578': 1_600_000,
    'DEU-1580': 3_800_000,
    'DEU-1581': 1_000_000,
    'DEU-1599': 3_300_000,
  };
  const id = pickAdm1(props);
  if (popOverrides[id]) return popOverrides[id];

  // Macro-regions and large countries
  if (iso === 'USA') return Math.round(area * 1500);
  if (iso === 'CAN') return Math.round(area * 80);
  if (iso === 'CHN') return Math.round(area * 1200);
  if (iso === 'RUS' || iso === 'SUN') return Math.round(area * 35);
  if (iso === 'DEU') return Math.round(area * 3000);

  if (/berlin/.test(nameEn)) return 3_300_000;
  if (/hong kong/.test(nameEn)) return 1_800_000;

  return Math.max(50_000, Math.round(area * 100));
}

function baseResourceProfile(ownerId: string | null): Record<string, number> {
  switch (ownerId) {
    case 'USSR': return { coal: 1.0, iron: 0.95, oil: 0.65, gas: 0.55, grain: 0.9, timber: 0.85, uranium: 0.65 };
    case 'USA': return { coal: 0.8, iron: 0.75, oil: 0.85, gas: 0.7, grain: 0.95, timber: 0.6, uranium: 0.55 };
    case 'UK': return { coal: 0.55, iron: 0.45, oil: 0.35, gas: 0.3, grain: 0.4, timber: 0.35, uranium: 0.25 };
    case 'FRA': return { coal: 0.55, iron: 0.5, oil: 0.3, gas: 0.25, grain: 0.7, timber: 0.4, uranium: 0.35 };
    case 'Germany': return { coal: 0.85, iron: 0.75, oil: 0.3, gas: 0.25, grain: 0.55, timber: 0.35, uranium: 0.35 };
    case 'Canada': return { coal: 0.6, iron: 0.65, oil: 0.75, gas: 0.75, grain: 0.55, timber: 1.0, uranium: 0.7 };
    case 'China': return { coal: 0.85, iron: 0.65, oil: 0.45, gas: 0.35, grain: 0.75, timber: 0.55, uranium: 0.35 };
    case 'Taiwan': return { coal: 0.15, iron: 0.1, oil: 0.1, gas: 0.1, grain: 0.15, timber: 0.15, uranium: 0.05 };
    default: return { coal: 0.2, iron: 0.2, oil: 0.2, gas: 0.2, grain: 0.2, timber: 0.2, uranium: 0.1 };
  }
}

// -----------------------------
// Country-specific split / merge schemes
// -----------------------------

const SMALL_COUNTRIES_TO_ONE = new Set([
  'HKG', 'MAC', 'LUX', 'MCO', 'AND', 'SMR', 'LIE', 'MLT', 'SGP', 'BRN',
]);

const SMALL_COUNTRIES_TO_THREE: Record<string, number> = {
  SVN: 3,
  MKD: 3,
  XKX: 3,
  MDA: 3,
  QAT: 2,
  BHR: 2,
  CYP: 3,
  ISL: 2,
  ESV: 0,
  KWT: 2,
  JOR: 3,
  LBN: 3,
  BLZ: 3,
  NIC: 3,
  GTM: 4,
  COM: 2,
  SLE: 3,
  SWZ: 2,
};

const USA_STATES_BY_MACRO: Record<string, string[]> = {
  'USA-NORTHEAST': [
    'Maine','New Hampshire','Vermont','Massachusetts','Rhode Island','Connecticut',
    'New York','New Jersey','Pennsylvania'
  ],
  'USA-MIDWEST': [
    'Ohio','Michigan','Indiana','Illinois','Wisconsin','Minnesota','Iowa','Missouri',
    'North Dakota','South Dakota','Nebraska','Kansas'
  ],
  'USA-SOUTH': [
    'Delaware','Maryland','Virginia','West Virginia','Kentucky','Tennessee','North Carolina',
    'South Carolina','Georgia','Florida','Alabama','Mississippi','Arkansas','Louisiana','Oklahoma','Texas'
  ],
  'USA-WEST': [
    'Montana','Idaho','Wyoming','Colorado','New Mexico','Arizona','Utah','Nevada',
    'Washington','Oregon','California'
  ],
  'USA-ALASKA': ['Alaska'],
  'USA-HAWAII': ['Hawaii'],
};

const CANADA_MACROS: Record<string, string[]> = {
  'CAN-ATLANTIC': ['Newfoundland and Labrador', 'Prince Edward Island', 'Nova Scotia', 'New Brunswick'],
  'CAN-QUEBEC': ['Quebec'],
  'CAN-ONTARIO': ['Ontario'],
  'CAN-PRAIRIES': ['Manitoba', 'Saskatchewan', 'Alberta'],
  'CAN-BC': ['British Columbia'],
  'CAN-NORTH': ['Northwest Territories', 'Nunavut', 'Yukon'],
};

const CHINA_MACROS: Record<string, string[]> = {
  'CHN-NORTHEAST': ['Heilongjiang', 'Jilin', 'Liaoning'],
  'CHN-NORTH': ['Beijing', 'Tianjin', 'Hebei', 'Shanxi', 'Inner Mongolia'],
  'CHN-EAST': ['Shanghai', 'Jiangsu', 'Zhejiang', 'Anhui', 'Fujian', 'Jiangxi', 'Shandong'],
  'CHN-CENTRAL': ['Henan', 'Hubei', 'Hunan'],
  'CHN-SOUTH': ['Guangdong', 'Guangxi', 'Hainan'],
  'CHN-SOUTHWEST': ['Chongqing', 'Sichuan', 'Guizhou', 'Yunnan'],
  'CHN-NORTHWEST': ['Shaanxi', 'Gansu', 'Qinghai', 'Ningxia', 'Xinjiang'],
  'CHN-TIBET': ['Tibet'],
  'CHN-TAIWAN': ['Taiwan'],
  'CHN-PARACEL': ['Paracel Islands'],
};

const DEU_MACROS: Record<string, string[]> = {
  'DEU-USSR': ['Brandenburg', 'Mecklenburg-Western Pomerania', 'Saxony', 'Saxony-Anhalt', 'Thuringia', 'Berlin'],
  'DEU-USA': ['Bavaria', 'Hesse', 'Bremen', 'Baden-Württemberg'],
  'DEU-UK': ['Lower Saxony', 'North Rhine-Westphalia', 'Schleswig-Holstein', 'Hamburg'],
  'DEU-FRA': ['Rhineland-Palatinate', 'Saarland'],
};

// USSR / ex-USSR split is mostly handled by grouping and clustering the modern country polygons
// into historical macro-regions. This keeps the map readable and avoids losing geometry.
const USSR_MACRO_TARGETS: Record<string, number> = {
  RUS: 8,
  UKR: 4,
  BLR: 2,
  KAZ: 4,
  UZB: 2,
  TKM: 1,
  KGZ: 1,
  TJK: 1,
  MDA: 1,
  EST: 1,
  LVA: 1,
  LTU: 1,
  GEO: 1,
  ARM: 1,
  AZE: 1,
};

function matchAnyName(feature: GeoJsonFeature, names: string[]): boolean {
  const p = feature.properties || {};
  const candidates = [pickNameEn(p), normalizeText(p.name), normalizeText(p.name_local), normalizeText(p.admin)];
  return candidates.some(candidate => names.some(n => candidate.toLowerCase() === n.toLowerCase()));
}

function featuresForCountry(fc: FeatureCollection, isoA3: string): GeoJsonFeature[] {
  return fc.features.filter(f => pickCountryIso(f.properties) === isoA3);
}

function featuresForNameList(features: GeoJsonFeature[], names: string[]): GeoJsonFeature[] {
  return features.filter(f => matchAnyName(f, names));
}

function centroidOf(feature: GeoJsonFeature): [number, number] {
  try {
    const c = turf.centroid(feature as any).geometry.coordinates as [number, number];
    return c;
  } catch {
    const p = feature.properties || {};
    const lon = Number(p.longitude ?? p.lon ?? 0);
    const lat = Number(p.latitude ?? p.lat ?? 0);
    return [lon, lat];
  }
}

function byGeoJsonId(a: GeoJsonFeature, b: GeoJsonFeature): number {
  return pickAdm1(a.properties).localeCompare(pickAdm1(b.properties));
}

function dissolveFeatures(features: GeoJsonFeature[]): any {
  if (features.length === 0) return null;
  const geoms: any[] = [];
  for (const f of features) {
    if (!f.geometry) continue;
    if (f.geometry.type === 'Polygon') geoms.push(f.geometry.coordinates);
    if (f.geometry.type === 'MultiPolygon') geoms.push(...f.geometry.coordinates);
  }
  if (geoms.length === 0) return null;
  return geoms.length === 1 ? { type: 'Polygon', coordinates: geoms[0] } : { type: 'MultiPolygon', coordinates: geoms };
}

function makeMergedFeature(features: GeoJsonFeature[], properties: AnyObj): GeoJsonFeature | null {
  const geometry = dissolveFeatures(features);
  if (!geometry) return null;
  const first = features[0];
  return {
    type: 'Feature',
    geometry,
    properties: {
      ...first.properties,
      ...properties,
    },
  };
}

function simpleKMeans(features: GeoJsonFeature[], k: number): GeoJsonFeature[][] {
  const sorted = [...features].sort((a, b) => {
    const ca = centroidOf(a);
    const cb = centroidOf(b);
    return ca[0] - cb[0] || ca[1] - cb[1];
  });
  if (k <= 1 || sorted.length <= 1) return [sorted];
  const chunks: GeoJsonFeature[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < sorted.length; i++) chunks[i % k].push(sorted[i]);
  return chunks.filter(c => c.length > 0);
}

function buildNamedGroups(features: GeoJsonFeature[], groups: Record<string, string[]>): GeoJsonFeature[] {
  const used = new Set<string>();
  const result: GeoJsonFeature[] = [];

  for (const [groupId, names] of Object.entries(groups)) {
    const groupFeatures = features.filter(f => {
      const id = pickAdm1(f.properties);
      if (used.has(id)) return false;
      return matchAnyName(f, names);
    });
    for (const f of groupFeatures) used.add(pickAdm1(f.properties));
    if (groupFeatures.length > 0) {
      const merged = makeMergedFeature(groupFeatures, { __groupId: groupId });
      if (merged) result.push(merged);
    }
  }

  // Append anything that was not matched.
  for (const f of features) {
    const id = pickAdm1(f.properties);
    if (!used.has(id)) result.push(f);
  }

  return result;
}

// -----------------------------
// Berlin split
// -----------------------------

function splitBerlinIntoSectors(berlinFeature: GeoJsonFeature): GeoJsonFeature[] {
  const bbox = turf.bbox(berlinFeature as any);
  const [minX, minY, maxX, maxY] = bbox;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const quadrants = [
    { id: 'DEU-1599-USSR', name: 'Берлин (Советский сектор)', owner: 'DEU-USSR', box: [minX, midY, midX, maxY] as [number, number, number, number] },
    { id: 'DEU-1599-USA', name: 'Берлин (Американский сектор)', owner: 'DEU-USA', box: [midX, midY, maxX, maxY] as [number, number, number, number] },
    { id: 'DEU-1599-UK', name: 'Берлин (Британский сектор)', owner: 'DEU-UK', box: [minX, minY, midX, midY] as [number, number, number, number] },
    { id: 'DEU-1599-FRA', name: 'Берлин (Французский сектор)', owner: 'DEU-FRA', box: [midX, minY, maxX, midY] as [number, number, number, number] },
  ];

  const sectors: GeoJsonFeature[] = [];

  for (const q of quadrants) {
    const clipped = turf.bboxClip(berlinFeature as any, q.box as any) as any;
    if (!clipped || !clipped.geometry) continue;

    sectors.push({
      type: 'Feature',
      geometry: clipped.geometry,
      properties: {
        ...berlinFeature.properties,
        adm1_code: q.id,
        name: q.name,
        name_en: q.name,
        name_ru: q.name,
        ownerCountryId: q.owner,
        specialStatus: 'FOUR_POWER_OCCUPATION',
        controllers: ['GER_SOV_ZONE', 'GER_US_ZONE', 'GER_UK_ZONE', 'GER_FR_ZONE'],
        occupationZone: q.owner,
        regionType: 'berlin_sector',
      },
    });
  }

  return sectors;
}

// -----------------------------
// Water / canals
// -----------------------------

function loadOptionalFeatureCollection(filePath: string): FeatureCollection | null {
  if (!fileExists(filePath)) return null;
  const parsed = loadJson<any>(filePath);
  if (!parsed || parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) return null;
  return parsed as FeatureCollection;
}

function prepareWaterFeatures(): GeoJsonFeature[] {
  const result: GeoJsonFeature[] = [];

  const waterSources = [
    { file: WATER_BODIES_PATH, kind: 'water' as const },
    { file: CANALS_PATH, kind: 'canal' as const },
  ];

  for (const source of waterSources) {
    const fc = loadOptionalFeatureCollection(source.file);
    if (!fc) continue;

    for (const feature of fc.features) {
      const props = feature.properties || {};
      const id = normalizeText(props.id || props.code || props.name_en || props.name || props.adm1_code);
      const nameEn = pickNameEn(props) || id;
      const name = getRussianName(id, nameEn, props.name_ru);
      result.push({
        ...feature,
        properties: {
          ...props,
          adm1_code: id,
          name_en: nameEn,
          name_ru: name,
          name,
          ownerCountryId: null,
          regionType: source.kind,
          kind: source.kind,
          water: true,
        },
      });
    }
  }

  return result;
}

// -----------------------------
// Country transforms
// -----------------------------

function transformUSA(features: GeoJsonFeature[]): GeoJsonFeature[] {
  return Object.entries(USA_STATES_BY_MACRO).flatMap(([macroId, names]) => {
    const group = featuresForNameList(features, names);
    if (group.length === 0) return [];
    const merged = makeMergedFeature(group, {
      adm1_code: macroId,
      name_en: macroId,
      name_ru: getRussianName(macroId, macroId),
      ownerCountryId: 'USA',
      regionType: 'macro',
      countryMacro: 'USA',
      sourceAdm1Codes: group.map(f => pickAdm1(f.properties)),
    });
    return merged ? [merged] : [];
  });
}

function transformCanada(features: GeoJsonFeature[]): GeoJsonFeature[] {
  return Object.entries(CANADA_MACROS).flatMap(([macroId, names]) => {
    const group = featuresForNameList(features, names);
    if (group.length === 0) return [];
    const merged = makeMergedFeature(group, {
      adm1_code: macroId,
      name_en: macroId,
      name_ru: getRussianName(macroId, macroId),
      ownerCountryId: 'Canada',
      regionType: 'macro',
      countryMacro: 'Canada',
      sourceAdm1Codes: group.map(f => pickAdm1(f.properties)),
    });
    return merged ? [merged] : [];
  });
}

function transformChina(features: GeoJsonFeature[]): GeoJsonFeature[] {
  const result: GeoJsonFeature[] = [];
  const used = new Set<string>();

  for (const [macroId, names] of Object.entries(CHINA_MACROS)) {
    const group = featuresForNameList(features, names).filter(f => {
      const id = pickAdm1(f.properties);
      if (used.has(id)) return false;
      return true;
    });
    group.forEach(f => used.add(pickAdm1(f.properties)));
    if (group.length === 0) continue;
    const merged = makeMergedFeature(group, {
      adm1_code: macroId,
      name_en: macroId,
      name_ru: getRussianName(macroId, macroId),
      ownerCountryId: 'China',
      regionType: 'macro',
      countryMacro: 'China',
      sourceAdm1Codes: group.map(f => pickAdm1(f.properties)),
    });
    if (merged) result.push(merged);
  }

  // keep anything not grouped (for example special islands / Taiwan is handled elsewhere)
  for (const f of features) {
    const id = pickAdm1(f.properties);
    if (!used.has(id)) result.push(f);
  }

  return result;
}

function transformGermany(features: GeoJsonFeature[]): GeoJsonFeature[] {
  const berlin = features.find(f => pickAdm1(f.properties) === 'DEU-1599' || /berlin/i.test(pickNameEn(f.properties)) || /berlin/i.test(normalizeText(f.properties.name_ru)));

  const output: GeoJsonFeature[] = [];
  const used = new Set<string>();

  // occupation zones by manual grouping
  for (const [zoneId, names] of Object.entries(DEU_MACROS)) {
    const group = featuresForNameList(features, names).filter(f => {
      const id = pickAdm1(f.properties);
      if (used.has(id)) return false;
      return id !== 'DEU-1599';
    });
    group.forEach(f => used.add(pickAdm1(f.properties)));

    if (group.length === 0) continue;
    const merged = makeMergedFeature(group, {
      adm1_code: zoneId,
      name_en: zoneId,
      name_ru: getRussianName(zoneId, zoneId),
      ownerCountryId: zoneId,
      regionType: 'occupation_zone',
      sourceAdm1Codes: group.map(f => pickAdm1(f.properties)),
    });
    if (merged) output.push(merged);
  }

  // Berlin sectors
  if (berlin) {
    used.add(pickAdm1(berlin.properties));
    output.push(...splitBerlinIntoSectors(berlin));
  }

  // Add any remaining German features not matched by name lists
  for (const f of features) {
    const id = pickAdm1(f.properties);
    if (!used.has(id) && id !== 'DEU-1599') output.push(f);
  }

  return output;
}

function transformUSSR(features: GeoJsonFeature[]): GeoJsonFeature[] {
  // The source map uses modern admin polygons, so the pragmatic solution is:
  // 1) keep ex-USSR countries under USSR ownership for 1946;
  // 2) split them into readable macro-regions so the map remains usable.
  const result: GeoJsonFeature[] = [];

  const byIso: Record<string, GeoJsonFeature[]> = {};
  for (const f of features) {
    const iso = pickCountryIso(f.properties);
    if (!byIso[iso]) byIso[iso] = [];
    byIso[iso].push(f);
  }

  for (const [iso, targetCount] of Object.entries(USSR_MACRO_TARGETS)) {
    const countryFeatures = byIso[iso] || [];
    if (countryFeatures.length === 0) continue;

    const groups = iso === 'RUS'
      ? simpleKMeans(countryFeatures, targetCount)
      : [countryFeatures];

    for (const group of groups) {
      const first = group[0];
      const baseId = iso === 'RUS'
        ? `USSR-RSFSR-${String(result.length + 1).padStart(2, '0')}`
        : `USSR-${iso}`;

      const merged = makeMergedFeature(group, {
        adm1_code: baseId,
        name_en: baseId,
        name_ru: getRussianName(baseId, baseId),
        ownerCountryId: 'USSR',
        regionType: 'macro',
        countryMacro: 'USSR',
        sourceAdm1Codes: group.map(f => pickAdm1(f.properties)),
      });
      if (merged) result.push(merged);
    }
  }

  return result;
}

function transformSmallCountries(features: GeoJsonFeature[], isoA3: string, targetCount: number): GeoJsonFeature[] {
  if (features.length === 0) return [];
  if (targetCount <= 1 || features.length <= 1) {
    const merged = makeMergedFeature(features, {
      adm1_code: `${isoA3}-MERGED`,
      name_en: `${isoA3}-MERGED`,
      name_ru: getRussianName(`${isoA3}-MERGED`, `${isoA3}-MERGED`),
      ownerCountryId: ISO_TO_OWNER_ID[isoA3] || isoA3,
      regionType: 'merged_country',
      countryMacro: isoA3,
      sourceAdm1Codes: features.map(f => pickAdm1(f.properties)),
    });
    return merged ? [merged] : [];
  }

  const clusters = simpleKMeans(features, Math.min(targetCount, features.length));
  return clusters
    .map((cluster, idx) => makeMergedFeature(cluster, {
      adm1_code: `${isoA3}-MERGED-${idx + 1}`,
      name_en: `${isoA3}-MERGED-${idx + 1}`,
      name_ru: getRussianName(`${isoA3}-MERGED-${idx + 1}`, `${isoA3}-MERGED-${idx + 1}`),
      ownerCountryId: ISO_TO_OWNER_ID[isoA3] || isoA3,
      regionType: 'merged_country',
      countryMacro: isoA3,
      sourceAdm1Codes: cluster.map(f => pickAdm1(f.properties)),
    }))
    .filter(Boolean) as GeoJsonFeature[];
}

// -----------------------------
// Historical enrichment
// -----------------------------

function enrichFeature(feature: GeoJsonFeature, ownerId: string | null, kind: 'land' | 'water' | 'canal' | 'special' = 'land'): GeoJsonFeature {
  const props = feature.properties || {};
  const adm1 = pickAdm1(props);
  const en = pickNameEn(props);
  const ru = getRussianName(adm1, en, props.name_ru);
  const profile = profileFor(ownerId);
  const population = estimatePopulation(feature, ownerId);
  const resources = kind === 'water'
    ? {}
    : baseResourceProfile(ownerId);

  return {
    ...feature,
    properties: {
      ...props,
      id: adm1,
      adm1_code: adm1,
      name_en: en,
      name_ru: ru,
      name: ru,
      countryName: props.admin || props.countryName || '',
      ownerCountryId: ownerId,
      ownerColor: countryColor(ownerId),
      ownerName: countryName(ownerId),
      population,
      area_sqkm: getAreaSqKm(feature),
      urbanization: profile.urbanization,
      stability: profile.stability,
      infrastructure: profile.infrastructure,
      development: profile.development,
      resourceProduction: resources,
      regionType: kind,
      historicalYear: 1946,
      type: 'region',
      color: kind === 'water' ? '#0d2a4d' : '#1a3a5c',
    },
  };
}

function buildRegionRecord(feature: GeoJsonFeature, id: number): RegionRecord {
  const p = feature.properties || {};
  const owner = normalizeText(p.ownerCountryId || null) || null;
  return {
    id,
    geoJsonId: pickAdm1(p),
    name: normalizeText(p.name_ru || p.name || p.name_en || p.admin || p.adm1_code),
    nameEn: normalizeText(p.name_en || p.name || p.admin || p.adm1_code),
    ownerCountryId: owner,
    kind: (normalizeText(p.regionType || 'land') as RegionRecord['kind']) || 'land',
    historicalYear: 1946,
    population: Number(p.population || 0),
    area: Number(p.area_sqkm || 0),
    urbanization: Number(p.urbanization || 0),
    stability: Number(p.stability || 0),
    infrastructure: Number(p.infrastructure || 0),
    development: Number(p.development || 0),
    resourceProduction: p.resourceProduction || {},
    neighboringRegionIds: [],
    sourceAdm1Codes: Array.isArray(p.sourceAdm1Codes) ? p.sourceAdm1Codes : [pickAdm1(p)],
    specialStatus: p.specialStatus,
  };
}

// -----------------------------
// Main pipeline
// -----------------------------

function main() {
  console.log('Loading input GeoJSON...');
  const source = loadJson<FeatureCollection>(GAM_MAP_PATH);
  if (!source || source.type !== 'FeatureCollection' || !Array.isArray(source.features)) {
    throw new Error('Invalid GAM map GeoJSON');
  }
  console.log(`Source features: ${source.features.length}`);

  // Separate by country / territory
  const landByIso = new Map<string, GeoJsonFeature[]>();
  for (const feature of source.features) {
    const props = feature.properties || {};
    const iso = pickCountryIso(props);
    if (!landByIso.has(iso)) landByIso.set(iso, []);
    landByIso.get(iso)!.push(feature);
  }

  const outputFeatures: GeoJsonFeature[] = [];

  // 1) Special land transformations
  for (const [iso, feats] of landByIso.entries()) {
    if (!iso) continue;

    // Germany gets explicit occupation zones + Berlin sectors
    if (iso === 'DEU') {
      outputFeatures.push(...transformGermany(feats));
      continue;
    }

    // USA / Canada / China / USSR get country-specific macro regions
    if (iso === 'USA') {
      outputFeatures.push(...transformUSA(feats));
      continue;
    }

    if (iso === 'CAN') {
      outputFeatures.push(...transformCanada(feats));
      continue;
    }

    if (iso === 'CHN') {
      outputFeatures.push(...transformChina(feats));
      continue;
    }

    if (['RUS', 'UKR', 'BLR', 'EST', 'LVA', 'LTU', 'MDA', 'GEO', 'ARM', 'AZE', 'KAZ', 'UZB', 'TKM', 'KGZ', 'TJK'].includes(iso)) {
      // These areas are handled as USSR macro-regions for the 1946 scenario.
      // RUS is clustered into 8 readable macro-regions; the others stay as one region each.
      outputFeatures.push(...transformUSSR(feats));
      continue;
    }

    // Small countries are reduced to 1-3 regions.
    if (SMALL_COUNTRIES_TO_ONE.has(iso)) {
      outputFeatures.push(...transformSmallCountries(feats, iso, 1));
      continue;
    }
    if (SMALL_COUNTRIES_TO_THREE[iso]) {
      outputFeatures.push(...transformSmallCountries(feats, iso, SMALL_COUNTRIES_TO_THREE[iso]));
      continue;
    }

    // Default: keep as is.
    outputFeatures.push(...feats);
  }

  // 2) Add water / canals if source layers are present.
  const waterFeatures = prepareWaterFeatures();
  if (waterFeatures.length > 0) {
    console.log(`Loaded additional water/canal features: ${waterFeatures.length}`);
    outputFeatures.push(...waterFeatures);
  } else {
    console.log('No extra water/canal layers found. Skipping oceans/seas/canals for now.');
  }

  // 3) Enrich everything.
  const enriched = outputFeatures.map(f => {
    const kind = normalizeText(f.properties?.regionType || 'land') as 'land' | 'water' | 'canal' | 'special';
    const owner = normalizeText(f.properties?.ownerCountryId || null) || null;
    return enrichFeature(f, owner, kind);
  });

  // 4) Save GeoJSON for MapLibre.
  saveJson(OUTPUT_GEOJSON_PATH, makeFeatureCollection(enriched));

  // 5) Generate regions.json.
  const regions = enriched.map((feature, idx) => buildRegionRecord(feature, idx + 1));
  saveJson(OUTPUT_REGIONS_PATH, regions);
  saveJson(OUTPUT_SERVER_REGIONS_PATH, regions);

  // 6) Print a concise summary.
  const summary = new Map<string, number>();
  for (const f of enriched) {
    const owner = normalizeText(f.properties?.ownerCountryId || 'Neutral');
    summary.set(owner, (summary.get(owner) || 0) + 1);
  }

  console.log('\nDone. Summary:');
  console.log(`  GeoJSON features: ${enriched.length}`);
  console.log(`  Regions generated: ${regions.length}`);
  console.log(`  Germany zone features: ${regions.filter(r => String(r.ownerCountryId || '').startsWith('DEU-')).length}`);
  console.log(`  Water/canal features: ${regions.filter(r => r.kind === 'water' || r.kind === 'canal').length}`);
  console.log(`  Owners: ${[...summary.entries()].slice(0, 20).map(([k, v]) => `${k}=${v}`).join(', ')}`);
}

main();
