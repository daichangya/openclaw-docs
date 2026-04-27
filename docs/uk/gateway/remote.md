---
read_when:
    - Запуск або усунення неполадок у віддалених конфігураціях Gateway
summary: Віддалений доступ за допомогою SSH-тунелів (Gateway WS) і tailnet-мереж
title: Віддалений доступ
x-i18n:
    generated_at: "2026-04-27T04:33:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1e618448d797a8003029b263dbab4a5393158c32198623fd9d1e52982567b0a
    source_path: gateway/remote.md
    workflow: 15
---

Цей репозиторій підтримує «віддалений доступ через SSH», зберігаючи один Gateway (головний) запущеним на виділеному хості (настільному ПК/сервері) і підключаючи до нього клієнтів.

- Для **операторів (вас / програми macOS)**: SSH-тунелювання є універсальним резервним варіантом.
- Для **вузлів (iOS/Android і майбутніх пристроїв)**: підключайтеся до **WebSocket** Gateway (LAN/tailnet або через SSH-тунель за потреби).

## Основна ідея

- Gateway WebSocket прив’язується до **loopback** на налаштованому порту (типово `18789`).
- Для віддаленого використання ви переспрямовуєте цей loopback-порт через SSH (або використовуєте tailnet/VPN і менше покладаєтеся на тунелювання).

## Поширені конфігурації VPN і tailnet

Розглядайте **хост Gateway** як місце, де живе агент. Він володіє сеансами, профілями автентифікації, каналами та станом. Ваш ноутбук, настільний ПК і вузли підключаються до цього хоста.

### Завжди увімкнений Gateway у вашій tailnet-мережі

Запустіть Gateway на постійному хості (VPS або домашньому сервері) і звертайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залиште `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для Control UI.
- **Резервний варіант:** залиште loopback і додайте SSH-тунель з будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (проста VM) або [Hetzner](/uk/install/hetzner) (продуктивний VPS).

Ідеально, коли ваш ноутбук часто переходить у режим сну, але ви хочете, щоб агент був постійно ввімкнений.

### Домашній настільний ПК запускає Gateway

Ноутбук **не** запускає агент. Він підключається віддалено:

- Використовуйте режим **Remote over SSH** у програмі macOS (Settings → General → OpenClaw runs).
- Програма відкриває та керує тунелем, тому WebChat і перевірки працездатності працюють без додаткових дій.

Інструкція: [віддалений доступ у macOS](/uk/platforms/mac/remote).

### Ноутбук запускає Gateway

Тримайте Gateway локальним, але безпечно відкрийте до нього доступ:

- SSH-тунель до ноутбука з інших машин, або
- Tailscale Serve для Control UI, залишивши Gateway доступним лише через loopback.

Посібники: [Tailscale](/uk/gateway/tailscale) і [огляд Web](/uk/web).

## Потік команд (що і де запускається)

Один сервіс gateway володіє станом і каналами. Вузли — це периферійні компоненти.

Приклад потоку (Telegram → вузол):

- Повідомлення Telegram надходить до **Gateway**.
- Gateway запускає **агента** і вирішує, чи викликати інструмент вузла.
- Gateway викликає **вузол** через Gateway WebSocket (`node.*` RPC).
- Вузол повертає результат; Gateway надсилає відповідь назад у Telegram.

Примітки:

- **Вузли не запускають сервіс gateway.** На хості має працювати лише один gateway, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)).
- «Режим вузла» у програмі macOS — це просто клієнт вузла через Gateway WebSocket.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель активний:

- `openclaw health` і `openclaw status --deep` тепер звертаються до віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть націлюватися на переспрямовану URL-адресу через `--url`, коли це потрібно.

<Note>
Замініть `18789` на ваш налаштований `gateway.port` (або `--port`, або `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Коли ви передаєте `--url`, CLI не повертається до облікових даних із конфігурації чи середовища. Явно вкажіть `--token` або `--password`. Відсутність явно вказаних облікових даних є помилкою.
</Warning>

## Типові віддалені параметри CLI

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

Коли gateway доступний лише через loopback, залиште URL як `ws://127.0.0.1:18789` і спочатку відкрийте SSH-тунель.
У транспорті SSH-тунелю програми macOS виявлені імена хостів gateway мають бути в
`gateway.remote.sshTarget`; `gateway.remote.url` залишається URL локального тунелю.

## Пріоритет облікових даних

Визначення облікових даних Gateway дотримується єдиного спільного контракту для шляхів call/probe/status і моніторингу підтвердження виконання в Discord. Node-host використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явно вказані облікові дані (`--token`, `--password` або `gatewayToken` інструмента) завжди мають пріоритет у шляхах виклику, які приймають явну автентифікацію.
- Безпечність перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не використовують неявні облікові дані з конфігурації/середовища.
  - Перевизначення URL через середовище (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані із середовища (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові значення локального режиму:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (резервний віддалений варіант застосовується лише тоді, коли локальний вхідний токен автентифікації не задано)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (резервний віддалений варіант застосовується лише тоді, коли локальний вхідний пароль автентифікації не задано)
- Типові значення віддаленого режиму:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму node-host: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token для віддалених probe/status за замовчуванням суворі: вони використовують лише `gateway.remote.token` (без резервного локального token), коли ціллю є віддалений режим.
- Перевизначення середовища Gateway використовують лише `OPENCLAW_GATEWAY_*`.

## Chat UI через SSH

WebChat більше не використовує окремий HTTP-порт. SwiftUI chat UI підключається безпосередньо до Gateway WebSocket.

- Переспрямуйте `18789` через SSH (див. вище), а потім підключайте клієнти до `ws://127.0.0.1:18789`.
- У macOS надавайте перевагу режиму програми «Remote over SSH», який автоматично керує тунелем.

## macOS app Remote over SSH

Програма macOS у рядку меню може керувати тією самою конфігурацією наскрізно (віддалені перевірки стану, WebChat і переспрямування Voice Wake).

Інструкція: [віддалений доступ у macOS](/uk/platforms/mac/remote).

## Правила безпеки (remote/VPN)

Коротко: **залишайте Gateway доступним лише через loopback**, якщо ви не впевнені, що вам потрібне інше bind-прив’язування.

- **Loopback + SSH/Tailscale Serve** — найбезпечніший типовий варіант (без публічного доступу).
- Простий `ws://` типово працює лише для loopback. Для довірених приватних мереж
  встановіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як
  аварійний виняток. Еквівалента в `openclaw.json` немає; це має бути змінна
  середовища процесу для клієнта, який встановлює WebSocket-з’єднання.
- **Прив’язування не до loopback** (`lan`/`tailnet`/`custom` або `auto`, коли loopback недоступний) повинні використовувати автентифікацію gateway: token, password або reverse proxy з перевіркою ідентичності з `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони **самі по собі не** налаштовують автентифікацію сервера.
- Локальні шляхи виклику можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef, але вони не розв’язуються, розв’язання завершується в закритому режимі (без маскувального резервного варіанта через remote).
- `gateway.remote.tlsFingerprint` фіксує сертифікат TLS віддаленого вузла під час використання `wss://`.
- **Tailscale Serve** може автентифікувати трафік Control UI/WebSocket через заголовки
  ідентичності, коли `gateway.auth.allowTailscale: true`; кінцеві точки HTTP API не
  використовують цю автентифікацію через заголовки Tailscale і натомість
  дотримуються звичайного режиму HTTP-автентифікації gateway. Цей потік без token
  передбачає, що хост gateway є довіреним. Встановіть `false`, якщо ви хочете
  використовувати автентифікацію зі спільним секретом всюди.
- Автентифікація **trusted-proxy** призначена лише для конфігурацій із proxy з перевіркою ідентичності, що працюють не на loopback.
  Reverse proxy на тому самому хості з loopback не відповідають `gateway.auth.mode: "trusted-proxy"`.
- Ставтеся до керування через браузер як до операторського доступу: лише tailnet + навмисне спарювання вузлів.

Докладніше: [Безпека](/uk/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, які підключаються до віддаленого gateway, найпростіше постійне налаштування використовує запис `LocalForward` у конфігурації SSH плюс LaunchAgent, щоб підтримувати тунель активним після перезавантажень і збоїв.

#### Крок 1: додайте конфігурацію SSH

Відредагуйте `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Замініть `<REMOTE_IP>` і `<REMOTE_USER>` на свої значення.

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

<Note>
Якщо у вас залишився LaunchAgent `com.openclaw.ssh-tunnel` зі старішої конфігурації, вивантажте та видаліть його.
</Note>

#### Усунення неполадок

Перевірте, чи запущений тунель:

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
| `KeepAlive`                           | Автоматично перезапускає тунель, якщо він аварійно завершується |
| `RunAtLoad`                           | Запускає тунель, коли LaunchAgent завантажується під час входу |

## Пов’язане

- [Tailscale](/uk/gateway/tailscale)
- [Автентифікація](/uk/gateway/authentication)
- [Налаштування віддаленого gateway](/uk/gateway/remote-gateway-readme)
