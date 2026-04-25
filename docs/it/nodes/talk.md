---
read_when:
    - Implementazione della modalità conversazione su macOS/iOS/Android
    - Modifica del comportamento di voce/TTS/interruzione
summary: 'Modalità conversazione: conversazioni vocali continue con provider TTS configurati'
title: Modalità conversazione
x-i18n:
    generated_at: "2026-04-25T13:50:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

La modalità conversazione è un ciclo continuo di conversazione vocale:

1. Ascolta la voce
2. Invia la trascrizione al modello (sessione principale, `chat.send`)
3. Attende la risposta
4. La pronuncia tramite il provider Talk configurato (`talk.speak`)

## Comportamento (macOS)

- **Overlay always-on** mentre la modalità conversazione è abilitata.
- Transizioni di fase **Listening → Thinking → Speaking**.
- In caso di **breve pausa** (finestra di silenzio), la trascrizione corrente viene inviata.
- Le risposte vengono **scritte in WebChat** (come se fossero digitate).
- **Interruzione alla voce** (attiva per impostazione predefinita): se l'utente inizia a parlare mentre l'assistente sta parlando, interrompiamo la riproduzione e annotiamo il timestamp dell'interruzione per il prompt successivo.

## Direttive vocali nelle risposte

L'assistente può anteporre alla risposta una **singola riga JSON** per controllare la voce:

```json
{ "voice": "<voice-id>", "once": true }
```

Regole:

- Solo la prima riga non vuota.
- Le chiavi sconosciute vengono ignorate.
- `once: true` si applica solo alla risposta corrente.
- Senza `once`, la voce diventa il nuovo valore predefinito per la modalità conversazione.
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
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Valori predefiniti:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: se non impostato, la modalità conversazione mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms` su macOS e Android, `900 ms` su iOS)
- `provider`: seleziona il provider Talk attivo. Usa `elevenlabs`, `mlx` o `system` per i percorsi di riproduzione locale su macOS.
- `providers.<provider>.voiceId`: usa come fallback `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` per ElevenLabs (oppure la prima voce ElevenLabs quando la chiave API è disponibile).
- `providers.elevenlabs.modelId`: valore predefinito `eleven_v3` se non impostato.
- `providers.mlx.modelId`: valore predefinito `mlx-community/Soprano-80M-bf16` se non impostato.
- `providers.elevenlabs.apiKey`: usa come fallback `ELEVENLABS_API_KEY` (oppure il profilo shell del gateway se disponibile).
- `outputFormat`: valore predefinito `pcm_44100` su macOS/iOS e `pcm_24000` su Android (imposta `mp3_*` per forzare lo streaming MP3)

## UI macOS

- Toggle nella barra dei menu: **Talk**
- Scheda Config: gruppo **Talk Mode** (voice id + toggle di interruzione)
- Overlay:
  - **Listening**: la nuvola pulsa con il livello del microfono
  - **Thinking**: animazione di affondamento
  - **Speaking**: anelli che si irradiano
  - Clic sulla nuvola: interrompe la voce
  - Clic sulla X: esce dalla modalità conversazione

## Note

- Richiede i permessi Speech + Microphone.
- Usa `chat.send` contro la chiave di sessione `main`.
- Il gateway risolve la riproduzione Talk tramite `talk.speak` usando il provider Talk attivo. Android usa come fallback il TTS di sistema locale solo quando quell'RPC non è disponibile.
- La riproduzione MLX locale su macOS usa l'helper `openclaw-mlx-tts` incluso quando presente, oppure un eseguibile su `PATH`. Imposta `OPENCLAW_MLX_TTS_BIN` per puntare a un helper binario personalizzato durante lo sviluppo.
- `stability` per `eleven_v3` viene validato a `0.0`, `0.5` o `1.0`; gli altri modelli accettano `0..1`.
- `latency_tier` viene validato a `0..4` quando impostato.
- Android supporta i formati di output `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` per lo streaming AudioTrack a bassa latenza.

## Correlati

- [Voice wake](/it/nodes/voicewake)
- [Audio e note vocali](/it/nodes/audio)
- [Comprensione dei media](/it/nodes/media-understanding)
