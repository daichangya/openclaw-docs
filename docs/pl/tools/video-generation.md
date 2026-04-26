---
read_when:
    - Generowanie wideo przez agenta
    - Konfigurowanie dostawców i modeli generowania wideo
    - Zrozumienie parametrów narzędzia `video_generate`
sidebarTitle: Video generation
summary: Generowanie wideo przez `video_generate` z tekstu, obrazu lub odniesień do wideo w 14 zapleczach dostawców
title: Generowanie wideo
x-i18n:
    generated_at: "2026-04-26T11:44:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

Agenci OpenClaw mogą generować wideo na podstawie promptów tekstowych, obrazów
referencyjnych lub istniejących filmów. Obsługiwanych jest czternaście zapleczy
dostawców, z których każde ma różne opcje modeli, tryby wejścia i zestawy
funkcji. Agent automatycznie wybiera właściwego dostawcę na podstawie Twojej
konfiguracji i dostępnych kluczy API.

<Note>
Narzędzie `video_generate` pojawia się tylko wtedy, gdy dostępny jest co
najmniej jeden dostawca generowania wideo. Jeśli nie widzisz go w narzędziach
agenta, ustaw klucz API dostawcy lub skonfiguruj
`agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traktuje generowanie wideo jako trzy tryby działania w czasie
uruchomienia:

- `generate` — żądania text-to-video bez mediów referencyjnych.
- `imageToVideo` — żądanie zawiera co najmniej jeden obraz referencyjny.
- `videoToVideo` — żądanie zawiera co najmniej jeden film referencyjny.

Dostawcy mogą obsługiwać dowolny podzbiór tych trybów. Narzędzie waliduje
aktywny tryb przed wysłaniem i raportuje obsługiwane tryby w `action=list`.

## Szybki start

<Steps>
  <Step title="Skonfiguruj uwierzytelnianie">
    Ustaw klucz API dla dowolnego obsługiwanego dostawcy:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Wybierz model domyślny (opcjonalnie)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Poproś agenta">
    > Wygeneruj 5-sekundowe kinowe wideo przedstawiające przyjaznego homara surfującego o zachodzie słońca.

    Agent automatycznie wywołuje `video_generate`. Nie jest potrzebne
    dodawanie narzędzia do listy dozwolonych.

  </Step>
</Steps>

## Jak działa generowanie asynchroniczne

Generowanie wideo jest asynchroniczne. Gdy agent wywołuje `video_generate` w
sesji:

1. OpenClaw wysyła żądanie do dostawcy i natychmiast zwraca identyfikator zadania.
2. Dostawca przetwarza zadanie w tle (zwykle od 30 sekund do 5 minut w zależności od dostawcy i rozdzielczości).
3. Gdy wideo jest gotowe, OpenClaw wybudza tę samą sesję za pomocą wewnętrznego zdarzenia ukończenia.
4. Agent publikuje gotowe wideo z powrotem w oryginalnej rozmowie.

Gdy zadanie jest w toku, zduplikowane wywołania `video_generate` w tej samej
sesji zwracają bieżący stan zadania zamiast rozpoczynać kolejne
generowanie. Użyj `openclaw tasks list` lub `openclaw tasks show <taskId>`, aby
sprawdzić postęp z poziomu CLI.

Poza uruchomieniami agenta opartymi na sesji (na przykład bezpośrednimi wywołaniami narzędzia)
narzędzie przechodzi na generowanie inline i zwraca końcową ścieżkę do mediów
w tej samej turze.

Wygenerowane pliki wideo są zapisywane w zarządzanej przez OpenClaw pamięci
mediów, gdy dostawca zwraca bajty. Domyślny limit zapisu wygenerowanego wideo
jest zgodny z limitem mediów wideo, a `agents.defaults.mediaMaxMb` podnosi go
dla większych renderów. Gdy dostawca zwraca również hostowany adres URL
wyniku, OpenClaw może dostarczyć ten adres URL zamiast kończyć zadanie
błędem, jeśli lokalne utrwalanie odrzuci zbyt duży plik.

### Cykl życia zadania

| Stan        | Znaczenie                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Zadanie utworzone, oczekuje na przyjęcie przez dostawcę.                                         |
| `running`   | Dostawca przetwarza zadanie (zwykle od 30 sekund do 5 minut w zależności od dostawcy i rozdzielczości). |
| `succeeded` | Wideo gotowe; agent budzi się i publikuje je w rozmowie.                                         |
| `failed`    | Błąd dostawcy lub przekroczenie limitu czasu; agent budzi się z informacjami o błędzie.          |

Sprawdź stan z poziomu CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Jeśli zadanie wideo ma już stan `queued` lub `running` dla bieżącej sesji,
`video_generate` zwraca stan istniejącego zadania zamiast uruchamiać nowe.
Użyj `action: "status"`, aby sprawdzić to jawnie bez wyzwalania nowego
generowania.

## Obsługiwani dostawcy

| Dostawca              | Model domyślny                  | Tekst | Obraz referencyjny                                 | Wideo referencyjne                              | Uwierzytelnianie                         |
| --------------------- | ------------------------------- | :---: | -------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓    | Tak (zdalny URL)                                   | Tak (zdalny URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓    | Do 2 obrazów (tylko modele I2V; pierwsza i ostatnia klatka) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓    | Do 2 obrazów (pierwsza i ostatnia klatka przez rolę) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓    | Do 9 obrazów referencyjnych                        | Do 3 filmów                                     | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓    | 1 obraz                                            | —                                               | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓    | 1 obraz; do 9 z Seedance reference-to-video        | Do 3 filmów z Seedance reference-to-video       | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓    | 1 obraz                                            | 1 film                                          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓    | 1 obraz                                            | —                                               | `MINIMAX_API_KEY` lub MiniMax OAuth      |
| OpenAI                | `sora-2`                        |  ✓    | 1 obraz                                            | 1 film                                          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    |  ✓    | Tak (zdalny URL)                                   | Tak (zdalny URL)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓    | 1 obraz                                            | 1 film                                          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓    | 1 obraz                                            | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓    | 1 obraz (`kling`)                                  | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓    | 1 obraz pierwszej klatki lub do 7 `reference_image`s | 1 film                                        | `XAI_API_KEY`                            |

Niektórzy dostawcy akceptują dodatkowe lub alternatywne zmienne środowiskowe
kluczy API. Szczegóły znajdziesz na poszczególnych [stronach dostawców](#related).

Uruchom `video_generate action=list`, aby sprawdzić dostępnych dostawców, modele i
tryby działania w czasie uruchomienia.

### Macierz funkcji

Jawny kontrakt trybu używany przez `video_generate`, testy kontraktowe i
współdzielony zestaw live:

| Dostawca | `generate` | `imageToVideo` | `videoToVideo` | Współdzielone ścieżki live obecnie                                                                                                       |
| -------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                       |
| BytePlus |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  |     ✓      |       ✓        |       —        | Nie wchodzi do współdzielonego zestawu; pokrycie specyficzne dla przepływu pracy znajduje się przy testach Comfy                        |
| fal      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` tylko przy użyciu Seedance reference-to-video                                                 |
| Google   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ obecny zestaw Gemini/Veo oparty na buforach nie akceptuje tego wejścia |
| MiniMax  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; współdzielone `videoToVideo` pomijane, ponieważ ta ścieżka organizacji/wejścia wymaga obecnie dostępu do inpaint/remix po stronie dostawcy |
| Qwen     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga zdalnych URL-i wideo `http(s)`                       |
| Runway   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` działa tylko wtedy, gdy wybrany model to `runway/gen4_aleph`                                |
| Together |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra    |     ✓      |       ✓        |       —        | `generate`; współdzielone `imageToVideo` pomijane, ponieważ dołączony `veo3` jest tylko tekstowy, a dołączony `kling` wymaga zdalnego URL obrazu |
| xAI      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` pomijane, ponieważ ten dostawca wymaga obecnie zdalnego URL MP4                             |

## Parametry narzędzia

### Wymagane

<ParamField path="prompt" type="string" required>
  Tekstowy opis wideo do wygenerowania. Wymagany dla `action: "generate"`.
</ParamField>

### Dane wejściowe treści

<ParamField path="image" type="string">Pojedynczy obraz referencyjny (ścieżka lub URL).</ParamField>
<ParamField path="images" type="string[]">Wiele obrazów referencyjnych (do 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Opcjonalne wskazówki ról dla każdej pozycji równoległe do połączonej listy obrazów.
Wartości kanoniczne: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Pojedynczy film referencyjny (ścieżka lub URL).</ParamField>
<ParamField path="videos" type="string[]">Wiele filmów referencyjnych (do 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Opcjonalne wskazówki ról dla każdej pozycji równoległe do połączonej listy filmów.
Wartość kanoniczna: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Pojedyncze audio referencyjne (ścieżka lub URL). Używane do muzyki w tle lub
referencji głosowej, gdy dostawca obsługuje wejścia audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Wiele plików audio referencyjnych (do 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Opcjonalne wskazówki ról dla każdej pozycji równoległe do połączonej listy plików audio.
Wartość kanoniczna: `reference_audio`.
</ParamField>

<Note>
Wskazówki ról są przekazywane do dostawcy bez zmian. Wartości kanoniczne pochodzą
z unii `VideoGenerationAssetRole`, ale dostawcy mogą akceptować dodatkowe
ciągi ról. Tablice `*Roles` nie mogą mieć więcej wpisów niż odpowiadająca im
lista odniesień; błędy typu off-by-one kończą się jasnym komunikatem.
Użyj pustego ciągu, aby pozostawić pozycję nieustawioną. W przypadku xAI ustaw każdą rolę obrazu na
`reference_image`, aby użyć trybu generowania `reference_images`; pomiń rolę
albo użyj `first_frame` dla image-to-video z pojedynczym obrazem.
</Note>

### Ustawienia stylu

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` lub `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` lub `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Docelowy czas trwania w sekundach (zaokrąglany do najbliższej wartości obsługiwanej przez dostawcę).
</ParamField>
<ParamField path="size" type="string">Wskazówka rozmiaru, gdy dostawca ją obsługuje.</ParamField>
<ParamField path="audio" type="boolean">
  Włącza generowane audio w wyniku, gdy jest obsługiwane. To coś innego niż `audioRef*` (wejścia).
</ParamField>
<ParamField path="watermark" type="boolean">Przełącza znak wodny dostawcy, gdy jest obsługiwany.</ParamField>

`adaptive` to wartość specjalna zależna od dostawcy: jest przekazywana bez zmian do
dostawców, którzy deklarują `adaptive` w swoich funkcjach (np. BytePlus
Seedance używa jej do automatycznego wykrywania proporcji na podstawie
wymiarów obrazu wejściowego). Dostawcy, którzy jej nie deklarują, pokazują tę wartość w
`details.ignoredOverrides` w wyniku narzędzia, aby pominięcie było widoczne.

### Zaawansowane

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` zwraca bieżące zadanie sesji; `"list"` sprawdza dostawców.
</ParamField>
<ParamField path="model" type="string">Zastąpienie dostawcy/modelu (np. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu żądania do dostawcy w milisekundach.</ParamField>
<ParamField path="providerOptions" type="object">
  Opcje specyficzne dla dostawcy jako obiekt JSON (np. `{"seed": 42, "draft": true}`).
  Dostawcy, którzy deklarują typowany schemat, walidują klucze i typy; nieznane
  klucze lub niedopasowania powodują pominięcie kandydata podczas przełączania awaryjnego. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian. Uruchom `video_generate action=list`,
  aby zobaczyć, co akceptuje każdy dostawca.
</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw normalizuje czas trwania do
najbliższej wartości obsługiwanej przez dostawcę i mapuje przetłumaczone wskazówki geometrii,
takie jak size-to-aspect-ratio, gdy zapasowy dostawca udostępnia inną
powierzchnię sterowania. Naprawdę nieobsługiwane zastąpienia są ignorowane na zasadzie best effort
i zgłaszane jako ostrzeżenia w wyniku narzędzia. Twarde ograniczenia funkcji
(takie jak zbyt wiele wejść referencyjnych) kończą się błędem przed wysłaniem. Wyniki narzędzia
raportują zastosowane ustawienia; `details.normalization` przechwytuje każde
przetłumaczenie od wartości żądanej do zastosowanej.
</Note>

Wejścia referencyjne wybierają tryb działania:

- Brak mediów referencyjnych → `generate`
- Dowolne odniesienie do obrazu → `imageToVideo`
- Dowolne odniesienie do wideo → `videoToVideo`
- Wejścia audio referencyjnego **nie** zmieniają rozstrzygniętego trybu; są stosowane
  na wierzchu trybu wybranego przez odniesienia do obrazu/wideo i działają tylko
  z dostawcami deklarującymi `maxInputAudios`.

Mieszane odniesienia do obrazów i wideo nie tworzą stabilnej współdzielonej powierzchni funkcji.
Preferuj jeden typ odniesienia na żądanie.

#### Przełączanie awaryjne i typowane opcje

Niektóre sprawdzenia funkcji są stosowane na warstwie przełączania awaryjnego, a nie na granicy
narzędzia, więc żądanie przekraczające limity głównego dostawcy może
nadal działać na zdolnym dostawcy zapasowym:

- Aktywny kandydat, który nie deklaruje `maxInputAudios` (lub deklaruje `0`), jest pomijany, gdy
  żądanie zawiera odniesienia audio; próbowany jest następny kandydat.
- `maxDurationSeconds` aktywnego kandydata jest niższe niż żądane `durationSeconds`,
  a brak zadeklarowanej listy `supportedDurationSeconds` → kandydat jest pomijany.
- Żądanie zawiera `providerOptions`, a aktywny kandydat jawnie
  deklaruje typowany schemat `providerOptions` → kandydat jest pomijany, jeśli podane
  klucze nie znajdują się w schemacie lub typy wartości nie pasują. Dostawcy bez
  zadeklarowanego schematu otrzymują opcje bez zmian (zgodny wstecznie
  pass-through). Dostawca może zrezygnować ze wszystkich opcji dostawcy,
  deklarując pusty schemat (`capabilities.providerOptions: {}`), co
  powoduje takie samo pominięcie jak niedopasowanie typu.

Pierwszy powód pominięcia w żądaniu jest logowany na poziomie `warn`, aby operatorzy widzieli, kiedy
ich główny dostawca został pominięty; kolejne pominięcia są logowane na `debug`, aby
długie łańcuchy przełączania awaryjnego pozostawały ciche. Jeśli każdy kandydat zostanie pominięty,
zagregowany błąd zawiera powód pominięcia dla każdego z nich.

## Akcje

| Akcja      | Co robi                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `generate` | Domyślnie. Tworzy wideo na podstawie podanego promptu i opcjonalnych wejść referencyjnych.             |
| `status`   | Sprawdza stan zadania wideo w toku dla bieżącej sesji bez uruchamiania kolejnego generowania.          |
| `list`     | Pokazuje dostępnych dostawców, modele i ich funkcje.                                                    |

## Wybór modelu

OpenClaw rozstrzyga model w tej kolejności:

1. **Parametr narzędzia `model`** — jeśli agent określi go w wywołaniu.
2. **`videoGenerationModel.primary`** z konfiguracji.
3. **`videoGenerationModel.fallbacks`** po kolei.
4. **Automatyczne wykrywanie** — dostawcy z prawidłowym uwierzytelnianiem, zaczynając od
   bieżącego dostawcy domyślnego, a następnie pozostali dostawcy w kolejności
   alfabetycznej.

Jeśli dostawca zakończy się błędem, automatycznie próbowany jest następny kandydat. Jeśli wszyscy
kandydaci zawiodą, błąd zawiera szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać
tylko jawnych wpisów `model`, `primary` i `fallbacks`.

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

<AccordionGroup>
  <Accordion title="Alibaba">
    Używa asynchronicznego punktu końcowego DashScope / Model Studio. Obrazy i
    filmy referencyjne muszą być zdalnymi URL-ami `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Identyfikator dostawcy: `byteplus`.

    Modele: `seedance-1-0-pro-250528` (domyślny),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Modele T2V (`*-t2v-*`) nie akceptują wejść obrazów; modele I2V i
    ogólne modele `*-pro-*` obsługują pojedynczy obraz referencyjny (pierwszą
    klatkę). Przekaż obraz pozycyjnie albo ustaw `role: "first_frame"`.
    Identyfikatory modeli T2V są automatycznie przełączane na odpowiadający wariant I2V,
    gdy podano obraz.

    Obsługiwane klucze `providerOptions`: `seed` (liczba), `draft` (boolean —
    wymusza 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Wymaga Pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Identyfikator dostawcy: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Używa zunifikowanego API `content[]`. Obsługuje maksymalnie 2 obrazy wejściowe
    (`first_frame` + `last_frame`). Wszystkie wejścia muszą być zdalnymi URL-ami `https://`.
    Ustaw `role: "first_frame"` / `"last_frame"` dla każdego obrazu albo
    przekazuj obrazy pozycyjnie.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (liczba) jest przekazywane dalej.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Wymaga Pluginu [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Identyfikator dostawcy: `byteplus-seedance2`. Modele:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Używa zunifikowanego API `content[]`. Obsługuje do 9 obrazów referencyjnych,
    3 filmów referencyjnych i 3 plików audio referencyjnych. Wszystkie wejścia muszą być zdalnymi
    URL-ami `https://`. Ustaw `role` dla każdego zasobu — obsługiwane wartości:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` automatycznie wykrywa proporcje z obrazu wejściowego.
    `audio: true` mapuje się na `generate_audio`. `providerOptions.seed`
    (liczba) jest przekazywane dalej.

  </Accordion>
  <Accordion title="ComfyUI">
    Lokalne lub chmurowe wykonywanie oparte na przepływie pracy. Obsługuje text-to-video i
    image-to-video przez skonfigurowany graf.
  </Accordion>
  <Accordion title="fal">
    Używa przepływu opartego na kolejce dla długotrwałych zadań. Większość modeli wideo fal
    akceptuje pojedynczy obraz referencyjny. Modele
    Seedance 2.0 reference-to-video akceptują do 9 obrazów, 3 filmy i 3 odniesienia audio, z
    maksymalnie 12 plikami referencyjnymi łącznie.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Obsługuje jedno odniesienie do obrazu lub jedno odniesienie do wideo.
  </Accordion>
  <Accordion title="MiniMax">
    Tylko pojedynczy obraz referencyjny.
  </Accordion>
  <Accordion title="OpenAI">
    Przekazywane jest tylko zastąpienie `size`. Inne zastąpienia stylu
    (`aspectRatio`, `resolution`, `audio`, `watermark`) są ignorowane z
    ostrzeżeniem.
  </Accordion>
  <Accordion title="Qwen">
    To samo zaplecze DashScope co Alibaba. Wejścia referencyjne muszą być zdalnymi
    URL-ami `http(s)`; pliki lokalne są odrzucane z góry.
  </Accordion>
  <Accordion title="Runway">
    Obsługuje pliki lokalne przez URI danych. Video-to-video wymaga
    `runway/gen4_aleph`. Uruchomienia wyłącznie tekstowe udostępniają proporcje `16:9` i `9:16`.
  </Accordion>
  <Accordion title="Together">
    Tylko pojedynczy obraz referencyjny.
  </Accordion>
  <Accordion title="Vydra">
    Używa bezpośrednio `https://www.vydra.ai/api/v1`, aby uniknąć przekierowań
    gubiących uwierzytelnianie. `veo3` jest dołączony tylko jako text-to-video; `kling` wymaga
    zdalnego URL obrazu.
  </Accordion>
  <Accordion title="xAI">
    Obsługuje text-to-video, image-to-video z pojedynczą pierwszą klatką, do 7
    wejść `reference_image` przez xAI `reference_images` oraz zdalne
    przepływy edycji/rozszerzania wideo.
  </Accordion>
</AccordionGroup>

## Tryby funkcji dostawcy

Współdzielony kontrakt generowania wideo obsługuje funkcje specyficzne dla trybu
zamiast wyłącznie płaskich zagregowanych limitów. Nowe implementacje dostawców
powinny preferować jawne bloki trybów:

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
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
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

Płaskie pola zagregowane, takie jak `maxInputImages` i `maxInputVideos`, są
**niewystarczające**, aby ogłaszać obsługę trybu transformacji. Dostawcy powinni
jawnie deklarować `generate`, `imageToVideo` i `videoToVideo`, aby testy live,
testy kontraktowe i współdzielone narzędzie `video_generate` mogły deterministycznie
walidować obsługę trybów.

Gdy jeden model u dostawcy ma szerszą obsługę wejść referencyjnych niż
pozostałe, użyj `maxInputImagesByModel`, `maxInputVideosByModel` lub
`maxInputAudiosByModel` zamiast podnosić limit dla całego trybu.

## Testy live

Obsługa live typu opt-in dla współdzielonych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media video
```

Ten plik live ładuje brakujące zmienne środowiskowe dostawców z `~/.profile`, preferuje
klucze API live/env zamiast zapisanych profili uwierzytelniania i domyślnie uruchamia
bezpieczny dla wydań smoke test:

- `generate` dla każdego dostawcy innego niż FAL w zestawie.
- Jednosekundowy prompt z homarem.
- Limit operacji dla każdego dostawcy z
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`).

FAL jest typu opt-in, ponieważ opóźnienie kolejki po stronie dostawcy może
zdominować czas wydania:

```bash
pnpm test:live:media video --video-providers fal
```

Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać również zadeklarowane
tryby transformacji, które współdzielony zestaw może bezpiecznie wykonać z mediami lokalnymi:

- `imageToVideo`, gdy `capabilities.imageToVideo.enabled`.
- `videoToVideo`, gdy `capabilities.videoToVideo.enabled` i
  dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym
  zestawie.

Obecnie współdzielona ścieżka live `videoToVideo` obejmuje `runway` tylko wtedy, gdy
wybierzesz `runway/gen4_aleph`.

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

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Zadania w tle](/pl/automation/tasks) — śledzenie zadań dla asynchronicznego generowania wideo
- [BytePlus](/pl/concepts/model-providers#byteplus-international)
- [ComfyUI](/pl/providers/comfy)
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults)
- [fal](/pl/providers/fal)
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Modele](/pl/concepts/models)
- [OpenAI](/pl/providers/openai)
- [Qwen](/pl/providers/qwen)
- [Runway](/pl/providers/runway)
- [Together AI](/pl/providers/together)
- [Przegląd narzędzi](/pl/tools)
- [Vydra](/pl/providers/vydra)
- [xAI](/pl/providers/xai)
