---
read_when:
    - Вам потрібна автоматизація на основі подій для /new, /reset, /stop і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-05T17:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eb75bb2b3b2ad229bf3da24fdb0fe021ed08f812fd1d13c69b3bd9df0218e5
    source_path: automation/hooks.md
    workflow: 15
---

# Хуки

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Вони автоматично виявляються в каталогах, і їх можна переглянути за допомогою `openclaw hooks`.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): запускаються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Вебхуки**: зовнішні HTTP-ендпоїнти, які дозволяють іншим системам запускати роботу в OpenClaw. Див. [Вебхуки](/automation/cron-jobs#webhooks).

Хуки також можуть постачатися всередині plugins. `openclaw hooks list` показує як окремі хуки, так і хуки, керовані plugin.

## Швидкий старт

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Типи подій

| Подія                    | Коли спрацьовує                               |
| ------------------------ | --------------------------------------------- |
| `command:new`            | Надіслано команду `/new`                      |
| `command:reset`          | Надіслано команду `/reset`                    |
| `command:stop`           | Надіслано команду `/stop`                     |
| `command`                | Будь-яка подія команди (загальний слухач)     |
| `session:compact:before` | Перед тим, як стиснення підсумує історію      |
| `session:compact:after`  | Після завершення стиснення                    |
| `session:patch`          | Коли властивості сесії змінюються             |
| `agent:bootstrap`        | Перед інʼєкцією bootstrap-файлів робочої теки |
| `gateway:startup`        | Після запуску каналів і завантаження хуків    |
| `message:received`       | Вхідне повідомлення з будь-якого каналу       |
| `message:transcribed`    | Після завершення транскрибування аудіо        |
| `message:preprocessed`   | Після завершення обробки всіх медіа і посилань |
| `message:sent`           | Вихідне повідомлення доставлено               |

## Написання хуків

### Структура хука

Кожен хук — це каталог, що містить два файли:

```
my-hook/
├── HOOK.md          # Метадані + документація
└── handler.ts       # Реалізація обробника
```

### Формат HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Поля метаданих** (`metadata.openclaw`):

| Поле       | Опис                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Емодзі для відображення в CLI                        |
| `events`   | Масив подій для прослуховування                      |
| `export`   | Іменований експорт для використання (типово `"default"`) |
| `os`       | Обовʼязкові платформи (наприклад, `["darwin", "linux"]`) |
| `requires` | Обовʼязкові шляхи `bins`, `anyBins`, `env` або `config` |
| `always`   | Обходити перевірки відповідності (boolean)           |
| `install`  | Методи встановлення                                  |

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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте через push, щоб надсилати користувачу), і `context` (дані, специфічні для події).

### Ключові моменти контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (дані, специфічні для провайдера, включно з `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточне збагачене тіло), `context.from`, `context.channelId`.

**Події bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Тільки привілейовані клієнти можуть запускати події patch.

**Події стиснення**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додає `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Виявлення хуків

Хуки виявляються в таких каталогах у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються з OpenClaw
2. **Plugin-хуки**: хуки, вбудовані у встановлені plugins
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх робочих тек). Додаткові каталоги з `hooks.internal.load.extraDirs` мають той самий пріоритет.
4. **Хуки робочої теки**: `<workspace>/hooks/` (для кожного агента окремо, типово вимкнені, доки їх явно не ввімкнути)

Хуки робочої теки можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані plugin хуки з тією самою назвою.

### Пакети хуків

Пакети хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Npm-специфікації підтримують лише реєстр (назва пакета + необовʼязкова точна версія або dist-tag). Специфікації Git/URL/file і діапазони semver відхиляються.

## Вбудовані хуки

| Хук                   | Події                          | Що робить                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`              | Інʼєктує додаткові bootstrap-файли за glob-шаблонами  |
| command-logger        | `command`                      | Логує всі команди в `~/.openclaw/logs/commands.log`   |
| boot-md               | `gateway:startup`              | Запускає `BOOT.md` під час старту gateway             |

Увімкнення будь-якого вбудованого хука:

```bash
openclaw hooks enable <hook-name>
```

### Докладніше про session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файлу через LLM і зберігає в `<workspace>/memory/YYYY-MM-DD-slug.md`. Потрібно, щоб `workspace.dir` було налаштовано.

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

Шляхи обчислюються відносно робочої теки. Завантажуються лише розпізнавані базові назви bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

## Plugin-хуки

Plugins можуть реєструвати хуки через Plugin SDK для глибшої інтеграції: перехоплення викликів інструментів, зміни промптів, керування потоком повідомлень тощо. Plugin SDK надає 28 хуків, що охоплюють визначення моделі, життєвий цикл агента, потік повідомлень, виконання інструментів, координацію субагентів і життєвий цикл gateway.

Повний довідник з plugin-хуків, включно з `before_tool_call`, `before_agent_reply`, `before_install` та всіма іншими plugin-хуками, див. у [Архітектура plugins](/plugins/architecture#provider-runtime-hooks).

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

Додаткові каталоги хуків:

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

## Довідка CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Рекомендовані практики

- **Зберігайте обробники швидкими.** Хуки запускаються під час обробки команд. Для важкої роботи використовуйте fire-and-forget через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгортайте ризиковані операції в try/catch; не викидайте винятки, щоб інші обробники могли виконатися.
- **Рано фільтруйте події.** Одразу повертайтеся, якщо тип/дія події не є релевантними.
- **Використовуйте конкретні ключі подій.** Віддавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення несправностей

### Хук не виявляється

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Хук не відповідає умовам

```bash
openclaw hooks info my-hook
```

Перевірте, чи не бракує бінарних файлів (PATH), змінних середовища, значень конфігурації або сумісності з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнено: `openclaw hooks list`
2. Перезапустіть процес gateway, щоб хуки перезавантажилися.
3. Перевірте логи gateway: `./scripts/clawlog.sh | grep hook`

## Повʼязане

- [Довідка CLI: hooks](/cli/hooks)
- [Вебхуки](/automation/cron-jobs#webhooks)
- [Архітектура plugins](/plugins/architecture#provider-runtime-hooks) — повний довідник з plugin-хуків
- [Конфігурація](/gateway/configuration-reference#hooks)
