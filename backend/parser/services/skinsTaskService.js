const steamService = require('./steamService');
const skinsService = require('./skinsService');
const priceHistoryService = require('./priceHistoryService');
const steamAuthService = require('./steamAuthService');
const SkinsParserRun = require('../../api/models/skinsParserRun');
const { notifySkinsCompleted, notifySkinsStopped } = require('./telegramService');

async function fetchAndSaveSkins(limit = null) {
  let run = null;
  let savedCount = 0;
  let failedCount = 0;

  try {
    // Создаём запись прогона
    run = await SkinsParserRun.create({ status: 'running' });
    console.log(`[SkinsTaskService] 📝 Прогон #${run.id} создан`);

    // Обновляем secure token
    const secureToken = await steamAuthService.init();
    steamService.setLoginSecure(secureToken);

    // Получаем сырые данные
    const raw = await steamService.fetchAllSkins(limit);

    // Убираем дубликаты по hash_name
    const unique = [...new Map(raw.map(item => [item.hash_name, item])).values()];
    const totalCount = unique.length;

    await run.update({ total_count: totalCount });
    console.log(`[SkinsTaskService] Получено ${totalCount} скинов — сохраняем в БД`);

    // Записываем или обновляем скины в БД
    const dbSkins = await skinsService.upsertSkins(unique);
    savedCount = dbSkins.length;
    failedCount = totalCount - savedCount;

    await run.update({ saved_count: savedCount, failed_count: failedCount });

    // Фиксируем историю цен
    await priceHistoryService.recordHistory(dbSkins, unique);

    // Завершение
    const durationMin = Math.round((Date.now() - new Date(run.started_at).getTime()) / 60_000);

    await run.update({
      finished_at:  new Date(),
      status:       'completed',
      saved_count:  savedCount,
      failed_count: failedCount,
    });

    console.log(`\n[SkinsTaskService] Готово — 💾 ${savedCount} | ❌ ${failedCount} | ⏱ ${durationMin} мин`);
    await notifySkinsCompleted(run.id, totalCount, savedCount, failedCount, durationMin);

    return unique;
  } catch (err) {
    console.error(`[SkinsTaskService] 🛑 Критическая ошибка: ${err.message}`);

    if (run) {
      await run.update({
        finished_at:  new Date(),
        status:       'stopped',
        saved_count:  savedCount,
        failed_count: failedCount,
        stop_reason:  err.message.slice(0, 120),
      }).catch(e => console.error('[SkinsTaskService] Ошибка финализации:', e.message));

      await notifySkinsStopped(run.id, savedCount, failedCount, err.message.slice(0, 80));
    }

    throw err;
  }
}

module.exports = { fetchAndSaveSkins };
