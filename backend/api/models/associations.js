const { Invest, Skins, SkinPriceHistory, Portfolio, Sale } = require('./');
const Token = require('./tokenModel');
const User = require('./userModel');
const SkinStats = require('./skinStats');
const SkinChart = require('./skinChart');
const Favorite = require('./favoriteModel');

const initAssociations = () => {
  // Invest <-> Skins
  Invest.belongsTo(Skins, { 
    foreignKey: 'idItem',
    targetKey: 'id',
    as: 'skin',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Skins.hasMany(Invest, { 
    foreignKey: 'idItem',
    as: 'investments'
  });

  // Invest <-> Portfolio
  Invest.belongsTo(Portfolio, {
    foreignKey: 'portfolioId',
    targetKey: 'id',
    as: 'portfolio',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Portfolio.hasMany(Invest, {
    foreignKey: 'portfolioId',
    as: 'investments'
  });

  // SkinPriceHistory <-> Skins
  SkinPriceHistory.belongsTo(Skins, {
    foreignKey: 'skinId',
    as: 'skin',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Skins.hasMany(SkinPriceHistory, {
    foreignKey: 'skinId',
    as: 'priceHistory'
  });

  // User <-> Token
  Token.belongsTo(User, {
    foreignKey: 'userId',
    targetKey: 'id',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  User.hasMany(Token, {
    foreignKey: 'userId',
    as: 'tokens'
  });

  // Пользователь <-> Портфели
  User.hasMany(Portfolio, {
    foreignKey: 'userId',
    as: 'portfolios'
  });
  Portfolio.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Sale <-> Skins (какой скин продали)
  Sale.belongsTo(Skins, {
    foreignKey: 'skinId',
    as: 'skin',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Skins.hasMany(Sale, {
    foreignKey: 'skinId',
    as: 'sales'
  });

  // Sale <-> Portfolio (продажа привязана к портфелю)
  Sale.belongsTo(Portfolio, {
    foreignKey: 'portfolioId',
    as: 'portfolio',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Portfolio.hasMany(Sale, {
    foreignKey: 'portfolioId',
    as: 'sales'
  });

  // SkinStats <-> Skins
  SkinStats.belongsTo(Skins, {
    foreignKey: 'skin_id',
    as: 'skin',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Skins.hasOne(SkinStats, {
    foreignKey: 'skin_id',
    as: 'stats'
  });

  // SkinChart <-> Skins
  SkinChart.belongsTo(Skins, {
    foreignKey: 'skin_id',
    as: 'skin',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Skins.hasMany(SkinChart, {
    foreignKey: 'skin_id',
    as: 'chartPoints'
  });

  // User <-> Favorite
  User.hasMany(Favorite, {
    foreignKey: 'user_id',
    as: 'favorites'
  });
  Favorite.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Skins <-> Favorite
  Skins.hasMany(Favorite, {
    foreignKey: 'skin_id',
    as: 'favoritedBy'
  });
  Favorite.belongsTo(Skins, {
    foreignKey: 'skin_id',
    as: 'skin',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
};

module.exports = initAssociations;
