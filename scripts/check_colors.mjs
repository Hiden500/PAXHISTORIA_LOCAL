import fs from 'fs';
const files = ['Germany', 'Italy', 'China', 'Taiwan'];
for (const f of files) {
  const c = fs.readFileSync(`server/src/data/countries/${f}.ts`, 'utf8');
  const name = c.match(/name:\s*"([^"]+)"/);
  const color = c.match(/color:\s*"([^"]+)"/);
  console.log(`${f}: ${name?.[1] || '?'} | ${color?.[1] || '?'}`);
}