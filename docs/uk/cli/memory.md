---
read_when:
    - Ви хочете індексувати або шукати семантичну пам’ять
    - Ви налагоджуєте доступність пам’яті або індексацію
    - Ви хочете перенести відновлену короткострокову пам’ять до `MEMORY.md`
summary: Довідник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Пам’ять
x-i18n:
    generated_at: "2026-04-24T04:12:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Керування індексацією та пошуком семантичної пам’яті.
Надається активним Plugin пам’яті (типово: `memory-core`; установіть `plugins.slots.memory = "none"`, щоб вимкнути).

Пов’язане:

- Концепція пам’яті: [Memory](/uk/concepts/memory)
- Вікі пам’яті: [Memory Wiki](/uk/plugins/memory-wiki)
- Wiki CLI: [wiki](/uk/cli/wiki)
- Plugins: [Plugins](/uk/tools/plugin)

## Приклади

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Параметри

`memory status` і `memory index`:

- `--agent <id>`: обмежити одним агентом. Без цього ці команди виконуються для кожного налаштованого агента; якщо список агентів не налаштовано, вони повертаються до типового агента.
- `--verbose`: виводити докладні журнали під час перевірок та індексації.

`memory status`:

- `--deep`: перевірити доступність векторів і embeddings.
- `--index`: виконати повторну індексацію, якщо сховище брудне (має на увазі `--deep`).
- `--fix`: виправити застарілі блокування recall і нормалізувати метадані promotion.
- `--json`: вивести JSON.

Якщо `memory status` показує `Dreaming status: blocked`, керований Cron для dreaming увімкнено, але heartbeat, який його запускає, не спрацьовує для типового агента. Див. [Dreaming never runs](/uk/concepts/dreaming#dreaming-never-runs-status-shows-blocked) щодо двох поширених причин.

`memory index`:

- `--force`: примусово виконати повну повторну індексацію.

`memory search`:

- Вхід запиту: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо вказано обидва, `--query` має пріоритет.
- Якщо не вказано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низькою оцінкою.
- `--json`: вивести результати у JSON.

`memory promote`:

Попередній перегляд і застосування promotion короткострокової пам’яті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати promotion до `MEMORY.md` (типово: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже promoted у попередніх циклах.

Повні параметри:

- Ранжує короткострокових кандидатів із `memory/YYYY-MM-DD.md` за допомогою зважених сигналів promotion (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткострокові сигнали як із memory recalls, так і з щоденних проходів ingestion, а також легкі сигнали підкріплення з фаз light/REM.
- Коли dreaming увімкнено, `memory-core` автоматично керує одним завданням Cron, яке запускає повний цикл (`light -> REM -> deep`) у фоновому режимі (ручний `openclaw cron add` не потрібен).
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальна зважена оцінка promotion.
- `--min-recall-count <n>`: мінімальна кількість recall, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість різних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів до `MEMORY.md` і позначити їх як promoted.
- `--include-promoted`: включити вже promoted кандидатів у вивід.
- `--json`: вивести JSON.

`memory promote-explain`:

Пояснити конкретного кандидата на promotion і розбивку його оцінки.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент уривка для пошуку.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже promoted кандидатів.
- `--json`: вивести JSON.

`memory rem-harness`:

Попередній перегляд REM-рефлексій, кандидатів на істини та виводу deep promotion без будь-якого запису.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже promoted deep-кандидатів.
- `--json`: вивести JSON.

## Dreaming

Dreaming — це фонова система консолідації пам’яті з трьома взаємодіючими
фазами: **light** (сортування/підготовка короткострокового матеріалу), **deep** (promotion стійких
фактів до `MEMORY.md`) і **REM** (рефлексія та виявлення тем).

- Увімкніть через `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикайте з чату через `/dreaming on|off` (або переглядайте через `/dreaming status`).
- Dreaming працює за одним керованим розкладом циклів (`dreaming.frequency`) і виконує фази в порядку: light, REM, deep.
- Лише фаза deep записує стійку пам’ять до `MEMORY.md`.
- Людинозрозумілий вивід фаз і записи щоденника записуються до `DREAMS.md` (або наявного `dreams.md`), з необов’язковими пофазними звітами в `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частота recall, релевантність retrieval, різноманітність запитів, часова актуальність, консолідація між днями та похідна концептуальна насиченість.
- Promotion повторно читає live-щоденну нотатку перед записом у `MEMORY.md`, тому відредаговані або видалені короткострокові фрагменти не потрапляють у promotion зі застарілих знімків сховища recall.
- Заплановані й ручні запуски `memory promote` використовують однакові типові параметри фази deep, якщо ви не передасте перевизначення порогів через CLI.
- Автоматичні запуски розподіляються між налаштованими робочими просторами пам’яті.

Типовий розклад:

- **Частота циклу**: `dreaming.frequency = 0 3 * * *`
- **Пороги deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Приклад:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Примітки:

- `memory index --verbose` виводить деталі по фазах (provider, model, sources, активність пакетів).
- `memory status` включає будь-які додаткові шляхи, налаштовані через `memorySearch.extraPaths`.
- Якщо поля ключів віддаленого API для фактично активної пам’яті налаштовані як SecretRef, команда розв’язує ці значення з активного знімка Gateway. Якщо Gateway недоступний, команда швидко завершується з помилкою.
- Примітка щодо розходження версій Gateway: цей шлях команди потребує Gateway, який підтримує `secrets.resolve`; старіші Gateway повертають помилку unknown-method.
- Налаштовуйте частоту запланованих циклів через `dreaming.frequency`. Політика deep promotion в іншому разі є внутрішньою; використовуйте прапорці CLI у `memory promote`, коли потрібні разові ручні перевизначення.
- `memory rem-harness --path <file-or-dir> --grounded` виконує попередній перегляд grounded `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток без будь-якого запису.
- `memory rem-backfill --path <file-or-dir>` записує зворотні grounded-записи щоденника до `DREAMS.md` для перегляду в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також засіває grounded-стійких кандидатів у live-сховище promotion короткострокової пам’яті, щоб звичайна фаза deep могла їх ранжувати.
- `memory rem-backfill --rollback` видаляє раніше записані grounded-записи щоденника, а `memory rem-backfill --rollback-short-term` видаляє раніше підготовлених grounded-кандидатів короткострокової пам’яті.
- Див. [Dreaming](/uk/concepts/dreaming) для повних описів фаз і довідника з конфігурації.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Огляд пам’яті](/uk/concepts/memory)
