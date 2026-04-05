---
read_when:
    - Vous voulez un hôte Linux toujours actif et peu coûteux pour la Gateway
    - Vous voulez un accès distant à l’UI de contrôle sans gérer votre propre VPS
summary: Exécuter OpenClaw Gateway sur exe.dev (VM + proxy HTTPS) pour un accès distant
title: exe.dev
x-i18n:
    generated_at: "2026-04-05T12:45:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff95b6f35b95df35c1b0cae3215647eefe88d2b7f19923868385036cc0dbdbf1
    source_path: install/exe-dev.md
    workflow: 15
---

# exe.dev

Objectif : Gateway OpenClaw en cours d’exécution sur une VM exe.dev, joignable depuis votre laptop via : `https://<vm-name>.exe.xyz`

Cette page suppose l’image **exeuntu** par défaut d’exe.dev. Si vous avez choisi une autre distribution, adaptez les paquets en conséquence.

## Chemin rapide pour débutants

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Remplissez votre clé/jeton d’authentification selon le besoin
3. Cliquez sur « Agent » à côté de votre VM et attendez que Shelley termine l’approvisionnement
4. Ouvrez `https://<vm-name>.exe.xyz/` et authentifiez-vous avec le secret partagé configuré (ce guide utilise l’authentification par jeton par défaut, mais l’authentification par mot de passe fonctionne aussi si vous basculez `gateway.auth.mode`)
5. Approuvez toute demande d’appairage d’appareil en attente avec `openclaw devices approve <requestId>`

## Ce dont vous avez besoin

- Un compte exe.dev
- Un accès `ssh exe.dev` aux machines virtuelles [exe.dev](https://exe.dev) (facultatif)

## Installation automatisée avec Shelley

Shelley, l’agent de [exe.dev](https://exe.dev), peut installer OpenClaw instantanément avec notre
prompt. Le prompt utilisé est ci-dessous :

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Installation manuelle

## 1) Créer la VM

Depuis votre appareil :

```bash
ssh exe.dev new
```

Puis connectez-vous :

```bash
ssh <vm-name>.exe.xyz
```

Conseil : gardez cette VM **avec état**. OpenClaw stocke `openclaw.json`, les
`auth-profiles.json` par agent, les sessions et l’état canal/fournisseur sous
`~/.openclaw/`, ainsi que l’espace de travail sous `~/.openclaw/workspace/`.

## 2) Installer les prérequis (sur la VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Installer OpenClaw

Exécutez le script d’installation OpenClaw :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Configurer nginx pour proxifier OpenClaw vers le port 8000

Modifiez `/etc/nginx/sites-enabled/default` avec :

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Écrasez les en-têtes de transfert au lieu de préserver les chaînes fournies par le client.
OpenClaw ne fait confiance aux métadonnées IP transférées qu’à partir de proxys explicitement configurés,
et les chaînes `X-Forwarded-For` de style append sont considérées comme un risque de renforcement.

## 5) Accéder à OpenClaw et accorder les privilèges

Accédez à `https://<vm-name>.exe.xyz/` (voir la sortie Control UI de l’onboarding). Si une invite d’authentification s’affiche, collez le
secret partagé configuré depuis la VM. Ce guide utilise l’authentification par jeton, donc récupérez `gateway.auth.token`
avec `openclaw config get gateway.auth.token` (ou générez-en un avec `openclaw doctor --generate-gateway-token`).
Si vous avez basculé la gateway en authentification par mot de passe, utilisez plutôt `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Approuvez les appareils avec `openclaw devices list` et `openclaw devices approve <requestId>`. En cas de doute, utilisez Shelley depuis votre navigateur !

## Accès distant

L’accès distant est géré par l’authentification de [exe.dev](https://exe.dev). Par
défaut, le trafic HTTP du port 8000 est transféré vers `https://<vm-name>.exe.xyz`
avec une authentification par e-mail.

## Mise à jour

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Guide : [Mise à jour](/install/updating)
