const { DownloadHistory, Resource, User, Course } = require('../models/associations'); // 添加 Course 導入

// 獲取下載歷史記錄
exports.getDownloadHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const downloadHistory = await DownloadHistory.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Resource,
          as: 'resource', // 使用正確的別名
          include: [
            {
              model: User,
              as: 'uploader', // 使用正確的別名
              attributes: ['id', 'username']
            },
            {
              model: Course,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['download_time', 'DESC']]
    });
    
    res.json(downloadHistory);
  } catch (error) {
    console.error('獲取下載歷史錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 獲取資源的下載歷史
exports.getResourceDownloadHistory = async (req, res) => {
  try {
    const resourceId = req.params.resourceId;
    
    const downloadHistory = await DownloadHistory.findAll({
      where: { resource_id: resourceId },
      include: [
        {
          model: User,
          as: 'user', // 使用正確的別名
          attributes: ['id', 'username']
        }
      ],
      order: [['download_time', 'DESC']]
    });
    
    res.json(downloadHistory);
  } catch (error) {
    console.error('獲取資源下載歷史錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};