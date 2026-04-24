---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il plugin voice-call
summary: 'Plugin Voice Call: chiamate in uscita e in entrata tramite Twilio/Telnyx/Plivo (installazione del Plugin + configurazione + CLI)'
title: Plugin Voice call
x-i18n:
    generated_at: "2026-04-24T09:54:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Chiamate vocali per OpenClaw tramite un Plugin. Supporta notifiche in uscita e
conversazioni multi-turno con policy in entrata.

Provider attuali:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + trasferimento XML + GetInput speech)
- `mock` (sviluppo/nessuna rete)

Modello mentale rapido:

- Installa il Plugin
- Riavvia il Gateway
- Configura in `plugins.entries.voice-call.config`
- Usa `openclaw voicecall ...` o lo strumento `voice_call`

## Dove viene eseguito (locale vs remoto)

Il Plugin Voice Call viene eseguito **all'interno del processo Gateway**.

Se usi un Gateway remoto, installa/configura il Plugin sulla **macchina che esegue il Gateway**, quindi riavvia il Gateway per caricarlo.

## Installazione

### Opzione A: installazione da npm (consigliata)

```bash
openclaw plugins install @openclaw/voice-call
```

Riavvia il Gateway dopo.

### Opzione B: installazione da una cartella locale (sviluppo, senza copia)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Riavvia il Gateway dopo.

## Configurazione

Imposta la configurazione in `plugins.entries.voice-call.config`:

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
            // Chiave pubblica del Webhook Telnyx dal Telnyx Mission Control Portal
            // (stringa Base64; può anche essere impostata tramite TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Server Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Sicurezza Webhook (consigliata per tunnel/proxy)
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
            provider: "openai", // facoltativo; primo provider di trascrizione realtime registrato quando non impostato
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
            provider: "google", // facoltativo; primo provider vocale realtime registrato quando non impostato
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

Note:

- Twilio/Telnyx richiedono un URL Webhook **raggiungibile pubblicamente**.
- Plivo richiede un URL Webhook **raggiungibile pubblicamente**.
- `mock` è un provider locale per lo sviluppo (nessuna chiamata di rete).
- Se le configurazioni più vecchie usano ancora `provider: "log"`, `twilio.from` o chiavi OpenAI legacy `streaming.*`, esegui `openclaw doctor --fix` per riscriverle.
- Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` non sia true.
- `skipSignatureVerification` è solo per test locali.
- Se usi il piano gratuito di ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma è sempre applicata.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente Webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è loopback (agente locale ngrok). Usare solo per sviluppo locale.
- Gli URL del piano gratuito ngrok possono cambiare o aggiungere comportamenti interstitial; se `publicUrl` cambia, le firme Twilio falliranno. Per la produzione, preferisci un dominio stabile o Tailscale funnel.
- `realtime.enabled` avvia conversazioni vocali voice-to-voice complete; non abilitarlo insieme a `streaming.enabled`.
- Impostazioni predefinite di sicurezza per lo streaming:
  - `streaming.preStartTimeoutMs` chiude i socket che non inviano mai un frame `start` valido.
- `streaming.maxPendingConnections` limita il totale dei socket pre-start non autenticati.
- `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP sorgente.
- `streaming.maxConnections` limita il totale dei socket aperti del media stream (in attesa + attivi).
- Il fallback di runtime accetta ancora per ora quelle vecchie chiavi voice-call, ma il percorso di riscrittura è `openclaw doctor --fix` e lo shim di compatibilità è temporaneo.

## Conversazioni vocali realtime

`realtime` seleziona un provider vocale realtime full duplex per l'audio della chiamata in tempo reale.
È separato da `streaming`, che inoltra soltanto l'audio ai provider di
trascrizione realtime.

Comportamento attuale del runtime:

- `realtime.enabled` è supportato per Twilio Media Streams.
- `realtime.enabled` non può essere combinato con `streaming.enabled`.
- `realtime.provider` è facoltativo. Se non impostato, Voice Call usa il primo
  provider vocale realtime registrato.
- I provider vocali realtime inclusi comprendono Google Gemini Live (`google`) e
  OpenAI (`openai`), registrati dai loro plugin provider.
- La configurazione raw posseduta dal provider si trova in `realtime.providers.<providerId>`.
- Se `realtime.provider` punta a un provider non registrato, oppure non è
  registrato alcun provider vocale realtime, Voice Call registra un avviso e salta
  i media realtime invece di far fallire l'intero Plugin.

Valori predefiniti realtime di Google Gemini Live:

- Chiave API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`, oppure
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

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
            instructions: "Parla brevemente e chiedi prima di usare strumenti.",
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
per le opzioni vocali realtime specifiche del provider.

## Trascrizione streaming

`streaming` seleziona un provider di trascrizione realtime per l'audio della chiamata in tempo reale.

Comportamento attuale del runtime:

- `streaming.provider` è facoltativo. Se non impostato, Voice Call usa il primo
  provider di trascrizione realtime registrato.
- I provider di trascrizione realtime inclusi comprendono Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI
  (`xai`), registrati dai loro plugin provider.
- La configurazione raw posseduta dal provider si trova in `streaming.providers.<providerId>`.
- Se `streaming.provider` punta a un provider non registrato, oppure non è
  registrato alcun provider di trascrizione realtime, Voice Call registra un avviso e
  salta lo streaming dei media invece di far fallire l'intero Plugin.

Valori predefiniti della trascrizione streaming OpenAI:

- Chiave API: `streaming.providers.openai.apiKey` oppure `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Valori predefiniti della trascrizione streaming xAI:

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

## Reaper delle chiamate inattive

Usa `staleCallReaperSeconds` per terminare le chiamate che non ricevono mai un Webhook terminale
(per esempio, chiamate in modalità notify che non vengono mai completate). Il valore predefinito è `0`
(disabilitato).

Intervalli consigliati:

- **Produzione:** `120`–`300` secondi per flussi in stile notify.
- Mantieni questo valore **più alto di `maxDurationSeconds`** così le chiamate normali possono
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

## Sicurezza Webhook

Quando un proxy o un tunnel si trova davanti al Gateway, il Plugin ricostruisce l'URL
pubblico per la verifica della firma. Queste opzioni controllano di quali header
inoltrati ci si può fidare.

`webhookSecurity.allowedHosts` consente tramite allowlist gli host dagli header di inoltro.

`webhookSecurity.trustForwardingHeaders` considera affidabili gli header inoltrati senza un'allowlist.

`webhookSecurity.trustedProxyIPs` considera affidabili gli header inoltrati solo quando l'IP
remoto della richiesta corrisponde all'elenco.

La protezione dal replay dei Webhook è abilitata per Twilio e Plivo. Le richieste Webhook
valide ma ripetute vengono riconosciute ma gli effetti collaterali vengono saltati.

I turni di conversazione Twilio includono un token per turno nei callback `<Gather>`, quindi
i callback vocali obsoleti/ripetuti non possono soddisfare un turno di trascrizione pendente più recente.

Le richieste Webhook non autenticate vengono rifiutate prima della lettura del body quando mancano
gli header di firma richiesti dal provider.

Il Webhook voice-call usa il profilo body pre-auth condiviso (64 KB / 5 secondi)
più un limite per-IP delle richieste in-flight prima della verifica della firma.

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
lo streaming della voce nelle chiamate. Puoi sovrascriverla nella configurazione del plugin con la
**stessa struttura** — viene unita in deep-merge con `messages.tts`.

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

- Le chiavi legacy `tts.<provider>` all'interno della configurazione del plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono migrate automaticamente a `tts.providers.<provider>` al caricamento. Nella configurazione salvata, preferisci la struttura `providers`.
- **Microsoft speech viene ignorato per le chiamate vocali** (l'audio di telefonia richiede PCM; il trasporto Microsoft attuale non espone output PCM per telefonia).
- Il TTS core viene usato quando lo streaming media Twilio è abilitato; altrimenti le chiamate ripiegano sulle voci native del provider.
- Se un media stream Twilio è già attivo, Voice Call non ripiega su TwiML `<Say>`. Se il TTS di telefonia non è disponibile in quello stato, la richiesta di riproduzione fallisce invece di mescolare due percorsi di riproduzione.
- Quando il TTS di telefonia ripiega su un provider secondario, Voice Call registra un avviso con la catena dei provider (`from`, `to`, `attempts`) per il debug.

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

Sovrascrivi con ElevenLabs solo per le chiamate (mantieni altrove il valore predefinito core):

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

## Chiamate in entrata

La policy in entrata è impostata per default su `disabled`. Per abilitare le chiamate in entrata, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Ciao! Come posso aiutarti?",
}
```

`inboundPolicy: "allowlist"` è un filtro del caller ID a bassa affidabilità. Il plugin
normalizza il valore `From` fornito dal provider e lo confronta con `allowFrom`.
La verifica del Webhook autentica la consegna del provider e l'integrità del payload, ma
non dimostra la proprietà del numero chiamante PSTN/VoIP. Tratta `allowFrom` come
filtro del caller ID, non come forte identità del chiamante.

Le risposte automatiche usano il sistema agent. Regolale con:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contratto di output parlato

Per le risposte automatiche, Voice Call aggiunge un contratto rigoroso di output parlato al prompt di sistema:

- `{"spoken":"..."}`

Voice Call quindi estrae il testo parlato in modo difensivo:

- Ignora i payload contrassegnati come contenuto di ragionamento/errore.
- Analizza JSON diretto, JSON fenced oppure chiavi `"spoken"` inline.
- Ripiega su testo semplice e rimuove i paragrafi iniziali probabili di pianificazione/meta.

Questo mantiene la riproduzione vocale focalizzata sul testo rivolto al chiamante ed evita di far trapelare nell'audio testo di pianificazione.

### Comportamento di avvio della conversazione

Per le chiamate in uscita `conversation`, la gestione del primo messaggio è legata allo stato della riproduzione live:

- L'azzeramento della coda barge-in e la risposta automatica vengono soppressi solo mentre il saluto iniziale è effettivamente in riproduzione.
- Se la riproduzione iniziale fallisce, la chiamata torna a `listening` e il messaggio iniziale resta in coda per un nuovo tentativo.
- Per Twilio streaming, la riproduzione iniziale parte alla connessione dello stream senza ritardi aggiuntivi.

### Tolleranza alla disconnessione dello stream Twilio

Quando un media stream Twilio si disconnette, Voice Call attende `2000ms` prima di terminare automaticamente la chiamata:

- Se lo stream si riconnette durante quella finestra, la terminazione automatica viene annullata.
- Se dopo il periodo di tolleranza non viene registrato di nuovo alcuno stream, la chiamata viene terminata per evitare chiamate attive bloccate.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias di call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # riepiloga la latenza dei turni dai log
openclaw voicecall expose --mode funnel
```

`latency` legge `calls.jsonl` dal percorso di archiviazione predefinito di voice-call. Usa
`--file <path>` per puntare a un log diverso e `--last <n>` per limitare l'analisi
agli ultimi N record (predefinito 200). L'output include p50/p90/p99 per la
latenza dei turni e i tempi di attesa in ascolto.

## Strumento agent

Nome dello strumento: `voice_call`

Azioni:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Questo repo include un documento Skills corrispondente in `skills/voice-call/SKILL.md`.

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
