---
read_when:
    - Відкриття Control UI Gateway за межами localhost
    - Автоматизація доступу до панелі через tailnet або публічний доступ
summary: Інтегровані Tailscale Serve/Funnel для панелі Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-05T18:04:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (панель Gateway)

OpenClaw може автоматично налаштовувати Tailscale **Serve** (tailnet) або **Funnel** (публічний) для
панелі Gateway і порту WebSocket. Це дає змогу залишити Gateway прив’язаним до loopback, тоді як
Tailscale забезпечує HTTPS, маршрутизацію та (для Serve) заголовки ідентичності.

## Режими

- `serve`: Serve лише для tailnet через `tailscale serve`. Gateway лишається на `127.0.0.1`.
- `funnel`: Публічний HTTPS через `tailscale funnel`. OpenClaw вимагає спільний пароль.
- `off`: Типово (без автоматизації Tailscale).

## Автентифікація

Задайте `gateway.auth.mode`, щоб керувати handshake:

- `none` (лише приватний ingress)
- `token` (типово, коли задано `OPENCLAW_GATEWAY_TOKEN`)
- `password` (спільний секрет через `OPENCLAW_GATEWAY_PASSWORD` або конфігурацію)
- `trusted-proxy` (reverse proxy з урахуванням ідентичності; див. [Trusted Proxy Auth](/gateway/trusted-proxy-auth))

Коли `tailscale.mode = "serve"` і `gateway.auth.allowTailscale` дорівнює `true`,
автентифікація для Control UI/WebSocket може використовувати заголовки ідентичності Tailscale
(`tailscale-user-login`) без передавання token/password. OpenClaw перевіряє
ідентичність, визначаючи адресу `x-forwarded-for` через локальний демон Tailscale
(`tailscale whois`) і зіставляючи її із заголовком перед прийняттям.
OpenClaw вважає запит таким, що надійшов через Serve, лише якщо він приходить із loopback із
заголовками Tailscale `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`.
Endpoint HTTP API (наприклад `/v1/*`, `/tools/invoke` і `/api/channels/*`)
**не** використовують автентифікацію через заголовки ідентичності Tailscale. Вони й далі дотримуються
звичайного режиму HTTP-автентифікації gateway: типово автентифікація зі спільним секретом або
навмисно налаштований `trusted-proxy` / приватний ingress `none`.
Цей сценарій без токена передбачає, що хост gateway є довіреним. Якщо на цьому самому хості
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

Відкрити: `https://<magicdns>/` (або налаштований вами `gateway.controlUi.basePath`)

### Лише tailnet (bind до IP tailnet)

Використовуйте це, якщо хочете, щоб Gateway слухав безпосередньо на IP tailnet (без Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Підключення з іншого пристрою в tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
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

Надавайте перевагу `OPENCLAW_GATEWAY_PASSWORD`, а не збереженню пароля на диску.

## Приклади CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Примітки

- Tailscale Serve/Funnel вимагає, щоб CLI `tailscale` було встановлено та щоб у ньому було виконано вхід.
- `tailscale.mode: "funnel"` відмовляється запускатися, якщо режим автентифікації не `password`, щоб уникнути публічного відкриття.
- Установіть `gateway.tailscale.resetOnExit`, якщо хочете, щоб OpenClaw скасовував конфігурацію `tailscale serve`
  або `tailscale funnel` під час завершення роботи.
- `gateway.bind: "tailnet"` — це прямий bind до tailnet (без HTTPS, без Serve/Funnel).
- `gateway.bind: "auto"` надає перевагу loopback; використовуйте `tailnet`, якщо вам потрібен лише tailnet.
- Serve/Funnel відкривають лише **Control UI + WS Gateway**. Вузли підключаються через
  той самий endpoint Gateway WS, тому Serve може працювати й для доступу вузлів.

## Керування браузером (віддалений Gateway + локальний браузер)

Якщо ви запускаєте Gateway на одній машині, але хочете керувати браузером на іншій,
запустіть **node host** на машині з браузером і залиште обидві машини в одній tailnet.
Gateway буде проксувати дії браузера до вузла; окремий сервер керування або URL Serve не потрібні.

Уникайте Funnel для керування браузером; ставтеся до прив’язки вузла як до операторського доступу.

## Передумови й обмеження Tailscale

- Serve вимагає ввімкненого HTTPS для вашої tailnet; CLI запропонує це, якщо його бракує.
- Serve додає заголовки ідентичності Tailscale; Funnel — ні.
- Funnel вимагає Tailscale v1.38.3+, MagicDNS, увімкненого HTTPS і атрибута funnel node.
- Funnel підтримує лише порти `443`, `8443` і `10000` через TLS.
- Funnel на macOS вимагає варіант застосунку Tailscale з відкритим кодом.

## Докладніше

- Огляд Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Команда `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Огляд Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Команда `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
