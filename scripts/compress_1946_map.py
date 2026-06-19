#!/usr/bin/env python3
"""
Compress world-map-1946.geojson by rounding coordinates to 4 decimal places.
Saves to client/public/world_map_1946.geojson for the app to fetch.
"""

import json
from pathlib import Path


def round_coords(coords, decimals=4):
    """Recursively round coordinates."""
    if isinstance(coords, (int, float)):
        return round(coords, decimals)
    if isinstance(coords, list):
        if len(coords) >= 2 and isinstance(coords[0], (int, float)):
            return [round(c, decimals) for c in coords]
        return [round_coords(c, decimals) for c in coords]
    return coords


def compress_feature(feature, decimals=4):
    """Compress a single feature by rounding its coordinates."""
    geom = feature.get('geometry')
    if geom and 'coordinates' in geom:
        geom['coordinates'] = round_coords(geom['coordinates'], decimals)
    return feature


def main():
    input_path = Path(__file__).parent.parent / 'client' / 'src' / 'assets' / 'world-map-1946.geojson'
    output_path = Path(__file__).parent.parent / 'client' / 'public' / 'world_map_1946.geojson'

    print('Loading world-map-1946.geojson...')
    with open(input_path, 'r', encoding='utf-8') as f:
        geojson = json.load(f)

    print(f'Compressing {len(geojson["features"])} features (rounding to 4 decimals)...')
    for feature in geojson['features']:
        compress_feature(feature)

    print(f'Saving compressed GeoJSON to {output_path}...')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, separators=(',', ':'))

    input_size = input_path.stat().st_size / (1024 * 1024)
    output_size = output_path.stat().st_size / (1024 * 1024)
    print(f'Input size: {input_size:.2f} MB')
    print(f'Output size: {output_size:.2f} MB')
    print(f'Compression: {(1 - output_size/input_size)*100:.1f}%')


if __name__ == '__main__':
    main()
