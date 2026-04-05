---
read_when:
    - Налаштування SecretRef для облікових даних провайдера та посилань у `auth-profiles.json`
    - Безпечне керування перезавантаженням, аудитом, налаштуванням і застосуванням секретів у production
    - Розуміння швидкого завершення під час запуску, фільтрації неактивних поверхонь і поведінки останнього відомого робочого стану
summary: 'Керування секретами: контракт SecretRef, поведінка runtime-знімка та безпечне односпрямоване очищення'
title: Керування секретами
x-i18n:
    generated_at: "2026-04-05T18:05:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# Керування секретами

OpenClaw підтримує адитивні SecretRef, щоб підтримувані облікові дані не потрібно було зберігати у відкритому вигляді в конфігурації.

Відкритий текст усе ще працює. SecretRef — це необов’язковий механізм для кожного окремого облікового даного.

## Цілі та модель runtime

Секрети визначаються в runtime-знімок у пам’яті.

- Визначення виконується eagerly під час активації, а не ліниво в шляхах запитів.
- Під час запуску відбувається швидке завершення, якщо ефективно активний SecretRef не вдається визначити.
- Перезавантаження використовує атомарну заміну: або повний успіх, або збереження останнього відомого робочого знімка.
- Порушення політики SecretRef (наприклад, профілі автентифікації в режимі OAuth у поєднанні з вхідними даними SecretRef) призводять до відмови активації до заміни runtime-знімка.
- Runtime-запити читають лише з активного знімка в пам’яті.
- Після першого успішного завантаження/активації конфігурації код runtime продовжує читати цей активний знімок у пам’яті, доки успішне перезавантаження не замінить його.
- Шляхи вихідної доставки також читають з цього активного знімка (наприклад, доставка відповідей/тредів Discord і надсилання дій Telegram); вони не перевизначають SecretRef заново для кожного надсилання.

Це дозволяє не виносити збої постачальника секретів на гарячі шляхи запитів.

## Фільтрація активних поверхонь

SecretRef перевіряються лише на ефективно активних поверхнях.

- Активні поверхні: невизначені refs блокують запуск/перезавантаження.
- Неактивні поверхні: невизначені refs не блокують запуск/перезавантаження.
- Неактивні refs видають нефатальні діагностичні повідомлення з кодом `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Приклади неактивних поверхонь:

- Вимкнені записи каналів/облікових записів.
- Облікові дані каналів верхнього рівня, які не успадковуються жодним увімкненим обліковим записом.
- Вимкнені поверхні інструментів/можливостей.
- Ключі, специфічні для провайдера вебпошуку, які не вибрані через `tools.web.search.provider`.
  У режимі auto (коли провайдер не задано) ключі використовуються за пріоритетом для автовизначення провайдера, доки один із них не визначиться.
  Після вибору ключі невибраних провайдерів вважаються неактивними, доки не будуть вибрані.
- Дані SSH-автентифікації sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, а також перевизначення для окремих агентів) активні лише
  тоді, коли ефективний бекенд sandbox — `ssh` для типового агента або ввімкненого агента.
- SecretRef `gateway.remote.token` / `gateway.remote.password` активні, якщо виконується одна з умов:
  - `gateway.mode=remote`
  - налаштовано `gateway.remote.url`
  - `gateway.tailscale.mode` має значення `serve` або `funnel`
  - У локальному режимі без цих віддалених поверхонь:
    - `gateway.remote.token` активний, коли може перемогти автентифікація токеном і не налаштовано токен env/auth.
    - `gateway.remote.password` активний лише тоді, коли може перемогти автентифікація паролем і не налаштовано пароль env/auth.
- SecretRef `gateway.auth.token` неактивний для визначення стартової автентифікації, коли задано `OPENCLAW_GATEWAY_TOKEN`, оскільки для цього runtime вхідний токен із env має пріоритет.

## Діагностика поверхні автентифікації Gateway

Коли SecretRef налаштовано на `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` або `gateway.remote.password`, запуск/перезавантаження gateway явно журналює
стан поверхні:

- `active`: SecretRef є частиною ефективної поверхні автентифікації і має бути визначений.
- `inactive`: SecretRef ігнорується для цього runtime, оскільки інша поверхня автентифікації має пріоритет, або
  тому що віддалену автентифікацію вимкнено/вона неактивна.

Ці записи журналюються з кодом `SECRETS_GATEWAY_AUTH_SURFACE` і включають причину, яку використовує
політика активної поверхні, щоб ви могли побачити, чому облікові дані вважалися активними або неактивними.

## Попередня перевірка посилань під час onboarding

Коли onboarding працює в інтерактивному режимі й ви вибираєте зберігання через SecretRef, OpenClaw запускає попередню перевірку перед збереженням:

- Env refs: перевіряє ім’я змінної середовища й підтверджує, що під час налаштування видно непорожнє значення.
- Provider refs (`file` або `exec`): перевіряє вибір провайдера, визначає `id` і перевіряє тип визначеного значення.
- Шлях повторного використання quickstart: коли `gateway.auth.token` уже є SecretRef, onboarding визначає його перед probe/bootstrap панелі керування (для refs `env`, `file` і `exec`) за тим самим fail-fast бар’єром.

Якщо перевірка не проходить, onboarding показує помилку й дозволяє повторити спробу.

## Контракт SecretRef

Використовуйте один об’єктний формат усюди:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Перевірка:

- `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
- `id` має відповідати `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Перевірка:

- `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
- `id` має бути абсолютним JSON pointer (`/...`)
- Екранування RFC6901 у сегментах: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Перевірка:

- `provider` має відповідати `^[a-z][a-z0-9_-]{0,63}$`
- `id` має відповідати `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` не повинен містити `.` або `..` як сегменти шляху, розділені слешами (наприклад, `a/../b` відхиляється)

## Конфігурація провайдера

Визначайте провайдерів у `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Провайдер env

- Необов’язковий список дозволу через `allowlist`.
- Відсутні/порожні значення env призводять до помилки визначення.

### Провайдер file

- Читає локальний файл зі шляху `path`.
- `mode: "json"` очікує JSON-об’єкт і визначає `id` як pointer.
- `mode: "singleValue"` очікує ref id `"value"` і повертає вміст файла.
- Шлях має проходити перевірки власника/прав доступу.
- Примітка fail-closed для Windows: якщо для шляху недоступна перевірка ACL, визначення завершується помилкою. Лише для довірених шляхів установіть `allowInsecurePath: true` для цього провайдера, щоб обійти перевірки безпеки шляху.

### Провайдер exec

- Запускає налаштований абсолютний шлях до бінарника, без shell.
- Типово `command` має вказувати на звичайний файл (не symlink).
- Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи команд через symlink (наприклад, shim-файли Homebrew). OpenClaw перевіряє визначений цільовий шлях.
- Поєднуйте `allowSymlinkCommand` з `trustedDirs` для шляхів пакетних менеджерів (наприклад, `["/opt/homebrew"]`).
- Підтримує timeout, timeout без виводу, обмеження байтів виводу, allowlist env і довірені каталоги.
- Примітка fail-closed для Windows: якщо для шляху команди недоступна перевірка ACL, визначення завершується помилкою. Лише для довірених шляхів установіть `allowInsecurePath: true` для цього провайдера, щоб обійти перевірки безпеки шляху.

Пейлоад запиту (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Пейлоад відповіді (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Необов’язкові помилки для окремих id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Приклади інтеграції exec

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## Змінні середовища сервера MCP

Змінні середовища сервера MCP, налаштовані через `plugins.entries.acpx.config.mcpServers`, підтримують SecretInput. Це дозволяє не зберігати ключі API й токени у відкритому вигляді в конфігурації:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Значення відкритого тексту як рядки все ще працюють. Env-template refs на кшталт `${MCP_SERVER_API_KEY}` і об’єкти SecretRef визначаються під час активації gateway до запуску процесу сервера MCP. Як і для інших поверхонь SecretRef, невизначені refs блокують активацію лише тоді, коли плагін `acpx` є ефективно активним.

## Дані SSH-автентифікації sandbox

Базовий бекенд sandbox `ssh` також підтримує SecretRef для даних SSH-автентифікації:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Поведінка runtime:

- OpenClaw визначає ці refs під час активації sandbox, а не ліниво під час кожного виклику SSH.
- Визначені значення записуються у тимчасові файли з жорсткими правами доступу і використовуються у згенерованій конфігурації SSH.
- Якщо ефективний бекенд sandbox не є `ssh`, ці refs залишаються неактивними й не блокують запуск.

## Підтримувана поверхня облікових даних

Канонічний список підтримуваних і непідтримуваних облікових даних наведено в:

- [Поверхня облікових даних SecretRef](/reference/secretref-credential-surface)

Runtime-створювані або ротаційні облікові дані й матеріали оновлення OAuth навмисно виключені з визначення SecretRef у режимі лише для читання.

## Обов’язкова поведінка і пріоритет

- Поле без ref: без змін.
- Поле з ref: обов’язкове на активних поверхнях під час активації.
- Якщо присутні і відкритий текст, і ref, на підтримуваних шляхах пріоритету перевага надається ref.
- Sentinel маскування `__OPENCLAW_REDACTED__` зарезервовано для внутрішнього маскування/відновлення конфігурації й відхиляється як буквальні подані дані конфігурації.

Сигнали попередження й аудиту:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (runtime-попередження)
- `REF_SHADOWED` (аудиторська знахідка, коли облікові дані в `auth-profiles.json` мають пріоритет над refs в `openclaw.json`)

Поведінка сумісності Google Chat:

- `serviceAccountRef` має пріоритет над відкритим текстом `serviceAccount`.
- Значення відкритого тексту ігнорується, коли задано sibling ref.

## Тригери активації

Активація секретів запускається під час:

- запуску (preflight плюс фінальна активація)
- шляху hot-apply перезавантаження конфігурації
- шляху restart-check перезавантаження конфігурації
- ручного перезавантаження через `secrets.reload`
- preflight RPC запису конфігурації gateway (`config.set` / `config.apply` / `config.patch`) для можливості визначення SecretRef на активній поверхні в поданому пейлоаді конфігурації до збереження змін

Контракт активації:

- Успіх атомарно замінює знімок.
- Помилка запуску перериває запуск gateway.
- Помилка runtime-перезавантаження зберігає останній відомий робочий знімок.
- Помилка preflight RPC запису відхиляє подану конфігурацію й залишає без змін і конфігурацію на диску, і активний runtime-знімок.
- Передавання явного токена каналу для окремого виклику допоміжної функції/інструмента вихідної доставки не запускає активацію SecretRef; точками активації залишаються запуск, перезавантаження та явний `secrets.reload`.

## Сигнали degraded і recovered

Коли активація під час перезавантаження не проходить після здорового стану, OpenClaw переходить у degraded-стан секретів.

Одноразові коди системних подій і журналів:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Поведінка:

- Degraded: runtime зберігає останній відомий робочий знімок.
- Recovered: видається один раз після наступної успішної активації.
- Повторні збої, коли система вже в degraded-стані, журналюють попередження, але не засмічують подіями.
- Швидке завершення під час запуску не видає degraded-подій, оскільки runtime так і не став активним.

## Визначення в шляхах команд

Шляхи команд можуть використовувати підтримуване визначення SecretRef через snapshot RPC gateway.

Є дві широкі моделі поведінки:

- Строгі шляхи команд (наприклад, віддалені шляхи пам’яті `openclaw memory` і `openclaw qr --remote`, коли їм потрібні віддалені shared-secret refs) читають з активного знімка і завершуються швидко з помилкою, коли потрібний SecretRef недоступний.
- Шляхи команд лише для читання (наприклад, `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` і потоки лише для читання в doctor/config repair) також надають перевагу активному знімку, але деградують замість переривання, коли цільовий SecretRef недоступний у цьому шляху команд.

Поведінка лише для читання:

- Коли gateway запущено, ці команди спочатку читають з активного знімка.
- Якщо визначення через gateway неповне або gateway недоступний, вони намагаються виконати локальний цільовий резервний варіант для конкретної поверхні команди.
- Якщо цільовий SecretRef усе ще недоступний, команда продовжується з degraded-виводом лише для читання та явною діагностикою на кшталт «налаштовано, але недоступно в цьому шляху команди».
- Ця degraded-поведінка є локальною для команди. Вона не послаблює запуск runtime, перезавантаження або шляхи надсилання/автентифікації.

Інші примітки:

- Оновлення snapshot після ротації секретів у бекенді виконується через `openclaw secrets reload`.
- Метод Gateway RPC, який використовується цими шляхами команд: `secrets.resolve`.

## Робочий процес аудиту й налаштування

Типовий потік для оператора:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Знахідки включають:

- значення відкритого тексту в стані спокою (`openclaw.json`, `auth-profiles.json`, `.env` і згенеровані `agents/*/agent/models.json`)
- залишки чутливих заголовків провайдерів у відкритому тексті в згенерованих записах `models.json`
- невизначені refs
- затінення пріоритету (`auth-profiles.json` має пріоритет над refs з `openclaw.json`)
- застарілі залишки (`auth.json`, нагадування OAuth)

Примітка щодо exec:

- Типово audit пропускає перевірки можливості визначення exec SecretRef, щоб уникати побічних ефектів команд.
- Використовуйте `openclaw secrets audit --allow-exec`, щоб виконувати exec-провайдери під час аудиту.

Примітка щодо залишків заголовків:

- Виявлення чутливих заголовків провайдера базується на евристиках назв (типові назви та фрагменти заголовків автентифікації/облікових даних, такі як `authorization`, `x-api-key`, `token`, `secret`, `password` і `credential`).

### `secrets configure`

Інтерактивний помічник, який:

- спочатку налаштовує `secrets.providers` (`env`/`file`/`exec`, додавання/редагування/видалення)
- дозволяє вибрати підтримувані поля з секретами в `openclaw.json` і `auth-profiles.json` для однієї області агента
- може безпосередньо створити нове зіставлення `auth-profiles.json` у виборі цілі
- збирає деталі SecretRef (`source`, `provider`, `id`)
- запускає preflight-визначення
- може відразу застосувати зміни

Примітка щодо exec:

- Preflight пропускає перевірки exec SecretRef, якщо не задано `--allow-exec`.
- Якщо ви застосовуєте зміни безпосередньо з `configure --apply`, а план містить exec refs/providers, залишайте `--allow-exec` увімкненим і для кроку застосування.

Корисні режими:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Типова поведінка `configure` apply:

- очищає відповідні статичні облікові дані з `auth-profiles.json` для цільових провайдерів
- очищає застарілі статичні записи `api_key` з `auth.json`
- очищає відповідні відомі рядки секретів з `<config-dir>/.env`

### `secrets apply`

Застосування збереженого плану:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Примітка щодо exec:

- dry-run пропускає перевірки exec, якщо не задано `--allow-exec`.
- Режим запису відхиляє плани, що містять exec SecretRef/providers, якщо не задано `--allow-exec`.

Докладно про строгий контракт цілі/шляху та точні правила відхилення див. тут:

- [Контракт плану застосування секретів](/gateway/secrets-plan-contract)

## Політика односпрямованої безпеки

OpenClaw навмисно не записує резервні копії для відкату, які містять історичні значення секретів у відкритому вигляді.

Модель безпеки:

- preflight має успішно завершитися до режиму запису
- активація runtime перевіряється до commit
- apply оновлює файли через атомарну заміну файлів і best-effort відновлення в разі збою

## Примітки щодо сумісності із застарілою автентифікацією

Для статичних облікових даних runtime більше не залежить від застарілого сховища автентифікації у відкритому вигляді.

- Джерело облікових даних runtime — визначений знімок у пам’яті.
- Застарілі статичні записи `api_key` очищаються після виявлення.
- Поведінка сумісності, пов’язана з OAuth, залишається окремою.

## Примітка щодо Web UI

Деякі об’єднання SecretInput простіше налаштовувати в режимі raw editor, ніж у режимі форми.

## Пов’язана документація

- Команди CLI: [secrets](/cli/secrets)
- Докладно про контракт плану: [Контракт плану застосування секретів](/gateway/secrets-plan-contract)
- Поверхня облікових даних: [Поверхня облікових даних SecretRef](/reference/secretref-credential-surface)
- Налаштування автентифікації: [Автентифікація](/gateway/authentication)
- Модель безпеки: [Безпека](/gateway/security)
- Пріоритет середовища: [Змінні середовища](/help/environment)
