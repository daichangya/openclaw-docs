---
read_when:
    - دمج الأدوات التي تتوقع OpenAI Chat Completions
summary: كشف نقطة نهاية HTTP متوافقة مع OpenAI من نوع `/v1/chat/completions` من Gateway
title: إكمالات دردشة OpenAI
x-i18n:
    generated_at: "2026-04-25T13:48:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

يمكن لـ Gateway في OpenClaw تقديم نقطة نهاية صغيرة متوافقة مع OpenAI Chat Completions.

تكون نقطة النهاية هذه **معطلة افتراضيًا**. فعّلها أولًا في الإعدادات.

- `POST /v1/chat/completions`
- المنفذ نفسه الخاص بـ Gateway (تعدد WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

عند تمكين واجهة HTTP المتوافقة مع OpenAI في Gateway، فإنها تقدّم أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

في الخلفية، تُنفَّذ الطلبات كتشغيل وكيل Gateway عادي (المسار البرمجي نفسه مثل `openclaw agent`)، لذا فإن التوجيه/الأذونات/الإعدادات تتطابق مع Gateway الخاصة بك.

## المصادقة

تستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  `Authorization: Bearer <token-or-password>`
- مصادقة HTTP الموثوقة الحاملة للهوية (`gateway.auth.mode="trusted-proxy"`):
  وجّه الحركة عبر الوكيل المُدرك للهوية والمُعدّ ودعه يحقن
  ترويسات الهوية المطلوبة
- مصادقة مفتوحة عبر إدخال خاص (`gateway.auth.mode="none"`):
  لا حاجة إلى ترويسة مصادقة

ملاحظات:

- عندما تكون `gateway.auth.mode="token"`، استخدم `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
- عندما تكون `gateway.auth.mode="password"`، استخدم `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
- عندما تكون `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر وكيل موثوق غير loopback مُعدّ؛ ولا تلبّي الوكلاء على loopback على المضيف نفسه
  هذا الوضع.
- إذا كانت `gateway.auth.rateLimit` مُعدّة وحدث عدد كبير جدًا من إخفاقات المصادقة، فستعيد نقطة النهاية `429` مع `Retry-After`.

## حد الأمان (مهم)

تعامل مع نقطة النهاية هذه باعتبارها واجهة **وصول كاملة على مستوى المشغّل** لنسخة gateway.

- مصادقة HTTP bearer هنا ليست نموذج نطاق ضيق لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway صالحة لهذه النقطة كما لو كانت بيانات اعتماد مالك/مشغّل.
- تمر الطلبات عبر مسار وكيل مستوى التحكم نفسه مثل إجراءات المشغّل الموثوق.
- لا يوجد حد أدوات منفصل لغير المالك/لكل مستخدم على هذه النقطة؛ فبمجرد أن يجتاز المستدعي مصادقة Gateway هنا، يعامل OpenClaw ذلك المستدعي كمشغّل موثوق لهذه gateway.
- بالنسبة إلى أوضاع مصادقة السر المشترك (`token` و`password`)، تعيد نقطة النهاية القيم الافتراضية الكاملة للمشغّل حتى إذا أرسل المستدعي ترويسة `x-openclaw-scopes` أضيق.
- تحترم أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة trusted proxy أو `gateway.auth.mode="none"`) الترويسة `x-openclaw-scopes` عند وجودها، وإلا فإنها ترجع إلى مجموعة نطاقات المشغّل الافتراضية العادية.
- إذا كانت سياسة الوكيل المستهدف تسمح بأدوات حساسة، فيمكن لهذه النقطة استخدامها.
- أبقِ نقطة النهاية هذه على loopback أو tailnet أو إدخال خاص فقط؛ ولا تكشفها مباشرة إلى الإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك السر المشترك لمشغّل gateway
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    `operator.admin` و`operator.approvals` و`operator.pairing`،
    `operator.read` و`operator.talk.secrets` و`operator.write`
  - يعامل أدوار الدردشة على هذه النقطة كأدوار مرسل-مالك
- أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة trusted proxy أو `gateway.auth.mode="none"` على إدخال خاص)
  - تصادق على بعض حدود الهوية الموثوقة الخارجية أو حدود النشر
  - تحترم `x-openclaw-scopes` عندما تكون الترويسة موجودة
  - ترجع إلى مجموعة نطاقات المشغّل الافتراضية العادية عند غياب الترويسة
  - لا تفقد دلالات المالك إلا عندما يضيّق المستدعي النطاقات صراحةً ويحذف `operator.admin`

راجع [الأمان](/ar/gateway/security) و[الوصول البعيد](/ar/gateway/remote).

## عقد النموذج القائم على الوكيل

يعامل OpenClaw حقل OpenAI `model` على أنه **هدف وكيل**، وليس معرّف نموذج مزوّد خام.

- يوجّه `model: "openclaw"` إلى الوكيل الافتراضي المُعدّ.
- يوجّه `model: "openclaw/default"` أيضًا إلى الوكيل الافتراضي المُعدّ.
- يوجّه `model: "openclaw/<agentId>"` إلى وكيل محدد.

ترويسات طلب اختيارية:

- يتجاوز `x-openclaw-model: <provider/model-or-bare-id>` النموذج الخلفي للوكيل المحدد.
- لا يزال `x-openclaw-agent-id: <agentId>` مدعومًا كتجاوز توافق.
- يتحكم `x-openclaw-session-key: <sessionKey>` بالكامل في توجيه الجلسة.
- يعيّن `x-openclaw-message-channel: <channel>` سياق قناة دخول اصطناعيًا للمطالبات والسياسات المدركة للقنوات.

أسماء مستعارة للتوافق ما تزال مقبولة:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## تمكين نقطة النهاية

اضبط `gateway.http.endpoints.chatCompletions.enabled` إلى `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## تعطيل نقطة النهاية

اضبط `gateway.http.endpoints.chatCompletions.enabled` إلى `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## سلوك الجلسة

افتراضيًا تكون نقطة النهاية **عديمة الحالة لكل طلب** (يتم إنشاء مفتاح جلسة جديد عند كل استدعاء).

إذا تضمّن الطلب سلسلة OpenAI `user`، فستشتق Gateway منها مفتاح جلسة ثابتًا، بحيث يمكن للمكالمات المتكررة مشاركة جلسة وكيل.

## لماذا تهم هذه الواجهة

هذه هي مجموعة التوافق الأعلى أثرًا لواجهات وأدوات مستضافة ذاتيًا:

- تتوقع معظم إعدادات Open WebUI وLobeChat وLibreChat المسار `/v1/models`.
- تتوقع العديد من أنظمة RAG المسار `/v1/embeddings`.
- يمكن لمعظم عملاء دردشة OpenAI الحاليين البدء عادةً من `/v1/chat/completions`.
- يفضّل المزيد من العملاء الأكثر أصلية للوكلاء بشكل متزايد `/v1/responses`.

## قائمة النماذج وتوجيه الوكيل

<AccordionGroup>
  <Accordion title="ماذا يعيد `/v1/models`؟">
    قائمة أهداف وكلاء OpenClaw.

    تكون المعرّفات المعادة هي `openclaw` و`openclaw/default` وإدخالات `openclaw/<agentId>`.
    استخدمها مباشرة كقيم OpenAI `model`.

  </Accordion>
  <Accordion title="هل يسرد `/v1/models` الوكلاء أم الوكلاء الفرعيين؟">
    إنه يسرد أهداف الوكلاء من المستوى الأعلى، وليس نماذج المزوّد الخلفية ولا الوكلاء الفرعيين.

    يظل الوكلاء الفرعيون طوبولوجيا تنفيذ داخلية. ولا يظهرون كنماذج وهمية.

  </Accordion>
  <Accordion title="لماذا يتم تضمين `openclaw/default`؟">
    `openclaw/default` هو الاسم المستعار الثابت للوكيل الافتراضي المُعدّ.

    وهذا يعني أن العملاء يمكنهم الاستمرار في استخدام معرّف واحد متوقع حتى لو تغيّر معرّف الوكيل الافتراضي الفعلي بين البيئات.

  </Accordion>
  <Accordion title="كيف أتجاوز النموذج الخلفي؟">
    استخدم `x-openclaw-model`.

    أمثلة:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    إذا حذفته، فسيعمل الوكيل المحدد بخيار النموذج المُعدّ العادي الخاص به.

  </Accordion>
  <Accordion title="كيف تنسجم التضمينات مع هذا العقد؟">
    يستخدم `/v1/embeddings` معرّفات `model` نفسها الخاصة بأهداف الوكلاء.

    استخدم `model: "openclaw/default"` أو `model: "openclaw/<agentId>"`.
    وعندما تحتاج إلى نموذج تضمين محدد، أرسله في `x-openclaw-model`.
    وبدون تلك الترويسة، يمر الطلب إلى إعداد التضمين العادي للوكيل المحدد.

  </Accordion>
</AccordionGroup>

## البث (SSE)

اضبط `stream: true` لتلقي Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- يكون كل سطر حدث بصيغة `data: <json>`
- ينتهي البث بـ `data: [DONE]`

## إعداد سريع لـ Open WebUI

لاتصال Open WebUI أساسي:

- عنوان URL الأساسي: `http://127.0.0.1:18789/v1`
- عنوان URL الأساسي لـ Docker على macOS: `http://host.docker.internal:18789/v1`
- مفتاح API: رمز Gateway bearer الخاص بك
- النموذج: `openclaw/default`

السلوك المتوقع:

- ينبغي أن يسرد `GET /v1/models` القيمة `openclaw/default`
- ينبغي أن يستخدم Open WebUI القيمة `openclaw/default` كمعرّف نموذج الدردشة
- إذا أردت مزوّد/نموذجًا خلفيًا محددًا لذلك الوكيل، فاضبط النموذج الافتراضي العادي للوكيل أو أرسل `x-openclaw-model`

فحص سريع:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

إذا أعاد ذلك `openclaw/default`، فيمكن لمعظم إعدادات Open WebUI الاتصال باستخدام عنوان URL الأساسي نفسه والرمز نفسه.

## أمثلة

بدون بث:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

مع البث:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

إدراج النماذج:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

جلب نموذج واحد:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

إنشاء تضمينات:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

ملاحظات:

- يعيد `/v1/models` أهداف وكلاء OpenClaw، وليس كتالوجات المزوّد الخام.
- تكون `openclaw/default` موجودة دائمًا بحيث يعمل معرّف ثابت واحد عبر البيئات.
- تنتمي تجاوزات المزوّد/النموذج الخلفية إلى `x-openclaw-model`، وليس إلى حقل OpenAI `model`.
- يدعم `/v1/embeddings` الحقل `input` كسلسلة نصية أو مصفوفة من السلاسل النصية.

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [OpenAI](/ar/providers/openai)
