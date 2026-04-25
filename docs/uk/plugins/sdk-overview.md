---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник з усіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-25T00:26:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4aedd09b7a02aeced8265c119d7d800f45d41780e5bf099826abee9a3c74c868
    source_path: plugins/sdk-overview.md
    workflow: 15
---

SDK плагінів — це типізований контракт між плагінами та ядром. Ця сторінка є
довідником щодо **що імпортувати** і **що можна реєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший плагін? Почніть із [Створення плагінів](/uk/plugins/building-plugins).
- Плагін каналу? Див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
- Плагін провайдера? Див. [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins).
- Плагін інструмента або хука життєвого циклу? Див. [Хуки плагінів](/uk/plugins/hooks).
  </Tip>

## Правила імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
допоміжних засобів entry/build надавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої поверхні-парасольки та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і загального конструктора. Будь-які
експорти схем із назвами вбудованих каналів у цьому підшляху є застарілими
експортами для сумісності, а не шаблоном для нових плагінів.

<Warning>
  Не імпортуйте фірмові зручні seams провайдерів або каналів (наприклад,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни компонують загальні підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачам ядра слід або використовувати ці локальні
  barrel-файли плагінів, або додавати вузький загальний контракт SDK, якщо
  потреба справді є міжканальною.

Невеликий набір допоміжних seams для вбудованих плагінів (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще з’являється в
згенерованій карті експортів. Вони існують лише для підтримки вбудованих
плагінів і не рекомендуються як шляхи імпорту для нових сторонніх плагінів.
</Warning>

## Довідник підшляхів

SDK плагінів надається як набір вузьких підшляхів, згрупованих за областями (entry
плагіна, канал, провайдер, auth, runtime, capability, memory і зарезервовані
допоміжні засоби для вбудованих плагінів). Повний каталог — із групуванням і
посиланнями — див. у [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capability

| Method                                           | Що реєструє                          |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)            |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend inference для CLI  |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями          |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео         |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                  |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                     |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                      |
| `api.registerWebFetchProvider(...)`              | Провайдер Web fetch / scrape         |
| `api.registerWebSearchProvider(...)`             | Вебпошук                             |

### Інструменти та команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)         |

### Інфраструктура

| Method                                          | Що реєструє                            |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Хук подій                              |
| `api.registerHttpRoute(params)`                 | HTTP-ендпойнт Gateway                  |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)`  | Рекламування локального виявлення Gateway |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                         |
| `api.registerService(service)`                  | Фонова служба                          |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний обробник                 |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware результату інструмента runtime |
| `api.registerEmbeddedExtensionFactory(factory)` | Застаріла фабрика розширень PI         |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивний розділ prompt, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний корпус для пошуку/читання пам’яті |

<Note>
  Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
  вужчу область видимості для методу gateway. Для методів, що належать
  плагіну, надавайте перевагу специфічним для плагіна префіксам.
</Note>

<Accordion title="Коли використовувати middleware результату інструмента">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  передасть цей результат назад у модель. Це довірений runtime-нейтральний
  seam для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані плагіни мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати це middleware; для завдань, яким не потрібен
таймінг результату інструмента до моделі, використовуйте звичайні хуки плагінів OpenClaw.
</Accordion>

<Accordion title="Застарілі фабрики розширень Pi">
  `api.registerEmbeddedExtensionFactory(...)` застарів. Він залишається
  сумісним seam для вбудованих плагінів, яким усе ще потрібні прямі події
  embedded-runner Pi. Нові перетворення результатів інструментів мають використовувати
  натомість `api.registerAgentToolResultMiddleware(...)`.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає змогу плагіну рекламувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає службу
під час запуску Gateway, коли ввімкнено локальне виявлення, передає поточні
порти Gateway і несекретні TXT-дані підказок, а також викликає повернутий
обробник `stop` під час завершення роботи Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Плагіни виявлення Gateway не повинні розглядати рекламовані TXT-значення як секрети або
автентифікацію. Виявлення — це підказка маршрутизації; довірою, як і раніше, керують auth Gateway і pinning TLS.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, що належать реєстратору
- `descriptors`: дескриптори команд на етапі парсингу, які використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася ліниво завантажуваною в
звичайному шляху кореневого CLI, надайте `descriptors`, які охоплюють кожен
корінь команди верхнього рівня, що надається цим реєстратором.

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
        description: "Керуйте обліковими записами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, якщо вам не потрібна лінива реєстрація кореневого CLI.
Цей eager-шлях сумісності все ще підтримується, але він не встановлює
заповнювачі на основі дескрипторів для лінивого завантаження на етапі парсингу.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дає змогу плагіну володіти конфігурацією за замовчуванням для локального
AI backend CLI, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в посиланнях на моделі, як-от `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значення за замовчуванням плагіна перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує перезаписів сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфікована capability пам’яті                                                                                                                      |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt пам’яті                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання пам’яті                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                                                                                                                             |

### Адаптери embedding пам’яті

| Method                                         | Що реєструє                                  |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного плагіна |

- `registerMemoryCapability` — це пріоритетний API ексклюзивного плагіна пам’яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб плагіни-компаньйони могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість доступу до приватного
  макета конкретного плагіна пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застаріло-сумісні API ексклюзивних плагінів пам’яті.
- `registerMemoryEmbeddingProvider` дає активному плагіну пам’яті змогу зареєструвати один
  або кілька id адаптерів embedding (наприклад, `openai`, `gemini` або
  користувацький id, визначений плагіном).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, резолвиться відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови     |

Див. [Хуки плагінів](/uk/plugins/hooks), щоб переглянути приклади, поширені назви хуків і
семантику guard.

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник перебирає на себе dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного потоку/теми. `metadata` залишайте для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить gateway, замість покладання на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID плагіна                                                                                  |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                     |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                   |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, якщо доступний)           |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для плагіна конфігурація з `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                            |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Резолвити шлях відносно кореня плагіна                                                      |

## Угода щодо внутрішніх модулів

Усередині вашого плагіна використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих плагінів, завантажені через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), надають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже запущено. Якщо знімок runtime
ще не існує, вони повертаються до резолвленого файлу конфігурації на диску.

Плагіни провайдерів можуть надавати вузький локальний barrel-контракт плагіна, коли
певний допоміжний засіб навмисно є специфічним для провайдера і поки що не належить
до загального підшляху SDK. Приклади вбудованих плагінів:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і допоміжних засобів потоку `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує конструктори провайдерів,
  допоміжні засоби моделей за замовчуванням і конструктори realtime-провайдерів.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує конструктор провайдера
  разом із допоміжними засобами onboarding/config.

<Warning>
  Production-код розширень також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, перенесіть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  surface, орієнтованої на capability, замість зв’язування двох плагінів між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби runtime" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору імен `api.runtime`.
  </Card>
  <Card title="Налаштування та конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти тестування та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих surface.
  </Card>
  <Card title="Внутрішня будова плагінів" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель capability.
  </Card>
</CardGroup>
