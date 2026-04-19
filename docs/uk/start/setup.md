---
read_when:
    - Налаштування нової машини
    - Ви хочете отримати «найновіше й найкраще», не ламаючи своє особисте налаштування.
summary: Розширене налаштування та робочі процеси розробки для OpenClaw
title: Налаштування
x-i18n:
    generated_at: "2026-04-19T06:50:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# Налаштування

<Note>
Якщо ви налаштовуєте все вперше, почніть із [Початок роботи](/uk/start/getting-started).
Докладніше про онбординг дивіться в [Онбординг (CLI)](/uk/start/wizard).
</Note>

## Коротко

- **Персоналізація зберігається поза репозиторієм:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (config).
- **Стабільний робочий процес:** встановіть застосунок macOS; дозвольте йому запускати вбудований Gateway.
- **Найновіший робочий процес:** запускайте Gateway самостійно через `pnpm gateway:watch`, а потім дозвольте застосунку macOS підключитися в режимі Local.

## Передумови (зі source)

- Рекомендовано Node 24 (Node 22 LTS, наразі `22.14+`, також підтримується)
- Бажано `pnpm` (або Bun, якщо ви свідомо використовуєте [робочий процес Bun](/uk/install/bun))
- Docker (необов’язково; лише для контейнеризованого налаштування/e2e — див. [Docker](/uk/install/docker))

## Стратегія персоналізації (щоб оновлення не шкодили)

Якщо ви хочете «100% налаштовано під мене» _і_ прості оновлення, зберігайте свої налаштування в:

- **Config:** `~/.openclaw/openclaw.json` (щось на кшталт JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memories; зробіть це приватним git-репозиторієм)

Одноразове початкове налаштування:

```bash
openclaw setup
```

Усередині цього репозиторію використовуйте локальний запис CLI:

```bash
openclaw setup
```

Якщо у вас ще немає глобального встановлення, запустіть через `pnpm openclaw setup` (або `bun run openclaw setup`, якщо ви використовуєте робочий процес Bun).

## Запуск Gateway з цього репозиторію

Після `pnpm build` ви можете запускати запакований CLI напряму:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабільний робочий процес (спочатку застосунок macOS)

1. Встановіть і запустіть **OpenClaw.app** (рядок меню).
2. Завершіть чекліст онбордингу/дозволів (запити TCC).
3. Переконайтеся, що Gateway у режимі **Local** і запущений (застосунок керує ним).
4. Підключіть канали (приклад: WhatsApp):

```bash
openclaw channels login
```

5. Швидка перевірка:

```bash
openclaw health
```

Якщо онбординг недоступний у вашій збірці:

- Запустіть `openclaw setup`, потім `openclaw channels login`, а потім вручну запустіть Gateway (`openclaw gateway`).

## Найновіший робочий процес (Gateway у терміналі)

Мета: працювати з Gateway на TypeScript, отримати гаряче перезавантаження та зберегти підключений UI застосунку macOS.

### 0) (Необов’язково) Також запускайте застосунок macOS зі source

Якщо ви також хочете використовувати застосунок macOS у найновішому режимі:

```bash
./scripts/restart-mac.sh
```

### 1) Запустіть dev Gateway

```bash
pnpm install
# Лише під час першого запуску (або після скидання локальних config/workspace OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` запускає gateway у режимі watch і перезавантажує його після відповідних змін у source,
config і метаданих вбудованих Plugin.
`pnpm openclaw setup` — це одноразовий крок ініціалізації локальних config/workspace для свіжого checkout.
`pnpm gateway:watch` не перебудовує `dist/control-ui`, тому після змін у `ui/` повторно запускайте `pnpm ui:build` або використовуйте `pnpm ui:dev` під час розробки Control UI.

Якщо ви свідомо використовуєте робочий процес Bun, еквівалентні команди такі:

```bash
bun install
# Лише під час першого запуску (або після скидання локальних config/workspace OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Спрямуйте застосунок macOS на ваш запущений Gateway

У **OpenClaw.app**:

- Режим підключення: **Local**
  Застосунок підключиться до запущеного gateway на налаштованому порту.

### 3) Перевірте

- У застосунку статус Gateway має показувати **«Using existing gateway …»**
- Або через CLI:

```bash
openclaw health
```

### Поширені підводні камені

- **Неправильний порт:** WS Gateway типово використовує `ws://127.0.0.1:18789`; застосунок і CLI мають використовувати той самий порт.
- **Де зберігається стан:**
  - Стан каналів/провайдерів: `~/.openclaw/credentials/`
  - Профілі auth моделей: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Сесії: `~/.openclaw/agents/<agentId>/sessions/`
  - Логи: `/tmp/openclaw/`

## Карта зберігання облікових даних

Використовуйте це під час налагодження auth або щоб вирішити, що саме варто резервувати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен Telegram-бота**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються)
- **Токен Discord-бота**: config/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Allowlist для парування**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (обліковий запис за замовчуванням)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (облікові записи не за замовчуванням)
- **Профілі auth моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload секретів, що зберігається у файлі (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`
  Докладніше: [Безпека](/uk/gateway/security#credential-storage-map).

## Оновлення (не руйнуючи ваше налаштування)

- Зберігайте `~/.openclaw/workspace` і `~/.openclaw/` як «ваші дані»; не кладіть особисті prompts/config у репозиторій `openclaw`.
- Оновлення source: `git pull` + вибраний вами крок встановлення пакетного менеджера (`pnpm install` за замовчуванням; `bun install` для робочого процесу Bun) + і далі використовуйте відповідну команду `gateway:watch`.

## Linux (сервіс systemd користувача)

Встановлення Linux використовують **користувацький** сервіс systemd. Типово systemd зупиняє
користувацькі сервіси під час виходу з системи/бездіяльності, що зупиняє Gateway. Онбординг намагається
увімкнути lingering за вас (може попросити sudo). Якщо це все ще вимкнено, виконайте:

```bash
sudo loginctl enable-linger $USER
```

Для серверів, що мають працювати постійно або обслуговувати кількох користувачів, розгляньте **системний** сервіс замість
користувацького сервісу (lingering не потрібен). Див. [Інструкцію з експлуатації Gateway](/uk/gateway) щодо приміток про systemd.

## Пов’язані документи

- [Інструкція з експлуатації Gateway](/uk/gateway) (прапорці, супервізія, порти)
- [Конфігурація Gateway](/uk/gateway/configuration) (схема config + приклади)
- [Discord](/uk/channels/discord) і [Telegram](/uk/channels/telegram) (теги відповіді + налаштування replyToMode)
- [Налаштування асистента OpenClaw](/uk/start/openclaw)
- [застосунок macOS](/uk/platforms/macos) (життєвий цикл gateway)
