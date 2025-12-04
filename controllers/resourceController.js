const { Resource, Course, User, PointTransaction, DownloadHistory, ResourceRating } = require('../models/associations');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// 1. 獲取所有資源
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({
      limit: 20,
      order: [['upload_time', 'DESC']],
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name'] },
        { model: User, as: 'uploader', attributes: ['id', 'username'] }
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
        { model: User, as: 'uploader', attributes: ['id', 'username'] }
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
        { model: User, as: 'uploader', attributes: ['id', 'username'] }
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

// 4. 上傳資源 (主要邏輯在 Route，這裡保留備用)
exports.createResource = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { title, course_id, resource_type, year, grade_level, description, teacher, isAnonymous } = req.body;
    const userId = req.user.id;

    let filePath = 'temp/path.pdf'; 
    if (req.file) {
      filePath = '/uploads/' + req.file.filename;
    }

    const newResource = await Resource.create({
      title,
      course_id,
      uploader_id: userId,
      resource_type,
      teacher: teacher,
      file_path: filePath,
      year: year || new Date().getFullYear(),
      grade_level: grade_level || '學士',
      description,
      is_anonymous: isAnonymous || false
    }, { transaction });

    const pointsAwarded = 20;
    const user = await User.findByPk(userId, { transaction });
    user.current_points += pointsAwarded;
    await user.save({ transaction });

    await PointTransaction.create({
      user_id: userId,
      amount: pointsAwarded,
      transaction_type: '上傳資源',
      description: `上傳資源獎勵: ${title}`,
      balance_after: user.current_points
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: `上傳成功！獲得 ${pointsAwarded} 點數`,
      resource: newResource
    });

  } catch (error) {
    await transaction.rollback();
    console.error('創建資源錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 5. 下載資源
exports.downloadResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await Resource.findByPk(id);
    if (!resource) return res.status(404).json({ message: '資源不存在' });

    await resource.increment('download_count');

    const existingHistory = await DownloadHistory.findOne({
      where: { user_id: userId, resource_id: id }
    });

    if (!existingHistory) {
      await DownloadHistory.create({ user_id: userId, resource_id: id });
      console.log(`用戶 ${userId} 下載資源 ${id}，紀錄已建立。`);
    }

    let finalUrl = resource.file_path;
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

// 🔥 6. 新增：刪除資源功能
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

    // 刪除資源 (Sequelize 會自動處理軟刪除或硬刪除，視模型設定而定)
    await resource.destroy();

    res.json({ success: true, message: '資源已刪除' });

  } catch (error) {
    console.error('刪除資源失敗:', error);
    res.status(500).json({ message: '刪除失敗', error: error.message });
  }
};