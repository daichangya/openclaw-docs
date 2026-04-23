---
read_when:
    - Ви хочете використовувати контейнеризований Gateway замість локальних установлень
    - Ви перевіряєте потік Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-23T06:44:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (необов’язково)

Docker **необов’язковий**. Використовуйте його лише тоді, якщо вам потрібен контейнеризований Gateway або ви хочете перевірити потік Docker.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних установлень.
- **Ні**: ви працюєте на власній машині й просто хочете найшвидший цикл розробки. Замість цього використовуйте звичайний потік установлення.
- **Примітка про sandboxing**: типовий backend sandbox використовує Docker, коли sandboxing увімкнено, але sandboxing за замовчуванням вимкнено і він **не** вимагає запуску всього Gateway у Docker. Також доступні backend-и sandbox SSH і OpenShell. Див. [Sandboxing](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути примусово завершено через OOM на хостах з 1 ГБ з кодом виходу 137)
- Достатньо дискового простору для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої доступності](/uk/gateway/security),
  особливо політику брандмауера Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    У корені репозиторію запустіть сценарій налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це збере образ Gateway локально. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Завершіть онбординг">
    Сценарій налаштування запускає онбординг автоматично. Він:

    - запропонує ввести API-ключі провайдерів
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг перед запуском і запис конфігурації виконуються через
    `openclaw-gateway` безпосередньо. `openclaw-cli` призначений для команд, які ви запускаєте вже після
    того, як контейнер Gateway існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері й вставте налаштований
    спільний секрет у Settings. Сценарій налаштування за замовчуванням записує токен у `.env`; якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте натомість цей
    пароль.

    Потрібна URL-адреса ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов’язково)">
    Використайте контейнер CLI, щоб додати канали обміну повідомленнями:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord)

  </Step>
</Steps>

### Ручний потік

Якщо ви віддаєте перевагу запуску кожного кроку вручну замість використання сценарію налаштування:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Запускайте `docker compose` з кореня репозиторію. Якщо ви ввімкнули `OPENCLAW_EXTRA_MOUNTS`
або `OPENCLAW_HOME_VOLUME`, сценарій налаштування записує `docker-compose.extra.yml`;
додавайте його через `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` використовує спільний мережевий простір імен із `openclaw-gateway`, це
інструмент для використання після запуску. До `docker compose up -d openclaw-gateway` виконуйте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Сценарій налаштування приймає ці необов’язкові змінні середовища:

| Variable                       | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Установити додаткові apt-пакети під час збирання (через пробіл) |
| `OPENCLAW_EXTENSIONS`          | Попередньо встановити залежності plugin під час збирання (назви через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`        | Додаткові bind-mount-и хоста (через кому `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Зберігати `/home/node` в іменованому Docker volume              |
| `OPENCLAW_SANDBOX`             | Увімкнути bootstrap sandbox (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_DOCKER_SOCKET`       | Перевизначити шлях до Docker socket                             |

### Перевірки стану

Кінцеві точки probe контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # живучість
curl -fsS http://127.0.0.1:18789/readyz     # готовність
```

Docker image містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований розширений знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN чи loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював із публікацією порту Docker.

- `lan` (за замовчуванням): браузер хоста та CLI хоста можуть досягати опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть
  напряму досягати Gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хостів на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Сховище та збереження даних

Docker Compose монтує `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдерів
- `.env` для секретів середовища виконання на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Повні відомості про збереження даних у розгортаннях VM див. у
[Docker VM Runtime - Що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Точки зростання диска:** стежте за `media/`, JSONL-файлами сесій, `cron/runs/*.jsonl`,
і циклічними файловими журналами в `/tmp/openclaw/`.

### Допоміжні команди оболонки (необов’язково)

Для зручнішого повсякденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб локальний файл helper відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Див. [ClawDock](/uk/install/clawdock), щоб отримати повний посібник із helper-ів.

<AccordionGroup>
  <Accordion title="Увімкнути sandbox агента для Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Користувацький шлях до socket (наприклад, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Сценарій монтує `docker.sock` лише після того, як пройдуть передумови sandbox. Якщо
    налаштування sandbox не може бути завершене, сценарій скидає `agents.defaults.sandbox.mode`
    до `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY для Compose через `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка про безпеку спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, тому команди CLI
    можуть досягати Gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ виконується від імені `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що ваші bind-mount-и хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядковуйте Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу уникнути повторного запуску
    `pnpm install`, якщо lockfile-и не змінювалися:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Параметри контейнера для досвідчених користувачів">
    Типовий образ орієнтований насамперед на безпеку й виконується від імені непривілейованого `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Установіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузерів**: установіть
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо у майстрі ви виберете OpenAI Codex OAuth, відкриється URL-адреса в браузері. У
    Docker або headless-середовищах скопіюйте повну URL-адресу перенаправлення, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker image використовує `node:24-bookworm` і публікує анотації OCI базового образу,
    зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Див.
    [Анотації OCI image](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime), щоб отримати кроки розгортання на спільній VM,
включно з вбудовуванням бінарних файлів, збереженням даних та оновленнями.

## Sandbox агента

Коли `agents.defaults.sandbox` увімкнено з backend Docker, Gateway
виконує інструменти агента (shell, читання/запис файлів тощо) в ізольованих Docker
контейнерах, тоді як сам Gateway лишається на хості. Це дає вам жорстку межу
навколо недовірених або багатокористувацьких сесій агента без контейнеризації всього
Gateway.

Область дії sandbox може бути на рівні агента (за замовчуванням), на рівні сесії або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну інформацію про конфігурацію, образи, примітки щодо безпеки та профілі з кількома агентами див. у:

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ до оболонки контейнерів sandbox
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів

### Швидке ввімкнення

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Зберіть типовий образ sandbox:

```bash
scripts/sandbox-setup.sh
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер sandbox не запускається">
    Зберіть образ sandbox за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або встановіть `agents.defaults.sandbox.docker.image` на власний образ.
    Контейнери автоматично створюються для кожної сесії на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у sandbox">
    Установіть `docker.user` у значення UID:GID, яке відповідає власнику змонтованого workspace,
    або змініть власника папки workspace.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в sandbox">
    OpenClaw виконує команди через `sh -lc` (login shell), що завантажує
    `/etc/profile` і може скидати PATH. Установіть `docker.env.PATH`, щоб додати
    ваші шляхи до користувацьких інструментів на початок, або додайте сценарій у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Примусове завершення через OOM під час збирання образу (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини та повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне pairing у Control UI">
    Отримайте нове посилання Dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Devices](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки pairing із Docker CLI">
    Скиньте режим і прив’язку Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Install Overview](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на основі Podman
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Updating](/uk/install/updating) — як підтримувати OpenClaw в актуальному стані
- [Configuration](/uk/gateway/configuration) — конфігурація Gateway після встановлення
