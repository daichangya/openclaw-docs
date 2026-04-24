---
read_when:
    - Ви використовуєте Plugin для голосових дзвінків і хочете мати точки входу CLI
    - Вам потрібні швидкі приклади для `voicecall call|continue|dtmf|status|tail|expose`
summary: Довідка CLI для `openclaw voicecall` (поверхня команд Plugin для голосових дзвінків)
title: Голосовий дзвінок
x-i18n:
    generated_at: "2026-04-24T04:13:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` — це команда, яку надає Plugin. Вона з’являється лише тоді, коли Plugin голосових дзвінків установлено та ввімкнено.

Основна документація:

- Plugin голосових дзвінків: [Voice Call](/uk/plugins/voice-call)

## Поширені команди

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Відкриття Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Примітка щодо безпеки: відкривайте endpoint Webhook лише для мереж, яким ви довіряєте. За можливості надавайте перевагу Tailscale Serve замість Funnel.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Plugin голосових дзвінків](/uk/plugins/voice-call)
