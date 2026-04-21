---
read_when:
    - أنت ترى التحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - أنت ترى التحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - أنت تحدّث Plugin إلى بنية Plugin الحديثة
    - أنت تصون Plugin خارجيًا لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الانتقال من طبقة التوافق مع الإصدارات السابقة القديمة إلى Plugin SDK الحديث
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-21T07:23:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d2ea9a8cc869b943ad774ac0ddb8828b80ce86432ece7b9aeed4f1edb30859
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# ترحيل Plugin SDK

انتقل OpenClaw من طبقة توافق واسعة مع الإصدارات السابقة إلى بنية Plugin
حديثة ذات استيرادات مركزة وموثقة. إذا كان Plugin لديك قد بُني قبل
البنية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفر سطحين مفتوحين على مصراعيهما يسمحان لـ Plugins
باستيراد أي شيء تحتاجه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  المساعدات. وقد أُدخل للإبقاء على Plugins الأقدم المعتمدة على hook
  تعمل أثناء بناء بنية Plugin الجديدة.
- **`openclaw/extension-api`** — جسر منح Plugins وصولًا مباشرًا إلى
  مساعدات جانب المضيف مثل مشغّل الوكيل المضمّن.

كلا السطحين الآن **مهجوران**. لا يزالان يعملان وقت التشغيل، لكن يجب ألا تستخدمهما
Plugins الجديدة، وينبغي على Plugins الحالية الترحيل قبل أن تزيلهما
الإصدارة الرئيسية التالية.

<Warning>
  ستتم إزالة طبقة التوافق مع الإصدارات السابقة في إصدار رئيسي مستقبلي.
  وستتعطل Plugins التي لا تزال تستورد من هذه الأسطح عند حدوث ذلك.
</Warning>

## لماذا تغيّر هذا

تسبب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** — كان استيراد مساعد واحد يحمّل عشرات الوحدات غير ذات الصلة
- **اعتماديات دائرية** — جعلت إعادة التصدير الواسعة من السهل إنشاء دورات استيراد
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة الصادرات المستقرة مقابل الداخلية

يصلح Plugin SDK الحديث ذلك: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة مستقلة ذات غرض واضح وعقد موثق.

كما أُزيلت أيضًا طبقات الراحة القديمة الخاصة بالمزوّدين للقنوات المضمّنة. فعمليات الاستيراد
مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord`،
و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp`،
وطبقات المساعدة الممهورة بالقناة، و
`openclaw/plugin-sdk/telegram-core` كانت اختصارات خاصة بـ mono-repo، وليست
عقود Plugin مستقرة. استخدم بدلًا من ذلك مسارات فرعية عامة وضيقة من SDK. داخل
مساحة عمل Plugin المضمّن، احتفظ بالمساعدات المملوكة للمزوّد في
`api.ts` أو `runtime-api.ts` الخاصة بذلك Plugin.

أمثلة المزوّدين المضمّنين الحالية:

- يحتفظ Anthropic بمساعدات البث الخاصة بـ Claude في طبقة
  `api.ts` / `contract-api.ts` الخاصة به
- يحتفظ OpenAI بمنشئي المزوّد، ومساعدات النماذج الافتراضية، ومنشئي
  مزوّد الوقت الحقيقي في `api.ts` الخاصة به
- يحتفظ OpenRouter بمنشئ المزوّد ومساعدات onboarding/config في
  `api.ts` الخاصة به

## كيفية الترحيل

<Steps>
  <Step title="رحّل معالجات approval-native إلى حقائق capability">
    تكشف Plugins القنوات القادرة على الموافقة الآن عن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الأساسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصين بالموافقة بعيدًا عن الربط القديم
      `plugin.auth` / `plugin.approvals` إلى `approvalCapability`
    - تمت إزالة `ChannelPlugin.approvals` من عقد Plugin القناة العام؛
      انقل حقول delivery/native/render إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات login/logout الخاصة بالقناة فقط؛ ولم تعد
      hookات مصادقة الموافقة هناك مقروءة من core
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل clients أو tokens أو
      تطبيقات Bolt عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات reroute مملوكة لـ Plugin من معالجات الموافقة الأصلية؛
      إذ يملك core الآن إشعارات التوجيه إلى مكان آخر من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، وفّر
      سطح `createPluginRuntime().channel` حقيقيًا. تُرفض stubs الجزئية.

    راجع `/plugins/sdk-channel-plugins` لمعرفة تخطيط capability الحالي
    للموافقة.

  </Step>

  <Step title="راجع سلوك الرجوع في Windows wrapper">
    إذا كان Plugin لديك يستخدم `openclaw/plugin-sdk/windows-spawn`،
    فإن wrappers غير المحلولة من نوع Windows ‏`.cmd`/`.bat` تفشل الآن بإغلاق افتراضي
    ما لم تمرر صراحةً `allowShellFallback: true`.

    ```typescript
    // قبل
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // بعد
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // اضبط هذا فقط للمستدعين التوافقيين الموثوقين الذين
      // يقبلون عمدًا الرجوع بوساطة shell.
      allowShellFallback: true,
    });
    ```

    إذا لم يكن المستدعي لديك يعتمد عمدًا على الرجوع إلى shell، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المطروح بدلًا من ذلك.

  </Step>

  <Step title="اعثر على عمليات الاستيراد المهجورة">
    ابحث في Plugin لديك عن عمليات استيراد من أيٍّ من السطحين المهجورين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها باستيرادات مركزة">
    كل تصدير من السطح القديم يُطابق مسار استيراد حديثًا محددًا:

    ```typescript
    // قبل (طبقة التوافق المهجورة مع الإصدارات السابقة)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // بعد (استيرادات حديثة ومركزة)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    بالنسبة إلى مساعدات جانب المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من الاستيراد
    المباشر:

    ```typescript
    // قبل (جسر extension-api المهجور)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // بعد (وقت تشغيل محقون)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    ينطبق النمط نفسه على مساعدات الجسر القديمة الأخرى:

    | الاستيراد القديم | المكافئ الحديث |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | مساعدات مخزن الجلسة | `api.runtime.agent.session.*` |

  </Step>

  <Step title="أنشئ واختبر">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسارات الاستيراد

  <Accordion title="جدول مسارات الاستيراد الشائعة">
  | مسار الاستيراد | الغرض | أهم الصادرات |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | المساعد القياسي لإدخال Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/منشئي إدخالات القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط الإعدادات الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | المساعد لإدخال مزود واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات ومنشئو إدخالات قنوات مركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة | مطالبات قائمة السماح، وبناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت تشغيل الإعداد | محوّلات patch آمنة للاستيراد وقت الإعداد، ومساعدات lookup-note، و`promptResolvedAllowFrom`، و`splitSetupEntries`، وproxys الإعداد المفوضة |
  | `plugin-sdk/setup-adapter-runtime` | مساعدات محوّل الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/الإعدادات/تقييد الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب | مساعدات البحث عن الحساب + الرجوع إلى الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات حساب ضيقة | مساعدات قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | محوّلات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات اقتران DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد + الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع محوّل الإعدادات | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | منشئو مخطط الإعدادات | أنواع مخطط إعدادات القناة |
  | `plugin-sdk/telegram-command-config` | مساعدات إعداد أوامر Telegram | تطبيع اسم الأمر، وقص الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسة المجموعة/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | تتبع حالة الحساب | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | مساعدات الغلاف الوارد | مساعدات المسار المشترك + بناء الغلاف |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدات الرد الوارد | مساعدات التسجيل والإرسال المشتركة |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | مساعدات تحليل/مطابقة الأهداف |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشترك |
  | `plugin-sdk/outbound-runtime` | مساعدات وقت التشغيل الصادر | مساعدات هوية الإرسال/التفويض وتخطيط الحمولة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط الخيوط | دورة حياة ربط الخيوط ومساعدات المحوّل |
  | `plugin-sdk/agent-media-payload` | مساعدات قديمة لحمولة الوسائط | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | shim توافق مهجور | أدوات وقت تشغيل القناة القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتيجة الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin الدائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات بيئة وقت تشغيل ضيقة | Logger/بيئة وقت التشغيل، والمهلة، وإعادة المحاولة، ومساعدات backoff |
  | `plugin-sdk/plugin-runtime` | مساعدات وقت تشغيل Plugin المشتركة | مساعدات أوامر/hook/HTTP/تفاعلية لـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار hook | مساعدات مسار Webhook/internal hook المشتركة |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت تشغيل كسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات exec المشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدار |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway ومساعدات patch لحالة القناة |
  | `plugin-sdk/config-runtime` | مساعدات الإعدادات | مساعدات تحميل/كتابة الإعدادات |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات تحقق مستقرة بالرجوع لأوامر Telegram عندما لا يتوفر سطح عقد Telegram المضمّن |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبة الموافقة | حمولة موافقة exec/Plugin، ومساعدات capability/profile للموافقة، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة الموافقة | حل الموافقين، ومصادقة الإجراء في الدردشة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات profile/filter لموافقة exec الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | محوّلات capability/delivery للموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway للموافقة | مساعد حل Gateway المشترك للموافقة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات محوّل الموافقة | مساعدات خفيفة لتحميل محوّل الموافقة الأصلية لنقاط إدخال القنوات السريعة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ فضّل طبقات المحوّل/Gateway الأضيق عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط الهدف/الحساب للموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد موافقة exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق وقت تشغيل القناة | مساعدات عامة لتسجيل/get/watch لسياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات الثقة المشتركة، وتقييد DM، والمحتوى الخارجي، وتجميع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة سماح المضيف وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | مساعدات pinned-dispatcher، وguarded fetch، وسياسة SSRF |
  | `plugin-sdk/collection-runtime` | مساعدات cache محدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات تقييد التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، ومساعدات مخطط الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدات fetch/proxy مغلّفة | `resolveFetch`، ومساعدات proxy |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`، ومشغلات السياسة |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | تقييد الأوامر ومساعدات سطح الأوامر | `resolveControlCommandGate`، ومساعدات تخويل المرسل، ومساعدات سجل الأوامر |
  | `plugin-sdk/command-status` | عارضات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدات إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلب Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات guard لجسم طلب Webhook | مساعدات قراءة/تحديد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، وHeartbeat، ومخطط الرد، والتقسيم |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال الرد | مساعدات finalize + إرسال المزوّد |
  | `plugin-sdk/reply-history` | مساعدات سجل الرد | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات تقسيم الرد | مساعدات تقسيم النص/Markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسة | مساعدات مسار المخزن + updated-at |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات دليل الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدات تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | بناة ملخص حالة القناة/الحساب، وإعدادات وقت التشغيل الافتراضية، ومساعدات بيانات تعريف المشكلة |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلل الهدف | مساعدات محلل الهدف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع السلاسل | مساعدات تطبيع slug/string |
  | `plugin-sdk/request-url` | مساعدات URL للطلب | استخراج URLs نصية من مدخلات تشبه الطلب |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقّتة | مشغّل أوامر موقّت مع stdout/stderr مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعاملات | قارئات معاملات شائعة للأدوات/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج حمولات مطبّعة من كائنات نتيجة الأداة |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من معاملات الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسار المؤقت | مساعدات مسار تنزيل مؤقت مشترك |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | Logger النظام الفرعي ومساعدات التنقيح |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جدول Markdown | مساعدات وضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسالة | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات منتقاة لإعداد مزود محلي/مستضاف ذاتيًا | مساعدات اكتشاف/إعداد المزوّد المستضاف ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد مزودات OpenAI-compatible المستضافة ذاتيًا | مساعدات اكتشاف/إعداد المزوّد المستضاف ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة المزود وقت التشغيل | مساعدات حل API-key وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد API-key للمزوّد | مساعدات onboarding/profile-write لـ API-key |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة المزوّد | باني auth-result قياسي لـ OAuth |
  | `plugin-sdk/provider-auth-login` | مساعدات login التفاعلي للمزوّد | مساعدات login التفاعلي المشتركة |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات البيئة للمزوّد | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج/إعادة تشغيل المزوّد | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبناة سياسة إعادة التشغيل المشتركة، ومساعدات نقطة نهاية المزوّد، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات catalog مشتركة للمزوّد | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات onboarding للمزوّد | مساعدات إعدادات onboarding |
  | `plugin-sdk/provider-http` | مساعدات HTTP للمزوّد | مساعدات عامة لإمكانات HTTP/نقطة النهاية للمزوّد |
  | `plugin-sdk/provider-web-fetch` | مساعدات web-fetch للمزوّد | مساعدات تسجيل/cache لمزوّد web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات إعداد web-search للمزوّد | مساعدات ضيقة لإعداد/بيانات اعتماد web-search للمزوّدين الذين لا يحتاجون إلى ربط تمكين Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد web-search للمزوّد | مساعدات ضيقة لعقد إعداد/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` وعمليات setter/getter لبيانات الاعتماد ضمن النطاق |
  | `plugin-sdk/provider-web-search` | مساعدات web-search للمزوّد | مساعدات تسجيل/cache/وقت تشغيل لمزوّد web-search |
  | `plugin-sdk/provider-tools` | مساعدات توافق أداة/مخطط المزوّد | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام المزوّد | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، ومساعدات استخدام مزوّد أخرى |
  | `plugin-sdk/provider-stream` | مساعدات غلاف تدفق المزوّد | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع غلاف التدفق، ومساعدات أغلفة مشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد | مساعدات نقل مزوّد أصلية مثل guarded fetch، وتحويلات رسائل النقل، وتدفقات أحداث نقل قابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | قائمة انتظار async مرتبة | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات وسائط مشتركة | مساعدات fetch/transform/store للوسائط بالإضافة إلى بناة حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لإنشاء الوسائط | مساعدات failover مشتركة، واختيار المرشحين، ورسائل النموذج المفقود لإنشاء الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع مزود فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت المواجهة للمزوّد |
  | `plugin-sdk/text-runtime` | مساعدات نص مشتركة | إزالة النص المرئي للمساعد، ومساعدات عرض/تقسيم/جداول markdown، ومساعدات التنقيح، ومساعدات directive-tag، وأدوات النص الآمن، ومساعدات نص/تسجيل ذات صلة |
  | `plugin-sdk/text-chunking` | مساعدات تقسيم النص | مساعد تقسيم النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع مزود الكلام بالإضافة إلى مساعدات directives والسجل والتحقق الموجّهة للمزوّد |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع مزود الكلام، والسجل، وdirectives، والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ الفوري | أنواع المزوّد ومساعدات السجل |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع المزوّد ومساعدات السجل |
  | `plugin-sdk/image-generation-core` | نواة إنشاء الصور المشتركة | أنواع إنشاء الصور، وfailover، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات إنشاء الموسيقى | أنواع مزود/طلب/نتيجة إنشاء الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة إنشاء الموسيقى المشتركة | أنواع إنشاء الموسيقى، ومساعدات failover، والبحث عن المزوّد، وتحليل مرجع النموذج |
  | `plugin-sdk/video-generation` | مساعدات إنشاء الفيديو | أنواع مزود/طلب/نتيجة إنشاء الفيديو |
  | `plugin-sdk/video-generation-core` | نواة إنشاء الفيديو المشتركة | أنواع إنشاء الفيديو، ومساعدات failover، والبحث عن المزوّد، وتحليل مرجع النموذج |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/تقليل حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات إعداد القناة | بدائيات ضيقة لمخطط إعداد القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة إعداد القناة | مساعدات تخويل كتابة إعداد القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | صادرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات مشتركة للقطات/ملخصات حالة القناة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات إعداد قائمة السماح | مساعدات تحرير/قراءة إعداد قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات مشتركة لقرارات وصول المجموعة |
  | `plugin-sdk/direct-dm` | مساعدات DM المباشر | مساعدات مشتركة لمصادقة/حراسة DM المباشر |
  | `plugin-sdk/extension-shared` | مساعدات extension مشتركة | بدائيات مساعدات القناة السلبية/الحالة وambient proxy |
  | `plugin-sdk/webhook-targets` | مساعدات أهداف Webhook | سجل أهداف Webhook ومساعدات تثبيت المسار |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات تطبيع مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط ويب مشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | إعادة تصدير `zod` لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | مساعدات memory-core المضمّنة | سطح مساعدات مدير الذاكرة/الإعداد/الملف/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | صادرات محرك الأساس لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك التضمينات لمضيف الذاكرة | عقود تضمينات الذاكرة، والوصول إلى السجل، والمزوّد المحلي، ومساعدات batch/remote العامة؛ بينما تعيش المزوّدات البعيدة الملموسة في Plugins المالكة لها |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك التخزين لمضيف الذاكرة | صادرات محرك التخزين لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة | مساعدات متعددة الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة | مساعدات استعلام مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات أسرار مضيف الذاكرة | مساعدات أسرار مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات دفتر أحداث مضيف الذاكرة | مساعدات دفتر أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت التشغيل الأساسي لمضيف الذاكرة | مساعدات وقت التشغيل الأساسي لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم بديل لوقت التشغيل الأساسي لمضيف الذاكرة | اسم بديل محايد تجاه المزوّد لمساعدات وقت التشغيل الأساسي لمضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم بديل لدفتر أحداث مضيف الذاكرة | اسم بديل محايد تجاه المزوّد لمساعدات دفتر أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم بديل لملفات/وقت تشغيل مضيف الذاكرة | اسم بديل محايد تجاه المزوّد لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات markdown المُدارة | مساعدات markdown مُدارة مشتركة لـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم بديل لحالة مضيف الذاكرة | اسم بديل محايد تجاه المزوّد لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-lancedb` | مساعدات memory-lancedb المضمّنة | سطح مساعدات memory-lancedb |
  | `plugin-sdk/testing` | أدوات الاختبار | مساعدات ومحاكيات الاختبار |
</Accordion>

هذا الجدول هو عمدًا المجموعة الشائعة للترحيل، وليس سطح SDK الكامل.
توجد القائمة الكاملة التي تضم أكثر من 200 نقطة دخول في
`scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال تلك القائمة تتضمن بعض طبقات المساعدة الخاصة بـ Plugins المضمّنة مثل
`plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و`plugin-sdk/zalo`،
و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. تظل هذه مُصدَّرة لصيانة
Plugins المضمّنة والتوافق، لكنها مُهمَلة عمدًا من جدول الترحيل الشائع وليست
الهدف الموصى به لكود Plugin الجديد.

تنطبق القاعدة نفسها على عائلات المساعدات المضمّنة الأخرى مثل:

- مساعدات دعم المتصفح: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: ‏`plugin-sdk/matrix*`
- LINE: ‏`plugin-sdk/line*`
- IRC: ‏`plugin-sdk/irc*`
- الأسطح المضمّنة للمساعد/Plugin مثل `plugin-sdk/googlechat`,
  و`plugin-sdk/zalouser`، و`plugin-sdk/bluebubbles*`,
  و`plugin-sdk/mattermost*`, و`plugin-sdk/msteams`,
  و`plugin-sdk/nextcloud-talk`, و`plugin-sdk/nostr`, و`plugin-sdk/tlon`,
  و`plugin-sdk/twitch`,
  و`plugin-sdk/github-copilot-login`, و`plugin-sdk/github-copilot-token`,
  و`plugin-sdk/diagnostics-otel`, و`plugin-sdk/diffs`, و`plugin-sdk/llm-task`,
  و`plugin-sdk/thread-ownership`, و`plugin-sdk/voice-call`

يكشف `plugin-sdk/github-copilot-token` حاليًا عن سطح مساعدات الرموز الضيق
`DEFAULT_COPILOT_API_BASE_URL`،
و`deriveCopilotApiBaseUrlFromToken`، و`resolveCopilotApiToken`.

استخدم أضيق استيراد يطابق المهمة. وإذا لم تتمكن من العثور على تصدير،
فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## الجدول الزمني للإزالة

| متى                   | ما الذي يحدث                                                           |
| --------------------- | ---------------------------------------------------------------------- |
| **الآن**              | تُصدر الأسطح المهجورة تحذيرات وقت تشغيل                                |
| **الإصدار الرئيسي التالي** | ستتم إزالة الأسطح المهجورة؛ وستفشل Plugins التي لا تزال تستخدمها |

تم بالفعل ترحيل جميع Plugins الأساسية. وينبغي على Plugins الخارجية الترحيل
قبل الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا منفذ هروب مؤقت، وليس حلًا دائمًا.

## ذات صلة

- [البدء](/ar/plugins/building-plugins) — ابنِ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع كامل لاستيراد المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins المزوّد](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّد
- [الداخلية الخاصة بـ Plugin](/ar/plugins/architecture) — تعمق معماري
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان
