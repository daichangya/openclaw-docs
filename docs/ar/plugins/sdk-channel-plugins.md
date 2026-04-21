---
read_when:
    - أنت تبني Plugin جديدًا لقناة مراسلة
    - أنت تريد ربط OpenClaw بمنصة مراسلة
    - أنت بحاجة إلى فهم سطح مهيئ ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة في OpenClaw
title: بناء Plugins القنوات
x-i18n:
    generated_at: "2026-04-21T07:23:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# بناء Plugins القنوات

يرشدك هذا الدليل خلال بناء Plugin لقناة يربط OpenClaw بمنصة
مراسلة. وبنهاية هذا الدليل سيكون لديك قناة عاملة مع أمان الرسائل المباشرة،
والإقران، وتشجير الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ أولًا
  [البدء](/ar/plugins/building-plugins) لمعرفة بنية الحزمة الأساسية
  وإعداد manifest.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات send/edit/react خاصة بها. إذ يحتفظ OpenClaw
بأداة `message` واحدة مشتركة في النواة. ويملك Plugin الخاص بك:

- **الإعدادات** — حل الحسابات ومعالج الإعداد
- **الأمان** — سياسة الرسائل المباشرة وقوائم السماح
- **الإقران** — تدفق الموافقة على الرسائل المباشرة
- **قواعد الجلسة** — كيفية ربط معرّفات المحادثات الخاصة بالموفّر بالدردشات الأساسية، ومعرّفات السلاسل، وبدائل الأصل
- **الإرسال الصادر** — إرسال النصوص، والوسائط، والاستطلاعات إلى المنصة
- **التشجير** — كيفية تشجير الردود

تمتلك النواة أداة الرسائل المشتركة، وربط الموجّهات، وشكل مفتاح الجلسة الخارجي،
وإدارة `:thread:` العامة، والتوزيع.

إذا كانت قناتك تضيف معاملات لأداة الرسائل تحمل مصادر وسائط، فاعرض أسماء هذه
المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
هذه القائمة الصريحة لتطبيع مسارات sandbox وسياسة الوصول إلى الوسائط الصادرة،
حتى لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة للمعاملات الخاصة بالموفّر مثل
الصورة الرمزية أو المرفق أو صورة الغلاف.
يُفضَّل إرجاع خريطة مفاتيحها الإجراءات مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير المرتبطة
معاملات الوسائط الخاصة بإجراء آخر. ولا تزال المصفوفة المسطحة تعمل للمعاملات
المقصود مشاركتها عمدًا عبر كل إجراء مكشوف.

إذا كانت منصتك تخزن نطاقًا إضافيًا داخل معرّفات المحادثات، فأبقِ هذا التحليل
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. فهذا هو
الخطاف القياسي لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة الاختياري،
و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
وعندما تعيد `parentConversationCandidates`، فاحرص على إبقائها مرتبة من
الأصل الأضيق إلى المحادثة الأوسع/الأساسية.

يمكن أيضًا للPlugins المضمّنة التي تحتاج إلى التحليل نفسه قبل إقلاع سجل القنوات
أن تعرض ملفًا علويًا `session-key-api.ts` مع
تصدير مطابق لـ `resolveSessionConversation(...)`.
وتستخدم النواة هذا السطح الآمن عند التمهيد فقط عندما لا يكون سجل Plugins
وقت التشغيل متاحًا بعد.

تظل `messaging.resolveParentConversationCandidates(...)` متاحة كخيار
رجوعي قديم للتوافق عندما يحتاج Plugin فقط إلى بدائل الأصل فوق
المعرّف الخام/العام. وإذا وُجد الخطافان معًا، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا ثم لا
تعود إلى `resolveParentConversationCandidates(...)` إلا عندما يهمل الخطاف القياسي
هذه القيم.

## الموافقات وقدرات القنوات

لا تحتاج معظم Plugins القنوات إلى كود خاص بالموافقة.

- تمتلك النواة `/approve` داخل الدردشة نفسها، وحمولات أزرار الموافقة المشتركة، والتسليم الرجوعي العام.
- فضّل استخدام كائن `approvalCapability` واحد على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق التسليم/الأصلي/العرض/المصادقة الخاصة بالموافقة في `approvalCapability`.
- `plugin.auth` مخصّص لتسجيل الدخول/الخروج فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقة من هذا الكائن.
- يشكّل `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` سطح المصادقة القياسي للموافقة.
- استخدم `approvalCapability.getActionAvailabilityState` لتوفر مصادقة الموافقة داخل الدردشة نفسها.
- إذا كانت قناتك تعرض موافقات exec أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل الدردشة نفسها. وتستخدم النواة هذا الخطاف الخاص بـ exec للتمييز بين `enabled` و`disabled`، وتقرير ما إذا كانت قناة البدء تدعم موافقات exec الأصلية، وإدراج القناة ضمن إرشادات الرجوع الاحتياطي للعميل الأصلي. ويملأ `createApproverRestrictedNativeApprovalCapability(...)` ذلك للحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة مثل إخفاء موجّهات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلية أو كبت الرجوع الاحتياطي.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية المملوكة من القناة بشأن الموافقة. واحرص على إبقائه كسول التحميل في نقاط دخول القنوات الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل عند الطلب مع السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد المسار المعطّل مفاتيح الإعداد الدقيقة اللازمة لتمكين موافقات exec الأصلية. ويتلقى الخطاف `{ channel, channelLabel, accountId }`؛ ويجب أن تعرض القنوات ذات الحسابات المسماة مسارات ذات نطاق حساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من القيم الافتراضية العليا.
- إذا كانت القناة تستطيع استنتاج هويات DM ثابتة شبيهة بالمالك من الإعدادات الموجودة، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل الدردشة نفسها من دون إضافة منطق خاص بالموافقة إلى النواة.
- إذا كانت القناة تحتاج إلى تسليم موافقة أصلية، فأبقِ كود القناة مركزًا على تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile`، و`createChannelNativeOriginTargetResolver`، و`createChannelApproverDmTargetResolver`، و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. وضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضّل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك تصفية الطلبات، والتوجيه، وإزالة التكرار، والانتهاء، والاشتراك في Gateway، وإشعارات التوجيه إلى مكان آخر. وقد قُسّم `nativeRuntime` إلى أسطح أصغر:
- `availability` — ما إذا كان الحساب مُعدًا وما إذا كان يجب التعامل مع الطلب
- `presentation` — ربط نموذج عرض الموافقة المشترك بحمولات أصلية معلّقة/محلولة/منتهية أو بإجراءات نهائية
- `transport` — إعداد الأهداف بالإضافة إلى إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — خطافات اختيارية لربط/فك ربط/مسح الإجراء للأزرار أو التفاعلات الأصلية
- `observe` — خطافات تشخيصية اختيارية للتسليم
- إذا كانت القناة تحتاج إلى كائنات مملوكة لوقت التشغيل مثل عميل، أو رمز، أو تطبيق Bolt، أو مستقبل Webhook، فسجّلها عبر `openclaw/plugin-sdk/channel-runtime-context`. ويتيح سجل سياق وقت التشغيل العام للنواة تهيئة معالجات مدفوعة بالقدرات من حالة بدء القناة من دون إضافة طبقة ربط خاصة بالموافقة.
- لا تلجأ إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` الأقل تجريدًا إلا عندما لا يكون سطح القدرات كافي التعبير بعد.
- يجب على قنوات الموافقة الأصلية تمرير كلٍّ من `accountId` و`approvalKind` عبر هذه المساعدات. إذ يبقي `accountId` سياسة الموافقة متعددة الحسابات ضمن نطاق حساب البوت الصحيح، بينما يبقي `approvalKind` سلوك موافقة exec مقابل Plugin متاحًا للقناة من دون فروع ثابتة في النواة.
- أصبحت النواة الآن تملك أيضًا إشعارات إعادة توجيه الموافقات. لذلك يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "ذهبت الموافقة إلى الرسائل المباشرة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بل عليها عرض توجيه الأصل + الرسائل المباشرة للموافق بدقة عبر مساعدات قدرات الموافقة المشتركة وترك النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار إلى دردشة البدء.
- حافظ على نوع معرّف الموافقة المُسلَّم من البداية إلى النهاية. ويجب ألا تقوم العملاء الأصلية
  بتخمين أو إعادة كتابة توجيه موافقة exec مقابل Plugin انطلاقًا من حالة محلية للقناة.
- يمكن لأنواع الموافقات المختلفة أن تعرض عمدًا أسطحًا أصلية مختلفة.
  ومن الأمثلة المضمّنة الحالية:
  - يحتفظ Slack بإتاحة توجيه الموافقة الأصلية لكل من معرّفات exec وPlugin.
  - يحتفظ Matrix بنفس توجيه الرسائل المباشرة/القناة الأصلي وبنفس تجربة التفاعل
    لكل من موافقات exec وPlugin، مع السماح باختلاف المصادقة بحسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافق، لكن ينبغي للكود الجديد تفضيل باني القدرات وعرض `approvalCapability` على Plugin.

بالنسبة إلى نقاط دخول القنوات الساخنة، فضّل المسارات الفرعية الأضيق لوقت التشغيل عندما
تحتاج إلى جزء واحد فقط من هذه العائلة:

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
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح
الأشمل.

وبالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  مهيئات تصحيح الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات
  ملاحظة البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  وكيل الإعداد المُفوَّض
- يشكّل `openclaw/plugin-sdk/setup-adapter-runtime` سطح المهيئ الضيق الواعي بالبيئة
  لـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة الإعداد الاختياري للتثبيت
  بالإضافة إلى بعض البدائيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface`، و`createOptionalChannelSetupAdapter`،

إذا كانت قناتك تدعم إعدادًا أو مصادقة تقاد بالبيئة وكان ينبغي لتدفقات
البدء/الإعدادات العامة معرفة أسماء متغيرات البيئة هذه قبل تحميل وقت التشغيل،
فأعلن عنها في manifest الخاصة بالPlugin عبر `channelEnvVars`.
واحتفظ بـ `envVars` الخاصة بوقت تشغيل القناة أو الثوابت المحلية فقط لنسخ
الإرشادات الموجهة للمشغّل.
`createOptionalChannelSetupWizard`، و`DEFAULT_ACCOUNT_ID`,
و`createTopLevelChannelDmPolicy`، و`setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم السطح الأوسع `openclaw/plugin-sdk/setup` فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/الضبط المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" داخل أسطح الإعداد،
ففضّل `createOptionalChannelSetupSurface(...)`. فالمهيئ/المعالج الناتجان
يغلقان بأمان عند كتابة الإعدادات وإنهائها، ويعيدان استخدام
رسالة التثبيت المطلوبة نفسها عبر التحقق والإنهاء ونص رابط المستندات.

وبالنسبة إلى مسارات القنوات الساخنة الأخرى، فضّل المساعدات الضيقة على الأسطح
القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`،
  و`openclaw/plugin-sdk/account-id`،
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات الحسابات المتعددة
  والرجوع الاحتياطي للحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لأسلاك
  المسار/المغلف الوارد والتسجيل والتوزيع
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الأهداف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى
  مندوبي الهوية/الإرسال الصادر وتخطيط الحمولة
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المهيئات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يظل تخطيط
  حقل حمولة العامل/الوسائط القديم مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع الأوامر المخصصة في Telegram،
  والتحقق من التكرار/التعارض، وعقد إعدادات أوامر ثابت رجوعيًا

غالبًا ما يمكن للقنوات ذات المصادقة فقط الاكتفاء بالمسار الافتراضي: إذ تتولى النواة الموافقات ويعرض Plugin فقط قدرات الإرسال الصادر/المصادقة. أما قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram ووسائل نقل الدردشة المخصصة فيجب أن تستخدم المساعدات الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارات الواردة

أبقِ معالجة الإشارات الواردة مقسّمة إلى طبقتين:

- جمع الأدلة المملوك من Plugin
- تقييم السياسة المشترك

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
واستخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى
الشريط الأوسع لمساعدات الوارد.

ما يناسب المنطق المحلي داخل Plugin:

- اكتشاف الرد على البوت
- اكتشاف الاقتباس من البوت
- فحوصات مشاركة السلسلة
- استبعادات رسائل الخدمة/النظام
- ذاكرات التخزين المؤقت الأصلية للمنصة اللازمة لإثبات مشاركة البوت

ما يناسب المساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح بالإشارة الضمنية
- تجاوز الأوامر
- قرار التخطي النهائي

التدفق المفضّل:

1. احسب حقائق الإشارة المحلية.
2. مرّر هذه الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
3. استخدم `decision.effectiveWasMentioned`، و`decision.shouldBypassMention`، و`decision.shouldSkip` في بوابة الوارد الخاصة بك.

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

يعرض `api.runtime.channel.mentions` مساعدات الإشارة المشتركة نفسها
لـ Plugins القنوات المضمّنة التي تعتمد أصلًا على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات
وقت تشغيل الوارد غير المرتبطة.

لا تزال مساعدات `resolveMentionGating*` الأقدم موجودة على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. وينبغي للكود الجديد
استخدام `resolveInboundMentionDecision({ facts, policy })`.

## الشرح العملي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة وmanifest">
    أنشئ ملفات Plugin القياسية. إن الحقل `channel` في `package.json`
    هو ما يجعل هذا Plugin قناة. وللاطلاع على سطح بيانات تعريف الحزمة الكامل،
    راجع [إعداد Plugin والإعدادات](/ar/plugins/sdk-setup#openclaw-channel):

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

  <Step title="ابنِ كائن Plugin الخاص بالقناة">
    تحتوي الواجهة `ChannelPlugin` على العديد من أسطح المهيئات الاختيارية. ابدأ
    بالحد الأدنى — `id` و`setup` — ثم أضف المهيئات عند الحاجة.

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

    <Accordion title="ما الذي ينجزه createChatChannelPlugin لك">
      بدلًا من تنفيذ واجهات المهيئات منخفضة المستوى يدويًا، فإنك تمرر
      خيارات وصفية ويتولى الباني تجميعها:

      | الخيار | ما الذي يربطه |
      | --- | --- |
      | `security.dm` | محلّل أمان الرسائل المباشرة ذي النطاق من حقول الإعداد |
      | `pairing.text` | تدفق إقران رسائل مباشرة نصي قائم على تبادل الرموز |
      | `threading` | محلّل وضع reply-to (ثابت، أو ضمن نطاق الحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تعيد بيانات وصفية للنتائج (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات مهيئات خام بدلًا من الخيارات الوصفية
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

    ضع واصفات CLI المملوكة من القناة في `registerCliMetadata(...)` حتى يتمكن OpenClaw
    من عرضها في مساعدة الجذر من دون تفعيل وقت تشغيل القناة الكامل،
    بينما تلتقطها التحميلات الكاملة العادية أيضًا لتسجيل الأوامر فعليًا.
    وأبقِ `registerFull(...)` للأعمال الخاصة بوقت التشغيل فقط.
    وإذا كان `registerFull(...)` يسجل طرق Gateway RPC، فاستخدم
    بادئة خاصة بـ Plugin. وتظل مساحات أسماء الإدارة في النواة (`config.*`،
    و`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة وتُحل دائمًا
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` تقسيم أوضاع التسجيل تلقائيًا. راجع
    [نقاط الإدخال](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لجميع
    الخيارات.

  </Step>

  <Step title="أضف إدخال إعداد">
    أنشئ `setup-entry.ts` من أجل تحميل خفيف أثناء التهيئة:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يقوم OpenClaw بتحميل هذا بدلًا من الإدخال الكامل عندما تكون القناة معطلة
    أو غير مهيأة. وهذا يتجنب سحب كود وقت تشغيل ثقيل أثناء تدفقات الإعداد.
    راجع [الإعداد والضبط](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    ويمكن لقنوات مساحة العمل المضمّنة التي تقسم التصديرات الآمنة للإعداد إلى وحدات جانبية
    استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    أداة ضبط صريحة لوقت تشغيل الإعداد.

  </Step>

  <Step title="تعامل مع الرسائل الواردة">
    يحتاج Plugin الخاص بك إلى تلقي الرسائل من المنصة وتمريرها إلى
    OpenClaw. والنمط المعتاد هو Webhook يتحقق من الطلب
    ويوزعه عبر معالج الوارد الخاص بقناتك:

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
      إن التعامل مع الرسائل الواردة خاص بكل قناة. فكل Plugin قناة يملك
      خط معالجة الوارد الخاص به. انظر إلى Plugins القنوات المضمّنة
      (على سبيل المثال حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) لمعرفة الأنماط الفعلية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="اختبر">
اكتب اختبارات موضوعة بجانب الكود في `src/channel.test.ts`:

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

    للاطلاع على مساعدات الاختبار المشتركة، راجع [الاختبار](/ar/plugins/sdk-testing).

  </Step>
</Steps>

## بنية الملفات

```
<bundled-plugin-root>/acme-chat/
├── package.json              # بيانات تعريف openclaw.channel
├── openclaw.plugin.json      # Manifest مع مخطط الإعدادات
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # التصديرات العامة (اختياري)
├── runtime-api.ts            # تصديرات وقت التشغيل الداخلية (اختياري)
└── src/
    ├── channel.ts            # ChannelPlugin عبر createChatChannelPlugin
    ├── channel.test.ts       # اختبارات
    ├── client.ts             # عميل API الخاص بالمنصة
    └── runtime.ts            # مخزن وقت التشغيل (إذا لزم)
```

## موضوعات متقدمة

<CardGroup cols={2}>
  <Card title="خيارات التشجير" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع reply ثابتة، أو ضمن نطاق الحساب، أو مخصصة
  </Card>
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="حل الأهداف" icon="crosshair" href="/ar/plugins/architecture#channel-target-resolution">
    inferTargetChatType وlooksLikeId وresolveTarget
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS، وSTT، والوسائط، والعامل الفرعي عبر api.runtime
  </Card>
</CardGroup>

<Note>
لا تزال بعض أسطح المساعدات المضمّنة موجودة لصيانة Plugins المضمّنة
ولأغراض التوافق. لكنها ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
فضّل المسارات الفرعية العامة channel/setup/reply/runtime من سطح SDK
المشترك ما لم تكن تصون عائلة Plugin مضمّنة مباشرة.
</Note>

## الخطوات التالية

- [Plugins الموفّر](/ar/plugins/sdk-provider-plugins) — إذا كان Plugin الخاص بك يوفّر نماذج أيضًا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل للاستيراد عبر المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار واختبارات العقود
- [Manifest الخاصة بـ Plugin](/ar/plugins/manifest) — المخطط الكامل لـ manifest
