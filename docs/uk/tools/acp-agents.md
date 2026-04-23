---
read_when:
    - Запуск harness для кодування через ACP
    - Налаштування ACP-сесій, прив’язаних до розмови, у каналах обміну повідомленнями
    - Прив’язка розмови в каналі обміну повідомленнями до постійної ACP-сесії
    - Усунення несправностей ACP backend і підключення Plugin
    - Налагодження доставки завершення ACP або циклів agent-to-agent
    - Керування командами /acp з чату
summary: Використовуйте runtime-сесії ACP для Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP та інших harness-агентів
title: ACP-агенти
x-i18n:
    generated_at: "2026-04-23T23:07:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfbce828d3c74b340cedf86c2e771401a618524b4fc1a716a84d85c5d2cd106d
    source_path: tools/acp-agents.md
    workflow: 15
---

Сесії [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) дають змогу OpenClaw запускати зовнішні harness для кодування (наприклад Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI та інші підтримувані ACPX-harness) через Plugin backend ACP.

Якщо ви просите OpenClaw звичайною мовою «запусти це в Codex» або «запусти Claude Code у треді», OpenClaw має маршрутизувати цей запит до runtime ACP (а не до нативного runtime sub-agent). Кожен запуск ACP-сесії відстежується як [фонове завдання](/uk/automation/tasks).

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній MCP client безпосередньо
до наявних розмов каналів OpenClaw, використовуйте [`openclaw mcp serve`](/uk/cli/mcp)
замість ACP.

## Яка сторінка мені потрібна?

Поруч є три поверхні, які легко сплутати:

| Ви хочете...                                                                     | Використовуйте це                     | Примітки                                                                                                       |
| --------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Запускати Codex, Claude Code, Gemini CLI або інший зовнішній harness _через_ OpenClaw | Ця сторінка: ACP-агенти              | Сесії, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, runtime controls |
| Експонувати сесію OpenClaw Gateway _як_ ACP-сервер для редактора або client      | [`openclaw acp`](/uk/cli/acp)            | Режим моста. IDE/client спілкується з OpenClaw по ACP через stdio/WebSocket                                    |
| Повторно використовувати локальний AI CLI як текстовий резервний варіант моделі  | [CLI Backends](/uk/gateway/cli-backends) | Це не ACP. Немає інструментів OpenClaw, контролів ACP чи runtime harness                                       |

## Чи працює це одразу після встановлення?

Зазвичай так. Свіжі встановлення постачаються з увімкненим за замовчуванням вбудованим runtime Plugin `acpx`, із локально закріпленим у Plugin бінарним файлом `acpx`, який OpenClaw перевіряє й самостійно відновлює під час запуску. Виконайте `/acp doctor`, щоб перевірити готовність.

Типові нюанси першого запуску:

- Адаптери цільових harness (Codex, Claude тощо) можуть завантажуватися за потреби через `npx` під час першого використання.
- Auth постачальника для цього harness усе одно має бути налаштований на хості.
- Якщо хост не має npm або доступу до мережі, адаптери першого запуску не завантажаться, доки кеші не буде попередньо прогріто або адаптер не буде встановлено іншим способом.

## Робоча інструкція для оператора

Швидкий потік `/acp` із чату:

1. **Створення** — `/acp spawn codex --bind here` або `/acp spawn codex --mode persistent --thread auto`
2. **Працюйте** у прив’язаній розмові або треді (або явно вкажіть ключ сесії).
3. **Перевірте стан** — `/acp status`
4. **Налаштуйте** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Скоригуйте** без заміни контексту — `/acp steer tighten logging and continue`
6. **Зупиніть** — `/acp cancel` (поточний turn) або `/acp close` (сесія + прив’язки)

Тригери природною мовою, які мають маршрутизуватися до runtime ACP:

- «Прив’яжи цей канал Discord до Codex».
- «Запусти тут постійну сесію Codex у треді».
- «Запусти це як одноразову ACP-сесію Claude Code і підсумуй результат».
- «Використай Gemini CLI для цього завдання в треді, а потім залиш подальші дії в цьому самому треді».

OpenClaw вибирає `runtime: "acp"`, визначає `agentId` harness, прив’язує до поточної розмови або треду, коли це підтримується, і маршрутизує подальші дії до цієї сесії до моменту закриття або завершення строку дії.

## ACP проти sub-agent

Використовуйте ACP, коли вам потрібен runtime зовнішнього harness. Використовуйте sub-agent, коли потрібні делеговані запуски, нативні для OpenClaw.

| Область       | ACP-сесія                             | Запуск sub-agent                    |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (наприклад acpx)   | Нативний runtime sub-agent OpenClaw |
| Ключ сесії    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Основні команди | `/acp ...`                          | `/subagents ...`                    |
| Інструмент запуску | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (runtime за замовчуванням) |

Див. також [Sub-agents](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування ACP-сесіями OpenClaw
2. вбудований runtime Plugin `acpx`
3. адаптер Claude ACP
4. runtime/механізм сесій на боці Claude

Важлива відмінність:

- ACP Claude — це сесія harness із контролями ACP, відновленням сесії, відстеженням фонових завдань і необов’язковою прив’язкою до розмови/треду.
- CLI backends — це окремі локальні текстові резервні runtime. Див. [CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- хочете `/acp spawn`, сесії з прив’язкою, runtime controls або постійну роботу harness: використовуйте ACP
- хочете простий локальний текстовий резервний варіант через сирий CLI: використовуйте CLI backends

## Прив’язані сесії

### Прив’язки до поточної розмови

`/acp spawn <harness> --bind here` прив’язує поточну розмову до створеної ACP-сесії — без дочірнього треду, на тій самій поверхні чату. OpenClaw зберігає керування транспортом, auth, безпекою та доставленням; подальші повідомлення в цій розмові маршрутизуються до тієї самої сесії; `/new` і `/reset` скидають сесію на місці; `/acp close` видаляє прив’язку.

Ментальна модель:

- **поверхня чату** — де люди продовжують спілкуватися (канал Discord, тема Telegram, чат iMessage).
- **ACP-сесія** — стійкий стан runtime Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **дочірній тред/тема** — необов’язкова додаткова поверхня повідомлень, що створюється лише через `--thread ...`.
- **runtime workspace** — розташування у файловій системі (`cwd`, checkout репозиторію, workspace backend), де працює harness. Воно не залежить від поверхні чату.

Приклади:

- `/acp spawn codex --bind here` — залишити цей чат, створити або під’єднати Codex, маршрутизувати майбутні повідомлення сюди.
- `/acp spawn codex --thread auto` — OpenClaw може створити дочірній тред/тему й прив’язати туди.
- `/acp spawn codex --bind here --cwd /workspace/repo` — та сама прив’язка до чату, Codex працює в `/workspace/repo`.

Примітки:

- `--bind here` і `--thread ...` взаємовиключні.
- `--bind here` працює лише в каналах, які оголошують підтримку прив’язки до поточної розмови; інакше OpenClaw повертає чітке повідомлення про непідтримку. Прив’язки зберігаються після перезапусків gateway.
- У Discord `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній тред для `--thread auto|here` — не для `--bind here`.
- Якщо ви створюєте сесію для іншого ACP-агента без `--cwd`, OpenClaw за замовчуванням успадковує workspace **цільового агента**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) повертаються до стандартного значення backend; інші помилки доступу (наприклад `EACCES`) повертаються як помилки створення сесії.

### Прив’язані до треду сесії

Коли для адаптера каналу ввімкнено прив’язки до тредів, ACP-сесії можна прив’язувати до тредів:

- OpenClaw прив’язує тред до цільової ACP-сесії.
- Подальші повідомлення в цьому треді маршрутизуються до прив’язаної ACP-сесії.
- Вивід ACP доставляється назад у той самий тред.
- Зняття фокуса/закриття/архівування/тайм-аут бездіяльності або завершення максимального віку знімає прив’язку.

Підтримка прив’язки до тредів залежить від адаптера. Якщо активний адаптер каналу не підтримує прив’язки до тредів, OpenClaw повертає чітке повідомлення про непідтримку/недоступність.

Потрібні feature flags для ACP, прив’язаного до тредів:

- `acp.enabled=true`
- `acp.dispatch.enabled` увімкнено за замовчуванням (установіть `false`, щоб призупинити ACP dispatch)
- Увімкнений прапорець створення ACP-тредів для адаптера каналу (залежить від адаптера)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Канали з підтримкою тредів

- Будь-який адаптер каналу, який експонує capability прив’язки сесії/треду.
- Поточна вбудована підтримка:
  - треди/канали Discord
  - теми Telegram (форумні теми в групах/supergroups і теми DM)
- Канали Plugin можуть додавати підтримку через той самий інтерфейс прив’язки.

## Налаштування для конкретних каналів

Для неефемерних робочих процесів налаштовуйте постійні прив’язки ACP у записах верхнього рівня `bindings[]`.

### Модель прив’язки

- `bindings[].type="acp"` позначає постійну прив’язку ACP до розмови.
- `bindings[].match` визначає цільову розмову:
  - Канал або тред Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Форумна тема Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - DM/груповий чат BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних прив’язок груп віддавайте перевагу `chat_id:*` або `chat_identifier:*`.
  - DM/груповий чат iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних прив’язок груп віддавайте перевагу `chat_id:*`.
- `bindings[].agentId` — це id агента OpenClaw-власника.
- Необов’язкові перевизначення ACP розміщуються в `bindings[].acp`:
  - `mode` (`persistent` або `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Runtime за замовчуванням для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити стандартні значення ACP для кожного агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Порядок пріоритету перевизначень для прив’язаних ACP-сесій:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. глобальні стандартні значення ACP (наприклад `acp.backend`)

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

- OpenClaw перед використанням переконується, що налаштована ACP-сесія існує.
- Повідомлення в цьому каналі або темі маршрутизуються до налаштованої ACP-сесії.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ ACP-сесії на місці.
- Тимчасові runtime-прив’язки (наприклад створені потоками фокусування треду) усе одно застосовуються, якщо вони присутні.
- Для міжагентних запусків ACP без явного `cwd` OpenClaw успадковує workspace цільового агента з конфігурації агента.
- Відсутні успадковані шляхи workspace повертаються до стандартного `cwd` backend; помилки доступу для наявних шляхів повертаються як помилки створення сесії.

## Запуск ACP-сесій (інтерфейси)

### Із `sessions_spawn`

Використовуйте `runtime: "acp"`, щоб запускати ACP-сесію з turn агента або виклику інструмента.

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

- `runtime` за замовчуванням дорівнює `subagent`, тому для ACP-сесій потрібно явно задавати `runtime: "acp"`.
- Якщо `agentId` не задано, OpenClaw використовує `acp.defaultAgent`, якщо його налаштовано.
- `mode: "session"` вимагає `thread: true`, щоб зберігати постійну прив’язану розмову.

Подробиці інтерфейсу:

- `task` (обов’язково): початковий prompt, що надсилається до ACP-сесії.
- `runtime` (обов’язково для ACP): має бути `"acp"`.
- `agentId` (необов’язково): id цільового harness ACP. Якщо задано `acp.defaultAgent`, використовується він.
- `thread` (необов’язково, за замовчуванням `false`): запит на потік прив’язки до треду, де це підтримується.
- `mode` (необов’язково): `run` (одноразово) або `session` (постійно).
  - за замовчуванням `run`
  - якщо `thread: true`, а mode не задано, OpenClaw може за замовчуванням вибрати постійну поведінку залежно від шляху runtime
  - `mode: "session"` вимагає `thread: true`
- `cwd` (необов’язково): запитаний робочий каталог runtime (перевіряється політикою backend/runtime). Якщо не задано, ACP-створення сесії успадковує workspace цільового агента, якщо він налаштований; відсутні успадковані шляхи переходять до стандартних значень backend, а реальні помилки доступу повертаються.
- `label` (необов’язково): операторська мітка, що використовується в тексті сесії/банера.
- `resumeSessionId` (необов’язково): відновити наявну ACP-сесію замість створення нової. Агент повторно відтворює історію розмови через `session/load`. Вимагає `runtime: "acp"`.
- `streamTo` (необов’язково): `"parent"` потоково надсилає підсумки перебігу початкового запуску ACP назад до сесії-запитувача як системні події.
  - Якщо доступно, серед прийнятих відповідей може бути `streamLogPath`, що вказує на JSONL-журнал у межах сесії (`<sessionId>.acp-stream.jsonl`), який можна читати для повної історії ретрансляції.
- `model` (необов’язково): явне перевизначення моделі для дочірньої ACP-сесії. Враховується для `runtime: "acp"`, щоб дочірня сесія використовувала запитану модель, а не мовчки поверталася до стандартної моделі цільового агента.

## Модель доставлення

ACP-сесії можуть бути або інтерактивними робочими просторами, або фоновою роботою, що належить батьківській сесії. Шлях доставлення залежить від цієї форми.

### Інтерактивні ACP-сесії

Інтерактивні сесії призначені для продовження спілкування на видимій поверхні чату:

- `/acp spawn ... --bind here` прив’язує поточну розмову до ACP-сесії.
- `/acp spawn ... --thread ...` прив’язує тред/тему каналу до ACP-сесії.
- Постійні налаштовані `bindings[].type="acp"` маршрутизують відповідні розмови до тієї самої ACP-сесії.

Подальші повідомлення в прив’язаній розмові маршрутизуються безпосередньо до ACP-сесії, а вивід ACP доставляється назад у той самий канал/тред/тему.

### Одноразові ACP-сесії, що належать батьківській сесії

Одноразові ACP-сесії, створені іншим запуском агента, є фоновими дочірніми процесами, подібно до sub-agent:

- Батьківська сесія запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Дочірня сесія працює у власній сесії harness ACP.
- Завершення повертається через внутрішній шлях оголошення про завершення завдання.
- Батьківська сесія переписує результат дочірньої у звичайному голосі асистента, коли потрібна відповідь для користувача.

Не трактуйте цей шлях як одноранговий чат між батьківською та дочірньою сесіями. Дочірня сесія вже має канал завершення назад до батьківської.

### `sessions_send` і доставлення A2A

`sessions_send` може бути націлений на іншу сесію після створення. Для звичайних однорангових сесій OpenClaw використовує шлях подальших дій agent-to-agent (A2A) після вставлення повідомлення:

- чекати на відповідь цільової сесії
- за бажанням дозволити запитувачу й цілі обмінятися обмеженою кількістю додаткових turn
- попросити цільову сесію створити announce-повідомлення
- доставити це announce до видимого каналу або треду

Цей шлях A2A є резервним варіантом для однорангових надсилань, коли відправнику потрібна видима подальша дія. Він залишається увімкненим, коли не пов’язана сесія може бачити й надсилати повідомлення ACP-цілі, наприклад при широких налаштуваннях `tools.sessions.visibility`.

OpenClaw пропускає подальшу дію A2A лише тоді, коли запитувач є батьківською сесією для власної одноразової дочірньої ACP-сесії. У такому випадку запуск A2A поверх завершення завдання може розбудити батьківську сесію результатом дочірньої, переслати відповідь батьківської назад у дочірню й створити цикл відлуння батьківська/дочірня сесія. Для цього випадку з дочірньою сесією, що належить батьківській, результат `sessions_send` повідомляє `delivery.status="skipped"`, оскільки за результат уже відповідає шлях завершення.

### Відновлення наявної сесії

Використовуйте `resumeSessionId`, щоб продовжити попередню ACP-сесію замість початку з нуля. Агент повторно відтворює історію розмови через `session/load`, тому продовжує роботу з повним контекстом попереднього.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Типові випадки використання:

- Передати сесію Codex з ноутбука на телефон — попросіть агента продовжити з того місця, де ви зупинилися
- Продовжити сесію кодування, розпочату інтерактивно в CLI, тепер безголово через агента
- Продовжити роботу, яку було перервано перезапуском gateway або тайм-аутом бездіяльності

Примітки:

- `resumeSessionId` вимагає `runtime: "acp"` — повертає помилку, якщо використовується з runtime sub-agent.
- `resumeSessionId` відновлює історію розмови ACP upstream; `thread` і `mode` все одно застосовуються звичайним чином до нової сесії OpenClaw, яку ви створюєте, тому `mode: "session"` все ще вимагає `thread: true`.
- Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
- Якщо id сесії не знайдено, створення завершується чіткою помилкою — без мовчазного повернення до нової сесії.

<Accordion title="Smoke-тест після розгортання">

Після розгортання gateway виконайте живу наскрізну перевірку, а не покладайтеся лише на unit-тести:

1. Перевірте версію й commit розгорнутого gateway на цільовому хості.
2. Відкрийте тимчасову bridge-сесію ACPX до live-агента.
3. Попросіть цього агента викликати `sessions_spawn` із `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Переконайтеся, що є `accepted=yes`, справжній `childSessionKey` і немає помилки validator.
5. Приберіть тимчасову bridge-сесію.

Тримайте перевірку на `mode: "run"` і пропускайте `streamTo: "parent"` — `mode: "session"`, прив’язаний до треду, і шляхи ретрансляції stream є окремими, більш насиченими інтеграційними проходами.

</Accordion>

## Сумісність із sandbox

ACP-сесії наразі працюють у runtime хоста, а не всередині sandbox OpenClaw.

Поточні обмеження:

- Якщо сесія-запитувач працює в sandbox, створення ACP-сесій блокується як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
  - Помилка: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.
  - Помилка: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Використовуйте `runtime: "subagent"`, коли вам потрібне виконання з примусовим sandbox.

### Із команди `/acp`

Використовуйте `/acp spawn` для явного керування оператором із чату, коли це потрібно.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Основні прапорці:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Див. [Slash Commands](/uk/tools/slash-commands).

## Визначення цільової сесії

Більшість дій `/acp` приймають необов’язкову ціль сесії (`session-key`, `session-id` або `session-label`).

Порядок визначення:

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує ключ
   - потім session id у формі UUID
   - потім label
2. Поточна прив’язка треду (якщо ця розмова/тред прив’язані до ACP-сесії)
3. Резервний варіант — поточна сесія-запитувач

Прив’язки до поточної розмови й тредів обидві беруть участь у кроці 2.

Якщо ціль не визначається, OpenClaw повертає чітку помилку (`Unable to resolve session target: ...`).

## Режими прив’язки під час створення

`/acp spawn` підтримує `--bind here|off`.

| Режим | Поведінка                                                              |
| ------ | ---------------------------------------------------------------------- |
| `here` | Прив’язати поточну активну розмову на місці; помилка, якщо активної немає. |
| `off`  | Не створювати прив’язку до поточної розмови.                           |

Примітки:

- `--bind here` — найпростіший шлях для оператора для сценарію «зробити цей канал або чат підключеним до Codex».
- `--bind here` не створює дочірній тред.
- `--bind here` доступний лише в каналах, які експонують підтримку прив’язки до поточної розмови.
- `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

## Режими тредів під час створення

`/acp spawn` підтримує `--thread auto|here|off`.

| Режим  | Поведінка                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | В активному треді: прив’язати цей тред. Поза тредом: створити/прив’язати дочірній тред, якщо це підтримується. |
| `here` | Вимагає поточний активний тред; помилка, якщо ви не в треді.                                        |
| `off`  | Без прив’язки. Сесія запускається без прив’язки.                                                    |

Примітки:

- На поверхнях без підтримки прив’язки до тредів стандартна поведінка фактично дорівнює `off`.
- Створення з прив’язкою до треду потребує підтримки політики каналу:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Використовуйте `--bind here`, якщо хочете закріпити поточну розмову без створення дочірнього треду.

## Керування ACP

| Команда              | Що вона робить                                         | Приклад                                                       |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `/acp spawn`         | Створити ACP-сесію; необов’язкова поточна прив’язка або прив’язка до треду. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасувати turn у процесі виконання для цільової сесії. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надіслати інструкцію steer до запущеної сесії.         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закрити сесію й відв’язати цілі тредів.                | `/acp close`                                                  |
| `/acp status`        | Показати backend, mode, state, параметри runtime, capabilities. | `/acp status`                                                 |
| `/acp set-mode`      | Задати mode runtime для цільової сесії.                | `/acp set-mode plan`                                          |
| `/acp set`           | Загальний запис параметра конфігурації runtime.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Задати перевизначення робочого каталогу runtime.       | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Задати профіль політики схвалення.                     | `/acp permissions strict`                                     |
| `/acp timeout`       | Задати тайм-аут runtime (секунди).                     | `/acp timeout 120`                                            |
| `/acp model`         | Задати перевизначення моделі runtime.                  | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видалити перевизначення параметрів runtime для сесії.  | `/acp reset-options`                                          |
| `/acp sessions`      | Показати список нещодавніх ACP-сесій зі сховища.       | `/acp sessions`                                               |
| `/acp doctor`        | Здоров’я backend, capabilities, практичні виправлення. | `/acp doctor`                                                 |
| `/acp install`       | Вивести детерміновані кроки встановлення й увімкнення. | `/acp install`                                                |

`/acp status` показує фактичні параметри runtime, а також ідентифікатори сесії на рівні runtime і backend. Помилки unsupported-control чітко відображаються, коли backend не має потрібної capability. `/acp sessions` читає сховище для поточної прив’язаної або запитуваної сесії; токени цілі (`session-key`, `session-id` або `session-label`) визначаються через виявлення сесій gateway, включно з власними коренями `session.store` для окремих агентів.

## Відображення параметрів runtime

`/acp` має зручні команди та загальний setter.

Еквівалентні операції:

- `/acp model <id>` зіставляється з ключем конфігурації runtime `model`.
- `/acp permissions <profile>` зіставляється з ключем конфігурації runtime `approval_policy`.
- `/acp timeout <seconds>` зіставляється з ключем конфігурації runtime `timeout`.
- `/acp cwd <path>` безпосередньо оновлює перевизначення cwd runtime.
- `/acp set <key> <value>` — це загальний шлях.
  - Особливий випадок: `key=cwd` використовує шлях перевизначення cwd.
- `/acp reset-options` очищає всі перевизначення runtime для цільової сесії.

## Підтримка harness acpx (поточна)

Поточні вбудовані aliases harness acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Коли OpenClaw використовує backend acpx, віддавайте перевагу цим значенням для `agentId`, якщо у вашій конфігурації acpx не визначено власні aliases агентів.
Якщо ваша локальна інсталяція Cursor усе ще експонує ACP як `agent acp`, перевизначте команду агента `cursor` у своїй конфігурації acpx замість зміни вбудованого значення за замовчуванням.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей сирий обхідний шлях є можливістю CLI acpx (а не звичайним шляхом `agentId` в OpenClaw).

## Обов’язкова конфігурація

Базова конфігурація ACP у core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Конфігурація прив’язки до тредів залежить від адаптера каналу. Приклад для Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Якщо створення ACP-сесій із прив’язкою до треду не працює, спочатку перевірте feature flag адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не вимагають створення дочірнього треду. Вони потребують активного контексту розмови й адаптера каналу, який експонує прив’язки ACP до розмови.

Див. [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування Plugin для backend acpx

Свіжі інсталяції постачаються з увімкненим за замовчуванням вбудованим runtime Plugin `acpx`, тож ACP
зазвичай працює без ручного встановлення Plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
перемкнутися на локальний checkout для розробки, використовуйте явний шлях Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Установлення локального workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан backend:

```text
/acp doctor
```

### Конфігурація команди й версії acpx

За замовчуванням вбудований Plugin `acpx` використовує свій локально закріплений бінарний файл (`node_modules/.bin/acpx` усередині пакета Plugin). Під час запуску backend реєструється як not-ready, а фонове завдання перевіряє `acpx --version`; якщо бінарний файл відсутній або версія не збігається, виконується `npm install --omit=dev --no-save acpx@<pinned>` і повторна перевірка. Gateway при цьому залишається неблокувальним.

Перевизначення команди або версії в конфігурації Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` приймає абсолютний шлях, відносний шлях (визначається від workspace OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає суворе зіставлення версії.
- Власні шляхи `command` вимикають автоматичне встановлення локально для Plugin.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви глобально встановлюєте OpenClaw через `npm install -g openclaw`, залежності runtime acpx
(бінарні файли для конкретної платформи) встановлюються автоматично
через postinstall hook. Якщо автоматичне встановлення не вдасться, gateway все одно запуститься
нормально і повідомить про відсутню залежність через `openclaw acp doctor`.

### MCP-міст для інструментів Plugin

За замовчуванням ACPX-сесії **не** експонують зареєстровані Plugin інструменти OpenClaw до
ACP harness.

Якщо ви хочете, щоб ACP-агенти, як-от Codex або Claude Code, могли викликати встановлені
інструменти Plugin OpenClaw, наприклад memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Вставляє вбудований MCP-сервер з назвою `openclaw-plugin-tools` у bootstrap
  ACPX-сесії.
- Експонує інструменти Plugin, уже зареєстровані встановленими та увімкненими Plugin OpenClaw.
- Залишає цю можливість явною та вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів ACP harness.
- ACP-агенти отримують доступ лише до інструментів Plugin, уже активних у gateway.
- Ставтеся до цього як до тієї самої межі довіри, що й дозвіл цим Plugin виконуватися
  в самому OpenClaw.
- Перегляньте встановлені Plugin перед увімкненням.

Власні `mcpServers`, як і раніше, працюють. Вбудований міст plugin-tools —
це додаткова зручність, що вмикається за бажанням, а не заміна загальної конфігурації MCP server.

### MCP-міст для інструментів OpenClaw

За замовчуванням ACPX-сесії також **не** експонують вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст core-tools, коли ACP-агенту потрібні вибрані
вбудовані інструменти, наприклад `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Вставляє вбудований MCP-сервер з назвою `openclaw-tools` у bootstrap
  ACPX-сесії.
- Експонує вибрані вбудовані інструменти OpenClaw. Початковий сервер експонує `cron`.
- Залишає експонування core-tools явним і вимкненим за замовчуванням.

### Налаштування тайм-ауту runtime

Вбудований Plugin `acpx` за замовчуванням задає для embedded runtime turn
тайм-аут 120 секунд. Це дає повільнішим harness, як-от Gemini CLI, достатньо часу на завершення
запуску та ініціалізації ACP. Перевизначте це значення, якщо вашому хосту потрібне інше
обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація агента для health probe

Вбудований Plugin `acpx` перевіряє один harness-агент, коли визначає, чи готовий
embedded runtime backend. За замовчуванням це `codex`. Якщо у вашому розгортанні
використовується інший стандартний ACP-агент, задайте агент probe з тим самим id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Налаштування дозволів

ACP-сесії працюють неінтерактивно — немає TTY, щоб схвалювати або відхиляти запити дозволів на запис у файли та виконання shell-команд. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи harness ACPX відокремлені від схвалень exec в OpenClaw і від прапорців обходу постачальника для CLI-backends, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач на рівні harness для ACP-сесій.

### `permissionMode`

Керує тим, які операції harness-агент може виконувати без запиту.

| Значення        | Поведінка                                                  |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Автоматично схвалювати всі записи у файли та shell-команди. |
| `approve-reads` | Автоматично схвалювати лише читання; запис і exec потребують запитів. |
| `deny-all`      | Відхиляти всі запити дозволів.                             |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би з’явитися запит дозволу, але інтерактивний TTY недоступний (а для ACP-сесій це завжди так).

| Значення | Поведінка                                                        |
| -------- | ---------------------------------------------------------------- |
| `fail`   | Перервати сесію з `AcpRuntimeError`. **(за замовчуванням)**      |
| `deny`   | Мовчки відхилити дозвіл і продовжити (плавна деградація).        |

### Конфігурація

Задається через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

> **Важливо:** OpenClaw наразі за замовчуванням використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних ACP-сесіях будь-який запис або exec, що викликає запит дозволу, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сесії деградували плавно, а не аварійно завершувалися.

## Усунення несправностей

| Симптом                                                                     | Ймовірна причина                                                                | Виправлення                                                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend Plugin відсутній або вимкнений.                                         | Установіть і ввімкніть Plugin backend, потім виконайте `/acp doctor`.                                                                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                         | Установіть `acp.enabled=true`.                                                                                                                                       |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch із звичайних повідомлень треду вимкнено.                               | Установіть `acp.dispatch.enabled=true`.                                                                                                                              |
| `ACP agent "<id>" is not allowed by policy`                                 | Агент відсутній в allowlist.                                                    | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                  |
| `Unable to resolve session target: ...`                                     | Неправильний токен key/id/label.                                                | Виконайте `/acp sessions`, скопіюйте точний key/label і повторіть спробу.                                                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної розмови, яку можна прив’язати.           | Перейдіть у цільовий чат/канал і повторіть спробу або використайте створення без прив’язки.                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має capability прив’язки ACP до поточної розмови.                    | Використовуйте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте `bindings[]` верхнього рівня або перейдіть у підтримуваний канал.                   |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом треду.                              | Перейдіть у цільовий тред або використайте `--thread auto`/`off`.                                                                                                   |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє поточною ціллю прив’язки.                              | Повторно прив’яжіть від імені власника або використайте іншу розмову чи тред.                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має capability прив’язки до тредів.                                  | Використовуйте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                     |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP працює на боці хоста; сесія-запитувач працює в sandbox.             | Використовуйте `runtime="subagent"` із sandboxed-сесій або запускайте ACP-створення з сесії без sandbox.                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для runtime ACP запитано `sandbox="require"`.                                   | Використовуйте `runtime="subagent"` для обов’язкового sandbox або ACP із `sandbox="inherit"` із сесії без sandbox.                                                 |
| Missing ACP metadata for bound session                                      | Застарілі/видалені метадані ACP-сесії.                                          | Створіть заново через `/acp spawn`, потім повторно прив’яжіть/сфокусуйте тред.                                                                                     |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує запис/exec у неінтерактивній ACP-сесії.                 | Установіть `plugins.entries.acpx.config.permissionMode` у `approve-all` і перезапустіть gateway. Див. [Налаштування дозволів](#permission-configuration).         |
| ACP-сесія рано завершується з мінімальним виводом                           | Запити дозволів блокуються через `permissionMode`/`nonInteractivePermissions`.  | Перевірте журнали gateway на `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для плавної деградації встановіть `nonInteractivePermissions=deny`. |
| ACP-сесія зависає безкінечно після завершення роботи                        | Процес harness завершився, але ACP-сесія не повідомила про завершення.          | Відстежуйте через `ps aux \| grep acpx`; вручну завершіть застарілі процеси.                                                                                        |

## Пов’язане

- [Sub-agents](/uk/tools/subagents)
- [Інструменти sandbox для кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [Надсилання агенту](/uk/tools/agent-send)
