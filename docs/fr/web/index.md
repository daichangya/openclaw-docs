---
read_when:
    - Vous voulez accéder au Gateway via Tailscale
    - Vous voulez l’interface de contrôle dans le navigateur et la modification de la configuration
summary: 'Surfaces web du Gateway : interface de contrôle, modes de bind et sécurité'
title: Web
x-i18n:
    generated_at: "2026-04-24T07:40:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Le Gateway sert une petite **interface de contrôle dans le navigateur** (Vite + Lit) depuis le même port que le WebSocket Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Les capacités sont décrites dans [Interface de contrôle](/fr/web/control-ui).
Cette page se concentre sur les modes de bind, la sécurité et les surfaces exposées au web.

## Webhooks

Lorsque `hooks.enabled=true`, le Gateway expose aussi un petit point de terminaison Webhook sur le même serveur HTTP.
Voir [Configuration du Gateway](/fr/gateway/configuration) → `hooks` pour l’authentification + les payloads.

## Configuration (activée par défaut)

L’interface de contrôle est **activée par défaut** lorsque les ressources sont présentes (`dist/control-ui`).
Vous pouvez la contrôler via la configuration :

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Accès Tailscale

### Serve intégré (recommandé)

Gardez le Gateway sur loopback et laissez Tailscale Serve le proxifier :

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Puis démarrez le gateway :

```bash
openclaw gateway
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

### Bind tailnet + jeton

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Puis démarrez le gateway (cet exemple non loopback utilise l’authentification
par jeton à secret partagé) :

```bash
openclaw gateway
```

Ouvrez :

- `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

### Internet public (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Remarques de sécurité

- L’authentification Gateway est requise par défaut (jeton, mot de passe, trusted-proxy, ou en-têtes d’identité Tailscale Serve lorsqu’ils sont activés).
- Les binds non loopback **exigent** toujours une authentification gateway. En pratique, cela signifie une authentification par jeton/mot de passe ou un proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- L’assistant crée par défaut une authentification à secret partagé et génère généralement un
  jeton gateway (même sur loopback).
- En mode secret partagé, l’interface envoie `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Dans les modes porteurs d’identité tels que Tailscale Serve ou `trusted-proxy`, la
  vérification d’authentification WebSocket est satisfaite à partir des en-têtes de requête.
- Pour les déploiements non loopback de l’interface de contrôle, définissez `gateway.controlUi.allowedOrigins`
  explicitement (origines complètes). Sans cela, le démarrage du gateway est refusé par défaut.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active
  le mode de repli d’origine via l’en-tête Host, mais constitue une dangereuse régression de sécurité.
- Avec Serve, les en-têtes d’identité Tailscale peuvent satisfaire l’authentification de l’interface de contrôle/WebSocket
  lorsque `gateway.auth.allowTailscale` vaut `true` (aucun jeton/mot de passe requis).
  Les points de terminaison d’API HTTP n’utilisent pas ces en-têtes d’identité Tailscale ; ils suivent
  à la place le mode d’authentification HTTP normal du gateway. Définissez
  `gateway.auth.allowTailscale: false` pour exiger des identifiants explicites. Voir
  [Tailscale](/fr/gateway/tailscale) et [Sécurité](/fr/gateway/security). Ce
  flux sans jeton suppose que l’hôte gateway est approuvé.
- `gateway.tailscale.mode: "funnel"` exige `gateway.auth.mode: "password"` (mot de passe partagé).

## Construire l’interface

Le Gateway sert des fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```
