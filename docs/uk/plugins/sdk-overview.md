---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-05T18:13:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb25f3f96ca1f522780f5a52eaedb85a8adf3cfb2934df625db3fe8b5f7e0666
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між плагінами та core. Ця сторінка є
довідником для **що імпортувати** і **що ви можете реєструвати**.

<Tip>
  **Шукаєте практичний посібник?**
  - Перший плагін? Почніть із [Початок роботи](/plugins/building-plugins)
  - Плагін каналу? Див. [Плагіни каналів](/plugins/sdk-channel-plugins)
  - Плагін провайдера? Див. [Плагіни провайдерів](/plugins/sdk-provider-plugins)
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналів
допоміжних функцій entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої umbrella-поверхні та спільних допоміжних функцій, таких як
`buildChannelConfigSchema`.

Не додавайте і не покладайтеся на зручні шви з іменами провайдерів, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шви з брендуванням каналу. Пакети вбудованих плагінів мають компонувати загальні
підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а core
має або використовувати ці локальні barrel-файли плагіна, або додавати вузький загальний контракт SDK, коли потреба справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір
допоміжних швів для вбудованих плагінів, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для супроводу вбудованих плагінів і сумісності; їх
навмисно пропущено в загальній таблиці нижче, і вони не є рекомендованим
шляхом імпорту для нових сторонніх плагінів.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи для вбудованих плагінів усе ще з’являються в цьому згенерованому списку.
Розглядайте їх як поверхні деталей реалізації/сумісності, якщо тільки сторінка документації
явно не просуває один із них як публічний.

### Entry плагіна

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
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, запити allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції конфігурації/контролю дій для кількох облікових записів, допоміжні функції резервного переходу до типового облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікового запису + резервного переходу до типового |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції списку облікових записів/дій з обліковим записом |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації кастомних команд Telegram із резервним переходом до контракту вбудованого пакета |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції маршруту вхідних даних + побудовника envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису та диспетчеризації вхідних даних |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції делегування вихідної ідентичності/надсилання |
    | `plugin-sdk/thread-bindings-runtime` | Життєвий цикл прив’язок потоків та допоміжні функції адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медіапейлоада агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки розмови/потоку, парування та налаштованої прив’язки |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції розв’язання політики груп runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції знімка/підсумку стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти прелюдії плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції рішень щодо доступу до груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні функції нормалізації/скорочення інтерактивного пейлоада відповіді |
    | `plugin-sdk/channel-inbound` | Допоміжні функції debounce, зіставлення згадок, envelope |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локального/self-hosted провайдера |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted провайдера, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції runtime для розв’язання API-ключа для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу/запису профілю API-ключа |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку env var для auth провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політики повторення, допоміжні функції endpoint провайдера та допоміжні функції нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/можливостей endpoint провайдера |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешу web-fetch провайдера |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешу/конфігурації web-search провайдера |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні функції обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Допоміжні функції патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції локальних для процесу singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, допоміжні функції авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції розв’язання approver і auth дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілю/фільтра схвалення native exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери доставки/можливостей native approval |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції native approval target + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції пейлоада відповіді схвалення exec/plugin |
    | `plugin-sdk/command-auth-native` | Допоміжні функції native command auth + native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-surface` | Допоміжні функції нормалізації тіла команди та поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, DM gating, зовнішнього вмісту та збору секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned-dispatcher, fetch із захистом SSRF та політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції розбору секретного вводу |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції запиту/цілі webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру тіла запиту/таймауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні функції runtime/logging/backup/install плагінів |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції env, logger, timeout, retry і backoff для runtime |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції команди/hook/http/interactive плагіна |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції конвеєра webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy імпорту/прив’язки runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, очікування та версії |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway і допоміжні функції патчів стану каналу |
    | `plugin-sdk/config-runtime` | Допоміжні функції завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Нормалізація імен/описів команд Telegram і перевірки дублювання/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/approval-runtime` | Допоміжні функції схвалення exec/plugin, побудовники можливостей approval, auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції runtime для вхідних даних/відповідей, chunking, dispatch, heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції коротковіконної історії відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху до session store + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні функції шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції маршруту/ключа сесії/прив’язки облікового запису, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції підсумку стану каналу/облікового запису, типові стани runtime і допоміжні функції метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції розв’язання цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Видобування рядкових URL з вводів типу fetch/request |
    | `plugin-sdk/run-command` | Запуск команди з таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Загальні рідери параметрів інструментів/CLI |
    | `plugin-sdk/tool-send` | Видобування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів для тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні функції logger підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні функції читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні функції повторно вхідного file lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції дискового кешу дедуплікації |
    | `plugin-sdk/acp-runtime` | Допоміжні функції runtime/сесії ACP і reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Рідер нечіткого boolean-параметра |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції розв’язання збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції початкового налаштування пристрою та токенів парування |
    | `plugin-sdk/extension-shared` | Спільні примітиви passive-channel і статусу |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції відповіді провайдера/команди `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні функції реєстру/build/serialize native-команд |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні функції системних подій/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні функції обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні функції класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy і pinned lookup helpers |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації повторів і запуску повторів |
    | `plugin-sdk/agent-runtime` | Допоміжні функції каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store для медіа, а також побудовники медіапейлоадів |
    | `plugin-sdk/media-understanding` | Типи провайдера media understanding, а також експорти допоміжних функцій зображень/аудіо для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції тексту/markdown/logging, такі як вилучення видимого асистенту тексту, render/chunking/table helpers для markdown, допоміжні функції редагування, directive-tag helpers і safe-text utilities |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech-провайдера, а також експорти directive, registry і validation для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи speech-провайдера, registry, directive і normalization helpers |
    | `plugin-sdk/realtime-transcription` | Типи провайдера realtime transcription і допоміжні функції registry |
    | `plugin-sdk/realtime-voice` | Типи провайдера realtime voice і допоміжні функції registry |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, failover, auth і допоміжні функції registry |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні функції failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей webhook і допоміжні функції встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Реекспортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних функцій bundled memory-core для manager/config/file/CLI helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти engine embeddings хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти engine QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти engine storage хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні функції multimodal хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні функції query хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції secret хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції status хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні функції core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції file/runtime хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних функцій bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані допоміжні підшляхи для вбудованих пакетів">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-support` | Допоміжні функції підтримки вбудованого browser-плагіна |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних функцій/runtime для вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних функцій/runtime для вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних функцій для вбудованого IRC |
    | Допоміжні функції, специфічні для каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шви сумісності/допоміжних функцій для вбудованих каналів |
    | Допоміжні функції, специфічні для auth/плагінів | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви допоміжних функцій для вбудованих можливостей/плагінів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                           | Що він реєструє                |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)             |
| `api.registerCliBackend(...)`                    | Локальний CLI backend inference      |
| `api.registerChannel(...)`                       | Канал повідомлень                |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT   |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова realtime transcription |
| `api.registerRealtimeVoiceProvider(...)`         | Двобічні сеанси realtime voice   |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео       |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                 |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                 |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape      |
| `api.registerWebSearchProvider(...)`             | Вебпошук                       |

### Інструменти й команди

| Метод                          | Що він реєструє                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)             |

### Інфраструктура

| Метод                                         | Що він реєструє     |
| ---------------------------------------------- | --------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події            |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway |
| `api.registerGatewayMethod(name, handler)`     | Метод RPC Gateway    |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI        |
| `api.registerService(service)`                 | Фонова служба    |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник   |

Зарезервовані простори імен core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
вужчу область gateway method. Для методів, що належать плагіну,
віддавайте перевагу префіксам, специфічним для плагіна.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, що належать реєстратору
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для кореневої довідки CLI,
  маршрутизації та lazy-реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася lazy-loaded у звичайному кореневому шляху CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, який відкриває
цей реєстратор.

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
        description: "Керуйте обліковими записами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, коли вам не потрібна lazy-реєстрація кореневого CLI.
Цей сумісний eager-шлях і далі підтримується, але він не встановлює
плейсхолдери на основі descriptor для lazy loading на етапі парсингу.

### Ексклюзивні слоти

| Метод                                     | Що він реєструє                     |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один) |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції prompt пам’яті         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush пам’яті            |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                |

### Адаптери embedding пам’яті

| Метод                                         | Що він реєструє                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного плагіна |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними для плагінів пам’яті.
- `registerMemoryEmbeddingProvider` дає активному плагіну пам’яті змогу реєструвати один
  або більше ідентифікаторів адаптерів embedding (наприклад `openai`, `gemini` або користувацький
  ідентифікатор, визначений плагіном).
- Користувацька конфігурація, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, розв’язується відносно зареєстрованих ідентифікаторів
  адаптерів.

### Події та життєвий цикл

| Метод                                       | Що він робить                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу          |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є фінальним. Щойно будь-який обробник встановлює його, обробники нижчого пріоритету пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як і пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є фінальним. Щойно будь-який обробник встановлює його, обробники нижчого пріоритету пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як і пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є фінальним. Щойно будь-який обробник бере на себе диспетчеризацію, обробники нижчого пріоритету й типовий шлях диспетчеризації моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є фінальним. Щойно будь-який обробник встановлює його, обробники нижчого пріоритету пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як і пропуск `cancel`), а не як перевизначення.

### Поля об’єкта API

| Поле                    | Тип                      | Опис                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор плагіна                                                                                   |
| `api.name`               | `string`                  | Відображувана назва                                                                                |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                                   |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                               |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                          |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                            |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, коли доступний)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні функції runtime](/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Логер з областю видимості (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня плагіна                                                        |

## Угода щодо внутрішніх модулів

Усередині вашого плагіна використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Внутрішні експорти лише для runtime
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Полегшений entry лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Завантажувані через facade публічні поверхні вбудованих плагінів (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли) тепер віддають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже працює. Якщо знімок runtime
ще не існує, вони повертаються до розв’язаного файлу конфігурації на диску.

Плагіни провайдерів також можуть відкривати вузький локальний barrel-контракт плагіна, коли
допоміжна функція навмисно є специфічною для провайдера і ще не належить до загального підшляху SDK.
Поточний вбудований приклад: провайдер Anthropic зберігає свої допоміжні функції потоку Claude
у власному публічному шві `api.ts` / `contract-api.ts` замість того, щоб просувати логіку Anthropic beta-header і `service_tier`
до загального контракту `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує побудовники провайдера,
  допоміжні функції типових моделей і побудовники realtime-провайдера
- `@openclaw/openrouter-provider`: `api.ts` експортує побудовник провайдера плюс
  допоміжні функції онбордингу/конфігурації

<Warning>
  Production-код розширення також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжна функція справді є спільною, підніміть її до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість зчеплення двох плагінів між собою.
</Warning>

## Пов’язане

- [Точки входу](/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Допоміжні функції runtime](/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Налаштування та конфігурація](/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Тестування](/plugins/sdk-testing) — утиліти тестування та правила lint
- [Міграція SDK](/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Внутрішня будова плагінів](/plugins/architecture) — поглиблена архітектура й модель можливостей
