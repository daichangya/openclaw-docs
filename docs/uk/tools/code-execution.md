---
read_when:
    - Ви хочете ввімкнути або налаштувати code_execution
    - Ви хочете віддалений аналіз без доступу до локального shell
    - Ви хочете поєднати x_search або web_search із віддаленим Python-аналізом
summary: code_execution -- запуск sandboxed віддаленого Python-аналізу з xAI
title: Виконання коду
x-i18n:
    generated_at: "2026-04-23T23:07:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e8df7da1f5a7039aa47b772a8b3937d4e23bccccfdb81eacb59058a39180b97
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` запускає sandboxed віддалений Python-аналіз через Responses API xAI.
Це відрізняється від локального [`exec`](/uk/tools/exec):

- `exec` запускає shell-команди на вашій машині або Node
- `code_execution` запускає Python у віддаленому sandbox xAI

Використовуйте `code_execution` для:

- обчислень
- табуляції
- швидкої статистики
- аналізу у форматі chart
- аналізу даних, повернених `x_search` або `web_search`

**Не** використовуйте його, коли вам потрібні локальні файли, ваш shell, ваш репозиторій або сполучені
пристрої. Для цього використовуйте [`exec`](/uk/tools/exec).

## Налаштування

Вам потрібен API key xAI. Підійде будь-який із цих варіантів:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Приклад:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Як це використовувати

Пишіть природно і явно вказуйте намір аналізу:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Інструмент внутрішньо приймає єдиний параметр `task`, тому агент має надсилати
повний запит на аналіз і всі inline-дані одним prompt-ом.

## Обмеження

- Це віддалене виконання xAI, а не локальне виконання процесів.
- Його слід розглядати як ефемерний аналіз, а не як постійний notebook.
- Не припускайте наявності доступу до локальних файлів або вашого робочого простору.
- Для свіжих даних X спочатку використовуйте [`x_search`](/uk/tools/web#x_search).

## Див. також

- [Вебінструменти](/uk/tools/web)
- [Exec](/uk/tools/exec)
- [xAI](/uk/providers/xai)

## Пов’язане

- [Інструмент Exec](/uk/tools/exec)
- [Підтвердження Exec](/uk/tools/exec-approvals)
- [Інструмент apply_patch](/uk/tools/apply-patch)
