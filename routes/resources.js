const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController'); 
const auth = require('../middleware/auth');
const Resource = require('../models/Resource'); 
const User = require('../models/User'); 

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const stream = require('stream'); // 引入 Node.js 原生串流模組

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

// 2. 改用 MemoryStorage (暫存記憶體，不透過 storage engine 插件)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 限制 5MB，保護 Render 記憶體
});

// 3. 定義一個「手動上傳」的輔助函式
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: folder,
        resource_type: 'auto' 
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    // 將記憶體中的檔案寫入 Cloudinary 串流
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
};

// ────────────────────────────────────────────────────────

// 1. 獲取所有資源 
router.get('/', resourceController.getAllResources);

// 2. 獲取特定課程的資源 
router.get('/course/:courseId', resourceController.getCourseResources);

// 3. 上傳資源 (重寫邏輯)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    // 檢查是否有檔案
    if (!req.file) {
      return res.status(400).json({ message: '請選擇要上傳的檔案' });
    }

    console.log('📂 [Debug] 收到檔案，準備手動上傳:', req.file.originalname);

    const { 
      title, course_id, teacher, resource_type, year, grade_level, description, is_anonymous 
    } = req.body;

    // 🔥 關鍵步驟：手動呼叫上傳函式
    let uploadResult;
    try {
      uploadResult = await uploadToCloudinary(req.file.buffer, 'ndhu-resources');
      console.log('✅ Cloudinary 上傳成功 URL:', uploadResult.secure_url);
    } catch (uploadError) {
      console.error('❌ Cloudinary 上傳失敗:', uploadError);
      return res.status(500).json({ message: '圖片伺服器連線失敗', error: uploadError.message });
    }

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
      file_path: uploadResult.secure_url, // 使用回傳的網址
      file_size: req.file.size,
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