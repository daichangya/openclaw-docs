---
read_when:
    - إضافة إعداد Skills أو تعديله
    - ضبط قائمة السماح المضمّنة أو سلوك التثبيت
summary: مخطط إعداد Skills وأمثلتها
title: إعداد Skills
x-i18n:
    generated_at: "2026-04-23T07:34:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# إعداد Skills

توجد معظم إعدادات تحميل/تثبيت Skills تحت `skills` في
`~/.openclaw/openclaw.json`. أما ظهور Skills الخاصة بكل وكيل فيوجد تحت
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (وقت تشغيل Gateway لا يزال Node؛ وbun غير موصى به)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة نصية صريحة
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

بالنسبة إلى توليد/تعديل الصور المضمّن، فضّل `agents.defaults.imageGenerationModel`
مع الأداة الأساسية `image_generate`. ويُستخدم `skills.entries.*` فقط من أجل
تدفقات Skills المخصصة أو الخارجية.

إذا اخترت مزوّد/نموذج صور محددًا، فاضبط أيضًا
مصادقة/مفتاح API لذلك المزوّد. ومن الأمثلة المعتادة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY` من أجل
`google/*`، و`OPENAI_API_KEY` من أجل `openai/*`، و`FAL_KEY` من أجل `fal/*`.

أمثلة:

- إعداد أصلي على نمط Nano Banana Pro: ‏`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- إعداد fal أصلي: ‏`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## قوائم السماح الخاصة بـ Skills لكل وكيل

استخدم إعداد الوكيل عندما تريد جذور Skills نفسها على مستوى الجهاز/مساحة العمل، لكن
مع مجموعة Skills مرئية مختلفة لكل وكيل.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // يرث القيم الافتراضية -> github, weather
      { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
      { id: "locked-down", skills: [] }, // لا Skills
    ],
  },
}
```

القواعد:

- `agents.defaults.skills`: قائمة سماح أساسية مشتركة للوكلاء الذين يهملون
  `agents.list[].skills`.
- احذف `agents.defaults.skills` لترك Skills غير مقيّدة افتراضيًا.
- `agents.list[].skills`: مجموعة Skills النهائية الصريحة لذلك الوكيل؛ وهي لا
  تُدمج مع القيم الافتراضية.
- `agents.list[].skills: []`: لا تكشف أي Skills لذلك الوكيل.

## الحقول

- تتضمن جذور Skills المضمّنة دائمًا `~/.openclaw/skills` و`~/.agents/skills`،
  و`<workspace>/.agents/skills`، و`<workspace>/skills`.
- `allowBundled`: قائمة سماح اختيارية لـ Skills **المضمّنة** فقط. وعند ضبطها، تكون
  فقط Skills المضمّنة الموجودة في القائمة مؤهلة (ولا تتأثر Skills المُدارة أو Skills الوكيل أو مساحة العمل).
- `load.extraDirs`: أدلة Skills إضافية للفحص (أدنى أولوية).
- `load.watch`: راقب مجلدات Skills وحدّث لقطة Skills (الافتراضي: true).
- `load.watchDebounceMs`: مهلة debounce لأحداث مراقب Skills بالملي ثانية (الافتراضي: 250).
- `install.preferBrew`: فضّل مُثبّتات brew عند توفرها (الافتراضي: true).
- `install.nodeManager`: تفضيل مُثبّت Node ‏(`npm` | `pnpm` | `yarn` | `bun`، الافتراضي: npm).
  وهذا يؤثر فقط في **تثبيتات Skills**؛ أما وقت تشغيل Gateway فيجب أن يظل Node
  (ولا يُوصى بـ Bun في WhatsApp/Telegram).
  - يمثل `openclaw setup --node-manager` خيارًا أضيق ويقبل حاليًا `npm`،
    أو `pnpm`، أو `bun`. اضبط `skills.install.nodeManager: "yarn"` يدويًا إذا
    كنت تريد تثبيت Skills مدعومًا بـ Yarn.
- `entries.<skillKey>`: تجاوزات لكل Skill.
- `agents.defaults.skills`: قائمة سماح افتراضية اختيارية للـ Skills يرثها الوكلاء
  الذين يهملون `agents.list[].skills`.
- `agents.list[].skills`: قائمة سماح نهائية اختيارية للـ Skills لكل وكيل؛
  إذ تستبدل القوائم الصريحة القيم الافتراضية الموروثة بدلًا من دمجها.

الحقول الخاصة بكل Skill:

- `enabled`: اضبطها على `false` لتعطيل Skill حتى لو كانت مضمّنة/مثبتة.
- `env`: متغيرات بيئة تُحقن من أجل تشغيل الوكيل (فقط إذا لم تكن مضبوطة مسبقًا).
- `apiKey`: وسيلة مريحة اختيارية للـ Skills التي تعلن متغير env أساسيًا.
  وتدعم سلسلة نصية صريحة أو كائن SecretRef ‏(`{ source, provider, id }`).

## ملاحظات

- تُطابِق المفاتيح تحت `entries` اسم Skill افتراضيًا. وإذا كانت Skill تعرّف
  `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح بدلًا منه.
- تمثل أولوية التحميل: `<workspace>/skills` ← `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills المضمّنة →
  `skills.load.extraDirs`.
- تُلتقط التغييرات في Skills في دورة الوكيل التالية عند تفعيل المراقب.

### Skills المعزولة + متغيرات env

عندما تكون الجلسة **معزولة**، تعمل عمليات Skill داخل
خلفية sandbox المضبوطة. ولا ترث sandbox القيمة `process.env` الخاصة بالمضيف.

استخدم أحد الخيارين:

- `agents.defaults.sandbox.docker.env` لخلفية Docker (أو `agents.list[].sandbox.docker.env` لكل وكيل)
- تضمين env داخل صورة sandbox المخصصة أو بيئة sandbox البعيدة

تنطبق `env` العامة و`skills.entries.<skill>.env/apiKey` على تشغيلات **المضيف**
فقط.
