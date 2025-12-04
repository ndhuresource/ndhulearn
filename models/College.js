const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * 學院模型
 */
const College = sequelize.define('College', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '學院唯一識別ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: '學院名稱不能為空'
      },
      len: {
        args: [1, 100],
        msg: '學院名稱長度必須在1到100個字符之間'
      }
    },
    comment: '學院名稱'
  }
}, {
  tableName: 'colleges',
  timestamps: false, // 啟用時間戳
  underscored: true
});

module.exports = College;