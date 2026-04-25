---
read_when:
    - Modifica della trascrizione audio o della gestione dei media
summary: Come l'audio in ingresso e le note vocali vengono scaricati, trascritti e inseriti nelle risposte
title: Audio e note vocali
x-i18n:
    generated_at: "2026-04-25T13:50:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Note vocali (2026-01-17)

## Cosa funziona

- **Comprensione dei media (audio)**: se la comprensione audio è abilitata (o rilevata automaticamente), OpenClaw:
  1. Individua il primo allegato audio (percorso locale o URL) e lo scarica se necessario.
  2. Applica `maxBytes` prima di inviarlo a ogni voce di modello.
  3. Esegue la prima voce di modello idonea in ordine (provider o CLI).
  4. Se fallisce o viene saltata (dimensione/timeout), prova la voce successiva.
  5. In caso di successo, sostituisce `Body` con un blocco `[Audio]` e imposta `{{Transcript}}`.
- **Parsing dei comandi**: quando la trascrizione riesce, `CommandBody`/`RawBody` vengono impostati sulla trascrizione così i comandi slash continuano a funzionare.
- **Logging verboso**: con `--verbose`, registriamo quando la trascrizione viene eseguita e quando sostituisce il body.

## Rilevamento automatico (predefinito)

Se **non configuri modelli** e `tools.media.audio.enabled` **non** è impostato su `false`,
OpenClaw esegue il rilevamento automatico in questo ordine e si ferma alla prima opzione funzionante:

1. **Modello di risposta attivo** quando il suo provider supporta la comprensione audio.
2. **CLI locali** (se installate)
   - `sherpa-onnx-offline` (richiede `SHERPA_ONNX_MODEL_DIR` con encoder/decoder/joiner/tokens)
   - `whisper-cli` (da `whisper-cpp`; usa `WHISPER_CPP_MODEL` o il modello tiny incluso)
   - `whisper` (CLI Python; scarica automaticamente i modelli)
3. **Gemini CLI** (`gemini`) usando `read_many_files`
4. **Auth del provider**
   - Le voci configurate `models.providers.*` che supportano l'audio vengono provate per prime
   - Ordine di fallback bundled: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Per disabilitare il rilevamento automatico, imposta `tools.media.audio.enabled: false`.
Per personalizzare, imposta `tools.media.audio.models`.
Nota: il rilevamento dei binari è best-effort su macOS/Linux/Windows; assicurati che la CLI sia nel `PATH` (espandiamo `~`), oppure imposta un modello CLI esplicito con un percorso completo del comando.

## Esempi di configurazione

### Fallback provider + CLI (OpenAI + Whisper CLI)

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

### Solo provider con controllo dell'ambito

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

### Solo provider (Deepgram)

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

### Solo provider (Mistral Voxtral)

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

### Solo provider (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Echo della trascrizione in chat (opt-in)

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

## Note e limiti

- L'auth del provider segue l'ordine auth standard dei modelli (profili auth, variabili env, `models.providers.*.apiKey`).
- Dettagli di configurazione Groq: [Groq](/it/providers/groq).
- Deepgram rileva `DEEPGRAM_API_KEY` quando viene usato `provider: "deepgram"`.
- Dettagli di configurazione Deepgram: [Deepgram (trascrizione audio)](/it/providers/deepgram).
- Dettagli di configurazione Mistral: [Mistral](/it/providers/mistral).
- SenseAudio rileva `SENSEAUDIO_API_KEY` quando viene usato `provider: "senseaudio"`.
- Dettagli di configurazione SenseAudio: [SenseAudio](/it/providers/senseaudio).
- I provider audio possono sostituire `baseUrl`, `headers` e `providerOptions` tramite `tools.media.audio`.
- Il limite di dimensione predefinito è 20MB (`tools.media.audio.maxBytes`). L'audio sovradimensionato viene saltato per quel modello e viene provata la voce successiva.
- I file audio minimi/vuoti sotto 1024 byte vengono saltati prima della trascrizione provider/CLI.
- Il valore predefinito di `maxChars` per l'audio è **non impostato** (trascrizione completa). Imposta `tools.media.audio.maxChars` o `maxChars` per-voce per ridurre l'output.
- Il valore predefinito automatico di OpenAI è `gpt-4o-mini-transcribe`; imposta `model: "gpt-4o-transcribe"` per una maggiore accuratezza.
- Usa `tools.media.audio.attachments` per elaborare più note vocali (`mode: "all"` + `maxAttachments`).
- La trascrizione è disponibile nei template come `{{Transcript}}`.
- `tools.media.audio.echoTranscript` è disattivato per impostazione predefinita; abilitalo per inviare una conferma della trascrizione alla chat di origine prima dell'elaborazione da parte dell'agente.
- `tools.media.audio.echoFormat` personalizza il testo dell'echo (segnaposto: `{transcript}`).
- Lo stdout della CLI è limitato (5MB); mantieni conciso l'output della CLI.

### Supporto environment proxy

La trascrizione audio basata su provider rispetta le variabili env proxy standard per il traffico in uscita:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se non sono impostate variabili env proxy, viene usata l'uscita diretta. Se la configurazione del proxy non è valida, OpenClaw registra un avviso e usa il fetch diretto come fallback.

## Rilevamento delle menzioni nei gruppi

Quando `requireMention: true` è impostato per una chat di gruppo, OpenClaw ora trascrive l'audio **prima** di controllare le menzioni. Questo consente di elaborare le note vocali anche quando contengono menzioni.

**Come funziona:**

1. Se un messaggio vocale non ha body di testo e il gruppo richiede menzioni, OpenClaw esegue una trascrizione "preflight".
2. La trascrizione viene controllata rispetto ai pattern di menzione (ad esempio `@BotName`, trigger emoji).
3. Se viene trovata una menzione, il messaggio prosegue attraverso l'intera pipeline di risposta.
4. La trascrizione viene usata per il rilevamento delle menzioni così le note vocali possono superare il gate delle menzioni.

**Comportamento di fallback:**

- Se la trascrizione fallisce durante il preflight (timeout, errore API, ecc.), il messaggio viene elaborato in base al solo rilevamento delle menzioni nel testo.
- Questo garantisce che i messaggi misti (testo + audio) non vengano mai scartati erroneamente.

**Opt-out per gruppo/topic Telegram:**

- Imposta `channels.telegram.groups.<chatId>.disableAudioPreflight: true` per saltare i controlli di menzione della trascrizione preflight per quel gruppo.
- Imposta `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` per l'override per-topic (`true` per saltare, `false` per forzare l'abilitazione).
- Il valore predefinito è `false` (preflight abilitato quando corrispondono le condizioni con gate delle menzioni).

**Esempio:** un utente invia una nota vocale dicendo "Hey @Claude, com'è il meteo?" in un gruppo Telegram con `requireMention: true`. La nota vocale viene trascritta, la menzione viene rilevata e l'agente risponde.

## Insidie

- Le regole di ambito usano first-match wins. `chatType` viene normalizzato in `direct`, `group` o `room`.
- Assicurati che la CLI termini con codice 0 e stampi testo semplice; il JSON deve essere adattato tramite `jq -r .text`.
- Per `parakeet-mlx`, se passi `--output-dir`, OpenClaw legge `<output-dir>/<media-basename>.txt` quando `--output-format` è `txt` (o omesso); i formati di output diversi da `txt` usano il parsing di stdout come fallback.
- Mantieni timeout ragionevoli (`timeoutSeconds`, predefinito 60s) per evitare di bloccare la coda delle risposte.
- La trascrizione preflight elabora solo il **primo** allegato audio per il rilevamento delle menzioni. L'audio aggiuntivo viene elaborato durante la fase principale di comprensione dei media.

## Correlati

- [Comprensione dei media](/it/nodes/media-understanding)
- [Modalità Talk](/it/nodes/talk)
- [Voice wake](/it/nodes/voicewake)
