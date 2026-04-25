---
read_when:
    - تريد إعدادًا موجّهًا لـ Gateway، ومساحة العمل، والمصادقة، والقنوات، وSkills
summary: مرجع CLI لـ `openclaw onboard` (الإعداد التفاعلي)
title: Onboard
x-i18n:
    generated_at: "2026-04-25T13:44:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

الإعداد التفاعلي لإعداد Gateway محليًا أو عن بُعد.

## الأدلة ذات الصلة

- محور إعداد CLI: [Onboarding (CLI)](/ar/start/wizard)
- نظرة عامة على الإعداد: [Onboarding Overview](/ar/start/onboarding-overview)
- مرجع إعداد CLI: [CLI Setup Reference](/ar/start/wizard-cli-reference)
- أتمتة CLI: [CLI Automation](/ar/start/wizard-cli-automation)
- الإعداد على macOS: [Onboarding (macOS App)](/ar/start/onboarding)

## أمثلة

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

يبدأ `--modern` معاينة الإعداد الحواري Crestodian. ومن دون
`--modern`، يحتفظ `openclaw onboard` بتدفق الإعداد الكلاسيكي.

بالنسبة إلى أهداف `ws://` النصية العادية على الشبكات الخاصة (الشبكات الموثوقة فقط)، اضبط
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد.
ولا يوجد مكافئ لذلك في `openclaw.json` لهذا
التجاوز الطارئ الخاص بنقل العميل.

مزوّد مخصص غير تفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

تكون `--custom-api-key` اختيارية في الوضع غير التفاعلي. وإذا تم حذفها، يتحقق الإعداد من `CUSTOM_API_KEY`.

يدعم LM Studio أيضًا علامة مفتاح خاصة بالمزوّد في الوضع غير التفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama غير تفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

تكون القيمة الافتراضية لـ `--custom-base-url` هي `http://127.0.0.1:11434`. وتكون `--custom-model-id` اختيارية؛ وإذا تم حذفها، يستخدم الإعداد القيم الافتراضية المقترحة من Ollama. كما تعمل هنا معرّفات النماذج السحابية مثل `kimi-k2.5:cloud`.

خزّن مفاتيح المزوّد كمراجع بدلًا من نص صريح:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، يكتب الإعداد مراجع مدعومة بمتغيرات البيئة بدلًا من قيم المفاتيح النصية الصريحة.
وبالنسبة إلى المزوّدين المعتمدين على ملفات تعريف المصادقة، يكتب ذلك إدخالات `keyRef`؛ أما بالنسبة إلى المزوّدين المخصصين، فيكتب `models.providers.<id>.apiKey` كمرجع env (مثل `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

عقد وضع `ref` غير التفاعلي:

- اضبط متغير البيئة الخاص بالمزوّد في بيئة عملية الإعداد (مثل `OPENAI_API_KEY`).
- لا تمرر علامات مفاتيح مضمنة (مثل `--openai-api-key`) ما لم يكن متغير البيئة هذا مضبوطًا أيضًا.
- إذا تم تمرير علامة مفتاح مضمنة من دون متغير البيئة المطلوب، يفشل الإعداد سريعًا مع إرشادات.

خيارات رمز Gateway المميز في الوضع غير التفاعلي:

- `--gateway-auth token --gateway-token <token>` يخزّن رمزًا نصيًا صريحًا.
- `--gateway-auth token --gateway-token-ref-env <name>` يخزّن `gateway.auth.token` كمرجع SecretRef من env.
- لا يمكن استخدام `--gateway-token` و`--gateway-token-ref-env` معًا.
- يتطلب `--gateway-token-ref-env` متغير بيئة غير فارغ في بيئة عملية الإعداد.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز رمزًا مميزًا، يتم التحقق من رموز Gateway المُدارة بواسطة SecretRef، لكن لا يتم حفظها كنص صريح محلول في بيانات تعريف بيئة خدمة المشرف.
- مع `--install-daemon`، إذا كان وضع الرمز يتطلب رمزًا مميزًا وكان SecretRef الخاص بالرمز المُعدّ غير محلول، يفشل الإعداد بشكل مغلق مع إرشادات للمعالجة.
- مع `--install-daemon`، إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مُعدّين وكانت `gateway.auth.mode` غير معيّنة، يمنع الإعداد التثبيت حتى يتم تعيين الوضع صراحةً.
- يكتب الإعداد المحلي `gateway.mode="local"` في الإعدادات. إذا كان ملف إعداد لاحق يفتقد `gateway.mode`، فاعتبر ذلك تلفًا في الإعدادات أو تعديلًا يدويًا غير مكتمل، وليس اختصارًا صالحًا لوضع local.
- `--allow-unconfigured` هو منفذ هروب منفصل في وقت تشغيل Gateway. وهو لا يعني أن الإعداد يمكنه حذف `gateway.mode`.

مثال:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

سلامة Gateway المحلية غير التفاعلية:

- ما لم تمرر `--skip-health`، ينتظر الإعداد حتى تصبح Gateway المحلية قابلة للوصول قبل أن يخرج بنجاح.
- يبدأ `--install-daemon` أولًا مسار تثبيت Gateway المُدار. ومن دونه، يجب أن تكون لديك Gateway محلية قيد التشغيل بالفعل، مثل `openclaw gateway run`.
- إذا كنت تريد فقط كتابة الإعدادات/مساحة العمل/bootstrap في الأتمتة، فاستخدم `--skip-health`.
- إذا كنت تدير ملفات مساحة العمل بنفسك، فمرر `--skip-bootstrap` لتعيين `agents.defaults.skipBootstrap: true` وتخطي إنشاء `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`.
- على Windows الأصلي، يحاول `--install-daemon` استخدام Scheduled Tasks أولًا ثم يرجع إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup إذا تم رفض إنشاء المهمة.

سلوك الإعداد التفاعلي مع وضع المرجع:

- اختر **Use secret reference** عندما يُطلب منك ذلك.
- ثم اختر أحد الخيارين:
  - متغير بيئة
  - مزوّد أسرار مُعدّ (`file` أو `exec`)
- ينفّذ الإعداد تحققًا تمهيديًا سريعًا قبل حفظ المرجع.
  - إذا فشل التحقق، يعرض الإعداد الخطأ ويتيح لك إعادة المحاولة.

خيارات نقطة نهاية Z.AI غير التفاعلية:

ملاحظة: يقوم `--auth-choice zai-api-key` الآن باكتشاف أفضل نقطة نهاية Z.AI لمفتاحك تلقائيًا (ويفضّل API العامة مع `zai/glm-5.1`).
إذا كنت تريد تحديدًا نقاط نهاية GLM Coding Plan، فاختر `zai-coding-global` أو `zai-coding-cn`.

```bash
# اختيار نقطة نهاية بدون مطالبة
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# خيارات نقاط نهاية Z.AI الأخرى:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

مثال Mistral غير التفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

ملاحظات التدفق:

- `quickstart`: أقل عدد من المطالبات، ويُنشئ رمز Gateway مميزًا تلقائيًا.
- `manual`: مطالبات كاملة للمنفذ/الربط/المصادقة (اسم بديل لـ `advanced`).
- عندما يشير خيار المصادقة إلى مزوّد مفضّل، يقوم الإعداد بتصفية
  أدوات اختيار النموذج الافتراضي وقائمة السماح مسبقًا إلى ذلك المزوّد. وبالنسبة إلى Volcengine وBytePlus، يشمل ذلك أيضًا متغيرات خطة البرمجة
  (`volcengine-plan/*`, `byteplus-plan/*`).
- إذا لم ينتج عن مرشح المزوّد المفضّل أي نماذج محمّلة بعد،
  يرجع الإعداد إلى الكتالوج غير المصفّى بدلًا من ترك أداة الاختيار فارغة.
- في خطوة البحث على الويب، يمكن لبعض المزوّدين تشغيل مطالبات متابعة خاصة بالمزوّد:
  - يمكن لـ **Grok** أن يقدّم إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY`
    نفسه واختيار نموذج `x_search`.
  - يمكن لـ **Kimi** أن يطلب منطقة Moonshot API (`api.moonshot.ai` مقابل
    `api.moonshot.cn`) ونموذج البحث على الويب الافتراضي لـ Kimi.
- سلوك نطاق الرسائل الخاصة في الإعداد المحلي: [CLI Setup Reference](/ar/start/wizard-cli-reference#outputs-and-internals).
- أسرع أول محادثة: `openclaw dashboard` (Control UI، بدون إعداد قناة).
- المزوّد المخصص: صِل أي نقطة نهاية متوافقة مع OpenAI أو Anthropic،
  بما في ذلك المزوّدين المستضافين غير المدرجين. استخدم Unknown للاكتشاف التلقائي.

## أوامر المتابعة الشائعة

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
لا تعني `--json` الوضع غير التفاعلي تلقائيًا. استخدم `--non-interactive` للبرامج النصية.
</Note>
