---
read_when:
    - Conception ou refactorisation de la compréhension des médias
    - Ajustement du prétraitement entrant audio/vidéo/image
summary: Compréhension des médias entrants image/audio/vidéo (facultative) avec repli fournisseur + CLI
title: Compréhension des médias
x-i18n:
    generated_at: "2026-04-05T12:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe36bd42250d48d12f4ff549e8644afa7be8e42ee51f8aff4f21f81b7ff060f4
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Compréhension des médias - Entrants (2026-01-17)

OpenClaw peut **résumer les médias entrants** (image/audio/vidéo) avant l’exécution du pipeline de réponse. Il détecte automatiquement lorsque des outils locaux ou des clés de fournisseur sont disponibles, et peut être désactivé ou personnalisé. Si la compréhension est désactivée, les modèles reçoivent quand même les fichiers/URL d’origine comme d’habitude.

Le comportement média spécifique à chaque fournisseur est enregistré par des plugins de fournisseur, tandis qu’OpenClaw
core gère la configuration partagée `tools.media`, l’ordre de repli et l’intégration au pipeline de réponse.

## Objectifs

- Facultatif : prétraiter les médias entrants en texte court pour un routage plus rapide et une meilleure analyse des commandes.
- Préserver la livraison du média d’origine au modèle (toujours).
- Prendre en charge les **API de fournisseur** et les **replis CLI**.
- Autoriser plusieurs modèles avec un ordre de repli (erreur/taille/timeout).

## Comportement général

1. Collecter les pièces jointes entrantes (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Pour chaque capacité activée (image/audio/vidéo), sélectionner les pièces jointes selon la politique (par défaut : **la première**).
3. Choisir la première entrée de modèle éligible (taille + capacité + authentification).
4. Si un modèle échoue ou si le média est trop volumineux, **passer à l’entrée suivante**.
5. En cas de succès :
   - `Body` devient un bloc `[Image]`, `[Audio]` ou `[Video]`.
   - L’audio définit `{{Transcript}}` ; l’analyse des commandes utilise le texte de légende lorsqu’il est présent,
     sinon la transcription.
   - Les légendes sont préservées comme `User text:` dans le bloc.

Si la compréhension échoue ou est désactivée, **le flux de réponse continue** avec le corps d’origine + les pièces jointes.

## Vue d’ensemble de la configuration

`tools.media` prend en charge des **modèles partagés** plus des remplacements par capacité :

- `tools.media.models` : liste de modèles partagés (utilisez `capabilities` pour les limiter).
- `tools.media.image` / `tools.media.audio` / `tools.media.video` :
  - valeurs par défaut (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - remplacements de fournisseur (`baseUrl`, `headers`, `providerOptions`)
  - options audio Deepgram via `tools.media.audio.providerOptions.deepgram`
  - contrôles d’écho de transcription audio (`echoTranscript`, valeur par défaut `false` ; `echoFormat`)
  - **liste `models` par capacité** facultative (prioritaire sur les modèles partagés)
  - politique `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (limitation facultative par canal/chatType/clé de session)
- `tools.media.concurrency` : nombre maximal d’exécutions de capacités concurrentes (par défaut **2**).

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
  model: "gpt-5.4-mini",
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

Les gabarits CLI peuvent aussi utiliser :

- `{{MediaDir}}` (répertoire contenant le fichier média)
- `{{OutputDir}}` (répertoire temporaire créé pour cette exécution)
- `{{OutputBase}}` (chemin de base du fichier temporaire, sans extension)

## Valeurs par défaut et limites

Valeurs par défaut recommandées :

- `maxChars` : **500** pour image/vidéo (court, adapté aux commandes)
- `maxChars` : **non défini** pour l’audio (transcription complète sauf si vous définissez une limite)
- `maxBytes` :
  - image : **10MB**
  - audio : **20MB**
  - vidéo : **50MB**

Règles :

- Si le média dépasse `maxBytes`, ce modèle est ignoré et **le modèle suivant est essayé**.
- Les fichiers audio inférieurs à **1024 bytes** sont traités comme vides/corrompus et ignorés avant la transcription via fournisseur/CLI.
- Si le modèle renvoie plus de `maxChars`, la sortie est tronquée.
- `prompt` utilise par défaut un simple « Describe the {media}. » plus la consigne `maxChars` (image/vidéo uniquement).
- Si le modèle d’image principal actif prend déjà en charge nativement la vision, OpenClaw
  ignore le bloc de résumé `[Image]` et transmet l’image d’origine au
  modèle à la place.
- Si `<capability>.enabled: true` mais qu’aucun modèle n’est configuré, OpenClaw essaie le
  **modèle de réponse actif** lorsque son fournisseur prend en charge cette capacité.

### Détection automatique de la compréhension des médias (par défaut)

Si `tools.media.<capability>.enabled` n’est **pas** défini à `false` et que vous n’avez
pas configuré de modèles, OpenClaw détecte automatiquement dans cet ordre et **s’arrête à la première
option fonctionnelle** :

1. **Modèle de réponse actif** lorsque son fournisseur prend en charge la capacité.
2. **`agents.defaults.imageModel`** refs primary/fallback (image uniquement).
3. **CLIs locales** (audio uniquement ; si installées)
   - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le petit modèle groupé)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)
4. **Gemini CLI** (`gemini`) en utilisant `read_many_files`
5. **Authentification fournisseur**
   - Les entrées configurées `models.providers.*` qui prennent en charge la capacité sont
     essayées avant l’ordre de repli groupé.
   - Les fournisseurs configurés image uniquement avec un modèle compatible image s’enregistrent automatiquement pour
     la compréhension des médias même lorsqu’ils ne sont pas un plugin fournisseur groupé.
   - Ordre de repli groupé :
     - Audio : OpenAI → Groq → Deepgram → Google → Mistral
     - Image : OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Vidéo : Google → Qwen → Moonshot

Pour désactiver l’auto-détection, définissez :

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

Remarque : la détection des binaires est effectuée en meilleur effort sur macOS/Linux/Windows ; assurez-vous que la CLI est sur le `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.

### Prise en charge de l’environnement proxy (modèles fournisseur)

Lorsque la compréhension des médias **audio** et **vidéo** basée sur un fournisseur est activée, OpenClaw
respecte les variables d’environnement proxy sortantes standard pour les appels HTTP au fournisseur :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si aucune variable env proxy n’est définie, la compréhension des médias utilise une sortie directe.
Si la valeur du proxy est mal formée, OpenClaw journalise un avertissement et revient à une
récupération directe.

## Capacités (facultatif)

Si vous définissez `capabilities`, l’entrée ne s’exécute que pour ces types de médias. Pour les listes
partagées, OpenClaw peut déduire des valeurs par défaut :

- `openai`, `anthropic`, `minimax` : **image**
- `minimax-portal` : **image**
- `moonshot` : **image + vidéo**
- `openrouter` : **image**
- `google` (API Gemini) : **image + audio + vidéo**
- `qwen` : **image + vidéo**
- `mistral` : **audio**
- `zai` : **image**
- `groq` : **audio**
- `deepgram` : **audio**
- Tout catalogue `models.providers.<id>.models[]` avec un modèle compatible image :
  **image**

Pour les entrées CLI, **définissez `capabilities` explicitement** afin d’éviter les correspondances surprenantes.
Si vous omettez `capabilities`, l’entrée est éligible pour la liste dans laquelle elle apparaît.

## Matrice de prise en charge des fournisseurs (intégrations OpenClaw)

| Capacité | Intégration fournisseur                                                              | Remarques                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Image    | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, fournisseurs configurés | Les plugins fournisseur enregistrent la prise en charge image ; MiniMax et MiniMax OAuth utilisent tous deux `MiniMax-VL-01` ; les fournisseurs configurés compatibles image s’enregistrent automatiquement. |
| Audio    | OpenAI, Groq, Deepgram, Google, Mistral                                              | Transcription via fournisseur (Whisper/Deepgram/Gemini/Voxtral).                                                                         |
| Vidéo    | Google, Qwen, Moonshot                                                               | Compréhension vidéo via fournisseur à travers des plugins fournisseur ; la compréhension vidéo Qwen utilise les points de terminaison DashScope Standard. |

Remarque MiniMax :

- La compréhension d’image `minimax` et `minimax-portal` provient du fournisseur média
  `MiniMax-VL-01` appartenant au plugin.
- Le catalogue texte MiniMax groupé reste initialement limité au texte ;
  des entrées explicites `models.providers.minimax` matérialisent des refs de chat M2.7 compatibles image.

## Conseils de sélection de modèle

- Préférez le modèle le plus puissant et de dernière génération disponible pour chaque capacité média lorsque la qualité et la sécurité comptent.
- Pour les agents avec outils gérant des entrées non fiables, évitez les anciens/modèles média plus faibles.
- Conservez au moins un repli par capacité pour la disponibilité (modèle de qualité + modèle plus rapide/moins coûteux).
- Les replis CLI (`whisper-cli`, `whisper`, `gemini`) sont utiles lorsque les API de fournisseur ne sont pas disponibles.
- Remarque `parakeet-mlx` : avec `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque le format de sortie est `txt` (ou non spécifié) ; les formats autres que `txt` reviennent à stdout.

## Politique des pièces jointes

Le paramètre `attachments` par capacité contrôle quelles pièces jointes sont traitées :

- `mode` : `first` (par défaut) ou `all`
- `maxAttachments` : limite du nombre traité (par défaut **1**)
- `prefer` : `first`, `last`, `path`, `url`

Quand `mode: "all"` est utilisé, les sorties sont étiquetées `[Image 1/2]`, `[Audio 2/2]`, etc.

Comportement d’extraction des pièces jointes de fichier :

- Le texte extrait du fichier est encapsulé comme **contenu externe non fiable** avant d’être
  ajouté à l’invite média.
- Le bloc injecté utilise des marqueurs de frontière explicites tels que
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées
  `Source: External`.
- Ce chemin d’extraction de pièce jointe omet volontairement la longue
  bannière `SECURITY NOTICE:` pour éviter de gonfler l’invite média ; les marqueurs de frontière
  et les métadonnées restent toutefois présents.
- Si un fichier ne contient aucun texte extractible, OpenClaw injecte `[No extractable text]`.
- Si un PDF revient à des images de pages rendues dans ce chemin, l’invite média conserve
  l’espace réservé `[PDF content rendered to images; images not forwarded to model]`
  parce que cette étape d’extraction de pièce jointe transmet des blocs de texte, pas les images PDF rendues.

## Exemples de configuration

### 1) Liste de modèles partagés + remplacements

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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
          { provider: "openai", model: "gpt-5.4-mini" },
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

### 4) Entrée multimodale unique (capacités explicites)

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

## Sortie de statut

Lorsque la compréhension des médias s’exécute, `/status` inclut une courte ligne récapitulative :

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Cela montre les résultats par capacité et le fournisseur/modèle choisi lorsque cela s’applique.

## Remarques

- La compréhension est fournie en **meilleur effort**. Les erreurs ne bloquent pas les réponses.
- Les pièces jointes sont toujours transmises aux modèles même lorsque la compréhension est désactivée.
- Utilisez `scope` pour limiter les endroits où la compréhension s’exécute (par ex. uniquement les DMs).

## Documentation associée

- [Configuration](/gateway/configuration)
- [Prise en charge des images et médias](/nodes/images)
