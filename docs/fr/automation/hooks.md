---
read_when:
    - Vous voulez une automatisation pilotée par événements pour /new, /reset, /stop et les événements de cycle de vie de l’agent
    - Vous voulez créer, installer ou déboguer des hooks
summary: 'Hooks : automatisation pilotée par événements pour les commandes et les événements de cycle de vie'
title: Hooks
x-i18n:
    generated_at: "2026-04-05T12:34:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eb75bb2b3b2ad229bf3da24fdb0fe021ed08f812fd1d13c69b3bd9df0218e5
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Les hooks sont de petits scripts qui s’exécutent lorsqu’un événement se produit dans la Gateway. Ils sont automatiquement découverts à partir de répertoires et peuvent être inspectés avec `openclaw hooks`.

Il existe deux types de hooks dans OpenClaw :

- **Hooks internes** (cette page) : s’exécutent dans la Gateway lorsque des événements d’agent se déclenchent, comme `/new`, `/reset`, `/stop` ou des événements de cycle de vie.
- **Webhooks** : points de terminaison HTTP externes qui permettent à d’autres systèmes de déclencher du travail dans OpenClaw. Voir [Webhooks](/automation/cron-jobs#webhooks).

Les hooks peuvent aussi être inclus dans des plugins. `openclaw hooks list` affiche à la fois les hooks autonomes et les hooks gérés par des plugins.

## Démarrage rapide

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Types d’événements

| Event                    | Quand il se déclenche                           |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Commande `/new` émise                           |
| `command:reset`          | Commande `/reset` émise                         |
| `command:stop`           | Commande `/stop` émise                          |
| `command`                | Tout événement de commande (écouteur général)   |
| `session:compact:before` | Avant que le compactage résume l’historique     |
| `session:compact:after`  | Après la fin du compactage                      |
| `session:patch`          | Lorsque les propriétés de session sont modifiées |
| `agent:bootstrap`        | Avant l’injection des fichiers bootstrap de workspace |
| `gateway:startup`        | Après le démarrage des canaux et le chargement des hooks |
| `message:received`       | Message entrant depuis n’importe quel canal     |
| `message:transcribed`    | Après la fin de la transcription audio          |
| `message:preprocessed`   | Une fois toute l’analyse des médias et des liens terminée |
| `message:sent`           | Message sortant remis                           |

## Écriture de hooks

### Structure d’un hook

Chaque hook est un répertoire contenant deux fichiers :

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Format de HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Champs de métadonnées** (`metadata.openclaw`) :

| Field      | Description                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji d’affichage pour la CLI                        |
| `events`   | Tableau des événements à écouter                     |
| `export`   | Export nommé à utiliser (par défaut `"default"`)     |
| `os`       | Plateformes requises (par ex. `["darwin", "linux"]`) |
| `requires` | Chemins `bins`, `anyBins`, `env` ou `config` requis  |
| `always`   | Contourne les vérifications d’éligibilité (booléen)  |
| `install`  | Méthodes d’installation                              |

### Implémentation du handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Chaque événement inclut : `type`, `action`, `sessionKey`, `timestamp`, `messages` (ajouter pour envoyer à l’utilisateur) et `context` (données spécifiques à l’événement).

### Points clés du contexte d’événement

**Événements de commande** (`command:new`, `command:reset`) : `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Événements de message** (`message:received`) : `context.from`, `context.content`, `context.channelId`, `context.metadata` (données spécifiques au fournisseur, y compris `senderId`, `senderName`, `guildId`).

**Événements de message** (`message:sent`) : `context.to`, `context.content`, `context.success`, `context.channelId`.

**Événements de message** (`message:transcribed`) : `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Événements de message** (`message:preprocessed`) : `context.bodyForAgent` (corps enrichi final), `context.from`, `context.channelId`.

**Événements bootstrap** (`agent:bootstrap`) : `context.bootstrapFiles` (tableau mutable), `context.agentId`.

**Événements de patch de session** (`session:patch`) : `context.sessionEntry`, `context.patch` (seuls les champs modifiés), `context.cfg`. Seuls les clients privilégiés peuvent déclencher des événements de patch.

**Événements de compactage** : `session:compact:before` inclut `messageCount`, `tokenCount`. `session:compact:after` ajoute `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Découverte des hooks

Les hooks sont découverts à partir de ces répertoires, dans l’ordre de priorité d’écrasement croissante :

1. **Hooks intégrés** : fournis avec OpenClaw
2. **Hooks de plugin** : hooks inclus dans les plugins installés
3. **Hooks gérés** : `~/.openclaw/hooks/` (installés par l’utilisateur, partagés entre les workspaces). Les répertoires supplémentaires de `hooks.internal.load.extraDirs` partagent cette priorité.
4. **Hooks de workspace** : `<workspace>/hooks/` (par agent, désactivés par défaut jusqu’à activation explicite)

Les hooks de workspace peuvent ajouter de nouveaux noms de hooks, mais ne peuvent pas écraser des hooks intégrés, gérés ou fournis par des plugins portant le même nom.

### Packs de hooks

Les packs de hooks sont des paquets npm qui exportent des hooks via `openclaw.hooks` dans `package.json`. Installez-les avec :

```bash
openclaw plugins install <path-or-spec>
```

Les spécifications npm sont limitées au registre (nom de paquet + version exacte facultative ou dist-tag). Les spécifications Git/URL/fichier et les plages semver sont rejetées.

## Hooks intégrés

| Hook                  | Events                         | Ce qu’il fait                                         |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Enregistre le contexte de session dans `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Injecte des fichiers bootstrap supplémentaires depuis des motifs glob |
| command-logger        | `command`                      | Journalise toutes les commandes dans `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Exécute `BOOT.md` au démarrage de la gateway          |

Activez n’importe quel hook intégré :

```bash
openclaw hooks enable <hook-name>
```

### Détails de session-memory

Extrait les 15 derniers messages utilisateur/assistant, génère un slug de nom de fichier descriptif via un LLM, puis l’enregistre dans `<workspace>/memory/YYYY-MM-DD-slug.md`. Nécessite que `workspace.dir` soit configuré.

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

Les chemins sont résolus relativement au workspace. Seuls les noms de base bootstrap reconnus sont chargés (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

## Hooks de plugin

Les plugins peuvent enregistrer des hooks via le Plugin SDK pour une intégration plus poussée : interception des appels d’outils, modification des prompts, contrôle du flux des messages, etc. Le Plugin SDK expose 28 hooks couvrant la résolution de modèle, le cycle de vie de l’agent, le flux des messages, l’exécution d’outils, la coordination des sous-agents et le cycle de vie de la gateway.

Pour la référence complète des hooks de plugin, y compris `before_tool_call`, `before_agent_reply`, `before_install` et tous les autres hooks de plugin, voir [Plugin Architecture](/plugins/architecture#provider-runtime-hooks).

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

Variables d’environnement par hook :

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

Répertoires de hooks supplémentaires :

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
L’ancien format de configuration de tableau `hooks.internal.handlers` est toujours pris en charge pour la rétrocompatibilité, mais les nouveaux hooks doivent utiliser le système basé sur la découverte.
</Note>

## Référence CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Bonnes pratiques

- **Gardez les handlers rapides.** Les hooks s’exécutent pendant le traitement des commandes. Lancez les tâches lourdes en arrière-plan sans attendre avec `void processInBackground(event)`.
- **Gérez les erreurs avec élégance.** Encadrez les opérations risquées avec try/catch ; ne levez pas d’exception afin que les autres handlers puissent s’exécuter.
- **Filtrez les événements tôt.** Retournez immédiatement si le type/l’action de l’événement n’est pas pertinent.
- **Utilisez des clés d’événement spécifiques.** Préférez `"events": ["command:new"]` à `"events": ["command"]` pour réduire la surcharge.

## Dépannage

### Hook non découvert

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook non éligible

```bash
openclaw hooks info my-hook
```

Vérifiez l’absence de binaires requis (PATH), de variables d’environnement, de valeurs de configuration ou la compatibilité OS.

### Hook non exécuté

1. Vérifiez que le hook est activé : `openclaw hooks list`
2. Redémarrez votre processus gateway afin que les hooks soient rechargés.
3. Vérifiez les journaux de la gateway : `./scripts/clawlog.sh | grep hook`

## Voir aussi

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/automation/cron-jobs#webhooks)
- [Plugin Architecture](/plugins/architecture#provider-runtime-hooks) — référence complète des hooks de plugin
- [Configuration](/gateway/configuration-reference#hooks)
