const { Router } = require('express');
const skinsController = require('./controllers/skinsController');
const steamCommissionService = require('../services/steamCommissionService');
const exchangeRateService = require('../services/exchangeRateService');
const rateParserService = require('../../parser/services/rateParserService');
const { runJob, getStatus } = require('../../parser/jobs/runner');
const syncSkins = require('../../parser/jobs/syncSkins');
const syncStats = require('../../parser/jobs/syncStats');
const router = Router();

// http://localhost:5000/api/dev/skin/:id/history
router.get('/skin/:id/history', skinsController.skinHistory);

router.post('/skin/add-history/:id', skinsController.addHistorySkin);

// http://localhost:5000/api/dev/skin/:id/24hours
router.get('/skin/:id/24hours', skinsController.getting24Percent);

// POST http://localhost:5000/api/dev/rates/fetch
router.post('/rates/fetch', async (req, res) => {
  try {
    await rateParserService.fetchAndSaveRates();
    const rates = await exchangeRateService.getAllRates();
    res.json({ message: `Загружено ${Object.keys(rates).length} курсов`, rates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET http://localhost:5000/api/dev/rates
router.get('/rates', async (req, res) => {
  try {
    const rates = await exchangeRateService.getAllRates();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET http://localhost:5000/api/dev/commission?price=4.32
router.get('/commission', async (req, res) => {
  const price = parseFloat(req.query.price);
  if (!price) return res.status(400).json({ message: 'Укажи ?price=100' });

  const [result] = await steamCommissionService.calcBatch([{ price_skin: price }], 'price_skin');
  res.json({
    входная_цена_руб: price,
    ...result,
  });
});

// Запрос для парса всех скинов со Steam
// POST http://localhost:5000/api/dev/run/sync-skins?limit=100
router.post('/run/sync-skins', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const start = Date.now();
  try {
    const result = await runJob('syncSkins', () => syncSkins(limit));
    if (result?.skipped) return res.status(409).json({ error: 'Уже выполняется другой job' });
    res.json({ ok: true, job: 'syncSkins', name: 'Запрос для парса всех скинов со Steam', limit, elapsed: `${((Date.now() - start) / 1000).toFixed(1)}s` });
  } catch (err) {
    res.status(500).json({ ok: false, job: 'syncSkins', error: err.message });
  }
});

// Запрос для синхронизации статистики цен и объёмов продаж по скинам
// Сохраняет % изменение цены за 24ч/7д/30д, объём продаж и точки для графика.
// POST http://localhost:5000/api/dev/run/sync-stats?limit=100
router.post('/run/sync-stats', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const start = Date.now();
  try {
    const result = await runJob('syncStats', () => syncStats(limit));
    if (result?.skipped) return res.status(409).json({ error: 'Уже выполняется другой job' });
    res.json({ ok: true, job: 'syncStats', name: 'Синхронизация статистики цен и объёмов продаж', limit, elapsed: `${((Date.now() - start) / 1000).toFixed(1)}s` });
  } catch (err) {
    res.status(500).json({ ok: false, job: 'syncStats', error: err.message });
  }
});

// GET http://localhost:5000/api/dev/run/status
router.get('/run/status', (req, res) => {
  res.json(getStatus());
});

module.exports = router;
