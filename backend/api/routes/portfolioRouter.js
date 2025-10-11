const { Router } = require('express');
const portfolioController = require('../controllers/portfolioController');
const checkPortfolioOwnership = require('../middlewares/checkPortfolioOwnership');
const router = Router();

// Создание портфолио
router.post('/', checkPortfolioOwnership, portfolioController.createPortfolio);

// Список всех портфолио
router.get('/', portfolioController.getAllPortfolios);

// Получить активное портфолио
router.get('/active', checkPortfolioOwnership, portfolioController.getActivePortfolio);

// Установить портфолио активным
router.patch('/:portfolioId/activate', checkPortfolioOwnership, portfolioController.activatePortfolio);

// Переименовать портфолио
router.patch('/:portfolioId', checkPortfolioOwnership, portfolioController.renamePortfolio);

// Удаление портфолио
router.delete('/:portfolioId', checkPortfolioOwnership, portfolioController.deletePortfolio);

module.exports = router;
