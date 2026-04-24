---
read_when:
    - Налаштування інтеграцій IDE на основі ACP
    - Налагодження маршрутизації сесії ACP до Gateway
summary: Запустіть міст ACP для інтеграцій IDE
title: ACP
x-i18n:
    generated_at: "2026-04-24T04:11:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

Запустіть міст [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), який взаємодіє з Gateway OpenClaw.

Ця команда використовує ACP через stdio для IDE і пересилає запити до Gateway
через WebSocket. Вона зберігає відповідність між сесіями ACP і ключами сесій Gateway.

`openclaw acp` — це ACP-міст із підтримкою Gateway, а не повноцінне
ACP-native середовище виконання редактора. Він зосереджений на маршрутизації
сесій, доставці запитів і базових оновленнях потокової передачі.

Якщо ви хочете, щоб зовнішній клієнт MCP безпосередньо взаємодіяв із
розмовами каналів OpenClaw замість розміщення сесії ACP harness, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp).

## Що це не є

Цю сторінку часто плутають із сесіями ACP harness.

`openclaw acp` означає:

- OpenClaw діє як ACP-сервер
- IDE або ACP-клієнт підключається до OpenClaw
- OpenClaw пересилає цю роботу в сесію Gateway

Це відрізняється від [ACP Agents](/uk/tools/acp-agents), де OpenClaw запускає
зовнішній harness, наприклад Codex або Claude Code, через `acpx`.

Коротке правило:

- редактор/клієнт хоче взаємодіяти з OpenClaw через ACP: використовуйте `openclaw acp`
- OpenClaw має запускати Codex/Claude/Gemini як ACP harness: використовуйте `/acp spawn` і [ACP Agents](/uk/tools/acp-agents)

## Матриця сумісності

| Область ACP                                                           | Статус      | Примітки                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Реалізовано | Основний потік мосту через stdio до Gateway chat/send + abort.                                                                                                                                                                                 |
| `listSessions`, slash-команди                                         | Реалізовано | Список сесій працює зі станом сесій Gateway; команди оголошуються через `available_commands_update`.                                                                                                                                          |
| `loadSession`                                                         | Частково    | Повторно прив’язує сесію ACP до ключа сесії Gateway і відтворює збережену текстову історію користувача/асистента. Історія інструментів/системи поки що не відновлюється.                                                                    |
| Вміст запиту (`text`, вбудований `resource`, зображення)              | Частково    | Текст/ресурси сплощуються у вхідні дані чату; зображення стають вкладеннями Gateway.                                                                                                                                                          |
| Режими сесії                                                          | Частково    | `session/set_mode` підтримується, і міст надає початкові елементи керування сесією на основі Gateway для thought level, tool verbosity, reasoning, usage detail та elevated actions. Ширші ACP-native поверхні режимів/конфігурації все ще поза межами підтримки. |
| Інформація про сесію та оновлення використання                        | Частково    | Міст надсилає сповіщення `session_info_update` і `usage_update` у режимі best-effort із кешованих знімків сесії Gateway. Дані використання приблизні й надсилаються лише тоді, коли сумарні токени Gateway позначені як актуальні.        |
| Потокова передача інструментів                                        | Частково    | Події `tool_call` / `tool_call_update` містять сирі I/O, текстовий вміст і визначені в режимі best-effort розташування файлів, якщо аргументи/результати інструментів Gateway їх розкривають. Вбудовані термінали й багатший diff-native вивід поки що не надаються. |
| MCP-сервери для кожної сесії (`mcpServers`)                           | Не підтримується | Режим мосту відхиляє запити на MCP-сервери для окремих сесій. Налаштовуйте MCP на шлюзі OpenClaw або в агенті.                                                                                                                             |
| Методи файлової системи клієнта (`fs/read_text_file`, `fs/write_text_file`) | Не підтримується | Міст не викликає методи файлової системи ACP-клієнта.                                                                                                                                                                                          |
| Методи термінала клієнта (`terminal/*`)                               | Не підтримується | Міст не створює термінали ACP-клієнта й не передає ідентифікатори терміналів через виклики інструментів.                                                                                                                                     |
| Плани сесії / потокова передача thought                               | Не підтримується | Наразі міст передає вихідний текст і статус інструментів, а не оновлення планів або thought ACP.                                                                                                                                              |

## Відомі обмеження

- `loadSession` відтворює збережену текстову історію користувача й асистента, але не
  відновлює історичні виклики інструментів, системні сповіщення чи багатші
  ACP-native типи подій.
- Якщо кілька ACP-клієнтів використовують той самий ключ сесії Gateway, маршрутизація
  подій і скасування працює в режимі best-effort, а не зі строгою ізоляцією для
  кожного клієнта. Для чистих локальних для редактора ходів віддавайте перевагу
  типовим ізольованим сесіям `acp:<uuid>`.
- Стани зупинки Gateway перетворюються на причини зупинки ACP, але таке
  відображення менш виразне, ніж у повністю ACP-native середовищі виконання.
- Початкові елементи керування сесією зараз охоплюють лише цільову підмножину
  параметрів Gateway: thought level, tool verbosity, reasoning, usage detail та elevated
  actions. Вибір моделі й елементи керування exec-host поки що не доступні як
  параметри конфігурації ACP.
- `session_info_update` і `usage_update` формуються на основі знімків сесії Gateway,
  а не живого ACP-native обліку середовища виконання. Дані використання
  приблизні, не містять даних про вартість і надсилаються лише тоді, коли Gateway
  позначає загальні дані токенів як актуальні.
- Дані стеження за інструментами надаються в режимі best-effort. Міст може показувати
  шляхи до файлів, які з’являються у відомих аргументах/результатах інструментів, але
  поки що не передає термінали ACP або структуровані diff файлів.

## Використання

```bash
openclaw acp

# Віддалений Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Віддалений Gateway (токен із файлу)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Підключитися до наявного ключа сесії
openclaw acp --session agent:main:main

# Підключитися за міткою (має вже існувати)
openclaw acp --session-label "support inbox"

# Скинути ключ сесії перед першим запитом
openclaw acp --session agent:main:main --reset-session
```

## ACP-клієнт (налагодження)

Використовуйте вбудований ACP-клієнт, щоб перевірити міст без IDE.
Він запускає ACP-міст і дає змогу інтерактивно вводити запити.

```bash
openclaw acp client

# Спрямувати запущений міст на віддалений Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Перевизначити команду сервера (типово: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Модель дозволів (режим налагодження клієнта):

- Автосхвалення базується на allowlist і застосовується лише до довірених ідентифікаторів основних інструментів.
- Автосхвалення `read` обмежене поточним робочим каталогом (`--cwd`, якщо задано).
- ACP автоматично схвалює лише вузькі класи операцій лише для читання: обмежені виклики `read` у межах активного cwd плюс інструменти пошуку лише для читання (`search`, `web_search`, `memory_search`). Невідомі/неосновні інструменти, читання поза межами області, інструменти з можливістю виконання, інструменти control-plane, інструменти зі змінами стану та інтерактивні потоки завжди потребують явного схвалення через запит.
- Наданий сервером `toolCall.kind` вважається недовіреними метаданими (а не джерелом авторизації).
- Ця політика ACP-мосту відокремлена від дозволів ACPX harness. Якщо ви запускаєте OpenClaw через бекенд `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` є аварійним перемикачем “yolo” для цієї сесії harness.

## Як це використовувати

Використовуйте ACP, коли IDE (або інший клієнт) підтримує Agent Client Protocol і ви хочете,
щоб він керував сесією Gateway OpenClaw.

1. Переконайтеся, що Gateway запущено (локально або віддалено).
2. Налаштуйте ціль Gateway (конфігурація або прапорці).
3. Налаштуйте IDE на запуск `openclaw acp` через stdio.

Приклад конфігурації (зберігається):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Приклад прямого запуску (без запису конфігурації):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# бажано для безпеки локального процесу
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Вибір агентів

ACP не вибирає агентів безпосередньо. Він виконує маршрутизацію за ключем сесії Gateway.

Використовуйте ключі сесій із прив’язкою до агента, щоб вибрати конкретного агента:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Кожна сесія ACP відповідає одному ключу сесії Gateway. Один агент може мати багато
сесій; ACP типово використовує ізольовану сесію `acp:<uuid>`, якщо ви не перевизначите
ключ або мітку.

`mcpServers` для окремих сесій не підтримуються в режимі мосту. Якщо ACP-клієнт
надсилає їх під час `newSession` або `loadSession`, міст повертає зрозумілу
помилку замість того, щоб мовчки їх ігнорувати.

Якщо ви хочете, щоб сесії на базі ACPX бачили інструменти Plugin OpenClaw або вибрані
вбудовані інструменти, наприклад `cron`, увімкніть мости ACPX MCP на стороні gateway
замість спроби передавати `mcpServers` для окремих сесій. Див.
[ACP Agents](/uk/tools/acp-agents-setup#plugin-tools-mcp-bridge) і
[Міст MCP інструментів OpenClaw](/uk/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Використання з `acpx` (Codex, Claude, інші ACP-клієнти)

Якщо ви хочете, щоб агент для програмування, наприклад Codex або Claude Code,
взаємодіяв із вашим ботом OpenClaw через ACP, використовуйте `acpx` із його
вбудованою ціллю `openclaw`.

Типовий потік:

1. Запустіть Gateway і переконайтеся, що ACP-міст може до нього підключитися.
2. Спрямуйте `acpx openclaw` на `openclaw acp`.
3. Вкажіть ключ сесії OpenClaw, який має використовувати агент для програмування.

Приклади:

```bash
# Одноразовий запит до вашої типової ACP-сесії OpenClaw
acpx openclaw exec "Підсумуй стан активної ACP-сесії OpenClaw."

# Постійна іменована сесія для наступних ходів
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Запитай у мого робочого агента OpenClaw недавній контекст, релевантний для цього репозиторію."
```

Якщо ви хочете, щоб `acpx openclaw` щоразу звертався до конкретного Gateway і ключа сесії,
перевизначте команду агента `openclaw` у `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Для локального checkout OpenClaw репозиторію використовуйте прямий CLI entrypoint замість
dev runner, щоб потік ACP залишався чистим. Наприклад:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Це найпростіший спосіб дати змогу Codex, Claude Code або іншому клієнту з підтримкою ACP
отримувати контекстну інформацію з агента OpenClaw без зчитування термінала.

## Налаштування редактора Zed

Додайте власного ACP-агента в `~/.config/zed/settings.json` (або скористайтеся UI налаштувань Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Щоб націлити на конкретний Gateway або агента:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

У Zed відкрийте панель Agent і виберіть “OpenClaw ACP”, щоб почати гілку.

## Відображення сесій

Типово ACP-сесії отримують ізольований ключ сесії Gateway з префіксом `acp:`.
Щоб повторно використати відому сесію, передайте ключ сесії або мітку:

- `--session <key>`: використовувати конкретний ключ сесії Gateway.
- `--session-label <label>`: знайти наявну сесію за міткою.
- `--reset-session`: згенерувати новий ідентифікатор сесії для цього ключа (той самий ключ, новий transcript).

Якщо ваш ACP-клієнт підтримує метадані, ви можете перевизначити це для кожної сесії:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Докладніше про ключі сесій: [/concepts/session](/uk/concepts/session).

## Параметри

- `--url <url>`: URL WebSocket Gateway (типово `gateway.remote.url`, якщо налаштовано).
- `--token <token>`: токен автентифікації Gateway.
- `--token-file <path>`: прочитати токен автентифікації Gateway з файлу.
- `--password <password>`: пароль автентифікації Gateway.
- `--password-file <path>`: прочитати пароль автентифікації Gateway з файлу.
- `--session <key>`: типовий ключ сесії.
- `--session-label <label>`: типова мітка сесії для пошуку.
- `--require-existing`: завершитися з помилкою, якщо ключ сесії/мітка не існує.
- `--reset-session`: скинути ключ сесії перед першим використанням.
- `--no-prefix-cwd`: не додавати робочий каталог як префікс до запитів.
- `--provenance <off|meta|meta+receipt>`: включати метадані provenance ACP або receipts.
- `--verbose, -v`: докладне журналювання у stderr.

Примітка щодо безпеки:

- `--token` і `--password` можуть бути видимими в локальних списках процесів у деяких системах.
- Надавайте перевагу `--token-file`/`--password-file` або змінним середовища (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Визначення автентифікації Gateway дотримується спільного контракту, який використовується іншими клієнтами Gateway:
  - локальний режим: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> запасний варіант `gateway.remote.*` лише якщо `gateway.auth.*` не задано (локальні SecretRef, які налаштовано, але не вдалося розв’язати, завершуються в закритому режимі)
  - віддалений режим: `gateway.remote.*` з резервним використанням env/config згідно з правилами пріоритету для віддаленого режиму
  - `--url` безпечно перевизначає значення й не повторно використовує неявні облікові дані config/env; передавайте явні `--token`/`--password` (або варіанти з файлом)
- Дочірні процеси бекенду середовища виконання ACP отримують `OPENCLAW_SHELL=acp`, що можна використовувати для контекстно-специфічних правил shell/profile.
- `openclaw acp client` встановлює `OPENCLAW_SHELL=acp-client` для запущеного процесу мосту.

### Параметри `acp client`

- `--cwd <dir>`: робочий каталог для ACP-сесії.
- `--server <command>`: команда ACP-сервера (типово: `openclaw`).
- `--server-args <args...>`: додаткові аргументи, передані ACP-серверу.
- `--server-verbose`: увімкнути докладне журналювання на ACP-сервері.
- `--verbose, -v`: докладне журналювання клієнта.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [ACP agents](/uk/tools/acp-agents)
