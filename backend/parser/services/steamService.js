const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { searchParamsNamesSkins, headers } = require('../../api/config/consts');

const PROXY_LIST = (process.env.PROXY_LIST || process.env.PROXY_URL || '')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean);

class ProxyRotator {
  constructor(proxyList) {
    this.list = proxyList;
    this.index = 0;
    this.failCounts = {};
    this.usedSet = new Set();
  }

  current() {
    return this.list[this.index] || null;
  }

  next() {
    if (this.list.length === 0) return null;
    this.index = (this.index + 1) % this.list.length;
    const proxy = this.list[this.index];
    console.log(`[ProxyRotator] 🔄 Переключились на прокси #${this.index + 1}/${this.list.length}: ${this._mask(proxy)}`);
    return proxy;
  }

  markFailed(proxy) {
    this.failCounts[proxy] = (this.failCounts[proxy] || 0) + 1;
    console.warn(`[ProxyRotator] ❌ Прокси #${this.index + 1} получил 429 (всего раз: ${this.failCounts[proxy]}): ${this._mask(proxy)}`);
  }

  getAgent() {
    const proxy = this.current();
    if (!proxy) return undefined;
    this.usedSet.add(proxy);
    return new HttpsProxyAgent(proxy);
  }

  // Замаскированные URL прокси, использованных в прогоне — для StatsParserRun.proxies_used
  getUsedMasked() {
    return [...this.usedSet].map(url => this._mask(url));
  }

  // Сбрасываем перед новым прогоном
  resetUsed() {
    this.usedSet.clear();
  }

  _mask(url) {
    return url ? url.replace(/:([^@]+)@/, ':****@') : 'none';
  }

  status() {
    const proxy = this.current();
    return proxy
      ? `прокси #${this.index + 1}/${this.list.length} (${this._mask(proxy)})`
      : 'без прокси (прямое соединение)';
  }
}

const rotator = new ProxyRotator(PROXY_LIST);

if (PROXY_LIST.length > 0) {
  console.log(`[SteamService] 🌐 Прокси загружены: ${PROXY_LIST.length} шт. | текущий: ${rotator._mask(rotator.current())}`);
} else {
  console.warn('[SteamService] ⚠️  Прокси не заданы, работаем без прокси');
}

class SteamService {
  constructor() {
    this.requestCount = 0;
    this.steamLoginSecure = null;
    this.useProxy = false; // по умолчанию — прямое соединение
  }

  setLoginSecure(token) {
    this.steamLoginSecure = token;
    console.log('[SteamService] SteamLoginSecure установлен');
  }

  async makeRequestWithRetry(url, config, retries = 3) {
    let attempt = 0;
    let lastError;

    while (attempt < retries) {
      // Используем прокси только если был 429 раньше
      const agent = this.useProxy ? rotator.getAgent() : undefined;

      try {
        return await axios.get(url, {
          ...config,
          ...(agent ? { httpsAgent: agent, proxy: false } : {}),
        });
      } catch (error) {
        lastError = error;
        const status = error.response?.status;

        if (status === 429) {
          attempt++;

          if (!this.useProxy && rotator.current()) {
            // Первый 429 — включаем прокси
            this.useProxy = true;
            console.warn(` ⏸️ 429 с прямого IP — включаем прокси: ${rotator.status()}`);
          } else if (this.useProxy && rotator.current()) {
            // Прокси тоже получил 429 — переключаем на следующий
            rotator.markFailed(rotator.current());
            rotator.next();
            console.warn(` ⏸️ 429 через прокси — переключились на ${rotator.status()}`);
          } else {
            // Прокси нет — просто ждём
            console.warn(` ⏸️ 429 — прокси не заданы, пауза 10 мин`);
            await new Promise(res => setTimeout(res, 10 * 60_000));
          }

          continue;
        }

        if (status === 502) {
          attempt++;
          const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10) * 1000;
          console.log(`Повтор ${attempt}/${retries} через ${retryAfter}мс из-за 502`);
          await new Promise(res => setTimeout(res, retryAfter));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async fetchSkinsBatch(start, count) {
    this.requestCount++;

    if (!this.steamLoginSecure) {
      throw new Error('[SteamService] Ошибка: SteamLoginSecure не задан. Вызовите setLoginSecure(token)');
    }

    return this.makeRequestWithRetry(
      'https://steamcommunity.com/market/search/render/',
      {
        params: { ...searchParamsNamesSkins, start, count },
        headers: {
          ...headers,
          Cookie: `steamLoginSecure=${this.steamLoginSecure}`
        }
      }
    );
  }

  async fetchAllSkins(limit = null) {
    console.log(`[SteamService] Запуск fetchAllSkins с лимитом=${limit}`);

    const defaultCount = 10;
    let start = 0;
    let all = [];
    let consecutiveEmptyBatches = 0;
    const maxEmptyBatches = 10;

    while (true) {
      const batchSize = limit ? Math.min(defaultCount, limit - all.length) : defaultCount;
      if (limit && batchSize <= 0) break;

      let emptyRetries = 0;
      let data;

      while (emptyRetries < 5) {
        try {
          ({ data } = await this.fetchSkinsBatch(start, batchSize));
        } catch (err) {
          console.log(`[SteamService] Ошибка при fetchSkinsBatch на start=${start}: ${err.message}. Повтор через 2с`);
          await new Promise(res => setTimeout(res, 2000));
          emptyRetries++;
          continue;
        }

        if (data.results && data.results.length) {
          break;
        }

        console.log(`[SteamService] Пустой батч на start=${start}, retry ${emptyRetries + 1}/5`);
        emptyRetries++;
        await new Promise(res => setTimeout(res, 2000));
      }

      if (!data || !data.results?.length) {
        consecutiveEmptyBatches++;
        console.log(`[SteamService] После ${emptyRetries} попыток батч пуст. Пустых батчей подряд: ${consecutiveEmptyBatches}/${maxEmptyBatches}`);

        if (consecutiveEmptyBatches >= maxEmptyBatches) {
          console.log(`[SteamService] Достигнут лимит пустых батчей подряд (${maxEmptyBatches}). Завершаем.`);
          break;
        }

        start += defaultCount;
        continue;
      }

      consecutiveEmptyBatches = 0;

      const totalCount = limit ? Math.min(data.total_count, limit) : data.total_count;
      all.push(...data.results);
      console.log(`[SteamService] Суммарно получено ${all.length}/${totalCount}`);

      if (all.length >= totalCount) {
        console.log('[SteamService] Достигли totalCount, завершаем');
        break;
      }

      start += defaultCount;
      await new Promise(res => setTimeout(res, 1500));
    }

    console.log('[SteamService] Завершён fetchAllSkins');
    return all;
  }

  async fetchPriceHistory(marketHashName) {
    if (!this.steamLoginSecure) {
      throw new Error('[SteamService] Ошибка: SteamLoginSecure не задан');
    }

    return this.makeRequestWithRetry(
      'https://steamcommunity.com/market/pricehistory/',
      {
        params: {
          appid: 730,
          market_hash_name: marketHashName,
          currency: 5
        },
        headers: {
          ...headers,
          Cookie: `steamLoginSecure=${this.steamLoginSecure}`
        }
      }
    );
  }
}

const instance = new SteamService();

instance.proxyStatus = () => rotator.status();
instance.getUsedProxiesMasked = () => rotator.getUsedMasked();
instance.resetProxyTracking = () => rotator.resetUsed();

module.exports = instance;
