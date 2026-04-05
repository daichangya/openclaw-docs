---
read_when:
    - Ви хочете зрозуміти auto-compaction і /compact
    - Ви налагоджуєте довгі сесії, які досягають лімітів контексту
summary: Як OpenClaw підсумовує довгі розмови, щоб залишатися в межах лімітів моделі
title: Compaction
x-i18n:
    generated_at: "2026-04-05T18:00:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Кожна модель має context window — максимальну кількість токенів, які вона може обробити.
Коли розмова наближається до цього ліміту, OpenClaw **ущільнює** старіші повідомлення
в підсумок, щоб чат міг продовжуватися.

## Як це працює

1. Старіші ходи розмови підсумовуються в compact entry.
2. Підсумок зберігається в session transcript.
3. Нещодавні повідомлення зберігаються без змін.

Коли OpenClaw розбиває історію на compaction chunks, він зберігає виклики
інструментів assistant у парі з відповідними записами `toolResult`. Якщо точка
розбиття потрапляє всередину блоку інструмента, OpenClaw зміщує межу так, щоб
пара залишалася разом, а поточний непідсумований хвіст зберігався.

Повна історія розмови залишається на диску. Compaction змінює лише те, що
модель бачить на наступному ході.

## Auto-compaction

Auto-compaction типово ввімкнено. Вона запускається, коли сесія наближається до
ліміту контексту, або коли модель повертає помилку переповнення контексту (у такому разі
OpenClaw виконує compaction і повторює спробу). Типові сигнатури переповнення включають
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` і `ollama error: context length
exceeded`.

<Info>
Перед compaction OpenClaw автоматично нагадує агенту зберегти важливі
нотатки у файли [memory](/concepts/memory). Це запобігає втраті контексту.
</Info>

## Ручне ущільнення

Введіть `/compact` у будь-якому чаті, щоб примусово виконати compaction. Додайте інструкції, щоб спрямувати
підсумок:

```
/compact Focus on the API design decisions
```

## Використання іншої моделі

Типово compaction використовує основну модель вашого агента. Ви можете використовувати
потужнішу модель для кращих підсумків:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Сповіщення про початок compaction

Типово compaction виконується без повідомлень. Щоб показувати коротке сповіщення, коли compaction
починається, увімкніть `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Коли цю опцію ввімкнено, користувач бачить коротке повідомлення (наприклад, "Compacting
context...") на початку кожного запуску compaction.

## Compaction проти pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Що це робить** | Підсумовує старішу розмову    | Обрізає старі результати інструментів |
| **Зберігається?**| Так (у session transcript)    | Ні (лише в пам’яті, для кожного запиту) |
| **Обсяг**        | Уся розмова                   | Лише результати інструментів     |

[Session pruning](/concepts/session-pruning) — це легше доповнення, яке
обрізає вивід інструментів без підсумовування.

## Усунення проблем

**Compacting занадто часто?** Можливо, context window моделі замале, або виводи
інструментів завеликі. Спробуйте ввімкнути
[session pruning](/concepts/session-pruning).

**Після compaction контекст здається застарілим?** Використовуйте `/compact Focus on <topic>`, щоб
спрямувати підсумок, або ввімкніть [memory flush](/concepts/memory), щоб нотатки
зберігалися.

**Потрібен чистий старт?** `/new` починає нову сесію без compaction.

Для розширеної конфігурації (reserve tokens, збереження ідентифікаторів, custom
context engines, server-side compaction OpenAI) див.
[Session Management Deep Dive](/reference/session-management-compaction).

## Пов’язане

- [Session](/concepts/session) — керування сесією та життєвий цикл
- [Session Pruning](/concepts/session-pruning) — обрізання результатів інструментів
- [Context](/concepts/context) — як будується контекст для ходів агента
- [Hooks](/automation/hooks) — hooks життєвого циклу compaction (`before_compaction`, `after_compaction`)
