---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Керуйте середовищами виконання пісочниці та перевіряйте ефективну політику пісочниці
title: CLI пісочниці
x-i18n:
    generated_at: "2026-04-27T04:33:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 15
---

Керуйте середовищами виконання пісочниці для ізольованого виконання агентів.

## Огляд

OpenClaw може запускати агентів в ізольованих середовищах виконання пісочниці для безпеки. Команди `sandbox` допомагають перевіряти та перевідтворювати ці середовища після оновлень або змін конфігурації.

Сьогодні це зазвичай означає:

- контейнери пісочниці Docker
- середовища виконання пісочниці SSH, коли `agents.defaults.sandbox.backend = "ssh"`
- середовища виконання пісочниці OpenShell, коли `agents.defaults.sandbox.backend = "openshell"`

Для `ssh` і OpenShell `remote` перевідтворення важливіше, ніж для Docker:

- віддалений робочий простір є канонічним після початкового заповнення
- `openclaw sandbox recreate` видаляє цей канонічний віддалений робочий простір для вибраної області
- під час наступного використання він знову заповнюється з поточного локального робочого простору

## Команди

### `openclaw sandbox explain`

Перевіряє **ефективний** режим/область/доступ до робочого простору пісочниці, політику інструментів пісочниці та шлюзи підвищення прав (із шляхами до ключів конфігурації для виправлення).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Показує список усіх середовищ виконання пісочниці з їхнім станом і конфігурацією.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Показати лише контейнери браузера
openclaw sandbox list --json     # Вивід JSON
```

**Вивід містить:**

- назву середовища виконання та стан
- бекенд (`docker`, `openshell` тощо)
- мітку конфігурації та інформацію про те, чи відповідає вона поточній конфігурації
- вік (час від створення)
- час простою (час від останнього використання)
- пов’язаний сеанс/агент

### `openclaw sandbox recreate`

Видаляє середовища виконання пісочниці, щоб примусово створити їх заново з оновленою конфігурацією.

```bash
openclaw sandbox recreate --all                # Перевідтворити всі контейнери
openclaw sandbox recreate --session main       # Конкретний сеанс
openclaw sandbox recreate --agent mybot        # Конкретний агент
openclaw sandbox recreate --browser            # Лише контейнери браузера
openclaw sandbox recreate --all --force        # Пропустити підтвердження
```

**Параметри:**

- `--all`: перевідтворити всі контейнери пісочниці
- `--session <key>`: перевідтворити контейнер для конкретного сеансу
- `--agent <id>`: перевідтворити контейнери для конкретного агента
- `--browser`: перевідтворити лише контейнери браузера
- `--force`: пропустити запит на підтвердження

<Note>
Середовища виконання автоматично створюються знову під час наступного використання агента.
</Note>

## Випадки використання

### Після оновлення образу Docker

```bash
# Завантажити новий образ
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Оновити конфігурацію для використання нового образу
# Відредагуйте конфігурацію: agents.defaults.sandbox.docker.image (або agents.list[].sandbox.docker.image)

# Перевідтворити контейнери
openclaw sandbox recreate --all
```

### Після зміни конфігурації пісочниці

```bash
# Відредагуйте конфігурацію: agents.defaults.sandbox.* (або agents.list[].sandbox.*)

# Перевідтворіть, щоб застосувати нову конфігурацію
openclaw sandbox recreate --all
```

### Після зміни цілі SSH або матеріалів автентифікації SSH

```bash
# Відредагуйте конфігурацію:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Для основного бекенда `ssh` перевідтворення видаляє кореневий каталог віддаленого робочого простору для кожної області
на цілі SSH. Під час наступного запуску він знову заповнюється з локального робочого простору.

### Після зміни джерела, політики або режиму OpenShell

```bash
# Відредагуйте конфігурацію:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Для режиму OpenShell `remote` перевідтворення видаляє канонічний віддалений робочий простір
для цієї області. Під час наступного запуску він знову заповнюється з локального робочого простору.

### Після зміни setupCommand

```bash
openclaw sandbox recreate --all
# або лише для одного агента:
openclaw sandbox recreate --agent family
```

### Лише для конкретного агента

```bash
# Оновити контейнери лише одного агента
openclaw sandbox recreate --agent alfred
```

## Навіщо це потрібно

Коли ви оновлюєте конфігурацію пісочниці:

- наявні середовища виконання продовжують працювати зі старими параметрами
- середовища виконання очищаються лише після 24 годин неактивності
- агенти, які регулярно використовуються, можуть зберігати старі середовища виконання необмежено довго

Використовуйте `openclaw sandbox recreate`, щоб примусово видалити старі середовища виконання. Вони автоматично створюються знову з поточними параметрами, коли знадобляться наступного разу.

<Tip>
Надавайте перевагу `openclaw sandbox recreate` замість ручного очищення, специфічного для конкретного бекенда. Ця команда використовує реєстр середовищ виконання Gateway і допомагає уникнути невідповідностей, коли змінюються область або ключі сеансу.
</Tip>

## Конфігурація

Параметри пісочниці містяться в `~/.openclaw/openclaw.json` у розділі `agents.defaults.sandbox` (перевизначення для окремих агентів містяться в `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... інші параметри Docker
        },
        "prune": {
          "idleHours": 24, // Автоматичне очищення після 24 год простою
          "maxAgeDays": 7, // Автоматичне очищення через 7 днів
        },
      },
    },
  },
}
```

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Пісочниця](/uk/gateway/sandboxing)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Doctor](/uk/gateway/doctor): перевіряє налаштування пісочниці.
