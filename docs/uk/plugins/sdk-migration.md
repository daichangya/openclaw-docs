---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-08T08:11:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a2ce7f5553563516a549ca87e776a6a71e8dd8533a773c5ddbecfae43e7b77
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Міграція Plugin SDK

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної
архітектури plugin із цільовими, задокументованими імпортами. Якщо ваш plugin
було створено до появи нової архітектури, цей посібник допоможе вам виконати
міграцію.

## Що змінюється

Стара система plugin надавала дві надто широкі поверхні, які дозволяли plugin
імпортувати все необхідне з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував
  десятки допоміжних засобів. Його було запроваджено, щоб зберегти працездатність
  старіших plugin на основі hooks, поки створювалася нова архітектура plugin.
- **`openclaw/extension-api`** — міст, який надавав plugin прямий доступ до
  допоміжних засобів на боці хоста, таких як вбудований засіб запуску агента.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час виконання,
але нові plugin не повинні їх використовувати, а наявним plugin слід виконати
міграцію до того, як наступний мажорний реліз їх прибере.

<Warning>
  Шар зворотної сумісності буде видалено в одному з наступних мажорних релізів.
  Plugins, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams постачальників для вбудованих каналів також прибрано. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
допоміжні branded seams для каналів і
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями моно-репозиторію, а не
стабільними контрактами plugin. Натомість використовуйте вузькі загальні subpaths SDK. Усередині
робочого простору вбудованих plugin зберігайте допоміжні засоби, що належать постачальнику, у власному
`api.ts` або `runtime-api.ts` цього plugin.

Поточні приклади вбудованих постачальників:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI зберігає конструктори постачальників, допоміжні засоби моделей за замовчуванням і конструктори постачальників realtime
  у власному `api.ts`
- OpenRouter зберігає конструктор постачальника та допоміжні засоби onboarding/config у власному
  `api.ts`

## Як виконати міграцію

<Steps>
  <Step title="Мігруйте approval-native обробники до capability facts">
    Channel plugins із підтримкою approval тепер розкривають нативну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром runtime-context.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, зі застарілої логіки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` було вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків channel login/logout; approval auth
      hooks там більше не зчитуються ядром
    - Реєструйте об’єкти runtime, що належать каналу, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення reroute, що належать plugin, із нативних approval handlers;
      тепер ядро відповідає за повідомлення про доставку в інше місце на основі фактичних результатів delivery
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins`, щоб ознайомитися з поточним компонуванням
    approval capability.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозпізнані Windows
    wrappers `.cmd`/`.bat` тепер завершуються з помилкою за замовчуванням, якщо ви явно не передасте
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
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх цільовими імпортами">
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

    Для допоміжних засобів на боці хоста використовуйте введений runtime plugin замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується й до інших застарілих допоміжних засобів bridge:

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
  | Шлях імпорту | Призначення | Основні експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella re-export для визначень/конструкторів точок входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми config | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного постачальника | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та конструктори точок входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити allowlist, конструктори статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Безпечні для імпорту patch adapters для setup, допоміжні засоби lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби setup adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби tooling для setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку/config/action-gate облікових записів |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікових записів + fallback за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для облікових записів | Допоміжні засоби списку облікових записів/account-action |
  | `plugin-sdk/channel-setup` | Adapters майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді + логіка typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики adapters config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем config | Типи схем config каналу |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби config команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики group/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Відстеження статусу облікового запису | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби inbound envelope | Спільні допоміжні засоби маршрутизації + конструювання envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби inbound reply | Спільні допоміжні засоби record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Аналіз цілей повідомлень | Допоміжні засоби аналізу/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби outbound media | Спільне завантаження outbound media |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound runtime | Допоміжні засоби outbound identity/send delegate |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби thread-binding | Життєвий цикл thread-binding і допоміжні засоби adapter |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Конструктор agent media payload для застарілих схем полів |
  | `plugin-sdk/channel-runtime` | Застарілий compatibility shim | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env | Logger/runtime env, допоміжні засоби timeout, retry та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби plugin runtime | Допоміжні засоби plugin commands/hooks/http/interactive |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби pipeline для hooks | Спільні допоміжні засоби pipeline для webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби process | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби gateway | Допоміжні засоби клієнта gateway і patch channel-status |
  | `plugin-sdk/config-runtime` | Допоміжні засоби config | Допоміжні засоби завантаження/запису config |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Стабільні fallback-допоміжні засоби перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби prompt для approval | Допоміжні засоби payload для exec/plugin approval, approval capability/profile, нативної маршрутизації/runtime approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth для approval | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта approval | Допоміжні засоби profile/filter для нативного exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби delivery для approval | Adapters нативної approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби gateway для approval | Спільний допоміжний засіб визначення approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби adapters approval | Полегшені допоміжні засоби завантаження native approval adapter для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби handlers approval | Ширші допоміжні засоби runtime для handlers approval; віддавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей approval | Допоміжні засоби native approval target/account binding |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді approval | Допоміжні засоби payload відповіді для exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби channel runtime-context | Загальні допоміжні засоби register/get/watch для channel runtime-context |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби trust, DM gating, external-content і secret-collection |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Допоміжні засоби pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, засоби запуску policy |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення входів allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating команд і допоміжні засоби command-surface | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд |
  | `plugin-sdk/secret-input` | Аналіз secret input | Допоміжні засоби secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів webhook | Утиліти цілей webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла webhook-запиту | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний reply runtime | Inbound dispatch, heartbeat, планувальник відповіді, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch відповіді | Допоміжні засоби finalize + provider dispatch |
  | `plugin-sdk/reply-history` | Допоміжні засоби history відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування reply reference | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunk для reply | Допоміжні засоби chunking для тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби session store | Допоміжні засоби path сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів state | Допоміжні засоби каталогів state і OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу каналу | Конструктори підсумків статусу каналу/облікового запису, значення runtime-state за замовчуванням, допоміжні засоби метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби target resolver | Спільні допоміжні засоби target resolver |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймером | Засіб запуску timed command із нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload tool | Витягування нормалізованих payload із об’єктів результату tool |
  | `plugin-sdk/tool-send` | Витягування надсилання tool | Витягування канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби path для тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби logging | Допоміжні засоби logger підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби markdown-table | Допоміжні засоби режиму markdown table |
  | `plugin-sdk/reply-payload` | Типи відповідей повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Curated допоміжні засоби налаштування локальних/self-hosted постачальників | Допоміжні засоби виявлення/config для self-hosted постачальників |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted постачальників, сумісних з OpenAI | Ті самі допоміжні засоби виявлення/config для self-hosted постачальників |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime auth постачальника | Допоміжні засоби визначення runtime API key |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API key постачальника | Допоміжні засоби onboarding/profile-write для API key |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result постачальника | Стандартний конструктор OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного login постачальника | Спільні допоміжні засоби інтерактивного login |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env vars постачальника | Допоміжні засоби пошуку env vars auth постачальника |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/replay постачальника | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні засоби endpoint постачальника та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу постачальника | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі onboarding постачальника | Допоміжні засоби onboarding config |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP постачальника | Загальні допоміжні засоби HTTP/можливостей endpoint постачальника |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch постачальника | Допоміжні засоби реєстрації/кешу постачальника web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби config веб-пошуку постачальника | Вузькі допоміжні засоби config/credential для веб-пошуку для постачальників, яким не потрібна логіка ввімкнення plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту веб-пошуку постачальника | Вузькі допоміжні засоби contract config/credential для веб-пошуку, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, і допоміжні засоби scoped credential setters/getters |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби веб-пошуку постачальника | Допоміжні засоби реєстрації/кешу/runtime постачальника веб-пошуку |
  | `plugin-sdk/provider-tools` | Допоміжні засоби compat tool/schema постачальника | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + diagnostics і допоміжні засоби compat xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби usage постачальника | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби usage постачальника |
  | `plugin-sdk/provider-stream` | Допоміжні засоби wrapper потоку постачальника | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні засоби wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби fetch/transform/store для media плюс конструктори media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби media-generation | Спільні допоміжні засоби failover, вибору candidate і повідомлень про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи постачальників media understanding плюс експорти допоміжних засобів image/audio для постачальників |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text | Видалення тексту, видимого асистенту, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування, directive-tag, safe-text і пов’язані допоміжні засоби text/logging |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking тексту | Допоміжний засіб chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби speech | Типи постачальників speech плюс експорти допоміжних засобів directive, registry і validation для постачальників |
  | `plugin-sdk/speech-core` | Спільне speech core | Типи постачальників speech, registry, directives, normalізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби realtime transcription | Типи постачальників і допоміжні засоби registry |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби realtime voice | Типи постачальників і допоміжні засоби registry |
  | `plugin-sdk/image-generation-core` | Спільне image-generation core | Типи image-generation, failover, auth і допоміжні засоби registry |
  | `plugin-sdk/music-generation` | Допоміжні засоби music-generation | Типи постачальника/запиту/результату для генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне music-generation core | Типи генерації музики, допоміжні засоби failover, пошук постачальника та аналіз model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби video-generation | Типи постачальника/запиту/результату для генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне video-generation core | Типи генерації відео, допоміжні засоби failover, пошук постачальника та аналіз model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/редукція payload інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви config каналу | Вузькі примітиви schema config каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису config каналу | Допоміжні засоби авторизації запису config каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Експорти спільного prelude для channel plugin |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби config allowlist | Допоміжні засоби редагування/читання config allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні допоміжні засоби прийняття рішень щодо group-access |
  | `plugin-sdk/direct-dm` | Допоміжні засоби прямого DM | Спільні допоміжні засоби auth/guard для прямого DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви passive-channel/status і ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей webhook | Реєстр цілей webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів webhook | Допоміжні засоби нормалізації шляхів webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Допоміжні засоби вбудованого memory-core | Поверхня допоміжних засобів memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime для memory engine | Фасад runtime для memory index/search |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий engine хоста пам’яті | Експорти foundation engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine хоста пам’яті | Експорти embedding engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine хоста пам’яті | Експорти QMD engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage engine хоста пам’яті | Експорти storage engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста пам’яті | Допоміжні засоби multimodal хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби query хоста пам’яті | Допоміжні засоби query хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста пам’яті | Допоміжні засоби secret хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті | Допоміжні засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні засоби CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Допоміжні засоби core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті | Допоміжні засоби файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Вендорно-нейтральний псевдонім для допоміжних засобів core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Вендорно-нейтральний псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Вендорно-нейтральний псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для plugin, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку активної пам’яті | Лінивий фасад runtime search-manager для active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Вендорно-нейтральний псевдонім для допоміжних засобів статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Допоміжні засоби вбудованого memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні засоби тестування та mocks |
</Accordion>

Ця таблиця навмисно містить лише поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 entrypoints міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі seams допоміжних засобів вбудованих plugin, як-от
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони все ще експортуються для
підтримки вбудованих plugin і сумісності, але навмисно не включені до поширеної таблиці міграції
й не є рекомендованою ціллю для
нового коду plugin.

Те саме правило застосовується до інших сімейств вбудованих допоміжних засобів, зокрема:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих допоміжних засобів/plugin, як-от `plugin-sdk/googlechat`,
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

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти потрібний експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Часова шкала вилучення

| Коли | Що відбувається |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз** | Застарілі поверхні виводять попередження під час виконання |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; plugins, які все ще їх використовують, перестануть працювати |

Усі core plugins уже мігровано. Зовнішнім plugins слід виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Поки ви працюєте над міграцією, установіть такі змінні середовища:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
- [Внутрішня будова plugin](/uk/plugins/architecture) — поглиблений розбір архітектури
- [Маніфест plugin](/uk/plugins/manifest) — довідник схеми маніфесту
