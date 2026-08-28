# استوديو مدار — إنتاج الفيديو الذكي

استوديو مدار هو تطبيق ويب عربي باتجاه RTL لإدارة مشاريع الفيديو الطويلة حتى 90 دقيقة. يجمع التطبيق بين كتابة السيناريو، تقسيم المشاهد، إعداد اللقطات والنصوص الظاهرة، ترتيب المسارات، المعاينة، التصدير بجودة HD، وحفظ أصول المشروع للمستخدمين المسجلين.

## المزايا الحالية

تتضمن الواجهة مساحة عمل إيزومترية حديثة بخلفية شبكية خفيفة، لوحة للمشروع الحالي، معاينة سينمائية للمشهد، خطاً زمنياً متعدد المسارات للمشاهد والتعليق الصوتي والموسيقى، وقائمة أدوات عربية واضحة. كما تتضمن تدفقاً لتوليد مخطط سيناريو من وصف المستخدم، وتوليد صور ثابتة من الأوصاف، وإعدادات تصدير 720p و1080p و4K مع مراحل تجهيز مرئية.

يستخدم الخادم إجراءات tRPC محمية بالمصادقة لحفظ المشاريع والمشاهد وإعدادات التصدير. وتوجد نماذج قاعدة البيانات الخاصة بالمستخدمين والمشاريع والمشاهد والأصول ووظائف التصدير في `drizzle/schema.ts`. تُحفظ ملفات الوسائط عبر طبقة التخزين الآمنة، بينما تحفظ قاعدة البيانات المفاتيح والبيانات الوصفية فقط.

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

التطبيق الحالي يجهز تجربة الاستوديو وطبقات البيانات والتكاملات الذكية اللازمة. أما إنتاج ملف فيديو فعلي مدته 90 دقيقة فيتطلب خدمة ترميز/رندر خارجية أو عامل معالجة مخصصاً، لأن المتصفح وحده لا ينفذ عملية رندر طويلة وموثوقة. تدفق التصدير في الواجهة يعرض مراحل العملية وحالتها، ويمكن ربطه لاحقاً بخدمة رندر فعلية عبر إجراء خلفي أو طابور مهام.

## البنية

| المسار | الغرض |
| --- | --- |
| `client/src/pages/Home.tsx` | واجهة الاستوديو والمعاينة والخط الزمني |
| `client/src/index.css` | الهوية البصرية RTL والأنماط الإيزومترية |
| `server/routers.ts` | إجراءات المشاريع والتوليد والتصدير |
| `server/db.ts` | استعلامات قاعدة البيانات |
| `drizzle/schema.ts` | نماذج البيانات |
| `todo.md` | سجل المتطلبات والتنفيذ |

## الترخيص

أضف الترخيص المناسب لمستودعك قبل النشر العام.

## English overview

Madar Studio is an Arabic RTL web workspace for managing long-form video projects up to 90 minutes. It includes a multi-track scene timeline, cinematic preview, AI-assisted script planning, image generation, secure media storage, HD export settings, and authenticated project persistence.

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

The current product shell exposes the export workflow and persists export jobs. A real 90-minute render should be connected to a dedicated encoding service or background worker rather than performed inside a browser request.
