"""
Найти страны, не привязанные к континентам в continents_1946.json
"""

import json

with open('d:/Pax Historia LOCAL/client/src/assets/game_map.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Собираем все страны
countries = {}
for feat in data['features']:
    props = feat.get('properties', {})
    admin = props.get('admin', '')
    iso = props.get('adm0_a3', props.get('iso_a2', ''))
    if iso and iso not in ['-1', '-99', 'ATA']:
        if iso not in countries:
            countries[iso] = {'name': admin, 'adm1': 0}
        countries[iso]['adm1'] += 1

# Все коды из continents
with open('d:/Pax Historia LOCAL/scripts/continents_1946.json', 'r', encoding='utf-8') as f:
    cont = json.load(f)
all_continent_codes = set()
for c_data in cont['continents'].values():
    all_continent_codes.update(c_data['countries'])

# Микрогосударства, которые нужно добавить в Европу
europe_micro = ['GIB', 'MCO', 'SMR', 'LIE', 'IMN', 'JEY', 'GGY']

print("=== МИКРОГОСУДАРСТВА ДЛЯ ДОБАВЛЕНИЯ В ЕВРОПУ ===")
for iso in europe_micro:
    info = countries.get(iso)
    if info:
        print(f"  {iso}: {info['name']} ({info['adm1']} ADM1)")
    else:
        print(f"  {iso}: НЕ НАЙДЕНО")

print()
print("=== СТРАНЫ НЕ В КОНТИНЕНТАХ ===")
unassigned = {}
for iso, info in sorted(countries.items()):
    if iso not in all_continent_codes and len(iso) <= 3 and info['name']:
        unassigned[iso] = info
        print(f"  {iso}: {info['name']} ({info['adm1']} ADM1)")