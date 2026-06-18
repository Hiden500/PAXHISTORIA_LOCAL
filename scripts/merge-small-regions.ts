#!/usr/bin/env ts-node

/**
 * Merge small-country regions in a GeoJSON world map.
 *
 * Usage:
 *   ts-node merge-small-regions.ts input.geojson output.geojson
 *
 * What it does:
 * 1) Prints a report of countries with small region counts.
 * 2) Merges selected countries into a single Feature (Polygon/MultiPolygon).
 * 3) Writes the updated GeoJSON.
 *
 * Notes:
 * - This script does NOT do a topological dissolve.
 *   It merges features into one MultiPolygon/Polygon feature.
 * - That is usually enough for game maps and lowers feature count.
 * - If you later need a strict geometric dissolve, swap the mergeGeometry()
 *   implementation for Turf/Clipper/GEOS.
 */

import fs from "node:fs";
import path from "node:path";

type AnyProps = Record<string, any>;

type Geometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

type Feature = {
  type: "Feature";
  geometry: Geometry | null;
  properties: AnyProps;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

const INPUT = process.argv[2] ?? "world-map-full.geojson";
const OUTPUT = process.argv[3] ?? "world-map-reduced.geojson";
const REPORT = process.argv[4] ?? "world-map-reduction-report.json";

/**
 * Default set: very small countries / microstates / special territories.
 * These are the safest ones to compress to one region in a strategy map.
 */
const FORCE_MERGE_TO_ONE = new Set<string>([
  "Hong Kong S.A.R.",
  "Macau S.A.R",
  "Monaco",
  "Vatican",
  "Gibraltar",
  "Luxembourg",
  "Brunei",
  "Swaziland",
  "Sierra Leone",
  "Comoros",
  "Federated States of Micronesia",
  "Northern Mariana Islands",
  "New Caledonia",
  "Montserrat",
  "Saint Helena",
  "United States Virgin Islands",
  "Wallis and Futuna",
]);

/**
 * Optional candidates from this file that are still small enough to compress,
 * but are a bit more debatable because they may represent useful strategic depth.
 * Uncomment any of them if you want the map even simpler.
 */
const OPTIONAL_MERGE_TO_ONE = new Set<string>([
  "Cyprus",
  "Singapore",
  "Bahrain",
  "Qatar",
  "Andorra",
  "San Marino",
  "Liechtenstein",
  "Aland",
  "Belize",
  "Kuwait",
  "Lebanon",
  "Djibouti",
  "Eritrea",
  "Gambia",
  "Greenland",
  "Saint Vincent and the Grenadines",
  "Turks and Caicos Islands",
  "Vanuatu",
  "Tajikistan",
  "Turkmenistan",
  "Togo",
  "Fiji",
  "Tonga",
  "American Samoa",
  "French Polynesia",
  "Rwanda",
  "Denmark",
  "Israel",
  "Belarus",
  "Costa Rica",
  "Bangladesh",
  "Slovakia",
  "Kyrgyzstan",
  "Pakistan",
  "Niger",
  "Antigua and Barbuda",
]);

const AUTO_SUGGEST_MAX_REGIONS = 12;

function readGeoJson(filePath: string): FeatureCollection {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    throw new Error(`Invalid GeoJSON: ${filePath}`);
  }

  return parsed as FeatureCollection;
}

function countryNameOf(feature: Feature): string {
  const p = feature.properties ?? {};
  const raw =
    p.countryName ??
    p.admin ??
    p.ownerName ??
    p.name_en ??
    p.name ??
    "";

  return String(raw).trim();
}

function normalizeCountryKey(name: string): string {
  const n = name.trim();

  // Keep names stable for your dataset; only normalize obvious duplicates.
  if (/^hong kong/i.test(n)) return "Hong Kong S.A.R.";
  if (/^(macau|macao)/i.test(n)) return "Macau S.A.R";

  return n;
}

function isPolygonGeometry(g: Feature["geometry"]): g is Exclude<Feature["geometry"], null> {
  return !!g && (g.type === "Polygon" || g.type === "MultiPolygon");
}

function flattenToPolygons(geometry: Geometry): number[][][] {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  return geometry.coordinates;
}

function mergeFeatures(features: Feature[], countryName: string): Feature {
  const polygons: number[][][][] = [];

  for (const feature of features) {
    if (!isPolygonGeometry(feature.geometry)) continue;
    polygons.push(...flattenToPolygons(feature.geometry));
  }

  if (polygons.length === 0) {
    // Fall back to the first feature if geometry is missing/unexpected.
    return {
      ...features[0],
      properties: {
        ...features[0].properties,
        merged: true,
        mergedRegionCount: features.length,
        countryName,
        name_en: countryName,
      },
    };
  }

  const geometry: Geometry =
    polygons.length === 1
      ? { type: "Polygon", coordinates: polygons[0] }
      : { type: "MultiPolygon", coordinates: polygons };

  const merged: Feature = {
    type: "Feature",
    geometry,
    properties: {
      ...features[0].properties,
      merged: true,
      mergedRegionCount: features.length,
      countryName,
      name_en: countryName,
      sourceRegionIds: features.map((f) => f.properties?.id ?? f.properties?.adm1_code ?? f.properties?.name_en ?? null),
    },
  };

  return merged;
}

function main() {
  const inputPath = path.resolve(INPUT);
  const outputPath = path.resolve(OUTPUT);
  const reportPath = path.resolve(REPORT);

  const fc = readGeoJson(inputPath);

  const groups = new Map<string, Feature[]>();

  for (const feature of fc.features) {
    const rawName = countryNameOf(feature);
    if (!rawName) continue;
    const key = normalizeCountryKey(rawName);

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(feature);
  }

  const report = [...groups.entries()]
    .map(([country, features]) => ({
      country,
      count: features.length,
      merge: FORCE_MERGE_TO_ONE.has(country) || OPTIONAL_MERGE_TO_ONE.has(country),
      suggested: features.length <= AUTO_SUGGEST_MAX_REGIONS,
    }))
    .sort((a, b) => a.count - b.count || a.country.localeCompare(b.country));

  const suggested = report.filter((r) => r.suggested);
  const forced = report.filter((r) => r.merge);

  console.log("\nSmall-country report (count <= 12):");
  for (const row of suggested) {
    const mark = row.merge ? "MERGE" : "KEEP";
    console.log(`${String(row.count).padStart(2, " ")}  ${mark.padEnd(5, " ")}  ${row.country}`);
  }

  const mergedFeatures: Feature[] = [];
  const mergeCounts = new Map<string, number>();

  for (const [country, features] of groups) {
    const shouldMerge = FORCE_MERGE_TO_ONE.has(country) || OPTIONAL_MERGE_TO_ONE.has(country);

    if (!shouldMerge || features.length <= 1) {
      mergedFeatures.push(...features);
      continue;
    }

    mergedFeatures.push(mergeFeatures(features, country));
    mergeCounts.set(country, features.length);
  }

  const output: FeatureCollection = {
    type: "FeatureCollection",
    features: mergedFeatures,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        input: path.basename(inputPath),
        output: path.basename(outputPath),
        totalFeaturesBefore: fc.features.length,
        totalFeaturesAfter: mergedFeatures.length,
        forcedMergeCountries: [...FORCE_MERGE_TO_ONE],
        optionalMergeCountries: [...OPTIONAL_MERGE_TO_ONE],
        suggestedSmallCountries: suggested,
        mergedCountries: [...mergeCounts.entries()].map(([country, count]) => ({ country, count })),
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`\nDone.`);
  console.log(`Before: ${fc.features.length}`);
  console.log(`After : ${mergedFeatures.length}`);
  console.log(`Report: ${reportPath}`);
}

main();
