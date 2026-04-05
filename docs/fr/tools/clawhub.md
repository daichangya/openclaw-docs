---
read_when:
    - Présentation de ClawHub aux nouveaux utilisateurs
    - Installation, recherche ou publication de skills ou de plugins
    - Explication des flags du CLI ClawHub et du comportement de synchronisation
summary: 'Guide ClawHub : registre public, flux d’installation natifs OpenClaw et flux de travail du CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T12:56:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub est le registre public des **skills et plugins OpenClaw**.

- Utilisez les commandes natives `openclaw` pour rechercher/installer/mettre à jour des skills et installer des
  plugins depuis ClawHub.
- Utilisez le CLI `clawhub` séparé lorsque vous avez besoin de l’authentification du registre, de la publication, de la suppression,
  de la restauration, ou de flux de travail de synchronisation.

Site : [clawhub.ai](https://clawhub.ai)

## Flux natifs OpenClaw

Skills :

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins :

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Les spécifications de plugin brutes compatibles npm sont aussi essayées sur ClawHub avant npm :

```bash
openclaw plugins install openclaw-codex-app-server
```

Les commandes natives `openclaw` installent dans votre espace de travail actif et conservent les métadonnées
de source afin que les futurs appels à `update` puissent rester sur ClawHub.

Les installations de plugins valident la compatibilité `pluginApi` et `minGatewayVersion`
annoncée avant l’exécution de l’installation de l’archive, afin que les hôtes incompatibles échouent de manière sûre
et précoce au lieu d’installer partiellement le paquet.

`openclaw plugins install clawhub:...` n’accepte que les familles de plugins installables.
Si un paquet ClawHub est en réalité un skill, OpenClaw s’arrête et vous redirige vers
`openclaw skills install <slug>` à la place.

## Ce qu’est ClawHub

- Un registre public pour les skills et plugins OpenClaw.
- Un magasin versionné de bundles de skills et de métadonnées.
- Une surface de découverte pour la recherche, les tags et les signaux d’usage.

## Comment cela fonctionne

1. Un utilisateur publie un bundle de skill (fichiers + métadonnées).
2. ClawHub stocke le bundle, analyse les métadonnées et attribue une version.
3. Le registre indexe le skill pour la recherche et la découverte.
4. Les utilisateurs parcourent, téléchargent et installent des skills dans OpenClaw.

## Ce que vous pouvez faire

- Publier de nouveaux skills et de nouvelles versions de skills existants.
- Découvrir des skills par nom, tags ou recherche.
- Télécharger des bundles de skills et inspecter leurs fichiers.
- Signaler des skills abusifs ou dangereux.
- Si vous êtes modérateur, masquer, réafficher, supprimer ou bannir.

## À qui cela s’adresse (adapté aux débutants)

Si vous souhaitez ajouter de nouvelles capacités à votre agent OpenClaw, ClawHub est le moyen le plus simple de trouver et d’installer des skills. Vous n’avez pas besoin de savoir comment fonctionne le backend. Vous pouvez :

- Rechercher des skills en langage naturel.
- Installer un skill dans votre espace de travail.
- Mettre à jour des skills plus tard avec une seule commande.
- Sauvegarder vos propres skills en les publiant.

## Démarrage rapide (non technique)

1. Recherchez ce dont vous avez besoin :
   - `openclaw skills search "calendar"`
2. Installez un skill :
   - `openclaw skills install <skill-slug>`
3. Démarrez une nouvelle session OpenClaw pour qu’il prenne en compte le nouveau skill.
4. Si vous souhaitez publier ou gérer l’authentification du registre, installez aussi le CLI
   `clawhub` séparé.

## Installer le CLI ClawHub

Vous n’en avez besoin que pour les flux de travail authentifiés auprès du registre, comme publication/synchronisation :

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Comment il s’intègre à OpenClaw

La commande native `openclaw skills install` installe dans le répertoire `skills/`
de l’espace de travail actif. `openclaw plugins install clawhub:...` enregistre une installation de
plugin gérée normale ainsi que les métadonnées de source ClawHub pour les mises à jour.

Les installations anonymes de plugins ClawHub échouent aussi de manière sûre pour les paquets privés.
Les canaux communautaires ou autres canaux non officiels peuvent toujours être installés, mais OpenClaw avertit
afin que les opérateurs puissent examiner la source et la vérification avant de les activer.

Le CLI `clawhub` séparé installe aussi les skills dans `./skills` sous votre
répertoire de travail courant. Si un espace de travail OpenClaw est configuré, `clawhub`
revient sur cet espace de travail sauf si vous remplacez cela avec `--workdir` (ou
`CLAWHUB_WORKDIR`). OpenClaw charge les skills d’espace de travail depuis `<workspace>/skills`
et les prendra en compte dans la **prochaine** session. Si vous utilisez déjà
`~/.openclaw/skills` ou des skills intégrés, les skills d’espace de travail ont priorité.

Pour plus de détails sur la façon dont les skills sont chargés, partagés et contrôlés, consultez
[Skills](/tools/skills).

## Vue d’ensemble du système de skills

Un skill est un bundle versionné de fichiers qui apprend à OpenClaw comment effectuer une
tâche spécifique. Chaque publication crée une nouvelle version, et le registre conserve un
historique des versions afin que les utilisateurs puissent auditer les changements.

Un skill typique comprend :

- Un fichier `SKILL.md` avec la description principale et l’usage.
- Des configurations, scripts ou fichiers de support facultatifs utilisés par le skill.
- Des métadonnées telles que les tags, le résumé et les exigences d’installation.

ClawHub utilise les métadonnées pour alimenter la découverte et exposer de manière sûre les capacités des skills.
Le registre suit aussi des signaux d’usage (comme les étoiles et téléchargements) pour améliorer
le classement et la visibilité.

## Ce que le service fournit (fonctionnalités)

- **Parcours public** des skills et de leur contenu `SKILL.md`.
- **Recherche** alimentée par des embeddings (recherche vectorielle), pas seulement par mots-clés.
- **Versionnement** avec semver, changelogs et tags (y compris `latest`).
- **Téléchargements** sous forme de zip par version.
- **Étoiles et commentaires** pour les retours de la communauté.
- **Hooks de modération** pour les approbations et audits.
- **API adaptée au CLI** pour l’automatisation et les scripts.

## Sécurité et modération

ClawHub est ouvert par défaut. Tout le monde peut téléverser des skills, mais un compte GitHub doit
avoir au moins une semaine pour publier. Cela aide à ralentir les abus sans bloquer
les contributeurs légitimes.

Signalement et modération :

- Tout utilisateur connecté peut signaler un skill.
- Les motifs de signalement sont obligatoires et enregistrés.
- Chaque utilisateur peut avoir jusqu’à 20 signalements actifs à la fois.
- Les skills avec plus de 3 signalements uniques sont automatiquement masqués par défaut.
- Les modérateurs peuvent voir les skills masqués, les réafficher, les supprimer ou bannir des utilisateurs.
- Un abus de la fonction de signalement peut entraîner des bannissements de compte.

Vous souhaitez devenir modérateur ? Demandez sur le Discord OpenClaw et contactez un
modérateur ou un mainteneur.

## Commandes CLI et paramètres

Options globales (s’appliquent à toutes les commandes) :

- `--workdir <dir>` : Répertoire de travail (par défaut : répertoire courant ; revient à l’espace de travail OpenClaw).
- `--dir <dir>` : Répertoire des skills, relatif au répertoire de travail (par défaut : `skills`).
- `--site <url>` : URL de base du site (connexion via navigateur).
- `--registry <url>` : URL de base de l’API du registre.
- `--no-input` : Désactiver les invites (non interactif).
- `-V, --cli-version` : Afficher la version du CLI.

Authentification :

- `clawhub login` (flux navigateur) ou `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Options :

- `--token <token>` : Coller un jeton API.
- `--label <label>` : Étiquette stockée pour les jetons de connexion via navigateur (par défaut : `CLI token`).
- `--no-browser` : Ne pas ouvrir de navigateur (nécessite `--token`).

Recherche :

- `clawhub search "query"`
- `--limit <n>` : Nombre maximal de résultats.

Installation :

- `clawhub install <slug>`
- `--version <version>` : Installer une version spécifique.
- `--force` : Écraser si le dossier existe déjà.

Mise à jour :

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>` : Mettre à jour vers une version spécifique (slug unique uniquement).
- `--force` : Écraser lorsque les fichiers locaux ne correspondent à aucune version publiée.

Liste :

- `clawhub list` (lit `.clawhub/lock.json`)

Publier des skills :

- `clawhub skill publish <path>`
- `--slug <slug>` : Slug du skill.
- `--name <name>` : Nom d’affichage.
- `--version <version>` : Version semver.
- `--changelog <text>` : Texte du changelog (peut être vide).
- `--tags <tags>` : Tags séparés par des virgules (par défaut : `latest`).

Publier des plugins :

- `clawhub package publish <source>`
- `<source>` peut être un dossier local, `owner/repo`, `owner/repo@ref`, ou une URL GitHub.
- `--dry-run` : Construire le plan de publication exact sans rien téléverser.
- `--json` : Produire une sortie lisible par machine pour la CI.
- `--source-repo`, `--source-commit`, `--source-ref` : Remplacements facultatifs lorsque l’auto-détection ne suffit pas.

Supprimer/restaurer (propriétaire/admin uniquement) :

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Synchronisation (analyser les skills locaux + publier les nouveaux/mis à jour) :

- `clawhub sync`
- `--root <dir...>` : Racines d’analyse supplémentaires.
- `--all` : Tout téléverser sans invites.
- `--dry-run` : Afficher ce qui serait téléversé.
- `--bump <type>` : `patch|minor|major` pour les mises à jour (par défaut : `patch`).
- `--changelog <text>` : Changelog pour les mises à jour non interactives.
- `--tags <tags>` : Tags séparés par des virgules (par défaut : `latest`).
- `--concurrency <n>` : Vérifications du registre (par défaut : 4).

## Flux de travail courants pour les agents

### Rechercher des skills

```bash
clawhub search "postgres backups"
```

### Télécharger de nouveaux skills

```bash
clawhub install my-skill-pack
```

### Mettre à jour les skills installés

```bash
clawhub update --all
```

### Sauvegarder vos skills (publication ou synchronisation)

Pour un dossier de skill unique :

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Pour analyser et sauvegarder de nombreux skills en une seule fois :

```bash
clawhub sync --all
```

### Publier un plugin depuis GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Les plugins de code doivent inclure les métadonnées OpenClaw requises dans `package.json` :

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

## Détails avancés (techniques)

### Versionnement et tags

- Chaque publication crée une nouvelle `SkillVersion` **semver**.
- Les tags (comme `latest`) pointent vers une version ; déplacer les tags permet de revenir en arrière.
- Les changelogs sont attachés par version et peuvent être vides lors de la synchronisation ou de la publication de mises à jour.

### Changements locaux vs versions du registre

Les mises à jour comparent le contenu du skill local aux versions du registre à l’aide d’un hash de contenu. Si les fichiers locaux ne correspondent à aucune version publiée, le CLI demande confirmation avant d’écraser (ou exige `--force` en mode non interactif).

### Analyse de synchronisation et racines de secours

`clawhub sync` analyse d’abord votre répertoire de travail courant. Si aucun skill n’est trouvé, il revient à des emplacements hérités connus (par exemple `~/openclaw/skills` et `~/.openclaw/skills`). Cela est conçu pour trouver des installations de skills plus anciennes sans flags supplémentaires.

### Stockage et lockfile

- Les skills installés sont enregistrés dans `.clawhub/lock.json` sous votre répertoire de travail.
- Les jetons d’authentification sont stockés dans le fichier de configuration du CLI ClawHub (modifiable via `CLAWHUB_CONFIG_PATH`).

### Télémétrie (nombre d’installations)

Lorsque vous exécutez `clawhub sync` tout en étant connecté, le CLI envoie un instantané minimal pour calculer le nombre d’installations. Vous pouvez désactiver cela complètement :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variables d’environnement

- `CLAWHUB_SITE` : Remplacer l’URL du site.
- `CLAWHUB_REGISTRY` : Remplacer l’URL de l’API du registre.
- `CLAWHUB_CONFIG_PATH` : Remplacer l’emplacement où le CLI stocke le jeton/la configuration.
- `CLAWHUB_WORKDIR` : Remplacer le répertoire de travail par défaut.
- `CLAWHUB_DISABLE_TELEMETRY=1` : Désactiver la télémétrie sur `sync`.
