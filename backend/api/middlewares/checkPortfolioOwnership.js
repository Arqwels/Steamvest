const { Portfolio } = require('../models');

async function checkPortfolioOwnership(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Не авторизован' });

    const portfolioId = Number(req.params.portfolioId || req.query.portfolioId || req.body.portfolioId);
    if (!portfolioId) return res.status(400).json({ message: 'portfolioId обязательный' });

    const portfolio = await Portfolio.findOne({ where: { id: portfolioId, userId } });
    if (!portfolio) return res.status(403).json({ message: 'Нет доступа к этому портфелю' });

    req.portfolio = portfolio;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = checkPortfolioOwnership;
