/**
 * JOB: Парсинг курсов валют
 *
 * Источник: steaminventoryhelper.com
 * Расписание: каждые 6 часов
 * Записывает в: таблицу exchange_rates
 */
const rateParserService = require('../services/rateParserService');

module.exports = async function syncRates() {
  console.log('[syncRates] Старт');
  await rateParserService.fetchAndSaveRates();
  console.log('[syncRates] Готово');
};
