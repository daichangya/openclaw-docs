---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте Plugin до сучасної архітектури Pluginів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-18T20:44:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Міграція Plugin SDK

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Pluginів із вузькоспрямованими, задокументованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Pluginів надавала дві широко відкриті поверхні, які дозволяли Pluginам імпортувати все необхідне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб старіші Pluginи на основі хуків продовжували працювати, поки розроблялася нова архітектура Pluginів.
- **`openclaw/extension-api`** — міст, який надавав Pluginам прямий доступ до допоміжних засобів на боці хоста, таких як вбудований засіб запуску агентів.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час виконання, але нові Pluginи не повинні їх використовувати, а наявні Pluginи мають перейти на новий підхід до того, як у наступному мажорному релізі їх буде вилучено.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Pluginи, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних між собою модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які — внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні шари provider для вбудованих каналів також зникли. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
допоміжні шари з брендуванням каналу, а також
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями mono-repo, а не
стабільними контрактами Pluginів. Натомість використовуйте вузькі узагальнені підшляхи SDK. Усередині
робочого простору вбудованих Pluginів зберігайте допоміжні засоби, що належать provider, у власних
`api.ts` або `runtime-api.ts` цього Pluginа.

Поточні приклади вбудованих provider:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власному шарі `api.ts` /
  `contract-api.ts`
- OpenAI зберігає конструктори provider, допоміжні засоби моделей за замовчуванням і конструктори realtime provider
  у власному `api.ts`
- OpenRouter зберігає конструктор provider і допоміжні засоби онбордингу/конфігурації у власному
  `api.ts`

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть approval-native обробники на факти можливостей">
    Channel Pluginи з підтримкою approval тепер надають власну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром контексту runtime.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, із застарілої прив’язки `plugin.auth` /
      `plugin.approvals` до `approvalCapability`
    - `ChannelPlugin.approvals` було вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу channel; auth-хуки approval
      там більше не зчитуються ядром
    - Реєструйте об’єкти runtime, що належать каналу, як-от клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення про перенаправлення, що належать Pluginу, з native approval-обробників;
      тепер ядро відповідає за сповіщення «маршрутизовано в інше місце» на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` до `createChannelManager(...)` надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Поточну структуру можливостей approval див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, невизначені Windows
    обгортки `.cmd`/`.bat` тепер завершуються за принципом fail closed, якщо ви явно не передасте
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

    Якщо ваш виклик навмисно не покладається на shell fallback, не встановлюйте
    `allowShellFallback`, а натомість обробіть викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму Pluginі імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на вузькоспрямовані імпорти">
    Кожному експорту зі старої поверхні відповідає певний сучасний шлях імпорту:

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

    Для допоміжних засобів на боці хоста використовуйте інжектований runtime Pluginа замість прямого
    імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується й до інших допоміжних засобів застарілого bridge:

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
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу Pluginа | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий узагальнений повторний експорт для визначень/конструкторів точок входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Вузькоспрямовані визначення та конструктори точок входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити allowlist, конструктори статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime для часу налаштування | Безпечні для імпорту адаптери patch налаштування, допоміжні засоби приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку/конфігурації/гейтингу дій облікових записів |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікового запису та резервного вибору за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/дій з обліковими записами |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Прив’язка префікса відповіді та набору тексту | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем конфігурації | Типи схем конфігурації каналу |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Відстеження статусу облікового запису | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного envelope | Спільні допоміжні засоби маршрутування та побудови envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідної відповіді | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідного медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного runtime | Допоміжні засоби ідентичності вихідних даних/делегата надсилання |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язки потоків | Життєвий цикл прив’язки потоків і допоміжні засоби адаптера |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби payload медіа агента | Конструктор payload медіа агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Pluginа | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/резервного копіювання/встановлення Pluginів |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime | Допоміжні засоби logger/runtime env, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Pluginа | Допоміжні засоби команд/хуків/http/інтерактивності Pluginа |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра хуків | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби runtime CLI | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway і допоміжні засоби patch статусу каналу |
  | `plugin-sdk/config-runtime` | Допоміжні засоби конфігурації | Допоміжні засоби завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Допоміжні засоби перевірки команд Telegram зі стабільним fallback, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів approval | Payload approval exec/Pluginа, допоміжні засоби можливостей/профілів approval, допоміжні засоби маршрутизації/runtime native approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth approval | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта approval | Допоміжні засоби профілю/фільтра native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки approval | Адаптери можливостей/доставки native approval |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway для approval | Спільний допоміжний засіб визначення Gateway для approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера approval | Полегшені допоміжні засоби завантаження адаптера native approval для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника approval | Ширші допоміжні засоби runtime обробника approval; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей approval | Допоміжні засоби прив’язки цілі/облікового запису native approval |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді approval | Допоміжні засоби payload відповіді approval exec/Pluginа |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби контексту runtime каналу | Узагальнені допоміжні засоби register/get/watch контексту runtime каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, DM gating, зовнішнього вмісту та збору секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби runtime SSRF | Pinned dispatcher, захищений fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, засоби запуску політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення введення allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Гейтинг команд і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд |
  | `plugin-sdk/command-status` | Засоби візуалізації статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Допоміжні засоби введення секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідна диспетчеризація, Heartbeat, планувальник відповіді, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Допоміжні засоби фіналізації та диспетчеризації provider |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань на відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunk відповіді | Допоміжні засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Шлях сховища та допоміжні засоби updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану й OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу каналу | Конструктори підсумку статусу каналу/облікового запису, значення runtime-state за замовчуванням, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначення цілей | Спільні допоміжні засоби визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймером | Засіб запуску команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструментів | Витягування нормалізованих payload із об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування надсилання інструментів | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби логування | Logger підсистеми та допоміжні засоби редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби markdown-таблиць | Допоміжні засоби режиму markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted provider | Допоміжні засоби виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Вузькоспрямовані допоміжні засоби налаштування self-hosted provider, сумісного з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби auth runtime provider | Допоміжні засоби визначення API-ключа runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа provider | Допоміжні засоби онбордингу/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результату auth provider | Стандартний конструктор результату OAuth auth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу provider | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби змінних середовища provider | Допоміжні засоби пошуку змінних середовища auth provider |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політики replay, допоміжні засоби endpoint provider і нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу provider | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP provider | Узагальнені допоміжні засоби HTTP/можливостей endpoint provider |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch provider | Допоміжні засоби реєстрації/кешу provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search provider | Вузькі допоміжні засоби конфігурації/облікових даних web-search для provider, яким не потрібна прив’язка ввімкнення Pluginа |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search provider | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і засоби встановлення/отримання облікових даних з обмеженою областю дії |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search provider | Допоміжні засоби реєстрації/кешу/runtime provider web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання provider |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгортки потоку provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту provider | Допоміжні засоби нативного транспорту provider, такі як guarded fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/перетворення/зберігання медіа, а також конструктори payload медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи provider media-understanding, а також орієнтовані на provider допоміжні експорти для зображень/аудіо |
  | `plugin-sdk/text-runtime` | Спільні текстові допоміжні засоби | Видалення видимого для помічника тексту, допоміжні засоби рендерингу/chunking/таблиць markdown, допоміжні засоби редагування, допоміжні засоби тегів директив, утиліти безпечного тексту та пов’язані допоміжні засоби тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking тексту | Допоміжний засіб chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби speech | Типи provider speech, а також орієнтовані на provider допоміжні засоби директив, реєстру та перевірки |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи provider speech, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи provider і допоміжні засоби реєстру |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи provider і допоміжні засоби реєстру |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, auth і допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи provider/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук provider і розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи provider/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук provider і розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/зведення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви config-schema каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний прелюд каналу | Експорти спільного прелюду channel Plugin |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби знімків/підсумків статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні допоміжні засоби ухвалення рішень щодо доступу до груп |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви passive-channel/status і ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляху Webhook | Допоміжні засоби нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексації/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-рушій host пам’яті | Експорти foundation-рушія host пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-рушій host пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний provider і узагальнені пакетні/віддалені допоміжні засоби; конкретні віддалені provider розміщуються у Pluginах, яким вони належать |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-рушій host пам’яті | Експорти QMD-рушія host пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-рушій host пам’яті | Експорти storage-рушія host пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби host пам’яті | Мультимодальні допоміжні засоби host пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів host пам’яті | Допоміжні засоби запитів host пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів host пам’яті | Допоміжні засоби секретів host пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій host пам’яті | Допоміжні засоби журналу подій host пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу host пам’яті | Допоміжні засоби статусу host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host пам’яті | Допоміжні засоби runtime CLI host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Базовий runtime host пам’яті | Допоміжні засоби базового runtime host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime host пам’яті | Допоміжні засоби файлів/runtime host пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім базового runtime host пам’яті | Нейтральний до постачальника псевдонім для допоміжних засобів базового runtime host пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій host пам’яті | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій host пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime host пам’яті | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/runtime host пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для Pluginів, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу host пам’яті | Нейтральний до постачальника псевдонім для допоміжних засобів статусу host пам’яті |
  | `plugin-sdk/memory-lancedb` | Вбудовані допоміжні засоби memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Тестові утиліти | Допоміжні засоби тестування та mocks |
</Accordion>

Ця таблиця навмисно є поширеною підмножиною для міграції, а не повною поверхнею
SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі шви допоміжних засобів вбудованих Pluginів, як-от
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки та сумісності вбудованих Pluginів, але навмисно не включені до
поширеної таблиці міграції й не є рекомендованою ціллю для нового коду Pluginів.

Те саме правило застосовується до інших сімейств вбудованих допоміжних засобів, таких як:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих допоміжних засобів/Pluginів, як-от `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню допоміжних засобів токена:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти потрібний експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Часова шкала вилучення

| Коли | Що відбувається |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз** | Застарілі поверхні виводять попередження під час виконання |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; Pluginи, які все ще їх використовують, перестануть працювати |

Усі core Pluginи вже було мігровано. Зовнішнім Pluginам слід виконати
міграцію до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Pluginи каналів](/uk/plugins/sdk-channel-plugins) — створення Pluginів каналів
- [Pluginи provider](/uk/plugins/sdk-provider-plugins) — створення Pluginів provider
- [Внутрішня будова Pluginів](/uk/plugins/architecture) — поглиблений огляд архітектури
- [Маніфест Pluginа](/uk/plugins/manifest) — довідник зі схеми маніфесту
