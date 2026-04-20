---
read_when:
    - Додавання або змінення конфігурації Skills
    - Налаштування вбудованого allowlist або поведінки встановлення
summary: Схема конфігурації Skills і приклади
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-04-20T18:30:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Конфігурація Skills

Більшість конфігурації завантаження/встановлення Skills розміщується в `skills` у
`~/.openclaw/openclaw.json`. Видимість Skills для конкретного агента розміщується в
`agents.defaults.skills` та `agents.list[].skills`.

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
      nodeManager: "npm", // npm | pnpm | yarn | bun (середовище виконання Gateway усе ще Node; bun не рекомендовано)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або plaintext string
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

Для вбудованої генерації/редагування зображень віддавайте перевагу `agents.defaults.imageGenerationModel`
разом із core-інструментом `image_generate`. `skills.entries.*` призначено лише для custom або
сторонніх робочих процесів Skills.

Якщо ви вибираєте конкретного провайдера/модель зображень, також налаштуйте
автентифікацію/API-ключ цього провайдера. Типові приклади: `GEMINI_API_KEY` або `GOOGLE_API_KEY` для
`google/*`, `OPENAI_API_KEY` для `openai/*` і `FAL_KEY` для `fal/*`.

Приклади:

- Нативне налаштування в стилі Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Нативне налаштування fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist Skills для агентів

Використовуйте конфігурацію агента, коли хочете мати ті самі кореневі каталоги Skills для машини/робочого простору, але
інший набір видимих Skills для кожного агента.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // успадковує defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює defaults
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

Правила:

- `agents.defaults.skills`: спільний базовий allowlist для агентів, які не вказують
  `agents.list[].skills`.
- Не вказуйте `agents.defaults.skills`, щоб за замовчуванням не обмежувати Skills.
- `agents.list[].skills`: явний кінцевий набір Skills для цього агента; він не
  об’єднується зі значеннями за замовчуванням.
- `agents.list[].skills: []`: не надавати жодних Skills для цього агента.

## Поля

- Вбудовані кореневі каталоги Skills завжди включають `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` і `<workspace>/skills`.
- `allowBundled`: необов’язковий allowlist лише для **вбудованих** Skills. Якщо задано, лише
  вбудовані Skills зі списку можуть використовуватися (керовані Skills, Skills агента та робочого простору не зачіпаються).
- `load.extraDirs`: додаткові каталоги Skills для сканування (найнижчий пріоритет).
- `load.watch`: стежити за папками Skills і оновлювати знімок Skills (типово: true).
- `load.watchDebounceMs`: debounce для подій watcher-а Skills у мілісекундах (типово: 250).
- `install.preferBrew`: віддавати перевагу інсталяторам brew, якщо вони доступні (типово: true).
- `install.nodeManager`: бажаний інсталятор Node (`npm` | `pnpm` | `yarn` | `bun`, типово: npm).
  Це впливає лише на **встановлення Skills**; середовище виконання Gateway усе ще має бути Node
  (`bun` не рекомендовано для WhatsApp/Telegram).
  - `openclaw setup --node-manager` є вужчим параметром і наразі приймає `npm`,
    `pnpm` або `bun`. Установіть `skills.install.nodeManager: "yarn"` вручну, якщо
    хочете встановлення Skills через Yarn.
- `entries.<skillKey>`: перевизначення для окремого Skill.
- `agents.defaults.skills`: необов’язковий allowlist Skills за замовчуванням, який успадковують агенти,
  що не вказують `agents.list[].skills`.
- `agents.list[].skills`: необов’язковий кінцевий allowlist Skills для окремого агента; явні
  списки замінюють успадковані значення за замовчуванням, а не об’єднуються з ними.

Поля для окремого Skill:

- `enabled`: установіть `false`, щоб вимкнути Skill, навіть якщо він вбудований/встановлений.
- `env`: змінні середовища, які додаються під час запуску агента (лише якщо вони ще не встановлені).
- `apiKey`: необов’язкова зручна опція для Skills, які оголошують основну env-змінну.
  Підтримує plaintext string або об’єкт SecretRef (`{ source, provider, id }`).

## Примітки

- Ключі в `entries` за замовчуванням відповідають імені Skill. Якщо Skill визначає
  `metadata.openclaw.skillKey`, використовуйте натомість цей ключ.
- Пріоритет завантаження: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → вбудовані Skills →
  `skills.load.extraDirs`.
- Зміни в Skills застосовуються на наступному ході агента, коли watcher увімкнено.

### Sandbox-овані Skills + env-змінні

Коли сесію **sandbox-овано**, процеси Skills працюють усередині налаштованого
sandbox-бекенда. Sandbox **не** успадковує хостовий `process.env`.

Використовуйте один із варіантів:

- `agents.defaults.sandbox.docker.env` для Docker-бекенда (або `agents.list[].sandbox.docker.env` для окремого агента)
- вбудуйте env у власний образ sandbox або у віддалене sandbox-середовище

Глобальні `env` і `skills.entries.<skill>.env/apiKey` застосовуються **лише** до запусків на хості.
