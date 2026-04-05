---
read_when:
    - Vous souhaitez installer ou gérer des plugins de passerelle ou des bundles compatibles
    - Vous souhaitez déboguer des échecs de chargement de plugin
summary: Référence CLI pour `openclaw plugins` (liste, installation, marketplace, désinstallation, activation/désactivation, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-05T12:39:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c35ccf68cd7be1af5fee175bd1ce7de88b81c625a05a23887e5780e790df925
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gérez les plugins/extensions de la passerelle, les packs de hooks et les bundles compatibles.

Lié :

- Système de plugins : [Plugins](/tools/plugin)
- Compatibilité des bundles : [Bundles de plugins](/plugins/bundles)
- Manifeste + schéma de plugin : [Manifeste de plugin](/plugins/manifest)
- Durcissement de la sécurité : [Security](/gateway/security)

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
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Les plugins groupés sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles groupés, les fournisseurs vocaux groupés et le plugin navigateur groupé) ; d’autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un schéma JSON inline (`configSchema`, même s’il est vide). Les bundles compatibles utilisent à la place leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info affiche aussi le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.

### Installation

```bash
openclaw plugins install <package>                      # ClawHub d’abord, puis npm
openclaw plugins install clawhub:<package>              # ClawHub uniquement
openclaw plugins install <package> --force              # écraser une installation existante
openclaw plugins install <package> --pin                # épingler la version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # chemin local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicite)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Les noms de package nus sont d’abord vérifiés dans ClawHub, puis dans npm. Remarque de sécurité :
traitez les installations de plugin comme l’exécution de code. Préférez les versions épinglées.

Si la configuration est invalide, `plugins install` échoue normalement en mode fail-closed et vous indique d’exécuter d’abord `openclaw doctor --fix`. La seule exception documentée est un chemin étroit de récupération de plugin groupé pour les plugins qui activent explicitement `openclaw.install.allowInvalidConfigRecovery`.

`--force` réutilise la cible d’installation existante et écrase sur place un plugin ou pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même identifiant à partir d’un nouveau chemin local, d’une archive, d’un package ClawHub ou d’un artefact npm.

`--pin` s’applique uniquement aux installations npm. Il n’est pas pris en charge avec `--marketplace`, car les installations depuis un marketplace conservent des métadonnées de source de marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est une option de dernier recours pour les faux positifs dans l’analyseur intégré de code dangereux. Elle permet à l’installation de continuer même lorsque l’analyseur intégré signale des constats `critical`, mais elle **ne** contourne **pas** les blocages de politique des hooks `before_install` du plugin et **ne** contourne **pas** les échecs d’analyse.

Cette option CLI s’applique aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills adossées à la passerelle utilisent la surcharge de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de téléchargement/installation de Skills ClawHub.

`plugins install` est également la surface d’installation pour les packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour la visibilité filtrée des hooks et l’activation par hook, et non pour l’installation des packages.

Les spécifications npm sont **réservées au registre** (nom du package + **version exacte** ou **dist-tag** facultatif). Les spécifications git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent avec `--ignore-scripts` pour des raisons de sécurité.

Les spécifications nues et `@latest` restent sur la piste stable. Si npm résout l’un ou l’autre vers une préversion, OpenClaw s’arrête et vous demande d’opter explicitement pour une balise de préversion telle que `@beta`/`@rc` ou une version de préversion exacte telle que `@1.2.3-beta.4`.

Si une spécification d’installation nue correspond à un identifiant de plugin groupé (par exemple `diffs`), OpenClaw installe directement le plugin groupé. Pour installer un package npm portant le même nom, utilisez une spécification explicitement préfixée par un scope (par exemple `@scope/diffs`).

Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Les installations depuis le marketplace Claude sont également prises en charge.

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw préfère désormais aussi ClawHub pour les spécifications de plugin nues compatibles npm. Il ne revient à npm que si ClawHub ne possède pas ce package ou cette version :

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw télécharge l’archive du package depuis ClawHub, vérifie la compatibilité annoncée avec l’API du plugin / la version minimale de la passerelle, puis l’installe via le chemin normal d’archive. Les installations enregistrées conservent leurs métadonnées de source ClawHub pour les mises à jour ultérieures.

Utilisez la forme abrégée `plugin@marketplace` lorsque le nom du marketplace existe dans le cache local de registre Claude à `~/.claude/plugins/known_marketplaces.json` :

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

Les sources de marketplace peuvent être :

- un nom de marketplace connu de Claude provenant de `~/.claude/plugins/known_marketplaces.json`
- une racine de marketplace locale ou un chemin `marketplace.json`
- une forme abrégée de dépôt GitHub telle que `owner/repo`
- une URL de dépôt GitHub telle que `https://github.com/owner/repo`
- une URL git

Pour les marketplaces distants chargés depuis GitHub ou git, les entrées de plugin doivent rester à l’intérieur du dépôt de marketplace cloné. OpenClaw accepte les sources de chemin relatif depuis ce dépôt et rejette les sources de plugin HTTP(S), de chemin absolu, git, GitHub et autres sources non basées sur des chemins provenant de manifestes distants.

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition de composants Claude par défaut)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

Les bundles compatibles sont installés dans la racine normale des extensions et participent au même flux list/info/enable/disable. Aujourd’hui, les Skills de bundle, les command-skills Claude, les valeurs par défaut `settings.json` de Claude, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info mais ne sont pas encore raccordées à l’exécution runtime.

### Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Utilisez `--enabled` pour n’afficher que les plugins chargés. Utilisez `--verbose` pour passer de la vue tableau à des lignes de détail par plugin avec les métadonnées de source/origine/version/activation. Utilisez `--json` pour un inventaire lisible par machine ainsi que les diagnostics du registre.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

`--force` n’est pas pris en charge avec `--link` car les installations liées réutilisent le chemin source au lieu de copier vers une cible d’installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans `plugins.installs` tout en conservant le comportement non épinglé par défaut.

### Désinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de plugin de `plugins.entries`, `plugins.installs`, de la liste d’autorisation des plugins et des entrées liées `plugins.load.paths` lorsqu’elles s’appliquent.
Pour les plugins de mémoire actifs, le slot mémoire revient à `memory-core`.

Par défaut, la désinstallation supprime aussi le répertoire d’installation du plugin sous la racine de plugins du répertoire d’état actif. Utilisez
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

Les mises à jour s’appliquent aux installations suivies dans `plugins.installs` et aux installations suivies de packs de hooks dans `hooks.internal.installs`.

Lorsque vous transmettez un identifiant de plugin, OpenClaw réutilise la spécification d’installation enregistrée pour ce plugin. Cela signifie que les dist-tags précédemment stockés tels que `@beta` et les versions exactes épinglées continuent d’être utilisés lors des exécutions ultérieures de `update <id>`.

Pour les installations npm, vous pouvez aussi transmettre une spécification explicite de package npm avec un dist-tag ou une version exacte. OpenClaw résout alors ce nom de package vers l’enregistrement de plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l’identifiant.

Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change, OpenClaw affiche un avertissement et demande une confirmation avant de continuer. Utilisez le `--yes` global pour contourner les invites dans les exécutions CI/non interactives.

`--dangerously-force-unsafe-install` est également disponible sur `plugins update` comme surcharge de dernier recours pour les faux positifs de l’analyse intégrée de code dangereux lors des mises à jour de plugin. Il ne contourne toujours pas les blocages de politique `before_install` du plugin ni le blocage en cas d’échec d’analyse, et il s’applique uniquement aux mises à jour de plugins, pas aux mises à jour de packs de hooks.

### Inspection

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Inspection approfondie d’un plugin unique. Affiche l’identité, l’état de chargement, la source, les capacités enregistrées, les hooks, les outils, les commandes, les services, les méthodes de passerelle, les routes HTTP, les indicateurs de politique, les diagnostics, les métadonnées d’installation, les capacités de bundle et tout support MCP ou LSP détecté.

Chaque plugin est classé selon ce qu’il enregistre réellement à l’exécution :

- **plain-capability** — un seul type de capacité (par ex. un plugin uniquement fournisseur)
- **hybrid-capability** — plusieurs types de capacités (par ex. texte + voix + images)
- **hook-only** — uniquement des hooks, sans capacités ni surfaces
- **non-capability** — outils/commandes/services mais sans capacités

Consultez [Formes de plugins](/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

L’option `--json` produit un rapport lisible par machine adapté aux scripts et aux audits.

`inspect --all` affiche un tableau à l’échelle de la flotte avec les colonnes forme, types de capacités, remarques de compatibilité, capacités de bundle et résumé des hooks.

`info` est un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des plugins, les diagnostics de manifeste/découverte et les remarques de compatibilité. Lorsque tout est propre, il affiche `No plugin issues detected.`

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste du marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, une forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste de marketplace analysé et les entrées de plugin.
