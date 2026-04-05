---
read_when:
    - Вам потрібні детерміновані багатокрокові workflows з явними погодженнями
    - Вам потрібно відновити workflow без повторного виконання попередніх кроків
summary: Типізоване workflow runtime для OpenClaw із відновлюваними етапами погодження.
title: Lobster
x-i18n:
    generated_at: "2026-04-05T18:20:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster — це workflow-оболонка, яка дозволяє OpenClaw виконувати багатокрокові послідовності інструментів як одну детерміновану операцію з явними контрольними точками погодження.

Lobster — це шар створення сценаріїв на один рівень вище за відокремлену фонову роботу. Для оркестрації потоків над окремими завданнями див. [Task Flow](/uk/automation/taskflow) (`openclaw tasks flow`). Для журналу активності завдань див. [`openclaw tasks`](/uk/automation/tasks).

## Хук

Ваш помічник може створювати інструменти, які керують ним самим. Попросіть workflow — і через 30 хвилин у вас буде CLI плюс конвеєри, які виконуються як один виклик. Lobster — це відсутній елемент: детерміновані конвеєри, явні погодження та відновлюваний стан.

## Навіщо

Сьогодні складні workflows потребують багатьох викликів інструментів із поверненням назад і вперед. Кожен виклик коштує токенів, і LLM має оркеструвати кожен крок. Lobster переносить цю оркестрацію в типізоване runtime:

- **Один виклик замість багатьох**: OpenClaw виконує один виклик інструмента Lobster і отримує структурований результат.
- **Погодження вбудовано**: побічні ефекти (надсилання email, публікація коментаря) зупиняють workflow, доки їх явно не погодять.
- **Можна відновити**: зупинені workflows повертають токен; погодьте й відновіть без повторного виконання всього.

## Чому DSL, а не звичайні програми?

Lobster навмисно невеликий. Мета не в тому, щоб створити «нову мову», а в тому, щоб мати передбачувану, дружню до AI специфікацію конвеєрів із погодженнями першого класу та токенами відновлення.

- **Погодження/відновлення вбудовані**: звичайна програма може запитати людину, але не може _призупинитися та відновитися_ з довговічним токеном, якщо ви самі не реалізуєте таке runtime.
- **Детермінованість + аудитованість**: конвеєри — це дані, тому їх легко журналювати, порівнювати, повторювати та перевіряти.
- **Обмежена поверхня для AI**: невелика граматика + JSON-конвеєри зменшують «креативні» шляхи коду й роблять валідацію реалістичною.
- **Політика безпеки вбудована**: тайм-аути, обмеження виводу, перевірки sandbox і allowlists застосовуються runtime, а не кожним скриптом.
- **Усе ще програмоване**: кожен крок може викликати будь-який CLI або скрипт. Якщо вам потрібен JS/TS, генеруйте файли `.lobster` з коду.

## Як це працює

OpenClaw запускає локальний CLI `lobster` у **режимі інструмента** і розбирає JSON-обгортку зі stdout.
Якщо конвеєр призупиняється для погодження, інструмент повертає `resumeToken`, щоб ви могли продовжити пізніше.

## Шаблон: малий CLI + JSON-конвеєри + погодження

Створюйте маленькі команди, які працюють із JSON, а потім об’єднуйте їх в один виклик Lobster. (Нижче наведено приклади назв команд — замініть їх на власні.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Якщо конвеєр запитує погодження, відновіть його за токеном:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI запускає workflow; Lobster виконує кроки. Етапи погодження зберігають побічні ефекти явними та придатними до аудиту.

Приклад: відображення вхідних елементів у виклики інструментів:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Кроки LLM лише з JSON (`llm-task`)

Для workflows, яким потрібен **структурований крок LLM**, увімкніть необов’язковий
plugin tool `llm-task` і викликайте його з Lobster. Це зберігає workflow
детермінованим, але водночас дає змогу класифікувати/узагальнювати/створювати чернетки за допомогою моделі.

Увімкніть інструмент:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Використайте його в конвеєрі:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Докладніше та про параметри конфігурації див. у [LLM Task](/tools/llm-task).

## Файли workflow (.lobster)

Lobster може виконувати YAML/JSON-файли workflow з полями `name`, `args`, `steps`, `env`, `condition` і `approval`. У викликах інструментів OpenClaw задайте `pipeline` як шлях до файла.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Примітки:

- `stdin: $step.stdout` і `stdin: $step.json` передають вивід попереднього кроку.
- `condition` (або `when`) може керувати виконанням кроків на основі `$step.approved`.

## Встановлення Lobster

Встановіть CLI Lobster на **тому самому хості**, де працює Gateway OpenClaw (див. [репозиторій Lobster](https://github.com/openclaw/lobster)), і переконайтеся, що `lobster` є в `PATH`.

## Увімкнення інструмента

Lobster — це **необов’язковий** plugin tool (не увімкнений типово).

Рекомендовано (адитивно, безпечно):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Або для окремого агента:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Уникайте використання `tools.allow: ["lobster"]`, якщо ви не маєте наміру працювати в обмежувальному режимі allowlist.

Примітка: allowlists для необов’язкових plugins є опціональними. Якщо ваш allowlist називає лише
plugin tools (наприклад, `lobster`), OpenClaw залишає core tools увімкненими. Щоб обмежити core
tools, також включіть до allowlist ті core tools або групи, які вам потрібні.

## Приклад: сортування email

Без Lobster:

```
User: "Check my email and draft replies"
→ openclaw викликає gmail.list
→ LLM узагальнює
→ User: "draft replies to #2 and #5"
→ LLM створює чернетки
→ User: "send #2"
→ openclaw викликає gmail.send
(повторюється щодня, без пам’яті про те, що вже було розібрано)
```

З Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Повертає JSON-обгортку (скорочено):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

Користувач погоджується → відновлення:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Один workflow. Детермінований. Безпечний.

## Параметри інструмента

### `run`

Запускає конвеєр у режимі інструмента.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Запуск файла workflow з аргументами:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Продовжує зупинений workflow після погодження.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Необов’язкові вхідні параметри

- `cwd`: Відносний робочий каталог для конвеєра (має залишатися в межах поточного робочого каталогу процесу).
- `timeoutMs`: Завершити підпроцес, якщо він перевищує цю тривалість (типово: 20000).
- `maxStdoutBytes`: Завершити підпроцес, якщо stdout перевищує цей розмір (типово: 512000).
- `argsJson`: JSON-рядок, який передається в `lobster run --args-json` (лише для файлів workflow).

## Обгортка виводу

Lobster повертає JSON-обгортку з одним із трьох статусів:

- `ok` → успішно завершено
- `needs_approval` → призупинено; для відновлення потрібен `requiresApproval.resumeToken`
- `cancelled` → явно відхилено або скасовано

Інструмент віддає цю обгортку і в `content` (форматований JSON), і в `details` (сирий об’єкт).

## Погодження

Якщо присутній `requiresApproval`, перегляньте запит і вирішіть:

- `approve: true` → відновити й продовжити побічні ефекти
- `approve: false` → скасувати й завершити workflow

Використовуйте `approve --preview-from-stdin --limit N`, щоб додавати JSON-попередній перегляд до запитів на погодження без власного glue-коду на jq/heredoc. Тепер токени відновлення компактні: Lobster зберігає стан відновлення workflow у своєму каталозі стану й повертає невеликий ключ токена.

## OpenProse

OpenProse добре поєднується з Lobster: використовуйте `/prose` для оркестрації підготовки кількох агентів, а потім запускайте конвеєр Lobster для детермінованих погоджень. Якщо програмі Prose потрібен Lobster, дозвольте інструмент `lobster` для субагентів через `tools.subagents.tools`. Див. [OpenProse](/uk/prose).

## Безпека

- **Лише локальний підпроцес** — сам plugin не виконує мережевих викликів.
- **Без секретів** — Lobster не керує OAuth; він викликає інструменти OpenClaw, які це роблять.
- **З урахуванням sandbox** — вимкнено, коли контекст інструмента sandboxed.
- **Захищено** — фіксована назва виконуваного файла (`lobster`) у `PATH`; застосовуються тайм-аути та обмеження виводу.

## Усунення несправностей

- **`lobster subprocess timed out`** → збільшіть `timeoutMs` або розбийте довгий конвеєр.
- **`lobster output exceeded maxStdoutBytes`** → збільшіть `maxStdoutBytes` або зменште розмір виводу.
- **`lobster returned invalid JSON`** → переконайтеся, що конвеєр працює в режимі інструмента і виводить лише JSON.
- **`lobster failed (code …)`** → запустіть той самий конвеєр у терміналі, щоб перевірити stderr.

## Дізнатися більше

- [Plugins](/tools/plugin)
- [Створення plugin tools](/uk/plugins/building-plugins#registering-agent-tools)

## Приклад із практики: workflows спільноти

Один публічний приклад: CLI «другий мозок» + конвеєри Lobster, які керують трьома Markdown-сховищами (особистим, партнерським, спільним). CLI виводить JSON для статистики, списків inbox і перевірок застарілих елементів; Lobster об’єднує ці команди у workflows на кшталт `weekly-review`, `inbox-triage`, `memory-consolidation` і `shared-task-sync`, кожен із етапами погодження. AI виконує оцінювальну роботу (категоризацію), коли це доступно, і повертається до детермінованих правил, коли ні.

- Гілка: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Репозиторій: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — планування workflows Lobster
- [Огляд автоматизації](/uk/automation) — усі механізми автоматизації
- [Огляд інструментів](/tools) — усі доступні інструменти агента
