---
read_when:
    - Sie suchen eine Übersicht über Medienfähigkeiten
    - Sie entscheiden, welchen Medien-Provider Sie konfigurieren sollen
    - Sie möchten verstehen, wie asynchrone Mediengenerierung funktioniert
summary: Einheitliche Übersichtsseite für Mediengenerierung, Media Understanding und Speech-Fähigkeiten
title: Medienübersicht
x-i18n:
    generated_at: "2026-04-07T06:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfee08eb91ec3e827724c8fa99bff7465356f6f1ac1b146562f35651798e3fd6
    source_path: tools/media-overview.md
    workflow: 15
---

# Mediengenerierung und Media Understanding

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien (Bilder, Audio, Video) und spricht Antworten mit Text-to-Speech laut aus. Alle Medienfähigkeiten sind Tool-gesteuert: Der Agent entscheidet anhand der Unterhaltung, wann er sie verwendet, und jedes Tool erscheint nur, wenn mindestens ein zugrunde liegender Provider konfiguriert ist.

## Fähigkeiten auf einen Blick

| Fähigkeit              | Tool             | Provider                                                                                     | Was es macht                                            |
| ---------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Bildgenerierung        | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra                                                 | Erstellt oder bearbeitet Bilder aus Text-Prompts oder Referenzen |
| Videogenerierung       | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Erstellt Videos aus Text, Bildern oder vorhandenen Videos |
| Musikgenerierung       | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Erstellt Musik oder Audiospuren aus Text-Prompts        |
| Text-to-Speech (TTS)   | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI                                                       | Wandelt ausgehende Antworten in gesprochene Audiodateien um |
| Media Understanding    | (automatisch)    | Jeder bild-/audiofähige Modell-Provider sowie CLI-Fallbacks                                  | Fasst eingehende Bilder, Audio und Video zusammen       |

## Matrix der Provider-Fähigkeiten

Diese Tabelle zeigt, welche Provider welche Medienfähigkeiten plattformweit unterstützen.

| Provider   | Bild | Video | Musik | TTS | STT / Transkription | Media Understanding |
| ---------- | ---- | ----- | ----- | --- | ------------------- | ------------------- |
| Alibaba    |      | Ja    |       |     |                     |                     |
| BytePlus   |      | Ja    |       |     |                     |                     |
| ComfyUI    | Ja   | Ja    | Ja    |     |                     |                     |
| Deepgram   |      |       |       |     | Ja                  |                     |
| ElevenLabs |      |       |       | Ja  |                     |                     |
| fal        | Ja   | Ja    |       |     |                     |                     |
| Google     | Ja   | Ja    | Ja    |     |                     | Ja                  |
| Microsoft  |      |       |       | Ja  |                     |                     |
| MiniMax    | Ja   | Ja    | Ja    | Ja  |                     |                     |
| OpenAI     | Ja   | Ja    |       | Ja  | Ja                  | Ja                  |
| Qwen       |      | Ja    |       |     |                     |                     |
| Runway     |      | Ja    |       |     |                     |                     |
| Together   |      | Ja    |       |     |                     |                     |
| Vydra      | Ja   | Ja    |       |     |                     |                     |
| xAI        |      | Ja    |       |     |                     |                     |

<Note>
Media Understanding verwendet jedes bildfähige oder audiofähige Modell, das in Ihrer Provider-Konfiguration registriert ist. Die obige Tabelle hebt Provider mit dedizierter Unterstützung für Media Understanding hervor; die meisten LLM-Provider mit multimodalen Modellen (Anthropic, Google, OpenAI usw.) können bei entsprechender Konfiguration als aktives Antwortmodell ebenfalls eingehende Medien verstehen.
</Note>

## So funktioniert asynchrone Generierung

Video- und Musikgenerierung laufen als Hintergrundaufgaben, da die Verarbeitung durch Provider typischerweise 30 Sekunden bis mehrere Minuten dauert. Wenn der Agent `video_generate` oder `music_generate` aufruft, übermittelt OpenClaw die Anfrage an den Provider, gibt sofort eine Task-ID zurück und verfolgt den Job im Task-Ledger. Der Agent antwortet weiter auf andere Nachrichten, während der Job läuft. Wenn der Provider fertig ist, weckt OpenClaw den Agenten, damit er die fertigen Medien zurück in den ursprünglichen Kanal posten kann. Bildgenerierung und TTS sind synchron und werden inline mit der Antwort abgeschlossen.

## Schnelllinks

- [Bildgenerierung](/de/tools/image-generation) -- Bilder generieren und bearbeiten
- [Videogenerierung](/de/tools/video-generation) -- Text-zu-Video, Bild-zu-Video und Video-zu-Video
- [Musikgenerierung](/de/tools/music-generation) -- Musik und Audiospuren erstellen
- [Text-to-Speech](/de/tools/tts) -- Antworten in gesprochene Audiodateien umwandeln
- [Media Understanding](/de/nodes/media-understanding) -- eingehende Bilder, Audio und Video verstehen
