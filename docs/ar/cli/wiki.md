---
read_when:
    - تريد استخدام CLI الخاص بـ memory-wiki
    - أنت توثّق `openclaw wiki` أو تغيّره
summary: مرجع CLI لـ `openclaw wiki` (حالة مخزن memory-wiki، والبحث، وcompile، وlint، وapply، وbridge، ومساعدات Obsidian)
title: الويكي
x-i18n:
    generated_at: "2026-04-23T07:23:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

افحص مخزن `memory-wiki` وصُنْه.

يوفّره Plugin `memory-wiki` المضمّن.

ذو صلة:

- [Plugin Memory Wiki](/ar/plugins/memory-wiki)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [CLI: memory](/ar/cli/memory)

## ما الغرض منه

استخدم `openclaw wiki` عندما تريد مخزن معرفة مُجمَّعًا يحتوي على:

- بحثًا أصيلًا للويكي وقراءات للصفحات
- توليفات غنية بمعلومات المصدر
- تقارير التعارض والحداثة
- واردات bridge من Plugin الذاكرة النشط
- مساعدات CLI اختيارية لـ Obsidian

## الأوامر الشائعة

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## الأوامر

### `wiki status`

افحص وضع المخزن الحالي، وسلامته، ومدى توفر CLI الخاص بـ Obsidian.

استخدم هذا أولًا عندما لا تكون متأكدًا مما إذا كان المخزن قد تمت تهيئته، أو كان وضع bridge
سليمًا، أو كان تكامل Obsidian متاحًا.

### `wiki doctor`

شغّل فحوصات سلامة الويكي واعرض مشكلات التكوين أو المخزن.

تشمل المشكلات المعتادة:

- تفعيل وضع bridge بدون عناصر ذاكرة عامة
- تخطيط مخزن غير صالح أو مفقود
- غياب CLI الخارجي الخاص بـ Obsidian عندما يكون وضع Obsidian متوقعًا

### `wiki init`

أنشئ تخطيط مخزن الويكي وصفحات البداية.

يهيّئ هذا البنية الجذرية، بما في ذلك الفهارس العليا ودلائل
cache.

### `wiki ingest <path-or-url>`

استورد المحتوى إلى طبقة المصدر في الويكي.

ملاحظات:

- يتحكم `ingest.allowUrlIngest` في استيراد URL
- تحتفظ صفحات المصدر المستوردة بمعلومات المصدر في frontmatter
- يمكن تشغيل compile تلقائي بعد ingest عند تفعيله

### `wiki compile`

أعد بناء الفهارس، والكتل ذات الصلة، ولوحات المعلومات، والملخصات المُجمَّعة.

يكتب هذا عناصر ثابتة موجهة للآلة تحت:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

إذا كان `render.createDashboards` مفعّلًا، فإن compile يحدّث أيضًا صفحات التقارير.

### `wiki lint`

نفّذ lint للمخزن وأبلغ عن:

- المشكلات البنيوية
- فجوات المصدر
- التعارضات
- الأسئلة المفتوحة
- الصفحات/الادعاءات منخفضة الثقة
- الصفحات/الادعاءات القديمة

شغّل هذا بعد تحديثات الويكي المهمة.

### `wiki search <query>`

ابحث في محتوى الويكي.

يعتمد السلوك على التكوين:

- `search.backend`: `shared` أو `local`
- `search.corpus`: `wiki` أو `memory` أو `all`

استخدم `wiki search` عندما تريد ترتيبًا خاصًا بالويكي أو تفاصيل المصدر.
ولتنفيذ تمريرة استرجاع مشتركة واسعة واحدة، ففضّل `openclaw memory search` عندما
يكشف Plugin الذاكرة النشط عن بحث مشترك.

### `wiki get <lookup>`

اقرأ صفحة ويكي حسب المعرّف أو المسار النسبي.

أمثلة:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

طبّق تعديلات ضيقة النطاق من دون جراحة حرة للصفحات.

تشمل التدفقات المدعومة:

- إنشاء/تحديث صفحة توليف
- تحديث بيانات الصفحة الوصفية
- إرفاق معرّفات المصدر
- إضافة أسئلة
- إضافة تعارضات
- تحديث الثقة/الحالة
- كتابة ادعاءات منظمة

يوجد هذا الأمر حتى يتمكن الويكي من التطور بأمان من دون تحرير يدوي
للكتل المُدارة.

### `wiki bridge import`

استورد عناصر الذاكرة العامة من Plugin الذاكرة النشط إلى صفحات المصدر
المدعومة بـ bridge.

استخدم هذا في وضع `bridge` عندما تريد سحب أحدث عناصر الذاكرة المُصدَّرة
إلى مخزن الويكي.

### `wiki unsafe-local import`

استورد من مسارات محلية مضبوطة صراحة في وضع `unsafe-local`.

وهذا تجريبي عمدًا ويعمل على الجهاز نفسه فقط.

### `wiki obsidian ...`

أوامر مساعدة Obsidian للمخازن التي تعمل في وضع ملائم لـ Obsidian.

الأوامر الفرعية:

- `status`
- `search`
- `open`
- `command`
- `daily`

تتطلب هذه الأوامر وجود CLI الرسمي `obsidian` على `PATH` عندما
يكون `obsidian.useOfficialCli` مفعّلًا.

## إرشادات الاستخدام العملي

- استخدم `wiki search` + `wiki get` عندما تهم معلومات المصدر وهوية الصفحة.
- استخدم `wiki apply` بدلًا من التحرير اليدوي للأقسام المُدارة والمولدة.
- استخدم `wiki lint` قبل الوثوق بالمحتوى المتعارض أو منخفض الثقة.
- استخدم `wiki compile` بعد عمليات الاستيراد المجمعة أو تغييرات المصدر عندما تريد
  لوحات معلومات وملخصات مُجمَّعة جديدة فورًا.
- استخدم `wiki bridge import` عندما يعتمد وضع bridge على عناصر ذاكرة
  مُصدَّرة حديثًا.

## الارتباطات بالتكوين

يتشكل سلوك `openclaw wiki` بواسطة:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

راجع [Plugin Memory Wiki](/ar/plugins/memory-wiki) للاطلاع على نموذج التكوين الكامل.
