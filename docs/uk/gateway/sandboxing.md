---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Як працює пісочниця OpenClaw: режими, області дії, доступ до робочого простору та зображення'
title: Пісочниця
x-i18n:
    generated_at: "2026-04-20T18:29:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Пісочниця

OpenClaw може запускати **інструменти всередині бекендів пісочниці**, щоб зменшити радіус ураження.
Це **необов’язково** і керується конфігурацією (`agents.defaults.sandbox` або
`agents.list[].sandbox`). Якщо пісочницю вимкнено, інструменти запускаються на хості.
Gateway залишається на хості; виконання інструментів відбувається в ізольованій пісочниці,
коли її ввімкнено.

Це не є ідеальною межею безпеки, але суттєво обмежує доступ до файлової системи
та процесів, коли модель робить щось необачне.

## Що поміщається в пісочницю

- Виконання інструментів (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` тощо).
- Необов’язковий браузер у пісочниці (`agents.defaults.sandbox.browser`).
  - За замовчуванням браузер у пісочниці запускається автоматично (щоб CDP був доступний), коли він потрібен інструменту браузера.
    Налаштовується через `agents.defaults.sandbox.browser.autoStart` і `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - За замовчуванням контейнери браузера в пісочниці використовують виділену мережу Docker (`openclaw-sandbox-browser`) замість глобальної мережі `bridge`.
    Налаштовується через `agents.defaults.sandbox.browser.network`.
  - Необов’язковий параметр `agents.defaults.sandbox.browser.cdpSourceRange` обмежує вхідний доступ до CDP на межі контейнера за допомогою списку дозволених CIDR (наприклад, `172.21.0.1/32`).
  - Доступ спостерігача noVNC за замовчуванням захищений паролем; OpenClaw генерує короткочасний URL із токеном, який віддає локальну bootstrap-сторінку та відкриває noVNC з паролем у фрагменті URL (а не в логах query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` дозволяє сесіям у пісочниці явно націлюватися на браузер хоста.
  - Необов’язкові списки дозволених значень обмежують `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Не поміщається в пісочницю:

- Сам процес Gateway.
- Будь-який інструмент, якому явно дозволено працювати поза пісочницею (наприклад, `tools.elevated`).
  - **Elevated exec обходить пісочницю і використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль exec — `node`).**
  - Якщо пісочницю вимкнено, `tools.elevated` не змінює виконання (воно й так на хості). Див. [Режим Elevated](/uk/tools/elevated).

## Режими

`agents.defaults.sandbox.mode` керує **тим, коли** використовується пісочниця:

- `"off"`: без пісочниці.
- `"non-main"`: пісочниця лише для **не-main** сесій (типово, якщо ви хочете, щоб звичайні чати працювали на хості).
- `"all"`: кожна сесія запускається в пісочниці.
  Примітка: `"non-main"` базується на `session.mainKey` (типово `"main"`), а не на id агента.
  Сесії груп/каналів мають власні ключі, тому вважаються не-main і будуть у пісочниці.

## Область дії

`agents.defaults.sandbox.scope` керує **тим, скільки контейнерів** створюється:

- `"agent"` (типово): один контейнер на агента.
- `"session"`: один контейнер на сесію.
- `"shared"`: один контейнер, спільний для всіх сесій у пісочниці.

## Бекенд

`agents.defaults.sandbox.backend` керує **тим, яке середовище виконання** надає пісочницю:

- `"docker"` (типово, коли пісочницю ввімкнено): локальне середовище пісочниці на основі Docker.
- `"ssh"`: універсальне віддалене середовище пісочниці на основі SSH.
- `"openshell"`: середовище пісочниці на основі OpenShell.

Конфігурація, специфічна для SSH, розташована в `agents.defaults.sandbox.ssh`.
Конфігурація, специфічна для OpenShell, розташована в `plugins.entries.openshell.config`.

### Вибір бекенда

|                     | Docker                           | SSH                            | OpenShell                                                  |
| ------------------- | -------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| **Де працює**       | Локальний контейнер              | Будь-який хост, доступний по SSH | Пісочниця під керуванням OpenShell                        |
| **Налаштування**    | `scripts/sandbox-setup.sh`       | Ключ SSH + цільовий хост       | Увімкнений Plugin OpenShell                                |
| **Модель workspace** | Bind-mount або копіювання        | Віддалений canonical (одноразове початкове заповнення) | `mirror` або `remote`                         |
| **Керування мережею** | `docker.network` (типово: none) | Залежить від віддаленого хоста | Залежить від OpenShell                                     |
| **Браузер у пісочниці** | Підтримується                | Не підтримується               | Ще не підтримується                                        |
| **Bind mounts**     | `docker.binds`                   | Н/Д                            | Н/Д                                                        |
| **Найкраще для**    | Локальна розробка, повна ізоляція | Вивантаження на віддалену машину | Керовані віддалені пісочниці з необов’язковою двосторонньою синхронізацією |

### Бекенд Docker

Пісочниця за замовчуванням вимкнена. Якщо ви вмикаєте пісочницю і не вибираєте
бекенд, OpenClaw використовує бекенд Docker. Він виконує інструменти й браузери
в пісочниці локально через сокет демона Docker (`/var/run/docker.sock`). Ізоляція
контейнера пісочниці визначається просторами імен Docker.

**Обмеження Docker-out-of-Docker (DooD)**:
Якщо ви розгортаєте сам Gateway OpenClaw як контейнер Docker, він оркеструє сусідні контейнери пісочниці через Docker-сокет хоста (DooD). Це створює конкретне обмеження на зіставлення шляхів:

- **Конфігурація вимагає шляхів хоста**: конфігурація `workspace` у `openclaw.json` МАЄ містити **абсолютний шлях хоста** (наприклад, `/home/user/.openclaw/workspaces`), а не внутрішній шлях контейнера Gateway. Коли OpenClaw просить демон Docker запустити пісочницю, демон оцінює шляхи відносно простору імен ОС хоста, а не простору імен Gateway.
- **Паритет FS Bridge (ідентичне зіставлення томів)**: нативний процес Gateway OpenClaw також записує файли Heartbeat і bridge до каталогу `workspace`. Оскільки Gateway оцінює той самий рядок (шлях хоста) зі свого контейнеризованого середовища, розгортання Gateway МАЄ включати ідентичне зіставлення томів, яке нативно пов’язує простір імен хоста (`-v /home/user/.openclaw:/home/user/.openclaw`).

Якщо ви зіставляєте шляхи внутрішньо без абсолютного паритету з хостом, OpenClaw нативно викидає помилку дозволів `EACCES`, намагаючись записати свій Heartbeat усередині контейнеризованого середовища, тому що повний рядок шляху нативно не існує.

### Бекенд SSH

Використовуйте `backend: "ssh"`, якщо хочете, щоб OpenClaw ізолював `exec`, файлові інструменти та читання медіа
на довільній машині, доступній по SSH.

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
          // Or use SecretRefs / inline contents instead of local files:
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

- OpenClaw створює віддалений корінь для кожної області дії в `sandbox.ssh.workspaceRoot`.
- Під час першого використання після створення або повторного створення OpenClaw один раз заповнює цей віддалений workspace з локального workspace.
- Після цього `exec`, `read`, `write`, `edit`, `apply_patch`, читання медіа з prompt і staging вхідних медіа працюють безпосередньо з віддаленим workspace через SSH.
- OpenClaw не синхронізує віддалені зміни назад у локальний workspace автоматично.

Матеріали автентифікації:

- `identityFile`, `certificateFile`, `knownHostsFile`: використовують наявні локальні файли та передають їх через конфігурацію OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: використовують вбудовані рядки або SecretRefs. OpenClaw розв’язує їх через звичайний runtime snapshot секретів, записує у тимчасові файли з правами `0600` і видаляє, коли SSH-сесія завершується.
- Якщо для одного й того самого елемента задано і `*File`, і `*Data`, то для цієї SSH-сесії пріоритет має `*Data`.

Це модель **remote-canonical**. Віддалений workspace SSH стає реальним станом пісочниці після початкового заповнення.

Важливі наслідки:

- Локальні редагування на хості, зроблені поза OpenClaw після етапу початкового заповнення, не будуть видимі віддалено, доки ви не створите пісочницю заново.
- `openclaw sandbox recreate` видаляє віддалений корінь для кожної області дії та знову заповнює його з локального під час наступного використання.
- Браузер у пісочниці не підтримується в бекенді SSH.
- Налаштування `sandbox.docker.*` не застосовуються до бекенда SSH.

### Бекенд OpenShell

Використовуйте `backend: "openshell"`, якщо хочете, щоб OpenClaw ізолював інструменти у
віддаленому середовищі під керуванням OpenShell. Повний посібник із налаштування,
довідник з конфігурації та порівняння режимів workspace дивіться на окремій
[сторінці OpenShell](/uk/gateway/openshell).

OpenShell повторно використовує той самий базовий транспорт SSH і міст віддаленої файлової системи, що й
універсальний бекенд SSH, і додає життєвий цикл, специфічний для OpenShell,
(`sandbox create/get/delete`, `sandbox ssh-config`), а також необов’язковий режим workspace `mirror`.

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

- `mirror` (типово): локальний workspace залишається canonical. OpenClaw синхронізує локальні файли в OpenShell перед exec і синхронізує віддалений workspace назад після exec.
- `remote`: workspace OpenShell стає canonical після створення пісочниці. OpenClaw один раз заповнює віддалений workspace з локального, після чого файлові інструменти та exec працюють безпосередньо з віддаленою пісочницею без синхронізації змін назад.

Деталі віддаленого транспорту:

- OpenClaw запитує в OpenShell SSH-конфігурацію, специфічну для пісочниці, через `openshell sandbox ssh-config <name>`.
- Core записує цю SSH-конфігурацію у тимчасовий файл, відкриває SSH-сесію та повторно використовує той самий міст віддаленої файлової системи, що використовується для `backend: "ssh"`.
- Лише в режимі `mirror` життєвий цикл відрізняється: синхронізація з локального на віддалений перед exec, а потім синхронізація назад після exec.

Поточні обмеження OpenShell:

- браузер у пісочниці ще не підтримується
- `sandbox.docker.binds` не підтримується в бекенді OpenShell
- специфічні для Docker параметри runtime в `sandbox.docker.*`, як і раніше, застосовуються лише до бекенда Docker

#### Режими workspace

OpenShell має дві моделі workspace. На практиці це найважливіша частина.

##### `mirror`

Використовуйте `plugins.entries.openshell.config.mode: "mirror"`, якщо хочете, щоб **локальний workspace залишався canonical**.

Поведінка:

- Перед `exec` OpenClaw синхронізує локальний workspace у пісочницю OpenShell.
- Після `exec` OpenClaw синхронізує віддалений workspace назад у локальний workspace.
- Файлові інструменти все ще працюють через міст пісочниці, але локальний workspace залишається джерелом істини між ходами.

Використовуйте це, коли:

- ви редагуєте файли локально поза OpenClaw і хочете, щоб ці зміни автоматично з’являлися в пісочниці
- ви хочете, щоб пісочниця OpenShell поводилася максимально схоже на бекенд Docker
- ви хочете, щоб workspace хоста відображав записи пісочниці після кожного ходу exec

Компроміс:

- додаткові витрати на синхронізацію до і після exec

##### `remote`

Використовуйте `plugins.entries.openshell.config.mode: "remote"`, якщо хочете, щоб **workspace OpenShell став canonical**.

Поведінка:

- Коли пісочниця створюється вперше, OpenClaw один раз заповнює віддалений workspace з локального workspace.
- Після цього `exec`, `read`, `write`, `edit` і `apply_patch` працюють безпосередньо з віддаленим workspace OpenShell.
- OpenClaw **не** синхронізує віддалені зміни назад у локальний workspace після exec.
- Читання медіа під час prompt, як і раніше, працює, тому що файлові та медіа-інструменти читають через міст пісочниці, а не припускають наявність локального шляху хоста.
- Транспорт — це SSH у пісочницю OpenShell, яку повертає `openshell sandbox ssh-config`.

Важливі наслідки:

- Якщо ви редагуєте файли на хості поза OpenClaw після етапу початкового заповнення, віддалена пісочниця **не** побачить ці зміни автоматично.
- Якщо пісочницю створити заново, віддалений workspace знову заповнюється з локального workspace.
- За `scope: "agent"` або `scope: "shared"` цей віддалений workspace спільно використовується в межах тієї самої області дії.

Використовуйте це, коли:

- пісочниця має переважно жити на віддаленому боці OpenShell
- ви хочете менші накладні витрати на синхронізацію в кожному ході
- ви не хочете, щоб локальні редагування на хості непомітно перезаписували стан віддаленої пісочниці

Вибирайте `mirror`, якщо ви сприймаєте пісочницю як тимчасове середовище виконання.
Вибирайте `remote`, якщо ви сприймаєте пісочницю як реальний workspace.

#### Життєвий цикл OpenShell

Пісочниці OpenShell, як і раніше, керуються через звичайний життєвий цикл пісочниці:

- `openclaw sandbox list` показує середовища виконання OpenShell так само, як і середовища Docker
- `openclaw sandbox recreate` видаляє поточне середовище виконання і дозволяє OpenClaw створити його знову під час наступного використання
- логіка очищення теж враховує бекенд

Для режиму `remote` повторне створення особливо важливе:

- повторне створення видаляє canonical віддалений workspace для цієї області дії
- наступне використання заповнює новий віддалений workspace з локального workspace

Для режиму `mirror` повторне створення головним чином скидає віддалене середовище виконання,
оскільки локальний workspace у будь-якому разі залишається canonical.

## Доступ до workspace

`agents.defaults.sandbox.workspaceAccess` керує **тим, що може бачити пісочниця**:

- `"none"` (типово): інструменти бачать workspace пісочниці в `~/.openclaw/sandboxes`.
- `"ro"`: монтує workspace агента лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`).
- `"rw"`: монтує workspace агента для читання і запису в `/workspace`.

З бекендом OpenShell:

- режим `mirror`, як і раніше, використовує локальний workspace як canonical джерело між ходами exec
- режим `remote` використовує віддалений workspace OpenShell як canonical джерело після початкового заповнення
- `workspaceAccess: "ro"` і `"none"` однаково обмежують запис

Вхідні медіа копіюються в активний workspace пісочниці (`media/inbound/*`).
Примітка щодо Skills: інструмент `read` прив’язаний до кореня пісочниці. За `workspaceAccess: "none"`
OpenClaw віддзеркалює відповідні Skills у workspace пісочниці (`.../skills`), щоб
їх можна було читати. За `"rw"` Skills workspace доступні для читання з
`/workspace/skills`.

## Власні bind mounts

`agents.defaults.sandbox.docker.binds` монтує додаткові каталоги хоста в контейнер.
Формат: `host:container:mode` (наприклад, `"/home/user/source:/source:rw"`).

Глобальні та поагентні bind mounts **об’єднуються** (а не замінюються). За `scope: "shared"` bind mounts на рівні агента ігноруються.

`agents.defaults.sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер **браузера пісочниці**.

- Якщо задано (зокрема `[]`), воно замінює `agents.defaults.sandbox.docker.binds` для контейнера браузера.
- Якщо пропущено, контейнер браузера повертається до `agents.defaults.sandbox.docker.binds` (зворотна сумісність).

Приклад (вихідний код лише для читання + додатковий каталог даних):

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

- Bind mounts обходять файлову систему пісочниці: вони відкривають шляхи хоста з тим режимом, який ви вкажете (`:ro` або `:rw`).
- OpenClaw блокує небезпечні джерела bind mounts (наприклад: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` і батьківські монтування, які відкрили б до них доступ).
- OpenClaw також блокує типові кореневі каталоги облікових даних у домашньому каталозі, такі як `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` і `~/.ssh`.
- Перевірка bind mounts — це не просто зіставлення рядків. OpenClaw нормалізує шлях джерела, а потім знову розв’язує його через найглибший наявний батьківський елемент перед повторною перевіркою заблокованих шляхів і дозволених коренів.
- Це означає, що виходи через батьківські symlink-и все одно надійно блокуються, навіть якщо кінцевий leaf ще не існує. Приклад: `/workspace/run-link/new-file` усе одно розв’язується як `/var/run/...`, якщо `run-link` вказує туди.
- Дозволені корені джерел канонікалізуються так само, тому шлях, який лише виглядає таким, що входить до allowlist до розв’язання symlink-ів, однаково відхиляється як `outside allowed roots`.
- Чутливі монтування (секрети, SSH-ключі, службові облікові дані) мають бути `:ro`, якщо тільки це не є абсолютно необхідним.
- Поєднуйте з `workspaceAccess: "ro"`, якщо вам потрібен лише доступ на читання до workspace; режими bind mounts залишаються незалежними.
- Див. [Пісочниця vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated), щоб зрозуміти, як bind mounts взаємодіють із політикою інструментів і elevated exec.

## Образи + налаштування

Типовий образ Docker: `openclaw-sandbox:bookworm-slim`

Зберіть його один раз:

```bash
scripts/sandbox-setup.sh
```

Примітка: типовий образ **не** містить Node. Якщо Skill потребує Node (або
інших runtime), або створіть власний образ, або встановіть їх через
`sandbox.docker.setupCommand` (потребує виходу в мережу + кореневої файлової системи з можливістю запису +
користувача root).

Якщо вам потрібен функціональніший образ пісочниці зі звичними інструментами (наприклад
`curl`, `jq`, `nodejs`, `python3`, `git`), зберіть:

```bash
scripts/sandbox-common-setup.sh
```

Потім задайте `agents.defaults.sandbox.docker.image` як
`openclaw-sandbox-common:bookworm-slim`.

Образ браузера в пісочниці:

```bash
scripts/sandbox-browser-setup.sh
```

За замовчуванням контейнери пісочниці Docker працюють **без мережі**.
Перевизначте це через `agents.defaults.sandbox.docker.network`.

Вбудований образ браузера для пісочниці також застосовує консервативні типові параметри запуску Chromium
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
- Три прапорці посилення графічної безпеки (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) є необов’язковими і корисні,
  коли контейнери не мають підтримки GPU. Задайте `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  якщо вашому навантаженню потрібен WebGL або інші 3D/браузерні можливості.
- `--disable-extensions` увімкнено за замовчуванням і його можна вимкнути через
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` для сценаріїв, які залежать від розширень.
- `--renderer-process-limit=2` керується через
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, де `0` зберігає типовий режим Chromium.

Якщо вам потрібен інший профіль runtime, використовуйте власний образ браузера і надайте
власний entrypoint. Для локальних профілів Chromium (не в контейнері) використовуйте
`browser.extraArgs`, щоб додати додаткові прапорці запуску.

Типові параметри безпеки:

- `network: "host"` заблоковано.
- `network: "container:<id>"` за замовчуванням заблоковано (ризик обходу через приєднання до namespace).
- Аварійний override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Установлення Docker і контейнеризований gateway описані тут:
[Docker](/uk/install/docker)

Для розгортань Gateway у Docker `scripts/docker/setup.sh` може ініціалізувати конфігурацію пісочниці.
Задайте `OPENCLAW_SANDBOX=1` (або `true`/`yes`/`on`), щоб увімкнути цей шлях. Ви можете
перевизначити розташування сокета через `OPENCLAW_DOCKER_SOCKET`. Повне налаштування та довідник
зі змінних середовища: [Docker](/uk/install/docker#agent-sandbox).

## setupCommand (одноразове налаштування контейнера)

`setupCommand` запускається **один раз** після створення контейнера пісочниці (не під час кожного запуску).
Він виконується всередині контейнера через `sh -lc`.

Шляхи:

- Глобально: `agents.defaults.sandbox.docker.setupCommand`
- Для агента: `agents.list[].sandbox.docker.setupCommand`

Типові помилки:

- Типове значення `docker.network` — `"none"` (без виходу в мережу), тому встановлення пакетів завершуватиметься помилкою.
- `docker.network: "container:<id>"` вимагає `dangerouslyAllowContainerNamespaceJoin: true` і призначене лише для аварійного використання.
- `readOnlyRoot: true` забороняє запис; задайте `readOnlyRoot: false` або створіть власний образ.
- Для встановлення пакетів `user` має бути root (не вказуйте `user` або задайте `user: "0:0"`).
- Sandbox exec **не** успадковує host `process.env`. Використовуйте
  `agents.defaults.sandbox.docker.env` (або власний образ) для API-ключів Skills.

## Політика інструментів + шляхи обходу

Політики allow/deny для інструментів, як і раніше, застосовуються до правил пісочниці. Якщо інструмент заборонено
глобально або для конкретного агента, пісочниця його не поверне.

`tools.elevated` — це явний шлях обходу, який запускає `exec` поза пісочницею (`gateway` за замовчуванням або `node`, коли ціль exec — `node`).
Директиви `/exec` застосовуються лише до авторизованих відправників і зберігаються для кожної сесії; щоб повністю вимкнути
`exec`, використовуйте deny у політиці інструментів (див. [Пісочниця vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated)).

Налагодження:

- Використовуйте `openclaw sandbox explain`, щоб переглянути ефективний режим пісочниці, політику інструментів і конфігураційні ключі для виправлення.
- Див. [Пісочниця vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) для ментальної моделі “чому це заблоковано?”.
  Тримайте все жорстко заблокованим.

## Перевизначення для кількох агентів

Кожен агент може перевизначати пісочницю й інструменти:
`agents.list[].sandbox` і `agents.list[].tools` (а також `agents.list[].tools.sandbox.tools` для політики інструментів у пісочниці).
Докладніше про пріоритети див. у [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools).

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

- [OpenShell](/uk/gateway/openshell) -- налаштування керованого бекенда пісочниці, режими workspace і довідник з конфігурації
- [Конфігурація пісочниці](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- [Пісочниця vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження “чому це заблоковано?”
- [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів і пріоритети
- [Безпека](/uk/gateway/security)
