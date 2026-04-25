---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту плагіна
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-25T01:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: f24d5add576ec0985d8d4335fb244ffcc1b9fc4643b87f4d72d42ec44b138520
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог часто використовуваних підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів розміщено в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також там присутні, але є деталлю
  реалізації, якщо лише якась сторінка документації явно не просуває їх.

  Посібник з розробки плагінів дивіться в [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Вхід плагіна

  | Підшлях                     | Ключові експорти                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Кореневий експорт Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, allowlist-промпти, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції для мультиакаунтної конфігурації/action-gate, допоміжні функції резервного вибору акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук акаунта + допоміжні функції резервного вибору за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції для списку акаунтів/дій із акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram із резервом bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні функції шлюзування авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні функції життєвого циклу/фіналізації потоків чернеток |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції маршрутизації вхідних повідомлень + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису та dispatch вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції вихідної ідентичності, send delegate і планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні функції нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу та адаптерів прив’язок потоків |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник media payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки conversation/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції визначення group-policy для runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції auth/guard для direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичне подання повідомлень, доставка та застарілі допоміжні функції інтерактивних відповідей. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для debounce вхідних повідомлень, зіставлення згадок, допоміжних функцій mention-policy та helper-функцій envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні функції debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні функції mention-policy і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні функції форматування вхідних envelope |
    | `plugin-sdk/channel-location` | Допоміжні функції контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні функції логування каналів для відкинутих вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні функції дій із повідомленнями каналу, а також застарілі допоміжні функції нативної схеми, збережені для сумісності плагінів |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, а також типи secret target |
  </Accordion>

  <Accordion title="Підшляхи постачальників">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локальних/self-hosted постачальників |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted постачальників, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням для CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API-ключів у runtime для плагінів постачальників |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для плагінів постачальників |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку auth env vars постачальника |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, helper-функції endpoint постачальників і helper-функції нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/можливостей endpoint постачальника, помилки HTTP постачальника та helper-функції multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування постачальника web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для постачальників, яким не потрібне підключення enable plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/runtime для постачальника web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також helper-функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream і спільні helper-функції обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Нативні helper-функції транспорту постачальника, такі як guarded fetch, перетворення транспортних повідомлень і придатні для запису потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні функції patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні функції режиму активації груп і розбору команд |
  </Accordion>

  <Accordion title="Підшляхи auth і security">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper-функції реєстру команд, helper-функції авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Визначення затверджувача та helper-функції auth дій у межах того самого чату |
    | `plugin-sdk/approval-client-runtime` | Helper-функції профілю/фільтра нативного exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки нативного approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільна helper-функція визначення gateway approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі helper-функції завантаження адаптера нативного approval для hot entrypoint каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші helper-функції runtime обробника approval; віддавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Нативний approval target + helper-функції прив’язки акаунта |
    | `plugin-sdk/approval-reply-runtime` | Helper-функції payload відповіді exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Helper-функції payload exec/plugin approval, helper-функції маршрутизації/runtime нативного approval та helper-функції структурованого відображення approval, такі як `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі helper-функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі helper-функції тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативний command auth + helper-функції target нативної сесії |
    | `plugin-sdk/command-detection` | Спільні helper-функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для hot path каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та helper-функції command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі helper-функції збирання secret-contract для поверхонь secrets каналу/плагіна |
    | `plugin-sdk/secret-ref-runtime` | Вузькі helper-функції типізації `coerceSecretRef` і SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні helper-функції trust, DM gating, external-content і збирання secrets |
    | `plugin-sdk/ssrf-policy` | Helper-функції policy SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі helper-функції pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Helper-функції pinned-dispatcher, fetch із захистом SSRF і policy SSRF |
    | `plugin-sdk/secret-input` | Helper-функції розбору secret input |
    | `plugin-sdk/webhook-ingress` | Helper-функції запиту/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper-функції розміру тіла запиту/timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і storage">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі helper-функції runtime/logging/backup/встановлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі helper-функції env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні helper-функції реєстрації та lookup runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні helper-функції command/hook/http/interactive для плагінів |
    | `plugin-sdk/hook-runtime` | Спільні helper-функції pipeline Webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Helper-функції lazy import/binding для runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper-функції exec процесів |
    | `plugin-sdk/cli-runtime` | Helper-функції форматування CLI, wait і version |
    | `plugin-sdk/gateway-runtime` | Helper-функції клієнта Gateway і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Helper-функції завантаження/запису config і lookup конфігурації плагіна |
    | `plugin-sdk/telegram-command-config` | Нормалізація імен/описів команд Telegram та перевірки дублікатів/конфліктів, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helper-функції approval exec/plugin, побудовники approval-capability, helper-функції auth/profile, helper-функції нативної маршрутизації/runtime та форматування шляху структурованого відображення approval |
    | `plugin-sdk/reply-runtime` | Спільні helper-функції runtime вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, planner відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper-функції dispatch/finalize відповідей і міток conversation |
    | `plugin-sdk/reply-history` | Спільні helper-функції short-window history відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі helper-функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Helper-функції шляху сховища сесій + updated-at |
    | `plugin-sdk/state-paths` | Helper-функції шляхів каталогів state/OAuth |
    | `plugin-sdk/routing` | Helper-функції route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні helper-функції summary статусу каналу/акаунта, значення за замовчуванням для runtime-state та helper-функції метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні helper-функції target resolver |
    | `plugin-sdk/string-normalization-runtime` | Helper-функції нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягування рядкових URL з fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Виконавець timed command із нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів send target з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні helper-функції шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Helper-функції logger підсистеми і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Helper-функції режиму та конвертації таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі helper-функції читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Реентерабельні helper-функції file-lock |
    | `plugin-sdk/persistent-dedupe` | Helper-функції кешу дедуплікації з дисковим зберіганням |
    | `plugin-sdk/acp-runtime` | Helper-функції runtime/сесії ACP і dispatch відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only визначення прив’язки ACP без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Helper-функції визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Helper-функції початкового налаштування пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви helper-функцій passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helper-функції `/models` command/provider reply |
    | `plugin-sdk/skill-commands-runtime` | Helper-функції списку команд Skills |
    | `plugin-sdk/native-command-registry` | Helper-функції реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, helper-функції steer/abort активного запуску, helper-функції bridge tool OpenClaw, helper-функції форматування/detail прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Helper-функції виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper-функції системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі helper-функції обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Helper-функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Helper-функції графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper-функції обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Зчитувач обмеженого тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації configured binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Helper-функції читання сховища сесій без широких імпортів запису/обслуговування config |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі helper-функції приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Helper-функції нормалізації hostname і хостів SCP |
    | `plugin-sdk/retry-runtime` | Helper-функції конфігурації retry і runner retry |
    | `plugin-sdk/agent-runtime` | Helper-функції каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запити/дедуплікація каталогів на основі config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи capabilities і testing">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні helper-функції fetch/transform/store медіа, а також побудовники media payload |
    | `plugin-sdk/media-store` | Вузькі helper-функції media store, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні helper-функції failover генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи постачальників media understanding, а також експорти helper-функцій для зображень/аудіо, орієнтовані на постачальників |
    | `plugin-sdk/text-runtime` | Спільні helper-функції text/markdown/logging, такі як видалення тексту, видимого асистенту, helper-функції render/chunking/table для markdown, helper-функції редагування чутливих даних, helper-функції тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Helper-функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи постачальників speech, а також експорти directive, registry, validation і speech helper, орієнтовані на постачальників |
    | `plugin-sdk/speech-core` | Спільні типи постачальників speech, registry, directive, normalization і speech helper exports |
    | `plugin-sdk/realtime-transcription` | Типи постачальників realtime transcription, helper-функції registry і спільна helper-функція сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи постачальників realtime voice і helper-функції registry |
    | `plugin-sdk/image-generation` | Типи постачальників генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, helper-функції failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи постачальника/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, helper-функції failover, lookup постачальника і розбір model-ref |
    | `plugin-sdk/video-generation` | Типи постачальника/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, helper-функції failover, lookup постачальника і розбір model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і helper-функції встановлення route |
    | `plugin-sdk/webhook-path` | Helper-функції нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні helper-функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для користувачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Вбудована допоміжна поверхня memory-core для helper-функцій manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексації/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embeddings хоста пам’яті, доступ до registry, локальний постачальник і загальні batch/remote helper-функції |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні helper-функції хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Helper-функції query хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Helper-функції secret хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Helper-функції журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Helper-функції статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper-функції CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Основні helper-функції runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper-функції файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для основних helper-функцій runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для helper-функцій журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для helper-функцій файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні helper-функції managed-markdown для плагінів, пов’язаних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Runtime facade Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для helper-функцій статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Вбудована допоміжна поверхня memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначене використання |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні helper-функції підтримки вбудованого browser plugin (`browser-support` залишається compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper-функцій/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper-функцій/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Допоміжна поверхня вбудованого IRC |
    | Допоміжні функції для окремих каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Вбудовані compatibility/helper seams каналів |
    | Допоміжні функції для auth/окремих плагінів | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Вбудовані helper seams для функцій/плагінів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
