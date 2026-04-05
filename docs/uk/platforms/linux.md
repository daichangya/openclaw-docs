---
read_when:
    - Пошук статусу companion app для Linux
    - Планування покриття платформ або внеску в розробку
summary: Підтримка Linux + статус companion app
title: Linux App
x-i18n:
    generated_at: "2026-04-05T18:09:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5dbfc89eb65e04347479fc6c9a025edec902fb0c544fb8d5bd09c24558ea03b1
    source_path: platforms/linux.md
    workflow: 15
---

# Linux App

Gateway повністю підтримується на Linux. **Node — рекомендоване runtime-середовище**.
Bun не рекомендується для Gateway (помилки WhatsApp/Telegram).

Нативні companion apps для Linux заплановані. Якщо ви хочете допомогти створити такий застосунок, внески вітаються.

## Швидкий шлях для початківців (VPS)

1. Установіть Node 24 (рекомендовано; Node 22 LTS, зараз `22.14+`, також працює для сумісності)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Із вашого ноутбука: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Відкрийте `http://127.0.0.1:18789/` і пройдіть автентифікацію за допомогою налаштованого shared secret (типово token; password, якщо ви встановили `gateway.auth.mode: "password"`)

Повний гайд для Linux server: [Linux Server](/vps). Покроковий приклад VPS: [exe.dev](/install/exe-dev)

## Встановлення

- [Початок роботи](/start/getting-started)
- [Встановлення та оновлення](/install/updating)
- Необов’язкові потоки: [Bun (експериментально)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Runbook Gateway](/gateway)
- [Конфігурація](/gateway/configuration)

## Встановлення сервісу Gateway (CLI)

Використайте один із цих варіантів:

```
openclaw onboard --install-daemon
```

Або:

```
openclaw gateway install
```

Або:

```
openclaw configure
```

Коли буде запит, виберіть **Gateway service**.

Відновлення/міграція:

```
openclaw doctor
```

## Керування системою (користувацький unit systemd)

OpenClaw за замовчуванням встановлює користувацький сервіс systemd **user**. Для спільних або постійно увімкнених серверів використовуйте **system** service. Команди `openclaw gateway install` і
`openclaw onboard --install-daemon` уже генерують для вас поточний канонічний unit;
пишіть його вручну лише тоді, коли вам потрібне кастомне налаштування system/service-manager.
Повні вказівки щодо сервісу містяться в [runbook Gateway](/gateway).

Мінімальне налаштування:

Створіть `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Увімкніть його:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
