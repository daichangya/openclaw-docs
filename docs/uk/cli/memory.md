---
read_when:
    - Ви хочете індексувати або шукати семантичну пам’ять.
    - Ви налагоджуєте доступність пам’яті або індексування.
    - Ви хочете перенести відновлену короткочасну пам’ять до `MEMORY.md`.
summary: Довідник CLI для `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: пам’ять
x-i18n:
    generated_at: "2026-04-23T07:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Керуйте індексуванням і пошуком семантичної пам’яті.
Надається активним plugin пам’яті (типово: `memory-core`; установіть `plugins.slots.memory = "none"`, щоб вимкнути).

Пов’язано:

- Концепція пам’яті: [Пам’ять](/uk/concepts/memory)
- Вікі пам’яті: [Memory Wiki](/uk/plugins/memory-wiki)
- CLI вікі: [wiki](/uk/cli/wiki)
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
- `--verbose`: виводити докладні журнали під час перевірок та індексування.

`memory status`:

- `--deep`: перевірити доступність векторів і вбудовувань.
- `--index`: виконати повторне індексування, якщо сховище брудне (має на увазі `--deep`).
- `--fix`: відновити застарілі блокування recall і нормалізувати метадані перенесення.
- `--json`: вивести JSON.

Якщо `memory status` показує `Dreaming status: blocked`, це означає, що керований Cron для dreaming увімкнено, але Heartbeat, який його запускає, не спрацьовує для типового агента. Див. [Dreaming never runs](/uk/concepts/dreaming#dreaming-never-runs-status-shows-blocked) для двох поширених причин.

`memory index`:

- `--force`: примусово виконати повне повторне індексування.

`memory search`:

- Вхід запиту: передайте або позиційний `[query]`, або `--query <text>`.
- Якщо передано обидва, пріоритет має `--query`.
- Якщо не передано жодного, команда завершується з помилкою.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--max-results <n>`: обмежити кількість повернених результатів.
- `--min-score <n>`: відфільтрувати збіги з низькою оцінкою.
- `--json`: вивести результати у форматі JSON.

`memory promote`:

Попередній перегляд і застосування перенесення короткочасної пам’яті.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- записати перенесення до `MEMORY.md` (типово: лише попередній перегляд).
- `--limit <n>` -- обмежити кількість показаних кандидатів.
- `--include-promoted` -- включити записи, уже перенесені в попередніх циклах.

Повні параметри:

- Ранжує короткочасних кандидатів із `memory/YYYY-MM-DD.md` з використанням зважених сигналів перенесення (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Використовує короткочасні сигнали як із відновлень пам’яті, так і з щоденних проходів поглинання, а також сигнали підсилення фаз light/REM.
- Коли dreaming увімкнено, `memory-core` автоматично керує одним завданням Cron, яке запускає повний прохід (`light -> REM -> deep`) у фоновому режимі (ручний `openclaw cron add` не потрібен).
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--limit <n>`: максимальна кількість кандидатів для повернення/застосування.
- `--min-score <n>`: мінімальна зважена оцінка перенесення.
- `--min-recall-count <n>`: мінімальна кількість recall, потрібна для кандидата.
- `--min-unique-queries <n>`: мінімальна кількість різних запитів, потрібна для кандидата.
- `--apply`: додати вибраних кандидатів до `MEMORY.md` і позначити їх як перенесені.
- `--include-promoted`: включити вивід для вже перенесених кандидатів.
- `--json`: вивести JSON.

`memory promote-explain`:

Пояснити конкретного кандидата на перенесення та розбивку його оцінки.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: ключ кандидата, фрагмент шляху або фрагмент уривка для пошуку.
- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже перенесених кандидатів.
- `--json`: вивести JSON.

`memory rem-harness`:

Попередньо переглянути REM-reflections, кандидатів на істини та вивід deep-перенесення без запису будь-чого.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: обмежити одним агентом (типово: типовий агент).
- `--include-promoted`: включити вже перенесених deep-кандидатів.
- `--json`: вивести JSON.

## Dreaming

Dreaming — це фонова система консолідації пам’яті з трьома кооперативними
фазами: **light** (сортування/підготовка короткочасного матеріалу), **deep** (перенесення стійких
фактів до `MEMORY.md`) і **REM** (осмислення та виявлення тем).

- Увімкніть через `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Перемикайте з чату за допомогою `/dreaming on|off` (або перевіряйте через `/dreaming status`).
- Dreaming працює за одним керованим розкладом проходів (`dreaming.frequency`) і виконує фази в порядку: light, REM, deep.
- Лише фаза deep записує стійку пам’ять до `MEMORY.md`.
- Людинозрозумілий вивід фаз і записи щоденника записуються до `DREAMS.md` (або наявного `dreams.md`), з необов’язковими звітами по фазах у `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ранжування використовує зважені сигнали: частота recall, релевантність відновлення, різноманітність запитів, часова недавність, міжденна консолідація та похідна концептуальна насиченість.
- Під час перенесення щоденна нотатка перечитується в живому стані перед записом до `MEMORY.md`, тому відредаговані або видалені короткочасні уривки не переносяться зі застарілих знімків сховища recall.
- Заплановані та ручні запуски `memory promote` використовують однакові типові параметри фази deep, якщо ви не передасте через CLI перевизначення порогів.
- Автоматичні запуски розподіляються між налаштованими робочими просторами пам’яті.

Типовий розклад:

- **Частота проходів**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` виводить подробиці по фазах (provider, model, джерела, активність пакетів).
- `memory status` включає будь-які додаткові шляхи, налаштовані через `memorySearch.extraPaths`.
- Якщо фактично активні поля ключів віддаленого API пам’яті налаштовані як SecretRef, команда отримує ці значення з активного знімка Gateway. Якщо Gateway недоступний, команда швидко завершується з помилкою.
- Примітка щодо розбіжності версій Gateway: цей шлях команди вимагає Gateway, який підтримує `secrets.resolve`; старіші Gateway повертають помилку unknown-method.
- Налаштовуйте частоту запланованих проходів через `dreaming.frequency`. В іншому політика deep-перенесення є внутрішньою; використовуйте прапорці CLI у `memory promote`, коли потрібні разові ручні перевизначення.
- `memory rem-harness --path <file-or-dir> --grounded` попередньо переглядає grounded `What Happened`, `Reflections` і `Possible Lasting Updates` з історичних щоденних нотаток без жодного запису.
- `memory rem-backfill --path <file-or-dir>` записує оборотні grounded-записи щоденника до `DREAMS.md` для перегляду в UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` також засіває grounded-стійких кандидатів до живого сховища перенесення короткочасної пам’яті, щоб звичайна фаза deep могла їх ранжувати.
- `memory rem-backfill --rollback` видаляє раніше записані grounded-записи щоденника, а `memory rem-backfill --rollback-short-term` видаляє раніше підготовлених grounded-кандидатів короткочасної пам’яті.
- Див. [Dreaming](/uk/concepts/dreaming) для повного опису фаз і довідника з конфігурації.
