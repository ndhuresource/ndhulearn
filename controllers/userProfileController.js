const { User, ShopItem } = require('../models/associations');
const bcrypt = require('bcryptjs'); // 引入加密套件

const userProfileController = {
  // 1. 取得個人資料 (包含點數、裝備狀態、主題設定)
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] } // 不回傳密碼
      });

      if (!user) return res.status(404).json({ success: false, message: '用戶不存在' });

      // (A) 額外查詢當前裝備的框
      let avatarFrame = null;
      if (user.avatar_frame_id) {
        avatarFrame = await ShopItem.findByPk(user.avatar_frame_id);
      }

      // (B) 🔥🔥🔥 [新增] 查詢當前主題顏色
      let themeStyles = null;
      if (user.theme_id) {
        const themeItem = await ShopItem.findByPk(user.theme_id);
        // 如果找到了主題商品，就把它的 item_url (存放 JSON 顏色設定) 取出來
        if (themeItem && themeItem.item_url) {
          themeStyles = themeItem.item_url;
        }
      }

      // 回傳資料
      res.json({ 
        success: true, 
        data: {
          ...user.toJSON(),
          // 這裡回傳的是 URL 或 CSS 內容，方便前端直接使用
          avatarFrame: avatarFrame ? avatarFrame.item_url : null,
          themeStyles: themeStyles // 🔥 回傳主題顏色設定 (JSON string)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: '讀取失敗' });
    }
  },

  // 2. 更新個人資料 (頭貼、外框、徽章、主題、暱稱、密碼)
  updateAvatar: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // 接收所有可能的更新欄位
      const { avatarUrl, avatarFrameId, badgeId, themeId, username, password } = req.body;
      
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ success: false, message: '用戶不存在' });

      // 更新頭貼
      if (avatarUrl !== undefined) user.avatar_url = avatarUrl;
      
      // 更新外框
      if (avatarFrameId !== undefined) user.avatar_frame_id = avatarFrameId;

      // 更新徽章 (如果傳入 null 代表卸下)
      if (badgeId !== undefined) user.badge_id = badgeId;

      // 更新主題 (如果傳入 null 代表卸下)
      if (themeId !== undefined) user.theme_id = themeId;

      // 更新暱稱
      if (username !== undefined && username.trim() !== "") {
        user.username = username.trim();
      }

      // 更新密碼 (如果有填寫且不為空)
      if (password && password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(password, salt);
      }

      await user.save();

      // 回傳資料時記得濾掉密碼
      const userData = user.toJSON();
      delete userData.password_hash;

      res.json({ success: true, message: '更新成功', data: userData });
    } catch (error) {
      console.error('更新失敗:', error);
      res.status(500).json({ success: false, message: '更新失敗', error: error.message });
    }
  }
};

module.exports = userProfileController;