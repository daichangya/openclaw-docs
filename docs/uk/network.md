---
read_when:
    - Вам потрібен огляд мережевої архітектури й безпеки
    - Ви налагоджуєте доступ через local чи tailnet або pairing
    - Вам потрібен канонічний список мережевої документації
summary: 'Мережевий хаб: поверхні gateway, прив’язка, виявлення та безпека'
title: Мережа
x-i18n:
    generated_at: "2026-04-05T18:08:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# Мережевий хаб

Цей хаб посилається на основні документи про те, як OpenClaw підключає, прив’язує та захищає
пристрої через localhost, LAN і tailnet.

## Базова модель

Більшість операцій проходить через Gateway (`openclaw gateway`) — один довготривалий процес, який керує підключеннями каналів і площиною керування WebSocket.

- **Спочатку loopback**: Gateway WS типово використовує `ws://127.0.0.1:18789`.
  Прив’язки не до loopback вимагають валідного шляху автентифікації gateway: спільного секрету
  через token/password або правильно налаштованого розгортання `trusted-proxy`
  не на loopback.
- **Один Gateway на хост** — рекомендований варіант. Для ізоляції запускайте кілька gateway з ізольованими profile і портами ([Кілька Gateway](/gateway/multiple-gateways)).
- **Canvas host** обслуговується на тому самому порту, що й Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), і захищений автентифікацією Gateway, якщо bind не на loopback.
- **Віддалений доступ** зазвичай здійснюється через SSH-тунель або Tailscale VPN ([Віддалений доступ](/gateway/remote)).

Ключові посилання:

- [Архітектура Gateway](/concepts/architecture)
- [Протокол Gateway](/gateway/protocol)
- [Runbook Gateway](/gateway)
- [Веб-поверхні + режими bind](/web)

## Pairing + ідентичність

- [Огляд pairing (DM + вузли)](/channels/pairing)
- [Прив’язка вузлів, якою володіє Gateway](/gateway/pairing)
- [CLI Devices (pairing + ротація токенів)](/cli/devices)
- [CLI Pairing (підтвердження DM)](/cli/pairing)

Локальна довіра:

- Прямі локальні loopback-підключення можуть автоматично підтверджуватися для pairing, щоб UX на одному хості залишався плавним.
- OpenClaw також має вузький шлях backend/container-local self-connect для
  довірених сценаріїв helper зі спільним секретом.
- Клієнти tailnet і LAN, включно з bind tailnet на тому самому хості, і далі потребують
  явного підтвердження pairing.

## Виявлення + транспорти

- [Виявлення й транспорти](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Віддалений доступ (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Вузли + транспорти

- [Огляд вузлів](/nodes)
- [Протокол bridge (застарілі вузли, історично)](/gateway/bridge-protocol)
- [Runbook вузла: iOS](/platforms/ios)
- [Runbook вузла: Android](/platforms/android)

## Безпека

- [Огляд безпеки](/gateway/security)
- [Довідник із конфігурації Gateway](/gateway/configuration)
- [Усунення несправностей](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
