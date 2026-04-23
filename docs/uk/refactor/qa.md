---
read_when:
    - Рефакторинг визначень QA-сценаріїв або коду harness qa-lab
    - Переміщення поведінки QA між Markdown-сценаріями та логікою harness у TypeScript
summary: План рефакторингу QA для каталогу сценаріїв і консолідації harness-ів
title: Рефакторинг QA
x-i18n:
    generated_at: "2026-04-23T23:06:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d193f449764f9a5fde6c3655c9e16ac5f1d76624de43cd5fbf79a6b0ca7d986
    source_path: refactor/qa.md
    workflow: 15
---

Статус: базову міграцію завершено.

## Мета

Перевести QA OpenClaw з моделі розділених визначень на єдине джерело істини:

- метадані сценаріїв
- prompt-и, що надсилаються моделі
- налаштування і завершення
- логіка harness
- перевірки та критерії успіху
- артефакти й підказки для звітів

Бажаний кінцевий стан — це універсальний QA harness, який завантажує потужні файли визначення сценаріїв замість жорсткого кодування більшості поведінки в TypeScript.

## Поточний стан

Основне джерело істини тепер міститься в `qa/scenarios/index.md` плюс по одному файлу на
сценарій у `qa/scenarios/<theme>/*.md`.

Реалізовано:

- `qa/scenarios/index.md`
  - канонічні метадані QA pack
  - ідентичність оператора
  - стартова місія
- `qa/scenarios/<theme>/*.md`
  - один markdown-файл на сценарій
  - метадані сценарію
  - прив’язки handler-ів
  - конфігурація виконання, специфічна для сценарію
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown-парсер pack + валідація через zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - рендеринг плану з markdown-pack
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - підготовка згенерованих файлів сумісності плюс `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - вибір виконуваних сценаріїв через визначені в markdown прив’язки handler-ів
- протокол QA bus + UI
  - універсальні inline-вкладення для рендерингу image/video/audio/file

Поверхні, які ще лишаються розділеними:

- `extensions/qa-lab/src/suite.ts`
  - все ще містить більшість виконуваної користувацької логіки handler-ів
- `extensions/qa-lab/src/report.ts`
  - все ще виводить структуру звіту з runtime-виводів

Отже, розділення джерела істини вже усунуто, але виконання все ще здебільшого спирається на handler-и, а не є повністю декларативним.

## Як насправді виглядає поверхня сценаріїв

Читання поточного suite показує кілька окремих класів сценаріїв.

### Проста взаємодія

- базова перевірка каналу
- базова перевірка DM
- подальша дія в потоці
- перемикання моделі
- доведення підтвердження до завершення
- реакція/редагування/видалення

### Зміна config і runtime

- вимкнення skill через patch config
- пробудження після перезапуску через config apply
- перемикання можливостей після перезапуску config
- перевірка дрейфу inventory runtime

### Перевірки файлової системи та репозиторію

- звіт про виявлення source/docs
- зібрати Lobster Invaders
- пошук артефакту згенерованого зображення

### Оркестрація пам’яті

- відновлення пам’яті
- інструменти пам’яті в контексті каналу
- fallback при збоях пам’яті
- ранжування пам’яті сесії
- ізоляція пам’яті потоку
- прохід Dreaming для пам’яті

### Інтеграція інструментів і Plugin-ів

- виклик MCP plugin-tools
- видимість skill
- гаряче встановлення skill
- native-генерація зображень
- image roundtrip
- розуміння зображення з вкладення

### Багатоциклові та багатокористувацькі

- передача керування субагенту
- fanout synthesis субагента
- потоки відновлення після перезапуску

Ці категорії важливі, оскільки вони визначають вимоги до DSL. Плоского списку prompt + очікуваний текст недостатньо.

## Напрямок

### Єдине джерело істини

Використовувати `qa/scenarios/index.md` плюс `qa/scenarios/<theme>/*.md` як
авторське джерело істини.

Pack має залишатися:

- читабельним для людини під час review
- придатним до машинного парсингу
- достатньо багатим, щоб керувати:
  - виконанням suite
  - bootstrap робочого простору QA
  - метаданими UI QA Lab
  - prompt-ами для docs/discovery
  - генерацією звітів

### Бажаний формат авторинга

Використовувати markdown як формат верхнього рівня зі структурованим YAML усередині нього.

Рекомендована форма:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - перевизначення model/provider
  - prerequisites
- прозові секції
  - objective
  - notes
  - debugging hints
- fenced YAML-блоки
  - setup
  - steps
  - assertions
  - cleanup

Це дає:

- кращу читабельність PR, ніж гігантський JSON
- багатший контекст, ніж чистий YAML
- строгий парсинг і валідацію через zod

Сирий JSON прийнятний лише як проміжна згенерована форма.

## Запропонована форма файла сценарію

Приклад:

````md
---
id: image-generation-roundtrip
title: Roundtrip генерації зображення
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Мета

Перевірити, що згенероване медіа повторно приєднується в наступному циклі.

# Налаштування

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Кроки

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Перевірка генерації зображення: згенеруй QA-зображення маяка й коротко підсумуй його одним реченням.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Перевірка генерації зображення
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Перевірка огляду roundtrip-зображення: опиши згенероване вкладення з маяком одним коротким реченням.
  attachments:
    - fromArtifact: lighthouseImage
```

# Очікування

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Можливості runner-а, які має покривати DSL

На основі поточного suite універсальний runner має підтримувати більше, ніж просто виконання prompt-ів.

### Дії середовища і налаштування

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Дії циклу агента

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Дії config і runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Дії з файлами й артефактами

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Дії з пам’яттю і cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Дії MCP

- `mcp.callTool`

### Перевірки

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Змінні та посилання на артефакти

DSL має підтримувати збережені результати й подальші посилання на них.

Приклади з поточного suite:

- створити потік, а потім повторно використати `threadId`
- створити сесію, а потім повторно використати `sessionKey`
- згенерувати зображення, а потім прикріпити файл у наступному циклі
- згенерувати рядок-маркер пробудження, а потім перевірити, що він з’являється пізніше

Потрібні можливості:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- типізовані посилання для шляхів, ключів сесій, id потоків, маркерів, виводів інструментів

Без підтримки змінних harness і далі витікатиме логікою сценаріїв назад у TypeScript.

## Що має залишитися як escape hatch

Повністю чистий декларативний runner нереалістичний у фазі 1.

Деякі сценарії за своєю природою потребують важкої оркестрації:

- прохід Dreaming для пам’яті
- пробудження після перезапуску через config apply
- перемикання можливостей після перезапуску config
- визначення артефакту згенерованого зображення за timestamp/path
- оцінювання discovery-report

Поки що для них слід використовувати явні користувацькі handler-и.

Рекомендоване правило:

- 85-90% декларативно
- явні кроки `customHandler` для складного залишку
- лише іменовані та задокументовані користувацькі handler-и
- жодного анонімного inline-коду у файлі сценарію

Це дозволяє зберігати універсальний engine чистим і водночас рухатися вперед.

## Зміна архітектури

### Поточний стан

Markdown-сценарії вже є джерелом істини для:

- виконання suite
- файлів bootstrap робочого простору
- каталогу сценаріїв UI QA Lab
- метаданих звітів
- prompt-ів discovery

Згенерована сумісність:

- підготовлений робочий простір усе ще містить `QA_KICKOFF_TASK.md`
- підготовлений робочий простір усе ще містить `QA_SCENARIO_PLAN.md`
- підготовлений робочий простір тепер також містить `QA_SCENARIOS.md`

## План рефакторингу

### Фаза 1: loader і schema

Виконано.

- додано `qa/scenarios/index.md`
- сценарії розділено на `qa/scenarios/<theme>/*.md`
- додано парсер для іменованого markdown-вмісту pack у YAML
- додано валідацію через zod
- споживачів переведено на парсений pack
- видалено `qa/seed-scenarios.json` і `qa/QA_KICKOFF_TASK.md` на рівні репозиторію

### Фаза 2: універсальний engine

- розбити `extensions/qa-lab/src/suite.ts` на:
  - loader
  - engine
  - реєстр дій
  - реєстр перевірок
  - користувацькі handler-и
- зберегти наявні helper-функції як операції engine

Результат:

- engine виконує прості декларативні сценарії

Почати зі сценаріїв, які здебільшого складаються з prompt + wait + assert:

- подальша дія в потоці
- розуміння зображення з вкладення
- видимість і виклик skill
- базова перевірка каналу

Результат:

- перші реальні сценарії, визначені в markdown, постачаються через універсальний engine

### Фаза 4: міграція сценаріїв середньої складності

- image generation roundtrip
- інструменти пам’яті в контексті каналу
- ранжування пам’яті сесії
- передача керування субагенту
- fanout synthesis субагента

Результат:

- підтверджено роботу змінних, артефактів, перевірок інструментів і перевірок request-log

### Фаза 5: залишити складні сценарії на користувацьких handler-ах

- прохід Dreaming для пам’яті
- пробудження після перезапуску через config apply
- перемикання можливостей після перезапуску config
- дрейф inventory runtime

Результат:

- той самий формат авторинга, але з явними блоками custom-step там, де це потрібно

### Фаза 6: видалити map сценаріїв із жорстким кодуванням

Щойно покриття pack стане достатньо добрим:

- видалити більшість специфічних для сценаріїв розгалужень TypeScript із `extensions/qa-lab/src/suite.ts`

## Підтримка fake Slack / rich media

Поточний QA bus орієнтований насамперед на текст.

Релевантні файли:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Сьогодні QA bus підтримує:

- текст
- реакції
- потоки

Він ще не моделює inline-медіавкладення.

### Потрібний транспортний контракт

Додати універсальну модель вкладень QA bus:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Потім додати `attachments?: QaBusAttachment[]` до:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Чому спершу універсально

Не створювати модель медіа лише для Slack.

Натомість:

- одна універсальна транспортна модель QA
- кілька renderer-ів поверх неї
  - поточний чат QA Lab
  - майбутній fake Slack web
  - будь-які інші подання fake transport

Це запобігає дублюванню логіки й дозволяє медіасценаріям залишатися незалежними від транспорту.

### Потрібна робота в UI

Оновити UI QA для рендерингу:

- inline-preview зображення
- inline-аудіоплеєра
- inline-відеоплеєра
- chip вкладеного файла

Поточний UI уже вміє рендерити потоки й реакції, тож рендеринг вкладень має накластися на ту саму модель картки повідомлення.

### Які сценарії відкриє медіатранспорт

Щойно вкладення почнуть проходити через QA bus, можна буде додати багатші fake-chat сценарії:

- inline-відповідь із зображенням у fake Slack
- розуміння аудіовкладення
- розуміння відеовкладення
- змішаний порядок вкладень
- відповідь у потоці зі збереженням медіа

## Рекомендація

Наступний етап реалізації має бути таким:

1. додати markdown-loader сценаріїв + zod-schema
2. згенерувати поточний каталог із markdown
3. спершу мігрувати кілька простих сценаріїв
4. додати універсальну підтримку вкладень у QA bus
5. реалізувати рендеринг inline-зображення в UI QA
6. потім розширити на аудіо та відео

Це найменший шлях, який доводить обидві цілі:

- універсальний QA, визначений через markdown
- багатші fake-поверхні обміну повідомленнями

## Відкриті питання

- чи мають файли сценаріїв дозволяти вбудовані markdown-шаблони prompt-ів з інтерполяцією змінних
- чи мають setup/cleanup бути іменованими секціями, чи просто впорядкованими списками дій
- чи мають посилання на артефакти бути строго типізованими в schema, чи базуватися на рядках
- чи мають користувацькі handler-и жити в одному реєстрі чи в реєстрах за поверхнями
- чи має згенерований JSON-файл сумісності залишатися закоміченим під час міграції
