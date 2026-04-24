---
read_when:
    - Шукаєте підтримку ОС або шляхи встановлення
    - Визначаєте, де запускати Gateway
summary: Огляд підтримки платформ (Gateway + супутні застосунки)
title: Платформи
x-i18n:
    generated_at: "2026-04-24T03:19:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

Ядро OpenClaw написане на TypeScript. **Node — рекомендоване середовище виконання**.
Bun не рекомендується для Gateway — є відомі проблеми з каналами WhatsApp і
Telegram; подробиці див. в [Bun (експериментально)](/uk/install/bun).

Існують супутні застосунки для macOS (застосунок у рядку меню) і мобільні Node (iOS/Android). Супутні застосунки для Windows і
Linux заплановані, але Gateway уже повністю підтримується сьогодні.
Нативні супутні застосунки для Windows також заплановані; для Gateway рекомендується WSL2.

## Виберіть свою ОС

- macOS: [macOS](/uk/platforms/macos)
- iOS: [iOS](/uk/platforms/ios)
- Android: [Android](/uk/platforms/android)
- Windows: [Windows](/uk/platforms/windows)
- Linux: [Linux](/uk/platforms/linux)

## VPS і хостинг

- Центр VPS: [Хостинг VPS](/uk/vps)
- Fly.io: [Fly.io](/uk/install/fly)
- Hetzner (Docker): [Hetzner](/uk/install/hetzner)
- GCP (Compute Engine): [GCP](/uk/install/gcp)
- Azure (Linux VM): [Azure](/uk/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/uk/install/exe-dev)

## Поширені посилання

- Посібник зі встановлення: [Початок роботи](/uk/start/getting-started)
- Runbook Gateway: [Gateway](/uk/gateway)
- Конфігурація Gateway: [Конфігурація](/uk/gateway/configuration)
- Стан служби: `openclaw gateway status`

## Встановлення служби Gateway (CLI)

Скористайтеся одним із цих способів (усі підтримуються):

- Wizard (рекомендовано): `openclaw onboard --install-daemon`
- Напряму: `openclaw gateway install`
- Потік налаштування: `openclaw configure` → виберіть **Служба Gateway**
- Відновлення/міграція: `openclaw doctor` (пропонує встановити або виправити службу)

Ціль служби залежить від ОС:

- macOS: LaunchAgent (`ai.openclaw.gateway` або `ai.openclaw.<profile>`; застаріле `com.openclaw.*`)
- Linux/WSL2: користувацька служба systemd (`openclaw-gateway[-<profile>].service`)
- Нативний Windows: Scheduled Task (`OpenClaw Gateway` або `OpenClaw Gateway (<profile>)`), із резервним елементом входу в теку Startup для кожного користувача, якщо створення завдання заборонено

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Застосунок macOS](/uk/platforms/macos)
- [Застосунок iOS](/uk/platforms/ios)
