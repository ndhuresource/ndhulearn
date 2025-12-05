const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController'); 
const auth = require('../middleware/auth');
const Resource = require('../models/Resource'); 
const User = require('../models/User'); 

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 👇👇👇 偵錯間諜 2.0：檢查是否有「隱形空格」 👇👇👇
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

console.log('🔍 [Cloudinary 深度檢查]');
console.log(`   - Cloud Name: '${cloudName}' (長度: ${cloudName.length})`); // 注意引號
console.log(`   - API Key:    '${apiKey}' (長度: ${apiKey.length})`);
console.log(`   - API Secret: '${apiSecret.slice(0, 5)}...' (長度: ${apiSecret.length})`);

// 1. 設定 Cloudinary
cloudinary.config({
  cloud_name: cloudName.trim(), // 強制去除空格
  api_key: apiKey.trim(),       // 強制去除空格
  api_secret: apiSecret.trim()  // 強制去除空格
});

// 2. 設定 Multer 儲存引擎
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    try {
      console.log('📂 [Debug] 準備上傳檔案:', file.originalname);
      return {
        folder: 'ndhu-resources', 
        resource_type: 'auto', 
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, 
      };
    } catch (err) {
      console.error('❌ [Critical] Cloudinary 設定錯誤:', err);
      // ⚠️ 修正：這裡不要 throw err，回傳 null 讓 Multer 處理錯誤，避免伺服器崩潰
      return null; 
    }
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// ────────────────────────────────────────────────────────

// 1. 獲取所有資源 
router.get('/', resourceController.getAllResources);

// 2. 獲取特定課程的資源 
router.get('/course/:courseId', resourceController.getCourseResources);

// 3. 上傳資源
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      // 如果因為 storage 錯誤導致 file 為空
      console.error('❌ 上傳失敗: req.file 不存在 (可能是 Cloudinary 連線失敗)');
      return res.status(500).json({ message: '檔案上傳失敗，請檢查後端 Logs 確認 Cloudinary 設定' });
    }

    const { 
      title, course_id, teacher, resource_type, year, grade_level, description, is_anonymous 
    } = req.body;

    console.log('✅ Cloudinary 上傳成功 URL:', req.file.path);

    const newResource = await Resource.create({
      title,
      course_id,
      teacher,
      uploader_id: req.user.id, 
      resource_type,
      year,
      grade_level,
      description,
      is_anonymous: is_anonymous === 'true' || is_anonymous === true,
      file_path: req.file.path,
      file_size: req.file.size || 0,
      mime_type: req.file.mimetype,
      original_filename: req.file.originalname
    });

    try {
      const user = await User.findByPk(req.user.id);
      if (user) {
        await user.increment('current_points', { by: 20 });
      }
    } catch (pointError) {
      console.error('點數增加失敗:', pointError);
    }

    res.status(201).json({ message: '上傳成功，獲得 20 點數！', resource: newResource });

  } catch (error) {
    console.error('❌ Route Error:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
});

// 4. 獲取特定資源詳情 
router.get('/:id', auth, resourceController.getResourceById);

// 5. 下載資源
router.get('/:id/download', auth, resourceController.downloadResource);

// 6. 刪除資源
router.delete('/:id', auth, resourceController.deleteResource);

module.exports = router;