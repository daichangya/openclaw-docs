---
read_when:
    - تحتاج إلى معرفة أي مسار فرعي من SDK يجب الاستيراد منه
    - تريد مرجعًا لكل أساليب التسجيل على OpenClawPluginApi
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: SDK Overview
summary: خريطة الاستيراد ومرجع API للتسجيل ومعمارية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-23T07:28:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# نظرة عامة على Plugin SDK

تمثل Plugin SDK العقد المطبّع بين Plugins وcore. وهذه الصفحة هي
المرجع الخاص بـ **ما الذي يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  **تبحث عن دليل عملي؟**
  - أول Plugin؟ ابدأ من [البدء](/ar/plugins/building-plugins)
  - Plugin للقنوات؟ راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  - Plugin للمزوّدين؟ راجع [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins)
</Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة ذاتيًا. وهذا يحافظ على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. وبالنسبة إلى أدوات بناء/إدخال القنوات المحددة،
ففضّل `openclaw/plugin-sdk/channel-core`؛ وأبقِ `openclaw/plugin-sdk/core` للسطح الأوسع المظلي
وللمساعدات المشتركة مثل
`buildChannelConfigSchema`.

لا تضف أو تعتمد على طبقات راحة مسماة باسم المزوّد مثل
`openclaw/plugin-sdk/slack` أو `openclaw/plugin-sdk/discord` أو
`openclaw/plugin-sdk/signal` أو `openclaw/plugin-sdk/whatsapp` أو
طبقات مساعدة تحمل علامة القناة. ويجب على Plugins المضمّنة أن تركّب
المسارات الفرعية العامة لـ SDK داخل حاوياتها المحلية `api.ts` أو `runtime-api.ts`، كما يجب على core
إما استخدام هذه الحاويات المحلية الخاصة بـ Plugin أو إضافة عقد SDK عام ضيق
عندما تكون الحاجة فعلًا عابرة للقنوات.

لا تزال خريطة التصدير المولدة تحتوي على مجموعة صغيرة من
طبقات مساعدات Plugins المضمّنة مثل `plugin-sdk/feishu` و`plugin-sdk/feishu-setup` و
`plugin-sdk/zalo` و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. وهذه
المسارات الفرعية موجودة فقط لصيانة Plugins المضمّنة والتوافق؛ وهي
محذوفة عمدًا من الجدول الشائع أدناه وليست مسار الاستيراد الموصى به
لـ Plugins الخارجية الجديدة.

## مرجع المسارات الفرعية

أكثر المسارات الفرعية استخدامًا، مجمعة حسب الغرض. وتوجد القائمة الكاملة
المولدة التي تحتوي على أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال المسارات الفرعية المحجوزة لمساعدات Plugins المضمّنة تظهر في تلك القائمة المولدة.
تعامل معها على أنها سطح تفاصيل تنفيذ/توافق ما لم تروّج لها صفحة مستندات
صراحة باعتبارها عامة.

### إدخال Plugin

| المسار الفرعي              | الصادرات الرئيسية |
| ------------------------- | ----------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry` |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema` |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات مشتركة لمعالج الإعداد، ومطالبات allowlist، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعداد/بوابة إجراءات تعدد الحسابات، ومساعدات الرجوع الاحتياطي للحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع الاحتياطي الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط إعدادات القنوات |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق أوامر Telegram المخصصة مع رجوع احتياطي لعقدة مضمّنة |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تخويل الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، ومساعدات دورة الحياة/الإنهاء لتدفق المسودات |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد والمغلف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل الرسائل الواردة وتوزيع الردود |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات هوية الصادر، ومفوّض الإرسال، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة الحياة والمحوّل الخاصة بربط الخيوط |
    | `plugin-sdk/agent-media-payload` | بانٍ قديم لحمولة وسائط الوكيل |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/الخيط والاقتران والربط المهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد snapshot لإعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات تحليل group-policy في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للـ snapshot/الملخص الخاص بحالة القناة |
    | `plugin-sdk/channel-config-primitives` | أوليات ضيقة لمخطط إعدادات القنوات |
    | `plugin-sdk/channel-config-writes` | مساعدات تخويل كتابة إعدادات القنوات |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيدية مشتركة لـ Plugin القنوات |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تعديل إعدادات allowlist |
    | `plugin-sdk/group-access` | مساعدات مشتركة لاتخاذ قرار الوصول للمجموعة |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة للمصادقة/الحراسة الخاصة بالرسائل المباشرة |
    | `plugin-sdk/interactive-runtime` | العرض الدلالي للرسائل، والتسليم، ومساعدات الردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | حاوية توافقية لمساعدات إزالة ارتداد الوارد، ومطابقة الإشارات، وسياسات الإشارة، ومساعدات المغلف |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارة من دون السطح الأوسع لوقت تشغيل الوارد |
    | `plugin-sdk/channel-location` | مساعدات سياق موقع القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القنوات لعمليات إسقاط الوارد وإخفاقات الكتابة/التأكيد |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القنوات، بالإضافة إلى مساعدات مخطط أصلية قديمة ما تزال محفوظة لتوافق Plugins |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزوّدين">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد المزوّدات المحلية/المستضافة ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد مزوّدات OpenAI-compatible المستضافة ذاتيًا |
    | `plugin-sdk/cli-backend` | الإعدادات الافتراضية لخلفية CLI + ثوابت watchdog |
    | `plugin-sdk/provider-auth-runtime` | مساعدات وقت التشغيل لتحليل مفاتيح API الخاصة بـ Plugins المزوّدين |
    | `plugin-sdk/provider-auth-api-key` | مساعدات onboarding/كتابة ملفات التعريف الخاصة بمفاتيح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | بانٍ معياري لنتيجة مصادقة OAuth |
    | `plugin-sdk/provider-auth-login` | مساعدات مشتركة لتسجيل الدخول التفاعلي لPlugins المزوّدين |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة الخاصة بمصادقة المزوّدين |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبناة shared replay-policy، ومساعدات نقاط نهاية المزوّد، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لإمكانات HTTP/نقطة النهاية الخاصة بالمزوّد، بما في ذلك مساعدات multipart form لنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقدة إعداد/اختيار web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات التسجيل/التخزين المؤقت الخاصة بمزوّد web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعداد/بيانات اعتماد web-search للمزوّدات التي لا تحتاج إلى توصيل تفعيل Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقدة إعداد/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، وعمليات الضبط/الجلب المقيدة لبيانات الاعتماد |
    | `plugin-sdk/provider-web-search` | مساعدات التسجيل/التخزين المؤقت/وقت التشغيل لمزوّد web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, وتنظيف مخططات Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات التدفق، ومساعدات التغليف المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات النقل الأصلية للمزوّد مثل الجلب المحروس، وتحويلات رسائل النقل، وتيارات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات ترقيع إعدادات onboarding |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache المحلية للعملية |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تخويل المرسل |
    | `plugin-sdk/command-status` | بُناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات تحليل الموافقين وتخويل الإجراءات داخل الدردشة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات التعريف/المرشحات الأصلية لموافقات exec |
    | `plugin-sdk/approval-delivery-runtime` | محوّلات إمكانات/تسليم الموافقات الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لتحليل gateway الخاصة بالموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محوّلات الموافقة الأصلية لنقاط إدخال القنوات الساخنة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقات؛ ويفضَّل استخدام الطبقات الأضيق الخاصة بالمحوّل/‏gateway عندما تكفي |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة الردود الخاصة بموافقات exec/Plugin |
    | `plugin-sdk/command-auth-native` | مساعدات المصادقة الأصلية للأوامر + أهداف الجلسة الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-surface` | مساعدات تطبيع جسم الأمر وسطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقدة الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` ومساعدات typing الخاصة بـ SecretRef لتحليل العقدة/الإعدادات |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة وتقييد الرسائل المباشرة والمحتوى الخارجي وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات allowlist للمضيف وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة لـ pinned-dispatcher من دون السطح الأوسع لوقت تشغيل البنية التحتية |
    | `plugin-sdk/ssrf-runtime` | مساعدات pinned-dispatcher وfetch المحمي من SSRF وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل مدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات الطلب/الهدف الخاصة بـ Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم جسم الطلب/المهلة الزمنية |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، وlogger، والمهلة، وإعادة المحاولة، والتراجع |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل/البحث عن سياق وقت تشغيل القناة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/hook/http/التفاعل الخاصة بـ Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook/‏hook الداخلي |
    | `plugin-sdk/lazy-runtime` | مساعدات استيراد/ربط وقت التشغيل الكسول مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وترقيعات حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة الإعدادات ومساعدات البحث عن إعدادات Plugin |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع اسم/وصف أمر Telegram والتحقق من التكرار/التعارض، حتى عندما لا يكون سطح عقدة Telegram المضمّن متاحًا |
    | `plugin-sdk/text-autolink-runtime` | كشف الروابط التلقائية لمراجع الملفات من دون الحاوية الأوسع `text-runtime` |
    | `plugin-sdk/approval-runtime` | مساعدات موافقات exec/Plugin، وبناة إمكانات الموافقة، ومساعدات المصادقة/ملف التعريف، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتقطيع، والتوزيع، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لتوزيع/إنهاء الرد |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتقطيع النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات ربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدات بيانات المشكلات الوصفية |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لتحليل الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/string |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات تشبه fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر موقّت مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات شائعة لمعلمات الأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول الهدف القياسية للإرسال من وسائط الأدوات |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات logger للأنظمة الفرعية والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات أوضاع جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات file-lock القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة التخزين المؤقت لإزالة التكرار المدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل/جلسات ACP وتوزيع الرد |
    | `plugin-sdk/acp-binding-resolve-runtime` | تحليل ربط ACP للقراءة فقط من دون واردات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | أوليات ضيقة لمخطط إعدادات وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ مرن لمعلمات boolean |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات تحليل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات bootstrap الخاصة بالأجهزة ورموز الاقتران |
    | `plugin-sdk/extension-shared` | أوليات مشتركة للمساعدة الخاصة بالقنوات السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات الرد الخاصة بالأمر `/models`/المزوّد |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل الأوامر الأصلية/بنائها/تسلسلها |
    | `plugin-sdk/agent-harness` | سطح تجريبي موثوق لـ Plugin من أجل agent harness منخفض المستوى: أنواع harness، ومساعدات steer/abort للتشغيل النشط، ومساعدات جسر الأدوات في OpenClaw، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات كشف نقطة نهاية Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرات التخزين المؤقت المحدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات الأعلام والأحداث التشخيصية |
    | `plugin-sdk/error-runtime` | مساعدات مخطط الأخطاء والتنسيق والتصنيف المشترك للأخطاء و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلف، والوكيل، والبحث المثبت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل واعٍ بـ dispatcher من دون واردات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة من دون السطح الأوسع لوقت تشغيل الوسائط |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المهيأ أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسة من دون واردات واسعة للكتابة/الصيانة في config |
    | `plugin-sdk/context-visibility-runtime` | تحليل رؤية السياق وتصفية السياق التكميلي من دون واردات واسعة للإعدادات/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لإكراه وتطبيع primitive record/string من دون واردات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعدادات إعادة المحاولة ومشغّل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل الوكيل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار للدليل معتمد على config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للإمكانات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولات الوسائط |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للرجوع الاحتياطي لتوليد الوسائط، واختيار المرشحين، ورسائل غياب النموذج |
    | `plugin-sdk/media-understanding` | أنواع مزود فهم الوسائط بالإضافة إلى صادرات مساعدة موجهة للمزوّد للصور/الصوت |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تقطيع/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقطيع النص الصادر |
    | `plugin-sdk/speech` | أنواع مزودات الكلام بالإضافة إلى مساعدات التوجيه والسجل والتحقق الموجهة للمزوّد |
    | `plugin-sdk/speech-core` | مساعدات مشتركة لأنواع مزودات الكلام والسجل والتوجيه والتطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع مزودات النسخ الفوري، ومساعدات السجل، ومساعد جلسة WebSocket المشترك |
    | `plugin-sdk/realtime-voice` | أنواع مزودات الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزودات توليد الصور |
    | `plugin-sdk/image-generation-core` | مساعدات مشتركة لأنواع توليد الصور، والرجوع الاحتياطي، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع مزود/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | مساعدات مشتركة لأنواع توليد الموسيقى، ومساعدات الرجوع الاحتياطي، والبحث عن المزوّد، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع مزود/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | مساعدات مشتركة لأنواع توليد الفيديو، ومساعدات الرجوع الاحتياطي، والبحث عن المزوّد، وتحليل مرجع النموذج |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد `memory-core` المضمّن لمساعدات المدير/الإعداد/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت التشغيل الخاصة بفهرس/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والمزوّد المحلي، والمساعدات العامة للدُفعات/البعيد |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات الحالة لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم مستعار محايد للبائع لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم مستعار محايد للبائع لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم مستعار محايد للبائع لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات markdown مُدارة مشتركة للPlugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة Active Memory لوقت التشغيل للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم مستعار محايد للبائع لمساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعد `memory-lancedb` المضمّن |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمّنة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin المتصفح المضمّن (`browser-support` تبقى حاوية التوافق) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح مساعدات/وقت تشغيل Matrix المضمّن |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح مساعدات/وقت تشغيل LINE المضمّن |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح مساعدات IRC المضمّن |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | طبقات توافق/مساعدة للقنوات المضمّنة |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | طبقات مساعدة للمزايا/Plugins المضمّنة؛ ويصدّر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API التسجيل

يتلقى callback الخاص بـ `register(api)` كائن `OpenClawPluginApi` يحتوي على
الأساليب التالية:

### تسجيل الإمكانات

| الأسلوب | ما الذي يسجله |
| ------- | ------------- |
| `api.registerProvider(...)` | الاستدلال النصي (LLM) |
| `api.registerAgentHarness(...)` | منفّذ وكيل منخفض المستوى تجريبي |
| `api.registerCliBackend(...)` | خلفية استدلال CLI محلية |
| `api.registerChannel(...)` | قناة مراسلة |
| `api.registerSpeechProvider(...)` | تحويل النص إلى كلام / تركيب STT |
| `api.registerRealtimeTranscriptionProvider(...)` | النسخ الفوري المتدفق |
| `api.registerRealtimeVoiceProvider(...)` | جلسات صوت فوري مزدوجة الاتجاه |
| `api.registerMediaUnderstandingProvider(...)` | تحليل الصور/الصوت/الفيديو |
| `api.registerImageGenerationProvider(...)` | توليد الصور |
| `api.registerMusicGenerationProvider(...)` | توليد الموسيقى |
| `api.registerVideoGenerationProvider(...)` | توليد الفيديو |
| `api.registerWebFetchProvider(...)` | مزود جلب / كشط الويب |
| `api.registerWebSearchProvider(...)` | البحث على الويب |

### الأدوات والأوامر

| الأسلوب | ما الذي يسجله |
| ------- | ------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`) |
| `api.registerCommand(def)` | أمر مخصص (يتجاوز LLM) |

### البنية التحتية

| الأسلوب | ما الذي يسجله |
| ------- | ------------- |
| `api.registerHook(events, handler, opts?)` | hook حدث |
| `api.registerHttpRoute(params)` | نقطة نهاية HTTP في Gateway |
| `api.registerGatewayMethod(name, handler)` | أسلوب RPC في Gateway |
| `api.registerCli(registrar, opts?)` | أمر فرعي في CLI |
| `api.registerService(service)` | خدمة خلفية |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي |
| `api.registerEmbeddedExtensionFactory(factory)` | factory امتداد Pi embedded-runner |
| `api.registerMemoryPromptSupplement(builder)` | قسم مضاف للمطالبة مجاور للذاكرة |
| `api.registerMemoryCorpusSupplement(adapter)` | corpus إضافي للبحث/القراءة في الذاكرة |

تبقى مساحات أسماء الإدارة الأساسية المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*` و
`update.*`) دائمًا `operator.admin`، حتى إذا حاول Plugin إسناد
نطاق أضيق لأسلوب gateway. ويفضَّل استخدام بادئات خاصة بـ Plugin
للأساليب التي يملكها Plugin.

استخدم `api.registerEmbeddedExtensionFactory(...)` عندما يحتاج Plugin إلى
توقيت حدث أصلي من Pi أثناء تشغيلات OpenClaw المضمّنة، مثل إعادة كتابة
`tool_result` غير المتزامنة التي يجب أن تحدث قبل إصدار الرسالة النهائية
لنتيجة الأداة.
وهذه طبقة خاصة بالPlugins المضمّنة اليوم: فقط Plugins المضمّنة يمكنها تسجيل واحدة،
ويجب عليها التصريح بـ `contracts.embeddedExtensionFactories: ["pi"]` في
`openclaw.plugin.json`. وأبقِ hooks العادية لـ OpenClaw Plugin لكل شيء
لا يتطلب تلك الطبقة الأدنى.

### بيانات التعريف الخاصة بتسجيل CLI

يقبل `api.registerCli(registrar, opts?)` نوعين من بيانات التعريف على المستوى الأعلى:

- `commands`: الجذور الصريحة للأوامر التي يملكها المسجل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI الجذرية،
  والتوجيه، والتسجيل الكسول لـ CLI في Plugin

إذا كنت تريد أن يبقى أمر Plugin محمّلًا كسولًا في المسار العادي لـ CLI الجذري،
فوفّر `descriptors` تغطي كل جذر أمر على المستوى الأعلى يكشفه ذلك
المسجل.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "إدارة حسابات Matrix والتحقق والأجهزة وحالة الملف الشخصي",
        hasSubcommands: true,
      },
    ],
  },
);
```

استخدم `commands` وحدها فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
ولا يزال مسار التوافق eager هذا مدعومًا، لكنه لا يثبت
عناصر نائبة مدعومة بـ descriptor من أجل التحميل الكسول في وقت التحليل.

### تسجيل خلفية CLI

يتيح `api.registerCliBackend(...)` لـ Plugin امتلاك الإعداد الافتراضي لخلفية
CLI محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالخلفية هو بادئة المزوّد في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالخلفية الشكل نفسه الموجود في `agents.defaults.cliBackends.<id>`.
- تظل إعدادات المستخدم هي الفائزة. إذ يدمج OpenClaw القيمة `agents.defaults.cliBackends.<id>` فوق
  القيمة الافتراضية الخاصة بـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج الخلفية إلى عمليات إعادة كتابة توافقية بعد الدمج
  (مثل تطبيع أشكال flags القديمة).

### الفتحات الحصرية

| الأسلوب | ما الذي يسجله |
| ------- | ------------- |
| `api.registerContextEngine(id, factory)` | محرك سياق (واحد فقط نشط في كل مرة). ويتلقى callback الخاص بـ `assemble()` القيمتين `availableTools` و`citationsMode` حتى يتمكن المحرك من تخصيص الإضافات إلى prompt. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحّدة |
| `api.registerMemoryPromptSection(builder)` | بانٍ لقسم مطالبة الذاكرة |
| `api.registerMemoryFlushPlan(resolver)` | محلل خطة تفريغ الذاكرة |
| `api.registerMemoryRuntime(runtime)` | محول وقت تشغيل الذاكرة |

### محوّلات تضمين الذاكرة

| الأسلوب | ما الذي يسجله |
| ------- | ------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | محول تضمين الذاكرة لـ Plugin النشط |

- `registerMemoryCapability` هو API المفضّل والحصري لPlugin الذاكرة.
- يمكن لـ `registerMemoryCapability` أيضًا كشف `publicArtifacts.listArtifacts(...)`
  بحيث يمكن للPlugins المصاحبة استهلاك مصنوعات الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى التخطيط الخاص
  الإضافي لأي Plugin ذاكرة محدد.
- إن `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` هي APIs حصرية متوافقة مع الإصدارات القديمة لPlugin الذاكرة.
- يتيح `registerMemoryEmbeddingProvider` لـ Plugin الذاكرة النشط تسجيل
  معرّف محوّل تضمين واحد أو أكثر (مثل `openai` أو `gemini` أو
  معرّف مخصص يعرّفه Plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المحولات المسجلة هذه.

### الأحداث ودورة الحياة

| الأسلوب | ما الذي يفعله |
| ------- | ------------- |
| `api.on(hookName, handler, opts?)` | hook دورة حياة مطبّع |
| `api.onConversationBindingResolved(handler)` | callback لربط المحادثة |

### دلالات قرار hook

- `before_tool_call`: تُعد إعادة `{ block: true }` نهائية. وبمجرد أن يضبط أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل إعادة `{ block: false }` على أنها لا قرار (مثل حذف `block`)، وليست تجاوزًا.
- `before_install`: تُعد إعادة `{ block: true }` نهائية. وبمجرد أن يضبط أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل إعادة `{ block: false }` على أنها لا قرار (مثل حذف `block`)، وليست تجاوزًا.
- `reply_dispatch`: تُعد إعادة `{ handled: true, ... }` نهائية. وبمجرد أن يطالب أي معالج بعملية التوزيع، يتم تخطي المعالجات ذات الأولوية الأدنى ومسار توزيع النموذج الافتراضي.
- `message_sending`: تُعد إعادة `{ cancel: true }` نهائية. وبمجرد أن يضبط أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل إعادة `{ cancel: false }` على أنها لا قرار (مثل حذف `cancel`)، وليست تجاوزًا.
- `message_received`: استخدم الحقل المطبّع `threadId` عندما تحتاج إلى توجيه خيط/موضوع وارد. وأبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: استخدم حقول التوجيه المطبّعة `replyToId` / `threadId` قبل الرجوع إلى `metadata` الخاصة بالقناة.
- `gateway_start`: استخدم `ctx.config` و`ctx.workspaceDir` و`ctx.getCron?.()` لحالة بدء التشغيل المملوكة لـ gateway بدلًا من الاعتماد على hooks داخلية من نوع `gateway:startup`.

### حقول كائن API

| الحقل | النوع | الوصف |
| ----- | ------ | ------ |
| `api.id` | `string` | معرّف Plugin |
| `api.name` | `string` | اسم العرض |
| `api.version` | `string?` | إصدار Plugin (اختياري) |
| `api.description` | `string?` | وصف Plugin (اختياري) |
| `api.source` | `string` | مسار مصدر Plugin |
| `api.rootDir` | `string?` | الدليل الجذري لـ Plugin (اختياري) |
| `api.config` | `OpenClawConfig` | snapshot الإعدادات الحالي (snapshot وقت التشغيل النشط داخل الذاكرة عند توفره) |
| `api.pluginConfig` | `Record<string, unknown>` | الإعدادات الخاصة بـ Plugin من `plugins.entries.<id>.config` |
| `api.runtime` | `PluginRuntime` | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) |
| `api.logger` | `PluginLogger` | logger مقيّد (`debug`, `info`, `warn`, `error`) |
| `api.registrationMode` | `PluginRegistrationMode` | وضع التحميل الحالي؛ ويمثل `"setup-runtime"` نافذة بدء التشغيل/الإعداد الخفيفة السابقة للإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string` | تحليل المسار نسبةً إلى جذر Plugin |

## اصطلاح الوحدات الداخلية

داخل Plugin الخاص بك، استخدم ملفات barrel محلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  لا تستورد Plugin الخاص بك أبدًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. فمسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الآن الأسطح العامة لـ Plugin المضمّن المحمّلة عبر facade (`api.ts` و`runtime-api.ts` و
`index.ts` و`setup-entry.ts` وملفات الإدخال العامة المشابهة)
snapshot إعدادات وقت التشغيل النشط عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم تكن هناك
snapshot وقت تشغيل بعد، فإنها تعود إلى ملف الإعدادات المحلول على القرص.

يمكن لـ Plugins المزوّدين أيضًا كشف حاوية عقدة محلية ضيقة خاصة بـ Plugin عندما تكون
مساعدة ما خاصة بالمزوّد عمدًا ولا تنتمي بعد إلى مسار فرعي عام في SDK.
والمثال المضمّن الحالي: يحتفظ مزوّد Anthropic بمساعدات تدفق Claude
في الطبقة العامة الخاصة به `api.ts` / `contract-api.ts` بدلًا من ترقية منطق
ترويسات Anthropic التجريبية و`service_tier` إلى عقدة عامة من نوع
`plugin-sdk/*`.

أمثلة مضمّنة حالية أخرى:

- `@openclaw/openai-provider`: يصدّر `api.ts` بُناة المزوّد،
  ومساعدات النماذج الافتراضية، وبُناة مزوّدات الوقت الحقيقي
- `@openclaw/openrouter-provider`: يصدّر `api.ts` بانٍ المزوّد بالإضافة إلى
  مساعدات onboarding/config

<Warning>
  يجب على كود الإنتاج الخاص بالامتداد أيضًا تجنب استيرادات
  `openclaw/plugin-sdk/<other-plugin>`. وإذا كانت المساعدة مشتركة فعلًا، فقم بترقيتها إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجه بالإمكانات بدلًا من ربط Pluginين معًا.
</Warning>

## ذو صلة

- [نقاط الإدخال](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry` و`defineChannelPluginEntry`
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) — المرجع الكامل لمساحة الأسماء `api.runtime`
- [الإعداد وConfig](/ar/plugins/sdk-setup) — التغليف وmanifestات ومخططات الإعدادات
- [الاختبار](/ar/plugins/sdk-testing) — أدوات الاختبار وقواعد lint
- [ترحيل SDK](/ar/plugins/sdk-migration) — الترحيل من الأسطح المهجورة
- [الداخلية الخاصة بـ Plugin](/ar/plugins/architecture) — المعمارية العميقة ونموذج الإمكانات
