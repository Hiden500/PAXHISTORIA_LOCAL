"""
Умная генерация маппинга континента.
Алгоритм: связные компоненты + grouping по region.
"""
import json
import sys
from pathlib import Path
from collections import deque, defaultdict
import time

GEOJSON_PATH = Path(__file__).parent.parent / 'client' / 'src' / 'assets' / 'game_map.json'
NEIGHBOR_GRAPH_PATH = Path(__file__).parent / 'neighbor_graph_1946.json'
CONTINENTS_PATH = Path(__file__).parent / 'continents_1946.json'

REGION_BASED = {'BEL','BIH','ESP','FRA','HUN','IRL','ITA','LVA','PRT'}

RECOMMENDATIONS = {
    'Europe': {
        'ALB': 1, 'AND': 1, 'AUT': 5, 'BEL': 6, 'BGR': 8, 'BIH': 6,
        'BLR': 5, 'CHE': 8, 'CYP': 1, 'CZE': 7, 'DEU': 16, 'DNK': 5,
        'ESP': 12, 'EST': 4, 'FIN': 8, 'FRA': 30, 'GBR': 35, 'GGY': 1,
        'GIB': 1, 'GRC': 14, 'HRV': 6, 'HUN': 8, 'IMN': 1, 'IRL': 8,
        'ISL': 1, 'ITA': 15, 'JEY': 1, 'KOS': 1, 'LIE': 1, 'LTU': 4, 'LUX': 2, 'ALD': 1,
        'LVA': 5, 'MCO': 1, 'MDA': 4, 'MKD': 1, 'MLT': 1, 'MNE': 1,
        'NLD': 8, 'NOR': 8, 'POL': 10, 'PRT': 8, 'ROU': 10, 'RUS': 86,
        'SMR': 1, 'SRB': 8, 'SVK': 5, 'SVN': 5, 'SWE': 10, 'UKR': 12,
        'VAT': 1,
    },
    'Asia': {
        'CHN': 45, 'IND': 35, 'JPN': 12, 'IDN': 20, 'KOR': 17,
        'VNM': 12, 'THA': 12, 'TWN': 4, 'KHM': 5, 'LAO': 4,
        'MMR': 8, 'MYS': 8, 'IRN': 8, 'TUR': 15, 'SAU': 10,
        'IRQ': 9, 'SYR': 7, 'LBN': 5, 'JOR': 5, 'YEM': 5,
        'ISR': 6, 'OMN': 4, 'ARE': 4, 'QAT': 2, 'KWT': 2,
        'BHR': 2, 'AFG': 8, 'MNG': 6, 'NPL': 2, 'BTN': 1,
        'LKA': 1, 'BGD': 5, 'PAK': 8, 'KAZ': 8, 'KGZ': 4,
        'TJK': 4, 'TKM': 4, 'UZB': 6, 'GEO': 5, 'ARM': 4,
        'AZE': 6, 'TLS': 2, 'SGP': 1, 'PHL': 10, 'PRK': 8,
        'HKG': 1, 'MAC': 1, 'PSX': 1, 'CYN': 1,
    },
    'NorthAmerica': {
        'US': 55, 'CA': 12, 'MX': 12, 'CU': 7, 'GT': 6,
        'PA': 4, 'BZ': 2, 'SV': 3, 'HN': 5, 'NI': 5,
        'CR': 3, 'HT': 5, 'DO': 7, 'JM': 3, 'TT': 3,
        'BS': 5, 'BB': 1, 'GD': 1, 'LC': 1, 'VC': 1,
        'AG': 1, 'DM': 1, 'KN': 1, 'GRL': 3,
    },
    'SouthAmerica': {
        'BR': 22, 'AR': 11, 'CO': 13, 'PE': 11, 'VE': 11,
        'CL': 9, 'EC': 9, 'BO': 7, 'PY': 5, 'UY': 5,
        'GY': 3, 'SR': 2, 'GF': 1, 'FLK': 1,
    },
    'Africa': {
        'EG': 10, 'ZA': 7, 'DZ': 9, 'NG': 10, 'CD': 7,
        'ET': 9, 'KE': 5, 'TZ': 7, 'MA': 5, 'LY': 3,
        'SD': 7, 'UG': 9, 'SO': 3, 'TN': 5, 'GH': 3,
        'CI': 4, 'CM': 4, 'AO': 5, 'MZ': 5, 'ZM': 4,
        'ZW': 4, 'BW': 3, 'NA': 4, 'MW': 3, 'ML': 3,
        'NE': 3, 'TD': 4, 'BF': 3, 'GN': 3, 'SN': 3,
        'BJ': 3, 'TG': 2, 'SL': 2, 'LR': 3, 'MR': 3,
        'MG': 7, 'CG': 3, 'GA': 2, 'CF': 4, 'SS': 3,
        'ER': 2, 'DJ': 1, 'RW': 2, 'BI': 2, 'LS': 1,
        'SZ': 1, 'GM': 1, 'GW': 1, 'GQ': 1, 'ST': 1,
        'KM': 1, 'SC': 1, 'MU': 2, 'CV': 2, 'SHN': 1,
        'CPV': 2, 'SYC': 1, 'COM': 1,
    },
    'Oceania': {
        'AU': 7, 'PG': 9, 'NZ': 5, 'SB': 3, 'VU': 2,
        'NC': 2, 'FJ': 3, 'WS': 2, 'TO': 2, 'PF': 3,
        'FM': 4, 'MH': 2, 'PW': 2, 'KI': 2, 'NR': 1,
        'TV': 1, 'NU': 1,
    },
}


def load_data():
    with open(GEOJSON_PATH, 'r', encoding='utf-8') as f:
        geojson = json.load(f)
    with open(NEIGHBOR_GRAPH_PATH, 'r', encoding='utf-8') as f:
        neighbor_graph = json.load(f)
    with open(CONTINENTS_PATH, 'r', encoding='utf-8') as f:
        continents = json.load(f)
    return geojson, neighbor_graph, continents


def get_country_regions(geojson, iso_code):
    features = []
    for f in geojson['features']:
        props = f.get('properties', {})
        for key in ['iso_a2', 'adm0_a3', 'sov_a3']:
            if props.get(key) == iso_code:
                features.append(f)
                break
    return features


def get_iso_key(features):
    for f in features:
        props = f.get('properties', {})
        for key in ['adm0_a3', 'sov_a3']:
            code = props.get(key)
            if code and code not in ['-1', '-99', '']:
                return code
    return None


def get_connected_components(codes, graph):
    """Split codes into connected components using graph."""
    nodes = set(codes)
    visited = set()
    comps = []
    for node in codes:
        if node in visited:
            continue
        comp = []
        q = deque([node])
        while q:
            n = q.popleft()
            if n in visited:
                continue
            visited.add(n)
            comp.append(n)
            for nb in graph.get(n, []):
                if nb in nodes and nb not in visited:
                    q.append(nb)
        comps.append(comp)
    return comps


def split_subgraph(subgraph, target):
    """Split subgraph into target groups using recursive bisection."""
    all_nodes = list(subgraph.keys())
    total = len(all_nodes)
    if not all_nodes:
        return []
    if target >= total:
        return [[n] for n in all_nodes]
    if target <= 1:
        return [list(all_nodes)]
    
    comps = get_connected_components(all_nodes, subgraph)
    comps.sort(key=len, reverse=True)
    
    if len(comps) > target:
        return comps  # don't merge non-adjacent
    
    result = [list(c) for c in comps]
    max_iter = target * 2
    iter_count = 0
    
    while len(result) < target and iter_count < max_iter:
        iter_count += 1
        max_idx = max(range(len(result)), key=lambda i: len(result[i]))
        comp = result[max_idx]
        if len(comp) <= 1:
            break
        
        first = comp[0]
        dist1 = {first: 0}
        q = deque([first])
        while q:
            n = q.popleft()
            for nb in subgraph.get(n, []):
                if nb in comp and nb not in dist1:
                    dist1[nb] = dist1[n] + 1
                    q.append(nb)
        
        if len(dist1) <= 1:
            mid = len(comp) // 2
            g1, g2 = comp[:mid], comp[mid:]
        else:
            far1 = max(dist1.items(), key=lambda x: x[1])[0]
            dist2 = {far1: 0}
            q = deque([far1])
            while q:
                n = q.popleft()
                for nb in subgraph.get(n, []):
                    if nb in comp and nb not in dist2:
                        dist2[nb] = dist2[n] + 1
                        q.append(nb)
            far2 = max(dist2.items(), key=lambda x: x[1])[0]
            
            d1, d2 = {far1: 0}, {far2: 0}
            q1, q2 = deque([far1]), deque([far2])
            while q1 or q2:
                if q1:
                    n1 = q1.popleft()
                    for nb in subgraph.get(n1, []):
                        if nb in comp and nb not in d1:
                            d1[nb] = d1[n1] + 1
                            q1.append(nb)
                if q2:
                    n2 = q2.popleft()
                    for nb in subgraph.get(n2, []):
                        if nb in comp and nb not in d2:
                            d2[nb] = d2[n2] + 1
                            q2.append(nb)
            
            g1, g2 = [], []
            for node in comp:
                if d1.get(node, 1000) <= d2.get(node, 1000):
                    g1.append(node)
                else:
                    g2.append(node)
            if not g1 or not g2:
                mid = len(comp) // 2
                g1, g2 = comp[:mid], comp[mid:]
        
        result[max_idx] = g1
        result.append(g2)
    return result


def verify_mapping(mapping, neighbor_graph):
    print("\n=== ПРОВЕРКА ===")
    all_ok = True
    total = 0
    for iso, data in mapping.items():
        sg = None
        for k in neighbor_graph:
            if iso == k or (len(k) >= 3 and k[:3] == iso):
                sg = neighbor_graph.get(k)
                break
        if not sg: sg = {}
        adm1_set = set()
        for name, adm1_list in data['mapping'].items():
            total += 1
            for code in adm1_list:
                if code in adm1_set:
                    print(f"  ! {iso}: дубликат {code}")
                    all_ok = False
                adm1_set.add(code)
            if len(adm1_list) > 1:
                comps = get_connected_components(adm1_list, sg)
                if len(comps) > 1:
                    print(f"  ! {iso}/{name}: несмежные")
                    all_ok = False
    if all_ok: print(f"  V {total} регионов OK")
    return all_ok, total


def show_country(mapping, iso, geojson):
    if iso not in mapping:
        print(f"{iso} не найдена")
        return
    data = mapping[iso]
    print(f"\n=== {iso} ({len(data['mapping'])} рег.) ===")
    adm1_names = {}
    for f in geojson['features']:
        props = f.get('properties', {})
        code = props.get('adm1_code', '')
        if code: adm1_names[code] = props.get('name', code)
    for name, adm1_list in data['mapping'].items():
        names = [adm1_names.get(c, c) for c in adm1_list]
        print(f"  {name} ({len(adm1_list)}): {', '.join(names)}")


def generate_mapping(geojson, neighbor_graph, continent_data, recommendations):
    continent_countries = continent_data['countries']
    print(f"Стран: {len(continent_countries)}")
    
    mapping = {}
    total_adm1 = 0
    total_result = 0
    t_start = time.time()
    
    for i, iso in enumerate(sorted(continent_countries), 1):
        features = get_country_regions(geojson, iso)
        if not features: continue
        
        admin_name = features[0]['properties'].get('admin', iso)
        adm1_codes = [f['properties'].get('adm1_code', '') for f in features]
        adm1_codes = [c for c in adm1_codes if c]
        if not adm1_codes: continue
        
        total_adm1 += len(adm1_codes)
        iso_key = get_iso_key(features) or iso
        country_graph = neighbor_graph.get(iso_key, neighbor_graph.get(iso, {}))
        
        target = recommendations.get(iso)
        target_regs = min(target, len(adm1_codes)) if target else (len(adm1_codes) if len(adm1_codes) <= 3 else max(2, len(adm1_codes)//5))
        
        named = {}
        
        if iso in REGION_BASED:
            # Группировка по region: ADM1 с одинаковым region → макро-регион.
            # Разбиваем каждый region на связные компоненты (острова/анклавы).
            # ADM1 без region → каждый как отдельный регион.
            region_groups = defaultdict(list)
            for f in features:
                code = f['properties'].get('adm1_code', '')
                if code:
                    r = f['properties'].get('region', '') or None
                    if r:
                        region_groups[r].append(code)
                    else:
                        named[code] = [code]
            
            for r_name, r_codes in region_groups.items():
                comps = get_connected_components(r_codes, country_graph)
                for j, comp in enumerate(comps):
                    key = f"{r_name}_{j+1}" if len(comps) > 1 else r_name
                    named[key] = comp
        
        elif iso == 'GBR':
            london_codes = []
            other_codes = []
            for f in features:
                code = f['properties'].get('adm1_code', '')
                type_ = f['properties'].get('type', '')
                if code and ('London Borough' in type_ or 'City Corporation' in type_ or 'London Borough' in type_):
                    london_codes.append(code)
                elif code:
                    other_codes.append(code)
            
            named = {"London": london_codes} if london_codes else {}
            remaining = max(1, target_regs - len(named))
            subg = {c: [n for n in country_graph.get(c, []) if n in other_codes] for c in other_codes}
            if subg:
                groups = split_subgraph(subg, remaining)
                for j, g in enumerate(groups):
                    named[f"Region_{j+1}"] = g
        
        else:
            subg = {c: [n for n in country_graph.get(c, []) if n in adm1_codes] for c in adm1_codes}
            if subg:
                groups = split_subgraph(subg, target_regs)
                named = {f"Region_{j+1}": g for j, g in enumerate(groups)}
            else:
                named = {f"Region_{j+1}": [c] for j, c in enumerate(adm1_codes)}
        
        mapping[iso] = {"targetRegions": target_regs, "mapping": named}
        total_result += len(named)
        
        sizes = [len(v) for v in named.values()]
        ok = "V" if len(named) == target_regs else f"! {len(named)}"
        elapsed = time.time() - t_start
        print(f"  [{i}/{len(continent_countries)}] {iso} ({admin_name}): {len(adm1_codes):>4} -> {len(named):>3} рег. "
              f"(цель: {target_regs:>2}, {min(sizes)}-{max(sizes)}) {ok} ({elapsed:.1f}s)")
    
    print(f"\n  ИТОГО: {total_adm1} -> {total_result} за {time.time()-t_start:.1f}s")
    return mapping


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Использование: python scripts/generate_continent_mapping_smart.py <continent> [--verify] [--show ISO]")
        sys.exit(1)
    
    continent_name = sys.argv[1]
    do_verify = '--verify' in sys.argv
    show_iso = None
    if '--show' in sys.argv:
        idx = sys.argv.index('--show')
        if idx + 1 < len(sys.argv):
            show_iso = sys.argv[idx + 1]
    
    print(f"\n=== {continent_name.upper()} ===\n")
    geojson, neighbor_graph, continents = load_data()
    if continent_name not in continents['continents']:
        print(f"Континент {continent_name} не найден"); sys.exit(1)
    continent_data = continents['continents'][continent_name]
    recommendations = RECOMMENDATIONS.get(continent_name, {})
    mapping = generate_mapping(geojson, neighbor_graph, continent_data, recommendations)
    output_path = Path(__file__).parent / f'{continent_name}_mapping_1946.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print(f"\nСохранено: {output_path}")
    if do_verify: verify_mapping(mapping, neighbor_graph)
    if show_iso: show_country(mapping, show_iso, geojson)