---
read_when:
    - Ви хочете використовувати комплектний harness app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід на PI для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-22T23:30:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffd539ad6544284a31bc32f2e506fa46b7ba70d2994ef80eb422ae6cb459d8fa
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Комплектний plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли ви хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоку, нативною Compaction і виконанням app-server.
OpenClaw, як і раніше, керує каналами чату, файлами сесій, вибором моделей, інструментами,
погодженнями, доставленням медіа та видимим дзеркалом стенограми.

Нативні ходи Codex також підтримують спільні хоки plugin `before_prompt_build`,
`before_compaction` і `after_compaction`, тож шими підказок і
автоматизація з урахуванням Compaction можуть залишатися узгодженими з harness PI.
Нативні ходи Codex також підтримують спільні хоки plugin `before_prompt_build`,
`before_compaction`, `after_compaction`, `llm_input`, `llm_output` і
`agent_end`, тож шими підказок, автоматизація з урахуванням Compaction і
спостерігачі життєвого циклу можуть залишатися узгодженими з harness PI.

Harness вимкнено за замовчуванням. Він вибирається лише тоді, коли plugin `codex`
увімкнено і визначена модель є моделлю `codex/*`, або коли ви явно
примусово задаєте `embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають свою поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у формі OpenAI та Codex:

| Посилання на модель  | Шлях runtime                                 | Використовуйте, коли                                                    |
| -------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`     | Провайдер OpenAI через інфраструктуру OpenClaw/PI | Вам потрібен прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`.   |
| `openai-codex/gpt-5.4` | Провайдер OpenAI Codex OAuth через PI      | Вам потрібен ChatGPT/Codex OAuth без harness app-server Codex.          |
| `codex/gpt-5.4`      | Комплектний провайдер Codex плюс harness Codex | Вам потрібне нативне виконання app-server Codex для вбудованого ходу агента. |

Harness Codex працює лише з посиланнями на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

## Вимоги

- OpenClaw із доступним комплектним plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Автентифікація Codex, доступна процесу app-server.

Plugin блокує старіші або неверсіоновані handshake app-server. Це утримує
OpenClaw у межах поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також із
необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, які застосовує
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

За такої конфігурації:

- `/model codex` або `/model codex/gpt-5.4` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть резервний перехід на PI, якщо потрібно підтвердити, що кожен вбудований хід агента використовує
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

Перевизначення через змінні середовища:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли резервний перехід вимкнено, OpenClaw завершує роботу на ранньому етапі, якщо plugin Codex вимкнено,
потрібна модель не є посиланням `codex/*`, app-server надто старий або
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
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar app-server
потік за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього потоку.

## Виявлення моделей

За замовчуванням plugin Codex запитує app-server про доступні моделі. Якщо
виявлення завершується помилкою або перевищує час очікування, він використовує комплектний резервний каталог:

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

За замовчуванням plugin запускає Codex локально за допомогою:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, яка використовується
для автономних Heartbeat: Codex може користуватися shell- та network-інструментами без
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
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Режим Guardian розгортається до:

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

Guardian — це нативний рецензент погоджень Codex. Коли Codex просить вийти за межі
sandbox, записати поза межами workspace або додати дозволи, такі як доступ до мережі,
Codex спрямовує цей запит на погодження до підлеглого агента-рецензента, а не до підказки людині.
Рецензент збирає контекст і застосовує рамки оцінки ризиків Codex, а потім
схвалює або відхиляє конкретний запит. Guardian корисний, коли вам потрібно більше
запобіжників, ніж у режимі YOLO, але водночас потрібно, щоб агенти та Heartbeat без нагляду
могли просуватися далі.

Docker live harness містить перевірку Guardian, коли
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Він запускає harness Codex у
режимі Guardian, перевіряє, що безпечну shell-команду з підвищеними правами схвалено, і
перевіряє, що вивантаження фальшивого секрету до ненадійного зовнішнього призначення відхилено,
щоб агент повернувся із запитом на явне погодження.

Окремі поля політики все одно мають пріоритет над `mode`, тож розширені розгортання можуть
поєднувати цей preset із явними параметрами.

Для уже запущеного app-server використовуйте транспорт WebSocket:

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

| Поле                | За замовчуванням                           | Значення                                                        |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`. |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                 |
| `url`               | не задано                                | URL app-server WebSocket.                                       |
| `authToken`         | не задано                                | Bearer-токен для транспорту WebSocket.                          |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                  |
| `requestTimeoutMs`  | `60000`                                  | Тайм-аут для викликів control-plane до app-server.              |
| `mode`              | `"yolo"`                                 | Preset для виконання YOLO або з перевіркою Guardian.            |
| `approvalPolicy`    | `"never"`                                | Нативна політика погоджень Codex, що передається під час start/resume/turn потоку. |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, що передається під час start/resume. |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти підказки. |
| `serviceTier`       | не задано                                | Необов’язковий рівень сервісу Codex, наприклад `"priority"`.    |

Старіші змінні середовища все ще працюють як резервні варіанти для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація є
бажаною для відтворюваних розгортань, бо зберігає поведінку plugin у тому самому
перевіреному файлі, що й решту налаштувань harness Codex.

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

Перевірка harness лише з Codex, із вимкненим резервним переходом на PI:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw приєднано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточні вибрані `codex/*` модель, провайдера, політику погоджень, sandbox і
рівень сервісу. Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає
прив’язку до потоку, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Комплектний plugin реєструє `/codex` як авторизовану slash-команду. Вона є
узагальненою і працює на будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до app-server, моделі, обліковий запис, ліміти швидкості, сервери MCP і skills.
- `/codex models` показує список поточних моделей app-server Codex.
- `/codex threads [filter]` показує список недавніх потоків Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction приєднаного потоку.
- `/codex review` запускає нативний review Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису й лімітів швидкості.
- `/codex mcp` показує стан серверів MCP app-server Codex.
- `/codex skills` показує Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає поточну
вибрану модель OpenClaw `codex/*` до app-server і зберігає увімкнену
розширену історію.

Поверхня команд вимагає Codex app-server `0.118.0` або новішої версії. Про окремі
методи керування повідомляється як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей метод JSON-RPC.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів повідомлень
і далі проходять через звичайний шлях доставлення OpenClaw.

Коли вибрана модель використовує harness Codex, нативна Compaction потоку
делегується app-server Codex. OpenClaw зберігає дзеркало стенограми для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделей або harness. Дзеркало
містить підказку користувача, фінальний текст помічника та полегшені записи міркувань або плану Codex,
коли їх надсилає app-server. Наразі OpenClaw записує лише сигнали початку й завершення
нативної Compaction. Він поки що не надає
людинозрозумілого підсумку Compaction або придатного до аудиту списку того, які записи Codex
зберіг після Compaction.

Генерація медіа не потребує PI. Зображення, відео, музика, PDF, TTS і розуміння медіа
і далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не обробляє запуск,
OpenClaw може використовувати PI як backend сумісності. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися з помилкою, коли жоден plugin harness не підходить. Щойно
вибрано app-server Codex, його збої відображаються безпосередньо без додаткової
конфігурації резервного переходу.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket відразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Не-Codex модель використовує PI:** це очікувано. Harness Codex працює лише з
посиланнями на моделі `codex/*`.

## Пов’язане

- [Plugin-и harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
