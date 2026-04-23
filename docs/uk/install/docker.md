---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте процес роботи з Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-23T23:00:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker **необов’язковий**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або ви хочете перевірити процес роботи з Docker.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних встановлень.
- **Ні**: ви працюєте на власному комп’ютері й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний процес встановлення.
- **Примітка про sandboxing**: типовий backend sandbox використовує Docker, коли sandboxing увімкнено, але sandboxing типово вимкнений і **не** вимагає, щоб увесь Gateway працював у Docker. Також доступні backend-и sandbox SSH і OpenShell. Див. [Sandboxing](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути примусово завершено через OOM на хостах із 1 ГБ з кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо ви запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевої експозиції](/uk/gateway/security),
  особливо політику firewall Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    Із кореня репозиторію запустіть сценарій налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збирає образ gateway. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Завершіть онбординг">
    Сценарій налаштування автоматично запускає онбординг. Він:

    - запропонує ввести API-ключі провайдерів
    - згенерує токен gateway і запише його в `.env`
    - запустить gateway через Docker Compose

    Під час налаштування онбординг перед запуском і записи конфігурації виконуються через
    `openclaw-gateway` напряму. `openclaw-cli` призначено для команд, які ви запускаєте вже після
    того, як контейнер gateway існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері й вставте налаштований
    спільний секрет у Settings. Сценарій налаштування типово записує токен у `.env`; якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, використовуйте натомість цей
    пароль.

    Потрібен URL ще раз?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Налаштуйте канали (необов’язково)">
    Використовуйте контейнер CLI, щоб додати канали повідомлень:

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

### Ручний процес

Якщо ви віддаєте перевагу виконанню кожного кроку самостійно замість використання сценарію налаштування:

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
Оскільки `openclaw-cli` спільно використовує мережевий простір імен `openclaw-gateway`, це
інструмент після запуску. До `docker compose up -d openclaw-gateway` запускайте онбординг
і записи конфігурації на етапі налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Сценарій налаштування приймає такі необов’язкові змінні середовища:

| Змінна                        | Призначення                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Використати віддалений образ замість локального збирання       |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Установити додаткові apt-пакети під час збирання (назви через пробіл) |
| `OPENCLAW_EXTENSIONS`         | Попередньо встановити залежності Plugin-ів під час збирання (назви через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`       | Додаткові bind mount-и хоста (через кому у форматі `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Зберігати `/home/node` в іменованому Docker volume             |
| `OPENCLAW_SANDBOX`            | Добровільно ввімкнути bootstrap sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`      | Перевизначити шлях до сокета Docker                            |

### Перевірки стану

Endpoint-и probe контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image містить вбудований `HEALTHCHECK`, який опитує `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований глибокий знімок стану:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` типово встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював із публікацією портів Docker.

- `lan` (типово): браузер хоста і CLI хоста можуть досягати опублікованого порту gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть
  безпосередньо досягати gateway.

<Note>
Використовуйте значення режиму bind у `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` чи `127.0.0.1`.
</Note>

### Сховище і збереження даних

Docker Compose монтує `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw`, а
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для секретів runtime із середовища, таких як `OPENCLAW_GATEWAY_TOKEN`

Повні подробиці про збереження даних у розгортаннях на VM див.
в [Docker VM Runtime - What persists where](/uk/install/docker-vm-runtime#what-persists-where).

**Гарячі точки зростання диска:** стежте за `media/`, файлами JSONL сесій, `cron/runs/*.jsonl`,
і циклічними файловими журналами в `/tmp/openclaw/`.

### Допоміжні shell-скрипти (необов’язково)

Для простішого повсякденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старого сирого шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте команду встановлення вище, щоб ваш локальний файл helper відстежував нове розташування.

Після цього використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Запустіть
`clawdock-help`, щоб побачити всі команди.
Повний посібник із helper див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнення sandbox агента для Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Користувацький шлях до сокета (наприклад, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Сценарій монтує `docker.sock` лише після того, як пройдено передумови sandbox. Якщо
    налаштування sandbox не може завершитися, сценарій скидає `agents.defaults.sandbox.mode`
    до `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY у Compose через `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка про безпеку спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, тому CLI-команди
    можуть досягати gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose скидає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи і EACCES">
    Образ працює як `node` (uid 1000). Якщо ви бачите помилки доступу до
    `/home/node/.openclaw`, переконайтеся, що ваші bind mount-и хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте свій Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу уникнути повторного запуску
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
    Типовий образ орієнтований на безпеку й працює як непривілейований `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Установіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузерів**: задайте
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо ви вибираєте OpenAI Codex OAuth у майстрі, він відкриває URL у браузері. У
    Docker або headless-конфігураціях скопіюйте повний redirect URL, на який ви потрапите, і вставте
    його назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker image використовує `node:24-bookworm` і публікує анотації OCI базового образу,
    включно з `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та іншими. Див.
    [Анотації OCI image](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) для кроків розгортання на спільних VM,
включно з вбудовуванням бінарних файлів, збереженням даних і оновленнями.

## Agent Sandbox

Коли `agents.defaults.sandbox` увімкнено з backend Docker, gateway
виконує інструменти агента (shell, читання/запис файлів тощо) всередині ізольованих Docker
контейнерів, тоді як сам gateway залишається на хості. Це створює жорстку межу
навколо недовірених або багатокористувацьких сесій агента без контейнеризації всього
gateway.

Обсяг sandbox може бути на рівні агента (типово), сесії або спільний. Кожен scope
отримує власний робочий простір, змонтований у `/workspace`. Ви також можете налаштувати
політики allow/deny для інструментів, ізоляцію мережі, обмеження ресурсів і браузерні
контейнери.

Повну інформацію про конфігурацію, образи, примітки з безпеки та профілі кількох агентів див. у:

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ shell до контейнерів sandbox
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

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або контейнер sandbox не запускається">
    Зберіть образ sandbox за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або задайте `agents.defaults.sandbox.docker.image` на ваш користувацький образ.
    Контейнери автоматично створюються для кожної сесії за потреби.
  </Accordion>

  <Accordion title="Помилки доступу в sandbox">
    Установіть `docker.user` у UID:GID, що відповідає власнику змонтованого робочого простору,
    або змініть власника папки робочого простору через `chown`.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в sandbox">
    OpenClaw запускає команди через `sh -lc` (login shell), що зчитує
    `/etc/profile` і може скидати PATH. Задайте `docker.env.PATH`, щоб додати
    ваші користувацькі шляхи до інструментів на початок, або додайте сценарій у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="OOM під час збирання образу (вихід 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне сполучення в Control UI">
    Отримайте нове посилання dashboard і підтвердьте браузерний пристрій:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Пристрої](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки сполучення з Docker CLI">
    Скиньте режим і bind gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на базі Podman
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Оновлення](/uk/install/updating) — як підтримувати OpenClaw актуальним
- [Конфігурація](/uk/gateway/configuration) — конфігурація gateway після встановлення
