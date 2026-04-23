---
read_when:
    - Vous souhaitez installer ou gérer des plugins Gateway ou des bundles compatibles
    - Vous souhaitez déboguer les échecs de chargement des plugins
summary: Référence de la CLI pour `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T13:59:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gérez les plugins Gateway, les packs de hooks et les bundles compatibles.

Associé :

- Système de plugins : [Plugins](/fr/tools/plugin)
- Compatibilité des bundles : [Bundles de plugins](/fr/plugins/bundles)
- Manifeste du plugin + schéma : [Manifeste du plugin](/fr/plugins/manifest)
- Durcissement de la sécurité : [Sécurité](/fr/gateway/security)

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

Les plugins groupés sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple
les fournisseurs de modèles groupés, les fournisseurs vocaux groupés et le plugin browser
groupé) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un schéma JSON
inline (`configSchema`, même s’il est vide). Les bundles compatibles utilisent à la place leurs propres
manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info
affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités
de bundle détectées.

### Install

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Les noms de package seuls sont d’abord vérifiés dans ClawHub, puis dans npm. Note de sécurité :
considérez l’installation de plugins comme l’exécution de code. Préférez des versions épinglées.

Si votre section `plugins` est soutenue par un unique `$include` mono-fichier, `plugins install/update/enable/disable/uninstall` écrivent dans ce fichier inclus et laissent `openclaw.json` intact. Les includes racines, les tableaux d’includes et les includes avec remplacements voisins échouent en mode fermé au lieu d’être aplatis. Voir [Includes de configuration](/fr/gateway/configuration) pour les formes prises en charge.

Si la configuration est invalide, `plugins install` échoue normalement en mode fermé et vous indique
d’exécuter `openclaw doctor --fix` d’abord. La seule exception documentée est un chemin étroit
de récupération de plugin groupé pour les plugins qui optent explicitement pour
`openclaw.install.allowInvalidConfigRecovery`.

`--force` réutilise la cible d’installation existante et écrase sur place un plugin ou pack de hooks
déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id depuis un nouveau chemin local, une archive, un package ClawHub ou un artefact npm.
Pour les mises à niveau courantes d’un plugin npm déjà suivi, préférez
`openclaw plugins update <id-or-npm-spec>`.

Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw
s’arrête et vous renvoie vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale,
ou vers `plugins install <package> --force` lorsque vous voulez réellement écraser
l’installation actuelle depuis une autre source.

`--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec `--marketplace`,
car les installations marketplace persistent les métadonnées de source marketplace au lieu d’une
spécification npm.

`--dangerously-force-unsafe-install` est une option de secours pour les faux positifs
du scanner intégré de code dangereux. Elle permet à l’installation de continuer même
lorsque le scanner intégré signale des résultats `critical`, mais elle **ne**
contourne pas les blocages de politique des hooks `before_install` du plugin et **ne**
contourne pas non plus les échecs de scan.

Cet indicateur CLI s’applique aux flux d’installation/mise à jour de plugins. Les installations
de dépendances de Skills adossées à la Gateway utilisent la surcharge de requête correspondante
`dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux séparé
de téléchargement/installation de Skills depuis ClawHub.

`plugins install` est aussi la surface d’installation des packs de hooks qui exposent
`openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée
des hooks et leur activation au cas par cas, pas pour l’installation du package.

Les spécifications npm sont **registry-only** (nom du package + **version exacte** ou
**dist-tag** facultative). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations
de dépendances s’exécutent avec `--ignore-scripts` pour des raisons de sécurité.

Les spécifications seules et `@latest` restent sur la piste stable. Si npm résout l’un ou l’autre
vers une préversion, OpenClaw s’arrête et vous demande d’y adhérer explicitement avec un
tag de préversion tel que `@beta`/`@rc` ou une version de préversion exacte telle que
`@1.2.3-beta.4`.

Si une spécification d’installation seule correspond à l’id d’un plugin groupé (par exemple `diffs`), OpenClaw
installe directement le plugin groupé. Pour installer un package npm portant le même
nom, utilisez une spécification scoppée explicite (par exemple `@scope/diffs`).

Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Les installations depuis le marketplace Claude sont également prises en charge.

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw privilégie désormais aussi ClawHub pour les spécifications de plugin seules compatibles npm. Il ne revient
à npm que si ClawHub ne possède pas ce package ou cette version :

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw télécharge l’archive du package depuis ClawHub, vérifie la compatibilité annoncée
avec l’API plugin / la Gateway minimale, puis l’installe via le chemin normal
d’archive. Les installations enregistrées conservent leurs métadonnées de source ClawHub pour les mises à jour ultérieures.

Utilisez le raccourci `plugin@marketplace` lorsque le nom du marketplace existe dans le cache
du registre local de Claude situé à `~/.claude/plugins/known_marketplaces.json` :

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Utilisez `--marketplace` lorsque vous souhaitez transmettre explicitement la source du marketplace :

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Les sources marketplace peuvent être :

- un nom de marketplace connu de Claude issu de `~/.claude/plugins/known_marketplaces.json`
- une racine de marketplace locale ou un chemin `marketplace.json`
- un raccourci de dépôt GitHub tel que `owner/repo`
- une URL de dépôt GitHub telle que `https://github.com/owner/repo`
- une URL git

Pour les marketplaces distants chargés depuis GitHub ou git, les entrées de plugin doivent rester
dans le dépôt marketplace cloné. OpenClaw accepte les sources de chemin relatif depuis
ce dépôt et rejette les sources de plugin HTTP(S), à chemin absolu, git, GitHub et autres sources non basées sur un chemin provenant de manifestes distants.

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

Les bundles compatibles s’installent dans la racine normale des plugins et participent
au même flux list/info/enable/disable. Aujourd’hui, les bundle Skills, les
command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` /
`lspServers` déclarées dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont
affichées dans les diagnostics/info mais ne sont pas encore raccordées à l’exécution au runtime.

### List

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Utilisez `--enabled` pour afficher uniquement les plugins chargés. Utilisez `--verbose` pour passer
de la vue tabulaire à des lignes de détail par plugin avec les métadonnées
de source/origine/version/activation. Utilisez `--json` pour un inventaire lisible par machine ainsi que les diagnostics du registre.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

`--force` n’est pas pris en charge avec `--link`, car les installations liées réutilisent le
chemin source au lieu de copier vers une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans
`plugins.installs` tout en conservant le comportement par défaut non épinglé.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements du plugin de `plugins.entries`, `plugins.installs`,
de la liste d’autorisation des plugins et des entrées liées `plugins.load.paths` le cas échéant.
Pour les plugins Active Memory, le slot mémoire est réinitialisé à `memory-core`.

Par défaut, uninstall supprime aussi le répertoire d’installation du plugin sous la racine
des plugins du répertoire d’état actif. Utilisez
`--keep-files` pour conserver les fichiers sur disque.

`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s’appliquent aux installations suivies dans `plugins.installs` et aux installations
de packs de hooks suivies dans `hooks.internal.installs`.

Lorsque vous transmettez un id de plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce
plugin. Cela signifie que les dist-tags précédemment stockés comme `@beta` et les versions exactes épinglées
continuent d’être utilisées lors des exécutions ultérieures de `update <id>`.

Pour les installations npm, vous pouvez aussi transmettre une spécification explicite de package npm avec un dist-tag
ou une version exacte. OpenClaw résout ce nom de package vers l’enregistrement de plugin suivi,
met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures
mises à jour basées sur l’id.

Transmettre le nom du package npm sans version ni tag résout aussi vers l’enregistrement
de plugin suivi. Utilisez cela lorsqu’un plugin a été épinglé à une version exacte et
que vous souhaitez le faire revenir à la ligne de publication par défaut du registre.

Avant une mise à jour npm réelle, OpenClaw vérifie la version du package installé par rapport
aux métadonnées du registre npm. Si la version installée et l’identité d’artefact enregistrée
correspondent déjà à la cible résolue, la mise à jour est ignorée sans
téléchargement, réinstallation ni réécriture de `openclaw.json`.

Lorsqu’un hash d’intégrité stocké existe et que le hash de l’artefact récupéré change,
OpenClaw traite cela comme une dérive d’artefact npm. La commande interactive
`openclaw plugins update` affiche les hash attendus et réels et demande
confirmation avant de poursuivre. Les assistants de mise à jour non interactifs échouent en mode fermé
sauf si l’appelant fournit une politique de continuation explicite.

`--dangerously-force-unsafe-install` est aussi disponible sur `plugins update` comme
surcharge de secours pour les faux positifs du scan intégré de code dangereux pendant
les mises à jour de plugins. Il ne contourne toujours pas les blocages de politique `before_install`
du plugin ni les blocages dus à un échec de scan, et il s’applique uniquement aux mises à jour
de plugins, pas aux mises à jour de packs de hooks.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspection approfondie pour un seul plugin. Affiche l’identité, l’état de chargement, la source,
les capacités enregistrées, les hooks, les outils, les commandes, les services, les méthodes Gateway,
les routes HTTP, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités du bundle,
et toute prise en charge MCP ou serveur LSP détectée.

Chaque plugin est classé selon ce qu’il enregistre réellement au runtime :

- **plain-capability** — un type de capacité (par ex. un plugin fournisseur uniquement)
- **hybrid-capability** — plusieurs types de capacités (par ex. texte + voix + images)
- **hook-only** — uniquement des hooks, aucune capacité ni surface
- **non-capability** — outils/commandes/services mais aucune capacité

Voir [Formes de plugin](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacité.

L’indicateur `--json` produit un rapport lisible par machine adapté aux scripts et
à l’audit.

`inspect --all` affiche un tableau à l’échelle de l’ensemble du parc avec des colonnes pour la forme, les types de capacité,
les avis de compatibilité, les capacités du bundle et le résumé des hooks.

`info` est un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des plugins, les diagnostics de manifeste/découverte et les
avis de compatibilité. Lorsque tout est correct, il affiche `No plugin issues
detected.`

Pour les échecs de forme de module tels que des exports `register`/`activate` manquants, relancez
avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans
la sortie de diagnostic.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste du marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, un
raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json`
affiche le libellé de source résolu ainsi que le manifeste de marketplace analysé et les
entrées de plugin.
