const axios  = require('axios');
const { formatSkinsRun, formatStatsRun } = require('../utils/format');

const API_BASE = process.env.INTERNAL_API_URL || 'http://localhost:3000/api';
const API_KEY  = process.env.INTERNAL_API_KEY;

module.exports = async function lastrunCommand(ctx, type) {
  await ctx.reply('⏳ Загружаю...');

  try {
    const url = type === 'skins'
      ? `${API_BASE}/admin/parser/skins/runs`
      : `${API_BASE}/admin/parser/stats/runs`;

    const { data } = await axios.get(url, {
      params: { limit: 5 },
      headers: {},
    });

    if (!data.runs?.length) {
      return ctx.reply('— прогонов ещё не было');
    }

    const title = type === 'skins'
      ? '📋 <b>Последние прогоны Skins Parser</b>'
      : '📋 <b>Последние прогоны Stats Parser</b>';

    const body = data.runs
      .map(run => type === 'skins' ? formatSkinsRun(run) : formatStatsRun(run))
      .join('\n\n──────────────\n\n');

    await ctx.reply(`${title}\n\n${body}`, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('[TelegramBot/lastrun]', err.message);
    await ctx.reply(`❌ Ошибка: ${err.message}`);
  }
};
