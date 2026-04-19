---
read_when:
    - ترى التحذير `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - ترى التحذير `OPENCLAW_EXTENSION_API_DEPRECATED`
    - أنت تحدّث Plugin إلى بنية Plugin الحديثة
    - أنت تصون Plugin خارجيًا لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: انتقل من طبقة التوافق مع الإصدارات السابقة القديمة إلى Plugin SDK الحديثة
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-19T01:11:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# ترحيل Plugin SDK

انتقلت OpenClaw من طبقة توافق واسعة مع الإصدارات السابقة إلى بنية Plugin حديثة
تستخدم عمليات استيراد مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفّر سطحين مفتوحين على نطاق واسع يسمحان لـ Plugins باستيراد
أي شيء تحتاج إليه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  الأدوات المساعدة. أُضيف هذا للحفاظ على عمل Plugins الأقدم المعتمدة على hooks بينما
  كانت بنية Plugin الجديدة قيد الإنشاء.
- **`openclaw/extension-api`** — جسر منح Plugins وصولًا مباشرًا إلى
  أدوات مساعدة على جانب المضيف مثل مشغّل agent المضمّن.

كلا السطحين أصبح الآن **مهجورًا**. ما زالا يعملان وقت التشغيل، لكن يجب ألا تستخدمهما
Plugins الجديدة، وينبغي على Plugins الحالية الترحيل قبل أن تؤدي الإزالة في
الإصدار الرئيسي التالي إلى توقفها.

<Warning>
  ستُزال طبقة التوافق مع الإصدارات السابقة في إصدار رئيسي مستقبلي.
  Plugins التي ما تزال تستورد من هذه الأسطح ستتعطل عند حدوث ذلك.
</Warning>

## لماذا تغيّر هذا

تسبب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** — كان استيراد أداة مساعدة واحدة يحمّل عشرات الوحدات غير المرتبطة
- **تبعيات دائرية** — كانت إعادة التصدير الواسعة تجعل من السهل إنشاء دورات استيراد
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة أي التصديرات مستقرة وأيها داخلية

يحل Plugin SDK الحديث هذه المشكلات: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة مستقلة بذاتها ذات غرض واضح وعقد موثق.

أزيلت أيضًا واجهات الراحة القديمة الخاصة بالموفّرين للقنوات المضمّنة. عمليات الاستيراد
مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord`
و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp`،
وواجهات الأدوات المساعدة ذات العلامة الخاصة بالقنوات،
و`openclaw/plugin-sdk/telegram-core` كانت اختصارات خاصة بالمستودع الأحادي، وليست
عقود Plugin مستقرة. استخدم بدلًا من ذلك مسارات SDK عامة وضيقة. داخل
مساحة عمل Plugin المضمّن، احتفظ بالأدوات المساعدة المملوكة للموفّر داخل
`api.ts` أو `runtime-api.ts` الخاصين بذلك Plugin.

أمثلة الموفّرين المضمّنين الحالية:

- يحتفظ Anthropic بأدوات المساعدة الخاصة ببث Claude داخل واجهته الخاصة `api.ts` /
  `contract-api.ts`
- يحتفظ OpenAI بمنشئات الموفّر وأدوات المساعدة الخاصة بالنماذج الافتراضية ومنشئات
  الموفّر الفوري داخل `api.ts` الخاص به
- يحتفظ OpenRouter بمنشئ الموفّر وأدوات المساعدة الخاصة بالإعداد/التهيئة داخل
  `api.ts` الخاص به

## كيفية الترحيل

<Steps>
  <Step title="رحّل معالجات approvals الأصلية إلى حقائق capability">
    تعرض Plugins القنوات القادرة على approvals الآن سلوك approvals الأصلي من خلال
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الأساسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصة بـ approvals بعيدًا عن توصيلات
      `plugin.auth` / `plugin.approvals` القديمة إلى `approvalCapability`
    - تمت إزالة `ChannelPlugin.approvals` من العقد العام لـ
      channel-plugin؛ انقل حقول delivery/native/render إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل الدخول/تسجيل الخروج الخاصة بالقنوات فقط؛ أما hooks
      الخاصة بمصادقة approvals هناك فلم يعد core يقرأها
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل clients أو tokens أو تطبيقات Bolt
      من خلال `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة التوجيه المملوكة للـ Plugin من معالجات approvals الأصلية؛
      إذ إن core أصبح الآن يملك إشعارات التوجيه إلى مكان آخر المستندة إلى نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، وفّر
      سطح `createPluginRuntime().channel` حقيقيًا. تُرفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للاطلاع على التخطيط الحالي لـ
    approval capability.

  </Step>

  <Step title="راجع سلوك الرجوع الاحتياطي لغلاف Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`،
    فإن أغلفة Windows من نوع `.cmd`/`.bat` غير المحلولة ستفشل الآن
    بشكل مغلق ما لم تمرّر صراحةً `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    إذا كان المستدعي لديك لا يعتمد عمدًا على الرجوع الاحتياطي عبر shell، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المُلقى بدلًا من ذلك.

  </Step>

  <Step title="اعثر على عمليات الاستيراد المهجورة">
    ابحث في Plugin الخاص بك عن عمليات الاستيراد من أي من السطحين المهجورين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها بعمليات استيراد مركزة">
    يقابل كل تصدير من السطح القديم مسار استيراد حديثًا محددًا:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    بالنسبة إلى الأدوات المساعدة على جانب المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من
    الاستيراد المباشر:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    ينطبق النمط نفسه على أدوات الجسر القديمة الأخرى:

    | الاستيراد القديم | البديل الحديث |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | أدوات مساعدة مخزن الجلسات | `api.runtime.agent.session.*` |

  </Step>

  <Step title="ابنِ واختبر">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسارات الاستيراد

  <Accordion title="جدول مسارات الاستيراد الشائعة">
  | مسار الاستيراد | الغرض | التصديرات الأساسية |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | أداة إدخال Plugin القياسية | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/منشئات إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط التهيئة الجذري | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | أداة إدخال موفّر واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات ومنشئات إدخال قنوات مركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | أدوات مساعدة مشتركة لمعالج الإعداد | مطالبات قائمة السماح، ومنشئات حالة الإعداد |
  | `plugin-sdk/setup-runtime` | أدوات مساعدة لوقت تشغيل الإعداد | محولات patch الآمنة للاستيراد وقت الإعداد، وأدوات مساعدة لملاحظات lookup، و`promptResolvedAllowFrom` و`splitSetupEntries` ووكلاء الإعداد المفوّض |
  | `plugin-sdk/setup-adapter-runtime` | أدوات مساعدة لمحوّل الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | أدوات مساعدة لأدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | أدوات مساعدة متعددة الحسابات | أدوات مساعدة لقائمة/تهيئة الحسابات وبوابة الإجراءات |
  | `plugin-sdk/account-id` | أدوات مساعدة لمعرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | أدوات مساعدة للعثور على الحساب | أدوات مساعدة للعثور على الحساب مع الرجوع إلى الافتراضي |
  | `plugin-sdk/account-helpers` | أدوات مساعدة ضيقة للحساب | أدوات مساعدة لقائمة الحساب/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | محولات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID` و`createTopLevelChannelDmPolicy` و`setSetupChannelEnabled` و`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات إقران الرسائل المباشرة | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد + الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع محولات التهيئة | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | منشئات مخطط التهيئة | أنواع مخطط تهيئة القناة |
  | `plugin-sdk/telegram-command-config` | أدوات مساعدة لتهيئة أوامر Telegram | تطبيع اسم الأمر، وتقليم الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | تحليل سياسات المجموعات/الرسائل المباشرة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | تتبع حالة الحساب | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | أدوات مساعدة للمغلف الوارد | أدوات مساعدة مشتركة للمسار وبناء المغلف |
  | `plugin-sdk/inbound-reply-dispatch` | أدوات مساعدة للرد الوارد | أدوات مساعدة مشتركة للتسجيل والإرسال |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | أدوات مساعدة لتحليل/مطابقة الأهداف |
  | `plugin-sdk/outbound-media` | أدوات مساعدة للوسائط الصادرة | تحميل وسائط صادرة مشتركة |
  | `plugin-sdk/outbound-runtime` | أدوات مساعدة لوقت التشغيل الصادر | أدوات مساعدة لهوية الإرسال/مندوب الإرسال |
  | `plugin-sdk/thread-bindings-runtime` | أدوات مساعدة لربط السلاسل | دورة حياة ربط السلاسل وأدوات المحوّل المساعدة |
  | `plugin-sdk/agent-media-payload` | أدوات مساعدة قديمة لحمولة الوسائط | منشئ حمولة وسائط agent لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | Shim توافق مهجور | أدوات وقت تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin الدائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | أدوات مساعدة واسعة لوقت التشغيل | أدوات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | أدوات مساعدة ضيقة لبيئة وقت التشغيل | المسجّل/بيئة وقت التشغيل، والمهلة، وإعادة المحاولة، وأدوات التراجع المساعدة |
  | `plugin-sdk/plugin-runtime` | أدوات مساعدة مشتركة لوقت تشغيل Plugin | أدوات مساعدة لأوامر/‏hooks/‏http/‏التفاعل الخاصة بـ Plugin |
  | `plugin-sdk/hook-runtime` | أدوات مساعدة لخط أنابيب hook | أدوات مساعدة مشتركة لخط أنابيب Webhook/‏hook الداخلي |
  | `plugin-sdk/lazy-runtime` | أدوات مساعدة لوقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | أدوات مساعدة للعمليات | أدوات مساعدة مشتركة للتنفيذ |
  | `plugin-sdk/cli-runtime` | أدوات مساعدة لوقت تشغيل CLI | تنسيق الأوامر، والانتظار، وأدوات مساعدة للإصدارات |
  | `plugin-sdk/gateway-runtime` | أدوات مساعدة لـ Gateway | عميل Gateway وأدوات patch المساعدة لحالة القناة |
  | `plugin-sdk/config-runtime` | أدوات مساعدة للتهيئة | أدوات مساعدة لتحميل/كتابة التهيئة |
  | `plugin-sdk/telegram-command-config` | أدوات مساعدة لأوامر Telegram | أدوات مساعدة مستقرة احتياطيًا للتحقق من أوامر Telegram عندما لا يكون سطح عقد Telegram المضمّن متاحًا |
  | `plugin-sdk/approval-runtime` | أدوات مساعدة لمطالبات الموافقة | حمولة موافقة exec/‏Plugin، وأدوات capability/profile للموافقة، وأدوات وقت التشغيل/التوجيه للموافقة الأصلية |
  | `plugin-sdk/approval-auth-runtime` | أدوات مساعدة لمصادقة الموافقة | تحليل approver، ومصادقة الإجراءات داخل الدردشة نفسها |
  | `plugin-sdk/approval-client-runtime` | أدوات مساعدة لعميل الموافقة | أدوات مساعدة profile/filter للموافقة الأصلية على exec |
  | `plugin-sdk/approval-delivery-runtime` | أدوات مساعدة لتسليم الموافقة | محولات capability/‏delivery للموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | أدوات مساعدة لـ Gateway الخاصة بالموافقة | أداة مساعدة مشتركة لتحليل approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | أدوات مساعدة لمحوّل الموافقة | أدوات مساعدة خفيفة لتحميل محوّل الموافقة الأصلية لنقاط إدخال القنوات السريعة |
  | `plugin-sdk/approval-handler-runtime` | أدوات مساعدة لمعالج الموافقة | أدوات مساعدة أوسع لوقت تشغيل معالج الموافقة؛ فضّل واجهات المحوّل/‏Gateway الأضيق عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | أدوات مساعدة لهدف الموافقة | أدوات مساعدة أصلية لربط هدف/حساب الموافقة |
  | `plugin-sdk/approval-reply-runtime` | أدوات مساعدة لرد الموافقة | أدوات مساعدة لحمولة رد الموافقة على exec/‏Plugin |
  | `plugin-sdk/channel-runtime-context` | أدوات مساعدة لسياق وقت تشغيل القناة | أدوات مساعدة عامة للتسجيل/الحصول/المراقبة لسياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | أدوات مساعدة للأمان | أدوات مساعدة مشتركة للثقة، وحظر الرسائل المباشرة، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | أدوات مساعدة لسياسة SSRF | أدوات مساعدة لقائمة السماح للمضيف وسياسة الشبكات الخاصة |
  | `plugin-sdk/ssrf-runtime` | أدوات مساعدة لوقت تشغيل SSRF | أدوات مساعدة للـ pinned-dispatcher وguarded fetch وسياسات SSRF |
  | `plugin-sdk/collection-runtime` | أدوات مساعدة للتخزين المؤقت المحدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | أدوات مساعدة لبوابة التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | أدوات مساعدة لتنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، وأدوات مساعدة لمخطط الأخطاء |
  | `plugin-sdk/fetch-runtime` | أدوات مساعدة لـ fetch/proxy المغلف | `resolveFetch`، وأدوات مساعدة للوكيل |
  | `plugin-sdk/host-runtime` | أدوات مساعدة لتطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | أدوات مساعدة لإعادة المحاولة | `RetryConfig`, `retryAsync`، ومنفذات السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | ربط مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | حظر الأوامر وأدوات مساعدة لسطح الأوامر | `resolveControlCommandGate`، وأدوات مساعدة لتفويض المرسِل، وأدوات مساعدة لسجل الأوامر |
  | `plugin-sdk/command-status` | مصيّرات حالة الأوامر/المساعدة | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | أدوات مساعدة لإدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | أدوات مساعدة لطلبات Webhook | أدوات مساعدة لهدف Webhook |
  | `plugin-sdk/webhook-request-guards` | أدوات مساعدة لحماية جسم طلب Webhook | أدوات مساعدة لقراءة/تحديد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، وHeartbeat، ومخطط الرد، والتقسيم |
  | `plugin-sdk/reply-dispatch-runtime` | أدوات مساعدة ضيقة لإرسال الرد | أدوات مساعدة للإتمام + إرسال الموفّر |
  | `plugin-sdk/reply-history` | أدوات مساعدة لسجل الردود | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | أدوات مساعدة لتقسيم الرد | أدوات مساعدة لتقسيم النص/‏markdown |
  | `plugin-sdk/session-store-runtime` | أدوات مساعدة لمخزن الجلسات | أدوات مساعدة لمسار المخزن و`updated-at` |
  | `plugin-sdk/state-paths` | أدوات مساعدة لمسارات الحالة | أدوات مساعدة لدلائل الحالة وOAuth |
  | `plugin-sdk/routing` | أدوات مساعدة للتوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، وأدوات مساعدة لتطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | أدوات مساعدة لحالة القناة | منشئات ملخص حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، وأدوات مساعدة لبيانات المشكلات |
  | `plugin-sdk/target-resolver-runtime` | أدوات مساعدة لتحليل الهدف | أدوات مساعدة مشتركة لتحليل الهدف |
  | `plugin-sdk/string-normalization-runtime` | أدوات مساعدة لتطبيع السلاسل | أدوات مساعدة لتطبيع slug/السلاسل |
  | `plugin-sdk/request-url` | أدوات مساعدة لعنوان URL للطلب | استخراج عناوين URL النصية من مدخلات شبيهة بالطلب |
  | `plugin-sdk/run-command` | أدوات مساعدة للأوامر المؤقتة | مشغّل أوامر مؤقت مع stdout/stderr مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعلمات | قارئات شائعة لمعلمات الأدوات/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من معاملات الأداة |
  | `plugin-sdk/temp-path` | أدوات مساعدة للمسارات المؤقتة | أدوات مساعدة مشتركة لمسارات التنزيل المؤقتة |
  | `plugin-sdk/logging-core` | أدوات مساعدة للتسجيل | مسجّل subsystem وأدوات إخفاء البيانات الحساسة |
  | `plugin-sdk/markdown-table-runtime` | أدوات مساعدة لجداول Markdown | أدوات مساعدة لوضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع ردود الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | أدوات مساعدة منسقة لإعداد الموفّر المحلي/المستضاف ذاتيًا | أدوات مساعدة لاكتشاف/تهيئة الموفّر المستضاف ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | أدوات مساعدة مركزة لإعداد موفّر OpenAI-compatible المستضاف ذاتيًا | أدوات المساعدة نفسها لاكتشاف/تهيئة الموفّر المستضاف ذاتيًا |
  | `plugin-sdk/provider-auth-runtime` | أدوات مساعدة لمصادقة وقت تشغيل الموفّر | أدوات مساعدة لتحليل API-key وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | أدوات مساعدة لإعداد API-key للموفّر | أدوات مساعدة للإعداد وكتابة الملف التعريفي لـ API-key |
  | `plugin-sdk/provider-auth-result` | أدوات مساعدة لنتيجة مصادقة الموفّر | منشئ قياسي لنتيجة مصادقة OAuth |
  | `plugin-sdk/provider-auth-login` | أدوات مساعدة لتسجيل الدخول التفاعلي للموفّر | أدوات مساعدة مشتركة لتسجيل الدخول التفاعلي |
  | `plugin-sdk/provider-env-vars` | أدوات مساعدة لمتغيرات البيئة الخاصة بالموفّر | أدوات مساعدة للعثور على متغيرات بيئة مصادقة الموفّر |
  | `plugin-sdk/provider-model-shared` | أدوات مساعدة مشتركة لنموذج/إعادة تشغيل الموفّر | `ProviderReplayFamily` و`buildProviderReplayFamilyHooks` و`normalizeModelCompat`، ومنشئات سياسات إعادة التشغيل المشتركة، وأدوات مساعدة لنقاط نهاية الموفّر، وأدوات مساعدة لتطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | أدوات مساعدة مشتركة لفهرس الموفّر | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات onboarding للموفّر | أدوات مساعدة لتهيئة onboarding |
  | `plugin-sdk/provider-http` | أدوات مساعدة HTTP للموفّر | أدوات مساعدة عامة لقدرات HTTP/نقاط النهاية الخاصة بالموفّر |
  | `plugin-sdk/provider-web-fetch` | أدوات مساعدة web-fetch للموفّر | أدوات مساعدة لتسجيل/تخزين موفّر web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | أدوات مساعدة لتهيئة web-search للموفّر | أدوات مساعدة ضيقة للتهيئة/بيانات الاعتماد الخاصة بـ web-search للموفّرين الذين لا يحتاجون إلى توصيل تمكين Plugin |
  | `plugin-sdk/provider-web-search-contract` | أدوات مساعدة لعقد web-search للموفّر | أدوات مساعدة ضيقة لعقد التهيئة/بيانات الاعتماد الخاصة بـ web-search مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` وواضعات/جالبات بيانات الاعتماد المقيّدة |
  | `plugin-sdk/provider-web-search` | أدوات مساعدة web-search للموفّر | أدوات مساعدة لتسجيل/تخزين/وقت تشغيل موفّر web-search |
  | `plugin-sdk/provider-tools` | أدوات مساعدة التوافق للأدوات/المخططات الخاصة بالموفّر | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، وأدوات التوافق الخاصة بـ xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | أدوات مساعدة لاستخدام الموفّر | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، وأدوات مساعدة أخرى لاستخدام الموفّر |
  | `plugin-sdk/provider-stream` | أدوات مساعدة لأغلفة تدفّق الموفّر | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع أغلفة التدفّق، وأدوات مساعدة مشتركة لأغلفة Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | أدوات مساعدة لنقل الموفّر | أدوات مساعدة أصلية لنقل الموفّر مثل guarded fetch وتحويلات رسائل النقل وتدفّقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | قائمة انتظار async مرتبة | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | أدوات مساعدة مشتركة للوسائط | أدوات مساعدة لجلب/تحويل/تخزين الوسائط بالإضافة إلى منشئات حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | أدوات مساعدة مشتركة لتوليد الوسائط | أدوات مساعدة مشتركة للفشل الاحتياطي واختيار المرشّحين ورسائل النماذج المفقودة لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | أدوات مساعدة لفهم الوسائط | أنواع موفّر فهم الوسائط بالإضافة إلى تصديرات أدوات مساعدة موجّهة للموفّر للصور/الصوت |
  | `plugin-sdk/text-runtime` | أدوات مساعدة مشتركة للنص | إزالة النص المرئي للمساعد، وأدوات مساعدة لعرض/تقسيم/جداول markdown، وأدوات إخفاء البيانات الحساسة، وأدوات وسم التوجيهات، وأدوات النص الآمن، وأدوات أخرى مرتبطة بالنص/التسجيل |
  | `plugin-sdk/text-chunking` | أدوات مساعدة لتقسيم النص | أداة مساعدة لتقسيم النص الصادر |
  | `plugin-sdk/speech` | أدوات مساعدة للكلام | أنواع موفّر الكلام بالإضافة إلى أدوات مساعدة موجّهة للموفّر للتوجيهات والسجل والتحقق |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع موفّر الكلام، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | أدوات مساعدة للنسخ الفوري | أنواع الموفّر وأدوات مساعدة للسجل |
  | `plugin-sdk/realtime-voice` | أدوات مساعدة للصوت الفوري | أنواع الموفّر وأدوات مساعدة للسجل |
  | `plugin-sdk/image-generation-core` | النواة المشتركة لتوليد الصور | أنواع توليد الصور، والفشل الاحتياطي، والمصادقة، وأدوات مساعدة للسجل |
  | `plugin-sdk/music-generation` | أدوات مساعدة لتوليد الموسيقى | أنواع موفّر/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | النواة المشتركة لتوليد الموسيقى | أنواع توليد الموسيقى، وأدوات الفشل الاحتياطي، والعثور على الموفّر، وتحليل model-ref |
  | `plugin-sdk/video-generation` | أدوات مساعدة لتوليد الفيديو | أنواع موفّر/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | النواة المشتركة لتوليد الفيديو | أنواع توليد الفيديو، وأدوات الفشل الاحتياطي، والعثور على الموفّر، وتحليل model-ref |
  | `plugin-sdk/interactive-runtime` | أدوات مساعدة للرد التفاعلي | تطبيع/تقليل حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات تهيئة القناة | بدائيات ضيقة لمخطط تهيئة القناة |
  | `plugin-sdk/channel-config-writes` | أدوات مساعدة لكتابة تهيئة القناة | أدوات مساعدة لتفويض كتابة تهيئة القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | تصديرات تمهيد مشتركة لـ channel plugin |
  | `plugin-sdk/channel-status` | أدوات مساعدة لحالة القناة | أدوات مساعدة مشتركة للقطات/ملخصات حالة القناة |
  | `plugin-sdk/allowlist-config-edit` | أدوات مساعدة لتهيئة قائمة السماح | أدوات مساعدة لتحرير/قراءة تهيئة قائمة السماح |
  | `plugin-sdk/group-access` | أدوات مساعدة للوصول إلى المجموعات | أدوات مساعدة مشتركة لاتخاذ قرارات الوصول إلى المجموعات |
  | `plugin-sdk/direct-dm` | أدوات مساعدة Direct-DM | أدوات مساعدة مشتركة للمصادقة/الحماية الخاصة بـ Direct-DM |
  | `plugin-sdk/extension-shared` | أدوات مساعدة مشتركة للامتداد | بدائيات القناة/الحالة السلبية وأدوات مساعدة الوكيل المحيط |
  | `plugin-sdk/webhook-targets` | أدوات مساعدة لأهداف Webhook | أدوات مساعدة لسجل أهداف Webhook وتثبيت المسارات |
  | `plugin-sdk/webhook-path` | أدوات مساعدة لمسار Webhook | أدوات مساعدة لتطبيع مسار Webhook |
  | `plugin-sdk/web-media` | أدوات مساعدة مشتركة لوسائط الويب | أدوات مساعدة لتحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | إعادة تصدير `zod` لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | أدوات مساعدة memory-core المضمّنة | سطح أدوات مساعدة مدير الذاكرة/التهيئة/الملف/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل لمحرك الذاكرة | واجهة وقت تشغيل لفهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك الأساس لمضيف الذاكرة | تصديرات محرك الأساس لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك التضمينات لمضيف الذاكرة | عقود تضمينات الذاكرة، والوصول إلى السجل، والموفّر المحلي، وأدوات مساعدة عامة للدفعات/البعيد؛ أما الموفّرون البعيدون الملموسون فيوجدون داخل Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | تصديرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك التخزين لمضيف الذاكرة | تصديرات محرك التخزين لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | أدوات مساعدة متعددة الوسائط لمضيف الذاكرة | أدوات مساعدة متعددة الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | أدوات مساعدة للاستعلام لمضيف الذاكرة | أدوات مساعدة للاستعلام لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | أدوات مساعدة للأسرار لمضيف الذاكرة | أدوات مساعدة للأسرار لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | أدوات مساعدة لسجل أحداث مضيف الذاكرة | أدوات مساعدة لسجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | أدوات مساعدة لحالة مضيف الذاكرة | أدوات مساعدة لحالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | أدوات مساعدة لوقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل النواة لمضيف الذاكرة | أدوات مساعدة لوقت تشغيل النواة لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | أدوات مساعدة للملفات/وقت التشغيل لمضيف الذاكرة | أدوات مساعدة للملفات/وقت التشغيل لمضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لوقت تشغيل النواة لمضيف الذاكرة | اسم مستعار محايد للمورّد لأدوات مساعدة وقت تشغيل نواة مضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار لسجل أحداث مضيف الذاكرة | اسم مستعار محايد للمورّد لأدوات مساعدة سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار للملفات/وقت التشغيل لمضيف الذاكرة | اسم مستعار محايد للمورّد لأدوات مساعدة ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | أدوات مساعدة لـ markdown المُدار | أدوات مساعدة مشتركة لـ markdown المُدار للـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل lazy لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم مستعار لحالة مضيف الذاكرة | اسم مستعار محايد للمورّد لأدوات مساعدة حالة مضيف الذاكرة |
  | `plugin-sdk/memory-lancedb` | أدوات مساعدة memory-lancedb المضمّنة | سطح أدوات مساعدة memory-lancedb |
  | `plugin-sdk/testing` | أدوات الاختبار | أدوات مساعدة ومحاكاة للاختبار |
</Accordion>

هذا الجدول هو عمدًا المجموعة الشائعة الخاصة بالترحيل، وليس سطح SDK
الكامل. القائمة الكاملة التي تضم أكثر من 200 نقطة دخول موجودة في
`scripts/lib/plugin-sdk-entrypoints.json`.

ما تزال تلك القائمة تتضمن بعض واجهات الأدوات المساعدة الخاصة بالـ Plugins المضمّنة مثل
`plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و`plugin-sdk/zalo`،
و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. ما تزال هذه الواجهات مُصدَّرة من أجل
صيانة Plugins المضمّنة والتوافق، لكنها مُستبعَدة عمدًا من جدول الترحيل الشائع
وليست الهدف الموصى به لكتابة Plugin جديدة.

تنطبق القاعدة نفسها على عائلات الأدوات المساعدة المضمّنة الأخرى مثل:

- أدوات مساعدة دعم المتصفح: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- واجهات الأدوات المساعدة/الـ Plugin المضمّنة مثل `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, و`plugin-sdk/voice-call`

يعرض `plugin-sdk/github-copilot-token` حاليًا السطح الضيق الخاص بأداة مساعدة
الرمز المميز `DEFAULT_COPILOT_API_BASE_URL`،
و`deriveCopilotApiBaseUrlFromToken`، و`resolveCopilotApiToken`.

استخدم أضيق استيراد يطابق المهمة. إذا لم تتمكن من العثور على تصدير،
فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## الجدول الزمني للإزالة

| متى | ما الذي يحدث |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن** | تصدر الأسطح المهجورة تحذيرات وقت تشغيل |
| **الإصدار الرئيسي التالي** | ستُزال الأسطح المهجورة؛ وستفشل Plugins التي ما تزال تستخدمها |

لقد رُحِّلت جميع Plugins الأساسية بالفعل. وينبغي على Plugins الخارجية الترحيل
قبل الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا منفذ هروب مؤقت، وليس حلًا دائمًا.

## ذو صلة

- [البدء](/ar/plugins/building-plugins) — ابنِ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل للاستيراد عبر المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins الموفّر](/ar/plugins/sdk-provider-plugins) — بناء Plugins الموفّر
- [الجوانب الداخلية للـ Plugin](/ar/plugins/architecture) — تعمق في البنية
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان
