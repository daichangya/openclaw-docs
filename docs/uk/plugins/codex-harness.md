---
read_when:
    - Ви хочете використовувати вбудований harness app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути fallback до PI для розгортань лише з Codex
summary: Запускайте ходи вбудованого агента OpenClaw через вбудований harness app-server Codex
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T19:25:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99ca00550be4e41aa154a99298e3e1b027f8199d541249149cb0ec722e035876
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Вбудований Plugin `codex` дає OpenClaw змогу запускати ходи вбудованого агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоків, нативним Compaction і виконанням app-server.
OpenClaw усе ще керує чат-каналами, файлами сесій, вибором моделей, інструментами,
підтвердженнями, доставкою медіа та видимим дзеркалом transcript.

Нативні ходи Codex також дотримуються спільних хуків Plugin, тож shim-и prompt,
автоматизація з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу
залишаються узгодженими з harness PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Вбудовані Plugin також можуть реєструвати factory розширення app-server Codex для додавання
асинхронного middleware `tool_result`.

Harness вимкнено за замовчуванням. Його вибирають лише тоді, коли Plugin `codex`
увімкнено і резолвлена модель є моделлю `codex/*`, або коли ви явно
примусово задаєте `embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local
і custom provider зберігають поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у форматі OpenAI та Codex:

| Посилання на модель     | Шлях runtime                                 | Використовуйте, коли                                                      |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.5`        | Провайдер OpenAI через логіку OpenClaw/PI    | Вам потрібен прямий доступ до OpenAI Platform API через `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`  | Провайдер OpenAI Codex OAuth через PI        | Вам потрібен ChatGPT/Codex OAuth без harness app-server Codex.            |
| `codex/gpt-5.5`         | Вбудований провайдер Codex плюс Codex harness | Вам потрібне нативне виконання app-server Codex для ходу вбудованого агента. |

Codex harness обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

Вибір harness не є механізмом керування live-сесією. Коли виконується вбудований хід,
OpenClaw записує id вибраного harness у цю сесію і продовжує використовувати його
для наступних ходів у межах того самого id сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням
наявної розмови між PI і Codex. Це запобігає відтворенню одного transcript через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до появи фіксації harness, вважаються прив’язаними до PI, щойно вони
мають історію transcript. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на
Codex після зміни конфігурації.

`/status` показує фактичний non-PI harness поруч із `Fast`, наприклад
`Fast · codex`. Harness PI за замовчуванням не показується.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- App-server Codex версії `0.118.0` або новіший.
- Auth Codex, доступна процесу app-server.

Plugin блокує старіші або безверсійні handshake app-server. Це гарантує, що
OpenClaw працює з поверхнею протоколу, з якою його було протестовано.

Для live і Docker smoke-тестів auth зазвичай надходить із `OPENAI_API_KEY`, разом із
необов’язковими файлами CLI Codex, такими як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі auth-матеріали, що й ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `codex/gpt-5.5`, увімкніть вбудований Plugin і примусово задайте harness `codex`:

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
      model: "codex/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Якщо у вашій конфігурації використовується `plugins.allow`, додайте туди й `codex`:

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

Задання `agents.defaults.model` або моделі агента як `codex/<model>` також
автоматично вмикає вбудований Plugin `codex`. Явний запис Plugin усе ще
корисний у спільних конфігураціях, бо робить намір розгортання очевидним.

## Додати Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете використовувати Codex для моделей `codex/*`, а PI — для
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
        primary: "codex/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.5": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.5": { alias: "gpt" },
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

У такій конфігурації:

- `/model codex` або `/model codex/gpt-5.5` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.5` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, PI залишається сумісним harness.

## Розгортання лише з Codex

Вимкніть fallback до PI, якщо вам потрібно гарантувати, що кожен хід вбудованого агента використовує
Codex harness:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.5",
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

Якщо fallback вимкнено, OpenClaw завершується помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
потрібна модель не є посиланням `codex/*`, app-server надто старий або
app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити один агент лише для Codex, тоді як агент за замовчуванням збереже звичайний
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
        model: "codex/gpt-5.5",
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
сесію OpenClaw, а Codex harness створює або відновлює свій sidecar app-server
потік за потреби. `/reset` очищає прив’язку сесії OpenClaw до цього потоку
і дає змогу наступному ходу знову визначити harness з поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex запитує в app-server доступні моделі. Якщо
виявлення не вдається або перевищує час очікування, використовується вбудований fallback-каталог:

- `codex/gpt-5.5`
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

Вимкніть виявлення, якщо хочете, щоб під час запуску OpenClaw не опитував Codex і використовував лише
fallback-каталог:

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

За замовчуванням Plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії Codex harness у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це довірена позиція локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних prompt підтвердження, коли нікому відповісти.

Щоб увімкнути підтвердження Codex, перевірені guardian, задайте `appServer.mode:
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

Guardian — це нативний reviewer підтверджень Codex. Коли Codex просить вийти з sandbox, записати поза workspace або додати дозволи, як-от доступ до мережі, Codex спрямовує цей запит на підтвердження reviewer-субагенту, а не людині через prompt. Reviewer застосовує систему оцінки ризику Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, якщо вам потрібні жорсткіші обмеження, ніж у режимі YOLO, але ви все одно хочете, щоб агенти без нагляду могли просуватися далі.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики все одно перевизначають `mode`, тож складні розгортання можуть поєднувати пресет із явними параметрами.

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

| Поле                | За замовчуванням                         | Значення                                                                                                  |
| ------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                               | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                               | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`               | не задано                               | URL app-server WebSocket.                                                                                 |
| `authToken`         | не задано                               | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                    | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                 | Тайм-аут для викликів control-plane до app-server.                                                        |
| `mode`              | `"yolo"`                                | Пресет для виконання в режимі YOLO або з перевіркою guardian.                                             |
| `approvalPolicy`    | `"never"`                               | Нативна політика підтверджень Codex, що надсилається під час запуску/відновлення потоку/ходу.            |
| `sandbox`           | `"danger-full-access"`                  | Нативний режим sandbox Codex, що надсилається під час запуску/відновлення потоку.                         |
| `approvalsReviewer` | `"user"`                                | Використовуйте `"guardian_subagent"`, щоб Codex Guardian перевіряв prompt підтвердження.                  |
| `serviceTier`       | не задано                               | Необов’язковий service tier app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища все ще працюють як fallback для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
є кращим варіантом для відтворюваних розгортань, оскільки зберігає поведінку Plugin в
одному перевіреному файлі разом з рештою налаштувань Codex harness.

## Типові рецепти

Локальний Codex зі стандартним транспортом stdio:

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

Перевірка harness лише для Codex, із вимкненим fallback до PI:

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

Підтвердження Codex із перевіркою guardian:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw прив’язано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточну вибрану модель `codex/*`, провайдера, політику підтверджень, sandbox і service tier.
Перемикання з `codex/gpt-5.5` на `codex/gpt-5.2` зберігає прив’язку до
потоку, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Вбудований Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює в будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує live-підключення до app-server, моделі, акаунт, rate limits, сервери MCP і skills.
- `/codex models` показує список live-моделей app-server Codex.
- `/codex threads [filter]` показує список нещодавніх потоків Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction прив’язаного потоку.
- `/codex review` запускає нативну перевірку Codex для прив’язаного потоку.
- `/codex account` показує стан акаунта й rate-limit.
- `/codex mcp` показує стан MCP-серверів app-server Codex.
- `/codex skills` показує Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. На наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw `codex/*` до app-server і залишає розширену
історію ввімкненою.

Поверхня команд вимагає app-server Codex версії `0.118.0` або новішої. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або власний app-server не надає цього JSON-RPC-методу.

## Інструменти, медіа та Compaction

Codex harness змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, підтвердження та вивід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на підтвердження інструментів MCP Codex маршрутизуються через потік підтверджень Plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на підтвердження та довільне введення, як і раніше, безумовно відхиляються.

Коли вибрана модель використовує Codex harness, нативний Compaction потоку
делегується app-server Codex. OpenClaw зберігає дзеркало transcript для історії
каналу, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
включає prompt користувача, фінальний текст асистента та полегшені записи reasoning або плану Codex, коли app-server їх надсилає. Наразі OpenClaw лише
записує сигнали початку і завершення нативного Compaction. Він поки що не показує
людинозрозуміле резюме Compaction або придатний для аудиту список того, які записи Codex
зберіг після Compaction.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден Codex harness не обробляє запуск,
OpenClaw може використати PI як сумісний backend. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб отримувати помилку, коли жоден Plugin harness не підходить. Щойно
буде вибрано app-server Codex, його збої відображатимуться напряму без додаткової
конфігурації fallback.

**App-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server підтримує ту саму версію протоколу app-server Codex.

**Не-Codex модель використовує PI:** це очікувано. Codex harness обробляє лише
посилання на моделі `codex/*`.

## Пов’язане

- [Plugin harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник з конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
