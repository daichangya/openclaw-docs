---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook-и, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, Webhook-и та тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-04-26T07:00:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може повертати результат назад у канал чату або до кінцевої точки Webhook.

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

## Як працює Cron

- Cron працює **всередині процесу Gateway** (не всередині моделі).
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому перезапуски не призводять до втрати розкладів.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json`, а `jobs-state.json` додайте до gitignore.
- Після розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть вважати завдання новими, оскільки поля стану виконання тепер містяться в `jobs-state.json`.
- Усі виконання cron створюють записи [фонових завдань](/uk/automation/tasks).
- Одноразові завдання (`--at`) типово автоматично видаляються після успішного виконання.
- Ізольовані запуски cron у межах best-effort закривають відстежувані вкладки/процеси браузера для їхньої сесії `cron:<jobId>` після завершення запуску, щоб відокремлена автоматизація браузера не залишала сирітські процеси.
- Ізольовані запуски cron також захищають від застарілих відповідей-підтверджень. Якщо перший результат — це лише проміжне оновлення стану (`on it`, `pulling everything together` та подібні підказки), і жоден дочірній запуск субагента більше не відповідає за фінальну відповідь, OpenClaw повторно надсилає запит один раз, щоб отримати фактичний результат перед доставкою.

<a id="maintenance"></a>

<Note>
Узгодження завдань для cron насамперед належить до runtime, а вже потім спирається на стійку історію: активне завдання cron залишається активним, доки runtime cron усе ще відстежує це завдання як таке, що виконується, навіть якщо старий рядок дочірньої сесії ще існує. Щойно runtime перестає володіти завданням і минає 5-хвилинне вікно очікування, перевірки обслуговування переглядають збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця стійка історія показує термінальний результат, реєстр завдань фіналізується на її основі; інакше обслуговування, яким керує Gateway, може позначити завдання як `lost`. Офлайновий аудит CLI може відновитися зі стійкої історії, але він не вважає власний порожній внутрішньопроцесний набір активних завдань доказом того, що запуск cron, яким володіє Gateway, зник.
</Note>

## Типи розкладу

| Вид     | Прапорець CLI | Опис                                                        |
| ------- | ------------- | ----------------------------------------------------------- |
| `at`    | `--at`        | Одноразова мітка часу (ISO 8601 або відносний формат, як-от `20m`) |
| `every` | `--every`     | Фіксований інтервал                                         |
| `cron`  | `--cron`      | 5-польовий або 6-польовий вираз cron з необов’язковим `--tz` |

Мітки часу без часової зони трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним настінним часом.

Повторювані вирази на початок години автоматично зсуваються до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово встановити точний час, або `--stagger 30s` для явного вікна.

### День місяця та день тижня використовують логіку OR

Вирази cron парсяться за допомогою [croner](https://github.com/Hexagon/croner). Коли і поле дня місяця, і поле дня тижня не є wildcard, croner виконує збіг, коли **збігається будь-яке** з полів — а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. OpenClaw тут використовує типову OR-поведінку Croner. Щоб вимагати обидві умови, використовуйте модифікатор дня тижня `+` від Croner (`0 9 15 * +1`) або плануйте за одним полем, а інше перевіряйте в prompt чи команді вашого завдання.

## Стилі виконання

| Стиль            | Значення `--session` | Виконується в             | Найкраще підходить для            |
| ---------------- | -------------------- | ------------------------- | --------------------------------- |
| Основна сесія    | `main`               | Наступного циклу Heartbeat | Нагадувань, системних подій       |
| Ізольований      | `isolated`           | Окремій `cron:<jobId>`    | Звітів, фонових рутинних завдань  |
| Поточна сесія    | `current`            | Прив’язується під час створення | Повторюваної роботи з урахуванням контексту |
| Власна сесія     | `session:custom-id`  | Постійній іменованій сесії | Процесів, що розвиваються на основі історії |

<AccordionGroup>
  <Accordion title="Основна сесія чи ізольована чи власна">
    Завдання **основної сесії** ставлять системну подію в чергу та за потреби пробуджують Heartbeat (`--wake now` або `--wake next-heartbeat`). Такі системні події не подовжують актуальність скидання за днем/неактивністю для цільової сесії. **Ізольовані** завдання запускають окремий цикл агента з новою сесією. **Власні сесії** (`session:xxx`) зберігають контекст між запусками, що дає змогу будувати процеси на кшталт щоденних стендапів на основі попередніх підсумків.
  </Accordion>
  <Accordion title="Що означає 'нова сесія' для ізольованих завдань">
    Для ізольованих завдань "нова сесія" означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні вподобання, як-от налаштування thinking/fast/verbose, мітки та явні користувацькі перевизначення моделі/автентифікації, але не успадковує фоновий контекст розмови зі старішого рядка cron: маршрутизацію каналу/групи, політику надсилання чи черги, підвищення привілеїв, джерело або прив’язку runtime ACP. Використовуйте `current` або `session:<id>`, якщо повторюване завдання має навмисно спиратися на той самий контекст розмови.
  </Accordion>
  <Accordion title="Очищення runtime">
    Для ізольованих завдань завершення runtime тепер включає best-effort очищення браузера для цієї сесії cron. Помилки очищення ігноруються, тому фактичний результат cron усе одно має пріоритет.

    Ізольовані запуски cron також звільняють усі вбудовані екземпляри runtime MCP, створені для завдання, через спільний шлях очищення runtime. Це відповідає тому, як завершуються клієнти MCP для основної сесії та власних сесій, тому ізольовані завдання cron не спричиняють витік дочірніх stdio-процесів або довготривалих MCP-з’єднань між запусками.

  </Accordion>
  <Accordion title="Субагент і доставка в Discord">
    Коли ізольовані запуски cron оркеструють субагентів, доставка також надає перевагу фінальному виводу нащадка над застарілим проміжним текстом батьківського запуску. Якщо нащадки все ще виконуються, OpenClaw пригнічує таке часткове оновлення батьківського запуску, а не оголошує його.

    Для текстових цілей оголошення в Discord OpenClaw надсилає канонічний фінальний текст помічника один раз, а не відтворює і потокові/проміжні текстові payload-и, і фінальну відповідь. Медіа та структуровані payload-и Discord усе ще доставляються як окремі payload-и, щоб не втратити вкладення та компоненти.

  </Accordion>
</AccordionGroup>

### Параметри payload для ізольованих завдань

<ParamField path="--message" type="string" required>
  Текст prompt (обов’язковий для ізольованих).
</ParamField>
<ParamField path="--model" type="string">
  Перевизначення моделі; використовує вибрану дозволену модель для завдання.
</ParamField>
<ParamField path="--thinking" type="string">
  Перевизначення рівня thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Пропустити ін’єкцію bootstrap-файлу робочого простору.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити, які інструменти може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану дозволену модель для цього завдання. Якщо запитана модель не дозволена, cron записує попередження в журнал і натомість повертається до вибору моделі агента/типової моделі для завдання. Налаштовані ланцюжки fallback усе ще застосовуються, але просте перевизначення моделі без явного списку fallback для конкретного завдання більше не додає основну модель агента як приховану додаткову ціль повторної спроби.

Пріоритет вибору моделі для ізольованих завдань:

1. Перевизначення моделі Gmail hook (коли запуск надійшов із Gmail і це перевизначення дозволене)
2. `model` у payload конкретного завдання
3. Збережене користувачем перевизначення моделі сесії cron
4. Вибір моделі агента/типової моделі

Режим fast також слідує за визначеним активним вибором. Якщо конфігурація вибраної моделі має `params.fastMode`, ізольований cron типово використовує це значення. Збережене в сесії перевизначення `fastMode` усе одно має пріоритет над конфігурацією в обох напрямках.

Якщо ізольований запуск натрапляє на live-передачу керування зі зміною моделі, cron повторює спробу з перемкненими provider/model і зберігає цей live-вибір для активного запуску перед повторною спробою. Якщо перемикання також містить новий профіль автентифікації, cron зберігає і це перевизначення профілю автентифікації для активного запуску. Повторні спроби обмежені: після початкової спроби плюс 2 повторних спроб із перемиканням cron припиняє виконання, а не зациклюється назавжди.

## Доставка та вивід

| Режим      | Що відбувається                                                      |
| ---------- | -------------------------------------------------------------------- |
| `announce` | Резервно доставляє фінальний текст до цілі, якщо агент його не надіслав |
| `webhook`  | Надсилає POST із payload завершеної події на URL                     |
| `none`     | Без резервної доставки від runner                                    |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`. Для цілей Slack/Discord/Mattermost слід використовувати явні префікси (`channel:<id>`, `user:<id>`). Ідентифікатори кімнат Matrix чутливі до регістру; використовуйте точний room ID або форму `room:!room:server` із Matrix.

Для ізольованих завдань доставка в чат є спільною. Якщо маршрут чату доступний, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає повідомлення до налаштованої/поточної цілі, OpenClaw пропускає резервне оголошення. Інакше `announce`, `webhook` і `none` лише визначають, що runner робить із фінальною відповіддю після циклу агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену live-ціль доставки для резервного маршруту оголошення. Внутрішні ключі сесії можуть бути в нижньому регістрі; цілі доставки provider не реконструюються з цих ключів, коли доступний контекст поточного чату.

Сповіщення про помилки надсилаються окремим маршрутом призначення:

- `cron.failureDestination` задає глобальне типове значення для сповіщень про помилки.
- `job.delivery.failureDestination` перевизначає це для окремого завдання.
- Якщо жодне не задано і завдання вже доставляє результат через `announce`, сповіщення про помилки тепер резервно надсилаються до тієї ж основної цілі оголошення.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний режим доставки не є `webhook`.

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

Gateway може відкривати HTTP-кінцеві точки Webhook для зовнішніх тригерів. Увімкніть у конфігурації:

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

Кожен запит повинен містити токен hook через заголовок:

- `Authorization: Bearer <token>` (рекомендовано)
- `x-openclaw-token: <token>`

Токени в рядку запиту відхиляються.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Поставити системну подію в чергу для основної сесії:

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Власні назви hook визначаються через `hooks.mappings` у конфігурації. Mappings можуть перетворювати довільні payload на дії `wake` або `agent` за допомогою шаблонів чи перетворень коду.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте кінцеві точки hook за loopback, у tailnet або за довіреним reverse proxy.

- Використовуйте окремий токен hook; не використовуйте повторно токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Установіть `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів сесії.
- Payload hook типово обгортаються межами безпеки.
  </Warning>

## Інтеграція Gmail PubSub

Підключіть тригери вхідних Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічної кінцевої точки HTTPS.
</Note>

### Налаштування через майстер (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує конфігурацію `hooks.gmail`, вмикає preset Gmail і використовує Tailscale Funnel для кінцевої точки push.

### Автозапуск Gateway

Коли `hooks.enabled=true` і встановлено `hooks.gmail.account`, Gateway під час запуску запускає `gog gmail watch serve` і автоматично поновлює watch. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися від цього.

### Ручне одноразове налаштування

<Steps>
  <Step title="Виберіть проєкт GCP">
    Виберіть проєкт GCP, якому належить OAuth client, що використовується `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Створіть topic і надайте Gmail доступ до push">
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

<Note>
Примітка щодо перевизначення моделі:

- `openclaw cron add|edit --model ...` змінює вибрану модель завдання.
- Якщо модель дозволена, саме ця provider/model передається в ізольований запуск агента.
- Якщо вона не дозволена, cron видає попередження та повертається до вибору моделі агента/типової моделі для завдання.
- Налаштовані ланцюжки fallback усе ще застосовуються, але просте перевизначення `--model` без явного списку fallback для конкретного завдання більше не переходить до основної моделі агента як до мовчазної додаткової цілі повторної спроби.
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

Sidecar стану runtime виводиться з `cron.store`: для сховища `.json`, такого як `~/clawd/cron/jobs.json`, використовується `~/clawd/cron/jobs-state.json`, а до шляху сховища без суфікса `.json` додається `-state.json`.

Вимкнення cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Поведінка повторних спроб">
    **Повторна спроба для одноразових завдань**: тимчасові помилки (обмеження швидкості, перевантаження, мережа, помилка сервера) повторюються до 3 разів з експоненційним backoff. Постійні помилки негайно вимикаються.

    **Повторна спроба для повторюваних завдань**: експоненційний backoff (від 30 с до 60 хв) між повторними спробами. Backoff скидається після наступного успішного запуску.

  </Accordion>
  <Accordion title="Обслуговування">
    `cron.sessionRetention` (типово `24h`) очищає записи сесій ізольованих запусків. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають файли журналів запусків.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

### Ланцюжок команд

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
    - Підтвердьте, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте часовий пояс (`--tz`) порівняно з часовим поясом хоста.
    - `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено через `openclaw cron run <jobId> --due`, і для завдання ще не настав час.
  </Accordion>
  <Accordion title="Cron спрацював, але доставки немає">
    - Режим доставки `none` означає, що резервне надсилання runner не очікується. Агент усе ще може надсилати напряму через інструмент `message`, коли маршрут чату доступний.
    - Відсутня/некоректна ціль доставки (`channel`/`to`) означає, що вихідне надсилання було пропущено.
    - Для Matrix скопійовані або застарілі завдання з room ID у `delivery.to`, записаними в нижньому регістрі, можуть завершуватися помилкою, оскільки room ID Matrix чутливі до регістру. Відредагуйте завдання, вказавши точне значення `!room:server` або `room:!room:server` із Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку було заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише тихий токен (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряме вихідне надсилання, а також резервний шлях підсумку в черзі, тож у чат нічого не буде опубліковано.
    - Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` із попереднім чатом або явний канал/ціль).
  </Accordion>
  <Accordion title="Схоже, що Cron або Heartbeat заважає rollover у стилі /new">
    - Актуальність щоденного скидання та скидання через неактивність не базується на `updatedAt`; див. [Керування сесіями](/uk/concepts/session#session-lifecycle).
    - Пробудження cron, запуски heartbeat, сповіщення exec і службові дії gateway можуть оновлювати рядок сесії для маршрутизації/стану, але вони не подовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сесії в transcript JSONL, якщо файл усе ще доступний. Застарілі рядки неактивності без `lastInteractionAt` використовують цей відновлений час початку як базову точку неактивності.
  </Accordion>
  <Accordion title="Підводні камені з часовими поясами">
    - Cron без `--tz` використовує часовий пояс хоста gateway.
    - Розклади `at` без часового поясу трактуються як UTC.
    - `activeHours` Heartbeat використовує визначення часового поясу з конфігурації.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — усі механізми автоматизації в одному місці
- [Фонові завдання](/uk/automation/tasks) — реєстр завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні цикли основної сесії
- [Часовий пояс](/uk/concepts/timezone) — конфігурація часового поясу
