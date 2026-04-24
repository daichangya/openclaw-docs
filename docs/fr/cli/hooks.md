---
read_when:
    - Vous voulez gérer les hooks d’agent
    - Vous voulez inspecter la disponibilité des hooks ou activer les hooks d’espace de travail
summary: Référence CLI pour `openclaw hooks` (hooks d’agent)
title: Hooks
x-i18n:
    generated_at: "2026-04-24T07:04:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84f209e90a5679b889112fc03e22ea94f486ded9db25b5238c0366283695a5b9
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gérez les hooks d’agent (automatisations pilotées par événements pour des commandes comme `/new`, `/reset` et le démarrage du gateway).

Lancer `openclaw hooks` sans sous-commande équivaut à `openclaw hooks list`.

Lié :

- Hooks : [Hooks](/fr/automation/hooks)
- Hooks de Plugin : [Hooks de Plugin](/fr/plugins/architecture-internals#provider-runtime-hooks)

## Lister tous les hooks

```bash
openclaw hooks list
```

Liste tous les hooks découverts dans les répertoires d’espace de travail, gérés, supplémentaires et intégrés.
Le démarrage du gateway ne charge pas les gestionnaires de hooks internes tant qu’au moins un hook interne n’est pas configuré.

**Options :**

- `--eligible` : afficher uniquement les hooks admissibles (conditions remplies)
- `--json` : sortie au format JSON
- `-v, --verbose` : afficher des informations détaillées, y compris les conditions manquantes

**Exemple de sortie :**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Exécuter BOOT.md au démarrage du gateway
  📎 bootstrap-extra-files ✓ - Injecter des fichiers bootstrap supplémentaires de l’espace de travail pendant le bootstrap de l’agent
  📝 command-logger ✓ - Journaliser tous les événements de commande dans un fichier d’audit centralisé
  💾 session-memory ✓ - Enregistrer le contexte de session dans la mémoire lorsqu’une commande /new ou /reset est émise
```

**Exemple (verbose) :**

```bash
openclaw hooks list --verbose
```

Affiche les conditions manquantes pour les hooks non admissibles.

**Exemple (JSON) :**

```bash
openclaw hooks list --json
```

Renvoie un JSON structuré pour une utilisation programmatique.

## Obtenir les informations d’un hook

```bash
openclaw hooks info <name>
```

Affiche des informations détaillées sur un hook spécifique.

**Arguments :**

- `<name>` : nom du hook ou clé du hook (par ex. `session-memory`)

**Options :**

- `--json` : sortie au format JSON

**Exemple :**

```bash
openclaw hooks info session-memory
```

**Sortie :**

```
💾 session-memory ✓ Prêt

Enregistrer le contexte de session dans la mémoire lorsqu’une commande /new ou /reset est émise

Détails :
  Source : openclaw-bundled
  Chemin : /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Gestionnaire : /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Page d’accueil : https://docs.openclaw.ai/automation/hooks#session-memory
  Événements : command:new, command:reset

Conditions :
  Config : ✓ workspace.dir
```

## Vérifier l’admissibilité des hooks

```bash
openclaw hooks check
```

Affiche un résumé de l’état d’admissibilité des hooks (combien sont prêts ou non).

**Options :**

- `--json` : sortie au format JSON

**Exemple de sortie :**

```
État des hooks

Nombre total de hooks : 4
Prêts : 4
Non prêts : 0
```

## Activer un hook

```bash
openclaw hooks enable <name>
```

Active un hook spécifique en l’ajoutant à votre configuration (`~/.openclaw/openclaw.json` par défaut).

**Remarque :** Les hooks d’espace de travail sont désactivés par défaut tant qu’ils ne sont pas activés ici ou dans la configuration. Les hooks gérés par des plugins affichent `plugin:<id>` dans `openclaw hooks list` et ne peuvent pas être activés/désactivés ici. Activez ou désactivez le plugin à la place.

**Arguments :**

- `<name>` : nom du hook (par ex. `session-memory`)

**Exemple :**

```bash
openclaw hooks enable session-memory
```

**Sortie :**

```
✓ Hook activé : 💾 session-memory
```

**Ce que cela fait :**

- Vérifie que le hook existe et qu’il est admissible
- Met à jour `hooks.internal.entries.<name>.enabled = true` dans votre configuration
- Enregistre la configuration sur disque

Si le hook provient de `<workspace>/hooks/`, cette étape d’adhésion explicite est requise avant
que le Gateway ne le charge.

**Après activation :**

- Redémarrez le gateway pour recharger les hooks (redémarrage de l’app de barre de menus sur macOS, ou redémarrage de votre processus gateway en développement).

## Désactiver un hook

```bash
openclaw hooks disable <name>
```

Désactive un hook spécifique en mettant à jour votre configuration.

**Arguments :**

- `<name>` : nom du hook (par ex. `command-logger`)

**Exemple :**

```bash
openclaw hooks disable command-logger
```

**Sortie :**

```
⏸ Hook désactivé : 📝 command-logger
```

**Après désactivation :**

- Redémarrez le gateway pour recharger les hooks

## Remarques

- `openclaw hooks list --json`, `info --json` et `check --json` écrivent directement un JSON structuré sur stdout.
- Les hooks gérés par des plugins ne peuvent pas être activés ou désactivés ici ; activez ou désactivez le plugin propriétaire à la place.

## Installer des packs de hooks

```bash
openclaw plugins install <package>        # ClawHub d’abord, puis npm
openclaw plugins install <package> --pin  # épingler la version
openclaw plugins install <path>           # chemin local
```

Installez des packs de hooks via l’installateur unifié de plugins.

`openclaw hooks install` fonctionne toujours comme alias de compatibilité, mais affiche un
avertissement de dépréciation et transfère vers `openclaw plugins install`.

Les spécifications npm sont **registry-only** (nom de package + **version exacte** facultative ou
**dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances
s’exécutent avec `--ignore-scripts` pour des raisons de sécurité.

Les spécifications nues et `@latest` restent sur la piste stable. Si npm résout l’une de
ces options vers une préversion, OpenClaw s’arrête et vous demande un consentement explicite avec un
tag de préversion tel que `@beta`/`@rc` ou une version de préversion exacte.

**Ce que cela fait :**

- Copie le pack de hooks dans `~/.openclaw/hooks/<id>`
- Active les hooks installés dans `hooks.internal.entries.*`
- Enregistre l’installation sous `hooks.internal.installs`

**Options :**

- `-l, --link` : lier un répertoire local au lieu de le copier (l’ajoute à `hooks.internal.load.extraDirs`)
- `--pin` : enregistrer les installations npm comme `name@version` exact résolu dans `hooks.internal.installs`

**Archives prises en charge :** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Exemples :**

```bash
# Répertoire local
openclaw plugins install ./my-hook-pack

# Archive locale
openclaw plugins install ./my-hook-pack.zip

# Package NPM
openclaw plugins install @openclaw/my-hook-pack

# Lier un répertoire local sans le copier
openclaw plugins install -l ./my-hook-pack
```

Les packs de hooks liés sont traités comme des hooks gérés depuis un répertoire
configuré par l’opérateur, et non comme des hooks d’espace de travail.

## Mettre à jour des packs de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Mettez à jour les packs de hooks suivis basés sur npm via le programme de mise à jour unifié des plugins.

`openclaw hooks update` fonctionne toujours comme alias de compatibilité, mais affiche un
avertissement de dépréciation et transfère vers `openclaw plugins update`.

**Options :**

- `--all` : mettre à jour tous les packs de hooks suivis
- `--dry-run` : afficher ce qui changerait sans rien écrire

Lorsqu’un hash d’intégrité stocké existe et que le hash de l’artefact récupéré change,
OpenClaw affiche un avertissement et demande confirmation avant de continuer. Utilisez
le global `--yes` pour contourner les invites en CI/en exécution non interactive.

## Hooks intégrés

### session-memory

Enregistre le contexte de session dans la mémoire lorsque vous émettez `/new` ou `/reset`.

**Activer :**

```bash
openclaw hooks enable session-memory
```

**Sortie :** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Voir :** [documentation session-memory](/fr/automation/hooks#session-memory)

### bootstrap-extra-files

Injecte des fichiers bootstrap supplémentaires (par exemple `AGENTS.md` / `TOOLS.md` locaux au monorepo) pendant `agent:bootstrap`.

**Activer :**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Voir :** [documentation bootstrap-extra-files](/fr/automation/hooks#bootstrap-extra-files)

### command-logger

Journalise tous les événements de commande dans un fichier d’audit centralisé.

**Activer :**

```bash
openclaw hooks enable command-logger
```

**Sortie :** `~/.openclaw/logs/commands.log`

**Afficher les journaux :**

```bash
# Commandes récentes
tail -n 20 ~/.openclaw/logs/commands.log

# Affichage formaté
cat ~/.openclaw/logs/commands.log | jq .

# Filtrer par action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Voir :** [documentation command-logger](/fr/automation/hooks#command-logger)

### boot-md

Exécute `BOOT.md` au démarrage du gateway (après le démarrage des canaux).

**Événements** : `gateway:startup`

**Activer** :

```bash
openclaw hooks enable boot-md
```

**Voir :** [documentation boot-md](/fr/automation/hooks#boot-md)

## Lié

- [Référence CLI](/fr/cli)
- [Hooks d’automatisation](/fr/automation/hooks)
