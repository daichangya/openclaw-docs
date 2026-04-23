---
read_when:
    - Ви хочете створити новий Plugin OpenClaw
    - Вам потрібен короткий посібник зі старту для розробки Plugin
    - Ви додаєте новий канал, провайдера, інструмент або іншу capability до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin OpenClaw за кілька хвилин
title: Створення Plugin
x-i18n:
    generated_at: "2026-04-23T23:02:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90c2413c9c011c89f1e50e12e1a1ee4cca8207234827897b423cf421244203ce
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрибування в реальному часі, голос у реальному часі, розуміння медіа, генерацію зображень,
генерацію відео, web fetch, вебпошук, інструменти агента або будь-яку
комбінацію з цього.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, а користувачі встановлять його через
`openclaw plugins install <package-name>`. OpenClaw спочатку пробує ClawHub, а
потім автоматично переходить до npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для Plugin у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який тип Plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, proxy або власний endpoint)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench">
    Зареєструйте інструменти агента, event hooks або сервіси — продовження нижче
  </Card>
</CardGroup>

Для channel plugin, який не гарантовано буде встановлений під час виконання onboarding/setup,
використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера setup + wizard,
яка повідомляє про вимогу встановлення і працює у fail-closed режимі для реальних записів конфігурації,
доки Plugin не буде встановлено.

## Швидкий старт: tool plugin

Цей приклад створює мінімальний Plugin, який реєструє інструмент агента. Для channel
і provider plugin є окремі посібники, посилання на які наведено вище.

<Steps>
  <Step title="Створіть пакет і manifest">
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

    Кожному Plugin потрібен manifest, навіть якщо конфігурації немає. Повну схему див. у
    [Manifest](/uk/plugins/manifest). Канонічні фрагменти для публікації в ClawHub
    розміщено в `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Напишіть entry point">

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

    `definePluginEntry` призначено для Plugin, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повний список параметрів entry point див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugin:** виконайте валідацію й публікацію через ClawHub, а потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub раніше за npm для звичайних специфікацій пакетів,
    таких як `@myorg/openclaw-my-plugin`.

    **Plugin у репозиторії:** розміщуйте в дереві робочого простору bundled plugin — вони виявляються автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin

Один Plugin може реєструвати будь-яку кількість можливостей через об’єкт `api`:

| Capability             | Метод реєстрації                               | Детальний посібник                                                                |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Текстовий inference (LLM) | `api.registerProvider(...)`                 | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                                 |
| Бекенд CLI inference   | `api.registerCliBackend(...)`                  | [CLI Backends](/uk/gateway/cli-backends)                                             |
| Канал / обмін повідомленнями | `api.registerChannel(...)`              | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                   |
| Мовлення (TTS/STT)     | `api.registerSpeechProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Транскрибування в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`  | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Web fetch              | `api.registerWebFetchProvider(...)`            | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Вебпошук               | `api.registerWebSearchProvider(...)`           | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Вбудоване розширення Pi | `api.registerEmbeddedExtensionFactory(...)`   | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                               |
| Інструменти агента     | `api.registerTool(...)`                        | Нижче                                                                             |
| Власні команди         | `api.registerCommand(...)`                     | [Entry Points](/uk/plugins/sdk-entrypoints)                                          |
| Event hooks            | `api.registerHook(...)`                        | [Entry Points](/uk/plugins/sdk-entrypoints)                                          |
| HTTP-маршрути          | `api.registerHttpRoute(...)`                   | [Внутрішня архітектура](/uk/plugins/architecture#gateway-http-routes)                |
| Підкоманди CLI         | `api.registerCli(...)`                         | [Entry Points](/uk/plugins/sdk-entrypoints)                                          |

Повний API реєстрації див. у [Огляд SDK](/uk/plugins/sdk-overview#registration-api).

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли Plugin потрібні
вбудовані хуки runner, специфічні для Pi, наприклад асинхронне переписування `tool_result`
до того, як буде надіслано фінальне повідомлення з результатом інструмента. Віддавайте перевагу звичайним hook Plugin OpenClaw, якщо
робота не потребує таймінгу розширення Pi.

Якщо ваш Plugin реєструє власні методи gateway RPC, використовуйте
префікс, специфічний для Plugin. Простори імен core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди зіставляються з
`operator.admin`, навіть якщо Plugin запитує вужчий scope.

Семантика guard для hooks, про яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` трактується як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через overlay схвалення exec, кнопки Telegram, interactions Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` трактується як відсутність рішення.
- `message_sending`: `{ cancel: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` трактується як відсутність рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних thread/topic. `metadata` залишайте для доповнень, специфічних для каналу.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє як схвалення exec, так і Plugin, із обмеженим резервним перемиканням: коли id схвалення exec не знайдено, OpenClaw повторно пробує той самий id через схвалення Plugin. Переспрямування схвалень Plugin можна налаштовувати окремо через `approvals.plugin` у конфігурації.

Якщо власній логіці схвалення потрібно виявляти той самий випадок
обмеженого резервного перемикання, використовуйте
`isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків про завершення строку дії схвалення.

Деталі див. у [Семантика рішень hook в огляді SDK](/uk/plugins/sdk-overview#hook-decision-semantics).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або необов’язковими (за згодою користувача):

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

- Назви інструментів не повинні конфліктувати з інструментами core (конфліктні пропускаються)
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з Plugin, додавши id Plugin до `tools.allow`

## Угоди щодо імпортів

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник за subpath див. у [Огляд SDK](/uk/plugins/sdk-overview).

У межах вашого Plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для provider plugin зберігайте допоміжні засоби, специфічні для провайдера, у цих barrel-файлах
кореня пакета, якщо лише цей seam не є справді загальним. Поточні bundled-приклади:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: побудовники провайдерів, допоміжні засоби стандартних моделей, провайдери реального часу
- OpenRouter: побудовник провайдера плюс допоміжні засоби onboarding/config

Якщо допоміжний засіб корисний лише в межах одного bundled-пакета провайдера, залишайте його на цьому
seam кореня пакета замість перенесення в `openclaw/plugin-sdk/*`.

Деякі згенеровані допоміжні seam `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
підтримки bundled-plugin і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Ставтеся до них як до зарезервованих
поверхонь, а не як до стандартного шаблону для нових сторонніх Plugin.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** наявний і валідний</Check>
<Check>Entry point використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-import через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить успішно (для Plugin у репозиторії)</Check>

## Тестування бета-релізів

1. Слідкуйте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw) для анонсів релізів.
2. Тестуйте свій Plugin проти бета-тега щойно він з’явиться. Вікно до stable зазвичай становить лише кілька годин.
3. Після тестування напишіть у треді вашого Plugin у каналі Discord `plugin-forum`, указавши або `all good`, або що саме зламалося. Якщо у вас ще немає треда, створіть його.
4. Якщо щось зламалося, відкрийте або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свій тред.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue як у PR, так і у своєму треді Discord. Учасники не можуть ставити мітки на PR, тому назва є сигналом на стороні PR для мейнтейнерів і автоматизації. Блокери з PR зливаються; блокери без нього все одно можуть увійти в реліз. Мейнтейнери стежать за цими тредами під час бета-тестування.
6. Тиша означає, що все добре. Якщо ви пропустите це вікно, ваше виправлення, імовірно, увійде вже в наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Мапа імпортів і довідник API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник зі схеми manifest
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin](/uk/plugins/architecture) — глибоке занурення у внутрішню архітектуру
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Manifest](/uk/plugins/manifest) — формат manifest Plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugin
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugin
