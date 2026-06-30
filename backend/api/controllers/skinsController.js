const { Op } = require('sequelize');
const sequelize = require('../../db');
const { Skins, SkinStats } = require('../models');

class SkinsController {
  escapeLike(str) {
    return str.replace(/[%_]/g, '\\$&');
  }

  escapeSql(str) {
    return str.replace(/'/g, "''");
  }

  searchSkins = async (req, res) => {
    try {
      const searchQueryRaw = req.query.q?.trim();
      if (!searchQueryRaw) return res.status(400).json({ message: 'Для поиска необходимо значение!' });
      if (searchQueryRaw.length < 2) return res.status(400).json({ message: 'Минимум 2 символа' });

      const tokens = this.escapeLike(searchQueryRaw)
        .replace(/'/g, '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      const limit = Math.min(Number(req.query.limit) || 5, 50);
      const offset = Number(req.query.offset) || 0;

      // каждый токен должен встречаться хотя бы в одном из полей
      const tokenConditions = tokens.map(token => ({
        [Op.or]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('market_name'), "'", '')),
            { [Op.like]: `%${token}%` }
          ),
          sequelize.where(
            sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('market_hash_name'), "'", '')),
            { [Op.like]: `%${token}%` }
          ),
        ]
      }));

      // для сортировки берём полный запрос целиком
      const fullQuery = this.escapeSql(tokens.join(' '));

      const skins = await Skins.findAll({
        where: {
          [Op.and]: tokenConditions
        },
        limit,
        offset,
        order: [
          [sequelize.literal(`CASE 
            WHEN LOWER(REPLACE("market_name", '''', '')) LIKE '${fullQuery}%' THEN 0
            WHEN LOWER(REPLACE("market_hash_name", '''', '')) LIKE '${fullQuery}%' THEN 1
            WHEN LOWER(REPLACE("market_name", '''', '')) LIKE '%${fullQuery}%' THEN 2
            WHEN LOWER(REPLACE("market_hash_name", '''', '')) LIKE '%${fullQuery}%' THEN 3
            ELSE 4 END`), 'ASC']
        ]
      });

      res.json(skins);
    } catch (error) {
      console.error('Ошибка при поиске скинов!', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  searchSkinsFavorite = async (req, res) => {
    try {
      const searchQueryRaw = req.query.q?.trim();
      if (!searchQueryRaw) return res.status(400).json({ message: 'Для поиска необходимо значение!' });
      if (searchQueryRaw.length < 2) return res.status(400).json({ message: 'Минимум 2 символа' });

      const tokens = this.escapeLike(searchQueryRaw)
        .replace(/'/g, '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const offset = Number(req.query.offset) || 0;

      const tokenConditions = tokens.map(token => ({
        [Op.or]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('market_name'), "'", '')),
            { [Op.like]: `%${token}%` }
          ),
          sequelize.where(
            sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('market_hash_name'), "'", '')),
            { [Op.like]: `%${token}%` }
          ),
        ]
      }));

      const fullQuery = this.escapeSql(tokens.join(' '));

      const skins = await Skins.findAll({
        where: {
          [Op.and]: tokenConditions
        },
        attributes: ['id', 'market_name', 'market_hash_name', 'price_skin', 'image_url'],
        include: [
          {
            model: SkinStats,
            as: 'stats',
            attributes: ['price_change_day']
          }
        ],
        limit,
        offset,
        order: [
          [sequelize.literal(`CASE 
            WHEN LOWER(REPLACE("market_name", '''', '')) LIKE '${fullQuery}%' THEN 0
            WHEN LOWER(REPLACE("market_hash_name", '''', '')) LIKE '${fullQuery}%' THEN 1
            WHEN LOWER(REPLACE("market_name", '''', '')) LIKE '%${fullQuery}%' THEN 2
            WHEN LOWER(REPLACE("market_hash_name", '''', '')) LIKE '%${fullQuery}%' THEN 3
            ELSE 4 END`), 'ASC']
        ]
      });

      const data = skins.map((skin) => ({
        skinId: skin.id,
        name: skin.market_name,
        marketHashName: skin.market_hash_name,
        image: skin.image_url,
        price: skin.price_skin,
        change24h: skin.stats?.price_change_day ?? null
      }));

      res.json(data);
    } catch (error) {
      console.error('Ошибка при поиске скинов (таблица)!', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
}

module.exports = new SkinsController();
