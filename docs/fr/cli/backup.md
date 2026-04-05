---
read_when:
    - Vous souhaitez une archive de sauvegarde de premier plan pour l'état local d'OpenClaw
    - Vous souhaitez prévisualiser quels chemins seraient inclus avant une réinitialisation ou une désinstallation
summary: Référence CLI pour `openclaw backup` (créer des archives de sauvegarde locales)
title: backup
x-i18n:
    generated_at: "2026-04-05T12:37:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 700eda8f9eac1cc93a854fa579f128e5e97d4e6dfc0da75b437c0fb2a898a37d
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

Créez une archive de sauvegarde locale pour l'état, la configuration, les profils d'authentification, les identifiants de canaux/fournisseurs, les sessions et, éventuellement, les espaces de travail d'OpenClaw.

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

- L'archive inclut un fichier `manifest.json` avec les chemins source résolus et la structure de l'archive.
- La sortie par défaut est une archive `.tar.gz` horodatée dans le répertoire de travail actuel.
- Si le répertoire de travail actuel se trouve dans une arborescence source sauvegardée, OpenClaw revient à votre répertoire personnel pour l'emplacement d'archive par défaut.
- Les fichiers d'archive existants ne sont jamais écrasés.
- Les chemins de sortie à l'intérieur des arborescences source d'état/espace de travail sont rejetés pour éviter l'auto-inclusion.
- `openclaw backup verify <archive>` valide que l'archive contient exactement un manifeste racine, rejette les chemins d'archive de type traversée et vérifie que chaque charge utile déclarée par le manifeste existe dans l'archive tar.
- `openclaw backup create --verify` exécute cette validation immédiatement après l'écriture de l'archive.
- `openclaw backup create --only-config` sauvegarde uniquement le fichier de configuration JSON actif.

## Ce qui est sauvegardé

`openclaw backup create` planifie les sources de sauvegarde à partir de votre installation locale d'OpenClaw :

- Le répertoire d'état renvoyé par le résolveur d'état local d'OpenClaw, généralement `~/.openclaw`
- Le chemin du fichier de configuration actif
- Le répertoire `credentials/` résolu lorsqu'il existe en dehors du répertoire d'état
- Les répertoires d'espace de travail découverts à partir de la configuration actuelle, sauf si vous passez `--no-include-workspace`

Les profils d'authentification de modèle font déjà partie du répertoire d'état sous
`agents/<agentId>/agent/auth-profiles.json`, ils sont donc normalement couverts par l'entrée de sauvegarde de l'état.

Si vous utilisez `--only-config`, OpenClaw ignore la découverte de l'état, du répertoire d'identifiants et de l'espace de travail, et archive uniquement le chemin du fichier de configuration actif.

OpenClaw canonicalise les chemins avant de construire l'archive. Si la configuration, le
répertoire d'identifiants ou un espace de travail se trouvent déjà dans le répertoire d'état,
ils ne sont pas dupliqués comme sources de sauvegarde de premier niveau distinctes. Les chemins manquants sont
ignorés.

La charge utile de l'archive stocke le contenu des fichiers de ces arborescences source, et le `manifest.json` intégré enregistre les chemins source absolus résolus ainsi que la structure d'archive utilisée pour chaque élément.

## Comportement avec une configuration invalide

`openclaw backup` contourne intentionnellement le précontrôle normal de configuration afin de pouvoir encore aider pendant une récupération. Comme la découverte de l'espace de travail dépend d'une configuration valide, `openclaw backup create` échoue désormais rapidement lorsque le fichier de configuration existe mais est invalide et que la sauvegarde de l'espace de travail est toujours activée.

Si vous souhaitez malgré tout une sauvegarde partielle dans cette situation, relancez :

```bash
openclaw backup create --no-include-workspace
```

Cela conserve l'état, la configuration et le répertoire d'identifiants externe dans le périmètre tout en
ignorant entièrement la découverte de l'espace de travail.

Si vous avez uniquement besoin d'une copie du fichier de configuration lui-même, `--only-config` fonctionne également lorsque la configuration est mal formée, car il ne dépend pas de l'analyse de la configuration pour la découverte de l'espace de travail.

## Taille et performances

OpenClaw n'impose pas de taille maximale intégrée pour la sauvegarde ni de limite de taille par fichier.

Les limites pratiques dépendent de la machine locale et du système de fichiers de destination :

- L'espace disponible pour l'écriture temporaire de l'archive ainsi que pour l'archive finale
- Le temps nécessaire pour parcourir de grandes arborescences d'espace de travail et les compresser en `.tar.gz`
- Le temps nécessaire pour réanalyser l'archive si vous utilisez `openclaw backup create --verify` ou exécutez `openclaw backup verify`
- Le comportement du système de fichiers au chemin de destination. OpenClaw privilégie une étape de publication par lien physique sans écrasement et revient à une copie exclusive lorsque les liens physiques ne sont pas pris en charge

Les grands espaces de travail sont généralement le principal facteur de taille de l'archive. Si vous souhaitez une sauvegarde plus petite ou plus rapide, utilisez `--no-include-workspace`.

Pour l'archive la plus petite, utilisez `--only-config`.
