---
read_when:
    - Ви хочете, щоб OpenClaw працював на GCP 24/7
    - Ви хочете production-grade Gateway, який завжди працює, на власній VM
    - Ви хочете повний контроль над persistence, binaries і поведінкою перезапуску
summary: Запуск OpenClaw Gateway 24/7 на VM GCP Compute Engine (Docker) зі стійким зберіганням стану
title: GCP
x-i18n:
    generated_at: "2026-04-05T18:07:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73daaee3de71dad5175f42abf3e11355f2603b2f9e2b2523eac4d4c7015e3ebc
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw на GCP Compute Engine (Docker, гайд для production VPS)

## Мета

Запустити постійний OpenClaw Gateway на VM GCP Compute Engine за допомогою Docker зі стійким станом, вбудованими binaries і безпечною поведінкою перезапуску.

Якщо вам потрібен “OpenClaw 24/7 приблизно за $5-12/міс.”, це надійне налаштування в Google Cloud.
Вартість залежить від типу машини та регіону; оберіть найменшу VM, яка відповідає вашому навантаженню, і масштабуйте її вгору, якщо зіткнетеся з OOM.

## Що ми робимо (простими словами)?

- Створюємо проєкт GCP і вмикаємо білінг
- Створюємо VM Compute Engine
- Встановлюємо Docker (ізольоване runtime-середовище застосунку)
- Запускаємо OpenClaw Gateway у Docker
- Зберігаємо `~/.openclaw` + `~/.openclaw/workspace` на хості (переживає перезапуски/перебудови)
- Отримуємо доступ до Control UI з ноутбука через SSH tunnel

Цей змонтований стан `~/.openclaw` включає `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`
для кожного агента та `.env`.

Доступ до Gateway можна отримати через:

- переадресацію портів SSH з вашого ноутбука
- пряме відкриття порту, якщо ви самі керуєте firewall і tokens

У цьому гайді використовується Debian на GCP Compute Engine.
Ubuntu також підходить; відповідно підберіть пакети.
Для загального потоку Docker див. [Docker](/install/docker).

---

## Швидкий шлях (для досвідчених операторів)

1. Створіть проєкт GCP + увімкніть Compute Engine API
2. Створіть VM Compute Engine (e2-small, Debian 12, 20GB)
3. Підключіться до VM через SSH
4. Встановіть Docker
5. Клонуйте репозиторій OpenClaw
6. Створіть стійкі каталоги на хості
7. Налаштуйте `.env` і `docker-compose.yml`
8. Вбудуйте потрібні binaries, зберіть і запустіть

---

## Що вам знадобиться

- Обліковий запис GCP (e2-micro підпадає під free tier)
- Установлений gcloud CLI (або використовуйте Cloud Console)
- SSH-доступ з вашого ноутбука
- Базове вміння користуватися SSH + копіюванням/вставленням
- ~20-30 хвилин
- Docker і Docker Compose
- Облікові дані auth моделі
- Необов’язкові облікові дані провайдерів
  - QR для WhatsApp
  - bot token Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Встановіть gcloud CLI (або використовуйте Console)">
    **Варіант A: gcloud CLI** (рекомендовано для автоматизації)

    Встановіть із [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Ініціалізуйте та автентифікуйтеся:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Варіант B: Cloud Console**

    Усі кроки можна виконати через веб-UI на [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Створіть проєкт GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Увімкніть білінг на [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (обов’язково для Compute Engine).

    Увімкніть Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Перейдіть у IAM & Admin > Create Project
    2. Задайте назву та створіть проєкт
    3. Увімкніть білінг для проєкту
    4. Перейдіть у APIs & Services > Enable APIs > знайдіть "Compute Engine API" > Enable

  </Step>

  <Step title="Створіть VM">
    **Типи машин:**

    | Тип       | Характеристики             | Вартість           | Примітки                                     |
    | --------- | -------------------------- | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM            | ~$25/міс.          | Найнадійніший варіант для локальних збірок Docker |
    | e2-small  | 2 vCPU, 2GB RAM            | ~$12/міс.          | Мінімально рекомендовано для збірки Docker   |
    | e2-micro  | 2 vCPU (спільні), 1GB RAM  | Підпадає під free tier | Часто завершується невдачею через OOM під час збірки Docker (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Перейдіть у Compute Engine > VM instances > Create instance
    2. Назва: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Тип машини: `e2-small`
    5. Завантажувальний диск: Debian 12, 20GB
    6. Створіть VM

  </Step>

  <Step title="Підключіться до VM через SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Натисніть кнопку "SSH" поруч із вашою VM на панелі Compute Engine.

    Примітка: поширення SSH-ключа може тривати 1-2 хвилини після створення VM. Якщо підключення відхиляється, зачекайте й повторіть спробу.

  </Step>

  <Step title="Встановіть Docker (на VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Вийдіть із системи та зайдіть знову, щоб зміна групи набула чинності:

    ```bash
    exit
    ```

    Потім знову підключіться через SSH:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Перевірка:

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

    Цей гайд припускає, що ви збиратимете кастомний image, щоб гарантувати persistence binaries.

  </Step>

  <Step title="Створіть стійкі каталоги на хості">
    Контейнери Docker є ефемерними.
    Увесь довготривалий стан має зберігатися на хості.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Налаштуйте змінні середовища">
    Створіть `.env` у корені репозиторію.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Згенеруйте сильні секрети:

    ```bash
    openssl rand -hex 32
    ```

    **Не комітьте цей файл.**

    Цей файл `.env` призначений для env runtime контейнера, таких як `OPENCLAW_GATEWAY_TOKEN`.
    Збережені OAuth/API-key auth провайдерів зберігаються в змонтованому
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
          # Рекомендовано: залишайте Gateway доступним лише через loopback на VM; доступ отримуйте через SSH tunnel.
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

    `--allow-unconfigured` потрібен лише для зручності bootstrap, але не замінює правильну конфігурацію gateway. Усе одно задайте auth (`gateway.auth.token` або password) і використовуйте безпечні параметри bind для свого розгортання.

  </Step>

  <Step title="Спільні кроки runtime для Docker VM">
    Для спільного потоку роботи з Docker host використовуйте спільний runtime-гайд:

    - [Вбудуйте потрібні binaries в image](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Збірка і запуск](/install/docker-vm-runtime#build-and-launch)
    - [Що і де зберігається](/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Примітки щодо запуску, специфічні для GCP">
    На GCP, якщо збірка завершується помилкою `Killed` або `exit code 137` під час `pnpm install --frozen-lockfile`, VM не вистачає пам’яті. Використовуйте мінімум `e2-small`, або `e2-medium` для надійніших перших збірок.

    Під час bind до LAN (`OPENCLAW_GATEWAY_BIND=lan`) перед продовженням налаштуйте довірений browser origin:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Якщо ви змінили порт gateway, замініть `18789` на свій налаштований порт.

  </Step>

  <Step title="Доступ із вашого ноутбука">
    Створіть SSH tunnel для переадресації порту Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Відкрийте у браузері:

    `http://127.0.0.1:18789/`

    Повторно виведіть чисте посилання на dashboard:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Якщо UI запитує auth через shared-secret, вставте налаштований token або
    password у налаштуваннях Control UI. Цей потік Docker за замовчуванням записує token;
    якщо ви перемкнете конфігурацію контейнера на auth через password, використовуйте
    натомість цей password.

    Якщо Control UI показує `unauthorized` або `disconnected (1008): pairing required`, схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Знову потрібна довідка про спільне persistence та оновлення?
    Див. [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) і [Оновлення Docker VM Runtime](/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Усунення несправностей

**SSH connection refused**

Поширення SSH-ключа може тривати 1-2 хвилини після створення VM. Зачекайте й повторіть спробу.

**Проблеми з OS Login**

Перевірте свій профіль OS Login:

```bash
gcloud compute os-login describe-profile
```

Переконайтеся, що ваш обліковий запис має потрібні дозволи IAM (Compute OS Login або Compute OS Admin Login).

**Нестача пам’яті (OOM)**

Якщо збірка Docker завершується помилкою `Killed` і `exit code 137`, VM було завершено через OOM. Оновіть до e2-small (мінімум) або e2-medium (рекомендовано для надійних локальних збірок):

```bash
# Спочатку зупиніть VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Змініть тип машини
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Запустіть VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service accounts (найкраща практика безпеки)

Для особистого використання ваш звичайний обліковий запис користувача цілком підходить.

Для автоматизації або CI/CD pipelines створіть окремий service account з мінімальними дозволами:

1. Створіть service account:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Надайте роль Compute Instance Admin (або вужчу кастомну роль):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Уникайте використання ролі Owner для автоматизації. Дотримуйтеся принципу найменших привілеїв.

Див. [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) для деталей щодо ролей IAM.

---

## Наступні кроки

- Налаштуйте канали повідомлень: [Channels](/channels)
- Зв’яжіть локальні пристрої як nodes: [Nodes](/nodes)
- Налаштуйте Gateway: [Конфігурація Gateway](/gateway/configuration)
