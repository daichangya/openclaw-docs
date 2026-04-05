---
read_when:
    - Vous approuvez des demandes de jumelage d'appareils
    - Vous devez faire tourner ou révoquer des jetons d'appareil
summary: Référence CLI pour `openclaw devices` (jumelage des appareils + rotation/révocation des jetons)
title: devices
x-i18n:
    generated_at: "2026-04-05T12:38:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f9fcb8e3508a703590f87caaafd953a5d3557e11c958cbb2be1d67bb8720f4
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gérez les demandes de jumelage d'appareils et les jetons à portée appareil.

## Commandes

### `openclaw devices list`

Lister les demandes de jumelage en attente et les appareils jumelés.

```
openclaw devices list
openclaw devices list --json
```

La sortie des demandes en attente inclut le rôle et les portées demandés afin que les approbations puissent
être examinées avant approbation.

### `openclaw devices remove <deviceId>`

Supprimer une entrée d'appareil jumelé.

Lorsque vous êtes authentifié avec un jeton d'appareil jumelé, les appelants non administrateurs peuvent
supprimer uniquement **leur propre** entrée d'appareil. La suppression d'un autre appareil nécessite
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Effacer en masse les appareils jumelés.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Approuver une demande de jumelage d'appareil en attente. Si `requestId` est omis, OpenClaw
approuve automatiquement la demande en attente la plus récente.

Remarque : si un appareil retente le jumelage avec des détails d'authentification modifiés (rôle/portées/clé publique), OpenClaw remplace l'entrée en attente précédente et émet un nouveau
`requestId`. Exécutez `openclaw devices list` juste avant l'approbation pour utiliser l'ID
actuel.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rejeter une demande de jumelage d'appareil en attente.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Faire tourner un jeton d'appareil pour un rôle spécifique (avec mise à jour facultative des portées).
Le rôle cible doit déjà exister dans le contrat de jumelage approuvé de cet appareil ;
la rotation ne peut pas créer un nouveau rôle non approuvé.
Si vous omettez `--scope`, les reconnexions ultérieures avec le jeton tourné stocké réutilisent les
portées approuvées mises en cache de ce jeton. Si vous passez des valeurs `--scope` explicites, elles
deviennent l'ensemble de portées stocké pour les futures reconnexions avec jeton mis en cache.
Les appelants non administrateurs utilisant un appareil jumelé peuvent faire tourner uniquement **leur propre**
jeton d'appareil.
De plus, toute valeur `--scope` explicite doit rester dans les propres portées opérateur de la session appelante ;
la rotation ne peut pas créer un jeton opérateur plus large que celui dont l'appelant dispose
déjà.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Renvoie la nouvelle charge utile du jeton au format JSON.

### `openclaw devices revoke --device <id> --role <role>`

Révoquer un jeton d'appareil pour un rôle spécifique.

Les appelants non administrateurs utilisant un appareil jumelé peuvent révoquer uniquement **leur propre** jeton d'appareil.
La révocation du jeton d'un autre appareil nécessite `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Renvoie le résultat de la révocation au format JSON.

## Options courantes

- `--url <url>`: URL WebSocket de la gateway (utilise par défaut `gateway.remote.url` lorsqu'elle est configurée).
- `--token <token>`: jeton de la gateway (si requis).
- `--password <password>`: mot de passe de la gateway (authentification par mot de passe).
- `--timeout <ms>`: délai RPC.
- `--json`: sortie JSON (recommandée pour les scripts).

Remarque : lorsque vous définissez `--url`, la CLI ne revient pas aux identifiants de configuration ou d'environnement.
Passez `--token` ou `--password` explicitement.
L'absence d'identifiants explicites est une erreur.

## Remarques

- La rotation de jeton renvoie un nouveau jeton (sensible). Traitez-le comme un secret.
- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`).
- La rotation de jeton reste dans l'ensemble de rôles de jumelage approuvés et dans la base de référence des portées approuvées
  pour cet appareil. Une entrée de jeton mis en cache erronée n'accorde pas une nouvelle
  cible de rotation.
- Pour les sessions de jeton d'appareil jumelé, la gestion inter-appareils est réservée à l'administration :
  `remove`, `rotate` et `revoke` sont limités à l'appareil lui-même sauf si l'appelant a
  `operator.admin`.
- `devices clear` est intentionnellement protégé par `--yes`.
- Si la portée de jumelage n'est pas disponible sur local loopback (et qu'aucun `--url` explicite n'est passé), `list`/`approve` peuvent utiliser un repli de jumelage local.
- `devices approve` choisit automatiquement la demande en attente la plus récente lorsque vous omettez `requestId` ou passez `--latest`.

## Liste de contrôle de récupération en cas de dérive de jeton

Utilisez-la lorsque l'interface utilisateur de contrôle ou d'autres clients continuent d'échouer avec `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirmez la source actuelle du jeton de la gateway :

```bash
openclaw config get gateway.auth.token
```

2. Listez les appareils jumelés et identifiez l'ID de l'appareil concerné :

```bash
openclaw devices list
```

3. Faites tourner le jeton opérateur pour l'appareil concerné :

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotation ne suffit pas, supprimez le jumelage obsolète et approuvez à nouveau :

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Réessayez la connexion du client avec le jeton/mot de passe partagé actuel.

Remarques :

- L'ordre de priorité normal de l'authentification à la reconnexion est : jeton/mot de passe partagé explicite d'abord, puis `deviceToken` explicite, puis jeton d'appareil stocké, puis jeton d'amorçage.
- La récupération fiable de `AUTH_TOKEN_MISMATCH` peut temporairement envoyer à la fois le jeton partagé et le jeton d'appareil stocké ensemble pour l'unique nouvelle tentative délimitée.

Lié :

- [Dépannage de l'authentification du dashboard](/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage de la gateway](/gateway/troubleshooting#dashboard-control-ui-connectivity)
