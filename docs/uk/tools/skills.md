---
read_when:
    - Додавання або змінення Skills
    - Змінення правил гейтінгу або завантаження Skills
summary: 'Skills: керовані чи робочого простору, правила гейтінгу та налаштування config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-10T12:46:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1eaf130966950b6eb24f859d9a77ecbf81c6cb80deaaa6a3a79d2c16d83115d
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw використовує папки skill, **сумісні з [AgentSkills](https://agentskills.io)**, щоб навчати агента користуватися інструментами. Кожен skill — це каталог, що містить `SKILL.md` із YAML frontmatter та інструкціями. OpenClaw завантажує **вбудовані skills** разом з необов’язковими локальними перевизначеннями та фільтрує їх під час завантаження на основі середовища, конфігурації та наявності бінарних файлів.

## Розташування та пріоритет

OpenClaw завантажує skills із таких джерел:

1. **Додаткові папки skills**: налаштовуються через `skills.load.extraDirs`
2. **Вбудовані skills**: постачаються разом з інсталяцією (npm package або OpenClaw.app)
3. **Керовані/локальні skills**: `~/.openclaw/skills`
4. **Особисті agent skills**: `~/.agents/skills`
5. **Project agent skills**: `<workspace>/.agents/skills`
6. **Skills робочого простору**: `<workspace>/skills`

Якщо назва skill конфліктує, пріоритет такий:

`<workspace>/skills` (найвищий) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані skills → `skills.load.extraDirs` (найнижчий)

## Skills для окремого агента та спільні skills

У конфігураціях **multi-agent** кожен агент має власний робочий простір. Це означає:

- **Skills для окремого агента** розміщуються в `<workspace>/skills` лише для цього агента.
- **Project agent skills** розміщуються в `<workspace>/.agents/skills` і застосовуються до цього робочого простору перед звичайною папкою `skills/` робочого простору.
- **Особисті agent skills** розміщуються в `~/.agents/skills` і застосовуються в усіх робочих просторах на цій машині.
- **Спільні skills** розміщуються в `~/.openclaw/skills` (керовані/локальні) і видимі **всім агентам** на цій самій машині.
- **Спільні папки** також можна додати через `skills.load.extraDirs` (найнижчий пріоритет), якщо ви хочете мати спільний набір skills, який використовується кількома агентами.

Якщо одна й та сама назва skill існує в кількох місцях, діє звичайний пріоритет: перемагає workspace, потім project agent skills, потім personal agent skills, потім managed/local, потім bundled, потім extra dirs.

## Allowlist skills для агентів

**Розташування** skill і **видимість** skill — це окремі механізми керування.

- Розташування/пріоритет визначає, яка копія skill з однаковою назвою перемагає.
- Allowlist агента визначає, які видимі skills агент фактично може використовувати.

Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте для окремих агентів через `agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює defaults
      { id: "locked-down", skills: [] }, // без skills
    ],
  },
}
```

Правила:

- Пропустіть `agents.defaults.skills`, якщо за замовчуванням skills не мають бути обмежені.
- Пропустіть `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
- Установіть `agents.list[].skills: []`, щоб не дозволити жодних skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він не об’єднується з defaults.

OpenClaw застосовує ефективний набір skills агента до побудови prompt, виявлення slash-command skill, синхронізації sandbox і snapshot skill.

## Plugins + skills

Plugins можуть постачати власні skills, вказуючи каталоги `skills` у
`openclaw.plugin.json` (шляхи відносно кореня plugin). Skills plugin завантажуються,
коли plugin увімкнено. Зараз ці каталоги об’єднуються в той самий шлях із
низьким пріоритетом, що й `skills.load.extraDirs`, тому однойменний bundled,
managed, agent або workspace skill перевизначає їх.
Ви можете обмежувати їх через `metadata.openclaw.requires.config` у записі
конфігурації plugin. Див. [Plugins](/uk/tools/plugin) для виявлення/конфігурації та [Tools](/uk/tools) для
поверхні інструментів, які пояснюють ці skills.

## ClawHub (інсталяція + синхронізація)

ClawHub — це публічний реєстр skills для OpenClaw. Переглянути його можна на
[https://clawhub.ai](https://clawhub.ai). Використовуйте рідні команди `openclaw skills`
для пошуку/інсталяції/оновлення skills або окремий CLI `clawhub`, якщо вам
потрібні робочі процеси публікації/синхронізації.
Повний посібник: [ClawHub](/uk/tools/clawhub).

Поширені сценарії:

- Інсталювати skill у ваш робочий простір:
  - `openclaw skills install <skill-slug>`
- Оновити всі інстальовані skills:
  - `openclaw skills update --all`
- Синхронізувати (сканування + публікація оновлень):
  - `clawhub sync --all`

Рідна команда `openclaw skills install` інсталює у каталог `skills/` активного робочого простору. Окремий CLI `clawhub` також інсталює у `./skills` у вашому
поточному робочому каталозі (або використовує налаштований робочий простір OpenClaw як резервний варіант).
Під час наступної сесії OpenClaw розпізнає це як `<workspace>/skills`.

## Примітки щодо безпеки

- Ставтеся до сторонніх skills як до **ненадійного коду**. Читайте їх перед увімкненням.
- Для ненадійних вхідних даних і ризикованих інструментів надавайте перевагу запуску в sandbox. Див. [Sandboxing](/uk/gateway/sandboxing).
- Виявлення skills у workspace та extra-dir приймає лише корені skill і файли `SKILL.md`, чий визначений `realpath` залишається всередині налаштованого кореня.
- Інсталяції залежностей skills через gateway (`skills.install`, onboarding і UI налаштувань Skills) запускають вбудований сканер небезпечного коду перед виконанням метаданих інсталятора. Знахідки `critical` блокуються за замовчуванням, якщо викликач явно не встановить dangerous override; підозрілі знахідки, як і раніше, лише попереджають.
- `openclaw skills install <slug>` — це інше: команда завантажує папку skill з ClawHub у робочий простір і не використовує шлях метаданих інсталятора, описаний вище.
- `skills.entries.*.env` і `skills.entries.*.apiKey` ін’єктують секрети в процес **host**
  для цього ходу агента (не в sandbox). Не допускайте потрапляння секретів у prompts і логи.
- Для ширшої моделі загроз і контрольних списків див. [Security](/uk/gateway/security).

## Формат (сумісний з AgentSkills + Pi)

`SKILL.md` має містити щонайменше:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Примітки:

- Ми дотримуємося специфікації AgentSkills щодо структури та призначення.
- Парсер, який використовує вбудований агент, підтримує лише **однорядкові** ключі frontmatter.
- `metadata` має бути **однорядковим JSON object**.
- Використовуйте `{baseDir}` в інструкціях, щоб посилатися на шлях до папки skill.
- Необов’язкові ключі frontmatter:
  - `homepage` — URL, що відображається як “Website” в macOS Skills UI (також підтримується через `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (типове значення: `true`). Якщо `true`, skill доступний як slash command користувача.
  - `disable-model-invocation` — `true|false` (типове значення: `false`). Якщо `true`, skill виключається з model prompt (але все ще доступний через виклик користувачем).
  - `command-dispatch` — `tool` (необов’язково). Якщо встановлено `tool`, slash command оминає model і напряму передається інструменту.
  - `command-tool` — назва інструменту, який потрібно викликати, якщо встановлено `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (типове значення). Для dispatch інструмента передає рядок сирих аргументів інструменту (без розбору на рівні core).

    Інструмент викликається з параметрами:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Гейтінг (фільтри під час завантаження)

OpenClaw **фільтрує skills під час завантаження** за допомогою `metadata` (однорядковий JSON):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Поля в `metadata.openclaw`:

- `always: true` — завжди включати skill (пропустити інші умови).
- `emoji` — необов’язковий emoji, який використовується в macOS Skills UI.
- `homepage` — необов’язковий URL, що відображається як “Website” в macOS Skills UI.
- `os` — необов’язковий список платформ (`darwin`, `linux`, `win32`). Якщо встановлено, skill доступний лише на цих ОС.
- `requires.bins` — список; кожен має існувати в `PATH`.
- `requires.anyBins` — список; принаймні один має існувати в `PATH`.
- `requires.env` — список; змінна середовища має існувати **або** бути надана в config.
- `requires.config` — список шляхів `openclaw.json`, які мають бути truthy.
- `primaryEnv` — назва змінної середовища, пов’язаної з `skills.entries.<name>.apiKey`.
- `install` — необов’язковий масив специфікацій інсталятора, який використовує macOS Skills UI (brew/node/go/uv/download).

Примітка щодо sandboxing:

- `requires.bins` перевіряється на **host** під час завантаження skill.
- Якщо агент працює в sandbox, бінарний файл також має існувати **всередині контейнера**.
  Інсталюйте його через `agents.defaults.sandbox.docker.setupCommand` (або через власний образ).
  `setupCommand` запускається один раз після створення контейнера.
  Для інсталяції пакетів також потрібні вихід у мережу, записувана root FS і користувач root у sandbox.
  Приклад: skill `summarize` (`skills/summarize/SKILL.md`) потребує `summarize` CLI
  у контейнері sandbox, щоб працювати там.

Приклад інсталятора:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Примітки:

- Якщо вказано кілька інсталяторів, gateway вибирає **один** бажаний варіант (brew, якщо доступний, інакше node).
- Якщо всі інсталятори мають тип `download`, OpenClaw показує кожен запис, щоб ви могли бачити доступні артефакти.
- Специфікації інсталятора можуть містити `os: ["darwin"|"linux"|"win32"]`, щоб фільтрувати варіанти за платформою.
- Node-інсталяції враховують `skills.install.nodeManager` у `openclaw.json` (типово: npm; варіанти: npm/pnpm/yarn/bun).
  Це впливає лише на **інсталяції skills**; середовище виконання Gateway, як і раніше, має бути Node
  (Bun не рекомендується для WhatsApp/Telegram).
- Вибір інсталятора через gateway залежить від пріоритетів, а не лише від node:
  коли специфікації інсталяції змішують різні типи, OpenClaw надає перевагу Homebrew, якщо
  увімкнено `skills.install.preferBrew` і існує `brew`, потім `uv`, потім
  налаштований node manager, а далі інші резервні варіанти, як-от `go` або `download`.
- Якщо кожна специфікація інсталяції має тип `download`, OpenClaw показує всі варіанти завантаження
  замість зведення до одного бажаного інсталятора.
- Go-інсталяції: якщо `go` відсутній, а `brew` доступний, gateway спочатку інсталює Go через Homebrew і за можливості встановлює `GOBIN` у `bin` Homebrew.
- Download-інсталяції: `url` (обов’язково), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (типово: автоматично, якщо виявлено archive), `stripComponents`, `targetDir` (типово: `~/.openclaw/tools/<skillKey>`).

Якщо `metadata.openclaw` відсутній, skill завжди вважається допустимим (якщо
його не вимкнено в config і якщо його не блокує `skills.allowBundled` для вбудованих skills).

## Перевизначення config (`~/.openclaw/openclaw.json`)

Вбудовані/керовані skills можна вмикати або вимикати та передавати їм значення env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Примітка: якщо назва skill містить дефіси, візьміть ключ у лапки (JSON5 дозволяє ключі в лапках).

Якщо вам потрібна стандартна генерація/редагування зображень безпосередньо в OpenClaw, використовуйте core-інструмент
`image_generate` разом з `agents.defaults.imageGenerationModel`, а не
вбудований skill. Наведені тут приклади skill призначені для користувацьких або сторонніх робочих процесів.

Для нативного аналізу зображень використовуйте інструмент `image` разом з `agents.defaults.imageModel`.
Для нативної генерації/редагування зображень використовуйте `image_generate` разом з
`agents.defaults.imageGenerationModel`. Якщо ви вибираєте `openai/*`, `google/*`,
`fal/*` або іншу модель зображень, прив’язану до конкретного провайдера, також додайте auth/API
key цього провайдера.

Ключі config за замовчуванням відповідають **назві skill**. Якщо skill визначає
`metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`.

Правила:

- `enabled: false` вимикає skill, навіть якщо він вбудований/інстальований.
- `env`: ін’єктується **лише якщо** змінна ще не встановлена в процесі.
- `apiKey`: зручний варіант для skills, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує plaintext string або об’єкт SecretRef (`{ source, provider, id }`).
- `config`: необов’язковий набір для користувацьких полів конкретного skill; користувацькі ключі мають розміщуватися тут.
- `allowBundled`: необов’язковий allowlist лише для **вбудованих** skills. Якщо його задано, допустимими є лише
  вбудовані skills зі списку (керовані/skills робочого простору не зачіпаються).

## Ін’єкція середовища (для кожного запуску агента)

Коли починається запуск агента, OpenClaw:

1. Зчитує метадані skill.
2. Застосовує будь-які `skills.entries.<key>.env` або `skills.entries.<key>.apiKey` до
   `process.env`.
3. Будує системний prompt з **допустимими** skills.
4. Відновлює початкове середовище після завершення запуску.

Це **обмежено запуском агента**, а не є глобальним середовищем shell.

Для вбудованого backend `claude-cli` OpenClaw також матеріалізує той самий
знімок допустимих skills як тимчасовий плагін Claude Code і передає його через
`--plugin-dir`. Тоді Claude Code може використовувати власний вбудований resolver skill, тоді як
OpenClaw усе ще керує пріоритетом, allowlist для окремих агентів, гейтінгом і
ін’єкцією env/API key через `skills.entries.*`. Інші CLI backend використовують лише каталог prompt.

## Знімок сесії (продуктивність)

OpenClaw створює знімок допустимих skills **коли починається сесія** і повторно використовує цей список для наступних ходів у межах тієї самої сесії. Зміни в skills або config набувають чинності під час наступної нової сесії.

Skills також можуть оновлюватися посеред сесії, коли ввімкнено watcher skills або коли з’являється новий допустимий віддалений вузол (див. нижче). Думайте про це як про **гаряче перезавантаження**: оновлений список буде підхоплено під час наступного ходу агента.

Якщо ефективний allowlist skills агента змінюється для цієї сесії, OpenClaw
оновлює знімок, щоб видимі skills залишалися узгодженими з поточним
агентом.

## Віддалені вузли macOS (Linux gateway)

Якщо Gateway запущено на Linux, але підключено **вузол macOS** **з дозволеним `system.run`** (параметр безпеки Exec approvals не встановлено в `deny`), OpenClaw може вважати допустимими skills лише для macOS, якщо потрібні бінарні файли присутні на цьому вузлі. Агент має виконувати такі skills через інструмент `exec` з `host=node`.

Це спирається на те, що вузол повідомляє про підтримку команд, а також на перевірку бінарних файлів через `system.run`. Якщо вузол macOS пізніше переходить в офлайн, skills залишаються видимими; виклики можуть завершуватися помилкою, доки вузол знову не підключиться.

## Watcher skills (автооновлення)

За замовчуванням OpenClaw відстежує папки skills і оновлює знімок skills, коли змінюються файли `SKILL.md`. Це налаштовується в `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Вплив на токени (список skills)

Коли skills допустимі, OpenClaw ін’єктує компактний XML-список доступних skills у системний prompt (через `formatSkillsForPrompt` у `pi-coding-agent`). Вартість детермінована:

- **Базові накладні витрати (лише коли ≥1 skill):** 195 символів.
- **Для кожного skill:** 97 символів + довжина XML-екранованих значень `<name>`, `<description>` і `<location>`.

Формула (символи):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Примітки:

- XML-екранування розширює `& < > " '` до сутностей (`&amp;`, `&lt;` тощо), збільшуючи довжину.
- Кількість токенів залежить від tokenizer моделі. Груба оцінка в стилі OpenAI — приблизно 4 символи/токен, тож **97 символів ≈ 24 токени** на skill плюс фактична довжина ваших полів.

## Життєвий цикл керованих skills

OpenClaw постачається з базовим набором skills як **вбудовані skills** у складі
інсталяції (npm package або OpenClaw.app). `~/.openclaw/skills` існує для локальних
перевизначень (наприклад, щоб зафіксувати/пропатчити skill без зміни вбудованої
копії). Skills робочого простору належать користувачу й перевизначають обидва варіанти при конфліктах назв.

## Довідник config

Див. [Skills config](/uk/tools/skills-config), щоб переглянути повну схему конфігурації.

## Шукаєте більше skills?

Перегляньте [https://clawhub.ai](https://clawhub.ai).

---

## Пов’язане

- [Creating Skills](/uk/tools/creating-skills) — створення користувацьких skills
- [Skills Config](/uk/tools/skills-config) — довідник із конфігурації skills
- [Slash Commands](/uk/tools/slash-commands) — усі доступні slash commands
- [Plugins](/uk/tools/plugin) — огляд системи plugin
