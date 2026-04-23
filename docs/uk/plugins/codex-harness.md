---
read_when:
    - Ви хочете використовувати комплектний harness app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервне перемикання на Pi для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T00:29:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f96680bcaff3d6d50e9673a0131210cfce8a7f976c66573a864d67008de27c1
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Комплектний plugin `codex` дає змогу OpenClaw запускати вбудовані ходи агента через app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням thread, нативною Compaction та виконанням app-server.
OpenClaw, як і раніше, керує каналами чату, файлами сесій, вибором моделі, інструментами, погодженнями, доставкою медіа та видимим дзеркалом стенограми.

Нативні ходи Codex також враховують спільні plugin hooks `before_prompt_build`,
`before_compaction` і `after_compaction`, тож shims для prompt і автоматизація, обізнана про Compaction, можуть залишатися узгодженими з harness PI.
Нативні ходи Codex також враховують спільні plugin hooks `before_prompt_build`,
`before_compaction`, `after_compaction`, `llm_input`, `llm_output` і
`agent_end`, тож shims для prompt, автоматизація, обізнана про Compaction, і
спостерігачі життєвого циклу можуть залишатися узгодженими з harness PI.

Harness вимкнено за замовчуванням. Його буде вибрано лише тоді, коли plugin `codex`
увімкнено і розв’язана модель є моделлю `codex/*`, або коли ви явно примусово задаєте
`embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у форматі OpenAI та Codex:

| Посилання на модель   | Шлях runtime                                | Коли використовувати                                                       |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | OpenAI provider через OpenClaw/PI plumbing  | Вам потрібен прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`.      |
| `openai-codex/gpt-5.4` | OpenAI Codex OAuth provider через PI       | Вам потрібен ChatGPT/Codex OAuth без harness app-server Codex.             |
| `codex/gpt-5.4`       | Комплектний provider Codex плюс harness Codex | Вам потрібне нативне виконання app-server Codex для вбудованого ходу агента. |

Harness Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider продовжують
працювати своїми звичайними шляхами.

## Вимоги

- OpenClaw із доступним комплектним plugin `codex`.
- app-server Codex версії `0.118.0` або новішої.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старіші або безверсійні handshakes app-server. Це гарантує, що
OpenClaw працює на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі автентифікаційні матеріали, які використовує
ваш локальний app-server Codex.

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
автоматично вмикає комплектний plugin `codex`. Явний запис plugin, як і раніше,
корисний у спільних конфігураціях, оскільки робить намір розгортання очевидним.

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

У такій конфігурації:

- `/model codex` або `/model codex/gpt-5.4` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях provider OpenAI.
- `/model opus` використовує шлях provider Anthropic.
- Якщо вибрано не-Codex модель, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть резервне перемикання на PI, коли потрібно довести, що кожен вбудований хід агента використовує
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

Коли резервне перемикання вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо plugin Codex вимкнено,
запитувана модель не є посиланням `codex/*`, app-server застарий або
app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити один агент лише-Codex, тоді як агент за замовчуванням зберігатиме звичайний
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
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar thread app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього thread.

## Виявлення моделей

За замовчуванням plugin Codex запитує app-server про доступні моделі. Якщо
виявлення не вдається або завершується за timeout, він використовує комплектний резервний каталог:

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

За замовчуванням plugin запускає Codex локально командою:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це довірена локальна операційна модель, що використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти, не
зупиняючись на нативних запитах на погодження, коли поруч немає нікого, хто міг би відповісти.

Щоб увімкнути погодження, перевірені Guardian Codex, установіть `appServer.mode:
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

Режим Guardian розгортається до такого вигляду:

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
sandbox, записати поза межами workspace або додати дозволи, наприклад доступ до мережі,
Codex спрямовує цей запит на погодження до підлеглого агента-рецензента, а не до запиту людині.
Рецензент збирає контекст і застосовує систему оцінки ризиків Codex, а потім
схвалює або відхиляє конкретний запит. Guardian корисний, коли вам потрібно більше
запобіжників, ніж у режимі YOLO, але водночас потрібні unattended агенти й Heartbeat,
які можуть продовжувати роботу.

Docker live harness містить перевірку Guardian, коли
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Він запускає harness Codex у
режимі Guardian, перевіряє, що нешкідливу shell-команду з підвищенням прав схвалено, і
перевіряє, що завантаження фальшивого секрету до ненадійного зовнішнього призначення відхилено,
щоб агент повторно запитав явне погодження.

Окремі поля політики, як і раніше, мають пріоритет над `mode`, тому розширені розгортання можуть
поєднувати цей preset з явними виборами.

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

| Поле                | За замовчуванням                           | Значення                                                                                                  |
| ------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                 | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Аргументи для транспорту stdio.                                                                           |
| `url`               | не задано                                 | URL app-server WebSocket.                                                                                 |
| `authToken`         | не задано                                 | Bearer token для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                      | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                   | Timeout для викликів control-plane app-server.                                                            |
| `mode`              | `"yolo"`                                  | Preset для виконання YOLO або з погодженнями, перевіреними Guardian.                                      |
| `approvalPolicy`    | `"never"`                                 | Нативна політика погодження Codex, що надсилається під час start/resume/turn thread.                     |
| `sandbox`           | `"danger-full-access"`                    | Нативний режим sandbox Codex, що надсилається під час start/resume thread.                                |
| `approvalsReviewer` | `"user"`                                  | Використовуйте `"guardian_subagent"`, щоб Guardian Codex перевіряв prompts.                               |
| `serviceTier`       | не задано                                 | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища, як і раніше, працюють як резервні варіанти для локального тестування, коли
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
в тому самому перевіреному файлі, що й решта налаштувань harness Codex.

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

Перевірка harness лише з Codex, із вимкненим резервним перемиканням на PI:

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

Перемикання моделей залишається під керуванням OpenClaw. Коли сесію OpenClaw прив’язано
до наявного thread Codex, наступний хід знову надсилає до
app-server поточні вибрані `codex/*` модель, provider, політику погодження, sandbox і рівень сервісу.
Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає прив’язку до
thread, але просить Codex продовжити роботу з новою вибраною моделлю.

## Команда Codex

Комплектний plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює на будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує поточну підключеність до app-server, моделі, обліковий запис, ліміти швидкості, сервери MCP і skills.
- `/codex models` перелічує поточні моделі app-server Codex.
- `/codex threads [filter]` перелічує нещодавні threads Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного thread Codex.
- `/codex compact` просить app-server Codex виконати Compaction прив’язаного thread.
- `/codex review` запускає нативний review Codex для прив’язаного thread.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` перелічує стан серверів MCP app-server Codex.
- `/codex skills` перелічує skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. На наступному повідомленні OpenClaw відновлює цей thread Codex, передає
поточну вибрану в OpenClaw модель `codex/*` до app-server і зберігає ввімкнену
розширену історію.

Поверхня команд вимагає app-server Codex версії `0.118.0` або новішої. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або custom app-server не надає цей JSON-RPC-метод.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів повідомлень
і далі проходять через звичайний шлях доставки OpenClaw.

Коли вибрана модель використовує harness Codex, нативна Compaction thread
делегується app-server Codex. OpenClaw зберігає дзеркало стенограми для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
містить запит користувача, фінальний текст асистента та спрощені записи міркувань або плану Codex,
коли їх генерує app-server. Наразі OpenClaw лише
записує сигнали початку та завершення нативної Compaction. Він поки що не показує
людинозрозуміле резюме Compaction або придатний для аудиту список записів, які Codex
зберіг після Compaction.

Генерація медіа не вимагає PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування provider/моделі, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не обробляє цей запуск,
OpenClaw може використовувати PI як backend сумісності. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися з помилкою, коли жоден plugin harness не підходить. Щойно
app-server Codex вибрано, його збої відображаються безпосередньо без додаткової
конфігурації резервного перемикання.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server підтримує ту саму версію протоколу app-server Codex.

**Не-Codex модель використовує PI:** це очікувано. Harness Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язані матеріали

- [Plugins Harness агента](/uk/plugins/sdk-agent-harness)
- [Providers моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
