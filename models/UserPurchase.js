const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserPurchase = sequelize.define('UserPurchase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用戶ID'
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID'
  },
  purchase_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '購買時間'
  }
}, {
  tableName: 'user_purchases',
  timestamps: false,
  comment: '用戶購買記錄'
});

module.exports = UserPurchase;