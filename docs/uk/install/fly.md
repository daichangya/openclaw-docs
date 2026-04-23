---
read_when:
    - Розгортання OpenClaw на Fly.io
    - Налаштування томів Fly, секретів і конфігурації першого запуску
summary: Покрокове розгортання OpenClaw на Fly.io зі стійким сховищем і HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-23T19:25:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 565bae44242217f7a2fa118fbdb1c2f4b989fed1d1fa011129a0983f1f5997f6
    source_path: install/fly.md
    workflow: 15
---

# Розгортання на Fly.io

**Мета:** Gateway OpenClaw, запущений на машині [Fly.io](https://fly.io) зі стійким сховищем, автоматичним HTTPS і доступом до Discord/каналів.

## Що вам знадобиться

- Встановлений [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Обліковий запис Fly.io (безкоштовний рівень підходить)
- Автентифікація моделі: API-ключ для вибраного провайдера моделей
- Облікові дані каналів: токен бота Discord, токен Telegram тощо

## Швидкий шлях для початківців

1. Клонуйте репозиторій → налаштуйте `fly.toml`
2. Створіть застосунок і том → задайте секрети
3. Розгорніть за допомогою `fly deploy`
4. Підключіться через SSH, щоб створити конфігурацію, або використайте Control UI

<Steps>
  <Step title="Створіть застосунок Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Порада:** Виберіть регіон, близький до вас. Поширені варіанти: `lhr` (Лондон), `iad` (Вірджинія), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Налаштуйте fly.toml">
    Відредагуйте `fly.toml` відповідно до назви вашого застосунку та вимог.

    **Примітка щодо безпеки:** Типова конфігурація відкриває публічну URL-адресу. Для захищеного розгортання без публічної IP-адреси див. [Private Deployment](#private-deployment-hardened) або використовуйте `fly.private.toml`.

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

    | Параметр                       | Навіщо                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Прив’язує до `0.0.0.0`, щоб проксі Fly міг дістатися до gateway             |
    | `--allow-unconfigured`         | Дозволяє запуск без файла конфігурації (ви створите його пізніше)           |
    | `internal_port = 3000`         | Має збігатися з `--port 3000` (або `OPENCLAW_GATEWAY_PORT`) для health check Fly |
    | `memory = "2048mb"`            | 512 МБ замало; рекомендовано 2 ГБ                                           |
    | `OPENCLAW_STATE_DIR = "/data"` | Зберігає стан на томі                                                       |

  </Step>

  <Step title="Задайте секрети">
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

    - Прив’язки не до loopback (`--bind lan`) вимагають дійсного шляху автентифікації gateway. У цьому прикладі Fly.io використовується `OPENCLAW_GATEWAY_TOKEN`, але `gateway.auth.password` або правильно налаштоване розгортання `trusted-proxy` не до loopback також задовольняють цю вимогу.
    - Ставтеся до цих токенів як до паролів.
    - **Віддавайте перевагу змінним середовища замість файла конфігурації** для всіх API-ключів і токенів. Так секрети не потраплять до `openclaw.json`, де їх можуть випадково розкрити або записати в логи.

  </Step>

  <Step title="Розгорніть">
    ```bash
    fly deploy
    ```

    Перше розгортання збирає Docker-образ (~2–3 хвилини). Наступні розгортання швидші.

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

  <Step title="Створіть файл конфігурації">
    Підключіться до машини через SSH, щоб створити коректну конфігурацію:

    ```bash
    fly ssh console
    ```

    Створіть каталог конфігурації та файл:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.5"]
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

    **Примітка:** Якщо задано `OPENCLAW_STATE_DIR=/data`, шлях до конфігурації — `/data/openclaw.json`.

    **Примітка:** Токен Discord може надходити з одного з двох джерел:

    - Змінна середовища: `DISCORD_BOT_TOKEN` (рекомендовано для секретів)
    - Файл конфігурації: `channels.discord.token`

    Якщо використовується змінна середовища, додавати токен до конфігурації не потрібно. Gateway автоматично зчитує `DISCORD_BOT_TOKEN`.

    Перезапустіть, щоб застосувати зміни:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Доступ до Gateway">
    ### Control UI

    Відкрийте в браузері:

    ```bash
    fly open
    ```

    Або перейдіть за адресою `https://my-openclaw.fly.dev/`

    Автентифікуйтеся за допомогою налаштованого спільного секрету. У цьому посібнику використовується токен gateway з `OPENCLAW_GATEWAY_TOKEN`; якщо ви перейшли на автентифікацію паролем, використовуйте натомість цей пароль.

    ### Логи

    ```bash
    fly logs              # Логи в реальному часі
    fly logs --no-tail    # Останні логи
    ```

    ### SSH-консоль

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Усунення несправностей

### "App is not listening on expected address"

Gateway прив’язується до `127.0.0.1` замість `0.0.0.0`.

**Виправлення:** Додайте `--bind lan` до команди процесу у `fly.toml`.

### Не проходять health checks / connection refused

Fly не може дістатися до gateway на налаштованому порту.

**Виправлення:** Переконайтеся, що `internal_port` збігається з портом gateway (задайте `--port 3000` або `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблеми з пам’яттю

Контейнер постійно перезапускається або примусово завершується. Ознаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` або тихі перезапуски.

**Виправлення:** Збільште пам’ять у `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Або оновіть наявну машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Примітка:** 512 МБ — замало. 1 ГБ може працювати, але можливі OOM під навантаженням або з докладним логуванням. **Рекомендовано 2 ГБ.**

### Проблеми з блокуванням Gateway

Gateway відмовляється запускатися з помилками на кшталт "already running".

Це трапляється, коли контейнер перезапускається, але файл PID-блокування зберігається на томі.

**Виправлення:** Видаліть файл блокування:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Файл блокування розташований у `/data/gateway.*.lock` (не в підкаталозі).

### Конфігурація не зчитується

`--allow-unconfigured` лише обходить стартову перевірку. Він не створює і не виправляє `/data/openclaw.json`, тож переконайтеся, що ваш реальний файл конфігурації існує і містить `gateway.mode="local"`, якщо ви хочете звичайний локальний запуск gateway.

Перевірте, що конфігурація існує:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запис конфігурації через SSH

Команда `fly ssh console -C` не підтримує перенаправлення оболонки. Щоб записати файл конфігурації:

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

Якщо після перезапуску ви втрачаєте профілі автентифікації, стан каналу/провайдера або сесії, каталог стану записується у файлову систему контейнера.

**Виправлення:** Переконайтеся, що `OPENCLAW_STATE_DIR=/data` задано в `fly.toml`, і виконайте повторне розгортання.

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

**Примітка:** Після `fly deploy` команда машини може скинутися до значення з `fly.toml`. Якщо ви вносили ручні зміни, застосуйте їх повторно після розгортання.

## Private Deployment (захищене)

Типово Fly виділяє публічні IP-адреси, через що ваш gateway стає доступним за адресою `https://your-app.fly.dev`. Це зручно, але також означає, що ваше розгортання можуть знаходити інтернет-сканери (Shodan, Censys тощо).

Для захищеного розгортання **без публічної доступності** використовуйте приватний шаблон.

### Коли використовувати приватне розгортання

- Ви робите лише **вихідні** виклики/повідомлення (без вхідних webhook-ів)
- Ви використовуєте тунелі **ngrok або Tailscale** для будь-яких callback-ів webhook-ів
- Ви отримуєте доступ до gateway через **SSH, проксі або WireGuard**, а не через браузер
- Ви хочете, щоб розгортання було **приховане від інтернет-сканерів**

### Налаштування

Використовуйте `fly.private.toml` замість стандартної конфігурації:

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

Оскільки публічної URL-адреси немає, використовуйте один із цих способів:

**Варіант 1: Локальний проксі (найпростіше)**

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

### Webhook-и з приватним розгортанням

Якщо вам потрібні callback-и webhook-ів (Twilio, Telnyx тощо) без публічної доступності:

1. **Тунель ngrok** — запустіть ngrok усередині контейнера або як sidecar
2. **Tailscale Funnel** — відкрийте конкретні шляхи через Tailscale
3. **Лише вихідний трафік** — деякі провайдери (Twilio) нормально працюють для вихідних викликів і без webhook-ів

Приклад конфігурації голосових викликів з ngrok:

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

Тунель ngrok працює всередині контейнера та надає публічну URL-адресу webhook без відкриття самого застосунку Fly. Установіть `webhookSecurity.allowedHosts` на ім’я хоста публічного тунелю, щоб переслані заголовки host приймалися.

### Переваги безпеки

| Аспект             | Публічне     | Приватне   |
| ------------------ | ------------ | ---------- |
| Інтернет-сканери   | Виявляється  | Приховане  |
| Прямі атаки        | Можливі      | Заблоковані |
| Доступ до Control UI | Браузер    | Проксі/VPN |
| Доставка webhook-ів | Напряму     | Через тунель |

## Примітки

- Fly.io використовує **архітектуру x86** (не ARM)
- Dockerfile сумісний з обома архітектурами
- Для онбордингу WhatsApp/Telegram використовуйте `fly ssh console`
- Стійкі дані зберігаються на томі за адресою `/data`
- Signal потребує Java + `signal-cli`; використовуйте кастомний образ і тримайте пам’ять на рівні 2 ГБ або більше.

## Вартість

За рекомендованої конфігурації (`shared-cpu-2x`, 2 ГБ RAM):

- ~$10-15/місяць залежно від використання
- Безкоштовний рівень включає певний ліміт

Докладніше див. у [Fly.io pricing](https://fly.io/docs/about/pricing/).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Channels](/uk/channels)
- Налаштуйте Gateway: [Gateway configuration](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Updating](/uk/install/updating)
