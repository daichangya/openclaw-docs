---
read_when:
    - Робота з реакціями в будь-якому каналі
    - Розуміння того, як emoji-реакції відрізняються на різних платформах
summary: Семантика інструмента реакцій у всіх підтримуваних каналах
title: Реакції
x-i18n:
    generated_at: "2026-04-05T18:20:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af2951eee32e73adb982dbdf39b32e4065993454e9cce2ad23b27565cab4f84
    source_path: tools/reactions.md
    workflow: 15
---

# Реакції

Агент може додавати й видаляти emoji-реакції до повідомлень за допомогою інструмента `message` з дією `react`. Поведінка реакцій залежить від каналу.

## Як це працює

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` є обов’язковим під час додавання реакції.
- Встановіть `emoji` як порожній рядок (`""`), щоб видалити реакцію(ї) бота.
- Встановіть `remove: true`, щоб видалити конкретне emoji (потрібне непорожнє `emoji`).

## Поведінка в каналах

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Порожнє `emoji` видаляє всі реакції бота на повідомлення.
    - `remove: true` видаляє лише вказане emoji.
  </Accordion>

  <Accordion title="Google Chat">
    - Порожнє `emoji` видаляє реакції застосунку на повідомлення.
    - `remove: true` видаляє лише вказане emoji.
  </Accordion>

  <Accordion title="Telegram">
    - Порожнє `emoji` видаляє реакції бота.
    - `remove: true` також видаляє реакції, але для валідації інструмента все одно потрібне непорожнє `emoji`.
  </Accordion>

  <Accordion title="WhatsApp">
    - Порожнє `emoji` видаляє реакцію бота.
    - `remove: true` внутрішньо зіставляється з порожнім emoji (у виклику інструмента все одно потрібне `emoji`).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Потрібне непорожнє `emoji`.
    - `remove: true` видаляє цю конкретну emoji-реакцію.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Використовуйте інструмент `feishu_reaction` з діями `add`, `remove` і `list`.
    - Для додавання/видалення потрібен `emoji_type`; для видалення також потрібен `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Вхідні сповіщення про реакції керуються параметром `channels.signal.reactionNotifications`: `"off"` вимикає їх, `"own"` (типово) генерує події, коли користувачі реагують на повідомлення бота, а `"all"` генерує події для всіх реакцій.
  </Accordion>
</AccordionGroup>

## Рівень реакцій

Конфігурація `reactionLevel` для кожного каналу визначає, наскільки широко агент використовує реакції. Типові значення: `off`, `ack`, `minimal` або `extensive`.

- [Telegram reactionLevel](/uk/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/uk/channels/whatsapp#reactions) — `channels.whatsapp.reactionLevel`

Установіть `reactionLevel` для окремих каналів, щоб налаштувати, наскільки активно агент реагує на повідомлення на кожній платформі.

## Пов’язане

- [Agent Send](/tools/agent-send) — інструмент `message`, який містить `react`
- [Канали](/uk/channels) — конфігурація для конкретних каналів
