---
read_when:
    - Vous voulez une interface terminal pour Gateway (adaptée au distant)
    - Vous voulez transmettre url/token/session depuis des scripts
summary: Référence CLI pour `openclaw tui` (interface terminal connectée à Gateway)
title: tui
x-i18n:
    generated_at: "2026-04-05T12:39:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Ouvrir l’interface terminal connectée à Gateway.

Associé :

- Guide TUI : [TUI](/web/tui)

Remarques :

- `tui` résout les SecretRef d’authentification gateway configurés pour l’authentification par jeton/mot de passe lorsque c’est possible (fournisseurs `env`/`file`/`exec`).
- Lorsqu’il est lancé depuis un répertoire d’espace de travail d’agent configuré, TUI sélectionne automatiquement cet agent comme valeur par défaut de clé de session (sauf si `--session` est explicitement `agent:<id>:...`).

## Exemples

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# lorsqu'il est exécuté dans un espace de travail d'agent, déduit automatiquement cet agent
openclaw tui --session bugfix
```
