---
read_when:
    - Встановлення або налаштування harness acpx для Claude Code / Codex / Gemini CLI
    - Увімкнення мосту MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація harness acpx, налаштування plugin, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-04-26T03:55:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0520b3e5fcc34be478aea807527b4a60c349267650a8f59ea2f79150d54161f8
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Огляд, інструкції для операторів і концепції див. у [ACP agents](/uk/tools/acp-agents).

У розділах нижче описано конфігурацію harness acpx, налаштування plugin для мостів MCP і конфігурацію дозволів.

Використовуйте цю сторінку лише тоді, коли налаштовуєте маршрут ACP/acpx. Для конфігурації нативного середовища виконання app-server Codex використовуйте [Codex harness](/uk/plugins/codex-harness). Для ключів API OpenAI або конфігурації постачальника моделей Codex OAuth використовуйте [OpenAI](/uk/providers/openai).

Codex має два маршрути OpenClaw:

| Маршрут                    | Конфігурація/команда                                   | Сторінка налаштування                    |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| Нативний app-server Codex  | `/codex ...`, `embeddedHarness.runtime: "codex"`       | [Codex harness](/uk/plugins/codex-harness)  |
| Явний адаптер ACP Codex    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ця сторінка                              |

Віддавайте перевагу нативному маршруту, якщо вам явно не потрібна поведінка ACP/acpx.

## Підтримка harness acpx (поточна)

Поточні вбудовані псевдоніми harness acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Коли OpenClaw використовує бекенд acpx, віддавайте перевагу цим значенням для `agentId`, якщо у вашій конфігурації acpx не визначено власні псевдоніми агентів.
Якщо ваша локальна інсталяція Cursor усе ще надає ACP як `agent acp`, перевизначте команду агента `cursor` у своїй конфігурації acpx замість зміни вбудованого типового значення.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей необроблений запасний шлях є можливістю CLI acpx (а не звичайним шляхом `agentId` в OpenClaw).

Керування моделями залежить від можливостей адаптера. Посилання на моделі Codex ACP нормалізуються OpenClaw перед запуском. Іншим harness потрібні `models` ACP і підтримка `session/set_model`; якщо harness не надає ані цієї можливості ACP, ані власного прапорця моделі під час запуску, OpenClaw/acpx не може примусово вибрати модель.

## Обов’язкова конфігурація

Базова конфігурація ACP:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. Типове значення — true; встановіть false, щоб призупинити диспетчеризацію ACP, зберігши елементи керування /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Конфігурація прив’язки потоків залежить від адаптера каналу. Приклад для Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Якщо запуск ACP із прив’язкою до потоку не працює, спочатку перевірте прапорець можливості адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірнього потоку. Вони потребують активного контексту розмови й адаптера каналу, який надає прив’язки розмов ACP.

Див. [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування plugin для бекенда acpx

У нових інсталяціях вбудований runtime plugin `acpx` увімкнено типово, тому ACP зазвичай працює без ручного кроку встановлення plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете переключитися на локальний checkout для розробки, використовуйте явний шлях plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Локальна інсталяція з workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан бекенда:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

Типово вбудований plugin `acpx` реєструє вбудований бекенд ACP без запуску агента ACP під час старту Gateway. Використайте `/acp doctor` для явної живої перевірки. Установлюйте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` лише тоді, коли потрібно, щоб Gateway перевіряв налаштованого агента під час запуску.

Перевизначайте команду або версію в конфігурації plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` приймає абсолютний шлях, відносний шлях (визначається від workspace OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає строге зіставлення версій.
- Власні шляхи `command` вимикають автоматичне встановлення на рівні plugin.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально через `npm install -g openclaw`, залежності runtime acpx (платформозалежні бінарні файли) встановлюються автоматично через hook postinstall. Якщо автоматичне встановлення не вдається, gateway усе одно запускається нормально й повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP для інструментів plugin

Типово сесії ACPX **не** надають harness ACP доступ до інструментів OpenClaw, зареєстрованих plugin.

Якщо ви хочете, щоб агенти ACP, такі як Codex або Claude Code, могли викликати встановлені інструменти plugin OpenClaw, наприклад memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Впроваджує в bootstrap сесії ACPX вбудований сервер MCP з назвою `openclaw-plugin-tools`.
- Надає інструменти plugin, уже зареєстровані встановленими й увімкненими plugin OpenClaw.
- Робить цю можливість явною та вимкненою типово.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів harness ACP.
- Агенти ACP отримують доступ лише до інструментів plugin, уже активних у gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим plugin виконуватися в самому OpenClaw.
- Перевірте встановлені plugin перед увімкненням.

Власні `mcpServers`, як і раніше, працюють. Вбудований міст plugin-tools є додатковою зручною можливістю з явним увімкненням, а не заміною загальної конфігурації серверів MCP.

### Міст MCP для інструментів OpenClaw

Типово сесії ACPX також **не** надають вбудовані інструменти OpenClaw через MCP. Увімкніть окремий міст core-tools, якщо агенту ACP потрібні вибрані вбудовані інструменти, наприклад `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Впроваджує в bootstrap сесії ACPX вбудований сервер MCP з назвою `openclaw-tools`.
- Надає вибрані вбудовані інструменти OpenClaw. Початково сервер надає `cron`.
- Робить надання core tools явним і вимкненим типово.

### Конфігурація тайм-ауту runtime

Типово вбудований plugin `acpx` встановлює для ходів вбудованого runtime тайм-аут 120 секунд. Це дає повільнішим harness, таким як Gemini CLI, достатньо часу для завершення запуску та ініціалізації ACP. Перевизначте це значення, якщо вашому хосту потрібне інше обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація агента для перевірки стану

Коли `/acp doctor` або необов’язкова перевірка під час запуску перевіряє бекенд, вбудований plugin `acpx` перевіряє один агент harness. Якщо встановлено `acp.allowedAgents`, типово використовується перший дозволений агент; інакше типовим є `codex`. Якщо вашому розгортанню потрібен інший агент ACP для перевірок стану, явно встановіть агент перевірки:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Конфігурація дозволів

Сесії ACP працюють у неінтерактивному режимі — TTY для підтвердження або відхилення запитів на дозволи для запису файлів і виконання shell-команд немає. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи harness ACPX відокремлені від підтверджень exec в OpenClaw і від прапорців обходу постачальника для CLI-бекендів, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач на рівні harness для сесій ACP.

### `permissionMode`

Керує тим, які операції агент harness може виконувати без запиту.

| Значення        | Поведінка                                                 |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматично підтверджує всі записи файлів і shell-команди. |
| `approve-reads` | Автоматично підтверджує лише читання; запис і exec потребують запитів. |
| `deny-all`      | Відхиляє всі запити на дозволи.                           |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би відобразитися запит на дозвіл, але інтерактивний TTY недоступний (що для сесій ACP відбувається завжди).

| Значення | Поведінка                                                        |
| -------- | ---------------------------------------------------------------- |
| `fail`   | Перериває сесію з `AcpRuntimeError`. **(типове значення)**       |
| `deny`   | Мовчки відхиляє дозвіл і продовжує роботу (плавна деградація).   |

### Конфігурація

Задається через конфігурацію plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

> **Важливо:** OpenClaw наразі типово використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сесіях ACP будь-який запис або exec, що викликає запит на дозвіл, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сесії деградували плавно, а не аварійно завершувалися.

## Пов’язане

- [ACP agents](/uk/tools/acp-agents) — огляд, інструкції для операторів, концепції
- [Sub-agents](/uk/tools/subagents)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
