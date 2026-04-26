---
read_when:
    - Implementazione della modalità Talk su macOS/iOS/Android
    - Modifica del comportamento di voce/TTS/interruzione
summary: 'Modalità Talk: conversazioni vocali continue con provider TTS configurati'
title: Modalità Talk
x-i18n:
    generated_at: "2026-04-26T11:33:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

La modalità Talk è un ciclo continuo di conversazione vocale:

1. Ascolta il parlato
2. Invia la trascrizione al modello (sessione principale, `chat.send`)
3. Attende la risposta
4. La riproduce tramite il provider Talk configurato (`talk.speak`)

## Comportamento (macOS)

- **Overlay sempre attivo** mentre la modalità Talk è abilitata.
- Transizioni di fase **Ascolto → Elaborazione → Parlato**.
- In caso di **breve pausa** (finestra di silenzio), la trascrizione corrente viene inviata.
- Le risposte vengono **scritte in WebChat** (come se fossero digitate).
- **Interruzione quando si parla** (attiva per impostazione predefinita): se l'utente inizia a parlare mentre l'assistente sta parlando, interrompiamo la riproduzione e annotiamo il timestamp dell'interruzione per il prompt successivo.

## Direttive vocali nelle risposte

L'assistente può anteporre alla propria risposta una **singola riga JSON** per controllare la voce:

```json
{ "voice": "<voice-id>", "once": true }
```

Regole:

- Solo la prima riga non vuota.
- Le chiavi sconosciute vengono ignorate.
- `once: true` si applica solo alla risposta corrente.
- Senza `once`, la voce diventa il nuovo valore predefinito della modalità Talk.
- La riga JSON viene rimossa prima della riproduzione TTS.

Chiavi supportate:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Configurazione (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Valori predefiniti:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: se non impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms su macOS e Android, 900 ms su iOS`)
- `provider`: seleziona il provider Talk attivo. Usa `elevenlabs`, `mlx` o `system` per i percorsi di riproduzione locali su macOS.
- `providers.<provider>.voiceId`: usa come fallback `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` per ElevenLabs (oppure la prima voce ElevenLabs quando è disponibile una chiave API).
- `providers.elevenlabs.modelId`: usa come predefinito `eleven_v3` quando non impostato.
- `providers.mlx.modelId`: usa come predefinito `mlx-community/Soprano-80M-bf16` quando non impostato.
- `providers.elevenlabs.apiKey`: usa come fallback `ELEVENLABS_API_KEY` (oppure il profilo shell del gateway se disponibile).
- `speechLocale`: id locale BCP 47 facoltativo per il riconoscimento vocale Talk on-device su iOS/macOS. Lascialo non impostato per usare il valore predefinito del dispositivo.
- `outputFormat`: usa come predefinito `pcm_44100` su macOS/iOS e `pcm_24000` su Android (imposta `mp3_*` per forzare lo streaming MP3)

## UI macOS

- Toggle nella barra dei menu: **Talk**
- Scheda Config: gruppo **Modalità Talk** (id voce + toggle di interruzione)
- Overlay:
  - **Ascolto**: impulsi della nuvola con livello microfono
  - **Elaborazione**: animazione discendente
  - **Parlato**: anelli radianti
  - Clic sulla nuvola: interrompe il parlato
  - Clic sulla X: esce dalla modalità Talk

## UI Android

- Toggle nella scheda Voice: **Talk**
- **Mic** manuale e **Talk** sono modalità di acquisizione runtime mutuamente esclusive.
- Il Mic manuale si interrompe quando l'app passa in background o l'utente lascia la scheda Voice.
- La modalità Talk continua a funzionare finché non viene disattivata o il Node Android si disconnette, e usa il tipo di servizio in foreground del microfono Android mentre è attiva.

## Note

- Richiede i permessi Speech + Microphone.
- Usa `chat.send` sulla chiave sessione `main`.
- Il gateway risolve la riproduzione Talk tramite `talk.speak` usando il provider Talk attivo. Android usa il fallback al TTS di sistema locale solo quando quell'RPC non è disponibile.
- La riproduzione MLX locale su macOS usa l'helper incluso `openclaw-mlx-tts` quando presente, oppure un eseguibile su `PATH`. Imposta `OPENCLAW_MLX_TTS_BIN` per puntare a un binario helper personalizzato durante lo sviluppo.
- `stability` per `eleven_v3` è validato a `0.0`, `0.5` o `1.0`; gli altri modelli accettano `0..1`.
- `latency_tier` è validato a `0..4` quando impostato.
- Android supporta i formati di output `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` per lo streaming AudioTrack a bassa latenza.

## Correlati

- [Voice wake](/it/nodes/voicewake)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei media](/it/nodes/media-understanding)
