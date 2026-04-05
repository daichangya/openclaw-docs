---
read_when:
    - Vous devez suivre à distance les journaux de la Gateway (sans SSH)
    - Vous voulez des lignes de journal JSON pour l’outillage
summary: Référence CLI pour `openclaw logs` (suivre les journaux de la gateway via RPC)
title: logs
x-i18n:
    generated_at: "2026-04-05T12:38:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Suivez les journaux de fichiers de la Gateway via RPC (fonctionne en mode distant).

Voir aussi :

- Vue d’ensemble de la journalisation : [Journalisation](/logging)
- CLI Gateway : [gateway](/cli/gateway)

## Options

- `--limit <n>` : nombre maximal de lignes de journal à renvoyer (par défaut `200`)
- `--max-bytes <n>` : nombre maximal d’octets à lire depuis le fichier journal (par défaut `250000`)
- `--follow` : suivre le flux de journal
- `--interval <ms>` : intervalle d’interrogation pendant le suivi (par défaut `1000`)
- `--json` : émettre des événements JSON délimités par des lignes
- `--plain` : sortie en texte brut sans mise en forme stylisée
- `--no-color` : désactiver les couleurs ANSI
- `--local-time` : afficher les horodatages dans votre fuseau horaire local

## Options RPC Gateway partagées

`openclaw logs` accepte également les drapeaux standard du client Gateway :

- `--url <url>` : URL WebSocket de la Gateway
- `--token <token>` : jeton Gateway
- `--timeout <ms>` : délai d’expiration en ms (par défaut `30000`)
- `--expect-final` : attendre une réponse finale lorsque l’appel Gateway est soutenu par un agent

Lorsque vous passez `--url`, la CLI n’applique pas automatiquement les identifiants de configuration ou d’environnement. Incluez explicitement `--token` si la Gateway cible requiert une authentification.

## Exemples

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Remarques

- Utilisez `--local-time` pour afficher les horodatages dans votre fuseau horaire local.
- Si la Gateway local loopback demande un appairage, `openclaw logs` revient automatiquement au fichier journal local configuré. Les cibles `--url` explicites n’utilisent pas cette solution de repli.
