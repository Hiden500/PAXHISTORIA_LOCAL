/**
 * Генератор игровых регионов из GeoJSON
 * Создает объекты Region с историческими данными 1946 года
 */

import type { FeatureCollection, Feature } from 'geojson';
import type { Region } from '../types/map/Region';
import { getCountryIdByIso } from '../data/countryIsoMapping';
import { getRussianRegionName } from '../data/regionTranslations';
import {
  getRegionPopulation1946,
  getRegionEconomics1946,
  getRegionResourceProduction1946,
} from '../data/historicalData1946';

/**
 * Свойства GeoJSON региона из gam_map.json
 */
export interface GeoJsonRegionProperties {
  adm1_code: string;
  name: string;
  name_ru?: string;
  iso_a2: string;
  adm0_a3: string;
  admin: string;
  area_sqkm: number;
}

/**
 * Настройки генерации регионов
 */
export interface GenerateRegionsOptions {
  startId: number;
  skipUnknownCountries: boolean;
  defaultCountryId?: string;
}

/**
 * Вычисляет площадь региона из геометрии GeoJSON
 * Упрощенная реализация - использует area_sqkm если доступно
 */
function calculateRegionArea(feature: Feature): number {
  const props = feature.properties as GeoJsonRegionProperties;
  if (props.area_sqkm && props.area_sqkm > 0) {
    return props.area_sqkm;
  }
  
  // Если area_sqkm не указан, возвращаем 0 (будет оценено позже)
  return 0;
}

/**
 * Генерирует игровые регионы из GeoJSON FeatureCollection
 */
export function generateRegionsFromGeoJson(
  geoJson: FeatureCollection,
  options: GenerateRegionsOptions = { startId: 1, skipUnknownCountries: true }
): Region[] {
  const regions: Region[] = [];
  let nextId = options.startId;

  for (const feature of geoJson.features) {
    const props = feature.properties as GeoJsonRegionProperties;
    
    // Пропускаем регионы без необходимых свойств
    if (!props.adm1_code || !props.adm0_a3) {
      continue;
    }

    // Определяем страну по ISO коду
    const countryId = getCountryIdByIso(props.adm0_a3);
    
    // Пропускаем регионы неизвестных стран если настроено
    if (!countryId) {
      if (options.skipUnknownCountries) {
        continue;
      }
      // Используем страну по умолчанию если указана
      if (!options.defaultCountryId) {
        continue;
      }
    }

    const finalCountryId = countryId || options.defaultCountryId!;

    // Вычисляем площадь
    const area = calculateRegionArea(feature);

    // Получаем русское название
    const russianName = getRussianRegionName(props.adm1_code, props.name, props.name_ru);

    // Получаем исторические данные 1946
    const population = getRegionPopulation1946(props.adm1_code, finalCountryId, area);
    const economics = getRegionEconomics1946(finalCountryId);
    const resourceProduction = getRegionResourceProduction1946(finalCountryId);

    // Создаем регион
    const region: Region = {
      id: nextId++,
      geoJsonId: props.adm1_code,
      name: russianName,
      ownerCountryId: finalCountryId,
      population,
      area,
      urbanization: economics.urbanization,
      stability: economics.stability,
      infrastructure: economics.infrastructure,
      development: economics.development,
      resourceProduction,
      neighboringRegionIds: [], // Будет заполнено позже через spatial index
    };

    regions.push(region);
  }

  return regions;
}

/**
 * Создает Map для быстрого доступа к регионам по geoJsonId
 */
export function createRegionMap(regions: Region[]): Map<string, Region> {
  const regionMap = new Map<string, Region>();
  for (const region of regions) {
    regionMap.set(region.geoJsonId, region);
  }
  return regionMap;
}

/**
 * Создает индекс регионов по стране
 */
export function createRegionIndexByCountry(regions: Region[]): Map<string, Region[]> {
  const countryIndex = new Map<string, Region[]>();
  
  for (const region of regions) {
    if (!countryIndex.has(region.ownerCountryId)) {
      countryIndex.set(region.ownerCountryId, []);
    }
    countryIndex.get(region.ownerCountryId)!.push(region);
  }
  
  return countryIndex;
}
