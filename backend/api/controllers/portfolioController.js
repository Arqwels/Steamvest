const { Portfolio, Invest, Skins, sequelize, Sale } = require('../models');

class PortfolioController {
  async createPortfolio (req, res) {
    try {
      const { namePortfolio } = req.body;
      const userId = req.user.id;

      if (!namePortfolio) {
        return res.status(400).json({ message: 'Название портфолио обязательно' });
      }

      if (namePortfolio.length > 30) {
        return res.status(400).json({ message: 'Название должно быть до 30 символов' });
      }

      const newPortfolio = await Portfolio.create({
        namePortfolio,
        userId,
        isActive: false
      });
      return res.status(201).json(newPortfolio);
    } catch (error) {
      console.error('Ошибка при создании портфолио', error);
      return res.status(500).json({ message: 'Ошибка при создании портфолио!' });
    }
  }

  async getAllPortfolios(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Не авторизован' });
      }

      let portfolios = await Portfolio.findAll({
        where: { userId },
        order: [['id', 'ASC']]
      });

      // Если портфолио нет вовсе, создаём начальное
      if (portfolios.length === 0) {
        const defaultPortfolio = await Portfolio.create({
          namePortfolio: 'My Portfolio',
          isActive: true,
          userId
        });
        portfolios = [defaultPortfolio];
      }

      return res.status(200).json(portfolios);
    } catch (error) {
      console.error('Ошибка при получении портфолио:', error);
      return res.status(500).json({ message: 'Ошибка при получении портфолио!' });
    }
  }

  async getActivePortfolio(req, res) {
    try {
      const userId = req.user.id;
      let portfolio = await Portfolio.findOne({
        where: { userId, isActive: true },
        include: [
          {
            model: Invest,
            as: 'investments',
            include: [
              { model: Skins, as: 'skin' }
            ]
          }
        ]
      });

      if (!portfolio) {
        const allPortfolios = await Portfolio.findAll({
          where: { userId },
          order: [['createdAt', 'ASC']]
        });
        if (allPortfolios.length === 0) {
          // Нет портфолио вообще — создаём и возвращаем новое
          portfolio = await Portfolio.create({
            namePortfolio: 'My Portfolio',
            isActive: true,
            userId
          });
        } else {
          await sequelize.transaction(async (t) => {
            await Portfolio.update(
              { isActive: false },
              { where: { userId }, transaction: t }
            );
            await Portfolio.update(
              { isActive: true },
              { where: { id: allPortfolios[0].id, userId }, transaction: t }
            );
          });

          portfolio = await Portfolio.findByPk(allPortfolios[0].id, { 
            include: [
              { model: Invest, as: 'investments', include: [ { model: Skins, as: 'skin' } ] }
            ]
          });
        }
      }

      return res.status(200).json(portfolio);
    } catch (error) {
      console.error('Ошибка при получении активного портфолио:', error);
      return res.status(500).json({ message: 'Ошибка при получении активного портфолио!' });
    }
  }

  async renamePortfolio(req, res) {
    try {
      const userId = req.user.id;
      const { portfolioId } = req.params;
      const { namePortfolio } = req.body;

      if (!namePortfolio || namePortfolio.length > 30) {
        return res.status(400).json({ message: 'Новое название портфолио обязательно и до 30 символов' });
      }

      const existing = await Portfolio.findOne({
        where: { id: portfolioId, userId }
      });
      if (!existing) {
        return res.status(404).json({ message: 'Портфолио не найдено' });
      }

      await Portfolio.update(
        { namePortfolio },
        { where: { id: portfolioId, userId } }
      );
      const updatedPortfolio = await Portfolio.findOne({
        where: { id: portfolioId, userId }
      });

      return res.status(200).json(updatedPortfolio);
    } catch (error) {
      console.error('Ошибка при переименовании портфолио:', error);
      return res.status(500).json({ message: 'Ошибка при переименовании портфолио!' });
    }
  }

  async activatePortfolio(req, res) {
    try {
      const userId = req.user.id;
      const { portfolioId } = req.params;

      const result = await sequelize.transaction(async (t) => {
        await Portfolio.update(
          { isActive: false },
          { where: { userId }, transaction: t }
        );

        const [updated] = await Portfolio.update(
          { isActive: true },
          { where: { id: portfolioId, userId }, transaction: t }
        );

        return updated;
      });

      if (!result) {
        return res.status(404).json({ message: 'Портфолио не найдено' });
      }

      return res.json({ message: 'Портфолио активировано' });
    } catch (error) {
      console.error('Ошибка при активации портфолио:', error);
      return res.status(500).json({ message: 'Ошибка при активации портфолио!' });
    }
  }

  async deletePortfolio(req, res) {
    const trx = await sequelize.transaction();
    try {
      const userId = req.user.id;
      const portfolio = req.portfolio;
      const portfolioId = Number(portfolio.id);

      const deletedSalesCount = await Sale.destroy({
        where: { portfolioId },
        transaction: trx,
      });

      const deletedInvestCount = await Invest.destroy({
        where: { portfolioId },
        transaction: trx,
      });

      await portfolio.destroy({ transaction: trx });

      const activeExists = await Portfolio.findOne({
        where: { userId, isActive: true },
        transaction: trx,
      });

      if (!activeExists) {
        const next = await Portfolio.findOne({
          where: { userId },
          order: [['createdAt', 'ASC']],
          transaction: trx,
        });
        if (next) {
          await Portfolio.update(
            { isActive: true },
            { where: { id: next.id }, transaction: trx }
          );
        }
      }

      await trx.commit();
      return res.status(200).json({
        message: 'Портфолио успешно удалено',
        deleted: {
          portfolioId: portfolio.id,
          portfolioName: portfolio.namePortfolio,
          sales: deletedSalesCount,
          investments: deletedInvestCount,
        },
      });
    } catch (error) {
      console.error('Ошибка при удалении портфолио:', error);
      if (trx.finished !== 'commit' && trx.finished !== 'rollback') {
        await trx.rollback();
      }
      return res.status(500).json({ message: 'Ошибка при удалении портфолио!' });
    }
  }
}

module.exports = new PortfolioController();
