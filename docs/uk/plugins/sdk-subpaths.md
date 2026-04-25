---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-25T21:24:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fcedbb91b0b5c6ee79ee7f18c2b68867e3818b0d37e9870a1d2ef3f848f52a
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог найуживаніших підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів розміщено в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також наведено там, але вони є деталями
  реалізації, якщо тільки сторінка документації явно не просуває їх.

  Щоб ознайомитися з посібником з розробки Plugin, див. [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                    | Ключові експорти                                                                                                                      |
  | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, підказки allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції для конфігурації кількох облікових записів / action-gate, допоміжні функції fallback для облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікового запису + fallback до облікового запису за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції для списку облікових записів / дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram із fallback до bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні функції шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні функції життєвого циклу/фіналізації потоку чернеток |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції маршрутизації вхідних повідомлень + побудови конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису й диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Полегшений пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції для вихідної доставки, ідентичності, делегата надсилання, сесії, форматування й планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні функції нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу прив’язок потоків і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медіа-payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки розмов/потоків, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція знімка конфігурації середовища виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції визначення групової політики середовища виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти prelude для Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції ухвалення рішень щодо групового доступу |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції автентифікації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка й застарілі допоміжні функції інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для debounce вхідних повідомлень, зіставлення згадок, допоміжних функцій політики згадок і допоміжних функцій конверта |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні функції debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні функції політики згадок і тексту згадок без ширшої поверхні середовища виконання вхідних повідомлень |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні функції форматування конверта вхідних повідомлень |
    | `plugin-sdk/channel-location` | Контекст розташування каналу й допоміжні функції форматування |
    | `plugin-sdk/channel-logging` | Допоміжні функції логування каналу для скидання вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні функції дій із повідомленнями каналу, а також застарілі допоміжні функції native schema, що збережені для сумісності Plugin |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локального/self-hosted провайдера |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted провайдера, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Значення CLI backend за замовчуванням + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API-ключа в середовищі виконання для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу API-ключів/запису профілів, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку змінних середовища для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні функції endpoint провайдера й допоміжні функції нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/endpoint-можливостей провайдера, помилки HTTP провайдера й допоміжні функції multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped-сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/середовища виконання провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку й спільні допоміжні функції обгорток для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні функції native transport провайдера, такі як guarded fetch, перетворення transport message і writable transport event streams |
    | `plugin-sdk/provider-onboard` | Допоміжні функції патчингу конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні функції режиму активації групи й розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції визначення затверджувача й автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native-адаптери можливостей/доставки approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція визначення approval Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені допоміжні функції завантаження native approval adapter для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні функції середовища виконання для approval handler; віддавайте перевагу вужчим adapter/gateway seam, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді для exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Допоміжні функції payload для exec/plugin approval, допоміжні функції маршрутизації/середовища виконання native approval, а також допоміжні функції структурованого відображення approval, такі як `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні функції тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Native command auth, форматування меню динамічних аргументів і допоміжні функції native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Допоміжні функції нормалізації command-body і command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збирання secret-contract для поверхонь секретів каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні функції `coerceSecretRef` і типізації SecretRef для парсингу secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, DM gating, зовнішнього вмісту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції host allowlist і політики SSRF приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі pinned-dispatcher helper без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned-dispatcher, SSRF-захищеного fetch і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції парсингу введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції запиту/цілі Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні функції середовища виконання/логування/резервного копіювання/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції env середовища виконання, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні функції реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції команд/хуків/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції pipeline для Webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy import/binding середовища виконання, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, wait, version, argument-invocation і lazy command-group |
    | `plugin-sdk/gateway-runtime` | Допоміжні функції клієнта Gateway і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Допоміжні функції завантаження/запису конфігурації та пошуку конфігурації plugin |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації імен/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня bundled Telegram contract недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні функції approval для exec/plugin, побудовники approval-capability, допоміжні функції auth/profile, допоміжні функції native routing/runtime і форматування шляху структурованого відображення approval |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції середовища виконання для inbound/reply, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize відповідей і міток conversation |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції коротковіконної історії відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/Markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху session store + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні функції шляхів каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції підсумку статусу каналу/облікового запису, значення runtime-state за замовчуванням і допоміжні функції метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції визначення цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні функції subsystem logger і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму та перетворення таблиць Markdown |
    | `plugin-sdk/json-store` | Допоміжні функції читання/запису малого JSON state |
    | `plugin-sdk/file-lock` | Повторно вхідні допоміжні функції file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції кешу дедуплікації з дисковою підтримкою |
    | `plugin-sdk/acp-runtime` | Допоміжні функції ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання binding ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema середовища виконання агента |
    | `plugin-sdk/boolean-param` | Нестрогий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції bootstrap пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних функцій passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції команди `/models`/відповіді провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні функції реєстру/build/serialize native command |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harness: типи harness, допоміжні функції steer/abort активного запуску, місток tool OpenClaw, допоміжні функції форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Допоміжні функції системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Допоміжні функції малого обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Допоміжні функції графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений зчитувач response-body без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан binding розмови без маршрутизації configured binding або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції читання session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Допоміжні функції визначення видимості контексту та фільтрації додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні функції приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні функції каталогів/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store медіа, а також побудовники media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні функції media store, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції failover генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдера розуміння медіа, а також орієнтовані на провайдер експорти допоміжних функцій для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції text/Markdown/logging, такі як видалення видимого для асистента тексту, допоміжні функції рендерингу/chunking/таблиць Markdown, допоміжні функції редагування чутливих даних, directive-tag і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech provider, а також орієнтовані на провайдер експорти directive, registry, validation і speech helper |
    | `plugin-sdk/speech-core` | Спільні типи speech provider, експорти registry, directive, normalization і speech helper |
    | `plugin-sdk/realtime-transcription` | Типи провайдера realtime transcription, допоміжні функції registry і спільна допоміжна функція сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдера realtime voice і допоміжні функції registry |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні функції failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні функції failover, пошуку провайдера та парсингу model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні функції failover, пошуку провайдера та парсингу model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні функції встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних функцій bundled memory-core для manager/config/file/CLI helper |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання індексації/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до registry, локальний провайдер і загальні batch/remote helper |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні helper хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Helper запитів хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Helper секретів хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Helper журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Helper статусу хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper середовища виконання CLI хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Базові helper середовища виконання хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper файлів/середовища виконання хоста Memory |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для базових helper середовища виконання хоста Memory |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для helper журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для helper файлів/середовища виконання хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні helper керованого Markdown для plugin, пов’язаних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад середовища виконання Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для helper статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних функцій bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні helper підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` лишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper/середовища виконання bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper/середовища виконання bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних функцій bundled IRC |
    | Допоміжні функції для конкретних каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Bundled шви сумісності/допоміжних функцій каналів |
    | Допоміжні функції для автентифікації/конкретних plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Bundled шви допоміжних функцій функцій/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugin](/uk/plugins/building-plugins)
