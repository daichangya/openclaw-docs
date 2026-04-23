---
read_when:
    - Запуск coding harness-ів через ACP
    - Налаштування прив’язаних до розмови сесій ACP у каналах обміну повідомленнями
    - Прив’язка розмови в каналі повідомлень до стійкої сесії ACP
    - Усунення несправностей бекенда ACP і підключення Plugin-ів
    - Налагодження доставки завершення ACP або циклів агент-до-агента
    - Використання команд `/acp` із чату
summary: Використовуйте runtime-сесії ACP для Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP та інших harness-агентів
title: агенти ACP
x-i18n:
    generated_at: "2026-04-23T19:28:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 329e64aa98d722e649cd4f079a66d14f4f331de9994646539995d1b371bbacb3
    source_path: tools/acp-agents.md
    workflow: 15
---

# агенти ACP

Сесії [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) дають OpenClaw змогу запускати зовнішні coding harness-и (наприклад Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI та інші підтримувані ACPX harness-и) через Plugin бекенда ACP.

Якщо ви просите OpenClaw звичайною мовою «запусти це в Codex» або «запусти Claude Code у thread-і», OpenClaw має маршрутизувати цей запит до runtime ACP (а не до native runtime субагента). Кожне породження сесії ACP відстежується як [background task](/uk/automation/tasks).

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній MCP-клієнт безпосередньо
до наявних розмов каналів OpenClaw, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp) замість ACP.

## Яка сторінка мені потрібна?

Поруч є три поверхні, які легко сплутати:

| Ви хочете...                                                                     | Використовуйте це                     | Примітки                                                                                                     |
| --------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Запускати Codex, Claude Code, Gemini CLI або інший зовнішній harness _через_ OpenClaw | Ця сторінка: агенти ACP              | Сесії, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, background task-и, елементи керування runtime |
| Відкрити сесію Gateway OpenClaw _як_ сервер ACP для редактора або клієнта         | [`openclaw acp`](/uk/cli/acp)           | Режим bridge. IDE/клієнт спілкується з OpenClaw через ACP поверх stdio/WebSocket                             |
| Повторно використовувати локальний AI CLI як текстову fallback-модель             | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Немає інструментів OpenClaw, немає елементів керування ACP, немає runtime harness                    |

## Чи це працює одразу?

Зазвичай так. Свіжі встановлення постачають bundled Plugin runtime `acpx`, увімкнений за замовчуванням, із локально закріпленим бінарним файлом `acpx`, який OpenClaw перевіряє та самовідновлює під час запуску. Запустіть `/acp doctor` для перевірки готовності.

Типові нюанси першого запуску:

- Адаптери цільових harness-ів (Codex, Claude тощо) можуть завантажуватися на вимогу через `npx` під час першого використання.
- Автентифікація постачальника все одно має бути налаштована на хості для цього harness.
- Якщо на хості немає npm або доступу до мережі, початкове завантаження адаптерів не вдасться, доки кеші не буде попередньо прогріто або адаптер не буде встановлено іншим способом.

## Операційний runbook

Швидкий потік `/acp` із чату:

1. **Створити** — `/acp spawn codex --bind here` або `/acp spawn codex --mode persistent --thread auto`
2. **Працюйте** у прив’язаній розмові або thread-і (або явно звертайтеся до ключа сесії).
3. **Перевірте стан** — `/acp status`
4. **Налаштуйте** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Спрямуйте** без заміни контексту — `/acp steer tighten logging and continue`
6. **Зупиніть** — `/acp cancel` (поточний хід) або `/acp close` (сесія + прив’язки)

Тригери природною мовою, які мають маршрутизуватися до runtime ACP:

- «Прив’яжи цей канал Discord до Codex.»
- «Запусти тут стійку сесію Codex у thread-і.»
- «Запусти це як одноразову ACP-сесію Claude Code і підсумуй результат.»
- «Використай Gemini CLI для цього завдання в thread-і, а потім залиш подальші дії в тому самому thread-і.»

OpenClaw вибирає `runtime: "acp"`, визначає `agentId` harness-а, прив’язується до поточної розмови або thread-а, якщо це підтримується, і маршрутизує подальші повідомлення до цієї сесії до закриття/завершення строку дії.

## ACP порівняно із субагентами

Використовуйте ACP, коли вам потрібен runtime зовнішнього harness-а. Використовуйте субагентів, коли вам потрібні делеговані запуски, native для OpenClaw.

| Область        | Сесія ACP                             | Запуск субагента                    |
| -------------- | ------------------------------------- | ----------------------------------- |
| Runtime        | Plugin бекенда ACP (наприклад acpx)   | Native runtime субагента OpenClaw   |
| Ключ сесії     | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Основні команди | `/acp ...`                           | `/subagents ...`                    |
| Інструмент запуску | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (runtime за замовчуванням) |

Див. також [Sub-agents](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування сесією ACP OpenClaw
2. bundled Plugin runtime `acpx`
3. Адаптер Claude ACP
4. Машинерія runtime/сесії на боці Claude

Важливе розрізнення:

- ACP Claude — це сесія harness-а з елементами керування ACP, відновленням сесії, відстеженням background task-ів і необов’язковою прив’язкою до розмови/thread-а.
- CLI backends — це окремі локальні fallback runtime лише для тексту. Див. [CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- якщо вам потрібні `/acp spawn`, сесії з прив’язкою, елементи керування runtime або стійка робота harness-а: використовуйте ACP
- якщо вам потрібен простий локальний текстовий fallback через сирий CLI: використовуйте CLI backends

## Прив’язані сесії

### Прив’язки до поточної розмови

`/acp spawn <harness> --bind here` закріплює поточну розмову за створеною сесією ACP — без дочірнього thread-а, на тій самій поверхні чату. OpenClaw і далі керує transport, auth, безпекою та доставкою; подальші повідомлення в цій розмові маршрутизуються до тієї самої сесії; `/new` і `/reset` скидають сесію на місці; `/acp close` знімає прив’язку.

Ментальна модель:

- **поверхня чату** — місце, де люди продовжують спілкуватися (канал Discord, тема Telegram, чат iMessage).
- **сесія ACP** — стійкий стан runtime Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **дочірній thread/тема** — необов’язкова додаткова поверхня повідомлень, що створюється лише через `--thread ...`.
- **runtime workspace** — розташування у файловій системі (`cwd`, checkout репозиторію, workspace бекенда), де працює harness. Воно не залежить від поверхні чату.

Приклади:

- `/acp spawn codex --bind here` — залишає цей чат, створює або під’єднує Codex, маршрутизує майбутні повідомлення сюди.
- `/acp spawn codex --thread auto` — OpenClaw може створити дочірній thread/тему й прив’язати сесію туди.
- `/acp spawn codex --bind here --cwd /workspace/repo` — та сама прив’язка до чату, Codex працює в `/workspace/repo`.

Примітки:

- `--bind here` і `--thread ...` взаємовиключні.
- `--bind here` працює лише в каналах, які оголошують підтримку прив’язки до поточної розмови; інакше OpenClaw повертає чітке повідомлення про відсутність підтримки. Прив’язки зберігаються після перезапуску gateway.
- У Discord `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній thread для `--thread auto|here` — не для `--bind here`.
- Якщо ви створюєте сесію для іншого агента ACP без `--cwd`, OpenClaw типово успадковує workspace **цільового агента**. Якщо успадкований шлях відсутній (`ENOENT`/`ENOTDIR`), використовується стандартний fallback бекенда; інші помилки доступу (наприклад `EACCES`) повертаються як помилки створення.

### Сесії, прив’язані до thread-а

Коли прив’язки thread-ів увімкнено для адаптера каналу, сесії ACP можна прив’язувати до thread-ів:

- OpenClaw прив’язує thread до цільової сесії ACP.
- Подальші повідомлення в цьому thread-і маршрутизуються до прив’язаної сесії ACP.
- Вивід ACP доставляється назад у той самий thread.
- Втрата фокусу/закриття/архівація/завершення строку бездіяльності або максимального віку видаляє прив’язку.

Підтримка прив’язки до thread-ів залежить від адаптера. Якщо активний адаптер каналу не підтримує прив’язки thread-ів, OpenClaw повертає чітке повідомлення про відсутність підтримки/доступності.

Потрібні feature flag-и для ACP, прив’язаного до thread-а:

- `acp.enabled=true`
- `acp.dispatch.enabled` увімкнено за замовчуванням (установіть `false`, щоб призупинити диспетчеризацію ACP)
- Увімкнено flag адаптера каналу для створення ACP thread-ів (залежить від адаптера)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Канали з підтримкою thread-ів

- Будь-який адаптер каналу, що надає можливість прив’язки сесії/thread-а.
- Поточна вбудована підтримка:
  - thread-и/канали Discord
  - теми Telegram (forum topics у групах/supergroups і DM topics)
- Plugin-канали можуть додавати підтримку через той самий інтерфейс прив’язки.

## Налаштування для конкретних каналів

Для неефемерних робочих процесів налаштуйте стійкі прив’язки ACP у записах верхнього рівня `bindings[]`.

### Модель прив’язки

- `bindings[].type="acp"` позначає стійку прив’язку розмови ACP.
- `bindings[].match` визначає цільову розмову:
  - Канал або thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Тема форуму Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - DM/груповий чат BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних прив’язок груп віддавайте перевагу `chat_id:*` або `chat_identifier:*`.
  - DM/груповий чат iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних прив’язок груп віддавайте перевагу `chat_id:*`.
- `bindings[].agentId` — це id агента OpenClaw-власника.
- Необов’язкові перевизначення ACP містяться в `bindings[].acp`:
  - `mode` (`persistent` або `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Значення runtime за замовчуванням для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити значення ACP за замовчуванням для кожного агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness-а, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Пріоритет перевизначень для сесій ACP з прив’язкою:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. глобальні значення ACP за замовчуванням (наприклад `acp.backend`)

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
- Повідомлення в цьому каналі або темі маршрутизуються до налаштованої сесії ACP.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ сесії ACP на місці.
- Тимчасові прив’язки runtime (наприклад, створені потоками фокусування thread-ів) усе ще застосовуються, якщо вони є.
- Для міжагентних породжень ACP без явного `cwd` OpenClaw успадковує workspace цільового агента з config агента.
- Відсутні успадковані шляхи workspace переходять на стандартний cwd бекенда; помилки доступу, не пов’язані з відсутністю, повертаються як помилки породження.

## Запуск сесій ACP (інтерфейси)

### Із `sessions_spawn`

Використовуйте `runtime: "acp"`, щоб запустити сесію ACP з ходу агента або виклику інструмента.

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

- `runtime` типово дорівнює `subagent`, тому для сесій ACP явно встановлюйте `runtime: "acp"`.
- Якщо `agentId` пропущено, OpenClaw використовує `acp.defaultAgent`, якщо його налаштовано.
- `mode: "session"` вимагає `thread: true`, щоб зберегти стійку прив’язану розмову.

Подробиці інтерфейсу:

- `task` (обов’язково): початковий prompt, надісланий до сесії ACP.
- `runtime` (обов’язково для ACP): має бути `"acp"`.
- `agentId` (необов’язково): id цільового harness-а ACP. Якщо не задано, використовується `acp.defaultAgent`, якщо його встановлено.
- `thread` (необов’язково, типово `false`): запит потоку прив’язки до thread-а, де це підтримується.
- `mode` (необов’язково): `run` (одноразовий) або `session` (стійкий).
  - типове значення — `run`
  - якщо `thread: true` і mode пропущено, OpenClaw може типово перейти до стійкої поведінки залежно від шляху runtime
  - `mode: "session"` вимагає `thread: true`
- `cwd` (необов’язково): запитуваний робочий каталог runtime (перевіряється політикою бекенда/runtime). Якщо пропущено, створення ACP успадковує workspace цільового агента, якщо його налаштовано; відсутні успадковані шляхи переходять на значення бекенда за замовчуванням, тоді як реальні помилки доступу повертаються.
- `label` (необов’язково): мітка для оператора, яка використовується в тексті сесії/банера.
- `resumeSessionId` (необов’язково): відновлює наявну сесію ACP замість створення нової. Агент відтворює history своєї розмови через `session/load`. Вимагає `runtime: "acp"`.
- `streamTo` (необов’язково): `"parent"` стримить початкові підсумки прогресу запуску ACP назад у сесію запитувача як системні події.
  - За наявності прийняті відповіді містять `streamLogPath`, який указує на JSONL-лог у межах сесії (`<sessionId>.acp-stream.jsonl`), який можна переглядати для повної history relay.

- `model` (необов’язково): явне перевизначення моделі для дочірньої сесії ACP. Враховується для `runtime: "acp"`, тож дочірня сесія використовує запитану модель замість непомітного fallback до типового значення цільового агента.

## Модель доставки

Сесії ACP можуть бути або інтерактивними workspace, або фоновою роботою, що належить батьківській сесії. Шлях доставки залежить від цієї форми.

### Інтерактивні сесії ACP

Інтерактивні сесії призначені для продовження розмови на видимій поверхні чату:

- `/acp spawn ... --bind here` прив’язує поточну розмову до сесії ACP.
- `/acp spawn ... --thread ...` прив’язує thread/тему каналу до сесії ACP.
- Стійкі налаштовані `bindings[].type="acp"` маршрутизують відповідні розмови до тієї самої сесії ACP.

Подальші повідомлення в прив’язаній розмові маршрутизуються безпосередньо до сесії ACP, а вивід ACP доставляється назад у той самий канал/thread/тему.

### Одноразові сесії ACP, що належать батьківській сесії

Одноразові сесії ACP, створені іншим запуском агента, є фоновими дочірніми сесіями, подібно до субагентів:

- Батьківська сесія запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Дочірня сесія працює у власній ACP-сесії harness-а.
- Завершення повертається через внутрішній шлях оголошення про завершення task.
- Батьківська сесія переписує результат дочірньої у звичайному голосі assistant-а, коли потрібна відповідь для користувача.

Не сприймайте цей шлях як peer-to-peer чат між батьківською і дочірньою сесіями. У дочірньої сесії вже є канал завершення назад до батьківської.

### `sessions_send` і доставка A2A

`sessions_send` може націлюватися на іншу сесію після створення. Для звичайних peer-сесій OpenClaw використовує шлях подальших дій agent-to-agent (A2A) після вставлення повідомлення:

- очікує на відповідь цільової сесії
- за потреби дає змогу запитувачу й цілі обмінятися обмеженою кількістю подальших ходів
- просить ціль створити announce-повідомлення
- доставляє цей announce у видимий канал або thread

Цей шлях A2A є fallback для peer-надсилань, коли відправнику потрібна видима подальша відповідь. Він лишається ввімкненим, коли не пов’язана напряму сесія може бачити й надсилати повідомлення цілі ACP, наприклад за широких налаштувань `tools.sessions.visibility`.

OpenClaw пропускає подальший шлях A2A лише тоді, коли запитувач є батьківською сесією власної одноразової дочірньої ACP-сесії. У такому разі запуск A2A поверх завершення task може розбудити батьківську сесію результатом дочірньої, переслати відповідь батьківської назад у дочірню й створити цикл echo між батьківською та дочірньою. Результат `sessions_send` повідомляє `delivery.status="skipped"` для такого випадку з дочірньою сесією у власності, оскільки шлях завершення вже відповідає за результат.

### Відновлення наявної сесії

Використовуйте `resumeSessionId`, щоб продовжити попередню сесію ACP замість нового старту. Агент відтворює history своєї розмови через `session/load`, тож підхоплює роботу з повним контекстом попереднього.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Поширені випадки використання:

- Передати сесію Codex з ноутбука на телефон — попросіть агента продовжити з місця, де ви зупинилися
- Продовжити coding-сесію, яку ви почали інтерактивно в CLI, тепер у headless-режимі через агента
- Відновити роботу, перервану через перезапуск gateway або тайм-аут бездіяльності

Примітки:

- `resumeSessionId` вимагає `runtime: "acp"` — повертає помилку, якщо використовується з runtime субагента.
- `resumeSessionId` відновлює upstream history розмови ACP; `thread` і `mode` і далі застосовуються звичайним чином до нової сесії OpenClaw, яку ви створюєте, тому `mode: "session"` усе ще вимагає `thread: true`.
- Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
- Якщо id сесії не знайдено, створення завершується чіткою помилкою — без непомітного fallback до нової сесії.

<Accordion title="Smoke-тест після розгортання">

Після розгортання gateway виконайте живу наскрізну перевірку замість того, щоб покладатися лише на unit-тести:

1. Перевірте версію й коміт розгорнутого gateway на цільовому хості.
2. Відкрийте тимчасову bridge-сесію ACPX до живого агента.
3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Переконайтеся, що `accepted=yes`, є реальний `childSessionKey` і немає помилки валідації.
5. Очистьте тимчасову bridge-сесію.

Залишайте перевірку на `mode: "run"` і пропускайте `streamTo: "parent"` — прив’язаний до thread-а `mode: "session"` і шляхи relay стримінгу є окремими, багатшими інтеграційними проходами.

</Accordion>

## Сумісність із sandbox

Сесії ACP наразі працюють у runtime хоста, а не всередині sandbox OpenClaw.

Поточні обмеження:

- Якщо сесія запитувача виконується в sandbox, створення ACP блокується як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
  - Помилка: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.
  - Помилка: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Використовуйте `runtime: "subagent"`, коли потрібне виконання з примусовим sandbox.

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

Див. [Slash Commands](/uk/tools/slash-commands).

## Визначення цільової сесії

Більшість дій `/acp` приймають необов’язкову ціль сесії (`session-key`, `session-id` або `session-label`).

Порядок визначення:

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує key
   - потім session id у формі UUID
   - потім label
2. Поточна прив’язка thread-а (якщо ця розмова/thread прив’язані до сесії ACP)
3. Fallback до поточної сесії запитувача

Прив’язки до поточної розмови та прив’язки до thread-а беруть участь у кроці 2.

Якщо ціль не вдається визначити, OpenClaw повертає чітку помилку (`Unable to resolve session target: ...`).

## Режими прив’язки під час створення

`/acp spawn` підтримує `--bind here|off`.

| Режим  | Поведінка                                                              |
| ------ | ---------------------------------------------------------------------- |
| `here` | Прив’язує поточну активну розмову на місці; завершується помилкою, якщо активної немає. |
| `off`  | Не створює прив’язку до поточної розмови.                              |

Примітки:

- `--bind here` — це найпростіший операторський шлях для «зробити цей канал або чат підкріпленим Codex».
- `--bind here` не створює дочірній thread.
- `--bind here` доступний лише в каналах, що надають підтримку прив’язки до поточної розмови.
- `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

## Режими thread під час створення

`/acp spawn` підтримує `--thread auto|here|off`.

| Режим  | Поведінка                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `auto` | У активному thread-і: прив’язує цей thread. Поза thread-ом: створює/прив’язує дочірній thread, якщо це підтримується. |
| `here` | Вимагає поточний активний thread; завершується помилкою, якщо ви не в thread-і.                      |
| `off`  | Без прив’язки. Сесія запускається без прив’язки.                                                      |

Примітки:

- На поверхнях без підтримки прив’язки до thread-ів типова поведінка фактично дорівнює `off`.
- Створення з прив’язкою до thread-а потребує підтримки політики каналу:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Використовуйте `--bind here`, коли хочете закріпити поточну розмову без створення дочірнього thread-а.

## Елементи керування ACP

| Команда              | Що вона робить                                            | Приклад                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створює сесію ACP; необов’язкова поточна прив’язка або прив’язка до thread-а. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасовує хід у процесі для цільової сесії.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надсилає інструкцію steer до запущеної сесії.             | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закриває сесію та відв’язує цілі thread-ів.               | `/acp close`                                                  |
| `/acp status`        | Показує бекенд, mode, state, runtime options, capabilities. | `/acp status`                                                 |
| `/acp set-mode`      | Встановлює режим runtime для цільової сесії.              | `/acp set-mode plan`                                          |
| `/acp set`           | Загальний запис параметра config runtime.                 | `/acp set model openai/gpt-5.5`                               |
| `/acp cwd`           | Встановлює перевизначення робочого каталогу runtime.      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Встановлює профіль політики approvals.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Встановлює timeout runtime (секунди).                     | `/acp timeout 120`                                            |
| `/acp model`         | Встановлює перевизначення моделі runtime.                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видаляє перевизначення параметрів runtime сесії.          | `/acp reset-options`                                          |
| `/acp sessions`      | Перелічує нещодавні сесії ACP зі сховища.                 | `/acp sessions`                                               |
| `/acp doctor`        | Стан бекенда, capabilities, практичні виправлення.        | `/acp doctor`                                                 |
| `/acp install`       | Виводить детерміновані кроки встановлення й увімкнення.   | `/acp install`                                                |

`/acp status` показує ефективні параметри runtime разом з ідентифікаторами сесії на рівні runtime і бекенда. Помилки unsupported-control чітко відображаються, коли бекенду бракує можливості. `/acp sessions` читає сховище для поточної прив’язаної сесії або сесії запитувача; цільові токени (`session-key`, `session-id` або `session-label`) визначаються через виявлення сесій gateway, включно з користувацькими коренями `session.store` для окремих агентів.

## Відображення параметрів runtime

`/acp` має зручні команди та загальний setter.

Еквівалентні операції:

- `/acp model <id>` відображається на ключ config runtime `model`.
- `/acp permissions <profile>` відображається на ключ config runtime `approval_policy`.
- `/acp timeout <seconds>` відображається на ключ config runtime `timeout`.
- `/acp cwd <path>` безпосередньо оновлює перевизначення cwd runtime.
- `/acp set <key> <value>` — це загальний шлях.
  - Особливий випадок: `key=cwd` використовує шлях перевизначення cwd.
- `/acp reset-options` очищає всі перевизначення runtime для цільової сесії.

## Підтримка harness acpx (поточна)

Поточні вбудовані псевдоніми harness acpx:

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

Коли OpenClaw використовує бекенд acpx, віддавайте перевагу цим значенням для `agentId`, якщо у вашій config acpx не визначено власні псевдоніми агентів.
Якщо у вашому локальному встановленні Cursor ACP усе ще доступний як `agent acp`, перевизначте команду агента `cursor` у своїй config acpx замість зміни вбудованого типового значення.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей сирий escape hatch є можливістю CLI acpx (а не звичайним шляхом `agentId` в OpenClaw).

## Обов’язкова config

Базова config ACP у core:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. Типове значення — true; установіть false, щоб призупинити диспетчеризацію ACP, зберігши елементи керування /acp.
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

Config прив’язки до thread-а залежить від адаптера каналу. Приклад для Discord:

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

Якщо створення ACP із прив’язкою до thread-а не працює, спочатку перевірте feature flag адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірнього thread-а. Вони потребують активного контексту розмови та адаптера каналу, який надає прив’язки розмов ACP.

Див. [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування Plugin-а для бекенда acpx

Свіжі встановлення постачають bundled Plugin runtime `acpx`, увімкнений за замовчуванням, тож ACP
зазвичай працює без ручного кроку встановлення Plugin-а.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
перейти на локальний checkout для розробки, використовуйте явний шлях Plugin-а:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Установлення з локального workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан бекенда:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

Типово bundled Plugin `acpx` використовує свій локальний закріплений бінарний файл (`node_modules/.bin/acpx` усередині пакета Plugin-а). Під час запуску бекенд реєструється як неготовий, а фонове завдання перевіряє `acpx --version`; якщо бінарний файл відсутній або версія не збігається, виконується `npm install --omit=dev --no-save acpx@<pinned>` і повторна перевірка. Gateway при цьому не блокується.

Перевизначте команду або версію в config Plugin-а:

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
- `expectedVersion: "any"` вимикає сувору перевірку відповідності версії.
- Користувацькі шляхи `command` вимикають автоматичне локальне встановлення Plugin-а.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви глобально встановлюєте OpenClaw через `npm install -g openclaw`, runtime-залежності acpx
(бінарні файли для конкретної платформи) встановлюються автоматично
через postinstall hook. Якщо автоматичне встановлення не вдається, gateway усе одно запускається
нормально й повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP для інструментів Plugin-ів

Типово сесії ACPX **не** відкривають зареєстровані Plugin-ами OpenClaw інструменти для
ACP harness-а.

Якщо ви хочете, щоб агенти ACP, такі як Codex або Claude Code, могли викликати встановлені
інструменти Plugin-ів OpenClaw, наприклад recall/store пам’яті, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер з назвою `openclaw-plugin-tools` у bootstrap
  сесії ACPX.
- Відкриває інструменти Plugin-ів, уже зареєстровані встановленими й увімкненими
  Plugin-ами OpenClaw.
- Залишає цю можливість явною та вимкненою за замовчуванням.

Примітки щодо безпеки й довіри:

- Це розширює поверхню інструментів ACP harness-а.
- Агенти ACP отримують доступ лише до інструментів Plugin-ів, уже активних у gateway.
- Ставтеся до цього як до тієї самої межі довіри, що й до дозволу цим Plugin-ам виконуватися
  в самому OpenClaw.
- Перегляньте встановлені Plugin-и перед увімкненням.

Користувацькі `mcpServers` і далі працюють як раніше. Вбудований міст для інструментів Plugin-ів є
додатковою зручною опцією, а не заміною загальної config MCP-сервера.

### Міст MCP для інструментів OpenClaw

Типово сесії ACPX також **не** відкривають вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст для core-інструментів, коли агенту ACP потрібні вибрані
вбудовані інструменти, такі як `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер з назвою `openclaw-tools` у bootstrap
  сесії ACPX.
- Відкриває вибрані вбудовані інструменти OpenClaw. Початковий сервер відкриває `cron`.
- Залишає відкриття core-інструментів явним і вимкненим за замовчуванням.

### Конфігурація timeout runtime

Bundled Plugin `acpx` типово встановлює timeout 120 секунд для вбудованих ходів runtime. Це дає достатньо часу
повільнішим harness-ам, таким як Gemini CLI, для завершення запуску й ініціалізації
ACP. Перевизначте це значення, якщо вашому хосту потрібне інше обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація probe-агента для перевірки стану

Bundled Plugin `acpx` перевіряє один harness-агент, визначаючи, чи готовий
бекенд вбудованого runtime. Типово це `codex`. Якщо у вашому розгортанні
використовується інший типовий агент ACP, установіть probe-агента на той самий id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Конфігурація дозволів

Сесії ACP виконуються неінтерактивно — немає TTY, щоб дозволяти або відхиляти запити на дозвіл запису файлів і виконання shell-команд. Plugin acpx надає два ключі config, які керують тим, як обробляються дозволи:

Ці дозволи ACPX harness-а відокремлені від approvals exec в OpenClaw і відокремлені від прапорців обходу постачальника в CLI backends, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач на рівні harness-а для сесій ACP.

### `permissionMode`

Керує тим, які операції агент harness-а може виконувати без запиту.

| Значення        | Поведінка                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Автоматично дозволяє всі записи файлів і shell-команди.  |
| `approve-reads` | Автоматично дозволяє лише читання; запис і exec потребують запитів. |
| `deny-all`      | Відхиляє всі запити на дозвіл.                           |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би з’явитися запит на дозвіл, але інтерактивний TTY недоступний (а для сесій ACP це так завжди).

| Значення | Поведінка                                                          |
| -------- | ------------------------------------------------------------------ |
| `fail`   | Перериває сесію з `AcpRuntimeError`. **(типово)**                  |
| `deny`   | Мовчки відхиляє дозвіл і продовжує роботу (плавна деградація).     |

### Конфігурація

Установлюється через config Plugin-а:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

> **Важливо:** Наразі OpenClaw типово використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сесіях ACP будь-який запис або exec, що викликає запит на дозвіл, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сесії переходили в режим плавної деградації замість аварійного завершення.

## Усунення несправностей

| Симптом                                                                     | Ймовірна причина                                                                | Виправлення                                                                                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin бекенда відсутній або вимкнений.                                         | Установіть і ввімкніть Plugin бекенда, потім запустіть `/acp doctor`.                                                                                             |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                         | Установіть `acp.enabled=true`.                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Диспетчеризацію зі звичайних повідомлень thread-а вимкнено.                     | Установіть `acp.dispatch.enabled=true`.                                                                                                                            |
| `ACP agent "<id>" is not allowed by policy`                                 | Агент не входить до allowlist-а.                                                | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                |
| `Unable to resolve session target: ...`                                     | Неправильний токен key/id/label.                                                | Запустіть `/acp sessions`, скопіюйте точний key/label і повторіть спробу.                                                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної розмови, яку можна прив’язати.           | Перейдіть у цільовий чат/канал і повторіть спробу або використайте створення без прив’язки.                                                                       |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має можливості ACP-прив’язки до поточної розмови.                    | Використовуйте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте `bindings[]` верхнього рівня або перейдіть до підтримуваного каналу.              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом thread-а.                           | Перейдіть до цільового thread-а або використайте `--thread auto`/`off`.                                                                                           |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє активною ціллю прив’язки.                              | Переприв’яжіть як власник або використайте іншу розмову чи thread.                                                                                                 |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має можливості прив’язки до thread-а.                                | Використовуйте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP працює на боці хоста; сесія запитувача виконується в sandbox.       | Використовуйте `runtime="subagent"` із sandbox-сесій або запускайте створення ACP із сесії без sandbox.                                                          |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для runtime ACP запитано `sandbox="require"`.                                   | Використовуйте `runtime="subagent"` для обов’язкового sandbox або використовуйте ACP із `sandbox="inherit"` із сесії без sandbox.                                |
| Missing ACP metadata for bound session                                      | Застарілі/видалені метадані сесії ACP.                                          | Створіть сесію знову через `/acp spawn`, потім повторно прив’яжіть/сфокусуйте thread.                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує записи/exec у неінтерактивній сесії ACP.                | Установіть `plugins.entries.acpx.config.permissionMode` у `approve-all` і перезапустіть gateway. Див. [Permission configuration](#permission-configuration).     |
| ACP session fails early with little output                                  | Запити на дозволи блокуються `permissionMode`/`nonInteractivePermissions`.      | Перевірте логи gateway на `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для плавної деградації встановіть `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Процес harness завершився, але сесія ACP не повідомила про завершення.          | Відстежуйте через `ps aux \| grep acpx`; вручну завершуйте застарілі процеси.                                                                                     |
