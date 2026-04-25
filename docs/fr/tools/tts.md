---
read_when:
    - Activer la synthèse vocale pour les réponses
    - Configurer les fournisseurs TTS ou les limites
    - Utiliser les commandes `/tts`
summary: Synthèse vocale (TTS) pour les réponses sortantes
title: Synthèse vocale (TTS)
x-i18n:
    generated_at: "2026-04-25T18:23:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c56c42f201139a7277153a6a1409ef9a288264e0702d2940b74b08ece385718
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw peut convertir les réponses sortantes en audio avec ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI ou Xiaomi MiMo.
Cela fonctionne partout où OpenClaw peut envoyer de l’audio.

## Services pris en charge

- **ElevenLabs** (fournisseur principal ou de secours)
- **Google Gemini** (fournisseur principal ou de secours ; utilise l’API TTS Gemini)
- **Gradium** (fournisseur principal ou de secours ; prend en charge la sortie en note vocale et en téléphonie)
- **Local CLI** (fournisseur principal ou de secours ; exécute une commande TTS locale configurée)
- **Microsoft** (fournisseur principal ou de secours ; l’implémentation intégrée actuelle utilise `node-edge-tts`)
- **MiniMax** (fournisseur principal ou de secours ; utilise l’API T2A v2)
- **OpenAI** (fournisseur principal ou de secours ; également utilisé pour les résumés)
- **Vydra** (fournisseur principal ou de secours ; fournisseur partagé d’image, de vidéo et de parole)
- **xAI** (fournisseur principal ou de secours ; utilise l’API TTS xAI)
- **Xiaomi MiMo** (fournisseur principal ou de secours ; utilise le TTS MiMo via les chat completions Xiaomi)

### Notes sur la parole Microsoft

Le fournisseur de parole Microsoft intégré utilise actuellement le service TTS neuronal en ligne de Microsoft Edge via la bibliothèque `node-edge-tts`. C’est un service hébergé (pas local), il utilise des points de terminaison Microsoft et ne nécessite pas de clé API.
`node-edge-tts` expose des options de configuration de la parole et des formats de sortie, mais toutes les options ne sont pas prises en charge par le service. Les anciennes entrées de configuration et de directive utilisant `edge` fonctionnent toujours et sont normalisées vers `microsoft`.

Comme ce chemin repose sur un service web public sans SLA ni quota publiés, considérez-le comme best-effort. Si vous avez besoin de limites garanties et de support, utilisez OpenAI ou ElevenLabs.

## Clés facultatives

Si vous voulez OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI ou Xiaomi MiMo :

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY` ; MiniMax TTS accepte aussi l’authentification Token Plan via
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` ou
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI et la parole Microsoft ne nécessitent **pas** de clé API.

Si plusieurs fournisseurs sont configurés, le fournisseur sélectionné est utilisé en premier et les autres servent de fournisseurs de secours.
Le résumé automatique utilise le `summaryModel` configuré (ou `agents.defaults.model.primary`) ; ce fournisseur doit donc aussi être authentifié si vous activez les résumés.

## Liens de services

- [Guide OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Référence de l’API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Authentification ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/fr/providers/gradium)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [Synthèse vocale Xiaomi MiMo](/fr/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formats de sortie Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Est-ce activé par défaut ?

Non. Le TTS automatique est **désactivé** par défaut. Activez-le dans la configuration avec
`messages.tts.auto` ou localement avec `/tts on`.

Lorsque `messages.tts.provider` n’est pas défini, OpenClaw choisit le premier
fournisseur de parole configuré dans l’ordre de sélection automatique du registre.

## Configuration

La configuration TTS se trouve sous `messages.tts` dans `openclaw.json`.
Le schéma complet figure dans [Configuration Gateway](/fr/gateway/configuration).

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

L’ordre de résolution de l’authentification MiniMax TTS est `messages.tts.providers.minimax.apiKey`, puis les profils OAuth/jeton `minimax-portal` stockés, puis les clés d’environnement Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), puis `MINIMAX_API_KEY`. Lorsqu’aucun
`baseUrl` TTS explicite n’est défini, OpenClaw peut réutiliser l’hôte OAuth `minimax-portal`
configuré pour la parole Token Plan.

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

Google Gemini TTS utilise le chemin de clé API Gemini. Une clé API Google Cloud Console
restreinte à l’API Gemini est valide ici, et c’est le même type de clé utilisé
par le fournisseur intégré de génération d’images Google. L’ordre de résolution est
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

xAI TTS utilise le même chemin `XAI_API_KEY` que le fournisseur de modèle Grok intégré.
L’ordre de résolution est `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Les voix live actuelles sont `ara`, `eve`, `leo`, `rex`, `sal` et `una` ; `eve` est
la voix par défaut. `language` accepte une balise BCP-47 ou `auto`.

### Xiaomi MiMo principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS utilise le même chemin `XIAOMI_API_KEY` que le fournisseur de modèle Xiaomi intégré.
L’identifiant du fournisseur de parole est `xiaomi` ; `mimo` est accepté comme alias.
Le texte cible est envoyé comme message assistant, conformément au
contrat TTS Xiaomi. Le `style` facultatif est envoyé comme instruction utilisateur et n’est pas prononcé.

### OpenRouter principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS utilise le même chemin `OPENROUTER_API_KEY` que le fournisseur de modèle
OpenRouter intégré. L’ordre de résolution est
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```

Le TTS Local CLI exécute la commande configurée sur l’hôte Gateway. Les placeholders `{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}` et `{{OutputBase}}` sont
développés dans `args` ; si aucun placeholder `{{Text}}` n’est présent, OpenClaw écrit le
texte parlé sur stdin. `outputFormat` accepte `mp3`, `opus` ou `wav`.
Les cibles de note vocale sont transcodées en Ogg/Opus et la sortie téléphonique est
transcodée en PCM brut mono 16 kHz avec `ffmpeg`. L’ancien alias de fournisseur
`cli` fonctionne toujours, mais la nouvelle configuration doit utiliser `tts-local-cli`.

### Gradium principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Désactiver la parole Microsoft

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

### Limites personnalisées + chemin de préférences

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

### Répondre uniquement en audio après un message vocal entrant

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

Ensuite, exécutez :

```
/tts summary off
```

### Notes sur les champs

- `auto` : mode TTS automatique (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envoie de l’audio uniquement après un message vocal entrant.
  - `tagged` envoie de l’audio uniquement lorsque la réponse inclut des directives `[[tts:key=value]]` ou un bloc `[[tts:text]]...[[/tts:text]]`.
- `enabled` : bascule historique (doctor migre cela vers `auto`).
- `mode` : `"final"` (par défaut) ou `"all"` (inclut les réponses d’outil/par blocs).
- `provider` : identifiant de fournisseur de parole tel que `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` ou `"xiaomi"` (le fallback est automatique).
- Si `provider` n’est **pas défini**, OpenClaw utilise le premier fournisseur de parole configuré selon l’ordre de sélection automatique du registre.
- L’ancienne configuration `provider: "edge"` est réparée par `openclaw doctor --fix` et réécrite en `provider: "microsoft"`.
- `summaryModel` : modèle économique facultatif pour le résumé automatique ; vaut par défaut `agents.defaults.model.primary`.
  - Accepte `provider/model` ou un alias de modèle configuré.
- `modelOverrides` : permet au modèle d’émettre des directives TTS (activé par défaut).
  - `allowProvider` vaut `false` par défaut (le changement de fournisseur est opt-in).
- `providers.<id>` : paramètres détenus par le fournisseur, indexés par identifiant de fournisseur de parole.
- Les anciens blocs de fournisseur directs (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) sont réparés par `openclaw doctor --fix` ; la configuration validée doit utiliser `messages.tts.providers.<id>`.
- L’ancien `messages.tts.providers.edge` est également réparé par `openclaw doctor --fix` ; la configuration validée doit utiliser `messages.tts.providers.microsoft`.
- `maxTextLength` : plafond strict pour l’entrée TTS (caractères). `/tts audio` échoue si ce plafond est dépassé.
- `timeoutMs` : délai d’expiration de la requête (ms).
- `prefsPath` : surcharge le chemin JSON local des préférences (fournisseur/limite/résumé).
- Les valeurs `apiKey` utilisent comme fallback les variables d’environnement (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl` : surcharge l’URL de base de l’API ElevenLabs.
- `providers.openai.baseUrl` : surcharge le point de terminaison TTS OpenAI.
  - Ordre de résolution : `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Les valeurs non par défaut sont traitées comme des points de terminaison TTS compatibles OpenAI ; des noms personnalisés de modèle et de voix sont donc acceptés.
- `providers.elevenlabs.voiceSettings` :
  - `stability`, `similarityBoost`, `style` : `0..1`
  - `useSpeakerBoost` : `true|false`
  - `speed` : `0.5..2.0` (`1.0` = normal)
- `providers.elevenlabs.applyTextNormalization` : `auto|on|off`
- `providers.elevenlabs.languageCode` : code ISO 639-1 à 2 lettres (par ex. `en`, `de`)
- `providers.elevenlabs.seed` : entier `0..4294967295` (déterminisme best-effort)
- `providers.minimax.baseUrl` : surcharge l’URL de base de l’API MiniMax (par défaut `https://api.minimax.io`, env : `MINIMAX_API_HOST`).
- `providers.minimax.model` : modèle TTS (par défaut `speech-2.8-hd`, env : `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId` : identifiant de voix (par défaut `English_expressive_narrator`, env : `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed` : vitesse de lecture `0.5..2.0` (par défaut 1.0).
- `providers.minimax.vol` : volume `(0, 10]` (par défaut 1.0 ; doit être supérieur à 0).
- `providers.minimax.pitch` : décalage de hauteur entier `-12..12` (par défaut 0). Les valeurs fractionnaires sont tronquées avant l’appel à MiniMax T2A car l’API rejette les valeurs de hauteur non entières.
- `providers.tts-local-cli.command` : exécutable local ou chaîne de commande pour le TTS CLI.
- `providers.tts-local-cli.args` : arguments de commande ; prend en charge les placeholders `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` et `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat` : format de sortie CLI attendu (`mp3`, `opus` ou `wav` ; `mp3` par défaut pour les pièces jointes audio).
- `providers.tts-local-cli.timeoutMs` : délai d’expiration de la commande en millisecondes (par défaut `120000`).
- `providers.tts-local-cli.cwd` : répertoire de travail facultatif de la commande.
- `providers.tts-local-cli.env` : surcharges facultatives d’environnement chaîne pour la commande.
- `providers.google.model` : modèle Gemini TTS (par défaut `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName` : nom de voix préconstruit Gemini (par défaut `Kore` ; `voice` est aussi accepté).
- `providers.google.audioProfile` : prompt de style en langage naturel préfixé avant le texte prononcé.
- `providers.google.speakerName` : étiquette facultative d’intervenant préfixée avant le texte prononcé lorsque votre prompt TTS utilise un intervenant nommé.
- `providers.google.baseUrl` : surcharge l’URL de base de l’API Gemini. Seul `https://generativelanguage.googleapis.com` est accepté.
  - Si `messages.tts.providers.google.apiKey` est omis, le TTS peut réutiliser `models.providers.google.apiKey` avant le fallback par variable d’environnement.
- `providers.gradium.baseUrl` : surcharge l’URL de base de l’API Gradium (par défaut `https://api.gradium.ai`).
- `providers.gradium.voiceId` : identifiant de voix Gradium (Emma par défaut, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey` : clé API xAI TTS (env : `XAI_API_KEY`).
- `providers.xai.baseUrl` : surcharge l’URL de base TTS xAI (par défaut `https://api.x.ai/v1`, env : `XAI_BASE_URL`).
- `providers.xai.voiceId` : identifiant de voix xAI (par défaut `eve` ; voix live actuelles : `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language` : code de langue BCP-47 ou `auto` (par défaut `en`).
- `providers.xai.responseFormat` : `mp3`, `wav`, `pcm`, `mulaw` ou `alaw` (par défaut `mp3`).
- `providers.xai.speed` : surcharge de vitesse native au fournisseur.
- `providers.xiaomi.apiKey` : clé API Xiaomi MiMo (env : `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl` : surcharge l’URL de base de l’API Xiaomi MiMo (par défaut `https://api.xiaomimimo.com/v1`, env : `XIAOMI_BASE_URL`).
- `providers.xiaomi.model` : modèle TTS (par défaut `mimo-v2.5-tts`, env : `XIAOMI_TTS_MODEL` ; `mimo-v2-tts` est aussi pris en charge).
- `providers.xiaomi.voice` : identifiant de voix MiMo (par défaut `mimo_default`, env : `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format` : `mp3` ou `wav` (par défaut `mp3`, env : `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style` : instruction facultative de style en langage naturel envoyée comme message utilisateur ; elle n’est pas prononcée.
- `providers.openrouter.apiKey` : clé API OpenRouter (env : `OPENROUTER_API_KEY` ; peut réutiliser `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl` : surcharge l’URL de base OpenRouter TTS (par défaut `https://openrouter.ai/api/v1` ; l’ancienne valeur `https://openrouter.ai/v1` est normalisée).
- `providers.openrouter.model` : identifiant du modèle TTS OpenRouter (par défaut `hexgrad/kokoro-82m` ; `modelId` est aussi accepté).
- `providers.openrouter.voice` : identifiant de voix spécifique au fournisseur (par défaut `af_alloy` ; `voiceId` est aussi accepté).
- `providers.openrouter.responseFormat` : `mp3` ou `pcm` (par défaut `mp3`).
- `providers.openrouter.speed` : surcharge de vitesse native au fournisseur.
- `providers.microsoft.enabled` : autorise l’usage de la parole Microsoft (par défaut `true` ; sans clé API).
- `providers.microsoft.voice` : nom de voix neurale Microsoft (par ex. `en-US-MichelleNeural`).
- `providers.microsoft.lang` : code de langue (par ex. `en-US`).
- `providers.microsoft.outputFormat` : format de sortie Microsoft (par ex. `audio-24khz-48kbitrate-mono-mp3`).
  - Voir les formats de sortie Microsoft Speech pour les valeurs valides ; tous les formats ne sont pas pris en charge par le transport intégré fondé sur Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume` : chaînes de pourcentage (par ex. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles` : écrit des sous-titres JSON à côté du fichier audio.
- `providers.microsoft.proxy` : URL de proxy pour les requêtes de parole Microsoft.
- `providers.microsoft.timeoutMs` : surcharge du délai d’expiration de la requête (ms).
- `edge.*` : alias historique pour les mêmes paramètres Microsoft. Exécutez
  `openclaw doctor --fix` pour réécrire la configuration persistée en `providers.microsoft`.

## Surcharges pilotées par le modèle (activées par défaut)

Par défaut, le modèle **peut** émettre des directives TTS pour une réponse unique.
Lorsque `messages.tts.auto` vaut `tagged`, ces directives sont nécessaires pour déclencher l’audio.

Lorsqu’il est activé, le modèle peut émettre des directives `[[tts:...]]` pour surcharger la voix
pour une seule réponse, ainsi qu’un bloc facultatif `[[tts:text]]...[[/tts:text]]` pour
fournir des balises expressives (rire, indications de chant, etc.) qui ne doivent apparaître
que dans l’audio.

Les directives `provider=...` sont ignorées sauf si `modelOverrides.allowProvider: true`.

Exemple de charge utile de réponse :

```
Voici.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](rit) Lis encore une fois la chanson.[[/tts:text]]
```

Clés de directive disponibles (lorsqu’elles sont activées) :

- `provider` (identifiant de fournisseur de parole enregistré, par exemple `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` ou `xiaomi` ; nécessite `allowProvider: true`)
- `voice` (voix OpenAI, Gradium ou Xiaomi), `voiceName` / `voice_name` / `google_voice` (voix Google), ou `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (modèle TTS OpenAI, identifiant de modèle ElevenLabs, modèle MiniMax ou modèle TTS Xiaomi MiMo) ou `google_model` (modèle TTS Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (hauteur entière MiniMax, -12 à 12 ; les valeurs fractionnaires sont tronquées avant la requête MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Désactiver toutes les surcharges pilotées par le modèle :

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

Liste d’autorisation facultative (activer le changement de fournisseur tout en conservant les autres paramètres configurables) :

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

Les commandes slash écrivent des surcharges locales dans `prefsPath` (par défaut :
`~/.openclaw/settings/tts.json`, surchargeable avec `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Champs stockés :

- `enabled`
- `provider`
- `maxLength` (seuil de résumé ; 1500 caractères par défaut)
- `summarize` (`true` par défaut)

Ils surchargent `messages.tts.*` pour cet hôte.

## Formats de sortie (fixes)

- **Feishu / Matrix / Telegram / WhatsApp** : les réponses en note vocale préfèrent Opus (`opus_48000_64` depuis ElevenLabs, `opus` depuis OpenAI).
  - 48 kHz / 64 kb/s offre un bon compromis pour les messages vocaux.
- **Feishu** : lorsqu’une réponse en note vocale est produite en MP3/WAV/M4A ou dans un autre format probablement audio, le Plugin Feishu la transcode en Ogg/Opus 48 kHz avec `ffmpeg` avant d’envoyer la bulle native `audio`. Si la conversion échoue, Feishu reçoit le fichier d’origine comme pièce jointe.
- **Autres canaux** : MP3 (`mp3_44100_128` depuis ElevenLabs, `mp3` depuis OpenAI).
  - 44,1 kHz / 128 kb/s est l’équilibre par défaut pour la clarté de la parole.
- **MiniMax** : MP3 (modèle `speech-2.8-hd`, fréquence d’échantillonnage 32 kHz) pour les pièces jointes audio normales. Pour les cibles de note vocale comme Feishu et Telegram, OpenClaw transcode le MP3 MiniMax en Opus 48 kHz avec `ffmpeg` avant l’envoi.
- **Xiaomi MiMo** : MP3 par défaut, ou WAV lorsqu’il est configuré. Pour les cibles de note vocale comme Feishu et Telegram, OpenClaw transcode la sortie Xiaomi en Opus 48 kHz avec `ffmpeg` avant l’envoi.
- **Local CLI** : utilise le `outputFormat` configuré. Les cibles de note vocale sont converties en Ogg/Opus et la sortie téléphonique est convertie en PCM brut mono 16 kHz avec `ffmpeg`.
- **Google Gemini** : l’API Gemini TTS renvoie du PCM brut à 24 kHz. OpenClaw l’encapsule en WAV pour les pièces jointes audio et renvoie directement le PCM pour Talk/la téléphonie. Le format natif de note vocale Opus n’est pas pris en charge par ce chemin.
- **Gradium** : WAV pour les pièces jointes audio, Opus pour les cibles de note vocale, et `ulaw_8000` à 8 kHz pour la téléphonie.
- **xAI** : MP3 par défaut ; `responseFormat` peut être `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. OpenClaw utilise le point de terminaison TTS REST par lot de xAI et renvoie une pièce jointe audio complète ; le WebSocket TTS en streaming de xAI n’est pas utilisé par ce chemin fournisseur. Le format natif de note vocale Opus n’est pas pris en charge par ce chemin.
- **Microsoft** : utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`).
  - Le transport intégré accepte un `outputFormat`, mais tous les formats ne sont pas disponibles depuis le service.
  - Les valeurs de format de sortie suivent les formats de sortie Microsoft Speech (y compris Ogg/WebM Opus).
  - Telegram `sendVoice` accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin de messages vocaux Opus garantis.
  - Si le format de sortie Microsoft configuré échoue, OpenClaw réessaie avec MP3.

Les formats de sortie OpenAI/ElevenLabs sont fixes par canal (voir ci-dessus).

## Comportement du TTS automatique

Lorsqu’il est activé, OpenClaw :

- ignore le TTS si la réponse contient déjà un média ou une directive `MEDIA:`.
- ignore les réponses très courtes (< 10 caractères).
- résume les réponses longues lorsqu’il est activé en utilisant `agents.defaults.model.primary` (ou `summaryModel`).
- joint l’audio généré à la réponse.

Si la réponse dépasse `maxLength` et que le résumé est désactivé (ou qu’aucune clé API n’est disponible pour le modèle de résumé), l’audio est ignoré et la réponse texte normale est envoyée.

## Diagramme de flux

```
Réponse -> TTS activé ?
  non -> envoyer le texte
  oui -> contient un média / MEDIA: / est courte ?
           oui -> envoyer le texte
           non -> longueur > limite ?
                    non -> TTS -> joindre l’audio
                    oui -> résumé activé ?
                             non -> envoyer le texte
                             oui -> résumer (summaryModel ou agents.defaults.model.primary)
                                       -> TTS -> joindre l’audio
```

## Utilisation des commandes slash

Il existe une seule commande : `/tts`.
Voir [Commandes slash](/fr/tools/slash-commands) pour les détails d’activation.

Note Discord : `/tts` est une commande intégrée Discord, donc OpenClaw enregistre
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

Remarques :

- Les commandes nécessitent un expéditeur autorisé (les règles de liste d’autorisation/propriétaire s’appliquent toujours).
- `commands.text` ou l’enregistrement de commandes natives doit être activé.
- La configuration `messages.tts.auto` accepte `off|always|inbound|tagged`.
- `/tts on` écrit la préférence TTS locale à `always` ; `/tts off` l’écrit à `off`.
- Utilisez la configuration si vous voulez des valeurs par défaut `inbound` ou `tagged`.
- `limit` et `summary` sont stockés dans les préférences locales, pas dans la configuration principale.
- `/tts audio` génère une réponse audio ponctuelle (n’active pas le TTS).
- `/tts status` inclut la visibilité du fallback pour la dernière tentative :
  - fallback réussi : `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - échec : `Error: ...` plus `Attempts: ...`
  - diagnostics détaillés : `Attempt details: provider:outcome(reasonCode) latency`
- Les échecs d’API OpenAI et ElevenLabs incluent désormais les détails d’erreur fournisseur analysés et l’identifiant de requête (lorsqu’il est renvoyé par le fournisseur), qui apparaissent dans les erreurs/journaux TTS.

## Outil agent

L’outil `tts` convertit le texte en parole et renvoie une pièce jointe audio pour l’envoi de la réponse. Lorsque le canal est Feishu, Matrix, Telegram ou WhatsApp, l’audio est livré comme message vocal plutôt que comme pièce jointe de fichier.
Feishu peut transcoder la sortie TTS non Opus sur ce chemin lorsque `ffmpeg` est disponible.
WhatsApp envoie le texte visible séparément de l’audio PTT en note vocale, car les clients n’affichent pas toujours correctement les légendes sur les notes vocales.
Il accepte les champs facultatifs `channel` et `timeoutMs` ; `timeoutMs` est un délai d’expiration par appel pour les requêtes au fournisseur, en millisecondes.

## RPC Gateway

Méthodes Gateway :

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Lié

- [Vue d’ensemble des médias](/fr/tools/media-overview)
- [Génération musicale](/fr/tools/music-generation)
- [Génération vidéo](/fr/tools/video-generation)
