---
read_when:
    - Налаштування OpenClaw на Raspberry Pi
    - Запуск OpenClaw на ARM-пристроях
    - Побудова недорогого персонального ШІ, який працює постійно
summary: Розмістіть OpenClaw на Raspberry Pi для постійного самостійного хостингу
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-24T03:19:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

Запустіть постійний, завжди ввімкнений Gateway OpenClaw на Raspberry Pi. Оскільки Pi тут виконує лише роль gateway (моделі працюють у хмарі через API), навіть помірно потужний Pi добре справляється з навантаженням.

## Передумови

- Raspberry Pi 4 або 5 з 2 GB+ RAM (рекомендовано 4 GB)
- Карта MicroSD (16 GB+) або USB SSD (краща продуктивність)
- Офіційний блок живлення Pi
- Підключення до мережі (Ethernet або WiFi)
- 64-bit Raspberry Pi OS (обов’язково — не використовуйте 32-bit)
- Приблизно 30 хвилин

## Налаштування

<Steps>
  <Step title="Прошийте ОС">
    Використовуйте **Raspberry Pi OS Lite (64-bit)** — робочий стіл для безголового сервера не потрібен.

    1. Завантажте [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Виберіть ОС: **Raspberry Pi OS Lite (64-bit)**.
    3. У діалоговому вікні налаштувань попередньо налаштуйте:
       - Ім’я хоста: `gateway-host`
       - Увімкніть SSH
       - Установіть ім’я користувача та пароль
       - Налаштуйте WiFi (якщо не використовуєте Ethernet)
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

  <Step title="Установіть Node.js 24">
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

  <Step title="Установіть OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --install-daemon
    ```

    Дотримуйтесь вказівок майстра. Для безголових пристроїв рекомендовано API-ключі замість OAuth. Telegram — найпростіший канал для початку.

  </Step>

  <Step title="Перевірте">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Отримайте доступ до інтерфейсу керування">
    На своєму комп’ютері отримайте URL панелі з Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Потім створіть SSH-тунель в іншому терміналі:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Відкрийте надрукований URL у своєму локальному браузері. Для постійного віддаленого доступу див. [інтеграцію Tailscale](/uk/gateway/tailscale).

  </Step>
</Steps>

## Поради щодо продуктивності

**Використовуйте USB SSD** — SD-карти повільні та зношуються. USB SSD суттєво підвищує продуктивність. Див. [посібник із USB-завантаження Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Увімкніть кеш компіляції модулів** — пришвидшує повторні виклики CLI на менш потужних хостах Pi:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Зменште використання пам’яті** — для безголових налаштувань звільніть пам’ять GPU і вимкніть невикористовувані служби:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Усунення проблем

**Недостатньо пам’яті** — перевірте, чи активний swap, за допомогою `free -h`. Вимкніть невикористовувані служби (`sudo systemctl disable cups bluetooth avahi-daemon`). Використовуйте лише моделі на основі API.

**Низька продуктивність** — використовуйте USB SSD замість SD-карти. Перевірте тротлінг CPU за допомогою `vcgencmd get_throttled` (має повертати `0x0`).

**Служба не запускається** — перевірте журнали через `journalctl --user -u openclaw-gateway.service --no-pager -n 100` і виконайте `openclaw doctor --non-interactive`. Якщо це безголовий Pi, також перевірте, що lingering увімкнено: `sudo loginctl enable-linger "$(whoami)"`.

**Проблеми з ARM-бінарними файлами** — якщо skill завершується з помилкою "exec format error", перевірте, чи має бінарний файл збірку для ARM64. Перевірте архітектуру через `uname -m` (має показувати `aarch64`).

**WiFi розривається** — вимкніть керування живленням WiFi: `sudo iwconfig wlan0 power off`.

## Наступні кроки

- [Канали](/uk/channels) — підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Оновлення](/uk/install/updating) — підтримуйте OpenClaw в актуальному стані

## Пов’язано

- [Огляд встановлення](/uk/install)
- [Linux-сервер](/uk/vps)
- [Платформи](/uk/platforms)
