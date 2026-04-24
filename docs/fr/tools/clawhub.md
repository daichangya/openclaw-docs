---
read_when:
    - Présenter ClawHub aux nouveaux utilisateurs
    - Installing, searching, or publishing skills or plugins
    - Expliquer les indicateurs de la CLI ClawHub et le comportement de synchronisation
summary: 'Guide ClawHub : registre public, flux d’installation natifs OpenClaw et workflows de la CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T07:35:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub est le registre public des **Skills et plugins OpenClaw**.

- Utilisez les commandes natives `openclaw` pour rechercher/installer/mettre à jour des Skills et installer
  des plugins depuis ClawHub.
- Utilisez la CLI séparée `clawhub` lorsque vous avez besoin d’authentification registre, de publication, de suppression,
  de restauration ou de workflows de synchronisation.

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

Les spécifications de plugin brutes compatibles npm sont également essayées sur ClawHub avant npm :

```bash
openclaw plugins install openclaw-codex-app-server
```

Les commandes natives `openclaw` installent dans votre espace de travail actif et conservent les
métadonnées de source afin que les appels ultérieurs à `update` puissent rester sur ClawHub.

Les installations de plugin valident la compatibilité annoncée `pluginApi` et `minGatewayVersion`
avant l’installation de l’archive, afin que les hôtes incompatibles échouent en mode fermé
dès le départ au lieu d’installer partiellement le paquet.

`openclaw plugins install clawhub:...` n’accepte que des familles de plugins installables.
Si un paquet ClawHub est en réalité un skill, OpenClaw s’arrête et vous renvoie vers
`openclaw skills install <slug>`.

## Ce qu’est ClawHub

- Un registre public pour les Skills et plugins OpenClaw.
- Un stockage versionné de bundles de Skills et de métadonnées.
- Une surface de découverte pour la recherche, les tags et les signaux d’usage.

## Comment cela fonctionne

1. Un utilisateur publie un bundle de skill (fichiers + métadonnées).
2. ClawHub stocke le bundle, analyse les métadonnées et attribue une version.
3. Le registre indexe le skill pour la recherche et la découverte.
4. Les utilisateurs parcourent, téléchargent et installent les Skills dans OpenClaw.

## Ce que vous pouvez faire

- Publier de nouveaux Skills et de nouvelles versions de Skills existants.
- Découvrir des Skills par nom, tags ou recherche.
- Télécharger des bundles de Skills et inspecter leurs fichiers.
- Signaler des Skills abusifs ou dangereux.
- Si vous êtes modérateur, masquer, réafficher, supprimer ou bannir.

## Pour qui c’est (accessible aux débutants)

Si vous voulez ajouter de nouvelles capacités à votre agent OpenClaw, ClawHub est le moyen le plus simple de trouver et d’installer des Skills. Vous n’avez pas besoin de comprendre le fonctionnement du backend. Vous pouvez :

- Rechercher des Skills en langage naturel.
- Installer un skill dans votre espace de travail.
- Mettre à jour les Skills plus tard avec une seule commande.
- Sauvegarder vos propres Skills en les publiant.

## Démarrage rapide (non technique)

1. Recherchez ce dont vous avez besoin :
   - `openclaw skills search "calendar"`
2. Installez un skill :
   - `openclaw skills install <skill-slug>`
3. Démarrez une nouvelle session OpenClaw pour qu’elle prenne en compte le nouveau skill.
4. Si vous voulez publier ou gérer l’authentification du registre, installez aussi la
   CLI séparée `clawhub`.

## Installer la CLI ClawHub

Vous n’en avez besoin que pour les workflows authentifiés au registre comme publication/synchronisation :

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Comment ClawHub s’intègre dans OpenClaw

La commande native `openclaw skills install` installe dans le répertoire `skills/`
de l’espace de travail actif. `openclaw plugins install clawhub:...` enregistre une installation
normale de plugin géré plus les métadonnées de source ClawHub pour les mises à jour.

Les installations anonymes de plugins ClawHub échouent également en mode fermé pour les paquets privés.
Les canaux communautaires ou autres canaux non officiels peuvent encore s’installer, mais OpenClaw avertit
afin que les opérateurs puissent examiner la source et la vérification avant activation.

La CLI séparée `clawhub` installe aussi les Skills dans `./skills` sous votre répertoire de travail
actuel. Si un espace de travail OpenClaw est configuré, `clawhub`
revient à cet espace de travail sauf si vous remplacez `--workdir` (ou
`CLAWHUB_WORKDIR`). OpenClaw charge les Skills d’espace de travail depuis `<workspace>/skills`
et les prendra en compte dans la **session suivante**. Si vous utilisez déjà
`~/.openclaw/skills` ou des Skills intégrés, les Skills d’espace de travail sont prioritaires.

Pour plus de détails sur le chargement, le partage et le contrôle des Skills, voir
[Skills](/fr/tools/skills).

## Vue d’ensemble du système de Skills

Un skill est un bundle versionné de fichiers qui enseigne à OpenClaw comment accomplir une
tâche spécifique. Chaque publication crée une nouvelle version, et le registre conserve un
historique des versions afin que les utilisateurs puissent auditer les changements.

Un skill typique inclut :

- Un fichier `SKILL.md` avec la description principale et l’utilisation.
- Des configurations, scripts ou fichiers de support facultatifs utilisés par le skill.
- Des métadonnées telles que tags, résumé et exigences d’installation.

ClawHub utilise les métadonnées pour alimenter la découverte et exposer en toute sécurité les capacités des skills.
Le registre suit aussi des signaux d’usage (comme les étoiles et téléchargements) pour améliorer
le classement et la visibilité.

## Ce que fournit le service (fonctionnalités)

- **Navigation publique** des Skills et de leur contenu `SKILL.md`.
- **Recherche** alimentée par des embeddings (recherche vectorielle), et pas seulement par des mots-clés.
- **Versionnage** avec semver, changelogs et tags (y compris `latest`).
- **Téléchargements** sous forme de zip par version.
- **Étoiles et commentaires** pour les retours de la communauté.
- **Hooks de modération** pour approbations et audits.
- **API adaptée à la CLI** pour automatisation et scripts.

## Sécurité et modération

ClawHub est ouvert par défaut. Tout le monde peut téléverser des Skills, mais un compte GitHub doit
avoir au moins une semaine pour publier. Cela aide à ralentir les abus sans bloquer
les contributeurs légitimes.

Signalement et modération :

- Tout utilisateur connecté peut signaler un skill.
- Les motifs de signalement sont obligatoires et enregistrés.
- Chaque utilisateur peut avoir jusqu’à 20 signalements actifs à la fois.
- Les Skills avec plus de 3 signalements uniques sont masqués automatiquement par défaut.
- Les modérateurs peuvent voir les Skills masqués, les réafficher, les supprimer ou bannir des utilisateurs.
- Abuser du système de signalement peut entraîner des bannissements de compte.

Vous souhaitez devenir modérateur ? Demandez sur le Discord OpenClaw et contactez un
modérateur ou un mainteneur.

## Commandes CLI et paramètres

Options globales (s’appliquent à toutes les commandes) :

- `--workdir <dir>` : répertoire de travail (par défaut : répertoire courant ; revient à l’espace de travail OpenClaw).
- `--dir <dir>` : répertoire des Skills, relatif au workdir (par défaut : `skills`).
- `--site <url>` : URL de base du site (connexion navigateur).
- `--registry <url>` : URL de base de l’API du registre.
- `--no-input` : désactiver les invites (non interactif).
- `-V, --cli-version` : afficher la version de la CLI.

Authentification :

- `clawhub login` (flux navigateur) ou `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Options :

- `--token <token>` : coller un jeton API.
- `--label <label>` : libellé stocké pour les jetons de connexion navigateur (par défaut : `CLI token`).
- `--no-browser` : ne pas ouvrir de navigateur (nécessite `--token`).

Recherche :

- `clawhub search "query"`
- `--limit <n>` : nombre maximal de résultats.

Installation :

- `clawhub install <slug>`
- `--version <version>` : installer une version spécifique.
- `--force` : écraser si le dossier existe déjà.

Mise à jour :

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>` : mettre à jour vers une version spécifique (un seul slug uniquement).
- `--force` : écraser lorsque les fichiers locaux ne correspondent à aucune version publiée.

Liste :

- `clawhub list` (lit `.clawhub/lock.json`)

Publier des Skills :

- `clawhub skill publish <path>`
- `--slug <slug>` : slug du skill.
- `--name <name>` : nom d’affichage.
- `--version <version>` : version semver.
- `--changelog <text>` : texte du changelog (peut être vide).
- `--tags <tags>` : tags séparés par des virgules (par défaut : `latest`).

Publier des plugins :

- `clawhub package publish <source>`
- `<source>` peut être un dossier local, `owner/repo`, `owner/repo@ref`, ou une URL GitHub.
- `--dry-run` : construire le plan exact de publication sans rien téléverser.
- `--json` : produire une sortie lisible par machine pour la CI.
- `--source-repo`, `--source-commit`, `--source-ref` : remplacements facultatifs lorsque l’auto-détection ne suffit pas.

Supprimer/restaurer (propriétaire/admin uniquement) :

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Synchronisation (scanner les Skills locaux + publier les nouveaux/mis à jour) :

- `clawhub sync`
- `--root <dir...>` : racines de scan supplémentaires.
- `--all` : tout téléverser sans invites.
- `--dry-run` : afficher ce qui serait téléversé.
- `--bump <type>` : `patch|minor|major` pour les mises à jour (par défaut : `patch`).
- `--changelog <text>` : changelog pour les mises à jour non interactives.
- `--tags <tags>` : tags séparés par des virgules (par défaut : `latest`).
- `--concurrency <n>` : vérifications du registre (par défaut : 4).

## Workflows courants pour les agents

### Rechercher des Skills

```bash
clawhub search "postgres backups"
```

### Télécharger de nouveaux Skills

```bash
clawhub install my-skill-pack
```

### Mettre à jour les Skills installés

```bash
clawhub update --all
```

### Sauvegarder vos Skills (publication ou synchronisation)

Pour un dossier de skill unique :

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Pour scanner et sauvegarder plusieurs Skills à la fois :

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
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
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

Les paquets publiés doivent livrer du JavaScript construit et pointer `runtimeExtensions`
vers cette sortie. Les installations depuis un checkout git peuvent toujours revenir au source TypeScript
lorsqu’aucun fichier construit n’existe, mais les entrées runtime construites évitent la compilation
runtime TypeScript dans les chemins de démarrage, doctor et chargement de plugin.

## Détails avancés (techniques)

### Versionnage et tags

- Chaque publication crée une nouvelle `SkillVersion` **semver**.
- Les tags (comme `latest`) pointent vers une version ; déplacer les tags permet un retour arrière.
- Les changelogs sont attachés par version et peuvent être vides lors de la synchronisation ou de la publication de mises à jour.

### Changements locaux vs versions du registre

Les mises à jour comparent le contenu du skill local aux versions du registre à l’aide d’un hash de contenu. Si les fichiers locaux ne correspondent à aucune version publiée, la CLI demande confirmation avant d’écraser (ou exige `--force` en mode non interactif).

### Scan de synchronisation et racines de repli

`clawhub sync` scanne d’abord votre workdir actuel. Si aucun skill n’est trouvé, il revient à des emplacements legacy connus (par exemple `~/openclaw/skills` et `~/.openclaw/skills`). Cela est conçu pour retrouver les anciennes installations de Skills sans indicateurs supplémentaires.

### Stockage et lockfile

- Les Skills installés sont enregistrés dans `.clawhub/lock.json` sous votre workdir.
- Les jetons d’authentification sont stockés dans le fichier de configuration de la CLI ClawHub (remplaçable via `CLAWHUB_CONFIG_PATH`).

### Télémétrie (compteurs d’installation)

Lorsque vous exécutez `clawhub sync` en étant connecté, la CLI envoie un instantané minimal pour calculer les compteurs d’installation. Vous pouvez désactiver cela complètement :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variables d’environnement

- `CLAWHUB_SITE` : remplacer l’URL du site.
- `CLAWHUB_REGISTRY` : remplacer l’URL de l’API du registre.
- `CLAWHUB_CONFIG_PATH` : remplacer l’emplacement où la CLI stocke le jeton/la configuration.
- `CLAWHUB_WORKDIR` : remplacer le workdir par défaut.
- `CLAWHUB_DISABLE_TELEMETRY=1` : désactiver la télémétrie sur `sync`.

## Associé

- [Plugin](/fr/tools/plugin)
- [Skills](/fr/tools/skills)
- [Plugins communautaires](/fr/plugins/community)
