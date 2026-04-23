---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم `setup-entry.ts` مقابل `index.ts`
    - أنت تعرّف مخططات تكوين Plugin أو بيانات OpenClaw الوصفية في `package.json`
sidebarTitle: Setup and Config
summary: معالجات الإعداد، `setup-entry.ts`، مخططات التكوين، وبيانات `package.json` الوصفية
title: إعداد Plugin والتكوين
x-i18n:
    generated_at: "2026-04-23T14:01:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# إعداد Plugin والتكوين

مرجع لتغليف Plugin (بيانات `package.json` الوصفية)، وملفات manifest
(`openclaw.plugin.json`)، وإدخالات الإعداد، ومخططات التكوين.

<Tip>
  **هل تبحث عن شرح عملي؟** تغطي الأدلة الإرشادية التغليف ضمن السياق:
  [Channel Plugins](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و
  [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج `package.json` الخاص بك إلى حقل `openclaw` يوضح لنظام Plugin ما الذي
يوفره Plugin الخاص بك:

**Channel Plugin:**

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

**Provider Plugin / خط أساس النشر في ClawHub:**

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

إذا نشرت Plugin خارجيًا على ClawHub، فإن حقلي `compat` و`build`
مطلوبان. وتوجد مقتطفات النشر القياسية في
`docs/snippets/plugin-publish/`.

### حقول `openclaw`

| الحقل        | النوع      | الوصف                                                                                                                   |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | ملفات نقطة الإدخال (نسبة إلى جذر الحزمة)                                                                                |
| `setupEntry` | `string`   | إدخال خفيف للإعداد فقط (اختياري)                                                                                         |
| `channel`    | `object`   | بيانات وصفية لفهرس القنوات لاستخدامها في الإعداد، والمنتقي، والبداية السريعة، وواجهات الحالة                           |
| `providers`  | `string[]` | معرّفات Provider المسجّلة بواسطة هذا Plugin                                                                              |
| `install`    | `object`   | تلميحات التثبيت: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | علامات سلوك بدء التشغيل                                                                                                  |

### `openclaw.channel`

الحقل `openclaw.channel` هو بيانات وصفية رخيصة على مستوى الحزمة لاكتشاف القنوات
وواجهات الإعداد قبل تحميل وقت التشغيل.

| الحقل                                  | النوع      | معناه                                                                          |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | معرّف القناة القياسي.                                                           |
| `label`                                | `string`   | التسمية الأساسية للقناة.                                                        |
| `selectionLabel`                       | `string`   | تسمية المنتقي/الإعداد عندما ينبغي أن تختلف عن `label`.                          |
| `detailLabel`                          | `string`   | تسمية تفصيلية ثانوية لفهارس القنوات الأغنى وواجهات الحالة.                     |
| `docsPath`                             | `string`   | مسار التوثيق لروابط الإعداد والاختيار.                                          |
| `docsLabel`                            | `string`   | تسمية بديلة مستخدمة لروابط التوثيق عندما ينبغي أن تختلف عن معرّف القناة.       |
| `blurb`                                | `string`   | وصف قصير للإعداد الأولي/الفهرس.                                                |
| `order`                                | `number`   | ترتيب الفرز في فهارس القنوات.                                                   |
| `aliases`                              | `string[]` | أسماء مستعارة إضافية للبحث عن القناة عند الاختيار.                             |
| `preferOver`                           | `string[]` | معرّفات Plugin/قنوات أقل أولوية يجب أن تتقدم عليها هذه القناة.                 |
| `systemImage`                          | `string`   | اسم أيقونة/صورة نظام اختياري لفهارس واجهة القنوات.                             |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط التوثيق في واجهات الاختيار.                                 |
| `selectionDocsOmitLabel`               | `boolean`  | عرض مسار التوثيق مباشرةً بدلًا من رابط توثيق ذي تسمية في نص الاختيار.          |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحق في نص الاختيار.                                       |
| `markdownCapable`                      | `boolean`  | يحدد أن القناة قادرة على Markdown لقرارات التنسيق الصادر.                      |
| `exposure`                             | `object`   | عناصر تحكم في ظهور القناة في الإعداد، والقوائم المضبوطة، وواجهات التوثيق.      |
| `quickstartAllowFrom`                  | `boolean`  | إدراج هذه القناة في تدفق البداية السريعة القياسي لـ `allowFrom`.               |
| `forceAccountBinding`                  | `boolean`  | فرض ربط صريح للحساب حتى عند وجود حساب واحد فقط.                                |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | تفضيل البحث في الجلسة عند حل أهداف الإعلان لهذه القناة.                        |

مثال:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
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

- `configured`: تضمين القناة في واجهات القوائم المضبوطة/بنمط الحالة
- `setup`: تضمين القناة في منتقيات الإعداد/التكوين التفاعلية
- `docs`: تمييز القناة على أنها موجهة للعامة في واجهات التوثيق/التنقل

ما زال `showConfigured` و`showInSetup` مدعومين كأسماء مستعارة قديمة. ويُفضَّل
`exposure`.

### `openclaw.install`

الحقل `openclaw.install` هو بيانات وصفية للحزمة، وليس بيانات manifest وصفية.

| الحقل                        | النوع                | معناه                                                                               |
| ---------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | مواصفة npm القياسية لتدفقات التثبيت/التحديث.                                        |
| `localPath`                  | `string`             | مسار تثبيت محلي للتطوير أو مضمّن.                                                    |
| `defaultChoice`              | `"npm"` \| `"local"` | مصدر التثبيت المفضل عند توفر الاثنين.                                               |
| `minHostVersion`             | `string`             | الحد الأدنى لإصدار OpenClaw المدعوم بصيغة `>=x.y.z`.                               |
| `expectedIntegrity`          | `string`             | سلسلة سلامة npm dist المتوقعة، وعادةً `sha512-...`، لعمليات التثبيت المثبتة.       |
| `allowInvalidConfigRecovery` | `boolean`            | يتيح لتدفقات إعادة تثبيت Plugin المضمّن التعافي من بعض حالات فشل التكوين القديم المحددة. |

يستخدم الإعداد الأولي التفاعلي أيضًا `openclaw.install` لواجهات
التثبيت عند الطلب. إذا كان Plugin الخاص بك يعرض خيارات مصادقة Provider أو
بيانات وصفية لإعداد/فهرسة القنوات قبل تحميل وقت التشغيل، فيمكن للإعداد الأولي
عرض هذا الخيار، والمطالبة بالاختيار بين تثبيت npm أو محلي، ثم تثبيت أو تمكين
Plugin، ثم متابعة التدفق المحدد. تتطلب خيارات إعداد npm بيانات وصفية موثوقة
من الفهرس مع `npmSpec` في السجل؛ أما الإصدارات الدقيقة و`expectedIntegrity`
فهما دبابيس اختيارية. إذا كانت `expectedIntegrity` موجودة، فإن تدفقات
التثبيت/التحديث تفرضها. احتفظ ببيانات "ما الذي يجب عرضه" الوصفية في
`openclaw.plugin.json` وبيانات "كيفية تثبيته" الوصفية في `package.json`.

إذا ضُبط `minHostVersion`، فإن التثبيت وتحميل سجل manifest يفرضان كليهما
هذا الشرط. وتتخطى المضيفات الأقدم Plugin؛ كما تُرفض سلاسل الإصدارات غير الصالحة.

بالنسبة إلى تثبيتات npm المثبتة، احتفظ بالإصدار الدقيق في `npmSpec` وأضف
سلامة الأثر المتوقعة:

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

لا يُعد `allowInvalidConfigRecovery` تجاوزًا عامًا للتكوينات المعطوبة. بل هو
للتعافي المحدود فقط في حالة Plugin المضمّن، بحيث يمكن لإعادة التثبيت/الإعداد
إصلاح بقايا ترقية معروفة مثل غياب مسار Plugin مضمّن أو إدخال قديم في
`channels.<id>` لذلك Plugin نفسه. إذا كان التكوين معطوبًا لأسباب غير ذات صلة،
يفشل التثبيت بشكل مغلق ويطلب من المشغّل تشغيل `openclaw doctor --fix`.

### تأجيل التحميل الكامل

يمكن لـ Channel Plugins اختيار التحميل المؤجل باستخدام:

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

عند التمكين، يحمّل OpenClaw فقط `setupEntry` خلال مرحلة بدء التشغيل السابقة
للاستماع، حتى بالنسبة إلى القنوات المضبوطة بالفعل. ويتم تحميل الإدخال الكامل بعد
أن يبدأ Gateway الاستماع.

<Warning>
  فعّل التحميل المؤجل فقط عندما يسجل `setupEntry` كل ما يحتاجه
  Gateway قبل أن يبدأ الاستماع (تسجيل القناة، ومسارات HTTP، وطرائق Gateway).
  إذا كان الإدخال الكامل يملك قدرات بدء تشغيل مطلوبة، فاحتفظ
  بالسلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل يسجل طرائق Gateway RPC، فأبقها على
بادئة خاصة بـ Plugin. تظل مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) مملوكة للنواة وتُحل دائمًا إلى
`operator.admin`.

## manifest الخاص بـ Plugin

يجب أن يحتوي كل Plugin أصلي على ملف `openclaw.plugin.json` في جذر الحزمة.
يستخدم OpenClaw هذا للتحقق من التكوين من دون تنفيذ كود Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

بالنسبة إلى Channel Plugins، أضف `kind` و`channels`:

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

حتى Plugins التي لا تحتوي على تكوين يجب أن تشحن مخططًا. والمخطط الفارغ صالح:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [Plugin Manifest](/ar/plugins/manifest) للحصول على المرجع الكامل للمخطط.

## النشر إلى ClawHub

بالنسبة إلى حزم Plugin، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

الاسم المستعار القديم للنشر الخاص بـ Skills هو للمهارات فقط. ويجب أن تستخدم حزم Plugin
دائمًا `clawhub package publish`.

## إدخال الإعداد

ملف `setup-entry.ts` هو بديل خفيف لـ `index.ts` يقوم
OpenClaw بتحميله عندما يحتاج فقط إلى واجهات الإعداد (الإعداد الأولي، وإصلاح التكوين،
وفحص القنوات المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يؤدي هذا إلى تجنب تحميل كود وقت تشغيل ثقيل (مكتبات التشفير، وتسجيلات CLI،
والخدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمنة التي تحتفظ بصادرات آمنة للإعداد في وحدات sidecar
استخدام `defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من
`defineSetupPluginEntry(...)`. يدعم هذا العقد المضمّن أيضًا تصديرًا اختياريًا
باسم `runtime` حتى يبقى ربط وقت التشغيل في وقت الإعداد خفيفًا وصريحًا.

**متى يستخدم OpenClaw `setupEntry` بدلًا من الإدخال الكامل:**

- تكون القناة معطلة لكنها تحتاج إلى واجهات إعداد/تهيئة أولية
- تكون القناة مفعلة ولكن غير مضبوطة
- يكون التحميل المؤجل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`)

**ما الذي يجب أن يسجله `setupEntry`:**

- كائن Channel Plugin (عبر `defineSetupPluginEntry`)
- أي مسارات HTTP مطلوبة قبل أن يبدأ Gateway الاستماع
- أي طرائق Gateway مطلوبة أثناء بدء التشغيل

ويجب على طرائق Gateway الخاصة ببدء التشغيل هذه أيضًا تجنب
مساحات أسماء الإدارة الأساسية المحجوزة مثل `config.*` أو `update.*`.

**ما الذي يجب ألا يتضمنه `setupEntry`:**

- تسجيلات CLI
- الخدمات الخلفية
- استيرادات وقت تشغيل ثقيلة (التشفير، SDKs)
- طرائق Gateway المطلوبة فقط بعد بدء التشغيل

### استيرادات مساعدات الإعداد الضيقة

بالنسبة إلى المسارات الساخنة الخاصة بالإعداد فقط، فضّل واجهات مساعدات الإعداد الضيقة بدلًا من
المظلة الأوسع `plugin-sdk/setup` عندما تحتاج فقط إلى جزء من واجهة الإعداد:

| مسار الاستيراد                     | استخدمه من أجل                                                                          | الصادرات الأساسية                                                                                                                                                                                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدات وقت التشغيل في وقت الإعداد التي تبقى متاحة في `setupEntry` / بدء تشغيل القناة المؤجل | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | مهايئات إعداد الحسابات الواعية بالبيئة                                                 | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | مساعدات CLI/الأرشيف/التوثيق الخاصة بالإعداد والتثبيت                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

استخدم الواجهة الأوسع `plugin-sdk/setup` عندما تريد صندوق أدوات الإعداد
المشترك الكامل، بما في ذلك مساعدات patch الخاصة بالتكوين مثل
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

تبقى مهايئات patch الخاصة بالإعداد آمنة للاستيراد ضمن المسار الساخن. البحث الخاص بها
عن سطح عقدة الترقية للحساب الفردي في القنوات المضمنة يكون كسولًا، لذا فإن استيراد
`plugin-sdk/setup-runtime` لا يحمّل مسبقًا اكتشاف سطح العقدة المضمنة قبل
استخدام المهايئ فعليًا.

### ترقية الحساب الفردي المملوكة للقناة

عندما تقوم قناة بترقية تكوينها من تكوين علوي لحساب واحد إلى
`channels.<id>.accounts.*`، يكون السلوك المشترك الافتراضي هو نقل القيم
المخصصة لنطاق الحساب التي جرت ترقيتها إلى `accounts.default`.

يمكن للقنوات المضمنة تضييق هذه الترقية أو تجاوزها عبر سطح عقدة الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح إضافية من المستوى الأعلى يجب نقلها إلى
  الحساب الذي تمت ترقيته
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، لا تُنقل
  إلى الحساب الذي تمت ترقيته إلا هذه المفاتيح؛ أما مفاتيح السياسة/التسليم المشتركة
  فتبقى عند جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الموجود الذي
  سيتلقى القيم المرقاة

تُعد Matrix المثال المضمّن الحالي. إذا كان هناك حساب Matrix مسمى واحد فقط
موجودًا بالفعل، أو إذا كانت `defaultAccount` تشير إلى مفتاح موجود غير قياسي
مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال جديد
`accounts.default`.

## مخطط التكوين

يتم التحقق من تكوين Plugin مقابل JSON Schema الموجود في manifest الخاص بك. ويقوم المستخدمون
بتكوين Plugins عبر:

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

يتلقى Plugin هذا التكوين على هيئة `api.pluginConfig` أثناء التسجيل.

وبالنسبة إلى التكوين الخاص بالقناة، استخدم قسم تكوين القناة بدلًا من ذلك:

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

### بناء مخططات تكوين القناة

استخدم `buildChannelConfigSchema` من `openclaw/plugin-sdk/core` لتحويل
مخطط Zod إلى غلاف `ChannelConfigSchema` الذي يتحقق منه OpenClaw:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## معالجات الإعداد

يمكن لـ Channel Plugins توفير معالجات إعداد تفاعلية لأمر `openclaw onboard`.
المعالج عبارة عن كائن `ChannelSetupWizard` على `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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

يدعم النوع `ChannelSetupWizard` عناصر مثل `credentials` و`textInputs` و
`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` وغير ذلك.
راجع حزم Plugin المضمنة (على سبيل المثال Discord plugin في `src/channel.setup.ts`) للاطلاع على
أمثلة كاملة.

بالنسبة إلى مطالبات قائمة السماح للرسائل المباشرة التي تحتاج فقط إلى تدفق
`note -> prompt -> parse -> merge -> patch` القياسي، فضّل مساعدات الإعداد
المشتركة من `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
و`createTopLevelChannelParsedAllowFromPrompt(...)`، و
`createNestedChannelParsedAllowFromPrompt(...)`.

وبالنسبة إلى كتل حالة إعداد القناة التي لا تختلف إلا في التسميات والدرجات
والأسطر الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من
`openclaw/plugin-sdk/setup` بدلًا من كتابة كائن `status` نفسه يدويًا
في كل Plugin.

وبالنسبة إلى واجهات الإعداد الاختيارية التي ينبغي أن تظهر فقط في سياقات معينة، استخدم
`createOptionalChannelSetupSurface` من `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

كما يعرّض `plugin-sdk/channel-setup` أيضًا البنّاءين منخفضي المستوى
`createOptionalChannelSetupAdapter(...)` و
`createOptionalChannelSetupWizard(...)` عندما تحتاج فقط إلى نصف واحد من
واجهة التثبيت الاختيارية تلك.

تفشل المهايئات/المعالجات الاختيارية المولدة بشكل مغلق عند الكتابات الفعلية للتكوين. وهي
تعيد استخدام رسالة واحدة تفيد بأن التثبيت مطلوب عبر `validateInput`,
و`applyAccountConfig`، و`finalize`، وتُلحق رابط توثيق عندما تكون `docsPath`
مضبوطة.

وبالنسبة إلى واجهات الإعداد المعتمدة على binary، فضّل المساعدات المشتركة المفوضة بدلًا من
نسخ المنطق نفسه الخاص بالثنائيات/الحالة في كل قناة:

- `createDetectedBinaryStatus(...)` لكتل الحالة التي لا تختلف إلا في التسميات،
  والتلميحات، والدرجات، واكتشاف binary
- `createCliPathTextInput(...)` لمدخلات النص المعتمدة على المسار
- `createDelegatedSetupWizardStatusResolvers(...)`,
  و`createDelegatedPrepare(...)`, و`createDelegatedFinalize(...)`, و
  `createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى
  التفويض كسولًا إلى معالج كامل أثقل
- `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى
  تفويض قرار `textInputs[*].shouldPrompt`

## النشر والتثبيت

**Plugins الخارجية:** انشر إلى [ClawHub](/ar/tools/clawhub) أو npm، ثم ثبّت:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

يحاول OpenClaw استخدام ClawHub أولًا ثم يعود إلى npm تلقائيًا. ويمكنك أيضًا
فرض ClawHub صراحةً:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

لا يوجد تجاوز مطابق لـ `npm:`. استخدم مواصفة حزمة npm العادية عندما
تريد مسار npm بعد الرجوع من ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugin المضمنة وسيتم
اكتشافها تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت عبر:**

```bash
openclaw plugins install <package-name>
```

<Info>
  بالنسبة إلى التثبيتات القادمة من npm، يشغّل `openclaw plugins install`
  الأمر `npm install --ignore-scripts` (من دون lifecycle scripts). حافظ على شجرة
  تبعيات Plugin بلغة JS/TS خالصة وتجنب الحزم التي تتطلب بناء `postinstall`.
</Info>

تُعد Plugins المضمنة المملوكة لـ OpenClaw هي الاستثناء الوحيد لإصلاح بدء التشغيل: عندما
يرى التثبيت المجمّع أحدها مفعّلًا عبر تكوين Plugin، أو تكوين قناة قديم، أو
manifest المضمّن الافتراضي المفعّل الخاص به، فإن بدء التشغيل يثبت تبعيات وقت
التشغيل المفقودة لذلك Plugin قبل الاستيراد. يجب ألا تعتمد Plugins الخارجية على
عمليات تثبيت وقت التشغيل؛ واصل استخدام مثبّت Plugin الصريح.

## ذو صلة

- [نقاط إدخال SDK](/ar/plugins/sdk-entrypoints) -- `definePluginEntry` و`defineChannelPluginEntry`
- [Plugin Manifest](/ar/plugins/manifest) -- المرجع الكامل لمخطط manifest
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل خطوة بخطوة للبدء
