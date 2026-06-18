import fs from 'fs';

// Загрузка GeoJSON
const geoJson = JSON.parse(fs.readFileSync('client/public/world-map-compressed.geojson', 'utf8'));

// Проверяем немецкие регионы
const germany = geoJson.features.filter(f => f.properties.adm0_a3 === 'DEU');
console.log('=== ГЕРМАНИЯ - ПРОВЕРКА МАППИНГА ===');
germany.forEach(f => {
  const props = f.properties;
  console.log(`ID: "${props.id}" | Name: "${props.name}" | adm0_a3: "${props.adm0_a3}"`);
});

// Проверяем маппинг
const REGION_TO_COUNTRY_MAP = {
  'DEU-1601': 'USSR',     // Sachsen
  'DEU-1591': 'USA',      // Bayern
  'DEU-1580': 'FRA',      // Rheinland-Pfalz
  'DEU-1581': 'FRA',      // Saarland
  'DEU-1579': 'UK',       // Schleswig-Holstein
  'DEU-1576': 'UK',       // Niedersachsen
  'DEU-1572': 'UK',       // Nordrhein-Westfalen
  'DEU-1573': 'USA',      // Baden-Württemberg
  'DEU-3487': 'USSR',     // Brandenburg
  'DEU-3488': 'USSR',     // Mecklenburg-Vorpommern
  'DEU-1575': 'USA',      // Bremen
  'DEU-1578': 'UK',       // Hamburg
  'DEU-1574': 'USA',      // Hessen
  'DEU-1577': 'USSR',     // Thüringen
  'DEU-1600': 'USSR',     // Sachsen-Anhalt
  'DEU-1599': 'USSR',     // Berlin
};

console.log('\n=== ПРОВЕРКА МАППИНГА ===');
germany.forEach(f => {
  const props = f.properties;
  const mapped = REGION_TO_COUNTRY_MAP[props.id];
  console.log(`"${props.id}" (${props.name}) -> ${mapped || 'NOT MAPPED'}`);
});
