---
read_when:
    - Вам потрібен надійний резервний варіант, коли API-провайдери зазнають збою
    - Ви запускаєте Codex CLI або інші локальні AI CLI й хочете повторно використовувати їх
    - Ви хочете зрозуміти міст local loopback MCP для доступу CLI-бекенду до інструментів
summary: 'CLI бекенди: локальний резервний AI CLI з необов’язковим мостом інструментів MCP'
title: CLI-бекенди
x-i18n:
    generated_at: "2026-04-23T03:39:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d36aea09a97b980e6938e12ea3bb5c01aa5f6c4275879d51879e48d5a2225fb2
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI-бекенди (резервне середовище виконання)

OpenClaw може запускати **локальні AI CLI** як **резервний варіант лише для тексту**, коли API-провайдери недоступні,
обмежені за rate limit або тимчасово працюють некоректно. Це навмисно консервативний підхід:

- **Інструменти OpenClaw не вбудовуються напряму**, але бекенди з `bundleMcp: true`
  можуть отримувати інструменти Gateway через loopback-міст MCP.
- **JSONL-стримінг** для CLI, які це підтримують.
- **Сеанси підтримуються** (тому наступні ходи залишаються узгодженими).
- **Зображення можна передавати далі**, якщо CLI приймає шляхи до зображень.

Це задумано як **страхувальна сітка**, а не як основний шлях. Використовуйте це, коли
вам потрібні текстові відповіді за принципом «завжди працює» без залежності від зовнішніх API.

Якщо вам потрібне повне середовище виконання harness із керуванням сеансами ACP, фоновими завданнями,
прив’язкою до потоку/розмови та постійними зовнішніми сеансами кодування, використовуйте
[ACP Agents](/uk/tools/acp-agents). CLI-бекенди — це не ACP.

## Швидкий старт для початківців

Ви можете використовувати Codex CLI **без жодної конфігурації** (вбудований Plugin OpenAI
реєструє бекенд за замовчуванням):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Якщо ваш Gateway працює через launchd/systemd і PATH мінімальний, додайте лише
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

І це все. Жодних ключів, жодної додаткової конфігурації автентифікації, окрім самої CLI, не потрібно.

Якщо ви використовуєте вбудований CLI-бекенд як **основного провайдера повідомлень** на
хості Gateway, OpenClaw тепер автоматично завантажує пов’язаний вбудований Plugin, коли у вашій конфігурації
явно згадано цей бекенд у посиланні на модель або в
`agents.defaults.cliBackends`.

## Використання як резервного варіанта

Додайте CLI-бекенд до списку резервних, щоб він запускався лише тоді, коли основні моделі не працюють:

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

- Якщо ви використовуєте `agents.defaults.models` (allowlist), ви також маєте включити туди моделі CLI-бекенду.
- Якщо основний провайдер не спрацьовує (автентифікація, обмеження rate limit, тайм-аути), OpenClaw
  спробує CLI-бекенд наступним.

## Огляд конфігурації

Усі CLI-бекенди розміщуються в:

```
agents.defaults.cliBackends
```

Кожен запис має ключ у вигляді **id провайдера** (наприклад, `codex-cli`, `my-cli`).
Id провайдера стає лівою частиною посилання на модель:

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
          // CLI у стилі Codex натомість можуть вказувати на файл prompt:
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
2. **Формує системний prompt** із використанням того самого prompt OpenClaw і контексту робочого простору.
3. **Запускає CLI** з id сеансу (якщо підтримується), щоб історія залишалася узгодженою.
   Вбудований бекенд `claude-cli` підтримує живий процес Claude stdio для кожного
   сеансу OpenClaw і надсилає наступні ходи через stdin stream-json.
4. **Розбирає вивід** (JSON або звичайний текст) і повертає фінальний текст.
5. **Зберігає id сеансів** для кожного бекенду, щоб наступні ходи повторно використовували той самий сеанс CLI.

<Note>
Вбудований бекенд Anthropic `claude-cli` знову підтримується. Співробітники Anthropic
повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw розглядає
використання `claude -p` як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує
нову політику.
</Note>

Вбудований бекенд OpenAI `codex-cli` передає системний prompt OpenClaw через
перевизначення конфігурації Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex не надає прапорець на кшталт Claude
`--append-system-prompt`, тому OpenClaw записує зібраний prompt у
тимчасовий файл для кожного нового сеансу Codex CLI.

Вбудований бекенд Anthropic `claude-cli` отримує знімок Skills OpenClaw
двома способами: компактний каталог Skills OpenClaw у доданому системному prompt і
тимчасовий Plugin Claude Code, переданий через `--plugin-dir`. Plugin містить
лише ті Skills, які дозволені для цього агента/сеансу, тому нативний механізм розв’язання Skills у Claude Code
бачить той самий відфільтрований набір, який OpenClaw інакше рекламував би в prompt.
Перевизначення env/API key для Skills, як і раніше, застосовуються OpenClaw до середовища дочірнього процесу під час запуску.

## Сеанси

- Якщо CLI підтримує сеанси, задайте `sessionArg` (наприклад, `--session-id`) або
  `sessionArgs` (з плейсхолдером `{sessionId}`), коли id потрібно вставити
  у кілька прапорців.
- Якщо CLI використовує **resume subcommand** з іншими прапорцями, задайте
  `resumeArgs` (замінює `args` під час відновлення) і, за потреби, `resumeOutput`
  (для відновлення без JSON).
- `sessionMode`:
  - `always`: завжди передавати id сеансу (новий UUID, якщо нічого не збережено).
  - `existing`: передавати id сеансу лише якщо його вже було збережено.
  - `none`: ніколи не передавати id сеансу.
- Для `claude-cli` за замовчуванням встановлено `liveSession: "claude-stdio"`, `output: "jsonl"`,
  і `input: "stdin"`, тому наступні ходи повторно використовують живий процес Claude, поки
  він активний. Якщо Gateway перезапускається або неактивний процес завершується, OpenClaw
  відновлюється зі збереженого id сеансу Claude.
- Збережені CLI-сеанси забезпечують безперервність, що належить провайдеру. Неявне щоденне
  скидання не обриває їх; `/reset` і явні політики `session.reset` — обривають.

Примітки щодо серіалізації:

- `serialize: true` зберігає впорядкованість запусків в одній доріжці.
- Більшість CLI серіалізують виконання в одній доріжці провайдера.
- OpenClaw скидає повторне використання збереженого CLI-сеансу, коли змінюється вибрана ідентичність автентифікації,
  зокрема при зміні id профілю автентифікації, статичного API key, статичного токена або OAuth-ідентичності облікового запису, якщо CLI її надає. Ротація токенів доступу й оновлення OAuth не обриває збережений CLI-сеанс. Якщо CLI не надає
  стабільний id OAuth-акаунта, OpenClaw дозволяє цій CLI самій забезпечувати дозволи на відновлення.

## Зображення (пряма передача)

Якщо ваша CLI приймає шляхи до зображень, задайте `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw записуватиме зображення base64 у тимчасові файли. Якщо задано `imageArg`, ці
шляхи передаються як аргументи CLI. Якщо `imageArg` відсутній, OpenClaw додає
шляхи до файлів у prompt (path injection), чого достатньо для CLI, які автоматично
завантажують локальні файли зі звичайних шляхів.

## Входи / виходи

- `output: "json"` (типово) намагається розібрати JSON і витягти текст + id сеансу.
- Для JSON-виводу Gemini CLI OpenClaw читає текст відповіді з `response`, а
  usage — зі `stats`, якщо `usage` відсутній або порожній.
- `output: "jsonl"` розбирає JSONL-потоки (наприклад, Codex CLI `--json`) і витягує фінальне повідомлення агента, а також ідентифікатори сеансу, якщо вони є.
- `output: "text"` обробляє stdout як фінальну відповідь.

Режими вводу:

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

Примітки щодо Gemini CLI JSON:

- Текст відповіді читається з поля JSON `response`.
- Usage береться зі `stats`, якщо `usage` відсутній або порожній.
- `stats.cached` нормалізується до OpenClaw `cacheRead`.
- Якщо `stats.input` відсутній, OpenClaw виводить кількість вхідних токенів із
  `stats.input_tokens - stats.cached`.

Перевизначайте лише за потреби (типовий випадок: абсолютний шлях `command`).

## Значення за замовчуванням, що належать Plugin

Значення за замовчуванням CLI-бекендів тепер є частиною поверхні Plugin:

- Plugins реєструють їх через `api.registerCliBackend(...)`.
- `id` бекенду стає префіксом провайдера в посиланнях на моделі.
- Конфігурація користувача в `agents.defaults.cliBackends.<id>` як і раніше перевизначає значення Plugin за замовчуванням.
- Очищення конфігурації, специфічне для бекенду, залишається у власності Plugin через необов’язковий
  hook `normalizeConfig`.

Plugins, яким потрібні малі шими сумісності prompt/повідомлень, можуть оголошувати
двоспрямовані текстові трансформації без заміни провайдера чи CLI-бекенду:

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

`input` переписує системний prompt і користувацький prompt, які передаються CLI. `output`
переписує стримінгові delta помічника і розібраний фінальний текст до того, як OpenClaw обробить
власні control markers і доставку в канал.

Для CLI, які виводять JSONL, сумісний із Claude Code stream-json, задайте
`jsonlDialect: "claude-stream-json"` у конфігурації цього бекенду.

## Bundle MCP overlays

CLI-бекенди **не** отримують виклики інструментів OpenClaw напряму, але бекенд може
увімкнути згенерований MCP config overlay через `bundleMcp: true`.

Поточна вбудована поведінка:

- `claude-cli`: згенерований строгий MCP config file
- `codex-cli`: вбудовані перевизначення конфігурації для `mcp_servers`
- `google-gemini-cli`: згенерований файл системних налаштувань Gemini

Коли bundle MCP увімкнено, OpenClaw:

- запускає loopback HTTP MCP-сервер, який відкриває інструменти Gateway для процесу CLI
- автентифікує міст за допомогою токена на рівні сеансу (`OPENCLAW_MCP_TOKEN`)
- обмежує доступ до інструментів поточним сеансом, акаунтом і контекстом каналу
- завантажує увімкнені bundle-MCP-сервери для поточного робочого простору
- об’єднує їх із наявною формою MCP-конфігурації/налаштувань бекенду
- переписує конфігурацію запуску з використанням режиму інтеграції, що належить бекенду з розширення-власника

Якщо жоден MCP-сервер не увімкнено, OpenClaw все одно вбудовує строгий config, коли
бекенд увімкнув bundle MCP, щоб фонові запуски залишалися ізольованими.

## Обмеження

- **Жодних прямих викликів інструментів OpenClaw.** OpenClaw не вбудовує виклики інструментів у
  протокол CLI-бекенду. Бекенди бачать інструменти Gateway лише тоді, коли вмикають
  `bundleMcp: true`.
- **Стримінг залежить від бекенду.** Деякі бекенди передають JSONL потоком; інші буферизують
  до завершення.
- **Структуровані виходи** залежать від JSON-формату CLI.
- **Сеанси Codex CLI** відновлюються через текстовий вивід (без JSONL), що менш
  структуровано, ніж початковий запуск `--json`. Сеанси OpenClaw при цьому, як і раніше, працюють
  нормально.

## Усунення проблем

- **CLI не знайдено**: задайте `command` як повний шлях.
- **Неправильна назва моделі**: використовуйте `modelAliases`, щоб зіставити `provider/model` → модель CLI.
- **Немає безперервності сеансу**: переконайтеся, що задано `sessionArg` і `sessionMode` не дорівнює
  `none` (Codex CLI наразі не може відновлюватися з JSON-виводом).
- **Зображення ігноруються**: задайте `imageArg` (і перевірте, що CLI підтримує шляхи до файлів).
