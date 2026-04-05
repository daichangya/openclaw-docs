---
read_when:
    - Вам потрібно перевірити сирий вивід моделі на витік reasoning
    - Ви хочете запускати Gateway у режимі watch під час ітерацій
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим watch, сирі потоки моделі та трасування витоку reasoning'
title: Налагодження
x-i18n:
    generated_at: "2026-04-05T18:05:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# Налагодження

Ця сторінка описує допоміжні засоби налагодження для потокового виводу, особливо коли
провайдер змішує reasoning зі звичайним текстом.

## Перевизначення runtime для налагодження

Використовуйте `/debug` у чаті, щоб задавати перевизначення config **лише для runtime** (у пам’яті, не на диску).
`/debug` типово вимкнено; увімкніть його через `commands.debug: true`.
Це зручно, коли потрібно перемкнути малопомітні налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення і повертає до config на диску.

## Режим watch для Gateway

Для швидких ітерацій запускайте gateway під файловим watcher:

```bash
pnpm gateway:watch
```

Це відповідає:

```bash
node scripts/watch-node.mjs gateway --force
```

Watcher перезапускається на файлах, важливих для збірки, у `src/`, вихідних файлах extension,
метаданих extension `package.json` і `openclaw.plugin.json`, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни в метаданих extension перезапускають
gateway без примусового `tsdown` rebuild; зміни у вихідних файлах і config, як і раніше,
спочатку перебудовують `dist`.

Додавайте будь-які прапорці CLI для gateway після `gateway:watch`, і вони передаватимуться
при кожному перезапуску.

## Dev-профіль і dev gateway (`--dev`)

Використовуйте dev-профіль, щоб ізолювати стан і підняти безпечну тимчасову конфігурацію для
налагодження. Існує **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  типово встановлює порт gateway на `19001` (похідні порти зсуваються разом із ним).
- **`gateway --dev`: вказує Gateway автоматично створювати типові config +
  workspace**, якщо їх немає (і пропускати `BOOTSTRAP.md`).

Рекомендований процес (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Якщо у вас ще немає глобального встановлення, запускайте CLI через `pnpm openclaw ...`.

Що це робить:

1. **Ізоляція профілю** (глобальний `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas зсуваються відповідно)

2. **Dev bootstrap** (`gateway --dev`)
   - Записує мінімальний config, якщо його немає (`gateway.mode=local`, bind loopback).
   - Встановлює `agent.workspace` на dev workspace.
   - Встановлює `agent.skipBootstrap=true` (без `BOOTSTRAP.md`).
   - Заповнює файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова identity: **C3‑PO** (protocol droid).
   - Пропускає channel providers у dev mode (`OPENCLAW_SKIP_CHANNELS=1`).

Процес скидання (чистий старт):

```bash
pnpm gateway:dev:reset
```

Примітка: `--dev` — це **глобальний** прапорець профілю, і деякі runners його перехоплюють.
Якщо потрібно вказати його явно, використовуйте форму через env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` очищає config, credentials, sessions і dev workspace (із використанням
`trash`, а не `rm`), а потім заново створює типову dev-конфігурацію.

Порада: якщо вже працює не-dev gateway (launchd/systemd), спочатку зупиніть його:

```bash
openclaw gateway stop
```

## Логування сирого потоку (OpenClaw)

OpenClaw може логувати **сирий потік асистента** до будь-якої фільтрації/форматування.
Це найкращий спосіб побачити, чи reasoning надходить як звичайні текстові delta
(або як окремі thinking blocks).

Увімкнення через CLI:

```bash
pnpm gateway:watch --raw-stream
```

Необов’язкове перевизначення шляху:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Еквівалентні env vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Типовий файл:

`~/.openclaw/logs/raw-stream.jsonl`

## Логування сирих chunks (pi-mono)

Щоб захоплювати **сирі chunks OpenAI-compat** до того, як вони розбиратимуться на blocks,
pi-mono надає окремий logger:

```bash
PI_RAW_STREAM=1
```

Необов’язковий шлях:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Типовий файл:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Примітка: це виводиться лише процесами, які використовують провайдера
> `openai-completions` з pi-mono.

## Примітки щодо безпеки

- Сирі логи потоку можуть містити повні prompts, вивід інструментів і дані користувача.
- Зберігайте логи локально та видаляйте їх після налагодження.
- Якщо ділитеся логами, спочатку приберіть секрети та PII.
