---
read_when:
    - Розгортання OpenClaw на Fly.io
    - Налаштування томів Fly, секретів і конфігурації першого запуску
summary: Покрокове розгортання OpenClaw на Fly.io зі сталим сховищем і HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-05T18:07:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# Розгортання на Fly.io

**Мета:** Gateway OpenClaw, що працює на машині [Fly.io](https://fly.io) зі сталим сховищем, автоматичним HTTPS і доступом до Discord/каналів.

## Що вам потрібно

- Установлений [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Обліковий запис Fly.io (працює навіть безкоштовний тариф)
- Автентифікація моделі: API-ключ для вибраного провайдера моделей
- Облікові дані каналів: токен Discord-бота, токен Telegram тощо

## Швидкий шлях для початківців

1. Клонуйте репозиторій → налаштуйте `fly.toml`
2. Створіть застосунок + том → задайте секрети
3. Розгорніть через `fly deploy`
4. Підключіться через SSH, щоб створити конфігурацію, або використовуйте Control UI

<Steps>
  <Step title="Створіть застосунок Fly">
    ```bash
    # Клонуйте репозиторій
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Створіть новий застосунок Fly (виберіть власну назву)
    fly apps create my-openclaw

    # Створіть сталий том (зазвичай 1GB достатньо)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Порада:** Оберіть регіон ближче до себе. Поширені варіанти: `lhr` (Лондон), `iad` (Вірджинія), `sjc` (Сан-Хосе).

  </Step>

  <Step title="Налаштуйте fly.toml">
    Відредагуйте `fly.toml`, щоб він відповідав назві вашого застосунку та вимогам.

    **Примітка щодо безпеки:** Типова конфігурація відкриває публічний URL. Для захищеного розгортання без публічної IP-адреси див. [Приватне розгортання](#private-deployment-hardened) або використовуйте `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Назва вашого застосунку
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

    **Ключові налаштування:**

    | Налаштування                  | Навіщо                                                                      |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Прив’язує до `0.0.0.0`, щоб проксі Fly міг дістатися gateway                |
    | `--allow-unconfigured`        | Запускає без файла конфігурації (ви створите його пізніше)                  |
    | `internal_port = 3000`        | Має збігатися з `--port 3000` (або `OPENCLAW_GATEWAY_PORT`) для health checks Fly |
    | `memory = "2048mb"`           | 512MB замало; рекомендовано 2GB                                             |
    | `OPENCLAW_STATE_DIR = "/data"` | Зберігає стан на томі                                                      |

  </Step>

  <Step title="Задайте секрети">
    ```bash
    # Обов’язково: токен Gateway (для прив’язки не до loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API-ключі провайдерів моделей
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Необов’язково: інші провайдери
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Токени каналів
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Примітки:**

    - Прив’язки не до loopback (`--bind lan`) потребують валідного шляху автентифікації gateway. У цьому прикладі Fly.io використовується `OPENCLAW_GATEWAY_TOKEN`, але вимогу також задовольняють `gateway.auth.password` або правильно налаштоване розгортання `trusted-proxy` не на loopback.
    - Ставтеся до цих токенів як до паролів.
    - **Надавайте перевагу env vars замість файла конфігурації** для всіх API-ключів і токенів. Це не дає секретам потрапити в `openclaw.json`, де їх можуть випадково відкрити або записати в журнали.

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
    Підключіться до машини через SSH, щоб створити правильну конфігурацію:

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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Примітка:** Якщо задано `OPENCLAW_STATE_DIR=/data`, шлях до конфігурації буде `/data/openclaw.json`.

    **Примітка:** Токен Discord може надходити з одного з двох джерел:

    - Змінна середовища: `DISCORD_BOT_TOKEN` (рекомендовано для секретів)
    - Файл конфігурації: `channels.discord.token`

    Якщо використовується env var, додавати токен до конфігурації не потрібно. Gateway автоматично читає `DISCORD_BOT_TOKEN`.

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

    Автентифікуйтеся за допомогою налаштованого спільного секрету. У цьому посібнику використовується токен gateway з `OPENCLAW_GATEWAY_TOKEN`; якщо ви перейшли на автентифікацію за паролем, використовуйте той пароль.

    ### Журнали

    ```bash
    fly logs              # Live-журнали
    fly logs --no-tail    # Останні журнали
    ```

    ### Консоль SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Усунення несправностей

### "App is not listening on expected address"

Gateway прив’язується до `127.0.0.1`, а не до `0.0.0.0`.

**Виправлення:** Додайте `--bind lan` до команди процесу у вашому `fly.toml`.

### Health checks не проходять / connection refused

Fly не може дістатися gateway на налаштованому порту.

**Виправлення:** Переконайтеся, що `internal_port` збігається з портом gateway (задайте `--port 3000` або `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / проблеми з пам’яттю

Контейнер постійно перезапускається або його примусово завершує система. Ознаки: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` або тихі перезапуски.

**Виправлення:** Збільшіть пам’ять у `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Або оновіть наявну машину:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Примітка:** 512MB замало. 1GB може працювати, але під навантаженням або з докладним журналюванням можливий OOM. **Рекомендовано 2GB.**

### Проблеми з блокуванням Gateway

Gateway відмовляється запускатися з помилками на кшталт "already running".

Це трапляється, коли контейнер перезапускається, але файл блокування PID залишається на томі.

**Виправлення:** Видаліть файл блокування:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Файл блокування розташований у `/data/gateway.*.lock` (не в підкаталозі).

### Конфігурація не читається

`--allow-unconfigured` лише обходить захист під час запуску. Він не створює й не відновлює `/data/openclaw.json`, тому переконайтеся, що реальна конфігурація існує й містить `gateway.mode="local"`, якщо ви хочете звичайний локальний запуск gateway.

Перевірте, що конфігурація існує:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Запис конфігурації через SSH

Команда `fly ssh console -C` не підтримує shell-перенаправлення. Щоб записати файл конфігурації:

```bash
# Використовуйте echo + tee (pipe з локальної машини на віддалену)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Або використовуйте sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Примітка:** `fly sftp` може завершитися помилкою, якщо файл уже існує. Спочатку видаліть його:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Стан не зберігається

Якщо після перезапуску ви втрачаєте auth profiles, стан каналу/провайдера або сесії,
каталог state записується у файлову систему контейнера.

**Виправлення:** Переконайтеся, що в `fly.toml` задано `OPENCLAW_STATE_DIR=/data`, і розгорніть заново.

## Оновлення

```bash
# Отримайте останні зміни
git pull

# Повторно розгорніть
fly deploy

# Перевірте стан
fly status
fly logs
```

### Оновлення команди машини

Якщо вам потрібно змінити команду запуску без повного повторного розгортання:

```bash
# Отримайте ID машини
fly machines list

# Оновіть команду
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Або разом зі збільшенням пам’яті
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Примітка:** Після `fly deploy` команда машини може повернутися до значення з `fly.toml`. Якщо ви робили зміни вручну, застосуйте їх знову після розгортання.

## Приватне розгортання (з посиленим захистом)

Типово Fly виділяє публічні IP-адреси, через що ваш gateway стає доступним за адресою `https://your-app.fly.dev`. Це зручно, але означає, що розгортання можна виявити інтернет-сканерами (Shodan, Censys тощо).

Для захищеного розгортання **без публічного доступу** використовуйте приватний шаблон.

### Коли використовувати приватне розгортання

- Ви робите лише **вихідні** виклики/повідомлення (без вхідних webhook)
- Ви використовуєте **ngrok або Tailscale**-тунелі для будь-яких callback webhook
- Ви отримуєте доступ до gateway через **SSH, proxy або WireGuard**, а не через браузер
- Ви хочете, щоб розгортання було **приховане від інтернет-сканерів**

### Налаштування

Використовуйте `fly.private.toml` замість стандартної конфігурації:

```bash
# Розгортання з приватною конфігурацією
fly deploy -c fly.private.toml
```

Або перетворіть наявне розгортання:

```bash
# Перелічіть поточні IP-адреси
fly ips list -a my-openclaw

# Звільніть публічні IP-адреси
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Перейдіть на приватну конфігурацію, щоб майбутні розгортання не виділяли публічні IP знову
# (приберіть [http_service] або розгорніть із приватним шаблоном)
fly deploy -c fly.private.toml

# Виділіть лише приватну IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Після цього `fly ips list` має показувати лише IP типу `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Доступ до приватного розгортання

Оскільки публічного URL немає, використовуйте один із таких способів:

**Варіант 1: Локальний проксі (найпростіше)**

```bash
# Проксіюйте локальний порт 3000 до застосунку
fly proxy 3000:3000 -a my-openclaw

# Потім відкрийте в браузері http://localhost:3000
```

**Варіант 2: WireGuard VPN**

```bash
# Створіть конфігурацію WireGuard (одноразово)
fly wireguard create

# Імпортуйте її у клієнт WireGuard, потім звертайтеся через внутрішню IPv6
# Приклад: http://[fdaa:x:x:x:x::x]:3000
```

**Варіант 3: Лише SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook у приватному розгортанні

Якщо вам потрібні callback webhook (Twilio, Telnyx тощо) без публічного відкриття:

1. **Тунель ngrok** — запустіть ngrok усередині контейнера або як sidecar
2. **Tailscale Funnel** — відкрийте конкретні шляхи через Tailscale
3. **Лише вихідний режим** — деякі провайдери (Twilio) нормально працюють для вихідних викликів без webhook

Приклад конфігурації voice-call з ngrok:

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

Тунель ngrok запускається всередині контейнера й надає публічний URL webhook без відкриття самого застосунку Fly. Задайте `webhookSecurity.allowedHosts` як публічне ім’я хоста тунелю, щоб forwarded host headers приймалися.

### Переваги для безпеки

| Аспект              | Публічне     | Приватне   |
| ------------------- | ------------ | ---------- |
| Інтернет-сканери    | Виявляється  | Приховане  |
| Прямі атаки         | Можливі      | Заблоковані |
| Доступ до Control UI | Через браузер | Через проксі/VPN |
| Доставка webhook    | Напряму      | Через тунель |

## Примітки

- Fly.io використовує **архітектуру x86** (не ARM)
- Dockerfile сумісний з обома архітектурами
- Для onboarding WhatsApp/Telegram використовуйте `fly ssh console`
- Сталі дані зберігаються на томі в `/data`
- Signal потребує Java + `signal-cli`; використовуйте кастомний образ і тримайте пам’ять на рівні 2GB+.

## Вартість

За рекомендованої конфігурації (`shared-cpu-2x`, 2GB RAM):

- Близько $10–15/місяць залежно від використання
- Безкоштовний тариф включає певний ліміт

Докладніше див. у [Fly.io pricing](https://fly.io/docs/about/pricing/).

## Наступні кроки

- Налаштуйте канали повідомлень: [Channels](/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Updating](/install/updating)
