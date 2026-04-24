---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Як працює sandboxing в OpenClaw: режими, scopes, доступ до workspace та images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T03:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw може запускати **інструменти всередині sandbox backend**, щоб зменшити радіус ураження.
Це **необов’язково** і керується конфігурацією (`agents.defaults.sandbox` або
`agents.list[].sandbox`). Якщо sandboxing вимкнено, інструменти працюють на хості.
Gateway залишається на хості; виконання інструментів відбувається в ізольованому sandbox,
коли це ввімкнено.

Це не ідеальна межа безпеки, але вона суттєво обмежує доступ до файлової системи
та процесів, коли модель робить щось нерозумне.

## Що потрапляє в sandbox

- Виконання інструментів (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` тощо).
- Необов’язковий sandboxed browser (`agents.defaults.sandbox.browser`).
  - За замовчуванням browser у sandbox запускається автоматично (забезпечує доступність CDP), коли інструмент browser цього потребує.
    Налаштовується через `agents.defaults.sandbox.browser.autoStart` і `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - За замовчуванням контейнери browser у sandbox використовують виділену мережу Docker (`openclaw-sandbox-browser`) замість глобальної мережі `bridge`.
    Налаштовується через `agents.defaults.sandbox.browser.network`.
  - Необов’язковий `agents.defaults.sandbox.browser.cdpSourceRange` обмежує вхідний доступ CDP на межі контейнера через allowlist CIDR (наприклад, `172.21.0.1/32`).
  - Доступ спостерігача noVNC захищено паролем за замовчуванням; OpenClaw генерує короткочасний URL із token, який відкриває локальну bootstrap-сторінку та запускає noVNC з паролем у фрагменті URL (а не в логах query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` дає змогу sandboxed sessions явно націлюватися на browser хоста.
  - Необов’язкові allowlist керують `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Не потрапляють у sandbox:

- Сам процес Gateway.
- Будь-який інструмент, якому явно дозволено працювати поза sandbox (наприклад, `tools.elevated`).
  - **Elevated exec обходить sandboxing і використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль exec — `node`).**
  - Якщо sandboxing вимкнено, `tools.elevated` не змінює виконання (воно й так на хості). Див. [Elevated Mode](/uk/tools/elevated).

## Режими

`agents.defaults.sandbox.mode` визначає, **коли** використовується sandboxing:

- `"off"`: sandboxing вимкнено.
- `"non-main"`: sandbox лише для **не-main** сесій (типово, якщо ви хочете, щоб звичайні чати працювали на хості).
- `"all"`: кожна сесія працює в sandbox.
  Примітка: `"non-main"` базується на `session.mainKey` (типово `"main"`), а не на id агента.
  Сесії груп/каналів використовують власні ключі, тому вважаються не-main і працюватимуть у sandbox.

## Scope

`agents.defaults.sandbox.scope` визначає, **скільки контейнерів** створюється:

- `"agent"` (за замовчуванням): один контейнер на агента.
- `"session"`: один контейнер на сесію.
- `"shared"`: один контейнер, спільний для всіх sandboxed sessions.

## Backend

`agents.defaults.sandbox.backend` визначає, **яке runtime** надає sandbox:

- `"docker"` (типово, коли sandboxing увімкнено): локальне sandbox runtime на базі Docker.
- `"ssh"`: універсальне віддалене sandbox runtime на базі SSH.
- `"openshell"`: sandbox runtime на базі OpenShell.

Специфічна для SSH конфігурація міститься в `agents.defaults.sandbox.ssh`.
Специфічна для OpenShell конфігурація міститься в `plugins.entries.openshell.config`.

### Вибір backend

|                     | Docker                           | SSH                            | OpenShell                                                    |
| ------------------- | -------------------------------- | ------------------------------ | ------------------------------------------------------------ |
| **Де працює**       | Локальний контейнер              | Будь-який хост із доступом по SSH | sandbox під керуванням OpenShell                           |
| **Налаштування**    | `scripts/sandbox-setup.sh`       | SSH key + цільовий хост        | увімкнений Plugin OpenShell                                 |
| **Модель workspace**| Bind-mount або копіювання        | Remote-canonical (одноразове seed) | `mirror` або `remote`                                    |
| **Керування мережею** | `docker.network` (типово: none) | Залежить від віддаленого хоста | Залежить від OpenShell                                       |
| **Browser sandbox** | Підтримується                    | Не підтримується               | Поки не підтримується                                        |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                          |
| **Найкраще підходить для** | Локальної розробки, повної ізоляції | Винесення на віддалену машину | Керованих віддалених sandbox з необов’язковою двосторонньою синхронізацією |

### Backend Docker

Sandboxing вимкнено за замовчуванням. Якщо ви вмикаєте sandboxing і не обираєте
backend, OpenClaw використовує backend Docker. Він виконує інструменти та sandbox browsers
локально через сокет демона Docker (`/var/run/docker.sock`). Ізоляція sandbox container
визначається просторами імен Docker.

**Обмеження Docker-out-of-Docker (DooD)**:
Якщо ви розгортаєте сам OpenClaw Gateway як Docker-контейнер, він керує сусідніми sandbox-контейнерами через Docker socket хоста (DooD). Це створює конкретне обмеження на зіставлення шляхів:

- **Конфігурація вимагає шляхів хоста**: конфігурація `workspace` в `openclaw.json` МАЄ містити **абсолютний шлях хоста** (наприклад, `/home/user/.openclaw/workspaces`), а не внутрішній шлях контейнера Gateway. Коли OpenClaw просить Docker daemon запустити sandbox, daemon обчислює шляхи відносно простору імен ОС хоста, а не простору імен Gateway.
- **Паритет FS Bridge (ідентичне зіставлення volume)**: нативний процес OpenClaw Gateway також записує heartbeat і bridge-файли в каталог `workspace`. Оскільки Gateway обчислює той самий рядок (шлях хоста) зі свого контейнеризованого середовища, розгортання Gateway МАЄ містити ідентичне зіставлення volume, що нативно зв’язує простір імен хоста (`-v /home/user/.openclaw:/home/user/.openclaw`).

Якщо ви зіставляєте шляхи всередині контейнера без абсолютного паритету з хостом, OpenClaw нативно викине помилку дозволів `EACCES` під час спроби записати свій heartbeat усередині контейнерного середовища, тому що повний рядок шляху нативно не існує.

### Backend SSH

Використовуйте `backend: "ssh"`, коли хочете, щоб OpenClaw виконував sandbox для `exec`, файлових інструментів і читання медіа
на довільній машині з доступом по SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Або використовуйте SecretRefs / inline contents замість локальних файлів:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Як це працює:

- OpenClaw створює віддалений root для кожного scope в `sandbox.ssh.workspaceRoot`.
- Під час першого використання після створення або повторного створення OpenClaw одноразово виконує seed цього віддаленого workspace з локального workspace.
- Після цього `exec`, `read`, `write`, `edit`, `apply_patch`, читання prompt media та staging вхідних медіа працюють безпосередньо з віддаленим workspace через SSH.
- OpenClaw не синхронізує автоматично віддалені зміни назад у локальний workspace.

Матеріали автентифікації:

- `identityFile`, `certificateFile`, `knownHostsFile`: використовують наявні локальні файли та передають їх через конфігурацію OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: використовують inline strings або SecretRefs. OpenClaw визначає їх через звичайний runtime snapshot secrets, записує у тимчасові файли з правами `0600` і видаляє, коли SSH-сесія завершується.
- Якщо для одного й того самого елемента задано і `*File`, і `*Data`, для цієї SSH-сесії пріоритет має `*Data`.

Це модель **remote-canonical**. Віддалений SSH workspace стає реальним станом sandbox після початкового seed.

Важливі наслідки:

- Локальні зміни на хості, зроблені поза OpenClaw після кроку seed, не будуть видимі віддалено, доки ви не створите sandbox заново.
- `openclaw sandbox recreate` видаляє віддалений root для кожного scope і під час наступного використання знову виконує seed із локального.
- Browser sandboxing не підтримується в backend SSH.
- Налаштування `sandbox.docker.*` не застосовуються до backend SSH.

### Backend OpenShell

Використовуйте `backend: "openshell"`, коли хочете, щоб OpenClaw запускав інструменти в sandbox
у віддаленому середовищі під керуванням OpenShell. Повний посібник з налаштування,
довідник конфігурації та порівняння режимів workspace дивіться на окремій
[сторінці OpenShell](/uk/gateway/openshell).

OpenShell повторно використовує той самий базовий SSH transport і міст віддаленої файлової системи, що й
загальний backend SSH, і додає специфічний для OpenShell життєвий цикл
(`sandbox create/get/delete`, `sandbox ssh-config`) плюс необов’язковий режим workspace `mirror`.

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Режими OpenShell:

- `mirror` (за замовчуванням): локальний workspace залишається canonical. OpenClaw синхронізує локальні файли в OpenShell перед exec і синхронізує віддалений workspace назад після exec.
- `remote`: workspace OpenShell стає canonical після створення sandbox. OpenClaw одноразово виконує seed віддаленого workspace з локального workspace, після чого файлові інструменти та exec працюють безпосередньо з віддаленим sandbox без синхронізації змін назад.

Деталі віддаленого транспорту:

- OpenClaw запитує в OpenShell SSH config для конкретного sandbox через `openshell sandbox ssh-config <name>`.
- Core записує цю SSH config у тимчасовий файл, відкриває SSH-сесію та повторно використовує той самий міст віддаленої файлової системи, що й у `backend: "ssh"`.
- У режимі `mirror` відрізняється лише життєвий цикл: синхронізація local → remote перед exec, а потім синхронізація назад.

Поточні обмеження OpenShell:

- sandbox browser поки не підтримується
- `sandbox.docker.binds` не підтримується в backend OpenShell
- Специфічні для Docker параметри runtime у `sandbox.docker.*` і далі застосовуються лише до backend Docker

#### Режими workspace

OpenShell має дві моделі workspace. На практиці це найважливіша частина.

##### `mirror`

Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, коли хочете, щоб **локальний workspace залишався canonical**.

Поведінка:

- Перед `exec` OpenClaw синхронізує локальний workspace в sandbox OpenShell.
- Після `exec` OpenClaw синхронізує віддалений workspace назад у локальний workspace.
- Файлові інструменти все одно працюють через sandbox bridge, але локальний workspace залишається джерелом істини між ходами.

Використовуйте це, коли:

- ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично з’являлися в sandbox
- ви хочете, щоб sandbox OpenShell поводився якомога ближче до backend Docker
- ви хочете, щоб workspace хоста відображав записи sandbox після кожного ходу exec

Компроміс:

- додаткові витрати на синхронізацію до і після exec

##### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете, щоб **workspace OpenShell став canonical**.

Поведінка:

- Коли sandbox створюється вперше, OpenClaw одноразово виконує seed віддаленого workspace з локального workspace.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють безпосередньо з віддаленим workspace OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний workspace після exec.
- Читання медіа під час prompt усе одно працює, тому що файлові та media tools читають через sandbox bridge, а не припускають локальний шлях хоста.
- Транспорт — це SSH у sandbox OpenShell, який повертає `openshell sandbox ssh-config`.

Важливі наслідки:

- Якщо ви редагуєте файли на хості поза OpenClaw після кроку seed, віддалений sandbox **не** побачить ці зміни автоматично.
- Якщо sandbox створюється заново, віддалений workspace знову виконує seed із локального workspace.
- За `scope: "agent"` або `scope: "shared"` цей віддалений workspace спільний у межах того самого scope.

Використовуйте це, коли:

- sandbox має жити переважно на віддаленому боці OpenShell
- ви хочете менші накладні витрати на синхронізацію в кожному ході
- ви не хочете, щоб локальні зміни на хості непомітно перезаписували стан віддаленого sandbox

Оберіть `mirror`, якщо сприймаєте sandbox як тимчасове середовище виконання.
Оберіть `remote`, якщо сприймаєте sandbox як справжній workspace.

#### Життєвий цикл OpenShell

Sandbox OpenShell усе ще керуються через звичайний життєвий цикл sandbox:

- `openclaw sandbox list` показує runtime OpenShell так само, як і runtime Docker
- `openclaw sandbox recreate` видаляє поточний runtime і дозволяє OpenClaw створити його знову під час наступного використання
- логіка prune також враховує backend

Для режиму `remote` recreate особливо важливий:

- recreate видаляє canonical віддалений workspace для цього scope
- наступне використання виконує seed нового віддаленого workspace з локального workspace

Для режиму `mirror` recreate переважно скидає віддалене середовище виконання,
тому що локальний workspace все одно залишається canonical.

## Доступ до workspace

`agents.defaults.sandbox.workspaceAccess` визначає, **що саме sandbox може бачити**:

- `"none"` (за замовчуванням): інструменти бачать sandbox workspace у `~/.openclaw/sandboxes`.
- `"ro"`: монтує workspace агента в режимі лише читання в `/agent` (вимикає `write`/`edit`/`apply_patch`).
- `"rw"`: монтує workspace агента в режимі читання-запису в `/workspace`.

Для backend OpenShell:

- режим `mirror` і далі використовує локальний workspace як canonical-джерело між ходами exec
- режим `remote` використовує віддалений workspace OpenShell як canonical-джерело після початкового seed
- `workspaceAccess: "ro"` і `"none"` так само обмежують запис

Вхідні медіа копіюються в активний sandbox workspace (`media/inbound/*`).
Примітка щодо Skills: інструмент `read` прив’язаний до кореня sandbox. За `workspaceAccess: "none"`
OpenClaw віддзеркалює придатні Skills у sandbox workspace (`.../skills`), щоб
їх можна було читати. За `"rw"` Skills workspace доступні для читання з
`/workspace/skills`.

## Користувацькі bind mount

`agents.defaults.sandbox.docker.binds` монтує додаткові каталоги хоста в контейнер.
Формат: `host:container:mode` (наприклад, `"/home/user/source:/source:rw"`).

Глобальні та на рівні агента binds **об’єднуються** (а не замінюються). За `scope: "shared"` binds на рівні агента ігноруються.

`agents.defaults.sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер **sandbox browser**.

- Якщо задано (включно з `[]`), воно замінює `agents.defaults.sandbox.docker.binds` для контейнера browser.
- Якщо пропущено, контейнер browser використовує резервне значення з `agents.defaults.sandbox.docker.binds` (зворотна сумісність).

Приклад (джерело лише для читання + додатковий каталог даних):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Примітки щодо безпеки:

- Binds обходять файлову систему sandbox: вони відкривають шляхи хоста з тим режимом, який ви задали (`:ro` або `:rw`).
- OpenClaw блокує небезпечні джерела bind (наприклад: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` і батьківські mount, які відкрили б їх).
- OpenClaw також блокує поширені корені облікових даних у домашньому каталозі, як-от `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` і `~/.ssh`.
- Валідація bind — це не просто зіставлення рядків. OpenClaw нормалізує шлях джерела, а потім знову визначає його через найглибшого наявного батька перед повторною перевіркою заблокованих шляхів і дозволених коренів.
- Це означає, що обходи через батьківські symlink усе одно fail closed, навіть якщо кінцевий leaf ще не існує. Приклад: `/workspace/run-link/new-file` усе одно визначається як `/var/run/...`, якщо `run-link` вказує туди.
- Дозволені корені джерел canonical-ізуються так само, тому шлях, який лише виглядає таким, що перебуває всередині allowlist до визначення symlink, усе одно буде відхилено як `outside allowed roots`.
- Чутливі mount (secrets, SSH keys, service credentials) мають бути `:ro`, якщо тільки це не абсолютно необхідно.
- Поєднуйте з `workspaceAccess: "ro"`, якщо вам потрібен лише доступ на читання до workspace; режими bind при цьому залишаються незалежними.
- Див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated), щоб зрозуміти, як binds взаємодіють із політикою інструментів і elevated exec.

## Images + налаштування

Типовий Docker image: `openclaw-sandbox:bookworm-slim`

Зберіть його один раз:

```bash
scripts/sandbox-setup.sh
```

Примітка: типовий image **не** містить Node. Якщо Skill потребує Node (або
інших runtime), або зберіть власний image, або встановіть через
`sandbox.docker.setupCommand` (потрібні network egress + доступний для запису root +
користувач root).

Якщо вам потрібен більш функціональний sandbox image із поширеними інструментами (наприклад
`curl`, `jq`, `nodejs`, `python3`, `git`), зберіть:

```bash
scripts/sandbox-common-setup.sh
```

Потім задайте `agents.defaults.sandbox.docker.image` як
`openclaw-sandbox-common:bookworm-slim`.

Image sandboxed browser:

```bash
scripts/sandbox-browser-setup.sh
```

За замовчуванням Docker sandbox containers працюють **без мережі**.
Перевизначте це через `agents.defaults.sandbox.docker.network`.

Bundled image sandbox browser також застосовує консервативні типові параметри запуску Chromium
для контейнеризованих навантажень. Поточні типові параметри контейнера включають:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` і `--disable-setuid-sandbox`, коли увімкнено `noSandbox`.
- Три прапорці посилення графіки (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) є необов’язковими й корисні,
  коли контейнери не мають підтримки GPU. Установіть `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  якщо вашому навантаженню потрібен WebGL або інші 3D/browser можливості.
- `--disable-extensions` увімкнено за замовчуванням і його можна вимкнути через
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` для сценаріїв, що залежать від розширень.
- `--renderer-process-limit=2` керується через
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, де `0` зберігає типове значення Chromium.

Якщо вам потрібен інший runtime-профіль, використовуйте власний image browser і надайте
власний entrypoint. Для локальних (неконтейнерних) профілів Chromium використовуйте
`browser.extraArgs`, щоб додати додаткові прапорці запуску.

Типові параметри безпеки:

- `network: "host"` заблоковано.
- `network: "container:<id>"` заблоковано за замовчуванням (ризик обходу через приєднання до простору імен).
- Break-glass перевизначення: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Установлення Docker і контейнеризований gateway описані тут:
[Docker](/uk/install/docker)

Для розгортань Docker gateway `scripts/docker/setup.sh` може bootstrap-нути конфігурацію sandbox.
Установіть `OPENCLAW_SANDBOX=1` (або `true`/`yes`/`on`), щоб увімкнути цей шлях. Ви можете
перевизначити розташування socket через `OPENCLAW_DOCKER_SOCKET`. Повне налаштування та довідник
змінних середовища: [Docker](/uk/install/docker#agent-sandbox).

## setupCommand (одноразове налаштування контейнера)

`setupCommand` виконується **один раз** після створення контейнера sandbox (не під час кожного запуску).
Він виконується всередині контейнера через `sh -lc`.

Шляхи:

- Глобально: `agents.defaults.sandbox.docker.setupCommand`
- На рівні агента: `agents.list[].sandbox.docker.setupCommand`

Поширені підводні камені:

- Типове значення `docker.network` — `"none"` (без egress), тому встановлення пакетів завершиться помилкою.
- `docker.network: "container:<id>"` вимагає `dangerouslyAllowContainerNamespaceJoin: true` і є лише break-glass варіантом.
- `readOnlyRoot: true` забороняє записи; задайте `readOnlyRoot: false` або зберіть власний image.
- Для встановлення пакетів `user` має бути root (не задавайте `user` або задайте `user: "0:0"`).
- Sandbox exec **не** успадковує хостовий `process.env`. Використовуйте
  `agents.defaults.sandbox.docker.env` (або власний image) для API-ключів Skill.

## Політика інструментів + аварійні виходи

Політики allow/deny для інструментів і далі застосовуються до правил sandbox. Якщо інструмент заборонено
глобально або на рівні агента, sandboxing не поверне його назад.

`tools.elevated` — це явний аварійний вихід, який запускає `exec` поза sandbox (`gateway` за замовчуванням або `node`, коли ціль exec — `node`).
Директиви `/exec` застосовуються лише для авторизованих відправників і зберігаються на рівні сесії; щоб жорстко вимкнути
`exec`, використовуйте deny у політиці інструментів (див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)).

Налагодження:

- Використовуйте `openclaw sandbox explain`, щоб переглянути ефективний режим sandbox, політику інструментів і ключі конфігурації для виправлення.
- Див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) для ментальної моделі «чому це заблоковано?».
  Залишайте все максимально закритим.

## Перевизначення для кількох агентів

Кожен агент може перевизначити sandbox та інструменти:
`agents.list[].sandbox` і `agents.list[].tools` (а також `agents.list[].tools.sandbox.tools` для політики інструментів sandbox).
Див. [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools) для пріоритетів.

## Мінімальний приклад увімкнення

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Пов’язана документація

- [OpenShell](/uk/gateway/openshell) -- налаштування керованого sandbox backend, режими workspace та довідник конфігурації
- [Конфігурація sandbox](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження «чому це заблоковано?»
- [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення на рівні агента та пріоритети
- [Безпека](/uk/gateway/security)
