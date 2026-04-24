---
read_when:
    - Налаштування OpenClaw на DigitalOcean
    - Шукаєте недорогий VPS-хостинг для OpenClaw
summary: OpenClaw на DigitalOcean (простий платний варіант VPS)
title: DigitalOcean (платформа)
x-i18n:
    generated_at: "2026-04-24T03:47:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw на DigitalOcean

## Мета

Запустити постійний Gateway OpenClaw на DigitalOcean за **$6/місяць** (або $4/міс. за резервованою ціною).

Якщо вам потрібен варіант за $0/місяць і ви не проти ARM + специфічного для провайдера налаштування, див. [посібник з Oracle Cloud](/uk/install/oracle).

## Порівняння вартості (2026)

| Провайдер    | План            | Характеристики          | Ціна/міс.   | Примітки                              |
| ------------ | --------------- | ----------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | до 4 OCPU, 24GB RAM     | $0          | ARM, обмежена місткість / нюанси реєстрації |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM         | €3.79 (~$4) | Найдешевший платний варіант           |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM         | $6          | Простий UI, хороша документація       |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM         | $6          | Багато локацій                        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM         | $5          | Тепер частина Akamai                  |

**Вибір провайдера:**

- DigitalOcean: найпростіший UX + передбачуване налаштування (цей посібник)
- Hetzner: хороше співвідношення ціни та продуктивності (див. [посібник з Hetzner](/uk/install/hetzner))
- Oracle Cloud: може коштувати $0/місяць, але вибагливіший і лише на ARM (див. [посібник з Oracle](/uk/install/oracle))

---

## Передумови

- Обліковий запис DigitalOcean ([реєстрація з безкоштовним кредитом $200](https://m.do.co/c/signup))
- Пара SSH-ключів (або готовність використовувати автентифікацію паролем)
- ~20 хвилин

## 1) Створіть Droplet

<Warning>
Використовуйте чистий базовий образ (Ubuntu 24.04 LTS). Уникайте сторонніх Marketplace-образів із встановленням в 1 клік, якщо ви не перевірили їхні startup scripts і стандартні параметри firewall.
</Warning>

1. Увійдіть у [DigitalOcean](https://cloud.digitalocean.com/)
2. Натисніть **Create → Droplets**
3. Виберіть:
   - **Region:** найближчий до вас (або ваших користувачів)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/міс.** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH key (рекомендовано) або пароль
4. Натисніть **Create Droplet**
5. Запишіть IP-адресу

## 2) Підключіться через SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Установіть OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Запустіть початкове налаштування

```bash
openclaw onboard --install-daemon
```

Майстер проведе вас через:

- Автентифікацію моделі (API-ключі або OAuth)
- Налаштування channel (Telegram, WhatsApp, Discord тощо)
- Gateway token (генерується автоматично)
- Установлення демона (systemd)

## 5) Перевірте Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Отримайте доступ до Dashboard

Gateway за замовчуванням прив’язується до loopback. Щоб отримати доступ до Control UI:

**Варіант A: SSH-тунель (рекомендовано)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Варіант B: Tailscale Serve (HTTPS, лише loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Відкрийте: `https://<magicdns>/`

Примітки:

- Serve зберігає Gateway доступним лише через loopback і автентифікує трафік Control UI/WebSocket через заголовки identity Tailscale (автентифікація без токена передбачає довірений хост gateway; HTTP API не використовують ці заголовки Tailscale, а натомість дотримуються звичайного режиму HTTP-автентифікації gateway).
- Щоб натомість вимагати явні облікові дані зі спільним секретом, установіть `gateway.auth.allowTailscale: false` і використовуйте `gateway.auth.mode: "token"` або `"password"`.

**Варіант C: Tailnet bind (без Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Відкрийте: `http://<tailscale-ip>:18789` (потрібен токен).

## 7) Підключіть свої channels

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Див. [Channels](/uk/channels) для інших провайдерів.

---

## Оптимізації для 1GB RAM

Droplet за $6 має лише 1GB RAM. Щоб усе працювало стабільно:

### Додайте swap (рекомендовано)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Використовуйте легшу модель

Якщо ви стикаєтеся з OOM, розгляньте такі варіанти:

- Використовуйте моделі на основі API (Claude, GPT) замість локальних моделей
- Установіть `agents.defaults.model.primary` на меншу модель

### Моніторинг пам’яті

```bash
free -h
htop
```

---

## Збереження стану

Увесь стан зберігається в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для кожного агента, стан channel/provider і дані сесій
- `~/.openclaw/workspace/` — workspace (SOUL.md, memory тощо)

Ці дані переживають перезавантаження. Регулярно створюйте резервні копії:

```bash
openclaw backup create
```

---

## Безкоштовна альтернатива: Oracle Cloud

Oracle Cloud пропонує інстанси **Always Free** на ARM, які значно потужніші за будь-який платний варіант тут — за $0/місяць.

| Що ви отримуєте   | Характеристики         |
| ----------------- | ---------------------- |
| **4 OCPU**        | ARM Ampere A1          |
| **24GB RAM**      | Більш ніж достатньо    |
| **200GB storage** | Block volume           |
| **Безкоштовно назавжди** | Без списань із банківської картки |

**Застереження:**

- Реєстрація може бути вибагливою (спробуйте ще раз, якщо не вийде)
- Архітектура ARM — більшість речей працює, але для деяких бінарних файлів потрібні ARM-збірки

Повний посібник з налаштування див. в [Oracle Cloud](/uk/install/oracle). Поради щодо реєстрації та усунення проблем із процесом підключення див. в цьому [посібнику спільноти](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Усунення несправностей

### Gateway не запускається

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Порт уже використовується

```bash
lsof -i :18789
kill <PID>
```

### Недостатньо пам’яті

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Пов’язане

- [Посібник з Hetzner](/uk/install/hetzner) — дешевше, потужніше
- [Установлення через Docker](/uk/install/docker) — контейнеризоване налаштування
- [Tailscale](/uk/gateway/tailscale) — безпечний віддалений доступ
- [Конфігурація](/uk/gateway/configuration) — повний довідник із конфігурації
