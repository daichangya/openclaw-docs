---
read_when:
    - Ви хочете створити новий Plugin для OpenClaw
    - Вам потрібен швидкий старт для розробки Plugin-ів
    - Ви додаєте новий канал, провайдера, інструмент або іншу можливість до OpenClaw
sidebarTitle: Getting Started
summary: Створіть свій перший Plugin для OpenClaw за лічені хвилини
title: Створення Plugin-ів
x-i18n:
    generated_at: "2026-04-24T19:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5990f94cb404820f731070eb7454da26b160b3be56626476a062e4668cd9de6b
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin-і розширюють OpenClaw новими можливостями: канали, провайдери моделей,
мовлення, транскрипція в реальному часі, голос у реальному часі, розуміння медіа, генерація
зображень, генерація відео, web fetch, web search, інструменти агента або будь-яка
комбінація.

Вам не потрібно додавати свій Plugin до репозиторію OpenClaw. Опублікуйте його в
[ClawHub](/uk/tools/clawhub) або npm, і користувачі встановлять його за допомогою
`openclaw plugins install <package-name>`. OpenClaw спочатку намагається використати ClawHub і
автоматично переходить до npm, якщо це потрібно.

## Передумови

- Node >= 22 і менеджер пакетів (npm або pnpm)
- Знайомство з TypeScript (ESM)
- Для Plugin-ів у репозиторії: репозиторій клоновано й виконано `pnpm install`

## Який тип Plugin-а?

<CardGroup cols={3}>
  <Card title="Plugin каналу" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Підключіть OpenClaw до платформи обміну повідомленнями (Discord, IRC тощо)
  </Card>
  <Card title="Plugin провайдера" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Додайте провайдера моделей (LLM, проксі або кастомну кінцеву точку)
  </Card>
  <Card title="Plugin інструмента / hook" icon="wrench" href="/uk/plugins/hooks">
    Зареєструйте інструменти агента, hook-и подій або сервіси — продовження нижче
  </Card>
</CardGroup>

Для Plugin-а каналу, який не гарантовано буде встановлено під час запуску
налаштування/onboarding, використовуйте `createOptionalChannelSetupSurface(...)` з
`openclaw/plugin-sdk/channel-setup`. Він створює пару адаптера налаштування + майстра,
яка повідомляє про вимогу встановлення і завершується в закритому режимі під час реальних записів конфігурації,
доки Plugin не буде встановлено.

## Швидкий старт: Plugin інструмента

У цьому прикладі створюється мінімальний Plugin, який реєструє інструмент агента. Для Plugin-ів каналів
і провайдерів є окремі посібники, посилання на які наведено вище.

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

    Кожному Plugin-у потрібен маніфест, навіть без конфігурації. Повну схему див. у
    [Маніфест](/uk/plugins/manifest). Канонічні фрагменти для публікації в ClawHub
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

    `definePluginEntry` призначено для Plugin-ів, які не є каналами. Для каналів використовуйте
    `defineChannelPluginEntry` — див. [Plugin-и каналів](/uk/plugins/sdk-channel-plugins).
    Повний перелік параметрів точки входу див. у [Точки входу](/uk/plugins/sdk-entrypoints).

  </Step>

  <Step title="Протестуйте й опублікуйте">

    **Зовнішні Plugin-и:** виконайте перевірку й опублікуйте через ClawHub, а потім встановіть:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw також перевіряє ClawHub перед npm для простих специфікацій пакетів на кшталт
    `@myorg/openclaw-my-plugin`.

    **Plugin-и в репозиторії:** розмістіть їх у дереві робочого простору bundled Plugin-ів — вони виявляються автоматично.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Можливості Plugin-а

Один Plugin може зареєструвати будь-яку кількість можливостей через об’єкт `api`:

| Можливість            | Метод реєстрації                               | Детальний посібник                                                             |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| Текстовий inference (LLM) | `api.registerProvider(...)`                 | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins)                          |
| Бекенд inference CLI  | `api.registerCliBackend(...)`                  | [Бекенди CLI](/uk/gateway/cli-backends)                                           |
| Канал / обмін повідомленнями | `api.registerChannel(...)`              | [Plugin-и каналів](/uk/plugins/sdk-channel-plugins)                               |
| Мовлення (TTS/STT)    | `api.registerSpeechProvider(...)`              | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Транскрипція в реальному часі | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Голос у реальному часі | `api.registerRealtimeVoiceProvider(...)`      | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Розуміння медіа       | `api.registerMediaUnderstandingProvider(...)`  | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація зображень   | `api.registerImageGenerationProvider(...)`     | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація музики      | `api.registerMusicGenerationProvider(...)`     | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Генерація відео       | `api.registerVideoGenerationProvider(...)`     | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch             | `api.registerWebFetchProvider(...)`            | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search            | `api.registerWebSearchProvider(...)`           | [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware результатів інструментів | `api.registerAgentToolResultMiddleware(...)` | [Огляд SDK](/uk/plugins/sdk-overview#registration-api)                    |
| Інструменти агента    | `api.registerTool(...)`                        | Нижче                                                                          |
| Кастомні команди      | `api.registerCommand(...)`                     | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| Hook-и Plugin-а       | `api.on(...)`                                  | [Hook-и Plugin-а](/uk/plugins/hooks)                                              |
| Внутрішні hook-и подій | `api.registerHook(...)`                       | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |
| HTTP-маршрути         | `api.registerHttpRoute(...)`                   | [Внутрішня архітектура](/uk/plugins/architecture-internals#gateway-http-routes)   |
| Підкоманди CLI        | `api.registerCli(...)`                         | [Точки входу](/uk/plugins/sdk-entrypoints)                                        |

Повний API реєстрації див. у [Огляд SDK](/uk/plugins/sdk-overview#registration-api).

Використовуйте `api.registerAgentToolResultMiddleware(...)`, коли Plugin-у потрібне асинхронне
переписування результату інструмента до того, як модель побачить вивід. Оголошуйте цільові
harness-и в `contracts.agentToolResultMiddleware`, наприклад
`["pi", "codex-app-server"]`. Віддавайте перевагу звичайним hook-ам Plugin-ів OpenClaw, якщо
робота не потребує часу результату інструмента до моделі.

Якщо ваш Plugin реєструє кастомні RPC-методи Gateway, зберігайте їх у
префіксі, специфічному для Plugin-а. Простори назв адміністратора ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються зарезервованими й завжди прив’язуються до
`operator.admin`, навіть якщо Plugin запитує вужчу область.

Семантика guard hook-ів, яку варто пам’ятати:

- `before_tool_call`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_tool_call`: `{ block: false }` вважається відсутністю рішення.
- `before_tool_call`: `{ requireApproval: true }` призупиняє виконання агента й запитує в користувача схвалення через оверлей схвалення exec, кнопки Telegram, взаємодії Discord або команду `/approve` у будь-якому каналі.
- `before_install`: `{ block: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `before_install`: `{ block: false }` вважається відсутністю рішення.
- `message_sending`: `{ cancel: true }` є термінальним і зупиняє обробники з нижчим пріоритетом.
- `message_sending`: `{ cancel: false }` вважається відсутністю рішення.
- `message_received`: віддавайте перевагу типізованому полю `threadId`, коли потрібна маршрутизація вхідних потоків/тем. `metadata` залишайте для додаткових даних, специфічних для каналу.
- `message_sending`: віддавайте перевагу типізованим полям маршрутизації `replyToId` / `threadId` замість ключів metadata, специфічних для каналу.

Команда `/approve` обробляє як exec, так і схвалення Plugin-ів з обмеженим fallback: коли id схвалення exec не знайдено, OpenClaw повторно пробує той самий id через схвалення Plugin-ів. Переспрямування схвалення Plugin-ів можна налаштувати окремо через `approvals.plugin` у конфігурації.

Якщо кастомна логіка схвалення має виявляти той самий випадок обмеженого fallback,
віддавайте перевагу `isApprovalNotFoundError` з `openclaw/plugin-sdk/error-runtime`
замість ручного зіставлення рядків завершення строку дії схвалення.

Див. [Hook-и Plugin-а](/uk/plugins/hooks), щоб переглянути приклади та довідник hook-ів.

## Реєстрація інструментів агента

Інструменти — це типізовані функції, які може викликати LLM. Вони можуть бути обов’язковими (завжди
доступними) або необов’язковими (користувач вмикає їх за бажанням):

```typescript
register(api) {
  // Обов’язковий інструмент — завжди доступний
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Необов’язковий інструмент — користувач має додати його до allowlist
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

- Назви інструментів не мають конфліктувати з інструментами ядра (конфлікти пропускаються)
- Використовуйте `optional: true` для інструментів із побічними ефектами або додатковими вимогами до бінарних файлів
- Користувачі можуть увімкнути всі інструменти з Plugin-а, додавши id Plugin-а до `tools.allow`

## Угоди щодо імпорту

Завжди імпортуйте з цільових шляхів `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Неправильно: монолітний корінь (застаріло, буде видалено)
import { ... } from "openclaw/plugin-sdk";
```

Повний довідник підшляхів див. у [Огляд SDK](/uk/plugins/sdk-overview).

У межах вашого Plugin-а використовуйте локальні barrel-файли (`api.ts`, `runtime-api.ts`) для
внутрішніх імпортів — ніколи не імпортуйте власний Plugin через його шлях SDK.

Для Plugin-ів провайдерів зберігайте допоміжні засоби, специфічні для провайдера, у цих barrel-файлах
кореня пакета, якщо тільки межа справді не є загальною. Поточні bundled приклади:

- Anthropic: обгортки потоків Claude і допоміжні засоби `service_tier` / beta
- OpenAI: конструктори провайдерів, допоміжні засоби моделей за замовчуванням, провайдери реального часу
- OpenRouter: конструктор провайдера плюс допоміжні засоби onboarding/конфігурації

Якщо допоміжний засіб корисний лише всередині одного bundled пакета провайдера, залишайте його на цьому
package-root seam замість того, щоб переносити в `openclaw/plugin-sdk/*`.

Деякі згенеровані helper seam-и `openclaw/plugin-sdk/<bundled-id>` усе ще існують для
підтримки bundled Plugin-ів і сумісності, наприклад
`plugin-sdk/feishu-setup` або `plugin-sdk/zalo-setup`. Ставтеся до них як до зарезервованих
поверхонь, а не як до типової схеми для нових сторонніх Plugin-ів.

## Контрольний список перед поданням

<Check>**package.json** має правильні метадані `openclaw`</Check>
<Check>Маніфест **openclaw.plugin.json** наявний і коректний</Check>
<Check>Точка входу використовує `defineChannelPluginEntry` або `definePluginEntry`</Check>
<Check>Усі імпорти використовують цільові шляхи `plugin-sdk/<subpath>`</Check>
<Check>Внутрішні імпорти використовують локальні модулі, а не self-import-и SDK</Check>
<Check>Тести проходять (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` проходить (для Plugin-ів у репозиторії)</Check>

## Тестування бета-релізу

1. Стежте за тегами релізів GitHub у [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) і підпишіться через `Watch` > `Releases`. Бета-теги мають вигляд `v2026.3.N-beta.1`. Ви також можете ввімкнути сповіщення для офіційного акаунта OpenClaw у X [@openclaw](https://x.com/openclaw), щоб отримувати анонси релізів.
2. Протестуйте свій Plugin із бета-тегом щойно він з’явиться. Вікно до стабільного релізу зазвичай становить лише кілька годин.
3. Після тестування напишіть у гілці вашого Plugin-а в каналі Discord `plugin-forum`: або `all good`, або що саме зламалося. Якщо у вас ще немає гілки, створіть її.
4. Якщо щось зламалося, створіть або оновіть issue з назвою `Beta blocker: <plugin-name> - <summary>` і додайте мітку `beta-blocker`. Додайте посилання на issue у свою гілку.
5. Відкрийте PR до `main` з назвою `fix(<plugin-id>): beta blocker - <summary>` і додайте посилання на issue і в PR, і у вашій гілці Discord. Учасники не можуть додавати мітки до PR, тому назва є сигналом на боці PR для супровідників і автоматизації. Блокери з PR будуть злиті; блокери без нього все одно можуть потрапити в реліз. Під час бета-тестування супровідники стежать за цими гілками.
6. Відсутність повідомлень означає, що все гаразд. Якщо ви пропустили це вікно, ваше виправлення, ймовірно, потрапить у наступний цикл.

## Наступні кроки

<CardGroup cols={2}>
  <Card title="Plugin-и каналів" icon="messages-square" href="/uk/plugins/sdk-channel-plugins">
    Створіть Plugin каналу обміну повідомленнями
  </Card>
  <Card title="Plugin-и провайдерів" icon="cpu" href="/uk/plugins/sdk-provider-plugins">
    Створіть Plugin провайдера моделей
  </Card>
  <Card title="Огляд SDK" icon="book-open" href="/uk/plugins/sdk-overview">
    Карта імпортів і довідник API реєстрації
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="settings" href="/uk/plugins/sdk-runtime">
    TTS, search, subagent через api.runtime
  </Card>
  <Card title="Тестування" icon="test-tubes" href="/uk/plugins/sdk-testing">
    Утиліти й шаблони для тестування
  </Card>
  <Card title="Маніфест Plugin-а" icon="file-json" href="/uk/plugins/manifest">
    Повний довідник схеми маніфесту
  </Card>
</CardGroup>

## Пов’язане

- [Архітектура Plugin-ів](/uk/plugins/architecture) — детальний огляд внутрішньої архітектури
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник SDK Plugin-ів
- [Маніфест](/uk/plugins/manifest) — формат маніфесту plugin-а
- [Plugin-и каналів](/uk/plugins/sdk-channel-plugins) — створення Plugin-ів каналів
- [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins) — створення Plugin-ів провайдерів
