---
read_when:
    - Generowanie filmów przez agenta
    - Konfigurowanie dostawców i modeli do generowania wideo
    - Zrozumienie parametrów narzędzia `video_generate`
summary: Generuj filmy z tekstu, obrazów lub istniejących filmów przy użyciu 14 backendów dostawców
title: Generowanie wideo
x-i18n:
    generated_at: "2026-04-25T14:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a16c56939967a6268e62a267598fe03d2eb3195384ad805652498004fdaf886
    source_path: tools/video-generation.md
    workflow: 15
---

Agenci OpenClaw mogą generować filmy na podstawie promptów tekstowych, obrazów referencyjnych lub istniejących filmów. Obsługiwanych jest czternaście backendów dostawców, z których każdy ma inne opcje modeli, tryby wejścia i zestawy funkcji. Agent automatycznie wybiera właściwego dostawcę na podstawie Twojej konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania wideo. Jeśli nie widzisz go w narzędziach agenta, ustaw klucz API dostawcy lub skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traktuje generowanie wideo jako trzy tryby środowiska uruchomieniowego:

- `generate` dla żądań text-to-video bez mediów referencyjnych
- `imageToVideo`, gdy żądanie zawiera co najmniej jeden obraz referencyjny
- `videoToVideo`, gdy żądanie zawiera co najmniej jeden film referencyjny

Dostawcy mogą obsługiwać dowolny podzbiór tych trybów. Narzędzie waliduje aktywny
tryb przed wysłaniem i raportuje obsługiwane tryby w `action=list`.

## Szybki start

1. Ustaw klucz API dla dowolnego obsługiwanego dostawcy:

```bash
export GEMINI_API_KEY="your-key"
```

2. Opcjonalnie przypnij model domyślny:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Poproś agenta:

> Wygeneruj 5-sekundowy kinowy film z przyjaznym homarem surfującym o zachodzie słońca.

Agent automatycznie wywołuje `video_generate`. Nie jest wymagane żadne dodawanie narzędzia do allowlisty.

## Co się dzieje podczas generowania filmu

Generowanie wideo jest asynchroniczne. Gdy agent wywołuje `video_generate` w sesji:

1. OpenClaw wysyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do 5 minut, zależnie od dostawcy i rozdzielczości).
3. Gdy film jest gotowy, OpenClaw wybudza tę samą sesję wewnętrznym zdarzeniem ukończenia.
4. Agent publikuje gotowy film z powrotem w oryginalnej rozmowie.

Gdy zadanie jest w toku, zduplikowane wywołania `video_generate` w tej samej sesji zwracają bieżący stan zadania zamiast uruchamiać nowe generowanie. Użyj `openclaw tasks list` lub `openclaw tasks show <taskId>`, aby sprawdzić postęp z CLI.

Poza uruchomieniami agenta opartymi na sesji (na przykład bezpośrednie wywołania narzędzi) narzędzie przełącza się na generowanie inline i zwraca końcową ścieżkę mediów w tej samej turze.

Wygenerowane pliki wideo są zapisywane w magazynie mediów zarządzanym przez OpenClaw, gdy
dostawca zwraca bajty. Domyślny limit zapisu wygenerowanego wideo jest zgodny z limitem mediów wideo,
a `agents.defaults.mediaMaxMb` podnosi go dla większych renderów.
Gdy dostawca zwraca również hostowany URL wyjściowy, OpenClaw może dostarczyć ten URL
zamiast kończyć zadanie niepowodzeniem, jeśli lokalne utrwalenie odrzuci zbyt duży plik.

### Cykl życia zadania

Każde żądanie `video_generate` przechodzi przez cztery stany:

1. **queued** -- zadanie utworzone, oczekuje na przyjęcie przez dostawcę.
2. **running** -- dostawca przetwarza (zwykle od 30 sekund do 5 minut, zależnie od dostawcy i rozdzielczości).
3. **succeeded** -- film gotowy; agent budzi się i publikuje go w rozmowie.
4. **failed** -- błąd dostawcy lub przekroczenie limitu czasu; agent budzi się ze szczegółami błędu.

Sprawdź stan z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Zapobieganie duplikatom: jeśli zadanie wideo dla bieżącej sesji ma już stan `queued` lub `running`, `video_generate` zwraca stan istniejącego zadania zamiast uruchamiać nowe. Użyj `action: "status"`, aby sprawdzić jawnie bez wyzwalania nowego generowania.

## Obsługiwani dostawcy

| Dostawca              | Model domyślny                  | Tekst | Referencja obrazu                                   | Referencja wideo | Klucz API                                 |
| --------------------- | ------------------------------- | ----- | --------------------------------------------------- | ---------------- | ----------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Tak   | Tak (zdalny URL)                                    | Tak (zdalny URL) | `MODELSTUDIO_API_KEY`                     |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Tak   | Do 2 obrazów (tylko modele I2V; pierwsza i ostatnia klatka) | Nie        | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Tak   | Do 2 obrazów (pierwsza i ostatnia klatka przez rolę) | Nie             | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Tak   | Do 9 obrazów referencyjnych                         | Do 3 filmów      | `BYTEPLUS_API_KEY`                        |
| ComfyUI               | `workflow`                      | Tak   | 1 obraz                                             | Nie              | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Tak   | 1 obraz                                             | Nie              | `FAL_KEY`                                 |
| Google                | `veo-3.1-fast-generate-preview` | Tak   | 1 obraz                                             | 1 film           | `GEMINI_API_KEY`                          |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Tak   | 1 obraz                                             | Nie              | `MINIMAX_API_KEY`                         |
| OpenAI                | `sora-2`                        | Tak   | 1 obraz                                             | 1 film           | `OPENAI_API_KEY`                          |
| Qwen                  | `wan2.6-t2v`                    | Tak   | Tak (zdalny URL)                                    | Tak (zdalny URL) | `QWEN_API_KEY`                            |
| Runway                | `gen4.5`                        | Tak   | 1 obraz                                             | 1 film           | `RUNWAYML_API_SECRET`                     |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Tak   | 1 obraz                                             | Nie              | `TOGETHER_API_KEY`                        |
| Vydra                 | `veo3`                          | Tak   | 1 obraz (`kling`)                                   | Nie              | `VYDRA_API_KEY`                           |
| xAI                   | `grok-imagine-video`            | Tak   | 1 obraz                                             | 1 film           | `XAI_API_KEY`                             |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne env z kluczami API. Szczegóły znajdziesz na poszczególnych [stronach dostawców](#related).

Uruchom `video_generate action=list`, aby w czasie działania sprawdzić dostępnych dostawców, modele i
tryby środowiska uruchomieniowego.

### Zadeklarowana macierz możliwości

To jawny kontrakt trybów używany przez `video_generate`, testy kontraktowe
i wspólny aktywny sweep.

| Dostawca | `generate` | `imageToVideo` | `videoToVideo` | Wspólne aktywne ścieżki obecnie                                                                                                        |
| -------- | ---------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                      |
| BytePlus | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                             |
| ComfyUI  | Tak        | Tak            | Nie            | Nie we wspólnym sweepie; pokrycie specyficzne dla workflow znajduje się przy testach Comfy                                            |
| fal      | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                             |
| Google   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; wspólne `videoToVideo` pomijane, ponieważ bieżący sweep Gemini/Veo oparty na buforze nie akceptuje tego wejścia |
| MiniMax  | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                             |
| OpenAI   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; wspólne `videoToVideo` pomijane, ponieważ ta ścieżka org/wejścia obecnie wymaga dostępu do provider-side inpaint/remix |
| Qwen     | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                      |
| Runway   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybrany model to `runway/gen4_aleph`                               |
| Together | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                             |
| Vydra    | Tak        | Tak            | Nie            | `generate`; wspólne `imageToVideo` pomijane, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL-a obrazu |
| xAI      | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca obecnie wymaga zdalnego URL-a MP4                          |

## Parametry narzędzia

### Wymagane

| Parametr | Typ    | Opis                                                                      |
| -------- | ------ | ------------------------------------------------------------------------- |
| `prompt` | string | Tekstowy opis filmu do wygenerowania (wymagany dla `action: "generate"`) |

### Wejścia treści

| Parametr    | Typ      | Opis                                                                                                                                 |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `image`     | string   | Pojedynczy obraz referencyjny (ścieżka lub URL)                                                                                     |
| `images`    | string[] | Wiele obrazów referencyjnych (maksymalnie 9)                                                                                        |
| `imageRoles`| string[] | Opcjonalne podpowiedzi ról per pozycja, równoległe do połączonej listy obrazów. Wartości kanoniczne: `first_frame`, `last_frame`, `reference_image` |
| `video`     | string   | Pojedynczy film referencyjny (ścieżka lub URL)                                                                                      |
| `videos`    | string[] | Wiele filmów referencyjnych (maksymalnie 4)                                                                                         |
| `videoRoles`| string[] | Opcjonalne podpowiedzi ról per pozycja, równoległe do połączonej listy filmów. Wartość kanoniczna: `reference_video`              |
| `audioRef`  | string   | Pojedynczy dźwięk referencyjny (ścieżka lub URL). Używany np. jako muzyka w tle lub referencja głosu, gdy dostawca obsługuje wejścia audio |
| `audioRefs` | string[] | Wiele dźwięków referencyjnych (maksymalnie 3)                                                                                       |
| `audioRoles`| string[] | Opcjonalne podpowiedzi ról per pozycja, równoległe do połączonej listy dźwięków. Wartość kanoniczna: `reference_audio`            |

Podpowiedzi ról są przekazywane do dostawcy bez zmian. Wartości kanoniczne pochodzą z
unii `VideoGenerationAssetRole`, ale dostawcy mogą akceptować dodatkowe
ciągi ról. Tablice `*Roles` nie mogą mieć więcej wpisów niż
odpowiadająca im lista referencji; błędy off-by-one kończą się czytelnym błędem.
Użyj pustego ciągu, aby pozostawić slot nieustawiony.

### Ustawienia stylu

| Parametr          | Typ     | Opis                                                                                   |
| ----------------- | ------- | -------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` lub `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P` lub `1080P`                                                     |
| `durationSeconds` | number  | Docelowa długość w sekundach (zaokrąglana do najbliższej wartości obsługiwanej przez dostawcę) |
| `size`            | string  | Wskazówka rozmiaru, gdy dostawca ją obsługuje                                          |
| `audio`           | boolean | Włącza generowany dźwięk w danych wyjściowych, jeśli jest obsługiwany. Różne od `audioRef*` (wejścia) |
| `watermark`       | boolean | Przełącza znak wodny dostawcy, jeśli jest obsługiwany                                  |

`adaptive` to specyficzna dla dostawcy wartość specjalna: jest przekazywana bez zmian do
dostawców, którzy deklarują `adaptive` w swoich możliwościach (np. BytePlus
Seedance używa jej do automatycznego wykrywania proporcji na podstawie
wymiarów obrazu wejściowego). Dostawcy, którzy jej nie deklarują, ujawniają tę wartość przez
`details.ignoredOverrides` w wyniku narzędzia, aby pominięcie było widoczne.

### Zaawansowane

| Parametr          | Typ    | Opis                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (domyślnie), `"status"` lub `"list"`                                                                                                                                                                                                                                                                                     |
| `model`           | string | Nadpisanie dostawcy/modelu (np. `runway/gen4.5`)                                                                                                                                                                                                                                                                                      |
| `filename`        | string | Wskazówka nazwy pliku wyjściowego                                                                                                                                                                                                                                                                                                      |
| `timeoutMs`       | number | Opcjonalny limit czasu żądania do dostawcy w milisekundach                                                                                                                                                                                                                                                                            |
| `providerOptions` | object | Opcje specyficzne dla dostawcy jako obiekt JSON (np. `{"seed": 42, "draft": true}`). Dostawcy deklarujący typowany schemat walidują klucze i typy; nieznane klucze lub niedopasowania powodują pominięcie kandydata podczas fallbacku. Dostawcy bez zadeklarowanego schematu otrzymują opcje bez zmian. Uruchom `video_generate action=list`, aby zobaczyć, co akceptuje każdy dostawca |

Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw już normalizuje długość do najbliższej wartości obsługiwanej przez dostawcę, a także mapuje przetłumaczone wskazówki geometrii, takie jak size-to-aspect-ratio, gdy dostawca fallback udostępnia inną powierzchnię sterowania. Naprawdę nieobsługiwane nadpisania są ignorowane w miarę możliwości i raportowane jako ostrzeżenia w wyniku narzędzia. Twarde limity możliwości (takie jak zbyt wiele wejść referencyjnych) kończą się błędem przed wysłaniem.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw mapuje długość lub geometrię podczas fallbacku dostawcy, zwracane wartości `durationSeconds`, `size`, `aspectRatio` i `resolution` odzwierciedlają to, co zostało wysłane, a `details.normalization` przechwytuje translację od wartości żądanej do zastosowanej.

Wejścia referencyjne wybierają również tryb środowiska uruchomieniowego:

- Brak mediów referencyjnych: `generate`
- Dowolna referencja obrazu: `imageToVideo`
- Dowolna referencja wideo: `videoToVideo`
- Referencyjne wejścia audio nie zmieniają rozstrzygniętego trybu; są nakładane na tryb wybrany przez referencje obrazów/wideo i działają tylko z dostawcami, którzy deklarują `maxInputAudios`

Mieszane referencje obrazów i wideo nie stanowią stabilnej współdzielonej powierzchni możliwości.
Preferuj jeden typ referencji na żądanie.

#### Fallback i opcje typowane

Niektóre kontrole możliwości są stosowane na warstwie fallbacku zamiast na
granicy narzędzia, tak aby żądanie przekraczające limity głównego dostawcy
mogło nadal zostać uruchomione na dostawcy zdolnym je obsłużyć:

- Jeśli aktywny kandydat nie deklaruje `maxInputAudios` (albo deklaruje je jako
  `0`), jest pomijany, gdy żądanie zawiera referencje audio, i
  próbowany jest kolejny kandydat.
- Jeśli `maxDurationSeconds` aktywnego kandydata jest niższe niż żądane
  `durationSeconds`, a kandydat nie deklaruje listy
  `supportedDurationSeconds`, jest pomijany.
- Jeśli żądanie zawiera `providerOptions`, a aktywny kandydat
  jawnie deklaruje typowany schemat `providerOptions`, kandydat jest
  pomijany, gdy podane klucze nie znajdują się w schemacie albo typy wartości
  nie pasują. Dostawcy, którzy jeszcze nie zadeklarowali schematu, otrzymują
  opcje bez zmian (zgodny wstecznie pass-through). Dostawca może
  jawnie zrezygnować ze wszystkich opcji dostawcy, deklarując pusty schemat
  (`capabilities.providerOptions: {}`), co powoduje takie samo pominięcie jak
  niedopasowanie typu.

Pierwszy powód pominięcia w żądaniu jest logowany na poziomie `warn`, aby operatorzy widzieli,
kiedy ich główny dostawca został pominięty; kolejne pominięcia są logowane na poziomie
`debug`, aby długie łańcuchy fallbacku pozostawały ciche. Jeśli każdy kandydat zostanie pominięty,
zagregowany błąd zawiera powód pominięcia dla każdego z nich.

## Akcje

- **generate** (domyślnie) -- utwórz film na podstawie podanego promptu i opcjonalnych wejść referencyjnych.
- **status** -- sprawdź stan zadania wideo będącego w toku dla bieżącej sesji bez uruchamiania kolejnego generowania.
- **list** -- pokaż dostępnych dostawców, modele i ich możliwości.

## Wybór modelu

Podczas generowania filmu OpenClaw rozstrzyga model w następującej kolejności:

1. **Parametr narzędzia `model`** -- jeśli agent poda go w wywołaniu.
2. **`videoGenerationModel.primary`** -- z konfiguracji.
3. **`videoGenerationModel.fallbacks`** -- próbowane po kolei.
4. **Automatyczne wykrywanie** -- używa dostawców z prawidłowym uwierzytelnieniem, zaczynając od bieżącego domyślnego dostawcy, a następnie pozostałych dostawców w kolejności alfabetycznej.

Jeśli dostawca zawiedzie, kolejny kandydat jest próbowany automatycznie. Jeśli zawiodą wszyscy kandydaci, błąd zawiera szczegóły z każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz,
aby generowanie wideo używało wyłącznie jawnych wpisów `model`, `primary` i `fallbacks`.

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

## Uwagi dotyczące dostawców

<AccordionGroup>
  <Accordion title="Alibaba">
    Używa asynchronicznego endpointu DashScope / Model Studio. Obrazy i filmy referencyjne muszą być zdalnymi URL-ami `http(s)`.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    Identyfikator dostawcy: `byteplus`.

    Modele: `seedance-1-0-pro-250528` (domyślny), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modele T2V (`*-t2v-*`) nie akceptują wejść obrazów; modele I2V oraz ogólne modele `*-pro-*` obsługują pojedynczy obraz referencyjny (pierwsza klatka). Przekaż obraz pozycyjnie albo ustaw `role: "first_frame"`. Identyfikatory modeli T2V są automatycznie przełączane na odpowiadający wariant I2V, gdy podano obraz.

    Obsługiwane klucze `providerOptions`: `seed` (number), `draft` (boolean — wymusza 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Wymaga Pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Identyfikator dostawcy: `byteplus-seedance15`. Model: `seedance-1-5-pro-251215`.

    Używa ujednoliconego API `content[]`. Obsługuje maksymalnie 2 obrazy wejściowe (`first_frame` + `last_frame`). Wszystkie wejścia muszą być zdalnymi URL-ami `https://`. Ustaw `role: "first_frame"` / `"last_frame"` dla każdego obrazu albo przekaż obrazy pozycyjnie.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego. `audio: true` mapuje się na `generate_audio`. `providerOptions.seed` (number) jest przekazywane dalej.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Wymaga Pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Identyfikator dostawcy: `byteplus-seedance2`. Modele: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Używa ujednoliconego API `content[]`. Obsługuje do 9 obrazów referencyjnych, 3 filmów referencyjnych i 3 dźwięków referencyjnych. Wszystkie wejścia muszą być zdalnymi URL-ami `https://`. Ustaw `role` dla każdego zasobu — obsługiwane wartości: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego. `audio: true` mapuje się na `generate_audio`. `providerOptions.seed` (number) jest przekazywane dalej.

  </Accordion>

  <Accordion title="ComfyUI">
    Lokalna lub chmurowa realizacja sterowana workflow. Obsługuje text-to-video i image-to-video przez skonfigurowany graf.
  </Accordion>

  <Accordion title="fal">
    Używa przepływu opartego na kolejce dla długotrwałych zadań. Tylko pojedynczy obraz referencyjny.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Obsługuje jedną referencję obrazu lub jedną referencję wideo.
  </Accordion>

  <Accordion title="MiniMax">
    Tylko pojedynczy obraz referencyjny.
  </Accordion>

  <Accordion title="OpenAI">
    Przekazywane jest tylko nadpisanie `size`. Inne nadpisania stylu (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z ostrzeżeniem.
  </Accordion>

  <Accordion title="Qwen">
    Ten sam backend DashScope co Alibaba. Wejścia referencyjne muszą być zdalnymi URL-ami `http(s)`; pliki lokalne są odrzucane z góry.
  </Accordion>

  <Accordion title="Runway">
    Obsługuje pliki lokalne przez URI danych. Video-to-video wymaga `runway/gen4_aleph`. Uruchomienia tylko tekstowe udostępniają proporcje `16:9` i `9:16`.
  </Accordion>

  <Accordion title="Together">
    Tylko pojedynczy obraz referencyjny.
  </Accordion>

  <Accordion title="Vydra">
    Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań gubiących uwierzytelnienie. `veo3` jest dołączony wyłącznie jako text-to-video; `kling` wymaga zdalnego URL-a obrazu.
  </Accordion>

  <Accordion title="xAI">
    Obsługuje text-to-video, image-to-video oraz zdalne przepływy edycji/rozszerzania wideo.
  </Accordion>
</AccordionGroup>

## Tryby możliwości dostawców

Wspólny kontrakt generowania wideo pozwala teraz dostawcom deklarować możliwości
specyficzne dla trybu zamiast tylko płaskich limitów zagregowanych. Nowe implementacje
dostawców powinny preferować jawne bloki trybów:

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

Płaskie pola zagregowane, takie jak `maxInputImages` i `maxInputVideos`, nie
wystarczają do ogłoszenia obsługi trybów transformacji. Dostawcy powinni jawnie deklarować
`generate`, `imageToVideo` i `videoToVideo`, aby aktywne testy,
testy kontraktowe i współdzielone narzędzie `video_generate` mogły deterministycznie walidować obsługę trybów.

## Testy aktywne

Aktywne pokrycie opt-in dla współdzielonych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media video
```

Ten plik aktywny ładuje brakujące zmienne env dostawców z `~/.profile`, domyślnie preferuje
klucze API z live/env przed zapisanymi profilami auth i uruchamia bezpieczny dla wydań smoke test:

- `generate` dla każdego dostawcy innego niż FAL we wspólnym sweepie
- jednosekundowy prompt z homarem
- limit operacji per dostawca z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (domyślnie `180000`)

FAL jest opt-in, ponieważ opóźnienie kolejki po stronie dostawcy może dominować czas wydania:

```bash
pnpm test:live:media video --video-providers fal
```

Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać również zadeklarowane tryby transformacji,
które wspólny sweep może bezpiecznie testować z lokalnymi mediami:

- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` i dostawca/model
  akceptuje lokalne wejście wideo oparte na buforze we wspólnym sweepie

Obecnie wspólna aktywna ścieżka `videoToVideo` obejmuje:

- tylko `runway`, gdy wybierzesz `runway/gen4_aleph`

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
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults)
- [Modele](/pl/concepts/models)
