---
read_when:
    - Vous utilisez des DM en mode pairing et devez approuver des expéditeurs
summary: Référence CLI pour `openclaw pairing` (approuver/lister les demandes de pairing)
title: Pairing
x-i18n:
    generated_at: "2026-04-24T07:05:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Approuver ou inspecter les demandes de pairing DM (pour les canaux qui prennent en charge le pairing).

Article connexe :

- Flux de pairing : [Pairing](/fr/channels/pairing)

## Commandes

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Lister les demandes de pairing en attente pour un canal.

Options :

- `[channel]` : identifiant de canal positionnel
- `--channel <channel>` : identifiant de canal explicite
- `--account <accountId>` : identifiant de compte pour les canaux multi-comptes
- `--json` : sortie lisible par machine

Remarques :

- Si plusieurs canaux capables de pairing sont configurés, vous devez fournir un canal soit en positionnel, soit avec `--channel`.
- Les canaux d’extension sont autorisés tant que l’identifiant de canal est valide.

## `pairing approve`

Approuver un code de pairing en attente et autoriser cet expéditeur.

Utilisation :

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` lorsqu’un seul canal capable de pairing est configuré

Options :

- `--channel <channel>` : identifiant de canal explicite
- `--account <accountId>` : identifiant de compte pour les canaux multi-comptes
- `--notify` : envoyer une confirmation au demandeur sur le même canal

## Remarques

- Entrée du canal : passez-la en positionnel (`pairing list telegram`) ou avec `--channel <channel>`.
- `pairing list` prend en charge `--account <accountId>` pour les canaux multi-comptes.
- `pairing approve` prend en charge `--account <accountId>` et `--notify`.
- Si un seul canal capable de pairing est configuré, `pairing approve <code>` est autorisé.

## Articles connexes

- [Référence CLI](/fr/cli)
- [Pairing de canal](/fr/channels/pairing)
