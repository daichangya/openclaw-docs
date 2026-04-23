---
read_when:
    - Вам потрібен надійний резервний варіант, коли API-провайдери виходять з ладу
    - Ви використовуєте Codex CLI або інші локальні AI CLI і хочете повторно використовувати їх
    - Ви хочете зрозуміти міст local loopback MCP для доступу інструментів до бекенду CLI
summary: 'Бекенди CLI: локальний резервний AI CLI з необов’язковим мостом інструментів MCP'
title: Бекенди CLI
x-i18n:
    generated_at: "2026-04-23T19:23:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3709769c7fd88be1c455001d77472848f1b65a8aac499c6c35b063c4faa1cbfb
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Бекенди CLI (резервне середовище виконання)

OpenClaw може запускати **локальні AI CLI** як **лише текстовий резервний варіант**, коли API-провайдери недоступні,
обмежені за rate limit або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не впроваджуються безпосередньо**, але бекенди з `bundleMcp: true`
  можуть отримувати інструменти Gateway через міст loopback MCP.
- **JSONL-стримінг** для CLI, які це підтримують.
- **Сесії підтримуються** (тому наступні ходи залишаються узгодженими).
- **Зображення можна передавати далі**, якщо CLI приймає шляхи до зображень.

Це задумано як **страхувальна сітка**, а не основний шлях. Використовуйте це, коли
потрібні текстові відповіді у стилі «працює завжди» без залежності від зовнішніх API.

Якщо вам потрібне повноцінне середовище виконання harness із керуванням сесіями ACP, фоновими завданнями,
прив’язкою до потоку/розмови та постійними зовнішніми сесіями кодування, використовуйте
[ACP Agents](/uk/tools/acp-agents) натомість. Бекенди CLI — це не ACP.

## Швидкий старт для початківців

Ви можете використовувати Codex CLI **без жодної конфігурації** (вбудований Plugin OpenAI
реєструє бекенд за замовчуванням):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
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

І все. Жодних ключів і жодної додаткової конфігурації автентифікації, окрім самої CLI, не потрібно.

Якщо ви використовуєте вбудований бекенд CLI як **основного провайдера повідомлень** на
хості Gateway, OpenClaw тепер автоматично завантажує пов’язаний вбудований Plugin, коли ваша конфігурація
явно посилається на цей бекенд у model ref або в
`agents.defaults.cliBackends`.

## Використання як резервного варіанта

Додайте бекенд CLI до списку резервних варіантів, щоб він запускався лише тоді, коли основні моделі не спрацьовують:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Примітки:

- Якщо ви використовуєте `agents.defaults.models` (allowlist), ви також повинні включити туди моделі вашого бекенду CLI.
- Якщо основний провайдер не спрацьовує (автентифікація, rate limits, тайм-аути), OpenClaw
  далі спробує бекенд CLI.

## Огляд конфігурації

Усі бекенди CLI знаходяться в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ у вигляді **ідентифікатора провайдера** (наприклад, `codex-cli`, `my-cli`).
Ідентифікатор провайдера стає лівою частиною вашого model ref:

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
2. **Формує system prompt** з використанням того самого OpenClaw prompt і контексту робочого простору.
3. **Виконує CLI** з ідентифікатором сесії (якщо підтримується), щоб історія залишалася узгодженою.
   Вбудований бекенд `claude-cli` підтримує активний процес Claude stdio для кожної
   сесії OpenClaw і надсилає наступні ходи через stream-json stdin.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає ідентифікатори сесій** для кожного бекенду, щоб наступні ходи повторно використовували ту саму сесію CLI.

<Note>
Вбудований бекенд Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає
використання `claude -p` санкціонованим для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Вбудований бекенд OpenAI `codex-cli` передає system prompt OpenClaw через
перевизначення конфігурації Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex не надає прапорець у стилі Claude
`--append-system-prompt`, тому OpenClaw записує зібраний prompt у
тимчасовий файл для кожної нової сесії Codex CLI.

Вбудований бекенд Anthropic `claude-cli` отримує знімок Skills OpenClaw
двома способами: компактний каталог Skills OpenClaw у доданому system prompt і
тимчасовий Plugin Claude Code, переданий через `--plugin-dir`. Plugin містить
лише придатні Skills для цього агента/сесії, тому рідний резолвер навичок Claude Code бачить
той самий відфільтрований набір, який OpenClaw інакше оголошував би в prompt.
Перевизначення env/API-ключів для Skills, як і раніше, застосовуються OpenClaw до середовища дочірнього процесу під час запуску.

Перш ніж OpenClaw зможе використовувати вбудований бекенд `claude-cli`, сам Claude Code
вже має бути авторизований на тому самому хості:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Використовуйте `agents.defaults.cliBackends.claude-cli.command` лише тоді, коли бінарник `claude`
ще недоступний у `PATH`.

## Сесії

- Якщо CLI підтримує сесії, задайте `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (placeholder `{sessionId}`), коли ідентифікатор потрібно вставити
  у кілька прапорців.
- Якщо CLI використовує **підкоманду resume** з іншими прапорцями, задайте
  `resumeArgs` (замінює `args` під час відновлення) і, за потреби, `resumeOutput`
  (для відновлень не в JSON).
- `sessionMode`:
  - `always`: завжди надсилати ідентифікатор сесії (новий UUID, якщо нічого не збережено).
  - `existing`: надсилати ідентифікатор сесії лише в тому разі, якщо його вже було збережено.
  - `none`: ніколи не надсилати ідентифікатор сесії.
- `claude-cli` типово використовує `liveSession: "claude-stdio"`, `output: "jsonl"`,
  і `input: "stdin"`, щоб наступні ходи повторно використовували активний процес Claude, поки
  він активний. Теплий stdio тепер є варіантом за замовчуванням, зокрема для користувацьких конфігурацій,
  у яких не вказані поля транспорту. Якщо Gateway перезапускається або неактивний процес завершується,
  OpenClaw відновлюється зі збереженого ідентифікатора сесії Claude. Збережені ідентифікатори сесій
  перевіряються на наявність читабельного transcript проєкту перед відновленням, тому фантомні прив’язки
  очищаються з `reason=transcript-missing` замість того, щоб мовчки запускати нову сесію Claude CLI під `--resume`.
- Збережені сесії CLI — це безперервність, якою володіє провайдер. Неявне щоденне
  скидання їх не перериває; `/reset` і явні політики `session.reset` — переривають.

Примітки щодо серіалізації:

- `serialize: true` зберігає впорядкованість запусків у тій самій смузі.
- Більшість CLI серіалізують у межах однієї смуги провайдера.
- OpenClaw відмовляється від повторного використання збереженої сесії CLI, коли змінюється вибрана ідентичність автентифікації,
  зокрема змінений ідентифікатор профілю автентифікації, статичний API-ключ, статичний токен або ідентичність облікового запису OAuth,
  якщо CLI її надає. Ротація access і refresh токенів OAuth не перериває збережену сесію CLI. Якщо CLI не надає
  стабільного ідентифікатора облікового запису OAuth, OpenClaw дозволяє цій CLI самій контролювати дозволи на відновлення.

## Зображення (пасстрю)

Якщо ваша CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме base64-зображення в тимчасові файли. Якщо задано `imageArg`, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (ін’єкція шляху), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Входи / виходи

- `output: "json"` (типово) намагається розібрати JSON і витягти текст та ідентифікатор сесії.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response`, а
  використання — зі `stats`, коли `usage` відсутній або порожній.
- `output: "jsonl"` розбирає JSONL-потоки (наприклад, Codex CLI `--json`) і витягує фінальне повідомлення агента разом з ідентифікаторами сесії, якщо вони присутні.
- `output: "text"` сприймає stdout як фінальну відповідь.

Режими введення:

- `input: "arg"` (типово) передає prompt як останній аргумент CLI.
- `input: "stdin"` надсилає prompt через stdin.
- Якщо prompt дуже довгий і задано `maxPromptArgChars`, використовується stdin.

## Значення за замовчуванням (належать Plugin)

Вбудований Plugin OpenAI також реєструє значення за замовчуванням для `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Вбудований Plugin Google також реєструє значення за замовчуванням для `google-gemini-cli`:

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

- Текст відповіді читається з JSON-поля `response`.
- Використання резервно береться зі `stats`, якщо `usage` відсутній або порожній.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (типовий випадок: абсолютний шлях `command`).

## Значення за замовчуванням, що належать Plugin

Значення за замовчуванням бекенду CLI тепер є частиною поверхні Plugin:

- Plugins реєструють їх за допомогою `api.registerCliBackend(...)`.
- `id` бекенду стає префіксом провайдера в model refs.
- Конфігурація користувача в `agents.defaults.cliBackends.<id>` як і раніше перевизначає значення за замовчуванням Plugin.
- Очищення конфігурації, специфічне для бекенду, і надалі належить Plugin через необов’язковий
  hook `normalizeConfig`.

Plugins, яким потрібні невеликі сумісні shim для prompt/повідомлень, можуть оголошувати
двонапрямні текстові трансформації без заміни провайдера або бекенду CLI:

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

`input` переписує system prompt і user prompt, які передаються до CLI. `output`
переписує потокові дельти асистента й розібраний фінальний текст до того, як OpenClaw обробить
власні контрольні маркери та доставку в канал.

Для CLI, які виводять JSONL, сумісний із Claude Code stream-json, задайте
`jsonlDialect: "claude-stream-json"` у конфігурації цього бекенду.

## Оверлеї bundle MCP

Бекенди CLI **не** отримують виклики інструментів OpenClaw безпосередньо, але бекенд може
увімкнути згенерований оверлей конфігурації MCP за допомогою `bundleMcp: true`.

Поточна вбудована поведінка:

- `claude-cli`: згенерований строгий файл конфігурації MCP
- `codex-cli`: вбудовані перевизначення конфігурації для `mcp_servers`
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли bundle MCP увімкнено, OpenClaw:

- запускає loopback HTTP MCP-сервер, який надає інструменти Gateway процесу CLI
- автентифікує міст токеном на рівні сесії (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточною сесією, обліковим записом і контекстом каналу
- завантажує увімкнені bundle-MCP сервери для поточного робочого простору
- об’єднує їх з будь-якою наявною формою конфігурації/налаштувань MCP бекенду
- переписує конфігурацію запуску з використанням режиму інтеграції, що належить бекенду з пов’язаного extension

Якщо жоден MCP-сервер не ввімкнено, OpenClaw однаково впроваджує строгу конфігурацію, коли
бекенд увімкнув bundle MCP, щоб фонові запуски залишалися ізольованими.

## Обмеження

- **Немає прямих викликів інструментів OpenClaw.** OpenClaw не впроваджує виклики інструментів у
  протокол бекенду CLI. Бекенди бачать інструменти Gateway лише тоді, коли вмикають
  `bundleMcp: true`.
- **Стримінг залежить від бекенду.** Деякі бекенди транслюють JSONL-потік; інші буферизують
  до завершення.
- **Структуровані виходи** залежать від JSON-формату CLI.
- **Сесії Codex CLI** відновлюються через текстовий вивід (без JSONL), що менш
  структуровано, ніж початковий запуск `--json`. Сесії OpenClaw при цьому продовжують працювати
  нормально.

## Усунення несправностей

- **CLI не знайдено**: задайте `command` як повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає безперервності сесії**: переконайтеся, що задано `sessionArg` і `sessionMode` не дорівнює
  `none` (Codex CLI наразі не може відновлюватися з JSON-виводом).
- **Зображення ігноруються**: задайте `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).
