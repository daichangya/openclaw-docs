---
read_when:
    - Вам потрібен огляд мережевої архітектури та безпеки
    - Ви налагоджуєте локальний доступ чи доступ через tailnet або сполучення
    - Ви хочете отримати канонічний список мережевої документації
summary: 'Мережевий хаб: поверхні gateway, сполучення, виявлення та безпека'
title: Мережа
x-i18n:
    generated_at: "2026-04-24T04:15:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# Мережевий хаб

Цей хаб містить посилання на основну документацію про те, як OpenClaw підключає, сполучає та захищає
пристрої через localhost, LAN і tailnet.

## Основна модель

Більшість операцій проходить через Gateway (`openclaw gateway`) — єдиний довготривалий процес, який керує підключеннями каналів і площиною керування WebSocket.

- **Спочатку loopback**: WS Gateway типово використовує `ws://127.0.0.1:18789`.
  Прив’язки не до loopback вимагають дійсного шляху автентифікації gateway: автентифікація
  токеном/паролем зі спільним секретом або правильно налаштоване розгортання
  `trusted-proxy` не на loopback.
- **Один Gateway на хост** — рекомендований варіант. Для ізоляції запускайте кілька gateway з ізольованими профілями та портами ([Кілька Gateway](/uk/gateway/multiple-gateways)).
- **Canvas host** обслуговується на тому самому порту, що й Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), і захищений автентифікацією Gateway, коли прив’язаний не лише до loopback.
- **Віддалений доступ** зазвичай здійснюється через SSH tunnel або VPN Tailscale ([Віддалений доступ](/uk/gateway/remote)).

Ключові посилання:

- [Архітектура Gateway](/uk/concepts/architecture)
- [Протокол Gateway](/uk/gateway/protocol)
- [Runbook Gateway](/uk/gateway)
- [Вебповерхні та режими прив’язки](/uk/web)

## Сполучення та ідентичність

- [Огляд сполучення (DM + nodes)](/uk/channels/pairing)
- [Сполучення node під керуванням Gateway](/uk/gateway/pairing)
- [CLI Devices (сполучення + ротація токенів)](/uk/cli/devices)
- [CLI Pairing (схвалення DM)](/uk/cli/pairing)

Локальна довіра:

- Прямі локальні підключення loopback можуть автоматично схвалюватися для сполучення, щоб
  забезпечити зручний UX на тому самому хості.
- OpenClaw також має вузький шлях самопідключення backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Клієнти tailnet і LAN, включно з прив’язками tailnet на тому самому хості, все одно потребують
  явного схвалення сполучення.

## Виявлення та транспорти

- [Виявлення та транспорти](/uk/gateway/discovery)
- [Bonjour / mDNS](/uk/gateway/bonjour)
- [Віддалений доступ (SSH)](/uk/gateway/remote)
- [Tailscale](/uk/gateway/tailscale)

## Nodes і транспорти

- [Огляд Nodes](/uk/nodes)
- [Протокол Bridge (застарілі nodes, історично)](/uk/gateway/bridge-protocol)
- [Runbook node: iOS](/uk/platforms/ios)
- [Runbook node: Android](/uk/platforms/android)

## Безпека

- [Огляд безпеки](/uk/gateway/security)
- [Довідка з конфігурації Gateway](/uk/gateway/configuration)
- [Усунення несправностей](/uk/gateway/troubleshooting)
- [Doctor](/uk/gateway/doctor)

## Пов’язане

- [Мережева модель Gateway](/uk/gateway/network-model)
- [Віддалений доступ](/uk/gateway/remote)
