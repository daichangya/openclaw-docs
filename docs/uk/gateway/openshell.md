---
read_when:
    - Ви хочете використовувати керовані в хмарі sandbox замість локального Docker
    - Ви налаштовуєте Plugin OpenShell
    - Вам потрібно вибрати між режимами mirror і remote workspace
summary: Використання OpenShell як керованого backend sandbox для агентів OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T22:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell — це керований backend sandbox для OpenClaw. Замість локального запуску Docker
контейнерів OpenClaw делегує життєвий цикл sandbox до CLI `openshell`,
який виділяє віддалені середовища з виконанням команд через SSH.

Plugin OpenShell повторно використовує той самий базовий SSH transport і міст
до віддаленої файлової системи, що й загальний [SSH backend](/uk/gateway/sandboxing#ssh-backend). Він додає
життєвий цикл, специфічний для OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`),
а також необов’язковий режим workspace `mirror`.

## Передумови

- Установлений CLI `openshell`, доступний у `PATH` (або вкажіть власний шлях через
  `plugins.entries.openshell.config.command`)
- Обліковий запис OpenShell із доступом до sandbox
- Запущений OpenClaw Gateway на хості

## Швидкий старт

1. Увімкніть plugin і задайте backend sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Перезапустіть Gateway. На наступному ході агента OpenClaw створить OpenShell
   sandbox і маршрутизуватиме виконання інструментів через нього.

3. Перевірте:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Режими workspace

Це найважливіше рішення під час використання OpenShell.

### `mirror`

Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, якщо хочете, щоб **локальний
workspace залишався канонічним**.

Поведінка:

- Перед `exec` OpenClaw синхронізує локальний workspace в OpenShell sandbox.
- Після `exec` OpenClaw синхронізує віддалений workspace назад у локальний workspace.
- Файлові інструменти все одно працюють через міст sandbox, але локальний workspace
  залишається джерелом істини між ходами.

Найкраще підходить для:

- Ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни були видимі в
  sandbox автоматично.
- Ви хочете, щоб OpenShell sandbox поводився максимально схоже на backend Docker.
- Ви хочете, щоб workspace хоста відображав записи sandbox після кожного ходу exec.

Компроміс: додаткові витрати на синхронізацію до і після кожного exec.

### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, якщо хочете, щоб
**workspace OpenShell став канонічним**.

Поведінка:

- Коли sandbox створюється вперше, OpenClaw один раз ініціалізує віддалений workspace
  з локального workspace.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють
  безпосередньо з віддаленим workspace OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний workspace.
- Читання медіа під час формування prompt усе одно працює, оскільки файлові й медіа-інструменти читають через
  міст sandbox.

Найкраще підходить для:

- Sandbox має жити переважно на віддаленому боці.
- Вам потрібні менші накладні витрати на синхронізацію на кожному ході.
- Ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленого sandbox.

Важливо: якщо ви редагуєте файли на хості поза OpenClaw після початкової ініціалізації,
віддалений sandbox **не** побачить цих змін. Використовуйте
`openclaw sandbox recreate`, щоб повторно ініціалізувати його.

### Вибір режиму

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Канонічний workspace** | Локальний хост             | Віддалений OpenShell      |
| **Напрям синхронізації** | Двобічний (кожен exec)     | Одноразова ініціалізація  |
| **Накладні витрати на хід** | Вищі (вивантаження + завантаження) | Нижчі (прямі віддалені операції) |
| **Локальні редагування видимі?** | Так, на наступному exec | Ні, до recreate           |
| **Найкраще для**         | Робочих процесів розробки  | Довготривалих агентів, CI |

## Довідник конфігурації

Уся конфігурація OpenShell знаходиться в `plugins.entries.openshell.config`:

| Ключ                      | Тип                      | Типово        | Опис                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` або `"remote"` | `"mirror"`    | Режим синхронізації workspace                         |
| `command`                 | `string`                 | `"openshell"` | Шлях або назва CLI `openshell`                        |
| `from`                    | `string`                 | `"openclaw"`  | Джерело sandbox для першого створення                 |
| `gateway`                 | `string`                 | —             | Назва Gateway OpenShell (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID policy OpenShell для створення sandbox             |
| `providers`               | `string[]`               | `[]`          | Назви провайдерів, які потрібно під’єднати під час створення sandbox |
| `gpu`                     | `boolean`                | `false`       | Запит ресурсів GPU                                    |
| `autoProviders`           | `boolean`                | `true`        | Передавати `--auto-providers` під час створення sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Основний доступний на запис workspace усередині sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Шлях монтування workspace агента (для доступу лише на читання) |
| `timeoutSeconds`          | `number`                 | `120`         | Тайм-аут для операцій CLI `openshell`                 |

Налаштування на рівні sandbox (`mode`, `scope`, `workspaceAccess`) задаються в
`agents.defaults.sandbox`, як і для будь-якого backend. Див.
[Sandboxing](/uk/gateway/sandboxing) для повної матриці.

## Приклади

### Мінімальне налаштування remote

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Режим mirror з GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell для окремого агента з власним Gateway

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Керування життєвим циклом

Sandbox OpenShell керуються через звичайний CLI sandbox:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Для режиму `remote` **recreate особливо важливий**: він видаляє канонічний
віддалений workspace для цієї області. Під час наступного використання буде ініціалізовано новий віддалений workspace
з локального workspace.

Для режиму `mirror` recreate головним чином скидає віддалене середовище виконання, оскільки
локальний workspace залишається канонічним.

### Коли запускати recreate

Запускайте recreate після зміни будь-чого з цього:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Посилення безпеки

OpenShell фіксує root fd workspace і повторно перевіряє ідентичність sandbox перед кожним
читанням, тому заміни symlink або повторно змонтований workspace не можуть перенаправити читання за межі
цільового віддаленого workspace.

## Поточні обмеження

- Browser sandbox не підтримується в backend OpenShell.
- `sandbox.docker.binds` не застосовується до OpenShell.
- Специфічні для Docker параметри runtime у `sandbox.docker.*` застосовуються лише до backend Docker.

## Як це працює

1. OpenClaw викликає `openshell sandbox create` (з прапорцями `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` згідно з конфігурацією).
2. OpenClaw викликає `openshell sandbox ssh-config <name>`, щоб отримати дані
   SSH-підключення для sandbox.
3. Ядро записує конфігурацію SSH у тимчасовий файл і відкриває SSH-сесію, використовуючи
   той самий міст до віддаленої файлової системи, що й загальний backend SSH.
4. У режимі `mirror`: синхронізує локальний стан у віддалений перед exec, виконує команду, синхронізує назад після exec.
5. У режимі `remote`: ініціалізує один раз під час створення, а потім працює безпосередньо з віддаленим
   workspace.

## Пов’язане

- [Sandboxing](/uk/gateway/sandboxing) -- режими, області та порівняння backend
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження заблокованих інструментів
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів
- [CLI sandbox](/uk/cli/sandbox) -- команди `openclaw sandbox`
