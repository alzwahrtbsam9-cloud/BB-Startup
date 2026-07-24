/**
 * دالة إرسال النص إلى خادم Render وتلقي الملخص
 * انسخ هذه الدالة وضعها في ملف script.js وقم بربطها مع زر أو حدث الإرسال لديك
 */
async function getEmailSummary(textInput) {
  try {
    // إظهار حالة التحميل للمستخدم (اختياري)
    console.log('جاري إرسال النص للتلخيص...');

    const response = await fetch('https://bb-backend-ic38.onrender.com/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // لاحظ أننا أرسلنا المفتاح باسم emailText تماماً كما يطلبه الباك إند لديك
      body: JSON.stringify({ emailText: textInput })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('تم التلخيص بنجاح:', data.summary);
      return data.summary; // هذه مصفوفة تحتوي على الـ 4 نقاط الملخصة
    } else {
      throw new Error(data.message || 'حدث خطأ غير متوقع');
    }

  } catch (error) {
    console.error('خطأ في الاتصال:', error);
    alert(error.message || 'تعذّر الاتصال بالخادم. حاول مجددًا بعد قليل.');
    return null;
  }
}

// --- مثال على كيفية استخدام الدالة عند الضغط على زر التلخيص ---
/*
document.getElementById('myButton').addEventListener('click', async () => {
  const userText = document.getElementById('myTextArea').value;
  
  if (!userText.trim()) {
    alert('الرجاء إدخال نص أولاً!');
    return;
  }

  const summaryPoints = await getEmailSummary(userText);
  
  if (summaryPoints) {
    // عرض النقاط في الشاشة (مثلاً تحويلها إلى قائمة HTML)
    const resultContainer = document.getElementById('resultArea');
    resultContainer.innerHTML = '<ul>' + summaryPoints.map(point => `<li>${point}</li>`).join('') + '</ul>';
  }
});
*/
