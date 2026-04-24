---
read_when:
    - Exécuter OpenClaw derrière un proxy conscient de l’identité
    - Configurer Pomerium, Caddy ou nginx avec OAuth devant OpenClaw
    - Corriger les erreurs WebSocket 1008 non autorisées dans les configurations avec proxy inverse
    - Choisir où définir HSTS et les autres en-têtes de renforcement HTTP
summary: Déléguer l’authentification Gateway à un proxy inverse approuvé (Pomerium, Caddy, nginx + OAuth)
title: Authentification par proxy approuvé
x-i18n:
    generated_at: "2026-04-24T07:13:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **Fonctionnalité sensible du point de vue de la sécurité.** Ce mode délègue entièrement l’authentification à votre proxy inverse. Une mauvaise configuration peut exposer votre Gateway à des accès non autorisés. Lisez attentivement cette page avant de l’activer.

## Quand l’utiliser

Utilisez le mode d’authentification `trusted-proxy` lorsque :

- Vous exécutez OpenClaw derrière un **proxy conscient de l’identité** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Votre proxy gère toute l’authentification et transmet l’identité utilisateur via des en-têtes
- Vous êtes dans un environnement Kubernetes ou conteneurisé où le proxy est le seul chemin vers le Gateway
- Vous rencontrez des erreurs WebSocket `1008 unauthorized` parce que les navigateurs ne peuvent pas transmettre de jetons dans les charges utiles WS

## Quand NE PAS l’utiliser

- Si votre proxy n’authentifie pas les utilisateurs (simple terminaison TLS ou équilibrage de charge)
- S’il existe un chemin vers le Gateway qui contourne le proxy (trous de pare-feu, accès réseau interne)
- Si vous n’êtes pas sûr que votre proxy supprime/remplace correctement les en-têtes transférés
- Si vous avez seulement besoin d’un accès personnel mono-utilisateur (envisagez Tailscale Serve + boucle locale pour une configuration plus simple)

## Fonctionnement

1. Votre proxy inverse authentifie les utilisateurs (OAuth, OIDC, SAML, etc.)
2. Le proxy ajoute un en-tête avec l’identité de l’utilisateur authentifié (par exemple `x-forwarded-user: nick@example.com`)
3. OpenClaw vérifie que la requête provient d’une **IP de proxy approuvée** (configurée dans `gateway.trustedProxies`)
4. OpenClaw extrait l’identité utilisateur de l’en-tête configuré
5. Si tout est correct, la requête est autorisée

## Comportement d’appairage de l’interface Control

Lorsque `gateway.auth.mode = "trusted-proxy"` est actif et que la requête passe
les contrôles de proxy approuvé, les sessions WebSocket de l’interface Control peuvent se connecter sans
identité d’appairage d’appareil.

Implications :

- L’appairage n’est plus le contrôle principal pour l’accès à l’interface Control dans ce mode.
- Votre politique d’authentification du proxy inverse et `allowUsers` deviennent le contrôle d’accès effectif.
- Gardez l’entrée du Gateway verrouillée aux seules IP de proxy approuvées (`gateway.trustedProxies` + pare-feu).

## Configuration

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Règle importante à l’exécution :

- L’authentification par proxy approuvé rejette les requêtes provenant de la boucle locale (`127.0.0.1`, `::1`, CIDR de loopback).
- Les proxys inverses de boucle locale sur le même hôte ne satisfont **pas** l’authentification par proxy approuvé.
- Pour les configurations de proxy sur le même hôte en loopback, utilisez à la place l’authentification par jeton/mot de passe, ou faites passer le trafic par une adresse de proxy approuvé non loopback que OpenClaw peut vérifier.
- Les déploiements non loopback de l’interface Control nécessitent toujours `gateway.controlUi.allowedOrigins` explicite.
- **Les preuves d’en-têtes transférés priment sur la localité loopback.** Si une requête arrive sur la boucle locale mais porte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` pointant vers une origine non locale, cette preuve invalide l’affirmation de localité loopback. La requête est traitée comme distante pour l’appairage, l’authentification par proxy approuvé et le filtrage d’identité d’appareil de l’interface Control. Cela empêche un proxy loopback sur le même hôte de blanchir une identité d’en-tête transféré en authentification par proxy approuvé.

### Référence de configuration

| Champ                                       | Obligatoire | Description                                                                 |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Oui         | Tableau d’adresses IP de proxy à approuver. Les requêtes provenant d’autres IP sont rejetées. |
| `gateway.auth.mode`                         | Oui         | Doit être `"trusted-proxy"`                                                 |
| `gateway.auth.trustedProxy.userHeader`      | Oui         | Nom de l’en-tête contenant l’identité de l’utilisateur authentifié          |
| `gateway.auth.trustedProxy.requiredHeaders` | Non         | En-têtes supplémentaires qui doivent être présents pour que la requête soit approuvée |
| `gateway.auth.trustedProxy.allowUsers`      | Non         | Liste d’autorisation d’identités utilisateur. Vide signifie autoriser tous les utilisateurs authentifiés. |

## Terminaison TLS et HSTS

Utilisez un seul point de terminaison TLS et appliquez HSTS à cet endroit.

### Modèle recommandé : terminaison TLS au niveau du proxy

Lorsque votre proxy inverse gère HTTPS pour `https://control.example.com`, définissez
`Strict-Transport-Security` au niveau du proxy pour ce domaine.

- Convient bien aux déploiements exposés à Internet.
- Conserve le certificat et la politique de renforcement HTTP au même endroit.
- OpenClaw peut rester en HTTP loopback derrière le proxy.

Valeur d’en-tête d’exemple :

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminaison TLS du Gateway

Si OpenClaw sert lui-même directement HTTPS (sans proxy terminant TLS), définissez :

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` accepte une valeur de chaîne d’en-tête, ou `false` pour désactiver explicitement.

### Conseils de déploiement progressif

- Commencez d’abord avec un âge maximal court (par exemple `max-age=300`) pendant la validation du trafic.
- Augmentez vers des valeurs longue durée (par exemple `max-age=31536000`) uniquement lorsque la confiance est élevée.
- Ajoutez `includeSubDomains` uniquement si chaque sous-domaine est prêt pour HTTPS.
- Utilisez preload uniquement si vous respectez intentionnellement les exigences de preload pour l’ensemble complet de vos domaines.
- Le développement local en loopback uniquement ne bénéficie pas de HSTS.

## Exemples de configuration de proxy

### Pomerium

Pomerium transmet l’identité dans `x-pomerium-claim-email` (ou d’autres en-têtes de revendication) et un JWT dans `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium's IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Extrait de configuration Pomerium :

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy avec OAuth

Caddy avec le Plugin `caddy-security` peut authentifier les utilisateurs et transmettre des en-têtes d’identité.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Extrait de Caddyfile :

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy authentifie les utilisateurs et transmet l’identité dans `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Extrait de configuration nginx :

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik avec Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik container IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Configuration mixte avec jeton

OpenClaw rejette les configurations ambiguës où un `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) et le mode `trusted-proxy` sont actifs simultanément. Les configurations mixtes avec jeton peuvent faire en sorte que les requêtes loopback s’authentifient silencieusement via le mauvais chemin d’authentification.

Si vous voyez une erreur `mixed_trusted_proxy_token` au démarrage :

- Supprimez le jeton partagé lorsque vous utilisez le mode trusted-proxy, ou
- Basculez `gateway.auth.mode` sur `"token"` si vous souhaitez utiliser une authentification par jeton.

L’authentification par proxy approuvé sur loopback échoue également de manière fermée : les appelants sur le même hôte doivent fournir les en-têtes d’identité configurés via un proxy approuvé au lieu d’être authentifiés silencieusement.

## En-tête des portées opérateur

L’authentification par proxy approuvé est un mode HTTP **porteur d’identité**, donc les appelants peuvent
facultativement déclarer des portées opérateur avec `x-openclaw-scopes`.

Exemples :

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportement :

- Lorsque l’en-tête est présent, OpenClaw honore l’ensemble de portées déclaré.
- Lorsque l’en-tête est présent mais vide, la requête déclare **aucune** portée opérateur.
- Lorsque l’en-tête est absent, les API HTTP normales porteuses d’identité reviennent à l’ensemble standard de portées opérateur par défaut.
- Les **routes HTTP de Plugin** avec authentification Gateway sont plus étroites par défaut : lorsque `x-openclaw-scopes` est absent, leur portée d’exécution revient à `operator.write`.
- Les requêtes HTTP provenant du navigateur doivent toujours passer `gateway.controlUi.allowedOrigins` (ou le mode délibéré de repli sur l’en-tête Host) même après le succès de l’authentification par proxy approuvé.

Règle pratique :

- Envoyez `x-openclaw-scopes` explicitement lorsque vous voulez qu’une requête trusted-proxy soit
  plus étroite que les valeurs par défaut, ou lorsqu’une route de Plugin avec authentification gateway a besoin
  de quelque chose de plus fort que la portée write.

## Liste de vérification de sécurité

Avant d’activer l’authentification par proxy approuvé, vérifiez :

- [ ] **Le proxy est le seul chemin** : le port Gateway est protégé par pare-feu contre tout sauf votre proxy
- [ ] **trustedProxies est minimal** : uniquement les IP réelles de votre proxy, pas des sous-réseaux entiers
- [ ] **Pas de source proxy en loopback** : l’authentification trusted-proxy échoue de manière fermée pour les requêtes venant de la boucle locale
- [ ] **Le proxy supprime les en-têtes** : votre proxy remplace (n’ajoute pas) les en-têtes `x-forwarded-*` provenant des clients
- [ ] **Terminaison TLS** : votre proxy gère TLS ; les utilisateurs se connectent via HTTPS
- [ ] **allowedOrigins est explicite** : l’interface Control non loopback utilise `gateway.controlUi.allowedOrigins` explicite
- [ ] **allowUsers est défini** (recommandé) : limitez aux utilisateurs connus plutôt que d’autoriser quiconque est authentifié
- [ ] **Pas de configuration mixte avec jeton** : ne définissez pas simultanément `gateway.auth.token` et `gateway.auth.mode: "trusted-proxy"`

## Audit de sécurité

`openclaw security audit` signalera l’authentification par proxy approuvé avec un résultat de sévérité **critique**. C’est intentionnel — c’est un rappel que vous déléguez la sécurité à la configuration de votre proxy.

L’audit vérifie :

- Rappel de base `gateway.trusted_proxy_auth` en avertissement/critique
- Configuration `trustedProxies` manquante
- Configuration `userHeader` manquante
- `allowUsers` vide (autorise n’importe quel utilisateur authentifié)
- Politique d’origine navigateur générique ou manquante sur les surfaces d’interface Control exposées

## Dépannage

### `trusted_proxy_untrusted_source`

La requête ne provient pas d’une IP présente dans `gateway.trustedProxies`. Vérifiez :

- L’IP du proxy est-elle correcte ? (les IP de conteneurs Docker peuvent changer)
- Y a-t-il un équilibreur de charge devant votre proxy ?
- Utilisez `docker inspect` ou `kubectl get pods -o wide` pour trouver les IP réelles

### `trusted_proxy_loopback_source`

OpenClaw a rejeté une requête trusted-proxy provenant d’une source loopback.

Vérifiez :

- Le proxy se connecte-t-il depuis `127.0.0.1` / `::1` ?
- Essayez-vous d’utiliser l’authentification trusted-proxy avec un proxy inverse loopback sur le même hôte ?

Correction :

- Utilisez l’authentification par jeton/mot de passe pour les configurations de proxy loopback sur le même hôte, ou
- Faites passer le trafic par une adresse de proxy approuvé non loopback et conservez cette IP dans `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

L’en-tête utilisateur était vide ou manquant. Vérifiez :

- Votre proxy est-il configuré pour transmettre des en-têtes d’identité ?
- Le nom de l’en-tête est-il correct ? (insensible à la casse, mais l’orthographe compte)
- L’utilisateur est-il effectivement authentifié au niveau du proxy ?

### `trusted*proxy_missing_header*\*`

Un en-tête requis n’était pas présent. Vérifiez :

- La configuration de votre proxy pour ces en-têtes précis
- Si des en-têtes sont supprimés quelque part dans la chaîne

### `trusted_proxy_user_not_allowed`

L’utilisateur est authentifié mais n’est pas dans `allowUsers`. Ajoutez-le ou supprimez la liste d’autorisation.

### `trusted_proxy_origin_not_allowed`

L’authentification trusted-proxy a réussi, mais l’en-tête navigateur `Origin` n’a pas passé les contrôles d’origine de l’interface Control.

Vérifiez :

- `gateway.controlUi.allowedOrigins` inclut l’origine exacte du navigateur
- Vous ne vous appuyez pas sur des origines génériques sauf si vous voulez intentionnellement un comportement autorisant tout
- Si vous utilisez intentionnellement le mode de repli sur l’en-tête Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` est défini délibérément

### WebSocket échoue toujours

Assurez-vous que votre proxy :

- prend en charge les mises à niveau WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- transmet les en-têtes d’identité sur les requêtes de mise à niveau WebSocket (pas seulement en HTTP)
- n’a pas un chemin d’authentification distinct pour les connexions WebSocket

## Migration depuis l’authentification par jeton

Si vous passez de l’authentification par jeton à trusted-proxy :

1. Configurez votre proxy pour authentifier les utilisateurs et transmettre les en-têtes
2. Testez la configuration du proxy indépendamment (`curl` avec en-têtes)
3. Mettez à jour la configuration OpenClaw avec l’authentification trusted-proxy
4. Redémarrez le Gateway
5. Testez les connexions WebSocket depuis l’interface Control
6. Exécutez `openclaw security audit` et examinez les résultats

## Voir aussi

- [Sécurité](/fr/gateway/security) — guide complet de sécurité
- [Configuration](/fr/gateway/configuration) — référence de configuration
- [Accès à distance](/fr/gateway/remote) — autres modèles d’accès distant
- [Tailscale](/fr/gateway/tailscale) — alternative plus simple pour un accès limité au tailnet
