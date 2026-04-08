---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібна довідка щодо всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідка щодо API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-08T08:11:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e7b420eb0f3faa8916357d52df949f6c9a46f1c843a1e6a0c0b8bb26db6cbff
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugins і core. Ця сторінка є
довідником щодо **що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте практичний посібник?**
  - Перший plugin? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Channel plugin? Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Provider plugin? Див. [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для channel
entry/build helper-ів віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої парасолькової поверхні та спільних helper-ів, таких як
`buildChannelConfigSchema`.

Не додавайте й не використовуйте зручні seams з іменами provider-ів, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
helper seams із брендуванням channel. Bundled plugins мають компонувати загальні
підшляхи SDK у власних barrels `api.ts` або `runtime-api.ts`, а core
має або використовувати ці локальні plugin barrels, або додавати вузький загальний SDK
контракт, коли потреба справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір helper
seams для bundled plugins, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки bundled plugins і сумісності; їх
навмисно не включено до загальної таблиці нижче, і вони не є рекомендованим
шляхом імпорту для нових сторонніх plugins.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
200+ підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані helper-підшляхи для bundled plugins усе ще з’являються в цьому згенерованому списку.
Сприймайте їх як деталі реалізації/поверхні сумісності, якщо лише сторінка документації
явно не просуває один із них як публічний.

### Точка входу plugin

| Subpath                     | Ключові експорти                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Підшляхи channel">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні helper-и майстра налаштування, запити allowlist, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper-и для багатоакаунтної config/action-gate, helper-и fallback для облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper-и нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук облікового запису + helper-и fallback за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі helper-и для списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми config channel |
    | `plugin-sdk/telegram-command-config` | Helper-и нормалізації/валідації користувацьких команд Telegram з fallback на bundled contract |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні helper-и маршрутизації вхідних повідомлень + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні helper-и запису та диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Helper-и розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні helper-и завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Helper-и делегування вихідної ідентичності/надсилання |
    | `plugin-sdk/thread-bindings-runtime` | Helper-и життєвого циклу та адаптера thread-binding |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор agent media payload |
    | `plugin-sdk/conversation-runtime` | Helper-и conversation/thread binding, pairing та configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper знімка runtime config |
    | `plugin-sdk/runtime-group-policy` | Helper-и визначення group-policy під час виконання |
    | `plugin-sdk/channel-status` | Спільні helper-и знімка/підсумку статусу channel |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми config channel |
    | `plugin-sdk/channel-config-writes` | Helper-и авторизації запису config channel |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти prelude для channel plugins |
    | `plugin-sdk/allowlist-config-edit` | Helper-и читання/редагування config allowlist |
    | `plugin-sdk/group-access` | Спільні helper-и рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні helper-и auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Helper-и нормалізації/зведення interactive reply payload |
    | `plugin-sdk/channel-inbound` | Helper-и debounce вхідних повідомлень, зіставлення згадок, політики згадок і envelope |
    | `plugin-sdk/channel-send-result` | Типи результатів reply |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper-и розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту channel |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі helper-и secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи provider">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські helper-и налаштування локального/self-hosted provider |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані helper-и налаштування self-hosted provider, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Значення CLI backend за замовчуванням + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper-и визначення API-ключа під час виконання для provider plugins |
    | `plugin-sdk/provider-auth-api-key` | Helper-и онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні helper-и інтерактивного входу для provider plugins |
    | `plugin-sdk/provider-env-vars` | Helper-и пошуку auth env vars для provider-ів |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, helper-и endpoint provider-ів і helper-и нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні helper-и HTTP/можливостей endpoint provider-ів |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі helper-и контракту config/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper-и реєстрації/кешу provider-а web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі helper-и config/облікових даних web-search для provider-ів, яким не потрібне підключення увімкнення plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі helper-и контракту config/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter-и облікових даних |
    | `plugin-sdk/provider-web-search` | Helper-и реєстрації/кешу/runtime для provider-а web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + diagnostics, а також helper-и сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібне |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні helper-и wrapper-ів для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper-и патчів config для онбордингу |
    | `plugin-sdk/global-singleton` | Helper-и локальних для процесу singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper-и реєстру команд, helper-и авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Helper-и визначення approver і auth дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Helper-и профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери доставки/можливостей native approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний helper визначення approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагі helper-и завантаження native approval adapter для hot channel entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime helper-и approval handler; віддавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Helper-и native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Helper-и payload відповіді для exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Helper-и native command auth + native session-target |
    | `plugin-sdk/command-detection` | Спільні helper-и виявлення команд |
    | `plugin-sdk/command-surface` | Helper-и нормалізації тіла команди та command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі helper-и збирання secret-contract для поверхонь secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі helper-и `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні helper-и довіри, DM gating, зовнішнього вмісту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Helper-и політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-runtime` | Helper-и pinned-dispatcher, fetch із захистом від SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Helper-и розбору secret input |
    | `plugin-sdk/webhook-ingress` | Helper-и webhook request/target |
    | `plugin-sdk/webhook-request-guards` | Helper-и розміру body/timeout для request |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі helper-и runtime/logging/backup/install plugin |
    | `plugin-sdk/runtime-env` | Вузькі helper-и runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні helper-и реєстрації та пошуку runtime-context channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні helper-и команди/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні helper-и конвеєра webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Helper-и lazy runtime import/binding, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper-и виконання процесів |
    | `plugin-sdk/cli-runtime` | Helper-и форматування CLI, очікування і версії |
    | `plugin-sdk/gateway-runtime` | Helper-и gateway client і patch статусу channel |
    | `plugin-sdk/config-runtime` | Helper-и завантаження/запису config |
    | `plugin-sdk/telegram-command-config` | Helper-и нормалізації назв/описів команд Telegram і перевірок дублікатів/конфліктів, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/approval-runtime` | Helper-и exec/plugin approval, конструктори approval-capability, helper-и auth/profile, helper-и native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні runtime helper-и для inbound/reply, chunking, dispatch, heartbeat, планувальник reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper-и dispatch/finalize для reply |
    | `plugin-sdk/reply-history` | Спільні helper-и коротковіконної історії reply, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі helper-и chunking для text/markdown |
    | `plugin-sdk/session-store-runtime` | Helper-и шляху сховища сесій + updated-at |
    | `plugin-sdk/state-paths` | Helper-и шляхів каталогів state/OAuth |
    | `plugin-sdk/routing` | Helper-и route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні helper-и підсумку статусу channel/account, значення runtime-state за замовчуванням і helper-и метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні helper-и визначення цілі |
    | `plugin-sdk/string-normalization-runtime` | Helper-и нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягує рядкові URL з fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені readers параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягує нормалізовані payload-и з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягує канонічні поля цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні helper-и шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Helper-и логера підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Helper-и режиму markdown-таблиць |
    | `plugin-sdk/json-store` | Невеликі helper-и читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Helper-и повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Helper-и дискового кешу усунення дублікатів |
    | `plugin-sdk/acp-runtime` | Helper-и runtime/session і reply-dispatch для ACP |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми runtime config agent |
    | `plugin-sdk/boolean-param` | Loose reader логічних параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Helper-и визначення збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Helper-и bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви helper-ів passive-channel, status та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helper-и відповідей provider-а/команди `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper-и виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Helper-и реєстру/build/serialize native commands |
    | `plugin-sdk/provider-zai-endpoint` | Helper-и виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper-и системних подій/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі helper-и обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Helper-и прапорців diagnostics і подій |
    | `plugin-sdk/error-runtime` | Helper-и графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper-и обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/host-runtime` | Helper-и нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Helper-и config retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Helper-и каталогу/ідентичності/workspace agent |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогів на основі config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні helper-и fetch/transform/store для медіа, а також конструктори media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні helper-и failover для генерації медіа, вибір candidate і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи provider-а media understanding, а також орієнтовані на provider експортовані helper-и для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні helper-и text/markdown/logging, такі як видалення видимого для assistant тексту, helper-и render/chunking/table для markdown, helper-и редагування чутливих даних, helper-и directive-tag і утиліти safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking для вихідного text |
    | `plugin-sdk/speech` | Типи speech provider, а також орієнтовані на provider helper-и directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні типи speech provider, helper-и registry, directive і normalization |
    | `plugin-sdk/realtime-transcription` | Типи provider-а realtime transcription і helper-и registry |
    | `plugin-sdk/realtime-voice` | Типи provider-а realtime voice і helper-и registry |
    | `plugin-sdk/image-generation` | Типи provider-а генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, helper-и failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи provider/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, helper-и failover, lookup provider-а та розбору model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, helper-и failover, lookup provider-а та розбору model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр webhook target і helper-и встановлення route |
    | `plugin-sdk/webhook-path` | Helper-и нормалізації шляху webhook |
    | `plugin-sdk/web-media` | Спільні helper-и завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для користувачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня helper-ів bundled memory-core для менеджера/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade для індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine для memory host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти embedding engine для memory host |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine для memory host |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine для memory host |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodal helper-и для memory host |
    | `plugin-sdk/memory-core-host-query` | Query helper-и для memory host |
    | `plugin-sdk/memory-core-host-secret` | Secret helper-и для memory host |
    | `plugin-sdk/memory-core-host-events` | Helper-и журналу подій для memory host |
    | `plugin-sdk/memory-core-host-status` | Status helper-и для memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | Runtime helper-и CLI для memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core runtime helper-и для memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper-и файлів/runtime для memory host |
    | `plugin-sdk/memory-host-core` | Vendor-neutral alias для core runtime helper-ів memory host |
    | `plugin-sdk/memory-host-events` | Vendor-neutral alias для helper-ів журналу подій memory host |
    | `plugin-sdk/memory-host-files` | Vendor-neutral alias для helper-ів файлів/runtime memory host |
    | `plugin-sdk/memory-host-markdown` | Спільні helper-и managed-markdown для plugins, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Active memory runtime facade для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Vendor-neutral alias для status helper-ів memory host |
    | `plugin-sdk/memory-lancedb` | Поверхня helper-ів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані helper-підшляхи bundled plugins">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper-и підтримки bundled browser plugin (`browser-support` залишається compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper-ів/runtime для bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper-ів/runtime для bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helper-ів для bundled IRC |
    | Helper-и, специфічні для channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seams сумісності/helper-и для bundled channels |
    | Helper-и, специфічні для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Helper seams для bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                    |
| ------------------------------------------------ | ------------------------------ |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)      |
| `api.registerCliBackend(...)`                    | Локальний backend CLI inference |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями    |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT    |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокову транскрипцію realtime |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні сесії голосу realtime |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео   |
| `api.registerImageGenerationProvider(...)`       | Генерацію зображень            |
| `api.registerMusicGenerationProvider(...)`       | Генерацію музики               |
| `api.registerVideoGenerationProvider(...)`       | Генерацію відео                |
| `api.registerWebFetchProvider(...)`              | Provider для web fetch / scrape |
| `api.registerWebSearchProvider(...)`             | Web search                     |

### Tools і команди

| Method                          | Що реєструє                                 |
| ------------------------------- | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agent-а (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацьку команду (обходить LLM)        |

### Інфраструктура

| Method                                         | Що реєструє                         |
| ---------------------------------------------- | ----------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                          |
| `api.registerHttpRoute(params)`                | HTTP endpoint gateway               |
| `api.registerGatewayMethod(name, handler)`     | RPC method gateway                  |
| `api.registerCli(registrar, opts?)`            | Підкоманду CLI                      |
| `api.registerService(service)`                 | Фоновий service                     |
| `api.registerInteractiveHandler(registration)` | Interactive handler                 |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивний розділ prompt, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний corpus пошуку/читання пам’яті |

Зарезервовані простори імен core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область gateway method. Для
методів, що належать plugin, віддавайте перевагу префіксам, специфічним для plugin.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі парсингу, які використовуються для кореневої довідки CLI,
  маршрутизації та ледачої реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася lazy-loaded у звичайному шляху кореневого CLI,
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
        description: "Керування обліковими записами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, коли вам не потрібна ледача реєстрація в кореневому CLI.
Цей eager-шлях сумісності залишається підтримуваним, але він не встановлює
placeholders на основі descriptor для ледачого завантаження під час парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає plugin змогу володіти config за замовчуванням для локального
AI CLI backend, такого як `codex-cli`.

- `id` backend стає префіксом provider-а в model refs, таких як `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значення plugin за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписування для сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб engine міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Єдину memory capability                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt для пам’яті                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush пам’яті                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                                                                                                                                 |

### Адаптери embedding для пам’яті

| Method                                         | Що реєструє                                    |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для пам’яті для активного plugin |

- `registerMemoryCapability` — це рекомендований API ексклюзивного plugin пам’яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugins могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватної
  структури конкретного plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застаріло-сумісні API ексклюзивного plugin пам’яті.
- `registerMemoryEmbeddingProvider` дає активному plugin пам’яті змогу реєструвати один
  або кілька id embedding adapter (наприклад, `openai`, `gemini` або
  користувацький id, визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих
  id adapter-ів.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований lifecycle hook   |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик binding conversation |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як якщо не вказувати `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handlers із нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як якщо не вказувати `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler бере dispatch на себе, handlers із нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює це значення, handlers із нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як якщо не вказувати `cancel`), а не перевизначенням.

### Поля об’єкта API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID plugin                                                                                   |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                               |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                 |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                      |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                    |
| `api.config`             | `OpenClawConfig`          | Поточний знімок config (активний знімок runtime у пам’яті, коли доступний)                 |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для plugin config з `plugins.entries.<id>.config`                                |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/uk/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Логер з областю видимості (`debug`, `info`, `warn`, `error`)                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легковаге вікно запуску/налаштування перед повним entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня plugin                                                     |

## Угода щодо внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні runtime експорти
  index.ts          # Точка входу plugin
  setup-entry.ts    # Легка точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production code. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Facade-loaded публічні поверхні bundled plugin (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли) тепер віддають перевагу
активному знімку runtime config, коли OpenClaw уже запущено. Якщо знімка runtime
ще немає, вони повертаються до config-файлу на диску, шлях до якого було визначено.

Provider plugins також можуть експонувати вузький локальний barrel контракту plugin, коли
helper навмисно є специфічним для provider-а і ще не належить до загального підшляху SDK.
Поточний bundled приклад: provider Anthropic зберігає свої Claude
stream helper-и у власному публічному seam `api.ts` / `contract-api.ts` замість
просування логіки Anthropic beta-header і `service_tier` у загальний
контракт `plugin-sdk/*`.

Інші поточні bundled приклади:

- `@openclaw/openai-provider`: `api.ts` експортує конструктори provider-ів,
  helper-и моделей за замовчуванням і конструктори realtime provider-ів
- `@openclaw/openrouter-provider`: `api.ts` експортує конструктор provider-а, а також
  helper-и онбордингу/config

<Warning>
  Production code extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді є спільним, просуньте його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливість, замість зв’язування двох plugins між собою.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми config
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — глибока архітектура та модель можливостей
