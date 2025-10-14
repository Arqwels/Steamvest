const { Router } = require('express');
const checkPortfolioOwnership = require('../middlewares/checkPortfolioOwnership');
const saleController = require('../controllers/saleController');
const router = Router();

router.get('/', checkPortfolioOwnership, saleController.receivingSales);

router.delete('/:saleId', checkPortfolioOwnership, saleController.deleteSales);

module.exports = router;
