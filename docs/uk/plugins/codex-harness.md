---
read_when:
    - Ви хочете використовувати bundled harness app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний варіант Pi для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через bundled harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T07:12:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5eff5a2af66033d575bc05c9f31a23ed0367bedc518dc25364e60a3012bfdff
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Bundled plugin `codex` дає змогу OpenClaw запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness Pi.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням thread, нативною Compaction і виконанням через app-server.
OpenClaw, як і раніше, керує чат-каналами, файлами сесій, вибором моделей, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex також поважають спільні хуки plugin, тож shim-и prompt,
автоматизація з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу залишаються
узгодженими з harness Pi:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Bundled plugins також можуть реєструвати фабрику розширення app-server Codex для додавання
асинхронного middleware `tool_result`, а дзеркальні записи транскрипту Codex маршрутизуються
через `before_message_write`.

За замовчуванням harness вимкнено. Його буде вибрано лише тоді, коли plugin `codex`
увімкнено і визначена модель є моделлю `codex/*`, або коли ви явно
примусово задаєте `embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запуски Pi, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають свою поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у стилі OpenAI та Codex:

| Посилання на модель   | Шлях runtime                               | Використовуйте, коли                                                     |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | Провайдер OpenAI через plumbing OpenClaw/PI | Вам потрібен прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`.    |
| `openai-codex/gpt-5.4` | Провайдер OAuth OpenAI Codex через PI     | Вам потрібен ChatGPT/Codex OAuth без harness app-server Codex.           |
| `codex/gpt-5.4`       | Bundled провайдер Codex плюс harness Codex | Вам потрібне нативне виконання через app-server Codex для вбудованого ходу агента. |

Harness Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

## Вимоги

- OpenClaw з доступним bundled plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старіші або безверсійні handshake app-server. Це утримує
OpenClaw на тій поверхні протоколу, з якою його було протестовано.

Для живих і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
з необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі автентифікаційні матеріали, що й ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `codex/gpt-5.4`, увімкніть bundled plugin і примусово задайте harness `codex`:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Якщо у вашій конфігурації використовується `plugins.allow`, включіть туди також `codex`:

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

Установлення `agents.defaults.model` або моделі агента в `codex/<model>` також
автоматично вмикає bundled plugin `codex`. Явний запис plugin як і раніше
корисний у спільних конфігураціях, бо робить намір розгортання очевидним.

## Додати Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете використовувати Codex для моделей `codex/*`, а Pi — для
всього іншого:

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
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

З такою формою:

- `/model codex` або `/model codex/gpt-5.4` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, Pi залишається сумісним harness.

## Розгортання лише з Codex

Вимкніть резервний варіант Pi, коли потрібно довести, що кожен вбудований хід агента використовує
harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
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

Коли резервний варіант вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо plugin Codex вимкнено,
запитувана модель не є посиланням `codex/*`, app-server надто старий або
app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити один агент лише з Codex, а агент за замовчуванням залишити зі звичайним
автовибором:

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
        model: "codex/gpt-5.4",
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
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar thread app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього thread.

## Виявлення моделей

За замовчуванням plugin Codex запитує app-server про доступні моделі. Якщо
виявлення не вдається або перевищує час очікування, він використовує bundled резервний каталог:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалась перевірка Codex і використовувався
резервний каталог:

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

За замовчуванням plugin локально запускає Codex так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, що використовується
для автономних Heartbeat: Codex може використовувати shell та мережеві інструменти без
зупинки на нативних запитах погодження, на які нікому відповідати.

Щоб увімкнути погодження Codex, що перевіряються guardian, задайте `appServer.mode:
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

Режим guardian розгортається в:

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

Guardian — це нативний reviewer погоджень Codex. Коли Codex просить вийти з
sandbox, писати поза робочим простором або додати дозволи, як-от доступ до мережі,
Codex маршрутизує цей запит на погодження reviewer-субагенту замість запиту людині.
Reviewer збирає контекст і застосовує framework ризиків Codex, а потім
погоджує або відхиляє конкретний запит. Guardian корисний, коли вам потрібні сильніші
обмеження, ніж у режимі YOLO, але при цьому потрібні unattended-агенти й Heartbeat, щоб
продовжувати роботу.

Docker live harness містить перевірку Guardian, коли
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Він запускає harness Codex у
режимі Guardian, перевіряє, що безпечна команда shell з підвищенням дозволів погоджується, і
перевіряє, що завантаження фальшивого секрету в ненадійне зовнішнє призначення відхиляється,
щоб агент повернувся із запитом на явне погодження.

Окремі поля політики все одно мають пріоритет над `mode`, тож розширені розгортання можуть
поєднувати preset з явними налаштуваннями.

Для вже запущеного app-server використовуйте transport WebSocket:

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

| Поле                | Типове значення                            | Значення                                                                                                  |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                  | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                  | Виконуваний файл для transport stdio.                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]`   | Аргументи для transport stdio.                                                                            |
| `url`               | не задано                                  | URL app-server WebSocket.                                                                                 |
| `authToken`         | не задано                                  | Bearer-токен для transport WebSocket.                                                                     |
| `headers`           | `{}`                                       | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                    | Тайм-аут для викликів control-plane app-server.                                                           |
| `mode`              | `"yolo"`                                   | Preset для виконання в режимі YOLO або з перевіркою guardian.                                             |
| `approvalPolicy`    | `"never"`                                  | Нативна політика погодження Codex, що надсилається під час start/resume/turn thread.                     |
| `sandbox`           | `"danger-full-access"`                     | Нативний режим sandbox Codex, що надсилається під час start/resume thread.                                |
| `approvalsReviewer` | `"user"`                                   | Використовуйте `"guardian_subagent"`, щоб дати Codex Guardian перевіряти prompts.                        |
| `serviceTier`       | не задано                                  | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Недійсні застарілі значення ігноруються. |

Старіші змінні середовища все ще працюють як резервні варіанти для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Для
відтворюваних розгортань перевага надається конфігурації, оскільки вона зберігає поведінку plugin
в тому самому перевіреному файлі, що й решта налаштування harness Codex.

## Поширені рецепти

Локальний Codex із типовим transport stdio:

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

Перевірка harness лише з Codex, з вимкненим резервним варіантом Pi:

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

Погодження Codex, перевірені guardian:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw приєднано
до наявного thread Codex, наступний хід знову надсилає до
app-server поточні вибрані `codex/*` модель, провайдера, політику погодження, sandbox і service tier.
Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає
прив’язку до thread, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Bundled plugin реєструє `/codex` як авторизовану slash-команду. Вона є
універсальною і працює в будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує живе підключення до app-server, моделі, обліковий запис, rate limit, MCP-сервери та Skills.
- `/codex models` перелічує моделі живого app-server Codex.
- `/codex threads [filter]` перелічує нещодавні thread Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного thread Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаного thread.
- `/codex review` запускає нативне review Codex для приєднаного thread.
- `/codex account` показує стан облікового запису та rate limit.
- `/codex mcp` перелічує стан MCP-серверів app-server Codex.
- `/codex skills` перелічує Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей thread Codex, передає
поточну вибрану модель OpenClaw `codex/*` до app-server і зберігає
розширену історію ввімкненою.

Поверхня команд вимагає Codex app-server `0.118.0` або новішого. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або користувацький app-server не надає цей JSON-RPC-метод.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на погодження інструментів Codex MCP маршрутизуються через plugin-потік
погодження OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити elicitation і запити довільного введення, як і раніше, відхиляються
за принципом fail-closed.

Коли вибрана модель використовує harness Codex, нативна Compaction thread
делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
містить prompt користувача, фінальний текст помічника та полегшені записи
міркувань або плану Codex, коли app-server їх видає. Наразі OpenClaw лише
записує сигнали початку й завершення нативної Compaction. Він поки не показує
людинозрозумілий підсумок Compaction або придатний для аудиту список того, які записи Codex
залишив після Compaction.

Генерація медіа не потребує Pi. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа, як і раніше, використовує відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує Pi замість Codex:** якщо жоден harness Codex не обробляє запуск,
OpenClaw може використовувати Pi як сумісний бекенд. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб отримувати помилку, коли жоден plugin-harness не збігається. Коли
app-server Codex уже вибрано, його збої відображаються напряму без додаткової
конфігурації резервного варіанту.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**transport WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Не-Codex модель використовує Pi:** це очікувана поведінка. Harness Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язане

- [Agent Harness Plugins](/uk/plugins/sdk-agent-harness)
- [Model Providers](/uk/concepts/model-providers)
- [Configuration Reference](/uk/gateway/configuration-reference)
- [Testing](/uk/help/testing#live-codex-app-server-harness-smoke)
