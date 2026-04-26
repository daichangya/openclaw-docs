---
read_when:
    - Ви хочете контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте процес Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-26T10:08:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00452deb5921b0ec42835dca0df0d93b7903d12942b1c6a795def451c24c8145
    source_path: install/docker.md
    workflow: 15
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або ви хочете перевірити процес Docker.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте на власній машині й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний процес встановлення.
- **Примітка щодо ізоляції**: типовий бекенд sandbox використовує Docker, коли ізоляцію ввімкнено, але за замовчуванням ізоляцію вимкнено, і для неї **не** потрібно, щоб увесь Gateway працював у Docker. Також доступні бекенди sandbox SSH і OpenShell. Див. [Ізоляція](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути аварійно завершено через OOM на хостах із 1 ГБ із кодом виходу 137)
- Достатньо дискового простору для образів і журналів
- Якщо запускаєте на VPS/публічному хості, перегляньте
  [Посилення безпеки для мережевого доступу](/uk/gateway/security),
  особливо політику брандмауера Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    У корені репозиторію запустіть скрипт налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збере образ Gateway. Щоб натомість використати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Завершіть онбординг">
    Скрипт налаштування запускає онбординг автоматично. Він:

    - запитає ключі API провайдерів
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування передстартовий онбординг і запис конфігурації виконуються
    безпосередньо через `openclaw-gateway`. `openclaw-cli` призначено для команд, які ви запускаєте після того,
    як контейнер Gateway уже існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері й вставте налаштований
    спільний секрет у Settings. Скрипт налаштування за замовчуванням записує токен у `.env`;
    якщо ви зміните конфігурацію контейнера на автентифікацію паролем, використовуйте
    натомість цей пароль.

    Потрібна адреса URL знову?

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

### Ручний процес

Якщо ви віддаєте перевагу запуску кожного кроку самостійно замість використання скрипта налаштування:

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
або `OPENCLAW_HOME_VOLUME`, скрипт налаштування записує `docker-compose.extra.yml`;
додайте його за допомогою `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` використовує спільний мережевий простір імен із `openclaw-gateway`, це
інструмент після запуску. До `docker compose up -d openclaw-gateway` виконуйте онбординг
і запис конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Скрипт налаштування приймає такі необов’язкові змінні середовища:

| Variable                        | Purpose                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                | Використати віддалений образ замість локального збирання        |
| `OPENCLAW_DOCKER_APT_PACKAGES`  | Встановити додаткові пакунки apt під час збирання (імена через пробіл) |
| `OPENCLAW_EXTENSIONS`           | Попередньо встановити залежності plugin під час збирання (імена через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`         | Додаткові bind-монтування хоста (через кому у форматі `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`          | Зберігати `/home/node` в іменованому Docker volume              |
| `OPENCLAW_SANDBOX`              | Увімкнути початкове налаштування sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`        | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`      | Вимкнути рекламу Bonjour/mDNS (для Docker за замовчуванням `1`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT`   | Спільна адреса collector OTLP/HTTP для експорту OpenTelemetry   |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT` | Адреси OTLP для окремих сигналів: трасувань, метрик або журналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`   | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`             | Назва сервісу, що використовується для ресурсів OpenTelemetry   |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`       | Не запускати другий SDK OpenTelemetry, якщо один уже попередньо завантажено |

### Спостережуваність

Експорт OpenTelemetry є вихідним трафіком із контейнера Gateway до вашого OTLP
collector. Для цього не потрібен опублікований порт Docker. Якщо ви локально збираєте образ
і хочете, щоб доступний у комплекті експортер OpenTelemetry був доступний всередині образу,
додайте його залежності виконання:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний релізний Docker-образ OpenClaw містить залежності `diagnostics-otel`.
Щоб увімкнути експорт, дозвольте й увімкніть plugin `diagnostics-otel`
у конфігурації, а потім встановіть `diagnostics.otel.enabled=true` або використайте приклад конфігурації з
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації collector налаштовуються через
`diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Увімкніть
plugin `diagnostics-prometheus`, а потім виконуйте scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищено автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або незахищений маршрут зворотного проксі. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки працездатності

Кінцеві точки probe контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який перевіряє `/healthz`.
Якщо перевірки постійно не проходять, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований детальний знімок стану працездатності:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN проти loopback

`scripts/docker/setup.sh` за замовчуванням встановлює `OPENCLAW_GATEWAY_BIND=lan`, щоб доступ хоста до
`http://127.0.0.1:18789` працював із публікацією порту Docker.

- `lan` (типово): браузер хоста та CLI хоста можуть досягти опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть
  напряму досягти Gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Bonjour / mDNS

Мережа Docker bridge зазвичай ненадійно пересилає мультикаст Bonjour/mDNS
(`224.0.0.251:5353`). Тому комплектна конфігурація Compose за замовчуванням встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не потрапляв у цикл аварійних перезапусків і не
перезапускав рекламу повторно, коли bridge відкидає мультикаст-трафік.

Для хостів Docker використовуйте опубліковану адресу Gateway, Tailscale або wide-area DNS-SD.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де мультикаст mDNS гарантовано працює.

Щодо типових проблем і способів їх усунення див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище й постійність даних

Docker Compose монтує `OPENCLAW_CONFIG_DIR` до `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` до `/home/node/.openclaw/workspace`, тому ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для секретів середовища виконання на основі env, таких як `OPENCLAW_GATEWAY_TOKEN`

Повні відомості про постійність даних у розгортаннях на VM див. у
[Середовище виконання Docker VM - Що і де зберігається](/uk/install/docker-vm-runtime#what-persists-where).

**Джерела зростання використання диска:** стежте за `media/`, JSONL-файлами сесій, `cron/runs/*.jsonl`,
і ротаційними файловими журналами в `/tmp/openclaw/`.

### Допоміжні команди оболонки (необов’язково)

Для зручнішого щоденного керування Docker установіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старішого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте наведену вище команду встановлення, щоб ваш локальний файл helper відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Виконайте
`clawdock-help`, щоб побачити всі команди.
Повний посібник із helper-команд див. у [ClawDock](/uk/install/clawdock).

<AccordionGroup>
  <Accordion title="Увімкнення agent sandbox для Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Нестандартний шлях до сокета (наприклад, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Скрипт монтує `docker.sock` лише після успішної перевірки передумов sandbox. Якщо
    налаштування sandbox не вдається завершити, скрипт скидає `agents.defaults.sandbox.mode`
    до `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (неінтерактивно)">
    Вимкніть виділення псевдо-TTY у Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, тож CLI
    команди можуть досягати Gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose прибирає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів на
    `/home/node/.openclaw`, переконайтеся, що bind-монтування хоста належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші перебудови">
    Упорядкуйте свій Dockerfile так, щоб шари залежностей кешувалися. Це дозволяє уникнути повторного запуску
    `pnpm install`, якщо lockfile не змінювалися:

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
    Типовий образ орієнтований насамперед на безпеку й запускається як непривілейований користувач `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Додавайте системні залежності в образ**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
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
    Якщо у майстрі ви виберете OpenAI Codex OAuth, він відкриє URL-адресу в браузері. У
    Docker або headless-оточеннях скопіюйте повну URL-адресу перенаправлення, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker-образ використовує `node:24-bookworm` і публікує анотації базового образу OCI,
    зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Див.
    [Анотації образів OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime) для кроків розгортання на спільній VM,
зокрема підготовки бінарних файлів в образі, постійного зберігання та оновлень.

## Agent Sandbox

Коли `agents.defaults.sandbox` увімкнено з Docker-бекендом, gateway
виконує запуск інструментів agent (оболонка, читання/запис файлів тощо) в ізольованих Docker
контейнерах, тоді як сам gateway залишається на хості. Це дає вам жорстку межу
навколо недовірених або багатокористувацьких agent-сесій без контейнеризації всього
gateway.

Область sandbox може бути для кожного agent окремо (типово), для кожної сесії або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Також можна налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і
контейнери браузера.

Повну інформацію про конфігурацію, образи, примітки з безпеки й профілі для кількох agent див. тут:

- [Sandboxing](/uk/gateway/sandboxing) -- повна довідка з sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний доступ до оболонки контейнерів sandbox
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих agent

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
    або встановіть `agents.defaults.sandbox.docker.image` на ваш власний образ.
    Контейнери автоматично створюються для кожної сесії за потреби.
  </Accordion>

  <Accordion title="Помилки дозволів у sandbox">
    Установіть `docker.user` у значення UID:GID, яке відповідає правам власності змонтованого workspace,
    або змініть власника папки workspace.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в sandbox">
    OpenClaw запускає команди через `sh -lc` (login shell), який завантажує
    `/etc/profile` і може скидати PATH. Установіть `docker.env.PATH`, щоб додати
    ваші власні шляхи до інструментів, або додайте скрипт у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Процес збирання образу завершено через OOM (код виходу 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне сполучення в Control UI">
    Отримайте нове посилання dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Devices](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль gateway показує ws://172.x.x.x або помилки сполучення з Docker CLI">
    Скиньте режим gateway і bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі методи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker на базі Podman
- [ClawDock](/uk/install/clawdock) — налаштування спільноти на Docker Compose
- [Оновлення](/uk/install/updating) — підтримка OpenClaw в актуальному стані
- [Конфігурація](/uk/gateway/configuration) — конфігурація gateway після встановлення
