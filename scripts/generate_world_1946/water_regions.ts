/**
 * water_regions.ts — Генерация водных регионов и каналов
 * 
 * Создаёт box-полигоны для океанов, морей, озёр и каналов.
 * Полигоны нужны только для regions.json (игровые данные),
 * НО не для GeoJSON (вода отображается фоном карты).
 */

import type { WaterBox } from './types';

// Координаты: [west, south, east, north]
const OCEANS: WaterBox[] = [
  { id: 'OCEAN-ATLANTIC', name: 'Атлантический океан', nameEn: 'Atlantic Ocean', kind: 'ocean', bbox: [-80, -70, 20, 70] },
  { id: 'OCEAN-PACIFIC', name: 'Тихий океан', nameEn: 'Pacific Ocean', kind: 'ocean', bbox: [100, -70, -60, 70] },
  { id: 'OCEAN-INDIAN', name: 'Индийский океан', nameEn: 'Indian Ocean', kind: 'ocean', bbox: [20, -70, 120, 30] },
  { id: 'OCEAN-ARCTIC', name: 'Северный Ледовитый океан', nameEn: 'Arctic Ocean', kind: 'ocean', bbox: [-180, 65, 180, 90] },
  { id: 'OCEAN-SOUTHERN', name: 'Южный океан', nameEn: 'Southern Ocean', kind: 'ocean', bbox: [-180, -90, 180, -60] },
];

const SEAS: WaterBox[] = [
  { id: 'SEA-NORTH', name: 'Северное море', nameEn: 'North Sea', kind: 'sea', bbox: [-5, 51, 10, 62] },
  { id: 'SEA-BALTIC', name: 'Балтийское море', nameEn: 'Baltic Sea', kind: 'sea', bbox: [10, 53.5, 30, 66] },
  { id: 'SEA-MEDITERRANEAN', name: 'Средиземное море', nameEn: 'Mediterranean Sea', kind: 'sea', bbox: [-5, 30, 36, 46] },
  { id: 'SEA-BLACK', name: 'Чёрное море', nameEn: 'Black Sea', kind: 'sea', bbox: [27, 41, 42, 47] },
  { id: 'SEA-RED', name: 'Красное море', nameEn: 'Red Sea', kind: 'sea', bbox: [33, 12.5, 44, 30] },
  { id: 'SEA-CARIBBEAN', name: 'Карибское море', nameEn: 'Caribbean Sea', kind: 'sea', bbox: [-90, 8, -60, 23] },
  { id: 'SEA-JAPAN', name: 'Японское море', nameEn: 'Sea of Japan', kind: 'sea', bbox: [127, 34, 142, 52] },
  { id: 'SEA-EASTCHINA', name: 'Восточно-Китайское море', nameEn: 'East China Sea', kind: 'sea', bbox: [117, 22, 131, 42] },
  { id: 'SEA-SOUTHCHINA', name: 'Южно-Китайское море', nameEn: 'South China Sea', kind: 'sea', bbox: [99, 2, 122, 25] },
  { id: 'SEA-OKHOTSK', name: 'Охотское море', nameEn: 'Sea of Okhotsk', kind: 'sea', bbox: [135, 43, 165, 62] },
  { id: 'SEA-BERING', name: 'Берингово море', nameEn: 'Bering Sea', kind: 'sea', bbox: [160, 52, -160, 66] },
  { id: 'SEA-BARENTS', name: 'Баренцево море', nameEn: 'Barents Sea', kind: 'sea', bbox: [20, 68, 60, 82] },
  { id: 'SEA-NORWEGIAN', name: 'Норвежское море', nameEn: 'Norwegian Sea', kind: 'sea', bbox: [-10, 62, 20, 72] },
  { id: 'SEA-GREENLAND', name: 'Гренландское море', nameEn: 'Greenland Sea', kind: 'sea', bbox: [-30, 66, 10, 82] },
  { id: 'SEA-ARABIAN', name: 'Аравийское море', nameEn: 'Arabian Sea', kind: 'sea', bbox: [45, 5, 80, 25] },
  { id: 'SEA-ADRIATIC', name: 'Андриатическое море', nameEn: 'Adriatic Sea', kind: 'sea', bbox: [12, 40, 20, 46] },
  { id: 'SEA-AEGEAN', name: 'Эгейское море', nameEn: 'Aegean Sea', kind: 'sea', bbox: [22, 35, 28, 42] },
  { id: 'SEA-CORAL', name: 'Коралловое море', nameEn: 'Coral Sea', kind: 'sea', bbox: [145, -30, 170, -10] },
  { id: 'SEA-TASMAN', name: 'Тасманово море', nameEn: 'Tasman Sea', kind: 'sea', bbox: [150, -48, 178, -30] },
  { id: 'SEA-BEAUFORT', name: 'Море Бофорта', nameEn: 'Beaufort Sea', kind: 'sea', bbox: [-140, 69, -120, 76] },
  { id: 'SEA-CHUKCHI', name: 'Чукотское море', nameEn: 'Chukchi Sea', kind: 'sea', bbox: [-180, 64, -160, 73] },
  { id: 'SEA-LAPTEV', name: 'Море Лаптевых', nameEn: 'Laptev Sea', kind: 'sea', bbox: [100, 70, 140, 82] },
  { id: 'SEA-KARA', name: 'Карское море', nameEn: 'Kara Sea', kind: 'sea', bbox: [60, 68, 100, 82] },
  { id: 'SEA-YELLOW', name: 'Жёлтое море', nameEn: 'Yellow Sea', kind: 'sea', bbox: [119, 33, 127, 40] },
  { id: 'SEA-ANDAMAN', name: 'Андаманское море', nameEn: 'Andaman Sea', kind: 'sea', bbox: [92, 4, 102, 20] },
  { id: 'SEA-PHILIPPINE', name: 'Филиппинское море', nameEn: 'Philippine Sea', kind: 'sea', bbox: [122, 0, 145, 30] },
  { id: 'SEA-SULU', name: 'Море Сулу', nameEn: 'Sulu Sea', kind: 'sea', bbox: [117, 5, 123, 12] },
  { id: 'SEA-CELEBES', name: 'Море Сулавеси', nameEn: 'Celebes Sea', kind: 'sea', bbox: [118, -5, 128, 6] },
  { id: 'SEA-BANDA', name: 'Море Банда', nameEn: 'Banda Sea', kind: 'sea', bbox: [124, -10, 134, -2] },
  { id: 'SEA-JAVA', name: 'Яванское море', nameEn: 'Java Sea', kind: 'sea', bbox: [108, -10, 120, -3] },
  { id: 'SEA-TIMOR', name: 'Тиморское море', nameEn: 'Timor Sea', kind: 'sea', bbox: [124, -14, 136, -8] },
  { id: 'SEA-ARAFURA', name: 'Арафурское море', nameEn: 'Arafura Sea', kind: 'sea', bbox: [130, -12, 145, -5] },
  { id: 'SEA-GULF-MEXICO', name: 'Мексиканский залив', nameEn: 'Gulf of Mexico', kind: 'sea', bbox: [-98, 18, -80, 30] },
  { id: 'SEA-GULF-PERSIAN', name: 'Персидский залив', nameEn: 'Persian Gulf', kind: 'sea', bbox: [46, 23.5, 60, 30] },
  { id: 'SEA-GULF-BENGAL', name: 'Бенгальский залив', nameEn: 'Bay of Bengal', kind: 'sea', bbox: [78, 5, 97, 22] },
  { id: 'SEA-GULF-GUINEA', name: 'Гвинейский залив', nameEn: 'Gulf of Guinea', kind: 'sea', bbox: [-10, -5, 10, 6] },
  { id: 'SEA-GULF-ALASKA', name: 'Залив Аляска', nameEn: 'Gulf of Alaska', kind: 'sea', bbox: [-150, 54, -130, 62] },
];

const CANALS: WaterBox[] = [
  { id: 'CANAL-SUEZ', name: 'Суэцкий канал', nameEn: 'Suez Canal', kind: 'canal', bbox: [32.2, 29.7, 32.7, 31.5] },
  { id: 'CANAL-PANAMA', name: 'Панамский канал', nameEn: 'Panama Canal', kind: 'canal', bbox: [-80, 8.8, -79.4, 9.5] },
  { id: 'CANAL-KIEL', name: 'Кильский канал', nameEn: 'Kiel Canal', kind: 'canal', bbox: [9.4, 54.15, 10.4, 54.45] },
  { id: 'CANAL-SUEZ-ACCESS', name: 'Суэцкий залив', nameEn: 'Gulf of Suez', kind: 'sea', bbox: [32.5, 27.5, 34, 30] },
];

const LAKES: WaterBox[] = [
  { id: 'LAKE-CASPIAN', name: 'Каспийское море', nameEn: 'Caspian Sea', kind: 'lake', bbox: [46.5, 36.5, 54, 47] },
  { id: 'LAKE-BAIKAL', name: 'Озеро Байкал', nameEn: 'Lake Baikal', kind: 'lake', bbox: [103.5, 51.3, 110, 56] },
  { id: 'LAKE-SUPERIOR', name: 'Верхнее озеро', nameEn: 'Lake Superior', kind: 'lake', bbox: [-92.5, 46.3, -84.3, 49] },
  { id: 'LAKE-MICHIGAN', name: 'Озеро Мичиган', nameEn: 'Lake Michigan', kind: 'lake', bbox: [-88, 41.5, -86.3, 46] },
  { id: 'LAKE-HURON', name: 'Озеро Гурон', nameEn: 'Lake Huron', kind: 'lake', bbox: [-84, 43, -81, 46.5] },
  { id: 'LAKE-ERIE', name: 'Озеро Эри', nameEn: 'Lake Erie', kind: 'lake', bbox: [-83.5, 41.3, -78.8, 43] },
  { id: 'LAKE-ONTARIO', name: 'Озеро Онтарио', nameEn: 'Lake Ontario', kind: 'lake', bbox: [-80, 43.2, -76, 44.5] },
  { id: 'LAKE-VICTORIA', name: 'Озеро Виктория', nameEn: 'Lake Victoria', kind: 'lake', bbox: [31.5, -3, 35, 0.5] },
  { id: 'LAKE-TANGANYIKA', name: 'Озеро Танганьика', nameEn: 'Lake Tanganyika', kind: 'lake', bbox: [29, -9, 31.5, -3] },
  { id: 'LAKE-MALAWI', name: 'Озеро Ньяса', nameEn: 'Lake Malawi', kind: 'lake', bbox: [34, -15, 36, -9.5] },
  { id: 'LAKE-LADOGA', name: 'Ладожское озеро', nameEn: 'Lake Ladoga', kind: 'lake', bbox: [29.5, 59.8, 33, 61.5] },
  { id: 'LAKE-ONEGA', name: 'Онежское озеро', nameEn: 'Lake Onega', kind: 'lake', bbox: [34.5, 61.5, 36.5, 62.8] },
  { id: 'LAKE-BALHASH', name: 'Озеро Балхаш', nameEn: 'Lake Balkhash', kind: 'lake', bbox: [73, 45.5, 79, 47] },
  { id: 'LAKE-ARAL', name: 'Аральское море', nameEn: 'Aral Sea', kind: 'lake', bbox: [58, 43.5, 62, 47] },
  { id: 'LAKE-CHAD', name: 'Озеро Чад', nameEn: 'Lake Chad', kind: 'lake', bbox: [13, 12.5, 15.5, 14.5] },
  { id: 'LAKE-GENEVA', name: 'Женевское озеро', nameEn: 'Lake Geneva', kind: 'lake', bbox: [6.1, 46.2, 7, 46.6] },
  { id: 'LAKE-GREAT-SLAVE', name: 'Большое Невольничье озеро', nameEn: 'Great Slave Lake', kind: 'lake', bbox: [-117, 60, -110, 63] },
  { id: 'LAKE-GREAT-BEAR', name: 'Большое Медвежье озеро', nameEn: 'Great Bear Lake', kind: 'lake', bbox: [-125, 64.5, -118, 67] },
  { id: 'LAKE-WINNIPEG', name: 'Озеро Виннипег', nameEn: 'Lake Winnipeg', kind: 'lake', bbox: [-100, 50, -96, 54] },
  { id: 'LAKE-TITICACA', name: 'Озеро Титикака', nameEn: 'Lake Titicaca', kind: 'lake', bbox: [-70, -16.5, -68.5, -15] },
  { id: 'LAKE-MARACAIBO', name: 'Озеро Маракайбо', nameEn: 'Lake Maracaibo', kind: 'lake', bbox: [-72, 9.5, -70.5, 11] },
  { id: 'LAKE-NICARAGUA', name: 'Озеро Никарагуа', nameEn: 'Lake Nicaragua', kind: 'lake', bbox: [-86, 11, -84.5, 12.5] },
  { id: 'LAKE-EYRE', name: 'Озеро Эйр', nameEn: 'Lake Eyre', kind: 'lake', bbox: [136, -29, 138, -27] },
  { id: 'LAKE-TORRENS', name: 'Озеро Торренс', nameEn: 'Lake Torrens', kind: 'lake', bbox: [137.5, -31.5, 138.5, -30.5] },
];

const WATER_BOXES: WaterBox[] = [...OCEANS, ...SEAS, ...CANALS, ...LAKES];

export function getAllWaterBoxes(): WaterBox[] {
  return WATER_BOXES;
}

/**
 * Создаёт ВОДНЫЕ РЕГИОНЫ ТОЛЬКО ДЛЯ REGIONS.JSON (не для GeoJSON).
 * В GeoJSON водные регионы НЕ ДОБАВЛЯЮТСЯ, т.к. вода отображается фоном карты.
 * 
 * @returns Массив водных регионов (только для regions.json)
 */
export function createWaterRegionRecords(): Array<{
  geoJsonId: string;
  name: string;
  nameEn: string;
  kind: string;
  area: number;
  resourceProduction: Record<string, number>;
}> {
  return WATER_BOXES.map(wb => {
    const [w, s, e, n] = wb.bbox;
    const area = Math.max(1, Math.abs((e - w) * (n - s)) * 100 * 100);
    return {
      geoJsonId: wb.id,
      name: wb.name,
      nameEn: wb.nameEn,
      kind: wb.kind,
      area: Math.round(area),
      resourceProduction: wb.kind === 'canal' ? { canal_traffic: 1 } : { fish: 0.5 },
    };
  });
}