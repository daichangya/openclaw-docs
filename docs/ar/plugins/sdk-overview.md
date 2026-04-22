---
read_when:
    - تحتاج إلى معرفة أي مسار فرعي من SDK يجب الاستيراد منه
    - تريد مرجعًا لجميع أساليب التسجيل في `OpenClawPluginApi`
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: SDK Overview
summary: خريطة الاستيراد، ومرجع واجهة API للتسجيل، وبنية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-22T04:26:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8045c11976bbda6afe3303a0aab08caf0d0a86ebcf1aaaf927943b90cc517673
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# نظرة عامة على Plugin SDK

يُعد Plugin SDK العقد المطبّع بين plugins والنواة. وهذه الصفحة هي
المرجع الخاص بـ **ما يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  **هل تبحث عن دليل إرشادي؟**
  - أول plugin؟ ابدأ من [البدء](/ar/plugins/building-plugins)
  - plugin قناة؟ راجع [Channel Plugins](/ar/plugins/sdk-channel-plugins)
  - plugin مزوّد؟ راجع [Provider Plugins](/ar/plugins/sdk-provider-plugins)
</Tip>

## اصطلاح الاستيراد

استورد دائمًا من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة ومكتفية ذاتيًا. وهذا يحافظ على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. وبالنسبة إلى وسائل المساعدة الخاصة بإدخال/بناء القنوات،
ففضّل `openclaw/plugin-sdk/channel-core`؛ وأبقِ `openclaw/plugin-sdk/core` من أجل
السطح الأشمل والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

لا تُضف أو تعتمد على مسارات convenience seams المسماة باسم المزوّد مثل
`openclaw/plugin-sdk/slack` أو `openclaw/plugin-sdk/discord`،
أو `openclaw/plugin-sdk/signal`، أو `openclaw/plugin-sdk/whatsapp`، أو
المسارات المساعدة ذات العلامة التجارية الخاصة بالقنوات. يجب على plugins المضمّنة أن تركّب
المسارات الفرعية العامة لـ SDK داخل ملفات `api.ts` أو `runtime-api.ts`
الخاصة بها، ويجب على النواة إما استخدام تلك الملفات المحلية الخاصة بالplugin أو إضافة
عقد SDK عامًا ضيقًا عندما تكون الحاجة فعلًا عابرة للقنوات.

ما زالت خريطة التصدير المولدة تحتوي على مجموعة صغيرة من المسارات المساعدة الخاصة بالplugins المضمّنة
مثل `plugin-sdk/feishu`، و`plugin-sdk/feishu-setup`،
و`plugin-sdk/zalo`، و`plugin-sdk/zalo-setup`، و`plugin-sdk/matrix*`. توجد هذه
المسارات الفرعية لصيانة plugins المضمّنة والتوافق فقط؛ وقد تم حذفها عمدًا من الجدول المشترك أدناه
وليست مسار الاستيراد الموصى به للplugins الجديدة التابعة لجهات خارجية.

## مرجع المسارات الفرعية

أكثر المسارات الفرعية استخدامًا، مجمّعة حسب الغرض. وتوجد القائمة الكاملة المولدة
التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`.

ما زالت المسارات الفرعية المساعدة المحجوزة الخاصة بالplugins المضمّنة تظهر في هذه القائمة المولدة.
تعامل معها على أنها تفاصيل تنفيذ/أسطح توافق ما لم تروّج لها صفحة وثائق
صراحةً باعتبارها عامة.

### إدخال Plugin

| المسار الفرعي                     | أهم التصديرات                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID` و`createTopLevelChannelDmPolicy` و`setSetupChannelEnabled` و`splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات تكوين/بوابة الإجراءات متعددة الحسابات، ومساعدات fallback للحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + fallback الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط تكوين القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع fallback لعقد مضمّن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، ومساعدات دورة حياة/finalization الخاصة ببث المسودات |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء التوجيه الداخل + envelope |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل وتوزيع الرسائل الداخلة |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات الهوية الصادرة، ومفوّض الإرسال، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة حياة ارتباطات الخيوط والمهايئات |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات المحادثة/ربط الخيوط، وpairing، والارتباطات المكوّنة |
    | `plugin-sdk/runtime-config-snapshot` | مساعد snapshot لتكوين وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعة في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة لـ snapshot/summary حالة القناة |
    | `plugin-sdk/channel-config-primitives` | العناصر الأولية الضيقة لمخطط تكوين القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة تكوين القناة |
    | `plugin-sdk/channel-plugin-common` | تصديرات المقدمة المشتركة لـ plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات تعديل/قراءة تكوين قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات وصول المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة لمصادقة/حماية الرسائل المباشرة المباشرة |
    | `plugin-sdk/interactive-runtime` | العرض الدلالي للرسائل، والتسليم، ومساعدات الردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | ملف توافق للتعامل مع debounce للواردات، ومطابقة الذكر، ومساعدات سياسة الذكر، ومساعدات envelope |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الذكر من دون السطح الأشمل لوقت تشغيل الواردات |
    | `plugin-sdk/channel-location` | مساعدات سياق الموقع في القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القنوات لحالات إسقاط الواردات وإخفاقات الكتابة/الإقرار |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات المخطط الأصلية المهجورة التي أُبقي عليها من أجل توافق plugin |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | ربط الملاحظات/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقد الأسرار مثل `collectSimpleChannelFieldAssignments` و`getChannelSurface` و`pushAssignment` وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزوّدين">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسّقة لإعداد المزوّدات المحلية/ذاتية الاستضافة |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد مزوّدات ذاتية الاستضافة متوافقة مع OpenAI |
    | `plugin-sdk/cli-backend` | الإعدادات الافتراضية لخلفية CLI + ثوابت watchdog |
    | `plugin-sdk/provider-auth-runtime` | مساعدات حل مفاتيح API في وقت التشغيل لـ plugins المزوّدين |
    | `plugin-sdk/provider-auth-api-key` | مساعدات إعداد/كتابة ملف تعريف مفتاح API مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | الباني القياسي لنتيجة مصادقة OAuth |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لـ plugins المزوّدين |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات بيئة مصادقة المزوّد |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`، و`buildProviderReplayFamilyHooks`، و`normalizeModelCompat`، وبناة سياسة replay المشتركة، ومساعدات نقاط نهاية المزوّد، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات HTTP/قدرات نقاط نهاية المزوّد العامة |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد تكوين/اختيار web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل مزوّد web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لتكوين/بيانات اعتماد web-search للمزوّدات التي لا تحتاج إلى ربط تمكين plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد تكوين/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` وعمليات تعيين/جلب بيانات الاعتماد ضمن النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات تسجيل/تخزين مؤقت/وقت تشغيل مزوّد web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks`، و`composeProviderStreamWrappers`، وأنواع مغلفات stream، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزوّد الأصلية مثل fetch المحمي، وتحويلات رسائل النقل، وتيارات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات patch لتكوين الإعداد الأولي |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache محلية للعملية |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | بُناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل الموافقين ومصادقة الإجراءات داخل الدردشة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملفات تعريف/عوامل تصفية موافقات exec الأصلية |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات القدرة/التسليم الأصلية للموافقات |
    | `plugin-sdk/approval-gateway-runtime` | مساعد مشترك لحل gateway الخاصة بالموافقات |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئات الموافقات الأصلية لنقاط إدخال القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالجات الموافقات؛ فضّل المسارات الأضيق الخاصة بالمهايئ/gateway عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة ردود موافقات exec/plugin |
    | `plugin-sdk/command-auth-native` | مساعدات مصادقة الأوامر الأصلية + أهداف الجلسات الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-surface` | مساعدات تطبيع متن الأوامر وسطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لتجميع عقود الأسرار لأسطح أسرار القنوات/plugins |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وأنواع SecretRef لتحليل عقود الأسرار/التكوين |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وتقييد الرسائل المباشرة، والمحتوى الخارجي، وتجميع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF الخاصة بقائمة سماح المضيفين والشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة لـ pinned-dispatcher من دون السطح الأوسع لوقت تشغيل البنية التحتية |
    | `plugin-sdk/ssrf-runtime` | مساعدات pinned-dispatcher، وfetch المحمي من SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل مدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلبات/أهداف Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم متن الطلب/المهلة |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت plugin |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، وlogger، والمهلة، وإعادة المحاولة، وbackoff |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل والبحث عن سياق وقت تشغيل القناة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/hook/http/التفاعل الخاصة بـ plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI، والانتظار، والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وpatch حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة التكوين |
    | `plugin-sdk/telegram-command-config` | تطبيع أسماء/أوصاف أوامر Telegram والتحقق من التكرار/التعارض، حتى عند عدم توفر سطح عقد Telegram المضمّن |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف autolink لمراجع الملفات من دون ملف text-runtime الواسع |
    | `plugin-sdk/approval-runtime` | مساعدات موافقات exec/plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/الملف التعريفي، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتجزئة، والتوزيع، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لتوزيع/finalize الردود |
    | `plugin-sdk/reply-history` | مساعدات مشتركة قصيرة النافذة لسجل الردود مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتجزئة النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسات + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات أدلة state/OAuth |
    | `plugin-sdk/routing` | مساعدات التوجيه/مفتاح الجلسة/ربط الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخص حالة القناة/الحساب، والقيم الافتراضية لحالة وقت التشغيل، ومساعدات بيانات المشكلات الوصفية |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/string |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر بزمن محدد مع نتائج stdout/stderr مطبّعة |
    | `plugin-sdk/param-readers` | قارئات معلمات مشتركة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات logger للنظام الفرعي والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات أوضاع جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات إعادة الدخول إلى file-lock |
    | `plugin-sdk/persistent-dedupe` | مساعدات cache إزالة التكرار المعتمد على القرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت تشغيل/جلسات ACP وتوزيع الردود |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ارتباط ACP للقراءة فقط من دون استيرادات بدء تشغيل دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | عناصر أولية ضيقة لمخطط تكوين وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ مرن لمعلمات boolean |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات bootstrap الخاصة بالأجهزة وtoken pairing |
    | `plugin-sdk/extension-shared` | عناصر أولية مشتركة للمساعدات الخاصة بالقنوات السلبية، والحالة، وambient proxy |
    | `plugin-sdk/models-provider-runtime` | مساعدات ردود الأمر `/models`/المزوّد |
    | `plugin-sdk/skill-commands-runtime` | مساعدات إدراج أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح موثوق تجريبي لـ plugin من أجل agent harnesses منخفضة المستوى: أنواع harness، ومساعدات توجيه/إلغاء التشغيلات النشطة، ومساعدات جسر أدوات OpenClaw، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقطة نهاية Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات cache صغيرة محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات العلامات التشخيصية والأحداث |
    | `plugin-sdk/error-runtime` | مساعدات رسم الأخطاء، والتنسيق، وتصنيف الأخطاء المشترك، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلف، وproxy، وlookup المثبت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل مدرك لـ dispatcher من دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لمتن الاستجابة من دون السطح الأوسع لوقت تشغيل الوسائط |
    | `plugin-sdk/session-binding-runtime` | حالة ارتباط المحادثة الحالية من دون توجيه الارتباطات المكوّنة أو مخازن pairing |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسات من دون استيرادات واسعة لكتابة/صيانة التكوين |
    | `plugin-sdk/context-visibility-runtime` | حل ظهور السياق وتصفية السياق الإضافي من دون استيرادات واسعة للتكوين/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة للإجبار والتطبيع للسجلات/السلاسل الأولية من دون استيرادات markdown/logging |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف وSCP host |
    | `plugin-sdk/retry-runtime` | مساعدات تكوين إعادة المحاولة ومشغّل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل الوكيل |
    | `plugin-sdk/directory-runtime` | الاستعلام/إزالة التكرار من الدليل المدعوم بالتكوين |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للقدرات والاختبار">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولة الوسائط |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة لـ failover في توليد الوسائط، واختيار المرشحين، ورسائل غياب النموذج |
    | `plugin-sdk/media-understanding` | أنواع مزوّدات فهم الوسائط بالإضافة إلى تصديرات مساعدات الصور/الصوت المواجهة للمزوّد |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تجزئة/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تجزئة النص الصادر |
    | `plugin-sdk/speech` | أنواع مزوّدات الكلام بالإضافة إلى تصديرات المساعدات المواجهة للمزوّد الخاصة بالتوجيه، والسجل، والتحقق |
    | `plugin-sdk/speech-core` | مساعدات مشتركة لأنواع مزوّدات الكلام، والسجل، والتوجيه، والتطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع مزوّدات النسخ الفوري ومساعدات السجل |
    | `plugin-sdk/realtime-voice` | أنواع مزوّدات الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزوّدات توليد الصور |
    | `plugin-sdk/image-generation-core` | مساعدات مشتركة لأنواع توليد الصور، وfailover، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع مزوّد/طلب/نتيجة توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | مساعدات مشتركة لأنواع توليد الموسيقى، ومساعدات failover، والبحث عن المزوّد، وتحليل model-ref |
    | `plugin-sdk/video-generation` | أنواع مزوّد/طلب/نتيجة توليد الفيديو |
    | `plugin-sdk/video-generation-core` | مساعدات مشتركة لأنواع توليد الفيديو، ومساعدات failover، والبحث عن المزوّد، وتحليل model-ref |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | أهم التصديرات |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح المساعدات المضمّن memory-core لمساعدات المدير/التكوين/الملف/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | تصديرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود embeddings الخاصة بمضيف الذاكرة، والوصول إلى السجل، والمزوّد المحلي، والمساعدات العامة للدفعات/البعيد |
    | `plugin-sdk/memory-core-host-engine-qmd` | تصديرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | تصديرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات الوسائط المتعددة لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات دفتر يوميات الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات الحالة لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم مستعار محايد للبائع لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم مستعار محايد للبائع لمساعدات دفتر يوميات الأحداث لمضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم مستعار محايد للبائع لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات managed-markdown المشتركة للplugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم مستعار محايد للبائع لمساعدات الحالة لمضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح المساعدات المضمّن memory-lancedb |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمّنة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Browser plugin المضمّن (`browser-support` يظل ملف التوافق) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح المساعدات/وقت التشغيل المضمّن لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح المساعدات/وقت التشغيل المضمّن لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح المساعدات المضمّن لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | seams التوافق/المساعدات الخاصة بالقنوات المضمّنة |
    | مساعدات خاصة بالمصادقة/الplugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | seams مساعدات الميزات/الplugins المضمّنة؛ يصدّر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## واجهة API للتسجيل

تتلقى دالة callback ‏`register(api)` كائن `OpenClawPluginApi` بهذه
الأساليب:

### تسجيل القدرات

| الأسلوب                                           | ما الذي يسجّله                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | الاستدلال النصي (LLM)                  |
| `api.registerAgentHarness(...)`                  | منفّذ وكيل منخفض المستوى تجريبي |
| `api.registerCliBackend(...)`                    | خلفية استدلال CLI محلية           |
| `api.registerChannel(...)`                       | قناة مراسلة                     |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / توليف STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري متدفق      |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوتية فورية ثنائية الاتجاه        |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو            |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                      |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                      |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                      |
| `api.registerWebFetchProvider(...)`              | مزوّد Web fetch / scrape           |
| `api.registerWebSearchProvider(...)`             | بحث الويب                            |

### الأدوات والأوامر

| الأسلوب                          | ما الذي يسجّله                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`) |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)             |

### البنية التحتية

| الأسلوب                                         | ما الذي يسجّله                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook حدث                              |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP في Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | أسلوب RPC في Gateway                      |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                          |
| `api.registerService(service)`                 | خدمة خلفية                      |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                     |
| `api.registerMemoryPromptSupplement(builder)`  | قسم prompt إضافي مجاور للذاكرة |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus إضافي لبحث/قراءة الذاكرة      |

تظل مساحات أسماء الإدارة الأساسية المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*`،
و`update.*`) دائمًا ضمن `operator.admin`، حتى لو حاول plugin تعيين
نطاق أضيق لأسلوب gateway. وفضّل البوادئ الخاصة بالplugin من أجل
الأساليب المملوكة لـ plugin.

### بيانات تسجيل CLI الوصفية

يقبل `api.registerCli(registrar, opts?)` نوعين من البيانات الوصفية ذات المستوى الأعلى:

- `commands`: جذور أوامر صريحة يملكها المسجل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة من أجل مساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الكسول للplugin

إذا كنت تريد أن يظل أمر plugin محمّلًا بكسل في مسار CLI الجذري العادي،
فقدّم `descriptors` تغطي كل جذر أمر من المستوى الأعلى يكشفه هذا
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
        description: "إدارة حسابات Matrix، والتحقق، والأجهزة، وحالة الملف الشخصي",
        hasSubcommands: true,
      },
    ],
  },
);
```

استخدم `commands` وحده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
ما يزال مسار التوافق الفوري هذا مدعومًا، لكنه لا يثبت
عناصر نائبة مدعومة بـ descriptor من أجل التحميل الكسول وقت التحليل.

### تسجيل خلفية CLI

يتيح `api.registerCliBackend(...)` لـ plugin امتلاك التكوين الافتراضي لخلفية
CLI محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالخلفية بادئة المزوّد في مراجع النماذج مثل `codex-cli/gpt-5`.
- يستخدم `config` الخاص بالخلفية البنية نفسها لـ `agents.defaults.cliBackends.<id>`.
- يظل تكوين المستخدم هو الفائز. يدمج OpenClaw القيمة `agents.defaults.cliBackends.<id>` فوق
  القيمة الافتراضية للplugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج الخلفية إلى عمليات إعادة كتابة توافقية بعد الدمج
  (على سبيل المثال، تطبيع أشكال العلامات القديمة).

### المنافذ الحصرية

| الأسلوب                                     | ما الذي يسجّله                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك السياق (واحد نشط في كل مرة). تتلقى دالة callback ‏`assemble()` القيمتين `availableTools` و`citationsMode` بحيث يمكن للمحرك تخصيص الإضافات إلى prompt. |
| `api.registerMemoryCapability(capability)` | قدرة ذاكرة موحّدة                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | باني قسم prompt للذاكرة                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة flush للذاكرة                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                                    |

### مهايئات embedding الخاصة بالذاكرة

| الأسلوب                                         | ما الذي يسجّله                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ embedding للذاكرة من أجل plugin النشط |

- تُعد `registerMemoryCapability` واجهة API الحصرية المفضلة لـ plugin الذاكرة.
- قد تكشف `registerMemoryCapability` أيضًا عن `publicArtifacts.listArtifacts(...)`
  بحيث تتمكن plugins المصاحبة من استهلاك عناصر الذاكرة المُصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى التخطيط الخاص
  الداخلي لـ plugin ذاكرة محدد.
- تُعد `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` واجهات API حصرية متوافقة مع الإصدارات القديمة لـ plugins الذاكرة.
- تتيح `registerMemoryEmbeddingProvider` لـ plugin الذاكرة النشط تسجيل
  معرّف embedding واحد أو أكثر (على سبيل المثال `openai` أو `gemini` أو
  معرّف مخصص يحدده plugin).
- يتم حل تكوين المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المهايئات المسجلة تلك.

### الأحداث ودورة الحياة

| الأسلوب                                       | ما الذي يفعله                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | hook دورة حياة مطبّع          |
| `api.onConversationBindingResolved(handler)` | callback لحل ارتباط المحادثة |

### دلالات قرارات hook

- `before_tool_call`: تؤدي إعادة `{ block: true }` إلى قرار نهائي. وبمجرد أن يعيّن أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_tool_call`: تُعامل إعادة `{ block: false }` على أنها عدم وجود قرار (مثلها مثل حذف `block`)، وليس كتجاوز.
- `before_install`: تؤدي إعادة `{ block: true }` إلى قرار نهائي. وبمجرد أن يعيّن أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_install`: تُعامل إعادة `{ block: false }` على أنها عدم وجود قرار (مثلها مثل حذف `block`)، وليس كتجاوز.
- `reply_dispatch`: تؤدي إعادة `{ handled: true, ... }` إلى قرار نهائي. وبمجرد أن يدّعي أي معالج التوزيع، يتم تخطي المعالجات ذات الأولوية الأقل ومسار توزيع النموذج الافتراضي.
- `message_sending`: تؤدي إعادة `{ cancel: true }` إلى قرار نهائي. وبمجرد أن يعيّن أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأقل.
- `message_sending`: تُعامل إعادة `{ cancel: false }` على أنها عدم وجود قرار (مثلها مثل حذف `cancel`)، وليس كتجاوز.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | معرّف plugin                                                                                   |
| `api.name`               | `string`                  | اسم العرض                                                                                |
| `api.version`            | `string?`                 | إصدار plugin (اختياري)                                                                   |
| `api.description`        | `string?`                 | وصف plugin (اختياري)                                                               |
| `api.source`             | `string`                  | مسار مصدر plugin                                                                          |
| `api.rootDir`            | `string?`                 | الدليل الجذري لـ plugin (اختياري)                                                            |
| `api.config`             | `OpenClawConfig`          | snapshot التكوين الحالي (snapshot وقت التشغيل النشط في الذاكرة عند توفره)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | التكوين الخاص بـ plugin من `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | logger ضمن النطاق (`debug` و`info` و`warn` و`error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ وتمثل `"setup-runtime"` نافذة بدء التشغيل/الإعداد الخفيفة قبل الإدخال الكامل |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبةً إلى جذر plugin                                                        |

## اصطلاح الوحدات الداخلية

داخل plugin الخاص بك، استخدم ملفات barrel محلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # تصديرات عامة للمستهلكين الخارجيين
  runtime-api.ts    # تصديرات وقت تشغيل داخلية فقط
  index.ts          # نقطة إدخال plugin
  setup-entry.ts    # إدخال خفيف خاص بالإعداد فقط (اختياري)
```

<Warning>
  لا تستورد plugin الخاص بك أبدًا عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. فمسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الآن الأسطح العامة للplugins المضمّنة المحمّلة عبر الواجهة (`api.ts` و`runtime-api.ts`،
و`index.ts`، و`setup-entry.ts`، وملفات الإدخال العامة المماثلة)
snapshot التكوين النشط لوقت التشغيل عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم توجد
snapshot لوقت التشغيل بعد، فإنها تعود إلى ملف التكوين المحلول على القرص.

يمكن لplugins المزوّدين أيضًا كشف barrel عقد محلي ضيق خاص بالplugin عندما تكون مساعدة ما
مقصودة بوصفها خاصة بالمزوّد ولا تنتمي بعد إلى مسار فرعي عام في SDK.
المثال المضمّن الحالي: يحتفظ مزوّد Anthropic بمساعدات Claude stream الخاصة به
داخل seam عام خاص به في `api.ts` / `contract-api.ts` بدلًا من
ترقية منطق رؤوس Anthropic beta و`service_tier` إلى عقد عام
`plugin-sdk/*`.

أمثلة مضمّنة حالية أخرى:

- `@openclaw/openai-provider`: يصدّر `api.ts` بُناة المزوّد،
  ومساعدات النموذج الافتراضي، وبُناة المزوّد الفوري
- `@openclaw/openrouter-provider`: يصدّر `api.ts` باني المزوّد بالإضافة إلى
  مساعدات الإعداد الأولي/التكوين

<Warning>
  يجب أن يتجنب كود الإنتاج الخاص بالامتداد أيضًا استيراد
  `openclaw/plugin-sdk/<other-plugin>`. وإذا كانت المساعدة مشتركة فعلًا، فقم بترقيتها إلى مسار فرعي
  محايد في SDK مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو سطح آخر
  موجّه بالقدرات بدلًا من ربط pluginين معًا.
</Warning>

## ذو صلة

- [نقاط الإدخال](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry` و`defineChannelPluginEntry`
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) — المرجع الكامل لمساحة الأسماء `api.runtime`
- [الإعداد والتكوين](/ar/plugins/sdk-setup) — التغليف، وmanifests، ومخططات التكوين
- [الاختبار](/ar/plugins/sdk-testing) — أدوات الاختبار وقواعد lint
- [ترحيل SDK](/ar/plugins/sdk-migration) — الترحيل من الأسطح المهجورة
- [الأجزاء الداخلية لـ Plugin](/ar/plugins/architecture) — البنية العميقة ونموذج القدرات
