---
read_when:
    - تحديث OpenClaw
    - حدث خلل ما بعد التحديث
summary: تحديث OpenClaw بأمان (تثبيت عام أو من المصدر)، بالإضافة إلى استراتيجية التراجع
title: التحديث
x-i18n:
    generated_at: "2026-04-25T13:50:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

أبقِ OpenClaw محدّثًا.

## الموصى به: `openclaw update`

أسرع طريقة للتحديث. يكتشف نوع التثبيت لديك (npm أو git)، ويجلب أحدث إصدار، ويشغّل `openclaw doctor`، ويعيد تشغيل gateway.

```bash
openclaw update
```

للتبديل بين القنوات أو استهداف إصدار محدد:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # معاينة بدون تطبيق
```

يفضّل `--channel beta` قناة beta، لكن وقت التشغيل يرجع إلى stable/latest عندما
تكون علامة beta مفقودة أو أقدم من أحدث إصدار مستقر. استخدم `--tag beta`
إذا كنت تريد npm beta dist-tag الخام لتحديث حزمة لمرة واحدة.

راجع [قنوات التطوير](/ar/install/development-channels) لمعرفة دلالات القنوات.

## بديل: أعد تشغيل برنامج التثبيت

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

أضف `--no-onboard` لتخطي الإعداد الأولي. بالنسبة إلى التثبيتات من المصدر، مرّر `--install-method git --no-onboard`.

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

### عمليات تثبيت npm العامة وتبعيات وقت التشغيل

يعامل OpenClaw التثبيتات العامة المعبأة على أنها للقراءة فقط في وقت التشغيل، حتى عندما يكون
دليل الحزمة العامة قابلاً للكتابة بواسطة المستخدم الحالي. يتم تجهيز تبعيات وقت تشغيل Plugin المجمعة
في دليل وقت تشغيل قابل للكتابة بدلًا من تعديل
شجرة الحزمة. وهذا يمنع `openclaw update` من التزاحم مع gateway قيد التشغيل أو
وكيل محلي يقوم بإصلاح تبعيات Plugin أثناء عملية التثبيت نفسها.

تقوم بعض إعدادات npm على Linux بتثبيت الحزم العامة تحت أدلة يملكها root مثل
`/usr/lib/node_modules/openclaw`. ويدعم OpenClaw هذا التخطيط عبر
مسار التجهيز الخارجي نفسه.

بالنسبة إلى وحدات systemd المحصّنة، عيّن دليل تجهيز قابلًا للكتابة ومضمّنًا في
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

إذا لم يتم تعيين `OPENCLAW_PLUGIN_STAGE_DIR`، يستخدم OpenClaw القيمة `$STATE_DIRECTORY` عندما
يوفرها systemd، ثم يرجع إلى `~/.openclaw/plugin-runtime-deps`.

### تبعيات وقت تشغيل Plugin المجمعة

تحافظ التثبيتات المعبأة على تبعيات وقت تشغيل Plugin المجمعة خارج
شجرة الحزمة للقراءة فقط. عند بدء التشغيل وأثناء `openclaw doctor --fix`، يقوم OpenClaw بإصلاح
تبعيات وقت التشغيل فقط لـ Plugins المجمعة النشطة في الإعدادات، أو النشطة
عبر إعدادات القنوات القديمة، أو المفعّلة عبر الافتراضي المجمّع في manifest الخاص بها.

يفوز التعطيل الصريح. لا يتم إصلاح تبعيات وقت التشغيل لـ Plugin أو قناة معطلة
لمجرد وجودها في الحزمة. أما Plugins الخارجية ومسارات التحميل المخصصة
فتظل تستخدم `openclaw plugins install` أو
`openclaw plugins update`.

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

| القناة  | السلوك                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | ينتظر `stableDelayHours`، ثم يطبق مع تذبذب حتمي عبر `stableJitterHours` (نشر متدرج). |
| `beta`   | يتحقق كل `betaCheckIntervalHours` (الافتراضي: كل ساعة) ويطبق فورًا.                              |
| `dev`    | لا يوجد تطبيق تلقائي. استخدم `openclaw update` يدويًا.                                                           |

تسجل gateway أيضًا تلميح تحديث عند بدء التشغيل (عطّله باستخدام `update.checkOnStart: false`).

## بعد التحديث

<Steps>

### شغّل doctor

```bash
openclaw doctor
```

ينقل الإعدادات، ويدقق سياسات الرسائل الخاصة، ويتحقق من سلامة gateway. التفاصيل: [Doctor](/ar/gateway/doctor)

### أعد تشغيل gateway

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

## إذا كنت عالقًا

- شغّل `openclaw doctor` مرة أخرى واقرأ الناتج بعناية.
- بالنسبة إلى `openclaw update --channel dev` على checkouts المصدرية، تقوم أداة التحديث بتهيئة `pnpm` تلقائيًا عند الحاجة. إذا رأيت خطأ تهيئة pnpm/corepack، فثبّت `pnpm` يدويًا (أو أعد تمكين `corepack`) ثم أعد تشغيل التحديث.
- تحقّق من: [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- اسأل في Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [Doctor](/ar/gateway/doctor) — فحوصات السلامة بعد التحديثات
- [الترحيل](/ar/install/migrating) — أدلة الترحيل للإصدارات الرئيسية
