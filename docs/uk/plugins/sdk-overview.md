---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-06T19:43:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33539f020cbf2c8471b75d764124b8930c6e4a59c5b121d7e382ffd68040076b
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

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий, самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
допоміжних засобів entry/build надавайте перевагу `openclaw/plugin-sdk/channel-core`; використовуйте `openclaw/plugin-sdk/core`
для ширшої поверхні umbrella та спільних допоміжних функцій, як-от
`buildChannelConfigSchema`.

Не додавайте та не покладайтеся на зручні seam-и з назвами провайдерів, як-от
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні seam-и з брендуванням каналів. Вбудовані плагіни мають компонувати
загальні підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а ядро
має або використовувати ці локальні для плагіна barrel-файли, або додавати вузький загальний контракт SDK,
коли потреба справді є міжканальною.

Згенерована карта експорту все ще містить невеликий набір допоміжних
seam-ів вбудованих плагінів, як-от `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки та сумісності вбудованих плагінів; їх
навмисно пропущено в загальній таблиці нижче, і вони не є рекомендованим
шляхом імпорту для нових сторонніх плагінів.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи вбудованих плагінів усе ще з’являються в цьому згенерованому списку.
Розглядайте їх як поверхні деталей реалізації/сумісності, якщо лише сторінка документації
явно не просуває один із них як публічний.

### Точка входу плагіна

| Subpath                     | Ключові експорти                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Кореневий експорт Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, запити allowlist, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби конфігурації/керування gate для кількох акаунтів, допоміжні засоби резервного використання акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку акаунта + резервного використання за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби списку акаунтів/дій з акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації власних команд Telegram із fallback для контракту вбудованого пакета |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби побудови вхідних маршрутів і envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису й диспетчеризації вхідних даних |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби делегатів вихідної ідентичності/надсилання |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу та адаптера прив’язок потоків |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор медіа payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язки розмови/потоку, парування та налаштованої прив’язки |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації часу виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення group-policy часу виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви schema конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні exports-прелюдії плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби прийняття рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби нормалізації/згортання інтерактивного reply payload |
    | `plugin-sdk/channel-inbound` | Debounce, зіставлення згадок, допоміжні засоби envelope |
    | `plugin-sdk/channel-send-result` | Типи результату reply |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби секретного контракту, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted провайдера |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted провайдера, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Значення CLI backend за замовчуванням + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключа під час виконання для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні інтерактивні допоміжні засоби входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env-var автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/endpoint capability провайдера |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешу/конфігурації провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні wrapper-и Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби локального для процесу singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, допоміжні засоби авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver і action-auth в тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери native approval capability/delivery |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді на approve exec/plugin |
    | `plugin-sdk/command-auth-native` | Допоміжні засоби native command auth + native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команди та command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання секретних контрактів для поверхонь секретів каналу/плагіна |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього вмісту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF приватної мережі |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом від SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/timeout |
  </Accordion>

  <Accordion title="Підшляхи часу виконання та сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби часу виконання/логування/резервного копіювання/встановлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env часу виконання, logger, timeout, retry і backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/хуків/http/interactive для плагінів |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline для webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy import/binding часу виконання, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування та версії |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта Gateway і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби approve exec/plugin, конструктори capability approval, допоміжні засоби auth/profile, допоміжні засоби native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби часу виконання inbound/reply, chunking, dispatch, heartbeat, planner відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповідей |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії reply, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху до session store + `updated-at` |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби прив’язки route/session-key/account, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку статусу каналу/акаунта, значення стану часу виконання за замовчуванням і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби визначення цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із вхідних даних типу fetch/request |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Загальні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів до тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби реентерабельного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу dedupe зберігання на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів парування |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби `/models` command/provider reply |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native команд |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch, proxy та pinned lookup |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогу на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також конструктори медіа payload |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів media understanding, а також provider-facing експорти допоміжних засобів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту/markdown/логування, такі як видалення видимого асистенту тексту, допоміжні засоби render/chunking/table Markdown, редагування, directive-tag і safe-text utilities |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів speech, а також provider-facing допоміжні засоби directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів speech, а також допоміжні засоби registry, directive і normalization |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів realtime transcription і допоміжні засоби registry |
    | `plugin-sdk/realtime-voice` | Типи провайдерів realtime voice і допоміжні засоби registry |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, а також допоміжні засоби failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів вбудованого memory-core для manager/config/file/CLI helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти embedding engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Багатомодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби file/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до вендора alias для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до вендора alias для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до вендора alias для допоміжних засобів file/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Активний runtime facade пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до вендора alias для допоміжних засобів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів вбудованого memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані допоміжні підшляхи вбудованих модулів">
    | Family | Поточні підшляхи | Призначене використання |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки вбудованого browser plugin (`browser-support` лишається compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime для вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime для вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів для вбудованого IRC |
    | Допоміжні засоби, специфічні для каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Вбудовані seam-и сумісності/допоміжних засобів каналів |
    | Допоміжні засоби, специфічні для auth/плагіна | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Вбудовані seam-и допоміжних засобів функцій/плагінів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                     |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)       |
| `api.registerCliBackend(...)`                    | Локальний backend inference CLI |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями     |
| `api.registerSpeechProvider(...)`                | Синтез мовлення / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова realtime транскрипція  |
| `api.registerRealtimeVoiceProvider(...)`         | Двоспрямовані сесії realtime voice |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео    |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень             |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                 |
| `api.registerWebFetchProvider(...)`              | Провайдер веб-завантаження / скрапінгу |
| `api.registerWebSearchProvider(...)`             | Вебпошук                        |

### Інструменти та команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Власна команда (обходить LLM)                |

### Інфраструктура

| Method                                         | Що реєструє                         |
| ---------------------------------------------- | ---------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук подій                          |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway              |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                  |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                     |
| `api.registerService(service)`                 | Фонова служба                      |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник             |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивний розділ prompt, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний корпус пошуку/читання пам’яті |

Зарезервовані простори назв адмін-функцій ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
вужчу область видимості gateway-методу. Для методів,
якими володіє плагін, віддавайте перевагу специфічним для плагіна префіксам.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд часу розбору, які використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася ліниво завантажуваною у звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що експонується цим
registrar.

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
        description: "Керування акаунтами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте `commands` окремо лише тоді, коли вам не потрібна лінива реєстрація кореневого CLI.
Цей eager-шлях сумісності залишається підтримуваним, але він не встановлює
заповнювачі на основі descriptor для лінивого завантаження під час розбору.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дозволяє плагіну володіти конфігурацією за замовчуванням для локального
backend AI CLI, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в model ref на кшталт `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  значення за замовчуванням плагіна перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань для сумісності після об’єднання
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                          |
| ------------------------------------------ | ----------------------------------- |
| `api.registerContextEngine(id, factory)`   | Контекстний engine (лише один активний одночасно) |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt пам’яті  |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану скидання пам’яті     |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті             |

### Адаптери вбудовування пам’яті

| Method                                         | Що реєструє                                      |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер вбудовування пам’яті для активного плагіна |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними для плагінів пам’яті.
- `registerMemoryEmbeddingProvider` дозволяє активному плагіну пам’яті реєструвати один
  або кілька id адаптерів вбудовування (наприклад, `openai`, `gemini` або власний
  id, визначений плагіном).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник заявляє про диспетчеризацію, обробники з нижчим пріоритетом і шлях диспетчеризації моделі за замовчуванням пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як пропуск `cancel`), а не перевизначенням.

### Поля об’єкта API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id плагіна                                                                                  |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                     |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                   |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок у пам’яті під час виконання, коли доступний) |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`                       |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                            |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легковагове вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня плагіна                                                    |

## Угода щодо внутрішніх модулів

Усередині вашого плагіна використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Легка точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  із production-коду. Маршрутизуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім контрактом.
</Warning>

Публічні поверхні вбудованих плагінів, завантажувані через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні entry-файли), тепер надають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже запущений. Якщо знімок runtime
ще не існує, вони повертаються до визначеного файла конфігурації на диску.

Плагіни провайдерів також можуть експортувати вузький локальний для плагіна barrel-контракт, коли
допоміжний засіб навмисно є специфічним для провайдера і ще не належить до загального підшляху SDK.
Поточний вбудований приклад: провайдер Anthropic зберігає свої допоміжні засоби Claude
stream у власному публічному seam `api.ts` / `contract-api.ts` замість
просування логіки Anthropic beta-header і `service_tier` у загальний
контракт `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує конструктори провайдера,
  допоміжні засоби моделі за замовчуванням і конструктори realtime-провайдера
- `@openclaw/openrouter-provider`: `api.ts` експортує конструктор провайдера, а також
  допоміжні засоби онбордингу/конфігурації

<Warning>
  Production-код розширень також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, перенесіть його в нейтральний підшлях SDK,
  такий як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншу
  поверхню, орієнтовану на можливості, замість жорсткого зв’язування двох плагінів.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору назв `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — поглиблена архітектура та модель можливостей
