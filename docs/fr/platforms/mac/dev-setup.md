---
read_when:
    - Configurer l’environnement de développement macOS
summary: Guide de configuration pour les développeurs travaillant sur l’app macOS OpenClaw
title: Configuration de développement macOS
x-i18n:
    generated_at: "2026-04-24T07:20:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Configuration de développement macOS

Ce guide couvre les étapes nécessaires pour construire et exécuter l’application macOS OpenClaw depuis les sources.

## Prérequis

Avant de construire l’app, assurez-vous d’avoir installé les éléments suivants :

1. **Xcode 26.2+** : requis pour le développement Swift.
2. **Node.js 24 & pnpm** : recommandés pour le gateway, la CLI et les scripts de packaging. Node 22 LTS, actuellement `22.14+`, reste pris en charge pour compatibilité.

## 1. Installer les dépendances

Installez les dépendances à l’échelle du projet :

```bash
pnpm install
```

## 2. Construire et packager l’app

Pour construire l’app macOS et la packager dans `dist/OpenClaw.app`, exécutez :

```bash
./scripts/package-mac-app.sh
```

Si vous n’avez pas de certificat Apple Developer ID, le script utilisera automatiquement une **signature ad hoc** (`-`).

Pour les modes d’exécution dev, les options de signature et le dépannage du Team ID, voir le README de l’app macOS :
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Remarque** : les apps signées ad hoc peuvent déclencher des invites de sécurité. Si l’app plante immédiatement avec « Abort trap 6 », voir la section [Dépannage](#dépannage).

## 3. Installer la CLI

L’app macOS attend une installation globale de la CLI `openclaw` pour gérer les tâches en arrière-plan.

**Pour l’installer (recommandé) :**

1. Ouvrez l’app OpenClaw.
2. Allez dans l’onglet de paramètres **General**.
3. Cliquez sur **"Install CLI"**.

Sinon, installez-la manuellement :

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` et `bun add -g openclaw@<version>` fonctionnent aussi.
Pour le runtime Gateway, Node reste le chemin recommandé.

## Dépannage

### Échec de build : incompatibilité de toolchain ou de SDK

Le build de l’app macOS attend le SDK macOS le plus récent et la toolchain Swift 6.2.

**Dépendances système (requises) :**

- **La version la plus récente de macOS disponible dans Software Update** (requise par les SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Vérifications :**

```bash
xcodebuild -version
xcrun swift --version
```

Si les versions ne correspondent pas, mettez macOS/Xcode à jour puis relancez le build.

### L’app plante lors de l’octroi d’une permission

Si l’app plante lorsque vous essayez d’autoriser l’accès à **Speech Recognition** ou au **Microphone**, cela peut venir d’un cache TCC corrompu ou d’une incompatibilité de signature.

**Correction :**

1. Réinitialisez les permissions TCC :

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si cela ne suffit pas, changez temporairement le `BUNDLE_ID` dans [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) pour forcer un « état vierge » côté macOS.

### Gateway bloqué sur « Starting... » indéfiniment

Si l’état du gateway reste sur « Starting... », vérifiez si un processus zombie tient le port :

```bash
openclaw gateway status
openclaw gateway stop

# Si vous n’utilisez pas de LaunchAgent (mode dev / exécutions manuelles), trouvez le listener :
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si une exécution manuelle tient le port, arrêtez ce processus (Ctrl+C). En dernier recours, tuez le PID trouvé ci-dessus.

## Articles connexes

- [App macOS](/fr/platforms/macos)
- [Vue d’ensemble de l’installation](/fr/install)
