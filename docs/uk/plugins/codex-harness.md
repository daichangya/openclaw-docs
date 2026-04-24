---
read_when:
    - Ви хочете використовувати комплектний harness app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід на Pi для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-24T03:19:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6185e11a7f04957548465a500c2cc1eb85237787103e4a507225bb890566e077
    source_path: plugins/codex-harness.md
    workflow: 15
---

Комплектний Plugin `codex` дає змогу OpenClaw запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням thread, нативним Compaction і виконанням app-server.
OpenClaw, як і раніше, керує каналами chat, файлами сесій, вибором моделей, інструментами,
погодженнями, доставленням медіа й видимим дзеркалом транскрипту.

Нативні ходи Codex зберігають hook Plugin OpenClaw як публічний шар сумісності.
Це внутрішньопроцесні hook OpenClaw, а не hook команд Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` для дзеркальних записів транскрипту
- `agent_end`

Комплектні Plugin також можуть реєструвати factory розширення app-server Codex, щоб додати
асинхронне middleware `tool_result`. Це middleware виконується для динамічних інструментів OpenClaw
після того, як OpenClaw виконає інструмент, і до того, як результат буде повернуто в Codex. Воно
відокремлене від публічного hook Plugin `tool_result_persist`, який перетворює записи
результатів інструментів у транскрипті, яким володіє OpenClaw.

Типово harness вимкнений. Нові конфігурації мають зберігати канонічні посилання на моделі OpenAI
у вигляді `openai/gpt-*` і явно примусово задавати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли вони
хочуть використовувати нативне виконання через app-server. Застарілі посилання на моделі `codex/*`
усе ще автоматично вибирають harness для сумісності.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, коли хочете
OAuth Codex через PI; використовуйте `openai/*`, коли хочете прямий доступ до OpenAI API або
коли примусово використовуєте нативний harness app-server Codex:

| Посилання на модель                                  | Шлях середовища виконання                     | Використовуйте, коли                                                       |
| ---------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | provider OpenAI через рівень OpenClaw/PI      | Ви хочете поточний прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OAuth OpenAI Codex через OpenClaw/PI          | Ви хочете автентифікацію підписки ChatGPT/Codex з типовим виконавцем PI.   |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"`| harness app-server Codex                      | Ви хочете нативне виконання через app-server Codex для вбудованого ходу агента. |

Наразі GPT-5.5 в OpenClaw доступна лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для OAuth PI або `openai/gpt-5.5` з harness
app-server Codex. Прямий доступ через API-ключ для `openai/gpt-5.5` буде підтримано,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` і далі приймаються як псевдоніми сумісності. Нові конфігурації
PI Codex OAuth мають використовувати `openai-codex/gpt-*`; нові конфігурації нативного
harness app-server мають використовувати `openai/gpt-*` плюс `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` дотримується такого самого розділення за префіксами. Використовуйте
`openai-codex/gpt-*`, коли розуміння зображень має виконуватися через шлях provider
OAuth OpenAI Codex. Використовуйте `codex/gpt-*`, коли розуміння зображень має виконуватися
через обмежений хід app-server Codex. Модель app-server Codex повинна
заявляти підтримку вхідних зображень; текстові моделі Codex завершуються помилкою ще до початку
медіа-ходу.

Використовуйте `/status`, щоб підтвердити фактичний harness для поточної сесії. Якщо вибір
неочікуваний, увімкніть журналювання debug для підсистеми `agents/harness`
і перегляньте структурований запис gateway `agent harness selected`. Він
містить ідентифікатор вибраного harness, причину вибору, політику runtime/fallback і,
у режимі `auto`, результат підтримки для кожного кандидата Plugin.

Вибір harness не є керуванням live-сесією. Коли виконується вбудований хід,
OpenClaw записує ідентифікатор вибраного harness для цієї сесії й продовжує використовувати його
для наступних ходів із тим самим ідентифікатором сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між PI та Codex. Це запобігає повторному відтворенню одного транскрипту через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до фіксації harness, вважаються зафіксованими на PI, щойно вони
отримують історію транскрипту. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на
Codex після зміни конфігурації.

`/status` показує фактичний harness, відмінний від PI, поруч із `Fast`, наприклад
`Fast · codex`. Типовий harness PI як і раніше показується як `Runner: pi (embedded)` і
не додає окремий бейдж harness.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Автентифікація Codex, доступна процесу app-server.

Plugin блокує старіші або безверсійні handshake app-server. Це дає змогу
OpenClaw залишатися на поверхні протоколу, яку було протестовано.

Для live- і Docker-smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, плюс
необов’язкові файли Codex CLI, такі як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, які використовує ваш локальний app-server Codex.

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

Якщо ваша конфігурація використовує `plugins.allow`, включіть туди також `codex`:

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

Застарілі конфігурації, які задають `agents.defaults.model` або модель агента як
`codex/<model>`, усе ще автоматично вмикають комплектний Plugin `codex`. Нові конфігурації мають
надавати перевагу `openai/<model>` плюс явному запису `embeddedHarness`, наведеному вище.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, коли хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
PI — для всього іншого. Для нових конфігурацій надавайте перевагу явному `runtime: "codex"` для
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
- `/model opus` використовує шлях provider Anthropic.
- Якщо вибрано модель, відмінну від Codex, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть fallback на PI, коли потрібно гарантувати, що кожен вбудований хід агента використовує
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

Коли fallback вимкнено, OpenClaw завершується помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server занадто старий або app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити одного агента лише для Codex, тоді як типовий агент збереже звичайний
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
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar-thread app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього thread
і дає змогу наступному ходу знову визначити harness із поточної конфігурації.

## Виявлення моделей

Типово Plugin Codex запитує app-server про доступні моделі. Якщо
виявлення завершується помилкою або тайм-аутом, він використовує комплектний резервний каталог для:

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

Вимкніть виявлення, коли хочете, щоб під час запуску OpenClaw не перевіряв Codex і використовував
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
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, що використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних prompt погодження, на які нікому відповідати.

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
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian — це нативний reviewer погоджень Codex. Коли Codex просить вийти із sandbox, писати поза робочим простором або додати дозволи на кшталт мережевого доступу, Codex маршрутизує такий запит на погодження до підлеглого агента-reviewer, а не до людини через prompt. Reviewer застосовує систему оцінювання ризиків Codex і погоджує або відхиляє конкретний запит. Використовуйте Guardian, коли вам потрібні суворіші обмеження, ніж у режимі YOLO, але при цьому потрібно, щоб агенти без нагляду продовжували працювати.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики все одно перевизначають `mode`, тож складніші розгортання можуть поєднувати цей пресет із явними виборами.

Для app-server, який уже працює, використовуйте транспорт WebSocket:

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

| Поле                 | Типове значення                          | Значення                                                                                                  |
| -------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`          | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`            | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                    |
| `args`               | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`                | не встановлено                           | URL app-server WebSocket.                                                                                 |
| `authToken`          | не встановлено                           | Bearer token для транспорту WebSocket.                                                                    |
| `headers`            | `{}`                                     | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`   | `60000`                                  | Тайм-аут для викликів control-plane app-server.                                                           |
| `mode`               | `"yolo"`                                 | Пресет для виконання в режимі YOLO або з перевіркою Guardian.                                             |
| `approvalPolicy`     | `"never"`                                | Нативна політика погоджень Codex, що надсилається під час start/resume/turn thread.                      |
| `sandbox`            | `"danger-full-access"`                   | Нативний режим sandbox Codex, що надсилається під час start/resume thread.                                |
| `approvalsReviewer`  | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти prompt.                    |
| `serviceTier`        | не встановлено                           | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища все ще працюють як fallback для локального тестування, коли
відповідне поле конфігурації не встановлено:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального тестування. Конфігурація
є кращою для відтворюваних розгортань, оскільки зберігає поведінку Plugin у тому самому
перевіреному файлі, що й решту налаштування harness Codex.

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

Перевірка harness лише для Codex, з вимкненим fallback на PI:

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

Погодження Codex з перевіркою Guardian:

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
до наявного thread Codex, наступний хід знову надсилає до
app-server поточно вибрану модель OpenAI, provider, політику погоджень, sandbox і service tier.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив’язку до thread, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює на будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує живе підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP-сервери та skills.
- `/codex models` виводить живі моделі app-server Codex.
- `/codex threads [filter]` виводить список нещодавніх thread Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного thread Codex.
- `/codex compact` просить app-server Codex виконати compaction для прив’язаного thread.
- `/codex review` запускає нативну перевірку Codex для прив’язаного thread.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує стан MCP-серверів app-server Codex.
- `/codex skills` виводить skills app-server Codex.

`/codex resume` записує той самий файл sidecar-прив’язки, який harness використовує для
звичайних ходів. На наступному повідомленні OpenClaw відновлює цей thread Codex, передає
поточну вибрану модель OpenClaw до app-server і зберігає
увімкнену розширену історію.

Поверхня команди вимагає Codex app-server `0.118.0` або новішої версії. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або власний app-server не надає цей метод JSON-RPC.

## Межі hook

Harness Codex має три шари hook:

| Шар                                   | Власник                  | Призначення                                                          |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Сумісність продукту/Plugin між harness PI і Codex.                   |
| Middleware розширень app-server Codex | Комплектні Plugin OpenClaw | Адаптерна поведінка для кожного ходу навколо динамічних інструментів OpenClaw. |
| Нативні hook Codex                    | Codex                    | Низькорівневий життєвий цикл Codex і політика нативних інструментів із конфігурації Codex. |

OpenClaw не використовує файли `hooks.json` Codex на рівні проєкту або глобально, щоб маршрутизувати
поведінку Plugin OpenClaw. Нативні hook Codex корисні для операцій, якими володіє Codex,
таких як політика shell, перевірка результатів нативних інструментів, обробка зупинки та
нативний життєвий цикл compaction/моделей, але вони не є API Plugin OpenClaw.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як Codex запитає
виклик, тож OpenClaw запускає поведінку Plugin і middleware, якою він володіє, у
адаптері harness. Для нативних інструментів Codex сам володіє канонічним записом інструмента.
OpenClaw може віддзеркалювати окремі події, але не може переписати нативний thread Codex,
якщо тільки Codex не надає цю операцію через app-server або callbacks нативних
hook.

Коли новіші збірки app-server Codex надаватимуть нативні події hook життєвого циклу compaction і моделей,
OpenClaw має версіонно обмежувати підтримку цього протоколу та відображати ці
події в наявний контракт hook OpenClaw там, де семантика є чесною.
До того `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` в OpenClaw є спостереженнями на рівні адаптера, а не побайтовими копіями
внутрішнього запиту Codex або payload compaction.

## Інструменти, медіа та compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, будує список інструментів і отримує результати динамічних інструментів із
harness. Текст, зображення, відео, музика, TTS, погодження та вихід інструментів обміну повідомленнями
і далі проходять звичайним шляхом доставлення OpenClaw.

Запити погодження MCP-інструментів Codex маршрутизуються через потік погоджень Plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на підтвердження та запити довільного введення, як і раніше, завершуються
закритою відмовою.

Коли вибрана модель використовує harness Codex, нативний compaction thread делегується
app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
включає prompt користувача, фінальний текст assistant і полегшені записи reasoning або плану Codex, коли app-server їх надсилає. Наразі OpenClaw лише записує сигнали початку й завершення нативного compaction. Він поки що не надає
людинозрозумілого підсумку compaction або аудиторського списку того, які записи Codex
залишив після compaction.

Оскільки Codex володіє канонічним нативним thread, `tool_result_persist` наразі не
переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли
OpenClaw записує результат інструмента в транскрипт сесії, яким володіє OpenClaw.

Генерація медіа не вимагає PI. Генерація зображень, відео, музики, PDF, TTS і розуміння медіа
і далі використовують відповідні налаштування provider/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` з `embeddedHarness.runtime: "codex"` (або
застаріле посилання `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не перехоплює запуск,
OpenClaw може використовувати PI як backend сумісності. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися помилкою, коли жоден harness Plugin не збігається. Щойно
буде вибрано app-server Codex, його помилки передаватимуться безпосередньо без додаткової
конфігурації fallback.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель, не пов’язана з Codex, використовує PI:** це очікувано, якщо ви не примусово задали
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
`openai/gpt-*` та інші посилання provider залишаються на своєму звичайному шляху provider.

## Пов’язано

- [Plugin Harness агента](/uk/plugins/sdk-agent-harness)
- [Provider моделей](/uk/concepts/model-providers)
- [Довідник з конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
