---
read_when:
    - Vous utilisez le plugin d’appel vocal et voulez les points d’entrée CLI
    - Vous voulez des exemples rapides pour `voicecall call|continue|status|tail|expose`
summary: Référence CLI pour `openclaw voicecall` (surface de commande du plugin d’appel vocal)
title: voicecall
x-i18n:
    generated_at: "2026-04-05T12:39:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` est une commande fournie par un plugin. Elle n’apparaît que si le plugin d’appel vocal est installé et activé.

Documentation principale :

- Plugin d’appel vocal : [Voice Call](/plugins/voice-call)

## Commandes courantes

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Exposer des webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Remarque de sécurité : n’exposez le point de terminaison webhook qu’aux réseaux de confiance. Préférez Tailscale Serve à Funnel lorsque c’est possible.
