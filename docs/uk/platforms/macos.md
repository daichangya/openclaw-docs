---
read_when:
    - Реалізація функцій застосунку macOS
    - Зміна життєвого циклу Gateway або мосту Node на macOS
summary: Супутній застосунок OpenClaw для macOS (рядок меню + брокер Gateway)
title: застосунок macOS
x-i18n:
    generated_at: "2026-04-25T03:24:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

Застосунок macOS — це **супутній застосунок у рядку меню** для OpenClaw. Він керує дозволами,
локально керує/під’єднується до Gateway (launchd або вручну) та надає
можливості macOS агенту як Node.

## Що він робить

- Показує нативні сповіщення та стан у рядку меню.
- Керує запитами TCC (Сповіщення, Універсальний доступ, Запис екрана, Мікрофон,
  Розпізнавання мовлення, Automation/AppleScript).
- Запускає Gateway або під’єднується до нього (локально чи віддалено).
- Надає інструменти лише для macOS (Canvas, Camera, Screen Recording, `system.run`).
- Запускає локальний сервіс хоста Node у режимі **remote** (launchd) і зупиняє його в режимі **local**.
- За потреби розміщує **PeekabooBridge** для автоматизації UI.
- Встановлює глобальний CLI (`openclaw`) на запит через npm, pnpm або bun (застосунок надає перевагу npm, потім pnpm, потім bun; Node залишається рекомендованим середовищем виконання Gateway).

## Режим local і remote

- **Local** (типово): застосунок під’єднується до вже запущеного локального Gateway, якщо він є;
  інакше вмикає сервіс launchd через `openclaw gateway install`.
- **Remote**: застосунок під’єднується до Gateway через SSH/Tailscale і ніколи не запускає
  локальний процес.
  Застосунок запускає локальний **сервіс хоста Node**, щоб віддалений Gateway міг дістатися до цього Mac.
  Застосунок не породжує Gateway як дочірній процес.
  Виявлення Gateway тепер надає перевагу іменам Tailscale MagicDNS над сирими IP-адресами tailnet,
  тож застосунок Mac надійніше відновлюється, коли IP-адреси tailnet змінюються.

## Керування Launchd

Застосунок керує LaunchAgent для кожного користувача з міткою `ai.openclaw.gateway`
(або `ai.openclaw.<profile>` при використанні `--profile`/`OPENCLAW_PROFILE`; застаріле `com.openclaw.*` усе ще вивантажується).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Замініть мітку на `ai.openclaw.<profile>`, якщо працюєте з іменованим профілем.

Якщо LaunchAgent не встановлено, увімкніть його із застосунку або виконайте
`openclaw gateway install`.

## Можливості Node (mac)

Застосунок macOS представляє себе як Node. Типові команди:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node повідомляє мапу `permissions`, щоб агенти могли вирішити, що дозволено.

Сервіс Node + IPC застосунку:

- Коли працює безголовий сервіс хоста Node (режим remote), він під’єднується до Gateway WS як Node.
- `system.run` виконується в застосунку macOS (контекст UI/TCC) через локальний Unix-сокет; запити та вивід залишаються в застосунку.

Діаграма (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Підтвердження виконання (system.run)

`system.run` керується через **Exec approvals** у застосунку macOS (Settings → Exec approvals).
Налаштування security + ask + allowlist зберігаються локально на Mac у:

```
~/.openclaw/exec-approvals.json
```

Приклад:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Примітки:

- Записи `allowlist` — це glob-шаблони для розв’язаних шляхів до бінарних файлів або прості назви команд для команд, викликаних через PATH.
- Необроблений текст shell-команди, що містить синтаксис керування shell або розгортання (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), вважається промахом `allowlist` і потребує явного підтвердження (або додавання бінарного файла shell до `allowlist`).
- Вибір “Always Allow” у запиті додає цю команду до `allowlist`.
- Перевизначення середовища для `system.run` фільтруються (викидаються `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), а потім об’єднуються із середовищем застосунку.
- Для оболонкових обгорток (`bash|sh|zsh ... -c/-lc`) перевизначення середовища в межах запиту зводяться до невеликого явного `allowlist` (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always у режимі allowlist відомі обгортки диспетчеризації (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають внутрішні шляхи до виконуваних файлів, а не шляхи обгорток. Якщо безпечне розгортання неможливе, запис `allowlist` автоматично не зберігається.

## Глибокі посилання

Застосунок реєструє схему URL `openclaw://` для локальних дій.

### `openclaw://agent`

Запускає запит Gateway `agent`.
__OC_I18N_900004__
Параметри запиту:

- `message` (обов’язковий)
- `sessionKey` (необов’язковий)
- `thinking` (необов’язковий)
- `deliver` / `to` / `channel` (необов’язкові)
- `timeoutSeconds` (необов’язковий)
- `key` (необов’язковий ключ для unattended mode)

Безпека:

- Без `key` застосунок просить підтвердження.
- Без `key` застосунок застосовує коротке обмеження довжини повідомлення для запиту підтвердження та ігнорує `deliver` / `to` / `channel`.
- Із чинним `key` запуск виконується в unattended mode (призначено для особистих автоматизацій).

## Процес початкового налаштування (типовий)

1. Встановіть і запустіть **OpenClaw.app**.
2. Завершіть контрольний список дозволів (запити TCC).
3. Переконайтеся, що активний режим **Local** і Gateway запущено.
4. Встановіть CLI, якщо хочете доступ із термінала.

## Розміщення каталогу стану (macOS)

Не розміщуйте каталог стану OpenClaw в iCloud або інших папках, що синхронізуються з хмарою.
Шляхи із синхронізацією можуть додавати затримку й іноді спричиняти змагання блокувань/синхронізації файлів для
сеансів і облікових даних.

Надавайте перевагу локальному шляху стану без синхронізації, наприклад:
__OC_I18N_900005__
Якщо `openclaw doctor` виявить стан у:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

він покаже попередження та порекомендує повернутися до локального шляху.

## Збирання та робочий процес розробки (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (або Xcode)
- Пакування застосунку: `scripts/package-mac-app.sh`

## Налагодження підключення Gateway (CLI macOS)

Використовуйте CLI для налагодження, щоб перевірити те саме рукостискання WebSocket Gateway і логіку виявлення,
яку використовує застосунок macOS, без запуску застосунку.
__OC_I18N_900006__
Параметри connect:

- `--url <ws://host:port>`: перевизначити конфігурацію
- `--mode <local|remote>`: визначити з конфігурації (типово: конфігурація або local)
- `--probe`: примусово виконати нову перевірку працездатності
- `--timeout <ms>`: тайм-аут запиту (типово: `15000`)
- `--json`: структурований вивід для порівняння

Параметри discovery:

- `--include-local`: включати Gateway, які інакше були б відфільтровані як “local”
- `--timeout <ms>`: загальне вікно виявлення (типово: `2000`)
- `--json`: структурований вивід для порівняння

Порада: порівняйте з `openclaw gateway discover --json`, щоб побачити, чи відрізняється
конвеєр виявлення застосунку macOS (`local.` плюс налаштований wide-area домен із
резервними варіантами wide-area і Tailscale Serve) від
виявлення на основі `dns-sd` у Node CLI.

## Внутрішня логіка віддаленого підключення (SSH-тунелі)

Коли застосунок macOS працює в режимі **Remote**, він відкриває SSH-тунель, щоб локальні компоненти UI
могли спілкуватися з віддаленим Gateway так, ніби він працює на localhost.

### Керувальний тунель (порт WebSocket Gateway)

- **Призначення:** перевірки працездатності, стан, Web Chat, конфігурація та інші виклики площини керування.
- **Локальний порт:** порт Gateway (типово `18789`), завжди стабільний.
- **Віддалений порт:** той самий порт Gateway на віддаленому хості.
- **Поведінка:** без випадкового локального порту; застосунок повторно використовує наявний справний тунель
  або перезапускає його за потреби.
- **Форма SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` з параметрами BatchMode +
  ExitOnForwardFailure + keepalive.
- **Звітування про IP:** SSH-тунель використовує loopback, тому Gateway бачитиме IP
  Node як `127.0.0.1`. Використовуйте транспорт **Direct (ws/wss)**, якщо хочете, щоб відображалася справжня IP-адреса
  клієнта (див. [віддалений доступ macOS](/uk/platforms/mac/remote)).

Кроки налаштування див. у [віддалений доступ macOS](/uk/platforms/mac/remote). Докладніше про протокол
див. у [протокол Gateway](/uk/gateway/protocol).

## Пов’язані документи

- [Інструкція з Gateway](/uk/gateway)
- [Gateway (macOS)](/uk/platforms/mac/bundled-gateway)
- [Дозволи macOS](/uk/platforms/mac/permissions)
- [Canvas](/uk/platforms/mac/canvas)
