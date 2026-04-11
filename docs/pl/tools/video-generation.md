---
read_when:
    - Generowanie filmów przez agenta
    - Konfigurowanie providerów i modeli do generowania wideo
    - Zrozumienie parametrów narzędzia `video_generate`
summary: Generuj filmy z tekstu, obrazów lub istniejących nagrań wideo za pomocą 12 backendów providerów
title: Generowanie wideo
x-i18n:
    generated_at: "2026-04-11T02:48:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6848d03ef578181902517d068e8d9fe2f845e572a90481bbdf7bd9f1c591f245
    source_path: tools/video-generation.md
    workflow: 15
---

# Generowanie wideo

Agenci OpenClaw mogą generować filmy na podstawie promptów tekstowych, obrazów referencyjnych lub istniejących nagrań wideo. Obsługiwanych jest dwanaście backendów providerów, z których każdy oferuje inne opcje modeli, tryby wejściowe i zestawy funkcji. Agent automatycznie wybiera właściwego providera na podstawie twojej konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden provider generowania wideo. Jeśli nie widzisz go w narzędziach agenta, ustaw klucz API providera lub skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traktuje generowanie wideo jako trzy tryby runtime:

- `generate` dla żądań text-to-video bez mediów referencyjnych
- `imageToVideo`, gdy żądanie zawiera co najmniej jeden obraz referencyjny
- `videoToVideo`, gdy żądanie zawiera co najmniej jedno nagranie wideo referencyjne

Providery mogą obsługiwać dowolny podzbiór tych trybów. Narzędzie waliduje aktywny
tryb przed wysłaniem i raportuje obsługiwane tryby w `action=list`.

## Szybki start

1. Ustaw klucz API dla dowolnego obsługiwanego providera:

```bash
export GEMINI_API_KEY="your-key"
```

2. Opcjonalnie przypnij model domyślny:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Poproś agenta:

> Wygeneruj 5-sekundowy film kinowy z przyjaznym homarem surfującym o zachodzie słońca.

Agent automatycznie wywoła `video_generate`. Nie jest potrzebna żadna lista dozwolonych narzędzi.

## Co dzieje się podczas generowania wideo

Generowanie wideo jest asynchroniczne. Gdy agent wywołuje `video_generate` w sesji:

1. OpenClaw wysyła żądanie do providera i natychmiast zwraca identyfikator zadania.
2. Provider przetwarza zadanie w tle (zwykle od 30 sekund do 5 minut w zależności od providera i rozdzielczości).
3. Gdy film jest gotowy, OpenClaw wybudza tę samą sesję wewnętrznym zdarzeniem ukończenia.
4. Agent publikuje gotowy film z powrotem w oryginalnej rozmowie.

Gdy zadanie jest w toku, zduplikowane wywołania `video_generate` w tej samej sesji zwracają bieżący stan zadania zamiast rozpoczynać nowe generowanie. Użyj `openclaw tasks list` lub `openclaw tasks show <taskId>`, aby sprawdzić postęp z CLI.

Poza uruchomieniami agentów opartymi na sesji (na przykład przy bezpośrednich wywołaniach narzędzia) narzędzie przechodzi do generowania inline i zwraca końcową ścieżkę do multimediów w tej samej turze.

### Cykl życia zadania

Każde żądanie `video_generate` przechodzi przez cztery stany:

1. **queued** -- zadanie utworzone, oczekuje na zaakceptowanie przez providera.
2. **running** -- provider przetwarza zadanie (zwykle od 30 sekund do 5 minut w zależności od providera i rozdzielczości).
3. **succeeded** -- film gotowy; agent wybudza się i publikuje go w rozmowie.
4. **failed** -- błąd providera lub przekroczenie limitu czasu; agent wybudza się ze szczegółami błędu.

Sprawdzanie stanu z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Zapobieganie duplikatom: jeśli zadanie wideo jest już w stanie `queued` lub `running` dla bieżącej sesji, `video_generate` zwraca stan istniejącego zadania zamiast uruchamiać nowe. Użyj `action: "status"`, aby sprawdzić to jawnie bez wyzwalania nowego generowania.

## Obsługiwani providerzy

| Provider | Model domyślny                  | Tekst | Referencja obrazu | Referencja wideo | Klucz API                                 |
| -------- | ------------------------------- | ----- | ----------------- | ---------------- | ----------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | Tak   | Tak (zdalny URL)  | Tak (zdalny URL) | `MODELSTUDIO_API_KEY`                     |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Tak   | 1 obraz           | Nie              | `BYTEPLUS_API_KEY`                        |
| ComfyUI  | `workflow`                      | Tak   | 1 obraz           | Nie              | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Tak   | 1 obraz           | Nie              | `FAL_KEY`                                 |
| Google   | `veo-3.1-fast-generate-preview` | Tak   | 1 obraz           | 1 wideo          | `GEMINI_API_KEY`                          |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Tak   | 1 obraz           | Nie              | `MINIMAX_API_KEY`                         |
| OpenAI   | `sora-2`                        | Tak   | 1 obraz           | 1 wideo          | `OPENAI_API_KEY`                          |
| Qwen     | `wan2.6-t2v`                    | Tak   | Tak (zdalny URL)  | Tak (zdalny URL) | `QWEN_API_KEY`                            |
| Runway   | `gen4.5`                        | Tak   | 1 obraz           | 1 wideo          | `RUNWAYML_API_SECRET`                     |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Tak   | 1 obraz           | Nie              | `TOGETHER_API_KEY`                        |
| Vydra    | `veo3`                          | Tak   | 1 obraz (`kling`) | Nie              | `VYDRA_API_KEY`                           |
| xAI      | `grok-imagine-video`            | Tak   | 1 obraz           | 1 wideo          | `XAI_API_KEY`                             |

Niektórzy providerzy akceptują dodatkowe lub alternatywne zmienne środowiskowe z kluczem API. Szczegóły znajdziesz na poszczególnych [stronach providerów](#related).

Uruchom `video_generate action=list`, aby w czasie działania sprawdzić dostępnych providerów, modele i
tryby runtime.

### Zadeklarowana macierz możliwości

To jawny kontrakt trybów używany przez `video_generate`, testy kontraktowe
i współdzielony live sweep.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Współdzielone ścieżki live obecnie                                                                                                       |
| -------- | ---------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten provider wymaga zdalnych adresów URL wideo `http(s)`                  |
| BytePlus | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI  | Tak        | Tak            | Nie            | Nie wchodzi do współdzielonego sweep; pokrycie specyficzne dla workflow znajduje się w testach Comfy                                     |
| fal      | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                                |
| Google   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ obecny sweep Gemini/Veo oparty na buforach nie akceptuje tego wejścia |
| MiniMax  | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                                |
| OpenAI   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ ta ścieżka org/wejścia wymaga obecnie dostępu po stronie providera do inpaint/remix |
| Qwen     | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten provider wymaga zdalnych adresów URL wideo `http(s)`                  |
| Runway   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybrany model to `runway/gen4_aleph`                                 |
| Together | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                                |
| Vydra    | Tak        | Tak            | Nie            | `generate`; współdzielone `imageToVideo` pomijane, ponieważ dołączony `veo3` jest tylko tekstowy, a dołączony `kling` wymaga zdalnego URL obrazu |
| xAI      | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten provider wymaga obecnie zdalnego URL MP4                              |

## Parametry narzędzia

### Wymagane

| Parametr | Typ    | Opis                                                                        |
| -------- | ------ | --------------------------------------------------------------------------- |
| `prompt` | string | Tekstowy opis filmu do wygenerowania (wymagany dla `action: "generate"`) |

### Wejścia treści

| Parametr | Typ      | Opis                                 |
| -------- | -------- | ------------------------------------ |
| `image`  | string   | Pojedynczy obraz referencyjny (ścieżka lub URL) |
| `images` | string[] | Wiele obrazów referencyjnych (do 5)  |
| `video`  | string   | Pojedyncze wideo referencyjne (ścieżka lub URL) |
| `videos` | string[] | Wiele nagrań wideo referencyjnych (do 4) |

### Ustawienia stylu

| Parametr         | Typ     | Opis                                                                     |
| ---------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`     | string  | `480P`, `720P`, `768P` lub `1080P`                                      |
| `durationSeconds` | number | Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez providera) |
| `size`           | string  | Wskazówka rozmiaru, gdy provider ją obsługuje                            |
| `audio`          | boolean | Włącz generowany dźwięk, jeśli jest obsługiwany                          |
| `watermark`      | boolean | Włącz lub wyłącz znak wodny providera, jeśli jest obsługiwany            |

### Zaawansowane

| Parametr  | Typ    | Opis                                                |
| --------- | ------ | --------------------------------------------------- |
| `action`  | string | `"generate"` (domyślnie), `"status"` lub `"list"` |
| `model`   | string | Nadpisanie providera/modelu (np. `runway/gen4.5`)   |
| `filename` | string | Wskazówka nazwy pliku                              |

Nie wszyscy providerzy obsługują wszystkie parametry. OpenClaw już normalizuje czas trwania do najbliższej wartości obsługiwanej przez providera, a także mapuje przetłumaczone wskazówki geometrii, takie jak size-to-aspect-ratio, gdy zapasowy provider udostępnia inną powierzchnię sterowania. Naprawdę nieobsługiwane nadpisania są ignorowane na zasadzie best-effort i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde ograniczenia możliwości (takie jak zbyt wiele wejść referencyjnych) powodują błąd jeszcze przed wysłaniem.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw mapuje czas trwania lub geometrię podczas fallbacku providera, zwracane wartości `durationSeconds`, `size`, `aspectRatio` i `resolution` odzwierciedlają to, co zostało wysłane, a `details.normalization` zawiera mapowanie od wartości żądanych do zastosowanych.

Wejścia referencyjne wybierają także tryb runtime:

- Brak mediów referencyjnych: `generate`
- Dowolny obraz referencyjny: `imageToVideo`
- Dowolne wideo referencyjne: `videoToVideo`

Mieszane referencje obrazów i wideo nie stanowią stabilnej współdzielonej powierzchni możliwości.
Preferuj jeden typ referencji na żądanie.

## Akcje

- **generate** (domyślnie) -- utwórz film na podstawie podanego promptu i opcjonalnych wejść referencyjnych.
- **status** -- sprawdź stan zadania wideo będącego w toku dla bieżącej sesji bez rozpoczynania kolejnego generowania.
- **list** -- pokaż dostępnych providerów, modele i ich możliwości.

## Wybór modelu

Podczas generowania wideo OpenClaw rozpoznaje model w tej kolejności:

1. **Parametr narzędzia `model`** -- jeśli agent poda go w wywołaniu.
2. **`videoGenerationModel.primary`** -- z konfiguracji.
3. **`videoGenerationModel.fallbacks`** -- próbowane po kolei.
4. **Automatyczne wykrywanie** -- używa providerów z prawidłowym uwierzytelnianiem, zaczynając od bieżącego domyślnego providera, a następnie pozostałych providerów w kolejności alfabetycznej.

Jeśli provider zakończy się błędem, automatycznie zostanie wypróbowany kolejny kandydat. Jeśli wszyscy kandydaci zawiodą, błąd będzie zawierał szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz,
aby generowanie wideo używało tylko jawnie określonych wpisów `model`, `primary` i `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

Wideo-agenta HeyGen na fal można przypiąć za pomocą:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/heygen/v2/video-agent",
      },
    },
  },
}
```

Seedance 2.0 na fal można przypiąć za pomocą:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
      },
    },
  },
}
```

## Uwagi dotyczące providerów

| Provider | Uwagi                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Używa asynchronicznego endpointu DashScope/Model Studio. Obrazy i wideo referencyjne muszą być zdalnymi adresami URL `http(s)`.                                  |
| BytePlus | Tylko pojedynczy obraz referencyjny.                                                                                                                                |
| ComfyUI  | Wykonywanie lokalne lub chmurowe oparte na workflow. Obsługuje text-to-video i image-to-video przez skonfigurowany graf.                                         |
| fal      | Używa przepływu opartego na kolejce dla długotrwałych zadań. Tylko pojedynczy obraz referencyjny. Obejmuje odwołania do modeli HeyGen video-agent oraz Seedance 2.0 text-to-video i image-to-video. |
| Google   | Używa Gemini/Veo. Obsługuje jeden obraz lub jedno wideo referencyjne.                                                                                              |
| MiniMax  | Tylko pojedynczy obraz referencyjny.                                                                                                                                |
| OpenAI   | Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z ostrzeżeniem.              |
| Qwen     | Ten sam backend DashScope co Alibaba. Wejścia referencyjne muszą być zdalnymi adresami URL `http(s)`; pliki lokalne są odrzucane z góry.                         |
| Runway   | Obsługuje pliki lokalne przez URI danych. Video-to-video wymaga `runway/gen4_aleph`. Uruchomienia tylko tekstowe udostępniają proporcje `16:9` i `9:16`.         |
| Together | Tylko pojedynczy obraz referencyjny.                                                                                                                                |
| Vydra    | Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań usuwających uwierzytelnianie. `veo3` jest dołączony tylko jako text-to-video; `kling` wymaga zdalnego URL obrazu. |
| xAI      | Obsługuje text-to-video, image-to-video oraz zdalne przepływy edycji/rozszerzania wideo.                                                                          |

## Tryby możliwości providera

Współdzielony kontrakt generowania wideo pozwala teraz providerom deklarować
możliwości specyficzne dla trybu zamiast tylko płaskich limitów zbiorczych. Nowe
implementacje providerów powinny preferować jawne bloki trybów:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Płaskie pola zbiorcze, takie jak `maxInputImages` i `maxInputVideos`, nie
wystarczają do ogłaszania obsługi trybów transformacji. Providery powinny jawnie deklarować
`generate`, `imageToVideo` i `videoToVideo`, aby testy live,
testy kontraktowe i współdzielone narzędzie `video_generate` mogły deterministycznie walidować obsługę trybów.

## Testy live

Pokrycie live opt-in dla współdzielonych dołączonych providerów:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Opakowanie repozytorium:

```bash
pnpm test:live:media video
```

Ten plik live ładuje brakujące zmienne środowiskowe providerów z `~/.profile`, domyślnie preferuje
klucze API live/env przed zapisanymi profilami uwierzytelniania i uruchamia
zadeklarowane tryby, które może bezpiecznie wykonać z lokalnymi multimediami:

- `generate` dla każdego providera w sweep
- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` i provider/model
  akceptuje lokalne wejście wideo oparte na buforze we współdzielonym sweep

Obecnie współdzielona ścieżka live `videoToVideo` obejmuje:

- `runway` tylko wtedy, gdy wybierzesz `runway/gen4_aleph`

## Konfiguracja

Ustaw domyślny model generowania wideo w konfiguracji OpenClaw:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Lub przez CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Powiązane

- [Przegląd narzędzi](/pl/tools)
- [Zadania w tle](/pl/automation/tasks) -- śledzenie zadań dla asynchronicznego generowania wideo
- [Alibaba Model Studio](/pl/providers/alibaba)
- [BytePlus](/pl/concepts/model-providers#byteplus-international)
- [ComfyUI](/pl/providers/comfy)
- [fal](/pl/providers/fal)
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [OpenAI](/pl/providers/openai)
- [Qwen](/pl/providers/qwen)
- [Runway](/pl/providers/runway)
- [Together AI](/pl/providers/together)
- [Vydra](/pl/providers/vydra)
- [xAI](/pl/providers/xai)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#agent-defaults)
- [Modele](/pl/concepts/models)
