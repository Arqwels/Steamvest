const steamService = require('./steamService');
const steamAuthService = require('./steamAuthService');
const SkinStats = require('../../api/models/skinStats');
const SkinChart = require('../../api/models/skinChart');
const SkinsModel = require('../../api/models/skinsModel');
const StatsParserRun   = require('../../api/models/statsParserRun');
const {
  notifyStatsCompleted,
  notifyProxiesExhausted,
} = require('./telegramService');

// --- Настройки ---
const CONCURRENCY   = parseInt(process.env.CONCURRENCY)    || 10;   // параллельных запросов
const RPS           = parseFloat(process.env.RPS)          || 10;   // запросов в секунду
const RETRY_LIMIT   = parseInt(process.env.RETRY_LIMIT)    || 3;
const BATCH_PAUSE   = parseInt(process.env.BATCH_PAUSE_MS) || 200;  // пауза между батчами

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// --- Rate limiter (токен-бакет) ---
class RateLimiter {
  constructor(rps) {
    this.interval = 1000 / rps;
    this.lastCall = 0;
  }
  async wait() {
    const now = Date.now();
    const wait = this.interval - (now - this.lastCall);
    if (wait > 0) await delay(wait);
    this.lastCall = Date.now();
  }
}

// --- Fetch с ретраями ---
async function fetchWithRetry(fn, retries = RETRY_LIMIT) {
  let total429Wait = 0;
  const MAX_429_WAIT = 30 * 60_000; // 30 минут — потом стоп

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.response?.status === 429 || err?.message?.includes('429');

      if (is429) {
        const waitMs = 10 * 60_000 * attempt; // 10 мин, 20 мин, 30 мин
        total429Wait += waitMs;

        if (total429Wait >= MAX_429_WAIT) {
          console.error(`\n[StatsService] 🛑 30 минут ожидания из-за 429 — останавливаем парсинг`);
          // Бросаем специальный сигнал
          const stopErr = new Error('PARSE_STOP_429');
          stopErr.isStop = true;
          throw stopErr;
        }

        console.warn(`   ⏸️  429 — пауза ${waitMs / 60_000} мин (попытка ${attempt}/${retries})`);
        await delay(waitMs);
      } else {
        if (attempt === retries) throw err;
        await delay(1000 * attempt);
      }
    }
  }
}

// --- Вся твоя оригинальная логика (не тронута) ---

function parseSteamDate(str) {
  const clean = str.replace(': +0', '').trim();
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

function removeOutliers(prices) {
  if (prices.length < 4) return prices;
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return sorted.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
}

function cleanMedian(periodPoints) {
  const prices = removeOutliers(periodPoints.map(p => p.price));
  if (!prices.length) return null;
  const mid = Math.floor(prices.length / 2);
  return prices.length % 2 !== 0
    ? prices[mid]
    : (prices[mid - 1] + prices[mid]) / 2;
}

function calcChange(points, hoursAgo) {
  const now = Date.now();
  const cutoff = new Date(now - hoursAgo * 36e5);
  const prevCutoff = new Date(now - hoursAgo * 36e5 * 2);

  const currentPeriod = points.filter(p => p.date >= cutoff);
  const prevPeriod = points.filter(p => p.date >= prevCutoff && p.date < cutoff);

  if (currentPeriod.length === 0) return null;
  const currentMedian = cleanMedian(currentPeriod);
  if (!currentMedian) return null;

  let baseMedian;
  if (prevPeriod.length >= 2) {
    baseMedian = cleanMedian(prevPeriod);
  } else {
    const before = points.filter(p => p.date < cutoff);
    if (!before.length) return null;
    baseMedian = cleanMedian(before.slice(-5));
  }

  if (!baseMedian || baseMedian === 0) return null;
  return parseFloat(((currentMedian - baseMedian) / baseMedian * 100).toFixed(2));
}

function calcChangeDay(points) {
  const result = calcChange(points, 24);
  if (result !== null) return result;
  return calcChange(points, 36);
}

function calcVolume(points, hoursAgo) {
  const cutoff = new Date(Date.now() - hoursAgo * 36e5);
  return points.filter(p => p.date >= cutoff).reduce((s, p) => s + p.volume, 0);
}

function calcAvg(points, hoursAgo) {
  const cutoff = new Date(Date.now() - hoursAgo * 36e5);
  const period = points.filter(p => p.date >= cutoff);
  if (!period.length) return null;
  const prices = removeOutliers(period.map(p => p.price));
  if (!prices.length) return null;
  return parseFloat((prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(4));
}

function getChartPoints(points, skinId) {
  const now = Date.now();
  let cutoff = new Date(now - 7 * 24 * 36e5);
  let chartPoints = points.filter(p => p.date >= cutoff);
  let period = '7d';

  if (chartPoints.length < 5) {
    cutoff = new Date(now - 30 * 24 * 36e5);
    chartPoints = points.filter(p => p.date >= cutoff);
    period = '30d';
  }
  if (chartPoints.length < 5) {
    chartPoints = points.slice(-10);
    period = 'all';
  }

  return {
    period,
    points: chartPoints.map(p => ({
      skin_id: skinId,
      price: p.price,
      volume: p.volume,
      recorded_at: p.date,
      chart_period: period
    }))
  };
}

// --- Обработка одного скина ---
async function processSkin(skin, rateLimiter, index, total) {
  console.log(`[${index + 1}/${total}] ${skin.market_hash_name}`);

  try {
    await rateLimiter.wait();

    const { data } = await fetchWithRetry(() =>
      steamService.fetchPriceHistory(skin.market_hash_name)
    );

    if (!data?.success || !data.prices?.length) {
      console.warn(` ⚠️ Нет данных`);
      return 'failed';
    }

    const points = data.prices
      .map(([dateStr, priceStr, volStr]) => ({
        date: parseSteamDate(dateStr),
        price: parseFloat(priceStr),
        volume: parseInt(volStr) || 0
      }))
      .filter(p => p.date && !isNaN(p.price));

    const stats = {
      skin_id: skin.id,
      price_change_day:   calcChangeDay(points),
      price_change_week:  calcChange(points, 168),
      price_change_month: calcChange(points, 720),
      volume_day:         calcVolume(points, 24),
      volume_week:        calcVolume(points, 168),
      volume_month:       calcVolume(points, 720),
      avg_price_day:      calcAvg(points, 24),
      updated_at:         new Date()
    };

    await SkinStats.upsert(stats, { conflictFields: ['skin_id'] });

    const { period, points: chartPoints } = getChartPoints(points, skin.id);
    if (chartPoints.length) {
      await SkinChart.destroy({ where: { skin_id: skin.id } });
      await SkinChart.bulkCreate(chartPoints);
    }

    console.log(`  ✅ change_day: ${stats.price_change_day}% | vol_day: ${stats.volume_day} | chart: ${chartPoints.length} точек (${period})`);
    return 'success';

  } catch (err) {
    if (err.isStop) throw err;
    console.error(`  ❌ Ошибка: ${err.message}`);
    return 'failed';
  }
}

// --- Главная функция с параллельными батчами ---
async function fetchAndSaveStats(limit = null) {
  let success = 0;
  let failed = 0;
  let run = null;

  try {
    const secureToken = await steamAuthService.init();
    steamService.setLoginSecure(secureToken);

    const queryOptions = { order: [['id', 'ASC']] };
    if (limit) queryOptions.limit = limit;

    const skins = await SkinsModel.findAll(queryOptions);
    const totalSkins = skins.length;

    console.log(`[StatsService] Обрабатываем ${skins.length} скинов | concurrency: ${CONCURRENCY} | rps: ${RPS}`);
    console.log(`[StatsService] 🌐 ${steamService.proxyStatus()}`);

    steamService.resetProxyTracking();
    run = await StatsParserRun.create({ total_skins: totalSkins, status: 'running' });
    console.log(`[StatsService] 📝 Прогон #${run.id} создан`);

    const rateLimiter = new RateLimiter(RPS);
    let totalProcessed = 0;

    // Разбиваем на батчи
    for (let i = 0; i < skins.length; i += CONCURRENCY) {
      const batch = skins.slice(i, i + CONCURRENCY);

      const results = await Promise.all(
        batch.map((skin, j) => processSkin(skin, rateLimiter, i + j, skins.length))
      );

      results.forEach(r => r === 'success' ? success++ : failed++);
      totalProcessed += batch.length;

      await run.update({ success_count: success, failed_count: failed });

      // Пауза каждые 10k
      if (totalProcessed % 10_000 < CONCURRENCY && totalProcessed < skins.length) {
        console.log(`\n[StatsService] ⏸️  Пауза 10 минут после ${totalProcessed} запросов...\n`);
        await delay(5 * 60_000);
      } else if (i + CONCURRENCY < skins.length) {
        await delay(BATCH_PAUSE);
      }
    }

    const proxiesUsed = steamService.getUsedProxiesMasked();
    const durationMin = Math.round((Date.now() - new Date(run.started_at).getTime()) / 60_000);

    await run.update({
      finished_at:   new Date(),
      status:        'completed',
      success_count: success,
      failed_count:  failed,
      proxies_used:  proxiesUsed,
    });

    console.log(`\n[StatsService] Готово — ✅ ${success} | ❌ ${failed} | ⏱ ${durationMin} мин`);
    await notifyStatsCompleted(run.id, totalSkins, success, failed, durationMin);
  } catch (err) {
    if (err.isStop) {
      console.log(`\n[StatsService] 🛑 Парсинг остановлен — ✅ ${success} | ❌ ${failed}`);
      if (run) {
        await run.update({
          finished_at:   new Date(),
          status:        'stopped',
          success_count: success,
          failed_count:  failed,
          proxies_used:  steamService.getUsedProxiesMasked(),
          stop_reason:   '429_limit',
        }).catch(e => console.error('[StatsService] Ошибка финализации:', e.message));
        await notifyProxiesExhausted(run.id, success, failed);
      }
      return; // выходим gracefully, всё что успели — сохранено
    }

    if (run) {
      await run.update({
        finished_at:   new Date(),
        status:        'stopped',
        success_count: success,
        failed_count:  failed,
        proxies_used:  steamService.getUsedProxiesMasked(),
        stop_reason:   err.message.slice(0, 120),
      }).catch(() => {});
    }
    throw err;
  }
}

module.exports = { fetchAndSaveStats };
