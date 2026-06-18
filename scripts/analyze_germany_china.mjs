import fs from 'fs';

// Загрузка GeoJSON
const geoJson = JSON.parse(fs.readFileSync('client/public/world-map-compressed.geojson', 'utf8'));

console.log('=== ГЕРМАНИЯ ===');
const germany = geoJson.features.filter(f => f.properties.adm0_a3 === 'DEU');
console.log(`Всего регионов: ${germany.length}`);
germany.forEach(f => {
  console.log(`  ${f.properties.id}: ${f.properties.name}`);
});

console.log('\n=== КИТАЙ ===');
const china = geoJson.features.filter(f => f.properties.adm0_a3 === 'CHN');
console.log(`Всего регионов: ${china.length}`);
china.forEach(f => {
  console.log(`  ${f.properties.id}: ${f.properties.name}`);
});
