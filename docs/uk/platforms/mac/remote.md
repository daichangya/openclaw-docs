---
read_when:
    - Налаштування або налагодження віддаленого керування на mac
summary: Потік застосунку macOS для керування віддаленим gateway OpenClaw через SSH
title: Віддалене керування
x-i18n:
    generated_at: "2026-04-24T04:17:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Віддалений OpenClaw (macOS ⇄ віддалений хост)

Цей потік дає змогу застосунку macOS діяти як повноцінний засіб віддаленого керування для gateway OpenClaw, що працює на іншому хості (настільному комп’ютері/сервері). Це функція застосунку **Remote over SSH** (віддалений запуск). Усі можливості — перевірки стану здоров’я, переспрямування Voice Wake і Web Chat — повторно використовують ту саму віддалену SSH-конфігурацію з _Settings → General_.

## Режими

- **Local (this Mac)**: усе працює на ноутбуці. SSH не використовується.
- **Remote over SSH (default)**: команди OpenClaw виконуються на віддаленому хості. Застосунок mac відкриває SSH-з’єднання з `-o BatchMode` плюс вибраний вами identity/key і локальне переспрямування порту.
- **Remote direct (ws/wss)**: без SSH-тунелю. Застосунок mac підключається до URL gateway напряму (наприклад, через Tailscale Serve або публічний HTTPS reverse proxy).

## Віддалені транспорти

Віддалений режим підтримує два транспорти:

- **SSH tunnel** (типово): використовує `ssh -N -L ...` для переспрямування порту gateway на localhost. Gateway бачитиме IP node як `127.0.0.1`, оскільки тунель є loopback.
- **Direct (ws/wss)**: підключається безпосередньо до URL gateway. Gateway бачить справжню IP-адресу клієнта.

## Передумови на віддаленому хості

1. Установіть Node + pnpm і зберіть/установіть CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Переконайтеся, що `openclaw` є в PATH для неінтерактивних shell (за потреби створіть symlink у `/usr/local/bin` або `/opt/homebrew/bin`).
3. Відкрийте SSH з автентифікацією за ключем. Ми рекомендуємо IP-адреси **Tailscale** для стабільної доступності поза LAN.

## Налаштування застосунку macOS

1. Відкрийте _Settings → General_.
2. У розділі **OpenClaw runs** виберіть **Remote over SSH** і встановіть:
   - **Transport**: **SSH tunnel** або **Direct (ws/wss)**.
   - **SSH target**: `user@host` (необов’язково `:port`).
     - Якщо gateway знаходиться в тій самій LAN і оголошує себе через Bonjour, виберіть його зі списку виявлених, щоб автоматично заповнити це поле.
   - **Gateway URL** (лише Direct): `wss://gateway.example.ts.net` (або `ws://...` для local/LAN).
   - **Identity file** (додатково): шлях до вашого ключа.
   - **Project root** (додатково): шлях до checkout на віддаленому хості, який використовується для команд.
   - **CLI path** (додатково): необов’язковий шлях до виконуваного entrypoint/binary `openclaw` (автоматично заповнюється, якщо оголошено).
3. Натисніть **Test remote**. Успіх означає, що віддалений `openclaw status --json` виконується правильно. Збої зазвичай означають проблеми PATH/CLI; код виходу 127 означає, що CLI не знайдено на віддаленому хості.
4. Перевірки стану здоров’я та Web Chat тепер автоматично працюватимуть через цей SSH-тунель.

## Web Chat

- **SSH tunnel**: Web Chat підключається до gateway через переспрямований порт керування WebSocket (типово 18789).
- **Direct (ws/wss)**: Web Chat підключається безпосередньо до налаштованого URL gateway.
- Окремого HTTP-сервера WebChat більше немає.

## Дозволи

- Віддалений хост потребує тих самих дозволів TCC, що й локальний (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Один раз виконайте onboarding на цій машині, щоб надати їх.
- Nodes оголошують свій стан дозволів через `node.list` / `node.describe`, щоб агенти знали, що доступно.

## Примітки щодо безпеки

- Надавайте перевагу прив’язкам loopback на віддаленому хості та підключайтеся через SSH або Tailscale.
- SSH-тунелювання використовує сувору перевірку host key; спочатку довірте host key, щоб він з’явився в `~/.ssh/known_hosts`.
- Якщо ви прив’язуєте Gateway до інтерфейсу не-loopback, вимагайте дійсну автентифікацію Gateway: токен, пароль або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`.
- Див. [Безпека](/uk/gateway/security) і [Tailscale](/uk/gateway/tailscale).

## Потік входу WhatsApp (віддалено)

- Запустіть `openclaw channels login --verbose` **на віддаленому хості**. Відскануйте QR за допомогою WhatsApp на телефоні.
- Повторно запустіть вхід на тому хості, якщо автентифікація завершиться. Перевірка стану здоров’я покаже проблеми зі зв’язуванням.

## Усунення несправностей

- **exit 127 / not found**: `openclaw` відсутній у PATH для shell без входу в систему. Додайте його до `/etc/paths`, rc-файлу вашого shell або створіть symlink у `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: перевірте доступність SSH, PATH і те, що Baileys увійшов у систему (`openclaw status --json`).
- **Web Chat stuck**: переконайтеся, що gateway працює на віддаленому хості й переспрямований порт збігається з портом WS gateway; UI потребує справного WS-з’єднання.
- **Node IP shows 127.0.0.1**: це очікувано при використанні SSH tunnel. Перемкніть **Transport** на **Direct (ws/wss)**, якщо хочете, щоб gateway бачив справжню IP-адресу клієнта.
- **Voice Wake**: фрази активації автоматично переспрямовуються у віддаленому режимі; окремий переспрямовувач не потрібен.

## Звуки сповіщень

Вибирайте звуки для кожного сповіщення зі скриптів за допомогою `openclaw` і `node.invoke`, наприклад:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Глобального перемикача “типовий звук” у застосунку більше немає; виклики вибирають звук (або його відсутність) для кожного запиту окремо.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Віддалений доступ](/uk/gateway/remote)
