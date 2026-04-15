---
read_when:
    - Generowanie filmów przez agenta
    - Konfigurowanie dostawców i modeli generowania wideo
    - Zrozumienie parametrów narzędzia `video_generate`
summary: Generuj filmy na podstawie tekstu, obrazów lub istniejących filmów z użyciem 14 backendów dostawców
title: Generowanie wideo
x-i18n:
    generated_at: "2026-04-15T09:52:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c182f24b25e44f157a820e82a1f7422247f26125956944b5eb98613774268cfe
    source_path: tools/video-generation.md
    workflow: 15
---

# Generowanie wideo

Agenci OpenClaw mogą generować filmy na podstawie promptów tekstowych, obrazów referencyjnych lub istniejących filmów. Obsługiwanych jest czternaście backendów dostawców, z których każdy oferuje inne opcje modeli, tryby wejścia i zestawy funkcji. Agent automatycznie wybiera odpowiedniego dostawcę na podstawie Twojej konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania wideo. Jeśli nie widzisz go w narzędziach agenta, ustaw klucz API dostawcy albo skonfiguruj `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traktuje generowanie wideo jako trzy tryby działania:

- `generate` dla żądań text-to-video bez mediów referencyjnych
- `imageToVideo`, gdy żądanie zawiera co najmniej jeden obraz referencyjny
- `videoToVideo`, gdy żądanie zawiera co najmniej jeden film referencyjny

Dostawcy mogą obsługiwać dowolny podzbiór tych trybów. Narzędzie sprawdza aktywny
tryb przed wysłaniem i raportuje obsługiwane tryby w `action=list`.

## Szybki start

1. Ustaw klucz API dla dowolnego obsługiwanego dostawcy:

```bash
export GEMINI_API_KEY="your-key"
```

2. Opcjonalnie przypnij domyślny model:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Poproś agenta:

> Wygeneruj 5-sekundowy kinowy film przedstawiający przyjaznego homara surfującego o zachodzie słońca.

Agent automatycznie wywoła `video_generate`. Nie trzeba tworzyć listy dozwolonych narzędzi.

## Co dzieje się podczas generowania wideo

Generowanie wideo jest asynchroniczne. Gdy agent wywoła `video_generate` w sesji:

1. OpenClaw wysyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do 5 minut, zależnie od dostawcy i rozdzielczości).
3. Gdy film jest gotowy, OpenClaw wybudza tę samą sesję wewnętrznym zdarzeniem ukończenia.
4. Agent publikuje gotowy film z powrotem w pierwotnej rozmowie.

Gdy zadanie jest w toku, zduplikowane wywołania `video_generate` w tej samej sesji zwracają bieżący status zadania zamiast rozpoczynać kolejne generowanie. Użyj `openclaw tasks list` lub `openclaw tasks show <taskId>`, aby sprawdzić postęp z poziomu CLI.

Poza uruchomieniami agenta opartymi na sesji (na przykład przy bezpośrednich wywołaniach narzędzia) narzędzie przechodzi w tryb generowania inline i zwraca końcową ścieżkę do medium w tej samej turze.

### Cykl życia zadania

Każde żądanie `video_generate` przechodzi przez cztery stany:

1. **queued** -- zadanie utworzone, oczekuje na przyjęcie przez dostawcę.
2. **running** -- dostawca przetwarza zadanie (zwykle od 30 sekund do 5 minut, zależnie od dostawcy i rozdzielczości).
3. **succeeded** -- film gotowy; agent wybudza się i publikuje go w rozmowie.
4. **failed** -- błąd dostawcy lub przekroczenie limitu czasu; agent wybudza się ze szczegółami błędu.

Sprawdzanie statusu z poziomu CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Zapobieganie duplikatom: jeśli dla bieżącej sesji zadanie wideo ma już stan `queued` lub `running`, `video_generate` zwraca status istniejącego zadania zamiast uruchamiać nowe. Użyj `action: "status"`, aby sprawdzić stan jawnie bez uruchamiania nowego generowania.

## Obsługiwani dostawcy

| Dostawca              | Domyślny model                 | Tekst | Obraz ref.                                          | Wideo ref.       | Klucz API                                 |
| --------------------- | ------------------------------ | ----- | --------------------------------------------------- | ---------------- | ----------------------------------------- |
| Alibaba               | `wan2.6-t2v`                   | Tak   | Tak (zdalny URL)                                    | Tak (zdalny URL) | `MODELSTUDIO_API_KEY`                     |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`      | Tak   | Do 2 obrazów (tylko modele I2V; pierwsza + ostatnia klatka) | Nie              | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      | Tak   | Do 2 obrazów (pierwsza + ostatnia klatka przez rolę) | Nie              | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` | Tak   | Do 9 obrazów referencyjnych                         | Do 3 filmów      | `BYTEPLUS_API_KEY`                        |
| ComfyUI               | `workflow`                     | Tak   | 1 obraz                                             | Nie              | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live` | Tak   | 1 obraz                                             | Nie              | `FAL_KEY`                                 |
| Google                | `veo-3.1-fast-generate-preview`| Tak   | 1 obraz                                             | 1 film           | `GEMINI_API_KEY`                          |
| MiniMax               | `MiniMax-Hailuo-2.3`           | Tak   | 1 obraz                                             | Nie              | `MINIMAX_API_KEY`                         |
| OpenAI                | `sora-2`                       | Tak   | 1 obraz                                             | 1 film           | `OPENAI_API_KEY`                          |
| Qwen                  | `wan2.6-t2v`                   | Tak   | Tak (zdalny URL)                                    | Tak (zdalny URL) | `QWEN_API_KEY`                            |
| Runway                | `gen4.5`                       | Tak   | 1 obraz                                             | 1 film           | `RUNWAYML_API_SECRET`                     |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`       | Tak   | 1 obraz                                             | Nie              | `TOGETHER_API_KEY`                        |
| Vydra                 | `veo3`                         | Tak   | 1 obraz (`kling`)                                   | Nie              | `VYDRA_API_KEY`                           |
| xAI                   | `grok-imagine-video`           | Tak   | 1 obraz                                             | 1 film           | `XAI_API_KEY`                             |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne środowiskowe klucza API. Szczegóły znajdziesz na poszczególnych [stronach dostawców](#related).

Uruchom `video_generate action=list`, aby w czasie działania sprawdzić dostępnych dostawców, modele i
tryby działania.

### Zadeklarowana macierz możliwości

To jawny kontrakt trybów używany przez `video_generate`, testy kontraktowe
i wspólne testy live.

| Dostawca | `generate` | `imageToVideo` | `videoToVideo` | Wspólne ścieżki live obecnie                                                                                                             |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                       |
| BytePlus | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Tak        | Tak            | Nie            | Nie ma we wspólnym teście; pokrycie specyficzne dla workflow znajduje się przy testach Comfy                                            |
| fal      | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                               |
| Google   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; wspólne `videoToVideo` pomijane, ponieważ obecny test Gemini/Veo oparty na buforze nie akceptuje tego wejścia |
| MiniMax  | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; wspólne `videoToVideo` pomijane, ponieważ ta ścieżka org/wejścia wymaga obecnie dostępu do inpaint/remix po stronie dostawcy |
| Qwen     | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                       |
| Runway   | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybrany model to `runway/gen4_aleph`                                |
| Together | Tak        | Tak            | Nie            | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Tak        | Tak            | Nie            | `generate`; wspólne `imageToVideo` pomijane, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL obrazu |
| xAI      | Tak        | Tak            | Tak            | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga obecnie zdalnego URL MP4                             |

## Parametry narzędzia

### Wymagane

| Parametr | Typ    | Opis                                                                          |
| -------- | ------ | ----------------------------------------------------------------------------- |
| `prompt` | string | Tekstowy opis filmu do wygenerowania (wymagany dla `action: "generate"`)      |

### Wejścia treści

| Parametr    | Typ      | Opis                                                                                                                                 |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `image`     | string   | Pojedynczy obraz referencyjny (ścieżka lub URL)                                                                                     |
| `images`    | string[] | Wiele obrazów referencyjnych (maksymalnie 9)                                                                                        |
| `imageRoles`| string[] | Opcjonalne wskazówki ról dla każdej pozycji, równoległe do połączonej listy obrazów. Kanoniczne wartości: `first_frame`, `last_frame`, `reference_image` |
| `video`     | string   | Pojedynczy film referencyjny (ścieżka lub URL)                                                                                      |
| `videos`    | string[] | Wiele filmów referencyjnych (maksymalnie 4)                                                                                         |
| `videoRoles`| string[] | Opcjonalne wskazówki ról dla każdej pozycji, równoległe do połączonej listy filmów. Kanoniczna wartość: `reference_video`         |
| `audioRef`  | string   | Pojedynczy dźwięk referencyjny (ścieżka lub URL). Używany np. jako muzyka tła lub referencja głosu, gdy dostawca obsługuje wejścia audio |
| `audioRefs` | string[] | Wiele dźwięków referencyjnych (maksymalnie 3)                                                                                       |
| `audioRoles`| string[] | Opcjonalne wskazówki ról dla każdej pozycji, równoległe do połączonej listy dźwięków. Kanoniczna wartość: `reference_audio`       |

Wskazówki ról są przekazywane do dostawcy bez zmian. Kanoniczne wartości pochodzą z
unii `VideoGenerationAssetRole`, ale dostawcy mogą akceptować dodatkowe
łańcuchy ról. Tablice `*Roles` nie mogą mieć więcej wpisów niż
odpowiadająca im lista referencji; błędy typu off-by-one kończą się czytelnym komunikatem.
Użyj pustego ciągu, aby pozostawić dane miejsce nieustawione.

### Sterowanie stylem

| Parametr          | Typ     | Opis                                                                                   |
| ----------------- | ------- | -------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` lub `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P` lub `1080P`                                                     |
| `durationSeconds` | number  | Docelowa długość w sekundach (zaokrąglana do najbliższej wartości obsługiwanej przez dostawcę) |
| `size`            | string  | Wskazówka rozmiaru, gdy dostawca ją obsługuje                                          |
| `audio`           | boolean | Włącza generowany dźwięk w wyjściu, jeśli jest obsługiwany. Odrębne od `audioRef*` (wejścia) |
| `watermark`       | boolean | Przełącza znak wodny dostawcy, jeśli jest obsługiwany                                  |

`adaptive` to specyficzna dla dostawcy wartość specjalna: jest przekazywana bez zmian do
dostawców, którzy deklarują `adaptive` w swoich możliwościach (np. BytePlus
Seedance używa jej do automatycznego wykrywania proporcji na podstawie
wymiarów obrazu wejściowego). Dostawcy, którzy jej nie deklarują, pokazują tę wartość w
`details.ignoredOverrides` w wyniku narzędzia, aby pominięcie było widoczne.

### Zaawansowane

| Parametr          | Typ    | Opis                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (domyślnie), `"status"` lub `"list"`                                                                                                                                                                                                                                                                                                     |
| `model`           | string | Nadpisanie dostawcy/modelu (np. `runway/gen4.5`)                                                                                                                                                                                                                                                                                                      |
| `filename`        | string | Wskazówka nazwy pliku wyjściowego                                                                                                                                                                                                                                                                                                                     |
| `providerOptions` | object | Opcje specyficzne dla dostawcy jako obiekt JSON (np. `{"seed": 42, "draft": true}`). Dostawcy, którzy deklarują typowany schemat, walidują klucze i typy; nieznane klucze lub niezgodności powodują pominięcie kandydata podczas fallbacku. Dostawcy bez zadeklarowanego schematu otrzymują opcje bez zmian. Uruchom `video_generate action=list`, aby zobaczyć, co akceptuje każdy dostawca |

Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw już normalizuje czas trwania do najbliższej wartości obsługiwanej przez dostawcę, a także przemapowuje przetłumaczone wskazówki geometrii, takie jak size-to-aspect-ratio, gdy dostawca fallback udostępnia inną powierzchnię sterowania. Naprawdę nieobsługiwane nadpisania są ignorowane na zasadzie best effort i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde ograniczenia możliwości (takie jak zbyt wiele wejść referencyjnych) powodują błąd przed wysłaniem.

Wyniki narzędzia pokazują zastosowane ustawienia. Gdy OpenClaw przemapowuje czas trwania lub geometrię podczas fallbacku dostawcy, zwracane wartości `durationSeconds`, `size`, `aspectRatio` i `resolution` odzwierciedlają to, co zostało wysłane, a `details.normalization` zapisuje translację od wartości żądanej do zastosowanej.

Wejścia referencyjne również wybierają tryb działania:

- Brak mediów referencyjnych: `generate`
- Jakikolwiek obraz referencyjny: `imageToVideo`
- Jakikolwiek film referencyjny: `videoToVideo`
- Referencyjne wejścia audio nie zmieniają rozstrzygniętego trybu; są stosowane dodatkowo do trybu wybranego przez referencje obrazu/wideo i działają tylko z dostawcami, którzy deklarują `maxInputAudios`

Mieszane referencje obrazów i filmów nie stanowią stabilnej wspólnej powierzchni możliwości.
Najlepiej używać jednego typu referencji na żądanie.

#### Fallback i typowane opcje

Niektóre kontrole możliwości są stosowane na warstwie fallbacku, a nie na granicy
narzędzia, tak aby żądanie przekraczające limity głównego dostawcy
mogło nadal zostać uruchomione u obsługującego je fallbacku:

- Jeśli aktywny kandydat nie deklaruje `maxInputAudios` (lub deklaruje je jako
  `0`), jest pomijany, gdy żądanie zawiera referencje audio, i
  próbowany jest następny kandydat.
- Jeśli `maxDurationSeconds` aktywnego kandydata jest niższe od żądanego
  `durationSeconds`, a kandydat nie deklaruje listy
  `supportedDurationSeconds`, jest pomijany.
- Jeśli żądanie zawiera `providerOptions`, a aktywny kandydat
  jawnie deklaruje typowany schemat `providerOptions`, kandydat jest
  pomijany, gdy podane klucze nie należą do schematu lub typy wartości nie
  pasują. Dostawcy, którzy nie zadeklarowali jeszcze schematu, otrzymują
  opcje bez zmian (wstecznie zgodny pass-through). Dostawca może
  jawnie zrezygnować ze wszystkich opcji dostawcy, deklarując pusty schemat
  (`capabilities.providerOptions: {}`), co powoduje takie samo pominięcie jak
  niezgodność typu.

Pierwszy powód pominięcia w żądaniu jest logowany na poziomie `warn`, aby operatorzy widzieli,
kiedy główny dostawca został pominięty; kolejne pominięcia są logowane na poziomie
`debug`, aby długie łańcuchy fallbacków nie były zbyt hałaśliwe. Jeśli każdy kandydat zostanie pominięty,
zagregowany błąd zawiera powód pominięcia dla każdego z nich.

## Akcje

- **generate** (domyślnie) -- utwórz film na podstawie podanego promptu i opcjonalnych wejść referencyjnych.
- **status** -- sprawdź stan zadania generowania wideo będącego w toku dla bieżącej sesji bez uruchamiania kolejnego generowania.
- **list** -- pokaż dostępnych dostawców, modele i ich możliwości.

## Wybór modelu

Podczas generowania wideo OpenClaw rozstrzyga model w następującej kolejności:

1. **Parametr narzędzia `model`** -- jeśli agent poda go w wywołaniu.
2. **`videoGenerationModel.primary`** -- z konfiguracji.
3. **`videoGenerationModel.fallbacks`** -- próbowane po kolei.
4. **Automatyczne wykrywanie** -- używa dostawców z poprawnym uwierzytelnieniem, zaczynając od bieżącego domyślnego dostawcy, a następnie pozostałych dostawców w porządku alfabetycznym.

Jeśli dostawca zawiedzie, automatycznie próbowany jest następny kandydat. Jeśli zawiodą wszyscy kandydaci, błąd zawiera szczegóły każdej próby.

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

## Uwagi o dostawcach

| Dostawca             | Uwagi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba              | Używa asynchronicznego endpointu DashScope/Model Studio. Obrazy i filmy referencyjne muszą być zdalnymi adresami URL `http(s)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| BytePlus (1.0)       | Identyfikator dostawcy `byteplus`. Modele: `seedance-1-0-pro-250528` (domyślny), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`. Modele T2V (`*-t2v-*`) nie przyjmują wejść obrazów; modele I2V i ogólne modele `*-pro-*` obsługują pojedynczy obraz referencyjny (pierwszą klatkę). Przekaż obraz pozycyjnie albo ustaw `role: "first_frame"`. Identyfikatory modeli T2V są automatycznie przełączane na odpowiadający wariant I2V, gdy podany jest obraz. Obsługiwane klucze `providerOptions`: `seed` (number), `draft` (boolean, wymusza 480p), `camera_fixed` (boolean). |
| BytePlus Seedance 1.5 | Wymaga Plugin `[@openclaw/byteplus-modelark](https://www.npmjs.com/package/@openclaw/byteplus-modelark)`. Identyfikator dostawcy `byteplus-seedance15`. Model: `seedance-1-5-pro-251215`. Używa ujednoliconego API `content[]`. Obsługuje maksymalnie 2 obrazy wejściowe (first_frame + last_frame). Wszystkie wejścia muszą być zdalnymi adresami URL `https://`. Ustaw `role: "first_frame"` / `"last_frame"` dla każdego obrazu albo przekaż obrazy pozycyjnie. `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego. `audio: true` mapuje się na `generate_audio`. `providerOptions.seed` (number) jest przekazywane dalej. |
| BytePlus Seedance 2.0 | Wymaga Plugin `[@openclaw/byteplus-modelark](https://www.npmjs.com/package/@openclaw/byteplus-modelark)`. Identyfikator dostawcy `byteplus-seedance2`. Modele: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`. Używa ujednoliconego API `content[]`. Obsługuje do 9 obrazów referencyjnych, 3 filmów referencyjnych i 3 dźwięków referencyjnych. Wszystkie wejścia muszą być zdalnymi adresami URL `https://`. Ustaw `role` dla każdego zasobu — obsługiwane wartości: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`. `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego. `audio: true` mapuje się na `generate_audio`. `providerOptions.seed` (number) jest przekazywane dalej. |
| ComfyUI              | Lokalne lub chmurowe wykonanie sterowane przez workflow. Obsługuje text-to-video i image-to-video przez skonfigurowany graf.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| fal                  | Używa przepływu opartego na kolejce dla długotrwałych zadań. Tylko pojedynczy obraz referencyjny.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Google               | Używa Gemini/Veo. Obsługuje jeden obraz lub jeden film referencyjny.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| MiniMax              | Tylko pojedynczy obraz referencyjny.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| OpenAI               | Przekazywane dalej jest tylko nadpisanie `size`. Inne nadpisania stylu (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z ostrzeżeniem.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Qwen                 | Ten sam backend DashScope co Alibaba. Wejścia referencyjne muszą być zdalnymi adresami URL `http(s)`; pliki lokalne są odrzucane z góry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Runway               | Obsługuje pliki lokalne przez URI danych. Video-to-video wymaga `runway/gen4_aleph`. Uruchomienia tylko tekstowe udostępniają proporcje `16:9` i `9:16`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Together             | Tylko pojedynczy obraz referencyjny.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Vydra                | Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań usuwających uwierzytelnienie. `veo3` jest dołączony wyłącznie jako text-to-video; `kling` wymaga zdalnego URL obrazu.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| xAI                  | Obsługuje text-to-video, image-to-video oraz zdalne przepływy edycji/rozszerzania wideo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## Tryby możliwości dostawców

Wspólny kontrakt generowania wideo pozwala teraz dostawcom deklarować możliwości
specyficzne dla trybu zamiast wyłącznie płaskich zagregowanych limitów. Nowe implementacje
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
`generate`, `imageToVideo` i `videoToVideo`, aby testy live,
testy kontraktowe i współdzielone narzędzie `video_generate` mogły deterministycznie
walidować obsługę trybów.

## Testy live

Pokrycie live opt-in dla współdzielonych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media video
```

Ten plik live ładuje brakujące zmienne środowiskowe dostawców z `~/.profile`, domyślnie preferuje
klucze API live/env przed zapisanymi profilami uwierzytelniania i domyślnie uruchamia
bezpieczny dla wydań smoke test:

- `generate` dla każdego dostawcy w teście poza FAL
- jednosekundowy prompt z homarem
- limit operacji dla każdego dostawcy z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (domyślnie `180000`)

FAL jest opt-in, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania:

```bash
pnpm test:live:media video --video-providers fal
```

Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać także zadeklarowane tryby transformacji,
które wspólny test może bezpiecznie wykonywać z użyciem lokalnych mediów:

- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` oraz dostawca/model
  akceptuje lokalne wejście wideo oparte na buforze we wspólnym teście

Obecnie wspólna ścieżka live `videoToVideo` obejmuje:

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
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#agent-defaults)
- [Modele](/pl/concepts/models)
