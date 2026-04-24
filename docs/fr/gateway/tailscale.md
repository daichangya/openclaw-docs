---
read_when:
    - Exposer l’interface Control de Gateway en dehors de localhost
    - Automatiser l’accès au tableau de bord via tailnet ou en public
summary: Tailscale Serve/Funnel intégrés pour le tableau de bord Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T07:12:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (tableau de bord Gateway)

OpenClaw peut configurer automatiquement Tailscale **Serve** (tailnet) ou **Funnel** (public) pour le
tableau de bord Gateway et le port WebSocket. Cela permet de garder Gateway lié à la boucle locale pendant que
Tailscale fournit HTTPS, le routage et (pour Serve) les en-têtes d’identité.

## Modes

- `serve` : Serve réservé au tailnet via `tailscale serve`. Le gateway reste sur `127.0.0.1`.
- `funnel` : HTTPS public via `tailscale funnel`. OpenClaw exige un mot de passe partagé.
- `off` : par défaut (aucune automatisation Tailscale).

## Authentification

Définissez `gateway.auth.mode` pour contrôler la poignée de main :

- `none` (entrée privée uniquement)
- `token` (par défaut lorsque `OPENCLAW_GATEWAY_TOKEN` est défini)
- `password` (secret partagé via `OPENCLAW_GATEWAY_PASSWORD` ou la configuration)
- `trusted-proxy` (proxy inverse conscient de l’identité ; voir [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth))

Lorsque `tailscale.mode = "serve"` et `gateway.auth.allowTailscale` vaut `true`,
l’authentification de l’interface Control/WebSocket peut utiliser les en-têtes d’identité Tailscale
(`tailscale-user-login`) sans fournir de jeton/mot de passe. OpenClaw vérifie
l’identité en résolvant l’adresse `x-forwarded-for` via le démon Tailscale local
(`tailscale whois`) et en la comparant à l’en-tête avant de l’accepter.
OpenClaw ne traite une requête comme Serve que lorsqu’elle arrive depuis la boucle locale avec
les en-têtes Tailscale `x-forwarded-for`, `x-forwarded-proto` et `x-forwarded-host`.
Les endpoints d’API HTTP (par exemple `/v1/*`, `/tools/invoke` et `/api/channels/*`)
n’utilisent **pas** l’authentification par en-tête d’identité Tailscale. Ils suivent toujours le
mode d’authentification HTTP normal du gateway : authentification par secret partagé par défaut, ou configuration intentionnelle en `trusted-proxy` / `none` pour entrée privée.
Ce flux sans jeton suppose que l’hôte gateway est de confiance. Si du code local non fiable
peut s’exécuter sur le même hôte, désactivez `gateway.auth.allowTailscale` et exigez
à la place une authentification par jeton/mot de passe.
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

Ouvrir : `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

### Tailnet uniquement (liaison à l’IP Tailnet)

Utilisez ceci lorsque vous voulez que Gateway écoute directement sur l’IP Tailnet (sans Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Se connecter depuis un autre appareil Tailnet :

- Interface Control : `http://<tailscale-ip>:18789/`
- WebSocket : `ws://<tailscale-ip>:18789`

Remarque : la boucle locale (`http://127.0.0.1:18789`) **ne fonctionnera pas** dans ce mode.

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

Préférez `OPENCLAW_GATEWAY_PASSWORD` plutôt que d’enregistrer un mot de passe sur disque.

## Exemples CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Remarques

- Tailscale Serve/Funnel nécessite que la CLI `tailscale` soit installée et connectée.
- `tailscale.mode: "funnel"` refuse de démarrer sauf si le mode d’authentification est `password` afin d’éviter une exposition publique.
- Définissez `gateway.tailscale.resetOnExit` si vous voulez qu’OpenClaw annule la configuration `tailscale serve`
  ou `tailscale funnel` à l’arrêt.
- `gateway.bind: "tailnet"` est une liaison Tailnet directe (pas de HTTPS, pas de Serve/Funnel).
- `gateway.bind: "auto"` préfère la boucle locale ; utilisez `tailnet` si vous voulez du Tailnet uniquement.
- Serve/Funnel n’exposent que l’**interface de contrôle Gateway + WS**. Les Nodes se connectent via
  le même endpoint WS Gateway, donc Serve peut aussi fonctionner pour l’accès aux Nodes.

## Contrôle du navigateur (Gateway distant + navigateur local)

Si vous exécutez le Gateway sur une machine mais souhaitez piloter un navigateur sur une autre machine,
exécutez un **hôte Node** sur la machine du navigateur et gardez les deux sur le même tailnet.
Le Gateway transmettra les actions navigateur au Node ; aucun serveur de contrôle distinct ni URL Serve n’est nécessaire.

Évitez Funnel pour le contrôle du navigateur ; traitez l’appairage des Nodes comme un accès opérateur.

## Prérequis et limites Tailscale

- Serve exige que HTTPS soit activé pour votre tailnet ; la CLI vous invite si ce n’est pas le cas.
- Serve injecte les en-têtes d’identité Tailscale ; Funnel non.
- Funnel nécessite Tailscale v1.38.3+, MagicDNS, HTTPS activé et un attribut de nœud funnel.
- Funnel ne prend en charge que les ports `443`, `8443` et `10000` sur TLS.
- Funnel sur macOS nécessite la variante open source de l’application Tailscale.

## En savoir plus

- Présentation de Tailscale Serve : [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Commande `tailscale serve` : [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Présentation de Tailscale Funnel : [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Commande `tailscale funnel` : [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Voir aussi

- [Accès à distance](/fr/gateway/remote)
- [Découverte](/fr/gateway/discovery)
- [Authentification](/fr/gateway/authentication)
