const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Favorite = sequelize.define('favorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  skin_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['user_id', 'skin_id'] }
  ]
});

module.exports = Favorite;
