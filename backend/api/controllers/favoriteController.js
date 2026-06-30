const ApiError = require('../exceptions/apiError');
const Favorite = require('../models/favoriteModel');
const Skins = require('../models/skinsModel');
const SkinStats = require('../models/skinStats');
const SkinChart = require('../models/skinChart');

function buildOrder(sortBy, sortOrder) {
  const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';

  switch (sortBy) {
    case 'price':
      return [[{ model: Skins, as: 'skin' }, 'price_skin', direction]];
    case 'change24h':
      return [[{ model: Skins, as: 'skin' }, { model: SkinStats, as: 'stats' }, 'price_change_day', direction]];
    case 'change7d':
      return [[{ model: Skins, as: 'skin' }, { model: SkinStats, as: 'stats' }, 'price_change_week', direction]];
    case 'change30d':
      return [[{ model: Skins, as: 'skin' }, { model: SkinStats, as: 'stats' }, 'price_change_month', direction]];
    case 'volume24h':
      return [[{ model: Skins, as: 'skin' }, { model: SkinStats, as: 'stats' }, 'volume_day', direction]];
    case 'volume7d':
      return [[{ model: Skins, as: 'skin' }, { model: SkinStats, as: 'stats' }, 'volume_week', direction]];
    case 'volume30d':
      return [[{ model: Skins, as: 'skin' }, { model: SkinStats, as: 'stats' }, 'volume_month', direction]];
    case 'date':
    default:
      return [['created_at', direction]];
  }
}

class FavoriteController {
  async addFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { skinId } = req.body;

      if (!skinId || isNaN(Number(skinId))) {
        return next(ApiError.BadRequest('Некорректный skinId'));
      }

      const skin = await Skins.findByPk(skinId);
      if (!skin) {
        return next(ApiError.BadRequest('Скин не найден'));
      }

      const [favorite, created] = await Favorite.findOrCreate({
        where: { user_id: userId, skin_id: skinId },
        defaults: { user_id: userId, skin_id: skinId }
      });

      if (!created) {
        return next(ApiError.BadRequest('Скин уже в избранном'));
      }

      return res.status(201).json(favorite);
    } catch (err) {
      next(err);
    }
  }

  async removeFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { skinId } = req.params;

      const deleted = await Favorite.destroy({
        where: { user_id: userId, skin_id: skinId }
      });

      if (!deleted) {
        return next(ApiError.BadRequest('Скин не найден в избранном'));
      }

      return res.json({ message: 'Скин удалён из избранного' });
    } catch (err) {
      next(err);
    }
  }

  async checkFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { skinId } = req.params;

      const favorite = await Favorite.findOne({
        where: { user_id: userId, skin_id: skinId }
      });

      return res.json({ isFavorite: !!favorite });
    } catch (err) {
      next(err);
    }
  }

  async checkFavoritesBulk(req, res, next) {
    try {
      const userId = req.user.id;
      const { skinIds } = req.body;

      if (!Array.isArray(skinIds) || skinIds.length === 0) {
        return next(ApiError.BadRequest('skinIds должен быть непустым массивом'));
      }

      if (skinIds.length > 100) {
        return next(ApiError.BadRequest('Максимум 100 skinId за один запрос'));
      }

      const validIds = skinIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (validIds.length === 0) {
        return next(ApiError.BadRequest('Не передано ни одного корректного skinId'));
      }

      const favorites = await Favorite.findAll({
        where: {
          user_id: userId,
          skin_id: validIds
        },
        attributes: ['skin_id']
      });

      const favoriteIds = new Set(favorites.map((fav) => fav.skin_id));

      const result = {};
      validIds.forEach((id) => {
        result[id] = favoriteIds.has(id);
      });

      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getFavorites(req, res, next) {
    try {
      const userId = req.user.id;

      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
      const offset = (page - 1) * limit;

      const order = buildOrder(req.query.sortBy, req.query.sortOrder);

      const { count, rows } = await Favorite.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: Skins,
            as: 'skin',
            attributes: ['id', 'market_name', 'market_hash_name', 'price_skin', 'image_url'],
            include: [
              {
                model: SkinStats,
                as: 'stats',
                attributes: [
                  'price_change_day', 'price_change_week', 'price_change_month',
                  'volume_day', 'volume_week', 'volume_month'
                ]
              }
            ]
          }
        ],
        order,
        limit,
        offset,
        distinct: true
      });

      const skinIds = rows.map((fav) => fav.skin?.id).filter(Boolean);

      const chartPoints = skinIds.length
        ? await SkinChart.findAll({
            where: {
              skin_id: skinIds,
              chart_period: '7d'
            },
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

      const data = rows.map((fav) => ({
        favoriteId: fav.id,
        skinId: fav.skin?.id,
        name: fav.skin?.market_name,
        marketHashName: fav.skin?.market_hash_name,
        image: fav.skin?.image_url,
        price: fav.skin?.price_skin,
        change24h: fav.skin?.stats?.price_change_day ?? null,
        change7d: fav.skin?.stats?.price_change_week ?? null,
        change30d: fav.skin?.stats?.price_change_month ?? null,
        volume24h: fav.skin?.stats?.volume_day ?? null,
        volume7d: fav.skin?.stats?.volume_week ?? null,
        volume30d: fav.skin?.stats?.volume_month ?? null,
        chart7d: chartMap[fav.skin?.id] || [],
        addedAt: fav.created_at
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
  }
}

module.exports = new FavoriteController();
