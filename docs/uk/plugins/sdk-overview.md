---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпортів, довідник API реєстрації та архітектура SDK
title: Огляд SDK Plugin-ів
x-i18n:
    generated_at: "2026-04-24T19:52:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 791b22f4753094ab1e0d26fb4d471cd400e9a34be699736fb96646d9e620d3cb
    source_path: plugins/sdk-overview.md
    workflow: 15
---

SDK Plugin-ів — це типізований контракт між Plugin-ами та ядром. Ця сторінка —
довідник про **що імпортувати** і **що можна реєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший Plugin? Почніть із [Створення Plugin-ів](/uk/plugins/building-plugins).
- Plugin каналу? Див. [Plugin-и каналів](/uk/plugins/sdk-channel-plugins).
- Plugin провайдера? Див. [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins).
- Plugin інструмента або hook життєвого циклу? Див. [Hook-и Plugin-а](/uk/plugins/hooks).
  </Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу допоміжних засобів точки входу/збирання
віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої umbrella-поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

<Warning>
  Не імпортуйте з брендованих зручних seam-ів провайдерів або каналів (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Bundled Plugin-и поєднують загальні підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні barrel-файли Plugin-ів,
  або додавати вузький загальний контракт SDK, коли потреба справді є
  міжканальною.

Невеликий набір helper seam-ів bundled Plugin-ів (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще з’являється в
згенерованій карті експортів. Вони існують лише для підтримки bundled Plugin-ів і
не рекомендовані як шляхи імпорту для нових сторонніх Plugin-ів.
</Warning>

## Довідник підшляхів

SDK Plugin-ів надається як набір вузьких підшляхів, згрупованих за напрямами (Plugin
entry, channel, provider, auth, runtime, capability, memory і зарезервовані
helper-и bundled Plugin-ів). Повний каталог — зі групуванням і посиланнями — див. у
[Підшляхи SDK Plugin-ів](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься у `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                           | Що він реєструє                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)                  |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний CLI-бекенд inference           |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями                     |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі      |
| `api.registerRealtimeVoiceProvider(...)`         | Двосторонні голосові сесії в реальному часі        |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео            |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                      |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                      |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape           |
| `api.registerWebSearchProvider(...)`             | Web search                            |

### Інструменти й команди

| Метод                          | Що він реєструє                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Кастомна команда (обходить LLM)             |

### Інфраструктура

| Метод                                          | Що він реєструє                       |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook події                              |
| `api.registerHttpRoute(params)`                 | HTTP-кінцева точка Gateway                   |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)`  | Рекламування виявлення локального Gateway      |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                          |
| `api.registerService(service)`                  | Фонова служба                      |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний обробник                     |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware результатів інструмента harness          |
| `api.registerEmbeddedExtensionFactory(factory)` | Застаріла фабрика розширень Pi         |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивна секція prompt, суміжна з пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний корпус пошуку/читання пам’яті      |

<Note>
  Зарезервовані простори назв адміністратора ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо Plugin намагається призначити
  вужчу область методу Gateway. Для методів, що належать Plugin-у, віддавайте перевагу
  префіксам, специфічним для Plugin-а.
</Note>

<Accordion title="Коли використовувати middleware результатів інструмента">
  Використовуйте `api.registerAgentToolResultMiddleware(...)`, коли Plugin-у потрібно
  переписати результат інструмента після виконання і до того, як harness передасть цей
  результат назад у модель. Це нейтральний до harness seam для асинхронних
  редукторів виводу, таких як tokenjuice.

Plugin-и мають оголошувати `contracts.agentToolResultMiddleware` для кожного цільового
harness, наприклад `["pi", "codex-app-server"]`. Для роботи, якій не потрібен час результату інструмента до моделі,
залишайте звичайні hook-и Plugin-ів OpenClaw.
</Accordion>

<Accordion title="Застарілі фабрики розширень Pi">
  `api.registerEmbeddedExtensionFactory(...)` є застарілим. Він залишається
  сумісним seam для bundled Plugin-ів, яким усе ще потрібні прямі події
  вбудованого виконання Pi. Нові трансформації результатів інструментів мають
  натомість використовувати `api.registerAgentToolResultMiddleware(...)`.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дозволяє Plugin-у рекламувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає сервіс
під час запуску Gateway, коли локальне виявлення ввімкнено, передає поточні
порти Gateway і не секретні дані-підказки TXT, а також викликає повернений
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

Plugin-и виявлення Gateway не повинні трактувати рекламовані значення TXT як секрети або
автентифікацію. Виявлення — це підказка для маршрутизації; довіра все ще належить автентифікації Gateway і pinning TLS.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд часу парсингу, які використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI Plugin-а

Якщо ви хочете, щоб команда Plugin-а залишалася ліниво завантажуваною в звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що надається цим
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, якщо вам не потрібна лінива реєстрація кореневого CLI.
Цей сумісний eager-шлях усе ще підтримується, але він не встановлює
placeholder-и на основі дескрипторів для лінивого завантаження під час парсингу.

### Реєстрація CLI-бекенда

`api.registerCliBackend(...)` дозволяє Plugin-у володіти типовою конфігурацією для локального
AI CLI-бекенда, такого як `codex-cli`.

- `id` бекенда стає префіксом провайдера в посиланнях на моделі на кшталт `codex-cli/gpt-5`.
- `config` бекенда використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має перевагу. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типового значення Plugin-а перед запуском CLI.
- Використовуйте `normalizeConfig`, коли бекенду потрібні сумісні переписування після об’єднання
  (наприклад, нормалізація старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що він реєструє                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Механізм контексту (одночасно активний лише один). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб механізм міг адаптувати доповнення prompt. |
| `api.registerMemoryCapability(capability)` | Уніфіковану можливість пам’яті                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Генератор секції prompt для пам’яті                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання пам’яті                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Адаптер середовища виконання пам’яті                                                                                                                                    |

### Адаптери embedding-ів пам’яті

| Метод                                         | Що він реєструє                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding-ів пам’яті для активного Plugin-а |

- `registerMemoryCapability` — це бажаний API ексклюзивного Plugin-а пам’яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб допоміжні Plugin-и могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватного макета
  конкретного Plugin-а пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні із застарілими версіями API ексклюзивного Plugin-а пам’яті.
- `registerMemoryEmbeddingProvider` дозволяє активному Plugin-у пам’яті реєструвати один
  або кілька id адаптерів embedding-ів (наприклад, `openai`, `gemini` або кастомний id, визначений Plugin-ом).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих id
  адаптерів.

### Події та життєвий цикл

| Метод                                       | Що він робить                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований hook життєвого циклу          |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

Див. [Hook-и Plugin-а](/uk/plugins/hooks), щоб переглянути приклади, поширені назви hook-ів і
семантику guard.

### Семантика рішень hook-ів

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере на себе dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як пропуск `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідних потоків/тем. `metadata` залишайте для додаткових даних, специфічних для каналу.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до `metadata`, специфічних для каналу.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні hook-и `gateway:startup`.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                          |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id Plugin-а                                                                                   |
| `api.name`               | `string`                  | Ім’я для відображення                                                                         |
| `api.version`            | `string?`                 | Версія Plugin-а (необов’язково)                                                               |
| `api.description`        | `string?`                 | Опис Plugin-а (необов’язково)                                                                 |
| `api.source`             | `string`                  | Шлях до джерела Plugin-а                                                                      |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin-а (необов’язково)                                                    |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок середовища виконання в пам’яті, якщо доступний) |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація Plugin-а з `plugins.entries.<id>.config`                                         |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби середовища виконання](/uk/plugins/sdk-runtime)                                 |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного входу |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня Plugin-а                                                      |

## Угода щодо внутрішніх модулів

Усередині вашого Plugin-а використовуйте локальні barrel-файли для внутрішніх імпортів:

```text
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти середовища виконання
  index.ts          # Точка входу Plugin-а
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний Plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні bundled Plugin-ів, завантажених через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні файли входу), віддають перевагу
активному знімку конфігурації середовища виконання, коли OpenClaw уже працює. Якщо знімок середовища виконання
ще не існує, вони повертаються до розв’язаного файлу конфігурації на диску.

Plugin-и провайдерів можуть надавати вузький barrel локального контракту Plugin-а, коли
допоміжний засіб навмисно є специфічним для провайдера і ще не належить до загального підшляху SDK.
Bundled приклади:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  з beta-header і допоміжними засобами потоку `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує конструктори провайдерів,
  допоміжні засоби моделей за замовчуванням і конструктори провайдерів реального часу.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує конструктор провайдера
  плюс допоміжні засоби onboarding/конфігурації.

<Warning>
  Production-код розширень також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, перенесіть його до нейтрального підшляху SDK,
  наприклад `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливість, замість того щоб жорстко пов’язувати два Plugin-и.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору назв `api.runtime`.
  </Card>
  <Card title="Налаштування і конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести й схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти тестування та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня архітектура Plugin-ів" icon="diagram-project" href="/uk/plugins/architecture">
    Детальна архітектура та модель можливостей.
  </Card>
</CardGroup>
