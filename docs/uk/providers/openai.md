---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію через підписку Codex замість API-ключів
summary: Використання OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T18:15:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7da5413b8254015ee85f718356eb2dbcdc8d8f5c0de9f9a637242e6236540b4
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI надає API для розробників для моделей GPT. Codex підтримує **вхід через ChatGPT** для доступу
за підпискою або **вхід через API-ключ** для доступу з оплатою за використання. Codex cloud вимагає входу через ChatGPT.
OpenAI явно підтримує використання OAuth підписки у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

## Стиль взаємодії за замовчуванням

OpenClaw може додавати невелике OpenAI-специфічне накладання prompt для запусків як `openai/*`, так і
`openai-codex/*`. За замовчуванням це накладання зберігає асистента
готовим до роботи, співпрацюючим, лаконічним, прямолінійним і трохи емоційно виразнішим,
не замінюючи базовий системний prompt OpenClaw. Дружнє накладання також
дозволяє інколи використовувати emoji, коли це природно вписується, зберігаючи при цьому загальну
лаконічність виводу.

Ключ config:

`plugins.entries.openai.config.personality`

Дозволені значення:

- `"friendly"`: за замовчуванням; увімкнути OpenAI-специфічне накладання.
- `"off"`: вимкнути накладання і використовувати лише базовий prompt OpenClaw.

Область дії:

- Застосовується до моделей `openai/*`.
- Застосовується до моделей `openai-codex/*`.
- Не впливає на інших провайдерів.

Ця поведінка ввімкнена за замовчуванням. Залиште `"friendly"` явно, якщо хочете,
щоб це пережило майбутні локальні зміни config:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Вимкнення накладання prompt OpenAI

Якщо вам потрібен незмінений базовий prompt OpenClaw, установіть для накладання значення `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Також це можна задати напряму через config CLI:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

## Варіант A: API-ключ OpenAI (OpenAI Platform)

**Найкраще для:** прямого доступу до API та білінгу за використанням.
Отримайте свій API-ключ у панелі OpenAI.

### Налаштування через CLI

```bash
openclaw onboard --auth-choice openai-api-key
# або без інтерактивного режиму
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Фрагмент config

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

У поточній документації API-моделей OpenAI для прямого
використання OpenAI API вказані `gpt-5.4` і `gpt-5.4-pro`. OpenClaw пересилає обидві через шлях `openai/*` Responses.
OpenClaw навмисно приховує застарілий рядок `openai/gpt-5.3-codex-spark`,
оскільки прямі виклики OpenAI API відхиляють його в реальному трафіку.

OpenClaw **не** показує `openai/gpt-5.3-codex-spark` на прямому шляху OpenAI
API. У `pi-ai` усе ще є вбудований рядок для цієї моделі, але реальні запити OpenAI API
зараз його відхиляють. В OpenClaw Spark вважається моделлю лише для Codex.

## Варіант B: підписка OpenAI Code (Codex)

**Найкраще для:** використання доступу за підпискою ChatGPT/Codex замість API-ключа.
Codex cloud вимагає входу через ChatGPT, тоді як CLI Codex підтримує вхід через ChatGPT або API-ключ.

### Налаштування через CLI (Codex OAuth)

```bash
# Запустити Codex OAuth у майстрі
openclaw onboard --auth-choice openai-codex

# Або запустити OAuth напряму
openclaw models auth login --provider openai-codex
```

### Фрагмент config (підписка Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

У поточній документації Codex від OpenAI `gpt-5.4` вказана як поточна модель Codex. OpenClaw
зіставляє її з `openai-codex/gpt-5.4` для використання через ChatGPT/Codex OAuth.

Якщо onboarding повторно використовує наявний вхід Codex CLI, ці облікові дані
і далі керуються Codex CLI. Після завершення строку дії OpenClaw спочатку повторно читає зовнішнє джерело Codex
і, коли провайдер може його оновити, записує оновлені облікові дані
назад у сховище Codex замість того, щоб перебирати керування в окрему копію лише для OpenClaw.

Якщо ваш обліковий запис Codex має право на Codex Spark, OpenClaw також підтримує:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw розглядає Codex Spark як модель лише для Codex. Він не надає прямий
шлях API-ключа `openai/gpt-5.3-codex-spark`.

OpenClaw також зберігає `openai-codex/gpt-5.3-codex-spark`, коли `pi-ai`
його виявляє. Вважайте цю можливість залежною від прав доступу та експериментальною: Codex Spark
існує окремо від GPT-5.4 `/fast`, а доступність залежить від облікового запису Codex /
ChatGPT, через який виконано вхід.

### Обмеження вікна контексту Codex

OpenClaw розглядає метадані моделі Codex і runtime-обмеження контексту як окремі
значення.

Для `openai-codex/gpt-5.4`:

- нативне `contextWindow`: `1050000`
- обмеження `contextTokens` у runtime за замовчуванням: `272000`

Це зберігає правдивість метаданих моделі, водночас підтримуючи менше вікно runtime за замовчуванням,
яке на практиці має кращі характеристики затримки та якості.

Якщо вам потрібне інше фактичне обмеження, задайте `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Використовуйте `contextWindow` лише тоді, коли ви оголошуєте або перевизначаєте нативні
метадані моделі. Використовуйте `contextTokens`, коли хочете обмежити бюджет контексту в runtime.

### Транспорт за замовчуванням

OpenClaw використовує `pi-ai` для потокової передачі моделей. Для `openai/*`, і для
`openai-codex/*` транспорт за замовчуванням — `"auto"` (спочатку WebSocket, потім
резервний перехід на SSE).

У режимі `"auto"` OpenClaw також повторює одну ранню відновлювану помилку WebSocket,
перш ніж перейти на SSE. Примусовий режим `"websocket"` і далі показує транспортні
помилки напряму замість приховування їх резервним механізмом.

Після помилки підключення або раннього ходу через WebSocket у режимі `"auto"` OpenClaw позначає
шлях WebSocket для цієї сесії як деградований приблизно на 60 секунд і надсилає
наступні ходи через SSE протягом періоду охолодження замість постійного перемикання
між транспортами.

Для нативних endpoint OpenAI-сімейства (`openai/*`, `openai-codex/*` і Azure
OpenAI Responses) OpenClaw також додає до запитів стабільний стан ідентичності сесії та ходу,
щоб повторні спроби, повторні підключення та резервний перехід на SSE залишалися прив’язаними до тієї самої
ідентичності розмови. На нативних маршрутах OpenAI-сімейства це включає стабільні заголовки
ідентичності запиту для сесії/ходу та відповідні метадані транспорту.

OpenClaw також нормалізує лічильники використання OpenAI між різними варіантами транспорту, перш ніж
вони потраплять у поверхні сесії/статусу. Нативний трафік OpenAI/Codex Responses може
повідомляти використання як `input_tokens` / `output_tokens` або
`prompt_tokens` / `completion_tokens`; OpenClaw вважає це однаковими лічильниками
входу і виходу для `/status`, `/usage` та логів сесій. Коли нативний
трафік WebSocket не містить `total_tokens` (або повідомляє `0`), OpenClaw використовує нормалізовану
суму входу та виходу, щоб у відображеннях сесії/статусу лишалися заповнені значення.

Ви можете задати `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: примусово використовувати SSE
- `"websocket"`: примусово використовувати WebSocket
- `"auto"`: спробувати WebSocket, потім перейти на SSE

Для `openai/*` (Responses API) OpenClaw також за замовчуванням вмикає прогрів WebSocket
(`openaiWsWarmup: true`), коли використовується транспорт WebSocket.

Пов’язані документи OpenAI:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Прогрів OpenAI WebSocket

У документації OpenAI прогрів описано як необов’язковий. OpenClaw вмикає його за замовчуванням для
`openai/*`, щоб зменшити затримку першого ходу при використанні транспорту WebSocket.

### Вимкнути прогрів

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Явно увімкнути прогрів

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Пріоритетна обробка OpenAI та Codex

API OpenAI надає пріоритетну обробку через `service_tier=priority`. У
OpenClaw задайте `agents.defaults.models["<provider>/<model>"].params.serviceTier`,
щоб передавати це поле далі на нативні endpoint OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Підтримувані значення: `auto`, `default`, `flex` і `priority`.

OpenClaw пересилає `params.serviceTier` як до прямих запитів `openai/*` Responses,
так і до запитів `openai-codex/*` Codex Responses, коли ці моделі вказують
на нативні endpoint OpenAI/Codex.

Важлива поведінка:

- прямий `openai/*` має вказувати на `api.openai.com`
- `openai-codex/*` має вказувати на `chatgpt.com/backend-api`
- якщо ви маршрутизуєте будь-якого з цих провайдерів через інший base URL або проксі, OpenClaw не змінює `service_tier`

### Швидкий режим OpenAI

OpenClaw надає спільний перемикач швидкого режиму як для сесій `openai/*`, так і для
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Config: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Коли швидкий режим увімкнено, OpenClaw зіставляє його з пріоритетною обробкою OpenAI:

- прямі виклики `openai/*` Responses до `api.openai.com` надсилають `service_tier = "priority"`
- виклики `openai-codex/*` Responses до `chatgpt.com/backend-api` також надсилають `service_tier = "priority"`
- наявні значення `service_tier` у payload зберігаються
- швидкий режим не змінює `reasoning` або `text.verbosity`

Приклад:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Перевизначення сесії мають вищий пріоритет, ніж config. Очищення перевизначення сесії в UI Sessions
повертає сесію до налаштованого значення за замовчуванням.

### Нативні маршрути OpenAI проти OpenAI-сумісних маршрутів

OpenClaw по-різному обробляє прямі endpoint OpenAI, Codex і Azure OpenAI
та узагальнені OpenAI-сумісні проксі `/v1`:

- нативні маршрути `openai/*`, `openai-codex/*` і Azure OpenAI зберігають
  `reasoning: { effort: "none" }` без змін, коли ви явно вимикаєте reasoning
- нативні маршрути OpenAI-сімейства за замовчуванням використовують strict mode для схем інструментів
- приховані заголовки атрибуції OpenClaw (`originator`, `version` і
  `User-Agent`) додаються лише на перевірених нативних хостах OpenAI
  (`api.openai.com`) і нативних хостах Codex (`chatgpt.com/backend-api`)
- нативні маршрути OpenAI/Codex зберігають OpenAI-специфічне формування запитів, наприклад
  `service_tier`, Responses `store`, сумісні payload для reasoning OpenAI та
  підказки для prompt-cache
- OpenAI-сумісні маршрути в стилі проксі зберігають м’якшу поведінку сумісності та
  не примушують strict mode для схем інструментів, нативне формування запитів або приховані
  заголовки атрибуції OpenAI/Codex

Azure OpenAI залишається в категорії нативної маршрутизації для поведінки транспорту та сумісності,
але не отримує прихованих заголовків атрибуції OpenAI/Codex.

Це зберігає поточну нативну поведінку OpenAI Responses, не нав’язуючи старі
OpenAI-сумісні shim-шари стороннім бекендам `/v1`.

### Серверне ущільнення OpenAI Responses

Для прямих моделей OpenAI Responses (`openai/*`, які використовують `api: "openai-responses"` з
`baseUrl` на `api.openai.com`) OpenClaw тепер автоматично вмикає
підказки payload для серверного ущільнення OpenAI:

- Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
- Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`

За замовчуванням `compact_threshold` становить `70%` від `contextWindow` моделі (або `80000`,
якщо воно недоступне).

### Явно увімкнути серверне ущільнення

Використовуйте це, якщо хочете примусово впроваджувати `context_management` для сумісних
моделей Responses (наприклад Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Увімкнути з власним порогом

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Вимкнути серверне ущільнення

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` керує лише впровадженням `context_management`.
Прямі моделі OpenAI Responses усе одно примусово використовують `store: true`, якщо compat не задає
`supportsStore: false`.

## Примітки

- Посилання на моделі завжди використовують формат `provider/model` (див. [/concepts/models](/uk/concepts/models)).
- Докладно про автентифікацію та правила повторного використання див. у [/concepts/oauth](/uk/concepts/oauth).
