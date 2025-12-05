const nodemailer = require('nodemailer');
const { VerificationCode } = require('../models/associations');

// 設定發信器 (改用 Port 465 SSL 連線，防止 Render 逾時)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',  // 明確指定 Gmail 伺服器
  port: 465,               // Gmail 的 SSL Port
  secure: true,            // true 代表全程使用 SSL 加密
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  },
  // 防止某些雲端環境憑證檢查過嚴導致失敗
  tls: {
    rejectUnauthorized: false
  }
});

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendVerificationEmail = async (email, username = '同學') => {
  try {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 1. 存入資料庫
    // 先刪除該 Email 舊的驗證碼，避免堆積
    await VerificationCode.destroy({ where: { email: email } });
    
    await VerificationCode.create({
      user_id: null,
      email: email,
      code: code,
      expires_at: expiresAt,
      is_used: 0
    });

    // 2. 設定信件內容
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
          <hr>
          <p style="font-size: 12px; color: #888;">此為系統自動發送，請勿直接回覆。</p>
        </div>
      `
    };

    // 3. 發送郵件
    await transporter.sendMail(mailOptions);
    console.log(`✅ 驗證信已發送至: ${email}`);
    return true;

  } catch (error) {
    console.error('❌ 發送郵件失敗:', error);
    throw error;
  }
};