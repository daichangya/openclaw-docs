---
read_when:
    - Ви хочете зрозуміти, що означає “context” в OpenClaw
    - Ви налагоджуєте, чому модель “знає” щось (або забула це)
    - Ви хочете зменшити накладні витрати контексту (/context, /status, /compact)
summary: 'Контекст: що бачить модель, як він формується і як його перевірити'
title: Context
x-i18n:
    generated_at: "2026-04-05T18:00:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Context

«Контекст» — це **все, що OpenClaw надсилає моделі для одного запуску**. Він обмежений **вікном контексту** моделі (лімітом токенів).

Базова ментальна модель:

- **System prompt** (побудований OpenClaw): правила, інструменти, список Skills, час/runtime та впроваджені файли робочого простору.
- **Історія розмови**: ваші повідомлення + повідомлення асистента для цієї сесії.
- **Виклики/результати інструментів + вкладення**: вивід команд, читання файлів, зображення/аудіо тощо.

Контекст _це не те саме_, що й «memory»: memory може зберігатися на диску й повторно завантажуватися пізніше; context — це те, що міститься в поточному вікні моделі.

## Швидкий старт (перевірка context)

- `/status` → швидкий перегляд «наскільки заповнене моє вікно?» + налаштування сесії.
- `/context list` → що впроваджується + приблизні розміри (для кожного файлу + підсумки).
- `/context detail` → глибший розбір: розміри для кожного файлу, для кожної схеми інструмента, для кожного запису skill і розмір system prompt.
- `/usage tokens` → додає до звичайних відповідей нижній колонтитул із використанням.
- `/compact` → підсумовує старішу історію в compact entry, щоб звільнити місце у вікні.

Див. також: [Slash commands](/tools/slash-commands), [Використання токенів і вартість](/reference/token-use), [Compaction](/concepts/compaction).

## Приклад виводу

Значення залежать від моделі, провайдера, політики інструментів і того, що є у вашому робочому просторі.

### `/context list`

```
🧠 Розбивка контексту
Робочий простір: <workspaceDir>
Макс. bootstrap/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Впроваджені файли робочого простору:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Список Skills (текст system prompt): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Список інструментів (текст system prompt): 1,032 chars (~258 tok)
Схеми інструментів (JSON): 31,988 chars (~7,997 tok) (враховується в context; не показується як текст)
Tools: (те саме, що вище)

Токени сесії (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Розбивка контексту (детально)
…
Найбільші skills (розмір запису в prompt):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Найбільші tools (розмір схеми):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## Що враховується у вікні контексту

Усе, що отримує модель, враховується, зокрема:

- System prompt (усі розділи).
- Історія розмови.
- Виклики інструментів + результати інструментів.
- Вкладення/транскрипти (зображення/аудіо/файли).
- Підсумки compaction і артефакти pruning.
- «Обгортки» провайдера або приховані заголовки (не видимі, але все одно враховуються).

## Як OpenClaw будує system prompt

System prompt **належить OpenClaw** і перебудовується для кожного запуску. Він включає:

- Список інструментів + короткі описи.
- Список Skills (лише метадані; див. нижче).
- Розташування робочого простору.
- Час (UTC + перетворений користувацький час, якщо налаштовано).
- Метадані runtime (хост/OS/модель/thinking).
- Впроваджені bootstrap-файли робочого простору в розділі **Project Context**.

Повна розбивка: [System Prompt](/concepts/system-prompt).

## Впроваджені файли робочого простору (Project Context)

Типово OpenClaw впроваджує фіксований набір файлів робочого простору (якщо вони існують):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (лише під час першого запуску)

Великі файли обрізаються для кожного файлу окремо через `agents.defaults.bootstrapMaxChars` (типово `20000` chars). OpenClaw також примусово застосовує загальне обмеження на впровадження bootstrap у всіх файлах через `agents.defaults.bootstrapTotalMaxChars` (типово `150000` chars). `/context` показує розміри **raw vs injected** і те, чи відбулося обрізання.

Коли відбувається обрізання, runtime може впровадити в prompt блок попередження в розділі Project Context. Це налаштовується через `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; типово `once`).

## Skills: впроваджені чи завантажені на вимогу

System prompt включає компактний **список Skills** (назва + опис + розташування). Цей список має реальні накладні витрати.

Інструкції Skills _типово не включаються_. Очікується, що модель викличе `read` для `SKILL.md` skill **лише за потреби**.

## Tools: є дві вартості

Інструменти впливають на context двома способами:

1. **Текст списку інструментів** у system prompt (те, що ви бачите як «Tooling»).
2. **Схеми інструментів** (JSON). Вони надсилаються моделі, щоб вона могла викликати інструменти. Вони враховуються в context, навіть якщо ви не бачите їх як звичайний текст.

`/context detail` розбиває найбільші схеми інструментів, щоб ви могли побачити, що домінує.

## Команди, директиви й "inline shortcuts"

Slash-команди обробляються Gateway. Є кілька різних типів поведінки:

- **Standalone commands**: повідомлення, яке складається лише з `/...`, виконується як команда.
- **Directives**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` прибираються до того, як модель побачить повідомлення.
  - Повідомлення лише з директивами зберігають налаштування сесії.
  - Inline directives у звичайному повідомленні діють як підказки для конкретного повідомлення.
- **Inline shortcuts** (лише для allowlisted senders): деякі токени `/...` всередині звичайного повідомлення можуть виконуватися негайно (приклад: «hey /status») і прибираються до того, як модель побачить решту тексту.

Подробиці: [Slash commands](/tools/slash-commands).

## Sessions, compaction і pruning (що зберігається)

Те, що зберігається між повідомленнями, залежить від механізму:

- **Normal history** зберігається в session transcript, доки не буде ущільнено/обрізано політикою.
- **Compaction** зберігає підсумок у transcript і залишає нещодавні повідомлення без змін.
- **Pruning** видаляє старі результати інструментів із prompt _у пам’яті_ для запуску, але не переписує transcript.

Документація: [Session](/concepts/session), [Compaction](/concepts/compaction), [Session pruning](/concepts/session-pruning).

Типово OpenClaw використовує вбудований `legacy` context engine для збирання і
compaction. Якщо ви встановите plugin, який надає `kind: "context-engine"`, і
виберете його через `plugins.slots.contextEngine`, OpenClaw делегує збирання
context, `/compact` та пов’язані hooks життєвого циклу контексту субагентів цьому
engine. `ownsCompaction: false` не спричиняє автоматичний резервний перехід до
legacy engine; активний engine все одно має коректно реалізовувати `compact()`. Див.
[Context Engine](/concepts/context-engine), щоб ознайомитися з повним
інтерфейсом підключення, hooks життєвого циклу та конфігурацією.

## Що насправді показує `/context`

`/context` за можливості надає перевагу найсвіжішому звіту про system prompt, **побудованого під час запуску**:

- `System prompt (run)` = захоплено з останнього вбудованого запуску (з підтримкою інструментів) і збережено в session store.
- `System prompt (estimate)` = обчислено на льоту, коли звіту про запуск немає (або під час виконання через CLI backend, який не генерує такого звіту).

У будь-якому разі він повідомляє розміри та найбільші складові; він **не** виводить повний system prompt або схеми інструментів.

## Пов’язане

- [Context Engine](/concepts/context-engine) — власне впровадження контексту через plugins
- [Compaction](/concepts/compaction) — підсумовування довгих розмов
- [System Prompt](/concepts/system-prompt) — як будується system prompt
- [Agent Loop](/concepts/agent-loop) — повний цикл виконання агента
