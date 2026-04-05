---
read_when:
    - Vous voulez mettre en file d’attente un événement système sans créer de tâche cron
    - Vous devez activer ou désactiver les heartbeats
    - Vous voulez inspecter les entrées de présence système
summary: Référence CLI pour `openclaw system` (événements système, heartbeat, présence)
title: system
x-i18n:
    generated_at: "2026-04-05T12:39:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Assistants de niveau système pour la Gateway : mettre en file d’attente des événements système, contrôler les heartbeats
et afficher la présence.

Toutes les sous-commandes `system` utilisent la RPC Gateway et acceptent les drapeaux client partagés :

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Commandes courantes

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Met en file d’attente un événement système sur la session **main**. Le prochain heartbeat l’injectera
comme ligne `System:` dans le prompt. Utilisez `--mode now` pour déclencher le heartbeat
immédiatement ; `next-heartbeat` attend le prochain tick planifié.

Drapeaux :

- `--text <text>` : texte d’événement système requis.
- `--mode <mode>` : `now` ou `next-heartbeat` (par défaut).
- `--json` : sortie lisible par machine.
- `--url`, `--token`, `--timeout`, `--expect-final` : drapeaux RPC Gateway partagés.

## `system heartbeat last|enable|disable`

Contrôles du heartbeat :

- `last` : afficher le dernier événement de heartbeat.
- `enable` : réactiver les heartbeats (utilisez ceci s’ils ont été désactivés).
- `disable` : suspendre les heartbeats.

Drapeaux :

- `--json` : sortie lisible par machine.
- `--url`, `--token`, `--timeout`, `--expect-final` : drapeaux RPC Gateway partagés.

## `system presence`

Lister les entrées de présence système actuelles que la Gateway connaît (nodes,
instances et lignes d’état similaires).

Drapeaux :

- `--json` : sortie lisible par machine.
- `--url`, `--token`, `--timeout`, `--expect-final` : drapeaux RPC Gateway partagés.

## Remarques

- Nécessite une Gateway en cours d’exécution, joignable via votre configuration actuelle (locale ou distante).
- Les événements système sont éphémères et ne sont pas conservés après un redémarrage.
