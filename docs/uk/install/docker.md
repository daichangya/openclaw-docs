---
read_when:
    - Вам потрібен контейнеризований Gateway замість локальних встановлень
    - Ви перевіряєте потік Docker
summary: Необов’язкове налаштування та онбординг OpenClaw на основі Docker
title: Docker
x-i18n:
    generated_at: "2026-04-26T10:35:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eeace5ec8c16024d8e1503ce0188da58040115a14ce821e91e74087f96ac29b
    source_path: install/docker.md
    workflow: 15
---

Docker є **необов’язковим**. Використовуйте його лише якщо вам потрібен контейнеризований Gateway або ви хочете перевірити потік Docker.

## Чи підходить мені Docker?

- **Так**: вам потрібне ізольоване, тимчасове середовище Gateway або ви хочете запускати OpenClaw на хості без локальних встановлень.
- **Ні**: ви запускаєте на власній машині й просто хочете найшвидший цикл розробки. Натомість використовуйте звичайний потік встановлення.
- **Примітка щодо sandboxing**: типовий backend sandbox використовує Docker, коли sandboxing увімкнено, але sandboxing типово вимкнений і **не** вимагає запуску всього Gateway у Docker. Також доступні backends sandbox SSH і OpenShell. Див. [Sandboxing](/uk/gateway/sandboxing).

## Передумови

- Docker Desktop (або Docker Engine) + Docker Compose v2
- Щонайменше 2 ГБ RAM для збирання образу (`pnpm install` може бути завершено через OOM на хостах із 1 ГБ з кодом виходу 137)
- Достатньо місця на диску для образів і журналів
- Якщо запускаєте на VPS/публічному хості, ознайомтеся з
  [Посиленням безпеки для мережевого доступу](/uk/gateway/security),
  особливо з політикою брандмауера Docker `DOCKER-USER`.

## Контейнеризований Gateway

<Steps>
  <Step title="Зберіть образ">
    У корені репозиторію запустіть сценарій налаштування:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Це локально збере образ Gateway. Щоб замість цього використовувати попередньо зібраний образ:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Попередньо зібрані образи публікуються в
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Поширені теги: `main`, `latest`, `<version>` (наприклад, `2026.2.26`).

  </Step>

  <Step title="Завершіть онбординг">
    Сценарій налаштування автоматично виконує онбординг. Він:

    - запросить API-ключі провайдера
    - згенерує токен Gateway і запише його в `.env`
    - запустить Gateway через Docker Compose

    Під час налаштування онбординг до запуску та запис конфігурації під час налаштування виконуються безпосередньо через
    `openclaw-gateway`. `openclaw-cli` призначений для команд, які ви запускаєте вже після того, як контейнер Gateway існує.

  </Step>

  <Step title="Відкрийте Control UI">
    Відкрийте `http://127.0.0.1:18789/` у браузері та вставте налаштований
    спільний секрет у Settings. Сценарій налаштування типово записує токен у `.env`; якщо ви перемкнете конфігурацію контейнера на автентифікацію паролем, натомість використовуйте цей пароль.

    Потрібна URL-адреса ще раз?

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

    Документація: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord)

  </Step>
</Steps>

### Ручний потік

Якщо ви віддаєте перевагу виконанню кожного кроку вручну замість використання сценарію налаштування:

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
додайте його за допомогою `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Оскільки `openclaw-cli` використовує той самий мережевий простір імен, що й `openclaw-gateway`, це
інструмент для використання після запуску. До `docker compose up -d openclaw-gateway` запускайте онбординг
і записи конфігурації під час налаштування через `openclaw-gateway` з
`--no-deps --entrypoint node`.
</Note>

### Змінні середовища

Сценарій налаштування приймає такі необов’язкові змінні середовища:

| Variable                                   | Purpose                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Використовувати віддалений образ замість локального збирання    |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Встановити додаткові apt-пакунки під час збирання (назви через пробіл) |
| `OPENCLAW_EXTENSIONS`                      | Попередньо встановити залежності plugin під час збирання (назви через пробіл) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Додаткові bind mounts хоста (список `source:target[:opts]` через кому) |
| `OPENCLAW_HOME_VOLUME`                     | Зберігати `/home/node` в іменованому томі Docker                |
| `OPENCLAW_SANDBOX`                         | Увімкнути bootstrap sandbox (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_DOCKER_SOCKET`                   | Перевизначити шлях до сокета Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Вимкнути рекламу Bonjour/mDNS (типово `1` для Docker)           |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Вимкнути bind-mount overlays для вбудованих джерел plugin       |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Спільна кінцева точка збирача OTLP/HTTP для експорту OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Кінцеві точки OTLP для traces, metrics або logs для конкретних сигналів |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Перевизначення протоколу OTLP. Наразі підтримується лише `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Назва служби, що використовується для ресурсів OpenTelemetry    |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Увімкнути найновіші експериментальні семантичні атрибути GenAI  |
| `OPENCLAW_OTEL_PRELOADED`                  | Не запускати другий SDK OpenTelemetry, якщо один уже попередньо завантажено |

Супроводжувачі можуть тестувати вихідний код вбудованого plugin на основі пакованого образу, змонтувавши
один каталог з вихідним кодом plugin поверх шляху до його пакованого вихідного коду, наприклад
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Цей змонтований каталог із вихідним кодом перевизначає відповідний скомпільований
bundle `/app/dist/extensions/synology-chat` для того самого id plugin.

### Спостережуваність

Експорт OpenTelemetry є вихідним з контейнера Gateway до вашого збирача OTLP.
Для цього не потрібен опублікований порт Docker. Якщо ви локально збираєте образ і хочете, щоб
вбудований експортер OpenTelemetry був доступний всередині образу,
додайте його runtime-залежності:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Офіційний Docker-образ релізу OpenClaw містить залежності `diagnostics-otel`.
Щоб увімкнути експорт, дозвольте та ввімкніть plugin `diagnostics-otel`
у конфігурації, а потім встановіть `diagnostics.otel.enabled=true` або скористайтеся прикладом конфігурації з
[Експорт OpenTelemetry](/uk/gateway/opentelemetry). Заголовки автентифікації збирача налаштовуються через `diagnostics.otel.headers`, а не через змінні середовища Docker.

Метрики Prometheus використовують уже опублікований порт Gateway. Увімкніть
plugin `diagnostics-prometheus`, а потім виконуйте збір із:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Маршрут захищений автентифікацією Gateway. Не відкривайте окремий
публічний порт `/metrics` або неавтентифікований шлях reverse proxy. Див.
[Метрики Prometheus](/uk/gateway/prometheus).

### Перевірки працездатності

Кінцеві точки probe контейнера (автентифікація не потрібна):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker-образ містить вбудований `HEALTHCHECK`, який перевіряє `/healthz`.
Якщо перевірки продовжують завершуватися невдачею, Docker позначає контейнер як `unhealthy`, і
системи оркестрації можуть перезапустити або замінити його.

Автентифікований поглиблений знімок стану здоров’я:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` типово використовує `OPENCLAW_GATEWAY_BIND=lan`, тому доступ хоста до
`http://127.0.0.1:18789` працює з публікацією порту Docker.

- `lan` (типово): браузер хоста та CLI хоста можуть досягти опублікованого порту Gateway.
- `loopback`: лише процеси всередині мережевого простору імен контейнера можуть
  напряму досягти Gateway.

<Note>
Використовуйте значення режиму прив’язки в `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), а не псевдоніми хоста на кшталт `0.0.0.0` або `127.0.0.1`.
</Note>

### Bonjour / mDNS

Мережа Docker bridge зазвичай ненадійно пересилає мультикаст Bonjour/mDNS
(`224.0.0.251:5353`). Тому комплектна конфігурація Compose типово встановлює
`OPENCLAW_DISABLE_BONJOUR=1`, щоб Gateway не переходив у crash-loop і не
перезапускав рекламу повторно, коли bridge втрачає мультикаст-трафік.

Для хостів Docker використовуйте опубліковану URL-адресу Gateway, Tailscale або DNS-SD широкої зони.
Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише під час запуску з host networking, macvlan
або іншою мережею, де мультикаст mDNS гарантовано працює.

Про підводні камені та усунення несправностей див. [Виявлення Bonjour](/uk/gateway/bonjour).

### Сховище та збереження даних

Docker Compose монтує `OPENCLAW_CONFIG_DIR` у `/home/node/.openclaw` і
`OPENCLAW_WORKSPACE_DIR` у `/home/node/.openclaw/workspace`, тож ці шляхи
зберігаються після заміни контейнера.

У цьому змонтованому каталозі конфігурації OpenClaw зберігає:

- `openclaw.json` для конфігурації поведінки
- `agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдера
- `.env` для секретів runtime із середовища, таких як `OPENCLAW_GATEWAY_TOKEN`

Повні відомості про збереження даних у розгортаннях VM див. у
[Docker VM Runtime - What persists where](/uk/install/docker-vm-runtime#what-persists-where).

**Ключові точки зростання диска:** стежте за `media/`, файлами JSONL сесій, `cron/runs/*.jsonl`,
і ротаційними файлами журналів у `/tmp/openclaw/`.

### Допоміжні shell-команди (необов’язково)

Для простішого щоденного керування Docker встановіть `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви встановили ClawDock зі старого raw-шляху `scripts/shell-helpers/clawdock-helpers.sh`, повторно виконайте команду встановлення вище, щоб ваш локальний файл helper відстежував нове розташування.

Потім використовуйте `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` тощо. Запустіть
`clawdock-help`, щоб переглянути всі команди.
Див. [ClawDock](/uk/install/clawdock), щоб ознайомитися з повним посібником щодо helper.

<AccordionGroup>
  <Accordion title="Увімкнення sandbox агента для Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Власний шлях до сокета (наприклад, rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Сценарій монтує `docker.sock` лише після успішного проходження передумов sandbox. Якщо
    налаштування sandbox не вдається завершити, сценарій скидає `agents.defaults.sandbox.mode`
    до `off`.

  </Accordion>

  <Accordion title="Автоматизація / CI (без взаємодії)">
    Вимкніть виділення псевдо-TTY Compose за допомогою `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Примітка щодо безпеки спільної мережі">
    `openclaw-cli` використовує `network_mode: "service:openclaw-gateway"`, тому CLI
    команди можуть досягати Gateway через `127.0.0.1`. Розглядайте це як спільну
    межу довіри. Конфігурація compose скидає `NET_RAW`/`NET_ADMIN` і вмикає
    `no-new-privileges` для `openclaw-cli`.
  </Accordion>

  <Accordion title="Дозволи та EACCES">
    Образ запускається як `node` (uid 1000). Якщо ви бачите помилки дозволів для
    `/home/node/.openclaw`, переконайтеся, що bind mounts на вашому хості належать uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Швидші повторні збирання">
    Упорядкуйте Dockerfile так, щоб шари залежностей кешувалися. Це дає змогу уникнути повторного запуску
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

  <Accordion title="Параметри контейнера для досвідчених користувачів">
    Типовий образ орієнтований насамперед на безпеку і запускається від непривілейованого користувача `node`. Для більш
    функціонального контейнера:

    1. **Зберігайте `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Вбудуйте системні залежності**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Встановіть браузери Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Зберігайте завантаження браузерів**: встановіть
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` і використовуйте
       `OPENCLAW_HOME_VOLUME` або `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Якщо у майстрі ви виберете OpenAI Codex OAuth, він відкриє URL-адресу в браузері. У
    Docker або headless-середовищах скопіюйте повну URL-адресу перенаправлення, на яку ви потрапите, і вставте
    її назад у майстер, щоб завершити автентифікацію.
  </Accordion>

  <Accordion title="Метадані базового образу">
    Основний Docker-образ використовує `node:24-bookworm` і публікує анотації базового OCI-образу,
    зокрема `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` та інші. Див.
    [Анотації OCI-образів](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Запуск на VPS?

Див. [Hetzner (Docker VPS)](/uk/install/hetzner) і
[Docker VM Runtime](/uk/install/docker-vm-runtime), щоб ознайомитися з кроками розгортання у спільній VM,
зокрема з вбудовуванням бінарних файлів, збереженням даних і оновленнями.

## Sandbox агента

Коли `agents.defaults.sandbox` увімкнено з backend Docker, gateway
запускає виконання інструментів агента (shell, читання/запис файлів тощо) в ізольованих Docker-контейнерах,
тоді як сам gateway залишається на хості. Це дає вам жорстку межу ізоляції
навколо ненадійних або багатокористувацьких сесій агента без контейнеризації всього
gateway.

Область дії sandbox може бути для кожного агента окремо (типово), для кожної сесії або спільною. Кожна область
отримує власний workspace, змонтований у `/workspace`. Ви також можете налаштувати
політики дозволу/заборони інструментів, ізоляцію мережі, обмеження ресурсів і
контейнери браузера.

Повну інформацію про конфігурацію, образи, примітки з безпеки та профілі для кількох агентів див. тут:

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із sandbox
- [OpenShell](/uk/gateway/openshell) -- інтерактивний shell-доступ до sandbox-контейнерів
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

Зберіть типовий sandbox-образ:

```bash
scripts/sandbox-setup.sh
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Образ відсутній або sandbox-контейнер не запускається">
    Зберіть sandbox-образ за допомогою
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    або встановіть `agents.defaults.sandbox.docker.image` на свій власний образ.
    Контейнери автоматично створюються для кожної сесії на вимогу.
  </Accordion>

  <Accordion title="Помилки дозволів у sandbox">
    Встановіть `docker.user` у UID:GID, що відповідає власнику вашого змонтованого workspace,
    або змініть власника каталогу workspace.
  </Accordion>

  <Accordion title="Користувацькі інструменти не знайдено в sandbox">
    OpenClaw запускає команди через `sh -lc` (login shell), який завантажує
    `/etc/profile` і може скинути PATH. Встановіть `docker.env.PATH`, щоб додати попереду свої
    шляхи до користувацьких інструментів, або додайте сценарій у `/etc/profile.d/` у вашому Dockerfile.
  </Accordion>

  <Accordion title="Процес завершено через OOM під час збирання образу (exit 137)">
    VM потребує щонайменше 2 ГБ RAM. Використайте більший клас машини й повторіть спробу.
  </Accordion>

  <Accordion title="Unauthorized або потрібне pairing у Control UI">
    Отримайте нове посилання на dashboard і схваліть пристрій браузера:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Докладніше: [Dashboard](/uk/web/dashboard), [Devices](/uk/cli/devices).

  </Accordion>

  <Accordion title="Ціль Gateway показує ws://172.x.x.x або помилки pairing з Docker CLI">
    Скиньте режим gateway і bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install) — усі методи встановлення
- [Podman](/uk/install/podman) — альтернатива Docker у вигляді Podman
- [ClawDock](/uk/install/clawdock) — спільнотне налаштування Docker Compose
- [Updating](/uk/install/updating) — як підтримувати OpenClaw в актуальному стані
- [Configuration](/uk/gateway/configuration) — конфігурація gateway після встановлення
