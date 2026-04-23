---
read_when:
    - أنت ترى التحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - أنت ترى التحذير OPENCLAW_EXTENSION_API_DEPRECATED
    - أنت تحدّث Plugin إلى معمارية Plugin الحديثة
    - أنت تحافظ على Plugin خارجي لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الترحيل من طبقة التوافق العكسي القديمة إلى Plugin SDK الحديث
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-23T07:28:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# ترحيل Plugin SDK

انتقل OpenClaw من طبقة توافق عكسي واسعة إلى معمارية Plugin حديثة
ذات عمليات استيراد مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
المعمارية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

وفّر نظام Plugin القديم سطحين واسعين سمحا للـ Plugins باستيراد
أي شيء تحتاج إليه من نقطة إدخال واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  المساعدات. وقد قُدم للإبقاء على Plugins الأقدم المعتمدة على hooks
  وهي تعمل أثناء بناء معمارية Plugin الجديدة.
- **`openclaw/extension-api`** — جسر منح Plugins وصولًا مباشرًا إلى
  مساعدات جانب المضيف مثل مشغّل الوكيل المضمّن.

أصبح السطحان الآن **مهملين**. وما زالا يعملان وقت التشغيل، لكن يجب على Plugins
الجديدة عدم استخدامهما، وينبغي للـ Plugins الحالية أن تهاجر قبل أن تزيلهما
الإصدار الرئيسي التالي.

<Warning>
  ستتم إزالة طبقة التوافق العكسي في إصدار رئيسي مستقبلي.
  ستتعطل Plugins التي لا تزال تستورد من هذه الأسطح عندما يحدث ذلك.
</Warning>

## لماذا تغيّر هذا

تسبب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** — كان استيراد مساعد واحد يحمّل عشرات الوحدات غير ذات الصلة
- **اعتماديات دائرية** — جعلت إعادة التصدير الواسعة إنشاء دورات استيراد أمرًا سهلًا
- **سطح API غير واضح** — لم تكن هناك طريقة لمعرفة أي عمليات التصدير مستقرة وأيها داخلية

يصلح Plugin SDK الحديث ذلك: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة مستقلة ذات غرض واضح وعقد موثق.

كما اختفت أيضًا وصلات الراحة القديمة الخاصة بالموفرين للقنوات المضمّنة. فعمليات الاستيراد
مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord`،
و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp`،
ووصلات المساعدات ذات العلامات الخاصة بالقنوات، و
`openclaw/plugin-sdk/telegram-core` كانت اختصارات خاصة بمستودع mono-repo،
وليست عقود Plugins مستقرة. استخدم بدلًا من ذلك المسارات الفرعية العامة والضيقة في SDK. وداخل مساحة عمل Plugin المضمّن، احتفظ بالمساعدات المملوكة للموفر داخل
`api.ts` أو `runtime-api.ts` الخاصين بذلك Plugin.

أمثلة حالية لموفري الحزم المضمّنة:

- يحتفظ Anthropic بمساعدات التدفق الخاصة بـ Claude ضمن وصلة
  `api.ts` / `contract-api.ts` الخاصة به
- يحتفظ OpenAI ببناة الموفرين، ومساعدات النماذج الافتراضية، وبناة موفري
  realtime ضمن `api.ts` الخاص به
- يحتفظ OpenRouter بباني الموفر ومساعدات الإعداد/التكوين ضمن
  `api.ts` الخاص به

## كيفية الترحيل

<Steps>
  <Step title="رحّل المعالجات الأصلية للموافقات إلى حقائق Capability">
    تكشف Plugins القنوات القادرة على الموافقات الآن عن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق بيئة التشغيل المشتركة.

    التغييرات الرئيسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصين بالموافقة من التوصيل القديم `plugin.auth` /
      `plugin.approvals` إلى `approvalCapability`
    - تمت إزالة `ChannelPlugin.approvals` من عقد Plugin القنوات العام؛ انقل
      حقول delivery/native/render إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل الدخول/الخروج الخاصة بالقناة فقط؛ ولم تعد
      core تقرأ خطافات مصادقة الموافقة هناك
    - سجّل كائنات بيئة التشغيل المملوكة للقناة مثل العملاء والرموز أو تطبيقات
      Bolt عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة توجيه مملوكة للـ Plugin من معالجات الموافقة الأصلية؛
      إذ تملك core الآن إشعارات "تم التوجيه إلى مكان آخر" انطلاقًا من نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، قدّم
      سطح `createPluginRuntime().channel` حقيقيًا. يتم رفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للحصول على تخطيط Capability الحالي
    للموافقة.

  </Step>

  <Step title="راجع سلوك الرجوع الاحتياطي لغلاف Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`،
    فإن أغلفة Windows من نوع `.cmd`/`.bat` غير المحلولة تفشل الآن بشكل مغلق
    ما لم تمرر صراحةً `allowShellFallback: true`.

    ```typescript
    // قبل
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // بعد
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // اضبط هذا فقط للمستدعين الموثوقين المتوافقين الذين
      // يقبلون عمدًا الرجوع الاحتياطي بوساطة shell.
      allowShellFallback: true,
    });
    ```

    إذا لم يكن المستدعي لديك يعتمد عمدًا على الرجوع الاحتياطي إلى shell، فلا تضبط
    `allowShellFallback` وتعامل مع الخطأ المطروح بدلًا من ذلك.

  </Step>

  <Step title="اعثر على عمليات الاستيراد المهملة">
    ابحث في Plugin الخاص بك عن عمليات الاستيراد من أي من السطحين المهملين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="استبدلها بعمليات استيراد مركزة">
    يقابل كل export من السطح القديم مسار استيراد حديثًا محددًا:

    ```typescript
    // قبل (طبقة التوافق العكسي المهملة)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // بعد (عمليات استيراد حديثة ومركزة)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    بالنسبة إلى المساعدات على جانب المضيف، استخدم بيئة تشغيل Plugin المحقونة بدلًا من الاستيراد
    المباشر:

    ```typescript
    // قبل (جسر extension-api المهمل)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // بعد (بيئة تشغيل محقونة)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    ينطبق النمط نفسه على مساعدات الجسر القديم الأخرى:

    | الاستيراد القديم | المكافئ الحديث |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | مساعدات مخزن الجلسات | `api.runtime.agent.session.*` |

  </Step>

  <Step title="ابنِ واختبر">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسار الاستيراد

  <Accordion title="جدول شائع لمسارات الاستيراد">
  | مسار الاستيراد | الغرض | أهم الصادرات |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | المساعد القياسي لإدخال Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة لتعريفات/بناة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط التكوين الجذري | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | المساعد الخاص بإدخال موفر واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبناة إدخال القنوات المركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة | مطالبات قائمة السماح، وبناة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات بيئة التشغيل وقت الإعداد | محولات ترقيع الإعداد الآمنة للاستيراد، ومساعدات lookup-note، و`promptResolvedAllowFrom`، و`splitSetupEntries`، ووكلاء الإعداد المفوض |
  | `plugin-sdk/setup-adapter-runtime` | مساعدات محول الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة الحسابات/التكوين/بوابة الإجراءات |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحسابات | مساعدات البحث عن الحساب + الرجوع الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات حساب ضيقة | مساعدات قائمة الحسابات/إجراءات الحساب |
  | `plugin-sdk/channel-setup` | محولات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات اقتران الرسائل المباشرة | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد + مؤشرات الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع محولات التكوين | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | بناة مخطط التكوين | أنواع مخطط تكوين القناة |
  | `plugin-sdk/telegram-command-config` | مساعدات تكوين أوامر Telegram | تطبيع أسماء الأوامر، وتهذيب الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | حل سياسات المجموعات/الرسائل المباشرة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | مساعدات دورة حياة حالة الحساب وتدفق المسودات | `createAccountStatusSink`، ومساعدات إنهاء معاينة المسودة |
  | `plugin-sdk/inbound-envelope` | مساعدات المظاريف الواردة | مساعدات مشتركة لبناء route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدات الردود الواردة | مساعدات مشتركة للتسجيل والإرسال |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | مساعدات تحليل/مطابقة الأهداف |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشترك |
  | `plugin-sdk/outbound-runtime` | مساعدات بيئة التشغيل الصادرة | مساعدات هوية/إرسال صادرة وتخطيط الحمولة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط Thread | مساعدات دورة حياة ربط Thread والمحولات |
  | `plugin-sdk/agent-media-payload` | مساعدات قديمة لحمولة الوسائط | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | وصلة توافقية مهملة | أدوات بيئة تشغيل القنوات القديمة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin الدائم | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات بيئة تشغيل عامة | مساعدات بيئة التشغيل/السجلات/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة التشغيل | Logger/بيئة التشغيل، ومساعدات المهلة، وإعادة المحاولة، والتراجع |
  | `plugin-sdk/plugin-runtime` | مساعدات بيئة تشغيل Plugin المشتركة | مساعدات أوامر/hooks/http/التفاعل الخاصة بـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار hooks | مساعدات مشتركة لمسار webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | مساعدات بيئة التشغيل الكسولة | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات exec المشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات بيئة تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدار |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway ومساعدات ترقيع حالة القنوات |
  | `plugin-sdk/config-runtime` | مساعدات التكوين | مساعدات تحميل/كتابة التكوين |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | تحقق ثابت رجوعيًا من أوامر Telegram عندما يكون سطح عقد Telegram المضمّن غير متاح |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبات الموافقة | حمولة موافقة exec/Plugin، ومساعدات Capability/ملف تعريف الموافقة، ومساعدات توجيه/بيئة تشغيل الموافقة الأصلية |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة الموافقة | حل المصدقين، ومصادقة الإجراءات في الدردشة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات ملف تعريف/تصفية موافقة exec الأصلية |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | محولات Capability/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway الخاصة بالموافقة | مساعد حل Gateway للموافقة المشتركة |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات محول الموافقة | مساعدات خفيفة لتحميل محول الموافقة الأصلية لنقاط إدخال القنوات السريعة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات أوسع لبيئة تشغيل معالج الموافقة؛ فضّل الوصلات الأضيق للمحول/Gateway عندما تكفي |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط الهدف/الحساب للموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد موافقة exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق بيئة تشغيل القناة | مساعدات عامة لتسجيل/جلب/مراقبة سياق بيئة تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات مشتركة للثقة، وتقييد الرسائل المباشرة، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة سماح المضيف وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات بيئة تشغيل SSRF | مساعدات pinned-dispatcher، وguarded fetch، وسياسة SSRF |
  | `plugin-sdk/collection-runtime` | مساعدات cache المحدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات تقييد التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، ومساعدات رسم الأخطاء |
  | `plugin-sdk/fetch-runtime` | مساعدات fetch/proxy المغلفة | `resolveFetch`، ومساعدات proxy |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`، ومشغلات السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | ربط مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | تقييد الأوامر ومساعدات سطح الأوامر | `resolveControlCommandGate`، ومساعدات تفويض المرسل، ومساعدات سجل الأوامر |
  | `plugin-sdk/command-status` | مُصيّرات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدات إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلبات Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حراسة طلبات Webhook | مساعدات قراءة/تقييد جسم الطلب |
  | `plugin-sdk/reply-runtime` | بيئة تشغيل الرد المشتركة | الإرسال الوارد، Heartbeat، مخطط الرد، التجزئة |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال الرد | مساعدات finalize + إرسال الموفّر |
  | `plugin-sdk/reply-history` | مساعدات سجل الرد | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات تجزئة الرد | مساعدات تجزئة النص/Markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسة | مساعدات مسار المخزن + `updated-at` |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات أدلة الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدات تطبيع مفاتيح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | بناة ملخص حالة القناة/الحساب، وافتراضيات حالة بيئة التشغيل، ومساعدات بيانات تعريف المشكلة |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلل الأهداف | مساعدات محلل الأهداف المشتركة |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع النصوص | مساعدات تطبيع slug/string |
  | `plugin-sdk/request-url` | مساعدات عنوان URL للطلب | استخراج عناوين URL النصية من مدخلات شبيهة بالطلب |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقّتة | مشغّل أوامر موقّت مع stdout/stderr مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعلمات | قارئات معلمات شائعة للأدوات/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج الإرسال من الأداة | استخراج حقول هدف الإرسال القياسية من وسائط الأدوات |
  | `plugin-sdk/temp-path` | مساعدات المسار المؤقت | مساعدات مشتركة لمسارات التنزيل المؤقتة |
  | `plugin-sdk/logging-core` | مساعدات السجلات | Logger للنظام الفرعي ومساعدات التنقيح |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جداول Markdown | مساعدات وضع جدول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد الموفر المحلي/المستضاف ذاتيًا | مساعدات اكتشاف/تكوين الموفّر المستضاف ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد موفرات OpenAI-compatible المستضافة ذاتيًا | مساعدات اكتشاف/تكوين الموفر المستضاف ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة الموفّر وقت التشغيل | مساعدات حل API key وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد API key للموفر | مساعدات onboarding/كتابة ملف تعريف API key |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة الموفّر | الباني القياسي لنتيجة مصادقة OAuth |
  | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي للموفّر | مساعدات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات البيئة الخاصة بالموفّر | مساعدات البحث عن متغيرات بيئة مصادقة الموفّر |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج/إعادة تشغيل الموفّر | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبناة سياسات إعادة التشغيل المشتركة، ومساعدات نقاط نهاية الموفّر، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات مشتركة لفهرس الموفّر | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | ترقيعات onboarding الخاصة بالموفّر | مساعدات تكوين onboarding |
  | `plugin-sdk/provider-http` | مساعدات HTTP الخاصة بالموفّر | مساعدات عامة لـ HTTP/قدرات نقاط نهاية الموفّر، بما في ذلك مساعدات نماذج multipart الخاصة بتحويل الصوت إلى نص |
  | `plugin-sdk/provider-web-fetch` | مساعدات web-fetch الخاصة بالموفّر | مساعدات تسجيل/تخزين مؤقت لموفّر web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات تكوين البحث على الويب الخاصة بالموفّر | مساعدات ضيقة لتكوين/بيانات اعتماد البحث على الويب للموفرين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد البحث على الويب الخاصة بالموفّر | مساعدات ضيقة لعقد تكوين/بيانات اعتماد البحث على الويب مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` وأدوات تعيين/جلب بيانات الاعتماد المقيّدة |
  | `plugin-sdk/provider-web-search` | مساعدات البحث على الويب الخاصة بالموفّر | مساعدات تسجيل/تخزين مؤقت/بيئة تشغيل لموفّر البحث على الويب |
  | `plugin-sdk/provider-tools` | مساعدات توافق أدوات/مخططات الموفّر | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام الموفّر | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، ومساعدات أخرى لاستخدام الموفّر |
  | `plugin-sdk/provider-stream` | مساعدات غلاف تدفق الموفّر | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع أغلفة التدفق، ومساعدات أغلفة مشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل الموفّر | مساعدات نقل الموفّر الأصلية مثل guarded fetch، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | قائمة انتظار async مرتبة | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات وسائط مشتركة | مساعدات جلب/تحويل/تخزين الوسائط بالإضافة إلى بناة حمولات الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتوليد الوسائط | مساعدات failover المشتركة، واختيار المرشحين، ورسائل النموذج المفقود لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع موفري فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت الموجهة إلى الموفّر |
  | `plugin-sdk/text-runtime` | مساعدات نص مشتركة | إزالة النصوص المرئية للمساعد، ومساعدات عرض/تجزئة/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن، ومساعدات النص/السجلات ذات الصلة |
  | `plugin-sdk/text-chunking` | مساعدات تجزئة النص | مساعد تجزئة النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع موفري الكلام بالإضافة إلى مساعدات التوجيه والسجل والتحقق الموجهة إلى الموفّر |
  | `plugin-sdk/speech-core` | نواة الكلام المشتركة | أنواع موفري الكلام، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات التحويل الفوري إلى نص | أنواع الموفّرين، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع الموفّرين ومساعدات السجل |
  | `plugin-sdk/image-generation-core` | نواة توليد الصور المشتركة | أنواع توليد الصور، وfailover، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع موفّر/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | نواة توليد الموسيقى المشتركة | أنواع توليد الموسيقى، ومساعدات failover، والبحث عن الموفّر، وتحليل model-ref |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع موفّر/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | نواة توليد الفيديو المشتركة | أنواع توليد الفيديو، ومساعدات failover، والبحث عن الموفّر، وتحليل model-ref |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات تكوين القناة | بدائيات ضيقة لمخطط تكوين القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة تكوين القناة | مساعدات تفويض كتابة تكوين القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد القناة المشترك | صادرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات مشتركة للقطات/ملخصات حالة القناة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات تكوين قائمة السماح | مساعدات تعديل/قراءة تكوين قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعات | مساعدات مشتركة لاتخاذ قرار وصول المجموعة |
  | `plugin-sdk/direct-dm` | مساعدات الرسائل المباشرة المباشرة | مساعدات مشتركة لمصادقة/حراسة الرسائل المباشرة المباشرة |
  | `plugin-sdk/extension-shared` | مساعدات الامتداد المشتركة | بدائيات القناة/الحالة السلبية ومساعدات الوكيل المحيط |
  | `plugin-sdk/webhook-targets` | مساعدات أهداف Webhook | مساعدات سجل أهداف Webhook وتثبيت المسارات |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات تطبيع مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | إعادة تصدير `zod` لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | مساعدات memory-core المضمّنة | سطح مساعدات مدير/تكوين/ملف/CLI الخاصة بالذاكرة |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة بيئة تشغيل محرك الذاكرة | واجهة بيئة تشغيل فهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك أساس مضيف الذاكرة | صادرات محرك أساس مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك التضمينات لمضيف الذاكرة | عقود تضمينات الذاكرة، والوصول إلى السجل، والموفّر المحلي، ومساعدات عامة للدُفعات/الاستدعاء البعيد؛ أما الموفرون البعيدون الملموسون فيعيشون داخل Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | صادرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك التخزين لمضيف الذاكرة | صادرات محرك التخزين لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة | مساعدات متعددة الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | مساعدات استعلام مضيف الذاكرة | مساعدات استعلام مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة | مساعدات الأسرار لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة | مساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | بيئة تشغيل CLI لمضيف الذاكرة | مساعدات بيئة تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | بيئة التشغيل الأساسية لمضيف الذاكرة | مساعدات بيئة التشغيل الأساسية لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/بيئة تشغيل مضيف الذاكرة | مساعدات ملفات/بيئة تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم مستعار لبيئة التشغيل الأساسية لمضيف الذاكرة | اسم مستعار محايد تجاه المورّد لمساعدات بيئة التشغيل الأساسية لمضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم مستعار لسجل أحداث مضيف الذاكرة | اسم مستعار محايد تجاه المورّد لمساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم مستعار لملفات/بيئة تشغيل مضيف الذاكرة | اسم مستعار محايد تجاه المورّد لمساعدات ملفات/بيئة تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدارة | مساعدات Markdown مُدارة مشتركة للـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة بيئة تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم مستعار لحالة مضيف الذاكرة | اسم مستعار محايد تجاه المورّد لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-lancedb` | مساعدات memory-lancedb المضمّنة | سطح مساعدات memory-lancedb |
  | `plugin-sdk/testing` | أدوات الاختبار | مساعدات الاختبار وmockات |
</Accordion>

هذا الجدول هو عمدًا المجموعة الشائعة الخاصة بالترحيل، وليس سطح SDK
الكامل. توجد القائمة الكاملة التي تضم أكثر من 200 نقطة إدخال في
`scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال تلك القائمة تتضمن بعض وصلات المساعدة الخاصة بالـ Plugins المضمّنة مثل
`plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و`plugin-sdk/zalo`،
و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. تبقى هذه العناصر مصدّرة من أجل
صيانة Plugins المضمّنة والتوافق، لكنها مُستبعَدة عمدًا من جدول الترحيل الشائع
وليست الهدف الموصى به لشيفرة Plugins الجديدة.

تنطبق القاعدة نفسها على عائلات المساعدات المضمّنة الأخرى مثل:

- مساعدات دعم المتصفح: `plugin-sdk/browser-cdp` و`plugin-sdk/browser-config-runtime` و`plugin-sdk/browser-config-support` و`plugin-sdk/browser-control-auth` و`plugin-sdk/browser-node-runtime` و`plugin-sdk/browser-profiles` و`plugin-sdk/browser-security-runtime` و`plugin-sdk/browser-setup-tools` و`plugin-sdk/browser-support`
- Matrix: ‏`plugin-sdk/matrix*`
- LINE: ‏`plugin-sdk/line*`
- IRC: ‏`plugin-sdk/irc*`
- أسطح المساعدة/الـ Plugin المضمّنة مثل `plugin-sdk/googlechat`،
  و`plugin-sdk/zalouser` و`plugin-sdk/bluebubbles*`,
  و`plugin-sdk/mattermost*` و`plugin-sdk/msteams`,
  و`plugin-sdk/nextcloud-talk` و`plugin-sdk/nostr` و`plugin-sdk/tlon`,
  و`plugin-sdk/twitch`,
  و`plugin-sdk/github-copilot-login` و`plugin-sdk/github-copilot-token`,
  و`plugin-sdk/diagnostics-otel` و`plugin-sdk/diffs` و`plugin-sdk/llm-task`,
  و`plugin-sdk/thread-ownership` و`plugin-sdk/voice-call`

يكشف `plugin-sdk/github-copilot-token` حاليًا سطح مساعدات الرمز الضيق
`DEFAULT_COPILOT_API_BASE_URL`,
و`deriveCopilotApiBaseUrlFromToken`، و`resolveCopilotApiToken`.

استخدم أضيق عملية استيراد تطابق المهمة. وإذا لم تتمكن من العثور على export،
فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## الجدول الزمني للإزالة

| متى | ما الذي يحدث |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن** | تصدر الأسطح المهملة تحذيرات وقت التشغيل |
| **الإصدار الرئيسي التالي** | ستتم إزالة الأسطح المهملة؛ وستفشل Plugins التي لا تزال تستخدمها |

تم بالفعل ترحيل جميع Plugins الأساسية. وينبغي للـ Plugins الخارجية أن تهاجر
قبل الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء عملك على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا منفذ هروب مؤقت، وليس حلًا دائمًا.

## ذو صلة

- [البدء](/ar/plugins/building-plugins) — أنشئ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع كامل لعمليات الاستيراد عبر المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins) — بناء Plugins الموفّرين
- [البنية الداخلية لـ Plugin](/ar/plugins/architecture) — نظرة معمقة على المعمارية
- [Plugin Manifest](/ar/plugins/manifest) — مرجع مخطط manifest
