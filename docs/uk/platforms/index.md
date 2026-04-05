---
read_when:
    - Пошук підтримуваних ОС або шляхів встановлення
    - Вибір місця для запуску Gateway
summary: Огляд підтримки платформ (Gateway + супутні застосунки)
title: Платформи
x-i18n:
    generated_at: "2026-04-05T18:09:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# Платформи

Ядро OpenClaw написане на TypeScript. **Node — рекомендоване runtime-середовище**.
Bun не рекомендований для Gateway (баги WhatsApp/Telegram).

Існують супутні застосунки для macOS (застосунок рядка меню) і мобільних вузлів (iOS/Android). Супутні застосунки для Windows і
Linux заплановані, але Gateway уже повністю підтримується сьогодні.
Нативні супутні застосунки для Windows також заплановані; Gateway рекомендовано запускати через WSL2.

## Виберіть свою ОС

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS і хостинг

- Центр VPS: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + HTTPS-проксі): [exe.dev](/install/exe-dev)

## Поширені посилання

- Посібник зі встановлення: [Getting Started](/start/getting-started)
- Операційний посібник Gateway: [Gateway](/gateway)
- Конфігурація Gateway: [Configuration](/gateway/configuration)
- Статус сервісу: `openclaw gateway status`

## Установлення сервісу Gateway (CLI)

Використовуйте один із цих способів (усі підтримуються):

- Майстер (рекомендовано): `openclaw onboard --install-daemon`
- Напряму: `openclaw gateway install`
- Через потік налаштування: `openclaw configure` → виберіть **Gateway service**
- Виправлення/міграція: `openclaw doctor` (пропонує встановити або виправити сервіс)

Ціль сервісу залежить від ОС:

- macOS: LaunchAgent (`ai.openclaw.gateway` або `ai.openclaw.<profile>`; застаріле `com.openclaw.*`)
- Linux/WSL2: користувацький сервіс systemd (`openclaw-gateway[-<profile>].service`)
- Нативний Windows: Scheduled Task (`OpenClaw Gateway` або `OpenClaw Gateway (<profile>)`), із резервним fallback на елемент входу в Startup-folder для кожного користувача, якщо створення завдання заборонено
