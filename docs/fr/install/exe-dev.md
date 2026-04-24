---
read_when:
    - Vous voulez un hôte Linux bon marché, toujours actif, pour le Gateway
    - Vous souhaitez un accès distant à l’interface de contrôle sans gérer votre propre VPS
summary: Exécuter le Gateway OpenClaw sur exe.dev (VM + proxy HTTPS) pour un accès distant
title: exe.dev
x-i18n:
    generated_at: "2026-04-24T07:16:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

Objectif : un Gateway OpenClaw exécuté sur une VM exe.dev, accessible depuis votre ordinateur portable via : `https://<vm-name>.exe.xyz`

Cette page suppose l’image par défaut **exeuntu** d’exe.dev. Si vous avez choisi une autre distribution, adaptez les paquets en conséquence.

## Chemin rapide pour débutants

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Renseignez votre clé/jeton d’authentification si nécessaire
3. Cliquez sur « Agent » à côté de votre VM et attendez que Shelley termine le provisionnement
4. Ouvrez `https://<vm-name>.exe.xyz/` et authentifiez-vous avec le secret partagé configuré (ce guide utilise l’authentification par jeton par défaut, mais l’authentification par mot de passe fonctionne aussi si vous remplacez `gateway.auth.mode`)
5. Approuvez toute demande d’appairage d’appareil en attente avec `openclaw devices approve <requestId>`

## Ce dont vous avez besoin

- Un compte exe.dev
- Un accès `ssh exe.dev` aux machines virtuelles [exe.dev](https://exe.dev) (facultatif)

## Installation automatisée avec Shelley

Shelley, l’agent d’[exe.dev](https://exe.dev), peut installer OpenClaw instantanément avec notre
prompt. Le prompt utilisé est le suivant :

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Installation manuelle

## 1) Créer la VM

Depuis votre appareil :

```bash
ssh exe.dev new
```

Puis connectez-vous :

```bash
ssh <vm-name>.exe.xyz
```

Astuce : gardez cette VM **avec état**. OpenClaw stocke `openclaw.json`, les
`auth-profiles.json` par agent, les sessions, et l’état des canaux/fournisseurs sous
`~/.openclaw/`, ainsi que l’espace de travail sous `~/.openclaw/workspace/`.

## 2) Installer les prérequis (sur la VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Installer OpenClaw

Exécutez le script d’installation OpenClaw :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Configurer nginx pour proxifier OpenClaw vers le port 8000

Modifiez `/etc/nginx/sites-enabled/default` avec

```text
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # Prise en charge WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # En-têtes proxy standard
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Paramètres de délai pour les connexions de longue durée
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Écrasez les en-têtes de transfert au lieu de préserver les chaînes fournies par le client.
OpenClaw ne fait confiance aux métadonnées IP transférées que depuis des proxys explicitement configurés,
et les chaînes `X-Forwarded-For` de type append sont traitées comme un risque de durcissement.

## 5) Accéder à OpenClaw et accorder les privilèges

Accédez à `https://<vm-name>.exe.xyz/` (voir la sortie de l’interface de contrôle produite lors de l’onboarding). Si une authentification est demandée, collez le
secret partagé configuré depuis la VM. Ce guide utilise l’authentification par jeton, donc récupérez `gateway.auth.token`
avec `openclaw config get gateway.auth.token` (ou générez-en un avec `openclaw doctor --generate-gateway-token`).
Si vous avez basculé le gateway en authentification par mot de passe, utilisez `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` à la place.
Approuvez les appareils avec `openclaw devices list` puis `openclaw devices approve <requestId>`. En cas de doute, utilisez Shelley depuis votre navigateur !

## Accès distant

L’accès distant est géré par l’authentification d’[exe.dev](https://exe.dev). Par
défaut, le trafic HTTP du port 8000 est transféré vers `https://<vm-name>.exe.xyz`
avec une authentification par email.

## Mise à jour

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Guide : [Updating](/fr/install/updating)

## Lié

- [Gateway distant](/fr/gateway/remote)
- [Aperçu de l’installation](/fr/install)
