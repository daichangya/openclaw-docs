---
read_when:
    - Ви хочете запустити Gateway на Linux-сервері або хмарному VPS
    - Вам потрібна швидка карта посібників з хостингу
    - Вам потрібне загальне налаштування Linux-сервера для OpenClaw
sidebarTitle: Linux Server
summary: Запуск OpenClaw на Linux-сервері або хмарному VPS — вибір provider, архітектура й налаштування продуктивності
title: Linux-сервер
x-i18n:
    generated_at: "2026-04-24T04:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

Запускайте Gateway OpenClaw на будь-якому Linux-сервері або хмарному VPS. Ця сторінка допоможе вам
вибрати provider, пояснює, як працюють хмарні розгортання, і охоплює загальне налаштування Linux,
яке застосовується всюди.

## Виберіть provider

<CardGroup cols={2}>
  <Card title="Railway" href="/uk/install/railway">Налаштування в браузері в один клік</Card>
  <Card title="Northflank" href="/uk/install/northflank">Налаштування в браузері в один клік</Card>
  <Card title="DigitalOcean" href="/uk/install/digitalocean">Простий платний VPS</Card>
  <Card title="Oracle Cloud" href="/uk/install/oracle">Always Free ARM tier</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Docker на Hetzner VPS</Card>
  <Card title="Hostinger" href="/uk/install/hostinger">VPS з налаштуванням в один клік</Card>
  <Card title="GCP" href="/uk/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/uk/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/uk/install/exe-dev">VM з HTTPS-проксі</Card>
  <Card title="Raspberry Pi" href="/uk/install/raspberry-pi">ARM-самохостинг</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** також добре підходить.
Є відеоінструкція від спільноти:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ресурс спільноти — може стати недоступним).

## Як працюють хмарні розгортання

- **Gateway працює на VPS** і володіє станом + workspace.
- Ви підключаєтеся з ноутбука або телефона через **Control UI** або **Tailscale/SSH**.
- Вважайте VPS джерелом істини й **регулярно створюйте резервні копії** стану + workspace.
- Безпечний варіант за замовчуванням: тримайте Gateway на loopback і отримуйте доступ до нього через SSH tunnel або Tailscale Serve.
  Якщо ви прив’язуєте його до `lan` або `tailnet`, вимагайте `gateway.auth.token` або `gateway.auth.password`.

Пов’язані сторінки: [Віддалений доступ до Gateway](/uk/gateway/remote), [Центр платформ](/uk/platforms).

## Спільний агент компанії на VPS

Запуск одного агента для команди — це допустимий варіант, коли кожен користувач перебуває в межах одного trust boundary, а агент використовується лише для бізнесу.

- Тримайте його в окремому runtime (VPS/VM/container + окремий користувач ОС/акаунти).
- Не входьте в цьому runtime до особистих акаунтів Apple/Google або особистих профілів браузера/менеджера паролів.
- Якщо користувачі є взаємно недовіреними, розділіть їх за gateway/host/користувачем ОС.

Подробиці моделі безпеки: [Безпека](/uk/gateway/security).

## Використання Node із VPS

Ви можете тримати Gateway у хмарі й під’єднати **Node** на своїх локальних пристроях
(Mac/iOS/Android/headless). Node надають локальні можливості екрана/камери/canvas і `system.run`,
тоді як Gateway залишається в хмарі.

Документація: [Node](/uk/nodes), [CLI Node](/uk/cli/nodes).

## Налаштування запуску для малих VM і ARM-хостів

Якщо команди CLI здаються повільними на малопотужних VM (або ARM-хостах), увімкніть cache компіляції модулів Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` покращує час запуску повторних команд.
- `OPENCLAW_NO_RESPAWN=1` уникає додаткових накладних витрат на запуск через шлях самоперезапуску.
- Перший запуск команди прогріває cache; наступні запуски швидші.
- Особливості для Raspberry Pi дивіться в [Raspberry Pi](/uk/install/raspberry-pi).

### Чекліст налаштування systemd (необов’язково)

Для VM-хостів із `systemd` зверніть увагу на таке:

- Додайте env сервісу для стабільного шляху запуску:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Явно задайте поведінку перезапуску:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Надавайте перевагу дискам на SSD для шляхів state/cache, щоб зменшити cold-start penalties через випадковий I/O.

Для стандартного шляху `openclaw onboard --install-daemon` відредагуйте user unit:

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

Якщо ви навмисно встановили system unit, натомість редагуйте
`openclaw-gateway.service` через `sudo systemctl edit openclaw-gateway.service`.

Як політики `Restart=` допомагають автоматизованому відновленню:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Про поведінку Linux під час OOM, вибір дочірнього процесу як жертви та діагностику
`exit 137` див. [Тиск пам’яті Linux і OOM kills](/uk/platforms/linux#memory-pressure-and-oom-kills).

## Пов’язане

- [Огляд встановлення](/uk/install)
- [DigitalOcean](/uk/install/digitalocean)
- [Fly.io](/uk/install/fly)
- [Hetzner](/uk/install/hetzner)
