const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShopItem = sequelize.define('ShopItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  item_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商品名稱'
  },
  item_type: {
    type: DataTypes.ENUM('頭貼', '外框', '徽章', '主題'),
    allowNull: false,
    comment: '商品類型'
  },
  item_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '商品圖片URL'
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '點數價格'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '商品描述'
  },
  is_available: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否可購買'
  }
}, {
  tableName: 'shop_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '商店商品'
});

module.exports = ShopItem;