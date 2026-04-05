---
read_when:
    - Ви хочете, щоб OpenClaw працював 24/7 на хмарному VPS (не на вашому ноутбуці)
    - Вам потрібен production-grade, постійно увімкнений Gateway на власному VPS
    - Вам потрібен повний контроль над збереженням стану, бінарними файлами та поведінкою після перезапуску
    - Ви запускаєте OpenClaw у Docker на Hetzner або подібному провайдері
summary: Запуск OpenClaw Gateway 24/7 на недорогому VPS Hetzner (Docker) зі стійким станом і вбудованими бінарними файлами
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T18:07:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw на Hetzner (Docker, посібник для production VPS)

## Мета

Запустити постійний Gateway OpenClaw на VPS Hetzner за допомогою Docker, зі стійким станом, вбудованими бінарними файлами та безпечною поведінкою після перезапуску.

Якщо вам потрібен “OpenClaw 24/7 за ~$5”, це найпростіше надійне налаштування.
Ціни Hetzner змінюються; виберіть найменший VPS на Debian/Ubuntu і масштабуйтеся вгору, якщо почнете отримувати OOM.

Нагадування про модель безпеки:

- Спільні для компанії агенти — це нормально, коли всі перебувають у межах однієї довірчої межі, а runtime використовується лише для бізнесу.
- Зберігайте суворе розділення: окремий VPS/runtime + окремі облікові записи; жодних особистих профілів Apple/Google/браузера/менеджера паролів на цьому хості.
- Якщо користувачі є взаємно недовіреними, розділяйте за gateway/хостом/користувачем ОС.

Див. [Security](/gateway/security) і [VPS hosting](/vps).

## Що ми робимо (простими словами)?

- Орендуємо невеликий Linux-сервер (VPS Hetzner)
- Установлюємо Docker (ізольоване runtime-середовище застосунку)
- Запускаємо Gateway OpenClaw у Docker
- Зберігаємо `~/.openclaw` + `~/.openclaw/workspace` на хості (переживає перезапуски/перебудови)
- Отримуємо доступ до Control UI зі свого ноутбука через SSH-тунель

Цей змонтований стан `~/.openclaw` включає `openclaw.json`, `auth-profiles.json` для кожного агента в
`agents/<agentId>/agent/auth-profiles.json` і `.env`.

До Gateway можна отримати доступ через:

- переадресацію SSH-порту з вашого ноутбука
- пряме відкриття порту, якщо ви самі керуєте firewall і токенами

Цей посібник розрахований на Ubuntu або Debian на Hetzner.  
Якщо ви на іншому Linux VPS, підберіть відповідні пакети.
Загальний процес для Docker див. у [Docker](/install/docker).

---

## Швидкий шлях (для досвідчених операторів)

1. Створити VPS Hetzner
2. Установити Docker
3. Клонувати репозиторій OpenClaw
4. Створити постійні каталоги на хості
5. Налаштувати `.env` і `docker-compose.yml`
6. Вбудувати потрібні бінарні файли в образ
7. `docker compose up -d`
8. Перевірити збереження стану й доступ до Gateway

---

## Що вам потрібно

- VPS Hetzner із root-доступом
- SSH-доступ із вашого ноутбука
- Базовий комфорт у роботі з SSH + copy/paste
- ~20 хвилин
- Docker і Docker Compose
- Облікові дані для автентифікації моделей
- Необов’язкові облікові дані провайдерів
  - QR WhatsApp
  - токен бота Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Створіть VPS">
    Створіть VPS на Ubuntu або Debian у Hetzner.

    Підключіться як root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    У цьому посібнику припускається, що VPS є stateful.
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

    У цьому посібнику припускається, що ви створите власний образ, щоб гарантувати збереження бінарних файлів.

  </Step>

  <Step title="Створіть постійні каталоги на хості">
    Контейнери Docker є ефемерними.
    Увесь довготривалий стан має зберігатися на хості.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Установити власника як користувача контейнера (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Налаштуйте змінні середовища">
    Створіть `.env` у корені репозиторію.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Згенеруйте сильні секрети:

    ```bash
    openssl rand -hex 32
    ```

    **Не комітьте цей файл.**

    Цей файл `.env` призначений для змінних середовища контейнера/runtime, таких як `OPENCLAW_GATEWAY_TOKEN`.
    Збережена автентифікація провайдерів через OAuth/API key міститься у змонтованому
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
          # Рекомендовано: залишайте Gateway доступним лише через loopback на VPS; доступ отримуйте через SSH-тунель.
          # Щоб відкрити його публічно, приберіть префікс `127.0.0.1:` і відповідно налаштуйте firewall.
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

    `--allow-unconfigured` потрібен лише для зручності початкового bootstrap, він не замінює повноцінну конфігурацію gateway. Усе одно налаштуйте автентифікацію (`gateway.auth.token` або пароль) і використовуйте безпечні параметри bind для свого розгортання.

  </Step>

  <Step title="Спільні кроки Docker VM runtime">
    Скористайтеся спільним посібником runtime для типового процесу Docker-хоста:

    - [Вбудуйте потрібні бінарні файли в образ](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Збірка і запуск](/install/docker-vm-runtime#build-and-launch)
    - [Що і де зберігається](/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Доступ, специфічний для Hetzner">
    Після спільних кроків зі збірки та запуску відкрийте тунель зі свого ноутбука:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Відкрийте:

    `http://127.0.0.1:18789/`

    Вставте налаштований спільний секрет. У цьому посібнику типово використовується токен gateway; якщо ви перейшли на password auth, використовуйте натомість цей пароль.

  </Step>
</Steps>

Спільна карта збереження стану наведена в [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Інфраструктура як код (Terraform)

Для команд, які віддають перевагу робочим процесам infrastructure-as-code, підтримуване спільнотою налаштування Terraform надає:

- Модульну конфігурацію Terraform з керуванням віддаленим станом
- Автоматизоване розгортання через cloud-init
- Скрипти розгортання (bootstrap, deploy, backup/restore)
- Зміцнення безпеки (firewall, UFW, доступ лише через SSH)
- Налаштування SSH-тунелю для доступу до gateway

**Репозиторії:**

- Інфраструктура: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Конфігурація Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Цей підхід доповнює описане вище налаштування Docker відтворюваними розгортаннями, інфраструктурою під контролем версій і автоматизованим аварійним відновленням.

> **Примітка:** підтримується спільнотою. З питань чи внесків див. посилання на репозиторії вище.

## Наступні кроки

- Налаштуйте канали повідомлень: [Channels](/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Updating](/install/updating)
