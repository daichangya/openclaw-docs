---
read_when:
    - أنت ترى التحذير OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - أنت ترى تحذير `OPENCLAW_EXTENSION_API_DEPRECATED`
    - لقد استخدمت `api.registerEmbeddedExtensionFactory` قبل OpenClaw 2026.4.25
    - أنت تقوم بتحديث Plugin إلى معمارية Plugin الحديثة
    - أنت تدير Plugin خارجيًا لـ OpenClaw
sidebarTitle: Migrate to SDK
summary: الانتقال من طبقة التوافق مع الإصدارات السابقة القديمة إلى Plugin SDK الحديث
title: ترحيل Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:54:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

انتقل OpenClaw من طبقة توافقية واسعة مع الإصدارات السابقة إلى معمارية Plugin حديثة
بمسارات استيراد مركزة وموثقة. إذا كان Plugin الخاص بك قد بُني قبل
المعمارية الجديدة، فسيساعدك هذا الدليل على الترحيل.

## ما الذي يتغير

كان نظام Plugin القديم يوفّر واجهتين مفتوحتين على نطاق واسع تتيحان لـ Plugins استيراد
أي شيء تحتاجه من نقطة دخول واحدة:

- **`openclaw/plugin-sdk/compat`** — استيراد واحد يعيد تصدير عشرات
  المساعدات. تم تقديمه للإبقاء على عمل Plugins الأقدم المعتمدة على hooks أثناء
  بناء معمارية Plugin الجديدة.
- **`openclaw/extension-api`** — جسر يمنح Plugins وصولًا مباشرًا إلى
  المساعدات على جانب المضيف مثل مشغّل الوكيل المضمّن.
- **`api.registerEmbeddedExtensionFactory(...)`** — hook خاص بـ Pi ومزال
  للامتدادات المجمّعة كان يمكنه مراقبة أحداث المشغّل المضمّن مثل
  `tool_result`.

واجهات الاستيراد الواسعة هذه أصبحت الآن **مهملة**. ما تزال تعمل وقت التشغيل،
لكن يجب ألا تستخدمها Plugins الجديدة، وينبغي على Plugins الحالية الترحيل قبل
أن يزيلها الإصدار الرئيسي التالي. تمت إزالة واجهة برمجة تطبيقات تسجيل مصنع
الامتدادات المضمّنة الخاص بـ Pi فقط؛ استخدم بدلًا منها middleware لنتائج الأدوات.

لا يقوم OpenClaw بإزالة سلوك Plugin موثّق أو إعادة تفسيره في التغيير نفسه
الذي يقدّم بديلًا له. يجب أن تمر تغييرات العقود الكاسرة أولًا عبر
محوّل توافق، وتشخيصات، ووثائق، ونافذة إهمال. وينطبق ذلك على
استيرادات SDK، وحقول manifest، وواجهات setup البرمجية، وhooks، وسلوك
التسجيل وقت التشغيل.

<Warning>
  ستتم إزالة طبقة التوافق مع الإصدارات السابقة في إصدار رئيسي مستقبلي.
  ستتعطل Plugins التي ما تزال تستورد من هذه الواجهات عند حدوث ذلك.
  أما تسجيلات مصنع الامتدادات المضمّنة الخاصة بـ Pi فقط فلم تعد تُحمَّل بالفعل.
</Warning>

## لماذا تغيّر هذا

تسبّب النهج القديم في مشكلات:

- **بدء تشغيل بطيء** — كان استيراد مساعد واحد يحمّل عشرات الوحدات غير المرتبطة
- **اعتماديات دائرية** — أعادت عمليات التصدير الواسعة جعل إنشاء دورات استيراد أمرًا سهلًا
- **واجهة API غير واضحة** — لم تكن هناك طريقة لمعرفة أي عمليات التصدير كانت مستقرة وأيها داخلية

يُصلح SDK الحديث للـ Plugin ذلك: فكل مسار استيراد (`openclaw/plugin-sdk/\<subpath\>`)
هو وحدة صغيرة مستقلة ذاتيًا ذات غرض واضح وعقد موثّق.

كما أُزيلت أيضًا نقاط الراحة القديمة الخاصة بالموفّرين للقنوات المجمّعة. استيرادات
مثل `openclaw/plugin-sdk/slack` و`openclaw/plugin-sdk/discord`
و`openclaw/plugin-sdk/signal` و`openclaw/plugin-sdk/whatsapp`،
ونقاط المساعدة الموسومة باسم القناة، و
`openclaw/plugin-sdk/telegram-core` كانت اختصارات خاصة داخل mono-repo، وليست
عقود Plugin مستقرة. استخدم بدلًا من ذلك مسارات فرعية عامة وضيقة ضمن SDK. داخل
مساحة عمل Plugin المجمّع، أبقِ المساعدات المملوكة للموفّر ضمن
`api.ts` أو `runtime-api.ts` الخاص بذلك Plugin.

أمثلة الموفّرين المجمّعين الحالية:

- يحتفظ Anthropic بمساعدات التدفق الخاصة بـ Claude داخل نقطة
  `api.ts` / `contract-api.ts` الخاصة به
- يحتفظ OpenAI ببُناة الموفّر، ومساعدات النموذج الافتراضي، وبُناة الموفّر
  الفوري داخل `api.ts` الخاص به
- يحتفظ OpenRouter بباني الموفّر ومساعدات الإعداد/التهيئة داخل
  `api.ts` الخاص به

## سياسة التوافق

بالنسبة إلى Plugins الخارجية، يتبع عمل التوافق هذا الترتيب:

1. إضافة العقد الجديد
2. الإبقاء على السلوك القديم موصولًا عبر محوّل توافق
3. إصدار تشخيص أو تحذير يذكر المسار القديم والبديل
4. تغطية كلا المسارين في الاختبارات
5. توثيق الإهمال ومسار الترحيل
6. الإزالة فقط بعد نافذة الترحيل المُعلنة، وعادةً في إصدار رئيسي

إذا كان حقل manifest لا يزال مقبولًا، فيمكن لمؤلفي Plugins الاستمرار في استخدامه حتى
تنص الوثائق والتشخيصات على خلاف ذلك. ينبغي أن يفضّل الكود الجديد
البديل الموثّق، لكن يجب ألا تتعطل Plugins الحالية أثناء الإصدارات الثانوية العادية.

## كيفية الترحيل

<Steps>
  <Step title="ترحيل امتدادات Pi لنتائج الأدوات إلى middleware">
    يجب على Plugins المجمّعة استبدال
    معالجات نتائج الأدوات `api.registerEmbeddedExtensionFactory(...)` الخاصة بـ Pi فقط
    بـ middleware محايدة لوقت التشغيل.

    ```typescript
    // أدوات Pi وCodex الديناميكية وقت التشغيل
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    حدّث manifest الخاص بـ Plugin في الوقت نفسه:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    لا يمكن لـ Plugins الخارجية تسجيل middleware لنتائج الأدوات لأنه
    يمكنها إعادة كتابة مخرجات الأدوات عالية الثقة قبل أن يراها النموذج.

  </Step>

  <Step title="ترحيل المعالجات الأصلية للموافقات إلى حقائق الإمكانات">
    أصبحت Plugins القنوات القادرة على الموافقة تعرض الآن سلوك الموافقة الأصلي عبر
    `approvalCapability.nativeRuntime` بالإضافة إلى سجل سياق وقت التشغيل المشترك.

    التغييرات الرئيسية:

    - استبدل `approvalCapability.handler.loadRuntime(...)` بـ
      `approvalCapability.nativeRuntime`
    - انقل المصادقة/التسليم الخاصة بالموافقات بعيدًا عن التوصيل القديم `plugin.auth` /
      `plugin.approvals` إلى `approvalCapability`
    - تمت إزالة `ChannelPlugin.approvals` من عقد Plugin القناة العام؛
      انقل حقول التسليم/الأصلية/العرض إلى `approvalCapability`
    - يبقى `plugin.auth` لتدفقات تسجيل الدخول/الخروج الخاصة بالقناة فقط؛ أما hooks
      مصادقة الموافقات هناك فلم يعد يقرأها core
    - سجّل كائنات وقت التشغيل المملوكة للقناة مثل العملاء والرموز أو تطبيقات Bolt
      عبر `openclaw/plugin-sdk/channel-runtime-context`
    - لا ترسل إشعارات إعادة توجيه يملكها Plugin من معالجات الموافقة الأصلية؛
      إذ يمتلك core الآن إشعارات التوجيه إلى مكان آخر الناتجة عن نتائج التسليم الفعلية
    - عند تمرير `channelRuntime` إلى `createChannelManager(...)`، قدّم
      سطح `createPluginRuntime().channel` حقيقيًا. يتم رفض البدائل الجزئية.

    راجع `/plugins/sdk-channel-plugins` للاطلاع على التخطيط الحالي لإمكانات الموافقة.

  </Step>

  <Step title="مراجعة سلوك الاحتياط الخاص بمغلّف Windows">
    إذا كان Plugin الخاص بك يستخدم `openclaw/plugin-sdk/windows-spawn`،
    فإن مغلّفات Windows من نوع `.cmd`/`.bat` غير المحلولة تفشل الآن بشكل مغلق
    ما لم تمرّر صراحة `allowShellFallback: true`.

    ```typescript
    // قبل
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // بعد
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // اضبط هذا فقط للمتصلين المتوافقين الموثوقين الذين يقبلون عمدًا
      // الاحتياط بوساطة shell.
      allowShellFallback: true,
    });
    ```

    إذا كان المتصل لديك لا يعتمد عمدًا على الاحتياط عبر shell، فلا تضبط
    `allowShellFallback` وتعامل بدلًا من ذلك مع الخطأ المطروح.

  </Step>

  <Step title="العثور على الاستيرادات المهملة">
    ابحث في Plugin الخاص بك عن الاستيرادات من أي من الواجهتين المهملتين:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="الاستبدال باستيرادات مركزة">
    كل عملية تصدير من الواجهة القديمة تقابل مسار استيراد حديثًا محددًا:

    ```typescript
    // قبل (طبقة التوافق مع الإصدارات السابقة المهملة)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // بعد (استيرادات حديثة مركزة)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    بالنسبة إلى المساعدات على جانب المضيف، استخدم وقت تشغيل Plugin المحقون بدلًا من
    الاستيراد المباشر:

    ```typescript
    // قبل (جسر extension-api المهمل)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // بعد (وقت تشغيل محقون)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    ينطبق النمط نفسه على مساعدات الجسر القديمة الأخرى:

    | الاستيراد القديم | المعادل الحديث |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | مساعدات مخزن الجلسة | `api.runtime.agent.session.*` |

  </Step>

  <Step title="البناء والاختبار">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسارات الاستيراد

  <Accordion title="جدول شائع لمسارات الاستيراد">
  | مسار الاستيراد | الغرض | أهم عمليات التصدير |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | مساعد إدخال Plugin القياسي | `definePluginEntry` |
  | `plugin-sdk/core` | إعادة تصدير شاملة قديمة متوافقة لتعريفات/بُنّاة إدخال القنوات | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | تصدير مخطط إعدادات الجذر | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | مساعد إدخال لموفّر واحد | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعريفات وبُنّاة إدخال القنوات المركزة | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة | مطالبات قائمة السماح، وبُنّاة حالة الإعداد |
  | `plugin-sdk/setup-runtime` | مساعدات وقت التشغيل الخاصة بالإعداد | محوّلات تصحيح الإعداد الآمنة للاستيراد، ومساعدات ملاحظات البحث، و`promptResolvedAllowFrom` و`splitSetupEntries` ووكلاء الإعداد المفوَّضون |
  | `plugin-sdk/setup-adapter-runtime` | مساعدات محوّل الإعداد | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | مساعدات أدوات الإعداد | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | مساعدات الحسابات المتعددة | مساعدات قائمة/إعدادات/بوابة إجراءات الحساب |
  | `plugin-sdk/account-id` | مساعدات معرّف الحساب | `DEFAULT_ACCOUNT_ID`، وتطبيع معرّف الحساب |
  | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب | مساعدات البحث عن الحساب + الرجوع إلى الافتراضي |
  | `plugin-sdk/account-helpers` | مساعدات حساب ضيقة النطاق | مساعدات قائمة الحساب/إجراء الحساب |
  | `plugin-sdk/channel-setup` | محوّلات معالج الإعداد | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID` و`createTopLevelChannelDmPolicy` و`setSetupChannelEnabled` و`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | بدائيات اقتران الرسائل المباشرة | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | توصيل بادئة الرد + حالة الكتابة | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | مصانع محوّل الإعدادات | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | بُنّاة مخطط الإعدادات | بدائيات مخطط إعدادات القنوات المشتركة؛ أما تصديرات المخطط المسمّاة باسم القنوات المجمّعة فهي توافق قديم فقط |
  | `plugin-sdk/telegram-command-config` | مساعدات إعدادات أوامر Telegram | تطبيع اسم الأمر، وقص الوصف، والتحقق من التكرار/التعارض |
  | `plugin-sdk/channel-policy` | تحليل سياسة المجموعة/الرسائل المباشرة | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | مساعدات دورة حياة حالة الحساب ومسودة التدفق | `createAccountStatusSink`، ومساعدات إنهاء معاينة المسودة |
  | `plugin-sdk/inbound-envelope` | مساعدات المغلف الوارد | مساعدات مشتركة لبناء المسار + المغلف |
  | `plugin-sdk/inbound-reply-dispatch` | مساعدات الرد الوارد | مساعدات مشتركة للتسجيل ثم الإرسال |
  | `plugin-sdk/messaging-targets` | تحليل أهداف المراسلة | مساعدات تحليل/مطابقة الهدف |
  | `plugin-sdk/outbound-media` | مساعدات الوسائط الصادرة | تحميل الوسائط الصادرة المشتركة |
  | `plugin-sdk/outbound-runtime` | مساعدات وقت التشغيل الصادر | مساعدات التسليم الصادر، ومفوّض الهوية/الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
  | `plugin-sdk/thread-bindings-runtime` | مساعدات ربط الخيوط | مساعدات دورة حياة ربط الخيوط والمحوّل |
  | `plugin-sdk/agent-media-payload` | مساعدات حمولة الوسائط القديمة | باني حمولة وسائط الوكيل لتخطيطات الحقول القديمة |
  | `plugin-sdk/channel-runtime` | طبقة توافق مهملة | أدوات قديمة لوقت تشغيل القناة فقط |
  | `plugin-sdk/channel-send-result` | أنواع نتائج الإرسال | أنواع نتائج الرد |
  | `plugin-sdk/runtime-store` | تخزين Plugin المستمر | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | مساعدات وقت تشغيل واسعة | مساعدات وقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
  | `plugin-sdk/runtime-env` | مساعدات بيئة وقت تشغيل ضيقة | مساعدات المسجّل/بيئة وقت التشغيل، والمهلة، وإعادة المحاولة، والتراجع التدريجي |
  | `plugin-sdk/plugin-runtime` | مساعدات وقت التشغيل المشتركة للـ Plugin | مساعدات أوامر/ hooks / http / التفاعل الخاصة بالـ Plugin |
  | `plugin-sdk/hook-runtime` | مساعدات مسار hook | مساعدات مشتركة لمسار Webhook / hook الداخلي |
  | `plugin-sdk/lazy-runtime` | مساعدات وقت التشغيل الكسول | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | مساعدات العمليات | مساعدات exec مشتركة |
  | `plugin-sdk/cli-runtime` | مساعدات وقت تشغيل CLI | تنسيق الأوامر، والانتظار، ومساعدات الإصدارات |
  | `plugin-sdk/gateway-runtime` | مساعدات Gateway | عميل Gateway ومساعدات تصحيح حالة القناة |
  | `plugin-sdk/config-runtime` | مساعدات الإعدادات | مساعدات تحميل/كتابة الإعدادات |
  | `plugin-sdk/telegram-command-config` | مساعدات أوامر Telegram | مساعدات التحقق من أوامر Telegram الثابتة عند غياب سطح عقد Telegram المجمّع |
  | `plugin-sdk/approval-runtime` | مساعدات مطالبات الموافقة | حمولة موافقة exec/Plugin، ومساعدات إمكانات/ملف تعريف الموافقة، ومساعدات توجيه/وقت تشغيل الموافقة الأصلية، وتنسيق مسار العرض المنظم للموافقة |
  | `plugin-sdk/approval-auth-runtime` | مساعدات مصادقة الموافقة | تحليل المُوافق، ومصادقة الإجراء داخل المحادثة نفسها |
  | `plugin-sdk/approval-client-runtime` | مساعدات عميل الموافقة | مساعدات ملف تعريف/مرشّح الموافقة الأصلية لـ exec |
  | `plugin-sdk/approval-delivery-runtime` | مساعدات تسليم الموافقة | محوّلات إمكانات/تسليم الموافقة الأصلية |
  | `plugin-sdk/approval-gateway-runtime` | مساعدات Gateway للموافقة | مساعد تحليل Gateway للموافقة المشترك |
  | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات محوّل الموافقة | مساعدات خفيفة لتحميل محوّل الموافقة الأصلية لنقاط إدخال القنوات السريعة |
  | `plugin-sdk/approval-handler-runtime` | مساعدات معالج الموافقة | مساعدات أوسع لوقت تشغيل معالج الموافقة؛ فضّل واجهات المحوّل/البوابة الأضيق عندما تكون كافية |
  | `plugin-sdk/approval-native-runtime` | مساعدات هدف الموافقة | مساعدات ربط هدف/حساب الموافقة الأصلية |
  | `plugin-sdk/approval-reply-runtime` | مساعدات رد الموافقة | مساعدات حمولة رد الموافقة لـ exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | مساعدات سياق وقت تشغيل القناة | مساعدات عامة لتسجيل/جلب/مراقبة سياق وقت تشغيل القناة |
  | `plugin-sdk/security-runtime` | مساعدات الأمان | مساعدات مشتركة للثقة، وتقييد الرسائل المباشرة، والمحتوى الخارجي، وجمع الأسرار |
  | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF | مساعدات قائمة السماح للمضيف وسياسة الشبكة الخاصة |
  | `plugin-sdk/ssrf-runtime` | مساعدات وقت تشغيل SSRF | المرسِل المثبّت، والجلب المحمي، ومساعدات سياسة SSRF |
  | `plugin-sdk/collection-runtime` | مساعدات الذاكرة المؤقتة المحدودة | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | مساعدات تقييد التشخيص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | مساعدات تنسيق الأخطاء | `formatUncaughtError`, `isApprovalNotFoundError`، ومساعدات رسم الأخطاء البياني |
  | `plugin-sdk/fetch-runtime` | مساعدات fetch/proxy المغلّفة | `resolveFetch`، ومساعدات proxy |
  | `plugin-sdk/host-runtime` | مساعدات تطبيع المضيف | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | مساعدات إعادة المحاولة | `RetryConfig`, `retryAsync`، ومشغلات السياسات |
  | `plugin-sdk/allow-from` | تنسيق قائمة السماح | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | تعيين مدخلات قائمة السماح | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | تقييد الأوامر ومساعدات سطح الأوامر | `resolveControlCommandGate`، ومساعدات تفويض المُرسِل، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسيطات الديناميكية |
  | `plugin-sdk/command-status` | عارضات حالة/مساعدة الأوامر | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تحليل إدخال الأسرار | مساعدات إدخال الأسرار |
  | `plugin-sdk/webhook-ingress` | مساعدات طلب Webhook | أدوات هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | مساعدات حراسة جسم طلب Webhook | مساعدات قراءة/تحديد جسم الطلب |
  | `plugin-sdk/reply-runtime` | وقت تشغيل الرد المشترك | الإرسال الوارد، وHeartbeat، ومخطط الرد، والتجزئة |
  | `plugin-sdk/reply-dispatch-runtime` | مساعدات إرسال الرد الضيقة | الإنهاء، وإرسال الموفّر، ومساعدات تسمية المحادثة |
  | `plugin-sdk/reply-history` | مساعدات سجل الردود | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | تخطيط مرجع الرد | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | مساعدات تقسيم الرد | مساعدات تقسيم النص/Markdown |
  | `plugin-sdk/session-store-runtime` | مساعدات مخزن الجلسة | مساعدات مسار المخزن + `updated-at` |
  | `plugin-sdk/state-paths` | مساعدات مسارات الحالة | مساعدات دليل الحالة وOAuth |
  | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ومساعدات تطبيع مفتاح الجلسة |
  | `plugin-sdk/status-helpers` | مساعدات حالة القناة | بُنّاة ملخص حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدات بيانات المشكلة |
  | `plugin-sdk/target-resolver-runtime` | مساعدات محلل الهدف | مساعدات مشتركة لمحلل الهدف |
  | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع السلاسل | مساعدات تطبيع slug/السلاسل |
  | `plugin-sdk/request-url` | مساعدات URL الطلب | استخراج URL نصية من مدخلات شبيهة بالطلب |
  | `plugin-sdk/run-command` | مساعدات الأوامر الموقّتة | مشغّل أوامر موقّت مع `stdout`/`stderr` مطبّعين |
  | `plugin-sdk/param-readers` | قارئات المعاملات | قارئات معاملات شائعة للأدوات/CLI |
  | `plugin-sdk/tool-payload` | استخراج حمولة الأداة | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
  | `plugin-sdk/tool-send` | استخراج إرسال الأداة | استخراج حقول هدف الإرسال القياسية من وسيطات الأداة |
  | `plugin-sdk/temp-path` | مساعدات المسارات المؤقتة | مساعدات مشتركة لمسارات تنزيل الملفات المؤقتة |
  | `plugin-sdk/logging-core` | مساعدات التسجيل | مساعدات مسجّل النظام الفرعي وإخفاء البيانات |
  | `plugin-sdk/markdown-table-runtime` | مساعدات جداول Markdown | مساعدات أوضاع جداول Markdown |
  | `plugin-sdk/reply-payload` | أنواع رد الرسائل | أنواع حمولة الرد |
  | `plugin-sdk/provider-setup` | مساعدات إعداد منسّقة للموفّرين المحليين/المستضافين ذاتيًا | مساعدات اكتشاف/إعداد الموفّر المستضاف ذاتيًا |
  | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد موفّر مستضاف ذاتيًا متوافق مع OpenAI | مساعدات اكتشاف/إعداد الموفّر المستضاف ذاتيًا نفسها |
  | `plugin-sdk/provider-auth-runtime` | مساعدات مصادقة وقت التشغيل للموفّر | مساعدات تحليل مفتاح API وقت التشغيل |
  | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد مفتاح API للموفّر | مساعدات ضمّ مفتاح API/كتابة الملف التعريفي |
  | `plugin-sdk/provider-auth-result` | مساعدات نتيجة مصادقة الموفّر | باني قياسي لنتيجة مصادقة OAuth |
  | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي للموفّر | مساعدات تسجيل الدخول التفاعلي المشتركة |
  | `plugin-sdk/provider-selection-runtime` | مساعدات اختيار الموفّر | اختيار الموفّر المهيّأ أو التلقائي ودمج إعدادات الموفّر الخام |
  | `plugin-sdk/provider-env-vars` | مساعدات متغيرات البيئة للموفّر | مساعدات البحث عن متغيرات بيئة مصادقة الموفّر |
  | `plugin-sdk/provider-model-shared` | مساعدات مشتركة لنموذج/إعادة تشغيل الموفّر | `ProviderReplayFamily` و`buildProviderReplayFamilyHooks` و`normalizeModelCompat` وبُنّاة سياسات إعادة التشغيل المشتركة، ومساعدات نقطة نهاية الموفّر، ومساعدات تطبيع معرّف النموذج |
  | `plugin-sdk/provider-catalog-shared` | مساعدات مشتركة لكتالوج الموفّر | `findCatalogTemplate` و`buildSingleProviderApiKeyCatalog` و`supportsNativeStreamingUsageCompat` و`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | تصحيحات إعداد الموفّر الأولي | مساعدات إعدادات الإعداد الأولي |
  | `plugin-sdk/provider-http` | مساعدات HTTP للموفّر | مساعدات عامة لقدرات HTTP/نقطة النهاية للموفّر، بما في ذلك مساعدات نماذج multipart لنسخ الصوت |
  | `plugin-sdk/provider-web-fetch` | مساعدات web-fetch للموفّر | مساعدات تسجيل/ذاكرة مؤقتة لموفّر web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | مساعدات إعدادات البحث على الويب للموفّر | مساعدات ضيقة لإعدادات/بيانات اعتماد البحث على الويب للموفّرين الذين لا يحتاجون إلى توصيل تمكين Plugin |
  | `plugin-sdk/provider-web-search-contract` | مساعدات عقد البحث على الويب للموفّر | مساعدات ضيقة لعقد إعدادات/بيانات اعتماد البحث على الويب مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` وعمليات الضبط/الجلب المقيّدة لبيانات الاعتماد |
  | `plugin-sdk/provider-web-search` | مساعدات البحث على الويب للموفّر | مساعدات تسجيل/ذاكرة مؤقتة/وقت تشغيل لموفّر البحث على الويب |
  | `plugin-sdk/provider-tools` | مساعدات توافق أداة/مخطط الموفّر | `ProviderToolCompatFamily` و`buildProviderToolCompatFamilyHooks` وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | مساعدات استخدام الموفّر | `fetchClaudeUsage` و`fetchGeminiUsage` و`fetchGithubCopilotUsage` ومساعدات استخدام أخرى للموفّر |
  | `plugin-sdk/provider-stream` | مساعدات تغليف تدفق الموفّر | `ProviderStreamFamily` و`buildProviderStreamFamilyHooks` و`composeProviderStreamWrappers` وأنواع مغلفات التدفق، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | مساعدات نقل الموفّر | مساعدات نقل الموفّر الأصلية مثل الجلب المحمي، وتحويلات رسائل النقل، وتيارات أحداث النقل القابلة للكتابة |
  | `plugin-sdk/keyed-async-queue` | طابور async مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | مساعدات وسائط مشتركة | مساعدات جلب/تحويل/تخزين الوسائط بالإضافة إلى بُنّاة حمولة الوسائط |
  | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لتوليد الوسائط | مساعدات failover مشتركة، واختيار المرشحين، ورسائل النموذج المفقود لتوليد الصور/الفيديو/الموسيقى |
  | `plugin-sdk/media-understanding` | مساعدات فهم الوسائط | أنواع موفّر فهم الوسائط بالإضافة إلى تصديرات مساعدات الصور/الصوت المواجهة للموفّر |
  | `plugin-sdk/text-runtime` | مساعدات نصية مشتركة | إزالة النص المرئي للمساعد، ومساعدات عرض/تجزئة/جداول Markdown، ومساعدات الإخفاء، ومساعدات وسوم التوجيه، وأدوات النص الآمن، ومساعدات نصية/تسجيلية ذات صلة |
  | `plugin-sdk/text-chunking` | مساعدات تجزئة النص | مساعد تجزئة النص الصادر |
  | `plugin-sdk/speech` | مساعدات الكلام | أنواع موفّر الكلام بالإضافة إلى مساعدات التوجيه والسجل والتحقق المواجهة للموفّر |
  | `plugin-sdk/speech-core` | جوهر الكلام المشترك | أنواع موفّر الكلام، والسجل، والتوجيهات، والتطبيع |
  | `plugin-sdk/realtime-transcription` | مساعدات النسخ الفوري | أنواع الموفّر، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
  | `plugin-sdk/realtime-voice` | مساعدات الصوت الفوري | أنواع الموفّر، ومساعدات السجل/التحليل، ومساعدات جلسة bridge |
  | `plugin-sdk/image-generation-core` | جوهر توليد الصور المشترك | أنواع توليد الصور، وfailover، والمصادقة، ومساعدات السجل |
  | `plugin-sdk/music-generation` | مساعدات توليد الموسيقى | أنواع موفّر/طلب/نتيجة توليد الموسيقى |
  | `plugin-sdk/music-generation-core` | جوهر توليد الموسيقى المشترك | أنواع توليد الموسيقى، ومساعدات failover، والبحث عن الموفّر، وتحليل model-ref |
  | `plugin-sdk/video-generation` | مساعدات توليد الفيديو | أنواع موفّر/طلب/نتيجة توليد الفيديو |
  | `plugin-sdk/video-generation-core` | جوهر توليد الفيديو المشترك | أنواع توليد الفيديو، ومساعدات failover، والبحث عن الموفّر، وتحليل model-ref |
  | `plugin-sdk/interactive-runtime` | مساعدات الرد التفاعلي | تطبيع/اختزال حمولة الرد التفاعلي |
  | `plugin-sdk/channel-config-primitives` | بدائيات إعدادات القناة | بدائيات ضيقة لمخطط إعدادات القناة |
  | `plugin-sdk/channel-config-writes` | مساعدات كتابة إعدادات القناة | مساعدات تفويض كتابة إعدادات القناة |
  | `plugin-sdk/channel-plugin-common` | تمهيد مشترك للقناة | تصديرات تمهيد Plugin القناة المشتركة |
  | `plugin-sdk/channel-status` | مساعدات حالة القناة | مساعدات مشتركة للقطات/ملخصات حالة القناة |
  | `plugin-sdk/allowlist-config-edit` | مساعدات إعدادات قائمة السماح | مساعدات تعديل/قراءة إعدادات قائمة السماح |
  | `plugin-sdk/group-access` | مساعدات وصول المجموعة | مساعدات مشتركة لقرارات وصول المجموعة |
  | `plugin-sdk/direct-dm` | مساعدات الرسائل المباشرة المباشرة | مساعدات مشتركة لمصادقة/حراسة الرسائل المباشرة المباشرة |
  | `plugin-sdk/extension-shared` | مساعدات امتداد مشتركة | بدائيات مساعدات القناة/الحالة السلبية والوكيل المحيطي |
  | `plugin-sdk/webhook-targets` | مساعدات أهداف Webhook | سجل أهداف Webhook ومساعدات تثبيت المسارات |
  | `plugin-sdk/webhook-path` | مساعدات مسار Webhook | مساعدات تطبيع مسار Webhook |
  | `plugin-sdk/web-media` | مساعدات وسائط الويب المشتركة | مساعدات تحميل الوسائط البعيدة/المحلية |
  | `plugin-sdk/zod` | إعادة تصدير Zod | إعادة تصدير `zod` لمستهلكي Plugin SDK |
  | `plugin-sdk/memory-core` | مساعدات memory-core المجمّعة | سطح مساعدات مدير الذاكرة/الإعدادات/الملفات/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل محرك الذاكرة | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
  | `plugin-sdk/memory-core-host-engine-foundation` | محرك الأساس لمضيف الذاكرة | تصديرات محرك الأساس لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-embeddings` | محرك embeddings لمضيف الذاكرة | عقود embeddings الخاصة بالذاكرة، والوصول إلى السجل، والموفّر المحلي، ومساعدات عامة للدفعات/البعيد؛ أما الموفّرون البعيدون الملموسون فيبقون داخل Plugins المالكة لهم |
  | `plugin-sdk/memory-core-host-engine-qmd` | محرك QMD لمضيف الذاكرة | تصديرات محرك QMD لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-engine-storage` | محرك التخزين لمضيف الذاكرة | تصديرات محرك التخزين لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة | مساعدات متعددة الوسائط لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة | مساعدات الاستعلام لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة | مساعدات الأسرار لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة | مساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة | مساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-cli` | وقت تشغيل CLI لمضيف الذاكرة | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-core` | وقت تشغيل core لمضيف الذاكرة | مساعدات وقت تشغيل core لمضيف الذاكرة |
  | `plugin-sdk/memory-core-host-runtime-files` | مساعدات ملفات/وقت تشغيل مضيف الذاكرة | مساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-core` | اسم بديل لوقت تشغيل core لمضيف الذاكرة | اسم بديل محايد تجاه المورّد لمساعدات وقت تشغيل core لمضيف الذاكرة |
  | `plugin-sdk/memory-host-events` | اسم بديل لسجل أحداث مضيف الذاكرة | اسم بديل محايد تجاه المورّد لمساعدات سجل أحداث مضيف الذاكرة |
  | `plugin-sdk/memory-host-files` | اسم بديل لملفات/وقت تشغيل مضيف الذاكرة | اسم بديل محايد تجاه المورّد لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
  | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدارة | مساعدات Markdown مُدارة مشتركة لـ Plugins المجاورة للذاكرة |
  | `plugin-sdk/memory-host-search` | واجهة بحث Active Memory | واجهة وقت تشغيل كسولة لمدير بحث Active Memory |
  | `plugin-sdk/memory-host-status` | اسم بديل لحالة مضيف الذاكرة | اسم بديل محايد تجاه المورّد لمساعدات حالة مضيف الذاكرة |
  | `plugin-sdk/memory-lancedb` | مساعدات memory-lancedb المجمّعة | سطح مساعدات memory-lancedb |
  | `plugin-sdk/testing` | أدوات الاختبار | مساعدات ومحاكيات الاختبار |
</Accordion>

هذا الجدول هو عمدًا المجموعة الفرعية الشائعة للترحيل، وليس سطح
SDK الكامل. القائمة الكاملة التي تضم أكثر من 200 نقطة دخول موجودة في
`scripts/lib/plugin-sdk-entrypoints.json`.

ما تزال تلك القائمة تتضمن بعض واجهات المساعدات الخاصة بـ Plugins المجمّعة مثل
`plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و`plugin-sdk/zalo`،
و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. تظل هذه الواجهات مُصدَّرة من أجل
صيانة Plugins المجمّعة والتوافق، لكنها أُزيلت عمدًا من جدول الترحيل الشائع
وليست الهدف الموصى به لكود Plugins الجديد.

تنطبق القاعدة نفسها على عائلات المساعدات المجمّعة الأخرى مثل:

- مساعدات دعم المتصفح: `plugin-sdk/browser-cdp` و`plugin-sdk/browser-config-runtime` و`plugin-sdk/browser-config-support` و`plugin-sdk/browser-control-auth` و`plugin-sdk/browser-node-runtime` و`plugin-sdk/browser-profiles` و`plugin-sdk/browser-security-runtime` و`plugin-sdk/browser-setup-tools` و`plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- واجهات المساعدات/Plugins المجمّعة مثل `plugin-sdk/googlechat`،
  و`plugin-sdk/zalouser` و`plugin-sdk/bluebubbles*`،
  و`plugin-sdk/mattermost*` و`plugin-sdk/msteams`،
  و`plugin-sdk/nextcloud-talk` و`plugin-sdk/nostr` و`plugin-sdk/tlon`،
  و`plugin-sdk/twitch`،
  و`plugin-sdk/github-copilot-login` و`plugin-sdk/github-copilot-token`،
  و`plugin-sdk/diagnostics-otel` و`plugin-sdk/diffs` و`plugin-sdk/llm-task`،
  و`plugin-sdk/thread-ownership` و`plugin-sdk/voice-call`

يعرض `plugin-sdk/github-copilot-token` حاليًا سطح مساعدات الرموز الضيق
`DEFAULT_COPILOT_API_BASE_URL`،
و`deriveCopilotApiBaseUrlFromToken`، و`resolveCopilotApiToken`.

استخدم أضيق استيراد يطابق المهمة. إذا لم تتمكن من العثور على عملية تصدير،
فتحقق من المصدر في `src/plugin-sdk/` أو اسأل في Discord.

## حالات الإهمال النشطة

حالات إهمال أضيق تنطبق عبر Plugin SDK، وعقد الموفّر،
وسطح وقت التشغيل، وmanifest. ما يزال كل واحد منها يعمل اليوم، لكنه سيُزال
في إصدار رئيسي مستقبلي. يوضّح السطر الموجود تحت كل عنصر واجهة API القديمة
وما يقابلها من بديل قياسي.

<AccordionGroup>
  <Accordion title="بُنّاة المساعدة في command-auth ← command-status">
    **القديم (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`،
    و`buildCommandsMessagePaginated`، و`buildHelpMessage`.

    **الجديد (`openclaw/plugin-sdk/command-status`)**: التواقيع نفسها،
    وعمليات التصدير نفسها — فقط يجري استيرادها من مسار فرعي أضيق. يقوم `command-auth`
    بإعادة تصديرها كبدائل توافقية.

    ```typescript
    // قبل
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // بعد
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="مساعدات تقييد الإشارات ← resolveInboundMentionDecision">
    **القديم**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` من
    `openclaw/plugin-sdk/channel-inbound` أو
    `openclaw/plugin-sdk/channel-mention-gating`.

    **الجديد**: `resolveInboundMentionDecision({ facts, policy })` — يعيد
    كائن قرار واحدًا بدلًا من استدعاءين منفصلين.

    لقد انتقلت بالفعل Plugins القنوات التابعة (Slack وDiscord وMatrix وMS Teams)
    إلى هذا المسار.

  </Accordion>

  <Accordion title="طبقة توافق وقت تشغيل القناة ومساعدات إجراءات القناة">
    إن `openclaw/plugin-sdk/channel-runtime` هو طبقة توافق لـ Plugins
    القنوات الأقدم. لا تستورده في الكود الجديد؛ استخدم
    `openclaw/plugin-sdk/channel-runtime-context` لتسجيل
    كائنات وقت التشغيل.

    إن مساعدات `channelActions*` الموجودة في `openclaw/plugin-sdk/channel-actions` مهملة
    إلى جانب تصديرات القنوات الخام من نوع "actions". اعرض الإمكانات
    عبر سطح `presentation` الدلالي بدلًا من ذلك — إذ تعلن Plugins القنوات
    ما الذي تعرضه (بطاقات، أزرار، قوائم اختيار) بدلًا من أسماء
    الإجراءات الخام التي تقبلها.

  </Accordion>

  <Accordion title="مساعد `tool()` لموفّر البحث على الويب ← `createTool()` على Plugin">
    **القديم**: المصنع `tool()` من `openclaw/plugin-sdk/provider-web-search`.

    **الجديد**: نفّذ `createTool(...)` مباشرةً على Plugin الخاص بالموفّر.
    لم يعد OpenClaw بحاجة إلى مساعد SDK لتسجيل مغلّف الأداة.

  </Accordion>

  <Accordion title="مغلفات القنوات النصية الخام ← BodyForAgent">
    **القديم**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) لبناء مغلف مطالبة نصي مسطح
    من رسائل القنوات الواردة.

    **الجديد**: `BodyForAgent` بالإضافة إلى كتل سياق مستخدم منظَّمة. تقوم
    Plugins القنوات بإرفاق بيانات تعريف التوجيه (الخيط، والموضوع، والرد إلى،
    والتفاعلات) كحقول ذات أنواع محددة بدلًا من ضمّها إلى
    سلسلة prompt. ما يزال المساعد `formatAgentEnvelope(...)` مدعومًا
    للمغلفات المُنشأة والموجّهة إلى المساعد، لكن المغلفات النصية الخام الواردة
    في طريقها إلى الإزالة.

    المجالات المتأثرة: `inbound_claim` و`message_received` وأي
    Plugin قناة مخصص كان يعالج نص `channelEnvelope` بعد معالجته.

  </Accordion>

  <Accordion title="أنواع اكتشاف الموفّر ← أنواع كتالوج الموفّر">
    أصبحت أربعة أسماء مستعارة لأنواع الاكتشاف الآن مجرد أغلفة رقيقة فوق
    أنواع عصر الكتالوج:

    | الاسم المستعار القديم | النوع الجديد |
    | --------------------- | ------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    بالإضافة إلى الحقيبة الساكنة القديمة `ProviderCapabilities` — ينبغي على Plugins الموفّر
    إرفاق حقائق الإمكانات عبر عقد وقت تشغيل الموفّر
    بدلًا من كائن ساكن.

  </Accordion>

  <Accordion title="hooks سياسة Thinking ← resolveThinkingProfile">
    **القديم** (ثلاثة hooks منفصلة على `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)` و`supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **الجديد**: `resolveThinkingProfile(ctx)` واحد يعيد
    `ProviderThinkingProfile` يحتوي على `id` القياسي، و`label` اختياري،
    وقائمة مستويات مرتبة. يقوم OpenClaw بخفض القيم المخزنة القديمة وفق
    رتبة الملف التعريفي تلقائيًا.

    نفّذ hook واحدًا بدلًا من ثلاثة. تظل hooks القديمة تعمل خلال
    نافذة الإهمال لكنها لا تُركَّب مع نتيجة الملف التعريفي.

  </Accordion>

  <Accordion title="الاحتياط لموفّر OAuth الخارجي ← contracts.externalAuthProviders">
    **القديم**: تنفيذ `resolveExternalOAuthProfiles(...)` من دون
    التصريح عن الموفّر في manifest الخاص بـ Plugin.

    **الجديد**: صرّح عن `contracts.externalAuthProviders` في manifest الخاص بـ Plugin
    **و** نفّذ `resolveExternalAuthProfiles(...)`. إن مسار
    "احتياط المصادقة" القديم يصدر تحذيرًا وقت التشغيل وسيُزال.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="البحث عن متغيرات بيئة الموفّر ← setup.providers[].envVars">
    **حقل manifest القديم**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **الجديد**: اعكس البحث نفسه عن متغيرات البيئة داخل `setup.providers[].envVars`
    في manifest. يدمج هذا بيانات بيئة الإعداد/الحالة في
    مكان واحد ويتجنب تشغيل وقت تشغيل Plugin فقط للإجابة عن
    طلبات البحث عن متغيرات البيئة.

    يظل `providerAuthEnvVars` مدعومًا عبر محوّل توافق
    حتى تُغلق نافذة الإهمال.

  </Accordion>

  <Accordion title="تسجيل Plugin الذاكرة ← registerMemoryCapability">
    **القديم**: ثلاث استدعاءات منفصلة —
    `api.registerMemoryPromptSection(...)`،
    و`api.registerMemoryFlushPlan(...)`،
    و`api.registerMemoryRuntime(...)`.

    **الجديد**: استدعاء واحد على API حالة الذاكرة —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    الخانات نفسها، واستدعاء تسجيل واحد. أما مساعدات الذاكرة الإضافية
    (`registerMemoryPromptSupplement` و`registerMemoryCorpusSupplement`،
    و`registerMemoryEmbeddingProvider`) فلا تتأثر.

  </Accordion>

  <Accordion title="إعادة تسمية أنواع رسائل جلسة Subagent">
    لا يزال اسمان مستعاران قديمان للأنواع مُصدَّرين من `src/plugins/runtime/types.ts`:

    | القديم | الجديد |
    | ------- | ------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    إن طريقة وقت التشغيل `readSession` مهملة لصالح
    `getSessionMessages`. التوقيع نفسه؛ والطريقة القديمة تستدعي
    الجديدة.

  </Accordion>

  <Accordion title="runtime.tasks.flow ← runtime.tasks.flows">
    **القديم**: كان `runtime.tasks.flow` (بالمفرد) يعيد موصّل TaskFlow حيًا.

    **الجديد**: يعيد `runtime.tasks.flows` (بالجمع) وصول TaskFlow
    قائمًا على DTO، وهو آمن للاستيراد ولا يتطلب تحميل
    وقت تشغيل المهام الكامل.

    ```typescript
    // قبل
    const flow = api.runtime.tasks.flow(ctx);
    // بعد
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="مصانع الامتدادات المضمّنة ← middleware لنتائج أدوات الوكيل">
    تمت تغطية ذلك في "كيفية الترحيل ← ترحيل امتدادات Pi لنتائج الأدوات إلى
    middleware" أعلاه. وهو مُدرج هنا للاكتمال: تم استبدال
    المسار المُزال الخاص بـ Pi فقط `api.registerEmbeddedExtensionFactory(...)`
    بـ `api.registerAgentToolResultMiddleware(...)` مع قائمة وقت تشغيل
    صريحة في `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="الاسم المستعار OpenClawSchemaType ← OpenClawConfig">
    إن `OpenClawSchemaType` الذي يُعاد تصديره من `openclaw/plugin-sdk` أصبح الآن
    اسمًا مستعارًا من سطر واحد لـ `OpenClawConfig`. فضّل الاسم القياسي.

    ```typescript
    // قبل
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // بعد
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
تُتَابَع حالات الإهمال على مستوى الامتدادات (داخل Plugins القنوات/الموفّرين المجمّعة تحت
`extensions/`) داخل حاويات `api.ts` و`runtime-api.ts`
الخاصة بها. وهي لا تؤثر في عقود Plugins التابعة لجهات خارجية، ولذلك لا تُدرج
هنا. إذا كنت تستهلك الحاوية المحلية لـ Plugin مجمّع مباشرةً، فاقرأ
تعليقات الإهمال في تلك الحاوية قبل الترقية.
</Note>

## الجدول الزمني للإزالة

| متى | ما الذي يحدث |
| ---------------------- | ----------------------------------------------------------------------- |
| **الآن**                | تصدر الواجهات المهملة تحذيرات وقت التشغيل                               |
| **الإصدار الرئيسي التالي** | ستتم إزالة الواجهات المهملة؛ وستفشل Plugins التي ما تزال تستخدمها |

لقد جرى بالفعل ترحيل جميع Plugins الأساسية. ينبغي على Plugins الخارجية الترحيل
قبل الإصدار الرئيسي التالي.

## كتم التحذيرات مؤقتًا

اضبط متغيرات البيئة هذه أثناء عملك على الترحيل:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

هذا مخرج مؤقت، وليس حلًا دائمًا.

## ذو صلة

- [البدء](/ar/plugins/building-plugins) — ابنِ أول Plugin لك
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل للاستيراد عبر المسارات الفرعية
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins) — بناء Plugins الموفّرين
- [الأجزاء الداخلية للـ Plugin](/ar/plugins/architecture) — نظرة متعمقة على المعمارية
- [Manifest الـ Plugin](/ar/plugins/manifest) — مرجع مخطط manifest
