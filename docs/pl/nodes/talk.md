---
read_when:
    - Implementowanie trybu Talk na macOS/iOS/Android
    - Zmiana zachowania voice/TTS/interrupt
summary: 'Tryb Talk: ciągłe rozmowy głosowe ze skonfigurowanymi dostawcami TTS'
title: Tryb Talk
x-i18n:
    generated_at: "2026-04-25T13:51:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

Tryb Talk to ciągła pętla rozmowy głosowej:

1. Nasłuchuj mowy
2. Wyślij transkrypcję do modelu (główna sesja, `chat.send`)
3. Poczekaj na odpowiedź
4. Wypowiedz ją przez skonfigurowanego dostawcę Talk (`talk.speak`)

## Zachowanie (macOS)

- **Zawsze aktywna nakładka**, gdy tryb Talk jest włączony.
- Przejścia faz **Listening → Thinking → Speaking**.
- Po **krótkiej przerwie** (oknie ciszy) bieżąca transkrypcja jest wysyłana.
- Odpowiedzi są **zapisywane do WebChat** (tak samo jak przy pisaniu).
- **Przerywanie przy mowie** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent mówi, zatrzymujemy odtwarzanie i zapisujemy znacznik czasu przerwania do następnego promptu.

## Dyrektywy głosowe w odpowiedziach

Asystent może poprzedzić swoją odpowiedź **pojedynczą linią JSON**, aby sterować głosem:

```json
{ "voice": "<voice-id>", "once": true }
```

Zasady:

- Tylko pierwszy niepusty wiersz.
- Nieznane klucze są ignorowane.
- `once: true` dotyczy tylko bieżącej odpowiedzi.
- Bez `once` głos staje się nowym domyślnym głosem trybu Talk.
- Linia JSON jest usuwana przed odtwarzaniem TTS.

Obsługiwane klucze:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

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

Wartości domyślne:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: gdy nie jest ustawione, Talk zachowuje domyślne dla platformy okno pauzy przed wysłaniem transkrypcji (`700 ms` na macOS i Android, `900 ms` na iOS)
- `provider`: wybiera aktywnego dostawcę Talk. Użyj `elevenlabs`, `mlx` albo `system` dla lokalnych ścieżek odtwarzania na macOS.
- `providers.<provider>.voiceId`: używa wartości zapasowej z `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` dla ElevenLabs (albo pierwszego głosu ElevenLabs, gdy dostępny jest klucz API).
- `providers.elevenlabs.modelId`: domyślnie `eleven_v3`, gdy nie ustawiono.
- `providers.mlx.modelId`: domyślnie `mlx-community/Soprano-80M-bf16`, gdy nie ustawiono.
- `providers.elevenlabs.apiKey`: używa wartości zapasowej z `ELEVENLABS_API_KEY` (albo profilu powłoki gateway, jeśli dostępny).
- `outputFormat`: domyślnie `pcm_44100` na macOS/iOS i `pcm_24000` na Androidzie (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## macOS UI

- Przełącznik paska menu: **Talk**
- Zakładka config: grupa **Talk Mode** (ID głosu + przełącznik przerwań)
- Nakładka:
  - **Listening**: pulsująca chmura z poziomem mikrofonu
  - **Thinking**: animacja opadania
  - **Speaking**: rozchodzące się pierścienie
  - Kliknięcie chmury: zatrzymanie mówienia
  - Kliknięcie X: wyjście z trybu Talk

## Uwagi

- Wymaga uprawnień do Speech i Microphone.
- Używa `chat.send` względem klucza sesji `main`.
- Gateway rozwiązuje odtwarzanie Talk przez `talk.speak` przy użyciu aktywnego dostawcy Talk. Android wraca do lokalnego systemowego TTS tylko wtedy, gdy to RPC jest niedostępne.
- Lokalne odtwarzanie MLX na macOS używa dołączonego pomocnika `openclaw-mlx-tts`, jeśli jest obecny, albo pliku wykonywalnego z `PATH`. Ustaw `OPENCLAW_MLX_TTS_BIN`, aby podczas developmentu wskazać własny binarny plik pomocnika.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` albo `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, gdy jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla strumieniowania AudioTrack o niskich opóźnieniach.

## Powiązane

- [Voice wake](/pl/nodes/voicewake)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie mediów](/pl/nodes/media-understanding)
