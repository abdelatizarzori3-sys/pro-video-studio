# استوديو مدار — تخطيط الفيديو الذكي

استوديو مدار هو تطبيق ويب عربي باتجاه RTL لإدارة مرحلة ما قبل إنتاج مشاريع الفيديو الطويلة حتى 90 دقيقة. يجمع التطبيق بين كتابة السيناريو، تقسيم المشاهد، إعداد اللقطات والنصوص الظاهرة، ترتيب المسارات، المعاينة، وحفظ أصول المشروع للمستخدمين المسجلين.

## المزايا الحالية

تتضمن الواجهة مساحة عمل إيزومترية حديثة بخلفية شبكية خفيفة، لوحة للمشروع الحالي، معاينة سينمائية للمشهد، خطاً زمنياً متعدد المسارات للمشاهد والتعليق الصوتي والموسيقى، وقائمة أدوات عربية واضحة. كما تتضمن تدفقاً لتوليد مخطط سيناريو من وصف المستخدم وتوليد صور ثابتة من الأوصاف.

يوفر **Storyboard Pro** تصديراً حقيقياً لمشاريع المستخدم إلى ملف JSON منظم وتقرير HTML قابل للطباعة. يتضمن الناتجان ترتيب المشاهد ومدتها ونصها والنص البصري والانتقال؛ ولا يتضمنان أصول المشروع أو روابطها أو ملف فيديو. يستخدم الخادم إجراءات tRPC محمية بالمصادقة لحفظ المشاريع والمشاهد والتحقق من الاستحقاق. وتوجد نماذج قاعدة البيانات الخاصة بالمستخدمين والمشاريع والمشاهد والأصول ووظائف التصدير في `drizzle/schema.ts`.

## التشغيل المحلي

يتطلب المشروع Node.js 22 أو أحدث وpnpm. بعد تنزيل المستودع، شغّل الأوامر التالية:

```bash
pnpm install
pnpm dev
```

للفحص والبناء والاختبارات:

```bash
pnpm check
pnpm test
pnpm build
```

تُحقن متغيرات البيئة الخاصة بالمصادقة وقاعدة البيانات وخدمات الذكاء الاصطناعي من بيئة المشروع. لا تضع مفاتيح سرية داخل ملفات المصدر أو المستودع.

## قاعدة البيانات

يبدأ المخطط من `drizzle/schema.ts`. بعد أي تعديل على الجداول، ولّد ترحيل Drizzle ثم راجع ملف SQL قبل تطبيقه على قاعدة البيانات:

```bash
pnpm drizzle-kit generate
```

تتضمن الجداول الأساسية `video_projects` و`video_scenes` و`project_assets` و`export_jobs`، إضافة إلى جدول `users` المدمج مع تسجيل الدخول.

## Storyboard Pro والاشتراك

يبقى تصدير Storyboard مقفلاً افتراضياً. لا يقرأ العميل حالة الدفع من `localStorage` أو رابط أو زر واجهة؛ يتحقق الخادم من المستخدم المصادق عليه وملكية المشروع وسجل `subscription_entitlements` النشط وغير المنتهي. لا يوجد إجراء عام أو إداري يمنح الاستحقاق.

لا يزال موصل الشراء داخل التطبيق معلقاً إلى أن يتحدد بلد التحصيل والمزود وقناة توزيع Android. إلى أن يكتمل ذلك، لا تضبط الخادم `STORYBOARD_SUBSCRIPTION_PROVIDER` ولا تظهر الواجهة نجاح شراء أو تفعيل يدوي. عند التكامل، يجب أن يتحقق معالج webhook خادمي من توقيع المزود ويخزن فقط معرفات العميل والاشتراك وحالته وتاريخ انتهائه بعد التحقق؛ لا تخزن بيانات بطاقة ولا تمنح الاستحقاق من العميل.

## رفع المشروع إلى GitHub

أنشئ مستودعاً فارغاً في GitHub، ثم نفّذ من جذر المشروع:

```bash
git init
git add .
git commit -m "feat: initialize Arabic AI video studio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

استبدل عنوان `origin` بعنوان مستودعك الحقيقي. تأكد من عدم رفع ملفات `.env` أو أي مفاتيح وصول.

## ملاحظات الإنتاج

التطبيق الحالي يجهز تجربة الاستوديو وطبقات البيانات والتكاملات الذكية اللازمة. لا ينتج ملف MP4 أو MOV أو WebM. إنتاج ملف فيديو فعلي مدته 90 دقيقة يتطلب خدمة ترميز/رندر خارجية أو عامل معالجة مخصصاً، لأن المتصفح وحده لا ينفذ عملية رندر طويلة وموثوقة.

## البنية

| المسار | الغرض |
| --- | --- |
| `client/src/pages/Home.tsx` | واجهة الاستوديو والمعاينة والخط الزمني |
| `client/src/index.css` | الهوية البصرية RTL والأنماط الإيزومترية |
| `server/routers.ts` | إجراءات المشاريع والتوليد والتصدير |
| `server/db.ts` | استعلامات قاعدة البيانات |
| `server/storyboard.ts` | بناء JSON وتقرير HTML قابل للطباعة دون أصول أو روابط |
| `server/entitlements.ts` | تحقق اشتراك برو الخادمي الذي يفشل مغلقاً |
| `drizzle/schema.ts` | نماذج البيانات |
| `todo.md` | سجل المتطلبات والتنفيذ |

## الترخيص

أضف الترخيص المناسب لمستودعك قبل النشر العام.

## English overview

Madar Studio is an Arabic RTL pre-production workspace for managing long-form video projects up to 90 minutes. It includes a multi-track scene timeline, cinematic preview, AI-assisted script planning, image generation, secure media storage, authenticated project persistence, and a Pro-gated JSON/printable-HTML storyboard export.

### Quick start

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

The full-stack template uses React, Tailwind CSS, Express, tRPC, Drizzle, Manus OAuth, built-in LLM and image services, and S3-compatible storage. Keep secrets in the managed environment and never commit `.env` files. Create a GitHub repository, add the remote, and push the `main` branch as described in the Arabic setup section above.

### Production note

Storyboard Pro exports a project-owned JSON document and a self-contained printable HTML report. It does not render video or expose project asset URLs. The server-side subscription connector and in-app purchase flow remain pending provider, billing-country, and Android-distribution decisions; access is denied by default until a verified server-side entitlement exists. A real 90-minute render would require a dedicated encoding service or background worker rather than a browser request.
