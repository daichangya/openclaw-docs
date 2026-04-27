---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook-ів, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, Webhook-и та тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-04-27T03:39:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d75cd890b473d7c6cac63b008cf218380127bb2786ba484f69272b4094b376e
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може повертати результат назад у канал чату або на endpoint Webhook.

## Швидкий старт

<Steps>
  <Step title="Додайте одноразове нагадування">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Перевірте свої завдання">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Перегляньте історію запусків">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Як працює cron

- Cron працює **всередині процесу Gateway** (а не всередині моделі).
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому перезапуски не призводять до втрати розкладів.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json` і додайте `jobs-state.json` до gitignore.
- Після цього розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть трактувати завдання як нові, оскільки поля часу виконання тепер зберігаються в `jobs-state.json`.
- Усі виконання cron створюють записи [фонових завдань](/uk/automation/tasks).
- Одноразові завдання (`--at`) автоматично видаляються після успішного виконання за замовчуванням.
- Ізольовані запуски cron в режимі best-effort закривають відстежувані вкладки/процеси браузера для своєї сесії `cron:<jobId>`, коли запуск завершується, щоб відокремлена автоматизація браузера не залишала сирітські процеси.
- Ізольовані запуски cron також захищають від застарілих відповідей-підтверджень. Якщо перший результат — це лише проміжне оновлення стану (`on it`, `pulling everything together` і подібні підказки), і жоден дочірній запуск субагента більше не відповідає за фінальну відповідь, OpenClaw повторно надсилає запит один раз для отримання фактичного результату перед доставкою.
- Ізольовані запуски cron віддають перевагу структурованим метаданим відмови у виконанні з вбудованого запуску, а потім переходять до відомих маркерів підсумку/виводу, таких як `SYSTEM_RUN_DENIED` і `INVALID_REQUEST`, щоб заблокована команда не була позначена як успішний запуск.

<a id="maintenance"></a>

<Note>
Узгодження завдань для cron спочатку належить часу виконання, а вже потім спирається на стійку історію: активне завдання cron залишається активним, доки середовище виконання cron все ще відстежує це завдання як таке, що виконується, навіть якщо старий рядок дочірньої сесії все ще існує. Щойно середовище виконання перестає володіти завданням і минає 5-хвилинне вікно очікування, перевірки обслуговування звіряють збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця стійка історія показує фінальний результат, журнал завдань завершується на його основі; інакше обслуговування, яким володіє Gateway, може позначити завдання як `lost`. Офлайновий аудит CLI може відновитися зі стійкої історії, але він не вважає власну порожню внутрішньопроцесну множину активних завдань доказом того, що запуск cron, яким володіє Gateway, зник.
</Note>

## Типи розкладів

| Вид     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова мітка часу (ISO 8601 або відносна, наприклад `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | 5-польний або 6-польний cron-вираз із необов’язковим `--tz` |

Мітки часу без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним настінним часом.

Повторювані вирази на початок кожної години автоматично зсуваються до 5 хвилин, щоб зменшити пікове навантаження. Використовуйте `--exact`, щоб примусово встановити точний час, або `--stagger 30s` для явного вікна.

### День місяця і день тижня використовують логіку OR

Cron-вирази розбираються за допомогою [croner](https://github.com/Hexagon/croner). Коли і поле дня місяця, і поле дня тижня не є wildcard, croner виконує збіг, коли **будь-яке** з полів збігається — а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. Тут OpenClaw використовує стандартну поведінку OR із Croner. Щоб вимагати виконання обох умов, використовуйте модифікатор дня тижня `+` у Croner (`0 9 15 * +1`) або налаштуйте розклад за одним полем, а інше перевіряйте в prompt чи команді вашого завдання.

## Стилі виконання

| Стиль          | Значення `--session` | Виконується в            | Найкраще підходить для          |
| -------------- | -------------------- | ------------------------ | ------------------------------- |
| Основна сесія  | `main`               | Наступний цикл heartbeat | Нагадувань, системних подій     |
| Ізольований    | `isolated`           | Виділений `cron:<jobId>` | Звітів, фонових завдань         |
| Поточна сесія  | `current`            | Прив’язується під час створення | Повторюваної роботи з контекстом |
| Власна сесія   | `session:custom-id`  | Постійна іменована сесія | Процесів, що накопичують історію |

<AccordionGroup>
  <Accordion title="Основна сесія vs ізольована vs власна">
    Завдання **основної сесії** ставлять у чергу системну подію і за потреби пробуджують heartbeat (`--wake now` або `--wake next-heartbeat`). Ці системні події не подовжують актуальність щоденного/неактивного скидання для цільової сесії. **Ізольовані** завдання запускають окремий цикл агента з новою сесією. **Власні сесії** (`session:xxx`) зберігають контекст між запусками, що дає змогу реалізувати процеси на кшталт щоденних стендапів, які спираються на попередні підсумки.
  </Accordion>
  <Accordion title="Що означає 'нова сесія' для ізольованих завдань">
    Для ізольованих завдань "нова сесія" означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні налаштування, наприклад параметри thinking/fast/verbose, мітки та явні користувацькі перевизначення model/auth, але не успадковує фоновий контекст розмови зі старішого рядка cron: маршрутизацію channel/group, політику send або queue, підвищення привілеїв, origin чи прив’язку середовища виконання ACP. Використовуйте `current` або `session:<id>`, коли повторюване завдання має навмисно будуватися на тому самому контексті розмови.
  </Accordion>
  <Accordion title="Очищення середовища виконання">
    Для ізольованих завдань завершення середовища виконання тепер включає best-effort очищення браузера для цієї cron-сесії. Помилки очищення ігноруються, тому реальний результат cron усе одно має пріоритет.

    Ізольовані запуски cron також звільняють усі вбудовані екземпляри середовища виконання MCP, створені для завдання, через спільний шлях очищення середовища виконання. Це відповідає тому, як завершується робота клієнтів MCP для основної та власної сесій, тож ізольовані cron-завдання не призводять до витоків дочірніх stdio-процесів або довготривалих MCP-з’єднань між запусками.

  </Accordion>
  <Accordion title="Субагент і доставка в Discord">
    Коли ізольовані запуски cron оркеструють субагентів, під час доставки також надається перевага фінальному виводу дочірнього нащадка, а не застарілому проміжному тексту батьківського запуску. Якщо нащадки все ще виконуються, OpenClaw приглушує це часткове батьківське оновлення замість того, щоб оголошувати його.

    Для цілей оголошення в Discord лише з текстом OpenClaw надсилає один раз канонічний фінальний текст помічника замість повторного відтворення і потокових/проміжних текстових payload-ів, і фінальної відповіді. Медіа та структуровані payload-и Discord, як і раніше, доставляються окремо, щоб не втрачалися вкладення та компоненти.

  </Accordion>
</AccordionGroup>

### Параметри payload для ізольованих завдань

<ParamField path="--message" type="string" required>
  Текст prompt (обов’язковий для isolated).
</ParamField>
<ParamField path="--model" type="string">
  Перевизначення моделі; використовує вибрану дозволену модель для завдання.
</ParamField>
<ParamField path="--thinking" type="string">
  Перевизначення рівня thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Пропустити інʼєкцію файлу bootstrap робочого простору.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити, які інструменти може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану дозволену модель для цього завдання. Якщо запитана модель не дозволена, cron записує попередження в журнал і натомість повертається до вибору моделі агента/моделі за замовчуванням для цього завдання. Налаштовані ланцюжки fallback, як і раніше, застосовуються, але просте перевизначення моделі без явного списку fallback для завдання більше не додає основну модель агента як приховану додаткову ціль повторної спроби.

Пріоритет вибору моделі для ізольованих завдань такий:

1. Перевизначення моделі hook Gmail (коли запуск надійшов із Gmail і це перевизначення дозволене)
2. `model` у payload для конкретного завдання
3. Збережене користувачем перевизначення моделі сесії cron
4. Вибір моделі агента/за замовчуванням

Швидкий режим також слідує за вибраним активним налаштуванням. Якщо вибрана конфігурація моделі має `params.fastMode`, ізольований cron використовує це за замовчуванням. Збережене в сесії перевизначення `fastMode` усе одно має пріоритет над конфігурацією в будь-який бік.

Якщо ізольований запуск натрапляє на активне передавання керування під час перемикання моделі, cron повторює спробу з перемкненим provider/model і зберігає цей активний вибір для поточного запуску перед повторною спробою. Коли перемикання також несе новий auth profile, cron теж зберігає це перевизначення auth profile для поточного запуску. Кількість повторних спроб обмежена: після початкової спроби плюс 2 повторні спроби перемикання cron перериває виконання замість нескінченного циклу.

## Доставка і вивід

| Режим     | Що відбувається                                                    |
| --------- | ------------------------------------------------------------------ |
| `announce` | Резервно доставляє фінальний текст до цілі, якщо агент не надіслав його |
| `webhook`  | Надсилає POST payload завершеної події на URL                     |
| `none`     | Немає резервної доставки з боку виконавця                         |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`. Для цілей Slack/Discord/Mattermost слід використовувати явні префікси (`channel:<id>`, `user:<id>`). Ідентифікатори кімнат Matrix чутливі до регістру; використовуйте точний room ID або форму `room:!room:server` із Matrix.

Для ізольованих завдань доставка в чат є спільною. Якщо маршрут чату доступний, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає в налаштовану/поточну ціль, OpenClaw пропускає резервне оголошення. Інакше `announce`, `webhook` і `none` керують лише тим, що виконавець робить із фінальною відповіддю після циклу агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену активну ціль доставки для маршруту резервного оголошення. Внутрішні ключі сесії можуть бути в нижньому регістрі; цілі доставки provider не реконструюються з цих ключів, коли доступний поточний контекст чату.

Сповіщення про збої використовують окремий шлях призначення:

- `cron.failureDestination` задає глобальне значення за замовчуванням для сповіщень про збої.
- `job.delivery.failureDestination` перевизначає його для конкретного завдання.
- Якщо жодне з них не задане і завдання вже доставляє через `announce`, сповіщення про збої тепер резервно надсилаються до цієї основної цілі `announce`.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний режим доставки не є `webhook`.

## Приклади CLI

<Tabs>
  <Tab title="Одноразове нагадування">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Повторюване ізольоване завдання">
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
  </Tab>
  <Tab title="Перевизначення моделі та thinking">
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
  </Tab>
</Tabs>

## Webhook-и

Gateway може відкривати HTTP endpoint-и Webhook для зовнішніх тригерів. Увімкніть у конфігурації:

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

Кожен запит має містити токен hook у заголовку:

- `Authorization: Bearer <token>` (рекомендовано)
- `x-openclaw-token: <token>`

Токени в query string відхиляються.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Додати системну подію в чергу для основної сесії:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Опис події.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` або `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Запустити ізольований цикл агента:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Поля: `message` (обов’язково), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Зіставлені hooks (POST /hooks/<name>)">
    Власні назви hook-ів визначаються через `hooks.mappings` у конфігурації. Зіставлення можуть перетворювати довільні payload-и на дії `wake` або `agent` за допомогою шаблонів або перетворень коду.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте endpoint-и hook-ів за loopback, tailnet або довіреним reverse proxy.

- Використовуйте окремий токен hook-а; не використовуйте повторно токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Установіть `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів сесії.
- Payload-и hook-ів за замовчуванням обгортаються межами безпеки.
  </Warning>

## Інтеграція Gmail PubSub

Підключіть тригери вхідної пошти Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічного HTTPS endpoint.
</Note>

### Налаштування через майстер (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує конфігурацію `hooks.gmail`, вмикає preset Gmail і використовує Tailscale Funnel для push endpoint.

### Автозапуск Gateway

Коли `hooks.enabled=true` і задано `hooks.gmail.account`, Gateway під час запуску виконує `gog gmail watch serve` і автоматично поновлює watch. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися від цього.

### Одноразове ручне налаштування

<Steps>
  <Step title="Виберіть проєкт GCP">
    Виберіть проєкт GCP, якому належить OAuth client, що використовується `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Створіть topic і надайте Gmail доступ для push">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Запустіть watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Перевизначення моделі для Gmail

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

<Note>
Примітка щодо перевизначення моделі:

- `openclaw cron add|edit --model ...` змінює вибрану модель завдання.
- Якщо модель дозволена, саме цей provider/model потрапляє до ізольованого запуску агента.
- Якщо вона не дозволена, cron видає попередження і повертається до вибору моделі агента/за замовчуванням для завдання.
- Налаштовані ланцюжки fallback, як і раніше, застосовуються, але просте перевизначення `--model` без явного списку fallback для завдання більше не переходить до основної моделі агента як до тихої додаткової цілі повторної спроби.
  </Note>

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

Sidecar стану часу виконання виводиться з `cron.store`: сховище `.json`, таке як `~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, а шлях сховища без суфікса `.json` отримує додаток `-state.json`.

Вимкнення cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Поведінка повторних спроб">
    **Повторна спроба одноразового завдання**: тимчасові помилки (обмеження швидкості, перевантаження, мережа, помилка сервера) повторюються до 3 разів з експоненційним backoff. Постійні помилки призводять до негайного вимкнення.

    **Повторна спроба повторюваного завдання**: експоненційний backoff (від 30 с до 60 хв) між повторними спробами. Backoff скидається після наступного успішного запуску.

  </Accordion>
  <Accordion title="Обслуговування">
    `cron.sessionRetention` (типово `24h`) очищає записи сесій ізольованих запусків. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають файли журналу запусків.
  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="Cron не спрацьовує">
    - Перевірте `cron.enabled` і змінну середовища `OPENCLAW_SKIP_CRON`.
    - Переконайтеся, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте часовий пояс (`--tz`) відносно часового поясу хоста.
    - `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено через `openclaw cron run <jobId> --due`, але час виконання завдання ще не настав.
  </Accordion>
  <Accordion title="Cron спрацював, але доставки немає">
    - Режим доставки `none` означає, що резервне надсилання з боку виконавця не очікується. Агент усе ще може надсилати напряму через інструмент `message`, коли доступний маршрут чату.
    - Відсутня/некоректна ціль доставки (`channel`/`to`) означає, що вихідну доставку було пропущено.
    - Для Matrix скопійовані або застарілі завдання з `delivery.to` room ID у нижньому регістрі можуть зазнавати помилки, оскільки room ID у Matrix чутливі до регістру. Відредагуйте завдання, вказавши точне значення `!room:server` або `room:!room:server` із Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку було заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише тихий токен (`NO_REPLY` / `no_reply`), OpenClaw приглушує пряму вихідну доставку, а також резервний шлях підсумку через чергу, тож назад у чат нічого не публікується.
    - Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` із попереднім чатом або явний канал/ціль).
  </Accordion>
  <Accordion title="Схоже, що Cron або heartbeat заважає rollover у стилі /new">
    - Актуальність щоденного та неактивного скидання не базується на `updatedAt`; див. [Керування сесіями](/uk/concepts/session#session-lifecycle).
    - Пробудження cron, запуски heartbeat, сповіщення exec і службові операції gateway можуть оновлювати рядок сесії для маршрутизації/статусу, але вони не подовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сесії transcript JSONL, якщо файл усе ще доступний. Для застарілих неактивних рядків без `lastInteractionAt` цей відновлений час початку використовується як базове значення неактивності.
  </Accordion>
  <Accordion title="Підводні камені часового поясу">
    - Cron без `--tz` використовує часовий пояс хоста gateway.
    - Розклади `at` без часового поясу трактуються як UTC.
    - `activeHours` у Heartbeat використовує налаштоване визначення часового поясу.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Автоматизація й завдання](/uk/automation) — усі механізми автоматизації в одному місці
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні цикли основної сесії
- [Часовий пояс](/uk/concepts/timezone) — конфігурація часового поясу
