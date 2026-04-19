---
read_when:
    - تحتاج إلى معرفة أي مسار فرعي من SDK يجب الاستيراد منه
    - تريد مرجعًا لجميع أساليب التسجيل في OpenClawPluginApi
    - أنت تبحث عن تصدير محدد من SDK
sidebarTitle: SDK Overview
summary: خريطة الاستيراد، ومرجع API للتسجيل، وبنية SDK
title: نظرة عامة على Plugin SDK
x-i18n:
    generated_at: "2026-04-19T01:11:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 522c2c542bc0ea4793541fda18931b963ad71f07e9c83e4f22f05184eb1ba91a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# نظرة عامة على Plugin SDK

إن Plugin SDK هو العقد المطبوع بين Plugins والنواة. هذه الصفحة هي
المرجع الخاص بـ **ما الذي يجب استيراده** و**ما الذي يمكنك تسجيله**.

<Tip>
  **هل تبحث عن دليل إرشادي؟**
  - أول Plugin لك؟ ابدأ من [البدء](/ar/plugins/building-plugins)
  - Plugin خاص بالقنوات؟ راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins)
  - Plugin خاص بموفري الخدمة؟ راجع [Plugins موفري الخدمة](/ar/plugins/sdk-provider-plugins)
</Tip>

## اصطلاح الاستيراد

احرص دائمًا على الاستيراد من مسار فرعي محدد:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

كل مسار فرعي هو وحدة صغيرة مستقلة بذاتها. هذا يحافظ على سرعة بدء التشغيل
ويمنع مشكلات التبعيات الدائرية. بالنسبة إلى مساعدات الإدخال/البناء الخاصة بالقنوات،
فمن المفضل استخدام `openclaw/plugin-sdk/channel-core`؛ واحتفظ بـ `openclaw/plugin-sdk/core`
للسطح الشامل الأوسع والمساعدات المشتركة مثل
`buildChannelConfigSchema`.

لا تضف ولا تعتمد على واجهات convenience seams مسماة بأسماء موفري الخدمة مثل
`openclaw/plugin-sdk/slack` أو `openclaw/plugin-sdk/discord` أو
`openclaw/plugin-sdk/signal` أو `openclaw/plugin-sdk/whatsapp` أو
واجهات المساعدة المرتبطة بعلامات القنوات. يجب على Plugins المضمنة أن تركّب
المسارات الفرعية العامة لـ SDK داخل وحدات `api.ts` أو `runtime-api.ts` الخاصة بها، ويجب على النواة
إما استخدام هذه الوحدات المحلية الخاصة بالـ Plugin أو إضافة عقد SDK عام ضيق
عندما تكون الحاجة فعلًا عابرة للقنوات.

لا تزال خريطة التصدير المُولَّدة تحتوي على مجموعة صغيرة من واجهات المساعدة الخاصة بالـ Plugins المضمنة
مثل `plugin-sdk/feishu` و`plugin-sdk/feishu-setup`
و`plugin-sdk/zalo` و`plugin-sdk/zalo-setup` و`plugin-sdk/matrix*`. هذه
المسارات الفرعية موجودة فقط لصيانة Plugins المضمنة والتوافق؛ وهي
مستبعدة عمدًا من الجدول الشائع أدناه وليست مسار الاستيراد الموصى به
لـ Plugins الخارجية الجديدة.

## مرجع المسارات الفرعية

أكثر المسارات الفرعية استخدامًا، مجمعة حسب الغرض. القائمة الكاملة المُولَّدة التي تضم
أكثر من 200 مسار فرعي موجودة في `scripts/lib/plugin-sdk-entrypoints.json`.

لا تزال المسارات الفرعية المحجوزة لمساعدات Plugins المضمنة تظهر في تلك القائمة المُولَّدة.
تعامل معها كأسطح تفاصيل تنفيذ/توافق ما لم تقم صفحة توثيق
بترقية أحدها صراحة إلى سطح عام.

### إدخال Plugin

| المسار الفرعي                     | أبرز الصادرات                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | أبرز الصادرات |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذر لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات قائمة السماح، وبُناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات التهيئة/بوابة الإجراءات متعددة الحسابات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات تطبيع معرّف الحساب |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع إلى الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط تهيئة القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات تطبيع/تحقق الأوامر المخصصة في Telegram مع الرجوع إلى العقد المضمن |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة لبناء route وenvelope الواردة |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل الرسائل الواردة وإرسالها |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات الهوية الصادرة/مندوب الإرسال |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتطبيع الاستطلاعات |
    | `plugin-sdk/thread-bindings-runtime` | دورة حياة ربط الخيوط ومساعدات المهايئ |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط الوكيل القديمة |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/الخيط، والاقتران، والربط المُهيأ |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة تهيئة وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات حل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطات حالة القناة/ملخصاتها |
    | `plugin-sdk/channel-config-primitives` | عناصر أولية ضيقة لمخطط تهيئة القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة تهيئة القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيدية مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تعديل تهيئة قائمة السماح |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات الوصول إلى المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة للمصادقة/الحماية في الرسائل الخاصة المباشرة |
    | `plugin-sdk/interactive-runtime` | مساعدات تطبيع/اختزال حمولة الرد التفاعلي |
    | `plugin-sdk/channel-inbound` | وحدة توافقية لمساعدات inbound debounce، ومطابقة الإشارات، ومساعدات سياسة الإشارة، ومساعدات envelope |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارة من دون سطح وقت التشغيل الوارد الأوسع |
    | `plugin-sdk/channel-location` | سياق موقع القناة ومساعدات التنسيق |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة لعمليات إسقاط الرسائل الواردة وإخفاقات typing/ack |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل التغذية الراجعة/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقود الأسرار مثل `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`، وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية لموفري الخدمة">
    | المسار الفرعي | أبرز الصادرات |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد موفري الخدمة المحليين/المستضافين ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد موفري الخدمة المستضافين ذاتيًا والمتوافقين مع OpenAI |
    | `plugin-sdk/cli-backend` | إعدادات CLI الخلفية الافتراضية + ثوابت watchdog |
    | `plugin-sdk/provider-auth-runtime` | مساعدات وقت التشغيل لحل API-key الخاصة بـ Plugins موفري الخدمة |
    | `plugin-sdk/provider-auth-api-key` | مساعدات API-key الخاصة بالإعداد/كتابة الملف الشخصي مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتائج مصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لـ Plugins موفري الخدمة |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة لمصادقة موفر الخدمة |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، وبُناة سياسات replay المشتركة، ومساعدات endpoint الخاصة بموفر الخدمة، ومساعدات تطبيع معرّف النموذج مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات HTTP/قدرات endpoint العامة لموفري الخدمة |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقود تهيئة/اختيار web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات تسجيل/تخزين web-fetch لموفري الخدمة |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لتهيئة/بيانات اعتماد web-search لموفري الخدمة التي لا تحتاج إلى توصيل تمكين Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقود تهيئة/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، ومحددات/قارئات بيانات الاعتماد ذات النطاق المحدد |
    | `plugin-sdk/provider-web-search` | مساعدات وقت التشغيل/التسجيل/التخزين لموفري web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، وتنظيف مخطط Gemini + التشخيصات، ومساعدات توافق xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، وأنواع مغلفات التدفق، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل موفر الخدمة الأصلية مثل guarded fetch، وتحويلات رسائل النقل، وتيارات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات ترقيع تهيئة onboarding |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache محلية على مستوى العملية |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | Subpath | أبرز الصادرات |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر، ومساعدات تفويض المرسل |
    | `plugin-sdk/command-status` | بُناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات حل الموافقين ومصادقة الإجراءات داخل نفس الدردشة |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف تعريف/تصفية الموافقة الخاصة بالتنفيذ الأصلي |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات التسليم/الإمكانات الأصلية للموافقة |
    | `plugin-sdk/approval-gateway-runtime` | مساعد حل Gateway المشترك للموافقة |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئ الموافقة الأصلي لنقاط دخول القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات وقت تشغيل أوسع لمعالج الموافقة؛ ويفضَّل استخدام واجهات adapter/gateway الأضيق عندما تكون كافية |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقة + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة رد الموافقة الخاصة بالتنفيذ/الـ Plugin |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية + مساعدات الهدف الأصلي للجلسة |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-surface` | تطبيع نص الأوامر ومساعدات سطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لتجميع عقود الأسرار لأسطح أسرار القناة/الـ Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وأنواع SecretRef لتحليل عقد الأسرار/التهيئة |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وحظر الرسائل الخاصة، والمحتوى الخارجي، وتجميع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF لقائمة السماح للمضيفين والشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة لـ pinned-dispatcher من دون سطح وقت تشغيل infra الأوسع |
    | `plugin-sdk/ssrf-runtime` | مساعدات pinned-dispatcher وfetch المحمي من SSRF وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل إدخال الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات الطلب/الهدف الخاصة بـ Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم نص الطلب/المهلة الزمنية |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | Subpath | أبرز الصادرات |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugins |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، والمسجل، والمهلة، وإعادة المحاولة، والتراجع التدريجي |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل والبحث عن سياق وقت تشغيل القناة |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/HTTP/تفاعل الـ Plugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب الخطافات الداخلية/Webhook |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI والانتظار والإصدار |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وترقيع حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة التهيئة |
    | `plugin-sdk/telegram-command-config` | تطبيع أسماء/أوصاف أوامر Telegram وفحوصات التكرار/التعارض، حتى عند عدم توفر سطح عقد Telegram المضمَّن |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات من دون وحدة text-runtime الأوسع |
    | `plugin-sdk/approval-runtime` | مساعدات الموافقة الخاصة بالتنفيذ/الـ Plugin، وبناة إمكانات الموافقة، ومساعدات المصادقة/ملفات التعريف، ومساعدات التوجيه/وقت التشغيل الأصلية |
    | `plugin-sdk/reply-runtime` | مساعدات وقت التشغيل المشتركة للرسائل الواردة/الردود، والتقسيم، والإرسال، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لإرسال/إنهاء الرد |
    | `plugin-sdk/reply-history` | مساعدات مشتركة لسجل الردود ضمن نافذة قصيرة مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتقسيم النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسات + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات أدلة الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات route/session-key وربط الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخصات حالة القناة/الحساب، والإعدادات الافتراضية لحالة وقت التشغيل، ومساعدات بيانات المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لحل الأهداف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات تطبيع slug/السلاسل النصية |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغّل أوامر موقّت بنتائج `stdout`/`stderr` مطبَّعة |
    | `plugin-sdk/param-readers` | قارئات معاملات شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات المطبَّعة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول هدف الإرسال القياسية من معاملات الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقتة |
    | `plugin-sdk/logging-core` | مساعدات المسجل الفرعي وإخفاء البيانات الحساسة |
    | `plugin-sdk/markdown-table-runtime` | مساعدات أوضاع جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات قفل الملفات القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة التخزين المؤقت لإزالة التكرار المدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت التشغيل/الجلسات وإرسال الردود الخاصة بـ ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | حل ربط ACP للقراءة فقط من دون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | عناصر أولية ضيقة لمخطط تهيئة وقت تشغيل الوكيل |
    | `plugin-sdk/boolean-param` | قارئ مرن لمعاملات القيم المنطقية |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات حل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات إقلاع الجهاز ورموز الاقتران |
    | `plugin-sdk/extension-shared` | عناصر أولية مساعدة مشتركة للقناة السلبية والحالة والوكيل المحيطي |
    | `plugin-sdk/models-provider-runtime` | مساعدات ردود الأوامر `/models`/موفر الخدمة |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح تجريبي للـ Plugin الموثوق لحواضن الوكلاء منخفضة المستوى: أنواع الحاضنة، ومساعدات توجيه/إلغاء التشغيل النشط، ومساعدات جسر أدوات OpenClaw، وأدوات نتائج المحاولات |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف endpoint الخاصة بـ Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات علامات وأحداث التشخيص |
    | `plugin-sdk/error-runtime` | رسم الأخطاء، والتنسيق، ومساعدات تصنيف الأخطاء المشتركة، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلف، والوكيل، والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | fetch لوقت التشغيل مدرك للـ dispatcher من دون استيرادات proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لنص الاستجابة من دون سطح وقت تشغيل الوسائط الأوسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية من دون توجيه الربط المُهيأ أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسات من دون استيرادات واسعة لكتابة/صيانة التهيئة |
    | `plugin-sdk/context-visibility-runtime` | حل رؤية السياق وتصفية السياق الإضافي من دون استيرادات واسعة للتهيئة/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لإكراه/تطبيع السلاسل النصية والسجلات البدائية من دون استيرادات markdown/logging |
    | `plugin-sdk/host-runtime` | مساعدات تطبيع اسم المضيف وSCP host |
    | `plugin-sdk/retry-runtime` | مساعدات تهيئة إعادة المحاولة ومشغّل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات دليل/هوية/مساحة عمل الوكيل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الأدلة المدعوم بالتهيئة |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للإمكانات والاختبار">
    | Subpath | أبرز الصادرات |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بُناة حمولة الوسائط |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للتجاوز عند الفشل في توليد الوسائط، واختيار المرشحين، ورسائل النماذج المفقودة |
    | `plugin-sdk/media-understanding` | أنواع موفري فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت الموجهة لموفر الخدمة |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تقسيم/جداول Markdown، ومساعدات إخفاء البيانات الحساسة، ومساعدات directive-tag، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع موفري الكلام بالإضافة إلى مساعدات directive والسجل والتحقق الموجهة لموفر الخدمة |
    | `plugin-sdk/speech-core` | أنواع موفري الكلام المشتركة، والسجل، وdirective، ومساعدات التطبيع |
    | `plugin-sdk/realtime-transcription` | أنواع موفري النسخ الفوري ومساعدات السجل |
    | `plugin-sdk/realtime-voice` | أنواع موفري الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع موفري توليد الصور |
    | `plugin-sdk/image-generation-core` | الأنواع المشتركة لتوليد الصور، والتجاوز عند الفشل، والمصادقة، ومساعدات السجل |
    | `plugin-sdk/music-generation` | أنواع موفري/طلبات/نتائج توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع توليد الموسيقى المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن موفر الخدمة، وتحليل model-ref |
    | `plugin-sdk/video-generation` | أنواع موفري/طلبات/نتائج توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع توليد الفيديو المشتركة، ومساعدات التجاوز عند الفشل، والبحث عن موفر الخدمة، وتحليل model-ref |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت route |
    | `plugin-sdk/webhook-path` | مساعدات تطبيع مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | Subpath | أبرز الصادرات |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد `memory-core` المضمَّن لمساعدات المدير/التهيئة/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل فهرسة/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود تضمين مضيف الذاكرة، والوصول إلى السجل، والموفر المحلي، ومساعدات عامة للدفعات/البعيد |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعدد الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم بديل محايد للمورّد لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم بديل محايد للمورّد لمساعدات سجل أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم بديل محايد للمورّد لمساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدار المشتركة للPlugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة Active Memory لوقت التشغيل للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم بديل محايد للمورّد لمساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعد `memory-lancedb` المضمَّن |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمَّنة">
    | الفئة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin Browser المضمَّن (`browser-support` يظل وحدة التوافق) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح مساعد/وقت تشغيل Matrix المضمَّن |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح مساعد/وقت تشغيل LINE المضمَّن |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح مساعد IRC المضمَّن |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | واجهات توافق/مساعدات القنوات المضمَّنة |
    | مساعدات خاصة بالمصادقة/الـ Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | واجهات مساعدات الميزات/Plugins المضمَّنة؛ يصدّر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API التسجيل

يتلقى callback الخاص بـ `register(api)` كائن `OpenClawPluginApi` يتضمن هذه
الأساليب:

### تسجيل الإمكانات

| الأسلوب                                           | ما الذي يسجله                           |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | الاستدلال النصي (LLM)                   |
| `api.registerAgentHarness(...)`                  | منفّذ وكيل منخفض المستوى تجريبي         |
| `api.registerCliBackend(...)`                    | خلفية استدلال CLI محلية                 |
| `api.registerChannel(...)`                       | قناة مراسلة                             |
| `api.registerSpeechProvider(...)`                | تحويل النص إلى كلام / توليف STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | نسخ فوري متدفق في الوقت الحقيقي          |
| `api.registerRealtimeVoiceProvider(...)`         | جلسات صوت ثنائية الاتجاه في الوقت الحقيقي |
| `api.registerMediaUnderstandingProvider(...)`    | تحليل الصور/الصوت/الفيديو               |
| `api.registerImageGenerationProvider(...)`       | توليد الصور                             |
| `api.registerMusicGenerationProvider(...)`       | توليد الموسيقى                          |
| `api.registerVideoGenerationProvider(...)`       | توليد الفيديو                           |
| `api.registerWebFetchProvider(...)`              | موفر جلب / استخراج من الويب             |
| `api.registerWebSearchProvider(...)`             | البحث على الويب                         |

### الأدوات والأوامر

| الأسلوب                          | ما الذي يسجله                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | أداة وكيل (مطلوبة أو `{ optional: true }`)     |
| `api.registerCommand(def)`      | أمر مخصص (يتجاوز LLM)                          |

### البنية التحتية

| الأسلوب                                         | ما الذي يسجله                          |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | hook حدث                               |
| `api.registerHttpRoute(params)`                | نقطة نهاية HTTP لـ Gateway             |
| `api.registerGatewayMethod(name, handler)`     | أسلوب RPC لـ Gateway                   |
| `api.registerCli(registrar, opts?)`            | أمر فرعي في CLI                        |
| `api.registerService(service)`                 | خدمة في الخلفية                        |
| `api.registerInteractiveHandler(registration)` | معالج تفاعلي                           |
| `api.registerMemoryPromptSupplement(builder)`  | قسم prompt إضافي مجاور للذاكرة         |
| `api.registerMemoryCorpusSupplement(adapter)`  | corpus إضافي للبحث/القراءة في الذاكرة  |

تبقى مساحات أسماء إدارة النواة المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) دائمًا `operator.admin`، حتى إذا حاول Plugin تعيين
نطاق أضيق لأسلوب Gateway. فضّل استخدام بادئات خاصة بالـ Plugin
للأساليب التي يملكها الـ Plugin.

### بيانات تسجيل CLI الوصفية

يقبل `api.registerCli(registrar, opts?)` نوعين من البيانات الوصفية العليا:

- `commands`: جذور أوامر صريحة يملكها المسجل
- `descriptors`: واصفات أوامر وقت التحليل المستخدمة لمساعدة CLI الجذرية،
  والتوجيه، وتسجيل CLI الكسول للPlugins

إذا كنت تريد أن يبقى أمر Plugin محمّلًا كسولًا في مسار CLI الجذري المعتاد،
فقدّم `descriptors` التي تغطي كل جذر أوامر من المستوى الأعلى يكشفه ذلك
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

استخدم `commands` وحده فقط عندما لا تحتاج إلى تسجيل CLI جذري كسول.
يظل مسار التوافق eager هذا مدعومًا، لكنه لا يثبت
عناصر نائبة مدعومة بـ descriptor للتحميل الكسول وقت التحليل.

### تسجيل خلفية CLI

يتيح `api.registerCliBackend(...)` للـ Plugin امتلاك التهيئة الافتراضية
لخلفية CLI محلية للذكاء الاصطناعي مثل `codex-cli`.

- يصبح `id` الخاص بالخلفية بادئة الموفّر في مراجع النماذج مثل `codex-cli/gpt-5`.
- تستخدم `config` الخاصة بالخلفية البنية نفسها الموجودة في `agents.defaults.cliBackends.<id>`.
- تهيئة المستخدم لها الأولوية دائمًا. يدمج OpenClaw `agents.defaults.cliBackends.<id>` فوق
  القيمة الافتراضية للـ Plugin قبل تشغيل CLI.
- استخدم `normalizeConfig` عندما تحتاج الخلفية إلى عمليات إعادة كتابة للتوافق بعد الدمج
  (على سبيل المثال، تطبيع أشكال flags القديمة).

### الخانات الحصرية

| الأسلوب                                     | ما الذي يسجله                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | محرك سياق (نشط واحد فقط في كل مرة). يتلقى callback الخاص بـ `assemble()` كلًا من `availableTools` و`citationsMode` حتى يتمكن المحرك من تخصيص إضافات prompt. |
| `api.registerMemoryCapability(capability)` | إمكانات ذاكرة موحّدة                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | باني قسم prompt للذاكرة                                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | محلّل خطة تفريغ الذاكرة                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | مهايئ وقت تشغيل الذاكرة                                                                                                                               |

### مهايئات تضمين الذاكرة

| الأسلوب                                         | ما الذي يسجله                              |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | مهايئ تضمين الذاكرة للـ Plugin النشط       |

- يُعد `registerMemoryCapability` هو API الحصري المفضّل لـ Plugin الذاكرة.
- قد يكشف `registerMemoryCapability` أيضًا عن `publicArtifacts.listArtifacts(...)`
  حتى تتمكن Plugins المرافقة من استهلاك عناصر الذاكرة المصدّرة عبر
  `openclaw/plugin-sdk/memory-host-core` بدلًا من الوصول إلى
  البنية الخاصة الداخلية لـ Plugin ذاكرة محدد.
- تمثل `registerMemoryPromptSection` و`registerMemoryFlushPlan` و
  `registerMemoryRuntime` واجهات API حصرية متوافقة مع الإصدارات القديمة لـ Plugin الذاكرة.
- يتيح `registerMemoryEmbeddingProvider` لـ Plugin الذاكرة النشط تسجيل
  معرّف مهايئ تضمين واحد أو أكثر (على سبيل المثال `openai` أو `gemini` أو معرّف
  مخصص يعرّفه Plugin).
- يتم حل تهيئة المستخدم مثل `agents.defaults.memorySearch.provider` و
  `agents.defaults.memorySearch.fallback` مقابل معرّفات المهايئات المسجلة تلك.

### الأحداث ودورة الحياة

| الأسلوب                                       | ما الذي يفعله                |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | hook دورة حياة مضبوط النوع   |
| `api.onConversationBindingResolved(handler)` | callback ربط المحادثة        |

### دلالات قرارات Hook

- `before_tool_call`: تُعد إعادة `{ block: true }` نهائية. بمجرد أن يعيّن أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_tool_call`: تُعامل إعادة `{ block: false }` على أنها بلا قرار (مثل حذف `block`)، وليست كتجاوز.
- `before_install`: تُعد إعادة `{ block: true }` نهائية. بمجرد أن يعيّن أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأقل.
- `before_install`: تُعامل إعادة `{ block: false }` على أنها بلا قرار (مثل حذف `block`)، وليست كتجاوز.
- `reply_dispatch`: تُعد إعادة `{ handled: true, ... }` نهائية. بمجرد أن يدّعي أي معالج الإرسال، يتم تخطي المعالجات ذات الأولوية الأقل ومسار إرسال النموذج الافتراضي.
- `message_sending`: تُعد إعادة `{ cancel: true }` نهائية. بمجرد أن يعيّن أي معالج هذه القيمة، يتم تخطي المعالجات ذات الأولوية الأقل.
- `message_sending`: تُعامل إعادة `{ cancel: false }` على أنها بلا قرار (مثل حذف `cancel`)، وليست كتجاوز.

### حقول كائن API

| الحقل                    | النوع                      | الوصف                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | معرّف Plugin                                                                               |
| `api.name`               | `string`                  | الاسم المعروض                                                                              |
| `api.version`            | `string?`                 | إصدار Plugin (اختياري)                                                                     |
| `api.description`        | `string?`                 | وصف Plugin (اختياري)                                                                       |
| `api.source`             | `string`                  | مسار مصدر Plugin                                                                           |
| `api.rootDir`            | `string?`                 | الدليل الجذري لـ Plugin (اختياري)                                                          |
| `api.config`             | `OpenClawConfig`          | لقطة التهيئة الحالية (لقطة وقت التشغيل النشطة داخل الذاكرة عند توفرها)                    |
| `api.pluginConfig`       | `Record<string, unknown>` | التهيئة الخاصة بالـ Plugin من `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)                                                |
| `api.logger`             | `PluginLogger`            | مسجل ذو نطاق محدد (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | وضع التحميل الحالي؛ `"setup-runtime"` هي نافذة بدء/إعداد خفيفة قبل الإدخال الكامل        |
| `api.resolvePath(input)` | `(string) => string`      | حل المسار نسبةً إلى جذر Plugin                                                             |

## اصطلاح الوحدات الداخلية

داخل Plugin الخاص بك، استخدم ملفات barrel محلية للاستيرادات الداخلية:

```
my-plugin/
  api.ts            # صادرات عامة للمستهلكين الخارجيين
  runtime-api.ts    # صادرات داخلية فقط لوقت التشغيل
  index.ts          # نقطة إدخال Plugin
  setup-entry.ts    # إدخال خفيف للإعداد فقط (اختياري)
```

<Warning>
  لا تستورد Plugin الخاص بك عبر `openclaw/plugin-sdk/<your-plugin>`
  من كود الإنتاج. وجّه الاستيرادات الداخلية عبر `./api.ts` أو
  `./runtime-api.ts`. مسار SDK هو العقد الخارجي فقط.
</Warning>

تفضّل الآن الأسطح العامة للPlugins المضمنة المحمّلة عبر facade (`api.ts` و`runtime-api.ts`،
و`index.ts` و`setup-entry.ts`، وملفات الإدخال العامة المشابهة) استخدام
لقطة تهيئة وقت التشغيل النشطة عندما يكون OpenClaw قيد التشغيل بالفعل. وإذا لم تكن
لقطة وقت التشغيل موجودة بعد، فإنها تعود إلى ملف التهيئة المحلول على القرص.

يمكن Plugins موفري الخدمة أيضًا كشف وحدة عقد محلية ضيقة خاصة بالـ Plugin عندما تكون
إحدى المساعدات خاصة عمدًا بموفر الخدمة ولا تنتمي بعد إلى مسار فرعي عام في SDK.
المثال المضمّن الحالي: يحتفظ موفر Anthropic بمساعدات تدفق Claude
ضمن الواجهة العامة الخاصة به `api.ts` / `contract-api.ts` بدلًا من
ترقية منطق Anthropic beta-header و`service_tier` إلى عقد
عام من `plugin-sdk/*`.

أمثلة مضمّنة حالية أخرى:

- `@openclaw/openai-provider`: يصدّر `api.ts` بُناة موفر الخدمة،
  ومساعدات النماذج الافتراضية، وبُناة موفرات الوقت الحقيقي
- `@openclaw/openrouter-provider`: يصدّر `api.ts` باني موفر الخدمة بالإضافة إلى
  مساعدات onboarding/التهيئة

<Warning>
  يجب أيضًا على كود الإنتاج الخاص بالامتدادات تجنّب استيراد
  `openclaw/plugin-sdk/<other-plugin>`.
  إذا كانت إحدى المساعدات مشتركة فعلًا، فقُم بترقيتها إلى مسار فرعي محايد في SDK
  مثل `openclaw/plugin-sdk/speech` أو `.../provider-model-shared` أو أي سطح آخر
  موجه حسب الإمكانات بدلًا من ربط Pluginين معًا.
</Warning>

## ذو صلة

- [نقاط الإدخال](/ar/plugins/sdk-entrypoints) — خيارات `definePluginEntry` و`defineChannelPluginEntry`
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime) — المرجع الكامل لمساحة الأسماء `api.runtime`
- [الإعداد والتهيئة](/ar/plugins/sdk-setup) — الحزم، وmanifestات، ومخططات التهيئة
- [الاختبار](/ar/plugins/sdk-testing) — أدوات الاختبار وقواعد lint
- [ترحيل SDK](/ar/plugins/sdk-migration) — الترحيل من الأسطح المهملة
- [الأجزاء الداخلية للPlugin](/ar/plugins/architecture) — البنية العميقة ونموذج الإمكانات
