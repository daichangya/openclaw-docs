---
read_when:
    - Додавання або зміна Skills
    - Зміна gating Skills або правил завантаження
summary: 'Skills: керовані чи workspace, правила gating та підключення config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-05T18:21:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw використовує папки Skills, **сумісні з [AgentSkills](https://agentskills.io)**, щоб навчати агента користуватися інструментами. Кожна Skill — це каталог, що містить `SKILL.md` із YAML frontmatter та інструкціями. OpenClaw завантажує **вбудовані Skills** плюс необов’язкові локальні перевизначення та фільтрує їх під час завантаження на основі середовища, config і наявності бінарних файлів.

## Розташування та пріоритет

OpenClaw завантажує Skills з таких джерел:

1. **Додаткові папки Skills**: налаштовуються через `skills.load.extraDirs`
2. **Вбудовані Skills**: постачаються разом із встановленням (npm package або OpenClaw.app)
3. **Керовані/локальні Skills**: `~/.openclaw/skills`
4. **Персональні Skills агента**: `~/.agents/skills`
5. **Skills агента проєкту**: `<workspace>/.agents/skills`
6. **Skills workspace**: `<workspace>/skills`

Якщо назви Skills конфліктують, пріоритет такий:

`<workspace>/skills` (найвищий) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані Skills → `skills.load.extraDirs` (найнижчий)

## Skills для окремого агента чи спільні Skills

У конфігураціях **з кількома агентами** кожен агент має власний workspace. Це означає:

- **Skills для окремого агента** знаходяться в `<workspace>/skills` лише для цього агента.
- **Skills агента проєкту** знаходяться в `<workspace>/.agents/skills` і застосовуються до
  цього workspace перед звичайною папкою `skills/` workspace.
- **Персональні Skills агента** знаходяться в `~/.agents/skills` і застосовуються в усіх
  workspace на цій машині.
- **Спільні Skills** знаходяться в `~/.openclaw/skills` (керовані/локальні) і видимі
  **усім агентам** на цій самій машині.
- **Спільні папки** також можна додати через `skills.load.extraDirs` (найнижчий
  пріоритет), якщо ви хочете мати спільний пакет Skills для кількох агентів.

Якщо одна й та сама назва Skill існує в кількох місцях, застосовується звичайний
пріоритет: workspace перемагає, далі Skills агента проєкту, потім персональні Skills агента,
потім керовані/локальні, потім вбудовані, потім extra dirs.

## Allowlist Skills для агента

**Розташування** Skill і **видимість** Skill — це окремі механізми керування.

- Розташування/пріоритет визначає, яка копія Skill з однаковою назвою перемагає.
- Allowlist агента визначає, які видимі Skills агент реально може використовувати.

Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте для окремого агента через
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює типові значення
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

Правила:

- Не задавайте `agents.defaults.skills`, щоб типово не обмежувати Skills.
- Не задавайте `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
- Установіть `agents.list[].skills: []`, щоб не було жодних Skills.
- Непорожній список `agents.list[].skills` — це остаточний набір для цього агента; він
  не об’єднується з типовими значеннями.

OpenClaw застосовує ефективний набір Skills агента під час побудови prompt, виявлення
slash-команд Skills, синхронізації sandbox і знімків Skills.

## Plugins + Skills

Plugins можуть постачати власні Skills, перелічуючи каталоги `skills` у
`openclaw.plugin.json` (шляхи відносно кореня plugin). Skills plugin завантажуються,
коли plugin увімкнено. Сьогодні ці каталоги об’єднуються в той самий
шлях із низьким пріоритетом, що й `skills.load.extraDirs`, тож Skill з такою самою назвою з bundled,
managed, agent або workspace перевизначає їх.
Ви можете керувати ними через `metadata.openclaw.requires.config` на записі config
plugin. Див. [Plugins](/tools/plugin) для виявлення/config і [Tools](/tools) для
поверхні інструментів, якої навчають ці Skills.

## ClawHub (встановлення + синхронізація)

ClawHub — це публічний реєстр Skills для OpenClaw. Перегляд:
[https://clawhub.ai](https://clawhub.ai). Використовуйте нативні команди `openclaw skills`
для пошуку/встановлення/оновлення Skills або окремий CLI `clawhub`, коли
потрібні процеси publish/sync.
Повний посібник: [ClawHub](/tools/clawhub).

Типові сценарії:

- Встановити Skill у свій workspace:
  - `openclaw skills install <skill-slug>`
- Оновити всі встановлені Skills:
  - `openclaw skills update --all`
- Синхронізувати (сканування + publish оновлень):
  - `clawhub sync --all`

Нативна команда `openclaw skills install` встановлює в каталог `skills/` активного workspace.
Окремий CLI `clawhub` також встановлює в `./skills` у вашому
поточному робочому каталозі (або використовує налаштований workspace OpenClaw як запасний варіант).
OpenClaw підхопить це як `<workspace>/skills` у наступній сесії.

## Примітки щодо безпеки

- Ставтеся до сторонніх Skills як до **ненадійного коду**. Читайте їх перед увімкненням.
- Для ненадійних вхідних даних і ризикованих інструментів надавайте перевагу запуску в sandbox. Див. [Sandboxing](/uk/gateway/sandboxing).
- Виявлення Skills у workspace та extra-dir приймає лише корені Skills і файли `SKILL.md`, чий резольвлений realpath залишається в межах налаштованого кореня.
- Встановлення залежностей Skills через Gateway (`skills.install`, onboarding і UI налаштувань Skills) запускають вбудований сканер небезпечного коду перед виконанням метаданих інсталятора. Знахідки рівня `critical` блокуються типово, якщо викликач явно не задав dangerous override; підозрілі знахідки все ще лише попереджають.
- `openclaw skills install <slug>` — це інше: команда завантажує папку Skill із ClawHub у workspace й не використовує описаний вище шлях метаданих інсталятора.
- `skills.entries.*.env` і `skills.entries.*.apiKey` ін’єктують секрети в **host** process
  для цього ходу агента (а не в sandbox). Тримайте секрети поза prompt і журналами.
- Для ширшої моделі загроз і контрольних списків див. [Security](/uk/gateway/security).

## Формат (AgentSkills + сумісний із Pi)

`SKILL.md` має містити щонайменше:

```markdown
---
name: image-lab
description: Генерація або редагування зображень через workflow зображень на основі провайдера
---
```

Примітки:

- Ми дотримуємося специфікації AgentSkills щодо структури/призначення.
- Парсер, який використовує вбудований агент, підтримує лише **однорядкові** ключі frontmatter.
- `metadata` має бути **однорядковим JSON-об’єктом**.
- Використовуйте `{baseDir}` в інструкціях, щоб посилатися на шлях до папки Skill.
- Необов’язкові ключі frontmatter:
  - `homepage` — URL, який показується як “Website” у UI Skills для macOS (також підтримується через `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (типово: `true`). Якщо `true`, Skill доступна як slash-команда користувача.
  - `disable-model-invocation` — `true|false` (типово: `false`). Якщо `true`, Skill виключається з prompt моделі (але все ще доступна через виклик користувачем).
  - `command-dispatch` — `tool` (необов’язково). Якщо встановлено `tool`, slash-команда оминає модель і напряму диспетчеризується до інструмента.
  - `command-tool` — назва інструмента для виклику, коли встановлено `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (типово). Для dispatch до інструмента передає сирий рядок args до інструмента (без парсингу core).

    Інструмент викликається з параметрами:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (фільтри під час завантаження)

OpenClaw **фільтрує Skills під час завантаження** за допомогою `metadata` (однорядковий JSON):

```markdown
---
name: image-lab
description: Генерація або редагування зображень через workflow зображень на основі провайдера
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

- `always: true` — завжди включати Skill (пропустити інші бар’єри).
- `emoji` — необов’язковий emoji, який використовується в UI Skills для macOS.
- `homepage` — необов’язковий URL, який показується як “Website” у UI Skills для macOS.
- `os` — необов’язковий список платформ (`darwin`, `linux`, `win32`). Якщо задано, Skill доступна лише на цих ОС.
- `requires.bins` — список; кожен бінарний файл має існувати в `PATH`.
- `requires.anyBins` — список; у `PATH` має існувати хоча б один.
- `requires.env` — список; env-змінна має існувати **або** бути надана в config.
- `requires.config` — список шляхів `openclaw.json`, які мають мати truthy-значення.
- `primaryEnv` — назва env-змінної, пов’язаної з `skills.entries.<name>.apiKey`.
- `install` — необов’язковий масив специфікацій інсталятора, який використовується в UI Skills для macOS (brew/node/go/uv/download).

Примітка про sandboxing:

- `requires.bins` перевіряється на **хості** під час завантаження Skill.
- Якщо агент працює в sandbox, бінарний файл також має існувати **всередині контейнера**.
  Установіть його через `agents.defaults.sandbox.docker.setupCommand` (або власний образ).
  `setupCommand` запускається один раз після створення контейнера.
  Встановлення пакетів також потребує мережевого egress, записуваної root FS і користувача root у sandbox.
  Приклад: Skill `summarize` (`skills/summarize/SKILL.md`) потребує CLI `summarize`
  у контейнері sandbox, щоб працювати там.

Приклад інсталятора:

```markdown
---
name: gemini
description: Використовуйте Gemini CLI для допомоги з кодуванням і пошуку в Google.
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
              "label": "Установити Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Примітки:

- Якщо перелічено кілька інсталяторів, gateway вибирає **один** бажаний варіант (brew, якщо доступний, інакше node).
- Якщо всі інсталятори мають тип `download`, OpenClaw перелічує кожен запис, щоб ви могли бачити доступні артефакти.
- Специфікації інсталятора можуть містити `os: ["darwin"|"linux"|"win32"]`, щоб фільтрувати варіанти за платформою.
- Встановлення через Node враховують `skills.install.nodeManager` в `openclaw.json` (типово: npm; варіанти: npm/pnpm/yarn/bun).
  Це впливає лише на **встановлення Skills**; runtime Gateway усе одно має бути на Node
  (Bun не рекомендується для WhatsApp/Telegram).
- Вибір інсталятора через Gateway ґрунтується на пріоритетах, а не лише на node:
  коли специфікації встановлення змішують різні типи, OpenClaw надає перевагу Homebrew, якщо
  увімкнено `skills.install.preferBrew` і доступний `brew`, потім `uv`, потім
  налаштованому node manager, а потім іншим запасним варіантам, як-от `go` або `download`.
- Якщо кожна специфікація встановлення має тип `download`, OpenClaw показує всі варіанти завантаження
  замість згортання до одного бажаного інсталятора.
- Встановлення Go: якщо `go` відсутній і доступний `brew`, gateway спочатку встановлює Go через Homebrew і задає `GOBIN` у `bin` Homebrew, коли це можливо.
- Встановлення через download: `url` (обов’язково), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (типово: auto, коли виявлено archive), `stripComponents`, `targetDir` (типово: `~/.openclaw/tools/<skillKey>`).

Якщо `metadata.openclaw` відсутнє, Skill завжди доступна (якщо її не
вимкнено в config і якщо вона не заблокована через `skills.allowBundled` для bundled Skills).

## Перевизначення config (`~/.openclaw/openclaw.json`)

Вбудовані/керовані Skills можна вмикати/вимикати та надавати їм env-значення:

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

Примітка: якщо назва Skill містить дефіси, беріть ключ у лапки (JSON5 дозволяє ключі в лапках).

Якщо вам потрібна стандартна генерація/редагування зображень усередині самого OpenClaw, використовуйте core-інструмент
`image_generate` з `agents.defaults.imageGenerationModel` замість
bundled Skill. Приклади Skills тут призначені для власних або сторонніх workflows.

Для нативного аналізу зображень використовуйте інструмент `image` з `agents.defaults.imageModel`.
Для нативної генерації/редагування зображень використовуйте `image_generate` з
`agents.defaults.imageGenerationModel`. Якщо ви вибираєте `openai/*`, `google/*`,
`fal/*` або іншу provider-специфічну модель зображень, також додайте auth/API
key цього провайдера.

Ключі config типово відповідають **назві Skill**. Якщо Skill визначає
`metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`.

Правила:

- `enabled: false` вимикає Skill, навіть якщо вона bundled/встановлена.
- `env`: ін’єктується **лише якщо** змінну ще не задано в process.
- `apiKey`: зручний варіант для Skills, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує plaintext string або об’єкт SecretRef (`{ source, provider, id }`).
- `config`: необов’язковий набір для користувацьких полів конкретної Skill; користувацькі ключі мають жити тут.
- `allowBundled`: необов’язковий allowlist **лише для bundled** Skills. Якщо задано,
  доступними будуть лише bundled Skills зі списку (керовані/workspace Skills це не зачіпає).

## Ін’єкція середовища (для кожного запуску агента)

Коли запускається агент, OpenClaw:

1. Зчитує метадані Skill.
2. Застосовує будь-які `skills.entries.<key>.env` або `skills.entries.<key>.apiKey` до
   `process.env`.
3. Будує system prompt з **доступними** Skills.
4. Відновлює початкове середовище після завершення запуску.

Це має **область дії запуску агента**, а не глобального shell-середовища.

## Знімок сесії (продуктивність)

OpenClaw створює знімок доступних Skills **на момент початку сесії** і повторно використовує цей список для наступних ходів у тій самій сесії. Зміни Skills або config починають діяти з наступної нової сесії.

Skills також можуть оновлюватися посеред сесії, коли ввімкнено спостерігач Skills або коли з’являється нова доступна віддалена node (див. нижче). Думайте про це як про **гаряче перезавантаження**: оновлений список підхоплюється на наступному ході агента.

Якщо для цієї сесії змінюється ефективний allowlist Skills агента, OpenClaw
оновлює знімок, щоб видимі Skills залишалися узгодженими з поточним
агентом.

## Віддалені macOS node (Linux gateway)

Якщо Gateway працює на Linux, але підключено **macOS node** **з дозволеним `system.run`** (безпека Exec approvals не встановлена в `deny`), OpenClaw може вважати Skills лише для macOS доступними, коли потрібні бінарні файли є на цій node. Агент має виконувати ці Skills через інструмент `exec` з `host=node`.

Це спирається на те, що node повідомляє про підтримку команд і на перевірку бінарних файлів через `system.run`. Якщо macOS node пізніше від’єднається, Skills залишаться видимими; виклики можуть не працювати, доки node знову не підключиться.

## Спостерігач Skills (автооновлення)

Типово OpenClaw спостерігає за папками Skills і оновлює знімок Skills, коли змінюються файли `SKILL.md`. Налаштовується в `skills.load`:

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

## Вплив на токени (список Skills)

Коли Skills доступні, OpenClaw ін’єктує компактний XML-список доступних Skills у system prompt (через `formatSkillsForPrompt` у `pi-coding-agent`). Вартість детермінована:

- **Базові накладні витрати (лише коли ≥1 Skill):** 195 символів.
- **На кожну Skill:** 97 символів + довжина XML-екранованих значень `<name>`, `<description>` і `<location>`.

Формула (символи):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Примітки:

- XML-екранування розширює `& < > " '` у сутності (`&amp;`, `&lt;` тощо), збільшуючи довжину.
- Кількість токенів залежить від токенізатора моделі. Груба оцінка в стилі OpenAI — ~4 символи/токен, тобто **97 символів ≈ 24 токени** на Skill плюс фактична довжина ваших полів.

## Життєвий цикл керованих Skills

OpenClaw постачає базовий набір Skills як **bundled Skills** у складі
встановлення (npm package або OpenClaw.app). `~/.openclaw/skills` існує для локальних
перевизначень (наприклад, pinning/patching Skill без змін
bundled-копії). Skills workspace належать користувачу й перевизначають обидва варіанти при конфліктах назв.

## Довідник config

Повну схему config див. у [Skills config](/tools/skills-config).

## Шукаєте більше Skills?

Перегляньте [https://clawhub.ai](https://clawhub.ai).

---

## Пов’язане

- [Створення Skills](/tools/creating-skills) — створення власних Skills
- [Skills Config](/tools/skills-config) — довідник конфігурації Skills
- [Slash Commands](/tools/slash-commands) — усі доступні slash-команди
- [Plugins](/tools/plugin) — огляд системи plugins
