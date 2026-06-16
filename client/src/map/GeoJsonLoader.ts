import type { FeatureCollection } from "geojson";

const WORLD_GEOJSON_URL = `${import.meta.env.BASE_URL}countries.geo.json`;

export async function loadWorldGeoJson(): Promise<FeatureCollection> {
  const response = await fetch(WORLD_GEOJSON_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to load world map data (${response.status})`
    );
  }

  return response.json();
}
