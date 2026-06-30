const ExcelJS = require('exceljs');
const { Invest, Skins, Portfolio, Sale } = require('../models');
const ApiError = require('../exceptions/apiError');
const { validationResult } = require('express-validator');
const skinsHistoryPrice = require('../services/skinsHistoryPrice');
const steamCommissionService = require('../services/steamCommissionService');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../../db');

class InvestmentController {
  async additionInvestment(req, res) {
    try {
      const userId = req.user.id;
      const { portfolioId, idItem, countItems, buyPrice, dateBuyItem } = req.body;

      if (!portfolioId) return res.status(400).json({ message: 'portfolioId обязательный' });

      const existingSkin = await Skins.findByPk(idItem);
      if (!existingSkin) {
        return res.status(400).json({ message: 'Скин не найден!' });
      }

      const investment = await Invest.create({
        portfolioId,
        idItem,
        countItems,
        buyPrice,
        dateBuyItem
      });

      const fullInvestment = await Invest.findByPk(investment.id, {
        include: [{ model: Skins, as: 'skin' }]
      });

      const historyMap = await skinsHistoryPrice.getHistoryMap([fullInvestment.idItem]);
      const { changePrice = 0, changePercent = 0 } = historyMap[fullInvestment.idItem] || {};
      fullInvestment.setDataValue('changePrice', changePrice);
      fullInvestment.setDataValue('changePercent', changePercent);

      const [commissionResult] = await steamCommissionService.calcBatch([fullInvestment.skin], 'price_skin');
      const { sellerGetsRub } = commissionResult;

      const count = Number(countItems) || 0;
      const buyPriceNum = Number(buyPrice) || 0;
      const priceSkin = Number(fullInvestment.skin.price_skin) || 0;

      fullInvestment.setDataValue('investmentValue', +(buyPriceNum * count).toFixed(2));
      fullInvestment.setDataValue('assetsValue', +(sellerGetsRub * count).toFixed(2));
      fullInvestment.setDataValue('profitValue', +((sellerGetsRub - buyPriceNum) * count).toFixed(2));
      fullInvestment.setDataValue('profitPercent', buyPriceNum > 0
        ? +((priceSkin - buyPriceNum) / buyPriceNum * 100).toFixed(2)
        : 0
      );

      return res.status(201).json({
        message: 'Инвестиция успешно создана',
        investment: fullInvestment
      });
    } catch (error) {
      console.error('Ошибка при добавлении инвестиций!', error);
      return res.status(500).json({ message: 'Ошибка при добавлении инвестиций!' });
    }
  }

  async receivingInvestments (req, res) {
    try {
      const userId = req.user.id;
      const { portfolioId, limit: qLimit, offset: qOffset, sortBy = 'id', order = 'DESC' } = req.query;

      let limit = qLimit !== undefined ? Number(qLimit) : 20;
      if (Number.isNaN(limit) || limit <= 0) limit = 20;
      if (limit > 100) limit = 100;

      const offset = qOffset !== undefined ? Number(qOffset) : 0;
      const pid = portfolioId ? Number(portfolioId) : null;
      if (portfolioId && isNaN(pid)) return res.status(400).json({ message: 'Неверный портфель ID' });

      const where = pid ? { portfolioId: pid } : {};

      // changePercent/changePrice — виртуальные поля, считаются в JS
      // assetsValueNet/profitValueNet — тоже переопределяются в JS через комиссию
      const VIRTUAL_SORT_FIELDS = ['changePercent', 'changePrice'];
      const isVirtualSort = VIRTUAL_SORT_FIELDS.includes(sortBy);

      const sortMap = {
        id: 'id',
        price_item: sequelize.col('skin.price_skin'),
        investmentValue: sequelize.literal(`"invest"."buyPrice" * "invest"."countItems"`),
        buyPrice: sequelize.col('invest.buyPrice'),
        // profitValue и assetsValue в sortMap оставляем грязными (SQL) для сортировки в БД
        profitValue: sequelize.literal(`("skin"."price_skin" - "invest"."buyPrice") * "invest"."countItems"`),
        profitPercent: sequelize.literal(`CASE WHEN "invest"."buyPrice" > 0 THEN (("skin"."price_skin" - "invest"."buyPrice") / "invest"."buyPrice") * 100 ELSE 0 END`),
        assetsValue: sequelize.literal(`"skin"."price_skin" * "invest"."countItems"`),
      };

      const sortValue = sortMap[sortBy] || 'id';
      const sortOrder = typeof order === 'string' && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const investments = await Invest.findAll({
        where,
        attributes: {
          include: [
            [sequelize.literal(`"invest"."buyPrice" * "invest"."countItems"`), 'investmentValue'],
            // SQL-версии для сортировки; потом переопределим через setDataValue с учётом комиссии
            [sequelize.literal(`("skin"."price_skin" - "invest"."buyPrice") * "invest"."countItems"`), 'profitValue'],
            [sequelize.literal(`CASE WHEN "invest"."buyPrice" > 0 THEN (("skin"."price_skin" - "invest"."buyPrice") / "invest"."buyPrice") * 100 ELSE 0 END`), 'profitPercent'],
            [sequelize.literal(`"skin"."price_skin" * "invest"."countItems"`), 'assetsValue'],
          ],
        },
        include: [
          { model: Portfolio, as: 'portfolio', where: { userId }, attributes: ['id', 'namePortfolio'] },
          { model: Skins, as: 'skin' },
        ],
        limit: isVirtualSort ? undefined : limit,
        offset: isVirtualSort ? undefined : (offset > 0 ? offset : undefined),
        order: isVirtualSort ? [['id', 'DESC']] : [[sortValue, sortOrder], ['id', 'DESC']],
      });

      // Один батч-запрос для истории цен
      const idItems = investments.map((item) => item.idItem);
      const historyMap = idItems.length > 0 ? await skinsHistoryPrice.getHistoryMap(idItems) : {};

      // Один батч-запрос для комиссий — передаём skin объекты
      const skins = investments.map((inv) => inv.skin);
      const commissions = await steamCommissionService.calcBatch(skins, 'price_skin');

      // Переопределяем поля с учётом комиссии
      for (let i = 0; i < investments.length; i++) {
        const inv = investments[i];
        const { sellerGetsRub } = commissions[i];
        const count = Number(inv.countItems) || 0;
        const buyPrice = Number(inv.buyPrice) || 0;

        // history
        const { changePrice = 0, changePercent = 0 } = historyMap[inv.idItem] || {};
        inv.setDataValue('changePrice', changePrice);
        inv.setDataValue('changePercent', changePercent);

        // net-значения (с учётом комиссии)
        const assetsValueNet = +(sellerGetsRub * count).toFixed(2);
        const profitValueNet = +(( sellerGetsRub - buyPrice) * count).toFixed(2);
        inv.setDataValue('assetsValue', assetsValueNet);
        inv.setDataValue('profitValue', profitValueNet);
        // profitPercent оставляем грязным (уже посчитан в SQL)
      }

      if (isVirtualSort) {
        investments.sort((a, b) => {
          const aVal = a.getDataValue(sortBy) ?? 0;
          const bVal = b.getDataValue(sortBy) ?? 0;
          return sortOrder === 'ASC' ? aVal - bVal : bVal - aVal;
        });

        const paginated = investments.slice(offset, offset + limit);
        const hasMore = investments.length > offset + limit;

        return res.status(200).json({
          investments: paginated,
          meta: { lastId: paginated[paginated.length - 1]?.id ?? null, hasMore, limit },
        });
      }

      const hasMore = investments.length === limit;
      return res.status(200).json({
        investments,
        meta: { lastId: investments[investments.length - 1]?.id ?? null, hasMore, limit },
      });
    } catch (error) {
      console.error('Ошибка при получении инвестиций!', error);
      return res.status(500).json({ message: 'Ошибка при получении инвестиций!' });
    }
  }

  async updateInvestment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
      }

      const userId = req.user.id;
      const investmentId = req.params.id;

      const investment = await Invest.findByPk(investmentId, {
        include: [{ model: Portfolio, as: 'portfolio', where: { userId } }]
      });

      if (!investment) {
        return res.status(404).json({ message: 'Инвестиция не найдена!' });
      }

      const { countItems, buyPrice, comment } = req.body;
      await investment.update({ countItems, buyPrice, comment });

      const updated = await Invest.findByPk(investmentId, {
        include: [
          { model: Portfolio, as: 'portfolio', attributes: ['id', 'namePortfolio'] },
          { model: Skins, as: 'skin' },
        ],
      });

      if (!updated) {
        return res.status(500).json({ message: 'Ошибка: не удалось получить обновлённую запись' });
      }

      const historyMap = await skinsHistoryPrice.getHistoryMap([updated.idItem]);
      const { changePrice = 0, changePercent = 0 } = historyMap[updated.idItem] || {};

      const [commissionResult] = await steamCommissionService.calcBatch([updated.skin], 'price_skin');
      const { sellerGetsRub } = commissionResult;

      const count = Number(updated.countItems) || 0;
      const buyPriceNum = Number(updated.buyPrice) || 0;
      const priceSkin = Number(updated.skin.price_skin) || 0;

      const updatedPlain = updated.get({ plain: true });
      updatedPlain.changePrice = changePrice;
      updatedPlain.changePercent = changePercent;
      updatedPlain.investmentValue = +(buyPriceNum * count).toFixed(2);
      updatedPlain.assetsValue = +(sellerGetsRub * count).toFixed(2);
      updatedPlain.profitValue = +((sellerGetsRub - buyPriceNum) * count).toFixed(2);
      updatedPlain.profitPercent = buyPriceNum > 0
        ? +((priceSkin - buyPriceNum) / buyPriceNum * 100).toFixed(2)
        : 0;

      return res.status(200).json({
        message: 'Инвестиция успешно обновлена!',
        investment: updatedPlain
      });
    } catch (error) {
      console.error(`Ошибка при обновлении инвестиции ${req.params.id}:`, error);
      return res.status(500).json({ message: 'Ошибка при обновлении инвестиции!' });
    }
  }

  async deleteInvestment (req, res) {
    try {
      const userId = req.user.id;
      const investmentId = req.params.id;
      const investment = await Invest.findByPk(investmentId, {
        include: [{ model: Portfolio, as: 'portfolio', where: { userId } }]
      });

      if (!investment) {
        return res.status(404).json({ message: 'Инвестиция не найдена!' });
      }

      await investment.destroy();
      return res.status(200).json({ message: 'Инвестиция успешно удалена!' });
    } catch (error) {
      console.error('Ошибка при удалении инвестиции!', error);
      return res.status(500).json({ message: 'Ошибка при удалении инвестиции!' });
    }
  }

  async exportInvestments (req, res) {
    try {
      const userId = req.user.id;
      const { portfolioId } = req.query;
      const pid = portfolioId ? Number(portfolioId) : null;
      if (portfolioId && isNaN(pid)) {
        return res.status(400).json({ message: 'Неверный портфель ID' });
      }

      const investments = await Invest.findAll({
        where: pid ? { portfolioId: pid } : {},
        include: [
          { model: Portfolio, as: 'portfolio', where: { userId }, attributes: [] },
          { model: Skins, as: 'skin' }
        ],
        order: [['dateBuyItem', 'ASC']],
        raw: true,
        nest: true
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Инвестиции');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'ID Item', key: 'idItem', width: 12 },
        { header: 'Portfolio ID', key: 'portfolioId', width: 12 },
        { header: 'Кол-во', key: 'countItems', width: 10 },
        { header: 'Цена покупки', key: 'buyPrice', width: 15 },
        { header: 'Дата покупки', key: 'dateBuyItem', width: 20 },
        { header: 'Скин (название)', key: 'skin.market_name', width: 40 },
        { header: 'Текущая цена скина', key: 'skin.price_skin', width: 18 },
        { header: 'Дата обновления скина', key: 'skin.date_update', width: 20 },
      ];

      investments.forEach(inv => {
        sheet.addRow({
          id: inv.id,
          idItem: inv.idItem,
          portfolioId: inv.portfolioId,
          countItems: inv.countItems,
          buyPrice: inv.buyPrice,
          dateBuyItem: new Date(inv.dateBuyItem).toISOString().split('T')[0],
          'skin.market_name': inv.skin.market_name,
          'skin.price_skin': inv.skin.price_skin,
          'skin.date_update': inv.skin.date_update ? new Date(inv.skin.date_update).toISOString().split('T')[0] : '',
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="investments.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Ошибка при экспорте инвестиций!', error);
      return res.status(500).json({ message: 'Ошибка при экспорте инвестиций!' });
    }
  }

  /**
   * @router GET /api/investment/:portfolioId/summary
   * @description Рассчитывает summary инвестиций для портфеля
   */
  async summaryInvestments(req, res) {
    const portfolioId = Number(req.params.portfolioId);
    if (!portfolioId) return res.status(400).json({ message: 'portfolioId обязательный' });

    try {
      const investments = await Invest.findAll({
        where: { portfolioId },
        include: [
          { model: Portfolio, as: 'portfolio', attributes: [] },
          { model: Skins, as: 'skin', attributes: ['price_skin'] },
        ],
        attributes: ['countItems', 'buyPrice'],
        raw: true,
        nest: true,
      });

      const summary = await steamCommissionService.calcSummary(
        investments.map((inv) => ({
          countItems: inv.countItems,
          buyPrice: inv.buyPrice,
          price_skin: inv.skin.price_skin,
        }))
      );

      return res.json(summary);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Ошибка при получении summary инвестиций' });
    }
  }

  /**
   * @router POST /api/investment/sale
   * @description Продажа инвестиции полностью или частично
   */
  async saleInvestments(req, res) {
    const trx = await sequelize.transaction();
    try {
      const { investmentId, portfolioId, countSale, priceSale, saleDate } = req.body;
      const userId = req.user.id;

      const countToSell = Number(countSale);
      if (!Number.isInteger(countToSell) || countToSell <= 0) {
        await trx.rollback();
        return res.status(400).json({ message: 'Неверное количество для продажи' });
      }

      const investment = await Invest.findByPk(investmentId, {
        include: [{ model: Portfolio, as: 'portfolio', where: { userId } }],
        transaction: trx,
        lock: trx.LOCK.UPDATE,
      });

      if (!investment) {
        await trx.rollback();
        return res.status(404).json({ message: 'Инвестиция не найдена!' });
      }

      const currentQty = Number(investment.countItems || 0);

      if (countToSell > currentQty) {
        await trx.rollback();
        return res.status(400).json({ message: 'Недостаточно предметов для продажи' });
      }

      const isFullSale = countToSell === currentQty;

      const sale = await Sale.create({
        skinId: investment.idItem,
        portfolioId,
        countSale: countToSell,
        priceSale,
        priceBuy: investment.buyPrice,
        dateSale: saleDate ? new Date(saleDate) : new Date(),
      }, { transaction: trx });

      console.log('Создаём продажу:', {
        skinId: investment.idItem,
        portfolioId,
        countSale: countToSell,
        priceSale,
        priceBuy: investment.buyPrice,
        dateSale: saleDate ? new Date(saleDate) : new Date(),
      });

      if (isFullSale) {
        await Invest.destroy({ where: { id: investmentId }, transaction: trx });
        await trx.commit();
        return res.status(200).json({
          ok: true,
          saleId: sale.id,
          removedId: investmentId
        });
      } else {
        const newQty = currentQty - countToSell;
        await investment.update({ countItems: newQty }, { transaction: trx });
        await investment.reload({ transaction: trx });
        await trx.commit();
        return res.status(200).json({
          ok: true,
          saleId: sale.id,
          investment: investment.get({ plain: true })
        });
      }
    } catch (error) {
      if (trx) await trx.rollback();
      console.error('Ошибка при продаже инвестиции', error);
      return res.status(500).json({ message: 'Ошибка при продаже инвестиции!' });
    }
  }
}

module.exports = new InvestmentController();