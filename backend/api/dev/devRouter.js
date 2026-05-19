const { Router } = require('express');
const skinsController = require('./controllers/skinsController');
const steamCommissionService = require('../services/steamCommissionService');
const exchangeRateService = require('../services/exchangeRateService');
const router = Router();

// Endpoint для получения всех скинов и сохранения в БД
// Можно и без лимита, но будет получать слишком долго и все данные (около 24к)
// http://localhost:5000/api/dev/skins-data/?limit=10
router.get('/skins-data', skinsController.skinsData);


// http://localhost:5000/api/dev/skin/:id/history
router.get('/skin/:id/history', skinsController.skinHistory);

router.post('/skin/add-history/:id', skinsController.addHistorySkin);

// http://localhost:5000/api/dev/skin/:id/24hours
router.get('/skin/:id/24hours', skinsController.getting24Percent);

// POST http://localhost:5000/api/dev/rates/fetch - вручную загрузить курсы
router.post('/rates/fetch', async (req, res) => {
  try {
    await exchangeRateService.fetchAndSaveRates();
    const rates = await exchangeRateService.getAllRates();
    res.json({ message: `Загружено ${Object.keys(rates).length} курсов`, rates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET http://localhost:5000/api/dev/rates - показать все курсы из БД
router.get('/rates', async (req, res) => {
  try {
    const rates = await getAllRates();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET http://localhost:5000/api/dev/commission?price=4.32 - проверить комиссию
// price — цена в рублях (то что платит покупатель)
router.get('/commission', async (req, res) => {
  const price = parseFloat(req.query.price);
  if (!price) return res.status(400).json({ message: 'Укажи ?price=100' });

  const [result] = await steamCommissionService.calcBatch([{ price_skin: price }], 'price_skin');
  res.json({
    входная_цена_руб: price,
    ...result,
  });
});

module.exports = router;
