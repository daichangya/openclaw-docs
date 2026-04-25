---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де знаходяться, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-25T03:24:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff08a1f6801329cd9c20353e77983c3333a4237db9217d19a621b670c1b636f
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK представлено як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог найуживаніших підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також наведені там, але є деталлю
  реалізації, якщо лише сторінка документації явно не просуває їх.

  Посібник з авторства Plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                    | Ключові експорти                                                                                                                       |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, підказки allowlist, побудовники стану налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для конфігурації/керування багатьма акаунтами, допоміжні засоби резервного використання акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікатора акаунта |
    | `plugin-sdk/account-resolution` | Пошук акаунта + допоміжні засоби резервного використання за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списків акаунтів/дій над акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із резервною bundled-contract сумісністю |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзування авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби маршрутизації вхідних повідомлень + побудови конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису та диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби доставки вихідних повідомлень, ідентичності, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок потоків та адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медіа-payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язки розмов/потоків, парування та налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації рантайму |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення групової політики рантайму |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/зведення стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби для рішень щодо групового доступу |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби авторизації/захисту прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel зворотної сумісності для debounce вхідних повідомлень, зіставлення згадок, допоміжних засобів політики згадок і допоміжних засобів конверта |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби debounce для вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування конверта вхідних повідомлень |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту й форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для відкидання вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій над повідомленнями каналу, а також застарілі допоміжні засоби native schema, збережені для сумісності Plugin |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted провайдера |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted провайдера, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Значення CLI backend за замовчуванням + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключа в рантаймі для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env vars для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політики replay, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації ідентифікатора моделі, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби можливостей HTTP/endpoint провайдера, HTTP-помилки провайдера та допоміжні засоби multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення вмикання Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і обмежені сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібне |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні засоби обгорток для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби native transport провайдера, такі як guarded fetch, перетворення transport message і потоки подій writable transport |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники команд/довідкових повідомлень, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Визначення затверджувача та допоміжні засоби автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native адаптери можливостей/доставки approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні засоби завантаження native approval adapter для гарячих точок входу каналу |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби approval handler runtime; надавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target + прив’язки акаунта |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби reply payload для exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload для exec/plugin approval, допоміжні засоби native approval routing/runtime і допоміжні засоби структурованого відображення approval, такі як `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Native command auth + допоміжні засоби native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легковагові предикати тексту команд для гарячих шляхів каналу |
    | `plugin-sdk/command-surface` | Нормалізація command-body і допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби trust, DM gating, external-content і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime import/binding, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби gateway client і channel-status patch |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису config і допоміжні засоби пошуку plugin-config |
    | `plugin-sdk/telegram-command-config` | Нормалізація імені/опису команд Telegram та перевірки дублікатів/конфліктів, навіть коли поверхня bundled Telegram contract недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби exec/plugin approval, побудовники approval-capability, допоміжні засоби auth/profile, native routing/runtime helpers і форматування шляху структурованого відображення approval |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, chunking, dispatch, Heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді та міток розмови |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби історії відповідей короткого вікна, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій + `updated-at` |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення стану каналу/акаунта, значення runtime-state за замовчуванням і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби target resolver |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Видобування рядкових URL із входів, подібних до fetch/request |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Загальні зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Видобування нормалізованих payload із об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Видобування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби subsystem logger і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і конвертації |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу дедуплікації з дисковим зберіганням |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/session і reply-dispatch для ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язок ACP лише для читання без import запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів парування |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді `/models` command/provider |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби steer/abort для active-run, допоміжні засоби мосту tool OpenClaw, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Зчитувач body відповіді з обмеженням без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без маршрутизації configured binding або сховищ парування |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби читання session-store без широких import запису/обслуговування config |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких import config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення і нормалізації primitive record/string без import markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогів із підтримкою config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store медіа, а також побудовники media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби media store, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів media understanding, а також орієнтовані на провайдера допоміжні експорти для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, такі як видалення видимого для помічника тексту, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також орієнтовані на провайдера допоміжні експорти directive, registry, validation і speech |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, registry, directive, normalization і допоміжні експорти speech |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби registry і спільний допоміжний засіб WebSocket session |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби registry |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошук провайдера та розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошук провайдера та розбір model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для менеджера/config/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексу/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до registry, локальний провайдер і загальні допоміжні засоби batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби CLI runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для допоміжних засобів core runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для plugin, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Active Memory runtime facade для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних засобів стану хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається barrel зворотної сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів bundled IRC |
    | Допоміжні засоби для конкретних каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шви сумісності/допоміжних засобів bundled каналів |
    | Допоміжні засоби для конкретних auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви допоміжних засобів bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
