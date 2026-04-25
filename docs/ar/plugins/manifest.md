---
read_when:
    - أنت تبني Plugin لـ OpenClaw
    - تحتاج إلى شحن schema لتهيئة Plugin أو تصحيح أخطاء التحقق من Plugin validation
summary: متطلبات manifest الخاصة بالـ Plugin وJSON schema ‏(التحقق الصارم من التهيئة)
title: manifest الخاصة بالـ Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

هذه الصفحة مخصصة فقط لـ **manifest الأصلية الخاصة بـ Plugin في OpenClaw**.

أما تخطيطات الحزم المتوافقة، فراجع [حزم Plugin](/ar/plugins/bundles).

تستخدم تنسيقات الحزم المتوافقة ملفات manifest مختلفة:

- حزمة Codex: ‏`.codex-plugin/plugin.json`
- حزمة Claude: ‏`.claude-plugin/plugin.json` أو تخطيط مكوّن Claude الافتراضي
  من دون manifest
- حزمة Cursor: ‏`.cursor-plugin/plugin.json`

يكتشف OpenClaw تلك التخطيطات المتوافقة تلقائيًا أيضًا، لكنها لا تخضع للتحقق
مقابل schema الخاصة بـ `openclaw.plugin.json` الموصوفة هنا.

بالنسبة إلى الحزم المتوافقة، يقرأ OpenClaw حاليًا بيانات الحزمة الوصفية بالإضافة إلى
جذور Skills المعلنة، وجذور أوامر Claude، والقيم الافتراضية لـ `settings.json` في حزمة Claude،
وقيم Claude LSP الافتراضية، وحزم hooks المدعومة عندما يطابق التخطيط توقعات runtime في OpenClaw.

يجب أن تتضمن كل Plugin أصلية في OpenClaw **ملف `openclaw.plugin.json`** في
**جذر Plugin**. ويستخدم OpenClaw هذه الـ manifest للتحقق من التهيئة
**من دون تنفيذ شيفرة Plugin**. وتُعامل ملفات manifest المفقودة أو غير الصالحة على
أنها أخطاء Plugin وتمنع التحقق من التهيئة.

راجع دليل نظام Plugins الكامل: [Plugins](/ar/tools/plugin).
وللاطلاع على نموذج القدرات الأصلية والإرشادات الحالية للتوافق الخارجي:
[نموذج القدرات](/ar/plugins/architecture#public-capability-model).

## ما الذي يفعله هذا الملف

إن `openclaw.plugin.json` هي البيانات الوصفية التي يقرأها OpenClaw **قبل تحميل
شيفرة Plugin الخاصة بك**. ويجب أن تكون كل العناصر أدناه منخفضة الكلفة بما يكفي لفحصها دون تشغيل
runtime الخاصة بالـ Plugin.

**استخدمه من أجل:**

- هوية Plugin، والتحقق من التهيئة، وتلميحات UI الخاصة بالتهيئة
- بيانات auth وonboarding وsetup الوصفية (الأسماء البديلة، والتمكين التلقائي، ومتغيرات بيئة الموفّر، وخيارات auth)
- تلميحات التفعيل لأسطح control-plane
- الملكية المختصرة لعائلات النماذج
- لقطات ثابتة لملكية القدرات (`contracts`)
- بيانات QA runner الوصفية التي يستطيع مضيف `openclaw qa` المشترك فحصها
- البيانات الوصفية الخاصة بتهيئة القناة التي يتم دمجها في الفهرس وأس surfaces التحقق

**لا تستخدمه من أجل:** تسجيل سلوك runtime، أو إعلان نقاط دخول الشيفرة،
أو بيانات تثبيت npm الوصفية. فهذه تنتمي إلى شيفرة Plugin الخاصة بك وإلى `package.json`.

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
  "description": "Plugin موفّر OpenRouter",
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
      "choiceLabel": "مفتاح API لـ OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "مفتاح API لـ OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "مفتاح API",
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

## مرجع الحقول من المستوى الأعلى

| الحقل                                | مطلوب | النوع                            | المعنى                                                                                                                                                                                                                         |
| ------------------------------------ | ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | نعم    | `string`                         | معرّف Plugin القياسي. وهذا هو المعرّف المستخدم في `plugins.entries.<id>`.                                                                                                                                                     |
| `configSchema`                       | نعم    | `object`                         | JSON Schema مضمنة لتهيئة Plugin هذه.                                                                                                                                                                                           |
| `enabledByDefault`                   | لا     | `true`                           | يحدد Plugin مجمّعة على أنها مفعّلة افتراضيًا. احذف هذا الحقل، أو اضبطه على أي قيمة ليست `true`، لترك Plugin معطّلة افتراضيًا.                                                                                              |
| `legacyPluginIds`                    | لا     | `string[]`                       | معرّفات قديمة تُطبّع إلى معرّف Plugin القياسي هذا.                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | لا     | `string[]`                       | معرّفات الموفّرين التي ينبغي أن تؤدي إلى التمكين التلقائي لهذه Plugin عندما تشير إليها auth أو التهيئة أو مراجع النماذج.                                                                                                     |
| `kind`                               | لا     | `"memory"` \| `"context-engine"` | يعلن نوع Plugin حصريًا يُستخدم بواسطة `plugins.slots.*`.                                                                                                                                                                      |
| `channels`                           | لا     | `string[]`                       | معرّفات القنوات التي تملكها هذه Plugin. وتُستخدم من أجل الاكتشاف والتحقق من التهيئة.                                                                                                                                         |
| `providers`                          | لا     | `string[]`                       | معرّفات الموفّرين التي تملكها هذه Plugin.                                                                                                                                                                                     |
| `providerDiscoveryEntry`             | لا     | `string`                         | مسار وحدة provider-discovery خفيفة، نسبةً إلى جذر Plugin، من أجل بيانات فهرس الموفّرين الوصفية ضمن نطاق manifest التي يمكن تحميلها من دون تفعيل runtime الكاملة للـ Plugin.                                              |
| `modelSupport`                       | لا     | `object`                         | بيانات وصفية مختصرة لعائلات النماذج تملكها manifest وتُستخدم لتحميل Plugin تلقائيًا قبل runtime.                                                                                                                            |
| `modelCatalog`                       | لا     | `object`                         | بيانات وصفية تعريفية لفهرس النماذج خاصة بالموفّرين الذين تملكهم هذه Plugin. وهذا هو عقد control-plane من أجل الإدراج للقراءة فقط، وonboarding، ومنتقيات النماذج، والأسماء البديلة، والحجب، من دون تحميل runtime الخاصة بالـ Plugin. |
| `providerEndpoints`                  | لا     | `object[]`                       | بيانات وصفية تملكها manifest للمضيف/baseUrl الخاصة بمسارات الموفّرين التي يجب على core تصنيفها قبل تحميل runtime الخاصة بالموفّر.                                                                                           |
| `cliBackends`                        | لا     | `string[]`                       | معرّفات CLI inference backend التي تملكها هذه Plugin. وتُستخدم للتفعيل التلقائي عند بدء التشغيل انطلاقًا من مراجع التهيئة الصريحة.                                                                                           |
| `syntheticAuthRefs`                  | لا     | `string[]`                       | مراجع الموفّر أو CLI backend التي يجب فحص hook الخاصة بـ synthetic auth المملوكة للـ Plugin لها أثناء الاكتشاف البارد للنماذج قبل تحميل runtime.                                                                              |
| `nonSecretAuthMarkers`               | لا     | `string[]`                       | قيم placeholder لمفاتيح API مملوكة لPlugin مجمّعة تمثّل حالة بيانات اعتماد محلية أو OAuth أو ambient غير سرية.                                                                                                               |
| `commandAliases`                     | لا     | `object[]`                       | أسماء الأوامر التي تملكها هذه Plugin والتي يجب أن تنتج تشخيصات تهيئة وCLI واعية بالـ Plugin قبل تحميل runtime.                                                                                                                |
| `providerAuthEnvVars`                | لا     | `Record<string, string[]>`       | بيانات بيئة env متوافقة قديمة لبحث auth/status الخاصة بالموفّر. فضّل `setup.providers[].envVars` في Plugins الجديدة؛ وما زال OpenClaw يقرأ هذا أثناء نافذة الإهمال.                                                          |
| `providerAuthAliases`                | لا     | `Record<string, string>`         | معرّفات موفّرين يجب أن تعيد استخدام معرّف موفّر آخر لبحث auth، مثل موفّر برمجة يشارك مفتاح API الأساسي وauth profiles الخاصة بالموفّر الأساسي.                                                                              |
| `channelEnvVars`                     | لا     | `Record<string, string[]>`       | بيانات env خفيفة للقناة يمكن لـ OpenClaw فحصها من دون تحميل شيفرة Plugin. استخدم هذا لأسطح إعداد القناة أو auth المعتمدة على env والتي ينبغي أن تراها مساعدات startup/config العامة.                                         |
| `providerAuthChoices`                | لا     | `object[]`                       | بيانات وصفية خفيفة لخيارات auth من أجل منتقيات onboarding، وحل الموفّر المفضل، والربط البسيط لأعلام CLI.                                                                                                                     |
| `activation`                         | لا     | `object`                         | بيانات وصفية خفيفة لمخطط التفعيل من أجل التحميل المحفّز بالموفّر، أو الأمر، أو القناة، أو المسار، أو القدرة. هذه بيانات وصفية فقط؛ أما السلوك الفعلي فلا تزال runtime الخاصة بالـ Plugin تملكه.                              |
| `setup`                              | لا     | `object`                         | واصفات setup/onboarding خفيفة يمكن لأسطح الاكتشاف والإعداد فحصها من دون تحميل runtime الخاصة بالـ Plugin.                                                                                                                    |
| `qaRunners`                          | لا     | `object[]`                       | واصفات QA runner خفيفة يستخدمها مضيف `openclaw qa` المشترك قبل تحميل runtime الخاصة بالـ Plugin.                                                                                                                             |
| `contracts`                          | لا     | `object`                         | لقطة ثابتة لقدرات مجمّعة تخص auth hooks الخارجية، والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وجلب الويب، والبحث في الويب، وملكية الأدوات.                          |
| `mediaUnderstandingProviderMetadata` | لا     | `Record<string, object>`         | قيم افتراضية خفيفة لفهم الوسائط لمعرّفات الموفّرين المعلنة في `contracts.mediaUnderstandingProviders`.                                                                                                                       |
| `channelConfigs`                     | لا     | `Record<string, object>`         | بيانات وصفية لتكوين القناة تملكها manifest وتُدمج في أسطح الاكتشاف والتحقق قبل تحميل runtime.                                                                                                                                |
| `skills`                             | لا     | `string[]`                       | أدلة Skills المطلوب تحميلها، نسبةً إلى جذر Plugin.                                                                                                                                                                            |
| `name`                               | لا     | `string`                         | اسم Plugin مقروء للبشر.                                                                                                                                                                                                         |
| `description`                        | لا     | `string`                         | ملخص قصير يظهر في أسطح Plugin.                                                                                                                                                                                                  |
| `version`                            | لا     | `string`                         | إصدار Plugin لأغراض إعلامية.                                                                                                                                                                                                   |
| `uiHints`                            | لا     | `Record<string, object>`         | تسميات UI، وplaceholders، وتلميحات الحساسية لحقول التهيئة.                                                                                                                                                                     |

## مرجع `providerAuthChoices`

يصف كل إدخال في `providerAuthChoices` خيار onboarding أو auth واحدًا.
يقرأ OpenClaw هذا قبل تحميل runtime الخاصة بالموفّر.
ويفضّل تدفق إعداد الموفّر هذه الخيارات الموجودة في manifest، ثم يعود إلى
بيانات المعالج الوصفية في runtime وخيارات فهرس التثبيت من أجل التوافق.

| الحقل                 | مطلوب | النوع                                           | المعنى                                                                                                 |
| --------------------- | ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | نعم    | `string`                                        | معرّف الموفّر الذي ينتمي إليه هذا الخيار.                                                               |
| `method`              | نعم    | `string`                                        | معرّف طريقة auth الذي سيتم التوجيه إليه.                                                                |
| `choiceId`            | نعم    | `string`                                        | معرّف ثابت لخيار auth يُستخدم في تدفقات onboarding وCLI.                                               |
| `choiceLabel`         | لا     | `string`                                        | تسمية موجّهة للمستخدم. وإذا حُذفت، يعود OpenClaw إلى `choiceId`.                                      |
| `choiceHint`          | لا     | `string`                                        | نص مساعد قصير للمنتقي.                                                                                 |
| `assistantPriority`   | لا     | `number`                                        | تُرتَّب القيم الأصغر أولًا في المنتقيات التفاعلية التي يقودها المساعد.                                 |
| `assistantVisibility` | لا     | `"visible"` \| `"manual-only"`                  | إخفاء الخيار من منتقيات المساعد مع السماح باختياره يدويًا عبر CLI.                                     |
| `deprecatedChoiceIds` | لا     | `string[]`                                      | معرّفات قديمة لخيار ينبغي أن تعيد توجيه المستخدمين إلى هذا الخيار البديل.                             |
| `groupId`             | لا     | `string`                                        | معرّف مجموعة اختياري لتجميع الخيارات المرتبطة.                                                        |
| `groupLabel`          | لا     | `string`                                        | تسمية موجّهة للمستخدم لتلك المجموعة.                                                                   |
| `groupHint`           | لا     | `string`                                        | نص مساعد قصير للمجموعة.                                                                                |
| `optionKey`           | لا     | `string`                                        | مفتاح خيار داخلي لتدفقات auth البسيطة ذات العلم الواحد.                                               |
| `cliFlag`             | لا     | `string`                                        | اسم علم CLI، مثل `--openrouter-api-key`.                                                              |
| `cliOption`           | لا     | `string`                                        | الشكل الكامل لخيار CLI، مثل `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | لا     | `string`                                        | الوصف المستخدم في مساعدة CLI.                                                                          |
| `onboardingScopes`    | لا     | `Array<"text-inference" \| "image-generation">` | أسطح onboarding التي يجب أن يظهر فيها هذا الخيار. وإذا حُذفت، فالقيمة الافتراضية هي `["text-inference"]`. |

## مرجع `commandAliases`

استخدم `commandAliases` عندما تملك Plugin اسم أمر runtime قد
يضعه المستخدمون خطأً في `plugins.allow` أو يحاولون تشغيله كأمر CLI جذري. ويستخدم OpenClaw
هذه البيانات الوصفية من أجل التشخيص من دون استيراد شيفرة runtime الخاصة بالـ Plugin.

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
| `name`       | نعم    | `string`          | اسم الأمر الذي ينتمي إلى هذه Plugin.                                   |
| `kind`       | لا     | `"runtime-slash"` | يعلّم الاسم البديل على أنه أمر slash في الدردشة وليس أمر CLI جذريًا.   |
| `cliCommand` | لا     | `string`          | أمر CLI جذري ذو صلة يُقترح لعمليات CLI، إذا كان موجودًا.               |

## مرجع `activation`

استخدم `activation` عندما تستطيع Plugin التصريح بكلفة منخفضة عن أحداث control-plane
التي يجب أن تتضمنها في خطة التفعيل/التحميل.

هذه الكتلة هي بيانات وصفية للمخطط، وليست API لدورة الحياة. فهي لا تسجل
سلوك runtime، ولا تستبدل `register(...)`، ولا تَعِد بأن
شيفرة Plugin قد نُفِّذت بالفعل. ويستخدم مخطط التفعيل هذه الحقول لتضييق Plugins المرشحة قبل العودة إلى بيانات
ملكية manifest الموجودة مثل `providers` و`channels` و`commandAliases` و`setup.providers`
و`contracts.tools` وhooks.

فضّل أضيق بيانات وصفية تصف الملكية بالفعل. استخدم
`providers` أو `channels` أو `commandAliases` أو واصفات setup أو `contracts`
عندما تعبر تلك الحقول عن العلاقة. واستخدم `activation` لتلميحات تخطيط إضافية لا يمكن تمثيلها بواسطة حقول الملكية هذه.

هذه الكتلة بيانات وصفية فقط. فهي لا تسجل سلوك runtime، ولا
تستبدل `register(...)` أو `setupEntry` أو أي نقاط دخول runtime/plugin أخرى.
ويستخدمها المستهلكون الحاليون كتلميح تضييق قبل التحميل الأوسع للـ Plugin، لذلك فإن غياب بيانات `activation` الوصفية عادة ما يؤثر فقط في الأداء؛ ولا ينبغي أن
يغيّر الصحة ما دامت fallback الخاصة بملكية manifest القديمة لا تزال موجودة.

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

| الحقل            | مطلوب | النوع                                                | المعنى                                                                                                 |
| ---------------- | ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `onProviders`    | لا     | `string[]`                                           | معرّفات الموفّرين التي ينبغي أن تتضمن هذه Plugin في خطط التفعيل/التحميل.                               |
| `onCommands`     | لا     | `string[]`                                           | معرّفات الأوامر التي ينبغي أن تتضمن هذه Plugin في خطط التفعيل/التحميل.                                 |
| `onChannels`     | لا     | `string[]`                                           | معرّفات القنوات التي ينبغي أن تتضمن هذه Plugin في خطط التفعيل/التحميل.                                 |
| `onRoutes`       | لا     | `string[]`                                           | أنواع المسارات التي ينبغي أن تتضمن هذه Plugin في خطط التفعيل/التحميل.                                 |
| `onCapabilities` | لا     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | تلميحات قدرات عامة تُستخدم في تخطيط التفعيل في control-plane. ويفضل استخدام الحقول الأضيق متى أمكن. |

المستهلكون الفعليون الحاليون:

- يعود تخطيط CLI المحفَّز بالأوامر إلى
  `commandAliases[].cliCommand` أو `commandAliases[].name` القديمة
- يعود تخطيط setup/channel المحفَّز بالقناة إلى ملكية `channels[]`
  القديمة عندما تكون بيانات تفعيل القناة الصريحة مفقودة
- يعود تخطيط setup/runtime المحفَّز بالموفّر إلى
  ملكية `providers[]` القديمة وملكية `cliBackends[]` من المستوى الأعلى عندما تكون بيانات تفعيل الموفّر الصريحة مفقودة

يمكن لتشخيصات المخطط التمييز بين تلميحات التفعيل الصريحة وبين fallback الخاصة بملكية manifest. فعلى سبيل المثال، يعني `activation-command-hint` أن
`activation.onCommands` قد طابقت، بينما يعني `manifest-command-alias` أن
المخطط استخدم ملكية `commandAliases` بدلًا من ذلك. وهذه التسميات الخاصة بالأسباب مخصصة
لتشخيصات المضيف والاختبارات؛ أما مؤلفو Plugins فينبغي أن يستمروا في إعلان البيانات الوصفية
التي تصف الملكية بأفضل شكل.

## مرجع `qaRunners`

استخدم `qaRunners` عندما تساهم Plugin بواحد أو أكثر من transport runners تحت
الجذر المشترك `openclaw qa`. واجعل هذه البيانات الوصفية خفيفة وثابتة؛ إذ تظل
runtime الخاصة بالـ Plugin تملك تسجيل CLI الفعلي عبر سطح
`runtime-api.ts` خفيف يصدّر `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "تشغيل مسار QA المباشر لـ Matrix المعتمد على Docker مقابل homeserver مؤقت"
    }
  ]
}
```

| الحقل         | مطلوب | النوع    | المعنى                                                              |
| ------------- | ------ | -------- | ------------------------------------------------------------------- |
| `commandName` | نعم    | `string` | الأمر الفرعي المُركّب تحت `openclaw qa`، مثل `matrix`.             |
| `description` | لا     | `string` | نص مساعدة fallback يُستخدم عندما يحتاج المضيف المشترك إلى أمر stub. |

## مرجع `setup`

استخدم `setup` عندما تحتاج أسطح setup وonboarding إلى بيانات وصفية خفيفة
مملوكة للـ Plugin قبل تحميل runtime.

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

يبقى `cliBackends` من المستوى الأعلى صالحًا ويستمر في وصف
CLI inference backends. أما `setup.cliBackends` فهو سطح الواصفات الخاص بـ setup لتدفقات
control-plane/setup التي يجب أن تظل بيانات وصفية فقط.

عند وجودهما، تكون `setup.providers` و`setup.cliBackends` هما سطح البحث
المفضل أولًا بالواصفات لاكتشاف setup. وإذا كانت الواصفة لا تفعل سوى تضييق Plugin المرشحة وما زالت setup بحاجة إلى hooks runtime أغنى في وقت setup، فاضبط `requiresRuntime: true` وأبقِ `setup-api` في مكانها كمسار تنفيذ fallback.

يتضمن OpenClaw أيضًا `setup.providers[].envVars` في عمليات البحث العامة عن auth الخاصة بالموفّر ومتغيرات env. ولا يزال `providerAuthEnvVars` مدعومًا عبر محول توافق أثناء نافذة الإهمال، لكن Plugins غير المجمّعة التي لا تزال تستخدمه تتلقى تشخيص manifest. وينبغي أن تضع Plugins الجديدة بيانات env الخاصة بـ setup/status ضمن `setup.providers[].envVars`.

يمكن لـ OpenClaw أيضًا اشتقاق خيارات setup بسيطة من `setup.providers[].authMethods`
عندما لا يكون هناك setup entry متاح، أو عندما يعلن `setup.requiresRuntime: false`
أن runtime الخاصة بـ setup غير ضرورية. وتظل إدخالات `providerAuthChoices` الصريحة
مفضلة للتسميات المخصصة، وأعلام CLI، ونطاق onboarding، وبيانات المساعد الوصفية.

اضبط `requiresRuntime: false` فقط عندما تكون هذه الواصفات كافية
لسطح setup. ويتعامل OpenClaw مع القيمة `false` الصريحة على أنها عقد قائم على الواصفات فقط
ولن ينفذ `setup-api` أو `openclaw.setupEntry` من أجل بحث setup. وإذا كانت
Plugin القائمة على الواصفات فقط لا تزال تشحن أحد إدخالات runtime الخاصة بـ setup،
فإن OpenClaw يبلّغ عن تشخيص إضافي ويستمر في تجاهله. أما حذف
`requiresRuntime` فيُبقي سلوك fallback القديم حتى لا تنكسر Plugins الموجودة التي أضافت
واصفات من دون هذا العلم.

ولأن بحث setup قد ينفّذ شيفرة `setup-api` المملوكة للـ Plugin، فإن
القيم المطبّعة لـ `setup.providers[].id` و`setup.cliBackends[]` يجب أن تظل فريدة عبر
Plugins المكتشفة. وتفشل الملكية الملتبسة بشكل مغلق بدلًا من اختيار
فائز وفق ترتيب الاكتشاف.

عندما تُنفَّذ runtime الخاصة بـ setup فعلًا، تُبلّغ تشخيصات سجل setup عن
انحراف في الواصفات إذا كانت `setup-api` تسجّل موفّرًا أو CLI backend لا
تعلنه واصفات manifest، أو إذا كانت هناك واصفة لا يطابقها تسجيل runtime.
وهذه التشخيصات إضافية ولا ترفض Plugins القديمة.

### مرجع `setup.providers`

| الحقل         | مطلوب | النوع      | المعنى                                                                                  |
| ------------- | ------ | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | نعم    | `string`   | معرّف الموفّر المعرَّض أثناء setup أو onboarding. أبقِ المعرّفات المطبّعة فريدة عالميًا. |
| `authMethods` | لا     | `string[]` | معرّفات طرق setup/auth التي يدعمها هذا الموفّر دون تحميل runtime الكاملة.                |
| `envVars`     | لا     | `string[]` | متغيرات env التي يمكن لأسطح setup/status العامة التحقق منها قبل تحميل runtime الخاصة بالـ Plugin. |

### حقول `setup`

| الحقل              | مطلوب | النوع      | المعنى                                                                                      |
| ------------------ | ------ | ---------- | ------------------------------------------------------------------------------------------- |
| `providers`        | لا     | `object[]` | واصفات setup الخاصة بالموفّر والمكشوفة أثناء setup وonboarding.                             |
| `cliBackends`      | لا     | `string[]` | معرّفات backend وقت setup المستخدمة في lookup قائم على الواصفات أولًا. أبقِ المعرّفات المطبّعة فريدة عالميًا. |
| `configMigrations` | لا     | `string[]` | معرّفات ترحيل التهيئة التي يملكها سطح setup الخاص بهذه Plugin.                              |
| `requiresRuntime`  | لا     | `boolean`  | ما إذا كانت setup لا تزال تحتاج إلى تنفيذ `setup-api` بعد lookup القائم على الواصفات.        |

## مرجع `uiHints`

`uiHints` هي خريطة من أسماء حقول التهيئة إلى تلميحات عرض صغيرة.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "مفتاح API",
      "help": "يُستخدم لطلبات OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

يمكن أن يتضمن كل تلميح حقل ما يلي:

| الحقل         | النوع      | المعنى                                 |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | تسمية حقل موجّهة للمستخدم.             |
| `help`        | `string`   | نص مساعد قصير.                         |
| `tags`        | `string[]` | وسوم UI اختيارية.                      |
| `advanced`    | `boolean`  | يعلّم الحقل على أنه متقدم.             |
| `sensitive`   | `boolean`  | يعلّم الحقل على أنه سري أو حساس.       |
| `placeholder` | `string`   | نص placeholder لإدخالات النماذج.       |

## مرجع `contracts`

استخدم `contracts` فقط لبيانات ملكية القدرات الثابتة التي يمكن لـ OpenClaw
قراءتها من دون استيراد runtime الخاصة بالـ Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| الحقل                            | النوع      | المعنى                                                                  |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | معرّفات factory للامتداد في Codex app-server، وهي حاليًا `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | معرّفات runtime التي يمكن لـ Plugin مجمّعة تسجيل middleware لنتائج الأدوات لها. |
| `externalAuthProviders`          | `string[]` | معرّفات الموفّرين التي تملك هذه Plugin external auth profile hook الخاصة بها. |
| `speechProviders`                | `string[]` | معرّفات موفّري الكلام التي تملكها هذه Plugin.                           |
| `realtimeTranscriptionProviders` | `string[]` | معرّفات موفّري النسخ الفوري التي تملكها هذه Plugin.                     |
| `realtimeVoiceProviders`         | `string[]` | معرّفات موفّري الصوت الفوري التي تملكها هذه Plugin.                      |
| `memoryEmbeddingProviders`       | `string[]` | معرّفات موفّري embeddings الذاكرة التي تملكها هذه Plugin.               |
| `mediaUnderstandingProviders`    | `string[]` | معرّفات موفّري فهم الوسائط التي تملكها هذه Plugin.                       |
| `imageGenerationProviders`       | `string[]` | معرّفات موفّري توليد الصور التي تملكها هذه Plugin.                       |
| `videoGenerationProviders`       | `string[]` | معرّفات موفّري توليد الفيديو التي تملكها هذه Plugin.                     |
| `webFetchProviders`              | `string[]` | معرّفات موفّري جلب الويب التي تملكها هذه Plugin.                         |
| `webSearchProviders`             | `string[]` | معرّفات موفّري البحث في الويب التي تملكها هذه Plugin.                    |
| `tools`                          | `string[]` | أسماء أدوات الوكيل التي تملكها هذه Plugin من أجل فحوصات العقود المجمّعة. |

يتم الاحتفاظ بـ `contracts.embeddedExtensionFactories` لامتدادات
Codex app-server-only المجمّعة. وينبغي أن تعلن تحولات نتائج الأدوات المجمّعة
عن `contracts.agentToolResultMiddleware` وأن تسجّل باستخدام
`api.registerAgentToolResultMiddleware(...)` بدلًا من ذلك. ولا يمكن لـ Plugins الخارجية
تسجيل middleware لنتائج الأدوات لأن هذه الفتحة تستطيع إعادة كتابة
مخرجات أدوات عالية الثقة قبل أن يراها النموذج.

ينبغي لـ Plugins الموفّرين التي تطبّق `resolveExternalAuthProfiles` أن تعلن
عن `contracts.externalAuthProviders`. ولا تزال Plugins من دون هذا الإعلان تعمل
عبر fallback توافق قديم، لكن ذلك fallback أبطأ
وسيُزال بعد انتهاء نافذة الترحيل.

ينبغي لموفّري embeddings الذاكرة المجمّعين أن يعلنوا عن
`contracts.memoryEmbeddingProviders` لكل معرّف adapter يعرضونه، بما في ذلك
adapters المدمجة مثل `local`. وتستخدم مسارات CLI المستقلة عقد manifest
هذا لتحميل Plugin المالكة فقط قبل أن تسجّل runtime الكاملة لـ Gateway الموفّرين.

## مرجع `mediaUnderstandingProviderMetadata`

استخدم `mediaUnderstandingProviderMetadata` عندما يكون لموفّر فهم الوسائط
نماذج افتراضية، أو أولوية fallback تلقائية للمصادقة، أو دعم أصلي للمستندات
تحتاجه المساعدات العامة في core قبل تحميل runtime. ويجب أيضًا إعلان المفاتيح
في `contracts.mediaUnderstandingProviders`.

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

يمكن أن يتضمن كل إدخال للموفّر ما يلي:

| الحقل                  | النوع                               | المعنى                                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قدرات الوسائط التي يعرّضها هذا الموفّر.                                      |
| `defaultModels`        | `Record<string, string>`            | قيم افتراضية من القدرة إلى النموذج تُستخدم عندما لا تحدد التهيئة نموذجًا.    |
| `autoPriority`         | `Record<string, number>`            | تُرتَّب الأرقام الأصغر أولًا في fallback التلقائي للموفّر القائم على بيانات الاعتماد. |
| `nativeDocumentInputs` | `"pdf"[]`                           | مدخلات المستندات الأصلية التي يدعمها الموفّر.                               |

## مرجع `channelConfigs`

استخدم `channelConfigs` عندما تحتاج Plugin القناة إلى بيانات وصفية خفيفة للتهيئة قبل
تحميل runtime. ويمكن لاكتشاف setup/status الخاص بالقنوات للقراءة فقط استخدام هذه البيانات
الوصفية مباشرةً للقنوات الخارجية المهيأة عندما لا يكون هناك setup entry متاح، أو
عندما يعلن `setup.requiresRuntime: false` أن runtime الخاصة بـ setup غير ضرورية.

بالنسبة إلى Plugin القناة، يصف `configSchema` و`channelConfigs` مسارين
مختلفين:

- يتحقق `configSchema` من `plugins.entries.<plugin-id>.config`
- يتحقق `channelConfigs.<channel-id>.schema` من `channels.<channel-id>`

ينبغي للـ Plugins غير المجمّعة التي تعلن `channels[]` أن تعلن أيضًا عن إدخالات
`channelConfigs` المطابقة. ومن دونها، لا يزال بإمكان OpenClaw تحميل Plugin، لكن
أسطح schema للتهيئة في المسار البارد، وsetup، وControl UI لا يمكنها معرفة
شكل الخيارات المملوكة للقناة حتى تُنفَّذ runtime الخاصة بالـ Plugin.

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
          "label": "عنوان URL لـ Homeserver",
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

يمكن أن يتضمن كل إدخال قناة ما يلي:

| الحقل         | النوع                    | المعنى                                                                                   |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema لـ `channels.<id>`. وهو مطلوب لكل إدخال تهيئة قناة معلن عنه.                |
| `uiHints`     | `Record<string, object>` | تسميات/Placeholders/تلميحات حساسية اختيارية لقسم تهيئة تلك القناة.                      |
| `label`       | `string`                 | تسمية القناة التي تُدمج في أسطح المنتقي والفحص عندما لا تكون بيانات runtime الوصفية جاهزة. |
| `description` | `string`                 | وصف قصير للقناة من أجل أسطح الفحص والفهرس.                                               |
| `preferOver`  | `string[]`               | معرّفات Plugins قديمة أو أقل أولوية ينبغي أن تتفوق عليها هذه القناة في أسطح الاختيار.   |

## مرجع `modelSupport`

استخدم `modelSupport` عندما يجب على OpenClaw استنتاج Plugin الموفّر الخاصة بك من
معرّفات نماذج مختصرة مثل `gpt-5.5` أو `claude-sonnet-4.6` قبل تحميل
runtime الخاصة بالـ Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

يطبق OpenClaw الأولوية التالية:

- تستخدم مراجع `provider/model` الصريحة بيانات manifest الخاصة بالملكية في `providers`
- تتفوق `modelPatterns` على `modelPrefixes`
- إذا طابقت Plugin غير مجمّعة وأخرى مجمّعة معًا، تفوز
  Plugin غير المجمّعة
- يتم تجاهل الغموض المتبقي إلى أن يحدد المستخدم أو التهيئة موفّرًا

الحقول:

| الحقل           | النوع      | المعنى                                                                          |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | بادئات تُطابق باستخدام `startsWith` مقابل معرّفات النماذج المختصرة.            |
| `modelPatterns` | `string[]` | مصادر Regex تُطابق مقابل معرّفات النماذج المختصرة بعد إزالة لاحقة الملف الشخصي. |

## مرجع `modelCatalog`

استخدم `modelCatalog` عندما يجب على OpenClaw معرفة البيانات الوصفية لنماذج الموفّر قبل
تحميل runtime الخاصة بالـ Plugin. وهذا هو المصدر المملوك للـ manifest الخاص بصفوف
الفهرس الثابتة، والأسماء البديلة للموفّرين، وقواعد الحجب، ووضع الاكتشاف. أما تحديث runtime
فلا يزال ينتمي إلى شيفرة runtime الخاصة بالموفّر، لكن manifest تخبر core متى تكون runtime
مطلوبة.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "غير متاح على Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

الحقول من المستوى الأعلى:

| الحقل          | النوع                                                    | المعنى                                                                                                         |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | صفوف الفهرس الخاصة بمعرّفات الموفّرين التي تملكها هذه Plugin. وينبغي أن تظهر المفاتيح أيضًا في `providers` من المستوى الأعلى. |
| `aliases`      | `Record<string, object>`                                 | أسماء بديلة للموفّرين ينبغي أن تُحل إلى موفّر مملوك من أجل تخطيط الفهرس أو الحجب.                            |
| `suppressions` | `object[]`                                               | صفوف نماذج من مصدر آخر تقوم هذه Plugin بحجبها لسبب خاص بالموفّر.                                             |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | ما إذا كان يمكن قراءة فهرس الموفّر من بيانات manifest الوصفية، أو تحديثه في الذاكرة المؤقتة، أو يتطلب runtime. |

حقول الموفّر:

| الحقل     | النوع                    | المعنى                                                                |
| --------- | ------------------------ | --------------------------------------------------------------------- |
| `baseUrl` | `string`                 | عنوان base URL افتراضي اختياري للنماذج في فهرس هذا الموفّر.           |
| `api`     | `ModelApi`               | موائم API افتراضي اختياري للنماذج في فهرس هذا الموفّر.                |
| `headers` | `Record<string, string>` | رؤوس ثابتة اختيارية تنطبق على فهرس هذا الموفّر.                       |
| `models`  | `object[]`               | صفوف النماذج المطلوبة. ويتم تجاهل الصفوف التي لا تحتوي على `id`.      |

حقول النموذج:

| الحقل           | النوع                                                          | المعنى                                                                     |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | معرّف النموذج المحلي للموفّر، من دون البادئة `provider/`.                  |
| `name`          | `string`                                                       | اسم عرض اختياري.                                                           |
| `api`           | `ModelApi`                                                     | تجاوز اختياري لـ API لكل نموذج.                                            |
| `baseUrl`       | `string`                                                       | تجاوز اختياري لـ base URL لكل نموذج.                                       |
| `headers`       | `Record<string, string>`                                       | رؤوس ثابتة اختيارية لكل نموذج.                                             |
| `input`         | `Array<"text" \| "image" \| "document">`                       | الأنماط التي يقبلها النموذج.                                               |
| `reasoning`     | `boolean`                                                      | ما إذا كان النموذج يعرّض سلوك reasoning.                                   |
| `contextWindow` | `number`                                                       | نافذة السياق الأصلية الخاصة بالموفّر.                                      |
| `contextTokens` | `number`                                                       | حد سياق فعّال اختياري في runtime عندما يختلف عن `contextWindow`.            |
| `maxTokens`     | `number`                                                       | الحد الأقصى لرموز الخرج عندما يكون معروفًا.                                |
| `cost`          | `object`                                                       | تسعير اختياري بالدولار الأمريكي لكل مليون رمز، بما في ذلك `tieredPricing` الاختيارية. |
| `compat`        | `object`                                                       | أعلام توافق اختيارية تطابق توافق تهيئة نموذج OpenClaw.                    |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | حالة الإدراج. احجب فقط عندما يجب ألا يظهر الصف مطلقًا.                    |
| `statusReason`  | `string`                                                       | سبب اختياري يُعرض مع الحالة غير المتاحة.                                   |
| `replaces`      | `string[]`                                                     | معرّفات نماذج أقدم محلية للموفّر يحل هذا النموذج محلها.                    |
| `replacedBy`    | `string`                                                       | معرّف نموذج بديل محلي للموفّر للصفوف deprecated.                           |
| `tags`          | `string[]`                                                     | وسوم ثابتة تستخدمها المنتقيات والفلاتر.                                    |

لا تضع بيانات runtime فقط داخل `modelCatalog`. فإذا كان الموفّر يحتاج إلى
حالة حساب، أو طلب API، أو اكتشاف عملية محلية لمعرفة المجموعة الكاملة من
النماذج، فصرّح عن ذلك الموفّر على أنه `refreshable` أو `runtime` في `discovery`.

مفاتيح القدرات القديمة من المستوى الأعلى مهملة. استخدم `openclaw doctor --fix` من أجل
نقل `speechProviders` و`realtimeTranscriptionProviders` و
`realtimeVoiceProviders` و`mediaUnderstandingProviders` و
`imageGenerationProviders` و`videoGenerationProviders` و
`webFetchProviders` و`webSearchProviders` إلى `contracts`؛ إذ إن
تحميل manifest العادي لم يعد يتعامل مع تلك الحقول من المستوى الأعلى على أنها
ملكية للقدرات.

## manifest مقابل package.json

يخدم الملفان غرضين مختلفين:

| الملف                  | استخدامه                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | الاكتشاف، والتحقق من التهيئة، والبيانات الوصفية لخيارات auth، وتلميحات UI التي يجب أن تكون موجودة قبل تشغيل شيفرة Plugin       |
| `package.json`         | بيانات npm الوصفية، وتثبيت التبعيات، وكتلة `openclaw` المستخدمة لنقاط الدخول، أو حجب التثبيت، أو بيانات setup أو الفهرس الوصفية |

إذا لم تكن متأكدًا أين يجب أن تنتمي قطعة من البيانات الوصفية، فاستخدم هذه القاعدة:

- إذا كان يجب على OpenClaw معرفتها قبل تحميل شيفرة Plugin، فضعها في `openclaw.plugin.json`
- إذا كانت تتعلق بالتغليف، أو ملفات الدخول، أو سلوك تثبيت npm، فضعها في `package.json`

### حقول package.json التي تؤثر في الاكتشاف

تعيش بعض بيانات Plugin الوصفية السابقة لـ runtime عمدًا في `package.json` تحت
كتلة `openclaw` بدلًا من `openclaw.plugin.json`.

أمثلة مهمة:

| الحقل                                                             | المعنى                                                                                                                                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | يعلن نقاط الدخول الأصلية لـ Plugin. ويجب أن تبقى داخل دليل حزمة Plugin.                                                                                                         |
| `openclaw.runtimeExtensions`                                      | يعلن نقاط دخول runtime المبنية بـ JavaScript للحزم المثبتة. ويجب أن تبقى داخل دليل حزمة Plugin.                                                                                |
| `openclaw.setupEntry`                                             | نقطة دخول خفيفة مخصصة لـ setup فقط تُستخدم أثناء onboarding، وبدء تشغيل القناة المؤجل، واكتشاف حالة القناة/SecretRef للقراءة فقط. ويجب أن تبقى داخل دليل حزمة Plugin.         |
| `openclaw.runtimeSetupEntry`                                      | يعلن نقطة دخول setup المبنية بـ JavaScript للحزم المثبتة. ويجب أن تبقى داخل دليل حزمة Plugin.                                                                                  |
| `openclaw.channel`                                                | بيانات وصفية خفيفة لفهرس القنوات مثل التسميات، ومسارات المستندات، والأسماء البديلة، ونصوص الاختيار.                                                                            |
| `openclaw.channel.configuredState`                                | بيانات وصفية خفيفة لفاحص الحالة المهيأة يمكنها الإجابة عن سؤال "هل يوجد إعداد قائم على env فقط بالفعل؟" من دون تحميل runtime الكاملة للقناة.                                   |
| `openclaw.channel.persistedAuthState`                             | بيانات وصفية خفيفة لفاحص auth المحفوظة يمكنها الإجابة عن سؤال "هل تم تسجيل الدخول بالفعل في أي شيء؟" من دون تحميل runtime الكاملة للقناة.                                        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | تلميحات التثبيت/التحديث للـ Plugins المجمّعة والمنشورة خارجيًا.                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | مسار التثبيت المفضل عندما تتوفر مصادر تثبيت متعددة.                                                                                                                               |
| `openclaw.install.minHostVersion`                                 | الحد الأدنى المدعوم من إصدار مضيف OpenClaw، باستخدام حد أدنى من semver مثل `>=2026.3.22`.                                                                                       |
| `openclaw.install.expectedIntegrity`                              | سلسلة integrity متوقعة لتوزيعة npm مثل `sha512-...`; تتحقق تدفقات التثبيت والتحديث من المكوّن الذي تم جلبه مقابلها.                                                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | يسمح بمسار استرداد ضيق لإعادة تثبيت Plugin مجمّعة عندما تكون التهيئة غير صالحة.                                                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | يسمح بتحميل أسطح القنوات المخصصة لـ setup فقط قبل Plugin القناة الكاملة أثناء بدء التشغيل.                                                                                         |

تحدد بيانات manifest الوصفية أي خيارات الموفر/القناة/setup التي تظهر في
onboarding قبل تحميل runtime. أما `package.json#openclaw.install` فهي تخبر
onboarding كيف يتم جلب أو تمكين تلك Plugin عندما يختار المستخدم أحد هذه
الخيارات. ولا تنقل تلميحات التثبيت إلى `openclaw.plugin.json`.

يُفرض `openclaw.install.minHostVersion` أثناء التثبيت وتحميل
سجل manifest. وتُرفض القيم غير الصالحة؛ أما القيم الأحدث لكن الصالحة فتؤدي إلى تخطي
Plugin على المضيفات الأقدم.

يوجد التثبيت الدقيق لإصدار npm بالفعل في `npmSpec`، مثل
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. وينبغي لإدخالات الفهرس الخارجي الرسمية
أن تقرن المواصفات الدقيقة مع `expectedIntegrity` بحيث تفشل تدفقات التحديث بشكل مغلق
إذا لم يعد مكوّن npm الذي تم جلبه يطابق الإصدار المثبت. ولا يزال
onboarding التفاعلي يوفّر مواصفات npm الخاصة بالسجل الموثوق، بما في ذلك أسماء الحزم المجردة وdist-tags، من أجل التوافق. ويمكن لتشخيصات الفهرس
التمييز بين المصادر الدقيقة، والعائمة، والمثبّتة بـ integrity، والمفتقرة إلى integrity، وغير المطابقة لاسم الحزمة، ومصادر default-choice غير الصالحة. كما أنها تحذّر عندما
تكون `expectedIntegrity` موجودة لكن لا يوجد مصدر npm صالح يمكنه تثبيتها عليه.
وعندما تكون `expectedIntegrity` موجودة،
تفرضها تدفقات التثبيت/التحديث؛ وعندما تُحذف، يتم تسجيل حل السجل
من دون تثبيت integrity.

ينبغي لـ Plugins القنوات أن توفّر `openclaw.setupEntry` عندما تحتاج أسطح الحالة،
أو قائمة القنوات، أو عمليات فحص SecretRef إلى تحديد الحسابات المهيأة من دون تحميل
runtime الكاملة. ويجب أن تكشف setup entry بيانات القناة الوصفية بالإضافة إلى
محولات config وstatus وsecrets الآمنة بالنسبة إلى setup؛ وأبقِ عملاء الشبكة، ومستمعي gateway، وبيئات transport runtime
في نقطة الدخول الرئيسية للامتداد.

لا تتجاوز حقول نقطة دخول runtime فحوصات حدود الحزمة بالنسبة إلى
حقول نقطة دخول المصدر. فعلى سبيل المثال، لا يمكن لـ `openclaw.runtimeExtensions`
أن تجعل مسار `openclaw.extensions` الهارب قابلًا للتحميل.

إن `openclaw.install.allowInvalidConfigRecovery` ضيق عمدًا. فهو
لا يجعل التهيئات المعطلة العشوائية قابلة للتثبيت. واليوم، لا يسمح إلا
لتدفقات التثبيت بالتعافي من حالات فشل ترقية معينة قديمة لPlugins المجمّعة، مثل
مسار Plugin مجمّعة مفقود أو إدخال قديم `channels.<id>` لنفس تلك Plugin
المجمّعة. أما أخطاء التهيئة غير المرتبطة فلا تزال تمنع التثبيت وتوجّه المشغّلين
إلى `openclaw doctor --fix`.

إن `openclaw.channel.persistedAuthState` هي بيانات وصفية للحزمة تخص وحدة فحص
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

استخدمها عندما تحتاج تدفقات setup أو doctor أو configured-state إلى فحص auth
سريع بنعم/لا قبل تحميل Plugin القناة الكاملة. ويجب أن يكون التصدير المستهدف
دالة صغيرة تقرأ الحالة المحفوظة فقط؛ ولا تمررها عبر barrel الخاصة بـ runtime الكاملة للقناة.

تتبع `openclaw.channel.configuredState` البنية نفسها من أجل فحوصات configured-state
الرخيصة القائمة على env فقط:

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

استخدمها عندما تكون القناة قادرة على تحديد configured-state من env أو من مدخلات صغيرة أخرى
غير runtime. وإذا كان الفحص يحتاج إلى حل التهيئة الكاملة أو إلى
runtime الحقيقية للقناة، فأبقِ هذا المنطق بدلًا من ذلك داخل hook الخاصة بالـ Plugin ‏`config.hasConfiguredState`.

## أولوية الاكتشاف (معرّفات Plugin المكررة)

يكتشف OpenClaw Plugins من عدة جذور (المجمّعة، والتثبيت العام، ومساحة العمل، والمسارات الصريحة المحددة في التهيئة). وإذا اشترك اكتشافان في المعرف نفسه `id`، يتم الاحتفاظ فقط بالـ manifest ذات **الأولوية الأعلى**؛ ويتم إسقاط النسخ المكررة ذات الأولوية الأدنى بدلًا من تحميلها إلى جانبها.

ترتيب الأولوية، من الأعلى إلى الأدنى:

1. **المحددة في التهيئة** — مسار مثبت صراحةً في `plugins.entries.<id>`
2. **المجمّعة** — Plugins التي تأتي مع OpenClaw
3. **التثبيت العام** — Plugins المثبتة في جذر Plugins العام الخاص بـ OpenClaw
4. **مساحة العمل** — Plugins المكتشفة نسبةً إلى مساحة العمل الحالية

الآثار المترتبة:

- لن تقوم نسخة متفرعة أو قديمة من Plugin مجمّعة موجودة في مساحة العمل بحجب النسخة المجمّعة.
- ولتجاوز Plugin مجمّعة فعلًا بنسخة محلية، قم بتثبيتها عبر `plugins.entries.<id>` حتى تفوز بالأولوية بدلًا من الاعتماد على اكتشاف مساحة العمل.
- يتم تسجيل النسخ المكررة التي تم إسقاطها حتى تتمكن Doctor وتشخيصات بدء التشغيل من الإشارة إلى النسخة التي تم تجاهلها.

## متطلبات JSON Schema

- **يجب أن تشحن كل Plugin JSON Schema**، حتى لو كانت لا تقبل أي تهيئة.
- يُقبل schema فارغة (مثل `{ "type": "object", "additionalProperties": false }`).
- يتم التحقق من schema في وقت قراءة/كتابة التهيئة، وليس في وقت runtime.

## سلوك التحقق

- تُعد مفاتيح `channels.*` غير المعروفة **أخطاء**، ما لم يكن معرّف القناة معلنًا
  بواسطة manifest خاصة بـ Plugin.
- يجب أن تشير `plugins.entries.<id>` و`plugins.allow` و`plugins.deny` و`plugins.slots.*`
  إلى معرّفات Plugin **قابلة للاكتشاف**. وتُعد المعرّفات غير المعروفة **أخطاء**.
- إذا كانت Plugin مثبتة لكن manifest أو schema الخاصة بها معطلة أو مفقودة،
  يفشل التحقق وتبلغ Doctor عن خطأ Plugin.
- إذا كانت تهيئة Plugin موجودة لكن Plugin **معطّلة**، يتم الاحتفاظ بالتهيئة ويُعرض
  **تحذير** في Doctor + السجلات.

راجع [مرجع التهيئة](/ar/gateway/configuration) للاطلاع على schema الكاملة لـ `plugins.*`.

## ملاحظات

- تُعد manifest **مطلوبة للـ Plugins الأصلية في OpenClaw**، بما في ذلك التحميلات المحلية من نظام الملفات. ولا تزال runtime تحمّل وحدة Plugin بشكل منفصل؛ أما manifest فهي مخصصة فقط للاكتشاف + التحقق.
- تُحلَّل manifests الأصلية باستخدام JSON5، لذلك تُقبل التعليقات، والفواصل الختامية، والمفاتيح غير المقتبسة طالما أن القيمة النهائية لا تزال كائنًا.
- لا يقرأ مُحمِّل manifest إلا الحقول الموثقة. تجنب مفاتيح المستوى الأعلى المخصصة.
- يمكن حذف `channels` و`providers` و`cliBackends` و`skills` جميعًا عندما لا تحتاجها Plugin.
- يجب أن تبقى `providerDiscoveryEntry` خفيفة، وينبغي ألا تستورد شيفرة runtime واسعة؛ استخدمها لبيانات فهرس الموفّر الوصفية الثابتة أو واصفات الاكتشاف الضيقة، وليس لتنفيذ وقت الطلب.
- يتم اختيار أنواع Plugins الحصرية عبر `plugins.slots.*`: ‏`kind: "memory"` عبر `plugins.slots.memory`، و`kind: "context-engine"` عبر `plugins.slots.contextEngine` (الافتراضي `legacy`).
- إن بيانات env الوصفية (`setup.providers[].envVars`، و`providerAuthEnvVars` المهملة، و`channelEnvVars`) تعريفية فقط. ولا تزال أسطح status، وaudit، والتحقق من تسليم Cron، وغيرها من الأسطح المخصصة للقراءة فقط تطبق سياسة الثقة في Plugin وسياسة التفعيل الفعّال قبل اعتبار متغير env مهيأ.
- بالنسبة إلى بيانات معالج runtime الوصفية التي تتطلب شيفرة الموفّر، راجع [hooks runtime الخاصة بالموفّر](/ar/plugins/architecture-internals#provider-runtime-hooks).
- إذا كانت Plugin الخاصة بك تعتمد على native modules، فوثّق خطوات البناء وأي متطلبات لقائمة السماح الخاصة بمدير الحزم (مثل pnpm ‏`allow-build-scripts` + ‏`pnpm rebuild <package>`).

## ذو صلة

<CardGroup cols={3}>
  <Card title="بناء Plugins" href="/ar/plugins/building-plugins" icon="rocket">
    البدء مع Plugins.
  </Card>
  <Card title="بنية Plugin" href="/ar/plugins/architecture" icon="diagram-project">
    البنية الداخلية ونموذج القدرات.
  </Card>
  <Card title="نظرة عامة على SDK" href="/ar/plugins/sdk-overview" icon="book">
    مرجع Plugin SDK واستيرادات المسارات الفرعية.
  </Card>
</CardGroup>
