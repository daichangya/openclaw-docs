---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Керування sandbox runtime і перевірка ефективної політики sandbox
title: Sandbox CLI
x-i18n:
    generated_at: "2026-04-24T03:43:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

Керування sandbox runtime для ізольованого виконання агентів.

## Огляд

OpenClaw може запускати агентів в ізольованих sandbox runtime для безпеки. Команди `sandbox` допомагають перевіряти й перевідтворювати ці runtime після оновлень або змін конфігурації.

Сьогодні це зазвичай означає:

- Docker sandbox контейнери
- SSH sandbox runtime, коли `agents.defaults.sandbox.backend = "ssh"`
- OpenShell sandbox runtime, коли `agents.defaults.sandbox.backend = "openshell"`

Для `ssh` і OpenShell `remote` перевідтворення важливіше, ніж для Docker:

- віддалений робочий простір є канонічним після початкового заповнення
- `openclaw sandbox recreate` видаляє цей канонічний віддалений робочий простір для вибраної області
- під час наступного використання він знову заповнюється з поточного локального робочого простору

## Команди

### `openclaw sandbox explain`

Перевірити **ефективний** режим/область/доступ до робочого простору sandbox, політику інструментів sandbox і elevated gates (із шляхами до ключів конфігурації для виправлення).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Показати всі sandbox runtime разом з їхнім статусом і конфігурацією.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Показати лише browser контейнери
openclaw sandbox list --json     # Вивід JSON
```

**Вивід містить:**

- Назву runtime і статус
- Backend (`docker`, `openshell` тощо)
- Мітку конфігурації та інформацію, чи вона збігається з поточною конфігурацією
- Вік (час від створення)
- Час бездіяльності (час від останнього використання)
- Пов’язану сесію/агента

### `openclaw sandbox recreate`

Видалити sandbox runtime, щоб примусово перевідтворити їх з оновленою конфігурацією.

```bash
openclaw sandbox recreate --all                # Перевідтворити всі контейнери
openclaw sandbox recreate --session main       # Конкретна сесія
openclaw sandbox recreate --agent mybot        # Конкретний агент
openclaw sandbox recreate --browser            # Лише browser контейнери
openclaw sandbox recreate --all --force        # Пропустити підтвердження
```

**Параметри:**

- `--all`: перевідтворити всі sandbox контейнери
- `--session <key>`: перевідтворити контейнер для конкретної сесії
- `--agent <id>`: перевідтворити контейнери для конкретного агента
- `--browser`: перевідтворити лише browser контейнери
- `--force`: пропустити запит на підтвердження

**Важливо:** runtime автоматично перевідтворюються під час наступного використання агента.

## Варіанти використання

### Після оновлення Docker image

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Після зміни конфігурації sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Після зміни SSH target або SSH auth material

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Для основного backend `ssh` перевідтворення видаляє корінь віддаленого робочого простору для кожної області
на SSH target. Під час наступного запуску він знову заповнюється з локального робочого простору.

### Після зміни джерела, policy або mode для OpenShell

```bash
# Edit config:
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
# or just one agent:
openclaw sandbox recreate --agent family
```

### Лише для конкретного агента

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Навіщо це потрібно?

**Проблема:** коли ви оновлюєте конфігурацію sandbox:

- наявні runtime продовжують працювати зі старими налаштуваннями
- runtime очищуються лише після 24 годин бездіяльності
- агенти, які регулярно використовуються, можуть безстроково зберігати старі runtime активними

**Рішення:** використовуйте `openclaw sandbox recreate`, щоб примусово видалити старі runtime. Вони будуть автоматично перевідтворені з поточними налаштуваннями, коли знадобляться наступного разу.

Порада: віддавайте перевагу `openclaw sandbox recreate` замість ручного очищення, специфічного для backend.
Команда використовує реєстр runtime Gateway і допомагає уникнути невідповідностей, коли змінюються ключі області/сесії.

## Конфігурація

Налаштування sandbox містяться в `~/.openclaw/openclaw.json` у `agents.defaults.sandbox` (перевизначення для окремих агентів розміщуються в `agents.list[].sandbox`):

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

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Ізоляція](/uk/gateway/sandboxing)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Doctor](/uk/gateway/doctor) — перевіряє налаштування sandbox
