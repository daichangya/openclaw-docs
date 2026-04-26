---
read_when:
    - Ви хочете зрозуміти, як OpenClaw збирає контекст моделі
    - Ви перемикаєтеся між застарілим рушієм і рушієм Plugin
    - Ви створюєте plugin рушія контексту
sidebarTitle: Context engine
summary: 'Рушій контексту: підключуване збирання контексту, Compaction і життєвий цикл субагента'
title: Рушій контексту
x-i18n:
    generated_at: "2026-04-26T07:00:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c7c868e6e1316ae64fe971eabd8e0d35daab05dbb7abfae4a72f8f5e32e5fc
    source_path: concepts/context-engine.md
    workflow: 15
---

**Рушій контексту** керує тим, як OpenClaw формує контекст моделі для кожного запуску: які повідомлення включати, як стисло підсумовувати старішу історію та як керувати контекстом між межами субагентів.

OpenClaw постачається з вбудованим рушієм `legacy` і використовує його типово — більшості користувачів ніколи не потрібно це змінювати. Встановлюйте та обирайте plugin рушій лише тоді, коли вам потрібна інша побудова, Compaction або поведінка згадування між сесіями.

## Швидкий старт

<Steps>
  <Step title="Перевірте, який рушій активний">
    ```bash
    openclaw doctor
    # або перевірте конфігурацію напряму:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Встановіть plugin рушій">
    Plugins рушія контексту встановлюються так само, як і будь-який інший plugin OpenClaw.

    <Tabs>
      <Tab title="З npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="З локального шляху">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Увімкніть і виберіть рушій">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // має збігатися із зареєстрованим id рушія plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Конфігурація, специфічна для Plugin, указується тут (див. документацію plugin)
          },
        },
      },
    }
    ```

    Перезапустіть Gateway після встановлення та налаштування.

  </Step>
  <Step title="Поверніться до legacy (необов’язково)">
    Установіть `contextEngine` у `"legacy"` (або повністю видаліть цей ключ — `"legacy"` використовується типово).
  </Step>
</Steps>

## Як це працює

Щоразу, коли OpenClaw запускає запит моделі, рушій контексту бере участь у чотирьох точках життєвого циклу:

<AccordionGroup>
  <Accordion title="1. Інгест">
    Викликається, коли до сесії додається нове повідомлення. Рушій може зберігати або індексувати повідомлення у власному сховищі даних.
  </Accordion>
  <Accordion title="2. Збирання">
    Викликається перед кожним запуском моделі. Рушій повертає впорядкований набір повідомлень (і необов’язковий `systemPromptAddition`), які вміщуються в бюджет токенів.
  </Accordion>
  <Accordion title="3. Compaction">
    Викликається, коли вікно контексту заповнене або коли користувач запускає `/compact`. Рушій стисло підсумовує старішу історію, щоб звільнити місце.
  </Accordion>
  <Accordion title="4. Після ходу">
    Викликається після завершення запуску. Рушій може зберегти стан, запустити фоновий Compaction або оновити індекси.
  </Accordion>
</AccordionGroup>

Для вбудованої не-ACP обв’язки Codex OpenClaw застосовує той самий життєвий цикл, проєктуючи зібраний контекст в інструкції розробника Codex і prompt поточного ходу. Codex, як і раніше, керує власною нативною історією потоку та нативним компактором.

### Життєвий цикл субагента (необов’язково)

OpenClaw викликає два необов’язкові хуки життєвого циклу субагента:

<ParamField path="prepareSubagentSpawn" type="method">
  Підготуйте спільний стан контексту перед початком дочірнього запуску. Хук отримує ключі батьківської/дочірньої сесії, `contextMode` (`isolated` або `fork`), доступні id/файли транскриптів і необов’язковий TTL. Якщо він повертає дескриптор відкату, OpenClaw викликає його, коли spawn завершується невдачею після успішної підготовки.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Очистіть стан, коли сесія субагента завершується або прибирається.
</ParamField>

### Додавання до системного prompt

Метод `assemble` може повертати рядок `systemPromptAddition`. OpenClaw додає його на початок системного prompt для запуску. Це дозволяє рушіям додавати динамічні вказівки для згадування, інструкції з retrieval або підказки з урахуванням контексту без потреби в статичних файлах робочого простору.

## Рушій legacy

Вбудований рушій `legacy` зберігає початкову поведінку OpenClaw:

- **Інгест**: no-op (менеджер сесій самостійно обробляє збереження повідомлень).
- **Збирання**: наскрізна передача (наявний конвеєр sanitize → validate → limit у runtime обробляє збирання контексту).
- **Compaction**: делегує вбудованому стислому підсумовуванню, яке створює єдиний підсумок старіших повідомлень і зберігає недоторканими нещодавні повідомлення.
- **Після ходу**: no-op.

Рушій legacy не реєструє інструменти й не надає `systemPromptAddition`.

Якщо `plugins.slots.contextEngine` не задано (або його встановлено в `"legacy"`), цей рушій використовується автоматично.

## Plugin рушії

Plugin може зареєструвати рушій контексту через API plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Потім увімкніть його в конфігурації:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Інтерфейс ContextEngine

Обов’язкові елементи:

| Елемент            | Видив     | Призначення                                              |
| ------------------ | --------- | -------------------------------------------------------- |
| `info`             | Властивість | Id, назва, версія рушія та ознака того, чи він керує Compaction |
| `ingest(params)`   | Метод     | Зберегти одне повідомлення                               |
| `assemble(params)` | Метод     | Побудувати контекст для запуску моделі (повертає `AssembleResult`) |
| `compact(params)`  | Метод     | Стисло підсумувати/зменшити контекст                     |

`assemble` повертає `AssembleResult` із такими полями:

<ParamField path="messages" type="Message[]" required>
  Впорядковані повідомлення для надсилання моделі.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Оцінка рушієм загальної кількості токенів у зібраному контексті. OpenClaw використовує це для рішень щодо порога Compaction і діагностичної звітності.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Додається на початок системного prompt.
</ParamField>

Необов’язкові елементи:

| Елемент                        | Вид    | Призначення                                                                                                      |
| ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Метод  | Ініціалізувати стан рушія для сесії. Викликається один раз, коли рушій уперше бачить сесію (наприклад, імпортує історію). |
| `ingestBatch(params)`         | Метод  | Інгест завершеного ходу пакетом. Викликається після завершення запуску з усіма повідомленнями цього ходу одразу. |
| `afterTurn(params)`           | Метод  | Робота життєвого циклу після запуску (зберегти стан, запустити фоновий Compaction).                             |
| `prepareSubagentSpawn(params)`| Метод  | Налаштувати спільний стан для дочірньої сесії перед її стартом.                                                  |
| `onSubagentEnded(params)`     | Метод  | Очистити стан після завершення субагента.                                                                        |
| `dispose()`                   | Метод  | Звільнити ресурси. Викликається під час вимкнення Gateway або перезавантаження plugin — не для кожної сесії.     |

### ownsCompaction

`ownsCompaction` визначає, чи залишається увімкненим вбудований автоматичний Compaction Pi під час спроби для цього запуску:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Рушій сам керує поведінкою Compaction. OpenClaw вимикає вбудований автоматичний Compaction Pi для цього запуску, і реалізація `compact()` цього рушія відповідає за `/compact`, відновлювальний Compaction після переповнення та будь-який проактивний Compaction, який він хоче виконувати в `afterTurn()`. OpenClaw усе ще може запускати запобіжник переповнення перед prompt; коли він прогнозує, що повний транскрипт переповнить ліміт, шлях відновлення викликає `compact()` активного рушія перед надсиланням ще одного prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Вбудований автоматичний Compaction Pi усе ще може запускатися під час виконання prompt, але метод `compact()` активного рушія все одно викликається для `/compact` і відновлення після переповнення.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **не** означає, що OpenClaw автоматично повертається до шляху Compaction рушія legacy.
</Warning>

Це означає, що існують два коректні шаблони plugin:

<Tabs>
  <Tab title="Режим володіння">
    Реалізуйте власний алгоритм Compaction і встановіть `ownsCompaction: true`.
  </Tab>
  <Tab title="Режим делегування">
    Установіть `ownsCompaction: false` і нехай `compact()` викликає `delegateCompactionToRuntime(...)` з `openclaw/plugin-sdk/core`, щоб використовувати вбудовану поведінку Compaction OpenClaw.
  </Tab>
</Tabs>

No-op `compact()` є небезпечним для активного невласного рушія, оскільки він вимикає звичайний шлях `/compact` і відновлення після переповнення для цього слота рушія.

## Довідник конфігурації

```json5
{
  plugins: {
    slots: {
      // Вибирає активний рушій контексту. Типово: "legacy".
      // Установіть id plugin, щоб використовувати plugin рушій.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Цей слот є ексклюзивним під час виконання — для конкретного запуску або операції Compaction визначається лише один зареєстрований рушій контексту. Інші увімкнені plugins `kind: "context-engine"` усе ще можуть завантажуватися й виконувати свій код реєстрації; `plugins.slots.contextEngine` лише визначає, який зареєстрований id рушія OpenClaw використовує, коли йому потрібен рушій контексту.
</Note>

## Зв’язок із Compaction і пам’яттю

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction — це одна з відповідальностей рушія контексту. Рушій legacy делегує її вбудованому стислому підсумовуванню OpenClaw. Plugin рушії можуть реалізовувати будь-яку стратегію Compaction (підсумки DAG, vector retrieval тощо).
  </Accordion>
  <Accordion title="Plugins пам’яті">
    Plugins пам’яті (`plugins.slots.memory`) відокремлені від рушіїв контексту. Plugins пам’яті надають пошук/retrieval; рушії контексту керують тим, що бачить модель. Вони можуть працювати разом — рушій контексту може використовувати дані plugin пам’яті під час збирання. Plugin рушії, які хочуть використовувати шлях prompt активної пам’яті, мають надавати перевагу `buildMemorySystemPromptAddition(...)` з `openclaw/plugin-sdk/core`, який перетворює секції prompt активної пам’яті на готовий для додавання на початок `systemPromptAddition`. Якщо рушію потрібен контроль нижчого рівня, він усе ще може отримувати сирі рядки з `openclaw/plugin-sdk/memory-host-core` через `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Обрізання сесії">
    Обрізання старих результатів інструментів у пам’яті все одно виконується незалежно від того, який рушій контексту активний.
  </Accordion>
</AccordionGroup>

## Поради

- Використовуйте `openclaw doctor`, щоб переконатися, що ваш рушій завантажується правильно.
- Якщо ви перемикаєте рушії, наявні сесії продовжують працювати зі своєю поточною історією. Новий рушій перебирає керування для майбутніх запусків.
- Помилки рушія записуються в журнал і відображаються в діагностиці. Якщо plugin рушій не вдається зареєструвати або не вдається визначити вибраний id рушія, OpenClaw не повертається автоматично до резервного варіанта; запуски завершуються помилкою, доки ви не виправите plugin або не перемкнете `plugins.slots.contextEngine` назад на `"legacy"`.
- Для розробки використовуйте `openclaw plugins install -l ./my-engine`, щоб підключити локальний каталог plugin без копіювання.

## Пов’язані

- [Compaction](/uk/concepts/compaction) — стислий виклад довгих розмов
- [Контекст](/uk/concepts/context) — як будується контекст для ходів агента
- [Архітектура Plugin](/uk/plugins/architecture) — реєстрація plugins рушія контексту
- [Маніфест Plugin](/uk/plugins/manifest) — поля маніфесту plugin
- [Plugins](/uk/tools/plugin) — огляд plugins
