---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook-и, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, Webhook-и та тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-04-27T06:34:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7df825e11a574929f221214611ae041db94aec5b8ddd2101ac88a22427af3b1
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента у потрібний час і може повертати результат назад у чат-канал або до кінцевої точки Webhook.

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

- Cron запускається **всередині процесу Gateway** (а не всередині моделі).
- Визначення завдань зберігаються у `~/.openclaw/cron/jobs.json`, тому перезапуски не призводять до втрати розкладів.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json` і додавайте `jobs-state.json` до gitignore.
- Після цього розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть сприймати завдання як нові, оскільки поля стану виконання тепер містяться в `jobs-state.json`.
- Усі виконання cron створюють записи [фонових завдань](/uk/automation/tasks).
- Одноразові завдання (`--at`) типово автоматично видаляються після успішного виконання.
- Ізольовані запуски cron у межах best-effort закривають відстежувані вкладки браузера/процеси для своєї сесії `cron:<jobId>` після завершення запуску, щоб відокремлена автоматизація браузера не залишала після себе осиротілі процеси.
- Ізольовані запуски cron також захищаються від застарілих відповідей-підтверджень. Якщо перший результат — це лише проміжне оновлення статусу (`on it`, `pulling everything together` та подібні підказки), і жоден дочірній запуск subagent більше не відповідає за фінальну відповідь, OpenClaw повторно формує запит один раз, щоб отримати фактичний результат перед доставленням.
- Ізольовані запуски cron надають перевагу структурованим метаданим відмови виконання з вбудованого запуску, а потім повертаються до відомих маркерів фінального підсумку/виводу, таких як `SYSTEM_RUN_DENIED` і `INVALID_REQUEST`, щоб заблокована команда не була позначена як успішний запуск.
- Ізольовані запуски cron також трактують збої агента на рівні запуску як помилки завдання, навіть якщо жодного payload відповіді не було створено, тож збої моделі/провайдера збільшують лічильники помилок і спричиняють сповіщення про збої, а не очищають завдання як успішне.

<a id="maintenance"></a>

<Note>
Узгодження завдань для cron спочатку належить runtime, а вже потім спирається на довговічну історію: активне завдання cron лишається активним, поки runtime cron усе ще відстежує це завдання як таке, що виконується, навіть якщо старий рядок дочірньої сесії все ще існує. Щойно runtime перестає володіти завданням і спливає 5-хвилинне вікно очікування, перевірки обслуговування звіряють збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця довговічна історія показує термінальний результат, реєстр завдань завершується на її основі; інакше обслуговування, яким володіє Gateway, може позначити завдання як `lost`. Автономний аудит CLI може відновитися з довговічної історії, але не розглядає власний порожній внутрішньопроцесний набір активних завдань як доказ того, що запуск cron, яким володіє Gateway, зник.
</Note>

## Типи розкладу

| Kind    | CLI flag  | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Одноразова позначка часу (ISO 8601 або відносна, як-от `20m`) |
| `every` | `--every` | Фіксований інтервал                                     |
| `cron`  | `--cron`  | 5-польовий або 6-польовий cron-вираз з необов’язковим `--tz` |

Позначки часу без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним настінним часом.

Періодичні вирази на початок кожної години автоматично зміщуються до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово задати точний час, або `--stagger 30s` для явного вікна.

### День місяця і день тижня використовують логіку OR

Cron-вирази розбираються за допомогою [croner](https://github.com/Hexagon/croner). Коли і поля дня місяця, і поля дня тижня не є wildcard, croner виконує збіг, коли **збігається будь-яке** з полів — а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. OpenClaw тут використовує типову OR-поведінку Croner. Щоб вимагати обидві умови, використовуйте модифікатор дня тижня `+` від Croner (`0 9 15 * +1`) або плануйте за одним полем, а інше перевіряйте в prompt чи команді вашого завдання.

## Стилі виконання

| Стиль           | Значення `--session`  | Виконується в            | Найкраще підходить для          |
| --------------- | --------------------- | ------------------------ | ------------------------------- |
| Основна сесія   | `main`                | Наступний цикл heartbeat | Нагадувань, системних подій     |
| Ізольований     | `isolated`            | Виділений `cron:<jobId>` | Звітів, фонових рутин           |
| Поточна сесія   | `current`             | Прив’язується під час створення | Періодичної роботи з урахуванням контексту |
| Користувацька сесія | `session:custom-id` | Постійна іменована сесія | Робочих процесів, що спираються на історію |

<AccordionGroup>
  <Accordion title="Основна сесія vs ізольована vs користувацька">
    Завдання **основної сесії** ставлять системну подію в чергу та за потреби пробуджують heartbeat (`--wake now` або `--wake next-heartbeat`). Ці системні події не подовжують свіжість щоденного/неактивного скидання для цільової сесії. **Ізольовані** завдання запускають окремий хід агента з новою сесією. **Користувацькі сесії** (`session:xxx`) зберігають контекст між запусками, що дає змогу будувати процеси на кшталт щоденних стендапів на основі попередніх підсумків.
  </Accordion>
  <Accordion title="Що означає 'нова сесія' для ізольованих завдань">
    Для ізольованих завдань "нова сесія" означає новий ідентифікатор transcript/session для кожного запуску. OpenClaw може переносити безпечні налаштування, як-от thinking/fast/verbose, мітки та явно вибрані користувачем перевизначення model/auth, але не успадковує фоновий контекст розмови зі старішого рядка cron: маршрутизацію каналу/групи, політику надсилання чи черги, підвищення привілеїв, походження або прив’язку runtime ACP. Використовуйте `current` або `session:<id>`, коли періодичне завдання має свідомо продовжувати той самий контекст розмови.
  </Accordion>
  <Accordion title="Очищення runtime">
    Для ізольованих завдань завершення runtime тепер включає best-effort очищення браузера для цієї сесії cron. Помилки очищення ігноруються, щоб фактичний результат cron усе одно мав пріоритет.

    Ізольовані запуски cron також звільняють будь-які вбудовані екземпляри runtime MCP, створені для завдання через спільний шлях очищення runtime. Це відповідає тому, як клієнти MCP основної та користувацької сесій завершуються, тож ізольовані завдання cron не спричиняють витоків дочірніх stdio-процесів або довгоживучих MCP-з’єднань між запусками.

  </Accordion>
  <Accordion title="Subagent і доставлення в Discord">
    Коли ізольовані запуски cron оркеструють subagent, доставлення також надає перевагу фінальному виводу нащадка замість застарілого проміжного тексту батьківського запуску. Якщо нащадки все ще виконуються, OpenClaw пригнічує це часткове батьківське оновлення замість того, щоб оголошувати його.

    Для цілей оголошення Discord лише з текстом OpenClaw надсилає канонічний фінальний текст помічника один раз, замість повторного відтворення і потокових/проміжних текстових payload, і фінальної відповіді. Медіа та структуровані payload Discord, як і раніше, доставляються окремими payload, щоб не втрачалися вкладення й компоненти.

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
  Пропустити ін’єкцію файла bootstrap робочого простору.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити, які інструменти може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану дозволену модель для цього завдання. Якщо запитана модель не дозволена, cron записує попередження в журнал і натомість повертається до вибору моделі агента/типової моделі для завдання. Налаштовані ланцюжки fallback, як і раніше, застосовуються, але звичайне перевизначення моделі без явного списку fallback для конкретного завдання більше не додає основну модель агента як приховану додаткову ціль повторної спроби.

Пріоритет вибору моделі для ізольованих завдань такий:

1. Перевизначення моделі Gmail hook (коли запуск надійшов із Gmail і це перевизначення дозволене)
2. `model` у payload конкретного завдання
3. Збережене перевизначення моделі сесії cron, вибране користувачем
4. Вибір моделі агента/типової моделі

Швидкий режим також наслідує розв’язаний активний вибір. Якщо вибрана конфігурація моделі має `params.fastMode`, ізольований cron типово використовує його. Збережене в сесії перевизначення `fastMode` усе одно має пріоритет над конфігурацією в обох напрямках.

Якщо ізольований запуск натрапляє на живий handoff перемикання моделі, cron виконує повторну спробу з переключеним провайдером/моделлю та зберігає цей активний вибір для поточного запуску перед повторною спробою. Коли перемикання також містить новий профіль auth, cron теж зберігає це перевизначення профілю auth для поточного запуску. Кількість повторних спроб обмежена: після початкової спроби плюс 2 повторні спроби через перемикання cron перериває роботу замість безкінечного циклу.

## Доставлення та вивід

| Режим      | Що відбувається                                                     |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Резервно доставляє фінальний текст до цілі, якщо агент його не надіслав |
| `webhook`  | Надсилає POST payload завершеної події на URL                       |
| `none`     | Без резервного доставлення з боку runner                            |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставлення в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`). Ідентифікатори кімнат Matrix чутливі до регістру; використовуйте точний ID кімнати або форму `room:!room:server` із Matrix.

Для ізольованих завдань доставлення в чат є спільним. Якщо доступний маршрут чату, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає повідомлення до налаштованої/поточної цілі, OpenClaw пропускає резервне оголошення. В іншому разі `announce`, `webhook` і `none` керують лише тим, що runner робить із фінальною відповіддю після ходу агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену активну ціль доставлення для резервного маршруту оголошення. Внутрішні ключі сесії можуть бути у нижньому регістрі; цілі доставлення провайдера не відновлюються з цих ключів, коли доступний поточний контекст чату.

Сповіщення про збої використовують окремий маршрут призначення:

- `cron.failureDestination` задає глобальне типове призначення для сповіщень про збої.
- `job.delivery.failureDestination` перевизначає це для конкретного завдання.
- Якщо жодне з них не задано і завдання вже доставляє через `announce`, сповіщення про збої тепер резервно надсилаються на цю основну ціль `announce`.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний режим доставлення не є `webhook`.
- `failureAlert.includeSkipped: true` дає змогу завданню або глобальній політиці сповіщень cron повторно повідомляти про пропущені запуски. Пропущені запуски ведуть окремий лічильник послідовних пропусків, тож вони не впливають на backoff помилок виконання.

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
  <Tab title="Періодичне ізольоване завдання">
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

Кожен запит має містити токен hook через заголовок:

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
    Запустити ізольований хід агента:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Поля: `message` (обов’язково), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Зіставлені hooks (POST /hooks/<name>)">
    Користувацькі імена hook розв’язуються через `hooks.mappings` у конфігурації. Зіставлення можуть перетворювати довільні payload на дії `wake` або `agent` за допомогою шаблонів або кодових перетворень.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте кінцеві точки hook за loopback, tailnet або довіреним reverse proxy.

- Використовуйте окремий токен hook; не використовуйте повторно токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Встановіть `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також встановіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів сесії.
- Payload hook типово обгортаються межами безпеки.
  </Warning>

## Інтеграція Gmail PubSub

Підключіть тригери вхідної пошти Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічної HTTPS-кінцевої точки.
</Note>

### Налаштування через майстер (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує конфігурацію `hooks.gmail`, вмикає пресет Gmail і використовує Tailscale Funnel для push-кінцевої точки.

### Автозапуск Gateway

Коли `hooks.enabled=true` і встановлено `hooks.gmail.account`, Gateway під час завантаження запускає `gog gmail watch serve` і автоматично поновлює watch. Щоб відмовитися, встановіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`.

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
  <Step title="Створіть topic і надайте Gmail доступ на push">
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
- Якщо модель дозволена, саме ця пара провайдер/модель передається до ізольованого запуску агента.
- Якщо вона не дозволена, cron видає попередження і повертається до вибору моделі агента/типової моделі для завдання.
- Налаштовані ланцюжки fallback, як і раніше, застосовуються, але звичайне перевизначення `--model` без явного списку fallback для конкретного завдання більше не переходить до основної моделі агента як до мовчазної додаткової цілі повторної спроби.
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

Sidecar стану runtime виводиться з `cron.store`: сховище `.json`, таке як `~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, тоді як до шляху сховища без суфікса `.json` додається `-state.json`.

Вимкнення cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Поведінка повторних спроб">
    **Повторна спроба для одноразового завдання**: тимчасові помилки (ліміт швидкості, перевантаження, мережа, помилка сервера) повторюються до 3 разів з експоненційним backoff. Постійні помилки одразу вимикають завдання.

    **Повторна спроба для періодичного завдання**: експоненційний backoff (від 30 с до 60 хв) між повторами. Backoff скидається після наступного успішного запуску.

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
    - Підтвердьте, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте часовий пояс (`--tz`) відносно часового поясу хоста.
    - `reason: not-due` у виводі запуску означає, що ручний запуск перевірявся через `openclaw cron run <jobId> --due` і час виконання завдання ще не настав.
  </Accordion>
  <Accordion title="Cron спрацював, але не було доставлення">
    - Режим доставлення `none` означає, що резервне надсилання з боку runner не очікується. Агент усе ще може напряму надсилати через інструмент `message`, коли доступний маршрут чату.
    - Відсутня/некоректна ціль доставлення (`channel`/`to`) означає, що вихідне надсилання було пропущено.
    - Для Matrix скопійовані або застарілі завдання з `delivery.to` room ID у нижньому регістрі можуть не працювати, оскільки room ID Matrix чутливі до регістру. Відредагуйте завдання, вказавши точне значення `!room:server` або `room:!room:server` з Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставлення було заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише тихий токен (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряме вихідне доставлення, а також резервний шлях підсумку в черзі, тому назад у чат нічого не публікується.
    - Якщо агент має сам написати користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` із попереднім чатом або явний канал/ціль).
  </Accordion>
  <Accordion title="Cron або heartbeat начебто заважають rollover у стилі /new">
    - Свіжість щоденного скидання та скидання через неактивність не базується на `updatedAt`; див. [Керування сесіями](/uk/concepts/session#session-lifecycle).
    - Пробудження cron, запуски heartbeat, сповіщення exec і службові операції gateway можуть оновлювати рядок сесії для маршрутизації/статусу, але не подовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сесії transcript JSONL, якщо файл усе ще доступний. Застарілі рядки неактивності без `lastInteractionAt` використовують цей відновлений час початку як базову точку неактивності.
  </Accordion>
  <Accordion title="Підводні камені часових поясів">
    - Cron без `--tz` використовує часовий пояс хоста gateway.
    - Розклади `at` без часового поясу трактуються як UTC.
    - `activeHours` Heartbeat використовує налаштоване визначення часового поясу.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — усі механізми автоматизації з одного погляду
- [Фонові завдання](/uk/automation/tasks) — реєстр завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні цикли основної сесії
- [Часовий пояс](/uk/concepts/timezone) — конфігурація часового поясу
