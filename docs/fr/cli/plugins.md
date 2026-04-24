---
read_when:
    - Vous souhaitez installer ou gérer des Plugins Gateway ou des bundles compatibles
    - Vous souhaitez déboguer des échecs de chargement de Plugin
summary: Référence CLI pour `openclaw plugins` (liste, installation, marketplace, désinstallation, activation/désactivation, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-24T07:05:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gérez les Plugins Gateway, les packs de hooks et les bundles compatibles.

Lié :

- Système de Plugin : [Plugins](/fr/tools/plugin)
- Compatibilité des bundles : [Bundles de Plugin](/fr/plugins/bundles)
- Manifeste + schéma de Plugin : [Manifeste de Plugin](/fr/plugins/manifest)
- Renforcement de la sécurité : [Sécurité](/fr/gateway/security)

## Commandes

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Les Plugins intégrés sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple
les providers de modèles intégrés, les providers vocaux intégrés et le Plugin
browser intégré) ; d’autres nécessitent `plugins enable`.

Les Plugins OpenClaw natifs doivent livrer `openclaw.plugin.json` avec un schéma JSON
inline (`configSchema`, même s’il est vide). Les bundles compatibles utilisent à la place
leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info
affiche aussi le sous-type du bundle (`codex`, `claude` ou `cursor`) ainsi que les
capacités de bundle détectées.

### Installation

```bash
openclaw plugins install <package>                      # ClawHub d'abord, puis npm
openclaw plugins install clawhub:<package>              # ClawHub uniquement
openclaw plugins install <package> --force              # écrase une installation existante
openclaw plugins install <package> --pin                # épingle la version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # chemin local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicite)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Les noms de package nus sont d’abord vérifiés dans ClawHub, puis dans npm. Remarque de sécurité :
traitez les installations de Plugin comme l’exécution de code. Préférez les versions épinglées.

Si votre section `plugins` est adossée à un unique `$include` fichier, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les includes racine, tableaux d’includes et includes avec remplacements frères échouent en fermeture stricte au lieu d’être aplatis. Voir [Includes de configuration](/fr/gateway/configuration) pour les formes prises en charge.

Si la configuration est invalide, `plugins install` échoue normalement en fermeture stricte et vous indique d’exécuter
`openclaw doctor --fix` d’abord. La seule exception documentée est un chemin de récupération étroit
pour un Plugin intégré pour les Plugins qui activent explicitement
`openclaw.install.allowInvalidConfigRecovery`.

`--force` réutilise la cible d’installation existante et écrase sur place un
Plugin ou pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez volontairement
le même identifiant depuis un nouveau chemin local, une archive, un package ClawHub ou un artefact npm.
Pour les mises à niveau de routine d’un Plugin npm déjà suivi, préférez
`openclaw plugins update <id-or-npm-spec>`.

Si vous exécutez `plugins install` pour un identifiant de Plugin déjà installé, OpenClaw
s’arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale,
ou vers `plugins install <package> --force` si vous souhaitez réellement écraser
l’installation actuelle depuis une autre source.

`--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec `--marketplace`,
car les installations marketplace persistent des métadonnées de source marketplace au lieu d’une
spécification npm.

`--dangerously-force-unsafe-install` est une option de dernier recours pour les faux positifs
du scanner intégré de code dangereux. Elle permet de poursuivre l’installation même
lorsque le scanner intégré signale des résultats `critical`, mais elle **ne**
contourne pas les blocages de politique des hooks Plugin `before_install` et **ne** contourne pas les
échecs de scan.

Cet indicateur CLI s’applique aux flux d’installation/mise à jour de Plugin. Les installations de dépendances de Skills
adossées au Gateway utilisent la surcharge de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux séparé de téléchargement/installation de Skills ClawHub.

`plugins install` est aussi la surface d’installation pour les packs de hooks qui exposent
`openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour la visibilité filtrée des hooks
et l’activation par hook, pas pour l’installation du package.

Les spécifications npm sont **registre uniquement** (nom du package + **version exacte** ou
**dist-tag** facultatif). Les spécifications git/URL/fichier et les plages semver sont rejetées. Les installations
de dépendances s’exécutent avec `--ignore-scripts` pour des raisons de sécurité.

Les spécifications nues et `@latest` restent sur la piste stable. Si npm résout l’une
de celles-ci vers une préversion, OpenClaw s’arrête et vous demande d’activer explicitement
une balise de préversion telle que `@beta`/`@rc` ou une version de préversion exacte telle que
`@1.2.3-beta.4`.

Si une spécification d’installation nue correspond à un identifiant de Plugin intégré (par exemple `diffs`), OpenClaw
installe directement le Plugin intégré. Pour installer un package npm portant le même
nom, utilisez une spécification explicite avec scope (par exemple `@scope/diffs`).

Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Les installations depuis la marketplace Claude sont également prises en charge.

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw préfère désormais aussi ClawHub pour les spécifications de Plugin nues compatibles npm. Il ne revient
à npm que si ClawHub n’a pas ce package ou cette version :

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw télécharge l’archive du package depuis ClawHub, vérifie la
compatibilité annoncée avec l’API Plugin / le Gateway minimal, puis l’installe via le chemin
normal des archives. Les installations enregistrées conservent leurs métadonnées de source ClawHub pour les mises à jour ultérieures.

Utilisez la forme abrégée `plugin@marketplace` lorsque le nom de marketplace existe dans le
cache local du registre Claude à `~/.claude/plugins/known_marketplaces.json` :

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Utilisez `--marketplace` lorsque vous souhaitez transmettre explicitement la source de la marketplace :

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Les sources marketplace peuvent être :

- un nom de marketplace connu de Claude depuis `~/.claude/plugins/known_marketplaces.json`
- une racine de marketplace locale ou un chemin `marketplace.json`
- une notation abrégée de dépôt GitHub telle que `owner/repo`
- une URL de dépôt GitHub telle que `https://github.com/owner/repo`
- une URL git

Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de Plugin doivent rester
à l’intérieur du dépôt marketplace cloné. OpenClaw accepte les sources de chemin relatives issues
de ce dépôt et rejette les sources HTTP(S), chemin absolu, git, GitHub et autres sources de Plugin non basées sur un chemin provenant de manifestes distants.

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les Plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition
  par défaut des composants Claude)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

Les bundles compatibles s’installent dans la racine normale des Plugins et participent au
même flux list/info/enable/disable. Aujourd’hui, les bundle Skills, les
command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` /
`lspServers` déclarés par manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont
affichées dans les diagnostics/info mais ne sont pas encore raccordées à l’exécution.

### Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Utilisez `--enabled` pour n’afficher que les Plugins chargés. Utilisez `--verbose` pour passer de la
vue tabulaire à des lignes détaillées par Plugin avec les métadonnées de source/origine/version/activation. Utilisez `--json` pour obtenir un inventaire lisible par machine ainsi que des
diagnostics du registre.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

`--force` n’est pas pris en charge avec `--link`, car les installations liées réutilisent le
chemin source au lieu de copier vers une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans
`plugins.installs` tout en laissant le comportement par défaut non épinglé.

### Désinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de Plugin de `plugins.entries`, `plugins.installs`,
de la liste d’autorisation de Plugins, et les entrées liées de `plugins.load.paths` le cas échéant.
Pour les Plugins Active Memory, l’emplacement mémoire est réinitialisé à `memory-core`.

Par défaut, la désinstallation supprime également le répertoire d’installation du Plugin sous la racine du répertoire d’état actif
des Plugins. Utilisez
`--keep-files` pour conserver les fichiers sur disque.

`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.

### Mise à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s’appliquent aux installations suivies dans `plugins.installs` et aux installations
de packs de hooks suivies dans `hooks.internal.installs`.

Lorsque vous passez un identifiant de Plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce
Plugin. Cela signifie que les dist-tags précédemment stockés tels que `@beta` et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

Pour les installations npm, vous pouvez aussi passer une spécification explicite de package npm avec un dist-tag
ou une version exacte. OpenClaw résout ce nom de package vers l’enregistrement du Plugin suivi,
met à jour ce Plugin installé, et enregistre la nouvelle spécification npm pour les futures
mises à jour basées sur l’identifiant.

Le passage du nom du package npm sans version ni balise résout également vers l’enregistrement du
Plugin suivi. Utilisez cela lorsqu’un Plugin était épinglé à une version exacte et que
vous souhaitez le ramener sur la ligne de publication par défaut du registre.

Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport
aux métadonnées du registre npm. Si la version installée et l’identité d’artefact
enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans
téléchargement, réinstallation ni réécriture de `openclaw.json`.

Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change,
OpenClaw traite cela comme une dérive d’artefact npm. La commande interactive
`openclaw plugins update` affiche les hachages attendus et réels et demande
confirmation avant de continuer. Les helpers de mise à jour non interactifs échouent en fermeture stricte
à moins que l’appelant ne fournisse une politique explicite de poursuite.

`--dangerously-force-unsafe-install` est également disponible sur `plugins update` comme
surcharge de dernier recours pour les faux positifs du scan intégré de code dangereux lors des
mises à jour de Plugin. Cela ne contourne toujours pas les blocages de politique des hooks Plugin `before_install`
ni le blocage en cas d’échec de scan, et cela s’applique uniquement aux mises à jour de Plugin, pas aux mises à jour
de packs de hooks.

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspection approfondie d’un Plugin unique. Affiche l’identité, l’état de chargement, la source,
les capacités enregistrées, hooks, outils, commandes, services, méthodes gateway,
routes HTTP, indicateurs de politique, diagnostics, métadonnées d’installation, capacités de bundle,
et toute prise en charge MCP ou serveur LSP détectée.

Chaque Plugin est classé selon ce qu’il enregistre réellement à l’exécution :

- **plain-capability** — un seul type de capacité (par ex. un Plugin provider uniquement)
- **hybrid-capability** — plusieurs types de capacités (par ex. texte + voix + images)
- **hook-only** — uniquement des hooks, sans capacités ni surfaces
- **non-capability** — outils/commandes/services mais sans capacités

Consultez [Formes de Plugin](/fr/plugins/architecture#plugin-shapes) pour plus d’informations sur le modèle de capacités.

L’indicateur `--json` produit un rapport lisible par machine adapté aux scripts et
aux audits.

`inspect --all` affiche un tableau à l’échelle de la flotte avec les colonnes forme, types de capacités,
avis de compatibilité, capacités de bundle et résumé des hooks.

`info` est un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement de Plugin, les diagnostics de manifeste/découverte, et les
avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues
detected.`

Pour les échecs de forme de module tels que des exports `register`/`activate` manquants, relancez
avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` afin d’inclure un résumé compact de la forme des exports dans
la sortie de diagnostic.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, une
notation abrégée GitHub telle que `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json`
affiche le libellé de source résolu ainsi que le manifeste marketplace analysé et
les entrées de Plugin.

## Lié

- [Référence CLI](/fr/cli)
- [Créer des Plugins](/fr/plugins/building-plugins)
- [Plugins de la communauté](/fr/plugins/community)
