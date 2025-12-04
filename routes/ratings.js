const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const auth = require('../middleware/auth');

// 提交評價 (需要登入)
router.post('/', auth, ratingController.createRating);

// 獲取某資源的評價 (公開)
router.get('/resource/:resourceId', ratingController.getResourceRatings);

// 🔥 新增：刪除評價 (需要登入)
router.delete('/:id', auth, ratingController.deleteRating);

module.exports = router;