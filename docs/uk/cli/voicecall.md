---
read_when:
    - Ви використовуєте Plugin voice-call і хочете точки входу CLI
    - Вам потрібні швидкі приклади для `voicecall call|continue|dtmf|status|tail|expose`
summary: Довідка CLI для `openclaw voicecall` (поверхня команд Plugin для voice-call)
title: Voicecall
x-i18n:
    generated_at: "2026-04-24T00:54:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f7588e5ee8bcf2316b74498f0aaff954d0970450d4251fd83e188e8326f6de8
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` — це команда, яку надає Plugin. Вона з’являється лише якщо Plugin voice-call встановлено та ввімкнено.

Основний документ:

- Plugin voice-call: [Голосовий дзвінок](/uk/plugins/voice-call)

## Поширені команди

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Відкриття Webhook назовні (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Примітка щодо безпеки: відкривайте кінцеву точку Webhook назовні лише в мережі, яким ви довіряєте. За можливості віддавайте перевагу Tailscale Serve замість Funnel.
