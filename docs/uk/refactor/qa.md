---
x-i18n:
    generated_at: "2026-04-07T22:41:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a13a050574d3fbd7a9a935aa57aa260a92975029b64418633df55159fd7cb29
    source_path: refactor/qa.md
    workflow: 15
---

# Рефакторинг QA

Статус: базову міграцію завершено.

## Мета

Перевести QA OpenClaw із моделі з розділеними визначеннями на єдине джерело істини:

- метадані сценаріїв
- підказки, що надсилаються моделі
- налаштування та очищення
- логіка harness
- перевірки та критерії успіху
- артефакти та підказки для звітів

Бажаний кінцевий стан — це універсальний QA harness, який завантажує потужні файли визначень сценаріїв замість жорсткого кодування більшості поведінки в TypeScript.

## Поточний стан

Основне джерело істини тепер міститься в `qa/scenarios.md`.

Реалізовано:

- `qa/scenarios.md`
  - канонічний пакет QA
  - ідентичність оператора
  - стартова місія
  - метадані сценаріїв
  - прив’язки обробників
- `extensions/qa-lab/src/scenario-catalog.ts`
  - парсер markdown-пакета + валідація zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - рендеринг плану з markdown-пакета
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - заповнює згенеровані файли сумісності плюс `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - вибирає виконувані сценарії через визначені в markdown прив’язки обробників
- QA bus protocol + UI
  - універсальні вбудовані вкладення для рендерингу image/video/audio/file

Поверхні, що ще залишаються розділеними:

- `extensions/qa-lab/src/suite.ts`
  - усе ще містить більшість виконуваної логіки кастомних обробників
- `extensions/qa-lab/src/report.ts`
  - усе ще виводить структуру звіту з результатів виконання

Отже, розділення джерела істини вже виправлено, але виконання все ще здебільшого спирається на обробники, а не є повністю декларативним.

## Як виглядає реальна поверхня сценаріїв

Ознайомлення з поточним suite показує кілька окремих класів сценаріїв.

### Проста взаємодія

- базова перевірка каналу
- базова перевірка DM
- продовження в треді
- перемикання моделі
- проходження підтвердження
- реакція/редагування/видалення

### Зміна конфігурації та runtime

- вимкнення skill через patch конфігурації
- пробудження після restart через apply конфігурації
- перемикання можливостей після restart конфігурації
- перевірка розходження inventory runtime

### Перевірки файлової системи та репозиторію

- звіт про виявлення source/docs
- збірка Lobster Invaders
- пошук артефакта згенерованого image

### Оркестрація пам’яті

- відтворення з пам’яті
- інструменти пам’яті в контексті каналу
- резервний сценарій при збої пам’яті
- ранжування пам’яті сесії
- ізоляція пам’яті тредів
- sweep dreaming пам’яті

### Інтеграція інструментів і plugin

- виклик MCP plugin-tools
- видимість skill
- гаряче встановлення skill
- нативна генерація image
- круговий цикл image
- розпізнавання image із вкладення

### Багатоходові та багатосуб’єктні

- передача підзадачі субагенту
- fanout-синтез субагента
- потоки у стилі відновлення після restart

Ці категорії важливі, тому що вони визначають вимоги до DSL. Плоского списку prompt + очікуваного тексту недостатньо.

## Напрям

### Єдине джерело істини

Використовувати `qa/scenarios.md` як авторське джерело істини.

Пакет має залишатися:

- зручним для читання під час review
- придатним для машинного розбору
- достатньо насиченим, щоб керувати:
  - виконанням suite
  - bootstrap робочого простору QA
  - метаданими UI QA Lab
  - підказками для docs/discovery
  - генерацією звітів

### Бажаний формат авторингу

Використовувати markdown як формат верхнього рівня зі структурованим YAML всередині.

Рекомендована форма:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - overrides для model/provider
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
- строгий розбір і валідацію zod

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

Перевірити, що згенероване медіа повторно прикріплюється на наступному ході.

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
````

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Перевірка генерації image: згенеруй QA-зображення маяка та опиши його одним коротким реченням.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Перевірка генерації image
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Перевірка roundtrip image: опиши вкладення із зображенням маяка одним коротким реченням.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Перевірка roundtrip image
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```

````

## Можливості runner, які має покривати DSL

На основі поточного suite універсальний runner потребує більшого, ніж просто виконання prompt.

### Дії середовища та налаштування

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

### Дії з файлами та артефактами

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Дії з пам’яттю та cron

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

DSL має підтримувати збережені результати та подальші посилання на них.

Приклади з поточного suite:

- створити тред, а потім повторно використати `threadId`
- створити сесію, а потім повторно використати `sessionKey`
- згенерувати image, а потім прикріпити файл на наступному ході
- згенерувати рядок-маркер пробудження, а потім перевірити, що він з’являється пізніше

Потрібні можливості:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- типізовані посилання для path, session key, thread id, marker, результатів tool

Без підтримки змінних harness і далі повертатиме логіку сценаріїв назад у TypeScript.

## Що має залишитися як escape hatch

Повністю чистий декларативний runner нереалістичний на фазі 1.

Деякі сценарії за своєю природою вимагають складної оркестрації:

- sweep dreaming пам’яті
- пробудження після restart через apply конфігурації
- перемикання можливостей після restart конфігурації
- визначення артефакта згенерованого image за timestamp/path
- оцінювання discovery-report

Наразі для них слід використовувати явні кастомні обробники.

Рекомендоване правило:

- 85-90% декларативно
- явні кроки `customHandler` для складного залишку
- лише іменовані та документовані кастомні обробники
- жодного анонімного вбудованого коду у файлі сценарію

Це збереже універсальний рушій чистим і водночас дозволить рухатися вперед.

## Архітектурна зміна

### Поточний стан

Markdown сценаріїв уже є джерелом істини для:

- виконання suite
- bootstrap-файлів робочого простору
- каталогу сценаріїв UI QA Lab
- метаданих звітів
- discovery prompts

Згенерована сумісність:

- заповнений робочий простір усе ще містить `QA_KICKOFF_TASK.md`
- заповнений робочий простір усе ще містить `QA_SCENARIO_PLAN.md`
- заповнений робочий простір тепер також містить `QA_SCENARIOS.md`

## План рефакторингу

### Фаза 1: loader і schema

Готово.

- додано `qa/scenarios.md`
- додано парсер для іменованого вмісту markdown YAML pack
- виконано валідацію через zod
- споживачів переведено на розібраний pack
- видалено `qa/seed-scenarios.json` і `qa/QA_KICKOFF_TASK.md` на рівні репозиторію

### Фаза 2: універсальний рушій

- розділити `extensions/qa-lab/src/suite.ts` на:
  - loader
  - engine
  - registry дій
  - registry перевірок
  - custom handlers
- зберегти наявні helper-функції як операції рушія

Результат:

- рушій виконує прості декларативні сценарії

Почати зі сценаріїв, які здебільшого складаються з prompt + wait + assert:

- продовження в треді
- розпізнавання image із вкладення
- видимість і виклик skill
- базова перевірка каналу

Результат:

- перші справжні сценарії, визначені в markdown, постачаються через універсальний рушій

### Фаза 4: міграція сценаріїв середньої складності

- roundtrip генерації image
- інструменти пам’яті в контексті каналу
- ранжування пам’яті сесії
- передача підзадачі субагенту
- fanout-синтез субагента

Результат:

- доведено змінні, артефакти, перевірки tool і перевірки request-log

### Фаза 5: залишити складні сценарії на custom handlers

- sweep dreaming пам’яті
- пробудження після restart через apply конфігурації
- перемикання можливостей після restart конфігурації
- розходження inventory runtime

Результат:

- той самий формат авторингу, але з явними блоками custom-step там, де це потрібно

### Фаза 6: видалити жорстко закодовану карту сценаріїв

Коли покриття pack стане достатньо хорошим:

- видалити більшість TypeScript-розгалужень для конкретних сценаріїв із `extensions/qa-lab/src/suite.ts`

## Підтримка Fake Slack / Rich Media

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
- треди

Він ще не моделює вбудовані медіавкладення.

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
````

Потім додати `attachments?: QaBusAttachment[]` до:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Чому спочатку універсально

Не створювати модель медіа лише для Slack.

Натомість:

- одна універсальна транспортна модель QA
- кілька рендерерів поверх неї
  - поточний чат QA Lab
  - майбутній fake Slack web
  - будь-які інші представлення fake transport

Це запобігає дублюванню логіки й дозволяє медіасценаріям залишатися незалежними від конкретного транспорту.

### Потрібна робота в UI

Оновити UI QA для рендерингу:

- вбудованого попереднього перегляду image
- вбудованого audio player
- вбудованого video player
- chip вкладеного file

Поточний UI вже вміє рендерити треди та реакції, тож рендеринг вкладень має нашаровуватися на ту саму модель картки повідомлення.

### Робота над сценаріями, яку відкриває медіатранспорт

Щойно вкладення почнуть проходити через QA bus, можна буде додати багатші сценарії fake-chat:

- вбудована відповідь із image у fake Slack
- розпізнавання audio-вкладення
- розпізнавання video-вкладення
- змішаний порядок вкладень
- відповідь у треді зі збереженням медіа

## Рекомендація

Наступний етап реалізації має бути таким:

1. додати loader сценаріїв markdown + schema zod
2. згенерувати поточний каталог із markdown
3. спочатку мігрувати кілька простих сценаріїв
4. додати універсальну підтримку вкладень QA bus
5. рендерити вбудоване image в UI QA
6. потім розширити на audio і video

Це найменший шлях, який доводить обидві цілі:

- універсальний QA, визначений через markdown
- багатші fake messaging surfaces

## Відкриті питання

- чи мають файли сценаріїв дозволяти вбудовані markdown-шаблони prompt зі вставкою змінних
- чи мають setup/cleanup бути іменованими секціями, чи просто впорядкованими списками дій
- чи мають посилання на артефакти бути строго типізованими в schema, чи базуватися на рядках
- чи мають custom handlers жити в одному registry або в окремих registry для кожної surface
- чи має згенерований файл сумісності JSON залишатися закоміченим під час міграції
