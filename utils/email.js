const { VerificationCode } = require('../models/associations');

// 生成 6 位數驗證碼
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendVerificationEmail = async (email, username = '同學') => {
  try {
    console.log(`🚀 [Debug] (Brevo API) 準備發信給: ${email}`);
    
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

    // 2. 準備 API 請求資料
    // Brevo API 文件: https://developers.brevo.com/reference/sendtransacemail
    const apiUrl = 'https://api.brevo.com/v3/smtp/email';
    const apiKey = process.env.EMAIL_PASS; // 這裡是 xkeysib- 開頭的 Key

    const emailData = {
      sender: {
        name: "東華學習資源平台",
        email: process.env.EMAIL_USER // 你的 Brevo 登入信箱
      },
      to: [
        { email: email, name: username }
      ],
      subject: "【驗證碼】東華學習資源平台註冊驗證",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #1367c2;">歡迎加入東華學習資源平台！</h2>
          <p>親愛的同學 ${username} 您好：</p>
          <p>您的註冊驗證碼為：</p>
          <h1 style="color: #f57f17; letter-spacing: 5px;">${code}</h1>
          <p>此驗證碼將在 15 分鐘後失效。</p>
          <hr>
          <p style="font-size: 12px; color: #888;">Powered by NDHU Resource Platform</p>
        </div>
      `
    };

    // 3. 使用 fetch 發送 HTTP 請求 (這走 Port 443，絕對不會被擋)
    console.log('📨 [Debug] 正在呼叫 Brevo API...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Brevo API Error: ${JSON.stringify(data)}`);
    }

    console.log(`✅ 驗證信發送成功! Message ID: ${data.messageId}`);
    return true;

  } catch (error) {
    console.error('❌ 發送郵件失敗:', error);
    throw error;
  }
};