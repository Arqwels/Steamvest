const { Op } = require('sequelize');
const sequelize = require('../../db');
const { Skins, SkinStats, SkinChart } = require('../models');

const STATS_SORT_FIELDS = {
  change24h: 'price_change_day',
  change7d: 'price_change_week',
  change30d: 'price_change_month',
  volume24h: 'volume_day',
  volume7d: 'volume_week',
  volume30d: 'volume_month'
};

function buildOrder(sortBy, sortOrder) {
  const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
  const nulls = sortOrder === 'asc' ? 'NULLS FIRST' : 'NULLS LAST';

  if (sortBy === 'price') {
    return [[sequelize.literal(`"skin"."price_skin" ${direction} ${nulls}`)]];
  }

  const field = STATS_SORT_FIELDS[sortBy] || STATS_SORT_FIELDS.volume24h;
  return [[sequelize.literal(`"stats"."${field}" ${direction} ${nulls}`)]];
}

class TopSkinsController {
  getTopSkins = async (req, res, next) => {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
      const offset = (page - 1) * limit;

      const sortBy = req.query.sortBy || 'volume24h';
      const sortOrder = req.query.sortOrder || 'desc';
      const order = buildOrder(sortBy, sortOrder);

      const requireStats = sortBy !== 'price';

      const { count, rows } = await Skins.findAndCountAll({
        attributes: ['id', 'market_name', 'market_hash_name', 'price_skin', 'image_url'],
        include: [
          {
            model: SkinStats,
            as: 'stats',
            attributes: [
              'price_change_day', 'price_change_week', 'price_change_month',
              'volume_day', 'volume_week', 'volume_month'
            ],
            required: requireStats
          }
        ],
        where: {
          price_skin: { [Op.not]: null }
        },
        order,
        limit,
        offset,
        distinct: true
      });

      const skinIds = rows.map((skin) => skin.id);

      const chartPoints = skinIds.length
        ? await SkinChart.findAll({
            where: { skin_id: skinIds, chart_period: '7d' },
            order: [['recorded_at', 'ASC']],
            attributes: ['skin_id', 'price', 'volume', 'recorded_at']
          })
        : [];

      const chartMap = {};
      chartPoints.forEach((point) => {
        if (!chartMap[point.skin_id]) chartMap[point.skin_id] = [];
        chartMap[point.skin_id].push({
          price: point.price,
          volume: point.volume,
          recordedAt: point.recorded_at
        });
      });

      const data = rows.map((skin) => ({
        skinId: skin.id,
        name: skin.market_name,
        marketHashName: skin.market_hash_name,
        image: skin.image_url,
        price: skin.price_skin,
        change24h: skin.stats?.price_change_day ?? null,
        change7d: skin.stats?.price_change_week ?? null,
        change30d: skin.stats?.price_change_month ?? null,
        volume24h: skin.stats?.volume_day ?? null,
        volume7d: skin.stats?.volume_week ?? null,
        volume30d: skin.stats?.volume_month ?? null,
        chart7d: chartMap[skin.id] || []
      }));

      return res.json({
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new TopSkinsController();
