---
read_when:
    - Vous voulez appairer rapidement une application de nœud mobile avec une gateway
    - Vous avez besoin de la sortie du code de configuration pour un partage distant/manuel
summary: Référence CLI pour `openclaw qr` (générer un QR d’appairage mobile + code de configuration)
title: qr
x-i18n:
    generated_at: "2026-04-05T12:38:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Générez un QR d’appairage mobile et un code de configuration à partir de la configuration actuelle de votre Gateway.

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
- `--url <url>` : surcharger l’URL de gateway utilisée dans la charge utile
- `--public-url <url>` : surcharger l’URL publique utilisée dans la charge utile
- `--token <token>` : surcharger le jeton gateway sur lequel le flux bootstrap s’authentifie
- `--password <password>` : surcharger le mot de passe gateway sur lequel le flux bootstrap s’authentifie
- `--setup-code-only` : afficher uniquement le code de configuration
- `--no-ascii` : ignorer le rendu QR ASCII
- `--json` : émettre du JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Remarques

- `--token` et `--password` sont mutuellement exclusifs.
- Le code de configuration lui-même transporte désormais un `bootstrapToken` opaque à courte durée de vie, et non le jeton/mot de passe gateway partagé.
- Dans le flux bootstrap intégré nœud/opérateur, le jeton principal du nœud reste associé à `scopes: []`.
- Si le transfert bootstrap émet aussi un jeton opérateur, il reste limité à la liste d’autorisation bootstrap : `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Les vérifications de scope bootstrap sont préfixées par rôle. Cette liste d’autorisation opérateur ne satisfait que les requêtes opérateur ; les rôles non opérateur ont toujours besoin de scopes sous leur propre préfixe de rôle.
- L’appairage mobile échoue en mode fermé pour les URLs gateway Tailscale/publiques en `ws://`. `ws://` en LAN privé reste pris en charge, mais les routes mobiles Tailscale/publiques doivent utiliser Tailscale Serve/Funnel ou une URL gateway `wss://`.
- Avec `--remote`, OpenClaw exige soit `gateway.remote.url`, soit
  `gateway.tailscale.mode=serve|funnel`.
- Avec `--remote`, si les identifiants distants actifs effectifs sont configurés comme SecretRefs et que vous ne passez pas `--token` ni `--password`, la commande les résout à partir de l’instantané actif de la gateway. Si la gateway n’est pas disponible, la commande échoue rapidement.
- Sans `--remote`, les SecretRefs d’authentification locale de la gateway sont résolus lorsqu’aucune surcharge d’authentification CLI n’est fournie :
  - `gateway.auth.token` est résolu lorsque l’authentification par jeton peut l’emporter (mode explicite `gateway.auth.mode="token"` ou mode déduit où aucune source de mot de passe ne l’emporte).
  - `gateway.auth.password` est résolu lorsque l’authentification par mot de passe peut l’emporter (mode explicite `gateway.auth.mode="password"` ou mode déduit sans jeton gagnant depuis auth/env).
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris comme SecretRefs) et que `gateway.auth.mode` n’est pas défini, la résolution du code de configuration échoue jusqu’à ce que le mode soit défini explicitement.
- Remarque sur l’écart de version de gateway : ce chemin de commande nécessite une gateway qui prend en charge `secrets.resolve` ; les gateways plus anciennes retournent une erreur de méthode inconnue.
- Après le scan, approuvez l’appairage de l’appareil avec :
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
