import { GeoJSON } from "react-leaflet";
import type { Feature, FeatureCollection } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import { CountryColors } from "./CountryColors";

const DEFAULT_COLOR = "#cfd8dc";

const countryKeyByCode: Record<string, string> = {
  RUS: "ussr",
  USA: "usa",
  GBR: "uk",
  FRA: "france",
  CHN: "china"
};

function regionColor(feature?: Feature): string {
  const code = feature?.id != null ? String(feature.id) : undefined;
  const key = code ? countryKeyByCode[code] : undefined;

  return key ? CountryColors[key] : DEFAULT_COLOR;
}

function regionStyle(feature?: Feature): PathOptions {
  return {
    fillColor: regionColor(feature),
    fillOpacity: 0.7,
    color: "#37474f",
    weight: 1
  };
}

function onEachRegion(feature: Feature, layer: Layer): void {
  const name = feature.properties?.name;

  if (name) {
    layer.bindPopup(String(name));
  }
}

export function RegionLayer({ data }: { data: FeatureCollection }) {
  return (
    <GeoJSON
      data={data}
      style={regionStyle}
      onEachFeature={onEachRegion}
    />
  );
}
