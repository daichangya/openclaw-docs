---
read_when:
    - Налаштування OpenClaw на Oracle Cloud
    - Шукаєте безкоштовний VPS-хостинг для OpenClaw
    - Хочете мати OpenClaw 24/7 на невеликому сервері
summary: Розміщення OpenClaw на Always Free ARM tier від Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-24T03:19:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 15
---

Запустіть постійний Gateway OpenClaw на **Always Free** ARM tier від Oracle Cloud (до 4 OCPU, 24 ГБ RAM, 200 ГБ сховища) безкоштовно.

## Передумови

- Обліковий запис Oracle Cloud ([реєстрація](https://www.oracle.com/cloud/free/)) -- див. [посібник із реєстрації від спільноти](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), якщо виникнуть проблеми
- Обліковий запис Tailscale (безкоштовно на [tailscale.com](https://tailscale.com))
- Пара SSH-ключів
- Близько 30 хвилин

## Налаштування

<Steps>
  <Step title="Створення екземпляра OCI">
    1. Увійдіть до [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Перейдіть до **Compute > Instances > Create Instance**.
    3. Налаштуйте:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (або до 4)
       - **Memory:** 12 ГБ (або до 24 ГБ)
       - **Boot volume:** 50 ГБ (до 200 ГБ безкоштовно)
       - **SSH key:** Додайте свій публічний ключ
    4. Натисніть **Create** і запишіть публічну IP-адресу.

    <Tip>
    Якщо створення екземпляра завершується помилкою "Out of capacity", спробуйте інший availability domain або повторіть спробу пізніше. Ресурси free tier обмежені.
    </Tip>

  </Step>

  <Step title="Підключення та оновлення системи">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` потрібен для ARM-компіляції деяких залежностей.

  </Step>

  <Step title="Налаштування користувача та hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Увімкнення linger дозволяє користувацьким службам працювати після виходу із системи.

  </Step>

  <Step title="Встановлення Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Відтепер підключайтеся через Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Встановлення OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Коли з’явиться запит "How do you want to hatch your bot?", виберіть **Do this later**.

  </Step>

  <Step title="Налаштування gateway">
    Використовуйте автентифікацію токеном із Tailscale Serve для безпечного віддаленого доступу.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` тут використовується лише для обробки forwarded-IP/local-client локального проксі Tailscale Serve. Це **не** `gateway.auth.mode: "trusted-proxy"`. Маршрути переглядача diff у цій конфігурації зберігають fail-closed-поведінку: сирі запити переглядача `127.0.0.1` без forwarded proxy headers можуть повертати `Diff not found`. Для вкладень використовуйте `mode=file` / `mode=both`, або навмисно ввімкніть віддалені переглядачі й задайте `plugins.entries.diffs.config.viewerBaseUrl` (або передайте proxy `baseUrl`), якщо вам потрібні придатні для поширення посилання на переглядач.

  </Step>

  <Step title="Посилення безпеки VCN">
    Заблокуйте весь трафік, крім Tailscale, на рівні мережі:

    1. Перейдіть до **Networking > Virtual Cloud Networks** в OCI Console.
    2. Натисніть свій VCN, потім **Security Lists > Default Security List**.
    3. **Видаліть** усі правила ingress, крім `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Залиште типові правила egress (дозволити весь вихідний трафік).

    Це блокує SSH на порту 22, HTTP, HTTPS та все інше на рівні мережі. Відтепер ви можете підключатися лише через Tailscale.

  </Step>

  <Step title="Перевірка">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Отримайте доступ до Control UI з будь-якого пристрою у вашій tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Замініть `<tailnet-name>` на назву вашої tailnet (видно в `tailscale status`).

  </Step>
</Steps>

## Резервний варіант: SSH-тунель

Якщо Tailscale Serve не працює, використовуйте SSH-тунель із локальної машини:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Потім відкрийте `http://localhost:18789`.

## Усунення несправностей

**Не вдається створити екземпляр ("Out of capacity")** -- ARM-екземпляри free tier популярні. Спробуйте інший availability domain або повторіть спробу в непікові години.

**Tailscale не підключається** -- Виконайте `sudo tailscale up --ssh --hostname=openclaw --reset`, щоб повторно пройти автентифікацію.

**Gateway не запускається** -- Виконайте `openclaw doctor --non-interactive` і перевірте журнали через `journalctl --user -u openclaw-gateway.service -n 50`.

**Проблеми з ARM-бінарниками** -- Більшість npm-пакетів працюють на ARM64. Для нативних бінарних файлів шукайте випуски `linux-arm64` або `aarch64`. Перевірте архітектуру через `uname -m`.

## Наступні кроки

- [Channels](/uk/channels) -- підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація Gateway](/uk/gateway/configuration) -- усі параметри конфігурації
- [Оновлення](/uk/install/updating) -- підтримуйте OpenClaw в актуальному стані

## Пов’язане

- [Огляд встановлення](/uk/install)
- [GCP](/uk/install/gcp)
- [VPS hosting](/uk/vps)
