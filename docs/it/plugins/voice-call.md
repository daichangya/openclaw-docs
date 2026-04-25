---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il plugin voice-call
summary: 'Plugin Voice Call: chiamate in uscita + in entrata tramite Twilio/Telnyx/Plivo (installazione del Plugin + configurazione + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-25T13:54:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

Chiamate vocali per OpenClaw tramite un Plugin. Supporta notifiche in uscita e
conversazioni multi-turno con policy inbound.

Provider attuali:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (sviluppo/nessuna rete)

Modello mentale rapido:

- Installa il Plugin
- Riavvia il Gateway
- Configura sotto `plugins.entries.voice-call.config`
- Usa `openclaw voicecall ...` o lo strumento `voice_call`

## Dove viene eseguito (locale vs remoto)

Il Plugin Voice Call viene eseguito **all'interno del processo Gateway**.

Se usi un Gateway remoto, installa/configura il Plugin sulla **macchina che esegue il Gateway**, quindi riavvia il Gateway per caricarlo.

## Installazione

### Opzione A: installa da npm (consigliato)

```bash
openclaw plugins install @openclaw/voice-call
```

Riavvia successivamente il Gateway.

### Opzione B: installa da una cartella locale (sviluppo, senza copia)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Riavvia successivamente il Gateway.

## Configurazione

Imposta la configurazione sotto `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // oppure "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // oppure TWILIO_FROM_NUMBER per Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Chiave pubblica webhook Telnyx dal Telnyx Mission Control Portal
            // (stringa Base64; può anche essere impostata tramite TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Server webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Sicurezza webhook (consigliata per tunnel/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Esposizione pubblica (scegline una)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // facoltativo; primo provider di trascrizione realtime registrato se non impostato
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // facoltativo se OPENAI_API_KEY è impostato
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // facoltativo; primo provider di voce realtime registrato se non impostato
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Controlla la configurazione prima di testare con un provider reale:

```bash
openclaw voicecall setup
```

L'output predefinito è leggibile nei log chat e nelle sessioni terminale. Controlla
se il Plugin è abilitato, se provider e credenziali sono presenti, se l'esposizione
webhook è configurata e se è attiva una sola modalità audio. Usa
`openclaw voicecall setup --json` per gli script.

Per Twilio, Telnyx e Plivo, il setup deve risolversi in un URL webhook pubblico. Se il
`publicUrl` configurato, l'URL tunnel, l'URL Tailscale o il fallback serve si risolvono in
loopback o spazio di rete privata, il setup fallisce invece di avviare un provider
che non può ricevere reali webhook del carrier.

Per uno smoke test senza sorprese, esegui:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

Il secondo comando è comunque una simulazione. Aggiungi `--yes` per effettuare una breve
chiamata notify in uscita:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Note:

- Twilio/Telnyx richiedono un URL webhook **pubblicamente raggiungibile**.
- Plivo richiede un URL webhook **pubblicamente raggiungibile**.
- `mock` è un provider locale per sviluppo (nessuna chiamata di rete).
- Se configurazioni più vecchie usano ancora `provider: "log"`, `twilio.from` o chiavi OpenAI legacy `streaming.*`, esegui `openclaw doctor --fix` per riscriverle.
- Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` non sia true.
- `skipSignatureVerification` è solo per test locali.
- Se usi il piano gratuito ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma è sempre applicata.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è loopback (agente locale ngrok). Usare solo per sviluppo locale.
- Gli URL del piano gratuito ngrok possono cambiare o aggiungere comportamento interstitial; se `publicUrl` deriva, le firme Twilio falliranno. Per la produzione, preferisci un dominio stabile o Tailscale funnel.
- `realtime.enabled` avvia conversazioni vocali full voice-to-voice; non abilitarlo insieme a `streaming.enabled`.
- Valori predefiniti di sicurezza streaming:
  - `streaming.preStartTimeoutMs` chiude i socket che non inviano mai un frame `start` valido.
- `streaming.maxPendingConnections` limita il totale dei socket pre-start non autenticati.
- `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP sorgente.
- `streaming.maxConnections` limita il totale dei socket media stream aperti (in attesa + attivi).
- Il fallback runtime accetta ancora per ora quelle vecchie chiavi voice-call, ma il percorso di riscrittura è `openclaw doctor --fix` e lo shim di compatibilità è temporaneo.

## Conversazioni vocali realtime

`realtime` seleziona un provider di voce realtime full duplex per l'audio live della chiamata.
È separato da `streaming`, che inoltra solo l'audio ai provider di
trascrizione realtime.

Comportamento runtime attuale:

- `realtime.enabled` è supportato per Twilio Media Streams.
- `realtime.enabled` non può essere combinato con `streaming.enabled`.
- `realtime.provider` è facoltativo. Se non impostato, Voice Call usa il primo
  provider di voce realtime registrato.
- I provider bundled di voce realtime includono Google Gemini Live (`google`) e
  OpenAI (`openai`), registrati dai rispettivi Plugin provider.
- La configurazione raw posseduta dal provider si trova sotto `realtime.providers.<providerId>`.
- Voice Call espone lo strumento realtime condiviso `openclaw_agent_consult` per impostazione predefinita. Il modello realtime può chiamarlo quando il chiamante chiede ragionamento più approfondito, informazioni attuali o normali strumenti OpenClaw.
- `realtime.toolPolicy` controlla l'esecuzione consult:
  - `safe-read-only`: espone lo strumento consult e limita l'agente regolare a
    `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
    `memory_get`.
  - `owner`: espone lo strumento consult e lascia che l'agente regolare usi la normale
    tool policy dell'agente.
  - `none`: non espone lo strumento consult. Gli `realtime.tools` personalizzati sono comunque
    passati al provider realtime.
- Le chiavi di sessione consult riusano la sessione voce esistente quando disponibile, poi
  fanno fallback al numero di telefono del chiamante/chiamato in modo che le chiamate consult successive mantengano
  il contesto durante la chiamata.
- Se `realtime.provider` punta a un provider non registrato, o non è registrato alcun provider di voce realtime, Voice Call registra un avviso e salta i media realtime invece di far fallire l'intero Plugin.

Valori predefiniti realtime di Google Gemini Live:

- Chiave API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`, oppure
  `GOOGLE_GENERATIVE_AI_API_KEY`
- modello: `gemini-2.5-flash-native-audio-preview-12-2025`
- voce: `Kore`

Esempio:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Parla brevemente. Chiama openclaw_agent_consult prima di usare strumenti più avanzati.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Usa invece OpenAI:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Vedi [Google provider](/it/providers/google) e [OpenAI provider](/it/providers/openai)
per le opzioni specifiche del provider di voce realtime.

## Trascrizione in streaming

`streaming` seleziona un provider di trascrizione realtime per l'audio live della chiamata.

Comportamento runtime attuale:

- `streaming.provider` è facoltativo. Se non impostato, Voice Call usa il primo
  provider di trascrizione realtime registrato.
- I provider bundled di trascrizione realtime includono Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI
  (`xai`), registrati dai rispettivi Plugin provider.
- La configurazione raw posseduta dal provider si trova sotto `streaming.providers.<providerId>`.
- Se `streaming.provider` punta a un provider non registrato, o non è registrato alcun provider di trascrizione realtime, Voice Call registra un avviso e
  salta lo streaming dei media invece di far fallire l'intero Plugin.

Valori predefiniti di trascrizione streaming OpenAI:

- Chiave API: `streaming.providers.openai.apiKey` oppure `OPENAI_API_KEY`
- modello: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Valori predefiniti di trascrizione streaming xAI:

- Chiave API: `streaming.providers.xai.apiKey` oppure `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Esempio:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // facoltativo se OPENAI_API_KEY è impostato
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Usa invece xAI:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // facoltativo se XAI_API_KEY è impostato
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Le chiavi legacy vengono ancora migrate automaticamente da `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Reaper delle chiamate obsolete

Usa `staleCallReaperSeconds` per terminare chiamate che non ricevono mai un webhook terminale
(ad esempio chiamate in modalità notify che non si completano mai). Il valore predefinito è `0`
(disabilitato).

Intervalli consigliati:

- **Produzione:** `120`–`300` secondi per flussi in stile notify.
- Mantieni questo valore **più alto di `maxDurationSeconds`** in modo che le chiamate normali possano
  terminare. Un buon punto di partenza è `maxDurationSeconds + 30–60` secondi.

Esempio:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Sicurezza dei webhook

Quando un proxy o tunnel si trova davanti al Gateway, il Plugin ricostruisce l'URL
pubblico per la verifica della firma. Queste opzioni controllano quali header inoltrati vengono considerati attendibili.

`webhookSecurity.allowedHosts` mette in allowlist gli host dagli header di forwarding.

`webhookSecurity.trustForwardingHeaders` considera attendibili gli header inoltrati senza un'allowlist.

`webhookSecurity.trustedProxyIPs` considera attendibili gli header inoltrati solo quando l'IP remoto
della richiesta corrisponde all'elenco.

La protezione dal replay dei webhook è abilitata per Twilio e Plivo. Le richieste webhook
valide ma replicate vengono riconosciute ma saltate per quanto riguarda gli effetti collaterali.

I turni di conversazione Twilio includono un token per turno nei callback `<Gather>`, quindi
callback vocali obsolete/riprodotte non possono soddisfare un turno di transcript più recente in sospeso.

Le richieste webhook non autenticate vengono rifiutate prima della lettura del body quando
mancano gli header di firma richiesti dal provider.

Il webhook voice-call usa il profilo condiviso pre-auth del body (64 KB / 5 secondi)
più un limite per IP delle richieste in corso prima della verifica della firma.

Esempio con un host pubblico stabile:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS per le chiamate

Voice Call usa la configurazione core `messages.tts` per
lo streaming del parlato nelle chiamate. Puoi sovrascriverla sotto la configurazione del Plugin con la
**stessa forma** — viene unita in deep-merge con `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Note:

- Le chiavi legacy `tts.<provider>` dentro la configurazione del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono riparate da `openclaw doctor --fix`; la configurazione versionata dovrebbe usare `tts.providers.<provider>`.
- **Lo speech Microsoft viene ignorato per le chiamate vocali** (l'audio telefonico ha bisogno di PCM; l'attuale trasporto Microsoft non espone output PCM telefonico).
- Il TTS core viene usato quando lo streaming media Twilio è abilitato; altrimenti le chiamate fanno fallback alle voci native del provider.
- Se uno stream media Twilio è già attivo, Voice Call non fa fallback a `<Say>` TwiML. Se il TTS telefonico non è disponibile in quello stato, la richiesta di playback fallisce invece di mescolare due percorsi di playback.
- Quando il TTS telefonico fa fallback a un provider secondario, Voice Call registra un avviso con la catena dei provider (`from`, `to`, `attempts`) per il debug.
- Quando il barge-in Twilio o il teardown dello stream svuotano la coda TTS in sospeso, le richieste di playback accodate vengono risolte invece di lasciare bloccati i chiamanti che attendono il completamento del playback.

### Altri esempi

Usa solo il TTS core (nessuna sovrascrittura):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Sovrascrivi a ElevenLabs solo per le chiamate (mantieni il valore predefinito core altrove):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Sovrascrivi solo il modello OpenAI per le chiamate (esempio di deep-merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Chiamate in ingresso

La policy inbound è per impostazione predefinita `disabled`. Per abilitare le chiamate in ingresso, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Ciao! Come posso aiutarti?",
}
```

`inboundPolicy: "allowlist"` è un filtro a bassa affidabilità basato sul caller-ID. Il Plugin
normalizza il valore `From` fornito dal provider e lo confronta con `allowFrom`.
La verifica del webhook autentica la consegna del provider e l'integrità del payload, ma
non prova la titolarità del numero chiamante PSTN/VoIP. Tratta `allowFrom` come
filtraggio caller-ID, non come forte identità del chiamante.

Le risposte automatiche usano il sistema agente. Regolale con:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contratto dell'output parlato

Per le risposte automatiche, Voice Call aggiunge un rigoroso contratto di output parlato al system prompt:

- `{"spoken":"..."}`

Voice Call estrae poi il testo del parlato in modo difensivo:

- Ignora payload contrassegnati come contenuto di reasoning/errore.
- Analizza JSON diretto, JSON fenced o chiavi `"spoken"` inline.
- Fa fallback a testo semplice e rimuove i paragrafi iniziali più probabili di pianificazione/meta.

Questo mantiene il playback parlato focalizzato sul testo rivolto al chiamante ed evita di far trapelare testo di pianificazione nell'audio.

### Comportamento di avvio della conversazione

Per le chiamate outbound `conversation`, la gestione del primo messaggio è legata allo stato di playback live:

- Lo svuotamento della coda dovuto a barge-in e la risposta automatica vengono soppressi solo mentre il saluto iniziale è attivamente in riproduzione.
- Se il playback iniziale fallisce, la chiamata torna a `listening` e il messaggio iniziale resta in coda per il retry.
- Il playback iniziale per Twilio streaming parte alla connessione dello stream senza ritardi extra.
- Il barge-in interrompe il playback attivo e svuota le voci TTS Twilio accodate ma non ancora in riproduzione. Le voci rimosse vengono risolte come saltate, così la logica di risposta successiva può continuare senza attendere audio che non verrà mai riprodotto.
- Le conversazioni vocali realtime usano il proprio turno iniziale dello stream realtime. Voice Call non pubblica un aggiornamento legacy `<Say>` TwiML per quel messaggio iniziale, così le sessioni outbound `<Connect><Stream>` restano collegate.

### Periodo di tolleranza alla disconnessione dello stream Twilio

Quando uno stream media Twilio si disconnette, Voice Call attende `2000ms` prima di terminare automaticamente la chiamata:

- Se lo stream si riconnette durante quella finestra, la terminazione automatica viene annullata.
- Se nessuno stream viene registrato di nuovo dopo il periodo di tolleranza, la chiamata viene terminata per evitare chiamate attive bloccate.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Ciao da OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias di call
openclaw voicecall continue --call-id <id> --message "Hai domande?"
openclaw voicecall speak --call-id <id> --message "Un momento"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # riepiloga la latenza dei turni dai log
openclaw voicecall expose --mode funnel
```

`latency` legge `calls.jsonl` dal percorso di storage predefinito di voice-call. Usa
`--file <path>` per indicare un log diverso e `--last <n>` per limitare l'analisi
agli ultimi N record (predefinito 200). L'output include p50/p90/p99 per la
latenza dei turni e i tempi di attesa in ascolto.

## Strumento dell'agente

Nome dello strumento: `voice_call`

Azioni:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Questo repository distribuisce un documento Skill corrispondente in `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Correlati

- [Text-to-speech](/it/tools/tts)
- [Talk mode](/it/nodes/talk)
- [Voice wake](/it/nodes/voicewake)
