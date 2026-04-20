---
read_when:
    - Запуск або налагодження процесу gateway
summary: Посібник з експлуатації для служби Gateway, її життєвого циклу та операцій
title: Посібник з експлуатації Gateway
x-i18n:
    generated_at: "2026-04-20T06:31:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# Посібник з експлуатації Gateway

Використовуйте цю сторінку для запуску в перший день і операцій другого дня для служби Gateway.

<CardGroup cols={2}>
  <Card title="Поглиблене усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика, що починається із симптому, з точними послідовностями команд і сигнатурами журналів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Посібник із налаштування, орієнтований на завдання, + повний довідник з конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка знімків під час виконання та операції міграції/перезавантаження.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила target/path для `secrets apply` і поведінка auth-profile лише з ref.
  </Card>
</CardGroup>

## Локальний запуск за 5 хвилин

<Steps>
  <Step title="Запустіть Gateway">

```bash
openclaw gateway --port 18789
# debug/trace дзеркаляться в stdio
openclaw gateway --port 18789 --verbose
# примусово вбити listener на вибраному порту, потім запустити
openclaw gateway --force
```

  </Step>

  <Step title="Перевірте стан служби">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Базовий здоровий стан: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає вашим очікуванням. Використовуйте `openclaw gateway status --require-rpc`, коли вам потрібне підтвердження RPC з областю читання, а не лише досяжність.

  </Step>

  <Step title="Перевірте готовність каналів">

```bash
openclaw channels status --probe
```

За наявності доступного gateway це виконує живі зондування каналів для кожного облікового запису та необов’язкові аудити.
Якщо gateway недоступний, CLI повертається до зведень каналів лише з конфігурації
замість виводу живого зондування.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує активний шлях до файла конфігурації (визначений із профілю/стану за замовчуванням або через `OPENCLAW_CONFIG_PATH`, якщо його задано).
Режим за замовчуванням — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей знімок.
</Note>

## Модель виконання

- Один постійно запущений процес для маршрутизації, control plane і підключень каналів.
- Один мультиплексований порт для:
  - WebSocket control/RPC
  - HTTP API, сумісних з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI і hooks
- Режим прив’язки за замовчуванням: `loopback`.
- Автентифікація обов’язкова за замовчуванням. У конфігураціях зі спільним секретом використовуйте
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а для конфігурацій
  reverse proxy не на `loopback` можна використовувати `gateway.auth.mode: "trusted-proxy"`.

## Сумісні з OpenAI endpoint-и

Найцінніша поверхня сумісності OpenClaw зараз:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато конвеєрів RAG і пам’яті очікують `/v1/embeddings`.
- Клієнти, орієнтовані на агентів, дедалі частіше віддають перевагу `/v1/responses`.

Примітка щодо планування:

- `/v1/models` орієнтований на агентів: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — це стабільний псевдонім, який завжди вказує на налаштованого агента за замовчуванням.
- Використовуйте `x-openclaw-model`, якщо вам потрібно перевизначити backend provider/model; інакше керування зберігають звичайні налаштування моделі та embeddings вибраного агента.

Усе це працює на основному порту Gateway і використовує ту саму межу автентифікації довіреного оператора, що й решта HTTP API Gateway.

### Пріоритет порту і режиму прив’язки

| Налаштування | Порядок визначення                                             |
| ------------ | -------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`  |
| Режим прив’язки | CLI/override → `gateway.bind` → `loopback`                  |

### Режими гарячого перезавантаження

| `gateway.reload.mode` | Поведінка                                 |
| --------------------- | ----------------------------------------- |
| `off`                 | Без перезавантаження конфігурації         |
| `hot`                 | Застосовувати лише безпечні для hot зміни |
| `restart`             | Перезапуск при змінах, що вимагають reload |
| `hybrid` (за замовчуванням) | Hot-застосування, коли безпечно, перезапуск, коли потрібно |

## Набір команд оператора

```bash
openclaw gateway status
openclaw gateway status --deep   # додає сканування служби на рівні системи
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` призначено для додаткового виявлення служб (LaunchDaemons/systemd system
units/schtasks), а не для глибшого RPC-зондування стану.

## Кілька gateway на одному хості

У більшості інсталяцій має працювати один gateway на машину. Один gateway може обслуговувати кількох
агентів і канали.

Кілька gateway потрібні лише тоді, коли ви навмисно хочете ізоляцію або резервного бота.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Що очікувати:

- `gateway status --deep` може повідомити `Other gateway-like services detected (best effort)`
  і вивести підказки з очищення, якщо все ще присутні застарілі інсталяції launchd/systemd/schtasks.
- `gateway probe` може попередити про `multiple reachable gateways`, якщо відповідає більше
  ніж одна ціль.
- Якщо це навмисно, ізолюйте порти, конфігурацію/стан і корені workspace для кожного gateway.

Докладне налаштування: [/gateway/multiple-gateways](/uk/gateway/multiple-gateways).

## Віддалений доступ

Рекомендовано: Tailscale/VPN.
Запасний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Потім підключайте клієнтів локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів з ідентичністю
запит усе одно має відповідати цьому шляху автентифікації.
</Warning>

Див.: [Remote Gateway](/uk/gateway/remote), [Authentication](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл служби

Для надійності, подібної до production, використовуйте керовані запуски.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Мітки LaunchAgent: `ai.openclaw.gateway` (за замовчуванням) або `ai.openclaw.<profile>` (іменований профіль). `openclaw doctor` перевіряє та виправляє дрейф конфігурації служби.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Для збереження після виходу із системи ввімкніть lingering:

```bash
sudo loginctl enable-linger <user>
```

Приклад ручного user-unit, коли потрібен власний шлях інсталяції:

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

Керований автозапуск у Windows використовує Scheduled Task з назвою `OpenClaw Gateway`
(або `OpenClaw Gateway (<profile>)` для іменованих профілів). Якщо створення Scheduled Task
заборонене, OpenClaw повертається до launcher у Startup-folder для поточного користувача,
який вказує на `gateway.cmd` у каталозі стану.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для багатокористувацьких/постійно активних хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте той самий вміст служби, що й для user unit, але встановлюйте його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і за потреби змініть
`ExecStart=`, якщо ваш бінарний файл `openclaw` розміщений в іншому місці.

  </Tab>
</Tabs>

## Кілька gateway на одному хості

У більшості конфігурацій має працювати **один** Gateway.
Використовуйте кілька лише для суворої ізоляції/надлишковості (наприклад, резервний профіль).

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

Див.: [Multiple gateways](/uk/gateway/multiple-gateways).

### Швидкий шлях для dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольовані state/config і базовий порт gateway `19001`.

## Короткий довідник з протоколу (погляд оператора)

- Першим кадром клієнта має бути `connect`.
- Gateway повертає знімок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список виявлення, а не
  згенерований дамп кожного доступного допоміжного маршруту.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Поширені події включають `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агентів мають дві стадії:

1. Негайне підтвердження accepted (`status:"accepted"`)
2. Фінальна відповідь про завершення (`status:"ok"|"error"`), з потоковими подіями `agent` між ними.

Повна документація з протоколу: [Gateway Protocol](/uk/gateway/protocol).

## Операційні перевірки

### Живучість

- Відкрийте WS і надішліть `connect`.
- Очікуйте відповідь `hello-ok` зі знімком.

### Готовність

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Відновлення після пропусків

Події не відтворюються повторно. У разі пропусків послідовності оновіть стан (`health`, `system-presence`), перш ніж продовжувати.

## Типові сигнатури збоїв

| Сигнатура                                                     | Ймовірна проблема                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Прив’язка не до loopback без дійсного шляху автентифікації gateway                 |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                     |
| `Gateway start blocked: set gateway.mode=local`               | У конфігурації встановлено remote mode або в пошкодженій конфігурації відсутній штамп local-mode |
| `unauthorized` during connect                                 | Невідповідність автентифікації між клієнтом і gateway                              |

Для повних послідовностей діагностики використовуйте [Gateway Troubleshooting](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються з помилкою, коли Gateway недоступний (без неявного fallback на direct-channel).
- Неприпустимі перші кадри або кадри не `connect` відхиляються, а з’єднання закривається.
- Коректне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

---

Пов’язане:

- [Troubleshooting](/uk/gateway/troubleshooting)
- [Background Process](/uk/gateway/background-process)
- [Configuration](/uk/gateway/configuration)
- [Health](/uk/gateway/health)
- [Doctor](/uk/gateway/doctor)
- [Authentication](/uk/gateway/authentication)
