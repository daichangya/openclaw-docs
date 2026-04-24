---
read_when:
    - Conception ou refactorisation de la compréhension des médias
    - Ajustement du prétraitement audio/vidéo/image entrant
summary: Compréhension optionnelle des images/audio/vidéos entrants avec replis provider + CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-04-24T07:19:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Compréhension des médias - Entrants (2026-01-17)

OpenClaw peut **résumer les médias entrants** (image/audio/vidéo) avant l’exécution du pipeline de réponse. Il détecte automatiquement lorsque des outils locaux ou des clés provider sont disponibles, et peut être désactivé ou personnalisé. Si la compréhension est désactivée, les modèles reçoivent quand même les fichiers/URL d’origine comme d’habitude.

Le comportement média spécifique aux vendors est enregistré par les Plugins vendor, tandis que le cœur d’OpenClaw possède la configuration partagée `tools.media`, l’ordre de repli et l’intégration au pipeline de réponse.

## Objectifs

- Facultatif : prédigérer les médias entrants en texte court pour un routage plus rapide et une meilleure analyse des commandes.
- Préserver la livraison du média d’origine au modèle (toujours).
- Prendre en charge les **API provider** et les **replis CLI**.
- Permettre plusieurs modèles avec un repli ordonné (erreur/taille/délai d’attente).

## Comportement de haut niveau

1. Collecter les pièces jointes entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Pour chaque capacité activée (image/audio/vidéo), sélectionner les pièces jointes selon la politique (par défaut : **première**).
3. Choisir la première entrée de modèle éligible (taille + capacité + auth).
4. Si un modèle échoue ou si le média est trop volumineux, **revenir à l’entrée suivante**.
5. En cas de succès :
   - `Body` devient un bloc `[Image]`, `[Audio]`, ou `[Video]`.
   - L’audio définit `{{Transcript}}` ; l’analyse de commande utilise le texte de légende lorsqu’il est présent, sinon la transcription.
   - Les légendes sont préservées comme `User text:` dans le bloc.

Si la compréhension échoue ou est désactivée, **le flux de réponse continue** avec le corps d’origine + les pièces jointes.

## Vue d’ensemble de la configuration

`tools.media` prend en charge des **modèles partagés** plus des remplacements par capacité :

- `tools.media.models` : liste de modèles partagée (utilisez `capabilities` pour filtrer).
- `tools.media.image` / `tools.media.audio` / `tools.media.video` :
  - valeurs par défaut (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - remplacements provider (`baseUrl`, `headers`, `providerOptions`)
  - options audio Deepgram via `tools.media.audio.providerOptions.deepgram`
  - contrôles d’écho de transcription audio (`echoTranscript`, par défaut `false` ; `echoFormat`)
  - **liste `models` par capacité** facultative (préférée avant les modèles partagés)
  - politique `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (filtrage facultatif par canal/type de chat/clé de session)
- `tools.media.concurrency` : nombre maximal d’exécutions simultanées par capacité (par défaut **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Entrées de modèle

Chaque entrée `models[]` peut être de type **provider** ou **CLI** :

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Les modèles CLI peuvent aussi utiliser :

- `{{MediaDir}}` (répertoire contenant le fichier média)
- `{{OutputDir}}` (répertoire de travail créé pour cette exécution)
- `{{OutputBase}}` (chemin de base du fichier de travail, sans extension)

## Valeurs par défaut et limites

Valeurs par défaut recommandées :

- `maxChars` : **500** pour image/vidéo (court, pratique pour les commandes)
- `maxChars` : **non défini** pour l’audio (transcription complète sauf si vous définissez une limite)
- `maxBytes` :
  - image : **10MB**
  - audio : **20MB**
  - vidéo : **50MB**

Règles :

- Si le média dépasse `maxBytes`, ce modèle est ignoré et **le modèle suivant est essayé**.
- Les fichiers audio plus petits que **1024 octets** sont traités comme vides/corrompus et ignorés avant la transcription provider/CLI.
- Si le modèle renvoie plus de `maxChars`, la sortie est tronquée.
- `prompt` prend par défaut la forme simple « Describe the {media}. » plus l’indication `maxChars` (image/vidéo uniquement).
- Si le modèle d’image principal actif prend déjà en charge nativement la vision, OpenClaw ignore le bloc de résumé `[Image]` et transmet à la place l’image d’origine au modèle.
- Si un modèle principal Gateway/WebChat est limité au texte, les pièces jointes image sont préservées comme références externalisées `media://inbound/*` afin que l’outil image ou le modèle d’image configuré puisse toujours les inspecter au lieu de perdre la pièce jointe.
- Les requêtes explicites `openclaw infer image describe --model <provider/model>` sont différentes : elles exécutent directement ce provider/modèle compatible image, y compris les références Ollama comme `ollama/qwen2.5vl:7b`.
- Si `<capability>.enabled: true` mais qu’aucun modèle n’est configuré, OpenClaw essaie le **modèle de réponse actif** lorsque son provider prend en charge cette capacité.

### Détection automatique de la compréhension des médias (par défaut)

Si `tools.media.<capability>.enabled` n’est **pas** défini à `false` et que vous n’avez pas
configuré de modèles, OpenClaw détecte automatiquement dans cet ordre et **s’arrête à la première option fonctionnelle** :

1. **Modèle de réponse actif** lorsque son provider prend en charge la capacité.
2. Références primary/fallback de **`agents.defaults.imageModel`** (image uniquement).
3. **CLI locaux** (audio uniquement ; s’ils sont installés)
   - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le petit modèle intégré)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)
4. **Gemini CLI** (`gemini`) avec `read_many_files`
5. **Authentification provider**
   - Les entrées configurées `models.providers.*` qui prennent en charge la capacité sont essayées avant l’ordre de repli intégré.
   - Les providers de configuration image uniquement avec un modèle compatible image s’enregistrent automatiquement pour la compréhension des médias même lorsqu’ils ne sont pas un Plugin vendor intégré.
   - La compréhension d’image Ollama est disponible lorsqu’elle est sélectionnée explicitement, par exemple via `agents.defaults.imageModel` ou `openclaw infer image describe --model ollama/<vision-model>`.
   - Ordre de repli intégré :
     - Audio : OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Image : OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Vidéo : Google → Qwen → Moonshot

Pour désactiver la détection automatique, définissez :

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Remarque : la détection de binaire fait au mieux sur macOS/Linux/Windows ; assurez-vous que le CLI est sur `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.

### Prise en charge de l’environnement proxy (modèles provider)

Lorsque la compréhension des médias **audio** et **vidéo** basée sur provider est activée, OpenClaw respecte les variables d’environnement proxy sortantes standard pour les appels HTTP provider :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si aucune variable d’environnement proxy n’est définie, la compréhension des médias utilise une sortie directe.
Si la valeur du proxy est mal formée, OpenClaw journalise un avertissement et revient à une récupération directe.

## Capacités (facultatif)

Si vous définissez `capabilities`, l’entrée ne s’exécute que pour ces types de médias. Pour les listes partagées, OpenClaw peut inférer des valeurs par défaut :

- `openai`, `anthropic`, `minimax` : **image**
- `minimax-portal` : **image**
- `moonshot` : **image + vidéo**
- `openrouter` : **image**
- `google` (API Gemini) : **image + audio + vidéo**
- `qwen` : **image + vidéo**
- `mistral` : **audio**
- `zai` : **image**
- `groq` : **audio**
- `xai` : **audio**
- `deepgram` : **audio**
- Tout catalogue `models.providers.<id>.models[]` avec un modèle compatible image : **image**

Pour les entrées CLI, **définissez `capabilities` explicitement** afin d’éviter des correspondances surprenantes.
Si vous omettez `capabilities`, l’entrée est éligible pour la liste dans laquelle elle apparaît.

## Matrice de prise en charge provider (intégrations OpenClaw)

| Capacité | Intégration provider                                                                                                         | Remarques                                                                                                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image    | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, providers de configuration | Les Plugins vendor enregistrent la prise en charge image ; `openai-codex/*` utilise le plumbing du provider OAuth ; `codex/*` utilise un tour app-server Codex borné ; MiniMax et MiniMax OAuth utilisent tous deux `MiniMax-VL-01` ; les providers de configuration compatibles image s’enregistrent automatiquement. |
| Audio    | OpenAI, Groq, Deepgram, Google, Mistral                                                                                      | Transcription provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                                   |
| Vidéo    | Google, Qwen, Moonshot                                                                                                       | Compréhension vidéo provider via des Plugins vendor ; la compréhension vidéo Qwen utilise les points de terminaison Standard DashScope.                                                                                                     |

Remarque MiniMax :

- La compréhension d’image `minimax` et `minimax-portal` provient du provider média `MiniMax-VL-01` détenu par le Plugin.
- Le catalogue texte MiniMax intégré commence toujours en texte uniquement ; des entrées explicites `models.providers.minimax` matérialisent des références de chat M2.7 compatibles image.

## Conseils de sélection de modèle

- Préférez le modèle le plus puissant de dernière génération disponible pour chaque capacité média lorsque la qualité et la sécurité comptent.
- Pour les agents outillés manipulant des entrées non fiables, évitez les modèles média plus anciens ou plus faibles.
- Gardez au moins un repli par capacité pour la disponibilité (modèle de qualité + modèle plus rapide/moins cher).
- Les replis CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API provider sont indisponibles.
- Remarque `parakeet-mlx` : avec `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque le format de sortie est `txt` (ou non spécifié) ; les formats non `txt` reviennent à stdout.

## Politique des pièces jointes

La clé `attachments` par capacité contrôle quelles pièces jointes sont traitées :

- `mode` : `first` (par défaut) ou `all`
- `maxAttachments` : limite le nombre traité (par défaut **1**)
- `prefer` : `first`, `last`, `path`, `url`

Lorsque `mode: "all"`, les sorties sont étiquetées `[Image 1/2]`, `[Audio 2/2]`, etc.

Comportement d’extraction des pièces jointes fichier :

- Le texte extrait des fichiers est encapsulé comme **contenu externe non fiable** avant d’être ajouté au prompt média.
- Le bloc injecté utilise des marqueurs de frontière explicites comme
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées
  `Source: External`.
- Ce chemin d’extraction de pièces jointes omet volontairement la longue bannière
  `SECURITY NOTICE:` afin d’éviter d’alourdir le prompt média ; les marqueurs de frontière et les métadonnées restent néanmoins présents.
- Si un fichier n’a pas de texte extractible, OpenClaw injecte `[No extractable text]`.
- Si un PDF retombe sur des images de pages rendues dans ce chemin, le prompt média conserve
  le placeholder `[PDF content rendered to images; images not forwarded to model]`
  parce que cette étape d’extraction de pièces jointes transmet des blocs de texte, et non les images PDF rendues.

## Exemples de configuration

### 1) Liste de modèles partagée + remplacements

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Audio + vidéo uniquement (image désactivée)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Compréhension d’image facultative

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Entrée unique multimodale (capacités explicites)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Sortie d’état

Lorsque la compréhension des médias s’exécute, `/status` inclut une courte ligne de résumé :

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Cela affiche les résultats par capacité ainsi que le provider/modèle choisi le cas échéant.

## Remarques

- La compréhension est **au mieux**. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont toujours transmises aux modèles même lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter où la compréhension s’exécute (par ex. uniquement dans les DM).

## Documentation associée

- [Configuration](/fr/gateway/configuration)
- [Prise en charge des images et des médias](/fr/nodes/images)
