---
read_when:
    - Ви бачите попередження `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Ви бачите попередження `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-25T21:24:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e6359218d9ca680434d10b7b362413689de80c2065baa7cdb4a16111d1de418
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin
із цільовими, задокументованими імпортами. Якщо ваш Plugin було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві широкі поверхні, які дозволяли Plugins імпортувати
все необхідне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки
  допоміжних засобів. Його було запроваджено, щоб старіші Plugins на основі хуків
  продовжували працювати, поки будувалася нова архітектура Plugin.
- **`openclaw/extension-api`** — міст, який надавав Plugins прямий доступ до
  допоміжних засобів на боці хоста, таких як вбудований виконавець агентів.
- **`api.registerEmbeddedExtensionFactory(...)`** — видалений хук комплектованого
  розширення лише для Pi, який міг спостерігати за подіями вбудованого виконавця,
  такими як `tool_result`.

Ці широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання,
але нові Plugins не повинні їх використовувати, а наявним Plugins слід виконати міграцію
до того, як їх буде видалено в наступному мажорному випуску. API реєстрації фабрики
вбудованого розширення лише для Pi видалено; натомість використовуйте middleware результатів інструментів.

OpenClaw не видаляє й не переосмислює задокументовану поведінку Plugin у тій самій
зміні, яка додає заміну. Злами контрактів спочатку мають проходити через адаптер
сумісності, діагностику, документацію та період застарівання.
Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки
реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних випусків.
  Plugins, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрики вбудованого розширення лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK вирішує це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams постачальників для комплектованих каналів також зникли. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
фірмові helper seams каналів і
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями монорепозиторію,
а не стабільними контрактами Plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині
робочого простору комплектованого Plugin залишайте допоміжні засоби, що належать постачальнику, у власному
`api.ts` або `runtime-api.ts` цього Plugin.

Поточні приклади комплектованих постачальників:

- Anthropic зберігає специфічні для Claude допоміжні засоби потоків у власному seam
  `api.ts` / `contract-api.ts`
- OpenAI зберігає конструктори постачальника, допоміжні засоби моделі за замовчуванням і
  конструктори постачальника realtime у власному `api.ts`
- OpenRouter зберігає конструктор постачальника та допоміжні засоби onboarding/config у власному
  `api.ts`

## Політика сумісності

Для зовнішніх Plugins робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключивши її через адаптер сумісності
3. видати діагностичне повідомлення або попередження, яке вказує старий шлях і заміну
4. покрити обидва шляхи тестами
5. задокументувати застарівання і шлях міграції
6. видаляти лише після оголошеного вікна міграції, зазвичай у мажорному випуску

Якщо поле маніфесту все ще приймається, автори Plugin можуть продовжувати його використовувати,
доки документація й діагностичні повідомлення не скажуть інакше. Новий код має віддавати
перевагу задокументованій заміні, але наявні Plugins не повинні ламатися під час звичайних
мінорних випусків.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть розширення результатів інструментів Pi на middleware">
    Комплектовані Plugins мають замінити обробники результатів інструментів
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi на
    нейтральне до середовища виконання middleware.

    ```typescript
    // Динамічні інструменти Pi і Codex runtime
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть маніфест Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні Plugins не можуть реєструвати middleware результатів інструментів, оскільки воно може
    переписувати високодовірений вивід інструмента до того, як модель його побачить.

  </Step>

  <Step title="Перенесіть власні для погодження обробники на capability facts">
    Plugins каналів із підтримкою погодження тепер надають нативну поведінку погодження через
    `approvalCapability.nativeRuntime` разом із спільним реєстром контексту середовища виконання.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічну для погодження auth/delivery із застарілої прив’язки `plugin.auth` /
      `plugin.approvals` до `approvalCapability`
    - `ChannelPlugin.approvals` було видалено з публічного контракту
      channel-plugin; перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків login/logout каналу; auth-хуки для погодження
      там більше не зчитуються ядром
    - Реєструйте об’єкти runtime, що належать каналу, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення про перенаправлення, що належать Plugin, із нативних обробників погодження;
      тепер ядро володіє повідомленнями routed-elsewhere на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Поточну структуру capability погодження див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку оболонки Windows">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, невирішені Windows-обгортки
    `.cmd`/`.bat` тепер аварійно завершуються в закритому режимі, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // До
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Після
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Установлюйте це лише для довірених сумісних викликів, які свідомо
      // допускають резервний шлях через оболонку.
      allowShellFallback: true,
    });
    ```

    Якщо ваш виклик свідомо не покладається на резервний шлях через оболонку, не встановлюйте
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у вашому Plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на цільові імпорти">
    Кожен експорт зі старої поверхні відповідає певному сучасному шляху імпорту:

    ```typescript
    // До (застарілий шар зворотної сумісності)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Після (сучасні цільові імпорти)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Для допоміжних засобів на боці хоста використовуйте впроваджене середовище виконання Plugin замість
    прямого імпорту:

    ```typescript
    // До (застарілий міст extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Після (впроваджене runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується й до інших допоміжних засобів застарілого моста:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Канонічний helper точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-повторний експорт для визначень/конструкторів входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт схеми кореневої конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper точки входу для одного постачальника | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення й конструктори входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні helper засобів майстра налаштування | Підказки allowlist, конструктори стану налаштування |
  | `plugin-sdk/setup-runtime` | Runtime-helper засоби під час налаштування | Безпечні для імпорту адаптери патчів налаштування, helper засоби lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Helper засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Helper засоби списку/конфігурації/шлюзу дій облікових записів |
  | `plugin-sdk/account-id` | Helper засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Helper засоби пошуку облікових записів | Helper засоби пошуку облікового запису + fallback за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі helper засоби облікових записів | Helper засоби списку облікових записів/дій з обліковим записом |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM-парування | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Прив’язка префікса відповіді + введення тексту | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем конфігурації | Спільні примітиви схеми конфігурації каналів; іменовані експорти схем комплектованих каналів є лише застарілою сумісністю |
  | `plugin-sdk/telegram-command-config` | Helper засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper засоби статусу облікового запису та життєвого циклу потоку чернеток | `createAccountStatusSink`, helper засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Helper засоби вхідного envelope | Спільні helper засоби побудови route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper засоби вхідних відповідей | Спільні helper засоби record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Helper засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Helper засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Helper засоби залежностей вихідного надсилання | Полегшений пошук `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Helper засоби outbound runtime | Helper засоби доставки outbound, делегата identity/send, сесії, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper засоби прив’язок потоків | Helper засоби життєвого циклу та адаптера прив’язок потоків |
  | `plugin-sdk/agent-media-payload` | Застарілі helper засоби media payload | Конструктор media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі helper засоби runtime | Helper засоби runtime/logging/backup/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі helper засоби середовища runtime | Logger/runtime env, helper засоби timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні helper засоби runtime Plugin | Helper засоби команд/хуків/http/interactive для Plugin |
  | `plugin-sdk/hook-runtime` | Helper засоби pipeline хуків | Спільні helper засоби pipeline Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Helper засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper засоби процесів | Спільні helper засоби exec |
  | `plugin-sdk/cli-runtime` | Helper засоби CLI runtime | Форматування команд, очікування, helper засоби версій |
  | `plugin-sdk/gateway-runtime` | Helper засоби Gateway | Helper засоби клієнта Gateway і патчів статусу каналу |
  | `plugin-sdk/config-runtime` | Helper засоби конфігурації | Helper засоби завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Helper засоби команд Telegram | Helper засоби перевірки команд Telegram зі стабільним fallback, коли surface контракту комплектованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Helper засоби запитів погодження | Helper засоби payload погодження exec/plugin, capability/profile погодження, нативної маршрутизації/runtime погодження та форматування шляху структурованого відображення погодження |
  | `plugin-sdk/approval-auth-runtime` | Helper засоби auth погодження | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Helper засоби клієнта погодження | Helper засоби профілю/фільтра нативного погодження exec |
  | `plugin-sdk/approval-delivery-runtime` | Helper засоби доставки погодження | Адаптери capability/доставки нативного погодження |
  | `plugin-sdk/approval-gateway-runtime` | Helper засоби Gateway погодження | Спільний helper засіб визначення gateway погодження |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper засоби адаптера погодження | Полегшені helper засоби завантаження адаптера нативного погодження для гарячих точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Helper засоби обробника погодження | Ширші helper засоби runtime обробника погодження; віддавайте перевагу вужчим seams адаптера/gateway, якщо їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Helper засоби цілі погодження | Helper засоби нативного погодження для прив’язки цілі/облікового запису |
  | `plugin-sdk/approval-reply-runtime` | Helper засоби відповіді на погодження | Helper засоби payload відповіді на погодження exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper засоби контексту channel runtime | Загальні helper засоби register/get/watch для контексту channel runtime |
  | `plugin-sdk/security-runtime` | Helper засоби безпеки | Спільні helper засоби trust, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Helper засоби політики SSRF | Helper засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Helper засоби SSRF runtime | Helper засоби pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/collection-runtime` | Helper засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper засоби діагностичного gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helper засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Helper засоби обгорнутого fetch/proxy | `resolveFetch`, helper засоби proxy |
  | `plugin-sdk/host-runtime` | Helper засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper засоби retry | `RetryConfig`, `retryAsync`, виконавці policy |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Мапування входів allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating команд і helper засоби surface команд | `resolveControlCommandGate`, helper засоби авторизації відправника, helper засоби реєстру команд, включно з форматуванням меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір секретного вводу | Helper засоби секретного вводу |
  | `plugin-sdk/webhook-ingress` | Helper засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper засоби guard для тіла Webhook-запиту | Helper засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний reply runtime | Вхідний dispatch, Heartbeat, planner відповіді, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper засоби dispatch відповіді | Helper засоби finalize, dispatch постачальника та labels розмов |
  | `plugin-sdk/reply-history` | Helper засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper засоби chunk відповіді | Helper засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Helper засоби сховища сесій | Helper засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Helper засоби шляхів стану | Helper засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Helper засоби маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Helper засоби статусу каналу | Конструктори зведення статусу каналу/облікового запису, значення runtime-state за замовчуванням, helper засоби метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Helper засоби визначення цілей | Спільні helper засоби target resolver |
  | `plugin-sdk/string-normalization-runtime` | Helper засоби нормалізації рядків | Helper засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Helper засоби URL запиту | Витягування рядкових URL із входів, подібних до request |
  | `plugin-sdk/run-command` | Helper засоби команд із таймінгом | Виконавець команд із таймінгом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload tool | Витягування нормалізованих payload із об’єктів результатів tool |
  | `plugin-sdk/tool-send` | Витягування надсилання tool | Витягування канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Helper засоби тимчасових шляхів | Спільні helper засоби шляху тимчасового завантаження |
  | `plugin-sdk/logging-core` | Helper засоби logging | Helper засоби logger підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Helper засоби markdown-таблиць | Helper засоби режиму markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи reply повідомлення | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Кураторські helper засоби налаштування локального/self-hosted постачальника | Helper засоби виявлення/конфігурації self-hosted постачальника |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові helper засоби налаштування self-hosted постачальника, сумісного з OpenAI | Ті самі helper засоби виявлення/конфігурації self-hosted постачальника |
  | `plugin-sdk/provider-auth-runtime` | Helper засоби auth runtime постачальника | Helper засоби визначення API-key під час runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper засоби налаштування API-key постачальника | Helper засоби onboarding/profile-write для API-key |
  | `plugin-sdk/provider-auth-result` | Helper засоби auth-result постачальника | Стандартний конструктор OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Helper засоби інтерактивного входу постачальника | Спільні helper засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Helper засоби вибору постачальника | Вибір налаштованого або автоматичного постачальника та злиття сирих конфігурацій постачальника |
  | `plugin-sdk/provider-env-vars` | Helper засоби env-var постачальника | Helper засоби пошуку auth env-var постачальника |
  | `plugin-sdk/provider-model-shared` | Спільні helper засоби моделі/replay постачальника | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, helper засоби endpoint постачальника та helper засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні helper засоби каталогу постачальника | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі onboarding постачальника | Helper засоби конфігурації onboarding |
  | `plugin-sdk/provider-http` | Helper засоби HTTP постачальника | Загальні helper засоби HTTP/capability endpoint постачальника, включно з helper засобами multipart form для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Helper засоби web-fetch постачальника | Helper засоби реєстрації/кешу постачальника web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper засоби конфігурації web-search постачальника | Вузькі helper засоби конфігурації/облікових даних web-search для постачальників, яким не потрібна прив’язка plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | Helper засоби контракту web-search постачальника | Вузькі helper засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для облікових даних |
  | `plugin-sdk/provider-web-search` | Helper засоби web-search постачальника | Helper засоби реєстрації/кешу/runtime постачальника web-search |
  | `plugin-sdk/provider-tools` | Helper засоби compat для tool/schema постачальника | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + diagnostics і helper засоби compat для xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper засоби usage постачальника | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helper засоби usage постачальника |
  | `plugin-sdk/provider-stream` | Helper засоби обгорток потоку постачальника | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку і спільні helper засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper засоби транспорту постачальника | Helper засоби нативного транспорту постачальника, такі як guarded fetch, transforms повідомлень транспорту та writable event streams транспорту |
  | `plugin-sdk/keyed-async-queue` | Упорядкована async-черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні helper засоби медіа | Helper засоби fetch/transform/store для медіа плюс конструктори media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні helper засоби генерації медіа | Спільні helper засоби failover, вибір кандидатів і повідомлення про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Helper засоби media-understanding | Типи постачальника media understanding плюс helper експорти для зображень/аудіо, орієнтовані на постачальника |
  | `plugin-sdk/text-runtime` | Спільні helper засоби тексту | Видалення видимого для асистента тексту, helper засоби render/chunking/table для markdown, helper засоби редагування, helper засоби тегів директив, утиліти safe-text і пов’язані helper засоби тексту/logging |
  | `plugin-sdk/text-chunking` | Helper засоби chunking тексту | Helper засіб chunking вихідного тексту |
  | `plugin-sdk/speech` | Helper засоби мовлення | Типи постачальника мовлення плюс helper засоби директив, реєстру та валідації, орієнтовані на постачальника |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи постачальника мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Helper засоби транскрипції в реальному часі | Типи постачальника, helper засоби реєстру та спільний helper засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Helper засоби голосу в реальному часі | Типи постачальника, helper засоби реєстру/визначення та helper засоби bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, helper засоби failover, auth і реєстру |
  | `plugin-sdk/music-generation` | Helper засоби генерації музики | Типи постачальника/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helper засоби failover, пошук постачальника та розбір model-ref |
  | `plugin-sdk/video-generation` | Helper засоби генерації відео | Типи постачальника/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helper засоби failover, пошук постачальника та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Helper засоби інтерактивної відповіді | Нормалізація/зведення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helper засоби запису конфігурації каналу | Helper засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний прелюд каналу | Спільні prelude-експорти channel plugin |
  | `plugin-sdk/channel-status` | Helper засоби статусу каналу | Спільні helper засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Helper засоби конфігурації allowlist | Helper засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Helper засоби доступу до груп | Спільні helper засоби прийняття рішень щодо group-access |
  | `plugin-sdk/direct-dm` | Helper засоби direct-DM | Спільні helper засоби auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні helper засоби розширення | Примітиви helper засобів passive-channel/status та ambient proxy |
  | `plugin-sdk/webhook-targets` | Helper засоби цілей Webhook | Реєстр цілей Webhook і helper засоби встановлення route |
  | `plugin-sdk/webhook-path` | Helper засоби шляху Webhook | Helper засоби нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні helper засоби вебмедіа | Helper засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів plugin SDK |
  | `plugin-sdk/memory-core` | Комплектовані helper засоби memory-core | Поверхня helper засобів менеджера/config/file/CLI для пам’яті |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation engine хоста пам’яті | Експорти foundation engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний постачальник і загальні helper засоби batch/remote; конкретні remote-постачальники розміщуються у Plugins, яким вони належать |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine хоста пам’яті | Експорти QMD engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage engine хоста пам’яті | Експорти storage engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodal-helper засоби хоста пам’яті | Multimodal-helper засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Query-helper засоби хоста пам’яті | Query-helper засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Secret-helper засоби хоста пам’яті | Secret-helper засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Helper засоби журналу подій хоста пам’яті | Helper засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Helper засоби статусу хоста пам’яті | Helper засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Helper засоби CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Helper засоби core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper засоби файлів/runtime хоста пам’яті | Helper засоби файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Нейтральний до вендора псевдонім для helper засобів core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний до вендора псевдонім для helper засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Нейтральний до вендора псевдонім для helper засобів файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Helper засоби керованого markdown | Спільні helper засоби керованого markdown для Plugins, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Нейтральний до вендора псевдонім для helper засобів статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Комплектовані helper засоби memory-lancedb | Поверхня helper засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Helper засоби тестування та mocks |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не повну
поверхню SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі helper seams комплектованих Plugins, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки й сумісності комплектованих Plugins, але навмисно не включені до
поширеної таблиці міграції й не є рекомендованою ціллю для
нового коду Plugin.

Те саме правило застосовується до інших сімейств комплектованих helper засобів, таких як:

- helper засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- комплектовані helper/plugin поверхні, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню helper засобів токена:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в межах plugin SDK, контракту постачальника,
поверхні runtime і маніфесту. Кожне з них усе ще працює сьогодні, але буде видалене
в одному з майбутніх мажорних випусків. Запис під кожним пунктом зіставляє старий API
з його канонічною заміною.

<AccordionGroup>
  <Accordion title="Конструктори довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортовані з вужчого підшляху. `command-auth`
    повторно експортує їх як compat-заглушки.

    ```typescript
    // До
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Після
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper засоби gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох окремих викликів.

    Downstream channel plugins (Slack, Discord, Matrix, Microsoft Teams) уже
    перейшли на нього.

  </Accordion>

  <Accordion title="Shim channel runtime і helper засоби channel actions">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    channel plugins. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime-об’єктів.

    Helper засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions` застаріли
    разом із сирими експортами каналу "actions". Натомість надавайте capability
    через семантичну поверхню `presentation` — channel plugins оголошують,
    що саме вони рендерять (cards, buttons, selects), а не які сирі
    назви actions вони приймають.

  </Accordion>

  <Accordion title="Helper засіб tool() постачальника web search → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в provider plugin.
    OpenClaw більше не потребує helper засобу SDK для реєстрації обгортки tool.

  </Accordion>

  <Accordion title="Текстові конверти каналу у відкритому вигляді → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского текстового prompt-конверта
    з вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Channel plugins прикріплюють метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Helper засіб
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих конвертів,
    видимих асистенту, але вхідні текстові конверти у відкритому вигляді поступово виводяться з ужитку.

    Порушені ділянки: `inbound_claim`, `message_received` і будь-який власний
    channel plugin, який виконував постобробку тексту `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення постачальників → типи каталогу постачальників">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над
    типами епохи каталогу:

    | Старий псевдонім            | Новий тип                |
    | --------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`    | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`  | `ProviderCatalogContext` |
    | `ProviderDiscoveryResult`   | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery`   | `ProviderPluginCatalog`  |

    Плюс застарілий статичний пакет `ProviderCapabilities` — provider plugins
    мають прикріплювати факти capability через контракт provider runtime,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Хуки політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` з канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі
    збережені значення за рангом профілю.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати протягом
    вікна застарівання, але не композуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього постачальника OAuth → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення постачальника в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "auth fallback" видає попередження під час runtime і буде видалений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env-var постачальника → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркалюйте той самий пошук env-var у `setup.providers[].envVars`
    у маніфесті. Це консолідує метадані env для setup/status в одному
    місці й уникає запуску runtime Plugin лише для відповіді на
    пошуки env-var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до закриття вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація plugin пам’яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Адитивні helper засоби пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачіпаються.

  </Accordion>

  <Accordion title="Типи повідомлень сесії Subagent перейменовано">
    Два застарілі псевдоніми типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                            |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` застарів на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (однина) повертав живий accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (множина) повертає DTO-орієнтований доступ до TaskFlow,
    безпечний для імпорту й не потребує завантаження повного task runtime.

    ```typescript
    // До
    const flow = api.runtime.tasks.flow(ctx);
    // Після
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики вбудованих розширень → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Перенесіть розширення результатів інструментів Pi на
    middleware". Для повноти: видалений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований із `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Віддавайте перевагу канонічній назві.

    ```typescript
    // До
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Після
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні розширень (усередині комплектованих channel/provider plugins у
`extensions/`) відстежуються у власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugins і тут не перелічені.
Якщо ви напряму споживаєте локальний barrel комплектованого Plugin, перед
оновленням прочитайте коментарі про застарівання в цьому barrel.
</Note>

## Графік видалення

| Коли                   | Що відбувається                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні видають попередження під час runtime                 |
| **Наступний мажорний випуск** | Застарілі поверхні буде видалено; Plugins, які все ще їх використовують, перестануть працювати |

Усі core plugins уже перенесено. Зовнішнім Plugins слід виконати міграцію
до наступного мажорного випуску.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний обхід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів за підшляхами
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
