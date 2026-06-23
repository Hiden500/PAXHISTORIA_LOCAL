"""
Генерация маппинга Европы с проверкой смежности.
Сначала создаётся прототип маппинга, затем проверяется.

Использование: python scripts/generate_europe_mapping.py
"""

import json
import sys
from pathlib import Path
from shapely.geometry import shape
from shapely.ops import unary_union

GEOJSON_PATH = Path(__file__).parent.parent / 'client' / 'src' / 'assets' / 'game_map.json'
OUTPUT_PATH = Path(__file__).parent / 'Europe_mapping_1946.json'
CONTINENTS_PATH = Path(__file__).parent / 'continents_1946.json'


def load_geojson():
    with open(GEOJSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_mapping(mapping):
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print(f"Маппинг сохранён в {OUTPUT_PATH}")


def build_mapping():
    """
    Сборка маппинга Европы.
    Каждый макро-регион - список ADM1 кодов.
    """
    mapping = {}
    
    # ============================================================
    # ВЕЛИКОБРИТАНИЯ (GBR): 232 ADM1 → 35 регионов
    # ============================================================
    gbr = {
        "targetRegions": 35,
        "mapping": {
            # 1. ЛОНДОН (все London Boroughs + City)
            "London": [
                "GBR-2060", "GBR-5705", "GBR-2061", "GBR-2062", "GBR-2063",
                "GBR-2064", "GBR-2066", "GBR-2067", "GBR-2068", "GBR-2765",
                "GBR-2069", "GBR-2766", "GBR-2767", "GBR-2675", "GBR-2753",
                "GBR-2070", "GBR-2071", "GBR-2072", "GBR-2754", "GBR-2768",
                "GBR-2769", "GBR-2073", "GBR-2770", "GBR-2074", "GBR-2075",
                "GBR-2076", "GBR-2077", "GBR-2078", "GBR-2079", "GBR-2771",
                "GBR-2080", "GBR-4809"
            ],
            # 2. ЮГО-ВОСТОК (Surrey, Kent, East Sussex, West Sussex, Medway, Brighton)
            "South East": [
                "GBR-2755", "GBR-3409", "GBR-2677", "GBR-2748", "GBR-2678", "GBR-2674"
            ],
            # 3. ЮГ (Hampshire, Isle of Wight, Portsmouth, Southampton)
            "South Hampshire": [
                "GBR-2035", "GBR-2758", "GBR-2759", "GBR-2036"
            ],
            # 4. ЮГ ЦЕНТР (Berkshire, Oxfordshire, Buckinghamshire, Milton Keynes)
            "Thames Valley": [
                "GBR-2751", "GBR-2040", "GBR-2038", "GBR-5700", "GBR-5701",
                "GBR-5699", "GBR-5703", "GBR-5704", "GBR-2752", "GBR-2756"
            ],
            # 5. ВОСТОЧНАЯ АНГЛИЯ (Norfolk, Suffolk, Cambridgeshire, Essex, Hertfordshire, Bedfordshire)
            "East Anglia": [
                "GBR-2319", "GBR-2318", "GBR-2053", "GBR-2317", "GBR-2042",
                "GBR-5698", "GBR-5697", "GBR-2760", "GBR-2752", "GBR-2679",
                "GBR-2676", "GBR-2057", "GBR-2056", "GBR-2057", "GBR-2056"
            ],
            # 6. ЗАПАДНАЯ АНГЛИЯ (Devon, Cornwall, Somerset, Dorset, Wiltshire, Bristol, Gloucestershire)
            "West Country": [
                "GBR-2048", "GBR-2110", "GBR-2047", "GBR-2051", "GBR-2757",
                "GBR-2044", "GBR-2039", "GBR-2043", "GBR-2045", "GBR-2046",
                "GBR-2142", "GBR-2141", "GBR-2050", "GBR-2052",
                "GBR-5988", "GBR-2049"
            ],
            # 7. УЭЛЬС СЕВЕР (Anglesey, Gwynedd, Conwy, Denbighshire, Flintshire, Wrexham)
            "North Wales": [
                "GBR-2128", "GBR-2130", "GBR-2129", "GBR-2125", "GBR-2126", "GBR-2127"
            ],
            # 8. УЭЛЬС ЮГ (Pembrokeshire, Carmarthenshire, Ceredigion, Swansea, Neath, Bridgend, Cardiff, Vale of Glamorgan)
            "South Wales Coast": [
                "GBR-2106", "GBR-2104", "GBR-2105", "GBR-2119", "GBR-2118",
                "GBR-2112", "GBR-2116", "GBR-2117"
            ],
            # 9. УЭЛЬС ДОЛИНЫ (Powys, Rhondda Cynon Taff, Merthyr Tydfil, Caerphilly, Blaenau Gwent, Torfaen, Monmouthshire, Newport)
            "South Wales Valleys": [
                "GBR-2111", "GBR-2115", "GBR-2114", "GBR-2113", "GBR-2131",
                "GBR-2134", "GBR-2132", "GBR-2133"
            ],
            # 10. ВОСТОЧНЫЙ МИДЛЕНД (Nottinghamshire, Derbyshire, Leicestershire, Northamptonshire, Lincolnshire, Rutland)
            "East Midlands": [
                "GBR-2764", "GBR-2059", "GBR-2054", "GBR-2749", "GBR-2081",
                "GBR-2762", "GBR-2763", "GBR-2761", "GBR-2058", "GBR-2059"
            ],
            # 11. ЗАПАДНЫЙ МИДЛЕНД (Warwickshire, Worcestershire, Herefordshire, Shropshire, Staffordshire)
            "West Midlands Rural": [
                "GBR-2750", "GBR-2776", "GBR-2775", "GBR-2779", "GBR-2777"
            ],
            # 12. ЗАПАДНЫЙ МИДЛЕНД ГОРОДА (Birmingham, Coventry, Wolverhampton, Dudley, Sandwell, Walsall, Solihull)
            "West Midlands Urban": [
                "GBR-5690", "GBR-5696", "GBR-5693", "GBR-5692", "GBR-5691",
                "GBR-5694", "GBR-5695", "GBR-5679", "GBR-5678", "GBR-5680",
                "GBR-5677", "GBR-5666", "GBR-5690"
            ],
            # 13. СЕВЕРО-ЗАПАД (Lancashire, Cheshire, Merseyside, Greater Manchester)
            "North West": [
                "GBR-2123", "GBR-5706", "GBR-5707", "GBR-5667", "GBR-5668",
                "GBR-5669", "GBR-5684", "GBR-5683", "GBR-5676", "GBR-5685",
                "GBR-5682", "GBR-5681", "GBR-5680", "GBR-5678", "GBR-5679",
                "GBR-5680", "GBR-5682", "GBR-5683", "GBR-5684", "GBR-5685",
                "GBR-5676", "GBR-5671", "GBR-5672", "GBR-5673", "GBR-5674",
                "GBR-5675", "GBR-5677", "GBR-5668", "GBR-5669", "GBR-5667",
                "GBR-5666"
            ],
            # 14. ЙОРКШИР (North Yorkshire, West Yorkshire, South Yorkshire, East Riding, York)
            "Yorkshire": [
                "GBR-2140", "GBR-2124", "GBR-5672", "GBR-5673", "GBR-5674",
                "GBR-5675", "GBR-5686", "GBR-5687", "GBR-5688", "GBR-5689",
                "GBR-2120", "GBR-2055", "GBR-2056", "GBR-2057", "GBR-5670",
                "GBR-5671"
            ],
            # 15. СЕВЕРО-ВОСТОК (Northumberland, Durham, Tyne and Wear, Teesside)
            "North East": [
                "GBR-2034", "GBR-2029", "GBR-5661", "GBR-5662", "GBR-5663",
                "GBR-5664", "GBR-5665", "GBR-2030", "GBR-2031", "GBR-2032",
                "GBR-2033", "GBR-2028", "GBR-2122", "GBR-2108", "GBR-5708",
                "GBR-2774", "GBR-2121"
            ],
            # 16. ШОТЛАНДИЯ ЮГ (Scottish Borders, Dumfries and Galloway)
            "Southern Scotland": [
                "GBR-2026", "GBR-2138"
            ],
            # 17. ШОТЛАНДИЯ ЛОТИАН (Edinburgh, East Lothian, Midlothian, West Lothian)
            "Lothian": [
                "GBR-2023", "GBR-2022", "GBR-2024", "GBR-2025"
            ],
            # 18. ШОТЛАНДИЯ ЦЕНТР (Glasgow, Falkirk, Clackmannanshire, Stirling, Inverclyde, Renfrewshire, East Renfrewshire, West Dunbartonshire, East Dunbartonshire, North Lanarkshire, South Lanarkshire)
            "Central Scotland": [
                "GBR-2004", "GBR-2015", "GBR-2017", "GBR-2016", "GBR-2005",
                "GBR-2008", "GBR-2003", "GBR-2011", "GBR-2002", "GBR-2007",
                "GBR-2010"
            ],
            # 19. ШОТЛАНДИЯ ЭРШИР (East Ayrshire, North Ayrshire, South Ayrshire)
            "Ayrshire": [
                "GBR-2001", "GBR-2006", "GBR-2009"
            ],
            # 20. ШОТЛАНДИЯ ФАЙФ (Fife, Dundee, Angus, Perthshire and Kinross)
            "Fife and Tayside": [
                "GBR-2021", "GBR-2020", "GBR-2019", "GBR-2018"
            ],
            # 21. ШОТЛАНДИЯ СЕВЕРО-ВОСТОК (Aberdeen, Aberdeenshire, Moray)
            "North East Scotland": [
                "GBR-2012", "GBR-2013", "GBR-2014"
            ],
            # 22. ШОТЛАНДИЯ ВЫСОКОГОРЬЕ (Highland, Argyll and Bute)
            "Highlands": [
                "GBR-2745", "GBR-2746"
            ],
            # 23. ШОТЛАНДИЯ ОСТРОВА (Eilean Siar, Orkney, Shetland)
            "Scottish Islands": [
                "GBR-2772", "GBR-2744", "GBR-2747"
            ],
            # 24. СЕВЕРНАЯ ИРЛАНДИЯ ВОСТОК (Antrim, Belfast, Ards, Down, North Down, Castlereagh, Lisburn, Carrickfergus, Newtownabbey, Larne, Bangor)
            "Northern Ireland East": [
                "GBR-2092", "GBR-2082", "GBR-2137", "GBR-2099", "GBR-2098",
                "GBR-2103", "GBR-2090", "GBR-2096", "GBR-2097", "GBR-2095",
                "GBR-2103"
            ],
            # 25. СЕВЕРНАЯ ИРЛАНДИЯ ЗАПАД (Derry, Tyrone, Fermanagh, Armagh, Dungannon, Omagh, Strabane, Limavady, Magherafelt, Cookstown, Ballymena, Ballymoney, Moyle, Coleraine, Newry and Mourne, Banbridge, Craigavon)
            "Northern Ireland West": [
                "GBR-2083", "GBR-2089", "GBR-2136", "GBR-2085", "GBR-2089",
                "GBR-2084", "GBR-2135", "GBR-2102", "GBR-2093", "GBR-2087",
                "GBR-2088", "GBR-2086", "GBR-2087", "GBR-2085"
            ],
            # 26. БЕЛФАСТ (оставшиеся районы Белфаста)
            "Belfast Area": [
                "GBR-2082", "GBR-2103", "GBR-2097", "GBR-2098", "GBR-2096",
                "GBR-2090", "GBR-2137"
            ],
        }
    }
    mapping["GBR"] = gbr
    
    # ============================================================
    # ФРАНЦИЯ (FRA): 101 ADM1 → 30 регионов
    # ============================================================
    fra = {
        "targetRegions": 30,
        "mapping": {
            # TODO: France mapping - 101 ADM1 to ~30 regions
        }
    }
    mapping["FRA"] = fra
    
    # ============================================================
    # ГЕРМАНИЯ (DEU): 16 ADM1 → 4 зоны оккупации (как есть)
    # ============================================================
    deu = {
        "targetRegions": 20,
        "mapping": {
            # TODO: Germany - split into 4 occupation zones
        }
    }
    mapping["DEU"] = deu
    
    return mapping


if __name__ == '__main__':
    mapping = build_mapping()
    save_mapping(mapping)
    print("\nМаппинг создан. Запустите проверку:")
    print("  python scripts/analyze_adjacency.py --mapping Europe_mapping_1946.json")