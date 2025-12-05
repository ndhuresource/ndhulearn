const { Resource, Course, User, PointTransaction, DownloadHistory } = require('../models/associations');
const sequelize = require('../config/database');
const cloudinary = require('cloudinary').v2; // 👈 新增：引入 Cloudinary 以便執行刪除

// 1. 獲取所有資源
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({
      limit: 20,
      order: [['upload_time', 'DESC']],
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name'] },
        { model: User, as: 'uploader', attributes: ['id', 'username', 'avatar_url'] }
      ]
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 2. 獲取特定課程的資源列表
exports.getCourseResources = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { type, year, gradeLevel, page = 1, limit = 20 } = req.query;

    const whereClause = { course_id: courseId };
    if (type) whereClause.resource_type = type;
    if (year) whereClause.year = year;
    if (gradeLevel) whereClause.grade_level = gradeLevel;

    const offset = (page - 1) * limit;

    const resources = await Resource.findAndCountAll({
      where: whereClause,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name'] },
        { model: User, as: 'uploader', attributes: ['id', 'username', 'avatar_url'] }
      ],
      order: [['upload_time', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      resources: resources.rows,
      totalCount: resources.count,
      totalPages: Math.ceil(resources.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('獲取課程資源錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 3. 獲取單一資源詳情
exports.getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findByPk(id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name'] },
        { model: User, as: 'uploader', attributes: ['id', 'username', 'avatar_url'] }
      ]
    });

    if (!resource) {
      return res.status(404).json({ message: '資源不存在' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

/* 4. 上傳資源 (已棄用)
   注意：目前的上傳邏輯已經移至 routes/resources.js 中處理，
   包含了 Multer 上傳與資料庫寫入。此函式保留僅供參考。
*/
exports.createResource = async (req, res) => {
  res.status(400).json({ message: '請使用 POST /api/resources 端點進行上傳' });
};

// 5. 下載資源
exports.downloadResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await Resource.findByPk(id);
    if (!resource) return res.status(404).json({ message: '資源不存在' });

    // 增加下載次數
    await resource.increment('download_count');

    // 記錄下載歷史
    const existingHistory = await DownloadHistory.findOne({
      where: { user_id: userId, resource_id: id }
    });

    if (!existingHistory) {
      await DownloadHistory.create({ user_id: userId, resource_id: id });
      console.log(`用戶 ${userId} 下載資源 ${id}，紀錄已建立。`);
    }

    // 確保回傳完整的 URL
    let finalUrl = resource.file_path;
    // 如果是 Cloudinary 網址，通常已經是 http 開頭，不需要再處理
    // 如果是舊的本地檔案，才需要加 host
    if (finalUrl && !finalUrl.startsWith('http')) {
        finalUrl = `${req.protocol}://${req.get('host')}${finalUrl}`;
    }

    res.json({ 
        success: true, 
        downloadUrl: finalUrl, 
        fileName: resource.original_filename || resource.title 
    });

  } catch (error) {
    console.error('下載失敗:', error);
    res.status(500).json({ message: '下載失敗', error: error.message });
  }
};

// 🔥 6. 新增：刪除資源功能 (包含 Cloudinary 同步刪除)
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await Resource.findByPk(id);
    if (!resource) {
      return res.status(404).json({ message: '資源不存在' });
    }

    // 權限檢查：只有上傳者本人可以刪除
    if (resource.uploader_id !== userId) {
      return res.status(403).json({ message: '無權限刪除此資源' });
    }

    // ── 新增：刪除 Cloudinary 上的檔案 ──
    if (resource.file_path && resource.file_path.includes('cloudinary')) {
      try {
        // Cloudinary 的 file_path 範例: 
        // https://res.cloudinary.com/dk7t0tarf/raw/upload/v123456/ndhu-resources/17000000-filename.pdf
        
        // 我們需要提取 "ndhu-resources/17000000-filename" (public_id)
        // 邏輯：找到 'ndhu-resources' 的位置，並截取到副檔名之前
        
        const folderName = 'ndhu-resources';
        const parts = resource.file_path.split('/');
        const filenameWithExt = parts[parts.length - 1]; // 例如 17000000-filename.pdf
        const filename = filenameWithExt.split('.')[0];    // 去除副檔名 -> 17000000-filename
        
        const publicId = `${folderName}/${filename}`;

        console.log(`準備刪除 Cloudinary 檔案, Public ID: ${publicId}`);

        // 呼叫 Cloudinary 刪除 API (嘗試刪除 raw 和 image 兩種類型，確保刪除成功)
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); // 以防萬一
        
        console.log('Cloudinary 檔案刪除指令已發送');
      } catch (cloudError) {
        console.error('Cloudinary 刪除失敗 (僅刪除資料庫):', cloudError);
        // 不阻擋資料庫刪除，繼續往下執行
      }
    }
    // ──────────────────────────────────

    // 刪除資料庫紀錄
    await resource.destroy();

    res.json({ success: true, message: '資源已刪除' });

  } catch (error) {
    console.error('刪除資源失敗:', error);
    res.status(500).json({ message: '刪除失敗', error: error.message });
  }
};