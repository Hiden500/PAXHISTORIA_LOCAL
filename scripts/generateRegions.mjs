/**
 * Скрипт генерации игровых регионов из GeoJSON
 * Загружает gam_map.json, применяет фильтры и генерирует regions.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Пути к файлам
const GAM_MAP_PATH = path.join(__dirname, '../client/src/assets/gam_map.json');
const OUTPUT_PATH = path.join(__dirname, '../data/scenarios/1946/regions.json');

/**
 * Загружает GeoJSON файл
 */
function loadGeoJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Сохраняет регионы в JSON файл
 */
function saveRegions(regions, filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(regions, null, 2), 'utf-8');
  console.log(`Регионы сохранены в ${filePath}`);
}

/**
 * Сохраняет GeoJSON для карты
 */
function saveGeoJson(geoJson, filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(geoJson), 'utf-8');
  console.log(`GeoJSON сохранён в ${filePath}`);
}

/**
 * Объединяет регионы страны в один
 */
function mergeCountryRegions(geoJson, isoA3) {
  const countryFeatures = geoJson.features.filter(feature => {
    const props = feature.properties || {};
    return props.adm0_a3 === isoA3;
  });

  if (countryFeatures.length === 0) return null;

  // Объединяем геометрии всех регионов страны
  const mergedGeometry = {
    type: 'MultiPolygon',
    coordinates: countryFeatures.flatMap(feature => {
      const geom = feature.geometry;
      if (geom.type === 'Polygon') {
        return [geom.coordinates];
      } else if (geom.type === 'MultiPolygon') {
        return geom.coordinates;
      }
      return [];
    })
  };

  // Создаём объединённый регион
  const firstFeature = countryFeatures[0];
  const mergedFeature = {
    ...firstFeature,
    geometry: mergedGeometry,
    properties: {
      ...firstFeature.properties,
      adm1_code: `${isoA3}-MERGED`,
      name: firstFeature.properties.admin || firstFeature.properties.name,
    }
  };

  return mergedFeature;
}

/**
 * Фильтрует GeoJSON и объединяет регионы маленьких стран
 */
function filterGeoJson(geoJson) {
  const SMALL_COUNTRIES = new Set([
    'SVN', // Словения
    'MKD', // Македония
    'XKX', // Косово
    'MDA', // Молдова
    'BFA', // Буркина Фасо
    'GTM', // Гватемала
  ]);

  // Регионы для объединения (кроме маленьких стран)
  const REGIONS_TO_MERGE = new Set([
    'HKG', // Гонконг
  ]);

  const filteredFeatures = [];
  const processedCountries = new Set();

  for (const feature of geoJson.features) {
    const props = feature.properties || {};
    const adm0_a3 = props.adm0_a3 || '';

    // Если это маленькая страна и ещё не обработана - объединяем
    if (SMALL_COUNTRIES.has(adm0_a3) && !processedCountries.has(adm0_a3)) {
      const merged = mergeCountryRegions(geoJson, adm0_a3);
      if (merged) {
        filteredFeatures.push(merged);
        processedCountries.add(adm0_a3);
      }
    } else if (REGIONS_TO_MERGE.has(adm0_a3) && !processedCountries.has(adm0_a3)) {
      // Объединяем Гонконг и другие специальные регионы
      const merged = mergeCountryRegions(geoJson, adm0_a3);
      if (merged) {
        filteredFeatures.push(merged);
        processedCountries.add(adm0_a3);
      }
    } else if (!SMALL_COUNTRIES.has(adm0_a3) && !REGIONS_TO_MERGE.has(adm0_a3)) {
      // Не маленькая страна и не регион для объединения - добавляем как есть
      filteredFeatures.push(feature);
    }
  }

  return {
    type: 'FeatureCollection',
    features: filteredFeatures,
  };
}

/**
 * Маппинг ISO кодов на игровые ID стран
 */
const ISO_TO_COUNTRY_ID = {
  'SUN': 'USSR',
  'RUS': 'USSR',
  'UKR': 'USSR',
  'BLR': 'USSR',
  'GEO': 'USSR',
  'ARM': 'USSR',
  'AZE': 'USSR',
  'KAZ': 'USSR',
  'UZB': 'USSR',
  'TKM': 'USSR',
  'KGZ': 'USSR',
  'TJK': 'USSR',
  'EST': 'USSR',
  'LVA': 'USSR',
  'LTU': 'USSR',
  'MDA': 'USSR',
  'USA': 'USA',
  'GBR': 'UK',
  'FRA': 'FRA',
  'DEU': 'Germany', // Базовый маппинг, переопределяется историческим
  'ITA': 'Italy',
  'CHN': 'China',
  'TWN': 'Taiwan',
  'HKG': 'Taiwan', // Гонконг - Гоминьдан в 1946
};

/**
 * Исторический маппинг конкретных регионов на страны (1946)
 */
const HISTORICAL_REGION_COUNTRY_MAP = {
  // Германия - зоны оккупации (новые государства)
  'DEU-1601': 'DEU-USSR',     // Sachsen - Советская зона
  'DEU-1600': 'DEU-USSR',     // Sachsen-Anhalt - Советская зона
  'DEU-3487': 'DEU-USSR',     // Brandenburg - Советская зона
  'DEU-3488': 'DEU-USSR',     // Mecklenburg-Vorpommern - Советская зона
  'DEU-1577': 'DEU-USSR',     // Thüringen - Советская зона

  'DEU-1591': 'DEU-USA',      // Bayern - Американская зона
  'DEU-1574': 'DEU-USA',      // Hessen - Американская зона
  'DEU-1575': 'DEU-USA',      // Bremen - Американская зона
  'DEU-1573': 'DEU-USA',      // Baden-Württemberg - Американская зона

  'DEU-1576': 'DEU-UK',       // Niedersachsen - Британская зона
  'DEU-1572': 'DEU-UK',       // Nordrhein-Westfalen - Британская зона
  'DEU-1579': 'DEU-UK',       // Schleswig-Holstein - Британская зона
  'DEU-1578': 'DEU-UK',       // Hamburg - Британская зона

  'DEU-1580': 'DEU-FRA',      // Rheinland-Pfalz - Французская зона
  'DEU-1581': 'DEU-FRA',      // Saarland - Французская зона

  // Берлин - 4 зоны оккупации (создаём 4 виртуальных региона)
  'DEU-1599': 'DEU-USSR',     // Berlin - советский сектор (основной)

  // Китай - гражданская война
  'CHN-1839': 'China',
  'CHN-1828': 'China',
  'CHN-1813': 'China',
  'CHN-1838': 'China',
  'CHN-1811': 'China',
  'CHN-1805': 'China',
  'CHN-1804': 'China',
  'CHN-1803': 'China',
  'CHN-1150': 'China',
  'CHN-1814': 'Taiwan',
  'CHN-1816': 'Taiwan',
  'CHN-1155': 'Taiwan',
  'CHN-1819': 'Taiwan',
  'CHN-1818': 'Taiwan',
  'CHN-1820': 'Taiwan',
  'CHN-1178': 'Taiwan',
  'CHN-1179': 'Taiwan',
  'CHN-1812': 'Taiwan',
  'CHN-1807': 'Taiwan',
  'CHN-1808': 'Taiwan',
  'CHN-1817': 'Taiwan',
  'CHN-1180': 'Taiwan',
  'CHN-1152': 'Taiwan',
  'CHN-1775': 'Taiwan',
  'CHN-1810': 'Taiwan',
  'CHN-1153': 'Taiwan',
  'CHN-1809': 'Taiwan',
  'CHN-1154': 'Taiwan',
  'CHN-1756': 'Taiwan',
  'CHN-1662': 'Taiwan',
  'CHN-1151': 'Taiwan',
};

/**
 * Переводы названий регионов на русский
 */
const REGION_TRANSLATIONS = {
  'DEU-1601': 'Саксония',
  'DEU-1600': 'Саксония-Анхальт',
  'DEU-3487': 'Бранденбург',
  'DEU-3488': 'Мекленбург-Передняя Померания',
  'DEU-1577': 'Тюрингия',
  'DEU-1591': 'Бавария',
  'DEU-1574': 'Гессен',
  'DEU-1575': 'Бремен',
  'DEU-1573': 'Баден-Вюртемберг',
  'DEU-1576': 'Нижняя Саксония',
  'DEU-1572': 'Северный Рейн-Вестфалия',
  'DEU-1579': 'Шлезвиг-Гольштейн',
  'DEU-1578': 'Гамбург',
  'DEU-1580': 'Рейнланд-Пфальц',
  'DEU-1581': 'Саар',
  'DEU-1599': 'Берлин',
  'CHN-1839': 'Хэйлунцзян',
  'CHN-1828': 'Цзилинь',
  'CHN-1813': 'Ляонин',
  'CHN-1838': 'Внутренняя Монголия',
  'CHN-1811': 'Хэбэй',
  'CHN-1805': 'Шаньси',
  'CHN-1804': 'Шэньси',
  'CHN-1803': 'Нинся',
  'CHN-1150': 'Ганьсу',
  'CHN-1814': 'Шаньдун',
  'CHN-1816': 'Тяньцзинь',
  'CHN-1155': 'Пекин',
  'CHN-1819': 'Шанхай',
  'CHN-1818': 'Цзянсу',
  'CHN-1820': 'Чжэцзян',
  'CHN-1178': 'Фуцзянь',
  'CHN-1179': 'Аньхой',
  'CHN-1812': 'Хэнань',
  'CHN-1807': 'Хубэй',
  'CHN-1808': 'Хунань',
  'CHN-1817': 'Цзянси',
  'CHN-1180': 'Гуандун',
  'CHN-1152': 'Гуанси',
  'CHN-1775': 'Хайнань',
  'CHN-1810': 'Юньнань',
  'CHN-1153': 'Гуйчжоу',
  'CHN-1809': 'Сычуань',
  'CHN-1154': 'Чунцин',
  'CHN-1756': 'Синьцзян',
  'CHN-1662': 'Тибет',
  'CHN-1151': 'Цинхай',
};

/**
 * Получает русское название региона
 */
function getRussianName(geoJsonId, englishName, nameRu) {
  if (nameRu && nameRu.trim()) {
    return nameRu;
  }
  if (REGION_TRANSLATIONS[geoJsonId]) {
    return REGION_TRANSLATIONS[geoJsonId];
  }
  if (REGION_TRANSLATIONS[englishName]) {
    return REGION_TRANSLATIONS[englishName];
  }
  return englishName;
}

/**
 * Население регионов Германии в 1946 (в тысячах)
 */
const GERMANY_POPULATION = {
  'DEU-1601': 4500,
  'DEU-1600': 2800,
  'DEU-3487': 2500,
  'DEU-3488': 2100,
  'DEU-1577': 2300,
  'DEU-1591': 7000,
  'DEU-1574': 4000,
  'DEU-1575': 600,
  'DEU-1573': 6500,
  'DEU-1576': 6000,
  'DEU-1572': 10000,
  'DEU-1579': 2200,
  'DEU-1578': 1600,
  'DEU-1580': 3800,
  'DEU-1581': 1000,
  'DEU-1599': 3300, // Берлин - общий
  // Берлин - 4 зоны (виртуальные регионы)
  'DEU-1599-USSR': 800,   // Советский сектор
  'DEU-1599-USA': 700,    // Американский сектор
  'DEU-1599-UK': 1000,    // Британский сектор
  'DEU-1599-FRA': 800,    // Французский сектор
};

/**
 * Население регионов Китая в 1946 (в тысячах)
 */
const CHINA_POPULATION = {
  'CHN-1839': 5000,
  'CHN-1828': 4000,
  'CHN-1813': 8000,
  'CHN-1838': 6000,
  'CHN-1811': 25000,
  'CHN-1805': 12000,
  'CHN-1804': 10000,
  'CHN-1803': 1500,
  'CHN-1150': 8000,
  'CHN-1814': 35000,
  'CHN-1816': 4000,
  'CHN-1155': 5000,
  'CHN-1819': 4500,
  'CHN-1818': 35000,
  'CHN-1820': 20000,
  'CHN-1178': 15000,
  'CHN-1179': 25000,
  'CHN-1812': 28000,
  'CHN-1807': 22000,
  'CHN-1808': 25000,
  'CHN-1817': 18000,
  'CHN-1180': 30000,
  'CHN-1152': 18000,
  'CHN-1775': 2000,
  'CHN-1810': 15000,
  'CHN-1153': 10000,
  'CHN-1809': 50000,
  'CHN-1154': 8000,
  'CHN-1756': 4000,
  'CHN-1662': 1000,
  'CHN-1151': 2000,
};

/**
 * Экономические показатели стран в 1946
 */
const COUNTRY_ECONOMICS = {
  'USSR': { urbanization: 0.35, stability: 0.6, infrastructure: 0.4, development: 0.5 },
  'USA': { urbanization: 0.65, stability: 0.9, infrastructure: 0.9, development: 0.95 },
  'UK': { urbanization: 0.8, stability: 0.7, infrastructure: 0.7, development: 0.85 },
  'FRA': { urbanization: 0.55, stability: 0.5, infrastructure: 0.5, development: 0.7 },
  'Germany': { urbanization: 0.6, stability: 0.3, infrastructure: 0.4, development: 0.7 },
  'Italy': { urbanization: 0.5, stability: 0.4, infrastructure: 0.4, development: 0.6 },
  'China': { urbanization: 0.15, stability: 0.4, infrastructure: 0.2, development: 0.3 },
  'Taiwan': { urbanization: 0.2, stability: 0.5, infrastructure: 0.25, development: 0.35 },
  // Зоны оккупации Германии
  'DEU-USSR': { urbanization: 0.6, stability: 0.3, infrastructure: 0.35, development: 0.65 },
  'DEU-USA': { urbanization: 0.6, stability: 0.35, infrastructure: 0.45, development: 0.7 },
  'DEU-UK': { urbanization: 0.6, stability: 0.35, infrastructure: 0.4, development: 0.68 },
  'DEU-FRA': { urbanization: 0.6, stability: 0.3, infrastructure: 0.38, development: 0.66 },
};

/**
 * Получает население региона
 */
function getPopulation(geoJsonId, countryId) {
  if (GERMANY_POPULATION[geoJsonId]) {
    return GERMANY_POPULATION[geoJsonId] * 1000;
  }
  if (CHINA_POPULATION[geoJsonId]) {
    return CHINA_POPULATION[geoJsonId] * 1000;
  }
  // Оценка по умолчанию
  return 1000000;
}

/**
 * Обогащает GeoJSON игровыми данными
 */
function enrichGeoJson(geoJson) {
  const enrichedFeatures = geoJson.features.map(feature => {
    const props = feature.properties || {};
    
    // Определяем страну
    let countryId = HISTORICAL_REGION_COUNTRY_MAP[props.adm1_code];
    if (!countryId) {
      countryId = ISO_TO_COUNTRY_ID[props.adm0_a3];
    }

    // Цвета стран
    const COUNTRY_COLORS = {
      'USSR': '#CC0000',
      'USA': '#0066CC',
      'UK': '#003366',
      'FRA': '#0055AA',
      'Germany': '#DDDD00',
      'Italy': '#00AA00',
      'China': '#FF0000',
      'Taiwan': '#0000FF',
      // Зоны оккупации Германии
      'DEU-USSR': '#CC0000',
      'DEU-USA': '#0066CC',
      'DEU-UK': '#003366',
      'DEU-FRA': '#0055AA',
    };

    const COUNTRY_NAMES = {
      'USSR': 'СССР',
      'USA': 'США',
      'UK': 'Великобритания',
      'FRA': 'Франция',
      'Germany': 'Германия',
      'Italy': 'Италия',
      'China': 'Китай',
      'Taiwan': 'Китай (Гоминьдан)',
      // Зоны оккупации Германии
      'DEU-USSR': 'Германия (Советская зона)',
      'DEU-USA': 'Германия (Американская зона)',
      'DEU-UK': 'Германия (Британская зона)',
      'DEU-FRA': 'Германия (Французская зона)',
    };

    const ownerColor = countryId ? (COUNTRY_COLORS[countryId] || '#808080') : '#808080';
    const ownerName = countryId ? (COUNTRY_NAMES[countryId] || 'Neutral') : 'Neutral';
    const ownerCountryId = countryId || null;

    // Получаем русское название
    const russianName = getRussianName(props.adm1_code, props.name, props.name_ru);

    return {
      ...feature,
      properties: {
        ...props,
        id: props.adm1_code || props.adm0_a3 || props.name,
        name: russianName,
        countryName: props.admin || '',
        iso_a2: props.iso_a2 || '',
        adm0_a3: props.adm0_a3 || '',
        ownerCountryId,
        ownerColor,
        ownerName,
        population: 0,
        type: 'region',
        color: '#1a3a5c',
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: enrichedFeatures,
  };
}

/**
 * Генерирует игровые регионы из GeoJSON
 */
function generateRegions(geoJson) {
  const regions = [];
  let nextId = 1;

  for (const feature of geoJson.features) {
    const props = feature.properties || {};
    
    if (!props.adm1_code || !props.adm0_a3) {
      continue;
    }

    // Определяем страну
    let countryId = HISTORICAL_REGION_COUNTRY_MAP[props.adm1_code];
    if (!countryId) {
      countryId = ISO_TO_COUNTRY_ID[props.adm0_a3];
    }
    
    if (!countryId) {
      continue;
    }

    // Специальная обработка для Берлина - создаём 4 виртуальных региона
    if (props.adm1_code === 'DEU-1599') {
      const berlinGeometry = feature.geometry;
      const berlinArea = props.area_sqkm || 0;
      
      // 4 сектора Берлина
      const berlinSectors = [
        { suffix: 'USSR', owner: 'DEU-USSR', name: 'Берлин (Советский сектор)', pop: 800 },
        { suffix: 'USA', owner: 'DEU-USA', name: 'Берлин (Американский сектор)', pop: 700 },
        { suffix: 'UK', owner: 'DEU-UK', name: 'Берлин (Британский сектор)', pop: 1000 },
        { suffix: 'FRA', owner: 'DEU-FRA', name: 'Берлин (Французский сектор)', pop: 800 },
      ];

      for (const sector of berlinSectors) {
        const economics = COUNTRY_ECONOMICS[sector.owner] || {
          urbanization: 0.6,
          stability: 0.3,
          infrastructure: 0.4,
          development: 0.65,
        };

        regions.push({
          id: nextId++,
          geoJsonId: `DEU-1599-${sector.suffix}`,
          name: sector.name,
          ownerCountryId: sector.owner,
          population: sector.pop * 1000,
          area: berlinArea / 4, // Разделяем площадь на 4
          urbanization: economics.urbanization,
          stability: economics.stability,
          infrastructure: economics.infrastructure,
          development: economics.development,
          resourceProduction: {},
          neighboringRegionIds: [],
        });
      }

      continue; // Пропускаем обычную обработку для Берлина
    }

    // Получаем русское название
    const russianName = getRussianName(props.adm1_code, props.name, props.name_ru);

    // Получаем население
    const population = getPopulation(props.adm1_code, countryId);

    // Получаем площадь
    const area = props.area_sqkm || 0;

    // Получаем экономические показатели
    const economics = COUNTRY_ECONOMICS[countryId] || {
      urbanization: 0.3,
      stability: 0.5,
      infrastructure: 0.4,
      development: 0.5,
    };

    const region = {
      id: nextId++,
      geoJsonId: props.adm1_code,
      name: russianName,
      ownerCountryId: countryId,
      population,
      area,
      urbanization: economics.urbanization,
      stability: economics.stability,
      infrastructure: economics.infrastructure,
      development: economics.development,
      resourceProduction: {},
      neighboringRegionIds: [],
    };

    regions.push(region);
  }

  return regions;
}

/**
 * Основная функция
 */
function main() {
  console.log('Загрузка GeoJSON...');
  const geoJson = loadGeoJson(GAM_MAP_PATH);
  console.log(`Загружено ${geoJson.features.length} регионов`);

  console.log('Фильтрация GeoJSON...');
  const filteredGeoJson = filterGeoJson(geoJson);
  console.log(`После фильтрации: ${filteredGeoJson.features.length} регионов`);

  console.log('Обогащение GeoJSON игровыми данными...');
  const enrichedGeoJson = enrichGeoJson(filteredGeoJson);

  console.log('Сохранение GeoJSON для карты...');
  const geoJsonOutputPath = path.join(__dirname, '../client/public/world-map-full.geojson');
  saveGeoJson(enrichedGeoJson, geoJsonOutputPath);

  console.log('Генерация игровых регионов...');
  const regions = generateRegions(filteredGeoJson);
  console.log(`Сгенерировано ${regions.length} игровых регионов`);

  console.log('Сохранение регионов...');
  saveRegions(regions, OUTPUT_PATH);
  
  // Также сохраняем в папку server для сервера
  const serverOutputPath = path.join(__dirname, '../server/data/scenarios/1946/regions.json');
  saveRegions(regions, serverOutputPath);

  console.log('Готово!');
}

// Запуск
main();
