---
read_when:
    - Ви хочете використовувати комплектний app-server harness Codex
    - Вам потрібні посилання на модель Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід до PI для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний app-server harness Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-21T00:08:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Комплектний plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоку, нативною Compaction і виконанням app-server.
OpenClaw і далі керує каналами чату, файлами сесії, вибором моделі, інструментами,
схваленнями, доставкою медіа та видимим дзеркалом транскрипту.

За замовчуванням harness вимкнений. Він вибирається лише тоді, коли plugin `codex`
увімкнений і розв’язана модель є моделлю `codex/*`, або коли ви явно
примусово задаєте `embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають свою поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у формі OpenAI та Codex:

| Посилання на модель   | Шлях runtime                                | Використовуйте, коли                                                     |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | Провайдер OpenAI через конвеєр OpenClaw/PI  | Вам потрібен прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`.    |
| `openai-codex/gpt-5.4` | Провайдер OpenAI Codex OAuth через PI      | Вам потрібен ChatGPT/Codex OAuth без harness app-server Codex.           |
| `codex/gpt-5.4`       | Комплектний провайдер Codex плюс harness Codex | Вам потрібне нативне виконання app-server Codex для вбудованого ходу агента. |

Harness Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

## Вимоги

- OpenClaw із доступним комплектним plugin `codex`.
- app-server Codex `0.118.0` або новіший.
- Доступна автентифікація Codex для процесу app-server.

Plugin блокує старіші або безверсійні handshake app-server. Це утримує
OpenClaw на поверхні протоколу, з якою його тестували.

Для live і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі дані автентифікації, що й ваш локальний
app-server Codex.

## Мінімальна конфігурація

Використовуйте `codex/gpt-5.4`, увімкніть комплектний plugin і примусово задайте harness `codex`:

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

Установлення `agents.defaults.model` або моделі агента в `codex/<model>` також
автоматично вмикає комплектний plugin `codex`. Явний запис plugin усе ще
корисний у спільних конфігураціях, бо робить намір розгортання очевидним.

## Додайте Codex без заміни інших моделей

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

З такою структурою:

- `/model codex` або `/model codex/gpt-5.4` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано модель не Codex, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть резервний перехід до PI, якщо вам потрібно довести, що кожен вбудований хід агента використовує
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

Коли резервний перехід вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо plugin Codex вимкнений,
потрібна модель не є посиланням `codex/*`, app-server надто старий або
app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити одного агента лише Codex, а для агента за замовчуванням залишити звичайний
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
сесію OpenClaw, а harness Codex за потреби створює або відновлює свій sidecar app-server
потік. `/reset` очищає прив’язку сесії OpenClaw для цього потоку.

## Виявлення моделей

За замовчуванням plugin Codex запитує app-server про доступні моделі. Якщо
виявлення завершується помилкою або спливає час очікування, він використовує комплектний резервний каталог:

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалася перевірка Codex і використовувався
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

За замовчуванням plugin локально запускає Codex командою:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw просить Codex запитувати нативні схвалення. Ви можете додатково
налаштувати цю політику, наприклад посилити її та направляти перевірки через
guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| Поле                | За замовчуванням                           | Значення                                                                 |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                  | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.          |
| `command`           | `"codex"`                                  | Виконуваний файл для транспорту stdio.                                   |
| `args`              | `["app-server", "--listen", "stdio://"]`   | Аргументи для транспорту stdio.                                          |
| `url`               | не задано                                  | URL app-server WebSocket.                                                |
| `authToken`         | не задано                                  | Bearer token для транспорту WebSocket.                                   |
| `headers`           | `{}`                                       | Додаткові заголовки WebSocket.                                           |
| `requestTimeoutMs`  | `60000`                                    | Час очікування для викликів control-plane app-server.                    |
| `approvalPolicy`    | `"on-request"`                             | Нативна політика схвалення Codex, що надсилається до запуску/відновлення/ходу потоку. |
| `sandbox`           | `"workspace-write"`                        | Нативний режим sandbox Codex, що надсилається до запуску/відновлення потоку. |
| `approvalsReviewer` | `"user"`                                   | Використовуйте `"guardian_subagent"`, щоб guardian Codex перевіряв нативні схвалення. |
| `serviceTier`       | не задано                                  | Необов’язковий рівень сервісу Codex, наприклад `"priority"`.             |

Старіші змінні середовища все ще працюють як резервні варіанти для локального тестування, коли
відповідне поле конфігурації не задане:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Для відтворюваних розгортань рекомендовано використовувати конфігурацію.

## Поширені рецепти

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

Перевірка harness лише Codex із вимкненим резервним переходом до PI:

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

Схвалення Codex із перевіркою guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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

Перемикання моделей залишається під контролем OpenClaw. Коли сесію OpenClaw приєднано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточні вибрані `codex/*` модель, провайдера, політику схвалення, sandbox і рівень сервісу.
Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає прив’язку до потоку, але просить Codex
продовжити роботу з новою вибраною моделлю.

## Команда Codex

Комплектний plugin реєструє `/codex` як авторизовану slash-команду. Вона
є загальною і працює на будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує підключення до app-server у реальному часі, моделі, обліковий запис, ліміти швидкості, сервери MCP і skills.
- `/codex models` перелічує моделі app-server Codex у реальному часі.
- `/codex threads [filter]` перелічує нещодавні потоки Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаного потоку.
- `/codex review` запускає нативну перевірку Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` перелічує стан серверів MCP app-server Codex.
- `/codex skills` перелічує skills app-server Codex.

`/codex resume` записує той самий файл sidecar binding, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану в OpenClaw модель `codex/*` до app-server і залишає розширену
історію увімкненою.

Поверхня команд потребує app-server Codex `0.118.0` або новішого. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або custom app-server не надає цей метод JSON-RPC.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі будує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, схвалення та вивід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Коли вибрана модель використовує harness Codex, нативна Compaction потоку
делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
включає запит користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex,
коли їх видає app-server.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw переходить до PI:** задайте `embeddedHarness.fallback: "none"` або
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` під час тестування.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель не Codex використовує PI:** це очікувана поведінка. Harness Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язане

- [Plugins harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
