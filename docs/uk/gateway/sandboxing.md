---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Як працює пісочниця OpenClaw: режими, області, доступ до робочого простору та образи'
title: Пісочниця
x-i18n:
    generated_at: "2026-04-05T18:05:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Пісочниця

OpenClaw може запускати **інструменти всередині пісочницьних бекендів**, щоб зменшити радіус ураження.
Це **необов’язково** і керується конфігурацією (`agents.defaults.sandbox` або
`agents.list[].sandbox`). Якщо пісочницю вимкнено, інструменти працюють на хості.
Gateway залишається на хості; виконання інструментів відбувається в ізольованій пісочниці,
коли її ввімкнено.

Це не ідеальна межа безпеки, але вона суттєво обмежує доступ до файлової системи
та процесів, коли модель робить щось нерозумне.

## Що ізолюється в пісочниці

- Виконання інструментів (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` тощо).
- Необов’язковий браузер у пісочниці (`agents.defaults.sandbox.browser`).
  - Типово браузер у пісочниці запускається автоматично (щоб CDP був доступний), коли він потрібен інструменту браузера.
    Налаштовується через `agents.defaults.sandbox.browser.autoStart` і `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Типово контейнери браузера в пісочниці використовують окрему Docker-мережу (`openclaw-sandbox-browser`), а не глобальну мережу `bridge`.
    Налаштовується через `agents.defaults.sandbox.browser.network`.
  - Необов’язковий `agents.defaults.sandbox.browser.cdpSourceRange` обмежує вхідний CDP на межі контейнера через список дозволених CIDR (наприклад `172.21.0.1/32`).
  - Доступ спостерігача noVNC типово захищено паролем; OpenClaw генерує короткоживучий URL із токеном, який віддає локальну bootstrap-сторінку та відкриває noVNC із паролем у фрагменті URL (а не в журналах query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` дозволяє пісочницьним сесіям явно націлюватися на браузер хоста.
  - Необов’язкові списки дозволених обмежують `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Не ізолюються:

- Сам процес Gateway.
- Будь-який інструмент, якому явно дозволено працювати поза пісочницею (наприклад `tools.elevated`).
  - **Elevated exec обходить пісочницю й використовує налаштований шлях виходу (`gateway` типово або `node`, коли ціллю exec є `node`).**
  - Якщо пісочницю вимкнено, `tools.elevated` не змінює виконання (воно і так уже на хості). Див. [Elevated Mode](/tools/elevated).

## Режими

`agents.defaults.sandbox.mode` керує **коли** використовується пісочниця:

- `"off"`: без пісочниці.
- `"non-main"`: ізолювати лише **не-main** сесії (типово, якщо ви хочете звичайні чати на хості).
- `"all"`: кожна сесія працює в пісочниці.
  Примітка: `"non-main"` базується на `session.mainKey` (типово `"main"`), а не на id агента.
  Групові/канальні сесії використовують власні ключі, тому вважаються не-main і будуть ізольовані в пісочниці.

## Область

`agents.defaults.sandbox.scope` керує **скількома контейнерами** буде створено:

- `"agent"` (типово): один контейнер на агента.
- `"session"`: один контейнер на сесію.
- `"shared"`: один контейнер, спільний для всіх сесій у пісочниці.

## Бекенд

`agents.defaults.sandbox.backend` керує **яке середовище виконання** надає пісочницю:

- `"docker"` (типово): локальне середовище пісочниці на основі Docker.
- `"ssh"`: загальне віддалене середовище пісочниці на основі SSH.
- `"openshell"`: середовище пісочниці на основі OpenShell.

Специфічна для SSH конфігурація міститься в `agents.defaults.sandbox.ssh`.
Специфічна для OpenShell конфігурація міститься в `plugins.entries.openshell.config`.

### Вибір бекенда

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Де працює**       | Локальний контейнер              | Будь-який хост із доступом по SSH | Пісочниця під керуванням OpenShell               |
| **Налаштування**    | `scripts/sandbox-setup.sh`       | SSH-ключ + цільовий хост       | Увімкнений плагін OpenShell                         |
| **Модель робочого простору** | Bind mount або копіювання     | Віддалений як канонічний (одноразове ініціалізування) | `mirror` або `remote`            |
| **Керування мережею** | `docker.network` (типово: none) | Залежить від віддаленого хоста | Залежить від OpenShell                              |
| **Браузер у пісочниці** | Підтримується                | Не підтримується               | Поки що не підтримується                            |
| **Bind mount**      | `docker.binds`                   | Н/Д                            | Н/Д                                                 |
| **Найкраще для**    | Локальна розробка, повна ізоляція | Винесення на віддалену машину | Керовані віддалені пісочниці з необов’язковою двосторонньою синхронізацією |

### Бекенд SSH

Використовуйте `backend: "ssh"`, коли хочете, щоб OpenClaw ізолював у пісочниці `exec`, файлові інструменти й читання медіа
на довільній машині, доступній через SSH.

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
          // Або використовуйте SecretRef / вбудований вміст замість локальних файлів:
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

- OpenClaw створює віддалений корінь для кожної області в `sandbox.ssh.workspaceRoot`.
- Під час першого використання після створення або повторного створення OpenClaw один раз ініціалізує цей віддалений робочий простір із локального.
- Після цього `exec`, `read`, `write`, `edit`, `apply_patch`, читання медіа під час prompt і staging вхідних медіа працюють безпосередньо з віддаленим робочим простором через SSH.
- OpenClaw не синхронізує віддалені зміни назад у локальний робочий простір автоматично.

Матеріал автентифікації:

- `identityFile`, `certificateFile`, `knownHostsFile`: використовують наявні локальні файли й передають їх через конфігурацію OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: використовують вбудовані рядки або SecretRef. OpenClaw розв’язує їх через звичайний runtime snapshot секретів, записує їх у тимчасові файли з правами `0600` і видаляє, коли SSH-сесія завершується.
- Якщо для одного елемента задано і `*File`, і `*Data`, для цієї SSH-сесії переважає `*Data`.

Це модель **віддалений як канонічний**. Після початкового seed віддалений робочий простір SSH стає реальним станом пісочниці.

Важливі наслідки:

- Локальні зміни на хості, зроблені поза OpenClaw після кроку seed, не будуть видимі віддалено, доки ви не відтворите пісочницю.
- `openclaw sandbox recreate` видаляє віддалений корінь для кожної області й повторно ініціалізує його з локального під час наступного використання.
- Браузер у пісочниці не підтримується в бекенді SSH.
- Налаштування `sandbox.docker.*` не застосовуються до бекенда SSH.

### Бекенд OpenShell

Використовуйте `backend: "openshell"`, коли хочете, щоб OpenClaw запускав інструменти в пісочниці
у віддаленому середовищі під керуванням OpenShell. Повний посібник із налаштування,
довідник конфігурації та порівняння режимів робочого простору див. на окремій
[сторінці OpenShell](/gateway/openshell).

OpenShell повторно використовує той самий базовий SSH-транспорт і міст віддаленої файлової системи, що й
загальний бекенд SSH, і додає специфічний для OpenShell життєвий цикл
(`sandbox create/get/delete`, `sandbox ssh-config`) плюс необов’язковий режим робочого простору `mirror`.

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

- `mirror` (типово): локальний робочий простір залишається канонічним. OpenClaw синхронізує локальні файли в OpenShell перед exec і синхронізує віддалений робочий простір назад після exec.
- `remote`: після створення пісочниці робочий простір OpenShell стає канонічним. OpenClaw один раз ініціалізує віддалений робочий простір із локального, а потім файлові інструменти й exec працюють безпосередньо з віддаленою пісочницею без синхронізації змін назад.

Докладно про віддалений транспорт:

- OpenClaw запитує в OpenShell специфічну для пісочниці конфігурацію SSH через `openshell sandbox ssh-config <name>`.
- Core записує цю конфігурацію SSH у тимчасовий файл, відкриває SSH-сесію й повторно використовує той самий міст віддаленої файлової системи, що й `backend: "ssh"`.
- У режимі `mirror` відрізняється лише життєвий цикл: синхронізація локального у віддалений простір перед exec, а потім назад після exec.

Поточні обмеження OpenShell:

- браузер у пісочниці поки що не підтримується
- `sandbox.docker.binds` не підтримується в бекенді OpenShell
- специфічні для Docker параметри runtime у `sandbox.docker.*` і далі застосовуються лише до бекенда Docker

#### Режими робочого простору

OpenShell має дві моделі робочого простору. На практиці це найважливіша частина.

##### `mirror`

Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, коли хочете, щоб **локальний робочий простір залишався канонічним**.

Поведінка:

- Перед `exec` OpenClaw синхронізує локальний робочий простір у пісочницю OpenShell.
- Після `exec` OpenClaw синхронізує віддалений робочий простір назад у локальний.
- Файлові інструменти все одно працюють через міст пісочниці, але між ходами джерелом істини лишається локальний робочий простір.

Використовуйте це, коли:

- ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично з’являлися в пісочниці
- ви хочете, щоб пісочниця OpenShell поводилася якомога більше як бекенд Docker
- ви хочете, щоб робочий простір хоста відображав записи з пісочниці після кожного ходу exec

Компроміс:

- додаткова вартість синхронізації до й після exec

##### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, коли хочете, щоб **робочий простір OpenShell став канонічним**.

Поведінка:

- Коли пісочницю вперше створено, OpenClaw один раз ініціалізує віддалений робочий простір із локального.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють безпосередньо з віддаленим робочим простором OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний робочий простір після exec.
- Читання медіа під час prompt і далі працюють, тому що файлові та медіаінструменти читають через міст пісочниці, а не припускають локальний шлях хоста.
- Транспорт — це SSH до пісочниці OpenShell, повернутої `openshell sandbox ssh-config`.

Важливі наслідки:

- Якщо ви редагуєте файли на хості поза OpenClaw після кроку seed, віддалена пісочниця **не** побачить ці зміни автоматично.
- Якщо пісочницю відтворити, віддалений робочий простір знову ініціалізується з локального.
- При `scope: "agent"` або `scope: "shared"` цей віддалений робочий простір спільний у межах тієї самої області.

Використовуйте це, коли:

- пісочниця має переважно жити на віддаленому боці OpenShell
- ви хочете зменшити накладні витрати на синхронізацію в кожному ході
- ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленої пісочниці

Вибирайте `mirror`, якщо сприймаєте пісочницю як тимчасове середовище виконання.
Вибирайте `remote`, якщо сприймаєте пісочницю як справжній робочий простір.

#### Життєвий цикл OpenShell

Пісочниці OpenShell і далі керуються через звичайний життєвий цикл пісочниці:

- `openclaw sandbox list` показує середовища OpenShell так само, як і середовища Docker
- `openclaw sandbox recreate` видаляє поточне середовище виконання і дозволяє OpenClaw відтворити його під час наступного використання
- логіка очищення теж враховує бекенд

Для режиму `remote` recreate особливо важливий:

- recreate видаляє канонічний віддалений робочий простір для цієї області
- наступне використання ініціалізує новий віддалений робочий простір із локального

Для режиму `mirror` recreate головним чином скидає віддалене середовище виконання,
тому що локальний робочий простір у будь-якому разі лишається канонічним.

## Доступ до робочого простору

`agents.defaults.sandbox.workspaceAccess` керує **що саме може бачити пісочниця**:

- `"none"` (типово): інструменти бачать робочий простір пісочниці в `~/.openclaw/sandboxes`.
- `"ro"`: монтує робочий простір агента лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`).
- `"rw"`: монтує робочий простір агента для читання/запису в `/workspace`.

У бекенді OpenShell:

- режим `mirror` і далі використовує локальний робочий простір як канонічне джерело між ходами exec
- режим `remote` після початкового seed використовує віддалений робочий простір OpenShell як канонічне джерело
- `workspaceAccess: "ro"` і `"none"` і далі так само обмежують запис

Вхідні медіа копіюються в активний робочий простір пісочниці (`media/inbound/*`).
Примітка щодо Skills: інструмент `read` прив’язаний до кореня пісочниці. При `workspaceAccess: "none"`
OpenClaw віддзеркалює придатні Skills у робочий простір пісочниці (`.../skills`), щоб
їх можна було читати. При `"rw"` skills робочого простору доступні для читання з
`/workspace/skills`.

## Користувацькі bind mount

`agents.defaults.sandbox.docker.binds` монтує додаткові каталоги хоста в контейнер.
Формат: `host:container:mode` (наприклад `"/home/user/source:/source:rw"`).

Глобальні bind і bind для окремого агента **об’єднуються** (а не замінюються). За `scope: "shared"` bind для окремого агента ігноруються.

`agents.defaults.sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер **браузера в пісочниці**.

- Якщо задано (включно з `[]`), він замінює `agents.defaults.sandbox.docker.binds` для контейнера браузера.
- Якщо пропущено, контейнер браузера повертається до `agents.defaults.sandbox.docker.binds` (зворотна сумісність).

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

- Bind обходять файлову систему пісочниці: вони відкривають шляхи хоста з тим режимом, який ви задали (`:ro` або `:rw`).
- OpenClaw блокує небезпечні джерела bind (наприклад: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` і батьківські mount, які відкрили б до них доступ).
- OpenClaw також блокує типові корені домашніх каталогів з обліковими даними, як-от `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` і `~/.ssh`.
- Перевірка bind — це не просто зіставлення рядків. OpenClaw нормалізує шлях джерела, потім знову розв’язує його через найглибшого наявного предка перед повторною перевіркою заблокованих шляхів і дозволених коренів.
- Це означає, що вихід через батьківські symlink усе одно безпечно блокується, навіть коли фінальний лист ще не існує. Приклад: `/workspace/run-link/new-file` усе одно розв’язується як `/var/run/...`, якщо `run-link` вказує туди.
- Дозволені корені джерел канонізуються так само, тому шлях, який лише виглядає таким, що входить до allowlist до розв’язання symlink, усе одно буде відхилений як `outside allowed roots`.
- Чутливі mount (секрети, SSH-ключі, сервісні облікові дані) мають бути `:ro`, якщо це не абсолютно необхідно.
- Поєднуйте з `workspaceAccess: "ro"`, якщо вам потрібен лише доступ для читання до робочого простору; режими bind залишаються незалежними.
- Див. [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) щодо того, як bind взаємодіють із політикою інструментів і elevated exec.

## Образи та налаштування

Типовий образ Docker: `openclaw-sandbox:bookworm-slim`

Зберіть його один раз:

```bash
scripts/sandbox-setup.sh
```

Примітка: типовий образ **не** містить Node. Якщо skill потребує Node (або
інших runtime), або створіть власний образ, або встановіть через
`sandbox.docker.setupCommand` (потрібні network egress + доступний для запису root +
користувач root).

Якщо ви хочете функціональніший образ пісочниці з поширеними інструментами (наприклад
`curl`, `jq`, `nodejs`, `python3`, `git`), зберіть:

```bash
scripts/sandbox-common-setup.sh
```

Потім установіть `agents.defaults.sandbox.docker.image` у
`openclaw-sandbox-common:bookworm-slim`.

Образ браузера в пісочниці:

```bash
scripts/sandbox-browser-setup.sh
```

Типово контейнери Docker-пісочниці працюють **без мережі**.
Перевизначити це можна через `agents.defaults.sandbox.docker.network`.

Вбудований образ браузера в пісочниці також застосовує консервативні типові параметри запуску Chromium
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
- `--no-sandbox` і `--disable-setuid-sandbox`, коли ввімкнено `noSandbox`.
- Три прапори зміцнення графіки (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) необов’язкові й корисні,
  коли контейнери не мають підтримки GPU. Установіть `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  якщо вашому навантаженню потрібен WebGL або інші 3D/браузерні можливості.
- `--disable-extensions` типово ввімкнено й може бути вимкнено через
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` для потоків, що залежать від розширень.
- `--renderer-process-limit=2` керується через
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, де `0` зберігає типове значення Chromium.

Якщо вам потрібен інший профіль runtime, використовуйте власний образ браузера й надайте
власний entrypoint. Для локальних (не контейнерних) профілів Chromium використовуйте
`browser.extraArgs`, щоб додати додаткові прапори запуску.

Типові параметри безпеки:

- `network: "host"` заблоковано.
- `network: "container:<id>"` типово заблоковано (ризик обходу через приєднання до namespace).
- Аварійне перевизначення: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Установлення Docker і контейнеризований gateway описані тут:
[Docker](/install/docker)

Для розгортань gateway у Docker `scripts/docker/setup.sh` може ініціалізувати конфігурацію пісочниці.
Установіть `OPENCLAW_SANDBOX=1` (або `true`/`yes`/`on`), щоб увімкнути цей шлях. Ви можете
перевизначити розташування сокета через `OPENCLAW_DOCKER_SOCKET`. Повне налаштування й довідник
змінних середовища: [Docker](/install/docker#agent-sandbox).

## setupCommand (одноразове налаштування контейнера)

`setupCommand` запускається **один раз** після створення контейнера пісочниці (не під час кожного запуску).
Він виконується всередині контейнера через `sh -lc`.

Шляхи:

- Глобально: `agents.defaults.sandbox.docker.setupCommand`
- Для окремого агента: `agents.list[].sandbox.docker.setupCommand`

Поширені пастки:

- Типове `docker.network` має значення `"none"` (без egress), тож установлення пакетів завершиться помилкою.
- `docker.network: "container:<id>"` вимагає `dangerouslyAllowContainerNamespaceJoin: true` і призначене лише для аварійного використання.
- `readOnlyRoot: true` забороняє запис; установіть `readOnlyRoot: false` або створіть власний образ.
- Для встановлення пакетів `user` має бути root (пропустіть `user` або задайте `user: "0:0"`).
- Sandbox exec **не** успадковує `process.env` хоста. Використовуйте
  `agents.defaults.sandbox.docker.env` (або власний образ) для API keys skill.

## Політика інструментів і шляхи обходу

Політики allow/deny для інструментів і далі застосовуються до правил пісочниці. Якщо інструмент заборонено
глобально або для окремого агента, пісочниця його не поверне.

`tools.elevated` — це явний шлях обходу, який запускає `exec` поза пісочницею (`gateway` типово або `node`, коли ціллю exec є `node`).
Директиви `/exec` застосовуються лише для авторизованих відправників і зберігаються для кожної сесії; щоб жорстко вимкнути
`exec`, використовуйте deny у політиці інструментів (див. [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Налагодження:

- Використовуйте `openclaw sandbox explain`, щоб перевірити ефективний режим пісочниці, політику інструментів і ключі конфігурації для виправлення.
- Див. [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) для ментальної моделі “чому це заблоковано?”.
  Тримайте все жорстко закритим.

## Перевизначення для кількох агентів

Кожен агент може перевизначати пісочницю й інструменти:
`agents.list[].sandbox` і `agents.list[].tools` (плюс `agents.list[].tools.sandbox.tools` для політики інструментів у пісочниці).
Див. [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) щодо пріоритетів.

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

- [OpenShell](/gateway/openshell) -- налаштування керованого бекенда пісочниці, режими робочого простору та довідник конфігурації
- [Конфігурація пісочниці](/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження “чому це заблоковано?”
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів і пріоритети
- [Security](/gateway/security)
