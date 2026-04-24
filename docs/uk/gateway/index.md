---
read_when:
    - Запуск або налагодження процесу gateway
summary: Runbook для сервісу Gateway, його життєвого циклу та операцій
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-24T03:16:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

Використовуйте цю сторінку для запуску в day-1 і операцій day-2 сервісу Gateway.

<CardGroup cols={2}>
  <Card title="Глибоке усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика за симптомами з точними послідовностями команд і сигнатурами логів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Практичний посібник із налаштування + повний довідник конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка runtime snapshot і операції migrate/reload.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила `secrets apply` для target/path і поведінка auth-profile лише з ref.
  </Card>
</CardGroup>

## 5-хвилинний локальний запуск

<Steps>
  <Step title="Запустіть Gateway">

```bash
openclaw gateway --port 18789
# debug/trace дзеркалюються у stdio
openclaw gateway --port 18789 --verbose
# примусово завершує процес, що слухає вибраний порт, а потім запускає
openclaw gateway --force
```

  </Step>

  <Step title="Перевірте стан сервісу">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Базовий стан для справної роботи: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає вашим очікуванням. Використовуйте `openclaw gateway status --require-rpc`, коли вам потрібен доказ RPC із read-scope, а не лише досяжність.

  </Step>

  <Step title="Перевірте готовність channel">

```bash
openclaw channels status --probe
```

За наявності досяжного gateway ця команда виконує живі per-account probe channel і необов’язкові аудити.
Якщо gateway недосяжний, CLI повертається до зведень channel лише з конфігурації
замість живого виводу probe.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує активний шлях до файла конфігурації (визначений із типових значень profile/state або `OPENCLAW_CONFIG_PATH`, якщо його встановлено).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний snapshot конфігурації в пам’яті; успішне reload атомарно підміняє цей snapshot.
</Note>

## Модель runtime

- Один постійно запущений процес для маршрутизації, control plane і підключень channel.
- Один мультиплексований порт для:
  - WebSocket control/RPC
  - HTTP API, сумісних з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI керування та hooks
- Типовий режим bind: `loopback`.
- Автентифікація типово обов’язкова. Налаштування зі спільним секретом використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а reverse-proxy
  налаштування не для loopback можуть використовувати `gateway.auth.mode: "trusted-proxy"`.

## Endpoint-и, сумісні з OpenAI

Найцінніша сумісна поверхня OpenClaw зараз така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато pipeline для RAG і пам’яті очікують `/v1/embeddings`.
- Agent-native клієнти дедалі частіше віддають перевагу `/v1/responses`.

Примітка для планування:

- `/v1/models` є agent-first: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — це стабільний псевдонім, який завжди вказує на налаштованого типового агента.
- Використовуйте `x-openclaw-model`, коли вам потрібне перевизначення backend provider/model; інакше керування залишається за звичайним налаштуванням моделей і ембедингів вибраного агента.

Усе це працює на основному порту Gateway і використовує ту саму межу автентифікації довіреного оператора, що й решта HTTP API Gateway.

### Пріоритет порту й bind

| Налаштування | Порядок визначення                                            |
| ------------ | ------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим bind   | CLI/override → `gateway.bind` → `loopback`                    |

### Режими hot reload

| `gateway.reload.mode` | Поведінка                                 |
| --------------------- | ----------------------------------------- |
| `off`                 | Без перезавантаження конфігурації         |
| `hot`                 | Застосовувати лише безпечні для hot зміни |
| `restart`             | Перезапускати при змінах, що вимагають reload |
| `hybrid` (типово)     | Hot-apply, коли безпечно, restart — коли потрібно |

## Набір команд оператора

```bash
openclaw gateway status
openclaw gateway status --deep   # додає перевірку сервісу на рівні системи
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` призначено для додаткового виявлення сервісів (LaunchDaemons/systemd system
units/schtasks), а не для глибшої перевірки стану RPC.

## Кілька gateway (на одному хості)

У більшості встановлень має працювати один gateway на машину. Один gateway може обслуговувати кілька
агентів і channel.

Кілька gateway потрібні лише тоді, коли ви навмисно хочете ізоляцію або резервного бота.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Що очікувати:

- `gateway status --deep` може повідомити `Other gateway-like services detected (best effort)`
  і показати підказки для очищення, якщо все ще присутні застарілі встановлення launchd/systemd/schtasks.
- `gateway probe` може попередити про `multiple reachable gateways`, якщо відповідає
  більше однієї цілі.
- Якщо це навмисно, ізолюйте порти, config/state і корені workspace для кожного gateway.

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

Докладне налаштування: [/gateway/multiple-gateways](/uk/gateway/multiple-gateways).

## Віддалений доступ

Рекомендовано: Tailscale/VPN.
Резервний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Після цього підключайте клієнтів локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів із ідентифікацією
запит усе одно має відповідати цьому шляху автентифікації.
</Warning>

Див.: [Віддалений Gateway](/uk/gateway/remote), [Автентифікація](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Нагляд і життєвий цикл сервісу

Для надійності на рівні production використовуйте запуск під наглядом.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Мітки LaunchAgent — `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований profile). `openclaw doctor` перевіряє й виправляє відхилення конфігурації сервісу.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Щоб сервіс зберігався після виходу з системи, увімкніть lingering:

```bash
sudo loginctl enable-linger <user>
```

Приклад ручного user-unit, коли вам потрібен власний шлях встановлення:

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

Власний керований запуск Windows використовує Scheduled Task з назвою `OpenClaw Gateway`
(або `OpenClaw Gateway (<profile>)` для іменованих profile). Якщо створення Scheduled Task
заборонене, OpenClaw переходить на launcher у Startup-folder для поточного користувача,
який вказує на `gateway.cmd` усередині каталогу state.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для багатокористувацьких/постійно увімкнених хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте те саме тіло сервісу, що й для user unit, але встановлюйте його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і за потреби скоригуйте
`ExecStart=`, якщо ваш бінарник `openclaw` розташований в іншому місці.

  </Tab>
</Tabs>

## Швидкий шлях для dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольовані state/config і базовий порт Gateway `19001`.

## Короткий довідник за протоколом (погляд оператора)

- Першим кадром клієнта має бути `connect`.
- Gateway повертає snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список виявлення, а не
  згенерований дамп кожного викличного допоміжного маршруту.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Поширені події включають `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агентів мають два етапи:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Фінальна відповідь про завершення (`status:"ok"|"error"`), із потоковими подіями `agent` між ними.

Див. повну документацію протоколу: [Gateway Protocol](/uk/gateway/protocol).

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

### Відновлення після розривів

Події не відтворюються повторно. Якщо є розриви послідовності, оновіть стан (`health`, `system-presence`) перед продовженням.

## Поширені сигнатури збоїв

| Сигнатура                                                     | Ймовірна проблема                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind не на loopback без чинного шляху автентифікації gateway                      |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                    |
| `Gateway start blocked: set gateway.mode=local`               | У конфігурації задано remote mode або у пошкодженій конфігурації відсутній штамп local-mode |
| `unauthorized` during connect                                 | Невідповідність автентифікації між клієнтом і gateway                             |

Для повних послідовностей діагностики використовуйте [Усунення несправностей Gateway](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються з помилкою, якщо Gateway недоступний (без неявного fallback напряму до channel).
- Некоректні перші кадри або кадри не-`connect` відхиляються із закриттям з’єднання.
- Коректне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

---

Пов’язане:

- [Усунення несправностей](/uk/gateway/troubleshooting)
- [Фоновий процес](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Health](/uk/gateway/health)
- [Doctor](/uk/gateway/doctor)
- [Автентифікація](/uk/gateway/authentication)

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
- [Віддалений доступ](/uk/gateway/remote)
- [Керування секретами](/uk/gateway/secrets)
