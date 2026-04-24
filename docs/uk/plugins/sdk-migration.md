---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED.
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED.
    - Ви використовуєте `api.registerEmbeddedExtensionFactory`.
    - Ви оновлюєте Plugin до сучасної архітектури plugin.
    - Ви підтримуєте зовнішній Plugin OpenClaw.
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK.
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-24T19:52:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa44b2e9f3748ce41c91b5e389dbe0acee03e2ec84b35086068f419a252208a0
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури plugin
із точковими, задокументованими імпортами. Якщо ваш Plugin було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система plugin надавала дві широко відкриті поверхні, які дозволяли plugin
імпортувати все необхідне з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки
  допоміжних засобів. Його було додано, щоб старіші hook-based plugin продовжували працювати, поки
  будувалася нова архітектура plugin.
- **`openclaw/extension-api`** — міст, який давав plugin прямий доступ до
  host-side helper, таких як вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — hook bundled extension лише для Pi,
  який міг спостерігати за подіями embedded-runner, такими як `tool_result`.

Тепер ці поверхні **застарілі**. Вони все ще працюють під час виконання, але нові
plugin не повинні їх використовувати, а наявним plugin слід мігрувати до того, як
наступний мажорний реліз їх видалить.

OpenClaw не видаляє й не переосмислює задокументовану поведінку plugin у тій самій
зміні, яка вводить заміну. Зміни контракту, що ламають сумісність, спочатку мають пройти
через адаптер сумісності, діагностику, документацію та вікно депрекації.
Це стосується імпортів SDK, полів маніфесту, API налаштування, hooks і поведінки
реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних релізів.
  Plugin, які досі імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного helper завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти полегшували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експорти стабільні, а які внутрішні

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams постачальників для bundled channels також зникли. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
helper seams із брендингом channel і
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями mono-repo, а не
стабільними контрактами plugin. Натомість використовуйте вузькі загальні subpath SDK. Усередині
робочого простору bundled plugin зберігайте helper, які належать постачальнику, у власному
`api.ts` або `runtime-api.ts` цього plugin.

Поточні приклади bundled provider:

- Anthropic зберігає helper потоків, специфічні для Claude, у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI зберігає builder-и provider, helper-и моделей за замовчуванням і builder-и
  realtime provider у власному `api.ts`
- OpenRouter зберігає helper-и builder provider і onboarding/config у власному
  `api.ts`

## Політика сумісності

Для зовнішніх plugin робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку через адаптер сумісності
3. виводити діагностику або попередження, що вказує старий шлях і заміну
4. покрити обидва шляхи в тестах
5. задокументувати депрекацію та шлях міграції
6. видаляти лише після оголошеного вікна міграції, зазвичай у мажорному релізі

Якщо поле маніфесту все ще приймається, автори plugin можуть і далі його використовувати,
доки документація та діагностика не скажуть інакше. Новий код має надавати перевагу
задокументованій заміні, але наявні plugin не повинні ламатися під час звичайних мінорних
релізів.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть tool-result extensions для Pi на middleware">
    Замініть handler-и `api.registerEmbeddedExtensionFactory(...)` для tool-result, що
    працюють лише з Pi, на harness-neutral middleware.

    ```typescript
    // Before: Pi-only compatibility hook
    api.registerEmbeddedExtensionFactory((pi) => {
      pi.on("tool_result", async (event) => {
        return compactToolResult(event);
      });
    });

    // After: Pi and Codex app-server dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      harnesses: ["pi", "codex-app-server"],
    });
    ```

    Одночасно оновіть маніфест plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex-app-server"]
      }
    }
    ```

    Залишайте `contracts.embeddedExtensionFactories` лише для bundled compatibility
    коду, якому все ще потрібні прямі події Pi embedded-runner.

  </Step>

  <Step title="Перенесіть approval-native handler-и на capability facts">
    Plugin channel, які підтримують approval, тепер відкривають нативну поведінку approval через
    `approvalCapability.nativeRuntime` плюс спільний реєстр runtime-context.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, із застарілого зв’язування `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу channel; approval auth
      hooks там більше не читаються core
    - Реєструйте runtime-об’єкти, що належать channel, такі як clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення reroute, що належать plugin, із native approval handler-ів;
      тепер core відповідає за routed-elsewhere notices на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для актуального макета approval capability.

  </Step>

  <Step title="Перевірте fallback-поведінку обгортки Windows">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані обгортки Windows
    `.cmd`/`.bat` тепер завершуються без fallback, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Set this only for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Якщо ваш код навмисно не покладається на shell fallback, не встановлюйте
    `allowShellFallback`, а натомість обробіть викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у вашому plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на точкові імпорти">
    Кожен експорт зі старої поверхні відповідає певному сучасному шляху імпорту:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Для host-side helper використовуйте injected runtime plugin замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших helper-ів застарілого bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper-и session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Зберіть і протестуйте">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Довідник шляхів імпорту

  <Accordion title="Таблиця поширених шляхів імпорту">
  | Import path | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний helper точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella re-export для визначень/builder-ів точки входу channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт схеми конфігурації root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper точки входу одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Точкові визначення й builder-и точки входу channel | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні helper-и майстра налаштування | Запити allowlist, builder-и статусу налаштування |
  | `plugin-sdk/setup-runtime` | Helper-и runtime під час налаштування | Безпечні для імпорту адаптери patch налаштування, helper-и lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | Helper-и адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper-и інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper-и багатьох облікових записів | Helper-и списку/config/action-gate облікових записів |
  | `plugin-sdk/account-id` | Helper-и account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Helper-и пошуку облікового запису | Helper-и пошуку облікового запису + fallback за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі helper-и облікового запису | Helper-и списку облікових записів/account-action |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви pairing для DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Підключення префікса reply + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder-и схем config | Типи схем конфігурації channel |
  | `plugin-sdk/telegram-command-config` | Helper-и config команд Telegram | Нормалізація назв команд, обрізання описів, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики group/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper-и життєвого циклу статусу облікового запису та draft stream | `createAccountStatusSink`, helper-и фіналізації попереднього перегляду draft |
  | `plugin-sdk/inbound-envelope` | Helper-и вхідного envelope | Спільні helper-и побудови route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper-и вхідного reply | Спільні helper-и record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Парсинг цілей повідомлень | Helper-и парсингу/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Helper-и вихідного media | Спільне завантаження вихідного media |
  | `plugin-sdk/outbound-runtime` | Helper-и вихідного runtime | Helper-и вихідної identity/send delegate і планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper-и thread-binding | Helper-и життєвого циклу та адаптера thread-binding |
  | `plugin-sdk/agent-media-payload` | Застарілі helper-и media payload | Builder agent media payload для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime channel |
  | `plugin-sdk/channel-send-result` | Типи результатів send | Типи результатів reply |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі helper-и runtime | Helper-и runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Вузькі helper-и runtime env | Helper-и logger/runtime env, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні helper-и runtime Plugin | Helper-и команд/hooks/http/interactive для Plugin |
  | `plugin-sdk/hook-runtime` | Helper-и pipeline hook | Спільні helper-и pipeline webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Helper-и lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper-и process | Спільні helper-и exec |
  | `plugin-sdk/cli-runtime` | Helper-и CLI runtime | Форматування команд, очікування, helper-и версій |
  | `plugin-sdk/gateway-runtime` | Helper-и Gateway | Helper-и клієнта Gateway і patch статусу channel |
  | `plugin-sdk/config-runtime` | Helper-и config | Helper-и завантаження/запису config |
  | `plugin-sdk/telegram-command-config` | Helper-и команд Telegram | Helper-и валідації команд Telegram зі стабільним fallback, коли поверхня контракту bundled Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Helper-и prompt approval | Payload exec/plugin approval, helper-и capability/profile approval, helper-и маршрутизації/runtime native approval |
  | `plugin-sdk/approval-auth-runtime` | Helper-и auth approval | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Helper-и клієнта approval | Helper-и профілю/фільтра native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Helper-и доставки approval | Адаптери capability/delivery native approval |
  | `plugin-sdk/approval-gateway-runtime` | Helper-и Gateway approval | Спільний helper визначення Gateway approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper-и адаптера approval | Легковагові helper-и завантаження адаптера native approval для гарячих точок входу channel |
  | `plugin-sdk/approval-handler-runtime` | Helper-и handler approval | Ширші helper-и runtime handler approval; надавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Helper-и цілей approval | Helper-и прив’язки цілі/облікового запису native approval |
  | `plugin-sdk/approval-reply-runtime` | Helper-и reply approval | Helper-и payload reply exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Helper-и runtime-context channel | Загальні helper-и register/get/watch для runtime-context channel |
  | `plugin-sdk/security-runtime` | Helper-и безпеки | Спільні helper-и trust, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Helper-и політики SSRF | Helper-и allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Helper-и runtime SSRF | Helper-и pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/collection-runtime` | Helper-и обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper-и керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper-и форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helper-и графа помилок |
  | `plugin-sdk/fetch-runtime` | Helper-и wrapped fetch/proxy | `resolveFetch`, helper-и proxy |
  | `plugin-sdk/host-runtime` | Helper-и нормалізації host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper-и retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Керування командами та helper-и поверхні команд | `resolveControlCommandGate`, helper-и авторизації відправника, helper-и реєстру команд |
  | `plugin-sdk/command-status` | Рендерери статусу/help команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Парсинг secret input | Helper-и secret input |
  | `plugin-sdk/webhook-ingress` | Helper-и запитів Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper-и guards тіла запиту Webhook | Helper-и читання/ліміту тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime reply | Inbound dispatch, Heartbeat, planner reply, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper-и dispatch reply | Helper-и finalize, provider dispatch і міток conversation |
  | `plugin-sdk/reply-history` | Helper-и історії reply | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань reply | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper-и chunk reply | Helper-и chunking text/markdown |
  | `plugin-sdk/session-store-runtime` | Helper-и session store | Helper-и шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Helper-и шляхів стану | Helper-и каталогів state і OAuth |
  | `plugin-sdk/routing` | Helper-и routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper-и нормалізації session-key |
  | `plugin-sdk/status-helpers` | Helper-и статусу channel | Builder-и зведення статусу channel/account, значення runtime-state за замовчуванням, helper-и метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Helper-и визначення цілі | Спільні helper-и визначення цілі |
  | `plugin-sdk/string-normalization-runtime` | Helper-и нормалізації рядків | Helper-и нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Helper-и URL запиту | Витяг рядкових URL з request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Helper-и timed command | Виконавець timed command із нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Загальні зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягнення payload tool | Витяг нормалізованих payload з об’єктів результатів tool |
  | `plugin-sdk/tool-send` | Витягнення send tool | Витяг канонічних полів цілі send з аргументів tool |
  | `plugin-sdk/temp-path` | Helper-и тимчасових шляхів | Спільні helper-и шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Helper-и logging | Helper-и logger підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Helper-и markdown-table | Helper-и режимів markdown table |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload reply |
  | `plugin-sdk/provider-setup` | Кураторські helper-и налаштування локальних/self-hosted provider | Helper-и виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Точкові helper-и налаштування self-hosted provider, сумісного з OpenAI | Ті самі helper-и виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Helper-и runtime auth provider | Helper-и визначення API-key під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Helper-и налаштування API-key provider | Helper-и onboarding/profile-write для API-key |
  | `plugin-sdk/provider-auth-result` | Helper-и auth-result provider | Стандартний builder auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Helper-и інтерактивного входу provider | Спільні helper-и інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Helper-и вибору provider | Вибір provider configured-or-auto і злиття raw config provider |
  | `plugin-sdk/provider-env-vars` | Helper-и env var provider | Helper-и пошуку auth env var provider |
  | `plugin-sdk/provider-model-shared` | Спільні helper-и моделей/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и replay-policy, helper-и endpoint provider і helper-и нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні helper-и каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі onboarding provider | Helper-и конфігурації onboarding |
  | `plugin-sdk/provider-http` | Helper-и HTTP provider | Загальні helper-и HTTP/можливостей endpoint provider, зокрема helper-и multipart form для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Helper-и web-fetch provider | Helper-и реєстрації/кешу provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper-и конфігурації web-search provider | Вузькі helper-и config/облікових даних web-search для provider, яким не потрібне зв’язування enable Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper-и контракту web-search provider | Вузькі helper-и контракту config/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter-и облікових даних з обмеженою областю |
  | `plugin-sdk/provider-web-search` | Helper-и web-search provider | Helper-и реєстрації/кешу/runtime provider web-search |
  | `plugin-sdk/provider-tools` | Helper-и сумісності tool/schema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також helper-и сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper-и використання provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helper-и використання provider |
  | `plugin-sdk/provider-stream` | Helper-и обгортки stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream і спільні helper-и обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper-и транспорту provider | Нативні helper-и транспорту provider, такі як guarded fetch, перетворення transport message і доступні для запису event stream транспорту |
  | `plugin-sdk/keyed-async-queue` | Упорядкована async queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні helper-и media | Helper-и fetch/transform/store для media, а також builder-и media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні helper-и генерації media | Спільні helper-и failover, вибір кандидатів і повідомлення про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Helper-и media-understanding | Типи provider media understanding, а також експортовані helper-и зображень/аудіо для provider |
  | `plugin-sdk/text-runtime` | Спільні helper-и text | Видалення видимого асистенту тексту, helper-и рендерингу/chunking/table для markdown, helper-и редагування, helper-и тегів директив, утиліти safe-text і пов’язані helper-и text/logging |
  | `plugin-sdk/text-chunking` | Helper-и chunking тексту | Helper chunking вихідного тексту |
  | `plugin-sdk/speech` | Helper-и speech | Типи provider speech, а також helper-и директив, registry і валідації для provider |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи provider speech, registry, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Helper-и транскрибування в реальному часі | Типи provider, helper-и registry і спільний helper WebSocket session |
  | `plugin-sdk/realtime-voice` | Helper-и голосу в реальному часі | Типи provider, helper-и registry/визначення та helper-и bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, helper-и failover, auth і registry |
  | `plugin-sdk/music-generation` | Helper-и генерації музики | Типи provider/request/result для генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helper-и failover, пошук provider і парсинг model-ref |
  | `plugin-sdk/video-generation` | Helper-и генерації відео | Типи provider/request/result для генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helper-и failover, пошук provider і парсинг model-ref |
  | `plugin-sdk/interactive-runtime` | Helper-и інтерактивного reply | Нормалізація/зменшення payload інтерактивного reply |
  | `plugin-sdk/channel-config-primitives` | Примітиви config channel | Вузькі примітиви config-schema channel |
  | `plugin-sdk/channel-config-writes` | Helper-и запису config channel | Helper-и авторизації запису config channel |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude channel | Експорти спільного prelude plugin channel |
  | `plugin-sdk/channel-status` | Helper-и статусу channel | Спільні helper-и snapshot/summary статусу channel |
  | `plugin-sdk/allowlist-config-edit` | Helper-и config allowlist | Helper-и редагування/читання config allowlist |
  | `plugin-sdk/group-access` | Helper-и доступу до group | Спільні helper-и прийняття рішень щодо доступу до group |
  | `plugin-sdk/direct-dm` | Helper-и direct-DM | Спільні helper-и auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні helper-и extension | Примітиви helper-ів passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Helper-и цілей Webhook | Реєстр цілей Webhook і helper-и встановлення route |
  | `plugin-sdk/webhook-path` | Helper-и шляху Webhook | Helper-и нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні helper-и web media | Helper-и завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Helper-и bundled memory-core | Поверхня helper-ів memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексації/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій host пам’яті | Експорти базового рушія host пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding host пам’яті | Контракти embedding пам’яті, доступ до registry, local provider і загальні helper-и batch/remote; конкретні remote provider містяться у plugin, яким вони належать |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD host пам’яті | Експорти рушія QMD host пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища host пам’яті | Експорти рушія сховища host пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні helper-и host пам’яті | Мультимодальні helper-и host пам’яті |
  | `plugin-sdk/memory-core-host-query` | Helper-и запитів host пам’яті | Helper-и запитів host пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Helper-и секретів host пам’яті | Helper-и секретів host пам’яті |
  | `plugin-sdk/memory-core-host-events` | Helper-и журналу подій host пам’яті | Helper-и журналу подій host пам’яті |
  | `plugin-sdk/memory-core-host-status` | Helper-и статусу host пам’яті | Helper-и статусу host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime host пам’яті | Helper-и CLI runtime host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime host пам’яті | Helper-и core runtime host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper-и файлів/runtime host пам’яті | Helper-и файлів/runtime host пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime host пам’яті | Незалежний від постачальника псевдонім для helper-ів core runtime host пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій host пам’яті | Незалежний від постачальника псевдонім для helper-ів журналу подій host пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime host пам’яті | Незалежний від постачальника псевдонім для helper-ів файлів/runtime host пам’яті |
  | `plugin-sdk/memory-host-markdown` | Helper-и керованого markdown | Спільні helper-и керованого markdown для plugin, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу host пам’яті | Незалежний від постачальника псевдонім для helper-ів статусу host пам’яті |
  | `plugin-sdk/memory-lancedb` | Helper-и bundled memory-lancedb | Поверхня helper-ів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Helper-и тестування та mocks |
</Accordion>

Ця таблиця навмисно охоплює поширену підмножину для міграції, а не всю поверхню
SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі helper seams для bundled plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони залишаються експортованими для
підтримки bundled plugin і сумісності, але навмисно
не включені до поширеної таблиці міграції та не є рекомендованою ціллю для
нового коду plugin.

Те саме правило застосовується до інших сімейств bundled helper, таких як:

- helper-и підтримки browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- bundled helper/plugin surfaces, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі відкриває вузьку поверхню helper-ів токенів:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Часова шкала видалення

| Коли | Що відбувається |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз** | Застарілі поверхні виводять попередження під час виконання |
| **Наступний мажорний реліз** | Застарілі поверхні буде видалено; plugin, які все ще їх використовують, завершуватимуться з помилкою |

Усі core plugin уже мігровано. Зовнішнім plugin слід виконати міграцію
до наступного мажорного релізу.

## Тимчасове придушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Plugins channel](/uk/plugins/sdk-channel-plugins) — створення plugin channel
- [Plugins provider](/uk/plugins/sdk-provider-plugins) — створення plugin provider
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибше занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
