"""
Скрипт для просмотра ADM1 регионов конкретной страны или всех стран континента.
Использование:
  python scripts/list_adm1_by_country.py --country FRA
  python scripts/list_adm1_by_country.py --continent Europe
"""

import json
import sys
from pathlib import Path

GEOJSON_PATH = Path(__file__).parent.parent / 'client' / 'src' / 'assets' / 'game_map.json'
CONTINENTS_PATH = Path(__file__).parent / 'continents_1946.json'


def load_geojson():
    with open(GEOJSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_continents():
    with open(CONTINENTS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def list_country_regions(iso_code: str):
    """Показать все ADM1 регионы для указанной страны."""
    data = load_geojson()
    
    # Ищем по iso_a2, adm0_a3, или sov_a3
    features = []
    for f in data['features']:
        props = f.get('properties', {})
        if (props.get('iso_a2') == iso_code or 
            props.get('adm0_a3') == iso_code or
            props.get('sov_a3') == iso_code):
            features.append(f)
    
    if not features:
        print(f'Страна {iso_code} не найдена или не имеет ADM1 регионов')
        return
    
    print(f'Страна: {features[0]["properties"].get("admin", iso_code)} ({iso_code})')
    print(f'Всего ADM1 регионов: {len(features)}')
    print()
    print(f'{"#":>4} | {"ADM1 Code":<15} | {"Name":<40} | {"Type":<20}')
    print('-' * 85)
    
    for i, f in enumerate(sorted(features, key=lambda x: x['properties'].get('name', '')), 1):
        props = f['properties']
        print(f'{i:>4} | {props.get("adm1_code", "N/A"):<15} | {props.get("name", "N/A"):<40} | {props.get("type", "N/A"):<20}')


def list_continent_countries(continent_name: str):
    """Показать сводку по всем странам континента."""
    continents = load_continents()
    
    if continent_name not in continents['continents']:
        print(f'Континент {continent_name} не найден')
        print(f'Доступные: {list(continents["continents"].keys())}')
        return
    
    countries = continents['continents'][continent_name]['countries']
    data = load_geojson()
    
    print(f'Континент: {continent_name}')
    print(f'Всего стран в континенте: {len(countries)}')
    print()
    print(f'{"ISO":<6} | {"Страна":<30} | {"ADM1":>5} | {"Площадь (км²)":>15}')
    print('-' * 60)
    
    total_regions = 0
    country_data = {}
    
    for iso in countries:
        features = []
        for f in data['features']:
            props = f.get('properties', {})
            if (props.get('iso_a2') == iso or 
                props.get('adm0_a3') == iso or
                props.get('sov_a3') == iso):
                features.append(f)
        
        if features:
            admin_name = features[0]['properties'].get('admin', iso)
            country_data[iso] = features
            total_regions += len(features)
            # Грубая оценка площади через bounding box
            bbox_area = sum(
                abs(f['geometry']['coordinates'][0][0][0] - f['geometry']['coordinates'][0][2][0]) * 
                abs(f['geometry']['coordinates'][0][0][1] - f['geometry']['coordinates'][0][2][1]) * 12300
                for f in features 
                if f['geometry']['type'] == 'Polygon'
            )
            print(f'{iso:<6} | {admin_name:<30} | {len(features):>5} | {int(bbox_area):>15,}')
    
    print('-' * 60)
    print(f'{"TOTAL":<6} | {"":<30} | {total_regions:>5} |')


def show_recommendations(continent_name: str):
    """Показать текущее количество ADM1 и рекомендованное количество регионов из документа."""
    
    # Рекомендации из world-map-1946-generation-a61393.md (из документа)
    recommendations = {
        'Europe': {
            'RUS': ('СССР', '80–100'),
            'USA': ('США', '50–60'),  # не в Европе
            'GBR': ('Великобритания', '30–40'),
            'FRA': ('Франция', '25–35'),
            'DEU': ('Германия (4 зоны оккупации)', '20–25'),
            'ITA': ('Италия', '12–15'),
            'ESP': ('Испания', '10–12'),
            'TUR': ('Турция', '8–10'),  # частично в Европе
            'YUG': ('Югославия', '6–8'),
            'POL': ('Польша', '8–10'),
            'NLD': ('Нидерланды', '8–10 (с колониями)'),
            'BEL': ('Бельгия', '4–6 (с колониями)'),
            'GRC': ('Греция', 'оставить без изменений'),
            'MLT': ('Мальта', '1'),
            'CYP': ('Кипр', '1'),
        },
        'Asia': {
            'CHN': ('Китай', '40–50'),
            'IND': ('Индия', '35–40'),
            'JPN': ('Япония', '10–15'),
            'KOR': ('Корея (обе)', '15–20'),
            'IDN': ('Индонезия', '18–22'),
            'VNM': ('Вьетнам', '12–15'),
            'THA': ('Таиланд', '10–12'),
            'TWN': ('Тайвань', '3–4'),
            'BTN': ('Бутан', '1'),
            'NPL': ('Непал', '1'),
            'LKA': ('Шри-Ланка', '1'),
            'KHM': ('Камбоджа', '4–6'),
            'LAO': ('Лаос', '3–4'),
            'MMR': ('Мьянма/Бирма', '6–8'),
            'MYS': ('Малайзия', '6–8'),
            'IRN': ('Иран', '6–8'),
            'TUR': ('Турция', '12–15'),
        },
        'NorthAmerica': {
            'US': ('США', '50–60'),
            'CA': ('Канада', '10–15'),
            'MX': ('Мексика', '12–15'),
            'CU': ('Куба', '6–8'),
            'GT': ('Гватемала', '6–8'),
            'PA': ('Панама', '3–4'),
        },
        'SouthAmerica': {
            'BR': ('Бразилия', '20–25'),
            'AR': ('Аргентина', '10–12'),
            'CO': ('Колумбия', '12–15'),
            'PE': ('Перу', '10–12'),
            'VE': ('Венесуэла', '10–12'),
            'CL': ('Чили', '8–10'),
            'EC': ('Эквадор', '8–10'),
            'BO': ('Боливия', '6–8'),
            'PY': ('Парагвай', '4–6'),
            'UY': ('Уругвай', '4–6'),
        },
        'Africa': {
            'EG': ('Египет', '8–12'),
            'ZA': ('ЮАР', '6–8'),
            'DZ': ('Алжир', '8–10'),
            'NG': ('Нигерия', '8–12'),
            'CD': ('Конго (бельг.)', '6–8'),
            'ET': ('Эфиопия', '8–10'),
            'KE': ('Кения', '4–6'),
            'TZ': ('Танзания', '6–8'),
            'MA': ('Марокко', '4–6'),
            'LY': ('Ливия', '3–4'),
            'SD': ('Судан', '6–8'),
            'UG': ('Уганда', '8–10'),
            'SO': ('Сомали', '3–4'),
        },
        'Oceania': {
            'AU': ('Австралия', '6–8'),
            'PG': ('Папуа-Новая Гвинея', '8–10'),
            'SB': ('Соломоновы Острова', '3–4'),
            'VU': ('Вануату', '2–3'),
            'NC': ('Новая Каледония', '1–2'),
            'FJ': ('Фиджи', '2–3'),
            'WS': ('Самоа', '2–3'),
            'TO': ('Тонга', '1–2'),
            'PF': ('Французская Полинезия', '2–3'),
        },
    }
    
    # Ближний Восток
    middle_east = {
        'IL': ('Израиль/Палестина', '6–8'),
        'SY': ('Сирия', '6–8'),
        'LB': ('Ливан', '4–6'),
        'JO': ('Иордания', '4–6'),
        'IQ': ('Ирак', '8–10'),
        'SA': ('Саудовская Аравия', '8–12'),
        'YE': ('Йемен', '4–6'),
    }
    
    continents = load_continents()
    if continent_name not in continents['continents']:
        print(f'Континент {continent_name} не найден')
        return
    
    countries = continents['continents'][continent_name]['countries']
    data = load_geojson()
    
    print(f'\n=== РЕКОМЕНДАЦИИ ДЛЯ {continent_name.upper()} ===')
    print()
    print(f'{"ISO":<6} | {"Страна":<30} | {"ADM1":>5} | {"Рекомендация":<20}')
    print('-' * 65)
    
    total_adm1 = 0
    total_target_min = 0
    total_target_max = 0
    
    for iso in sorted(countries):
        features = []
        for f in data['features']:
            props = f.get('properties', {})
            if (props.get('iso_a2') == iso or 
                props.get('adm0_a3') == iso or
                props.get('sov_a3') == iso):
                features.append(f)
        
        if not features:
            continue
        
        admin_name = features[0]['properties'].get('admin', iso)
        adm1_count = len(features)
        total_adm1 += adm1_count
        
        # Ищем рекомендацию
        rec = None
        for lookup_iso in [iso, features[0]['properties'].get('adm0_a3', ''), features[0]['properties'].get('sov_a3', '')]:
            if lookup_iso in recommendations.get(continent_name, {}):
                rec = recommendations[continent_name][lookup_iso]
                break
            if lookup_iso in middle_east:
                rec = middle_east[lookup_iso]
                break
        
        if rec:
            name, target = rec
            print(f'{iso:<6} | {admin_name:<30} | {adm1_count:>5} | {target:<20}')
            # Парсим диапазон - извлекаем только числа
            import re
            nums = re.findall(r'\d+', target)
            if len(nums) == 2:
                total_target_min += int(nums[0])
                total_target_max += int(nums[1])
            elif len(nums) == 1:
                n = int(nums[0])
                total_target_min += n
                total_target_max += n
            elif 'оставить' in target:
                total_target_min += adm1_count
                total_target_max += adm1_count
        else:
            print(f'{iso:<6} | {admin_name:<30} | {adm1_count:>5} | {"не указана":<20}')
    
    print('-' * 65)
    print(f'{"TOTAL":<6} | {"":<30} | {total_adm1:>5} | {total_target_min}–{total_target_max:<17}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Использование:')
        print('  python scripts/list_adm1_by_country.py --country ISO_CODE')
        print('  python scripts/list_adm1_by_country.py --continent CONTINENT')
        print('  python scripts/list_adm1_by_country.py --recommend CONTINENT')
        print()
        print('Примеры:')
        print('  python scripts/list_adm1_by_country.py --country FRA')
        print('  python scripts/list_adm1_by_country.py --continent Europe')
        print('  python scripts/list_adm1_by_country.py --recommend Europe')
        sys.exit(1)
    
    if sys.argv[1] == '--country' and len(sys.argv) > 2:
        list_country_regions(sys.argv[2])
    elif sys.argv[1] == '--continent' and len(sys.argv) > 2:
        list_continent_countries(sys.argv[2])
    elif sys.argv[1] == '--recommend' and len(sys.argv) > 2:
        show_recommendations(sys.argv[2])
    else:
        print('Неверные аргументы')