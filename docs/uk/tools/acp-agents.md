---
read_when:
    - Запуск coding harness через ACP
    - Налаштування ACP-сесій, прив’язаних до розмов, у каналах обміну повідомленнями
    - Прив’язка розмови в каналі повідомлень до постійної ACP-сесії
    - Усунення несправностей backend ACP і wiring Plugin
    - Налагодження доставки завершення ACP або циклів агент-до-агента
    - Керування командами /acp із чату
summary: Використовуйте runtime-сесії ACP для Claude Code, Cursor, Gemini CLI, явного резервного варіанта Codex ACP, OpenClaw ACP та інших harness-агентів
title: ACP-агенти
x-i18n:
    generated_at: "2026-04-24T03:49:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81965807f86bac46e758d88c21e0b462909e1ce22945587828e7599c2e9659aa
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) сесії дозволяють OpenClaw запускати зовнішні coding harness (наприклад Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI та інші підтримувані harness ACPX) через Plugin backend ACP.

Якщо ви просите OpenClaw звичайною мовою прив’язати або керувати Codex у поточній розмові, OpenClaw має використовувати нативний Plugin app-server Codex (`/codex bind`, `/codex threads`, `/codex resume`). Якщо ви просите про `/acp`, ACP, acpx або фонову дочірню сесію Codex, OpenClaw усе ще може маршрутизувати Codex через ACP. Кожне створення сесії ACP відстежується як [фонове завдання](/uk/automation/tasks).

Якщо ви просите OpenClaw звичайною мовою "запустити Claude Code у треді" або використати інший зовнішній harness, OpenClaw має маршрутизувати цей запит до runtime ACP (а не до нативного runtime субагента).

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній клієнт MCP безпосередньо
до наявних розмов каналів OpenClaw, використовуйте [`openclaw mcp serve`](/uk/cli/mcp)
замість ACP.

## Яка сторінка мені потрібна?

Поруч є три поверхні, які легко сплутати:

| Ви хочете...                                                                                   | Використовуйте це                     | Примітки                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Прив’язати або керувати Codex у поточній розмові                                               | `/codex bind`, `/codex threads`       | Нативний шлях app-server Codex; включає прив’язані відповіді в чаті, пересилання зображень, model/fast/permissions, stop і steer controls. ACP — явний резервний варіант |
| Запустити Claude Code, Gemini CLI, явний Codex ACP або інший зовнішній harness _через_ OpenClaw | Ця сторінка: ACP-агенти               | Прив’язані до чату сесії, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, елементи керування runtime                                 |
| Відкрити сесію Gateway OpenClaw _як_ ACP-сервер для редактора або клієнта                     | [`openclaw acp`](/uk/cli/acp)            | Режим bridge. IDE/клієнт спілкується з OpenClaw через ACP по stdio/WebSocket                                                                              |
| Повторно використати локальний AI CLI як резервну модель лише для тексту                       | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Немає tools OpenClaw, немає елементів керування ACP, немає runtime harness                                                                         |

## Чи працює це одразу після встановлення?

Зазвичай так. Нові інсталяції постачаються з увімкненим за замовчуванням bundled runtime Plugin `acpx`, із локально закріпленим для Plugin бінарним файлом `acpx`, який OpenClaw перевіряє та самостійно відновлює під час запуску. Запустіть `/acp doctor` для перевірки готовності.

Типові нюанси першого запуску:

- Адаптери цільових harness (Codex, Claude тощо) можуть завантажуватися за потреби через `npx` під час першого використання.
- Автентифікація vendor для цього harness все одно має існувати на хості.
- Якщо хост не має доступу до npm або мережі, отримання адаптера під час першого запуску не вдасться, доки кеш не буде попередньо прогріто або адаптер не буде встановлено іншим способом.

## Робочий сценарій оператора

Швидкий сценарій `/acp` із чату:

1. **Створити** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` або явний `/acp spawn codex --bind here`
2. **Працювати** у прив’язаній розмові або треді (або явно націлюватися на ключ сесії).
3. **Перевірити стан** — `/acp status`
4. **Налаштувати** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Скерувати** без заміни контексту — `/acp steer tighten logging and continue`
6. **Зупинити** — `/acp cancel` (поточний хід) або `/acp close` (сесія + прив’язки)

Тригери природною мовою, які мають маршрутизуватися до нативного Plugin Codex:

- "Bind this Discord channel to Codex."
- "Attach this chat to Codex thread `<id>`."
- "Show Codex threads, then bind this one."

Нативна прив’язка розмови Codex є типовим шляхом керування з чату, але вона навмисно консервативна для інтерактивних потоків підтвердження/tool Codex: динамічні tools OpenClaw і запити на підтвердження ще не відкриваються через цей шлях прив’язаного чату, тому такі запити відхиляються з чітким поясненням. Використовуйте шлях harness Codex або явний резервний варіант ACP, коли робочий процес залежить від динамічних tools OpenClaw або довготривалих інтерактивних підтверджень.

Тригери природною мовою, які мають маршрутизуватися до runtime ACP:

- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
- "Run Codex through ACP in a background thread."

OpenClaw вибирає `runtime: "acp"`, визначає `agentId` harness, прив’язує до поточної розмови або треду, коли це підтримується, і маршрутизує подальші звернення до цієї сесії до закриття/завершення строку дії. Codex іде цим шляхом лише тоді, коли ACP явний або коли запитуваному фоновому runtime усе ще потрібен ACP.

## ACP проти субагентів

Використовуйте ACP, коли вам потрібен зовнішній runtime harness. Використовуйте нативний app-server Codex для прив’язки/керування розмовою Codex. Використовуйте субагентів, коли вам потрібні делеговані запуски, нативні для OpenClaw.

| Area          | ACP session                           | Sub-agent run                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP backend Plugin (for example acpx) | OpenClaw native sub-agent runtime  |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Main commands | `/acp ...`                            | `/subagents ...`                   |
| Spawn tool    | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn` (default runtime) |

Див. також [Субагенти](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. площина керування сесією ACP OpenClaw
2. bundled runtime Plugin `acpx`
3. адаптер Claude ACP
4. runtime/механізми сесії на боці Claude

Важлива відмінність:

- ACP Claude — це сесія harness з елементами керування ACP, відновленням сесії, відстеженням фонових завдань і необов’язковою прив’язкою до розмови/треду.
- CLI backend — це окремі локальні резервні runtime лише для тексту. Див. [CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- потрібні `/acp spawn`, прив’язувані сесії, елементи керування runtime або постійна робота harness: використовуйте ACP
- потрібен простий локальний резервний варіант для тексту через сирий CLI: використовуйте CLI backend

## Прив’язані сесії

### Прив’язки до поточної розмови

`/acp spawn <harness> --bind here` закріплює поточну розмову за створеною сесією ACP — без дочірнього треду, на тій самій поверхні чату. OpenClaw зберігає володіння transport, auth, safety і delivery; подальші повідомлення в цій розмові маршрутизуються до тієї самої сесії; `/new` і `/reset` скидають сесію на місці; `/acp close` прибирає прив’язку.

Ментальна модель:

- **поверхня чату** — де люди продовжують спілкуватися (канал Discord, тема Telegram, чат iMessage).
- **сесія ACP** — довговічний стан runtime Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **дочірній тред/тема** — необов’язкова додаткова поверхня повідомлень, що створюється лише через `--thread ...`.
- **робочий простір runtime** — розташування у файловій системі (`cwd`, checkout репозиторію, робочий простір backend), де виконується harness. Незалежне від поверхні чату.

Приклади:

- `/codex bind` — залишити цей чат, створити або під’єднати нативний app-server Codex, маршрутизувати майбутні повідомлення сюди.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — налаштувати прив’язаний нативний тред Codex із чату.
- `/codex stop` або `/codex steer focus on the failing tests first` — керувати активним ходом нативного Codex.
- `/acp spawn codex --bind here` — явний резервний варіант ACP для Codex.
- `/acp spawn codex --thread auto` — OpenClaw може створити дочірній тред/тему та прив’язати там.
- `/acp spawn codex --bind here --cwd /workspace/repo` — та сама прив’язка чату, Codex виконується в `/workspace/repo`.

Примітки:

- `--bind here` і `--thread ...` взаємовиключні.
- `--bind here` працює лише в каналах, які оголошують прив’язку до поточної розмови; інакше OpenClaw повертає чітке повідомлення про непідтримуваність. Прив’язки зберігаються після перезапусків Gateway.
- У Discord `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній тред для `--thread auto|here` — не для `--bind here`.
- Якщо ви створюєте сесію для іншого ACP-агента без `--cwd`, OpenClaw типово успадковує робочий простір **цільового агента**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) використовують резервне типове значення backend; інші помилки доступу (наприклад `EACCES`) повертаються як помилки створення сесії.

### Сесії, прив’язані до треду

Коли для адаптера каналу ввімкнено прив’язки до тредів, сесії ACP можуть прив’язуватися до тредів:

- OpenClaw прив’язує тред до цільової сесії ACP.
- Подальші повідомлення в цьому треді маршрутизуються до прив’язаної сесії ACP.
- Вивід ACP доставляється назад у той самий тред.
- Втрата фокуса/закриття/архівування/тайм-аут бездіяльності або завершення max-age прибирає прив’язку.

Підтримка прив’язки до тредів залежить від адаптера. Якщо активний адаптер каналу не підтримує прив’язки до тредів, OpenClaw повертає чітке повідомлення про непідтримуваність/недоступність.

Потрібні feature flag для ACP, прив’язаного до тредів:

- `acp.enabled=true`
- `acp.dispatch.enabled` типово ввімкнено (установіть `false`, щоб призупинити dispatch ACP)
- Увімкнено прапорець створення тредів ACP на рівні адаптера каналу (залежить від адаптера)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Канали з підтримкою тредів

- Будь-який адаптер каналу, який відкриває можливість прив’язки сесії/треду.
- Поточна вбудована підтримка:
  - треди/канали Discord
  - теми Telegram (форумні теми в групах/супергрупах і теми DM)
- Канали Plugin можуть додавати підтримку через той самий інтерфейс прив’язки.

## Налаштування для конкретних каналів

Для неепізодичних робочих процесів налаштовуйте постійні прив’язки ACP у записах верхнього рівня `bindings[]`.

### Модель прив’язки

- `bindings[].type="acp"` позначає постійну прив’язку розмови ACP.
- `bindings[].match` визначає цільову розмову:
  - канал або тред Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - форумна тема Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - DM/груповий чат BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних прив’язок груп надавайте перевагу `chat_id:*` або `chat_identifier:*`.
  - DM/груповий чат iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних прив’язок груп надавайте перевагу `chat_id:*`.
- `bindings[].agentId` — id агента OpenClaw, який володіє цим.
- Необов’язкові перевизначення ACP розміщуються в `bindings[].acp`:
  - `mode` (`persistent` або `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Типові значення runtime для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити типові значення ACP для кожного агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Пріоритет перевизначень для прив’язаних сесій ACP:

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

- OpenClaw гарантує, що налаштована ACP-сесія існує до використання.
- Повідомлення в цьому каналі або темі маршрутизуються до налаштованої ACP-сесії.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ ACP-сесії на місці.
- Тимчасові runtime-прив’язки (наприклад, створені потоками фокусування на треді) усе ще застосовуються, де вони є.
- Для міжагентних ACP-створень без явного `cwd` OpenClaw успадковує робочий простір цільового агента з конфігурації агента.
- Відсутні успадковані шляхи робочого простору використовують резервне типове значення `cwd` backend; збої доступу для наявних шляхів повертаються як помилки створення сесії.

## Запуск ACP-сесій (інтерфейси)

### Із `sessions_spawn`

Використовуйте `runtime: "acp"`, щоб запустити ACP-сесію з ходу агента або виклику tool.

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

- `runtime` типово має значення `subagent`, тому для ACP-сесій явно задавайте `runtime: "acp"`.
- Якщо `agentId` пропущено, OpenClaw використовує `acp.defaultAgent`, якщо його налаштовано.
- `mode: "session"` потребує `thread: true`, щоб зберегти постійну прив’язану розмову.

Деталі інтерфейсу:

- `task` (обов’язково): початковий prompt, надісланий до ACP-сесії.
- `runtime` (обов’язково для ACP): має бути `"acp"`.
- `agentId` (необов’язково): id цільового harness ACP. Використовує резервне значення `acp.defaultAgent`, якщо його встановлено.
- `thread` (необов’язково, типово `false`): запросити потік прив’язки до треду, де це підтримується.
- `mode` (необов’язково): `run` (одноразово) або `session` (постійно).
  - типове значення — `run`
  - якщо `thread: true`, а mode пропущено, OpenClaw може типово перейти до постійної поведінки залежно від шляху runtime
  - `mode: "session"` потребує `thread: true`
- `cwd` (необов’язково): запитуваний робочий каталог runtime (перевіряється політикою backend/runtime). Якщо пропущено, ACP-створення успадковує робочий простір цільового агента, якщо його налаштовано; відсутні успадковані шляхи використовують резервні типові значення backend, тоді як реальні помилки доступу повертаються.
- `label` (необов’язково): орієнтована на оператора мітка, яка використовується в тексті сесії/банера.
- `resumeSessionId` (необов’язково): відновити наявну ACP-сесію замість створення нової. Агент повторно відтворює історію своєї розмови через `session/load`. Потребує `runtime: "acp"`.
- `streamTo` (необов’язково): `"parent"` передає підсумки прогресу початкового запуску ACP назад до сесії запитувача як системні події.
  - Коли доступно, прийняті відповіді включають `streamLogPath`, що вказує на JSONL-журнал з областю сесії (`<sessionId>.acp-stream.jsonl`), який можна читати в реальному часі для повної історії relay.
- `model` (необов’язково): явне перевизначення моделі для дочірньої ACP-сесії. Враховується для `runtime: "acp"`, щоб дочірня сесія використовувала запитану модель замість тихого переходу до типового значення цільового агента.

## Модель доставки

ACP-сесії можуть бути або інтерактивними робочими просторами, або фоновою роботою, що належить батьківському процесу. Шлях доставки залежить від цієї форми.

### Інтерактивні ACP-сесії

Інтерактивні сесії призначені для продовження спілкування на видимій поверхні чату:

- `/acp spawn ... --bind here` прив’язує поточну розмову до ACP-сесії.
- `/acp spawn ... --thread ...` прив’язує тред/тему каналу до ACP-сесії.
- Постійні налаштовані `bindings[].type="acp"` маршрутизують відповідні розмови до тієї самої ACP-сесії.

Подальші повідомлення в прив’язаній розмові маршрутизуються безпосередньо до ACP-сесії, а вивід ACP доставляється назад у той самий канал/тред/тему.

### Одноразові ACP-сесії, що належать батьківському процесу

Одноразові ACP-сесії, створені іншим запуском агента, є фоновими дочірніми процесами, подібно до субагентів:

- Батьківський процес просить виконати роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Дочірній процес виконується у власній ACP-сесії harness.
- Завершення повертається через внутрішній шлях оголошення про завершення завдання.
- Батьківський процес переписує результат дочірнього процесу звичайним голосом асистента, коли потрібна відповідь для користувача.

Не сприймайте цей шлях як peer-to-peer чат між батьківським і дочірнім процесом. Дочірній процес уже має канал завершення назад до батьківського.

### `sessions_send` і доставка A2A

`sessions_send` може націлюватися на іншу сесію після створення. Для звичайних peer-сесій OpenClaw використовує шлях followup агент-до-агента (A2A) після вставлення повідомлення:

- чекати на відповідь цільової сесії
- за потреби дозволити запитувачу та цілі обмінятися обмеженою кількістю додаткових ходів
- попросити ціль створити announce-повідомлення
- доставити це announce у видимий канал або тред

Цей шлях A2A є резервним варіантом для peer-надсилань, коли відправнику потрібен видимий followup. Він залишається ввімкненим, коли не пов’язана сесія може бачити й надсилати повідомлення до ACP-цілі, наприклад при широких налаштуваннях `tools.sessions.visibility`.

OpenClaw пропускає A2A-followup лише тоді, коли запитувач є батьківським процесом для власної одноразової ACP-дитини, яка йому належить. У такому разі запуск A2A поверх завершення завдання може пробудити батьківський процес із результатом дочірнього, переслати відповідь батьківського назад до дочірнього та створити цикл echo між батьківським і дочірнім процесами. Для цього випадку owned-child результат `sessions_send` повідомляє `delivery.status="skipped"`, оскільки шлях завершення вже відповідає за результат.

### Відновлення наявної сесії

Використовуйте `resumeSessionId`, щоб продовжити попередню ACP-сесію замість запуску з нуля. Агент повторно відтворює історію своєї розмови через `session/load`, тому продовжує з повним контекстом попередніх подій.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Типові випадки використання:

- Передайте сесію Codex із ноутбука на телефон — скажіть агенту продовжити з того місця, де ви зупинилися
- Продовжіть coding-сесію, яку ви почали інтерактивно в CLI, тепер безголово через вашого агента
- Відновіть роботу, яку було перервано через перезапуск Gateway або тайм-аут бездіяльності

Примітки:

- `resumeSessionId` потребує `runtime: "acp"` — повертає помилку, якщо використовується з runtime субагента.
- `resumeSessionId` відновлює історію розмови у верхньому ACP; `thread` і `mode` усе ще нормально застосовуються до нової сесії OpenClaw, яку ви створюєте, тому `mode: "session"` усе ще потребує `thread: true`.
- Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
- Якщо id сесії не знайдено, створення завершується з чіткою помилкою — без тихого резервного переходу до нової сесії.

<Accordion title="Smoke test після розгортання">

Після розгортання Gateway виконайте живу наскрізну перевірку замість того, щоб покладатися лише на unit-тести:

1. Перевірте версію та коміт розгорнутого Gateway на цільовому хості.
2. Відкрийте тимчасову bridge-сесію ACPX до живого агента.
3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Переконайтеся, що є `accepted=yes`, реальний `childSessionKey` і немає помилки валідатора.
5. Очистьте тимчасову bridge-сесію.

Залишайте перевірку на `mode: "run"` і пропускайте `streamTo: "parent"` — прив’язані до тредів шляхи `mode: "session"` і relay-потоку є окремими, більш насиченими інтеграційними перевірками.

</Accordion>

## Сумісність із sandbox

ACP-сесії наразі працюють у runtime хоста, а не всередині sandbox OpenClaw.

Поточні обмеження:

- Якщо сесія запитувача працює в sandbox, створення ACP блокується як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
  - Помилка: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.
  - Помилка: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Використовуйте `runtime: "subagent"`, коли вам потрібне виконання з примусовим застосуванням sandbox.

### Із команди `/acp`

Використовуйте `/acp spawn` для явного керування оператором із чату, коли це потрібно.

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

Див. [Слеш-команди](/uk/tools/slash-commands).

## Визначення цілі сесії

Більшість дій `/acp` приймають необов’язкову ціль сесії (`session-key`, `session-id` або `session-label`).

Порядок визначення:

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує ключ
   - потім session id у формі UUID
   - потім мітку
2. Поточна прив’язка треду (якщо ця розмова/тред прив’язані до ACP-сесії)
3. Резервний варіант поточної сесії запитувача

Прив’язки до поточної розмови та прив’язки до тредів беруть участь у кроці 2.

Якщо ціль не визначається, OpenClaw повертає чітку помилку (`Unable to resolve session target: ...`).

## Режими прив’язки під час створення

`/acp spawn` підтримує `--bind here|off`.

| Mode   | Behavior                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | Прив’язати поточну активну розмову на місці; помилка, якщо жодна не активна. |
| `off`  | Не створювати прив’язку до поточної розмови.                           |

Примітки:

- `--bind here` — найпростіший шлях для оператора для сценарію "зробити цей канал або чат під керуванням Codex".
- `--bind here` не створює дочірній тред.
- `--bind here` доступний лише в каналах, які відкривають підтримку прив’язки до поточної розмови.
- `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

## Режими треду під час створення

`/acp spawn` підтримує `--thread auto|here|off`.

| Mode   | Behavior                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | В активному треді: прив’язати цей тред. Поза тредом: створити/прив’язати дочірній тред, якщо підтримується. |
| `here` | Вимагати поточний активний тред; помилка, якщо ви не в треді.                                       |
| `off`  | Без прив’язки. Сесія запускається без прив’язки.                                                    |

Примітки:

- На поверхнях без прив’язки до тредів типова поведінка фактично відповідає `off`.
- Створення сесії з прив’язкою до треду потребує підтримки політики каналу:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Використовуйте `--bind here`, коли хочете закріпити поточну розмову без створення дочірнього треду.

## Елементи керування ACP

| Command              | What it does                                              | Example                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створити ACP-сесію; необов’язкова поточна прив’язка або прив’язка до треду. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасувати хід, що виконується, для цільової сесії.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надіслати інструкцію steer до сесії, що виконується.      | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закрити сесію та відв’язати цілі тредів.                  | `/acp close`                                                  |
| `/acp status`        | Показати backend, mode, state, runtime options, capabilities. | `/acp status`                                                 |
| `/acp set-mode`      | Установити runtime-режим для цільової сесії.              | `/acp set-mode plan`                                          |
| `/acp set`           | Загальний запис параметра конфігурації runtime.           | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Установити перевизначення робочого каталогу runtime.      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Установити профіль політики підтвердження.                | `/acp permissions strict`                                     |
| `/acp timeout`       | Установити тайм-аут runtime (у секундах).                 | `/acp timeout 120`                                            |
| `/acp model`         | Установити перевизначення моделі runtime.                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видалити перевизначення параметрів runtime для сесії.     | `/acp reset-options`                                          |
| `/acp sessions`      | Показати список нещодавніх ACP-сесій зі сховища.          | `/acp sessions`                                               |
| `/acp doctor`        | Стан backend, capabilities, придатні до дії виправлення.  | `/acp doctor`                                                 |
| `/acp install`       | Вивести детерміновані кроки встановлення та увімкнення.   | `/acp install`                                                |

`/acp status` показує ефективні параметри runtime, а також ідентифікатори сесій на рівні runtime і backend. Помилки unsupported-control чітко відображаються, коли backend не має певної можливості. `/acp sessions` читає сховище для поточної прив’язаної сесії або сесії запитувача; цільові токени (`session-key`, `session-id` або `session-label`) визначаються через виявлення сесій Gateway, включно з користувацькими коренями `session.store` для кожного агента.

## Відображення параметрів runtime

`/acp` має зручні команди та загальний setter.

Еквівалентні операції:

- `/acp model <id>` відображається на ключ конфігурації runtime `model`.
- `/acp permissions <profile>` відображається на ключ конфігурації runtime `approval_policy`.
- `/acp timeout <seconds>` відображається на ключ конфігурації runtime `timeout`.
- `/acp cwd <path>` напряму оновлює перевизначення `cwd` runtime.
- `/acp set <key> <value>` — це загальний шлях.
  - Особливий випадок: `key=cwd` використовує шлях перевизначення cwd.
- `/acp reset-options` очищає всі перевизначення runtime для цільової сесії.

## Harness acpx, налаштування Plugin і дозволи

Щодо конфігурації harness acpx (псевдоніми Claude Code / Codex / Gemini CLI), bridge MCP для
plugin-tools і OpenClaw-tools, а також режимів дозволів ACP див.
[ACP-агенти — налаштування](/uk/tools/acp-agents-setup).

## Усунення несправностей

| Symptom                                                                     | Likely cause                                                                    | Fix                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Відсутній або вимкнений Plugin backend.                                         | Установіть і ввімкніть Plugin backend, потім запустіть `/acp doctor`.                                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                         | Установіть `acp.enabled=true`.                                                                                                                                    |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch зі звичайних повідомлень треду вимкнено.                               | Установіть `acp.dispatch.enabled=true`.                                                                                                                           |
| `ACP agent "<id>" is not allowed by policy`                                 | Агент відсутній в allowlist.                                                    | Використовуйте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                              |
| `Unable to resolve session target: ...`                                     | Неправильний токен key/id/label.                                                | Запустіть `/acp sessions`, скопіюйте точний key/label і спробуйте ще раз.                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної прив’язуваної розмови.                   | Перейдіть до цільового чату/каналу та спробуйте ще раз або використайте створення без прив’язки.                                                                 |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має можливості ACP-прив’язки до поточної розмови.                    | Використовуйте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте верхньорівневі `bindings[]` або перейдіть до підтримуваного каналу.                |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом треду.                              | Перейдіть у цільовий тред або використайте `--thread auto`/`off`.                                                                                                |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє активною ціллю прив’язки.                              | Повторно прив’яжіть як власник або використайте іншу розмову чи тред.                                                                                              |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має можливості прив’язки до тредів.                                  | Використовуйте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP працює на хості; сесія запитувача виконується в sandbox.            | Використовуйте `runtime="subagent"` із sandboxed-сесій або запускайте ACP із несandboxed-сесії.                                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для runtime ACP запитано `sandbox="require"`.                                   | Використовуйте `runtime="subagent"` для обов’язкового sandbox або ACP із `sandbox="inherit"` із несandboxed-сесії.                                               |
| Missing ACP metadata for bound session                                      | Застарілі/видалені метадані ACP-сесії.                                          | Створіть заново через `/acp spawn`, потім повторно прив’яжіть/сфокусуйте тред.                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує write/exec у неінтерактивній ACP-сесії.                 | Установіть `plugins.entries.acpx.config.permissionMode` у `approve-all` і перезапустіть gateway. Див. [Налаштування ACP-агентів](/uk/tools/acp-agents-setup).       |
| ACP session fails early with little output                                  | Запити дозволів блокуються через `permissionMode`/`nonInteractivePermissions`.  | Перевірте журнали gateway на `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для м’якого погіршення встановіть `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Процес harness завершився, але ACP-сесія не повідомила про завершення.          | Відстежуйте через `ps aux \| grep acpx`; вручну завершіть застарілі процеси.                                                                                      |

## Пов’язане

- [Субагенти](/uk/tools/subagents)
- [Інструменти sandbox для багатоагентності](/uk/tools/multi-agent-sandbox-tools)
- [Надсилання агенту](/uk/tools/agent-send)
