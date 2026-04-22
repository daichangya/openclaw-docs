---
read_when:
    - أنت ترى التحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - أنت ترى التحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - أنت تحدّث Plugin إلى معمارية Plugin الحديثة
    - أنت تصون Plugin خارجيًا لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الانتقال من طبقة التوافق مع الإصدارات السابقة القديمة إلى Plugin SDK الحديثة
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-22T04:26:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72c9fc2d77f5feda336a1119fc42ebe088d5037f99c2b3843e9f06efed20386d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# ترحيل Plugin SDK

انتقل OpenClaw من طبقة توافق واسعة مع الإصدارات السابقة إلى معمارية Plugin
حديثة ذات استيرادات مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
المعمارية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفر سطحين مفتوحين على مصراعيهما يسمحان للـ Plugins باستيراد
أي شيء تحتاجه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  المساعدات. وقد تم تقديمه للإبقاء على عمل Plugins الأقدم القائمة على hooks أثناء
  بناء معمارية Plugin الجديدة.
- **`openclaw/extension-api`** — جسر يمنح Plugins وصولًا مباشرًا إلى
  المساعدات على جانب المضيف مثل embedded agent runner.

كلا السطحين الآن **مهجوران**. وما يزالان يعملان في وقت التشغيل، لكن يجب ألا تستخدمهما
Plugins الجديدة، وينبغي أن تترحل Plugins الحالية قبل أن يؤدي الإصدار الرئيسي التالي إلى إزالتهما.

<Warning>
  ستتم إزالة طبقة التوافق مع الإصدارات السابقة في إصدار رئيسي مستقبلي.
  Plugins التي ما تزال تستورد من هذه الأسطح ستتعطل عند حدوث ذلك.
</Warning>

## لماذا تغيّر هذا

تسبب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** — كان استيراد مساعد واحد يحمل عشرات الوحدات غير المرتبطة
- **اعتماديات دائرية** — جعلت إعادة التصدير الواسعة من السهل إنشاء دورات استيراد
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة أي التصديرات كانت مستقرة وأيها داخلية

تعالج Plugin SDK الحديثة هذا: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة مستقلة ذات غرض واضح وعقد موثق.

كما اختفت أيضًا وصلات الراحة القديمة الخاصة بالـ provider للقنوات المجمّعة. فالاستيرادات
مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord`
و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp`،
ووصلات المساعدات الموسومة باسم القناة، و
`openclaw/plugin-sdk/telegram-core` كانت اختصارات خاصة داخل mono-repo، وليست
عقود Plugin مستقرة. استخدم بدلًا منها subpaths ضيقة وعامة من SDK. وداخل مساحة عمل Plugin
المجمّعة، أبقِ المساعدات المملوكة للـ provider في `api.ts` أو `runtime-api.ts`
الخاص بذلك Plugin.

أمثلة موفري الحزمة الحالية:

- يحتفظ Anthropic بمساعدات البث الخاصة بـ Claude في الوصلة الخاصة به `api.ts` /
  `contract-api.ts`
- يحتفظ OpenAI ببنّاءات provider ومساعدات النماذج الافتراضية وبنّاءات
  realtime provider في `api.ts` الخاص به
- يحتفظ OpenRouter ببنّاء provider ومساعدات onboarding/config في
  `api.ts` الخاص به

## كيفية الترحيل

<Steps>
  <Step title="رحّل معالجات الموافقة الأصلية إلى حقائق الإمكانيات">
    تعرض Plugins القنوات القادرة على الموافقة الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الرئيسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل auth/delivery الخاصة بالموافقة من التوصيلات القديمة `plugin.auth` /
      `plugin.approvals` إلى `approvalCapability`
    - تمت إزالة `ChannelPlugin.approvals` من عقد Plugin القناة
      العام؛ انقل حقول delivery/native/render إلى `approvalCapability`
    - يظل `plugin.auth` لتدفقات تسجيل الدخول/تسجيل الخروج الخاصة بالقناة فقط؛ ولم تعد
      hooks مصادقة الموافقة هناك تُقرأ بواسطة core
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل العملاء أو الرموز المميزة أو تطبيقات Bolt
      عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة التوجيه المملوكة للـ Plugin من معالجات الموافقة الأصلية؛
      يتولى core الآن الإشعارات الخاصة بـ routed-elsewhere من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، قدّم
      سطح `createPluginRuntime().channel` حقيقيًا. يتم رفض stubs الجزئية.

    راجع `/plugins/sdk-channel-plugins` للحصول على تخطيط approval capability
    الحالي.

  </Step>

  <Step title="راجع سلوك fallback الخاص بـ Windows wrapper">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`،
    فإن wrappers الخاصة بـ Windows من نوع `.cmd`/`.bat` التي يتعذر تحليلها تفشل الآن بشكل مغلق ما لم تمرر صراحةً
    `allowShellFallback: true`.

    ```typescript
    // قبل
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // بعد
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // اضبط هذا فقط لمستدعيات التوافق الموثوقة التي تقبل عمدًا
      // fallback بوساطة shell.
      allowShellFallback: true,
    });
    ```

    إذا لم يكن المستدعي لديك يعتمد عمدًا على shell fallback، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المُلقى بدلًا من ذلك.

  </Step>

  <Step title="اعثر على الاستيرادات المهجورة">
    ابحث في Plugin الخاص بك عن الاستيرادات من أي من السطحين المهجورين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها باستيرادات مركزة">
    يُطابق كل تصدير من السطح القديم مسار استيراد حديثًا محددًا:

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

    بالنسبة إلى المساعدات على جانب المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من الاستيراد
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
    | مساعدات session store | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | مساعد إدخال Plugin القياسي | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير umbrella قديمة لتعريفات/بنّاءات إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط الإعدادات الجذرية | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال single-provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبنّاءات مركزة لإدخال القنوات | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات مشتركة لمعالج الإعداد | مطالبات قائمة السماح، وبنّاءات حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت التشغيل الخاصة بالإعداد | محولات patch آمنة الاستيراد للإعداد، ومساعدات ملاحظات lookup، و`promptResolvedAllowFrom` و`splitSetupEntries` وdelegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | مساعدات مهايئ الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/الإعدادات/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات lookup للحساب | مساعدات lookup للحساب + الاحتياطي الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات حساب ضيقة | مساعدات قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | مهايئات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID` و`createTopLevelChannelDmPolicy` و`setSetupChannelEnabled` و`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات اقتران DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد + الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع مهايئات الإعداد | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | بنّاءات مخطط الإعدادات | أنواع مخطط إعداد القناة |
  | `plugin-sdk/telegram-command-config` | مساعدات إعداد أوامر Telegram | تطبيع اسم الأمر، وتقليم الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | تحليل سياسة المجموعات/الرسائل المباشرة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | مساعدات حالة الحساب ودورة حياة draft stream | `createAccountStatusSink`، ومساعدات إنهاء draft preview |
  | `plugin-sdk/inbound-envelope` | مساعدات الظرف الوارد | مساعدات مشتركة للمسار + بناء الظرف |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدات الرد الوارد | مساعدات مشتركة للتسجيل والإرسال |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | مساعدات تحليل/مطابقة الأهداف |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشترك |
  | `plugin-sdk/outbound-runtime` | مساعدات وقت التشغيل الصادر | مساعدات هوية الإرسال/مفوّض الإرسال وتخطيط الحمولة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط Thread | مساعدات دورة حياة Thread-binding والمهايئ |
  | `plugin-sdk/agent-media-payload` | مساعدات قديمة لحمولة الوسائط | بنّاء حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | shim توافق مهجور | أدوات وقت تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin الدائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل | مساعدات logger/runtime env والمهلة وإعادة المحاولة وbackoff |
  | `plugin-sdk/plugin-runtime` | مساعدات وقت تشغيل Plugin المشتركة | مساعدات أوامر/hooks/http/التفاعل الخاصة بالـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار Hook | مساعدات مشتركة لمسار webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات exec المشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدار |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway ومساعدات patch لحالة القناة |
  | `plugin-sdk/config-runtime` | مساعدات الإعدادات | مساعدات تحميل/كتابة الإعدادات |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات تحقق ثابتة احتياطيًا لأوامر Telegram عندما يكون سطح عقد Telegram المجمّع غير متاح |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبات الموافقة | حمولة موافقة exec/plugin، ومساعدات approval capability/profile، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة الموافقة | تحليل المُوافق، ومصادقة الإجراء في الدردشة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات profile/filter الأصلية لموافقة exec |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | مهايئات approval capability/delivery الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway للموافقة | مساعد التحليل المشترك لـ approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات مهايئ الموافقة | مساعدات خفيفة لتحميل مهايئ الموافقة الأصلية لنقاط إدخال القنوات الساخنة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ فضّل الوصلات الأضيق الخاصة بالمهايئ/Gateway عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط الهدف/الحساب للموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد الموافقة exec/plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق وقت تشغيل القناة | مساعدات عامة register/get/watch لسياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات مشتركة للثقة، وتقييد DM، والمحتوى الخارجي، وتجميع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة سماح المضيف وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | `Pinned-dispatcher`، والجلب المحروس، ومساعدات سياسة SSRF |
  | `plugin-sdk/collection-runtime` | مساعدات cache محدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات تقييد التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، ومساعدات رسم الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدات fetch/proxy المغلفة | `resolveFetch`، ومساعدات proxy |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`، ومنفذات السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | تقييد الأوامر ومساعدات سطح الأوامر | `resolveControlCommandGate`، ومساعدات تفويض المرسل، ومساعدات سجل الأوامر |
  | `plugin-sdk/command-status` | عارضات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل مدخلات الأسرار | مساعدات إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلبات Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حراسة نص طلب Webhook | مساعدات قراءة/تحديد نص الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، وHeartbeat، ومخطط الرد، والتقسيم إلى مقاطع |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال الرد | مساعدات الإنهاء + إرسال provider |
  | `plugin-sdk/reply-history` | مساعدات سجل الرد | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات مقاطع الرد | مساعدات تقسيم النص/Markdown إلى مقاطع |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسة | مساعدات مسار المخزن + updated-at |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات أدلة الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدات تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | بنّاءات ملخص حالة القناة/الحساب، والقيم الافتراضية لحالة وقت التشغيل، ومساعدات بيانات issue الوصفية |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلل الهدف | مساعدات مشتركة لمحلل الهدف |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع السلاسل | مساعدات تطبيع slug/string |
  | `plugin-sdk/request-url` | مساعدات Request URL | استخراج عناوين URL النصية من مدخلات شبيهة بالطلبات |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقّتة | منفذ أوامر موقّت مع stdout/stderr مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعلمات | قارئات معلمات شائعة للأدوات/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات المطبعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسار المؤقت | مساعدات مشتركة لمسار التنزيل المؤقت |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | logger للنظام الفرعي ومساعدات الإخفاء |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جداول Markdown | مساعدات أوضاع جداول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد provider محلي/مستضاف ذاتيًا | مساعدات اكتشاف/إعداد provider المستضاف ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد provider مستضاف ذاتيًا ومتوافق مع OpenAI | مساعدات اكتشاف/إعداد provider المستضاف ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة provider في وقت التشغيل | مساعدات تحليل API-key في وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد API-key الخاصة بالـ provider | مساعدات onboarding/profile-write الخاصة بـ API-key |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة provider | بنّاء auth-result قياسي لـ OAuth |
  | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي الخاصة بالـ provider | مساعدات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات بيئة provider | مساعدات lookup لمتغيرات بيئة مصادقة provider |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج/إعادة تشغيل provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبنّاءات سياسة replay المشتركة، ومساعدات نقطة نهاية provider، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات مشتركة لفهرس provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | ترقيعات onboarding الخاصة بالـ provider | مساعدات إعداد onboarding |
  | `plugin-sdk/provider-http` | مساعدات HTTP الخاصة بالـ provider | مساعدات عامة لـ HTTP/إمكانيات نقاط النهاية الخاصة بالـ provider |
  | `plugin-sdk/provider-web-fetch` | مساعدات web-fetch الخاصة بالـ provider | مساعدات تسجيل/تخزين cache الخاصة بـ web-fetch provider |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات إعداد web-search الخاصة بالـ provider | مساعدات ضيقة لإعداد/بيانات اعتماد web-search للـ providers الذين لا يحتاجون إلى توصيل تمكين Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد web-search الخاصة بالـ provider | مساعدات ضيقة لعقد إعداد/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` وواضعات/قارئات بيانات الاعتماد المقيّدة |
  | `plugin-sdk/provider-web-search` | مساعدات web-search الخاصة بالـ provider | مساعدات تسجيل/cache/runtime الخاصة بـ web-search provider |
  | `plugin-sdk/provider-tools` | مساعدات توافق الأداة/schema الخاصة بالـ provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف Gemini schema + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، ومساعدات استخدام provider الأخرى |
  | `plugin-sdk/provider-stream` | مساعدات أغلفة تدفق provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع أغلفة التدفق، ومساعدات الأغلفة المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل provider | مساعدات النقل الأصلية للـ provider مثل الجلب المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | قائمة انتظار async مرتبة | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات الوسائط المشتركة | مساعدات جلب/تحويل/تخزين الوسائط بالإضافة إلى بنّاءات حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتوليد الوسائط | مساعدات failover المشتركة، واختيار المرشح، ورسائل missing-model لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع provider الخاصة بفهم الوسائط بالإضافة إلى تصديرات المساعدات المواجهة للـ provider للصور/الصوت |
  | `plugin-sdk/text-runtime` | مساعدات النص المشتركة | إزالة النص الظاهر للمساعد، ومساعدات عرض/تقسيم Markdown إلى مقاطع/الجداول، ومساعدات الإخفاء، ومساعدات directive-tag، وأدوات النص الآمن، ومساعدات نص/تسجيل ذات صلة |
  | `plugin-sdk/text-chunking` | مساعدات تقسيم النص إلى مقاطع | مساعد تقسيم النص الصادر إلى مقاطع |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع Speech provider بالإضافة إلى مساعدات التوجيه والسجل والتحقق المواجهة للـ provider |
  | `plugin-sdk/speech-core` | core الكلام المشترك | أنواع Speech provider، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ الفوري | أنواع provider ومساعدات السجل |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع provider ومساعدات السجل |
  | `plugin-sdk/image-generation-core` | core توليد الصور المشترك | أنواع توليد الصور، وfailover، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع provider/request/result الخاصة بتوليد الموسيقى |
  | `plugin-sdk/music-generation-core` | core توليد الموسيقى المشترك | أنواع توليد الموسيقى، ومساعدات failover، وlookup للـ provider، وتحليل model-ref |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع provider/request/result الخاصة بتوليد الفيديو |
  | `plugin-sdk/video-generation-core` | core توليد الفيديو المشترك | أنواع توليد الفيديو، ومساعدات failover، وlookup للـ provider، وتحليل model-ref |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات إعداد القناة | بدائيات ضيقة لمخطط إعداد القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة إعداد القناة | مساعدات تفويض كتابة إعداد القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | تصديرات تمهيد Plugin القناة المشترك |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات مشتركة للقطات/ملخصات حالة القناة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات إعداد قائمة السماح | مساعدات تحرير/قراءة إعداد قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات مشتركة لاتخاذ قرار group-access |
  | `plugin-sdk/direct-dm` | مساعدات Direct-DM | مساعدات مشتركة للمصادقة/الحراسة الخاصة بـ Direct-DM |
  | `plugin-sdk/extension-shared` | مساعدات extension المشتركة | بدائيات القناة السلبية/الحالة ومساعد proxy المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات أهداف Webhook | سجل أهداف Webhook ومساعدات تثبيت المسارات |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات تطبيع مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | إعادة تصدير `zod` لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | مساعدات memory-core المجمعة | سطح مساعدات مدير الذاكرة/الإعدادات/الملفات/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل لمحرك الذاكرة | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك foundation لمضيف الذاكرة | تصديرات محرك foundation لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك embedding لمضيف الذاكرة | عقود Memory embedding، والوصول إلى السجل، والـ provider المحلي، ومساعدات batch/remote العامة؛ أما الموفرون البعيدون الملموسون فيوجدون داخل Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | تصديرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك storage لمضيف الذاكرة | تصديرات محرك storage لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات multimodal لمضيف الذاكرة | مساعدات multimodal لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | مساعدات query لمضيف الذاكرة | مساعدات query لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات secret لمضيف الذاكرة | مساعدات secret لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات event journal لمضيف الذاكرة | مساعدات event journal لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل core لمضيف الذاكرة | مساعدات وقت تشغيل core لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | alias لوقت تشغيل core لمضيف الذاكرة | alias محايد للـ vendor لمساعدات وقت تشغيل core لمضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | alias لـ event journal لمضيف الذاكرة | alias محايد للـ vendor لمساعدات event journal لمضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | alias للملفات/وقت التشغيل لمضيف الذاكرة | alias محايد للـ vendor لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدارة | مساعدات managed-markdown المشتركة للـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل lazy search-manager الخاصة بـ Active Memory |
  | `plugin-sdk/memory-host-status` | alias لحالة مضيف الذاكرة | alias محايد للـ vendor لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-lancedb` | مساعدات memory-lancedb المجمعة | سطح مساعدات memory-lancedb |
  | `plugin-sdk/testing` | أدوات الاختبار | مساعدات الاختبار وmocks |
</Accordion>

هذا الجدول هو عمدًا المجموعة الشائعة الخاصة بالترحيل، وليس سطح Plugin SDK
الكامل. وتوجد القائمة الكاملة التي تضم أكثر من 200 نقطة إدخال في
`scripts/lib/plugin-sdk-entrypoints.json`.

ما تزال تلك القائمة تتضمن بعض وصلات المساعدات الخاصة بـ Plugins المجمعة مثل
`plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و`plugin-sdk/zalo` و
`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. وتظل هذه الوصلات مُصدَّرة من أجل
صيانة Plugins المجمعة والتوافق، لكنها حُذفت عمدًا من جدول الترحيل الشائع وليست الهدف الموصى به
لشيفرة Plugins الجديدة.

تنطبق القاعدة نفسها على عائلات المساعدات المجمعة الأخرى مثل:

- مساعدات دعم المتصفح: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: ‏`plugin-sdk/matrix*`
- LINE: ‏`plugin-sdk/line*`
- IRC: ‏`plugin-sdk/irc*`
- أسطح المساعدات/Plugins المجمعة مثل `plugin-sdk/googlechat`,
  و`plugin-sdk/zalouser`, و`plugin-sdk/bluebubbles*`,
  و`plugin-sdk/mattermost*`, و`plugin-sdk/msteams`,
  و`plugin-sdk/nextcloud-talk`, و`plugin-sdk/nostr`, و`plugin-sdk/tlon`,
  و`plugin-sdk/twitch`,
  و`plugin-sdk/github-copilot-login`, و`plugin-sdk/github-copilot-token`,
  و`plugin-sdk/diagnostics-otel`, و`plugin-sdk/diffs`, و`plugin-sdk/llm-task`,
  و`plugin-sdk/thread-ownership`, و`plugin-sdk/voice-call`

يكشف `plugin-sdk/github-copilot-token` حاليًا عن سطح مساعدات الرموز الضيق
`DEFAULT_COPILOT_API_BASE_URL`,
و`deriveCopilotApiBaseUrlFromToken`، و`resolveCopilotApiToken`.

استخدم أضيق استيراد يطابق المهمة. وإذا لم تتمكن من العثور على تصدير،
فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## الجدول الزمني للإزالة

| متى                   | ما الذي يحدث                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن**               | تصدر الأسطح المهجورة تحذيرات وقت التشغيل                               |
| **الإصدار الرئيسي التالي** | ستُزال الأسطح المهجورة؛ وستفشل Plugins التي ما تزال تستخدمها |

لقد تم بالفعل ترحيل جميع Plugins الأساسية. وينبغي أن تترحل Plugins الخارجية
قبل الإصدار الرئيسي التالي.

## إخفاء التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء العمل على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا منفذ هروب مؤقت، وليس حلًا دائمًا.

## ذو صلة

- [البدء](/ar/plugins/building-plugins) — ابنِ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيرادات subpath
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدين
- [الجزئيات الداخلية لـ Plugin](/ar/plugins/architecture) — تعمق في المعمارية
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان
