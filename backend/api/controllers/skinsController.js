const { Op } = require('sequelize');
const sequelize = require('../../db');
const { Skins } = require('../models');

class SkinsController {
  escapeLike(str) {
    return str.replace(/[%_]/g, '\\$&');
  }

  searchSkins = async (req, res) => {
    try {
      const searchQueryRaw = req.query.q?.trim();
      if (!searchQueryRaw) return res.status(400).json({ message: 'Для поиска необходимо значение!' });

      const searchQuery = this.escapeLike(searchQueryRaw.toLowerCase());
      const limit = Math.min(Number(req.query.limit) || 5, 50);
      const offset = Number(req.query.offset) || 0;

      const skins = await Skins.findAll({
        where: {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('market_name')),
              { [Op.like]: `${searchQuery}%` }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('market_hash_name')),
              { [Op.like]: `${searchQuery}%` }
            ),
          ]
        },
        limit,
        offset,
        order: [
          [sequelize.literal(`CASE 
            WHEN LOWER("market_name") LIKE '${searchQuery}%' THEN 0
            WHEN LOWER("market_hash_name") LIKE '${searchQuery}%' THEN 1
            ELSE 2 END`), 'ASC']
        ]
      });

      res.json(skins);
    } catch (error) {
      console.error('Ошибка при поиске скинов!', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
}

module.exports = new SkinsController();
