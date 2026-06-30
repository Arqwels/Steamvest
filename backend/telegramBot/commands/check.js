const axios  = require('axios');

const API_BASE = process.env.INTERNAL_API_URL || 'http://localhost:3000/api';
const API_KEY  = process.env.INTERNAL_API_KEY;

module.exports = async function checkCommand(ctx) {
  try {
    await axios.post(`${API_BASE}/admin/proxies/check`, {}, {
      headers: {},
    });

    await ctx.reply(
      '🔍 Проверка прокси запущена\n\n' +
      'Результат придёт сюда же когда закончится.\n' +
      'Текущий статус: /proxies'
    );
  } catch (err) {
    if (err.response?.status === 409) {
      return ctx.reply('⚠️ Проверка уже запущена, подождите');
    }
    console.error('[TelegramBot/check]', err.message);
    await ctx.reply(`❌ Ошибка: ${err.message}`);
  }
};
