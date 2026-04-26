---
read_when:
    - Розгортання OpenClaw на Fly.io
    - Налаштування томів Fly, секретів і конфігурації першого запуску
summary: Покрокове розгортання OpenClaw на Fly.io зі сталим сховищем і HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T00:40:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# Розгортання на Fly.io

**Мета:** Gateway OpenClaw, запущений на машині [Fly.io](https://fly.io) зі сталим сховищем, автоматичним HTTPS і доступом до Discord/каналів.

## Що вам знадобиться

- встановлений [CLI `flyctl`](https://fly.io/docs/hands-on/install-flyctl/)
- обліковий запис Fly.io (безкоштовний тариф підходить)
- автентифікація моделі: API-ключ для обраного вами провайдера моделі
- облікові дані каналу: токен бота Discord, токен Telegram тощо

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

    **Порада:** Оберіть регіон, близький до вас. Поширені варіанти: `lhr` (Лондон), `iad` (Вірджинія), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Налаштуйте fly.toml">
    Відредагуйте `fly.toml`, щоб він відповідав назві вашого застосунку та вашим вимогам.

    **Примітка щодо безпеки:** Конфігурація за замовчуванням відкриває публічну URL-адресу. Для посиленого розгортання без публічної IP-адреси див. [Приватне розгортання](#private-deployment-hardened) або використайте `fly.private.toml`.

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

    | Параметр                      | Чому                                                                        |
    | ----------------------------- | ---------------------------------------------------------------------------- |
    | `--bind lan`                  | Прив’язує до `0.0.0.0`, щоб проксі Fly міг дістатися до gateway              |
    | `--allow-unconfigured`        | Запускає без конфігураційного файлу (ви створите його пізніше)               |
    | `internal_port = 3000`        | Має збігатися з `--port 3000` (або `OPENCLAW_GATEWAY_PORT`) для health checks Fly |
    | `memory = "2048mb"`           | 512 МБ замало; рекомендовано 2 ГБ                                            |
    | `OPENCLAW_STATE_DIR = "/data"`| Зберігає стан на томі                                                        |

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

    - Прив’язки не до local loopback (`--bind lan`) вимагають коректного шляху автентифікації gateway. У цьому прикладі Fly.io використовується `OPENCLAW_GATEWAY_TOKEN`, але `gateway.auth.password` або правильно налаштоване розгортання `trusted-proxy` не на local loopback також задовольняють цю вимогу.
    - Ставтеся до цих токенів як до паролів.
    - **Надавайте перевагу змінним середовища замість конфігураційного файлу** для всіх API-ключів і токенів. Це не дає секретам потрапити в `openclaw.json`, де вони можуть бути випадково розкриті або залоговані.

  </Step>

  <Step title="Розгорніть">
    ```bash
    fly deploy
    ```

    Під час першого розгортання збирається Docker-образ (~2–3 хвилини). Наступні розгортання швидші.

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

  <Step title="Створіть конфігураційний файл">
    Підключіться через SSH до машини, щоб створити належну конфігурацію:

    ```bash
    fly ssh console
    ```

    Створіть каталог і файл конфігурації:

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
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Примітка:** Якщо задано `OPENCLAW_STATE_DIR=/data`, шлях до конфігурації — `/data/openclaw.json`.

    **Примітка:** Замініть `https://my-openclaw.fly.dev` на справжнє
    джерело походження вашого застосунку Fly. Під час запуску gateway локальні джерела походження для Control UI ініціалізуються на основі значень `--bind` і `--port` у середовищі виконання, тож перший запуск може відбутися ще до появи конфігурації, але для доступу через браузер у Fly все одно потрібно точно вказати HTTPS-джерело походження в
    `gateway.controlUi.allowedOrigins`.

    **Примітка:** Токен Discord може надходити з:

    - Змінної середовища: `DISCORD_BOT_TOKEN` (рекомендовано для секретів)
    - Конфігураційного файлу: `channels.discord.token`

    Якщо ви використовуєте змінну середовища, додавати токен до конфігурації не потрібно. Gateway автоматично читає `DISCORD_BOT_TOKEN`.

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

    Або перейдіть за адресою `https://my-openclaw.fly.dev/`

    Автентифікуйтеся за допомогою налаштованого спільного секрету. У цьому посібнику використовується токен gateway з `OPENCLAW_GATEWAY_TOKEN`; якщо ви перейшли на автентифікацію паролем, використайте замість нього цей пароль.

    ### Логи

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH-консоль

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Усунення несправностей

### «App is not listening on expected address»

Gateway прив’язується до `127.0.0.1` замість `0.0.0.0`.

**Виправлення:** Додайте `--bind lan` до команди процесу у `fly.toml`.

### Збої health checks / connection refused

Fly не може дістатися до gateway на вказаному порту.

**Виправлення:** Переконайтеся, що `internal_port` збігається з портом gateway (задайте `--port 3000` або `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблеми з пам’яттю

Контейнер постійно перезапускається або завершується примусово. Ознаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` або тихі перезапуски.

**Виправлення:** Збільшіть пам’ять у `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Або оновіть наявну машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Примітка:** 512 МБ замало. 1 ГБ може працювати, але під навантаженням або з детальним логуванням можливі OOM. **Рекомендовано 2 ГБ.**

### Проблеми з блокуванням Gateway

Gateway відмовляється запускатися з помилками на кшталт «already running».

Це трапляється, коли контейнер перезапускається, але файл блокування PID залишається на томі.

**Виправлення:** Видаліть файл блокування:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Файл блокування знаходиться в `/data/gateway.*.lock` (не в підкаталозі).

### Конфігурація не зчитується

`--allow-unconfigured` лише обходить перевірку під час запуску. Він не створює і не відновлює `/data/openclaw.json`, тому переконайтеся, що реальна конфігурація існує та містить `gateway.mode="local"`, якщо вам потрібен звичайний локальний запуск gateway.

Перевірте, що конфігурація існує:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запис конфігурації через SSH

Команда `fly ssh console -C` не підтримує перенаправлення оболонки. Щоб записати конфігураційний файл:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Примітка:** `fly sftp` може завершитися з помилкою, якщо файл уже існує. Спочатку видаліть його:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Стан не зберігається

Якщо після перезапуску ви втрачаєте профілі автентифікації, стан каналу/провайдера або сесії,
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

Якщо вам потрібно змінити команду запуску без повного повторного розгортання:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Примітка:** Після `fly deploy` команда машини може бути скинута до значення з `fly.toml`. Якщо ви вносили зміни вручну, застосуйте їх повторно після розгортання.

## Приватне розгортання (посилене)

За замовчуванням Fly виділяє публічні IP-адреси, через що ваш gateway стає доступним за адресою `https://your-app.fly.dev`. Це зручно, але означає, що ваше розгортання можна виявити інтернет-сканерами (Shodan, Censys тощо).

Для посиленого розгортання **без публічного доступу** використовуйте приватний шаблон.

### Коли варто використовувати приватне розгортання

- Ви робите лише **вихідні** виклики/надсилання повідомлень (без вхідних Webhook)
- Ви використовуєте тунелі **ngrok або Tailscale** для будь-яких callback Webhook
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

Оскільки публічної URL-адреси немає, скористайтеся одним із цих способів:

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

### Webhook у приватному розгортанні

Якщо вам потрібні callback Webhook (Twilio, Telnyx тощо) без публічного доступу:

1. **Тунель ngrok** — запустіть ngrok усередині контейнера або як sidecar
2. **Tailscale Funnel** — відкрийте певні шляхи через Tailscale
3. **Лише вихідний трафік** — деякі провайдери (Twilio) добре працюють для вихідних викликів і без Webhook

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

Тунель ngrok працює всередині контейнера і надає публічну URL-адресу Webhook, не відкриваючи сам застосунок Fly. Задайте `webhookSecurity.allowedHosts` як ім’я хоста публічного тунелю, щоб заголовки хоста, переслані далі, приймалися.

### Переваги для безпеки

| Аспект            | Публічне      | Приватне   |
| ----------------- | ------------- | ---------- |
| Інтернет-сканери  | Виявляється   | Приховане  |
| Прямі атаки       | Можливі       | Заблоковані |
| Доступ до Control UI | Браузер    | Проксі/VPN |
| Доставка Webhook  | Напряму       | Через тунель |

## Примітки

- Fly.io використовує **архітектуру x86** (не ARM)
- Dockerfile сумісний з обома архітектурами
- Для онбордингу WhatsApp/Telegram використовуйте `fly ssh console`
- Сталі дані зберігаються на томі в `/data`
- Для Signal потрібні Java + `signal-cli`; використовуйте власний образ і тримайте пам’ять на рівні 2 ГБ+.

## Вартість

З рекомендованою конфігурацією (`shared-cpu-2x`, 2 ГБ RAM):

- приблизно ~$10–15/місяць залежно від використання
- безкоштовний тариф включає певний ліміт

Докладніше див. у [тарифах Fly.io](https://fly.io/docs/about/pricing/).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Hetzner](/uk/install/hetzner)
- [Docker](/uk/install/docker)
- [Хостинг VPS](/uk/vps)
