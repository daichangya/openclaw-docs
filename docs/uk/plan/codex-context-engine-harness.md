---
read_when:
    - Ви підключаєте поведінку життєвого циклу context-engine до harness Codex
    - Вам потрібно, щоб lossless-claw або інший Plugin context-engine працював із вбудованими сесіями harness codex/*
    - Ви порівнюєте поведінку context для вбудованого PI та app-server Codex
summary: Специфікація для того, щоб вбудований app-server harness Codex враховував context-engine plugins OpenClaw
title: Порт context engine для Codex Harness
x-i18n:
    generated_at: "2026-04-24T04:15:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Порт context engine для Codex Harness

## Статус

Чернетка специфікації реалізації.

## Мета

Зробити так, щоб вбудований app-server harness Codex враховував той самий контракт
життєвого циклу context-engine OpenClaw, який уже враховують ходи вбудованого PI.

Сесія, що використовує `agents.defaults.embeddedHarness.runtime: "codex"` або
модель `codex/*`, усе одно має дозволяти вибраному Plugin context-engine, такому як
`lossless-claw`, керувати збиранням context, post-turn ingest, обслуговуванням і
політикою Compaction рівня OpenClaw настільки, наскільки це дозволяє межа app-server Codex.

## Нецілі

- Не перевпроваджувати внутрішню логіку app-server Codex.
- Не змушувати native thread Compaction Codex створювати підсумок lossless-claw.
- Не вимагати від моделей не-Codex використовувати harness Codex.
- Не змінювати поведінку сесій ACP/acpx. Ця специфікація стосується лише
  шляху harness вбудованого агента без ACP.
- Не змушувати сторонні plugins реєструвати фабрики розширень app-server Codex;
  наявна межа довіри для вбудованих plugins лишається незмінною.

## Поточна архітектура

Цикл виконання embedded визначає налаштований context engine один раз на запуск перед
вибором конкретного низькорівневого harness:

- `src/agents/pi-embedded-runner/run.ts`
  - ініціалізує plugins context-engine
  - викликає `resolveContextEngine(params.config)`
  - передає `contextEngine` і `contextTokenBudget` у
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` делегує вибраному harness агента:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex реєструється вбудованим Plugin Codex:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Реалізація harness Codex отримує ті самі `EmbeddedRunAttemptParams`, що й спроби на основі PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Це означає, що потрібна точка hook міститься в коді, який контролює OpenClaw. Зовнішня
межа — це сам протокол app-server Codex: OpenClaw може керувати тим, що він надсилає до
`thread/start`, `thread/resume` і `turn/start`, і може спостерігати сповіщення, але
не може змінювати внутрішнє сховище thread Codex або native compactor.

## Поточний розрив

Спроби embedded PI викликають життєвий цикл context-engine безпосередньо:

- bootstrap/обслуговування перед спробою
- assemble перед викликом моделі
- afterTurn або ingest після спроби
- обслуговування після успішного ходу
- Compaction context-engine для engine, які володіють Compaction

Відповідний код PI:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Спроби app-server Codex зараз запускають загальні hooks agent-harness і дзеркалять
transcript, але не викликають `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` або
`params.contextEngine.maintain`.

Відповідний код Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Бажана поведінка

Для ходів harness Codex OpenClaw має зберігати такий життєвий цикл:

1. Прочитати дзеркалений transcript сесії OpenClaw.
2. Bootstrap активний context engine, коли існує попередній файл сесії.
3. Запустити bootstrap maintenance, якщо воно доступне.
4. Зібрати context за допомогою активного context engine.
5. Перетворити зібраний context на сумісні з Codex входи.
6. Запустити або відновити thread Codex з developer instructions, що містять будь-яке
   `systemPromptAddition` context-engine.
7. Запустити хід Codex зі зібраним prompt, орієнтованим на користувача.
8. Віддзеркалити результат Codex назад у transcript OpenClaw.
9. Викликати `afterTurn`, якщо реалізовано, інакше `ingestBatch`/`ingest`, використовуючи
   знімок дзеркаленого transcript.
10. Запустити turn maintenance після успішних нескасованих ходів.
11. Зберегти native сигнали Compaction Codex і hooks Compaction OpenClaw.

## Обмеження дизайну

### App-server Codex лишається канонічним для native стану thread

Codex володіє своїм native thread і будь-якою внутрішньою розширеною історією. OpenClaw не має
намагатися змінювати внутрішню історію app-server, окрім як через підтримувані
виклики протоколу.

Дзеркало transcript OpenClaw лишається джерелом для функцій OpenClaw:

- історія чату
- пошук
- облік `/new` і `/reset`
- майбутнє перемикання моделі або harness
- стан Plugin context-engine

### Збирання context engine має проєктуватися у входи Codex

Інтерфейс context-engine повертає `AgentMessage[]` OpenClaw, а не patch thread Codex.
`turn/start` app-server Codex приймає поточний користувацький вхід, тоді як
`thread/start` і `thread/resume` приймають developer instructions.

Тому реалізації потрібен шар проєкції. Безпечна перша версія
не повинна вдавати, що може замінити внутрішню історію Codex. Вона має вставляти
зібраний context як детермінований матеріал prompt/developer-instruction навколо
поточного ходу.

### Стабільність prompt-cache важлива

Для engine на кшталт lossless-claw зібраний context має бути детермінованим
для незмінених входів. Не додавайте міток часу, випадкових id або недетермінованого
порядкування до згенерованого тексту context.

### Семантика fallback PI не змінюється

Вибір harness лишається без змін:

- `runtime: "pi"` примусово вибирає PI
- `runtime: "codex"` вибирає зареєстрований harness Codex
- `runtime: "auto"` дозволяє plugin harness перехоплювати підтримуваних провайдерів
- `fallback: "none"` вимикає fallback PI, коли жоден plugin harness не збігається

Ця робота змінює те, що відбувається після вибору harness Codex.

## План реалізації

### 1. Експортувати або перемістити повторно використовувані допоміжні засоби спроб context-engine

Зараз повторно використовувані допоміжні засоби життєвого циклу живуть у runner PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex не повинен імпортувати зі шляху реалізації, у назві якого згадується PI, якщо ми
можемо цього уникнути.

Створіть harness-neutral модуль, наприклад:

- `src/agents/harness/context-engine-lifecycle.ts`

Перемістіть або повторно експортуйте:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- невелику обгортку навколо `runContextEngineMaintenance`

Збережіть працездатність imports PI або шляхом повторного експорту зі старих файлів, або оновивши місця виклику PI в тому самому PR.

Нейтральні назви допоміжних засобів не повинні згадувати PI.

Запропоновані назви:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Додати допоміжний засіб проєкції context Codex

Додайте новий модуль:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Відповідальність:

- Приймати зібраний `AgentMessage[]`, оригінальну дзеркалену history і поточний
  prompt.
- Визначати, який context має потрапити до developer instructions, а який — до поточного користувацького
  вводу.
- Зберігати поточний користувацький prompt як фінальний дієвий запит.
- Відтворювати попередні повідомлення у стабільному, явному форматі.
- Уникати мінливої метаінформації.

Запропонований API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Рекомендована перша проєкція:

- Помістити `systemPromptAddition` у developer instructions.
- Помістити зібраний context transcript перед поточним prompt у `promptText`.
- Чітко позначити його як context, зібраний OpenClaw.
- Залишити поточний prompt останнім.
- Виключити дубль поточного користувацького prompt, якщо він уже є в кінці.

Приклад форми prompt:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Це менш елегантно, ніж native surgery історії Codex, але це можна реалізувати
в межах OpenClaw, і це зберігає семантику context-engine.

Майбутнє покращення: якщо app-server Codex надасть протокол для заміни або
доповнення history thread, замініть цей шар проєкції на використання того API.

### 3. Підключити bootstrap перед запуском thread Codex

У `extensions/codex/src/app-server/run-attempt.ts`:

- Прочитайте дзеркалену history сесії, як і зараз.
- Визначте, чи існував файл сесії до цього запуску. Надайте перевагу helper,
  який перевіряє `fs.stat(params.sessionFile)` перед записами дзеркала.
- Відкрийте `SessionManager` або використайте вузький adapter менеджера сесії, якщо helper цього потребує.
- Викличте нейтральний helper bootstrap, коли існує `params.contextEngine`.

Псевдопотік:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Використовуйте ту саму угоду `sessionKey`, що й міст інструментів Codex і дзеркало transcript. Зараз Codex обчислює `sandboxSessionKey` з `params.sessionKey` або
`params.sessionId`; використовуйте це послідовно, якщо немає причини зберігати
необроблений `params.sessionKey`.

### 4. Підключити assemble перед `thread/start` / `thread/resume` і `turn/start`

У `runCodexAppServerAttempt`:

1. Спочатку побудуйте dynamic tools, щоб context engine бачив фактично доступні
   назви tools.
2. Прочитайте дзеркалену history сесії.
3. Запустіть `assemble(...)` context-engine, коли існує `params.contextEngine`.
4. Спроєктуйте зібраний результат у:
   - доповнення developer instructions
   - текст prompt для `turn/start`

Наявний виклик hook:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

має стати context-aware:

1. обчислити базові developer instructions за допомогою `buildDeveloperInstructions(params)`
2. застосувати збирання/проєкцію context-engine
3. запустити `before_prompt_build` зі спроєктованими prompt/developer instructions

Такий порядок дозволяє загальним hooks prompt бачити той самий prompt, який отримає Codex. Якщо
нам потрібен суворий паритет із PI, запускайте збирання context-engine перед композицією hook,
оскільки PI застосовує `systemPromptAddition` context-engine до фінального system
prompt після свого конвеєра prompt. Важливий інваріант полягає в тому, що і context
engine, і hooks отримують детермінований, задокументований порядок.

Рекомендований порядок для першої реалізації:

1. `buildDeveloperInstructions(params)`
2. `assemble()` context-engine
3. додати `systemPromptAddition` на початок/кінець developer instructions
4. спроєктувати зібрані повідомлення в текст prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. передати фінальні developer instructions до `startOrResumeThread(...)`
7. передати фінальний текст prompt до `buildTurnStartParams(...)`

Специфікацію слід зафіксувати в тестах, щоб майбутні зміни випадково не змінювали порядок.

### 5. Зберегти форматування, стабільне для prompt-cache

Helper проєкції має створювати байтово стабільний вивід для ідентичних входів:

- стабільний порядок повідомлень
- стабільні мітки ролей
- без згенерованих міток часу
- без витоку порядку ключів об’єктів
- без випадкових роздільників
- без id на кожен запуск

Використовуйте фіксовані роздільники й явні секції.

### 6. Підключити post-turn після дзеркалення transcript

`CodexAppServerEventProjector` Codex створює локальний `messagesSnapshot` для
поточного ходу. `mirrorTranscriptBestEffort(...)` записує цей знімок у дзеркало transcript OpenClaw.

Після успішного або неуспішного дзеркалення викличте фіналізатор context-engine з
найкращим доступним знімком повідомлень:

- Надавайте перевагу повному контексту дзеркаленої сесії після запису, оскільки `afterTurn`
  очікує знімок сесії, а не лише поточний хід.
- Використовуйте резервний варіант `historyMessages + result.messagesSnapshot`, якщо файл сесії
  не вдається знову відкрити.

Псевдопотік:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Якщо дзеркалення не вдається, усе одно викликайте `afterTurn` з резервним знімком, але журналюйте,
що context engine виконує ingest із резервних даних ходу.

### 7. Нормалізувати usage і context виконання prompt-cache

Результати Codex містять нормалізований usage зі сповіщень токенів app-server, коли це доступно. Передавайте цей usage у context виконання context-engine.

Якщо app-server Codex з часом надасть деталі читання/запису кешу, зіставте їх із
`ContextEnginePromptCacheInfo`. До того часу пропускайте `promptCache`, а не вигадуйте нулі.

### 8. Політика Compaction

Існують дві системи Compaction:

1. `compact()` context-engine OpenClaw
2. native `thread/compact/start` app-server Codex

Не об’єднуйте їх мовчки.

#### `/compact` і явний Compaction OpenClaw

Коли вибраний context engine має `info.ownsCompaction === true`, явний
Compaction OpenClaw має віддавати перевагу результату `compact()` context engine для дзеркала transcript OpenClaw і стану Plugin.

Коли вибраний harness Codex має native прив’язку thread, ми можемо додатково
запитувати native Compaction Codex, щоб підтримувати thread app-server у здоровому стані, але про це слід повідомляти як про окрему backend-дію в details.

Рекомендована поведінка:

- Якщо `contextEngine.info.ownsCompaction === true`:
  - спочатку викликати `compact()` context-engine
  - потім у режимі best-effort викликати native Compaction Codex, коли існує прив’язка thread
  - повернути результат context-engine як основний
  - включити статус native Compaction Codex у `details.codexNativeCompaction`
- Якщо активний context engine не володіє Compaction:
  - зберегти поточну поведінку native Compaction Codex

Імовірно, для цього потрібно змінити `extensions/codex/src/app-server/compact.ts` або
обгорнути його із загального шляху Compaction, залежно від того, де викликається
`maybeCompactAgentHarnessSession(...)`.

#### Native події in-turn Codex `contextCompaction`

Codex може надсилати події елементів `contextCompaction` під час ходу. Збережіть поточне
надсилання hooks before/after compaction у `event-projector.ts`, але не розглядайте це як завершений Compaction context-engine.

Для engine, що володіють Compaction, надсилайте явну діагностику, коли Codex однаково виконує
native Compaction:

- назва потоку/події: наявний потік `compaction` підходить
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

Це робить розділення таким, що піддається аудиту.

### 9. Поведінка скидання сесії та прив’язки

Наявний `reset(...)` harness Codex очищає прив’язку app-server Codex із
файлу сесії OpenClaw. Збережіть цю поведінку.

Також переконайтеся, що очищення стану context-engine і надалі відбувається через наявні
шляхи життєвого циклу сесії OpenClaw. Не додавайте очищення, специфічне для Codex, якщо
життєвий цикл context-engine зараз не пропускає події reset/delete для всіх harness.

### 10. Обробка помилок

Дотримуйтеся семантики PI:

- збої bootstrap викликають попередження і не зупиняють роботу
- збої assemble викликають попередження і повертаються до незібраних pipeline messages/prompt
- збої afterTurn/ingest викликають попередження і позначають post-turn finalization як неуспішну
- maintenance запускається лише після успішних ходів без abort і без yield
- помилки Compaction не слід повторно запускати як нові prompts

Доповнення, специфічні для Codex:

- Якщо проєкція context завершується помилкою, виведіть попередження і поверніться до початкового prompt.
- Якщо дзеркалення transcript завершується помилкою, усе одно спробуйте фіналізацію context-engine з резервними повідомленнями.
- Якщо native Compaction Codex завершується помилкою після успішного Compaction context-engine,
  не завершуйте з помилкою весь Compaction OpenClaw, коли context engine є основним.

## План тестування

### Модульні тести

Додайте тести в `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex викликає `bootstrap`, коли існує файл сесії.
   - Codex викликає `assemble` з дзеркаленими повідомленнями, token budget, назвами tools,
     режимом citations, id моделі та prompt.
   - `systemPromptAddition` включається в developer instructions.
   - Зібрані повідомлення проєктуються в prompt перед поточним запитом.
   - Codex викликає `afterTurn` після дзеркалення transcript.
   - Без `afterTurn` Codex викликає `ingestBatch` або `ingest` для кожного повідомлення.
   - Turn maintenance запускається після успішних ходів.
   - Turn maintenance не запускається у разі prompt error, abort або yield abort.

2. `context-engine-projection.test.ts`
   - стабільний вивід для ідентичних входів
   - відсутність дублювання поточного prompt, коли зібрана history вже його містить
   - коректна обробка порожньої history
   - збереження порядку ролей
   - включення доповнення system prompt лише в developer instructions

3. `compact.context-engine.test.ts`
   - основний результат engine context, що володіє ним, має пріоритет
   - статус native Compaction Codex з’являється в details, коли його також було виконано
   - збій native Codex не призводить до збою Compaction context-engine, що володіє ним
   - context engine, що не володіє Compaction, зберігає поточну поведінку native Compaction

### Наявні тести, які потрібно оновити

- `extensions/codex/src/app-server/run-attempt.test.ts`, якщо він існує, інакше
  найближчі тести запуску app-server Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` лише якщо змінюються
  details подій compaction.
- `src/agents/harness/selection.test.ts` не повинен потребувати змін, якщо не змінюється
  поведінка config; він має залишитися стабільним.
- Тести PI для context-engine мають і надалі проходити без змін.

### Інтеграційні / live тести

Додайте або розширте smoke-тести live harness Codex:

- налаштуйте `plugins.slots.contextEngine` на тестовий engine
- налаштуйте `agents.defaults.model` на модель `codex/*`
- налаштуйте `agents.defaults.embeddedHarness.runtime = "codex"`
- перевірте, що тестовий engine спостерігав:
  - bootstrap
  - assemble
  - afterTurn або ingest
  - maintenance

Не вимагайте lossless-claw у тестах ядра OpenClaw. Використовуйте невеликий
фальшивий Plugin context engine у репозиторії.

## Спостережуваність

Додайте debug logs навколо викликів життєвого циклу context-engine Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` із причиною
- `codex native compaction completed alongside context-engine compaction`

Уникайте журналювання повних prompts або вмісту transcript.

Додавайте структуровані поля там, де це корисно:

- `sessionId`
- `sessionKey` із маскуванням або пропущений відповідно до наявної практики журналювання
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Міграція / сумісність

Це має бути зворотно сумісним:

- Якщо context engine не налаштовано, застаріла поведінка context engine має бути
  еквівалентною сьогоднішній поведінці harness Codex.
- Якщо `assemble` context-engine завершується помилкою, Codex має продовжити початковим
  шляхом prompt.
- Наявні прив’язки thread Codex мають залишатися чинними.
- Відбитки dynamic tools не повинні включати вивід context-engine; інакше
  кожна зміна context може примушувати створювати новий thread Codex. Лише каталог tools
  має впливати на відбиток dynamic tools.

## Відкриті питання

1. Чи слід вставляти зібраний context повністю в user prompt, повністю
   у developer instructions, чи розділяти?

   Рекомендація: розділяти. Поміщати `systemPromptAddition` у developer instructions;
   зібраний context transcript — в обгортку user prompt. Це найкраще відповідає
   поточному протоколу Codex без зміни native history thread.

2. Чи слід вимикати native Compaction Codex, коли context engine володіє
   Compaction?

   Рекомендація: ні, не на початку. Native Compaction Codex усе ще може бути
   потрібним, щоб підтримувати thread app-server живим. Але про нього слід повідомляти як про
   native Compaction Codex, а не як про Compaction context-engine.

3. Чи має `before_prompt_build` запускатися до чи після збирання context-engine?

   Рекомендація: після проєкції context-engine для Codex, щоб загальні hooks harness
   бачили фактичні prompt/developer instructions, які отримає Codex. Якщо паритет із PI
   вимагає протилежного, зафіксуйте вибраний порядок у тестах і задокументуйте його
   тут.

4. Чи може app-server Codex приймати в майбутньому структуроване перевизначення context/history?

   Невідомо. Якщо так, замініть шар текстової проєкції тим протоколом і
   залиште виклики життєвого циклу без змін.

## Критерії прийняття

- Хід embedded harness `codex/*` викликає життєвий цикл assemble вибраного
  context engine.
- `systemPromptAddition` context-engine впливає на developer instructions Codex.
- Зібраний context детерміновано впливає на вхід ходу Codex.
- Успішні ходи Codex викликають `afterTurn` або резервний ingest.
- Успішні ходи Codex запускають turn maintenance context-engine.
- Ходи з помилкою/abort/yield-abort не запускають turn maintenance.
- Compaction, яким володіє context-engine, лишається основним для стану OpenClaw/Plugin.
- Native Compaction Codex лишається таким, що піддається аудиту, як native поведінка Codex.
- Наявна поведінка context-engine PI не змінюється.
- Наявна поведінка harness Codex не змінюється, коли не вибрано non-legacy context engine
  або коли assemble завершується помилкою.
