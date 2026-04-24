---
read_when:
    - Налаштування поведінки голосового оверлею
summary: Життєвий цикл голосового оверлею, коли перетинаються wake-word і push-to-talk
title: Голосовий оверлей
x-i18n:
    generated_at: "2026-04-24T04:17:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Життєвий цикл голосового оверлею (macOS)

Аудиторія: учасники розробки застосунку macOS. Мета: забезпечити передбачувану поведінку голосового оверлею, коли wake-word і push-to-talk перетинаються.

## Поточний намір

- Якщо оверлей уже видимий через wake-word і користувач натискає гарячу клавішу, сесія гарячої клавіші _підхоплює_ наявний текст замість його скидання. Оверлей залишається відкритим, поки гаряча клавіша утримується. Коли користувач відпускає клавішу: надіслати, якщо є обрізаний текст, інакше закрити.
- Wake-word сам по собі, як і раніше, автоматично надсилає на тиші; push-to-talk надсилає одразу після відпускання.

## Реалізовано (9 грудня 2025)

- Сесії оверлею тепер мають token для кожного захоплення (wake-word або push-to-talk). Оновлення partial/final/send/dismiss/level відкидаються, якщо token не збігається, що запобігає застарілим callback.
- Push-to-talk підхоплює будь-який текст видимого оверлею як префікс (тобто натискання гарячої клавіші, поки відкритий wake-оверлей, зберігає текст і додає нове мовлення). Він чекає до 1.5 с на фінальний transcript, а потім повертається до поточного тексту.
- Логування chime/overlay виводиться на рівні `info` у категоріях `voicewake.overlay`, `voicewake.ptt` і `voicewake.chime` (початок сесії, partial, final, send, dismiss, причина chime).

## Наступні кроки

1. **VoiceSessionCoordinator (actor)**
   - Керує рівно однією `VoiceSession` одночасно.
   - API (на основі token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Відкидає callback, що містять застарілі token (це не дає старим recognizer знову відкрити оверлей).
2. **VoiceSession (model)**
   - Поля: `token`, `source` (wakeWord|pushToTalk), committed/volatile text, прапорці chime, таймери (auto-send, idle), `overlayMode` (display|editing|sending), дедлайн cooldown.
3. **Прив’язка оверлею**
   - `VoiceSessionPublisher` (`ObservableObject`) віддзеркалює активну сесію у SwiftUI.
   - `VoiceWakeOverlayView` рендериться лише через publisher; він ніколи не змінює глобальні singleton напряму.
   - Дії користувача в оверлеї (`sendNow`, `dismiss`, `edit`) викликають coordinator назад із token сесії.
4. **Уніфікований шлях надсилання**
   - На `endCapture`: якщо обрізаний текст порожній → закрити; інакше `performSend(session:)` (один раз відтворює chime надсилання, пересилає, закриває).
   - Push-to-talk: без затримки; wake-word: необов’язкова затримка для auto-send.
   - Застосовує короткий cooldown до середовища виконання wake після завершення push-to-talk, щоб wake-word не спрацьовував знову одразу.
5. **Логування**
   - Coordinator виводить логи `.info` у subsystem `ai.openclaw`, категоріях `voicewake.overlay` і `voicewake.chime`.
   - Ключові події: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Список перевірки для налагодження

- Потоково виводьте логи під час відтворення завислого оверлею:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Переконайтеся, що активний лише один token сесії; застарілі callback мають відкидатися coordinator.
- Переконайтеся, що відпускання push-to-talk завжди викликає `endCapture` з активним token; якщо текст порожній, очікуйте `dismiss` без chime і без надсилання.

## Кроки міграції (рекомендовано)

1. Додайте `VoiceSessionCoordinator`, `VoiceSession` і `VoiceSessionPublisher`.
2. Переробіть `VoiceWakeRuntime`, щоб він створював/оновлював/завершував сесії замість прямої взаємодії з `VoiceWakeOverlayController`.
3. Переробіть `VoicePushToTalk`, щоб він підхоплював наявні сесії та викликав `endCapture` при відпусканні; застосуйте cooldown середовища виконання.
4. Підключіть `VoiceWakeOverlayController` до publisher; приберіть прямі виклики з runtime/PTT.
5. Додайте інтеграційні тести для підхоплення сесій, cooldown і закриття при порожньому тексті.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Голосове пробудження (macOS)](/uk/platforms/mac/voicewake)
- [Режим Talk](/uk/nodes/talk)
