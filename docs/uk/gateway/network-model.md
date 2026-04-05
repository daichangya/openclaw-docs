---
read_when:
    - Ви хочете отримати стислий огляд мережевої моделі Gateway
summary: Як підключаються Gateway, вузли та canvas host.
title: Мережева модель
x-i18n:
    generated_at: "2026-04-05T18:03:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# Мережева модель

> Цей вміст об’єднано в [Network](/network#core-model). Поточний посібник див. на цій сторінці.

Більшість операцій проходить через Gateway (`openclaw gateway`) — єдиний довготривалий
процес, який керує підключеннями каналів і площиною керування WebSocket.

## Основні правила

- Рекомендовано один Gateway на хост. Це єдиний процес, якому дозволено володіти сесією WhatsApp Web. Для rescue bot або суворої ізоляції запускайте кілька gateway з ізольованими профілями та портами. Див. [Кілька Gateway](/gateway/multiple-gateways).
- Спочатку loopback: WS Gateway типово використовує `ws://127.0.0.1:18789`. Майстер налаштування типово створює автентифікацію зі спільним секретом і зазвичай генерує токен навіть для loopback. Для доступу поза loopback використовуйте дійсний шлях автентифікації gateway: shared-secret автентифікацію через токен/пароль або правильно налаштоване розгортання `trusted-proxy` поза loopback. Конфігурації tailnet/mobile зазвичай найкраще працюють через Tailscale Serve або інший endpoint `wss://`, а не через необроблений tailnet `ws://`.
- Вузли підключаються до WS Gateway через LAN, tailnet або SSH за потреби. Застарілий TCP-міст видалено.
- Canvas host обслуговується HTTP-сервером Gateway на **тому самому порту**, що й Gateway (типово `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Коли налаштовано `gateway.auth` і Gateway прив’язано поза loopback, ці маршрути захищаються автентифікацією Gateway. Клієнти вузлів використовують URL можливостей з областю дії вузла, прив’язані до їхньої активної WS-сесії. Див. [Конфігурація Gateway](/gateway/configuration) (`canvasHost`, `gateway`).
- Віддалене використання зазвичай здійснюється через SSH-тунель або VPN tailnet. Див. [Віддалений доступ](/gateway/remote) і [Виявлення](/gateway/discovery).
