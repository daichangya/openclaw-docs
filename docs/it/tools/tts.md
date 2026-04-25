---
read_when:
    - Abilitazione della sintesi vocale per le risposte
    - Configurazione dei provider TTS o dei limiti
    - Uso dei comandi /tts
summary: Sintesi vocale (TTS) per le risposte in uscita
title: Sintesi vocale
x-i18n:
    generated_at: "2026-04-25T14:00:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw può convertire le risposte in uscita in audio usando ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI o Xiaomi MiMo.
Funziona ovunque OpenClaw possa inviare audio.

## Servizi supportati

- **ElevenLabs** (provider primario o di fallback)
- **Google Gemini** (provider primario o di fallback; usa Gemini API TTS)
- **Gradium** (provider primario o di fallback; supporta output come nota vocale e telefonia)
- **Local CLI** (provider primario o di fallback; esegue un comando TTS locale configurato)
- **Microsoft** (provider primario o di fallback; l’implementazione inclusa corrente usa `node-edge-tts`)
- **MiniMax** (provider primario o di fallback; usa l’API T2A v2)
- **OpenAI** (provider primario o di fallback; usato anche per i riepiloghi)
- **Vydra** (provider primario o di fallback; provider condiviso per immagini, video e voce)
- **xAI** (provider primario o di fallback; usa l’API TTS xAI)
- **Xiaomi MiMo** (provider primario o di fallback; usa il TTS MiMo tramite le chat completions Xiaomi)

### Note sulla voce Microsoft

Il provider vocale Microsoft incluso usa attualmente il servizio TTS neurale
online di Microsoft Edge tramite la libreria `node-edge-tts`. È un servizio ospitato (non
locale), usa endpoint Microsoft e non richiede una API key.
`node-edge-tts` espone opzioni di configurazione vocale e formati di output, ma
non tutte le opzioni sono supportate dal servizio. La configurazione legacy e l’input di direttive
che usa `edge` continuano a funzionare e vengono normalizzati a `microsoft`.

Poiché questo percorso usa un servizio web pubblico senza SLA o quota pubblicati,
trattalo come best-effort. Se hai bisogno di limiti garantiti e supporto, usa OpenAI
o ElevenLabs.

## Chiavi facoltative

Se vuoi OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI o Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (o `XI_API_KEY`)
- `GEMINI_API_KEY` (o `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS accetta anche l’autenticazione Token Plan tramite
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI e la voce Microsoft **non** richiedono una API key.

Se sono configurati più provider, viene usato prima il provider selezionato e gli altri diventano opzioni di fallback.
Il riepilogo automatico usa `summaryModel` configurato (o `agents.defaults.model.primary`),
quindi anche quel provider deve essere autenticato se abiliti i riepiloghi.

## Link ai servizi

- [Guida OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Riferimento API OpenAI Audio](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticazione ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/it/providers/gradium)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [Sintesi vocale Xiaomi MiMo](/it/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formati di output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## È abilitato per impostazione predefinita?

No. L’auto‑TTS è **disattivato** per impostazione predefinita. Abilitalo nella configurazione con
`messages.tts.auto` oppure localmente con `/tts on`.

Quando `messages.tts.provider` non è impostato, OpenClaw sceglie il primo
provider vocale configurato nell’ordine di selezione automatica del registro.

## Configurazione

La configurazione TTS si trova sotto `messages.tts` in `openclaw.json`.
Lo schema completo è in [Configurazione del Gateway](/it/gateway/configuration).

### Configurazione minima (abilitazione + provider)

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

### OpenAI primario con fallback ElevenLabs

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

### Microsoft primario (senza API key)

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

### MiniMax primario

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

La risoluzione dell’autenticazione MiniMax TTS è `messages.tts.providers.minimax.apiKey`, poi
i profili OAuth/token `minimax-portal` memorizzati, poi le chiavi ambiente Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), poi `MINIMAX_API_KEY`. Quando non è impostato alcun
`baseUrl` TTS esplicito, OpenClaw può riutilizzare l’host OAuth `minimax-portal`
configurato per la voce Token Plan.

### Google Gemini primario

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

Google Gemini TTS usa il percorso API key Gemini. Una API key di Google Cloud Console
limitata alla Gemini API è valida qui, ed è lo stesso tipo di chiave usato
dal provider incluso di generazione immagini Google. L’ordine di risoluzione è
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI primario

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

xAI TTS usa lo stesso percorso `XAI_API_KEY` del provider di modelli Grok incluso.
L’ordine di risoluzione è `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Le voci live attuali sono `ara`, `eve`, `leo`, `rex`, `sal` e `una`; `eve` è
quella predefinita. `language` accetta un tag BCP-47 o `auto`.

### Xiaomi MiMo primario

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

Xiaomi MiMo TTS usa lo stesso percorso `XIAOMI_API_KEY` del provider di modelli Xiaomi
incluso. L’id del provider vocale è `xiaomi`; `mimo` è accettato come alias.
Il testo di destinazione viene inviato come messaggio dell’assistente, in linea con il contratto TTS
di Xiaomi. L’opzionale `style` viene inviato come istruzione utente e non viene pronunciato.

### OpenRouter primario

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

OpenRouter TTS usa lo stesso percorso `OPENROUTER_API_KEY` del provider di modelli
OpenRouter incluso. L’ordine di risoluzione è
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI primario

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

Local CLI TTS esegue il comando configurato sull’host gateway. I placeholder `{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}` e `{{OutputBase}}` vengono
espansi in `args`; se non è presente alcun placeholder `{{Text}}`, OpenClaw scrive il
testo pronunciato su stdin. `outputFormat` accetta `mp3`, `opus` o `wav`.
Le destinazioni nota vocale vengono transcodificate in Ogg/Opus e l’output telefonico viene
transcodificato in PCM mono raw 16 kHz con `ffmpeg`. L’alias legacy del provider
`cli` continua a funzionare, ma la nuova configurazione dovrebbe usare `tts-local-cli`.

### Gradium primario

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

### Disabilitare la voce Microsoft

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

### Limiti personalizzati + percorso delle preferenze

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

### Rispondi con audio solo dopo un messaggio vocale in ingresso

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Disabilitare il riepilogo automatico per le risposte lunghe

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Poi esegui:

```
/tts summary off
```

### Note sui campi

- `auto`: modalità auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` invia audio solo dopo un messaggio vocale in ingresso.
  - `tagged` invia audio solo quando la risposta include direttive `[[tts:key=value]]` o un blocco `[[tts:text]]...[[/tts:text]]`.
- `enabled`: interruttore legacy (doctor lo migra a `auto`).
- `mode`: `"final"` (predefinito) o `"all"` (include risposte di tool/blocco).
- `provider`: id del provider vocale come `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` o `"xiaomi"` (il fallback è automatico).
- Se `provider` **non** è impostato, OpenClaw usa il primo provider vocale configurato nell’ordine di selezione automatica del registro.
- La configurazione legacy `provider: "edge"` viene riparata da `openclaw doctor --fix` e
  riscritta in `provider: "microsoft"`.
- `summaryModel`: modello economico facoltativo per il riepilogo automatico; per impostazione predefinita usa `agents.defaults.model.primary`.
  - Accetta `provider/model` o un alias di modello configurato.
- `modelOverrides`: consente al modello di emettere direttive TTS (attivo per impostazione predefinita).
  - `allowProvider` è `false` per impostazione predefinita (il cambio di provider è opt-in).
- `providers.<id>`: impostazioni possedute dal provider, indicizzate per id del provider vocale.
- I blocchi provider diretti legacy (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) vengono riparati da `openclaw doctor --fix`; la configurazione salvata dovrebbe usare `messages.tts.providers.<id>`.
- Anche il legacy `messages.tts.providers.edge` viene riparato da `openclaw doctor --fix`; la configurazione salvata dovrebbe usare `messages.tts.providers.microsoft`.
- `maxTextLength`: limite rigido per l’input TTS (caratteri). `/tts audio` fallisce se viene superato.
- `timeoutMs`: timeout della richiesta (ms).
- `prefsPath`: sovrascrive il percorso del JSON locale delle preferenze (provider/limite/riepilogo).
- I valori `apiKey` usano come fallback le variabili d’ambiente (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: sovrascrive l’URL base dell’API ElevenLabs.
- `providers.openai.baseUrl`: sovrascrive l’endpoint TTS OpenAI.
  - Ordine di risoluzione: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - I valori non predefiniti vengono trattati come endpoint TTS compatibili con OpenAI, quindi sono accettati nomi personalizzati di modello e voce.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normale)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 a 2 lettere (ad esempio `en`, `de`)
- `providers.elevenlabs.seed`: intero `0..4294967295` (determinismo best-effort)
- `providers.minimax.baseUrl`: sovrascrive l’URL base dell’API MiniMax (predefinito `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modello TTS (predefinito `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificatore della voce (predefinito `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocità di riproduzione `0.5..2.0` (predefinita 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (predefinito 1.0; deve essere maggiore di 0).
- `providers.minimax.pitch`: spostamento intero del tono `-12..12` (predefinito 0). I valori frazionari vengono troncati prima della chiamata a MiniMax T2A perché l’API rifiuta valori di pitch non interi.
- `providers.tts-local-cli.command`: eseguibile locale o stringa di comando per CLI TTS.
- `providers.tts-local-cli.args`: argomenti del comando; supporta i placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` e `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: formato di output previsto della CLI (`mp3`, `opus` o `wav`; predefinito `mp3` per allegati audio).
- `providers.tts-local-cli.timeoutMs`: timeout del comando in millisecondi (predefinito `120000`).
- `providers.tts-local-cli.cwd`: directory di lavoro facoltativa del comando.
- `providers.tts-local-cli.env`: override facoltativi dell’ambiente del comando come stringa.
- `providers.google.model`: modello Gemini TTS (predefinito `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nome della voce predefinita Gemini (predefinito `Kore`; è accettato anche `voice`).
- `providers.google.audioProfile`: prompt in linguaggio naturale anteposto prima del testo parlato.
- `providers.google.speakerName`: etichetta facoltativa del parlante anteposta prima del testo parlato quando il prompt TTS usa un parlante con nome.
- `providers.google.baseUrl`: sovrascrive l’URL base dell’API Gemini. È accettato solo `https://generativelanguage.googleapis.com`.
  - Se `messages.tts.providers.google.apiKey` è omesso, TTS può riutilizzare `models.providers.google.apiKey` prima del fallback all’ambiente.
- `providers.gradium.baseUrl`: sovrascrive l’URL base dell’API Gradium (predefinito `https://api.gradium.ai`).
- `providers.gradium.voiceId`: identificatore della voce Gradium (predefinita Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: API key TTS xAI (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: sovrascrive l’URL base TTS xAI (predefinito `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id della voce xAI (predefinito `eve`; voci live attuali: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: codice lingua BCP-47 o `auto` (predefinito `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` o `alaw` (predefinito `mp3`).
- `providers.xai.speed`: override della velocità nativa del provider.
- `providers.xiaomi.apiKey`: API key Xiaomi MiMo (env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: sovrascrive l’URL base dell’API Xiaomi MiMo (predefinito `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: modello TTS (predefinito `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; è supportato anche `mimo-v2-tts`).
- `providers.xiaomi.voice`: id della voce MiMo (predefinito `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` o `wav` (predefinito `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: istruzione di stile facoltativa in linguaggio naturale inviata come messaggio utente; non viene pronunciata.
- `providers.openrouter.apiKey`: API key OpenRouter (env: `OPENROUTER_API_KEY`; può riutilizzare `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: sovrascrive l’URL base TTS OpenRouter (predefinito `https://openrouter.ai/api/v1`; il legacy `https://openrouter.ai/v1` viene normalizzato).
- `providers.openrouter.model`: id del modello OpenRouter TTS (predefinito `hexgrad/kokoro-82m`; è accettato anche `modelId`).
- `providers.openrouter.voice`: id della voce specifico del provider (predefinito `af_alloy`; è accettato anche `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` o `pcm` (predefinito `mp3`).
- `providers.openrouter.speed`: override della velocità nativa del provider.
- `providers.microsoft.enabled`: consente l’uso della voce Microsoft (predefinito `true`; nessuna API key).
- `providers.microsoft.voice`: nome della voce neurale Microsoft (ad esempio `en-US-MichelleNeural`).
- `providers.microsoft.lang`: codice lingua (ad esempio `en-US`).
- `providers.microsoft.outputFormat`: formato di output Microsoft (ad esempio `audio-24khz-48kbitrate-mono-mp3`).
  - Vedi i formati di output Microsoft Speech per i valori validi; non tutti i formati sono supportati dal trasporto incluso basato su Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: stringhe percentuali (ad esempio `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: scrive sottotitoli JSON accanto al file audio.
- `providers.microsoft.proxy`: URL proxy per le richieste vocali Microsoft.
- `providers.microsoft.timeoutMs`: override del timeout della richiesta (ms).
- `edge.*`: alias legacy per le stesse impostazioni Microsoft. Esegui
  `openclaw doctor --fix` per riscrivere la configurazione persistita in `providers.microsoft`.

## Override guidati dal modello (attivi per impostazione predefinita)

Per impostazione predefinita, il modello **può** emettere direttive TTS per una singola risposta.
Quando `messages.tts.auto` è `tagged`, queste direttive sono necessarie per attivare l’audio.

Quando abilitato, il modello può emettere direttive `[[tts:...]]` per sovrascrivere la voce
per una singola risposta, più un blocco facoltativo `[[tts:text]]...[[/tts:text]]` per
fornire tag espressivi (risate, indicazioni di canto, ecc.) che devono comparire solo
nell’audio.

Le direttive `provider=...` vengono ignorate a meno che `modelOverrides.allowProvider: true`.

Payload di risposta di esempio:

```
Ecco qui.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](ride) Leggi di nuovo la canzone.[[/tts:text]]
```

Chiavi di direttiva disponibili (quando abilitate):

- `provider` (id del provider vocale registrato, per esempio `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` o `xiaomi`; richiede `allowProvider: true`)
- `voice` (voce OpenAI, Gradium o Xiaomi), `voiceName` / `voice_name` / `google_voice` (voce Google) oppure `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (modello OpenAI TTS, id modello ElevenLabs, modello MiniMax o modello Xiaomi MiMo TTS) oppure `google_model` (modello Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (pitch intero MiniMax, da -12 a 12; i valori frazionari vengono troncati prima della richiesta MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Disabilita tutti gli override del modello:

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

Allowlist facoltativa (abilita il cambio provider mantenendo configurabili gli altri controlli):

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

## Preferenze per utente

I comandi slash scrivono gli override locali in `prefsPath` (predefinito:
`~/.openclaw/settings/tts.json`, sovrascrivibile con `OPENCLAW_TTS_PREFS` o
`messages.tts.prefsPath`).

Campi memorizzati:

- `enabled`
- `provider`
- `maxLength` (soglia del riepilogo; predefinita 1500 caratteri)
- `summarize` (predefinito `true`)

Questi hanno la precedenza su `messages.tts.*` per quell’host.

## Formati di output (fissi)

- **Feishu / Matrix / Telegram / WhatsApp**: le risposte come nota vocale preferiscono Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48kHz / 64kbps è un buon compromesso per i messaggi vocali.
- **Feishu**: quando una risposta come nota vocale viene prodotta come MP3/WAV/M4A o altro
  formato che probabilmente è un file audio, il Plugin Feishu la transcodifica in
  Ogg/Opus 48kHz con `ffmpeg` prima di inviare il balloon `audio` nativo. Se la conversione fallisce, Feishu
  riceve il file originale come allegato.
- **Altri canali**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44.1kHz / 128kbps è l’equilibrio predefinito per la chiarezza del parlato.
- **MiniMax**: MP3 (modello `speech-2.8-hd`, sample rate 32kHz) per i normali allegati audio. Per destinazioni come note vocali, come Feishu e Telegram, OpenClaw transcodifica l’MP3 MiniMax in Opus 48kHz con `ffmpeg` prima della consegna.
- **Xiaomi MiMo**: MP3 per impostazione predefinita, oppure WAV se configurato. Per destinazioni come note vocali, come Feishu e Telegram, OpenClaw transcodifica l’output Xiaomi in Opus 48kHz con `ffmpeg` prima della consegna.
- **Local CLI**: usa `outputFormat` configurato. Le destinazioni come note vocali vengono
  convertite in Ogg/Opus e l’output telefonico viene convertito in PCM mono raw 16 kHz
  con `ffmpeg`.
- **Google Gemini**: Gemini API TTS restituisce PCM raw 24kHz. OpenClaw lo incapsula come WAV per gli allegati audio e restituisce PCM direttamente per Talk/telefonia. Il formato Opus nativo per note vocali non è supportato da questo percorso.
- **Gradium**: WAV per allegati audio, Opus per destinazioni come note vocali e `ulaw_8000` a 8 kHz per la telefonia.
- **xAI**: MP3 per impostazione predefinita; `responseFormat` può essere `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa l’endpoint TTS REST batch di xAI e restituisce un allegato audio completo; il WebSocket TTS in streaming di xAI non viene usato da questo percorso del provider. Il formato Opus nativo per note vocali non è supportato da questo percorso.
- **Microsoft**: usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`).
  - Il trasporto incluso accetta un `outputFormat`, ma non tutti i formati sono disponibili dal servizio.
  - I valori di formato output seguono i formati di output Microsoft Speech (inclusi Ogg/WebM Opus).
  - `sendVoice` di Telegram accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se ti servono
    messaggi vocali Opus garantiti.
  - Se il formato output Microsoft configurato fallisce, OpenClaw riprova con MP3.

I formati di output OpenAI/ElevenLabs sono fissi per canale (vedi sopra).

## Comportamento auto-TTS

Quando è abilitato, OpenClaw:

- salta il TTS se la risposta contiene già contenuti multimediali o una direttiva `MEDIA:`.
- salta le risposte molto brevi (< 10 caratteri).
- riassume le risposte lunghe quando abilitato usando `agents.defaults.model.primary` (o `summaryModel`).
- allega l’audio generato alla risposta.

Se la risposta supera `maxLength` e il riepilogo è disattivato (oppure non c’è una API key per il
modello di riepilogo), l’audio
viene saltato e viene inviata la normale risposta testuale.

## Diagramma di flusso

```
Risposta -> TTS abilitato?
  no  -> invia testo
  yes -> contiene media / MEDIA: / è breve?
          yes -> invia testo
          no  -> lunghezza > limite?
                   no  -> TTS -> allega audio
                   yes -> riepilogo abilitato?
                            no  -> invia testo
                            yes -> riassumi (summaryModel o agents.defaults.model.primary)
                                      -> TTS -> allega audio
```

## Uso dei comandi slash

Esiste un solo comando: `/tts`.
Vedi [Comandi slash](/it/tools/slash-commands) per i dettagli di abilitazione.

Nota Discord: `/tts` è un comando integrato di Discord, quindi OpenClaw registra
`/voice` come comando nativo lì. Il testo `/tts ...` continua a funzionare.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Note:

- I comandi richiedono un mittente autorizzato (le regole allowlist/owner continuano ad applicarsi).
- `commands.text` o la registrazione del comando nativo devono essere abilitati.
- La configurazione `messages.tts.auto` accetta `off|always|inbound|tagged`.
- `/tts on` scrive la preferenza TTS locale su `always`; `/tts off` la scrive su `off`.
- Usa la configurazione quando vuoi i valori predefiniti `inbound` o `tagged`.
- `limit` e `summary` vengono memorizzati nelle preferenze locali, non nella configurazione principale.
- `/tts audio` genera una risposta audio una tantum (non attiva il TTS).
- `/tts status` include visibilità del fallback per l’ultimo tentativo:
  - fallback riuscito: `Fallback: <primary> -> <used>` più `Attempts: ...`
  - errore: `Error: ...` più `Attempts: ...`
  - diagnostica dettagliata: `Attempt details: provider:outcome(reasonCode) latency`
- Gli errori API di OpenAI ed ElevenLabs ora includono il dettaglio dell’errore del provider analizzato e l’id richiesta (quando restituito dal provider), che viene esposto negli errori/log TTS.

## Strumento dell’agente

Lo strumento `tts` converte il testo in voce e restituisce un allegato audio per la
consegna della risposta. Quando il canale è Feishu, Matrix, Telegram o WhatsApp,
l’audio viene consegnato come messaggio vocale invece che come allegato file.
Feishu può transcodificare l’output TTS non-Opus in questo percorso quando `ffmpeg` è
disponibile.
Accetta campi facoltativi `channel` e `timeoutMs`; `timeoutMs` è un
timeout per chiamata della richiesta al provider in millisecondi.

## RPC Gateway

Metodi Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Correlati

- [Panoramica dei media](/it/tools/media-overview)
- [Generazione musicale](/it/tools/music-generation)
- [Generazione video](/it/tools/video-generation)
