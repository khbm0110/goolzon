# Goolzon — Next.js + Supabase

منصة رياضية عربية متكاملة، مبنية على **Next.js 15 (App Router)** و**Supabase** (Postgres حقيقي +
مصادقة + Row Level Security)، بنفس تصميم وألوان المشروع الأصلي مع دعم الوضع الليلي/الفاتح.

## الإعداد

### 1. إنشاء مشروع Supabase
أنشئ مشروعًا على [supabase.com](https://supabase.com)، ثم من **SQL Editor** شغّل الملف
`supabase/schema.sql` كاملاً — يبني كل الجداول، الصلاحيات (RLS)، والدوال المطلوبة دفعة واحدة.

### 2. متغيرات البيئة
انسخ `.env.example` إلى `.env.local` وعبّي القيم من **Settings → API** بمشروع Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # سري — لا تكشفه أبدًا في الفرونت إند
```

### 3. التشغيل
```bash
npm install
npm run dev
```
يفتح على http://localhost:3000

## البنية

```
app/                 صفحات Next.js (App Router)
components/          مكونات الواجهة
contexts/            AuthContext (مصادقة حقيقية) + ThemeContext (الوضع الليلي/الفاتح)
lib/data/            طبقة البيانات — provider.ts هو "العقد"، supabase-provider.ts التنفيذ الحقيقي
lib/auth/            طبقة المصادقة — supabase-auth.ts يربط Supabase Auth
lib/supabase/        عملاء Supabase (browser / server / admin)
middleware.ts        تحديث الجلسة + حماية مسارات /admin
supabase/schema.sql  المخطط الكامل لقاعدة البيانات (جداول + RLS + دوال)
types/                تعريفات TypeScript المشتركة
```

## كيف تعمل طبقة البيانات

كل صفحة تسحب البيانات من `lib/data` فقط (`import { data } from '@/lib/data'`)، وأبدًا لا تتحدث مع
Supabase مباشرة. هذا يعني: 
- التبديل بين بيانات تجريبية (`mock-provider.ts`) وبيانات حقيقية (`supabase-provider.ts`) صار بتغيير
  سطر واحد في `lib/data/index.ts`
- نفس الفكرة بالضبط لـ `lib/auth/index.ts`

**الوضع الحالي: مفعّل على `supabase-provider.ts` (بيانات حقيقية دائمة).**

## الأمان المُطبّق

- **Row Level Security (RLS)** على كل جدول — القراءة العامة للمحتوى، الكتابة للأدمن فقط، البيانات
  الشخصية (مفضلة، متابعات، توقعات) يقدر يشوفها/يعدّلها صاحبها فقط
- **مفتاح service_role** يُستخدم فقط بكود السيرفر (حظر/حذف مستخدم)، أبدًا بالمتصفح
- **Security headers** كاملة في `next.config.mjs` (CSP, HSTS, X-Frame-Options...)
- **Middleware** يحمي `/admin` على مستوى الحافة (edge) قبل ما يشتغل أي كود بالصفحة

## البيانات الحقيقية للمباريات/اللاعبين (API-Football)

الجداول والدوال جاهزة (`matches`, `players`, `standings`...)، لكن تعبئتها ببيانات حية تحتاج ربط
API-Football عبر مهام مجدولة (Cron Jobs / Supabase Edge Functions) — هذي الخطوة التالية بعد التأكد
من استقرار قاعدة البيانات والمصادقة.

## الأشياء المتبقية (تحتاج خدمة خارجية)

- **API-Football**: بيانات مباريات/لاعبين حية بدل الأمثلة التوضيحية الحالية
- **Gemini AI**: إعادة كتابة الأخبار، الاستيراد التلقائي عبر RSS
- **Google Analytics / AdSense**: التحليلات والإعلانات الحقيقية
