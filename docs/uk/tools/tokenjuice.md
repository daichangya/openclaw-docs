---
read_when:
    - Ви хочете коротші результати інструментів `exec` або `bash` в OpenClaw
    - Ви хочете ввімкнути bundled Plugin tokenjuice
    - Вам потрібно зрозуміти, що змінює tokenjuice, а що він залишає сирим
summary: Стискання шумних результатів інструментів exec і bash за допомогою необов’язкового bundled Plugin
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T23:08:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` — це необов’язковий bundled Plugin, який стискає шумні результати інструментів `exec` і `bash`
після того, як команда вже виконалася.

Він змінює повернений `tool_result`, а не саму команду. Tokenjuice не
переписує shell-ввід, не перезапускає команди й не змінює коди виходу.

Сьогодні це застосовується до вбудованих запусків Pi, де tokenjuice перехоплює вбудований
шлях `tool_result` і обрізає вивід, який повертається в сесію.

## Увімкнення Plugin

Швидкий шлях:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Еквівалент:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw уже постачає цей Plugin. Окремого кроку `plugins install`
або `tokenjuice install openclaw` немає.

Якщо ви віддаєте перевагу прямому редагуванню конфігурації:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Що змінює tokenjuice

- Стискає шумні результати `exec` і `bash` перед тим, як вони повертаються в сесію.
- Не змінює оригінальне виконання команди.
- Зберігає точне читання вмісту файлів та інші команди, які tokenjuice має залишати сирими.
- Залишається опціональним: вимкніть Plugin, якщо хочете буквальний вивід всюди.

## Як перевірити, що це працює

1. Увімкніть Plugin.
2. Запустіть сесію, яка може викликати `exec`.
3. Виконайте шумну команду, наприклад `git status`.
4. Переконайтеся, що повернений результат інструмента коротший і структурованіший, ніж сирий shell-вивід.

## Вимкнення Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Або:

```bash
openclaw plugins disable tokenjuice
```

## Пов’язане

- [Інструмент Exec](/uk/tools/exec)
- [Рівні мислення](/uk/tools/thinking)
- [Рушій контексту](/uk/concepts/context-engine)
