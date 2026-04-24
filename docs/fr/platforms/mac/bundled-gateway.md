---
read_when:
    - Packaging de OpenClaw.app
    - Déboguer le service launchd du gateway sur macOS
    - Installer la CLI gateway pour macOS
summary: Runtime du Gateway sur macOS (service launchd externe)
title: Gateway sur macOS
x-i18n:
    generated_at: "2026-04-24T07:20:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app n’intègre plus Node/Bun ni le runtime Gateway. L’app macOS
attend une installation **externe** de la CLI `openclaw`, ne lance pas le Gateway comme
processus enfant, et gère un service launchd par utilisateur pour maintenir le Gateway
en fonctionnement (ou se rattache à un Gateway local existant s’il en existe déjà un).

## Installer la CLI (requis pour le mode local)

Node 24 est le runtime par défaut sur Mac. Node 22 LTS, actuellement `22.14+`, fonctionne toujours pour compatibilité. Ensuite, installez `openclaw` globalement :

```bash
npm install -g openclaw@<version>
```

Le bouton **Install CLI** de l’app macOS exécute le même flux d’installation globale que celui
utilisé en interne par l’app : il préfère npm d’abord, puis pnpm, puis bun si c’est le seul
gestionnaire de packages détecté. Node reste le runtime Gateway recommandé.

## Launchd (Gateway comme LaunchAgent)

Label :

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; des anciens `com.openclaw.*` peuvent subsister)

Emplacement du plist (par utilisateur) :

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestionnaire :

- L’app macOS possède l’installation/la mise à jour du LaunchAgent en mode local.
- La CLI peut aussi l’installer : `openclaw gateway install`.

Comportement :

- « OpenClaw Active » active/désactive le LaunchAgent.
- Quitter l’app **n’arrête pas** le gateway (launchd le maintient en vie).
- Si un Gateway est déjà en cours d’exécution sur le port configuré, l’app s’y rattache
  au lieu d’en démarrer un nouveau.

Journalisation :

- stdout/err launchd : `/tmp/openclaw/openclaw-gateway.log`

## Compatibilité des versions

L’app macOS vérifie la version du gateway par rapport à sa propre version. Si elles sont
incompatibles, mettez à jour la CLI globale pour qu’elle corresponde à la version de l’app.

## Vérification smoke

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Puis :

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Articles connexes

- [App macOS](/fr/platforms/macos)
- [Guide d’exploitation du Gateway](/fr/gateway)
