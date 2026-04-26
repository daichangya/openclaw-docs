---
read_when:
    - Запуск або усунення несправностей у віддалених конфігураціях шлюзу
summary: Віддалений доступ за допомогою SSH-тунелів (Gateway WS) і tailnet-мереж
title: Віддалений доступ
x-i18n:
    generated_at: "2026-04-26T04:24:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

Цей репозиторій підтримує «віддалений доступ через SSH» завдяки тому, що один Gateway (головний) постійно працює на виділеному хості (desktop/server), а клієнти підключаються до нього.

- Для **операторів (ви / застосунок macOS)**: SSH-тунелювання — це універсальний запасний варіант.
- Для **Node (iOS/Android і майбутні пристрої)**: підключайтеся до **WebSocket** Gateway (LAN/tailnet або через SSH-тунель за потреби).

## Основна ідея

- Gateway WebSocket прив’язується до **loopback** на налаштованому вами порту (типово `18789`).
- Для віддаленого використання ви переспрямовуєте цей loopback-порт через SSH (або використовуєте tailnet/VPN і менше покладаєтеся на тунелювання).

## Поширені конфігурації VPN/tailnet (де працює агент)

Сприймайте **хост Gateway** як місце, «де працює агент». Він керує сесіями, профілями автентифікації, каналами та станом.
Ваш laptop/desktop (і Node) підключаються до цього хоста.

### 1) Постійно ввімкнений Gateway у вашій tailnet-мережі (VPS або домашній сервер)

Запустіть Gateway на постійному хості й підключайтеся до нього через **Tailscale** або SSH.

- **Найкращий UX:** залиште `gateway.bind: "loopback"` і використовуйте **Tailscale Serve** для Control UI.
- **Запасний варіант:** залиште loopback + SSH-тунель із будь-якої машини, якій потрібен доступ.
- **Приклади:** [exe.dev](/uk/install/exe-dev) (проста VM) або [Hetzner](/uk/install/hetzner) (промисловий VPS).

Це ідеальний варіант, якщо ваш laptop часто засинає, але ви хочете, щоб агент був завжди доступний.

### 2) Домашній desktop запускає Gateway, laptop використовується для віддаленого керування

Laptop **не** запускає агент. Він підключається віддалено:

- Використовуйте режим **Remote over SSH** у застосунку macOS (Налаштування → Загальні → «Де працює OpenClaw»).
- Застосунок відкриває й керує тунелем, тому WebChat і перевірки працездатності «просто працюють».

Інструкція: [віддалений доступ у macOS](/uk/platforms/mac/remote).

### 3) Laptop запускає Gateway, віддалений доступ здійснюється з інших машин

Залиште Gateway локальним, але безпечно надайте до нього доступ:

- SSH-тунель до laptop з інших машин, або
- Tailscale Serve для Control UI, залишивши Gateway доступним лише через loopback.

Посібник: [Tailscale](/uk/gateway/tailscale) і [огляд Web](/uk/web).

## Потік команд (що і де запускається)

Один сервіс gateway керує станом і каналами. Node є периферійними компонентами.

Приклад потоку (Telegram → node):

- Повідомлення Telegram надходить до **Gateway**.
- Gateway запускає **агента** і вирішує, чи викликати інструмент node.
- Gateway викликає **node** через Gateway WebSocket (`node.*` RPC).
- Node повертає результат; Gateway надсилає відповідь назад у Telegram.

Примітки:

- **Node не запускають сервіс gateway.** На одному хості має працювати лише один gateway, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)).
- «Режим node» у застосунку macOS — це просто клієнт node через Gateway WebSocket.

## SSH-тунель (CLI + інструменти)

Створіть локальний тунель до віддаленого Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Коли тунель активний:

- `openclaw health` і `openclaw status --deep` тепер звертаються до віддаленого gateway через `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` і `openclaw gateway call` також можуть звертатися до переспрямованої URL-адреси через `--url`, якщо потрібно.

Примітка: замініть `18789` на ваш налаштований `gateway.port` (або `--port`/`OPENCLAW_GATEWAY_PORT`).
Примітка: коли ви передаєте `--url`, CLI не використовує запасний варіант із конфігурації або облікових даних середовища.
Явно вкажіть `--token` або `--password`. Відсутність явно вказаних облікових даних є помилкою.

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

Коли gateway доступний лише через loopback, залишайте URL як `ws://127.0.0.1:18789` і спочатку відкрийте SSH-тунель.
У транспорті SSH-тунелю застосунку macOS виявлені імена хостів gateway мають зберігатися в
`gateway.remote.sshTarget`; `gateway.remote.url` залишається URL-адресою локального тунелю.

## Пріоритет облікових даних

Визначення облікових даних gateway дотримується єдиного спільного контракту для шляхів call/probe/status і моніторингу схвалення виконання в Discord. Хост Node використовує той самий базовий контракт з одним винятком для локального режиму (він навмисно ігнорує `gateway.remote.*`):

- Явно вказані облікові дані (`--token`, `--password` або інструмент `gatewayToken`) завжди мають пріоритет у шляхах виклику, які приймають явну автентифікацію.
- Безпека перевизначення URL:
  - Перевизначення URL у CLI (`--url`) ніколи не використовують неявні облікові дані з конфігурації/середовища.
  - Перевизначення URL через середовище (`OPENCLAW_GATEWAY_URL`) можуть використовувати лише облікові дані середовища (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Типові значення локального режиму:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (запасний варіант із remote застосовується лише тоді, коли локальне значення токена автентифікації не задане)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (запасний варіант із remote застосовується лише тоді, коли локальне значення пароля автентифікації не задане)
- Типові значення віддаленого режиму:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Виняток локального режиму для хоста Node: `gateway.remote.token` / `gateway.remote.password` ігноруються.
- Перевірки token для віддалених probe/status типово є строгими: вони використовують лише `gateway.remote.token` (без запасного варіанта локального токена) під час звернення до віддаленого режиму.
- Перевизначення середовища gateway використовують лише `OPENCLAW_GATEWAY_*`.

## Chat UI через SSH

WebChat більше не використовує окремий HTTP-порт. Chat UI на SwiftUI підключається безпосередньо до Gateway WebSocket.

- Переспрямуйте `18789` через SSH (див. вище), а потім підключайте клієнти до `ws://127.0.0.1:18789`.
- У macOS віддавайте перевагу режиму «Remote over SSH» у застосунку, який автоматично керує тунелем.

## Застосунок macOS: "Remote over SSH"

Застосунок macOS у рядку меню може керувати цією ж конфігурацією повністю (віддалені перевірки стану, WebChat і переспрямування Voice Wake).

Інструкція: [віддалений доступ у macOS](/uk/platforms/mac/remote).

## Правила безпеки (remote/VPN)

Коротко: **залишайте Gateway доступним лише через loopback**, якщо ви не впевнені, що вам справді потрібна прив’язка до іншого інтерфейсу.

- **Loopback + SSH/Tailscale Serve** — найбезпечніший типовий варіант (без публічної експозиції).
- Простий `ws://` типово дозволений лише для loopback. Для довірених приватних мереж
  встановіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як
  аварійний виняток. Еквівалента в `openclaw.json` немає; це має бути змінна
  середовища процесу для клієнта, який виконує WebSocket-підключення.
- **Прив’язки не до loopback** (`lan`/`tailnet`/`custom` або `auto`, коли loopback недоступний) мають використовувати автентифікацію gateway: token, password або reverse proxy з контролем ідентичності з `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони **самі по собі не** налаштовують автентифікацію сервера.
- Локальні шляхи виклику можуть використовувати `gateway.remote.*` як запасний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовані через SecretRef і не вдається їх визначити, визначення завершується в закритому режимі (без маскування запасним варіантом із remote).
- `gateway.remote.tlsFingerprint` фіксує сертифікат TLS віддаленого хоста під час використання `wss://`.
- **Tailscale Serve** може автентифікувати трафік Control UI/WebSocket через заголовки
  ідентичності, якщо `gateway.auth.allowTailscale: true`; кінцеві точки HTTP API не
  використовують цю автентифікацію через заголовки Tailscale й натомість дотримуються
  звичайного режиму HTTP-автентифікації gateway. Цей безтокеновий потік передбачає,
  що хост gateway є довіреним. Установіть `false`, якщо хочете спільну секретну
  автентифікацію всюди.
- Автентифікація **trusted-proxy** призначена лише для конфігурацій із proxy з контролем ідентичності, що працює не на loopback.
  Reverse proxy на тому самому хості через loopback не відповідає вимогам `gateway.auth.mode: "trusted-proxy"`.
- Ставтеся до керування через браузер як до операторського доступу: лише tailnet + навмисне з’єднання з Node.

Докладніше: [Безпека](/uk/gateway/security).

### macOS: постійний SSH-тунель через LaunchAgent

Для клієнтів macOS, які підключаються до віддаленого gateway, найпростішою постійною конфігурацією є запис SSH `LocalForward` у конфігурації разом із LaunchAgent, який підтримує тунель активним після перезавантажень і збоїв.

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

Тунель автоматично запускатиметься під час входу в систему, перезапускатиметься після збоїв і підтримуватиме переспрямований порт активним.

Примітка: якщо у вас залишився LaunchAgent `com.openclaw.ssh-tunnel` зі старішої конфігурації, вивантажте й видаліть його.

#### Усунення несправностей

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

| Запис конфігурації                   | Що він робить                                                |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Переспрямовує локальний порт 18789 на віддалений порт 18789  |
| `ssh -N`                             | SSH без виконання віддалених команд (лише переспрямування портів) |
| `KeepAlive`                          | Автоматично перезапускає тунель, якщо він аварійно завершується |
| `RunAtLoad`                          | Запускає тунель, коли LaunchAgent завантажується під час входу в систему |

## Пов’язані матеріали

- [Tailscale](/uk/gateway/tailscale)
- [Автентифікація](/uk/gateway/authentication)
- [Налаштування віддаленого gateway](/uk/gateway/remote-gateway-readme)
