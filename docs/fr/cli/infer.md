---
read_when:
    - Ajout ou modification des commandes `openclaw infer`
    - Conception d’une automatisation headless de capacités stable
summary: CLI « infer-first » pour les workflows de modèle, d’image, d’audio, de TTS, de vidéo, du web et d’embedding pris en charge par un fournisseur
title: CLI d’inférence
x-i18n:
    generated_at: "2026-04-25T18:17:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23242bfa8a354b949473322f47da90876e05a5e54d467ca134f2e59c3ae8bb02
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` est la surface headless canonique pour les workflows d’inférence pris en charge par un fournisseur.

Il expose volontairement des familles de capacités, et non des noms RPC Gateway bruts ni des identifiants d’outils d’agent bruts.

## Transformer infer en Skill

Copiez-collez ceci dans un agent :

```text
Lisez https://docs.openclaw.ai/cli/infer, puis créez une Skill qui route mes workflows courants vers `openclaw infer`.
Concentrez-vous sur les exécutions de modèles, la génération d’images, la génération de vidéos, la transcription audio, le TTS, la recherche web et les embeddings.
```

Une bonne Skill basée sur infer doit :

- mapper les intentions utilisateur courantes vers la sous-commande infer correcte
- inclure quelques exemples infer canoniques pour les workflows qu’elle couvre
- préférer `openclaw infer ...` dans les exemples et suggestions
- éviter de redocumenter toute la surface infer dans le corps de la Skill

Couverture typique d’une Skill centrée sur infer :

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Pourquoi utiliser infer

`openclaw infer` fournit une CLI cohérente pour les tâches d’inférence prises en charge par un fournisseur dans OpenClaw.

Avantages :

- Utilisez les fournisseurs et modèles déjà configurés dans OpenClaw au lieu de brancher des wrappers ponctuels pour chaque backend.
- Gardez les workflows de modèle, image, transcription audio, TTS, vidéo, web et embedding sous un seul arbre de commandes.
- Utilisez une structure de sortie `--json` stable pour les scripts, l’automatisation et les workflows pilotés par agent.
- Préférez une surface OpenClaw first-party lorsque la tâche consiste fondamentalement à « exécuter une inférence ».
- Utilisez le chemin local normal sans nécessiter le Gateway pour la plupart des commandes infer.

Pour les vérifications de fournisseur de bout en bout, préférez `openclaw infer ...` une fois que les tests de fournisseur de niveau inférieur sont au vert. Cela exerce la CLI livrée, le chargement de configuration, la résolution de l’agent par défaut, l’activation des Plugin intégrés, la réparation des dépendances d’exécution, et le runtime de capacités partagé avant que la requête au fournisseur ne soit effectuée.

## Arbre de commandes

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Tâches courantes

Ce tableau associe les tâches d’inférence courantes à la commande infer correspondante.

| Tâche                   | Commande                                                               | Notes                                                 |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Exécuter un prompt texte/modèle | `openclaw infer model run --prompt "..." --json`                       | Utilise le chemin local normal par défaut             |
| Générer une image       | `openclaw infer image generate --prompt "..." --json`                  | Utilisez `image edit` en partant d’un fichier existant |
| Décrire un fichier image | `openclaw infer image describe --file ./image.png --json`              | `--model` doit être un `<provider/model>` compatible image |
| Transcrire de l’audio   | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` doit être `<provider/model>`                |
| Synthétiser de la parole | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` est orienté Gateway                      |
| Générer une vidéo       | `openclaw infer video generate --prompt "..." --json`                  | Prend en charge des indications fournisseur comme `--resolution` |
| Décrire un fichier vidéo | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` doit être `<provider/model>`                |
| Rechercher sur le web   | `openclaw infer web search --query "..." --json`                       |                                                       |
| Récupérer une page web  | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Créer des embeddings    | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Comportement

- `openclaw infer ...` est la surface CLI principale pour ces workflows.
- Utilisez `--json` lorsque la sortie sera consommée par une autre commande ou un script.
- Utilisez `--provider` ou `--model provider/model` lorsqu’un backend spécifique est requis.
- Pour `image describe`, `audio transcribe` et `video describe`, `--model` doit utiliser le format `<provider/model>`.
- Pour `image describe`, un `--model` explicite exécute directement ce fournisseur/modèle. Le modèle doit être compatible image dans le catalogue de modèles ou la configuration du fournisseur. `codex/<model>` exécute un tour borné de compréhension d’image via le serveur d’application Codex ; `openai-codex/<model>` utilise le chemin fournisseur OAuth OpenAI Codex.
- Les commandes d’exécution sans état utilisent le mode local par défaut.
- Les commandes d’état gérées par Gateway utilisent le Gateway par défaut.
- Le chemin local normal ne nécessite pas que le Gateway soit en cours d’exécution.
- `model run` est un one-shot. Les serveurs MCP ouverts via le runtime d’agent pour cette commande sont retirés après la réponse, aussi bien en exécution locale qu’avec `--gateway`, de sorte que des invocations scriptées répétées ne laissent pas de processus enfants MCP stdio actifs.

## Modèle

Utilisez `model` pour l’inférence de texte prise en charge par un fournisseur et l’inspection de modèles/fournisseurs.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Notes :

- `model run` réutilise le runtime d’agent afin que les surcharges de fournisseur/modèle se comportent comme dans une exécution normale d’agent.
- Comme `model run` est destiné à l’automatisation headless, il ne conserve pas les runtimes MCP intégrés par session après la fin de la commande.
- `model auth login`, `model auth logout` et `model auth status` gèrent l’état d’authentification fournisseur enregistré.

## Image

Utilisez `image` pour la génération, l’édition et la description.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Notes :

- Utilisez `image edit` en partant de fichiers d’entrée existants.
- Utilisez `image providers --json` pour vérifier quels fournisseurs d’image intégrés sont détectables, configurés, sélectionnés, et quelles capacités de génération/édition chaque fournisseur expose.
- Utilisez `image generate --model <provider/model> --json` comme smoke test CLI live le plus ciblé pour les changements de génération d’image. Exemple :

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La réponse JSON rapporte `ok`, `provider`, `model`, `attempts` et les chemins de sortie écrits. Lorsque `--output` est défini, l’extension finale peut suivre le type MIME renvoyé par le fournisseur.

- Pour `image describe`, `--model` doit être un `<provider/model>` compatible image.
- Pour les modèles de vision Ollama locaux, récupérez d’abord le modèle et définissez `OLLAMA_API_KEY` avec n’importe quelle valeur fictive, par exemple `ollama-local`. Voir [Ollama](/fr/providers/ollama#vision-and-image-description).

## Audio

Utilisez `audio` pour la transcription de fichiers.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Notes :

- `audio transcribe` sert à la transcription de fichiers, pas à la gestion de sessions en temps réel.
- `--model` doit être `<provider/model>`.

## TTS

Utilisez `tts` pour la synthèse vocale et l’état du fournisseur TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Notes :

- `tts status` utilise le Gateway par défaut, car il reflète l’état TTS géré par Gateway.
- Utilisez `tts providers`, `tts voices` et `tts set-provider` pour inspecter et configurer le comportement TTS.

## Vidéo

Utilisez `video` pour la génération et la description.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Notes :

- `video generate` accepte `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` et `--timeout-ms`, et les transmet au runtime de génération vidéo.
- `--model` doit être `<provider/model>` pour `video describe`.

## Web

Utilisez `web` pour les workflows de recherche et de récupération.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Notes :

- Utilisez `web providers` pour inspecter les fournisseurs disponibles, configurés et sélectionnés.

## Embedding

Utilisez `embedding` pour la création de vecteurs et l’inspection des fournisseurs d’embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Sortie JSON

Les commandes infer normalisent la sortie JSON dans une enveloppe partagée :

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Les champs de premier niveau sont stables :

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Pour les commandes de génération de médias, `outputs` contient les fichiers écrits par OpenClaw. Utilisez le `path`, le `mimeType`, la `size` et toutes les dimensions spécifiques au média présentes dans ce tableau pour l’automatisation, au lieu d’analyser la sortie stdout lisible par un humain.

## Pièges courants

```bash
# Mauvais
openclaw infer media image generate --prompt "friendly lobster"

# Bon
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Mauvais
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Bon
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Notes

- `openclaw capability ...` est un alias de `openclaw infer ...`.

## Lié

- [Référence CLI](/fr/cli)
- [Modèles](/fr/concepts/models)
