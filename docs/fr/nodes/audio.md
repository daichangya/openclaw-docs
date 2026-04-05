---
read_when:
    - Modifier la transcription audio ou la gestion des médias
summary: Comment l’audio entrant et les messages vocaux sont téléchargés, transcrits et injectés dans les réponses
title: Audio et messages vocaux
x-i18n:
    generated_at: "2026-04-05T12:47:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd464df24268b1104c9bbdb6f424ba90747342b4c0f4d2e39d95055708cbd0ae
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Messages vocaux (2026-01-17)

## Ce qui fonctionne

- **Compréhension des médias (audio)** : si la compréhension audio est activée (ou auto-détectée), OpenClaw :
  1. Localise la première pièce jointe audio (chemin local ou URL) et la télécharge si nécessaire.
  2. Applique `maxBytes` avant de l’envoyer à chaque entrée de modèle.
  3. Exécute la première entrée de modèle admissible dans l’ordre (provider ou CLI).
  4. En cas d’échec ou d’omission (taille/délai d’attente), il essaie l’entrée suivante.
  5. En cas de réussite, il remplace `Body` par un bloc `[Audio]` et définit `{{Transcript}}`.
- **Analyse des commandes** : lorsque la transcription réussit, `CommandBody`/`RawBody` sont définis sur la transcription afin que les commandes slash continuent de fonctionner.
- **Journalisation verbeuse** : avec `--verbose`, nous journalisons le moment où la transcription s’exécute et celui où elle remplace le corps.

## Auto-détection (par défaut)

Si vous **ne configurez pas de modèles** et que `tools.media.audio.enabled` n’est **pas** défini sur `false`,
OpenClaw effectue une auto-détection dans cet ordre et s’arrête à la première option fonctionnelle :

1. **Modèle de réponse actif** lorsque son provider prend en charge la compréhension audio.
2. **CLI locales** (si installées)
   - `sherpa-onnx-offline` (nécessite `SHERPA_ONNX_MODEL_DIR` avec encoder/decoder/joiner/tokens)
   - `whisper-cli` (depuis `whisper-cpp` ; utilise `WHISPER_CPP_MODEL` ou le petit modèle intégré)
   - `whisper` (CLI Python ; télécharge automatiquement les modèles)
3. **Gemini CLI** (`gemini`) à l’aide de `read_many_files`
4. **Authentification provider**
   - Les entrées configurées `models.providers.*` qui prennent en charge l’audio sont essayées en premier
   - Ordre de repli intégré : OpenAI → Groq → Deepgram → Google → Mistral

Pour désactiver l’auto-détection, définissez `tools.media.audio.enabled: false`.
Pour personnaliser, définissez `tools.media.audio.models`.
Remarque : la détection des binaires est effectuée au mieux sur macOS/Linux/Windows ; assurez-vous que la CLI est dans `PATH` (nous développons `~`), ou définissez un modèle CLI explicite avec un chemin de commande complet.

## Exemples de configuration

### Repli provider + CLI (OpenAI + Whisper CLI)

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

### Provider uniquement avec limitation par étendue

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

### Provider uniquement (Deepgram)

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

### Provider uniquement (Mistral Voxtral)

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

### Renvoyer la transcription dans le chat (activation explicite)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // false par défaut
        echoFormat: '📝 "{transcript}"', // facultatif, prend en charge {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Remarques et limites

- L’authentification provider suit l’ordre standard d’authentification des modèles (profils auth, variables d’environnement, `models.providers.*.apiKey`).
- Détails de configuration Groq : [Groq](/providers/groq).
- Deepgram récupère `DEEPGRAM_API_KEY` lorsque `provider: "deepgram"` est utilisé.
- Détails de configuration Deepgram : [Deepgram (transcription audio)](/providers/deepgram).
- Détails de configuration Mistral : [Mistral](/providers/mistral).
- Les providers audio peuvent remplacer `baseUrl`, `headers` et `providerOptions` via `tools.media.audio`.
- La limite de taille par défaut est de 20MB (`tools.media.audio.maxBytes`). Un audio trop volumineux est ignoré pour ce modèle et l’entrée suivante est essayée.
- Les fichiers audio minuscules/vides de moins de 1024 octets sont ignorés avant la transcription provider/CLI.
- `maxChars` par défaut pour l’audio est **non défini** (transcription complète). Définissez `tools.media.audio.maxChars` ou `maxChars` par entrée pour tronquer la sortie.
- La valeur par défaut automatique OpenAI est `gpt-4o-mini-transcribe` ; définissez `model: "gpt-4o-transcribe"` pour une meilleure précision.
- Utilisez `tools.media.audio.attachments` pour traiter plusieurs messages vocaux (`mode: "all"` + `maxAttachments`).
- La transcription est disponible dans les templates sous la forme `{{Transcript}}`.
- `tools.media.audio.echoTranscript` est désactivé par défaut ; activez-le pour renvoyer la confirmation de transcription dans le chat d’origine avant le traitement par l’agent.
- `tools.media.audio.echoFormat` personnalise le texte renvoyé (placeholder : `{transcript}`).
- La sortie stdout de la CLI est plafonnée (5MB) ; gardez une sortie CLI concise.

### Prise en charge de l’environnement proxy

La transcription audio basée sur un provider respecte les variables d’environnement proxy sortantes standard :

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Si aucune variable d’environnement proxy n’est définie, une sortie directe est utilisée. Si la configuration du proxy est mal formée, OpenClaw journalise un avertissement et revient à une récupération directe.

## Détection des mentions dans les groupes

Lorsque `requireMention: true` est défini pour une discussion de groupe, OpenClaw transcrit désormais l’audio **avant** de vérifier les mentions. Cela permet de traiter les messages vocaux même lorsqu’ils contiennent des mentions.

**Fonctionnement :**

1. Si un message vocal n’a pas de corps texte et que le groupe exige des mentions, OpenClaw effectue une transcription de « pré-vérification ».
2. La transcription est vérifiée par rapport aux motifs de mention (par exemple `@BotName`, déclencheurs emoji).
3. Si une mention est trouvée, le message continue dans le pipeline complet de réponse.
4. La transcription est utilisée pour la détection des mentions afin que les messages vocaux puissent franchir le filtre de mention.

**Comportement de repli :**

- Si la transcription échoue pendant la pré-vérification (délai d’attente, erreur API, etc.), le message est traité selon la détection de mention basée uniquement sur le texte.
- Cela garantit que les messages mixtes (texte + audio) ne sont jamais incorrectement rejetés.

**Désactivation par groupe/sujet Telegram :**

- Définissez `channels.telegram.groups.<chatId>.disableAudioPreflight: true` pour ignorer les vérifications de mention sur transcription de pré-vérification pour ce groupe.
- Définissez `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` pour remplacer par sujet (`true` pour ignorer, `false` pour forcer l’activation).
- La valeur par défaut est `false` (pré-vérification activée lorsque les conditions de filtrage par mention correspondent).

**Exemple :** un utilisateur envoie un message vocal disant « Hey @Claude, what's the weather? » dans un groupe Telegram avec `requireMention: true`. Le message vocal est transcrit, la mention est détectée et l’agent répond.

## Pièges courants

- Les règles d’étendue utilisent la première correspondance gagnante. `chatType` est normalisé en `direct`, `group` ou `room`.
- Assurez-vous que votre CLI se termine avec le code 0 et affiche du texte brut ; le JSON doit être ajusté via `jq -r .text`.
- Pour `parakeet-mlx`, si vous passez `--output-dir`, OpenClaw lit `<output-dir>/<media-basename>.txt` lorsque `--output-format` vaut `txt` (ou est omis) ; les formats de sortie autres que `txt` reviennent à l’analyse stdout.
- Gardez des délais d’attente raisonnables (`timeoutSeconds`, 60s par défaut) pour éviter de bloquer la file de réponses.
- La transcription de pré-vérification ne traite que la **première** pièce jointe audio pour la détection des mentions. Les fichiers audio supplémentaires sont traités pendant la phase principale de compréhension des médias.
