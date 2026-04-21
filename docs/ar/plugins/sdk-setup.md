---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - أنت بحاجة إلى فهم `setup-entry.ts` مقابل `index.ts`
    - أنت تعرّف مخططات إعداد Plugin أو بيانات OpenClaw الوصفية في `package.json`
sidebarTitle: Setup and Config
summary: معالجات الإعداد، و`setup-entry.ts`، ومخططات الإعدادات، وبيانات `package.json` الوصفية
title: إعداد Plugin والإعدادات
x-i18n:
    generated_at: "2026-04-21T07:25:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# إعداد Plugin والإعدادات

مرجع لتغليف Plugin (بيانات `package.json` الوصفية)، وmanifests
(`openclaw.plugin.json`)، وإدخالات الإعداد، ومخططات الإعدادات.

<Tip>
  **هل تبحث عن شرح تفصيلي؟** تغطي الأدلة الإرشادية التغليف ضمن السياق:
  [Plugins القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و
  [Plugins المزوّد](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج `package.json` لديك إلى حقل `openclaw` يخبر نظام Plugin بما
يوفره Plugin لديك:

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
      "blurb": "وصف قصير للقناة."
    }
  }
}
```

**Plugin مزوّد / خط أساس النشر في ClawHub:**

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

إذا نشرت Plugin خارجيًا على ClawHub، فحقلا `compat` و`build`
مطلوبان. وتوجد مقتطفات النشر القياسية في
`docs/snippets/plugin-publish/`.

### حقول `openclaw`

| الحقل | النوع | الوصف |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | ملفات نقطة الدخول (بالنسبة إلى جذر الحزمة) |
| `setupEntry` | `string` | إدخال خفيف للإعداد فقط (اختياري) |
| `channel` | `object` | بيانات وصفية لكاتالوج القنوات من أجل الإعداد، والمنتقي، والبدء السريع، وحالة الأسطح |
| `providers` | `string[]` | معرّفات المزوّدين التي يسجلها هذا Plugin |
| `install` | `object` | تلميحات التثبيت: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup` | `object` | علامات سلوك بدء التشغيل |

### `openclaw.channel`

يمثل `openclaw.channel` بيانات وصفية خفيفة للحزمة من أجل اكتشاف القناة
وأَسْطُح الإعداد قبل تحميل وقت التشغيل.

| الحقل | النوع | المعنى |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id` | `string` | معرّف القناة القياسي. |
| `label` | `string` | التسمية الأساسية للقناة. |
| `selectionLabel` | `string` | تسمية المنتقي/الإعداد عندما يجب أن تختلف عن `label`. |
| `detailLabel` | `string` | تسمية تفصيل ثانوية لكاتالوجات القنوات الغنية وأسطح الحالة. |
| `docsPath` | `string` | مسار الوثائق لروابط الإعداد والاختيار. |
| `docsLabel` | `string` | تجاوز التسمية المستخدمة لروابط الوثائق عندما يجب أن تختلف عن معرّف القناة. |
| `blurb` | `string` | وصف قصير للإدخال/الكاتالوج. |
| `order` | `number` | ترتيب الفرز في كاتالوجات القنوات. |
| `aliases` | `string[]` | أسماء مستعارة إضافية للبحث عن القناة. |
| `preferOver` | `string[]` | معرّفات Plugin/قناة أقل أولوية يجب أن تتفوق عليها هذه القناة. |
| `systemImage` | `string` | اسم icon/system-image اختياري لكاتالوجات واجهة القناة. |
| `selectionDocsPrefix` | `string` | نص بادئة قبل روابط الوثائق في أسطح الاختيار. |
| `selectionDocsOmitLabel` | `boolean` | عرض مسار الوثائق مباشرة بدلًا من رابط وثائق معنون في نص الاختيار. |
| `selectionExtras` | `string[]` | سلاسل قصيرة إضافية تُلحق في نص الاختيار. |
| `markdownCapable` | `boolean` | يضع علامة على القناة على أنها قادرة على Markdown لقرارات التنسيق الصادر. |
| `exposure` | `object` | عناصر تحكم في ظهور القناة لأسطح الإعداد، والقوائم المضبوطة، والوثائق. |
| `quickstartAllowFrom` | `boolean` | يدرج هذه القناة في تدفق إعداد `allowFrom` القياسي للبدء السريع. |
| `forceAccountBinding` | `boolean` | يفرض ربط حساب صريحًا حتى عند وجود حساب واحد فقط. |
| `preferSessionLookupForAnnounceTarget` | `boolean` | يفضّل البحث في الجلسة عند حل أهداف الإعلان لهذه القناة. |

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
      "blurb": "تكامل دردشة مستضاف ذاتيًا قائم على Webhook.",
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

- `configured`: تضمين القناة في أسطح القوائم المضبوطة/المشابهة للحالة
- `setup`: تضمين القناة في منتقيات الإعداد/التهيئة التفاعلية
- `docs`: وضع علامة على القناة كواجهة عامة في أسطح الوثائق/التنقل

لا يزال `showConfigured` و`showInSetup` مدعومين كأسماء مستعارة قديمة. ويفضّل
استخدام `exposure`.

### `openclaw.install`

`openclaw.install` هو بيانات وصفية للحزمة، وليس بيانات وصفية للـ manifest.

| الحقل | النوع | المعنى |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec` | `string` | مواصفة npm القياسية لتدفقات التثبيت/التحديث. |
| `localPath` | `string` | مسار تثبيت محلي للتطوير أو مضمّن. |
| `defaultChoice` | `"npm"` \| `"local"` | مصدر التثبيت المفضل عند توفر الاثنين. |
| `minHostVersion` | `string` | أقل إصدار OpenClaw مدعوم بصيغة `>=x.y.z`. |
| `allowInvalidConfigRecovery` | `boolean` | يسمح لتدفقات إعادة تثبيت Plugin المضمّن بالتعافي من إخفاقات إعدادات قديمة محددة. |

إذا تم ضبط `minHostVersion`، فإن التثبيت وتحميل سجل manifest
يفرضانه معًا. وتتخطى المضيفات الأقدم Plugin؛ كما تُرفض سلاسل الإصدارات غير الصالحة.

لا يشكل `allowInvalidConfigRecovery` تجاوزًا عامًا للإعدادات المعطلة. فهو
مخصص لتعافٍ ضيق خاص بـ Plugin المضمّن فقط، بحيث يمكن لإعادة التثبيت/الإعداد
إصلاح بقايا ترقية معروفة مثل مسار Plugin مضمّن مفقود أو إدخال
`channels.<id>` قديم لذلك Plugin نفسه. وإذا كانت الإعدادات معطلة لأسباب غير ذات صلة،
فسيظل التثبيت يفشل بإغلاق افتراضي ويطلب من المشغّل تشغيل `openclaw doctor --fix`.

### التحميل الكامل المؤجل

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

عند التمكين، يحمّل OpenClaw فقط `setupEntry` أثناء مرحلة بدء التشغيل قبل
الاستماع، حتى بالنسبة إلى القنوات المضبوطة بالفعل. ويتم تحميل الإدخال الكامل بعد
أن يبدأ Gateway بالاستماع.

<Warning>
  لا تمكّن التحميل المؤجل إلا عندما يسجل `setupEntry` لديك كل ما
  يحتاجه Gateway قبل أن يبدأ الاستماع (تسجيل القناة، ومسارات HTTP،
  وطرق Gateway). وإذا كان الإدخال الكامل يملك إمكانات بدء تشغيل مطلوبة، فاحتفظ
  بالسلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل لديك يسجل طرق Gateway RPC، فأبقها على
بادئة خاصة بـ Plugin. وتظل مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) مملوكة لـ core وتُحل دائمًا إلى
`operator.admin`.

## manifest الخاص بـ Plugin

يجب أن يشحن كل Plugin أصلي ملف `openclaw.plugin.json` في جذر الحزمة.
يستخدم OpenClaw هذا للتحقق من الإعدادات دون تنفيذ كود Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "يضيف إمكانات My Plugin إلى OpenClaw",
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

حتى Plugins التي لا تحتوي على إعدادات يجب أن تشحن مخططًا. ويكون المخطط الفارغ صالحًا:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [بيان Plugin](/ar/plugins/manifest) للحصول على مرجع المخطط الكامل.

## النشر على ClawHub

بالنسبة إلى حزم Plugin، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

الاسم المستعار القديم للنشر الخاص بالـ Skills فقط هو للـ Skills. ويجب على حزم Plugin
دائمًا استخدام `clawhub package publish`.

## إدخال الإعداد

ملف `setup-entry.ts` هو بديل خفيف لـ `index.ts` يقوم
OpenClaw بتحميله عندما يحتاج فقط إلى أسطح الإعداد (onboarding، وإصلاح الإعدادات،
وفحص القناة المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب ذلك تحميل كود وقت تشغيل ثقيل (مكتبات التشفير، وتسجيلات CLI،
والخدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بصادرات آمنة للإعداد في وحدات sidecar
استخدام `defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من
`defineSetupPluginEntry(...)`. كما يدعم هذا العقد المضمّن
تصدير `runtime` اختياريًا حتى يبقى توصيل وقت التشغيل أثناء الإعداد خفيفًا وصريحًا.

**متى يستخدم OpenClaw ‏`setupEntry` بدلًا من الإدخال الكامل:**

- القناة معطلة لكنها تحتاج إلى أسطح إعداد/onboarding
- القناة مفعّلة لكنها غير مضبوطة
- تم تمكين التحميل المؤجل (`deferConfiguredChannelFullLoadUntilAfterListen`)

**ما الذي يجب أن يسجله `setupEntry`:**

- كائن Plugin القناة (عبر `defineSetupPluginEntry`)
- أي مسارات HTTP مطلوبة قبل استماع Gateway
- أي طرق Gateway لازمة أثناء بدء التشغيل

يجب أن تتجنب طرق Gateway الخاصة ببدء التشغيل تلك أيضًا
مساحات أسماء الإدارة الأساسية المحجوزة مثل `config.*` أو `update.*`.

**ما الذي يجب ألا يتضمنه `setupEntry`:**

- تسجيلات CLI
- الخدمات الخلفية
- استيرادات وقت تشغيل ثقيلة (crypto، وSDKs)
- طرق Gateway المطلوبة فقط بعد بدء التشغيل

### استيرادات مساعدات إعداد ضيقة

بالنسبة إلى المسارات الساخنة الخاصة بالإعداد فقط، فضّل طبقات مساعدات الإعداد الضيقة بدلًا من
المظلة الأوسع `plugin-sdk/setup` عندما تحتاج فقط إلى جزء من سطح الإعداد:

| مسار الاستيراد | استخدمه من أجل | أهم الصادرات |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | مساعدات وقت تشغيل وقت الإعداد التي تبقى متاحة في `setupEntry` / بدء التشغيل المؤجل للقناة | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | محوّلات إعداد الحساب الواعية بالبيئة | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools` | مساعدات CLI/archive/docs الخاصة بالإعداد/التثبيت | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

استخدم الطبقة الأوسع `plugin-sdk/setup` عندما تريد صندوق أدوات الإعداد
المشترك الكامل، بما في ذلك مساعدات config-patch مثل
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

تبقى محوّلات patch الخاصة بالإعداد آمنة للمسار الساخن عند الاستيراد. ويكون
البحث عن سطح عقد ترقية الحساب الواحد المضمّن فيها كسولًا، لذا فإن استيراد
`plugin-sdk/setup-runtime` لا يحمّل باكرًا اكتشاف سطح العقد المضمّن
قبل استخدام المحوّل فعليًا.

### الترقية المملوكة للقناة من حساب واحد

عندما تُرقّي قناة من إعداد top-level بحساب واحد إلى
`channels.<id>.accounts.*`، فإن السلوك المشترك الافتراضي ينقل القيم
ذات النطاق الخاص بالحساب إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق هذا النقل أو تجاوزه عبر سطح عقد الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح top-level إضافية يجب نقلها إلى
  الحساب المرقّى
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، لا تُنقل إلى الحساب المرقّى إلا هذه
  المفاتيح؛ بينما تبقى مفاتيح السياسة/التسليم المشتركة في جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختر الحساب الموجود الذي
  يتلقى القيم المرقّاة

Matrix هو المثال المضمّن الحالي. فإذا كان هناك حساب Matrix مسمى واحد بالضبط
موجودًا بالفعل، أو إذا كانت `defaultAccount` تشير إلى مفتاح غير قياسي موجود
مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال
`accounts.default` جديد.

## مخطط الإعدادات

يتم التحقق من صحة إعداد Plugin مقابل JSON Schema في الـ manifest لديك. ويقوم المستخدمون
بتهيئة Plugins عبر:

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

يتلقى Plugin لديك هذه الإعدادات على هيئة `api.pluginConfig` أثناء التسجيل.

بالنسبة إلى الإعدادات الخاصة بالقناة، استخدم قسم إعدادات القناة بدلًا من ذلك:

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

### بناء مخططات إعدادات القناة

استخدم `buildChannelConfigSchema` من `openclaw/plugin-sdk/core` لتحويل
مخطط Zod إلى الغلاف `ChannelConfigSchema` الذي يتحقق منه OpenClaw:

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
      envPrompt: "هل تريد استخدام MY_CHANNEL_BOT_TOKEN من البيئة؟",
      keepPrompt: "هل تريد الاحتفاظ بالرمز الحالي؟",
      inputPrompt: "أدخل رمز البوت:",
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

يدعم النوع `ChannelSetupWizard` الحقول `credentials` و`textInputs`
و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` وغير ذلك.
راجع حزم Plugins المضمّنة (على سبيل المثال Discord plugin ‏`src/channel.setup.ts`) للاطلاع
على أمثلة كاملة.

بالنسبة إلى مطالبات قائمة سماح DM التي تحتاج فقط إلى التدفق القياسي
`note -> prompt -> parse -> merge -> patch`، فضّل مساعدات الإعداد
المشتركة من `openclaw/plugin-sdk/setup`: ‏`createPromptParsedAllowFromForAccount(...)`,
و`createTopLevelChannelParsedAllowFromPrompt(...)`، و
`createNestedChannelParsedAllowFromPrompt(...)`.

بالنسبة إلى كتل حالة إعداد القناة التي تختلف فقط في التسميات، والدرجات، والأسطر الإضافية
الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من
`openclaw/plugin-sdk/setup` بدلًا من بناء الكائن `status` نفسه يدويًا
في كل Plugin.

بالنسبة إلى أسطح الإعداد الاختيارية التي يجب أن تظهر فقط في سياقات معينة، استخدم
`createOptionalChannelSetupSurface` من `openclaw/plugin-sdk/channel-setup`:

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

يكشف `plugin-sdk/channel-setup` أيضًا عن البانِيَيْن ذوي المستوى الأدنى
`createOptionalChannelSetupAdapter(...)` و
`createOptionalChannelSetupWizard(...)` عندما تحتاج فقط إلى نصف واحد من
سطح التثبيت الاختياري ذاك.

يفشل المحوّل/المعالج الاختياري المولّد بإغلاق افتراضي عند الكتابات الفعلية للإعدادات. وهو
يعيد استخدام رسالة واحدة تفيد بضرورة التثبيت عبر `validateInput`,
و`applyAccountConfig`، و`finalize`، ويُلحق رابط وثائق عند ضبط `docsPath`.

بالنسبة إلى واجهات إعداد مدعومة بثنائيات، فضّل المساعدات المشتركة المفوضة بدلًا من
نسخ الغراء نفسه الخاص بالثنائي/الحالة في كل قناة:

- `createDetectedBinaryStatus(...)` لكتل الحالة التي تختلف فقط في التسميات،
  والتلميحات، والدرجات، واكتشاف الثنائيات
- `createCliPathTextInput(...)` لمدخلات النص المدعومة بمسار
- `createDelegatedSetupWizardStatusResolvers(...)`,
  و`createDelegatedPrepare(...)`, و`createDelegatedFinalize(...)`, و
  `createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى التوجيه
  إلى معالج كامل أثقل بشكل كسول
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
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub فقط
```

لا يوجد تجاوز مماثل `npm:`. استخدم مواصفة حزمة npm العادية عندما
تريد مسار npm بعد الرجوع من ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugins المضمّنة وسيتم اكتشافها
تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
  بالنسبة إلى عمليات التثبيت القادمة من npm، يشغّل `openclaw plugins install`
  الأمر `npm install --ignore-scripts` (من دون lifecycle scripts). أبقِ أشجار
  اعتماد Plugin بصيغة JS/TS نقية وتجنب الحزم التي تتطلب builds من نوع `postinstall`.
</Info>

تشكل Plugins المضمّنة المملوكة لـ OpenClaw استثناء إصلاح بدء التشغيل الوحيد: عندما
يرى التثبيت المعبّأ واحدًا منها مفعّلًا عبر إعداد Plugin، أو إعداد قناة قديم، أو
manifest مضمّن مفعّل افتراضيًا، فإن بدء التشغيل يثبّت
اعتماديات وقت التشغيل المفقودة لذلك Plugin قبل الاستيراد. ولا ينبغي أن تعتمد Plugins الخارجية
على تثبيتات بدء التشغيل؛ واصل استخدام مثبّت Plugin الصريح.

## ذات صلة

- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) -- ‏`definePluginEntry` و`defineChannelPluginEntry`
- [بيان Plugin](/ar/plugins/manifest) -- مرجع مخطط manifest الكامل
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل تمهيدي خطوة بخطوة
