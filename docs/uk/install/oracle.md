---
read_when:
    - Налаштування OpenClaw в Oracle Cloud
    - Пошук безкоштовного VPS-хостингу для OpenClaw
    - Потреба в цілодобовому OpenClaw на невеликому сервері
summary: Розміщення OpenClaw на ARM-рівні Oracle Cloud Always Free
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-05T18:08:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6915f8c428cfcbc215ba6547273df6e7b93212af6590827a3853f15617ba245e
    source_path: install/oracle.md
    workflow: 15
---

# Oracle Cloud

Запустіть постійний Gateway OpenClaw на ARM-рівні Oracle Cloud **Always Free** (до 4 OCPU, 24 GB RAM, 200 GB сховища) безкоштовно.

## Передумови

- Обліковий запис Oracle Cloud ([реєстрація](https://www.oracle.com/cloud/free/)) -- див. [посібник зі спільноти щодо реєстрації](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), якщо виникають проблеми
- Обліковий запис Tailscale (безкоштовно на [tailscale.com](https://tailscale.com))
- Пара SSH-ключів
- Близько 30 хвилин

## Налаштування

<Steps>
  <Step title="Створіть екземпляр OCI">
    1. Увійдіть у [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Перейдіть до **Compute > Instances > Create Instance**.
    3. Налаштуйте:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (або до 4)
       - **Memory:** 12 GB (або до 24 GB)
       - **Boot volume:** 50 GB (до 200 GB безкоштовно)
       - **SSH key:** Додайте свій публічний ключ
    4. Натисніть **Create** і запишіть публічну IP-адресу.

    <Tip>
    Якщо створення екземпляра завершується помилкою "Out of capacity", спробуйте інший availability domain або повторіть пізніше. Ємність безкоштовного рівня обмежена.
    </Tip>

  </Step>

  <Step title="Підключіться й оновіть систему">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` потрібен для ARM-компіляції деяких залежностей.

  </Step>

  <Step title="Налаштуйте користувача й hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Увімкнення linger дає змогу користувацьким сервісам працювати після виходу із системи.

  </Step>

  <Step title="Установіть Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Відтепер підключайтеся через Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Установіть OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Коли з’явиться запитання "How do you want to hatch your bot?", виберіть **Do this later**.

  </Step>

  <Step title="Налаштуйте gateway">
    Використовуйте автентифікацію за токеном із Tailscale Serve для безпечного віддаленого доступу.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` тут використовується лише для обробки forwarded-IP/local-client локального проксі Tailscale Serve. Це **не** `gateway.auth.mode: "trusted-proxy"`. Маршрути перегляду diff у цій конфігурації зберігають поведінку fail-closed: сирі запити переглядача на `127.0.0.1` без forwarded proxy headers можуть повертати `Diff not found`. Використовуйте `mode=file` / `mode=both` для вкладень або свідомо ввімкніть віддалені переглядачі й задайте `plugins.entries.diffs.config.viewerBaseUrl` (або передайте proxy `baseUrl`), якщо вам потрібні придатні для поширення посилання на переглядач.

  </Step>

  <Step title="Посильте захист безпеки VCN">
    Заблокуйте весь трафік, крім Tailscale, на мережевому краю:

    1. Перейдіть до **Networking > Virtual Cloud Networks** у OCI Console.
    2. Натисніть свій VCN, потім **Security Lists > Default Security List**.
    3. **Видаліть** усі правила ingress, крім `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Залиште типові правила egress (дозволити весь вихідний трафік).

    Це блокує SSH на порту 22, HTTP, HTTPS та все інше на мережевому краю. Від цього моменту ви можете підключатися лише через Tailscale.

  </Step>

  <Step title="Перевірте">
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

    Замініть `<tailnet-name>` на назву вашої tailnet (її видно в `tailscale status`).

  </Step>
</Steps>

## Резервний варіант: SSH-тунель

Якщо Tailscale Serve не працює, використайте SSH-тунель зі своєї локальної машини:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Потім відкрийте `http://localhost:18789`.

## Усунення несправностей

**Не вдається створити екземпляр ("Out of capacity")** -- ARM-екземпляри безкоштовного рівня популярні. Спробуйте інший availability domain або повторіть у непіковий час.

**Tailscale не підключається** -- Виконайте `sudo tailscale up --ssh --hostname=openclaw --reset`, щоб пройти автентифікацію повторно.

**Gateway не запускається** -- Виконайте `openclaw doctor --non-interactive` і перевірте журнали через `journalctl --user -u openclaw-gateway.service -n 50`.

**Проблеми з ARM-бінарними файлами** -- Більшість npm-пакетів працює на ARM64. Для нативних бінарних файлів шукайте випуски `linux-arm64` або `aarch64`. Перевірте архітектуру через `uname -m`.

## Наступні кроки

- [Channels](/channels) -- підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація gateway](/gateway/configuration) -- усі параметри конфігурації
- [Updating](/install/updating) -- підтримуйте OpenClaw в актуальному стані
