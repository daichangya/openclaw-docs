---
read_when:
    - Налаштування OpenClaw на Raspberry Pi
    - Запуск OpenClaw на ARM-пристроях
    - Побудова недорогої персональної AI-системи, що працює постійно
summary: OpenClaw на Raspberry Pi (бюджетне самостійне розгортання)
title: Raspberry Pi (платформа)
x-i18n:
    generated_at: "2026-04-24T03:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw на Raspberry Pi

## Мета

Запустити постійний, завжди увімкнений Gateway OpenClaw на Raspberry Pi за **~$35-80** одноразових витрат (без щомісячних платежів).

Ідеально для:

- персонального AI-асистента 24/7
- хаба домашньої автоматизації
- енергоефективного, завжди доступного бота для Telegram/WhatsApp

## Вимоги до обладнання

| Модель Pi        | RAM     | Працює?  | Примітки                           |
| ---------------- | ------- | -------- | ---------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ Найкраще | Найшвидший, рекомендовано          |
| **Pi 4**         | 4GB     | ✅ Добре | Оптимальний варіант для більшості користувачів |
| **Pi 4**         | 2GB     | ✅ OK    | Працює, додайте swap               |
| **Pi 4**         | 1GB     | ⚠️ Тісно | Можливо зі swap, мінімальна конфігурація |
| **Pi 3B+**       | 1GB     | ⚠️ Повільно | Працює, але повільно              |
| **Pi Zero 2 W**  | 512MB   | ❌       | Не рекомендовано                   |

**Мінімальні характеристики:** 1GB RAM, 1 ядро, 500MB диска  
**Рекомендовано:** 2GB+ RAM, 64-bit OS, SD-карта 16GB+ (або USB SSD)

## Що вам потрібно

- Raspberry Pi 4 або 5 (рекомендовано 2GB+)
- MicroSD-карта (16GB+) або USB SSD (краща продуктивність)
- Блок живлення (рекомендовано офіційний PSU для Pi)
- Мережеве підключення (Ethernet або WiFi)
- ~30 хвилин

## 1) Запишіть ОС

Використовуйте **Raspberry Pi OS Lite (64-bit)** — для безголового сервера робочий стіл не потрібен.

1. Завантажте [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Оберіть ОС: **Raspberry Pi OS Lite (64-bit)**
3. Натисніть значок шестерні (⚙️), щоб попередньо налаштувати:
   - Установіть hostname: `gateway-host`
   - Увімкніть SSH
   - Установіть ім’я користувача/пароль
   - Налаштуйте WiFi (якщо не використовуєте Ethernet)
4. Запишіть образ на SD-карту / USB-накопичувач
5. Вставте носій і завантажте Pi

## 2) Підключіться через SSH

```bash
ssh user@gateway-host
# або використайте IP-адресу
ssh user@192.168.x.x
```

## 3) Налаштування системи

```bash
# Оновити систему
sudo apt update && sudo apt upgrade -y

# Установити необхідні пакунки
sudo apt install -y git curl build-essential

# Установити часовий пояс (важливо для cron/нагадувань)
sudo timedatectl set-timezone America/Chicago  # Змініть на свій часовий пояс
```

## 4) Установіть Node.js 24 (ARM64)

```bash
# Установити Node.js через NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Перевірити
node --version  # Має показати v24.x.x
npm --version
```

## 5) Додайте swap (важливо для 2GB або менше)

Swap запобігає збоям через нестачу пам’яті:

```bash
# Створити swap-файл на 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Зробити постійним
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Оптимізувати для малої RAM (зменшити swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Установіть OpenClaw

### Варіант A: стандартне встановлення (рекомендовано)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Варіант B: зручне для змін встановлення (для експериментів)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Встановлення для змін дає прямий доступ до логів і коду — це корисно для налагодження ARM-специфічних проблем.

## 7) Запустіть онбординг

```bash
openclaw onboard --install-daemon
```

Дотримуйтесь майстра:

1. **Режим Gateway:** Local
2. **Auth:** рекомендовано API keys (OAuth на безголовому Pi може бути нестабільним)
3. **Channels:** найпростіше почати з Telegram
4. **Daemon:** Так (systemd)

## 8) Перевірте встановлення

```bash
# Перевірити стан
openclaw status

# Перевірити сервіс (стандартне встановлення = user unit systemd)
systemctl --user status openclaw-gateway.service

# Переглянути логи
journalctl --user -u openclaw-gateway.service -f
```

## 9) Отримайте доступ до Dashboard OpenClaw

Замініть `user@gateway-host` на ім’я користувача й hostname або IP-адресу вашого Pi.

На своєму комп’ютері попросіть Pi вивести новий URL Dashboard:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Команда виведе `Dashboard URL:`. Залежно від того, як налаштовано `gateway.auth.token`,
URL може бути звичайним посиланням `http://127.0.0.1:18789/` або
містити `#token=...`.

В іншому терміналі на вашому комп’ютері створіть SSH-тунель:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Потім відкрийте надрукований URL Dashboard у локальному браузері.

Якщо UI запитує shared-secret auth, вставте налаштований token або password
в налаштуваннях Control UI. Для token auth використовуйте `gateway.auth.token` (або
`OPENCLAW_GATEWAY_TOKEN`).

Для постійного віддаленого доступу див. [Tailscale](/uk/gateway/tailscale).

---

## Оптимізація продуктивності

### Використовуйте USB SSD (велике покращення)

SD-карти повільні й зношуються. USB SSD суттєво покращує продуктивність:

```bash
# Перевірити, чи завантаження йде з USB
lsblk
```

Інструкції з налаштування див. у [посібнику з USB boot для Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

### Прискорте запуск CLI (кеш компіляції модулів)

На менш потужних хостах Pi увімкніть кеш компіляції модулів Node, щоб повторні запуски CLI були швидшими:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Примітки:

- `NODE_COMPILE_CACHE` пришвидшує наступні запуски (`status`, `health`, `--help`).
- `/var/tmp` переживає перезавантаження краще, ніж `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` уникає додаткових витрат на запуск через самоперезапуск CLI.
- Перший запуск прогріває кеш; найбільшу користь дають наступні запуски.

### Налаштування запуску systemd (необов’язково)

Якщо цей Pi переважно виконує OpenClaw, додайте drop-in для сервісу, щоб зменшити
нестабільність перезапусків і зберегти стабільне середовище запуску:

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

Потім застосуйте:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Якщо можливо, тримайте стан/кеш OpenClaw на сховищі з SSD, щоб уникнути
вузьких місць випадкового I/O SD-карти під час холодних запусків.

Якщо це безголовий Pi, один раз увімкніть lingering, щоб user service переживав
вихід із системи:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Як політики `Restart=` допомагають автоматичному відновленню:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Зменште використання пам’яті

```bash
# Вимкнути виділення пам’яті під GPU (безголовий режим)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Вимкнути Bluetooth, якщо він не потрібен
sudo systemctl disable bluetooth
```

### Моніторинг ресурсів

```bash
# Перевірити пам’ять
free -h

# Перевірити температуру CPU
vcgencmd measure_temp

# Моніторинг у реальному часі
htop
```

---

## Примітки щодо ARM

### Сумісність бінарних файлів

Більшість можливостей OpenClaw працює на ARM64, але деяким зовнішнім бінарним файлам можуть знадобитися ARM-збірки:

| Інструмент         | Статус ARM64 | Примітки                            |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Працює чудово                       |
| WhatsApp (Baileys) | ✅           | Чистий JS, без проблем              |
| Telegram           | ✅           | Чистий JS, без проблем              |
| gog (Gmail CLI)    | ⚠️           | Перевірте наявність ARM-релізу      |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Якщо Skill не працює, перевірте, чи має його бінарний файл ARM-збірку. Багато інструментів на Go/Rust мають, але не всі.

### 32-bit vs 64-bit

**Завжди використовуйте 64-bit OS.** Node.js і багато сучасних інструментів цього потребують. Перевірте так:

```bash
uname -m
# Має показати: aarch64 (64-bit), а не armv7l (32-bit)
```

---

## Рекомендоване налаштування моделей

Оскільки Pi тут лише Gateway (моделі працюють у хмарі), використовуйте моделі на базі API:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**Не намагайтеся запускати локальні LLM на Pi** — навіть малі моделі працюватимуть надто повільно. Нехай Claude/GPT виконують основне навантаження.

---

## Автозапуск під час завантаження

Онбординг це налаштовує, але для перевірки:

```bash
# Перевірити, що сервіс увімкнено
systemctl --user is-enabled openclaw-gateway.service

# Увімкнути, якщо ні
systemctl --user enable openclaw-gateway.service

# Запускати під час завантаження
systemctl --user start openclaw-gateway.service
```

---

## Усунення несправностей

### Нестача пам’яті (OOM)

```bash
# Перевірити пам’ять
free -h

# Додати більше swap (див. крок 5)
# Або зменшити кількість сервісів, що працюють на Pi
```

### Повільна продуктивність

- Використовуйте USB SSD замість SD-карти
- Вимкніть непотрібні сервіси: `sudo systemctl disable cups bluetooth avahi-daemon`
- Перевірте тротлінг CPU: `vcgencmd get_throttled` (має повертати `0x0`)

### Сервіс не запускається

```bash
# Перевірити логи
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Поширене виправлення: перебудова
cd ~/openclaw  # якщо використовуєте встановлення для змін
npm run build
systemctl --user restart openclaw-gateway.service
```

### Проблеми з ARM-бінарниками

Якщо Skill падає з помилкою "exec format error":

1. Перевірте, чи має бінарний файл збірку для ARM64
2. Спробуйте зібрати з джерела
3. Або використайте Docker-контейнер із підтримкою ARM

### Обриви WiFi

Для безголових Pi на WiFi:

```bash
# Вимкнути керування живленням WiFi
sudo iwconfig wlan0 power off

# Зробити постійним
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Порівняння вартості

| Варіант         | Одноразова вартість | Щомісячна вартість | Примітки                  |
| --------------- | ------------------- | ------------------ | ------------------------- |
| **Pi 4 (2GB)**  | ~$45                | $0                 | + електроенергія (~$5/рік) |
| **Pi 4 (4GB)**  | ~$55                | $0                 | Рекомендовано             |
| **Pi 5 (4GB)**  | ~$60                | $0                 | Найкраща продуктивність   |
| **Pi 5 (8GB)**  | ~$80                | $0                 | Надлишково, але із запасом на майбутнє |
| DigitalOcean    | $0                  | $6/mo              | $72/рік                   |
| Hetzner         | $0                  | €3.79/mo           | ~$50/рік                  |

**Точка окупності:** Pi окупається приблизно за 6-12 місяців порівняно з хмарним VPS.

---

## Пов’язане

- [Linux guide](/uk/platforms/linux) — загальне налаштування Linux
- [DigitalOcean guide](/uk/install/digitalocean) — хмарна альтернатива
- [Hetzner guide](/uk/install/hetzner) — налаштування Docker
- [Tailscale](/uk/gateway/tailscale) — віддалений доступ
- [Nodes](/uk/nodes) — під’єднайте свій ноутбук/телефон до Gateway на Pi
