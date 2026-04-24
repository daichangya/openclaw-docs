---
read_when:
    - Vous devez suivre les journaux du Gateway à distance (sans SSH)
    - Vous voulez des lignes de journal JSON pour l’outillage
summary: Référence CLI pour `openclaw logs` (suivre les journaux du Gateway via RPC)
title: Journaux
x-i18n:
    generated_at: "2026-04-24T07:04:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Suivre les journaux de fichiers du Gateway via RPC (fonctionne en mode distant).

Associé :

- Vue d’ensemble de la journalisation : [Journalisation](/fr/logging)
- CLI Gateway : [gateway](/fr/cli/gateway)

## Options

- `--limit <n>` : nombre maximal de lignes de journal à renvoyer (par défaut `200`)
- `--max-bytes <n>` : nombre maximal d’octets à lire depuis le fichier journal (par défaut `250000`)
- `--follow` : suivre le flux de journaux
- `--interval <ms>` : intervalle d’interrogation pendant le suivi (par défaut `1000`)
- `--json` : émettre des événements JSON délimités par ligne
- `--plain` : sortie en texte brut sans formatage stylisé
- `--no-color` : désactiver les couleurs ANSI
- `--local-time` : afficher les horodatages dans votre fuseau horaire local

## Options RPC Gateway partagées

`openclaw logs` accepte aussi les indicateurs client Gateway standard :

- `--url <url>` : URL WebSocket du Gateway
- `--token <token>` : jeton du Gateway
- `--timeout <ms>` : délai d’expiration en ms (par défaut `30000`)
- `--expect-final` : attendre une réponse finale lorsque l’appel Gateway est adossé à un agent

Lorsque vous passez `--url`, la CLI n’applique pas automatiquement les identifiants de configuration ou d’environnement. Incluez explicitement `--token` si le Gateway cible exige une authentification.

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
- Si le Gateway local loopback demande un appairage, `openclaw logs` revient automatiquement au fichier journal local configuré. Les cibles `--url` explicites n’utilisent pas ce repli.

## Associé

- [Référence CLI](/fr/cli)
- [Journalisation du Gateway](/fr/gateway/logging)
