---
read_when:
    - Szukasz przeglądu możliwości mediów
    - Wybór dostawcy mediów do skonfigurowania
    - Zrozumienie działania asynchronicznego generowania mediów
summary: Ujednolicona strona główna dla generowania mediów, rozumienia mediów i funkcji mowy
title: Przegląd mediów
x-i18n:
    generated_at: "2026-04-25T13:59:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# Generowanie i rozumienie mediów

OpenClaw generuje obrazy, filmy i muzykę, rozumie media przychodzące (obrazy, audio, wideo) oraz odczytuje odpowiedzi na głos za pomocą text-to-speech. Wszystkie możliwości związane z mediami są sterowane przez narzędzia: agent decyduje, kiedy z nich skorzystać na podstawie rozmowy, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowano co najmniej jednego dostawcę zaplecza.

## Możliwości w skrócie

| Możliwość             | Narzędzie        | Dostawcy                                                                                     | Co robi                                                 |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Generowanie obrazów   | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Tworzy lub edytuje obrazy na podstawie promptów tekstowych lub odwołań |
| Generowanie wideo     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Tworzy filmy na podstawie tekstu, obrazów lub istniejących filmów |
| Generowanie muzyki    | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Tworzy muzykę lub ścieżki audio na podstawie promptów tekstowych |
| Text-to-speech (TTS)  | `tts`            | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo  | Zamienia odpowiedzi wychodzące na mowę                  |
| Rozumienie mediów     | (automatyczne)   | Dowolny dostawca modeli obsługujących vision/audio oraz zapasowe rozwiązania CLI             | Podsumowuje przychodzące obrazy, audio i wideo          |

## Macierz możliwości dostawców

Ta tabela pokazuje, którzy dostawcy obsługują poszczególne możliwości medialne na całej platformie.

| Dostawca    | Obrazy | Wideo | Muzyka | TTS | STT / Transkrypcja | Głos w czasie rzeczywistym | Rozumienie mediów |
| ----------- | ------ | ----- | ------ | --- | ------------------ | -------------------------- | ----------------- |
| Alibaba     |        | Tak   |        |     |                    |                            |                   |
| BytePlus    |        | Tak   |        |     |                    |                            |                   |
| ComfyUI     | Tak    | Tak   | Tak    |     |                    |                            |                   |
| Deepgram    |        |       |        |     | Tak                | Tak                        |                   |
| ElevenLabs  |        |       |        | Tak | Tak                |                            |                   |
| fal         | Tak    | Tak   |        |     |                    |                            |                   |
| Google      | Tak    | Tak   | Tak    | Tak |                    | Tak                        | Tak               |
| Gradium     |        |       |        | Tak |                    |                            |                   |
| Local CLI   |        |       |        | Tak |                    |                            |                   |
| Microsoft   |        |       |        | Tak |                    |                            |                   |
| MiniMax     | Tak    | Tak   | Tak    | Tak |                    |                            |                   |
| Mistral     |        |       |        |     | Tak                |                            |                   |
| OpenAI      | Tak    | Tak   |        | Tak | Tak                | Tak                        | Tak               |
| Qwen        |        | Tak   |        |     |                    |                            |                   |
| Runway      |        | Tak   |        |     |                    |                            |                   |
| SenseAudio  |        |       |        |     | Tak                |                            |                   |
| Together    |        | Tak   |        |     |                    |                            |                   |
| Vydra       | Tak    | Tak   |        | Tak |                    |                            |                   |
| xAI         | Tak    | Tak   |        | Tak | Tak                | Tak                        | Tak               |
| Xiaomi MiMo | Tak    |       |        | Tak |                    |                            | Tak               |

<Note>
Rozumienie mediów korzysta z dowolnego modelu obsługującego vision lub audio zarejestrowanego w konfiguracji dostawców. Powyższa tabela wyróżnia dostawców z dedykowaną obsługą rozumienia mediów; większość dostawców LLM z modelami multimodalnymi (Anthropic, Google, OpenAI itd.) również może rozumieć media przychodzące, gdy są skonfigurowane jako aktywny model odpowiedzi.
</Note>

## Jak działa generowanie asynchroniczne

Generowanie wideo i muzyki działa jako zadania w tle, ponieważ przetwarzanie po stronie dostawców zwykle trwa od 30 sekund do kilku minut. Gdy agent wywołuje `video_generate` lub `music_generate`, OpenClaw wysyła żądanie do dostawcy, natychmiast zwraca identyfikator zadania i śledzi zadanie w rejestrze zadań. Agent może dalej odpowiadać na inne wiadomości, podczas gdy zadanie jest wykonywane. Gdy dostawca zakończy przetwarzanie, OpenClaw wybudza agenta, aby mógł opublikować gotowe media z powrotem w oryginalnym kanale. Generowanie obrazów i TTS są synchroniczne i kończą się inline wraz z odpowiedzią.

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio i xAI mogą transkrybować
przychodzące audio przez wsadową ścieżkę `tools.media.audio`, jeśli są skonfigurowane.
Deepgram, ElevenLabs, Mistral, OpenAI i xAI rejestrują również dostawców
strumieniowego STT dla Voice Call, dzięki czemu dźwięk z połączeń telefonicznych na żywo może być przekazywany do wybranego
dostawcy bez oczekiwania na zakończenie nagrania.

Google mapuje się na powierzchnie OpenClaw dla obrazów, wideo, muzyki, wsadowego TTS, backendowego głosu w czasie rzeczywistym
oraz rozumienia mediów. OpenAI mapuje się na powierzchnie OpenClaw dla obrazów,
wideo, wsadowego TTS, wsadowego STT, strumieniowego STT dla Voice Call, backendowego głosu w czasie rzeczywistym
oraz osadzeń pamięci. xAI obecnie mapuje się na powierzchnie OpenClaw dla obrazów, wideo,
wyszukiwania, wykonywania kodu, wsadowego TTS, wsadowego STT oraz strumieniowego STT dla Voice Call.
Głos xAI Realtime jest możliwością po stronie upstream, ale nie jest
rejestrowany w OpenClaw, dopóki wspólny kontrakt głosu w czasie rzeczywistym nie będzie mógł go
reprezentować.

## Szybkie linki

- [Generowanie obrazów](/pl/tools/image-generation) -- generowanie i edycja obrazów
- [Generowanie wideo](/pl/tools/video-generation) -- text-to-video, image-to-video i video-to-video
- [Generowanie muzyki](/pl/tools/music-generation) -- tworzenie muzyki i ścieżek audio
- [Text-to-Speech](/pl/tools/tts) -- zamienianie odpowiedzi na mowę
- [Rozumienie mediów](/pl/nodes/media-understanding) -- rozumienie przychodzących obrazów, audio i wideo

## Powiązane

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Text-to-speech](/pl/tools/tts)
