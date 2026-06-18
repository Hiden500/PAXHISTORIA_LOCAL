import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';
import type { Region } from '@shared/types/map/Region';
import type { Country } from '@shared/types/Country';
import { getCountryIdByIso } from '@shared/data/countryIsoMapping';

export interface MapRegionProperties {
  id: string;
  name: string;
  countryName: string;
  iso_a2: string;
  adm0_a3: string;
  ownerCountryId: string | null;
  ownerColor: string;
  ownerName: string;
  population: number;
  type: string;
  color: string;
  regionId?: number;
}

export interface GameMapData {
  featureCollection: FeatureCollection<Polygon | MultiPolygon, MapRegionProperties>;
}

// Исторический маппинг конкретных регионов на страны для точности 1946 года
// Приоритет над общим ISO маппингом
const HISTORICAL_REGION_COUNTRY_MAP: Record<string, string> = {
  // === ГЕРМАНИЯ - ЗОНЫ ОККУПАЦИИ 1946 ===
  // Советская зона (DEU-USSR)
  'DEU-1601': 'DEU-USSR',     // Sachsen
  'DEU-1600': 'DEU-USSR',     // Sachsen-Anhalt
  'DEU-3487': 'DEU-USSR',     // Brandenburg
  'DEU-3488': 'DEU-USSR',     // Mecklenburg-Vorpommern
  'DEU-1577': 'DEU-USSR',     // Thüringen

  // Американская зона (DEU-USA)
  'DEU-1591': 'DEU-USA',      // Bayern
  'DEU-1574': 'DEU-USA',      // Hessen
  'DEU-1575': 'DEU-USA',      // Bremen
  'DEU-1573': 'DEU-USA',      // Baden-Württemberg (северная часть)

  // Британская зона (DEU-UK)
  'DEU-1576': 'DEU-UK',       // Niedersachsen
  'DEU-1572': 'DEU-UK',       // Nordrhein-Westfalen
  'DEU-1579': 'DEU-UK',       // Schleswig-Holstein
  'DEU-1578': 'DEU-UK',       // Hamburg

  // Французская зона (DEU-FRA)
  'DEU-1580': 'DEU-FRA',      // Rheinland-Pfalz
  'DEU-1581': 'DEU-FRA',      // Saarland (протекторат)

  // Берлин - 4 сектора (виртуальные регионы)
  'DEU-1599-USSR': 'DEU-USSR',     // Berlin (советский сектор)
  'DEU-1599-USA': 'DEU-USA',      // Berlin (американский сектор)
  'DEU-1599-UK': 'DEU-UK',        // Berlin (британский сектор)
  'DEU-1599-FRA': 'DEU-FRA',      // Berlin (французский сектор)

  // === КИТАЙ - ГРАЖДАНСКАЯ ВОЙНА 1946 ===
  // Коммунисты (КПК/China) - Маньчжурия и Северный Китай
  'CHN-1839': 'China',    // Heilongjiang (Маньчжурия)
  'CHN-1828': 'China',    // Jilin (Маньчжурия)
  'CHN-1813': 'China',    // Liaoning (Маньчжурия)
  'CHN-1838': 'China',    // Inner Mongol (Внутренняя Монголия)
  'CHN-1811': 'China',    // Hebei (Северный Китай)
  'CHN-1805': 'China',    // Shanxi (Северный Китай)
  'CHN-1804': 'China',    // Shaanxi (база КПК в Яньане)
  'CHN-1803': 'China',    // Ningxia
  'CHN-1150': 'China',    // Gansu

  // Националисты (Гоминьдан/Taiwan) - Центральный, Южный, Восточный Китай
  'CHN-1814': 'Taiwan',   // Shandong
  'CHN-1816': 'Taiwan',   // Tianjin
  'CHN-1155': 'Taiwan',   // Beijing
  'CHN-1819': 'Taiwan',   // Shanghai
  'CHN-1818': 'Taiwan',   // Jiangsu
  'CHN-1820': 'Taiwan',   // Zhejiang
  'CHN-1178': 'Taiwan',   // Fujian
  'CHN-1179': 'Taiwan',   // Anhui
  'CHN-1812': 'Taiwan',   // Henan
  'CHN-1807': 'Taiwan',   // Hubei
  'CHN-1808': 'Taiwan',   // Hunan
  'CHN-1817': 'Taiwan',   // Jiangxi
  'CHN-1180': 'Taiwan',   // Guangdong
  'CHN-1152': 'Taiwan',   // Guangxi
  'CHN-1775': 'Taiwan',   // Hainan
  'CHN-1810': 'Taiwan',   // Yunnan
  'CHN-1153': 'Taiwan',   // Guizhou
  'CHN-1809': 'Taiwan',   // Sichuan
  'CHN-1154': 'Taiwan',   // Chongqing

  // Западные регионы (спорные/нейтральные)
  'CHN-1756': 'Taiwan',   // Xinjiang (националисты формально)
  'CHN-1662': 'Taiwan',   // Xizang (Тибет - де-факто независим, но формально Гоминьдан)
  'CHN-1151': 'Taiwan',   // Qinghai
};


/**
 * Создаёт маппинг GeoJSON ID на регионы
 */
function buildRegionMapping(regions: Region[]): Map<string, Region> {
  const mapping = new Map<string, Region>();
  
  for (const region of regions) {
    // Прямой маппинг по geoJsonId
    mapping.set(region.geoJsonId, region);
    
    // Для MERGE регионов также маппим исходные коды
    if (region.sourceAdm1Codes && region.sourceAdm1Codes.length > 0) {
      for (const sourceCode of region.sourceAdm1Codes) {
        mapping.set(sourceCode, region);
      }
    }
  }
  
  return mapping;
}

/**
 * Загружает GeoJSON и обогащает его игровыми данными
 */
export async function loadGameMapData(
  geoJsonUrl: string,
  regions: Region[],
  countries: Country[]
): Promise<GameMapData> {
  try {
    console.log('Loading GeoJSON from:', geoJsonUrl);
    const response = await fetch(geoJsonUrl);
    const geoJson: FeatureCollection = await response.json();

    const countryMap = new Map<string, Country>();
    countries.forEach(country => countryMap.set(country.id, country));

    // Строим маппинг регионов
    const regionMapping = buildRegionMapping(regions);
    console.log('Region mapping size:', regionMapping.size);
    console.log('Regions count:', regions.length);
    console.log('GeoJSON features count:', geoJson.features.length);

    const enrichedFeatures = geoJson.features.map(feature => {
      const props = feature.properties || {};
      const name = (props.name || 'Unknown') as string;
      const adm0_a3 = (props.adm0_a3 || '') as string;
      const type = (props.type || 'region') as string;
      const oceanColor = (props.color || '#1a3a5c') as string;
      const featureId = (props.id || '') as string;

      // Определяем страну по ISO коду или по конкретному региону
      let ownerCountryId: string | null = null;
      let ownerColor = '#808080';
      let ownerName = 'Neutral';
      let regionId: number | undefined = undefined;
      let regionName = name;
      let regionPopulation = 0;

      if (type === 'region') {
        // Сначала проверяем маппинг из regions.json (приоритет)
        const matchedRegion = regionMapping.get(featureId);
        if (matchedRegion) {
          regionId = matchedRegion.id;
          regionName = matchedRegion.name;
          regionPopulation = matchedRegion.population;
          
          const country = countryMap.get(matchedRegion.ownerCountryId);
          if (country) {
            ownerCountryId = matchedRegion.ownerCountryId;
            ownerColor = country.color;
            ownerName = country.name;
          }
          if (featureId.includes('MERGE')) {
            console.log('MERGE region matched:', featureId, '->', matchedRegion.name);
          }
        }
        // Если нет в regions.json, проверяем исторический маппинг
        else if (featureId && HISTORICAL_REGION_COUNTRY_MAP[featureId]) {
          const matchedId = HISTORICAL_REGION_COUNTRY_MAP[featureId];
          const country = countryMap.get(matchedId);
          if (country) {
            ownerCountryId = matchedId;
            ownerColor = country.color;
            ownerName = country.name;
          }
        }
        // Если нет исторического маппинга региона, используем ISO код страны
        else if (adm0_a3) {
          const matchedId = getCountryIdByIso(adm0_a3);
          if (matchedId) {
            const country = countryMap.get(matchedId);
            if (country) {
              ownerCountryId = matchedId;
              ownerColor = country.color;
              ownerName = country.name;
            }
          }
        }
      }

      if (type === 'ocean') {
        ownerColor = oceanColor;
        ownerName = name;
      }

      return {
        type: 'Feature' as const,
        properties: {
          id: props.id || adm0_a3 || name,
          name: regionName,
          countryName: props.country || '',
          iso_a2: (props.iso_a2 || '') as string,
          adm0_a3,
          ownerCountryId,
          ownerColor,
          ownerName,
          population: regionPopulation,
          type,
          color: oceanColor,
          regionId
        },
        geometry: feature.geometry as Polygon | MultiPolygon
      } as Feature<Polygon | MultiPolygon, MapRegionProperties>;
    });

    return {
      featureCollection: {
        type: 'FeatureCollection',
        features: enrichedFeatures
      }
    };
  } catch (error) {
    console.error('Ошибка загрузки данных карты:', error);
    throw error;
  }
}

/**
 * Обновляет данные карты при изменении владельцев регионов
 */
export function updateMapData(
  featureCollection: FeatureCollection<Polygon | MultiPolygon, MapRegionProperties>,
  regions: Region[],
  countries: Country[]
): FeatureCollection<Polygon | MultiPolygon, MapRegionProperties> {
  const countryMap = new Map<string, Country>();
  countries.forEach(country => countryMap.set(country.id, country));

  // Строим маппинг регионов
  const regionMapping = buildRegionMapping(regions);

  const updatedFeatures = featureCollection.features.map(feature => {
    const props = feature.properties;
    const featureId = props.id || '';
    const adm0_a3 = props.adm0_a3;

    if (props.type === 'ocean') return feature;

    // Сначала проверяем маппинг из regions.json (приоритет)
    const matchedRegion = regionMapping.get(featureId);
    if (matchedRegion) {
      const country = countryMap.get(matchedRegion.ownerCountryId);
      if (country) {
        return {
          ...feature,
          properties: {
            ...props,
            ownerCountryId: matchedRegion.ownerCountryId,
            ownerColor: country.color,
            ownerName: country.name,
            name: matchedRegion.name,
            population: matchedRegion.population
          }
        };
      }
    }

    // Если нет в regions.json, проверяем исторический маппинг
    if (featureId && HISTORICAL_REGION_COUNTRY_MAP[featureId]) {
      const matchedId = HISTORICAL_REGION_COUNTRY_MAP[featureId];
      const country = countryMap.get(matchedId);
      if (country) {
        return {
          ...feature,
          properties: {
            ...props,
            ownerCountryId: matchedId,
            ownerColor: country.color,
            ownerName: country.name
          }
        };
      }
    }

    // Если нет исторического маппинга региона, используем ISO код страны
    if (adm0_a3) {
      const matchedId = getCountryIdByIso(adm0_a3);
      if (matchedId) {
        const country = countryMap.get(matchedId);
        if (country) {
          return {
            ...feature,
            properties: {
              ...props,
              ownerCountryId: matchedId,
              ownerColor: country.color,
              ownerName: country.name
            }
          };
        }
      }
    }

    return feature;
  });

  return {
    type: 'FeatureCollection',
    features: updatedFeatures
  };
}