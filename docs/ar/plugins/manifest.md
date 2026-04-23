---
read_when:
    - أنت تبني Plugin لـ OpenClaw
    - تحتاج إلى شحن مخطط تكوين للـ Plugin أو تصحيح أخطاء التحقق من Plugin
summary: Manifest الخاص بالـ Plugin + متطلبات مخطط JSON (تحقق صارم من التكوين)
title: Manifest الخاص بالـ Plugin
x-i18n:
    generated_at: "2026-04-23T07:28:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: de71b9d556c2696d3279f202b66d57aa8014e9c89d81e3f453602744120d1675
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest الخاص بالـ Plugin (`openclaw.plugin.json`)

هذه الصفحة مخصصة فقط لـ **Manifest Plugin الأصلي في OpenClaw**.

بالنسبة إلى تخطيطات الحزم المتوافقة، راجع [حزم Plugin](/ar/plugins/bundles).

تستخدم تنسيقات الحزم المتوافقة ملفات Manifest مختلفة:

- حزمة Codex: `.codex-plugin/plugin.json`
- حزمة Claude: `.claude-plugin/plugin.json` أو تخطيط مكوّن Claude الافتراضي
  بدون Manifest
- حزمة Cursor: `.cursor-plugin/plugin.json`

يكتشف OpenClaw هذه التخطيطات المتوافقة للحزم تلقائيًا أيضًا، لكنه لا يتحقق منها
مقابل مخطط `openclaw.plugin.json` الموصوف هنا.

بالنسبة إلى الحزم المتوافقة، يقرأ OpenClaw حاليًا بيانات الحزمة الوصفية بالإضافة إلى
جذور Skills المعلنة، وجذور أوامر Claude، وقيم Claude bundle الافتراضية في `settings.json`،
وقيم Claude bundle الافتراضية في LSP، وحزم hooks المدعومة عندما يطابق التخطيط
توقعات وقت تشغيل OpenClaw.

يجب على كل Plugin أصلي في OpenClaw **أن يرفق** ملف `openclaw.plugin.json` في
**جذر Plugin**. يستخدم OpenClaw هذا الـ Manifest للتحقق من التكوين
**من دون تنفيذ كود Plugin**. وتُعامل الملفات المفقودة أو غير الصالحة على أنها
أخطاء Plugin وتمنع التحقق من التكوين.

راجع دليل نظام Plugins الكامل: [Plugins](/ar/tools/plugin).
وللاطلاع على نموذج القدرات الأصلي وإرشادات التوافق الخارجي الحالية:
[نموذج القدرات](/ar/plugins/architecture#public-capability-model).

## ما الذي يفعله هذا الملف

إن `openclaw.plugin.json` هو البيانات الوصفية التي يقرأها OpenClaw قبل أن يحمّل
كود Plugin الخاص بك.

استخدمه من أجل:

- هوية Plugin
- التحقق من التكوين
- بيانات المصادقة والإعداد الأولي الوصفية التي يجب أن تكون متاحة من دون تشغيل
  وقت تشغيل Plugin
- تلميحات تفعيل منخفضة الكلفة يمكن لأسطح طبقة التحكم فحصها قبل تحميل وقت التشغيل
- واصفات إعداد منخفضة الكلفة يمكن لأسطح الإعداد/الإعداد الأولي فحصها قبل
  تحميل وقت التشغيل
- بيانات الأسماء المستعارة والتفعيل التلقائي التي ينبغي حلها قبل تحميل وقت تشغيل Plugin
- بيانات مختصرة لملكية عائلات النماذج ينبغي أن تفعّل
  Plugin تلقائيًا قبل تحميل وقت التشغيل
- لقطات ثابتة لملكية القدرات تُستخدم في توصيل التوافق المضمّن وتغطية العقود
- بيانات وصفية منخفضة الكلفة لمشغل QA يمكن لمضيف `openclaw qa` المشترك فحصها
  قبل تحميل وقت تشغيل Plugin
- بيانات وصفية خاصة بتكوين القناة ينبغي دمجها في
  أسطح الكتالوج والتحقق من دون تحميل وقت التشغيل
- hints لواجهة التكوين

لا تستخدمه من أجل:

- تسجيل سلوك وقت التشغيل
- إعلان نقاط دخول الكود
- بيانات تثبيت npm الوصفية

فهذه تنتمي إلى كود Plugin الخاص بك وإلى `package.json`.

## مثال أدنى

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## مثال غني

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin provider لـ OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## مرجع الحقول ذات المستوى الأعلى

| الحقل                                | مطلوب | النوع                             | المعنى                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | نعم      | `string`                         | معرّف Plugin القانوني. وهو المعرّف المستخدم في `plugins.entries.<id>`.                                                                                                                                                               |
| `configSchema`                       | نعم      | `object`                         | مخطط JSON مضمّن لتكوين هذا الـ Plugin.                                                                                                                                                                                      |
| `enabledByDefault`                   | لا       | `true`                           | يضع علامة على أن Plugin المضمّن مفعّل افتراضيًا. احذفه، أو اضبط أي قيمة غير `true`، لترك Plugin معطّلًا افتراضيًا.                                                                                                      |
| `legacyPluginIds`                    | لا       | `string[]`                       | معرّفات قديمة تُطبَّع إلى معرّف Plugin القانوني هذا.                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | لا       | `string[]`                       | معرّفات provider التي يجب أن تفعّل هذا الـ Plugin تلقائيًا عندما تشير إليها المصادقة أو التكوين أو مراجع النماذج.                                                                                                                                   |
| `kind`                               | لا       | `"memory"` \| `"context-engine"` | يعلن نوع Plugin حصريًا يُستخدم بواسطة `plugins.slots.*`.                                                                                                                                                                      |
| `channels`                           | لا       | `string[]`                       | معرّفات القنوات التي يملكها هذا الـ Plugin. تُستخدم للاكتشاف والتحقق من التكوين.                                                                                                                                                       |
| `providers`                          | لا       | `string[]`                       | معرّفات provider التي يملكها هذا الـ Plugin.                                                                                                                                                                                                |
| `modelSupport`                       | لا       | `object`                         | بيانات وصفية مختصرة لعائلات النماذج يملكها الـ Manifest وتُستخدم لتحميل Plugin تلقائيًا قبل وقت التشغيل.                                                                                                                                       |
| `providerEndpoints`                  | لا       | `object[]`                       | بيانات وصفية يملكها الـ Manifest لمضيف endpoint/baseUrl لمسارات provider والتي يجب على core تصنيفها قبل تحميل وقت تشغيل provider.                                                                                                          |
| `cliBackends`                        | لا       | `string[]`                       | معرّفات backend الخاصة بالاستدلال عبر CLI التي يملكها هذا الـ Plugin. تُستخدم للتفعيل التلقائي عند بدء التشغيل من مراجع التكوين الصريحة.                                                                                                                       |
| `syntheticAuthRefs`                  | لا       | `string[]`                       | مراجع provider أو backend CLI التي يجب فحص hook المصادقة الاصطناعي المملوك للـ Plugin الخاص بها أثناء اكتشاف النماذج البارد قبل تحميل وقت التشغيل.                                                                                            |
| `nonSecretAuthMarkers`               | لا       | `string[]`                       | قيم API key نائبة يملكها Plugin المضمّن وتمثل حالة اعتماد محلية أو OAuth أو اعتماد بيئي غير سرية.                                                                                                              |
| `commandAliases`                     | لا       | `object[]`                       | أسماء الأوامر التي يملكها هذا الـ Plugin والتي يجب أن تنتج تشخيصات تكوين وCLI مدركة للـ Plugin قبل تحميل وقت التشغيل.                                                                                                              |
| `providerAuthEnvVars`                | لا       | `Record<string, string[]>`       | بيانات وصفية رخيصة لمصادقة provider عبر env يمكن لـ OpenClaw فحصها من دون تحميل كود Plugin.                                                                                                                                           |
| `providerAuthAliases`                | لا       | `Record<string, string>`         | معرّفات provider التي يجب أن تعيد استخدام معرّف provider آخر للبحث عن المصادقة، مثل provider خاص بالبرمجة يشارك API key وملفات تعريف المصادقة الخاصة بالـ provider الأساسي.                                                                        |
| `channelEnvVars`                     | لا       | `Record<string, string[]>`       | بيانات وصفية رخيصة للقناة عبر env يمكن لـ OpenClaw فحصها من دون تحميل كود Plugin. استخدم هذا من أجل إعداد القناة أو أسطح المصادقة المعتمدة على env التي يجب أن تراها مساعدات بدء التشغيل/التكوين العامة.                                          |
| `providerAuthChoices`                | لا       | `object[]`                       | بيانات وصفية رخيصة لاختيارات المصادقة من أجل منتقيات الإعداد الأولي، وحل provider المفضل، وربط إشارات CLI البسيط.                                                                                                                     |
| `activation`                         | لا       | `object`                         | تلميحات تفعيل رخيصة للتحميل المحفَّز بواسطة provider أو command أو channel أو route أو capability. بيانات وصفية فقط؛ وما يزال وقت تشغيل Plugin يملك السلوك الفعلي.                                                                         |
| `setup`                              | لا       | `object`                         | واصفات إعداد/إعداد أولي رخيصة يمكن لأسطح الاكتشاف والإعداد فحصها من دون تحميل وقت تشغيل Plugin.                                                                                                                  |
| `qaRunners`                          | لا       | `object[]`                       | واصفات رخيصة لمشغلات QA يستخدمها مضيف `openclaw qa` المشترك قبل تحميل وقت تشغيل Plugin.                                                                                                                                    |
| `contracts`                          | لا       | `object`                         | لقطة ثابتة للقدرات المضمّنة من أجل hooks المصادقة الخارجية، والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وجلب الويب، والبحث في الويب، وملكية الأدوات. |
| `mediaUnderstandingProviderMetadata` | لا       | `Record<string, object>`         | قيم افتراضية رخيصة لفهم الوسائط لمعرّفات provider المعلنة في `contracts.mediaUnderstandingProviders`.                                                                                                                          |
| `channelConfigs`                     | لا       | `Record<string, object>`         | بيانات وصفية لتكوين القناة يملكها الـ Manifest وتُدمج في أسطح الاكتشاف والتحقق قبل تحميل وقت التشغيل.                                                                                                                        |
| `skills`                             | لا       | `string[]`                       | دلائل Skills المطلوب تحميلها، نسبةً إلى جذر Plugin.                                                                                                                                                                           |
| `name`                               | لا       | `string`                         | اسم Plugin قابل للقراءة البشرية.                                                                                                                                                                                                       |
| `description`                        | لا       | `string`                         | ملخص قصير يظهر في أسطح Plugin.                                                                                                                                                                                           |
| `version`                            | لا       | `string`                         | إصدار Plugin لأغراض معلوماتية.                                                                                                                                                                                                     |
| `uiHints`                            | لا       | `Record<string, object>`         | تسميات UI، وعناصر نائبة، وتلميحات الحساسية لحقول التكوين.                                                                                                                                                                 |

## مرجع `providerAuthChoices`

يصف كل إدخال في `providerAuthChoices` خيار إعداد أولي أو مصادقة واحدًا.
يقرأ OpenClaw هذا قبل تحميل وقت تشغيل provider.

| الحقل                 | مطلوب | النوع                                            | المعنى                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | نعم      | `string`                                        | معرّف provider الذي ينتمي إليه هذا الخيار.                                                                      |
| `method`              | نعم      | `string`                                        | معرّف أسلوب المصادقة المطلوب التوجيه إليه.                                                                           |
| `choiceId`            | نعم      | `string`                                        | معرّف خيار مصادقة ثابت تستخدمه تدفقات الإعداد الأولي وCLI.                                                  |
| `choiceLabel`         | لا       | `string`                                        | تسمية موجهة للمستخدم. وإذا حُذفت، يعود OpenClaw إلى `choiceId`.                                        |
| `choiceHint`          | لا       | `string`                                        | نص مساعد قصير للمنتقي.                                                                        |
| `assistantPriority`   | لا       | `number`                                        | تُرتَّب القيم الأقل أولًا في المنتقيات التفاعلية التي يقودها المساعد.                                       |
| `assistantVisibility` | لا       | `"visible"` \| `"manual-only"`                  | يخفي الخيار من منتقيات المساعد مع السماح بالاختيار اليدوي عبر CLI.                        |
| `deprecatedChoiceIds` | لا       | `string[]`                                      | معرّفات خيارات قديمة يجب أن تعيد توجيه المستخدمين إلى خيار الاستبدال هذا.                                 |
| `groupId`             | لا       | `string`                                        | معرّف مجموعة اختياري لتجميع الخيارات ذات الصلة.                                                          |
| `groupLabel`          | لا       | `string`                                        | تسمية موجهة للمستخدم لتلك المجموعة.                                                                        |
| `groupHint`           | لا       | `string`                                        | نص مساعد قصير للمجموعة.                                                                         |
| `optionKey`           | لا       | `string`                                        | مفتاح خيار داخلي لتدفقات المصادقة البسيطة ذات الإشارة الواحدة.                                                      |
| `cliFlag`             | لا       | `string`                                        | اسم إشارة CLI، مثل `--openrouter-api-key`.                                                           |
| `cliOption`           | لا       | `string`                                        | شكل خيار CLI الكامل، مثل `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | لا       | `string`                                        | الوصف المستخدم في مساعدة CLI.                                                                            |
| `onboardingScopes`    | لا       | `Array<"text-inference" \| "image-generation">` | أسطح الإعداد الأولي التي يجب أن يظهر فيها هذا الخيار. وإذا حُذفت، فالقيمة الافتراضية هي `["text-inference"]`. |

## مرجع `commandAliases`

استخدم `commandAliases` عندما يملك Plugin اسم أمر وقت تشغيل قد
يضعه المستخدمون خطأً في `plugins.allow` أو يحاولون تشغيله كأمر CLI جذري. يستخدم OpenClaw
هذه البيانات الوصفية للتشخيصات من دون استيراد كود وقت تشغيل Plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| الحقل        | مطلوب | النوع              | المعنى                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | نعم      | `string`          | اسم الأمر الذي ينتمي إلى هذا الـ Plugin.                               |
| `kind`       | لا       | `"runtime-slash"` | يضع علامة على الاسم المستعار باعتباره أمر slash في الدردشة وليس أمر CLI جذريًا. |
| `cliCommand` | لا       | `string`          | أمر CLI جذري ذو صلة يُقترح لعمليات CLI، إن وُجد.  |

## مرجع `activation`

استخدم `activation` عندما يستطيع Plugin أن يعلن بشكل رخيص عن أحداث طبقة التحكم
التي ينبغي أن تفعّله لاحقًا.

## مرجع `qaRunners`

استخدم `qaRunners` عندما يساهم Plugin بواحد أو أكثر من مشغلات النقل تحت
الجذر المشترك `openclaw qa`. حافظ على هذه البيانات الوصفية رخيصة وثابتة؛ فما يزال وقت تشغيل Plugin يملك تسجيل CLI الفعلي من خلال سطح
خفيف `runtime-api.ts` يصدّر `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "تشغيل مسار QA الحي المدعوم بـ Docker لـ Matrix مقابل homeserver مؤقت"
    }
  ]
}
```

| الحقل         | مطلوب | النوع     | المعنى                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | نعم      | `string` | الأمر الفرعي المركّب تحت `openclaw qa`، مثل `matrix`.    |
| `description` | لا       | `string` | نص مساعدة احتياطي يُستخدم عندما يحتاج المضيف المشترك إلى أمر stub. |

هذه الكتلة بيانات وصفية فقط. فهي لا تسجل سلوك وقت التشغيل، كما أنها لا
تحل محل `register(...)` أو `setupEntry` أو نقاط دخول وقت التشغيل/Plugin الأخرى.
يستخدمها المستهلكون الحاليون كتلميح تضييق قبل تحميل Plugin الأوسع، لذلك فإن
غياب بيانات التفعيل الوصفية يكلف عادةً الأداء فقط؛ ولا ينبغي أن
يغيّر الصحة ما دامت بدائل ملكية الـ Manifest القديمة ما تزال موجودة.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| الحقل            | مطلوب | النوع                                                 | المعنى                                                     |
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | لا       | `string[]`                                           | معرّفات provider التي ينبغي أن تفعّل هذا الـ Plugin عند طلبها.     |
| `onCommands`     | لا       | `string[]`                                           | معرّفات الأوامر التي ينبغي أن تفعّل هذا الـ Plugin.                     |
| `onChannels`     | لا       | `string[]`                                           | معرّفات القنوات التي ينبغي أن تفعّل هذا الـ Plugin.                     |
| `onRoutes`       | لا       | `string[]`                                           | أنواع routes التي ينبغي أن تفعّل هذا الـ Plugin.                     |
| `onCapabilities` | لا       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | تلميحات قدرات عامة تُستخدم بواسطة تخطيط التفعيل في طبقة التحكم. |

المستهلكون الفعليون الحاليون:

- يعود تخطيط CLI المحفَّز بالأوامر إلى الصيغة القديمة
  `commandAliases[].cliCommand` أو `commandAliases[].name`
- يعود تخطيط الإعداد/القنوات المحفَّز بالقنوات إلى الملكية القديمة `channels[]`
  عندما تكون بيانات تفعيل القناة الصريحة مفقودة
- يعود تخطيط الإعداد/وقت التشغيل المحفَّز بالـ provider إلى الملكية القديمة
  `providers[]` وملكية `cliBackends[]` ذات المستوى الأعلى عندما تكون
  بيانات تفعيل provider الصريحة مفقودة

## مرجع `setup`

استخدم `setup` عندما تحتاج أسطح الإعداد والإعداد الأولي إلى بيانات وصفية رخيصة يملكها Plugin
قبل تحميل وقت التشغيل.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

يظل `cliBackends` ذو المستوى الأعلى صالحًا ويستمر في وصف
backends الاستدلال عبر CLI. أما `setup.cliBackends` فهو سطح الوصف الخاص بالإعداد
لتدفقات طبقة التحكم/الإعداد التي ينبغي أن تبقى بيانات وصفية فقط.

عند وجوده، يكون `setup.providers` و`setup.cliBackends` هما السطح المفضل
للبحث القائم على الوصف أولًا في اكتشاف الإعداد. وإذا كان الوصف يضيّق فقط نطاق Plugin المرشح
ولا يزال الإعداد يحتاج إلى hooks أغنى لوقت الإعداد،
فاضبط `requiresRuntime: true` وأبقِ `setup-api` في مكانه بوصفه
مسار التنفيذ الاحتياطي.

ولأن البحث في الإعداد يمكن أن ينفذ كود `setup-api` المملوك للـ Plugin، فيجب أن تبقى
القيم المطبعّة `setup.providers[].id` و`setup.cliBackends[]` فريدة عبر
Plugins المكتشفة. وتفشل الملكية الملتبسة فشلًا مغلقًا بدلًا من اختيار
فائز حسب ترتيب الاكتشاف.

### مرجع `setup.providers`

| الحقل         | مطلوب | النوع       | المعنى                                                                        |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | نعم      | `string`   | معرّف provider المعروض أثناء الإعداد أو الإعداد الأولي. حافظ على فرادة المعرفات المطبعّة عالميًا. |
| `authMethods` | لا       | `string[]` | معرّفات أساليب الإعداد/المصادقة التي يدعمها هذا الـ provider من دون تحميل وقت التشغيل الكامل.           |
| `envVars`     | لا       | `string[]` | متغيرات env التي يمكن لأسطح الإعداد/الحالة العامة فحصها قبل تحميل وقت تشغيل Plugin.   |

### حقول `setup`

| الحقل              | مطلوب | النوع       | المعنى                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | لا       | `object[]` | واصفات إعداد provider المعروضة أثناء الإعداد والإعداد الأولي.                                     |
| `cliBackends`      | لا       | `string[]` | معرّفات backend وقت الإعداد المستخدمة في البحث القائم على الوصف أولًا. حافظ على فرادة المعرفات المطبعّة عالميًا. |
| `configMigrations` | لا       | `string[]` | معرّفات ترحيل التكوين التي يملكها سطح الإعداد الخاص بهذا الـ Plugin.                                          |
| `requiresRuntime`  | لا       | `boolean`  | ما إذا كان الإعداد لا يزال يحتاج إلى تنفيذ `setup-api` بعد البحث الوصفي.                            |

## مرجع `uiHints`

`uiHints` هي خريطة من أسماء حقول التكوين إلى تلميحات عرض صغيرة.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "تُستخدم لطلبات OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

يمكن أن يتضمن كل تلميح حقل:

| الحقل         | النوع       | المعنى                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | تسمية الحقل الموجهة للمستخدم.                |
| `help`        | `string`   | نص مساعد قصير.                      |
| `tags`        | `string[]` | وسوم UI اختيارية.                       |
| `advanced`    | `boolean`  | يضع علامة على الحقل بأنه متقدم.            |
| `sensitive`   | `boolean`  | يضع علامة على الحقل بأنه سري أو حساس. |
| `placeholder` | `string`   | نص العنصر النائب لمدخلات النماذج.       |

## مرجع `contracts`

استخدم `contracts` فقط لبيانات ملكية القدرات الثابتة التي يستطيع OpenClaw
قراءتها من دون استيراد وقت تشغيل Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

كل قائمة اختيارية:

| الحقل                            | النوع       | المعنى                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | معرّفات وقت التشغيل المضمّنة التي قد يسجّل Plugin مضمّن factories لها. |
| `externalAuthProviders`          | `string[]` | معرّفات provider التي يملك هذا الـ Plugin hook ملف تعريف المصادقة الخارجية الخاص بها.   |
| `speechProviders`                | `string[]` | معرّفات مزودي الكلام التي يملكها هذا الـ Plugin.                             |
| `realtimeTranscriptionProviders` | `string[]` | معرّفات مزودي النسخ الفوري التي يملكها هذا الـ Plugin.             |
| `realtimeVoiceProviders`         | `string[]` | معرّفات مزودي الصوت الفوري التي يملكها هذا الـ Plugin.                     |
| `mediaUnderstandingProviders`    | `string[]` | معرّفات مزودي فهم الوسائط التي يملكها هذا الـ Plugin.                |
| `imageGenerationProviders`       | `string[]` | معرّفات مزودي توليد الصور التي يملكها هذا الـ Plugin.                   |
| `videoGenerationProviders`       | `string[]` | معرّفات مزودي توليد الفيديو التي يملكها هذا الـ Plugin.                   |
| `webFetchProviders`              | `string[]` | معرّفات مزودي جلب الويب التي يملكها هذا الـ Plugin.                          |
| `webSearchProviders`             | `string[]` | معرّفات مزودي البحث في الويب التي يملكها هذا الـ Plugin.                         |
| `tools`                          | `string[]` | أسماء أدوات الوكيل التي يملكها هذا الـ Plugin لفحوصات العقود المضمّنة.    |

ينبغي لموفري الخدمة الذين ينفذون `resolveExternalAuthProfiles` أن يعلنوا
`contracts.externalAuthProviders`. أما Plugins التي لا تتضمن هذا الإعلان فما تزال تعمل
عبر fallback توافق قديم، لكن هذا fallback أبطأ
وسيُزال بعد نافذة الترحيل.

## مرجع `mediaUnderstandingProviderMetadata`

استخدم `mediaUnderstandingProviderMetadata` عندما يكون لدى مزود فهم الوسائط
نماذج افتراضية، أو أولوية fallback تلقائي للمصادقة، أو دعم أصلي للمستندات
تحتاجه مساعدات core العامة قبل تحميل وقت التشغيل. كما يجب التصريح عن المفاتيح في
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

يمكن أن يتضمن كل إدخال provider:

| الحقل                  | النوع                                | المعنى                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قدرات الوسائط التي يكشفها هذا الـ provider.                                 |
| `defaultModels`        | `Record<string, string>`            | القيم الافتراضية من القدرة إلى النموذج المستخدمة عندما لا يحدد التكوين نموذجًا.      |
| `autoPriority`         | `Record<string, number>`            | تُرتّب الأرقام الأقل أولًا من أجل fallback التلقائي للـ provider المعتمد على بيانات الاعتماد. |
| `nativeDocumentInputs` | `"pdf"[]`                           | المدخلات الأصلية للمستندات التي يدعمها الـ provider.                            |

## مرجع `channelConfigs`

استخدم `channelConfigs` عندما يحتاج Plugin قناة إلى بيانات وصفية رخيصة للتكوين قبل
تحميل وقت التشغيل.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL الخاص بـ Homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "اتصال Matrix homeserver",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

يمكن أن يتضمن كل إدخال قناة:

| الحقل         | النوع                     | المعنى                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | مخطط JSON لـ `channels.<id>`. وهو مطلوب لكل إدخال مُعلن لتكوين القناة.         |
| `uiHints`     | `Record<string, object>` | تسميات/عناصر نائبة/تلميحات حساسة اختيارية لـ UI لقسم تكوين تلك القناة.          |
| `label`       | `string`                 | تسمية القناة المدمجة في أسطح المنتقي والفحص عندما لا تكون بيانات وقت التشغيل الوصفية جاهزة. |
| `description` | `string`                 | وصف قصير للقناة لأسطح الفحص والكتالوج.                               |
| `preferOver`  | `string[]`               | معرّفات Plugins قديمة أو أقل أولوية يجب أن تتفوق عليها هذه القناة في أسطح الاختيار.    |

## مرجع `modelSupport`

استخدم `modelSupport` عندما ينبغي لـ OpenClaw أن يستنتج Plugin provider الخاص بك من
معرّفات نماذج مختصرة مثل `gpt-5.4` أو `claude-sonnet-4.6` قبل تحميل
وقت تشغيل Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

يطبق OpenClaw ترتيب الأولوية هذا:

- تستخدم مراجع `provider/model` الصريحة بيانات Manifest الوصفية المملوكة لـ `providers`
- تتغلب `modelPatterns` على `modelPrefixes`
- إذا طابق كل من Plugin غير مضمّن وPlugin مضمّن، فإن Plugin
  غير المضمّن يفوز
- يُتجاهل الغموض المتبقي إلى أن يحدد المستخدم أو التكوين provider

الحقول:

| الحقل           | النوع       | المعنى                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | بادئات تُطابق باستخدام `startsWith` مع معرّفات النماذج المختصرة.                 |
| `modelPatterns` | `string[]` | مصادر Regex تُطابق مع معرّفات النماذج المختصرة بعد إزالة لاحقة profile. |

إن مفاتيح القدرات القديمة ذات المستوى الأعلى مهجورة. استخدم `openclaw doctor --fix` من أجل
نقل `speechProviders` و`realtimeTranscriptionProviders` و
`realtimeVoiceProviders` و`mediaUnderstandingProviders` و
`imageGenerationProviders` و`videoGenerationProviders` و
`webFetchProviders` و`webSearchProviders` تحت `contracts`؛ فلم يعد
تحميل الـ Manifest العادي يتعامل مع تلك الحقول ذات المستوى الأعلى باعتبارها
ملكية للقدرات.

## Manifest مقابل package.json

يؤدي الملفان وظيفتين مختلفتين:

| الملف                   | استخدمه من أجل                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | الاكتشاف، والتحقق من التكوين، وبيانات خيارات المصادقة الوصفية، وhints الخاصة بـ UI التي يجب أن توجد قبل تشغيل كود Plugin                         |
| `package.json`         | بيانات npm الوصفية، وتثبيت التبعيات، وكتلة `openclaw` المستخدمة لنقاط الدخول، وتقييد التثبيت، والإعداد، أو بيانات الكتالوج الوصفية |

إذا لم تكن متأكدًا من موضع جزء من البيانات الوصفية، فاستخدم هذه القاعدة:

- إذا كان يجب على OpenClaw معرفته قبل تحميل كود Plugin، فضعه في `openclaw.plugin.json`
- وإذا كان متعلقًا بالتغليف أو ملفات الدخول أو سلوك تثبيت npm، فضعه في `package.json`

### حقول `package.json` التي تؤثر في الاكتشاف

توجد بعض بيانات Plugin الوصفية ما قبل وقت التشغيل عمدًا في `package.json` تحت
كتلة `openclaw` بدلًا من `openclaw.plugin.json`.

أمثلة مهمة:

| الحقل                                                             | المعنى                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | يعلن نقاط دخول Plugin الأصلية. ويجب أن تبقى داخل دليل حزمة Plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | يعلن نقاط دخول وقت التشغيل المبنية بـ JavaScript للحزم المثبتة. ويجب أن تبقى داخل دليل حزمة Plugin.                                                                 |
| `openclaw.setupEntry`                                             | نقطة دخول خفيفة خاصة بالإعداد فقط تُستخدم أثناء الإعداد الأولي، وبدء تشغيل القناة المؤجل، واكتشاف حالة القناة/SecretRef للقراءة فقط. ويجب أن تبقى داخل دليل حزمة Plugin. |
| `openclaw.runtimeSetupEntry`                                      | يعلن نقطة دخول الإعداد المبنية بـ JavaScript للحزم المثبتة. ويجب أن تبقى داخل دليل حزمة Plugin.                                                                |
| `openclaw.channel`                                                | بيانات وصفية رخيصة لكتالوج القنوات مثل التسميات، ومسارات الوثائق، والأسماء المستعارة، ونصوص الاختيار.                                                                                                 |
| `openclaw.channel.configuredState`                                | بيانات وصفية خفيفة لمدقق حالة التكوين تستطيع الإجابة عن سؤال "هل يوجد إعداد قائم يعتمد على env فقط بالفعل؟" من دون تحميل وقت تشغيل القناة الكامل.                                         |
| `openclaw.channel.persistedAuthState`                             | بيانات وصفية خفيفة لمدقق حالة المصادقة المحفوظة تستطيع الإجابة عن سؤال "هل تم تسجيل الدخول بالفعل إلى أي شيء؟" من دون تحميل وقت تشغيل القناة الكامل.                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | تلميحات التثبيت/التحديث للـ Plugins المضمّنة والمنشورة خارجيًا.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | مسار التثبيت المفضل عند توفر مصادر تثبيت متعددة.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | الحد الأدنى لإصدار مضيف OpenClaw المدعوم، باستخدام حد semver أدنى مثل `>=2026.3.22`.                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | سلسلة سلامة npm dist المتوقعة مثل `sha512-...`؛ وتتحقق تدفقات التثبيت والتحديث من العنصر الذي تم جلبه مقابلها.                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | يسمح بمسار استرداد ضيق لإعادة تثبيت Plugin مضمّن عندما يكون التكوين غير صالح.                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | يسمح لأسطح القنوات الخاصة بالإعداد فقط أن تُحمّل قبل Plugin القناة الكامل أثناء بدء التشغيل.                                                                                                 |

تحدد بيانات الـ Manifest الوصفية أي خيارات provider/channel/setup تظهر في
الإعداد الأولي قبل تحميل وقت التشغيل. وتخبر `package.json#openclaw.install`
الإعداد الأولي بكيفية جلب ذلك الـ Plugin أو تفعيله عندما يختار المستخدم أحد تلك
الخيارات. لا تنقل تلميحات التثبيت إلى `openclaw.plugin.json`.

يُفرض `openclaw.install.minHostVersion` أثناء التثبيت وتحميل سجل
Manifest. وتُرفض القيم غير الصالحة؛ أما القيم الأحدث لكن الصالحة فتتخطى
Plugin على المضيفين الأقدم.

يوجد بالفعل تثبيت إصدار npm الدقيق في `npmSpec`، على سبيل المثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. واقرن ذلك مع
`expectedIntegrity` عندما تريد أن تفشل تدفقات التحديث فشلًا مغلقًا إذا لم يعد
عنصر npm الذي جُلب يطابق الإصدار المثبّت. ولا يقدّم الإعداد الأولي التفاعلي إلا
خيارات تثبيت npm من بيانات كتالوج موثوقة عندما يكون `npmSpec` إصدارًا
دقيقًا وكانت `expectedIntegrity` موجودة؛ وإلا فإنه يعود إلى
مصدر محلي أو التخطي.

ينبغي لـ Plugins القنوات أن توفر `openclaw.setupEntry` عندما تحتاج الحالة أو قائمة القنوات
أو فحوصات SecretRef إلى تحديد الحسابات المكوّنة من دون تحميل
وقت التشغيل الكامل. ويجب أن تكشف نقطة الإعداد بيانات القناة الوصفية بالإضافة إلى
مهايئات آمنة للإعداد تخص التكوين والحالة والأسرار؛ مع إبقاء عملاء الشبكة ومستمعي Gateway و
أوقات تشغيل النقل في نقطة دخول الامتداد الرئيسية.

لا تتجاوز حقول نقطة دخول وقت التشغيل فحوصات حدود الحزم لحقول
نقطة دخول المصدر. فعلى سبيل المثال، لا يمكن لـ `openclaw.runtimeExtensions`
أن تجعل مسار `openclaw.extensions` الهارب قابلاً للتحميل.

إن `openclaw.install.allowInvalidConfigRecovery` ضيق عمدًا. فهو
لا يجعل التكوينات المعطوبة العشوائية قابلة للتثبيت. واليوم يسمح فقط لتدفقات التثبيت
بالتعافي من حالات فشل معينة قديمة أثناء ترقية Plugin مضمّن، مثل
غياب مسار Plugin المضمّن أو وجود إدخال `channels.<id>` قديم لذلك الـ Plugin المضمّن نفسه. وتظل أخطاء التكوين غير المرتبطة تمنع التثبيت وتوجّه المشغّلين
إلى `openclaw doctor --fix`.

إن `openclaw.channel.persistedAuthState` هو بيانات حزمة وصفية لوحدة فحص صغيرة:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

استخدمه عندما تحتاج تدفقات setup أو doctor أو configured-state إلى probe
مصادقة بسيط بنعم/لا قبل تحميل Plugin القناة الكامل. ويجب أن يكون التصدير المستهدف دالة صغيرة تقرأ الحالة المحفوظة فقط؛ ولا تمررها عبر barrel
وقت تشغيل القناة الكامل.

يتبع `openclaw.channel.configuredState` الشكل نفسه لفحوصات التكوين الرخيصة المعتمدة على env فقط:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

استخدمه عندما تستطيع القناة الإجابة عن حالة التكوين من env أو مدخلات صغيرة أخرى
غير وقت التشغيل. وإذا كان الفحص يحتاج إلى حل كامل للتكوين أو إلى
وقت تشغيل القناة الحقيقي، فأبقِ ذلك المنطق في hook
`config.hasConfiguredState` الخاص بالـ Plugin بدلًا من ذلك.

## أسبقية الاكتشاف (معرّفات Plugin المكررة)

يكتشف OpenClaw Plugins من عدة جذور (مضمّنة، وتثبيت عام، ومساحة العمل، ومسارات محددة صراحة في التكوين). وإذا اشترك اكتشافان في `id` نفسه، فيُحتفظ فقط بالـ Manifest ذي **الأسبقية الأعلى**؛ بينما تُسقط النسخ المكررة ذات الأسبقية الأدنى بدلًا من تحميلها بجواره.

ترتيب الأسبقية من الأعلى إلى الأدنى:

1. **المحدد في التكوين** — مسار مثبت صراحة في `plugins.entries.<id>`
2. **المضمّن** — Plugins المشحونة مع OpenClaw
3. **التثبيت العام** — Plugins المثبتة في جذر Plugins العام الخاص بـ OpenClaw
4. **مساحة العمل** — Plugins المكتشفة نسبةً إلى مساحة العمل الحالية

الآثار المترتبة:

- لن تحجب نسخة متشعبة أو قديمة من Plugin مضمّن موجودة في مساحة العمل البناء المضمّن.
- لتجاوز Plugin مضمّن محليًا فعليًا، ثبّته عبر `plugins.entries.<id>` حتى يفوز بالأسبقية بدلًا من الاعتماد على اكتشاف مساحة العمل.
- تُسجَّل حالات إسقاط النسخ المكررة حتى يتمكن Doctor وتشخيصات بدء التشغيل من الإشارة إلى النسخة المُسقطة.

## متطلبات مخطط JSON

- **يجب أن يرفق كل Plugin مخطط JSON**، حتى إن كان لا يقبل أي تكوين.
- يُقبل مخطط فارغ (مثل `{ "type": "object", "additionalProperties": false }`).
- تُتحقق المخططات عند قراءة/كتابة التكوين، لا أثناء وقت التشغيل.

## سلوك التحقق

- تُعد مفاتيح `channels.*` غير المعروفة **أخطاء**، ما لم يكن معرّف القناة معلنًا بواسطة
  Manifest Plugin.
- يجب أن تشير `plugins.entries.<id>` و`plugins.allow` و`plugins.deny` و`plugins.slots.*`
  إلى معرّفات Plugin **قابلة للاكتشاف**. وتُعد المعرفات غير المعروفة **أخطاء**.
- إذا كان Plugin مثبتًا لكن الـ Manifest أو المخطط الخاص به مكسورًا أو مفقودًا،
  يفشل التحقق ويبلغ Doctor عن خطأ Plugin.
- إذا كان تكوين Plugin موجودًا لكن Plugin **معطّل**، فسيُحتفظ بالتكوين وتظهر
  **تحذير** في Doctor + السجلات.

راجع [مرجع التكوين](/ar/gateway/configuration) للاطلاع على مخطط `plugins.*` الكامل.

## ملاحظات

- الـ Manifest **مطلوب للـ Plugins الأصلية في OpenClaw**، بما في ذلك التحميل من نظام الملفات المحلي.
- ما يزال وقت التشغيل يحمّل وحدة Plugin بشكل منفصل؛ فالـ Manifest مخصص فقط
  للاكتشاف + التحقق.
- تُحلّل Manifestات Plugins الأصلية باستخدام JSON5، لذلك تُقبل التعليقات والفواصل اللاحقة
  والمفاتيح غير المحاطة بعلامات اقتباس ما دامت القيمة النهائية كائنًا.
- لا يقرأ مُحمّل Manifest إلا حقول Manifest الموثقة. تجنب إضافة
  مفاتيح مخصصة ذات مستوى أعلى هنا.
- إن `providerAuthEnvVars` هو مسار البيانات الوصفية الرخيص لفحوصات المصادقة،
  والتحقق من env-marker، والأسطح المشابهة لمصادقة provider التي يجب ألا تشغّل
  وقت تشغيل Plugin فقط لفحص أسماء env.
- يتيح `providerAuthAliases` لمتغيرات provider إعادة استخدام
  متغيرات env الخاصة بالمصادقة، وملفات تعريف المصادقة، والمصادقة المدعومة بالتكوين، وخيار إعداد API-key الخاص بـ provider آخر
  من دون ترميز هذه العلاقة بشكل صلب في core.
- يتيح `providerEndpoints` لموفري الخدمة امتلاك بيانات وصفية بسيطة لمطابقة مضيف endpoint/baseUrl.
  استخدمه فقط لفئات endpoint التي يدعمها core بالفعل؛
  فالـ Plugin ما يزال يملك سلوك وقت التشغيل.
- إن `syntheticAuthRefs` هو مسار البيانات الوصفية الرخيص للـ hooks الاصطناعية الخاصة بالمصادقة والمملوكة للـ provider
  والتي يجب أن تكون مرئية لاكتشاف النماذج البارد قبل وجود
  سجل وقت التشغيل. ولا تُدرج إلا المراجع التي ينفذ فيها provider أو backend CLI في وقت التشغيل
  فعلًا `resolveSyntheticAuth`.
- إن `nonSecretAuthMarkers` هو مسار البيانات الوصفية الرخيص للعناصر النائبة
  الخاصة بـ API key والمملوكة للـ Plugin المضمّن، مثل علامات الاعتماد المحلية أو OAuth أو الاعتماد البيئي.
  ويتعامل core مع هذه القيم باعتبارها غير سرية لعرض المصادقة وتدقيق الأسرار من دون
  ترميز صلب للـ provider المالك.
- إن `channelEnvVars` هو مسار البيانات الوصفية الرخيص من أجل shell-env fallback، وطلبات الإعداد،
  والأسطح المماثلة للقنوات التي يجب ألا تشغّل وقت تشغيل Plugin
  فقط لفحص أسماء env. وأسماء env هي بيانات وصفية، وليست تفعيلًا
  بحد ذاتها: فما تزال الحالة، والتدقيق، والتحقق من تسليم Cron، وغيرها من الأسطح
  المخصصة للقراءة فقط تطبق ثقة Plugin وسياسة التفعيل الفعلية قبل أن
  تتعامل مع متغير env باعتباره قناة مكوّنة.
- إن `providerAuthChoices` هو مسار البيانات الوصفية الرخيص لمنتقيات خيارات المصادقة،
  وحل `--auth-choice`، وربط provider المفضل، وتسجيل إشارات CLI البسيطة في الإعداد الأولي قبل تحميل وقت تشغيل provider. أما بالنسبة إلى
  بيانات wizard الوصفية وقت التشغيل التي تتطلب كود provider، فراجع
  [hooks وقت تشغيل provider](/ar/plugins/architecture#provider-runtime-hooks).
- تُختار أنواع Plugins الحصرية عبر `plugins.slots.*`.
  - يُختار `kind: "memory"` بواسطة `plugins.slots.memory`.
  - يُختار `kind: "context-engine"` بواسطة `plugins.slots.contextEngine`
    (الافتراضي: `legacy` المضمّن).
- يمكن حذف `channels` و`providers` و`cliBackends` و`skills` عندما لا
  يحتاجها Plugin.
- إذا كان Plugin يعتمد على وحدات أصلية، فوثّق خطوات البناء وأي
  متطلبات قائمة سماح لمدير الحزم (مثل `allow-build-scripts` في pnpm
  - `pnpm rebuild <package>`).

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) — البدء مع Plugins
- [بنية Plugin](/ar/plugins/architecture) — البنية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع Plugin SDK
