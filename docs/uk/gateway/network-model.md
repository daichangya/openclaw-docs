---
read_when:
    - Вам потрібен стислий огляд мережевої моделі Gateway
summary: Як підключаються Gateway, Node і вузол canvas host.
title: Мережева модель
x-i18n:
    generated_at: "2026-04-24T03:17:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> Цей вміст об’єднано в [Мережа](/uk/network#core-model). Поточний посібник див. на цій сторінці.

Більшість операцій проходять через Gateway (`openclaw gateway`) — єдиний довготривалий
процес, який керує підключеннями каналів і площиною керування WebSocket.

## Основні правила

- Рекомендується один Gateway на хост. Це єдиний процес, якому дозволено володіти сесією WhatsApp Web. Для резервних ботів або суворої ізоляції запускайте кілька gateway з ізольованими профілями й портами. Див. [Кілька gateway](/uk/gateway/multiple-gateways).
- Спочатку loopback: WS Gateway за замовчуванням використовує `ws://127.0.0.1:18789`. Майстер за замовчуванням створює auth зі спільним секретом і зазвичай генерує токен навіть для loopback. Для доступу поза loopback використовуйте коректний шлях auth gateway: auth токеном/паролем зі спільним секретом або правильно налаштоване розгортання `trusted-proxy` поза loopback. Налаштування tailnet/мобільних пристроїв зазвичай найкраще працюють через Tailscale Serve або іншу кінцеву точку `wss://`, а не через сирий tailnet `ws://`.
- Node підключаються до WS Gateway через LAN, tailnet або SSH за потреби. Застарілий міст TCP видалено.
- Canvas host обслуговується HTTP-сервером Gateway на **тому самому порту**, що й Gateway (типово `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Коли налаштовано `gateway.auth` і Gateway прив’язується поза loopback, ці маршрути захищаються auth Gateway. Клієнти Node використовують URL можливостей з областю дії Node, пов’язані з їхньою активною WS-сесією. Див. [Конфігурація Gateway](/uk/gateway/configuration) (`canvasHost`, `gateway`).
- Віддалене використання зазвичай відбувається через SSH-тунель або tailnet VPN. Див. [Віддалений доступ](/uk/gateway/remote) і [Виявлення](/uk/gateway/discovery).

## Пов’язане

- [Віддалений доступ](/uk/gateway/remote)
- [Auth trusted proxy](/uk/gateway/trusted-proxy-auth)
- [Протокол Gateway](/uk/gateway/protocol)
