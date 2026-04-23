---
read_when:
    - Вам потрібно перевірити сирий вивід моделі на наявність витоку міркувань
    - Ви хочете запустити Gateway у режимі спостереження під час ітерації
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Інструменти налагодження: режим спостереження, сирі потоки моделі та трасування витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-04-23T04:19:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# Налагодження

Ця сторінка охоплює допоміжні засоби налагодження для потокового виводу, особливо коли
провайдер змішує міркування зі звичайним текстом.

## Перевизначення налагодження під час виконання

Використовуйте `/debug` у чаті, щоб встановити перевизначення конфігурації **лише під час виконання** (у пам’яті, не на диску).
`/debug` вимкнено за замовчуванням; увімкніть через `commands.debug: true`.
Це зручно, коли потрібно перемикати маловідомі налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення і повертає конфігурацію з диска.

## Вивід трасування сесії

Використовуйте `/trace`, коли хочете бачити рядки trace/debug, що належать plugin, в межах однієї сесії
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики plugin, наприклад для зведень налагодження Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу стану/інструментів, а
`/debug` — для перевизначень конфігурації лише під час виконання.

## Тимчасове налагодження таймінгів CLI

OpenClaw зберігає `src/cli/debug-timing.ts` як невеликий допоміжний засіб для локального
дослідження. Його навмисно не підключено до запуску CLI, маршрутизації команд
або будь-якої команди за замовчуванням. Використовуйте його лише під час налагодження повільної команди, а потім
видаліть імпорт і спани перед внесенням зміни поведінки.

Використовуйте це, коли команда працює повільно і вам потрібен швидкий розподіл за фазами, перш ніж
вирішувати, чи використовувати профілювальник CPU, чи виправляти конкретну підсистему.

### Додайте тимчасові спани

Додайте цей допоміжний засіб поруч із кодом, який ви досліджуєте. Наприклад, під час налагодження
`openclaw models list` тимчасовий патч у
`src/commands/models/list.list-command.ts` може виглядати так:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Рекомендації:

- Додавайте префікс `debug:` до назв тимчасових фаз.
- Додавайте лише кілька спанів навколо підозріло повільних ділянок.
- Віддавайте перевагу широким фазам на кшталт `registry`, `auth_store` або `rows`, а не
  назвам допоміжних функцій.
- Використовуйте `time()` для синхронної роботи і `timeAsync()` для промісів.
- Зберігайте чистоту stdout. Допоміжний засіб пише в stderr, тож JSON-вивід команди залишається придатним до розбору.
- Видаляйте тимчасові імпорти і спани перед відкриттям фінального PR із виправленням.
- Додавайте в issue або PR вивід таймінгів чи короткий підсумок, що пояснює оптимізацію.

### Запуск зі зручним для читання виводом

Режим зручного для читання виводу найкращий для живого налагодження:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Приклад виводу з тимчасового дослідження `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Висновки з цього виводу:

| Фаза                                     |       Час | Що це означає                                                                                           |
| ---------------------------------------- | --------: | -------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Завантаження сховища профілів автентифікації є найбільшою витратою і його слід дослідити в першу чергу. |
| `debug:models:list:ensure_models_json`   |       5.0s | Синхронізація `models.json` достатньо дорога, щоб перевірити кешування або умови пропуску.              |
| `debug:models:list:load_model_registry`  |       5.9s | Побудова реєстру та робота з доступністю провайдерів також дають помітні витрати.                       |
| `debug:models:list:read_registry_models` |       2.4s | Читання всіх моделей реєстру не є безкоштовним і може мати значення для `--all`.                        |
| фази додавання рядків                    | 3.2s загалом | Побудова п’яти показаних рядків усе ще займає кілька секунд, тож шлях фільтрації варто розглянути ближче. |
| `debug:models:list:print_model_table`    |        0ms | Рендеринг не є вузьким місцем.                                                                           |

Цих висновків достатньо, щоб спрямувати наступний патч без збереження коду таймінгів у
робочих шляхах production.

### Запуск із JSON-виводом

Використовуйте режим JSON, коли хочете зберегти або порівняти дані таймінгів:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Кожен рядок stderr — це один JSON-об’єкт:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Приберіть перед внесенням змін

Перед відкриттям фінального PR:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Команда не повинна повертати жодних тимчасових місць виклику інструментування, якщо лише PR
явно не додає постійну поверхню діагностики. Для звичайних виправлень продуктивності
залишайте лише зміну поведінки, тести й коротку примітку з доказами таймінгів.

Для глибших вузьких місць CPU використовуйте профілювання Node (`--cpu-prof`) або зовнішній
профілювальник замість додавання більшої кількості обгорток таймінгів.

## Режим спостереження Gateway

Для швидкої ітерації запускайте gateway під файловим спостерігачем:

```bash
pnpm gateway:watch
```

Це відповідає:

```bash
node scripts/watch-node.mjs gateway --force
```

Спостерігач перезапускається при змінах у файлах, важливих для збірки, в `src/`, вихідних файлах extension,
метаданих extension `package.json` і `openclaw.plugin.json`, `tsconfig.json`,
`package.json` та `tsdown.config.ts`. Зміни метаданих extension перезапускають
gateway без примусового `tsdown`-перезбирання; зміни вихідного коду й конфігурації все ще спочатку
перезбирають `dist`.

Додайте будь-які прапорці CLI gateway після `gateway:watch`, і вони передаватимуться під час
кожного перезапуску. Повторний запуск тієї самої команди спостереження для того самого набору repo/прапорців тепер
замінює старіший спостерігач замість того, щоб залишати дублікати батьківських процесів спостерігача.

## Профіль dev + gateway dev (--dev)

Використовуйте профіль dev, щоб ізолювати стан і підняти безпечне, тимчасове середовище для
налагодження. Існують **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  за замовчуванням встановлює порт gateway на `19001` (пов’язані порти зміщуються разом із ним).
- **`gateway --dev`:** наказує Gateway автоматично створити типову конфігурацію +
  робочий простір, якщо їх немає (і пропустити BOOTSTRAP.md).

Рекомендований потік (профіль dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Якщо у вас ще немає глобального встановлення, запускайте CLI через `pnpm openclaw ...`.

Що це робить:

1. **Ізоляція профілю** (глобальний `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (порти browser/canvas відповідно зміщуються)

2. **Bootstrap dev** (`gateway --dev`)
   - Записує мінімальну конфігурацію, якщо її немає (`gateway.mode=local`, прив’язка до loopback).
   - Встановлює `agent.workspace` на робочий простір dev.
   - Встановлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Заповнює файли робочого простору, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова ідентичність: **C3‑PO** (протокольний дроїд).
   - У режимі dev пропускає провайдери каналів (`OPENCLAW_SKIP_CHANNELS=1`).

Потік скидання (чистий старт):

```bash
pnpm gateway:dev:reset
```

Примітка: `--dev` — це **глобальний** прапорець профілю, і деякі раннери його поглинають.
Якщо потрібно вказати його явно, використовуйте форму зі змінною середовища:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` очищає конфігурацію, облікові дані, сесії та робочий простір dev (через
`trash`, а не `rm`), а потім заново створює типове середовище dev.

Порада: якщо gateway не в режимі dev уже запущений (launchd/systemd), спочатку зупиніть його:

```bash
openclaw gateway stop
```

## Логування сирого потоку (OpenClaw)

OpenClaw може журналювати **сирий потік асистента** до будь-якої фільтрації/форматування.
Це найкращий спосіб побачити, чи надходять міркування як звичайні текстові дельти
(або як окремі thinking-блоки).

Увімкніть це через CLI:

```bash
pnpm gateway:watch --raw-stream
```

Необов’язкове перевизначення шляху:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Еквівалентні змінні середовища:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Типовий файл:

`~/.openclaw/logs/raw-stream.jsonl`

## Логування сирих чанків (pi-mono)

Щоб захоплювати **сирі OpenAI-compat чанки** до того, як вони будуть розібрані на блоки,
pi-mono надає окремий логер:

```bash
PI_RAW_STREAM=1
```

Необов’язковий шлях:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Типовий файл:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Примітка: це виводиться лише процесами, які використовують провайдер
> `openai-completions` із pi-mono.

## Примітки щодо безпеки

- Журнали сирого потоку можуть містити повні промпти, вивід інструментів і дані користувача.
- Зберігайте журнали локально й видаляйте їх після налагодження.
- Якщо ділитеся журналами, спочатку очищайте секрети та PII.
