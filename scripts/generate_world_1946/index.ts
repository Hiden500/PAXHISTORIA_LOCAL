/**
 * index.ts — Главный скрипт генерации мира 1946
 * 
 * Запуск: npx tsx scripts/generate_world_1946/index.ts
 * 
 * Что делает:
 * 1. Загружает gam_map.json (4596 admin-1 регионов)
 * 2. Назначает исторических владельцев на 1946
 * 3. Обрабатывает зоны оккупации Германии
 * 4. Разделяет Китай на КПК и Гоминьдан
 * 5. Объединяет мелкие страны
 * 6. Создаёт водные регионы (океаны, моря, каналы)
 * 7. Назначает русские названия, население, экономику, ресурсы
 * 8. Сохраняет GeoJSON и regions.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';
import {
  ISO_TO_COUNTRY_ID,
  GERMANY_OCCUPATION_ZONES,
  getChinaOwner,
  HISTORICAL_NAMES_RU,
  POPULATION_1946,
  COUNTRY_PROFILES,
  getResourceProfile,
  getMergeTarget,
} from './historical_data';
import { createWaterRegionRecords, getAllWaterBoxes } from './water_regions';
import type { GeoJsonFeature, FeatureCollection, RegionRecord, AnyObj } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAM_MAP_PATH = path.join(__dirname, '../../client/src/assets/gam_map.json');
const OUTPUT_GEOJSON_PATH = path.join(__dirname, '../../client/public/world-map-full.geojson');
const OUTPUT_REGIONS_PATH = path.join(__dirname, '../../data/scenarios/1946/regions.json');
const OUTPUT_SERVER_REGIONS_PATH = path.join(__dirname, '../../server/data/scenarios/1946/regions.json');

// ===================================================
// Helper functions
// ===================================================

function pickAdm1(props: AnyObj): string {
  return String(props.adm1_code || props.iso_3166_2 || props.code_hasc || props.name_en || props.name || '').trim();
}

function pickCountryIso(props: AnyObj): string {
  return String(props.adm0_a3 || props.sov_a3 || props.iso_a3 || '').trim();
}

function pickNameEn(props: AnyObj): string {
  return String(props.name_en || props.name || props.admin || pickAdm1(props)).trim();
}

function getAreaSqKm(feature: GeoJsonFeature): number {
  const area = Number(feature.properties?.area_sqkm || 0);
  if (Number.isFinite(area) && area > 0) return area;
  try {
    return Math.max(0, turf.area(feature as any) / 1_000_000);
  } catch { return 0; }
}

function loadJson<T = any>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function saveJson(filePath: string, value: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
  console.log(`Saved: ${filePath}`);
}

function normalizeText(s: any): string {
  return String(s ?? '').trim();
}

function mergeFeatures(features: GeoJsonFeature[]): any {
  if (features.length === 0) return null;
  const polygons: number[][][][] = [];
  for (const f of features) {
    if (!f.geometry) continue;
    if (f.geometry.type === 'Polygon') polygons.push([f.geometry.coordinates]);
    else if (f.geometry.type === 'MultiPolygon') polygons.push(...f.geometry.coordinates);
  }
  if (polygons.length === 0) return null;
  
  try {
    if (polygons.length === 1) return { type: 'Polygon', coordinates: polygons[0] };
    return { type: 'MultiPolygon', coordinates: polygons };
  } catch { return null; }
}

function getRussianName(adm1Code: string, nameEn: string, nameRu?: string): string {
  if (nameRu && nameRu.trim()) return nameRu.trim();
  if (HISTORICAL_NAMES_RU[adm1Code]) return HISTORICAL_NAMES_RU[adm1Code];
  return nameEn || adm1Code;
}

function estimatePopulation(feature: GeoJsonFeature, ownerId: string | null): number {
  const adm1 = pickAdm1(feature.properties || {});
  // Hardcoded
  if (POPULATION_1946[adm1]) return POPULATION_1946[adm1] * 1000;
  
  const area = Math.max(1, getAreaSqKm(feature));
  const iso = pickCountryIso(feature.properties || {});
  
  // Density by country group
  const densities: Record<string, number> = {
    USA: 150, CAN: 80, CHN: 1200, RUS: 35, SUN: 35,
    DEU: 3000, GBR: 2500, NLD: 2500, BEL: 2000,
    IND: 8000, JPN: 3000, KOR: 4000, PRK: 4000,
    IDN: 500, PHL: 600, VNM: 800, THA: 500,
    BRA: 100, MEX: 200, ARG: 100, COL: 200,
    NGA: 600, EGY: 500, ETH: 200,
    FRA: 800, ITA: 800, ESP: 500,
  };
  const density = densities[iso] || 100;
  return Math.max(50000, Math.round(area * density));
}

// ===================================================
// Main pipeline
// ===================================================

function main() {
  console.log('=== World Generator 1946 ===\n');
  
  // 1. Load source
  const source = loadJson<FeatureCollection>(GAM_MAP_PATH);
  console.log(`Loaded ${source.features.length} features from gam_map.json`);
  
  // 2. Group features by country (ISO code)
  const byIso = new Map<string, GeoJsonFeature[]>();
  for (const f of source.features) {
    const iso = pickCountryIso(f.properties || {});
    if (!iso) continue;
    if (!byIso.has(iso)) byIso.set(iso, []);
    byIso.get(iso)!.push(f);
  }
  console.log(`Grouped into ${byIso.size} countries/territories`);
  
  const processedFeatures: GeoJsonFeature[] = [];
  let mergedCount = 0;
  
  // 3. Process each country
  for (const [iso, features] of byIso) {
    const ownerId = ISO_TO_COUNTRY_ID[iso];
    
    // Special case: Germany occupation zones
    if (iso === 'DEU') {
      for (const f of features) {
        const adm1 = pickAdm1(f.properties || {});
        const zoneInfo = GERMANY_OCCUPATION_ZONES[adm1];
        if (zoneInfo) {
          f.properties.ownerCountryId = zoneInfo.ownerId;
        } else {
          f.properties.ownerCountryId = 'Germany';
        }
        processedFeatures.push(f);
      }
      continue;
    }
    
    // Special case: China - split by CCP/KMT
    if (iso === 'CHN') {
      for (const f of features) {
        const adm1 = pickAdm1(f.properties || {});
        f.properties.ownerCountryId = getChinaOwner(adm1);
        processedFeatures.push(f);
      }
      continue;
    }
    
    // Special case: Taiwan / Hong Kong / Macau
    if (iso === 'TWN' || iso === 'HKG' || iso === 'MAC') {
      for (const f of features) {
        f.properties.ownerCountryId = 'Taiwan';
        processedFeatures.push(f);
      }
      continue;
    }
    
    // Check if this country should be merged
    const mergeTarget = getMergeTarget(iso);
    
    if (mergeTarget !== null && features.length > 1) {
      if (mergeTarget <= 1 || features.length <= mergeTarget) {
        // Merge all into one
        const geometry = mergeFeatures(features);
        if (geometry) {
          const firstProps = features[0].properties || {};
          processedFeatures.push({
            type: 'Feature',
            geometry,
            properties: {
              ...firstProps,
              adm1_code: `${iso}-MERGED`,
              ownerCountryId: ownerId || iso,
              merged: true,
              originalCount: features.length,
              sourceAdm1Codes: features.map(f => pickAdm1(f.properties || {})),
            },
          });
          mergedCount++;
        } else {
          processedFeatures.push(...features);
        }
      } else {
        // Merge into K groups using simple geographic clustering
        const sorted = [...features].sort((a, b) => {
          const ca = a.properties?.longitude || 0;
          const cb = b.properties?.longitude || 0;
          return ca - cb;
        });
        const k = Math.min(mergeTarget, sorted.length);
        const groups: GeoJsonFeature[][] = Array.from({ length: k }, () => []);
        sorted.forEach((f, i) => groups[i % k].push(f));
        
        for (let gi = 0; gi < groups.length; gi++) {
          const group = groups[gi];
          if (group.length === 0) continue;
          if (group.length === 1) {
            processedFeatures.push(group[0]);
            continue;
          }
          const geometry = mergeFeatures(group);
          if (geometry) {
            const firstProps = group[0].properties || {};
            const groupNames = group.map(f => pickNameEn(f.properties || {}));
            processedFeatures.push({
              type: 'Feature',
              geometry,
              properties: {
                ...firstProps,
                adm1_code: `${iso}-MERGE-${gi + 1}`,
                ownerCountryId: ownerId || iso,
                merged: true,
                originalCount: group.length,
                mergedGroupName: groupNames.join(' / '),
                sourceAdm1Codes: group.map(f => pickAdm1(f.properties || {})),
              },
            });
            mergedCount++;
          } else {
            processedFeatures.push(...group);
          }
        }
      }
      continue;
    }
    
    // Default: keep as original, assign owner
    for (const f of features) {
      if (!f.properties.ownerCountryId) {
        f.properties.ownerCountryId = ownerId || null;
      }
      processedFeatures.push(f);
    }
  }
  
  console.log(`Processed features: ${processedFeatures.length} (${mergedCount} merged)`);
  
  // 4. Prepare water region records (for regions.json only, not GeoJSON)
  console.log('\nPreparing water region records...');
  const waterRecords = createWaterRegionRecords();
  console.log(`Water region records: ${waterRecords.length}`);
  
  // 5. All features for GeoJSON = ONLY land features (water is empty background)
  const allFeatures = [...processedFeatures];
  console.log(`Total GeoJSON features: ${allFeatures.length}`);
  
  // 6. Enrich features with game data
  const enrichedFeatures: GeoJsonFeature[] = [];
  
  for (const f of allFeatures) {
    const props = f.properties || {};
    const adm1 = pickAdm1(props);
    const en = pickNameEn(props);
    const ownerId = normalizeText(props.ownerCountryId || null) || null;
    const isWater = props.regionType === 'water' || props.water || props.regionType?.startsWith('water');
    const ru = getRussianName(adm1, en, props.name_ru);
    const profile = ownerId ? (COUNTRY_PROFILES[ownerId] || { urbanization: 0.3, stability: 0.5, infrastructure: 0.4, development: 0.5 }) 
                            : { urbanization: 0.3, stability: 0.5, infrastructure: 0.4, development: 0.5 };
    const population = isWater ? 0 : estimatePopulation(f, ownerId);
    const resources = isWater ? {} : getResourceProfile(ownerId);
    const area = getAreaSqKm(f);
    
    const colors: Record<string, string> = {
      'USSR': '#CC0000', 'USA': '#0066CC', 'UK': '#003366', 'FRA': '#0055AA',
      'Germany': '#DDDD00', 'DEU-USSR': '#CC0000', 'DEU-USA': '#0066CC',
      'DEU-UK': '#003366', 'DEU-FRA': '#0055AA', 'CAN': '#3399FF',
      'China': '#FF0000', 'Taiwan': '#0000FF', 'JPN': '#FFFF00',
      'ITA': '#00AA00', 'KOR': '#00FF00', 'IND': '#FF8800',
      'BRA': '#00BB00', 'AUS': '#996600', 'MEX': '#88AA00',
      'ARG': '#88CC00', 'EGY': '#CC8800', 'TUR': '#AA8800',
      'SAF': '#666600', 'POL': '#660066', 'YUG': '#880088',
    };
    
    const ownerColor = ownerId ? (colors[ownerId] || '#808080') : '#808080';
    const ownerNames: Record<string, string> = {
      'USSR': 'СССР', 'USA': 'США', 'UK': 'Великобритания', 'FRA': 'Франция',
      'Germany': 'Германия', 'DEU-USSR': 'Германия (Советская зона)',
      'DEU-USA': 'Германия (Американская зона)', 'DEU-UK': 'Германия (Британская зона)',
      'DEU-FRA': 'Германия (Французская зона)', 'CAN': 'Канада',
      'China': 'Китай', 'Taiwan': 'Китай (Гоминьдан)', 'JPN': 'Япония',
      'ITA': 'Италия', 'KOR': 'Корея', 'IND': 'Индия',
      'BRA': 'Бразилия', 'AUS': 'Австралия', 'MEX': 'Мексика',
      'ARG': 'Аргентина', 'EGY': 'Египет', 'TUR': 'Турция',
      'SAF': 'ЮАС', 'POL': 'Польша', 'YUG': 'Югославия',
    };
    
    enrichedFeatures.push({
      ...f,
      properties: {
        ...props,
        id: adm1,
        adm1_code: adm1,
        name: ru,
        name_en: en,
        name_ru: ru,
        ownerCountryId: ownerId,
        ownerColor,
        ownerName: ownerId ? (ownerNames[ownerId] || ownerId) : 'Neutral',
        population,
        area_sqkm: Math.round(area),
        urbanization: profile.urbanization,
        stability: profile.stability,
        infrastructure: profile.infrastructure,
        development: profile.development,
        resourceProduction: resources,
        kind: isWater ? 'water' : (props.kind || 'land'),
        historicalYear: 1946,
        type: 'region',
        color: isWater ? '#0d2a4d' : '#1a3a5c',
      },
    });
  }
  
  // 7. Save GeoJSON
  const outputGeoJson: FeatureCollection = {
    type: 'FeatureCollection',
    features: enrichedFeatures,
  };
  saveJson(OUTPUT_GEOJSON_PATH, outputGeoJson);
  
  // 8. Generate regions.json (including water records)
  const regions: RegionRecord[] = [];
  let nextId = 1;
  
  for (const f of enrichedFeatures) {
    const props = f.properties || {};
    const owner = normalizeText(props.ownerCountryId || null) || null;
    
    regions.push({
      id: nextId++,
      geoJsonId: pickAdm1(props),
      name: normalizeText(props.name_ru || props.name || props.name_en || ''),
      nameEn: normalizeText(props.name_en || props.name || ''),
      ownerCountryId: owner,
      kind: 'land',
      historicalYear: 1946,
      population: Number(props.population || 0),
      area: Number(props.area_sqkm || 0),
      urbanization: Number(props.urbanization || 0),
      stability: Number(props.stability || 0),
      infrastructure: Number(props.infrastructure || 0),
      development: Number(props.development || 0),
      resourceProduction: props.resourceProduction || {},
      neighboringRegionIds: [],
      sourceAdm1Codes: Array.isArray(props.sourceAdm1Codes) ? props.sourceAdm1Codes : [pickAdm1(props)],
      specialStatus: props.specialStatus || undefined,
    });
  }
  
  // Add water regions
  for (const wr of waterRecords) {
    regions.push({
      id: nextId++,
      geoJsonId: wr.geoJsonId,
      name: wr.name,
      nameEn: wr.nameEn,
      ownerCountryId: null,
      kind: wr.kind as RegionRecord['kind'],
      historicalYear: 1946,
      population: 0,
      area: wr.area,
      urbanization: 0,
      stability: 1,
      infrastructure: 0,
      development: 0,
      resourceProduction: wr.resourceProduction,
      neighboringRegionIds: [],
      sourceAdm1Codes: [wr.geoJsonId],
    });
  }
  
  saveJson(OUTPUT_REGIONS_PATH, regions);
  saveJson(OUTPUT_SERVER_REGIONS_PATH, regions);
  
  // 9. Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Regions: ${regions.length}`);
  
  const ownerCounts = new Map<string, number>();
  for (const r of regions) {
    const o = r.ownerCountryId || 'Neutral';
    ownerCounts.set(o, (ownerCounts.get(o) || 0) + 1);
  }
  
  const sorted = [...ownerCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [owner, count] of sorted.slice(0, 30)) {
    console.log(`  ${String(count).padStart(4)}  ${owner}`);
  }
  if (sorted.length > 30) console.log(`  ... and ${sorted.length - 30} more`);
  
  const waterCount = regions.filter(r => r.kind !== 'land').length;
  console.log(`\nWater regions: ${waterCount}`);
  console.log(`Land regions: ${regions.length - waterCount}`);
  console.log('\nDone!');
}

main();