---
read_when:
    - Szukasz przeglądu możliwości związanych z mediami
    - Decydowanie, którego providera mediów skonfigurować
    - Zrozumienie, jak działa asynchroniczne generowanie mediów
summary: Ujednolicona strona startowa dla generowania mediów, rozumienia mediów i możliwości mowy
title: Przegląd mediów
x-i18n:
    generated_at: "2026-04-23T10:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# Generowanie i rozumienie mediów

OpenClaw generuje obrazy, wideo i muzykę, rozumie media przychodzące (obrazy, audio, wideo) oraz odczytuje odpowiedzi na głos za pomocą text-to-speech. Wszystkie możliwości medialne są sterowane narzędziami: agent decyduje, kiedy ich użyć na podstawie rozmowy, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowano co najmniej jednego providera zaplecza.

## Możliwości w skrócie

| Możliwość            | Narzędzie         | Providerzy                                                                                 | Co robi                                                  |
| -------------------- | ----------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Generowanie obrazów  | `image_generate`  | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                          | Tworzy lub edytuje obrazy z promptów tekstowych albo referencji |
| Generowanie wideo    | `video_generate`  | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Tworzy wideo z tekstu, obrazów albo istniejących filmów  |
| Generowanie muzyki   | `music_generate`  | ComfyUI, Google, MiniMax                                                                   | Tworzy muzykę lub ścieżki audio z promptów tekstowych    |
| Text-to-speech (TTS) | `tts`             | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                | Zamienia odpowiedzi wychodzące na mowę                   |
| Rozumienie mediów    | (automatyczne)    | Dowolny provider modeli obsługujący vision/audio oraz fallbacki CLI                        | Podsumowuje przychodzące obrazy, audio i wideo           |

## Macierz możliwości providerów

Ta tabela pokazuje, którzy providerzy obsługują które możliwości medialne na całej platformie.

| Provider   | Obraz | Wideo | Muzyka | TTS | STT / Transkrypcja | Rozumienie mediów |
| ---------- | ----- | ----- | ------ | --- | ------------------ | ----------------- |
| Alibaba    |       | Tak   |        |     |                    |                   |
| BytePlus   |       | Tak   |        |     |                    |                   |
| ComfyUI    | Tak   | Tak   | Tak    |     |                    |                   |
| Deepgram   |       |       |        |     | Tak                |                   |
| ElevenLabs |       |       |        | Tak | Tak                |                   |
| fal        | Tak   | Tak   |        |     |                    |                   |
| Google     | Tak   | Tak   | Tak    |     |                    | Tak               |
| Microsoft  |       |       |        | Tak |                    |                   |
| MiniMax    | Tak   | Tak   | Tak    | Tak |                    |                   |
| Mistral    |       |       |        |     | Tak                |                   |
| OpenAI     | Tak   | Tak   |        | Tak | Tak                | Tak               |
| Qwen       |       | Tak   |        |     |                    |                   |
| Runway     |       | Tak   |        |     |                    |                   |
| Together   |       | Tak   |        |     |                    |                   |
| Vydra      | Tak   | Tak   |        |     |                    |                   |
| xAI        | Tak   | Tak   |        | Tak | Tak                | Tak               |

<Note>
Rozumienie mediów używa dowolnego modelu obsługującego vision lub audio zarejestrowanego w konfiguracji providera. Powyższa tabela wyróżnia providerów z dedykowaną obsługą rozumienia mediów; większość providerów LLM z modelami multimodalnymi (Anthropic, Google, OpenAI itd.) także potrafi rozumieć media przychodzące, gdy są skonfigurowane jako aktywny model odpowiedzi.
</Note>

## Jak działa asynchroniczne generowanie

Generowanie wideo i muzyki działa jako zadania w tle, ponieważ przetwarzanie po stronie providera zwykle trwa od 30 sekund do kilku minut. Gdy agent wywołuje `video_generate` lub `music_generate`, OpenClaw wysyła żądanie do providera, natychmiast zwraca identyfikator zadania i śledzi zadanie w rejestrze zadań. Agent kontynuuje odpowiadanie na inne wiadomości, gdy zadanie trwa. Gdy provider zakończy pracę, OpenClaw wybudza agenta, aby mógł opublikować gotowe media z powrotem w oryginalnym kanale. Generowanie obrazów i TTS są synchroniczne i kończą się inline razem z odpowiedzią.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI mogą transkrybować przychodzące
audio przez wsadową ścieżkę `tools.media.audio`, gdy są skonfigurowane. Deepgram,
ElevenLabs, Mistral, OpenAI i xAI rejestrują też providerów streaming STT dla Voice Call, dzięki czemu dźwięk z rozmów telefonicznych na żywo może być przekazywany do wybranego dostawcy
bez czekania na ukończenie nagrania.

OpenAI mapuje się na powierzchnie OpenClaw dla obrazów, wideo, wsadowego TTS, wsadowego STT, streaming STT dla Voice Call, realtime voice i embeddingów pamięci. xAI obecnie
mapuje się na powierzchnie OpenClaw dla obrazów, wideo, wyszukiwania, wykonywania kodu, wsadowego TTS, wsadowego STT
i streaming STT dla Voice Call. xAI Realtime voice jest możliwością po stronie upstream,
ale nie jest rejestrowane w OpenClaw, dopóki współdzielony kontrakt realtime
voice nie będzie mógł go reprezentować.

## Szybkie linki

- [Generowanie obrazów](/pl/tools/image-generation) -- generowanie i edycja obrazów
- [Generowanie wideo](/pl/tools/video-generation) -- text-to-video, image-to-video i video-to-video
- [Generowanie muzyki](/pl/tools/music-generation) -- tworzenie muzyki i ścieżek audio
- [Text-to-Speech](/pl/tools/tts) -- zamiana odpowiedzi na mowę
- [Rozumienie mediów](/pl/nodes/media-understanding) -- rozumienie przychodzących obrazów, audio i wideo
