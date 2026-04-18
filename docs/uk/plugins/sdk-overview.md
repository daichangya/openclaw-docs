---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте певний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-18T20:44:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 522c2c542bc0ea4793541fda18931b963ad71f07e9c83e4f22f05184eb1ba91a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugins і ядром. Ця сторінка є
довідником щодо **що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте покроковий посібник?**
  - Перший plugin? Почніть із [Початок роботи](/uk/plugins/building-plugins)
  - Plugin каналу? Див. [Plugins каналів](/uk/plugins/sdk-channel-plugins)
  - Plugin провайдера? Див. [Plugins провайдерів](/uk/plugins/sdk-provider-plugins)
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це забезпечує швидкий
запуск і запобігає проблемам із циклічними залежностями. Для специфічних до
каналів допоміжних засобів entry/build віддавайте перевагу
`openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої поверхні umbrella та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Не додавайте і не використовуйте зручні seam-інтерфейси з іменами провайдерів,
такі як `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні seam-інтерфейси з брендуванням каналів. Вбудовані plugins повинні
компонувати універсальні підшляхи SDK у власних barrel-файлах `api.ts` або
`runtime-api.ts`, а ядро повинно або використовувати ці локальні для plugin
barrel-файли, або додавати вузький універсальний контракт SDK, коли потреба
справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних
seam-інтерфейсів для вбудованих plugins, таких як `plugin-sdk/feishu`,
`plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки та сумісності вбудованих plugins; їх
навмисно не включено до загальної таблиці нижче, і вони не є рекомендованим
шляхом імпорту для нових сторонніх plugins.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів знаходиться в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи для вбудованих plugins усе ще з’являються в
цьому згенерованому списку. Розглядайте їх як поверхні деталей реалізації /
сумісності, якщо лише якась сторінка документації прямо не позначає одну з них
як публічну.

### Вхідна точка plugin

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
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, підказки allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для багатокористувацьких облікових записів config/action-gate, допоміжні засоби fallback для облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + fallback до значення за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списку облікових записів / дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми config каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із fallback до контракту вбудованого комплекту |
    | `plugin-sdk/command-gating` | Допоміжні засоби вузького gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби побудови вхідних маршрутів і envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису та dispatch для вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби делегування вихідної ідентичності/надсилання |
    | `plugin-sdk/poll-runtime` | Допоміжні засоби вузької нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Життєвий цикл прив’язок потоків і допоміжні засоби адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник media payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб snapshot конфігурації під час виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення group-policy під час виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви schema config каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису config каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання config allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби прийняття рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби нормалізації/скорочення interactive reply payload |
    | `plugin-sdk/channel-inbound` | Compatibility barrel для debounce вхідних повідомлень, зіставлення згадок, допоміжних засобів mention-policy та допоміжних засобів envelope |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для відкинутих вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату reply |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контрактів каналів |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних / self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення CLI backend за замовчуванням + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключів під час виконання для plugins провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для plugins провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env var для auth провайдерів |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Універсальні допоміжні засоби HTTP/endpoint capability для провайдерів |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту config/selection для web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/cache для провайдерів web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/credential для web-search для провайдерів, яким не потрібне підключення enable plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту config/credential для web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped-сетери/гетери credential |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/cache/runtime для провайдерів web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні засоби wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, такі як guarded fetch, перетворення transport message і записувані потоки подій transport |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби singleton/map/cache на рівні процесу |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення апробувальника та auth дій у тому ж чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативної approval capability/delivery |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway для approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні засоби завантаження нативного approval adapter для гарячих entrypoint каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime для approval handler; віддавайте перевагу вужчим seam-інтерфейсам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби reply payload для exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Допоміжні засоби native command auth + native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-surface` | Нормалізація command-body та допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь secret каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, external-content і збирання secret |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби host allowlist і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої infra runtime surface |
    | `plugin-sdk/ssrf-runtime` | Підтримка pinned-dispatcher, fetch із захистом SSRF і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби request/target для Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби для розміру body request / timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Універсальні допоміжні засоби реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби command/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline для Webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime import/binding, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта Gateway і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису config |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби exec/plugin approval, побудовники approval capability, допоміжні засоби auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, chunking, dispatch, Heartbeat, планувальник reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize для reply |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії reply, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking для text/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби для шляху session store + `updated-at` |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби summary статусу каналу/облікового запису, значення runtime-state за замовчуванням і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби визначення цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягує рядкові URL із входів типу fetch/request |
    | `plugin-sdk/run-command` | Timed-засіб запуску команд із нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Загальні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягує нормалізовані payload із об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягує канонічні поля цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів для тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби subsystem logger і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON state |
    | `plugin-sdk/file-lock` | Реентерабельні допоміжні засоби file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу dedupe з дисковим збереженням |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення binding ACP лише для читання без імпортів lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema config runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач логічних параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби початкового налаштування пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби reply для команди `/models` / провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize для native command |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби bridge інструментів OpenClaw і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби прапорців і подій діагностики |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач body response з обмеженням без широкої media runtime surface |
    | `plugin-sdk/session-binding-runtime` | Поточний стан binding розмови без routing configured binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби читання session-store без широких імпортів запису/обслуговування config |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби примітивного приведення/нормалізації record/рядків без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і хоста SCP |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогів/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запити/усунення дублікатів каталогів на основі config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також побудовники media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів media understanding, а також exports допоміжних засобів для зображень/аудіо, орієнтованих на провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, такі як видалення тексту, видимого асистенту, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби тегів директив і утиліти safe-text |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking для вихідного text |
    | `plugin-sdk/speech` | Типи провайдерів speech, а також exports допоміжних засобів директив, реєстру та валідації, орієнтованих на провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів speech, допоміжні засоби реєстру, директив і нормалізації |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів realtime transcription і допоміжні засоби реєстру |
    | `plugin-sdk/realtime-voice` | Типи провайдерів realtime voice і допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до реєстру, локальний провайдер і універсальні допоміжні засоби batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Багатомодальні допоміжні засоби хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби CLI runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби основного runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо вендора псевдонім для допоміжних засобів основного runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо вендора псевдонім для допоміжних засобів журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо вендора псевдонім для допоміжних засобів файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого Markdown для plugins, пов’язаних із memory |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо вендора псевдонім для допоміжних засобів статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin (`browser-support` залишається compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів bundled IRC |
    | Допоміжні засоби для конкретних каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Bundled seam-інтерфейси сумісності/допоміжних засобів каналів |
    | Допоміжні засоби для конкретних auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Bundled seam-інтерфейси допоміжних засобів функцій/plugins; `plugin-sdk/github-copilot-token` зараз експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                          |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)            |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend inference для CLI  |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями          |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в realtime     |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в realtime  |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео         |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                  |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                     |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                      |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape         |
| `api.registerWebSearchProvider(...)`             | Вебпошук                             |

### Інструменти та команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)         |

### Інфраструктура

| Method                                         | Що реєструє                     |
| ---------------------------------------------- | ------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                       |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway           |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway               |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                  |
| `api.registerService(service)`                 | Фонова служба                   |
| `api.registerInteractiveHandler(registration)` | Інтерактивний handler           |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивний розділ prompt, пов’язаний із memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний corpus пошуку/читання memory |

Зарезервовані простори імен core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область gateway method. Для методів, що належать plugin,
віддавайте перевагу префіксам, специфічним для plugin.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, що належать registrar
- `descriptors`: дескриптори команд на етапі розбору, що використовуються для кореневої довідки CLI,
  маршрутизації та lazy-реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася lazy-loaded у звичайному
кореневому шляху CLI, надайте `descriptors`, які охоплюють кожен корінь
команди верхнього рівня, що надається цим registrar.

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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте `commands` окремо лише тоді, коли вам не потрібна lazy-реєстрація
кореневого CLI. Цей eager-сумісний шлях і далі підтримується, але він не
встановлює placeholders на основі descriptor для lazy loading на етапі розбору.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає змогу plugin володіти config за замовчуванням для локального
backend AI CLI, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в model ref, наприклад `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  значення plugin за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписування для сумісності після об’єднання
  (наприклад, для нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб engine міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість memory                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Побудовник розділу prompt для memory                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Засіб визначення плану flush для memory                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime для memory                                                                                                                          |

### Адаптери embedding для memory

| Method                                         | Що реєструє                               |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для memory для активного plugin |

- `registerMemoryCapability` — це рекомендований API ексклюзивного plugin для memory.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugins могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватного layout
  конкретного plugin memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застаріло-сумісні API ексклюзивного plugin для memory.
- `registerMemoryEmbeddingProvider` дає змогу активному plugin memory зареєструвати один
  або більше id адаптерів embedding (наприклад, `openai`, `gemini` або користувацький id, визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Method                                       | Що робить                   |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек визначення binding розмови |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як і пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як і пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler заявляє про dispatch, handler-и з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як і пропуск `cancel`), а не як перевизначення.

### Поля об’єкта API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор plugin                                                                        |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                               |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                 |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                      |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                    |
| `api.config`             | `OpenClawConfig`          | Поточний snapshot config (активний runtime snapshot у пам’яті, якщо доступний)             |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація plugin, специфічна для plugin, з `plugins.entries.<id>.config`                |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                            |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легковагове вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначає шлях відносно кореня plugin                                                        |

## Угода щодо внутрішніх модулів

У межах вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшений entry лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Facade-loaded публічні поверхні вбудованих plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли) тепер надають
перевагу активному runtime snapshot config, коли OpenClaw уже запущено. Якщо
runtime snapshot ще не існує, вони повертаються до resolved config-файлу на диску.

Plugins провайдерів також можуть надавати вузький локальний barrel контракту plugin,
коли допоміжний засіб навмисно є специфічним для провайдера і поки що не належить
до універсального підшляху SDK. Поточний вбудований приклад: провайдер Anthropic
зберігає свої допоміжні засоби Claude stream у власному публічному seam
`api.ts` / `contract-api.ts` замість просування логіки Anthropic beta-header і
`service_tier` до універсального контракту `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує побудовники провайдера,
  допоміжні засоби моделі за замовчуванням і побудовники realtime-провайдерів
- `@openclaw/openrouter-provider`: `api.ts` експортує побудовник провайдера, а також
  допоміжні засоби онбордингу/config

<Warning>
  Production-код extension також повинен уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, просуньте його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість зв’язування двох plugins між собою.
</Warning>

## Пов’язане

- [Точки входу](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Допоміжні засоби runtime](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Налаштування і config](/uk/plugins/sdk-setup) — пакування, маніфести, schema config
- [Тестування](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [Міграція SDK](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Внутрішня будова plugins](/uk/plugins/architecture) — детальна архітектура та модель можливостей
