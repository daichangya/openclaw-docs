---
read_when:
    - Ви хочете використати комплектний каркас app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервне перемикання на PI для розгортань лише з Codex
summary: Запустіть вбудовані ходи агента OpenClaw через комплектний каркас app-server Codex
title: каркас Codex
x-i18n:
    generated_at: "2026-04-24T00:54:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2d12f877e27080a0b91b5c597b171f25fbdc74756bf040d483e3da4461f1d7c
    source_path: plugins/codex-harness.md
    workflow: 15
---

Комплектний Plugin `codex` дозволяє OpenClaw запускати вбудовані ходи агента через
app-server Codex замість вбудованого каркаса PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоку, нативною Compaction і виконанням через app-server.
OpenClaw, як і раніше, керує каналами чату, файлами сесій, вибором моделей, інструментами,
підтвердженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex також поважають спільні хуки Plugin, тож шими підказок,
автоматизація з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу
залишаються узгодженими з каркасом PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Комплектні plugins також можуть реєструвати фабрику розширення app-server Codex, щоб додавати
асинхронне middleware `tool_result`.

Каркас вимкнено за замовчуванням. У нових конфігураціях слід зберігати посилання на моделі OpenAI
у канонічному вигляді `openai/gpt-*` і явно примусово вказувати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, якщо потрібне
нативне виконання через app-server. Застарілі посилання на моделі `codex/*` і надалі автоматично вибирають
каркас для сумісності.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, коли хочете
Codex OAuth через PI; використовуйте `openai/*`, коли хочете прямий доступ до OpenAI API або
коли примусово вмикаєте нативний каркас app-server Codex:

| Посилання на модель                                  | Шлях runtime                                  | Використовуйте, коли                                                        |
| ---------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | Провайдер OpenAI через внутрішню логіку OpenClaw/PI | Вам потрібен поточний прямий доступ до OpenAI Platform API через `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OpenAI Codex OAuth через OpenClaw/PI          | Вам потрібна автентифікація передплати ChatGPT/Codex із типовим runner PI. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Каркас app-server Codex                       | Вам потрібне нативне виконання через app-server Codex для вбудованого ходу агента. |

GPT-5.5 наразі в OpenClaw доступна лише через передплату/OAuth. Використовуйте
`openai-codex/gpt-5.5` для PI OAuth або `openai/gpt-5.5` разом із каркасом
app-server Codex. Прямий доступ через API-ключ для `openai/gpt-5.5` буде підтримуватися,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` і надалі приймаються як псевдоніми для сумісності. У нових конфігураціях
PI Codex OAuth слід використовувати `openai-codex/gpt-*`; у нових конфігураціях
нативного каркаса app-server слід використовувати `openai/gpt-*` разом із `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` дотримується того самого поділу за префіксами. Використовуйте
`openai-codex/gpt-*`, коли розуміння зображень має проходити через шлях провайдера OpenAI
Codex OAuth. Використовуйте `codex/gpt-*`, коли розуміння зображень має виконуватися
через обмежений хід app-server Codex. Модель app-server Codex повинна
заявляти підтримку вхідних зображень; текстові моделі Codex без такої підтримки завершуються помилкою ще до
початку ходу з медіа.

Використовуйте `/status`, щоб підтвердити фактичний каркас для поточної сесії. Якщо вибір
неочікуваний, увімкніть журналювання налагодження для підсистеми `agents/harness`
і перегляньте структурований запис gateway `agent harness selected`. Він
містить ідентифікатор вибраного каркаса, причину вибору, політику runtime/резервного перемикання та,
у режимі `auto`, результат підтримки для кожного кандидата Plugin.

Вибір каркаса не є елементом керування живою сесією. Коли виконується вбудований хід,
OpenClaw записує ідентифікатор вибраного каркаса в цю сесію і продовжує використовувати його для
наступних ходів у межах того самого ідентифікатора сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший каркас;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між PI і Codex. Це дозволяє уникнути повторного відтворення одного транскрипту через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до появи прив’язок каркаса, вважаються прив’язаними до PI, щойно в них
з’являється історія транскрипту. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на
Codex після зміни конфігурації.

`/status` показує фактичний каркас, відмінний від PI, поруч із `Fast`, наприклад
`Fast · codex`. Типовий каркас PI і надалі показується як `Runner: pi (embedded)` і
не додає окремого бейджа каркаса.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старіші або неверсіоновані handshake app-server. Це утримує
OpenClaw у межах поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
з необов’язкових файлів CLI Codex, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть комплектний Plugin і примусово виберіть каркас `codex`:

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

Застарілі конфігурації, у яких `agents.defaults.model` або модель агента встановлено в
`codex/<model>`, і надалі автоматично вмикають комплектний Plugin `codex`. У нових конфігураціях
слід віддавати перевагу `openai/<model>` разом із явним записом `embeddedHarness`, наведеним вище.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
PI — для всього іншого. У нових конфігураціях краще явно вказувати `runtime: "codex"` для
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

- `/model gpt` або `/model openai/gpt-5.5` використовує каркас app-server Codex у цій конфігурації.
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

Коли резервне перемикання вимкнено, OpenClaw завершується помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server надто старий або app-server не вдається запустити.

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

Використовуйте звичайні команди сесії, щоб перемикати агентів і моделі. `/new` створює нову
сесію OpenClaw, а каркас Codex за потреби створює або відновлює свій sidecar-потік app-server.
`/reset` очищає прив’язку сесії OpenClaw для цього потоку та дозволяє наступному ходу знову визначити
каркас на основі поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex запитує app-server про доступні моделі. Якщо
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

Вимкніть виявлення, якщо хочете, щоб під час запуску не відбувалося опитування Codex і використовувався
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

## З’єднання з app-server і політика

За замовчуванням Plugin локально запускає Codex так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії каркаса Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних запитах підтвердження, на які нікому відповісти.

Щоб увімкнути підтвердження Codex із рецензуванням Guardian, установіть `appServer.mode:
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

Guardian — це нативний рецензент підтверджень Codex. Коли Codex просить вийти із sandbox, записати поза межами робочого простору або додати дозволи на кшталт мережевого доступу, Codex спрямовує цей запит на підтвердження до субагента-рецензента замість запиту людині. Рецензент застосовує модель ризику Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, коли хочете більше запобіжників, ніж у режимі YOLO, але все ще потребуєте, щоб агенти могли просуватися вперед без нагляду.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики, як і раніше, мають пріоритет над `mode`, тож у складних розгортаннях можна поєднувати пресет із явними значеннями.

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

| Поле                | Типове значення                           | Значення                                                                                                  |
| ------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                 | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Аргументи для транспорту stdio.                                                                           |
| `url`               | не встановлено                            | URL app-server WebSocket.                                                                                 |
| `authToken`         | не встановлено                            | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                      | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                   | Час очікування для викликів control-plane app-server.                                                     |
| `mode`              | `"yolo"`                                  | Пресет для виконання YOLO або виконання з рецензуванням guardian.                                         |
| `approvalPolicy`    | `"never"`                                 | Нативна політика підтверджень Codex, що передається під час start/resume/turn потоку.                    |
| `sandbox`           | `"danger-full-access"`                    | Нативний режим sandbox Codex, що передається під час start/resume потоку.                                |
| `approvalsReviewer` | `"user"`                                  | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian рецензувати запити.                   |
| `serviceTier`       | не встановлено                            | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища й надалі працюють як резервні варіанти для локального тестування, коли
відповідне поле конфігурації не встановлено:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Для
відтворюваних розгортань краще використовувати конфігурацію, оскільки вона зберігає поведінку Plugin
в тому самому перевіреному файлі, що й решта налаштувань каркаса Codex.

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

Перевірка каркаса лише з Codex, із вимкненим резервним перемиканням на PI:

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

Підтвердження Codex із рецензуванням Guardian:

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

Перемикання моделей залишається під керуванням OpenClaw. Коли сесію OpenClaw приєднано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточну вибрану модель OpenAI, провайдера, політику підтверджень, sandbox і рівень сервісу.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив’язку до потоку, але просить Codex продовжити роботу з новою вибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує live-підключення до app-server, моделі, обліковий запис, ліміти швидкості, сервери MCP і skills.
- `/codex models` показує список live-моделей app-server Codex.
- `/codex threads [filter]` показує список нещодавніх потоків Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати compaction приєднаного потоку.
- `/codex review` запускає нативну перевірку Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує стан серверів MCP app-server Codex.
- `/codex skills` показує список skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який каркас використовує для
звичайних ходів. Під час наступного повідомлення OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw до app-server і зберігає увімкненою
розширену історію.

Поверхня команд потребує Codex app-server `0.118.0` або новішої версії. Про окремі
методи керування повідомляється як `unsupported by this Codex app-server`, якщо
майбутній або нестандартний app-server не надає цей метод JSON-RPC.

## Інструменти, медіа та Compaction

Каркас Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує динамічні результати інструментів із
каркаса. Текст, зображення, відео, музика, TTS, підтвердження та вивід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на підтвердження інструментів MCP Codex маршрутизуються через потік підтверджень Plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на уточнення і запити довільного введення й надалі аварійно
завершуються із забороною.

Коли вибрана модель використовує каркас Codex, нативна compaction потоку делегується
app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделей або каркасів. Дзеркало
містить запит користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex,
якщо app-server їх надсилає. Наразі OpenClaw записує лише сигнали початку та завершення
нативної compaction. Він ще не показує людинозрозумілий підсумок compaction або придатний для аудиту
список записів, які Codex зберіг після compaction.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і розуміння медіа
й надалі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` із `embeddedHarness.runtime: "codex"` (або
застаріле посилання `codex/*`) і перевірте, чи не виключає `plugins.allow` значення `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден каркас Codex не заявляє про підтримку запуску,
OpenClaw може використовувати PI як backend сумісності. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися помилкою, коли жоден каркас Plugin не підходить. Щойно
буде вибрано app-server Codex, його збої напряму відображатимуться без додаткової
конфігурації резервного перемикання.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і чи використовує віддалений app-server ту саму версію протоколу app-server Codex.

**Модель не Codex використовує PI:** це очікувана поведінка, якщо ви не примусово встановили
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
посилання `openai/gpt-*` та інші посилання провайдерів залишаються на своєму стандартному шляху провайдера.

## Пов’язане

- [Plugins каркаса агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
