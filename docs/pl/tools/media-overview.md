---
read_when:
    - Szukasz przeglądu możliwości mediów w OpenClaw
    - Wybieranie dostawcy mediów do skonfigurowania
    - Zrozumienie, jak działa asynchroniczne generowanie mediów
sidebarTitle: Media overview
summary: Możliwości obrazów, wideo, muzyki, mowy i rozumienia mediów w skrócie
title: Przegląd mediów
x-i18n:
    generated_at: "2026-04-26T11:42:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw generuje obrazy, wideo i muzykę, rozumie przychodzące media
(obrazy, audio, wideo) i odczytuje odpowiedzi na głos za pomocą syntezy mowy. Wszystkie
możliwości mediów są sterowane narzędziami: agent decyduje, kiedy ich użyć na podstawie
rozmowy, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowany jest co najmniej jeden
wspierający dostawca.

## Możliwości

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Twórz i edytuj obrazy z promptów tekstowych lub obrazów referencyjnych przez
    `image_generate`. Synchroniczne — kończy się w tej samej odpowiedzi.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Tekst na wideo, obraz na wideo i wideo na wideo przez `video_generate`.
    Asynchroniczne — działa w tle i publikuje wynik, gdy będzie gotowy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Generuj muzykę lub ścieżki audio przez `music_generate`. Asynchroniczne u współdzielonych
    dostawców; ścieżka workflow ComfyUI działa synchronicznie.
  </Card>
  <Card title="Synteza mowy" href="/pl/tools/tts" icon="microphone">
    Zamieniaj odpowiedzi wychodzące na dźwięk mówiony przez narzędzie `tts` oraz
    konfigurację `messages.tts`. Synchroniczne.
  </Card>
  <Card title="Rozumienie mediów" href="/pl/nodes/media-understanding" icon="eye">
    Podsumowuj przychodzące obrazy, audio i wideo przy użyciu dostawców modeli
    obsługujących vision i dedykowanych Pluginów rozumienia mediów.
  </Card>
  <Card title="Zamiana mowy na tekst" href="/pl/nodes/audio" icon="ear-listen">
    Transkrybuj przychodzące wiadomości głosowe przez wsadowe STT lub dostawców
    strumieniowego STT dla Voice Call.
  </Card>
</CardGroup>

## Macierz możliwości dostawców

| Dostawca    | Obraz | Wideo | Muzyka | TTS | STT | Głos realtime | Rozumienie mediów |
| ----------- | :---: | :---: | :----: | :-: | :-: | :-----------: | :---------------: |
| Alibaba     |       |   ✓   |        |     |     |               |                   |
| BytePlus    |       |   ✓   |        |     |     |               |                   |
| ComfyUI     |   ✓   |   ✓   |   ✓    |     |     |               |                   |
| Deepgram    |       |       |        |     |  ✓  |       ✓       |                   |
| ElevenLabs  |       |       |        |  ✓  |  ✓  |               |                   |
| fal         |   ✓   |   ✓   |        |     |     |               |                   |
| Google      |   ✓   |   ✓   |   ✓    |  ✓  |     |       ✓       |         ✓         |
| Gradium     |       |       |        |  ✓  |     |               |                   |
| Local CLI   |       |       |        |  ✓  |     |               |                   |
| Microsoft   |       |       |        |  ✓  |     |               |                   |
| MiniMax     |   ✓   |   ✓   |   ✓    |  ✓  |     |               |                   |
| Mistral     |       |       |        |     |  ✓  |               |                   |
| OpenAI      |   ✓   |   ✓   |        |  ✓  |  ✓  |       ✓       |         ✓         |
| Qwen        |       |   ✓   |        |     |     |               |                   |
| Runway      |       |   ✓   |        |     |     |               |                   |
| SenseAudio  |       |       |        |     |  ✓  |               |                   |
| Together    |       |   ✓   |        |     |     |               |                   |
| Vydra       |   ✓   |   ✓   |        |  ✓  |     |               |                   |
| xAI         |   ✓   |   ✓   |        |  ✓  |  ✓  |               |         ✓         |
| Xiaomi MiMo |   ✓   |       |        |  ✓  |     |               |         ✓         |

<Note>
Rozumienie mediów używa każdego modelu obsługującego vision lub audio zarejestrowanego
w konfiguracji dostawcy. Powyższa macierz wymienia dostawców z dedykowaną
obsługą rozumienia mediów; większość multimodalnych dostawców LLM (Anthropic, Google,
OpenAI itd.) potrafi również rozumieć przychodzące media, gdy są skonfigurowani jako aktywny
model odpowiedzi.
</Note>

## Asynchroniczne vs synchroniczne

| Możliwość       | Tryb            | Dlaczego                                                          |
| --------------- | --------------- | ----------------------------------------------------------------- |
| Obraz           | Synchroniczny   | Odpowiedzi dostawców wracają w kilka sekund; kończy się w odpowiedzi. |
| Synteza mowy    | Synchroniczny   | Odpowiedzi dostawców wracają w kilka sekund; są dołączane do audio odpowiedzi. |
| Wideo           | Asynchroniczny  | Przetwarzanie po stronie dostawcy trwa od 30 s do kilku minut.    |
| Muzyka (współdzielona) | Asynchroniczny | Ma tę samą charakterystykę przetwarzania po stronie dostawcy co wideo. |
| Muzyka (ComfyUI) | Synchroniczny  | Lokalny workflow działa inline względem skonfigurowanego serwera ComfyUI. |

Dla narzędzi asynchronicznych OpenClaw wysyła żądanie do dostawcy, natychmiast zwraca
identyfikator zadania i śledzi zadanie w rejestrze zadań. Agent nadal odpowiada
na inne wiadomości, gdy zadanie jest wykonywane. Gdy dostawca zakończy pracę,
OpenClaw wybudza agenta, aby mógł opublikować gotowe media z powrotem w
oryginalnym kanale.

## Zamiana mowy na tekst i Voice Call

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio i xAI mogą transkrybować
przychodzące audio przez wsadową ścieżkę `tools.media.audio`, jeśli są skonfigurowane.
Pluginy kanałów, które wykonują wstępne sprawdzenie notatki głosowej pod kątem bramek wzmianek lub
parsowania poleceń, oznaczają przetranskrybowany załącznik w kontekście wejściowym, dzięki czemu współdzielony
przebieg rozumienia mediów ponownie używa tej transkrypcji zamiast wykonywać drugie
wywołanie STT dla tego samego audio.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI rejestrują też dostawców
strumieniowego STT dla Voice Call, więc dźwięk z połączenia na żywo może być przekazywany do wybranego
dostawcy bez czekania na ukończenie nagrania.

## Mapowania dostawców (jak dostawcy są podzieleni między powierzchnie)

<AccordionGroup>
  <Accordion title="Google">
    Powierzchnie obrazów, wideo, muzyki, wsadowego TTS, backendowego głosu realtime oraz
    rozumienia mediów.
  </Accordion>
  <Accordion title="OpenAI">
    Powierzchnie obrazów, wideo, wsadowego TTS, wsadowego STT, strumieniowego STT dla Voice Call,
    backendowego głosu realtime i embeddingów pamięci.
  </Accordion>
  <Accordion title="xAI">
    Obrazy, wideo, wyszukiwanie, wykonywanie kodu, wsadowy TTS, wsadowy STT i
    strumieniowy STT dla Voice Call. Głos realtime xAI jest funkcją upstream, ale
    nie jest rejestrowany w OpenClaw, dopóki współdzielony kontrakt głosu realtime nie
    będzie mógł go reprezentować.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Synteza mowy](/pl/tools/tts)
- [Rozumienie mediów](/pl/nodes/media-understanding)
- [Węzły audio](/pl/nodes/audio)
