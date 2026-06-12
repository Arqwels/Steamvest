const cron = require('node-cron');
const syncSkins = require('./jobs/syncSkins');
const syncStats = require('./jobs/syncStats');
const syncRates = require('./jobs/syncRates');
const { runJob } = require('./jobs/runner');

// Основной парсер скинов — каждые 6 часов
cron.schedule('0 */6 * * *', () => runJob('syncSkins', syncSkins));

// Парсер статистики — раз в день в 21:00
cron.schedule('0 3 * * *', () => runJob('syncStats', syncStats));

// Курсы валют — каждые 6 часов, независимо от Steam парсера
cron.schedule('0 */6 * * *', async () => {
  try {
    await syncRates();
  } catch (err) {
    console.error('[Cron] Ошибка курсов:', err.message);
  }
});

console.log('[Cron] Планировщик запущен');
