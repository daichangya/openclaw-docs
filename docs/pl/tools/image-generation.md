---
read_when:
    - Generowanie obrazów przez agenta
    - Konfigurowanie dostawców i modeli generowania obrazów
    - Zrozumienie parametrów narzędzia `image_generate`
summary: Generuj i edytuj obrazy przy użyciu skonfigurowanych dostawców (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-04-25T13:59:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

Narzędzie `image_generate` pozwala agentowi tworzyć i edytować obrazy przy użyciu skonfigurowanych dostawców. Wygenerowane obrazy są automatycznie dostarczane jako załączniki multimedialne w odpowiedzi agenta.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach swojego agenta, skonfiguruj `agents.defaults.imageGenerationModel`, ustaw klucz API dostawcy albo zaloguj się przez OpenAI Codex OAuth.
</Note>

## Szybki start

1. Ustaw klucz API dla co najmniej jednego dostawcy (na przykład `OPENAI_API_KEY`, `GEMINI_API_KEY` albo `OPENROUTER_API_KEY`) albo zaloguj się przez OpenAI Codex OAuth.
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

Codex OAuth używa tego samego odwołania do modelu `openai/gpt-image-2`. Gdy
skonfigurowany jest profil OAuth `openai-codex`, OpenClaw kieruje żądania obrazów
przez ten sam profil OAuth zamiast najpierw próbować `OPENAI_API_KEY`.
Jawna niestandardowa konfiguracja obrazu `models.providers.openai`, taka jak klucz API lub
niestandardowy/bazowy URL Azure, ponownie włącza bezpośrednią trasę OpenAI Images API.
Dla endpointów OpenAI-compatible w sieci LAN, takich jak LocalAI, zachowaj niestandardowe
`models.providers.openai.baseUrl` i jawnie włącz zgodę przez
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; prywatne/wewnętrzne
endpointy obrazów pozostają domyślnie blokowane.

3. Poproś agenta: _„Wygeneruj obraz przyjaznej maskotki robota.”_

Agent wywołuje `image_generate` automatycznie. Nie trzeba dodawać go do listy dozwolonych narzędzi — jest domyślnie włączone, gdy dostawca jest dostępny.

## Typowe ścieżki

| Cel                                                  | Odwołanie do modelu                                | Auth                                |
| ---------------------------------------------------- | -------------------------------------------------- | ----------------------------------- |
| Generowanie obrazów OpenAI z rozliczaniem API        | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                    |
| Generowanie obrazów OpenAI z auth subskrypcji Codex  | `openai/gpt-image-2`                               | OpenAI Codex OAuth                  |
| Generowanie obrazów OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                |
| Generowanie obrazów Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` lub `GOOGLE_API_KEY` |

To samo narzędzie `image_generate` obsługuje generowanie tekst-do-obrazu i
edycję z obrazem referencyjnym. Użyj `image` dla jednego odwołania albo `images` dla wielu odwołań.
Obsługiwane przez dostawcę wskazówki wyjściowe, takie jak `quality`, `outputFormat` i
specyficzne dla OpenAI `background`, są przekazywane tam, gdzie to możliwe, i zgłaszane jako
zignorowane, gdy dostawca ich nie obsługuje.

## Obsługiwani dostawcy

| Dostawca  | Model domyślny                          | Obsługa edycji                     | Auth                                                  |
| --------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI    | `gpt-image-2`                           | Tak (do 4 obrazów)                 | `OPENAI_API_KEY` lub OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Tak (do 5 obrazów wejściowych)    | `OPENROUTER_API_KEY`                                  |
| Google    | `gemini-3.1-flash-image-preview`        | Tak                                | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                 |
| fal       | `fal-ai/flux/dev`                       | Tak                                | `FAL_KEY`                                             |
| MiniMax   | `image-01`                              | Tak (odwołanie do obiektu)         | `MINIMAX_API_KEY` lub MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                              | Tak (1 obraz, zależnie od konfiguracji workflow) | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla chmury |
| Vydra     | `grok-imagine`                          | Nie                                | `VYDRA_API_KEY`                                       |
| xAI       | `grok-imagine-image`                    | Tak (do 5 obrazów)                 | `XAI_API_KEY`                                         |

Użyj `action: "list"`, aby sprawdzić dostępnych dostawców i modele w runtime:

```
/tool image_generate action=list
```

## Parametry narzędzia

<ParamField path="prompt" type="string" required>
Prompt generowania obrazu. Wymagany dla `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Użyj `"list"`, aby sprawdzić dostępnych dostawców i modele w runtime.
</ParamField>

<ParamField path="model" type="string">
Nadpisanie dostawcy/modelu, np. `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Ścieżka lub URL pojedynczego obrazu referencyjnego dla trybu edycji.
</ParamField>

<ParamField path="images" type="string[]">
Wiele obrazów referencyjnych dla trybu edycji (do 5).
</ParamField>

<ParamField path="size" type="string">
Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Proporcje obrazu: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Wskazówka rozdzielczości.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Wskazówka jakości, gdy dostawca ją obsługuje.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Wskazówka formatu wyjściowego, gdy dostawca ją obsługuje.
</ParamField>

<ParamField path="count" type="number">
Liczba obrazów do wygenerowania (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Opcjonalny limit czasu żądania do dostawcy w milisekundach.
</ParamField>

<ParamField path="filename" type="string">
Wskazówka nazwy pliku wyjściowego.
</ParamField>

<ParamField path="openai" type="object">
Wskazówki tylko dla OpenAI: `background`, `moderation`, `outputCompression` i `user`.
</ParamField>

Nie wszyscy dostawcy obsługują wszystkie parametry. Gdy zapasowy dostawca obsługuje zbliżoną opcję geometrii zamiast dokładnie żądanej, OpenClaw mapuje ją na najbliższy obsługiwany rozmiar, proporcje lub rozdzielczość przed wysłaniem. Nieobsługiwane wskazówki wyjściowe, takie jak `quality` lub `outputFormat`, są odrzucane dla dostawców, którzy nie deklarują ich obsługi, i zgłaszane w wyniku narzędzia.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw mapuje geometrię podczas przejścia do dostawcy zapasowego, zwrócone wartości `size`, `aspectRatio` i `resolution` odzwierciedlają to, co zostało faktycznie wysłane, a `details.normalization` przechwytuje tłumaczenie z żądanych wartości na zastosowane.

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Kolejność wyboru dostawcy

Podczas generowania obrazu OpenClaw próbuje dostawców w tej kolejności:

1. **Parametr `model`** z wywołania narzędzia (jeśli agent go poda)
2. **`imageGenerationModel.primary`** z konfiguracji
3. **`imageGenerationModel.fallbacks`** w podanej kolejności
4. **Automatyczne wykrywanie** — używa tylko domyślnych dostawców opartych na auth:
   - najpierw bieżący domyślny dostawca
   - potem pozostali zarejestrowani dostawcy generowania obrazów w kolejności identyfikatorów dostawców

Jeśli dostawca zawiedzie (błąd auth, limit szybkości itd.), automatycznie próbowany jest kolejny skonfigurowany kandydat. Jeśli zawiodą wszyscy, błąd zawiera szczegóły z każdej próby.

Uwagi:

- Nadpisanie `model` dla pojedynczego wywołania jest dokładne: OpenClaw próbuje tylko tego dostawcy/modelu
  i nie przechodzi do skonfigurowanych `primary`/`fallbacks` ani do automatycznie wykrytych
  dostawców.
- Automatyczne wykrywanie jest świadome auth. Domyślny dostawca trafia na listę kandydatów
  tylko wtedy, gdy OpenClaw rzeczywiście może się uwierzytelnić u tego dostawcy.
- Automatyczne wykrywanie jest domyślnie włączone. Ustaw
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz, aby generowanie obrazów
  używało tylko jawnych wpisów `model`, `primary` i `fallbacks`.
- Użyj `action: "list"`, aby sprawdzić aktualnie zarejestrowanych dostawców, ich
  modele domyślne i wskazówki dotyczące zmiennych środowiskowych auth.

### Edycja obrazów

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI i xAI obsługują edycję obrazów referencyjnych. Przekaż ścieżkę lub URL obrazu referencyjnego:

```
"Wygeneruj akwarelową wersję tego zdjęcia" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google i xAI obsługują do 5 obrazów referencyjnych przez parametr `images`. fal, MiniMax i ComfyUI obsługują 1.

### Modele obrazów OpenRouter

Generowanie obrazów OpenRouter używa tego samego `OPENROUTER_API_KEY` i przechodzi przez API obrazów chat completions OpenRouter. Wybieraj modele obrazów OpenRouter z prefiksem `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw przekazuje do OpenRouter `prompt`, `count`, obrazy referencyjne oraz wskazówki `aspectRatio` / `resolution` zgodne z Gemini. Obecne wbudowane skróty modeli obrazów OpenRouter obejmują `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` i `openai/gpt-5.4-image-2`; użyj `action: "list"`, aby zobaczyć, co udostępnia skonfigurowany plugin.

### OpenAI `gpt-image-2`

Generowanie obrazów OpenAI domyślnie używa `openai/gpt-image-2`. Jeśli
skonfigurowany jest profil OAuth `openai-codex`, OpenClaw ponownie używa tego samego profilu OAuth
co modele czatu subskrypcji Codex i wysyła żądanie obrazu
przez backend Codex Responses. Starsze bazowe URL Codex, takie jak
`https://chatgpt.com/backend-api`, są kanonizowane do
`https://chatgpt.com/backend-api/codex` dla żądań obrazów. Nie następuje
ciche przejście awaryjne do `OPENAI_API_KEY` dla tego żądania. Aby wymusić bezpośrednie kierowanie do OpenAI
Images API, skonfiguruj jawnie `models.providers.openai` z kluczem API,
niestandardowym bazowym URL albo endpointem Azure. Starszy model
`openai/gpt-image-1` nadal można wybrać jawnie, ale nowe żądania generowania
i edycji obrazów OpenAI powinny używać `gpt-image-2`.

`gpt-image-2` obsługuje zarówno generowanie tekst-do-obrazu, jak i edycję z obrazem referencyjnym
przez to samo narzędzie `image_generate`. OpenClaw przekazuje do OpenAI `prompt`,
`count`, `size`, `quality`, `outputFormat` i obrazy referencyjne.
OpenAI nie otrzymuje bezpośrednio `aspectRatio` ani `resolution`; gdy to możliwe,
OpenClaw mapuje je na obsługiwany `size`, w przeciwnym razie narzędzie zgłasza je jako
zignorowane nadpisania.

Opcje specyficzne dla OpenAI znajdują się w obiekcie `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` akceptuje `transparent`, `opaque` lub `auto`; przezroczyste
wyjścia wymagają `outputFormat` równego `png` lub `webp`. `openai.outputCompression`
dotyczy wyjść JPEG/WebP.

Wygeneruj jeden obraz 4K w orientacji poziomej:

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

Edycja z wieloma odwołaniami:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Połącz tożsamość postaci z pierwszego obrazu z paletą kolorów z drugiego" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Aby kierować generowanie obrazów OpenAI przez wdrożenie Azure OpenAI zamiast
`api.openai.com`, zobacz [Azure OpenAI endpoints](/pl/providers/openai#azure-openai-endpoints)
w dokumentacji dostawcy OpenAI.

Generowanie obrazów MiniMax jest dostępne przez obie wbudowane ścieżki auth MiniMax:

- `minimax/image-01` dla konfiguracji z kluczem API
- `minimax-portal/image-01` dla konfiguracji OAuth

## Capability dostawców

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generowanie           | Tak (do 4)           | Tak (do 4)           | Tak (do 4)          | Tak (do 9)                 | Tak (wyjścia zdefiniowane przez workflow) | Tak (1) | Tak (do 4)           |
| Edycja/odwołanie      | Tak (do 5 obrazów)   | Tak (do 5 obrazów)   | Tak (1 obraz)       | Tak (1 obraz, odwołanie do obiektu) | Tak (1 obraz, zależnie od konfiguracji workflow) | Nie     | Tak (do 5 obrazów) |
| Kontrola rozmiaru     | Tak (do 4K)          | Tak                  | Tak                 | Nie                        | Nie                                | Nie     | Nie                  |
| Proporcje obrazu      | Nie                  | Tak                  | Tak (tylko generowanie) | Tak                    | Nie                                | Nie     | Tak                  |
| Rozdzielczość (1K/2K/4K) | Nie               | Tak                  | Tak                 | Nie                        | Nie                                | Nie     | Tak (1K/2K)          |

### xAI `grok-imagine-image`

Wbudowany dostawca xAI używa `/v1/images/generations` dla żądań tylko z promptem
oraz `/v1/images/edits`, gdy obecne jest `image` lub `images`.

- Modele: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Count: do 4
- Odwołania: jedno `image` lub do pięciu `images`
- Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Rozdzielczości: `1K`, `2K`
- Wyjścia: zwracane jako załączniki obrazów zarządzane przez OpenClaw

OpenClaw celowo nie udostępnia natywnych dla xAI opcji `quality`, `mask`, `user` ani
dodatkowych proporcji obrazu dostępnych tylko natywnie, dopóki te kontrolki nie pojawią się w
współdzielonym, międzydostawcowym kontrakcie `image_generate`.

## Powiązane

- [Tools Overview](/pl/tools) — wszystkie dostępne narzędzia agenta
- [fal](/pl/providers/fal) — konfiguracja dostawcy obrazów i wideo fal
- [ComfyUI](/pl/providers/comfy) — konfiguracja lokalnego ComfyUI i workflow Comfy Cloud
- [Google (Gemini)](/pl/providers/google) — konfiguracja dostawcy obrazów Gemini
- [MiniMax](/pl/providers/minimax) — konfiguracja dostawcy obrazów MiniMax
- [OpenAI](/pl/providers/openai) — konfiguracja dostawcy OpenAI Images
- [Vydra](/pl/providers/vydra) — konfiguracja obrazów, wideo i mowy Vydra
- [xAI](/pl/providers/xai) — konfiguracja obrazów, wideo, wyszukiwania, wykonywania kodu i TTS Grok
- [Configuration Reference](/pl/gateway/config-agents#agent-defaults) — konfiguracja `imageGenerationModel`
- [Models](/pl/concepts/models) — konfiguracja modeli i failover
