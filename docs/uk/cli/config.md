---
read_when:
    - Ви хочете читати або редагувати конфігурацію без інтерактивного режиму
summary: Довідник CLI для `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Конфігурація
x-i18n:
    generated_at: "2026-04-23T22:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a5afd8911e98e5b9fa10ff1290819b004792e9915d88d52c97529ee645c58f9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Допоміжні засоби конфігурації для неінтерактивного редагування в `openclaw.json`: отримання/встановлення/видалення/файл/схема/перевірка
значень за шляхом і виведення активного файла конфігурації. Запуск без підкоманди
відкриває майстер налаштування (так само, як `openclaw configure`).

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

Виводить згенеровану JSON-схему для `openclaw.json` у stdout у форматі JSON.

Що вона містить:

- Поточну схему кореневої конфігурації, а також кореневе строкове поле `$schema` для інструментів редактора
- Метадані документації полів `title` і `description`, які використовуються в UI Control
- Вкладені об’єкти, вузли з підстановкою (`*`) і вузли елементів масиву (`[]`) успадковують ті самі метадані `title` / `description`, коли існує відповідна документація поля
- Гілки `anyOf` / `oneOf` / `allOf` також успадковують ті самі метадані документації, коли існує відповідна документація поля
- Live-метадані схеми plugin + channel за принципом best-effort, коли можна завантажити runtime-маніфести
- Коректну резервну схему, навіть якщо поточна конфігурація недійсна

Пов’язаний runtime RPC:

- `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, загальні межі),
  зіставленими метаданими підказок UI та підсумками безпосередніх дочірніх елементів. Використовуйте це для
  деталізації в межах шляху в UI Control або у власних клієнтах.

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

Використовуйте індекс списку агентів, щоб звернутися до конкретного агента:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Значення

Значення аналізуються як JSON5, коли це можливо; інакше вони обробляються як рядки.
Використовуйте `--strict-json`, щоб вимагати аналіз JSON5. `--json` і далі підтримується як застарілий псевдонім.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` виводить необроблене значення як JSON замість тексту, відформатованого для термінала.

Присвоєння об’єкта за замовчуванням замінює цільовий шлях. Захищені шляхи map/list,
які часто містять додані користувачем записи, такі як `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` і
`auth.profiles`, відхиляють заміни, які б видалили наявні записи, якщо
ви не передасте `--replace`.

Використовуйте `--merge`, коли додаєте записи до цих map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Використовуйте `--replace` лише тоді, коли ви свідомо хочете, щоб надане значення стало
повним цільовим значенням.

## Режими `config set`

`openclaw config set` підтримує чотири стилі присвоєння:

1. Режим значення: `openclaw config set <path> <value>`
2. Режим конструктора SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Режим конструктора provider (лише для шляху `secrets.providers.<alias>`):

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

- Присвоєння SecretRef відхиляються на непідтримуваних runtime-mutable поверхнях (наприклад, `hooks.token`, `commands.ownerDisplaySecret`, токени Webhook для прив’язки потоків Discord і JSON облікових даних WhatsApp). Див. [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).

Пакетний розбір завжди використовує пакетне корисне навантаження (`--batch-json`/`--batch-file`) як джерело істини.
`--strict-json` / `--json` не змінюють поведінку пакетного розбору.

Режим JSON path/value і далі підтримується як для SecretRef, так і для provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Прапорці конструктора provider

Цілі конструктора provider мають використовувати `secrets.providers.<alias>` як шлях.

Загальні прапорці:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (повторюваний)

File provider (`--provider-source file`):

- `--provider-path <path>` (обов’язковий)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec provider (`--provider-source exec`):

- `--provider-command <path>` (обов’язковий)
- `--provider-arg <arg>` (повторюваний)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (повторюваний)
- `--provider-pass-env <ENV_VAR>` (повторюваний)
- `--provider-trusted-dir <path>` (повторюваний)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Приклад посиленого exec provider:

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

## Суха перевірка

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

Поведінка сухої перевірки:

- Режим конструктора: виконує перевірки можливості розв’язання SecretRef для змінених ref/provider.
- Режим JSON (`--strict-json`, `--json` або пакетний режим): виконує перевірку схеми та перевірки можливості розв’язання SecretRef.
- Також виконується перевірка політики для відомих непідтримуваних цільових поверхонь SecretRef.
- Перевірки політики оцінюють повну конфігурацію після змін, тому записи батьківських об’єктів (наприклад, установлення `hooks` як об’єкта) не можуть обійти перевірку непідтримуваних поверхонь.
- Перевірки exec SecretRef за замовчуванням пропускаються під час сухої перевірки, щоб уникнути побічних ефектів виконання команд.
- Використовуйте `--allow-exec` разом із `--dry-run`, щоб увімкнути перевірки exec SecretRef (це може виконувати команди provider).
- `--allow-exec` призначений лише для сухої перевірки й спричиняє помилку, якщо використовується без `--dry-run`.

`--dry-run --json` виводить машиночитний звіт:

- `ok`: чи пройшла суха перевірка
- `operations`: кількість оцінених присвоєнь
- `checks`: чи виконувалися перевірки схеми/можливості розв’язання
- `checks.resolvabilityComplete`: чи були перевірки можливості розв’язання виконані повністю (`false`, коли exec ref пропущено)
- `refsChecked`: кількість ref, фактично розв’язаних під час сухої перевірки
- `skippedExecRefs`: кількість exec ref, пропущених через те, що `--allow-exec` не було встановлено
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

Якщо суха перевірка не пройшла:

- `config schema validation failed`: форма вашої конфігурації після змін недійсна; виправте шлях/значення або форму об’єкта provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: поверніть ці облікові дані до відкритого тексту/рядкового введення та залишайте SecretRef лише на підтримуваних поверхнях.
- `SecretRef assignment(s) could not be resolved`: на цей момент на provider/ref, на який є посилання, неможливо послатися (відсутня змінна env, недійсний вказівник на файл, збій exec provider або невідповідність provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: суха перевірка пропустила exec ref; повторно запустіть із `--allow-exec`, якщо вам потрібна перевірка можливості розв’язання exec.
- Для пакетного режиму виправте записи, що спричинили збій, і повторно запустіть `--dry-run` перед записом.

## Безпека запису

`openclaw config set` та інші засоби запису конфігурації, що належать OpenClaw, перевіряють повну
конфігурацію після змін перед збереженням її на диск. Якщо нове корисне навантаження не проходить перевірку схеми
або виглядає як руйнівне перезаписування, активна конфігурація залишається без змін,
а відхилене корисне навантаження зберігається поруч із нею як `openclaw.json.rejected.*`.
Шлях активної конфігурації має бути звичайним файлом. Макети `openclaw.json`
із символічними посиланнями не підтримуються для запису; натомість використовуйте `OPENCLAW_CONFIG_PATH`,
щоб указати безпосередньо на реальний файл.

Надавайте перевагу запису через CLI для невеликих змін:

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

Прямий запис через редактор усе ще дозволений, але запущений Gateway розглядає його як
ненадійний, доки він не пройде перевірку. Недійсні прямі редагування можна відновити з
резервної копії останньої відомої коректної конфігурації під час запуску або гарячого перезавантаження. Див.
[Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Підкоманди

- `config file`: Вивести шлях до активного файла конфігурації (визначений з `OPENCLAW_CONFIG_PATH` або стандартного розташування). Шлях має вказувати на звичайний файл, а не на символічне посилання.

Після редагування перезапустіть gateway.

## Перевірка

Перевіряє поточну конфігурацію щодо активної схеми без запуску
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
захист від недійсної конфігурації.

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
- Якщо перевірка проходить, але runtime усе ще працює некоректно, запустіть `openclaw doctor` або `openclaw doctor --fix` для допомоги з міграцією та відновленням.
