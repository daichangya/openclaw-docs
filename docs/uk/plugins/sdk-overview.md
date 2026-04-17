---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати```
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-17T15:49:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05d3d0022cca32d29c76f6cea01cdf4f88ac69ef0ef3d7fb8a60fbf9a6b9b331
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між плагінами та ядром. Ця сторінка є
довідником про **що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте практичний посібник?**
  - Перший плагін? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Плагін каналу? Дивіться [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Плагін провайдера? Дивіться [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Угода щодо імпортів

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналів
хелперів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; а
`openclaw/plugin-sdk/core` залишайте для ширшої узагальнювальної поверхні та
спільних хелперів, таких як `buildChannelConfigSchema`.

Не додавайте і не покладайтеся на зручні шари з назвами провайдерів, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шари з брендуванням каналів. Вбудовані плагіни мають компонувати
загальні підшляхи SDK усередині власних barrel-модулів `api.ts` або
`runtime-api.ts`, а ядро має або використовувати ці локальні barrel-модулі
плагіна, або додавати вузький загальний контракт SDK, коли потреба справді є
міжканальною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних шарів
вбудованих плагінів, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки вбудованих плагінів і сумісності; їх
навмисно пропущено в поширеній таблиці нижче, і вони не є рекомендованим
шляхом імпорту для нових сторонніх плагінів.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів розміщено в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи вбудованих плагінів усе ще з’являються в цьому
згенерованому списку. Розглядайте їх як деталі реалізації / поверхні сумісності,
якщо лише якась сторінка документації явно не просуває одну з них як публічну.

### Точка входу плагіна

| Підшлях                    | Ключові експорти                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні хелпери майстра налаштування, підказки allowlist, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Хелпери конфігурації/гейтів дій для кількох акаунтів, хелпери fallback для акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, хелпери нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук акаунта + хелпери fallback за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі хелпери для списків акаунтів/дій акаунтів |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Хелпери нормалізації/валідації користувацьких команд Telegram із fallback на вбудований контракт |
    | `plugin-sdk/command-gating` | Вузькі хелпери гейтів авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні хелпери побудови вхідних маршрутів та envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні хелпери запису та диспетчеризації вхідних даних |
    | `plugin-sdk/messaging-targets` | Хелпери розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні хелпери завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Хелпери ідентичності вихідних повідомлень/делегування надсилання |
    | `plugin-sdk/poll-runtime` | Вузькі хелпери нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Хелпери життєвого циклу та адаптерів прив’язок потоків |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор медіа-навантаження агента |
    | `plugin-sdk/conversation-runtime` | Хелпери прив’язки розмов/потоків, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Хелпер знімка конфігурації під час виконання |
    | `plugin-sdk/runtime-group-policy` | Хелпери визначення групової політики під час виконання |
    | `plugin-sdk/channel-status` | Спільні хелпери знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Хелпери авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Хелпери редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні хелпери рішень щодо доступу до груп |
    | `plugin-sdk/direct-dm` | Спільні хелпери авторизації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Хелпери нормалізації/редукції інтерактивного payload відповіді |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для debounce вхідних даних, зіставлення згадок, хелперів політики згадок та хелперів envelope |
    | `plugin-sdk/channel-mention-gating` | Вузькі хелпери політики згадок без ширшої runtime-поверхні вхідних даних |
    | `plugin-sdk/channel-location` | Хелпери контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Хелпери журналювання каналу для відкинутих вхідних подій і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Хелпери розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери контракту секретів, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські хелпери налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані хелпери налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Стандартні значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Хелпери визначення API-ключа під час виконання для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Хелпери онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні хелпери інтерактивного входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Хелпери пошуку змінних середовища для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політики повтору, хелпери endpoint провайдера та хелпери нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні хелпери HTTP/можливостей endpoint провайдерів |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі хелпери контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Хелпери реєстрації/кешування провайдерів web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі хелпери конфігурації/облікових даних web-search для провайдерів, яким не потрібне зв’язування ввімкнення плагіна |
    | `plugin-sdk/provider-web-search-contract` | Вузькі хелпери контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped-сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Хелпери реєстрації/кешування/виконання провайдерів web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також хелпери сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper, а також спільні хелпери wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Хелпери патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Хелпери process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, хелпери реєстру команд, хелпери авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Визначення затверджувача та хелпери автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Хелпери профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки native approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний хелпер визначення approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені хелпери завантаження адаптера native approval для гарячих entrypoint каналу |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-хелпери approval handler; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Хелпери native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Хелпери payload відповіді exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Хелпери native command auth + native session-target |
    | `plugin-sdk/command-detection` | Спільні хелпери виявлення команд |
    | `plugin-sdk/command-surface` | Хелпери нормалізації command-body та command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери збирання секретних контрактів для поверхонь секретів каналу/плагіна |
    | `plugin-sdk/secret-ref-runtime` | Вузькі хелпери `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні хелпери довіри, DM gating, зовнішнього вмісту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Хелпери allowlist хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі pinned-dispatcher хелпери без широкої infra runtime-поверхні |
    | `plugin-sdk/ssrf-runtime` | Хелпери pinned-dispatcher, fetch із захистом від SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Хелпери розбору secret input |
    | `plugin-sdk/webhook-ingress` | Хелпери запиту/цілі Webhook |
    | `plugin-sdk/webhook-request-guards` | Хелпери розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі хелпери runtime, логування, резервного копіювання та встановлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі хелпери runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні хелпери реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні хелпери команд, hook, http та interactive для плагінів |
    | `plugin-sdk/hook-runtime` | Спільні хелпери pipeline для webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Хелпери lazy runtime import/binding, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Хелпери виконання процесів |
    | `plugin-sdk/cli-runtime` | Хелпери форматування CLI, очікування та версії |
    | `plugin-sdk/gateway-runtime` | Хелпери клієнта Gateway і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Хелпери завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Хелпери нормалізації назв/описів команд Telegram і перевірок дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Хелпери exec/plugin approval, конструктори approval-capability, хелпери auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні runtime-хелпери для inbound/reply, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі хелпери dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні хелпери коротковіконної історії відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі хелпери chunking для text/markdown |
    | `plugin-sdk/session-store-runtime` | Хелпери шляху до сховища сесій + `updated-at` |
    | `plugin-sdk/state-paths` | Хелпери шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Хелпери прив’язки route/session-key/account, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні хелпери зведення статусу каналу/акаунта, стандартні значення runtime-state та хелпери метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні хелпери target resolver |
    | `plugin-sdk/string-normalization-runtime` | Хелпери нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL з fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Запуск команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні хелпери шляхів до тимчасових завантажень |
    | `plugin-sdk/logging-core` | Хелпери журналювання підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Хелпери режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі хелпери читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Хелпери повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Хелпери кешу дедуплікації зберігання на диску |
    | `plugin-sdk/acp-runtime` | Хелпери ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язок ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Хелпери визначення збігу небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Хелпери початкового налаштування пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви хелперів passive-channel, status та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Хелпери `/models` command/provider reply |
    | `plugin-sdk/skill-commands-runtime` | Хелпери виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Хелпери native command registry/build/serialize |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, хелпери steer/abort для active-run, хелпери мосту інструментів OpenClaw та утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Хелпери виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Хелпери системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі хелпери обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Хелпери діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні хелпери класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Хелпери обгорнутого fetch, proxy та pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Зчитувач тіла відповіді з обмеженням без широкої media runtime-поверхні |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без маршрутизації налаштованих прив’язок або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Хелпери читання сховища сесій без широких імпортів запису/підтримки конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі хелпери приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Хелпери нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Хелпери конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Хелпери каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогів із підтримкою конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні хелпери fetch/transform/store для медіа, а також конструктори media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні хелпери failover для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також провайдер-орієнтовані експорти хелперів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні хелпери text/markdown/logging, такі як видалення видимого для асистента тексту, хелпери render/chunking/table для markdown, хелпери редагування чутливих даних, хелпери тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Хелпер chunking для вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також провайдер-орієнтовані хелпери directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, хелпери registry, directive і normalization |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі та хелпери registry |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та хелпери registry |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, хелпери failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, хелпери failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, хелпери failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/webhook-targets` | Хелпери реєстру цілей Webhook та встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Хелпери нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні хелпери завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня хелперів bundled `memory-core` для хелперів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад індексування/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до registry, локальний провайдер і загальні хелпери batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні хелпери хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Хелпери запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Хелпери секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Хелпери журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Хелпери статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Runtime-хелпери CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Основні runtime-хелпери хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Хелпери файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо вендора псевдонім для основних runtime-хелперів хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо вендора псевдонім для хелперів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо вендора псевдонім для хелперів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні хелпери керованого markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Runtime-фасад Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо вендора псевдонім для хелперів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня хелперів bundled `memory-lancedb` |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих хелперів">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Хелпери підтримки вбудованого browser plugin (`browser-support` залишається barrel-модулем сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня хелперів/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня хелперів/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня хелперів вбудованого IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шви сумісності/хелперів вбудованих каналів |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви хелперів вбудованих можливостей/плагінів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | What it registers                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий інференс (LLM)              |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний CLI backend інференсу       |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями           |
| `api.registerSpeechProvider(...)`                | Синтез тексту в мовлення / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Двосторонні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                       |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape          |
| `api.registerWebSearchProvider(...)`             | Пошук у вебі                          |

### Інструменти й команди

| Method                          | What it registers                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)            |

### Інфраструктура

| Method                                         | What it registers                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                               |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                       |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                          |
| `api.registerService(service)`                 | Фонова служба                           |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                  |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивна секція prompt, суміжна з пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний корпус пошуку/читання пам’яті |

Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається
призначити вужчу область видимості методу Gateway. Для методів, що належать
плагіну, віддавайте перевагу специфічним для плагіна префіксам.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для кореневої довідки CLI,
  маршрутизації та лінивої реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася ліниво завантажуваною у
звичайному шляху кореневого CLI, надайте `descriptors`, які охоплюють кожен
корінь команди верхнього рівня, що експонується цим registrar.

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
        description: "Керування акаунтами Matrix, перевіркою, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, тільки якщо вам не потрібна лінива реєстрація
кореневого CLI. Цей eager-шлях сумісності все ще підтримується, але він не
встановлює placeholder-елементи на основі дескрипторів для лінивого
завантаження на етапі парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає змогу плагіну володіти конфігурацією за
замовчуванням для локального AI CLI backend, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в посиланнях на моделі, таких як `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значення за замовчуванням плагіна перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань сумісності після злиття
  (наприклад, для нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | What it registers                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Контекстний рушій (одночасно активний лише один). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Єдина можливість пам’яті                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Конструктор секції prompt для пам’яті                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | Розв’язувач плану скидання пам’яті                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                                                                                                                                  |

### Адаптери embedding пам’яті

| Method                                         | What it registers                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного плагіна |

- `registerMemoryCapability` — це бажаний API ексклюзивного memory-plugin.
- `registerMemoryCapability` також може експонувати `publicArtifacts.listArtifacts(...)`,
  щоб допоміжні плагіни могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватного
  компонування конкретного memory plugin.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застаріло-сумісні API ексклюзивного memory-plugin.
- `registerMemoryEmbeddingProvider` дає змогу активному memory plugin реєструвати один
  або кілька id адаптерів embedding (наприклад, `openai`, `gemini` або
  користувацький id, визначений плагіном).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно зареєстрованих
  id цих адаптерів.

### Події та життєвий цикл

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник заявляє про диспетчеризацію, обробники з нижчим пріоритетом і стандартний шлях диспетчеризації моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.

### Поля об’єкта API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор плагіна                                                                       |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                     |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                   |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, коли доступний)           |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`                       |
| `api.runtime`            | `PluginRuntime`           | [Хелпери runtime](/uk/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger з обмеженою областю (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язує шлях відносно кореня плагіна                                                      |

## Угода щодо внутрішніх модулів

Усередині вашого плагіна використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні runtime-експорти
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Facade-loaded публічні поверхні вбудованих плагінів (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли) тепер віддають
перевагу активному знімку конфігурації runtime, коли OpenClaw уже запущено.
Якщо знімок runtime ще не існує, вони повертаються до розв’язаної конфігурації
з диска.

Плагіни провайдерів також можуть експонувати вузький локальний barrel-контракт
плагіна, коли хелпер навмисно є специфічним для провайдера і ще не належить до
загального підшляху SDK. Поточний вбудований приклад: провайдер Anthropic
зберігає свої хелпери потоків Claude у власному публічному шві `api.ts` /
`contract-api.ts` замість просування логіки Anthropic beta-header і
`service_tier` до загального контракту `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує конструктори провайдера,
  хелпери моделей за замовчуванням і конструктори realtime-провайдера
- `@openclaw/openrouter-provider`: `api.ts` експортує конструктор провайдера, а також
  хелпери онбордингу/конфігурації

<Warning>
  Production-код розширень також має уникати імпортів
  `openclaw/plugin-sdk/<other-plugin>`. Якщо хелпер справді є спільним,
  просуньте його до нейтрального підшляху SDK, такого як
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість зв’язування двох плагінів між собою.
</Warning>

## Пов’язане

- [Точки входу](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Хелпери runtime](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Налаштування і конфігурація](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Тестування](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [Міграція SDK](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — поглиблена архітектура та модель можливостей
