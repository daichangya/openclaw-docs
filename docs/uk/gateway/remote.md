---
read_when:
    - Запуск або усунення несправностей віддалених налаштувань Gateway
summary: Віддалений доступ за допомогою SSH-тунелів (Gateway WS) і tailnet-мереж
title: Віддалений доступ
x-i18n:
    generated_at: "2026-04-24T06:45:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# Віддалений доступ (SSH, тунелі та tailnet-мережі)

Цей репозиторій підтримує «віддалену роботу через SSH», якщо один Gateway (головний) постійно працює на виділеному хості (desktop/server), а клієнти підключаються до нього.

- Для **операторів (вас / застосунку macOS)**: SSH-тунелювання — універсальний резервний варіант.
- Для **Node (iOS/Android і майбутніх пристроїв)**: підключення до **WebSocket** Gateway (LAN/tailnet або SSH-тунель за потреби).

## Основна ідея

- Gateway WebSocket прив’язується до **loopback** на налаштованому порту (типово 18789).
- Для віддаленого використання ви переспрямовуєте цей loopback-порт через SSH (або використовуєте tailnet/VPN і менше покладаєтеся на тунелі).

## Поширені налаштування VPN/tailnet (де живе агент)

Думайте про **хост Gateway** як про місце, «де живе агент». Він володіє сеансами, профілями автентифікації, каналами та станом.
Ваш laptop/desktop (і Node) підключаються до цього хоста.

### 1) Постійно ввімкнений Gateway у вашій tailnet-мережі (VPS або домашній сервер)

Запустіть Gateway на постійному хості та підключайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залиште `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для UI керування.
- **Резервний варіант:** залиште loopback + SSH-тунель із будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (простий VM) або [Hetzner](/uk/install/hetzner) (production VPS).

Це ідеально, якщо ваш laptop часто переходить у сон, але ви хочете, щоб агент був постійно ввімкнений.

### 2) Домашній desktop запускає Gateway, laptop використовується для віддаленого керування

Laptop **не** запускає агент. Він підключається віддалено:

- Використовуйте режим **Remote over SSH** у застосунку macOS (Settings → General → “OpenClaw runs”).
- Застосунок відкриває та керує тунелем, тому WebChat і перевірки стану «просто працюють».

Інструкція: [віддалений доступ macOS](/uk/platforms/mac/remote).

### 3) Laptop запускає Gateway, віддалений доступ з інших машин

Залиште Gateway локальним, але безпечно відкрийте до нього доступ:

- SSH-тунель до laptop з інших машин, або
- Tailscale Serve для UI керування, залишаючи Gateway доступним лише через loopback.

Посібник: [Tailscale](/uk/gateway/tailscale) і [огляд Web](/uk/web).

## Потік команд (що де запускається)

Один сервіс gateway володіє станом і каналами. Node — це периферія.

Приклад потоку (Telegram → node):

- Повідомлення Telegram надходить до **Gateway**.
- Gateway запускає **агента** і вирішує, чи викликати інструмент node.
- Gateway викликає **node** через Gateway WebSocket (`node.*` RPC).
- Node повертає результат; Gateway надсилає відповідь назад у Telegram.

Примітки:

- **Node не запускають сервіс gateway.** На одному хості має працювати лише один gateway, якщо ви свідомо не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)).
- «Режим node» у застосунку macOS — це просто клієнт node через Gateway WebSocket.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель активний:

- `openclaw health` і `openclaw status --deep` тепер звертаються до віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть звертатися до переспрямованого URL через `--url`, якщо потрібно.

Примітка: замініть `18789` на налаштований `gateway.port` (або `--port`/`OPENCLAW_GATEWAY_PORT`).
Примітка: коли ви передаєте `--url`, CLI не використовує резервне отримання облікових даних із конфігурації або змінних середовища.
Явно вкажіть `--token` або `--password`. Відсутність явно вказаних облікових даних — це помилка.

## Типові віддалені налаштування CLI

Ви можете зберегти віддалену ціль, щоб CLI-команди використовували її типово:

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

Визначення облікових даних Gateway дотримується єдиного спільного контракту для шляхів call/probe/status і моніторингу Discord exec-approval. Node-host використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явно вказані облікові дані (`--token`, `--password` або `gatewayToken` інструмента) завжди мають пріоритет у шляхах call, які приймають явну автентифікацію.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не використовують неявні облікові дані з конфігурації/змінних середовища.
  - Перевизначення URL через змінні середовища (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані зі змінних середовища (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові значення локального режиму:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (резервне використання remote застосовується, лише якщо вхідне значення token для локальної автентифікації не задано)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (резервне використання remote застосовується, лише якщо вхідне значення password для локальної автентифікації не задано)
- Типові значення віддаленого режиму:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму Node-host: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token для віддалених probe/status за замовчуванням суворі: вони використовують лише `gateway.remote.token` (без резервного використання локального token) при націлюванні на віддалений режим.
- Перевизначення середовища Gateway використовують лише `OPENCLAW_GATEWAY_*`.

## Chat UI через SSH

WebChat більше не використовує окремий HTTP-порт. SwiftUI chat UI підключається безпосередньо до Gateway WebSocket.

- Переспрямуйте `18789` через SSH (див. вище), а потім підключайте клієнти до `ws://127.0.0.1:18789`.
- На macOS віддавайте перевагу режиму «Remote over SSH» у застосунку, який автоматично керує тунелем.

## «Remote over SSH» у застосунку macOS

Застосунок macOS у рядку меню може повністю керувати тим самим сценарієм (віддалені перевірки стану, WebChat і переспрямування Voice Wake).

Інструкція: [віддалений доступ macOS](/uk/platforms/mac/remote).

## Правила безпеки (remote/VPN)

Коротко: **залишайте Gateway доступним лише через loopback**, якщо ви не впевнені, що вам потрібна прив’язка.

- **Loopback + SSH/Tailscale Serve** — найбезпечніший типовий варіант (без публічного доступу).
- Plaintext `ws://` типово дозволений лише для loopback. Для довірених приватних мереж
  установіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як
  аварійний виняток. Еквівалента в `openclaw.json` немає; це має бути змінна
  середовища процесу для клієнта, який виконує WebSocket-з’єднання.
- **Прив’язки не до loopback** (`lan`/`tailnet`/`custom` або `auto`, коли loopback недоступний) мають використовувати автентифікацію gateway: token, password або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони **не** налаштовують автентифікацію сервера самі по собі.
- Локальні шляхи call можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовані через SecretRef і не можуть бути визначені, визначення завершується в закритому режимі (без маскування через резервний remote).
- `gateway.remote.tlsFingerprint` закріплює сертифікат TLS віддаленого вузла при використанні `wss://`.
- **Tailscale Serve** може автентифікувати трафік UI/WebSocket керування через identity
  headers, якщо `gateway.auth.allowTailscale: true`; кінцеві точки HTTP API не
  використовують цю автентифікацію заголовками Tailscale і натомість дотримуються
  звичайного режиму HTTP-автентифікації gateway. Цей безтокеновий потік передбачає,
  що хост gateway є довіреним. Установіть `false`, якщо хочете автентифікацію
  через спільний секрет усюди.
- Автентифікація **trusted-proxy** призначена лише для конфігурацій identity-aware proxy не на loopback.
  Reverse proxy на тому самому хості через loopback не задовольняють вимогу `gateway.auth.mode: "trusted-proxy"`.
- Розглядайте керування з браузера як операторський доступ: лише tailnet + свідоме спарювання Node.

Докладніше: [Безпека](/uk/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, які підключаються до віддаленого gateway, найпростішим постійним варіантом є запис SSH `LocalForward` у конфігурації разом із LaunchAgent, який підтримує тунель активним після перезавантажень і збоїв.

#### Крок 1: додайте SSH-конфігурацію

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

Збережіть token у конфігурації, щоб він зберігався після перезапусків:

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

Тунель автоматично запускатиметься під час входу в систему, перезапускатиметься після збою та підтримуватиме переспрямований порт активним.

Примітка: якщо у вас залишився LaunchAgent `com.openclaw.ssh-tunnel` зі старішого налаштування, вивантажте та видаліть його.

#### Усунення несправностей

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

| Запис конфігурації                    | Що він робить                                                |
| ------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`  | Переспрямовує локальний порт 18789 на віддалений порт 18789  |
| `ssh -N`                              | SSH без виконання віддалених команд (лише переспрямування портів) |
| `KeepAlive`                           | Автоматично перезапускає тунель, якщо він падає              |
| `RunAtLoad`                           | Запускає тунель, коли LaunchAgent завантажується під час входу |

## Пов’язане

- [Tailscale](/uk/gateway/tailscale)
- [Автентифікація](/uk/gateway/authentication)
- [Налаштування віддаленого gateway](/uk/gateway/remote-gateway-readme)
