---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте plugin до сучасної архітектури plugins
    - Ви підтримуєте зовнішній plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-06T03:21:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: f648ea36622ef899db7f31dff2d40bcd9c55b52f0d0c2e584925ace022c3c160
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Міграція Plugin SDK

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної
архітектури plugins із цільовими, задокументованими імпортами. Якщо ваш plugin
було створено до появи нової архітектури, цей посібник допоможе вам перейти на неї.

## Що змінюється

Стара система plugins надавала дві широкі поверхні, які дозволяли plugins
імпортувати все необхідне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки
  допоміжних засобів. Його було запроваджено, щоб старіші plugins на основі hook
  продовжували працювати, поки створювалася нова архітектура plugins.
- **`openclaw/extension-api`** — міст, який надавав plugins прямий доступ до
  допоміжних засобів на боці хоста, як-от вбудований запускальник агента.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час виконання, але
нові plugins не повинні їх використовувати, а наявні plugins слід перенести до того,
як наступний мажорний випуск їх видалить.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних випусків.
  Plugins, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу визначити, які експорти є стабільними, а які внутрішніми

Сучасний plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams постачальників для вбудованих каналів також прибрано. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
допоміжні seams із брендингом каналів, а також
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями mono-repo, а не
стабільними контрактами plugins. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині
вбудованого робочого простору plugin тримайте допоміжні засоби, що належать постачальнику, у власних
`api.ts` або `runtime-api.ts` цього plugin.

Поточні приклади вбудованих постачальників:

- Anthropic зберігає допоміжні засоби потоку, специфічні для Claude, у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI зберігає конструктори постачальника, допоміжні засоби моделей за замовчуванням і конструктори постачальника реального часу
  у власному `api.ts`
- OpenRouter зберігає конструктор постачальника та допоміжні засоби onboarding/config у власному
  `api.ts`

## Як виконати міграцію

<Steps>
  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
    wrappers `.cmd`/`.bat` тепер завершуються з відмовою за замовчуванням, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Якщо ваш код виклику навмисно не покладається на резервний shell, не встановлюйте
    `allowShellFallback`, а натомість обробіть викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на цільові імпорти">
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

    Для допоміжних засобів на боці хоста використовуйте інжектований runtime plugin замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується й до інших застарілих допоміжних засобів bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні засоби сховища сесій | `api.runtime.agent.session.*` |

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
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий узагальнений повторний експорт для визначень/конструкторів точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми config | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного постачальника | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та конструктори точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити allowlist, конструктори стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime для етапу налаштування | Безпечні для імпорту адаптери patch налаштування, допоміжні засоби нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/config/action-gate |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікового запису + резервного вибору за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/дій з обліковими записами |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви спаровування DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді + зв’язування індикатора набору | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем config | Типи схем config каналу |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби config команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Відстеження стану облікового запису | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного envelope | Спільні допоміжні засоби маршрутів + побудови envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідних відповідей | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідного media | Спільне завантаження вихідного media |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного runtime | Допоміжні засоби делегування ідентичності/надсилання для вихідних повідомлень |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язки thread | Допоміжні засоби життєвого циклу та адаптера прив’язки thread |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Конструктор media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/резервного копіювання/встановлення plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime | Logger/runtime env, допоміжні засоби timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime plugin | Допоміжні засоби команд/hooks/http/interactive для plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hook | Спільні допоміжні засоби конвеєра webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби runtime CLI | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби gateway | Клієнт gateway і допоміжні засоби patch стану каналів |
  | `plugin-sdk/config-runtime` | Допоміжні засоби config | Допоміжні засоби завантаження/запису config |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Допоміжні засоби перевірки команд Telegram зі стабільним резервним варіантом, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів схвалення | Payload схвалення exec/plugin, допоміжні засоби можливостей/профілів схвалення, нативна маршрутизація/runtime схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth для схвалення | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Допоміжні засоби профілю/фільтра нативного схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки схвалення | Адаптери можливостей/доставки нативного схвалення |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей схвалення | Допоміжні засоби прив’язки цілей/облікових записів нативного схвалення |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповідей на схвалення | Допоміжні засоби payload відповідей для схвалення exec/plugin |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватних мереж |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби runtime SSRF | Pinned-dispatcher, guarded fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, засоби запуску політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating команд і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Допоміжні засоби введення секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів webhook | Утиліти цілей webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла webhook-запиту | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Вхідна диспетчеризація, heartbeat, планувальник відповідей, поділ на частини |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Допоміжні засоби фіналізації + диспетчеризації постачальника |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань на відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби поділу відповідей на частини | Допоміжні засоби поділу тексту/markdown на частини |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/ключів сесій | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації ключів сесій |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналів | Конструктори зведення стану каналу/облікового запису, типові значення runtime-state, допоміжні засоби метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначення цілей | Спільні допоміжні засоби визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL із запитоподібних входів |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із тайм-аутом | Запускач команд із тайм-аутом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Загальні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-send` | Витягування надсилання інструмента | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляху для тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби логування | Допоміжні засоби logger підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби markdown-таблиць | Допоміжні засоби режимів markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей повідомлень | Типи payload відповідей |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted постачальників | Допоміжні засоби виявлення/config для self-hosted постачальників |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted постачальників, сумісних з OpenAI | Ті самі допоміжні засоби виявлення/config для self-hosted постачальників |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби auth постачальника під час runtime | Допоміжні засоби визначення API-ключа під час runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа постачальника | Допоміжні засоби onboarding/запису профілю для API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результату auth постачальника | Стандартний конструктор результату OAuth auth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу постачальника | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env vars постачальника | Допоміжні засоби пошуку env vars auth постачальника |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/повторного відтворення постачальника | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політики повторного відтворення, допоміжні засоби endpoint постачальника та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу постачальника | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches onboarding постачальника | Допоміжні засоби config onboarding |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP постачальника | Загальні допоміжні засоби HTTP/можливостей endpoint постачальника |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch постачальника | Допоміжні засоби реєстрації/кешу постачальника web-fetch |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search постачальника | Допоміжні засоби реєстрації/кешу/config постачальника web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем постачальника | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання постачальника | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання постачальника |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток потоків постачальника | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби отримання/перетворення/зберігання media, а також конструктори media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації media | Спільні допоміжні засоби failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи постачальників media understanding, а також експорти допоміжних засобів для зображень/аудіо, орієнтовані на постачальника |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення видимого для асистента тексту, допоміжні засоби рендерингу/chunking/таблиць markdown, редагування, допоміжні засоби тегів директив, утиліти safe-text та інші пов’язані допоміжні засоби тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні засоби поділу тексту на частини | Допоміжний засіб поділу вихідного тексту на частини |
  | `plugin-sdk/speech` | Допоміжні засоби speech | Типи постачальників speech, а також експорти допоміжних засобів директив, реєстру та валідації, орієнтовані на постачальника |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи постачальників speech, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи постачальників і допоміжні засоби реєстру |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи постачальників і допоміжні засоби реєстру |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Допоміжні засоби типів, failover, auth і реєстру для генерації зображень |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи постачальника/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошуку постачальника та розбору model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи постачальника/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошуку постачальника та розбору model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних відповідей | Нормалізація/редукція payload інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви config каналу | Вузькі примітиви schema config каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису config каналу | Допоміжні засоби авторизації запису config каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Експорти спільного prelude plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби стану каналу | Спільні допоміжні засоби знімків/зведень стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби config allowlist | Допоміжні засоби редагування/читання config allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу груп | Спільні допоміжні засоби рішень щодо group-access |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви допоміжних засобів passive-channel/status |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей webhook | Допоміжні засоби реєстру цілей webhook та встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляху webhook | Допоміжні засоби нормалізації шляху webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддаленого/локального media |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія memory | Фасад runtime індексації/пошуку memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста memory | Експорти базового рушія хоста memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста memory | Експорти рушія embedding хоста memory |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста memory | Експорти рушія QMD хоста memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій зберігання хоста memory | Експорти рушія зберігання хоста memory |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста memory | Допоміжні засоби multimodal хоста memory |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби query хоста memory | Допоміжні засоби query хоста memory |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста memory | Допоміжні засоби secret хоста memory |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста memory | Допоміжні засоби стану хоста memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI хоста memory | Допоміжні засоби runtime CLI хоста memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Базовий runtime хоста memory | Допоміжні засоби базового runtime хоста memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста memory | Допоміжні засоби файлів/runtime хоста memory |
  | `plugin-sdk/memory-lancedb` | Вбудовані допоміжні засоби memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Тестові утиліти | Допоміжні засоби тестування та mocks |
</Accordion>

Ця таблиця навмисно охоплює поширену підмножину для міграції, а не повну
поверхню SDK. Повний список із понад 200 точок входу наведено у
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі допоміжні seams вбудованих plugins, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й далі експортуються для
підтримки вбудованих plugins і сумісності, але навмисно не включені до поширеної таблиці міграції
і не є рекомендованою ціллю для нового коду plugin.

Те саме правило застосовується до інших сімейств вбудованих допоміжних засобів, зокрема:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих helper/plugin, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню допоміжних засобів токенів
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає вашому завданню. Якщо ви не можете знайти потрібний експорт,
перевірте джерельний код у `src/plugin-sdk/` або запитайте в Discord.

## Часова шкала видалення

| Коли | Що відбувається |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз** | Застарілі поверхні видають попередження під час runtime |
| **Наступний мажорний випуск** | Застарілі поверхні буде видалено; plugins, які досі їх використовують, перестануть працювати |

Усі основні plugins уже перенесено. Зовнішні plugins слід перенести
до наступного мажорного випуску.

## Тимчасове приглушення попереджень

Під час роботи над міграцією встановіть ці змінні середовища:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний механізм, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник підшляхів імпорту
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
- [Внутрішня будова plugins](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник зі схеми маніфесту
