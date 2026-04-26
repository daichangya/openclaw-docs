---
read_when:
    - Запуск або налагодження процесу gateway
summary: Runbook для сервісу Gateway, життєвого циклу та операцій
title: runbook Gateway
x-i18n:
    generated_at: "2026-04-26T04:24:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

Використовуйте цю сторінку для запуску в перший день і операцій другого дня для сервісу Gateway.

<CardGroup cols={2}>
  <Card title="Поглиблене усунення несправностей" icon="siren" href="/uk/gateway/troubleshooting">
    Діагностика, орієнтована на симптоми, з точними послідовностями команд і сигнатурами логів.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Практичний посібник із налаштування + повний довідник з конфігурації.
  </Card>
  <Card title="Керування секретами" icon="key-round" href="/uk/gateway/secrets">
    Контракт SecretRef, поведінка знімка стану під час виконання та операції міграції/перезавантаження.
  </Card>
  <Card title="Контракт плану секретів" icon="shield-check" href="/uk/gateway/secrets-plan-contract">
    Точні правила цілі/шляху для `secrets apply` і поведінка auth-profile лише з ref.
  </Card>
</CardGroup>

## 5-хвилинний локальний запуск

<Steps>
  <Step title="Запустіть Gateway">

```bash
openclaw gateway --port 18789
# debug/trace віддзеркалюється у stdio
openclaw gateway --port 18789 --verbose
# примусово завершує прослуховувач на вибраному порту, потім запускає
openclaw gateway --force
```

  </Step>

  <Step title="Перевірте стан сервісу">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Базова ознака справного стану: `Runtime: running`, `Connectivity probe: ok` і `Capability: ...`, що відповідає вашим очікуванням. Використовуйте `openclaw gateway status --require-rpc`, коли вам потрібне підтвердження RPC із доступом на читання, а не лише досяжність.

  </Step>

  <Step title="Перевірте готовність каналу">

```bash
openclaw channels status --probe
```

За наявності доступного gateway ця команда виконує живі перевірки каналів для кожного облікового запису та необов’язкові аудити.
Якщо gateway недоступний, CLI повертається до зведень каналів лише за конфігурацією
замість виводу живих перевірок.

  </Step>
</Steps>

<Note>
Перезавантаження конфігурації Gateway відстежує шлях до активного файлу конфігурації (визначений із типових значень profile/state або через `OPENCLAW_CONFIG_PATH`, якщо встановлено).
Типовий режим — `gateway.reload.mode="hybrid"`.
Після першого успішного завантаження запущений процес обслуговує активний знімок конфігурації в пам’яті; успішне перезавантаження атомарно замінює цей знімок.
</Note>

## Модель виконання

- Один постійно запущений процес для маршрутизації, площини керування та з’єднань каналів.
- Один мультиплексований порт для:
  - керування/RPC через WebSocket
  - HTTP API, сумісних з OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI керування та хуків
- Типовий режим прив’язки: `loopback`.
- Автентифікація типово обов’язкова. Налаштування зі спільним секретом використовують
  `gateway.auth.token` / `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), а конфігурації
  з non-loopback reverse proxy можуть використовувати `gateway.auth.mode: "trusted-proxy"`.

## Сумісні з OpenAI кінцеві точки

Найцінніша поверхня сумісності OpenClaw тепер така:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Чому цей набір важливий:

- Більшість інтеграцій Open WebUI, LobeChat і LibreChat спочатку перевіряють `/v1/models`.
- Багато конвеєрів RAG і пам’яті очікують `/v1/embeddings`.
- Клієнти, орієнтовані на агентів, дедалі частіше віддають перевагу `/v1/responses`.

Примітка для планування:

- `/v1/models` орієнтований на агентів: він повертає `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
- `openclaw/default` — це стабільний псевдонім, який завжди вказує на налаштованого типового агента.
- Використовуйте `x-openclaw-model`, якщо вам потрібно перевизначити бекенд-провайдера/модель; інакше нормальна конфігурація моделі та embeddings вибраного агента залишатиметься керівною.

Усе це працює на основному порту Gateway і використовує ту саму межу автентифікації довіреного оператора, що й решта HTTP API Gateway.

### Пріоритет порту та прив’язки

| Налаштування | Порядок визначення                                             |
| ------------ | -------------------------------------------------------------- |
| Порт Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Режим bind   | CLI/override → `gateway.bind` → `loopback`                    |

Під час запуску Gateway використовує ті самі фактичні порт і прив’язку, коли додає локальні
джерела походження Control UI для non-loopback прив’язок. Наприклад, `--bind lan --port 3000`
додає `http://localhost:3000` і `http://127.0.0.1:3000` до виконання
перевірки під час виконання. Будь-які віддалені джерела браузера, наприклад HTTPS URL проксі, слід явно
додати до `gateway.controlUi.allowedOrigins`.

### Режими hot reload

| `gateway.reload.mode` | Поведінка                                 |
| --------------------- | ----------------------------------------- |
| `off`                 | Без перезавантаження конфігурації         |
| `hot`                 | Застосовувати лише безпечні hot-зміни     |
| `restart`             | Перезапуск при змінах, що вимагають reload |
| `hybrid` (типово)     | Hot-застосування, коли безпечно, перезапуск — коли потрібно |

## Набір команд оператора

```bash
openclaw gateway status
openclaw gateway status --deep   # додає сканування сервісу на рівні системи
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

## Кілька gateway (той самий хост)

У більшості встановлень має працювати один gateway на машину. Один gateway може обслуговувати кількох
агентів і каналів.

Кілька gateway потрібні лише тоді, коли ви навмисно хочете ізоляцію або резервного бота.

Корисні перевірки:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Чого очікувати:

- `gateway status --deep` може повідомляти `Other gateway-like services detected (best effort)`
  і виводити підказки з очищення, якщо ще залишилися застарілі встановлення launchd/systemd/schtasks.
- `gateway probe` може попереджати про `multiple reachable gateways`, коли відповідає
  більше ніж одна ціль.
- Якщо це навмисно, ізолюйте порти, config/state і корені робочих просторів для кожного gateway.

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

## Кінцева точка мозку реального часу VoiceClaw

OpenClaw надає сумісну з VoiceClaw кінцеву точку WebSocket реального часу за адресою
`/voiceclaw/realtime`. Використовуйте її, коли клієнт VoiceClaw для комп’ютера має
напряму взаємодіяти з мозком OpenClaw у реальному часі замість використання окремого релейного
процесу.

Кінцева точка використовує Gemini Live для аудіо в реальному часі та викликає OpenClaw як
мозок, безпосередньо надаючи інструменти OpenClaw для Gemini Live. Виклики інструментів повертають
негайний результат `working`, щоб голосовий хід залишався чутливим, після чого OpenClaw
виконує фактичний інструмент асинхронно та повертає результат назад до
живої сесії. Установіть `GEMINI_API_KEY` у середовищі процесу gateway. Якщо
автентифікацію gateway увімкнено, клієнт для комп’ютера надсилає токен або пароль gateway
у своєму першому повідомленні `session.config`.

Доступ до мозку реального часу виконує авторизовані власником команди агента OpenClaw. Обмежуйте
`gateway.auth.mode: "none"` лише тестовими екземплярами, доступними тільки через loopback. Для нелокальних
з’єднань із мозком реального часу потрібна автентифікація gateway.

Для ізольованого тестового gateway запустіть окремий екземпляр із власними портом, конфігурацією
та станом:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Потім налаштуйте VoiceClaw на використання:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Віддалений доступ

Рекомендовано: Tailscale/VPN.
Резервний варіант: SSH-тунель.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Після цього підключайте клієнти локально до `ws://127.0.0.1:18789`.

<Warning>
SSH-тунелі не обходять автентифікацію gateway. Для автентифікації зі спільним секретом клієнти все одно
мають надсилати `token`/`password` навіть через тунель. Для режимів з ідентифікацією
запит усе одно має задовольняти цей шлях автентифікації.
</Warning>

Див.: [Remote Gateway](/uk/gateway/remote), [Authentication](/uk/gateway/authentication), [Tailscale](/uk/gateway/tailscale).

## Супервізія та життєвий цикл сервісу

Для надійності, наближеної до production, використовуйте запуски під супервізією.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Для перезапусків використовуйте `openclaw gateway restart`. Не поєднуйте `openclaw gateway stop` і `openclaw gateway start`; у macOS `gateway stop` навмисно вимикає LaunchAgent перед його зупинкою.

Мітки LaunchAgent: `ai.openclaw.gateway` (типово) або `ai.openclaw.<profile>` (іменований profile). `openclaw doctor` перевіряє та виправляє дрейф конфігурації сервісу.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Щоб зберігати роботу після виходу з системи, увімкніть lingering:

```bash
sudo loginctl enable-linger <user>
```

Приклад ручного user-unit, якщо вам потрібен власний шлях встановлення:

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

Керований нативний автозапуск у Windows використовує заплановане завдання `OpenClaw Gateway`
(або `OpenClaw Gateway (<profile>)` для іменованих profile). Якщо створення Scheduled Task
заборонено, OpenClaw переходить до запуску через launcher у Startup-folder для поточного користувача,
який вказує на `gateway.cmd` у каталозі стану.

  </Tab>

  <Tab title="Linux (system service)">

Використовуйте system unit для багатокористувацьких/постійно активних хостів.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Використовуйте те саме тіло сервісу, що й для user unit, але встановлюйте його в
`/etc/systemd/system/openclaw-gateway[-<profile>].service` і за потреби скоригуйте
`ExecStart=`, якщо ваш бінарний файл `openclaw` розташований в іншому місці.

  </Tab>
</Tabs>

## Швидкий шлях для dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Типові значення включають ізольований state/config і базовий порт gateway `19001`.

## Короткий довідник з протоколу (погляд оператора)

- Першим кадром клієнта має бути `connect`.
- Gateway повертає знімок `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` — це консервативний список виявлення, а не
  згенерований дамп усіх викличних допоміжних маршрутів.
- Запити: `req(method, params)` → `res(ok/payload|error)`.
- Поширені події включають `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, події життєвого циклу pairing/approval і `shutdown`.

Запуски агентів мають двоетапну модель:

1. Негайне підтвердження прийняття (`status:"accepted"`)
2. Фінальна відповідь про завершення (`status:"ok"|"error"`), із потоковими подіями `agent` між ними.

Повна документація протоколу: [Gateway Protocol](/uk/gateway/protocol).

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

### Відновлення після прогалин

Події не відтворюються повторно. Якщо є прогалини в послідовності, оновіть стан (`health`, `system-presence`) перед продовженням.

## Поширені сигнатури збоїв

| Сигнатура                                                      | Ймовірна проблема                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Non-loopback прив’язка без чинного шляху автентифікації gateway                  |
| `another gateway instance is already listening` / `EADDRINUSE` | Конфлікт порту                                                                    |
| `Gateway start blocked: set gateway.mode=local`                | У конфігурації встановлено віддалений режим, або в пошкодженій конфігурації відсутній штамп локального режиму |
| `unauthorized` during connect                                  | Невідповідність автентифікації між клієнтом і gateway                            |

Для повних послідовностей діагностики використовуйте [Gateway Troubleshooting](/uk/gateway/troubleshooting).

## Гарантії безпеки

- Клієнти протоколу Gateway швидко завершуються з помилкою, коли Gateway недоступний (без неявного fallback напряму до каналу).
- Неприпустимі/не `connect` перші кадри відхиляються, а з’єднання закривається.
- Коректне завершення роботи надсилає подію `shutdown` перед закриттям сокета.

---

Пов’язане:

- [Усунення несправностей](/uk/gateway/troubleshooting)
- [Фоновий процес](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Стан](/uk/gateway/health)
- [Doctor](/uk/gateway/doctor)
- [Автентифікація](/uk/gateway/authentication)

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
- [Віддалений доступ](/uk/gateway/remote)
- [Керування секретами](/uk/gateway/secrets)
