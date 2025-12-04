const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PollVote = sequelize.define('PollVote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  option_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'forum_poll_votes',
  updatedAt: false
});

module.exports = PollVote;