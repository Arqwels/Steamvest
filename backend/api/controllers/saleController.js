const { Sale, Skins, Portfolio } = require('../models');
const { Op } = require('sequelize');

class SaleController {
  /**
   * @router GET /api/sale
   * @description Получение истории продаж по портфелям
   */
  async receivingSales(req, res) {
    try {
      const { limit: qLimit, lastId: qLastId } = req.query;

      let limit = qLimit !== undefined ? Number(qLimit) : 25;
      if (Number.isNaN(limit) || limit <= 0) limit = 25;
      const MAX_LIMIT = 100;
      if (limit > MAX_LIMIT) limit = MAX_LIMIT;

      const where = { portfolioId: req.portfolio.id };

      if (qLastId) {
        const lastId = Number(qLastId);
        if (!Number.isNaN(lastId)) {
          where.id = { [Op.lt]: lastId };
        }
      }

      const sales = await Sale.findAll({
        where,
        include: [
          {
            model: Skins,
            as: 'skin'
          },
        ],
        limit: limit + 1,
        order: [['id', 'DESC']]
      });

      const hasMore = sales.length > limit;
      const items = hasMore ? sales.slice(0, limit) : sales;
      const last = items.length > 0 ? items[items.length - 1].id : null;

      return res.status(200).json({
        sales: items,
        meta: { lastId: last, hasMore, limit }
      });
    } catch (error) {
      console.error('Ошибка получения истории продаж!', error);
      return res.status(500).json({ ok: false, message: 'Ошибка получения истории продаж!' });
    }
  }

  /**
   * @router DELETE /api/sale/:saleId
   * @description Удаление продажи по ID
   */
  async deleteSales(req, res) {
    try {
      const userId = req.user.id;
      const saleId = req.params.saleId;

      const saleData = await Sale.findByPk(saleId, {
        include: [{ model: Portfolio, as: 'portfolio', where: { userId } }]
      });

      if (!saleData) {
        return res.status(404).json({ message: 'Такой предмет продажи был не найден!' });
      }

      await saleData.destroy();
      return res.status(200).json({ message: 'Предмет продажи успешно удален!' });
    } catch (error) {
      console.error('Ошибка при удалении предмета продажи!', error);
      return res.status(500).json({ message: 'Ошибка при удалении предмета продажи!' });
    }
  }
}

module.exports = new SaleController();
