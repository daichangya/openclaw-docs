---
read_when:
    - Налаштування парсингу або типових значень директив thinking, fast-mode чи verbose
summary: Синтаксис директив для /think, /fast, /verbose, /trace і видимості reasoning
title: Рівні thinking
x-i18n:
    generated_at: "2026-04-23T23:08:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b135784cb3696309f518090c4db859a2e1834cdc4dd3360bdfae2ba87604f0
    source_path: tools/thinking.md
    workflow: 15
---

## Що це робить

- Inline-директива в будь-якому вхідному тексті: `/t <level>`, `/think:<level>` або `/thinking <level>`.
- Рівні (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (максимальний бюджет)
  - xhigh → “ultrathink+” (GPT-5.2 + моделі Codex і рівень effort Anthropic Claude Opus 4.7)
  - adaptive → adaptive thinking під керуванням провайдера (підтримується для Claude 4.6 на Anthropic/Bedrock і Anthropic Claude Opus 4.7)
  - max → максимальний reasoning провайдера (наразі Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` і `extra_high` зіставляються з `xhigh`.
  - `highest` зіставляється з `high`.
- Примітки щодо провайдерів:
  - Меню та селектори thinking керуються профілем провайдера. Plugin провайдера оголошують точний набір рівнів для вибраної моделі, включно з мітками на кшталт двійкового `on`.
  - `adaptive`, `xhigh` і `max` оголошуються лише для профілів provider/model, які їх підтримують. Введені вручну директиви для непідтримуваних рівнів відхиляються з показом допустимих варіантів для цієї моделі.
  - Наявні збережені непідтримувані рівні переназначаються за рангом профілю провайдера. `adaptive` повертається до `medium` на моделях без adaptive, а `xhigh` і `max` повертаються до найбільшого підтримуваного рівня, що не є `off`, для вибраної моделі.
  - Для моделей Anthropic Claude 4.6 типовим є `adaptive`, якщо явний рівень thinking не задано.
  - Для Anthropic Claude Opus 4.7 adaptive thinking не є типовим. Його типове значення effort API і далі належить провайдеру, доки ви явно не задасте рівень thinking.
  - Anthropic Claude Opus 4.7 зіставляє `/think xhigh` з adaptive thinking плюс `output_config.effort: "xhigh"`, оскільки `/think` — це директива thinking, а `xhigh` — це параметр effort для Opus 4.7.
  - Anthropic Claude Opus 4.7 також підтримує `/think max`; воно зіставляється з тим самим шляхом максимального effort провайдера.
  - Моделі OpenAI GPT зіставляють `/think` через підтримку effort Responses API, специфічну для моделі. `/think off` надсилає `reasoning.effort: "none"` лише тоді, коли цільова модель це підтримує; інакше OpenClaw не додає payload вимкненого reasoning замість надсилання непідтримуваного значення.
  - MiniMax (`minimax/*`) на Anthropic-compatible шляху потокової передачі типово використовує `thinking: { type: "disabled" }`, якщо ви явно не задасте thinking у параметрах моделі або параметрах запиту. Це запобігає витоку delta `reasoning_content` із ненативного Anthropic stream-формату MiniMax.
  - Z.AI (`zai/*`) підтримує лише двійковий thinking (`on`/`off`). Будь-який рівень, відмінний від `off`, вважається `on` (зіставляється з `low`).
  - Moonshot (`moonshot/*`) зіставляє `/think off` з `thinking: { type: "disabled" }`, а будь-який рівень, відмінний від `off`, — з `thinking: { type: "enabled" }`. Коли thinking увімкнено, Moonshot приймає лише `tool_choice` `auto|none`; OpenClaw нормалізує несумісні значення до `auto`.

## Порядок визначення

1. Inline-директива в повідомленні (застосовується лише до цього повідомлення).
2. Перевизначення сесії (встановлюється надсиланням повідомлення, що містить лише директиву).
3. Типове значення для окремого агента (`agents.list[].thinkingDefault` у конфігурації).
4. Глобальне типове значення (`agents.defaults.thinkingDefault` у конфігурації).
5. Запасний варіант: оголошене провайдером типове значення, якщо доступне; інакше моделі з підтримкою reasoning визначаються як `medium` або найближчий підтримуваний рівень, що не є `off`, для цієї моделі, а моделі без reasoning залишаються на `off`.

## Установлення типового значення для сесії

- Надішліть повідомлення, яке містить **лише** директиву (пробіли дозволені), наприклад `/think:medium` або `/t high`.
- Це закріплюється для поточної сесії (типово per-sender); очищується через `/think:off` або reset сесії через idle.
- Надсилається відповідь-підтвердження (`Thinking level set to high.` / `Thinking disabled.`). Якщо рівень недійсний (наприклад `/thinking big`), команду відхиляють із підказкою, а стан сесії залишається без змін.
- Надішліть `/think` (або `/think:`) без аргументу, щоб побачити поточний рівень thinking.

## Застосування за агентом

- **Embedded Pi**: визначений рівень передається до in-process runtime агента Pi.

## Fast mode (/fast)

- Рівні: `on|off`.
- Повідомлення лише з директивою перемикає session fast-mode override і відповідає `Fast mode enabled.` / `Fast mode disabled.`.
- Надішліть `/fast` (або `/fast status`) без режиму, щоб побачити поточний фактичний стан fast mode.
- OpenClaw визначає fast mode в такому порядку:
  1. Inline/directive-only `/fast on|off`
  2. Перевизначення сесії
  3. Типове значення для окремого агента (`agents.list[].fastModeDefault`)
  4. Конфігурація для окремої моделі: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Запасний варіант: `off`
- Для `openai/*` fast mode зіставляється з пріоритетною обробкою OpenAI через надсилання `service_tier=priority` у підтримуваних запитах Responses.
- Для `openai-codex/*` fast mode надсилає той самий прапорець `service_tier=priority` у Codex Responses. OpenClaw використовує один спільний перемикач `/fast` для обох шляхів автентифікації.
- Для прямих публічних запитів `anthropic/*`, включно з трафіком OAuth-authenticated, що надсилається на `api.anthropic.com`, fast mode зіставляється з рівнями сервісу Anthropic: `/fast on` задає `service_tier=auto`, `/fast off` задає `service_tier=standard_only`.
- Для `minimax/*` на Anthropic-compatible шляху `/fast on` (або `params.fastMode: true`) переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.
- Явні параметри моделі Anthropic `serviceTier` / `service_tier` перевизначають типове значення fast mode, коли задано обидва. OpenClaw усе одно пропускає додавання рівня сервісу Anthropic для не-Anthropic proxy base URL.
- `/status` показує `Fast` лише тоді, коли fast mode увімкнено.

## Директиви verbose (/verbose або /v)

- Рівні: `on` (мінімальний) | `full` | `off` (типово).
- Повідомлення лише з директивою перемикає session verbose і відповідає `Verbose logging enabled.` / `Verbose logging disabled.`; недійсні рівні повертають підказку без зміни стану.
- `/verbose off` зберігає явне перевизначення сесії; очистіть його через UI Sessions, вибравши `inherit`.
- Inline-директива впливає лише на це повідомлення; в інших випадках застосовуються типові значення сесії/глобальні.
- Надішліть `/verbose` (або `/verbose:`) без аргументу, щоб побачити поточний рівень verbose.
- Коли verbose увімкнено, агенти, що видають структуровані результати інструментів (Pi, інші JSON-агенти), надсилають кожен виклик інструмента назад як окреме повідомлення лише з метаданими, з префіксом `<emoji> <tool-name>: <arg>`, коли доступно (path/command). Ці підсумки інструментів надсилаються щойно кожен інструмент стартує (окремими бульбашками), а не як streaming delta.
- Підсумки помилок інструментів залишаються видимими у звичайному режимі, але сирі суфікси деталей помилок приховано, якщо verbose не дорівнює `on` або `full`.
- Коли verbose дорівнює `full`, виводи інструментів також передаються після завершення (окрема бульбашка, обрізана до безпечної довжини). Якщо ви перемкнете `/verbose on|full|off`, поки запуск ще триває, наступні бульбашки інструментів враховуватимуть нове значення.

## Директиви trace для Plugin (/trace)

- Рівні: `on` | `off` (типово).
- Повідомлення лише з директивою перемикає session trace для Plugin і відповідає `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline-директива впливає лише на це повідомлення; в інших випадках застосовуються типові значення сесії/глобальні.
- Надішліть `/trace` (або `/trace:`) без аргументу, щоб побачити поточний рівень trace.
- `/trace` вужчий за `/verbose`: він показує лише рядки trace/debug, що належать Plugin, як-от підсумки налагодження Active Memory.
- Рядки trace можуть з’являтися в `/status` і як додаткове діагностичне повідомлення після звичайної відповіді асистента.

## Видимість reasoning (/reasoning)

- Рівні: `on|off|stream`.
- Повідомлення лише з директивою перемикає, чи показуються блоки thinking у відповідях.
- Коли ввімкнено, reasoning надсилається як **окреме повідомлення** з префіксом `Reasoning:`.
- `stream` (лише Telegram): передає reasoning у draft-бульбашку Telegram, поки генерується відповідь, а потім надсилає фінальну відповідь без reasoning.
- Alias: `/reason`.
- Надішліть `/reasoning` (або `/reasoning:`) без аргументу, щоб побачити поточний рівень reasoning.
- Порядок визначення: inline-директива, потім перевизначення сесії, потім типове значення для окремого агента (`agents.list[].reasoningDefault`), потім запасний варіант (`off`).

## Пов’язане

- Документація з elevated mode міститься в [Elevated mode](/uk/tools/elevated).

## Heartbeat

- Текст probe для Heartbeat — це налаштований heartbeat prompt (типово: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-директиви у heartbeat-повідомленні застосовуються як завжди (але уникайте зміни типових значень сесії з Heartbeat).
- Доставка Heartbeat типово містить лише фінальний payload. Щоб також надсилати окреме повідомлення `Reasoning:` (коли воно доступне), задайте `agents.defaults.heartbeat.includeReasoning: true` або для окремого агента `agents.list[].heartbeat.includeReasoning: true`.

## Вебінтерфейс чату

- Селектор thinking у вебчаті відображає збережений рівень сесії з вхідного сховища сесій/конфігурації під час завантаження сторінки.
- Вибір іншого рівня негайно записує перевизначення сесії через `sessions.patch`; він не чекає наступного надсилання й не є одноразовим перевизначенням `thinkingOnce`.
- Першим варіантом завжди є `Default (<resolved level>)`, де визначене типове значення береться з provider thinking profile активної моделі сесії плюс із тієї самої логіки запасного варіанта, яку використовують `/status` і `session_status`.
- Селектор використовує `thinkingOptions`, повернені рядком сесії gateway. UI браузера не тримає власний regex-список провайдерів; Plugin володіють наборами рівнів для конкретних моделей.
- `/think:<level>` і далі працює та оновлює той самий збережений рівень сесії, тож директиви чату й селектор залишаються синхронізованими.

## Профілі провайдерів

- Plugin провайдерів можуть надавати `resolveThinkingProfile(ctx)`, щоб визначити підтримувані рівні моделі та типове значення.
- Кожен рівень профілю має збережений канонічний `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` або `max`) і може містити відображувану `label`. Двійкові провайдери використовують `{ id: "low", label: "on" }`.
- Опубліковані застарілі hooks (`supportsXHighThinking`, `isBinaryThinking` і `resolveDefaultThinkingLevel`) залишаються адаптерами сумісності, але нові власні набори рівнів мають використовувати `resolveThinkingProfile`.
- Рядки Gateway показують `thinkingOptions` і `thinkingDefault`, щоб клієнти ACP/chat відображали той самий профіль, який використовує валідація runtime.
