import fs from 'fs';

// Загрузка GeoJSON
const geoJson = JSON.parse(fs.readFileSync('client/public/world-map-compressed.geojson', 'utf8'));

// Проверяем структуру одного немецкого региона
const germany = geoJson.features.filter(f => f.properties.adm0_a3 === 'DEU');
if (germany.length > 0) {
  console.log('=== СТРУКТУРА НЕМЕЦКОГО РЕГИОНА ===');
  console.log(JSON.stringify(germany[0].properties, null, 2));
}

// Проверяем все свойства
console.log('\n=== ВСЕ СВОЙСТВА НЕМЕЦКИХ РЕГИОНОВ ===');
germany.forEach(f => {
  console.log(`ID: "${f.properties.id}" | name: "${f.properties.name}" | country: "${f.properties.country}" | iso_a2: "${f.properties.iso_a2}" | adm0_a3: "${f.properties.adm0_a3}"`);
});
