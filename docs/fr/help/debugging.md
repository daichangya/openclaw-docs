---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter une fuite de raisonnement
    - Vous voulez exécuter la Gateway en mode watch pendant vos itérations
    - Vous avez besoin d’un workflow de débogage reproductible
summary: 'Outils de débogage : mode watch, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-04-06T03:07:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bc72e8d6cad3a1acaad066f381c82309583fabf304c589e63885f2685dc704e
    source_path: help/debugging.md
    workflow: 15
---

# Débogage

Cette page couvre les aides au débogage pour la sortie en streaming, en particulier lorsqu’un
fournisseur mélange le raisonnement dans le texte normal.

## Remplacements de débogage à l’exécution

Utilisez `/debug` dans le chat pour définir des remplacements de configuration **uniquement à l’exécution** (en mémoire, pas sur disque).
`/debug` est désactivé par défaut ; activez-le avec `commands.debug: true`.
C’est pratique lorsque vous devez basculer des réglages peu courants sans modifier `openclaw.json`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface tous les remplacements et revient à la configuration sur disque.

## Mode watch de la Gateway

Pour itérer rapidement, exécutez la gateway sous le surveillant de fichiers :

```bash
pnpm gateway:watch
```

Cela correspond à :

```bash
node scripts/watch-node.mjs gateway --force
```

Le surveillant redémarre sur les fichiers pertinents pour le build sous `src/`, les fichiers source des extensions,
les métadonnées des extensions dans `package.json` et `openclaw.plugin.json`, `tsconfig.json`,
`package.json` et `tsdown.config.ts`. Les changements de métadonnées d’extension redémarrent la
gateway sans forcer un rebuild `tsdown` ; les changements de source et de configuration
rebuildent toujours `dist` en premier.

Ajoutez n’importe quel drapeau CLI de la gateway après `gateway:watch` et il sera transmis à
chaque redémarrage. Relancer la même commande watch pour le même dépôt/jeu de drapeaux remplace désormais
l’ancien surveillant au lieu de laisser des processus parents dupliqués.

## Profil dev + gateway dev (--dev)

Utilisez le profil dev pour isoler l’état et lancer une configuration sûre et jetable pour le
débogage. Il existe **deux** drapeaux `--dev` :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et
  définit par défaut le port de la gateway sur `19001` (les ports dérivés se décalent avec lui).
- **`gateway --dev` :** indique à la Gateway de créer automatiquement une configuration +
  un espace de travail par défaut s’ils sont absents (et d’ignorer `BOOTSTRAP.md`).

Flux recommandé (profil dev + bootstrap dev) :

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Si vous n’avez pas encore d’installation globale, exécutez la CLI via `pnpm openclaw ...`.

Ce que cela fait :

1. **Isolation du profil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas se décale en conséquence)

2. **Bootstrap dev** (`gateway --dev`)
   - Écrit une configuration minimale si elle est absente (`gateway.mode=local`, bind loopback).
   - Définit `agent.workspace` sur l’espace de travail dev.
   - Définit `agent.skipBootstrap=true` (pas de `BOOTSTRAP.md`).
   - Amorce les fichiers de l’espace de travail s’ils sont absents :
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identité par défaut : **C3‑PO** (droïde de protocole).
   - Ignore les fournisseurs de canaux en mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

Remarque : `--dev` est un drapeau de profil **global** et il est consommé par certains runners.
Si vous devez l’écrire explicitement, utilisez la forme avec variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` efface la configuration, les identifiants, les sessions et l’espace de travail dev (avec
`trash`, pas `rm`), puis recrée la configuration dev par défaut.

Astuce : si une gateway non dev est déjà en cours d’exécution (launchd/systemd), arrêtez-la d’abord :

```bash
openclaw gateway stop
```

## Journalisation des flux bruts (OpenClaw)

OpenClaw peut journaliser le **flux assistant brut** avant tout filtrage/formatage.
C’est le meilleur moyen de voir si le raisonnement arrive sous forme de deltas de texte brut
(ou sous forme de blocs de réflexion séparés).

Activez-le via la CLI :

```bash
pnpm gateway:watch --raw-stream
```

Remplacement facultatif du chemin :

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variables d’environnement équivalentes :

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Fichier par défaut :

`~/.openclaw/logs/raw-stream.jsonl`

## Journalisation des fragments bruts (pi-mono)

Pour capturer les **fragments bruts compatibles OpenAI** avant qu’ils soient analysés en blocs,
pi-mono expose un journaliseur distinct :

```bash
PI_RAW_STREAM=1
```

Chemin facultatif :

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Fichier par défaut :

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Remarque : ceci n’est émis que par les processus utilisant le
> fournisseur `openai-completions` de pi-mono.

## Remarques de sécurité

- Les journaux de flux bruts peuvent inclure les prompts complets, la sortie des outils et les données utilisateur.
- Conservez les journaux en local et supprimez-les après le débogage.
- Si vous partagez des journaux, supprimez d’abord les secrets et les données personnelles identifiables.
