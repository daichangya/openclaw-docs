---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію підписки Codex замість API-ключів
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T22:23:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 914836e35eb538d8ce758884fe4b0a6f5d0d0cfea483e1fe53f4a08709a16864
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI надає API для розробників для моделей GPT. Codex підтримує **вхід через ChatGPT** для доступу за підпискою
або **вхід через API key** для доступу з оплатою за використання. Для Codex cloud потрібен вхід через ChatGPT.
OpenAI прямо підтримує використання OAuth підписки в зовнішніх інструментах і робочих процесах, таких як OpenClaw.

## Стиль взаємодії за замовчуванням

OpenClaw може додавати невелике специфічне для OpenAI накладання промпту як для запусків `openai/*`, так і для
`openai-codex/*`. За замовчуванням це накладання робить асистента теплим,
налаштованим на співпрацю, лаконічним, прямолінійним і трохи більш емоційно виразним,
не замінюючи базовий системний промпт OpenClaw. Дружнє накладання також
дозволяє епізодичне використання емодзі, коли це природно доречно, водночас зберігаючи
загальний вивід лаконічним.

Ключ конфігурації:

`plugins.entries.openai.config.personality`

Допустимі значення:

- `"friendly"`: значення за замовчуванням; увімкнути специфічне для OpenAI накладання.
- `"off"`: вимкнути накладання і використовувати лише базовий промпт OpenClaw.

Область дії:

- Застосовується до моделей `openai/*`.
- Застосовується до моделей `openai-codex/*`.
- Не впливає на інших провайдерів.

Ця поведінка ввімкнена за замовчуванням. Залиште `"friendly"` явно вказаним, якщо хочете,
щоб це збереглося під час майбутніх локальних змін конфігурації:

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

### Вимкнення накладання промпту OpenAI

Якщо ви хочете використовувати незмінений базовий промпт OpenClaw, встановіть для накладання значення `"off"`:

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

Ви також можете встановити це напряму через конфігураційний CLI:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

## Варіант A: API key OpenAI (OpenAI Platform)

**Найкраще підходить для:** прямого доступу до API і тарифікації за використання.
Отримайте свій API key на панелі керування OpenAI.

### Налаштування CLI

```bash
openclaw onboard --auth-choice openai-api-key
# або неінтерактивно
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Фрагмент конфігурації

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

У поточній документації OpenAI щодо API моделей для прямого використання API OpenAI вказані `gpt-5.4` і `gpt-5.4-pro`.
OpenClaw передає обидві через шлях `openai/*` Responses.
OpenClaw навмисно приховує застарілий рядок `openai/gpt-5.3-codex-spark`,
оскільки прямі виклики API OpenAI відхиляють його в реальному трафіку.

OpenClaw **не** надає `openai/gpt-5.3-codex-spark` на шляху прямого OpenAI
API. `pi-ai` усе ще постачає вбудований рядок для цієї моделі, але реальні запити до API OpenAI
зараз її відхиляють. В OpenClaw Spark розглядається як лише Codex.

## Генерація зображень

Вбудований плагін `openai` також реєструє генерацію зображень через спільний
інструмент `image_generate`.

- Модель зображень за замовчуванням: `openai/gpt-image-1`
- Генерація: до 4 зображень за запит
- Режим редагування: увімкнено, до 5 еталонних зображень
- Підтримує `size`
- Поточне специфічне для OpenAI обмеження: OpenClaw наразі не передає перевизначення `aspectRatio` або
  `resolution` до OpenAI Images API

Щоб використовувати OpenAI як провайдера зображень за замовчуванням:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Див. [Генерація зображень](/uk/tools/image-generation) щодо параметрів
спільного інструмента, вибору провайдера та поведінки перемикання при відмові.

## Генерація відео

Вбудований плагін `openai` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `openai/sora-2`
- Режими: текст у відео, зображення у відео, а також потоки з одним еталонним відео для редагування
- Поточні обмеження: 1 зображення або 1 еталонний відеовхід
- Поточне специфічне для OpenAI обмеження: OpenClaw наразі не передає перевизначення `aspectRatio` або
  `resolution` до нативного відео API OpenAI

Щоб використовувати OpenAI як провайдера відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Див. [Генерація відео](/uk/tools/video-generation) щодо параметрів
спільного інструмента, вибору провайдера та поведінки перемикання при відмові.

## Варіант B: підписка OpenAI Code (Codex)

**Найкраще підходить для:** використання доступу за підпискою ChatGPT/Codex замість API key.
Для Codex cloud потрібен вхід через ChatGPT, тоді як CLI Codex підтримує вхід через ChatGPT або API key.

### Налаштування CLI (Codex OAuth)

```bash
# Запустити Codex OAuth у майстрі
openclaw onboard --auth-choice openai-codex

# Або запустити OAuth напряму
openclaw models auth login --provider openai-codex
```

### Фрагмент конфігурації (підписка Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

У поточній документації OpenAI для Codex як поточну модель Codex вказано `gpt-5.4`. OpenClaw
зіставляє її з `openai-codex/gpt-5.4` для використання ChatGPT/Codex OAuth.

Якщо під час onboarding повторно використовується наявний вхід CLI Codex, ці облікові дані
залишаються під керуванням CLI Codex. Після завершення строку дії OpenClaw спочатку знову читає зовнішнє джерело Codex
і, якщо провайдер може його оновити, записує оновлені облікові дані
назад у сховище Codex замість того, щоб брати їх під контроль в окремій копії,
яка належить лише OpenClaw.

Якщо ваш акаунт Codex має право на Codex Spark, OpenClaw також підтримує:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw розглядає Codex Spark як лише Codex. Він не надає прямий
шлях API-key `openai/gpt-5.3-codex-spark`.

OpenClaw також зберігає `openai-codex/gpt-5.3-codex-spark`, коли його
виявляє `pi-ai`. Розглядайте його як такий, що залежить від entitlement, і експериментальний: Codex Spark
відокремлений від GPT-5.4 `/fast`, а доступність залежить від акаунта Codex /
ChatGPT, під яким виконано вхід.

### Обмеження вікна контексту Codex

OpenClaw розглядає метадані моделі Codex і обмеження контексту під час виконання як окремі
значення.

Для `openai-codex/gpt-5.4`:

- нативне `contextWindow`: `1050000`
- обмеження `contextTokens` під час виконання за замовчуванням: `272000`

Це зберігає правдивість метаданих моделі, водночас залишаючи менше вікно під час виконання за замовчуванням,
яке на практиці має кращі характеристики затримки й якості.

Якщо вам потрібне інше фактичне обмеження, встановіть `models.providers.<provider>.models[].contextTokens`:

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
метадані моделі. Використовуйте `contextTokens`, коли хочете обмежити бюджет контексту під час виконання.

### Транспорт за замовчуванням

OpenClaw використовує `pi-ai` для потокової передачі моделей. І для `openai/*`, і для
`openai-codex/*` транспортом за замовчуванням є `"auto"` (спочатку WebSocket, потім резервний варіант SSE).

У режимі `"auto"` OpenClaw також повторює одну ранню, придатну до повтору помилку WebSocket,
перш ніж перейти до SSE. Примусовий режим `"websocket"` усе ще напряму показує помилки транспорту,
замість того щоб приховувати їх за fallback-механізмом.

Після помилки WebSocket під час підключення або на ранньому ході в режимі `"auto"` OpenClaw позначає
шлях WebSocket цієї сесії як деградований приблизно на 60 секунд і надсилає
наступні ходи через SSE протягом цього періоду охолодження, замість того щоб хаотично перемикатися між
транспортами.

Для нативних ендпойнтів сімейства OpenAI (`openai/*`, `openai-codex/*` і Azure
OpenAI Responses) OpenClaw також додає до запитів стабільний стан ідентичності сесії та ходу,
щоб повтори, повторні підключення та fallback на SSE залишалися прив’язаними до тієї самої
ідентичності розмови. На нативних маршрутах сімейства OpenAI це включає стабільні заголовки ідентичності запиту сесії/ходу, а також відповідні метадані транспорту.

OpenClaw також нормалізує лічильники використання OpenAI між різними транспортними варіантами перед тим,
як вони потрапляють у поверхні session/status. Нативний трафік OpenAI/Codex Responses може
повідомляти про використання або як `input_tokens` / `output_tokens`, або як
`prompt_tokens` / `completion_tokens`; OpenClaw розглядає їх як однакові лічильники вхідних
і вихідних токенів для `/status`, `/usage` і журналів сесій. Коли нативний
трафік WebSocket не містить `total_tokens` (або повідомляє `0`), OpenClaw повертається до
нормалізованої суми вхідних і вихідних токенів, щоб відображення session/status залишалися заповненими.

Ви можете встановити `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: примусово використовувати SSE
- `"websocket"`: примусово використовувати WebSocket
- `"auto"`: спробувати WebSocket, а потім перейти до SSE

Для `openai/*` (Responses API) OpenClaw також за замовчуванням увімкнено прогрів WebSocket
(`openaiWsWarmup: true`), коли використовується транспорт WebSocket.

Пов’язана документація OpenAI:

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

У документації OpenAI прогрів описується як необов’язковий. OpenClaw вмикає його за замовчуванням для
`openai/*`, щоб зменшити затримку першого ходу при використанні транспорту WebSocket.

### Вимкнення прогріву

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

### Явне ввімкнення прогріву

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

### Пріоритетна обробка OpenAI і Codex

API OpenAI надає пріоритетну обробку через `service_tier=priority`. У
OpenClaw встановіть `agents.defaults.models["<provider>/<model>"].params.serviceTier`,
щоб передати це поле в нативні ендпойнти OpenAI/Codex Responses.

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

OpenClaw передає `params.serviceTier` як до прямих запитів `openai/*` Responses,
так і до запитів `openai-codex/*` Codex Responses, коли ці моделі вказують
на нативні ендпойнти OpenAI/Codex.

Важлива поведінка:

- прямий `openai/*` має бути спрямований на `api.openai.com`
- `openai-codex/*` має бути спрямований на `chatgpt.com/backend-api`
- якщо ви маршрутизуєте будь-якого з цих провайдерів через інший base URL або проксі, OpenClaw залишає `service_tier` без змін

### Швидкий режим OpenAI

OpenClaw надає спільний перемикач швидкого режиму як для сесій `openai/*`, так і для
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Конфігурація: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Коли швидкий режим увімкнено, OpenClaw зіставляє його з пріоритетною обробкою OpenAI:

- прямі виклики `openai/*` Responses до `api.openai.com` надсилають `service_tier = "priority"`
- виклики `openai-codex/*` Responses до `chatgpt.com/backend-api` також надсилають `service_tier = "priority"`
- наявні значення `service_tier` у payload зберігаються
- швидкий режим не переписує `reasoning` або `text.verbosity`

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

Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions
повертає сесію до налаштованого значення за замовчуванням.

### Нативні маршрути OpenAI порівняно з OpenAI-compatible маршрутами

OpenClaw по-різному обробляє прямі ендпойнти OpenAI, Codex та Azure OpenAI
порівняно з універсальними OpenAI-compatible проксі `/v1`:

- нативні маршрути `openai/*`, `openai-codex/*` і Azure OpenAI зберігають
  `reasoning: { effort: "none" }` без змін, коли ви явно вимикаєте reasoning
- для нативних маршрутів сімейства OpenAI схеми інструментів за замовчуванням переводяться в строгий режим
- приховані заголовки атрибуції OpenClaw (`originator`, `version` і
  `User-Agent`) додаються лише на перевірених нативних хостах OpenAI
  (`api.openai.com`) і нативних хостах Codex (`chatgpt.com/backend-api`)
- нативні маршрути OpenAI/Codex зберігають формування запитів, специфічне для OpenAI, таке як
  `service_tier`, `store` у Responses, payload-и сумісності OpenAI reasoning і
  підказки кешу промптів
- OpenAI-compatible маршрути у стилі проксі зберігають більш вільну поведінку сумісності та не
  примусово вмикають строгі схеми інструментів, нативне формування запитів або приховані
  заголовки атрибуції OpenAI/Codex

Azure OpenAI залишається в категорії нативної маршрутизації для транспорту та
поведінки сумісності, але не отримує приховані заголовки атрибуції OpenAI/Codex.

Це зберігає поточну поведінку нативного OpenAI Responses, не нав’язуючи старі
OpenAI-compatible шими стороннім бекендам `/v1`.

### Серверна компактизація OpenAI Responses

Для прямих моделей OpenAI Responses (`openai/*`, які використовують `api: "openai-responses"` з
`baseUrl` на `api.openai.com`) OpenClaw тепер автоматично вмикає серверні
підказки payload для компактизації OpenAI:

- Примусово встановлює `store: true` (якщо compat моделі не встановлює `supportsStore: false`)
- Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`

За замовчуванням `compact_threshold` становить `70%` від `contextWindow` моделі (або `80000`,
якщо він недоступний).

### Явне ввімкнення серверної компактизації

Використовуйте це, якщо хочете примусово вставляти `context_management` у сумісні
моделі Responses (наприклад, Azure OpenAI Responses):

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

### Увімкнення з власним порогом

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

### Вимкнення серверної компактизації

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

`responsesServerCompaction` керує лише вставленням `context_management`.
Прямі моделі OpenAI Responses усе ще примусово встановлюють `store: true`, якщо compat
не встановлює `supportsStore: false`.

## Примітки

- Посилання на моделі завжди використовують `provider/model` (див. [/concepts/models](/uk/concepts/models)).
- Докладні відомості про автентифікацію та правила повторного використання наведено в [/concepts/oauth](/uk/concepts/oauth).
