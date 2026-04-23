---
read_when:
    - Розгортання OpenClaw на Fly.io
    - Налаштування томів Fly, секретів і конфігурації першого запуску
summary: Покрокове розгортання OpenClaw на Fly.io зі стійким сховищем і HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-23T23:00:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864494baa6bb162b7f34fe7ea3f5a4a0a04e1ef5349fcbd40b8d67e4192e82f8
    source_path: install/fly.md
    workflow: 15
---

# Розгортання Fly.io

**Мета:** OpenClaw Gateway, запущений на [Fly.io](https://fly.io), зі стійким сховищем, автоматичним HTTPS і доступом до Discord/каналів.

## Що вам потрібно

- Установлений [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Обліковий запис Fly.io (безкоштовний рівень підходить)
- Автентифікація моделі: API key для вибраного провайдера моделі
- Облікові дані каналів: токен бота Discord, токен Telegram тощо

## Швидкий шлях для початківців

1. Клонуйте репозиторій → налаштуйте `fly.toml`
2. Створіть app + volume → задайте secrets
3. Розгорніть через `fly deploy`
4. Увійдіть через SSH, щоб створити config, або використайте Control UI

<Steps>
  <Step title="Створіть app Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Порада:** Виберіть регіон ближче до себе. Поширені варіанти: `lhr` (Лондон), `iad` (Вірджинія), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Налаштуйте fly.toml">
    Відредагуйте `fly.toml` відповідно до назви вашого app і вимог.

    **Примітка щодо безпеки:** Типова конфігурація відкриває публічний URL. Для посиленого розгортання без публічної IP-адреси див. [Приватне розгортання](#private-deployment-hardened) або використайте `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Ключові параметри:**

    | Параметр                     | Навіщо                                                                    |
    | ---------------------------- | ------------------------------------------------------------------------- |
    | `--bind lan`                 | Прив’язує до `0.0.0.0`, щоб proxy Fly міг досягти gateway                 |
    | `--allow-unconfigured`       | Запускає без config-файлу (ви створите його пізніше)                      |
    | `internal_port = 3000`       | Має збігатися з `--port 3000` (або `OPENCLAW_GATEWAY_PORT`) для health checks Fly |
    | `memory = "2048mb"`          | 512MB замало; рекомендовано 2GB                                           |
    | `OPENCLAW_STATE_DIR = "/data"` | Зберігає стан на volume                                                  |

  </Step>

  <Step title="Задайте secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Примітки:**

    - Прив’язки не до loopback (`--bind lan`) потребують коректного шляху автентифікації gateway. У цьому прикладі Fly.io використовується `OPENCLAW_GATEWAY_TOKEN`, але `gateway.auth.password` або правильно налаштоване розгортання non-loopback `trusted-proxy` також задовольняють цю вимогу.
    - Ставтеся до цих токенів як до паролів.
    - **Надавайте перевагу env vars замість config-файлу** для всіх API keys і токенів. Це не дає secrets потрапити в `openclaw.json`, де їх можна випадково розкрити або залогувати.

  </Step>

  <Step title="Розгорніть">
    ```bash
    fly deploy
    ```

    Перше розгортання збирає Docker image (~2–3 хвилини). Наступні розгортання швидші.

    Після розгортання перевірте:

    ```bash
    fly status
    fly logs
    ```

    Ви маєте побачити:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Створіть config-файл">
    Підключіться до машини через SSH, щоб створити коректний config:

    ```bash
    fly ssh console
    ```

    Створіть каталог config і файл:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Примітка:** Якщо задано `OPENCLAW_STATE_DIR=/data`, шлях до config — `/data/openclaw.json`.

    **Примітка:** Токен Discord може надходити з одного з двох джерел:

    - Змінна середовища: `DISCORD_BOT_TOKEN` (рекомендовано для secrets)
    - Config-файл: `channels.discord.token`

    Якщо використовується env var, додавати токен у config не потрібно. Gateway автоматично читає `DISCORD_BOT_TOKEN`.

    Перезапустіть, щоб застосувати зміни:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Отримайте доступ до Gateway">
    ### Control UI

    Відкрийте в браузері:

    ```bash
    fly open
    ```

    Або перейдіть на `https://my-openclaw.fly.dev/`

    Автентифікуйтеся за допомогою налаштованого спільного секрету. У цьому посібнику використовується токен gateway
    з `OPENCLAW_GATEWAY_TOKEN`; якщо ви перейшли на автентифікацію через пароль, використайте
    замість нього цей пароль.

    ### Журнали

    ```bash
    fly logs              # Журнали в реальному часі
    fly logs --no-tail    # Останні журнали
    ```

    ### SSH Console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Усунення проблем

### "App is not listening on expected address"

Gateway прив’язується до `127.0.0.1` замість `0.0.0.0`.

**Виправлення:** Додайте `--bind lan` до команди process у `fly.toml`.

### Health checks failing / connection refused

Fly не може досягти gateway на налаштованому порту.

**Виправлення:** Переконайтеся, що `internal_port` збігається з портом gateway (задайте `--port 3000` або `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблеми з пам’яттю

Контейнер постійно перезапускається або завершується. Ознаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` або тихі перезапуски.

**Виправлення:** Збільште пам’ять у `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Або оновіть наявну машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Примітка:** 512MB замало. 1GB може працювати, але може призводити до OOM під навантаженням або з докладним логуванням. **Рекомендовано 2GB.**

### Проблеми з блокуванням Gateway

Gateway відмовляється запускатися з помилками "already running".

Це трапляється, коли контейнер перезапускається, але PID lock-файл залишається на volume.

**Виправлення:** Видаліть lock-файл:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Lock-файл розташований у `/data/gateway.*.lock` (не в підкаталозі).

### Config не зчитується

`--allow-unconfigured` лише обходить стартову перевірку. Він не створює і не виправляє `/data/openclaw.json`, тому переконайтеся, що ваш реальний config існує і містить `gateway.mode="local"`, якщо вам потрібен звичайний локальний запуск gateway.

Перевірте, що config існує:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запис config через SSH

Команда `fly ssh console -C` не підтримує перенаправлення shell. Щоб записати config-файл:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Примітка:** `fly sftp` може завершитися помилкою, якщо файл уже існує. Спочатку видаліть його:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Стан не зберігається

Якщо після перезапуску зникають auth profiles, стан каналу/провайдера або сесії,
каталог стану записується у файлову систему контейнера.

**Виправлення:** Переконайтеся, що в `fly.toml` задано `OPENCLAW_STATE_DIR=/data`, і виконайте повторне розгортання.

## Оновлення

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Оновлення команди машини

Якщо потрібно змінити команду запуску без повного повторного розгортання:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Примітка:** Після `fly deploy` команда машини може скинутися до значення з `fly.toml`. Якщо ви вносили зміни вручну, застосуйте їх повторно після розгортання.

## Приватне розгортання (посилений захист)

Типово Fly виділяє публічні IP-адреси, через що ваш gateway стає доступним за адресою `https://your-app.fly.dev`. Це зручно, але означає, що ваше розгортання можна виявити інтернет-сканерами (Shodan, Censys тощо).

Для посиленого розгортання **без публічної доступності** використовуйте приватний шаблон.

### Коли варто використовувати приватне розгортання

- Ви виконуєте лише **вихідні** виклики/повідомлення (без вхідних webhook)
- Ви використовуєте тунелі **ngrok або Tailscale** для будь-яких callback webhook
- Ви отримуєте доступ до gateway через **SSH, proxy або WireGuard**, а не через браузер
- Ви хочете, щоб розгортання було **приховане від інтернет-сканерів**

### Налаштування

Використовуйте `fly.private.toml` замість стандартного config:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

Або перетворіть наявне розгортання:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Після цього `fly ips list` має показувати лише IP типу `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Доступ до приватного розгортання

Оскільки публічного URL немає, використайте один із таких способів:

**Варіант 1: Локальний proxy (найпростіше)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Варіант 2: VPN WireGuard**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Варіант 3: Лише SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook у приватному розгортанні

Якщо вам потрібні callback webhook (Twilio, Telnyx тощо) без публічної доступності:

1. **Тунель ngrok** - запустіть ngrok усередині контейнера або як sidecar
2. **Tailscale Funnel** - відкрийте конкретні шляхи через Tailscale
3. **Лише вихідні дії** - деякі провайдери (Twilio) нормально працюють для вихідних викликів без webhook

Приклад config голосових викликів з ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Тунель ngrok запускається всередині контейнера й надає публічний URL webhook, не відкриваючи сам app Fly. Установіть `webhookSecurity.allowedHosts` на публічне ім’я хоста тунелю, щоб переслані заголовки host приймалися.

### Переваги безпеки

| Аспект             | Публічне      | Приватне   |
| ------------------ | ------------- | ---------- |
| Інтернет-сканери   | Виявляється   | Приховане  |
| Прямі атаки        | Можливі       | Заблоковані |
| Доступ до Control UI | Браузер     | Proxy/VPN  |
| Доставка webhook   | Напряму       | Через тунель |

## Примітки

- Fly.io використовує **архітектуру x86** (не ARM)
- Dockerfile сумісний з обома архітектурами
- Для онбордингу WhatsApp/Telegram використовуйте `fly ssh console`
- Стійкі дані зберігаються на volume у `/data`
- Signal потребує Java + `signal-cli`; використовуйте власний image і тримайте пам’ять на рівні 2GB+.

## Вартість

За рекомендованої конфігурації (`shared-cpu-2x`, 2GB RAM):

- приблизно $10-15/місяць залежно від використання
- безкоштовний рівень включає певний ліміт

Докладніше див. у [тарифах Fly.io](https://fly.io/docs/about/pricing/).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)
