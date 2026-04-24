---
read_when:
    - Ви хочете використовувати вбудований harness app-server Codex
    - Вам потрібні приклади конфігурації harness Codex
    - Ви хочете вимкнути резервний перехід на Pi для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через вбудований harness app-server Codex
title: harness Codex
x-i18n:
    generated_at: "2026-04-24T19:52:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd8f23e8c807d0c97c99ca9c8a41e39f42a35a0bfed5c7f53793a15b6d24e18
    source_path: plugins/codex-harness.md
    workflow: 15
---

Вбудований Plugin `codex` дозволяє OpenClaw запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness Pi.

Використовуйте це, коли хочете, щоб Codex керував низькорівневим сеансом агента: виявленням
моделей, нативним відновленням thread, нативним Compaction і виконанням через app-server.
OpenClaw, як і раніше, керує чат-каналами, файлами сеансів, вибором моделей, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex зберігають хуки Plugin OpenClaw як публічний шар сумісності.
Це внутрішньопроцесні хуки OpenClaw, а не командні хуки Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` для дзеркальних записів транскрипту
- `agent_end`

Plugins також можуть реєструвати нейтральне до harness middleware для результатів інструментів, щоб переписувати
динамічні результати інструментів OpenClaw після того, як OpenClaw виконає інструмент, і до того,
як результат буде повернуто в Codex. Це окремо від публічного
хука Plugin `tool_result_persist`, який перетворює записи результатів інструментів у транскрипті,
якими володіє OpenClaw.

harness вимкнений за замовчуванням. У нових конфігураціях слід зберігати посилання на моделі OpenAI
у канонічному вигляді `openai/gpt-*` і явно примусово вказувати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, якщо вони
хочуть нативне виконання через app-server. Застарілі посилання на моделі `codex/*` і далі автоматично вибирають
harness для сумісності, але вони не показуються як звичайні варіанти моделі/провайдера.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, якщо вам потрібен
OAuth Codex через Pi; використовуйте `openai/*`, якщо вам потрібен прямий доступ до OpenAI API або
якщо ви примусово використовуєте нативний harness app-server Codex:

| Посилання на модель                                 | Шлях runtime                                | Використовуйте, коли                                                        |
| --------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                    | Провайдер OpenAI через OpenClaw/Pi plumbing | Вам потрібен поточний прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                              | OAuth OpenAI Codex через OpenClaw/Pi        | Вам потрібна автентифікація підписки ChatGPT/Codex із типовим runner Pi.      |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness app-server Codex                    | Вам потрібне нативне виконання через app-server Codex для вбудованого ходу агента.   |

GPT-5.5 наразі в OpenClaw доступна лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для OAuth через Pi або `openai/gpt-5.5` з harness app-server
Codex. Прямий доступ за API-ключем для `openai/gpt-5.5` буде підтримуватися,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` і далі приймаються як псевдоніми для сумісності. Doctor
міграції сумісності переписує застарілі основні посилання `codex/*` на `openai/*`
і окремо записує політику harness Codex. У нових конфігураціях PI OAuth Codex
слід використовувати `openai-codex/gpt-*`; у нових конфігураціях нативного harness app-server слід
використовувати `openai/gpt-*` разом із `embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` використовує той самий поділ за префіксами. Використовуйте
`openai-codex/gpt-*`, якщо розуміння зображень має виконуватися через шлях провайдера OAuth OpenAI
Codex. Використовуйте `codex/gpt-*`, якщо розуміння зображень має виконуватися
через обмежений хід app-server Codex. Модель app-server Codex повинна
підтримувати введення зображень; текстові моделі Codex завершуються з помилкою ще до початку
медіа-ходу.

Використовуйте `/status`, щоб підтвердити фактичний harness для поточного сеансу. Якщо
вибір виглядає неочікуваним, увімкніть журналювання налагодження для підсистеми `agents/harness`
і перегляньте структурований запис Gateway `agent harness selected`. Він
містить ідентифікатор вибраного harness, причину вибору, політику runtime/fallback і,
у режимі `auto`, результат підтримки для кожного кандидата Plugin.

Вибір harness не є засобом керування активним сеансом. Коли вбудований хід виконується,
OpenClaw записує ідентифікатор вибраного harness у цей сеанс і продовжує використовувати його для
наступних ходів у тому самому ідентифікаторі сеансу. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, якщо хочете, щоб майбутні сеанси використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати новий сеанс перед перемиканням наявної
розмови між Pi і Codex. Це дозволяє уникнути відтворення одного транскрипту через
дві несумісні нативні системи сеансів.

Застарілі сеанси, створені до закріплення harness, вважаються закріпленими за Pi, щойно вони
мають історію транскрипту. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на
Codex після зміни конфігурації.

`/status` показує фактичний не-Pi harness поруч із `Fast`, наприклад
`Fast · codex`. Типовий harness Pi і далі відображається як `Runner: pi (embedded)` і
не додає окремого бейджа harness.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- app-server Codex версії `0.118.0` або новішої.
- Автентифікація Codex, доступна процесу app-server.

Plugin блокує старіші або неверсіоновані handshake app-server. Це дозволяє
OpenClaw залишатися на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить з `OPENAI_API_KEY`, а також
необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть вбудований Plugin і примусово використайте harness `codex`:

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

Застарілі конфігурації, які встановлюють `agents.defaults.model` або модель агента в
`codex/<model>`, і далі автоматично вмикають вбудований Plugin `codex`. У нових конфігураціях
слід віддавати перевагу `openai/<model>` разом із явним записом `embeddedHarness`, наведеним вище.

## Додайте Codex, не замінюючи інші моделі

Зберігайте `runtime: "auto"`, якщо хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
Pi використовувався для всього іншого. Для нових конфігурацій краще явно вказувати `runtime: "codex"`
для агентів, які мають використовувати цей harness.

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
- Якщо вибрано не-Codex модель, Pi залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть fallback на Pi, якщо вам потрібно довести, що кожен вбудований хід агента використовує
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

Перевизначення через середовище:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли fallback вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server надто старий або app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити одного агента лише-Codex, тоді як агент за замовчуванням зберігатиме звичайний
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

Використовуйте звичайні команди сеансу, щоб перемикати агентів і моделі. `/new` створює новий
сеанс OpenClaw, а harness Codex створює або відновлює свій sidecar thread app-server
за потреби. `/reset` очищає прив’язку сеансу OpenClaw для цього thread
і дозволяє наступному ходу знову визначити harness із поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex запитує в app-server доступні моделі. Якщо
виявлення не вдається або завершується за timeout, він використовує вбудований резервний каталог для:

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

За замовчуванням OpenClaw запускає локальні сеанси harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних запитах погодження, на які нікому відповісти.

Щоб увімкнути перегляд погоджень через guardian Codex, установіть `appServer.mode:
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

Guardian — це нативний рецензент погоджень Codex. Коли Codex просить вийти з пісочниці, записати за межі робочого простору або додати дозволи, наприклад доступ до мережі, Codex спрямовує цей запит на погодження до субагента-рецензента, а не до людини через підказку. Рецензент застосовує модель ризиків Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, якщо вам потрібно більше запобіжників, ніж у режимі YOLO, але водночас необхідно, щоб агенти без нагляду могли просуватися далі.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики все одно мають пріоритет над `mode`, тож у складніших розгортаннях можна поєднувати пресет із явними виборами.

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

| Поле                | Значення за замовчуванням                | Значення                                                                                                  |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`               | не встановлено                           | URL WebSocket app-server.                                                                                 |
| `authToken`         | не встановлено                           | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                  | Timeout для викликів control-plane app-server.                                                            |
| `mode`              | `"yolo"`                                 | Пресет для виконання в режимі YOLO або з перевіркою guardian.                                             |
| `approvalPolicy`    | `"never"`                                | Нативна політика погоджень Codex, що надсилається під час запуску/відновлення thread і під час ходу.     |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим пісочниці Codex, що надсилається під час запуску/відновлення thread.                      |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти запити.                    |
| `serviceTier`       | не встановлено                           | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища все ще працюють як fallback для локального тестування, коли
відповідне поле конфігурації не встановлено:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
є кращою для відтворюваних розгортань, оскільки зберігає поведінку Plugin в тому самому
перевіреному файлі, що й решта налаштувань harness Codex.

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

Перевірка harness лише-Codex із вимкненим fallback на Pi:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сеанс OpenClaw приєднано
до наявного thread Codex, наступний хід знову надсилає до
app-server поточну вибрану модель OpenAI, провайдера, політику погоджень, пісочницю та рівень сервісу.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає прив’язку до
thread, але просить Codex продовжити роботу з новою вибраною моделлю.

## Команда Codex

Вбудований Plugin реєструє `/codex` як авторизовану slash-команду. Вона
загальна й працює в будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до app-server, моделі, обліковий запис, ліміти швидкості, сервери MCP і Skills.
- `/codex models` показує поточні моделі app-server Codex.
- `/codex threads [filter]` показує нещодавні threads Codex.
- `/codex resume <thread-id>` приєднує поточний сеанс OpenClaw до наявного thread Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаного thread.
- `/codex review` запускає нативну перевірку Codex для приєднаного thread.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує стан серверів MCP app-server Codex.
- `/codex skills` показує Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей thread Codex, передає
поточну вибрану модель OpenClaw до app-server і зберігає увімкненою
розширену історію.

Поверхня команд вимагає app-server Codex версії `0.118.0` або новішої. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей метод JSON-RPC.

## Межі хуків

harness Codex має три шари хуків:

| Шар                                   | Власник                  | Призначення                                                         |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Хуки Plugin OpenClaw                  | OpenClaw                 | Сумісність продукту/Plugin між harness Pi і Codex.                  |
| Middleware розширення app-server Codex | Вбудовані Plugins OpenClaw | Поведінка адаптера навколо динамічних інструментів OpenClaw для кожного ходу. |
| Нативні хуки Codex                    | Codex                    | Низькорівневий життєвий цикл Codex і політика нативних інструментів із конфігурації Codex. |

OpenClaw не використовує файли Codex `hooks.json` проєкту або глобального рівня для маршрутизації
поведінки Plugin OpenClaw. Нативні хуки Codex корисні для операцій, якими володіє
Codex, як-от політика shell, нативна перевірка результатів інструментів, обробка зупинки та
нативний життєвий цикл Compaction/моделі, але вони не є API Plugin OpenClaw.

Для динамічних інструментів OpenClaw виконує інструмент після того, як Codex запитує
виклик, тому OpenClaw запускає поведінку Plugin і middleware, якою він володіє, у
адаптері harness. Для нативних інструментів Codex канонічним записом інструмента володіє Codex.
OpenClaw може віддзеркалювати вибрані події, але не може переписати нативний thread Codex,
якщо тільки Codex не відкриває цю операцію через app-server або колбеки
нативних хуків.

Коли новіші збірки app-server Codex відкривають нативні події хуків життєвого циклу Compaction і моделі,
OpenClaw має обмежувати підтримку цього протоколу за версією та відображати
події в наявний контракт хуків OpenClaw там, де семантика є чесною.
До того часу події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями на рівні адаптера, а не побайтними копіями
внутрішнього запиту або payload Compaction у Codex.

Нативні сповіщення app-server Codex `hook/started` і `hook/completed` проєктуються як
події агента `codex_app_server.hook` для траєкторії та налагодження.
Вони не викликають хуки Plugin OpenClaw.

## Інструменти, медіа та Compaction

harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, будує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструмента повідомлень
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на погодження інструментів Codex MCP маршрутизуються через потік погоджень Plugin OpenClaw, коли
Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Запити Codex `request_user_input` надсилаються назад до
початкового чату, а наступне поставлене в чергу повідомлення-відповідь відповідає на цей нативний
запит сервера замість того, щоб додаватися як додатковий контекст. Інші запити MCP на
уточнення й далі завершуються з відмовою за замовчуванням.

Коли вибрана модель використовує harness Codex, нативний thread Compaction делегується
app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
включає запит користувача, фінальний текст асистента та спрощені записи міркувань або плану Codex,
коли app-server їх надсилає. Наразі OpenClaw лише записує сигнали початку й завершення
нативного Compaction. Він ще не показує зрозумілий для людини підсумок Compaction або
аудитований список того, які записи Codex зберіг після Compaction.

Оскільки канонічним нативним thread володіє Codex, `tool_result_persist` наразі не
переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли
OpenClaw записує результат інструмента в транскрипт сеансу, яким володіє OpenClaw.

Генерація медіа не потребує Pi. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` з `embeddedHarness.runtime: "codex"` (або
застаріле посилання `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує Pi замість Codex:** якщо жоден harness Codex не бере на себе запуск,
OpenClaw може використовувати Pi як бекенд сумісності. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися з помилкою, коли жоден harness Plugin не підходить. Щойно
вибрано app-server Codex, його збої відображаються безпосередньо без додаткової
конфігурації fallback.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Не-Codex модель використовує Pi:** це очікувано, якщо ви не примусово встановили
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
`openai/gpt-*` та інші посилання провайдерів залишаються на своєму звичайному шляху провайдера.

## Пов’язане

- [Agent Harness Plugins](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
