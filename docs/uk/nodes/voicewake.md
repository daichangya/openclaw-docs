---
read_when:
    - Зміна поведінки або типових значень voice wake words
    - Додавання нових платформ вузлів, яким потрібна синхронізація wake words
summary: Глобальні wake words для голосу (під керуванням Gateway) і їх синхронізація між вузлами
title: Voice Wake
x-i18n:
    generated_at: "2026-04-05T18:09:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# Voice Wake (глобальні wake words)

OpenClaw трактує **wake words як єдиний глобальний список**, яким володіє **Gateway**.

- **Немає користувацьких wake words для окремих вузлів**.
- **Будь-який UI вузла/застосунку може редагувати** список; зміни зберігаються Gateway і транслюються всім.
- macOS та iOS зберігають локальні перемикачі **Voice Wake увімкнено/вимкнено** (локальний UX + дозволи відрізняються).
- Android наразі тримає Voice Wake вимкненим і використовує ручний потік мікрофона у вкладці Voice.

## Зберігання (хост Gateway)

Wake words зберігаються на машині gateway за адресою:

- `~/.openclaw/settings/voicewake.json`

Структура:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Протокол

### Методи

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` з параметрами `{ triggers: string[] }` → `{ triggers: string[] }`

Примітки:

- Тригери нормалізуються (обрізаються пробіли, порожні значення відкидаються). Порожні списки повертаються до типових значень.
- З міркувань безпеки застосовуються обмеження (на кількість/довжину).

### Події

- `voicewake.changed` з payload `{ triggers: string[] }`

Хто її отримує:

- Усі WebSocket-клієнти (macOS app, WebChat тощо)
- Усі підключені вузли (iOS/Android), а також під час підключення вузла як початковий push із “поточним станом”.

## Поведінка клієнтів

### macOS app

- Використовує глобальний список для обмеження тригерів `VoiceWakeRuntime`.
- Редагування “Trigger words” у налаштуваннях Voice Wake викликає `voicewake.set`, а потім покладається на broadcast для синхронізації інших клієнтів.

### Вузол iOS

- Використовує глобальний список для виявлення тригерів у `VoiceWakeManager`.
- Редагування Wake Words у Settings викликає `voicewake.set` (через Gateway WS) і також зберігає чутливість локального виявлення wake words.

### Вузол Android

- Voice Wake наразі вимкнено в runtime/Settings Android.
- Голос в Android використовує ручне захоплення з мікрофона у вкладці Voice замість тригерів wake word.
