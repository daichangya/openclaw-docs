---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Керуйте середовищами виконання sandbox і перевіряйте чинну політику sandbox
title: CLI sandbox
x-i18n:
    generated_at: "2026-04-24T03:15:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b846b296c73bbeab94cc17c7d33109aa1942bbcb85a7f394d749584d304efc
    source_path: cli/sandbox.md
    workflow: 15
---

Керуйте середовищами виконання sandbox для ізольованого виконання агента.

## Огляд

OpenClaw може запускати агентів в ізольованих середовищах виконання sandbox для безпеки. Команди `sandbox` допомагають перевіряти та перевідтворювати ці середовища після оновлень або змін конфігурації.

Сьогодні це зазвичай означає:

- sandbox-контейнери Docker
- середовища виконання sandbox SSH, коли `agents.defaults.sandbox.backend = "ssh"`
- середовища виконання sandbox OpenShell, коли `agents.defaults.sandbox.backend = "openshell"`

Для `ssh` і OpenShell `remote` перевідтворення важливіше, ніж для Docker:

- віддалений робочий простір є канонічним після початкового заповнення
- `openclaw sandbox recreate` видаляє цей канонічний віддалений робочий простір для вибраної області
- під час наступного використання його знову буде заповнено з поточного локального робочого простору

## Команди

### `openclaw sandbox explain`

Перевірити **чинний** режим/область/доступ до робочого простору sandbox, політику інструментів sandbox і підвищені шлюзи доступу (із шляхами до ключів конфігурації для виправлення).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Показати список усіх середовищ виконання sandbox з їхнім статусом і конфігурацією.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Показати лише browser-контейнери
openclaw sandbox list --json     # Вивід JSON
```

**Вивід містить:**

- Назву та статус середовища виконання
- Backend (`docker`, `openshell` тощо)
- Мітку конфігурації та чи відповідає вона поточній конфігурації
- Вік (час від створення)
- Час простою (час від останнього використання)
- Пов’язану сесію/агента

### `openclaw sandbox recreate`

Видалити середовища виконання sandbox, щоб примусово створити їх заново з оновленою конфігурацією.

```bash
openclaw sandbox recreate --all                # Перевідтворити всі контейнери
openclaw sandbox recreate --session main       # Конкретна сесія
openclaw sandbox recreate --agent mybot        # Конкретний агент
openclaw sandbox recreate --browser            # Лише browser-контейнери
openclaw sandbox recreate --all --force        # Пропустити підтвердження
```

**Параметри:**

- `--all`: Перевідтворити всі sandbox-контейнери
- `--session <key>`: Перевідтворити контейнер для конкретної сесії
- `--agent <id>`: Перевідтворити контейнери для конкретного агента
- `--browser`: Перевідтворити лише browser-контейнери
- `--force`: Пропустити запит на підтвердження

**Важливо:** Середовища виконання автоматично створюються знову під час наступного використання агента.

## Варіанти використання

### Після оновлення образу Docker

```bash
# Отримати новий образ
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Оновити конфігурацію для використання нового образу
# Відредагуйте конфігурацію: agents.defaults.sandbox.docker.image (або agents.list[].sandbox.docker.image)

# Перевідтворити контейнери
openclaw sandbox recreate --all
```

### Після зміни конфігурації sandbox

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

Для основного backend `ssh` перевідтворення видаляє кореневий каталог віддаленого робочого простору для кожної області
на цілі SSH. Під час наступного запуску його знову буде заповнено з локального робочого простору.

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
для цієї області. Під час наступного запуску його знову буде заповнено з локального робочого простору.

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

## Навіщо це потрібно?

**Проблема:** Коли ви оновлюєте конфігурацію sandbox:

- наявні середовища виконання продовжують працювати зі старими налаштуваннями
- середовища виконання очищаються лише після 24 годин неактивності
- агенти, які регулярно використовуються, можуть зберігати старі середовища виконання необмежено довго

**Рішення:** Використовуйте `openclaw sandbox recreate`, щоб примусово видалити старі середовища виконання. Вони будуть автоматично створені заново з поточними налаштуваннями, коли знадобляться наступного разу.

Порада: надавайте перевагу `openclaw sandbox recreate` замість ручного очищення, специфічного для backend.
Ця команда використовує реєстр середовищ виконання Gateway і допомагає уникнути невідповідностей, коли змінюються ключі області/сесії.

## Конфігурація

Налаштування sandbox зберігаються в `~/.openclaw/openclaw.json` у `agents.defaults.sandbox` (перевизначення для окремих агентів — у `agents.list[].sandbox`):

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
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Див. також

- [Документація sandbox](/uk/gateway/sandboxing)
- [Конфігурація агента](/uk/concepts/agent-workspace)
- [Команда doctor](/uk/gateway/doctor) - Перевірка налаштування sandbox

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Ізоляція sandbox](/uk/gateway/sandboxing)
