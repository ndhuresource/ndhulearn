const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

// 加載環境變量
dotenv.config();

const app = express();

// 從環境變量獲取允許的來源
// 部署時，ALLOWED_ORIGINS 會設定為你的 Vercel/Netlify 前端網址
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) // trim() 移除空白
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];

// 確保允許的來源清單中包含本地開發用的來源
if (process.env.NODE_ENV === 'development') {
    if (!allowedOrigins.includes('http://localhost:3000')) allowedOrigins.push('http://localhost:3000');
    if (!allowedOrigins.includes('http://localhost:5173')) allowedOrigins.push('http://localhost:5173');
}

console.log('Allowed origins:', allowedOrigins);

const isDevelopment = process.env.NODE_ENV === 'development';

// ==========================================
// 速率限制配置 
// ==========================================

// 1. 全局限制 (防止惡意灌爆服務器)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: '請求過於頻繁，請稍後再試',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// 2. 一般 API 限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 2000 : 1000, 
  message: 'API請求過於頻繁，請稍後再試',
});
app.use('/api/', apiLimiter);

// 3. 認證相關限制 (最關鍵的地方：註冊/登入/驗證碼)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: '認證請求過於頻繁，請稍後再試',
});
app.use('/api/auth', authLimiter);

// ==========================================

// 中間件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 配置
app.use(cors({
  origin: function (origin, callback) {
    // 允許沒有 origin 的請求 (例如 Postman, 或同源請求)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from: ${origin}`);
      
      // 開發模式下，如果沒明確設定，暫時允許，便於測試
      if (isDevelopment) {
        console.log(`Development mode: allowing origin ${origin}`);
        callback(null, true);
      } else {
        // 生產環境，明確拒絕未經允許的來源
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());
app.use(morgan(isDevelopment ? 'dev' : 'combined'));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const staticOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : '0',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
};

// 檔案服務端點
app.use('/media', express.static('media', staticOptions));
app.use('/uploads', express.static('uploads', staticOptions));

// 數據庫連接
const db = require('./config/database');

db.authenticate()
  .then(() => console.log('數據庫連接成功'))
  .catch(err => {
    console.error('數據庫連接失敗:', err);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// 加載模型關聯
const { defineAssociations } = require('./models/associations');
defineAssociations();
console.log('模型關聯已加載');

// 健康檢查端點 (health check)
app.get('/health', async (req, res) => {
  try {
    await db.authenticate();
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// ==========================================
// API 路由 
// ==========================================

// 1. 原有的路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/groups', require('./routes/departmentgroups'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/curriculums', require('./routes/curriculums'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/ratings', require('./routes/ratings'));

// 2. 新增的路由 (買賣、聊天、商店、點數)
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/points', require('./routes/points'));
app.use('/api/shop', require('./routes/shop'));

// 用戶與個人資料路由
app.use('/api/users', require('./routes/users')); 
app.use('/api/profile', require('./routes/userProfile')); 

// ==========================================

// API 文檔端點
app.get('/api', (req, res) => {
  res.json({
    message: '東華大學學習資源平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      colleges: '/api/colleges',
      departments: '/api/departments',
      groups: '/api/groups', 
      courses: '/api/courses',
      curriculums: '/api/curriculums',
      resources: '/api/resources',
      users: '/api/users',
      ratings: '/api/ratings',
      marketplace: '/api/marketplace',
      forum: '/api/forum',
      points: '/api/points',
      shop: '/api/shop',
      profile: '/api/profile'
    }
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('錯誤詳情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      message: '文件大小超過限制',
      maxSize: '10MB'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ 
      message: '不支持的文件類型'
    });
  }
  
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      message: '數據驗證失敗',
      errors
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: '數據已存在',
      field: err.errors[0].path
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: '無效的令牌' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: '令牌已過期' });
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      message: '跨域請求被拒絕',
      allowedOrigins: allowedOrigins
    });
  }
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? '伺服器內部錯誤' 
    : err.message;
  
  res.status(statusCode).json({ 
    message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.message, stack: err.stack })
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API端點不存在' });
});

app.use('*', (req, res) => {
  if (req.accepts('html')) {
    res.status(404).send('頁面不存在');
  } else {
    res.status(404).json({ message: '資源不存在' });
  }
});

module.exports = app;