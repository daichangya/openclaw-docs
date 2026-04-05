---
read_when:
    - Exposition de l’interface de contrôle de la passerelle en dehors de localhost
    - Automatisation de l’accès au tableau de bord via tailnet ou public
summary: Serve/Funnel Tailscale intégré pour le tableau de bord de la passerelle
title: Tailscale
x-i18n:
    generated_at: "2026-04-05T12:43:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (tableau de bord de la passerelle)

OpenClaw peut configurer automatiquement Tailscale **Serve** (tailnet) ou **Funnel** (public) pour le
tableau de bord de la passerelle et le port WebSocket. Cela permet de garder la passerelle liée au loopback tandis que
Tailscale fournit HTTPS, le routage et (pour Serve) les en-têtes d’identité.

## Modes

- `serve` : Serve limité au tailnet via `tailscale serve`. La passerelle reste sur `127.0.0.1`.
- `funnel` : HTTPS public via `tailscale funnel`. OpenClaw exige un mot de passe partagé.
- `off` : par défaut (pas d’automatisation Tailscale).

## Authentification

Définissez `gateway.auth.mode` pour contrôler la poignée de main :

- `none` (entrée privée uniquement)
- `token` (par défaut lorsque `OPENCLAW_GATEWAY_TOKEN` est défini)
- `password` (secret partagé via `OPENCLAW_GATEWAY_PASSWORD` ou la configuration)
- `trusted-proxy` (proxy inverse sensible à l’identité ; voir [Authentification Trusted Proxy](/gateway/trusted-proxy-auth))

Lorsque `tailscale.mode = "serve"` et que `gateway.auth.allowTailscale` vaut `true`,
l’authentification de l’interface de contrôle/WebSocket peut utiliser les en-têtes d’identité Tailscale
(`tailscale-user-login`) sans fournir de jeton/mot de passe. OpenClaw vérifie
l’identité en résolvant l’adresse `x-forwarded-for` via le daemon Tailscale local
(`tailscale whois`) et en la comparant à l’en-tête avant de l’accepter.
OpenClaw ne traite une requête comme provenant de Serve que lorsqu’elle arrive depuis le loopback avec
les en-têtes Tailscale `x-forwarded-for`, `x-forwarded-proto` et `x-forwarded-host`.
Les points de terminaison de l’API HTTP (par exemple `/v1/*`, `/tools/invoke` et `/api/channels/*`)
n’utilisent **pas** l’authentification par en-têtes d’identité Tailscale. Ils suivent toujours le
mode d’auth HTTP normal de la passerelle : auth par secret partagé par défaut, ou une configuration
intentionnelle `trusted-proxy` / `none` sur entrée privée.
Ce flux sans jeton suppose que l’hôte de la passerelle est approuvé. Si du code local non approuvé
peut s’exécuter sur le même hôte, désactivez `gateway.auth.allowTailscale` et exigez à la place
une authentification par jeton/mot de passe.
Pour exiger des identifiants explicites de secret partagé, définissez `gateway.auth.allowTailscale: false`
et utilisez `gateway.auth.mode: "token"` ou `"password"`.

## Exemples de configuration

### Tailnet uniquement (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Ouvrir : `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

### Tailnet uniquement (liaison à l’IP Tailnet)

Utilisez ceci lorsque vous souhaitez que la passerelle écoute directement sur l’IP Tailnet (sans Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Se connecter depuis un autre appareil Tailnet :

- Interface de contrôle : `http://<tailscale-ip>:18789/`
- WebSocket : `ws://<tailscale-ip>:18789`

Remarque : le loopback (`http://127.0.0.1:18789`) **ne fonctionnera pas** dans ce mode.

### Internet public (Funnel + mot de passe partagé)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Préférez `OPENCLAW_GATEWAY_PASSWORD` plutôt que de valider un mot de passe sur disque.

## Exemples CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Remarques

- Tailscale Serve/Funnel nécessite que la CLI `tailscale` soit installée et connectée.
- `tailscale.mode: "funnel"` refuse de démarrer sauf si le mode d’auth est `password` afin d’éviter une exposition publique.
- Définissez `gateway.tailscale.resetOnExit` si vous souhaitez qu’OpenClaw annule la configuration `tailscale serve`
  ou `tailscale funnel` à l’arrêt.
- `gateway.bind: "tailnet"` est une liaison Tailnet directe (sans HTTPS, sans Serve/Funnel).
- `gateway.bind: "auto"` préfère le loopback ; utilisez `tailnet` si vous voulez uniquement Tailnet.
- Serve/Funnel n’exposent que l’**interface de contrôle de la passerelle + WS**. Les nœuds se connectent via
  le même point de terminaison WS de la passerelle, donc Serve peut fonctionner pour l’accès des nœuds.

## Contrôle browser (passerelle distante + browser local)

Si vous exécutez la passerelle sur une machine mais souhaitez piloter un browser sur une autre machine,
exécutez un **hôte de nœud** sur la machine du browser et gardez les deux sur le même tailnet.
La passerelle proxifiera les actions du browser vers le nœud ; aucun serveur de contrôle séparé ni URL Serve n’est nécessaire.

Évitez Funnel pour le contrôle browser ; traitez l’appairage du nœud comme un accès opérateur.

## Prérequis + limites Tailscale

- Serve nécessite que HTTPS soit activé pour votre tailnet ; la CLI vous invite si ce n’est pas le cas.
- Serve injecte des en-têtes d’identité Tailscale ; Funnel ne le fait pas.
- Funnel nécessite Tailscale v1.38.3+, MagicDNS, HTTPS activé et un attribut de nœud funnel.
- Funnel prend uniquement en charge les ports `443`, `8443` et `10000` via TLS.
- Funnel sur macOS nécessite la variante open source de l’app Tailscale.

## En savoir plus

- Présentation de Tailscale Serve : [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Commande `tailscale serve` : [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Présentation de Tailscale Funnel : [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Commande `tailscale funnel` : [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
