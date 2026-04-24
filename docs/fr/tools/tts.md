---
read_when:
    - Activer la synthèse vocale pour les réponses
    - Configurer les providers ou les limites TTS
    - Utiliser les commandes /tts
summary: Synthèse vocale (TTS) pour les réponses sortantes
title: Synthèse vocale
x-i18n:
    generated_at: "2026-04-24T07:39:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw peut convertir les réponses sortantes en audio à l’aide d’ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI, ou xAI.
Cela fonctionne partout où OpenClaw peut envoyer de l’audio.

## Services pris en charge

- **ElevenLabs** (provider principal ou de repli)
- **Google Gemini** (provider principal ou de repli ; utilise l’API TTS Gemini)
- **Microsoft** (provider principal ou de repli ; l’implémentation intégrée actuelle utilise `node-edge-tts`)
- **MiniMax** (provider principal ou de repli ; utilise l’API T2A v2)
- **OpenAI** (provider principal ou de repli ; également utilisé pour les résumés)
- **xAI** (provider principal ou de repli ; utilise l’API TTS xAI)

### Remarques sur la synthèse vocale Microsoft

Le provider de synthèse vocale Microsoft intégré utilise actuellement le service
TTS neuronal en ligne de Microsoft Edge via la bibliothèque `node-edge-tts`. Il s’agit d’un service hébergé (et non
local), qui utilise les points de terminaison Microsoft, et qui ne nécessite pas de clé API.
`node-edge-tts` expose des options de configuration de la voix et des formats de sortie, mais
toutes les options ne sont pas prises en charge par le service. Les anciennes configurations et les entrées de directive
utilisant `edge` continuent de fonctionner et sont normalisées en `microsoft`.

Comme ce chemin repose sur un service web public sans SLA ni quota publiés,
considérez-le comme du best-effort. Si vous avez besoin de limites garanties et d’un support, utilisez OpenAI
ou ElevenLabs.

## Clés facultatives

Si vous voulez OpenAI, ElevenLabs, Google Gemini, MiniMax, ou xAI :

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

La synthèse vocale Microsoft ne nécessite **pas** de clé API.

Si plusieurs providers sont configurés, le provider sélectionné est utilisé en premier et les autres servent de solutions de repli.
Le résumé automatique utilise le `summaryModel` configuré (ou `agents.defaults.model.primary`),
donc ce provider doit également être authentifié si vous activez les résumés.

## Liens de service

- [Guide OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Référence de l’API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Authentification ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formats de sortie Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Est-ce activé par défaut ?

Non. L’auto‑TTS est **désactivé** par défaut. Activez-le dans la configuration avec
`messages.tts.auto` ou localement avec `/tts on`.

Lorsque `messages.tts.provider` n’est pas défini, OpenClaw choisit le premier
provider de synthèse vocale configuré dans l’ordre de sélection automatique du registre.

## Configuration

La configuration TTS se trouve sous `messages.tts` dans `openclaw.json`.
Le schéma complet se trouve dans [Configuration du Gateway](/fr/gateway/configuration).

### Configuration minimale (activation + provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI principal avec ElevenLabs en repli

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft principal (sans clé API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Google Gemini principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Le TTS Google Gemini utilise le chemin de clé API Gemini. Une clé API Google Cloud Console
restreinte à l’API Gemini est valide ici, et c’est le même style de clé utilisé
par le provider intégré de génération d’images Google. L’ordre de résolution est
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

Le TTS xAI utilise le même chemin `XAI_API_KEY` que le provider de modèle Grok intégré.
L’ordre de résolution est `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Les voix live actuelles sont `ara`, `eve`, `leo`, `rex`, `sal`, et `una` ; `eve` est
la valeur par défaut. `language` accepte une balise BCP-47 ou `auto`.

### Désactiver la synthèse vocale Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Limites personnalisées + chemin des préférences

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Répondre uniquement avec de l’audio après un message vocal entrant

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Désactiver le résumé automatique pour les réponses longues

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Ensuite exécutez :

```
/tts summary off
```

### Remarques sur les champs

- `auto` : mode auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envoie uniquement de l’audio après un message vocal entrant.
  - `tagged` envoie uniquement de l’audio lorsque la réponse inclut des directives `[[tts:key=value]]` ou un bloc `[[tts:text]]...[[/tts:text]]`.
- `enabled` : bascule héritée (doctor la migre vers `auto`).
- `mode` : `"final"` (par défaut) ou `"all"` (inclut les réponses d’outil/bloc).
- `provider` : identifiant de provider vocal tel que `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"`, ou `"openai"` (le repli est automatique).
- Si `provider` n’est **pas défini**, OpenClaw utilise le premier provider vocal configuré dans l’ordre de sélection automatique du registre.
- L’ancien `provider: "edge"` fonctionne toujours et est normalisé en `microsoft`.
- `summaryModel` : modèle économique facultatif pour le résumé automatique ; par défaut `agents.defaults.model.primary`.
  - Accepte `provider/model` ou un alias de modèle configuré.
- `modelOverrides` : permet au modèle d’émettre des directives TTS (activé par défaut).
  - `allowProvider` vaut par défaut `false` (le changement de provider est opt-in).
- `providers.<id>` : paramètres possédés par le provider, indexés par identifiant de provider vocal.
- Les anciens blocs provider directs (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) sont automatiquement migrés vers `messages.tts.providers.<id>` au chargement.
- `maxTextLength` : limite stricte pour l’entrée TTS (caractères). `/tts audio` échoue si elle est dépassée.
- `timeoutMs` : délai d’attente de requête (ms).
- `prefsPath` : remplace le chemin JSON local des préférences (provider/limite/résumé).
- Les valeurs `apiKey` reviennent aux variables d’environnement (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl` : remplace l’URL de base de l’API ElevenLabs.
- `providers.openai.baseUrl` : remplace le point de terminaison TTS OpenAI.
  - Ordre de résolution : `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Les valeurs non par défaut sont traitées comme des points de terminaison TTS compatibles OpenAI, donc les noms personnalisés de modèle et de voix sont acceptés.
- `providers.elevenlabs.voiceSettings` :
  - `stability`, `similarityBoost`, `style` : `0..1`
  - `useSpeakerBoost` : `true|false`
  - `speed` : `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization` : `auto|on|off`
- `providers.elevenlabs.languageCode` : ISO 639-1 sur 2 lettres (par ex. `en`, `de`)
- `providers.elevenlabs.seed` : entier `0..4294967295` (déterminisme best-effort)
- `providers.minimax.baseUrl` : remplace l’URL de base de l’API MiniMax (par défaut `https://api.minimax.io`, env : `MINIMAX_API_HOST`).
- `providers.minimax.model` : modèle TTS (par défaut `speech-2.8-hd`, env : `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId` : identifiant de voix (par défaut `English_expressive_narrator`, env : `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed` : vitesse de lecture `0.5..2.0` (par défaut 1.0).
- `providers.minimax.vol` : volume `(0, 10]` (par défaut 1.0 ; doit être strictement supérieur à 0).
- `providers.minimax.pitch` : décalage de hauteur `-12..12` (par défaut 0).
- `providers.google.model` : modèle TTS Gemini (par défaut `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName` : nom de voix préconstruit Gemini (par défaut `Kore` ; `voice` est également accepté).
- `providers.google.baseUrl` : remplace l’URL de base de l’API Gemini. Seul `https://generativelanguage.googleapis.com` est accepté.
  - Si `messages.tts.providers.google.apiKey` est omis, le TTS peut réutiliser `models.providers.google.apiKey` avant le repli vers les variables d’environnement.
- `providers.xai.apiKey` : clé API TTS xAI (env : `XAI_API_KEY`).
- `providers.xai.baseUrl` : remplace l’URL de base TTS xAI (par défaut `https://api.x.ai/v1`, env : `XAI_BASE_URL`).
- `providers.xai.voiceId` : identifiant de voix xAI (par défaut `eve` ; voix live actuelles : `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language` : code langue BCP-47 ou `auto` (par défaut `en`).
- `providers.xai.responseFormat` : `mp3`, `wav`, `pcm`, `mulaw`, ou `alaw` (par défaut `mp3`).
- `providers.xai.speed` : surcharge de vitesse native provider.
- `providers.microsoft.enabled` : autorise l’utilisation de la synthèse vocale Microsoft (par défaut `true` ; sans clé API).
- `providers.microsoft.voice` : nom de voix neuronale Microsoft (par ex. `en-US-MichelleNeural`).
- `providers.microsoft.lang` : code langue (par ex. `en-US`).
- `providers.microsoft.outputFormat` : format de sortie Microsoft (par ex. `audio-24khz-48kbitrate-mono-mp3`).
  - Voir les formats de sortie Microsoft Speech pour les valeurs valides ; tous les formats ne sont pas pris en charge par le transport intégré adossé à Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume` : chaînes de pourcentage (par ex. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles` : écrit des sous-titres JSON à côté du fichier audio.
- `providers.microsoft.proxy` : URL de proxy pour les requêtes de synthèse vocale Microsoft.
- `providers.microsoft.timeoutMs` : surcharge du délai d’attente de requête (ms).
- `edge.*` : alias hérité pour les mêmes paramètres Microsoft.

## Surcharges pilotées par le modèle (activées par défaut)

Par défaut, le modèle **peut** émettre des directives TTS pour une seule réponse.
Lorsque `messages.tts.auto` vaut `tagged`, ces directives sont requises pour déclencher l’audio.

Lorsqu’il est activé, le modèle peut émettre des directives `[[tts:...]]` pour remplacer la voix
pour une seule réponse, plus un bloc facultatif `[[tts:text]]...[[/tts:text]]` pour
fournir des balises expressives (rire, indications de chant, etc.) qui ne doivent apparaître
que dans l’audio.

Les directives `provider=...` sont ignorées sauf si `modelOverrides.allowProvider: true`.

Exemple de payload de réponse :

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Clés de directive disponibles (lorsqu’elles sont activées) :

- `provider` (identifiant de provider vocal enregistré, par exemple `openai`, `elevenlabs`, `google`, `minimax`, ou `microsoft` ; nécessite `allowProvider: true`)
- `voice` (voix OpenAI), `voiceName` / `voice_name` / `google_voice` (voix Google), ou `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (modèle TTS OpenAI, identifiant de modèle ElevenLabs, ou modèle MiniMax) ou `google_model` (modèle TTS Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (hauteur MiniMax, -12 à 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Désactiver toutes les surcharges pilotées par le modèle :

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Liste d’autorisation facultative (active le changement de provider tout en gardant les autres réglages configurables) :

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Préférences par utilisateur

Les commandes slash écrivent des surcharges locales dans `prefsPath` (par défaut :
`~/.openclaw/settings/tts.json`, remplaçable avec `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Champs stockés :

- `enabled`
- `provider`
- `maxLength` (seuil de résumé ; par défaut 1500 caractères)
- `summarize` (par défaut `true`)

Ils remplacent `messages.tts.*` pour cet hôte.

## Formats de sortie (fixes)

- **Feishu / Matrix / Telegram / WhatsApp** : message vocal Opus (`opus_48000_64` depuis ElevenLabs, `opus` depuis OpenAI).
  - 48 kHz / 64 kb/s constitue un bon compromis pour les messages vocaux.
- **Autres canaux** : MP3 (`mp3_44100_128` depuis ElevenLabs, `mp3` depuis OpenAI).
  - 44,1 kHz / 128 kb/s est l’équilibre par défaut pour la clarté de la parole.
- **MiniMax** : MP3 (modèle `speech-2.8-hd`, fréquence d’échantillonnage de 32 kHz). Le format note vocale n’est pas pris en charge nativement ; utilisez OpenAI ou ElevenLabs pour des messages vocaux Opus garantis.
- **Google Gemini** : le TTS de l’API Gemini renvoie du PCM brut en 24 kHz. OpenClaw l’enveloppe en WAV pour les pièces jointes audio et renvoie directement le PCM pour Talk/téléphonie. Le format natif de note vocale Opus n’est pas pris en charge par ce chemin.
- **xAI** : MP3 par défaut ; `responseFormat` peut être `mp3`, `wav`, `pcm`, `mulaw`, ou `alaw`. OpenClaw utilise le point de terminaison TTS REST batch de xAI et renvoie une pièce jointe audio complète ; le WebSocket TTS en streaming de xAI n’est pas utilisé par ce chemin provider. Le format natif de note vocale Opus n’est pas pris en charge par ce chemin.
- **Microsoft** : utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`).
  - Le transport intégré accepte `outputFormat`, mais tous les formats ne sont pas disponibles depuis le service.
  - Les valeurs de format de sortie suivent les formats de sortie Microsoft Speech (y compris Ogg/WebM Opus).
  - Telegram `sendVoice` accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin
    de messages vocaux Opus garantis.
  - Si le format de sortie Microsoft configuré échoue, OpenClaw réessaie avec MP3.

Les formats de sortie OpenAI/ElevenLabs sont fixes par canal (voir ci-dessus).

## Comportement de l’auto-TTS

Lorsqu’il est activé, OpenClaw :

- ignore le TTS si la réponse contient déjà un média ou une directive `MEDIA:`.
- ignore les réponses très courtes (< 10 caractères).
- résume les réponses longues lorsqu’il est activé en utilisant `agents.defaults.model.primary` (ou `summaryModel`).
- joint l’audio généré à la réponse.

Si la réponse dépasse `maxLength` et que le résumé est désactivé (ou qu’il n’y a pas de clé API pour le
modèle de résumé), l’audio
est ignoré et la réponse texte normale est envoyée.

## Diagramme de flux

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Utilisation des commandes slash

Il existe une seule commande : `/tts`.
Voir [Commandes slash](/fr/tools/slash-commands) pour les détails d’activation.

Remarque Discord : `/tts` est une commande Discord intégrée, donc OpenClaw enregistre
`/voice` comme commande native à cet endroit. Le texte `/tts ...` fonctionne toujours.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Remarques :

- Les commandes nécessitent un expéditeur autorisé (les règles de liste d’autorisation/propriétaire s’appliquent toujours).
- `commands.text` ou l’enregistrement de commande native doit être activé.
- La configuration `messages.tts.auto` accepte `off|always|inbound|tagged`.
- `/tts on` écrit la préférence TTS locale sur `always` ; `/tts off` l’écrit sur `off`.
- Utilisez la configuration si vous voulez des valeurs par défaut `inbound` ou `tagged`.
- `limit` et `summary` sont stockés dans les préférences locales, pas dans la configuration principale.
- `/tts audio` génère une réponse audio ponctuelle (cela n’active pas le TTS).
- `/tts status` inclut la visibilité du repli pour la tentative la plus récente :
  - repli réussi : `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - échec : `Error: ...` plus `Attempts: ...`
  - diagnostics détaillés : `Attempt details: provider:outcome(reasonCode) latency`
- Les échecs d’API OpenAI et ElevenLabs incluent désormais le détail d’erreur provider analysé et l’identifiant de requête (lorsqu’il est renvoyé par le provider), qui est remonté dans les erreurs/journaux TTS.

## Outil d’agent

L’outil `tts` convertit du texte en parole et renvoie une pièce jointe audio pour
la livraison de la réponse. Lorsque le canal est Feishu, Matrix, Telegram, ou WhatsApp,
l’audio est livré sous forme de message vocal plutôt que comme pièce jointe de fichier.
Il accepte des champs facultatifs `channel` et `timeoutMs` ; `timeoutMs` est un
délai d’attente de requête provider par appel en millisecondes.

## RPC Gateway

Méthodes Gateway :

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Liens associés

- [Vue d’ensemble des médias](/fr/tools/media-overview)
- [Génération de musique](/fr/tools/music-generation)
- [Génération vidéo](/fr/tools/video-generation)
