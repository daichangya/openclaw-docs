---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gérer les runtimes de sandbox et inspecter la politique de sandbox effective
title: CLI Sandbox
x-i18n:
    generated_at: "2026-04-24T07:05:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

Gérer les runtimes de sandbox pour l’exécution isolée des agents.

## Vue d’ensemble

OpenClaw peut exécuter des agents dans des runtimes de sandbox isolés pour des raisons de sécurité. Les commandes `sandbox` vous aident à inspecter et recréer ces runtimes après des mises à jour ou des changements de configuration.

Aujourd’hui, cela signifie généralement :

- des conteneurs de sandbox Docker
- des runtimes de sandbox SSH lorsque `agents.defaults.sandbox.backend = "ssh"`
- des runtimes de sandbox OpenShell lorsque `agents.defaults.sandbox.backend = "openshell"`

Pour `ssh` et OpenShell `remote`, la recréation est plus importante qu’avec Docker :

- l’espace de travail distant est canonique après l’amorçage initial
- `openclaw sandbox recreate` supprime cet espace de travail distant canonique pour le périmètre sélectionné
- l’utilisation suivante le réamorce depuis l’espace de travail local actuel

## Commandes

### `openclaw sandbox explain`

Inspectez le mode/périmètre/accès à l’espace de travail effectif du sandbox, la politique d’outils du sandbox et les contrôles Elevated (avec les chemins de clé de configuration correctifs).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Listez tous les runtimes de sandbox avec leur état et leur configuration.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Lister uniquement les conteneurs de navigateur
openclaw sandbox list --json     # Sortie JSON
```

**La sortie inclut :**

- nom et état du runtime
- backend (`docker`, `openshell`, etc.)
- libellé de configuration et indication de correspondance avec la configuration actuelle
- ancienneté (temps écoulé depuis la création)
- temps d’inactivité (temps écoulé depuis la dernière utilisation)
- session/agent associé

### `openclaw sandbox recreate`

Supprimez les runtimes de sandbox pour forcer leur recréation avec une configuration mise à jour.

```bash
openclaw sandbox recreate --all                # Recréer tous les conteneurs
openclaw sandbox recreate --session main       # Session spécifique
openclaw sandbox recreate --agent mybot        # Agent spécifique
openclaw sandbox recreate --browser            # Seulement les conteneurs de navigateur
openclaw sandbox recreate --all --force        # Ignorer la confirmation
```

**Options :**

- `--all` : recréer tous les conteneurs de sandbox
- `--session <key>` : recréer le conteneur pour une session spécifique
- `--agent <id>` : recréer les conteneurs pour un agent spécifique
- `--browser` : recréer uniquement les conteneurs de navigateur
- `--force` : ignorer l’invite de confirmation

**Important :** Les runtimes sont automatiquement recréés lors de la prochaine utilisation de l’agent.

## Cas d’usage

### Après la mise à jour d’une image Docker

```bash
# Récupérer la nouvelle image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Mettre à jour la configuration pour utiliser la nouvelle image
# Modifier la configuration : agents.defaults.sandbox.docker.image (ou agents.list[].sandbox.docker.image)

# Recréer les conteneurs
openclaw sandbox recreate --all
```

### Après un changement de configuration du sandbox

```bash
# Modifier la configuration : agents.defaults.sandbox.* (ou agents.list[].sandbox.*)

# Recréer pour appliquer la nouvelle configuration
openclaw sandbox recreate --all
```

### Après un changement de cible SSH ou de matériel d’authentification SSH

```bash
# Modifier la configuration :
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Pour le backend `ssh` principal, la recréation supprime la racine d’espace de travail distant par périmètre
sur la cible SSH. L’exécution suivante le réamorce depuis l’espace de travail local.

### Après un changement de source, de politique ou de mode OpenShell

```bash
# Modifier la configuration :
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Pour le mode OpenShell `remote`, la recréation supprime l’espace de travail distant canonique
pour ce périmètre. L’exécution suivante le réamorce depuis l’espace de travail local.

### Après un changement de setupCommand

```bash
openclaw sandbox recreate --all
# ou seulement pour un agent :
openclaw sandbox recreate --agent family
```

### Pour un agent spécifique uniquement

```bash
# Mettre à jour uniquement les conteneurs d’un agent
openclaw sandbox recreate --agent alfred
```

## Pourquoi est-ce nécessaire ?

**Problème :** Lorsque vous mettez à jour la configuration du sandbox :

- les runtimes existants continuent de fonctionner avec les anciens paramètres
- les runtimes ne sont supprimés qu’après 24 h d’inactivité
- les agents régulièrement utilisés conservent indéfiniment les anciens runtimes

**Solution :** Utilisez `openclaw sandbox recreate` pour forcer la suppression des anciens runtimes. Ils seront recréés automatiquement avec les paramètres actuels lorsqu’ils seront de nouveau nécessaires.

Astuce : préférez `openclaw sandbox recreate` à un nettoyage manuel propre à un backend.
Cette commande utilise le registre de runtimes du Gateway et évite les incohérences lorsque les clés de périmètre/session changent.

## Configuration

Les paramètres de sandbox se trouvent dans `~/.openclaw/openclaw.json` sous `agents.defaults.sandbox` (les remplacements par agent se trouvent dans `agents.list[].sandbox`) :

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... autres options Docker
        },
        "prune": {
          "idleHours": 24, // Suppression automatique après 24 h d’inactivité
          "maxAgeDays": 7, // Suppression automatique après 7 jours
        },
      },
    },
  },
}
```

## Lié

- [Référence CLI](/fr/cli)
- [Sandboxing](/fr/gateway/sandboxing)
- [Espace de travail d’agent](/fr/concepts/agent-workspace)
- [Doctor](/fr/gateway/doctor) — vérifie la configuration du sandbox
