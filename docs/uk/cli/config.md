---
read_when:
    - Ви хочете читати або редагувати config без взаємодії з користувачем.
summary: Довідка CLI для `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-23T19:23:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec16221cc977eb2108c4310eab6b49e74220de50425ab12201cf97d275ab5a65
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Допоміжні команди config для невзаємодіючих змін у `openclaw.json`: отримання/встановлення/видалення/файл/схема/перевірка
значень за шляхом і виведення активного файла config. Запустіть без підкоманди, щоб
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
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.5":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Виводить згенеровану JSON-схему для `openclaw.json` у stdout у форматі JSON.

Що вона містить:

- Поточну схему кореневого config, а також кореневе рядкове поле `$schema` для інструментів редактора
- Метадані документації полів `title` і `description`, які використовує інтерфейс Control UI
- Вкладені об’єкти, вузли-підстановки (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація поля
- Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація поля
- Метадані схем Plugin і channel у режимі best-effort, якщо можна завантажити runtime-маніфести
- Чисту резервну схему, навіть коли поточний config є невалідним

Пов’язаний runtime RPC:

- `config.schema.lookup` повертає один нормалізований шлях config із поверхневим
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі),
  відповідними метаданими підказок UI та зведеннями безпосередніх дочірніх елементів. Використовуйте це для
  деталізації в межах шляху в Control UI або у власних клієнтах.

```bash
openclaw config schema
```

Спрямуйте вивід у файл, якщо хочете переглянути або перевірити його іншими інструментами:

```bash
openclaw config schema > openclaw.schema.json
```

### Шляхи

Шляхи використовують крапкову або дужкову нотацію:

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

Значення аналізуються як JSON5, якщо це можливо; інакше вони трактуються як рядки.
Використовуйте `--strict-json`, щоб вимагати аналіз JSON5. `--json` і надалі підтримується як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить необроблене значення як JSON замість тексту, відформатованого для термінала.

Присвоєння об’єкта за замовчуванням замінює цільовий шлях. Захищені шляхи map/list,
які часто містять записи, додані користувачем, наприклад `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` і
`auth.profiles`, відхиляють заміни, які видалили б наявні записи, якщо
ви не передасте `--replace`.

Використовуйте `--merge`, коли додаєте записи до цих map:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.5":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли ви навмисно хочете, щоб надане значення
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

3. Режим побудови provider (лише для шляху `secrets.providers.<alias>`):

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

- Присвоєння SecretRef відхиляються на непідтримуваних поверхнях runtime-змінюваності (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токени Webhook прив’язки тредів Discord і JSON-облікові дані WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).

Пакетний аналіз завжди використовує пакетне навантаження (`--batch-json`/`--batch-file`) як джерело істини.
`--strict-json` / `--json` не змінюють поведінку пакетного аналізу.

Режим JSON path/value і надалі підтримується як для SecretRef, так і для provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Прапорці побудови provider

Цілі побудови provider мають використовувати `secrets.providers.<alias>` як шлях.

Поширені прапорці:

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

Приклад захищеного exec provider:

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

## Сухий запуск

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

Поведінка сухого запуску:

- Режим побудови: виконує перевірки можливості розв’язання SecretRef для змінених refs/providers.
- Режим JSON (`--strict-json`, `--json` або пакетний режим): виконує перевірку схеми, а також перевірки можливості розв’язання SecretRef.
- Також виконується перевірка політики для відомих непідтримуваних цільових поверхонь SecretRef.
- Перевірки політики оцінюють повний config після змін, тому записи батьківського об’єкта (наприклад, встановлення `hooks` як об’єкта) не можуть обійти перевірку непідтримуваних поверхонь.
- Перевірки exec SecretRef під час сухого запуску за замовчуванням пропускаються, щоб уникнути побічних ефектів виконання команд.
- Використовуйте `--allow-exec` разом із `--dry-run`, щоб увімкнути перевірки exec SecretRef (це може виконати команди provider).
- `--allow-exec` працює лише для сухого запуску й спричиняє помилку, якщо використовується без `--dry-run`.

`--dry-run --json` виводить машиночитний звіт:

- `ok`: чи пройшов сухий запуск
- `operations`: кількість оцінених присвоєнь
- `checks`: чи виконувалися перевірки схеми/можливості розв’язання
- `checks.resolvabilityComplete`: чи були перевірки можливості розв’язання виконані до завершення (`false`, коли exec refs пропущено)
- `refsChecked`: кількість refs, фактично розв’язаних під час сухого запуску
- `skippedExecRefs`: кількість exec refs, пропущених через те, що не було встановлено `--allow-exec`
- `errors`: структуровані збої схеми/можливості розв’язання, коли `ok=false`

### Форма виводу JSON

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
      ref?: string, // present for resolvability errors
    },
  ],
}
```

Приклад успішного виконання:

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

Якщо сухий запуск не вдався:

- `config schema validation failed`: форма вашого config після змін є невалідною; виправте шлях/значення або форму об’єкта provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: поверніть цей обліковий запис до plaintext/string-введення і залишайте SecretRefs лише на підтримуваних поверхнях.
- `SecretRef assignment(s) could not be resolved`: зазначений provider/ref наразі не може бути розв’язаний (відсутня env-змінна, недійсний вказівник на файл, збій exec provider або невідповідність provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: сухий запуск пропустив exec refs; перезапустіть з `--allow-exec`, якщо вам потрібна перевірка можливості розв’язання exec.
- Для пакетного режиму виправте записи, що не пройшли перевірку, і повторно запустіть `--dry-run` перед записом.

## Безпека запису

`openclaw config set` та інші засоби запису config, якими керує OpenClaw, перевіряють повний
config після змін перед тим, як фіксувати його на диску. Якщо нове корисне навантаження не проходить перевірку схеми
або виглядає як руйнівне перезаписування, активний config залишається без змін,
а відхилене корисне навантаження зберігається поруч із ним як `openclaw.json.rejected.*`.
Шлях до активного config має вказувати на звичайний файл. Макети `openclaw.json`
із символічними посиланнями не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`, щоб вказати безпосередньо
на реальний файл.

Віддавайте перевагу записам через CLI для невеликих змін:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Якщо запис відхилено, перегляньте збережене корисне навантаження та виправте повну форму config:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Прямі записи через редактор і надалі дозволені, але запущений Gateway вважає їх
ненадійними, доки вони не пройдуть перевірку. Невалідні прямі зміни можна відновити з
резервної копії останнього відомого коректного стану під час запуску або гарячого перезавантаження. Див.
[усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Підкоманди

- `config file`: Вивести шлях до активного файла config (визначений з `OPENCLAW_CONFIG_PATH` або зі стандартного розташування). Шлях має вказувати на звичайний файл, а не на символічне посилання.

Перезапустіть gateway після змін.

## Перевірка

Перевіряє поточний config на відповідність активній схемі без запуску
gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Після того як `openclaw config validate` проходить успішно, ви можете використати локальний TUI, щоб
вбудований агент порівняв активний config з документацією, поки ви перевіряєте
кожну зміну в тому самому терміналі:

Якщо перевірка вже не проходить, почніть з `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить захист
від невалідного config.

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

- Попросіть агента порівняти ваш поточний config із відповідною сторінкою документації та запропонувати найменше виправлення.
- Застосуйте точкові зміни за допомогою `openclaw config set` або `openclaw configure`.
- Повторно запускайте `openclaw config validate` після кожної зміни.
- Якщо перевірка проходить, але runtime усе ще працює некоректно, запустіть `openclaw doctor` або `openclaw doctor --fix`, щоб отримати допомогу з міграцією та виправленням.
