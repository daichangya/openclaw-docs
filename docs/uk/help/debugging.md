---
read_when:
    - Вам потрібно перевірити сирий вивід моделі на витік міркувань
    - Ви хочете запустити Gateway у режимі watch під час ітерацій
    - Вам потрібен відтворюваний робочий процес налагодження
summary: 'Налагодження інструментів: режим watch, сирі потоки моделі та трасування витоку міркувань'
title: Налагодження
x-i18n:
    generated_at: "2026-04-24T04:14:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

Ця сторінка описує допоміжні засоби налагодження для потокового виводу, особливо коли
провайдер змішує міркування у звичайний текст.

## Перевизначення налагодження під час виконання

Використовуйте `/debug` у чаті, щоб встановлювати перевизначення config **лише на час виконання** (у пам’яті, не на диску).
`/debug` типово вимкнено; увімкніть через `commands.debug: true`.
Це зручно, коли потрібно перемикати маловідомі налаштування без редагування `openclaw.json`.

Приклади:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` очищає всі перевизначення та повертає до config на диску.

## Вивід трасування сесії

Використовуйте `/trace`, коли хочете бачити рядки trace/debug, що належать Plugin, в одній сесії
без увімкнення повного докладного режиму.

Приклади:

```text
/trace
/trace on
/trace off
```

Використовуйте `/trace` для діагностики Plugin, наприклад для підсумків налагодження Active Memory.
Продовжуйте використовувати `/verbose` для звичайного докладного виводу стану/інструментів, а
`/debug` — для перевизначень config лише на час виконання.

## Тимчасове вимірювання часу налагодження CLI

OpenClaw зберігає `src/cli/debug-timing.ts` як невеликий допоміжний засіб для локального
дослідження. Він навмисно не підключений до запуску CLI, маршрутизації команд
або будь-якої команди типово. Використовуйте його лише під час налагодження повільної команди, а потім
видаліть import і spans перед внесенням зміни поведінки.

Використовуйте це, коли команда повільна і вам потрібен швидкий розбір за фазами, перш ніж
вирішувати, чи застосовувати CPU profiler, чи виправляти конкретну підсистему.

### Додайте тимчасові spans

Додайте допоміжний засіб поруч із кодом, який досліджуєте. Наприклад, під час налагодження
`openclaw models list` тимчасовий patch у
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
- Додавайте лише кілька spans навколо ймовірно повільних ділянок.
- Надавайте перевагу широким фазам, таким як `registry`, `auth_store` або `rows`, а не
  назвам допоміжних функцій.
- Використовуйте `time()` для синхронної роботи та `timeAsync()` для promises.
- Зберігайте stdout чистим. Допоміжний засіб пише в stderr, тож JSON-вивід команди лишається придатним до розбору.
- Видаляйте тимчасові imports і spans перед відкриттям фінального PR з виправленням.
- Додавайте в issue або PR вивід вимірювання часу або короткий підсумок, що пояснює оптимізацію.

### Запуск зі зручним для читання виводом

Режим читабельного виводу найкраще підходить для живого налагодження:

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
| ---------------------------------------- | --------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Завантаження сховища профілів автентифікації має найбільшу вартість, і його слід дослідити насамперед. |
| `debug:models:list:ensure_models_json`   |       5.0s | Синхронізація `models.json` достатньо дорога, щоб перевірити кешування або умови пропуску.             |
| `debug:models:list:load_model_registry`  |       5.9s | Побудова registry і робота з доступністю провайдера також мають помітну вартість.                      |
| `debug:models:list:read_registry_models` |       2.4s | Читання всіх моделей registry не є безкоштовним і може мати значення для `--all`.                      |
| фази додавання рядків                    | 3.2s total | Побудова п’яти відображених рядків усе ще займає кілька секунд, тож шлях фільтрації заслуговує на уважніший розгляд. |
| `debug:models:list:print_model_table`    |        0ms | Вузьке місце не в рендерингу.                                                                           |

Цих висновків достатньо, щоб спрямувати наступний patch, не залишаючи код вимірювання часу в
production-шляхах.

### Запуск із JSON-виводом

Використовуйте режим JSON, коли хочете зберегти або порівняти дані вимірювання часу:

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

### Очистіть перед внесенням змін

Перед відкриттям фінального PR:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Команда не повинна повертати жодних тимчасових місць виклику інструментування, якщо PR
явно не додає постійну поверхню діагностики. Для звичайних виправлень продуктивності
залишайте лише зміну поведінки, тести й коротку примітку з доказами вимірювання часу.

Для глибших вузьких місць CPU використовуйте профілювання Node (`--cpu-prof`) або зовнішній
profiler замість додавання більшої кількості обгорток вимірювання часу.

## Режим watch для Gateway

Для швидких ітерацій запускайте gateway під наглядом file watcher:

```bash
pnpm gateway:watch
```

Це відповідає:

```bash
node scripts/watch-node.mjs gateway --force
```

Watcher перезапускається при змінах у файлах, релевантних для збірки, у `src/`, вихідних файлах extension,
метаданих extension `package.json` і `openclaw.plugin.json`, `tsconfig.json`,
`package.json` і `tsdown.config.ts`. Зміни метаданих extension перезапускають
gateway без примусового `tsdown` rebuild; зміни вихідного коду та config, як і раніше,
спочатку перебудовують `dist`.

Додавайте будь-які прапорці CLI gateway після `gateway:watch`, і вони передаватимуться
під час кожного перезапуску. Повторний запуск тієї самої watch-команди для того самого repo/набору прапорців тепер
замінює старіший watcher замість того, щоб залишати дубльовані батьківські watcher-процеси.

## Профіль dev + gateway dev (--dev)

Використовуйте профіль dev, щоб ізолювати стан і підняти безпечне, тимчасове середовище для
налагодження. Існує **два** прапорці `--dev`:

- **Глобальний `--dev` (профіль):** ізолює стан у `~/.openclaw-dev` і
  типово встановлює порт gateway на `19001` (похідні порти зміщуються разом із ним).
- **`gateway --dev`:** вказує Gateway автоматично створити типові config +
  workspace, якщо їх немає (і пропустити BOOTSTRAP.md).

Рекомендований процес (профіль dev + bootstrap dev):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas зміщуються відповідно)

2. **Bootstrap dev** (`gateway --dev`)
   - Записує мінімальний config, якщо його немає (`gateway.mode=local`, bind loopback).
   - Установлює `agent.workspace` на dev workspace.
   - Установлює `agent.skipBootstrap=true` (без BOOTSTRAP.md).
   - Заповнює файли workspace, якщо їх немає:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Типова identity: **C3‑PO** (protocol droid).
   - Пропускає channel providers у режимі dev (`OPENCLAW_SKIP_CHANNELS=1`).

Процес скидання (чистий старт):

```bash
pnpm gateway:dev:reset
```

Примітка: `--dev` — це **глобальний** прапорець профілю, і деякі runners його перехоплюють.
Якщо потрібно вказати його явно, використовуйте форму зі змінною середовища:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` очищає config, облікові дані, сесії та dev workspace (використовуючи
`trash`, а не `rm`), а потім заново створює типове dev-середовище.

Порада: якщо вже працює gateway не в режимі dev (launchd/systemd), спочатку зупиніть його:

```bash
openclaw gateway stop
```

## Журналювання сирого потоку (OpenClaw)

OpenClaw може журналювати **сирий потік помічника** до будь-якої фільтрації/форматування.
Це найкращий спосіб побачити, чи надходять міркування як прості текстові deltas
(або як окремі блоки thinking).

Увімкніть через CLI:

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

## Журналювання сирих chunks (pi-mono)

Щоб захопити **сирі chunks OpenAI-compat** до того, як вони будуть розібрані на blocks,
pi-mono надає окремий logger:

```bash
PI_RAW_STREAM=1
```

Необов’язковий шлях:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Типовий файл:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Примітка: це виводиться лише процесами, що використовують provider
> `openai-completions` у pi-mono.

## Примітки щодо безпеки

- Журнали сирого потоку можуть містити повні prompts, вивід інструментів і дані користувача.
- Зберігайте журнали локально та видаляйте їх після налагодження.
- Якщо ділитеся журналами, спочатку очистіть секрети та PII.

## Пов’язане

- [Усунення несправностей](/uk/help/troubleshooting)
- [FAQ](/uk/help/faq)
