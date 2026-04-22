---
read_when:
    - إعادة هيكلة واجهة رسائل القنوات، أو الحمولات التفاعلية، أو عارِضات القنوات الأصلية
    - تغيير إمكانات أداة الرسائل، أو تلميحات التسليم، أو علامات السياق المتقاطع
    - تصحيح تفرع استيراد Discord Carbon أو كسل وقت تشغيل Plugin القناة
summary: فصل العرض الدلالي للرسائل عن عارِضات واجهة المستخدم الأصلية للقنوات.
title: خطة إعادة هيكلة عرض القنوات
x-i18n:
    generated_at: "2026-04-22T04:24:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# خطة إعادة هيكلة عرض القنوات

## الحالة

تم التنفيذ لسطحيات الوكيل المشتركة وCLI وإمكانات Plugin ومسارات التسليم الصادر:

- يحمل `ReplyPayload.presentation` واجهة الرسائل الدلالية.
- يحمل `ReplyPayload.delivery.pin` طلبات تثبيت الرسائل المرسلة.
- تعرض إجراءات الرسائل المشتركة `presentation` و`delivery` و`pin` بدلًا من `components` أو `blocks` أو `buttons` أو `card` الخاصة بالمزوّد.
- يعرض Core أو يخفّض العرض تلقائيًا عبر إمكانات الإرسال الصادر المعلنة من Plugin.
- تستهلك عارِضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu العقد العام.
- لم يعد كود مستوى التحكم في قناة Discord يستورد حاويات واجهة مستخدم مدعومة بـ Carbon.

توجد الوثائق المرجعية الآن في [عرض الرسائل](/ar/plugins/message-presentation).
احتفِظ بهذه الخطة كسياق تنفيذ تاريخي؛ وحدّث الدليل المرجعي
عند تغيّر العقد أو العارِض أو سلوك الرجوع الاحتياطي.

## المشكلة

تنقسم واجهة القنوات حاليًا عبر عدة سطوح غير متوافقة:

- يمتلك Core خطاف عارِض سياق متقاطع بشكل Discord عبر `buildCrossContextComponents`.
- يمكن لـ `channel.ts` في Discord استيراد واجهة مستخدم أصلية عبر `DiscordUiContainer`، ما يسحب تبعيات واجهة مستخدم وقت التشغيل إلى مستوى التحكم في Plugin القناة.
- يعرض الوكيل وCLI منافذ هروب للحمولات الأصلية مثل Discord `components` وSlack `blocks` وTelegram أو Mattermost `buttons` وTeams أو Feishu `card`.
- يحمل `ReplyPayload.channelData` كلًا من تلميحات النقل ومغلفات الواجهة الأصلية.
- يوجد نموذج `interactive` العام، لكنه أضيق من التخطيطات الأغنى المستخدمة بالفعل في Discord وSlack وTeams وFeishu وLINE وTelegram وMattermost.

وهذا يجعل Core مدركًا لأشكال الواجهة الأصلية، ويضعف كسل وقت تشغيل Plugin، ويمنح الوكلاء عددًا كبيرًا جدًا من الطرق الخاصة بالمزوّد للتعبير عن نية الرسالة نفسها.

## الأهداف

- يقرر Core أفضل عرض دلالي للرسالة انطلاقًا من الإمكانات المعلنة.
- تعلن الامتدادات الإمكانات وتحوّل العرض الدلالي إلى حمولة نقل أصلية.
- تبقى واجهة Web Control منفصلة عن واجهة الدردشة الأصلية.
- لا يتم كشف الحمولات الأصلية للقنوات عبر سطح الرسائل المشترك في الوكيل أو CLI.
- يتم تخفيض ميزات العرض غير المدعومة تلقائيًا إلى أفضل تمثيل نصي.
- يكون سلوك التسليم مثل تثبيت رسالة مرسلة بيانات تعريف عامة للتسليم، وليس عرضًا.

## غير الأهداف

- لا توجد طبقة توافق خلفي لـ `buildCrossContextComponents`.
- لا توجد منافذ هروب أصلية عامة لـ `components` أو `blocks` أو `buttons` أو `card`.
- لا توجد استيرادات في Core لمكتبات واجهة المستخدم الأصلية للقنوات.
- لا توجد طبقات SDK خاصة بالمزوّد للقنوات المضمّنة.

## النموذج المستهدف

أضف حقل `presentation` يملكه Core إلى `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

يصبح `interactive` مجموعة فرعية من `presentation` أثناء الترحيل:

- تتحول كتلة النص في `interactive` إلى `presentation.blocks[].type = "text"`.
- تتحول كتلة الأزرار في `interactive` إلى `presentation.blocks[].type = "buttons"`.
- تتحول كتلة الاختيار في `interactive` إلى `presentation.blocks[].type = "select"`.

تستخدم مخططات الوكيل الخارجي وCLI الآن `presentation`؛ ويظل `interactive` محللًا/مساعد عرض قديمًا داخليًا لمنتجي الردود الحاليين.

## بيانات تعريف التسليم

أضف حقل `delivery` يملكه Core لسلوك الإرسال الذي لا يتعلق بالواجهة.

```ts
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

الدلالات:

- تعني `delivery.pin = true` تثبيت أول رسالة تم تسليمها بنجاح.
- القيمة الافتراضية لـ `notify` هي `false`.
- القيمة الافتراضية لـ `required` هي `false`؛ وتُخفَّض القنوات غير المدعومة أو فشل التثبيت تلقائيًا عبر متابعة التسليم.
- تبقى إجراءات الرسائل اليدوية `pin` و`unpin` و`list-pins` للرسائل الموجودة.

يجب نقل ربط موضوع ACP الحالي في Telegram من `channelData.telegram.pin = true` إلى `delivery.pin = true`.

## عقد إمكانات وقت التشغيل

أضف خطافات العرض والتسليم الخاصة بـ presentation إلى محوّل الإرسال الصادر في وقت التشغيل، وليس إلى Plugin القناة على مستوى التحكم.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

سلوك Core:

- حل القناة المستهدفة ومحوّل وقت التشغيل.
- طلب إمكانات العرض.
- تخفيض الكتل غير المدعومة قبل العرض.
- استدعاء `renderPresentation`.
- إذا لم يوجد عارِض، تحويل العرض إلى نص احتياطي.
- بعد الإرسال الناجح، استدعاء `pinDeliveredMessage` عند طلب `delivery.pin` ووجود الدعم.

## ربط القنوات

Discord:

- اعرض `presentation` إلى components v2 وحاويات Carbon في وحدات وقت التشغيل فقط.
- أبقِ مساعدات ألوان التمييز في وحدات خفيفة.
- أزل استيرادات `DiscordUiContainer` من كود مستوى التحكم في Plugin القناة.

Slack:

- اعرض `presentation` إلى Block Kit.
- أزل إدخال `blocks` من الوكيل وCLI.

Telegram:

- اعرض النص والسياق والفواصل كنص.
- اعرض الإجراءات والاختيار كلوحات مفاتيح مضمنة عند التكوين والسماح بها للسطح المستهدف.
- استخدم النص الاحتياطي عندما تكون الأزرار المضمنة معطلة.
- انقل تثبيت موضوع ACP إلى `delivery.pin`.

Mattermost:

- اعرض الإجراءات كأزرار تفاعلية عند التكوين.
- اعرض الكتل الأخرى كنص احتياطي.

MS Teams:

- اعرض `presentation` إلى Adaptive Cards.
- أبقِ إجراءات `pin` و`unpin` و`list-pins` اليدوية.
- نفّذ `pinDeliveredMessage` اختياريًا إذا كان دعم Graph موثوقًا للمحادثة المستهدفة.

Feishu:

- اعرض `presentation` إلى بطاقات تفاعلية.
- أبقِ إجراءات `pin` و`unpin` و`list-pins` اليدوية.
- نفّذ `pinDeliveredMessage` اختياريًا لتثبيت الرسالة المرسلة إذا كان سلوك API موثوقًا.

LINE:

- اعرض `presentation` إلى رسائل Flex أو template حيثما أمكن.
- ارجع إلى النص للكتل غير المدعومة.
- أزل حمولات واجهة LINE من `channelData`.

القنوات النصية أو المحدودة:

- حوّل العرض إلى نص مع تنسيق محافظ.

## خطوات إعادة الهيكلة

1. أعد تطبيق إصلاح إصدار Discord الذي يفصل `ui-colors.ts` عن واجهة المستخدم المدعومة بـ Carbon ويزيل `DiscordUiContainer` من `extensions/discord/src/channel.ts`.
2. أضف `presentation` و`delivery` إلى `ReplyPayload` وتطبيع الحمولات الصادرة وملخصات التسليم وحمولات الخطافات.
3. أضف مخطط `MessagePresentation` ومساعدات المحلل في مسار فرعي ضيق من SDK/وقت التشغيل.
4. استبدل إمكانات الرسائل `buttons` و`cards` و`components` و`blocks` بإمكانات عرض دلالية.
5. أضف خطافات محوّل الإرسال الصادر في وقت التشغيل لعرض presentation وتثبيت التسليم.
6. استبدل بناء المكوّنات عبر السياق بـ `buildCrossContextPresentation`.
7. احذف `src/infra/outbound/channel-adapters.ts` وأزل `buildCrossContextComponents` من أنواع Plugin القناة.
8. غيّر `maybeApplyCrossContextMarker` لإرفاق `presentation` بدلًا من المعلمات الأصلية.
9. حدّث مسارات إرسال توزيع Plugin لاستهلاك العرض الدلالي وبيانات تعريف التسليم فقط.
10. أزل معلمات الحمولات الأصلية من الوكيل وCLI: ‏`components` و`blocks` و`buttons` و`card`.
11. أزل مساعدات SDK التي تنشئ مخططات أدوات رسائل أصلية، واستبدلها بمساعدات مخططات presentation.
12. أزل مغلفات الواجهة/الأصلية من `channelData`؛ وأبقِ فقط بيانات تعريف النقل حتى تتم مراجعة كل حقل متبقٍ.
13. رحّل عارِضات Discord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE.
14. حدّث الوثائق الخاصة برسائل CLI وصفحات القنوات وPlugin SDK وكتاب وصفات الإمكانات.
15. شغّل تحليل تفرع الاستيراد لـ Discord ونقاط دخول القنوات المتأثرة.

تم تنفيذ الخطوات 1-11 و13-14 في إعادة الهيكلة هذه لأسطح الوكيل المشترك وCLI وإمكانات Plugin وعقود محوّل الإرسال الصادر. وتبقى الخطوة 12 جولة تنظيف داخلية أعمق لمغلفات نقل `channelData` الخاصة والمغلقة على المزوّد. وتبقى الخطوة 15 تحققًا لاحقًا إذا أردنا أرقامًا كمية لتفرع الاستيراد تتجاوز بوابة النوع/الاختبار.

## الاختبارات

أضف أو حدّث:

- اختبارات تطبيع presentation.
- اختبارات التخفيض التلقائي لـ presentation للكتل غير المدعومة.
- اختبارات علامات السياق المتقاطع لمسارات توزيع Plugin ومسارات التسليم الأساسية.
- اختبارات مصفوفة عرض القنوات لـ Discord وSlack وTelegram وMattermost وMS Teams وFeishu وLINE والنص الاحتياطي.
- اختبارات مخطط أداة الرسائل التي تثبت اختفاء الحقول الأصلية.
- اختبارات CLI التي تثبت اختفاء العلامات الأصلية.
- تراجع كسل استيراد نقطة دخول Discord الذي يغطي Carbon.
- اختبارات تثبيت التسليم التي تغطي Telegram والرجوع الاحتياطي العام.

## الأسئلة المفتوحة

- هل يجب تنفيذ `delivery.pin` لـ Discord وSlack وMS Teams وFeishu في الدفعة الأولى، أم Telegram فقط أولًا؟
- هل يجب أن يستوعب `delivery` في النهاية حقولًا موجودة مثل `replyToId` و`replyToCurrent` و`silent` و`audioAsVoice`، أم يبقى مركزًا على سلوكيات ما بعد الإرسال؟
- هل يجب أن يدعم presentation الصور أو مراجع الملفات مباشرة، أم ينبغي أن تبقى الوسائط منفصلة عن تخطيط الواجهة في الوقت الحالي؟
