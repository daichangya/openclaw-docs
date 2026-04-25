---
read_when:
    - اختيار المسار الفرعي الصحيح في plugin-sdk لاستيراد Plugin
    - تدقيق المسارات الفرعية للPlugins المضمّنة وأسطر المساعدة السطحية
summary: 'فهرس المسارات الفرعية لـ Plugin SDK: أي عمليات الاستيراد توجد في أي موضع، مجمعة حسب المجال'
title: المسارات الفرعية لـ Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:55:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  يُعرَض Plugin SDK كمجموعة من المسارات الفرعية الضيقة تحت `openclaw/plugin-sdk/`.
  تسرد هذه الصفحة المسارات الفرعية الشائعة الاستخدام والمجمعة حسب الغرض. وتوجد
  القائمة الكاملة المولدة التي تضم أكثر من 200 مسار فرعي في `scripts/lib/plugin-sdk-entrypoints.json`؛
  وتظهر فيها المسارات الفرعية المحجوزة لمساعدات Plugins المضمّنة، لكنها تُعد
  تفصيلًا تنفيذيًا ما لم تروّج لها صفحة توثيق صراحة.

  للاطلاع على دليل تأليف Plugins، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

  ## إدخال Plugin

  | المسار الفرعي                     | الصادرات الرئيسية                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="المسارات الفرعية للقنوات">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | تصدير مخطط Zod الجذري لـ `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، بالإضافة إلى `DEFAULT_ACCOUNT_ID` و`createTopLevelChannelDmPolicy` و`setSetupChannelEnabled` و`splitSetupEntries` |
    | `plugin-sdk/setup` | مساعدات معالج الإعداد المشتركة، ومطالبات allowlist، وبناة حالة الإعداد |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | مساعدات إعدادات الحسابات المتعددة/بوابة الإجراءات، ومساعدات الرجوع إلى الحساب الافتراضي |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`، ومساعدات توحيد account-id |
    | `plugin-sdk/account-resolution` | مساعدات البحث عن الحساب + الرجوع إلى الافتراضي |
    | `plugin-sdk/account-helpers` | مساعدات ضيقة لقائمة الحسابات/إجراءات الحساب |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | أنواع مخطط إعدادات القناة |
    | `plugin-sdk/telegram-command-config` | مساعدات توحيد/التحقق من الأوامر المخصصة في Telegram مع الرجوع إلى العقدة المضمّنة |
    | `plugin-sdk/command-gating` | مساعدات ضيقة لبوابة تفويض الأوامر |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`، ومساعدات دورة الحياة/الإتمام لتدفق المسودات |
    | `plugin-sdk/inbound-envelope` | مساعدات مشتركة للمسارات الواردة + بناء المظاريف |
    | `plugin-sdk/inbound-reply-dispatch` | مساعدات مشتركة لتسجيل والتمرير الوارد |
    | `plugin-sdk/messaging-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/outbound-media` | مساعدات مشتركة لتحميل الوسائط الصادرة |
    | `plugin-sdk/outbound-runtime` | مساعدات التسليم الصادر، والهوية، ومفوّض الإرسال، والجلسة، والتنسيق، وتخطيط الحمولة |
    | `plugin-sdk/poll-runtime` | مساعدات ضيقة لتوحيد poll |
    | `plugin-sdk/thread-bindings-runtime` | مساعدات دورة الحياة والمهايئات الخاصة بربط السلاسل |
    | `plugin-sdk/agent-media-payload` | باني حمولة وسائط العامل القديم |
    | `plugin-sdk/conversation-runtime` | مساعدات ربط المحادثة/السلسلة، والاقتران، والربط المضبوط |
    | `plugin-sdk/runtime-config-snapshot` | مساعد لقطة إعدادات وقت التشغيل |
    | `plugin-sdk/runtime-group-policy` | مساعدات تحليل سياسة المجموعات في وقت التشغيل |
    | `plugin-sdk/channel-status` | مساعدات مشتركة للقطات/ملخصات حالة القناة |
    | `plugin-sdk/channel-config-primitives` | عناصر أولية ضيقة لمخطط إعدادات القناة |
    | `plugin-sdk/channel-config-writes` | مساعدات تفويض كتابة إعدادات القناة |
    | `plugin-sdk/channel-plugin-common` | صادرات تمهيدية مشتركة لـ Plugin القناة |
    | `plugin-sdk/allowlist-config-edit` | مساعدات قراءة/تعديل إعدادات allowlist |
    | `plugin-sdk/group-access` | مساعدات مشتركة لقرارات الوصول إلى المجموعات |
    | `plugin-sdk/direct-dm` | مساعدات مشتركة للمصادقة/الحماية الخاصة بالرسائل المباشرة |
    | `plugin-sdk/interactive-runtime` | العرض الدلالي للرسائل، والتسليم، ومساعدات الردود التفاعلية القديمة. راجع [عرض الرسائل](/ar/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | حاوية توافقية لمساعدات inbound debounce، ومطابقة الإشارات، وسياسة الإشارات، ومساعدات المظاريف |
    | `plugin-sdk/channel-inbound-debounce` | مساعدات ضيقة لـ inbound debounce |
    | `plugin-sdk/channel-mention-gating` | مساعدات ضيقة لسياسة الإشارات ونص الإشارات دون سطح وقت التشغيل الوارد الأوسع |
    | `plugin-sdk/channel-envelope` | مساعدات ضيقة لتنسيق المظاريف الواردة |
    | `plugin-sdk/channel-location` | مساعدات سياق موقع القناة وتنسيقه |
    | `plugin-sdk/channel-logging` | مساعدات تسجيل القناة لحالات إسقاط الوارد وإخفاقات typing/ack |
    | `plugin-sdk/channel-send-result` | أنواع نتائج الرد |
    | `plugin-sdk/channel-actions` | مساعدات إجراءات رسائل القناة، بالإضافة إلى مساعدات المخطط الأصلية المتقادمة المُحتفَظ بها من أجل توافق Plugins |
    | `plugin-sdk/channel-targets` | مساعدات تحليل/مطابقة الأهداف |
    | `plugin-sdk/channel-contract` | أنواع عقد القناة |
    | `plugin-sdk/channel-feedback` | توصيل التغذية الراجعة/التفاعلات |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لعقود الأسرار مثل `collectSimpleChannelFieldAssignments` و`getChannelSurface` و`pushAssignment` وأنواع أهداف الأسرار |
  </Accordion>

  <Accordion title="المسارات الفرعية للمزودين">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | مساعدات منسقة لإعداد المزود المحلي/المستضاف ذاتيًا |
    | `plugin-sdk/self-hosted-provider-setup` | مساعدات مركزة لإعداد مزودات OpenAI-compatible المستضافة ذاتيًا |
    | `plugin-sdk/cli-backend` | إعدادات CLI الخلفية الافتراضية + ثوابت المراقبة |
    | `plugin-sdk/provider-auth-runtime` | مساعدات وقت التشغيل لتحليل API key الخاصة بـ Plugins المزودين |
    | `plugin-sdk/provider-auth-api-key` | مساعدات تأهيل/كتابة ملفات التعريف الخاصة بـ API key مثل `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | باني نتيجة مصادقة OAuth القياسي |
    | `plugin-sdk/provider-auth-login` | مساعدات تسجيل الدخول التفاعلي المشتركة لـ Plugins المزودين |
    | `plugin-sdk/provider-env-vars` | مساعدات البحث عن متغيرات البيئة لمصادقة المزود |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily` و`buildProviderReplayFamilyHooks` و`normalizeModelCompat` وبناة سياسة replay المشتركة، ومساعدات نقاط نهاية المزود، ومساعدات توحيد model-id مثل `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | مساعدات عامة لقدرات HTTP/نقاط نهاية المزود، وأخطاء HTTP الخاصة بالمزود، ومساعدات نموذج multipart الخاصة بنسخ الصوت |
    | `plugin-sdk/provider-web-fetch-contract` | مساعدات ضيقة لعقد إعداد/اختيار web-fetch مثل `enablePluginInConfig` و`WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | مساعدات التسجيل/التخزين المؤقت الخاصة بمزود web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | مساعدات ضيقة لإعداد/بيانات اعتماد web-search للمزودين الذين لا يحتاجون إلى توصيل تفعيل Plugin |
    | `plugin-sdk/provider-web-search-contract` | مساعدات ضيقة لعقد إعداد/بيانات اعتماد web-search مثل `createWebSearchProviderContractFields` و`enablePluginInConfig` و`resolveProviderWebSearchPluginConfig` وواضعات/جالبات بيانات الاعتماد ذات النطاق |
    | `plugin-sdk/provider-web-search` | مساعدات التسجيل/التخزين المؤقت/وقت التشغيل الخاصة بمزود web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily` و`buildProviderToolCompatFamilyHooks` وتنظيف مخطط Gemini + التشخيصات، ومساعدات التوافق الخاصة بـ xAI مثل `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` وما شابه |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily` و`buildProviderStreamFamilyHooks` و`composeProviderStreamWrappers` وأنواع مغلفات التدفق، ومساعدات المغلفات المشتركة لـ Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | مساعدات نقل المزود الأصلية مثل guarded fetch، وتحويلات رسائل النقل، وتدفقات أحداث النقل القابلة للكتابة |
    | `plugin-sdk/provider-onboard` | مساعدات ترقيع إعدادات التأهيل |
    | `plugin-sdk/global-singleton` | مساعدات singleton/map/cache المحلية للعملية |
    | `plugin-sdk/group-activation` | مساعدات ضيقة لوضع تفعيل المجموعات وتحليل الأوامر |
  </Accordion>

  <Accordion title="المسارات الفرعية للمصادقة والأمان">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`، ومساعدات سجل الأوامر بما في ذلك تنسيق قائمة الوسيطات الديناميكية، ومساعدات تفويض المُرسِل |
    | `plugin-sdk/command-status` | بناة رسائل الأوامر/المساعدة مثل `buildCommandsMessagePaginated` و`buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | مساعدات تحليل الموافق ومصادقة الإجراءات داخل المحادثة نفسها |
    | `plugin-sdk/approval-client-runtime` | مساعدات ملف التعريف/عامل التصفية الأصلية لموافقات التنفيذ |
    | `plugin-sdk/approval-delivery-runtime` | مهايئات قدرات/تسليم الموافقات الأصلية |
    | `plugin-sdk/approval-gateway-runtime` | مساعد تحليل Gateway المشترك للموافقات |
    | `plugin-sdk/approval-handler-adapter-runtime` | مساعدات خفيفة لتحميل مهايئ الموافقات الأصلية لنقاط إدخال القنوات السريعة |
    | `plugin-sdk/approval-handler-runtime` | مساعدات أوسع لوقت تشغيل معالج الموافقات؛ يُفضَّل استخدام مسارات المهايئ/Gateway الأضيق عندما تكفي |
    | `plugin-sdk/approval-native-runtime` | مساعدات الهدف الأصلي للموافقات + ربط الحساب |
    | `plugin-sdk/approval-reply-runtime` | مساعدات حمولة الرد على موافقات التنفيذ/Plugin |
    | `plugin-sdk/approval-runtime` | مساعدات حمولة موافقات التنفيذ/Plugin، ومساعدات التوجيه/وقت التشغيل للموافقات الأصلية، ومساعدات العرض المنظم للموافقات مثل `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | مساعدات ضيقة لإعادة تعيين إزالة تكرار الردود الواردة |
    | `plugin-sdk/channel-contract-testing` | مساعدات ضيقة لاختبار عقد القناة بدون حاوية الاختبار الواسعة |
    | `plugin-sdk/command-auth-native` | مصادقة الأوامر الأصلية، وتنسيق قائمة الوسيطات الديناميكية، ومساعدات أهداف الجلسات الأصلية |
    | `plugin-sdk/command-detection` | مساعدات مشتركة لاكتشاف الأوامر |
    | `plugin-sdk/command-primitives-runtime` | مسندات خفيفة لنص الأوامر لمسارات القنوات السريعة |
    | `plugin-sdk/command-surface` | مساعدات توحيد نص الأوامر وسطح الأوامر |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | مساعدات ضيقة لجمع عقود الأسرار لأسطح أسرار القناة/Plugin |
    | `plugin-sdk/secret-ref-runtime` | مساعدات ضيقة لـ `coerceSecretRef` وأنواع SecretRef لتحليل عقود الأسرار/الإعدادات |
    | `plugin-sdk/security-runtime` | مساعدات مشتركة للثقة، وبوابة الرسائل المباشرة، والمحتوى الخارجي، وجمع الأسرار |
    | `plugin-sdk/ssrf-policy` | مساعدات سياسة SSRF لقائمة السماح بالمضيفين والشبكات الخاصة |
    | `plugin-sdk/ssrf-dispatcher` | مساعدات ضيقة للـ dispatcher المثبّت بدون سطح وقت التشغيل الواسع للبنية التحتية |
    | `plugin-sdk/ssrf-runtime` | مساعدات dispatcher المثبّت، وfetch المحمي من SSRF، وسياسة SSRF |
    | `plugin-sdk/secret-input` | مساعدات تحليل مدخلات الأسرار |
    | `plugin-sdk/webhook-ingress` | مساعدات طلبات/أهداف Webhook |
    | `plugin-sdk/webhook-request-guards` | مساعدات حجم/مهلة نص الطلب |
  </Accordion>

  <Accordion title="المسارات الفرعية لوقت التشغيل والتخزين">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/runtime` | مساعدات واسعة لوقت التشغيل/التسجيل/النسخ الاحتياطي/تثبيت Plugins |
    | `plugin-sdk/runtime-env` | مساعدات ضيقة لبيئة وقت التشغيل، والمسجل، والمهلة، وإعادة المحاولة، والتراجع |
    | `plugin-sdk/channel-runtime-context` | مساعدات عامة لتسجيل سياق وقت تشغيل القناة والبحث عنه |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | مساعدات مشتركة لأوامر/خطافات/HTTP/التفاعل الخاصة بالPlugin |
    | `plugin-sdk/hook-runtime` | مساعدات مشتركة لخط أنابيب Webhook/الخطافات الداخلية |
    | `plugin-sdk/lazy-runtime` | مساعدات الاستيراد/الربط الكسول لوقت التشغيل مثل `createLazyRuntimeModule` و`createLazyRuntimeMethod` و`createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | مساعدات تنفيذ العمليات |
    | `plugin-sdk/cli-runtime` | مساعدات تنسيق CLI، والانتظار، والإصدار، واستدعاء الوسيطات، ومجموعات الأوامر الكسولة |
    | `plugin-sdk/gateway-runtime` | مساعدات عميل Gateway وترقيع حالة القناة |
    | `plugin-sdk/config-runtime` | مساعدات تحميل/كتابة الإعدادات ومساعدات البحث عن إعدادات Plugin |
    | `plugin-sdk/telegram-command-config` | مساعدات توحيد اسم/وصف أوامر Telegram والتحقق من التكرار/التعارض، حتى عند عدم توفر سطح عقد Telegram المضمّن |
    | `plugin-sdk/text-autolink-runtime` | اكتشاف الروابط التلقائية لمراجع الملفات دون حاوية text-runtime الواسعة |
    | `plugin-sdk/approval-runtime` | مساعدات موافقات التنفيذ/Plugin، وبناة قدرات الموافقة، ومساعدات المصادقة/ملف التعريف، ومساعدات التوجيه/وقت التشغيل الأصلية، وتنسيق مسار عرض الموافقات المنظم |
    | `plugin-sdk/reply-runtime` | مساعدات مشتركة لوقت تشغيل الوارد/الرد، والتقسيم، والتمرير، وHeartbeat، ومخطط الرد |
    | `plugin-sdk/reply-dispatch-runtime` | مساعدات ضيقة لتمرير/إنهاء الرد ومساعدات تسمية المحادثة |
    | `plugin-sdk/reply-history` | مساعدات مشتركة قصيرة النافذة لسجل الردود مثل `buildHistoryContext` و`recordPendingHistoryEntry` و`clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | مساعدات ضيقة لتقسيم النص/Markdown |
    | `plugin-sdk/session-store-runtime` | مساعدات مسار مخزن الجلسات + `updated-at` |
    | `plugin-sdk/state-paths` | مساعدات مسارات مجلدات الحالة/OAuth |
    | `plugin-sdk/routing` | مساعدات المسارات/مفاتيح الجلسات/ربط الحساب مثل `resolveAgentRoute` و`buildAgentSessionKey` و`resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | مساعدات مشتركة لملخصات حالة القناة/الحساب، والقيم الافتراضية لحالة وقت التشغيل، ومساعدات بيانات المشكلات |
    | `plugin-sdk/target-resolver-runtime` | مساعدات مشتركة لتحليل الهدف |
    | `plugin-sdk/string-normalization-runtime` | مساعدات توحيد slug/السلاسل النصية |
    | `plugin-sdk/request-url` | استخراج عناوين URL النصية من مدخلات شبيهة بـ fetch/request |
    | `plugin-sdk/run-command` | مشغل أوامر مضبوط بالوقت مع نتائج stdout/stderr موحّدة |
    | `plugin-sdk/param-readers` | قارئات وسائط شائعة للأدوات/CLI |
    | `plugin-sdk/tool-payload` | استخراج الحمولات الموحّدة من كائنات نتائج الأدوات |
    | `plugin-sdk/tool-send` | استخراج حقول أهداف الإرسال القياسية من وسائط الأداة |
    | `plugin-sdk/temp-path` | مساعدات مشتركة لمسارات التنزيل المؤقت |
    | `plugin-sdk/logging-core` | مساعدات مسجل الأنظمة الفرعية والتنقيح |
    | `plugin-sdk/markdown-table-runtime` | مساعدات وضع/تحويل جداول Markdown |
    | `plugin-sdk/json-store` | مساعدات صغيرة لقراءة/كتابة حالة JSON |
    | `plugin-sdk/file-lock` | مساعدات أقفال الملفات القابلة لإعادة الدخول |
    | `plugin-sdk/persistent-dedupe` | مساعدات ذاكرة التخزين المؤقت لإزالة التكرار المدعومة بالقرص |
    | `plugin-sdk/acp-runtime` | مساعدات وقت التشغيل/الجلسة وتمرير الرد الخاصة بـ ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | تحليل ربط ACP للقراءة فقط بدون استيرادات بدء دورة الحياة |
    | `plugin-sdk/agent-config-primitives` | عناصر أولية ضيقة لمخطط إعدادات وقت تشغيل العامل |
    | `plugin-sdk/boolean-param` | قارئ مرن لوسيطات Boolean |
    | `plugin-sdk/dangerous-name-runtime` | مساعدات تحليل مطابقة الأسماء الخطرة |
    | `plugin-sdk/device-bootstrap` | مساعدات التمهيد للجهاز ورموز الاقتران |
    | `plugin-sdk/extension-shared` | عناصر أولية مشتركة لمساعدات القنوات السلبية، والحالة، والوكيل المحيطي |
    | `plugin-sdk/models-provider-runtime` | مساعدات الرد الخاصة بأمر `/models`/المزود |
    | `plugin-sdk/skill-commands-runtime` | مساعدات سرد أوامر Skills |
    | `plugin-sdk/native-command-registry` | مساعدات سجل/بناء/تسلسل الأوامر الأصلية |
    | `plugin-sdk/agent-harness` | سطح Plugin موثوق وتجريبي لأحزمة العامل منخفضة المستوى: أنواع الحزام، ومساعدات توجيه/إيقاف التشغيل النشط، ومساعدات جسر أدوات OpenClaw، ومساعدات تنسيق/تفاصيل تقدم الأداة، وأدوات نتيجة المحاولة |
    | `plugin-sdk/provider-zai-endpoint` | مساعدات اكتشاف نقاط نهاية Z.A.I |
    | `plugin-sdk/infra-runtime` | مساعدات أحداث النظام/Heartbeat |
    | `plugin-sdk/collection-runtime` | مساعدات صغيرة لذاكرة تخزين مؤقت محدودة |
    | `plugin-sdk/diagnostic-runtime` | مساعدات الأعلام والأحداث التشخيصية |
    | `plugin-sdk/error-runtime` | مساعدات رسم الأخطاء البياني، والتنسيق، والتصنيف المشترك للأخطاء، و`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | مساعدات fetch المغلف، والوكيل، والبحث المثبّت |
    | `plugin-sdk/runtime-fetch` | fetch وقت التشغيل الواعي بالـ dispatcher بدون استيرادات الوكيل/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | قارئ محدود لنص الاستجابة بدون سطح media runtime الواسع |
    | `plugin-sdk/session-binding-runtime` | حالة ربط المحادثة الحالية بدون توجيه الربط المضبوط أو مخازن الاقتران |
    | `plugin-sdk/session-store-runtime` | مساعدات قراءة مخزن الجلسات بدون استيرادات واسعة لكتابة/صيانة الإعدادات |
    | `plugin-sdk/context-visibility-runtime` | تحليل ظهور السياق وتصفية السياق الإضافي بدون استيرادات واسعة للإعدادات/الأمان |
    | `plugin-sdk/string-coerce-runtime` | مساعدات ضيقة لإكراه/توحيد السلاسل والسجلات الأولية بدون استيرادات Markdown/التسجيل |
    | `plugin-sdk/host-runtime` | مساعدات توحيد أسماء المضيفين ومضيفي SCP |
    | `plugin-sdk/retry-runtime` | مساعدات إعداد إعادة المحاولة ومشغل إعادة المحاولة |
    | `plugin-sdk/agent-runtime` | مساعدات مجلد/هوية/مساحة عمل العامل |
    | `plugin-sdk/directory-runtime` | استعلام/إزالة تكرار الأدلة المعتمد على الإعدادات |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="المسارات الفرعية للإمكانيات والاختبار">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/media-runtime` | مساعدات مشتركة لجلب/تحويل/تخزين الوسائط بالإضافة إلى بناة حمولات الوسائط |
    | `plugin-sdk/media-store` | مساعدات ضيقة لمخزن الوسائط مثل `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | مساعدات مشتركة للرجوع الاحتياطي في توليد الوسائط، واختيار المرشحين، ورسائل النماذج المفقودة |
    | `plugin-sdk/media-understanding` | أنواع مزود فهم الوسائط بالإضافة إلى صادرات مساعدات الصور/الصوت المواجهة للمزود |
    | `plugin-sdk/text-runtime` | مساعدات مشتركة للنص/Markdown/التسجيل مثل إزالة النص المرئي للمساعد، ومساعدات عرض/تقسيم/جداول Markdown، ومساعدات التنقيح، ومساعدات وسوم التوجيه، وأدوات النص الآمن |
    | `plugin-sdk/text-chunking` | مساعد تقسيم النص الصادر |
    | `plugin-sdk/speech` | أنواع مزودات الكلام بالإضافة إلى صادرات التوجيه والسجل والتحقق والمساعدات الكلامية المواجهة للمزود |
    | `plugin-sdk/speech-core` | صادرات مشتركة لأنواع مزودات الكلام، والسجل، والتوجيه، والتوحيد، والمساعدات الكلامية |
    | `plugin-sdk/realtime-transcription` | أنواع مزودات النسخ الفوري، ومساعدات السجل، ومساعد WebSocket session المشترك |
    | `plugin-sdk/realtime-voice` | أنواع مزودات الصوت الفوري ومساعدات السجل |
    | `plugin-sdk/image-generation` | أنواع مزودات توليد الصور |
    | `plugin-sdk/image-generation-core` | أنواع مشتركة لتوليد الصور، ومساعدات الرجوع الاحتياطي، والمصادقة، والسجل |
    | `plugin-sdk/music-generation` | أنواع مزودات/طلبات/نتائج توليد الموسيقى |
    | `plugin-sdk/music-generation-core` | أنواع مشتركة لتوليد الموسيقى، ومساعدات الرجوع الاحتياطي، والبحث عن المزود، وتحليل model-ref |
    | `plugin-sdk/video-generation` | أنواع مزودات/طلبات/نتائج توليد الفيديو |
    | `plugin-sdk/video-generation-core` | أنواع مشتركة لتوليد الفيديو، ومساعدات الرجوع الاحتياطي، والبحث عن المزود، وتحليل model-ref |
    | `plugin-sdk/webhook-targets` | سجل أهداف Webhook ومساعدات تثبيت المسارات |
    | `plugin-sdk/webhook-path` | مساعدات توحيد مسار Webhook |
    | `plugin-sdk/web-media` | مساعدات مشتركة لتحميل الوسائط البعيدة/المحلية |
    | `plugin-sdk/zod` | إعادة تصدير `zod` لمستهلكي Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`، `shouldAckReaction` |
  </Accordion>

  <Accordion title="المسارات الفرعية للذاكرة">
    | المسار الفرعي | الصادرات الرئيسية |
    | --- | --- |
    | `plugin-sdk/memory-core` | سطح مساعد `memory-core` المضمّن لمساعدات المدير/الإعدادات/الملفات/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | واجهة وقت تشغيل لفهرس/بحث الذاكرة |
    | `plugin-sdk/memory-core-host-engine-foundation` | صادرات محرك الأساس لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-embeddings` | عقود التضمين الخاصة بمضيف الذاكرة، والوصول إلى السجل، والمزود المحلي، ومساعدات الدفعات/البعيد العامة |
    | `plugin-sdk/memory-core-host-engine-qmd` | صادرات محرك QMD لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-engine-storage` | صادرات محرك التخزين لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-multimodal` | مساعدات متعدد الوسائط لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-query` | مساعدات الاستعلام لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-secret` | مساعدات الأسرار لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-events` | مساعدات دفتر أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-status` | مساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-cli` | مساعدات وقت تشغيل CLI لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-core` | مساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-core-host-runtime-files` | مساعدات الملفات/وقت التشغيل لمضيف الذاكرة |
    | `plugin-sdk/memory-host-core` | اسم مستعار محايد للبائع لمساعدات وقت التشغيل الأساسية لمضيف الذاكرة |
    | `plugin-sdk/memory-host-events` | اسم مستعار محايد للبائع لمساعدات دفتر أحداث مضيف الذاكرة |
    | `plugin-sdk/memory-host-files` | اسم مستعار محايد للبائع لمساعدات ملفات/وقت تشغيل مضيف الذاكرة |
    | `plugin-sdk/memory-host-markdown` | مساعدات Markdown المُدار المشتركة للPlugins المجاورة للذاكرة |
    | `plugin-sdk/memory-host-search` | واجهة وقت تشغيل Active Memory للوصول إلى مدير البحث |
    | `plugin-sdk/memory-host-status` | اسم مستعار محايد للبائع لمساعدات حالة مضيف الذاكرة |
    | `plugin-sdk/memory-lancedb` | سطح مساعد `memory-lancedb` المضمّن |
  </Accordion>

  <Accordion title="المسارات الفرعية المحجوزة للمساعدات المضمّنة">
    | العائلة | المسارات الفرعية الحالية | الاستخدام المقصود |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | مساعدات دعم Plugin Browser المضمّن. يصدّر `browser-profiles` القيم `resolveBrowserConfig` و`resolveProfile` و`ResolvedBrowserConfig` و`ResolvedBrowserProfile` و`ResolvedBrowserTabCleanupConfig` للبنية الموحّدة `browser.tabCleanup`. وتبقى `browser-support` حاوية التوافق. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | سطح المساعد/وقت التشغيل المضمّن لـ Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | سطح المساعد/وقت التشغيل المضمّن لـ LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | سطح المساعد المضمّن لـ IRC |
    | مساعدات خاصة بالقنوات | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | أسطح توافق/مساعدة مضمّنة خاصة بالقنوات |
    | مساعدات خاصة بالمصادقة/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | أسطح مساعدة مضمّنة للميزات/Plugins؛ يصدّر `plugin-sdk/github-copilot-token` حاليًا `DEFAULT_COPILOT_API_BASE_URL` و`deriveCopilotApiBaseUrlFromToken` و`resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
