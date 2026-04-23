---
read_when:
    - Ви хочете використовувати комплектний harness app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний PI для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T23:02:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f226a959bfbc860bd239d14f8363808dbb6a1e46e5475d0bd9b36b6837d6bba1
    source_path: plugins/codex-harness.md
    workflow: 15
---

Комплектний plugin `codex` дає змогу OpenClaw запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex володів низькорівневою сесією агента: виявленням
моделей, нативним відновленням гілок, нативним Compaction і виконанням app-server.
OpenClaw і далі володіє чат-каналами, файлами сесій, вибором моделі, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом стенограми.

Нативні ходи Codex також дотримуються спільних hook plugin, тож prompt-шари,
автоматизація з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу
залишаються узгодженими з harness PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Комплектні plugin також можуть реєструвати factory розширення app-server Codex, щоб додавати
асинхронне middleware `tool_result`.

Harness вимкнено за замовчуванням. У нових конфігураціях слід зберігати canonical-посилання на моделі OpenAI як `openai/gpt-*` і явно примусово вказувати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, якщо потрібне нативне виконання через app-server. Застарілі посилання на моделі `codex/*` і далі автоматично вибирають
harness для сумісності.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, коли вам потрібна
автентифікація Codex OAuth через PI; використовуйте `openai/*`, коли вам потрібен прямий доступ до API OpenAI або
коли ви примусово використовуєте нативний harness app-server Codex:

| Посилання на модель                                    | Шлях runtime                                | Використовуйте, коли                                                         |
| ------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                       | Provider OpenAI через логіку OpenClaw/PI    | Вам потрібен поточний прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                 | OpenAI Codex OAuth через OpenClaw/PI        | Вам потрібна автентифікація підписки ChatGPT/Codex із типовим runner PI.     |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"`  | Harness app-server Codex                    | Вам потрібне нативне виконання app-server Codex для вбудованого ходу агента. |

GPT-5.5 зараз в OpenClaw доступний лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для PI OAuth або `openai/gpt-5.5` з harness
app-server Codex. Прямий доступ за API-ключем для `openai/gpt-5.5` підтримуватиметься,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` і далі приймаються як сумісні псевдоніми. Нові конфігурації
PI Codex OAuth мають використовувати `openai-codex/gpt-*`; нові конфігурації нативного
harness app-server мають використовувати `openai/gpt-*` разом із `embeddedHarness.runtime:
"codex"`.

Використовуйте `/status`, щоб підтвердити фактичний harness для поточної сесії. Якщо
вибір видається неочікуваним, увімкніть debug-логування для підсистеми `agents/harness`
і перевірте структурований запис gateway `agent harness selected`. Він
містить ідентифікатор вибраного harness, причину вибору, політику runtime/fallback і,
у режимі `auto`, результат підтримки кожного кандидата plugin.

Вибір harness не є засобом живого керування сесією. Коли виконується вбудований хід,
OpenClaw записує ідентифікатор вибраного harness у цю сесію та продовжує використовувати його для
наступних ходів у межах того самого ідентифікатора сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, якщо хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між PI і Codex. Це запобігає відтворенню однієї стенограми через дві
несумісні нативні системи сесій.

Застарілі сесії, створені до закріплення harness, вважаються закріпленими за PI, щойно в них
з’являється історія стенограми. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на
Codex після зміни конфігурації.

`/status` показує фактичний harness, відмінний від PI, поруч із `Fast`, наприклад
`Fast · codex`. Типовий harness PI і далі відображається як `Runner: pi (embedded)` і
не додає окремий значок harness.

## Вимоги

- OpenClaw із доступним комплектним plugin `codex`.
- App-server Codex `0.118.0` або новіший.
- Автентифікація Codex, доступна процесу app-server.

Plugin блокує старіші або безверсійні handshake app-server. Це дає змогу
OpenClaw залишатися на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також із необов’язкових файлів CLI Codex, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть комплектний plugin і примусово задайте harness `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Якщо у вашій конфігурації використовується `plugins.allow`, додайте туди також `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Застарілі конфігурації, які задають `agents.defaults.model` або модель агента як
`codex/<model>`, і далі автоматично вмикають комплектний plugin `codex`. У нових конфігураціях слід
віддавати перевагу `openai/<model>` разом із явним записом `embeddedHarness`, наведеним вище.

## Додати Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
PI — для всього іншого. Для нових конфігурацій віддавайте перевагу явному `runtime: "codex"` для
агентів, які мають використовувати цей harness.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

За такої структури:

- `/model gpt` або `/model openai/gpt-5.5` використовує harness app-server Codex для цієї конфігурації.
- `/model opus` використовує шлях provider Anthropic.
- Якщо вибрано модель, відмінну від Codex, PI залишається сумісним harness.

## Розгортання лише з Codex

Вимкніть fallback на PI, якщо потрібно гарантувати, що кожен вбудований хід агента використовує
harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Перевизначення через середовище:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли fallback вимкнено, OpenClaw завершується раніше з помилкою, якщо plugin Codex вимкнено,
app-server надто старий або app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити одного агента лише для Codex, тоді як типовий агент зберігатиме звичайний
автовибір:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Використовуйте звичайні команди сесій для перемикання агентів і моделей. `/new` створює нову
сесію OpenClaw, а harness Codex створює або відновлює свою sidecar-гілку app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цієї гілки
і дає змогу наступному ходу знову визначити harness із поточної конфігурації.

## Виявлення моделей

За замовчуванням plugin Codex запитує в app-server доступні моделі. Якщо
виявлення завершується помилкою або перевищує час очікування, він використовує комплектний резервний каталог для:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Ви можете налаштувати виявлення в `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалося опитування Codex і використовувався
лише резервний каталог:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Підключення app-server і політика

За замовчуванням plugin локально запускає Codex командою:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це довірена поза локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних запитах погодження, коли нікому відповісти.

Щоб увімкнути погодження Codex, які перевіряє guardian, задайте `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian — це нативний reviewer погоджень Codex. Коли Codex просить вийти із sandbox, записувати поза робочим простором або додати дозволи на кшталт мережевого доступу, Codex спрямовує цей запит на погодження reviewer-підагенту замість людського prompt. Reviewer застосовує рамку ризиків Codex і погоджує або відхиляє конкретний запит. Використовуйте Guardian, якщо вам потрібно більше запобіжників, ніж у режимі YOLO, але при цьому потрібно, щоб автономні агенти могли рухатися далі без нагляду.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики все одно мають пріоритет над `mode`, тож у розширених розгортаннях можна змішувати цей пресет із явними виборами.

Для вже запущеного app-server використовуйте транспорт WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Підтримувані поля `appServer`:

| Поле                | Значення за замовчуванням                 | Значення                                                                                                  |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`               | не задано                                | URL app-server WebSocket.                                                                                 |
| `authToken`         | не задано                                | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                  | Час очікування для викликів control-plane app-server.                                                     |
| `mode`              | `"yolo"`                                 | Пресет для YOLO або виконання з перевіркою guardian.                                                      |
| `approvalPolicy`    | `"never"`                                | Нативна політика погоджень Codex, яка надсилається при старті/відновленні гілки/ході.                    |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, який надсилається під час старту/відновлення гілки.                         |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти prompt.                    |
| `serviceTier`       | не задано                                | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Недійсні застарілі значення ігноруються. |

Старі змінні середовища все ще працюють як резервні для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
є кращим варіантом для відтворюваних розгортань, оскільки вона зберігає поведінку plugin в
одному перевіреному файлі разом з рештою налаштування harness Codex.

## Поширені рецепти

Локальний Codex з типовим транспортом stdio:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Перевірка harness лише з Codex, із вимкненим fallback на PI:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Погодження Codex, які перевіряє Guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Віддалений app-server з явними заголовками:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw під’єднано
до наявної гілки Codex, наступний хід знову надсилає до
app-server поточну вибрану модель OpenAI, provider, політику погоджень, sandbox і рівень сервісу.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає прив’язку до гілки, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Комплектний plugin реєструє `/codex` як авторизовану slash-команду. Вона
є універсальною та працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує стан живого підключення до app-server, моделі, обліковий запис, обмеження частоти, сервери MCP і Skills.
- `/codex models` показує список живих моделей app-server Codex.
- `/codex threads [filter]` показує список нещодавніх гілок Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявної гілки Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаної гілки.
- `/codex review` запускає нативну перевірку Codex для приєднаної гілки.
- `/codex account` показує стан облікового запису та обмежень частоти.
- `/codex mcp` показує список станів серверів MCP app-server Codex.
- `/codex skills` показує список Skills app-server Codex.

`/codex resume` записує той самий файл прив’язки sidecar, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цю гілку Codex, передає до
app-server поточну вибрану модель OpenClaw і зберігає ввімкненою розширену історію.

Поверхня команд потребує app-server Codex `0.118.0` або новішого. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або користувацький app-server не надає цей JSON-RPC-метод.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі формує список інструментів і отримує динамічні результати інструментів із
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів обміну повідомленнями
продовжують проходити звичайним шляхом доставки OpenClaw.

Запити погодження для інструментів MCP Codex маршрутизуються через потік погодження plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на погодження та довільне введення й далі завершуються помилкою за замовчуванням.

Коли вибрана модель використовує harness Codex, нативний Compaction гілки делегується
app-server Codex. OpenClaw зберігає дзеркало стенограми для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало містить
prompt користувача, фінальний текст помічника та легковагі записи міркувань або плану Codex, коли app-server їх видає. Наразі OpenClaw лише записує сигнали початку й завершення нативного Compaction. Він іще не показує
людинозрозуміле зведення Compaction або аудитний список того, які записи Codex
залишив після Compaction.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування provider/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` з `embeddedHarness.runtime: "codex"` (або
застаріле посилання `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не бере на себе запуск,
OpenClaw може використовувати PI як сумісний backend. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися помилкою, коли жоден harness plugin не підходить. Щойно
app-server Codex вибрано, його помилки відображаються напряму без додаткової
конфігурації fallback.

**App-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель, відмінна від Codex, використовує PI:** це очікувана поведінка, якщо ви не примусово задали
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
посилання `openai/gpt-*` та інші посилання provider залишаються на своєму стандартному шляху provider.

## Пов’язано

- [Plugin Harness агента](/uk/plugins/sdk-agent-harness)
- [Provider моделей](/uk/concepts/model-providers)
- [Довідка з конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
