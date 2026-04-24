---
read_when:
    - Ви хочете використати комплектний app-server harness Codex
    - Вам потрібні приклади конфігурації harness Codex
    - Ви хочете вимкнути резервний варіант Pi для розгортань лише з Codex
summary: Запустіть вбудовані ходи агента OpenClaw через комплектний app-server harness Codex
title: harness Codex
x-i18n:
    generated_at: "2026-04-24T18:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1942e571358674066a7a92139c0ab05273b8196ad68ae3ca2349e2be33cac403
    source_path: plugins/codex-harness.md
    workflow: 15
---

Комплектний Plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоку, нативним Compaction і виконанням через app-server.
OpenClaw, як і раніше, керує каналами чату, файлами сесії, вибором моделі, інструментами,
підтвердженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex зберігають хуки Plugin OpenClaw як публічний шар сумісності.
Це внутрішньопроцесні хуки OpenClaw, а не командні хуки Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` для дзеркальних записів транскрипту
- `agent_end`

Комплектні plugins також можуть реєструвати фабрику розширення app-server Codex, щоб додати
асинхронне проміжне ПЗ `tool_result`. Це проміжне ПЗ виконується для динамічних інструментів OpenClaw
після того, як OpenClaw виконає інструмент, і до того, як результат буде повернено в Codex. Воно
відокремлене від публічного хука Plugin `tool_result_persist`, який перетворює записи результатів
інструментів у транскрипті, якими керує OpenClaw.

За замовчуванням harness вимкнено. Нові конфігурації мають зберігати посилання на моделі OpenAI
канонічними як `openai/gpt-*` і явно примусово вказувати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли вони
хочуть нативне виконання через app-server. Застарілі посилання на моделі `codex/*` і далі
автоматично вибирають harness для сумісності, але не показуються як звичайні варіанти
моделей/провайдерів.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, якщо хочете
Codex OAuth через PI; використовуйте `openai/*`, якщо хочете прямий доступ до OpenAI API або
коли примусово використовуєте нативний harness app-server Codex:

| Посилання на модель                                 | Шлях runtime                                | Використовуйте, коли                                                        |
| --------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                    | Провайдер OpenAI через інфраструктуру OpenClaw/PI | Ви хочете поточний прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                              | OpenAI Codex OAuth через OpenClaw/PI        | Ви хочете автентифікацію за підпискою ChatGPT/Codex зі стандартним runner PI. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex                    | Ви хочете нативне виконання через app-server Codex для вбудованого ходу агента. |

Наразі GPT-5.5 в OpenClaw доступна лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для PI OAuth або `openai/gpt-5.5` з harness
app-server Codex. Прямий доступ за API-ключем для `openai/gpt-5.5` підтримуватиметься,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` і далі приймаються як сумісні псевдоніми. Міграція сумісності
doctor переписує застарілі основні посилання `codex/*` на `openai/*`
і окремо зберігає політику harness Codex. Нові конфігурації PI Codex OAuth
мають використовувати `openai-codex/gpt-*`; нові конфігурації нативного harness app-server
мають використовувати `openai/gpt-*` разом із `embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` дотримується того самого розділення за префіксами. Використовуйте
`openai-codex/gpt-*`, коли розуміння зображень має виконуватися через шлях провайдера OpenAI
Codex OAuth. Використовуйте `codex/gpt-*`, коли розуміння зображень має виконуватися
через обмежений хід app-server Codex. Модель app-server Codex має
оголошувати підтримку вхідних зображень; текстові моделі Codex завершуються з помилкою до початку
ходу з медіа.

Використовуйте `/status`, щоб підтвердити ефективний harness для поточної сесії. Якщо
вибір виглядає неочікуваним, увімкніть журналювання налагодження для підсистеми `agents/harness`
та перевірте структурований запис gateway `agent harness selected`. Він
містить id вибраного harness, причину вибору, політику runtime/резервного варіанта, а
в режимі `auto` — результат підтримки для кожного кандидата Plugin.

Вибір harness не є елементом керування живою сесією. Коли виконується вбудований хід,
OpenClaw записує id вибраного harness для цієї сесії та продовжує використовувати його для
наступних ходів у межах того самого id сесії. Змініть конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між PI та Codex. Це дає змогу уникнути повторного відтворення одного транскрипту через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до появи фіксації harness, вважаються прив’язаними до PI, щойно вони
мають історію транскрипту. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на
Codex після зміни конфігурації.

`/status` показує ефективний harness, відмінний від PI, поруч із `Fast`, наприклад
`Fast · codex`. Стандартний harness PI і далі показується як `Runner: pi (embedded)` і
не додає окремий бейдж harness.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- app-server Codex версії `0.118.0` або новішої.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старіші або неверсіоновані рукостискання app-server. Це утримує
OpenClaw на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний
app-server Codex.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть комплектний Plugin і примусово задайте harness `codex`:

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

Якщо ваша конфігурація використовує `plugins.allow`, також додайте туди `codex`:

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

Застарілі конфігурації, які встановлюють `agents.defaults.model` або модель агента в
`codex/<model>`, і далі автоматично вмикають комплектний Plugin `codex`. Нові конфігурації мають
надавати перевагу `openai/<model>` разом із явним записом `embeddedHarness`, наведеним вище.

## Додайте Codex без заміни інших моделей

Зберігайте `runtime: "auto"`, якщо хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
PI — для всього іншого. Для нових конфігурацій надавайте перевагу явному `runtime: "codex"` для
тих агентів, які мають використовувати harness.

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

Із такою конфігурацією:

- `/model gpt` або `/model openai/gpt-5.5` використовує harness app-server Codex для цієї конфігурації.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не модель Codex, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть резервний варіант PI, коли вам потрібно довести, що кожен вбудований хід агента використовує
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

Якщо резервний варіант вимкнено, OpenClaw завершується з помилкою рано, якщо Plugin Codex вимкнено,
app-server надто старий або app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити один агент лише-Codex, тоді як стандартний агент зберігатиме звичайний
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
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar-потік app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього потоку
і дає змогу наступному ходу знову визначити harness на основі поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex запитує app-server про доступні моделі. Якщо
виявлення завершується помилкою або за тайм-аутом, він використовує комплектний резервний каталог для:

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

За замовчуванням Plugin запускає Codex локально командою:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, що використовується
для автономних Heartbeat: Codex може використовувати shell та мережеві інструменти без
зупинки на нативних запитах на підтвердження, на які нікому відповісти.

Щоб увімкнути підтвердження Codex із перевіркою guardian, задайте `appServer.mode:
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

Guardian — це нативний рецензент підтверджень Codex. Коли Codex просить вийти із sandbox, записати дані поза робочим простором або додати дозволи, як-от доступ до мережі, Codex спрямовує цей запит на підтвердження до субагента-рецензента замість запиту в людини. Рецензент застосовує рамку ризиків Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, якщо вам потрібні кращі запобіжники, ніж у режимі YOLO, але все ще потрібно, щоб агенти без нагляду могли просуватися далі.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики, як і раніше, перевизначають `mode`, тому розширені розгортання можуть поєднувати пресет із явними параметрами.

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
| `url`               | не задано                               | URL WebSocket app-server.                                                                                 |
| `authToken`         | не задано                               | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                    | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                 | Тайм-аут для викликів control-plane app-server.                                                           |
| `mode`              | `"yolo"`                                | Пресет для виконання в режимі YOLO або з перевіркою guardian.                                             |
| `approvalPolicy`    | `"never"`                               | Нативна політика підтверджень Codex, що надсилається під час запуску/відновлення потоку та ходу.         |
| `sandbox`           | `"danger-full-access"`                  | Нативний режим sandbox Codex, що надсилається під час запуску/відновлення потоку.                         |
| `approvalsReviewer` | `"user"`                                | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти запити.                    |
| `serviceTier`       | не задано                               | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старі змінні середовища й далі працюють як резервні варіанти для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального тестування. Конфігурація
є бажаним варіантом для відтворюваних розгортань, оскільки вона зберігає поведінку Plugin у тому
самому перевіреному файлі, що й решта налаштування harness Codex.

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

Перевірка harness лише з Codex, із вимкненим резервним варіантом PI:

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

Підтвердження Codex із перевіркою Guardian:

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
до наявного потоку Codex, наступний хід знову надсилає в
app-server поточно вибрану модель OpenAI, провайдера, політику підтверджень, sandbox і
рівень сервісу. Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив’язку до потоку, але просить Codex продовжити роботу з новою вибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
універсальною та працює на будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує активне підключення до app-server, моделі, обліковий запис, ліміти швидкості, сервери MCP і skills.
- `/codex models` виводить список активних моделей app-server Codex.
- `/codex threads [filter]` виводить список нещодавніх потоків Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction для прив’язаного потоку.
- `/codex review` запускає нативну перевірку Codex для прив’язаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує стан серверів MCP app-server Codex.
- `/codex skills` показує skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw в app-server і зберігає
увімкнену розширену історію.

Поверхня команд вимагає app-server Codex `0.118.0` або новішої версії. Для окремих
методів керування буде показано `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей метод JSON-RPC.

## Межі хуків

Harness Codex має три шари хуків:

| Шар                                   | Власник                  | Призначення                                                          |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Хуки Plugin OpenClaw                  | OpenClaw                 | Сумісність продукту/Plugin між harness PI і Codex.                   |
| Middleware розширення app-server Codex | Комплектні plugins OpenClaw | Поведінка адаптера на кожному ході навколо динамічних інструментів OpenClaw. |
| Нативні хуки Codex                    | Codex                    | Низькорівневий життєвий цикл Codex і нативна політика інструментів із конфігурації Codex. |

OpenClaw не використовує файли проєктного чи глобального Codex `hooks.json` для маршрутизації
поведінки Plugin OpenClaw. Нативні хуки Codex корисні для операцій, якими володіє Codex,
таких як політика shell, нативна перевірка результатів інструментів, обробка зупинки та
нативний життєвий цикл Compaction/моделі, але вони не є API Plugin OpenClaw.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як Codex запитує
виклик, тому OpenClaw запускає поведінку Plugin і middleware, якою він володіє, в
адаптері harness. Для нативних інструментів Codex саме Codex володіє канонічним записом інструмента.
OpenClaw може віддзеркалювати окремі події, але не може переписати нативний
потік Codex, якщо тільки Codex не надає цю операцію через app-server або callbacks нативних хуків.

Коли новіші збірки app-server Codex надаватимуть події нативних хуків життєвого циклу Compaction і моделі,
OpenClaw має обмежувати підтримку цього протоколу за версією та відображати ці
події в наявний контракт хуків OpenClaw там, де семантика є чесною.
До того часу події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями на рівні адаптера, а не побайтними копіями
внутрішнього запиту Codex або payload Compaction.

Нативні сповіщення app-server Codex `hook/started` і `hook/completed` проєктуються як
події агента `codex_app_server.hook` для траєкторії та налагодження.
Вони не викликають хуки Plugin OpenClaw.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує результати динамічних інструментів від
harness. Текст, зображення, відео, музика, TTS, підтвердження та вивід інструментів обміну повідомленнями
й далі проходять через звичайний шлях доставки OpenClaw.

Запити на підтвердження для інструментів MCP Codex маршрутизуються через потік
підтверджень Plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Запити Codex `request_user_input` надсилаються назад у
початковий чат, а наступне повідомлення в черзі відповідає на цей нативний запит
сервера замість того, щоб бути спрямованим як додатковий контекст. Інші запити elicitation MCP,
як і раніше, завершуються із закритою відмовою.

Коли вибрана модель використовує harness Codex, нативний Compaction потоку делегується
app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
містить запит користувача, фінальний текст помічника та полегшені записи міркувань або плану Codex,
коли app-server їх надсилає. Наразі OpenClaw записує лише сигнали початку та завершення
нативного Compaction. Він іще не показує зручний для читання людиною підсумок Compaction
або придатний до аудиту список того, які записи Codex зберіг після Compaction.

Оскільки Codex володіє канонічним нативним потоком, `tool_result_persist` наразі не
переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли
OpenClaw записує результат інструмента в транскрипт сесії, яким володіє OpenClaw.

Генерація медіа не вимагає PI. Генерація зображень, відео, музики, PDF, TTS та розуміння медіа
й далі використовують відповідні параметри провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення неполадок

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` з `embeddedHarness.runtime: "codex"` (або
застаріле посилання `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не бере виконання на себе,
OpenClaw може використовувати PI як бекенд сумісності. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб отримувати помилку, коли жоден harness Plugin не підходить. Щойно
вибрано app-server Codex, його збої відображаються безпосередньо без додаткової
конфігурації резервного варіанта.

**app-server відхиляється:** оновіть Codex, щоб рукостискання app-server
повідомляло про версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket завершується з помилкою відразу:** перевірте `appServer.url`, `authToken`
і що віддалений app-server підтримує ту саму версію протоколу app-server Codex.

**Модель не Codex використовує PI:** це очікувана поведінка, якщо ви не примусово задали
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
посилання `openai/gpt-*` та інших провайдерів залишаються на своєму стандартному шляху провайдера.

## Пов’язане

- [Plugins Agent Harness](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
