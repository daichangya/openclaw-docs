---
read_when:
    - Generowanie obrazów przez agenta
    - Konfigurowanie dostawców i modeli generowania obrazów
    - Zrozumienie parametrów narzędzia `image_generate`
summary: Generuj i edytuj obrazy przy użyciu skonfigurowanych dostawców (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-04-23T10:09:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# Generowanie obrazów

Narzędzie `image_generate` pozwala agentowi tworzyć i edytować obrazy przy użyciu skonfigurowanych dostawców. Wygenerowane obrazy są automatycznie dostarczane jako załączniki multimedialne w odpowiedzi agenta.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach agenta, skonfiguruj `agents.defaults.imageGenerationModel` albo ustaw klucz API dostawcy.
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

Agent automatycznie wywoła `image_generate`. Nie trzeba dodawać go do allowlisty narzędzi — jest domyślnie włączone, gdy dostawca jest dostępny.

## Obsługiwani dostawcy

| Dostawca | Model domyślny                  | Obsługa edycji                     | Klucz API                                              |
| -------- | ------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                   | Tak (do 5 obrazów)                 | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Tak                               | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`               | Tak                                | `FAL_KEY`                                              |
| MiniMax  | `image-01`                      | Tak (obraz referencyjny obiektu)   | `MINIMAX_API_KEY` lub MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                      | Tak (1 obraz, konfigurowany przez workflow) | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla chmury |
| Vydra    | `grok-imagine`                  | Nie                                | `VYDRA_API_KEY`                                        |
| xAI      | `grok-imagine-image`            | Tak (do 5 obrazów)                 | `XAI_API_KEY`                                          |

Użyj `action: "list"`, aby sprawdzić dostępnych dostawców i modele w runtime:

```
/tool image_generate action=list
```

## Parametry narzędzia

| Parametr      | Typ      | Opis                                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt generowania obrazu (wymagany dla `action: "generate"`)                         |
| `action`      | string   | `"generate"` (domyślnie) albo `"list"` do sprawdzania dostawców                      |
| `model`       | string   | Nadpisanie dostawcy/modelu, np. `openai/gpt-image-2`                                  |
| `image`       | string   | Ścieżka lub URL pojedynczego obrazu referencyjnego dla trybu edycji                   |
| `images`      | string[] | Wiele obrazów referencyjnych dla trybu edycji (do 5)                                  |
| `size`        | string   | Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`   |
| `aspectRatio` | string   | Proporcje obrazu: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Wskazówka rozdzielczości: `1K`, `2K` lub `4K`                                         |
| `count`       | number   | Liczba obrazów do wygenerowania (1–4)                                                 |
| `filename`    | string   | Wskazówka nazwy pliku wyjściowego                                                      |

Nie wszyscy dostawcy obsługują wszystkie parametry. Gdy zapasowy dostawca obsługuje pobliską opcję geometrii zamiast dokładnie żądanej, OpenClaw przed wysłaniem mapuje ją na najbliższy obsługiwany rozmiar, proporcje obrazu lub rozdzielczość. Naprawdę nieobsługiwane nadpisania są nadal raportowane w wyniku narzędzia.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw mapuje geometrię podczas fallbacku dostawcy, zwracane wartości `size`, `aspectRatio` i `resolution` odzwierciedlają to, co faktycznie zostało wysłane, a `details.normalization` zapisuje translację od wartości żądanej do zastosowanej.

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
3. **`imageGenerationModel.fallbacks`** w kolejności
4. **Autowykrywanie** — używa tylko domyślnych dostawców opartych na uwierzytelnianiu:
   - najpierw bieżący domyślny dostawca
   - pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców

Jeśli dostawca zawiedzie (błąd uwierzytelniania, limit szybkości itd.), automatycznie próbowany jest kolejny kandydat. Jeśli zawiodą wszyscy, błąd zawiera szczegóły każdej próby.

Uwagi:

- Autowykrywanie uwzględnia uwierzytelnianie. Domyślny dostawca trafia na listę kandydatów
  tylko wtedy, gdy OpenClaw może się faktycznie u niego uwierzytelnić.
- Autowykrywanie jest włączone domyślnie. Ustaw
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz, aby generowanie obrazów używało tylko jawnych wpisów `model`, `primary` i `fallbacks`.
- Użyj `action: "list"`, aby sprawdzić aktualnie zarejestrowanych dostawców, ich
  modele domyślne oraz wskazówki o zmiennych środowiskowych uwierzytelniania.

### Edycja obrazów

OpenAI, Google, fal, MiniMax, ComfyUI i xAI obsługują edycję obrazów referencyjnych. Przekaż ścieżkę lub URL obrazu referencyjnego:

```
"Wygeneruj akwarelową wersję tego zdjęcia" + image: "/path/to/photo.jpg"
```

OpenAI, Google i xAI obsługują do 5 obrazów referencyjnych przez parametr `images`. fal, MiniMax i ComfyUI obsługują 1.

### OpenAI `gpt-image-2`

Generowanie obrazów OpenAI domyślnie używa `openai/gpt-image-2`. Starszy
model `openai/gpt-image-1` nadal można wybrać jawnie, ale nowe żądania OpenAI
generowania i edycji obrazów powinny używać `gpt-image-2`.

`gpt-image-2` obsługuje zarówno generowanie text-to-image, jak i edycję obrazu
referencyjnego przez to samo narzędzie `image_generate`. OpenClaw przekazuje do OpenAI `prompt`,
`count`, `size` i obrazy referencyjne. OpenAI nie otrzymuje bezpośrednio
`aspectRatio` ani `resolution`; gdy to możliwe, OpenClaw mapuje je na
obsługiwany `size`, w przeciwnym razie narzędzie zgłasza je jako zignorowane nadpisania.

Wygeneruj jeden obraz poziomy 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Wygeneruj dwa obrazy kwadratowe:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Edytuj jeden lokalny obraz referencyjny:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Edytuj z wieloma odniesieniami:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Generowanie obrazów MiniMax jest dostępne przez obie bundled ścieżki uwierzytelniania MiniMax:

- `minimax/image-01` dla konfiguracji z kluczem API
- `minimax-portal/image-01` dla konfiguracji z OAuth

## Możliwości dostawców

| Możliwość              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| ---------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generowanie            | Tak (do 4)           | Tak (do 4)           | Tak (do 4)          | Tak (do 9)                 | Tak (wyniki zdefiniowane przez workflow) | Tak (1) | Tak (do 4)       |
| Edycja/referencja      | Tak (do 5 obrazów)   | Tak (do 5 obrazów)   | Tak (1 obraz)       | Tak (1 obraz, referencja obiektu) | Tak (1 obraz, konfigurowany przez workflow) | Nie | Tak (do 5 obrazów) |
| Sterowanie rozmiarem   | Tak (do 4K)          | Tak                  | Tak                 | Nie                        | Nie                                 | Nie     | Nie                  |
| Proporcje obrazu       | Nie                  | Tak                  | Tak (tylko generowanie) | Tak                     | Nie                                 | Nie     | Tak                  |
| Rozdzielczość (1K/2K/4K) | Nie                | Tak                  | Tak                 | Nie                        | Nie                                 | Nie     | Tak (1K/2K)          |

### xAI `grok-imagine-image`

Bundled dostawca xAI używa `/v1/images/generations` dla żądań zawierających tylko prompt
oraz `/v1/images/edits`, gdy obecne jest `image` lub `images`.

- Modele: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Liczba: do 4
- Odniesienia: jedno `image` albo do pięciu `images`
- Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Rozdzielczości: `1K`, `2K`
- Wyniki: zwracane jako załączniki obrazów zarządzane przez OpenClaw

OpenClaw celowo nie udostępnia natywnych dla xAI opcji `quality`, `mask`, `user` ani
dodatkowych natywnych proporcji obrazu, dopóki te kontrolki nie pojawią się we współdzielonym
międzydostawcowym kontrakcie `image_generate`.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [fal](/pl/providers/fal) — konfiguracja dostawcy obrazów i wideo fal
- [ComfyUI](/pl/providers/comfy) — konfiguracja workflow lokalnego ComfyUI i Comfy Cloud
- [Google (Gemini)](/pl/providers/google) — konfiguracja dostawcy obrazów Gemini
- [MiniMax](/pl/providers/minimax) — konfiguracja dostawcy obrazów MiniMax
- [OpenAI](/pl/providers/openai) — konfiguracja dostawcy OpenAI Images
- [Vydra](/pl/providers/vydra) — konfiguracja obrazów, wideo i mowy Vydra
- [xAI](/pl/providers/xai) — konfiguracja obrazów, wideo, wyszukiwania, wykonywania kodu i TTS Grok
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#agent-defaults) — konfiguracja `imageGenerationModel`
- [Modele](/pl/concepts/models) — konfiguracja modeli i failover
