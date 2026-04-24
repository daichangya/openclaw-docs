---
read_when:
    - Vous voulez une archive de sauvegarde de premier ordre pour l’état local d’OpenClaw
    - Vous voulez prévisualiser quels chemins seraient inclus avant une réinitialisation ou une désinstallation
summary: Référence CLI pour `openclaw backup` (créer des archives de sauvegarde locales)
title: Sauvegarde
x-i18n:
    generated_at: "2026-04-24T07:03:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

Créez une archive de sauvegarde locale pour l’état, la configuration, les profils d’authentification, les identifiants de canal/fournisseur, les sessions et, éventuellement, les espaces de travail OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Remarques

- L’archive inclut un fichier `manifest.json` avec les chemins source résolus et la disposition de l’archive.
- La sortie par défaut est une archive `.tar.gz` horodatée dans le répertoire de travail courant.
- Si le répertoire de travail courant se trouve dans une arborescence source sauvegardée, OpenClaw revient à votre répertoire personnel pour l’emplacement par défaut de l’archive.
- Les fichiers d’archive existants ne sont jamais écrasés.
- Les chemins de sortie à l’intérieur des arborescences source d’état/d’espace de travail sont rejetés pour éviter l’auto-inclusion.
- `openclaw backup verify <archive>` valide que l’archive contient exactement un manifeste racine, rejette les chemins d’archive de type traversée et vérifie que chaque charge utile déclarée dans le manifeste existe dans l’archive tar.
- `openclaw backup create --verify` exécute cette validation immédiatement après l’écriture de l’archive.
- `openclaw backup create --only-config` ne sauvegarde que le fichier de configuration JSON actif.

## Ce qui est sauvegardé

`openclaw backup create` planifie les sources de sauvegarde à partir de votre installation OpenClaw locale :

- Le répertoire d’état renvoyé par le résolveur d’état local d’OpenClaw, généralement `~/.openclaw`
- Le chemin du fichier de configuration actif
- Le répertoire `credentials/` résolu lorsqu’il existe en dehors du répertoire d’état
- Les répertoires d’espace de travail découverts à partir de la configuration courante, sauf si vous passez `--no-include-workspace`

Les profils d’authentification de modèle font déjà partie du répertoire d’état sous
`agents/<agentId>/agent/auth-profiles.json`, ils sont donc normalement couverts par l’entrée de sauvegarde
de l’état.

Si vous utilisez `--only-config`, OpenClaw ignore la découverte de l’état, du répertoire d’identifiants et des espaces de travail, et archive uniquement le chemin du fichier de configuration actif.

OpenClaw canonicalise les chemins avant de construire l’archive. Si la configuration, le
répertoire d’identifiants ou un espace de travail se trouvent déjà dans le répertoire d’état,
ils ne sont pas dupliqués comme sources de sauvegarde de niveau supérieur distinctes. Les chemins manquants sont
ignorés.

La charge utile de l’archive stocke le contenu des fichiers de ces arborescences source, et le `manifest.json` intégré enregistre les chemins source absolus résolus ainsi que la disposition de l’archive utilisée pour chaque ressource.

## Comportement en cas de configuration invalide

`openclaw backup` contourne volontairement la prévalidation normale de la configuration afin de pouvoir encore aider lors de la récupération. Comme la découverte des espaces de travail dépend d’une configuration valide, `openclaw backup create` échoue désormais rapidement lorsque le fichier de configuration existe mais est invalide et que la sauvegarde de l’espace de travail est toujours activée.

Si vous voulez malgré tout une sauvegarde partielle dans cette situation, relancez :

```bash
openclaw backup create --no-include-workspace
```

Cela conserve l’état, la configuration et le répertoire d’identifiants externe dans le périmètre
tout en ignorant entièrement la découverte des espaces de travail.

Si vous avez seulement besoin d’une copie du fichier de configuration lui-même, `--only-config` fonctionne également lorsque la configuration est mal formée, car il ne repose pas sur l’analyse de la configuration pour découvrir les espaces de travail.

## Taille et performances

OpenClaw n’impose pas de taille maximale de sauvegarde intégrée ni de limite de taille par fichier.

Les limites pratiques viennent de la machine locale et du système de fichiers de destination :

- Espace disponible pour l’écriture temporaire de l’archive plus l’archive finale
- Temps nécessaire pour parcourir de grandes arborescences d’espace de travail et les compresser en `.tar.gz`
- Temps nécessaire pour réanalyser l’archive si vous utilisez `openclaw backup create --verify` ou exécutez `openclaw backup verify`
- Comportement du système de fichiers au chemin de destination. OpenClaw préfère une étape de publication par lien physique sans écrasement et revient à une copie exclusive lorsque les liens physiques ne sont pas pris en charge

Les grands espaces de travail sont généralement le principal facteur de taille d’archive. Si vous voulez une sauvegarde plus petite ou plus rapide, utilisez `--no-include-workspace`.

Pour l’archive la plus petite, utilisez `--only-config`.

## Liens associés

- [Référence CLI](/fr/cli)
