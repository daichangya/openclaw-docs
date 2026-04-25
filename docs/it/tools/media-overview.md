---
read_when:
    - Cerchi una panoramica delle funzionalità multimediali
    - Decidere quale provider multimediale configurare
    - Capire come funziona la generazione multimediale asincrona
summary: Pagina di destinazione unificata per le funzionalità di generazione, comprensione e voce dei media
title: Panoramica dei media
x-i18n:
    generated_at: "2026-04-25T13:58:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# Generazione e comprensione dei media

OpenClaw genera immagini, video e musica, comprende i media in ingresso (immagini, audio, video) e legge ad alta voce le risposte con la sintesi vocale text-to-speech. Tutte le funzionalità multimediali sono guidate da strumenti: l'agente decide quando usarle in base alla conversazione, e ogni strumento appare solo quando è configurato almeno un provider di supporto.

## Funzionalità in sintesi

| Funzionalità         | Strumento        | Provider                                                                                     | Cosa fa                                                  |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Generazione immagini | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Crea o modifica immagini da prompt testuali o riferimenti |
| Generazione video    | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crea video da testo, immagini o video esistenti         |
| Generazione musica   | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Crea musica o tracce audio da prompt testuali           |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo | Converte le risposte in uscita in audio parlato         |
| Comprensione media   | (automatica)     | Qualsiasi provider di modelli con capacità visive/audio, più fallback CLI                    | Riassume immagini, audio e video in ingresso            |

## Matrice delle funzionalità dei provider

Questa tabella mostra quali provider supportano quali funzionalità multimediali nella piattaforma.

| Provider    | Immagini | Video | Musica | TTS | STT / Trascrizione | Voce realtime | Comprensione media |
| ----------- | -------- | ----- | ------ | --- | ------------------ | ------------- | ------------------ |
| Alibaba     |          | Sì    |        |     |                    |               |                    |
| BytePlus    |          | Sì    |        |     |                    |               |                    |
| ComfyUI     | Sì       | Sì    | Sì     |     |                    |               |                    |
| Deepgram    |          |       |        |     | Sì                 | Sì            |                    |
| ElevenLabs  |          |       |        | Sì  | Sì                 |               |                    |
| fal         | Sì       | Sì    |        |     |                    |               |                    |
| Google      | Sì       | Sì    | Sì     | Sì  |                    | Sì            | Sì                 |
| Gradium     |          |       |        | Sì  |                    |               |                    |
| Local CLI   |          |       |        | Sì  |                    |               |                    |
| Microsoft   |          |       |        | Sì  |                    |               |                    |
| MiniMax     | Sì       | Sì    | Sì     | Sì  |                    |               |                    |
| Mistral     |          |       |        |     | Sì                 |               |                    |
| OpenAI      | Sì       | Sì    |        | Sì  | Sì                 | Sì            | Sì                 |
| Qwen        |          | Sì    |        |     |                    |               |                    |
| Runway      |          | Sì    |        |     |                    |               |                    |
| SenseAudio  |          |       |        |     | Sì                 |               |                    |
| Together    |          | Sì    |        |     |                    |               |                    |
| Vydra       | Sì       | Sì    |        | Sì  |                    |               |                    |
| xAI         | Sì       | Sì    |        | Sì  | Sì                 | Sì            | Sì                 |
| Xiaomi MiMo | Sì       |       |        | Sì  |                    |               | Sì                 |

<Note>
La comprensione dei media usa qualsiasi modello con capacità visive o audio registrato nella configurazione del provider. La tabella sopra evidenzia i provider con supporto dedicato alla comprensione dei media; la maggior parte dei provider LLM con modelli multimodali (Anthropic, Google, OpenAI, ecc.) può anche comprendere i media in ingresso quando è configurata come modello di risposta attivo.
</Note>

## Come funziona la generazione asincrona

La generazione di video e musica viene eseguita come attività in background perché l'elaborazione del provider richiede in genere da 30 secondi a diversi minuti. Quando l'agente chiama `video_generate` o `music_generate`, OpenClaw invia la richiesta al provider, restituisce subito un ID attività e traccia il job nel registro delle attività. L'agente continua a rispondere ad altri messaggi mentre il job è in esecuzione. Quando il provider termina, OpenClaw riattiva l'agente così può pubblicare il media completato nel canale originale. La generazione di immagini e il TTS sono sincroni e si completano inline con la risposta.

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio e xAI possono tutti trascrivere
audio in ingresso tramite il percorso batch `tools.media.audio` quando configurati.
Deepgram, ElevenLabs, Mistral, OpenAI e xAI registrano anche provider STT
streaming per Voice Call, così l'audio telefonico live può essere inoltrato al
vendor selezionato senza attendere il completamento della registrazione.

Google si mappa alle superfici OpenClaw per immagini, video, musica, TTS batch, voce
realtime backend e comprensione dei media. OpenAI si mappa alle superfici OpenClaw per immagini,
video, TTS batch, STT batch, STT streaming per Voice Call, voce realtime backend
e embedding della memoria. xAI attualmente si mappa alle superfici OpenClaw per immagini, video,
ricerca, esecuzione di codice, TTS batch, STT batch e STT streaming per Voice Call.
La voce xAI Realtime è attualmente una capacità upstream, ma non è
registrata in OpenClaw finché il contratto condiviso per la voce realtime non può rappresentarla.

## Link rapidi

- [Generazione immagini](/it/tools/image-generation) -- generazione e modifica di immagini
- [Generazione video](/it/tools/video-generation) -- text-to-video, image-to-video e video-to-video
- [Generazione musica](/it/tools/music-generation) -- creazione di musica e tracce audio
- [Text-to-Speech](/it/tools/tts) -- conversione delle risposte in audio parlato
- [Comprensione media](/it/nodes/media-understanding) -- comprensione di immagini, audio e video in ingresso

## Correlati

- [Generazione immagini](/it/tools/image-generation)
- [Generazione video](/it/tools/video-generation)
- [Generazione musica](/it/tools/music-generation)
- [Text-to-speech](/it/tools/tts)
