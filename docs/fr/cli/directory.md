---
read_when:
    - Vous voulez rechercher des contacts/groupes/ID de soi pour un canal
    - Vous développez un adaptateur d’annuaire de canal
summary: Référence CLI pour `openclaw directory` (soi, pairs, groupes)
title: Annuaire
x-i18n:
    generated_at: "2026-04-24T07:04:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Recherches d’annuaire pour les canaux qui les prennent en charge (contacts/pairs, groupes et « moi »).

## Indicateurs courants

- `--channel <name>` : ID/alias du canal (requis lorsque plusieurs canaux sont configurés ; automatique lorsqu’un seul canal est configuré)
- `--account <id>` : ID de compte (par défaut : compte par défaut du canal)
- `--json` : sortie JSON

## Remarques

- `directory` est destiné à vous aider à trouver des ID que vous pouvez coller dans d’autres commandes (en particulier `openclaw message send --target ...`).
- Pour de nombreux canaux, les résultats sont adossés à la configuration (listes blanches / groupes configurés) plutôt qu’à un annuaire de fournisseur en direct.
- La sortie par défaut est `id` (et parfois `name`) séparés par une tabulation ; utilisez `--json` pour les scripts.

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
- Matrix (Plugin) : `user:@user:server`, `room:!roomId:server` ou `#alias:server`
- Microsoft Teams (Plugin) : `user:<id>` et `conversation:<id>`
- Zalo (Plugin) : ID utilisateur (Bot API)
- Zalo Personal / `zalouser` (Plugin) : ID de fil (DM/groupe) depuis `zca` (`me`, `friend list`, `group list`)

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

## Lié

- [Référence CLI](/fr/cli)
