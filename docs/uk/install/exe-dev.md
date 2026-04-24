---
read_when:
    - Ви хочете недорогий Linux-хост, який завжди працює, для Gateway
    - Ви хочете віддалений доступ до Control UI без власного VPS
summary: Запустіть Gateway OpenClaw на exe.dev (VM + HTTPS-proxy) для віддаленого доступу
title: exe.dev
x-i18n:
    generated_at: "2026-04-24T03:18:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

Мета: Gateway OpenClaw, запущений на VM exe.dev, доступний з вашого ноутбука за адресою: `https://<vm-name>.exe.xyz`

Ця сторінка передбачає стандартний образ **exeuntu** від exe.dev. Якщо ви вибрали інший дистрибутив, відповідно зіставте пакунки.

## Швидкий шлях для початківців

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Заповніть свій ключ/токен автентифікації за потреби
3. Натисніть "Agent" поруч із вашою VM і дочекайтеся, поки Shelley завершить підготовку
4. Відкрийте `https://<vm-name>.exe.xyz/` і пройдіть автентифікацію за допомогою налаштованого спільного секрету (у цьому посібнику типово використовується автентифікація token, але автентифікація password також працює, якщо ви перемкнете `gateway.auth.mode`)
5. Схваліть усі очікувані запити на спарювання пристроїв за допомогою `openclaw devices approve <requestId>`

## Що вам потрібно

- обліковий запис exe.dev
- доступ `ssh exe.dev` до віртуальних машин [exe.dev](https://exe.dev) (необов’язково)

## Автоматизоване встановлення за допомогою Shelley

Shelley, агент [exe.dev](https://exe.dev), може миттєво встановити OpenClaw за нашим
prompt. Використаний prompt наведено нижче:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Ручне встановлення

## 1) Створіть VM

З вашого пристрою:

```bash
ssh exe.dev new
```

Потім підключіться:

```bash
ssh <vm-name>.exe.xyz
```

Порада: залишайте цю VM **stateful**. OpenClaw зберігає `openclaw.json`, `auth-profiles.json`
для кожного агента, сесії та стан каналу/провайдера в
`~/.openclaw/`, а також робочу область у `~/.openclaw/workspace/`.

## 2) Встановіть передумови (на VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Встановіть OpenClaw

Запустіть скрипт встановлення OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Налаштуйте nginx для proxy OpenClaw на порт 8000

Відредагуйте `/etc/nginx/sites-enabled/default`, додавши

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Перезаписуйте заголовки переспрямування замість збереження ланцюжків, переданих клієнтом.
OpenClaw довіряє метаданим переспрямованих IP лише від явно налаштованих proxy,
а ланцюжки `X-Forwarded-For` у стилі append вважаються ризиком для посилення захисту.

## 5) Отримайте доступ до OpenClaw і надайте привілеї

Відкрийте `https://<vm-name>.exe.xyz/` (див. вивід Control UI під час onboarding). Якщо з’явиться запит на автентифікацію, вставте
налаштований спільний секрет із VM. У цьому посібнику використовується автентифікація token, тому отримайте `gateway.auth.token`
за допомогою `openclaw config get gateway.auth.token` (або згенеруйте його командою `openclaw doctor --generate-gateway-token`).
Якщо ви змінили gateway на автентифікацію password, використовуйте натомість `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Схвалюйте пристрої за допомогою `openclaw devices list` і `openclaw devices approve <requestId>`. Якщо сумніваєтеся, використовуйте Shelley у браузері!

## Віддалений доступ

Віддалений доступ забезпечується автентифікацією [exe.dev](https://exe.dev). За
замовчуванням HTTP-трафік з порту 8000 переспрямовується на `https://<vm-name>.exe.xyz`
з автентифікацією за email.

## Оновлення

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Посібник: [Оновлення](/uk/install/updating)

## Пов’язане

- [Віддалений gateway](/uk/gateway/remote)
- [Огляд встановлення](/uk/install)
