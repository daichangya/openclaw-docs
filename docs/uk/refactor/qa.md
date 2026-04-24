---
read_when:
    - Рефакторинг визначень сценаріїв QA або коду harness qa-lab
    - Переміщення поведінки QA між markdown-сценаріями та логікою harness TypeScript
summary: План рефакторингу QA для каталогу сценаріїв і консолідації harness
title: Рефакторинг QA
x-i18n:
    generated_at: "2026-04-24T04:17:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

Статус: базову міграцію завершено.

## Мета

Перевести QA OpenClaw із моделі розділених визначень до єдиного джерела істини:

- метадані сценарію
- prompts, що надсилаються моделі
- setup і teardown
- логіка harness
- assertions і критерії успіху
- артефакти та підказки для звітів

Бажаний кінцевий стан — це узагальнений QA harness, який завантажує потужні файли визначень сценаріїв замість того, щоб жорстко кодувати більшість поведінки в TypeScript.

## Поточний стан

Основне джерело істини тепер міститься в `qa/scenarios/index.md` плюс один файл на
сценарій у `qa/scenarios/<theme>/*.md`.

Реалізовано:

- `qa/scenarios/index.md`
  - канонічні метадані пакета QA
  - ідентичність оператора
  - стартова місія
- `qa/scenarios/<theme>/*.md`
  - один markdown-файл на сценарій
  - метадані сценарію
  - прив’язки handler
  - конфігурація виконання, специфічна для сценарію
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown-парсер пакета + валідація zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - рендеринг плану з markdown-пакета
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - заповнює згенеровані файли сумісності плюс `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - вибирає виконувані сценарії через визначені в markdown прив’язки handler
- Протокол QA bus + UI
  - узагальнені inline attachments для рендерингу image/video/audio/file

Поверхні, що все ще залишаються розділеними:

- `extensions/qa-lab/src/suite.ts`
  - досі містить більшість виконуваної логіки custom handler
- `extensions/qa-lab/src/report.ts`
  - досі виводить структуру звіту з результатів виконання

Отже, розділення джерела істини виправлено, але виконання все ще здебільшого спирається на handlers, а не є повністю декларативним.

## Як виглядає реальна поверхня сценаріїв

Читання поточного suite показує кілька окремих класів сценаріїв.

### Проста взаємодія

- channel baseline
- DM baseline
- threaded follow-up
- model switch
- approval followthrough
- reaction/edit/delete

### Зміна config і runtime

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### Assertions файлової системи та repo

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### Оркестрація пам’яті

- memory recall
- memory tools in channel context
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory dreaming sweep

### Інтеграція tools і plugins

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### Багатоходові та багатосторонні сценарії

- subagent handoff
- subagent fanout synthesis
- restart recovery style flows

Ці категорії важливі, бо вони визначають вимоги до DSL. Плоского списку на кшталт prompt + очікуваний текст недостатньо.

## Напрям

### Єдине джерело істини

Використовувати `qa/scenarios/index.md` плюс `qa/scenarios/<theme>/*.md` як
створене вручну джерело істини.

Пакет має залишатися:

- читабельним для людини під час review
- придатним до машинного розбору
- достатньо багатим, щоб керувати:
  - виконанням suite
  - bootstrap робочого простору QA
  - метаданими UI QA Lab
  - prompts для docs/discovery
  - генерацією звітів

### Бажаний формат створення

Використовувати markdown як формат верхнього рівня зі структурованим YAML усередині нього.

Рекомендована форма:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - посилання на docs
  - посилання на code
  - перевизначення model/provider
  - prerequisites
- прозові розділи
  - objective
  - notes
  - debugging hints
- fenced YAML blocks
  - setup
  - steps
  - assertions
  - cleanup

Це дає:

- кращу читабельність PR, ніж гігантський JSON
- багатший context, ніж чистий YAML
- строгий розбір і валідацію zod

Сирий JSON допустимий лише як проміжна згенерована форма.

## Запропонована форма файла сценарію

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

З огляду на поточний suite, узагальнений runner потребує більшого, ніж просто виконання prompt.

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

### Дії config і runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Дії з файлами та артефактами

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

## Змінні та посилання на артефакти

DSL має підтримувати збережені результати й подальші посилання на них.

Приклади з поточного suite:

- створити thread, а потім повторно використати `threadId`
- створити session, а потім повторно використати `sessionKey`
- згенерувати image, а потім прикріпити файл у наступному ході
- згенерувати рядок wake marker, а потім перевірити, що він з’являється пізніше

Потрібні можливості:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- типізовані посилання для шляхів, ключів session, id thread, markers, виводів tools

Без підтримки змінних harness і далі витікатиме логікою сценаріїв назад у TypeScript.

## Що має залишитися як escape hatch

Повністю чистий декларативний runner нереалістичний на фазі 1.

Деякі сценарії за своєю природою важкі з точки зору оркестрації:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- generated image artifact resolution by timestamp/path
- evaluation discovery-report

Поки що для них слід використовувати явні custom handlers.

Рекомендоване правило:

- 85-90% декларативно
- явні кроки `customHandler` для складного залишку
- лише іменовані та задокументовані custom handlers
- жодного анонімного inline code у файлі сценарію

Це зберігає чистоту узагальненого рушія й водночас дозволяє рухатися вперед.

## Зміна архітектури

### Поточний стан

Markdown сценаріїв уже є джерелом істини для:

- виконання suite
- файлів bootstrap робочого простору
- каталогу сценаріїв UI QA Lab
- метаданих звітів
- prompts discovery

Згенерована сумісність:

- заповнений робочий простір усе ще містить `QA_KICKOFF_TASK.md`
- заповнений робочий простір усе ще містить `QA_SCENARIO_PLAN.md`
- заповнений робочий простір тепер також містить `QA_SCENARIOS.md`

## План рефакторингу

### Фаза 1: loader і schema

Виконано.

- додано `qa/scenarios/index.md`
- розділено сценарії на `qa/scenarios/<theme>/*.md`
- додано парсер для іменованого markdown-вмісту пакета YAML
- додано валідацію через zod
- переведено споживачів на розібраний пакет
- видалено `qa/seed-scenarios.json` і `qa/QA_KICKOFF_TASK.md` на рівні repo

### Фаза 2: узагальнений рушій

- розділити `extensions/qa-lab/src/suite.ts` на:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- зберегти наявні helper functions як операції engine

Результат:

- engine виконує прості декларативні сценарії

Почати зі сценаріїв, які переважно складаються з prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

Результат:

- перші реальні markdown-визначені сценарії, що працюють через узагальнений engine

### Фаза 4: міграція сценаріїв середньої складності

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

Результат:

- перевірено роботу змінних, артефактів, assertions tools, assertions журналу запитів

### Фаза 5: залишити складні сценарії на custom handlers

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

Результат:

- той самий формат створення, але з явними блоками custom-step там, де це потрібно

### Фаза 6: видалити жорстко закодовану мапу сценаріїв

Коли покриття пакета стане достатньо добрим:

- прибрати більшість розгалужень TypeScript, специфічних для сценаріїв, із `extensions/qa-lab/src/suite.ts`

## Підтримка fake Slack / rich media

Поточний QA bus орієнтований насамперед на текст.

Відповідні файли:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Сьогодні QA bus підтримує:

- текст
- реакції
- threads

Він поки що не моделює inline media attachments.

### Потрібний транспортний контракт

Додайте узагальнену модель attachment для QA bus:

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

Потім додайте `attachments?: QaBusAttachment[]` до:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Чому спочатку узагальнено

Не будуйте модель media лише для Slack.

Натомість:

- одна узагальнена транспортна модель QA
- кілька рендерерів поверх неї
  - поточний чат QA Lab
  - майбутній fake Slack web
  - будь-які інші fake transport views

Це запобігає дублюванню логіки й дає змогу сценаріям media залишатися незалежними від транспорту.

### Потрібна робота в UI

Оновіть UI QA для рендерингу:

- inline preview image
- inline player audio
- inline player video
- file attachment chip

Поточний UI вже вміє рендерити threads і reactions, тож рендеринг attachments має нашаровуватися на ту саму модель картки повідомлення.

### Робота над сценаріями, яку розблокує транспорт media

Щойно attachments почнуть проходити через QA bus, ми зможемо додати багатші сценарії fake chat:

- inline image reply у fake Slack
- розуміння audio attachment
- розуміння video attachment
- змішаний порядок attachments
- thread reply зі збереженим media

## Рекомендація

Наступний фрагмент реалізації має бути таким:

1. додати loader markdown-сценаріїв + schema zod
2. згенерувати поточний каталог із markdown
3. спочатку мігрувати кілька простих сценаріїв
4. додати підтримку узагальнених attachments у QA bus
5. рендерити inline image в UI QA
6. потім розширити на audio і video

Це найменший шлях, який доводить обидві цілі:

- узагальнений QA, визначений у markdown
- багатші fake messaging surfaces

## Відкриті питання

- чи мають файли сценаріїв дозволяти вбудовані markdown-шаблони prompt з інтерполяцією змінних
- чи мають setup/cleanup бути іменованими розділами чи просто впорядкованими списками дій
- чи мають посилання на артефакти бути строго типізованими в schema чи базуватися на рядках
- чи мають custom handlers жити в одному registry чи в registry для кожної surface
- чи має згенерований файл сумісності JSON залишатися закоміченим під час міграції

## Пов’язане

- [QA E2E automation](/uk/concepts/qa-e2e-automation)
