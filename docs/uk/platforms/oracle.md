---
read_when:
    - Налаштування OpenClaw в Oracle Cloud
    - Пошук недорогого VPS-хостингу для OpenClaw
    - Потрібен OpenClaw 24/7 на невеликому сервері
summary: OpenClaw в Oracle Cloud (Always Free ARM)
title: Oracle Cloud (платформа)
x-i18n:
    generated_at: "2026-04-05T18:11:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw в Oracle Cloud (OCI)

## Мета

Запустити постійний шлюз OpenClaw Gateway на **Always Free** ARM-рівні Oracle Cloud.

Безкоштовний рівень Oracle може добре підійти для OpenClaw (особливо якщо у вас уже є обліковий запис OCI), але він має свої компроміси:

- архітектура ARM (більшість речей працює, але деякі бінарні файли можуть бути лише для x86)
- місткість і реєстрація можуть бути вибагливими

## Порівняння вартості (2026)

| Provider     | Plan            | Specs                  | Price/mo | Notes                 |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | до 4 OCPU, 24 ГБ RAM   | $0       | ARM, обмежена місткість |
| Hetzner      | CX22            | 2 vCPU, 4 ГБ RAM       | ~ $4     | Найдешевший платний варіант |
| DigitalOcean | Basic           | 1 vCPU, 1 ГБ RAM       | $6       | Простий UI, хороша документація |
| Vultr        | Cloud Compute   | 1 vCPU, 1 ГБ RAM       | $6       | Багато локацій        |
| Linode       | Nanode          | 1 vCPU, 1 ГБ RAM       | $5       | Тепер частина Akamai  |

---

## Передумови

- Обліковий запис Oracle Cloud ([реєстрація](https://www.oracle.com/cloud/free/)) — див. [посібник зі спільноти щодо реєстрації](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), якщо виникнуть проблеми
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
   - **Memory:** 12 ГБ (або до 24 ГБ)
   - **Boot volume:** 50 ГБ (до 200 ГБ безкоштовно)
   - **SSH key:** додайте свій публічний ключ
4. Натисніть **Create**
5. Запишіть публічну IP-адресу

**Порада:** Якщо створення екземпляра завершується помилкою "Out of capacity", спробуйте інший домен доступності або повторіть спробу пізніше. Місткість безкоштовного рівня обмежена.

## 2) Підключіться та оновіть систему

```bash
# Підключення через публічну IP-адресу
ssh ubuntu@YOUR_PUBLIC_IP

# Оновлення системи
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Примітка:** `build-essential` потрібен для ARM-компіляції деяких залежностей.

## 3) Налаштуйте користувача та ім’я хоста

```bash
# Встановити ім’я хоста
sudo hostnamectl set-hostname openclaw

# Встановити пароль для користувача ubuntu
sudo passwd ubuntu

# Увімкнути lingering (щоб користувацькі служби продовжували працювати після виходу)
sudo loginctl enable-linger ubuntu
```

## 4) Установіть Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Це вмикає Tailscale SSH, тож ви можете підключатися через `ssh openclaw` з будь-якого пристрою у вашому tailnet — без потреби у публічній IP-адресі.

Перевірка:

```bash
tailscale status
```

**Відтепер підключайтеся через Tailscale:** `ssh ubuntu@openclaw` (або використовуйте IP-адресу Tailscale).

## 5) Установіть OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Коли з’явиться запитання "How do you want to hatch your bot?", виберіть **"Do this later"**.

> Примітка: Якщо виникають проблеми зі збиранням ARM-native, спочатку спробуйте системні пакети (наприклад, `sudo apt install -y build-essential`), перш ніж вдаватися до Homebrew.

## 6) Налаштуйте Gateway (loopback + автентифікація токеном) і ввімкніть Tailscale Serve

Використовуйте автентифікацію токеном як типову. Вона передбачувана й дозволяє обійтися без будь-яких прапорців «небезпечної автентифікації» в UI керування.

```bash
# Залишити Gateway приватним у VM
openclaw config set gateway.bind loopback

# Вимагати автентифікацію для Gateway + UI керування
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Відкрити через Tailscale Serve (HTTPS + доступ tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` тут використовується лише для обробки forwarded-IP/local-client локального проксі Tailscale Serve. Це **не** `gateway.auth.mode: "trusted-proxy"`. Маршрути переглядача diff у цій конфігурації залишаються fail-closed: необроблені запити переглядача `127.0.0.1` без forwarded proxy headers можуть повертати `Diff not found`. Використовуйте `mode=file` / `mode=both` для вкладень або свідомо ввімкніть віддалені переглядачі й задайте `plugins.entries.diffs.config.viewerBaseUrl` (або передайте proxy `baseUrl`), якщо вам потрібні спільні посилання на переглядач.

## 7) Перевірка

```bash
# Перевірити версію
openclaw --version

# Перевірити стан демона
systemctl --user status openclaw-gateway.service

# Перевірити Tailscale Serve
tailscale serve status

# Перевірити локальну відповідь
curl http://localhost:18789
```

## 8) Посильте безпеку VCN

Тепер, коли все працює, посильте безпеку VCN, щоб блокувати весь трафік, окрім Tailscale. Virtual Cloud Network в OCI працює як мережевий брандмауер на межі мережі — трафік блокується ще до того, як досягне вашого екземпляра.

1. Перейдіть до **Networking → Virtual Cloud Networks** у OCI Console
2. Натисніть вашу VCN → **Security Lists** → Default Security List
3. **Видаліть** усі правила вхідного трафіку, крім:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Залиште типові правила вихідного трафіку (дозволити весь вихідний трафік)

Це блокує SSH на порту 22, HTTP, HTTPS та все інше на межі мережі. Відтепер ви зможете підключатися лише через Tailscale.

---

## Доступ до UI керування

З будь-якого пристрою у вашій мережі Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Замініть `<tailnet-name>` на назву вашого tailnet (видно в `tailscale status`).

SSH-тунель не потрібен. Tailscale надає:

- HTTPS-шифрування (автоматичні сертифікати)
- автентифікацію через Tailscale identity
- доступ з будь-якого пристрою у вашому tailnet (ноутбук, телефон тощо)

---

## Безпека: VCN + Tailscale (рекомендований базовий варіант)

Коли VCN захищено (відкрито лише UDP 41641), а Gateway прив’язано до loopback, ви отримуєте надійний багаторівневий захист: публічний трафік блокується на межі мережі, а адміністративний доступ відбувається через ваш tailnet.

Така конфігурація часто усуває _потребу_ в додаткових правилах брандмауера на хості лише для зупинки масових SSH-брутфорс-атак з Інтернету — але все одно слід підтримувати ОС в актуальному стані, запускати `openclaw security audit` і перевіряти, що ви випадково не слухаєте на публічних інтерфейсах.

### Уже захищено

| Traditional Step   | Needed?     | Why                                                                          |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFW firewall       | Ні          | VCN блокує трафік до того, як він досягне екземпляра                         |
| fail2ban           | Ні          | Немає брутфорсу, якщо порт 22 заблоковано на рівні VCN                       |
| sshd hardening     | Ні          | Tailscale SSH не використовує sshd                                           |
| Disable root login | Ні          | Tailscale використовує Tailscale identity, а не системних користувачів       |
| SSH key-only auth  | Ні          | Tailscale виконує автентифікацію через ваш tailnet                           |
| IPv6 hardening     | Зазвичай ні | Залежить від налаштувань вашої VCN/підмережі; перевірте, що саме призначено/відкрито |

### Усе ще рекомендовано

- **Права доступу до облікових даних:** `chmod 700 ~/.openclaw`
- **Аудит безпеки:** `openclaw security audit`
- **Оновлення системи:** регулярно виконуйте `sudo apt update && sudo apt upgrade`
- **Моніторинг Tailscale:** переглядайте пристрої в [консолі адміністратора Tailscale](https://login.tailscale.com/admin)

### Перевірка безпекової конфігурації

```bash
# Підтвердити, що публічні порти не прослуховуються
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Перевірити, що Tailscale SSH активний
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Необов’язково: повністю вимкнути sshd
sudo systemctl disable --now ssh
```

---

## Резервний варіант: SSH-тунель

Якщо Tailscale Serve не працює, використайте SSH-тунель:

```bash
# З вашої локальної машини (через Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Потім відкрийте `http://localhost:18789`.

---

## Усунення проблем

### Не вдається створити екземпляр ("Out of capacity")

Екземпляри ARM безкоштовного рівня популярні. Спробуйте:

- інший домен доступності
- повторити спробу в години низького навантаження (рано вранці)
- використовувати фільтр "Always Free" під час вибору shape

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

### Не вдається отримати доступ до UI керування

```bash
# Перевірити, що Tailscale Serve запущено
tailscale serve status

# Перевірити, що gateway слухає
curl http://localhost:18789

# Перезапустити за потреби
systemctl --user restart openclaw-gateway.service
```

### Проблеми з ARM-бінарниками

Деякі інструменти можуть не мати ARM-збірок. Перевірте:

```bash
uname -m  # Має показати aarch64
```

Більшість npm-пакетів працюють нормально. Для бінарних файлів шукайте випуски `linux-arm64` або `aarch64`.

---

## Збереження стану

Увесь стан зберігається в:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` для кожного агента, стан каналів/провайдерів і дані сесій
- `~/.openclaw/workspace/` — робочий простір (SOUL.md, пам’ять, артефакти)

Робіть резервні копії періодично:

```bash
openclaw backup create
```

---

## Дивіться також

- [Віддалений доступ до Gateway](/uk/gateway/remote) — інші шаблони віддаленого доступу
- [Інтеграція Tailscale](/uk/gateway/tailscale) — повна документація Tailscale
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації
- [Посібник для DigitalOcean](/uk/install/digitalocean) — якщо потрібен платний варіант з простішою реєстрацією
- [Посібник для Hetzner](/uk/install/hetzner) — альтернатива на основі Docker
