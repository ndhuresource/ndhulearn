const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController'); 
const auth = require('../middleware/auth');
const Resource = require('../models/Resource'); 
const User = require('../models/User'); 

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
// 引入 CloudinaryStorage 讓檔案直接飛到雲端，不佔用伺服器 RAM
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 👇 Debug Log
console.log('🔍 [Resources Route] Cloudinary Config Check:');
console.log('   - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ OK' : '❌ MISSING');
console.log('   - API Key:', process.env.CLOUDINARY_API_KEY ? '✅ OK' : '❌ MISSING');

// 1. 設定 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. 設定 Storage Engine (這就是解決 OOM 的關鍵)
// 檔案會以 Stream 方式直接傳輸，不會存入 Buffer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ndhu-resources', // Cloudinary 上的資料夾名稱
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'rar'], // 允許的格式
    resource_type: 'auto', // 自動偵測是圖片還是 raw 檔案 (如 pdf/zip)
    // public_id: (req, file) => file.originalname, // 如果你想保留原始檔名可開這行，但建議讓 Cloudinary 自動生成亂數 ID 避免重複
  },
});

// 使用上面的 storage 設定
const upload = multer({ storage: storage });

// ────────────────────────────────────────────────────────

// 1. 獲取所有資源 
router.get('/', resourceController.getAllResources);

// 2. 獲取特定課程的資源 
router.get('/course/:courseId', resourceController.getCourseResources);

// 3. 上傳資源 (已優化記憶體使用)
// 當程式執行到這裡時，multer 已經自動把檔案傳到 Cloudinary 了
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    // 檢查是否有檔案 (如果有錯誤，multer 通常會先拋出，但這裡做雙重確認)
    if (!req.file) {
      return res.status(400).json({ message: '請選擇要上傳的檔案' });
    }

    console.log('✅ [Debug] Cloudinary 上傳成功，收到回傳資訊');
    console.log('   - URL:', req.file.path);
    console.log('   - Filename:', req.file.filename);

    const { 
      title, course_id, teacher, resource_type, year, grade_level, description, is_anonymous 
    } = req.body;

    // 1. 寫入資源資料庫
    // 注意：現在檔案網址在 req.file.path，而不是我們自己組裝的
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
      file_path: req.file.path,       // Cloudinary 回傳的網址
      file_size: req.file.size || 0,  // Cloudinary 有時不一定會回傳 size，預設 0 防止錯誤
      mime_type: req.file.mimetype,
      original_filename: req.file.originalname
    });

    // 2. 幫使用者加 20 點數
    try {
      const user = await User.findByPk(req.user.id);
      if (user) {
        await user.increment('current_points', { by: 20 });
      }
    } catch (pointError) {
      console.error('點數增加失敗:', pointError);
      // 點數失敗不應該影響上傳成功的結果，所以只紀錄 log
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

// 6. 刪除資源路由
router.delete('/:id', auth, resourceController.deleteResource);

module.exports = router;