---
read_when:
    - Vous souhaitez installer ou gérer des plugins Gateway ou des bundles compatibles
    - Vous souhaitez déboguer les échecs de chargement des plugins
summary: Référence CLI pour `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-24T15:25:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gérez les plugins Gateway, les hook packs et les bundles compatibles.

Associé :

- Système de Plugin : [Plugins](/fr/tools/plugin)
- Compatibilité des bundles : [Plugin bundles](/fr/plugins/bundles)
- Manifeste du Plugin + schéma : [Plugin manifest](/fr/plugins/manifest)
- Renforcement de la sécurité : [Security](/fr/gateway/security)

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

Les plugins fournis sont livrés avec OpenClaw. Certains sont activés par défaut (par exemple les fournisseurs de modèles fournis, les fournisseurs vocaux fournis et le plugin de navigateur fourni) ; d'autres nécessitent `plugins enable`.

Les plugins OpenClaw natifs doivent fournir `openclaw.plugin.json` avec un schéma JSON inline (`configSchema`, même s'il est vide). Les bundles compatibles utilisent à la place leurs propres manifestes de bundle.

`plugins list` affiche `Format: openclaw` ou `Format: bundle`. La sortie détaillée de list/info affiche également le sous-type de bundle (`codex`, `claude` ou `cursor`) ainsi que les capacités de bundle détectées.

### Installer

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

Les noms de package simples sont d'abord vérifiés dans ClawHub, puis dans npm. Note de sécurité : traitez les installations de plugins comme l'exécution de code. Préférez les versions épinglées.

Si votre section `plugins` est adossée à un `$include` dans un seul fichier, `plugins install/update/enable/disable/uninstall` écrit dans ce fichier inclus et laisse `openclaw.json` intact. Les includes racine, les tableaux d'includes et les includes avec des surcharges adjacentes échouent de manière fermée au lieu d'être aplatis. Consultez [Config includes](/fr/gateway/configuration) pour les formes prises en charge.

Si la configuration est invalide, `plugins install` échoue normalement de manière fermée et vous indique d'exécuter d'abord `openclaw doctor --fix`.

La seule exception documentée est un chemin de récupération étroit pour les plugins fournis qui optent explicitement pour `openclaw.install.allowInvalidConfigRecovery`.

`--force` réutilise la cible d'installation existante et écrase sur place un plugin ou hook pack déjà installé. Utilisez-le lorsque vous réinstallez intentionnellement le même id à partir d'un nouveau chemin local, d'une archive, d'un package ClawHub ou d'un artefact npm. Pour les mises à niveau courantes d'un plugin npm déjà suivi, préférez `openclaw plugins update <id-or-npm-spec>`.

Si vous exécutez `plugins install` pour un id de plugin déjà installé, OpenClaw s'arrête et vous redirige vers `plugins update <id-or-npm-spec>` pour une mise à niveau normale, ou vers `plugins install <package> --force` si vous voulez réellement écraser l'installation actuelle depuis une autre source.

`--pin` s'applique uniquement aux installations npm. Il n'est pas pris en charge avec `--marketplace`, car les installations marketplace conservent des métadonnées de source marketplace au lieu d'une spec npm.

`--dangerously-force-unsafe-install` est une option de dernier recours pour les faux positifs du scanner intégré de code dangereux. Elle permet à l'installation de continuer même lorsque le scanner intégré signale des résultats `critical`, mais elle **ne** contourne **pas** les blocages de stratégie des hooks de plugin `before_install` et **ne** contourne **pas** les échecs de scan.

Cet indicateur CLI s'applique aux flux d'installation/mise à jour des plugins. Les installations de dépendances de Skills adossées à Gateway utilisent la surcharge de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste un flux distinct de téléchargement/installation de Skills ClawHub.

`plugins install` est également la surface d'installation pour les hook packs qui exposent `openclaw.hooks` dans `package.json`. Utilisez `openclaw hooks` pour une visibilité filtrée des hooks et l'activation par hook, pas pour l'installation de packages.

Les specs npm sont **registry-only** (nom de package + **version exacte** ou **dist-tag** facultative). Les specs Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s'exécutent avec `--ignore-scripts` pour des raisons de sécurité.

Les specs simples et `@latest` restent sur la piste stable. Si npm résout l'un ou l'autre vers une préversion, OpenClaw s'arrête et vous demande un opt-in explicite avec une balise de préversion telle que `@beta`/`@rc` ou une version de préversion exacte telle que `@1.2.3-beta.4`.

Si une spec d'installation simple correspond à un id de plugin fourni (par exemple `diffs`), OpenClaw installe directement le plugin fourni. Pour installer un package npm portant le même nom, utilisez une spec scoppée explicite (par exemple `@scope/diffs`).

Archives prises en charge : `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Les installations depuis la marketplace Claude sont également prises en charge.

Les installations ClawHub utilisent un localisateur explicite `clawhub:<package>` :

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw privilégie désormais aussi ClawHub pour les specs de plugins npm-safe simples. Il ne revient à npm que si ClawHub ne dispose pas de ce package ou de cette version :

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw télécharge l'archive du package depuis ClawHub, vérifie l'API de plugin annoncée / la compatibilité minimale Gateway, puis l'installe via le chemin d'archive normal. Les installations enregistrées conservent leurs métadonnées de source ClawHub pour les mises à jour ultérieures.

Utilisez la forme abrégée `plugin@marketplace` lorsque le nom de marketplace existe dans le cache local du registre Claude à `~/.claude/plugins/known_marketplaces.json` :

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
- une forme abrégée de dépôt GitHub telle que `owner/repo`
- une URL de dépôt GitHub telle que `https://github.com/owner/repo`
- une URL git

Pour les marketplaces distantes chargées depuis GitHub ou git, les entrées de plugin doivent rester à l'intérieur du dépôt marketplace cloné. OpenClaw accepte les sources de chemin relatif depuis ce dépôt et rejette les sources de plugin HTTP(S), de chemin absolu, git, GitHub et autres sources non basées sur un chemin provenant de manifestes distants.

Pour les chemins locaux et les archives, OpenClaw détecte automatiquement :

- les plugins OpenClaw natifs (`openclaw.plugin.json`)
- les bundles compatibles Codex (`.codex-plugin/plugin.json`)
- les bundles compatibles Claude (`.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude)
- les bundles compatibles Cursor (`.cursor-plugin/plugin.json`)

Les bundles compatibles s'installent dans la racine normale des plugins et participent au même flux list/info/enable/disable. Aujourd'hui, les Skills de bundle, les command-skills Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` / `lspServers` déclarées dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles sont pris en charge ; les autres capacités de bundle détectées sont affichées dans les diagnostics/info mais ne sont pas encore raccordées à l'exécution à l'exécution.

### Lister

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Utilisez `--enabled` pour n'afficher que les plugins chargés. Utilisez `--verbose` pour passer de la vue tabulaire à des lignes détaillées par plugin avec les métadonnées de source/origine/version/activation. Utilisez `--json` pour un inventaire lisible par machine ainsi que les diagnostics du registre.

`plugins list` exécute la découverte à partir de l'environnement CLI et de la configuration courants. C'est utile pour vérifier si un plugin est activé/chargeable, mais ce n'est pas une sonde d'exécution en direct d'un processus Gateway déjà en cours d'exécution. Après avoir modifié le code du plugin, son activation, la stratégie de hooks ou `plugins.load.paths`, redémarrez le Gateway qui dessert le canal avant d'attendre l'exécution du nouveau code `register(api)` ou des hooks. Pour les déploiements distants/en conteneur, vérifiez que vous redémarrez bien le processus enfant `openclaw gateway run` réel, et pas seulement un processus wrapper.

Pour le débogage des hooks à l'exécution :

- `openclaw plugins inspect <id> --json` affiche les hooks enregistrés et les diagnostics d'un passage d'inspection avec module chargé.
- `openclaw gateway status --deep --require-rpc` confirme le Gateway joignable, les indications de service/processus, le chemin de configuration et l'état de santé RPC.
- Les hooks de conversation non fournis (`llm_input`, `llm_output`, `agent_end`) nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Utilisez `--link` pour éviter de copier un répertoire local (l'ajoute à `plugins.load.paths`) :

```bash
openclaw plugins install -l ./my-plugin
```

`--force` n'est pas pris en charge avec `--link`, car les installations liées réutilisent le chemin source au lieu de copier par-dessus une cible d'installation gérée.

Utilisez `--pin` sur les installations npm pour enregistrer la spec exacte résolue (`name@version`) dans `plugins.installs` tout en conservant le comportement par défaut non épinglé.

### Désinstaller

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` supprime les enregistrements du plugin de `plugins.entries`, `plugins.installs`, de la liste d'autorisation des plugins et des entrées `plugins.load.paths` liées, le cas échéant. Pour les plugins de mémoire active, l'emplacement mémoire est réinitialisé à `memory-core`.

Par défaut, la désinstallation supprime également le répertoire d'installation du plugin sous la racine des plugins du répertoire d'état actif. Utilisez `--keep-files` pour conserver les fichiers sur le disque.

`--keep-config` est pris en charge comme alias obsolète de `--keep-files`.

### Mettre à jour

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Les mises à jour s'appliquent aux installations suivies dans `plugins.installs` et aux installations suivies de hook packs dans `hooks.internal.installs`.

Lorsque vous transmettez un id de plugin, OpenClaw réutilise la spec d'installation enregistrée pour ce plugin. Cela signifie que les dist-tags précédemment stockés, tels que `@beta`, et les versions exactes épinglées continuent d'être utilisées lors des exécutions ultérieures de `update <id>`.

Pour les installations npm, vous pouvez également transmettre une spec explicite de package npm avec une dist-tag ou une version exacte. OpenClaw résout ce nom de package vers l'enregistrement de plugin suivi, met à jour ce plugin installé et enregistre la nouvelle spec npm pour les futures mises à jour basées sur l'id.

Le fait de transmettre le nom du package npm sans version ni tag résout également vers l'enregistrement de plugin suivi. Utilisez cela lorsqu'un plugin a été épinglé à une version exacte et que vous souhaitez le faire revenir à la ligne de publication par défaut du registre.

Avant une mise à jour npm en direct, OpenClaw vérifie la version du package installé par rapport aux métadonnées du registre npm. Si la version installée et l'identité d'artefact enregistrée correspondent déjà à la cible résolue, la mise à jour est ignorée sans téléchargement, réinstallation ni réécriture de `openclaw.json`.

Lorsqu'un hachage d'intégrité stocké existe et que le hachage de l'artefact récupéré change, OpenClaw traite cela comme une dérive d'artefact npm. La commande interactive `openclaw plugins update` affiche les hachages attendus et réels, puis demande une confirmation avant de continuer. Les assistants de mise à jour non interactifs échouent de manière fermée sauf si l'appelant fournit une politique explicite de poursuite.

`--dangerously-force-unsafe-install` est également disponible sur `plugins update` comme surcharge de dernier recours pour les faux positifs du scan intégré de code dangereux pendant les mises à jour de plugins. Il ne contourne toujours pas les blocages de stratégie `before_install` du plugin ni le blocage en cas d'échec du scan, et il s'applique uniquement aux mises à jour de plugins, pas aux mises à jour de hook packs.

### Inspecter

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspection approfondie pour un seul plugin. Affiche l'identité, l'état de chargement, la source, les capacités enregistrées, les hooks, les outils, les commandes, les services, les méthodes Gateway, les routes HTTP, les indicateurs de stratégie, les diagnostics, les métadonnées d'installation, les capacités du bundle, ainsi que toute prise en charge MCP ou de serveur LSP détectée.

Chaque plugin est classé selon ce qu'il enregistre réellement à l'exécution :

- **plain-capability** — un type de capacité (par ex. un plugin uniquement fournisseur)
- **hybrid-capability** — plusieurs types de capacité (par ex. texte + voix + images)
- **hook-only** — uniquement des hooks, sans capacités ni surfaces
- **non-capability** — outils/commandes/services mais pas de capacités

Voir [Plugin shapes](/fr/plugins/architecture#plugin-shapes) pour en savoir plus sur le modèle de capacités.

L'indicateur `--json` produit un rapport lisible par machine, adapté au scripting et à l'audit.

`inspect --all` affiche un tableau à l'échelle du parc avec des colonnes pour la forme, les types de capacité, les avis de compatibilité, les capacités du bundle et le résumé des hooks.

`info` est un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` signale les erreurs de chargement de plugin, les diagnostics de manifeste/découverte et les avis de compatibilité. Lorsque tout est propre, il affiche `No plugin issues detected.`

Pour les échecs de forme de module, tels que des exports `register`/`activate` manquants, relancez avec `OPENCLAW_PLUGIN_LOAD_DEBUG=1` pour inclure un résumé compact de la forme des exports dans la sortie de diagnostic.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La liste marketplace accepte un chemin de marketplace local, un chemin `marketplace.json`, une forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git. `--json` affiche l'étiquette de source résolue ainsi que le manifeste marketplace analysé et les entrées de plugin.

## Associé

- [Référence CLI](/fr/cli)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Plugins communautaires](/fr/plugins/community)
