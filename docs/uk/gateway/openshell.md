---
read_when:
    - Ви хочете керовані хмарні sandbox замість локального Docker
    - Ви налаштовуєте плагін OpenShell
    - Вам потрібно вибрати між режимами workspace mirror і remote
summary: Використання OpenShell як керованого бекенда sandbox для агентів OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-05T18:04:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaf9027d0632a70fb86455f8bc46dc908ff766db0eb0cdf2f7df39c715241ead
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell — це керований бекенд sandbox для OpenClaw. Замість локального запуску
контейнерів Docker OpenClaw делегує життєвий цикл sandbox до CLI `openshell`,
який надає віддалені середовища з виконанням команд через SSH.

Плагін OpenShell повторно використовує той самий базовий транспорт SSH і
міст віддаленої файлової системи, що й загальний [бекенд SSH](/gateway/sandboxing#ssh-backend). Він додає
життєвий цикл, специфічний для OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`),
та необов’язковий режим workspace `mirror`.

## Передумови

- CLI `openshell` встановлено й доступний у `PATH` (або задайте власний шлях через
  `plugins.entries.openshell.config.command`)
- Обліковий запис OpenShell із доступом до sandbox
- OpenClaw Gateway запущено на хості

## Швидкий старт

1. Увімкніть плагін і задайте бекенд sandbox:

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

2. Перезапустіть Gateway. На наступному ході агента OpenClaw створить sandbox OpenShell
   і маршрутизуватиме виконання інструментів через нього.

3. Перевірка:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Режими workspace

Це найважливіше рішення під час використання OpenShell.

### `mirror`

Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, якщо ви хочете, щоб **локальний
workspace залишався канонічним**.

Поведінка:

- Перед `exec` OpenClaw синхронізує локальний workspace в sandbox OpenShell.
- Після `exec` OpenClaw синхронізує віддалений workspace назад у локальний workspace.
- Файлові інструменти, як і раніше, працюють через міст sandbox, але локальний workspace
  залишається джерелом істини між ходами.

Найкраще підходить для:

- Ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично були видимі в
  sandbox.
- Ви хочете, щоб sandbox OpenShell поводився максимально схоже на бекенд Docker.
- Ви хочете, щоб workspace хоста відображав записи sandbox після кожного ходу exec.

Компроміс: додаткова вартість синхронізації до і після кожного exec.

### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, якщо ви хочете, щоб
**workspace OpenShell став канонічним**.

Поведінка:

- Коли sandbox створюється вперше, OpenClaw один раз засіває віддалений workspace
  з локального workspace.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють
  безпосередньо з віддаленим workspace OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний workspace.
- Читання медіа під час побудови prompt усе одно працює, тому що файлові та медіаінструменти читають через міст sandbox.

Найкраще підходить для:

- Sandbox має жити переважно на віддаленому боці.
- Ви хочете менші накладні витрати на синхронізацію на кожному ході.
- Ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленого sandbox.

Важливо: якщо ви редагуєте файли на хості поза OpenClaw після початкового засівання,
віддалений sandbox **не** побачить цих змін. Використовуйте
`openclaw sandbox recreate`, щоб виконати повторне засівання.

### Вибір режиму

|                          | `mirror`                  | `remote`                   |
| ------------------------ | ------------------------- | -------------------------- |
| **Канонічний workspace** | Локальний хост            | Віддалений OpenShell       |
| **Напрям синхронізації** | Двостороння (кожен exec)  | Одноразове засівання       |
| **Накладні витрати на хід** | Вищі (вивантаження + завантаження) | Нижчі (прямі віддалені операції) |
| **Локальні редагування видимі?** | Так, на наступному exec | Ні, до recreate            |
| **Найкраще для**         | Робочих процесів розробки | Довготривалих агентів, CI  |

## Довідник конфігурації

Уся конфігурація OpenShell розташована в `plugins.entries.openshell.config`:

| Ключ                      | Тип                      | Типово        | Опис                                                    |
| ------------------------- | ------------------------ | ------------- | ------------------------------------------------------- |
| `mode`                    | `"mirror"` або `"remote"` | `"mirror"`    | Режим синхронізації workspace                           |
| `command`                 | `string`                 | `"openshell"` | Шлях або назва CLI `openshell`                          |
| `from`                    | `string`                 | `"openclaw"`  | Джерело sandbox для першого створення                   |
| `gateway`                 | `string`                 | —             | Назва шлюзу OpenShell (`--gateway`)                     |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint шлюзу OpenShell (`--gateway-endpoint`)     |
| `policy`                  | `string`                 | —             | ID політики OpenShell для створення sandbox             |
| `providers`               | `string[]`               | `[]`          | Назви провайдерів, які слід приєднати під час створення sandbox |
| `gpu`                     | `boolean`                | `false`       | Запросити ресурси GPU                                   |
| `autoProviders`           | `boolean`                | `true`        | Передавати `--auto-providers` під час створення sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Основний доступний для запису workspace усередині sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Шлях монтування workspace агента (для доступу лише на читання) |
| `timeoutSeconds`          | `number`                 | `120`         | Тайм-аут для операцій CLI `openshell`                   |

Налаштування на рівні sandbox (`mode`, `scope`, `workspaceAccess`) задаються в
`agents.defaults.sandbox`, як і для будь-якого іншого бекенда. Повну матрицю див. у
[Sandboxing](/gateway/sandboxing).

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

### OpenShell для окремого агента з власним шлюзом

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
віддалений workspace для цієї області дії. Під час наступного використання виконується нове засівання віддаленого workspace з
локального workspace.

Для режиму `mirror` recreate переважно скидає віддалене середовище виконання, оскільки
локальний workspace залишається канонічним.

### Коли виконувати recreate

Виконуйте recreate після зміни будь-якого з цих параметрів:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Поточні обмеження

- Browser sandbox не підтримується бекендом OpenShell.
- `sandbox.docker.binds` не застосовується до OpenShell.
- Специфічні для Docker параметри runtime у `sandbox.docker.*` застосовуються лише до
  бекенда Docker.

## Як це працює

1. OpenClaw викликає `openshell sandbox create` (з прапорцями `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` згідно з конфігурацією).
2. OpenClaw викликає `openshell sandbox ssh-config <name>`, щоб отримати деталі
   SSH-підключення для sandbox.
3. Core записує конфігурацію SSH у тимчасовий файл і відкриває SSH-сесію, використовуючи
   той самий міст віддаленої файлової системи, що й загальний бекенд SSH.
4. У режимі `mirror`: синхронізує локальний стан у віддалений перед exec, виконує запуск, синхронізує назад після exec.
5. У режимі `remote`: один раз засіває під час створення, а потім працює безпосередньо з віддаленим
   workspace.

## Див. також

- [Sandboxing](/gateway/sandboxing) -- режими, області дії та порівняння бекендів
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження заблокованих інструментів
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів
- [Sandbox CLI](/cli/sandbox) -- команди `openclaw sandbox`
