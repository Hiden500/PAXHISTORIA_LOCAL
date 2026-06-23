"""
Проверка смежности ADM1 регионов внутри одной страны.
Используется для верификации маппинга.

Использование: python scripts/analyze_adjacency.py --country GBR
"""

import json
import sys
from pathlib import Path
from shapely.geometry import shape
from shapely.ops import unary_union

GEOJSON_PATH = Path(__file__).parent.parent / 'client' / 'src' / 'assets' / 'game_map.json'


def load_geojson():
    with open(GEOJSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_country_regions(iso_code):
    """Получить все ADM1 регионы страны."""
    data = load_geojson()
    features = []
    for f in data['features']:
        props = f.get('properties', {})
        if (props.get('iso_a2') == iso_code or 
            props.get('adm0_a3') == iso_code or
            props.get('sov_a3') == iso_code):
            features.append(f)
    return features


def check_group_adjacency(adm1_codes):
    """
    Проверить, что все ADM1 регионы в группе смежны друг с другом
    (образуют связный граф).
    """
    data = load_geojson()
    
    # Собираем геометрии
    geom_map = {}
    for f in data['features']:
        props = f.get('properties', {})
        code = props.get('adm1_code', '')
        if code in adm1_codes:
            try:
                geom_map[code] = shape(f['geometry'])
            except:
                pass
    
    if len(geom_map) < len(adm1_codes):
        missing = set(adm1_codes) - set(geom_map.keys())
        return False, f"Не найдены ADM1: {missing}"
    
    if len(geom_map) <= 1:
        return True, "Одиночный регион"
    
    # Строим граф смежности
    codes_list = list(geom_map.keys())
    adj = {i: set() for i in range(len(codes_list))}
    
    for i in range(len(codes_list)):
        for j in range(i+1, len(codes_list)):
            try:
                if geom_map[codes_list[i]].touches(geom_map[codes_list[j]]):
                    adj[i].add(j)
                    adj[j].add(i)
            except:
                pass
    
    # DFS проверка связности
    visited = set()
    stack = [0]
    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        for nb in adj[node]:
            if nb not in visited:
                stack.append(nb)
    
    if len(visited) != len(codes_list):
        disconnected = [codes_list[i] for i in range(len(codes_list)) if i not in visited]
        return False, f"Несмежные регионы: {disconnected}"
    
    return True, "OK"


def analyze_mapping(mapping_country):
    """Проверить весь маппинг для страны."""
    print(f"\n=== ПРОВЕРКА МАППИНГА ===")
    print(f"Всего макро-регионов: {len(mapping_country['mapping'])}")
    print(f"Всего ADM1: {sum(len(v) for v in mapping_country['mapping'].values())}")
    print()
    
    all_ok = True
    for region_name, adm1_list in mapping_country['mapping'].items():
        ok, msg = check_group_adjacency(adm1_list)
        status = "✓" if ok else "✗"
        if not ok:
            all_ok = False
        print(f"  {status} {region_name}: {len(adm1_list)} ADM1 - {msg}")
    
    # Проверка, что все ADM1 уникальны
    all_adm1 = []
    for v in mapping_country['mapping'].values():
        all_adm1.extend(v)
    if len(all_adm1) != len(set(all_adm1)):
        from collections import Counter
        dups = [k for k, v in Counter(all_adm1).items() if v > 1]
        print(f"\n  ✗ ОБНАРУЖЕНЫ ДУБЛИКАТЫ: {dups}")
        all_ok = False
    
    if all_ok:
        print(f"\n✓ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ")
    else:
        print(f"\n✗ ЕСТЬ ПРОБЛЕМЫ")
    
    return all_ok


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Использование:")
        print("  python scripts/analyze_adjacency.py --mapping Europe_mapping_1946.json")
        print("  python scripts/analyze_adjacency.py --check GBR ADM1_CODE1 ADM1_CODE2 ...")
        sys.exit(1)
    
    if sys.argv[1] == '--mapping' and len(sys.argv) > 2:
        mapping_path = Path(__file__).parent / sys.argv[2]
        with open(mapping_path, 'r', encoding='utf-8') as f:
            mapping = json.load(f)
        
        # Проверяем каждую страну
        results = {}
        for country, data in mapping.items():
            print(f"\n{'='*60}")
            print(f"Страна: {country} (цель: {data.get('targetRegions', '?')} регионов)")
            ok = analyze_mapping(data)
            results[country] = ok
        
        print(f"\n{'='*60}")
        print(f"ИТОГО: {sum(1 for v in results.values() if v)}/{len(results)} стран OK")
    else:
        print("Неверные аргументы")