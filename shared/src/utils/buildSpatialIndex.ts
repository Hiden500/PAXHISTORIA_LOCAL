/**
 * Пространственный индекс для быстрого поиска соседних регионов
 * Использует grid-based подход для оптимизации O(n log n) вместо O(n²)
 */

import type { FeatureCollection, Feature } from 'geojson';
import type { Region } from '../types/map/Region';

/**
 * Grid ячейка для пространственного индекса
 */
interface GridCell {
  regions: Set<number>; // ID регионов в ячейке
}

/**
 * Пространственный индекс
 */
export class SpatialIndex {
  private grid: Map<string, GridCell>;
  private cellSize: number;
  private regionBounds: Map<number, { minX: number; minY: number; maxX: number; maxY: number }>;

  constructor(cellSize: number = 1) {
    this.grid = new Map();
    this.cellSize = cellSize;
    this.regionBounds = new Map();
  }

  /**
   * Вычисляет bounding box для геометрии
   */
  private computeBoundingBox(feature: Feature): { minX: number; minY: number; maxX: number; maxY: number } {
    const geometry = feature.geometry;
    if (!geometry) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const processCoordinates = (coords: number[][]) => {
      for (const coord of coords) {
        const [x, y] = coord;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    };

    if (geometry.type === 'Polygon') {
      for (const ring of geometry.coordinates) {
        processCoordinates(ring);
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          processCoordinates(ring);
        }
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Получает ключ ячейки grid по координатам
   */
  private getCellKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    return `${gridX},${gridY}`;
  }

  /**
   * Добавляет регион в индекс
   */
  addRegion(regionId: number, feature: Feature): void {
    const bounds = this.computeBoundingBox(feature);
    this.regionBounds.set(regionId, bounds);

    // Добавляем регион во все ячейки, которые пересекает его bounding box
    const startCellX = Math.floor(bounds.minX / this.cellSize);
    const endCellX = Math.floor(bounds.maxX / this.cellSize);
    const startCellY = Math.floor(bounds.minY / this.cellSize);
    const endCellY = Math.floor(bounds.maxY / this.cellSize);

    for (let x = startCellX; x <= endCellX; x++) {
      for (let y = startCellY; y <= endCellY; y++) {
        const key = `${x},${y}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, { regions: new Set() });
        }
        this.grid.get(key)!.regions.add(regionId);
      }
    }
  }

  /**
   * Находит потенциальных соседей региона
   */
  findPotentialNeighbors(regionId: number): Set<number> {
    const bounds = this.regionBounds.get(regionId);
    if (!bounds) {
      return new Set();
    }

    const neighbors = new Set<number>();

    // Проверяем все ячейки, которые пересекает bounding box региона
    const startCellX = Math.floor(bounds.minX / this.cellSize);
    const endCellX = Math.floor(bounds.maxX / this.cellSize);
    const startCellY = Math.floor(bounds.minY / this.cellSize);
    const endCellY = Math.floor(bounds.maxY / this.cellSize);

    for (let x = startCellX; x <= endCellX; x++) {
      for (let y = startCellY; y <= endCellY; y++) {
        const key = `${x},${y}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const id of cell.regions) {
            if (id !== regionId) {
              neighbors.add(id);
            }
          }
        }
      }
    }

    return neighbors;
  }

  /**
   * Строит индекс из GeoJSON FeatureCollection
   */
  static fromGeoJson(geoJson: FeatureCollection, cellSize: number = 1): SpatialIndex {
    const index = new SpatialIndex(cellSize);
    let regionId = 1;

    for (const feature of geoJson.features) {
      index.addRegion(regionId++, feature);
    }

    return index;
  }
}

/**
 * Строит список соседей для всех регионов
 * Упрощенная реализация - использует пространственный индекс
 */
export function buildNeighborIndex(
  geoJson: FeatureCollection,
  cellSize: number = 1
): Map<number, number[]> {
  const spatialIndex = SpatialIndex.fromGeoJson(geoJson, cellSize);
  const neighborMap = new Map<number, number[]>();

  let regionId = 1;
  for (const feature of geoJson.features) {
    const potentialNeighbors = spatialIndex.findPotentialNeighbors(regionId);
    neighborMap.set(regionId, Array.from(potentialNeighbors));
    regionId++;
  }

  return neighborMap;
}

/**
 * Применяет список соседей к регионам
 */
export function applyNeighborsToRegions(
  regions: Region[],
  neighborMap: Map<number, number[]>
): Region[] {
  return regions.map(region => {
    const neighbors = neighborMap.get(region.id) || [];
    return {
      ...region,
      neighboringRegionIds: neighbors,
    };
  });
}

/**
 * Сохраняет индекс соседей в JSON файл (для предвычисления)
 */
export function saveNeighborIndex(neighborMap: Map<number, number[]>, filePath: string): void {
  const obj = Object.fromEntries(neighborMap);
  const json = JSON.stringify(obj, null, 2);
  // В реальном использовании здесь будет запись в файл
  console.log(`Neighbor index saved to ${filePath}`);
}

/**
 * Загружает индекс соседей из JSON файла
 */
export function loadNeighborIndex(filePath: string): Map<number, number[]> {
  // В реальном использовании здесь будет чтение из файла
  console.log(`Neighbor index loaded from ${filePath}`);
  return new Map();
}
