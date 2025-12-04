const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForumLike = sequelize.define('ForumLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '按讚者ID'
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '貼文ID'
  }
}, {
  tableName: 'forum_likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 只需要建立時間，不需要更新時間
  underscored: true,
  comment: '聊天版點讚紀錄'
});

module.exports = ForumLike;