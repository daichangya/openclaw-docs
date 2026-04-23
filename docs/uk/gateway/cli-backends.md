---
read_when:
    - Вам потрібен надійний резервний варіант, коли API-провайдери зазнають збою
    - Ви використовуєте Codex CLI або інші локальні AI CLI і хочете повторно їх використовувати
    - Ви хочете зрозуміти міст local loopback MCP для доступу CLI-бекенду до інструментів
summary: 'CLI-бекенди: резервний варіант локального AI CLI з необов’язковим мостом інструментів MCP'
title: CLI-бекенди
x-i18n:
    generated_at: "2026-04-23T07:12:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI-бекенди (резервне runtime)

OpenClaw може запускати **локальні AI CLI** як **текстовий резервний варіант**, коли API-провайдери недоступні,
мають rate limit або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не інжектуються напряму**, але бекенди з `bundleMcp: true`
  можуть отримувати інструменти Gateway через міст MCP local loopback.
- **JSONL-стримінг** для CLI, які це підтримують.
- **Сесії підтримуються** (тому наступні ходи залишаються узгодженими).
- **Зображення можна передавати наскрізь**, якщо CLI приймає шляхи до зображень.

Це задумано як **страхувальна сітка**, а не як основний шлях. Використовуйте це, коли вам
потрібні текстові відповіді у стилі «завжди працює» без залежності від зовнішніх API.

Якщо вам потрібне повноцінне runtime harness із керуванням сесіями ACP, фоновими завданнями,
прив’язкою до thread/conversation і постійними зовнішніми coding sessions, використовуйте
[ACP Agents](/uk/tools/acp-agents). CLI-бекенди — це не ACP.

## Швидкий старт для початківців

Ви можете використовувати Codex CLI **без жодної конфігурації** (bundled plugin OpenAI
реєструє бекенд за замовчуванням):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Якщо ваш Gateway працює під launchd/systemd і PATH мінімальний, додайте лише
шлях до команди:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Ось і все. Жодні ключі чи додаткова конфігурація автентифікації не потрібні, окрім самої CLI.

Якщо ви використовуєте bundled CLI-бекенд як **основного провайдера повідомлень** на
хості Gateway, OpenClaw тепер автоматично завантажує пов’язаний bundled plugin, коли ваша конфігурація
явно посилається на цей бекенд у model ref або в
`agents.defaults.cliBackends`.

## Використання як резервного варіанту

Додайте CLI-бекенд до списку резервних варіантів, щоб він запускався лише тоді, коли основні моделі зазнають збою:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Примітки:

- Якщо ви використовуєте `agents.defaults.models` (allowlist), ви також маєте включити туди моделі вашого CLI-бекенду.
- Якщо основний провайдер зазнає збою (автентифікація, rate limit, тайм-аути), OpenClaw
  спробує CLI-бекенд наступним.

## Огляд конфігурації

Усі CLI-бекенди розташовані в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ у вигляді **id провайдера** (наприклад, `codex-cli`, `my-cli`).
Id провайдера стає лівою частиною вашого посилання на модель:

```
<provider>/<model>
```

### Приклад конфігурації

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // CLI у стилі Codex можуть натомість вказувати на файл prompt:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Як це працює

1. **Вибирає бекенд** на основі префікса провайдера (`codex-cli/...`).
2. **Створює system prompt**, використовуючи той самий prompt OpenClaw і контекст робочого простору.
3. **Виконує CLI** з id сесії (якщо підтримується), щоб історія залишалася узгодженою.
   Bundled бекенд `claude-cli` підтримує живий процес Claude stdio для кожної
   сесії OpenClaw і надсилає наступні ходи через stream-json stdin.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає id сесій** для кожного бекенду, щоб наступні ходи повторно використовували ту саму CLI-сесію.

<Note>
Bundled бекенд Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає
використання `claude -p` санкціонованим для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Bundled бекенд OpenAI `codex-cli` передає system prompt OpenClaw через
перевизначення конфігурації Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex не надає прапорець у стилі Claude
`--append-system-prompt`, тому OpenClaw записує зібраний prompt у
тимчасовий файл для кожної нової сесії Codex CLI.

Bundled бекенд Anthropic `claude-cli` отримує знімок Skills OpenClaw
двома способами: компактний каталог Skills OpenClaw у доданому system prompt і
тимчасовий Plugin Claude Code, переданий через `--plugin-dir`. Plugin містить
лише Skills, допустимі для цього агента/сесії, тож нативний засіб визначення Skills у Claude Code бачить той самий відфільтрований набір, який OpenClaw інакше рекламував би в prompt. Перевизначення env/API key для Skills, як і раніше, застосовуються OpenClaw до середовища дочірнього процесу під час виконання.

## Сесії

- Якщо CLI підтримує сесії, задайте `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (заповнювач `{sessionId}`), коли ID потрібно вставити
  в кілька прапорців.
- Якщо CLI використовує **підкоманду resume** з іншими прапорцями, задайте
  `resumeArgs` (замінює `args` під час відновлення) і, за потреби, `resumeOutput`
  (для відновлення не у форматі JSON).
- `sessionMode`:
  - `always`: завжди передавати id сесії (новий UUID, якщо нічого не збережено).
  - `existing`: передавати id сесії лише якщо його вже було збережено.
  - `none`: ніколи не передавати id сесії.
- Для `claude-cli` типовими є `liveSession: "claude-stdio"`, `output: "jsonl"`
  і `input: "stdin"`, тож наступні ходи повторно використовують живий процес Claude, поки
  він активний. Теплий stdio тепер використовується за замовчуванням, зокрема для користувацьких конфігурацій,
  які не вказують transport-поля. Якщо Gateway перезапускається або неактивний процес
  завершується, OpenClaw відновлює роботу зі збереженого id сесії Claude. Збережені id сесій
  перевіряються на наявність доступного для читання наявного project transcript перед
  відновленням, тому фантомні прив’язки очищаються з `reason=transcript-missing`
  замість тихого запуску нової сесії Claude CLI під `--resume`.
- Збережені CLI-сесії — це безперервність, що належить провайдеру. Неявне щоденне
  скидання їх не перериває; `/reset` і явні політики `session.reset` — переривають.

Примітки щодо серіалізації:

- `serialize: true` зберігає впорядкованість запусків у тій самій lane.
- Більшість CLI серіалізують виконання в одній lane провайдера.
- OpenClaw скидає повторне використання збереженої CLI-сесії, коли змінюється вибрана автентифікаційна ідентичність,
  зокрема змінюється id профілю автентифікації, статичний API key, статичний токен або OAuth-ідентичність
  облікового запису, якщо CLI її надає. Ротація access і refresh токенів OAuth не
  перериває збережену CLI-сесію. Якщо CLI не надає стабільний id OAuth-облікового запису,
  OpenClaw дозволяє цій CLI самій контролювати права на відновлення.

## Зображення (наскрізна передача)

Якщо ваша CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме base64-зображення у тимчасові файли. Якщо задано `imageArg`, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (інжекція шляху), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Входи / виходи

- `output: "json"` (типово) намагається розібрати JSON і витягти текст + id сесії.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response`, а
  використання — зі `stats`, коли `usage` відсутнє або порожнє.
- `output: "jsonl"` розбирає потоки JSONL (наприклад Codex CLI `--json`) і витягує фінальне повідомлення агента разом з ідентифікаторами сесії,
  коли вони присутні.
- `output: "text"` трактує stdout як фінальну відповідь.

Режими введення:

- `input: "arg"` (типово) передає prompt як останній аргумент CLI.
- `input: "stdin"` надсилає prompt через stdin.
- Якщо prompt дуже довгий і задано `maxPromptArgChars`, використовується stdin.

## Типові значення (належать plugin)

Bundled plugin OpenAI також реєструє типові значення для `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Bundled plugin Google також реєструє типові значення для `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Передумова: локальний Gemini CLI має бути встановлений і доступний як
`gemini` у `PATH` (`brew install gemini-cli` або
`npm install -g @google/gemini-cli`).

Примітки щодо JSON Gemini CLI:

- Текст відповіді читається з поля JSON `response`.
- Використання бере резервний варіант зі `stats`, коли `usage` відсутнє або порожнє.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутнє, OpenClaw обчислює вхідні токени з
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (поширений випадок: абсолютний шлях `command`).

## Типові значення, що належать Plugin

Типові значення CLI-бекенду тепер є частиною поверхні Plugin:

- Plugins реєструють їх через `api.registerCliBackend(...)`.
- `id` бекенду стає префіксом провайдера в посиланнях на модель.
- Користувацька конфігурація в `agents.defaults.cliBackends.<id>` як і раніше перевизначає типові значення Plugin.
- Очищення конфігурації, специфічне для бекенду, залишається відповідальністю plugin через необов’язковий
  хук `normalizeConfig`.

Plugins, яким потрібні невеликі сумісні shim-перетворення prompt/повідомлень, можуть оголошувати
двонапрямні текстові перетворення без заміни провайдера або CLI-бекенду:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` переписує system prompt і user prompt, передані до CLI. `output`
переписує стримінгові deltas помічника та розібраний фінальний текст до того, як OpenClaw обробить
власні control markers і доставку через канали.

Для CLI, які видають JSONL, сумісний із Claude Code stream-json, задайте
`jsonlDialect: "claude-stream-json"` у конфігурації цього бекенду.

## Bundle MCP overlays

CLI-бекенди **не** отримують виклики інструментів OpenClaw напряму, але бекенд може
увімкнути згенерований накладений MCP-конфіг через `bundleMcp: true`.

Поточна bundled-поведінка:

- `claude-cli`: згенерований strict MCP config file
- `codex-cli`: вбудовані перевизначення конфігурації для `mcp_servers`
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли bundle MCP увімкнено, OpenClaw:

- запускає loopback HTTP MCP-сервер, який надає інструменти Gateway процесу CLI
- автентифікує міст за допомогою токена на рівні сесії (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточною сесією, обліковим записом і контекстом каналу
- завантажує ввімкнені bundle-MCP-сервери для поточного робочого простору
- об’єднує їх із будь-якою наявною формою MCP-конфігурації/налаштувань бекенду
- переписує конфігурацію запуску з використанням режиму інтеграції, що належить бекенду, від розширення-власника

Якщо жоден MCP-сервер не ввімкнено, OpenClaw все одно інжектує strict config, коли
бекенд увімкнув bundle MCP, щоб фонові запуски залишалися ізольованими.

## Обмеження

- **Немає прямих викликів інструментів OpenClaw.** OpenClaw не інжектує виклики інструментів у
  протокол CLI-бекенду. Бекенди бачать інструменти Gateway лише тоді, коли вони вмикають
  `bundleMcp: true`.
- **Стримінг залежить від бекенду.** Деякі бекенди стримлять JSONL; інші буферизують
  до завершення.
- **Структуровані виходи** залежать від JSON-формату CLI.
- **Сесії Codex CLI** відновлюються через текстовий вивід (без JSONL), що менш
  структуровано, ніж початковий запуск `--json`. Сесії OpenClaw при цьому все одно працюють
  нормально.

## Усунення несправностей

- **CLI не знайдено**: установіть `command` на повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає безперервності сесії**: переконайтеся, що `sessionArg` задано, а `sessionMode` не дорівнює
  `none` (Codex CLI наразі не може відновлюватися з JSON-виводом).
- **Зображення ігноруються**: задайте `imageArg` (і переконайтеся, що CLI підтримує шляхи до файлів).
