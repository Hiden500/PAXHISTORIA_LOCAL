/**
 * types.ts — Общие типы для генератора регионов
 */

export type AnyObj = Record<string, any>;

export type GeoJsonFeature = {
  type: 'Feature';
  geometry: any;
  properties: AnyObj;
};

export type FeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};

export type RegionRecord = {
  id: number;
  geoJsonId: string;
  name: string;
  nameEn: string;
  ownerCountryId: string | null;
  kind: 'land' | 'water' | 'canal' | 'special' | 'merged_country' | 'macro' | 'occupation_zone' | 'berlin_sector' | 'lake' | 'ocean' | 'sea' | 'river';
  historicalYear: number;
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

export type WaterBox = {
  id: string;
  name: string;
  nameEn: string;
  kind: 'ocean' | 'sea' | 'lake' | 'canal';
  bbox: [number, number, number, number];
};

export type CountryProfile = {
  urbanization: number;
  stability: number;
  infrastructure: number;
  development: number;
};