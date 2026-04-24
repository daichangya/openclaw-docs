---
read_when:
    - Шукаєте статус companion app для Linux
    - Плануєте покриття платформ або внески
    - Налагодження завершення через OOM у Linux або коду виходу 137 на VPS чи в контейнері
summary: Підтримка Linux + стан companion app
title: Застосунок Linux
x-i18n:
    generated_at: "2026-04-24T03:19:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Gateway повністю підтримується на Linux. **Node — рекомендоване середовище виконання**.
Bun не рекомендований для Gateway (помилки WhatsApp/Telegram).

Нативні companion app для Linux заплановані. Внески вітаються, якщо ви хочете допомогти створити такий застосунок.

## Швидкий шлях для початківців (VPS)

1. Встановіть Node 24 (рекомендовано; Node 22 LTS, наразі `22.14+`, також усе ще працює для сумісності)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. З вашого ноутбука: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Відкрийте `http://127.0.0.1:18789/` і пройдіть автентифікацію за допомогою налаштованого спільного секрету (типово token; password, якщо ви встановили `gateway.auth.mode: "password"`)

Повний посібник для Linux-сервера: [Linux Server](/uk/vps). Покроковий приклад VPS: [exe.dev](/uk/install/exe-dev)

## Встановлення

- [Початок роботи](/uk/start/getting-started)
- [Встановлення й оновлення](/uk/install/updating)
- Необов’язкові сценарії: [Bun (експериментально)](/uk/install/bun), [Nix](/uk/install/nix), [Docker](/uk/install/docker)

## Gateway

- [Посібник з Gateway](/uk/gateway)
- [Конфігурація](/uk/gateway/configuration)

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

Коли з’явиться запит, виберіть **Gateway service**.

Відновлення/міграція:

```
openclaw doctor
```

## Керування системою (systemd user unit)

Типово OpenClaw встановлює systemd **user** service. Для спільних або постійно активних серверів використовуйте **system**
service. `openclaw gateway install` і
`openclaw onboard --install-daemon` уже генерують для вас поточний канонічний unit;
пишіть його вручну лише тоді, коли вам потрібне власне налаштування system/service-manager.
Повні вказівки щодо сервісу містяться в [Посібнику з Gateway](/uk/gateway).

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

## Тиск на пам’ять і завершення через OOM

У Linux ядро вибирає жертву OOM, коли хост, VM або cgroup контейнера
вичерпує пам’ять. Gateway може бути невдалою жертвою, тому що він володіє довготривалими
сесіями та з’єднаннями каналів. Тому OpenClaw, коли це можливо, зсуває пріоритет так, щоб
раніше за Gateway завершувалися короткоживучі дочірні процеси.

Для відповідних дочірніх запусків у Linux OpenClaw запускає дочірній процес через коротку
обгортку `/bin/sh`, яка підвищує власний `oom_score_adj` дочірнього процесу до `1000`, а потім
виконує `exec` реальної команди. Це непривілейована операція, тому що дочірній процес
лише збільшує ймовірність власного завершення через OOM.

Охоплені поверхні дочірніх процесів включають:

- дочірні команди, керовані supervisor,
- дочірні процеси PTY shell,
- дочірні процеси MCP stdio server,
- процеси browser/Chrome, запущені OpenClaw.

Обгортка працює лише в Linux і пропускається, якщо `/bin/sh` недоступний. Вона
також пропускається, якщо env дочірнього процесу встановлює `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` або `off`.

Щоб перевірити дочірній процес:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Очікуване значення для охоплених дочірніх процесів — `1000`. Процес Gateway має зберігати
свій звичайний показник, зазвичай `0`.

Це не замінює звичайне налаштування пам’яті. Якщо VPS або контейнер постійно
завершує дочірні процеси, збільшіть ліміт пам’яті, зменште паралелізм або додайте жорсткіші
обмеження ресурсів, наприклад systemd `MemoryMax=` або ліміти пам’яті на рівні контейнера.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Linux server](/uk/vps)
- [Raspberry Pi](/uk/install/raspberry-pi)
