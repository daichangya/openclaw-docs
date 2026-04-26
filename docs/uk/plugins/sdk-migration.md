---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-26T09:19:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів із цільовими, документованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві широкі поверхні, які дозволяли плагінам імпортувати все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, що повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб старі плагіни на основі хуків продовжували працювати, поки будувалася нова архітектура плагінів.
- **`openclaw/extension-api`** — міст, який надавав плагінам прямий доступ до допоміжних засобів на стороні хоста, таких як вбудований раннер агентів.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений хук для вбудованих розширень лише для Pi, який міг спостерігати за подіями вбудованого раннера, такими як `tool_result`.

Ці широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання, але нові Plugin не повинні їх використовувати, а наявним плагінам слід перейти до міграції до того, як у наступному мажорному випуску їх буде вилучено. API реєстрації фабрики вбудованих розширень лише для Pi уже вилучено; натомість використовуйте middleware результатів інструментів.

OpenClaw не вилучає і не переосмислює документовану поведінку плагінів у тій самій зміні, яка запроваджує заміну. Зміни контрактів, що ламають сумісність, спочатку мають проходити через адаптер сумісності, діагностику, документацію та період застарівання. Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних випусків.
  Plugins, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрик вбудованих розширень лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних між собою модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) — це невеликий самодостатній модуль із чітким призначенням і документованим контрактом.

Застарілі зручні поверхні провайдерів для вбудованих каналів також зникли. Імпорти на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, фірмові допоміжні поверхні каналів і `openclaw/plugin-sdk/telegram-core` були приватними скороченнями монорепозиторію, а не стабільними контрактами плагінів. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині робочого простору вбудованого Plugin зберігайте допоміжні засоби, що належать провайдеру, у власному `api.ts` або `runtime-api.ts` цього плагіна.

Поточні приклади вбудованих провайдерів:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власній поверхні `api.ts` / `contract-api.ts`
- OpenAI зберігає збирачі провайдера, допоміжні засоби моделей за замовчуванням і збирачі realtime-провайдера у власному `api.ts`
- OpenRouter зберігає збирач провайдера та допоміжні засоби онбордингу/конфігурації у власному `api.ts`

## Політика сумісності

Для зовнішніх плагінів робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. залишити стару поведінку підключеною через адаптер сумісності
3. вивести діагностичне повідомлення або попередження з назвою старого шляху та заміни
4. покрити тестами обидва шляхи
5. задокументувати застарівання та шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у мажорному випуску

Якщо поле маніфесту все ще приймається, автори плагінів можуть і далі його використовувати, доки документація та діагностика не скажуть інакше. Новий код має надавати перевагу документованій заміні, але наявні Plugin не повинні ламатися під час звичайних мінорних випусків.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть розширення результатів інструментів Pi на middleware">
    Вбудовані Plugin мають замінити обробники результатів інструментів лише для Pi з
    `api.registerEmbeddedExtensionFactory(...)`
    на runtime-нейтральне middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
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

    Зовнішні Plugin не можуть реєструвати middleware результатів інструментів, оскільки воно може
    переписувати високодовірений вивід інструментів до того, як модель його побачить.

  </Step>

  <Step title="Перенесіть нативні для погодження обробники на capability facts">
    Плагіни каналів із підтримкою погодження тепер надають нативну поведінку погодження через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром контексту runtime.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічну для погодження автентифікацію/доставку зі застарілої схеми `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` було вилучено з публічного контракту
      плагіна каналу; перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу з каналу; хуки
      автентифікації погодження там більше не зчитуються ядром
    - Реєструйте об’єкти runtime, що належать каналу, такі як клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення про перенаправлення, що належать плагіну, з нативних обробників погодження;
      тепер ядро саме відповідає за сповіщення «перенаправлено в інше місце» на основі фактичних результатів доставки
    - Передаючи `channelRuntime` до `createChannelManager(...)`, надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Дивіться `/plugins/sdk-channel-plugins` для поточної
    структури capability погодження.

  </Step>

  <Step title="Перевірте резервну поведінку обгортки Windows">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
    обгортки `.cmd`/`.bat` тепер завершуються із закритою відмовою, якщо ви явно не передасте `allowShellFallback: true`.

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

    Якщо ваш код навмисно не покладається на резервний shell-виклик, не встановлюйте
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму Plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх на цільові імпорти">
    Кожен експорт зі старої поверхні відповідає конкретному сучасному шляху імпорту:

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

    Для допоміжних засобів на стороні хоста використовуйте інжектований runtime плагіна замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується й до інших застарілих допоміжних засобів мосту:

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
  | Import path | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу плагіна | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий парасольковий повторний експорт для визначень/збирачів точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та збирачі точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити allowlist, збирачі стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Безпечні для імпорту адаптери патчів налаштування, допоміжні засоби нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох акаунтів | Допоміжні засоби списку/конфігурації/шлюзу дій акаунтів |
  | `plugin-sdk/account-id` | Допоміжні засоби ідентифікатора акаунта | `DEFAULT_ACCOUNT_ID`, нормалізація ідентифікатора акаунта |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку акаунта | Допоміжні засоби пошуку акаунта + резервного вибору за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькоспрямовані допоміжні засоби акаунта | Допоміжні засоби списку акаунтів/дій акаунта |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM-поєднання | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Підключення префікса відповіді + індикатора набору | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Збирачі схем конфігурації | Спільні примітиви схем конфігурації каналу; експортовані іменовані схеми вбудованих каналів підтримуються лише для застарілої сумісності |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політик груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби стану акаунта та життєвого циклу чернеткового потоку | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного конверта | Спільні допоміжні засоби маршрутизації + збирання конверта |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідних відповідей | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей вихідного надсилання | Легковаговий пошук `resolveOutboundSendDep` без імпорту повного runtime вихідного надсилання |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби runtime вихідного надсилання | Допоміжні засоби вихідної доставки, делегування ідентичності/надсилання, сесій, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язок потоків | Допоміжні засоби життєвого циклу та адаптерів прив’язок потоків |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби медіа-payload | Збирач медіа-payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/резервного копіювання/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькоспрямовані допоміжні засоби середовища runtime | Логер/середовище runtime, таймаут, повтор і допоміжні засоби backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Plugin | Допоміжні засоби команд/хуків/http/інтерактивних функцій Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра хуків | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби відкладеного runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway і допоміжні засоби патчів стану каналу |
  | `plugin-sdk/config-runtime` | Допоміжні засоби конфігурації | Допоміжні засоби завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Стабільні в режимі fallback допоміжні засоби перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів погодження | Допоміжні засоби payload погодження exec/Plugin, capability/профілів погодження, нативної маршрутизації/runtime погодження та форматування шляхів структурованого відображення погодження |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби автентифікації погодження | Визначення погоджувача, авторизація дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта погодження | Допоміжні засоби нативного профілю/фільтра погодження exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки погодження | Нативні адаптери capability/доставки погодження |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway погодження | Спільний допоміжний засіб визначення Gateway погодження |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера погодження | Легковагові допоміжні засоби завантаження нативного адаптера погодження для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника погодження | Ширші допоміжні засоби runtime обробника погодження; віддавайте перевагу вужчим поверхням adapter/gateway, якщо їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей погодження | Допоміжні засоби нативної прив’язки цілі/акаунта погодження |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповідей погодження | Допоміжні засоби payload відповіді погодження exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context каналу | Загальні допоміжні засоби register/get/watch для runtime-context каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, DM-gating, зовнішнього вмісту та збору секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Допоміжні засоби pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби шлюзування діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби повтору | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення входів allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюзування команд і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір секретного вводу | Допоміжні засоби секретного вводу |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Вхідна диспетчеризація, Heartbeat, планувальник відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькоспрямовані допоміжні засоби диспетчеризації відповідей | Допоміжні засоби фіналізації, диспетчеризації провайдера та міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань на відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментації відповідей | Допоміжні засоби фрагментації тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану й OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/ключів сесій | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації ключів сесій |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналу | Збирачі підсумків стану каналу/акаунта, значення за замовчуванням стану runtime, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначення цілей | Спільні допоміжні засоби визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запитів | Витягування URL-рядків із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструментів | Витягування нормалізованих payload з об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування надсилання інструментів | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби логування | Допоміжні засоби логера підсистем і редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби markdown-таблиць | Допоміжні засоби режиму markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей повідомлень | Типи payload відповідей |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted провайдерів | Допоміжні засоби виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби автентифікації runtime провайдера | Допоміжні засоби визначення API-ключа runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби онбордингу/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результату автентифікації провайдера | Стандартний збирач результату OAuth-автентифікації |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу провайдера | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Допоміжні засоби вибору налаштованого або автоматичного провайдера та злиття необробленої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var провайдера | Допоміжні засоби пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/повторного програвання провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні збирачі політик повторного програвання, допоміжні засоби endpoint провайдера та нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Загальні допоміжні засоби HTTP/можливостей endpoint провайдера, зокрема допоміжні засоби multipart form для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу web-fetch провайдера |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search провайдера | Вузькоспрямовані допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібна схема підключення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search провайдера | Вузькоспрямовані допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Допоміжні засоби реєстрації/кешу/runtime web-search провайдера |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгортки потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Нативні допоміжні засоби транспорту провайдера, такі як guarded fetch, трансформації транспортних повідомлень і доступні для запису потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби fetch/transform/store медіа та збирачі медіа-payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдерів розуміння медіа та експортовані допоміжні засоби зображень/аудіо для взаємодії з провайдерами |
  | `plugin-sdk/text-runtime` | Спільні текстові допоміжні засоби | Прибирання видимого для асистента тексту, допоміжні засоби рендерингу/chunking/таблиць markdown, редагування чутливих даних, допоміжні засоби тегів директив, утиліти безпечного тексту та пов’язані допоміжні засоби тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking тексту | Допоміжний засіб chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдерів мовлення та допоміжні засоби директив, реєстру й валідації для взаємодії з провайдерами |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби realtime-транскрибування | Типи провайдерів, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби realtime-голосу | Типи провайдерів, допоміжні засоби реєстру/визначення та допоміжні засоби bridge-сесій |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, допоміжні засоби failover, автентифікації та реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних відповідей | Нормалізація/зменшення payload інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькоспрямовані примітиви config-schema каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний прелюд каналу | Експортовані елементи спільного прелюду плагіна каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби стану каналу | Спільні допоміжні засоби snapshot/summary стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні допоміжні засоби визначення доступу до груп |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби автентифікації/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширень | Примітиви допоміжних засобів passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів Webhook | Допоміжні засоби нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби пакетної/віддаленої роботи; конкретні віддалені провайдери знаходяться у своїх власних Plugin |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби мультимодальності хоста пам’яті | Допоміжні засоби мультимодальності хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті | Допоміжні засоби стану хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні засоби CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Основний runtime хоста пам’яті | Допоміжні засоби основного runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті | Допоміжні засоби файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Аліас основного runtime хоста пам’яті | Нейтральний щодо постачальника аліас для допоміжних засобів основного runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Аліас журналу подій хоста пам’яті | Нейтральний щодо постачальника аліас для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Аліас файлів/runtime хоста пам’яті | Нейтральний щодо постачальника аліас для допоміжних засобів файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для Plugin, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Відкладений фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Аліас стану хоста пам’яті | Нейтральний щодо постачальника аліас для допоміжних засобів стану хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Вбудовані допоміжні засоби memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні засоби тестування та mocks |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі поверхні допоміжних засобів для вбудованих Plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки та сумісності вбудованих Plugin, але навмисно
не включені до таблиці поширеної міграції й не є рекомендованою ціллю для
нового коду Plugin.

Те саме правило застосовується до інших сімейств вбудованих допоміжних засобів, таких як:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих допоміжних засобів/Plugin, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку
поверхню допоміжних засобів токенів `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в усьому Plugin SDK, контракті провайдера,
поверхні runtime і маніфесті. Кожне з них усе ще працює сьогодні, але буде вилучене
в одному з майбутніх мажорних випусків. Запис під кожним пунктом зіставляє старий API
з його канонічною заміною.

<AccordionGroup>
  <Accordion title="допоміжні засоби довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортовані з вужчого підшляху. `command-auth`
    повторно експортує їх як заглушки сумісності.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="допоміжні засоби gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох розділених викликів.

    Низхідні плагіни каналів (Slack, Discord, Matrix, Microsoft Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="shim runtime каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    плагінів каналів. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    runtime.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими експортами дій каналу. Натомість надавайте можливості
    через семантичну поверхню `presentation` — плагіни каналів
    оголошують, що саме вони рендерять (картки, кнопки, списки вибору), а не
    які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="допоміжний засіб tool() провайдера web search → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо у Plugin провайдера.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації
    обгортки інструмента.

  </Accordion>

  <Accordion title="текстові конверти каналів → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского текстового prompt-конверта
    з вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача. Плагіни
    каналів додають метадані маршрутизації (потік, тему, reply-to, реакції) як
    типізовані поля замість конкатенації їх у рядок prompt. Допоміжний засіб
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих конвертів,
    видимих асистенту, але від текстових вхідних конвертів поступово відмовляються.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який нетиповий
    плагін каналу, який виконував постобробку тексту `channelEnvelope`.

  </Accordion>

  <Accordion title="типи виявлення провайдера → типи каталогу провайдера">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над
    типами епохи каталогу:

    | Старий псевдонім           | Новий тип                |
    | -------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`   | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext` | `ProviderCatalogContext` |
    | `ProviderDiscoveryResult`  | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery`  | `ProviderPluginCatalog`  |

    Плюс застарілий статичний набір `ProviderCapabilities` — плагіни провайдерів
    повинні додавати факти можливостей через контракт runtime провайдера,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="хуки політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` з канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі збережені значення
    за рангом профілю.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати протягом
    вікна застарівання, але не комбінуються з результатом профілю.

  </Accordion>

  <Accordion title="резервний варіант зовнішнього OAuth-провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    «резервної автентифікації» виводить попередження під час виконання й буде вилучений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="пошук env-var провайдера → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env-var у `setup.providers[].envVars`
    у маніфесті. Це об’єднує метадані env налаштування/стану в одному
    місці та дозволяє уникнути запуску runtime Plugin лише для відповіді на
    запити пошуку env-var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до закриття вікна застарівання.

  </Accordion>

  <Accordion title="реєстрація Plugin пам’яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API стану пам’яті —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Адитивні допоміжні засоби пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="типи повідомлень сесії субагента перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                              |
    | --------------------------- | --------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (однина) повертав активний accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (множина) повертає DTO-орієнтований доступ до TaskFlow,
    який є безпечним для імпорту й не потребує завантаження повного runtime завдань.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="фабрики вбудованих розширень → middleware результатів інструментів агента">
    Розглянуто вище в розділі «Як виконати міграцію → Перенесіть розширення результатів інструментів Pi на
    middleware». Для повноти тут також зазначено: вилучений шлях
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="псевдонім OpenClawSchemaType → OpenClawConfig">
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
Застарівання на рівні розширень (усередині вбудованих Plugin каналів/провайдерів у
`extensions/`) відстежуються у їхніх власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugin і тут не перелічені.
Якщо ви напряму використовуєте локальний barrel вбудованого Plugin, прочитайте
коментарі щодо застарівання в цьому barrel перед оновленням.
</Note>

## Хронологія вилучення

| Коли                   | Що відбувається                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| **Зараз**              | Застарілі поверхні виводять попередження під час виконання               |
| **Наступний мажорний випуск** | Застарілі поверхні буде вилучено; Plugins, які все ще їх використовують, перестануть працювати |

Усі основні плагіни вже мігровано. Зовнішні Plugin повинні
виконати міграцію до наступного мажорного випуску.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний обхід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
