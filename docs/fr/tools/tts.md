---
read_when:
    - Activation de la synthèse vocale pour les réponses
    - Configuration des fournisseurs TTS ou des limites
    - Utilisation des commandes /tts
summary: Synthèse vocale (TTS) pour les réponses sortantes
title: Synthèse vocale
x-i18n:
    generated_at: "2026-04-05T12:58:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8487c8acef7585bd4eb5e3b39e2a063ebc6b5f0103524abdcbadd3a7781ffc46
    source_path: tools/tts.md
    workflow: 15
---

# Synthèse vocale (TTS)

OpenClaw peut convertir les réponses sortantes en audio à l’aide de ElevenLabs, Microsoft, MiniMax ou OpenAI.
Cela fonctionne partout où OpenClaw peut envoyer de l’audio.

## Services pris en charge

- **ElevenLabs** (fournisseur principal ou de secours)
- **Microsoft** (fournisseur principal ou de secours ; l’implémentation groupée actuelle utilise `node-edge-tts`)
- **MiniMax** (fournisseur principal ou de secours ; utilise l’API T2A v2)
- **OpenAI** (fournisseur principal ou de secours ; également utilisé pour les résumés)

### Notes sur la synthèse vocale Microsoft

Le fournisseur de synthèse vocale Microsoft groupé utilise actuellement le service
TTS neuronal en ligne de Microsoft Edge via la bibliothèque `node-edge-tts`. Il s’agit d’un service hébergé (non
local), qui utilise des endpoints Microsoft et ne nécessite pas de clé API.
`node-edge-tts` expose des options de configuration vocale et des formats de sortie, mais
toutes les options ne sont pas prises en charge par le service. La configuration héritée et les entrées de directive
utilisant `edge` continuent de fonctionner et sont normalisées vers `microsoft`.

Comme ce chemin repose sur un service web public sans SLA ni quota publiés,
considérez-le comme un effort au mieux. Si vous avez besoin de limites garanties et d’assistance, utilisez OpenAI
ou ElevenLabs.

## Clés facultatives

Si vous voulez utiliser OpenAI, ElevenLabs ou MiniMax :

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

La synthèse vocale Microsoft ne nécessite **pas** de clé API.

Si plusieurs fournisseurs sont configurés, le fournisseur sélectionné est utilisé en premier et les autres servent de solution de secours.
Le résumé automatique utilise le `summaryModel` configuré (ou `agents.defaults.model.primary`),
donc ce fournisseur doit également être authentifié si vous activez les résumés.

## Liens de service

- [Guide OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Référence de l’API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Authentification ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formats de sortie Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Est-ce activé par défaut ?

Non. L’auto‑TTS est **désactivé** par défaut. Activez-le dans la configuration avec
`messages.tts.auto` ou par session avec `/tts always` (alias : `/tts on`).

Lorsque `messages.tts.provider` n’est pas défini, OpenClaw choisit le premier
fournisseur vocal configuré selon l’ordre de sélection automatique du registre.

## Configuration

La configuration TTS se trouve sous `messages.tts` dans `openclaw.json`.
Le schéma complet se trouve dans [Configuration de la gateway](/fr/gateway/configuration).

### Configuration minimale (activation + fournisseur)

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

Puis exécutez :

```
/tts summary off
```

### Notes sur les champs

- `auto` : mode auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` n’envoie de l’audio qu’après un message vocal entrant.
  - `tagged` n’envoie de l’audio que lorsque la réponse inclut des balises `[[tts]]`.
- `enabled` : bascule héritée (doctor la migre vers `auto`).
- `mode` : `"final"` (par défaut) ou `"all"` (inclut les réponses d’outils/blocs).
- `provider` : id du fournisseur vocal tel que `"elevenlabs"`, `"microsoft"`, `"minimax"` ou `"openai"` (la solution de secours est automatique).
- Si `provider` n’est **pas défini**, OpenClaw utilise le premier fournisseur vocal configuré selon l’ordre de sélection automatique du registre.
- L’ancien `provider: "edge"` fonctionne toujours et est normalisé vers `microsoft`.
- `summaryModel` : modèle économique facultatif pour le résumé automatique ; la valeur par défaut est `agents.defaults.model.primary`.
  - Accepte `provider/model` ou un alias de modèle configuré.
- `modelOverrides` : autoriser le modèle à émettre des directives TTS (activé par défaut).
  - `allowProvider` vaut par défaut `false` (le changement de fournisseur se fait par adhésion explicite).
- `providers.<id>` : paramètres détenus par le fournisseur, indexés par id de fournisseur vocal.
- Les anciens blocs de fournisseur directs (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) sont automatiquement migrés vers `messages.tts.providers.<id>` au chargement.
- `maxTextLength` : limite stricte pour l’entrée TTS (caractères). `/tts audio` échoue si elle est dépassée.
- `timeoutMs` : délai d’expiration de la requête (ms).
- `prefsPath` : remplace le chemin JSON local des préférences (fournisseur/limite/résumé).
- Les valeurs `apiKey` reviennent aux variables d’environnement (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl` : remplace l’URL de base de l’API ElevenLabs.
- `providers.openai.baseUrl` : remplace l’endpoint TTS OpenAI.
  - Ordre de résolution : `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Les valeurs non par défaut sont traitées comme des endpoints TTS compatibles OpenAI, donc les noms personnalisés de modèle et de voix sont acceptés.
- `providers.elevenlabs.voiceSettings` :
  - `stability`, `similarityBoost`, `style` : `0..1`
  - `useSpeakerBoost` : `true|false`
  - `speed` : `0.5..2.0` (`1.0` = normal)
- `providers.elevenlabs.applyTextNormalization` : `auto|on|off`
- `providers.elevenlabs.languageCode` : ISO 639-1 à 2 lettres (par exemple `en`, `de`)
- `providers.elevenlabs.seed` : entier `0..4294967295` (déterminisme au mieux)
- `providers.minimax.baseUrl` : remplace l’URL de base de l’API MiniMax (par défaut `https://api.minimax.io`, env : `MINIMAX_API_HOST`).
- `providers.minimax.model` : modèle TTS (par défaut `speech-2.8-hd`, env : `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId` : identifiant de voix (par défaut `English_expressive_narrator`, env : `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed` : vitesse de lecture `0.5..2.0` (par défaut 1.0).
- `providers.minimax.vol` : volume `(0, 10]` (par défaut 1.0 ; doit être supérieur à 0).
- `providers.minimax.pitch` : décalage de hauteur `-12..12` (par défaut 0).
- `providers.microsoft.enabled` : autoriser l’utilisation de la synthèse vocale Microsoft (par défaut `true` ; pas de clé API).
- `providers.microsoft.voice` : nom de voix neurale Microsoft (par exemple `en-US-MichelleNeural`).
- `providers.microsoft.lang` : code langue (par exemple `en-US`).
- `providers.microsoft.outputFormat` : format de sortie Microsoft (par exemple `audio-24khz-48kbitrate-mono-mp3`).
  - Voir les formats de sortie Microsoft Speech pour les valeurs valides ; tous les formats ne sont pas pris en charge par le transport groupé adossé à Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume` : chaînes de pourcentage (par exemple `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles` : écrire des sous-titres JSON à côté du fichier audio.
- `providers.microsoft.proxy` : URL de proxy pour les requêtes de synthèse vocale Microsoft.
- `providers.microsoft.timeoutMs` : remplacement du délai d’expiration de la requête (ms).
- `edge.*` : alias hérité pour les mêmes paramètres Microsoft.

## Remplacements pilotés par le modèle (activés par défaut)

Par défaut, le modèle **peut** émettre des directives TTS pour une seule réponse.
Lorsque `messages.tts.auto` vaut `tagged`, ces directives sont nécessaires pour déclencher l’audio.

Lorsqu’elle est activée, le modèle peut émettre des directives `[[tts:...]]` pour remplacer la voix
pour une seule réponse, ainsi qu’un bloc facultatif `[[tts:text]]...[[/tts:text]]` pour
fournir des balises expressives (rire, indications de chant, etc.) qui ne doivent apparaître que dans
l’audio.

Les directives `provider=...` sont ignorées sauf si `modelOverrides.allowProvider: true`.

Exemple de payload de réponse :

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Clés de directive disponibles (lorsqu’elles sont activées) :

- `provider` (id de fournisseur vocal enregistré, par exemple `openai`, `elevenlabs`, `minimax` ou `microsoft` ; nécessite `allowProvider: true`)
- `voice` (voix OpenAI) ou `voiceId` (ElevenLabs / MiniMax)
- `model` (modèle TTS OpenAI, id de modèle ElevenLabs ou modèle MiniMax)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (hauteur MiniMax, -12 à 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Désactiver tous les remplacements du modèle :

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

Liste d’autorisation facultative (activer le changement de fournisseur tout en gardant les autres réglages configurables) :

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

Les commandes slash écrivent des remplacements locaux dans `prefsPath` (par défaut :
`~/.openclaw/settings/tts.json`, remplaçable avec `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Champs stockés :

- `enabled`
- `provider`
- `maxLength` (seuil de résumé ; 1500 caractères par défaut)
- `summarize` (`true` par défaut)

Ceux-ci remplacent `messages.tts.*` pour cet hôte.

## Formats de sortie (fixes)

- **Feishu / Matrix / Telegram / WhatsApp** : message vocal Opus (`opus_48000_64` provenant de ElevenLabs, `opus` provenant de OpenAI).
  - 48 kHz / 64 kb/s constitue un bon compromis pour les messages vocaux.
- **Autres canaux** : MP3 (`mp3_44100_128` provenant de ElevenLabs, `mp3` provenant de OpenAI).
  - 44,1 kHz / 128 kb/s est l’équilibre par défaut pour la clarté de la parole.
- **MiniMax** : MP3 (modèle `speech-2.8-hd`, fréquence d’échantillonnage 32 kHz). Le format note vocale n’est pas pris en charge nativement ; utilisez OpenAI ou ElevenLabs pour des messages vocaux Opus garantis.
- **Microsoft** : utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`).
  - Le transport groupé accepte un `outputFormat`, mais tous les formats ne sont pas disponibles depuis le service.
  - Les valeurs de format de sortie suivent les formats de sortie Microsoft Speech (y compris Ogg/WebM Opus).
  - Telegram `sendVoice` accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin
    de messages vocaux Opus garantis.
  - Si le format de sortie Microsoft configuré échoue, OpenClaw réessaie avec MP3.

Les formats de sortie OpenAI/ElevenLabs sont fixes par canal (voir ci-dessus).

## Comportement de l’auto-TTS

Lorsqu’il est activé, OpenClaw :

- ignore TTS si la réponse contient déjà un média ou une directive `MEDIA:`.
- ignore les réponses très courtes (< 10 caractères).
- résume les réponses longues lorsque cette option est activée à l’aide de `agents.defaults.model.primary` (ou `summaryModel`).
- joint l’audio généré à la réponse.

Si la réponse dépasse `maxLength` et que le résumé est désactivé (ou qu’il n’y a pas de clé API pour le
modèle de résumé), l’audio
est ignoré et la réponse texte normale est envoyée.

## Diagramme de flux

```
Réponse -> TTS activé ?
  non -> envoyer le texte
  oui -> contient un média / MEDIA: / court ?
           oui -> envoyer le texte
           non -> longueur > limite ?
                    non -> TTS -> joindre l’audio
                    oui -> résumé activé ?
                             non -> envoyer le texte
                             oui -> résumer (summaryModel ou agents.defaults.model.primary)
                                       -> TTS -> joindre l’audio
```

## Utilisation des commandes slash

Il existe une seule commande : `/tts`.
Voir [Commandes slash](/tools/slash-commands) pour les détails d’activation.

Note Discord : `/tts` est une commande Discord intégrée, donc OpenClaw enregistre
`/voice` comme commande native à cet endroit. Le texte `/tts ...` fonctionne toujours.

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

Notes :

- Les commandes nécessitent un expéditeur autorisé (les règles de liste d’autorisation/propriétaire s’appliquent toujours).
- `commands.text` ou l’enregistrement de commandes natives doit être activé.
- `off|always|inbound|tagged` sont des bascules par session (`/tts on` est un alias pour `/tts always`).
- `limit` et `summary` sont stockés dans les préférences locales, pas dans la configuration principale.
- `/tts audio` génère une réponse audio ponctuelle (n’active pas TTS).
- `/tts status` inclut la visibilité de secours pour la dernière tentative :
  - secours réussi : `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - échec : `Error: ...` plus `Attempts: ...`
  - diagnostics détaillés : `Attempt details: provider:outcome(reasonCode) latency`
- Les échecs d’API OpenAI et ElevenLabs incluent désormais le détail d’erreur analysé du fournisseur et l’id de requête (lorsqu’il est renvoyé par le fournisseur), qui apparaissent dans les erreurs/journaux TTS.

## Outil d’agent

L’outil `tts` convertit du texte en parole et renvoie une pièce jointe audio pour
la distribution de la réponse. Lorsque le canal est Feishu, Matrix, Telegram ou WhatsApp,
l’audio est distribué sous forme de message vocal plutôt que de pièce jointe de fichier.

## RPC gateway

Méthodes de gateway :

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
