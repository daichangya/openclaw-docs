---
read_when:
    - Ви хочете використовувати вбудований каркас app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервне перемикання на PI для розгортань лише з Codex
summary: Запустіть вбудовані ходи агента OpenClaw через вбудований app-server harness Codex
title: Codex harness
x-i18n:
    generated_at: "2026-04-24T02:43:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56024e68540007c60e2bfcc4d090a788736dc941290cd82ed83b19aadde942d
    source_path: plugins/codex-harness.md
    workflow: 15
---

Вбудований Plugin `codex` дає змогу OpenClaw запускати вбудовані ходи агента через
Codex app-server замість вбудованого каркаса PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоку, нативною Compaction і виконанням через app-server.
OpenClaw як і раніше керує каналами чату, файлами сесій, вибором моделей, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex також враховують спільні хуки Plugin, тож шими підказок,
автоматизація з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу
залишаються узгодженими з каркасом PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Вбудовані плагіни також можуть реєструвати фабрику розширення Codex app-server, щоб додати
асинхронне middleware `tool_result`.

Каркас вимкнений за замовчуванням. У нових конфігураціях слід зберігати канонічні
посилання на моделі OpenAI у форматі `openai/gpt-*` і явно примусово задавати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли потрібне
нативне виконання через app-server. Застарілі посилання на моделі `codex/*` усе ще
автоматично вибирають каркас для сумісності.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI чутливі до префікса. Використовуйте `openai-codex/*`, коли
потрібна автентифікація Codex OAuth через PI; використовуйте `openai/*`, коли потрібен
прямий доступ до OpenAI API або коли ви примусово використовуєте нативний каркас
Codex app-server:

| Посилання на модель                                  | Шлях runtime                                  | Використовуйте, коли                                                       |
| ---------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | Провайдер OpenAI через внутрішню логіку OpenClaw/PI | Вам потрібен актуальний прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OpenAI Codex OAuth через OpenClaw/PI          | Вам потрібна автентифікація підписки ChatGPT/Codex з типовим виконавцем PI. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Каркас Codex app-server                       | Вам потрібне нативне виконання через Codex app-server для вбудованого ходу агента. |

GPT-5.5 зараз у OpenClaw доступна лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для PI OAuth або `openai/gpt-5.5` з каркасом Codex
app-server. Прямий доступ за API-ключем для `openai/gpt-5.5` підтримуватиметься,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` залишаються підтримуваними як псевдоніми для сумісності. У нових конфігураціях PI
Codex OAuth слід використовувати `openai-codex/gpt-*`; у нових конфігураціях нативного
каркаса app-server слід використовувати `openai/gpt-*` разом із `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` дотримується такого самого розділення за префіксом. Використовуйте
`openai-codex/gpt-*`, коли розуміння зображень має виконуватися через шлях провайдера OpenAI
Codex OAuth. Використовуйте `codex/gpt-*`, коли розуміння зображень має виконуватися
через обмежений хід Codex app-server. Модель Codex app-server повинна
заявляти підтримку вхідних зображень; текстові моделі Codex завершуються помилкою ще до
початку медіа-ходу.

Використовуйте `/status`, щоб підтвердити фактичний каркас для поточної сесії. Якщо вибір
виявився неочікуваним, увімкніть налагоджувальне журналювання для підсистеми `agents/harness`
і перегляньте структурований запис gateway `agent harness selected`. Він містить
ідентифікатор вибраного каркаса, причину вибору, політику runtime/резервного перемикання, а
в режимі `auto` — також результат підтримки для кожного кандидата Plugin.

Вибір каркаса не є елементом керування живою сесією. Коли виконується вбудований хід,
OpenClaw записує ідентифікатор вибраного каркаса для цієї сесії й продовжує
використовувати його для наступних ходів з тим самим ідентифікатором сесії. Змінюйте конфігурацію
`embeddedHarness` або `OPENCLAW_AGENT_RUNTIME`, якщо хочете, щоб майбутні сесії використовували інший каркас;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням
наявної розмови між PI і Codex. Це дає змогу уникнути повторного програвання одного
транскрипту через дві несумісні нативні системи сесій.

Застарілі сесії, створені до появи фіксації каркаса, вважаються зафіксованими на PI, щойно вони
мають історію транскрипту. Використовуйте `/new` або `/reset`, щоб перевести цю розмову на
Codex після зміни конфігурації.

`/status` показує фактичний каркас, відмінний від PI, поруч із `Fast`, наприклад
`Fast · codex`. Типовий каркас PI, як і раніше, відображається як `Runner: pi (embedded)` і
не додає окремого значка каркаса.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- Codex app-server версії `0.118.0` або новішої.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старіші або неверсифіковані рукостискання app-server. Це утримує
OpenClaw у межах поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить через `OPENAI_API_KEY`, а також
через необов’язкові файли Codex CLI, такі як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний Codex app-server.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть вбудований Plugin і примусово задайте каркас `codex`:

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
`codex/<model>`, усе ще автоматично вмикають вбудований Plugin `codex`. У нових конфігураціях слід
надавати перевагу `openai/<model>` разом із явним записом `embeddedHarness`, наведеним вище.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
PI використовувався для всього іншого. Для нових конфігурацій краще явно задавати `runtime: "codex"` для
агентів, які мають використовувати цей каркас.

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

За такої форми:

- `/model gpt` або `/model openai/gpt-5.5` використовує каркас Codex app-server для цієї конфігурації.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано модель не Codex, PI залишається каркасом сумісності.

## Розгортання лише з Codex

Вимкніть резервне перемикання на PI, якщо потрібно довести, що кожен вбудований хід агента використовує
каркас Codex:

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

Перевизначення через змінні середовища:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Якщо резервне перемикання вимкнено, OpenClaw завершується помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server занадто старий або app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити одного агента таким, що працює лише з Codex, тоді як типовий агент зберігатиме звичайний
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

Використовуйте звичайні команди сесії для перемикання агентів і моделей. `/new` створює нову
сесію OpenClaw, а каркас Codex за потреби створює або відновлює свій sidecar app-server
потік. `/reset` очищає прив’язку сесії OpenClaw для цього потоку й дозволяє наступному ходу
знову визначити каркас із поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex запитує app-server про доступні моделі. Якщо
виявлення завершується помилкою або перевищує час очікування, він використовує вбудований резервний каталог для:

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалася перевірка Codex і використовувався
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

## Підключення до app-server і політика

За замовчуванням Plugin запускає Codex локально командою:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії каркаса Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, що використовується
для автономних Heartbeat: Codex може використовувати shell та мережеві інструменти без
зупинки на нативних запитах погодження, на які нікому відповідати.

Щоб увімкнути погодження Codex із перевіркою Guardian, задайте `appServer.mode:
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

Guardian — це нативний рецензент погоджень Codex. Коли Codex просить вийти із sandbox, записати поза межами workspace або додати дозволи, як-от мережевий доступ, Codex спрямовує цей запит на погодження рецензенту-субагенту замість запиту людині. Рецензент застосовує модель ризиків Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, коли вам потрібно більше запобіжників, ніж у режимі YOLO, але при цьому потрібно, щоб агенти без нагляду продовжували роботу.

Попереднє налаштування `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики, як і раніше, мають пріоритет над `mode`, тож у розширених розгортаннях можна поєднувати це попереднє налаштування з явними параметрами.

Для app-server, який уже запущено, використовуйте транспорт WebSocket:

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

| Поле                | Значення за замовчуванням                | Значення                                                                                                  |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`               | не задано                                | URL app-server для WebSocket.                                                                             |
| `authToken`         | не задано                                | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                  | Час очікування для викликів control-plane до app-server.                                                  |
| `mode`              | `"yolo"`                                 | Попереднє налаштування для виконання в режимі YOLO або з перевіркою guardian.                             |
| `approvalPolicy`    | `"never"`                                | Нативна політика погодження Codex, що надсилається під час запуску/відновлення потоку/ходу.              |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, що надсилається під час запуску/відновлення потоку.                         |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти запити.                    |
| `serviceTier`       | не задано                                | Необов’язковий рівень сервісу Codex app-server: `"fast"`, `"flex"` або `null`. Неприпустимі застарілі значення ігноруються. |

Старі змінні середовища й надалі працюють як резервний варіант для локального тестування, якщо
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Для
відтворюваних розгортань рекомендовано конфігурацію, оскільки вона зберігає поведінку Plugin у
тому самому перевірюваному файлі, що й решта налаштування каркаса Codex.

## Поширені рецепти

Локальний Codex із типовим транспортом stdio:

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

Перевірка каркаса лише для Codex із вимкненим резервним перемиканням на PI:

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

Погодження Codex із перевіркою Guardian:

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

Віддалений app-server із явними заголовками:

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

Перемикання моделей і далі контролює OpenClaw. Коли сесію OpenClaw приєднано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточну вибрану модель OpenAI, провайдера, політику погодження, sandbox і
рівень сервісу. Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив’язку до потоку, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Вбудований Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
універсальною і працює в будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP-сервери та skills.
- `/codex models` перелічує поточні моделі Codex app-server.
- `/codex threads [filter]` перелічує недавні потоки Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить Codex app-server виконати ущільнення для приєднаного потоку.
- `/codex review` запускає нативну перевірку Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує стан MCP-сервера Codex app-server.
- `/codex skills` перелічує Skills Codex app-server.

`/codex resume` записує той самий sidecar-файл прив’язки, який каркас використовує для
звичайних ходів. Під час наступного повідомлення OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw до app-server і зберігає
увімкнену розширену історію.

Поверхня команд потребує Codex app-server версії `0.118.0` або новішої. Про окремі
методи керування повідомляється як `unsupported by this Codex app-server`, якщо
майбутній або спеціальний app-server не надає цей JSON-RPC метод.

## Інструменти, медіа та Compaction

Каркас Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw як і раніше формує список інструментів і отримує динамічні результати інструментів від
каркаса. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів повідомлень
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на погодження для інструментів Codex MCP спрямовуються через потік погодження Plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на уточнення та запити довільного введення, як і раніше,
завершуються за принципом fail closed.

Коли вибрана модель використовує каркас Codex, нативна Compaction потоку делегується
Codex app-server. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або каркаса. Дзеркало
містить запит користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex,
якщо app-server їх надсилає. Наразі OpenClaw лише записує сигнали початку
та завершення нативної Compaction. Людинозрозумілий підсумок Compaction або
аудитний список записів, які Codex зберіг після ущільнення, поки що не надаються.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` із `embeddedHarness.runtime: "codex"` (або
застаріле посилання `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден каркас Codex не заявляє про підтримку запуску,
OpenClaw може використовувати PI як сумісний бекенд. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися помилкою, коли жоден каркас Plugin не підходить. Щойно
вибрано Codex app-server, його збої відображаються безпосередньо без додаткової
конфігурації резервного перемикання.

**app-server відхиляється:** оновіть Codex, щоб рукостискання app-server
повідомляло версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server використовує ту саму версію протоколу Codex app-server.

**Модель не Codex використовує PI:** це очікувано, якщо ви не примусово задали
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
посилання `openai/gpt-*` та інших провайдерів залишаються на своєму стандартному шляху провайдера.

## Пов’язане

- [Plugins каркаса агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
