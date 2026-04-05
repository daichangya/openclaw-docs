---
read_when:
    - Ручне початкове налаштування робочого простору
summary: Шаблон робочого простору для TOOLS.md
title: Шаблон TOOLS.md
x-i18n:
    generated_at: "2026-04-05T18:16:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: eed204d57e7221ae0455a87272da2b0730d6aee6ddd2446a851703276e4a96b7
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Локальні нотатки

Skills визначають, _як_ працюють інструменти. Цей файл призначений для _ваших_ конкретних даних — речей, унікальних для вашого середовища.

## Що тут має бути

Наприклад:

- Назви та розташування камер
- SSH-хости та псевдоніми
- Бажані голоси для TTS
- Назви колонок/кімнат
- Псевдоніми пристроїв
- Будь-що специфічне для середовища

## Приклади

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Чому окремо?

Skills є спільними. Ваше середовище — ваше. Якщо тримати це окремо, ви зможете оновлювати Skills, не втрачаючи свої нотатки, і ділитися Skills, не розкриваючи свою інфраструктуру.

---

Додавайте все, що допомагає вам виконувати свою роботу. Це ваша шпаргалка.
