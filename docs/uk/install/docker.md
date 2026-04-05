---
read_when:
    - Ви хочете контейнеризований gateway замість локальних встановлень
    - Ви перевіряєте Docker flow
summary: Необов’язкове налаштування та onboarding OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-05T18:07:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker (необов’язково)

Docker **необов’язковий**. Використовуйте його лише якщо хочете контейнеризований gateway або хочете перевірити Docker flow.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, одноразове середовище gateway або ви хочете запустити OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте все на власній машині й просто хочете найшвидший dev-цикл. У такому разі використовуйте звичайний процес встановлення.
- **Примітка щодо sandboxing**: sandboxing агента теж використовує Docker, але для цього **не потрібно** запускати весь gateway у Docker. Див. [Sandboxing](/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 GB RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах із 1 GB з кодом виходу 137)
- Достатньо дискового простору для образів і логів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої доступності](/gateway/security),
  особливо політику firewall Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    Із кореня репозиторію запустіть скрипт налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збере образ gateway. Щоб використати вже готовий образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Готові образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад `2026.2.26`).

  </Step>

  <Step title="Завершіть onboarding">
    Скрипт налаштування автоматично запускає onboarding. Він:

    - запросить API key провайдерів
    - згенерує токен gateway і запише його в `.env`
    - запустить gateway через Docker Compose

    Під час налаштування onboarding перед запуском і записи в config виконуються через
    `openclaw-gateway` напряму. `openclaw-cli` призначений для команд, які ви запускаєте вже після того,
    як контейнер gateway існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері й вставте налаштований
    shared secret у Settings. Скрипт налаштування типово записує токен у `.env`; якщо ви переключите конфігурацію контейнера на auth за паролем, використовуйте цей
    пароль.

    Потрібен URL ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов’язково)">
    Використовуйте контейнер CLI, щоб додати канали обміну повідомленнями:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Документація: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

  </Step>
</Steps>

### Ручний процес

Якщо ви віддаєте перевагу виконанню кожного кроку вручну замість використання скрипта налаштування:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
Запускайте `docker compose` з кореня репозиторію. Якщо ви ввімкнули `OPENCLAW_EXTRA_MOUNTS`
або `OPENCLAW_HOME_VOLUME`, скрипт налаштування записує `docker-compose.extra.yml`;
підключайте його через `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` використовує той самий network namespace, що й `openclaw-gateway`, це
інструмент для використання після запуску. До `docker compose up -d openclaw-gateway` виконуйте onboarding
і записи config під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Змінна                        | Призначення                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Встановити додаткові apt-пакети під час збирання (через пробіл) |
| `OPENCLAW_EXTENSIONS`         | Попередньо встановити залежності extensions під час збирання (назви через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`       | Додаткові bind mounts хоста (через кому у форматі `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Зберігати `/home/node` в іменованому Docker volume              |
| `OPENCLAW_SANDBOX`            | Явно ввімкнути bootstrap sandbox (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`      | Перевизначити шлях до сокета Docker                             |

### Перевірки стану

Ендпоїнти probe контейнера (auth не потрібен):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveliness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Поглиблений snapshot стану з auth:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` типово встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ з хоста до
`http://127.0.0.1:18789` працював із публікацією портів Docker.

- `lan` (типово): браузер і CLI на хості можуть досягати опублікованого порту gateway.
- `loopback`: лише процеси всередині network namespace контейнера можуть
  напряму досягати gateway.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` чи `127.0.0.1`.
</Note>

### Сховище та збереження даних

Docker Compose монтує `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі config OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої auth OAuth/API-key провайдерів
- `.env` для runtime-secret на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Повні подробиці про збереження даних у розгортаннях на VM див. у
[Docker VM Runtime - Що і де зберігається](/install/docker-vm-runtime#what-persists-where).

**Точки зростання диска:** стежте за `media/`, JSONL-файлами сесій, `cron/runs/*.jsonl`
і ротаційними файловими логами в `/tmp/openclaw/`.

### Shell helpers (необов’язково)

Для зручнішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановлювали ClawDock зі старого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте команду встановлення вище, щоб ваш локальний helper-файл відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Повний посібник див. у [ClawDock](/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнення sandbox агента для Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Користувацький шлях до сокета (наприклад rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтує `docker.sock` лише після успішного проходження передумов sandbox. Якщо
    налаштування sandbox не можна завершити, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`.

  </Accordion>

  <Accordion title="Automation / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY у Compose через `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, щоб команди CLI
    могли досягати gateway через `127.0.0.1`. Ставтеся до цього як до спільної
    межі довіри. Конфігурація compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Права доступу та EACCES">
    Образ працює від імені `node` (uid 1000). Якщо ви бачите помилки прав доступу до
    `/home/node/.openclaw`, переконайтеся, що bind mounts хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Організуйте Dockerfile так, щоб шари залежностей кешувалися. Це дозволить уникнути повторного запуску
    `pnpm install`, якщо lockfile не змінювався:

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

  <Accordion title="Розширені параметри контейнера">
    Типовий image орієнтований на безпеку й працює від імені непривілейованого `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Установіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження browser**: задайте
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо в майстрі ви вибираєте OpenAI Codex OAuth, відкривається URL у браузері. У
    Docker або headless-середовищах скопіюйте повний redirect URL, на який ви потрапите, і вставте
    його назад у майстер, щоб завершити auth.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker image використовує `node:24-bookworm` і публікує анотації OCI базового image,
    включно з `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та іншими. Див.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запускаєте на VPS?

Див. [Hetzner (Docker VPS)](/install/hetzner) і
[Docker VM Runtime](/install/docker-vm-runtime) для спільних кроків розгортання на VM,
включно з вбудовуванням бінарних файлів, збереженням даних і оновленнями.

## Sandbox агента

Коли ввімкнено `agents.defaults.sandbox`, gateway виконує інструменти агента
(shell, читання/запис файлів тощо) в ізольованих Docker-контейнерах, тоді як
сам gateway залишається на хості. Це дає жорстку межу навколо недовірених або
багатоорендних сесій агента без контейнеризації всього gateway.

Область sandbox може бути для окремого агента (типово), окремої сесії або спільною. Кожна
область отримує власний workspace, змонтований у `/workspace`. Також можна налаштувати
політики allow/deny для інструментів, ізоляцію мережі, обмеження ресурсів і browser-контейнери.

Повну конфігурацію, образи, примітки з безпеки та профілі для кількох агентів див. тут:

- [Sandboxing](/gateway/sandboxing) -- повний довідник sandbox
- [OpenShell](/gateway/openshell) -- інтерактивний доступ shell до контейнерів sandbox
- [Sandbox і інструменти для кількох агентів](/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів

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

Зберіть типовий image sandbox:

```bash
scripts/sandbox-setup.sh
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає image або контейнер sandbox не запускається">
    Зберіть image sandbox за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або задайте `agents.defaults.sandbox.docker.image` на власний image.
    Контейнери автоматично створюються для кожної сесії за потреби.
  </Accordion>

  <Accordion title="Помилки прав доступу в sandbox">
    Задайте `docker.user` на UID:GID, який відповідає власнику змонтованого workspace,
    або змініть власника теки workspace через chown.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в sandbox">
    OpenClaw запускає команди через `sh -lc` (login shell), яка читає
    `/etc/profile` і може скидати PATH. Задайте `docker.env.PATH`, щоб додати
    власні шляхи до інструментів, або додайте скрипт у `/etc/profile.d/` у своєму Dockerfile.
  </Accordion>

  <Accordion title="Процес завершено через OOM під час збирання image (exit 137)">
    VM потребує щонайменше 2 GB RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібен pairing у Control UI">
    Отримайте свіже посилання на dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Ціль gateway показує ws://172.x.x.x або помилки pairing із Docker CLI">
    Скиньте режим і bind gateway:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/install) — усі способи встановлення
- [Podman](/install/podman) — альтернатива Docker на Podman
- [ClawDock](/install/clawdock) — community-налаштування на Docker Compose
- [Оновлення](/install/updating) — підтримка OpenClaw в актуальному стані
- [Конфігурація](/gateway/configuration) — конфігурація gateway після встановлення
