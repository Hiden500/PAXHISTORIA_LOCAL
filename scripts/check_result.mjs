import fs from 'fs';

const d = JSON.parse(fs.readFileSync('client/public/world-map-full.geojson', 'utf8'));

const cnt = {};
for (const f of d.features) {
  if (f.properties?.type !== 'region') continue;
  const a3 = f.properties.adm0_a3 || '?';
  cnt[a3] = (cnt[a3] || 0) + 1;
}

// Проблемные страны
const check = ['LVA','SVN','MKD','UGA','BFA','HTI','KOS','LKA','TWN','PHL','MLT','BHS','MDA','VNM','KHM','GBR','USA','CAN','RUS','FRA','DEU','ITA'];
console.log('=== Проблемные страны ===');
check.forEach(iso => {
  const n = cnt[iso] || 0;
  const warn = n > 10 ? '⚠️' : '✓';
  console.log(`  ${warn} ${iso}: ${n} regions`);
});

console.log(`\n=== Всего ===`);
console.log(`Features: ${d.features.length}`);
console.log(`Countries: ${Object.keys(cnt).length}`);