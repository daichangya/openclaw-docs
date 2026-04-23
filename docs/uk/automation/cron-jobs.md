---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook-и, Gmail) до OpenClaw
    - Вибір між heartbeat і Cron для запланованих завдань
summary: Заплановані завдання, Webhook-и та тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-04-23T19:23:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 023e8a73e028d0b5a466e9d933b8033604ba1066641cf29c8415ba9e5ac12447
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Заплановані завдання (Cron)

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може повертати результат назад у чат-канал або до Webhook endpoint.

## Швидкий старт

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## Як працює cron

- Cron працює **всередині процесу Gateway** (не всередині моделі).
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому перезапуски не призводять до втрати розкладів.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json` і додайте `jobs-state.json` до gitignore.
- Після розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть вважати завдання новими, оскільки поля стану виконання тепер містяться в `jobs-state.json`.
- Усі виконання cron створюють записи [фонових завдань](/uk/automation/tasks).
- Одноразові завдання (`--at`) типово автоматично видаляються після успішного виконання.
- Ізольовані запуски cron під час завершення виконання в режимі best-effort закривають відстежувані вкладки/процеси браузера для своєї сесії `cron:<jobId>`, щоб відокремлена автоматизація браузера не залишала сирітських процесів.
- Ізольовані запуски cron також захищають від застарілих відповідей-підтверджень. Якщо
  перший результат — це лише проміжне оновлення статусу (`on it`, `pulling everything
together` та подібні підказки), і жоден дочірній запуск subagent усе ще не
  відповідає за фінальну відповідь, OpenClaw повторно надсилає запит один раз, щоб отримати фактичний
  результат перед доставкою.

<a id="maintenance"></a>

Узгодження завдань для cron належить до виконання під час роботи: активне cron-завдання залишається активним, доки
середовище виконання cron все ще відстежує це завдання як запущене, навіть якщо старий рядок дочірньої сесії все ще існує.
Коли середовище виконання більше не володіє завданням і спливає 5-хвилинне вікно очікування, обслуговування може
позначити завдання як `lost`.

## Типи розкладу

| Тип     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова мітка часу (ISO 8601 або відносна, наприклад `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | 5-польовий або 6-польовий cron-вираз з необов’язковим `--tz` |

Мітки часу без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним часом.

Періодичні вирази на початку години автоматично розносяться в часі до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово встановити точний час, або `--stagger 30s` для явного вікна.

### День місяця і день тижня використовують логіку OR

Cron-вирази розбираються за допомогою [croner](https://github.com/Hexagon/croner). Коли і поле дня місяця, і поле дня тижня не є wildcard, croner виконує збіг, якщо **збігається будь-яке** з цих полів, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. Тут OpenClaw використовує стандартну OR-поведінку Croner. Щоб вимагати виконання обох умов, використовуйте модифікатор дня тижня `+` у Croner (`0 9 15 * +1`) або плануйте за одним полем, а інше перевіряйте в prompt чи команді вашого завдання.

## Стилі виконання

| Стиль          | Значення `--session` | Виконується в           | Найкраще підходить для          |
| -------------- | -------------------- | ----------------------- | ------------------------------- |
| Основна сесія  | `main`               | Наступний цикл heartbeat | Нагадувань, системних подій     |
| Ізольований    | `isolated`           | Виділена `cron:<jobId>` | Звітів, фонових задач           |
| Поточна сесія  | `current`            | Прив’язується під час створення | Періодичної роботи з урахуванням контексту |
| Власна сесія   | `session:custom-id`  | Постійна іменована сесія | Робочих процесів, що спираються на історію |

Завдання **основної сесії** ставлять у чергу системну подію та за потреби пробуджують heartbeat (`--wake now` або `--wake next-heartbeat`). **Ізольовані** завдання виконують окремий цикл агента з новою сесією. **Власні сесії** (`session:xxx`) зберігають контекст між запусками, що дає змогу реалізовувати робочі процеси на кшталт щоденних стендапів, які спираються на попередні підсумки.

Для ізольованих завдань завершення під час роботи тепер включає best-effort очищення браузера для цієї cron-сесії. Помилки очищення ігноруються, тому фактичний результат cron усе одно має пріоритет.

Ізольовані запуски cron також вивільняють усі вбудовані інстанси середовища виконання MCP, створені для завдання, через спільний шлях очищення середовища виконання. Це відповідає тому, як клієнти MCP основної сесії та власної сесії завершуються, тому ізольовані cron-завдання не призводять до витоку дочірніх процесів stdio або довготривалих з’єднань MCP між запусками.

Коли ізольовані запуски cron оркеструють subagent, під час доставки також надається
перевага фінальному результату дочірнього елемента замість застарілого проміжного тексту батьківського.
Якщо дочірні елементи все ще виконуються, OpenClaw пригнічує це часткове батьківське оновлення замість того, щоб оголошувати його.

### Параметри payload для ізольованих завдань

- `--message`: текст prompt (обов’язковий для isolated)
- `--model` / `--thinking`: перевизначення моделі та рівня thinking
- `--light-context`: пропустити впровадження bootstrap-файлів робочого простору
- `--tools exec,read`: обмежити, які інструменти може використовувати завдання

`--model` використовує вибрану дозволену модель для цього завдання. Якщо запитана модель
не дозволена, cron записує попередження в журнал і натомість використовує вибір моделі
агента/типової моделі для цього завдання. Налаштовані ланцюжки fallback усе ще застосовуються, але звичайне перевизначення
моделі без явного списку fallback для окремого завдання більше не додає основну модель агента як приховану додаткову ціль повторної спроби.

Пріоритет вибору моделі для ізольованих завдань:

1. Перевизначення моделі Gmail hook (коли запуск надійшов із Gmail і це перевизначення дозволене)
2. `model` у payload окремого завдання
3. Збережене перевизначення моделі cron-сесії
4. Вибір моделі агента/типової моделі

Швидкий режим також дотримується визначеного активного вибору. Якщо в конфігурації вибраної моделі
є `params.fastMode`, ізольований cron використовує це типово. Збережене перевизначення
`fastMode` сесії все одно має пріоритет над конфігурацією в обох напрямках.

Якщо ізольований запуск стикається з передачею керування через live-перемикання моделі, cron повторює спробу з
перемкненим provider/model і зберігає цей active вибір перед повторною спробою. Коли
перемикання також містить новий профіль автентифікації, cron зберігає і це перевизначення профілю автентифікації. Кількість
повторних спроб обмежена: після початкової спроби плюс 2 повторних спроб через перемикання cron перериває виконання, а не зациклюється назавжди.

## Доставка та вивід

| Режим     | Що відбувається                                                      |
| --------- | -------------------------------------------------------------------- |
| `announce` | Резервно доставляє фінальний текст до цілі, якщо агент його не надіслав |
| `webhook`  | Надсилає payload події завершення через POST на URL                  |
| `none`     | Немає резервної доставки з боку виконавця                            |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`).

Для ізольованих завдань доставка в чат є спільною. Якщо маршрут чату доступний,
агент може використовувати інструмент `message`, навіть якщо завдання використовує `--no-deliver`. Якщо
агент надсилає повідомлення до налаштованої/поточної цілі, OpenClaw пропускає резервне
announce. В іншому разі `announce`, `webhook` і `none` лише визначають, що
виконавець робить із фінальною відповіддю після циклу агента.

Сповіщення про помилки проходять окремим шляхом призначення:

- `cron.failureDestination` задає глобальне типове значення для сповіщень про помилки.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо жодне не задано, а завдання вже доставляє через `announce`, сповіщення про помилки тепер резервно надсилаються до цієї основної announce-цілі.
- `delivery.failureDestination` підтримується лише для завдань із `sessionTarget="isolated"`, якщо основний режим доставки не дорівнює `webhook`.

## Приклади CLI

Одноразове нагадування (основна сесія):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Періодичне ізольоване завдання з доставкою:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Ізольоване завдання з перевизначенням моделі та thinking:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook-и

Gateway може відкривати HTTP Webhook endpoint-и для зовнішніх тригерів. Увімкніть у конфігурації:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Автентифікація

Кожен запит має містити токен hook через заголовок:

- `Authorization: Bearer <token>` (рекомендовано)
- `x-openclaw-token: <token>`

Токени в рядку запиту відхиляються.

### POST /hooks/wake

Поставити системну подію в чергу для основної сесії:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (обов’язково): опис події
- `mode` (необов’язково): `now` (типово) або `next-heartbeat`

### POST /hooks/agent

Запустити ізольований цикл агента:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.5"}'
```

Поля: `message` (обов’язково), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Mapped hooks (POST /hooks/\<name\>)

Користувацькі імена hook визначаються через `hooks.mappings` у конфігурації. Mappings можуть перетворювати довільний payload на дії `wake` або `agent` за допомогою шаблонів або кодових перетворень.

### Безпека

- Тримайте hook endpoint-и за loopback, tailnet або довіреним reverse proxy.
- Використовуйте окремий токен hook; не використовуйте повторно токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Встановіть `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Залишайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також встановіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів сесії.
- Payload-и hook типово обгортаються межами безпеки.

## Інтеграція Gmail PubSub

Підключіть тригери вхідної пошти Gmail до OpenClaw через Google PubSub.

**Передумови**: CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічного HTTPS endpoint.

### Налаштування через майстер (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує конфігурацію `hooks.gmail`, вмикає preset Gmail і використовує Tailscale Funnel для push endpoint.

### Автозапуск Gateway

Коли `hooks.enabled=true` і задано `hooks.gmail.account`, Gateway під час завантаження запускає `gog gmail watch serve` і автоматично оновлює watch. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися від цього.

### Одноразове ручне налаштування

1. Виберіть проєкт GCP, якому належить OAuth client, що використовується `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Створіть topic і надайте Gmail доступ для push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Запустіть watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Перевизначення моделі Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Керування завданнями

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Примітка щодо перевизначення моделі:

- `openclaw cron add|edit --model ...` змінює вибрану модель завдання.
- Якщо модель дозволена, саме цей provider/model потрапляє до ізольованого
  запуску агента.
- Якщо вона не дозволена, cron видає попередження та повертається до вибору
  моделі агента/типової моделі завдання.
- Налаштовані ланцюжки fallback усе ще застосовуються, але звичайне перевизначення `--model`
  без явного списку fallback для окремого завдання більше не переходить до основної
  моделі агента як до тихої додаткової цілі повторної спроби.

## Конфігурація

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Файл sidecar стану виконання виводиться з `cron.store`: сховище `.json`, наприклад
`~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, тоді як до шляху сховища
без суфікса `.json` додається `-state.json`.

Вимкнення cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

**Повтор одноразового запуску**: тимчасові помилки (rate limit, overload, network, server error) повторюються до 3 разів з експоненційним backoff. Постійні помилки вимикаються негайно.

**Повтор періодичного запуску**: експоненційний backoff (від 30 с до 60 хв) між повторними спробами. Backoff скидається після наступного успішного запуску.

**Обслуговування**: `cron.sessionRetention` (типово `24h`) очищає записи сесій ізольованих запусків. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають файли журналу запусків.

## Усунення несправностей

### Послідовність команд

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron не спрацьовує

- Перевірте `cron.enabled` і змінну середовища `OPENCLAW_SKIP_CRON`.
- Переконайтеся, що Gateway працює безперервно.
- Для розкладів `cron` перевірте часовий пояс (`--tz`) відносно часового поясу хоста.
- `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено через `openclaw cron run <jobId> --due`, і час завдання ще не настав.

### Cron спрацював, але доставки немає

- Режим доставки `none` означає, що резервне надсилання з боку виконавця не очікується. Агент
  усе ще може надсилати напряму за допомогою інструмента `message`, коли маршрут чату доступний.
- Відсутня/некоректна ціль доставки (`channel`/`to`) означає, що вихідне надсилання було пропущено.
- Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку заблоковано обліковими даними.
- Якщо ізольований запуск повертає лише тихий токен (`NO_REPLY` / `no_reply`),
  OpenClaw пригнічує пряме вихідне надсилання, а також резервний
  шлях надсилання підсумку в чергу, тому назад у чат нічого не публікується.
- Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний
  маршрут (`channel: "last"` із попереднім чатом або явний channel/target).

### Особливості часових поясів

- Cron без `--tz` використовує часовий пояс хоста gateway.
- Розклади `at` без часового поясу трактуються як UTC.
- `activeHours` heartbeat використовує налаштоване визначення часового поясу.

## Пов’язане

- [Автоматизація й завдання](/uk/automation) — огляд усіх механізмів автоматизації
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні цикли основної сесії
- [Часовий пояс](/uk/concepts/timezone) — конфігурація часового поясу
