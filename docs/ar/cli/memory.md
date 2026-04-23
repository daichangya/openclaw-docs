---
read_when:
    - تريد فهرسة الذاكرة الدلالية أو البحث فيها
    - أنت تقوم بتصحيح توفر الذاكرة أو الفهرسة
    - تريد ترقية الذاكرة قصيرة الأمد المسترجعة إلى `MEMORY.md`
summary: مرجع CLI لـ `openclaw memory` (الحالة/الفهرسة/البحث/الترقية/شرح الترقية/rem-harness)
title: الذاكرة
x-i18n:
    generated_at: "2026-04-23T07:22:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

أدر فهرسة الذاكرة الدلالية والبحث فيها.
يتم توفيرها بواسطة Plugin الذاكرة النشط (الافتراضي: `memory-core`؛ اضبط `plugins.slots.memory = "none"` للتعطيل).

ذو صلة:

- مفهوم الذاكرة: [الذاكرة](/ar/concepts/memory)
- Memory wiki: [Memory Wiki](/ar/plugins/memory-wiki)
- CLI الخاص بـ wiki: [wiki](/ar/cli/wiki)
- Plugins: [Plugins](/ar/tools/plugin)

## أمثلة

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## الخيارات

`memory status` و`memory index`:

- `--agent <id>`: يقيّد النطاق على وكيل واحد. من دونه، تعمل هذه الأوامر لكل وكيل مُعدّ؛ وإذا لم يتم إعداد قائمة وكلاء، فإنها تعود إلى الوكيل الافتراضي.
- `--verbose`: يُخرج سجلات مفصلة أثناء الفحص والفهرسة.

`memory status`:

- `--deep`: يفحص توفر vector + embedding.
- `--index`: يشغّل إعادة فهرسة إذا كان المخزن غير نظيف (ويتضمن `--deep`).
- `--fix`: يصلح أقفال الاسترجاع القديمة ويوحّد بيانات الترقية الوصفية.
- `--json`: يطبع خرج JSON.

إذا أظهر `memory status` القيمة `Dreaming status: blocked`، فهذا يعني أن Cron المُدار الخاص بـ Dreaming مفعّل لكن Heartbeat الذي يقوده لا يعمل للوكيل الافتراضي. راجع [Dreaming لا يعمل مطلقًا](/ar/concepts/dreaming#dreaming-never-runs-status-shows-blocked) للتعرف على السببين الشائعين.

`memory index`:

- `--force`: يفرض إعادة فهرسة كاملة.

`memory search`:

- إدخال الاستعلام: مرّر إما `[query]` الموضعي أو `--query <text>`.
- إذا تم تمرير الاثنين معًا، تكون الأولوية لـ `--query`.
- إذا لم يتم تمرير أي منهما، يخرج الأمر بخطأ.
- `--agent <id>`: يقيّد النطاق على وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--max-results <n>`: يقيّد عدد النتائج المعادة.
- `--min-score <n>`: يستبعد المطابقات منخفضة الدرجة.
- `--json`: يطبع نتائج JSON.

`memory promote`:

عاين وطبّق ترقيات الذاكرة قصيرة الأمد.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- يكتب الترقيات إلى `MEMORY.md` (الافتراضي: معاينة فقط).
- `--limit <n>` -- يضع حدًا أقصى لعدد المرشحين المعروضين.
- `--include-promoted` -- يتضمن الإدخالات التي تمت ترقيتها بالفعل في الدورات السابقة.

الخيارات الكاملة:

- يرتّب المرشحين قصيري الأمد من `memory/YYYY-MM-DD.md` باستخدام إشارات ترقية موزونة (`frequency` و`relevance` و`query diversity` و`recency` و`consolidation` و`conceptual richness`).
- يستخدم إشارات قصيرة الأمد من كل من استرجاعات الذاكرة وعمليات الإدخال اليومية، إضافة إلى إشارات التعزيز من مرحلتي light/REM.
- عند تمكين Dreaming، يقوم `memory-core` بإدارة مهمة Cron واحدة تلقائيًا تشغّل عملية اكتساح كاملة (`light -> REM -> deep`) في الخلفية (من دون الحاجة إلى `openclaw cron add` يدويًا).
- `--agent <id>`: يقيّد النطاق على وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--limit <n>`: الحد الأقصى للمرشحين الذين تتم إعادتهم/تطبيقهم.
- `--min-score <n>`: الحد الأدنى لدرجة الترقية الموزونة.
- `--min-recall-count <n>`: الحد الأدنى لعدد مرات الاسترجاع المطلوب للمرشح.
- `--min-unique-queries <n>`: الحد الأدنى لعدد الاستعلامات المميزة المطلوبة للمرشح.
- `--apply`: يُلحق المرشحين المحددين إلى `MEMORY.md` ويضع عليهم علامة الترقية.
- `--include-promoted`: يتضمن المرشحين الذين تمت ترقيتهم بالفعل في الخرج.
- `--json`: يطبع خرج JSON.

`memory promote-explain`:

اشرح مرشح ترقية محددًا وتفصيل درجته.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: مفتاح المرشح، أو جزء من المسار، أو جزء من المقتطف للبحث.
- `--agent <id>`: يقيّد النطاق على وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: يتضمن المرشحين الذين تمت ترقيتهم بالفعل.
- `--json`: يطبع خرج JSON.

`memory rem-harness`:

عاين انعكاسات REM والحقائق المرشحة وخرج الترقية العميقة من دون كتابة أي شيء.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: يقيّد النطاق على وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: يتضمن المرشحين العميقين الذين تمت ترقيتهم بالفعل.
- `--json`: يطبع خرج JSON.

## Dreaming

Dreaming هو نظام دمج الذاكرة في الخلفية ويتألف من ثلاث
مراحل متعاونة: **light** (فرز/تهيئة المواد قصيرة الأمد)، و**deep** (ترقية
الحقائق الدائمة إلى `MEMORY.md`)، و**REM** (التأمل وإظهار الموضوعات).

- قم بتمكينه عبر `plugins.entries.memory-core.config.dreaming.enabled: true`.
- بدّله من الدردشة باستخدام `/dreaming on|off` (أو افحصه باستخدام `/dreaming status`).
- يعمل Dreaming وفق جدول اكتساح مُدار واحد (`dreaming.frequency`) وينفذ المراحل بالترتيب: light وREM وdeep.
- لا تكتب سوى المرحلة deep الذاكرة الدائمة إلى `MEMORY.md`.
- تتم كتابة خرج المراحل المقروء بشريًا وإدخالات اليومية إلى `DREAMS.md` (أو `dreams.md` الموجود)، مع تقارير اختيارية لكل مرحلة في `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- يستخدم الترتيب إشارات موزونة: تكرار الاسترجاع، وملاءمة الاسترجاع، وتنوع الاستعلامات، والحداثة الزمنية، والدمج عبر الأيام، وغنى المفاهيم المستنتج.
- تعيد الترقية قراءة الملاحظة اليومية الحية قبل الكتابة إلى `MEMORY.md`، بحيث لا تتم ترقية المقتطفات قصيرة الأمد المعدلة أو المحذوفة من لقطات قديمة لمخزن الاسترجاع.
- تشترك التشغيلات المجدولة والتشغيلات اليدوية لـ `memory promote` في القيم الافتراضية نفسها للمرحلة deep ما لم تمرر تجاوزات عتبات CLI.
- تتوزع التشغيلات التلقائية على مساحات عمل الذاكرة المُعدة.

الجدولة الافتراضية:

- **وتيرة الاكتساح**: `dreaming.frequency = 0 3 * * *`
- **عتبات deep**: `minScore=0.8` و`minRecallCount=3` و`minUniqueQueries=3` و`recencyHalfLifeDays=14` و`maxAgeDays=30`

مثال:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

ملاحظات:

- يطبع `memory index --verbose` تفاصيل كل مرحلة (المزود، النموذج، المصادر، نشاط الدفعات).
- يتضمن `memory status` أي مسارات إضافية مُعدة عبر `memorySearch.extraPaths`.
- إذا كانت حقول مفاتيح API البعيدة الخاصة بالذاكرة النشطة فعليًا مُعدة كـ SecretRef، فإن الأمر يحل هذه القيم من اللقطة النشطة لـ gateway. وإذا لم تكن gateway متاحة، يفشل الأمر بسرعة.
- ملاحظة حول اختلاف إصدار Gateway: يتطلب مسار هذا الأمر gateway تدعم `secrets.resolve`؛ أما البوابات الأقدم فتعيد خطأ method غير معروف.
- اضبط وتيرة الاكتساح المجدول باستخدام `dreaming.frequency`. أما سياسة الترقية العميقة فهي داخلية بخلاف ذلك؛ استخدم أعلام CLI في `memory promote` عندما تحتاج إلى تجاوزات يدوية لمرة واحدة.
- يعاين `memory rem-harness --path <file-or-dir> --grounded` مخرجات `What Happened` و`Reflections` و`Possible Lasting Updates` المؤسَّسة من الملاحظات اليومية التاريخية من دون كتابة أي شيء.
- يكتب `memory rem-backfill --path <file-or-dir>` إدخالات يومية مؤسَّسة قابلة للعكس إلى `DREAMS.md` لمراجعتها في واجهة المستخدم.
- يزرع `memory rem-backfill --path <file-or-dir> --stage-short-term` أيضًا مرشحين دائمين مؤسَّسين في مخزن الترقية قصير الأمد الحي بحيث يمكن للمرحلة deep العادية ترتيبهم.
- يزيل `memory rem-backfill --rollback` إدخالات اليومية المؤسَّسة المكتوبة سابقًا، كما يزيل `memory rem-backfill --rollback-short-term` المرشحين قصيري الأمد المؤسسين الذين تمت تهيئتهم سابقًا.
- راجع [Dreaming](/ar/concepts/dreaming) للحصول على وصف كامل للمراحل ومرجع الإعدادات.
