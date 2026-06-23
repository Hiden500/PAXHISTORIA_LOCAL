import { type MapFeature, type MapFeatureType } from "@shared/types/map/MapFeature";
import { type GameState } from "@shared/types/GameState";

/**
 * Сервис для управления Map Features.
 * Map Features - визуальные объекты на карте (города, заводы, армии и т.д.).
 */
export class MapFeatureService {
  private game: GameState;

  constructor(game: GameState) {
    this.game = game;
  }

  /**
   * Создаёт новый Map Feature.
   */
  createMapFeature(feature: Omit<MapFeature, "id">): MapFeature {
    const id = this.generateId();

    const baseFeature: MapFeature = {
      id,
      type: feature.type,
      tags: feature.tags,
      createdAt: feature.createdAt || new Date().toISOString(),
    };

    const optionalProps: Partial<MapFeature> = {};
    if (feature.coordinates !== undefined) optionalProps.coordinates = feature.coordinates;
    if (feature.regionId !== undefined) optionalProps.regionId = feature.regionId;
    if (feature.ownerId !== undefined) optionalProps.ownerId = feature.ownerId;
    if (feature.name !== undefined) optionalProps.name = feature.name;
    if (feature.visibleAtZoom !== undefined) optionalProps.visibleAtZoom = feature.visibleAtZoom;
    if (feature.expiresAt !== undefined) optionalProps.expiresAt = feature.expiresAt;

    const newFeature = { ...baseFeature, ...optionalProps };
    this.game.mapFeatures.push(newFeature);
    return newFeature;
  }

  /**
   * Обновляет существующий Map Feature.
   */
  updateMapFeature(id: string, updates: Partial<MapFeature>): MapFeature | null {
    const index = this.game.mapFeatures.findIndex(f => f.id === id);
    if (index === -1) return null;

    const existing = this.game.mapFeatures[index];
    if (!existing) return null;

    const filteredUpdates: Partial<MapFeature> = {};
    if (updates.type !== undefined) filteredUpdates.type = updates.type;
    if (updates.coordinates !== undefined) filteredUpdates.coordinates = updates.coordinates;
    if (updates.regionId !== undefined) filteredUpdates.regionId = updates.regionId;
    if (updates.ownerId !== undefined) filteredUpdates.ownerId = updates.ownerId;
    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (updates.tags !== undefined) filteredUpdates.tags = updates.tags;
    if (updates.visibleAtZoom !== undefined) filteredUpdates.visibleAtZoom = updates.visibleAtZoom;
    if (updates.createdAt !== undefined) filteredUpdates.createdAt = updates.createdAt;
    if (updates.expiresAt !== undefined) filteredUpdates.expiresAt = updates.expiresAt;

    const updated = { ...existing, ...filteredUpdates };
    this.game.mapFeatures[index] = updated;
    return updated;
  }

  /**
   * Удаляет Map Feature.
   */
  deleteMapFeature(id: string): boolean {
    const index = this.game.mapFeatures.findIndex(f => f.id === id);
    if (index === -1) return false;

    this.game.mapFeatures.splice(index, 1);
    return true;
  }

  /**
   * Получает все Map Features для региона.
   */
  getMapFeaturesByRegion(regionId: number): MapFeature[] {
    return this.game.mapFeatures.filter(f => f.regionId === regionId);
  }

  /**
   * Получает все Map Features для владельца.
   */
  getMapFeaturesByOwner(ownerId: string): MapFeature[] {
    return this.game.mapFeatures.filter(f => f.ownerId === ownerId);
  }

  /**
   * Получает все Map Features определённого типа.
   */
  getMapFeaturesByType(type: MapFeatureType): MapFeature[] {
    return this.game.mapFeatures.filter(f => f.type === type);
  }

  /**
   * Получает Map Features, видимые на текущем зуме.
   */
  getVisibleFeatures(currentZoom: number): MapFeature[] {
    return this.game.mapFeatures.filter(f => {
      if (f.visibleAtZoom === undefined) return true;
      return currentZoom >= f.visibleAtZoom;
    });
  }

  /**
   * Удаляет истёкшие временные Map Features.
   */
  removeExpiredFeatures(): void {
    const now = new Date().toISOString();
    this.game.mapFeatures = this.game.mapFeatures.filter(f => {
      if (!f.expiresAt) return true;
      return f.expiresAt > now;
    });
  }

  /**
   * Получает Map Feature по ID.
   */
  getMapFeatureById(id: string): MapFeature | null {
    return this.game.mapFeatures.find(f => f.id === id) || null;
  }

  /**
   * Получает все Map Features с определённым тегом.
   */
  getMapFeaturesByTag(tag: string): MapFeature[] {
    return this.game.mapFeatures.filter(f => f.tags.includes(tag));
  }

  /**
   * Генерирует уникальный ID для Map Feature.
   */
  private generateId(): string {
    return `mf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получает все Map Features.
   */
  getAllMapFeatures(): MapFeature[] {
    return [...this.game.mapFeatures];
  }
}
