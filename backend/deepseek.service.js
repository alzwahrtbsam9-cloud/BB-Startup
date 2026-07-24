const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

async function summarizeEmailText(text) {
  try {
    const response = await openai.chat.completions.create({
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
    });

    const content = response.choices[0].message.content;
    
    let points = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return points;
  } catch (error) {
    console.error('DeepSeek API Error:', error.message);
    throw new Error('فشل الاتصال بخدمة الذكاء الاصطناعي');
  }
}

module.exports = { summarizeEmailText };
