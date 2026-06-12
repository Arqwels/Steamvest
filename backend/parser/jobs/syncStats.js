/**
 * JOB: Парсинг истории цен и подсчёт статистики
 *
 * Источник: Steam Market /pricehistory
 * Расписание: раз в день в 21:00
 * Записывает в: таблицы skin_stats, skin_charts
 * 
 * Считает:
 *  - Изменение цены за 36ч / 7д / 30д (%)
 *  - Объём продаж за 36ч / 7д / 30д
 *  - Среднюю цену за 36ч
 *  - Точки для графика (адаптивно: 7д / 30д / all)
 */
const { fetchAndSaveStats } = require('../services/steamStatsService');

module.exports = async function syncStats(limit = null) {
  console.log('[syncStats] Старт');
  await fetchAndSaveStats(limit);
  console.log('[syncStats] Готово');
};
