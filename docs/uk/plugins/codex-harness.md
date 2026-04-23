---
read_when:
    - Ви хочете використовувати комплектний harness app-server Codex.
    - Вам потрібні посилання на модель Codex і приклади конфігурації.
    - Ви хочете вимкнути резервне перемикання на PI для розгортань лише з Codex.
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний harness app-server Codex.
title: harness Codex
x-i18n:
    generated_at: "2026-04-23T21:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27b7b662c5eb2002fed8d2c752c4227a46a89d767ac838138327e64df84e4919
    source_path: plugins/codex-harness.md
    workflow: 15
---

Комплектний Plugin `codex` дозволяє OpenClaw виконувати вбудовані ходи агента через app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням потоку, нативним Compaction і виконанням через app-server.
OpenClaw, як і раніше, керує каналами чату, файлами сесій, вибором моделей, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex також поважають спільні хуки Plugin, тож shim-и промптів,
автоматизація з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу залишаються
узгодженими з harness PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Комплектні plugins також можуть реєструвати factory розширення app-server Codex, щоб додавати
асинхронний middleware `tool_result`.

harness вимкнено за замовчуванням. Нові конфігурації мають зберігати посилання на моделі OpenAI
канонічними як `openai/gpt-*` і явно примусово встановлювати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли їм
потрібне нативне виконання через app-server. Застарілі посилання на моделі `codex/*` усе ще автоматично вибирають
harness для сумісності.

## Виберіть правильний префікс моделі

Тепер OpenClaw зберігає посилання на моделі OpenAI GPT канонічними як `openai/*`:

| Посилання на модель                                 | Шлях runtime                                 | Використовуйте, коли                                                    |
| --------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.5`                                    | Провайдер OpenAI через інфраструктуру OpenClaw/PI | Ви хочете прямий доступ до OpenAI Platform API за допомогою `OPENAI_API_KEY`. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness app-server Codex                     | Ви хочете нативне виконання через app-server Codex для вбудованого ходу агента. |

Застарілі посилання `openai-codex/gpt-*` і `codex/gpt-*` як і раніше приймаються як
аліаси сумісності, але нові приклади в документації/конфігурації мають використовувати `openai/gpt-*`.

Використовуйте `/status`, щоб підтвердити ефективний harness для поточної сесії. Якщо
вибір виглядає неочікуваним, увімкніть журналювання налагодження для підсистеми `agents/harness`
і перегляньте структурований запис gateway `agent harness selected`. Він
містить ідентифікатор вибраного harness, причину вибору, політику runtime/fallback і,
у режимі `auto`, результат підтримки кожного кандидата Plugin.

Вибір harness не є елементом керування живою сесією. Коли виконується вбудований хід,
OpenClaw записує ідентифікатор вибраного harness у цю сесію і продовжує використовувати його для
наступних ходів у тому самому ідентифікаторі сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між PI і Codex. Це дозволяє уникнути відтворення одного транскрипту через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до закріплення harness, вважаються закріпленими за PI, щойно в них
з’являється історія транскрипту. Використовуйте `/new` або `/reset`, щоб перевести цю розмову на
Codex після зміни конфігурації.

`/status` показує ефективний не-PI harness поруч із `Fast`, наприклад
`Fast · codex`. harness PI за замовчуванням і далі відображається як `Runner: pi (embedded)` і
не додає окремого бейджа harness.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- app-server Codex `0.118.0` або новіший.
- Автентифікація Codex, доступна процесу app-server.

Plugin блокує старіші або безверсійні handshake app-server. Це гарантує, що
OpenClaw працює з поверхнею протоколу, на якій його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі автентифікаційні матеріали, що й ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть комплектний Plugin і примусово встановіть harness `codex`:

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

Застарілі конфігурації, які встановлюють `agents.defaults.model` або модель агента як
`codex/<model>`, як і раніше автоматично вмикають комплектний Plugin `codex`. Нові конфігурації мають
надавати перевагу `openai/<model>` разом із явним записом `embeddedHarness`, наведеним вище.

## Додайте Codex, не замінюючи інші моделі

Зберігайте `runtime: "auto"`, якщо хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
PI — для всього іншого. Для нових конфігурацій надавайте перевагу явному `runtime: "codex"` для
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
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть fallback на PI, коли вам потрібно гарантувати, що кожен вбудований хід агента використовує
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

Перевизначення через змінні середовища:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Якщо fallback вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server занадто старий або app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити один агент лише для Codex, тоді як агент за замовчуванням зберігатиме звичайний
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

Використовуйте звичайні команди сесії, щоб перемикати агентів і моделі. `/new` створює нову
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar app-server
потік за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього потоку
і дозволяє наступному ходу знову визначити harness із поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex запитує в app-server доступні моделі. Якщо
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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалося зондування Codex і використовувався
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

## Підключення app-server і політика

За замовчуванням Plugin запускає Codex локально за допомогою:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних запитах на погодження, на які нікому відповідати.

Щоб увімкнути погодження Codex, які перевіряє Guardian, встановіть `appServer.mode:
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

Guardian — це нативний рецензент погоджень Codex. Коли Codex просить вийти з sandbox, записати за межі workspace або додати дозволи, як-от доступ до мережі, Codex надсилає цей запит на погодження рецензенту-підагенту замість запиту людині. Рецензент застосовує модель ризиків Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, якщо вам потрібні суворіші запобіжники, ніж у режимі YOLO, але ви все одно хочете, щоб агенти без нагляду могли просуватися далі.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики, як і раніше, перевизначають `mode`, тож у розширених розгортаннях можна поєднувати цей пресет із явними параметрами.

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
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`               | не задано                                | URL app-server WebSocket.                                                                                 |
| `authToken`         | не задано                                | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                  | Час очікування для викликів control-plane app-server.                                                     |
| `mode`              | `"yolo"`                                 | Пресет для виконання в режимі YOLO або з перевіркою Guardian.                                             |
| `approvalPolicy`    | `"never"`                                | Нативна політика погодження Codex, що надсилається під час запуску/відновлення потоку/ходу.              |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, що надсилається під час запуску/відновлення потоку.                         |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб Guardian Codex перевіряв запити.                                |
| `serviceTier`       | не задано                                | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища, як і раніше, працюють як fallback для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` натомість, або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
є кращим варіантом для відтворюваних розгортань, оскільки вона зберігає поведінку Plugin у
тому самому перевіреному файлі, що й решта налаштування harness Codex.

## Поширені рецепти

Локальний Codex із транспортом stdio за замовчуванням:

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

Перевірка harness лише для Codex із вимкненим fallback на PI:

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

Погодження Codex, перевірені Guardian:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw прив’язано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточну вибрану модель OpenAI, провайдера, політику погодження, sandbox і service tier.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає прив’язку
до потоку, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
універсальною та працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP-сервери та skills.
- `/codex models` показує список поточних моделей app-server Codex.
- `/codex threads [filter]` показує список нещодавніх потоків Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction прив’язаного потоку.
- `/codex review` запускає нативну перевірку Codex для прив’язаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує стан MCP-сервера app-server Codex.
- `/codex skills` показує skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw до app-server і зберігає
увімкнену розширену історію.

Поверхня команд вимагає app-server Codex `0.118.0` або новішої версії. Окремі
методи керування повідомляються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей метод JSON-RPC.

## Інструменти, медіа та Compaction

harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на погодження інструментів MCP Codex маршрутизуються через потік
погодження Plugin в OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на підтвердження та запити на довільне введення, як і раніше, завершуються
безпечною відмовою.

Коли вибрана модель використовує harness Codex, нативний Compaction потоку
делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделей або harness. Дзеркало
включає промпт користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex, коли їх генерує app-server. Наразі OpenClaw записує лише сигнали початку та завершення нативного Compaction. Він поки що не показує
людинозрозумілий підсумок Compaction або перевірний список того, які записи Codex
зберіг після Compaction.

Генерація медіа не вимагає PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа, як і раніше, використовує відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` з `embeddedHarness.runtime: "codex"` (або
застаріле посилання `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не заявляє про запуск,
OpenClaw може використовувати PI як backend сумісності. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися з помилкою, коли не підходить жоден harness Plugin. Щойно
буде вибрано app-server Codex, його помилки відображатимуться безпосередньо без додаткового
налаштування fallback.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Не-Codex модель використовує PI:** це очікувана поведінка, якщо ви не примусово встановили
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
`openai/gpt-*` та посилання інших провайдерів залишаються на своєму стандартному шляху провайдера.

## Пов’язане

- [Plugins harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
