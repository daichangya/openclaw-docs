---
read_when:
    - Налаштування OpenClaw на DigitalOcean
    - Пошук дешевого VPS-хостингу для OpenClaw
summary: OpenClaw на DigitalOcean (простий платний варіант VPS)
title: DigitalOcean (платформа)
x-i18n:
    generated_at: "2026-04-05T18:09:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw на DigitalOcean

## Мета

Запустити постійний Gateway OpenClaw на DigitalOcean за **$6/місяць** (або $4/міс із reserved pricing).

Якщо вам потрібен варіант за $0/місяць і ви не проти ARM + налаштування, специфічного для провайдера, див. [посібник з Oracle Cloud](/platforms/oracle).

## Порівняння вартості (2026)

| Провайдер    | План             | Характеристики         | Ціна/міс     | Примітки                              |
| ------------ | ---------------- | ---------------------- | ------------ | ------------------------------------- |
| Oracle Cloud | Always Free ARM  | до 4 OCPU, 24 ГБ RAM   | $0           | ARM, обмежена місткість / особливості реєстрації |
| Hetzner      | CX22             | 2 vCPU, 4 ГБ RAM       | €3.79 (~$4)  | Найдешевший платний варіант           |
| DigitalOcean | Basic            | 1 vCPU, 1 ГБ RAM       | $6           | Простий UI, хороша документація       |
| Vultr        | Cloud Compute    | 1 vCPU, 1 ГБ RAM       | $6           | Багато локацій                        |
| Linode       | Nanode           | 1 vCPU, 1 ГБ RAM       | $5           | Тепер частина Akamai                  |

**Вибір провайдера:**

- DigitalOcean: найпростіший UX + передбачуване налаштування (цей посібник)
- Hetzner: хороше співвідношення ціни й продуктивності (див. [посібник Hetzner](/install/hetzner))
- Oracle Cloud: може коштувати $0/місяць, але він вибагливіший і лише ARM (див. [посібник Oracle](/platforms/oracle))

---

## Передумови

- Обліковий запис DigitalOcean ([реєстрація з безкоштовним кредитом $200](https://m.do.co/c/signup))
- Пара SSH-ключів (або готовність використовувати автентифікацію за паролем)
- ~20 хвилин

## 1) Створіть Droplet

<Warning>
Використовуйте чистий базовий образ (Ubuntu 24.04 LTS). Уникайте сторонніх Marketplace 1-click image, якщо ви не перевірили їхні startup scripts і типові налаштування firewall.
</Warning>

1. Увійдіть у [DigitalOcean](https://cloud.digitalocean.com/)
2. Натисніть **Create → Droplets**
3. Виберіть:
   - **Region:** найближчий до вас (або ваших користувачів)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/міс** (1 vCPU, 1 ГБ RAM, 25 ГБ SSD)
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

## 4) Запустіть onboarding

```bash
openclaw onboard --install-daemon
```

Майстер проведе вас через:

- автентифікацію моделі (API-ключі або OAuth)
- налаштування каналу (Telegram, WhatsApp, Discord тощо)
- token для gateway (генерується автоматично)
- встановлення демона (systemd)

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

За замовчуванням gateway прив’язується до loopback. Щоб отримати доступ до Control UI:

**Варіант A: SSH Tunnel (рекомендовано)**

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

- Serve зберігає Gateway доступним лише через loopback і автентифікує трафік Control UI/WebSocket через заголовки ідентичності Tailscale (auth без token передбачає довірений gateway host; HTTP API не використовують ці заголовки Tailscale, а натомість дотримуються звичайного режиму HTTP auth gateway).
- Щоб натомість вимагати явні облікові дані через shared secret, установіть `gateway.auth.allowTailscale: false` і використовуйте `gateway.auth.mode: "token"` або `"password"`.

**Варіант C: bind у tailnet (без Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Відкрийте: `http://<tailscale-ip>:18789` (потрібен token).

## 7) Підключіть свої канали

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

Інші провайдери див. у [Каналах](/channels).

---

## Оптимізації для 1 ГБ RAM

Droplet за $6 має лише 1 ГБ RAM. Щоб усе працювало плавно:

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

- Використовуйте моделі на базі API (Claude, GPT) замість локальних моделей
- Установіть `agents.defaults.model.primary` на меншу модель

### Відстежуйте пам’ять

```bash
free -h
htop
```

---

## Постійне зберігання

Увесь стан зберігається тут:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для кожного агента, стан каналів/провайдерів і дані сесій
- `~/.openclaw/workspace/` — workspace (SOUL.md, пам’ять тощо)

Ці дані зберігаються після перезавантаження. Робіть їх резервні копії періодично:

```bash
openclaw backup create
```

---

## Безкоштовна альтернатива Oracle Cloud

Oracle Cloud пропонує екземпляри **Always Free** на ARM, які значно потужніші за будь-який платний варіант тут — за $0/місяць.

| Що ви отримуєте   | Характеристики         |
| ----------------- | ---------------------- |
| **4 OCPU**        | ARM Ampere A1          |
| **24 ГБ RAM**     | Більш ніж достатньо    |
| **200 ГБ storage** | Block volume          |
| **Безкоштовно назавжди** | Без списань із кредитної картки |

**Застереження:**

- Реєстрація може бути вибагливою (спробуйте ще раз, якщо не вдається)
- Архітектура ARM — більшість речей працює, але деяким бінарним файлам потрібні ARM-збірки

Повний посібник див. у [Oracle Cloud](/platforms/oracle). Поради щодо реєстрації та усунення проблем під час процесу оформлення див. в цьому [посібнику спільноти](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

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

## Див. також

- [Посібник Hetzner](/install/hetzner) — дешевше й потужніше
- [Установлення Docker](/install/docker) — контейнеризоване налаштування
- [Tailscale](/gateway/tailscale) — безпечний віддалений доступ
- [Конфігурація](/gateway/configuration) — повний довідник конфігурації
