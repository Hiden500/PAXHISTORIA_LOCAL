/**
 * historical_data.ts — Исторические данные для 1946 года
 */

import type { CountryProfile } from './types';

// ISO коды → игровые ID стран (1946 год)
export const ISO_TO_COUNTRY_ID: Record<string, string> = {
  SUN: 'USSR', RUS: 'USSR', UKR: 'USSR', BLR: 'USSR',
  EST: 'USSR', LVA: 'USSR', LTU: 'USSR', MDA: 'USSR',
  GEO: 'USSR', ARM: 'USSR', AZE: 'USSR',
  KAZ: 'USSR', UZB: 'USSR', TKM: 'USSR', KGZ: 'USSR', TJK: 'USSR',
  KAB: 'USSR',

  USA: 'USA', CAN: 'CAN', GBR: 'UK', FRA: 'FRA',
  AUS: 'AUS', NZL: 'NZL', ZAF: 'SAF',

  DEU: 'Germany', ITA: 'ITA', JPN: 'JPN',
  CHN: 'China', TWN: 'Taiwan', HKG: 'Taiwan', MAC: 'Taiwan',

  IND: 'IND', BRA: 'BRA', MEX: 'MEX', ARG: 'ARG',
  ESP: 'ESP', PRT: 'PRT', NLD: 'NED', BEL: 'BEL',
  CHE: 'SWI', AUT: 'AUT', HUN: 'HUN', CZE: 'CZE',
  SVK: 'CZE', POL: 'POL', YUG: 'YUG',
  GRC: 'GRE', TUR: 'TUR', BGR: 'BGR', ROU: 'ROU',
  NOR: 'NOR', SWE: 'SWE', DNK: 'DEN', FIN: 'FIN',
  IRL: 'IRE', ISL: 'ISL', ALB: 'ALB',

  EGY: 'EGY', IRQ: 'IRQ', IRN: 'IRN', SAU: 'SAU',
  AFG: 'AFG', PAK: 'PAK', BGD: 'PAK',
  THA: 'THA', KOR: 'KOR', PRK: 'KOR',
  NPL: 'NPL', BTN: 'BTN',
  SYR: 'SYR', LBN: 'LBN', JOR: 'JOR',
  YEM: 'YEM', OMN: 'OMN', ARE: 'UAE',
  KWT: 'KWT', BHR: 'BHR', QAT: 'QAT',
  LBY: 'LBY', TUN: 'TUN', DZA: 'ALG', MAR: 'MAR',
  SDN: 'SDN', ETH: 'ETH', SOM: 'SOM',
  KEN: 'KEN', UGA: 'UGA', TZA: 'TAN',
  NGA: 'NGA', GHA: 'GHA', CIV: 'IVC',
  SEN: 'SEN', MLI: 'MLI', BFA: 'BFA',
  NER: 'NER', TCD: 'CHD', CAF: 'CAF',
  COD: 'CON', COG: 'CON', GAB: 'GAB',
  AGO: 'PRT', MOZ: 'PRT', ZWE: 'UK',
  ZMB: 'UK', MWI: 'UK', BWA: 'UK',
  NAM: 'SAF', LSO: 'UK', SWZ: 'UK',
  MNG: 'MNG',
  CUB: 'CUB', HTI: 'HAI', DOM: 'DOM',
  GTM: 'GTM', HND: 'HND', SLV: 'SLV', NIC: 'NIC', CRI: 'CRI',
  PAN: 'PAN', COL: 'COL', VEN: 'VEN',
  ECU: 'ECU', PER: 'PER', BOL: 'BOL',
  PRY: 'PAR', URY: 'URU', CHL: 'CHL',
  LKA: 'CEY', MDV: 'MDV', MUS: 'MAU',
  LUX: 'LUX', MCO: 'MCO', AND: 'AND',
  SMR: 'SMR', LIE: 'LIE', MLT: 'MLT',
  VAT: 'VAT', BRN: 'BRN',

  // Югославия
  SVN: 'YUG', MKD: 'YUG', XKX: 'YUG', SRB: 'YUG',
  HRV: 'YUG', MNE: 'YUG', BIH: 'YUG', KOS: 'YUG',

  // Французские
  GIN: 'FRA', MDG: 'FRA', CMR: 'FRA', MRT: 'FRA',
  COG: 'FRA', GAB: 'FRA', CAF: 'FRA',
  MLI: 'FRA', BFA: 'FRA', NER: 'FRA',
  CIV: 'FRA', SEN: 'FRA', BEN: 'FRA', TGO: 'FRA',
  DJI: 'FRA', PYF: 'FRA', NCL: 'FRA', WLF: 'FRA',
  ATF: 'FRA', SXM: 'FRA', MAF: 'FRA', BLM: 'FRA',
  CLP: 'FRA', COM: 'FRA', TUN: 'FRA', DZA: 'FRA', MAR: 'FRA',
  VNM: 'FRA', KHM: 'FRA', LAO: 'FRA', SPM: 'FRA',

  // Бельгийские
  RWA: 'BEL', BDI: 'BEL', COD: 'BEL',

  // Португальские
  GNB: 'PRT', CPV: 'PRT', STP: 'PRT', TLS: 'PRT',
  GNQ: 'ESP', SAH: 'ESP',

  // Британские
  GMB: 'UK', SLE: 'UK', GHA: 'UK', NGA: 'UK',
  KEN: 'UK', UGA: 'UK', TZA: 'UK',
  MWI: 'UK', ZMB: 'UK', ZWE: 'UK',
  BWA: 'UK', LSO: 'UK', SWZ: 'UK',
  SDN: 'UK', ERI: 'UK',
  ISR: 'UK', PSX: 'UK', CYP: 'UK',
  BHS: 'UK', BRB: 'UK', LCA: 'UK', VCT: 'UK',
  GRD: 'UK', DMA: 'UK', KNA: 'UK', ATG: 'UK',
  BMU: 'UK', CYM: 'UK', VGB: 'UK', MSR: 'UK',
  AIA: 'UK', TCA: 'UK', GIB: 'UK', FLK: 'UK',
  SHN: 'UK', IOT: 'UK', GGY: 'UK', JEY: 'UK',
  IMN: 'UK', PCN: 'UK', SGS: 'UK', SOL: 'UK',
  ESB: 'UK', WSB: 'UK', CYN: 'UK',
  FJI: 'UK', SLB: 'UK', VUT: 'UK', TON: 'UK',
  WSM: 'UK', KIR: 'UK', TUV: 'UK',
  SYC: 'UK', MYS: 'UK', SGP: 'UK', BRN: 'UK',
  MMR: 'UK', LKA: 'UK', MDV: 'UK', MUS: 'UK',
  GUY: 'UK', BLZ: 'UK',
  LBY: 'UK', SOM: 'ITA',

  // Датские
  FRO: 'DEN', GRL: 'DEN',

  // Австралийские
  PNG: 'AUS', HMD: 'AUS', NFK: 'AUS', CSI: 'AUS', ATC: 'AUS', IOA: 'AUS',
  NRU: 'AUS',

  // Американские
  PLW: 'USA', MHL: 'USA', FSM: 'USA', MNP: 'USA',
  GUM: 'USA', ASM: 'USA', PRI: 'USA', UMI: 'USA',
  USG: 'USA', PHL: 'USA', VIR: 'USA',

  // Нидерландские
  SUR: 'NED', CUW: 'NED', ABW: 'NED', IDN: 'NED',

  // Новозеландские
  COK: 'NZL', NIU: 'NZL',

  LBR: 'LBR', ETH: 'ETH', ALD: 'FIN',
  SDS: 'SDN', ATA: 'Neutral', KAS: 'Neutral', PGA: 'Neutral',
};

export const GERMANY_OCCUPATION_ZONES: Record<string, { zone: string; ownerId: string }> = {
  'DEU-1601': { zone: 'SOVIET', ownerId: 'DEU-USSR' },
  'DEU-1600': { zone: 'SOVIET', ownerId: 'DEU-USSR' },
  'DEU-3487': { zone: 'SOVIET', ownerId: 'DEU-USSR' },
  'DEU-3488': { zone: 'SOVIET', ownerId: 'DEU-USSR' },
  'DEU-1577': { zone: 'SOVIET', ownerId: 'DEU-USSR' },
  'DEU-1591': { zone: 'USA', ownerId: 'DEU-USA' },
  'DEU-1574': { zone: 'USA', ownerId: 'DEU-USA' },
  'DEU-1575': { zone: 'USA', ownerId: 'DEU-USA' },
  'DEU-1573': { zone: 'USA', ownerId: 'DEU-USA' },
  'DEU-1576': { zone: 'UK', ownerId: 'DEU-UK' },
  'DEU-1572': { zone: 'UK', ownerId: 'DEU-UK' },
  'DEU-1579': { zone: 'UK', ownerId: 'DEU-UK' },
  'DEU-1578': { zone: 'UK', ownerId: 'DEU-UK' },
  'DEU-1580': { zone: 'FRA', ownerId: 'DEU-FRA' },
  'DEU-1581': { zone: 'FRA', ownerId: 'DEU-FRA' },
};

export const CCP_CONTROLLED: string[] = [
  'CHN-1839', 'CHN-1828', 'CHN-1813', 'CHN-1838',
  'CHN-1811', 'CHN-1805', 'CHN-1804', 'CHN-1803', 'CHN-1150',
];

export const KMT_CONTROLLED: string[] = [
  'CHN-1814', 'CHN-1816', 'CHN-1155', 'CHN-1819',
  'CHN-1818', 'CHN-1820', 'CHN-1178', 'CHN-1179',
  'CHN-1812', 'CHN-1807', 'CHN-1808', 'CHN-1817',
  'CHN-1180', 'CHN-1152', 'CHN-1775',
  'CHN-1810', 'CHN-1153', 'CHN-1809', 'CHN-1154',
  'CHN-1756', 'CHN-1662', 'CHN-1151',
];

export function getChinaOwner(adm1Code: string): string {
  if (CCP_CONTROLLED.includes(adm1Code)) return 'China';
  if (KMT_CONTROLLED.includes(adm1Code)) return 'Taiwan';
  return 'Taiwan';
}

// Русские названия
export const HISTORICAL_NAMES_RU: Record<string, string> = {
  'RUS-1040': 'Ленинградская область', 'RUS-993': 'Московская область',
  'RUS-1008': 'Сталинградская область', 'RUS-999': 'Куйбышевская область',
  'RUS-1007': 'Свердловская область', 'RUS-1006': 'Молотовская область',
  'RUS-1009': 'Чкаловская область', 'RUS-987': 'Горьковская область',
  'RUS-1002': 'Калининская область', 'RUS-1001': 'Кировская область',
  'RUS-998': 'Мурманская область', 'RUS-989': 'Архангельская область',
  'RUS-990': 'Вологодская область', 'RUS-991': 'Ивановская область',
  'RUS-992': 'Ярославская область', 'RUS-994': 'Рязанская область',
  'RUS-995': 'Тульская область', 'RUS-996': 'Калужская область',
  'RUS-997': 'Смоленская область', 'RUS-1000': 'Тамбовская область',
  'RUS-1003': 'Воронежская область', 'RUS-1004': 'Курская область',
  'RUS-1005': 'Орловская область', 'RUS-1011': 'Омская область',
  'RUS-1012': 'Новосибирская область', 'RUS-1013': 'Иркутская область',
  'RUS-1014': 'Красноярский край', 'RUS-1015': 'Алтайский край',
  'RUS-1019': 'Приморский край', 'RUS-1020': 'Хабаровский край',
  'RUS-1036': 'Крымская область', 'RUS-1037': 'Краснодарский край',
  'RUS-1039': 'Ростовская область', 'RUS-1038': 'Ставропольский край',
  'RUS-1029': 'Карело-Финская ССР', 'RUS-1025': 'Якутская АССР',
  'RUS-1033': 'Татарская АССР', 'RUS-1035': 'Башкирская АССР',
  'RUS-1041': 'Дагестанская АССР', 'RUS-1043': 'Чечено-Ингушская АССР',
  'UKR-669': 'Киевская область', 'UKR-670': 'Харьковская область',
  'UKR-671': 'Одесская область', 'UKR-672': 'Днепропетровская область',
  'UKR-673': 'Сталинская область (Донецкая)', 'UKR-674': 'Львовская область',
  'UKR-692': 'Закарпатская область',
  'BLR-300': 'Минская область', 'BLR-303': 'Гомельская область', 'BLR-305': 'Брестская область',
  'EST-73': 'Эстонская ССР', 'LVA-70': 'Латвийская ССР', 'LTU-71': 'Литовская ССР',
  'DEU-1601': 'Саксония', 'DEU-1600': 'Саксония-Анхальт',
  'DEU-3487': 'Бранденбург', 'DEU-3488': 'Мекленбург',
  'DEU-1577': 'Тюрингия', 'DEU-1591': 'Бавария',
  'DEU-1574': 'Гессен', 'DEU-1575': 'Бремен',
  'DEU-1573': 'Вюртемберг-Баден', 'DEU-1576': 'Нижняя Саксония',
  'DEU-1572': 'Северный Рейн-Вестфалия', 'DEU-1579': 'Шлезвиг-Гольштейн',
  'DEU-1578': 'Гамбург', 'DEU-1580': 'Рейнланд-Пфальц',
  'DEU-1581': 'Саар', 'DEU-1599': 'Берлин',
  'CHN-1839': 'Хэйлунцзян', 'CHN-1828': 'Гирин (Цзилинь)',
  'CHN-1813': 'Фэнтянь (Ляонин)', 'CHN-1838': 'Внутренняя Монголия',
  'CHN-1155': 'Пекин', 'CHN-1819': 'Шанхай', 'CHN-1154': 'Чунцин',
  'CHN-1662': 'Тибет', 'CHN-1756': 'Синьцзян',
};

export const POPULATION_1946: Record<string, number> = {
  'DEU-1601': 4500, 'DEU-1600': 2800, 'DEU-3487': 2500, 'DEU-3488': 2100,
  'DEU-1577': 2300, 'DEU-1591': 7000, 'DEU-1574': 4000, 'DEU-1575': 600,
  'DEU-1573': 6500, 'DEU-1576': 6000, 'DEU-1572': 10000, 'DEU-1579': 2200,
  'DEU-1578': 1600, 'DEU-1580': 3800, 'DEU-1581': 1000, 'DEU-1599': 3300,
  'DEU-1599-USSR': 800, 'DEU-1599-USA': 700, 'DEU-1599-UK': 1000, 'DEU-1599-FRA': 800,
  'CHN-1839': 5000, 'CHN-1828': 4000, 'CHN-1813': 8000, 'CHN-1838': 6000,
  'CHN-1811': 25000, 'CHN-1805': 12000, 'CHN-1804': 10000, 'CHN-1803': 1500,
  'CHN-1150': 8000, 'CHN-1814': 35000, 'CHN-1816': 4000, 'CHN-1155': 4200,
  'CHN-1819': 4500, 'CHN-1818': 35000, 'CHN-1820': 20000, 'CHN-1178': 15000,
  'CHN-1179': 25000, 'CHN-1812': 28000, 'CHN-1807': 22000, 'CHN-1808': 25000,
  'CHN-1817': 18000, 'CHN-1180': 30000, 'CHN-1152': 18000, 'CHN-1775': 2000,
  'CHN-1810': 15000, 'CHN-1153': 10000, 'CHN-1809': 50000, 'CHN-1154': 8000,
  'CHN-1756': 4000, 'CHN-1662': 1000, 'CHN-1151': 2000,
};

export const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  USSR: { urbanization: 0.35, stability: 0.58, infrastructure: 0.42, development: 0.49 },
  USA: { urbanization: 0.64, stability: 0.90, infrastructure: 0.88, development: 0.95 },
  UK: { urbanization: 0.80, stability: 0.72, infrastructure: 0.74, development: 0.86 },
  FRA: { urbanization: 0.55, stability: 0.56, infrastructure: 0.55, development: 0.73 },
  Germany: { urbanization: 0.62, stability: 0.30, infrastructure: 0.44, development: 0.71 },
  'DEU-USSR': { urbanization: 0.60, stability: 0.30, infrastructure: 0.35, development: 0.65 },
  'DEU-USA': { urbanization: 0.62, stability: 0.35, infrastructure: 0.45, development: 0.70 },
  'DEU-UK': { urbanization: 0.63, stability: 0.35, infrastructure: 0.42, development: 0.68 },
  'DEU-FRA': { urbanization: 0.60, stability: 0.30, infrastructure: 0.38, development: 0.66 },
  CAN: { urbanization: 0.55, stability: 0.82, infrastructure: 0.73, development: 0.87 },
  China: { urbanization: 0.18, stability: 0.42, infrastructure: 0.23, development: 0.31 },
  Taiwan: { urbanization: 0.24, stability: 0.52, infrastructure: 0.28, development: 0.37 },
  JPN: { urbanization: 0.35, stability: 0.40, infrastructure: 0.30, development: 0.55 },
  ITA: { urbanization: 0.48, stability: 0.55, infrastructure: 0.48, development: 0.65 },
  KOR: { urbanization: 0.20, stability: 0.35, infrastructure: 0.20, development: 0.30 },
  IND: { urbanization: 0.15, stability: 0.45, infrastructure: 0.25, development: 0.25 },
  AUS: { urbanization: 0.55, stability: 0.85, infrastructure: 0.65, development: 0.82 },
  BRA: { urbanization: 0.35, stability: 0.55, infrastructure: 0.35, development: 0.45 },
  MEX: { urbanization: 0.40, stability: 0.50, infrastructure: 0.35, development: 0.45 },
  ARG: { urbanization: 0.50, stability: 0.55, infrastructure: 0.45, development: 0.55 },
  EGY: { urbanization: 0.25, stability: 0.40, infrastructure: 0.20, development: 0.30 },
  TUR: { urbanization: 0.25, stability: 0.40, infrastructure: 0.25, development: 0.35 },
  IRN: { urbanization: 0.20, stability: 0.35, infrastructure: 0.25, development: 0.30 },
  SAF: { urbanization: 0.42, stability: 0.50, infrastructure: 0.45, development: 0.55 },
  POL: { urbanization: 0.35, stability: 0.40, infrastructure: 0.35, development: 0.40 },
  YUG: { urbanization: 0.28, stability: 0.35, infrastructure: 0.30, development: 0.35 },
  NOR: { urbanization: 0.45, stability: 0.85, infrastructure: 0.55, development: 0.75 },
  SWE: { urbanization: 0.50, stability: 0.85, infrastructure: 0.60, development: 0.80 },
  DEN: { urbanization: 0.55, stability: 0.80, infrastructure: 0.60, development: 0.78 },
  FIN: { urbanization: 0.35, stability: 0.70, infrastructure: 0.40, development: 0.60 },
  NED: { urbanization: 0.60, stability: 0.75, infrastructure: 0.65, development: 0.80 },
  BEL: { urbanization: 0.58, stability: 0.70, infrastructure: 0.60, development: 0.78 },
  SWI: { urbanization: 0.45, stability: 0.85, infrastructure: 0.75, development: 0.85 },
  AUT: { urbanization: 0.50, stability: 0.52, infrastructure: 0.40, development: 0.60 },
  CZE: { urbanization: 0.45, stability: 0.35, infrastructure: 0.45, development: 0.55 },
  HUN: { urbanization: 0.42, stability: 0.35, infrastructure: 0.38, development: 0.42 },
  ROU: { urbanization: 0.28, stability: 0.35, infrastructure: 0.28, development: 0.35 },
  IDN: { urbanization: 0.15, stability: 0.40, infrastructure: 0.15, development: 0.22 },
  THA: { urbanization: 0.18, stability: 0.50, infrastructure: 0.20, development: 0.28 },
  VNM: { urbanization: 0.15, stability: 0.30, infrastructure: 0.15, development: 0.20 },
  MAL: { urbanization: 0.25, stability: 0.55, infrastructure: 0.30, development: 0.38 },
  IRQ: { urbanization: 0.25, stability: 0.30, infrastructure: 0.20, development: 0.28 },
  SAU: { urbanization: 0.15, stability: 0.50, infrastructure: 0.10, development: 0.20 },
  ETH: { urbanization: 0.08, stability: 0.35, infrastructure: 0.08, development: 0.12 },
  NGA: { urbanization: 0.12, stability: 0.30, infrastructure: 0.10, development: 0.15 },
  CON: { urbanization: 0.10, stability: 0.25, infrastructure: 0.10, development: 0.15 },
  NZL: { urbanization: 0.52, stability: 0.85, infrastructure: 0.58, development: 0.80 },
  GRE: { urbanization: 0.38, stability: 0.45, infrastructure: 0.30, development: 0.40 },
};

export function getResourceProfile(ownerId: string | null): Record<string, number> {
  switch (ownerId) {
    case 'USSR': return { coal: 1.0, iron: 0.95, oil: 0.65, gas: 0.55, grain: 0.9, timber: 0.85, uranium: 0.65 };
    case 'USA': return { coal: 0.8, iron: 0.75, oil: 0.85, gas: 0.7, grain: 0.95, timber: 0.6, uranium: 0.55 };
    case 'UK': return { coal: 0.55, iron: 0.45, oil: 0.35, gas: 0.3, grain: 0.4, timber: 0.35, uranium: 0.25 };
    case 'FRA': return { coal: 0.55, iron: 0.5, oil: 0.3, gas: 0.25, grain: 0.7, timber: 0.4, uranium: 0.35 };
    case 'Germany': case 'DEU-USSR': case 'DEU-USA': case 'DEU-UK': case 'DEU-FRA':
      return { coal: 0.85, iron: 0.75, oil: 0.3, gas: 0.25, grain: 0.55, timber: 0.35, uranium: 0.35 };
    case 'CAN': return { coal: 0.6, iron: 0.65, oil: 0.75, gas: 0.75, grain: 0.55, timber: 1.0, uranium: 0.7 };
    case 'China': return { coal: 0.85, iron: 0.65, oil: 0.45, gas: 0.35, grain: 0.75, timber: 0.55, uranium: 0.35 };
    case 'JPN': return { coal: 0.4, iron: 0.2, oil: 0.1, gas: 0.1, grain: 0.3, timber: 0.45, uranium: 0.1 };
    case 'ITA': return { coal: 0.15, iron: 0.25, oil: 0.1, gas: 0.15, grain: 0.55, timber: 0.25, uranium: 0.1 };
    case 'AUS': return { coal: 0.75, iron: 0.65, oil: 0.3, gas: 0.25, grain: 0.55, timber: 0.35, uranium: 0.65 };
    case 'IND': return { coal: 0.7, iron: 0.6, oil: 0.15, gas: 0.1, grain: 0.6, timber: 0.5, uranium: 0.25 };
    case 'BRA': return { coal: 0.25, iron: 0.75, oil: 0.15, gas: 0.1, grain: 0.5, timber: 0.85, uranium: 0.2 };
    case 'SAU': case 'IRQ': return { coal: 0.05, iron: 0.05, oil: 0.95, gas: 0.85, grain: 0.05, timber: 0.05, uranium: 0.05 };
    case 'IRN': return { coal: 0.15, iron: 0.2, oil: 0.85, gas: 0.75, grain: 0.2, timber: 0.15, uranium: 0.1 };
    case 'IDN': return { coal: 0.25, iron: 0.15, oil: 0.65, gas: 0.55, grain: 0.35, timber: 0.75, uranium: 0.1 };
    case 'NGA': return { coal: 0.25, iron: 0.15, oil: 0.35, gas: 0.35, grain: 0.3, timber: 0.5, uranium: 0.1 };
    case 'CON': return { coal: 0.15, iron: 0.25, oil: 0.1, gas: 0.1, grain: 0.15, timber: 0.85, uranium: 0.65 };
    case 'NOR': return { coal: 0.1, iron: 0.15, oil: 0.35, gas: 0.4, grain: 0.1, timber: 0.25, uranium: 0.1 };
    case 'SAF': return { coal: 0.75, iron: 0.35, oil: 0.1, gas: 0.1, grain: 0.2, timber: 0.15, uranium: 0.65 };
    case 'MEX': return { coal: 0.35, iron: 0.35, oil: 0.65, gas: 0.55, grain: 0.4, timber: 0.3, uranium: 0.15 };
    case 'ARG': return { coal: 0.15, iron: 0.15, oil: 0.35, gas: 0.35, grain: 0.75, timber: 0.25, uranium: 0.1 };
    case 'POL': return { coal: 0.9, iron: 0.25, oil: 0.15, gas: 0.2, grain: 0.45, timber: 0.35, uranium: 0.15 };
    case 'ROU': return { coal: 0.35, iron: 0.2, oil: 0.55, gas: 0.5, grain: 0.45, timber: 0.3, uranium: 0.15 };
    default: return { coal: 0.2, iron: 0.2, oil: 0.2, gas: 0.2, grain: 0.2, timber: 0.2, uranium: 0.1 };
  }
}

export const VERY_SMALL_COUNTRIES = new Set([
  'HKG', 'MAC', 'LUX', 'MCO', 'AND', 'SMR', 'LIE', 'MLT', 'SGP', 'BRN', 'VAT', 'BHR', 'QAT',
]);

export const SMALL_COUNTRIES: Record<string, number> = {
  SVN: 2, MKD: 2, XKX: 2, MDA: 3, CYP: 2, ISL: 2, KWT: 2,
  COM: 1, SWZ: 2, SLE: 3, BLZ: 2, NIC: 3, GTM: 4,
  LBN: 2, JOR: 2, OMN: 2, YEM: 3, ARE: 2,
  EST: 2, LVA: 2, LTU: 2, ALB: 2, MNE: 2, BIH: 3,
  LSO: 1, BWA: 2, NAM: 2, MWI: 2, RWA: 2, BDI: 2, TGO: 2, BEN: 2,
  GNB: 1, GMB: 1, LBR: 3,
  CRI: 2, PAN: 2, SLV: 2, HND: 3,
  GUY: 2, SUR: 1, TTO: 2, JAM: 2,
  MUS: 1, MDV: 1, BTN: 1, NPL: 3, MNG: 2,
};

export const MEDIUM_COUNTRIES: Record<string, number> = {
  DNK: 4, NOR: 5, SWE: 6, FIN: 4, IRL: 3,
  PRT: 4, GRC: 5, BGR: 4, HUN: 5, AUT: 4,
  CHE: 4, NLD: 5, BEL: 4, CZE: 5, SVK: 3,
  HRV: 3, SRB: 4,
  TKM: 2, KGZ: 2, TJK: 2, GEO: 3, ARM: 2, AZE: 3,
  LBY: 4, TUN: 3, DZA: 5, MAR: 5,
  SDN: 5, SOM: 3, ETH: 6, ERI: 2,
  KEN: 4, UGA: 3, TZA: 5,
  GHA: 3, CIV: 4, SEN: 3, MLI: 3, BFA: 3, NER: 3,
  TCD: 3, CAF: 2, GAB: 2, COG: 2,
  AGO: 5, MOZ: 5, ZMB: 3, ZWE: 3,
  SYR: 3, LBN: 2, IRQ: 4, JOR: 2, YEM: 3,
  AFG: 4, MMR: 5, LAO: 2, KHM: 3,
  MYS: 5, PHL: 6, PRK: 5, KOR: 6,
  MNG: 2, NPL: 3, LKA: 3,
  BOL: 4, PRY: 2, URY: 2, ECU: 3,
  CUB: 4, DOM: 3, HTI: 3, GTM: 4,
  NZL: 3, PNG: 3,
};

export function getMergeTarget(iso: string): number | null {
  if (VERY_SMALL_COUNTRIES.has(iso)) return 1;
  if (SMALL_COUNTRIES[iso]) return SMALL_COUNTRIES[iso];
  if (MEDIUM_COUNTRIES[iso]) return MEDIUM_COUNTRIES[iso];
  return null;
}