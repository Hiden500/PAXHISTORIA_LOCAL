import json

with open('scripts/world-map-europe-1946.geojson', encoding='utf-8') as f:
    data = json.load(f)

print(f'Всего регионов в GeoJSON Европы: {len(data["features"])}')
print()

print('=== Параметры (ключи) в сгенерированном GeoJSON ===')
keys = set()
for feat in data['features']:
    keys.update(feat.get('properties', {}).keys())
for k in sorted(keys):
    print(f'  {k}')

print()
print('=== Параметр continent ===')
regions = {}
for feat in data['features']:
    props = feat.get('properties', {})
    region = props.get('continent', 'N/A')
    regions[region] = regions.get(region, 0) + 1
for r, cnt in sorted(regions.items(), key=lambda x: -x[1]):
    print(f'  {r}: {cnt}')

print()
print('=== Параметр owner ===')
owners = {}
for feat in data['features']:
    props = feat.get('properties', {})
    owner = props.get('owner', 'N/A')
    owners[owner] = owners.get(owner, 0) + 1
for o, cnt in sorted(owners.items(), key=lambda x: -x[1]):
    print(f'  {o}: {cnt}')