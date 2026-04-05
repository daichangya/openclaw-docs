---
read_when:
    - Vous voulez accéder à la Gateway via Tailscale
    - Vous voulez l'UI de contrôle dans le navigateur et l'édition de configuration
summary: 'Surfaces web de la Gateway : UI de contrôle, modes de liaison et sécurité'
title: Web
x-i18n:
    generated_at: "2026-04-05T12:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f5643283f7d37235d3d8104897f38db27ac5a9fdef6165156fb542d0e7048c
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

La Gateway sert une petite **UI de contrôle navigateur** (Vite + Lit) sur le même port que le WebSocket de la Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par exemple `/openclaw`)

Les fonctionnalités sont décrites dans [Control UI](/web/control-ui).
Cette page se concentre sur les modes de liaison, la sécurité et les surfaces exposées au web.

## Webhooks

Lorsque `hooks.enabled=true`, la Gateway expose également un petit endpoint webhook sur le même serveur HTTP.
Voir [Configuration de la Gateway](/fr/gateway/configuration) → `hooks` pour l'authentification et les charges utiles.

## Configuration (activée par défaut)

L'UI de contrôle est **activée par défaut** lorsque les assets sont présents (`dist/control-ui`).
Vous pouvez la contrôler via la configuration :

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath facultatif
  },
}
```

## Accès Tailscale

### Serve intégré (recommandé)

Gardez la Gateway sur loopback et laissez Tailscale Serve la proxifier :

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Démarrez ensuite la gateway :

```bash
openclaw gateway
```

Ouvrez :

- `https://<magicdns>/` (ou la valeur configurée de `gateway.controlUi.basePath`)

### Liaison tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Démarrez ensuite la gateway (cet exemple non loopback utilise une authentification
par token à secret partagé) :

```bash
openclaw gateway
```

Ouvrez :

- `http://<tailscale-ip>:18789/` (ou la valeur configurée de `gateway.controlUi.basePath`)

### Internet public (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // ou OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Notes de sécurité

- L'authentification de la Gateway est requise par défaut (token, mot de passe, trusted-proxy, ou en-têtes d'identité Tailscale Serve lorsqu'ils sont activés).
- Les liaisons non loopback **requièrent** toujours l'authentification de la gateway. En pratique, cela signifie une authentification par token/mot de passe ou un reverse proxy sensible à l'identité avec `gateway.auth.mode: "trusted-proxy"`.
- L'assistant crée par défaut une authentification à secret partagé et génère généralement un token de gateway (même sur loopback).
- En mode secret partagé, l'UI envoie `connect.params.auth.token` ou `connect.params.auth.password`.
- Dans les modes portant une identité comme Tailscale Serve ou `trusted-proxy`, la vérification d'authentification WebSocket est satisfaite à partir des en-têtes de requête.
- Pour les déploiements non loopback de l'UI de contrôle, définissez explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Sans cela, le démarrage de la gateway est refusé par défaut.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de repli d'origine via l'en-tête Host, mais il s'agit d'un affaiblissement dangereux de la sécurité.
- Avec Serve, les en-têtes d'identité Tailscale peuvent satisfaire l'authentification de l'UI de contrôle/WebSocket lorsque `gateway.auth.allowTailscale` vaut `true` (aucun token/mot de passe requis).
  Les endpoints de l'API HTTP n'utilisent pas ces en-têtes d'identité Tailscale ; ils suivent à la place le mode d'authentification HTTP normal de la gateway. Définissez
  `gateway.auth.allowTailscale: false` pour exiger des identifiants explicites. Voir
  [Tailscale](/fr/gateway/tailscale) et [Security](/fr/gateway/security). Ce
  flux sans token suppose que l'hôte de la gateway est de confiance.
- `gateway.tailscale.mode: "funnel"` nécessite `gateway.auth.mode: "password"` (mot de passe partagé).

## Construction de l'UI

La Gateway sert des fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build # installe automatiquement les dépendances UI au premier lancement
```
