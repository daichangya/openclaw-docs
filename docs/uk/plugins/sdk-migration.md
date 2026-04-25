---
read_when:
    - Ви бачите попередження `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Ви бачите попередження `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Ви використовуєте `api.registerEmbeddedExtensionFactory`
    - Ви оновлюєте Plugin до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin для OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть з застарілого шару зворотної сумісності на сучасний SDK плагінів
title: Міграція SDK плагінів
x-i18n:
    generated_at: "2026-04-25T00:26:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7848b0f92414fbd39d8e102b1e6e465dc08214588ba1970d194dde1258e1779
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів із цілеспрямованими, задокументованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві широко відкриті поверхні, які дозволяли плагінам імпортувати все необхідне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб підтримувати роботу старіших плагінів на основі хуків під час створення нової архітектури плагінів.
- **`openclaw/extension-api`** — міст, який надавав плагінам прямий доступ до допоміжних засобів на стороні хоста, таких як вбудований запускальник агентів.
- **`api.registerEmbeddedExtensionFactory(...)`** — хук комплектного розширення лише для Pi, який міг спостерігати за подіями вбудованого запускальника, такими як `tool_result`.

Тепер ці поверхні **застарілі**. Вони все ще працюють під час виконання, але нові Plugin не повинні їх використовувати, а наявні плагіни мають перейти до міграції до того, як наступний мажорний реліз їх прибере.

OpenClaw не видаляє та не переосмислює задокументовану поведінку плагінів у тій самій зміні, яка запроваджує заміну. Зміни контрактів із порушенням сумісності спочатку мають пройти через адаптер сумісності, діагностику, документацію та вікно застарівання. Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних релізів.
  Плагіни, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних між собою модулів
- **Циклічні залежності** — широкі повторні експорти полегшували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експорти були стабільними, а які внутрішніми

Сучасний SDK плагінів це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) — це невеликий самодостатній модуль із чітким призначенням і задокументованим контрактом.

Застарілі зручні шви провайдерів для комплектних каналів також прибрано. Імпорти на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, фірмові допоміжні шви каналів і `openclaw/plugin-sdk/telegram-core` були приватними скороченнями для монорепозиторію, а не стабільними контрактами плагінів. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині робочого простору комплектного Plugin зберігайте допоміжні засоби, що належать провайдеру, у власному `api.ts` або `runtime-api.ts` цього плагіна.

Поточні приклади комплектних провайдерів:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власному шві `api.ts` / `contract-api.ts`
- OpenAI зберігає конструктори провайдерів, допоміжні засоби моделей за замовчуванням і конструктори провайдерів realtime у власному `api.ts`
- OpenRouter зберігає конструктор провайдера та допоміжні засоби онбордингу/конфігурації у власному `api.ts`

## Політика сумісності

Для зовнішніх плагінів робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключену через адаптер сумісності
3. вивести діагностичне повідомлення або попередження, у якому вказано старий шлях і заміну
4. покрити тестами обидва шляхи
5. задокументувати застарівання та шлях міграції
6. видаляти лише після оголошеного вікна міграції, зазвичай у мажорному релізі

Якщо поле маніфесту все ще приймається, автори плагінів можуть і далі його використовувати, доки документація та діагностика не скажуть інакше. Новий код має віддавати перевагу задокументованій заміні, але наявні плагіни не повинні ламатися під час звичайних мінорних релізів.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть розширення результатів інструментів Pi до middleware">
    Комплектні плагіни мають замінити обробники результатів інструментів Pi-only
    `api.registerEmbeddedExtensionFactory(...)` на runtime-neutral middleware.

    ```typescript
    // Before: Pi-only compatibility hook
    api.registerEmbeddedExtensionFactory((pi) => {
      pi.on("tool_result", async (event) => {
        return compactToolResult(event);
      });
    });

    // After: Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть маніфест плагіна:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Залишайте `contracts.embeddedExtensionFactories` лише для комплектного коду сумісності,
    якому все ще потрібні прямі події вбудованого запускальника Pi. Зовнішні плагіни
    не можуть реєструвати middleware результатів інструментів, тому що воно може
    переписувати високодовірений вивід інструментів до того, як модель його побачить.

  </Step>

  <Step title="Перенесіть approval-native обробники до фактів можливостей">
    Плагіни каналів із підтримкою approval тепер надають нативну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром контексту runtime.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічні для approval auth/доставку зі застарілої прив’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту
      плагіна каналу; перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу каналу; хуки
      auth для approval звідти більше не читаються ядром
    - Реєструйте об’єкти runtime, що належать каналу, наприклад клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення про перенаправлення, що належать плагіну, з нативних обробників approval;
      ядро тепер відповідає за сповіщення надіслано-інде на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Поточну структуру можливостей approval див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозпізнані Windows
    wrapper `.cmd`/`.bat` тепер завершуються в закритому режимі, якщо ви явно не передасте
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

    Якщо ваш виклик навмисно не покладається на резервний перехід через оболонку, не встановлюйте
    `allowShellFallback` і натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму плагіні імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на цілеспрямовані імпорти">
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

    Для допоміжних засобів на стороні хоста використовуйте впроваджений runtime плагіна замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується й до інших застарілих допоміжних засобів моста:

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

  <Accordion title="Поширена таблиця шляхів імпорту">
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу плагіна | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий узагальнений повторний експорт для визначень/конструкторів точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цілеспрямовані визначення та конструктори точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити allowlist, конструктори стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Безпечні для імпорту адаптери патчів налаштування, допоміжні засоби приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментарію налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/керування діями |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікового запису + резервного використання типового значення |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для облікових записів | Допоміжні засоби списку облікових записів/дій із ними |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви pairing для DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Підключення префікса відповіді та індикації набору | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем конфігурації | Спільні примітиви схеми конфігурації каналів; експорти схем із назвами комплектних каналів є лише застарілою сумісністю |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби статусу облікового запису та життєвого циклу чернеткового потоку | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного envelope | Спільні допоміжні засоби маршруту + побудови envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідних відповідей | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного runtime | Допоміжні засоби вихідної ідентичності/делегування надсилання та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язок потоків | Допоміжні засоби життєвого циклу та адаптерів прив’язок потоків |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Конструктор media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповідей |
  | `plugin-sdk/runtime-store` | Постійне сховище плагіна | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/резервного копіювання/встановлення плагіна |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env | Допоміжні засоби логера/runtime env, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime плагіна | Допоміжні засоби команд/хуків/http/інтерактивних функцій плагіна |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра хуків | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway і допоміжні засоби патчів статусу каналу |
  | `plugin-sdk/config-runtime` | Допоміжні засоби конфігурації | Допоміжні засоби завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Допоміжні засоби перевірки команд Telegram зі стабільним резервним варіантом, коли поверхня контракту комплектного Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів approval | Допоміжні засоби payload approval exec/плагіна, можливостей/профілів approval, нативної маршрутизації/runtime approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth для approval | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта approval | Допоміжні засоби профілів/фільтрів нативного approval exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки approval | Адаптери нативних можливостей/доставки approval |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway для approval | Спільний допоміжний засіб визначення Gateway для approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера approval | Легкі допоміжні засоби завантаження нативного адаптера approval для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника approval | Ширші допоміжні засоби runtime обробника approval; віддавайте перевагу вужчим adapter/gateway швам, якщо їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілі approval | Допоміжні засоби нативної цілі approval/прив’язки облікового запису |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді approval | Допоміжні засоби payload відповіді approval exec/плагіна |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context каналу | Узагальнені допоміжні засоби register/get/watch для runtime-context каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби trust, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Допоміжні засоби pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Керування командами та допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд |
  | `plugin-sdk/command-status` | Рендерери стану команд/довідки | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір секретного вводу | Допоміжні засоби секретного вводу |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Вхідна диспетчеризація, Heartbeat, планувальник відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Допоміжні засоби фіналізації, диспетчеризації провайдера та міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповідей | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunk для відповідей | Допоміжні засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу каналу | Конструктори зведення статусу каналу/облікового запису, типові значення runtime-state, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначення цілей | Спільні допоміжні засоби визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL з вхідних даних, схожих на запит |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із timeout | Виконавець команд із timeout і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструмента | Витягування нормалізованих payload з об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування надсилання інструмента | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби логування | Логер підсистеми та допоміжні засоби редагування конфіденційних даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби markdown-таблиць | Допоміжні засоби режимів markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи payload відповідей повідомлень | Типи payload відповідей |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted провайдера | Допоміжні засоби виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Цілеспрямовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime auth провайдера | Допоміжні засоби визначення API-ключа під час runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби онбордингу/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result провайдера | Стандартний конструктор OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу провайдера | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та злиття необробленої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env var провайдера | Допоміжні засоби пошуку env var auth провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделі/повторного відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Узагальнені допоміжні засоби HTTP/можливостей endpoint провайдера, зокрема допоміжні засоби multipart form для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search провайдера | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібна прив’язка enable плагіна |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Допоміжні засоби реєстрації/кешу/runtime провайдера web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності tool/schema провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгортки потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Нативні допоміжні засоби транспорту провайдера, такі як guarded fetch, перетворення transport message і потоки подій writable transport |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/перетворення/зберігання медіа, а також конструктори media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів зображень/аудіо для провайдерів |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення видимого для асистента тексту, допоміжні засоби рендерингу/chunking/таблиць markdown, допоміжні засоби редагування конфіденційних даних, допоміжні засоби directive-tag, утиліти safe-text та пов’язані допоміжні засоби тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking тексту | Допоміжний засіб chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдерів мовлення, а також допоміжні засоби директив, реєстру та перевірки для провайдерів |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в realtime | Типи провайдерів, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в realtime | Типи провайдерів, допоміжні засоби реєстру/визначення та допоміжні засоби bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, auth і допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних відповідей | Нормалізація/зменшення payload інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви config-schema каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Експорти спільної преамбули плагіна каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні допоміжні засоби ухвалення рішень щодо доступу до груп |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширення | Примітиви допоміжних засобів passive-channel/status та ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Допоміжні засоби реєстру цілей Webhook та встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів Webhook | Допоміжні засоби нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів SDK плагінів |
  | `plugin-sdk/memory-core` | Допоміжні засоби комплектного memory-core | Поверхня допоміжних засобів менеджера memory, конфігурації, файлів і CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія memory | Фасад runtime індексу/пошуку memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста memory | Експорти базового рушія хоста memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embeddings хоста memory | Контракти embeddings memory, доступ до реєстру, локальний провайдер і узагальнені batch/віддалені допоміжні засоби; конкретні віддалені провайдери містяться у плагінах-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста memory | Експорти рушія QMD хоста memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста memory | Експорти рушія сховища хоста memory |
  | `plugin-sdk/memory-core-host-multimodal` | Багатомодальні допоміжні засоби хоста memory | Багатомодальні допоміжні засоби хоста memory |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста memory | Допоміжні засоби запитів хоста memory |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста memory | Допоміжні засоби секретів хоста memory |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста memory | Допоміжні засоби журналу подій хоста memory |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста memory | Допоміжні засоби статусу хоста memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста memory | Допоміжні засоби CLI runtime хоста memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста memory | Допоміжні засоби core runtime хоста memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста memory | Допоміжні засоби файлів/runtime хоста memory |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів core runtime хоста memory |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста memory |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/runtime хоста memory |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для плагінів, суміжних із memory |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів статусу хоста memory |
  | `plugin-sdk/memory-lancedb` | Допоміжні засоби комплектного memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні засоби тестування та mocks |
</Accordion>

Ця таблиця навмисно є поширеною підмножиною для міграції, а не повною
поверхнею SDK. Повний список із понад 200 точок входу міститься у
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі шви допоміжних засобів комплектних плагінів, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки та сумісності комплектних плагінів, але навмисно
не включені до поширеної таблиці міграції та не є рекомендованою ціллю для
нового коду плагінів.

Те саме правило застосовується до інших сімейств комплектних допоміжних засобів, таких як:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- комплектні поверхні допоміжних засобів/плагінів, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку
поверхню допоміжних засобів токенів `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, що застосовуються до SDK плагінів, контракту провайдера,
поверхні runtime і маніфесту. Кожне з них усе ще працює сьогодні, але буде видалене
в одному з майбутніх мажорних релізів. Запис під кожним елементом зіставляє старий API
з його канонічною заміною.

<AccordionGroup>
  <Accordion title="Допоміжні засоби довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортуються з вужчого підшляху. `command-auth`
    повторно експортує їх як сумісні stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби gating для згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об’єкт рішення замість двох розділених викликів.

    Плагіни каналів нижчого рівня (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim runtime каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    плагінів каналів. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    runtime.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions` застаріли
    разом із сирими експортами каналу "actions". Натомість надавайте можливості
    через семантичну поверхню `presentation` — плагіни каналів
    декларують, що саме вони рендерять (картки, кнопки, вибір зі списку), а не
    які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний засіб tool() провайдера вебпошуку → createTool() у плагіні">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо у плагіні провайдера.
    OpenClaw більше не потрібен допоміжний засіб SDK для реєстрації обгортки tool.

  </Accordion>

  <Accordion title="Текстові channel envelope у plain text → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского текстового prompt
    envelope із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача. Плагіни
    каналів прикріплюють метадані маршрутизації (потік, тему, reply-to, реакції) як
    типізовані поля замість конкатенації їх у рядок prompt. Допоміжний засіб
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих envelope,
    видимих асистенту, але епоха вхідних текстових envelope добігає кінця.

    Затронуті області: `inbound_claim`, `message_received` і будь-який користувацький
    плагін каналу, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдера → типи каталогу провайдера">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над типами
    ери каталогу:

    | Старий псевдонім           | Новий тип                |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Додатково є застарілий статичний набір `ProviderCapabilities` — плагіни провайдерів
    мають прикріплювати факти можливостей через контракт runtime провайдера,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Хуки політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує за рангом профілю
    застарілі збережені значення.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати протягом
    вікна застарівання, але не композиціонуються з результатом профілю.

  </Accordion>

  <Accordion title="Резервний варіант зовнішнього OAuth провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті плагіна.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті плагіна
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "резервного auth" виводить попередження під час runtime і буде видалений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env var провайдера → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env var у `setup.providers[].envVars`
    у маніфесті. Це об’єднує метадані setup/status env в одному
    місці та дозволяє уникнути запуску runtime плагіна лише для відповіді на
    пошук env var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація плагіна memory → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API стану memory —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, єдиний виклик реєстрації. Адитивні допоміжні засоби memory
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) це не зачіпає.

  </Accordion>

  <Accordion title="Типи повідомлень сесії субагента перейменовано">
    Два застарілі псевдоніми типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                            |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` застарів на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав живий accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає DTO-орієнтований доступ до TaskFlow,
    який є безпечним для імпорту та не потребує завантаження повного runtime завдань.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики вбудованих розширень → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Перенесіть розширення результатів інструментів Pi до
    middleware". Тут включено для повноти: шлях Pi-only
    `api.registerEmbeddedExtensionFactory(...)` застарів на користь
    `api.registerAgentToolResultMiddleware(...)` із явним списком
    runtime у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований з `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Віддавайте перевагу канонічній назві.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні розширень (усередині комплектних плагінів каналів/провайдерів у
`extensions/`) відстежуються у їхніх власних barrel `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх плагінів і тут не перелічені.
Якщо ви безпосередньо використовуєте локальний barrel комплектного плагіна, прочитайте
коментарі про застарівання в цьому barrel перед оновленням.
</Note>

## Графік видалення

| Коли                  | Що відбувається                                                        |
| --------------------- | ---------------------------------------------------------------------- |
| **Зараз**             | Застарілі поверхні виводять попередження під час runtime               |
| **Наступний мажорний реліз** | Застарілі поверхні буде видалено; плагіни, які все ще їх використовують, перестануть працювати |

Усі основні плагіни вже мігровано. Зовнішнім плагінам слід виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язані матеріали

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший плагін
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
- [Внутрішня будова плагінів](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест плагіна](/uk/plugins/manifest) — довідник схеми маніфесту
