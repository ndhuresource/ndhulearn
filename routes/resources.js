const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController'); 
const auth = require('../middleware/auth');
const Resource = require('../models/Resource'); 
const User = require('../models/User'); 

// ── Cloudinary & Multer 設定 ──────────────────────────────
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 👇👇👇 偵錯間諜：印出變數狀態 (確認 Render 有讀到) 👇👇👇
console.log('🔍 [Resources Route] Cloudinary Config Check:');
console.log('   - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ OK' : '❌ MISSING');
console.log('   - API Key:', process.env.CLOUDINARY_API_KEY ? '✅ OK' : '❌ MISSING');
console.log('   - API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ OK' : '❌ MISSING');

// 1. 設定 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. 設定 Multer 儲存引擎
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    try {
      console.log('📂 [Debug] 收到檔案準備上傳:', file.originalname);
      return {
        folder: 'ndhu-resources', 
        resource_type: 'auto', // 自動判斷是圖片、影片還是 PDF
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, 
      };
    } catch (err) {
      // 捕捉初始化錯誤，防止伺服器直接崩潰
      console.error('❌ [CRITICAL] Cloudinary Storage Error:', err);
      throw err;
    }
  },
});

// 👇 修改重點：加入檔案大小限制 (10MB)，防止記憶體溢出導致崩潰
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 限制 10MB
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
      return res.status(400).json({ message: '請選擇要上傳的檔案' });
    }

    const { 
      title, course_id, teacher, resource_type, year, grade_level, description, is_anonymous 
    } = req.body;

    console.log('✅ 檔案上傳成功，Cloudinary URL:', req.file.path);

    // 1. 寫入資源資料庫
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

    // 2. 幫使用者加 20 點數
    try {
      const user = await User.findByPk(req.user.id);
      if (user) {
        await user.increment('current_points', { by: 20 });
        console.log(`使用者 ${req.user.id} 上傳資源，獲得 20 點數`);
      }
    } catch (pointError) {
      console.error('點數增加失敗:', pointError);
    }

    res.status(201).json({ message: '上傳成功，獲得 20 點數！', resource: newResource });

  } catch (error) {
    // 捕捉 Multer 錯誤 (例如檔案太大)
    if (error instanceof multer.MulterError) {
        console.error('❌ 上傳失敗 (Multer Error):', error);
        return res.status(400).json({ message: '檔案上傳錯誤 (可能是檔案太大)', error: error.message });
    }
    
    console.error('❌ 上傳失敗 (Server Error):', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
});

// 4. 獲取特定資源詳情 
router.get('/:id', auth, resourceController.getResourceById);

// 5. 下載資源
router.get('/:id/download', auth, resourceController.downloadResource);

// 6. 刪除資源路由
router.delete('/:id', auth, resourceController.deleteResource);

module.exports = router;