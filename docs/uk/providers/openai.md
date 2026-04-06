---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію підписки Codex замість ключів API
summary: Використовуйте OpenAI через ключі API або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-06T00:33:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e04db5787f6ed7b1eda04d965c10febae10809fc82ae4d9769e7163234471f5
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI надає API для розробників для моделей GPT. Codex підтримує **вхід через ChatGPT** для доступу за підпискою
або **вхід за ключем API** для доступу з оплатою за використання. Codex cloud вимагає входу через ChatGPT.
OpenAI явно підтримує використання OAuth підписки у зовнішніх інструментах/робочих процесах, таких як OpenClaw.

## Стиль взаємодії за замовчуванням

OpenClaw може додавати невелике OpenAI-специфічне накладання prompt для запусків `openai/*` і
`openai-codex/*`. За замовчуванням це накладання зберігає стиль помічника теплим,
колаборативним, лаконічним, прямим і трохи емоційно виразнішим,
не замінюючи базовий системний prompt OpenClaw. Дружнє накладання також
дозволяє час від часу використовувати emoji, коли це природно, водночас зберігаючи
загальний вивід лаконічним.

Ключ конфігурації:

`plugins.entries.openai.config.personality`

Дозволені значення:

- `"friendly"`: за замовчуванням; увімкнути OpenAI-специфічне накладання.
- `"off"`: вимкнути накладання та використовувати лише базовий prompt OpenClaw.

Область дії:

- Застосовується до моделей `openai/*`.
- Застосовується до моделей `openai-codex/*`.
- Не впливає на інших провайдерів.

Ця поведінка увімкнена за замовчуванням. Залиште `"friendly"` явно, якщо хочете,
щоб це пережило майбутні локальні зміни конфігурації:

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

### Вимкнення OpenAI prompt-накладання

Якщо ви хочете використовувати незмінений базовий prompt OpenClaw, встановіть для накладання значення `"off"`:

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

## Варіант A: ключ API OpenAI (OpenAI Platform)

**Найкраще для:** прямого доступу до API та білінгу за використанням.
Отримайте свій ключ API на інформаційній панелі OpenAI.

### Налаштування CLI

```bash
openclaw onboard --auth-choice openai-api-key
# або без взаємодії
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Фрагмент конфігурації

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

У поточній документації моделей API OpenAI вказані `gpt-5.4` і `gpt-5.4-pro` для прямого
використання API OpenAI. OpenClaw пересилає обидві через шлях Responses `openai/*`.
OpenClaw навмисно приховує застарілий рядок `openai/gpt-5.3-codex-spark`,
оскільки прямі виклики API OpenAI відхиляють його в реальному трафіку.

OpenClaw **не** надає `openai/gpt-5.3-codex-spark` на шляху прямого API OpenAI.
`pi-ai` усе ще постачає вбудований рядок для цієї моделі, але реальні запити до API OpenAI
зараз її відхиляють. У OpenClaw Spark вважається доступним лише для Codex.

## Генерація зображень

Вбудований плагін `openai` також реєструє генерацію зображень через спільний
інструмент `image_generate`.

- Модель зображень за замовчуванням: `openai/gpt-image-1`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнено, до 5 еталонних зображень
- Підтримує `size`
- Поточне OpenAI-специфічне застереження: OpenClaw наразі не пересилає перевизначення `aspectRatio` або
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

Див. [Генерація зображень](/uk/tools/image-generation) щодо параметрів спільного інструмента,
вибору провайдера та поведінки failover.

## Генерація відео

Вбудований плагін `openai` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `openai/sora-2`
- Режими: текст-у-відео, зображення-у-відео та потоки посилання/редагування одного відео
- Поточні обмеження: 1 зображення або 1 відео як вхідне посилання
- Поточне OpenAI-специфічне застереження: OpenClaw наразі пересилає лише перевизначення `size`
  для нативної генерації відео OpenAI. Непідтримувані необов’язкові перевизначення,
  такі як `aspectRatio`, `resolution`, `audio` і `watermark`, ігноруються
  і повертаються як попередження інструмента.

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

Див. [Генерація відео](/uk/tools/video-generation) щодо параметрів спільного інструмента,
вибору провайдера та поведінки failover.

## Варіант B: підписка OpenAI Code (Codex)

**Найкраще для:** використання доступу за підпискою ChatGPT/Codex замість ключа API.
Codex cloud вимагає входу через ChatGPT, тоді як Codex CLI підтримує вхід через ChatGPT або ключ API.

### Налаштування CLI (Codex OAuth)

```bash
# Запустити Codex OAuth у майстрі
openclaw onboard --auth-choice openai-codex

# Або запустити OAuth безпосередньо
openclaw models auth login --provider openai-codex
```

### Фрагмент конфігурації (підписка Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

У поточній документації Codex від OpenAI вказано `gpt-5.4` як поточну модель Codex. OpenClaw
відображає її як `openai-codex/gpt-5.4` для використання через OAuth ChatGPT/Codex.

Якщо під час onboarding повторно використовується наявний вхід Codex CLI, ці облікові дані
і далі керуються Codex CLI. Після завершення строку дії OpenClaw спочатку повторно зчитує зовнішнє джерело Codex
і, коли провайдер може його оновити, записує оновлені облікові дані
назад до сховища Codex замість того, щоб брати їх під керування в окремій копії
лише для OpenClaw.

Якщо ваш обліковий запис Codex має право на Codex Spark, OpenClaw також підтримує:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw розглядає Codex Spark як доступний лише для Codex. Він не надає прямий
шлях за ключем API `openai/gpt-5.3-codex-spark`.

OpenClaw також зберігає `openai-codex/gpt-5.3-codex-spark`, коли його виявляє `pi-ai`.
Розглядайте його як такий, що залежить від прав доступу, й експериментальний: Codex Spark
окремий від GPT-5.4 `/fast`, а доступність залежить від облікового запису Codex /
ChatGPT, під яким виконано вхід.

### Ліміт вікна контексту Codex

OpenClaw розглядає метадані моделі Codex і обмеження контексту під час виконання як окремі
значення.

Для `openai-codex/gpt-5.4`:

- нативне `contextWindow`: `1050000`
- обмеження `contextTokens` під час виконання за замовчуванням: `272000`

Це зберігає правдивість метаданих моделі, водночас залишаючи менше вікно за замовчуванням
під час виконання, яке на практиці має кращі характеристики затримки та якості.

Якщо ви хочете інше фактичне обмеження, задайте `models.providers.<provider>.models[].contextTokens`:

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

OpenClaw використовує `pi-ai` для потокової передачі моделі. Для `openai/*` і
`openai-codex/*` транспорт за замовчуванням — `"auto"` (спочатку WebSocket, потім
резервний перехід на SSE).

У режимі `"auto"` OpenClaw також повторює одну ранню придатну до повтору помилку WebSocket
перед переходом на SSE. Примусовий режим `"websocket"` і далі безпосередньо показує помилки транспорту
замість того, щоб приховувати їх за резервним переходом.

Після помилки підключення або помилки WebSocket на ранньому ході в режимі `"auto"` OpenClaw позначає
шлях WebSocket для цього сеансу як деградований приблизно на 60 секунд і надсилає
наступні ходи через SSE під час охолодження замість безладного перемикання
між транспортами.

Для нативних кінцевих точок сімейства OpenAI (`openai/*`, `openai-codex/*` і Azure
OpenAI Responses) OpenClaw також додає стабільний стан ідентичності сеансу та ходу
до запитів, щоб повтори, перепідключення та резервний перехід на SSE залишалися прив’язаними до тієї самої
ідентичності розмови. На нативних маршрутах сімейства OpenAI це включає стабільні заголовки
ідентичності запиту сеансу/ходу, а також відповідні метадані транспорту.

OpenClaw також нормалізує лічильники використання OpenAI між варіантами транспорту перед тим,
як вони потрапляють до поверхонь сеансу/статусу. Нативний трафік OpenAI/Codex Responses може
повідомляти використання як `input_tokens` / `output_tokens` або
`prompt_tokens` / `completion_tokens`; OpenClaw розглядає їх як однакові лічильники
вхідних і вихідних токенів для `/status`, `/usage` і журналів сеансів. Коли нативний
трафік WebSocket не містить `total_tokens` (або повідомляє `0`), OpenClaw повертається до
нормалізованої суми вхідних і вихідних токенів, щоб відображення сеансу/статусу залишалися заповненими.

Ви можете задати `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: примусово використовувати SSE
- `"websocket"`: примусово використовувати WebSocket
- `"auto"`: спробувати WebSocket, потім перейти на SSE

Для `openai/*` (Responses API) OpenClaw також за замовчуванням увімкнув попередній прогрів WebSocket (`openaiWsWarmup: true`), коли використовується транспорт WebSocket.

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

### Попередній прогрів OpenAI WebSocket

У документації OpenAI попередній прогрів описано як необов’язковий. OpenClaw вмикає його за замовчуванням для
`openai/*`, щоб зменшити затримку першого ходу при використанні транспорту WebSocket.

### Вимкнення попереднього прогріву

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

### Явне увімкнення попереднього прогріву

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

### Пріоритетна обробка для OpenAI і Codex

API OpenAI надає пріоритетну обробку через `service_tier=priority`. У
OpenClaw задайте `agents.defaults.models["<provider>/<model>"].params.serviceTier`,
щоб передавати це поле далі на нативні кінцеві точки OpenAI/Codex Responses.

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

OpenClaw пересилає `params.serviceTier` як у прямі запити Responses `openai/*`,
так і в запити Codex Responses `openai-codex/*`, коли ці моделі вказують
на нативні кінцеві точки OpenAI/Codex.

Важлива поведінка:

- прямий `openai/*` має бути спрямований на `api.openai.com`
- `openai-codex/*` має бути спрямований на `chatgpt.com/backend-api`
- якщо ви маршрутизуєте будь-якого з цих провайдерів через інший базовий URL або проксі, OpenClaw залишає `service_tier` без змін

### Швидкий режим OpenAI

OpenClaw надає спільний перемикач швидкого режиму для сеансів `openai/*` і
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Конфігурація: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Коли швидкий режим увімкнено, OpenClaw відображає його на пріоритетну обробку OpenAI:

- прямі виклики Responses `openai/*` до `api.openai.com` надсилають `service_tier = "priority"`
- виклики Responses `openai-codex/*` до `chatgpt.com/backend-api` також надсилають `service_tier = "priority"`
- наявні значення `service_tier` у payload зберігаються
- швидкий режим не переписує `reasoning` або `text.verbosity`

Зокрема для GPT 5.4 найпоширеніше налаштування таке:

- надіслати `/fast on` у сеансі, що використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`
- або задати `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- якщо ви також використовуєте Codex OAuth, задайте `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true` також

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

Перевизначення сеансу мають пріоритет над конфігурацією. Очищення перевизначення сеансу в UI Sessions
повертає сеанс до налаштованого значення за замовчуванням.

### Нативні OpenAI-маршрути проти OpenAI-сумісних маршрутів

OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI
порівняно з типовими OpenAI-сумісними проксі `/v1`:

- нативні маршрути `openai/*`, `openai-codex/*` і Azure OpenAI зберігають
  `reasoning: { effort: "none" }` без змін, коли ви явно вимикаєте reasoning
- для нативних маршрутів сімейства OpenAI схеми інструментів за замовчуванням працюють у strict mode
- приховані заголовки атрибуції OpenClaw (`originator`, `version` і
  `User-Agent`) додаються лише на перевірених нативних хостах OpenAI
  (`api.openai.com`) і нативних хостах Codex (`chatgpt.com/backend-api`)
- нативні маршрути OpenAI/Codex зберігають OpenAI-специфічне формування запиту, таке як
  `service_tier`, `store` у Responses, OpenAI payload сумісності reasoning і
  підказки для кешу prompt
- маршрути OpenAI-compatible у стилі проксі зберігають вільнішу поведінку сумісності й
  не примушують strict-схеми інструментів, нативне формування запитів або приховані
  заголовки атрибуції OpenAI/Codex

Azure OpenAI залишається в категорії нативної маршрутизації щодо транспорту та
поведінки сумісності, але не отримує приховані заголовки атрибуції OpenAI/Codex.

Це зберігає поточну поведінку нативного OpenAI Responses без примусового
накладання старих OpenAI-compatible shim на сторонні бекенди `/v1`.

### Серверна компактація OpenAI Responses

Для прямих моделей OpenAI Responses (`openai/*`, що використовують `api: "openai-responses"` з
`baseUrl` на `api.openai.com`) OpenClaw тепер автоматично вмикає підказки payload для
серверної компактації OpenAI:

- Примусово задає `store: true` (якщо compat моделі не задає `supportsStore: false`)
- Інжектує `context_management: [{ type: "compaction", compact_threshold: ... }]`

За замовчуванням `compact_threshold` становить `70%` від `contextWindow` моделі (або `80000`,
якщо значення недоступне).

### Явне увімкнення серверної компактації

Використовуйте це, коли хочете примусово інжектувати `context_management` для сумісних
моделей Responses (наприклад, Azure OpenAI Responses):

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

### Увімкнення з користувацьким порогом

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

### Вимкнення серверної компактації

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
Прямі моделі OpenAI Responses і далі примусово задають `store: true`, якщо compat не встановлює
`supportsStore: false`.

## Примітки

- Посилання на моделі завжди використовують `provider/model` (див. [/concepts/models](/uk/concepts/models)).
- Докладно про автентифікацію та правила повторного використання — у [/concepts/oauth](/uk/concepts/oauth).
