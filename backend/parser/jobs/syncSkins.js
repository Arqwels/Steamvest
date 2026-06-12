/**
 * JOB: Парсинг скинов и текущих цен
 *
 * Источник: Steam Market /search/render
 * Расписание: каждые 6 часов
 * Записывает в: таблицу skins, skin_price_histories
 */
const { fetchAndSaveSkins } = require('../services/skinsTaskService');

module.exports = async function syncSkins(limit = null) {
  console.log(`[syncSkins] Старт${limit ? ` (limit: ${limit})` : ''}`);
  await fetchAndSaveSkins(limit);
  console.log('[syncSkins] Готово');
};
