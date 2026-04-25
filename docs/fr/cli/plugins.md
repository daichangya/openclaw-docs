---
read_when:
    - Vous souhaitez installer ou gérer des plugins Gateway ou des bundles compatibles
    - Vous souhaitez déboguer les échecs de chargement des plugins
summary: Référence CLI pour `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:18:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ae8f71873fb90dc7acde2ac522228cc60603ba34322e5b6d031e8de7545684e
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gérez les plugins Gateway, les packs de hooks et les bundles compatibles.

Voir aussi :

- Système de Plugin : [Plugins](/fr/tools/plugin)
- Compatibilité des bundles : [Bundles de Plugin](/fr/plugins/bundles)
- Manifeste de Plugin + schéma : [Manifeste de Plugin](/fr/plugins/manifest)
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
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Les plugins fournis sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles fournis, les fournisseurs vocaux fournis et le plugin navigateur fourni) ; d'autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent inclure `openclaw.plugin.json` avec un schéma JSON inline (`configSchema`, même s'il est vide). Les bundles compatibles utilisent plutôt leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info affiche également le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.

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

Les noms de paquet bruts sont d'abord vérifiés dans ClawHub, puis dans npm. Note de sécurité : considérez les installations de plugins comme l'exécution de code. Préférez les versions épinglées.

Si votre section `plugins` est adossée à un unique `$include` de fichier, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` inchangé. Les includes racine, les tableaux d'includes et les includes avec des surcharges voisines échouent en mode fermé au lieu d'être aplatis. Voir [Config includes](/fr/gateway/configuration) pour les formes prises en charge.

Si la configuration est invalide, `plugins install` échoue normalement en mode fermé et vous indique d'exécuter d'abord `openclaw doctor --fix`. La seule exception documentée est un chemin de récupération étroit pour les plugins fournis qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

`--force` réutilise la cible d'installation existante et écrase sur place un plugin ou un pack de hooks déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id depuis un nouveau chemin local, une archive, un paquet ClawHub ou un artefact npm. Pour les mises à niveau courantes d'un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw s'arrête et vous oriente vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` si vous voulez réellement écraser l'installation actuelle depuis une autre source.

`--pin` s'applique uniquement aux installations npm. Il n'est pas pris en charge avec `--marketplace`, car les installations depuis une marketplace conservent des métadonnées de source de marketplace plutôt qu'une spécification npm.

`--dangerously-force-unsafe-install` est une option de secours pour les faux positifs dans le scanner de code dangereux intégré. Elle permet à l'installation de continuer même lorsque le scanner intégré signale des résultats `critical`, mais elle **ne** contourne **pas** les blocages de politique du hook `before_install` du plugin et **ne** contourne **pas** les échecs de scan.

Ce drapeau CLI s'applique aux flux d'installation/mise à jour de plugins. Les installations de dépendances de Skills adossées à Gateway utilisent la surcharge de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de téléchargement/installation de Skills ClawHub.

`plugins install` est aussi la surface d'installation des packs de hooks qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et l'activation hook par hook, pas pour l'installation des paquets.

Les spécifications npm sont **limitées au registre** (nom de paquet + **version exacte** facultative ou **dist-tag**). Les spécifications git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s'exécutent avec `--ignore-scripts` par sécurité.

Les spécifications brutes et `@latest` restent sur la piste stable. Si npm résout l'un ou l'autre vers une préversion, OpenClaw s'arrête et vous demande d'opter explicitement pour une préversion avec un tag de préversion tel que `@beta`/`@rc` ou une version de préversion exacte telle que `@1.2.3-beta.4`.

Si une spécification d'installation brute correspond à l'id d'un plugin fourni (par exemple `diffs`), OpenClaw installe directement le plugin fourni. Pour installer un paquet npm portant le même nom, utilisez une spécification scoped explicite (par exemple `@scope/diffs`).

Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Les installations depuis la marketplace Claude sont également prises en charge.

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw privilégie désormais aussi ClawHub pour les spécifications de plugins brutes compatibles npm. Il ne revient à npm que si ClawHub ne possède pas ce paquet ou cette version :

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw télécharge l'archive du paquet depuis ClawHub, vérifie la compatibilité annoncée avec l'API de plugin / la version minimale de gateway, puis l'installe via le chemin d'archive normal. Les installations enregistrées conservent leurs métadonnées de source ClawHub pour les mises à jour ultérieures.

Utilisez la forme abrégée `plugin@marketplace` lorsque le nom de la marketplace existe dans le cache de registre local de Claude à `~/.claude/plugins/known_marketplaces.json` :

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

Les sources de marketplace peuvent être :

- un nom de marketplace connu de Claude provenant de `~/.claude/plugins/known_marketplaces.json`
- une racine de marketplace locale ou un chemin `marketplace.json`
- une forme abrégée de dépôt GitHub telle que `owner/repo`
- une URL de dépôt GitHub telle que `https://github.com/owner/repo`
- une URL git

Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de plugin doivent rester à l'intérieur du dépôt de marketplace cloné. OpenClaw accepte les sources de chemin relatif depuis ce dépôt et rejette les sources de plugin HTTP(S), en chemin absolu, git, GitHub et autres sources non basées sur un chemin provenant de manifestes distants.

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition de composants Claude par défaut)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

Les bundles compatibles s'installent dans la racine normale des plugins et participent au même flux list/info/enable/disable. Aujourd'hui, les bundle skills, les command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info mais ne sont pas encore connectées à l'exécution au moment de l'exécution.

### Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Utilisez `--enabled` pour n'afficher que les plugins activés. Utilisez `--verbose` pour passer de la vue en tableau à des lignes de détail par plugin avec les métadonnées de source/origine/version/activation. Utilisez `--json` pour un inventaire lisible par machine avec les diagnostics du registre.

`plugins list` lit d'abord le registre local persistant des plugins, avec un repli dérivé uniquement du manifeste lorsque le registre est manquant ou invalide. Cela est utile pour vérifier si un plugin est installé, activé et visible pour la planification du démarrage à froid, mais ce n'est pas une sonde d'exécution en direct d'un processus Gateway déjà en cours d'exécution. Après avoir modifié le code d'un plugin, son activation, la politique des hooks ou `plugins.load.paths`, redémarrez la Gateway qui dessert le canal avant d'attendre l'exécution d'un nouveau code `register(api)` ou de hooks. Pour les déploiements distants/en conteneur, vérifiez que vous redémarrez bien le processus enfant réel `openclaw gateway run`, et pas seulement un processus wrapper.

Pour le débogage des hooks à l'exécution :

- `openclaw plugins inspect <id> --json` affiche les hooks enregistrés et les diagnostics issus d'un passage d'inspection avec chargement du module.
- `openclaw gateway status --deep --require-rpc` confirme la Gateway joignable, les indications de service/processus, le chemin de configuration et l'état de santé RPC.
- Les hooks de conversation non fournis (`llm_input`, `llm_output`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

`--force` n'est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier sur une cible d'installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spécification exacte résolue (`name@version`) dans `plugins.installs` tout en conservant par défaut un comportement non épinglé.

### Désinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements de plugin de `plugins.entries`, `plugins.installs`, de la liste d'autorisation des plugins et des entrées liées `plugins.load.paths` le cas échéant. Pour les plugins de mémoire active, l'emplacement mémoire est réinitialisé à `memory-core`.

Par défaut, la désinstallation supprime également le répertoire d'installation du plugin sous la racine de plugin du répertoire d'état actif. Utilisez `--keep-files` pour conserver les fichiers sur disque.

`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.

### Mise à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s'appliquent aux installations suivies dans `plugins.installs` et aux installations suivies de packs de hooks dans `hooks.internal.installs`.

Lorsque vous transmettez un id de plugin, OpenClaw réutilise la spécification d'installation enregistrée pour ce plugin. Cela signifie que les dist-tags précédemment stockés, tels que `@beta`, et les versions exactes épinglées continuent d'être utilisés lors des exécutions ultérieures de `update <id>`.

Pour les installations npm, vous pouvez également transmettre une spécification explicite de paquet npm avec un dist-tag ou une version exacte. OpenClaw résout ce nom de paquet vers l'enregistrement du plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spécification npm pour les futures mises à jour basées sur l'id.

Le fait de transmettre le nom du paquet npm sans version ni tag résout également vers l'enregistrement du plugin suivi. Utilisez cela lorsqu'un plugin a été épinglé à une version exacte et que vous souhaitez le faire revenir à la ligne de publication par défaut du registre.

Avant une mise à jour npm en direct, OpenClaw vérifie la version du paquet installé par rapport aux métadonnées du registre npm. Si la version installée et l'identité d'artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

Lorsqu'un hash d'intégrité stocké existe et que le hash de l'artefact récupéré change, OpenClaw traite cela comme une dérive d'artefact npm. La commande interactive `openclaw plugins update` affiche les hash attendus et réels, puis demande une confirmation avant de continuer. Les helpers de mise à jour non interactifs échouent en mode fermé à moins que l'appelant ne fournisse une politique de continuation explicite.

`--dangerously-force-unsafe-install` est également disponible sur `plugins update` comme surcharge de secours pour les faux positifs du scan intégré de code dangereux pendant les mises à jour de plugins. Il ne contourne toujours pas les blocages de politique `before_install` du plugin ni les blocages dus à un échec de scan, et il s'applique uniquement aux mises à jour de plugins, pas aux mises à jour de packs de hooks.

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspection approfondie pour un seul plugin. Affiche l'identité, l'état de chargement, la source, les capacités enregistrées, les hooks, les outils, les commandes, les services, les méthodes gateway, les routes HTTP, les indicateurs de politique, les diagnostics, les métadonnées d'installation, les capacités de bundle, ainsi que tout support MCP ou serveur LSP détecté.

Chaque plugin est classé selon ce qu'il enregistre réellement à l'exécution :

- **plain-capability** — un seul type de capacité (par exemple, un plugin uniquement fournisseur)
- **hybrid-capability** — plusieurs types de capacité (par exemple texte + voix + images)
- **hook-only** — uniquement des hooks, sans capacités ni surfaces
- **non-capability** — outils/commandes/services mais sans capacités

Consultez [Formes de Plugin](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

Le drapeau `--json` produit un rapport lisible par machine adapté aux scripts et aux audits.

`inspect --all` affiche un tableau à l'échelle de l'ensemble avec des colonnes pour la forme, les types de capacité, les avis de compatibilité, les capacités de bundle et le résumé des hooks.

`info` est un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement des plugins, les diagnostics de manifeste/découverte et les avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues detected.`

Pour les échecs de forme de module tels que des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` afin d'inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Registre

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Le registre local des plugins est le modèle de lecture à froid persistant d'OpenClaw pour l'identité des plugins installés, leur activation, leurs métadonnées de source et la propriété des contributions.
Le démarrage normal, la recherche du propriétaire du fournisseur, la classification de la configuration des canaux et l'inventaire des plugins peuvent le lire sans importer les modules runtime des plugins.

Utilisez `plugins registry` pour inspecter si le registre persistant est présent, à jour ou obsolète. Utilisez `--refresh` pour le reconstruire à partir du journal d'installation durable, de la politique de configuration et des métadonnées de manifeste/paquet. Il s'agit d'un chemin de réparation, pas d'un chemin d'activation à l'exécution.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` est un commutateur de compatibilité de secours obsolète pour les échecs de lecture du registre. Préférez `plugins registry --refresh` ou `openclaw doctor --fix` ; le repli via variable d'environnement n'est réservé qu'à une récupération d'urgence au démarrage pendant le déploiement de la migration.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La commande marketplace list accepte un chemin de marketplace local, un chemin `marketplace.json`, une forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche le libellé de source résolu ainsi que le manifeste de marketplace analysé et les entrées de plugin.

## Voir aussi

- [Référence CLI](/fr/cli)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Plugins communautaires](/fr/plugins/community)
