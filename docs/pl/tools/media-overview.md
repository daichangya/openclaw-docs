---
read_when:
    - Szukasz przeglądu możliwości multimedialnych?
    - Wybierasz dostawcę multimediów do skonfigurowania
    - Zrozumienie działania asynchronicznego generowania multimediów
summary: Ujednolicona strona docelowa dla możliwości generowania multimediów, rozumienia ich i obsługi mowy
title: Przegląd multimediów
x-i18n:
    generated_at: "2026-04-24T09:53:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39848c6104ebd4feeb37b233b70f3312fa076b535c3b3780336729eb9fdfa4e6
    source_path: tools/media-overview.md
    workflow: 15
---

# Generowanie i rozumienie multimediów

OpenClaw generuje obrazy, filmy i muzykę, rozumie przychodzące multimedia (obrazy, dźwięk, wideo) oraz odtwarza odpowiedzi na głos za pomocą syntezy mowy. Wszystkie możliwości multimedialne są sterowane narzędziami: agent decyduje, kiedy ich użyć, na podstawie rozmowy, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowano co najmniej jednego obsługującego je dostawcę.

## Możliwości w skrócie

| Możliwość             | Narzędzie        | Dostawcy                                                                                     | Co robi                                                  |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Generowanie obrazów   | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Tworzy lub edytuje obrazy na podstawie promptów tekstowych lub materiałów referencyjnych |
| Generowanie wideo     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Tworzy filmy na podstawie tekstu, obrazów lub istniejących filmów |
| Generowanie muzyki    | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Tworzy muzykę lub ścieżki audio na podstawie promptów tekstowych |
| Synteza mowy (TTS)    | `tts`            | ElevenLabs, Google, Microsoft, MiniMax, OpenAI, xAI                                          | Zamienia wychodzące odpowiedzi na mowę                    |
| Rozumienie multimediów | (automatycznie) | Dowolny dostawca modelu obsługujący wizję lub dźwięk, plus rozwiązania zapasowe CLI          | Podsumowuje przychodzące obrazy, dźwięk i wideo          |

## Macierz możliwości dostawców

Ta tabela pokazuje, którzy dostawcy obsługują poszczególne możliwości multimedialne na całej platformie.

| Dostawca   | Obrazy | Wideo | Muzyka | TTS | STT / Transkrypcja | Głos w czasie rzeczywistym | Rozumienie multimediów |
| ---------- | ------ | ----- | ------ | --- | ------------------ | -------------------------- | ---------------------- |
| Alibaba    |        | Tak   |        |     |                    |                            |                        |
| BytePlus   |        | Tak   |        |     |                    |                            |                        |
| ComfyUI    | Tak    | Tak   | Tak    |     |                    |                            |                        |
| Deepgram   |        |       |        |     | Tak                |                            |                        |
| ElevenLabs |        |       |        | Tak | Tak                |                            |                        |
| fal        | Tak    | Tak   |        |     |                    |                            |                        |
| Google     | Tak    | Tak   | Tak    | Tak |                    | Tak                        | Tak                    |
| Microsoft  |        |       |        | Tak |                    |                            |                        |
| MiniMax    | Tak    | Tak   | Tak    | Tak |                    |                            |                        |
| Mistral    |        |       |        |     | Tak                |                            |                        |
| OpenAI     | Tak    | Tak   |        | Tak | Tak                | Tak                        | Tak                    |
| Qwen       |        | Tak   |        |     |                    |                            |                        |
| Runway     |        | Tak   |        |     |                    |                            |                        |
| Together   |        | Tak   |        |     |                    |                            |                        |
| Vydra      | Tak    | Tak   |        |     |                    |                            |                        |
| xAI        | Tak    | Tak   |        | Tak | Tak                |                            | Tak                    |

<Note>
Rozumienie multimediów wykorzystuje dowolny model obsługujący wizję lub dźwięk zarejestrowany w konfiguracji dostawcy. Powyższa tabela wyróżnia dostawców z dedykowaną obsługą rozumienia multimediów; większość dostawców LLM z modelami multimodalnymi (Anthropic, Google, OpenAI itd.) może także rozumieć przychodzące multimedia, gdy są skonfigurowani jako aktywny model odpowiedzi.
</Note>

## Jak działa generowanie asynchroniczne

Generowanie wideo i muzyki działa jako zadania w tle, ponieważ przetwarzanie po stronie dostawcy zwykle trwa od 30 sekund do kilku minut. Gdy agent wywołuje `video_generate` lub `music_generate`, OpenClaw przesyła żądanie do dostawcy, natychmiast zwraca identyfikator zadania i śledzi zadanie w rejestrze zadań. Agent nadal odpowiada na inne wiadomości, podczas gdy zadanie jest wykonywane. Gdy dostawca zakończy przetwarzanie, OpenClaw wybudza agenta, aby mógł opublikować gotowe multimedia z powrotem w oryginalnym kanale. Generowanie obrazów i TTS są synchroniczne i kończą się bezpośrednio w ramach odpowiedzi.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI mogą transkrybować przychodzący
dźwięk przez ścieżkę wsadową `tools.media.audio`, jeśli są skonfigurowane. Deepgram,
ElevenLabs, Mistral, OpenAI i xAI rejestrują także dostawców STT strumieniowego dla Połączeń Głosowych,
dzięki czemu dźwięk z rozmów telefonicznych na żywo może być przekazywany do wybranego dostawcy
bez czekania na ukończenie nagrania.

Google mapuje się na powierzchnie obrazu, wideo, muzyki, wsadowego TTS, backendowego głosu w czasie rzeczywistym
i rozumienia multimediów w OpenClaw. OpenAI mapuje się na powierzchnie obrazu,
wideo, wsadowego TTS, wsadowego STT, strumieniowego STT dla Połączeń Głosowych, backendowego głosu w czasie rzeczywistym
oraz osadzania pamięci w OpenClaw. xAI obecnie mapuje się na powierzchnie obrazu, wideo,
wyszukiwania, wykonywania kodu, wsadowego TTS, wsadowego STT oraz strumieniowego STT dla Połączeń Głosowych
w OpenClaw. Głos xAI Realtime jest funkcją dostępną upstreamowo, ale nie jest
rejestrowany w OpenClaw, dopóki współdzielony kontrakt głosu w czasie rzeczywistym nie będzie mógł go
reprezentować.

## Szybkie linki

- [Generowanie obrazów](/pl/tools/image-generation) -- generowanie i edytowanie obrazów
- [Generowanie wideo](/pl/tools/video-generation) -- tekst na wideo, obraz na wideo i wideo na wideo
- [Generowanie muzyki](/pl/tools/music-generation) -- tworzenie muzyki i ścieżek audio
- [Synteza mowy](/pl/tools/tts) -- zamienianie odpowiedzi na dźwięk mowy
- [Rozumienie multimediów](/pl/nodes/media-understanding) -- rozumienie przychodzących obrazów, dźwięku i wideo

## Powiązane

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Synteza mowy](/pl/tools/tts)
