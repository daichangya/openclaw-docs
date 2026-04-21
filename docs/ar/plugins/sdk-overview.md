---
read_when:
    - أنت بحاجة إلى معرفة أي مسار فرعي من SDK يجب الاستيراد منه
    - أنت تريد مرجعًا لكل طرائق التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: SDK Overview
summary: خريطة الاستيراد، ومرجع API للتسجيل، ومعمارية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-21T07:23:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# نظرة عامة على Plugin SDK

يمثل Plugin SDK العقد typed بين Plugins والنواة. هذه الصفحة هي
المرجع الخاص بـ **ما الذي يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  **هل تبحث عن دليل عملي؟**
  - أول Plugin لك؟ ابدأ من [البدء](/ar/plugins/building-plugins)
  - Plugin قناة؟ راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  - Plugin مزود؟ راجع [Plugins المزودات](/ar/plugins/sdk-provider-plugins)
</Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة ذاتيًا. وهذا يحافظ على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. وبالنسبة إلى مساعدات الإدخال/البناء الخاصة بالقنوات،
فاضّل `openclaw/plugin-sdk/channel-core`، واحتفظ بـ `openclaw/plugin-sdk/core` لـ
السطح الأشمل والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

لا تضف أو تعتمد على طبقات تسهيل مسماة باسم مزود مثل
`openclaw/plugin-sdk/slack` أو `openclaw/plugin-sdk/discord` أو
`openclaw/plugin-sdk/signal` أو `openclaw/plugin-sdk/whatsapp` أو
طبقات المساعدة ذات العلامة الخاصة بالقنوات. ينبغي أن تركّب Plugins المجمعة
المسارات الفرعية العامة لـ SDK داخل حاوياتها `api.ts` أو `runtime-api.ts`،
وينبغي أن تستخدم النواة إما هذه الحاويات المحلية الخاصة بالـ Plugin أو أن تضيف عقدًا عامًا ضيقًا في SDK
عندما تكون الحاجة فعلًا عابرة للقنوات.

لا تزال خريطة التصدير المولّدة تحتوي على مجموعة صغيرة من
طبقات المساعدة الخاصة بالـ Plugin المجمعة مثل `plugin-sdk/feishu` و`plugin-sdk/feishu-setup`
و`plugin-sdk/zalo` و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. هذه
المسارات الفرعية موجودة فقط لصيانة Plugins المجمعة والتوافق؛ وقد تم حذفها عمدًا
من الجدول الشائع أدناه وليست مسار الاستيراد الموصى به لـ Plugins الخارجية الجديدة.

## مرجع المسارات الفرعية

أكثر المسارات الفرعية استخدامًا، مجمعة بحسب الغرض. توجد القائمة الكاملة المولدة التي تضم
أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال المسارات الفرعية المخصصة لمساعدات Plugins المجمعة تظهر في تلك القائمة المولدة.
تعامل معها على أنها تفاصيل تنفيذ/أسطح توافق ما لم تقم صفحة وثائق
بترقية أحدها صراحةً إلى سطح عام.

### إدخال Plugin

| المسار الفرعي                     | التصديرات الأساسية                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات مشتركة لمعالج الإعداد، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات/بوابة إجراءات متعددة الحسابات، ومساعدات fallback للحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + fallback الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة خاصة بقائمة الحساب/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط إعدادات القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق أوامر Telegram المخصصة مع fallback لعقدة مجمعة |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد + الغلاف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل الوارد وإرساله |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الهدف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات هوية الصادر، ومفوّض الإرسال، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة thread-binding والمهايئ |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/الخيط، والاقتران، والربط المكوّن |
    | `plugin-sdk/runtime-config-snapshot` | مساعد snapshot لإعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطات/ملخصات حالة القناة |
    | `plugin-sdk/channel-config-primitives` | بدائيات ضيقة لمخطط إعدادات القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيدية مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تحرير إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لاتخاذ قرار الوصول إلى المجموعة |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة لحماية/مصادقة الرسائل المباشرة |
    | `plugin-sdk/interactive-runtime` | مساعدات تطبيع/تقليل حمولة الرد التفاعلي |
    | `plugin-sdk/channel-inbound` | حاوية توافق لمساعدات inbound debounce، ومطابقة الإشارة، وسياسة الإشارة، ومساعدات الأغلفة |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارة بدون سطح وقت التشغيل الوارد الأوسع |
    | `plugin-sdk/channel-location` | مساعدات سياق موقع القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة لعمليات إسقاط الوارد وفشل typing/ack |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الهدف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزودات">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد المزودات المحلية/المستضافة ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد مزودات مستضافة ذاتيًا ومتوافقة مع OpenAI |
    | `plugin-sdk/cli-backend` | قيم CLI الخلفية الافتراضية + ثوابت watchdog |
    | `plugin-sdk/provider-auth-runtime` | مساعدات وقت التشغيل لحل API-key الخاصة بـ Plugins المزودات |
    | `plugin-sdk/provider-auth-api-key` | مساعدات onboarding/كتابة profile الخاصة بـ API-key مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتائج مصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لـ Plugins المزودات |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات env الخاصة بمصادقة المزود |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبناة replay-policy المشتركة، ومساعدات endpoint الخاصة بالمزود، ومساعدات تطبيع معرّف model مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات HTTP/قدرات endpoint العامة للمزود |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد إعداد/اختيار web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات التسجيل/التخزين المؤقت لمزود web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعداد/بيانات اعتماد web-search للمزودات التي لا تحتاج إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد إعداد/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، وعمليات الضبط/الجلب المقيّدة لبيانات الاعتماد |
    | `plugin-sdk/provider-web-search` | مساعدات التسجيل/التخزين المؤقت/وقت التشغيل لمزود web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات stream، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات النقل الأصلية للمزود مثل fetch المحروس، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات ترقيع إعدادات onboarding |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache المحلية للعملية |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | بُناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل approver ومصادقة الإجراءات داخل المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات profile/filter الأصلية لموافقات exec |
    | `plugin-sdk/approval-delivery-runtime` | محوّلات القدرة/التسليم الأصلية للموافقات |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الخاص بالموافقات |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل محوّل الموافقات الأصلي لنقاط دخول القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقات؛ فضّل طبقات المحوّل/Gateway الأضيق عندما تكفي |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد الموافقة الخاصة بـ exec/Plugin |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية + مساعدات الهدف الأصلي للجلسة |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-surface` | تطبيع جسم الأمر ومساعدات سطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقد الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وأنواع SecretRef لتحليل عقد الأسرار/الإعدادات |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وتقييد الرسائل الخاصة، والمحتوى الخارجي، وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات قائمة سماح المضيف وسياسة SSRF للشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة لـ pinned-dispatcher بدون سطح وقت تشغيل البنية الأوسع |
    | `plugin-sdk/ssrf-runtime` | مساعدات pinned-dispatcher وfetch المحمي بـ SSRF وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم جسم الطلب/المهلة |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugin |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، وlogger، والمهلة، وإعادة المحاولة، والتراجع |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل والبحث عن سياق وقت تشغيل القناة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/HTTP/تفاعل Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وترقيع حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة الإعدادات |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أوامر Telegram وفحوصات التكرار/التعارض، حتى عندما لا يكون سطح عقد Telegram المجمّع متاحًا |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات بدون حاوية text-runtime الأوسع |
    | `plugin-sdk/approval-runtime` | مساعدات موافقات exec/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/profile، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتجزئة، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الرد ضمن نافذة قصيرة مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتجزئة النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات دليل الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة/ربط الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، والقيم الافتراضية لحالة وقت التشغيل، ومساعدات بيانات المشكلة الوصفية |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لمحلّل الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/string |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر موقّت مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات param شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأدوات |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات logger الخاصة بالأنظمة الفرعية والإخفاء |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات file-lock قابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات تخزين dedupe مدعوم بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل ACP/الجلسة وإرسال الرد |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط بدون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | بدائيات ضيقة لمخطط إعدادات وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ param مرن للقيم المنطقية |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات bootstrap للجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | بدائيات مساعدة مشتركة للقناة السلبية، والحالة، والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات أوامر `/models`/ردود المزود |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات السجل/البناء/التسلسل للأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ Plugin الموثوقة من أجل agent harnesses منخفضة المستوى: أنواع harness، ومساعدات steer/abort للتشغيل النشط، ومساعدات جسر أدوات OpenClaw، وأدوات نتائج المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف endpoint لـ Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة التخزين المؤقت المحدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات أعلام وأحداث التشخيص |
    | `plugin-sdk/error-runtime` | الرسم البياني للأخطاء، والتنسيق، ومساعدات تصنيف الأخطاء المشتركة، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلف، والوكيل، والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل مع مراعاة dispatcher بدون استيراد proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة بدون سطح media runtime الأوسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية بدون توجيه الربط المكوّن أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسة بدون استيرادات واسعة لكتابة/صيانة الإعدادات |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وترشيح السياق الإضافي بدون استيرادات واسعة للإعدادات/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لإجبار/تطبيع السجلات البدائية/النصوص بدون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات اسم المضيف وتطبيع مضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعدادات إعادة المحاولة ومشغّل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل الوكيل/الهوية/مساحة العمل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الأدلة المدعوم بالإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولات الوسائط |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للفشل الاحتياطي في إنشاء الوسائط، واختيار المرشحين، ورسائل غياب model |
    | `plugin-sdk/media-understanding` | أنواع مزودات فهم الوسائط بالإضافة إلى تصديرات مساعدات الصور/الصوت الموجّهة للمزود |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تجزئة/جداول Markdown، ومساعدات الإخفاء، ومساعدات وسوم التوجيهات، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تجزئة النص الصادر |
    | `plugin-sdk/speech` | أنواع مزودات الكلام بالإضافة إلى مساعدات التوجيهات، والسجل، والتحقق الموجّهة للمزود |
    | `plugin-sdk/speech-core` | مساعدات مشتركة لأنواع مزودات الكلام، والسجل، والتوجيهات، والتطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع مزودات النسخ الفوري ومساعدات السجل |
    | `plugin-sdk/realtime-voice` | أنواع مزودات الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزودات توليد الصور |
    | `plugin-sdk/image-generation-core` | مساعدات مشتركة لأنواع توليد الصور، والفشل الاحتياطي، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع مزودات/طلبات/نتائج توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | مساعدات مشتركة لأنواع توليد الموسيقى، ومساعدات الفشل الاحتياطي، والبحث عن المزود، وتحليل مراجع model |
    | `plugin-sdk/video-generation` | أنواع مزودات/طلبات/نتائج توليد الفيديو |
    | `plugin-sdk/video-generation-core` | مساعدات مشتركة لأنواع توليد الفيديو، ومساعدات الفشل الاحتياطي، والبحث عن المزود، وتحليل مراجع model |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | التصديرات الأساسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعدات memory-core المجمّع لمدير/إعدادات/ملفات/مساعدات CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت التشغيل لفهرس/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | تصديرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود embedding لمضيف الذاكرة، والوصول إلى السجل، والمزود المحلي، ومساعدات الدُفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | تصديرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | تصديرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعددة الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات الحالة لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمزوّد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمزوّد لمساعدات سجل الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد للمزوّد لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown المشتركة لـ Plugins القريبة من الذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد للمزوّد لمساعدات الحالة لمضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعدات memory-lancedb المجمّع |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة لمساعدات الحزم المجمعة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin المتصفح المجمّعة (`browser-support` يبقى حاوية التوافق) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح المساعدات/وقت التشغيل المجمّع لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح المساعدات/وقت التشغيل المجمّع لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح المساعدات المجمّع لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | طبقات التوافق/المساعدات الخاصة بالقنوات المجمعة |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | طبقات المساعدات الخاصة بالميزات/Plugins المجمعة؛ ويقوم `plugin-sdk/github-copilot-token` حاليًا بتصدير `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API التسجيل

تتلقى دالة الاستدعاء `register(api)` كائن `OpenClawPluginApi` يحتوي على هذه
الطرائق:

### تسجيل القدرات

| الطريقة                                           | ما الذي تسجله                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | الاستدلال النصي (LLM)                  |
| `api.registerAgentHarness(...)`                  | منفّذ وكيل منخفض المستوى تجريبي |
| `api.registerCliBackend(...)`                    | واجهة CLI خلفية محلية للاستدلال           |
| `api.registerChannel(...)`                       | قناة مراسلة                     |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / توليف STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري مباشر      |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت فورية ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو            |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                      |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                      |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                      |
| `api.registerWebFetchProvider(...)`              | مزود جلب / استخراج الويب           |
| `api.registerWebSearchProvider(...)`             | بحث الويب                            |

### الأدوات والأوامر

| الطريقة                          | ما الذي تسجله                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`) |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)             |

### البنية التحتية

| الطريقة                                         | ما الذي تسجله                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف حدث                              |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | طريقة RPC في Gateway                      |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                          |
| `api.registerService(service)`                 | خدمة خلفية                      |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                     |
| `api.registerMemoryPromptSupplement(builder)`  | قسم إضافي قريب من الذاكرة في prompt |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus إضافي لبحث/قراءة الذاكرة      |

تظل نطاقات الإدارة الأساسية المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) دائمًا `operator.admin`، حتى لو حاول Plugin تعيين
نطاق أضيق لطريقة Gateway. فضّل البوادئ الخاصة بالـ Plugin
للطرائق المملوكة للـ Plugin.

### بيانات تعريف تسجيل CLI

تقبل `api.registerCli(registrar, opts?)` نوعين من بيانات التعريف العليا:

- `commands`: جذور أوامر صريحة يملكها المسجّل
- `descriptors`: واصفات أوامر في وقت التحليل تُستخدم لمساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الكسول للـ Plugin

إذا كنت تريد أن يبقى أمر Plugin محمّلًا بشكل كسول في مسار CLI الجذري العادي،
فقدّم `descriptors` تغطي كل جذر أمر من المستوى الأعلى يكشفه ذلك
المسجّل.

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
        description: "إدارة حسابات Matrix، والتحقق، والأجهزة، وحالة profile",
        hasSubcommands: true,
      },
    ],
  },
);
```

استخدم `commands` وحدها فقط عندما لا تحتاج إلى تسجيل CLI كسول في الجذر.
لا يزال مسار التوافق eager هذا مدعومًا، لكنه لا يثبّت
عناصر نائبة مدعومة بـ descriptor من أجل التحميل الكسول وقت التحليل.

### تسجيل الواجهة الخلفية لـ CLI

تتيح `api.registerCliBackend(...)` للـ Plugin امتلاك الإعدادات الافتراضية لواجهة
CLI خلفية محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالواجهة الخلفية بادئة المزوّد في مراجع model مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالواجهة الخلفية الشكل نفسه المستخدم في `agents.defaults.cliBackends.<id>`.
- تظل إعدادات المستخدم هي الحاكمة. يدمج OpenClaw القيمة `agents.defaults.cliBackends.<id>` فوق
  القيمة الافتراضية للـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج الواجهة الخلفية إلى إعادة كتابة توافقية بعد الدمج
  (على سبيل المثال، تطبيع أشكال flags القديمة).

### الخانات الحصرية

| الطريقة                                     | ما الذي تسجله                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد نشط في كل مرة). تتلقى دالة `assemble()` القيمتين `availableTools` و`citationsMode` بحيث يستطيع المحرك تخصيص إضافات prompt. |
| `api.registerMemoryCapability(capability)` | قدرة الذاكرة الموحدة                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | باني قسم prompt الخاص بالذاكرة                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                                    |

### مهايئات embedding للذاكرة

| الطريقة                                         | ما الذي تسجله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ embedding للذاكرة للـ Plugin النشط |

- `registerMemoryCapability` هي API المفضلة والحصرية الخاصة بـ Plugin الذاكرة.
- يمكن لـ `registerMemoryCapability` أيضًا كشف `publicArtifacts.listArtifacts(...)`
  بحيث تتمكن Plugins المصاحبة من استهلاك عناصر الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى
  التخطيط الخاص الداخلي لـ Plugin ذاكرة معيّنة.
- تمثل `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` واجهات API قديمة متوافقة خاصة بـ Plugin الذاكرة.
- تتيح `registerMemoryEmbeddingProvider` لـ Plugin الذاكرة النشط تسجيل
  معرّف أو أكثر من مهايئات embedding (مثل `openai` أو `gemini` أو
  معرّف مخصص يعرّفه Plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المهايئات المسجّلة هذه.

### الأحداث ودورة الحياة

| الطريقة                                       | ما الذي تفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة typed          |
| `api.onConversationBindingResolved(handler)` | دالة استدعاء لربط المحادثة |

### دلالات قرار الخطاف

- `before_tool_call`: يُعد إرجاع `{ block: true }` نهائيًا. بمجرد أن يضبطه أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يُعامل إرجاع `{ block: false }` على أنه عدم اتخاذ قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: يُعد إرجاع `{ block: true }` نهائيًا. بمجرد أن يضبطه أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: يُعامل إرجاع `{ block: false }` على أنه عدم اتخاذ قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: يُعد إرجاع `{ handled: true, ... }` نهائيًا. بمجرد أن يعلن أي معالج أنه تولّى الإرسال، يتم تخطي المعالجات ذات الأولوية الأدنى ومسار إرسال النموذج الافتراضي.
- `message_sending`: يُعد إرجاع `{ cancel: true }` نهائيًا. بمجرد أن يضبطه أي معالج، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: يُعامل إرجاع `{ cancel: false }` على أنه عدم اتخاذ قرار (مثل حذف `cancel`)، وليس كتجاوز.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                               |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | الدليل الجذري لـ Plugin (اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | لقطة الإعدادات الحالية (لقطة وقت تشغيل داخل الذاكرة النشطة عند توفرها)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | إعدادات خاصة بالـ Plugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger ذو نطاق محدد (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ ويمثل `"setup-runtime"` نافذة بدء/إعداد خفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار بالنسبة إلى جذر Plugin                                                        |

## اصطلاح الوحدات الداخلية

داخل Plugin الخاصة بك، استخدم ملفات barrel محلية لعمليات الاستيراد الداخلية:

````
my-plugin/
  api.ts            # التصديرات العامة للمستهلكين الخارجيين
  runtime-api.ts    # تصديرات وقت تشغيل داخلية فقط
  index.ts          # نقطة إدخال Plugin
  setup-entry.ts    # إدخال خفيف خاص بالإعداد فقط (اختياري)
````

<Warning>
  لا تستورد Plugin الخاصة بك مطلقًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من شيفرة الإنتاج. وجّه عمليات الاستيراد الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الآن الأسطح العامة للـ Plugin المجمعة والمحملة عبر الواجهة (`api.ts` و`runtime-api.ts`،
و`index.ts` و`setup-entry.ts` وملفات الإدخال العامة المشابهة) لقطة إعدادات
وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم تكن هناك
لقطة وقت تشغيل بعد، فإنها تعود إلى ملف الإعدادات المحلول على القرص.

يمكن لـ Plugins المزودات أيضًا كشف حاوية عقد محلية ضيقة خاصة بالـ Plugin عندما تكون
إحدى المساعدات خاصة بالمزود عمدًا ولا تنتمي بعد إلى مسار فرعي عام في SDK.
المثال المجمّع الحالي: يحتفظ مزود Anthropic بمساعدات Claude stream
داخل طبقة `api.ts` / `contract-api.ts` العامة الخاصة به بدلًا من
ترقية منطق رأس Anthropic beta و`service_tier` إلى عقد عام في
`plugin-sdk/*`.

أمثلة مجمعة حالية أخرى:

- `@openclaw/openai-provider`: يصدّر `api.ts` بُناة المزود،
  ومساعدات model الافتراضي، وبُناة مزودات الوقت الفعلي
- `@openclaw/openrouter-provider`: يصدّر `api.ts` باني المزود بالإضافة إلى
  مساعدات onboarding/config

<Warning>
  يجب على شيفرة الإنتاج الخاصة بالامتدادات أيضًا تجنّب استيرادات
  `openclaw/plugin-sdk/<other-plugin>`. إذا كانت إحدى المساعدات مشتركة فعلًا، فقم بترقيتها إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه بالقدرات بدلًا من ربط Plugins معًا.
</Warning>

## ذو صلة

- [نقاط الإدخال](/plugins/sdk-entrypoints) — خيارات `definePluginEntry` و`defineChannelPluginEntry`
- [مساعدات وقت التشغيل](/plugins/sdk-runtime) — المرجع الكامل لمساحة الأسماء `api.runtime`
- [الإعدادات والتكوين](/ar/plugins/sdk-setup) — التغليف، وmanifests، ومخططات الإعدادات
- [الاختبار](/ar/plugins/sdk-testing) — أدوات الاختبار وقواعد lint
- [ترحيل SDK](/ar/plugins/sdk-migration) — الترحيل من الأسطح المهجورة
- [الداخلية الخاصة بالـ Plugin](/ar/plugins/architecture) — المعمارية العميقة ونموذج القدرات
