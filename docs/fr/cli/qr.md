---
read_when:
    - Vous souhaitez appairer rapidement une app mobile Node avec un gateway
    - Vous avez besoin d’une sortie de code de configuration pour un partage à distance/manuel
summary: Référence CLI pour `openclaw qr` (générer un QR de pairing mobile + code de configuration)
title: QR
x-i18n:
    generated_at: "2026-04-24T07:05:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Générer un QR de pairing mobile et un code de configuration à partir de votre configuration Gateway actuelle.

## Utilisation

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Options

- `--remote` : préférer `gateway.remote.url` ; s’il n’est pas défini, `gateway.tailscale.mode=serve|funnel` peut toujours fournir l’URL publique distante
- `--url <url>` : remplacer l’URL du gateway utilisée dans la charge utile
- `--public-url <url>` : remplacer l’URL publique utilisée dans la charge utile
- `--token <token>` : remplacer le jeton Gateway utilisé par le flux bootstrap pour l’authentification
- `--password <password>` : remplacer le mot de passe Gateway utilisé par le flux bootstrap pour l’authentification
- `--setup-code-only` : afficher uniquement le code de configuration
- `--no-ascii` : ignorer le rendu QR ASCII
- `--json` : émettre du JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Remarques

- `--token` et `--password` sont mutuellement exclusifs.
- Le code de configuration lui-même transporte désormais un `bootstrapToken` opaque de courte durée, et non le jeton/mot de passe Gateway partagé.
- Dans le flux bootstrap intégré node/operator, le jeton du nœud principal arrive toujours avec `scopes: []`.
- Si le transfert bootstrap émet également un jeton operator, celui-ci reste limité à la liste d’autorisation bootstrap : `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Les vérifications de portée bootstrap utilisent des préfixes de rôle. Cette liste d’autorisation operator ne satisfait que les requêtes operator ; les rôles non operator ont toujours besoin de portées sous leur propre préfixe de rôle.
- Le pairing mobile échoue en mode fermé pour les URL de gateway Tailscale/publiques en `ws://`. Le `ws://` LAN privé reste pris en charge, mais les routes mobiles Tailscale/publiques doivent utiliser Tailscale Serve/Funnel ou une URL de gateway en `wss://`.
- Avec `--remote`, OpenClaw exige soit `gateway.remote.url`, soit `gateway.tailscale.mode=serve|funnel`.
- Avec `--remote`, si les identifiants distants effectivement actifs sont configurés comme SecretRefs et que vous ne passez ni `--token` ni `--password`, la commande les résout depuis l’instantané actif du gateway. Si le gateway n’est pas disponible, la commande échoue immédiatement.
- Sans `--remote`, les SecretRefs d’authentification du gateway local sont résolus lorsqu’aucune surcharge d’authentification CLI n’est passée :
  - `gateway.auth.token` est résolu lorsque l’authentification par jeton peut l’emporter (mode explicite `gateway.auth.mode="token"` ou mode inféré où aucune source de mot de passe ne l’emporte).
  - `gateway.auth.password` est résolu lorsque l’authentification par mot de passe peut l’emporter (mode explicite `gateway.auth.mode="password"` ou mode inféré sans jeton gagnant provenant de auth/env).
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris comme SecretRefs) et que `gateway.auth.mode` n’est pas défini, la résolution du code de configuration échoue jusqu’à ce que le mode soit défini explicitement.
- Remarque sur le décalage de version du gateway : ce chemin de commande nécessite un gateway prenant en charge `secrets.resolve` ; les anciens gateways renvoient une erreur de méthode inconnue.
- Après le scan, approuvez le pairing de l’appareil avec :
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Articles connexes

- [Référence CLI](/fr/cli)
- [Pairing](/fr/cli/pairing)
