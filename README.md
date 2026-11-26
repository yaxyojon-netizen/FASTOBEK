# 🚀 Fasto Brew & Bites — NFC Onlayn Menyu Tizimi

## 📂 Loyiha haqida
Ushbu loyiha restoran va kafelar uchun maxsus ishlab chiqilgan NFC/QR onlayn menyu, savatcha va buyurtmalarni boshqarish (Admin KDS) tizimidir.

---

## 🛠️ VS Code da ishga tushirish:

### 1-qadam. Loyihani VS Code da ochish
VS Code dasturini oching va menyudan:
`File` ➔ `Open Folder...` ni bosing va quyidagi papkani tanlang:
`C:\Users\Administrator\.gemini\antigravity\scratch\fasto-brew-and-bites`

*(Yoki terminalda: `code C:\Users\Administrator\.gemini\antigravity\scratch\fasto-brew-and-bites`)*

---

### 2-qadam. Terminalni ochish va paketlarni o'rnatish
VS Code ichida terminalni oching (`Ctrl + ~` yoki menyudan `Terminal` ➔ `New Terminal`).

Quyidagi buyruqni kiriting:
```bash
npm install
```

---

### 3-qadam. Serverni ishga tushirish
Terminalda quyidagi buyruqni tering:
```bash
npm start
```
*(yoki shunchaki `node server.js`)*

> 💡 **Eng oson usul:** Klaviaturangizda shunchaki **`F5`** tugmasini bosing — VS Code serverni avtomatik ishga tushiradi!

---

## 🌍 Render’da internetga joylash

Loyiha Render web service va PostgreSQL bilan ishlashga tayyorlangan. Mijozlar havolani boshqa Wi-Fi yoki mobil internetdan ham ochishi mumkin.

1. O‘zgarishlarni GitHub’dagi repoga joylang.
2. Render’da PostgreSQL database yarating.
3. Render’da **New > Blueprint** orqali repozitoriyani ulang va `render.yaml` yordamida web service yarating. Yoki **New > Web Service** ochib, build command sifatida `npm ci`, start command sifatida `npm start` kiriting.
4. Web service’ning **Environment** bo‘limida quyidagilarni sozlang:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = PostgreSQL bazasining **Internal Database URL** manzili
   - `ADMIN_PIN` = o‘zingiz tanlagan 4 xonali maxfiy PIN (standart `7777` dan foydalanmang)
5. Deploy muvaffaqiyatli tugagach, Render bergan `https://...onrender.com` havolani mijozlarga yuboring.

PostgreSQL ulanganida buyurtmalar va ofitsiant chaqiruvlari bazada saqlanadi. Lokal dasturlashda baza sozlanmagan bo‘lsa, ma’lumotlar faqat server ishlayotgan paytda saqlanadi. Render’da database yaratishdan oldin tarif va to‘lov shartlarini tekshiring.

> **Eslatma:** `/admin` paneli internetdan ochiq bo‘ladi. Deploy vaqtida `ADMIN_PIN` ni albatta o‘zgartiring va uni mijozlarga yubormang.
