import { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import { loadWorldGeoJson } from "./GeoJsonLoader";
import { RegionLayer } from "./RegionLayer";

import "leaflet/dist/leaflet.css";

export function MapView() {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorldGeoJson()
      .then(setGeoData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e))
      );
  }, []);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{
        width: "100%",
        height: "100vh"
      }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {geoData && <RegionLayer data={geoData} />}

      {error && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1000,
            padding: "8px 12px",
            background: "#b00020",
            color: "#fff",
            borderRadius: 4
          }}
        >
          {error}
        </div>
      )}
    </MapContainer>
  );
}
