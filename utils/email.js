const nodemailer = require('nodemailer');
const { VerificationCode } = require('../models/associations');

// 👇 修改重點：改用 Port 587 並關閉 secure (這是 STARTTLS 的標準寫法)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,               // 改用 587
  secure: false,           // 587 必須設為 false
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false, // 防止憑證問題
    ciphers: 'SSLv3'           // 增加相容性
  },
  // 👇👇👇 關鍵修正：強制使用 IPv4 👇👇👇
  family: 4,
  // 👇 增加連線逾時設定 (給它多一點時間，或快速失敗)
  connectionTimeout: 10000, // 10秒
  greetingTimeout: 10000,
  socketTimeout: 10000
});

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendVerificationEmail = async (email, username = '同學') => {
  try {
    console.log(`🚀 [Debug] 準備發信給: ${email} 使用帳號: ${process.env.EMAIL_USER}`); // Debug Log
    
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 1. 存入資料庫
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
    console.log('📨 [Debug] 正在連線 Gmail...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 驗證信發送成功! Message ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('❌ 發送郵件失敗 (詳細錯誤):', error);
    throw error;
  }
};