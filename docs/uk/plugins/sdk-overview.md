---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник з усіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-07T06:54:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 533bc3027ed8ad50b706518a4f58e75f6ef717fc8b36f242e928cae54d20985f
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між плагінами та ядром. Ця сторінка є
довідником з **того, що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте покроковий посібник?**
  - Перший плагін? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Плагін каналу? Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Плагін провайдера? Див. [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналів
хелперів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; а
`openclaw/plugin-sdk/core` залишайте для ширшої поверхні umbrella та спільних
хелперів, таких як `buildChannelConfigSchema`.

Не додавайте й не використовуйте зручні шари з назвами провайдерів, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шари з брендингом каналів. Вбудовані плагіни мають компонувати
загальні підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а
ядро має або використовувати ці локальні barrel-файли плагіна, або додавати
вузький загальний контракт SDK, якщо потреба справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних шарів
для вбудованих плагінів, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки та сумісності вбудованих плагінів; їх
навмисно не включено до загальної таблиці нижче, і вони не є рекомендованим
шляхом імпорту для нових сторонніх плагінів.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи вбудованих плагінів усе ще з’являються в цьому
згенерованому списку. Розглядайте їх як поверхні деталей реалізації/сумісності,
якщо лише сторінка документації явно не визначає одну з них як публічну.

### Точка входу плагіна

| Підшлях                    | Ключові експорти                                                                                                                      |
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
    | `plugin-sdk/setup` | Спільні хелпери майстра налаштування, запити allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Хелпери багатокористувацької конфігурації/action-gate, хелпери fallback для облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, хелпери нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук облікових записів + хелпери fallback за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі хелпери списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Хелпери нормалізації/валідації користувацьких команд Telegram із fallback на вбудований контракт |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні хелпери побудови route та envelope для вхідних повідомлень |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні хелпери запису та диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Хелпери розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні хелпери завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Хелпери делегування вихідної ідентичності/надсилання |
    | `plugin-sdk/thread-bindings-runtime` | Хелпери життєвого циклу та адаптера для прив’язок потоків |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медіапейлоада агента |
    | `plugin-sdk/conversation-runtime` | Хелпери прив’язки розмови/потоку, pairing та configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Хелпер знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Хелпери визначення group-policy у runtime |
    | `plugin-sdk/channel-status` | Спільні хелпери знімка/підсумку стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Хелпери авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Хелпери читання/редагування конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні хелпери рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні хелпери auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Хелпери нормалізації/редукції інтерактивного reply payload |
    | `plugin-sdk/channel-inbound` | Хелпери debounce для вхідних повідомлень, зіставлення згадок, mention-policy та envelope |
    | `plugin-sdk/channel-send-result` | Типи результатів reply |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Хелпери розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери secret-контракту, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські хелпери налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані хелпери налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням для CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Хелпери визначення API-ключів у runtime для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Хелпери онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні хелпери інтерактивного входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Хелпери пошуку env vars для auth провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, хелпери endpoint провайдера та хелпери нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні хелпери HTTP/endpoint capability для провайдера |
    | `plugin-sdk/provider-web-fetch` | Хелпери реєстрації/кешування web-fetch провайдера |
    | `plugin-sdk/provider-web-search-contract` | Вузькі хелпери контракту конфігурації/облікових даних web-search, такі як `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Хелпери реєстрації/кешування/runtime для web-search провайдера |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також хелпери сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper та спільні хелпери wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Хелпери патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Хелпери process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, хелпери реєстру команд, хелпери авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Хелпери визначення approver та auth дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Хелпери профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери native approval capability/delivery |
    | `plugin-sdk/approval-native-runtime` | Хелпери native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Хелпери payload відповіді для approval exec/plugin |
    | `plugin-sdk/command-auth-native` | Native command auth + хелпери native session-target |
    | `plugin-sdk/command-detection` | Спільні хелпери виявлення команд |
    | `plugin-sdk/command-surface` | Хелпери нормалізації command-body та command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери збирання secret-контракту для поверхонь secret каналу/плагіна |
    | `plugin-sdk/secret-ref-runtime` | Вузькі хелпери `coerceSecretRef` і типізації SecretRef для парсингу secret-контракту/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні хелпери trust, DM gating, external-content і збирання secret |
    | `plugin-sdk/ssrf-policy` | Хелпери policy для SSRF щодо allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-runtime` | Хелпери pinned-dispatcher, fetch із захистом SSRF та policy SSRF |
    | `plugin-sdk/secret-input` | Хелпери парсингу secret input |
    | `plugin-sdk/webhook-ingress` | Хелпери запитів/цілей webhook |
    | `plugin-sdk/webhook-request-guards` | Хелпери для розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі хелпери runtime/logging/backup/установлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі хелпери runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні хелпери команд/hook/http/interactive плагіна |
    | `plugin-sdk/hook-runtime` | Спільні хелпери pipeline для webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Хелпери lazy import/binding для runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Хелпери виконання процесів |
    | `plugin-sdk/cli-runtime` | Хелпери форматування CLI, очікування та версії |
    | `plugin-sdk/gateway-runtime` | Хелпери клієнта gateway і патчів status каналу |
    | `plugin-sdk/config-runtime` | Хелпери завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/approval-runtime` | Хелпери approval для exec/plugin, побудовники approval-capability, хелпери auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні runtime-хелпери для inbound/reply, chunking, dispatch, heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі хелпери dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні хелпери коротковіконної history відповіді, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі хелпери chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Хелпери шляху сховища сесій + updated-at |
    | `plugin-sdk/state-paths` | Хелпери шляхів до каталогу state/OAuth |
    | `plugin-sdk/routing` | Хелпери route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні хелпери підсумку status каналу/облікового запису, значення runtime-state за замовчуванням і хелпери метаданих issues |
    | `plugin-sdk/target-resolver-runtime` | Спільні хелпери визначення target |
    | `plugin-sdk/string-normalization-runtime` | Хелпери нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягує URL-рядки з fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Runner команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-send` | Витягує канонічні поля цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні хелпери шляху до тимчасового завантаження |
    | `plugin-sdk/logging-core` | Хелпери logger підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Хелпери режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі хелпери читання/запису JSON state |
    | `plugin-sdk/file-lock` | Повторно вхідні хелпери file-lock |
    | `plugin-sdk/persistent-dedupe` | Хелпери disk-backed dedupe cache |
    | `plugin-sdk/acp-runtime` | ACP runtime/session і хелпери reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми runtime-конфігурації агента |
    | `plugin-sdk/boolean-param` | Нестрогий читач boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Хелпери визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Хелпери bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви helper для passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Хелпери відповіді `/models` command/provider |
    | `plugin-sdk/skill-commands-runtime` | Хелпери переліку Skills-команд |
    | `plugin-sdk/native-command-registry` | Хелпери реєстру/build/serialize native command |
    | `plugin-sdk/provider-zai-endpoint` | Хелпери визначення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Хелпери system event/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі хелпери bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Хелпери diagnostic flag і event |
    | `plugin-sdk/error-runtime` | Хелпери графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy та хелпери pinned lookup |
    | `plugin-sdk/host-runtime` | Хелпери нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Хелпери конфігурації retry і retry runner |
    | `plugin-sdk/agent-runtime` | Хелпери каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогу на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні хелпери fetch/transform/store для медіа, а також побудовники медіапейлоадів |
    | `plugin-sdk/media-generation-runtime` | Спільні хелпери failover для генерації медіа, вибір кандидатів і повідомлення про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи провайдера media understanding і provider-facing експорти helper для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні хелпери text/markdown/logging, такі як видалення видимого для помічника тексту, рендер/chunking/table-хелпери Markdown, хелпери редагування чутливих даних, хелпери directive-tag і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Хелпер chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech-провайдера та provider-facing хелпери directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні типи speech-провайдера, registry, directive і хелпери нормалізації |
    | `plugin-sdk/realtime-transcription` | Типи провайдера realtime transcription і хелпери registry |
    | `plugin-sdk/realtime-voice` | Типи провайдера realtime voice і хелпери registry |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, failover, auth і хелпери registry |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, хелпери failover, пошук провайдера та парсинг model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, хелпери failover, пошук провайдера та парсинг model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей webhook і хелпери встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Хелпери нормалізації шляху webhook |
    | `plugin-sdk/web-media` | Спільні хелпери завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для користувачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня helper memory-core для вбудованих модулів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексації/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти embedding engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні хелпери хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Хелпери запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Secret-хелпери хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Хелпери журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Хелпери статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Хелпери CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Основні runtime-хелпери хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Хелпери файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника alias для основних runtime-хелперів хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника alias для хелперів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника alias для хелперів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні хелпери керованого Markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Active memory runtime facade для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника alias для хелперів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня helper memory-lancedb для вбудованих модулів |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих helper-модулів">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Хелпери підтримки вбудованого browser plugin (`browser-support` залишається barrel-файлом сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper/runtime для вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper/runtime для вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helper для вбудованого IRC |
    | Хелпери для конкретних каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шари сумісності/helper для вбудованих каналів |
    | Хелпери для auth/специфічних плагінів | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шари helper для вбудованих функцій/плагінів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                           | Що він реєструє                |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)             |
| `api.registerCliBackend(...)`                    | Локальний inference backend для CLI      |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями                |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT   |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в realtime |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні сеанси голосу в realtime   |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео       |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                 |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                 |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                 |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape      |
| `api.registerWebSearchProvider(...)`             | Web search                       |

### Інструменти та команди

| Метод                          | Що він реєструє                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)             |

### Інфраструктура

| Метод                                         | Що він реєструє                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                              |
| `api.registerHttpRoute(params)`                | HTTP endpoint gateway                   |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод gateway                      |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                          |
| `api.registerService(service)`                 | Фонова служба                      |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                     |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий розділ prompt, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий corpus пошуку/читання пам’яті      |

Зарезервовані простори імен core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається
призначити вужчу область дії методу gateway. Для методів, що належать плагіну,
віддавайте перевагу префіксам, специфічним для плагіна.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє реєстратор
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася ліниво завантажуваною в
звичайному шляху кореневого CLI, надайте `descriptors`, які покривають кожен
корінь команди верхнього рівня, відкритий цим реєстратором.

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
        description: "Керування обліковими записами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, якщо вам не потрібна лінива реєстрація
кореневого CLI. Цей шлях сумісності з eager-loading і далі підтримується, але
він не встановлює placeholder-елементи з підтримкою descriptors для лінивого
завантаження під час парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає змогу плагіну володіти конфігурацією за
замовчуванням для локального AI CLI backend, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в model refs, таких як `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значень за замовчуванням плагіна перед запуском CLI.
- Використовуйте `normalizeConfig`, якщо backend потребує переписування для сумісності після злиття
  (наприклад, для нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що він реєструє                     |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один) |
| `api.registerMemoryPromptSection(builder)` | Побудовник розділу prompt пам’яті         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану очищення пам’яті            |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                |

### Адаптери embedding для пам’яті

| Метод                                         | Що він реєструє                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного плагіна |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними для плагінів пам’яті.
- `registerMemoryEmbeddingProvider` дає змогу активному плагіну пам’яті
  зареєструвати один або кілька id адаптерів embedding (наприклад `openai`,
  `gemini` або користувацький id, визначений плагіном).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Метод                                       | Що він робить                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований lifecycle hook          |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере dispatch на себе, обробники з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.

### Поля об’єкта API

| Поле                    | Тип                      | Опис                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id плагіна                                                                                   |
| `api.name`               | `string`                  | Назва для відображення                                                                                |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                                   |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                               |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                          |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                            |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, якщо доступний)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Хелпери runtime](/uk/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня плагіна                                                        |

## Угода щодо внутрішніх модулів

У межах вашого плагіна використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Легка точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Для внутрішніх імпортів використовуйте `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім контрактом.
</Warning>

Facade-loaded публічні поверхні вбудованих плагінів (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли) тепер віддають
перевагу активному знімку конфігурації runtime, якщо OpenClaw уже запущено. Якщо
знімок runtime ще не існує, вони повертаються до визначеного файлу конфігурації на диску.

Плагіни провайдерів також можуть відкривати вузький локальний barrel-файл
контракту плагіна, коли helper навмисно є специфічним для певного провайдера і
ще не належить до загального підшляху SDK. Поточний вбудований приклад:
провайдер Anthropic зберігає свої хелпери потоку Claude у власному публічному
шарі `api.ts` / `contract-api.ts` замість просування логіки beta-header Anthropic
та `service_tier` у загальний контракт `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує побудовники провайдера,
  хелпери моделей за замовчуванням і побудовники realtime-провайдера
- `@openclaw/openrouter-provider`: `api.ts` експортує побудовник провайдера та
  хелпери онбордингу/конфігурації

<Warning>
  Production-код розширень також має уникати імпортів
  `openclaw/plugin-sdk/<other-plugin>`. Якщо helper справді є спільним,
  перенесіть його до нейтрального підшляху SDK, такого як
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість зв’язування двох плагінів між собою.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — детальна архітектура та модель можливостей
