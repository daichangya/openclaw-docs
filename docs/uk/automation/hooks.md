---
read_when:
    - Ви хочете автоматизацію на основі подій для `/new`, `/reset`, `/stop` і подій життєвого циклу агента
    - Ви хочете створювати, встановлювати або налагоджувати хуки
summary: 'Хуки: автоматизація на основі подій для команд і подій життєвого циклу'
title: Хуки
x-i18n:
    generated_at: "2026-04-26T23:10:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1f9b1dc0c470502f782758e1542435f1e593750ff69a39f7f966c7d42e29c1e
    source_path: automation/hooks.md
    workflow: 15
---

Хуки — це невеликі скрипти, які запускаються, коли щось відбувається всередині Gateway. Їх можна виявляти з директорій та переглядати за допомогою `openclaw hooks`. Gateway завантажує внутрішні хуки лише після того, як ви ввімкнете хуки або налаштуєте принаймні один запис хука, пакет хуків, застарілий обробник або додаткову директорію хуків.

В OpenClaw є два типи хуків:

- **Внутрішні хуки** (ця сторінка): виконуються всередині Gateway, коли спрацьовують події агента, як-от `/new`, `/reset`, `/stop` або події життєвого циклу.
- **Webhooks**: зовнішні HTTP-ендпойнти, які дозволяють іншим системам запускати роботу в OpenClaw. Див. [Webhooks](/uk/automation/cron-jobs#webhooks).

Хуки також можуть постачатися всередині плагінів. `openclaw hooks list` показує як окремі хуки, так і хуки, керовані плагінами.

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
| `command:new`            | Надіслано команду `/new`                        |
| `command:reset`          | Надіслано команду `/reset`                      |
| `command:stop`           | Надіслано команду `/stop`                       |
| `command`                | Будь-яка подія команди (загальний слухач)       |
| `session:compact:before` | Перед тим, як Compaction підсумує історію       |
| `session:compact:after`  | Після завершення Compaction                     |
| `session:patch`          | Коли змінюються властивості сесії               |
| `agent:bootstrap`        | Перед додаванням bootstrap-файлів робочої папки |
| `gateway:startup`        | Після запуску каналів і завантаження хуків      |
| `message:received`       | Вхідне повідомлення з будь-якого каналу         |
| `message:transcribed`    | Після завершення транскрибування аудіо          |
| `message:preprocessed`   | Після завершення обробки медіа та посилань      |
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

Тут розміщується детальна документація.
```

**Поля метаданих** (`metadata.openclaw`):

| Поле      | Опис                                                      |
| --------- | --------------------------------------------------------- |
| `emoji`   | Емодзі для відображення в CLI                             |
| `events`  | Масив подій, які потрібно відстежувати                    |
| `export`  | Іменований експорт для використання (типово `"default"`)  |
| `os`      | Потрібні платформи (наприклад, `["darwin", "linux"]`)     |
| `requires` | Потрібні шляхи `bins`, `anyBins`, `env` або `config`     |
| `always`  | Обійти перевірки відповідності (boolean)                  |
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

Кожна подія містить: `type`, `action`, `sessionKey`, `timestamp`, `messages` (додавайте сюди, щоб надіслати користувачу), і `context` (специфічні для події дані). Контексти хуків агентів і плагінів інструментів також можуть містити `trace` — лише для читання, сумісний із W3C діагностичний контекст трасування, який плагіни можуть передавати в структуровані логи для кореляції OTEL.

### Основні моменти контексту подій

**Події команд** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Події повідомлень** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (специфічні для провайдера дані, зокрема `senderId`, `senderName`, `guildId`).

**Події повідомлень** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Події повідомлень** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Події повідомлень** (`message:preprocessed`): `context.bodyForAgent` (остаточне збагачене тіло), `context.from`, `context.channelId`.

**Події bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (змінюваний масив), `context.agentId`.

**Події patch сесії** (`session:patch`): `context.sessionEntry`, `context.patch` (лише змінені поля), `context.cfg`. Лише привілейовані клієнти можуть запускати події patch.

**Події Compaction**: `session:compact:before` містить `messageCount`, `tokenCount`. `session:compact:after` додатково містить `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` фіксує, коли користувач надсилає `/stop`; це життєвий цикл скасування/команди, а не бар’єр фіналізації агента. Плагіни, яким потрібно перевірити природну фінальну відповідь і попросити агента зробити ще один прохід, повинні використовувати типізований хук плагіна `before_agent_finalize`. Див. [Plugin hooks](/uk/plugins/hooks).

## Виявлення хуків

Хуки виявляються з таких директорій у порядку зростання пріоритету перевизначення:

1. **Вбудовані хуки**: постачаються разом з OpenClaw
2. **Хуки плагінів**: постачаються всередині встановлених плагінів
3. **Керовані хуки**: `~/.openclaw/hooks/` (встановлені користувачем, спільні для всіх робочих папок). Додаткові директорії з `hooks.internal.load.extraDirs` мають такий самий пріоритет.
4. **Хуки робочої папки**: `<workspace>/hooks/` (для кожного агента окремо, типово вимкнені, доки їх явно не ввімкнути)

Хуки робочої папки можуть додавати нові назви хуків, але не можуть перевизначати вбудовані, керовані або надані плагінами хуки з тією самою назвою.

Gateway пропускає виявлення внутрішніх хуків під час запуску, доки внутрішні хуки не налаштовані. Увімкніть вбудований або керований хук за допомогою `openclaw hooks enable <name>`, встановіть пакет хуків або задайте `hooks.internal.enabled=true`, щоб дозволити їх. Коли ви вмикаєте один іменований хук, Gateway завантажує лише обробник цього хука; `hooks.internal.enabled=true`, додаткові директорії хуків і застарілі обробники вмикають широке виявлення.

### Пакети хуків

Пакети хуків — це npm-пакети, які експортують хуки через `openclaw.hooks` у `package.json`. Встановлення:

```bash
openclaw plugins install <path-or-spec>
```

Npm-специфікації підтримуються лише для реєстру (назва пакета + необов’язкова точна версія або dist-tag). Специфікації Git/URL/file і діапазони semver відхиляються.

## Вбудовані хуки

| Хук                  | Події                         | Що робить                                              |
| -------------------- | ----------------------------- | ------------------------------------------------------ |
| session-memory       | `command:new`, `command:reset` | Зберігає контекст сесії в `<workspace>/memory/`        |
| bootstrap-extra-files | `agent:bootstrap`            | Додає додаткові bootstrap-файли за glob-шаблонами      |
| command-logger       | `command`                     | Логує всі команди в `~/.openclaw/logs/commands.log`    |
| boot-md              | `gateway:startup`             | Запускає `BOOT.md`, коли запускається gateway          |

Увімкнути будь-який вбудований хук:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Деталі session-memory

Витягує останні 15 повідомлень користувача/асистента, генерує описовий slug імені файла через LLM і зберігає його в `<workspace>/memory/YYYY-MM-DD-slug.md`, використовуючи локальну дату хоста. Потрібно, щоб був налаштований `workspace.dir`.

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

Шляхи обчислюються відносно робочої папки. Завантажуються лише розпізнані базові назви bootstrap-файлів (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Деталі command-logger

Логує кожну slash-команду в `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Деталі boot-md

Запускає `BOOT.md` з активної робочої папки під час запуску gateway.

## Хуки плагінів

Плагіни можуть реєструвати типізовані хуки через Plugin SDK для глибшої інтеграції:
перехоплення викликів інструментів, модифікації промптів, керування потоком повідомлень тощо.
Використовуйте хуки плагінів, коли вам потрібні `before_tool_call`, `before_agent_reply`,
`before_install` або інші in-process хуки життєвого циклу.

Повний довідник із хуків плагінів див. у [Plugin hooks](/uk/plugins/hooks).

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
Застарілий формат конфігурації масиву `hooks.internal.handlers` усе ще підтримується для зворотної сумісності, але нові хуки повинні використовувати систему на основі виявлення.
</Note>

## Довідник CLI

```bash
# Показати всі хуки (додайте --eligible, --verbose або --json)
openclaw hooks list

# Показати детальну інформацію про хук
openclaw hooks info <hook-name>

# Показати зведення відповідності
openclaw hooks check

# Увімкнути/вимкнути
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Найкращі практики

- **Робіть обробники швидкими.** Хуки виконуються під час обробки команд. Запускайте важку роботу у фоновому режимі через `void processInBackground(event)`.
- **Коректно обробляйте помилки.** Обгортайте ризиковані операції в try/catch; не кидайте винятки, щоб інші обробники могли виконатися.
- **Фільтруйте події рано.** Одразу повертайтеся, якщо тип/дія події не є релевантними.
- **Використовуйте конкретні ключі подій.** Надавайте перевагу `"events": ["command:new"]` замість `"events": ["command"]`, щоб зменшити накладні витрати.

## Усунення проблем

### Хук не виявлено

```bash
# Перевірити структуру директорії
ls -la ~/.openclaw/hooks/my-hook/
# Має показати: HOOK.md, handler.ts

# Показати всі виявлені хуки
openclaw hooks list
```

### Хук не відповідає вимогам

```bash
openclaw hooks info my-hook
```

Перевірте відсутні бінарні файли (PATH), змінні середовища, значення конфігурації або сумісність з ОС.

### Хук не виконується

1. Переконайтеся, що хук увімкнений: `openclaw hooks list`
2. Перезапустіть процес gateway, щоб хуки перезавантажилися.
3. Перевірте логи gateway: `./scripts/clawlog.sh | grep hook`

## Пов’язане

- [Довідник CLI: hooks](/uk/cli/hooks)
- [Webhooks](/uk/automation/cron-jobs#webhooks)
- [Plugin hooks](/uk/plugins/hooks) — in-process хуки життєвого циклу плагінів
- [Конфігурація](/uk/gateway/configuration-reference#hooks)
