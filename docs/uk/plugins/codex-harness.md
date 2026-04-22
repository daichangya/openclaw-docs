---
read_when:
    - Ви хочете використовувати комплектний app-server harness Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервне переключення на PI для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний app-server harness Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-22T08:55:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19bc7481bf7cdce983efe70e697f8665ace875d96f126979b95dd3f2f739fa8a
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Комплектний plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоків, нативною Compaction і виконанням app-server.
OpenClaw і далі керує каналами чату, файлами сесій, вибором моделей, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом стенограми.

Цей harness вимкнений за замовчуванням. Він вибирається лише тоді, коли plugin `codex`
увімкнено і визначена модель є моделлю `codex/*`, або коли ви явно примусово задаєте
`embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви взагалі не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у форматі OpenAI і Codex:

| Посилання на модель   | Шлях середовища виконання                   | Коли використовувати                                                    |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Провайдер OpenAI через інфраструктуру OpenClaw/PI | Ви хочете прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`.      |
| `openai-codex/gpt-5.4` | Провайдер OpenAI Codex OAuth через PI      | Ви хочете ChatGPT/Codex OAuth без harness app-server Codex.             |
| `codex/gpt-5.4`       | Комплектний провайдер Codex плюс harness Codex | Ви хочете нативне виконання app-server Codex для вбудованого ходу агента. |

Harness Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

## Вимоги

- OpenClaw із доступним комплектним plugin `codex`.
- App-server Codex версії `0.118.0` або новішої.
- Доступна автентифікація Codex для процесу app-server.

Plugin блокує старіші або безверсійні handshake app-server. Це гарантує, що
OpenClaw працює на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також,
за потреби, з файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі автентифікаційні матеріали, які використовує
ваш локальний app-server Codex.

## Мінімальна конфігурація

Використайте `codex/gpt-5.4`, увімкніть комплектний plugin і примусово задайте harness `codex`:

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

Установлення `agents.defaults.model` або моделі агента у `codex/<model>` також
автоматично вмикає комплектний plugin `codex`. Явний запис plugin і далі корисний
у спільних конфігураціях, бо робить намір розгортання очевидним.

## Додайте Codex без заміни інших моделей

Залиште `runtime: "auto"`, якщо хочете використовувати Codex для моделей `codex/*`, а PI — для
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

За такої форми:

- `/model codex` або `/model codex/gpt-5.4` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано модель не Codex, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть резервне переключення на PI, якщо вам потрібно довести, що кожен вбудований хід агента
використовує harness Codex:

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

Коли fallback вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо plugin Codex вимкнено,
запитана модель не є посиланням `codex/*`, app-server надто старий або
app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити одного агента лише з Codex, тоді як агент за замовчуванням зберігатиме звичайний
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
виявлення не вдається або перевищує час очікування, він використовує комплектний резервний каталог:

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

За замовчуванням plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex повністю без обмежень:
`approvalPolicy: "never"` і `sandbox: "danger-full-access"`. Це відповідає
позиції довіреного локального оператора, що використовується в Codex CLI, і дає змогу
автономним Heartbeat використовувати мережеві та shell-інструменти без очікування
на невидимий нативний шлях погодження. Ви можете посилити цю політику, наприклад
спрямувавши перевірки через guardian:

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

| Поле               | Значення за замовчуванням                  | Значення                                                                |
| ------------------ | ----------------------------------------- | ----------------------------------------------------------------------- |
| `transport`        | `"stdio"`                                 | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.         |
| `command`          | `"codex"`                                 | Виконуваний файл для транспорту stdio.                                  |
| `args`             | `["app-server", "--listen", "stdio://"]`  | Аргументи для транспорту stdio.                                         |
| `url`              | не задано                                 | URL app-server WebSocket.                                               |
| `authToken`        | не задано                                 | Bearer-токен для транспорту WebSocket.                                  |
| `headers`          | `{}`                                      | Додаткові заголовки WebSocket.                                          |
| `requestTimeoutMs` | `60000`                                   | Час очікування для викликів control-plane app-server.                   |
| `approvalPolicy`   | `"never"`                                 | Нативна політика погодження Codex, що надсилається на запуск/відновлення/хід потоку. |
| `sandbox`          | `"danger-full-access"`                    | Нативний режим sandbox Codex, що надсилається під час запуску/відновлення потоку. |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб guardian Codex перевіряв нативні погодження. |
| `serviceTier`      | не задано                                 | Необов’язковий рівень сервісу Codex, наприклад `"priority"`.            |

Старіші змінні середовища й далі працюють як fallback для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Для відтворюваних розгортань перевага надається конфігурації.

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

Перевірка harness лише з Codex із вимкненим fallback на PI:

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

Погодження Codex із перевіркою через guardian:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw приєднано
до наявного потоку Codex, наступний хід знову надсилає до app-server поточну
вибрану модель `codex/*`, провайдера, політику погодження, sandbox і service tier.
Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає прив’язку потоку, але просить Codex
продовжити роботу з новою вибраною моделлю.

## Команда Codex

Комплектний plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює на будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує стан підключення до app-server у реальному часі, моделі, обліковий запис, ліміти швидкості, сервери MCP і Skills.
- `/codex models` показує список моделей app-server Codex у реальному часі.
- `/codex threads [filter]` показує список нещодавніх потоків Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаного потоку.
- `/codex review` запускає нативну перевірку Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує стан серверів MCP app-server Codex.
- `/codex skills` показує список Skills app-server Codex.

`/codex resume` записує той самий файл прив’язки sidecar, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw `codex/*` в app-server і залишає розширену
історію увімкненою.

Поверхня команд потребує app-server Codex версії `0.118.0` або новішої. Для окремих
методів керування буде показано `unsupported by this Codex app-server`, якщо
майбутній або користувацький app-server не надає цей JSON-RPC метод.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Коли вибрана модель використовує harness Codex, нативна Compaction потоку
делегується app-server Codex. OpenClaw зберігає дзеркало стенограми для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделей або harness. Дзеркало
містить запит користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex,
коли app-server їх надсилає.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і розуміння медіа
і далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не обробляє запуск,
OpenClaw може використовувати PI як backend сумісності. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб отримувати помилку, коли жоден plugin harness не підходить. Щойно
буде вибрано app-server Codex, його збої відображатимуться безпосередньо без додаткової
конфігурації fallback.

**App-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель не Codex використовує PI:** це очікувана поведінка. Harness Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язані матеріали

- [Agent Harness Plugins](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
