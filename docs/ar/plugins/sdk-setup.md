---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم الفرق بين `setup-entry.ts` و`index.ts`
    - أنت تعرّف مخططات إعداد Plugin أو بيانات التعريف `openclaw` في `package.json`
sidebarTitle: Setup and Config
summary: معالجات الإعداد، و`setup-entry.ts`، ومخططات الإعداد، وبيانات التعريف في `package.json`
title: إعداد Plugin والتهيئة
x-i18n:
    generated_at: "2026-04-25T13:55:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

مرجع لتغليف Plugin (بيانات التعريف في `package.json`) وmanifest
(`openclaw.plugin.json`) وإدخالات الإعداد ومخططات الإعداد.

<Tip>
  **هل تبحث عن شرح عملي؟** تغطي الأدلة العملية التغليف ضمن السياق:
  [Plugins القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و
  [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات تعريف الحزمة

يحتاج ملف `package.json` الخاص بك إلى حقل `openclaw` يُخبر نظام Plugin بما
توفره Plugin الخاصة بك:

**Plugin قناة:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin مزوّد / خط أساس النشر إلى ClawHub:**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

إذا كنت تنشر Plugin خارجيًا على ClawHub، فإن حقلي `compat` و`build`
مطلوبان. وتوجد المقاطع القياسية الرسمية للنشر في
`docs/snippets/plugin-publish/`.

### حقول `openclaw`

| الحقل        | النوع      | الوصف                                                                                                                   |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | ملفات نقاط الإدخال (نسبية إلى جذر الحزمة)                                                                               |
| `setupEntry` | `string`   | إدخال خفيف مخصّص للإعداد فقط (اختياري)                                                                                  |
| `channel`    | `object`   | بيانات تعريف كتالوج القنوات لأسطح الإعداد والمنتقي والبدء السريع والحالة                                                  |
| `providers`  | `string[]` | معرّفات المزوّدين التي تسجلها هذه Plugin                                                                                 |
| `install`    | `object`   | تلميحات التثبيت: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | علامات سلوك بدء التشغيل                                                                                                  |

### `openclaw.channel`

يمثل `openclaw.channel` بيانات تعريف حزمة منخفضة الكلفة لاكتشاف القنوات
وأسطح الإعداد قبل تحميل وقت التشغيل.

| الحقل                                  | النوع      | معناه                                                                  |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة القياسي.                                                  |
| `label`                                | `string`   | التسمية الأساسية للقناة.                                               |
| `selectionLabel`                       | `string`   | تسمية المنتقي/الإعداد عندما يجب أن تختلف عن `label`.                   |
| `detailLabel`                          | `string`   | تسمية تفصيلية ثانوية لكتالوجات القنوات الأكثر غنى وأسطح الحالة.        |
| `docsPath`                             | `string`   | مسار التوثيق لروابط الإعداد والاختيار.                                 |
| `docsLabel`                            | `string`   | تجاوز التسمية المستخدمة لروابط التوثيق عندما يجب أن تختلف عن معرّف القناة. |
| `blurb`                                | `string`   | وصف قصير للإعداد الأولي/الكتالوج.                                      |
| `order`                                | `number`   | ترتيب الفرز في كتالوجات القنوات.                                       |
| `aliases`                              | `string[]` | أسماء بديلة إضافية للبحث عند اختيار القناة.                            |
| `preferOver`                           | `string[]` | معرّفات Plugin/قنوات ذات أولوية أقل يجب أن تتفوق عليها هذه القناة.     |
| `systemImage`                          | `string`   | اسم أيقونة/صورة نظام اختياري لكتالوجات واجهة القناة.                   |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط التوثيق في أسطح الاختيار.                           |
| `selectionDocsOmitLabel`               | `boolean`  | عرض مسار التوثيق مباشرة بدلًا من رابط توثيق ذي تسمية في نص الاختيار.   |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحق في نص الاختيار.                               |
| `markdownCapable`                      | `boolean`  | يحدد القناة على أنها قادرة على Markdown لقرارات التنسيق الصادر.        |
| `exposure`                             | `object`   | عناصر تحكم في ظهور القناة لأسطح الإعداد والقوائم المضبوطة والتوثيق.     |
| `quickstartAllowFrom`                  | `boolean`  | يضم هذه القناة إلى تدفق إعداد `allowFrom` القياسي في البدء السريع.      |
| `forceAccountBinding`                  | `boolean`  | يفرض ربط الحساب صراحةً حتى عند وجود حساب واحد فقط.                     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | يفضّل البحث عن الجلسة عند حل أهداف الإعلان لهذه القناة.                 |

مثال:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (مستضاف ذاتيًا)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "تكامل دردشة مستضافة ذاتيًا قائم على Webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "الدليل:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

يدعم `exposure` ما يلي:

- `configured`: تضمين القناة في أسطح السرد من نمط القنوات المضبوطة/الحالة
- `setup`: تضمين القناة في منتقيات الإعداد/التهيئة التفاعلية
- `docs`: تمييز القناة على أنها عامة الظهور في أسطح التوثيق/التنقل

ما يزال `showConfigured` و`showInSetup` مدعومين كأسماء بديلة قديمة. يُفضّل
`exposure`.

### `openclaw.install`

يمثل `openclaw.install` بيانات تعريف حزمة، وليس بيانات تعريف manifest.

| الحقل                        | النوع                 | معناه                                                                          |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | مواصفة npm القياسية لتدفقات التثبيت/التحديث.                                   |
| `localPath`                  | `string`             | مسار تثبيت محلي للتطوير أو مضمّن.                                               |
| `defaultChoice`              | `"npm"` \| `"local"` | مصدر التثبيت المفضل عند توفر كليهما.                                           |
| `minHostVersion`             | `string`             | أدنى إصدار OpenClaw مدعوم بصيغة `>=x.y.z`.                                     |
| `expectedIntegrity`          | `string`             | سلسلة تكامل npm dist المتوقعة، عادةً `sha512-...`، لعمليات التثبيت المثبتة.     |
| `allowInvalidConfigRecovery` | `boolean`            | يتيح لتدفقات إعادة تثبيت Plugins المضمّنة التعافي من أعطال إعداد قديمة محددة. |

تستخدم عملية الإعداد التفاعلية أيضًا `openclaw.install` لأسطح
التثبيت عند الطلب. إذا كانت Plugin الخاصة بك تعرض خيارات مصادقة المزوّد أو
بيانات تعريف إعداد/كتالوج القناة قبل تحميل وقت التشغيل، فيمكن لعملية الإعداد
أن تعرض هذا الخيار، وتطلب npm مقابل التثبيت المحلي، وتثبت أو تفعّل
Plugin، ثم تتابع التدفق المحدد. تتطلب خيارات الإعداد عبر npm بيانات تعريف
كتالوج موثوقة مع `npmSpec` من السجل؛ والإصدارات الثابتة و`expectedIntegrity`
مثبتات اختيارية. إذا كان `expectedIntegrity` موجودًا، فإن تدفقات
التثبيت/التحديث تفرضه. أبقِ بيانات تعريف "ما الذي يجب عرضه" في
`openclaw.plugin.json` وبيانات تعريف "كيفية تثبيته"
في `package.json`.

إذا كان `minHostVersion` مضبوطًا، فإن التثبيت وتحميل سجل manifest
يفرضانه كلاهما. تتجاوز المضيفات الأقدم Plugin؛ وتُرفض سلاسل
الإصدار غير الصالحة.

بالنسبة إلى عمليات تثبيت npm المثبتة، أبقِ الإصدار الدقيق في `npmSpec` وأضف
تكامل الأثر المتوقع:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

لا يمثل `allowInvalidConfigRecovery` تجاوزًا عامًا للإعدادات المعطلة. بل هو
مخصص لتعافٍ ضيق خاص بالـ Plugins المضمّنة فقط، بحيث يمكن لإعادة
التثبيت/الإعداد إصلاح بقايا ترقيات معروفة مثل غياب مسار Plugin مضمّن
أو وجود إدخال `channels.<id>` قديم لتلك Plugin نفسها. إذا كان
الإعداد معطّلًا لأسباب غير مرتبطة، فإن التثبيت يظل مغلقًا بشكل آمن
ويطلب من المشغّل تشغيل `openclaw doctor --fix`.

### تأجيل التحميل الكامل

يمكن لـ Plugins القنوات اختيار التحميل المؤجل باستخدام:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

عند التفعيل، يحمّل OpenClaw فقط `setupEntry` أثناء مرحلة بدء التشغيل
السابقة للاستماع، حتى بالنسبة إلى القنوات المضبوطة مسبقًا. ويُحمّل الإدخال الكامل بعد أن
يبدأ Gateway في الاستماع.

<Warning>
  فعّل التحميل المؤجل فقط عندما يسجّل `setupEntry` كل ما يحتاجه
  Gateway قبل أن يبدأ في الاستماع (تسجيل القناة، ومسارات HTTP،
  وأساليب Gateway). إذا كان الإدخال الكامل يمتلك قدرات مطلوبة عند بدء التشغيل،
  فأبقِ السلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل الخاص بك يسجّل أساليب Gateway RPC، فأبقِها ضمن
بادئة خاصة بالـ Plugin. تظل مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) مملوكة للنواة وتُحل دائمًا
إلى `operator.admin`.

## manifest الـ Plugin

يجب أن تشحن كل Plugin أصلية ملف `openclaw.plugin.json` في جذر الحزمة.
يستخدم OpenClaw هذا للتحقق من صحة الإعداد من دون تنفيذ شيفرة Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "يضيف قدرات My Plugin إلى OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "سر التحقق من Webhook"
      }
    }
  }
}
```

بالنسبة إلى Plugins القنوات، أضف `kind` و`channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

حتى Plugins التي ليس لها إعدادات يجب أن تشحن مخططًا. ويُعد المخطط الفارغ صالحًا:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [manifest الـ Plugin](/ar/plugins/manifest) للاطلاع على المرجع الكامل للمخطط.

## النشر إلى ClawHub

بالنسبة إلى حزم Plugins، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

الاسم البديل القديم للنشر الخاص بالمهارات فقط مخصص لـ Skills. يجب أن تستخدم حزم Plugins
دائمًا `clawhub package publish`.

## إدخال الإعداد

ملف `setup-entry.ts` هو بديل خفيف لـ `index.ts` يحمّله
OpenClaw عندما يحتاج فقط إلى أسطح الإعداد (الإعداد الأولي، وإصلاح الإعداد،
وفحص القنوات المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل شيفرة وقت تشغيل ثقيلة (مكتبات التشفير، وتسجيلات CLI،
والخدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بتصديرات آمنة للإعداد في وحدات جانبية
أن تستخدم `defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من
`defineSetupPluginEntry(...)`. كما يدعم هذا العقد المضمّن أيضًا
تصدير `runtime` اختياريًا حتى يبقى ربط وقت التشغيل أثناء الإعداد خفيفًا وواضحًا.

**متى يستخدم OpenClaw `setupEntry` بدلًا من الإدخال الكامل:**

- تكون القناة معطلة لكنها تحتاج إلى أسطح إعداد/إعداد أولي
- تكون القناة مفعّلة لكنها غير مضبوطة
- يكون التحميل المؤجل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`)

**ما الذي يجب أن يسجله `setupEntry`:**

- كائن Plugin الخاص بالقناة (عبر `defineSetupPluginEntry`)
- أي مسارات HTTP مطلوبة قبل أن يبدأ Gateway بالاستماع
- أي أساليب Gateway مطلوبة أثناء بدء التشغيل

يجب على أساليب Gateway الخاصة ببدء التشغيل هذه أيضًا تجنب
مساحات أسماء الإدارة الأساسية المحجوزة مثل `config.*` أو `update.*`.

**ما الذي يجب ألا يتضمنه `setupEntry`:**

- تسجيلات CLI
- الخدمات الخلفية
- استيرادات وقت التشغيل الثقيلة (التشفير، وSDKs)
- أساليب Gateway المطلوبة فقط بعد بدء التشغيل

### استيرادات مساعدات الإعداد الضيقة

بالنسبة إلى المسارات الساخنة الخاصة بالإعداد فقط، فضّل وصلات مساعدات الإعداد الضيقة بدلًا من
الواجهة الأوسع `plugin-sdk/setup` عندما تحتاج فقط إلى جزء من سطح الإعداد:

| مسار الاستيراد                     | استخدمه من أجل                                                                          | أهم التصديرات                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدات وقت التشغيل أثناء الإعداد التي تبقى متاحة في `setupEntry` / بدء تشغيل القناة المؤجل | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | مُحوِّلات إعداد الحساب المراعية للبيئة                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | مساعدات CLI/الأرشيف/التوثيق للإعداد/التثبيت                                             | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

استخدم الواجهة الأوسع `plugin-sdk/setup` عندما تريد صندوق أدوات
الإعداد المشترك الكامل، بما في ذلك مساعدات تصحيح الإعداد مثل
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

تبقى مُحوّلات تصحيح الإعداد آمنة للاستيراد في المسارات الساخنة. ويكون
البحث عن سطح عقد الترقية المضمّن الخاص بالحساب الواحد كسولًا، لذا فإن استيراد
`plugin-sdk/setup-runtime` لا يحمّل مسبقًا اكتشاف سطح العقد المضمّن
قبل استخدام المُحوّل فعليًا.

### الترقية المملوكة للقناة من حساب واحد

عندما تُرقّى قناة من إعداد علوي لحساب واحد إلى
`channels.<id>.accounts.*`، فإن السلوك المشترك الافتراضي هو نقل
القيم المُرقّاة ذات النطاق الخاص بالحساب إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق هذه الترقية أو تجاوزها عبر
سطح عقد الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية يجب نقلها إلى
  الحساب المُرقّى
- `namedAccountPromotionKeys`: عندما تكون الحسابات المُسمّاة موجودة بالفعل، لا تُنقل
  إلا هذه المفاتيح إلى الحساب المُرقّى؛ وتبقى مفاتيح السياسة/التسليم
  المشتركة في جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الحالي
  الذي يستقبل القيم المُرقّاة

Matrix هو المثال المضمّن الحالي. إذا كان يوجد بالفعل حساب Matrix مُسمّى واحد بالضبط،
أو إذا كان `defaultAccount` يشير إلى مفتاح غير قياسي موجود مثل `Ops`،
فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال جديد
`accounts.default`.

## مخطط الإعداد

تُتحقق صحة إعداد Plugin مقابل JSON Schema الموجود في manifest الخاصة بك. يضبط المستخدمون
Plugins عبر:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

تتلقى Plugin الخاصة بك هذا الإعداد في `api.pluginConfig` أثناء التسجيل.

بالنسبة إلى الإعداد الخاص بالقناة، استخدم قسم إعداد القناة بدلًا من ذلك:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### بناء مخططات إعداد القنوات

استخدم `buildChannelConfigSchema` لتحويل مخطط Zod إلى
الغلاف `ChannelConfigSchema` المستخدم في عناصر الإعداد المملوكة لـ Plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

بالنسبة إلى Plugins الخارجية، يظل العقد الخاص بالمسار البارد هو manifest الخاصة بـ Plugin:
اعكس JSON Schema المُولَّدة إلى `openclaw.plugin.json#channelConfigs` حتى تتمكن
أسطح مخطط الإعداد والإعداد وواجهة المستخدم من فحص `channels.<id>` من دون
تحميل شيفرة وقت التشغيل.

## معالجات الإعداد

يمكن لـ Plugins القنوات توفير معالجات إعداد تفاعلية لأمر `openclaw onboard`.
والمعالج هو كائن `ChannelSetupWizard` داخل `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "متصل",
    unconfiguredLabel: "غير مضبوط",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "رمز البوت",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "استخدام MY_CHANNEL_BOT_TOKEN من البيئة؟",
      keepPrompt: "الاحتفاظ بالرمز الحالي؟",
      inputPrompt: "أدخل رمز البوت الخاص بك:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

يدعم النوع `ChannelSetupWizard` عناصر مثل `credentials` و`textInputs`
و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` وغيرها.
راجع حزم Plugins المضمّنة (مثلًا، Plugin Discord في `src/channel.setup.ts`) للحصول
على أمثلة كاملة.

بالنسبة إلى مطالبات قائمة السماح للرسائل المباشرة التي تحتاج فقط إلى تدفق
`note -> prompt -> parse -> merge -> patch` القياسي، فضّل مساعدات الإعداد
المشتركة من `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
و`createTopLevelChannelParsedAllowFromPrompt(...)`، و
`createNestedChannelParsedAllowFromPrompt(...)`.

وبالنسبة إلى كتل حالة إعداد القناة التي تختلف فقط في التسميات والدرجات والأسطر
الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من
`openclaw/plugin-sdk/setup` بدلًا من إنشاء كائن `status` مماثل يدويًا
في كل Plugin.

أما بالنسبة إلى أسطح الإعداد الاختيارية التي يجب أن تظهر فقط في سياقات معينة،
فاستخدم `createOptionalChannelSetupSurface` من `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// يعيد { setupAdapter, setupWizard }
```

يكشف `plugin-sdk/channel-setup` أيضًا عن البانيين منخفضي المستوى
`createOptionalChannelSetupAdapter(...)` و
`createOptionalChannelSetupWizard(...)` عندما تحتاج فقط إلى أحد نصفي
سطح التثبيت الاختياري هذا.

يفشل المُحوّل/المعالج الاختياري المُولَّد بشكل مغلق عند عمليات كتابة الإعداد الحقيقية. وهو
يعيد استخدام رسالة واحدة تفيد بأن التثبيت مطلوب عبر `validateInput`،
و`applyAccountConfig`، و`finalize`، ويضيف رابطًا إلى التوثيق عندما يكون `docsPath`
مضبوطًا.

بالنسبة إلى واجهات الإعداد المعتمدة على الثنائيات التنفيذية، فضّل المساعدات المشتركة
المفوّضة بدلًا من نسخ الربط نفسه الخاص بالثنائيات/الحالة إلى كل قناة:

- `createDetectedBinaryStatus(...)` لكتل الحالة التي تختلف فقط في التسميات
  والتلميحات والدرجات واكتشاف الثنائي التنفيذي
- `createCliPathTextInput(...)` لمدخلات النص المعتمدة على المسار
- `createDelegatedSetupWizardStatusResolvers(...)`,
  و`createDelegatedPrepare(...)`, و`createDelegatedFinalize(...)`, و
  `createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى التفويض
  بشكل كسول إلى معالج كامل أثقل
- `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى
  تفويض قرار `textInputs[*].shouldPrompt`

## النشر والتثبيت

**Plugins الخارجية:** انشر إلى [ClawHub](/ar/tools/clawhub) أو npm، ثم ثبّت:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

يحاول OpenClaw استخدام ClawHub أولًا ثم يعود تلقائيًا إلى npm. ويمكنك أيضًا
فرض ClawHub صراحةً:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub فقط
```

لا يوجد تجاوز مقابل بصيغة `npm:`. استخدم مواصفة حزمة npm العادية عندما
تريد مسار npm بعد الرجوع من ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugins المضمّنة وسيجري
اكتشافها تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
  بالنسبة إلى عمليات التثبيت من npm، فإن `openclaw plugins install` يشغّل
  `npm install --ignore-scripts` (من دون نصوص دورة حياة). حافظ على أشجار
  تبعيات Plugin نقية من نوع JS/TS وتجنب الحزم التي تتطلب بناء `postinstall`.
</Info>

تشكل Plugins المملوكة لـ OpenClaw والمضمّنة الاستثناء الوحيد لإصلاح بدء التشغيل:
فعندما ترى عملية تثبيت مُغلّفة واحدة منها مفعّلة عبر إعداد Plugin أو إعداد قناة قديم أو
manifest المضمّنة التي تفعّلها افتراضيًا، فإن بدء التشغيل يثبّت تبعيات وقت التشغيل
المفقودة لتلك Plugin قبل الاستيراد. لا ينبغي أن تعتمد Plugins الخارجية على
عمليات التثبيت عند بدء التشغيل؛ استمر في استخدام مُثبّت Plugin الصريح.

## ذو صلة

- [نقاط إدخال SDK](/ar/plugins/sdk-entrypoints) — `definePluginEntry` و`defineChannelPluginEntry`
- [manifest الـ Plugin](/ar/plugins/manifest) — المرجع الكامل لمخطط manifest
- [بناء Plugins](/ar/plugins/building-plugins) — دليل بدء خطوة بخطوة
