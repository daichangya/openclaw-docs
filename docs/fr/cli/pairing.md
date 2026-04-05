---
read_when:
    - Vous utilisez des DM en mode appairage et devez approuver des expéditeurs
summary: Référence CLI pour `openclaw pairing` (`approve`/`list` des demandes d’appairage)
title: pairing
x-i18n:
    generated_at: "2026-04-05T12:38:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Approuver ou examiner les demandes d’appairage DM (pour les canaux qui prennent en charge l’appairage).

Associé :

- Flux d’appairage : [Appairage](/channels/pairing)

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

Lister les demandes d’appairage en attente pour un canal.

Options :

- `[channel]` : ID de canal positionnel
- `--channel <channel>` : ID de canal explicite
- `--account <accountId>` : ID de compte pour les canaux multi-comptes
- `--json` : sortie lisible par machine

Remarques :

- Si plusieurs canaux compatibles avec l’appairage sont configurés, vous devez fournir un canal soit en position, soit avec `--channel`.
- Les canaux d’extension sont autorisés tant que l’ID de canal est valide.

## `pairing approve`

Approuver un code d’appairage en attente et autoriser cet expéditeur.

Utilisation :

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` lorsqu’un seul canal compatible avec l’appairage est configuré

Options :

- `--channel <channel>` : ID de canal explicite
- `--account <accountId>` : ID de compte pour les canaux multi-comptes
- `--notify` : envoyer une confirmation au demandeur sur le même canal

## Remarques

- Entrée du canal : passez-la en position (`pairing list telegram`) ou avec `--channel <channel>`.
- `pairing list` prend en charge `--account <accountId>` pour les canaux multi-comptes.
- `pairing approve` prend en charge `--account <accountId>` et `--notify`.
- Si un seul canal compatible avec l’appairage est configuré, `pairing approve <code>` est autorisé.
