---
read_when:
    - Реалізація функцій застосунку macOS
    - Зміна життєвого циклу gateway або мосту вузла в macOS
summary: Супутній застосунок OpenClaw для macOS (рядок меню + брокер gateway)
title: Застосунок macOS
x-i18n:
    generated_at: "2026-04-05T18:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# Супутній застосунок OpenClaw для macOS (рядок меню + брокер gateway)

Застосунок macOS — це **супутній застосунок у рядку меню** для OpenClaw. Він керує дозволами,
керує Gateway локально або підключається до нього (launchd або вручну), а також надає можливості macOS
агенту як вузол.

## Що він робить

- Показує нативні сповіщення та стан у рядку меню.
- Керує запитами TCC (сповіщення, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript).
- Запускає Gateway або підключається до нього (локального чи віддаленого).
- Надає інструменти лише для macOS (Canvas, Camera, Screen Recording, `system.run`).
- Запускає локальний сервіс хоста вузла в режимі **remote** (launchd) і зупиняє його в режимі **local**.
- За потреби розміщує **PeekabooBridge** для UI-автоматизації.
- Встановлює глобальний CLI (`openclaw`) на запит через npm, pnpm або bun (застосунок надає перевагу npm, потім pnpm, потім bun; Node залишається рекомендованим середовищем виконання для Gateway).

## Режим local і remote

- **Local** (типово): застосунок підключається до запущеного локального Gateway, якщо він є;
  інакше вмикає сервіс launchd через `openclaw gateway install`.
- **Remote**: застосунок підключається до Gateway через SSH/Tailscale і ніколи не запускає
  локальний процес.
  Застосунок запускає локальний **сервіс хоста вузла**, щоб віддалений Gateway міг звертатися до цього Mac.
  Застосунок не запускає Gateway як дочірній процес.
  Виявлення Gateway тепер надає перевагу іменам Tailscale MagicDNS замість сирих IP tailnet,
  тому застосунок Mac надійніше відновлюється, коли IP tailnet змінюються.

## Керування Launchd

Застосунок керує LaunchAgent для кожного користувача з міткою `ai.openclaw.gateway`
(або `ai.openclaw.<profile>` при використанні `--profile`/`OPENCLAW_PROFILE`; застарілі `com.openclaw.*` також вивантажуються).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Замініть мітку на `ai.openclaw.<profile>`, якщо використовуєте іменований профіль.

Якщо LaunchAgent не встановлено, увімкніть його із застосунку або виконайте
`openclaw gateway install`.

## Можливості вузла (mac)

Застосунок macOS представляє себе як вузол. Типові команди:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.record`
- System: `system.run`, `system.notify`

Вузол повідомляє мапу `permissions`, щоб агенти могли визначати, що дозволено.

Сервіс вузла + IPC застосунку:

- Коли працює безголовий сервіс хоста вузла (режим remote), він підключається до Gateway WS як вузол.
- `system.run` виконується в застосунку macOS (контекст UI/TCC) через локальний Unix socket; запити підтвердження та вивід залишаються в застосунку.

Діаграма (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Підтвердження виконання (system.run)

`system.run` контролюється через **Exec approvals** у застосунку macOS (Settings → Exec approvals).
Security + ask + allowlist зберігаються локально на Mac у:

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

- Записи `allowlist` — це glob-шаблони для визначених шляхів до двійкових файлів.
- Необроблений текст команди оболонки, що містить синтаксис керування оболонкою або розгортання (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), вважається промахом `allowlist` і потребує явного підтвердження (або додавання двійкового файла оболонки до allowlist).
- Вибір “Always Allow” у запиті додає цю команду до allowlist.
- Перевизначення середовища `system.run` фільтруються (відкидаються `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), а потім об’єднуються із середовищем застосунку.
- Для оболонкових обгорток (`bash|sh|zsh ... -c/-lc`) перевизначення середовища в межах запиту зводяться до невеликого явного allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Для рішень allow-always у режимі allowlist відомі обгортки диспетчеризації (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) зберігають внутрішні шляхи виконуваних файлів замість шляхів обгорток. Якщо безпечне розгортання неможливе, запис до allowlist автоматично не зберігається.

## Глибокі посилання

Застосунок реєструє схему URL `openclaw://` для локальних дій.

### `openclaw://agent`

Запускає запит `agent` до Gateway.
__OC_I18N_900004__
Параметри запиту:

- `message` (обов’язковий)
- `sessionKey` (необов’язковий)
- `thinking` (необов’язковий)
- `deliver` / `to` / `channel` (необов’язкові)
- `timeoutSeconds` (необов’язковий)
- `key` (необов’язковий ключ режиму без нагляду)

Безпека:

- Без `key` застосунок запитує підтвердження.
- Без `key` застосунок застосовує коротке обмеження на довжину повідомлення для запиту підтвердження та ігнорує `deliver` / `to` / `channel`.
- Із чинним `key` виконання відбувається без нагляду (призначено для персональних автоматизацій).

## Потік початкового налаштування (типовий)

1. Встановіть і запустіть **OpenClaw.app**.
2. Завершіть контрольний список дозволів (запити TCC).
3. Переконайтеся, що активний режим **Local** і Gateway працює.
4. Встановіть CLI, якщо вам потрібен доступ із термінала.

## Розміщення каталогу стану (macOS)

Уникайте розміщення каталогу стану OpenClaw в iCloud або інших папках із хмарною синхронізацією.
Шляхи з синхронізацією можуть додавати затримку і час від часу спричиняти конфлікти блокування файлів або синхронізації для
сеансів і облікових даних.

Надавайте перевагу локальному шляху стану без синхронізації, наприклад:
__OC_I18N_900005__
Якщо `openclaw doctor` виявить стан у:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

він покаже попередження та порекомендує повернутися до локального шляху.

## Збірка та процес розробки (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (або Xcode)
- Пакування застосунку: `scripts/package-mac-app.sh`

## Налагодження підключення до gateway (CLI macOS)

Використовуйте CLI для налагодження, щоб перевірити той самий handshake WebSocket Gateway і логіку виявлення,
які використовує застосунок macOS, без запуску самого застосунку.
__OC_I18N_900006__
Параметри connect:

- `--url <ws://host:port>`: перевизначити конфігурацію
- `--mode <local|remote>`: визначити з конфігурації (типово: конфігурація або local)
- `--probe`: примусово виконати нову перевірку стану
- `--timeout <ms>`: час очікування запиту (типово: `15000`)
- `--json`: структурований вивід для порівняння

Параметри discovery:

- `--include-local`: включити gateway, які було б відфільтровано як “local”
- `--timeout <ms>`: загальне вікно виявлення (типово: `2000`)
- `--json`: структурований вивід для порівняння

Порада: порівняйте з `openclaw gateway discover --json`, щоб побачити, чи
конвеєр виявлення застосунку macOS (`local.` плюс налаштований wide-area домен, з
резервними варіантами wide-area і Tailscale Serve) відрізняється від
виявлення на основі `dns-sd` у Node CLI.

## Внутрішня логіка віддаленого підключення (SSH-тунелі)

Коли застосунок macOS працює в режимі **Remote**, він відкриває SSH-тунель, щоб локальні UI-компоненти
могли звертатися до віддаленого Gateway так, ніби він працює на localhost.

### Керувальний тунель (порт WebSocket Gateway)

- **Призначення:** перевірки стану, status, Web Chat, конфігурація та інші виклики площини керування.
- **Локальний порт:** порт Gateway (типово `18789`), завжди стабільний.
- **Віддалений порт:** той самий порт Gateway на віддаленому хості.
- **Поведінка:** без випадкового локального порту; застосунок повторно використовує наявний справний тунель
  або перезапускає його за потреби.
- **Форма SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` з параметрами BatchMode +
  ExitOnForwardFailure + keepalive.
- **Звітність IP:** SSH-тунель використовує loopback, тому gateway бачитиме IP вузла
  як `127.0.0.1`. Якщо ви хочете, щоб відображалась справжня IP-адреса клієнта, використовуйте транспорт **Direct (ws/wss)**
  (див. [віддалений доступ macOS](/platforms/mac/remote)).

Кроки налаштування див. у [віддалений доступ macOS](/platforms/mac/remote). Подробиці
протоколу див. у [протокол Gateway](/uk/gateway/protocol).

## Пов’язана документація

- [Інструкція з експлуатації Gateway](/uk/gateway)
- [Gateway (macOS)](/uk/platforms/mac/bundled-gateway)
- [Дозволи macOS](/platforms/mac/permissions)
- [Canvas](/uk/platforms/mac/canvas)
