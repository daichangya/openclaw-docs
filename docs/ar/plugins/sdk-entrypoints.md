---
read_when:
    - تحتاج إلى توقيع النوع الدقيق لـ `definePluginEntry` أو `defineChannelPluginEntry`
    - تريد فهم وضع التسجيل (كامل مقابل الإعداد مقابل بيانات CLI الوصفية)
    - أنت تبحث عن خيارات نقطة الإدخال
sidebarTitle: Entry Points
summary: مرجع `definePluginEntry` و`defineChannelPluginEntry` و`defineSetupPluginEntry`
title: نقاط إدخال Plugin
x-i18n:
    generated_at: "2026-04-22T04:25:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# نقاط إدخال Plugin

يصدّر كل plugin كائن إدخال افتراضيًا. ويوفر SDK ثلاث وسائل مساعدة
لإنشائها.

بالنسبة إلى plugins المثبّتة، يجب أن يوجّه `package.json` تحميل وقت التشغيل إلى
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

تظل `extensions` و`setupEntry` صالحتي الإدخال المصدري لتطوير workspace وgit
checkout. وتكون `runtimeExtensions` و`runtimeSetupEntry` مفضلتين
عندما يحمّل OpenClaw حزمة مثبّتة، وتتيحان لحزم npm تجنب ترجمة
TypeScript وقت التشغيل. وإذا كانت الحزمة المثبّتة تعلن فقط عن نقطة إدخال
مصدر TypeScript، فسيستخدم OpenClaw نظيرًا مبنيًا مطابقًا في `dist/*.js` عند وجوده،
ثم يعود إلى مصدر TypeScript.

يجب أن تبقى جميع مسارات الإدخال داخل دليل حزمة plugin. ولا تجعل إدخالات وقت التشغيل
ونظائر JavaScript المبنية المستنتجة مسار مصدر `extensions` أو
`setupEntry` الهارب صالحًا.

<Tip>
  **هل تبحث عن شرح تفصيلي؟** راجع [Channel Plugins](/ar/plugins/sdk-channel-plugins)
  أو [Provider Plugins](/ar/plugins/sdk-provider-plugins) للحصول على أدلة خطوة بخطوة.
</Tip>

## `definePluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/plugin-entry`

لـ plugins الخاصة بالمزوّدين، وplugins الأدوات، وplugins الخاصة بـ hooks، وأي شيء **ليس**
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

| الحقل          | النوع                                                             | مطلوب | الافتراضي             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | نعم      | —                   |
| `name`         | `string`                                                         | نعم      | —                   |
| `description`  | `string`                                                         | نعم      | —                   |
| `kind`         | `string`                                                         | لا       | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا       | مخطط كائن فارغ |
| `register`     | `(api: OpenClawPluginApi) => void`                               | نعم      | —                   |

- يجب أن يطابق `id` ملف manifest ‏`openclaw.plugin.json` الخاص بك.
- يُستخدم `kind` للمنافذ الحصرية: `"memory"` أو `"context-engine"`.
- يمكن أن يكون `configSchema` دالة للتقييم الكسول.
- يقوم OpenClaw بحل هذا المخطط وتخزينه مؤقتًا عند أول وصول، لذا فإن بُناة المخطط
  المكلفين لا يعملون إلا مرة واحدة.

## `defineChannelPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

يلف `definePluginEntry` مع ربط خاص بالقنوات. ويستدعي تلقائيًا
`api.registerChannel({ plugin })`، ويكشف seam اختياريًا لبيانات CLI الوصفية
للمساعدة الجذرية، ويقيّد `registerFull` بحسب وضع التسجيل.

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

| الحقل                 | النوع                                                             | مطلوب | الافتراضي             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | نعم      | —                   |
| `name`                | `string`                                                         | نعم      | —                   |
| `description`         | `string`                                                         | نعم      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | نعم      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | لا       | مخطط كائن فارغ |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | لا       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | لا       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | لا       | —                   |

- يتم استدعاء `setRuntime` أثناء التسجيل حتى تتمكن من تخزين مرجع وقت التشغيل
  (عادة عبر `createPluginRuntimeStore`). ويتم تخطيه أثناء
  التقاط بيانات CLI الوصفية.
- يعمل `registerCliMetadata` أثناء كل من `api.registrationMode === "cli-metadata"`
  و`api.registrationMode === "full"`.
  استخدمه بوصفه المكان القياسي لوصفات CLI المملوكة للقناة بحيث
  تظل المساعدة الجذرية غير مفعِّلة بينما يظل تسجيل أوامر CLI العادية متوافقًا
  مع تحميلات plugin الكاملة.
- لا يعمل `registerFull` إلا عندما تكون `api.registrationMode === "full"`. ويتم تخطيه
  أثناء التحميل الخاص بالإعداد فقط.
- مثل `definePluginEntry`، يمكن أن يكون `configSchema` مصنعًا كسولًا ويقوم OpenClaw
  بتخزين المخطط المحلول مؤقتًا عند أول وصول.
- بالنسبة إلى أوامر CLI الجذرية المملوكة لـ plugin، ففضّل `api.registerCli(..., { descriptors: [...] })`
  عندما تريد أن يظل الأمر محمّلًا بكسل من دون أن يختفي من
  شجرة تحليل CLI الجذرية. وبالنسبة إلى plugins القنوات، ففضّل تسجيل تلك الوصفات
  من `registerCliMetadata(...)` وأبقِ `registerFull(...)` مركّزًا على العمل الخاص بوقت التشغيل فقط.
- إذا كان `registerFull(...)` يسجّل أيضًا أساليب Gateway RPC، فأبقها على
  بادئة خاصة بـ plugin. وتُجبَر دائمًا مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`،
  و`exec.approvals.*`، و`wizard.*`، و`update.*`) إلى
  `operator.admin`.

## `defineSetupPluginEntry`

**الاستيراد:** `openclaw/plugin-sdk/channel-core`

لملف `setup-entry.ts` الخفيف. ويعيد فقط `{ plugin }` من دون
ربط وقت تشغيل أو CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

يقوم OpenClaw بتحميل هذا بدلًا من الإدخال الكامل عندما تكون القناة معطلة،
أو غير مكوّنة، أو عند تمكين التحميل المؤجل. راجع
[الإعداد والتكوين](/ar/plugins/sdk-setup#setup-entry) لمعرفة متى يكون ذلك مهمًا.

عمليًا، قم بإقران `defineSetupPluginEntry(...)` مع عائلات
مساعدات الإعداد الضيقة:

- `openclaw/plugin-sdk/setup-runtime` لمساعدات الإعداد الآمنة لوقت التشغيل مثل
  محولات setup patch الآمنة للاستيراد، ومخرجات ملاحظات lookup،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوضين
- `openclaw/plugin-sdk/channel-setup` لأسطح الإعداد الاختيارية للتثبيت
- `openclaw/plugin-sdk/setup-tools` لمساعدات CLI/archive/docs الخاصة بالإعداد/التثبيت

أبقِ SDKs الثقيلة، وتسجيل CLI، وخدمات وقت التشغيل طويلة العمر في
الإدخال الكامل.

يمكن لقنوات workspace المضمنة التي تفصل بين أسطح الإعداد ووقت التشغيل استخدام
`defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من ذلك. ويتيح هذا العقد لـ
نقطة إدخال الإعداد الاحتفاظ بعمليات التصدير الآمنة للإعداد الخاصة بـ plugin/secrets مع الاستمرار في كشف
أداة ضبط لوقت التشغيل:

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

استخدم هذا العقد المضمّن فقط عندما تحتاج تدفقات الإعداد فعلًا إلى أداة ضبط
خفيفة لوقت التشغيل قبل تحميل إدخال القناة الكامل.

## وضع التسجيل

يخبرك `api.registrationMode` بكيفية تحميل plugin لديك:

| الوضع              | متى                              | ما الذي يجب تسجيله                                                                          |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | بدء تشغيل gateway العادي            | كل شيء                                                                                |
| `"setup-only"`    | قناة معطلة/غير مكوّنة     | تسجيل القناة فقط                                                                 |
| `"setup-runtime"` | تدفق إعداد مع توفر وقت التشغيل | تسجيل القناة بالإضافة إلى وقت التشغيل الخفيف فقط المطلوب قبل تحميل الإدخال الكامل |
| `"cli-metadata"`  | المساعدة الجذرية / التقاط بيانات CLI الوصفية  | أوصاف CLI فقط                                                                      |

يتولى `defineChannelPluginEntry` هذا التقسيم تلقائيًا. وإذا استخدمت
`definePluginEntry` مباشرة لقناة، فتحقق من الوضع بنفسك:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // تسجيلات ثقيلة خاصة بوقت التشغيل فقط
  api.registerService(/* ... */);
}
```

اعتبر `"setup-runtime"` نافذة يجب أن تكون فيها أسطح بدء التشغيل الخاصة بالإعداد فقط
موجودة من دون إعادة الدخول إلى وقت تشغيل القناة المضمن الكامل. وتشمل الحالات المناسبة
تسجيل القناة، ومسارات HTTP الآمنة للإعداد، وأساليب gateway الآمنة للإعداد، ومساعدات الإعداد المفوضة. أما خدمات الخلفية الثقيلة، ومسجلات CLI، وعمليات تهيئة SDK الخاصة بالمزوّد/العميل فما تزال تنتمي إلى `"full"`.

وبالنسبة إلى مسجلات CLI تحديدًا:

- استخدم `descriptors` عندما يمتلك المسجل أمرًا جذريًا واحدًا أو أكثر وتريد
  من OpenClaw تحميل وحدة CLI الفعلية بكسل عند أول استدعاء
- تأكد من أن تلك الوصفات تغطي كل جذر أمر من المستوى الأعلى يكشفه
  المسجل
- استخدم `commands` وحده فقط لمسارات التوافق الفورية

## أشكال plugins

يصنف OpenClaw plugins المحمّلة بحسب سلوك التسجيل:

| الشكل                 | الوصف                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | نوع قدرة واحد (مثل مزوّد فقط)           |
| **hybrid-capability** | أنواع قدرات متعددة (مثل مزوّد + كلام) |
| **hook-only**         | hooks فقط، من دون قدرات                        |
| **non-capability**    | أدوات/أوامر/خدمات ولكن من دون قدرات        |

استخدم `openclaw plugins inspect <id>` لرؤية شكل plugin.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — واجهة API الخاصة بالتسجيل ومرجع المسارات الفرعية
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) — ‏`api.runtime` و`createPluginRuntimeStore`
- [الإعداد والتكوين](/ar/plugins/sdk-setup) — manifest، ونقطة إدخال الإعداد، والتحميل المؤجل
- [Channel Plugins](/ar/plugins/sdk-channel-plugins) — بناء كائن `ChannelPlugin`
- [Provider Plugins](/ar/plugins/sdk-provider-plugins) — تسجيل المزوّد وhooks
