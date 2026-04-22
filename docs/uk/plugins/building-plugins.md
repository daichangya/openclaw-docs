---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен швидкий старт для розробки Plugin-ів
    - Ви додаєте до OpenClaw новий канал, провайдера, інструмент або іншу можливість
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Plugin-ів
x-i18n:
    generated_at: "2026-04-22T07:00:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67368be311537f984f14bea9239b88c3eccf72a76c9dd1347bb041e02697ae24
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Створення Plugin-ів

Plugin-и розширюють OpenClaw новими можливостями: каналами, провайдерами моделей,
мовленням, транскрибуванням у реальному часі, голосом у реальному часі, розумінням медіа, генерацією зображень,
генерацією відео, веб-отриманням, веб-пошуком, інструментами агентів або будь-якою
комбінацією.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку намагається використати ClawHub і
автоматично переходить до npm, якщо це потрібно.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для Plugin-ів у репозиторії: клонований репозиторій і виконаний `pnpm install`

## Який тип Plugin-а?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключає OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додає провайдера моделей (LLM, проксі або власну кінцеву точку)
  </Card>
  <Card title="Plugin інструментів / хуків" icon="wrench">
    Реєструє інструменти агента, хуки подій або сервіси — продовжуйте нижче
  </Card>
</CardGroup>

Якщо Plugin каналу є необов’язковим і може бути не встановлений під час виконання
онбордингу/налаштування, використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Це створює пару адаптера налаштування та майстра,
яка повідомляє про вимогу встановлення та безпечно відхиляє реальні записи конфігурації,
доки Plugin не буде встановлено.

## Швидкий старт: Plugin інструменту

У цьому прикладі створюється мінімальний Plugin, який реєструє інструмент агента. Для Plugin-ів
каналів і провайдерів є окремі посібники за посиланнями вище.

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

    Кожному Plugin-у потрібен маніфест, навіть без конфігурації. Повну схему дивіться в
    [Manifest](/uk/plugins/manifest). Канонічні фрагменти для публікації в ClawHub
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

    `definePluginEntry` призначений для Plugin-ів, що не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Channel Plugins](/uk/plugins/sdk-channel-plugins).
    Повний перелік параметрів точки входу дивіться в [Entry Points](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте та опублікуйте">

    **Зовнішні Plugin-и:** перевірте й опублікуйте в ClawHub, а потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для звичайних специфікацій пакетів, таких як
    `@myorg/openclaw-my-plugin`.

    **Plugin-и в репозиторії:** розмістіть їх у дереві робочого простору вбудованих Plugin-ів — вони будуть виявлені автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin-ів

Один Plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість            | Метод реєстрації                                | Детальний посібник                                                            |
| --------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Текстовий inference (LLM) | `api.registerProvider(...)`                 | [Provider Plugins](/uk/plugins/sdk-provider-plugins)                             |
| Backend CLI для inference | `api.registerCliBackend(...)`               | [CLI Backends](/uk/gateway/cli-backends)                                         |
| Канал / повідомлення  | `api.registerChannel(...)`                      | [Channel Plugins](/uk/plugins/sdk-channel-plugins)                               |
| Мовлення (TTS/STT)    | `api.registerSpeechProvider(...)`               | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрибування в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`       | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики      | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Веб-отримання         | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Веб-пошук             | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Вбудоване розширення Pi | `api.registerEmbeddedExtensionFactory(...)`   | [SDK Overview](/uk/plugins/sdk-overview#registration-api)                        |
| Інструменти агентів   | `api.registerTool(...)`                         | Нижче                                                                         |
| Користувацькі команди | `api.registerCommand(...)`                      | [Entry Points](/uk/plugins/sdk-entrypoints)                                      |
| Хуки подій            | `api.registerHook(...)`                         | [Entry Points](/uk/plugins/sdk-entrypoints)                                      |
| HTTP-маршрути         | `api.registerHttpRoute(...)`                    | [Internals](/uk/plugins/architecture#gateway-http-routes)                        |
| Підкоманди CLI        | `api.registerCli(...)`                          | [Entry Points](/uk/plugins/sdk-entrypoints)                                      |

Повний API реєстрації дивіться в [SDK Overview](/uk/plugins/sdk-overview#registration-api).

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли Plugin-у потрібні
Pi-native хуки embedded-runner, наприклад асинхронне переписування `tool_result` перед тим, як буде надіслано
остаточне повідомлення з результатом інструменту. Віддавайте перевагу звичайним хукам Plugin-ів OpenClaw, якщо
робота не потребує таймінгу розширення Pi.

Якщо ваш Plugin реєструє власні RPC-методи Gateway, використовуйте для них
префікс, специфічний для Plugin-а. Простори імен адміністрування ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими і завжди зіставляються з
`operator.admin`, навіть якщо Plugin запитує вужчу область дії.

Семантика захисту хуків, яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є термінальним результатом і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` вважається відсутністю рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує підтвердження користувача через оверлей exec approval, кнопки Telegram, інтеракції Discord або команду `/approve` в будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним результатом і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` вважається відсутністю рішення.
- `message_sending`: `{ cancel: true }` є термінальним результатом і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` вважається відсутністю рішення.

Команда `/approve` обробляє як підтвердження exec, так і підтвердження Plugin-ів із обмеженим fallback: якщо ідентифікатор підтвердження exec не знайдено, OpenClaw повторно пробує той самий ідентифікатор через підтвердження Plugin-ів. Переспрямування підтверджень Plugin-ів можна налаштувати окремо через `approvals.plugin` у конфігурації.

Якщо користувацькі механізми підтвердження мають виявляти той самий випадок
обмеженого fallback, надавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків завершення строку дії підтвердження.

Докладніше дивіться в [SDK Overview hook decision semantics](/uk/plugins/sdk-overview#hook-decision-semantics).

## Реєстрація інструментів агентів

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або необов’язковими (користувач сам вмикає їх):

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
- Користувачі можуть увімкнути всі інструменти з Plugin-а, додавши ідентифікатор Plugin-а до `tools.allow`

## Правила імпорту

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів дивіться в [SDK Overview](/uk/plugins/sdk-overview).

У межах вашого Plugin-а використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для Plugin-ів провайдерів зберігайте допоміжні засоби, специфічні для провайдера, у цих barrel-файлах
на рівні кореня пакета, якщо лише цей інтерфейс не є справді універсальним. Поточні вбудовані приклади:

- Anthropic: обгортки потоків Claude та допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби моделей за замовчуванням, провайдери реального часу
- OpenRouter: конструктор провайдера плюс допоміжні засоби онбордингу/конфігурації

Якщо допоміжний засіб корисний лише всередині одного вбудованого пакета провайдера, залишайте його на
цьому інтерфейсі кореня пакета замість того, щоб переносити його до `openclaw/plugin-sdk/*`.

Деякі згенеровані інтерфейси допоміжних засобів `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
підтримки й сумісності вбудованих Plugin-ів, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Розглядайте їх як зарезервовані
поверхні, а не як типовий шаблон для нових сторонніх Plugin-ів.

## Контрольний список перед поданням

<Check>У **package.json** вказано правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** присутній і валідний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-import-и через SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugin-ів у репозиторії)</Check>

## Тестування бета-релізів

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw) про анонси релізів.
2. Протестуйте свій Plugin на бета-тезі, щойно він з’явиться. Вікно до стабільного релізу зазвичай триває лише кілька годин.
3. Після тестування напишіть у треді вашого Plugin-а в Discord-каналі `plugin-forum`: `all good` або що саме зламалося. Якщо у вас ще немає треду, створіть його.
4. Якщо щось зламалося, створіть або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і застосуйте мітку `beta-blocker`. Додайте посилання на issue у свій тред.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue і в PR, і у свій Discord-тред. Учасники не можуть додавати мітки до PR, тому назва є сигналом на боці PR для мейнтейнерів та автоматизації. Блокери з PR будуть злиті; блокери без PR можуть усе одно потрапити в реліз. Мейнтейнери стежать за цими тредами під час бета-тестування.
6. Відсутність повідомлень означає, що все гаразд. Якщо ви пропустите це вікно, ваше виправлення, найімовірніше, потрапить до наступного циклу.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник API реєстрації
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, пошук, subagent через api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти й шаблони тестування
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Plugin Architecture](/uk/plugins/architecture) — поглиблений огляд внутрішньої архітектури
- [SDK Overview](/uk/plugins/sdk-overview) — довідник Plugin SDK
- [Manifest](/uk/plugins/manifest) — формат маніфесту plugin-а
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення Plugin-ів каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення Plugin-ів провайдерів
