---
read_when:
    - Ви хочете читати або редагувати конфігурацію в неінтерактивному режимі
summary: Довідка CLI для `openclaw config` (get/set/unset/file/schema/validate)
title: Конфігурація
x-i18n:
    generated_at: "2026-04-25T03:24:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b8d5466d875967b6c9d5bf451f6affbe969d0ba5a48b98ee282612be67128db
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Допоміжні команди конфігурації для неінтерактивних змін у `openclaw.json`: отримання/встановлення/видалення/файл/схема/перевірка
значень за шляхом і виведення активного файла конфігурації. Запустіть без підкоманди, щоб
відкрити майстер налаштування (так само, як `openclaw configure`).

Кореневі параметри:

- `--section <section>`: повторюваний фільтр розділів покрокового налаштування, коли ви запускаєте `openclaw config` без підкоманди

Підтримувані розділи покрокового налаштування:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Приклади

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Виводить згенеровану JSON schema для `openclaw.json` у stdout у форматі JSON.

Що вона містить:

- Поточну кореневу схему конфігурації, а також кореневе строкове поле `$schema` для інструментів редактора
- Метадані документації полів `title` і `description`, які використовує Control UI
- Вкладені об’єкти, вузли з шаблоном (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація поля
- Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація поля
- Метадані схеми live Plugin + channel у режимі best-effort, коли можна завантажити runtime-маніфести
- Чисту резервну схему, навіть якщо поточна конфігурація невалідна

Пов’язаний runtime RPC:

- `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі),
  підібраними метаданими підказок UI і підсумками безпосередніх дочірніх елементів. Використовуйте це для
  деталізації в межах шляху в Control UI або власних клієнтах.

```bash
openclaw config schema
```

Спрямуйте вивід у файл, якщо хочете переглянути або перевірити його іншими інструментами:

```bash
openclaw config schema > openclaw.schema.json
```

### Шляхи

Шляхи використовують крапкову нотацію або нотацію з дужками:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Використовуйте індекс списку агентів, щоб націлитися на конкретного агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Значення

Значення аналізуються як JSON5, коли це можливо; інакше вони обробляються як рядки.
Використовуйте `--strict-json`, щоб вимагати аналіз JSON5. `--json` і надалі підтримується як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить необроблене значення у форматі JSON замість відформатованого для термінала тексту.

Присвоєння об’єкта за замовчуванням замінює цільовий шлях. Захищені шляхи map/list,
які зазвичай містять додані користувачем записи, такі як `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` і
`auth.profiles`, відхиляють заміни, які видалили б наявні записи, якщо
ви не передасте `--replace`.

Використовуйте `--merge`, коли додаєте записи до цих map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли ви свідомо хочете, щоб надане значення
стало повним цільовим значенням.

## Режими `config set`

`openclaw config set` підтримує чотири стилі присвоєння:

1. Режим значення: `openclaw config set <path> <value>`
2. Режим побудови SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Режим побудови провайдера (лише для шляху `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Пакетний режим (`--batch-json` або `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Примітка щодо політики:

- Присвоєння SecretRef відхиляються на непідтримуваних runtime-змінюваних поверхнях (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токенах Webhook прив’язки потоку Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).

Пакетний аналіз завжди використовує пакетне корисне навантаження (`--batch-json`/`--batch-file`) як джерело істини.
`--strict-json` / `--json` не змінюють поведінку пакетного аналізу.

Режим JSON path/value і надалі підтримується як для SecretRef, так і для провайдерів:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Прапорці Provider Builder

Цілі Provider builder повинні використовувати `secrets.providers.<alias>` як шлях.

Загальні прапорці:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (можна повторювати)

File provider (`--provider-source file`):

- `--provider-path <path>` (обов’язково)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec provider (`--provider-source exec`):

- `--provider-command <path>` (обов’язково)
- `--provider-arg <arg>` (можна повторювати)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (можна повторювати)
- `--provider-pass-env <ENV_VAR>` (можна повторювати)
- `--provider-trusted-dir <path>` (можна повторювати)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Приклад зміцненого exec provider:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Пробний запуск

Використовуйте `--dry-run`, щоб перевірити зміни без запису в `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Поведінка пробного запуску:

- Режим builder: запускає перевірки розв’язуваності SecretRef для змінених ref/provider.
- Режим JSON (`--strict-json`, `--json` або пакетний режим): запускає перевірку схеми плюс перевірки розв’язуваності SecretRef.
- Перевірка політики також запускається для відомих непідтримуваних цільових поверхонь SecretRef.
- Перевірки політики оцінюють повну конфігурацію після змін, тому записи батьківського об’єкта (наприклад, встановлення `hooks` як об’єкта) не можуть обійти перевірку непідтримуваних поверхонь.
- Перевірки exec SecretRef за замовчуванням пропускаються під час пробного запуску, щоб уникнути побічних ефектів команд.
- Використовуйте `--allow-exec` разом із `--dry-run`, щоб явно дозволити перевірки exec SecretRef (це може виконувати команди провайдера).
- `--allow-exec` доступний лише для пробного запуску й спричиняє помилку, якщо використовується без `--dry-run`.

`--dry-run --json` виводить машиночитаний звіт:

- `ok`: чи успішно пройшов пробний запуск
- `operations`: кількість оцінених присвоєнь
- `checks`: чи виконувалися перевірки схеми/розв’язуваності
- `checks.resolvabilityComplete`: чи були перевірки розв’язуваності виконані до кінця (`false`, коли exec ref пропущено)
- `refsChecked`: кількість ref, фактично розв’язаних під час пробного запуску
- `skippedExecRefs`: кількість exec ref, пропущених через те, що `--allow-exec` не було встановлено
- `errors`: структуровані збої схеми/розв’язуваності, коли `ok=false`

### Форма JSON-виводу

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // присутнє для помилок розв’язуваності
    },
  ],
}
```

Приклад успіху:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Приклад помилки:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Якщо пробний запуск завершується помилкою:

- `config schema validation failed`: форма вашої конфігурації після змін невалідна; виправте шлях/значення або форму об’єкта provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: поверніть цей обліковий параметр до plaintext/string-вводу й залишайте SecretRef лише на підтримуваних поверхнях.
- `SecretRef assignment(s) could not be resolved`: на цей момент не вдається розв’язати вказаний provider/ref (відсутня env-змінна, недійсний покажчик файлу, збій exec provider або невідповідність provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: пробний запуск пропустив exec ref; повторіть із `--allow-exec`, якщо вам потрібна перевірка розв’язуваності exec.
- Для пакетного режиму виправте записи, що не пройшли, і повторно запустіть `--dry-run` перед записом.

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, якими керує OpenClaw, перевіряють всю
конфігурацію після змін перед записом на диск. Якщо нове корисне навантаження не проходить
перевірку схеми або виглядає як руйнівне перезаписування, активна конфігурація залишається без змін,
а відхилене корисне навантаження зберігається поруч із нею як `openclaw.json.rejected.*`.
Шлях активної конфігурації має вказувати на звичайний файл. Макети `openclaw.json`
із symlink не підтримуються для запису; використовуйте `OPENCLAW_CONFIG_PATH`, щоб указати безпосередньо
на реальний файл.

Для невеликих змін надавайте перевагу запису через CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перегляньте збережене корисне навантаження та виправте повну форму конфігурації:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямі записи через редактор усе ще дозволені, але запущений Gateway розглядає їх як
ненадійні, доки вони не пройдуть перевірку. Недійсні прямі зміни можна відновити з
резервної копії останньої відомо коректної версії під час запуску або гарячого перезавантаження. Див.
[усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

Відновлення цілого файла зарезервоване для глобально зламаної конфігурації, наприклад помилок
розбору, збоїв схеми на кореневому рівні, збоїв застарілої міграції або змішаних збоїв Plugin
і кореня. Якщо перевірка не проходить лише в межах `plugins.entries.<id>...`,
OpenClaw залишає активний `openclaw.json` на місці та натомість повідомляє про локальну
проблему Plugin, а не відновлює `.last-good`. Це запобігає тому, щоб зміни схеми Plugin або
невідповідність `minHostVersion` відкочували не пов’язані налаштування користувача, такі як models,
providers, профілі auth, channels, експозиція gateway, tools, memory, browser або
конфігурація Cron.

## Підкоманди

- `config file`: Вивести шлях до активного файла конфігурації (визначений з `OPENCLAW_CONFIG_PATH` або стандартного розташування). Шлях має вказувати на звичайний файл, а не symlink.

Перезапустіть gateway після змін.

## Перевірка

Перевірити поточну конфігурацію на відповідність активній схемі без запуску
gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після того як `openclaw config validate` проходить успішно, ви можете використовувати локальний TUI, щоб
вбудований агент порівняв активну конфігурацію з документацією, поки ви перевіряєте
кожну зміну з того самого термінала:

Якщо перевірка вже не проходить, почніть з `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить
захист від невалідної конфігурації.

```bash
openclaw chat
```

Потім усередині TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Типовий цикл виправлення:

- Попросіть агента порівняти вашу поточну конфігурацію з відповідною сторінкою документації та запропонувати найменше виправлення.
- Застосуйте цільові зміни за допомогою `openclaw config set` або `openclaw configure`.
- Повторно запускайте `openclaw config validate` після кожної зміни.
- Якщо перевірка проходить, але runtime усе ще працює нездорово, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та виправленням.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Конфігурація](/uk/gateway/configuration)
