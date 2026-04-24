---
read_when:
    - Cerchi una panoramica delle funzionalità multimediali
    - Decidere quale provider multimediale configurare
    - Capire come funziona la generazione multimediale asincrona
summary: Pagina di destinazione unificata per le funzionalità di generazione multimediale, comprensione e sintesi vocale
title: Panoramica dei contenuti multimediali
x-i18n:
    generated_at: "2026-04-24T09:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39848c6104ebd4feeb37b233b70f3312fa076b535c3b3780336729eb9fdfa4e6
    source_path: tools/media-overview.md
    workflow: 15
---

# Generazione e comprensione dei contenuti multimediali

OpenClaw genera immagini, video e musica, comprende i contenuti multimediali in ingresso (immagini, audio, video) e riproduce ad alta voce le risposte con la sintesi vocale. Tutte le funzionalità multimediali sono guidate da strumenti: l'agente decide quando usarle in base alla conversazione, e ogni strumento compare solo quando è configurato almeno un provider di supporto.

## Funzionalità in sintesi

| Funzionalità         | Strumento        | Provider                                                                                     | Cosa fa                                                |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Generazione immagini | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Crea o modifica immagini da prompt testuali o riferimenti |
| Generazione video    | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crea video da testo, immagini o video esistenti       |
| Generazione musica   | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Crea musica o tracce audio da prompt testuali         |
| Sintesi vocale (TTS) | `tts`            | ElevenLabs, Google, Microsoft, MiniMax, OpenAI, xAI                                          | Converte le risposte in uscita in audio parlato       |
| Comprensione dei contenuti multimediali | (automatico)      | Qualsiasi provider di modelli con capacità visive/audio, oltre ai fallback della CLI          | Riassume immagini, audio e video in ingresso          |

## Matrice delle funzionalità dei provider

Questa tabella mostra quali provider supportano quali funzionalità multimediali sulla piattaforma.

| Provider   | Immagini | Video | Musica | TTS | STT / Trascrizione | Voce in tempo reale | Comprensione dei contenuti multimediali |
| ---------- | -------- | ----- | ------ | --- | ------------------ | ------------------- | --------------------------------------- |
| Alibaba    |          | Sì    |        |     |                    |                     |                                         |
| BytePlus   |          | Sì    |        |     |                    |                     |                                         |
| ComfyUI    | Sì       | Sì    | Sì     |     |                    |                     |                                         |
| Deepgram   |          |       |        |     | Sì                 |                     |                                         |
| ElevenLabs |          |       |        | Sì  | Sì                 |                     |                                         |
| fal        | Sì       | Sì    |        |     |                    |                     |                                         |
| Google     | Sì       | Sì    | Sì     | Sì  |                    | Sì                  | Sì                                      |
| Microsoft  |          |       |        | Sì  |                    |                     |                                         |
| MiniMax    | Sì       | Sì    | Sì     | Sì  |                    |                     |                                         |
| Mistral    |          |       |        |     | Sì                 |                     |                                         |
| OpenAI     | Sì       | Sì    |        | Sì  | Sì                 | Sì                  | Sì                                      |
| Qwen       |          | Sì    |        |     |                    |                     |                                         |
| Runway     |          | Sì    |        |     |                    |                     |                                         |
| Together   |          | Sì    |        |     |                    |                     |                                         |
| Vydra      | Sì       | Sì    |        |     |                    |                     |                                         |
| xAI        | Sì       | Sì    |        | Sì  | Sì                 |                     | Sì                                      |

<Note>
La comprensione dei contenuti multimediali usa qualsiasi modello con capacità visive o audio registrato nella configurazione del provider. La tabella sopra evidenzia i provider con supporto dedicato alla comprensione dei contenuti multimediali; la maggior parte dei provider LLM con modelli multimodali (Anthropic, Google, OpenAI, ecc.) può anche comprendere i contenuti multimediali in ingresso quando è configurata come modello di risposta attivo.
</Note>

## Come funziona la generazione asincrona

La generazione di video e musica viene eseguita come attività in background perché l'elaborazione del provider richiede in genere da 30 secondi a diversi minuti. Quando l'agente chiama `video_generate` o `music_generate`, OpenClaw invia la richiesta al provider, restituisce immediatamente un ID attività e traccia il processo nel registro delle attività. L'agente continua a rispondere ad altri messaggi mentre il processo è in esecuzione. Quando il provider termina, OpenClaw riattiva l'agente in modo che possa pubblicare il contenuto multimediale completato nel canale originale. La generazione di immagini e il TTS sono sincroni e vengono completati inline con la risposta.

Deepgram, ElevenLabs, Mistral, OpenAI e xAI possono tutti trascrivere l'audio in ingresso tramite il percorso batch `tools.media.audio` quando configurati. Deepgram, ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT in streaming per Voice Call, così l'audio telefonico in tempo reale può essere inoltrato al fornitore selezionato senza attendere il completamento di una registrazione.

Google corrisponde alle superfici di OpenClaw per immagini, video, musica, TTS batch, voce backend in tempo reale e comprensione dei contenuti multimediali. OpenAI corrisponde alle superfici di OpenClaw per immagini, video, TTS batch, STT batch, STT in streaming per Voice Call, voce backend in tempo reale e embedding della memoria. xAI attualmente corrisponde alle superfici di OpenClaw per immagini, video, ricerca, esecuzione di codice, TTS batch, STT batch e STT in streaming per Voice Call. La voce xAI Realtime è una funzionalità upstream, ma non è registrata in OpenClaw finché il contratto condiviso per la voce in tempo reale non può rappresentarla.

## Link rapidi

- [Generazione immagini](/it/tools/image-generation) -- generazione e modifica di immagini
- [Generazione video](/it/tools/video-generation) -- da testo a video, da immagine a video e da video a video
- [Generazione musica](/it/tools/music-generation) -- creazione di musica e tracce audio
- [Sintesi vocale](/it/tools/tts) -- conversione delle risposte in audio parlato
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding) -- comprensione di immagini, audio e video in ingresso

## Correlati

- [Generazione immagini](/it/tools/image-generation)
- [Generazione video](/it/tools/video-generation)
- [Generazione musica](/it/tools/music-generation)
- [Sintesi vocale](/it/tools/tts)
