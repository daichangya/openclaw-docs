---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і поверхонь допоміжних API
summary: 'Каталог підшляхів Plugin SDK: які імпорти де знаходяться, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-24T08:35:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK представлено як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог найуживаніших підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься у `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також наведені там, але є деталлю
  реалізації, якщо лише сторінка документації явно не просуває їх.

  Посібник з розробки Plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Subpath                     | Ключові експорти                                                                                                                       |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Кореневий експорт Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, запити allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції для конфігурації багатьох акаунтів/шлюзу дій, допоміжні функції резервного вибору типового акаунта |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку акаунта + резервного вибору типового |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції для списку акаунтів/дій над акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації Channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram з резервним bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні функції шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні функції життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції маршрутизації вхідних повідомлень + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису й диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції вихідної ідентичності, делегата надсилання та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні функції нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу прив’язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник media payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки розмов/потоків, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція знімка конфігурації середовища виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції визначення group-policy у середовищі виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції знімка/підсумку статусу Channel |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації Channel |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації Channel |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin Channel |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції рішень щодо доступу груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні функції інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для debounce вхідних повідомлень, зіставлення згадок, допоміжних функцій mention-policy та envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні функції debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні функції mention-policy і тексту згадок без ширшої поверхні середовища вхідних повідомлень |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні функції форматування envelope вхідних повідомлень |
    | `plugin-sdk/channel-location` | Допоміжні функції контексту та форматування розташування Channel |
    | `plugin-sdk/channel-logging` | Допоміжні функції логування Channel для відкинутих вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні функції дій із повідомленнями Channel, а також застарілі допоміжні функції native schema, збережені для сумісності Plugin |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту Channel |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локальних/self-hosted Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted Provider, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API-ключа під час виконання для Provider Plugin |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату auth OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні інтерактивні допоміжні функції входу для Provider Plugin |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку env-var auth Provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні функції endpoint Provider і допоміжні функції нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/можливостей endpoint Provider, включно з допоміжними функціями multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування Provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для Provider, яким не потрібне підключення ввімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, і scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/середовища виконання Provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні функції обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Власні допоміжні функції транспорту Provider, такі як guarded fetch, трансформації транспортних повідомлень і потоки подій транспорту з можливістю запису |
    | `plugin-sdk/provider-onboard` | Допоміжні функції патчу конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні функції режиму активації груп і розбору команд |
  </Accordion>

  <Accordion title="Підшляхи auth і security">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції визначення схвалювача та auth дій у межах того самого чату |
    | `plugin-sdk/approval-client-runtime` | Власні допоміжні функції профілю/фільтра схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Власні адаптери можливостей/доставки схвалення |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція визначення Gateway схвалення |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені допоміжні функції завантаження власного адаптера схвалення для гарячих точок входу Channel |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні функції середовища виконання обробника схвалення; надавайте перевагу вужчим поверхням adapter/gateway, якщо їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Власні допоміжні функції цілі схвалення + прив’язки акаунта |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді на схвалення exec/plugin |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні функції тестування контракту Channel без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Власні допоміжні функції auth команд + цілі сесії native |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів Channel |
    | `plugin-sdk/command-surface` | Допоміжні функції нормалізації тіла команд і поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збирання secret-contract для поверхонь секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні функції `coerceSecretRef` і типізації SecretRef для парсингу secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, шлюзу DM, зовнішнього вмісту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні функції pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned-dispatcher, fetch із захистом SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції парсингу введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції запиту/цілі Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і storage">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні функції runtime/logging/backup/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні функції реєстрації та пошуку runtime-context Channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції команд/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції pipeline Webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy import/binding runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, очікування та версії |
    | `plugin-sdk/gateway-runtime` | Допоміжні функції клієнта Gateway і patch статусу Channel |
    | `plugin-sdk/config-runtime` | Допоміжні функції завантаження/запису конфігурації та пошуку конфігурації plugin |
    | `plugin-sdk/telegram-command-config` | Нормалізація імен/описів команд Telegram та перевірки дублікатів/конфліктів, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні функції схвалення exec/plugin, побудовники можливостей схвалення, допоміжні функції auth/профілів, власні допоміжні функції маршрутизації/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції runtime для вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize відповідей і міток conversation |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції коротковіконної історії відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху session store + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні функції шляхів директорій state/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції route/session-key/прив’язки акаунта, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції зведення статусу Channel/акаунта, типові значення runtime-state і допоміжні функції метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції визначення цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягання рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Виконавець команд із таймером та нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені рідери параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягання нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягання канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні функції logger підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму та перетворення таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні функції читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні функції повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції кешу дедуплікації зберігання на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні функції runtime/сесії ACP і dispatch відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий рідер булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції початкового налаштування пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних функцій passive-channel, статусу та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції команди `/models`/відповідей Provider |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Власні допоміжні функції реєстру/build/serialize команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні функції steer/abort активного запуску, допоміжні функції моста tool OpenClaw, форматування/detail прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні функції системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні функції обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Допоміжні функції графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Рідер обмеженого тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без маршрутизації configured binding або pairing store |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції читання session store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні функції приведення й нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні функції директорії/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup директорій на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи capability і testing">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store для медіа, а також побудовники media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні функції media store, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції failover генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи Provider для розуміння медіа, а також орієнтовані на Provider експорти допоміжних функцій зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції text/markdown/logging, такі як вилучення видимого для асистента тексту, допоміжні функції render/chunking/table для Markdown, допоміжні функції редагування чутливих даних, допоміжні функції тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech Provider, а також орієнтовані на Provider допоміжні функції директив, реєстру та валідації |
    | `plugin-sdk/speech-core` | Спільні типи speech Provider, а також допоміжні функції реєстру, директив і нормалізації |
    | `plugin-sdk/realtime-transcription` | Типи Provider для транскрипції в реальному часі, допоміжні функції реєстру та спільна допоміжна функція сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи Provider для голосу в реальному часі та допоміжні функції реєстру |
    | `plugin-sdk/image-generation` | Типи Provider для генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, а також допоміжні функції failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи Provider/запитів/результатів для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні функції failover, пошуку Provider і парсингу model-ref |
    | `plugin-sdk/video-generation` | Типи Provider/запитів/результатів для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні функції failover, пошуку Provider і парсингу model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні функції реєстру цілей Webhook і встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних API bundled memory-core для допоміжних функцій manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до registry, локальний Provider і загальні допоміжні функції batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні функції multimodal хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції CLI runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні функції core runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Vendor-neutral псевдонім для допоміжних функцій core runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Vendor-neutral псевдонім для допоміжних функцій журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Vendor-neutral псевдонім для допоміжних функцій файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні функції managed-markdown для Plugin, суміжних із Memory |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Vendor-neutral псевдонім для допоміжних функцій статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних API bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні API підтримки bundled browser Plugin (`browser-support` залишається barrel сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних API/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних API/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних API bundled IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Поверхні сумісності/допоміжних API bundled Channel |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Поверхні допоміжних API bundled функцій/Plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
