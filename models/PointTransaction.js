const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointTransaction = sequelize.define('PointTransaction', {
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
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '點數變動量'
  },
  transaction_type: {
    type: DataTypes.ENUM('簽到', '上傳資源', '購買商品', '系統獎勵', '其他'),
    allowNull: false,
    comment: '交易類型'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '交易描述'
  },
  balance_after: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '交易後餘額'
  }
}, {
  tableName: 'point_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '點數交易記錄'
});

module.exports = PointTransaction;