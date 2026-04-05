---
read_when:
    - Запуск або налагодження процесу gateway
summary: Runbook для сервісу Gateway, його життєвого циклу та операцій
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-05T18:03:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Runbook Gateway

Використовуйте цю сторінку для запуску сервісу Gateway в перший день і його експлуатації надалі.

<CardGroup cols={2}>
  <Card title="Поглиблене усунення несправностей" icon="siren" href="/gateway/troubleshooting">
    Діагностика за симптомами з точними послідовностями команд і сигнатурами журналів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/gateway/configuration">
    Посібник із налаштування, орієнтований на завдання, + повний довідник із конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/gateway/secrets">
    Контракт SecretRef, поведінка runtime snapshot і операції migrate/reload.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/gateway/secrets-plan-contract">
    Точні правила target/path для `secrets apply` і поведінка auth-profile лише з ref.
  </Card>
</CardGroup>

## Локальний запуск за 5 хвилин

<Steps>
  <Step title="Запустіть Gateway">

```bash
openclaw gateway --port 18789
# debug/trace дзеркаляться у stdio
openclaw gateway --port 18789 --verbose
# примусово завершує listener на вибраному порту, потім запускає
openclaw gateway --force
```

  </Step>

  <Step title="Перевірте стан сервісу">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Ознаки здорового базового стану: `Runtime: running` і `RPC probe: ok`.

  </Step>

  <Step title="Перевірте готовність каналу">

```bash
openclaw channels status --probe
```

За доступного gateway ця команда виконує live-перевірки каналів для кожного облікового запису та необов’язкові аудити.
Якщо gateway недоступний, CLI повертається до зведень каналів лише на основі конфігурації
замість live-виводу перевірки.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує активний шлях до файлу конфігурації (визначений із типових значень profile/state або через `OPENCLAW_CONFIG_PATH`, якщо його задано).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний in-memory snapshot конфігурації; успішне перезавантаження атомарно замінює цей snapshot.
</Note>

## Модель runtime

- Один постійно запущений процес для маршрутизації, control plane і підключень каналів.
- Один мультиплексований порт для:
  - WebSocket control/RPC
  - HTTP API, сумісних з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI і hooks
- Типовий режим bind: `loopback`.
- Автентифікація типово обов’язкова. Для конфігурацій зі спільним секретом використовуйте
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а для конфігурацій
  з reverse proxy не на loopback можна використовувати `gateway.auth.mode: "trusted-proxy"`.

## Endpoint, сумісні з OpenAI

Найважливіша поверхня сумісності OpenClaw тепер така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато конвеєрів RAG і пам’яті очікують `/v1/embeddings`.
- Клієнти, нативні для агентів, дедалі частіше віддають перевагу `/v1/responses`.

Примітка щодо планування:

- `/v1/models` орієнтований на агентів: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — це стабільний псевдонім, який завжди зіставляється з налаштованим типовим агентом.
- Використовуйте `x-openclaw-model`, коли вам потрібно перевизначити провайдера/модель backend; інакше зберігається керування звичайною моделлю та налаштуванням embedding вибраного агента.

Усе це працює на головному порту Gateway і використовує ту саму межу автентифікації довіреного оператора, що й решта HTTP API Gateway.

### Пріоритет порту й bind

| Налаштування | Порядок визначення                                             |
| ------------ | -------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим bind   | CLI/перевизначення → `gateway.bind` → `loopback`               |

### Режими hot reload

| `gateway.reload.mode` | Поведінка                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Без перезавантаження конфігурації          |
| `hot`                 | Застосовує лише безпечні для hot зміни     |
| `restart`             | Перезапуск при змінах, що вимагають reload |
| `hybrid` (типово)     | Hot-застосування, коли безпечно, і перезапуск, коли потрібно |

## Набір операторських команд

```bash
openclaw gateway status
openclaw gateway status --deep   # додає системне сканування сервісу
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` призначено для додаткового виявлення сервісів (LaunchDaemons/systemd system
units/schtasks), а не для глибшої RPC-перевірки стану.

## Кілька gateway на одному хості

У більшості інсталяцій має працювати один gateway на машину. Один gateway може обслуговувати кількох
агентів і каналів.

Кілька gateway потрібні лише тоді, коли вам навмисно потрібна ізоляція або аварійний бот.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Чого очікувати:

- `gateway status --deep` може повідомити `Other gateway-like services detected (best effort)`
  і надрукувати підказки з очищення, якщо ще лишилися застарілі інсталяції launchd/systemd/schtasks.
- `gateway probe` може попередити про `multiple reachable gateways`, коли відповідає більше ніж одна ціль.
- Якщо це навмисно, ізолюйте порти, config/state і корені workspace для кожного gateway окремо.

Детальне налаштування: [/gateway/multiple-gateways](/gateway/multiple-gateways).

## Віддалений доступ

Бажано: Tailscale/VPN.
Резервний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Після цього підключайте клієнти локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію gateway. Для автентифікації зі спільним секретом клієнти
все одно мають надсилати `token`/`password`, навіть через тунель. Для режимів із
ідентифікацією запит усе одно має відповідати цьому шляху автентифікації.
</Warning>

Див.: [Remote Gateway](/gateway/remote), [Автентифікація](/gateway/authentication), [Tailscale](/gateway/tailscale).

## Супервізія та життєвий цикл сервісу

Для надійності, подібної до production, використовуйте запуск під супервізією.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Мітки LaunchAgent — `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований profile). `openclaw doctor` перевіряє й виправляє дрейф конфігурації сервісу.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Щоб сервіс не зупинявся після виходу з системи, увімкніть lingering:

```bash
sudo loginctl enable-linger <user>
```

Приклад ручного user unit, коли потрібен кастомний шлях встановлення:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Керований нативний запуск Windows використовує Scheduled Task з назвою `OpenClaw Gateway`
(або `OpenClaw Gateway (<profile>)` для іменованих profile). Якщо створення Scheduled Task
заборонено, OpenClaw повертається до launcher у Startup-folder для кожного користувача,
який вказує на `gateway.cmd` у каталозі state.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для багатокористувацьких/постійно ввімкнених хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте те саме тіло сервісу, що й для user unit, але встановлюйте його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і за потреби скоригуйте
`ExecStart=`, якщо ваш бінарний файл `openclaw` розташований в іншому місці.

  </Tab>
</Tabs>

## Кілька gateway на одному хості

У більшості конфігурацій слід запускати **один** Gateway.
Використовуйте кілька лише для суворої ізоляції/резервування (наприклад, rescue profile).

Контрольний список для кожного екземпляра:

- Унікальний `gateway.port`
- Унікальний `OPENCLAW_CONFIG_PATH`
- Унікальний `OPENCLAW_STATE_DIR`
- Унікальний `agents.defaults.workspace`

Приклад:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Див.: [Кілька gateway](/gateway/multiple-gateways).

### Швидкий шлях для dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольований state/config і базовий порт gateway `19001`.

## Короткий довідник з протоколу (погляд оператора)

- Першим кадром клієнта має бути `connect`.
- Gateway повертає snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список виявлення, а не
  згенерований дамп кожного доступного допоміжного маршруту.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- До поширених подій належать `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агентів мають дві стадії:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Фінальна відповідь про завершення (`status:"ok"|"error"`), з потоковими подіями `agent` між ними.

Повну документацію з протоколу див. в [Gateway Protocol](/gateway/protocol).

## Операційні перевірки

### Доступність

- Відкрийте WS і надішліть `connect`.
- Очікуйте відповідь `hello-ok` зі snapshot.

### Готовність

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Відновлення після пропусків

Події не відтворюються повторно. За розривів у послідовності оновіть стан (`health`, `system-presence`) перед продовженням.

## Типові сигнатури збоїв

| Сигнатура                                                     | Імовірна проблема                                                                |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind не на loopback без валідного шляху автентифікації gateway                   |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                  |
| `Gateway start blocked: set gateway.mode=local`               | У конфігурації задано remote mode, або в пошкодженій конфігурації відсутній stamp local-mode |
| `unauthorized` during connect                                 | Невідповідність автентифікації між клієнтом і gateway                            |

Для повних послідовностей діагностики використовуйте [Усунення несправностей Gateway](/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються помилкою, коли Gateway недоступний (без неявного резервного переходу до прямого каналу).
- Невалідні/не-`connect` перші кадри відхиляються й з’єднання закривається.
- Плавне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

---

Пов’язане:

- [Усунення несправностей](/gateway/troubleshooting)
- [Фоновий процес](/gateway/background-process)
- [Конфігурація](/gateway/configuration)
- [Стан](/gateway/health)
- [Doctor](/gateway/doctor)
- [Автентифікація](/gateway/authentication)
