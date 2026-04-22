---
read_when:
    - تحديث OpenClaw
    - حدث خلل ما بعد التحديث
summary: تحديث OpenClaw بأمان (تثبيت عام أو من المصدر)، بالإضافة إلى استراتيجية التراجع
title: التحديث
x-i18n:
    generated_at: "2026-04-22T04:24:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# التحديث

حافظ على تحديث OpenClaw.

## الموصى به: `openclaw update`

أسرع طريقة للتحديث. يكتشف نوع التثبيت لديك (npm أو git)، ويجلب أحدث إصدار، ويشغّل `openclaw doctor`، ويعيد تشغيل Gateway.

```bash
openclaw update
```

للتبديل بين القنوات أو استهداف إصدار محدد:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # معاينة بدون تطبيق
```

يفضّل `--channel beta` قناة beta، لكن بيئة التشغيل تعود إلى stable/latest عندما
تكون علامة beta مفقودة أو أقدم من أحدث إصدار stable. استخدم `--tag beta`
إذا كنت تريد npm beta dist-tag الخام لتحديث حزمة لمرة واحدة.

راجع [قنوات التطوير](/ar/install/development-channels) لمعرفة دلالات القنوات.

## بديل: أعد تشغيل المُثبّت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتخطي الإعداد الأولي. وبالنسبة لعمليات التثبيت من المصدر، مرّر `--install-method git --no-onboard`.

## بديل: npm أو pnpm أو bun يدويًا

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### عمليات تثبيت npm العامة المملوكة للجذر

تثبّت بعض إعدادات npm على Linux الحزم العامة ضمن أدلة مملوكة للجذر مثل
`/usr/lib/node_modules/openclaw`. يدعم OpenClaw هذا التخطيط: تُعامَل
الحزمة المثبّتة على أنها للقراءة فقط أثناء التشغيل، وتُجهَّز تبعيات وقت تشغيل
Plugin المضمّن في دليل وقت تشغيل قابل للكتابة بدلًا من تعديل شجرة
الحزمة.

بالنسبة لوحدات systemd المقواة، عيّن دليل تجهيز قابلًا للكتابة يكون مضمنًا في
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

إذا لم يتم تعيين `OPENCLAW_PLUGIN_STAGE_DIR`، يستخدم OpenClaw قيمة `$STATE_DIRECTORY` عندما
يوفرها systemd، ثم يعود إلى `~/.openclaw/plugin-runtime-deps`.

## أداة التحديث التلقائي

تكون أداة التحديث التلقائي معطلة افتراضيًا. فعّلها في `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| القناة   | السلوك                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| `stable` | ينتظر `stableDelayHours`، ثم يطبّق مع تفاوت حتمي عبر `stableJitterHours` (طرح تدريجي موزّع).                    |
| `beta`   | يفحص كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبّق فورًا.                                               |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويًا.                                                           |

كما يسجل Gateway تلميح تحديث عند بدء التشغيل (عطّله باستخدام `update.checkOnStart: false`).

## بعد التحديث

<Steps>

### شغّل doctor

```bash
openclaw doctor
```

ينقل التكوين، ويدقق سياسات الرسائل المباشرة، ويتحقق من سلامة Gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

### أعد تشغيل Gateway

```bash
openclaw gateway restart
```

### تحقّق

```bash
openclaw health
```

</Steps>

## التراجع

### تثبيت إصدار محدد (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

نصيحة: يعرض `npm view openclaw version` الإصدار المنشور الحالي.

### تثبيت commit محدد (المصدر)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

للعودة إلى الأحدث: `git checkout main && git pull`.

## إذا علقت

- شغّل `openclaw doctor` مرة أخرى واقرأ المخرجات بعناية.
- بالنسبة إلى `openclaw update --channel dev` على عمليات السحب من المصدر، يقوم المحدّث تلقائيًا بتهيئة `pnpm` عند الحاجة. إذا رأيت خطأ تهيئة pnpm/corepack، فثبّت `pnpm` يدويًا (أو أعد تفعيل `corepack`) ثم أعد تشغيل التحديث.
- راجع: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [Doctor](/ar/gateway/doctor) — فحوصات السلامة بعد التحديثات
- [الترحيل](/ar/install/migrating) — أدلة الترحيل للإصدارات الرئيسية
