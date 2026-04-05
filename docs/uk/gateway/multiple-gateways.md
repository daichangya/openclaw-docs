---
read_when:
    - Запуск більше ніж одного Gateway на тій самій машині
    - Вам потрібні ізольовані config/state/ports для кожного Gateway
summary: Запуск кількох Gateway OpenClaw на одному хості (ізоляція, порти та профілі)
title: Кілька Gateway
x-i18n:
    generated_at: "2026-04-05T18:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Кілька Gateway (один хост)

У більшості випадків достатньо одного Gateway, оскільки один Gateway може обробляти кілька підключень до месенджерів і агентів. Якщо вам потрібна сильніша ізоляція або резервування (наприклад, rescue bot), запускайте окремі Gateway з ізольованими профілями/портами.

## Контрольний список ізоляції (обов’язково)

- `OPENCLAW_CONFIG_PATH` — окремий файл конфігурації для кожного екземпляра
- `OPENCLAW_STATE_DIR` — окремі сесії, creds, кеші для кожного екземпляра
- `agents.defaults.workspace` — окремий корінь workspace для кожного екземпляра
- `gateway.port` (або `--port`) — унікальний для кожного екземпляра
- Похідні порти (browser/canvas) не повинні перетинатися

Якщо ці значення спільні, ви зіткнетеся з гонками конфігурації та конфліктами портів.

## Рекомендовано: профілі (`--profile`)

Профілі автоматично задають область дії для `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` і додають суфікси до назв сервісів.

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Сервіси для окремих профілів:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Посібник для rescue bot

Запустіть другий Gateway на тому самому хості з окремими:

- profile/config
- state dir
- workspace
- базовим портом (і похідними портами)

Це зберігає rescue bot ізольованим від основного бота, щоб він міг налагоджувати або застосовувати зміни конфігурації, якщо основний бот недоступний.

Інтервал між портами: залишайте щонайменше 20 портів між базовими портами, щоб похідні порти browser/canvas/CDP ніколи не конфліктували.

### Як установити (rescue bot)

```bash
# Main bot (existing or fresh, without --profile param)
# Runs on port 18789 + Chrome CDC/Canvas/... Ports
openclaw onboard
openclaw gateway install

# Rescue bot (isolated profile + ports)
openclaw --profile rescue onboard
# Notes:
# - workspace name will be postfixed with -rescue per default
# - Port should be at least 18789 + 20 Ports,
#   better choose completely different base port, like 19789,
# - rest of the onboarding is the same as normal

# To install the service (if not happened automatically during setup)
openclaw --profile rescue gateway install
```

## Відображення портів (похідні)

Базовий порт = `gateway.port` (або `OPENCLAW_GATEWAY_PORT` / `--port`).

- порт сервісу керування browser = базовий + 2 (лише loopback)
- canvas host обслуговується на HTTP-сервері Gateway (той самий порт, що й `gateway.port`)
- порти Browser profile CDP автоматично виділяються з діапазону `browser.controlPort + 9 .. + 108`

Якщо ви перевизначаєте будь-що з цього в config або env, ви маєте зберігати унікальність для кожного екземпляра.

## Примітки щодо Browser/CDP (поширена пастка)

- **Не** фіксуйте `browser.cdpUrl` на однакових значеннях у кількох екземплярах.
- Кожному екземпляру потрібен власний порт керування browser і власний діапазон CDP (похідний від порту gateway).
- Якщо вам потрібні явні порти CDP, задайте `browser.profiles.<name>.cdpPort` для кожного екземпляра.
- Віддалений Chrome: використовуйте `browser.profiles.<name>.cdpUrl` (для кожного профілю, для кожного екземпляра).

## Приклад із ручним env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Швидкі перевірки

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Тлумачення:

- `gateway status --deep` допомагає виявити застарілі сервіси launchd/systemd/schtasks від попередніх установлень.
- Попередження `gateway probe`, такі як `multiple reachable gateways detected`, очікувані лише тоді, коли ви свідомо запускаєте більше ніж один ізольований gateway.
