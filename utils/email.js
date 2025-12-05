const nodemailer = require('nodemailer');
const { VerificationCode } = require('../models/associations');

// 👇 修改重點：回歸最原始、最強制的 SSL 連線設定
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',  // 明確指定主機
  port: 465,               // 明確指定 SSL Port
  secure: true,            // 啟用 SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // 👇 關鍵設定 1：強制使用 IPv4 (Render 必備)
  family: 4, 
  
  // 👇 關鍵設定 2：放寬 TLS 檢查 (避免雲端憑證錯誤)
  tls: {
    rejectUnauthorized: false
  },
  
  // 👇 關鍵設定 3：連線逾時保護
  connectionTimeout: 10000,
  greetingTimeout: 10000
});

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendVerificationEmail = async (email, username = '同學') => {
  try {
    console.log(`🚀 [Debug] 準備發信給: ${email} (使用 SSL Port 465 + IPv4)`);
    
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 資料庫操作
    await VerificationCode.destroy({ where: { email: email } });
    await VerificationCode.create({
      user_id: null,
      email: email,
      code: code,
      expires_at: expiresAt,
      is_used: 0
    });

    const mailOptions = {
      from: `"東華學習資源平台" <${process.env.EMAIL_USER}>`, 
      to: email,
      subject: '【驗證碼】東華學習資源平台註冊驗證',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #1367c2;">歡迎加入東華學習資源平台！</h2>
          <p>親愛的同學 ${username} 您好：</p>
          <p>您的註冊驗證碼為：</p>
          <h1 style="color: #f57f17; letter-spacing: 5px;">${code}</h1>
          <p>此驗證碼將在 15 分鐘後失效。</p>
        </div>
      `
    };

    console.log('📨 [Debug] 正在連線 Gmail...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 驗證信發送成功! ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('❌ 發送郵件失敗 (詳細錯誤):', error);
    throw error;
  }
};