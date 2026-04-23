---
read_when:
    - Додавання або зміна Skills
    - Зміна правил фільтрації або завантаження Skills
summary: 'Skills: керовані чи робочого простору, правила фільтрації та прив’язка конфігурації/env'
title: Skills
x-i18n:
    generated_at: "2026-04-23T23:08:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw використовує папки Skills, сумісні з **[AgentSkills](https://agentskills.io)**, щоб навчати агента користуватися інструментами. Кожен Skill — це каталог, що містить `SKILL.md` з YAML frontmatter та інструкціями. OpenClaw завантажує **комплектні Skills** плюс необов’язкові локальні перевизначення й фільтрує їх під час завантаження на основі середовища, конфігурації та наявності бінарних файлів.

## Розташування та пріоритет

OpenClaw завантажує Skills з таких джерел:

1. **Додаткові папки Skills**: налаштовуються через `skills.load.extraDirs`
2. **Комплектні Skills**: постачаються разом з установленням (npm-пакет або OpenClaw.app)
3. **Керовані/локальні Skills**: `~/.openclaw/skills`
4. **Персональні Skills агента**: `~/.agents/skills`
5. **Skills агента проєкту**: `<workspace>/.agents/skills`
6. **Skills робочого простору**: `<workspace>/skills`

Якщо назви Skills конфліктують, пріоритет такий:

`<workspace>/skills` (найвищий) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → комплектні Skills → `skills.load.extraDirs` (найнижчий)

## Skills для окремого агента vs спільні Skills

У конфігураціях **multi-agent** кожен агент має власний робочий простір. Це означає:

- **Skills для окремого агента** розміщуються в `<workspace>/skills` лише для цього агента.
- **Skills агента проєкту** розміщуються в `<workspace>/.agents/skills` і застосовуються до
  цього робочого простору перед звичайною папкою `skills/` робочого простору.
- **Персональні Skills агента** розміщуються в `~/.agents/skills` і застосовуються до всіх
  робочих просторів на цій машині.
- **Спільні Skills** розміщуються в `~/.openclaw/skills` (керовані/локальні) і видимі
  **всім агентам** на цій самій машині.
- **Спільні папки** також можна додати через `skills.load.extraDirs` (найнижчий
  пріоритет), якщо ви хочете мати спільний набір Skills для кількох агентів.

Якщо один і той самий Skill із тією самою назвою існує в кількох місцях, діє звичайний пріоритет:
перемагає робочий простір, потім Skills агента проєкту, потім персональні Skills агента,
потім керовані/локальні, потім комплектні, потім extra dirs.

## Allowlist Skills для агента

**Розташування** Skill і **видимість** Skill — це окремі механізми керування.

- Розташування/пріоритет визначає, яка копія Skill з однаковою назвою перемагає.
- Allowlist агента визначає, які з видимих Skills агент реально може використовувати.

Використовуйте `agents.defaults.skills` для спільної бази, а потім перевизначайте для окремих агентів через
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює значення за замовчуванням
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

Правила:

- Не задавайте `agents.defaults.skills`, якщо за замовчуванням Skills не мають бути обмежені.
- Не задавайте `agents.list[].skills`, щоб успадкувати `agents.defaults.skills`.
- Установіть `agents.list[].skills: []`, щоб не було Skills.
- Непорожній список `agents.list[].skills` є фінальним набором для цього агента; він
  не зливається зі значеннями за замовчуванням.

OpenClaw застосовує фактичний набір Skills агента до побудови prompt,
виявлення slash-команд Skills, синхронізації sandbox і snapshot Skills.

## Plugins + Skills

Plugins можуть постачати власні Skills, указуючи каталоги `skills` у
`openclaw.plugin.json` (шляхи відносно кореня plugin). Skills plugin завантажуються,
коли plugin увімкнено. Сьогодні ці каталоги зливаються в той самий
шлях із низьким пріоритетом, що й `skills.load.extraDirs`, тож Skill із такою самою назвою з комплектного,
керованого, агентського або робочого простору перевизначає їх.
Ви можете фільтрувати їх через `metadata.openclaw.requires.config` у записі
конфігурації plugin. Див. [Plugins](/uk/tools/plugin) для виявлення/конфігурації і [Tools](/uk/tools) для
поверхні інструментів, якої навчають ці Skills.

## Skill Workshop

Необов’язковий, експериментальний plugin Skill Workshop може створювати або оновлювати Skills робочого простору
з повторно використовуваних процедур, помічених під час роботи агента. Його вимкнено за замовчуванням, і його потрібно явно ввімкнути через
`plugins.entries.skill-workshop`.

Skill Workshop записує лише в `<workspace>/skills`, сканує згенерований вміст,
підтримує очікування підтвердження або автоматичні безпечні записи, ізолює небезпечні
пропозиції та оновлює snapshot Skills після успішних записів, щоб нові
Skills могли ставати доступними без перезапуску Gateway.

Використовуйте його, коли хочете, щоб виправлення на кшталт “наступного разу перевіряй attribution GIF” або
важко здобуті workflow на кшталт чеклістів QA для медіа стали довговічними
процедурними інструкціями. Починайте з очікування підтвердження; використовуйте автоматичні записи
лише в довірених робочих просторах після перегляду його пропозицій. Повний посібник:
[Plugin Skill Workshop](/uk/plugins/skill-workshop).

## ClawHub (установлення + синхронізація)

ClawHub — це публічний реєстр Skills для OpenClaw. Переглянути можна на
[https://clawhub.ai](https://clawhub.ai). Використовуйте вбудовані команди `openclaw skills`,
щоб виявляти/установлювати/оновлювати Skills, або окремий CLI `clawhub`, коли
вам потрібні workflow публікації/синхронізації.
Повний посібник: [ClawHub](/uk/tools/clawhub).

Поширені потоки:

- Установити Skill у ваш робочий простір:
  - `openclaw skills install <skill-slug>`
- Оновити всі встановлені Skills:
  - `openclaw skills update --all`
- Синхронізувати (сканування + публікація оновлень):
  - `clawhub sync --all`

Вбудована команда `openclaw skills install` встановлює в активний каталог `skills/`
робочого простору. Окремий CLI `clawhub` також встановлює в `./skills` у
поточному робочому каталозі (або повертається до налаштованого робочого простору OpenClaw).
OpenClaw підхоплює це як `<workspace>/skills` у наступній сесії.

## Примітки щодо безпеки

- Ставтеся до сторонніх Skills як до **недовіреного коду**. Читайте їх перед увімкненням.
- Для недовірених вхідних даних і ризикованих інструментів віддавайте перевагу sandboxed-запускам. Див. [Sandboxing](/uk/gateway/sandboxing).
- Виявлення Skills у робочому просторі та додаткових каталогах приймає лише корені Skills і файли `SKILL.md`, чий розв’язаний realpath залишається в межах налаштованого кореня.
- Установлення залежностей Skill через Gateway (`skills.install`, initial setup і UI налаштувань Skills) запускають вбудований сканер небезпечного коду перед виконанням метаданих інсталятора. Результати рівня `critical` блокують за замовчуванням, якщо викликач явно не задасть небезпечне перевизначення; підозрілі результати все одно лише попереджають.
- `openclaw skills install <slug>` працює інакше: він завантажує папку Skill із ClawHub у робочий простір і не використовує вищезгаданий шлях метаданих інсталятора.
- `skills.entries.*.env` і `skills.entries.*.apiKey` вводять секрети в процес **хоста**
  для цього ходу агента (а не в sandbox). Не допускайте секретів у prompt і журналах.
- Для ширшої моделі загроз і чеклістів див. [Безпека](/uk/gateway/security).

## Формат (AgentSkills + сумісний з Pi)

`SKILL.md` має містити принаймні:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Примітки:

- Ми дотримуємося специфікації AgentSkills щодо структури/призначення.
- Парсер, який використовується вбудованим агентом, підтримує лише **однорядкові** ключі frontmatter.
- `metadata` має бути **однорядковим JSON-об’єктом**.
- Використовуйте `{baseDir}` в інструкціях, щоб посилатися на шлях до папки Skill.
- Необов’язкові ключі frontmatter:
  - `homepage` — URL, що відображається як “Website” в UI Skills на macOS (також підтримується через `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (типово: `true`). Коли `true`, Skill відкривається як slash-команда користувача.
  - `disable-model-invocation` — `true|false` (типово: `false`). Коли `true`, Skill виключається з prompt моделі (але все ще доступний через виклик користувачем).
  - `command-dispatch` — `tool` (необов’язково). Коли встановлено `tool`, slash-команда оминає модель і напряму диспетчеризується до інструмента.
  - `command-tool` — назва інструмента для виклику, коли встановлено `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (типово). Для диспетчеризації до інструмента пересилає рядок сирих аргументів до інструмента (без розбору на рівні core).

    Інструмент викликається з параметрами:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Фільтрація (фільтри під час завантаження)

OpenClaw **фільтрує Skills під час завантаження** за допомогою `metadata` (однорядковий JSON):

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

- `always: true` — завжди включати Skill (пропускає інші фільтри).
- `emoji` — необов’язковий emoji, який використовує UI Skills на macOS.
- `homepage` — необов’язковий URL, що показується як “Website” в UI Skills на macOS.
- `os` — необов’язковий список платформ (`darwin`, `linux`, `win32`). Якщо задано, Skill підходить лише для цих ОС.
- `requires.bins` — список; кожен елемент має існувати в `PATH`.
- `requires.anyBins` — список; у `PATH` має існувати хоча б один елемент.
- `requires.env` — список; env-змінна має існувати **або** бути наданою в конфігурації.
- `requires.config` — список шляхів `openclaw.json`, які мають бути truthy.
- `primaryEnv` — назва env-змінної, пов’язаної з `skills.entries.<name>.apiKey`.
- `install` — необов’язковий масив специфікацій інсталятора, який використовує UI Skills на macOS (brew/node/go/uv/download).

Примітка про sandboxing:

- `requires.bins` перевіряється на **хості** під час завантаження Skill.
- Якщо агент працює в sandbox, бінарний файл також має існувати **всередині контейнера**.
  Установіть його через `agents.defaults.sandbox.docker.setupCommand` (або через користувацький образ).
  `setupCommand` виконується один раз після створення контейнера.
  Установлення пакетів також потребує мережевого виходу, записуваної кореневої FS і користувача root у sandbox.
  Приклад: Skill `summarize` (`skills/summarize/SKILL.md`) потребує CLI `summarize`
  усередині контейнера sandbox, щоб працювати там.

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
- Установлення через Node враховують `skills.install.nodeManager` у `openclaw.json` (типово: npm; варіанти: npm/pnpm/yarn/bun).
  Це впливає лише на **установлення Skills**; runtime Gateway і далі має бути Node
  (Bun не рекомендується для WhatsApp/Telegram).
- Вибір інсталятора через Gateway орієнтується на пріоритети, а не лише на node:
  коли специфікації встановлення змішують типи, OpenClaw надає перевагу Homebrew, якщо
  увімкнено `skills.install.preferBrew` і існує `brew`, потім `uv`, потім
  налаштований node manager, а потім інші резервні варіанти, як-от `go` або `download`.
- Якщо кожна специфікація встановлення має тип `download`, OpenClaw показує всі варіанти завантаження
  замість зведення до одного бажаного інсталятора.
- Установлення Go: якщо `go` відсутній, а `brew` доступний, gateway спочатку встановлює Go через Homebrew і за можливості встановлює `GOBIN` у `bin` Homebrew.
- Установлення через download: `url` (обов’язково), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (типово: auto, якщо виявлено archive), `stripComponents`, `targetDir` (типово: `~/.openclaw/tools/<skillKey>`).

Якщо `metadata.openclaw` відсутнє, Skill завжди підходить (якщо тільки
його не вимкнено в конфігурації або не заблоковано через `skills.allowBundled` для комплектних Skills).

## Перевизначення конфігурації (`~/.openclaw/openclaw.json`)

Комплектні/керовані Skills можна вмикати/вимикати та постачати їм значення env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або plaintext-рядок
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

Якщо ви хочете стандартну генерацію/редагування зображень усередині самого OpenClaw, використовуйте основний
інструмент `image_generate` з `agents.defaults.imageGenerationModel` замість
комплектного Skill. Приклади Skills тут наведено для користувацьких або сторонніх workflow.

Для нативного аналізу зображень використовуйте інструмент `image` з `agents.defaults.imageModel`.
Для нативної генерації/редагування зображень використовуйте `image_generate` з
`agents.defaults.imageGenerationModel`. Якщо ви вибираєте `openai/*`, `google/*`,
`fal/*` або іншу image-модель певного provider, додайте також auth/API-ключ
цього provider.

Ключі конфігурації за замовчуванням збігаються з **назвою Skill**. Якщо Skill визначає
`metadata.openclaw.skillKey`, використовуйте цей ключ у `skills.entries`.

Правила:

- `enabled: false` вимикає Skill, навіть якщо він комплектний/встановлений.
- `env`: вводиться **лише якщо** змінна ще не задана в процесі.
- `apiKey`: зручний варіант для Skills, які оголошують `metadata.openclaw.primaryEnv`.
  Підтримує plaintext-рядок або об’єкт SecretRef (`{ source, provider, id }`).
- `config`: необов’язковий набір для користувацьких полів на рівні Skill; користувацькі ключі мають жити тут.
- `allowBundled`: необов’язковий allowlist лише для **комплектних** Skills. Якщо задано,
  підходять лише комплектні Skills зі списку (керовані/робочого простору Skills не зачіпаються).

## Ін’єкція середовища (для кожного запуску агента)

Коли починається запуск агента, OpenClaw:

1. Зчитує метадані Skill.
2. Застосовує будь-які `skills.entries.<key>.env` або `skills.entries.<key>.apiKey` до
   `process.env`.
3. Будує system prompt з **придатними** Skills.
4. Відновлює початкове середовище після завершення запуску.

Це **обмежено запуском агента**, а не глобальним середовищем оболонки.

Для комплектного backend `claude-cli` OpenClaw також матеріалізує той самий
придатний snapshot як тимчасовий plugin Claude Code і передає його через
`--plugin-dir`. Тоді Claude Code може використовувати власний нативний resolver Skills, тоді як
OpenClaw і далі володіє пріоритетами, allowlist для окремих агентів, фільтрацією та
ін’єкцією env/API-ключів `skills.entries.*`. Інші CLI-backend використовують
лише каталог prompt.

## Snapshot сесії (продуктивність)

OpenClaw створює snapshot придатних Skills **під час старту сесії** й повторно використовує цей список для наступних ходів у тій самій сесії. Зміни в Skills або конфігурації набувають чинності в наступній новій сесії.

Skills також можуть оновлюватися посеред сесії, коли ввімкнено спостерігач Skills або коли з’являється новий придатний віддалений node (див. нижче). Розглядайте це як **гаряче перезавантаження**: оновлений список буде підхоплено на наступному ході агента.

Якщо для цієї сесії змінюється фактичний allowlist Skills агента, OpenClaw
оновлює snapshot, щоб видимі Skills залишалися узгодженими з поточним
агентом.

## Віддалені macOS Node (Gateway на Linux)

Якщо Gateway працює на Linux, але підключено **macOS Node** **з дозволеним `system.run`** (безпека Exec approvals не встановлена в `deny`), OpenClaw може вважати Skills лише для macOS придатними, коли потрібні бінарні файли присутні на цьому node. Агент має виконувати такі Skills через інструмент `exec` з `host=node`.

Це спирається на те, що node повідомляє про підтримку команд і на перевірку бінарних файлів через `system.run`. Якщо macOS Node пізніше від’єднається, Skills залишаться видимими; виклики можуть завершуватися помилкою, доки node не перепідключиться.

## Спостерігач Skills (автооновлення)

За замовчуванням OpenClaw стежить за папками Skills і підвищує версію snapshot Skills, коли змінюються файли `SKILL.md`. Це налаштовується в `skills.load`:

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

Коли Skills придатні, OpenClaw вводить у system prompt компактний XML-список доступних Skills (через `formatSkillsForPrompt` у `pi-coding-agent`). Вартість є детермінованою:

- **Базовий overhead (лише коли є ≥1 Skill):** 195 символів.
- **На кожен Skill:** 97 символів + довжина XML-escaped значень `<name>`, `<description>` і `<location>`.

Формула (символи):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Примітки:

- XML-escaping розширює `& < > " '` до сутностей (`&amp;`, `&lt;` тощо), збільшуючи довжину.
- Кількість токенів залежить від tokenizer моделі. Груба оцінка в стилі OpenAI — ~4 символи на токен, тож **97 символів ≈ 24 токени** на Skill плюс фактична довжина ваших полів.

## Життєвий цикл керованих Skills

OpenClaw постачає базовий набір Skills як **комплектні Skills** у складі
встановлення (npm-пакет або OpenClaw.app). `~/.openclaw/skills` існує для локальних
перевизначень (наприклад, закріплення/патчування Skill без зміни комплектної
копії). Skills робочого простору належать користувачу й перевизначають обидва варіанти у разі конфлікту назв.

## Довідка з конфігурації

Див. [Конфігурація Skills](/uk/tools/skills-config), щоб переглянути повну схему конфігурації.

## Шукаєте більше Skills?

Перегляньте [https://clawhub.ai](https://clawhub.ai).

---

## Пов’язано

- [Створення Skills](/uk/tools/creating-skills) — створення користувацьких Skills
- [Конфігурація Skills](/uk/tools/skills-config) — довідка з конфігурації Skills
- [Slash-команди](/uk/tools/slash-commands) — усі доступні slash-команди
- [Plugins](/uk/tools/plugin) — огляд системи plugin
