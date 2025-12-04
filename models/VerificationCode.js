const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

/**
 * 驗證碼模型
 * 代表郵箱驗證碼
 */
const VerificationCode = sequelize.define('VerificationCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '驗證碼唯一識別ID'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: {
        msg: '郵箱格式無效'
      },
      notEmpty: {
        msg: '郵箱不能為空'
      }
    },
    comment: '郵箱'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    comment: '對應用戶ID'
  },
  code: {
    type: DataTypes.CHAR(6),
    allowNull: false,
    validate: {
      len: {
        args: [6, 6],
        msg: '驗證碼必須是6位字符'
      },
      isAlphanumeric: {
        msg: '驗證碼只能包含字母和數字'
      }
    },
    comment: '驗證碼'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '過期時間'
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已使用'
  }
}, {
  tableName: 'verification_codes',
  timestamps: false,
  comment: '郵箱驗證碼表',
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['is_used']
    }
  ]
});

// 添加實例方法：檢查驗證碼是否有效
VerificationCode.prototype.isValid = function() {
  return !this.is_used && new Date() < new Date(this.expires_at);
};

// 添加類方法：查找有效的驗證碼
VerificationCode.findValidCode = function(email, code) {
  return this.findOne({
    where: {
      email,
      code,
      is_used: false,
      expires_at: {
        [Op.gt]: new Date() // 過期時間大於當前時間
      }
    }
  });
};

module.exports = VerificationCode;