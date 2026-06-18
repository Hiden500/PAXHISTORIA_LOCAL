import http from 'http';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  try {
    console.log('1. Список сценариев:');
    const scenarios = await request('GET', '/scenarios/list');
    console.log(`   Статус: ${scenarios.status}, сценариев: ${scenarios.data.length}`);

    console.log('2. Старт игры (1836, СССР):');
    const game = await request('POST', '/game/start', { scenarioId: '1836', playerCountryId: 'USSR' });
    console.log(`   Статус: ${game.status}, дата: ${game.data.currentDate}, стран: ${game.data.countries.length}, регионов: ${game.data.regions.length}`);

    console.log('3. Получение состояния:');
    const state = await request('GET', '/game/state');
    console.log(`   Статус: ${state.status}, дата: ${state.data.currentDate}`);

    console.log('4. Следующий ход:');
    const next = await request('POST', '/game/next-turn');
    console.log(`   Статус: ${next.status}, дата: ${next.data.currentDate}`);

    console.log('✅ ВСЁ РАБОТАЕТ!');
  } catch (e) {
    console.error('❌ ОШИБКА:', e.message);
  }
}

test();