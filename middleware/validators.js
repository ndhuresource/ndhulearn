// middleware/validators.js
const { body, validationResult } = require('express-validator');
const { User } = require('../models');

const validate = (method) => {
  switch (method) {
    case 'register':
      return [
        body('studentId')
          .notEmpty().withMessage('學號不能為空')
          .isLength({ min: 1, max: 20 }).withMessage('學號長度必須在1到20個字符之間'),
        body('username')
          .notEmpty().withMessage('姓名不能為空')
          .isLength({ min: 1, max: 50 }).withMessage('姓名長度必須在1到50個字符之間'),
        body('email')
          .isEmail().withMessage('必須提供有效的郵箱地址')
          .custom(async (value) => {
            const user = await User.findOne({ where: { email: value } });
            if (user) {
              throw new Error('郵箱已被註冊');
            }
            return true;
          }),
        body('password')
          .isLength({ min: 6 }).withMessage('密碼必須至少6個字符')
      ];
    case 'login':
      return [
        body('studentId').notEmpty().withMessage('學號不能為空'),
        body('password').notEmpty().withMessage('密碼不能為空')
      ];
    default:
      return [];
  }
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: '驗證失敗',
      errors: errors.array() 
    });
  }
  next();
};

module.exports = {
  validate,
  handleValidationErrors
};