---
read_when:
    - Вам потрібні керовані в хмарі sandbox замість локального Docker
    - Ви налаштовуєте Plugin OpenShell
    - Вам потрібно вибрати між режимами workspace mirror і remote
summary: Використовуйте OpenShell як керований бекенд sandbox для агентів OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T07:12:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: f93a8350fd48602bc535ec0480d0ed1665e558b37cc23c820ac90097862abd23
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell — це керований бекенд sandbox для OpenClaw. Замість локального запуску
контейнерів Docker OpenClaw делегує життєвий цикл sandbox CLI `openshell`,
який створює віддалені середовища з виконанням команд через SSH.

Plugin OpenShell повторно використовує той самий базовий транспорт SSH і міст
до віддаленої файлової системи, що й загальний [бекенд SSH](/uk/gateway/sandboxing#ssh-backend). Він додає
специфічний для OpenShell життєвий цикл (`sandbox create/get/delete`, `sandbox ssh-config`)
і необов’язковий режим workspace `mirror`.

## Передумови

- Встановлений CLI `openshell`, доступний у `PATH` (або вкажіть власний шлях через
  `plugins.entries.openshell.config.command`)
- Обліковий запис OpenShell із доступом до sandbox
- Gateway OpenClaw, запущений на хості

## Швидкий старт

1. Увімкніть plugin і задайте бекенд sandbox:

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

2. Перезапустіть Gateway. Під час наступного ходу агента OpenClaw створить sandbox OpenShell
   і спрямовуватиме виконання інструментів через нього.

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

- Перед `exec` OpenClaw синхронізує локальний workspace до sandbox OpenShell.
- Після `exec` OpenClaw синхронізує віддалений workspace назад до локального workspace.
- Файлові інструменти й надалі працюють через міст sandbox, але локальний workspace
  залишається джерелом істини між ходами.

Найкраще підходить для випадків, коли:

- Ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично були видимі в
  sandbox.
- Ви хочете, щоб sandbox OpenShell поводився максимально подібно до бекенда Docker.
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
- OpenClaw **не** синхронізує віддалені зміни назад до локального workspace.
- Читання медіа під час формування prompt і далі працює, оскільки інструменти файлів і медіа читають через
  міст sandbox.

Найкраще підходить для випадків, коли:

- Sandbox має існувати переважно на віддаленому боці.
- Ви хочете менші накладні витрати на синхронізацію на кожному ході.
- Ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленого sandbox.

Важливо: якщо ви редагуєте файли на хості поза OpenClaw після початкової ініціалізації,
віддалений sandbox **не** побачить цих змін. Використовуйте
`openclaw sandbox recreate`, щоб виконати повторну ініціалізацію.

### Вибір режиму

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Канонічний workspace** | Локальний хост             | Віддалений OpenShell      |
| **Напрям синхронізації** | Двосторонній (кожен exec)  | Одноразова ініціалізація  |
| **Накладні витрати на хід** | Вищі (вивантаження + завантаження) | Нижчі (прямі віддалені операції) |
| **Локальні редагування видимі?** | Так, під час наступного exec | Ні, до recreate           |
| **Найкраще для**         | Робочих процесів розробки  | Довготривалих агентів, CI |

## Довідка з конфігурації

Уся конфігурація OpenShell розміщена в `plugins.entries.openshell.config`:

| Ключ                      | Тип                      | За замовчуванням | Опис                                                  |
| ------------------------- | ------------------------ | ---------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` або `"remote"` | `"mirror"`       | Режим синхронізації workspace                         |
| `command`                 | `string`                 | `"openshell"`    | Шлях або назва CLI `openshell`                        |
| `from`                    | `string`                 | `"openclaw"`     | Джерело sandbox для першого створення                 |
| `gateway`                 | `string`                 | —                | Назва шлюзу OpenShell (`--gateway`)                   |
| `gatewayEndpoint`         | `string`                 | —                | URL ендпойнта шлюзу OpenShell (`--gateway-endpoint`)  |
| `policy`                  | `string`                 | —                | ID policy OpenShell для створення sandbox             |
| `providers`               | `string[]`               | `[]`             | Назви провайдерів, які потрібно під’єднати під час створення sandbox |
| `gpu`                     | `boolean`                | `false`          | Запитати ресурси GPU                                  |
| `autoProviders`           | `boolean`                | `true`           | Передавати `--auto-providers` під час `sandbox create` |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`     | Основний workspace із правами запису всередині sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`       | Шлях монтування workspace агента (для доступу лише на читання) |
| `timeoutSeconds`          | `number`                 | `120`            | Timeout для операцій CLI `openshell`                  |

Налаштування рівня sandbox (`mode`, `scope`, `workspaceAccess`) налаштовуються в
`agents.defaults.sandbox`, як і для будь-якого бекенда. Повну матрицю див. у
[Sandboxing](/uk/gateway/sandboxing).

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

### Режим mirror із GPU

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

### OpenShell для окремого агента з власним gateway

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

Для режиму `mirror` recreate переважно скидає віддалене середовище виконання, оскільки
локальний workspace залишається канонічним.

### Коли виконувати recreate

Виконуйте recreate після зміни будь-чого з наведеного:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Посилення безпеки

Допоміжні засоби sandbox OpenShell, які читають файли віддаленого workspace, використовують закріплений файловий
дескриптор для кореня workspace і проходять батьківськими каталогами від цього закріпленого fd,
замість повторного розв’язання шляху для кожного читання. У поєднанні з повторною
перевіркою ідентичності під час кожної операції це запобігає тому, щоб заміна symlink посеред ходу або
гаряча заміна монтування workspace перенаправила читання за межі призначеного
віддаленого workspace.

- Корінь workspace відкривається один раз і закріплюється; наступні читання повторно використовують цей fd.
- Проходи батьківськими каталогами обходять відносні записи від закріпленого fd, тому їх не можна
  перенаправити заміненим каталогом вище в шляху.
- Ідентичність sandbox повторно перевіряється перед кожним читанням, тож повторно створений або
  перепризначений sandbox не зможе непомітно віддавати файли з іншого workspace.

## Поточні обмеження

- Браузер sandbox не підтримується в бекенді OpenShell.
- `sandbox.docker.binds` не застосовується до OpenShell.
- Специфічні для Docker параметри runtime в `sandbox.docker.*` застосовуються лише до бекенда Docker.

## Як це працює

1. OpenClaw викликає `openshell sandbox create` (з прапорцями `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` відповідно до конфігурації).
2. OpenClaw викликає `openshell sandbox ssh-config <name>`, щоб отримати SSH-дані
   підключення для sandbox.
3. Ядро записує конфігурацію SSH до тимчасового файлу й відкриває SSH-сеанс, використовуючи
   той самий міст до віддаленої файлової системи, що й загальний бекенд SSH.
4. У режимі `mirror`: синхронізувати локальне з віддаленим перед exec, виконати, синхронізувати назад після exec.
5. У режимі `remote`: одноразово ініціалізувати під час створення, а потім працювати безпосередньо з віддаленим
   workspace.

## Див. також

- [Sandboxing](/uk/gateway/sandboxing) -- режими, області та порівняння бекендів
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження заблокованих інструментів
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів
- [Sandbox CLI](/uk/cli/sandbox) -- команди `openclaw sandbox`
