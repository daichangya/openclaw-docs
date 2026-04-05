---
read_when:
    - Vous devez inspecter la sortie brute du modèle pour détecter des fuites de raisonnement
    - Vous voulez exécuter la Gateway en mode watch pendant vos itérations
    - Vous avez besoin d’un flux de travail de débogage reproductible
summary: 'Outils de débogage : mode watch, flux bruts du modèle et traçage des fuites de raisonnement'
title: Débogage
x-i18n:
    generated_at: "2026-04-05T12:43:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# Débogage

Cette page couvre les assistants de débogage pour la sortie en streaming, en particulier lorsqu’un
fournisseur mélange le raisonnement au texte normal.

## Surcharges de débogage à l’exécution

Utilisez `/debug` dans le chat pour définir des surcharges de configuration **à l’exécution uniquement** (en mémoire, pas sur disque).
`/debug` est désactivé par défaut ; activez-le avec `commands.debug: true`.
C’est pratique lorsque vous devez basculer des paramètres obscurs sans modifier `openclaw.json`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` efface toutes les surcharges et revient à la configuration sur disque.

## Mode watch de la Gateway

Pour itérer rapidement, exécutez la Gateway sous le surveillant de fichiers :

```bash
pnpm gateway:watch
```

Cela correspond à :

```bash
node scripts/watch-node.mjs gateway --force
```

Le surveillant redémarre sur les fichiers pertinents pour le build sous `src/`, les fichiers source d’extension,
les métadonnées `package.json` et `openclaw.plugin.json` des extensions, `tsconfig.json`,
`package.json`, et `tsdown.config.ts`. Les modifications des métadonnées d’extension redémarrent la
Gateway sans forcer un rebuild `tsdown` ; les modifications de source et de configuration
reconstruisent toujours `dist` d’abord.

Ajoutez n’importe quels indicateurs CLI de Gateway après `gateway:watch` et ils seront transmis à
chaque redémarrage.

## Profil dev + passerelle dev (`--dev`)

Utilisez le profil dev pour isoler l’état et lancer une configuration sûre et jetable pour le
débogage. Il existe **deux** indicateurs `--dev` :

- **`--dev` global (profil) :** isole l’état sous `~/.openclaw-dev` et
  définit par défaut le port Gateway sur `19001` (les ports dérivés se décalent avec lui).
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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas se décalent en conséquence)

2. **Bootstrap dev** (`gateway --dev`)
   - Écrit une configuration minimale si elle est absente (`gateway.mode=local`, bind loopback).
   - Définit `agent.workspace` sur l’espace de travail dev.
   - Définit `agent.skipBootstrap=true` (pas de `BOOTSTRAP.md`).
   - Initialise les fichiers d’espace de travail s’ils sont absents :
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identité par défaut : **C3‑PO** (droïde de protocole).
   - Ignore les fournisseurs de canal en mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flux de réinitialisation (nouveau départ) :

```bash
pnpm gateway:dev:reset
```

Remarque : `--dev` est un indicateur de profil **global** et il est absorbé par certains runners.
Si vous devez l’indiquer explicitement, utilisez la forme avec variable d’environnement :

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` efface la configuration, les identifiants, les sessions et l’espace de travail dev (en utilisant
`trash`, pas `rm`), puis recrée la configuration dev par défaut.

Conseil : si une passerelle non dev est déjà en cours d’exécution (launchd/systemd), arrêtez-la d’abord :

```bash
openclaw gateway stop
```

## Journalisation de flux brut (OpenClaw)

OpenClaw peut journaliser le **flux assistant brut** avant tout filtrage/formatage.
C’est le meilleur moyen de voir si le raisonnement arrive sous forme de deltas de texte brut
(ou comme blocs de thinking séparés).

Activez-la via la CLI :

```bash
pnpm gateway:watch --raw-stream
```

Surcharge facultative du chemin :

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

## Journalisation de segments bruts (pi-mono)

Pour capturer les **segments bruts compatibles OpenAI** avant leur analyse en blocs,
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

> Remarque : cela n’est émis que par les processus utilisant le
> fournisseur `openai-completions` de pi-mono.

## Notes de sécurité

- Les journaux de flux bruts peuvent inclure les prompts complets, la sortie des outils et les données utilisateur.
- Gardez les journaux en local et supprimez-les après le débogage.
- Si vous partagez des journaux, supprimez d’abord les secrets et les PII.
