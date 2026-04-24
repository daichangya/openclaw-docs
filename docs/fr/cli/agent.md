---
read_when:
    - Vous souhaitez exécuter un tour d’agent depuis des scripts (avec livraison de la réponse en option)
summary: Référence CLI pour `openclaw agent` (envoyer un tour d’agent via le Gateway)
title: Agent
x-i18n:
    generated_at: "2026-04-24T07:03:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Exécute un tour d’agent via le Gateway (utilisez `--local` pour le mode embarqué).
Utilisez `--agent <id>` pour cibler directement un agent configuré.

Passez au moins un sélecteur de session :

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Associé :

- Outil d’envoi d’agent : [Agent send](/fr/tools/agent-send)

## Options

- `-m, --message <text>` : corps du message requis
- `-t, --to <dest>` : destinataire utilisé pour dériver la clé de session
- `--session-id <id>` : ID de session explicite
- `--agent <id>` : ID d’agent ; remplace les liaisons de routage
- `--thinking <level>` : niveau de réflexion de l’agent (`off`, `minimal`, `low`, `medium`, `high`, plus les niveaux personnalisés pris en charge par le fournisseur tels que `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>` : persister le niveau détaillé pour la session
- `--channel <channel>` : canal de livraison ; omettez-le pour utiliser le canal de la session principale
- `--reply-to <target>` : remplacement de la cible de livraison
- `--reply-channel <channel>` : remplacement du canal de livraison
- `--reply-account <id>` : remplacement du compte de livraison
- `--local` : exécuter directement l’agent embarqué (après préchargement du registre de plugins)
- `--deliver` : renvoyer la réponse vers le canal/cible sélectionné
- `--timeout <seconds>` : remplacer le délai d’attente de l’agent (par défaut 600 ou la valeur de configuration)
- `--json` : sortie JSON

## Exemples

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notes

- Le mode Gateway revient à l’agent embarqué lorsque la requête Gateway échoue. Utilisez `--local` pour forcer l’exécution embarquée dès le départ.
- `--local` précharge tout de même d’abord le registre de plugins, de sorte que les fournisseurs, outils et canaux fournis par des plugins restent disponibles pendant les exécutions embarquées.
- `--channel`, `--reply-channel` et `--reply-account` affectent la livraison de la réponse, pas le routage de session.
- Lorsque cette commande déclenche la régénération de `models.json`, les identifiants de fournisseurs gérés par SecretRef sont persistés sous forme de marqueurs non secrets (par exemple des noms de variables d’environnement, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), et non comme texte brut de secrets résolus.
- Les écritures de marqueurs sont pilotées par la source : OpenClaw persiste les marqueurs à partir de l’instantané de configuration source actif, et non à partir des valeurs secrètes résolues à l’exécution.

## Associé

- [Référence CLI](/fr/cli)
- [Runtime de l’agent](/fr/concepts/agent)
