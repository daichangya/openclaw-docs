---
read_when:
    - Налаштування OpenClaw на Oracle Cloud
    - Шукаю недорогий VPS-хостинг для OpenClaw
    - Потрібен OpenClaw 24/7 на невеликому сервері
summary: OpenClaw на Oracle Cloud (Always Free ARM)
title: Oracle Cloud (платформа)
x-i18n:
    generated_at: "2026-04-24T03:47:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw на Oracle Cloud (OCI)

## Мета

Запустити постійний Gateway OpenClaw на рівні **Always Free** ARM від Oracle Cloud.

Безкоштовний рівень Oracle може добре підійти для OpenClaw (особливо якщо у вас уже є обліковий запис OCI), але він має компроміси:

- ARM-архітектура (більшість речей працює, але деякі бінарні файли можуть бути лише для x86)
- Місткість і реєстрація можуть бути примхливими

## Порівняння вартості (2026)

| Provider     | Plan            | Specs                  | Price/mo | Notes                 |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | до 4 OCPU, 24 ГБ RAM   | $0       | ARM, обмежена місткість |
| Hetzner      | CX22            | 2 vCPU, 4 ГБ RAM       | ~ $4     | Найдешевший платний варіант |
| DigitalOcean | Basic           | 1 vCPU, 1 ГБ RAM       | $6       | Зручний UI, хороша документація |
| Vultr        | Cloud Compute   | 1 vCPU, 1 ГБ RAM       | $6       | Багато локацій        |
| Linode       | Nanode          | 1 vCPU, 1 ГБ RAM       | $5       | Тепер частина Akamai  |

---

## Передумови

- Обліковий запис Oracle Cloud ([реєстрація](https://www.oracle.com/cloud/free/)) — див. [посібник зі спільноти щодо реєстрації](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), якщо виникають проблеми
- Обліковий запис Tailscale (безкоштовно на [tailscale.com](https://tailscale.com))
- ~30 хвилин

## 1) Створіть екземпляр OCI

1. Увійдіть у [Oracle Cloud Console](https://cloud.oracle.com/)
2. Перейдіть до **Compute → Instances → Create Instance**
3. Налаштуйте:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (або до 4)
   - **Memory:** 12 GB (або до 24 GB)
   - **Boot volume:** 50 GB (до 200 GB безкоштовно)
   - **SSH key:** додайте свій публічний ключ
4. Натисніть **Create**
5. Запишіть публічну IP-адресу

**Порада:** Якщо створення екземпляра завершується помилкою "Out of capacity", спробуйте інший availability domain або повторіть спробу пізніше. Місткість безкоштовного рівня обмежена.

## 2) Підключіться й оновіть систему

```bash
# Підключення через публічну IP-адресу
ssh ubuntu@YOUR_PUBLIC_IP

# Оновлення системи
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Примітка:** `build-essential` потрібен для ARM-компіляції деяких залежностей.

## 3) Налаштуйте користувача та hostname

```bash
# Встановити hostname
sudo hostnamectl set-hostname openclaw

# Встановити пароль для користувача ubuntu
sudo passwd ubuntu

# Увімкнути lingering (дозволяє користувацьким сервісам працювати після виходу)
sudo loginctl enable-linger ubuntu
```

## 4) Встановіть Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Це вмикає Tailscale SSH, тож ви можете підключатися через `ssh openclaw` з будь-якого пристрою у вашому tailnet — публічна IP-адреса не потрібна.

Перевірка:

```bash
tailscale status
```

**Відтепер підключайтеся через Tailscale:** `ssh ubuntu@openclaw` (або використовуйте IP-адресу Tailscale).

## 5) Встановіть OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Коли з’явиться запитання "How do you want to hatch your bot?", виберіть **"Do this later"**.

> Примітка: якщо виникають проблеми зі збіркою під ARM, спочатку спробуйте системні пакети (наприклад `sudo apt install -y build-essential`), а вже потім Homebrew.

## 6) Налаштуйте Gateway (loopback + token auth) і ввімкніть Tailscale Serve

Використовуйте token auth як типовий варіант. Це передбачувано й не вимагає жодних прапорців “insecure auth” у Control UI.

```bash
# Залишити Gateway приватним на VM
openclaw config set gateway.bind loopback

# Вимагати автентифікацію для Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Відкрити через Tailscale Serve (HTTPS + доступ у tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` тут використовується лише для обробки forwarded-IP/local-client локальним проксі Tailscale Serve. Це **не** `gateway.auth.mode: "trusted-proxy"`. Маршрути перегляду diff у цій конфігурації зберігають fail-closed поведінку: необроблені запити переглядача `127.0.0.1` без forwarded proxy headers можуть повертати `Diff not found`. Для вкладень використовуйте `mode=file` / `mode=both`, або навмисно ввімкніть віддалені viewer і задайте `plugins.entries.diffs.config.viewerBaseUrl` (або передайте proxy `baseUrl`), якщо вам потрібні поширювані посилання viewer.

## 7) Перевірка

```bash
# Перевірити версію
openclaw --version

# Перевірити стан daemon
systemctl --user status openclaw-gateway.service

# Перевірити Tailscale Serve
tailscale serve status

# Перевірити локальну відповідь
curl http://localhost:18789
```

## 8) Заблокуйте VCN Security

Тепер, коли все працює, заблокуйте VCN так, щоб блокувався весь трафік, окрім Tailscale. Virtual Cloud Network в OCI працює як firewall на межі мережі — трафік блокується ще до того, як доходить до вашого екземпляра.

1. Перейдіть до **Networking → Virtual Cloud Networks** у OCI Console
2. Виберіть свій VCN → **Security Lists** → Default Security List
3. **Видаліть** усі ingress rules, окрім:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Залиште типові правила egress (дозволити весь вихідний трафік)

Це блокує SSH на порту 22, HTTP, HTTPS і все інше на межі мережі. Відтепер ви можете підключатися лише через Tailscale.

---

## Доступ до Control UI

З будь-якого пристрою у вашій мережі Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Замініть `<tailnet-name>` на назву вашого tailnet (її видно в `tailscale status`).

SSH-тунель не потрібен. Tailscale надає:

- HTTPS-шифрування (автоматичні сертифікати)
- Автентифікацію через identity Tailscale
- Доступ з будь-якого пристрою у вашому tailnet (ноутбук, телефон тощо)

---

## Безпека: VCN + Tailscale (рекомендована базова конфігурація)

Коли VCN заблокований (відкрито лише UDP 41641), а Gateway прив’язаний до loopback, ви отримуєте сильний захист у глибину: публічний трафік блокується на межі мережі, а адміністративний доступ відбувається через ваш tailnet.

У такій конфігурації часто вже _не потрібні_ додаткові правила firewall на рівні host лише для захисту від масового перебору SSH з Інтернету — але все одно слід підтримувати ОС в актуальному стані, запускати `openclaw security audit` і перевіряти, що ви випадково не слухаєте публічні інтерфейси.

### Уже захищено

| Traditional Step   | Needed?     | Why                                                                          |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFW firewall       | Ні          | VCN блокує трафік до того, як він досягає екземпляра                         |
| fail2ban           | Ні          | Немає brute force, якщо порт 22 заблоковано на рівні VCN                    |
| sshd hardening     | Ні          | Tailscale SSH не використовує sshd                                           |
| Disable root login | Ні          | Tailscale використовує identity Tailscale, а не системних користувачів      |
| SSH key-only auth  | Ні          | Tailscale автентифікує через ваш tailnet                                     |
| IPv6 hardening     | Зазвичай ні | Залежить від налаштувань VCN/subnet; перевірте, що саме призначено/відкрито |

### Все ще рекомендовано

- **Права доступу до облікових даних:** `chmod 700 ~/.openclaw`
- **Аудит безпеки:** `openclaw security audit`
- **Оновлення системи:** регулярно `sudo apt update && sudo apt upgrade`
- **Моніторинг Tailscale:** переглядайте пристрої в [консолі адміністратора Tailscale](https://login.tailscale.com/admin)

### Перевірка стану безпеки

```bash
# Переконатися, що жодні публічні порти не прослуховуються
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Перевірити, що Tailscale SSH активний
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Необов’язково: повністю вимкнути sshd
sudo systemctl disable --now ssh
```

---

## Резервний варіант: SSH tunnel

Якщо Tailscale Serve не працює, використайте SSH-тунель:

```bash
# На вашій локальній машині (через Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Потім відкрийте `http://localhost:18789`.

---

## Усунення проблем

### Не вдається створити екземпляр ("Out of capacity")

Безкоштовні ARM-екземпляри популярні. Спробуйте:

- Інший availability domain
- Повторити спробу в години низького навантаження (рано вранці)
- Використати фільтр "Always Free" під час вибору shape

### Tailscale не підключається

```bash
# Перевірити стан
sudo tailscale status

# Повторна автентифікація
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway не запускається

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Не вдається відкрити Control UI

```bash
# Переконатися, що Tailscale Serve працює
tailscale serve status

# Перевірити, що Gateway слухає
curl http://localhost:18789

# Перезапустити за потреби
systemctl --user restart openclaw-gateway.service
```

### Проблеми з ARM-бінарниками

Деякі інструменти можуть не мати ARM-збірок. Перевірте:

```bash
uname -m  # Має показувати aarch64
```

Більшість npm-пакетів працює нормально. Для бінарних файлів шукайте релізи `linux-arm64` або `aarch64`.

---

## Збереження стану

Увесь стан зберігається в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для кожного агента, стан каналів/провайдерів і дані сесій
- `~/.openclaw/workspace/` — workspace (SOUL.md, memory, artifacts)

Регулярно робіть резервні копії:

```bash
openclaw backup create
```

---

## Пов’язане

- [Віддалений доступ до Gateway](/uk/gateway/remote) — інші шаблони віддаленого доступу
- [Інтеграція Tailscale](/uk/gateway/tailscale) — повна документація Tailscale
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Посібник для DigitalOcean](/uk/install/digitalocean) — якщо вам потрібен платний варіант із простішою реєстрацією
- [Посібник для Hetzner](/uk/install/hetzner) — альтернатива на основі Docker
