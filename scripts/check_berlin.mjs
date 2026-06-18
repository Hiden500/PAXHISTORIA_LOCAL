import fs from 'fs';

const d = JSON.parse(fs.readFileSync('client/src/assets/gam_map.json', 'utf8'));

const berlinMatches = d.features.filter(f => {
  const p = f.properties || {};
  const n = (p.name || '').toLowerCase();
  const na = (p.name_alt || '').toLowerCase();
  const ne = (p.name_en || '').toLowerCase();
  return n.includes('berlin') || na.includes('berlin') || ne.includes('berlin');
});

console.log('Berlin matches:', berlinMatches.length);
berlinMatches.forEach(f => {
  const p = f.properties;
  console.log(JSON.stringify({
    name: p.name,
    adm0_a3: p.adm0_a3,
    iso_a2: p.iso_a2,
    scalerank: p.scalerank,
    geom_type: f.geometry?.type
  }));
});

// Все DEU фичи с Berlin
const deuBerlin = d.features.filter(f => 
  f.properties?.adm0_a3 === 'DEU' && 
  (f.properties?.name || '').toLowerCase().includes('berlin')
);
console.log('DEU Berlin:', deuBerlin.length);

// Координаты Berlin в DEU
if (deuBerlin.length > 0) {
  const fb = deuBerlin[0];
  console.log('Berlin sample coords:', JSON.stringify(fb.geometry.coordinates).slice(0, 200));
}