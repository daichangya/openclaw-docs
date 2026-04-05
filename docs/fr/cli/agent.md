---
read_when:
    - Vous souhaitez exécuter un tour d’agent depuis des scripts (avec livraison facultative de la réponse)
summary: Référence CLI pour `openclaw agent` (envoyer un tour d’agent via la Gateway)
title: agent
x-i18n:
    generated_at: "2026-04-05T12:37:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0627f943bc7f3556318008f76dc6150788cf06927dccdc7d2681acb98f257d56
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Exécute un tour d’agent via la Gateway (utilisez `--local` pour le mode intégré).
Utilisez `--agent <id>` pour cibler directement un agent configuré.

Passez au moins un sélecteur de session :

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Liens associés :

- Outil d’envoi d’agent : [Agent send](/tools/agent-send)

## Options

- `-m, --message <text>` : corps du message requis
- `-t, --to <dest>` : destinataire utilisé pour dériver la clé de session
- `--session-id <id>` : ID de session explicite
- `--agent <id>` : ID de l’agent ; remplace les liaisons de routage
- `--thinking <off|minimal|low|medium|high|xhigh>` : niveau de réflexion de l’agent
- `--verbose <on|off>` : conserve le niveau verbeux pour la session
- `--channel <channel>` : canal de livraison ; omettez-le pour utiliser le canal de la session principale
- `--reply-to <target>` : remplacement de la cible de livraison
- `--reply-channel <channel>` : remplacement du canal de livraison
- `--reply-account <id>` : remplacement du compte de livraison
- `--local` : exécute directement l’agent intégré (après le préchargement du registre de plugins)
- `--deliver` : renvoie la réponse vers le canal/la cible sélectionné(e)
- `--timeout <seconds>` : remplace le délai d’attente de l’agent (600 par défaut ou valeur de configuration)
- `--json` : affiche une sortie JSON

## Exemples

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Remarques

- Le mode Gateway bascule vers l’agent intégré lorsque la requête Gateway échoue. Utilisez `--local` pour forcer l’exécution intégrée dès le départ.
- `--local` précharge quand même d’abord le registre de plugins, afin que les providers, outils et canaux fournis par les plugins restent disponibles pendant les exécutions intégrées.
- `--channel`, `--reply-channel` et `--reply-account` affectent la livraison de la réponse, pas le routage de la session.
- Lorsque cette commande déclenche la régénération de `models.json`, les identifiants de provider gérés par SecretRef sont conservés comme marqueurs non secrets (par exemple des noms de variables d’environnement, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), et non comme texte brut de secrets résolus.
- Les écritures de marqueurs sont pilotées par la source : OpenClaw conserve les marqueurs à partir du snapshot de configuration source actif, et non à partir des valeurs secrètes résolues à l’exécution.
