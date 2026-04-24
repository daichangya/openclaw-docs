---
read_when:
    - Налаштування або налагодження віддаленого керування mac
summary: Потік застосунку macOS для керування віддаленим Gateway OpenClaw через SSH
title: Віддалене керування
x-i18n:
    generated_at: "2026-04-24T03:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17992eeb20fc6a463e12222547a8c90a34e6bbd94907e02d5033c18a31f776d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Віддалений OpenClaw (macOS ⇄ віддалений host)

Цей потік дозволяє застосунку macOS діяти як повноцінне віддалене керування для Gateway OpenClaw, що працює на іншому host (desktop/server). Це функція застосунку **Remote over SSH** (віддалений запуск). Усі функції — перевірки стану, переспрямування Voice Wake і Web Chat — повторно використовують ту саму віддалену SSH-конфігурацію з _Settings → General_.

## Режими

- **Local (цей Mac)**: Усе працює на ноутбуці. SSH не використовується.
- **Remote over SSH (типово)**: Команди OpenClaw виконуються на віддаленому host. Застосунок mac відкриває SSH-з’єднання з `-o BatchMode`, а також використовує вибрану вами identity/key і локальне переспрямування порту.
- **Remote direct (ws/wss)**: Без SSH-тунелю. Застосунок mac напряму підключається до URL Gateway (наприклад, через Tailscale Serve або публічний HTTPS reverse proxy).

## Віддалені transport

Віддалений режим підтримує два transport:

- **SSH tunnel** (типово): Використовує `ssh -N -L ...` для переспрямування порту Gateway на localhost. Gateway бачитиме IP Node як `127.0.0.1`, оскільки тунель працює через loopback.
- **Direct (ws/wss)**: Підключається безпосередньо до URL Gateway. Gateway бачить реальний IP клієнта.

## Передумови на віддаленому host

1. Встановіть Node + pnpm і зберіть/встановіть CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Переконайтеся, що `openclaw` є в PATH для неінтерактивних shell (за потреби створіть symlink у `/usr/local/bin` або `/opt/homebrew/bin`).
3. Відкрийте SSH з автентифікацією ключем. Для стабільної доступності поза LAN рекомендуємо IP-адреси **Tailscale**.

## Налаштування застосунку macOS

1. Відкрийте _Settings → General_.
2. У розділі **OpenClaw runs** виберіть **Remote over SSH** і задайте:
   - **Transport**: **SSH tunnel** або **Direct (ws/wss)**.
   - **SSH target**: `user@host` (необов’язково `:port`).
     - Якщо Gateway знаходиться в тій самій LAN і анонсує себе через Bonjour, виберіть його зі списку знайдених, щоб автоматично заповнити це поле.
   - **Gateway URL** (лише Direct): `wss://gateway.example.ts.net` (або `ws://...` для local/LAN).
   - **Identity file** (додатково): шлях до вашого ключа.
   - **Project root** (додатково): шлях до віддаленого checkout, який використовується для команд.
   - **CLI path** (додатково): необов’язковий шлях до придатного для запуску entrypoint/binary `openclaw` (автоматично заповнюється, якщо його анонсовано).
3. Натисніть **Test remote**. Успіх означає, що віддалена команда `openclaw status --json` виконується коректно. Збої зазвичай означають проблеми з PATH/CLI; код виходу 127 означає, що CLI не знайдено на віддаленому боці.
4. Перевірки стану та Web Chat тепер автоматично працюватимуть через цей SSH-тунель.

## Web Chat

- **SSH tunnel**: Web Chat підключається до Gateway через переспрямований порт керування WebSocket (типово 18789).
- **Direct (ws/wss)**: Web Chat підключається безпосередньо до налаштованого URL Gateway.
- Окремого HTTP-сервера WebChat більше немає.

## Дозволи

- Віддалений host потребує тих самих дозволів TCC, що й локальна машина (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Запустіть onboarding на цій машині один раз, щоб надати їх.
- Node анонсують свій стан дозволів через `node.list` / `node.describe`, щоб агенти знали, що доступно.

## Примітки щодо безпеки

- Віддавайте перевагу bind на loopback на віддаленому host і підключайтеся через SSH або Tailscale.
- SSH-тунелювання використовує сувору перевірку host key; спочатку довіртеся host key, щоб він з’явився в `~/.ssh/known_hosts`.
- Якщо ви прив’язуєте Gateway до інтерфейсу, відмінного від loopback, вимагайте чинну автентифікацію Gateway: token, password або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`.
- Див. [Security](/uk/gateway/security) і [Tailscale](/uk/gateway/tailscale).

## Потік входу WhatsApp (віддалено)

- Запустіть `openclaw channels login --verbose` **на віддаленому host**. Відскануйте QR у WhatsApp на своєму телефоні.
- Повторно виконайте вхід на цьому host, якщо автентифікація спливе. Перевірка стану покаже проблеми зі з’єднанням.

## Усунення проблем

- **exit 127 / not found**: `openclaw` відсутній у PATH для non-login shell. Додайте його до `/etc/paths`, rc-файлу вашого shell або створіть symlink у `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: перевірте доступність SSH, PATH і те, що Baileys увійшов у систему (`openclaw status --json`).
- **Web Chat stuck**: переконайтеся, що Gateway працює на віддаленому host і що переспрямований порт відповідає WS-порту Gateway; UI потребує справного WS-з’єднання.
- **Node IP shows 127.0.0.1**: це очікувано при використанні SSH tunnel. Перемкніть **Transport** на **Direct (ws/wss)**, якщо хочете, щоб Gateway бачив реальний IP клієнта.
- **Voice Wake**: trigger phrases автоматично переспрямовуються у віддаленому режимі; окремий forwarder не потрібен.

## Звуки сповіщень

Вибирайте звуки для кожного сповіщення зі скриптів за допомогою `openclaw` і `node.invoke`, наприклад:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Глобального перемикача “default sound” у застосунку більше немає; виклики вибирають звук (або його відсутність) окремо для кожного запиту.
