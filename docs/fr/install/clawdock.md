---
read_when:
    - Vous exécutez souvent OpenClaw avec Docker et souhaitez des commandes quotidiennes plus courtes
    - Vous souhaitez une couche d’assistance pour le tableau de bord, les journaux, la configuration de jeton et les flux de jumelage
summary: Assistants shell ClawDock pour les installations OpenClaw basées sur Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T07:15:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock est une petite couche d’assistants shell pour les installations OpenClaw basées sur Docker.

Elle vous fournit des commandes courtes comme `clawdock-start`, `clawdock-dashboard` et `clawdock-fix-token` au lieu d’invocations plus longues de type `docker compose ...`.

Si vous n’avez pas encore configuré Docker, commencez par [Docker](/fr/install/docker).

## Installation

Utilisez le chemin d’assistant canonique :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous aviez précédemment installé ClawDock depuis `scripts/shell-helpers/clawdock-helpers.sh`, réinstallez depuis le nouveau chemin `scripts/clawdock/clawdock-helpers.sh`. L’ancien chemin raw GitHub a été supprimé.

## Ce que vous obtenez

### Opérations de base

| Commande           | Description                     |
| ------------------ | ------------------------------- |
| `clawdock-start`   | Démarrer le gateway             |
| `clawdock-stop`    | Arrêter le gateway              |
| `clawdock-restart` | Redémarrer le gateway           |
| `clawdock-status`  | Vérifier l’état du conteneur    |
| `clawdock-logs`    | Suivre les journaux du gateway  |

### Accès au conteneur

| Commande                  | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `clawdock-shell`          | Ouvrir un shell dans le conteneur gateway       |
| `clawdock-cli <command>`  | Exécuter des commandes CLI OpenClaw dans Docker |
| `clawdock-exec <command>` | Exécuter une commande arbitraire dans le conteneur |

### Interface web et jumelage

| Commande                | Description                         |
| ----------------------- | ----------------------------------- |
| `clawdock-dashboard`    | Ouvrir l’URL de l’interface de contrôle |
| `clawdock-devices`      | Lister les jumelages d’appareils en attente |
| `clawdock-approve <id>` | Approuver une demande de jumelage   |

### Configuration et maintenance

| Commande             | Description                                        |
| -------------------- | -------------------------------------------------- |
| `clawdock-fix-token` | Configurer le jeton gateway à l’intérieur du conteneur |
| `clawdock-update`    | Récupérer, reconstruire et redémarrer              |
| `clawdock-rebuild`   | Reconstruire uniquement l’image Docker             |
| `clawdock-clean`     | Supprimer les conteneurs et les volumes            |

### Utilitaires

| Commande               | Description                                  |
| ---------------------- | -------------------------------------------- |
| `clawdock-health`      | Exécuter un contrôle de santé du gateway     |
| `clawdock-token`       | Afficher le jeton du gateway                 |
| `clawdock-cd`          | Aller au répertoire du projet OpenClaw       |
| `clawdock-config`      | Ouvrir `~/.openclaw`                         |
| `clawdock-show-config` | Afficher les fichiers de configuration avec valeurs masquées |
| `clawdock-workspace`   | Ouvrir le répertoire de l’espace de travail  |

## Flux de première utilisation

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Si le navigateur indique qu’un jumelage est requis :

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuration et secrets

ClawDock fonctionne avec la même séparation de configuration Docker que celle décrite dans [Docker](/fr/install/docker) :

- `<project>/.env` pour les valeurs spécifiques à Docker comme le nom d’image, les ports et le jeton du gateway
- `~/.openclaw/.env` pour les clés de fournisseur et jetons de bot adossés à l’environnement
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` pour l’authentification OAuth/clé API des fournisseurs stockée
- `~/.openclaw/openclaw.json` pour la configuration du comportement

Utilisez `clawdock-show-config` lorsque vous souhaitez inspecter rapidement les fichiers `.env` et `openclaw.json`. Il masque les valeurs `.env` dans sa sortie affichée.

## Pages associées

- [Docker](/fr/install/docker)
- [Docker VM Runtime](/fr/install/docker-vm-runtime)
- [Updating](/fr/install/updating)
