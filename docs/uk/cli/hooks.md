---
read_when:
    - Ви хочете керувати хуками агента
    - Ви хочете перевірити доступність хуків або ввімкнути хуки робочого простору
summary: Довідник CLI для `openclaw hooks` (хуки агента)
title: Хуки
x-i18n:
    generated_at: "2026-04-27T06:56:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71c03d264f07bab80af8237d3ac5366a221d17e54234597a66ecbacff3bab62d
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Керування хуками агента (автоматизаціями на основі подій для команд на кшталт `/new`, `/reset` і запуску Gateway).

Запуск `openclaw hooks` без підкоманди еквівалентний `openclaw hooks list`.

Пов’язано:

- Хуки: [Хуки](/uk/automation/hooks)
- Хуки Plugin: [Хуки Plugin](/uk/plugins/hooks)

## Перелічити всі хуки

```bash
openclaw hooks list
```

Перелічити всі виявлені хуки з каталогів робочого простору, керованих, додаткових і вбудованих.
Під час запуску Gateway внутрішні обробники хуків не завантажуються, доки не буде налаштовано принаймні один внутрішній хук.

**Параметри:**

- `--eligible`: Показувати лише придатні хуки (вимоги виконано)
- `--json`: Виводити у форматі JSON
- `-v, --verbose`: Показувати докладну інформацію, зокрема відсутні вимоги

**Приклад виводу:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Приклад (докладно):**

```bash
openclaw hooks list --verbose
```

Показує відсутні вимоги для непридатних хуків.

**Приклад (JSON):**

```bash
openclaw hooks list --json
```

Повертає структурований JSON для програмного використання.

## Отримати інформацію про хук

```bash
openclaw hooks info <name>
```

Показати докладну інформацію про конкретний хук.

**Аргументи:**

- `<name>`: Назва хука або ключ хука (наприклад, `session-memory`)

**Параметри:**

- `--json`: Виводити у форматі JSON

**Приклад:**

```bash
openclaw hooks info session-memory
```

**Вивід:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Перевірити придатність хуків

```bash
openclaw hooks check
```

Показати зведення стану придатності хуків (скільки готові, а скільки ні).

**Параметри:**

- `--json`: Виводити у форматі JSON

**Приклад виводу:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Увімкнути хук

```bash
openclaw hooks enable <name>
```

Увімкнути конкретний хук, додавши його до вашої конфігурації (типово `~/.openclaw/openclaw.json`).

**Примітка:** Хуки робочого простору типово вимкнені, доки їх не буде ввімкнено тут або в конфігурації. Хуки, якими керують plugins, показують `plugin:<id>` у `openclaw hooks list` і не можуть бути увімкнені чи вимкнені тут. Натомість увімкніть або вимкніть сам plugin.

**Аргументи:**

- `<name>`: Назва хука (наприклад, `session-memory`)

**Приклад:**

```bash
openclaw hooks enable session-memory
```

**Вивід:**

```
✓ Enabled hook: 💾 session-memory
```

**Що це робить:**

- Перевіряє, що хук існує та є придатним
- Оновлює `hooks.internal.entries.<name>.enabled = true` у вашій конфігурації
- Зберігає конфігурацію на диск

Якщо хук походить із `<workspace>/hooks/`, цей крок явного ввімкнення обов’язковий, щоб Gateway міг його завантажити.

**Після ввімкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися (перезапуск програми в рядку меню на macOS або перезапуск вашого процесу gateway у dev).

## Вимкнути хук

```bash
openclaw hooks disable <name>
```

Вимкнути конкретний хук, оновивши вашу конфігурацію.

**Аргументи:**

- `<name>`: Назва хука (наприклад, `command-logger`)

**Приклад:**

```bash
openclaw hooks disable command-logger
```

**Вивід:**

```
⏸ Disabled hook: 📝 command-logger
```

**Після вимкнення:**

- Перезапустіть gateway, щоб хуки перезавантажилися

## Примітки

- `openclaw hooks list --json`, `info --json` і `check --json` записують структурований JSON безпосередньо в stdout.
- Хуки, якими керують plugins, не можна тут увімкнути або вимкнути; замість цього увімкніть або вимкніть plugin-власник.

## Установити пакети хуків

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Установлюйте пакети хуків через уніфікований інсталятор plugins.

`openclaw hooks install` усе ще працює як сумісний псевдонім, але виводить попередження про застарілість і перенаправляє на `openclaw plugins install`.

Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/файлів і діапазони semver відхиляються. Установлення залежностей виконується локально для проєкту з `--ignore-scripts` для безпеки, навіть якщо у вашій оболонці задано глобальні налаштування встановлення npm.

Специфікації без версії та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-який із цих варіантів до попереднього випуску, OpenClaw зупиняється й просить вас явно погодитися через тег попереднього випуску, наприклад `@beta`/`@rc`, або точну версію попереднього випуску.

**Що це робить:**

- Копіює пакет хуків у `~/.openclaw/hooks/<id>`
- Увімкнює встановлені хуки в `hooks.internal.entries.*`
- Записує встановлення в `hooks.internal.installs`

**Параметри:**

- `-l, --link`: Прив’язати локальний каталог замість копіювання (додає його до `hooks.internal.load.extraDirs`)
- `--pin`: Записувати встановлення npm як точне розв’язане `name@version` у `hooks.internal.installs`

**Підтримувані архіви:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Приклади:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Прив’язані пакети хуків розглядаються як керовані хуки з каталогу, налаштованого оператором, а не як хуки робочого простору.

## Оновити пакети хуків

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Оновлюйте відстежувані пакети хуків на основі npm через уніфікований засіб оновлення plugins.

`openclaw hooks update` усе ще працює як сумісний псевдонім, але виводить попередження про застарілість і перенаправляє на `openclaw plugins update`.

**Параметри:**

- `--all`: Оновити всі відстежувані пакети хуків
- `--dry-run`: Показати, що змінилося б, без запису

Коли існує збережений хеш цілісності й хеш отриманого артефакту змінюється, OpenClaw виводить попередження й просить підтвердження перед продовженням. Використовуйте глобальний `--yes`, щоб пропускати запити в CI/неінтерактивних запусках.

## Вбудовані хуки

### session-memory

Зберігає контекст сесії в пам’ять, коли ви використовуєте `/new` або `/reset`.

**Увімкнення:**

```bash
openclaw hooks enable session-memory
```

**Вивід:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Див.:** [документацію session-memory](/uk/automation/hooks#session-memory)

### bootstrap-extra-files

Вставляє додаткові файли початкового налаштування (наприклад, локальні для монорепозиторію `AGENTS.md` / `TOOLS.md`) під час `agent:bootstrap`.

**Увімкнення:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Див.:** [документацію bootstrap-extra-files](/uk/automation/hooks#bootstrap-extra-files)

### command-logger

Записує всі події команд до централізованого файлу аудиту.

**Увімкнення:**

```bash
openclaw hooks enable command-logger
```

**Вивід:** `~/.openclaw/logs/commands.log`

**Перегляд журналів:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Див.:** [документацію command-logger](/uk/automation/hooks#command-logger)

### boot-md

Запускає `BOOT.md`, коли запускається gateway (після запуску каналів).

**Події**: `gateway:startup`

**Увімкнення**:

```bash
openclaw hooks enable boot-md
```

**Див.:** [документацію boot-md](/uk/automation/hooks#boot-md)

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Хуки автоматизації](/uk/automation/hooks)
