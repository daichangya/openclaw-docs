---
read_when:
    - Ви хочете автоматизацію на основі подій для `/new`, `/reset`, `/stop` і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-20T19:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5269c3ca3a45d23d79232e041c0980ecaab93fd6f0f1e39e0b2a76cb4c8b5c8b
    source_path: automation/hooks.md
    workflow: 15
---

# Хуки

Хуки — це невеликі скрипти, які запускаються, коли всередині Gateway щось відбувається. Їх можна знаходити в директоріях і переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, набір хуків, застарілий обробник або додаткову директорію хуків.

В OpenClaw є два види хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhooks**: зовнішні HTTP-ендпоінти, які дозволяють іншим системам запускати роботу в OpenClaw. Див. [Webhooks](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися всередині плагінів. `openclaw hooks list` показує як окремі хуки, так і хуки, якими керують плагіни.

## Швидкий старт

```bash
# Показати доступні хуки
openclaw hooks list

# Увімкнути хук
openclaw hooks enable session-memory

# Перевірити стан хуків
openclaw hooks check

# Отримати детальну інформацію
openclaw hooks info session-memory
```

## Типи подій

| Подія                    | Коли спрацьовує                                 |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Коли виконано команду `/new`                    |
| `command:reset`          | Коли виконано команду `/reset`                  |
| `command:stop`           | Коли виконано команду `/stop`                   |
| `command`                | Будь-яка подія команди (загальний слухач)       |
| `session:compact:before` | Перед тим як Compaction стискає історію         |
| `session:compact:after`  | Після завершення Compaction                     |
| `session:patch`          | Коли змінюються властивості сесії               |
| `agent:bootstrap`        | Перед інʼєкцією bootstrap-файлів робочого простору |
| `gateway:startup`        | Після запуску каналів і завантаження хуків      |
| `message:received`       | Вхідне повідомлення з будь-якого каналу         |
| `message:transcribed`    | Після завершення транскрипції аудіо             |
| `message:preprocessed`   | Після завершення обробки всіх медіа й посилань  |
| `message:sent`           | Вихідне повідомлення доставлено                 |

## Написання хуків

### Структура хука

Кожен хук — це директорія, що містить два файли:

```
my-hook/
├── HOOK.md          # Метадані + документація
└── handler.ts       # Реалізація обробника
```

### Формат HOOK.md

```markdown
---
name: my-hook
description: "Короткий опис того, що робить цей хук"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Детальна документація тут.
```

**Поля метаданих** (`metadata.openclaw`):

| Поле      | Опис                                                      |
| --------- | --------------------------------------------------------- |
| `emoji`   | Емодзі для відображення в CLI                             |
| `events`  | Масив подій, які слід відстежувати                        |
| `export`  | Іменований експорт для використання (типово `"default"`)  |
| `os`      | Потрібні платформи (наприклад, `["darwin", "linux"]`)     |
| `requires` | Необхідні `bins`, `anyBins`, `env` або шляхи `config`    |
| `always`  | Обхід перевірок придатності (boolean)                     |
| `install` | Методи встановлення                                       |

### Реалізація обробника

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте через push, щоб надіслати користувачу), і `context` (дані, специфічні для події).

### Основні моменти context подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, включно з `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточне збагачене тіло), `context.from`, `context.channelId`.

**Події bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть запускати події patch.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додатково містить `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Виявлення хуків

Хуки знаходяться в цих директоріях у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Хуки плагінів**: хуки, вбудовані у встановлені плагіни
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх робочих просторів). Додаткові директорії з `hooks.internal.load.extraDirs` мають цей самий пріоритет.
4. **Хуки робочого простору**: `<workspace>/hooks/` (для окремого агента, типово вимкнені, доки їх явно не ввімкнути)

Хуки робочого простору можуть додавати нові імена хуків, але не можуть перевизначати вбудовані, керовані або надані плагінами хуки з таким самим імʼям.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не буде налаштовано. Увімкніть вбудований або керований хук через `openclaw hooks enable <name>`, встановіть набір хуків або задайте `hooks.internal.enabled=true`, щоб погодитися на це. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові директорії хуків і застарілі обробники вмикають широке виявлення.

### Набори хуків

Набори хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

npm-специфікації підтримуються лише з реєстру (імʼя пакета + необовʼязкова точна версія або dist-tag). Специфікації Git/URL/file і діапазони semver відхиляються.

## Вбудовані хуки

| Хук                  | Події                          | Що робить                                              |
| -------------------- | ------------------------------ | ------------------------------------------------------ |
| session-memory       | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`        |
| bootstrap-extra-files | `agent:bootstrap`             | Інʼєктує додаткові bootstrap-файли за glob-шаблонами   |
| command-logger       | `command`                      | Логує всі команди в `~/.openclaw/logs/commands.log`    |
| boot-md              | `gateway:startup`              | Запускає `BOOT.md`, коли запускається gateway          |

Увімкніть будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Подробиці session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файлу через LLM і зберігає у `<workspace>/memory/YYYY-MM-DD-slug.md`. Потрібно, щоб було налаштовано `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### Конфігурація bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Шляхи обчислюються відносно робочого простору. Завантажуються лише розпізнавані базові імена bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Подробиці command-logger

Логує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Подробиці boot-md

Запускає `BOOT.md` з активного робочого простору під час запуску gateway.

## Хуки плагінів

Плагіни можуть реєструвати хуки через Plugin SDK для глибшої інтеграції: перехоплення викликів інструментів, зміни промптів, керування потоком повідомлень тощо. Plugin SDK надає 28 хуків, що охоплюють визначення моделі, життєвий цикл агента, потік повідомлень, виконання інструментів, координацію субагентів і життєвий цикл gateway.

Повний довідник із хуків плагінів, включно з `before_tool_call`, `before_agent_reply`, `before_install` та всіма іншими хуками плагінів, див. у [Архітектура плагінів](/uk/plugins/architecture#provider-runtime-hooks).

## Конфігурація

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Змінні середовища для окремого хука:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Додаткові директорії хуків:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Застарілий формат конфігурації масиву `hooks.internal.handlers` усе ще підтримується для зворотної сумісності, але нові хуки мають використовувати систему на основі виявлення.
</Note>

## Довідник CLI

```bash
# Показати всі хуки (додайте --eligible, --verbose або --json)
openclaw hooks list

# Показати детальну інформацію про хук
openclaw hooks info <hook-name>

# Показати зведення придатності
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Найкращі практики

- **Робіть обробники швидкими.** Хуки запускаються під час обробки команд. Для важкої роботи використовуйте fire-and-forget через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники теж могли виконатися.
- **Фільтруйте події на ранньому етапі.** Одразу повертайтеся, якщо тип/дія події не є релевантними.
- **Використовуйте конкретні ключі подій.** Віддавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення проблем

### Хук не виявляється

```bash
# Перевірити структуру директорії
ls -la ~/.openclaw/hooks/my-hook/
# Має показати: HOOK.md, handler.ts

# Показати всі знайдені хуки
openclaw hooks list
```

### Хук непридатний

```bash
openclaw hooks info my-hook
```

Перевірте, чи не бракує бінарних файлів (PATH), змінних середовища, значень конфігурації або сумісності з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес gateway, щоб хуки перезавантажилися.
3. Перевірте логи gateway: `./scripts/clawlog.sh | grep hook`

## Повʼязане

- [Довідник CLI: hooks](/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Архітектура плагінів](/uk/plugins/architecture#provider-runtime-hooks) — повний довідник із хуків плагінів
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
