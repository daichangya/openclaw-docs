---
read_when:
    - Vous voulez des sandboxes gérées dans le cloud au lieu de Docker en local
    - Vous configurez le plugin OpenShell
    - Vous devez choisir entre les modes mirror et remote pour le workspace
summary: Utiliser OpenShell comme backend de sandbox géré pour les agents OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-05T12:42:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaf9027d0632a70fb86455f8bc46dc908ff766db0eb0cdf2f7df39c715241ead
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell est un backend de sandbox géré pour OpenClaw. Au lieu d’exécuter des conteneurs Docker
localement, OpenClaw délègue le cycle de vie de la sandbox à la CLI `openshell`,
qui provisionne des environnements distants avec exécution de commandes basée sur SSH.

Le plugin OpenShell réutilise le même transport SSH cœur et le même pont de système de fichiers distant
que le [backend SSH](/gateway/sandboxing#ssh-backend) générique. Il ajoute
le cycle de vie spécifique à OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
et un mode de workspace `mirror` facultatif.

## Prérequis

- La CLI `openshell` installée et présente dans le `PATH` (ou définir un chemin personnalisé via
  `plugins.entries.openshell.config.command`)
- Un compte OpenShell avec accès aux sandboxes
- La Gateway OpenClaw en cours d’exécution sur l’hôte

## Démarrage rapide

1. Activez le plugin et définissez le backend de sandbox :

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

2. Redémarrez la Gateway. Au prochain tour d’agent, OpenClaw crée une sandbox OpenShell
   et y route l’exécution des outils.

3. Vérifiez :

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modes de workspace

C’est la décision la plus importante lorsque vous utilisez OpenShell.

### `mirror`

Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que le **workspace local
reste canonique**.

Comportement :

- Avant `exec`, OpenClaw synchronise le workspace local dans la sandbox OpenShell.
- Après `exec`, OpenClaw resynchronise le workspace distant vers le workspace local.
- Les outils de fichiers continuent d’opérer via le pont sandbox, mais le workspace local
  reste la source de vérité entre les tours.

Meilleur choix pour :

- Vous modifiez des fichiers localement en dehors d’OpenClaw et voulez que ces changements soient visibles dans la
  sandbox automatiquement.
- Vous voulez que la sandbox OpenShell se comporte autant que possible comme le backend Docker.
- Vous voulez que le workspace hôte reflète les écritures de la sandbox après chaque tour `exec`.

Compromis : coût de synchronisation supplémentaire avant et après chaque `exec`.

### `remote`

Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que le
**workspace OpenShell devienne canonique**.

Comportement :

- Lors de la première création de la sandbox, OpenClaw initialise une seule fois le workspace distant à partir
  du workspace local.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent
  directement sur le workspace OpenShell distant.
- OpenClaw ne synchronise **pas** les changements distants vers le workspace local.
- Les lectures de médias au moment du prompt continuent de fonctionner parce que les outils fichiers et médias lisent via
  le pont sandbox.

Meilleur choix pour :

- La sandbox doit vivre principalement côté distant.
- Vous voulez réduire la surcharge de synchronisation à chaque tour.
- Vous ne voulez pas que des modifications locales sur l’hôte écrasent silencieusement l’état distant de la sandbox.

Important : si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’initialisation,
la sandbox distante ne voit **pas** ces changements. Utilisez
`openclaw sandbox recreate` pour réinitialiser et réensemencer.

### Choisir un mode

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Workspace canonique**  | Hôte local                 | OpenShell distant         |
| **Direction de sync**    | Bidirectionnelle (chaque exec) | Initialisation unique |
| **Surcharge par tour**   | Plus élevée (upload + download) | Plus faible (opérations distantes directes) |
| **Modifications locales visibles ?** | Oui, au prochain exec | Non, jusqu’à recreate |
| **Meilleur pour**        | Workflows de développement | Agents longue durée, CI   |

## Référence de configuration

Toute la configuration OpenShell se trouve sous `plugins.entries.openshell.config` :

| Clé                       | Type                     | Par défaut     | Description                                           |
| ------------------------- | ------------------------ | -------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`     | Mode de synchronisation du workspace                  |
| `command`                 | `string`                 | `"openshell"`  | Chemin ou nom de la CLI `openshell`                   |
| `from`                    | `string`                 | `"openclaw"`   | Source sandbox pour la première création              |
| `gateway`                 | `string`                 | —              | Nom de gateway OpenShell (`--gateway`)                |
| `gatewayEndpoint`         | `string`                 | —              | URL du point de terminaison gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —              | ID de politique OpenShell pour la création de sandbox |
| `providers`               | `string[]`               | `[]`           | Noms des fournisseurs à attacher lors de la création de la sandbox |
| `gpu`                     | `boolean`                | `false`        | Demander des ressources GPU                           |
| `autoProviders`           | `boolean`                | `true`         | Passer `--auto-providers` pendant `sandbox create`    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`   | Workspace principal en écriture dans la sandbox       |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`     | Chemin de montage du workspace agent (pour accès en lecture seule) |
| `timeoutSeconds`          | `number`                 | `120`          | Timeout pour les opérations CLI `openshell`           |

Les paramètres au niveau sandbox (`mode`, `scope`, `workspaceAccess`) sont configurés sous
`agents.defaults.sandbox` comme pour n’importe quel backend. Voir
[Sandboxing](/gateway/sandboxing) pour la matrice complète.

## Exemples

### Configuration minimale en mode remote

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

### OpenShell par agent avec gateway personnalisée

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
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Pour le mode `remote`, **recreate est particulièrement important** : il supprime le workspace distant canonique
pour cette portée. L’utilisation suivante initialise un nouveau workspace distant à partir
du workspace local.

Pour le mode `mirror`, recreate réinitialise surtout l’environnement d’exécution distant car
le workspace local reste canonique.

### Quand recréer

Recréez après avoir modifié l’un de ces paramètres :

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Limites actuelles

- Le navigateur sandbox n’est pas pris en charge sur le backend OpenShell.
- `sandbox.docker.binds` ne s’applique pas à OpenShell.
- Les réglages runtime spécifiques à Docker sous `sandbox.docker.*` s’appliquent uniquement au backend Docker.

## Fonctionnement

1. OpenClaw appelle `openshell sandbox create` (avec les flags `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` selon la configuration).
2. OpenClaw appelle `openshell sandbox ssh-config <name>` pour obtenir les détails de connexion SSH
   de la sandbox.
3. Le cœur écrit la configuration SSH dans un fichier temporaire et ouvre une session SSH en utilisant le
   même pont de système de fichiers distant que le backend SSH générique.
4. En mode `mirror` : synchronise du local vers le distant avant exec, exécute, resynchronise après exec.
5. En mode `remote` : initialise une fois à la création, puis opère directement sur le
   workspace distant.

## Voir aussi

- [Sandboxing](/gateway/sandboxing) -- modes, portées et comparaison des backends
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- déboguer les outils bloqués
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- surcharges par agent
- [Sandbox CLI](/cli/sandbox) -- commandes `openclaw sandbox`
