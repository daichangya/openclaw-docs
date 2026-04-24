---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-24T04:35:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753c7202a8a59ae9e420d436c7f3770ea455d810f2af52b716d438b84b8b986e
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці зібрано часто використовувані підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також з’являються там, але є
  деталлю реалізації, якщо лише сторінка документації явно не просуває їх.

  Посібник з авторства Plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Subpath                     | Key exports                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Кореневий експорт Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, запити allowlist, збирачі статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції конфігурації/контролю дій для кількох облікових записів, допоміжні функції резервного вибору типового облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікового запису + резервного вибору типового |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram із резервним bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні функції шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні функції життєвого циклу/фіналізації потоку чернеток |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції для побудови вхідних маршрутів і конвертів |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису й диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції вихідної ідентичності, делегата надсилання та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні функції нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу прив’язки потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий збирач payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки розмов/потоків, pairинг і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція знімка конфігурації часу виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції визначення групової політики часу виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції ухвалення рішень щодо доступу до груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції авторизації/захисту прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні функції інтерактивної відповіді. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для debounce вхідних повідомлень, зіставлення згадок, допоміжних функцій політики згадок і допоміжних функцій конвертів |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні функції debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні функції політики згадок і тексту згадок без ширшої поверхні часу виконання вхідних повідомлень |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні функції форматування вхідних конвертів |
    | `plugin-sdk/channel-location` | Допоміжні функції контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні функції логування каналу для відкинутих вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні функції дій над повідомленнями каналу, а також застарілі допоміжні функції native schema, збережені для сумісності Plugin |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення зворотного зв’язку/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API-ключів у часі виконання для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції onboarding/profile-write для API-ключів, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний збирач результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку env-var автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні збирачі replay-policy, допоміжні функції endpoint провайдера та допоміжні функції нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/можливостей endpoint провайдера, включно з допоміжними функціями multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування провайдерів web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/часу виконання провайдерів web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні функції сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібне |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні функції обгорток для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Власні допоміжні функції транспорту провайдера, як-от guarded fetch, перетворення транспортних повідомлень і доступні для запису потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні функції patch конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Допоміжні функції локальних для процесу singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні функції режиму активації груп і розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Збирачі команд/довідкових повідомлень, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції визначення затверджувача та автентифікації дій у межах того самого чату |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілів/фільтрів native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native-адаптери можливостей/доставки approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція визначення approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені допоміжні функції завантаження native approval adapter для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні функції часу виконання обробника approval; віддавайте перевагу вужчим adapter/gateway-швам, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді для exec/plugin approval |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні функції тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Допоміжні функції native command auth + native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Допоміжні функції нормалізації тіла команди та command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збирання secret-contract для поверхонь секретів каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні функції типізації `coerceSecretRef` і SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, DM gating, external-content і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції host allowlist і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні функції pinned-dispatcher без широкої infra runtime-поверхні |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned-dispatcher, SSRF-захищеного fetch і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції Webhook request/target |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції для розміру тіла запиту/тайм-аутів |
  </Accordion>

  <Accordion title="Підшляхи часу виконання та сховища">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні функції часу виконання/логування/резервного копіювання/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні функції реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції команд/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції pipeline для webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy runtime import/binding, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні функції клієнта Gateway і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Допоміжні функції завантаження/запису конфігурації та пошуку plugin-config |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки на дублікати/конфлікти, навіть коли поверхня bundled Telegram contract недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні функції exec/plugin approval, збирачі approval-capability, допоміжні функції auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції часу виконання для inbound/reply, chunking, dispatch, Heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції коротковіконної історії відповідей, як-от `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху до сховища сесій + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні функції шляхів до каталогів State/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції route/session-key/account binding, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції підсумку статусу каналу/облікового запису, типові стани runtime-state і допоміжні функції метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції target resolver |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Запускач команд із таймуванням і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні функції логера підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму та конвертації таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні функції читання/запису JSON state |
    | `plugin-sdk/file-lock` | Допоміжні функції повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції кешу дедуплікації на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні функції ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання read-only ACP binding без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema часу виконання агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції зіставлення та розв’язання небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції bootstrap пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних функцій passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції відповіді для команди `/models`/провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні функції native command registry/build/serialize |
    | `plugin-sdk/agent-harness` | Експериментальна trusted-plugin-поверхня для низькорівневих agent harness: типи harness, допоміжні функції steer/abort для active-run, допоміжні функції bridge інструментів OpenClaw і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні функції системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні функції обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Допоміжні функції графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого тіла відповіді без широкої media runtime-поверхні |
    | `plugin-sdk/session-binding-runtime` | Поточний стан binding розмови без routing налаштованих binding або pairing store |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції читання session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Допоміжні функції розв’язання видимості контексту та фільтрації додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні функції примусового приведення й нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації імен хостів і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні функції каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запити/дедуплікація каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store для медіа, а також збирачі media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні функції media store, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції failover для генерації медіа, вибір candidate і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів media understanding, а також експорти допоміжних функцій для зображень/аудіо, орієнтованих на провайдера |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції text/markdown/logging, як-от видалення assistant-visible text, допоміжні функції render/chunking/table для Markdown, допоміжні функції редагування чутливих даних, directive-tag і safe-text утиліти |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів speech, а також допоміжні функції directive, registry і validation, орієнтовані на провайдера |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів speech і допоміжні функції registry, directive та normalizації |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів realtime transcription, допоміжні функції registry і спільна допоміжна функція WebSocket session |
    | `plugin-sdk/realtime-voice` | Типи провайдерів realtime voice і допоміжні функції registry |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень і допоміжні функції failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики і допоміжні функції failover, lookup провайдера та розбору model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео і допоміжні функції failover, lookup провайдера та розбору model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні функції реєстру Webhook target і встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних функцій bundled memory-core для менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до registry, локальний провайдер і загальні допоміжні функції batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Багатомодальні допоміжні функції хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні функції core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до вендора псевдонім для допоміжних функцій core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до вендора псевдонім для допоміжних функцій журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до вендора псевдонім для допоміжних функцій файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні функції керованого Markdown для plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Runtime-фасад Active Memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Нейтральний до вендора псевдонім для допоміжних функцій статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних функцій bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні функції підтримки bundled browser plugin (`browser-support` залишається compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних функцій/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних функцій/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних функцій bundled IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шви сумісності/допоміжних функцій bundled channel |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви допоміжних функцій bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugin](/uk/plugins/building-plugins)
