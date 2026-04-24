---
read_when:
    - Початкове налаштування нового екземпляра асистента
    - Огляд наслідків для безпеки/дозволів
summary: Повний посібник із запуску OpenClaw як персонального асистента із застереженнями щодо безпеки
title: Налаштування персонального асистента
x-i18n:
    generated_at: "2026-04-24T04:19:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3048f2faae826fc33d962f1fac92da3c0ce464d2de803fee381c897eb6c76436
    source_path: start/openclaw.md
    workflow: 15
---

# Створення персонального асистента з OpenClaw

OpenClaw — це self-hosted gateway, який підключає Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo та інші сервіси до AI-агентів. Цей посібник охоплює налаштування «персонального асистента»: окремий номер WhatsApp, який працює як ваш завжди доступний AI-асистент.

## ⚠️ Спочатку про безпеку

Ви надаєте агенту можливість:

- запускати команди на вашій машині (залежно від вашої політики інструментів)
- читати/записувати файли у вашому робочому просторі
- надсилати повідомлення назад через WhatsApp/Telegram/Discord/Mattermost та інші вбудовані канали

Починайте консервативно:

- Завжди задавайте `channels.whatsapp.allowFrom` (ніколи не запускайте все відкритим для світу на своєму особистому Mac).
- Використовуйте окремий номер WhatsApp для асистента.
- Heartbeat тепер типово запускається кожні 30 хвилин. Вимкніть його, доки не почнете довіряти цьому налаштуванню, встановивши `agents.defaults.heartbeat.every: "0m"`.

## Передумови

- OpenClaw встановлено й початково налаштовано — див. [Початок роботи](/uk/start/getting-started), якщо ви ще цього не зробили
- Другий номер телефону (SIM/eSIM/передплачений тариф) для асистента

## Налаштування з двома телефонами (рекомендовано)

Вам потрібно ось так:

```mermaid
flowchart TB
    A["<b>Ваш телефон (особистий)<br></b><br>Ваш WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Другий телефон (асистент)<br></b><br>WhatsApp асистента<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Ваш Mac (openclaw)<br></b><br>AI-агент"]
```

Якщо ви прив’яжете свій особистий WhatsApp до OpenClaw, кожне повідомлення вам стане «входом агента». Зазвичай це не те, що вам потрібно.

## Швидкий старт за 5 хвилин

1. Сполучіть WhatsApp Web (буде показано QR; відскануйте його телефоном асистента):

```bash
openclaw channels login
```

2. Запустіть Gateway (залиште його працювати):

```bash
openclaw gateway --port 18789
```

3. Додайте мінімальну конфігурацію до `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Тепер надішліть повідомлення на номер асистента зі свого телефону, який є в allowlist.

Коли початкове налаштування завершиться, OpenClaw автоматично відкриє dashboard і виведе чисте посилання (без токена). Якщо dashboard просить автентифікацію, вставте налаштований shared secret у налаштуваннях Control UI. Під час onboarding типово використовується токен (`gateway.auth.token`), але автентифікація паролем теж працює, якщо ви перемкнули `gateway.auth.mode` на `password`. Щоб знову відкрити пізніше: `openclaw dashboard`.

## Надайте агенту робочий простір (AGENTS)

OpenClaw читає робочі інструкції та «пам’ять» із каталогу робочого простору.

Типово OpenClaw використовує `~/.openclaw/workspace` як робочий простір агента й автоматично створює його (разом із початковими `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) під час налаштування/першого запуску агента. `BOOTSTRAP.md` створюється лише тоді, коли робочий простір абсолютно новий (він не має повертатися після того, як ви його видалите). `MEMORY.md` є необов’язковим (не створюється автоматично); якщо файл існує, його буде завантажено для звичайних сесій. Сесії субагентів інжектують лише `AGENTS.md` і `TOOLS.md`.

Порада: сприймайте цю папку як «пам’ять» OpenClaw і зробіть її git-репозиторієм (бажано приватним), щоб ваші `AGENTS.md` і файли пам’яті були збережені в резервній копії. Якщо git встановлено, абсолютно нові робочі простори ініціалізуються автоматично.

```bash
openclaw setup
```

Повна структура робочого простору + посібник із резервного копіювання: [Робочий простір агента](/uk/concepts/agent-workspace)
Робочий процес пам’яті: [Пам’ять](/uk/concepts/memory)

Необов’язково: виберіть інший робочий простір через `agents.defaults.workspace` (підтримується `~`).

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

Якщо ви вже постачаєте власні файли робочого простору з репозиторію, можна повністю вимкнути створення bootstrap-файлів:

```json5
{
  agent: {
    skipBootstrap: true,
  },
}
```

## Конфігурація, яка перетворює це на «асистента»

OpenClaw типово має гарне налаштування для асистента, але зазвичай вам варто підлаштувати:

- persona/інструкції в [`SOUL.md`](/uk/concepts/soul)
- типові параметри thinking (за потреби)
- Heartbeat (коли почнете довіряти системі)

Приклад:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Починайте з 0; увімкніть пізніше.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Сесії та пам’ять

- Файли сесій: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Метадані сесій (використання токенів, останній маршрут тощо): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (застарілий шлях: `~/.openclaw/sessions/sessions.json`)
- `/new` або `/reset` починає нову сесію для цього чату (налаштовується через `resetTriggers`). Якщо команду надіслано окремо, агент відповідає коротким привітанням для підтвердження скидання.
- `/compact [instructions]` виконує Compaction контексту сесії та повідомляє про залишковий бюджет контексту.

## Heartbeat (проактивний режим)

Типово OpenClaw запускає Heartbeat кожні 30 хвилин із таким запитом:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Щоб вимкнути, встановіть `agents.defaults.heartbeat.every: "0m"`.

- Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб зекономити виклики API.
- Якщо файл відсутній, Heartbeat усе одно запускається, і модель сама вирішує, що робити.
- Якщо агент відповідає `HEARTBEAT_OK` (необов’язково з коротким доповненням; див. `agents.defaults.heartbeat.ackMaxChars`), OpenClaw пригнічує вихідну доставку для цього Heartbeat.
- Типово доставка Heartbeat до цілей у стилі DM `user:<id>` дозволена. Установіть `agents.defaults.heartbeat.directPolicy: "block"`, щоб заборонити доставку до прямих цілей, зберігши самі запуски Heartbeat активними.
- Heartbeat виконує повні ходи агента — коротші інтервали спалюють більше токенів.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Медіа на вхід і вихід

Вхідні вкладення (зображення/аудіо/документи) можуть передаватися у вашу команду через шаблони:

- `{{MediaPath}}` (шлях до локального тимчасового файла)
- `{{MediaUrl}}` (псевдо-URL)
- `{{Transcript}}` (якщо увімкнено транскрибування аудіо)

Вихідні вкладення від агента: додайте `MEDIA:<path-or-url>` в окремому рядку (без пробілів). Приклад:

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw витягує їх і надсилає як медіа разом із текстом.

Поведінка локальних шляхів дотримується тієї самої моделі довіри до читання файлів, що й агент:

- Якщо `tools.fs.workspaceOnly` має значення `true`, локальні шляхи вихідних `MEDIA:` залишаються обмеженими тимчасовим коренем OpenClaw, кешем медіа, шляхами робочого простору агента та файлами, згенерованими в sandbox.
- Якщо `tools.fs.workspaceOnly` має значення `false`, вихідні `MEDIA:` можуть використовувати локальні файли хоста, які агенту вже дозволено читати.
- Надсилання локальних файлів хоста все одно дозволяє лише медіа та безпечні типи документів (зображення, аудіо, відео, PDF і документи Office). Звичайний текст і файли, схожі на секрети, не вважаються медіа, які можна надсилати.

Це означає, що згенеровані зображення/файли поза робочим простором тепер можна надсилати, якщо ваша політика fs уже дозволяє таке читання, без повторного відкриття довільної ексфільтрації текстових вкладень із хоста.

## Контрольний список операцій

```bash
openclaw status          # локальний стан (облікові дані, сесії, події в черзі)
openclaw status --all    # повна діагностика (лише читання, можна вставляти)
openclaw status --deep   # запитує gateway про живу перевірку стану з перевірками каналів, коли це підтримується
openclaw health --json   # знімок стану gateway (WS; типово може повертати свіжий кешований знімок)
```

Журнали розміщуються в `/tmp/openclaw/` (типово: `openclaw-YYYY-MM-DD.log`).

## Наступні кроки

- WebChat: [WebChat](/uk/web/webchat)
- Операції Gateway: [Runbook Gateway](/uk/gateway)
- Cron + пробудження: [Cron jobs](/uk/automation/cron-jobs)
- Компаньйон у рядку меню macOS: [Застосунок OpenClaw для macOS](/uk/platforms/macos)
- Застосунок Node для iOS: [Застосунок iOS](/uk/platforms/ios)
- Застосунок Node для Android: [Застосунок Android](/uk/platforms/android)
- Стан Windows: [Windows (WSL2)](/uk/platforms/windows)
- Стан Linux: [Застосунок Linux](/uk/platforms/linux)
- Безпека: [Безпека](/uk/gateway/security)

## Пов’язане

- [Початок роботи](/uk/start/getting-started)
- [Налаштування](/uk/start/setup)
- [Огляд каналів](/uk/channels)
