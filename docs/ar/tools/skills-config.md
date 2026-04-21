---
read_when:
    - إضافة إعدادات Skills أو تعديلها
    - تعديل قائمة السماح المجمعة أو سلوك التثبيت
summary: مخطط إعدادات Skills وأمثلة عليه
title: إعدادات Skills
x-i18n:
    generated_at: "2026-04-21T07:27:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# إعدادات Skills

توجد معظم إعدادات تحميل/تثبيت Skills تحت `skills` في
`~/.openclaw/openclaw.json`. أما رؤية Skills الخاصة بكل وكيل فتوجد تحت
`agents.defaults.skills` و`agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (وقت تشغيل Gateway لا يزال Node؛ ولا يُنصح بـ bun)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو نص صريح
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

بالنسبة إلى توليد/تحرير الصور المدمج، فضّل `agents.defaults.imageGenerationModel`
مع أداة `image_generate` الأساسية. إن `skills.entries.*` مخصص فقط
لسير عمل Skills المخصص أو الخارجي.

إذا اخترت مزود/Model صور محددًا، فقم أيضًا بتكوين
المصادقة/API key لذلك المزوّد. الأمثلة الشائعة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ
`google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`.

أمثلة:

- إعداد أصلي بأسلوب Nano Banana: ‏`agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- إعداد fal أصلي: ‏`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## قوائم السماح الخاصة بمهارات الوكيل

استخدم إعدادات الوكيل عندما تريد الجذور نفسها لـ Skills الخاصة بالجهاز/مساحة العمل، لكن
مع مجموعة مرئية مختلفة من Skills لكل وكيل.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // يرث القيم الافتراضية -> github, weather
      { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
      { id: "locked-down", skills: [] }, // بدون Skills
    ],
  },
}
```

القواعد:

- `agents.defaults.skills`: قائمة سماح أساسية مشتركة للوكلاء الذين يحذفون
  `agents.list[].skills`.
- احذف `agents.defaults.skills` لترك Skills غير مقيّدة افتراضيًا.
- `agents.list[].skills`: مجموعة Skills النهائية الصريحة لذلك الوكيل؛ وهي لا
  تندمج مع القيم الافتراضية.
- `agents.list[].skills: []`: لا تعرض أي Skills لذلك الوكيل.

## الحقول

- تتضمن جذور Skills المدمجة دائمًا `~/.openclaw/skills` و`~/.agents/skills`،
  و`<workspace>/.agents/skills`، و`<workspace>/skills`.
- `allowBundled`: قائمة سماح اختيارية لـ Skills **المجمعة** فقط. عند ضبطها، تكون
  Skills المجمعة الموجودة في القائمة فقط مؤهلة (ولا تتأثر Skills المُدارة أو الخاصة بالوكيل أو بمساحة العمل).
- `load.extraDirs`: أدلة Skills إضافية للمسح (أدنى أولوية).
- `load.watch`: راقب مجلدات Skills وحدّث لقطة Skills (الافتراضي: true).
- `load.watchDebounceMs`: إزالة الاهتزاز لأحداث مراقب Skills بالمللي ثانية (الافتراضي: 250).
- `install.preferBrew`: فضّل مثبتات brew عندما تكون متاحة (الافتراضي: true).
- `install.nodeManager`: تفضيل مثبت node ‏(`npm` | `pnpm` | `yarn` | `bun`، والافتراضي: npm).
  وهذا يؤثر فقط على **تثبيت Skills**؛ أما وقت تشغيل Gateway فيجب أن يبقى Node
  (ولا يُنصح بـ Bun مع WhatsApp/Telegram).
  - إن `openclaw setup --node-manager` أضيق نطاقًا ويقبل حاليًا `npm`،
    أو `pnpm`، أو `bun`. اضبط `skills.install.nodeManager: "yarn"` يدويًا إذا كنت
    تريد تثبيت Skills بالاعتماد على Yarn.
- `entries.<skillKey>`: تجاوزات لكل Skill.
- `agents.defaults.skills`: قائمة سماح افتراضية اختيارية لـ Skills يرثها الوكلاء
  الذين يحذفون `agents.list[].skills`.
- `agents.list[].skills`: قائمة سماح نهائية اختيارية لكل وكيل لـ Skills؛
  تستبدل القوائم الصريحة القيم الافتراضية الموروثة بدلًا من دمجها.

الحقول الخاصة بكل Skill:

- `enabled`: اضبط القيمة `false` لتعطيل Skill حتى لو كانت مجمعة/مثبتة.
- `env`: متغيرات بيئة تُحقن لتشغيل الوكيل (فقط إذا لم تكن مضبوطة بالفعل).
- `apiKey`: وسيلة اختيارية مريحة لـ Skills التي تعلن متغير env أساسيًا.
  يدعم نصًا صريحًا أو كائن SecretRef ‏(`{ source, provider, id }`).

## ملاحظات

- تُطابق المفاتيح تحت `entries` اسم Skill افتراضيًا. إذا كانت Skill تعرّف
  `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح بدلًا منه.
- أولوية التحميل هي `<workspace>/skills` ← `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills المجمعة →
  `skills.load.extraDirs`.
- يتم التقاط التغييرات على Skills في دورة الوكيل التالية عندما يكون المراقب مفعّلًا.

### Skills المعزولة + متغيرات env

عندما تكون الجلسة **داخل عزل**، تعمل عمليات Skill داخل
الواجهة الخلفية للعزل المكوّنة. لا يرث العزل `process.env` من المضيف.

استخدم أحد الخيارين التاليين:

- `agents.defaults.sandbox.docker.env` لواجهة Docker الخلفية (أو `agents.list[].sandbox.docker.env` لكل وكيل)
- دمج env داخل صورة العزل المخصصة أو بيئة العزل البعيدة

يُطبّق `env` العام و`skills.entries.<skill>.env/apiKey` على عمليات **المضيف** فقط.
