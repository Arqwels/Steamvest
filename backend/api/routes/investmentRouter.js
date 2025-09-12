const { Router } = require('express');
const investmentController = require('../controllers/investmentController');
const router = Router();
const { body } = require('express-validator');
const checkPortfolioOwnership = require('../middlewares/checkPortfolioOwnership');

// Создание инвестиции (portfolioId в body)
router.post('/', checkPortfolioOwnership, investmentController.additionInvestment);

// Получение инвестиций (portfolioId в query)
router.get('/', checkPortfolioOwnership, investmentController.receivingInvestments);

// Общая сумма инвестиций
router.get('/:portfolioId/summary', checkPortfolioOwnership, investmentController.summaryInvestments);

// Обновление инвестиции
router.put(
  '/:id',
  body('countItems')
    .isInt({ min: 1 })
    .withMessage('Количество предметов не может быть меньше 1'),
  body('buyPrice')
    .isFloat({ min: 0.01 })
    .withMessage('Цена покупки не может быть ниже 0,01'),
  investmentController.updateInvestment
);

// Удаление инвестиции
router.delete('/:id', investmentController.deleteInvestment);

// Экспорт инвестиций в Excel (portfolioId в query)
router.get('/export', checkPortfolioOwnership, investmentController.exportInvestments);

router.post('/sale', checkPortfolioOwnership, investmentController.saleInvestments);

module.exports = router;
