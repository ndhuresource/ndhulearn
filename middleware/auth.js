const jwt = require('jsonwebtoken');
// 修改這裡：為了確保能抓到正確的 User 模型，我們統一從 associations 引入
const { User } = require('../models/associations'); 

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '訪問被拒絕，沒有提供令牌' });
    }

    // 確保 .env 有設定 JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // 查詢資料庫確保用戶存在
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: '令牌無效，用戶不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('認證中間件錯誤:', error);
    res.status(401).json({ message: '令牌無效' });
  }
};

// 修改這裡：直接匯出函數，而不是物件
module.exports = auth;