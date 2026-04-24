---
read_when:
    - Налаштування OpenClaw на DigitalOcean
    - Шукаєте простий платний VPS для OpenClaw
summary: Розмістіть OpenClaw на DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T03:18:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

Запустіть постійний Gateway OpenClaw на DigitalOcean Droplet.

## Передумови

- обліковий запис DigitalOcean ([реєстрація](https://cloud.digitalocean.com/registrations/new))
- пара SSH-ключів (або готовність використовувати автентифікацію паролем)
- приблизно 20 хвилин

## Налаштування

<Steps>
  <Step title="Створіть Droplet">
    <Warning>
    Використовуйте чистий базовий образ (Ubuntu 24.04 LTS). Уникайте сторонніх Marketplace 1-click образів, якщо ви не перевірили їхні стартові скрипти та типові налаштування брандмауера.
    </Warning>

    1. Увійдіть у [DigitalOcean](https://cloud.digitalocean.com/).
    2. Натисніть **Create > Droplets**.
    3. Виберіть:
       - **Region:** найближчий до вас
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH key (рекомендовано) або password
    4. Натисніть **Create Droplet** і запишіть IP-адресу.

  </Step>

  <Step title="Підключіться та встановіть">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Майстер проведе вас через автентифікацію моделі, налаштування каналу, генерацію токена gateway та встановлення демона (systemd).

  </Step>

  <Step title="Додайте swap (рекомендовано для Droplet з 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Перевірте gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Отримайте доступ до Control UI">
    Gateway типово прив’язується до loopback. Виберіть один із цих варіантів.

    **Варіант A: SSH-тунель (найпростіше)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Потім відкрийте `http://localhost:18789`.

    **Варіант B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Потім відкрийте `https://<magicdns>/` з будь-якого пристрою у вашому tailnet.

    **Варіант C: прив’язка tailnet (без Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Потім відкрийте `http://<tailscale-ip>:18789` (потрібен token).

  </Step>
</Steps>

## Усунення несправностей

**Gateway не запускається** -- Запустіть `openclaw doctor --non-interactive` і перевірте журнали через `journalctl --user -u openclaw-gateway.service -n 50`.

**Порт уже використовується** -- Запустіть `lsof -i :18789`, щоб знайти процес, а потім зупиніть його.

**Недостатньо пам’яті** -- Переконайтеся, що swap активний, за допомогою `free -h`. Якщо OOM все одно трапляється, використовуйте моделі на основі API (Claude, GPT) замість локальних моделей або перейдіть на Droplet з 2 GB.

## Наступні кроки

- [Канали](/uk/channels) -- підключіть Telegram, WhatsApp, Discord тощо
- [Конфігурація Gateway](/uk/gateway/configuration) -- усі параметри конфігурації
- [Оновлення](/uk/install/updating) -- підтримуйте OpenClaw в актуальному стані

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Fly.io](/uk/install/fly)
- [Hetzner](/uk/install/hetzner)
- [Хостинг VPS](/uk/vps)
