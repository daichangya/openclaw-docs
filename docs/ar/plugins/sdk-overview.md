---
read_when:
    - تحتاج إلى معرفة أي مسار فرعي من SDK يجب الاستيراد منه
    - تريد مرجعًا لجميع أساليب التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد في SDK
sidebarTitle: SDK Overview
summary: مرجع Import map وواجهة برمجة تطبيقات التسجيل وبنية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-18T07:15:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05d3d0022cca32d29c76f6cea01cdf4f88ac69ef0ef3d7fb8a60fbf9a6b9b331
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# نظرة عامة على Plugin SDK

يمثل Plugin SDK العقد المطبوع بين Plugins والنواة. وهذه الصفحة هي
المرجع الخاص بـ **ما الذي يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  **هل تبحث عن دليل إرشادي؟**
  - أول Plugin؟ ابدأ من [البدء](/ar/plugins/building-plugins)
  - Plugin قناة؟ راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  - Plugin موفّر؟ راجع [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins)
</Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة بذاتها. وهذا يحافظ على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. وبالنسبة إلى مساعدات إدخال/بناء القنوات الخاصة،
فإن المسار المفضل هو `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core` من أجل
السطح الأشمل الجامع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

لا تضف أو تعتمد على طبقات تسهيلية مسماة باسم الموفّر مثل
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`، أو
طبقات مساعدة موسومة باسم القناة. يجب أن تقوم Plugins المجمّعة بتركيب
المسارات الفرعية العامة لـ SDK داخل ملفات `api.ts` أو `runtime-api.ts` الخاصة بها، ويجب على النواة
إما استخدام هذه الملفات المحلية الخاصة بالـ Plugin أو إضافة عقد SDK عام ضيق
عندما تكون الحاجة فعلًا عابرة للقنوات.

لا تزال خريطة التصدير المولدة تحتوي على مجموعة صغيرة من
طبقات المساعدة الخاصة بالـ Plugins المجمّعة مثل `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, و `plugin-sdk/matrix*`. هذه
المسارات الفرعية موجودة فقط لصيانة Plugins المجمّعة والتوافق؛ وهي
مستبعدة عمدًا من الجدول الشائع أدناه وليست مسار الاستيراد الموصى به
لـ Plugins الخارجية الجديدة.

## مرجع المسارات الفرعية

أكثر المسارات الفرعية استخدامًا، مجمعة حسب الغرض. وتوجد القائمة الكاملة المولدة التي تضم
أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال المسارات الفرعية المحجوزة لمساعدات Plugins المجمّعة تظهر في تلك القائمة المولدة.
تعامل معها على أنها تفاصيل تنفيذ/أسطح توافق ما لم تقم صفحة توثيق
بترقية أحدها صراحةً إلى سطح عام.

### إدخال Plugin

| Subpath                     | Key exports                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، ومنشئات حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات/بوابة إجراءات متعددة الحسابات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | البحث عن الحساب + مساعدات الرجوع إلى الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط إعدادات القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة لـ Telegram مع الرجوع إلى العقد المجمّع |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء المسار الوارد + الغلاف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل الوارد وإرساله |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات هوية/إرسال الصادر |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | دورة حياة ربط الخيوط ومساعدات المهايئ |
    | `plugin-sdk/agent-media-payload` | منشئ حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/ربط الخيوط، والاقتران، والربط المهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة لملخص/لقطة حالة القناة |
    | `plugin-sdk/channel-config-primitives` | العناصر الأولية الضيقة لمخطط إعدادات القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات تمهيد Plugin القناة المشتركة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تعديل إعدادات قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات وصول المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة لمصادقة/حماية الرسائل المباشرة |
    | `plugin-sdk/interactive-runtime` | مساعدات تطبيع/اختزال حمولة الرد التفاعلي |
    | `plugin-sdk/channel-inbound` | حاوية توافق لمساعدات إزالة ارتداد الوارد، ومطابقة الإشارة، ومساعدات سياسة الإشارة، ومساعدات الغلاف |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارة من دون سطح وقت التشغيل الوارد الأوسع |
    | `plugin-sdk/channel-location` | سياق موقع القناة ومساعدات التنسيق |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة لحالات إسقاط الوارد وإخفاقات الكتابة/التأكيد |
    | `plugin-sdk/channel-send-result` | أنواع نتيجة الرد |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل التغذية الراجعة/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للموفّرين">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد الموفّرين المحليين/المستضافين ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد موفّرين مستضافين ذاتيًا متوافقين مع OpenAI |
    | `plugin-sdk/cli-backend` | افتراضيات CLI backend + ثوابت watchdog |
    | `plugin-sdk/provider-auth-runtime` | مساعدات وقت التشغيل لحل مفاتيح API في Plugins الموفّرين |
    | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد/كتابة ملفات تعريف مفاتيح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | منشئ موحد لنتيجة مصادقة OAuth |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لـ Plugins الموفّرين |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة لمصادقة الموفّر |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، ومنشئات سياسة الإعادة المشتركة، ومساعدات نقاط نهاية الموفّر، ومساعدات تطبيع معرّفات النماذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقطة النهاية الخاصة بالموفّر |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد إعدادات/اختيار web-fetch مثل `enablePluginInConfig` و `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت لموفّر web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعدادات/بيانات اعتماد web-search للموفّرين الذين لا يحتاجون إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد إعدادات/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، وواضعات/قارئات بيانات اعتماد ذات نطاق محدد |
    | `plugin-sdk/provider-web-search` | مساعدات وقت التشغيل/التسجيل/التخزين المؤقت لموفّر web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات التدفق، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | مساعدات تصحيح إعدادات الإعداد الأولي |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache محلية على مستوى العملية |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تفويض المُرسِل |
    | `plugin-sdk/command-status` | منشئات رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل الموافقين ومصادقة الإجراءات داخل الدردشة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات تعريف/تصفية موافقات التنفيذ الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات قدرات/تسليم الموافقات الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل Gateway الخاص بالموافقات |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئات الموافقات الأصلية لنقاط إدخال القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقات؛ فضّل طبقات المهايئ/‏Gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقات + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد موافقات التنفيذ/Plugin |
    | `plugin-sdk/command-auth-native` | مساعدات مصادقة الأوامر الأصلية + هدف الجلسة الأصلي |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-surface` | مساعدات تطبيع جسم الأمر وسطح الأمر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لتجميع عقود الأسرار لأسطح أسرار القنوات/Plugins |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وأنواع SecretRef لتحليل عقود الأسرار/الإعدادات |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل المباشرة، والمحتوى الخارجي، وتجميع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF الخاصة بقائمة سماح المضيف والشبكة الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة لـ pinned-dispatcher من دون سطح وقت تشغيل البنية الأوسع |
    | `plugin-sdk/ssrf-runtime` | مساعدات pinned-dispatcher وfetch المحمي بـ SSRF وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل مدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلب/هدف Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم جسم الطلب/المهلة |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugins |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، والمسجل، والمهلة، وإعادة المحاولة، والتراجع التدريجي |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة للأوامر/الخطافات/HTTP/التفاعل الخاصة بالـ Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخطافات Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و `createLazyRuntimeMethod` و `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وتصحيح حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة الإعدادات |
    | `plugin-sdk/telegram-command-config` | تطبيع اسم/وصف أوامر Telegram والتحقق من التكرار/التعارض، حتى عندما لا يكون سطح عقد Telegram المجمّع متاحًا |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات من دون حاوية text-runtime الأوسع |
    | `plugin-sdk/approval-runtime` | مساعدات موافقات التنفيذ/Plugin، ومنشئات قدرات الموافقة، ومساعدات المصادقة/الملف التعريفي، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتقسيم، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و `recordPendingHistoryEntry` و `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتقسيم النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسة + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات الحالة/دليل OAuth |
    | `plugin-sdk/routing` | مساعدات ربط المسار/مفتاح الجلسة/الحساب مثل `resolveAgentRoute` و `buildAgentSessionKey` و `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، وافتراضيات حالة وقت التشغيل، ومساعدات بيانات تعريف المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر موقّت مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات المعلمات الشائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات مسجل النظام الفرعي وإخفاء البيانات الحساسة |
    | `plugin-sdk/markdown-table-runtime` | مساعدات أوضاع جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل الملفات القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة التخزين المؤقت لإزالة التكرار المعتمدة على القرص |
    | `plugin-sdk/acp-runtime` | مساعدات ACP لوقت التشغيل/الجلسة وإرسال الردود |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | عناصر أولية ضيقة لمخطط إعدادات وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ مرن لمعلمات boolean |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطِرة |
    | `plugin-sdk/device-bootstrap` | مساعدات التمهيد للجهاز ورمز الاقتران |
    | `plugin-sdk/extension-shared` | عناصر أولية مشتركة لمساعدات القنوات السلبية والحالة والوكيل المحيط |
    | `plugin-sdk/models-provider-runtime` | مساعدات الرد الخاصة بالأمر `/models`/الموفّر |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات بناء/تسلسل/سجل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي لـ Plugin موثوق للحزم منخفضة المستوى الخاصة بالوكيل: أنواع الحزم، ومساعدات توجيه/إيقاف التشغيل النشط، ومساعدات جسر أدوات OpenClaw، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقاط نهاية Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات العلامات والأحداث التشخيصية |
    | `plugin-sdk/error-runtime` | مساعدات مخطط الأخطاء والتنسيق وتصنيف الأخطاء المشتركة، و `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch الملتفة والوكيل والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | fetch خاص بوقت التشغيل ومدرك للـ dispatcher من دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لجسم الاستجابة من دون سطح وقت تشغيل الوسائط الأوسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المهيأ أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسة من دون استيرادات واسعة لكتابة/صيانة الإعدادات |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وتصفية السياق الإضافي من دون استيرادات إعدادات/أمان واسعة |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لإجبار/تطبيع السجلات البدائية والسلاسل من دون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف ومضيف SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعدادات إعادة المحاولة ومشغّل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل الوكيل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الأدلة المعتمد على الإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى منشئات حمولة الوسائط |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتعامل مع الإخفاق البديل في توليد الوسائط، واختيار المرشحين، ورسائل النماذج المفقودة |
    | `plugin-sdk/media-understanding` | أنواع موفّري فهم الوسائط بالإضافة إلى تصديرات المساعدات الخاصة بالصور/الصوت للموجّهة إلى الموفّرين |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تقسيم/جداول Markdown، ومساعدات إخفاء البيانات الحساسة، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع موفّري الكلام بالإضافة إلى المساعدات الخاصة بالموجّهة إلى الموفّرين للتوجيه والسجل والتحقق |
    | `plugin-sdk/speech-core` | مساعدات مشتركة لأنواع موفّري الكلام والسجل والتوجيه والتطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع موفّري النسخ الفوري ومساعدات السجل |
    | `plugin-sdk/realtime-voice` | أنواع موفّري الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع موفّري توليد الصور |
    | `plugin-sdk/image-generation-core` | مساعدات مشتركة لأنواع توليد الصور، والإخفاق البديل، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع موفّر/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | مساعدات مشتركة لأنواع توليد الموسيقى، والإخفاق البديل، والبحث عن الموفّر، وتحليل مرجع النموذج |
    | `plugin-sdk/video-generation` | أنواع موفّر/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | مساعدات مشتركة لأنواع توليد الفيديو، والإخفاق البديل، والبحث عن الموفّر، وتحليل مرجع النموذج |
    | `plugin-sdk/webhook-targets` | مساعدات سجل أهداف Webhook وتثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد memory-core المجمّع لمساعدات المدير/الإعدادات/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت التشغيل لفهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | تصديرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والموفّر المحلي، والمساعدات العامة للدُفعات/البعيد |
    | `plugin-sdk/memory-core-host-engine-qmd` | تصديرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | تصديرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات الوسائط المتعددة لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل مستقل عن المورّد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل مستقل عن المورّد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل مستقل عن المورّد لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown المشتركة للـ Plugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل مستقل عن المورّد لمساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعد memory-lancedb المجمّع |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المجمّعة">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin Browser المجمّع (`browser-support` تبقى حاوية التوافق) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح المساعد/وقت التشغيل المجمّع لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح المساعد/وقت التشغيل المجمّع لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح المساعد المجمّع لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | طبقات توافق/مساعدة القنوات المجمّعة |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | طبقات مساعدات الميزات/Plugins المجمّعة؛ يصدّر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL` و `deriveCopilotApiBaseUrlFromToken` و `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## واجهة برمجة تطبيقات التسجيل

يتلقى رد النداء `register(api)` كائن `OpenClawPluginApi` بهذه
الأساليب:

### تسجيل القدرات

| Method                                           | What it registers                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | الاستدلال النصي (LLM)                  |
| `api.registerAgentHarness(...)`                  | مُنفّذ وكيل منخفض المستوى تجريبي |
| `api.registerCliBackend(...)`                    | CLI backend محلي للاستدلال           |
| `api.registerChannel(...)`                       | قناة مراسلة                     |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / تركيب STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | النسخ الفوري المتدفق      |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات الصوت الفوري ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو            |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                      |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                      |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                      |
| `api.registerWebFetchProvider(...)`              | موفّر جلب / كشط الويب           |
| `api.registerWebSearchProvider(...)`             | بحث الويب                            |

### الأدوات والأوامر

| Method                          | What it registers                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`) |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)             |

### البنية التحتية

| Method                                         | What it registers                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | خطاف أحداث                              |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP لـ Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | أسلوب Gateway RPC                      |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                          |
| `api.registerService(service)`                 | خدمة في الخلفية                      |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                     |
| `api.registerMemoryPromptSupplement(builder)`  | قسم إضافي في المطالبة مجاور للذاكرة |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus إضافي لبحث/قراءة الذاكرة      |

تظل مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) دائمًا `operator.admin`، حتى إذا حاول Plugin تعيين
نطاق أضيق لأسلوب Gateway. ويفضَّل استخدام بادئات خاصة بالـ Plugin من أجل
الأساليب المملوكة للـ Plugin.

### بيانات تعريف تسجيل CLI

يقبل `api.registerCli(registrar, opts?)` نوعين من بيانات التعريف العليا:

- `commands`: جذور أوامر صريحة يملكها المسجل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة في مساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الكسول للـ Plugin

إذا كنت تريد أن يظل أمر Plugin محمّلًا بشكل كسول في مسار CLI الجذري العادي،
فقدّم `descriptors` تغطي كل جذر أمر علوي يعرّضه ذلك المسجل.

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
        description: "إدارة حسابات Matrix والتحقق والأجهزة وحالة الملف التعريفي",
        hasSubcommands: true,
      },
    ],
  },
);
```

استخدم `commands` بمفرده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
لا يزال مسار التوافق eager هذا مدعومًا، لكنه لا يثبت
عناصر نائبة مدعومة بالواصفات للتحميل الكسول في وقت التحليل.

### تسجيل CLI backend

يتيح `api.registerCliBackend(...)` لـ Plugin امتلاك الإعداد الافتراضي
لـ CLI backend محلي للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالـ backend هو بادئة الموفّر في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالـ backend البنية نفسها الموجودة في `agents.defaults.cliBackends.<id>`.
- يظل إعداد المستخدم هو الغالب. يدمج OpenClaw القيمة `agents.defaults.cliBackends.<id>` فوق
  الإعداد الافتراضي للـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما يحتاج backend إلى إعادة كتابة للتوافق بعد الدمج
  (على سبيل المثال تطبيع أشكال العلامات القديمة).

### الفتحات الحصرية

| Method                                     | What it registers                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد فقط يكون نشطًا في كل مرة). تتلقى دالة `assemble()` الراجعة `availableTools` و `citationsMode` حتى يتمكن المحرك من تفصيل الإضافات إلى المطالبة. |
| `api.registerMemoryCapability(capability)` | قدرة الذاكرة الموحدة                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | منشئ قسم مطالبة الذاكرة                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                                    |

### مهايئات تضمين الذاكرة

| Method                                         | What it registers                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ تضمين الذاكرة للـ Plugin النشط |

- تُعد `registerMemoryCapability` واجهة Plugin الذاكرة الحصرية المفضلة.
- يمكن أيضًا لـ `registerMemoryCapability` كشف `publicArtifacts.listArtifacts(...)`
  حتى تتمكن Plugins المصاحبة من استهلاك عناصر الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى تخطيط خاص
  لـ Plugin ذاكرة محدد.
- تُعد `registerMemoryPromptSection` و `registerMemoryFlushPlan` و
  `registerMemoryRuntime` واجهات Plugin ذاكرة حصرية متوافقة مع الإصدارات القديمة.
- تتيح `registerMemoryEmbeddingProvider` للـ Plugin النشط للذاكرة تسجيل
  معرّف مهايئ تضمين واحد أو أكثر (مثل `openai` أو `gemini` أو معرّف مخصص
  يعرّفه Plugin).
- تُحل إعدادات المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` وفقًا لمعرّفات المهايئات المسجلة هذه.

### الأحداث ودورة الحياة

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | خطاف دورة حياة مطبوع          |
| `api.onConversationBindingResolved(handler)` | رد نداء ربط المحادثة |

### دلالات قرار الخطاف

- `before_tool_call`: تؤدي إعادة `{ block: true }` إلى إنهاء المعالجة. وبمجرد أن يضبط أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل إعادة `{ block: false }` على أنها عدم اتخاذ قرار (مثل حذف `block`)، وليس كتجاوز.
- `before_install`: تؤدي إعادة `{ block: true }` إلى إنهاء المعالجة. وبمجرد أن يضبط أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل إعادة `{ block: false }` على أنها عدم اتخاذ قرار (مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: تؤدي إعادة `{ handled: true, ... }` إلى إنهاء المعالجة. وبمجرد أن يطالب أي معالج بعملية الإرسال، يتم تخطي المعالجات ذات الأولوية الأدنى ومسار إرسال النموذج الافتراضي.
- `message_sending`: تؤدي إعادة `{ cancel: true }` إلى إنهاء المعالجة. وبمجرد أن يضبط أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل إعادة `{ cancel: false }` على أنها عدم اتخاذ قرار (مثل حذف `cancel`)، وليس كتجاوز.

### حقول كائن API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف Plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                |
| `api.version`            | `string?`                 | إصدار Plugin ‏(اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف Plugin ‏(اختياري)                                                               |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                          |
| `api.rootDir`            | `string?`                 | الدليل الجذري للـ Plugin ‏(اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | لقطة الإعدادات الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | إعدادات خاصة بالـ Plugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | مسجل ذو نطاق محدد (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هي نافذة البدء/الإعداد الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبةً إلى جذر Plugin                                                        |

## اصطلاح الوحدة الداخلية

داخل Plugin الخاص بك، استخدم ملفات barrel محلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # التصديرات العامة للمستهلكين الخارجيين
  runtime-api.ts    # تصديرات داخلية فقط لوقت التشغيل
  index.ts          # نقطة إدخال Plugin
  setup-entry.ts    # إدخال خفيف للإعداد فقط (اختياري)
```

<Warning>
  لا تستورد Plugin الخاص بك عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الآن الأسطح العامة لPlugin المجمّع المحمّلة عبر Facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`، وملفات الإدخال العامة المماثلة)
لقطة إعدادات وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم تكن هناك
لقطة وقت تشغيل بعد، فإنها تعود إلى ملف الإعدادات المحلول على القرص.

يمكن Plugins الموفّرين أيضًا كشف ملف contract barrel محلي ضيق خاص بالـ Plugin عندما تكون
إحدى المساعدات خاصة بالموفّر عمدًا ولا تنتمي بعد إلى مسار فرعي عام
في SDK. المثال المجمّع الحالي: يحتفظ موفّر Anthropic بمساعدات تدفق Claude
داخل الطبقة العامة الخاصة به `api.ts` / `contract-api.ts` بدلًا من
ترقية منطق ترويسة Anthropic التجريبية و`service_tier` إلى عقد عام
`plugin-sdk/*`.

أمثلة مجمّعة حالية أخرى:

- `@openclaw/openai-provider`: يصدّر `api.ts` أدوات بناء الموفّر،
  ومساعدات النموذج الافتراضي، وأدوات بناء الموفّر الفوري
- `@openclaw/openrouter-provider`: يصدّر `api.ts` أداة بناء الموفّر بالإضافة إلى
  مساعدات الإعداد الأولي/الإعدادات

<Warning>
  يجب أن يتجنب كود الإنتاج الخاص بالامتداد أيضًا استيراد `openclaw/plugin-sdk/<other-plugin>`.
  إذا كانت إحدى المساعدات مشتركة فعلًا، فقم بترقيتها إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو أي سطح آخر
  موجّه إلى القدرات بدلًا من ربط Pluginين معًا.
</Warning>

## ذو صلة

- [نقاط الإدخال](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry` و `defineChannelPluginEntry`
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) — المرجع الكامل لمساحة الأسماء `api.runtime`
- [الإعداد والإعدادات](/ar/plugins/sdk-setup) — التحزيم، وmanifestات، ومخططات الإعدادات
- [الاختبار](/ar/plugins/sdk-testing) — أدوات الاختبار وقواعد lint
- [ترحيل SDK](/ar/plugins/sdk-migration) — الترحيل من الأسطح المهجورة
- [البنية الداخلية للـ Plugin](/ar/plugins/architecture) — البنية العميقة ونموذج القدرات
