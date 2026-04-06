---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію підписки Codex замість API-ключів
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-06T16:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a2ce1ce5f085fe55ec50b8d20359180b9002c9730820cd5b0e011c3bf807b64
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI надає API для розробників для моделей GPT. Codex підтримує **вхід через ChatGPT** для доступу за підпискою
або вхід через **API-ключ** для доступу з оплатою за використання. Codex cloud вимагає входу через ChatGPT.
OpenAI явно підтримує використання OAuth підписки в зовнішніх інструментах і робочих процесах, таких як OpenClaw.

## Стиль взаємодії за замовчуванням

OpenClaw може додавати невелике специфічне для OpenAI накладання промпту як для запусків `openai/*`, так і для
`openai-codex/*`. За замовчуванням це накладання зберігає стиль асистента теплим,
співпрацюючим, лаконічним, прямим і трохи більш емоційно виразним,
не замінюючи базовий системний промпт OpenClaw. Дружнє накладання також
дозволяє час від часу використовувати емодзі, коли це природно доречно, зберігаючи загальну
лаконічність відповіді.

Ключ конфігурації:

`plugins.entries.openai.config.personality`

Дозволені значення:

- `"friendly"`: за замовчуванням; увімкнути специфічне для OpenAI накладання.
- `"on"`: псевдонім для `"friendly"`.
- `"off"`: вимкнути накладання й використовувати лише базовий промпт OpenClaw.

Область дії:

- Застосовується до моделей `openai/*`.
- Застосовується до моделей `openai-codex/*`.
- Не впливає на інших провайдерів.

Цю поведінку ввімкнено за замовчуванням. Залиште `"friendly"` явно, якщо хочете, щоб це
збереглося під час майбутніх локальних змін конфігурації:

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

Якщо ви хочете немодифікований базовий промпт OpenClaw, встановіть накладання в `"off"`:

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

Ви також можете встановити це безпосередньо через CLI конфігурації:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

OpenClaw нормалізує це налаштування під час виконання без урахування регістру, тому значення на кшталт
`"Off"` також вимикають дружнє накладання.

## Варіант A: API-ключ OpenAI (OpenAI Platform)

**Найкраще для:** прямого доступу до API та білінгу за використанням.
Отримайте свій API-ключ у панелі керування OpenAI.

Зведення маршруту:

- `openai/gpt-5.4` = прямий маршрут API OpenAI Platform
- Потрібен `OPENAI_API_KEY` (або еквівалентна конфігурація провайдера OpenAI)
- В OpenClaw вхід ChatGPT/Codex маршрутизується через `openai-codex/*`, а не `openai/*`

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

Поточна документація OpenAI для моделей API вказує `gpt-5.4` і `gpt-5.4-pro` для прямого
використання API OpenAI. OpenClaw передає обидві через шлях Responses `openai/*`.
OpenClaw навмисно приховує застарілий рядок `openai/gpt-5.3-codex-spark`,
оскільки прямі виклики API OpenAI відхиляють його в реальному трафіку.

OpenClaw **не** показує `openai/gpt-5.3-codex-spark` на прямому маршруті OpenAI
API. `pi-ai` усе ще постачається з вбудованим рядком для цієї моделі, але реальні запити API OpenAI
зараз її відхиляють. У OpenClaw Spark вважається доступним лише через Codex.

## Генерація зображень

Вбудований плагін `openai` також реєструє генерацію зображень через спільний
інструмент `image_generate`.

- Модель зображень за замовчуванням: `openai/gpt-image-1`
- Генерація: до 4 зображень за запит
- Режим редагування: увімкнено, до 5 еталонних зображень
- Підтримує `size`
- Поточне специфічне для OpenAI застереження: сьогодні OpenClaw не передає перевизначення `aspectRatio` або
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

Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні
параметри інструмента, вибір провайдера та поведінку failover.

## Генерація відео

Вбудований плагін `openai` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `openai/sora-2`
- Режими: текст у відео, зображення у відео та потоки з одним еталонним відео/редагуванням
- Поточні обмеження: 1 зображення або 1 еталонне відео як вхід
- Поточне специфічне для OpenAI застереження: OpenClaw наразі передає лише перевизначення
  `size` для нативної генерації відео OpenAI. Непідтримувані необов’язкові перевизначення,
  такі як `aspectRatio`, `resolution`, `audio` і `watermark`, ігноруються
  та повертаються як попередження інструмента.

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

Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні
параметри інструмента, вибір провайдера та поведінку failover.

## Варіант B: підписка OpenAI Code (Codex)

**Найкраще для:** використання доступу за підпискою ChatGPT/Codex замість API-ключа.
Codex cloud вимагає входу через ChatGPT, тоді як CLI Codex підтримує вхід через ChatGPT або API-ключ.

Зведення маршруту:

- `openai-codex/gpt-5.4` = маршрут OAuth ChatGPT/Codex
- Використовує вхід ChatGPT/Codex, а не прямий API-ключ OpenAI Platform
- Обмеження на боці провайдера для `openai-codex/*` можуть відрізнятися від досвіду в ChatGPT web/app

### Налаштування CLI (Codex OAuth)

```bash
# Запустіть Codex OAuth у майстрі
openclaw onboard --auth-choice openai-codex

# Або запустіть OAuth безпосередньо
openclaw models auth login --provider openai-codex
```

### Фрагмент конфігурації (підписка Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

Поточна документація OpenAI для Codex вказує `gpt-5.4` як поточну модель Codex. OpenClaw
відображає її як `openai-codex/gpt-5.4` для використання ChatGPT/Codex OAuth.

Цей маршрут навмисно відокремлений від `openai/gpt-5.4`. Якщо вам потрібен
прямий шлях API OpenAI Platform, використовуйте `openai/*` з API-ключем. Якщо вам потрібен
вхід через ChatGPT/Codex, використовуйте `openai-codex/*`.

Якщо onboarding повторно використовує наявний вхід CLI Codex, ці облікові дані
залишаються під керуванням CLI Codex. Після завершення строку дії OpenClaw спочатку повторно зчитує зовнішнє джерело Codex
і, коли провайдер може його оновити, записує оновлені облікові дані
назад у сховище Codex замість того, щоб брати на себе керування окремою копією лише для OpenClaw.

Якщо ваш обліковий запис Codex має право на Codex Spark, OpenClaw також підтримує:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw вважає Codex Spark доступним лише через Codex. Він не надає прямий
шлях API-ключа `openai/gpt-5.3-codex-spark`.

OpenClaw також зберігає `openai-codex/gpt-5.3-codex-spark`, коли `pi-ai`
виявляє його. Розглядайте це як залежне від entitlement та експериментальне: Codex Spark
відокремлений від GPT-5.4 `/fast`, а доступність залежить від облікового запису Codex /
ChatGPT, через який виконано вхід.

### Обмеження вікна контексту Codex

OpenClaw розглядає метадані моделі Codex і обмеження контексту під час виконання як окремі
значення.

Для `openai-codex/gpt-5.4`:

- нативне `contextWindow`: `1050000`
- обмеження `contextTokens` під час виконання за замовчуванням: `272000`

Це зберігає правдивість метаданих моделі, одночасно залишаючи менше вікно часу виконання за замовчуванням,
яке на практиці має кращі характеристики затримки й якості.

Якщо ви хочете інше ефективне обмеження, встановіть `models.providers.<provider>.models[].contextTokens`:

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

OpenClaw використовує `pi-ai` для потокової передачі моделей. Для обох `openai/*` і
`openai-codex/*` транспорт за замовчуванням — `"auto"` (спочатку WebSocket, потім запасний
варіант SSE).

У режимі `"auto"` OpenClaw також повторює одну ранню відновлювану помилку WebSocket
перш ніж перейти на SSE. Примусовий режим `"websocket"` усе ще показує помилки транспорту
безпосередньо, замість того щоб приховувати їх за fallback.

Після помилки WebSocket під час підключення або на ранньому ході в режимі `"auto"` OpenClaw позначає
шлях WebSocket цієї сесії як деградований приблизно на 60 секунд і надсилає
наступні ходи через SSE під час цього періоду охолодження, замість того щоб безперервно
перемикатися між транспортами.

Для нативних кінцевих точок сімейства OpenAI (`openai/*`, `openai-codex/*` і Azure
OpenAI Responses) OpenClaw також додає стабільний стан ідентичності сесії та ходу
до запитів, щоб повтори, повторні підключення та fallback на SSE залишалися прив’язаними до тієї самої
ідентичності розмови. На нативних маршрутах сімейства OpenAI це включає стабільні заголовки ідентичності запиту
сесії/ходу плюс відповідні метадані транспорту.

OpenClaw також нормалізує лічильники використання OpenAI для різних варіантів транспорту до того,
як вони потрапляють у поверхні session/status. Нативний трафік OpenAI/Codex Responses може
повідомляти використання як `input_tokens` / `output_tokens` або
`prompt_tokens` / `completion_tokens`; OpenClaw вважає їх однаковими лічильниками вхідних
і вихідних токенів для `/status`, `/usage` і журналів сесій. Коли нативний
WebSocket-трафік не містить `total_tokens` (або повідомляє `0`), OpenClaw повертається до
нормалізованої суми вхідних і вихідних токенів, щоб відображення session/status залишалися заповненими.

Ви можете встановити `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: примусово використовувати SSE
- `"websocket"`: примусово використовувати WebSocket
- `"auto"`: спробувати WebSocket, а потім перейти на SSE

Для `openai/*` (Responses API) OpenClaw також за замовчуванням увімкнув прогрів WebSocket
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

### Прогрів WebSocket OpenAI

Документація OpenAI описує прогрів як необов’язковий. OpenClaw вмикає його за замовчуванням для
`openai/*`, щоб зменшити затримку першого ходу під час використання транспорту WebSocket.

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

### Явно ввімкнути прогрів

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
OpenClaw встановіть `agents.defaults.models["<provider>/<model>"].params.serviceTier`,
щоб передавати це поле далі в нативних кінцевих точках OpenAI/Codex Responses.

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

OpenClaw передає `params.serviceTier` як у прямі запити Responses `openai/*`,
так і в запити Codex Responses `openai-codex/*`, коли ці моделі вказують
на нативні кінцеві точки OpenAI/Codex.

Важлива поведінка:

- прямий `openai/*` має вказувати на `api.openai.com`
- `openai-codex/*` має вказувати на `chatgpt.com/backend-api`
- якщо ви маршрутизуєте будь-якого провайдера через інший базовий URL або проксі, OpenClaw залишає `service_tier` без змін

### Швидкий режим OpenAI

OpenClaw надає спільний перемикач швидкого режиму як для сесій `openai/*`, так і для
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Конфігурація: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Коли швидкий режим увімкнено, OpenClaw відображає його на пріоритетну обробку OpenAI:

- прямі виклики Responses `openai/*` до `api.openai.com` надсилають `service_tier = "priority"`
- виклики Responses `openai-codex/*` до `chatgpt.com/backend-api` також надсилають `service_tier = "priority"`
- наявні значення `service_tier` у payload зберігаються
- швидкий режим не переписує `reasoning` або `text.verbosity`

Зокрема для GPT 5.4, найтиповіше налаштування таке:

- надішліть `/fast on` у сесії, що використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`
- або встановіть `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- якщо ви також використовуєте Codex OAuth, також встановіть `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true`

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

Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в інтерфейсі Sessions UI
повертає сесію до налаштованого значення за замовчуванням.

### Нативні маршрути OpenAI проти OpenAI-сумісних маршрутів

OpenClaw обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI інакше,
ніж універсальні OpenAI-сумісні проксі `/v1`:

- нативні маршрути `openai/*`, `openai-codex/*` і Azure OpenAI зберігають
  `reasoning: { effort: "none" }` без змін, коли ви явно вимикаєте reasoning
- нативні маршрути сімейства OpenAI за замовчуванням встановлюють строгий режим для схем інструментів
- приховані заголовки атрибуції OpenClaw (`originator`, `version` і
  `User-Agent`) додаються лише на перевірених нативних хостах OpenAI
  (`api.openai.com`) і нативних хостах Codex (`chatgpt.com/backend-api`)
- нативні маршрути OpenAI/Codex зберігають shaping запитів, притаманний лише OpenAI, наприклад
  `service_tier`, `store` у Responses, payload сумісності reasoning OpenAI та
  підказки кешу промптів
- OpenAI-сумісні маршрути у стилі проксі зберігають більш вільну сумісну поведінку й
  не примушують до строгих схем інструментів, формування запитів лише для нативних маршрутів або прихованих
  заголовків атрибуції OpenAI/Codex

Azure OpenAI залишається в категорії нативної маршрутизації для транспорту та
сумісної поведінки, але не отримує приховані заголовки атрибуції OpenAI/Codex.

Це зберігає поточну поведінку нативних OpenAI Responses, не нав’язуючи старіші
OpenAI-сумісні shim-рішення стороннім бекендам `/v1`.

### Серверна компакція OpenAI Responses

Для прямих моделей OpenAI Responses (`openai/*`, що використовують `api: "openai-responses"` з
`baseUrl` на `api.openai.com`) OpenClaw тепер автоматично вмикає серверні
підказки payload для компакції OpenAI:

- Примусово встановлює `store: true` (якщо сумісність моделі не встановлює `supportsStore: false`)
- Інжектує `context_management: [{ type: "compaction", compact_threshold: ... }]`

За замовчуванням `compact_threshold` становить `70%` від `contextWindow` моделі (або `80000`,
якщо значення недоступне).

### Явно ввімкнути серверну компакцію

Використовуйте це, якщо хочете примусово інжектувати `context_management` у сумісних
моделях Responses (наприклад Azure OpenAI Responses):

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

### Вимкнути серверну компакцію

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

`responsesServerCompaction` керує лише інжекцією `context_management`.
Прямі моделі OpenAI Responses усе ще примусово встановлюють `store: true`, якщо сумісність
не встановлює `supportsStore: false`.

## Примітки

- Посилання на моделі завжди використовують формат `provider/model` (див. [/concepts/models](/uk/concepts/models)).
- Докладно про автентифікацію та правила повторного використання — у [/concepts/oauth](/uk/concepts/oauth).
