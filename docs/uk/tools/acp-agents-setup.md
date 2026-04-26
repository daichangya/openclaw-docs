---
read_when:
    - Установлення або налаштування acpx harness для Claude Code / Codex / Gemini CLI
    - Увімкнення моста MCP plugin-tools або OpenClaw-tools
    - Налаштування режимів дозволів ACP
summary: 'Налаштування агентів ACP: конфігурація acpx harness, налаштування плагіна, дозволи'
title: Агенти ACP — налаштування
x-i18n:
    generated_at: "2026-04-26T07:51:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Огляд, операторський runbook і концепції див. у [ACP agents](/uk/tools/acp-agents).

Розділи нижче охоплюють конфігурацію acpx harness, налаштування плагіна для мостів MCP і конфігурацію дозволів.

Використовуйте цю сторінку лише тоді, коли ви налаштовуєте маршрут ACP/acpx. Для конфігурації native-середовища виконання Codex
app-server використовуйте [Codex harness](/uk/plugins/codex-harness). Для
API-ключів OpenAI або конфігурації постачальника моделей Codex OAuth використовуйте
[OpenAI](/uk/providers/openai).

Codex має два маршрути OpenClaw:

| Route                      | Config/command                                         | Setup page                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Native app-server Codex    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/uk/plugins/codex-harness) |
| Явний ACP-адаптер Codex    | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Ця сторінка                             |

Віддавайте перевагу native-маршруту, якщо вам явно не потрібна поведінка ACP/acpx.

## Підтримка acpx harness (поточна)

Поточні вбудовані аліаси acpx harness:

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

Коли OpenClaw використовує backend acpx, віддавайте перевагу цим значенням для `agentId`, якщо у вашій конфігурації acpx не визначено власні аліаси агентів.
Якщо ваша локальна інсталяція Cursor усе ще показує ACP як `agent acp`, перевизначте команду агента `cursor` у вашій конфігурації acpx замість зміни вбудованого значення за замовчуванням.

Пряме використання acpx CLI також може націлюватися на довільні адаптери через `--agent <command>`, але цей сирий аварійний шлях є можливістю acpx CLI (а не звичайного шляху `agentId` в OpenClaw).

Керування моделлю залежить від можливостей адаптера. Посилання на моделі Codex ACP
нормалізуються OpenClaw перед запуском. Інші harness потребують ACP `models` плюс
підтримку `session/set_model`; якщо harness не надає ні цієї можливості ACP,
ні власного прапорця моделі під час запуску, OpenClaw/acpx не може примусово вибрати модель.

## Обов’язкова конфігурація

Базова конфігурація ACP ядра:

```json5
{
  acp: {
    enabled: true,
    // Необов’язково. Типове значення — true; установіть false, щоб призупинити диспетчеризацію ACP, зберігши елементи керування /acp.
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

Конфігурація прив’язки тредів залежить від адаптера каналу. Приклад для Discord:

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

Якщо породження ACP із прив’язкою до треду не працює, спочатку перевірте прапорець можливості адаптера:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Прив’язки до поточної розмови не вимагають створення дочірнього треду. Вони вимагають активного контексту розмови та адаптера каналу, який надає ACP-прив’язки розмов.

Див. [Configuration Reference](/uk/gateway/configuration-reference).

## Налаштування плагіна для backend acpx

У нових інсталяціях вбудований runtime Plugin `acpx` типово увімкнений, тому ACP
зазвичай працює без ручного встановлення плагіна.

Почніть із:

```text
/acp doctor
```

Якщо ви вимкнули `acpx`, заборонили його через `plugins.allow` / `plugins.deny` або хочете
переключитися на локальну checkout-версію для розробки, використовуйте явний шлях плагіна:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Установлення з локального workspace під час розробки:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Потім перевірте стан backend:

```text
/acp doctor
```

### Конфігурація команди acpx і версії

Типово вбудований Plugin `acpx` реєструє вбудований backend ACP без
породження ACP-агента під час запуску Gateway. Виконайте `/acp doctor` для явної
live-перевірки. Установлюйте `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` лише тоді, коли потрібно, щоб
Gateway перевіряв налаштованого агента під час запуску.

Перевизначення команди або версії в конфігурації плагіна:

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

- `command` приймає абсолютний шлях, відносний шлях (розв’язується від workspace OpenClaw) або назву команди.
- `expectedVersion: "any"` вимикає строгу перевірку версії.
- Власні шляхи `command` вимикають автоматичне встановлення, локальне для плагіна.

Див. [Plugins](/uk/tools/plugin).

### Автоматичне встановлення залежностей

Коли ви встановлюєте OpenClaw глобально за допомогою `npm install -g openclaw`, runtime-залежності acpx
(специфічні для платформи бінарні файли) установлюються автоматично
через postinstall-хук. Якщо автоматичне встановлення не вдається, gateway усе одно запускається
нормально й повідомляє про відсутню залежність через `openclaw acp doctor`.

### Міст MCP plugin-tools

Типово сесії ACPX **не** надають зареєстровані плагінами OpenClaw інструменти
ACP harness.

Якщо ви хочете, щоб ACP-агенти, як-от Codex або Claude Code, могли викликати встановлені
інструменти плагінів OpenClaw, як-от memory recall/store, увімкніть спеціальний міст:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер з назвою `openclaw-plugin-tools` у bootstrap
  сесії ACPX.
- Надає Plugin-інструменти, уже зареєстровані встановленими й увімкненими Plugin OpenClaw.
- Зберігає можливість явною та вимкненою за замовчуванням.

Примітки щодо безпеки та межі довіри:

- Це розширює поверхню інструментів ACP harness.
- ACP-агенти отримують доступ лише до Plugin-інструментів, які вже активні в gateway.
- Розглядайте це як ту саму межу довіри, що й дозвіл цим Plugin виконуватися в
  самому OpenClaw.
- Перегляньте встановлені Plugin перед увімкненням.

Власні `mcpServers` і далі працюють як раніше. Вбудований міст plugin-tools —
це додаткова зручність за явною згодою, а не заміна загальної конфігурації MCP-сервера.

### Міст MCP OpenClaw-tools

Типово сесії ACPX також **не** надають вбудовані інструменти OpenClaw через
MCP. Увімкніть окремий міст core-tools, коли ACP-агенту потрібні вибрані
вбудовані інструменти, як-от `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Що це робить:

- Впроваджує вбудований MCP-сервер з назвою `openclaw-tools` у bootstrap
  сесії ACPX.
- Надає вибрані вбудовані інструменти OpenClaw. Початковий сервер надає `cron`.
- Зберігає надання core-інструментів явним і вимкненим за замовчуванням.

### Конфігурація timeout середовища виконання

Вбудований Plugin `acpx` типово встановлює для вбудованих ходів середовища виконання
timeout 120 секунд. Це дає повільнішим harness, таким як Gemini CLI, достатньо часу
для завершення запуску та ініціалізації ACP. Перевизначте це значення, якщо вашому хосту
потрібне інше обмеження runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Після зміни цього значення перезапустіть gateway.

### Конфігурація probe-агента для перевірки стану

Коли `/acp doctor` або probe запуску за явною згодою перевіряє backend, вбудований
Plugin `acpx` перевіряє один harness-агент. Якщо встановлено `acp.allowedAgents`, типово
використовується перший дозволений агент; інакше типово використовується `codex`. Якщо вашому
розгортанню потрібен інший ACP-агент для перевірок стану, явно задайте probe-агента:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Після зміни цього значення перезапустіть gateway.

## Конфігурація дозволів

Сесії ACP працюють у неінтерактивному режимі — немає TTY для схвалення чи відхилення запитів дозволів на запис файлів і виконання shell-команд. Плагін acpx надає два ключі конфігурації, які керують обробкою дозволів:

Ці дозволи ACPX harness відокремлені від погоджень exec в OpenClaw і відокремлені від прапорців обходу постачальника в backend CLI, таких як Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` — це аварійний break-glass перемикач на рівні harness для сесій ACP.

### `permissionMode`

Керує тим, які операції harness-агент може виконувати без запиту.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Автоматично схвалювати всі записи файлів і shell-команди. |
| `approve-reads` | Автоматично схвалювати лише читання; записи й exec вимагають запитів. |
| `deny-all`      | Відхиляти всі запити дозволів.                            |

### `nonInteractivePermissions`

Керує тим, що відбувається, коли мав би бути показаний запит дозволу, але інтерактивний TTY недоступний (що завжди так для сесій ACP).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Перервати сесію з `AcpRuntimeError`. **(типово)**                 |
| `deny` | Мовчки відхилити дозвіл і продовжити (м’яка деградація).          |

### Конфігурація

Задається через конфігурацію плагіна:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Після зміни цих значень перезапустіть gateway.

> **Важливо:** OpenClaw наразі типово використовує `permissionMode=approve-reads` і `nonInteractivePermissions=fail`. У неінтерактивних ACP-сесіях будь-який запис або exec, що запускає запит дозволу, може завершитися помилкою `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Якщо вам потрібно обмежити дозволи, установіть `nonInteractivePermissions` у `deny`, щоб сесії деградували м’яко замість аварійного завершення.

## Пов’язане

- [ACP agents](/uk/tools/acp-agents) — огляд, операторський runbook, концепції
- [Sub-agents](/uk/tools/subagents)
- [Multi-agent routing](/uk/concepts/multi-agent)
