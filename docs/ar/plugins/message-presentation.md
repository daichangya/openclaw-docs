---
read_when:
    - إضافة أو تعديل عرض بطاقات الرسائل أو الأزرار أو القوائم المنسدلة
    - بناء Plugin قناة يدعم الرسائل الصادرة الغنية
    - تغيير عرض أداة الرسائل أو إمكانيات التسليم
    - تصحيح انحدارات العرض الخاصة بالـ provider لبطاقات/كتل/مكونات الرسائل
summary: بطاقات الرسائل الدلالية والأزرار والقوائم المنسدلة والنص الاحتياطي وتلميحات التسليم لـ Plugins القنوات
title: عرض الرسائل
x-i18n:
    generated_at: "2026-04-22T04:25:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# عرض الرسائل

عرض الرسائل هو العقد المشترك في OpenClaw لواجهة الدردشة الغنية للرسائل الصادرة.
وهو يتيح للوكلاء وأوامر CLI وتدفقات الموافقة وPlugins وصف
هدف الرسالة مرة واحدة، بينما يقوم كل Plugin قناة بعرض أفضل شكل أصلي متاح لديه.

استخدم العرض لواجهة رسائل قابلة للنقل:

- أقسام النص
- نص سياق/تذييل صغير
- فواصل
- أزرار
- قوائم منسدلة
- عنوان البطاقة ونبرتها

لا تضف حقولًا أصلية جديدة خاصة بالـ provider مثل `components` في Discord أو `blocks` في Slack
أو `buttons` في Telegram أو `card` في Teams أو `card` في Feishu إلى
أداة الرسائل المشتركة. فهذه نواتج عرض يملكها Plugin القناة.

## العقد

يستورد مؤلفو Plugins العقد العام من:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

البنية:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

دلالات الأزرار:

- `value` هي قيمة إجراء تطبيق تُعاد عبر
  مسار التفاعل الحالي في القناة عندما تدعم القناة عناصر تحكم قابلة للنقر.
- `url` هو زر رابط. ويمكن أن يوجد من دون `value`.
- `label` مطلوب ويُستخدم أيضًا في النص الاحتياطي.
- `style` توجيهي. يجب على أدوات العرض تحويل الأنماط غير المدعومة إلى
  قيمة افتراضية آمنة، لا أن تفشل عملية الإرسال.

دلالات القوائم المنسدلة:

- `options[].value` هي قيمة التطبيق المحددة.
- `placeholder` توجيهي وقد تتجاهله القنوات التي لا تدعم
  القوائم المنسدلة أصلًا.
- إذا كانت القناة لا تدعم القوائم المنسدلة، فإن النص الاحتياطي يسرد التسميات.

## أمثلة للمنتِج

بطاقة بسيطة:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

زر رابط يعتمد على URL فقط:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

قائمة منسدلة:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

إرسال عبر CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

تسليم مع التثبيت:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

تسليم مع التثبيت باستخدام JSON صريح:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## عقد أداة العرض

تعلن Plugins القنوات دعم العرض في المهايئ الصادر الخاص بها:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

حقول الإمكانيات بسيطة عمدًا على شكل قيم منطقية. وهي تصف ما الذي
يمكن لأداة العرض جعله تفاعليًا، وليس كل حد أصلي في المنصة. وما تزال أدوات العرض
تملك الحدود الخاصة بكل منصة مثل العدد الأقصى للأزرار وعدد الكتل
وحجم البطاقة.

## تدفق العرض في Core

عندما يتضمن `ReplyPayload` أو إجراء رسالة ما `presentation`، فإن core:

1. يطبع حمولة العرض.
2. يحدد مهايئ الإرسال الصادر للقناة المستهدفة.
3. يقرأ `presentationCapabilities`.
4. يستدعي `renderPresentation` عندما يتمكن المهايئ من عرض الحمولة.
5. يعود إلى نص احتياطي محافظ عندما يكون المهايئ غائبًا أو غير قادر على العرض.
6. يرسل الحمولة الناتجة عبر مسار تسليم القناة العادي.
7. يطبق بيانات وصفية للتسليم مثل `delivery.pin` بعد أول
   رسالة تم إرسالها بنجاح.

يتولى core سلوك الاحتياط حتى تظل الجهات المنتجة غير مرتبطة بقناة بعينها. وتمتلك
Plugins القنوات العرض الأصلي ومعالجة التفاعل.

## قواعد التدرج

يجب أن يكون العرض آمنًا للإرسال على القنوات المحدودة.

يتضمن النص الاحتياطي:

- `title` كسطر أول
- كتل `text` على شكل فقرات عادية
- كتل `context` على شكل أسطر سياق مضغوطة
- كتل `divider` على شكل فاصل مرئي
- تسميات الأزرار، بما في ذلك عناوين URL لأزرار الروابط
- تسميات خيارات القوائم المنسدلة

يجب أن تتدرج عناصر التحكم الأصلية غير المدعومة بدلًا من أن تفشل عملية الإرسال بالكامل.
أمثلة:

- Telegram مع تعطيل الأزرار المضمنة يرسل نصًا احتياطيًا.
- القناة التي لا تدعم القوائم المنسدلة تسرد خياراتها كنص.
- زر يعتمد على URL فقط يصبح إما زر رابط أصليًا أو سطر URL احتياطيًا.
- لا تؤدي حالات فشل التثبيت الاختيارية إلى فشل الرسالة المرسلة.

الاستثناء الرئيسي هو `delivery.pin.required: true`؛ فإذا طُلب التثبيت بوصفه
مطلوبًا ولم تتمكن القناة من تثبيت الرسالة المرسلة، يبلغ التسليم عن فشل.

## ربط الـ provider

أدوات العرض المجمعة الحالية:

| القناة          | هدف العرض الأصلي                   | ملاحظات                                                                                                                                             |
| --------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components وحاويات المكونات        | يحافظ على `channelData.discord.components` القديم للجهات الحالية المنتجة للحمولات الأصلية الخاصة بالـ provider، لكن يجب أن تستخدم عمليات الإرسال المشتركة الجديدة `presentation`. |
| Slack           | Block Kit                          | يحافظ على `channelData.slack.blocks` القديم للجهات الحالية المنتجة للحمولات الأصلية الخاصة بالـ provider، لكن يجب أن تستخدم عمليات الإرسال المشتركة الجديدة `presentation`.       |
| Telegram        | نص بالإضافة إلى inline keyboards   | تتطلب الأزرار/القوائم المنسدلة إمكانية الأزرار المضمنة في السطح المستهدف؛ وإلا يُستخدم النص الاحتياطي.                                            |
| Mattermost      | نص بالإضافة إلى props تفاعلية      | تتدرج الكتل الأخرى إلى نص.                                                                                                                          |
| Microsoft Teams | Adaptive Cards                     | يُضمَّن نص `message` العادي مع البطاقة عندما يتم توفير الاثنين معًا.                                                                               |
| Feishu          | بطاقات تفاعلية                     | يمكن أن يستخدم رأس البطاقة `title`؛ ويتجنب المتن تكرار ذلك العنوان.                                                                               |
| القنوات العادية | نص احتياطي                         | ما تزال القنوات التي لا تملك أداة عرض تحصل على ناتج قابل للقراءة.                                                                                 |

يُعد توافق الحمولات الأصلية الخاصة بالـ provider وسيلة انتقالية
للجهات الحالية المنتجة للردود. وليس سببًا لإضافة حقول أصلية مشتركة جديدة.

## Presentation مقابل InteractiveReply

يُعد `InteractiveReply` المجموعة الداخلية الأقدم المستخدمة بواسطة الموافقة ومساعدات
التفاعل. وهو يدعم:

- النص
- الأزرار
- القوائم المنسدلة

أما `MessagePresentation` فهو عقد الإرسال المشترك القياسي. ويضيف:

- العنوان
- النبرة
- السياق
- الفاصل
- الأزرار المعتمدة على URL فقط
- بيانات وصفية عامة للتسليم عبر `ReplyPayload.delivery`

استخدم المساعدات من `openclaw/plugin-sdk/interactive-runtime` عند الربط مع
الشفرة الأقدم:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

يجب أن تقبل الشفرة الجديدة `MessagePresentation` مباشرة أو تنتجه مباشرة.

## تثبيت التسليم

التثبيت هو سلوك تسليم، وليس عرضًا. استخدم `delivery.pin` بدلًا من
الحقول الأصلية الخاصة بالـ provider مثل `channelData.telegram.pin`.

الدلالات:

- `pin: true` يثبت أول رسالة تم تسليمها بنجاح.
- القيمة الافتراضية لـ `pin.notify` هي `false`.
- القيمة الافتراضية لـ `pin.required` هي `false`.
- تتدرج حالات فشل التثبيت الاختيارية وتبقي الرسالة المرسلة كما هي.
- تؤدي حالات فشل التثبيت المطلوبة إلى فشل التسليم.
- في الرسائل المقسمة إلى مقاطع، يتم تثبيت أول مقطع مُسلَّم، وليس المقطع الأخير.

ما تزال إجراءات الرسائل اليدوية `pin` و`unpin` و`pins` موجودة
للرسائل الحالية التي يدعم فيها الـ provider تلك العمليات.

## قائمة التحقق لمؤلف Plugin

- صرّح بـ `presentation` من `describeMessageTool(...)` عندما تتمكن القناة من
  عرض العرض الدلالي أو تدرجه بأمان.
- أضف `presentationCapabilities` إلى مهايئ الإرسال الصادر في وقت التشغيل.
- نفّذ `renderPresentation` في شيفرة وقت التشغيل، وليس في شيفرة
  إعداد Plugin في مستوى التحكم.
- أبقِ مكتبات واجهة المستخدم الأصلية خارج مسارات الإعداد/الفهرسة الساخنة.
- حافظ على حدود المنصة في أداة العرض والاختبارات.
- أضف اختبارات احتياطية للأزرار غير المدعومة والقوائم المنسدلة غير المدعومة وأزرار URL
  وتكرار العنوان/النص وعمليات الإرسال المختلطة بين `message` و`presentation`.
- أضف دعم تثبيت التسليم عبر `deliveryCapabilities.pin` و
  `pinDeliveredMessage` فقط عندما يتمكن الـ provider من تثبيت معرّف الرسالة المرسلة.
- لا تكشف حقولًا أصلية جديدة خاصة بالـ provider للبطاقات/الكتل/المكونات/الأزرار عبر
  مخطط إجراء الرسائل المشترك.

## مستندات ذات صلة

- [رسائل CLI](/cli/message)
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [معمارية Plugin](/ar/plugins/architecture#message-tool-schemas)
- [خطة إعادة هيكلة عرض القنوات](/ar/plan/ui-channels)
