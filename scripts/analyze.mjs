import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('client/src/assets/gam_map.json', 'utf8'));

const targets = ['LVA','SVN','MKD','UGA','BFA','HTI','KOS','LKA','TWN','USA','CAN','RUS','GBR','FRA','DEU'];
const stats = {};

for (const f of raw.features) {
  const p = f.properties || {};
  const a3 = p.adm0_a3 || '';
  const sr = p.scalerank || 5;
  if (targets.includes(a3)) {
    if (!stats[a3]) stats[a3] = {};
    stats[a3][sr] = (stats[a3][sr] || 0) + 1;
  }
}

for (const [iso, data] of Object.entries(stats).sort()) {
  console.log(iso + ':');
  for (let i = 1; i <= 5; i++) {
    console.log('  sr' + i + ': ' + (data[i] || 0));
  }
}