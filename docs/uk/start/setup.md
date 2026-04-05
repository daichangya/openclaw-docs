---
read_when:
    - Налаштування нової машини
    - Ви хочете “latest + greatest” без шкоди для свого особистого налаштування
summary: Розширене налаштування та робочі процеси розробки для OpenClaw
title: Налаштування
x-i18n:
    generated_at: "2026-04-05T18:18:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# Налаштування

<Note>
Якщо ви налаштовуєте все вперше, почніть із [Getting Started](/start/getting-started).
Подробиці онбордингу дивіться в [Onboarding (CLI)](/start/wizard).
</Note>

## TL;DR

- **Користувацькі налаштування зберігаються поза репозиторієм:** `~/.openclaw/workspace` (робочий простір) + `~/.openclaw/openclaw.json` (конфігурація).
- **Стабільний робочий процес:** установіть застосунок macOS і дозвольте йому запускати вбудований Gateway.
- **Робочий процес на bleeding edge:** запускайте Gateway самостійно через `pnpm gateway:watch`, а потім дозвольте застосунку macOS підключитися в режимі Local.

## Передумови (зі source-коду)

- Рекомендовано Node 24 (Node 22 LTS, наразі `22.14+`, також підтримується)
- Бажано `pnpm` (або Bun, якщо ви свідомо використовуєте [робочий процес Bun](/uk/install/bun))
- Docker (необов’язково; лише для контейнеризованого налаштування/e2e — див. [Docker](/uk/install/docker))

## Стратегія кастомізації (щоб оновлення не шкодили)

Якщо ви хочете “100% tailored to me” _і_ простих оновлень, зберігайте свою кастомізацію в:

- **Конфігурації:** `~/.openclaw/openclaw.json` (щось на кшталт JSON/JSON5)
- **Робочому просторі:** `~/.openclaw/workspace` (skills, prompts, memories; зробіть його приватним git-репозиторієм)

Одноразове bootstrap-налаштування:

```bash
openclaw setup
```

Зсередини цього репозиторію використовуйте локальну точку входу CLI:

```bash
openclaw setup
```

Якщо у вас ще немає глобального встановлення, запустіть через `pnpm openclaw setup` (або `bun run openclaw setup`, якщо ви використовуєте робочий процес Bun).

## Запуск Gateway з цього репозиторію

Після `pnpm build` ви можете запускати зібраний CLI напряму:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабільний робочий процес (спочатку застосунок macOS)

1. Установіть і запустіть **OpenClaw.app** (рядок меню).
2. Завершіть чекліст онбордингу/дозволів (запити TCC).
3. Переконайтеся, що Gateway перебуває в режимі **Local** і запущений (застосунок керує ним).
4. Підключіть поверхні (наприклад: WhatsApp):

```bash
openclaw channels login
```

5. Швидка перевірка:

```bash
openclaw health
```

Якщо у вашій збірці онбординг недоступний:

- Запустіть `openclaw setup`, потім `openclaw channels login`, а потім вручну запустіть Gateway (`openclaw gateway`).

## Робочий процес на bleeding edge (Gateway у терміналі)

Мета: працювати над TypeScript Gateway, отримати hot reload і зберегти підключення UI застосунку macOS.

### 0) (Необов’язково) Також запускайте застосунок macOS із source-коду

Якщо ви теж хочете мати застосунок macOS на bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Запустіть dev Gateway

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` запускає gateway у режимі спостереження та перезавантажує його при релевантних змінах source-коду,
конфігурації та метаданих комплектних плагінів.

Якщо ви свідомо використовуєте робочий процес Bun, еквівалентні команди такі:

```bash
bun install
bun run gateway:watch
```

### 2) Спрямуйте застосунок macOS на ваш запущений Gateway

У **OpenClaw.app**:

- Режим підключення: **Local**
  Застосунок підключиться до запущеного gateway на налаштованому порту.

### 3) Перевірте

- У застосунку статус Gateway має показувати **“Using existing gateway …”**
- Або через CLI:

```bash
openclaw health
```

### Поширені пастки

- **Неправильний порт:** WS Gateway типово використовує `ws://127.0.0.1:18789`; застосунок і CLI мають використовувати той самий порт.
- **Де зберігається стан:**
  - Стан каналів/провайдерів: `~/.openclaw/credentials/`
  - Профілі автентифікації моделей: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Сесії: `~/.openclaw/agents/<agentId>/sessions/`
  - Журнали: `/tmp/openclaw/`

## Карта зберігання облікових даних

Використовуйте це під час налагодження автентифікації або щоб вирішити, що слід резервно копіювати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен бота Telegram**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; симлінки відхиляються)
- **Токен бота Discord**: config/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Списки дозволених для сполучення**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (типовий акаунт)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (нетипові акаунти)
- **Профілі автентифікації моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Корисне навантаження секретів із файловим бекендом (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`
  Докладніше: [Безпека](/uk/gateway/security#credential-storage-map).

## Оновлення (без руйнування вашого налаштування)

- Зберігайте `~/.openclaw/workspace` і `~/.openclaw/` як “ваші дані”; не розміщуйте особисті prompts/конфігурацію в репозиторії `openclaw`.
- Оновлення source-коду: `git pull` + обраний вами крок встановлення пакетного менеджера (`pnpm install` типово; `bun install` для робочого процесу Bun) + продовжуйте використовувати відповідну команду `gateway:watch`.

## Linux (сервіс користувача systemd)

Установлення на Linux використовують сервіс systemd **user**. Типово systemd зупиняє користувацькі
сервіси під час виходу з системи/бездіяльності, що вимикає Gateway. Онбординг намагається увімкнути
linger за вас (може запитати sudo). Якщо це все ще вимкнено, виконайте:

```bash
sudo loginctl enable-linger $USER
```

Для завжди увімкнених або багатокористувацьких серверів розгляньте **system**-сервіс замість
користувацького сервісу (linger не потрібен). Див. [операційний посібник Gateway](/uk/gateway) щодо приміток про systemd.

## Пов’язана документація

- [Операційний посібник Gateway](/uk/gateway) (прапорці, супервізія, порти)
- [Конфігурація Gateway](/uk/gateway/configuration) (схема конфігурації + приклади)
- [Discord](/uk/channels/discord) і [Telegram](/uk/channels/telegram) (теги відповідей + налаштування replyToMode)
- [Налаштування помічника OpenClaw](/start/openclaw)
- [Застосунок macOS](/uk/platforms/macos) (життєвий цикл gateway)
