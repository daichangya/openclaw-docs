---
read_when:
    - Modifier la transcription audio ou la gestion des médias
summary: Comment l’audio entrant/les notes vocales sont téléchargés, transcrits et injectés dans les réponses
title: Audio et notes vocales
x-i18n:
    generated_at: "2026-04-24T07:18:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Notes vocales (2026-01-17)

## Ce qui fonctionne

- **Compréhension des médias (audio)** : si la compréhension audio est activée (ou auto-détectée), OpenClaw :
  1. Localise la première pièce jointe audio (chemin local ou URL) et la télécharge si nécessaire.
  2. Applique `maxBytes` avant l’envoi à chaque entrée de modèle.
  3. Exécute la première entrée de modèle admissible dans l’ordre (fournisseur ou CLI).
  4. En cas d’échec ou d’ignorance (taille/délai), essaie l’entrée suivante.
  5. En cas de réussite, remplace `Body` par un bloc `[Audio]` et définit `{{Transcript}}`.
- **Analyse des commandes** : lorsque la transcription réussit, `CommandBody`/`RawBody` sont définis sur la transcription afin que les commandes slash continuent de fonctionner.
- **Journalisation verbeuse** : en mode `--verbose`, nous journalisons quand la transcription s’exécute et quand elle remplace le corps.

## Auto-détection (par défaut)

Si vous **ne configurez pas de modèles** et que `tools.media.audio.enabled` n’est **pas** défini à `false`,
OpenClaw détecte automatiquement dans cet ordre et s’arrête à la première option fonctionnelle :

1. **Le modèle de réponse actif** lorsque son fournisseur prend en charge la compréhension audio.
2. **CLI locales** (si installées)
   - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
   - `whisper-cli` (de `whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le petit modèle groupé)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)
3. **Gemini CLI** (`gemini`) utilisant `read_many_files`
4. **Authentification du fournisseur**
   - Les entrées configurées `models.providers.*` qui prennent en charge l’audio sont essayées en premier
   - Ordre de secours groupé : OpenAI → Groq → Deepgram → Google → Mistral

Pour désactiver l’auto-détection, définissez `tools.media.audio.enabled: false`.
Pour personnaliser, définissez `tools.media.audio.models`.
Remarque : la détection des binaires est en meilleur effort sur macOS/Linux/Windows ; assurez-vous que la CLI est sur `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.

## Exemples de configuration

### Fournisseur + repli CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Fournisseur uniquement avec filtrage par portée

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Fournisseur uniquement (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Fournisseur uniquement (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Renvoyer la transcription dans le chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Remarques et limites

- L’authentification du fournisseur suit l’ordre standard d’authentification des modèles (profils d’authentification, variables d’environnement, `models.providers.*.apiKey`).
- Détails de configuration Groq : [Groq](/fr/providers/groq).
- Deepgram récupère `DEEPGRAM_API_KEY` lorsque `provider: "deepgram"` est utilisé.
- Détails de configuration Deepgram : [Deepgram (transcription audio)](/fr/providers/deepgram).
- Détails de configuration Mistral : [Mistral](/fr/providers/mistral).
- Les fournisseurs audio peuvent remplacer `baseUrl`, `headers` et `providerOptions` via `tools.media.audio`.
- La limite de taille par défaut est de 20MB (`tools.media.audio.maxBytes`). Les audios trop volumineux sont ignorés pour ce modèle et l’entrée suivante est essayée.
- Les fichiers audio minuscules/vides de moins de 1024 octets sont ignorés avant la transcription fournisseur/CLI.
- `maxChars` par défaut pour l’audio est **non défini** (transcription complète). Définissez `tools.media.audio.maxChars` ou `maxChars` par entrée pour tronquer la sortie.
- La valeur par défaut automatique OpenAI est `gpt-4o-mini-transcribe` ; définissez `model: "gpt-4o-transcribe"` pour une précision supérieure.
- Utilisez `tools.media.audio.attachments` pour traiter plusieurs notes vocales (`mode: "all"` + `maxAttachments`).
- La transcription est disponible pour les modèles via `{{Transcript}}`.
- `tools.media.audio.echoTranscript` est désactivé par défaut ; activez-le pour renvoyer une confirmation de transcription dans le chat d’origine avant le traitement par l’agent.
- `tools.media.audio.echoFormat` personnalise le texte de renvoi (espace réservé : `{transcript}`).
- La sortie stdout CLI est limitée (5MB) ; gardez une sortie CLI concise.

### Prise en charge de l’environnement proxy

La transcription audio basée sur un fournisseur respecte les variables d’environnement proxy standard de sortie :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si aucune variable d’environnement proxy n’est définie, une sortie directe est utilisée. Si la configuration du proxy est mal formée, OpenClaw journalise un avertissement et revient à un accès direct.

## Détection de mention dans les groupes

Lorsque `requireMention: true` est défini pour un chat de groupe, OpenClaw transcrit désormais l’audio **avant** de vérifier les mentions. Cela permet de traiter les notes vocales même lorsqu’elles contiennent des mentions.

**Fonctionnement :**

1. Si un message vocal n’a pas de corps de texte et que le groupe exige des mentions, OpenClaw effectue une transcription de « prévol ».
2. La transcription est vérifiée par rapport aux motifs de mention (par ex. `@BotName`, déclencheurs emoji).
3. Si une mention est trouvée, le message poursuit le pipeline de réponse complet.
4. La transcription est utilisée pour la détection de mention afin que les notes vocales puissent passer la porte de mention.

**Comportement de secours :**

- Si la transcription échoue pendant le prévol (délai dépassé, erreur API, etc.), le message est traité selon la détection de mention basée uniquement sur le texte.
- Cela garantit que les messages mixtes (texte + audio) ne sont jamais incorrectement rejetés.

**Désactivation par groupe/sujet Telegram :**

- Définissez `channels.telegram.groups.<chatId>.disableAudioPreflight: true` pour ignorer les vérifications de mention par transcription de prévol pour ce groupe.
- Définissez `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` pour remplacer par sujet (`true` pour ignorer, `false` pour forcer l’activation).
- La valeur par défaut est `false` (prévol activé lorsque les conditions de filtrage par mention correspondent).

**Exemple :** un utilisateur envoie une note vocale disant « Hey @Claude, what's the weather? » dans un groupe Telegram avec `requireMention: true`. La note vocale est transcrite, la mention est détectée, et l’agent répond.

## Pièges

- Les règles de portée utilisent le principe du premier match gagnant. `chatType` est normalisé en `direct`, `group` ou `room`.
- Assurez-vous que votre CLI se termine avec 0 et affiche du texte brut ; le JSON doit être ajusté via `jq -r .text`.
- Pour `parakeet-mlx`, si vous transmettez `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque `--output-format` vaut `txt` (ou est omis) ; les formats de sortie non `txt` reviennent à l’analyse stdout.
- Gardez des délais raisonnables (`timeoutSeconds`, 60s par défaut) afin d’éviter de bloquer la file de réponses.
- La transcription de prévol ne traite que la **première** pièce jointe audio pour la détection de mention. Les audios supplémentaires sont traités pendant la phase principale de compréhension des médias.

## Voir aussi

- [Compréhension des médias](/fr/nodes/media-understanding)
- [Mode Talk](/fr/nodes/talk)
- [Réveil vocal](/fr/nodes/voicewake)
