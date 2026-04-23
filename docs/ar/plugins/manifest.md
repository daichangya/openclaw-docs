---
read_when:
    - أنت تبني Plugin لـ OpenClaw
    - تحتاج إلى شحن مخطط تكوين للـ Plugin أو تصحيح أخطاء التحقق من صحة الـ Plugin
summary: متطلبات بيان Plugin + مخطط JSON ‏(تحقق صارم من التكوين)
title: بيان Plugin
x-i18n:
    generated_at: "2026-04-23T14:01:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# بيان Plugin ‏(`openclaw.plugin.json`)

هذه الصفحة مخصصة لـ **بيان Plugin الأصلي في OpenClaw** فقط.

للتعرف على تخطيطات الحزم المتوافقة، راجع [حزم Plugin](/ar/plugins/bundles).

تستخدم تنسيقات الحزم المتوافقة ملفات بيان مختلفة:

- حزمة Codex: ‏`.codex-plugin/plugin.json`
- حزمة Claude: ‏`.claude-plugin/plugin.json` أو تخطيط مكونات Claude
  الافتراضي بدون بيان
- حزمة Cursor: ‏`.cursor-plugin/plugin.json`

يكتشف OpenClaw تخطيطات الحزم هذه تلقائيًا أيضًا، لكنها لا تخضع للتحقق
مقابل مخطط `openclaw.plugin.json` الموضح هنا.

بالنسبة إلى الحزم المتوافقة، يقرأ OpenClaw حاليًا بيانات تعريف الحزمة إضافةً إلى
جذور Skills المعلنة، وجذور أوامر Claude، والقيم الافتراضية في `settings.json` لحزمة Claude،
وقيم LSP الافتراضية لحزمة Claude، ومجموعات hooks المدعومة عندما يطابق التخطيط
توقعات وقت تشغيل OpenClaw.

**يجب** أن يشحن كل Plugin أصلي في OpenClaw ملف `openclaw.plugin.json` داخل
**جذر Plugin**. يستخدم OpenClaw هذا البيان للتحقق من التكوين
**من دون تنفيذ كود Plugin**. وتُعامل البيانات المفقودة أو غير الصالحة على أنها
أخطاء في Plugin وتمنع التحقق من التكوين.

راجع دليل نظام Plugin الكامل: [Plugins](/ar/tools/plugin).
وللاطلاع على نموذج القدرات الأصلي والإرشادات الحالية للتوافق الخارجي:
[نموذج القدرات](/ar/plugins/architecture#public-capability-model).

## ما الذي يفعله هذا الملف

يمثل `openclaw.plugin.json` بيانات التعريف التي يقرأها OpenClaw قبل أن يحمّل
كود Plugin الخاص بك.

استخدمه من أجل:

- هوية Plugin
- التحقق من التكوين
- بيانات تعريف المصادقة والإعداد الأولي التي يجب أن تكون متاحة من دون تشغيل وقت تشغيل Plugin
- تلميحات تنشيط منخفضة الكلفة يمكن لواجهات طبقة التحكم فحصها قبل تحميل وقت التشغيل
- واصفات إعداد منخفضة الكلفة يمكن لواجهات الإعداد/التهيئة الأولى فحصها قبل تحميل وقت التشغيل
- بيانات تعريف الأسماء المستعارة والتمكين التلقائي التي يجب حسمها قبل تحميل وقت تشغيل Plugin
- بيانات تعريف مختصرة لملكية عائلات النماذج التي يجب أن تفعّل Plugin تلقائيًا قبل تحميل وقت التشغيل
- لقطات ثابتة لملكية القدرات تُستخدم في أسلاك التوافق المجمعة وتغطية العقود
- بيانات تعريف منخفضة الكلفة لمشغل QA يمكن لمضيف `openclaw qa` المشترك فحصها
  قبل تحميل وقت تشغيل Plugin
- بيانات تعريف تكوين خاصة بالقنوات يجب دمجها في الكتالوج وواجهات التحقق
  من دون تحميل وقت التشغيل
- تلميحات واجهة مستخدم للتكوين

لا تستخدمه من أجل:

- تسجيل سلوك وقت التشغيل
- التصريح بنقاط دخول الكود
- بيانات تعريف تثبيت npm

هذه الأشياء تنتمي إلى كود Plugin الخاص بك و`package.json`.

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
  "description": "OpenRouter provider plugin",
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

| الحقل                                | مطلوب | النوع                             | المعنى                                                                                                                                                                                                                      |
| ------------------------------------ | ------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | نعم    | `string`                          | معرّف Plugin الأساسي. هذا هو المعرّف المستخدم في `plugins.entries.<id>`.                                                                                                                                                  |
| `configSchema`                       | نعم    | `object`                          | مخطط JSON مضمّن لتكوين هذا Plugin.                                                                                                                                                                                         |
| `enabledByDefault`                   | لا     | `true`                            | يحدد أن Plugin المضمّن مفعّل افتراضيًا. احذفه، أو عيّن أي قيمة غير `true`، لترك Plugin معطّلًا افتراضيًا.                                                                                                             |
| `legacyPluginIds`                    | لا     | `string[]`                        | معرّفات قديمة تتم تسويتها إلى معرّف Plugin الأساسي هذا.                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | لا     | `string[]`                        | معرّفات Providers التي يجب أن تفعّل هذا Plugin تلقائيًا عندما تشير إليها المصادقة أو التكوين أو مراجع النماذج.                                                                                                        |
| `kind`                               | لا     | `"memory"` \| `"context-engine"`  | يصرّح بنوع Plugin حصري يُستخدم بواسطة `plugins.slots.*`.                                                                                                                                                                  |
| `channels`                           | لا     | `string[]`                        | معرّفات القنوات التي يملكها هذا Plugin. تُستخدم للاكتشاف والتحقق من التكوين.                                                                                                                                              |
| `providers`                          | لا     | `string[]`                        | معرّفات Providers التي يملكها هذا Plugin.                                                                                                                                                                                   |
| `modelSupport`                       | لا     | `object`                          | بيانات تعريف مختصرة مملوكة للبيان لعائلات النماذج وتُستخدم لتحميل Plugin تلقائيًا قبل وقت التشغيل.                                                                                                                     |
| `providerEndpoints`                  | لا     | `object[]`                        | بيانات تعريف endpoint مملوكة للبيان بشأن `host`/`baseUrl` لمسارات Providers التي يجب على النواة تصنيفها قبل تحميل وقت تشغيل Provider.                                                                                 |
| `cliBackends`                        | لا     | `string[]`                        | معرّفات واجهات CLI الخلفية للاستدلال التي يملكها هذا Plugin. تُستخدم للتنشيط التلقائي عند بدء التشغيل من مراجع التكوين الصريحة.                                                                                      |
| `syntheticAuthRefs`                  | لا     | `string[]`                        | مراجع Provider أو CLI backend التي يجب فحص hook المصادقة الاصطناعية المملوك للـ Plugin لها أثناء اكتشاف النماذج البارد قبل تحميل وقت التشغيل.                                                                       |
| `nonSecretAuthMarkers`               | لا     | `string[]`                        | قيم placeholder لمفاتيح API مملوكة لـ Plugin مضمّن وتمثل حالة اعتماد محلية أو OAuth أو اعتمادًا محيطيًا غير سري.                                                                                                      |
| `commandAliases`                     | لا     | `object[]`                        | أسماء الأوامر التي يملكها هذا Plugin ويجب أن تنتج تشخيصات واعية بالـ Plugin للتكوين وCLI قبل تحميل وقت التشغيل.                                                                                                        |
| `providerAuthEnvVars`                | لا     | `Record<string, string[]>`        | بيانات تعريف منخفضة الكلفة لمتغيرات بيئة مصادقة Provider يمكن لـ OpenClaw فحصها من دون تحميل كود Plugin.                                                                                                              |
| `providerAuthAliases`                | لا     | `Record<string, string>`          | معرّفات Providers التي يجب أن تعيد استخدام معرّف Provider آخر للبحث عن المصادقة، مثل Provider برمجي يشارك مفتاح API وملفات تعريف المصادقة مع Provider الأساسي.                                                     |
| `channelEnvVars`                     | لا     | `Record<string, string[]>`        | بيانات تعريف منخفضة الكلفة لمتغيرات بيئة القناة يمكن لـ OpenClaw فحصها من دون تحميل كود Plugin. استخدم هذا لإعداد القنوات أو أسطح المصادقة المعتمدة على env التي يجب أن تراها مساعدات بدء التشغيل/التكوين العامة. |
| `providerAuthChoices`                | لا     | `object[]`                        | بيانات تعريف منخفضة الكلفة لاختيارات المصادقة لمنتقيات الإعداد الأولي، وحل Providers المفضلة، وربط إشارات CLI البسيطة.                                                                                                |
| `activation`                         | لا     | `object`                          | تلميحات تنشيط منخفضة الكلفة للتحميل المرتبط بالـ Provider أو الأمر أو القناة أو المسار أو القدرة. بيانات تعريف فقط؛ أما وقت تشغيل Plugin فلا يزال يملك السلوك الفعلي.                                                  |
| `setup`                              | لا     | `object`                          | واصفات إعداد/تهيئة أولية منخفضة الكلفة يمكن لواجهات الاكتشاف والإعداد فحصها من دون تحميل وقت تشغيل Plugin.                                                                                                            |
| `qaRunners`                          | لا     | `object[]`                        | واصفات منخفضة الكلفة لمشغلات QA يستخدمها مضيف `openclaw qa` المشترك قبل تحميل وقت تشغيل Plugin.                                                                                                                        |
| `contracts`                          | لا     | `object`                          | لقطة ثابتة للقدرات المجمعة للمصادقة الخارجية، والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وجلب الويب، والبحث في الويب، وملكية الأدوات.                  |
| `mediaUnderstandingProviderMetadata` | لا     | `Record<string, object>`          | إعدادات افتراضية منخفضة الكلفة لفهم الوسائط لمعرّفات Providers المصرّح بها في `contracts.mediaUnderstandingProviders`.                                                                                                |
| `channelConfigs`                     | لا     | `Record<string, object>`          | بيانات تعريف تكوين قناة مملوكة للبيان تُدمج في أسطح الاكتشاف والتحقق قبل تحميل وقت التشغيل.                                                                                                                            |
| `skills`                             | لا     | `string[]`                        | أدلة Skills المطلوب تحميلها نسبةً إلى جذر Plugin.                                                                                                                                                                         |
| `name`                               | لا     | `string`                          | اسم Plugin قابل للقراءة البشرية.                                                                                                                                                                                           |
| `description`                        | لا     | `string`                          | ملخص قصير يُعرض في واجهات Plugin.                                                                                                                                                                                           |
| `version`                            | لا     | `string`                          | إصدار Plugin لأغراض معلوماتية.                                                                                                                                                                                             |
| `uiHints`                            | لا     | `Record<string, object>`          | تسميات واجهة المستخدم، وplaceholder، وتلميحات الحساسية لحقول التكوين.                                                                                                                                                     |

## مرجع `providerAuthChoices`

يصف كل إدخال في `providerAuthChoices` اختيار إعداد أولي أو مصادقة واحدًا.
يقرأ OpenClaw هذا قبل تحميل وقت تشغيل Provider.

| الحقل                 | مطلوب | النوع                                            | المعنى                                                                                              |
| --------------------- | ------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `provider`            | نعم    | `string`                                         | معرّف Provider الذي ينتمي إليه هذا الاختيار.                                                        |
| `method`              | نعم    | `string`                                         | معرّف طريقة المصادقة التي سيتم التوجيه إليها.                                                       |
| `choiceId`            | نعم    | `string`                                         | معرّف ثابت لاختيار المصادقة يُستخدم في تدفقات الإعداد الأولي وCLI.                                  |
| `choiceLabel`         | لا     | `string`                                         | تسمية موجّهة للمستخدم. إذا حُذفت، يعود OpenClaw إلى `choiceId`.                                     |
| `choiceHint`          | لا     | `string`                                         | نص مساعد قصير للمنتقي.                                                                              |
| `assistantPriority`   | لا     | `number`                                         | تُرتّب القيم الأقل أولًا في المنتقيات التفاعلية التي يقودها المساعد.                               |
| `assistantVisibility` | لا     | `"visible"` \| `"manual-only"`                   | يُخفي الاختيار من منتقيات المساعد مع الاستمرار في السماح باختياره يدويًا عبر CLI.                  |
| `deprecatedChoiceIds` | لا     | `string[]`                                       | معرّفات اختيارات قديمة يجب أن تعيد توجيه المستخدمين إلى هذا الاختيار البديل.                        |
| `groupId`             | لا     | `string`                                         | معرّف مجموعة اختياري لتجميع الاختيارات ذات الصلة.                                                   |
| `groupLabel`          | لا     | `string`                                         | تسمية موجّهة للمستخدم لتلك المجموعة.                                                                |
| `groupHint`           | لا     | `string`                                         | نص مساعد قصير للمجموعة.                                                                             |
| `optionKey`           | لا     | `string`                                         | مفتاح خيار داخلي لتدفقات المصادقة البسيطة ذات الإشارة الواحدة.                                      |
| `cliFlag`             | لا     | `string`                                         | اسم إشارة CLI، مثل `--openrouter-api-key`.                                                          |
| `cliOption`           | لا     | `string`                                         | الشكل الكامل لخيار CLI، مثل `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | لا     | `string`                                         | الوصف المستخدم في مساعدة CLI.                                                                        |
| `onboardingScopes`    | لا     | `Array<"text-inference" \| "image-generation">`  | أسطح الإعداد الأولي التي يجب أن يظهر فيها هذا الاختيار. إذا حُذفت، فالقيمة الافتراضية هي `["text-inference"]`. |

## مرجع `commandAliases`

استخدم `commandAliases` عندما يملك Plugin اسم أمر وقت تشغيل قد يقوم المستخدمون
عن طريق الخطأ بوضعه في `plugins.allow` أو محاولة تشغيله كأمر CLI جذري. يستخدم OpenClaw
هذه البيانات التعريفية للتشخيصات من دون استيراد كود وقت تشغيل Plugin.

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

| الحقل        | مطلوب | النوع             | المعنى                                                                  |
| ------------ | ------ | ----------------- | ----------------------------------------------------------------------- |
| `name`       | نعم    | `string`          | اسم الأمر الذي ينتمي إلى هذا Plugin.                                    |
| `kind`       | لا     | `"runtime-slash"` | يحدد أن الاسم المستعار هو أمر slash للدردشة وليس أمر CLI جذريًا.        |
| `cliCommand` | لا     | `string`          | أمر CLI جذري ذو صلة لاقتراحه في عمليات CLI، إذا كان موجودًا.            |

## مرجع `activation`

استخدم `activation` عندما يستطيع Plugin التصريح بكلفة منخفضة عن أحداث طبقة التحكم
التي يجب أن تفعّله لاحقًا.

## مرجع `qaRunners`

استخدم `qaRunners` عندما يساهم Plugin بمشغّل نقل واحد أو أكثر تحت الجذر
المشترك `openclaw qa`. حافظ على هذه البيانات التعريفية منخفضة الكلفة وثابتة؛ إذ إن وقت تشغيل Plugin
لا يزال يملك تسجيل CLI الفعلي عبر سطح
`runtime-api.ts` خفيف الوزن الذي يصدّر `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| الحقل         | مطلوب | النوع     | المعنى                                                            |
| ------------- | ------ | --------- | ----------------------------------------------------------------- |
| `commandName` | نعم    | `string`  | الأمر الفرعي المركّب تحت `openclaw qa`، مثل `matrix`.            |
| `description` | لا     | `string`  | نص مساعدة بديل يُستخدم عندما يحتاج المضيف المشترك إلى أمر وهمي.  |

هذه الكتلة مخصصة للبيانات التعريفية فقط. فهي لا تسجل سلوك وقت التشغيل، ولا
تحل محل `register(...)` أو `setupEntry` أو نقاط دخول وقت التشغيل/Plugin الأخرى.
ويستخدمها المستهلكون الحاليون كتلميح تضييق قبل تحميل أوسع للـ Plugin، لذلك فإن
غياب بيانات تعريف `activation` يكلّف عادةً الأداء فقط؛ ولا ينبغي أن
يغيّر الصحة ما دامت آليات الرجوع القديمة لملكية البيان لا تزال موجودة.

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

| الحقل            | مطلوب | النوع                                                 | المعنى                                                        |
| ---------------- | ------ | ---------------------------------------------------- | ------------------------------------------------------------- |
| `onProviders`    | لا     | `string[]`                                           | معرّفات Providers التي يجب أن تفعّل هذا Plugin عند طلبها.     |
| `onCommands`     | لا     | `string[]`                                           | معرّفات الأوامر التي يجب أن تفعّل هذا Plugin.                 |
| `onChannels`     | لا     | `string[]`                                           | معرّفات القنوات التي يجب أن تفعّل هذا Plugin.                 |
| `onRoutes`       | لا     | `string[]`                                           | أنواع المسارات التي يجب أن تفعّل هذا Plugin.                 |
| `onCapabilities` | لا     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | تلميحات قدرات عامة تُستخدم في تخطيط التنشيط في طبقة التحكم. |

المستهلكون الفعليون الحاليون:

- يعود تخطيط CLI المحفَّز بالأوامر إلى
  `commandAliases[].cliCommand` أو `commandAliases[].name`
  القديمين
- يعود تخطيط الإعداد/القنوات المحفَّز بالقنوات إلى ملكية
  `channels[]` القديمة عندما تغيب بيانات تعريف تنشيط القناة الصريحة
- يعود تخطيط الإعداد/وقت التشغيل المحفَّز بالـ Provider إلى
  ملكية `providers[]` القديمة وملكية `cliBackends[]` ذات المستوى الأعلى
  عندما تغيب بيانات تعريف تنشيط Provider الصريحة

## مرجع `setup`

استخدم `setup` عندما تحتاج أسطح الإعداد والتهيئة الأولية إلى بيانات تعريف منخفضة الكلفة
مملوكة للـ Plugin قبل تحميل وقت التشغيل.

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

يبقى `cliBackends` في المستوى الأعلى صالحًا ويستمر في وصف
واجهات CLI الخلفية للاستدلال. أما `setup.cliBackends` فهو سطح الواصفات الخاص بالإعداد
لتدفقات طبقة التحكم/الإعداد التي يجب أن تبقى بيانات تعريف فقط.

عند وجودهما، يكون `setup.providers` و`setup.cliBackends` هما
سطح البحث المفضل أولًا بالواصفات لاكتشاف الإعداد. وإذا كان الواصف يضيّق فقط
Plugin المرشح وكان الإعداد لا يزال يحتاج إلى hooks أغنى لوقت الإعداد،
فعَيّن `requiresRuntime: true` وأبقِ `setup-api` في مكانه كمسار تنفيذ
بديل.

ولأن بحث الإعداد قد ينفذ كود `setup-api` مملوكًا للـ Plugin، يجب أن
تبقى القيم المطبعّة في `setup.providers[].id` و`setup.cliBackends[]` فريدة عبر
Plugins المكتشفة. وتفشل الملكية الملتبسة بإغلاق صارم بدلًا من اختيار
فائز حسب ترتيب الاكتشاف.

### مرجع `setup.providers`

| الحقل         | مطلوب | النوع       | المعنى                                                                          |
| ------------- | ------ | ---------- | -------------------------------------------------------------------------------- |
| `id`          | نعم    | `string`   | معرّف Provider المعروض أثناء الإعداد أو التهيئة الأولية. حافظ على فرادة المعرّفات المطبعّة عالميًا. |
| `authMethods` | لا     | `string[]` | معرّفات طرق الإعداد/المصادقة التي يدعمها هذا Provider من دون تحميل وقت التشغيل الكامل. |
| `envVars`     | لا     | `string[]` | متغيرات البيئة التي يمكن لأسطح الإعداد/الحالة العامة التحقق منها قبل تحميل وقت تشغيل Plugin. |

### حقول `setup`

| الحقل              | مطلوب | النوع       | المعنى                                                                                          |
| ------------------ | ------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | لا     | `object[]` | واصفات إعداد Provider المعروضة أثناء الإعداد والتهيئة الأولية.                                  |
| `cliBackends`      | لا     | `string[]` | معرّفات الواجهات الخلفية وقت الإعداد المستخدمة للبحث أولًا بالواصفات. حافظ على فرادة المعرّفات المطبعّة عالميًا. |
| `configMigrations` | لا     | `string[]` | معرّفات ترحيل التكوين التي يملكها سطح الإعداد الخاص بهذا Plugin.                                |
| `requiresRuntime`  | لا     | `boolean`  | ما إذا كان الإعداد لا يزال يحتاج إلى تنفيذ `setup-api` بعد البحث بالواصفات.                     |

## مرجع `uiHints`

يمثل `uiHints` خريطة من أسماء حقول التكوين إلى تلميحات عرض صغيرة.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

يمكن أن يتضمن كل تلميح حقل:

| الحقل         | النوع      | المعنى                                  |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | تسمية الحقل الموجّهة للمستخدم.          |
| `help`        | `string`   | نص مساعد قصير.                          |
| `tags`        | `string[]` | وسوم واجهة مستخدم اختيارية.             |
| `advanced`    | `boolean`  | يحدد الحقل على أنه متقدم.               |
| `sensitive`   | `boolean`  | يحدد الحقل على أنه سري أو حساس.         |
| `placeholder` | `string`   | نص placeholder لمدخلات النماذج.         |

## مرجع `contracts`

استخدم `contracts` فقط لبيانات تعريف ملكية القدرات الثابتة التي يمكن لـ OpenClaw
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

| الحقل                            | النوع      | المعنى                                                             |
| -------------------------------- | ---------- | ------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | معرّفات وقت التشغيل المضمّنة التي يمكن لـ Plugin مضمّن تسجيل factories لها. |
| `externalAuthProviders`          | `string[]` | معرّفات Providers التي يملك هذا Plugin hook ملف تعريف المصادقة الخارجية الخاص بها. |
| `speechProviders`                | `string[]` | معرّفات Providers للكلام التي يملكها هذا Plugin.                   |
| `realtimeTranscriptionProviders` | `string[]` | معرّفات Providers للنسخ الفوري التي يملكها هذا Plugin.             |
| `realtimeVoiceProviders`         | `string[]` | معرّفات Providers للصوت الفوري التي يملكها هذا Plugin.             |
| `mediaUnderstandingProviders`    | `string[]` | معرّفات Providers لفهم الوسائط التي يملكها هذا Plugin.             |
| `imageGenerationProviders`       | `string[]` | معرّفات Providers لتوليد الصور التي يملكها هذا Plugin.            |
| `videoGenerationProviders`       | `string[]` | معرّفات Providers لتوليد الفيديو التي يملكها هذا Plugin.          |
| `webFetchProviders`              | `string[]` | معرّفات Providers لجلب الويب التي يملكها هذا Plugin.              |
| `webSearchProviders`             | `string[]` | معرّفات Providers للبحث في الويب التي يملكها هذا Plugin.          |
| `tools`                          | `string[]` | أسماء أدوات الوكيل التي يملكها هذا Plugin لفحوصات العقود المجمعة. |

يجب على Plugins الخاصة بالـ Providers التي تنفذ `resolveExternalAuthProfiles` التصريح بـ
`contracts.externalAuthProviders`. أما Plugins التي لا تتضمن هذا التصريح فما تزال تعمل
عبر آلية توافق قديمة متراجعة، لكن هذه الآلية أبطأ
وسيتم إزالتها بعد انتهاء نافذة الترحيل.

## مرجع `mediaUnderstandingProviderMetadata`

استخدم `mediaUnderstandingProviderMetadata` عندما يكون لدى Provider لفهم الوسائط
نماذج افتراضية، أو أولوية رجوع تلقائي للمصادقة، أو دعم أصلي للمستندات
تحتاج إليه مساعدات النواة العامة قبل تحميل وقت التشغيل. ويجب أيضًا التصريح عن المفاتيح في
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

يمكن أن يتضمن كل إدخال Provider:

| الحقل                  | النوع                                | المعنى                                                                |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قدرات الوسائط التي يوفّرها هذا Provider.                              |
| `defaultModels`        | `Record<string, string>`            | القيم الافتراضية من القدرة إلى النموذج المستخدمة عندما لا يحدد التكوين نموذجًا. |
| `autoPriority`         | `Record<string, number>`            | تُرتَّب الأرقام الأقل أولًا في الرجوع التلقائي إلى Provider المستند إلى بيانات الاعتماد. |
| `nativeDocumentInputs` | `"pdf"[]`                           | مدخلات المستندات الأصلية التي يدعمها Provider.                        |

## مرجع `channelConfigs`

استخدم `channelConfigs` عندما يحتاج Plugin قناة إلى بيانات تعريف تكوين منخفضة الكلفة قبل
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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

يمكن أن يتضمن كل إدخال قناة:

| الحقل         | النوع                    | المعنى                                                                             |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `schema`      | `object`                 | مخطط JSON لـ `channels.<id>`. وهو مطلوب لكل إدخال تكوين قناة مُصرّح به.         |
| `uiHints`     | `Record<string, object>` | تسميات/placeholder/تلميحات حساسية اختيارية لواجهة المستخدم لهذا القسم من تكوين القناة. |
| `label`       | `string`                 | تسمية القناة المدمجة في واجهات المنتقي والفحص عندما لا تكون بيانات تعريف وقت التشغيل جاهزة. |
| `description` | `string`                 | وصف قصير للقناة لواجهات الفحص والكتالوج.                                          |
| `preferOver`  | `string[]`               | معرّفات Plugins قديمة أو أقل أولوية يجب أن تتقدم عليها هذه القناة في واجهات الاختيار. |

## مرجع `modelSupport`

استخدم `modelSupport` عندما يجب على OpenClaw استنتاج Plugin الـ Provider الخاص بك من
معرّفات نماذج مختصرة مثل `gpt-5.4` أو `claude-sonnet-4.6` قبل وقت تشغيل Plugin
التحميل.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

يطبّق OpenClaw أولوية الترتيب التالية:

- تستخدم مراجع `provider/model` الصريحة بيانات تعريف البيان `providers` المالكة
- تتغلب `modelPatterns` على `modelPrefixes`
- إذا طابق كل من Plugin غير مضمّن وPlugin مضمّن، يفوز Plugin
  غير المضمّن
- يتم تجاهل أي غموض متبقٍ حتى يحدد المستخدم أو التكوين Provider

الحقول:

| الحقل           | النوع      | المعنى                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | بادئات تتم مطابقتها باستخدام `startsWith` مع معرّفات النماذج المختصرة.   |
| `modelPatterns` | `string[]` | مصادر Regex تتم مطابقتها مع معرّفات النماذج المختصرة بعد إزالة لاحقة الملف التعريفي. |

مفاتيح القدرات القديمة في المستوى الأعلى متقادمة. استخدم `openclaw doctor --fix` من أجل
نقل `speechProviders` و`realtimeTranscriptionProviders`،
و`realtimeVoiceProviders` و`mediaUnderstandingProviders`،
و`imageGenerationProviders` و`videoGenerationProviders`،
و`webFetchProviders` و`webSearchProviders` إلى `contracts`؛ إذ إن
تحميل البيان العادي لم يعد يعامل تلك الحقول ذات المستوى الأعلى على أنها
ملكية للقدرات.

## البيان مقابل package.json

يخدم الملفان أغراضًا مختلفة:

| الملف                  | استخدمه من أجل                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | الاكتشاف، والتحقق من التكوين، وبيانات تعريف اختيارات المصادقة، وتلميحات واجهة المستخدم التي يجب أن تكون موجودة قبل تشغيل كود Plugin |
| `package.json`         | بيانات تعريف npm، وتثبيت التبعيات، وكتلة `openclaw` المستخدمة لنقاط الدخول، أو تقييد التثبيت، أو الإعداد، أو بيانات تعريف الكتالوج |

إذا لم تكن متأكدًا من موضع قطعة من البيانات التعريفية، فاستخدم هذه القاعدة:

- إذا كان يجب على OpenClaw معرفتها قبل تحميل كود Plugin، فضعها في `openclaw.plugin.json`
- إذا كانت تتعلق بالتغليف، أو ملفات الدخول، أو سلوك تثبيت npm، فضعها في `package.json`

### حقول `package.json` التي تؤثر في الاكتشاف

بعض بيانات تعريف Plugin قبل وقت التشغيل تعيش عمدًا في `package.json` ضمن
كتلة `openclaw` بدلًا من `openclaw.plugin.json`.

أمثلة مهمة:

| الحقل                                                             | المعنى                                                                                                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | يصرّح بنقاط دخول Plugin الأصلية. يجب أن تبقى داخل دليل حزمة Plugin.                                                                                                             |
| `openclaw.runtimeExtensions`                                      | يصرّح بنقاط دخول وقت التشغيل المبنية بـ JavaScript للحزم المثبتة. يجب أن تبقى داخل دليل حزمة Plugin.                                                                             |
| `openclaw.setupEntry`                                             | نقطة دخول خفيفة مخصصة للإعداد فقط تُستخدم أثناء التهيئة الأولية، وبدء تشغيل القنوات المؤجل، واكتشاف حالة القناة/SecretRef للقراءة فقط. يجب أن تبقى داخل دليل حزمة Plugin.          |
| `openclaw.runtimeSetupEntry`                                      | يصرّح بنقطة دخول إعداد JavaScript المبنية للحزم المثبتة. يجب أن تبقى داخل دليل حزمة Plugin.                                                                                      |
| `openclaw.channel`                                                | بيانات تعريف منخفضة الكلفة لكتالوج القنوات مثل التسميات، ومسارات الوثائق، والأسماء المستعارة، ونصوص الاختيار.                                                                   |
| `openclaw.channel.configuredState`                                | بيانات تعريف خفيفة لفاحص الحالة المكوَّنة يمكنها الإجابة عن سؤال "هل يوجد إعداد يعتمد على env فقط بالفعل؟" من دون تحميل وقت تشغيل القناة الكامل.                                   |
| `openclaw.channel.persistedAuthState`                             | بيانات تعريف خفيفة لفاحص المصادقة المخزنة يمكنها الإجابة عن سؤال "هل تم تسجيل الدخول إلى أي شيء بالفعل؟" من دون تحميل وقت تشغيل القناة الكامل.                                     |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | تلميحات التثبيت/التحديث للـ Plugins المضمّنة والمنشورة خارجيًا.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | مسار التثبيت المفضّل عندما تتوفر عدة مصادر للتثبيت.                                                                                                                               |
| `openclaw.install.minHostVersion`                                 | الحد الأدنى لإصدار مضيف OpenClaw المدعوم، باستخدام حد semver أدنى مثل `>=2026.3.22`.                                                                                             |
| `openclaw.install.expectedIntegrity`                              | سلسلة integrity المتوقعة من npm dist مثل `sha512-...`؛ تتحقق تدفقات التثبيت والتحديث من الأثر الذي تم جلبه مقارنةً بها.                                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | يسمح بمسار استرداد ضيق لإعادة تثبيت Plugin مضمّن عندما يكون التكوين غير صالح.                                                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | يتيح لواجهات القنوات المخصصة للإعداد فقط أن تُحمَّل قبل Plugin القناة الكامل أثناء بدء التشغيل.                                                                                   |

تحدد بيانات تعريف البيان خيارات Provider/القناة/الإعداد التي تظهر في
التهيئة الأولية قبل تحميل وقت التشغيل. ويخبر `package.json#openclaw.install`
التهيئة الأولية بكيفية جلب ذلك Plugin أو تمكينه عندما يختار المستخدم أحد تلك
الخيارات. لا تنقل تلميحات التثبيت إلى `openclaw.plugin.json`.

يُفرض `openclaw.install.minHostVersion` أثناء التثبيت وتحميل
سجل البيان. تُرفض القيم غير الصالحة؛ أما القيم الأحدث ولكن الصالحة فتتجاوز
Plugin على المضيفين الأقدم.

توجد آلية التثبيت الدقيق لإصدار npm بالفعل في `npmSpec`، مثل
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. واقرن ذلك مع
`expectedIntegrity` عندما تريد أن تفشل تدفقات التحديث بإغلاق صارم إذا لم يعد
أثر npm الذي تم جلبه يطابق الإصدار المثبّت. تعرض التهيئة الأولية التفاعلية
مواصفات npm الخاصة بالسجل الموثوق، بما في ذلك أسماء الحزم المجردة ووسوم dist-tags.
وعندما يكون `expectedIntegrity` موجودًا، تفرض تدفقات التثبيت/التحديث ذلك؛ وعندما
يُحذف، يُسجَّل حل السجل من دون تثبيت integrity.

يجب على Plugins القنوات توفير `openclaw.setupEntry` عندما تحتاج عمليات الحالة،
أو قائمة القنوات، أو فحص SecretRef إلى تحديد الحسابات المكوَّنة من دون تحميل وقت التشغيل
الكامل. ينبغي أن تكشف نقطة دخول الإعداد عن بيانات تعريف القناة، إضافةً إلى
مهايئات آمنة للإعداد خاصة بالتكوين والحالة والأسرار؛ وأبقِ عملاء الشبكة،
ومستمعي Gateway، وأوقات تشغيل النقل في نقطة دخول الامتداد الرئيسية.

لا تتجاوز حقول نقاط دخول وقت التشغيل فحوصات حدود الحزمة الخاصة بحقوق
نقطة دخول المصدر. على سبيل المثال، لا يمكن لـ `openclaw.runtimeExtensions` أن تجعل
مسار `openclaw.extensions` الهارب قابلًا للتحميل.

إن `openclaw.install.allowInvalidConfigRecovery` ضيق عمدًا. فهو
لا يجعل التكوينات المعطلة العشوائية قابلة للتثبيت. واليوم لا يسمح إلا
لتدفقات التثبيت بالاسترداد من حالات فشل ترقية محددة قديمة لPlugin مضمّن، مثل
مسار Plugin مضمّن مفقود أو إدخال `channels.<id>` قديم لPlugin المضمّن نفسه. أما
أخطاء التكوين غير المرتبطة فما تزال تمنع التثبيت وتوجه المشغلين
إلى `openclaw doctor --fix`.

يمثل `openclaw.channel.persistedAuthState` بيانات تعريف حزمة لوحدة فحص
صغيرة:

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

استخدمه عندما تحتاج تدفقات الإعداد، أو doctor، أو الحالة المكوَّنة إلى
فحص مصادقة منخفض الكلفة بنعم/لا قبل تحميل Plugin القناة الكامل. يجب أن يكون
التصدير الهدف دالة صغيرة تقرأ الحالة المخزنة فقط؛ ولا تمررها عبر barrel
وقت تشغيل القناة الكامل.

ويتبع `openclaw.channel.configuredState` الشكل نفسه لفحوصات الحالة
المكوَّنة الرخيصة المعتمدة على env فقط:

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

استخدمه عندما تستطيع قناة ما الإجابة عن الحالة المكوَّنة من env أو مدخلات صغيرة أخرى
غير وقت التشغيل. وإذا كان الفحص يحتاج إلى حل التكوين الكامل أو إلى وقت تشغيل
القناة الحقيقي، فأبقِ ذلك المنطق في hook ‏`config.hasConfiguredState`
الخاص بالـ Plugin بدلًا من ذلك.

## أولوية الاكتشاف (معرّفات Plugin المكررة)

يكتشف OpenClaw Plugins من عدة جذور (مضمّنة، وتثبيت عام، ومساحة عمل، ومسارات صريحة محددة في التكوين). إذا اشتركت عمليتا اكتشاف في المعرّف `id` نفسه، فسيُحتفَظ فقط بالبيان ذي **الأولوية الأعلى**؛ أما النسخ المكررة ذات الأولوية الأدنى فسيتم إسقاطها بدلًا من تحميلها إلى جانبه.

الأولوية، من الأعلى إلى الأدنى:

1. **محددة في التكوين** — مسار مثبت صراحة في `plugins.entries.<id>`
2. **مضمّنة** — Plugins المشحونة مع OpenClaw
3. **تثبيت عام** — Plugins المثبتة في جذر Plugins العام الخاص بـ OpenClaw
4. **مساحة العمل** — Plugins المكتشفة نسبةً إلى مساحة العمل الحالية

الآثار المترتبة:

- لن تطغى نسخة متفرعة أو قديمة من Plugin مضمّن موجودة في مساحة العمل على البنية المضمّنة.
- لكي تتجاوز فعلًا Plugin مضمّنًا بآخر محلي، ثبّته عبر `plugins.entries.<id>` حتى يفوز بالأولوية بدلًا من الاعتماد على اكتشاف مساحة العمل.
- يُسجل إسقاط النسخ المكررة حتى تتمكن تشخيصات Doctor وبدء التشغيل من الإشارة إلى النسخة التي تم تجاهلها.

## متطلبات مخطط JSON

- **يجب على كل Plugin أن يشحن مخطط JSON**، حتى إذا كان لا يقبل أي تكوين.
- يُقبل مخطط فارغ (مثلًا، `{ "type": "object", "additionalProperties": false }`).
- يتم التحقق من المخططات وقت قراءة/كتابة التكوين، وليس وقت التشغيل.

## سلوك التحقق

- تُعد مفاتيح `channels.*` غير المعروفة **أخطاء**، ما لم يكن معرّف القناة مصرّحًا به
  بواسطة بيان Plugin.
- يجب أن تشير `plugins.entries.<id>` و`plugins.allow` و`plugins.deny` و`plugins.slots.*`
  إلى معرّفات Plugin **قابلة للاكتشاف**. وتُعد المعرّفات غير المعروفة **أخطاء**.
- إذا كان Plugin مثبتًا لكن لديه بيان أو مخطط معطّل أو مفقود،
  يفشل التحقق ويبلّغ Doctor عن خطأ Plugin.
- إذا كان تكوين Plugin موجودًا لكن Plugin **معطّل**، فسيُحتفَظ بالتكوين وتظهر
  **تحذير** في Doctor + السجلات.

راجع [مرجع التكوين](/ar/gateway/configuration) للحصول على مخطط `plugins.*` الكامل.

## ملاحظات

- البيان **مطلوب للـ Plugins الأصلية في OpenClaw**، بما في ذلك التحميلات من نظام الملفات المحلي.
- لا يزال وقت التشغيل يحمّل وحدة Plugin بشكل منفصل؛ والبيان مخصص فقط
  للاكتشاف + التحقق.
- تُحلَّل البيانات الأصلية باستخدام JSON5، لذلك تُقبل التعليقات، والفواصل اللاحقة،
  والمفاتيح غير المقتبسة ما دامت القيمة النهائية لا تزال كائنًا.
- لا يقرأ محمّل البيان إلا الحقول الموثقة في البيان. تجنب إضافة
  مفاتيح مخصصة ذات مستوى أعلى هنا.
- يمثل `providerAuthEnvVars` مسار البيانات التعريفية منخفضة الكلفة لفحوصات المصادقة، والتحقق من
  علامات env، وواجهات مصادقة Provider المماثلة التي يجب ألا تشغّل وقت تشغيل Plugin
  فقط لفحص أسماء env.
- يسمح `providerAuthAliases` لمتغيرات Provider بإعادة استخدام
  متغيرات env الخاصة بمصادقة Provider آخر، وملفات تعريف المصادقة، والمصادقة المعتمدة على التكوين،
  وخيار إعداد مفتاح API، من دون ترميز صارم لهذه العلاقة في النواة.
- يسمح `providerEndpoints` لـ Plugins الخاصة بالـ Provider بامتلاك بيانات تعريف بسيطة لمطابقة
  `host`/`baseUrl` الخاصة بـ endpoint. استخدمه فقط لفئات endpoint التي تدعمها النواة بالفعل؛
  إذ لا يزال Plugin يملك سلوك وقت التشغيل.
- يمثل `syntheticAuthRefs` مسار البيانات التعريفية منخفضة الكلفة لـ hooks المصادقة الاصطناعية
  المملوكة للـ Provider والتي يجب أن تكون مرئية لاكتشاف النماذج البارد قبل وجود
  سجل وقت التشغيل. لا تُدرج إلا المراجع التي ينفذ فيها Provider وقت التشغيل أو CLI backend
  فعليًا `resolveSyntheticAuth`.
- يمثل `nonSecretAuthMarkers` مسار البيانات التعريفية منخفضة الكلفة لعلامات
  مفاتيح API البديلة المملوكة لPlugin مضمّن، مثل العلامات المحلية أو OAuth أو بيانات الاعتماد المحيطية.
  تتعامل النواة مع هذه القيم على أنها غير سرية لأغراض عرض المصادقة وتدقيق الأسرار من دون
  ترميز Provider المالك ترميزًا صارمًا.
- يمثل `channelEnvVars` مسار البيانات التعريفية منخفضة الكلفة للرجوع إلى shell-env،
  ومطالبات الإعداد، وواجهات القنوات المماثلة التي يجب ألا تشغّل وقت تشغيل Plugin
  فقط لفحص أسماء env. أسماء env هي بيانات تعريف وليست تنشيطًا
  بحد ذاتها: فما تزال الحالة، والتدقيق، والتحقق من تسليم Cron، والواجهات الأخرى للقراءة فقط
  تطبق سياسة ثقة Plugin وسياسة التنشيط الفعلية قبل أن
  تعتبر متغير env قناة مكوَّنة.
- يمثل `providerAuthChoices` مسار البيانات التعريفية منخفضة الكلفة لمنتقيات اختيار المصادقة،
  وحل `--auth-choice`، وربط Provider المفضل، وتسجيل إشارات CLI البسيطة في
  التهيئة الأولية قبل تحميل وقت تشغيل Provider. أما بيانات تعريف معالج وقت التشغيل
  التي تتطلب كود Provider، فراجع
  [hooks وقت تشغيل Provider](/ar/plugins/architecture#provider-runtime-hooks).
- يتم اختيار أنواع Plugins الحصرية عبر `plugins.slots.*`.
  - يتم اختيار `kind: "memory"` بواسطة `plugins.slots.memory`.
  - يتم اختيار `kind: "context-engine"` بواسطة `plugins.slots.contextEngine`
    (الافتراضي: `legacy` المضمّن).
- يمكن حذف `channels` و`providers` و`cliBackends` و`skills` عندما لا
  يحتاجها Plugin.
- إذا كان Plugin الخاص بك يعتمد على وحدات أصلية، فوثّق خطوات البناء وأي
  متطلبات قائمة سماح خاصة بمدير الحزم (مثل pnpm ‏`allow-build-scripts`
  - `pnpm rebuild <package>`).

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) — البدء مع Plugins
- [معمارية Plugin](/ar/plugins/architecture) — المعمارية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع Plugin SDK
