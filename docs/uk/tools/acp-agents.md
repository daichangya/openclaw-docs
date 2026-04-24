---
read_when:
    - Запуск coding harnesses через ACP
    - Налаштування прив’язаних до розмови сесій ACP на каналах обміну повідомленнями
    - Прив’язування розмови в каналі обміну повідомленнями до постійної сесії ACP
    - Усунення несправностей backend ACP і підключення Plugin
    - Налагодження доставки завершення ACP або циклів agent-to-agent
    - Використання команд /acp у чаті
summary: Використовуйте сесії runtime ACP для Claude Code, Cursor, Gemini CLI, явного fallback Codex ACP, OpenClaw ACP та інших harness-агентів
title: Агенти ACP
x-i18n:
    generated_at: "2026-04-24T04:20:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

Сесії [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) дають OpenClaw змогу запускати зовнішні coding harnesses (наприклад Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI та інші підтримувані ACPX harnesses) через backend Plugin ACP.

Якщо ви просите OpenClaw звичайною мовою прив’язати або керувати Codex у поточній розмові, OpenClaw має використовувати native Plugin app-server Codex (`/codex bind`, `/codex threads`, `/codex resume`). Якщо ви просите `/acp`, ACP, acpx або фонову дочірню сесію Codex, OpenClaw усе одно може маршрутизувати Codex через ACP. Кожне породження сесії ACP відстежується як [фонове завдання](/uk/automation/tasks).

Якщо ви просите OpenClaw звичайною мовою «запустити Claude Code у thread» або використати інший зовнішній harness, OpenClaw має маршрутизувати цей запит до runtime ACP (а не до native runtime підагента).

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній MCP client безпосередньо
до наявних розмов каналів OpenClaw, використовуйте [`openclaw mcp serve`](/uk/cli/mcp)
замість ACP.

## Яку сторінку мені потрібно?

Поруч є три поверхні, які легко переплутати:

| Ви хочете...                                                                                   | Використовуйте це                     | Примітки                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Прив’язати або керувати Codex у поточній розмові                                               | `/codex bind`, `/codex threads`       | Шлях native app-server Codex; включає прив’язані відповіді в чаті, переспрямування зображень, model/fast/permissions, stop і елементи steer. ACP — явний fallback |
| Запустити Claude Code, Gemini CLI, явний Codex ACP або інший зовнішній harness _через_ OpenClaw | Ця сторінка: агенти ACP               | Прив’язані до чату сесії, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, елементи керування runtime                                  |
| Відкрити сесію Gateway OpenClaw _як_ сервер ACP для редактора або клієнта                      | [`openclaw acp`](/uk/cli/acp)            | Режим bridge. IDE/клієнт спілкується з OpenClaw через ACP по stdio/WebSocket                                                                                |
| Повторно використати локальний AI CLI як текстовий fallback model                              | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Немає інструментів OpenClaw, немає елементів керування ACP, немає runtime harness                                                                   |

## Чи працює це одразу після встановлення?

Зазвичай так. Свіжі встановлення постачаються з увімкненим за замовчуванням вбудованим runtime Plugin `acpx`, із зафіксованим `acpx` binary на рівні Plugin, який OpenClaw перевіряє та самостійно відновлює під час запуску. Виконайте `/acp doctor` для перевірки готовності.

Поширені нюанси першого запуску:

- Адаптери цільових harnesses (Codex, Claude тощо) можуть бути завантажені на вимогу через `npx` під час першого використання.
- Автентифікація постачальника все одно має бути наявною на хості для цього harness.
- Якщо хост не має npm або доступу до мережі, завантаження адаптерів під час першого запуску не вдасться, доки кеші не буде попередньо прогріто або адаптер не буде встановлено іншим способом.

## Операторський runbook

Швидкий процес `/acp` із чату:

1. **Породити** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` або явний `/acp spawn codex --bind here`
2. **Працювати** у прив’язаній розмові або thread (або явно вказати ключ сесії).
3. **Перевірити стан** — `/acp status`
4. **Налаштувати** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Скерувати** без заміни context — `/acp steer tighten logging and continue`
6. **Зупинити** — `/acp cancel` (поточний хід) або `/acp close` (сесія + прив’язки)

Тригери природною мовою, які мають маршрутизуватися до native Plugin Codex:

- "Bind this Discord channel to Codex."
- "Attach this chat to Codex thread `<id>`."
- "Show Codex threads, then bind this one."

Native прив’язка розмови Codex — це типовий шлях керування чатом, але він навмисно консервативний для інтерактивних потоків погодження/інструментів Codex: dynamic tools OpenClaw і prompts погодження поки що не доступні через цей шлях прив’язаного чату, тому такі запити відхиляються з чітким поясненням. Використовуйте шлях harness Codex або явний fallback ACP, коли робочий процес залежить від dynamic tools OpenClaw або довготривалих інтерактивних погоджень.

Тригери природною мовою, які мають маршрутизуватися до runtime ACP:

- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
- "Run Codex through ACP in a background thread."

OpenClaw вибирає `runtime: "acp"`, визначає `agentId` harness, прив’язується до поточної розмови або thread, коли це підтримується, і маршрутизує подальші повідомлення до цієї сесії до закриття/завершення строку дії. Codex слідує цим шляхом лише тоді, коли ACP указано явно або коли запитуваний фоновий runtime усе ще потребує ACP.

## ACP проти підагентів

Використовуйте ACP, коли вам потрібен зовнішній runtime harness. Використовуйте native app-server Codex для прив’язки/керування розмовами Codex. Використовуйте підагентів, коли вам потрібні делеговані запуски, native для OpenClaw.

| Область       | Сесія ACP                             | Запуск підагента                    |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | backend Plugin ACP (наприклад acpx)   | native runtime підагента OpenClaw   |
| Ключ сесії    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Основні команди | `/acp ...`                          | `/subagents ...`                    |
| Інструмент spawn | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (типовий runtime)  |

Див. також [Підагенти](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування сесією ACP OpenClaw
2. вбудований runtime Plugin `acpx`
3. адаптер Claude ACP
4. механіка runtime/сесії на боці Claude

Важлива відмінність:

- ACP Claude — це сесія harness з елементами керування ACP, відновленням сесії, відстеженням фонового завдання та необов’язковою прив’язкою розмови/thread.
- CLI backends — це окремі локальні runtime fallback лише для тексту. Див. [CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- якщо потрібні `/acp spawn`, сесії з прив’язкою, елементи керування runtime або постійна робота harness: використовуйте ACP
- якщо потрібен простий локальний текстовий fallback через raw CLI: використовуйте CLI backends

## Прив’язані сесії

### Прив’язки до поточної розмови

`/acp spawn <harness> --bind here` прикріплює поточну розмову до породженої сесії ACP — без дочірнього thread, та сама поверхня чату. OpenClaw продовжує володіти transport, auth, safety і доставкою; подальші повідомлення в цій розмові маршрутизуються до тієї самої сесії; `/new` і `/reset` скидають сесію на місці; `/acp close` прибирає прив’язку.

Ментальна модель:

- **поверхня чату** — де люди продовжують спілкуватися (канал Discord, topic Telegram, чат iMessage).
- **сесія ACP** — довговічний стан runtime Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **дочірній thread/topic** — необов’язкова додаткова поверхня обміну повідомленнями, створювана лише через `--thread ...`.
- **робочий простір runtime** — розташування файлової системи (`cwd`, checkout repo, робочий простір backend), де працює harness. Воно не залежить від поверхні чату.

Приклади:

- `/codex bind` — зберегти цей чат, породити або приєднати native app-server Codex, маршрутизувати майбутні повідомлення сюди.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — налаштовувати прив’язаний native thread Codex із чату.
- `/codex stop` або `/codex steer focus on the failing tests first` — керувати активним ходом native Codex.
- `/acp spawn codex --bind here` — явний fallback ACP для Codex.
- `/acp spawn codex --thread auto` — OpenClaw може створити дочірній thread/topic і прив’язати там.
- `/acp spawn codex --bind here --cwd /workspace/repo` — та сама прив’язка чату, Codex працює в `/workspace/repo`.

Примітки:

- `--bind here` і `--thread ...` взаємовиключні.
- `--bind here` працює лише на каналах, які оголошують прив’язку до поточної розмови; інакше OpenClaw повертає чітке повідомлення про непідтримуваність. Прив’язки зберігаються після перезапусків gateway.
- У Discord `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній thread для `--thread auto|here`, а не для `--bind here`.
- Якщо ви породжуєте інший ACP agent без `--cwd`, OpenClaw типово успадковує робочий простір **цільового agent**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) переводяться на типовий backend; інші помилки доступу (наприклад `EACCES`) показуються як помилки spawn.

### Сесії, прив’язані до thread

Коли прив’язки thread увімкнено для adapter каналу, сесії ACP можна прив’язувати до threads:

- OpenClaw прив’язує thread до цільової сесії ACP.
- Подальші повідомлення в цьому thread маршрутизуються до прив’язаної сесії ACP.
- Вивід ACP доставляється назад у той самий thread.
- Втрата фокуса/закриття/архівування/тайм-аут бездіяльності або завершення максимального строку дії прибирає прив’язку.

Підтримка прив’язки thread залежить від adapter. Якщо активний adapter каналу не підтримує прив’язки thread, OpenClaw повертає чітке повідомлення про непідтримуваність/недоступність.

Потрібні feature flags для ACP, прив’язаного до thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` увімкнено типово (встановіть `false`, щоб призупинити dispatch ACP)
- Увімкнений прапорець породження ACP thread у channel-adapter (залежить від adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Канали з підтримкою thread

- Будь-який adapter каналу, який надає можливість прив’язки session/thread.
- Поточна вбудована підтримка:
  - threads/channels Discord
  - topics Telegram (forum topics у groups/supergroups і DM topics)
- Канали Plugin можуть додавати підтримку через той самий інтерфейс прив’язки.

## Налаштування, специфічні для каналу

Для неплинних робочих процесів налаштовуйте постійні прив’язки ACP у записах верхнього рівня `bindings[]`.

### Модель прив’язки

- `bindings[].type="acp"` позначає постійну прив’язку розмови ACP.
- `bindings[].match` ідентифікує цільову розмову:
  - канал або thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - forum topic Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - DM/group chat BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Надавайте перевагу `chat_id:*` або `chat_identifier:*` для стабільних прив’язок груп.
  - DM/group chat iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Надавайте перевагу `chat_id:*` для стабільних прив’язок груп.
- `bindings[].agentId` — це id agent OpenClaw, якому належить прив’язка.
- Необов’язкові перевизначення ACP містяться в `bindings[].acp`:
  - `mode` (`persistent` або `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Типові значення runtime для кожного agent

Використовуйте `agents.list[].runtime`, щоб один раз визначити типові значення ACP для кожного agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Пріоритет перевизначення для прив’язаних сесій ACP:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. глобальні типові значення ACP (наприклад `acp.backend`)

Приклад:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Поведінка:

- OpenClaw гарантує, що налаштована сесія ACP існує перед використанням.
- Повідомлення в цьому каналі або topic маршрутизуються до налаштованої сесії ACP.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ сесії ACP на місці.
- Тимчасові прив’язки runtime (наприклад створені потоками thread-focus) усе ще застосовуються, де вони є.
- Для міжагентних ACP spawn без явного `cwd` OpenClaw успадковує робочий простір цільового agent із config agent.
- Відсутні успадковані шляхи робочого простору переводяться на типовий `cwd` backend; помилки доступу для наявних шляхів повертаються як помилки spawn.

## Запуск сесій ACP (інтерфейси)

### Із `sessions_spawn`

Використовуйте `runtime: "acp"`, щоб запустити сесію ACP із ходу agent або виклику tool.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Примітки:

- `runtime` типово має значення `subagent`, тому для сесій ACP явно вказуйте `runtime: "acp"`.
- Якщо `agentId` пропущено, OpenClaw використовує `acp.defaultAgent`, коли його налаштовано.
- `mode: "session"` вимагає `thread: true`, щоб зберегти постійну прив’язану розмову.

Деталі інтерфейсу:

- `task` (обов’язковий): початковий prompt, що надсилається до сесії ACP.
- `runtime` (обов’язковий для ACP): має бути `"acp"`.
- `agentId` (необов’язковий): id цільового harness ACP. Використовує `acp.defaultAgent` як fallback, якщо його задано.
- `thread` (необов’язковий, типово `false`): запитати потік прив’язки thread, де це підтримується.
- `mode` (необов’язковий): `run` (одноразовий запуск) або `session` (постійний).
  - типове значення — `run`
  - якщо `thread: true` і mode пропущено, OpenClaw може типово вибирати постійну поведінку залежно від шляху runtime
  - `mode: "session"` вимагає `thread: true`
- `cwd` (необов’язковий): запитуваний робочий каталог runtime (перевіряється політикою backend/runtime). Якщо пропущено, ACP spawn успадковує робочий простір цільового agent, коли його налаштовано; відсутні успадковані шляхи переводяться на типові значення backend, тоді як реальні помилки доступу повертаються.
- `label` (необов’язковий): мітка для оператора, яка використовується в тексті сесії/банера.
- `resumeSessionId` (необов’язковий): відновити наявну сесію ACP замість створення нової. Agent відтворює історію своєї розмови через `session/load`. Вимагає `runtime: "acp"`.
- `streamTo` (необов’язковий): `"parent"` передає підсумки прогресу початкового запуску ACP назад до сесії-запитувача як системні події.
  - Якщо доступно, прийняті відповіді включають `streamLogPath`, що вказує на JSONL-журнал у межах сесії (`<sessionId>.acp-stream.jsonl`), який можна переглядати для повної історії relay.
- `model` (необов’язковий): явне перевизначення model для дочірньої сесії ACP. Враховується для `runtime: "acp"`, щоб дочірня сесія використовувала запитану model замість неявного fallback до типового значення цільового agent.

## Модель доставки

Сесії ACP можуть бути або інтерактивними робочими просторами, або фоновою роботою, що належить parent. Шлях доставки залежить від цієї форми.

### Інтерактивні сесії ACP

Інтерактивні сесії призначені для продовження спілкування на видимій поверхні чату:

- `/acp spawn ... --bind here` прив’язує поточну розмову до сесії ACP.
- `/acp spawn ... --thread ...` прив’язує thread/topic каналу до сесії ACP.
- Постійні налаштовані `bindings[].type="acp"` маршрутизують відповідні розмови до тієї самої сесії ACP.

Подальші повідомлення в прив’язаній розмові маршрутизуються безпосередньо до сесії ACP, а вивід ACP доставляється назад до того самого каналу/thread/topic.

### Одноразові сесії ACP, що належать parent

Одноразові сесії ACP, породжені іншим запуском agent, є фоновими дочірніми сесіями, подібно до підагентів:

- Parent запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Дочірня сесія виконується у власній сесії harness ACP.
- Завершення повідомляється назад через внутрішній шлях сповіщення про завершення завдання.
- Parent переписує результат дочірньої сесії звичайним голосом assistant, коли потрібна відповідь для користувача.

Не розглядайте цей шлях як peer-to-peer чат між parent і child. Дочірня сесія вже має канал завершення назад до parent.

### `sessions_send` і доставка A2A

`sessions_send` може націлюватися на іншу сесію після spawn. Для звичайних peer-сесій OpenClaw використовує шлях подальшої взаємодії agent-to-agent (A2A) після вставлення повідомлення:

- чекати відповіді цільової сесії
- за потреби дозволити запитувачу й цілі обмінятися обмеженою кількістю подальших ходів
- попросити цільову сесію створити announce message
- доставити це announce у видимий канал або thread

Цей шлях A2A є fallback для peer-відправлень, де відправнику потрібна видима подальша відповідь. Він залишається ввімкненим, коли непов’язана сесія може бачити й надсилати повідомлення до цілі ACP, наприклад за широких налаштувань `tools.sessions.visibility`.

OpenClaw пропускає подальшу взаємодію A2A лише тоді, коли запитувач є parent власної одноразової дочірньої сесії ACP, що йому належить. У такому разі запуск A2A поверх завершення завдання може пробудити parent результатом child, переслати відповідь parent назад у child і створити цикл echo між parent і child. Результат `sessions_send` повідомляє `delivery.status="skipped"` для такого випадку owned-child, оскільки шлях завершення вже відповідає за результат.

### Відновлення наявної сесії

Використовуйте `resumeSessionId`, щоб продовжити попередню сесію ACP замість запуску з нуля. Agent відтворює історію своєї розмови через `session/load`, тому підхоплює роботу з повним context того, що було раніше.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Поширені сценарії використання:

- Передати сесію Codex з ноутбука на телефон — попросіть свого agent продовжити з того місця, де ви зупинилися
- Продовжити coding session, яку ви почали інтерактивно в CLI, а тепер — безголово через свого agent
- Відновити роботу, яку було перервано перезапуском gateway або тайм-аутом бездіяльності

Примітки:

- `resumeSessionId` вимагає `runtime: "acp"` — повертає помилку, якщо використовується з runtime підагента.
- `resumeSessionId` відновлює історію розмови ACP вище за потоком; `thread` і `mode` усе одно застосовуються звичайним чином до нової сесії OpenClaw, яку ви створюєте, тому `mode: "session"` як і раніше вимагає `thread: true`.
- Цільовий agent має підтримувати `session/load` (Codex і Claude Code підтримують).
- Якщо id сесії не знайдено, spawn завершується з чіткою помилкою — без тихого fallback до нової сесії.

<Accordion title="Smoke-тест після розгортання">

Після розгортання gateway виконайте живу наскрізну перевірку замість того, щоб покладатися лише на модульні тести:

1. Перевірте версію та commit розгорнутого gateway на цільовому хості.
2. Відкрийте тимчасову bridge-сесію ACPX до live agent.
3. Попросіть цього agent викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Переконайтеся, що є `accepted=yes`, реальний `childSessionKey` і немає помилки validator.
5. Очистіть тимчасову bridge-сесію.

Залишайте перевірку на `mode: "run"` і пропускайте `streamTo: "parent"` — прив’язані до thread `mode: "session"` і шляхи relay потоку є окремими, багатшими інтеграційними перевірками.

</Accordion>

## Сумісність із sandbox

Сесії ACP зараз працюють у runtime хоста, а не всередині sandbox OpenClaw.

Поточні обмеження:

- Якщо сесія-запитувач перебуває в sandbox, ACP spawn блокується як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
  - Помилка: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.
  - Помилка: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Використовуйте `runtime: "subagent"`, коли вам потрібне виконання з примусовим sandbox.

### Із команди `/acp`

Використовуйте `/acp spawn` для явного операторського керування з чату, коли це потрібно.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Ключові прапорці:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Див. [Косі команди](/uk/tools/slash-commands).

## Визначення цілі сесії

Більшість дій `/acp` приймають необов’язкову ціль сесії (`session-key`, `session-id` або `session-label`).

Порядок визначення:

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує key
   - потім session id у формі UUID
   - потім label
2. Поточна прив’язка thread (якщо ця розмова/thread прив’язана до сесії ACP)
3. Fallback до поточної сесії-запитувача

Прив’язки до поточної розмови й прив’язки thread обидві беруть участь у кроці 2.

Якщо не вдається визначити жодної цілі, OpenClaw повертає чітку помилку (`Unable to resolve session target: ...`).

## Режими прив’язки spawn

`/acp spawn` підтримує `--bind here|off`.

| Режим | Поведінка                                                                |
| ------ | ----------------------------------------------------------------------- |
| `here` | Прив’язати поточну активну розмову на місці; завершитися помилкою, якщо активної немає. |
| `off`  | Не створювати прив’язку до поточної розмови.                            |

Примітки:

- `--bind here` — найпростіший операторський шлях для «зробити цей канал або чат таким, що працює через Codex».
- `--bind here` не створює дочірній thread.
- `--bind here` доступний лише на каналах, які надають підтримку прив’язки до поточної розмови.
- `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

## Режими thread для spawn

`/acp spawn` підтримує `--thread auto|here|off`.

| Режим | Поведінка                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | В активному thread: прив’язати цей thread. Поза thread: створити/прив’язати дочірній thread, де це підтримується. |
| `here` | Вимагати поточний активний thread; завершитися помилкою, якщо ви не в ньому.                        |
| `off`  | Без прив’язки. Сесія запускається без прив’язки.                                                     |

Примітки:

- На поверхнях без прив’язки thread типова поведінка фактично дорівнює `off`.
- Spawn, прив’язаний до thread, вимагає підтримки політики каналу:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Використовуйте `--bind here`, коли хочете закріпити поточну розмову без створення дочірнього thread.

## Елементи керування ACP

| Команда              | Що вона робить                                           | Приклад                                                       |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створити сесію ACP; необов’язкова поточна прив’язка або прив’язка thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасувати хід, що виконується, для цільової сесії.       | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надіслати інструкцію steer до сесії, що виконується.     | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закрити сесію та відв’язати цілі thread.                 | `/acp close`                                                  |
| `/acp status`        | Показати backend, mode, state, параметри runtime, можливості. | `/acp status`                                                 |
| `/acp set-mode`      | Установити mode runtime для цільової сесії.              | `/acp set-mode plan`                                          |
| `/acp set`           | Загальний запис параметра config runtime.                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Установити перевизначення робочого каталогу runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Установити профіль політики погодження.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Установити тайм-аут runtime (секунди).                   | `/acp timeout 120`                                            |
| `/acp model`         | Установити перевизначення model runtime.                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видалити перевизначення параметрів runtime для сесії.    | `/acp reset-options`                                          |
| `/acp sessions`      | Показати недавні сесії ACP зі сховища.                   | `/acp sessions`                                               |
| `/acp doctor`        | Стан здоров’я backend, можливості, практичні виправлення. | `/acp doctor`                                                 |
| `/acp install`       | Вивести детерміновані кроки встановлення та ввімкнення.  | `/acp install`                                                |

`/acp status` показує ефективні параметри runtime, а також ідентифікатори сесій рівня runtime і рівня backend. Помилки unsupported-control чітко показуються, коли backend не має певної можливості. `/acp sessions` читає сховище для поточної прив’язаної сесії або сесії-запитувача; цільові токени (`session-key`, `session-id` або `session-label`) визначаються через виявлення сесій gateway, включно з користувацькими коренями `session.store` для окремих agent.

## Відображення параметрів runtime

`/acp` має зручні команди та загальний setter.

Еквівалентні операції:

- `/acp model <id>` відповідає ключу config runtime `model`.
- `/acp permissions <profile>` відповідає ключу config runtime `approval_policy`.
- `/acp timeout <seconds>` відповідає ключу config runtime `timeout`.
- `/acp cwd <path>` безпосередньо оновлює перевизначення `cwd` runtime.
- `/acp set <key> <value>` — це загальний шлях.
  - Особливий випадок: `key=cwd` використовує шлях перевизначення `cwd`.
- `/acp reset-options` очищає всі перевизначення runtime для цільової сесії.

## acpx harness, налаштування Plugin і дозволи

Щодо конфігурації harness acpx (псевдоніми Claude Code / Codex / Gemini CLI),
bridge plugin-tools і OpenClaw-tools MCP, а також режимів дозволів ACP див.
[Агенти ACP — налаштування](/uk/tools/acp-agents-setup).

## Усунення несправностей

| Симптом                                                                     | Імовірна причина                                                                 | Виправлення                                                                                                                                                                 |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend Plugin відсутній або вимкнений.                                          | Установіть і ввімкніть backend Plugin, а потім виконайте `/acp doctor`.                                                                                                    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                          | Установіть `acp.enabled=true`.                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch зі звичайних повідомлень thread вимкнено.                               | Установіть `acp.dispatch.enabled=true`.                                                                                                                                     |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent відсутній у allowlist.                                                     | Використовуйте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                       |
| `Unable to resolve session target: ...`                                     | Неправильний токен key/id/label.                                                 | Виконайте `/acp sessions`, скопіюйте точний key/label і повторіть спробу.                                                                                                  |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної розмови, яку можна прив’язати.            | Перейдіть до цільового чату/каналу й повторіть спробу або використовуйте spawn без прив’язки.                                                                               |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter не підтримує прив’язку ACP до поточної розмови.                          | Використовуйте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте верхньорівневі `bindings[]` або перейдіть до підтримуваного каналу.                         |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом thread.                              | Перейдіть до цільового thread або використовуйте `--thread auto`/`off`.                                                                                                    |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє активною ціллю прив’язки.                               | Переприв’яжіть як власник або використовуйте іншу розмову чи thread.                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Adapter не підтримує прив’язку thread.                                           | Використовуйте `--thread off` або перейдіть до підтримуваного adapter/каналу.                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP працює на боці хоста; сесія-запитувач перебуває в sandbox.           | Використовуйте `runtime="subagent"` із sandboxed сесій або виконуйте ACP spawn із сесії без sandbox.                                                                       |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для runtime ACP запитано `sandbox="require"`.                                    | Використовуйте `runtime="subagent"` для обов’язкового sandboxing або ACP із `sandbox="inherit"` із сесії без sandbox.                                                     |
| Missing ACP metadata for bound session                                      | Застарілі/видалені метадані сесії ACP.                                           | Повторно створіть через `/acp spawn`, а потім знову прив’яжіть/сфокусуйте thread.                                                                                          |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує записи/exec у неінтерактивній сесії ACP.                 | Установіть `plugins.entries.acpx.config.permissionMode` у `approve-all` і перезапустіть gateway. Див. [Налаштування дозволів](/uk/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Prompts дозволів заблоковано через `permissionMode`/`nonInteractivePermissions`. | Перевірте журнали gateway на `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для плавної деградації встановіть `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Процес harness завершився, але сесія ACP не повідомила про завершення.           | Спостерігайте через `ps aux \| grep acpx`; вручну завершуйте застарілі процеси.                                                                                            |

## Пов’язане

- [Підагенти](/uk/tools/subagents)
- [Інструменти sandbox для кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [Надсилання агенту](/uk/tools/agent-send)
