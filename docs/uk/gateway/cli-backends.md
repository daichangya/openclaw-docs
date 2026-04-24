---
read_when:
    - Вам потрібен надійний резервний варіант, коли провайдери API дають збій
    - Ви запускаєте Codex CLI або інші локальні AI CLI і хочете використовувати їх повторно
    - Ви хочете зрозуміти міст MCP local loopback для доступу CLI backend до інструментів
summary: 'CLI backends: резервний локальний AI CLI з необов’язковим мостом інструментів MCP'
title: бекенди CLI
x-i18n:
    generated_at: "2026-04-24T04:13:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# бекенди CLI (резервне середовище виконання)

OpenClaw може запускати **локальні AI CLI** як **резервний варіант лише для тексту**, коли провайдери API недоступні, обмежені за rate limit або тимчасово працюють нестабільно. Це навмисно консервативний режим:

- **Інструменти OpenClaw не вбудовуються напряму**, але бекенди з `bundleMcp: true` можуть отримувати інструменти gateway через міст MCP local loopback.
- **JSONL-streaming** для CLI, які це підтримують.
- **Сесії підтримуються** (тому наступні ходи залишаються узгодженими).
- **Зображення можна передавати далі**, якщо CLI приймає шляхи до зображень.

Це задумано як **страхувальна сітка**, а не як основний шлях. Використовуйте це, коли вам потрібні текстові відповіді у стилі «завжди працює» без залежності від зовнішніх API.

Якщо вам потрібне повноцінне harness-середовище виконання з керуванням сесіями ACP, фоновими завданнями, прив’язкою thread/conversation і сталими зовнішніми coding sessions, використовуйте [ACP Agents](/uk/tools/acp-agents). Бекенди CLI — це не ACP.

## Швидкий старт для початківців

Ви можете використовувати Codex CLI **без жодної конфігурації** (вбудований Plugin OpenAI реєструє бекенд за замовчуванням):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Якщо ваш gateway працює під launchd/systemd і `PATH` мінімальний, додайте лише шлях до команди:

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

І все. Не потрібні ні ключі, ні додаткова конфігурація auth, окрім самого CLI.

Якщо ви використовуєте вбудований бекенд CLI як **основного провайдера повідомлень** на хості gateway, OpenClaw тепер автоматично завантажує вбудований Plugin-власник, коли ваша конфігурація явно посилається на цей бекенд у model ref або в `agents.defaults.cliBackends`.

## Використання як резервного варіанта

Додайте бекенд CLI до списку резервних варіантів, щоб він запускався лише тоді, коли основні моделі недоступні:

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

- Якщо ви використовуєте `agents.defaults.models` (allowlist), ви також маєте включити туди моделі вашого бекенду CLI.
- Якщо основний провайдер дає збій (auth, rate limits, timeouts), OpenClaw спробує далі бекенд CLI.

## Огляд конфігурації

Усі бекенди CLI знаходяться в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ **provider id** (наприклад, `codex-cli`, `my-cli`).
Provider id стає лівою частиною вашого model ref:

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
          // Codex-style CLIs can point at a prompt file instead:
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

1. **Вибирає бекенд** на основі префікса provider (`codex-cli/...`).
2. **Формує system prompt** з використанням того самого prompt OpenClaw і workspace context.
3. **Виконує CLI** з session id (якщо підтримується), щоб історія залишалася послідовною.
   Вбудований бекенд `claude-cli` підтримує живий stdio-процес Claude для кожної
   сесії OpenClaw і надсилає наступні ходи через stdin stream-json.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає session ids** для кожного бекенду, щоб наступні ходи повторно використовували ту саму CLI-сесію.

<Note>
Вбудований бекенд Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
сказали нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає
використання `claude -p` санкціонованим для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Вбудований бекенд OpenAI `codex-cli` передає system prompt OpenClaw через
перевизначення конфігурації `model_instructions_file` у Codex (`-c
model_instructions_file="..."`). Codex не надає прапорця на кшталт Claude
`--append-system-prompt`, тому OpenClaw записує зібраний prompt у
тимчасовий файл для кожної нової сесії Codex CLI.

Вбудований бекенд Anthropic `claude-cli` отримує snapshot Skills OpenClaw
двома способами: компактний каталог Skills OpenClaw у доданому system prompt і
тимчасовий Plugin Claude Code, переданий через `--plugin-dir`. Plugin містить
лише ті Skills, які підходять для цього agent/session, тож вбудований resolver Skills у Claude Code
бачить той самий відфільтрований набір, який OpenClaw інакше рекламував би в prompt.
Перевизначення env/API key для Skills, як і раніше, застосовуються OpenClaw до
середовища дочірнього процесу під час запуску.

Claude CLI також має власний неінтерактивний режим дозволів. OpenClaw зіставляє
його з наявною політикою exec замість додавання конфігурації, специфічної для Claude:
коли ефективно запитана політика exec — YOLO (`tools.exec.security: "full"` і
`tools.exec.ask: "off"`), OpenClaw додає `--permission-mode bypassPermissions`.
Налаштування `agents.list[].tools.exec` для окремого agent перевизначають глобальні `tools.exec` для
цього agent. Щоб примусово використати інший режим Claude, задайте явні сирі аргументи
бекенду, наприклад `--permission-mode default` або `--permission-mode acceptEdits`, у
`agents.defaults.cliBackends.claude-cli.args` і відповідних `resumeArgs`.

Перш ніж OpenClaw зможе використовувати вбудований бекенд `claude-cli`, сам Claude Code
має вже бути авторизований на тому самому хості:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Використовуйте `agents.defaults.cliBackends.claude-cli.command` лише якщо бінарний файл `claude`
ще не доступний у `PATH`.

## Сесії

- Якщо CLI підтримує сесії, установіть `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (placeholder `{sessionId}`), коли ID потрібно вставити
  в кілька прапорців.
- Якщо CLI використовує **resume subcommand** з іншими прапорцями, установіть
  `resumeArgs` (замінює `args` під час відновлення) і, за потреби, `resumeOutput`
  (для відновлення не в JSON).
- `sessionMode`:
  - `always`: завжди надсилати session id (новий UUID, якщо нічого не збережено).
  - `existing`: надсилати session id лише якщо він уже був збережений.
  - `none`: ніколи не надсилати session id.
- `claude-cli` за замовчуванням має `liveSession: "claude-stdio"`, `output: "jsonl"`,
  і `input: "stdin"`, тож наступні ходи повторно використовують живий процес Claude,
  поки він активний. Теплий stdio тепер використовується за замовчуванням, зокрема для
  користувацьких конфігурацій без явно вказаних полів transport. Якщо Gateway перезапускається або неактивний процес
  завершується, OpenClaw відновлюється зі збереженого Claude session id. Збережені session ids
  перевіряються щодо наявного читабельного project transcript перед відновленням, тому
  фантомні прив’язки очищаються з `reason=transcript-missing` замість тихого запуску нової сесії Claude CLI через `--resume`.
- Збережені CLI-сесії — це безперервність, якою володіє provider. Неявне щоденне
  скидання сесії їх не перериває; `/reset` і явні політики `session.reset` — переривають.

Примітки щодо серіалізації:

- `serialize: true` зберігає впорядкованість запусків у межах однієї смуги.
- Більшість CLI серіалізуються в межах однієї смуги provider.
- OpenClaw відкидає повторне використання збереженої CLI-сесії, коли змінюється вибрана auth-ідентичність,
  зокрема змінюється id профілю auth, статичний API key, статичний token або ідентичність OAuth-акаунта,
  якщо CLI її надає. Ротація access і refresh token OAuth не перериває збережену CLI-сесію. Якщо CLI не надає
  стабільний OAuth account id, OpenClaw дозволяє цьому CLI самостійно забезпечувати дозволи на resume.

## Зображення (передавання без змін)

Якщо ваш CLI приймає шляхи до зображень, установіть `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме base64-зображення в тимчасові файли. Якщо встановлено `imageArg`, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (path injection), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Входи / виходи

- `output: "json"` (за замовчуванням) намагається розібрати JSON і витягти текст + session id.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response`, а
  використання — зі `stats`, коли `usage` відсутній або порожній.
- `output: "jsonl"` розбирає JSONL-потоки (наприклад, Codex CLI `--json`) і витягує фінальне повідомлення агента та session
  identifiers, якщо вони наявні.
- `output: "text"` трактує stdout як фінальну відповідь.

Режими вводу:

- `input: "arg"` (за замовчуванням) передає prompt як останній аргумент CLI.
- `input: "stdin"` надсилає prompt через stdin.
- Якщо prompt дуже довгий і встановлено `maxPromptArgChars`, використовується stdin.

## Значення за замовчуванням (належать Plugin)

Вбудований Plugin OpenAI також реєструє типові значення для `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Вбудований Plugin Google також реєструє типові значення для `google-gemini-cli`:

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
- Використання бере значення зі `stats`, якщо `usage` відсутній або порожній.
- `stats.cached` нормалізується до OpenClaw `cacheRead`.
- Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (типовий випадок: абсолютний шлях `command`).

## Типові значення, що належать Plugin

Типові значення бекендів CLI тепер є частиною поверхні Plugin:

- Plugins реєструють їх через `api.registerCliBackend(...)`.
- `id` бекенду стає префіксом provider у model refs.
- Користувацька конфігурація в `agents.defaults.cliBackends.<id>` як і раніше перевизначає типове значення Plugin.
- Очищення конфігурації, специфічної для бекенду, залишається відповідальністю Plugin через необов’язковий
  hook `normalizeConfig`.

Plugins, яким потрібні невеликі shim-и сумісності prompt/message, можуть оголошувати
двоспрямовані текстові перетворення без заміни provider або бекенду CLI:

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
переписує streaming assistant deltas і розібраний фінальний текст до того, як OpenClaw обробить
власні control markers і доставку в channel.

Для CLI, які виводять JSONL, сумісний із Claude Code stream-json, установіть
`jsonlDialect: "claude-stream-json"` у конфігурації цього бекенду.

## Bundle MCP overlays

Бекенди CLI **не** отримують виклики інструментів OpenClaw напряму, але бекенд може
увімкнути згенерований config overlay MCP за допомогою `bundleMcp: true`.

Поточна вбудована поведінка:

- `claude-cli`: згенерований строгий файл конфігурації MCP
- `codex-cli`: вбудовані перевизначення конфігурації для `mcp_servers`; згенерований
  loopback-сервер OpenClaw позначається режимом погодження інструментів для сервера в Codex,
  щоб виклики MCP не зависали на локальних запитах підтвердження
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли bundle MCP увімкнено, OpenClaw:

- запускає loopback HTTP MCP-сервер, який надає інструменти gateway процесу CLI
- автентифікує міст за допомогою токена на сесію (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточною сесією, акаунтом і контекстом channel
- завантажує увімкнені сервери bundle-MCP для поточного workspace
- об’єднує їх із будь-якою наявною формою конфігурації/налаштувань MCP бекенду
- переписує конфігурацію запуску, використовуючи режим інтеграції, що належить бекенду, з розширення-власника

Якщо жодні сервери MCP не увімкнені, OpenClaw однаково вбудовує строгу конфігурацію, коли
бекенд вмикає bundle MCP, щоб фонові запуски залишалися ізольованими.

## Обмеження

- **Немає прямих викликів інструментів OpenClaw.** OpenClaw не вбудовує виклики інструментів у
  протокол бекенду CLI. Бекенди бачать інструменти gateway лише тоді, коли вони вмикають
  `bundleMcp: true`.
- **Streaming залежить від бекенду.** Деякі бекенди передають JSONL-потік; інші буферизують
  вивід до завершення.
- **Структуровані виходи** залежать від JSON-формату CLI.
- **Сесії Codex CLI** відновлюються через текстовий вивід (без JSONL), що менш
  структуровано, ніж початковий запуск з `--json`. Сесії OpenClaw однаково працюють
  нормально.

## Усунення проблем

- **CLI не знайдено**: установіть `command` як повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає безперервності сесії**: переконайтеся, що встановлено `sessionArg`, а `sessionMode` не дорівнює
  `none` (Codex CLI наразі не може відновлюватися з JSON-виводом).
- **Зображення ігноруються**: установіть `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Локальні моделі](/uk/gateway/local-models)
