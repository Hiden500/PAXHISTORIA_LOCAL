import { type Region } from "../types/map/Region";

/**
 * Строит индекс для быстрого доступа к регионам страны.
 * Возвращает Map где ключ - countryId, значение - массив regionIds.
 */
export function buildRegionIndex(regions: Region[]): Map<string, number[]> {
  const index = new Map<string, number[]>();

  for (const region of regions) {
    const countryRegions = index.get(region.ownerCountryId) || [];
    countryRegions.push(region.id);
    index.set(region.ownerCountryId, countryRegions);
  }

  return index;
}
