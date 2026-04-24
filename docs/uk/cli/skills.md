---
read_when:
    - Ви хочете побачити, які Skills доступні й готові до запуску
    - Ви хочете шукати, встановлювати або оновлювати Skills із ClawHub
    - Ви хочете налагодити відсутні бінарні файли, змінні середовища або конфігурацію для Skills
summary: Довідник CLI для `openclaw skills` (пошук/встановлення/оновлення/список/відомості/перевірка)
title: Skills
x-i18n:
    generated_at: "2026-04-24T03:16:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Переглядайте локальні Skills і встановлюйте/оновлюйте Skills із ClawHub.

Пов’язано:

- Система Skills: [Skills](/uk/tools/skills)
- Конфігурація Skills: [Конфігурація Skills](/uk/tools/skills-config)
- Встановлення з ClawHub: [ClawHub](/uk/tools/clawhub)

## Команди

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` безпосередньо використовують ClawHub і встановлюють у каталог `skills/` активного робочого простору. `list`/`info`/`check` як і раніше переглядають локальні Skills, видимі для поточного робочого простору та конфігурації.

Ця команда CLI `install` завантажує теки Skills із ClawHub. Встановлення залежностей Skills через Gateway, запущене з онбордингу або налаштувань Skills, натомість використовує окремий шлях запиту `skills.install`.

Примітки:

- `search [query...]` приймає необов’язковий запит; пропустіть його, щоб переглянути типовий пошуковий канал ClawHub.
- `search --limit <n>` обмежує кількість повернених результатів.
- `install --force` перезаписує наявну теку Skill у робочому просторі для того самого slug.
- `update --all` оновлює лише відстежувані встановлення ClawHub в активному робочому просторі.
- `list` є типовою дією, якщо не вказано підкоманду.
- `list`, `info` і `check` записують свій сформований вивід у stdout. Із `--json` це означає, що машиночитний вміст залишається в stdout для конвеєрів і скриптів.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Skills](/uk/tools/skills)
