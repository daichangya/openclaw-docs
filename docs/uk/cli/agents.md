---
read_when:
    - Ви хочете мати кілька ізольованих агентів (робочі простори + маршрутизація + автентифікація)
summary: Довідник CLI для `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Агенти
x-i18n:
    generated_at: "2026-04-24T03:15:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d39cacdec57971dc6a62afb8102e6802178b7cc6ac645e60733a55c2144a1edc
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Керуйте ізольованими агентами (робочі простори + автентифікація + маршрутизація).

Пов’язано:

- Маршрутизація кількох агентів: [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- Робочий простір агента: [Робочий простір агента](/uk/concepts/agent-workspace)
- Конфігурація видимості Skills: [Конфігурація Skills](/uk/tools/skills-config)

## Приклади

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Прив’язки маршрутизації

Використовуйте прив’язки маршрутизації, щоб закріпити вхідний трафік каналу за конкретним агентом.

Якщо ви також хочете мати різні видимі Skills для кожного агента, налаштуйте
`agents.defaults.skills` і `agents.list[].skills` у `openclaw.json`. Див.
[Конфігурація Skills](/uk/tools/skills-config) і
[Довідник з конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

Перелічити прив’язки:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Додати прив’язки:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Якщо ви пропустите `accountId` (`--bind <channel>`), OpenClaw визначить його з типових значень каналу та хуків налаштування Plugin, коли вони доступні.

Якщо ви пропустите `--agent` для `bind` або `unbind`, OpenClaw використовуватиме поточного типового агента.

### Поведінка області дії прив’язки

- Прив’язка без `accountId` відповідає лише типовому обліковому запису каналу.
- `accountId: "*"` є резервним варіантом для всього каналу (усі облікові записи) і є менш специфічним, ніж явна прив’язка облікового запису.
- Якщо той самий агент уже має відповідну прив’язку каналу без `accountId`, а ви пізніше додаєте прив’язку з явним або визначеним `accountId`, OpenClaw оновлює цю наявну прив’язку на місці замість додавання дубліката.

Приклад:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Після оновлення маршрутизація для цієї прив’язки матиме область дії `telegram:ops`. Якщо ви також хочете маршрутизацію для типового облікового запису, додайте її явно (наприклад, `--bind telegram:default`).

Видалити прив’язки:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` приймає або `--all`, або одне чи більше значень `--bind`, але не обидва варіанти одночасно.

## Поверхня команд

### `agents`

Запуск `openclaw agents` без підкоманди еквівалентний `openclaw agents list`.

### `agents list`

Параметри:

- `--json`
- `--bindings`: включити повні правила маршрутизації, а не лише кількість/підсумки для кожного агента

### `agents add [name]`

Параметри:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (можна повторювати)
- `--non-interactive`
- `--json`

Примітки:

- Передавання будь-яких явних прапорців додавання переводить команду в неінтерактивний режим.
- Неінтерактивний режим вимагає імені агента та `--workspace`.
- `main` зарезервовано, і його не можна використовувати як ідентифікатор нового агента.

### `agents bindings`

Параметри:

- `--agent <id>`
- `--json`

### `agents bind`

Параметри:

- `--agent <id>` (типово — поточний типовий агент)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--json`

### `agents unbind`

Параметри:

- `--agent <id>` (типово — поточний типовий агент)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--all`
- `--json`

### `agents delete <id>`

Параметри:

- `--force`
- `--json`

Примітки:

- `main` не можна видалити.
- Без `--force` потрібне інтерактивне підтвердження.
- Каталоги робочого простору, стану агента та транскриптів сесій переміщуються до Кошика, а не видаляються остаточно.

## Файли ідентичності

Кожен робочий простір агента може містити `IDENTITY.md` у корені робочого простору:

- Приклад шляху: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` читає з кореня робочого простору (або з явного `--identity-file`)

Шляхи до аватарів визначаються відносно кореня робочого простору.

## Установлення ідентичності

`set-identity` записує поля до `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (шлях відносно робочого простору, URL `http(s)` або data URI)

Параметри:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Примітки:

- Для вибору цільового агента можна використовувати `--agent` або `--workspace`.
- Якщо ви покладаєтеся на `--workspace`, а кілька агентів використовують цей робочий простір, команда завершиться з помилкою й попросить вас передати `--agent`.
- Коли явні поля ідентичності не вказані, команда читає дані ідентичності з `IDENTITY.md`.

Завантажити з `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Явно перевизначити поля:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Приклад конфігурації:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
