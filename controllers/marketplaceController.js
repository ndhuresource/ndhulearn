const { MarketplacePost, MarketplaceComment, User, ShopItem } = require('../models/associations');
const { Op } = require('sequelize');

const marketplaceController = {
  // 1. 取得貼文列表
  getPosts: async (req, res) => {
    try {
      const posts = await MarketplacePost.findAll({
        order: [['created_at', 'DESC']],
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar_url', 'is_verified', 'avatar_frame_id', 'badge_id'], 
          include: [
            { model: ShopItem, as: 'avatarFrame', attributes: ['item_url', 'item_name'] },
            { model: ShopItem, as: 'badge', attributes: ['item_url', 'item_name'] }
          ]
        }]
      });
      res.json(posts);
    } catch (error) {
      console.error("Get Posts Error:", error); 
      res.status(500).json({ message: '伺服器錯誤' });
    }
  },

  // 2. 取得單篇詳情
  getPostById: async (req, res) => {
    try {
      const { id } = req.params;
      const post = await MarketplacePost.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'avatar_url', 'is_verified', 'avatar_frame_id', 'badge_id'],
            include: [
              { model: ShopItem, as: 'avatarFrame', attributes: ['item_url'] },
              { model: ShopItem, as: 'badge', attributes: ['item_url', 'item_name'] }
            ]
          },
          {
            model: MarketplaceComment,
            as: 'comments',
            include: [{
              model: User,
              as: 'commenter',
              attributes: ['id', 'username', 'avatar_url', 'avatar_frame_id', 'badge_id'],
              include: [
                { model: ShopItem, as: 'avatarFrame', attributes: ['item_url'] },
                { model: ShopItem, as: 'badge', attributes: ['item_url'] }
              ]
            }]
          }
        ],
        order: [[ { model: MarketplaceComment, as: 'comments' }, 'created_at', 'ASC' ]]
      });

      if (!post) return res.status(404).json({ message: '找不到該貼文' });
      res.json(post);
    } catch (error) {
      console.error("Get Post By ID Error:", error); 
      res.status(500).json({ message: '讀取失敗' });
    }
  },

  // 3. 新增留言
  addComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { content, isAnonymous } = req.body;
      const userId = req.user.id;

      const post = await MarketplacePost.findByPk(id);
      if (!post) return res.status(404).json({ message: '貼文不存在' });

      const comment = await MarketplaceComment.create({
        post_id: id,
        user_id: userId,
        content,
        is_anonymous: isAnonymous || false 
      });

      await post.increment('comment_count');
      res.status(201).json({ message: '留言成功', data: comment });
    } catch (error) {
      res.status(500).json({ message: '留言失敗', error: error.message });
    }
  },

  // 4. 標記售出
  markAsSold: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const post = await MarketplacePost.findByPk(id);
      if (!post) return res.status(404).json({ message: '貼文不存在' });
      if (post.user_id !== userId) return res.status(403).json({ message: '無權限操作' });

      post.is_sold = 1;
      await post.save();
      res.json({ message: '已更新為售出狀態' });
    } catch (error) {
      res.status(500).json({ message: '更新失敗', error: error.message });
    }
  },

  // 🔥 5. 新增：刪除留言功能
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params; // 留言 ID
      const userId = req.user.id;

      const comment = await MarketplaceComment.findByPk(id);
      
      if (!comment) {
        return res.status(404).json({ message: '留言不存在' });
      }

      // 檢查權限：只有留言者本人可以刪除
      if (comment.user_id !== userId) {
        return res.status(403).json({ message: '你沒有權限刪除這則留言' });
      }

      // 扣減貼文的留言數
      const post = await MarketplacePost.findByPk(comment.post_id);
      if (post) {
        await post.decrement('comment_count');
      }

      await comment.destroy();

      res.json({ message: '留言已刪除' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '刪除留言失敗' });
    }
  }
};

module.exports = marketplaceController;