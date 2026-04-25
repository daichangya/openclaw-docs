---
read_when:
    - دمج العملاء الذين يتحدثون واجهة OpenResponses API
    - أنت تريد مدخلات قائمة على العناصر، أو استدعاءات أدوات من العميل، أو أحداث SSE
summary: عرض نقطة نهاية HTTP متوافقة مع OpenResponses عند `/v1/responses` من Gateway
title: واجهة OpenResponses API
x-i18n:
    generated_at: "2026-04-25T13:48:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

يمكن لـ Gateway في OpenClaw تقديم نقطة نهاية `POST /v1/responses` متوافقة مع OpenResponses.

تكون نقطة النهاية هذه **معطلة افتراضيًا**. فعّلها أولًا في الإعدادات.

- `POST /v1/responses`
- المنفذ نفسه الخاص بـ Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

في الخلفية، تُنفَّذ الطلبات كتشغيل وكيل عادي في Gateway (مسار الشيفرة نفسه المستخدم في
`openclaw agent`)، لذا فإن التوجيه/الأذونات/الإعدادات تتطابق مع Gateway لديك.

## المصادقة والأمان والتوجيه

يتطابق السلوك التشغيلي مع [OpenAI Chat Completions](/ar/gateway/openai-http-api):

- استخدم مسار مصادقة HTTP المطابق في Gateway:
  - مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`): ‏`Authorization: Bearer <token-or-password>`
  - مصادقة الوكيل الموثوق (`gateway.auth.mode="trusted-proxy"`): ترويسات وكيل مدركة للهوية من مصدر وكيل موثوق غير loopback ومهيأ
  - مصادقة ingress الخاص المفتوحة (`gateway.auth.mode="none"`): بدون ترويسة مصادقة
- تعامل مع نقطة النهاية على أنها وصول مشغّل كامل إلى مثيل Gateway
- بالنسبة إلى أوضاع مصادقة السر المشترك (`token` و`password`)، تجاهل قيم `x-openclaw-scopes` الأضيق التي يعلنها Bearer وأعد القيم الافتراضية الكاملة المعتادة للمشغّل
- بالنسبة إلى أوضاع HTTP الموثوقة الحاملة للهوية (على سبيل المثال مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"`)، احترم `x-openclaw-scopes` عند وجودها، وإلا فارجع إلى مجموعة النطاقات الافتراضية العادية للمشغّل
- حدّد الوكلاء باستخدام `model: "openclaw"`، أو `model: "openclaw/default"`، أو `model: "openclaw/<agentId>"`، أو `x-openclaw-agent-id`
- استخدم `x-openclaw-model` عندما تريد تجاوز نموذج الواجهة الخلفية الخاص بالوكيل المحدد
- استخدم `x-openclaw-session-key` من أجل توجيه جلسة صريح
- استخدم `x-openclaw-message-channel` عندما تريد سياق قناة دخول اصطناعي غير افتراضي

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + ‏`Authorization: Bearer ...`
  - يثبت حيازة السر المشترك لمشغّل Gateway
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يعيد مجموعة النطاقات الافتراضية الكاملة للمشغّل:
    `operator.admin`، و`operator.approvals`، و`operator.pairing`،
    و`operator.read`، و`operator.talk.secrets`، و`operator.write`
  - يتعامل مع أدوار الدردشة على نقطة النهاية هذه على أنها أدوار مرسل مالك
- أوضاع HTTP الموثوقة الحاملة للهوية (على سبيل المثال مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على ingress خاص)
  - تحترم `x-openclaw-scopes` عند وجود الترويسة
  - ترجع إلى مجموعة النطاقات الافتراضية العادية للمشغّل عند غياب الترويسة
  - لا تفقد دلالات المالك إلا عندما يضيّق المستدعي النطاقات صراحةً ويحذف `operator.admin`

فعّل نقطة النهاية هذه أو عطّلها باستخدام `gateway.http.endpoints.responses.enabled`.

يتضمن سطح التوافق نفسه أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

للحصول على الشرح المرجعي لكيفية توافق النماذج الموجهة إلى الوكيل، و`openclaw/default`، وتمرير embeddings، وتجاوزات نماذج الواجهة الخلفية معًا، راجع [OpenAI Chat Completions](/ar/gateway/openai-http-api#agent-first-model-contract) و[قائمة النماذج وتوجيه الوكيل](/ar/gateway/openai-http-api#model-list-and-agent-routing).

## سلوك الجلسة

افتراضيًا تكون نقطة النهاية **عديمة الحالة لكل طلب** (يتم إنشاء مفتاح جلسة جديد في كل استدعاء).

إذا تضمّن الطلب سلسلة `user` الخاصة بـ OpenResponses، فسيشتق Gateway مفتاح جلسة ثابتًا
منها، بحيث يمكن للطلبات المتكررة مشاركة جلسة وكيل واحدة.

## شكل الطلب (المدعوم)

يتبع الطلب واجهة OpenResponses API بمدخلات قائمة على العناصر. الدعم الحالي:

- `input`: سلسلة نصية أو مصفوفة من كائنات العناصر.
- `instructions`: تُدمج داخل مطالبة النظام.
- `tools`: تعريفات أدوات العميل (أدوات function).
- `tool_choice`: تصفية أدوات العميل أو اشتراطها.
- `stream`: يفعّل بث SSE.
- `max_output_tokens`: حد تقريبي للمخرجات (يعتمد على المزوّد).
- `user`: توجيه جلسة ثابت.

مقبولة ولكن **يتم تجاهلها حاليًا**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

مدعوم:

- `previous_response_id`: يعيد OpenClaw استخدام جلسة الاستجابة السابقة عندما يبقى الطلب ضمن نطاق الوكيل/المستخدم/الجلسة المطلوبة نفسه.

## العناصر (`input`)

### `message`

الأدوار: `system`، و`developer`، و`user`، و`assistant`.

- تتم إضافة `system` و`developer` إلى مطالبة النظام.
- يصبح أحدث عنصر `user` أو `function_call_output` هو "الرسالة الحالية".
- يتم تضمين رسائل user/assistant الأقدم كسجل من أجل السياق.

### `function_call_output` (أدوات قائمة على الدور)

أرسل نتائج الأداة مرة أخرى إلى النموذج:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` و`item_reference`

مقبولان من أجل توافق المخطط لكن يتم تجاهلهما عند بناء المطالبة.

## الأدوات (أدوات function من جهة العميل)

وفّر الأدوات باستخدام `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

إذا قرر الوكيل استدعاء أداة، فستعيد الاستجابة عنصر مخرجات من نوع `function_call`.
بعد ذلك ترسل طلب متابعة يتضمن `function_call_output` لمتابعة الدور.

## الصور (`input_image`)

يدعم مصادر base64 أو URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

أنواع MIME المسموح بها (حاليًا): `image/jpeg`، و`image/png`، و`image/gif`، و`image/webp`، و`image/heic`، و`image/heif`.
الحد الأقصى للحجم (حاليًا): 10MB.

## الملفات (`input_file`)

يدعم مصادر base64 أو URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

أنواع MIME المسموح بها (حاليًا): `text/plain`، و`text/markdown`، و`text/html`، و`text/csv`،
و`application/json`، و`application/pdf`.

الحد الأقصى للحجم (حاليًا): 5MB.

السلوك الحالي:

- يتم فك ترميز محتوى الملف وإضافته إلى **مطالبة النظام**، وليس إلى رسالة المستخدم،
  بحيث يبقى مؤقتًا (ولا يُحفَظ في سجل الجلسة).
- يتم تغليف نص الملف المفكوك على أنه **محتوى خارجي غير موثوق** قبل إضافته،
  لذا يتم التعامل مع بايتات الملف على أنها بيانات، وليس تعليمات موثوقة.
- تستخدم الكتلة المحقونة علامات حدود صريحة مثل
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن
  سطر بيانات وصفية `Source: External`.
- يتعمد مسار إدخال الملف هذا حذف شعار `SECURITY NOTICE:` الطويل
  للحفاظ على ميزانية المطالبة؛ وتظل علامات الحدود والبيانات الوصفية موجودة.
- يتم تحليل ملفات PDF لاستخراج النص أولًا. وإذا تم العثور على نص قليل، فسيتم
  تحويل الصفحات الأولى إلى صور وتمريرها إلى النموذج، وتستخدم كتلة الملف المحقونة
  العنصر النائب `[PDF content rendered to images]`.

يتم توفير تحليل PDF بواسطة Plugin المضمّن `document-extract`، الذي يستخدم
البنية القديمة الملائمة لـ Node من `pdfjs-dist` (من دون worker). أما البنية الحديثة لـ PDF.js
فتتوقع browser workers/متغيرات DOM عامة، لذلك لا تُستخدم في Gateway.

الإعدادات الافتراضية لجلب URL:

- `files.allowUrl`: ‏`true`
- `images.allowUrl`: ‏`true`
- `maxUrlParts`: ‏`8` (إجمالي أجزاء `input_file` + `input_image` المعتمدة على URL لكل طلب)
- الطلبات محمية (حل DNS، وحظر IPات الخاصة، وحدود إعادة التوجيه، والمهلات).
- قوائم سماح أسماء المضيف الاختيارية مدعومة لكل نوع إدخال (`files.urlAllowlist`، و`images.urlAllowlist`).
  - مضيف مطابق تمامًا: `"cdn.example.com"`
  - نطاقات فرعية ببطاقة عامة: `"*.assets.example.com"` (لا تطابق apex)
  - قوائم السماح الفارغة أو غير الموجودة تعني عدم وجود قيد على أسماء المضيفين.
- لتعطيل الجلب القائم على URL بالكامل، اضبط `files.allowUrl: false` و/أو `images.allowUrl: false`.

## حدود الملفات + الصور (الإعدادات)

يمكن ضبط القيم الافتراضية ضمن `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

القيم الافتراضية عند الحذف:

- `maxBodyBytes`: ‏20MB
- `maxUrlParts`: ‏8
- `files.maxBytes`: ‏5MB
- `files.maxChars`: ‏200k
- `files.maxRedirects`: ‏3
- `files.timeoutMs`: ‏10s
- `files.pdf.maxPages`: ‏4
- `files.pdf.maxPixels`: ‏4,000,000
- `files.pdf.minTextChars`: ‏200
- `images.maxBytes`: ‏10MB
- `images.maxRedirects`: ‏3
- `images.timeoutMs`: ‏10s
- تُقبل مصادر `input_image` من نوع HEIC/HEIF وتُسوّى إلى JPEG قبل التسليم إلى المزوّد.

ملاحظة أمان:

- يتم فرض قوائم السماح لعناوين URL قبل الجلب وعبر قفزات إعادة التوجيه.
- لا يؤدي السماح باسم مضيف إلى تجاوز حظر عناوين IP الخاصة/الداخلية.
- بالنسبة إلى Gateways المعروضة على الإنترنت، طبّق ضوابط خروج الشبكة بالإضافة إلى الضوابط على مستوى التطبيق.
  راجع [الأمان](/ar/gateway/security).

## البث (SSE)

اضبط `stream: true` لتلقي أحداث مرسلة من الخادم (SSE):

- `Content-Type: text/event-stream`
- كل سطر حدث يكون بصيغة `event: <type>` و`data: <json>`
- ينتهي البث بـ `data: [DONE]`

أنواع الأحداث التي يتم إرسالها حاليًا:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (عند الخطأ)

## الاستخدام

يتم تعبئة `usage` عندما يبلّغ المزوّد الأساسي عن عدد الرموز. يقوم OpenClaw
بتسوية الأسماء المستعارة الشائعة على نمط OpenAI قبل أن تصل هذه العدادات
إلى واجهات الحالة/الجلسة downstream، بما في ذلك `input_tokens` / `output_tokens`
و`prompt_tokens` / `completion_tokens`.

## الأخطاء

تستخدم الأخطاء كائن JSON مثل:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

حالات شائعة:

- `401` مصادقة مفقودة/غير صالحة
- `400` جسم طلب غير صالح
- `405` طريقة غير صحيحة

## أمثلة

بدون بث:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

مع البث:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## ذو صلة

- [OpenAI chat completions](/ar/gateway/openai-http-api)
- [OpenAI](/ar/providers/openai)
