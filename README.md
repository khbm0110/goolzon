# Goolzon — Next.js Rebuild

منصة رياضية عربية، مبنية من الصفر على **Next.js 15 (App Router)** بنفس تصميم وألوان المشروع الأصلي
(Cairo font, dark theme, primary/secondary/accent)، مع فصل واضح بين الواجهة وطبقة البيانات
عشان نقدر نربطها بـ **Appwrite** لاحقًا كآخر خطوة بدون ما نلمس صفحة وحدة.

## التشغيل محليًا

```bash
npm install
npm run dev
```

يفتح على http://localhost:3000

## البنية

```
app/                 صفحات Next.js (App Router)
components/          مكونات الواجهة (Header, NewsCard, MatchTicker...)
contexts/            AuthContext (يلف طبقة auth القابلة للاستبدال)
lib/data/            طبقة البيانات — provider.ts هو "العقد"، mock-provider.ts التنفيذ الحالي
lib/auth/            طبقة المصادقة — نفس فكرة lib/data لكن للمستخدمين
lib/services/        خدمات مساعدة (تنسيق التاريخ...)
types/                تعريفات TypeScript المشتركة
```

## لماذا فيه "Mock" بدل بيانات حقيقية؟

بناءً على طلبك، قررنا نأجل ربط Appwrite لآخر مرحلة. عشان ما نتوقف عن بناء الواجهة والميزات،
بنينا طبقتين قابلتين للاستبدال:

- **`lib/data/index.ts`** — كل الصفحات تطلب البيانات من هنا فقط. حاليًا يشغّل `mock-provider.ts`
  (بيانات تجريبية من المشروع الأصلي). لاحقًا: نكتب `appwrite-provider.ts` بنفس الواجهة (interface)
  في `provider.ts`، ونغيّر سطر واحد فقط في `index.ts`.
- **`lib/auth/index.ts`** — نفس الفكرة بالضبط للمصادقة. `mock-auth.ts` **للتطوير فقط** ولا يتحقق
  من كلمات مرور حقيقية — ممنوع استخدامه في الإنتاج.

## أمان مُطبّق من الآن

- Security headers كاملة في `next.config.mjs` (CSP, HSTS, X-Frame-Options...)
- لا مفاتيح API ولا أسرار مكتوبة في الكود — كل شيء عبر `.env.local` (انظر `.env.example`)
- فصل واضح بين ما يُرسل للمتصفح (anon/public keys) وما يبقى على السيرفر فقط

## الخطوات القادمة (بالترتيب)

1. **صفحات إضافية**: الأندية، البطولات، اللاعبون، الفيديو، لوحة الإدارة
2. **الميزات الناقصة** من قائمتك: النتائج المباشرة، الإشعارات، التفاعل المجتمعي، الإحصائيات المتقدمة
3. **ربط Appwrite** (آخر خطوة): إنشاء `appwrite-provider.ts` و`appwrite-auth.ts`، تفعيل الـ middleware
   للمصادقة الحقيقية، وتجهيز الـ API endpoints بحيث تصلح مباشرة لتطبيق Android/Kotlin
