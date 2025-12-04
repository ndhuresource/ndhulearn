const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const marketplaceController = require('../controllers/marketplaceController'); 
const MarketplacePost = require('../models/MarketplacePost'); 
const User = require('../models/User'); 
const MarketplaceComment = require('../models/MarketplaceComment'); 

// ── Cloudinary & Multer 設定 ────────────────────────
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'ndhu-marketplace', 
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], 
    };
  },
});

const upload = multer({ storage: storage });
// ──────────────────────────────────────────────────

// 1. 獲取貼文列表
router.get('/posts', marketplaceController.getPosts);

// 2. 獲取單篇詳情 (含留言)
router.get('/posts/:id', marketplaceController.getPostById);

// 3. 發布貼文 
router.post('/posts', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, content, price, type, is_anonymous } = req.body;
    
    if (!title || !content) return res.status(404).json({ message: '標題與內容為必填' });

    let imageUrl = null;
    if (req.file && req.file.path) {
      imageUrl = req.file.path; 
    }

    const newPost = await MarketplacePost.create({
      user_id: req.user.id,
      title,
      content,
      price: price || null,
      type: type || 'selling',
      image_url: imageUrl,
      is_sold: 0,
      is_anonymous: is_anonymous === 'true' || is_anonymous === true
    });

    res.status(201).json({ message: '貼文發佈成功！', post: newPost });
  } catch (error) {
    console.error('發文失敗:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
});

// 4. 新增留言
router.post('/posts/:id/comments', auth, marketplaceController.addComment);

// 5. 標記售出
router.patch('/posts/:id/sold', auth, marketplaceController.markAsSold);

// 🔥 6. 新增：刪除留言路由
router.delete('/comments/:id', auth, marketplaceController.deleteComment);

module.exports = router;