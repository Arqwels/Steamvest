const axios = require('axios');

const API_BASE = process.env.INTERNAL_API_URL || 'http://localhost:3000/api';
const API_KEY  = process.env.INTERNAL_API_KEY;

const { formatSkinsRun, formatStatsRun } = require('../utils/format');

module.exports = async function statusCommand(ctx) {
  await ctx.reply('⏳ Получаю статус...');

  try {
    const [skinsRes, statsRes] = await Promise.all([
      axios.get(`${API_BASE}/admin/parser/skins/runs/current`, { headers: {} }),
      axios.get(`${API_BASE}/admin/parser/stats/runs/current`, { headers: {} }),
    ]);

    const skinsRun = skinsRes.data.run;
    const statsRun = statsRes.data.run;

    const skinsStatus = skinsRun?.status === 'running' ? '🔄 Запущен' : '⏹ Не активен';
    const statsStatus = statsRun?.status === 'running' ? '🔄 Запущен' : '⏹ Не активен';

    const text =
      `<b>📊 Текущий статус парсеров</b>\n\n` +
      `<b>Skins Parser</b> — ${skinsStatus}\n` +
      formatSkinsRun(skinsRun) +
      `\n\n` +
      `<b>Stats Parser</b> — ${statsStatus}\n` +
      formatStatsRun(statsRun);

    await ctx.reply(text, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('[TelegramBot/status]', err.message);
    await ctx.reply(`❌ Ошибка: ${err.message}`);
  }
};

function authHeader() {
  return API_KEY ? { 'x-internal-key': API_KEY } : {};
}
