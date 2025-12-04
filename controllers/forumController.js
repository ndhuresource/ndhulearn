const { ForumPost, ForumComment, User, PollOption, PollVote, ShopItem, ForumLike } = require('../models/associations');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const forumController = {
  // 取得貼文列表 (🔥 修改：這裡加入了外框與徽章的關聯查詢)
  getPosts: async (req, res) => {
    try {
      // 1. 接收 sort 參數
      const { page = 1, limit = 10, search, sort } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};
      if (search) {
        whereClause = {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { content: { [Op.like]: `%${search}%` } }
          ]
        };
      }

      // 2. 設定排序邏輯
      let orderClause = [['created_at', 'DESC']]; // 預設：最新發布

      if (sort === 'likes') {
        orderClause = [['like_count', 'DESC']]; // 依愛心數 (多到少)
      } else if (sort === 'comments') {
        orderClause = [['comment_count', 'DESC']]; // 依留言數 (多到少)
      }

      const { count, rows } = await ForumPost.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: orderClause,
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar_url', 'avatar_frame_id', 'badge_id'],
          // 🔥 重點修改：這裡加入了 include，讓前端能拿到外框(avatarFrame)和徽章(badge)的網址
          include: [
            { model: ShopItem, as: 'avatarFrame', attributes: ['item_url'] },
            { model: ShopItem, as: 'badge', attributes: ['item_url'] }
          ]
        }]
      });

      res.json({
        success: true,
        data: rows,
        meta: { total: count, page: parseInt(page) }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
  },

  // 取得詳情
  getPostById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;

      const post = await ForumPost.findByPk(id, {
        include: [
          { 
            model: User, as: 'author', 
            attributes: ['id', 'username', 'avatar_url', 'avatar_frame_id', 'badge_id'],
            include: [
              { model: ShopItem, as: 'avatarFrame', attributes: ['item_url'] },
              { model: ShopItem, as: 'badge', attributes: ['item_url'] }
            ]
          },
          { model: PollOption, as: 'pollOptions' }, 
          { 
            model: ForumComment, as: 'comments',
            attributes: { exclude: ['user_id', 'post_id'] }, 
            include: [{ 
              model: User, as: 'commenter', 
              attributes: ['id', 'username', 'avatar_url', 'avatar_frame_id', 'badge_id'],
              include: [
                { model: ShopItem, as: 'avatarFrame', attributes: ['item_url'] },
                { model: ShopItem, as: 'badge', attributes: ['item_url'] }
              ]
            }],
            order: [['created_at', 'ASC']]
          },
          {
            model: ForumLike, as: 'likes', required: false,
            where: userId ? { user_id: userId } : { user_id: 0 }
          }
        ]
      });

      if (!post) return res.status(404).json({ success: false, message: '貼文不存在' });
      
      const postData = post.toJSON();
      postData.isLiked = postData.likes && postData.likes.length > 0;
      delete postData.likes; 

      res.json({ success: true, data: postData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 建立貼文
  createPost: async (req, res) => {
    const transaction = await sequelize.transaction(); 
    try {
      const { title, content, pollOptions, isAnonymous } = req.body; 
      const userId = req.user.id;

      let imageUrl = null;
      if (req.file && req.file.path) {
        imageUrl = req.file.path; 
      }

      const post = await ForumPost.create({ 
        user_id: userId, 
        title, 
        content,
        image_url: imageUrl, 
        is_anonymous: isAnonymous === 'true' || isAnonymous === true 
      }, { transaction });

      let optionsArray = [];
      if (pollOptions) {
        if (typeof pollOptions === 'string') {
           try {
             optionsArray = JSON.parse(pollOptions);
           } catch (e) {
             optionsArray = [pollOptions];
           }
        } else if (Array.isArray(pollOptions)) {
           optionsArray = pollOptions;
        }
      }

      if (optionsArray.length > 0) {
        const validOptions = optionsArray.filter(opt => opt && opt.trim() !== "");
        
        if (validOptions.length >= 2) {
          if (validOptions.length > 4) {
            await transaction.rollback();
            return res.status(400).json({ message: '投票最多只能有 4 個選項' });
          }

          const optionsData = validOptions.map(opt => ({
            post_id: post.id,
            option_text: opt,
            vote_count: 0
          }));
          
          await PollOption.bulkCreate(optionsData, { transaction });
        } else if (optionsArray.length > 0) {
           await transaction.rollback();
           return res.status(400).json({ message: '投票至少需要兩個有效選項' });
        }
      }

      await transaction.commit(); 
      res.status(201).json({ success: true, message: '發文成功', data: post });

    } catch (error) {
      await transaction.rollback(); 
      console.error(error);
      res.status(500).json({ success: false, message: '發文失敗', error: error.message });
    }
  },

  // 投票功能
  votePoll: async (req, res) => {
    try {
      const { optionId } = req.body;
      const userId = req.user.id;

      const option = await PollOption.findByPk(optionId);
      if (!option) return res.status(404).json({ message: '選項不存在' });

      const existingVote = await PollVote.findOne({ 
        where: { user_id: userId, option_id: optionId } 
      });

      if (existingVote) {
        return res.status(400).json({ message: '你已經投過這個選項了' });
      }

      await option.increment('vote_count');
      await PollVote.create({ user_id: userId, option_id: optionId });

      res.json({ success: true, message: '投票成功' });
    } catch (error) {
      console.error(error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: '你已經投過票了' });
      }
      res.status(500).json({ success: false, message: '投票失敗' });
    }
  },

  // 點讚功能
  toggleLike: async (req, res) => {
    try {
      const { id } = req.params; // post id
      const userId = req.user.id;

      const post = await ForumPost.findByPk(id);
      if (!post) return res.status(404).json({ message: '貼文不存在' });

      const existingLike = await ForumLike.findOne({
        where: { user_id: userId, post_id: id }
      });

      let isLiked = false;

      if (existingLike) {
        await existingLike.destroy();
        await post.decrement('like_count');
        isLiked = false;
      } else {
        await ForumLike.create({ user_id: userId, post_id: id });
        await post.increment('like_count');
        isLiked = true;
      }

      await post.reload();

      res.json({ 
        success: true, 
        message: isLiked ? '已按讚' : '已取消讚', 
        isLiked, 
        likeCount: post.like_count 
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: '操作失敗' });
    }
  },

  // 刪除貼文
  deletePost: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const post = await ForumPost.findByPk(id);
      if (!post) return res.status(404).json({ message: '貼文不存在' });

      if (post.user_id !== userId) {
        return res.status(403).json({ message: '無權限刪除此貼文' });
      }

      await post.destroy();
      res.json({ success: true, message: '貼文已刪除' });

    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: '刪除失敗' });
    }
  },

  // 新增留言
  addComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { content, isAnonymous, is_anonymous } = req.body; 
      const userId = req.user.id;

      const post = await ForumPost.findByPk(id);
      if (!post) return res.status(404).json({ success: false, message: '貼文不存在' });

      const isAnonValue = isAnonymous === true || isAnonymous === 'true' || is_anonymous === true || is_anonymous === 'true';

      const comment = await ForumComment.create({ 
        post_id: id, 
        user_id: userId, 
        content,
        is_anonymous: isAnonValue
      });
      await post.increment('comment_count');

      res.status(201).json({ success: true, message: '留言成功', data: comment });
    } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({ success: false, message: '留言失敗' });
    }
  },

  // 刪除留言
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params; 
      const userId = req.user.id;

      const comment = await ForumComment.findByPk(id);
      
      if (!comment) {
        return res.status(404).json({ success: false, message: '留言不存在' });
      }

      if (comment.user_id !== userId) {
        return res.status(403).json({ success: false, message: '你沒有權限刪除這則留言' });
      }

      const post = await ForumPost.findByPk(comment.post_id);
      if (post) {
        await post.decrement('comment_count');
      }

      await comment.destroy();

      res.json({ success: true, message: '留言已刪除' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: '刪除留言失敗' });
    }
  }
};

module.exports = forumController;