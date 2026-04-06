---
read_when:
    - Ви хочете створити новий plugin для OpenClaw
    - Вам потрібен швидкий старт для розробки plugin
    - Ви додаєте до OpenClaw новий канал, провайдера, інструмент або іншу можливість
sidebarTitle: Getting Started
summary: Створіть свій перший plugin для OpenClaw за лічені хвилини
title: Розробка Plugins
x-i18n:
    generated_at: "2026-04-06T12:43:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 509c1f5abe1a0a74966054ed79b71a1a7ee637a43b1214c424acfe62ddf48eef
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Розробка Plugins

Plugins розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння
медіа, генерація зображень, генерація відео, web fetch, web search, інструменти
агента або будь-яка комбінація цього.

Вам не потрібно додавати свій plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, а користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку намагається знайти
його в ClawHub, а потім автоматично переходить до npm.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для plugin у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який саме plugin?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або користувацьку кінцеву точку)
  </Card>
  <Card title="Plugin інструмента / hook" icon="wrench">
    Зареєструйте інструменти агента, hooks подій або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Якщо plugin каналу є необов’язковим і може бути не встановлений під час
onboarding/налаштування, використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптер налаштування +
майстер, яка повідомляє про вимогу встановлення й безпечно блокує реальний запис
конфігурації, доки plugin не буде встановлено.

## Швидкий старт: plugin інструмента

У цьому прикладі створюється мінімальний plugin, який реєструє інструмент
агента. Для plugin каналів і провайдерів є окремі посібники за посиланнями
вище.

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

    Кожному plugin потрібен маніфест, навіть без конфігурації. Повну схему див.
    у [Manifest](/uk/plugins/manifest). Канонічні фрагменти для публікації в ClawHub
    містяться в `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` використовується для plugin, які не є каналами. Для
    каналів використовуйте `defineChannelPluginEntry` — див.
    [Channel Plugins](/uk/plugins/sdk-channel-plugins). Повний перелік параметрів
    точки входу див. у [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні plugins:** перевірте й опублікуйте через ClawHub, потім установіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для звичайних специфікацій
    пакетів, таких як `@myorg/openclaw-my-plugin`.

    **Plugins у репозиторії:** розміщуйте їх у дереві робочого простору bundled plugin — вони виявляються автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості plugin

Один plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість             | Метод реєстрації                               | Детальний посібник                                                              |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Текстовий inference (LLM) | `api.registerProvider(...)`                 | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                               |
| Бекенд CLI inference   | `api.registerCliBackend(...)`                  | [CLI Backends](/gateway/cli-backends)                                           |
| Канал / обмін повідомленнями | `api.registerChannel(...)`              | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                                 |
| Мовлення (TTS/STT)     | `api.registerSpeechProvider(...)`              | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа        | `api.registerMediaUnderstandingProvider(...)`  | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень    | `api.registerImageGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики       | `api.registerMusicGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео        | `api.registerVideoGenerationProvider(...)`     | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`            | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`           | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Інструменти агента     | `api.registerTool(...)`                        | Нижче                                                                           |
| Користувацькі команди  | `api.registerCommand(...)`                     | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| Hooks подій            | `api.registerHook(...)`                        | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути          | `api.registerHttpRoute(...)`                   | [Internals](/uk/plugins/architecture#gateway-http-routes)                          |
| Підкоманди CLI         | `api.registerCli(...)`                         | [Entry Points](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. у [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Якщо ваш plugin реєструє користувацькі методи gateway RPC, залишайте їх у
префіксі, специфічному для plugin. Простори імен адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди
зіставляються з `operator.admin`, навіть якщо plugin запитує вужчу область
доступу.

Варто пам’ятати про семантику захисту hooks:

- `before_tool_call`: `{ block: true }` є термінальним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` розглядається як відсутність рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує схвалення користувача через накладку схвалення exec, кнопки Telegram, інтеракції Discord або команду `/approve` на будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним рішенням і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` розглядається як відсутність рішення.
- `message_sending`: `{ cancel: true }` є термінальним рішенням і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` розглядається як відсутність рішення.

Команда `/approve` обробляє і схвалення exec, і схвалення plugin із обмеженим
fallback: коли ідентифікатор схвалення exec не знайдено, OpenClaw повторно
пробує той самий ідентифікатор через схвалення plugin. Переспрямування
схвалення plugin можна налаштувати окремо через `approvals.plugin` у конфігурації.

Якщо користувацька логіка схвалення має виявляти цей самий випадок обмеженого
fallback, використовуйте `isApprovalNotFoundError` з
`openclaw/plugin-sdk/error-runtime` замість ручного зіставлення рядків
про завершення строку дії схвалення.

Докладніше див. у [SDK Overview hook decision semantics](/uk/plugins/sdk-overview#hook-decision-semantics).

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути
обов’язковими (завжди доступними) або необов’язковими (користувач вмикає їх за
бажанням):

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
- Користувачі можуть увімкнути всі інструменти plugin, додавши ідентифікатор plugin до `tools.allow`

## Правила імпорту

Завжди імпортуйте з вузькоспрямованих шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. у [SDK Overview](/uk/plugins/sdk-overview).

У межах вашого plugin використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний plugin через його шлях SDK.

Для plugin провайдерів зберігайте допоміжні функції, специфічні для провайдера,
у цих barrel-файлах на рівні кореня пакета, якщо лише цей шов не є справді
загальним. Поточні bundled-приклади:

- Anthropic: обгортки потоків Claude і допоміжні функції `service_tier` / beta
- OpenAI: збирачі провайдерів, допоміжні функції моделей за замовчуванням, провайдери realtime
- OpenRouter: збирач провайдера плюс допоміжні функції onboarding/конфігурації

Якщо допоміжна функція корисна лише в межах одного bundled-пакета провайдера,
залишайте її на цьому шві рівня кореня пакета замість того, щоб переносити її в
`openclaw/plugin-sdk/*`.

Деякі згенеровані шви допоміжних функцій `openclaw/plugin-sdk/<bundled-id>` усе
ще існують для підтримки й сумісності bundled-plugin, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Сприймайте їх як
зарезервовані поверхні, а не як типовий шаблон для нових сторонніх plugins.

## Контрольний список перед надсиланням

<Check>**package.json** містить правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують вузькоспрямовані шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-imports через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для plugin у репозиторії)</Check>

## Тестування бета-релізів

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw) для оголошень про релізи.
2. Протестуйте свій plugin на бета-тезі щойно він з’явиться. Вікно до стабільного релізу зазвичай становить лише кілька годин.
3. Після тестування напишіть у гілці свого plugin в Discord-каналі `plugin-forum`: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, створіть або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue і в PR, і у свою Discord-гілку. Учасники не можуть ставити мітки PR, тому назва є сигналом на боці PR для мейнтейнерів та автоматизації. Blockers із PR зливаються; blockers без PR можуть вийти в реліз попри це. Мейнтейнери стежать за цими гілками під час бета-тестування.
6. Відсутність повідомлень означає, що все добре. Якщо ви пропустите це вікно, ваш виправлення, імовірно, потрапить до наступного циклу.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть plugin каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть plugin провайдера моделей
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Довідник карти імпортів і API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, підлеглий агент через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти та шаблони тестування
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура plugin](/uk/plugins/architecture) — поглиблений розбір внутрішньої архітектури
- [SDK Overview](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Manifest](/uk/plugins/manifest) — формат маніфесту plugin
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — розробка plugin каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — розробка plugin провайдерів
