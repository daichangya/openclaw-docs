---
read_when:
    - Ви хочете швидко сполучити мобільний застосунок Node із gateway
    - Вам потрібен вивід коду налаштування для віддаленого/ручного поширення
summary: Довідник CLI для `openclaw qr` (згенерувати QR-код для мобільного сполучення та код налаштування)
title: QR
x-i18n:
    generated_at: "2026-04-24T04:12:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Згенеруйте QR для мобільного сполучення та код налаштування на основі поточної конфігурації Gateway.

## Використання

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Параметри

- `--remote`: надавати перевагу `gateway.remote.url`; якщо його не задано, `gateway.tailscale.mode=serve|funnel` усе одно може надати віддалений публічний URL
- `--url <url>`: перевизначити URL gateway, який використовується в payload
- `--public-url <url>`: перевизначити публічний URL, який використовується в payload
- `--token <token>`: перевизначити, проти якого токена gateway виконується автентифікація в потоці bootstrap
- `--password <password>`: перевизначити, проти якого пароля gateway виконується автентифікація в потоці bootstrap
- `--setup-code-only`: вивести лише код налаштування
- `--no-ascii`: пропустити ASCII-візуалізацію QR
- `--json`: вивести JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Примітки

- `--token` і `--password` є взаємовиключними.
- Сам код налаштування тепер містить непрозорий короткоживучий `bootstrapToken`, а не спільний токен/пароль gateway.
- У вбудованому потоці bootstrap для node/operator первинний токен Node, як і раніше, має `scopes: []`.
- Якщо передавання bootstrap також видає токен оператора, він залишається обмеженим allowlist bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Перевірки bootstrap scopes мають префікс ролі. Цей allowlist оператора задовольняє лише запити оператора; ролям, які не є оператором, як і раніше, потрібні scopes під префіксом їхньої власної ролі.
- Мобільне сполучення завершується в закритому режимі для URL gateway `ws://` через Tailscale/публічний доступ. Приватний LAN `ws://` як і раніше підтримується, але мобільні маршрути через Tailscale/публічний доступ мають використовувати Tailscale Serve/Funnel або URL gateway `wss://`.
- З `--remote` OpenClaw вимагає або `gateway.remote.url`, або
  `gateway.tailscale.mode=serve|funnel`.
- З `--remote`, якщо фактично активні віддалені облікові дані налаштовані як SecretRefs і ви не передаєте `--token` або `--password`, команда розв’язує їх з активного знімка gateway. Якщо gateway недоступний, команда швидко завершується з помилкою.
- Без `--remote` локальні SecretRefs автентифікації gateway розв’язуються, якщо не передано перевизначення автентифікації через CLI:
  - `gateway.auth.token` розв’язується, коли може перемогти автентифікація за токеном (явний `gateway.auth.mode="token"` або виведений режим, у якому не перемагає жодне джерело пароля).
  - `gateway.auth.password` розв’язується, коли може перемогти автентифікація за паролем (явний `gateway.auth.mode="password"` або виведений режим без токена-переможця з auth/env).
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRefs), а `gateway.auth.mode` не задано, розв’язання коду налаштування завершується помилкою, доки режим не буде задано явно.
- Примітка щодо розбіжності версій Gateway: цей шлях команди вимагає gateway, який підтримує `secrets.resolve`; старіші gateway повертають помилку unknown-method.
- Після сканування схваліть сполучення пристрою за допомогою:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Сполучення](/uk/cli/pairing)
