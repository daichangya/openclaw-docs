---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gérer les runtimes de sandbox et inspecter la politique de sandbox effective
title: CLI Sandbox
x-i18n:
    generated_at: "2026-04-05T12:38:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# CLI Sandbox

Gérez les runtimes de sandbox pour l’exécution isolée des agents.

## Vue d’ensemble

OpenClaw peut exécuter des agents dans des runtimes de sandbox isolés pour des raisons de sécurité. Les commandes `sandbox` vous aident à inspecter et recréer ces runtimes après des mises à jour ou des changements de configuration.

Aujourd’hui, cela signifie généralement :

- Conteneurs de sandbox Docker
- Runtimes de sandbox SSH lorsque `agents.defaults.sandbox.backend = "ssh"`
- Runtimes de sandbox OpenShell lorsque `agents.defaults.sandbox.backend = "openshell"`

Pour `ssh` et OpenShell `remote`, la recréation est plus importante qu’avec Docker :

- l’espace de travail distant est canonique après l’amorçage initial
- `openclaw sandbox recreate` supprime cet espace de travail distant canonique pour la portée sélectionnée
- l’utilisation suivante l’amorce à nouveau depuis l’espace de travail local actuel

## Commandes

### `openclaw sandbox explain`

Inspecter le mode/la portée/l’accès à l’espace de travail de sandbox **effectif**, la politique des outils de sandbox et les garde-fous d’élévation (avec les chemins de clés de configuration de correction).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Lister tous les runtimes de sandbox avec leur statut et leur configuration.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Lister uniquement les conteneurs de navigateur
openclaw sandbox list --json     # Sortie JSON
```

**La sortie inclut :**

- Nom et statut du runtime
- Backend (`docker`, `openshell`, etc.)
- Libellé de configuration et indication de correspondance avec la configuration actuelle
- Âge (temps depuis la création)
- Temps d’inactivité (temps depuis la dernière utilisation)
- Session/agent associé

### `openclaw sandbox recreate`

Supprimer les runtimes de sandbox pour forcer leur recréation avec la configuration mise à jour.

```bash
openclaw sandbox recreate --all                # Recréer tous les conteneurs
openclaw sandbox recreate --session main       # Session spécifique
openclaw sandbox recreate --agent mybot        # Agent spécifique
openclaw sandbox recreate --browser            # Uniquement les conteneurs de navigateur
openclaw sandbox recreate --all --force        # Ignorer la confirmation
```

**Options :**

- `--all` : recréer tous les conteneurs de sandbox
- `--session <key>` : recréer le conteneur pour une session spécifique
- `--agent <id>` : recréer les conteneurs pour un agent spécifique
- `--browser` : recréer uniquement les conteneurs de navigateur
- `--force` : ignorer l’invite de confirmation

**Important :** Les runtimes sont recréés automatiquement lors de la prochaine utilisation de l’agent.

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

### Après la modification de la configuration de sandbox

```bash
# Modifier la configuration : agents.defaults.sandbox.* (ou agents.list[].sandbox.*)

# Recréer pour appliquer la nouvelle configuration
openclaw sandbox recreate --all
```

### Après la modification de la cible SSH ou du matériel d’authentification SSH

```bash
# Modifier la configuration :
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Pour le backend `ssh` principal, la recréation supprime la racine d’espace de travail distante par portée
sur la cible SSH. L’exécution suivante l’amorce à nouveau depuis l’espace de travail local.

### Après la modification de la source, de la politique ou du mode OpenShell

```bash
# Modifier la configuration :
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Pour le mode OpenShell `remote`, la recréation supprime l’espace de travail distant canonique
pour cette portée. L’exécution suivante l’amorce à nouveau depuis l’espace de travail local.

### Après la modification de setupCommand

```bash
openclaw sandbox recreate --all
# ou un seul agent :
openclaw sandbox recreate --agent family
```

### Pour un agent spécifique uniquement

```bash
# Mettre à jour uniquement les conteneurs d’un agent
openclaw sandbox recreate --agent alfred
```

## Pourquoi est-ce nécessaire ?

**Problème :** Lorsque vous mettez à jour la configuration du sandbox :

- Les runtimes existants continuent de fonctionner avec les anciens paramètres
- Les runtimes ne sont purgés qu’après 24 h d’inactivité
- Les agents utilisés régulièrement conservent indéfiniment les anciens runtimes actifs

**Solution :** Utilisez `openclaw sandbox recreate` pour forcer la suppression des anciens runtimes. Ils seront recréés automatiquement avec les paramètres actuels lors du prochain besoin.

Astuce : préférez `openclaw sandbox recreate` à un nettoyage manuel spécifique au backend.
Cette commande utilise le registre de runtimes de Gateway et évite les incohérences lorsque les clés de portée/session changent.

## Configuration

Les paramètres de sandbox se trouvent dans `~/.openclaw/openclaw.json` sous `agents.defaults.sandbox` (les remplacements par agent vont dans `agents.list[].sandbox`) :

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
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Voir aussi

- [Documentation Sandbox](/gateway/sandboxing)
- [Configuration des agents](/concepts/agent-workspace)
- [Commande Doctor](/gateway/doctor) - Vérifier la configuration du sandbox
