const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const auth = require('../middleware/auth');

// 公開路由
router.get('/items', shopController.getItems); // 查看商店商品列表

// 受保護路由
router.post('/buy', auth, shopController.buyItem);        // 購買商品
router.get('/inventory', auth, shopController.getMyInventory); // 查看我的背包

module.exports = router;