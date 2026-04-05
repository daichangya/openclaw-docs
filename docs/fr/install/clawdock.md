---
read_when:
    - Vous exécutez souvent OpenClaw avec Docker et voulez des commandes quotidiennes plus courtes
    - Vous voulez une couche utilitaire pour le dashboard, les journaux, la configuration du jeton et les flux d’appairage
summary: Assistants shell ClawDock pour les installations OpenClaw basées sur Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-05T12:44:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDock est une petite couche d’assistants shell pour les installations OpenClaw basées sur Docker.

Elle vous donne des commandes courtes comme `clawdock-start`, `clawdock-dashboard` et `clawdock-fix-token` au lieu d’invocations plus longues de `docker compose ...`.

Si vous n’avez pas encore configuré Docker, commencez par [Docker](/install/docker).

## Installation

Utilisez le chemin utilitaire canonique :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous avez précédemment installé ClawDock depuis `scripts/shell-helpers/clawdock-helpers.sh`, réinstallez-le depuis le nouveau chemin `scripts/clawdock/clawdock-helpers.sh`. L’ancien chemin raw GitHub a été supprimé.

## Ce que vous obtenez

### Opérations de base

| Commande           | Description                    |
| ------------------ | ------------------------------ |
| `clawdock-start`   | Démarrer la gateway            |
| `clawdock-stop`    | Arrêter la gateway             |
| `clawdock-restart` | Redémarrer la gateway          |
| `clawdock-status`  | Vérifier l’état du conteneur   |
| `clawdock-logs`    | Suivre les journaux de la gateway |

### Accès au conteneur

| Commande                  | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `clawdock-shell`          | Ouvrir un shell dans le conteneur gateway        |
| `clawdock-cli <command>`  | Exécuter des commandes CLI OpenClaw dans Docker  |
| `clawdock-exec <command>` | Exécuter une commande arbitraire dans le conteneur |

### UI web et appairage

| Commande                | Description                          |
| ----------------------- | ------------------------------------ |
| `clawdock-dashboard`    | Ouvrir l’URL de l’UI de contrôle     |
| `clawdock-devices`      | Lister les appairages d’appareils en attente |
| `clawdock-approve <id>` | Approuver une demande d’appairage    |

### Configuration et maintenance

| Commande             | Description                                         |
| -------------------- | --------------------------------------------------- |
| `clawdock-fix-token` | Configurer le jeton gateway dans le conteneur       |
| `clawdock-update`    | Tirer, reconstruire et redémarrer                   |
| `clawdock-rebuild`   | Reconstruire uniquement l’image Docker              |
| `clawdock-clean`     | Supprimer les conteneurs et volumes                 |

### Utilitaires

| Commande               | Description                                  |
| ---------------------- | -------------------------------------------- |
| `clawdock-health`      | Exécuter une vérification de santé gateway   |
| `clawdock-token`       | Afficher le jeton gateway                    |
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

Si le navigateur indique qu’un appairage est requis :

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuration et secrets

ClawDock fonctionne avec la même séparation de configuration Docker décrite dans [Docker](/install/docker) :

- `<project>/.env` pour les valeurs spécifiques à Docker comme le nom d’image, les ports et le jeton gateway
- `~/.openclaw/.env` pour les clés de fournisseur et jetons de bot adossés à l’environnement
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` pour l’authentification OAuth/clé API des fournisseurs stockée
- `~/.openclaw/openclaw.json` pour la configuration de comportement

Utilisez `clawdock-show-config` lorsque vous voulez inspecter rapidement les fichiers `.env` et `openclaw.json`. Il masque les valeurs `.env` dans la sortie affichée.

## Pages associées

- [Docker](/install/docker)
- [Runtime VM Docker](/install/docker-vm-runtime)
- [Mise à jour](/install/updating)
