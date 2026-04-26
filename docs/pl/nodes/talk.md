---
read_when:
    - Implementacja trybu Talk na macOS/iOS/Android
    - Zmiana zachowania głosu/TTS/przerywania
summary: 'Tryb Talk: ciągłe rozmowy głosowe ze skonfigurowanymi dostawcami TTS'
title: Tryb Talk
x-i18n:
    generated_at: "2026-04-26T11:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

Tryb Talk to ciągła pętla rozmowy głosowej:

1. Nasłuchuj mowy
2. Wyślij transkrypcję do modelu (główna sesja, `chat.send`)
3. Poczekaj na odpowiedź
4. Odczytaj ją za pomocą skonfigurowanego dostawcy Talk (`talk.speak`)

## Zachowanie (macOS)

- **Zawsze aktywna nakładka** gdy tryb Talk jest włączony.
- Przejścia faz **Nasłuchiwanie → Myślenie → Mówienie**.
- Przy **krótkiej pauzie** (okno ciszy) bieżąca transkrypcja jest wysyłana.
- Odpowiedzi są **zapisywane w WebChat** (tak samo jak przy wpisywaniu).
- **Przerywanie po wykryciu mowy** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent mówi, zatrzymujemy odtwarzanie i zapisujemy znacznik czasu przerwania do następnego promptu.

## Dyrektywy głosowe w odpowiedziach

Asystent może poprzedzić swoją odpowiedź **pojedynczą linią JSON**, aby sterować głosem:

```json
{ "voice": "<voice-id>", "once": true }
```

Zasady:

- Tylko pierwsza niepusta linia.
- Nieznane klucze są ignorowane.
- `once: true` ma zastosowanie tylko do bieżącej odpowiedzi.
- Bez `once` głos staje się nowym domyślnym głosem dla trybu Talk.
- Linia JSON jest usuwana przed odtwarzaniem TTS.

Obsługiwane klucze:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Konfiguracja (`~/.openclaw/openclaw.json`)

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

Ustawienia domyślne:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: jeśli nie jest ustawione, Talk zachowuje domyślne dla platformy okno pauzy przed wysłaniem transkrypcji (`700 ms na macOS i Androidzie, 900 ms na iOS`)
- `provider`: wybiera aktywnego dostawcę Talk. Użyj `elevenlabs`, `mlx` lub `system` dla lokalnych ścieżek odtwarzania na macOS.
- `providers.<provider>.voiceId`: używa wartości z `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` dla ElevenLabs (lub pierwszego głosu ElevenLabs, gdy dostępny jest klucz API).
- `providers.elevenlabs.modelId`: domyślnie `eleven_v3`, jeśli nie jest ustawione.
- `providers.mlx.modelId`: domyślnie `mlx-community/Soprano-80M-bf16`, jeśli nie jest ustawione.
- `providers.elevenlabs.apiKey`: używa wartości z `ELEVENLABS_API_KEY` (lub profilu powłoki Gateway, jeśli jest dostępny).
- `speechLocale`: opcjonalny identyfikator ustawień regionalnych BCP 47 dla rozpoznawania mowy Talk na urządzeniu na iOS/macOS. Pozostaw nieustawione, aby użyć domyślnych ustawień urządzenia.
- `outputFormat`: domyślnie `pcm_44100` na macOS/iOS oraz `pcm_24000` na Androidzie (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## Interfejs macOS

- Przełącznik na pasku menu: **Talk**
- Karta konfiguracji: grupa **Tryb Talk** (identyfikator głosu + przełącznik przerywania)
- Nakładka:
  - **Nasłuchiwanie**: chmura pulsuje zgodnie z poziomem mikrofonu
  - **Myślenie**: animacja opadania
  - **Mówienie**: rozchodzące się pierścienie
  - Kliknięcie chmury: zatrzymanie mówienia
  - Kliknięcie X: wyjście z trybu Talk

## Interfejs Androida

- Przełącznik na karcie głosu: **Talk**
- Ręczne tryby **Mic** i **Talk** są wzajemnie wykluczającymi się trybami przechwytywania w czasie działania.
- Ręczny tryb Mic zatrzymuje się, gdy aplikacja przestaje być na pierwszym planie lub użytkownik opuszcza kartę głosu.
- Tryb Talk działa do momentu jego wyłączenia albo rozłączenia Node Androida i podczas aktywności używa typu usługi pierwszoplanowej mikrofonu Androida.

## Uwagi

- Wymaga uprawnień do mowy i mikrofonu.
- Używa `chat.send` względem klucza sesji `main`.
- Gateway rozwiązuje odtwarzanie Talk przez `talk.speak` przy użyciu aktywnego dostawcy Talk. Android przechodzi na lokalny systemowy TTS tylko wtedy, gdy to RPC jest niedostępne.
- Lokalne odtwarzanie MLX na macOS używa dołączonego pomocnika `openclaw-mlx-tts`, jeśli jest dostępny, lub pliku wykonywalnego z `PATH`. Ustaw `OPENCLAW_MLX_TTS_BIN`, aby wskazać własny binarny plik pomocniczy podczas developmentu.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` lub `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, jeśli jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla strumieniowania AudioTrack o niskich opóźnieniach.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
