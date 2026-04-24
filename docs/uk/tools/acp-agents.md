---
read_when:
    - Запуск coding harnesses через ACP
    - Налаштування ACP-сеансів, прив’язаних до розмови, у каналах обміну повідомленнями
    - Прив’язка розмови в каналі повідомлень до постійного сеансу ACP
    - Усунення несправностей бекенду ACP і підключення Plugin-ів
    - Налагодження доставки завершень ACP або циклів агент-до-агента
    - Використання команд `/acp` у чаті
summary: Використовуйте сеанси виконання ACP для Claude Code, Cursor, Gemini CLI, явного резервного ACP Codex, ACP OpenClaw та інших агентів harness
title: агенти ACP
x-i18n:
    generated_at: "2026-04-24T15:52:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e453b4b1c58d0705313b6a9d39af4c4f5579575715d06b44b830bf6d001e6bfb
    source_path: tools/acp-agents.md
    workflow: 15
---

Сеанси [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) дають OpenClaw змогу запускати зовнішні coding harnesses (наприклад Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI та інші підтримувані ACPX harnesses) через ACP backend Plugin.

Якщо ви попросите OpenClaw звичайною мовою прив’язати або керувати Codex у поточній розмові, OpenClaw має використати нативний Plugin app-server Codex (`/codex bind`, `/codex threads`, `/codex resume`). Якщо ви просите `/acp`, ACP, acpx або фоновий дочірній сеанс Codex, OpenClaw усе одно може маршрутизувати Codex через ACP. Кожен запуск сеансу ACP відстежується як [фонове завдання](/uk/automation/tasks).

Якщо ви попросите OpenClaw звичайною мовою «запустити Claude Code у thread» або використати інший зовнішній harness, OpenClaw має маршрутизувати цей запит до середовища виконання ACP (а не до нативного середовища виконання sub-agent).

Якщо ви хочете, щоб Codex або Claude Code підключався як зовнішній клієнт MCP безпосередньо
до наявних розмов у каналах OpenClaw, використовуйте [`openclaw mcp serve`](/uk/cli/mcp)
замість ACP.

## Яка сторінка мені потрібна?

Поруч є три поверхні, які легко сплутати:

| Ви хочете...                                                                                   | Використовуйте це                     | Примітки                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Прив’язати або керувати Codex у поточній розмові                                                | `/codex bind`, `/codex threads`       | Нативний шлях app-server Codex; включає прив’язані відповіді в чаті, пересилання зображень, model/fast/permissions, stop і steer controls. ACP — явний резервний варіант |
| Запустити Claude Code, Gemini CLI, явний ACP Codex або інший зовнішній harness _через_ OpenClaw | Ця сторінка: агенти ACP               | Сеанси, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, керування runtime                                         |
| Відкрити сеанс Gateway OpenClaw _як_ ACP-сервер для редактора або клієнта                       | [`openclaw acp`](/uk/cli/acp)            | Режим моста. IDE/клієнт спілкується з OpenClaw через ACP по stdio/WebSocket                                                                                 |
| Повторно використати локальний AI CLI як резервну текстову модель                               | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Без інструментів OpenClaw, без елементів керування ACP, без runtime harness                                                                         |

## Це працює одразу після встановлення?

Зазвичай так. У свіжих встановленнях bundled Plugin runtime `acpx` увімкнено за замовчуванням, із закріпленим локально для Plugin бінарником `acpx`, який OpenClaw перевіряє та самостійно відновлює під час запуску. Виконайте `/acp doctor`, щоб перевірити готовність.

Поширені нюанси першого запуску:

- Адаптери цільового harness (Codex, Claude тощо) можуть завантажуватися за потреби через `npx` під час першого використання.
- Авторизація постачальника для цього harness усе ще має бути налаштована на хості.
- Якщо на хості немає npm або доступу до мережі, завантаження адаптера під час першого запуску завершиться помилкою, доки кеші не буде попередньо прогріто або адаптер не буде встановлено іншим способом.

## Операторський runbook

Швидкий потік `/acp` із чату:

1. **Запуск** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` або явний `/acp spawn codex --bind here`
2. **Працюйте** у прив’язаній розмові або thread (або явно вкажіть ключ сеансу).
3. **Перевірте стан** — `/acp status`
4. **Налаштуйте** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Скоригуйте** без заміни контексту — `/acp steer tighten logging and continue`
6. **Зупиніть** — `/acp cancel` (поточний turn) або `/acp close` (сеанс + прив’язки)

Тригери природною мовою, які мають маршрутизуватися до нативного Plugin Codex:

- «Прив’яжи цей канал Discord до Codex.»
- «Під’єднай цей чат до thread Codex `<id>`.»
- «Покажи threads Codex, а потім прив’яжи цей.»

Нативна прив’язка розмов Codex є типовим шляхом керування чатом. Динамічні інструменти OpenClaw, як і раніше, виконуються через OpenClaw, тоді як нативні інструменти Codex, як-от
shell/apply-patch, виконуються всередині Codex. Для подій нативних інструментів Codex OpenClaw
впроваджує relay нативних hook-ів для кожного turn, щоб hook-и Plugin могли блокувати
`before_tool_call`, спостерігати за `after_tool_call` і маршрутизувати події Codex
`PermissionRequest` через погодження OpenClaw. Relay v1
навмисно консервативний: він не змінює аргументи нативних інструментів Codex,
не переписує записи thread Codex і не контролює фінальні відповіді/Stop hook-и. Використовуйте явний
ACP лише тоді, коли вам потрібна модель runtime/сеансів ACP.

Тригери природною мовою, які мають маршрутизуватися до runtime ACP:

- «Запусти це як одноразовий сеанс Claude Code ACP і підсумуй результат.»
- «Використай Gemini CLI для цього завдання у thread, а потім зберігай подальші звернення в тому самому thread.»
- «Запусти Codex через ACP у фоновому thread.»

OpenClaw вибирає `runtime: "acp"`, визначає `agentId` harness, прив’язується до поточної розмови або thread, коли це підтримується, і маршрутизує подальші звернення до цього сеансу до його закриття або завершення строку дії. Codex переходить цим шляхом лише тоді, коли ACP запитано явно або коли для потрібного фонового runtime усе ще потрібен ACP.

## ACP проти sub-agents

Використовуйте ACP, коли вам потрібен зовнішній runtime harness. Використовуйте нативний app-server Codex для прив’язки/керування розмовами Codex. Використовуйте sub-agents, коли вам потрібні делеговані запуски всередині OpenClaw.

| Область       | Сеанс ACP                              | Запуск sub-agent                    |
| ------------- | -------------------------------------- | ----------------------------------- |
| Runtime       | ACP backend Plugin (наприклад acpx)    | Нативний runtime sub-agent OpenClaw |
| Ключ сеансу   | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`   |
| Основні команди | `/acp ...`                           | `/subagents ...`                    |
| Інструмент запуску | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (runtime за замовчуванням) |

Див. також [Sub-agents](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування сеансами ACP OpenClaw
2. bundled Plugin runtime `acpx`
3. ACP-адаптер Claude
4. Механізм runtime/сеансів на боці Claude

Важливе розрізнення:

- ACP Claude — це сеанс harness із керуванням ACP, відновленням сеансу, відстеженням фонових завдань і необов’язковою прив’язкою до розмови/thread.
- CLI backends — це окремі локальні runtime лише для текстового резервного режиму. Див. [CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- потрібні `/acp spawn`, сеанси з прив’язкою, елементи керування runtime або постійна робота harness: використовуйте ACP
- потрібен простий локальний текстовий резервний режим через сирий CLI: використовуйте CLI backends

## Прив’язані сеанси

### Прив’язки до поточної розмови

`/acp spawn <harness> --bind here` закріплює поточну розмову за створеним сеансом ACP — без дочірнього thread, у тій самій поверхні чату. OpenClaw продовжує відповідати за transport, auth, safety і доставку; подальші повідомлення в цій розмові маршрутизуються до того самого сеансу; `/new` і `/reset` скидають сеанс на місці; `/acp close` знімає прив’язку.

Ментальна модель:

- **поверхня чату** — місце, де люди продовжують спілкуватися (канал Discord, тема Telegram, чат iMessage).
- **сеанс ACP** — стійкий стан runtime Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **дочірній thread/topic** — необов’язкова додаткова поверхня обміну повідомленнями, яка створюється лише через `--thread ...`.
- **робочий простір runtime** — розташування у файловій системі (`cwd`, checkout репозиторію, робочий простір backend), де працює harness. Не залежить від поверхні чату.

Приклади:

- `/codex bind` — залишити цей чат, запустити або приєднати нативний app-server Codex, маршрутизувати сюди майбутні повідомлення.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — налаштувати прив’язаний нативний thread Codex із чату.
- `/codex stop` або `/codex steer focus on the failing tests first` — керувати активним turn нативного Codex.
- `/acp spawn codex --bind here` — явний резервний варіант ACP для Codex.
- `/acp spawn codex --thread auto` — OpenClaw може створити дочірній thread/topic і прив’язати його там.
- `/acp spawn codex --bind here --cwd /workspace/repo` — та сама прив’язка чату, Codex працює в `/workspace/repo`.

Примітки:

- `--bind here` і `--thread ...` взаємовиключні.
- `--bind here` працює лише в каналах, які оголошують підтримку прив’язки до поточної розмови; інакше OpenClaw повертає чітке повідомлення про відсутність підтримки. Прив’язки зберігаються після перезапусків Gateway.
- У Discord `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній thread для `--thread auto|here`, а не для `--bind here`.
- Якщо ви запускаєте інший агент ACP без `--cwd`, OpenClaw за замовчуванням успадковує робочий простір **цільового агента**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) повертаються до стандартного значення backend; інші помилки доступу (наприклад `EACCES`) відображаються як помилки запуску.

### Сеанси, прив’язані до thread

Коли для адаптера каналу ввімкнено прив’язки до thread, сеанси ACP можна прив’язувати до thread:

- OpenClaw прив’язує thread до цільового сеансу ACP.
- Подальші повідомлення в цьому thread маршрутизуються до прив’язаного сеансу ACP.
- Вивід ACP доставляється назад у той самий thread.
- Зняття фокуса/закриття/архівування/завершення часу очікування бездіяльності або завершення максимального строку дії знімає прив’язку.

Підтримка прив’язки до thread залежить від адаптера. Якщо активний адаптер каналу не підтримує прив’язки до thread, OpenClaw повертає чітке повідомлення про відсутність підтримки/недоступність.

Обов’язкові feature flags для ACP, прив’язаного до thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` увімкнено за замовчуванням (встановіть `false`, щоб призупинити диспетчеризацію ACP)
- Увімкнено прапорець запуску ACP thread у адаптері каналу (залежить від адаптера)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Канали з підтримкою thread

- Будь-який адаптер каналу, який надає можливість прив’язки сеансу/thread.
- Поточна вбудована підтримка:
  - threads/channels Discord
  - topics Telegram (теми форуму в групах/supergroups і DM topics)
- Канали Plugin можуть додати підтримку через той самий інтерфейс прив’язки.

## Налаштування для конкретних каналів

Для неепhemeralних робочих процесів налаштовуйте постійні прив’язки ACP у записах верхнього рівня `bindings[]`.

### Модель прив’язки

- `bindings[].type="acp"` позначає постійну прив’язку розмови ACP.
- `bindings[].match` визначає цільову розмову:
  - Канал або thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Тема форуму Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - DM/груповий чат BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних групових прив’язок віддавайте перевагу `chat_id:*` або `chat_identifier:*`.
  - DM/груповий чат iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних групових прив’язок віддавайте перевагу `chat_id:*`.
- `bindings[].agentId` — це id агента OpenClaw-власника.
- Необов’язкові перевизначення ACP розміщуються в `bindings[].acp`:
  - `mode` (`persistent` або `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Значення runtime за замовчуванням для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити типові значення ACP для кожного агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Порядок пріоритету перевизначень для прив’язаних сеансів ACP:

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

- OpenClaw забезпечує існування налаштованого сеансу ACP перед використанням.
- Повідомлення в цьому каналі або topic маршрутизуються до налаштованого сеансу ACP.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ сеансу ACP на місці.
- Тимчасові прив’язки runtime (наприклад, створені потоками thread-focus) усе ще застосовуються там, де вони присутні.
- Для міжагентних запусків ACP без явного `cwd` OpenClaw успадковує робочий простір цільового агента з конфігурації агента.
- Відсутні успадковані шляхи робочого простору повертаються до стандартного `cwd` backend; помилки доступу за наявного шляху відображаються як помилки запуску.

## Запуск сеансів ACP (інтерфейси)

### Із `sessions_spawn`

Використовуйте `runtime: "acp"` для запуску сеансу ACP з turn агента або виклику інструмента.

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

- Типовим значенням `runtime` є `subagent`, тому для сеансів ACP явно вказуйте `runtime: "acp"`.
- Якщо `agentId` пропущено, OpenClaw використовує `acp.defaultAgent`, якщо його налаштовано.
- `mode: "session"` вимагає `thread: true`, щоб зберігати постійну прив’язану розмову.

Докладніше про інтерфейс:

- `task` (обов’язково): початковий prompt, надісланий до сеансу ACP.
- `runtime` (обов’язково для ACP): має бути `"acp"`.
- `agentId` (необов’язково): id цільового harness ACP. Якщо задано, використовується `acp.defaultAgent`.
- `thread` (необов’язково, типово `false`): запит потоку прив’язки до thread, якщо підтримується.
- `mode` (необов’язково): `run` (одноразовий запуск) або `session` (постійний).
  - типове значення — `run`
  - якщо `thread: true` і mode не вказано, OpenClaw може типово використовувати постійну поведінку залежно від шляху runtime
  - `mode: "session"` вимагає `thread: true`
- `cwd` (необов’язково): запитуваний робочий каталог runtime (перевіряється політикою backend/runtime). Якщо пропущено, запуск ACP успадковує робочий простір цільового агента, якщо його налаштовано; відсутні успадковані шляхи повертаються до типових значень backend, а реальні помилки доступу повертаються.
- `label` (необов’язково): операторська мітка, що використовується в тексті сеансу/банера.
- `resumeSessionId` (необов’язково): відновити наявний сеанс ACP замість створення нового. Агент відтворює історію своєї розмови через `session/load`. Вимагає `runtime: "acp"`.
- `streamTo` (необов’язково): `"parent"` транслює зведення прогресу початкового запуску ACP назад до сеансу-запитувача як системні події.
  - Якщо доступно, прийняті відповіді включають `streamLogPath`, що вказує на JSONL-журнал у межах сеансу (`<sessionId>.acp-stream.jsonl`), який можна переглядати для повної історії relay.
- `model` (необов’язково): явне перевизначення model для дочірнього сеансу ACP. Використовується для `runtime: "acp"`, щоб дочірній сеанс використовував запитану model замість тихого повернення до типового значення цільового агента.

## Модель доставки

Сеанси ACP можуть бути або інтерактивними робочими просторами, або фоновою роботою, що належить батьківському процесу. Шлях доставки залежить від цієї форми.

### Інтерактивні сеанси ACP

Інтерактивні сеанси призначені для продовження спілкування на видимій поверхні чату:

- `/acp spawn ... --bind here` прив’язує поточну розмову до сеансу ACP.
- `/acp spawn ... --thread ...` прив’язує thread/topic каналу до сеансу ACP.
- Постійні налаштовані `bindings[].type="acp"` маршрутизують відповідні розмови до того самого сеансу ACP.

Подальші повідомлення в прив’язаній розмові маршрутизуються безпосередньо до сеансу ACP, а вивід ACP доставляється назад у той самий канал/thread/topic.

### Одноразові сеанси ACP, що належать батьківському процесу

Одноразові сеанси ACP, запущені іншим агентом, є фоновими дочірніми процесами, подібно до sub-agents:

- Батьківський процес запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Дочірній процес працює у власному сеансі harness ACP.
- Завершення повертається через внутрішній шлях оголошення завершення завдання.
- Батьківський процес переписує результат дочірнього процесу у звичайному голосі помічника, коли потрібна відповідь для користувача.

Не розглядайте цей шлях як peer-to-peer чат між батьківським і дочірнім процесами. Дочірній процес уже має канал завершення назад до батьківського процесу.

### `sessions_send` і доставка A2A

`sessions_send` може бути націлено на інший сеанс після запуску. Для звичайних peer-сеансів OpenClaw використовує шлях подальших дій agent-to-agent (A2A) після впровадження повідомлення:

- очікує відповіді цільового сеансу
- за потреби дозволяє запитувачу та цілі обмінятися обмеженою кількістю додаткових turn-ів
- просить цільовий сеанс створити повідомлення-оголошення
- доставляє це оголошення у видимий канал або thread

Цей шлях A2A є резервним варіантом для peer-надсилань, коли відправнику потрібна видима подальша дія. Він залишається увімкненим, коли непов’язаний сеанс може бачити й надсилати повідомлення ACP-цілі, наприклад за широких налаштувань `tools.sessions.visibility`.

OpenClaw пропускає подальшу дію A2A лише тоді, коли запитувач є батьківським процесом власного одноразового дочірнього процесу ACP. У такому разі запуск A2A поверх завершення завдання може пробудити батьківський процес результатом дочірнього, переслати відповідь батьківського процесу назад у дочірній і створити цикл echo між батьківським і дочірнім процесами. Результат `sessions_send` повідомляє `delivery.status="skipped"` для такого випадку власного дочірнього процесу, оскільки за результат уже відповідає шлях завершення.

### Відновлення наявного сеансу

Використовуйте `resumeSessionId`, щоб продовжити попередній сеанс ACP замість запуску з нуля. Агент відтворює історію своєї розмови через `session/load`, тому продовжує з повним контекстом попередньої роботи.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Поширені варіанти використання:

- Передати сеанс Codex з ноутбука на телефон — попросіть свого агента продовжити з того місця, де ви зупинилися
- Продовжити coding session, який ви почали інтерактивно в CLI, тепер у безголовому режимі через агента
- Продовжити роботу, яку перервав перезапуск gateway або idle timeout

Примітки:

- `resumeSessionId` вимагає `runtime: "acp"` — повертає помилку, якщо використовується з runtime sub-agent.
- `resumeSessionId` відновлює історію розмови upstream ACP; `thread` і `mode` усе ще звичайно застосовуються до нового сеансу OpenClaw, який ви створюєте, тому `mode: "session"` усе ще вимагає `thread: true`.
- Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
- Якщо id сеансу не знайдено, запуск завершується з чіткою помилкою — без тихого повернення до нового сеансу.

<Accordion title="Smoke-тест після розгортання">

Після розгортання gateway виконайте повну живу перевірку, а не покладайтеся лише на unit-тести:

1. Перевірте версію та commit розгорнутого gateway на цільовому хості.
2. Відкрийте тимчасовий bridge-сеанс ACPX до живого агента.
3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Переконайтеся, що є `accepted=yes`, реальний `childSessionKey` і немає помилки validator.
5. Очистьте тимчасовий bridge-сеанс.

Для цієї перевірки використовуйте `mode: "run"` і пропускайте `streamTo: "parent"` — шляхи `mode: "session"`, прив’язані до thread, і relay потоку є окремими, багатшими інтеграційними проходами.

</Accordion>

## Сумісність із sandbox

Наразі сеанси ACP працюють у runtime хоста, а не всередині sandbox OpenClaw.

Поточні обмеження:

- Якщо сеанс-запитувач працює в sandbox, запуски ACP блокуються як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
  - Помилка: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.
  - Помилка: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Використовуйте `runtime: "subagent"`, коли вам потрібне виконання з примусовим застосуванням sandbox.

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

## Визначення цілі сеансу

Більшість дій `/acp` приймають необов’язкову ціль сеансу (`session-key`, `session-id` або `session-label`).

Порядок визначення:

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує ключ
   - потім session id у форматі UUID
   - потім label
2. Поточна прив’язка thread (якщо ця розмова/thread прив’язана до сеансу ACP)
3. Резервний варіант із поточним сеансом запитувача

Прив’язки до поточної розмови й прив’язки до thread беруть участь у кроці 2.

Якщо ціль не вдається визначити, OpenClaw повертає чітку помилку (`Unable to resolve session target: ...`).

## Режими прив’язки під час запуску

`/acp spawn` підтримує `--bind here|off`.

| Режим | Поведінка                                                              |
| ------ | --------------------------------------------------------------------- |
| `here` | Прив’язати поточну активну розмову на місці; завершитися помилкою, якщо активної немає. |
| `off`  | Не створювати прив’язку до поточної розмови.                          |

Примітки:

- `--bind here` — це найпростіший шлях для оператора для сценарію «зробити цей канал або чат підключеним до Codex».
- `--bind here` не створює дочірній thread.
- `--bind here` доступний лише в каналах, що підтримують прив’язку до поточної розмови.
- `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

## Режими thread під час запуску

`/acp spawn` підтримує `--thread auto|here|off`.

| Режим | Поведінка                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | В активному thread: прив’язати цей thread. Поза thread: створити/прив’язати дочірній thread, якщо підтримується. |
| `here` | Вимагати поточний активний thread; завершитися помилкою, якщо ви не в ньому.                       |
| `off`  | Без прив’язки. Сеанс запускається без прив’язки.                                                    |

Примітки:

- На поверхнях без прив’язки до thread типовою поведінкою фактично є `off`.
- Запуск із прив’язкою до thread вимагає підтримки політики каналу:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Використовуйте `--bind here`, якщо хочете закріпити поточну розмову без створення дочірнього thread.

## Керування ACP

| Команда              | Що вона робить                                            | Приклад                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створює сеанс ACP; необов’язкова поточна прив’язка або прив’язка до thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасовує turn у процесі виконання для цільового сеансу.   | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надсилає інструкцію steer до запущеного сеансу.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закриває сеанс і знімає прив’язку з цільових thread.      | `/acp close`                                                  |
| `/acp status`        | Показує backend, режим, стан, параметри runtime, можливості. | `/acp status`                                                 |
| `/acp set-mode`      | Встановлює режим runtime для цільового сеансу.            | `/acp set-mode plan`                                          |
| `/acp set`           | Загальний запис параметра конфігурації runtime.           | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Встановлює перевизначення робочого каталогу runtime.      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Встановлює профіль політики погодження.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Встановлює timeout runtime (у секундах).                  | `/acp timeout 120`                                            |
| `/acp model`         | Встановлює перевизначення model runtime.                  | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видаляє перевизначення параметрів runtime для сеансу.     | `/acp reset-options`                                          |
| `/acp sessions`      | Перелічує нещодавні сеанси ACP зі сховища.                | `/acp sessions`                                               |
| `/acp doctor`        | Стан backend, можливості, дієві способи виправлення.      | `/acp doctor`                                                 |
| `/acp install`       | Виводить детерміновані кроки встановлення й увімкнення.   | `/acp install`                                                |

`/acp status` показує ефективні параметри runtime, а також ідентифікатори сеансу на рівні runtime і backend. Помилки непідтримуваних елементів керування відображаються чітко, якщо backend не має відповідної можливості. `/acp sessions` читає сховище для поточного прив’язаного сеансу або сеансу запитувача; цільові токени (`session-key`, `session-id` або `session-label`) визначаються через виявлення сеансів gateway, включно з користувацькими коренями `session.store` для окремих агентів.

## Відображення параметрів runtime

`/acp` має зручні команди та загальний setter.

Еквівалентні операції:

- `/acp model <id>` відображається на ключ конфігурації runtime `model`.
- `/acp permissions <profile>` відображається на ключ конфігурації runtime `approval_policy`.
- `/acp timeout <seconds>` відображається на ключ конфігурації runtime `timeout`.
- `/acp cwd <path>` напряму оновлює перевизначення cwd runtime.
- `/acp set <key> <value>` — це загальний шлях.
  - Спеціальний випадок: `key=cwd` використовує шлях перевизначення cwd.
- `/acp reset-options` очищає всі перевизначення runtime для цільового сеансу.

## acpx harness, налаштування Plugin, і permissions

Щоб налаштувати acpx harness (аліаси Claude Code / Codex / Gemini CLI),
мости MCP plugin-tools і OpenClaw-tools, а також режими permissions ACP, див.
[Агенти ACP — налаштування](/uk/tools/acp-agents-setup).

## Усунення несправностей

| Симптом                                                                     | Імовірна причина                                                                | Виправлення                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend Plugin відсутній або вимкнений.                                         | Установіть і ввімкніть Plugin backend, потім виконайте `/acp doctor`.                                                                                                      |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                         | Встановіть `acp.enabled=true`.                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Диспетчеризацію зі звичайних повідомлень thread вимкнено.                       | Встановіть `acp.dispatch.enabled=true`.                                                                                                                                     |
| `ACP agent "<id>" is not allowed by policy`                                 | Агент відсутній у списку дозволених.                                            | Використовуйте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                       |
| `Unable to resolve session target: ...`                                     | Неправильний токен key/id/label.                                                | Виконайте `/acp sessions`, скопіюйте точний key/label і повторіть спробу.                                                                                                  |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної розмови, яку можна прив’язати.           | Перейдіть у цільовий чат/канал і повторіть спробу або використайте запуск без прив’язки.                                                                                   |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не підтримує можливість ACP-прив’язки до поточної розмови.              | Використовуйте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте верхньорівневі `bindings[]` або перейдіть до підтримуваного каналу.                        |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом thread.                             | Перейдіть у цільовий thread або використайте `--thread auto`/`off`.                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє поточною ціллю прив’язки.                              | Повторно прив’яжіть як власник або використайте іншу розмову чи thread.                                                                                                     |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не підтримує можливість прив’язки до thread.                            | Використовуйте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                             |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime працює на боці хоста; сеанс запитувача виконується в sandbox.       | Використовуйте `runtime="subagent"` із сеансів у sandbox або запускайте ACP із сеансу поза sandbox.                                                                       |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для runtime ACP запитано `sandbox="require"`.                                   | Використовуйте `runtime="subagent"` для обов’язкового sandbox або використовуйте ACP із `sandbox="inherit"` із сеансу поза sandbox.                                       |
| Missing ACP metadata for bound session                                      | Застарілі/видалені метадані сеансу ACP.                                         | Створіть заново через `/acp spawn`, потім повторно прив’яжіть/focus thread.                                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує запис/виконання в неінтерактивному сеансі ACP.          | Встановіть `plugins.entries.acpx.config.permissionMode` у `approve-all` і перезапустіть gateway. Див. [Налаштування permissions](/uk/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Запити permissions блокуються через `permissionMode`/`nonInteractivePermissions`. | Перевірте журнали gateway на `AcpRuntimeError`. Для повних permissions встановіть `permissionMode=approve-all`; для плавної деградації встановіть `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Процес harness завершився, але сеанс ACP не повідомив про завершення.           | Відстежуйте через `ps aux \| grep acpx`; вручну завершіть застарілі процеси.                                                                                                |

## Пов’язані сторінки

- [Sub-agents](/uk/tools/subagents)
- [Multi-agent sandbox tools](/uk/tools/multi-agent-sandbox-tools)
- [Agent send](/uk/tools/agent-send)
