import json
from collections import defaultdict

with open('client/src/assets/game_map.json', encoding='utf-8') as f:
    data = json.load(f)

europe = ['ALB','AND','AUT','BEL','BGR','BLR','BIH','CHE','CYP','CZE','DEU','DNK','ESP','EST','FIN','FRA','GBR','GGY','GIB','GRC','HRV','HUN','IMN','IRL','ISL','ITA','JEY','KOS','LIE','LTU','LUX','LVA','MCO','MDA','MKD','MLT','MNE','NLD','NOR','POL','PRT','ROU','RUS','SMR','SRB','SVK','SVN','SWE','UKR','VAT','ALD']

by_country = defaultdict(lambda: defaultdict(int))
total_adm1 = defaultdict(int)

for f in data['features']:
    props = f.get('properties', {})
    iso = props.get('adm0_a3', '')
    if iso in europe:
        r = props.get('region', '') or '(no region)'
        by_country[iso][r] += 1
        total_adm1[iso] += 1

print('=== Распределение region по странам Европы ===')
print()
for iso in sorted(by_country.keys()):
    regions = by_country[iso]
    admin_name = next((f['properties'].get('admin','') for f in data['features'] if f['properties'].get('adm0_a3')==iso), iso)
    print(f'--- {iso} ({admin_name}) [{total_adm1[iso]} ADM1] ---')
    for r, cnt in sorted(regions.items(), key=lambda x: -x[1]):
        marker = ' <-- merge candidate' if cnt > 4 else ''
        print(f'    {r}: {cnt}{marker}')
    print()

print(f'Всего стран: {len(by_country)}')
print(f'Всего ADM1: {sum(total_adm1.values())}')