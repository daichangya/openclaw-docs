---
read_when:
    - Вам потрібно зрозуміти, як часові позначки нормалізуються для моделі
    - Налаштування часового поясу користувача для системних prompt
summary: Обробка часових поясів для агентів, конвертів і prompt
title: Часові пояси
x-i18n:
    generated_at: "2026-04-05T18:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# Часові пояси

OpenClaw стандартизує часові позначки, щоб модель бачила **єдиний опорний час**.

## Конверти повідомлень (типово локальні)

Вхідні повідомлення загортаються в конверт на кшталт:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Часова позначка в конверті **типово є локальною для хоста**, з точністю до хвилин.

Ви можете перевизначити це за допомогою:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` використовує UTC.
- `envelopeTimezone: "user"` використовує `agents.defaults.userTimezone` (з резервним переходом на часовий пояс хоста).
- Використовуйте явний часовий пояс IANA (наприклад, `"Europe/Vienna"`) для фіксованого зсуву.
- `envelopeTimestamp: "off"` прибирає абсолютні часові позначки із заголовків конверта.
- `envelopeElapsed: "off"` прибирає суфікси відносного часу (у стилі `+2m`).

### Приклади

**Локальний (типово):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Фіксований часовий пояс:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Відносний час:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Payload інструментів (сирі дані провайдера + нормалізовані поля)

Виклики інструментів (`channels.discord.readMessages`, `channels.slack.readMessages` тощо) повертають **сирі часові позначки провайдера**.
Ми також додаємо нормалізовані поля для узгодженості:

- `timestampMs` (мілісекунди епохи UTC)
- `timestampUtc` (рядок UTC у форматі ISO 8601)

Сирі поля провайдера зберігаються.

## Часовий пояс користувача для системного prompt

Установіть `agents.defaults.userTimezone`, щоб повідомити моделі локальний часовий пояс користувача. Якщо він
не заданий, OpenClaw визначає **часовий пояс хоста під час виконання** (без запису в конфігурацію).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Системний prompt містить:

- розділ `Current Date & Time` з локальним часом і часовим поясом
- `Time format: 12-hour` або `24-hour`

Ви можете керувати форматом prompt через `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Повну поведінку та приклади див. у [Date & Time](/date-time).

## Пов’язане

- [Heartbeat](/gateway/heartbeat) — активні години використовують часовий пояс для планування
- [Cron Jobs](/automation/cron-jobs) — cron-вирази використовують часовий пояс для планування
- [Date & Time](/date-time) — повна поведінка дати/часу та приклади
