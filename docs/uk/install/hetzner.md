---
read_when:
    - Ви хочете, щоб OpenClaw працював 24/7 на хмарному VPS (а не на вашому ноутбуці)
    - Ви хочете мати готовий до production, постійно ввімкнений Gateway на власному VPS
    - Ви хочете повний контроль над збереженням стану, бінарними файлами та поведінкою перезапуску
    - Ви запускаєте OpenClaw у Docker на Hetzner або подібному провайдері
summary: Запускайте OpenClaw Gateway 24/7 на недорогому VPS Hetzner (Docker) зі стійким станом і вбудованими бінарними файлами
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T03:18:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw на Hetzner (Docker, посібник для production VPS)

## Мета

Запустити постійний Gateway OpenClaw на VPS Hetzner за допомогою Docker, зі стійким станом, вбудованими бінарними файлами та безпечною поведінкою перезапуску.

Якщо ви хочете «OpenClaw 24/7 за ~$5», це найпростіше надійне налаштування.
Ціни Hetzner змінюються; виберіть найменший VPS на Debian/Ubuntu і збільшуйте ресурси, якщо зіткнетеся з OOM.

Нагадування про модель безпеки:

- Спільні для компанії агенти — це нормально, коли всі перебувають у межах однієї зони довіри, а середовище виконання використовується лише для бізнесу.
- Дотримуйтеся суворого розділення: окремий VPS/середовище виконання + окремі облікові записи; жодних особистих профілів Apple/Google/браузера/менеджера паролів на цьому хості.
- Якщо користувачі є ворожими один до одного, розділяйте за gateway/хостом/користувачем ОС.

Див. [Безпека](/uk/gateway/security) і [Хостинг VPS](/uk/vps).

## Що ми робимо (простими словами)?

- Орендуємо невеликий Linux-сервер (VPS Hetzner)
- Установлюємо Docker (ізольоване середовище виконання застосунку)
- Запускаємо Gateway OpenClaw у Docker
- Зберігаємо `~/.openclaw` + `~/.openclaw/workspace` на хості (переживає перезапуски/перезбирання)
- Отримуємо доступ до інтерфейсу керування зі свого ноутбука через SSH-тунель

Цей змонтований стан `~/.openclaw` містить `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`
для кожного агента та `.env`.

Доступ до Gateway можна отримати через:

- Переадресацію порту SSH з вашого ноутбука
- Пряме відкриття порту, якщо ви самі керуєте firewall і token

Цей посібник розрахований на Ubuntu або Debian на Hetzner.  
Якщо у вас інший Linux VPS, доберіть відповідні пакети самостійно.
Загальний процес для Docker див. у [Docker](/uk/install/docker).

---

## Швидкий шлях (для досвідчених операторів)

1. Підготуйте VPS Hetzner
2. Установіть Docker
3. Клонуйте репозиторій OpenClaw
4. Створіть постійні каталоги на хості
5. Налаштуйте `.env` і `docker-compose.yml`
6. Вбудуйте потрібні бінарні файли в образ
7. `docker compose up -d`
8. Перевірте збереження стану і доступ до Gateway

---

## Що вам потрібно

- VPS Hetzner з root-доступом
- SSH-доступ з вашого ноутбука
- Базове вміння користуватися SSH + copy/paste
- ~20 хвилин
- Docker і Docker Compose
- Облікові дані автентифікації моделі
- Необов’язкові облікові дані provider
  - QR WhatsApp
  - token бота Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Підготуйте VPS">
    Створіть VPS на Ubuntu або Debian у Hetzner.

    Підключіться як root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Цей посібник передбачає, що VPS є станозбережувальним.
    Не ставтеся до нього як до одноразової інфраструктури.

  </Step>

  <Step title="Установіть Docker (на VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Перевірте:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Клонуйте репозиторій OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Цей посібник передбачає, що ви збиратимете власний образ, щоб гарантувати стійкість бінарних файлів.

  </Step>

  <Step title="Створіть постійні каталоги на хості">
    Контейнери Docker є ефемерними.
    Увесь довготривалий стан має зберігатися на хості.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Налаштуйте змінні середовища">
    Створіть `.env` у корені репозиторію.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Залиште `OPENCLAW_GATEWAY_TOKEN` порожнім, якщо тільки ви явно не хочете
    керувати ним через `.env`; під час першого запуску OpenClaw записує випадковий gateway token у
    конфігурацію. Згенеруйте пароль keyring і вставте його в
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не комітьте цей файл.**

    Цей файл `.env` призначений для env контейнера/середовища виконання, таких як `OPENCLAW_GATEWAY_TOKEN`.
    Збережена автентифікація provider через OAuth/API-key міститься в змонтованому
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Конфігурація Docker Compose">
    Створіть або оновіть `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` призначено лише для зручності початкового налаштування, це не заміна належної конфігурації gateway. Усе одно налаштуйте автентифікацію (`gateway.auth.token` або пароль) і використовуйте безпечні параметри bind для свого розгортання.

  </Step>

  <Step title="Спільні кроки середовища виконання Docker VM">
    Використайте спільний посібник із середовища виконання для типового сценарію Docker-хоста:

    - [Вбудуйте потрібні бінарні файли в образ](/uk/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Збирання і запуск](/uk/install/docker-vm-runtime#build-and-launch)
    - [Що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/uk/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Доступ, специфічний для Hetzner">
    Після спільних кроків зі збирання і запуску створіть тунель зі свого ноутбука:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Відкрийте:

    `http://127.0.0.1:18789/`

    Вставте налаштований спільний секрет. У цьому посібнику типово використовується gateway token; якщо ви перейшли на автентифікацію через password, використовуйте цей пароль.

  </Step>
</Steps>

Спільна карта збереження стану знаходиться в [Docker VM Runtime](/uk/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Для команд, які надають перевагу процесам infrastructure-as-code, є підтримуване спільнотою налаштування Terraform, що надає:

- Модульну конфігурацію Terraform з керуванням віддаленим state
- Автоматичне підготування через cloud-init
- Скрипти розгортання (bootstrap, deploy, backup/restore)
- Посилення безпеки (firewall, UFW, доступ лише через SSH)
- Конфігурацію SSH-тунелю для доступу до gateway

**Репозиторії:**

- Інфраструктура: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Конфігурація Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Цей підхід доповнює наведене вище налаштування Docker відтворюваними розгортаннями, інфраструктурою під контролем версій і автоматизованим аварійним відновленням.

> **Примітка:** Підтримується спільнотою. Для проблем або внесків див. посилання на репозиторії вище.

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)

## Пов’язано

- [Огляд встановлення](/uk/install)
- [Fly.io](/uk/install/fly)
- [Docker](/uk/install/docker)
- [Хостинг VPS](/uk/vps)
