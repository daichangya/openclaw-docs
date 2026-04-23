---
read_when:
    - Ви хочете отримати доступ до Gateway через Tailscale
    - Вам потрібні браузерний Control UI і редагування config
summary: 'Вебповерхні Gateway: Control UI, режими bind і безпека'
title: Веб
x-i18n:
    generated_at: "2026-04-23T23:09:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Gateway надає невеликий **браузерний Control UI** (Vite + Lit) з того самого порту, що й WebSocket Gateway:

- типово: `http://<host>:18789/`
- необов’язковий префікс: задайте `gateway.controlUi.basePath` (наприклад, `/openclaw`)

Можливості описано в [Control UI](/uk/web/control-ui).
Ця сторінка зосереджена на режимах bind, безпеці та вебповерхнях.

## Webhook-и

Коли `hooks.enabled=true`, Gateway також відкриває невеликий endpoint Webhook на тому самому HTTP-сервері.
Auth і payload-и див. у [Конфігурація Gateway](/uk/gateway/configuration) → `hooks`.

## Config (типово ввімкнено)

Control UI **типово ввімкнено**, коли наявні assets (`dist/control-ui`).
Керувати ним можна через config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath необов’язковий
  },
}
```

## Доступ через Tailscale

### Інтегрований Serve (рекомендовано)

Залиште Gateway на loopback і дозвольте Tailscale Serve проксувати його:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Потім запустіть gateway:

```bash
openclaw gateway
```

Відкрийте:

- `https://<magicdns>/` (або ваш налаштований `gateway.controlUi.basePath`)

### Bind до tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Потім запустіть gateway (цей приклад без loopback використовує auth зі
спільним секретом на основі token):

```bash
openclaw gateway
```

Відкрийте:

- `http://<tailscale-ip>:18789/` (або ваш налаштований `gateway.controlUi.basePath`)

### Публічний інтернет (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // або OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Примітки з безпеки

- Auth Gateway типово обов’язковий (token, password, trusted-proxy або заголовки ідентичності Tailscale Serve, коли це ввімкнено).
- Bind-и без loopback усе одно **потребують** auth gateway. На практиці це означає auth через token/password або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`.
- Майстер типово створює auth зі спільним секретом і зазвичай генерує
  token gateway (навіть на loopback).
- У режимі спільного секрету UI надсилає `connect.params.auth.token` або
  `connect.params.auth.password`.
- У режимах із передаванням ідентичності, таких як Tailscale Serve або `trusted-proxy`, перевірка auth WebSocket натомість задовольняється із заголовків запиту.
- Для розгортань Control UI без loopback явно задайте `gateway.controlUi.allowedOrigins`
  (повні origins). Без цього запуск gateway типово відхиляється.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає
  режим fallback origin на основі заголовка Host, але це небезпечне зниження рівня безпеки.
- З Serve заголовки ідентичності Tailscale можуть задовольняти auth для Control UI/WebSocket,
  коли `gateway.auth.allowTailscale` має значення `true` (token/password не потрібні).
  HTTP API endpoint-и не використовують ці заголовки ідентичності Tailscale; вони
  натомість дотримуються звичайного HTTP-режиму auth gateway. Задайте
  `gateway.auth.allowTailscale: false`, щоб вимагати явні облікові дані. Див.
  [Tailscale](/uk/gateway/tailscale) і [Безпека](/uk/gateway/security). Цей
  потік без token передбачає, що хост gateway є довіреним.
- `gateway.tailscale.mode: "funnel"` вимагає `gateway.auth.mode: "password"` (спільний пароль).

## Збирання UI

Gateway надає статичні файли з `dist/control-ui`. Зберіть їх командою:

```bash
pnpm ui:build
```
