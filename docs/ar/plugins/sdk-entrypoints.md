---
read_when:
    - أنت بحاجة إلى التوقيع النوعي الدقيق لـ `definePluginEntry` أو `defineChannelPluginEntry`
    - أنت تريد فهم وضع التسجيل (كامل مقابل setup مقابل بيانات تعريف CLI)
    - أنت تبحث عن خيارات نقطة الدخول
sidebarTitle: Entry Points
summary: مرجع `definePluginEntry` و`defineChannelPluginEntry` و`defineSetupPluginEntry`
title: نقاط دخول Plugin
x-i18n:
    generated_at: "2026-04-25T13:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

يصدّر كل Plugin كائن إدخال افتراضي. وتوفّر SDK ثلاث أدوات مساعدة
لإنشائها.

بالنسبة إلى Plugins المثبتة، يجب أن يشير `package.json` إلى تحميل وقت التشغيل نحو
JavaScript المبني عند توفره:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

تظل `extensions` و`setupEntry` صالحتيْن كإدخالات source للتطوير من مساحة العمل ونسخة
git checkout. وتُفضَّل `runtimeExtensions` و`runtimeSetupEntry`
عندما يحمّل OpenClaw حزمة مثبتة، وتسمحان لحزم npm بتجنب ترجمة TypeScript
وقت التشغيل. وإذا كانت الحزمة المثبتة تعلن فقط عن إدخال source من TypeScript،
فسيستخدم OpenClaw نظير `dist/*.js` المبني المطابق عندما يكون موجودًا،
ثم يرجع إلى source الخاص بـ TypeScript.

يجب أن تبقى جميع مسارات الإدخال داخل دليل حزمة Plugin. ولا تجعل إدخالات runtime
وأقران JavaScript المبنية المستنتجة مسار source خاصًا بـ `extensions` أو
`setupEntry` صالحًا إذا كان يهرب خارج الحزمة.

<Tip>
  **هل تبحث عن شرح عملي؟** راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  أو [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة.
</Tip>

## `definePluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/plugin-entry`

بالنسبة إلى Plugins المزوّدين، وPlugins الأدوات، وPlugins hooks، وأي شيء **ليس**
قناة مراسلة.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| الحقل          | النوع                                                            | مطلوب | الافتراضي          |
| -------------- | ---------------------------------------------------------------- | ------ | ------------------ |
| `id`           | `string`                                                         | نعم    | —                  |
| `name`         | `string`                                                         | نعم    | —                  |
| `description`  | `string`                                                         | نعم    | —                  |
| `kind`         | `string`                                                         | لا     | —                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا     | مخطط كائن فارغ     |
| `register`     | `(api: OpenClawPluginApi) => void`                               | نعم    | —                  |

- يجب أن يطابق `id` ملف manifest الخاص بك `openclaw.plugin.json`.
- يُستخدم `kind` للفتحات الحصرية: `"memory"` أو `"context-engine"`.
- يمكن أن يكون `configSchema` دالة من أجل التقييم الكسول.
- يقوم OpenClaw بحل ذلك المخطط وتخزينه مؤقتًا عند أول وصول، لذا فإن بُناة المخططات
  المكلفة لا تعمل إلا مرة واحدة.

## `defineChannelPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

يلف `definePluginEntry` بأسلاك خاصة بالقنوات. ويستدعي تلقائيًا
`api.registerChannel({ plugin })`، ويكشف طبقة اختيارية لبيانات تعريف CLI الخاصة بالمساعدة الجذرية، ويقيّد `registerFull` بحسب وضع التسجيل.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| الحقل                 | النوع                                                            | مطلوب | الافتراضي          |
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------ |
| `id`                  | `string`                                                         | نعم    | —                  |
| `name`                | `string`                                                         | نعم    | —                  |
| `description`         | `string`                                                         | نعم    | —                  |
| `plugin`              | `ChannelPlugin`                                                  | نعم    | —                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا     | مخطط كائن فارغ     |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | لا     | —                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | لا     | —                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | لا     | —                  |

- يُستدعى `setRuntime` أثناء التسجيل حتى تتمكن من تخزين مرجع runtime
  (عادةً عبر `createPluginRuntimeStore`). ويتم تخطيه أثناء التقاط
  بيانات تعريف CLI.
- يعمل `registerCliMetadata` أثناء `api.registrationMode === "cli-metadata"`،
  و`api.registrationMode === "discovery"`، و
  `api.registrationMode === "full"`.
  استخدمه بوصفه المكان القانوني لوصفات CLI المملوكة للقناة حتى تظل
  المساعدة الجذرية غير مفعِّلة، وتتضمن لقطات الاكتشاف بيانات تعريف الأوامر الثابتة،
  ويظل تسجيل أوامر CLI العادي متوافقًا مع التحميل الكامل للـ Plugin.
- تسجيل الاكتشاف غير مفعِّل، لكنه ليس خاليًا من الاستيراد. قد يقوم OpenClaw
  بتقييم إدخال Plugin الموثوق ووحدة channel plugin لبناء
  اللقطة، لذا أبقِ الاستيرادات على المستوى الأعلى خالية من التأثيرات الجانبية وضع
  المقابس، والعملاء، والعمال، والخدمات خلف مسارات `"full"` فقط.
- لا يعمل `registerFull` إلا عندما يكون `api.registrationMode === "full"`. ويُتخطى
  أثناء التحميل المخصص للإعداد فقط.
- مثل `definePluginEntry`، يمكن أن يكون `configSchema` مصنعًا كسولًا ويقوم OpenClaw
  بتخزين المخطط المحلول مؤقتًا عند أول وصول.
- بالنسبة إلى أوامر CLI الجذرية المملوكة لـ Plugin، فضّل `api.registerCli(..., { descriptors: [...] })`
  عندما تريد أن يظل الأمر محمّلًا كسولًا من دون أن يختفي من
  شجرة تحليل CLI الجذرية. وبالنسبة إلى Plugins القنوات، فضّل تسجيل هذه الواصفات
  من `registerCliMetadata(...)` وأبقِ `registerFull(...)` مركّزًا على الأعمال الخاصة بـ runtime فقط.
- إذا كان `registerFull(...)` يسجل أيضًا أساليب Gateway RPC، فأبقها على
  بادئة خاصة بالـ Plugin. وتُحوَّل دائمًا مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`،
  و`exec.approvals.*`، و`wizard.*`، و`update.*`) إلى
  `operator.admin`.

## `defineSetupPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

بالنسبة إلى ملف `setup-entry.ts` خفيف الوزن. يعيد فقط `{ plugin }` من دون
runtime أو أسلاك CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

يقوم OpenClaw بتحميل هذا بدلًا من الإدخال الكامل عندما تكون القناة معطلة،
أو غير مهيأة، أو عندما يكون التحميل المؤجل مفعّلًا. راجع
[الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) لمعرفة متى يهم هذا.

عمليًا، اقترن `defineSetupPluginEntry(...)` بعائلات مساعدات الإعداد
الضيقة:

- `openclaw/plugin-sdk/setup-runtime` لمساعدات الإعداد الآمنة مع runtime مثل
  محولات تصحيح الإعداد الآمنة للاستيراد، ومخرجات lookup-note،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوضين
- `openclaw/plugin-sdk/channel-setup` لأسطح الإعداد الخاصة بالتثبيت الاختياري
- `openclaw/plugin-sdk/setup-tools` لمساعدات CLI/الأرشيف/المستندات الخاصة بالإعداد/التثبيت

أبقِ SDKs الثقيلة، وتسجيل CLI، وخدمات runtime طويلة العمر داخل
الإدخال الكامل.

يمكن للقنوات المضمنة في مساحة العمل التي تفصل بين أسطح الإعداد وruntime
استخدام `defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من ذلك. ويسمح هذا العقد
لإدخال الإعداد بالاحتفاظ بصادرات plugin/secrets الآمنة للإعداد مع الاستمرار في كشف
أداة ضبط runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

استخدم هذا العقد المضمّن فقط عندما تحتاج تدفقات الإعداد حقًا إلى أداة ضبط runtime
خفيفة الوزن قبل تحميل الإدخال الكامل للقناة.

## وضع التسجيل

يخبر `api.registrationMode` Plugin الخاص بك بكيفية تحميله:

| الوضع             | متى                              | ما الذي يجب تسجيله                                                                                                      |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `"full"`          | بدء تشغيل Gateway العادي         | كل شيء                                                                                                                  |
| `"discovery"`     | اكتشاف قدرات للقراءة فقط         | تسجيل القناة بالإضافة إلى واصفات CLI الثابتة؛ قد يُحمَّل كود الإدخال، لكن تخطَّ المقابس والعمال والعملاء والخدمات       |
| `"setup-only"`    | قناة معطلة/غير مهيأة            | تسجيل القناة فقط                                                                                                        |
| `"setup-runtime"` | تدفق إعداد مع توفر runtime       | تسجيل القناة بالإضافة إلى runtime الخفيف فقط المطلوب قبل تحميل الإدخال الكامل                                           |
| `"cli-metadata"`  | المساعدة الجذرية / التقاط بيانات تعريف CLI | واصفات CLI فقط                                                                                                  |

يتعامل `defineChannelPluginEntry` مع هذا الانقسام تلقائيًا. وإذا استخدمت
`definePluginEntry` مباشرةً لقناة، فتحقق من الوضع بنفسك:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // تسجيلات runtime الثقيلة فقط
  api.registerService(/* ... */);
}
```

يبني وضع الاكتشاف لقطة سجل غير مفعِّلة. وقد يقيّم مع ذلك
إدخال Plugin وكائن channel plugin حتى يتمكن OpenClaw من تسجيل قدرات القناة
وواصفات CLI الثابتة. تعامل مع تقييم الوحدة في وضع الاكتشاف على أنه
موثوق لكنه خفيف: لا عملاء شبكة، ولا عمليات فرعية، ولا listeners، ولا اتصالات قواعد بيانات،
ولا عمال خلفية، ولا قراءات لبيانات الاعتماد، ولا أي تأثيرات جانبية حية أخرى لوقت التشغيل على المستوى الأعلى.

تعامل مع `"setup-runtime"` على أنه النافذة التي يجب أن تكون فيها
أسطح بدء التشغيل الخاصة بالإعداد فقط موجودة من دون إعادة دخول runtime الكامل للقناة المضمنة. ومن الأمثلة المناسبة
تسجيل القناة، ومسارات HTTP الآمنة للإعداد، وأساليب gateway الآمنة للإعداد، و
مساعدات الإعداد المفوضة. أما خدمات الخلفية الثقيلة، ومسجلات CLI، و
bootstraps الخاصة بـ SDK للعميل/المزوّد فلا تزال تنتمي إلى `"full"`.

بالنسبة إلى مسجلات CLI تحديدًا:

- استخدم `descriptors` عندما يملك المسجل أمرًا جذريًا واحدًا أو أكثر وتريد
  أن يقوم OpenClaw بتحميل وحدة CLI الحقيقية تحميلًا كسولًا عند أول استدعاء
- تأكد من أن هذه الواصفات تغطي كل جذر أوامر في المستوى الأعلى يكشفه
  المسجل
- أبقِ أسماء أوامر الواصفات على حروف وأرقام وشرطة سفلية وشرطة،
  على أن تبدأ بحرف أو رقم؛ يرفض OpenClaw أسماء الواصفات خارج
  هذا الشكل ويزيل تسلسلات التحكم الطرفية من الأوصاف قبل
  عرض المساعدة
- استخدم `commands` وحدها فقط لمسارات التوافق المحمّلة eagerly

## أشكال Plugin

يصنّف OpenClaw Plugins المحمّلة وفقًا لسلوك التسجيل الخاص بها:

| الشكل                 | الوصف                                             |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | نوع قدرة واحد (مثل مزود فقط)                      |
| **hybrid-capability** | أنواع قدرات متعددة (مثل مزود + speech)            |
| **hook-only**         | hooks فقط، من دون قدرات                           |
| **non-capability**    | أدوات/أوامر/خدمات ولكن من دون قدرات               |

استخدم `openclaw plugins inspect <id>` لرؤية شكل Plugin.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — API التسجيل ومرجع المسارات الفرعية
- [مساعدات Runtime](/ar/plugins/sdk-runtime) — `api.runtime` و`createPluginRuntimeStore`
- [الإعداد والتهيئة](/ar/plugins/sdk-setup) — manifest، وإدخال الإعداد، والتحميل المؤجل
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء كائن `ChannelPlugin`
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) — تسجيل المزوّد وhooks
