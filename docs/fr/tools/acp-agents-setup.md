---
read_when:
    - Installer ou configurer le harnais acpx pour Claude Code / Codex / Gemini CLI
    - Activer le pont MCP plugin-tools ou OpenClaw-tools
    - Configurer les modes d’autorisation ACP
summary: 'Configurer des agents ACP : configuration du harnais acpx, configuration des plugins, permissions'
title: Agents ACP — configuration
x-i18n:
    generated_at: "2026-04-24T07:34:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Pour la vue d’ensemble, le runbook opérateur et les concepts, voir [Agents ACP](/fr/tools/acp-agents).
Cette page couvre la configuration du harnais acpx, la configuration des plugins pour les ponts MCP, et
la configuration des autorisations.

## Prise en charge actuelle du harnais acpx

Alias actuels intégrés du harnais acpx :

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI : `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Lorsque OpenClaw utilise le backend acpx, préférez ces valeurs pour `agentId` sauf si votre configuration acpx définit des alias d’agent personnalisés.
Si votre installation locale de Cursor expose encore ACP sous `agent acp`, remplacez la commande de l’agent `cursor` dans votre configuration acpx au lieu de changer la valeur par défaut intégrée.

L’utilisation directe de la CLI acpx peut aussi cibler des adaptateurs arbitraires via `--agent <command>`, mais cette échappatoire brute est une fonctionnalité de la CLI acpx (pas le chemin normal `agentId` d’OpenClaw).

## Configuration requise

Base ACP core :

```json5
{
  acp: {
    enabled: true,
    // Facultatif. La valeur par défaut est true ; définissez false pour suspendre le dispatch ACP tout en gardant les contrôles /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuration de liaison de fil est spécifique à l’adaptateur de canal. Exemple pour Discord :

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si l’engendrement ACP lié à un fil ne fonctionne pas, vérifiez d’abord l’indicateur de fonctionnalité de l’adaptateur :

- Discord : `channels.discord.threadBindings.spawnAcpSessions=true`

Les liaisons à la conversation actuelle n’exigent pas la création de fil enfant. Elles exigent un contexte de conversation actif et un adaptateur de canal qui expose des liaisons de conversation ACP.

Voir [Référence de configuration](/fr/gateway/configuration-reference).

## Configuration du Plugin pour le backend acpx

Les nouvelles installations livrent le Plugin d’exécution `acpx` intégré activé par défaut, donc ACP
fonctionne généralement sans étape manuelle d’installation de Plugin.

Commencez par :

```text
/acp doctor
```

Si vous avez désactivé `acpx`, l’avez refusé via `plugins.allow` / `plugins.deny`, ou voulez
basculer vers un checkout local de développement, utilisez le chemin de Plugin explicite :

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installation dans un espace de travail local pendant le développement :

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Vérifiez ensuite la santé du backend :

```text
/acp doctor
```

### Configuration de la commande et de la version acpx

Par défaut, le Plugin `acpx` intégré utilise son binaire épinglé local au Plugin (`node_modules/.bin/acpx` à l’intérieur du paquet du Plugin). Au démarrage, le backend est enregistré comme non prêt et une tâche d’arrière-plan vérifie `acpx --version` ; si le binaire est absent ou ne correspond pas, elle exécute `npm install --omit=dev --no-save acpx@<pinned>` puis revérifie. Le gateway reste non bloquant pendant tout ce temps.

Remplacez la commande ou la version dans la configuration du Plugin :

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` accepte un chemin absolu, un chemin relatif (résolu depuis l’espace de travail OpenClaw), ou un nom de commande.
- `expectedVersion: "any"` désactive la correspondance stricte de version.
- Les chemins `command` personnalisés désactivent l’auto-installation locale au Plugin.

Voir [Plugins](/fr/tools/plugin).

### Installation automatique des dépendances

Lorsque vous installez OpenClaw globalement avec `npm install -g openclaw`, les
dépendances d’exécution acpx (binaires spécifiques à la plateforme) sont installées automatiquement
via un hook postinstall. Si l’installation automatique échoue, le gateway démarre quand même
normalement et signale la dépendance manquante via `openclaw acp doctor`.

### Pont MCP des outils de Plugin

Par défaut, les sessions ACPX **n’exposent pas** les outils enregistrés par les plugins OpenClaw au
harnais ACP.

Si vous voulez que des agents ACP comme Codex ou Claude Code puissent appeler des
outils de Plugin OpenClaw installés comme le rappel/stockage mémoire, activez le pont dédié :

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-plugin-tools` dans le bootstrap
  de session ACPX.
- Expose les outils de Plugin déjà enregistrés par les plugins OpenClaw installés et activés.
- Garde la fonctionnalité explicite et désactivée par défaut.

Remarques de sécurité et de confiance :

- Cela étend la surface d’outils du harnais ACP.
- Les agents ACP n’obtiennent accès qu’aux outils de Plugin déjà actifs dans le gateway.
- Traitez cela comme la même frontière de confiance que le fait de laisser ces plugins s’exécuter dans
  OpenClaw lui-même.
- Passez en revue les plugins installés avant d’activer cela.

Les `mcpServers` personnalisés fonctionnent toujours comme avant. Le pont intégré plugin-tools est une
commodité supplémentaire sur adhésion explicite, pas un remplacement de la configuration générique de serveur MCP.

### Pont MCP des outils OpenClaw

Par défaut, les sessions ACPX **n’exposent pas non plus** les outils intégrés OpenClaw via
MCP. Activez le pont séparé des outils core lorsqu’un agent ACP a besoin d’outils
intégrés sélectionnés comme `cron` :

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Ce que cela fait :

- Injecte un serveur MCP intégré nommé `openclaw-tools` dans le bootstrap
  de session ACPX.
- Expose des outils intégrés OpenClaw sélectionnés. Le serveur initial expose `cron`.
- Garde l’exposition des outils core explicite et désactivée par défaut.

### Configuration du délai d’expiration d’exécution

Le Plugin `acpx` intégré définit par défaut les tours d’exécution embarqués sur un délai
d’expiration de 120 secondes. Cela donne à des harnais plus lents comme Gemini CLI suffisamment de temps pour terminer le démarrage et l’initialisation ACP. Remplacez-le si votre hôte a besoin d’une limite d’exécution différente :

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Redémarrez le gateway après avoir changé cette valeur.

### Configuration de l’agent de probe de santé

Le Plugin `acpx` intégré sonde un harnais d’agent tout en déterminant si le backend
d’exécution embarqué est prêt. Par défaut, il utilise `codex`. Si votre déploiement
utilise un autre agent ACP par défaut, définissez l’agent de probe sur le même ID :

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Redémarrez le gateway après avoir changé cette valeur.

## Configuration des autorisations

Les sessions ACP s’exécutent de manière non interactive — il n’y a pas de TTY pour approuver ou refuser les invites d’autorisation d’écriture de fichier et d’exécution shell. Le Plugin acpx fournit deux clés de configuration qui contrôlent la manière dont les autorisations sont gérées :

Ces autorisations du harnais ACPX sont distinctes des approbations d’exécution OpenClaw et distinctes des indicateurs de contournement propres au fournisseur du backend CLI tels que Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` est l’interrupteur d’urgence au niveau harnais pour les sessions ACP.

### `permissionMode`

Contrôle quelles opérations l’agent du harnais peut effectuer sans demander de confirmation.

| Valeur          | Comportement                                                |
| --------------- | ----------------------------------------------------------- |
| `approve-all`   | Auto-approuver toutes les écritures de fichier et commandes shell. |
| `approve-reads` | Auto-approuver les lectures uniquement ; les écritures et exec exigent des invites. |
| `deny-all`      | Refuser toutes les invites d’autorisation.                  |

### `nonInteractivePermissions`

Contrôle ce qui se passe lorsqu’une invite d’autorisation serait affichée mais qu’aucun TTY interactif n’est disponible (ce qui est toujours le cas pour les sessions ACP).

| Valeur | Comportement                                                        |
| ------ | ------------------------------------------------------------------- |
| `fail` | Interrompt la session avec `AcpRuntimeError`. **(par défaut)**      |
| `deny` | Refuse silencieusement l’autorisation et continue (dégradation gracieuse). |

### Configuration

Définissez via la configuration du Plugin :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Redémarrez le gateway après avoir changé ces valeurs.

> **Important :** OpenClaw utilise actuellement par défaut `permissionMode=approve-reads` et `nonInteractivePermissions=fail`. Dans les sessions ACP non interactives, toute écriture ou exécution qui déclenche une invite d’autorisation peut échouer avec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si vous devez restreindre les autorisations, définissez `nonInteractivePermissions` sur `deny` afin que les sessions se dégradent gracieusement au lieu de planter.

## Lié

- [Agents ACP](/fr/tools/acp-agents) — vue d’ensemble, runbook opérateur, concepts
- [Sous-agents](/fr/tools/subagents)
- [Routage multi-agent](/fr/concepts/multi-agent)
