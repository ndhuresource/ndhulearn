// src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// 1. 檢查環境變數是否存在 (這是防止崩潰的關鍵！)
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ 嚴重錯誤: Cloudinary 環境變數未設定！上傳功能將無法使用。');
  // 我們不這裡 throw error，以免整個伺服器啟動失敗，但上傳時會報錯
}

// 2. 設定 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 3. 設定儲存引擎
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // 取得原始檔名 (去除副檔名)
    const fileName = file.originalname.split('.')[0];
    
    return {
      folder: 'ndhu-resources',
      // ⚠️ 修改重點：改用 'auto'，這樣可以自動識別圖片、PDF 或影片
      // 如果你寫 'raw'，圖片在 Cloudinary 後台會變成無法預覽的文件
      resource_type: 'auto', 
      public_id: `${Date.now()}-${fileName}`, // 加上時間戳記防止檔名重複覆蓋
    };
  },
});

const upload = multer({ storage: storage });

module.exports = upload;