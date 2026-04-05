---
read_when:
    - Configuration de l’environnement de développement macOS
summary: Guide de configuration pour les développeurs travaillant sur l’application macOS OpenClaw
title: Configuration de développement macOS
x-i18n:
    generated_at: "2026-04-05T12:48:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd13f17391bdd87ef59e4c575e5da3312c4066de00905731263bff655a5db357
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Configuration de développement macOS

Ce guide couvre les étapes nécessaires pour construire et exécuter l’application macOS OpenClaw à partir des sources.

## Prérequis

Avant de construire l’application, assurez-vous d’avoir installé les éléments suivants :

1. **Xcode 26.2+** : requis pour le développement Swift.
2. **Node.js 24 & pnpm** : recommandés pour la passerelle, la CLI et les scripts de packaging. Node 22 LTS, actuellement `22.14+`, reste pris en charge pour la compatibilité.

## 1. Installer les dépendances

Installez les dépendances de tout le projet :

```bash
pnpm install
```

## 2. Construire et empaqueter l’application

Pour construire l’application macOS et la packager dans `dist/OpenClaw.app`, exécutez :

```bash
./scripts/package-mac-app.sh
```

Si vous n’avez pas de certificat Apple Developer ID, le script utilisera automatiquement une **signature ad hoc** (`-`).

Pour les modes d’exécution en développement, les indicateurs de signature et le dépannage du Team ID, consultez le README de l’application macOS :
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Remarque** : les applications signées ad hoc peuvent déclencher des invites de sécurité. Si l’application plante immédiatement avec « Abort trap 6 », consultez la section [Dépannage](#troubleshooting).

## 3. Installer la CLI

L’application macOS attend une installation globale de la CLI `openclaw` pour gérer les tâches en arrière-plan.

**Pour l’installer (recommandé) :**

1. Ouvrez l’application OpenClaw.
2. Accédez à l’onglet des paramètres **General**.
3. Cliquez sur **"Install CLI"**.

Vous pouvez aussi l’installer manuellement :

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` et `bun add -g openclaw@<version>` fonctionnent également.
Pour le runtime de la passerelle, Node reste la voie recommandée.

## Dépannage

### Échec de la construction : incompatibilité de toolchain ou de SDK

La construction de l’application macOS attend le dernier SDK macOS et la toolchain Swift 6.2.

**Dépendances système (requises) :**

- **Dernière version de macOS disponible dans Mise à jour logicielle** (requise par les SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Vérifications :**

```bash
xcodebuild -version
xcrun swift --version
```

Si les versions ne correspondent pas, mettez à jour macOS/Xcode puis relancez la construction.

### L’application plante lors de l’octroi d’une autorisation

Si l’application plante lorsque vous essayez d’autoriser l’accès à **Speech Recognition** ou au **Microphone**, cela peut être dû à un cache TCC corrompu ou à une incompatibilité de signature.

**Correction :**

1. Réinitialisez les autorisations TCC :

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si cela échoue, modifiez temporairement le `BUNDLE_ID` dans [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) pour forcer un « état propre » côté macOS.

### Passerelle bloquée sur « Starting... »

Si l’état de la passerelle reste sur « Starting... », vérifiez si un processus zombie retient le port :

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si une exécution manuelle retient le port, arrêtez ce processus (Ctrl+C). En dernier recours, tuez le PID trouvé ci-dessus.
