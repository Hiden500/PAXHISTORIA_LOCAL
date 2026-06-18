import json

# Load source gam_map
d = json.load(open('client/src/assets/gam_map.json', 'r', encoding='utf8'))

# Known mappings from historical_data.ts
known_isos = {
    'SUN','RUS','UKR','BLR','EST','LVA','LTU','MDA','GEO','ARM','AZE',
    'KAZ','UZB','TKM','KGZ','TJK',
    'USA','CAN','GBR','FRA','AUS','NZL','ZAF',
    'DEU','ITA','JPN',
    'CHN','TWN','HKG','MAC',
    'IND','BRA','MEX','ARG','ESP','PRT','NLD','BEL','CHE','AUT','HUN',
    'CZE','SVK','POL','YUG','GRC','TUR','BGR','ROU','NOR','SWE','DNK',
    'FIN','IRL','ISL','EGY','IRQ','IRN','SAU','AFG','PAK','BGD','MMR',
    'THA','VNM','KHM','LAO','MYS','SGP','IDN','PHL','KOR','PRK','MNG',
    'NPL','BTN','SYR','LBN','JOR','YEM','OMN','ARE','KWT','BHR','QAT',
    'LBY','TUN','DZA','MAR','SDN','ETH','SOM','KEN','UGA','TZA','NGA',
    'GHA','CIV','SEN','MLI','BFA','NER','TCD','CAF','COD','COG','GAB',
    'AGO','MOZ','ZWE','ZMB','MWI','BWA','NAM','LSO','SWZ','CUB','HTI',
    'DOM','GTM','BLZ','NIC','HND','SLV','CRI','PAN','COL','VEN','ECU',
    'PER','BOL','PRY','URY','CHL','JAM','TTO','LKA','MDV','MUS','LUX',
    'MCO','AND','SMR','LIE','MLT','VAT','BRN','HKG','MAC',
}

# Group by adm0_a3
by_iso = {}
for f in d['features']:
    iso = f['properties'].get('adm0_a3', '')
    if not iso:
        continue
    if iso not in by_iso:
        by_iso[iso] = {'count': 0, 'names': set()}
    by_iso[iso]['count'] += 1
    by_iso[iso]['names'].add(f['properties'].get('admin', '') or f['properties'].get('name', '') or '?')

# Find missing
missing = {k: v for k, v in by_iso.items() if k not in known_isos}
sorted_missing = sorted(missing.items(), key=lambda x: -x[1]['count'])

print(f"\n=== MISSING ISO CODES ({len(missing)} total, {sum(v['count'] for v in missing.values())} features) ===\n")
for iso, info in sorted_missing:
    names = ', '.join(sorted(info['names'])[:3])
    print(f"  {info['count']:4}  {iso:6}  {names}")

print(f"\n=== FOUND ISO CODES ({len(by_iso) - len(missing)} total) ===\n")
found = [f"'{iso}': 'XXX', // {list(info['names'])[0]}" for iso, info in sorted(by_iso.items()) if iso in known_isos]
for line in found[:10]:
    print(f"  {line}")
print(f"  ... {len(found)} total mapped")