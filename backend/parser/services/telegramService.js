const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const BOT_TOKEN     = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const PROXY_URL     = process.env.TELEGRAM_PROXY;

const httpsAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

async function sendMessage(text) {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn('[Telegram] BOT_TOKEN или ADMIN_CHAT_ID не заданы — пропускаем');
    return;
  }
  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      { chat_id: ADMIN_CHAT_ID, text, parse_mode: 'HTML' },
      { timeout: 8_000, httpsAgent, proxy: false }
    );
  } catch (err) {
    console.error('[Telegram] Ошибка отправки:', err.message);
  }
}

// ─── Skins Parser ────────────────────────────────────────────────

async function notifySkinsCompleted(runId, totalCount, savedCount, failedCount, durationMin) {
  await sendMessage(
    `✅ <b>Steamvest — Скины получены</b>\n\n` +
    `Прогон <b>#${runId}</b> | ⏱ ${durationMin} мин\n` +
    `📦 Найдено на Steam: <b>${totalCount}</b>\n` +
    `💾 Записано в БД: <b>${savedCount}</b>\n` +
    `❌ Ошибок: <b>${failedCount}</b>`
  );
}

async function notifySkinsStopped(runId, savedCount, failedCount, reason) {
  await sendMessage(
    `🛑 <b>Steamvest — Парсинг скинов остановлен</b>\n\n` +
    `Прогон <b>#${runId}</b>\n` +
    `💾 Записано: <b>${savedCount}</b>\n` +
    `❌ Ошибок: <b>${failedCount}</b>\n` +
    `Причина: <code>${reason}</code>`
  );
}

// ─── Stats Parser ─────────────────────────────────────────────────

async function notifyStatsCompleted(runId, totalSkins, successCount, failedCount, durationMin) {
  const rate = totalSkins > 0
    ? ((successCount / totalSkins) * 100).toFixed(1)
    : '0.0';
  await sendMessage(
    `✅ <b>Steamvest — Статистика обновлена</b>\n\n` +
    `Прогон <b>#${runId}</b> | ⏱ ${durationMin} мин\n` +
    `📦 Обработано скинов: <b>${totalSkins}</b>\n` +
    `✅ Успешно: <b>${successCount}</b> (${rate}%)\n` +
    `❌ Ошибок: <b>${failedCount}</b>`
  );
}

async function notifyProxiesExhausted(runId, successCount, failedCount) {
  await sendMessage(
    `🛑 <b>Steamvest — Прокси исчерпаны</b>\n\n` +
    `Прогон <b>#${runId}</b> остановлен по 429\n` +
    `✅ Успешно: <b>${successCount}</b>\n` +
    `❌ Ошибок: <b>${failedCount}</b>\n\n` +
    `⚠️ Добавьте новые прокси и перезапустите парсер.`
  );
}

// ─── Proxy Checker ────────────────────────────────────────────────

async function notifyProxyCheckDone(summary) {
  const { total, active, exhausted, dead } = summary;
  const icon = active === 0 ? '🔴' : active < total / 2 ? '🟡' : '🟢';
  await sendMessage(
    `${icon} <b>Steamvest — Результат проверки прокси</b>\n\n` +
    `Всего: ${total}\n` +
    `🟢 Активных: <b>${active}</b>\n` +
    `🟡 Исчерпаны (429): <b>${exhausted}</b>\n` +
    `🔴 Мёртвых: <b>${dead}</b>` +
    (active === 0 ? '\n\n⚠️ Все прокси недоступны! Парсинг невозможен.' : '')
  );
}

module.exports = {
  sendMessage,
  notifySkinsCompleted,
  notifySkinsStopped,
  notifyStatsCompleted,
  notifyProxiesExhausted,
  notifyProxyCheckDone,
};