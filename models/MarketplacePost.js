const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketplacePost = sequelize.define('MarketplacePost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '發文者ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '標題'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '內容'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '價格'
  },
  
  // 貼文類型
  type: {
    type: DataTypes.ENUM('selling', 'buying'),
    allowNull: false,
    defaultValue: 'selling',
    comment: '貼文類型: selling=販售, buying=徵求'
  },
  
  // 圖片網址
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '商品圖片網址'
  },

  is_sold: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否已售出'
  },
  
  // 🔥 這是你原本缺少的欄位，必須補上！
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否匿名'
  },

  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '留言數'
  }
}, {
  tableName: 'marketplace_posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '買賣版貼文'
});

module.exports = MarketplacePost;