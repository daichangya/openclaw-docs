---
read_when:
    - Рефакторинг визначень QA-сценаріїв або коду harness qa-lab
    - Перенесення поведінки QA між markdown-сценаріями та логікою harness на TypeScript
summary: План рефакторингу QA для консолідації каталогу сценаріїв і harness
title: Рефакторинг QA
x-i18n:
    generated_at: "2026-04-23T06:47:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# Рефакторинг QA

Статус: базову міграцію завершено.

## Мета

Перевести QA OpenClaw з моделі розділених визначень до єдиного джерела істини:

- метадані сценарію
- prompts, що надсилаються моделі
- setup і teardown
- логіка harness
- assertions і критерії успіху
- artifacts і підказки для звіту

Бажаний кінцевий стан — узагальнений QA harness, який завантажує потужні файли визначення сценаріїв замість жорстко закодованої більшості поведінки в TypeScript.

## Поточний стан

Основне джерело істини тепер міститься в `qa/scenarios/index.md` плюс по одному файлу на
кожен сценарій у `qa/scenarios/<theme>/*.md`.

Реалізовано:

- `qa/scenarios/index.md`
  - канонічні метадані QA pack
  - ідентичність оператора
  - стартова місія
- `qa/scenarios/<theme>/*.md`
  - один markdown-файл на сценарій
  - метадані сценарію
  - прив’язки handler
  - специфічна для сценарію конфігурація виконання
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown-парсер pack + валідація zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - рендеринг plan з markdown pack
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - початково генерує файли сумісності плюс `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - вибирає виконувані сценарії через прив’язки handler, визначені в markdown
- Протокол QA bus + UI
  - узагальнені inline-вкладення для рендерингу image/video/audio/file

Поверхні, що залишаються розділеними:

- `extensions/qa-lab/src/suite.ts`
  - усе ще володіє більшістю виконуваної користувацької логіки handler
- `extensions/qa-lab/src/report.ts`
  - усе ще виводить структуру звіту з результатів runtime

Тобто розділення джерела істини виправлено, але виконання все ще здебільшого спирається на handler, а не є повністю декларативним.

## Який вигляд має реальна поверхня сценаріїв

Читання поточного suite показує кілька окремих класів сценаріїв.

### Проста взаємодія

- базовий сценарій каналу
- базовий сценарій DM
- продовження в гілці
- перемикання моделі
- завершення погодження
- реакція/редагування/видалення

### Зміна конфігурації та runtime

- вимкнення skill через patch конфігурації
- пробудження після restart через apply конфігурації
- перемикання можливостей через restart конфігурації
- перевірка дрейфу inventory runtime

### Assertions файлової системи та репозиторію

- звіт про виявлення source/docs
- build Lobster Invaders
- пошук згенерованого image artifact

### Оркестрація пам’яті

- відновлення з пам’яті
- memory tools у контексті каналу
- резервна поведінка при збої пам’яті
- ранжування пам’яті сесії
- ізоляція пам’яті гілки
- memory dreaming sweep

### Інтеграція інструментів і plugin

- виклик MCP plugin-tools
- видимість skill
- гаряче встановлення skill
- нативна генерація зображень
- image roundtrip
- розуміння зображення з вкладення

### Багатокрокові та багатокористувацькі

- передавання субагенту
- fanout synthesis субагентів
- потоки у стилі відновлення після restart

Ці категорії важливі, тому що вони визначають вимоги до DSL. Плоского списку prompt + очікуваного тексту недостатньо.

## Напрямок

### Єдине джерело істини

Використовувати `qa/scenarios/index.md` плюс `qa/scenarios/<theme>/*.md` як авторське
джерело істини.

Pack має залишатися:

- читабельним для людини під час review
- придатним до машинного парсингу
- достатньо багатим, щоб керувати:
  - виконанням suite
  - bootstrap робочого простору QA
  - метаданими UI QA Lab
  - prompts для docs/discovery
  - генерацією звітів

### Бажаний формат авторства

Використовувати markdown як формат верхнього рівня зі структурованим YAML усередині.

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
- prose-розділи
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
- суворий парсинг і валідацію zod

Чистий JSON прийнятний лише як проміжна згенерована форма.

## Запропонована форма файлу сценарію

Приклад:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
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

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

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

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

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

## Можливості runner, які має покривати DSL

На основі поточного suite узагальненому runner потрібно більше, ніж просто виконання prompt.

### Дії середовища та setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Дії ходу агента

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Дії конфігурації та runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Дії з файлами та artifacts

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Дії з пам’яттю та Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Дії MCP

- `mcp.callTool`

### Assertions

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

## Змінні та посилання на artifacts

DSL має підтримувати збережені результати та подальші посилання на них.

Приклади з поточного suite:

- створити гілку, а потім повторно використати `threadId`
- створити сесію, а потім повторно використати `sessionKey`
- згенерувати зображення, а потім прикріпити файл на наступному ході
- згенерувати рядок маркера пробудження, а потім перевірити, що він з’являється пізніше

Потрібні можливості:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- типізовані посилання для шляхів, ключів сесій, id гілок, маркерів, виводів інструментів

Без підтримки змінних harness і далі витікатиме логікою сценаріїв назад у TypeScript.

## Що має залишитися як escape hatch

Повністю чистий декларативний runner нереалістичний на фазі 1.

Деякі сценарії за своєю природою вимагають важкої оркестрації:

- memory dreaming sweep
- пробудження після restart через apply конфігурації
- перемикання можливостей через restart конфігурації
- визначення згенерованого image artifact за timestamp/path
- оцінювання discovery-report

Поки що для них слід використовувати явні користувацькі handler.

Рекомендоване правило:

- 85-90% декларативно
- явні кроки `customHandler` для решти складних випадків
- лише іменовані й задокументовані користувацькі handler
- жодного анонімного inline-коду у файлі сценарію

Це зберігає узагальнений engine чистим і водночас дозволяє рухатися вперед.

## Архітектурна зміна

### Поточний стан

Markdown сценаріїв уже є джерелом істини для:

- виконання suite
- bootstrap-файлів робочого простору
- каталогу сценаріїв UI QA Lab
- метаданих звіту
- prompts для discovery

Згенерована сумісність:

- початково створений робочий простір і далі містить `QA_KICKOFF_TASK.md`
- початково створений робочий простір і далі містить `QA_SCENARIO_PLAN.md`
- початково створений робочий простір тепер також містить `QA_SCENARIOS.md`

## План рефакторингу

### Фаза 1: loader і schema

Виконано.

- додано `qa/scenarios/index.md`
- сценарії розділено в `qa/scenarios/<theme>/*.md`
- додано парсер для іменованого вмісту markdown YAML pack
- додано валідацію через zod
- споживачів перемкнено на розпарсений pack
- видалено репозиторний `qa/seed-scenarios.json` і `qa/QA_KICKOFF_TASK.md`

### Фаза 2: узагальнений engine

- розділити `extensions/qa-lab/src/suite.ts` на:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- зберегти наявні helper-функції як операції engine

Результат:

- engine виконує прості декларативні сценарії

Почати зі сценаріїв, які здебільшого є prompt + wait + assert:

- продовження в гілці
- розуміння зображення з вкладення
- видимість і виклик skill
- базовий сценарій каналу

Результат:

- перші справжні сценарії, визначені в markdown, постачаються через узагальнений engine

### Фаза 4: міграція сценаріїв середньої складності

- image generation roundtrip
- memory tools у контексті каналу
- ранжування пам’яті сесії
- передавання субагенту
- fanout synthesis субагентів

Результат:

- перевірено змінні, artifacts, assertions інструментів, assertions журналу запитів

### Фаза 5: залишити складні сценарії на користувацьких handler

- memory dreaming sweep
- пробудження після restart через apply конфігурації
- перемикання можливостей через restart конфігурації
- runtime inventory drift

Результат:

- той самий формат авторства, але з явними блоками custom-step там, де це потрібно

### Фаза 6: видалити жорстко закодовану map сценаріїв

Коли покриття pack стане достатньо добрим:

- прибрати більшість розгалужень TypeScript, специфічних для сценаріїв, з `extensions/qa-lab/src/suite.ts`

## Підтримка fake Slack / rich media

Поточний QA bus орієнтований насамперед на текст.

Пов’язані файли:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Сьогодні QA bus підтримує:

- текст
- реакції
- гілки

Він ще не моделює inline-медіавкладення.

### Потрібний транспортний контракт

Додати узагальнену модель вкладення QA bus:

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

### Чому спочатку узагальнено

Не будуйте модель медіа лише для Slack.

Натомість:

- одна узагальнена транспортна модель QA
- кілька renderer поверх неї
  - поточний чат QA Lab
  - майбутній fake Slack web
  - будь-які інші fake transport views

Це запобігає дублюванню логіки та дає змогу сценаріям із медіа залишатися незалежними від транспорту.

### Потрібна робота з UI

Оновити UI QA для рендерингу:

- inline-попереднього перегляду зображення
- inline-аудіоплеєра
- inline-відеоплеєра
- chip вкладення файла

Поточний UI вже вміє рендерити гілки й реакції, тож рендеринг вкладень має нашаровуватися на ту саму модель картки повідомлення.

### Робота зі сценаріями, яку відкриває медіатранспорт

Коли вкладення почнуть проходити через QA bus, можна буде додати багатші fake-chat сценарії:

- inline-відповідь із зображенням у fake Slack
- розуміння аудіовкладення
- розуміння відеовкладення
- змішаний порядок вкладень
- відповідь у гілці зі збереженим медіа

## Рекомендація

Наступний фрагмент реалізації має бути таким:

1. додати markdown loader сценаріїв + zod schema
2. згенерувати поточний каталог із markdown
3. спочатку мігрувати кілька простих сценаріїв
4. додати узагальнену підтримку вкладень QA bus
5. відрендерити inline-зображення в UI QA
6. потім розширити на audio і video

Це найменший шлях, який доводить обидві цілі:

- узагальнений QA, визначений у markdown
- багатші fake messaging surfaces

## Відкриті питання

- чи мають файли сценаріїв дозволяти вбудовані markdown-шаблони prompt із інтерполяцією змінних
- чи мають setup/cleanup бути іменованими розділами чи просто впорядкованими списками дій
- чи мають посилання на artifacts бути строго типізованими в schema чи базуватися на рядках
- чи мають користувацькі handler жити в одному registry чи в registry для кожної surface
- чи має згенерований файл сумісності JSON залишатися в репозиторії під час міграції
