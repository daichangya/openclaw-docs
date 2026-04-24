---
read_when:
    - Ви хочете ввімкнути або налаштувати code_execution
    - Вам потрібен віддалений аналіз без доступу до локальної оболонки
    - Ви хочете поєднати `x_search` або `web_search` з віддаленим аналізом Python
summary: code_execution — запуск віддаленого аналізу Python у sandbox з xAI
title: Виконання коду
x-i18n:
    generated_at: "2026-04-24T03:49:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` запускає віддалений аналіз Python у sandbox через Responses API від xAI.
Це відрізняється від локального [`exec`](/uk/tools/exec):

- `exec` запускає shell-команди на вашій машині або node
- `code_execution` запускає Python у віддаленому sandbox xAI

Використовуйте `code_execution` для:

- обчислень
- табуляції
- швидкої статистики
- аналізу у форматі chart
- аналізу даних, повернутих `x_search` або `web_search`

**Не** використовуйте його, коли вам потрібні локальні файли, ваша оболонка, ваш репозиторій або спарені
пристрої. Для цього використовуйте [`exec`](/uk/tools/exec).

## Налаштування

Вам потрібен API key xAI. Підійде будь-який із варіантів:

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

Ставте запит природно й явно вказуйте намір аналізу:

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
повний запит на аналіз і всі вбудовані дані в одному prompt.

## Обмеження

- Це віддалене виконання xAI, а не локальне виконання процесів.
- Його слід розглядати як тимчасовий аналіз, а не як постійний notebook.
- Не припускайте наявності доступу до локальних файлів або вашого робочого простору.
- Для свіжих даних X спочатку використовуйте [`x_search`](/uk/tools/web#x_search).

## Пов’язане

- [Інструмент Exec](/uk/tools/exec)
- [Схвалення Exec](/uk/tools/exec-approvals)
- [Інструмент apply_patch](/uk/tools/apply-patch)
- [Web tools](/uk/tools/web)
- [xAI](/uk/providers/xai)
