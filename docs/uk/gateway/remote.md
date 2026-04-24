---
read_when:
    - Запуск або усунення несправностей віддалених конфігурацій gateway
summary: Віддалений доступ через тунелі SSH (Gateway WS) і tailnet
title: Віддалений доступ
x-i18n:
    generated_at: "2026-04-24T03:17:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3753f29d6b3cc3f1a2f749cc0fdfdd60dfde8822f0ec6db0e18e5412de0980da
    source_path: gateway/remote.md
    workflow: 15
---

# Віддалений доступ (SSH, тунелі та tailnet)

Цей репозиторій підтримує “віддалено через SSH”, зберігаючи один Gateway (основний) запущеним на виділеному хості (desktop/server) і підключаючи до нього клієнтів.

- Для **операторів (вас / macOS app)**: SSH-тунелювання є універсальним резервним варіантом.
- Для **вузлів (iOS/Android і майбутніх пристроїв)**: підключайтеся до **WebSocket** Gateway (LAN/tailnet або через SSH-тунель за потреби).

## Основна ідея

- WebSocket Gateway прив’язується до **loopback** на налаштованому порту (типово 18789).
- Для віддаленого використання ви переспрямовуєте цей loopback-порт через SSH (або використовуєте tailnet/VPN і менше покладаєтеся на тунелі).

## Поширені конфігурації VPN/tailnet (де живе агент)

Думайте про **хост Gateway** як про “місце, де живе агент”. Він володіє сесіями, профілями автентифікації, каналами та станом.
Ваш ноутбук/desktop (і вузли) підключаються до цього хоста.

### 1) Завжди активний Gateway у вашому tailnet (VPS або домашній сервер)

Запустіть Gateway на постійному хості та звертайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залишайте `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для Control UI.
- **Резервний варіант:** залишайте loopback + SSH-тунель з будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (проста VM) або [Hetzner](/uk/install/hetzner) (production VPS).

Це ідеально, коли ваш ноутбук часто засинає, але ви хочете, щоб агент завжди був активним.

### 2) Домашній desktop запускає Gateway, ноутбук виконує віддалене керування

Ноутбук **не** запускає агента. Він підключається віддалено:

- Використовуйте режим macOS app **Remote over SSH** (Settings → General → “OpenClaw runs”).
- Застосунок відкриває та керує тунелем, тому WebChat + перевірки стану “просто працюють”.

Інструкція: [Віддалений доступ macOS](/uk/platforms/mac/remote).

### 3) Ноутбук запускає Gateway, віддалений доступ з інших машин

Залишайте Gateway локальним, але безпечно відкрийте до нього доступ:

- SSH-тунель до ноутбука з інших машин, або
- опублікуйте Control UI через Tailscale Serve і залишайте Gateway доступним лише через loopback.

Посібник: [Tailscale](/uk/gateway/tailscale) і [Огляд Web](/uk/web).

## Потік команд (що де запускається)

Один сервіс gateway володіє станом + каналами. Вузли — це периферія.

Приклад потоку (Telegram → вузол):

- Повідомлення Telegram надходить до **Gateway**.
- Gateway запускає **агента** і вирішує, чи викликати інструмент вузла.
- Gateway викликає **вузол** через WebSocket Gateway (`node.*` RPC).
- Вузол повертає результат; Gateway надсилає відповідь назад до Telegram.

Примітки:

- **Вузли не запускають сервіс gateway.** На хост зазвичай слід запускати лише один gateway, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)).
- “Режим вузла” macOS app — це лише клієнт вузла через WebSocket Gateway.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель активний:

- `openclaw health` і `openclaw status --deep` тепер звертаються до віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть за потреби звертатися до переспрямованого URL через `--url`.

Примітка: замініть `18789` на ваш налаштований `gateway.port` (або `--port`/`OPENCLAW_GATEWAY_PORT`).
Примітка: коли ви передаєте `--url`, CLI не повертається до облікових даних з конфігурації чи середовища.
Явно вкажіть `--token` або `--password`. Відсутність явно заданих облікових даних є помилкою.

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

Визначення облікових даних Gateway дотримується одного спільного контракту для шляхів call/probe/status і моніторингу Discord exec-approval. Хост вузла використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явні облікові дані (`--token`, `--password` або інструмент `gatewayToken`) завжди мають пріоритет у шляхах виклику, які приймають явну автентифікацію.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не використовують неявні облікові дані з конфігурації/env.
  - Перевизначення URL через env (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані з env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові значення локального режиму:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (резервний віддалений варіант застосовується лише тоді, коли локальний вхідний токен автентифікації не задано)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (резервний віддалений варіант застосовується лише тоді, коли локальний вхідний пароль автентифікації не задано)
- Типові значення віддаленого режиму:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму хоста вузла: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token для віддалених probe/status за замовчуванням суворі: вони використовують лише `gateway.remote.token` (без резервного локального token) при націлюванні на віддалений режим.
- Перевизначення Gateway через env використовують лише `OPENCLAW_GATEWAY_*`.

## Chat UI через SSH

WebChat більше не використовує окремий HTTP-порт. Інтерфейс чату SwiftUI підключається безпосередньо до WebSocket Gateway.

- Переспрямуйте `18789` через SSH (див. вище), а потім підключайте клієнти до `ws://127.0.0.1:18789`.
- На macOS надавайте перевагу режиму застосунку “Remote over SSH”, який керує тунелем автоматично.

## macOS app "Remote over SSH"

Застосунок рядка меню macOS може повністю керувати цією конфігурацією (віддалені перевірки стану, WebChat і переспрямування Voice Wake).

Інструкція: [Віддалений доступ macOS](/uk/platforms/mac/remote).

## Правила безпеки (remote/VPN)

Коротко: **залишайте Gateway доступним лише через loopback**, якщо ви точно не впевнені, що вам потрібна прив’язка.

- **Loopback + SSH/Tailscale Serve** — найбезпечніший типовий варіант (без публічного доступу).
- Відкритий `ws://` типово дозволений лише для loopback. Для довірених приватних мереж
  установіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як аварійний варіант.
- **Не-loopback прив’язки** (`lan`/`tailnet`/`custom` або `auto`, коли loopback недоступний) повинні використовувати автентифікацію gateway: token, password або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони **самі по собі** не налаштовують автентифікацію сервера.
- Локальні шляхи виклику можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не визначено, визначення завершується в закритому режимі (без маскування резервним віддаленим варіантом).
- `gateway.remote.tlsFingerprint` закріплює віддалений TLS-сертифікат при використанні `wss://`.
- **Tailscale Serve** може автентифікувати трафік Control UI/WebSocket через заголовки
  ідентичності, коли `gateway.auth.allowTailscale: true`; endpoint HTTP API не
  використовують цю автентифікацію заголовками Tailscale і натомість дотримуються
  звичайного режиму HTTP-автентифікації gateway. Цей безтокеновий потік припускає, що хост gateway є довіреним. Установіть `false`, якщо ви хочете спільну секретну автентифікацію всюди.
- Автентифікація **trusted-proxy** призначена лише для конфігурацій не-loopback із proxy з урахуванням ідентичності.
  Reverse proxy на тому самому хості через loopback не задовольняють `gateway.auth.mode: "trusted-proxy"`.
- Ставтеся до керування browser як до операторського доступу: лише tailnet + навмисне спарювання вузлів.

Детальніше: [Безпека](/uk/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, що підключаються до віддаленого gateway, найпростішу постійну конфігурацію забезпечує запис SSH `LocalForward` у config разом із LaunchAgent, щоб тунель залишався активним після перезавантажень і збоїв.

#### Крок 1: додайте конфігурацію SSH

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

Тунель автоматично запускатиметься під час входу, перезапускатиметься після збою та підтримуватиме переспрямований порт активним.

Примітка: якщо у вас залишився LaunchAgent `com.openclaw.ssh-tunnel` зі старішої конфігурації, вивантажте й видаліть його.

#### Усунення несправностей

Перевірте, чи запущено тунель:

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

| Запис конфігурації                   | Що він робить                                                |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Переспрямовує локальний порт 18789 на віддалений порт 18789  |
| `ssh -N`                             | SSH без виконання віддалених команд (лише переспрямування портів) |
| `KeepAlive`                          | Автоматично перезапускає тунель, якщо він аварійно завершується |
| `RunAtLoad`                          | Запускає тунель, коли LaunchAgent завантажується під час входу |

## Пов’язане

- [Tailscale](/uk/gateway/tailscale)
- [Автентифікація](/uk/gateway/authentication)
- [Налаштування віддаленого gateway](/uk/gateway/remote-gateway-readme)
