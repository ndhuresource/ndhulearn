const multer = require('multer');
const path = require('path');

// 使用內存存儲（最適合S3上傳）
const storage = multer.memoryStorage();

// 文件過濾器 - 只允許PDF
const fileFilter = (req, file, cb) => {
  // 只允許PDF文件
  const allowedTypes = ['application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允許上傳PDF文件'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制（對於PDF足夠）
  }
});

module.exports = { upload };