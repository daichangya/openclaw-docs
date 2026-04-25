---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.24
    - Ви оновлюєте Plugin до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-25T01:53:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7072e690b1f23fd80d4de9a00bc0352f0c635d1ed89d4b530bfbb1f9f6eab483
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів зі сфокусованими, задокументованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві широкі поверхні, які дозволяли плагінам імпортувати будь-що потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, що повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб зберегти працездатність старіших плагінів на основі hook, поки створювалася нова архітектура плагінів.
- **`openclaw/extension-api`** — міст, який надавав плагінам прямий доступ до допоміжних засобів на боці хоста, таких як вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — видалений API hook для вбудованих розширень лише для Pi, який міг спостерігати за подіями embedded-runner, такими як `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання, але нові Plugins не повинні їх використовувати, а наявні плагіни мають виконати міграцію до того, як у наступному мажорному випуску їх буде видалено. API реєстрації factory вбудованих розширень лише для Pi видалено; натомість використовуйте middleware результатів інструментів.

OpenClaw не видаляє і не переосмислює задокументовану поведінку Plugin у тій самій зміні, що запроваджує заміну. Зміни контрактів, які порушують сумісність, спочатку мають проходити через адаптер сумісності, діагностику, документацію та вікно застарівання. Це стосується імпортів SDK, полів маніфесту, API setup, hook і поведінки реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних випусків.
  Plugins, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації factory вбудованих розширень лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного helper завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK усуває це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams провайдера для вбудованих каналів також зникли. Імпорти на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, branded helper seams каналів і `openclaw/plugin-sdk/telegram-core` були приватними скороченнями mono-repo, а не стабільними контрактами Plugin. Натомість використовуйте вузькі загальні subpath SDK. Усередині workspace вбудованого Plugin зберігайте допоміжні засоби, що належать провайдеру, у власному `api.ts` або `runtime-api.ts` цього Plugin.

Поточні приклади вбудованих провайдерів:

- Anthropic зберігає специфічні для Claude helper потоків у власному seam `api.ts` / `contract-api.ts`
- OpenAI зберігає builder провайдера, helper моделей за замовчуванням і builder realtime-провайдера у власному `api.ts`
- OpenRouter зберігає builder провайдера і helper onboarding/config у власному `api.ts`

## Політика сумісності

Для зовнішніх Plugin робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключену через адаптер сумісності
3. вивести діагностику або попередження, яке називає старий шлях і заміну
4. покрити обидва шляхи в тестах
5. задокументувати застарівання та шлях міграції
6. видаляти лише після оголошеного вікна міграції, зазвичай у мажорному випуску

Якщо поле маніфесту все ще приймається, автори Plugin можуть і далі його використовувати, доки документація й діагностика не скажуть інакше. Новий код має надавати перевагу задокументованій заміні, але наявні плагіни не повинні ламатися під час звичайних мінорних випусків.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть розширення результатів інструментів Pi на middleware">
    Вбудовані Plugins мають замінити обробники результатів інструментів Pi-only
    `api.registerEmbeddedExtensionFactory(...)` на runtime-neutral middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
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

    Зовнішні Plugins не можуть реєструвати middleware результатів інструментів, оскільки воно може переписувати високодовірений вивід інструментів до того, як його побачить модель.

  </Step>

  <Step title="Перенесіть approval-native обробники на факти можливостей">
    Plugins каналів із підтримкою approval тепер надають нативну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром контексту runtime.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, із застарілої прив’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу каналу; hook auth approval
      там більше не читаються ядром
    - Реєструйте об’єкти runtime, що належать каналу, такі як clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення reroute, що належать Plugin, із нативних обробників approval;
      ядро тепер відповідає за повідомлення routed-elsewhere на основі фактичних результатів delivery
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для актуальної структури можливостей approval.

  </Step>

  <Step title="Перевірте резервну поведінку wrapper у Windows">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані wrapper `.cmd`/`.bat` у Windows тепер завершуються в закритому режимі, якщо ви явно не передасте `allowShellFallback: true`.

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

    Якщо ваш caller не покладається навмисно на shell fallback, не встановлюйте
    `allowShellFallback` і натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Пошукайте у своєму Plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на сфокусовані імпорти">
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

    Для helper на боці хоста використовуйте інжектований runtime Plugin замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується й до інших helper застарілого bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper сховища сеансів | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/core` | Застарілий umbrella-повторний експорт для визначень/builder точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення і builder точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні helper майстра setup | Prompt allowlist, builder статусу setup |
  | `plugin-sdk/setup-runtime` | Helper runtime під час setup | Безпечні для імпорту адаптери patch setup, helper приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі setup |
  | `plugin-sdk/setup-adapter-runtime` | Helper адаптера setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper інструментів setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper для кількох облікових записів | Helper списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Helper id облікового запису | `DEFAULT_ACCOUNT_ID`, нормалізація id облікового запису |
  | `plugin-sdk/account-resolution` | Helper пошуку облікового запису | Helper пошуку облікового запису + резервного вибору за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі helper облікового запису | Helper списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви pairing для DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс reply + прив’язка typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory адаптера конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder схеми конфігурації | Спільні примітиви схеми конфігурації каналу; іменовані експорти схем вбудованих каналів — лише застаріла сумісність |
  | `plugin-sdk/telegram-command-config` | Helper конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політик груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper стану облікового запису і життєвого циклу потоку draft | `createAccountStatusSink`, helper фіналізації попереднього перегляду draft |
  | `plugin-sdk/inbound-envelope` | Helper вхідного envelope | Спільні helper route + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper вхідного reply | Спільні helper запису та dispatch |
  | `plugin-sdk/messaging-targets` | Парсинг цілей повідомлень | Helper парсингу/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Helper вихідного media | Спільне завантаження вихідного media |
  | `plugin-sdk/outbound-runtime` | Helper вихідного runtime | Helper делегата outbound-ідентичності/надсилання і планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper прив’язки потоків | Helper життєвого циклу прив’язки потоків та адаптера |
  | `plugin-sdk/agent-media-payload` | Застарілі helper media payload | Builder media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів reply |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі helper runtime | Helper runtime/logging/backup/встановлення plugin |
  | `plugin-sdk/runtime-env` | Вузькі helper середовища runtime | Helper logger/середовища runtime, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні helper runtime Plugin | Helper команд/hook/http/interactive Plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Спільні helper pipeline Webhook/внутрішніх hook |
  | `plugin-sdk/lazy-runtime` | Helper lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper process | Спільні helper exec |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Форматування команд, очікування, helper версій |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Клієнт Gateway і helper patch стану каналу |
  | `plugin-sdk/config-runtime` | Helper конфігурації | Helper завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Helper команд Telegram | Helper валідації команд Telegram зі стабільним fallback, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Helper prompt approval | Payload exec/plugin approval, helper capability/profile approval, helper нативної маршрутизації/runtime approval і форматування шляху структурованого відображення approval |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approval | Розв’язання approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Helper клієнта approval | Helper профілю/фільтра нативного approval exec |
  | `plugin-sdk/approval-delivery-runtime` | Helper delivery approval | Адаптери capability/delivery нативного approval |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway approval | Спільний helper розв’язання Gateway approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper адаптера approval | Полегшені helper завантаження адаптера нативного approval для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Helper обробника approval | Ширші helper runtime обробника approval; надавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Helper цілі approval | Helper нативної прив’язки цілі/облікового запису approval |
  | `plugin-sdk/approval-reply-runtime` | Helper reply approval | Helper payload reply exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context каналу | Загальні helper register/get/watch runtime-context каналу |
  | `plugin-sdk/security-runtime` | Helper безпеки | Спільні helper trust, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Helper політики SSRF | Helper allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Pinned-dispatcher, guarded fetch, helper політики SSRF |
  | `plugin-sdk/collection-runtime` | Helper обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper шлюзу діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helper графа помилок |
  | `plugin-sdk/fetch-runtime` | Helper обгорнутого fetch/proxy | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, виконувачі політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Мапінг введення allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюз команд і helper поверхні команд | `resolveControlCommandGate`, helper авторизації відправника, helper реєстру команд |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Парсинг введення секретів | Helper введення секретів |
  | `plugin-sdk/webhook-ingress` | Helper запитів Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard тіла запиту Webhook | Helper читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime reply | Вхідний dispatch, Heartbeat, planner reply, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper dispatch reply | Фіналізація, dispatch провайдера і helper міток розмов |
  | `plugin-sdk/reply-history` | Helper історії reply | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилання reply | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk reply | Helper chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Helper сховища сеансів | Шлях сховища + helper `updated-at` |
  | `plugin-sdk/state-paths` | Helper шляхів стану | Helper каталогів стану й OAuth |
  | `plugin-sdk/routing` | Helper маршрутизації/ключа сеансу | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper нормалізації ключа сеансу |
  | `plugin-sdk/status-helpers` | Helper стану каналу | Builder підсумків стану каналу/облікового запису, значення runtime-state за замовчуванням, helper метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Helper розв’язання цілей | Спільні helper розв’язання цілей |
  | `plugin-sdk/string-normalization-runtime` | Helper нормалізації рядків | Helper нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Helper URL запиту | Витягування рядкових URL із request-подібних входів |
  | `plugin-sdk/run-command` | Helper команд із таймингом | Виконувач команд із таймингом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Загальні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструмента | Витягування нормалізованих payload з об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування надсилання інструмента | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Helper тимчасових шляхів | Спільні helper шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Helper logging | Logger підсистеми і helper редагування |
  | `plugin-sdk/markdown-table-runtime` | Helper markdown-table | Helper режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload reply |
  | `plugin-sdk/provider-setup` | Кураторські helper setup локального/self-hosted провайдера | Helper виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані helper setup self-hosted провайдера, сумісного з OpenAI | Ті самі helper виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime провайдера | Helper розв’язання API-ключа runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper setup API-ключа провайдера | Helper onboarding/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Helper результату auth провайдера | Стандартний builder результату auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helper інтерактивного входу провайдера | Спільні helper інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Helper вибору провайдера | Вибір налаштованого або автоматичного провайдера та злиття сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Helper env vars провайдера | Helper пошуку env vars auth провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні helper моделі/replay провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder політики replay, helper endpoint провайдера та helper нормалізації id моделі |
  | `plugin-sdk/provider-catalog-shared` | Спільні helper каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding провайдера | Helper конфігурації onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP провайдера | Загальні helper HTTP/можливостей endpoint провайдера, зокрема helper multipart form для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch провайдера | Helper реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper конфігурації web-search провайдера | Вузькі helper конфігурації/облікових даних web-search для провайдерів, яким не потрібна прив’язка enable Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper контракту web-search провайдера | Вузькі helper контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter облікових даних |
  | `plugin-sdk/provider-web-search` | Helper web-search провайдера | Helper реєстрації/кешу/runtime провайдера web-search |
  | `plugin-sdk/provider-tools` | Helper сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та helper сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helper використання провайдера |
  | `plugin-sdk/provider-stream` | Helper обгортки потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні helper обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper транспорту провайдера | Нативні helper транспорту провайдера, такі як guarded fetch, перетворення транспортних повідомлень і writable потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні helper media | Helper fetch/transform/store media плюс builder media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні helper генерації media | Спільні helper failover, вибір кандидатів і повідомлення про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Helper розуміння media | Типи провайдера розуміння media плюс експорти helper зображення/аудіо для провайдера |
  | `plugin-sdk/text-runtime` | Спільні helper тексту | Видалення видимого для помічника тексту, helper render/chunking/table для markdown, helper редагування, helper тегів директив, утиліти безпечного тексту та пов’язані helper тексту/logging |
  | `plugin-sdk/text-chunking` | Helper chunking тексту | Helper chunking вихідного тексту |
  | `plugin-sdk/speech` | Helper мовлення | Типи провайдера мовлення плюс helper директив, реєстру та валідації для провайдера |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдера мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Helper транскрипції в реальному часі | Типи провайдера, helper реєстру та спільний helper сеансу WebSocket |
  | `plugin-sdk/realtime-voice` | Helper голосу в реальному часі | Типи провайдера, helper реєстру/розв’язання та helper bridge-сеансу |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, helper failover, auth і реєстру |
  | `plugin-sdk/music-generation` | Helper генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helper failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/video-generation` | Helper генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helper failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/interactive-runtime` | Helper інтерактивного reply | Нормалізація/зменшення payload інтерактивного reply |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви config-schema каналу |
  | `plugin-sdk/channel-config-writes` | Helper запису конфігурації каналу | Helper авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Спільні експорти prelude Plugin каналу |
  | `plugin-sdk/channel-status` | Helper стану каналу | Спільні helper snapshot/summary стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Helper конфігурації allowlist | Helper редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Helper доступу до групи | Спільні helper рішень щодо доступу до групи |
  | `plugin-sdk/direct-dm` | Helper Direct-DM | Спільні helper auth/guard для Direct-DM |
  | `plugin-sdk/extension-shared` | Спільні helper розширень | Примітиви helper passive-channel/status та ambient proxy |
  | `plugin-sdk/webhook-targets` | Helper цілей Webhook | Helper реєстру цілей Webhook та встановлення route |
  | `plugin-sdk/webhook-path` | Helper шляху Webhook | Helper нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні helper web media | Helper завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані helper memory-core | Поверхня helper менеджера/config/файлів/CLI memory |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія memory | Фасад runtime індексу/пошуку memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Рушій foundation хоста memory | Експорти рушія foundation хоста memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста memory | Контракти embedding memory, доступ до реєстру, локальний провайдер і загальні helper пакетної/віддаленої обробки; конкретні віддалені провайдери розміщуються у Plugins-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста memory | Експорти рушія QMD хоста memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста memory | Експорти рушія сховища хоста memory |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні helper хоста memory | Мультимодальні helper хоста memory |
  | `plugin-sdk/memory-core-host-query` | Helper запитів хоста memory | Helper запитів хоста memory |
  | `plugin-sdk/memory-core-host-secret` | Helper секретів хоста memory | Helper секретів хоста memory |
  | `plugin-sdk/memory-core-host-events` | Helper журналу подій хоста memory | Helper журналу подій хоста memory |
  | `plugin-sdk/memory-core-host-status` | Helper стану хоста memory | Helper стану хоста memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI хоста memory | Helper runtime CLI хоста memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Основний runtime хоста memory | Основні helper runtime хоста memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper файлів/runtime хоста memory | Helper файлів/runtime хоста memory |
  | `plugin-sdk/memory-host-core` | Псевдонім основного runtime хоста memory | Vendor-neutral псевдонім для основних helper runtime хоста memory |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста memory | Vendor-neutral псевдонім для helper журналу подій хоста memory |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста memory | Vendor-neutral псевдонім для helper файлів/runtime хоста memory |
  | `plugin-sdk/memory-host-markdown` | Helper керованого markdown | Спільні helper керованого markdown для прилеглих до memory плагінів |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Lazy фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім стану хоста memory | Vendor-neutral псевдонім для helper стану хоста memory |
  | `plugin-sdk/memory-lancedb` | Вбудовані helper memory-lancedb | Поверхня helper memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Helper тестування та mock-об’єкти |
</Accordion>

Ця таблиця навмисно є поширеною підмножиною для міграції, а не повною
поверхнею SDK. Повний список із понад 200 точок входу міститься у
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі helper seams вбудованих Plugins, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки та сумісності вбудованих Plugins, але навмисно не включені до
таблиці поширеної міграції і не є рекомендованою ціллю для нового коду Plugin.

Те саме правило застосовується до інших сімейств вбудованих helper, таких як:

- helper підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих helper/Plugins, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню token-helper:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в усьому Plugin SDK, контракті провайдера,
поверхні runtime і маніфесті. Кожне з них усе ще працює сьогодні, але буде видалене
в одному з майбутніх мажорних випусків. Запис під кожним елементом зіставляє старий API
з його канонічною заміною.

<AccordionGroup>
  <Accordion title="builder довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортовані з вужчого subpath. `command-auth`
    повторно експортує їх як compat stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="helper gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох розділених викликів.

    Downstream Plugins каналів (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="shim runtime каналу і helper дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    Plugins каналів. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    runtime.

    Helper `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими експортами каналу "actions". Натомість
    надавайте можливості через семантичну поверхню `presentation` — Plugins каналів
    оголошують, що саме вони рендерять (cards, buttons, selects), а не які сирі
    назви дій вони приймають.

  </Accordion>

  <Accordion title="helper tool() провайдера web search → createTool() у Plugin">
    **Старе**: factory `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо у Plugin провайдера.
    OpenClaw більше не потребує helper SDK для реєстрації обгортки tool.

  </Accordion>

  <Accordion title="Текстові plaintext envelope каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для створення плаского plaintext prompt
    envelope із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача. Plugins каналів
    прикріплюють метадані маршрутизації (потік, тема, reply-to, реакції) як
    типізовані поля замість конкатенації їх у рядок prompt. Helper
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих envelope,
    видимих помічнику, але вхідні plaintext envelope поступово виводяться з ужитку.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який custom
    Plugin каналу, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдера → типи каталогу провайдера">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий псевдонім          | Новий тип                |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Плюс застарілий статичний bag `ProviderCapabilities` — Plugins провайдерів
    мають прикріплювати факти можливостей через контракт runtime провайдера,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="hook політики thinking → resolveThinkingProfile">
    **Старе** (три окремі hook на `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені значення
    за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hook і далі працюють протягом
    вікна застарівання, але не комбінуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "auth fallback" виводить попередження під час runtime і буде видалений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env vars провайдера → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env vars у `setup.providers[].envVars`
    у маніфесті. Це консолідує метадані env setup/status в одному
    місці та дозволяє не запускати runtime Plugin лише для відповіді на
    пошуки env vars.

    `providerAuthEnvVars` лишається підтримуваним через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація Plugin memory → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик на API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Адитивні helper memory
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплено.

  </Accordion>

  <Accordion title="Типи повідомлень сеансу subagent перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                            |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (однина) повертав live accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (множина) повертає доступ TaskFlow на основі DTO,
    який є безпечним для імпорту й не потребує завантаження повного task runtime.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Factory вбудованих розширень → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Перенесіть розширення результатів інструментів Pi на
    middleware". Тут наведено для повноти: видалений шлях Pi-only
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
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
Застарівання на рівні extension (усередині вбудованих Plugins каналів/провайдерів у
`extensions/`) відстежуються всередині їхніх власних barrel `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugin і тут не перелічені.
Якщо ви напряму використовуєте локальний barrel вбудованого Plugin, перед оновленням
прочитайте коментарі про застарівання в цьому barrel.
</Note>

## Часова шкала видалення

| Коли                   | Що відбувається                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| **Зараз**              | Застарілі поверхні виводять попередження під час runtime                 |
| **Наступний мажорний випуск** | Застарілі поверхні буде видалено; Plugins, які все ще їх використовують, перестануть працювати |

Усі основні Plugins уже мігровано. Зовнішні Plugins мають виконати міграцію
до наступного мажорного випуску.

## Тимчасове приглушення попереджень

Поки ви працюєте над міграцією, установіть ці змінні середовища:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Plugins каналів](/uk/plugins/sdk-channel-plugins) — створення Plugins каналів
- [Plugins провайдерів](/uk/plugins/sdk-provider-plugins) — створення Plugins провайдерів
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник зі схеми маніфесту
