---
read_when:
    - Vous voulez des sandboxes gérées dans le cloud au lieu de Docker local
    - Vous configurez le Plugin OpenShell
    - Vous devez choisir entre les modes d’espace de travail mirror et remote
summary: Utiliser OpenShell comme backend sandbox géré pour les agents OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T13:59:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell est un backend sandbox géré pour OpenClaw. Au lieu d’exécuter des
conteneurs Docker localement, OpenClaw délègue le cycle de vie de la sandbox à la CLI `openshell`,
qui provisionne des environnements distants avec une exécution de commandes basée sur SSH.

Le Plugin OpenShell réutilise le même transport SSH central et le même pont de système de fichiers distant
que le [backend SSH](/fr/gateway/sandboxing#ssh-backend) générique. Il ajoute un cycle de vie spécifique à OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`)
et un mode d’espace de travail `mirror` facultatif.

## Prérequis

- La CLI `openshell` installée et disponible dans `PATH` (ou définissez un chemin personnalisé via
  `plugins.entries.openshell.config.command`)
- Un compte OpenShell avec accès sandbox
- OpenClaw Gateway en cours d’exécution sur l’hôte

## Démarrage rapide

1. Activez le plugin et définissez le backend sandbox :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Redémarrez le Gateway. Au prochain tour de l’agent, OpenClaw crée une
   sandbox OpenShell et y route l’exécution des outils.

3. Vérifiez :

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modes d’espace de travail

C’est la décision la plus importante lors de l’utilisation d’OpenShell.

### `mirror`

Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que **l’espace de travail local
reste canonique**.

Comportement :

- Avant `exec`, OpenClaw synchronise l’espace de travail local dans la sandbox OpenShell.
- Après `exec`, OpenClaw resynchronise l’espace de travail distant vers l’espace de travail local.
- Les outils de fichiers fonctionnent toujours via le pont sandbox, mais l’espace de travail local
  reste la source de vérité entre les tours.

Idéal pour :

- Vous modifiez des fichiers localement en dehors d’OpenClaw et vous voulez que ces changements soient visibles dans la
  sandbox automatiquement.
- Vous voulez que la sandbox OpenShell se comporte autant que possible comme le backend Docker.
- Vous voulez que l’espace de travail hôte reflète les écritures de la sandbox après chaque tour `exec`.

Compromis : coût de synchronisation supplémentaire avant et après chaque `exec`.

### `remote`

Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que **l’espace de travail OpenShell
devienne canonique**.

Comportement :

- Lors de la première création de la sandbox, OpenClaw initialise l’espace de travail distant à partir
  de l’espace de travail local une seule fois.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent
  directement sur l’espace de travail distant OpenShell.
- OpenClaw **ne** resynchronise **pas** les changements distants vers l’espace de travail local.
- Les lectures de médias au moment du prompt continuent de fonctionner car les outils de fichiers et de médias lisent via
  le pont sandbox.

Idéal pour :

- La sandbox doit vivre principalement côté distant.
- Vous voulez un surcoût de synchronisation plus faible par tour.
- Vous ne voulez pas que des modifications locales sur l’hôte écrasent silencieusement l’état de la sandbox distante.

Important : si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’initialisation initiale,
la sandbox distante **ne** voit **pas** ces changements. Utilisez
`openclaw sandbox recreate` pour réinitialiser l’initialisation.

### Choisir un mode

|                          | `mirror`                         | `remote`                  |
| ------------------------ | -------------------------------- | ------------------------- |
| **Espace de travail canonique** | Hôte local                       | OpenShell distant         |
| **Sens de synchronisation**     | Bidirectionnel (chaque `exec`)   | Initialisation unique     |
| **Surcoût par tour**            | Plus élevé (envoi + téléchargement) | Plus faible (opérations distantes directes) |
| **Modifications locales visibles ?** | Oui, au prochain `exec`       | Non, jusqu’à `recreate`   |
| **Idéal pour**                  | Workflows de développement       | Agents de longue durée, CI |

## Référence de configuration

Toute la configuration OpenShell se trouve sous `plugins.entries.openshell.config` :

| Clé                       | Type                     | Valeur par défaut | Description                                           |
| ------------------------- | ------------------------ | ----------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`        | Mode de synchronisation de l’espace de travail        |
| `command`                 | `string`                 | `"openshell"`     | Chemin ou nom de la CLI `openshell`                   |
| `from`                    | `string`                 | `"openclaw"`      | Source de la sandbox pour la première création        |
| `gateway`                 | `string`                 | —                 | Nom du Gateway OpenShell (`--gateway`)                |
| `gatewayEndpoint`         | `string`                 | —                 | URL du point de terminaison Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —                 | ID de policy OpenShell pour la création de la sandbox |
| `providers`               | `string[]`               | `[]`              | Noms des providers à attacher lors de la création de la sandbox |
| `gpu`                     | `boolean`                | `false`           | Demander des ressources GPU                           |
| `autoProviders`           | `boolean`                | `true`            | Passer `--auto-providers` pendant `sandbox create`    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`      | Espace de travail principal en écriture dans la sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`        | Chemin de montage de l’espace de travail de l’agent (pour l’accès en lecture seule) |
| `timeoutSeconds`          | `number`                 | `120`             | Délai maximal pour les opérations CLI `openshell`     |

Les paramètres au niveau sandbox (`mode`, `scope`, `workspaceAccess`) sont configurés sous
`agents.defaults.sandbox` comme pour n’importe quel backend. Voir
[Sandboxing](/fr/gateway/sandboxing) pour la matrice complète.

## Exemples

### Configuration distante minimale

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Mode mirror avec GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell par agent avec Gateway personnalisé

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Gestion du cycle de vie

Les sandboxes OpenShell sont gérées via la CLI sandbox normale :

```bash
# Lister tous les runtimes sandbox (Docker + OpenShell)
openclaw sandbox list

# Inspecter la policy effective
openclaw sandbox explain

# Recréer (supprime l’espace de travail distant, réinitialise à la prochaine utilisation)
openclaw sandbox recreate --all
```

Pour le mode `remote`, **recreate est particulièrement important** : il supprime l’espace de travail distant
canonique pour cette portée. L’utilisation suivante initialise un nouvel espace de travail distant à partir
de l’espace de travail local.

Pour le mode `mirror`, recreate réinitialise surtout l’environnement d’exécution distant car
l’espace de travail local reste canonique.

### Quand recréer

Recréez après avoir modifié l’un des éléments suivants :

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Renforcement de sécurité

OpenShell épingle le fd racine de l’espace de travail et revérifie l’identité de la sandbox avant chaque
lecture, afin qu’un échange de symlink ou un remontage de l’espace de travail ne puisse pas rediriger les lectures hors de
l’espace de travail distant prévu.

## Limites actuelles

- Le navigateur sandbox n’est pas pris en charge sur le backend OpenShell.
- `sandbox.docker.binds` ne s’applique pas à OpenShell.
- Les réglages runtime spécifiques à Docker sous `sandbox.docker.*` s’appliquent uniquement au backend
  Docker.

## Fonctionnement

1. OpenClaw appelle `openshell sandbox create` (avec les drapeaux `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` selon la configuration).
2. OpenClaw appelle `openshell sandbox ssh-config <name>` pour obtenir les détails de connexion SSH
   de la sandbox.
3. Le cœur écrit la configuration SSH dans un fichier temporaire et ouvre une session SSH en utilisant le
   même pont de système de fichiers distant que le backend SSH générique.
4. En mode `mirror` : synchroniser du local vers le distant avant `exec`, exécuter, resynchroniser après `exec`.
5. En mode `remote` : initialiser une fois à la création, puis opérer directement sur l’espace de travail
   distant.

## Voir aussi

- [Sandboxing](/fr/gateway/sandboxing) -- modes, portées et comparaison des backends
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- déboguer les outils bloqués
- [Multi-Agent Sandbox and Tools](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent
- [Sandbox CLI](/fr/cli/sandbox) -- commandes `openclaw sandbox`
