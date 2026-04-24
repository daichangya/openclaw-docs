---
read_when:
    - Відкриття інтерфейсу керування Gateway за межами localhost
    - Автоматизація доступу до панелі через tailnet або публічного доступу
summary: Інтегрований Tailscale Serve/Funnel для панелі Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T03:17:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (панель Gateway)

OpenClaw може автоматично налаштовувати Tailscale **Serve** (tailnet) або **Funnel** (публічний доступ) для
панелі Gateway і порту WebSocket. Це дає змогу залишити Gateway прив’язаним до loopback, поки
Tailscale забезпечує HTTPS, маршрутизацію та (для Serve) заголовки ідентичності.

## Режими

- `serve`: доступний лише в tailnet через `tailscale serve`. Gateway залишається на `127.0.0.1`.
- `funnel`: публічний HTTPS через `tailscale funnel`. OpenClaw вимагає спільний пароль.
- `off`: типово (без автоматизації Tailscale).

## Автентифікація

Установіть `gateway.auth.mode`, щоб керувати handshake:

- `none` (лише приватний вхідний доступ)
- `token` (типово, коли встановлено `OPENCLAW_GATEWAY_TOKEN`)
- `password` (спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або конфігурацію)
- `trusted-proxy` (reverse proxy з урахуванням ідентичності; див. [Автентифікація Trusted Proxy](/uk/gateway/trusted-proxy-auth))

Коли `tailscale.mode = "serve"` і `gateway.auth.allowTailscale` дорівнює `true`,
автентифікація інтерфейсу керування / WebSocket може використовувати заголовки ідентичності Tailscale
(`tailscale-user-login`) без передавання token/password. OpenClaw перевіряє
ідентичність, визначаючи адресу `x-forwarded-for` через локальний демон Tailscale
(`tailscale whois`) і звіряючи її із заголовком перед прийняттям.
OpenClaw вважає запит запитом Serve лише тоді, коли він надходить із loopback із
заголовками Tailscale `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`.
Кінцеві точки HTTP API (наприклад, `/v1/*`, `/tools/invoke` і `/api/channels/*`)
**не** використовують автентифікацію через заголовки ідентичності Tailscale. Вони, як і раніше, дотримуються
звичайного режиму HTTP-автентифікації gateway: типово це автентифікація спільним секретом або
навмисно налаштований trusted-proxy / приватний вхідний режим `none`.
Цей потік без token передбачає, що хост gateway є довіреним. Якщо на тому самому хості
може виконуватися недовірений локальний код, вимкніть `gateway.auth.allowTailscale` і натомість
вимагайте автентифікацію через token/password.
Щоб вимагати явні облікові дані зі спільним секретом, установіть `gateway.auth.allowTailscale: false`
і використовуйте `gateway.auth.mode: "token"` або `"password"`.

## Приклади конфігурації

### Лише tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Відкрийте: `https://<magicdns>/` (або ваш налаштований `gateway.controlUi.basePath`)

### Лише tailnet (прив’язка до IP Tailnet)

Використовуйте це, якщо хочете, щоб Gateway напряму слухав IP Tailnet (без Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Підключення з іншого пристрою Tailnet:

- Інтерфейс керування: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Примітка: loopback (`http://127.0.0.1:18789`) у цьому режимі **не** працюватиме.

### Публічний інтернет (Funnel + спільний пароль)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD` замість збереження пароля на диск.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примітки

- Для Tailscale Serve/Funnel потрібно, щоб CLI `tailscale` був установлений і виконано вхід.
- `tailscale.mode: "funnel"` відмовиться запускатися, якщо режим автентифікації не `password`, щоб уникнути публічного відкриття.
- Установіть `gateway.tailscale.resetOnExit`, якщо хочете, щоб OpenClaw скасовував конфігурацію `tailscale serve`
  або `tailscale funnel` під час завершення роботи.
- `gateway.bind: "tailnet"` — це пряма прив’язка Tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` надає перевагу loopback; використовуйте `tailnet`, якщо хочете лише Tailnet.
- Serve/Funnel відкривають лише **інтерфейс керування Gateway + WS**. Вузли підключаються через
  той самий кінцевий пункт WS Gateway, тому Serve може працювати і для доступу вузлів.

## Керування браузером (віддалений Gateway + локальний браузер)

Якщо ви запускаєте Gateway на одній машині, але хочете керувати браузером на іншій машині,
запустіть **хост вузла** на машині з браузером і тримайте обидві машини в одній tailnet.
Gateway буде проксувати дії браузера до вузла; окремий сервер керування або URL Serve не потрібні.

Уникайте Funnel для керування браузером; ставтеся до спарювання вузлів як до операторського доступу.

## Передумови та обмеження Tailscale

- Serve вимагає, щоб для вашої tailnet було ввімкнено HTTPS; CLI запропонує це, якщо бракує.
- Serve додає заголовки ідентичності Tailscale; Funnel цього не робить.
- Funnel вимагає Tailscale v1.38.3+, MagicDNS, увімкнений HTTPS і атрибут funnel node.
- Funnel підтримує лише порти `443`, `8443` і `10000` через TLS.
- Funnel на macOS вимагає варіант застосунку Tailscale з відкритим кодом.

## Дізнатися більше

- Огляд Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Огляд Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Пов’язано

- [Віддалений доступ](/uk/gateway/remote)
- [Виявлення](/uk/gateway/discovery)
- [Автентифікація](/uk/gateway/authentication)
