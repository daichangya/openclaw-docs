---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Ви хочете мати довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-06T12:45:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e045097753f33d13d570f6ce5297d2a7c0f0ad8b31515d0d9021386c8004354c
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugins і ядром. Ця сторінка є
довідником про **що імпортувати** і **що можна зареєструвати**.

<Tip>
  **Шукаєте практичний посібник?**
  - Перший plugin? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Plugin каналу? Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Plugin провайдера? Див. [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Правило імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий, самодостатній модуль. Це забезпечує швидкий
запуск і запобігає проблемам із циклічними залежностями. Для специфічних для
каналів допоміжних функцій точки входу/збирання віддавайте перевагу
`openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої umbrella-поверхні та спільних допоміжних функцій, таких як
`buildChannelConfigSchema`.

Не додавайте і не використовуйте convenience-шви, названі на честь провайдерів,
такі як `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шви з брендингом каналів. Bundled plugins мають комбінувати загальні
підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а ядро
має або використовувати ці plugin-локальні barrel-файли, або додавати вузький
загальний контракт SDK, якщо потреба справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних швів для
bundled-plugin, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки bundled-plugin і сумісності; їх навмисно
не включено до спільної таблиці нижче, і вони не є рекомендованим шляхом
імпорту для нових сторонніх plugins.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи bundled-plugin усе ще з’являються в цьому
згенерованому списку. Вважайте їх деталями реалізації/поверхнями сумісності,
якщо лише якась сторінка документації явно не оголошує один із них публічним.

### Точка входу plugin

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
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, запити allowlist, збирачі статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції багатoакаунтної конфігурації/керування обмеженнями дій, допоміжні функції fallback для акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук акаунта + допоміжні функції fallback за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції списків акаунтів/дій над акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram із fallback на bundled-contract |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції вхідних маршрутів + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису й диспетчеризації вхідних подій |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції вихідної ідентичності/делегата надсилання |
    | `plugin-sdk/thread-bindings-runtime` | Життєвий цикл thread-binding і допоміжні функції адаптера |
    | `plugin-sdk/agent-media-payload` | Legacy-збирач медіапейлоада агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки розмови/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція snapshot конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції розв’язання групової політики runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції snapshot/summary стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції читання/редагування конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції рішень щодо групового доступу |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції auth/guard для direct-DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні функції нормалізації/скорочення інтерактивного reply payload |
    | `plugin-sdk/channel-inbound` | Debounce, зіставлення згадок, допоміжні функції envelope |
    | `plugin-sdk/channel-send-result` | Типи результату reply |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції runtime-розв’язання API-ключів для plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції onboarding/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний збирач результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку змінних середовища для auth провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні збирачі replay-policy, допоміжні функції endpoint провайдерів і нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/можливостей endpoint провайдера |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування web-fetch провайдера |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/конфігурації web-search провайдера |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні функції wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Допоміжні функції виправлення конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Допоміжні функції process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, допоміжні функції авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції розв’язання approver і auth дій у межах того самого чату |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції native exec approval profile/filter |
    | `plugin-sdk/approval-delivery-runtime` | Native-адаптери можливостей/доставки approval |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції reply payload для approval exec/plugin |
    | `plugin-sdk/command-auth-native` | Native command auth + допоміжні функції native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні функції поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, обмеження DM, зовнішнього контенту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції allowlist хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned-dispatcher, fetch із захистом SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції webhook request/target |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру тіла request/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні функції runtime/логування/резервних копій/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції plugin command/hook/http/interactive |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції webhook та внутрішнього hook pipeline |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy-імпорту/binding runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції виконання process |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні функції клієнта Gateway і виправлення статусу каналу |
    | `plugin-sdk/config-runtime` | Допоміжні функції завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Нормалізація імен/описів команд Telegram та перевірки дублікатів/конфліктів, навіть коли bundled Telegram contract surface недоступна |
    | `plugin-sdk/approval-runtime` | Допоміжні функції approval exec/plugin, збирачі approval-capability, auth/profile, native routing/runtime helpers |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції runtime для inbound/reply, chunking, dispatch, heartbeat, планувальник reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize для reply |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції короткого вікна історії reply, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху session store + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні функції шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції summary стану каналу/акаунта, типові значення runtime-state і допоміжні функції метаданих issues |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції розв’язання цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні функції subsystem logger і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму markdown-таблиць |
    | `plugin-sdk/json-store` | Невеликі допоміжні функції читання/запису JSON-стану |
    | `plugin-sdk/file-lock` | Допоміжні функції повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції disk-backed dedupe cache |
    | `plugin-sdk/acp-runtime` | Допоміжні функції ACP runtime/session і reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Зчитувач нечітких boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції розв’язання збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви пасивного каналу та допоміжні функції статусу |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції команд `/models` і reply провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції виведення списку skill-команд |
    | `plugin-sdk/native-command-registry` | Допоміжні функції native command registry/build/serialize |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні функції system event/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні функції обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Допоміжні функції графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні функції fetch, proxy і pinned lookup |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні функції dir/identity/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store медіа плюс збирачі media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції failover генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдера розуміння медіа плюс експорти допоміжних функцій зображень/аудіо для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції тексту/markdown/логування, такі як видалення видимого для асистента тексту, рендер/chunking/table helpers для markdown, допоміжні функції редагування чутливих даних, тегів директив і safe-text utilities |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech-провайдера плюс експорти допоміжних функцій директив, реєстру та валідації для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи speech-провайдера, реєстр, директиви та допоміжні функції нормалізації |
    | `plugin-sdk/realtime-transcription` | Типи провайдера транскрипції в реальному часі та допоміжні функції реєстру |
    | `plugin-sdk/realtime-voice` | Типи провайдера голосу в реальному часі та допоміжні функції реєстру |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, failover, auth і допоміжні функції реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні функції failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні функції failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні функції реєстру webhook target і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторний експорт `zod` для користувачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних функцій bundled memory-core для менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад індексації/пошуку в пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти embedding engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні функції multimodal хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні функції core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Вендорно-нейтральний псевдонім для допоміжних функцій core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Вендорно-нейтральний псевдонім для допоміжних функцій журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Вендорно-нейтральний псевдонім для допоміжних функцій файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні функції керованого markdown для plugins, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Активний runtime-фасад пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Вендорно-нейтральний псевдонім для допоміжних функцій статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних функцій bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні функції підтримки bundled browser plugin (`browser-support` лишається barrel-файлом сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних функцій/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних функцій/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних функцій bundled IRC |
    | Допоміжні функції для конкретних каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шви сумісності/допоміжні шви bundled-каналів |
    | Допоміжні функції для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Допоміжні шви bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                           | Що реєструє                     |
| ----------------------------------------------- | ------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)       |
| `api.registerCliBackend(...)`                    | Локальний backend CLI inference |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями     |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT     |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Двосторонні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео    |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень             |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                 |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape    |
| `api.registerWebSearchProvider(...)`             | Web search                      |

### Інструменти та команди

| Метод                          | Що реєструє                                  |
| ------------------------------ | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацьку команду (в оминання LLM)       |

### Інфраструктура

| Метод                                         | Що реєструє                          |
| --------------------------------------------- | ------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | Hook події                           |
| `api.registerHttpRoute(params)`                | HTTP-ендпойнт Gateway                |
| `api.registerGatewayMethod(name, handler)`     | Метод Gateway RPC                    |
| `api.registerCli(registrar, opts?)`            | Підкоманду CLI                       |
| `api.registerService(service)`                 | Фоновий сервіс                       |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник               |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий розділ prompt, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий корпус пошуку/читання пам’яті |

Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`) завжди залишаються `operator.admin`, навіть якщо plugin
намагається призначити методу gateway вужчу область доступу. Для методів, що
належать plugin, віддавайте перевагу специфічним для plugin префіксам.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для кореневої довідки CLI, маршрутизації та лінивої реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася ліниво завантажуваною в
звичайному кореневому шляху CLI, надайте `descriptors`, які охоплюють кожен
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, якщо вам не потрібна лінива реєстрація кореня
CLI. Цей eager-шлях сумісності все ще підтримується, але він не встановлює
placeholder-и на основі descriptor для лінивого завантаження під час парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає plugin змогу володіти типовою конфігурацією
локального backend AI CLI, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в model ref, наприклад `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх типової конфігурації plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує сумісних переписувань після злиття (наприклад, для нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що реєструє                         |
| ----------------------------------------- | ----------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один) |
| `api.registerMemoryPromptSection(builder)` | Збирач розділу prompt пам’яті       |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану flush пам’яті        |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті             |

### Адаптери embedding пам’яті

| Метод                                         | Що реєструє                                  |
| --------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного plugin |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними для plugins пам’яті.
- `registerMemoryEmbeddingProvider` дає активному plugin пам’яті змогу
  реєструвати один або більше id адаптерів embedding (наприклад `openai`,
  `gemini` або користувацький id, визначений plugin).
- Конфігурація користувача, як-от `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, зіставляється з цими
  зареєстрованими id адаптерів.

### Події та життєвий цикл

| Метод                                       | Що робить                    |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований lifecycle hook   |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як і пропущений `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як і пропущений `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник перехоплює dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як і пропущений `cancel`), а не як перевизначення.

### Поля об’єкта API

| Поле                    | Тип                       | Опис                                                                                               |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор plugin                                                                               |
| `api.name`               | `string`                  | Відображувана назва                                                                                |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                                      |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                        |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                             |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                           |
| `api.config`             | `OpenClawConfig`          | Поточний snapshot конфігурації (активний snapshot runtime у пам’яті, коли доступний)              |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для plugin, з `plugins.entries.<id>.config`                              |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/uk/plugins/sdk-runtime)                                                            |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язує шлях відносно кореня plugin                                                              |

## Внутрішня угода для модулів

У межах вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні runtime-експорти
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Facade-loaded публічні поверхні bundled plugin (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні файли входу) тепер віддають
перевагу активному snapshot конфігурації runtime, якщо OpenClaw уже запущено.
Якщо snapshot runtime ще не існує, вони використовують fallback до розв’язаного
файла конфігурації на диску.

Plugins провайдерів також можуть експортувати вузький plugin-локальний contract
barrel, коли допоміжна функція навмисно є специфічною для провайдера і поки що
не належить до загального підшляху SDK. Поточний bundled-приклад: провайдер
Anthropic зберігає свої допоміжні функції потоків Claude у власному публічному
шві `api.ts` / `contract-api.ts` замість перенесення логіки Anthropic beta-header
і `service_tier` до загального контракту `plugin-sdk/*`.

Інші поточні bundled-приклади:

- `@openclaw/openai-provider`: `api.ts` експортує builder-и провайдерів,
  допоміжні функції моделей за замовчуванням і builder-и realtime-провайдерів
- `@openclaw/openrouter-provider`: `api.ts` експортує builder провайдера та
  допоміжні функції onboarding/конфігурації

<Warning>
  Production-код extension також має уникати імпортів
  `openclaw/plugin-sdk/<other-plugin>`. Якщо допоміжна функція справді є
  спільною, перенесіть її до нейтрального підшляху SDK, такого як
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  capability-орієнтованої поверхні, замість жорсткого зв’язування двох plugins.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція з застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — поглиблена архітектура і модель можливостей
