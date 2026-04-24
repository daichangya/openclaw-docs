---
read_when:
    - Вам потрібно скористатися CLI memory-wiki
    - Ви документуєте або змінюєте `openclaw wiki`
summary: Довідка CLI для `openclaw wiki` (стан сховища memory-wiki, пошук, компіляція, lint, apply, bridge та допоміжні засоби Obsidian)
title: Вікі
x-i18n:
    generated_at: "2026-04-24T04:13:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Переглядайте та підтримуйте сховище `memory-wiki`.

Надається вбудованим Plugin `memory-wiki`.

Пов’язане:

- [Plugin Memory Wiki](/uk/plugins/memory-wiki)
- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: memory](/uk/cli/memory)

## Для чого це

Використовуйте `openclaw wiki`, коли вам потрібне скомпільоване сховище знань із:

- пошуком і читанням сторінок, нативними для вікі
- синтезами з багатим походженням даних
- звітами про суперечності й актуальність
- bridge-імпортом з активного плагіна пам’яті
- необов’язковими допоміжними засобами CLI Obsidian

## Поширені команди

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Команди

### `wiki status`

Перегляньте поточний режим сховища, стан працездатності та доступність CLI Obsidian.

Спочатку використовуйте це, якщо ви не впевнені, чи сховище ініціалізоване, чи режим bridge
працює коректно, або чи доступна інтеграція з Obsidian.

### `wiki doctor`

Запустіть перевірки працездатності вікі та виявте проблеми конфігурації або сховища.

Типові проблеми:

- режим bridge увімкнено без публічних артефактів пам’яті
- недійсна або відсутня структура сховища
- відсутній зовнішній CLI Obsidian, коли очікується режим Obsidian

### `wiki init`

Створіть структуру сховища вікі та стартові сторінки.

Це ініціалізує кореневу структуру, включно з індексами верхнього рівня та каталогами
кешу.

### `wiki ingest <path-or-url>`

Імпортуйте вміст у вихідний шар вікі.

Примітки:

- URL-імпорт контролюється `ingest.allowUrlIngest`
- імпортовані вихідні сторінки зберігають походження у frontmatter
- за наявності відповідного налаштування після імпорту може запускатися автокомпіляція

### `wiki compile`

Перебудуйте індекси, пов’язані блоки, інформаційні панелі та скомпільовані дайджести.

Це записує стабільні машинно-орієнтовані артефакти до:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Якщо увімкнено `render.createDashboards`, компіляція також оновлює сторінки звітів.

### `wiki lint`

Запустіть lint для сховища та отримайте звіт про:

- структурні проблеми
- прогалини в походженні даних
- суперечності
- відкриті питання
- сторінки/твердження з низькою впевненістю
- застарілі сторінки/твердження

Запускайте це після суттєвих оновлень вікі.

### `wiki search <query>`

Шукайте вміст вікі.

Поведінка залежить від конфігурації:

- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`

Використовуйте `wiki search`, коли вам потрібні ранжування, специфічне для вікі, або деталі походження даних.
Для одного широкого спільного проходу пошуку краще використовуйте `openclaw memory search`, коли
активний плагін пам’яті надає спільний пошук.

### `wiki get <lookup>`

Прочитайте сторінку вікі за id або відносним шляхом.

Приклади:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Застосовуйте вузькі зміни без довільного редагування сторінок.

Підтримувані сценарії:

- створення/оновлення сторінки синтезу
- оновлення метаданих сторінки
- прикріплення source id
- додавання питань
- додавання суперечностей
- оновлення впевненості/статусу
- запис структурованих тверджень

Ця команда існує для того, щоб вікі могла безпечно розвиватися без ручного редагування
керованих блоків.

### `wiki bridge import`

Імпортуйте публічні артефакти пам’яті з активного плагіна пам’яті у вихідні сторінки
на основі bridge.

Використовуйте це в режимі `bridge`, коли хочете отримати у сховище вікі
найновіші експортовані артефакти пам’яті.

### `wiki unsafe-local import`

Імпортуйте з явно налаштованих локальних шляхів у режимі `unsafe-local`.

Це навмисно експериментальна можливість і працює лише на тій самій машині.

### `wiki obsidian ...`

Допоміжні команди Obsidian для сховищ, що працюють у дружньому до Obsidian режимі.

Підкоманди:

- `status`
- `search`
- `open`
- `command`
- `daily`

Для них потрібен офіційний CLI `obsidian` у `PATH`, коли
увімкнено `obsidian.useOfficialCli`.

## Практичні рекомендації щодо використання

- Використовуйте `wiki search` + `wiki get`, коли важливі походження даних і ідентичність сторінки.
- Використовуйте `wiki apply` замість ручного редагування керованих згенерованих розділів.
- Використовуйте `wiki lint`, перш ніж довіряти суперечливому вмісту або вмісту з низькою впевненістю.
- Використовуйте `wiki compile` після масових імпортів або змін джерел, коли вам одразу потрібні
  актуальні інформаційні панелі та скомпільовані дайджести.
- Використовуйте `wiki bridge import`, коли режим bridge залежить від нещодавно експортованих
  артефактів пам’яті.

## Пов’язані параметри конфігурації

Поведінку `openclaw wiki` визначають:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Повну модель конфігурації дивіться в [Plugin Memory Wiki](/uk/plugins/memory-wiki).

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Memory wiki](/uk/plugins/memory-wiki)
