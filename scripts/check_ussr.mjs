import fs from 'fs';
const j = JSON.parse(fs.readFileSync('client/src/assets/gam_map.json', 'utf8'));

// Проверяем все уникальные adm0_a3 коды
const codes = {};
j.features.forEach(f => {
  const c = f.properties?.adm0_a3 || '?';
  codes[c] = (codes[c] || 0) + 1;
});

// Смотрим specifically SUN и RUS
const sun = j.features.filter(f => f.properties?.adm0_a3 === 'SUN');
const rus = j.features.filter(f => f.properties?.adm0_a3 === 'RUS');

console.log('SUN:', sun.length, 'regions');
console.log('RUS:', rus.length, 'regions');
console.log('SUN names:', sun.map(f => f.properties?.name).slice(0, 5));
console.log('RUS names:', rus.map(f => f.properties?.name).slice(0, 5));

// Какие ещё территории были в СССР?
const ussrLike = ['UKR', 'BLR', 'GEO', 'ARM', 'AZE', 'KAZ', 'UZB', 'TKM', 'KGZ', 'TJK', 'EST', 'LVA', 'LTU', 'MDA'];
console.log('\nUSSR republics in data:');
ussrLike.forEach(code => {
  const count = codes[code] || 0;
  if (count > 0) console.log(`  ${code}: ${count}`);
});