const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PollOption = sequelize.define('PollOption', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  option_text: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  vote_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'forum_poll_options',
  timestamps: false
});

module.exports = PollOption;