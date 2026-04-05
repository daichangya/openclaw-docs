---
read_when:
    - Exécution d’OpenClaw derrière un proxy sensible à l’identité
    - Configuration de Pomerium, Caddy ou nginx avec OAuth devant OpenClaw
    - Correction des erreurs WebSocket 1008 unauthorized avec des configurations de proxy inverse
    - Décider où définir HSTS et d’autres en-têtes de durcissement HTTP
summary: Déléguer l’authentification de la passerelle à un proxy inverse approuvé (Pomerium, Caddy, nginx + OAuth)
title: Authentification Trusted Proxy
x-i18n:
    generated_at: "2026-04-05T12:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Authentification Trusted Proxy

> ⚠️ **Fonctionnalité sensible à la sécurité.** Ce mode délègue entièrement l’authentification à votre proxy inverse. Une mauvaise configuration peut exposer votre passerelle à un accès non autorisé. Lisez attentivement cette page avant de l’activer.

## Quand l’utiliser

Utilisez le mode d’authentification `trusted-proxy` lorsque :

- Vous exécutez OpenClaw derrière un **proxy sensible à l’identité** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Votre proxy gère toute l’authentification et transmet l’identité de l’utilisateur via des en-têtes
- Vous êtes dans un environnement Kubernetes ou conteneur où le proxy est le seul chemin vers la passerelle
- Vous rencontrez des erreurs WebSocket `1008 unauthorized` parce que les navigateurs ne peuvent pas transmettre de jetons dans les charges utiles WS

## Quand NE PAS l’utiliser

- Si votre proxy n’authentifie pas les utilisateurs (simple terminateur TLS ou répartiteur de charge)
- S’il existe un chemin vers la passerelle qui contourne le proxy (trous dans le pare-feu, accès réseau interne)
- Si vous n’êtes pas sûr que votre proxy supprime/remplace correctement les en-têtes transférés
- Si vous n’avez besoin que d’un accès personnel mono-utilisateur (envisagez Tailscale Serve + loopback pour une configuration plus simple)

## Fonctionnement

1. Votre proxy inverse authentifie les utilisateurs (OAuth, OIDC, SAML, etc.)
2. Le proxy ajoute un en-tête contenant l’identité de l’utilisateur authentifié (par ex. `x-forwarded-user: nick@example.com`)
3. OpenClaw vérifie que la requête provient d’une **IP de proxy approuvée** (configurée dans `gateway.trustedProxies`)
4. OpenClaw extrait l’identité utilisateur depuis l’en-tête configuré
5. Si tout est correct, la requête est autorisée

## Comportement d’appairage de l’interface de contrôle

Lorsque `gateway.auth.mode = "trusted-proxy"` est actif et que la requête passe les vérifications trusted-proxy, les sessions WebSocket de l’interface de contrôle peuvent se connecter sans identité d’appairage de l’appareil.

Implications :

- L’appairage n’est plus le principal verrou pour l’accès à l’interface de contrôle dans ce mode.
- Votre politique d’auth du proxy inverse et `allowUsers` deviennent le contrôle d’accès effectif.
- Gardez l’entrée de la passerelle verrouillée uniquement aux IP de proxy approuvées (`gateway.trustedProxies` + pare-feu).

## Configuration

```json5
{
  gateway: {
    // L’auth trusted-proxy attend des requêtes provenant d’une source trusted-proxy non loopback
    bind: "lan",

    // CRITIQUE : n’ajoutez ici que l’IP ou les IP de votre proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // En-tête contenant l’identité de l’utilisateur authentifié (obligatoire)
        userHeader: "x-forwarded-user",

        // Facultatif : en-têtes qui DOIVENT être présents (vérification du proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Facultatif : restreindre à des utilisateurs spécifiques (vide = autoriser tous)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Règle d’exécution importante :

- L’auth trusted-proxy rejette les requêtes provenant du loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Les proxys inverses loopback sur le même hôte ne satisfont **pas** l’auth trusted-proxy.
- Pour les configurations de proxy loopback sur le même hôte, utilisez plutôt l’auth par jeton/mot de passe, ou faites transiter via une adresse trusted-proxy non loopback qu’OpenClaw peut vérifier.
- Les déploiements d’interface de contrôle non loopback nécessitent toujours des `gateway.controlUi.allowedOrigins` explicites.

### Référence de configuration

| Champ                                       | Obligatoire | Description                                                                 |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Oui         | Tableau des adresses IP de proxy à approuver. Les requêtes d’autres IP sont rejetées. |
| `gateway.auth.mode`                         | Oui         | Doit être `"trusted-proxy"`                                                 |
| `gateway.auth.trustedProxy.userHeader`      | Oui         | Nom de l’en-tête contenant l’identité de l’utilisateur authentifié          |
| `gateway.auth.trustedProxy.requiredHeaders` | Non         | En-têtes supplémentaires qui doivent être présents pour que la requête soit approuvée |
| `gateway.auth.trustedProxy.allowUsers`      | Non         | Liste d’autorisation des identités utilisateur. Vide signifie autoriser tous les utilisateurs authentifiés. |

## Terminaison TLS et HSTS

Utilisez un seul point de terminaison TLS et appliquez HSTS à cet endroit.

### Modèle recommandé : terminaison TLS au niveau du proxy

Lorsque votre proxy inverse gère HTTPS pour `https://control.example.com`, définissez
`Strict-Transport-Security` au niveau du proxy pour ce domaine.

- Convient bien aux déploiements exposés à Internet.
- Regroupe certificat + politique de durcissement HTTP au même endroit.
- OpenClaw peut rester en HTTP loopback derrière le proxy.

Exemple de valeur d’en-tête :

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminaison TLS au niveau de la passerelle

Si OpenClaw sert lui-même HTTPS directement (sans proxy terminant TLS), définissez :

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

`strictTransportSecurity` accepte une valeur d’en-tête chaîne, ou `false` pour le désactiver explicitement.

### Conseils de déploiement progressif

- Commencez d’abord avec un `max-age` court (par exemple `max-age=300`) pendant la validation du trafic.
- Augmentez vers des valeurs longues (par exemple `max-age=31536000`) uniquement lorsque la confiance est élevée.
- Ajoutez `includeSubDomains` uniquement si chaque sous-domaine est prêt pour HTTPS.
- Utilisez preload uniquement si vous remplissez intentionnellement les exigences preload pour l’ensemble complet de vos domaines.
- Le développement local limité au loopback ne bénéficie pas de HSTS.

## Exemples de configuration de proxy

### Pomerium

Pomerium transmet l’identité dans `x-pomerium-claim-email` (ou d’autres en-têtes de revendication) et un JWT dans `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP de Pomerium
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

Extrait de configuration Pomerium :

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

Caddy avec le plugin `caddy-security` peut authentifier les utilisateurs et transmettre des en-têtes d’identité.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP du proxy Caddy/sidecar
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Extrait de Caddyfile :

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
    trustedProxies: ["10.0.0.1"], // IP nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Extrait de configuration nginx :

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
    trustedProxies: ["172.17.0.1"], // IP du conteneur Traefik
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

OpenClaw rejette les configurations ambiguës où `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) et le mode `trusted-proxy` sont actifs en même temps. Les configurations mixtes avec jeton peuvent amener les requêtes loopback à s’authentifier silencieusement via le mauvais chemin d’auth.

Si vous voyez une erreur `mixed_trusted_proxy_token` au démarrage :

- Supprimez le jeton partagé lorsque vous utilisez le mode trusted-proxy, ou
- Basculez `gateway.auth.mode` vers `"token"` si vous souhaitez réellement une auth par jeton.

L’auth trusted-proxy loopback échoue également en mode fermé : les appelants sur le même hôte doivent fournir les en-têtes d’identité configurés via un proxy approuvé au lieu d’être authentifiés silencieusement.

## En-tête de portées opérateur

L’auth trusted-proxy est un mode HTTP **porteur d’identité**, de sorte que les appelants peuvent facultativement déclarer des portées opérateur avec `x-openclaw-scopes`.

Exemples :

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportement :

- Lorsque l’en-tête est présent, OpenClaw respecte l’ensemble de portées déclaré.
- Lorsque l’en-tête est présent mais vide, la requête déclare **aucune** portée opérateur.
- Lorsque l’en-tête est absent, les API HTTP normales porteuses d’identité retombent sur l’ensemble standard de portées opérateur par défaut.
- Les **routes HTTP de plugin** authentifiées par la passerelle sont plus étroites par défaut : lorsque `x-openclaw-scopes` est absent, leur portée d’exécution retombe sur `operator.write`.
- Les requêtes HTTP d’origine navigateur doivent toujours passer `gateway.controlUi.allowedOrigins` (ou le mode de repli délibéré basé sur l’en-tête Host) même après la réussite de l’auth trusted-proxy.

Règle pratique :

- Envoyez `x-openclaw-scopes` explicitement lorsque vous souhaitez qu’une requête trusted-proxy soit plus étroite que les valeurs par défaut, ou lorsqu’une route de plugin authentifiée par la passerelle a besoin d’un niveau plus fort que la portée write.

## Checklist de sécurité

Avant d’activer l’auth trusted-proxy, vérifiez :

- [ ] **Le proxy est le seul chemin** : le port de la passerelle est protégé par pare-feu contre tout sauf votre proxy
- [ ] **trustedProxies est minimal** : uniquement les IP réelles de votre proxy, pas des sous-réseaux entiers
- [ ] **Aucune source proxy loopback** : l’auth trusted-proxy échoue en mode fermé pour les requêtes provenant du loopback
- [ ] **Le proxy supprime les en-têtes** : votre proxy remplace (et n’ajoute pas) les en-têtes `x-forwarded-*` provenant des clients
- [ ] **Terminaison TLS** : votre proxy gère TLS ; les utilisateurs se connectent via HTTPS
- [ ] **allowedOrigins est explicite** : l’interface de contrôle non loopback utilise des `gateway.controlUi.allowedOrigins` explicites
- [ ] **allowUsers est défini** (recommandé) : restreignez aux utilisateurs connus plutôt que d’autoriser toute personne authentifiée
- [ ] **Pas de configuration mixte avec jeton** : ne définissez pas à la fois `gateway.auth.token` et `gateway.auth.mode: "trusted-proxy"`

## Audit de sécurité

`openclaw security audit` signalera l’auth trusted-proxy avec une détection de sévérité **critique**. C’est intentionnel — c’est un rappel que vous déléguez la sécurité à votre configuration de proxy.

L’audit vérifie :

- avertissement/rappel critique de base `gateway.trusted_proxy_auth`
- configuration `trustedProxies` manquante
- configuration `userHeader` manquante
- `allowUsers` vide (autorise tout utilisateur authentifié)
- politique d’origine navigateur générique ou absente sur les surfaces d’interface de contrôle exposées

## Dépannage

### "trusted_proxy_untrusted_source"

La requête ne provient pas d’une IP présente dans `gateway.trustedProxies`. Vérifiez :

- L’IP du proxy est-elle correcte ? (les IP de conteneur Docker peuvent changer)
- Y a-t-il un répartiteur de charge devant votre proxy ?
- Utilisez `docker inspect` ou `kubectl get pods -o wide` pour trouver les IP réelles

### "trusted_proxy_loopback_source"

OpenClaw a rejeté une requête trusted-proxy provenant du loopback.

Vérifiez :

- Le proxy se connecte-t-il depuis `127.0.0.1` / `::1` ?
- Essayez-vous d’utiliser l’auth trusted-proxy avec un proxy inverse loopback sur le même hôte ?

Correction :

- Utilisez l’auth par jeton/mot de passe pour les configurations de proxy loopback sur le même hôte, ou
- Faites transiter via une adresse trusted-proxy non loopback et gardez cette IP dans `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

L’en-tête utilisateur était vide ou absent. Vérifiez :

- Votre proxy est-il configuré pour transmettre des en-têtes d’identité ?
- Le nom de l’en-tête est-il correct ? (insensible à la casse, mais l’orthographe compte)
- L’utilisateur est-il réellement authentifié au niveau du proxy ?

### "trusted*proxy_missing_header*\*"

Un en-tête requis n’était pas présent. Vérifiez :

- La configuration de votre proxy pour ces en-têtes spécifiques
- Si des en-têtes sont supprimés quelque part dans la chaîne

### "trusted_proxy_user_not_allowed"

L’utilisateur est authentifié mais n’est pas dans `allowUsers`. Ajoutez-le ou supprimez la liste d’autorisation.

### "trusted_proxy_origin_not_allowed"

L’auth trusted-proxy a réussi, mais l’en-tête `Origin` du navigateur n’a pas passé les vérifications d’origine de l’interface de contrôle.

Vérifiez :

- `gateway.controlUi.allowedOrigins` inclut l’origine exacte du navigateur
- Vous ne vous appuyez pas sur des origines génériques sauf si vous voulez intentionnellement autoriser tout
- Si vous utilisez intentionnellement le mode de repli basé sur l’en-tête Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` est défini délibérément

### WebSocket échoue toujours

Assurez-vous que votre proxy :

- Prend en charge les upgrades WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Transmet les en-têtes d’identité lors des requêtes d’upgrade WebSocket (pas seulement HTTP)
- N’a pas de chemin d’auth séparé pour les connexions WebSocket

## Migration depuis l’auth par jeton

Si vous passez de l’auth par jeton à trusted-proxy :

1. Configurez votre proxy pour authentifier les utilisateurs et transmettre les en-têtes
2. Testez indépendamment la configuration du proxy (curl avec en-têtes)
3. Mettez à jour la configuration OpenClaw avec l’auth trusted-proxy
4. Redémarrez la passerelle
5. Testez les connexions WebSocket depuis l’interface de contrôle
6. Exécutez `openclaw security audit` et examinez les détections

## Lié

- [Sécurité](/gateway/security) — guide de sécurité complet
- [Configuration](/gateway/configuration) — référence de configuration
- [Accès distant](/gateway/remote) — autres modèles d’accès distant
- [Tailscale](/gateway/tailscale) — alternative plus simple pour un accès tailnet uniquement
