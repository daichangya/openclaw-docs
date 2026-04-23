---
read_when:
    - Додавання або змінення конфігурації Skills
    - Налаштування вбудованого allowlist або поведінки встановлення
summary: Схема конфігурації Skills і приклади
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-04-23T06:48:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Конфігурація Skills

Більшість конфігурації завантаження/встановлення Skills розміщується в `skills` у
`~/.openclaw/openclaw.json`. Видимість Skills для конкретного агента розміщується в
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (runtime Gateway усе ще Node; bun не рекомендовано)
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

Для вбудованого генерування/редагування зображень віддавайте перевагу `agents.defaults.imageGenerationModel`
разом із core-інструментом `image_generate`. `skills.entries.*` призначено лише для custom або
сторонніх робочих процесів Skills.

Якщо ви вибираєте конкретного провайдера/модель зображень, також налаштуйте
автентифікацію/API-ключ цього провайдера. Типові приклади: `GEMINI_API_KEY` або `GOOGLE_API_KEY` для
`google/*`, `OPENAI_API_KEY` для `openai/*` і `FAL_KEY` для `fal/*`.

Приклади:

- Нативне налаштування в стилі Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Нативне налаштування fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## allowlist Skills для агентів

Використовуйте конфігурацію агента, якщо хочете мати ті самі корені Skills для машини/робочого простору, але
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

- `agents.defaults.skills`: спільний базовий allowlist для агентів, які не задають
  `agents.list[].skills`.
- Якщо `agents.defaults.skills` пропущено, Skills типово не обмежуються.
- `agents.list[].skills`: явний фінальний набір Skills для цього агента; він не
  об’єднується з типовими значеннями.
- `agents.list[].skills: []`: не відкривати жодних Skills для цього агента.

## Поля

- Вбудовані корені Skills завжди включають `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` і `<workspace>/skills`.
- `allowBundled`: необов’язковий allowlist лише для **вбудованих** Skills. Якщо задано, доступними є лише
  вбудовані Skills зі списку (керовані Skills, Skills агента й робочого простору не зачіпаються).
- `load.extraDirs`: додаткові каталоги Skills для сканування (найнижчий пріоритет).
- `load.watch`: відстежувати теки Skills і оновлювати знімок Skills (типово: true).
- `load.watchDebounceMs`: debounce для подій watcher Skills у мілісекундах (типово: 250).
- `install.preferBrew`: віддавати перевагу інсталяторам brew, коли вони доступні (типово: true).
- `install.nodeManager`: бажаний інсталятор Node (`npm` | `pnpm` | `yarn` | `bun`, типово: npm).
  Це впливає лише на **встановлення Skills**; runtime Gateway усе одно має залишатися на Node
  (`bun` не рекомендовано для WhatsApp/Telegram).
  - `openclaw setup --node-manager` має вужчу дію й наразі приймає лише `npm`,
    `pnpm` або `bun`. Установіть `skills.install.nodeManager: "yarn"` вручну, якщо
    хочете встановлення Skills через Yarn.
- `entries.<skillKey>`: перевизначення для окремих Skills.
- `agents.defaults.skills`: необов’язковий типовий allowlist Skills, який успадковують агенти,
  що не задають `agents.list[].skills`.
- `agents.list[].skills`: необов’язковий фінальний allowlist Skills для конкретного агента; явні
  списки замінюють успадковані типові значення, а не об’єднуються з ними.

Поля для окремих Skills:

- `enabled`: установіть `false`, щоб вимкнути Skill, навіть якщо він вбудований/встановлений.
- `env`: змінні середовища, які ін’єктуються для запуску агента (лише якщо вони ще не задані).
- `apiKey`: необов’язкова зручність для Skills, які оголошують основну змінну середовища.
  Підтримує plaintext string або об’єкт SecretRef (`{ source, provider, id }`).

## Примітки

- Ключі в `entries` типово відповідають назві Skill. Якщо Skill визначає
  `metadata.openclaw.skillKey`, використовуйте натомість цей ключ.
- Пріоритет завантаження: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → вбудовані Skills →
  `skills.load.extraDirs`.
- Якщо watcher увімкнено, зміни в Skills підхоплюються на наступному ході агента.

### Sandboxed Skills + змінні середовища

Коли сесію **ізольовано**, процеси Skills запускаються всередині налаштованого
sandbox backend. Sandbox **не** успадковує host `process.env`.

Використовуйте одне з такого:

- `agents.defaults.sandbox.docker.env` для backend Docker (або `agents.list[].sandbox.docker.env` для конкретного агента)
- вбудуйте env у свій custom sandbox image або віддалене sandbox-середовище

Глобальний `env` і `skills.entries.<skill>.env/apiKey` застосовуються **лише** до запусків на host.
