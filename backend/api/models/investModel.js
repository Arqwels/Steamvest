const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Invest = sequelize.define('invest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idItem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'skins', key: 'id' }
  },
  portfolioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'portfolios', key: 'id' }
  },
  countItems: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  buyPrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  dateBuyItem: {
    type: DataTypes.DATE,
    allowNull: false
  },
  comment: {
    type: DataTypes.STRING(60),
    allowNull: true,
    defaultValue: null,
  },
}, {
  timestamps: true,
  createdAt: false
});

module.exports = Invest;
