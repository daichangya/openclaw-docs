---
read_when:
    - Додавання або зміна config Skills
    - Налаштування вбудованого allowlist або поведінки встановлення
summary: Схема config Skills і приклади
title: Config Skills
x-i18n:
    generated_at: "2026-04-23T23:08:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

Більшість конфігурації завантаження/встановлення Skills міститься в `skills` у
`~/.openclaw/openclaw.json`. Видимість Skills для окремого агента міститься в
`agents.defaults.skills` і `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime і далі Node; bun не рекомендовано)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або plaintext-рядок
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Для вбудованої генерації/редагування зображень надавайте перевагу `agents.defaults.imageGenerationModel`
разом із core-інструментом `image_generate`. `skills.entries.*` призначено лише для користувацьких або
сторонніх workflow Skills.

Якщо ви вибираєте конкретний провайдер/модель зображень, також налаштуйте
auth/API key цього провайдера. Типові приклади: `GEMINI_API_KEY` або `GOOGLE_API_KEY` для
`google/*`, `OPENAI_API_KEY` для `openai/*` і `FAL_KEY` для `fal/*`.

Приклади:

- Native-конфігурація у стилі Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Native-конфігурація fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist-и Skills агента

Використовуйте config агента, коли хочете мати ті самі корені Skills машини/робочого простору, але
інший видимий набір Skills для кожного агента.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // успадковує типові значення -> github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює типові значення
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

Правила:

- `agents.defaults.skills`: спільний базовий allowlist для агентів, які пропускають
  `agents.list[].skills`.
- Пропустіть `agents.defaults.skills`, щоб типово не обмежувати Skills.
- `agents.list[].skills`: явний фінальний набір Skills для цього агента; він не
  об’єднується з типовими значеннями.
- `agents.list[].skills: []`: не відкривати жодних Skills для цього агента.

## Поля

- Вбудовані корені Skills завжди включають `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` і `<workspace>/skills`.
- `allowBundled`: необов’язковий allowlist лише для **вбудованих** Skills. Якщо його задано, право на використання мають лише
  вбудовані Skills зі списку (керовані Skills, Skills агента і робочого простору не зачіпаються).
- `load.extraDirs`: додаткові каталоги Skills для сканування (найнижчий пріоритет).
- `load.watch`: відстежувати папки Skills і оновлювати знімок Skills (типово: true).
- `load.watchDebounceMs`: debounce для подій watcher-а Skills у мілісекундах (типово: 250).
- `install.preferBrew`: надавати перевагу встановлювачам brew, коли вони доступні (типово: true).
- `install.nodeManager`: пріоритет встановлювача node (`npm` | `pnpm` | `yarn` | `bun`, типово: npm).
  Це впливає лише на **встановлення Skills**; runtime Gateway і далі має бути Node
  (Bun не рекомендовано для WhatsApp/Telegram).
  - `openclaw setup --node-manager` є вужчим і наразі приймає `npm`,
    `pnpm` або `bun`. Задайте `skills.install.nodeManager: "yarn"` вручну, якщо
    хочете встановлення Skills на основі Yarn.
- `entries.<skillKey>`: перевизначення для конкретного Skill.
- `agents.defaults.skills`: необов’язковий типовий allowlist Skills, який успадковують агенти,
  що пропускають `agents.list[].skills`.
- `agents.list[].skills`: необов’язковий фінальний allowlist Skills для окремого агента; явні
  списки замінюють успадковані типові значення, а не об’єднуються з ними.

Поля для окремого Skill:

- `enabled`: задайте `false`, щоб вимкнути Skill, навіть якщо він вбудований/встановлений.
- `env`: змінні середовища, які інжектуються для запуску агента (лише якщо їх ще не задано).
- `apiKey`: необов’язкова зручність для Skills, які оголошують основну env var.
  Підтримує plaintext-рядок або об’єкт SecretRef (`{ source, provider, id }`).

## Примітки

- Ключі в `entries` типово відповідають назві Skill. Якщо Skill визначає
  `metadata.openclaw.skillKey`, використовуйте натомість цей ключ.
- Пріоритет завантаження: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → вбудовані Skills →
  `skills.load.extraDirs`.
- Зміни в Skills підхоплюються на наступному циклі агента, коли watcher увімкнено.

### Skills у sandbox + env vars

Коли сесія **працює в sandbox**, процеси Skills запускаються всередині налаштованого
backend sandbox. Sandbox **не** успадковує `process.env` хоста.

Використовуйте один із варіантів:

- `agents.defaults.sandbox.docker.env` для backend Docker (або `agents.list[].sandbox.docker.env` для окремого агента)
- вбудуйте env у свій користувацький sandbox image або віддалене sandbox-середовище

Глобальні `env` і `skills.entries.<skill>.env/apiKey` застосовуються **лише** до запусків на хості.

## Пов’язане

- [Skills](/uk/tools/skills)
- [Створення Skills](/uk/tools/creating-skills)
- [Slash-команди](/uk/tools/slash-commands)
