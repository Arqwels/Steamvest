const axios      = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const ProxyModel = require('../../api/models/proxyModel');
const { notifyProxyCheckDone } = require('./telegramService');

const PROXY_LIST = (process.env.PROXY_LIST || process.env.PROXY_URL || '')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean);

const TIMEOUT_MS = 12_000;

// Лёгкий публичный endpoint Steam — не требует авторизации
const STEAM_CHECK_URL = 'https://api.steampowered.com/ISteamWebAPIUtil/GetServerInfo/v1/';
// Проверка, что через прокси вообще есть интернет
const ALIVE_CHECK_URL = 'https://api.ipify.org?format=json';

function maskUrl(url) {
  return url ? url.replace(/:([^@]+)@/, ':****@') : 'none';
}

async function checkProxy(url) {
  const agent  = new HttpsProxyAgent(url);
  const result = { is_alive: false, is_steam_ok: false };

  // 1. Проверяем связь
  try {
    await axios.get(ALIVE_CHECK_URL, {
      httpsAgent: agent,
      proxy: false,
      timeout: TIMEOUT_MS,
    });
    result.is_alive = true;
  } catch (err) {
    // Если хоть какой-то HTTP ответ пришёл — прокси живой
    if (err.response) {
      result.is_alive = true;
    } else {
      return result;
    }
  }

  // 2. Проверяем доступ к Steam
  try {
    const resp = await axios.get(STEAM_CHECK_URL, {
      httpsAgent: agent,
      proxy: false,
      timeout: TIMEOUT_MS,
    });
    result.is_steam_ok = resp.status === 200;
  } catch (err) {
    // 429 = Steam доступен, просто rate limit — прокси рабочий
    if (err?.response?.status === 429) {
      result.is_steam_ok = true;
    }
  }

  return result;
}

// Синхронизирует PROXY_LIST из .env в таблицу proxies
async function syncProxiesToDB() {
  if (!PROXY_LIST.length) {
    console.warn('[ProxyChecker] PROXY_LIST пуст — нечего синхронизировать');
    return 0;
  }
  for (const url of PROXY_LIST) {
    await ProxyModel.upsert({ url }, { conflictFields: ['url'] });
  }
  console.log(`[ProxyChecker] Синхронизировано ${PROXY_LIST.length} прокси из ENV`);
  return PROXY_LIST.length;
}

// Проверяет все прокси в БД параллельно и обновляет статусы
async function checkAllProxies() {
  let proxies = await ProxyModel.findAll();

  if (!proxies.length) {
    console.log('[ProxyChecker] Нет прокси в БД — синхронизируем из ENV...');
    await syncProxiesToDB();
    proxies = await ProxyModel.findAll();
  }

  if (!proxies.length) {
    console.warn('[ProxyChecker] Нет прокси ни в БД, ни в ENV');
    return { total: 0, active: 0, exhausted: 0, dead: 0 };
  }

  console.log(`[ProxyChecker] Проверяем ${proxies.length} прокси...`);

  await Promise.all(proxies.map(async (proxy) => {
    const { is_alive, is_steam_ok } = await checkProxy(proxy.url);

    const status = !is_alive      ? 'dead'
                 : !is_steam_ok   ? 'exhausted'
                 :                  'active';

    const updateData = {
      is_alive,
      is_steam_ok,
      status,
      last_checked_at: new Date(),
    };

    // Прокси восстановился — сбрасываем счётчик
    if (status === 'active' && proxy.status !== 'active') {
      updateData.fail_count = 0;
    }

    await proxy.update(updateData);
    console.log(`[ProxyChecker] ${maskUrl(proxy.url)} → alive:${is_alive} steam:${is_steam_ok} → ${status}`);
  }));

  const updated = await ProxyModel.findAll();
  const summary = {
    total:     updated.length,
    active:    updated.filter(p => p.status === 'active').length,
    exhausted: updated.filter(p => p.status === 'exhausted').length,
    dead:      updated.filter(p => p.status === 'dead').length,
  };

  console.log(`[ProxyChecker] Готово — 🟢 ${summary.active} | 🟡 ${summary.exhausted} | 🔴 ${summary.dead}`);
  await notifyProxyCheckDone(summary);

  return summary;
}

module.exports = { checkAllProxies, syncProxiesToDB };
