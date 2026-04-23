---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - أنت تحتاج إلى فهم الفرق بين `setup-entry.ts` و`index.ts`
    - أنت تعرّف مخططات تكوين Plugin أو بيانات `package.json` الوصفية الخاصة بـ openclaw
sidebarTitle: Setup and Config
summary: معالجات الإعداد، و`setup-entry.ts`، ومخططات التكوين، وبيانات `package.json` الوصفية
title: إعداد Plugin والتكوين
x-i18n:
    generated_at: "2026-04-23T07:30:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccdafb9a562353a7851fcd47bbc382961a449f5d645362c800f64c60579ce7b2
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# إعداد Plugin والتكوين

مرجع لتغليف Plugin (بيانات `package.json` الوصفية)، وmanifest
(`openclaw.plugin.json`)، وإدخالات الإعداد، ومخططات التكوين.

<Tip>
  **هل تبحث عن شرح عملي؟** تغطي الأدلة الإرشادية التغليف ضمن السياق:
  [Plugins القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و
  [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج ملف `package.json` لديك إلى حقل `openclaw` يُخبر نظام Plugin بما
يوفره Plugin الخاص بك:

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

**Plugin موفّر / خط أساس نشر ClawHub:**

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

إذا نشرت Plugin خارجيًا على ClawHub، فستكون حقول `compat` و`build`
هذه مطلوبة. وتوجد مقتطفات النشر القياسية في
`docs/snippets/plugin-publish/`.

### حقول `openclaw`

| الحقل | النوع | الوصف |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | ملفات نقاط الإدخال (بالنسبة إلى جذر الحزمة) |
| `setupEntry` | `string` | إدخال خفيف خاص بالإعداد فقط (اختياري) |
| `channel` | `object` | بيانات وصفية لفهرس القنوات من أجل الإعداد، والمنتقي، والبدء السريع، وأسطح الحالة |
| `providers` | `string[]` | معرّفات الموفّرين التي يسجلها هذا Plugin |
| `install` | `object` | تلميحات التثبيت: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup` | `object` | علامات سلوك بدء التشغيل |

### `openclaw.channel`

إن `openclaw.channel` هي بيانات وصفية خفيفة للحزمة لاكتشاف القنوات وأسطح
الإعداد قبل تحميل بيئة التشغيل.

| الحقل | النوع | معناه |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id` | `string` | معرّف القناة القياسي. |
| `label` | `string` | التسمية الأساسية للقناة. |
| `selectionLabel` | `string` | تسمية المنتقي/الإعداد عندما ينبغي أن تختلف عن `label`. |
| `detailLabel` | `string` | تسمية تفصيلية ثانوية لكتالوجات القنوات الأغنى وأسطح الحالة. |
| `docsPath` | `string` | مسار المستندات لروابط الإعداد والاختيار. |
| `docsLabel` | `string` | تجاوز التسمية المستخدمة لروابط المستندات عندما ينبغي أن تختلف عن معرّف القناة. |
| `blurb` | `string` | وصف موجز للإعداد/الفهرس. |
| `order` | `number` | ترتيب الفرز في كتالوجات القنوات. |
| `aliases` | `string[]` | أسماء مستعارة إضافية للبحث عند اختيار القناة. |
| `preferOver` | `string[]` | معرّفات Plugins/قنوات أقل أولوية ينبغي أن تتقدم عليها هذه القناة. |
| `systemImage` | `string` | اسم أيقونة/system-image اختياري لكتالوجات واجهة مستخدم القنوات. |
| `selectionDocsPrefix` | `string` | نص بادئة قبل روابط المستندات في أسطح الاختيار. |
| `selectionDocsOmitLabel` | `boolean` | عرض مسار المستندات مباشرة بدلًا من رابط مستندات ذي تسمية في نص الاختيار. |
| `selectionExtras` | `string[]` | سلاسل قصيرة إضافية تُلحق في نص الاختيار. |
| `markdownCapable` | `boolean` | يعلّم القناة على أنها قادرة على Markdown لأغراض قرارات التنسيق الصادر. |
| `exposure` | `object` | عناصر تحكم في ظهور القناة للإعداد، والقوائم المُعدّة، وأسطح المستندات. |
| `quickstartAllowFrom` | `boolean` | يضم هذه القناة إلى تدفق إعداد `allowFrom` القياسي في البدء السريع. |
| `forceAccountBinding` | `boolean` | يفرض ربط حساب صريحًا حتى عند وجود حساب واحد فقط. |
| `preferSessionLookupForAnnounceTarget` | `boolean` | يفضّل البحث في الجلسة عند resolve لأهداف الإعلان لهذه القناة. |

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

- `configured`: تضمين القناة في أسطح القوائم المُعدّة/التي على نمط الحالة
- `setup`: تضمين القناة في منتقيات الإعداد/التكوين التفاعلية
- `docs`: تعليم القناة على أنها موجهة للعامة في أسطح المستندات/التنقل

لا يزال `showConfigured` و`showInSetup` مدعومين كأسماء مستعارة قديمة. ويفضَّل
استخدام `exposure`.

### `openclaw.install`

إن `openclaw.install` هي بيانات وصفية للحزمة، وليست بيانات وصفية للـ manifest.

| الحقل | النوع | معناه |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec` | `string` | مواصفة npm القياسية لتدفقات التثبيت/التحديث. |
| `localPath` | `string` | مسار التثبيت المحلي للتطوير أو التثبيت المضمّن. |
| `defaultChoice` | `"npm"` \| `"local"` | مصدر التثبيت المفضل عندما يكون كلاهما متاحًا. |
| `minHostVersion` | `string` | الحد الأدنى لإصدار OpenClaw المدعوم بالصورة `>=x.y.z`. |
| `expectedIntegrity` | `string` | سلسلة سلامة npm dist المتوقعة، وعادة تكون `sha512-...`، للتثبيتات المثبتة. |
| `allowInvalidConfigRecovery` | `boolean` | يسمح لتدفقات إعادة تثبيت Plugin المضمّن بالتعافي من حالات فشل محددة ناتجة عن تكوين قديم. |

يستخدم onboarding التفاعلي أيضًا `openclaw.install` في أسطح
التثبيت عند الطلب. وإذا كان Plugin الخاص بك يكشف اختيارات مصادقة الموفّر أو بيانات
إعداد/فهرسة القنوات قبل تحميل بيئة التشغيل، فيمكن لـ onboarding إظهار ذلك
الاختيار، ثم طلب npm أو التثبيت المحلي، ثم تثبيت Plugin أو تفعيله، ثم متابعة
التدفق المحدد. وتتطلب اختيارات onboarding الخاصة بـ npm بيانات وصفية موثوقة للفهرس تحتوي على
`npmSpec` بإصدار دقيق و`expectedIntegrity`؛ ولا تُعرض أسماء الحزم غير المثبتة
والـ dist-tags من أجل تثبيتات onboarding التلقائية. أبقِ البيانات الوصفية الخاصة
بـ "ما الذي يجب عرضه" في `openclaw.plugin.json` والبيانات الوصفية الخاصة
بـ "كيف يتم تثبيته" في `package.json`.

إذا تم تعيين `minHostVersion`، فإن كلًا من التثبيت وتحميل سجل manifest
يفرضانه. وتتجاوز المضيفات الأقدم Plugin؛ كما تُرفض سلاسل الإصدارات غير الصالحة.

بالنسبة إلى تثبيتات npm المثبتة، احتفظ بالإصدار الدقيق في `npmSpec` وأضف
سلامة العنصر المتوقعة:

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

إن `allowInvalidConfigRecovery` ليس تجاوزًا عامًا للتكوينات المعطلة. بل هو
مخصص فقط لتعافٍ ضيق خاص بالـ Plugin المضمّن، حتى يتمكن إعادة التثبيت/الإعداد من إصلاح
مخلفات ترقية معروفة مثل مسار Plugin مضمّن مفقود أو إدخال `channels.<id>`
قديم يعود إلى Plugin نفسه. وإذا كان التكوين معطّلًا لأسباب غير مرتبطة، فإن التثبيت
سيفشل بشكل مغلق وسيخبر المشغّل بتشغيل `openclaw doctor --fix`.

### تأجيل التحميل الكامل

يمكن لـ Plugins القنوات الاشتراك في التحميل المؤجل باستخدام:

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

عند التفعيل، يحمّل OpenClaw `setupEntry` فقط خلال مرحلة بدء التشغيل السابقة لـ listen،
حتى بالنسبة إلى القنوات المُعدّة بالفعل. ويتم تحميل الإدخال الكامل بعد أن
يبدأ gateway الاستماع.

<Warning>
  فعّل التحميل المؤجل فقط عندما يسجل `setupEntry` لديك كل ما يحتاجه
  gateway قبل أن يبدأ الاستماع (تسجيل القناة، ومسارات HTTP، وطرائق gateway). وإذا كان الإدخال الكامل يملك Capabilities مطلوبة عند بدء التشغيل، فأبقِ
  السلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل لديك يسجل طرائق Gateway RPC، فاحتفظ بها على
بادئة خاصة بالـ Plugin. وتبقى مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) مملوكة لـ core وتُحل دائمًا
إلى `operator.admin`.

## Plugin Manifest

يجب أن يشحن كل Plugin أصلي ملف `openclaw.plugin.json` في جذر الحزمة.
يستخدم OpenClaw هذا للتحقق من التكوين من دون تنفيذ شيفرة Plugin.

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

حتى Plugins التي لا تحتوي على تكوين يجب أن تشحن مخططًا. ويكون المخطط الفارغ صالحًا:

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

## النشر على ClawHub

بالنسبة إلى حزم Plugins، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

إن الاسم المستعار القديم للنشر الخاص بالـ Skills فقط مخصص للـ Skills. أما حزم Plugins فيجب
أن تستخدم دائمًا `clawhub package publish`.

## إدخال الإعداد

إن الملف `setup-entry.ts` هو بديل خفيف لـ `index.ts` يقوم
OpenClaw بتحميله عندما يحتاج فقط إلى أسطح الإعداد (onboarding، وإصلاح التكوين،
وفحص القنوات المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل شيفرة بيئة تشغيل ثقيلة (مكتبات التشفير، وتسجيلات CLI،
والخدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بعمليات تصدير آمنة للإعداد في وحدات جانبية
استخدام `defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من
`defineSetupPluginEntry(...)`. يدعم هذا العقد المضمّن أيضًا export اختياريًا باسم
`runtime` بحيث يبقى توصيل بيئة التشغيل وقت الإعداد خفيفًا وصريحًا.

**متى يستخدم OpenClaw `setupEntry` بدلًا من الإدخال الكامل:**

- تكون القناة معطلة لكنها تحتاج إلى أسطح إعداد/onboarding
- تكون القناة مفعلة لكنها غير مضبوطة
- يكون التحميل المؤجل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`)

**ما الذي يجب أن يسجله `setupEntry`:**

- كائن Plugin القناة (عبر `defineSetupPluginEntry`)
- أي مسارات HTTP مطلوبة قبل أن يبدأ gateway الاستماع
- أي طرائق gateway مطلوبة أثناء بدء التشغيل

يجب أن تتجنب طرائق Gateway الخاصة ببدء التشغيل هذه أيضًا مساحات أسماء الإدارة الأساسية
المحجوزة مثل `config.*` أو `update.*`.

**ما الذي لا ينبغي أن يتضمنه `setupEntry`:**

- تسجيلات CLI
- الخدمات الخلفية
- عمليات استيراد بيئة تشغيل ثقيلة (التشفير، SDKs)
- طرائق Gateway المطلوبة فقط بعد بدء التشغيل

### عمليات استيراد ضيقة لمساعدات الإعداد

بالنسبة إلى مسارات الإعداد الساخنة فقط، فضّل وصلات مساعدات الإعداد الضيقة بدلًا من واجهة
`plugin-sdk/setup` الأشمل عندما تحتاج فقط إلى جزء من سطح الإعداد:

| مسار الاستيراد | استخدمه من أجل | أهم الصادرات |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | مساعدات بيئة التشغيل وقت الإعداد التي تظل متاحة في `setupEntry` / بدء تشغيل القناة المؤجل | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | محولات إعداد الحسابات الواعية بالبيئة | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools` | مساعدات CLI/الأرشيف/المستندات الخاصة بالإعداد/التثبيت | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

استخدم وصلة `plugin-sdk/setup` الأعرض عندما تريد صندوق أدوات الإعداد
المشترك الكامل، بما في ذلك مساعدات ترقيع التكوين مثل
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

تظل محولات ترقيع الإعداد آمنة للاستيراد في المسار الساخن. ويكون البحث عن سطح عقد
الترقية للحساب الواحد في الحِزم المضمّنة كسولًا، لذا فإن استيراد
`plugin-sdk/setup-runtime` لا يحمّل اكتشاف سطح العقد المضمّن مسبقًا
قبل استخدام المحول فعليًا.

### ترقية الحساب الواحد المملوكة للقناة

عندما تنتقل قناة من تكوين علوي لحساب واحد إلى
`channels.<id>.accounts.*`، فإن السلوك المشترك الافتراضي هو نقل القيم ذات
النطاق الحسابي المُرقّاة إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق هذه الترقية أو تجاوزها عبر سطح عقد
الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية ينبغي نقلها إلى
  الحساب المُرقّى
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، لا تُنقل
  إلى الحساب المُرقّى إلا هذه المفاتيح؛ أما مفاتيح السياسة/التسليم المشتركة
  فتبقى عند جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الموجود الذي
  يستقبل القيم المُرقّاة

يمثل Matrix المثال المضمّن الحالي. فإذا كان هناك بالفعل حساب Matrix
مسمى واحد فقط، أو إذا كانت `defaultAccount` تشير إلى مفتاح غير قياسي موجود
مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال جديد
باسم `accounts.default`.

## مخطط التكوين

يتم التحقق من تكوين Plugin وفق JSON Schema الموجود في manifest لديك. يقوم المستخدمون
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

يتلقى Plugin الخاص بك هذا التكوين على شكل `api.pluginConfig` أثناء التسجيل.

أما بالنسبة إلى التكوين الخاص بالقناة، فاستخدم قسم تكوين القناة بدلًا من ذلك:

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

### بناء مخططات تكوين القنوات

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

يمكن لـ Plugins القنوات توفير معالجات إعداد تفاعلية للأمر `openclaw onboard`.
ويكون المعالج كائن `ChannelSetupWizard` على `ChannelPlugin`:

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

يدعم النوع `ChannelSetupWizard` الحقول `credentials` و`textInputs`،
و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` وغير ذلك.
راجع حزم Plugins المضمّنة (مثل Plugin Discord في `src/channel.setup.ts`) للحصول على
أمثلة كاملة.

بالنسبة إلى مطالبات قائمة السماح للرسائل المباشرة التي تحتاج فقط إلى تدفق
`note -> prompt -> parse -> merge -> patch` القياسي، ففضّل مساعدات الإعداد
المشتركة من `openclaw/plugin-sdk/setup`: وهي `createPromptParsedAllowFromForAccount(...)`,
و`createTopLevelChannelParsedAllowFromPrompt(...)`، و
`createNestedChannelParsedAllowFromPrompt(...)`.

أما بالنسبة إلى كتل حالة إعداد القناة التي تختلف فقط في التسميات والدرجات والأسطر
الإضافية الاختيارية، ففضّل `createStandardChannelSetupStatus(...)` من
`openclaw/plugin-sdk/setup` بدلًا من بناء كائن `status` نفسه يدويًا في
كل Plugin.

وبالنسبة إلى أسطح الإعداد الاختيارية التي ينبغي أن تظهر فقط في سياقات معينة، فاستخدم
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

يكشف `plugin-sdk/channel-setup` أيضًا البانِيَين ذوي المستوى الأدنى
`createOptionalChannelSetupAdapter(...)` و
`createOptionalChannelSetupWizard(...)` عندما تحتاج فقط إلى نصف واحد من
سطح التثبيت الاختياري ذاك.

يفشل المحول/المعالج الاختياري المُولَّد بشكل مغلق عند كتابات التكوين الحقيقية. وهو
يعيد استخدام رسالة واحدة تفيد بوجوب التثبيت عبر `validateInput`,
و`applyAccountConfig`، و`finalize`، ويُلحق رابط مستندات عندما يكون `docsPath`
محددًا.

بالنسبة إلى واجهات الإعداد المعتمدة على الملفات التنفيذية، ففضّل المساعدات المشتركة المفوَّضة بدلًا من
نسخ الغراء نفسه الخاص بالملف التنفيذي/الحالة داخل كل قناة:

- `createDetectedBinaryStatus(...)` لكتل الحالة التي تختلف فقط في التسميات،
  والتلميحات، والدرجات، واكتشاف الملف التنفيذي
- `createCliPathTextInput(...)` لمدخلات النص المعتمدة على المسار
- `createDelegatedSetupWizardStatusResolvers(...)`,
  و`createDelegatedPrepare(...)`, و`createDelegatedFinalize(...)`, و
  `createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى التمرير إلى
  معالج كامل أثقل بشكل كسول
- `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى
  تفويض قرار `textInputs[*].shouldPrompt`

## النشر والتثبيت

**Plugins الخارجية:** انشر إلى [ClawHub](/ar/tools/clawhub) أو npm، ثم ثبّت باستخدام:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

يحاول OpenClaw استخدام ClawHub أولًا ثم يعود إلى npm تلقائيًا. ويمكنك أيضًا
فرض ClawHub صراحةً:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub فقط
```

لا يوجد تجاوز مطابق باسم `npm:`. استخدم مواصفة حزمة npm العادية عندما
تريد مسار npm بعد رجوع ClawHub الاحتياطي:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugins المضمّنة وسيتم
اكتشافها تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت عبر:**

```bash
openclaw plugins install <package-name>
```

<Info>
  بالنسبة إلى التثبيتات القادمة من npm، يشغّل `openclaw plugins install`
  الأمر `npm install --ignore-scripts` (من دون lifecycle scripts). أبقِ أشجار
  تبعيات Plugin على JS/TS خالصة وتجنب الحزم التي تتطلب عمليات بناء في `postinstall`.
</Info>

تشكّل Plugins المضمّنة المملوكة لـ OpenClaw الاستثناء الوحيد لإصلاحات بدء التشغيل: فعندما
يرى تثبيت مجمّع أن أحدها مفعّل عبر تكوين Plugin، أو تكوين قناة قديم، أو manifest
المضمّن المفعّل افتراضيًا، فإن بدء التشغيل يثبّت تبعيات بيئة التشغيل المفقودة لذلك Plugin قبل الاستيراد. لا ينبغي للـ Plugins الخارجية الاعتماد على
تثبيتات بدء التشغيل؛ واصل استخدام مثبّت Plugin الصريح.

## ذو صلة

- [نقاط إدخال SDK](/ar/plugins/sdk-entrypoints) -- ‏`definePluginEntry` و`defineChannelPluginEntry`
- [Plugin Manifest](/ar/plugins/manifest) -- المرجع الكامل لمخطط manifest
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل البدء خطوة بخطوة
