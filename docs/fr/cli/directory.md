---
read_when:
    - Vous voulez rechercher les identifiants de contacts/groupes/de soi-même pour un canal
    - Vous développez un adaptateur de répertoire de canal
summary: Référence CLI pour `openclaw directory` (soi-même, pairs, groupes)
title: directory
x-i18n:
    generated_at: "2026-04-05T12:37:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Recherches dans le répertoire pour les canaux qui le prennent en charge (contacts/pairs, groupes et « moi »).

## Drapeaux courants

- `--channel <name>` : ID/alias du canal (requis lorsque plusieurs canaux sont configurés ; automatique lorsqu’un seul canal est configuré)
- `--account <id>` : ID du compte (par défaut : valeur par défaut du canal)
- `--json` : sortie JSON

## Remarques

- `directory` est destiné à vous aider à trouver des ID que vous pouvez coller dans d’autres commandes (en particulier `openclaw message send --target ...`).
- Pour de nombreux canaux, les résultats s’appuient sur la configuration (listes d’autorisation / groupes configurés) plutôt que sur un répertoire actif du fournisseur.
- La sortie par défaut est `id` (et parfois `name`) séparée par une tabulation ; utilisez `--json` pour les scripts.

## Utiliser les résultats avec `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formats d’ID (par canal)

- WhatsApp : `+15551234567` (DM), `1234567890-1234567890@g.us` (groupe)
- Telegram : `@username` ou ID de chat numérique ; les groupes sont des ID numériques
- Slack : `user:U…` et `channel:C…`
- Discord : `user:<id>` et `channel:<id>`
- Matrix (plugin) : `user:@user:server`, `room:!roomId:server` ou `#alias:server`
- Microsoft Teams (plugin) : `user:<id>` et `conversation:<id>`
- Zalo (plugin) : ID utilisateur (Bot API)
- Zalo Personal / `zalouser` (plugin) : ID de fil (DM/groupe) depuis `zca` (`me`, `friend list`, `group list`)

## Soi-même ("me")

```bash
openclaw directory self --channel zalouser
```

## Pairs (contacts/utilisateurs)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Groupes

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```
