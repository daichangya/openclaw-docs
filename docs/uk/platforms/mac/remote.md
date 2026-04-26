---
read_when:
    - Налаштування або налагодження віддаленого керування mac
summary: Потік застосунку macOS для керування віддаленим Gateway OpenClaw через SSH
title: Віддалене керування
x-i18n:
    generated_at: "2026-04-26T04:25:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 460b32dfac9f86934b1498a2c8afb202cb609187efbcaeecc303c1d82ebd8052
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Віддалений OpenClaw (macOS ⇄ віддалений хост)

Цей сценарій дає змогу застосунку macOS виступати як повноцінне віддалене керування для Gateway OpenClaw, що працює на іншому хості (настільному комп’ютері/сервері). Це функція застосунку **Remote over SSH** (віддалений запуск). Усі функції — перевірки стану, переспрямування Voice Wake і Web Chat — повторно використовують ту саму віддалену SSH-конфігурацію з _Settings → General_.

## Режими

- **Local (this Mac)**: усе працює на ноутбуці. SSH не використовується.
- **Remote over SSH (default)**: команди OpenClaw виконуються на віддаленому хості. Застосунок mac відкриває SSH-з’єднання з `-o BatchMode`, а також із вибраним вами identity/key і локальним перенаправленням порту.
- **Remote direct (ws/wss)**: без SSH-тунелю. Застосунок mac підключається до URL Gateway напряму (наприклад, через Tailscale Serve або публічний HTTPS reverse proxy).

## Віддалені транспорти

Віддалений режим підтримує два транспорти:

- **SSH tunnel** (за замовчуванням): використовує `ssh -N -L ...` для перенаправлення порту Gateway на localhost. Gateway бачитиме IP Node як `127.0.0.1`, оскільки тунель працює через loopback.
- **Direct (ws/wss)**: підключається безпосередньо до URL Gateway. Gateway бачить реальний IP клієнта.

У режимі SSH tunnel виявлені імена хостів LAN/tailnet зберігаються як
`gateway.remote.sshTarget`. Застосунок зберігає `gateway.remote.url` на локальній
кінцевій точці тунелю, наприклад `ws://127.0.0.1:18789`, щоб CLI, Web Chat і
автоматизація браузера використовували один і той самий безпечний loopback-транспорт.

## Попередні вимоги на віддаленому хості

1. Установіть Node + pnpm і зберіть/установіть OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Переконайтеся, що `openclaw` є в PATH для неінтерактивних оболонок (за потреби створіть symlink у `/usr/local/bin` або `/opt/homebrew/bin`).
3. Увімкніть SSH з автентифікацією за ключем. Для стабільної доступності поза LAN рекомендуємо IP-адреси **Tailscale**.

## Налаштування застосунку macOS

1. Відкрийте _Settings → General_.
2. У розділі **OpenClaw runs** виберіть **Remote over SSH** і встановіть:
   - **Transport**: **SSH tunnel** або **Direct (ws/wss)**.
   - **SSH target**: `user@host` (необов’язково `:port`).
     - Якщо Gateway перебуває в тій самій LAN і транслює Bonjour, виберіть його зі списку виявлених, щоб автоматично заповнити це поле.
   - **Gateway URL** (лише Direct): `wss://gateway.example.ts.net` (або `ws://...` для локальної мережі/LAN).
   - **Identity file** (додатково): шлях до вашого ключа.
   - **Project root** (додатково): шлях до checkout на віддаленому хості, який використовується для команд.
   - **CLI path** (додатково): необов’язковий шлях до виконуваного entrypoint/binary `openclaw` (автоматично заповнюється, якщо його анонсовано).
3. Натисніть **Test remote**. Успіх означає, що віддалений `openclaw status --json` виконується правильно. Збої зазвичай означають проблеми з PATH/CLI; код завершення 127 означає, що CLI не знайдено на віддаленому хості.
4. Перевірки стану й Web Chat тепер автоматично працюватимуть через цей SSH-тунель.

## Web Chat

- **SSH tunnel**: Web Chat підключається до Gateway через перенаправлений порт керування WebSocket (типово 18789).
- **Direct (ws/wss)**: Web Chat підключається безпосередньо до налаштованого URL Gateway.
- Окремого HTTP-сервера WebChat більше немає.

## Дозволи

- Віддалений хост потребує тих самих дозволів TCC, що й локальний (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Запустіть onboarding на цій машині, щоб надати їх один раз.
- Node анонсують свій стан дозволів через `node.list` / `node.describe`, щоб агенти знали, що доступно.

## Примітки щодо безпеки

- Віддавайте перевагу прив’язкам loopback на віддаленому хості й підключайтеся через SSH або Tailscale.
- SSH-тунелювання використовує строгу перевірку ключа хоста; спочатку довірте ключу хоста, щоб він з’явився в `~/.ssh/known_hosts`.
- Якщо ви прив’язуєте Gateway до не-loopback-інтерфейсу, вимагайте дійсну автентифікацію Gateway: токен, пароль або identity-aware reverse proxy з `gateway.auth.mode: "trusted-proxy"`.
- Див. [Security](/uk/gateway/security) і [Tailscale](/uk/gateway/tailscale).

## Сценарій входу WhatsApp (віддалено)

- Запустіть `openclaw channels login --verbose` **на віддаленому хості**. Відскануйте QR-код у WhatsApp на телефоні.
- Повторно запустіть вхід на цьому хості, якщо автентифікація втратить чинність. Перевірка стану покаже проблеми з прив’язкою.

## Усунення несправностей

- **exit 127 / not found**: `openclaw` відсутній у PATH для не-login оболонок. Додайте його до `/etc/paths`, конфігурації вашої оболонки або створіть symlink у `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: перевірте доступність SSH, PATH і те, що Baileys увійшов у систему (`openclaw status --json`).
- **Web Chat stuck**: переконайтеся, що Gateway працює на віддаленому хості й що перенаправлений порт збігається з портом WS Gateway; UI потребує справного WS-з’єднання.
- **Node IP shows 127.0.0.1**: це очікувано для SSH tunnel. Перемкніть **Transport** на **Direct (ws/wss)**, якщо хочете, щоб Gateway бачив реальний IP клієнта.
- **Voice Wake**: тригерні фрази переспрямовуються автоматично у віддаленому режимі; окремий forwarder не потрібен.

## Звуки сповіщень

Вибирайте звуки окремо для кожного сповіщення зі скриптів за допомогою `openclaw` і `node.invoke`, наприклад:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Глобального перемикача «звук за замовчуванням» у застосунку більше немає; ті, хто викликає запит, вибирають звук (або його відсутність) окремо для кожного запиту.

## Пов’язане

- [macOS app](/uk/platforms/macos)
- [Remote access](/uk/gateway/remote)
