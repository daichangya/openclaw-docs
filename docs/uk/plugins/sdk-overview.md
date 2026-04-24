---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати.
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi.
    - Ви шукаєте конкретний експорт SDK.
sidebarTitle: SDK overview
summary: Import map, посилання на API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-24T06:33:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

SDK Plugin — це типізований контракт між plugins і ядром. Ця сторінка —
довідник про **що імпортувати** і **що можна зареєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший plugin? Почніть із [Створення plugins](/uk/plugins/building-plugins).
- Channel plugin? Див. [Channel plugins](/uk/plugins/sdk-channel-plugins).
- Provider plugin? Див. [Provider plugins](/uk/plugins/sdk-provider-plugins).
  </Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для channel
допоміжних засобів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої загальної поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

<Warning>
  Не імпортуйте branded convenience seams для provider або channel (наприклад,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані plugins компонують універсальні підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачам ядра слід або використовувати ці локальні для plugin
  barrel-файли, або додати вузький загальний контракт SDK, коли потреба справді є
  між channel.

Невеликий набір helper seam-ів для вбудованих plugins (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще присутній у
згенерованій мапі експортів. Вони існують лише для підтримки вбудованих plugins і
не рекомендовані як шляхи імпорту для нових сторонніх plugins.
</Warning>

## Довідник підшляхів

SDK Plugin доступний як набір вузьких підшляхів, згрупованих за напрямами (plugin
entry, channel, provider, auth, runtime, capability, memory і зарезервовані
helper-и для вбудованих plugins). Повний каталог — зі
згрупуванням і посиланнями — див. у
[Підшляхах SDK Plugin](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                           |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстову інференцію (LLM)             |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець agent |
| `api.registerCliBackend(...)`                    | Локальний backend інференції CLI      |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями           |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокову транскрипцію в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Двобічні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерацію зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерацію музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерацію відео                       |
| `api.registerWebFetchProvider(...)`              | Provider для web fetch / scrape       |
| `api.registerWebSearchProvider(...)`             | Вебпошук                              |

### Інструменти та команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент agent (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацьку команду (обходить LLM)         |

### Інфраструктура

| Method                                          | Що реєструє                            |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Хук подій                              |
| `api.registerHttpRoute(params)`                 | HTTP endpoint Gateway                  |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)`  | Локальний сервіс анонсування виявлення Gateway |
| `api.registerCli(registrar, opts?)`             | Підкоманду CLI                         |
| `api.registerService(service)`                  | Фоновий сервіс                         |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний handler                  |
| `api.registerEmbeddedExtensionFactory(factory)` | Фабрику розширень вбудованого runner-а Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивний розділ prompt, суміжний із memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний корпус пошуку/читання memory |

<Note>
  Зарезервовані простори назв адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
  вужчу область gateway method. Для методів, що належать plugin, віддавайте перевагу
  префіксам, специфічним для plugin.
</Note>

<Accordion title="Коли використовувати registerEmbeddedExtensionFactory">
  Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли plugin потребує Pi-native
  таймінгу подій під час вбудованих запусків OpenClaw — наприклад, для асинхронних переписувань `tool_result`,
  які мають відбутися до того, як буде надіслано фінальне повідомлення з результатом інструмента.

Це seam для вбудованих plugins на сьогодні: лише вбудовані plugins можуть реєструвати такий,
і вони мають оголосити `contracts.embeddedExtensionFactories: ["pi"]` у
`openclaw.plugin.json`. Для всього, що не потребує цього нижчорівневого seam, залишайте звичайні hooks plugin OpenClaw.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає змогу plugin анонсувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає сервіс
під час запуску Gateway, коли локальне виявлення увімкнене, передає поточні
порти Gateway і несекретні TXT-підказки, а під час зупинки Gateway викликає
повернений handler `stop`.

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

Plugins виявлення Gateway не повинні трактувати анонсовані значення TXT як секрети або
автентифікацію. Виявлення — це підказка для маршрутизації; довіра й далі визначається
автентифікацією Gateway та TLS pinning.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для довідки root CLI,
  маршрутизації та лінивої реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася ліниво завантажуваною у звичайному шляху root CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що експонується цим
registrar.

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

Використовуйте лише `commands`, якщо вам не потрібна лінива реєстрація root CLI.
Цей eager-сумісний шлях і надалі підтримується, але він не встановлює
placeholder-и на основі descriptor для лінивого завантаження на етапі парсингу.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дає змогу plugin володіти конфігурацією за замовчуванням для локального
backend AI CLI, такого як `codex-cli`.

- `id` backend стає префіксом provider у посиланнях на моделі на кшталт `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значення plugin за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує сумісних переписувань після злиття
  (наприклад, для нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати додавання до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфіковану можливість memory                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt для memory                                                                                                              |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану скидання memory                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime для memory                                                                                                                         |

### Адаптери embedding для memory

| Method                                         | Що реєструє                                  |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для memory для активного plugin |

- `registerMemoryCapability` — рекомендований ексклюзивний API memory-plugin.
- `registerMemoryCapability` також може експонувати `publicArtifacts.listArtifacts(...)`,
  щоб супутні plugins могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core` замість доступу до приватної структури
  конкретного memory plugin.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні з legacy ексклюзивні API memory-plugin.
- `registerMemoryEmbeddingProvider` дає змогу активному memory plugin реєструвати один
  або кілька id адаптерів embedding (наприклад, `openai`, `gemini` або власний id, визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, зіставляється з цими зареєстрованими
  id адаптерів.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови     |

### Семантика рішень hook-ів

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler заявляє про dispatch, handler-и з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного потоку/thread/topic. `metadata` залишайте для специфічних для channel додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для channel `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні hooks `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                      |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор plugin                                                                      |
| `api.name`               | `string`                  | Відображувана назва                                                                       |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                             |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                               |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                    |
| `api.rootDir`            | `string?`                 | Коренева директорія plugin (необов’язково)                                                |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime в пам’яті, якщо доступний)         |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація plugin із `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                          |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня plugin                                                    |

## Угода щодо внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні runtime-експорти
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшена точка входу лише для setup (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих plugins, завантажувані через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), віддають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже запущений. Якщо знімок runtime
ще не існує, вони повертаються до розв’язаної конфігурації на диску.

Plugins provider можуть експонувати вузький локальний barrel контракту plugin, коли
helper навмисно є специфічним для provider і ще не належить до загального підшляху SDK.
Приклади вбудованих plugins:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для helper-ів потоку
  beta-header Claude і `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує builder-и provider,
  helper-и моделей за замовчуванням і builder-и provider реального часу.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder provider
  разом із helper-ами onboarding/config.

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді є спільним, підніміть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість жорсткого зв’язування двох plugins між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Опції `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби runtime" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору назв `api.runtime`.
  </Card>
  <Card title="Налаштування і конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти тестування та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня будова plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель можливостей.
  </Card>
</CardGroup>
