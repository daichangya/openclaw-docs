---
read_when:
    - Vous voulez des sandbox gérés dans le cloud plutôt que Docker local
    - Vous configurez le Plugin OpenShell
    - Vous devez choisir entre les modes d’espace de travail miroir et distant
summary: Utiliser OpenShell comme backend de sandbox géré pour les agents OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T07:11:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell est un backend de sandbox géré pour OpenClaw. Au lieu d’exécuter des conteneurs Docker
localement, OpenClaw délègue le cycle de vie du sandbox à la CLI `openshell`,
qui provisionne des environnements distants avec exécution de commandes basée sur SSH.

Le Plugin OpenShell réutilise le même transport SSH central et le même pont de système de fichiers distant
que le [backend SSH](/fr/gateway/sandboxing#ssh-backend) générique. Il ajoute un cycle de vie spécifique à OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
et un mode facultatif d’espace de travail `mirror`.

## Prérequis

- La CLI `openshell` installée et disponible dans le `PATH` (ou définir un chemin personnalisé via
  `plugins.entries.openshell.config.command`)
- Un compte OpenShell avec accès au sandbox
- La Gateway OpenClaw en cours d’exécution sur l’hôte

## Démarrage rapide

1. Activez le Plugin et définissez le backend de sandbox :

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

2. Redémarrez la Gateway. Au prochain tour d’agent, OpenClaw crée un sandbox OpenShell
   et y route l’exécution des outils.

3. Vérifiez :

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modes d’espace de travail

C’est la décision la plus importante lors de l’utilisation d’OpenShell.

### `mirror`

Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que l’**espace de travail local
reste canonique**.

Comportement :

- Avant `exec`, OpenClaw synchronise l’espace de travail local vers le sandbox OpenShell.
- Après `exec`, OpenClaw synchronise l’espace de travail distant vers l’espace de travail local.
- Les outils de fichier fonctionnent toujours via le pont sandbox, mais l’espace de travail local
  reste la source de vérité entre les tours.

Idéal pour :

- Vous modifiez des fichiers localement en dehors d’OpenClaw et vous voulez que ces changements soient visibles dans le
  sandbox automatiquement.
- Vous voulez que le sandbox OpenShell se comporte autant que possible comme le backend Docker.
- Vous voulez que l’espace de travail hôte reflète les écritures du sandbox après chaque tour d’exécution.

Compromis : coût de synchronisation supplémentaire avant et après chaque exécution.

### `remote`

Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que l’**espace de travail OpenShell devienne canonique**.

Comportement :

- Lorsque le sandbox est créé pour la première fois, OpenClaw initialise une seule fois l’espace de travail distant à partir
  de l’espace de travail local.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent
  directement sur l’espace de travail OpenShell distant.
- OpenClaw ne synchronise **pas** les changements distants vers l’espace de travail local.
- Les lectures de médias au moment du prompt fonctionnent toujours parce que les outils de fichier et de média lisent via
  le pont sandbox.

Idéal pour :

- Le sandbox doit vivre principalement côté distant.
- Vous voulez une surcharge de synchronisation plus faible par tour.
- Vous ne voulez pas que des modifications locales sur l’hôte écrasent silencieusement l’état distant du sandbox.

Important : si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’initialisation initiale,
le sandbox distant ne voit **pas** ces changements. Utilisez
`openclaw sandbox recreate` pour réinitialiser depuis la source.

### Choisir un mode

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Espace de travail canonique** | Hôte local           | OpenShell distant         |
| **Direction de synchronisation** | Bidirectionnelle (chaque exec) | Initialisation unique |
| **Surcharge par tour**   | Plus élevée (téléversement + téléchargement) | Plus faible (opérations distantes directes) |
| **Modifications locales visibles ?** | Oui, à l’exécution suivante | Non, jusqu’à recreate |
| **Idéal pour**           | Flux de travail de développement | Agents de longue durée, CI |

## Référence de configuration

Toute la configuration OpenShell se trouve sous `plugins.entries.openshell.config` :

| Clé                       | Type                     | Par défaut    | Description                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`    | Mode de synchronisation de l’espace de travail        |
| `command`                 | `string`                 | `"openshell"` | Chemin ou nom de la CLI `openshell`                   |
| `from`                    | `string`                 | `"openclaw"`  | Source du sandbox pour la première création           |
| `gateway`                 | `string`                 | —             | Nom de Gateway OpenShell (`--gateway`)                |
| `gatewayEndpoint`         | `string`                 | —             | URL du point de terminaison Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID de politique OpenShell pour la création de sandbox |
| `providers`               | `string[]`               | `[]`          | Noms de fournisseurs à attacher lors de la création du sandbox |
| `gpu`                     | `boolean`                | `false`       | Demander des ressources GPU                           |
| `autoProviders`           | `boolean`                | `true`        | Passer `--auto-providers` lors de `sandbox create`    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Espace de travail inscriptible principal dans le sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Chemin de montage de l’espace de travail de l’agent (pour accès en lecture seule) |
| `timeoutSeconds`          | `number`                 | `120`         | Délai d’expiration pour les opérations CLI `openshell` |

Les paramètres au niveau du sandbox (`mode`, `scope`, `workspaceAccess`) sont configurés sous
`agents.defaults.sandbox` comme pour tout backend. Voir
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

### Mode miroir avec GPU

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

### OpenShell par agent avec Gateway personnalisée

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

Les sandbox OpenShell sont gérés via la CLI sandbox normale :

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Pour le mode `remote`, **recreate est particulièrement important** : il supprime l’espace de travail distant
canonique pour ce périmètre. La prochaine utilisation initialise un nouvel espace de travail distant à partir
de l’espace de travail local.

Pour le mode `mirror`, recreate réinitialise surtout l’environnement d’exécution distant car
l’espace de travail local reste canonique.

### Quand utiliser recreate

Utilisez recreate après avoir modifié l’un de ces éléments :

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Renforcement de la sécurité

OpenShell épingle le descripteur de fichier racine de l’espace de travail et revérifie l’identité du sandbox avant chaque
lecture, de sorte que des échanges de symlink ou un remontage de l’espace de travail ne puissent pas rediriger les lectures hors de
l’espace de travail distant prévu.

## Limitations actuelles

- Le navigateur sandbox n’est pas pris en charge sur le backend OpenShell.
- `sandbox.docker.binds` ne s’applique pas à OpenShell.
- Les paramètres runtime spécifiques à Docker sous `sandbox.docker.*` s’appliquent uniquement au backend Docker.

## Fonctionnement

1. OpenClaw appelle `openshell sandbox create` (avec les indicateurs `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` selon la configuration).
2. OpenClaw appelle `openshell sandbox ssh-config <name>` pour obtenir les détails de connexion SSH
   du sandbox.
3. Le cœur écrit la configuration SSH dans un fichier temporaire et ouvre une session SSH en utilisant le
   même pont de système de fichiers distant que le backend SSH générique.
4. En mode `mirror` : synchronisation du local vers le distant avant l’exécution, exécution, synchronisation retour après l’exécution.
5. En mode `remote` : initialisation unique à la création, puis opérations directes sur l’espace de travail
   distant.

## Liens associés

- [Sandboxing](/fr/gateway/sandboxing) -- modes, périmètres et comparaison des backends
- [Sandbox vs politique d’outils vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- débogage des outils bloqués
- [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) -- redéfinitions par agent
- [CLI sandbox](/fr/cli/sandbox) -- commandes `openclaw sandbox`
