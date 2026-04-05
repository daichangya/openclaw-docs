---
read_when:
    - Додавання або зміна конфігурації Skills
    - Налаштування вбудованого allowlist або поведінки встановлення
summary: Схема конфігурації Skills і приклади
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-04-05T18:20:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Конфігурація Skills

Більшість конфігурації завантаження/встановлення Skills розташована в `skills` у
`~/.openclaw/openclaw.json`. Видимість Skills для окремих агентів розташована в
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (середовище виконання Gateway все одно Node; bun не рекомендовано)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або рядок plaintext
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
разом із core-інструментом `image_generate`. `skills.entries.*` потрібен лише для користувацьких або
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
      { id: "writer" }, // успадковує значення за замовчуванням -> github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює значення за замовчуванням
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

Правила:

- `agents.defaults.skills`: спільний базовий allowlist для агентів, у яких пропущено
  `agents.list[].skills`.
- Пропустіть `agents.defaults.skills`, щоб за замовчуванням не обмежувати Skills.
- `agents.list[].skills`: явний фінальний набір Skills для цього агента; він не
  зливається зі значеннями за замовчуванням.
- `agents.list[].skills: []`: не надавати жодних Skills для цього агента.

## Поля

- Вбудовані корені Skills завжди включають `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` і `<workspace>/skills`.
- `allowBundled`: необов’язковий allowlist лише для **вбудованих** Skills. Якщо встановлено, лише
  вбудовані Skills зі списку будуть доступні (керовані, агентські та Skills робочого простору не зачіпаються).
- `load.extraDirs`: додаткові каталоги Skills для сканування (найнижчий пріоритет).
- `load.watch`: стежити за папками Skills і оновлювати знімок Skills (за замовчуванням: true).
- `load.watchDebounceMs`: debounce для подій спостерігача Skills у мілісекундах (за замовчуванням: 250).
- `install.preferBrew`: віддавати перевагу інсталяторам brew, коли вони доступні (за замовчуванням: true).
- `install.nodeManager`: бажаний інсталятор node (`npm` | `pnpm` | `yarn` | `bun`, за замовчуванням: npm).
  Це впливає лише на **встановлення Skills**; середовище виконання Gateway все одно має бути Node
  (Bun не рекомендовано для WhatsApp/Telegram).
  - `openclaw setup --node-manager` є вужчим параметром і наразі приймає лише `npm`,
    `pnpm` або `bun`. Установіть `skills.install.nodeManager: "yarn"` вручну, якщо
    хочете встановлення Skills через Yarn.
- `entries.<skillKey>`: перевизначення для окремого skill.
- `agents.defaults.skills`: необов’язковий allowlist Skills за замовчуванням, який успадковують агенти,
  у яких пропущено `agents.list[].skills`.
- `agents.list[].skills`: необов’язковий фінальний allowlist Skills для окремого агента; явні
  списки замінюють успадковані значення за замовчуванням, а не зливаються з ними.

Поля для окремого skill:

- `enabled`: установіть `false`, щоб вимкнути skill, навіть якщо він вбудований/встановлений.
- `env`: змінні середовища, які додаються до запуску агента (лише якщо вони ще не встановлені).
- `apiKey`: необов’язковий зручний параметр для Skills, які оголошують основну env-змінну.
  Підтримує рядок plaintext або об’єкт SecretRef (`{ source, provider, id }`).

## Примітки

- Ключі в `entries` за замовчуванням відповідають імені skill. Якщо skill визначає
  `metadata.openclaw.skillKey`, використовуйте натомість цей ключ.
- Пріоритет завантаження: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → вбудовані Skills →
  `skills.load.extraDirs`.
- Зміни до Skills підхоплюються на наступному ході агента, коли watcher увімкнено.

### Ізольовані Skills + env-змінні

Коли сесія **ізольована**, процеси Skills працюють усередині Docker. Ізольоване середовище
**не** успадковує хостовий `process.env`.

Використовуйте одне з такого:

- `agents.defaults.sandbox.docker.env` (або `agents.list[].sandbox.docker.env` для окремого агента)
- додайте env у власний образ sandbox

Глобальні `env` і `skills.entries.<skill>.env/apiKey` застосовуються **лише** до запусків на хості.
