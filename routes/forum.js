const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const auth = require('../middleware/auth');

// ── Cloudinary & Multer 設定 (處理圖片上傳) ────────────────
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 設定 Cloudinary (讀取 .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'ndhu-forum', // 圖片存放在 Cloudinary 的資料夾名稱
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    };
  },
});

const upload = multer({ storage: storage });
// ──────────────────────────────────────────────────────────

// 公開路由
router.get('/posts', forumController.getPosts);
router.get('/posts/:id', forumController.getPostById);

// 受保護路由
router.post('/posts', auth, upload.single('image'), forumController.createPost);
router.post('/posts/:id/comments', auth, forumController.addComment);
router.post('/vote', auth, forumController.votePoll);

// 點讚與刪除貼文
router.post('/posts/:id/like', auth, forumController.toggleLike);
router.delete('/posts/:id', auth, forumController.deletePost);

// 🔥 新增：刪除留言路由
router.delete('/comments/:id', auth, forumController.deleteComment);

module.exports = router;