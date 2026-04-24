---
read_when:
    - Vous souhaitez une automatisation pilotée par événements pour `/new`, `/reset`, `/stop` et les événements du cycle de vie de l’agent
    - Vous souhaitez créer, installer ou déboguer des hooks
summary: 'Hooks : automatisation pilotée par événements pour les commandes et les événements du cycle de vie'
title: Hooks
x-i18n:
    generated_at: "2026-04-24T06:59:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e24d5a95748151059e34f8c9ff9910dbcd7a32e7cadb44d1fa25352ef3a09a6
    source_path: automation/hooks.md
    workflow: 15
---

Les hooks sont de petits scripts qui s’exécutent lorsqu’un événement se produit dans le Gateway. Ils peuvent être découverts à partir de répertoires et inspectés avec `openclaw hooks`. Le Gateway ne charge les hooks internes qu’après l’activation des hooks ou la configuration d’au moins une entrée de hook, d’un pack de hooks, d’un gestionnaire hérité ou d’un répertoire de hooks supplémentaire.

Il existe deux types de hooks dans OpenClaw :

- **Hooks internes** (cette page) : s’exécutent dans le Gateway lorsque des événements d’agent se déclenchent, comme `/new`, `/reset`, `/stop` ou des événements du cycle de vie.
- **Webhooks** : points de terminaison HTTP externes qui permettent à d’autres systèmes de déclencher du travail dans OpenClaw. Voir [Webhooks](/fr/automation/cron-jobs#webhooks).

Les hooks peuvent aussi être inclus dans des plugins. `openclaw hooks list` affiche à la fois les hooks autonomes et les hooks gérés par des plugins.

## Démarrage rapide

```bash
# Lister les hooks disponibles
openclaw hooks list

# Activer un hook
openclaw hooks enable session-memory

# Vérifier l’état des hooks
openclaw hooks check

# Obtenir des informations détaillées
openclaw hooks info session-memory
```

## Types d’événements

| Event                    | Quand il se déclenche                           |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Commande `/new` émise                           |
| `command:reset`          | Commande `/reset` émise                         |
| `command:stop`           | Commande `/stop` émise                          |
| `command`                | Tout événement de commande (écouteur général)   |
| `session:compact:before` | Avant que Compaction résume l’historique        |
| `session:compact:after`  | Après la fin de la compaction                   |
| `session:patch`          | Lorsque les propriétés de session sont modifiées |
| `agent:bootstrap`        | Avant l’injection des fichiers bootstrap de l’espace de travail |
| `gateway:startup`        | Après le démarrage des canaux et le chargement des hooks |
| `message:received`       | Message entrant depuis n’importe quel canal     |
| `message:transcribed`    | Après la fin de la transcription audio          |
| `message:preprocessed`   | Après la fin de tout le traitement des médias et de la compréhension des liens |
| `message:sent`           | Message sortant remis                           |

## Écriture de hooks

### Structure d’un hook

Chaque hook est un répertoire contenant deux fichiers :

```text
my-hook/
├── HOOK.md          # Métadonnées + documentation
└── handler.ts       # Implémentation du gestionnaire
```

### Format de HOOK.md

```markdown
---
name: my-hook
description: "Brève description de ce que fait ce hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Mon hook

La documentation détaillée va ici.
```

**Champs de métadonnées** (`metadata.openclaw`) :

| Field      | Description                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji affiché dans la CLI                            |
| `events`   | Tableau des événements à écouter                     |
| `export`   | Export nommé à utiliser (par défaut `"default"`)     |
| `os`       | Plateformes requises (par ex. `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` ou chemins `config` requis  |
| `always`   | Contourner les vérifications d’éligibilité (booléen) |
| `install`  | Méthodes d’installation                              |

### Implémentation du gestionnaire

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Votre logique ici

  // Facultatif : envoyer un message à l’utilisateur
  event.messages.push("Hook executed!");
};

export default handler;
```

Chaque événement inclut : `type`, `action`, `sessionKey`, `timestamp`, `messages` (ajouter pour envoyer à l’utilisateur) et `context` (données spécifiques à l’événement).

### Points importants sur le contexte des événements

**Événements de commande** (`command:new`, `command:reset`) : `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Événements de message** (`message:received`) : `context.from`, `context.content`, `context.channelId`, `context.metadata` (données spécifiques au fournisseur, y compris `senderId`, `senderName`, `guildId`).

**Événements de message** (`message:sent`) : `context.to`, `context.content`, `context.success`, `context.channelId`.

**Événements de message** (`message:transcribed`) : `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Événements de message** (`message:preprocessed`) : `context.bodyForAgent` (corps final enrichi), `context.from`, `context.channelId`.

**Événements bootstrap** (`agent:bootstrap`) : `context.bootstrapFiles` (tableau modifiable), `context.agentId`.

**Événements de modification de session** (`session:patch`) : `context.sessionEntry`, `context.patch` (uniquement les champs modifiés), `context.cfg`. Seuls les clients privilégiés peuvent déclencher des événements de modification.

**Événements de compaction** : `session:compact:before` inclut `messageCount`, `tokenCount`. `session:compact:after` ajoute `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Découverte des hooks

Les hooks sont découverts à partir de ces répertoires, dans l’ordre de priorité d’écrasement croissante :

1. **Hooks intégrés** : livrés avec OpenClaw
2. **Hooks de plugin** : hooks inclus dans les plugins installés
3. **Hooks gérés** : `~/.openclaw/hooks/` (installés par l’utilisateur, partagés entre les espaces de travail). Les répertoires supplémentaires de `hooks.internal.load.extraDirs` partagent cette même priorité.
4. **Hooks d’espace de travail** : `<workspace>/hooks/` (par agent, désactivés par défaut jusqu’à activation explicite)

Les hooks d’espace de travail peuvent ajouter de nouveaux noms de hooks, mais ne peuvent pas remplacer des hooks intégrés, gérés ou fournis par un plugin portant le même nom.

Le Gateway ignore la découverte des hooks internes au démarrage tant que les hooks internes ne sont pas configurés. Activez un hook intégré ou géré avec `openclaw hooks enable <name>`, installez un pack de hooks ou définissez `hooks.internal.enabled=true` pour participer explicitement. Lorsque vous activez un hook nommé, le Gateway ne charge que le gestionnaire de ce hook ; `hooks.internal.enabled=true`, les répertoires de hooks supplémentaires et les gestionnaires hérités activent une découverte étendue.

### Packs de hooks

Les packs de hooks sont des packages npm qui exportent des hooks via `openclaw.hooks` dans `package.json`. Installez-les avec :

```bash
openclaw plugins install <path-or-spec>
```

Les spécifications npm sont limitées au registre (nom du package + version exacte facultative ou dist-tag). Les spécifications Git/URL/fichier et les plages semver sont rejetées.

## Hooks intégrés

| Hook                  | Events                         | Ce qu’il fait                                         |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Enregistre le contexte de session dans `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Injecte des fichiers bootstrap supplémentaires à partir de motifs glob |
| command-logger        | `command`                      | Journalise toutes les commandes dans `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Exécute `BOOT.md` au démarrage du gateway             |

Activez n’importe quel hook intégré :

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Détails de session-memory

Extrait les 15 derniers messages utilisateur/assistant, génère un slug de nom de fichier descriptif via LLM et l’enregistre dans `<workspace>/memory/YYYY-MM-DD-slug.md`. Nécessite que `workspace.dir` soit configuré.

<a id="bootstrap-extra-files"></a>

### Configuration de bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Les chemins sont résolus relativement à l’espace de travail. Seuls les noms de base bootstrap reconnus sont chargés (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Détails de command-logger

Journalise chaque commande slash dans `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Détails de boot-md

Exécute `BOOT.md` depuis l’espace de travail actif au démarrage du gateway.

## Hooks de plugin

Les plugins peuvent enregistrer des hooks via le SDK de Plugin pour une intégration plus poussée : interception des appels d’outils, modification des prompts, contrôle du flux de messages, et plus encore. Le SDK de Plugin expose 28 hooks couvrant la résolution de modèle, le cycle de vie de l’agent, le flux de messages, l’exécution d’outils, la coordination des sous-agents et le cycle de vie du gateway.

Pour la référence complète des hooks de plugin, y compris `before_tool_call`, `before_agent_reply`, `before_install` et tous les autres hooks de plugin, voir [Plugin Architecture](/fr/plugins/architecture-internals#provider-runtime-hooks).

## Configuration

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Variables d’environnement par hook :

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Répertoires de hooks supplémentaires :

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
L’ancien format de configuration en tableau `hooks.internal.handlers` est toujours pris en charge pour la rétrocompatibilité, mais les nouveaux hooks doivent utiliser le système basé sur la découverte.
</Note>

## Référence CLI

```bash
# Lister tous les hooks (ajoutez --eligible, --verbose ou --json)
openclaw hooks list

# Afficher les informations détaillées sur un hook
openclaw hooks info <hook-name>

# Afficher le résumé d’éligibilité
openclaw hooks check

# Activer/désactiver
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Bonnes pratiques

- **Gardez des gestionnaires rapides.** Les hooks s’exécutent pendant le traitement des commandes. Lancez les tâches lourdes en arrière-plan avec `void processInBackground(event)`.
- **Gérez les erreurs proprement.** Encadrez les opérations risquées avec try/catch ; ne lancez pas d’exception afin que les autres gestionnaires puissent s’exécuter.
- **Filtrez les événements tôt.** Retournez immédiatement si le type/l’action d’événement n’est pas pertinent.
- **Utilisez des clés d’événement spécifiques.** Préférez `"events": ["command:new"]` à `"events": ["command"]` pour réduire la surcharge.

## Dépannage

### Hook non découvert

```bash
# Vérifier la structure du répertoire
ls -la ~/.openclaw/hooks/my-hook/
# Doit afficher : HOOK.md, handler.ts

# Lister tous les hooks découverts
openclaw hooks list
```

### Hook non éligible

```bash
openclaw hooks info my-hook
```

Vérifiez la présence des binaires requis (PATH), des variables d’environnement, des valeurs de configuration ou de la compatibilité du système d’exploitation.

### Hook non exécuté

1. Vérifiez que le hook est activé : `openclaw hooks list`
2. Redémarrez votre processus gateway pour recharger les hooks.
3. Vérifiez les journaux du gateway : `./scripts/clawlog.sh | grep hook`

## Lié

- [Référence CLI : hooks](/fr/cli/hooks)
- [Webhooks](/fr/automation/cron-jobs#webhooks)
- [Plugin Architecture](/fr/plugins/architecture-internals#provider-runtime-hooks) — référence complète des hooks de plugin
- [Configuration](/fr/gateway/configuration-reference#hooks)
