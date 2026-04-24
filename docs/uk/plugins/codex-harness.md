---
read_when:
    - Ви хочете використовувати вбудований harness app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід до PI для розгортань лише з Codex
summary: Запускайте ходи вбудованого агента OpenClaw через вбудований harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-24T04:17:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 095933d2c32df302c312c67fdc266d2f01b552dddb1607d6e4ecc4f3c3326acf
    source_path: plugins/codex-harness.md
    workflow: 15
---

Вбудований Plugin `codex` дає OpenClaw змогу запускати ходи вбудованого агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням thread, нативною Compaction і виконанням app-server.
OpenClaw і далі керує чат-каналами, файлами сесій, вибором моделей, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом transcript.

Нативні ходи Codex зберігають hooks Plugin OpenClaw як публічний шар сумісності.
Це внутрішньопроцесні hooks OpenClaw, а не командні hooks Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` для дзеркальних записів transcript
- `agent_end`

Вбудовані plugins також можуть реєструвати factory extension app-server Codex, щоб додавати
асинхронний middleware `tool_result`. Цей middleware працює для динамічних інструментів OpenClaw
після того, як OpenClaw виконає інструмент, і до того, як результат буде повернено в Codex. Він
є окремим від публічного hook Plugin `tool_result_persist`, який перетворює записи результатів інструментів у transcript, що належать OpenClaw.

Harness типово вимкнений. Нові конфігурації мають зберігати канонічні посилання на моделі OpenAI у форматі `openai/gpt-*` і явно примусово задавати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли
потрібне нативне виконання app-server. Застарілі посилання на моделі `codex/*` і далі автоматично вибирають
harness для сумісності.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, коли вам потрібен
Codex OAuth через PI; використовуйте `openai/*`, коли вам потрібен прямий доступ до OpenAI API або
коли ви примусово використовуєте нативний harness app-server Codex:

| Посилання на модель                                   | Шлях runtime                                | Використовуйте, коли                                                        |
| ----------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | Провайдер OpenAI через plumbing OpenClaw/PI | Вам потрібен поточний прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OpenAI Codex OAuth через OpenClaw/PI        | Вам потрібна автентифікація підписки ChatGPT/Codex із типовим runner PI.    |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex                    | Вам потрібне нативне виконання app-server Codex для ходу вбудованого агента. |

GPT-5.5 зараз в OpenClaw доступна лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для PI OAuth або `openai/gpt-5.5` з harness
app-server Codex. Прямий доступ за API-ключем для `openai/gpt-5.5` підтримуватиметься,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` і далі приймаються як псевдоніми сумісності. Нові конфігурації
PI Codex OAuth мають використовувати `openai-codex/gpt-*`; нові конфігурації нативного
harness app-server мають використовувати `openai/gpt-*` плюс `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` використовує той самий поділ за префіксами. Використовуйте
`openai-codex/gpt-*`, коли розуміння зображень має виконуватися через шлях провайдера OpenAI
Codex OAuth. Використовуйте `codex/gpt-*`, коли розуміння зображень має виконуватися
через обмежений хід app-server Codex. Модель app-server Codex має
заявляти підтримку введення зображень; текстові моделі Codex завершуються невдачею до
початку медіа-ходу.

Використовуйте `/status`, щоб підтвердити фактичний harness для поточної сесії. Якщо
вибір виглядає неочікуваним, увімкніть debug-логування для підсистеми `agents/harness`
і перевірте структурований запис gateway `agent harness selected`. Він
містить ідентифікатор вибраного harness, причину вибору, політику runtime/fallback і,
у режимі `auto`, результат підтримки для кожного кандидата Plugin.

Вибір harness не є елементом керування live-сесією. Коли виконується вбудований хід,
OpenClaw записує ідентифікатор вибраного harness у цю сесію й продовжує використовувати його для
наступних ходів у тому самому ідентифікаторі сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням
наявної розмови між PI та Codex. Це дає змогу уникнути повторного програвання одного transcript через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до закріплення harness, вважаються закріпленими за PI, щойно в них
з’являється історія transcript. Використовуйте `/new` або `/reset`, щоб перевести цю розмову на
Codex після зміни конфігурації.

`/status` показує фактичний не-PI harness поруч із `Fast`, наприклад
`Fast · codex`. Типовий harness PI як і раніше показується як `Runner: pi (embedded)` і
не додає окремий badge harness.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- App-server Codex версії `0.118.0` або новішої.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старіші або неверсіоновані handshake app-server. Це утримує
OpenClaw на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також із
необов’язкових файлів CLI Codex, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, які використовує ваш локальний
app-server Codex.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть вбудований Plugin і примусово задайте harness `codex`:

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

Якщо у вашій конфігурації використовується `plugins.allow`, також додайте туди `codex`:

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
`codex/<model>`, і далі автоматично вмикають вбудований Plugin `codex`. Нові конфігурації
мають надавати перевагу `openai/<model>` плюс явний запис `embeddedHarness`, наведений вище.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, коли хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
PI — усе інше. Для нових конфігурацій надавайте перевагу явному `runtime: "codex"` для
агентів, які мають використовувати harness.

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

- `/model gpt` або `/model openai/gpt-5.5` використовує harness app-server Codex для цієї конфігурації.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано модель не Codex, PI лишається harness сумісності.

## Розгортання лише з Codex

Вимкніть fallback до PI, коли потрібно гарантувати, що кожен хід вбудованого агента використовує
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

Коли fallback вимкнено, OpenClaw завершується невдачею на ранньому етапі, якщо Plugin Codex вимкнено,
app-server занадто старий або app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити один агент лише з Codex, тоді як типовий агент збереже звичайний
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

Використовуйте звичайні команди сесії для перемикання агентів і моделей. `/new` створює нову
сесію OpenClaw, а harness Codex за потреби створює або відновлює свій sidecar
thread app-server. `/reset` очищає прив’язку сесії OpenClaw для цього thread
і дає наступному ходу знову визначити harness із поточної конфігурації.

## Виявлення моделей

Типово Plugin Codex запитує в app-server доступні моделі. Якщо
виявлення завершується невдачею або перевищує тайм-аут, використовується вбудований резервний каталог для:

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

Вимкніть виявлення, коли хочете, щоб під час запуску не виконувалась probe Codex і використовувався
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

Типово Plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

Типово OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це поза довіри локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати shell- і мережеві інструменти без
зупинки на нативних запитах погодження, на які нікому відповісти.

Щоб увімкнути погодження Codex, переглянуті Guardian, установіть `appServer.mode:
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

Guardian — це нативний reviewer погоджень Codex. Коли Codex просить вийти за межі sandbox, записати поза workspace або додати дозволи, як-от доступ до мережі, Codex маршрутизує цей запит на погодження до субагента-рецензента замість запиту людині. Reviewer застосовує систему оцінки ризиків Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, коли вам потрібні суворіші запобіжники, ніж у режимі YOLO, але при цьому потрібно, щоб агенти без нагляду могли просуватися далі.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики, як і раніше, перевизначають `mode`, тож у складних розгортаннях можна поєднувати пресет з явними налаштуваннями.

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

| Поле               | Типове значення                          | Значення                                                                                                   |
| ------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`        | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                            |
| `command`          | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                     |
| `args`             | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                            |
| `url`              | не встановлено                           | URL WebSocket app-server.                                                                                  |
| `authToken`        | не встановлено                           | Bearer-токен для транспорту WebSocket.                                                                     |
| `headers`          | `{}`                                     | Додаткові заголовки WebSocket.                                                                             |
| `requestTimeoutMs` | `60000`                                  | Тайм-аут для викликів control-plane app-server.                                                            |
| `mode`             | `"yolo"`                                 | Пресет для виконання в режимі YOLO або з погодженнями, переглянутими Guardian.                            |
| `approvalPolicy`   | `"never"`                                | Нативна політика погоджень Codex, яка надсилається під час start/resume/turn thread.                      |
| `sandbox`          | `"danger-full-access"`                   | Нативний режим sandbox Codex, який надсилається під час start/resume thread.                              |
| `approvalsReviewer`| `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб дозволити Guardian Codex переглядати запити.                    |
| `serviceTier`      | не встановлено                           | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища і далі працюють як резервні варіанти для локального тестування, коли
відповідне поле конфігурації не встановлено:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Замість цього використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Для
відтворюваних розгортань надається перевага конфігурації, оскільки вона зберігає поведінку Plugin у тому самому
переглянутому файлі, що й решта налаштувань harness Codex.

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

Перевірка harness лише з Codex, із вимкненим fallback до PI:

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

Погодження Codex, переглянуті Guardian:

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
до наявного thread Codex, наступний хід знову надсилає до
app-server поточно вибрану модель OpenAI, провайдера, політику погоджень, sandbox і service tier.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає прив’язку до
thread, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Вбудований Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює на будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує live-підключення до app-server, моделі, обліковий запис, ліміти швидкості, сервери MCP і Skills.
- `/codex models` перелічує live-моделі app-server Codex.
- `/codex threads [filter]` перелічує нещодавні thread Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного thread Codex.
- `/codex compact` просить app-server Codex виконати Compaction прив’язаного thread.
- `/codex review` запускає нативний review Codex для прив’язаного thread.
- `/codex account` показує стан облікового запису й лімітів швидкості.
- `/codex mcp` перелічує стан серверів MCP app-server Codex.
- `/codex skills` перелічує Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей thread Codex, передає
поточну вибрану модель OpenClaw в app-server і зберігає
увімкнену розширену історію.

Поверхня команди вимагає app-server Codex версії `0.118.0` або новішої. Окремі
методи керування повідомляються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей JSON-RPC-метод.

## Межі hooks

Harness Codex має три шари hooks:

| Шар                                   | Власник                  | Призначення                                                          |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooks Plugin OpenClaw                 | OpenClaw                 | Сумісність продукту/Plugin між harness PI і Codex.                   |
| Middleware extension app-server Codex | Вбудовані plugins OpenClaw | Адаптерна поведінка для кожного ходу навколо динамічних інструментів OpenClaw. |
| Нативні hooks Codex                   | Codex                    | Низькорівневий життєвий цикл Codex і політика нативних інструментів із конфігурації Codex. |

OpenClaw не використовує файли проєктного або глобального Codex `hooks.json` для маршрутизації
поведінки Plugin OpenClaw. Нативні hooks Codex корисні для операцій, якими володіє Codex,
як-от політика shell, review результатів нативних інструментів, обробка зупинки та
нативний життєвий цикл Compaction/моделі, але вони не є API Plugin OpenClaw.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як Codex запитує
виклик, тому OpenClaw запускає поведінку Plugin і middleware, якою він володіє, в
адаптері harness. Для нативних інструментів Codex саме Codex володіє канонічним записом інструмента.
OpenClaw може дзеркалити вибрані події, але не може переписувати нативний
thread Codex, якщо тільки Codex не надає цю операцію через app-server або callback-и
нативних hooks.

Коли новіші збірки app-server Codex надаватимуть нативні події hooks для Compaction і життєвого циклу моделі,
OpenClaw має з урахуванням версії протоколу підтримувати це й зіставляти
події з наявним контрактом hooks OpenClaw там, де така семантика є чесною.
До того часу події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями на рівні адаптера, а не побайтними захопленнями
внутрішнього запиту або payload Compaction Codex.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі формує список інструментів і отримує результати динамічних інструментів із
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів повідомлень
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на погодження інструментів Codex MCP маршрутизуються через потік погодження Plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Запити Codex `request_user_input` надсилаються назад до
вихідного чату, а наступне поставлене в чергу подальше повідомлення відповідає на цей нативний
запит сервера замість того, щоб спрямовуватися як додатковий контекст. Інші запити elicitation MCP
і далі безпечно блокуються.

Коли вибрана модель використовує harness Codex, нативний Compaction thread делегується
app-server Codex. OpenClaw зберігає дзеркало transcript для історії каналів,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
містить prompt користувача, фінальний текст асистента та полегшені записи reasoning або plan Codex,
коли app-server їх надсилає. Наразі OpenClaw лише записує нативні сигнали початку
та завершення Compaction. Він ще не надає зручне для читання людиною зведення Compaction або
аудитний список того, які записи Codex зберіг після Compaction.

Оскільки Codex володіє канонічним нативним thread, `tool_result_persist` наразі не
переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли
OpenClaw записує результат інструмента до transcript сесії, що належить OpenClaw.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` з `embeddedHarness.runtime: "codex"` (або
застарілим посиланням `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не перехоплює запуск,
OpenClaw може використовувати PI як backend сумісності. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибирати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися невдачею, коли жоден harness Plugin не підходить. Щойно
вибрано app-server Codex, його збої відображаються безпосередньо без додаткового
fallback-конфігу.

**App-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket відразу завершується невдачею:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель не Codex використовує PI:** це очікувана поведінка, якщо ви не примусово задали
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
`openai/gpt-*` та інші посилання провайдерів лишаються на своєму нормальному шляху провайдера.

## Пов’язане

- [Plugins Harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
