---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-05T18:13:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d2a0f2501484b224a1f5b87dc66e9bef1dcb9d3225aaeefe711ed94bf70b6a16
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Міграція Plugin SDK

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної
архітектури plugin із цілеспрямованими, задокументованими імпортами. Якщо ваш plugin було створено до
появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система plugin надавала дві дуже широкі поверхні, які дозволяли plugin імпортувати
все, що їм було потрібно, з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки
  допоміжних функцій. Його було запроваджено, щоб зберегти працездатність старіших plugin на основі hook, поки
  створювалася нова архітектура plugin.
- **`openclaw/extension-api`** — міст, який надавав plugin прямий доступ до
  допоміжних функцій на боці host, таких як вбудований виконавець агента.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час виконання, але нові
plugin не повинні їх використовувати, а наявні plugin слід перенести до того, як наступний
мажорний реліз їх видалить.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних релізів.
  Plugins, які досі імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки не пов’язаних між собою модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні шви provider для вбудованих channels також зникли. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
допоміжні шви з брендуванням channel, а також
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями монорепозиторію, а не
стабільними контрактами plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині
робочого простору вбудованих plugin зберігайте допоміжні функції, що належать provider, у власних
`api.ts` або `runtime-api.ts` цього plugin.

Поточні приклади вбудованих provider:

- Anthropic зберігає допоміжні функції потоків, специфічні для Claude, у власному шві `api.ts` /
  `contract-api.ts`
- OpenAI зберігає конструктори provider, допоміжні функції моделей за замовчуванням і конструктори provider реального часу
  у власному `api.ts`
- OpenRouter зберігає конструктор provider і допоміжні функції онбордингу/конфігурації у власному
  `api.ts`

## Як виконати міграцію

<Steps>
  <Step title="Перевірте поведінку резервного шляху оболонки Windows">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
    обгортки `.cmd`/`.bat` тепер завершуються із закритою відмовою, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // До
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Після
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Установлюйте це лише для довірених сумісних викликів, які навмисно
      // приймають резервний шлях через оболонку.
      allowShellFallback: true,
    });
    ```

    Якщо ваш виклик навмисно не покладається на резервний шлях оболонки, не встановлюйте
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Пошукайте у своєму plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на цілеспрямовані імпорти">
    Кожен експорт зі старої поверхні зіставляється з певним сучасним шляхом імпорту:

    ```typescript
    // До (застарілий шар зворотної сумісності)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Після (сучасні цілеспрямовані імпорти)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Для допоміжних функцій на боці host використовуйте впроваджене середовище виконання plugin замість прямого
    імпорту:

    ```typescript
    // До (застарілий міст extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Після (впроваджене середовище виконання)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується й до інших допоміжних функцій застарілого моста:

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
  | `plugin-sdk/plugin-entry` | Канонічна допоміжна функція точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий повторний експорт-парасолька для визначень/конструкторів входів channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжна функція точки входу для одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цілеспрямовані визначення входів і конструктори channel | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування | Запити allowlist, конструктори статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні функції середовища виконання під час налаштування | Безпечні для імпорту адаптери patch налаштування, допоміжні функції приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні функції адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні функції інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні функції для кількох облікових записів | Допоміжні функції списку/конфігурації/шлюзу дій облікових записів |
  | `plugin-sdk/account-id` | Допоміжні функції ID облікового запису | `DEFAULT_ACCOUNT_ID`, нормалізація ID облікового запису |
  | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікового запису | Допоміжні функції пошуку облікового запису + резервного значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні функції облікового запису | Допоміжні функції списку облікових записів/дій з обліковими записами |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви парування DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді + підключення typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем конфігурації | Типи схем конфігурації channel |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублювань/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політик груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Відстеження статусу облікового запису | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Допоміжні функції вхідного envelope | Спільні допоміжні функції маршрутизації + побудови envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні функції вхідних відповідей | Спільні допоміжні функції запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Аналіз цілей повідомлень | Допоміжні функції аналізу/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні функції вихідного медіа | Спільне завантаження вихідного медіа |
  | `plugin-sdk/outbound-runtime` | Допоміжні функції середовища виконання для вихідних повідомлень | Допоміжні функції ідентичності/делегата відправлення вихідних повідомлень |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції прив’язок потоків | Допоміжні функції життєвого циклу та адаптера прив’язок потоків |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні функції медіа-навантаження агента | Конструктор медіа-навантаження агента для застарілих схем полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти середовища виконання channel |
  | `plugin-sdk/channel-send-result` | Типи результату відправлення | Типи результату відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні функції середовища виконання | Допоміжні функції середовища виконання/журналювання/резервного копіювання/встановлення plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні функції середовища виконання | Допоміжні функції logger/середовища виконання, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції середовища виконання plugin | Допоміжні функції команд/hook/http/інтерактивності plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні функції конвеєра hook | Спільні допоміжні функції конвеєра webhook/внутрішніх hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні функції лінивого середовища виконання | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні функції процесів | Спільні допоміжні функції exec |
  | `plugin-sdk/cli-runtime` | Допоміжні функції середовища виконання CLI | Форматування команд, очікування, допоміжні функції версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні функції Gateway | Клієнт Gateway і допоміжні функції patch статусу channel |
  | `plugin-sdk/config-runtime` | Допоміжні функції конфігурації | Допоміжні функції завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції команд Telegram | Стійкі до резервного шляху допоміжні функції перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні функції запитів схвалення | Навантаження схвалення exec/plugin, допоміжні функції можливостей/профілів схвалення, допоміжні функції маршрутизації/середовища виконання native-схвалень |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні функції auth схвалення | Визначення схвалювача, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні функції клієнта схвалення | Допоміжні функції профілю/фільтра native-схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні функції доставлення схвалення | Адаптери можливостей/доставлення native-схвалення |
  | `plugin-sdk/approval-native-runtime` | Допоміжні функції цілей схвалення | Допоміжні функції цілей native-схвалення/прив’язки облікового запису |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні функції відповіді на схвалення | Допоміжні функції навантаження відповіді на схвалення exec/plugin |
  | `plugin-sdk/security-runtime` | Допоміжні функції безпеки | Спільні допоміжні функції довіри, шлюзів DM, зовнішнього вмісту та збору секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні функції політики SSRF | Допоміжні функції allowlist host і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні функції середовища виконання SSRF | Закріплений dispatcher, guarded fetch, допоміжні функції політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні функції обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні функції шлюзування діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні функції форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні функції графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch/proxy | `resolveFetch`, допоміжні функції proxy |
  | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні функції retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вводу allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюзування команд і допоміжні функції поверхні команд | `resolveControlCommandGate`, допоміжні функції авторизації відправника, допоміжні функції реєстру команд |
  | `plugin-sdk/secret-input` | Аналіз вводу секретів | Допоміжні функції вводу секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні функції запитів webhook | Утиліти цілей webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні функції guard для тіла webhook | Допоміжні функції читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільне середовище виконання відповідей | Вхідна диспетчеризація, heartbeat, планувальник відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції диспетчеризації відповідей | Допоміжні функції finalize + диспетчеризації provider |
  | `plugin-sdk/reply-history` | Допоміжні функції історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань на відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні функції chunk відповідей | Допоміжні функції chunk для тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні функції сховища сесій | Допоміжні функції шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні функції шляхів стану | Допоміжні функції тек стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні функції маршрутизації/ключів сесій | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні функції нормалізації ключів сесій |
  | `plugin-sdk/status-helpers` | Допоміжні функції статусу channel | Конструктори підсумків статусу channel/облікових записів, стандартні значення стану середовища виконання, допоміжні функції метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні функції визначення цілей | Спільні допоміжні функції визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації рядків | Допоміжні функції нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні функції URL запиту | Витягування рядкових URL із вхідних даних, подібних до запиту |
  | `plugin-sdk/run-command` | Допоміжні функції команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Загальні зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-send` | Витягування відправлення tool | Витягування канонічних полів цілі відправлення з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні функції тимчасових шляхів | Спільні допоміжні функції шляху для тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні функції журналювання | Logger підсистеми та допоміжні функції редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні функції таблиць Markdown | Допоміжні функції режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи навантаження reply |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локальних/self-hosted provider | Допоміжні функції виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Цілеспрямовані допоміжні функції налаштування self-hosted provider, сумісних з OpenAI | Ті самі допоміжні функції виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні функції auth provider у середовищі виконання | Допоміжні функції визначення API-ключа під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні функції налаштування API-ключа provider | Допоміжні функції онбордингу/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні функції результату auth provider | Стандартний конструктор результату auth OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні функції інтерактивного входу provider | Спільні допоміжні функції інтерактивного входу |
  | `plugin-sdk/provider-env-vars` | Допоміжні функції змінних середовища provider | Допоміжні функції пошуку змінних середовища auth provider |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні функції моделей/повторів provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політики повторів, допоміжні функції endpoint provider і нормалізації ID моделі |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні функції каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch онбордингу provider | Допоміжні функції конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні функції HTTP provider | Загальні допоміжні функції HTTP/можливостей endpoint provider |
  | `plugin-sdk/provider-web-fetch` | Допоміжні функції web-fetch provider | Допоміжні функції реєстрації/кешу provider web-fetch |
  | `plugin-sdk/provider-web-search` | Допоміжні функції web-search provider | Допоміжні функції реєстрації/кешу/конфігурації provider web-search |
  | `plugin-sdk/provider-tools` | Допоміжні функції сумісності tool/схем provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні функції використання provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні функції використання provider |
  | `plugin-sdk/provider-stream` | Допоміжні функції обгортки потоку provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні функції обгортки Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні функції медіа | Допоміжні функції отримання/перетворення/зберігання медіа, а також конструктори медіа-навантажень |
  | `plugin-sdk/media-understanding` | Допоміжні функції media-understanding | Типи provider media understanding, а також експорти допоміжних функцій зображень/аудіо для provider |
  | `plugin-sdk/text-runtime` | Спільні допоміжні функції тексту | Видалення видимого для помічника тексту, допоміжні функції рендерингу/chunking/таблиць markdown, редагування, теги директив, безпечний текст та пов’язані допоміжні функції тексту/журналювання |
  | `plugin-sdk/text-chunking` | Допоміжні функції chunk тексту | Допоміжна функція chunk вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні функції мовлення | Типи speech provider, а також допоміжні функції директив, реєстру та перевірки для provider |
  | `plugin-sdk/speech-core` | Спільна база speech | Типи speech provider, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні функції транскрипції в реальному часі | Типи provider і допоміжні функції реєстру |
  | `plugin-sdk/realtime-voice` | Допоміжні функції голосу в реальному часі | Типи provider і допоміжні функції реєстру |
  | `plugin-sdk/image-generation-core` | Спільна база генерації зображень | Допоміжні функції типів, failover, auth і реєстру для генерації зображень |
  | `plugin-sdk/video-generation` | Допоміжні функції генерації відео | Типи provider/request/result для генерації відео |
  | `plugin-sdk/video-generation-core` | Спільна база генерації відео | Типи генерації відео, допоміжні функції failover, пошук provider і аналіз model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні функції інтерактивних відповідей | Нормалізація/зведення навантаження інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації channel | Вузькі примітиви config-schema для channel |
  | `plugin-sdk/channel-config-writes` | Допоміжні функції запису конфігурації channel | Допоміжні функції авторизації запису конфігурації channel |
  | `plugin-sdk/channel-plugin-common` | Спільний прелюд channel | Експорти спільного прелюду plugin channel |
  | `plugin-sdk/channel-status` | Допоміжні функції статусу channel | Спільні допоміжні функції знімка/підсумку статусу channel |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні функції конфігурації allowlist | Допоміжні функції редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні функції доступу груп | Спільні допоміжні функції рішень щодо групового доступу |
  | `plugin-sdk/direct-dm` | Допоміжні функції direct-DM | Спільні допоміжні функції auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні функції extension | Примітиви допоміжних функцій пасивного channel/статусу |
  | `plugin-sdk/webhook-targets` | Допоміжні функції цілей webhook | Реєстр цілей webhook і допоміжні функції встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні функції шляху webhook | Допоміжні функції нормалізації шляху webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні функції web media | Допоміжні функції завантаження віддаленого/локального медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів plugin SDK |
  | `plugin-sdk/memory-core` | Допоміжні функції bundled memory-core | Поверхня допоміжних функцій memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання engine пам’яті | Фасад середовища виконання index/search пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий engine host пам’яті | Експорти базового engine host пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding для host пам’яті | Експорти engine embedding для host пам’яті |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD для host пам’яті | Експорти engine QMD для host пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine зберігання для host пам’яті | Експорти engine зберігання для host пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні функції мультимодального host пам’яті | Допоміжні функції мультимодального host пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів host пам’яті | Допоміжні функції запитів host пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів host пам’яті | Допоміжні функції секретів host пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу host пам’яті | Допоміжні функції статусу host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Середовище виконання CLI host пам’яті | Допоміжні функції середовища виконання CLI host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Базове середовище виконання host пам’яті | Допоміжні функції базового середовища виконання host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/середовища виконання host пам’яті | Допоміжні функції файлів/середовища виконання host пам’яті |
  | `plugin-sdk/memory-lancedb` | Допоміжні функції bundled memory-lancedb | Поверхня допоміжних функцій memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні функції тестування та mock-об’єкти |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не повну
поверхню SDK. Повний список із понад 200 точок входу міститься у
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі допоміжні шви bundled-plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й далі експортуються для
підтримки bundled-plugin і сумісності, але навмисно
пропущені з таблиці поширеної міграції й не є рекомендованою ціллю для
нового коду plugin.

Те саме правило застосовується до інших сімейств вбудованих допоміжних функцій, таких як:

- допоміжні функції підтримки browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих допоміжних функцій/plugin, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку
поверхню допоміжних функцій токена `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Хронологія видалення

| Коли | Що відбувається |
| --- | --- |
| **Зараз** | Застарілі поверхні виводять попередження під час виконання |
| **Наступний мажорний реліз** | Застарілі поверхні буде видалено; plugins, які все ще їх використовують, перестануть працювати |

Усі core plugins уже мігровано. Зовнішнім plugins слід виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/plugins/building-plugins) — створіть свій перший plugin
- [Огляд SDK](/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Plugins channel](/plugins/sdk-channel-plugins) — створення plugins channel
- [Plugins provider](/plugins/sdk-provider-plugins) — створення plugins provider
- [Внутрішня будова plugin](/plugins/architecture) — глибокий розбір архітектури
- [Маніфест plugin](/plugins/manifest) — довідник зі схеми маніфесту
