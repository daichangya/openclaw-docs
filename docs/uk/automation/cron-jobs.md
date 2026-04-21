---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook-и, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
summary: Заплановані завдання, Webhook-и та тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-04-21T06:32:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Заплановані завдання (Cron)

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може повертати результат назад у канал чату або до endpoint Webhook.

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

- Cron працює **всередині** процесу Gateway (а не всередині моделі).
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому перезапуски не призводять до втрати розкладів.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json`, а `jobs-state.json` додайте до gitignore.
- Після цього розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть вважати завдання новими, оскільки поля стану виконання тепер зберігаються в `jobs-state.json`.
- Усі виконання cron створюють записи [фонових завдань](/uk/automation/tasks).
- Одноразові завдання (`--at`) типово автоматично видаляються після успішного виконання.
- Ізольовані запуски cron після завершення намагаються закрити відстежувані вкладки браузера/процеси для своєї сесії `cron:<jobId>`, щоб відокремлена автоматизація браузера не залишала осиротілі процеси.
- Ізольовані запуски cron також захищають від застарілих відповідей-підтверджень. Якщо
  перший результат — це лише проміжне оновлення статусу (`on it`, `pulling everything
together` та подібні підказки) і жоден дочірній запуск субагента більше не
  відповідає за фінальну відповідь, OpenClaw повторно надсилає запит один раз, щоб отримати фактичний
  результат перед доставленням.

<a id="maintenance"></a>

Узгодження завдань для cron належить до середовища виконання: активне завдання cron залишається активним, поки
середовище cron і далі відстежує це завдання як таке, що виконується, навіть якщо старий рядок дочірньої сесії все ще існує.
Щойно середовище виконання перестає володіти цим завданням і спливає 5-хвилинне вікно відстрочки, обслуговування може
позначити завдання як `lost`.

## Типи розкладу

| Вид     | Прапорець CLI | Опис                                                      |
| ------- | ------------- | --------------------------------------------------------- |
| `at`    | `--at`        | Одноразова позначка часу (ISO 8601 або відносна, наприклад `20m`) |
| `every` | `--every`     | Фіксований інтервал                                       |
| `cron`  | `--cron`      | Вираз cron із 5 або 6 полів з необов’язковим `--tz`       |

Позначки часу без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним часом.

Періодичні вирази на початок години автоматично розносяться в межах до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово задати точний час, або `--stagger 30s` для явного вікна.

### День місяця і день тижня використовують логіку OR

Вирази cron парсяться через [croner](https://github.com/Hexagon/croner). Коли і поле дня місяця, і поле дня тижня не є wildcard, croner виконує збіг, якщо **будь-яке** з полів збігається, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. OpenClaw тут використовує типову OR-поведінку Croner. Щоб вимагати виконання обох умов, використовуйте модифікатор дня тижня `+` у Croner (`0 9 15 * +1`) або плануйте за одним полем, а інше перевіряйте в prompt чи команді вашого завдання.

## Стилі виконання

| Стиль           | Значення `--session` | Виконується в             | Найкраще підходить для              |
| --------------- | -------------------- | ------------------------- | ----------------------------------- |
| Основна сесія   | `main`               | Наступний такт heartbeat  | Нагадувань, системних подій         |
| Ізольований     | `isolated`           | Виділена `cron:<jobId>`   | Звітів, фонових завдань             |
| Поточна сесія   | `current`            | Прив’язується під час створення | Періодичної роботи з урахуванням контексту |
| Користувацька сесія | `session:custom-id` | Постійна іменована сесія | Робочих процесів, що спираються на історію |

Завдання **основної сесії** ставлять системну подію в чергу та за потреби пробуджують heartbeat (`--wake now` або `--wake next-heartbeat`). **Ізольовані** завдання виконують окремий хід агента з новою сесією. **Користувацькі сесії** (`session:xxx`) зберігають контекст між запусками, що дає змогу реалізовувати робочі процеси на кшталт щоденних стендапів, які спираються на попередні підсумки.

Для ізольованих завдань завершення виконання тепер включає найкращу спробу очищення браузера для цієї cron-сесії. Помилки очищення ігноруються, щоб фактичний результат cron усе одно мав пріоритет.

Коли ізольовані запуски cron оркеструють субагентів, під час доставлення також
перевага надається фінальному результату дочірнього запуску, а не застарілому проміжному тексту батьківського.
Якщо дочірні запуски все ще виконуються, OpenClaw пригнічує це часткове оновлення батьківського процесу, замість того щоб оголошувати його.

### Параметри payload для ізольованих завдань

- `--message`: текст prompt (обов’язковий для ізольованих)
- `--model` / `--thinking`: перевизначення моделі та рівня thinking
- `--light-context`: пропустити ін’єкцію bootstrap-файлів робочого простору
- `--tools exec,read`: обмежити, які інструменти може використовувати завдання

`--model` використовує вибрану дозволену модель для цього завдання. Якщо запитана модель
не дозволена, cron записує попередження в журнал і повертається до вибору моделі агента/типової моделі для цього завдання.
Налаштовані ланцюжки fallback, як і раніше, застосовуються, але звичайне перевизначення
моделі без явного списку fallback для конкретного завдання більше не додає основну модель агента як приховану додаткову ціль повторної спроби.

Пріоритет вибору моделі для ізольованих завдань такий:

1. Перевизначення моделі hook Gmail (коли запуск походить із Gmail і це перевизначення дозволене)
2. `model` у payload конкретного завдання
3. Збережене перевизначення моделі сесії cron
4. Вибір моделі агента/типової моделі

Швидкий режим також дотримується визначеного активного вибору. Якщо вибрана конфігурація моделі
має `params.fastMode`, ізольований cron використовує його типово. Збережене перевизначення
`fastMode` сесії все одно має пріоритет над конфігурацією в будь-якому напрямку.

Якщо ізольований запуск потрапляє на живе передавання керування під час перемикання моделі, cron повторює спробу з
перемкненим провайдером/моделлю та зберігає цей активний вибір перед повторною спробою. Коли
перемикання також несе новий профіль автентифікації, cron також зберігає це перевизначення профілю автентифікації.
Кількість повторних спроб обмежена: після початкової спроби та ще 2 повторних спроб через перемикання
cron переривається, а не зациклюється назавжди.

## Доставлення і результат

| Режим      | Що відбувається                                                    |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Запасне доставлення фінального тексту до цілі, якщо агент не надіслав |
| `webhook`  | POST payload завершеної події на URL                               |
| `none`     | Немає запасного доставлення з боку runner                          |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставлення в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`).

Для ізольованих завдань доставлення в чат є спільним. Якщо маршрут чату доступний,
агент може використовувати інструмент `message` навіть коли завдання використовує `--no-deliver`. Якщо
агент надсилає повідомлення до налаштованої/поточної цілі, OpenClaw пропускає запасне
оголошення. Інакше `announce`, `webhook` і `none` лише керують тим, що
runner робить із фінальною відповіддю після ходу агента.

Сповіщення про помилки йдуть окремим маршрутом призначення:

- `cron.failureDestination` задає глобальне типове значення для сповіщень про помилки.
- `job.delivery.failureDestination` перевизначає це для конкретного завдання.
- Якщо не задано жодного з них і завдання вже доставляє результат через `announce`, сповіщення про помилки тепер запасно надсилаються до цієї ж основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань із `sessionTarget="isolated"`, якщо основний режим доставлення не є `webhook`.

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

Періодичне ізольоване завдання з доставленням:

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

Gateway може відкривати HTTP endpoint-и Webhook для зовнішніх тригерів. Увімкніть це в конфігурації:

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

Токени в query string відхиляються.

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

Запустити ізольований хід агента:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Поля: `message` (обов’язково), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Зіставлені hook-и (POST /hooks/\<name\>)

Користувацькі назви hook-ів визначаються через `hooks.mappings` у конфігурації. Зіставлення можуть перетворювати довільний payload на дії `wake` або `agent` за допомогою шаблонів або кодових трансформацій.

### Безпека

- Тримайте endpoint-и hook-ів за loopback, tailnet або довіреним reverse proxy.
- Використовуйте окремий токен hook-ів; не використовуйте повторно токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Встановіть `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, які вибирає викликач.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів сесії.
- Payload-и hook-ів типово обгортаються межами безпеки.

## Інтеграція Gmail PubSub

Підключіть тригери вхідної пошти Gmail до OpenClaw через Google PubSub.

**Передумови**: CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічного HTTPS endpoint.

### Налаштування через майстер (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує конфігурацію `hooks.gmail`, вмикає preset Gmail і використовує Tailscale Funnel для push endpoint.

### Автозапуск Gateway

Коли `hooks.enabled=true` і `hooks.gmail.account` задано, Gateway під час запуску запускає `gog gmail watch serve` і автоматично поновлює watch. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися від цього.

### Ручне одноразове налаштування

1. Виберіть проєкт GCP, якому належить OAuth-клієнт, що використовується `gog`:

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
- Якщо модель дозволена, саме цей провайдер/модель використовується в ізольованому
  запуску агента.
- Якщо її не дозволено, cron попереджає й повертається до вибору моделі
  агента/типової моделі завдання.
- Налаштовані ланцюжки fallback, як і раніше, застосовуються, але звичайне перевизначення `--model`
  без явного списку fallback для конкретного завдання більше не переходить до основної моделі агента
  як до тихої додаткової цілі повторної спроби.

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

Sidecar стану виконання виводиться з `cron.store`: сховище `.json`, таке як
`~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, а до шляху сховища
без суфікса `.json` додається `-state.json`.

Вимкнути cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

**Повтор одноразового завдання**: тимчасові помилки (обмеження швидкості, перевантаження, мережа, помилка сервера) повторюються до 3 разів з експоненційною затримкою. Постійні помилки одразу вимикають завдання.

**Повтор періодичного завдання**: експоненційна затримка (від 30 с до 60 хв) між повторними спробами. Після наступного успішного запуску затримка скидається.

**Обслуговування**: `cron.sessionRetention` (типово `24h`) очищає записи сесій ізольованих запусків. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають файли журналу запусків.

## Усунення неполадок

### Набір команд

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
- `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено через `openclaw cron run <jobId> --due`, і час виконання завдання ще не настав.

### Cron спрацював, але доставлення немає

- Режим доставлення `none` означає, що запасне надсилання з боку runner не очікується. Агент
  усе ще може надіслати повідомлення безпосередньо через інструмент `message`, якщо маршрут чату доступний.
- Відсутня/невалідна ціль доставлення (`channel`/`to`) означає, що вихідне надсилання було пропущено.
- Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставлення було заблоковано обліковими даними.
- Якщо ізольований запуск повертає лише silent token (`NO_REPLY` / `no_reply`),
  OpenClaw пригнічує пряме вихідне доставлення, а також пригнічує запасний
  шлях зведення через чергу, тому назад у чат нічого не публікується.
- Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний
  маршрут (`channel: "last"` із попереднім чатом або явний канал/ціль).

### Поширені проблеми з часовими поясами

- Cron без `--tz` використовує часовий пояс хоста gateway.
- Розклади `at` без часового поясу трактуються як UTC.
- `activeHours` Heartbeat використовує налаштоване визначення часового поясу.

## Пов’язане

- [Автоматизація й завдання](/uk/automation) — огляд усіх механізмів автоматизації
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні ходи основної сесії
- [Часовий пояс](/uk/concepts/timezone) — конфігурація часового поясу
