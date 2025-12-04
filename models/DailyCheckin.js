const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyCheckin = sequelize.define('DailyCheckin', {
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
  checkin_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '簽到日期'
  },
  points_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: '獲得點數'
  },
  checkin_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '簽到時間'
  }
}, {
  tableName: 'daily_checkins',
  timestamps: false,
  comment: '每日簽到記錄'
});

module.exports = DailyCheckin;