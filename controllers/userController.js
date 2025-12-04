const { User, Resource, DownloadHistory, ResourceRating, Course } = require('../models/associations'); // 添加 Course 導入
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// 獲取使用者上傳的資源
exports.getUserResources = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 檢查使用者是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '使用者不存在' });
    }

    // 檢查是否為當前使用者或管理員
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: '權限不足' });
    }

    const resources = await Resource.findAndCountAll({
      where: { uploader_id: userId },
      include: [
        {
          model: Course,
          as: 'course', // 使用正確的別名
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']],
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
    console.error('獲取使用者資源錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 獲取使用者下載歷史
exports.getUserDownloads = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 檢查使用者是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '使用者不存在' });
    }

    // 檢查是否為當前使用者或管理員
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: '權限不足' });
    }

    const downloads = await DownloadHistory.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Resource,
          as: 'resource', // 使用正確的別名
          include: [
            {
              model: Course,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['download_time', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      downloads: downloads.rows,
      totalCount: downloads.count,
      totalPages: Math.ceil(downloads.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('獲取使用者下載歷史錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 更新使用者個人資料
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email } = req.body;

    // 檢查使用者是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '使用者不存在' });
    }

    // 檢查是否為當前使用者或管理員
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: '權限不足' });
    }

    // 檢查郵箱是否已被其他使用者使用
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { email, id: { [Op.ne]: userId } }
      });

      if (existingUser) {
        return res.status(409).json({ message: '郵箱已被其他使用者使用' });
      }
    }

    // 更新使用者資料
    await user.update({
      username: username || user.username,
      email: email || user.email
    });

    res.json({ message: '個人資料更新成功', user });
  } catch (error) {
    console.error('更新使用者個人資料錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 變更密碼
exports.changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    // 檢查使用者是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '使用者不存在' });
    }

    // 檢查是否為當前使用者
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: '權限不足' });
    }

    // 驗證當前密碼
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '當前密碼不正確' });
    }

    // 加密新密碼
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密碼
    await user.update({ password_hash: hashedPassword });

    res.json({ message: '密碼變更成功' });
  } catch (error) {
    console.error('變更密碼錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};