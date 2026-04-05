---
read_when:
    - Sie verwenden das Voice-Call-Plugin und möchten die CLI-Einstiegspunkte kennen
    - Sie möchten kurze Beispiele für `voicecall call|continue|status|tail|expose`
summary: CLI-Referenz für `openclaw voicecall` (Befehlsoberfläche des Voice-Call-Plugins)
title: voicecall
x-i18n:
    generated_at: "2026-04-05T12:39:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` ist ein vom Plugin bereitgestellter Befehl. Er erscheint nur, wenn das Voice-Call-Plugin installiert und aktiviert ist.

Primäre Dokumentation:

- Voice-Call-Plugin: [Voice Call](/plugins/voice-call)

## Häufige Befehle

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Webhooks verfügbar machen (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Sicherheitshinweis: Machen Sie den Webhook-Endpunkt nur in Netzwerken verfügbar, denen Sie vertrauen. Bevorzugen Sie nach Möglichkeit Tailscale Serve gegenüber Funnel.
