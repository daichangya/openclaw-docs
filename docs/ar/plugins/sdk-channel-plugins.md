---
read_when:
    - أنت تبني Plugin جديدًا لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة المهايئ ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة لـ OpenClaw
title: بناء Plugins القنوات
x-i18n:
    generated_at: "2026-04-18T07:15:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3dda53c969bc7356a450c2a5bf49fb82bf1283c23e301dec832d8724b11e724b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# بناء Plugins القنوات

يوضح هذا الدليل كيفية بناء Plugin قناة يربط OpenClaw بمنصة مراسلة. وبنهاية هذا الدليل سيكون لديك قناة عاملة تتضمن أمان الرسائل الخاصة، والاقتران، وترابط الردود، والرسائل الصادرة.

<Info>
  إذا لم تكن قد أنشأت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا للتعرف على بنية الحزمة الأساسية
  وإعداد manifest.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات send/edit/react خاصة بها. يحتفظ OpenClaw
بأداة `message` مشتركة واحدة في النواة. ويتولى Plugin الخاص بك ما يلي:

- **الإعداد** — تحليل الحسابات ومعالج الإعداد
- **الأمان** — سياسة الرسائل الخاصة وقوائم السماح
- **الاقتران** — تدفق الموافقة على الرسائل الخاصة
- **صياغة الجلسة** — كيفية ربط معرّفات المحادثات الخاصة بالمزوّد بالمحادثات الأساسية، ومعرّفات السلاسل، وبدائل الأصل
- **الصادر** — إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **التسلسل** — كيفية ربط الردود ضمن السلاسل

تتولى النواة أداة الرسائل المشتركة، وربط prompt، وشكل مفتاح الجلسة الخارجي،
ومسك الدفاتر العام لـ `:thread:`، والإرسال.

إذا كانت قناتك تضيف معاملات message-tool تحمل مصادر وسائط، فاكشف أسماء هذه
المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
هذه القائمة الصريحة لتطبيع مسارات sandbox وسياسة الوصول إلى الوسائط الصادرة،
بحيث لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة لمعلمات الصورة
الرمزية أو المرفقات أو صورة الغلاف الخاصة بكل مزوّد.
ويُفضَّل إرجاع خريطة مفاتيحها هي الإجراءات مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير
المرتبطة معاملات الوسائط الخاصة بإجراء آخر. ولا تزال المصفوفة المسطحة تعمل
للمعاملات التي تكون مشتركة عمدًا بين جميع الإجراءات المكشوفة.

إذا كانت منصتك تخزن نطاقًا إضافيًا داخل معرّفات المحادثات، فأبقِ هذا التحليل
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. فهذا هو
الخطاف القياسي لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة الاختياري،
و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
عند إرجاع `parentConversationCandidates`، احرص على ترتيبها من الأصل الأضيق
إلى المحادثة الأوسع/الأساسية.

يمكن أيضًا لـ Plugins المضمّنة التي تحتاج إلى التحليل نفسه قبل إقلاع سجل
القنوات أن تكشف ملفًا علوي المستوى باسم `session-key-api.ts` مع تصدير مطابق
لـ `resolveSessionConversation(...)`. وتستخدم النواة هذا السطح الآمن للتهيئة
فقط عندما لا يكون سجل Plugins وقت التشغيل متاحًا بعد.

يبقى `messaging.resolveParentConversationCandidates(...)` متاحًا كبديل توافق
قديم عندما يحتاج Plugin فقط إلى بدائل أصل فوق المعرّف العام/الخام. وإذا
وُجد الخطافان معًا، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا، ولا
تعود إلى `resolveParentConversationCandidates(...)` إلا إذا أغفلها الخطاف
القياسي.

## الموافقات وقدرات القنوات

لا تحتاج معظم Plugins القنوات إلى شيفرة خاصة بالموافقات.

- تتولى النواة `/approve` داخل المحادثة نفسها، وحمولات أزرار الموافقة المشتركة، والتسليم الاحتياطي العام.
- فضّل كائن `approvalCapability` واحدًا على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق التسليم/الأصلي/العرض/المصادقة الخاصة بالموافقة على `approvalCapability`.
- يقتصر `plugin.auth` على login/logout فقط؛ ولم تعد النواة تقرأ خطافات مصادقة الموافقة من ذلك الكائن.
- يمثل `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` نقطة الربط القياسية لمصادقة الموافقات.
- استخدم `approvalCapability.getActionAvailabilityState` لتوفر مصادقة الموافقة داخل المحادثة نفسها.
- إذا كانت قناتك تكشف عن موافقات exec أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة السطح البادئ/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل المحادثة نفسها. تستخدم النواة هذا الخطاف الخاص بـ exec للتمييز بين `enabled` و`disabled`، وتقرير ما إذا كانت القناة البادئة تدعم موافقات exec الأصلية، وضم القناة إلى إرشادات fallback الخاصة بالعميل الأصلي. تملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا الجزء للحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولات الخاص بالقناة مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلية أو تعطيل fallback.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية الخاصة بالموافقة التي تملكها القناة. أبقه كسول التحميل على نقاط دخول القنوات الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل لديك عند الطلب مع الاستمرار في تمكين النواة من تجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد مسار التعطيل مفاتيح الإعداد الدقيقة اللازمة لتمكين موافقات exec الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ ويجب على القنوات ذات الحسابات المسماة عرض مسارات ضمن نطاق الحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من القيم الافتراضية ذات المستوى الأعلى.
- إذا كانت القناة تستطيع استنتاج هويات رسائل خاصة ثابتة شبيهة بالمالك من الإعدادات الحالية، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل المحادثة نفسها من دون إضافة منطق خاص بالموافقة إلى النواة.
- إذا كانت القناة تحتاج إلى تسليم موافقات أصلية، فأبقِ شيفرة القناة مركزة على تطبيع الوجهات وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وتملك تصفية الطلبات والتوجيه وإزالة التكرار والانتهاء والاشتراك في Gateway وإشعارات التوجيه إلى مكان آخر. وقد تم تقسيم `nativeRuntime` إلى عدة نقاط ربط أصغر:
- `availability` — ما إذا كان الحساب مضبوطًا وما إذا كان ينبغي التعامل مع الطلب
- `presentation` — ربط نموذج عرض الموافقة المشترك بحمولات أصلية معلقة/محلولة/منتهية أو بإجراءات نهائية
- `transport` — إعداد الوجهات بالإضافة إلى إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — خطافات اختيارية للربط/إلغاء الربط/مسح الإجراء للأزرار أو التفاعلات الأصلية
- `observe` — خطافات تشخيص اختيارية للتسليم
- إذا كانت القناة تحتاج إلى كائنات يملكها وقت التشغيل مثل عميل أو token أو تطبيق Bolt أو مستقبِل Webhook، فسجّلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل runtime-context العام للنواة تهيئة المعالجات المدفوعة بالقدرات من حالة بدء تشغيل القناة من دون إضافة تعليمات ربط خاصة بالموافقة.
- لا تلجأ إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` ذوي المستوى الأدنى إلا عندما لا تكون نقطة الربط المدفوعة بالقدرات معبّرة بما يكفي بعد.
- يجب على قنوات الموافقات الأصلية تمرير كل من `accountId` و`approvalKind` عبر تلك الأدوات المساعدة. إذ يُبقي `accountId` سياسة الموافقات متعددة الحسابات ضمن نطاق حساب bot الصحيح، بينما يُبقي `approvalKind` سلوك exec مقابل موافقة Plugin متاحًا للقناة من دون فروع مضمّنة في النواة.
- تتولى النواة الآن أيضًا إشعارات إعادة توجيه الموافقات. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "تم إرسال الموافقة إلى الرسائل الخاصة / إلى قناة أخرى" من `createChannelNativeApprovalRuntime`؛ وبدلًا من ذلك، اكشف عن توجيه origin + الرسائل الخاصة للموافق عبر أدوات المساعدة المشتركة لقدرات الموافقة، ودع النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار إلى المحادثة البادئة.
- حافظ على نوع معرّف الموافقة المُسلَّمة من البداية إلى النهاية. يجب ألا تقوم العملاء الأصلية
  بتخمين أو إعادة كتابة توجيه موافقة exec مقابل موافقة Plugin بالاعتماد على حالة محلية للقناة.
- يمكن لأنواع الموافقات المختلفة أن تكشف عمدًا عن أسطح أصلية مختلفة.
  أمثلة حالية من Plugins المضمّنة:
  - يحتفظ Slack بتوجيه الموافقات الأصلية متاحًا لكل من معرّفات exec وPlugin.
  - يحتفظ Matrix بالتوجيه الأصلي نفسه للرسائل الخاصة/القناة وتجربة التفاعلات لموافقات exec
    وPlugin، مع السماح مع ذلك باختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافق، لكن يجب أن تفضّل الشيفرة الجديدة منشئ القدرات وأن تكشف `approvalCapability` على Plugin.

بالنسبة إلى نقاط دخول القنوات الساخنة، فضّل المسارات الفرعية الأضيق لوقت التشغيل عندما
تحتاج إلى جزء واحد فقط من تلك المجموعة:

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
و`openclaw/plugin-sdk/reply-runtime`،
و`openclaw/plugin-sdk/reply-dispatch-runtime`،
و`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح الأشمل
ذو المظلة الأوسع.

وبالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` أدوات الإعداد الآمنة لوقت التشغيل:
  مهايئات ترقيع الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، وإخراج ملاحظات البحث،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  setup-proxy المفوضة
- يمثل `openclaw/plugin-sdk/setup-adapter-runtime` نقطة الربط الضيقة
  الواعية بالبيئة لـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة الإعداد ذي التثبيت الاختياري
  بالإضافة إلى بعض الأساسيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

إذا كانت قناتك تدعم الإعداد أو المصادقة المدفوعين بالبيئة وكان ينبغي لتدفقات
بدء التشغيل/الإعداد العامة معرفة أسماء متغيرات البيئة هذه قبل تحميل وقت التشغيل،
فصرّح بها في manifest الخاص بـ Plugin باستخدام `channelEnvVars`. واحتفظ
بـ `envVars` في وقت تشغيل القناة أو الثوابت المحلية فقط للنصوص الموجّهة
للمشغّل.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم نقطة الربط الأوسع `openclaw/plugin-sdk/setup` فقط عندما تحتاج أيضًا إلى
  أدوات الإعداد/التهيئة المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في أسطح الإعداد،
ففضّل `createOptionalChannelSetupSurface(...)`. إذ يفشل المهايئ/المعالج
المولدان على نحو مغلق عند عمليات كتابة الإعداد والإنهاء، ويعيدان استخدام
رسالة التثبيت المطلوبة نفسها عبر التحقق والإنهاء ونص رابط التوثيق.

وبالنسبة إلى المسارات الساخنة الأخرى للقنوات، فضّل الأدوات المساعدة الضيقة على
الأسطح القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`,
  و`openclaw/plugin-sdk/account-id`,
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات الحسابات المتعددة
  وfallback الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لربط المسار/الغلاف الوارد
  وتسجيله ثم إرساله
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الوجهات
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى مفوضي
  الهوية/الإرسال الصادر
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المهايئات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يكون تخطيط حقول
  الحمولات القديمة للوكيل/الوسائط لا يزال مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع الأوامر المخصصة في Telegram،
  والتحقق من التكرارات/التعارضات، وعقد إعدادات الأوامر الثابت في fallback

يمكن للقنوات التي تقتصر على المصادقة فقط أن تتوقف عادة عند المسار الافتراضي: تتولى النواة الموافقات، ويكشف Plugin فقط عن قدرات الصادر/المصادقة. أما قنوات الموافقات الأصلية مثل Matrix وSlack وTelegram ووسائط الدردشة المخصصة، فيجب أن تستخدم الأدوات المساعدة الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارات الواردة

أبقِ معالجة الإشارات الواردة مقسمة إلى طبقتين:

- جمع الأدلة الذي يملكه Plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارات.
واستخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى
شريط أدوات inbound الأوسع.

حالات مناسبة للمنطق المحلي داخل Plugin:

- اكتشاف الرد على bot
- اكتشاف الاقتباس من bot
- التحقق من المشاركة في السلسلة
- استبعاد رسائل الخدمة/النظام
- ذاكرات تخزين أصلية للمنصة لازمة لإثبات مشاركة bot

حالات مناسبة للأداة المساعدة المشتركة:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح للإشارة الضمنية
- تجاوز الأوامر
- قرار التخطي النهائي

التدفق المفضل:

1. احسب حقائق الإشارة المحلية.
2. مرر هذه الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
3. استخدم `decision.effectiveWasMentioned` و`decision.shouldBypassMention` و`decision.shouldSkip` في بوابة inbound الخاصة بك.

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

يكشف `api.runtime.channel.mentions` عن أدوات الإشارات المشتركة نفسها
لـ Plugins القنوات المضمّنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل أدوات
وقت تشغيل inbound غير المرتبطة.

تبقى أدوات `resolveMentionGating*` الأقدم موجودة على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. ويجب أن تستخدم
الشيفرة الجديدة `resolveInboundMentionDecision({ facts, policy })`.

## شرح عملي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة وmanifest">
    أنشئ ملفات Plugin القياسية. إن الحقل `channel` في `package.json` هو
    ما يجعل هذا Plugin قناة. وللاطلاع على سطح بيانات الحزمة الوصفية الكامل،
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

  <Step title="ابنِ كائن Plugin القناة">
    تحتوي الواجهة `ChannelPlugin` على العديد من أسطح المهايئات الاختيارية. ابدأ
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

    <Accordion title="ما الذي يفعله `createChatChannelPlugin` من أجلك">
      بدلًا من تنفيذ واجهات مهايئات منخفضة المستوى يدويًا، تمرر
      خيارات تصريحية ويقوم البنّاء بتجميعها:

      | الخيار | ما الذي يربطه |
      | --- | --- |
      | `security.dm` | محلل أمان رسائل خاصة محدد النطاق من حقول config |
      | `pairing.text` | تدفق اقتران رسائل خاصة قائم على النص مع تبادل رمز |
      | `threading` | محلل وضع reply-to (ثابت، أو ضمن نطاق الحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال send تُرجع بيانات وصفية للنتيجة (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات مهايئات خام بدلًا من الخيارات التصريحية
      إذا كنت بحاجة إلى تحكم كامل.
    </Accordion>

  </Step>

  <Step title="اربط نقطة الإدخال">
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

    ضع واصفات CLI التي تملكها القناة في `registerCliMetadata(...)` حتى يتمكن OpenClaw
    من عرضها في المساعدة الجذرية دون تفعيل وقت تشغيل القناة الكامل،
    بينما تلتقط التحميلات الكاملة العادية الواصفات نفسها أيضًا من أجل التسجيل
    الفعلي للأوامر. وأبقِ `registerFull(...)` للأعمال الخاصة بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجل أساليب Gateway RPC، فاستخدم
    بادئة خاصة بـ Plugin. تظل مساحات أسماء الإدارة في النواة (`config.*`,
    و`exec.approvals.*`, و`wizard.*`, و`update.*`) محجوزة وتُحل دائمًا
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` فصل أوضاع التسجيل تلقائيًا. راجع
    [نقاط الإدخال](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لمعرفة
    جميع الخيارات.

  </Step>

  <Step title="أضف نقطة إدخال للإعداد">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإلحاق الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلًا من نقطة الإدخال الكاملة عندما تكون القناة معطلة
    أو غير مضبوطة. وهذا يتجنب سحب شيفرة وقت تشغيل ثقيلة أثناء تدفقات الإعداد.
    راجع [الإعداد وConfig](/ar/plugins/sdk-setup#setup-entry) للحصول على التفاصيل.

    يمكن لقنوات مساحة العمل المضمّنة التي تقسم الصادرات الآمنة للإعداد إلى وحدات
    جانبية أن تستخدم `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    محدد صريح لوقت تشغيل الإعداد.

  </Step>

  <Step title="تعامل مع الرسائل الواردة">
    يحتاج Plugin الخاص بك إلى استقبال الرسائل من المنصة وتمريرها إلى
    OpenClaw. والنمط المعتاد هو Webhook يتحقق من الطلب ويقوم
    بإرساله عبر معالج inbound الخاص بقناتك:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
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
      مسار inbound الخاص به. انظر إلى Plugins القنوات المضمّنة
      (مثل حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) للاطلاع على أنماط حقيقية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="اختبر">
اكتب اختبارات موضوعة بجوار الشيفرة في `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("يحل الحساب من الإعدادات", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("يفحص الحساب دون إظهار الأسرار", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("يبلّغ عن الإعدادات المفقودة", () => {
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
├── openclaw.plugin.json      # Manifest مع مخطط config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # الصادرات العامة (اختياري)
├── runtime-api.ts            # صادرات وقت التشغيل الداخلية (اختياري)
└── src/
    ├── channel.ts            # ChannelPlugin عبر createChatChannelPlugin
    ├── channel.test.ts       # الاختبارات
    ├── client.ts             # عميل API للمنصة
    └── runtime.ts            # مخزن وقت التشغيل (عند الحاجة)
```

## مواضيع متقدمة

<CardGroup cols={2}>
  <Card title="خيارات التسلسل" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع رد ثابتة، أو ضمن نطاق الحساب، أو مخصصة
  </Card>
  <Card title="تكامل أداة message" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="تحليل الوجهة" icon="crosshair" href="/ar/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="أدوات وقت التشغيل المساعدة" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط وsubagent عبر api.runtime
  </Card>
</CardGroup>

<Note>
لا تزال بعض نقاط الربط الخاصة بالأدوات المساعدة المضمّنة موجودة لصيانة Plugins
المضمّنة ولأغراض التوافق. لكنها ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
بل يُفضّل استخدام المسارات الفرعية العامة للقنوات/الإعداد/الرد/وقت التشغيل من سطح
SDK المشترك، إلا إذا كنت تصون عائلة Plugin المضمّنة تلك مباشرة.
</Note>

## الخطوات التالية

- [Plugins المزودين](/ar/plugins/sdk-provider-plugins) — إذا كان Plugin الخاص بك يوفر أيضًا نماذج
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيراد المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار المساعدة واختبارات العقود
- [Plugin Manifest](/ar/plugins/manifest) — مخطط manifest الكامل
