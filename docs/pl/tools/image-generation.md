---
read_when:
    - Generowanie obrazów za pośrednictwem agenta
    - Konfigurowanie dostawców i modeli generowania obrazów
    - Omówienie parametrów narzędzia `image_generate`
summary: Generuj i edytuj obrazy przy użyciu skonfigurowanych dostawców (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-04-23T13:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fbd8eda2cb0867d1426b9349f6778c231051d600ebe451534efbee0e215c871
    source_path: tools/image-generation.md
    workflow: 15
---

# Generowanie obrazów

Narzędzie `image_generate` pozwala agentowi tworzyć i edytować obrazy przy użyciu skonfigurowanych dostawców. Wygenerowane obrazy są dostarczane automatycznie jako załączniki multimedialne w odpowiedzi agenta.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach agenta, skonfiguruj `agents.defaults.imageGenerationModel` lub ustaw klucz API dostawcy.
</Note>

## Szybki start

1. Ustaw klucz API dla co najmniej jednego dostawcy (na przykład `OPENAI_API_KEY` lub `GEMINI_API_KEY`).
2. Opcjonalnie ustaw preferowany model:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

3. Poproś agenta: _„Wygeneruj obraz przyjaznej maskotki homara.”_

Agent wywoła `image_generate` automatycznie. Nie trzeba dodawać go do listy dozwolonych narzędzi — jest włączone domyślnie, gdy dostawca jest dostępny.

## Obsługiwani dostawcy

| Dostawca | Model domyślny                   | Obsługa edycji                     | Klucz API                                              |
| -------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                    | Tak (do 5 obrazów)                 | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Tak                                | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | Tak                                | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Tak (odniesienie do obiektu)       | `MINIMAX_API_KEY` lub OAuth MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Tak (1 obraz, zależnie od workflow) | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla chmury   |
| Vydra    | `grok-imagine`                   | Nie                                | `VYDRA_API_KEY`                                        |
| xAI      | `grok-imagine-image`             | Tak (do 5 obrazów)                 | `XAI_API_KEY`                                          |

Użyj `action: "list"`, aby sprawdzić dostępnych dostawców i modele w czasie działania:

```
/tool image_generate action=list
```

## Parametry narzędzia

| Parametr      | Typ      | Opis                                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt generowania obrazu (wymagany dla `action: "generate"`)                         |
| `action`      | string   | `"generate"` (domyślnie) lub `"list"` do sprawdzenia dostawców                        |
| `model`       | string   | Nadpisanie dostawcy/modelu, np. `openai/gpt-image-2`                                  |
| `image`       | string   | Ścieżka lub URL pojedynczego obrazu referencyjnego dla trybu edycji                   |
| `images`      | string[] | Wiele obrazów referencyjnych dla trybu edycji (do 5)                                  |
| `size`        | string   | Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`   |
| `aspectRatio` | string   | Proporcje: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`   |
| `resolution`  | string   | Wskazówka rozdzielczości: `1K`, `2K` lub `4K`                                          |
| `count`       | number   | Liczba obrazów do wygenerowania (1–4)                                                 |
| `filename`    | string   | Wskazówka nazwy pliku                                                                 |

Nie wszyscy dostawcy obsługują wszystkie parametry. Gdy zapasowy dostawca obsługuje zbliżoną opcję geometrii zamiast dokładnie żądanej, OpenClaw przed wysłaniem mapuje ją na najbliższy obsługiwany rozmiar, proporcje lub rozdzielczość. Faktycznie nieobsługiwane nadpisania są nadal zgłaszane w wyniku narzędzia.

Wyniki narzędzia pokazują zastosowane ustawienia. Gdy OpenClaw mapuje geometrię podczas przełączania na zapasowego dostawcę, zwracane wartości `size`, `aspectRatio` i `resolution` odzwierciedlają to, co faktycznie zostało wysłane, a `details.normalization` zawiera mapowanie od wartości żądanej do zastosowanej.

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Kolejność wyboru dostawcy

Podczas generowania obrazu OpenClaw próbuje dostawców w tej kolejności:

1. Parametr **`model`** z wywołania narzędzia (jeśli agent go poda)
2. **`imageGenerationModel.primary`** z konfiguracji
3. **`imageGenerationModel.fallbacks`** w podanej kolejności
4. **Automatyczne wykrywanie** — używa tylko domyślnych ustawień dostawców opartych na uwierzytelnieniu:
   - najpierw bieżący domyślny dostawca
   - pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców

Jeśli dostawca zawiedzie (błąd uwierzytelnienia, limit szybkości itp.), automatycznie zostanie wypróbowany następny kandydat. Jeśli zawiodą wszyscy, błąd będzie zawierał szczegóły z każdej próby.

Uwagi:

- Automatyczne wykrywanie uwzględnia uwierzytelnienie. Ustawienie domyślne dostawcy trafia na listę kandydatów tylko wtedy, gdy OpenClaw może rzeczywiście uwierzytelnić tego dostawcę.
- Automatyczne wykrywanie jest domyślnie włączone. Ustaw
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz, aby generowanie obrazów używało tylko jawnych wpisów
  `model`, `primary` i `fallbacks`.
- Użyj `action: "list"`, aby sprawdzić aktualnie zarejestrowanych dostawców, ich
  modele domyślne i wskazówki dotyczące zmiennych środowiskowych dla uwierzytelniania.

### Edytowanie obrazów

OpenAI, Google, fal, MiniMax, ComfyUI i xAI obsługują edytowanie obrazów referencyjnych. Przekaż ścieżkę lub URL obrazu referencyjnego:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, Google i xAI obsługują do 5 obrazów referencyjnych za pomocą parametru `images`. fal, MiniMax i ComfyUI obsługują 1.

### OpenAI `gpt-image-2`

Generowanie obrazów w OpenAI domyślnie używa `openai/gpt-image-2`. Starszy
model `openai/gpt-image-1` nadal można wybrać jawnie, ale nowe żądania OpenAI
dotyczące generowania i edytowania obrazów powinny używać `gpt-image-2`.

`gpt-image-2` obsługuje zarówno generowanie obrazu z tekstu, jak i edytowanie
obrazu referencyjnego przez to samo narzędzie `image_generate`. OpenClaw przekazuje do OpenAI `prompt`,
`count`, `size` oraz obrazy referencyjne. OpenAI nie otrzymuje bezpośrednio
`aspectRatio` ani `resolution`; gdy to możliwe, OpenClaw mapuje je na obsługiwany `size`,
a w przeciwnym razie narzędzie zgłasza je jako zignorowane nadpisania.

Wygeneruj jeden obraz krajobrazowy 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Wygeneruj dwa kwadratowe obrazy:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Edytuj jeden lokalny obraz referencyjny:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Edytuj przy użyciu wielu obrazów referencyjnych:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Aby kierować generowanie obrazów OpenAI przez wdrożenie Azure OpenAI zamiast
`api.openai.com`, zobacz [Punkty końcowe Azure OpenAI](/pl/providers/openai#azure-openai-endpoints)
w dokumentacji dostawcy OpenAI.

Generowanie obrazów MiniMax jest dostępne przez obie dołączone ścieżki uwierzytelniania MiniMax:

- `minimax/image-01` dla konfiguracji z kluczem API
- `minimax-portal/image-01` dla konfiguracji z OAuth

## Możliwości dostawców

| Możliwość            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generowanie          | Tak (do 4)           | Tak (do 4)           | Tak (do 4)          | Tak (do 9)                 | Tak (wyniki zdefiniowane przez workflow) | Tak (1) | Tak (do 4)           |
| Edycja/referencja    | Tak (do 5 obrazów)   | Tak (do 5 obrazów)   | Tak (1 obraz)       | Tak (1 obraz, odniesienie do obiektu) | Tak (1 obraz, zależnie od workflow) | Nie     | Tak (do 5 obrazów)   |
| Kontrola rozmiaru    | Tak (do 4K)          | Tak                  | Tak                 | Nie                        | Nie                                 | Nie     | Nie                   |
| Proporcje            | Nie                  | Tak                  | Tak (tylko generowanie) | Tak                     | Nie                                 | Nie     | Tak                  |
| Rozdzielczość (1K/2K/4K) | Nie              | Tak                  | Tak                 | Nie                        | Nie                                 | Nie     | Tak (1K/2K)          |

### xAI `grok-imagine-image`

Dołączony dostawca xAI używa `/v1/images/generations` dla żądań zawierających wyłącznie prompt
oraz `/v1/images/edits`, gdy obecne jest `image` lub `images`.

- Modele: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Liczba: do 4
- Referencje: jedno `image` lub do pięciu `images`
- Proporcje: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Rozdzielczości: `1K`, `2K`
- Wyniki: zwracane jako załączniki obrazów zarządzane przez OpenClaw

OpenClaw celowo nie udostępnia natywnych dla xAI parametrów `quality`, `mask`, `user` ani
dodatkowych natywnych proporcji, dopóki te ustawienia nie będą dostępne we wspólnym
międzydostawcowym kontrakcie `image_generate`.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [fal](/pl/providers/fal) — konfiguracja dostawcy obrazów i wideo fal
- [ComfyUI](/pl/providers/comfy) — konfiguracja lokalnego workflow ComfyUI i Comfy Cloud
- [Google (Gemini)](/pl/providers/google) — konfiguracja dostawcy obrazów Gemini
- [MiniMax](/pl/providers/minimax) — konfiguracja dostawcy obrazów MiniMax
- [OpenAI](/pl/providers/openai) — konfiguracja dostawcy OpenAI Images
- [Vydra](/pl/providers/vydra) — konfiguracja obrazów, wideo i mowy Vydra
- [xAI](/pl/providers/xai) — konfiguracja Grok dla obrazów, wideo, wyszukiwania, wykonywania kodu i TTS
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#agent-defaults) — konfiguracja `imageGenerationModel`
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
