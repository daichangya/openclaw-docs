---
read_when:
    - Ви хочете, щоб OpenClaw працював 24/7 на GCP
    - Вам потрібен production-grade Gateway, який завжди працює, на власній VM
    - Ви хочете повністю контролювати збереження даних, бінарні файли та поведінку під час перезапуску
summary: Запускайте OpenClaw Gateway 24/7 на VM GCP Compute Engine (Docker) зі стійким збереженням стану
title: GCP
x-i18n:
    generated_at: "2026-04-24T03:18:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw на GCP Compute Engine (Docker, посібник для production VPS)

## Мета

Запустити постійний Gateway OpenClaw на VM GCP Compute Engine за допомогою Docker зі стійким збереженням стану, вбудованими бінарними файлами та безпечною поведінкою під час перезапуску.

Якщо ви хочете «OpenClaw 24/7 за ~$5-12/міс», це надійне налаштування в Google Cloud.
Ціна залежить від типу машини й регіону; виберіть найменшу VM, яка відповідає вашому навантаженню, і масштабуйтеся вгору, якщо зіткнетеся з OOM.

## Що ми робимо (простими словами)?

- Створюємо проєкт GCP і вмикаємо білінг
- Створюємо VM Compute Engine
- Установлюємо Docker (ізольоване runtime-середовище застосунку)
- Запускаємо OpenClaw Gateway у Docker
- Зберігаємо `~/.openclaw` + `~/.openclaw/workspace` на хості (переживає перезапуски/перебудови)
- Отримуємо доступ до Control UI з вашого ноутбука через SSH-тунель

Цей змонтований стан `~/.openclaw` містить `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`
для кожного агента та `.env`.

До Gateway можна отримати доступ через:

- Переадресацію порту SSH з вашого ноутбука
- Пряме відкриття порту, якщо ви самостійно налаштовуєте firewall і токени

У цьому посібнику використовується Debian на GCP Compute Engine.
Ubuntu також підійде; зіставте пакети відповідно.
Для загального процесу Docker дивіться [Docker](/uk/install/docker).

---

## Швидкий шлях (для досвідчених операторів)

1. Створіть проєкт GCP і ввімкніть API Compute Engine
2. Створіть VM Compute Engine (e2-small, Debian 12, 20GB)
3. Підключіться до VM через SSH
4. Установіть Docker
5. Клонуйте репозиторій OpenClaw
6. Створіть постійні каталоги на хості
7. Налаштуйте `.env` і `docker-compose.yml`
8. Вбудуйте потрібні бінарні файли, зберіть і запустіть

---

## Що вам потрібно

- Обліковий запис GCP (free tier доступний для e2-micro)
- Встановлений gcloud CLI (або використовуйте Cloud Console)
- SSH-доступ із вашого ноутбука
- Базовий комфорт із SSH + копіюванням/вставленням
- ~20-30 хвилин
- Docker і Docker Compose
- Облікові дані автентифікації моделі
- Необов’язкові облікові дані провайдерів
  - QR WhatsApp
  - токен бота Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Встановити gcloud CLI (або використовувати Console)">
    **Варіант A: gcloud CLI** (рекомендовано для автоматизації)

    Установіть з [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Ініціалізуйте та пройдіть автентифікацію:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Варіант B: Cloud Console**

    Усі кроки можна виконати через веб-UI за адресою [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Створити проєкт GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Увімкніть білінг на [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (потрібно для Compute Engine).

    Увімкніть API Compute Engine:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Перейдіть до IAM & Admin > Create Project
    2. Назвіть проєкт і створіть його
    3. Увімкніть білінг для проєкту
    4. Перейдіть до APIs & Services > Enable APIs > знайдіть "Compute Engine API" > Enable

  </Step>

  <Step title="Створити VM">
    **Типи машин:**

    | Тип       | Характеристики            | Вартість           | Примітки                                     |
    | --------- | ------------------------- | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM           | ~$25/міс           | Найнадійніший варіант для локальних Docker-збірок |
    | e2-small  | 2 vCPU, 2GB RAM           | ~$12/міс           | Мінімально рекомендовано для Docker-збірки   |
    | e2-micro  | 2 vCPU (shared), 1GB RAM  | Підпадає під free tier | Часто завершується OOM під час Docker-збірки (exit 137) |

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

    1. Перейдіть до Compute Engine > VM instances > Create instance
    2. Назва: `openclaw-gateway`
    3. Регіон: `us-central1`, зона: `us-central1-a`
    4. Тип машини: `e2-small`
    5. Завантажувальний диск: Debian 12, 20GB
    6. Створіть VM

  </Step>

  <Step title="Підключитися до VM через SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Натисніть кнопку "SSH" поруч із вашою VM на панелі Compute Engine.

    Примітка: поширення SSH-ключа може тривати 1-2 хвилини після створення VM. Якщо підключення відхилено, зачекайте й спробуйте ще раз.

  </Step>

  <Step title="Установити Docker (на VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Вийдіть і ввійдіть знову, щоб зміна групи набула чинності:

    ```bash
    exit
    ```

    Потім знову підключіться через SSH:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Перевірте:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Клонувати репозиторій OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Цей посібник виходить із того, що ви збиратимете власний образ, щоб гарантувати збереження бінарних файлів.

  </Step>

  <Step title="Створити постійні каталоги на хості">
    Docker-контейнери є ефемерними.
    Увесь довготривалий стан має зберігатися на хості.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Налаштувати змінні середовища">
    Створіть `.env` у корені репозиторію.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Залиште `OPENCLAW_GATEWAY_TOKEN` порожнім, якщо ви явно не хочете
    керувати ним через `.env`; OpenClaw записує випадковий токен gateway у
    конфігурацію під час першого запуску. Згенеруйте пароль keyring і вставте його в
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Не комітьте цей файл.**

    Цей файл `.env` призначений для змінних середовища контейнера/runtime, таких як `OPENCLAW_GATEWAY_TOKEN`.
    Збережена OAuth/API-key автентифікація провайдерів живе в змонтованому
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
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
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

    `--allow-unconfigured` призначений лише для зручності початкового запуску, це не заміна належної конфігурації gateway. Усе одно налаштуйте автентифікацію (`gateway.auth.token` або пароль) і використовуйте безпечні параметри bind для вашого розгортання.

  </Step>

  <Step title="Спільні кроки runtime Docker VM">
    Скористайтеся спільним посібником runtime для загального процесу Docker-хоста:

    - [Вбудуйте потрібні бінарні файли в образ](/uk/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Збирання і запуск](/uk/install/docker-vm-runtime#build-and-launch)
    - [Що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where)
    - [Оновлення](/uk/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Примітки щодо запуску на GCP">
    На GCP, якщо збирання завершується помилкою `Killed` або `exit code 137` під час `pnpm install --frozen-lockfile`, VM не вистачає пам’яті. Використовуйте щонайменше `e2-small` або `e2-medium` для надійніших перших збірок.

    Під час прив’язки до LAN (`OPENCLAW_GATEWAY_BIND=lan`) перед продовженням налаштуйте довірене джерело browser:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Якщо ви змінили порт gateway, замініть `18789` на налаштований вами порт.

  </Step>

  <Step title="Доступ із вашого ноутбука">
    Створіть SSH-тунель для переадресації порту Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Відкрийте в browser:

    `http://127.0.0.1:18789/`

    Знову виведіть чисте посилання на панель:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Якщо UI запитує автентифікацію через shared secret, вставте налаштований токен або
    пароль у налаштуваннях Control UI. Цей процес Docker типово записує токен; якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте натомість цей
    пароль.

    Якщо Control UI показує `unauthorized` або `disconnected (1008): pairing required`, підтвердьте пристрій browser:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Потрібен знову довідник щодо збереження стану й оновлень?
    Дивіться [Docker VM Runtime](/uk/install/docker-vm-runtime#what-persists-where) і [Оновлення Docker VM Runtime](/uk/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Усунення проблем

**SSH connection refused**

Поширення SSH-ключа може тривати 1-2 хвилини після створення VM. Зачекайте й повторіть спробу.

**Проблеми з OS Login**

Перевірте свій профіль OS Login:

```bash
gcloud compute os-login describe-profile
```

Переконайтеся, що ваш обліковий запис має потрібні IAM-дозволи (Compute OS Login або Compute OS Admin Login).

**Out of memory (OOM)**

Якщо Docker-збірка завершується з `Killed` і `exit code 137`, VM було зупинено через OOM. Оновіть до e2-small (мінімум) або e2-medium (рекомендовано для надійних локальних збірок):

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service accounts (найкраща практика безпеки)

Для особистого використання ваш звичайний обліковий запис користувача цілком підходить.

Для автоматизації або CI/CD-конвеєрів створіть окремий service account з мінімальними дозволами:

1. Створіть service account:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Надайте роль Compute Instance Admin (або вужчу користувацьку роль):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Не використовуйте роль Owner для автоматизації. Дотримуйтеся принципу найменших привілеїв.

Дивіться [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) для подробиць про ролі IAM.

---

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Сполучіть локальні пристрої як nodes: [Nodes](/uk/nodes)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)

## Пов’язано

- [Огляд встановлення](/uk/install)
- [Azure](/uk/install/azure)
- [VPS-хостинг](/uk/vps)
