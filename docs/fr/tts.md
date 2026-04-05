---
read_when:
    - Activation de la synthèse vocale pour les réponses
    - Configuration des providers TTS ou des limites
    - Utilisation des commandes /tts
summary: Synthèse vocale (TTS) pour les réponses sortantes
title: Synthèse vocale (ancien chemin)
x-i18n:
    generated_at: "2026-04-05T12:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca61773996299a582ab88e5a5db12d8f22ce8a28292ce97cc5dd5fdc2d3b83
    source_path: tts.md
    workflow: 15
---

# Synthèse vocale (TTS)

OpenClaw peut convertir les réponses sortantes en audio à l'aide d'ElevenLabs, Microsoft, MiniMax ou OpenAI.
Cela fonctionne partout où OpenClaw peut envoyer de l'audio.

## Services pris en charge

- **ElevenLabs** (provider principal ou de secours)
- **Microsoft** (provider principal ou de secours ; l'implémentation intégrée actuelle utilise `node-edge-tts`)
- **MiniMax** (provider principal ou de secours ; utilise l'API T2A v2)
- **OpenAI** (provider principal ou de secours ; également utilisé pour les résumés)

### Remarques sur la synthèse vocale Microsoft

Le provider de synthèse vocale Microsoft intégré utilise actuellement le service
TTS neuronal en ligne de Microsoft Edge via la bibliothèque `node-edge-tts`. Il s'agit d'un service hébergé (non
local), qui utilise des points de terminaison Microsoft et ne nécessite pas de clé API.
`node-edge-tts` expose des options de configuration vocale et des formats de sortie, mais
toutes les options ne sont pas prises en charge par le service. Les anciennes entrées de configuration et de directive
utilisant `edge` fonctionnent toujours et sont normalisées vers `microsoft`.

Comme ce chemin utilise un service web public sans SLA ni quota publiés,
considérez-le comme fourni au mieux. Si vous avez besoin de limites garanties et de support, utilisez OpenAI
ou ElevenLabs.

## Clés facultatives

Si vous voulez utiliser OpenAI, ElevenLabs ou MiniMax :

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

La synthèse vocale Microsoft ne nécessite **pas** de clé API.

Si plusieurs providers sont configurés, le provider sélectionné est utilisé en premier et les autres servent d'options de secours.
Le résumé automatique utilise le `summaryModel` configuré (ou `agents.defaults.model.primary`),
donc ce provider doit également être authentifié si vous activez les résumés.

## Liens des services

- [Guide OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Référence de l'API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Authentification ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formats de sortie Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Est-ce activé par défaut ?

Non. La TTS automatique est **désactivée** par défaut. Activez-la dans la configuration avec
`messages.tts.auto` ou par session avec `/tts always` (alias : `/tts on`).

Lorsque `messages.tts.provider` n'est pas défini, OpenClaw choisit le premier
provider de synthèse vocale configuré selon l'ordre de sélection automatique du registre.

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

### OpenAI principal avec ElevenLabs en secours

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

### Répondre uniquement avec de l'audio après un message vocal entrant

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

Ensuite, exécutez :

```
/tts summary off
```

### Remarques sur les champs

- `auto` : mode TTS automatique (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envoie de l'audio uniquement après un message vocal entrant.
  - `tagged` envoie de l'audio uniquement lorsque la réponse inclut des balises `[[tts]]`.
- `enabled` : ancien commutateur (doctor migre cela vers `auto`).
- `mode` : `"final"` (par défaut) ou `"all"` (inclut les réponses d'outil/bloc).
- `provider` : identifiant du provider de synthèse vocale tel que `"elevenlabs"`, `"microsoft"`, `"minimax"` ou `"openai"` (le secours est automatique).
- Si `provider` n'est **pas défini**, OpenClaw utilise le premier provider de synthèse vocale configuré selon l'ordre de sélection automatique du registre.
- L'ancien `provider: "edge"` fonctionne toujours et est normalisé vers `microsoft`.
- `summaryModel` : modèle économique facultatif pour le résumé automatique ; par défaut `agents.defaults.model.primary`.
  - Accepte `provider/model` ou un alias de modèle configuré.
- `modelOverrides` : permet au modèle d'émettre des directives TTS (activé par défaut).
  - `allowProvider` vaut `false` par défaut (le changement de provider est opt-in).
- `providers.<id>` : paramètres propres au provider, indexés par identifiant de provider de synthèse vocale.
- Les anciens blocs directs de provider (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) sont automatiquement migrés vers `messages.tts.providers.<id>` au chargement.
- `maxTextLength` : limite stricte pour l'entrée TTS (caractères). `/tts audio` échoue si elle est dépassée.
- `timeoutMs` : délai d'expiration de la requête (ms).
- `prefsPath` : surcharge le chemin JSON local des préférences (provider/limite/résumé).
- Les valeurs `apiKey` utilisent les variables d'environnement comme repli (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl` : surcharge l'URL de base de l'API ElevenLabs.
- `providers.openai.baseUrl` : surcharge le point de terminaison TTS OpenAI.
  - Ordre de résolution : `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Les valeurs non par défaut sont traitées comme des points de terminaison TTS compatibles OpenAI ; les noms personnalisés de modèle et de voix sont donc acceptés.
- `providers.elevenlabs.voiceSettings` :
  - `stability`, `similarityBoost`, `style` : `0..1`
  - `useSpeakerBoost` : `true|false`
  - `speed` : `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization` : `auto|on|off`
- `providers.elevenlabs.languageCode` : ISO 639-1 à 2 lettres (par ex. `en`, `de`)
- `providers.elevenlabs.seed` : entier `0..4294967295` (déterminisme au mieux)
- `providers.minimax.baseUrl` : surcharge l'URL de base de l'API MiniMax (par défaut `https://api.minimax.io`, env : `MINIMAX_API_HOST`).
- `providers.minimax.model` : modèle TTS (par défaut `speech-2.8-hd`, env : `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId` : identifiant de voix (par défaut `English_expressive_narrator`, env : `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed` : vitesse de lecture `0.5..2.0` (par défaut 1.0).
- `providers.minimax.vol` : volume `(0, 10]` (par défaut 1.0 ; doit être supérieur à 0).
- `providers.minimax.pitch` : décalage de hauteur `-12..12` (par défaut 0).
- `providers.microsoft.enabled` : autoriser l'utilisation de la synthèse vocale Microsoft (par défaut `true` ; sans clé API).
- `providers.microsoft.voice` : nom de voix neuronale Microsoft (par ex. `en-US-MichelleNeural`).
- `providers.microsoft.lang` : code langue (par ex. `en-US`).
- `providers.microsoft.outputFormat` : format de sortie Microsoft (par ex. `audio-24khz-48kbitrate-mono-mp3`).
  - Consultez les formats de sortie Microsoft Speech pour les valeurs valides ; tous les formats ne sont pas pris en charge par le transport intégré basé sur Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume` : chaînes de pourcentage (par ex. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles` : écrit des sous-titres JSON à côté du fichier audio.
- `providers.microsoft.proxy` : URL de proxy pour les requêtes de synthèse vocale Microsoft.
- `providers.microsoft.timeoutMs` : surcharge du délai d'expiration de la requête (ms).
- `edge.*` : ancien alias pour les mêmes paramètres Microsoft.

## Surcharges pilotées par le modèle (activées par défaut)

Par défaut, le modèle **peut** émettre des directives TTS pour une seule réponse.
Lorsque `messages.tts.auto` vaut `tagged`, ces directives sont requises pour déclencher l'audio.

Lorsqu'il est activé, le modèle peut émettre des directives `[[tts:...]]` pour surcharger la voix
pour une seule réponse, ainsi qu'un bloc facultatif `[[tts:text]]...[[/tts:text]]` pour
fournir des balises expressives (rire, indications de chant, etc.) qui ne doivent apparaître que dans
l'audio.

Les directives `provider=...` sont ignorées sauf si `modelOverrides.allowProvider: true`.

Exemple de payload de réponse :

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Clés de directive disponibles (lorsqu'elles sont activées) :

- `provider` (identifiant enregistré du provider de synthèse vocale, par exemple `openai`, `elevenlabs`, `minimax` ou `microsoft` ; nécessite `allowProvider: true`)
- `voice` (voix OpenAI) ou `voiceId` (ElevenLabs / MiniMax)
- `model` (modèle TTS OpenAI, identifiant de modèle ElevenLabs ou modèle MiniMax)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (hauteur MiniMax, -12 à 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Désactiver toutes les surcharges du modèle :

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

Liste d'autorisation facultative (activer le changement de provider tout en conservant les autres réglages configurables) :

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
`~/.openclaw/settings/tts.json`, surchargeable avec `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Champs stockés :

- `enabled`
- `provider`
- `maxLength` (seuil de résumé ; 1500 caractères par défaut)
- `summarize` (`true` par défaut)

Ces champs surchargent `messages.tts.*` pour cet hôte.

## Formats de sortie (fixes)

- **Feishu / Matrix / Telegram / WhatsApp** : message vocal Opus (`opus_48000_64` depuis ElevenLabs, `opus` depuis OpenAI).
  - 48 kHz / 64 kb/s est un bon compromis pour un message vocal.
- **Autres canaux** : MP3 (`mp3_44100_128` depuis ElevenLabs, `mp3` depuis OpenAI).
  - 44,1 kHz / 128 kb/s est l'équilibre par défaut pour la clarté de la parole.
- **MiniMax** : MP3 (modèle `speech-2.8-hd`, fréquence d'échantillonnage de 32 kHz). Le format de note vocale n'est pas pris en charge nativement ; utilisez OpenAI ou ElevenLabs pour des messages vocaux Opus garantis.
- **Microsoft** : utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`).
  - Le transport intégré accepte un `outputFormat`, mais tous les formats ne sont pas disponibles via le service.
  - Les valeurs de format de sortie suivent les formats de sortie Microsoft Speech (y compris Ogg/WebM Opus).
  - Telegram `sendVoice` accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin
    de messages vocaux Opus garantis.
  - Si le format de sortie Microsoft configuré échoue, OpenClaw réessaie avec du MP3.

Les formats de sortie OpenAI/ElevenLabs sont fixes par canal (voir ci-dessus).

## Comportement de la TTS automatique

Lorsqu'elle est activée, OpenClaw :

- ignore la TTS si la réponse contient déjà un média ou une directive `MEDIA:`.
- ignore les réponses très courtes (< 10 caractères).
- résume les réponses longues lorsqu'il est activé en utilisant `agents.defaults.model.primary` (ou `summaryModel`).
- joint l'audio généré à la réponse.

Si la réponse dépasse `maxLength` et que le résumé est désactivé (ou qu'il n'y a pas de clé API pour le
modèle de résumé), l'audio
est ignoré et la réponse texte normale est envoyée.

## Diagramme du flux

```
Réponse -> TTS activée ?
  non -> envoyer le texte
  oui -> contient un média / MEDIA: / est courte ?
          oui -> envoyer le texte
          non -> longueur > limite ?
                   non -> TTS -> joindre l'audio
                   oui -> résumé activé ?
                            non -> envoyer le texte
                            oui -> résumer (`summaryModel` ou `agents.defaults.model.primary`)
                                      -> TTS -> joindre l'audio
```

## Utilisation des commandes slash

Il existe une seule commande : `/tts`.
Consultez [Commandes slash](/tools/slash-commands) pour les détails d'activation.

Remarque Discord : `/tts` est une commande Discord intégrée, donc OpenClaw enregistre
`/voice` comme commande native dans ce cas. Le texte `/tts ...` fonctionne toujours.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Remarques :

- Les commandes nécessitent un expéditeur autorisé (les règles d'allowlist/propriétaire s'appliquent toujours).
- `commands.text` ou l'enregistrement de commande native doit être activé.
- `off|always|inbound|tagged` sont des bascules par session (`/tts on` est un alias de `/tts always`).
- `limit` et `summary` sont stockés dans les préférences locales, pas dans la configuration principale.
- `/tts audio` génère une réponse audio ponctuelle (n'active pas la TTS).
- `/tts status` inclut la visibilité du secours pour la dernière tentative :
  - secours réussi : `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - échec : `Error: ...` plus `Attempts: ...`
  - diagnostics détaillés : `Attempt details: provider:outcome(reasonCode) latency`
- Les échecs d'API OpenAI et ElevenLabs incluent désormais le détail d'erreur du provider analysé et l'identifiant de requête (lorsqu'il est renvoyé par le provider), ce qui apparaît dans les erreurs/journaux TTS.

## Outil d'agent

L'outil `tts` convertit le texte en synthèse vocale et renvoie une pièce jointe audio pour
la livraison de la réponse. Lorsque le canal est Feishu, Matrix, Telegram ou WhatsApp,
l'audio est livré comme message vocal plutôt que comme pièce jointe de fichier.

## Gateway RPC

Méthodes Gateway :

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
