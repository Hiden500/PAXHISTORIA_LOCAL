import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.resolve(__dirname, '../client/src/assets/gam_map.json');
const OUTPUT = path.resolve(__dirname, '../client/public/world-map-full.geojson');

function roundCoords(arr, decimals) {
  if (!Array.isArray(arr)) return arr;
  if (typeof arr[0] === 'number') {
    const factor = Math.pow(10, decimals);
    return [Math.round(arr[0] * factor) / factor, Math.round(arr[1] * factor) / factor];
  }
  return arr.map(item => roundCoords(item, decimals));
}

// ========== Sutherland-Hodgman Polygon Clipping ==========
// Обрезает полигон-субъект выпуклым полигоном-клиппером

function isInsideEdge(point, edgeStart, edgeEnd) {
  return (edgeEnd[0] - edgeStart[0]) * (point[1] - edgeStart[1]) -
         (edgeEnd[1] - edgeStart[1]) * (point[0] - edgeStart[0]) >= 0;
}

function lineIntersection(p1, p2, p3, p4) {
  const x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1];
  const x3 = p3[0], y3 = p3[1], x4 = p4[0], y4 = p4[1];
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return p1; // параллельные
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

function clipPolygon(subject, clip) {
  let output = [...subject];
  for (let i = 0; i < clip.length; i++) {
    if (output.length === 0) return [];
    const input = [...output];
    output = [];
    const edgeStart = clip[i];
    const edgeEnd = clip[(i + 1) % clip.length];
    for (let j = 0; j < input.length; j++) {
      const current = input[j];
      const previous = input[(j + input.length - 1) % input.length];
      const curInside = isInsideEdge(current, edgeStart, edgeEnd);
      const prevInside = isInsideEdge(previous, edgeStart, edgeEnd);
      if (curInside) {
        if (!prevInside) output.push(lineIntersection(previous, current, edgeStart, edgeEnd));
        output.push(current);
      } else if (prevInside) {
        output.push(lineIntersection(previous, current, edgeStart, edgeEnd));
      }
    }
  }
  return output;
}

// Создаёт прямоугольный клиппер из bbox
function makeClipRect(minX, minY, maxX, maxY) {
  return [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]];
}

console.log('Loading:', INPUT);
const raw = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
console.log('Original:', raw.features.length, 'features');

// Извлекаем полигон Берлина для обрезки секторов
const berlinFeature = raw.features.find(f => {
  const p = f.properties || {};
  return p.adm0_a3 === 'DEU' && (p.name === 'Berlin' || (p.name || '').toLowerCase().includes('berlin'));
});
const berlinPolygon = berlinFeature?.geometry?.type === 'Polygon' 
  ? berlinFeature.geometry.coordinates[0] 
  : null;

console.log('Berlin polygon:', berlinPolygon ? `${berlinPolygon.length} vertices` : 'NOT FOUND');

const regions = [];

for (const f of raw.features) {
  const props = f.properties || {};
  if (!f.geometry) continue;

  const name = props.name || props.name_en || 'Unknown';
  const adm0 = props.adm0_a3 || '';
  const geom = f.geometry;

  // Исключаем Berlin из DEU — заменяем на 4 сектора
  if (adm0 === 'DEU' && (name === 'Berlin' || name.toLowerCase().includes('berlin'))) {
    continue; // Пропускаем, добавим сектора отдельно
  }
  
  // Исключаем Германию целиком — разделим на 4 зоны оккупации
  if (adm0 === 'DEU') {
    continue; // Обработаем отдельно ниже
  }
  
  // Китай — оставляем оригинальные регионы как есть

  regions.push({
    type: 'Feature',
    properties: {
      name: name,
      iso_a2: props.iso_a2 || '',
      adm0_a3: adm0,
      type: 'region'
    },
    geometry: {
      type: geom.type,
      coordinates: roundCoords(geom.coordinates, 3)
    }
  });
}

// Океаны
const oceans = [
  { name: 'Pacific Ocean', coords: [[[-180,-90],[-180,0],[0,0],[0,-90],[-180,-90]]] },
  { name: 'Atlantic Ocean', coords: [[[0,-90],[0,90],[30,90],[30,-90],[0,-90]]] },
  { name: 'Indian Ocean', coords: [[[30,-90],[30,30],[90,30],[90,-90],[30,-90]]] },
  { name: 'Arctic Ocean', coords: [[[-180,60],[180,60],[180,90],[-180,90],[-180,60]]] },
  { name: 'Southern Ocean', coords: [[[-180,-90],[180,-90],[180,-60],[-180,-60],[-180,-90]]] },
];

const oceanFeatures = oceans.map(o => ({
  type: 'Feature',
  properties: {
    name: o.name,
    iso_a2: 'OCEAN',
    adm0_a3: 'OCEAN',
    type: 'ocean',
    color: '#1a3a5c'
  },
  geometry: { type: 'Polygon', coordinates: o.coords }
}));

// ========== Берлин — 4 сектора оккупации ==========
// Обрезаем реальный полигон Берлина 4 прямоугольными клипперами

// Границы секторов (приблизительные по реальным данным 1946):
// Горизонтальная линия: y = 52.510 (отделяет American от British)
// Вертикальная линия: x = 13.385 (отделяет Soviet от Western)
// Французский сектор: маленькая область Wedding/Mitte (13.28-13.385, 52.51-52.57)

const berlinSectors = [
  {
    name: 'Berlin (Soviet Sector)',
    adm0_a3: 'SUN',
    // Восточная часть — всё что восточнее x=13.385
    clip: makeClipRect(13.385, 52.300, 13.800, 52.700)
  },
  {
    name: 'Berlin (American Sector)',
    adm0_a3: 'USA',
    // Юго-запад — западнее 13.385, южнее 52.510
    clip: makeClipRect(13.050, 52.300, 13.385, 52.510)
  },
  {
    name: 'Berlin (British Sector)',
    adm0_a3: 'GBR',
    // Северо-запад — западнее 13.385, севернее 52.510
    clip: makeClipRect(13.050, 52.510, 13.385, 52.700)
  },
  {
    name: 'Berlin (French Sector)',
    adm0_a3: 'FRA',
    // Маленький центральный сектор — Wedding / часть Mitte
    // Вырезаем из западной части (13.28-13.385, 52.51-52.57)
    clip: makeClipRect(13.280, 52.510, 13.385, 52.570)
  }
];

const berlinFeatures = [];
if (berlinPolygon) {
  for (const sector of berlinSectors) {
    const clipped = clipPolygon(berlinPolygon, sector.clip);
    if (clipped.length >= 3) {
      berlinFeatures.push({
        type: 'Feature',
        properties: {
          name: sector.name,
          iso_a2: '',
          adm0_a3: sector.adm0_a3,
          type: 'region',
          berlin_zone: true
        },
        geometry: {
          type: 'Polygon',
          coordinates: [roundCoords(clipped, 3)]
        }
      });
      console.log(`  ${sector.name}: ${clipped.length} vertices`);
    } else {
      console.log(`  ${sector.name}: clipping produced ${clipped.length} vertices — SKIPPED`);
    }
  }
} else {
  console.log('WARNING: Berlin polygon not found, using rectangles');
  // Fallback: прямоугольники
  for (const sector of berlinSectors) {
    const [minX, minY, maxX, maxY] = [sector.clip[0][0], sector.clip[0][1], sector.clip[2][0], sector.clip[2][1]];
    berlinFeatures.push({
      type: 'Feature',
      properties: {
        name: sector.name,
        iso_a2: '',
        adm0_a3: sector.adm0_a3,
        type: 'region',
        berlin_zone: true
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]]
      }
    });
  }
}

// ========== Германия — 4 зоны оккупации ==========
// Собираем все регионы DEU и обрезаем по зонам
const germanyRegions = raw.features.filter(f => {
  const p = f.properties || {};
  return p.adm0_a3 === 'DEU' && f.geometry && 
    !(p.name === 'Berlin' || (p.name || '').toLowerCase().includes('berlin'));
});

// Объединяем все полигоны Германии в один MultiPolygon
function mergeGermanRegions(features) {
  const allCoords = [];
  for (const f of features) {
    const geom = f.geometry;
    if (geom.type === 'Polygon') allCoords.push(geom.coordinates);
    else if (geom.type === 'MultiPolygon') allCoords.push(...geom.coordinates);
  }
  if (allCoords.length === 0) return null;
  return allCoords.length === 1 ? allCoords[0] : allCoords;
}

const germanyCoords = mergeGermanRegions(germanyRegions);
console.log('Germany regions:', germanyRegions.length, '| polygons:', germanyCoords?.length || 0);

// Зоны оккупации Германии 1946:
// Советская зона — восточная (восточнее ~11.5°E, включая Бранденбург, Саксонию, Тюрингию, Мекленбург)
// Американская зона — юго-западная (Бавария, Гессен, Вюртемберг-Баден)
// Британская зона — северо-западная (Нижняя Саксония, Северный Рейн-Вестфалия, Шлезвиг-Гольштейн, Гамбург)
// Французская зона — юго-западная (Рейнланд-Пфальц, Саар, Баден-Вюртемберг запад)

const germanyZones = [
  {
    name: 'Soviet Occupation Zone',
    adm0_a3: 'DEU-S',  // Советская зона
    clip: makeClipRect(11.5, 47.0, 15.5, 55.5)
  },
  {
    name: 'American Occupation Zone',
    adm0_a3: 'DEU-A',  // Американская зона
    clip: makeClipRect(6.0, 47.0, 11.5, 51.0)
  },
  {
    name: 'British Occupation Zone',
    adm0_a3: 'DEU-B',  // Британская зона
    clip: makeClipRect(6.0, 51.0, 11.5, 55.5)
  },
  {
    name: 'French Occupation Zone',
    adm0_a3: 'DEU-F',  // Французская зона
    clip: makeClipRect(6.0, 47.0, 8.5, 50.0)
  }
];

const germanyFeatures = [];
if (germanyCoords) {
  // mergeGermanRegions возвращает массив polygon coords:
  // Каждый элемент — координаты одного полигона (Polygon coords или MultiPolygon polygon)
  // Для Polygon coords = [[ring]], элемент = [[ring]]
  // Для MultiPolygon coords = [[ring1], [ring2]], элемент = [[ring1], [ring2]]
  // Нужно для каждого элемента взять только внешний ring [0] для обрезки
  
  console.log(`  Germany: ${germanyCoords.length} polygon coordinate sets`);
  
  for (const zone of germanyZones) {
    const clippedPolys = [];
    
    for (const polyCoords of germanyCoords) {
      // polyCoords — это координаты одного полигона
      // Это может быть [[ring]] (Polygon) или [[ring1], [ring2]...] (MultiPolygon с дырами)
      // Берём только внешний ring для обрезки
      const outerRing = polyCoords[0];
      if (!outerRing || outerRing.length < 3) continue;
      
      const clipped = clipPolygon(outerRing, zone.clip);
      if (clipped.length >= 3) {
        clippedPolys.push(roundCoords(clipped, 3));
      }
    }
    
    if (clippedPolys.length > 0) {
      // Каждый полигон — отдельная Feature с ОДИНАКОВЫМ именем зоны (без цифр)
      for (const poly of clippedPolys) {
        germanyFeatures.push({
          type: 'Feature',
          properties: {
            name: zone.name,
            iso_a2: '',
            adm0_a3: zone.adm0_a3,
            type: 'region',
            occupation_zone: true
          },
          geometry: {
            type: 'Polygon',
            coordinates: [poly]
          }
        });
      }
      console.log(`  ${zone.name}: ${clippedPolys.length} polygons`);
    }
  }
}

const allFeatures = [...oceanFeatures, ...regions, ...berlinFeatures, ...germanyFeatures];

const output = {
  type: 'FeatureCollection',
  features: allFeatures
};

const json = JSON.stringify(output);
const sizeMB = (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2);
console.log(`\nOutput: ${allFeatures.length} features (${regions.length} regions + ${oceanFeatures.length} oceans + ${berlinFeatures.length} berlin)`);
console.log('Size:', sizeMB, 'MB');

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, json);
console.log('Saved to', OUTPUT);