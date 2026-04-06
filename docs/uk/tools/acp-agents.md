---
read_when:
    - Запуск coding harness через ACP
    - Налаштування ACP-сеансів, прив’язаних до розмови, у каналах обміну повідомленнями
    - Прив’язка розмови в каналі повідомлень до постійного ACP-сеансу
    - Усунення неполадок бекенду ACP і обв’язки плагіна
    - Керування командами /acp із чату
summary: Використовуйте сеанси середовища виконання ACP для Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP та інших harness-агентів
title: ACP Agents
x-i18n:
    generated_at: "2026-04-06T12:47:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb651ab39b05e537398623ee06cb952a5a07730fc75d3f7e0de20dd3128e72c6
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP-агенти

Сеанси [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) дають OpenClaw змогу запускати зовнішні coding harness (наприклад Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI та інші підтримувані ACPX harness) через плагін ACP-бекенду.

Якщо ви просите OpenClaw звичайною мовою «запусти це в Codex» або «запусти Claude Code у треді», OpenClaw має спрямувати цей запит до середовища виконання ACP (а не до власного середовища виконання sub-agent). Кожен запуск ACP-сеансу відстежується як [фонове завдання](/uk/automation/tasks).

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній MCP-клієнт безпосередньо
до наявних розмов у каналах OpenClaw, використовуйте
[`openclaw mcp serve`](/cli/mcp) замість ACP.

## Яка сторінка мені потрібна?

Поруч є три поверхні, які легко сплутати:

| You want to...                                                                     | Use this                              | Notes                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Запускати Codex, Claude Code, Gemini CLI або інший зовнішній harness _через_ OpenClaw | Ця сторінка: ACP Agents               | Сеанси, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, елементи керування runtime |
| Відкрити сеанс OpenClaw Gateway _як_ ACP-сервер для редактора або клієнта          | [`openclaw acp`](/cli/acp)            | Режим bridge. IDE/клієнт спілкується з OpenClaw через ACP по stdio/WebSocket                                |
| Повторно використовувати локальний AI CLI як лише текстову резервну модель         | [CLI Backends](/gateway/cli-backends) | Це не ACP. Немає інструментів OpenClaw, немає елементів керування ACP, немає середовища виконання harness  |

## Чи працює це одразу після встановлення?

Зазвичай так.

- Нові встановлення тепер постачаються з увімкненим за замовчуванням вбудованим плагіном середовища виконання `acpx`.
- Вбудований плагін `acpx` віддає перевагу власному зафіксованому бінарнику `acpx`, локальному для плагіна.
- Під час запуску OpenClaw перевіряє цей бінарник і за потреби самостійно відновлює його.
- Почніть із `/acp doctor`, якщо хочете швидко перевірити готовність.

Що все ще може трапитися під час першого використання:

- Цільовий адаптер harness може бути завантажений за потреби через `npx` під час першого використання цього harness.
- На хості все одно має бути налаштована вендорна автентифікація для цього harness.
- Якщо хост не має доступу до npm/мережі, завантаження адаптерів під час першого запуску може завершитися невдачею, доки кеші не будуть прогріті або адаптер не буде встановлено іншим способом.

Приклади:

- `/acp spawn codex`: OpenClaw має бути готовий завантажити `acpx`, але адаптер Codex ACP все ще може потребувати першого завантаження.
- `/acp spawn claude`: аналогічно для адаптера Claude ACP, плюс автентифікація на боці Claude на цьому хості.

## Швидкий операторський сценарій

Використовуйте це, якщо вам потрібен практичний runbook для `/acp`:

1. Створіть сеанс:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Працюйте у прив’язаній розмові або треді (або явно вкажіть ключ цього сеансу).
3. Перевірте стан середовища виконання:
   - `/acp status`
4. За потреби налаштуйте параметри середовища виконання:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Скоригуйте активний сеанс, не замінюючи контекст:
   - `/acp steer tighten logging and continue`
6. Зупиніть роботу:
   - `/acp cancel` (зупинити поточний хід), або
   - `/acp close` (закрити сеанс + видалити прив’язки)

## Швидкий старт для людей

Приклади природних запитів:

- «Прив’яжи цей Discord-канал до Codex».
- «Запусти тут постійний сеанс Codex у треді та тримай його сфокусованим».
- «Запусти це як одноразовий ACP-сеанс Claude Code і підсумуй результат».
- «Прив’яжи цей чат iMessage до Codex і зберігай наступні звернення в тому самому workspace».
- «Використай Gemini CLI для цього завдання в треді, а потім зберігай наступні звернення в тому самому треді».

Що має зробити OpenClaw:

1. Вибрати `runtime: "acp"`.
2. Визначити запитану ціль harness (`agentId`, наприклад `codex`).
3. Якщо запитано прив’язку до поточної розмови і активний канал це підтримує, прив’язати ACP-сеанс до цієї розмови.
4. Інакше, якщо запитано прив’язку до треда і поточний канал це підтримує, прив’язати ACP-сеанс до треда.
5. Маршрутизувати наступні прив’язані повідомлення до того самого ACP-сеансу, доки його не буде розфокусовано/закрито/прострочено.

## ACP проти sub-agents

Використовуйте ACP, коли вам потрібне зовнішнє середовище виконання harness. Використовуйте sub-agents, коли вам потрібні делеговані запуски, власні для OpenClaw.

| Area          | ACP session                           | Sub-agent run                            |
| ------------- | ------------------------------------- | ---------------------------------------- |
| Runtime       | Плагін ACP-бекенду (наприклад acpx)   | Власне середовище виконання sub-agent OpenClaw |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`        |
| Main commands | `/acp ...`                            | `/subagents ...`                         |
| Spawn tool    | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn` (runtime за замовчуванням) |

Дивіться також [Sub-agents](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Керувальна площина ACP-сеансів OpenClaw
2. вбудований плагін середовища виконання `acpx`
3. адаптер Claude ACP
4. механізм runtime/session на боці Claude

Важлива відмінність:

- ACP Claude — це сеанс harness з елементами керування ACP, відновленням сеансу, відстеженням фонових завдань і необов’язковою прив’язкою до розмови/треда.
- CLI-бекенди — це окремі локальні резервні середовища виконання лише для тексту. Дивіться [CLI Backends](/gateway/cli-backends).

Для операторів практичне правило таке:

- потрібні `/acp spawn`, сеанси з прив’язкою, елементи керування runtime або постійна робота harness: використовуйте ACP
- потрібен простий локальний резервний текстовий шлях через сирий CLI: використовуйте CLI-бекенди

## Прив’язані сеанси

### Прив’язки до поточної розмови

Використовуйте `/acp spawn <harness> --bind here`, коли хочете, щоб поточна розмова стала довготривалим ACP-workspace без створення дочірнього треда.

Поведінка:

- OpenClaw продовжує керувати транспортом каналу, автентифікацією, безпекою та доставкою.
- Поточна розмова закріплюється за ключем створеного ACP-сеансу.
- Наступні повідомлення в цій розмові маршрутизуються до того самого ACP-сеансу.
- `/new` і `/reset` скидають той самий прив’язаний ACP-сеанс на місці.
- `/acp close` закриває сеанс і видаляє прив’язку до поточної розмови.

Що це означає на практиці:

- `--bind here` зберігає ту саму поверхню чату. У Discord поточний канал залишається поточним каналом.
- `--bind here` все ще може створити новий ACP-сеанс, якщо ви запускаєте нову роботу.
- `--bind here` сам по собі не створює дочірній Discord-тред або тему Telegram.
- Середовище виконання ACP все ще може мати власний робочий каталог (`cwd`) або workspace на диску, керований бекендом. Цей workspace runtime відокремлений від поверхні чату і не означає створення нового треда повідомлень.
- Якщо ви запускаєте інший ACP-агент і не передаєте `--cwd`, OpenClaw типово успадковує workspace **цільового агента**, а не агента-запитувача.
- Якщо цей успадкований шлях до workspace відсутній (`ENOENT`/`ENOTDIR`), OpenClaw повертається до типового `cwd` бекенду замість того, щоб мовчки повторно використовувати неправильне дерево.
- Якщо успадкований workspace існує, але до нього немає доступу (наприклад `EACCES`), spawn повертає реальну помилку доступу замість пропуску `cwd`.

Ментальна модель:

- поверхня чату: де люди продовжують спілкуватися (`Discord channel`, `Telegram topic`, `iMessage chat`)
- ACP-сеанс: довготривалий стан runtime Codex/Claude/Gemini, до якого маршрутизує OpenClaw
- дочірній тред/тема: необов’язкова додаткова поверхня повідомлень, що створюється лише через `--thread ...`
- workspace runtime: розташування у файловій системі, де працює harness (`cwd`, checkout репозиторію, workspace бекенду)

Приклади:

- `/acp spawn codex --bind here`: залишити цей чат, створити або під’єднати сеанс Codex ACP і маршрутизувати сюди майбутні повідомлення
- `/acp spawn codex --thread auto`: OpenClaw може створити дочірній тред/тему і прив’язати там ACP-сеанс
- `/acp spawn codex --bind here --cwd /workspace/repo`: така сама прив’язка до чату, як вище, але Codex працює в `/workspace/repo`

Підтримка прив’язки до поточної розмови:

- Канали чату/повідомлень, які оголошують підтримку прив’язки до поточної розмови, можуть використовувати `--bind here` через спільний шлях прив’язки розмов.
- Канали з власною семантикою тредів/тем усе ще можуть надавати канонізацію, специфічну для каналу, через той самий спільний інтерфейс.
- `--bind here` завжди означає «прив’язати поточну розмову на місці».
- Загальні прив’язки до поточної розмови використовують спільне сховище прив’язок OpenClaw і переживають звичайні перезапуски gateway.

Примітки:

- `--bind here` і `--thread ...` взаємовиключні у `/acp spawn`.
- У Discord `--bind here` прив’язує поточний канал або тред на місці. `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній тред для `--thread auto|here`.
- Якщо активний канал не надає ACP-прив’язок до поточної розмови, OpenClaw повертає чітке повідомлення про непідтримуваність.
- `resume` і питання «новий сеанс» — це питання ACP-сеансу, а не каналу. Ви можете повторно використовувати або замінювати стан runtime без зміни поточної поверхні чату.

### Сеанси, прив’язані до тредів

Коли для адаптера каналу увімкнено прив’язки до тредів, ACP-сеанси можна прив’язувати до тредів:

- OpenClaw прив’язує тред до цільового ACP-сеансу.
- Наступні повідомлення в цьому треді маршрутизуються до прив’язаного ACP-сеансу.
- Вивід ACP доставляється назад у той самий тред.
- Розфокусування/закриття/архівація/тайм-аут бездіяльності або завершення максимального віку видаляє прив’язку.

Підтримка прив’язки до тредів залежить від адаптера. Якщо активний адаптер каналу не підтримує прив’язки до тредів, OpenClaw повертає чітке повідомлення про непідтримуваність/недоступність.

Потрібні feature flags для ACP, прив’язаного до тредів:

- `acp.enabled=true`
- `acp.dispatch.enabled` увімкнено за замовчуванням (задайте `false`, щоб призупинити ACP-dispatch)
- Увімкнено прапорець spawn ACP-сеансів для тредів адаптера каналу (залежить від адаптера)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Канали з підтримкою тредів

- Будь-який адаптер каналу, який надає можливість прив’язки сеансу/треда.
- Поточна вбудована підтримка:
  - Discord threads/channels
  - Telegram topics (теми форуму в групах/supergroups і DM topics)
- Канали плагінів можуть додавати підтримку через той самий інтерфейс прив’язки.

## Налаштування для конкретних каналів

Для неепізодичних workflow налаштовуйте постійні ACP-прив’язки у верхньорівневих записах `bindings[]`.

### Модель прив’язки

- `bindings[].type="acp"` позначає постійну ACP-прив’язку до розмови.
- `bindings[].match` визначає цільову розмову:
  - Discord channel or thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/group chat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних групових прив’язок надавайте перевагу `chat_id:*` або `chat_identifier:*`.
  - iMessage DM/group chat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Для стабільних групових прив’язок надавайте перевагу `chat_id:*`.
- `bindings[].agentId` — це id агента OpenClaw-власника.
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

Пріоритет перевизначень для прив’язаних ACP-сеансів:

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

- OpenClaw гарантує, що налаштований ACP-сеанс існує до використання.
- Повідомлення в цьому каналі або темі маршрутизуються до налаштованого ACP-сеансу.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ ACP-сеансу на місці.
- Тимчасові прив’язки runtime (наприклад створені потоками фокусування на треді) усе ще застосовуються там, де вони присутні.
- Для міжагентних ACP-запусків без явного `cwd` OpenClaw успадковує workspace цільового агента з конфігурації агента.
- Відсутні успадковані шляхи до workspace повертаються до типового `cwd` бекенду; помилки доступу для наявних шляхів повертаються як помилки spawn.

## Запуск ACP-сеансів (інтерфейси)

### Із `sessions_spawn`

Використовуйте `runtime: "acp"`, щоб запустити ACP-сеанс із ходу агента або виклику інструмента.

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

- `runtime` типово дорівнює `subagent`, тому для ACP-сеансів явно задавайте `runtime: "acp"`.
- Якщо `agentId` пропущено, OpenClaw використовує `acp.defaultAgent`, якщо його налаштовано.
- `mode: "session"` вимагає `thread: true`, щоб зберегти постійну прив’язану розмову.

Подробиці інтерфейсу:

- `task` (обов’язково): початковий prompt, надісланий ACP-сеансу.
- `runtime` (обов’язково для ACP): має бути `"acp"`.
- `agentId` (необов’язково): id цільового ACP-harness. Якщо задано, використовується `acp.defaultAgent`.
- `thread` (необов’язково, типово `false`): запитати потік прив’язки до треда, де це підтримується.
- `mode` (необов’язково): `run` (одноразово) або `session` (постійно).
  - типове значення — `run`
  - якщо `thread: true` і mode пропущено, OpenClaw може типово вибрати постійну поведінку залежно від шляху runtime
  - `mode: "session"` вимагає `thread: true`
- `cwd` (необов’язково): запитаний робочий каталог runtime (валідується політикою бекенду/runtime). Якщо пропущено, ACP spawn успадковує workspace цільового агента, коли його налаштовано; відсутні успадковані шляхи повертаються до типових значень бекенду, а реальні помилки доступу повертаються.
- `label` (необов’язково): операторська мітка, яка використовується в тексті сеансу/банера.
- `resumeSessionId` (необов’язково): відновити наявний ACP-сеанс замість створення нового. Агент відтворює свою історію розмов через `session/load`. Вимагає `runtime: "acp"`.
- `streamTo` (необов’язково): `"parent"` транслює зведення прогресу початкового ACP-запуску назад до сеансу-запитувача як системні події.
  - Якщо доступно, допустимі відповіді включають `streamLogPath`, що вказує на JSONL-журнал у межах сеансу (`<sessionId>.acp-stream.jsonl`), який можна відстежувати для повної історії ретрансляції.

### Відновлення наявного сеансу

Використовуйте `resumeSessionId`, щоб продовжити попередній ACP-сеанс замість створення нового. Агент відтворює свою історію розмов через `session/load`, тож продовжує роботу з повним контекстом попереднього.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Поширені сценарії використання:

- Передати сеанс Codex із ноутбука на телефон — попросіть агента продовжити там, де ви зупинилися
- Продовжити coding-сеанс, який ви почали інтерактивно в CLI, а тепер запускаєте безголово через агента
- Підхопити роботу, яку перервав перезапуск gateway або тайм-аут бездіяльності

Примітки:

- `resumeSessionId` вимагає `runtime: "acp"` — повертає помилку, якщо використовується із середовищем виконання sub-agent.
- `resumeSessionId` відновлює історію розмови upstream ACP; `thread` і `mode` усе ще застосовуються звичайним чином до нового сеансу OpenClaw, який ви створюєте, тому `mode: "session"` усе ще вимагає `thread: true`.
- Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
- Якщо id сеансу не знайдено, spawn завершується чіткою помилкою — без тихого переходу до нового сеансу.

### Операторський smoke test

Використовуйте це після розгортання gateway, коли хочете швидко перевірити вживу, що ACP spawn
справді працює наскрізно, а не просто проходить unit-тести.

Рекомендований gate:

1. Перевірте версію/коміт розгорнутого gateway на цільовому хості.
2. Підтвердьте, що розгорнуте джерело містить прийняття lineage ACP у
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Відкрийте тимчасовий bridge-сеанс ACPX до живого агента (наприклад
   `razor(main)` на `jpclawhq`).
4. Попросіть цього агента викликати `sessions_spawn` з:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Переконайтеся, що агент повідомляє:
   - `accepted=yes`
   - реальний `childSessionKey`
   - відсутність помилки валідатора
6. Приберіть тимчасовий bridge-сеанс ACPX.

Приклад prompt для живого агента:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Примітки:

- Залишайте цей smoke test у режимі `mode: "run"`, якщо лише ви не тестуєте навмисно
  постійні ACP-сеанси, прив’язані до тредів.
- Не вимагайте `streamTo: "parent"` для базового gate. Цей шлях залежить від
  можливостей запитувача/сеансу і є окремою інтеграційною перевіркою.
- Розглядайте тестування `mode: "session"`, прив’язаного до треда, як другий, багатший інтеграційний
  прохід із реального Discord-треда або Telegram topic.

## Сумісність із sandbox

ACP-сеанси наразі працюють у runtime хоста, а не всередині sandbox OpenClaw.

Поточні обмеження:

- Якщо сеанс-запитувач sandboxed, ACP-запуски блокуються як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
  - Помилка: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` із `runtime: "acp"` не підтримує `sandbox: "require"`.
  - Помилка: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Використовуйте `runtime: "subagent"`, коли вам потрібне виконання, примусово обмежене sandbox.

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

Дивіться [Slash Commands](/uk/tools/slash-commands).

## Визначення цілі сеансу

Більшість дій `/acp` приймають необов’язкову ціль сеансу (`session-key`, `session-id` або `session-label`).

Порядок визначення:

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує key
   - потім session id у форматі UUID
   - потім label
2. Поточна прив’язка треда (якщо ця розмова/тред прив’язані до ACP-сеансу)
3. Резервний варіант — поточний сеанс запитувача

І прив’язки до поточної розмови, і прив’язки до треда беруть участь у кроці 2.

Якщо ціль не вдається визначити, OpenClaw повертає чітку помилку (`Unable to resolve session target: ...`).

## Режими прив’язки spawn

`/acp spawn` підтримує `--bind here|off`.

| Mode   | Behavior                                                            |
| ------ | ------------------------------------------------------------------- |
| `here` | Прив’язати поточну активну розмову на місці; завершити помилкою, якщо активної немає. |
| `off`  | Не створювати прив’язку до поточної розмови.                        |

Примітки:

- `--bind here` — найпростіший операторський шлях для сценарію «зроби цей канал або чат з підтримкою Codex».
- `--bind here` не створює дочірній тред.
- `--bind here` доступний лише в каналах, які надають підтримку прив’язки до поточної розмови.
- `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

## Режими тредів spawn

`/acp spawn` підтримує `--thread auto|here|off`.

| Mode   | Behavior                                                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------- |
| `auto` | У активному треді: прив’язати цей тред. Поза тредом: створити/прив’язати дочірній тред, якщо це підтримується. |
| `here` | Вимагати поточний активний тред; завершити помилкою, якщо ви не в треді.                                  |
| `off`  | Без прив’язки. Сеанс запускається без прив’язки.                                                           |

Примітки:

- На поверхнях без прив’язки до тредів типова поведінка фактично дорівнює `off`.
- Spawn із прив’язкою до треда потребує підтримки політики каналу:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Використовуйте `--bind here`, якщо хочете закріпити поточну розмову без створення дочірнього треда.

## Елементи керування ACP

Доступне сімейство команд:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` показує ефективні параметри runtime і, коли доступно, ідентифікатори сеансу як на рівні runtime, так і на рівні бекенду.

Деякі елементи керування залежать від можливостей бекенду. Якщо бекенд не підтримує певний елемент керування, OpenClaw повертає чітку помилку unsupported-control.

## Кулінарна книга команд ACP

| Command              | What it does                                         | Example                                                       |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створити ACP-сеанс; необов’язкова поточна прив’язка або прив’язка до треда. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасувати хід у процесі для цільового сеансу.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надіслати інструкцію steer до запущеного сеансу.     | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закрити сеанс і відв’язати цілі тредів.              | `/acp close`                                                  |
| `/acp status`        | Показати бекенд, режим, стан, параметри runtime, можливості. | `/acp status`                                                 |
| `/acp set-mode`      | Задати режим runtime для цільового сеансу.           | `/acp set-mode plan`                                          |
| `/acp set`           | Загальний запис параметра конфігурації runtime.      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Задати перевизначення робочого каталогу runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Задати профіль політики затвердження.                | `/acp permissions strict`                                     |
| `/acp timeout`       | Задати тайм-аут runtime (секунди).                   | `/acp timeout 120`                                            |
| `/acp model`         | Задати перевизначення моделі runtime.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видалити перевизначення параметрів runtime сеансу.   | `/acp reset-options`                                          |
| `/acp sessions`      | Показати список нещодавніх ACP-сеансів зі сховища.   | `/acp sessions`                                               |
| `/acp doctor`        | Стан здоров’я бекенду, можливості, дієві виправлення. | `/acp doctor`                                                 |
| `/acp install`       | Вивести детерміновані кроки встановлення та увімкнення. | `/acp install`                                                |

`/acp sessions` читає сховище для поточного прив’язаного сеансу або сеансу запитувача. Команди, які приймають токени `session-key`, `session-id` або `session-label`, визначають цілі через виявлення сеансів gateway, включно з користувацькими коренями `session.store` для окремих агентів.

## Відображення параметрів runtime

`/acp` має зручні команди і загальний setter.

Еквівалентні операції:

- `/acp model <id>` відповідає ключу конфігурації runtime `model`.
- `/acp permissions <profile>` відповідає ключу конфігурації runtime `approval_policy`.
- `/acp timeout <seconds>` відповідає ключу конфігурації runtime `timeout`.
- `/acp cwd <path>` безпосередньо оновлює перевизначення `cwd` для runtime.
- `/acp set <key> <value>` — це загальний шлях.
  - Особливий випадок: `key=cwd` використовує шлях перевизначення `cwd`.
- `/acp reset-options` очищає всі перевизначення runtime для цільового сеансу.

## Підтримка harness в acpx (поточна)

Поточні вбудовані псевдоніми harness в acpx:

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

Коли OpenClaw використовує бекенд acpx, віддавайте перевагу цим значенням для `agentId`, якщо у вашій конфігурації acpx не визначено власні псевдоніми агентів.
Якщо ваша локальна інсталяція Cursor все ще надає ACP як `agent acp`, перевизначте команду агента `cursor` у конфігурації acpx замість зміни вбудованого типового значення.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей сирий escape hatch є можливістю CLI acpx (а не звичайного шляху OpenClaw `agentId`).

## Потрібна конфігурація

Базова конфігурація ACP core:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. Типове значення — true; задайте false, щоб призупинити ACP-dispatch, зберігши елементи керування /acp.
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

Якщо запуск ACP із прив’язкою до треда не працює, спочатку перевірте feature flag адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірнього треда. Вони потребують активного контексту розмови та адаптера каналу, який надає ACP-прив’язки до розмов.

Дивіться [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування плагіна для бекенду acpx

Нові встановлення постачаються з увімкненим за замовчуванням вбудованим плагіном
середовища виконання `acpx`, тож ACP зазвичай працює без ручного встановлення плагіна.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
перейти на локальний checkout для розробки, використовуйте явний шлях плагіна:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Встановлення з локального workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан здоров’я бекенду:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

Типово вбудований плагін бекенду acpx (`acpx`) використовує зафіксований бінарник, локальний для плагіна:

1. Типова команда — локальний для плагіна `node_modules/.bin/acpx` у пакеті плагіна ACPX.
2. Очікувана версія типово дорівнює pin розширення.
3. Під час запуску ACP-бекенд негайно реєструється як not-ready.
4. Фонове ensure-завдання перевіряє `acpx --version`.
5. Якщо локальний для плагіна бінарник відсутній або не збігається, виконується:
   `npm install --omit=dev --no-save acpx@<pinned>` і повторна перевірка.

Ви можете перевизначити команду/версію в конфігурації плагіна:

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

Примітки:

- `command` приймає абсолютний шлях, відносний шлях або назву команди (`acpx`).
- Відносні шляхи визначаються від каталогу workspace OpenClaw.
- `expectedVersion: "any"` вимикає сувору перевірку збігу версій.
- Коли `command` вказує на користувацький бінарник/шлях, автоматичне встановлення локального для плагіна пакета вимикається.
- Запуск OpenClaw залишається неблокувальним, поки виконується перевірка стану бекенду.

Дивіться [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально через `npm install -g openclaw`, runtime-залежності acpx
(бінарники для конкретної платформи) встановлюються автоматично
через postinstall-hook. Якщо автоматичне встановлення завершується невдачею, gateway все одно запускається
нормально і повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP для інструментів плагіна

Типово сеанси ACPX **не** відкривають інструменти, зареєстровані плагінами OpenClaw, для
ACP-harness.

Якщо ви хочете, щоб ACP-агенти, такі як Codex або Claude Code, могли викликати встановлені
інструменти плагінів OpenClaw, наприклад memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер з назвою `openclaw-plugin-tools` у bootstrap
  сеансу ACPX.
- Відкриває інструменти плагінів, уже зареєстровані встановленими та увімкненими плагінами OpenClaw.
- Залишає цю можливість явною і вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів ACP-harness.
- ACP-агенти отримують доступ лише до інструментів плагінів, які вже активні в gateway.
- Сприймайте це як ту саму межу довіри, що й дозвіл цим плагінам виконуватися всередині самого OpenClaw.
- Перегляньте встановлені плагіни перед увімкненням.

Користувацькі `mcpServers` і надалі працюють як раніше. Вбудований міст plugin-tools —
це додаткова зручність за явною згодою, а не заміна загальної конфігурації MCP-сервера.

## Налаштування дозволів

ACP-сеанси працюють неінтерактивно — TTY для схвалення або відхилення запитів на дозвіл запису файлів і виконання shell-команд немає. Плагін acpx надає два ключі конфігурації, які визначають, як обробляються дозволи:

Ці дозволи ACPX harness відокремлені від схвалень exec у OpenClaw і відокремлені від vendor-прапорців обходу в CLI-бекендах, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач на рівні harness для ACP-сеансів.

### `permissionMode`

Керує тим, які операції агент harness може виконувати без запиту.

| Value           | Behavior                                                         |
| --------------- | ---------------------------------------------------------------- |
| `approve-all`   | Автоматично схвалювати всі записи файлів і shell-команди.        |
| `approve-reads` | Автоматично схвалювати лише читання; запис і exec потребують запитів. |
| `deny-all`      | Відхиляти всі запити на дозвіл.                                  |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би з’явитися запит на дозвіл, але інтерактивний TTY недоступний (а для ACP-сеансів це завжди так).

| Value  | Behavior                                                      |
| ------ | ------------------------------------------------------------- |
| `fail` | Перервати сеанс з `AcpRuntimeError`. **(типово)**             |
| `deny` | Мовчки відхилити дозвіл і продовжити роботу (graceful degradation). |

### Конфігурація

Задається через конфігурацію плагіна:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Перезапустіть gateway після зміни цих значень.

> **Важливо:** OpenClaw наразі типово використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних ACP-сеансах будь-який запис або exec, що викликає запит на дозвіл, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, задайте `nonInteractivePermissions` у значення `deny`, щоб сеанси деградували коректно замість аварійного завершення.

## Усунення неполадок

| Symptom                                                                     | Likely cause                                                                    | Fix                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Відсутній або вимкнений плагін бекенду.                                         | Встановіть і увімкніть плагін бекенду, а потім виконайте `/acp doctor`.                                                                                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                         | Задайте `acp.enabled=true`.                                                                                                                                       |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Вимкнено dispatch зі звичайних повідомлень треда.                               | Задайте `acp.dispatch.enabled=true`.                                                                                                                              |
| `ACP agent "<id>" is not allowed by policy`                                 | Агента немає у списку дозволених.                                               | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                |
| `Unable to resolve session target: ...`                                     | Неправильний токен key/id/label.                                                | Виконайте `/acp sessions`, скопіюйте точний key/label і повторіть.                                                                                                |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної розмови, до якої можна прив’язати.       | Перейдіть у цільовий чат/канал і повторіть, або використайте spawn без прив’язки.                                                                                |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має можливості ACP-прив’язки до поточної розмови.                    | Використовуйте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте верхньорівневий `bindings[]` або перейдіть до підтримуваного каналу.              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом треда.                              | Перейдіть у цільовий тред або використайте `--thread auto`/`off`.                                                                                                 |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє активною ціллю прив’язки.                              | Переприв’яжіть як власник або використайте іншу розмову чи тред.                                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має можливості прив’язки до тредів.                                  | Використайте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime працює на хості; сеанс-запитувач працює в sandbox.                  | Використовуйте `runtime="subagent"` із sandboxed-сеансів або запускайте ACP spawn із сеансу без sandbox.                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для runtime ACP було запитано `sandbox="require"`.                              | Використовуйте `runtime="subagent"` для обов’язкового sandboxing або ACP із `sandbox="inherit"` із сеансу без sandbox.                                           |
| Missing ACP metadata for bound session                                      | Застарілі/видалені метадані ACP-сеансу.                                         | Створіть повторно через `/acp spawn`, а потім знову прив’яжіть/сфокусуйте тред.                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує запис/exec у неінтерактивному ACP-сеансі.               | Задайте `plugins.entries.acpx.config.permissionMode` у `approve-all` і перезапустіть gateway. Дивіться [Permission configuration](#permission-configuration).    |
| ACP session fails early with little output                                  | Запити на дозволи блокуються через `permissionMode`/`nonInteractivePermissions`. | Перевірте логи gateway на `AcpRuntimeError`. Для повних дозволів задайте `permissionMode=approve-all`; для graceful degradation задайте `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Процес harness завершився, але ACP-сеанс не повідомив про завершення.           | Відстежуйте через `ps aux \| grep acpx`; вручну завершіть застарілі процеси.                                                                                      |
