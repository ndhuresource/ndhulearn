const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController'); 
const auth = require('../middleware/auth');
const Resource = require('../models/Resource'); 
const User = require('../models/User'); 

// 👇 修改重點：直接引入剛剛建立的設定檔，原本那一大串 multer 設定都可以刪掉了
const upload = require('../config/cloudinary'); 

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
      // 點數失敗不影響主要流程，所以不 return error
    }

    res.status(201).json({ message: '上傳成功，獲得 20 點數！', resource: newResource });

  } catch (error) {
    console.error('❌ 上傳失敗 (Route Error):', error);
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