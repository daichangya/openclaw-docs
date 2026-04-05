---
read_when:
    - Налаштування OpenClaw на Raspberry Pi
    - Запуск OpenClaw на ARM-пристроях
    - Побудова недорогого персонального AI, який працює постійно
summary: Розгортання OpenClaw на Raspberry Pi для постійного самостійного хостингу
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-05T18:08:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 222ccbfb18a8dcec483adac6f5647dcb455c84edbad057e0ba2589a6da570b4c
    source_path: install/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi

Запустіть постійний Gateway OpenClaw на Raspberry Pi. Оскільки Pi тут працює лише як gateway (моделі запускаються в хмарі через API), навіть доволі скромний Pi добре справляється з таким навантаженням.

## Передумови

- Raspberry Pi 4 або 5 з 2 GB+ RAM (рекомендовано 4 GB)
- Карта MicroSD (16 GB+) або USB SSD (краща продуктивність)
- Офіційний блок живлення для Pi
- Мережеве підключення (Ethernet або WiFi)
- 64-bit Raspberry Pi OS (обов’язково — не використовуйте 32-bit)
- Близько 30 хвилин

## Налаштування

<Steps>
  <Step title="Запишіть ОС">
    Використовуйте **Raspberry Pi OS Lite (64-bit)** — для headless-сервера робочий стіл не потрібен.

    1. Завантажте [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Виберіть ОС: **Raspberry Pi OS Lite (64-bit)**.
    3. У діалозі налаштувань попередньо задайте:
       - Ім’я хоста: `gateway-host`
       - Увімкнути SSH
       - Задати ім’я користувача та пароль
       - Налаштувати WiFi (якщо не використовуєте Ethernet)
    4. Запишіть образ на SD-карту або USB-накопичувач, вставте його та завантажте Pi.

  </Step>

  <Step title="Підключіться через SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Оновіть систему">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Встановіть Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Додайте swap (важливо для 2 GB або менше)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Встановіть OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Дотримуйтеся вказівок майстра. Для headless-пристроїв рекомендуються API key замість OAuth. Найпростіший канал для старту — Telegram.

  </Step>

  <Step title="Перевірте">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Отримайте доступ до Control UI">
    На своєму комп’ютері отримайте URL dashboard з Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Потім створіть SSH tunnel в іншому терміналі:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Відкрийте надрукований URL у локальному браузері. Для постійного віддаленого доступу див. [Інтеграція Tailscale](/gateway/tailscale).

  </Step>
</Steps>

## Поради щодо продуктивності

**Використовуйте USB SSD** — SD-карти повільні й швидше зношуються. USB SSD значно покращує продуктивність. Див. [посібник із завантаження Pi через USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Увімкніть cache компіляції модулів** — пришвидшує повторні виклики CLI на менш потужних хостах Pi:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Зменште використання пам’яті** — для headless-налаштувань звільніть пам’ять GPU і вимкніть непотрібні services:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Усунення несправностей

**Недостатньо пам’яті** — перевірте, що swap активний, за допомогою `free -h`. Вимкніть непотрібні services (`sudo systemctl disable cups bluetooth avahi-daemon`). Використовуйте лише моделі на основі API.

**Низька продуктивність** — використовуйте USB SSD замість SD-карти. Перевірте, чи немає throttling CPU, командою `vcgencmd get_throttled` (має повертати `0x0`).

**Service не запускається** — перевірте логи командою `journalctl --user -u openclaw-gateway.service --no-pager -n 100` і виконайте `openclaw doctor --non-interactive`. Якщо це headless Pi, також перевірте, що ввімкнено lingering: `sudo loginctl enable-linger "$(whoami)"`.

**Проблеми з ARM-бінарними файлами** — якщо skill завершується з помилкою "exec format error", перевірте, чи має цей бінарний файл збірку для ARM64. Перевірте архітектуру командою `uname -m` (має показувати `aarch64`).

**Обривається WiFi** — вимкніть керування живленням WiFi: `sudo iwconfig wlan0 power off`.

## Наступні кроки

- [Channels](/channels) -- підключіть Telegram, WhatsApp, Discord тощо
- [Конфігурація Gateway](/gateway/configuration) -- усі параметри конфігурації
- [Оновлення](/install/updating) -- підтримуйте OpenClaw в актуальному стані
