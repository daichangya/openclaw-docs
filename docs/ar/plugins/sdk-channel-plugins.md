---
read_when:
    - أنت تبني Plugin قناة مراسلة جديدة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم سطح المهايئ ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin قناة مراسلة لـ OpenClaw
title: بناء Plugins القنوات
x-i18n:
    generated_at: "2026-04-22T04:25:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# بناء Plugins القنوات

يرشدك هذا الدليل خلال بناء Plugin قناة يربط OpenClaw بمنصة
مراسلة. وبنهاية هذا الدليل سيكون لديك قناة عاملة مع أمان الرسائل المباشرة،
والاقتران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ أولًا
  [البدء](/ar/plugins/building-plugins) لمعرفة بنية الحزمة الأساسية
  وإعداد البيان.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات send/edit/react خاصة بها. يحتفظ OpenClaw
بأداة `message` مشتركة واحدة في Core. ويتولى Plugin الخاص بك ما يلي:

- **التكوين** — حل الحسابات ومعالج الإعداد
- **الأمان** — سياسة الرسائل المباشرة وقوائم السماح
- **الاقتران** — تدفق الموافقة على الرسائل المباشرة
- **قواعد الجلسة** — كيفية ربط معرّفات المحادثات الخاصة بالمزوّد بالمحادثات الأساسية، ومعرّفات السلاسل، وعمليات الرجوع إلى الأصل
- **الصادر** — إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **التسلسل** — كيفية تسلسل الردود

يمتلك Core أداة الرسائل المشتركة، وتوصيل المطالبات، وشكل مفتاح الجلسة الخارجي،
وسجل `:thread:` العام، والتوزيع.

إذا كانت قناتك تضيف معلمات لأداة الرسائل تحمل مصادر وسائط، فاكشف أسماء
هذه المعلمات عبر `describeMessageTool(...).mediaSourceParams`. يستخدم Core هذه
القائمة الصريحة لتطبيع مسارات sandbox ولسياسة الوصول إلى الوسائط الصادرة،
بحيث لا تحتاج Plugins إلى حالات خاصة في Core المشتركة لمعلمات
الصورة الرمزية أو المرفقات أو صور الغلاف الخاصة بالمزوّد.
ويُفضَّل إرجاع خريطة مفهرسة بالمفاتيح الإجرائية مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير المرتبطة
معلمات الوسائط التابعة لإجراء آخر. وتظل المصفوفة المسطحة تعمل للمعلمات
المشتركة عمدًا بين كل الإجراءات المكشوفة.

إذا كانت منصتك تخزن نطاقًا إضافيًا داخل معرّفات المحادثات، فأبقِ هذا التحليل
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. فهذا هو الخطاف
المرجعي لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة الاختياري،
و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
وعندما تُرجع `parentConversationCandidates`، فأبقِ ترتيبها من
الأصل الأضيق إلى المحادثة الأساسية/الأوسع.

يمكن أيضًا للPlugins المضمّنة التي تحتاج إلى التحليل نفسه قبل إقلاع سجل
القنوات أن تكشف ملف `session-key-api.ts` على المستوى الأعلى مع
تصدير مطابق لـ `resolveSessionConversation(...)`.
يستخدم Core هذا السطح الآمن للإقلاع فقط عندما لا يكون سجل Plugins وقت التشغيل
متاحًا بعد.

يبقى `messaging.resolveParentConversationCandidates(...)` متاحًا كرجوع
توافقي قديم عندما يحتاج Plugin فقط إلى عمليات رجوع إلى الأصل فوق
المعرّف الخام/العام. وإذا وُجد الخطافان معًا، يستخدم Core
`resolveSessionConversation(...).parentConversationCandidates` أولًا ثم
لا يعود إلى `resolveParentConversationCandidates(...)` إلا عندما يحذفها
الخطاف المرجعي.

## الموافقات وإمكانات القناة

معظم Plugins القنوات لا تحتاج إلى كود خاص بالموافقات.

- يمتلك Core أمر `/approve` داخل المحادثة نفسها، وحمولات أزرار الموافقة المشتركة، وتسليم الرجوع الاحتياطي العام.
- فضّل كائن `approvalCapability` واحدًا على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق التسليم/الواجهة الأصلية/العرض/المصادقة الخاصة بالموافقة في `approvalCapability`.
- `plugin.auth` مخصص لتسجيل الدخول/الخروج فقط؛ ولم يعد Core يقرأ خطافات مصادقة الموافقة من ذلك الكائن.
- يشكل `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` طبقة مصادقة الموافقة المرجعية.
- استخدم `approvalCapability.getActionAvailabilityState` لتوفر مصادقة الموافقة داخل المحادثة نفسها.
- إذا كانت قناتك تكشف موافقات تنفيذ أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة السطح البادئ/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل المحادثة نفسها. يستخدم Core هذا الخطاف الخاص بالتنفيذ للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت القناة البادئة تدعم موافقات التنفيذ الأصلية، وإدراج القناة في إرشادات الرجوع الاحتياطي للعميل الأصلي. ويملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا في الحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقات الأصلية أو منع الرجوع الاحتياطي.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية للموافقات التي تملكها القناة. وأبقِه كسولًا على نقاط دخول القنوات السريعة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل عند الطلب مع السماح لـ Core بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارِض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد المسار المعطل مفاتيح التكوين الدقيقة المطلوبة لتفعيل موافقات التنفيذ الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ ويجب على القنوات ذات الحسابات المسماة عرض مسارات بنطاق الحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من الإعدادات الافتراضية العليا.
- إذا كانت القناة تستطيع استنتاج هويات مستقرة شبيهة بالمالكين في الرسائل المباشرة من التكوين القائم، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل المحادثة نفسها من دون إضافة منطق خاص بالموافقة في Core.
- إذا كانت القناة تحتاج إلى تسليم موافقة أصلية، فاحرص على إبقاء كود القناة مركزًا على تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع حقائق القناة الخاصة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى يتمكن Core من تجميع المعالج وامتلاك تصفية الطلبات، والتوجيه، وإزالة التكرار، وانتهاء الصلاحية، واشتراك Gateway، وإشعارات التوجيه إلى مكان آخر. وقد قُسِّم `nativeRuntime` إلى طبقات أصغر:
- `availability` — ما إذا كان الحساب مُكوَّنًا وما إذا كان ينبغي التعامل مع الطلب
- `presentation` — ربط نموذج عرض الموافقة المشترك إلى حمولات أصلية معلقة/محلولة/منتهية أو إجراءات نهائية
- `transport` — إعداد الأهداف بالإضافة إلى إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — خطافات اختيارية للربط/فك الربط/مسح الإجراءات للأزرار أو التفاعلات الأصلية
- `observe` — خطافات اختيارية لتشخيصات التسليم
- إذا كانت القناة تحتاج إلى كائنات يملكها وقت التشغيل مثل عميل أو رمز أو تطبيق Bolt أو مستقبِل Webhook، فسجّلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل سياق وقت التشغيل العام لـ Core إقلاع معالجات مدفوعة بالإمكانات من حالة بدء تشغيل القناة من دون إضافة غراء تغليف خاص بالموافقة.
- لا تلجأ إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` منخفضي المستوى إلا عندما لا تكون طبقة الإمكانات التعبيرية كافية بعد.
- يجب على قنوات الموافقات الأصلية تمرير كل من `accountId` و`approvalKind` عبر تلك المساعدات. فـ `accountId` يحافظ على سياسة الموافقة متعددة الحسابات ضمن نطاق حساب البوت الصحيح، و`approvalKind` يبقي سلوك موافقة التنفيذ مقابل Plugin متاحًا للقناة من دون فروع صلبة في Core.
- يمتلك Core الآن أيضًا إشعارات إعادة توجيه الموافقات. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "تم إرسال الموافقة إلى الرسائل المباشرة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بل اكشف بدلًا من ذلك توجيه الأصل + الرسائل المباشرة للموافق عبر مساعدات إمكانات الموافقة المشتركة ودع Core يجمع عمليات التسليم الفعلية قبل نشر أي إشعار إلى الدردشة البادئة.
- حافظ على نوع معرّف الموافقة المُسلَّم من البداية إلى النهاية. يجب ألا
  تخمّن العملاء الأصلية أو تعيد كتابة توجيه موافقة التنفيذ مقابل Plugin من حالة محلية خاصة بالقناة.
- يمكن لأنواع مختلفة من الموافقات أن تكشف عمدًا عن أسطح أصلية مختلفة.
  من الأمثلة المضمّنة الحالية:
  - يبقي Slack توجيه الموافقات الأصلية متاحًا لكل من معرّفات التنفيذ وPlugin.
  - يحتفظ Matrix بالتوجيه الأصلي نفسه للرسائل المباشرة/القنوات وبواجهة التفاعلات نفسها لموافقات التنفيذ وPlugin، مع السماح في الوقت نفسه باختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافق، لكن ينبغي للكود الجديد تفضيل باني الإمكانات وكشف `approvalCapability` على Plugin.

بالنسبة لنقاط دخول القنوات السريعة، فضّل المسارات الفرعية الأضيق لوقت التشغيل عندما تحتاج فقط
إلى جزء واحد من هذه العائلة:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

وبالمثل، فضّل `openclaw/plugin-sdk/setup-runtime`,
و`openclaw/plugin-sdk/setup-adapter-runtime`,
و`openclaw/plugin-sdk/reply-runtime`,
و`openclaw/plugin-sdk/reply-dispatch-runtime`,
و`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى سطح
التجميع الأوسع.

بالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة وقت التشغيل:
  مهايئات تصحيح الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  و`createEnvPatchedAccountSetupAdapter`,
  و`createSetupInputPresenceValidator`)، ومخرجات ملاحظات البحث،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  setup-proxy المفوضة
- يشكل `openclaw/plugin-sdk/setup-adapter-runtime` طبقة المهايئ الضيقة الواعية بالبيئة
  لـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة الإعداد ذات التثبيت الاختياري
  بالإضافة إلى بعض البدائيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface` و`createOptionalChannelSetupAdapter`،

إذا كانت قناتك تدعم إعدادًا أو مصادقة مدفوعين بمتغيرات البيئة، وكان يجب أن تعرف
تدفقات الإقلاع/التكوين العامة أسماء متغيرات البيئة تلك قبل تحميل وقت التشغيل،
فصرّح بها في بيان Plugin باستخدام `channelEnvVars`. وأبقِ `envVars` الخاصة بوقت تشغيل القناة أو الثوابت المحلية لنسخة المشغّل فقط.

إذا كان يمكن لقناتك أن تظهر في `status` أو `channels list` أو `channels status` أو في عمليات فحص SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في `package.json`. يجب أن تكون نقطة الدخول هذه آمنة للاستيراد في مسارات الأوامر للقراءة فقط، ويجب أن تعيد بيانات تعريف القناة، ومهايئ التكوين الآمن للإعداد، ومهايئ الحالة، وبيانات تعريف أهداف أسرار القناة اللازمة لتلك الملخصات. لا تبدأ عملاء أو مستمعين أو أزمنة تشغيل للنقل من نقطة دخول الإعداد.

`createOptionalChannelSetupWizard`، و`DEFAULT_ACCOUNT_ID`,
و`createTopLevelChannelDmPolicy`، و`setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم سطح `openclaw/plugin-sdk/setup` الأوسع فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/التكوين المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في أسطح الإعداد،
ففضّل `createOptionalChannelSetupSurface(...)`. يفشل المهايئ/المعالج الناتج
بشكل مغلق في عمليات كتابة التكوين والإنهاء، ويعيد استخدام الرسالة نفسها
المطلوبة للتثبيت عبر التحقق والإنهاء ونسخة رابط الوثائق.

وبالنسبة إلى المسارات السريعة الأخرى للقنوات، فضّل المساعدات الضيقة على الأسطح
القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`,
  و`openclaw/plugin-sdk/account-id`,
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لتكوين الحسابات المتعددة
  والرجوع الاحتياطي إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لتوصيل المسار/المغلف الوارد
  وربط التسجيل والتوزيع
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الأهداف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى
  مفوّضي هوية/إرسال الصادر وتخطيط الحمولة
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما يجب أن يحافظ مسار الإرسال الصادر على
  `replyToId`/`threadId` صريح أو يستعيد جلسة `:thread:` الحالية
  بعد أن يظل مفتاح الجلسة الأساسي مطابقًا. ويمكن لـ Plugins المزوّدات
  تجاوز الأولوية وسلوك اللاحقة وتطبيع معرّف السلسلة عندما تكون لدى منصتها
  دلالات أصلية لتسليم السلاسل.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المهايئات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يظل تخطيط
  حقل حمولة الوكيل/الوسائط القديم مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع أوامر Telegram
  المخصصة، والتحقق من التكرار/التعارض، وعقد تكوين أوامر مستقر في
  الرجوع الاحتياطي

يمكن لقنوات المصادقة فقط عادةً التوقف عند المسار الافتراضي: يتولى Core الموافقات وتكشف Plugin فقط عن إمكانات الصادر/المصادقة. ويجب على قنوات الموافقات الأصلية مثل Matrix وSlack وTelegram وناقلات الدردشة المخصصة استخدام المساعدات الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارة الواردة

أبقِ التعامل مع الإشارة الواردة منقسمًا إلى طبقتين:

- جمع الأدلة الذي تملكه Plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
واستخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى
مجمّع مساعدات الوارد الأوسع.

مناسب جيدًا للمنطق المحلي في Plugin:

- كشف الرد على البوت
- كشف الاقتباس من البوت
- التحقق من المشاركة في السلسلة
- استثناءات رسائل الخدمة/النظام
- الذاكرات المؤقتة الأصلية للمنصة المطلوبة لإثبات مشاركة البوت

مناسب جيدًا للمساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح للإشارة الضمنية
- تجاوز الأوامر
- قرار التخطي النهائي

التدفق المفضّل:

1. احسب حقائق الإشارة المحلية.
2. مرّر تلك الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
3. استخدم `decision.effectiveWasMentioned` و`decision.shouldBypassMention` و`decision.shouldSkip` في بوابة الوارد لديك.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

يكشف `api.runtime.channel.mentions` عن مساعدات الإشارة المشتركة نفسها
لـ Plugins القنوات المضمّنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات
وقت تشغيل الوارد غير المرتبطة.

تبقى مساعدات `resolveMentionGating*` الأقدم على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. يجب على الكود الجديد
استخدام `resolveInboundMentionDecision({ facts, policy })`.

## الشرح العملي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة والبيان">
    أنشئ ملفات Plugin القياسية. إن الحقل `channel` في `package.json` هو
    ما يجعل هذا Plugin قناة. وللاطلاع على سطح بيانات تعريف الحزمة الكامل،
    راجع [إعداد Plugin والتكوين](/ar/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "ربط OpenClaw بـ Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin قناة Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="ابنِ كائن Plugin القناة">
    تحتوي الواجهة `ChannelPlugin` على العديد من أسطح المهايئات الاختيارية. ابدأ
    بالحد الأدنى — `id` و`setup` — ثم أضف المهايئات عند الحاجة.

    أنشئ `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // عميل API الخاص بمنصتك

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // أمان الرسائل المباشرة: من يمكنه مراسلة البوت
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // الاقتران: تدفق الموافقة لجهات اتصال الرسائل المباشرة الجديدة
      pairing: {
        text: {
          idLabel: "اسم مستخدم Acme Chat",
          message: "أرسل هذا الرمز للتحقق من هويتك:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // التسلسل: كيف يتم تسليم الردود
      threading: { topLevelReplyToMode: "reply" },

      // الصادر: إرسال الرسائل إلى المنصة
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="ما الذي يفعله createChatChannelPlugin نيابةً عنك">
      بدلًا من تنفيذ واجهات مهايئات منخفضة المستوى يدويًا، فإنك تمرّر
      خيارات تصريحية، ويتولى الباني تركيبها:

      | الخيار | ما الذي يوصّله |
      | --- | --- |
      | `security.dm` | محلل أمان رسائل مباشرة ضمن النطاق من حقول التكوين |
      | `pairing.text` | تدفق اقتران رسائل مباشرة قائم على النص مع تبادل الرموز |
      | `threading` | محلل وضع الرد (ثابت، أو ضمن الحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تعيد بيانات تعريف النتيجة (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات المهايئات الخام بدلًا من الخيارات التصريحية
      إذا كنت بحاجة إلى تحكم كامل.
    </Accordion>

  </Step>

  <Step title="وصّل نقطة الدخول">
    أنشئ `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin قناة Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("إدارة Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "إدارة Acme Chat",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    ضع واصفات CLI التي تملكها القناة في `registerCliMetadata(...)` حتى يتمكن OpenClaw
    من عرضها في المساعدة الجذرية من دون تفعيل وقت تشغيل القناة الكامل،
    بينما تلتقط عمليات التحميل الكاملة العادية الواصفات نفسها لتسجيل الأوامر
    الفعلي. وأبقِ `registerFull(...)` للأعمال الخاصة بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجل أساليب Gateway RPC، فاستخدم
    بادئة خاصة بـ Plugin. تبقى نطاقات إدارة Core (`config.*`,
    و`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة، وتُحل دائمًا
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` معالجة تقسيم وضع التسجيل تلقائيًا. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لجميع
    الخيارات.

  </Step>

  <Step title="أضف نقطة دخول للإعداد">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلًا من نقطة الدخول الكاملة عندما تكون القناة معطلة
    أو غير مكوّنة. وهذا يتجنب سحب كود وقت تشغيل ثقيل أثناء تدفقات الإعداد.
    راجع [الإعداد والتكوين](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات مساحة العمل المضمّنة التي تفصل التصديرات الآمنة للإعداد إلى
    وحدات جانبية استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    معيّن وقت تشغيل صريح في وقت الإعداد.

  </Step>

  <Step title="تعامل مع الرسائل الواردة">
    يحتاج Plugin الخاص بك إلى استقبال الرسائل من المنصة وتمريرها إلى
    OpenClaw. والنمط المعتاد هو Webhook يتحقق من الطلب ثم
    يوزعه عبر معالج الوارد الخاص بقناتك:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // مصادقة يديرها Plugin (تحقق من التوقيعات بنفسك)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // يوزّع معالج الوارد الخاص بك الرسالة إلى OpenClaw.
          // يعتمد التوصيل الدقيق على SDK الخاصة بمنصتك —
          // راجع مثالًا حقيقيًا في حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat المضمّنة.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      إن التعامل مع الرسائل الواردة خاص بكل قناة. فكل Plugin قناة يمتلك
      خط أنابيب الوارد الخاص به. انظر إلى Plugins القنوات المضمّنة
      (مثل حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) لمعرفة الأنماط الفعلية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="الاختبار">
اكتب اختبارات colocated في `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    بالنسبة إلى مساعدات الاختبار المشتركة، راجع [الاختبار](/ar/plugins/sdk-testing).

  </Step>
</Steps>

## بنية الملفات

```
<bundled-plugin-root>/acme-chat/
├── package.json              # بيانات تعريف openclaw.channel
├── openclaw.plugin.json      # البيان مع مخطط التكوين
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # التصديرات العامة (اختياري)
├── runtime-api.ts            # تصديرات وقت التشغيل الداخلية (اختياري)
└── src/
    ├── channel.ts            # ChannelPlugin عبر createChatChannelPlugin
    ├── channel.test.ts       # الاختبارات
    ├── client.ts             # عميل API الخاص بالمنصة
    └── runtime.ts            # مخزن وقت التشغيل (إذا لزم الأمر)
```

## موضوعات متقدمة

<CardGroup cols={2}>
  <Card title="خيارات التسلسل" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع الرد الثابتة، أو ضمن الحساب، أو المخصصة
  </Card>
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="حل الأهداف" icon="crosshair" href="/ar/plugins/architecture#channel-target-resolution">
    inferTargetChatType وlooksLikeId وresolveTarget
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط وsubagent عبر api.runtime
  </Card>
</CardGroup>

<Note>
لا تزال بعض طبقات المساعدات المضمّنة موجودة لصيانة Plugins المضمّنة
ولأغراض التوافق. لكنها ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
فضّل المسارات الفرعية العامة للقنوات/الإعداد/الرد/وقت التشغيل من
سطح SDK المشترك ما لم تكن تصون عائلة Plugin المضمّنة تلك مباشرة.
</Note>

## الخطوات التالية

- [Provider Plugins](/ar/plugins/sdk-provider-plugins) — إذا كان Plugin الخاص بك يوفّر أيضًا نماذج
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيراد المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار واختبارات العقود
- [بيان Plugin](/ar/plugins/manifest) — المخطط الكامل للبيان
