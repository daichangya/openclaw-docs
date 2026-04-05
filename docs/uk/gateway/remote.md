---
read_when:
    - Запускаєте або налагоджуєте віддалені конфігурації gateway
summary: Віддалений доступ за допомогою SSH-тунелів (Gateway WS) і tailnet
title: Віддалений доступ
x-i18n:
    generated_at: "2026-04-05T18:04:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# Віддалений доступ (SSH, тунелі та tailnet)

Цей репозиторій підтримує «віддалену роботу через SSH», коли один Gateway (головний) працює на виділеному хості (desktop/server), а клієнти підключаються до нього.

- Для **операторів (вас / застосунку macOS)**: SSH-тунелювання є універсальним резервним варіантом.
- Для **вузлів (iOS/Android і майбутніх пристроїв)**: підключайтеся до **WebSocket** Gateway (LAN/tailnet або SSH-тунель за потреби).

## Основна ідея

- Gateway WebSocket прив’язується до **loopback** на налаштованому порту (типово 18789).
- Для віддаленого використання ви пересилаєте цей loopback-порт через SSH (або використовуєте tailnet/VPN і менше покладаєтеся на тунелі).

## Типові конфігурації VPN/tailnet (де живе агент)

Думайте про **хост Gateway** як про місце, «де живе агент». Він володіє сесіями, профілями auth, каналами та станом.
Ваш laptop/desktop (і вузли) підключаються до цього хоста.

### 1) Завжди увімкнений Gateway у вашому tailnet (VPS або домашній сервер)

Запустіть Gateway на постійному хості та звертайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залиште `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для Control UI.
- **Резервний варіант:** залиште loopback + SSH-тунель з будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/install/exe-dev) (простий VM) або [Hetzner](/install/hetzner) (production VPS).

Це ідеально, коли ваш laptop часто засинає, але ви хочете, щоб агент був завжди активним.

### 2) Домашній desktop запускає Gateway, laptop є віддаленим керуванням

Laptop **не** запускає агента. Він підключається віддалено:

- Використовуйте режим застосунку macOS **Remote over SSH** (Settings → General → “OpenClaw runs”).
- Застосунок відкриває й керує тунелем, тож WebChat + перевірки стану «просто працюють».

Інструкція: [macOS remote access](/platforms/mac/remote).

### 3) Laptop запускає Gateway, віддалений доступ з інших машин

Залиште Gateway локальним, але безпечно надайте до нього доступ:

- SSH-тунель до laptop з інших машин, або
- Tailscale Serve для Control UI і loopback-only для Gateway.

Посібник: [Tailscale](/gateway/tailscale) і [Web overview](/web).

## Потік команд (що запускається де)

Один сервіс gateway володіє станом і каналами. Вузли є периферією.

Приклад потоку (Telegram → вузол):

- Повідомлення Telegram надходить до **Gateway**.
- Gateway запускає **агента** і вирішує, чи викликати інструмент вузла.
- Gateway викликає **вузол** через Gateway WebSocket (`node.*` RPC).
- Вузол повертає результат; Gateway надсилає відповідь назад у Telegram.

Примітки:

- **Вузли не запускають сервіс gateway.** На хості має працювати лише один gateway, якщо ви свідомо не запускаєте ізольовані профілі (див. [Multiple gateways](/gateway/multiple-gateways)).
- «Режим вузла» в застосунку macOS — це просто клієнт вузла поверх Gateway WebSocket.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель активний:

- `openclaw health` і `openclaw status --deep` тепер звертаються до віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть націлюватися на переспрямований URL через `--url`, коли це потрібно.

Примітка: замініть `18789` на ваш налаштований `gateway.port` (або `--port`/`OPENCLAW_GATEWAY_PORT`).
Примітка: коли ви передаєте `--url`, CLI не використовує резервні облікові дані з config чи середовища.
Явно вкажіть `--token` або `--password`. Відсутність явних облікових даних є помилкою.

## Типові віддалені значення CLI

Ви можете зберегти віддалену ціль, щоб команди CLI використовували її типово:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Коли gateway доступний лише через loopback, залишайте URL як `ws://127.0.0.1:18789` і спочатку відкривайте SSH-тунель.

## Пріоритет облікових даних

Розв’язання облікових даних Gateway дотримується єдиного спільного контракту для шляхів call/probe/status і моніторингу Discord exec-approval. Node-host використовує той самий базовий контракт з одним винятком для local mode (він навмисно ігнорує `gateway.remote.*`):

- Явні облікові дані (`--token`, `--password` або інструмент `gatewayToken`) завжди мають пріоритет у шляхах виклику, які приймають явну auth.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не використовують неявні облікові дані з config/env.
  - Перевизначення URL через env (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові значення local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (резервне значення remote застосовується лише тоді, коли локальне значення auth token не задано)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (резервне значення remote застосовується лише тоді, коли локальне значення auth password не задано)
- Типові значення remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток node-host для local mode: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token для remote probe/status типово суворі: вони використовують лише `gateway.remote.token` (без резервного локального token) при націлюванні на remote mode.
- Перевизначення середовища Gateway використовують лише `OPENCLAW_GATEWAY_*`.

## Chat UI через SSH

WebChat більше не використовує окремий HTTP-порт. SwiftUI chat UI підключається напряму до Gateway WebSocket.

- Переспрямуйте `18789` через SSH (див. вище), а потім підключайте клієнтів до `ws://127.0.0.1:18789`.
- На macOS віддавайте перевагу режиму застосунку “Remote over SSH”, який автоматично керує тунелем.

## Застосунок macOS "Remote over SSH"

Застосунок macOS у меню може керувати тією самою конфігурацією від початку до кінця (віддалені перевірки стану, WebChat і переадресація Voice Wake).

Інструкція: [macOS remote access](/platforms/mac/remote).

## Правила безпеки (remote/VPN)

Коротко: **залишайте Gateway доступним лише через loopback**, якщо ви не впевнені, що вам потрібна інша прив’язка.

- **Loopback + SSH/Tailscale Serve** — найбезпечніший типовий варіант (без публічного доступу).
- Простий `ws://` типово призначений лише для loopback. Для довірених приватних мереж
  задайте `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як аварійний варіант.
- **Прив’язки не до loopback** (`lan`/`tailnet`/`custom` або `auto`, коли loopback недоступний) мають використовувати auth gateway: token, password або reverse proxy з підтримкою ідентичності через `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони самі по собі **не** налаштовують server auth.
- Локальні шляхи call можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і вони не розв’язуються, розв’язання завершується із закритою відмовою (без приховування через remote fallback).
- `gateway.remote.tlsFingerprint` фіксує сертифікат TLS remote при використанні `wss://`.
- **Tailscale Serve** може автентифікувати трафік Control UI/WebSocket через заголовки ідентичності, коли `gateway.auth.allowTailscale: true`; HTTP API endpoints не
  використовують цю auth через заголовки Tailscale, а натомість дотримуються звичайного HTTP
  режиму auth gateway. Цей безтокеновий потік припускає, що хост gateway є довіреним. Задайте це значення як
  `false`, якщо хочете використовувати auth зі спільним секретом усюди.
- Auth через **trusted-proxy** призначено лише для конфігурацій з proxy поза loopback і з підтримкою ідентичності.
  Reverse proxy на loopback на тому самому хості не задовольняють `gateway.auth.mode: "trusted-proxy"`.
- Розглядайте браузерне керування як операторський доступ: лише tailnet + навмисне pairing вузлів.

Докладніше: [Security](/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, що підключаються до віддаленого gateway, найпростіша постійна конфігурація використовує запис SSH `LocalForward` у config плюс LaunchAgent, який підтримує тунель активним після перезавантажень і збоїв.

#### Крок 1: додайте SSH config

Відредагуйте `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Замініть `<REMOTE_IP>` і `<REMOTE_USER>` на ваші значення.

#### Крок 2: скопіюйте SSH-ключ (одноразово)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Крок 3: налаштуйте token gateway

Збережіть token у config, щоб він зберігався після перезапусків:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Крок 4: створіть LaunchAgent

Збережіть це як `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Крок 5: завантажте LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Тунель автоматично запускатиметься під час входу в систему, перезапускатиметься після збоїв і підтримуватиме переспрямований порт активним.

Примітка: якщо у вас залишився `com.openclaw.ssh-tunnel` LaunchAgent зі старішої конфігурації, вивантажте його та видаліть.

#### Усунення проблем

Перевірте, чи працює тунель:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Перезапустіть тунель:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Зупиніть тунель:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Запис config                          | Що він робить                                                |
| ------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`  | Переспрямовує локальний порт 18789 на віддалений порт 18789  |
| `ssh -N`                              | SSH без виконання віддалених команд (лише переспрямування порту) |
| `KeepAlive`                           | Автоматично перезапускає тунель, якщо він аварійно завершується |
| `RunAtLoad`                           | Запускає тунель, коли LaunchAgent завантажується під час входу |
