# EduAssess AI - Mustaqil Ishlarni Baholash Tizimi

EduAssess AI — bu o'quvchilarning mustaqil ishlarini sun'iy intellekt (Gemini AI) yordamida tahlil qilish va baholash uchun yaratilgan professional platforma. Ushbu dastur o'qituvchilarga vaqtni tejash va xolis baholash imkonini beradi.

## 🚀 Asosiy Imkoniyatlar

- **O'quvchi Ma'lumotlari:** Ism, familiya, guruh va fan nomini kiritish.
- **Moslashuvchan Baholash:** O'qituvchi o'zining baholash sistemasi (masalan, 5 ballik, 100 ballik) va mezonlarini kiritishi mumkin.
- **Fayllarni Qo'llab-quvvatlash:** PDF, Word (DOCX) va TXT formatidagi hujjatlarni yuklash va o'qish.
- **AI Nazorati:** Ishning necha foizi sun'iy intellekt yordamida yozilganini aniqlash. Agar AI ulushi 40% dan oshsa, ball avtomatik ravishda 30% ga pasaytiriladi.
- **Fanga Doirlik Tekshiruvi:** Ish tanlangan fanga qanchalik mosligini tekshirish. Agar moslik 50% dan past bo'lsa, ish baholanmaydi.
- **Batafsil Tahlil:** AI har bir mezon bo'yicha batafsil xulosa va tavsiyalar beradi.
- **Zamonaviy UI:** Tailwind CSS va Lucide-react piktogrammalari asosida yaratilgan qulay va chiroyli interfeys.

## 🛠 Texnologiyalar

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **AI Model:** Google Gemini 3 Flash
- **Fayl Ishlovchi:** Mammoth.js (Word), FileReader API
- **Animatsiyalar:** Framer Motion

## 📦 O'rnatish va Ishga Tushirish

1. Loyihani yuklab oling.
2. Zaruriy kutubxonalarni o'rnating:
   ```bash
   npm install
   ```
3. `.env` fayliga Gemini API kalitini qo'shing:
   ```env
   GEMINI_API_KEY=sizning_api_kalitingiz
   ```
4. Dasturni ishga tushiring:
   ```bash
   npm run dev
   ```

## 📝 Foydalanish Yo'riqnomasi

1. O'quvchi ma'lumotlarini (ism, familiya, guruh, fan) to'ldiring.
2. Baholash sistemasi va mezonlarini kiriting.
3. Mustaqil ish faylini yuklang.
4. "AI Baholashni Boshlash" tugmasini bosing.
5. O'ng tarafdagi natija oynasida ball, AI ulushi, fanga doirlik va batafsil tahlilni ko'ring.

---
*Yaratuvchi: AI Studio Agent*
