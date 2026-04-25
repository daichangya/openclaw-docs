---
read_when:
    - Ви використовуєте plugin голосових викликів і хочете точки входу CLI
    - Ви хочете швидкі приклади для `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Довідка CLI для `openclaw voicecall` (поверхня команд plugin голосових викликів)
title: Голосовий виклик
x-i18n:
    generated_at: "2026-04-25T02:39:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffed2f9f6edc989066a0b7d1e44752bf30a2356955db2577d350c60070b7b5f0
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` — це команда, яку надає Plugin. Вона з’являється, лише якщо Plugin голосових викликів установлено та ввімкнено.

Основна документація:

- Plugin голосових викликів: [Voice Call](/uk/plugins/voice-call)

## Поширені команди

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` типово виводить перевірки готовності в зрозумілому для людини вигляді. Для скриптів використовуйте `--json`:

```bash
openclaw voicecall setup --json
```

`smoke` запускає ті самі перевірки готовності. Він не здійснить реальний телефонний дзвінок, якщо не вказано одночасно `--to` і `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # пробний запуск
openclaw voicecall smoke --to "+15555550123" --yes  # реальний сповіщувальний дзвінок
```

## Відкриття Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Примітка щодо безпеки: відкривайте кінцеву точку Webhook лише для мереж, яким ви довіряєте. За можливості надавайте перевагу Tailscale Serve замість Funnel.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Plugin голосових викликів](/uk/plugins/voice-call)
