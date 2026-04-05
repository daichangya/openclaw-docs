---
read_when:
    - Vous voulez gérer les hooks d’agent
    - Vous voulez inspecter la disponibilité des hooks ou activer des hooks de workspace
summary: Référence CLI pour `openclaw hooks` (hooks d’agent)
title: hooks
x-i18n:
    generated_at: "2026-04-05T12:38:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc9144e9844e9c3cdef2514098eb170543746fcc55ca5a1cc746c12d80209e7
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gérez les hooks d’agent (automatisations pilotées par événements pour des commandes comme `/new`, `/reset` et le démarrage de la gateway).

Exécuter `openclaw hooks` sans sous-commande équivaut à `openclaw hooks list`.

Voir aussi :

- Hooks : [Hooks](/automation/hooks)
- Hooks de plugin : [Plugin hooks](/plugins/architecture#provider-runtime-hooks)

## Lister tous les hooks

```bash
openclaw hooks list
```

Liste tous les hooks découverts depuis les répertoires workspace, gérés, supplémentaires et intégrés.

**Options :**

- `--eligible` : afficher uniquement les hooks éligibles (exigences satisfaites)
- `--json` : sortie en JSON
- `-v, --verbose` : afficher des informations détaillées, y compris les exigences manquantes

**Exemple de sortie :**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Exemple (verbose) :**

```bash
openclaw hooks list --verbose
```

Affiche les exigences manquantes pour les hooks non éligibles.

**Exemple (JSON) :**

```bash
openclaw hooks list --json
```

Retourne un JSON structuré pour une utilisation programmatique.

## Obtenir des informations sur un hook

```bash
openclaw hooks info <name>
```

Affiche des informations détaillées sur un hook spécifique.

**Arguments :**

- `<name>` : nom ou clé du hook (par exemple `session-memory`)

**Options :**

- `--json` : sortie en JSON

**Exemple :**

```bash
openclaw hooks info session-memory
```

**Sortie :**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Vérifier l’éligibilité des hooks

```bash
openclaw hooks check
```

Affiche un résumé de l’état d’éligibilité des hooks (combien sont prêts par rapport à ceux qui ne le sont pas).

**Options :**

- `--json` : sortie en JSON

**Exemple de sortie :**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Activer un hook

```bash
openclaw hooks enable <name>
```

Active un hook spécifique en l’ajoutant à votre configuration (`~/.openclaw/openclaw.json` par défaut).

**Remarque :** les hooks de workspace sont désactivés par défaut tant qu’ils ne sont pas activés ici ou dans la configuration. Les hooks gérés par des plugins affichent `plugin:<id>` dans `openclaw hooks list` et ne peuvent pas être activés/désactivés ici. Activez/désactivez le plugin à la place.

**Arguments :**

- `<name>` : nom du hook (par exemple `session-memory`)

**Exemple :**

```bash
openclaw hooks enable session-memory
```

**Sortie :**

```
✓ Enabled hook: 💾 session-memory
```

**Ce que cela fait :**

- Vérifie que le hook existe et qu’il est éligible
- Met à jour `hooks.internal.entries.<name>.enabled = true` dans votre configuration
- Enregistre la configuration sur le disque

Si le hook provient de `<workspace>/hooks/`, cette étape d’activation explicite est requise avant que
la Gateway puisse le charger.

**Après l’activation :**

- Redémarrez la gateway pour recharger les hooks (redémarrage de l’app de barre de menus sur macOS, ou redémarrage de votre processus gateway en développement).

## Désactiver un hook

```bash
openclaw hooks disable <name>
```

Désactive un hook spécifique en mettant à jour votre configuration.

**Arguments :**

- `<name>` : nom du hook (par exemple `command-logger`)

**Exemple :**

```bash
openclaw hooks disable command-logger
```

**Sortie :**

```
⏸ Disabled hook: 📝 command-logger
```

**Après la désactivation :**

- Redémarrez la gateway pour recharger les hooks

## Remarques

- `openclaw hooks list --json`, `info --json` et `check --json` écrivent un JSON structuré directement sur stdout.
- Les hooks gérés par des plugins ne peuvent pas être activés ou désactivés ici ; activez ou désactivez le plugin propriétaire à la place.

## Installer des packs de hooks

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installez des packs de hooks via le programme d’installation unifié de plugins.

`openclaw hooks install` fonctionne toujours comme alias de compatibilité, mais il affiche un avertissement de dépréciation et transfère à `openclaw plugins install`.

Les spécifications npm sont **limitées au registre** (nom de paquet + **version exacte** facultative ou **dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent avec `--ignore-scripts` pour des raisons de sécurité.

Les spécifications nues et `@latest` restent sur la piste stable. Si npm résout l’un
de ces cas vers une préversion, OpenClaw s’arrête et vous demande d’accepter explicitement avec un
tag de préversion tel que `@beta`/`@rc` ou une version exacte de préversion.

**Ce que cela fait :**

- Copie le pack de hooks dans `~/.openclaw/hooks/<id>`
- Active les hooks installés dans `hooks.internal.entries.*`
- Enregistre l’installation dans `hooks.internal.installs`

**Options :**

- `-l, --link` : lier un répertoire local au lieu de le copier (l’ajoute à `hooks.internal.load.extraDirs`)
- `--pin` : enregistrer les installations npm comme `name@version` exact résolu dans `hooks.internal.installs`

**Archives prises en charge :** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Exemples :**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Les packs de hooks liés sont traités comme des hooks gérés provenant d’un répertoire configuré par un opérateur, et non comme des hooks de workspace.

## Mettre à jour les packs de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Mettez à jour les packs de hooks npm suivis via le programme de mise à jour unifié des plugins.

`openclaw hooks update` fonctionne toujours comme alias de compatibilité, mais il affiche un avertissement de dépréciation et transfère à `openclaw plugins update`.

**Options :**

- `--all` : mettre à jour tous les packs de hooks suivis
- `--dry-run` : afficher ce qui changerait sans rien écrire

Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change,
OpenClaw affiche un avertissement et demande confirmation avant de poursuivre. Utilisez
le `--yes` global pour contourner les invites dans les exécutions CI/non interactives.

## Hooks intégrés

### session-memory

Enregistre le contexte de session dans la mémoire lorsque vous utilisez `/new` ou `/reset`.

**Activer :**

```bash
openclaw hooks enable session-memory
```

**Sortie :** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Voir :** [documentation session-memory](/automation/hooks#session-memory)

### bootstrap-extra-files

Injecte des fichiers bootstrap supplémentaires (par exemple `AGENTS.md` / `TOOLS.md` locaux à un monorepo) pendant `agent:bootstrap`.

**Activer :**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Voir :** [documentation bootstrap-extra-files](/automation/hooks#bootstrap-extra-files)

### command-logger

Journalise tous les événements de commande dans un fichier d’audit centralisé.

**Activer :**

```bash
openclaw hooks enable command-logger
```

**Sortie :** `~/.openclaw/logs/commands.log`

**Afficher les journaux :**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Voir :** [documentation command-logger](/automation/hooks#command-logger)

### boot-md

Exécute `BOOT.md` au démarrage de la gateway (après le démarrage des canaux).

**Événements** : `gateway:startup`

**Activer** :

```bash
openclaw hooks enable boot-md
```

**Voir :** [documentation boot-md](/automation/hooks#boot-md)
