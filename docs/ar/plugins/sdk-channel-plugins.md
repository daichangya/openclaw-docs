---
read_when:
    - أنت تقوم ببناء Plugin جديد لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة المهايئ `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة لـ OpenClaw
title: بناء Plugins للقنوات
x-i18n:
    generated_at: "2026-04-21T19:20:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# بناء Plugins للقنوات

يرشدك هذا الدليل خلال بناء Plugin لقناة يربط OpenClaw بمنصة مراسلة. بحلول النهاية سيكون لديك قناة عاملة تتضمن أمان الرسائل الخاصة، والاقتران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا للتعرّف على بنية
  الحزمة الأساسية وإعداد ملف manifest.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات send/edit/react خاصة بها. يحتفظ OpenClaw بأداة `message` مشتركة واحدة في النواة. ويتولى Plugin الخاص بك ما يلي:

- **Config** — حل الحسابات ومعالج الإعداد
- **Security** — سياسة الرسائل الخاصة وقوائم السماح
- **Pairing** — تدفق الموافقة على الرسائل الخاصة
- **Session grammar** — كيفية ربط معرّفات المحادثات الخاصة بالمزوّد بالمحادثات الأساسية ومعرّفات السلاسل وبدائل الأصل
- **Outbound** — إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **Threading** — كيفية تنظيم الردود ضمن سلاسل

تتولى النواة أداة الرسائل المشتركة، وتوصيل prompt، وشكل مفتاح الجلسة الخارجي،
وسجلات `:thread:` العامة، والتوجيه.

إذا كانت قناتك تضيف معاملات message-tool تحمل مصادر وسائط، فاعرض أسماء هذه
المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
هذه القائمة الصريحة لتطبيع مسارات sandbox وسياسة الوصول إلى الوسائط الصادرة،
لذلك لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة لحقول
الصورة الرمزية أو المرفقات أو صورة الغلاف الخاصة بالمزوّد.
ويُفضَّل إرجاع خريطة مفاتيحها هي الإجراءات مثل:
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير المرتبطة
وسائط إجراء آخر. لا تزال المصفوفة المسطحة تعمل للمعاملات التي تكون
مشتركة عمدًا عبر كل إجراء مكشوف.

إذا كانت منصتك تخزن نطاقًا إضافيًا داخل معرّفات المحادثة، فأبقِ هذا التحليل
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. هذا هو
الربط القياسي لتحويل `rawId` إلى معرّف المحادثة الأساسي، ومعرّف سلسلة اختياري،
و`baseConversationId` صريح، وأي `parentConversationCandidates`.
وعند إرجاع `parentConversationCandidates`، حافظ على ترتيبها من
الأصل الأضيق إلى المحادثة الأوسع/الأساسية.

يمكن أيضًا لـ Plugins المضمّنة التي تحتاج إلى التحليل نفسه قبل إقلاع
سجل القنوات أن تعرض ملف `session-key-api.ts` على المستوى الأعلى مع
تصدير مطابق لـ `resolveSessionConversation(...)`. تستخدم النواة هذا السطح
الآمن للإقلاع فقط عندما لا يكون سجل Plugins وقت التشغيل متاحًا بعد.

يبقى `messaging.resolveParentConversationCandidates(...)` متاحًا كبديل توافق
قديم عندما يحتاج Plugin فقط إلى بدائل أصل فوق المعرّف العام/الخام.
إذا وُجد الربطان معًا، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا ولا
تعود إلى `resolveParentConversationCandidates(...)` إلا عندما يتجاهلها
الربط القياسي.

## الموافقات وإمكانات القناة

لا تحتاج معظم Plugins القنوات إلى شيفرة خاصة بالموافقات.

- تتولى النواة أمر `/approve` داخل الدردشة نفسها، وحمولات أزرار الموافقة المشتركة، والتسليم الاحتياطي العام.
- استخدم كائن `approvalCapability` واحدًا على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق تسليم الموافقة/العرض الأصلي/render/auth على `approvalCapability`.
- يقتصر `plugin.auth` على login/logout فقط؛ لم تعد النواة تقرأ ربط auth الخاص بالموافقة من ذلك الكائن.
- يُعد `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` سطح الربط القياسي لمصادقة الموافقات.
- استخدم `approvalCapability.getActionAvailabilityState` لإتاحة auth الخاصة بالموافقة داخل الدردشة نفسها.
- إذا كانت قناتك تعرض موافقات تنفيذ أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن auth الخاصة بالموافقة داخل الدردشة نفسها. تستخدم النواة هذا الربط الخاص بالتنفيذ للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت قناة البدء تدعم موافقات التنفيذ الأصلية، وإدراج القناة في إرشادات fallback الخاصة بالعميل الأصلي. يملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا للحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلية أو منع fallback.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية المملوكة للقناة بشأن الموافقة. أبقه lazy على نقاط دخول القناة الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل الخاصة بك عند الطلب مع إبقاء النواة قادرة على تجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد المسار المعطّل مفاتيح Config الدقيقة اللازمة لتمكين موافقات التنفيذ الأصلية. يتلقى الربط `{ channel, channelLabel, accountId }`؛ وينبغي للقنوات ذات الحسابات المسمّاة أن تعرض مسارات مقيّدة بالحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من الإعدادات الافتراضية على المستوى الأعلى.
- إذا كانت القناة تستطيع استنتاج هويات شبيهة بالمالك ومستقرة للرسائل الخاصة من Config الموجود، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل الدردشة نفسها دون إضافة منطق خاص بالموافقة إلى النواة.
- إذا كانت القناة تحتاج إلى تسليم موافقات أصلية، فاحرص على أن تركز شيفرة القناة على تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وتملك تصفية الطلبات والتوجيه وإزالة التكرار والانتهاء والاشتراك في Gateway وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى عدة أسطح أصغر:
- `availability` — هل الحساب مُعدّ وهل يجب التعامل مع الطلب
- `presentation` — ربط نموذج عرض الموافقة المشترك بحمولات أصلية معلّقة/محلولة/منتهية أو بإجراءات نهائية
- `transport` — تجهيز الأهداف بالإضافة إلى إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — ربط/فك ربط/مسح الإجراءات الاختيارية للأزرار الأصلية أو ردود الفعل
- `observe` — ربط اختياري لتشخيصات التسليم
- إذا كانت القناة تحتاج إلى كائنات مملوكة لوقت التشغيل مثل client أو token أو تطبيق Bolt أو مستقبل Webhook، فسجّلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل runtime-context العام للنواة إقلاع المعالجات المعتمدة على الإمكانات من حالة بدء القناة دون إضافة شيفرة ربط خاصة بالموافقة.
- انتقل إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` ذوي المستوى الأدنى فقط عندما لا يكون سطح الإمكانات المعتمد كافيًا بعد.
- يجب على قنوات الموافقة الأصلية تمرير كل من `accountId` و`approvalKind` عبر تلك الأدوات المساعدة. يحافظ `accountId` على تقييد سياسة الموافقة متعددة الحسابات ضمن حساب bot الصحيح، ويحافظ `approvalKind` على إتاحة سلوك موافقة التنفيذ مقابل موافقة Plugin للقناة من دون فروع hardcoded في النواة.
- تتولى النواة الآن أيضًا إشعارات إعادة توجيه الموافقات. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "تم إرسال الموافقة إلى الرسائل الخاصة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ وبدلًا من ذلك، اعرض توجيه origin + الرسائل الخاصة للموافق عبر أدوات إمكانات الموافقة المشتركة، ودَع النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار مجددًا إلى الدردشة التي بدأت الطلب.
- حافظ على نوع معرّف الموافقة المُسلَّم من البداية إلى النهاية. يجب ألا
  تخمّن clients الأصلية أو تعيد كتابة توجيه موافقة التنفيذ مقابل موافقة Plugin
  اعتمادًا على حالة محلية للقناة.
- يمكن لأنواع الموافقات المختلفة أن تعرض عمدًا أسطحًا أصلية مختلفة.
  الأمثلة المضمّنة الحالية:
  - يحتفظ Slack بإتاحة توجيه الموافقة الأصلية لكل من معرّفات التنفيذ ومعرّفات Plugin.
  - يحتفظ Matrix بالتوجيه نفسه للرسائل الخاصة/القنوات الأصلية وتجربة ردود الفعل لكلٍّ من موافقات التنفيذ وموافقات Plugin، مع الاستمرار في السماح لاختلاف auth حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافق، لكن يجب أن تفضّل الشيفرة الجديدة باني الإمكانات وأن تعرض `approvalCapability` على Plugin.

لنقاط دخول القنوات الساخنة، فضّل المسارات الفرعية الأضيق لوقت التشغيل عندما
تحتاج إلى جزء واحد فقط من هذه المجموعة:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

وبالمثل، فضّل `openclaw/plugin-sdk/setup-runtime`،
و`openclaw/plugin-sdk/setup-adapter-runtime`،
و`openclaw/plugin-sdk/reply-runtime`,
و`openclaw/plugin-sdk/reply-dispatch-runtime`,
و`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح
المظلّي الأوسع.

وبالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` أدوات الإعداد الآمنة لوقت التشغيل:
  مهايئات patch الخاصة بالإعداد والآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات
  ملاحظات البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  setup-proxy المفوّضة
- يُعد `openclaw/plugin-sdk/setup-adapter-runtime` سطح المهايئ الضيق والمدرك للبيئة
  لـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة الإعداد الاختياري للتثبيت
  بالإضافة إلى بعض العناصر الأولية الآمنة للإعداد:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

إذا كانت قناتك تدعم الإعداد أو auth المعتمد على البيئة وكان ينبغي لتدفقات
البدء/Config العامة معرفة أسماء متغيرات البيئة تلك قبل تحميل وقت التشغيل،
فأعلن عنها في manifest الخاص بالـ Plugin باستخدام `channelEnvVars`. واحتفِظ
بـ `envVars` الخاص بوقت تشغيل القناة أو الثوابت المحلية فقط للنصوص
الموجّهة للمشغّل.

إذا كان يمكن لقناتك أن تظهر في `status` أو `channels list` أو `channels status` أو
عمليات فحص SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في
`package.json`. يجب أن تكون نقطة الدخول هذه آمنة للاستيراد في مسارات أوامر
القراءة فقط، ويجب أن تُرجع بيانات القناة الوصفية، ومهايئ Config الآمن للإعداد،
ومهايئ الحالة، وبيانات أهداف أسرار القناة اللازمة لتلك الملخصات. لا تبدأ
clients أو listeners أو أوقات تشغيل النقل من نقطة دخول الإعداد.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, و
`splitSetupEntries`

- استخدم السطح الأوسع `openclaw/plugin-sdk/setup` فقط عندما تحتاج أيضًا إلى
  أدوات الإعداد/Config المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في أسطح الإعداد،
ففضّل `createOptionalChannelSetupSurface(...)`. يفشل المهايئ/المعالج المُولّد
بصورة مغلقة عند كتابة Config وعند الإنهاء، ويعيد استخدام الرسالة نفسها
الخاصة بوجوب التثبيت عبر التحقق والإنهاء ونص رابط الوثائق.

وبالنسبة إلى مسارات القنوات الساخنة الأخرى، فضّل الأدوات المساعدة الضيقة على
الأسطح القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`,
  و`openclaw/plugin-sdk/account-id`,
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات الحسابات المتعددة و
  fallback الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لمسار/غلاف الوارد
  وتوصيلات التسجيل ثم الإرسال
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الأهداف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى
  مفوّضي الهوية/الإرسال الصادر وتخطيط الحمولة
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المهايئات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يكون تخطيط حقول
  حمولة agent/media القديم لا يزال مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع الأوامر المخصصة في Telegram،
  والتحقق من التكرار/التعارض، وعقد إعداد الأوامر المستقر في fallback

يمكن لقنوات auth فقط غالبًا أن تتوقف عند المسار الافتراضي: تتولى النواة الموافقات ويعرض Plugin فقط إمكانات outbound/auth. أما قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram ووسائط الدردشة المخصصة، فيجب أن تستخدم الأدوات المساعدة الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارات الواردة

أبقِ معالجة الإشارات الواردة مقسّمة إلى طبقتين:

- جمع الأدلة المملوك للـ plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
واستخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى الحزمة الأوسع
من أدوات الوارد المساعدة.

مناسب جيدًا للمنطق المحلي الخاص بالـ plugin:

- اكتشاف الرد على bot
- اكتشاف الاقتباس من bot
- فحوصات المشاركة في السلسلة
- استثناءات رسائل الخدمة/النظام
- caches أصلية خاصة بالمنصة مطلوبة لإثبات مشاركة bot

مناسب جيدًا للأداة المساعدة المشتركة:

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

يعرض `api.runtime.channel.mentions` أدوات الإشارة المشتركة نفسها
لـ Plugins القنوات المضمّنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل أدوات
وقت تشغيل الوارد غير المرتبطة.

تبقى أدوات `resolveMentionGating*` الأقدم موجودة على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. يجب أن تستخدم
الشيفرة الجديدة `resolveInboundMentionDecision({ facts, policy })`.

## الشرح العملي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة وmanifest">
    أنشئ ملفات Plugin القياسية. إن الحقل `channel` في `package.json` هو
    ما يجعل هذا Plugin قناة. وللاطلاع على سطح بيانات الحزمة الكامل،
    راجع [إعداد Plugin وConfig](/ar/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
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
      "description": "Acme Chat channel plugin",
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

  <Step title="بناء كائن Plugin القناة">
    تحتوي واجهة `ChannelPlugin` على العديد من أسطح المهايئات الاختيارية. ابدأ
    بالحد الأدنى — `id` و`setup` — ثم أضف المهايئات حسب حاجتك.

    أنشئ `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
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

    <Accordion title="ما الذي يفعله `createChatChannelPlugin` لك">
      بدلًا من تنفيذ واجهات المهايئات منخفضة المستوى يدويًا، فإنك تمرر
      خيارات تصريحية ويتولى الباني تركيبها:

      | Option | ما الذي يوصله |
      | --- | --- |
      | `security.dm` | محلّل أمان الرسائل الخاصة المقيّد من حقول Config |
      | `pairing.text` | تدفق اقتران الرسائل الخاصة المعتمد على النص مع تبادل الرمز |
      | `threading` | محلّل وضع reply-to (ثابت أو مقيّد بالحساب أو مخصص) |
      | `outbound.attachedResults` | دوال الإرسال التي تعيد بيانات النتيجة الوصفية (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات مهايئات خام بدلًا من الخيارات التصريحية
      إذا كنت تحتاج إلى تحكم كامل.
    </Accordion>

  </Step>

  <Step title="توصيل نقطة الدخول">
    أنشئ `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    ضع واصفات CLI المملوكة للقناة في `registerCliMetadata(...)` حتى يتمكن OpenClaw
    من عرضها في help الجذر من دون تفعيل وقت تشغيل القناة الكامل،
    بينما تستمر عمليات التحميل الكاملة العادية في التقاط الواصفات نفسها لتسجيل
    الأوامر الفعلي. واحتفظ بـ `registerFull(...)` للأعمال الخاصة بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجل أساليب Gateway RPC، فاستخدم
    بادئة خاصة بالـ plugin. تظل مساحات أسماء إدارة النواة (`config.*`,
    و`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة وتُحل دائمًا
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` تقسيم أوضاع التسجيل تلقائيًا. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لجميع
    الخيارات.

  </Step>

  <Step title="إضافة نقطة دخول للإعداد">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلًا من نقطة الدخول الكاملة عندما تكون القناة معطّلة
    أو غير مُعدّة. وهذا يتجنب سحب شيفرة وقت تشغيل ثقيلة أثناء تدفقات الإعداد.
    راجع [الإعداد وConfig](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات workspace المضمّنة التي تقسّم التصديرات الآمنة للإعداد إلى
    وحدات sidecar أن تستخدم `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    setter صريح لوقت التشغيل في وقت الإعداد.

  </Step>

  <Step title="التعامل مع الرسائل الواردة">
    يحتاج Plugin الخاص بك إلى استقبال الرسائل من المنصة وتمريرها إلى
    OpenClaw. النمط المعتاد هو Webhook يتحقق من الطلب ثم يرسله
    عبر معالج الوارد الخاص بقناتك:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth يديره الـ plugin (تحقق من التواقيع بنفسك)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // يرسل معالج الوارد لديك الرسالة إلى OpenClaw.
          // تعتمد التوصيلات الدقيقة على SDK الخاصة بمنصتك —
          // راجع مثالًا فعليًا في حزمة Plugin المضمّنة لـ Microsoft Teams أو Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      إن معالجة الرسائل الواردة خاصة بكل قناة. يمتلك كل Plugin قناة
      خط معالجة الوارد الخاص به. اطّلع على Plugins القنوات المضمّنة
      (على سبيل المثال حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) لرؤية أنماط فعلية.
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

    للاطلاع على أدوات الاختبار المساعدة المشتركة، راجع [الاختبار](/ar/plugins/sdk-testing).

  </Step>
</Steps>

## بنية الملفات

```
<bundled-plugin-root>/acme-chat/
├── package.json              # بيانات openclaw.channel الوصفية
├── openclaw.plugin.json      # Manifest مع schema لـ config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # التصديرات العامة (اختياري)
├── runtime-api.ts            # تصديرات وقت التشغيل الداخلية (اختياري)
└── src/
    ├── channel.ts            # ChannelPlugin عبر createChatChannelPlugin
    ├── channel.test.ts       # الاختبارات
    ├── client.ts             # عميل API الخاص بالمنصة
    └── runtime.ts            # مخزن وقت التشغيل (عند الحاجة)
```

## مواضيع متقدمة

<CardGroup cols={2}>
  <Card title="خيارات التسلسل" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع الرد الثابتة أو المقيّدة بالحساب أو المخصصة
  </Card>
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="تحليل الهدف" icon="crosshair" href="/ar/plugins/architecture#channel-target-resolution">
    inferTargetChatType وlooksLikeId وresolveTarget
  </Card>
  <Card title="أدوات وقت التشغيل المساعدة" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط وsubagent عبر api.runtime
  </Card>
</CardGroup>

<Note>
لا تزال بعض أسطح الأدوات المساعدة المضمّنة موجودة من أجل صيانة Plugins المضمّنة
والتوافق. وهي ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
ويُفضَّل استخدام المسارات الفرعية العامة للقنوات/الإعداد/الرد/وقت التشغيل من
سطح SDK المشترك ما لم تكن تصون عائلة Plugin المضمّنة تلك مباشرة.
</Note>

## الخطوات التالية

- [Plugins المزوّد](/ar/plugins/sdk-provider-plugins) — إذا كان Plugin الخاص بك يوفّر النماذج أيضًا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيراد المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار وعقود الاختبار
- [Manifest الخاص بالـ Plugin](/ar/plugins/manifest) — schema الكامل للـ manifest
