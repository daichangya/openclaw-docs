---
read_when:
    - Ви хочете запустити Gateway на Linux-сервері або хмарному VPS
    - Вам потрібна коротка карта гідів з хостингу
    - Вам потрібні загальні рекомендації з налаштування Linux-сервера для OpenClaw
sidebarTitle: Linux Server
summary: Запуск OpenClaw на Linux-сервері або хмарному VPS — вибір провайдера, архітектура й налаштування
title: Linux-сервер
x-i18n:
    generated_at: "2026-04-05T18:21:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f2f26bbc116841a29055850ed5f491231554b90539bcbf91a6b519875d494fb
    source_path: vps.md
    workflow: 15
---

# Linux-сервер

Запускайте Gateway OpenClaw на будь-якому Linux-сервері або хмарному VPS. Ця сторінка допоможе вам
вибрати провайдера, пояснює, як працюють хмарні розгортання, і охоплює загальні
налаштування Linux, які застосовуються всюди.

## Виберіть провайдера

<CardGroup cols={2}>
  <Card title="Railway" href="/uk/install/railway">Налаштування в браузері в один клік</Card>
  <Card title="Northflank" href="/uk/install/northflank">Налаштування в браузері в один клік</Card>
  <Card title="DigitalOcean" href="/uk/install/digitalocean">Простий платний VPS</Card>
  <Card title="Oracle Cloud" href="/uk/install/oracle">Тариф Always Free ARM</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Docker на VPS Hetzner</Card>
  <Card title="GCP" href="/uk/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/uk/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/uk/install/exe-dev">VM з HTTPS-проксі</Card>
  <Card title="Raspberry Pi" href="/uk/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** також добре підходить.
Відеоінструкція від спільноти доступна за адресою
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ресурс спільноти -- може стати недоступним).

## Як працюють хмарні налаштування

- **Gateway працює на VPS** і володіє станом + workspace.
- Ви підключаєтеся з ноутбука або телефона через **Control UI** або **Tailscale/SSH**.
- Вважайте VPS джерелом істини й регулярно **створюйте резервні копії** стану + workspace.
- Безпечне значення за замовчуванням: тримайте Gateway на loopback і отримуйте доступ через SSH-тунель або Tailscale Serve.
  Якщо ви прив’язуєте його до `lan` або `tailnet`, вимагайте `gateway.auth.token` або `gateway.auth.password`.

Пов’язані сторінки: [Віддалений доступ до Gateway](/uk/gateway/remote), [Центр платформ](/uk/platforms).

## Спільний агент компанії на VPS

Запуск одного агента для команди — це допустимий варіант, коли всі користувачі перебувають у межах однієї моделі довіри, а агент використовується лише для бізнесу.

- Тримайте його в окремому runtime (VPS/VM/container + окремий користувач ОС/облікові записи).
- Не входьте в цей runtime через особисті облікові записи Apple/Google або особисті профілі браузера/менеджера паролів.
- Якщо користувачі є змагальними один до одного, розділяйте за gateway/host/користувачем ОС.

Деталі моделі безпеки: [Безпека](/uk/gateway/security).

## Використання node-ів із VPS

Ви можете тримати Gateway у хмарі й спарити **node-и** на ваших локальних пристроях
(Mac/iOS/Android/headless). Node-и надають локальні можливості screen/camera/canvas і `system.run`,
тоді як Gateway залишається в хмарі.

Документація: [Nodes](/uk/nodes), [CLI для Nodes](/cli/nodes).

## Налаштування запуску для малих VM і ARM-хостів

Якщо команди CLI здаються повільними на малопотужних VM (або ARM-хостах), увімкніть кеш компіляції модулів Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` покращує час запуску повторних команд.
- `OPENCLAW_NO_RESPAWN=1` усуває додаткові накладні витрати запуску через шлях із самоперезапуском.
- Перший запуск команди прогріває кеш; наступні запуски відбуваються швидше.
- Щодо особливостей Raspberry Pi див. [Raspberry Pi](/uk/install/raspberry-pi).

### Чеклист налаштування systemd (необов’язково)

Для VM-хостів, які використовують `systemd`, варто розглянути таке:

- Додайте env у сервіс для стабільного шляху запуску:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Явно задайте поведінку перезапуску:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Для шляхів state/cache надавайте перевагу дискам на базі SSD, щоб зменшити штрафи холодного старту через випадковий I/O.

Для стандартного шляху `openclaw onboard --install-daemon` відредагуйте користувацький unit:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Якщо ви навмисно встановили system unit, відредагуйте
`openclaw-gateway.service` через `sudo systemctl edit openclaw-gateway.service`.

Як політики `Restart=` допомагають автоматизованому відновленню:
[systemd може автоматизувати відновлення сервісів](https://www.redhat.com/en/blog/systemd-automate-recovery).
