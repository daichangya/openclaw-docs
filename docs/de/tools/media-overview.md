---
read_when:
    - Sie suchen nach einem Überblick über die Medienfunktionen.
    - Entscheiden, welchen Medien-Provider Sie konfigurieren sollten.
    - Verstehen, wie asynchrone Mediengenerierung funktioniert.
summary: Einheitliche Einstiegsseite für Mediengenerierung, -verständnis und Sprachfunktionen
title: Medienübersicht
x-i18n:
    generated_at: "2026-04-24T07:05:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469fb173ac3853011b8cd4f89f3ab97dd7d14e12e4e1d7d87e84de05d025a593
    source_path: tools/media-overview.md
    workflow: 15
---

# Mediengenerierung und -verständnis

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien (Bilder, Audio, Video) und spricht Antworten per Text-to-Speech laut aus. Alle Medienfunktionen sind toolgesteuert: Der Agent entscheidet anhand der Unterhaltung, wann er sie verwendet, und jedes Tool erscheint nur dann, wenn mindestens ein zugrunde liegender Provider konfiguriert ist.

## Funktionen auf einen Blick

| Funktion               | Tool             | Provider                                                                                     | Was es tut                                               |
| ---------------------- | ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Bildgenerierung        | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Erstellt oder bearbeitet Bilder aus Text-Prompts oder Referenzen |
| Videogenerierung       | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Erstellt Videos aus Text, Bildern oder vorhandenen Videos |
| Musikgenerierung       | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Erstellt Musik oder Audiospuren aus Text-Prompts         |
| Text-to-Speech (TTS)   | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | Wandelt ausgehende Antworten in gesprochene Audiodateien um |
| Medienverständnis      | (automatisch)    | Beliebiger vision- oder audiofähiger Modell-Provider sowie CLI-Fallbacks                     | Fasst eingehende Bilder, Audiodateien und Videos zusammen |

## Matrix der Provider-Funktionen

Diese Tabelle zeigt, welche Provider welche Medienfunktionen auf der Plattform unterstützen.

| Provider   | Bild | Video | Musik | TTS | STT / Transkription | Medienverständnis |
| ---------- | ---- | ----- | ----- | --- | ------------------- | ----------------- |
| Alibaba    |      | Ja    |       |     |                     |                   |
| BytePlus   |      | Ja    |       |     |                     |                   |
| ComfyUI    | Ja   | Ja    | Ja    |     |                     |                   |
| Deepgram   |      |       |       |     | Ja                  |                   |
| ElevenLabs |      |       |       | Ja  | Ja                  |                   |
| fal        | Ja   | Ja    |       |     |                     |                   |
| Google     | Ja   | Ja    | Ja    |     |                     | Ja                |
| Microsoft  |      |       |       | Ja  |                     |                   |
| MiniMax    | Ja   | Ja    | Ja    | Ja  |                     |                   |
| Mistral    |      |       |       |     | Ja                  |                   |
| OpenAI     | Ja   | Ja    |       | Ja  | Ja                  | Ja                |
| Qwen       |      | Ja    |       |     |                     |                   |
| Runway     |      | Ja    |       |     |                     |                   |
| Together   |      | Ja    |       |     |                     |                   |
| Vydra      | Ja   | Ja    |       |     |                     |                   |
| xAI        | Ja   | Ja    |       | Ja  | Ja                  | Ja                |

<Note>
Das Medienverständnis verwendet jeden visionfähigen oder audiofähigen Modell-Provider, der in Ihrer Provider-Konfiguration registriert ist. Die obige Tabelle hebt Provider mit dedizierter Unterstützung für Medienverständnis hervor; die meisten LLM-Provider mit multimodalen Modellen (Anthropic, Google, OpenAI usw.) können eingehende Medien ebenfalls verstehen, wenn sie als aktives Antwortmodell konfiguriert sind.
</Note>

## So funktioniert asynchrone Generierung

Die Video- und Musikgenerierung läuft als Hintergrundaufgabe, weil die Verarbeitung beim Provider typischerweise 30 Sekunden bis mehrere Minuten dauert. Wenn der Agent `video_generate` oder `music_generate` aufruft, sendet OpenClaw die Anfrage an den Provider, gibt sofort eine Aufgaben-ID zurück und verfolgt den Job im Task Ledger. Der Agent beantwortet währenddessen weiterhin andere Nachrichten. Wenn der Provider fertig ist, weckt OpenClaw den Agenten auf, damit er das fertige Medium zurück in den ursprünglichen Kanal posten kann. Bildgenerierung und TTS sind synchron und werden inline mit der Antwort abgeschlossen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI können alle eingehendes
Audio über den Batch-Pfad `tools.media.audio` transkribieren, wenn sie konfiguriert sind. Deepgram,
ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem STT-Provider für das Streaming von Voice Calls,
sodass Live-Telefonaudio an den ausgewählten Anbieter weitergeleitet werden kann,
ohne auf eine abgeschlossene Aufnahme warten zu müssen.

OpenAI wird auf die Oberflächen für Bilder, Video, Batch-TTS, Batch-STT, Voice Call-
Streaming-STT, Realtime Voice und Memory Embeddings von OpenClaw abgebildet. xAI wird derzeit
auf die Oberflächen für Bilder, Video, Suche, Code-Ausführung, Batch-TTS, Batch-STT
und Voice Call-Streaming-STT von OpenClaw abgebildet. xAI Realtime Voice ist eine Upstream-
Funktion, wird in OpenClaw aber erst registriert, wenn der gemeinsame Realtime-
Voice-Vertrag sie darstellen kann.

## Schnelllinks

- [Bildgenerierung](/de/tools/image-generation) -- Bilder generieren und bearbeiten
- [Videogenerierung](/de/tools/video-generation) -- Text-zu-Video, Bild-zu-Video und Video-zu-Video
- [Musikgenerierung](/de/tools/music-generation) -- Musik und Audiospuren erstellen
- [Text-to-Speech](/de/tools/tts) -- Antworten in gesprochene Audiodateien umwandeln
- [Medienverständnis](/de/nodes/media-understanding) -- eingehende Bilder, Audiodateien und Videos verstehen

## Verwandt

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Musikgenerierung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
