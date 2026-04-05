---
read_when:
    - Ви хочете увімкнути або налаштувати code_execution
    - Вам потрібен віддалений аналіз без доступу до локальної оболонки
    - Ви хочете поєднати x_search або web_search із віддаленим аналізом Python
summary: code_execution -- запуск ізольованого віддаленого аналізу Python через xAI
title: Code Execution
x-i18n:
    generated_at: "2026-04-05T18:19:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Code Execution

`code_execution` запускає ізольований віддалений аналіз Python через Responses API від xAI.
Це відрізняється від локального [`exec`](/tools/exec):

- `exec` запускає shell-команди на вашій машині або вузлі
- `code_execution` запускає Python у віддаленій sandbox від xAI

Використовуйте `code_execution` для:

- обчислень
- табулювання
- швидкої статистики
- аналізу у форматі діаграм
- аналізу даних, повернутих `x_search` або `web_search`

**Не** використовуйте його, коли вам потрібні локальні файли, ваша оболонка, ваш репозиторій або спарені
пристрої. Для цього використовуйте [`exec`](/tools/exec).

## Налаштування

Вам потрібен API-ключ xAI. Підійде будь-який із цих варіантів:

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

Формулюйте запит природно й чітко вказуйте намір аналізу:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Інструмент внутрішньо приймає один параметр `task`, тому агент має надсилати
повний запит на аналіз і всі вбудовані дані в одному prompt.

## Обмеження

- Це віддалене виконання xAI, а не виконання локального процесу.
- Це слід розглядати як тимчасовий аналіз, а не як постійний notebook.
- Не припускайте наявності доступу до локальних файлів або вашого робочого простору.
- Для актуальних даних X спочатку використовуйте [`x_search`](/tools/web#x_search).

## Дивіться також

- [Веб-інструменти](/tools/web)
- [Exec](/tools/exec)
- [xAI](/uk/providers/xai)
