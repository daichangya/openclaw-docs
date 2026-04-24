---
read_when:
    - Vous souhaitez mettre en file d’attente un événement système sans créer de tâche Cron
    - Vous devez activer ou désactiver les Heartbeats
    - Vous souhaitez inspecter les entrées de présence système
summary: Référence CLI pour `openclaw system` (événements système, Heartbeat, présence)
title: Système
x-i18n:
    generated_at: "2026-04-24T07:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Assistants au niveau système pour le Gateway : mise en file d’attente d’événements système, contrôle des Heartbeats,
et affichage de la présence.

Toutes les sous-commandes `system` utilisent le RPC Gateway et acceptent les options client partagées :

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

Mettre en file d’attente un événement système sur la session **principale**. Le prochain Heartbeat l’injectera
comme ligne `System:` dans le prompt. Utilisez `--mode now` pour déclencher le Heartbeat
immédiatement ; `next-heartbeat` attend le prochain tick planifié.

Options :

- `--text <text>` : texte de l’événement système requis.
- `--mode <mode>` : `now` ou `next-heartbeat` (par défaut).
- `--json` : sortie lisible par machine.
- `--url`, `--token`, `--timeout`, `--expect-final` : options RPC Gateway partagées.

## `system heartbeat last|enable|disable`

Contrôles du Heartbeat :

- `last` : afficher le dernier événement Heartbeat.
- `enable` : réactiver les Heartbeats (utilisez ceci s’ils ont été désactivés).
- `disable` : mettre les Heartbeats en pause.

Options :

- `--json` : sortie lisible par machine.
- `--url`, `--token`, `--timeout`, `--expect-final` : options RPC Gateway partagées.

## `system presence`

Lister les entrées de présence système actuelles connues du Gateway (Node,
instances et lignes d’état similaires).

Options :

- `--json` : sortie lisible par machine.
- `--url`, `--token`, `--timeout`, `--expect-final` : options RPC Gateway partagées.

## Remarques

- Nécessite un Gateway en cours d’exécution, accessible via votre configuration actuelle (locale ou distante).
- Les événements système sont éphémères et ne sont pas conservés après redémarrage.

## Lié

- [Référence CLI](/fr/cli)
