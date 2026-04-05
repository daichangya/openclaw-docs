---
read_when:
    - Додавання або зміна розбору місцезнаходження в каналах
    - Використання полів контексту місцезнаходження в промптах агента або інструментах
summary: Розбір місцезнаходження у вхідних каналах (Telegram/WhatsApp/Matrix) і поля контексту
title: Розбір місцезнаходження в каналах
x-i18n:
    generated_at: "2026-04-05T17:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# Розбір місцезнаходження в каналах

OpenClaw нормалізує спільні дані про місцезнаходження з чат-каналів у:

- зрозумілий людині текст, доданий до тіла вхідного повідомлення, і
- структуровані поля в корисному навантаженні контексту автовідповіді.

Наразі підтримується:

- **Telegram** (мітки місцезнаходження + venues + live locations)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` із `geo_uri`)

## Форматування тексту

Місцезнаходження відображаються як зручні рядки без дужок:

- Мітка:
  - `📍 48.858844, 2.294351 ±12m`
- Назване місце:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Спільний доступ у реальному часі:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Якщо канал містить підпис/коментар, він додається в наступному рядку:

```
📍 48.858844, 2.294351 ±12m
Meet here
```

## Поля контексту

Коли місцезнаходження присутнє, до `ctx` додаються такі поля:

- `LocationLat` (число)
- `LocationLon` (число)
- `LocationAccuracy` (число, метри; необов’язково)
- `LocationName` (рядок; необов’язково)
- `LocationAddress` (рядок; необов’язково)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (булеве значення)

## Примітки щодо каналів

- **Telegram**: venues зіставляються з `LocationName/LocationAddress`; live locations використовують `live_period`.
- **WhatsApp**: `locationMessage.comment` і `liveLocationMessage.caption` додаються як рядок підпису.
- **Matrix**: `geo_uri` розбирається як місцезнаходження-мітка; висота ігнорується, а `LocationIsLive` завжди має значення false.
