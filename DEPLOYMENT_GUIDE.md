# Taj POS Pro - GitHub & Netlify Deployment Guide
# گٹ ہب اور نیٹلی فائی پر ویب سائٹ لگانے کا مکمل گائیڈ

---

### 1. کیا یہ ویب سائٹ Netlify اور GitHub کو سپورٹ کرتی ہے؟
**جی ہاں! 100% مکمل سپورٹ کرتی ہے۔**

- **پہلی بات (No Proprietary Framework):** یہ کوئی ایسی اجنبی لینگویج یا پیچیدہ فریم ورک نہیں ہے جو نیٹلی فائی پر نہ چل سکے۔ جب آپ اس کوڈ کو بلڈ کرتے ہیں (`npm run build`)، تو یہ مکمل طور پر **پیور HTML (`dist/index.html`)، خالص CSS (`dist/assets/*.css`) اور خالص JavaScript (`dist/assets/*.js`)** میں تبدیل ہو جاتا ہے۔
- براؤزر اور نیٹلی فائی کو صرف یہی **HTML, CSS, اور JavaScript** ملتی ہے۔
- نیٹلی فائی (Netlify) دنیا کا سب سے بڑا پلیٹ فارم ہی اسی قسم کی جدید ویب ایپس کے لیے بنا ہے۔

---

### 2. گٹ ہب (GitHub) پر کوڈ کیسے اپلوڈ کریں؟

اگر آپ کے پاس کمپیوٹر میں Git موجود ہے:
```bash
git init
git add .
git commit -m "Taj POS Pro ready for Netlify"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

### 3. نیٹلی فائی (Netlify) پر 1-کلک لائیو ڈپلائی کرنے کا طریقہ

ہم نے آپ کے لیے **`netlify.toml`** فائل پہلے سے شامل کر دی ہے، جس کی وجہ سے نیٹلی فائی خود بخود سب کچھ سمجھ جاتا ہے:

1. **Netlify.com** پر جائیں اور لاگ ان کریں۔
2. **"Add new site"** پر کلک کریں اور **"Import an existing project"** منتخب کریں۔
3. **GitHub** منتخب کریں اور اپنی ریپوزیٹری سلیکٹ کریں۔
4. نیٹلی فائی خود بخود یہ سیٹنگز لگا دے گا:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. **"Deploy Site"** پر کلک کر دیں۔
   - صرف 1 منٹ میں آپ کی ویب سائٹ پوری دنیا کے لیے لائیو ہو جائے گی!

---

### 4. کسٹم ڈومین (Custom Domain) کیسے لگائیں؟

1. نیٹلی فائی میں اپنی سائٹ اوپن کریں۔
2. **Site configuration > Domain management > Add domain** پر کلک کریں۔
3. اپنا ڈومین انٹر کریں (مثلاً: `tajpos.com`)۔
4. اپنے ڈومین پرووائیڈر (GoDaddy, Namecheap وغیرہ) میں جا کر Netlify کے DNS ریکارڈز (CNAME یا Netlify Nameservers) لگا دیں۔
5. نیٹلی فائی مفت SSL (HTTPS) خود بخود چالو کر دے گا۔

---

### 5. فائر بیس میں ڈومین کی اجازت (Fixing `auth/unauthorized-domain`)

جب آپ نیٹلی فائی یا اپنے کسٹم ڈومین پر سائٹ چلاتے ہیں، تو گوگل سیکیورٹی صرف ان ڈومینز پر گوگل لاگ ان کی اجازت دیتی ہے جو فائر بیس میں درج ہوں:

1. **[Firebase Console](https://console.firebase.google.com)** اوپن کریں۔
2. اپنا پروجیکٹ سلیکٹ کریں۔
3. بائیں جانب **Authentication** پر جائیں۔
4. اوپر **Settings** ٹیب پر کلک کریں۔
5. **Authorized domains** پر جائیں اور **"Add domain"** پر کلک کریں۔
6. اپنا نیٹلی فائی ڈومین (مثلاً: `your-shop.netlify.app`) اور اپنا کسٹم ڈومین (مثلاً: `tajpos.com`) شامل کر دیں۔
7. **محفوظ ہو گیا!** اب گوگل پاپ اپ کسی ایرر کے بغیر چلے گا۔
*(نوٹ: اگر کسی وجہ سے آپ ڈومین ایڈ نہ بھی کر سکیں، تو ایپ میں ڈائریکٹ "Shop Owner Sign-in" کا بٹن موجود ہے جو بنا کسی پاپ اپ کے فوری ایڈمن لاگ ان کروا دیتا ہے)*

---

### 6. نیٹلی فائی کلاؤڈ فنکشنز (Netlify Cloud Functions in JavaScript)

ہم نے آپ کی فرمائش کے مطابق **`netlify/functions/`** فولڈر بنا دیا ہے جس میں اسٹینڈرڈ جاوا اسکرپٹ (Node.js) میں فنکشنز چل سکتے ہیں:
- فائل: `netlify/functions/api.js`
- جب آپ سائٹ ڈپلائی کریں گے تو آپ کا سرور لیس فنکشن اس ایڈریس پر دستیاب ہو گا:
  `https://your-domain.netlify.app/.netlify/functions/api`
- آپ اس میں اپنا کوئی بھی بیک اینڈ یا پرائیویٹ جاوا اسکرپٹ لاجک لکھ سکتے ہیں۔
