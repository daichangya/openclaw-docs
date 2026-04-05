---
read_when:
    - Ви хочете створити новий плагін OpenClaw
    - Вам потрібен швидкий старт для розробки плагінів
    - Ви додаєте до OpenClaw новий канал, провайдера, інструмент або іншу можливість
sidebarTitle: Getting Started
summary: Створіть свій перший плагін OpenClaw за лічені хвилини
title: Building Plugins
x-i18n:
    generated_at: "2026-04-05T18:12:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 677da2cfba6706bd502fc055169072eb82d2d3baa5a78f28eb520f821caa3773
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Building Plugins

Плагіни розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрибування в реальному часі, голос у реальному часі, розуміння медіа, генерація зображень,
генерація відео, отримання вебданих, вебпошук, інструменти агента або будь-яка
комбінація.

Вам не потрібно додавати свій плагін до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/tools/clawhub) або npm, а користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку намагається використати ClawHub, а
потім автоматично переходить до npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для плагінів у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який тип плагіна?

<CardGroup cols={3}>
  <Card title="Плагін каналу" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Плагін провайдера" icon="cpu" href="/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або власну кінцеву точку)
  </Card>
  <Card title="Плагін інструмента / хука" icon="wrench">
    Зареєструйте інструменти агента, хуки подій або сервіси — продовження нижче
  </Card>
</CardGroup>

Якщо плагін каналу є необов’язковим і може бути не встановлений під час запуску
онбордингу/налаштування, використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптер + майстер
налаштування, яка повідомляє про вимогу встановлення та безпечно блокує реальні записи конфігурації,
доки плагін не буде встановлено.

## Швидкий старт: плагін інструмента

У цьому прикладі створюється мінімальний плагін, який реєструє інструмент агента. Для каналів
і плагінів провайдерів є окремі посібники, посилання на які наведено вище.

<Steps>
  <Step title="Створіть пакет і маніфест">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Кожному плагіну потрібен маніфест, навіть без конфігурації. Повну схему див. у
    [Manifest](/plugins/manifest). Канонічні фрагменти публікації в ClawHub
    розміщені в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Напишіть точку входу">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` призначено для плагінів, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/plugins/sdk-channel-plugins).
    Повний список параметрів точки входу див. у [Entry Points](/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні плагіни:** перевірте та опублікуйте через ClawHub, а потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів, таких як
    `@myorg/openclaw-my-plugin`.

    **Плагіни в репозиторії:** розміщуйте у дереві workspace bundled plugin — вони виявляються автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості плагінів

Один плагін може реєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість            | Метод реєстрації                                | Докладний посібник                                                              |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Текстова інференція (LLM) | `api.registerProvider(...)`                  | [Provider Plugins](/plugins/sdk-provider-plugins)                               |
| Канал / обмін повідомленнями | `api.registerChannel(...)`               | [Channel Plugins](/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)    | `api.registerSpeechProvider(...)`               | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрибування в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`       | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Отримання вебданих    | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вебпошук              | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Інструменти агента    | `api.registerTool(...)`                         | Нижче                                                                           |
| Власні команди        | `api.registerCommand(...)`                      | [Entry Points](/plugins/sdk-entrypoints)                                        |
| Хуки подій            | `api.registerHook(...)`                         | [Entry Points](/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути         | `api.registerHttpRoute(...)`                    | [Internals](/plugins/architecture#gateway-http-routes)                          |
| Підкоманди CLI        | `api.registerCli(...)`                          | [Entry Points](/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. у [SDK Overview](/plugins/sdk-overview#registration-api).

Якщо ваш плагін реєструє власні методи gateway RPC, використовуйте для них
префікс, специфічний для плагіна. Простори імен адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди відповідають
`operator.admin`, навіть якщо плагін просить вужчу область дії.

Семантика захисних рішень для хуків, про яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є термінальним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` вважається відсутністю рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через накладку підтвердження виконання, кнопки Telegram, інтеракції Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` вважається відсутністю рішення.
- `message_sending`: `{ cancel: true }` є термінальним рішенням і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` вважається відсутністю рішення.

Команда `/approve` обробляє як підтвердження виконання, так і підтвердження плагінів із
обмеженим резервним сценарієм: якщо ідентифікатор підтвердження виконання не знайдено, OpenClaw повторно
пробує той самий ідентифікатор через підтвердження плагінів. Переспрямування підтверджень плагінів можна
налаштовувати окремо через `approvals.plugin` у конфігурації.

Якщо для власної логіки підтвердження потрібно виявляти той самий випадок
обмеженого резервного сценарію, використовуйте
`isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про завершення строку підтвердження.

Подробиці див. у [SDK Overview hook decision semantics](/plugins/sdk-overview#hook-decision-semantics).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або необов’язковими (користувач вмикає їх сам):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Користувачі вмикають необов’язкові інструменти в конфігурації:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Назви інструментів не повинні конфліктувати з інструментами ядра (конфлікти пропускаються)
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з плагіна, додавши ідентифікатор плагіна до `tools.allow`

## Угоди щодо імпорту

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник щодо підшляхів див. у [SDK Overview](/plugins/sdk-overview).

Усередині свого плагіна використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний плагін через його шлях SDK.

Для плагінів провайдерів зберігайте специфічні для провайдера допоміжні функції в цих barrel-файлах
у корені пакета, якщо лише цей інтерфейс справді не є універсальним. Поточні bundled-приклади:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби моделей за замовчуванням, провайдери realtime
- OpenRouter: конструктор провайдера та допоміжні засоби онбордингу/конфігурації

Якщо допоміжна функція корисна лише в межах одного bundled-пакета провайдера, залишайте її на цьому
інтерфейсі в корені пакета замість того, щоб переносити її до `openclaw/plugin-sdk/*`.

Деякі згенеровані інтерфейси допоміжних засобів `openclaw/plugin-sdk/<bundled-id>` все ще існують для
підтримки bundled-плагінів і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Розглядайте їх як зарезервовані
поверхні, а не як типовий шаблон для нових сторонніх плагінів.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і коректний</Check>
<Check>У точці входу використовується `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не самоімпорти через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для плагінів у репозиторії)</Check>

## Тестування бета-релізів

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Також можна ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw) для оголошень про релізи.
2. Протестуйте свій плагін із бета-тегом щойно він з’явиться. Вікно до стабільного релізу зазвичай триває лише кілька годин.
3. Після тестування напишіть у гілці свого плагіна в Discord-каналі `plugin-forum` або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і додайте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` із назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у свою гілку Discord. Учасники не можуть ставити мітки PR, тому заголовок є сигналом на боці PR для мейнтейнерів і автоматизації. Блокери з PR будуть злиті; блокери без нього все одно можуть потрапити до релізу. Мейнтейнери стежать за цими гілками під час бета-тестування.
6. Відсутність повідомлень означає, що все гаразд. Якщо ви пропустите це вікно, ваше виправлення, імовірно, потрапить до наступного циклу.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Створіть плагін каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/plugins/sdk-provider-plugins">
    Створіть плагін провайдера моделей
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/plugins/sdk-overview">
    Довідник карти імпортів і API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/plugins/sdk-runtime">
    TTS, пошук, субагент через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/plugins/manifest">
    Повний довідник зі схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Plugin Architecture](/plugins/architecture) — глибокий огляд внутрішньої архітектури
- [SDK Overview](/plugins/sdk-overview) — довідник Plugin SDK
- [Manifest](/plugins/manifest) — формат маніфесту плагіна
- [Channel Plugins](/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Provider Plugins](/plugins/sdk-provider-plugins) — створення плагінів провайдерів
