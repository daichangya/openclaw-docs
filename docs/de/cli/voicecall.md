---
read_when:
    - Sie verwenden das Voice-Call-Plugin und möchten die CLI-Einstiegspunkte.
    - Sie möchten schnelle Beispiele für `voicecall call|continue|dtmf|status|tail|expose`.
summary: CLI-Referenz für `openclaw voicecall` (Befehlsoberfläche des Voice-Call-Plugins)
title: Voicecall
x-i18n:
    generated_at: "2026-04-24T06:33:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` ist ein vom Plugin bereitgestellter Befehl. Er erscheint nur, wenn das Voice-Call-Plugin installiert und aktiviert ist.

Primäre Dokumentation:

- Voice-Call-Plugin: [Voice Call](/de/plugins/voice-call)

## Häufige Befehle

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Webhooks bereitstellen (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Sicherheitshinweis: Stellen Sie den Webhook-Endpunkt nur Netzwerken bereit, denen Sie vertrauen. Bevorzugen Sie nach Möglichkeit Tailscale Serve statt Funnel.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Voice-Call-Plugin](/de/plugins/voice-call)
