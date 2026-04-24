---
read_when:
    - Установлення або налаштування acpx harness для Claude Code / Codex / Gemini CLI
    - Увімкнення мосту MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація acpx harness, налаштування Plugin, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-04-24T02:43:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Огляд, операторський runbook і концепції див. у [ACP agents](/uk/tools/acp-agents).
Ця сторінка охоплює конфігурацію acpx harness, налаштування Plugin для мостів MCP і
налаштування дозволів.

## Підтримка acpx harness (поточна)

Поточні вбудовані псевдоніми harness у acpx:

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

Коли OpenClaw використовує бекенд acpx, надавайте перевагу цим значенням для `agentId`, якщо тільки ваша конфігурація acpx не визначає власні псевдоніми агентів.
Якщо ваша локальна інсталяція Cursor досі надає ACP як `agent acp`, перевизначте команду агента `cursor` у своїй конфігурації acpx замість зміни вбудованого значення за замовчуванням.

Пряме використання CLI acpx також може націлюватися на довільні адаптери через `--agent <command>`, але цей необроблений обхідний шлях є функцією CLI acpx (а не звичайним шляхом OpenClaw `agentId`).

## Обов’язкова конфігурація

Базова конфігурація ACP:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. За замовчуванням true; установіть false, щоб призупинити диспетчеризацію ACP, зберігши елементи керування /acp.
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

Якщо запуск ACP із прив’язкою до потоку не працює, спочатку перевірте прапорець функції адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не потребують створення дочірнього потоку. Вони потребують активного контексту розмови та адаптера каналу, який надає прив’язки розмов ACP.

Див. [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування Plugin для бекенда acpx

Свіжі інсталяції постачаються з увімкненим укомплектованим runtime Plugin `acpx` за замовчуванням, тому ACP
зазвичай працює без кроку ручного встановлення Plugin.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
переключитися на локальну checkout-версію для розробки, використайте явний шлях Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Інсталяція локального workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан бекенда:

```text
/acp doctor
```

### Конфігурація команди та версії acpx

За замовчуванням укомплектований Plugin `acpx` використовує свій локальний закріплений бінарний файл (`node_modules/.bin/acpx` усередині пакета Plugin). Під час запуску бекенд реєструється як неготовий, а фонове завдання перевіряє `acpx --version`; якщо бінарний файл відсутній або не збігається за версією, воно запускає `npm install --omit=dev --no-save acpx@<pinned>` і виконує повторну перевірку. Gateway увесь цей час залишається неблокувальним.

Перевизначте команду або версію в конфігурації Plugin:

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

- `command` приймає абсолютний шлях, відносний шлях (який обчислюється від workspace OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає сувору перевірку відповідності версії.
- Власні шляхи `command` вимикають автоінсталяцію, локальну для Plugin.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально через `npm install -g openclaw`, runtime-залежності acpx
(платформозалежні бінарні файли) встановлюються автоматично
через хук postinstall. Якщо автоматичне встановлення не вдається, gateway усе одно запускається
нормально і повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP інструментів Plugin

За замовчуванням сеанси ACPX **не** надають інструменти, зареєстровані Plugin OpenClaw, до
ACP harness.

Якщо ви хочете, щоб агенти ACP, такі як Codex або Claude Code, могли викликати встановлені
інструменти Plugin OpenClaw, наприклад memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер з назвою `openclaw-plugin-tools` у bootstrap
  сеансу ACPX.
- Надає інструменти Plugin, уже зареєстровані встановленими й увімкненими Plugin
  OpenClaw.
- Зберігає цю функцію явною та вимкненою за замовчуванням.

Примітки щодо безпеки та довіри:

- Це розширює поверхню інструментів ACP harness.
- Агенти ACP отримують доступ лише до інструментів Plugin, які вже активні в gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим Plugin виконуватися в
  самому OpenClaw.
- Перегляньте встановлені Plugin перед увімкненням.

Власні `mcpServers` і далі працюють як раніше. Вбудований міст plugin-tools є
додатковою зручною функцією з явним увімкненням, а не заміною загальної конфігурації MCP-сервера.

### Міст MCP інструментів OpenClaw

За замовчуванням сеанси ACPX також **не** надають вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст core-tools, коли агенту ACP потрібні вибрані
вбудовані інструменти, наприклад `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер з назвою `openclaw-tools` у bootstrap
  сеансу ACPX.
- Надає вибрані вбудовані інструменти OpenClaw. Початковий сервер надає `cron`.
- Зберігає надання core-інструментів явним і вимкненим за замовчуванням.

### Конфігурація тайм-ауту runtime

Укомплектований Plugin `acpx` за замовчуванням встановлює тайм-аут 120 секунд
для вбудованих turns runtime. Це дає достатньо часу повільнішим harness, таким як Gemini CLI, щоб завершити
запуск і ініціалізацію ACP. Перевизначте це значення, якщо вашому хосту потрібне інше
обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація агента для перевірки працездатності

Укомплектований Plugin `acpx` перевіряє одного harness-агента, поки визначає, чи готовий
бекенд вбудованого runtime. За замовчуванням це `codex`. Якщо ваше розгортання використовує
інший агент ACP за замовчуванням, установіть для агента перевірки той самий id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Налаштування дозволів

Сеанси ACP працюють у неінтерактивному режимі — TTY для схвалення або відхилення запитів на дозвіл запису у файли й виконання shell-команд відсутній. Plugin acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи ACPX harness є окремими від схвалень виконання OpenClaw і окремими від прапорців обходу постачальника CLI-бекенда, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний перемикач на рівні harness для сеансів ACP.

### `permissionMode`

Керує тим, які операції агент harness може виконувати без запиту.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматично схвалює всі записи у файли й shell-команди.   |
| `approve-reads` | Автоматично схвалює лише читання; запис і exec потребують запитів. |
| `deny-all`      | Відхиляє всі запити на дозвіл.                             |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би бути показаний запит на дозвіл, але інтерактивний TTY недоступний (що для сеансів ACP так є завжди).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Перериває сеанс з `AcpRuntimeError`. **(за замовчуванням)**       |
| `deny` | Мовчки відхиляє дозвіл і продовжує роботу (плавна деградація).    |

### Конфігурація

Установлюється через конфігурацію Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

> **Важливо:** OpenClaw наразі за замовчуванням використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних сеансах ACP будь-який запис або exec, що викликає запит на дозвіл, може завершитися з помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сеанси деградували плавно замість аварійного завершення.

## Пов’язане

- [ACP agents](/uk/tools/acp-agents) — огляд, операторський runbook, концепції
- [Sub-agents](/uk/tools/subagents)
- [Multi-agent routing](/uk/concepts/multi-agent)
