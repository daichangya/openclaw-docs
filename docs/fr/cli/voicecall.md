---
read_when:
    - Vous utilisez le Plugin d’appel vocal et vous voulez les points d’entrée CLI
    - Vous voulez des exemples rapides pour `voicecall call|continue|dtmf|status|tail|expose`
summary: Référence CLI pour `openclaw voicecall` (surface de commande du Plugin d’appel vocal)
title: appel vocal
x-i18n:
    generated_at: "2026-04-24T07:05:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` est une commande fournie par un Plugin. Elle n’apparaît que si le Plugin d’appel vocal est installé et activé.

Documentation principale :

- Plugin d’appel vocal : [Voice Call](/fr/plugins/voice-call)

## Commandes courantes

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Exposer des Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Remarque de sécurité : n’exposez le point de terminaison Webhook qu’aux réseaux de confiance. Préférez Tailscale Serve à Funnel lorsque cela est possible.

## Liens associés

- [Référence CLI](/fr/cli)
- [Plugin d’appel vocal](/fr/plugins/voice-call)
