---
read_when:
    - تريد إعدادًا موجّهًا لـ Gateway ومساحة العمل والمصادقة والقنوات وSkills
summary: مرجع CLI لـ `openclaw onboard` (الإعداد التفاعلي الأوّلي)
title: الإعداد الأوّلي
x-i18n:
    generated_at: "2026-04-23T07:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

إعداد أوّلي تفاعلي لإعداد Gateway محلي أو بعيد.

## أدلة ذات صلة

- مركز الإعداد الأوّلي في CLI: [الإعداد الأوّلي (CLI)](/ar/start/wizard)
- نظرة عامة على الإعداد الأوّلي: [نظرة عامة على الإعداد الأوّلي](/ar/start/onboarding-overview)
- مرجع الإعداد الأوّلي في CLI: [مرجع إعداد CLI](/ar/start/wizard-cli-reference)
- أتمتة CLI: [أتمتة CLI](/ar/start/wizard-cli-automation)
- الإعداد الأوّلي على macOS: [الإعداد الأوّلي (تطبيق macOS)](/ar/start/onboarding)

## أمثلة

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

بالنسبة إلى أهداف `ws://` النصية الصريحة على الشبكات الخاصة (للشبكات الموثوقة فقط)، اضبط
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد الأوّلي.

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

تكون `--custom-api-key` اختيارية في الوضع غير التفاعلي. وإذا لم تُمرَّر، يتحقق الإعداد الأوّلي من `CUSTOM_API_KEY`.

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

تكون `--custom-base-url` افتراضيًا `http://127.0.0.1:11434`. وتكون `--custom-model-id` اختيارية؛ وإذا لم تُمرَّر، يستخدم الإعداد الأوّلي القيم الافتراضية المقترحة من Ollama. كما تعمل هنا أيضًا معرّفات النماذج السحابية مثل `kimi-k2.5:cloud`.

خزّن مفاتيح المزوّدات كمراجع بدلًا من النص الصريح:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

باستخدام `--secret-input-mode ref`، يكتب الإعداد الأوّلي مراجع مدعومة بالبيئة بدلًا من قيم المفاتيح النصية الصريحة.
وبالنسبة إلى المزوّدات المعتمدة على auth-profile، يكتب هذا إدخالات `keyRef`؛ أما بالنسبة إلى المزوّدات المخصصة، فيكتب `models.providers.<id>.apiKey` كمرجع env (مثلًا `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

عقد وضع `ref` غير التفاعلي:

- اضبط متغير البيئة الخاص بالمزوّد في بيئة عملية الإعداد الأوّلي (مثل `OPENAI_API_KEY`).
- لا تمرّر علامات المفاتيح المضمنة (مثل `--openai-api-key`) إلا إذا كان متغير البيئة هذا مضبوطًا أيضًا.
- إذا تم تمرير علامة مفتاح مضمنة من دون متغير البيئة المطلوب، يفشل الإعداد الأوّلي سريعًا مع إرشادات.

خيارات رمز Gateway في الوضع غير التفاعلي:

- `--gateway-auth token --gateway-token <token>` يخزّن رمزًا نصيًا صريحًا.
- `--gateway-auth token --gateway-token-ref-env <name>` يخزّن `gateway.auth.token` كمرجع SecretRef من env.
- `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- تتطلب `--gateway-token-ref-env` متغير env غير فارغ في بيئة عملية الإعداد الأوّلي.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز وجود رمز، يتم التحقق من رموز Gateway المُدارة عبر SecretRef ولكن لا يتم حفظها كنص صريح محلول في بيانات تعريف بيئة خدمة المشرف.
- مع `--install-daemon`، إذا كان وضع الرمز يتطلب رمزًا وكان SecretRef المضبوط للرمز غير محلول، يفشل الإعداد الأوّلي افتراضيًا مع إرشادات للمعالجة.
- مع `--install-daemon`، إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مضبوطتين وكانت `gateway.auth.mode` غير مضبوطة، يمنع الإعداد الأوّلي التثبيت حتى يتم ضبط الوضع صراحةً.
- يكتب الإعداد الأوّلي المحلي `gateway.mode="local"` في الإعداد. وإذا افتقد ملف إعداد لاحق القيمة `gateway.mode`، فاعتبر ذلك تلفًا في الإعداد أو تعديلًا يدويًا غير مكتمل، لا اختصارًا صالحًا لوضع local.
- تمثل `--allow-unconfigured` منفذ هروب منفصلًا لوقت تشغيل Gateway. وهي لا تعني أن الإعداد الأوّلي يمكنه إهمال `gateway.mode`.

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

سلامة Gateway المحلي في الوضع غير التفاعلي:

- ما لم تمرّر `--skip-health`، ينتظر الإعداد الأوّلي الوصول إلى Gateway محلي قبل أن يخرج بنجاح.
- يشغّل `--install-daemon` أولًا مسار تثبيت Gateway المُدار. ومن دونه، يجب أن يكون لديك Gateway محلي يعمل بالفعل، مثل `openclaw gateway run`.
- إذا كنت تريد فقط كتابة الإعداد/مساحة العمل/bootstrap في الأتمتة، فاستخدم `--skip-health`.
- على Windows الأصلي، يحاول `--install-daemon` أولًا Scheduled Tasks ثم يعود إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup إذا تم رفض إنشاء المهمة.

سلوك الإعداد الأوّلي التفاعلي مع وضع المرجع:

- اختر **استخدام مرجع سري** عندما يُطلب منك ذلك.
- ثم اختر أحد الخيارين:
  - متغير بيئة
  - مزوّد أسرار مضبوط (`file` أو `exec`)
- ينفذ الإعداد الأوّلي تحققًا تمهيديًا سريعًا قبل حفظ المرجع.
  - إذا فشل التحقق، يعرض الإعداد الأوّلي الخطأ ويتيح لك إعادة المحاولة.

خيارات نقطة نهاية Z.AI غير التفاعلية:

ملاحظة: يقوم `--auth-choice zai-api-key` الآن باكتشاف أفضل نقطة نهاية Z.AI لمفتاحك تلقائيًا (ويفضّل API العامة مع `zai/glm-5.1`).
إذا كنت تريد تحديدًا نقاط نهاية GLM Coding Plan، فاختر `zai-coding-global` أو `zai-coding-cn`.

```bash
# اختيار نقطة النهاية من دون مطالبة
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

- `quickstart`: مطالبات قليلة ويولّد رمز Gateway تلقائيًا.
- `manual`: مطالبات كاملة للمنفذ/الربط/المصادقة (اسم بديل لـ `advanced`).
- عندما يشير اختيار المصادقة إلى مزوّد مفضّل، يقوم الإعداد الأوّلي بتصفية
  منتقي النموذج الافتراضي ومنتقي قائمة السماح مسبقًا إلى ذلك المزوّد. وبالنسبة إلى Volcengine و
  BytePlus، يطابق هذا أيضًا متغيرات خطة البرمجة
  (`volcengine-plan/*` و`byteplus-plan/*`).
- إذا لم يعثر عامل تصفية المزوّد المفضّل على أي نماذج محمّلة بعد، فإن الإعداد الأوّلي
  يعود إلى الفهرس غير المصفّى بدلًا من ترك المنتقي فارغًا.
- في خطوة البحث على الويب، يمكن لبعض المزوّدات تشغيل مطالبات متابعة
  خاصة بالمزوّد:
  - يمكن لـ **Grok** تقديم إعداد `x_search` اختياري باستخدام `XAI_API_KEY`
    نفسه وخيار نموذج `x_search`.
  - يمكن لـ **Kimi** السؤال عن منطقة Moonshot API ‏(`api.moonshot.ai` مقابل
    `api.moonshot.cn`) ونموذج البحث على الويب الافتراضي لـ Kimi.
- سلوك نطاق الرسائل المباشرة في الإعداد الأوّلي المحلي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
- أسرع طريقة لأول دردشة: `openclaw dashboard` ‏(واجهة Control، من دون إعداد قناة).
- Custom Provider: اربط أي نقطة نهاية متوافقة مع OpenAI أو Anthropic،
  بما في ذلك المزوّدات المستضافة غير المدرجة. استخدم Unknown للاكتشاف التلقائي.

## أوامر متابعة شائعة

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
لا يعني `--json` تفعيل الوضع غير التفاعلي. استخدم `--non-interactive` للنصوص البرمجية.
</Note>
