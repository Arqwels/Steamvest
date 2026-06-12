const axios = require('axios');
const { searchParamsNamesSkins, headers } = require('../../api/config/consts');

class SteamService {
  constructor() {
    this.requestCount = 0;
    this.steamLoginSecure = null;
  }

  setLoginSecure(token) {
    this.steamLoginSecure = token;
    console.log('[SteamService] SteamLoginSecure установлен');
  }

  async makeRequestWithRetry(url, config, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await axios.get(url, config);
      } catch (error) {
        const status = error.response?.status;
        if (status === 429) {
          throw error;
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
    throw new Error('Достигнуто максимальное количество повторных попыток');
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
          currency: 5 // RUB
        },
        headers: {
          ...headers,
          Cookie: `steamLoginSecure=${this.steamLoginSecure}`
        }
      }
    );
  }
}

module.exports = new SteamService();
