const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const auth = require('../middleware/auth');

// 這些功能全部都需要登入
router.post('/checkin', auth, pointController.dailyCheckin); // 每日簽到
router.get('/history', auth, pointController.getHistory);    // 查看點數紀錄

module.exports = router;