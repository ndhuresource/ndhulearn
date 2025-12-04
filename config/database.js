const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ndhu_resource',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+08:00', // 設置時區為 UTC+8（台灣時間）
    dialectOptions: {
      // 移除 useUTC 配置
      dateStrings: true,
      typeCast: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      // 設置默認的時間戳值
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

module.exports = sequelize;