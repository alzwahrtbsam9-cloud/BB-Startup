const axios = require('axios');

async function summarizeEmailText(text) {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد ذكي متخصص في تلخيص الإيميلات والنصوص. قم بتلخيص النص الوارد بدقة باللغة العربية إلى بالضبط 4 نقاط أساسية (Bullet points).'
          },
          {
            role: 'user',
            content: text
          }
        ],
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    );

    const content = response.data.choices[0].message.content;
    
    // تقسيم النص إلى مصفوفة لضمان إرجاع النقاط الأربع
    let points = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return points;
  }
  catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    throw new Error('فشل الاتصال بخدمة الذكاء الاصطناعي');
  }
}

module.exports = { summarizeEmailText };
