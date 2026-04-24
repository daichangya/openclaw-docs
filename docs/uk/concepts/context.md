---
read_when:
    - Ви хочете зрозуміти, що означає «контекст» в OpenClaw
    - Ви з’ясовуєте, чому модель «знає» щось (або забула це)
    - Ви хочете зменшити накладні витрати контексту (`/context`, `/status`, `/compact`)
summary: 'Контекст: що бачить модель, як він будується та як його перевірити'
title: Контекст
x-i18n:
    generated_at: "2026-04-24T03:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

«Контекст» — це **все, що OpenClaw надсилає моделі для одного запуску**. Він обмежений **вікном контексту** моделі (лімітом токенів).

Проста ментальна модель для початківців:

- **System prompt** (побудований OpenClaw): правила, інструменти, список Skills, час/runtime і вставлені файли робочого простору.
- **Історія розмови**: ваші повідомлення + повідомлення асистента для цієї сесії.
- **Виклики/результати інструментів + вкладення**: вивід команд, читання файлів, зображення/аудіо тощо.

Контекст _не те саме_, що «пам’ять»: пам’ять може зберігатися на диску й завантажуватися пізніше; контекст — це те, що міститься в поточному вікні моделі.

## Швидкий старт (перевірка контексту)

- `/status` → швидкий перегляд «наскільки заповнене моє вікно?» + параметри сесії.
- `/context list` → що вставляється + приблизні розміри (для кожного файлу + підсумки).
- `/context detail` → глибший розбір: розміри для кожного файлу, кожної схеми інструмента, кожного запису Skills і розмір system prompt.
- `/usage tokens` → додає нижній колонтитул із використанням до звичайних відповідей.
- `/compact` → стискає старішу історію в компактний запис, щоб звільнити місце у вікні.

Див. також: [Slash commands](/uk/tools/slash-commands), [Використання токенів і вартість](/uk/reference/token-use), [Compaction](/uk/concepts/compaction).

## Приклад виводу

Значення відрізняються залежно від моделі, провайдера, політики інструментів і вмісту вашого робочого простору.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## Що входить до вікна контексту

Усе, що отримує модель, враховується, зокрема:

- System prompt (усі секції).
- Історія розмови.
- Виклики інструментів + результати інструментів.
- Вкладення/транскрипти (зображення/аудіо/файли).
- Підсумки Compaction і артефакти pruning.
- «Обгортки» провайдера або приховані заголовки (не видимі, але все одно враховуються).

## Як OpenClaw будує system prompt

System prompt **належить OpenClaw** і перебудовується під час кожного запуску. Він містить:

- Список інструментів + короткі описи.
- Список Skills (лише метадані; див. нижче).
- Розташування робочого простору.
- Час (UTC + перетворений час користувача, якщо налаштовано).
- Метадані runtime (хост/ОС/модель/thinking).
- Вставлені bootstrap-файли робочого простору в розділі **Project Context**.

Повний розбір: [System Prompt](/uk/concepts/system-prompt).

## Вставлені файли робочого простору (Project Context)

Типово OpenClaw вставляє фіксований набір файлів робочого простору (якщо вони існують):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (лише під час першого запуску)

Великі файли обрізаються для кожного файлу окремо за допомогою `agents.defaults.bootstrapMaxChars` (типово `12000` символів). OpenClaw також застосовує загальне обмеження на вставлення bootstrap для всіх файлів через `agents.defaults.bootstrapTotalMaxChars` (типово `60000` символів). `/context` показує розміри **raw vs injected** і те, чи відбулося обрізання.

Коли відбувається обрізання, runtime може вставити в prompt блок попередження в розділі Project Context. Це налаштовується через `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; типово `once`).

## Skills: вставлені чи завантажуються на вимогу

System prompt містить компактний **список Skills** (назва + опис + розташування). Цей список створює реальні накладні витрати.

Інструкції Skills _не_ включаються типово. Очікується, що модель читатиме `SKILL.md` навички за допомогою `read` **лише коли це потрібно**.

## Tools: є дві складові вартості

Tools впливають на контекст двома способами:

1. **Текст списку інструментів** у system prompt (те, що ви бачите як “Tooling”).
2. **Схеми інструментів** (JSON). Вони надсилаються моделі, щоб вона могла викликати інструменти. Вони враховуються в контексті, хоча ви не бачите їх як звичайний текст.

`/context detail` розбиває найбільші схеми інструментів, щоб ви могли побачити, що домінує.

## Команди, директиви та "inline shortcuts"

Slash commands обробляються Gateway. Існує кілька різних варіантів поведінки:

- **Окремі команди**: повідомлення, яке містить лише `/...`, виконується як команда.
- **Директиви**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` видаляються до того, як модель побачить повідомлення.
  - Повідомлення лише з директивами зберігають параметри сесії.
  - Вбудовані директиви у звичайному повідомленні працюють як підказки для конкретного повідомлення.
- **Inline shortcuts** (лише для відправників з allowlist): певні токени `/...` усередині звичайного повідомлення можуть виконуватися негайно (приклад: “hey /status”), і видаляються до того, як модель побачить решту тексту.

Подробиці: [Slash commands](/uk/tools/slash-commands).

## Сесії, Compaction і pruning (що зберігається)

Що саме зберігається між повідомленнями, залежить від механізму:

- **Звичайна історія** зберігається в транскрипті сесії, доки не буде стиснута/очищена політикою.
- **Compaction** зберігає підсумок у транскрипті й залишає недавні повідомлення без змін.
- **Pruning** видаляє старі результати інструментів із prompt _у пам’яті_, щоб звільнити місце у вікні контексту, але не переписує транскрипт сесії — повну історію все одно можна переглянути на диску.

Документація: [Session](/uk/concepts/session), [Compaction](/uk/concepts/compaction), [Session pruning](/uk/concepts/session-pruning).

Типово OpenClaw використовує вбудований рушій контексту `legacy` для збирання та
Compaction. Якщо ви встановите Plugin, який надає `kind: "context-engine"`, і
виберете його через `plugins.slots.contextEngine`, OpenClaw замість цього делегує
цьому рушію збирання контексту, `/compact` і пов’язані хуки життєвого циклу контексту субагента. `ownsCompaction: false` не вмикає автоматичний резервний перехід до
рушія legacy; активний рушій усе одно має коректно реалізовувати `compact()`. Див.
[Context Engine](/uk/concepts/context-engine) для повного
інтерфейсу підключення, хуків життєвого циклу та конфігурації.

## Що насправді показує `/context`

`/context` за можливості віддає перевагу найновішому звіту про system prompt, **побудованому під час запуску**:

- `System prompt (run)` = захоплений під час останнього вбудованого запуску (з підтримкою інструментів) і збережений у сховищі сесії.
- `System prompt (estimate)` = обчислюється на льоту, коли звіту про запуск немає (або під час виконання через backend CLI, який не генерує звіт).

У будь-якому випадку він показує розміри та найбільші складові; він **не** виводить повний system prompt або схеми інструментів.

## Пов’язане

- [Context Engine](/uk/concepts/context-engine) — користувацьке вставлення контексту через plugins
- [Compaction](/uk/concepts/compaction) — підсумовування довгих розмов
- [System Prompt](/uk/concepts/system-prompt) — як будується system prompt
- [Agent Loop](/uk/concepts/agent-loop) — повний цикл виконання агента
