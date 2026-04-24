---
read_when:
    - Налаштування нової машини
    - Ви хочете мати “найновіше й найкраще”, не ламаючи своє особисте налаштування
summary: Розширене налаштування та робочі процеси розробки для OpenClaw
title: Налаштування
x-i18n:
    generated_at: "2026-04-24T03:49:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
Якщо ви налаштовуєте все вперше, почніть із [Getting Started](/uk/start/getting-started).
Докладніше про onboarding див. у [Onboarding (CLI)](/uk/start/wizard).
</Note>

## Коротко

Виберіть сценарій налаштування залежно від того, як часто ви хочете отримувати оновлення і чи хочете запускати Gateway самостійно:

- **Індивідуальне налаштування живе поза репозиторієм:** зберігайте свою конфігурацію і workspace у `~/.openclaw/openclaw.json` та `~/.openclaw/workspace/`, щоб оновлення репозиторію їх не зачіпали.
- **Стабільний сценарій (рекомендовано для більшості):** встановіть застосунок macOS і дозвольте йому запускати вбудований Gateway.
- **Найсвіжіший сценарій (dev):** запускайте Gateway самостійно через `pnpm gateway:watch`, а потім під’єднуйте застосунок macOS у режимі Local.

## Передумови (зі source)

- Рекомендовано Node 24 (Node 22 LTS, наразі `22.14+`, також підтримується)
- Бажано `pnpm` (або Bun, якщо ви свідомо використовуєте [сценарій Bun](/uk/install/bun))
- Docker (необов’язково; лише для контейнеризованого налаштування/e2e — див. [Docker](/uk/install/docker))

## Стратегія індивідуального налаштування (щоб оновлення не шкодили)

Якщо ви хочете “100% підлаштовано під мене” _і_ прості оновлення, зберігайте свої налаштування тут:

- **Config:** `~/.openclaw/openclaw.json` (щось на кшталт JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompt, memory; зробіть це приватним git-репозиторієм)

Одноразова ініціалізація:

```bash
openclaw setup
```

Усередині цього репозиторію використовуйте локальний запис CLI:

```bash
openclaw setup
```

Якщо у вас ще немає глобального встановлення, запустіть це через `pnpm openclaw setup` (або `bun run openclaw setup`, якщо ви використовуєте сценарій Bun).

## Запуск Gateway з цього репозиторію

Після `pnpm build` ви можете напряму запускати пакетований CLI:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабільний сценарій (спочатку застосунок macOS)

1. Встановіть і запустіть **OpenClaw.app** (рядок меню).
2. Завершіть чекліст onboarding/дозволів (запити TCC).
3. Переконайтеся, що Gateway у режимі **Local** і працює (застосунок керує ним).
4. Під’єднайте поверхні (приклад: WhatsApp):

```bash
openclaw channels login
```

5. Базова перевірка:

```bash
openclaw health
```

Якщо у вашій збірці onboarding недоступний:

- Запустіть `openclaw setup`, потім `openclaw channels login`, а тоді запустіть Gateway вручну (`openclaw gateway`).

## Найсвіжіший сценарій (Gateway у терміналі)

Мета: працювати над TypeScript Gateway, отримати hot reload і залишити UI застосунку macOS під’єднаним.

### 0) (Необов’язково) Також запускайте застосунок macOS зі source

Якщо ви також хочете, щоб застосунок macOS був у найсвіжішому стані:

```bash
./scripts/restart-mac.sh
```

### 1) Запустіть dev Gateway

```bash
pnpm install
# Лише для першого запуску (або після скидання локальної config/workspace OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` запускає gateway у режимі watch і перезавантажує його після змін у relevant source,
config і метаданих вбудованих Plugin.
`pnpm openclaw setup` — це одноразовий крок ініціалізації локальної config/workspace для нового checkout.
`pnpm gateway:watch` не перебудовує `dist/control-ui`, тому після змін у `ui/` повторно запускайте `pnpm ui:build` або використовуйте `pnpm ui:dev` під час розробки Control UI.

Якщо ви свідомо використовуєте сценарій Bun, еквівалентні команди такі:

```bash
bun install
# Лише для першого запуску (або після скидання локальної config/workspace OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Спрямуйте застосунок macOS на ваш запущений Gateway

У **OpenClaw.app**:

- Connection Mode: **Local**
  Застосунок під’єднається до запущеного gateway на налаштованому порту.

### 3) Перевірте

- У застосунку статус Gateway має показувати **“Using existing gateway …”**
- Або через CLI:

```bash
openclaw health
```

### Поширені підводні камені

- **Неправильний порт:** типове значення Gateway WS — `ws://127.0.0.1:18789`; застосунок і CLI мають використовувати той самий порт.
- **Де зберігається стан:**
  - Стан каналу/провайдера: `~/.openclaw/credentials/`
  - Профілі автентифікації моделей: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Сесії: `~/.openclaw/agents/<agentId>/sessions/`
  - Журнали: `/tmp/openclaw/`

## Мапа зберігання облікових даних

Використовуйте це під час налагодження автентифікації або коли вирішуєте, що резервувати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен бота Telegram**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються)
- **Токен бота Discord**: config/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Allowlist pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (обліковий запис default)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (не-default облікові записи)
- **Профілі автентифікації моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload секретів на основі файлу (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`
  Докладніше: [Security](/uk/gateway/security#credential-storage-map).

## Оновлення (не ламаючи ваше налаштування)

- Вважайте `~/.openclaw/workspace` і `~/.openclaw/` “вашими даними”; не зберігайте особисті prompt/config у репозиторії `openclaw`.
- Оновлення source: `git pull` + вибраний вами крок встановлення менеджера пакетів (`pnpm install` типово; `bun install` для сценарію Bun) + далі використовуйте відповідну команду `gateway:watch`.

## Linux (користувацький сервіс systemd)

Встановлення на Linux використовують **користувацький** сервіс systemd. Типово systemd зупиняє користувацькі
сервіси під час виходу/бездіяльності, що вбиває Gateway. Onboarding намагається увімкнути
lingering за вас (може запитати sudo). Якщо це все ще вимкнено, виконайте:

```bash
sudo loginctl enable-linger $USER
```

Для серверів, які мають працювати постійно або для кількох користувачів, розгляньте **системний** сервіс замість
користувацького сервісу (lingering не потрібен). Див. [Gateway runbook](/uk/gateway) щодо приміток про systemd.

## Пов’язана документація

- [Gateway runbook](/uk/gateway) (прапорці, супервізія, порти)
- [Gateway configuration](/uk/gateway/configuration) (схема config + приклади)
- [Discord](/uk/channels/discord) і [Telegram](/uk/channels/telegram) (теги відповідей + налаштування replyToMode)
- [Налаштування асистента OpenClaw](/uk/start/openclaw)
- [Застосунок macOS](/uk/platforms/macos) (життєвий цикл gateway)
