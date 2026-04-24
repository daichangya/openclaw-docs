---
read_when:
    - Ви хочете коротші результати інструментів `exec` або `bash` в OpenClaw
    - Ви хочете ввімкнути вбудований Plugin tokenjuice
    - Вам потрібно зрозуміти, що змінює tokenjuice і що він залишає в сирому вигляді
summary: Компактування шумних результатів інструментів exec і bash за допомогою необов’язкового вбудованого Plugin-а
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T19:53:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` — це необов’язковий вбудований Plugin, який виконує Compaction шумних результатів інструментів `exec` і `bash`
після того, як команда вже була виконана.

Він змінює повернений `tool_result`, а не саму команду. Tokenjuice не
переписує shell-ввід, не перезапускає команди й не змінює коди виходу.

Наразі це застосовується до вбудованих запусків PI та динамічних інструментів OpenClaw у harness app-server Codex. Tokenjuice підключається до middleware результатів інструментів OpenClaw і
обрізає вивід перед тим, як він повертається в активний сеанс harness-а.

## Увімкнення Plugin-а

Швидкий шлях:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Еквівалент:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw уже постачається з цим Plugin-ом. Окремого кроку `plugins install`
або `tokenjuice install openclaw` немає.

Якщо вам зручніше редагувати config напряму:

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

- Виконує Compaction шумних результатів `exec` і `bash` перед тим, як вони повертаються в сеанс.
- Залишає оригінальне виконання команди без змін.
- Зберігає точне читання вмісту файлів та інші команди, які tokenjuice має залишати сирими.
- Залишається opt-in: вимкніть Plugin, якщо хочете дослівний вивід усюди.

## Як перевірити, що він працює

1. Увімкніть Plugin.
2. Запустіть сеанс, який може викликати `exec`.
3. Виконайте шумну команду, наприклад `git status`.
4. Переконайтеся, що повернений результат інструмента коротший і більш структурований, ніж сирий shell-вивід.

## Вимкнення Plugin-а

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Або:

```bash
openclaw plugins disable tokenjuice
```

## Пов’язане

- [Exec tool](/uk/tools/exec)
- [Thinking levels](/uk/tools/thinking)
- [Context engine](/uk/concepts/context-engine)
