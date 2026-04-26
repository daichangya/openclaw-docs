---
read_when:
    - Generowanie lub edytowanie obrazów przez agenta
    - Konfigurowanie dostawców i modeli generowania obrazów
    - Zrozumienie parametrów narzędzia `image_generate`
sidebarTitle: Image generation
summary: Generuj i edytuj obrazy przez `image_generate` w OpenAI, Google, fal, MiniMax, ComfyUI, OpenRouter, LiteLLM, xAI i Vydra
title: Generowanie obrazów
x-i18n:
    generated_at: "2026-04-26T11:42:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

Narzędzie `image_generate` pozwala agentowi tworzyć i edytować obrazy przy użyciu
skonfigurowanych dostawców. Wygenerowane obrazy są dostarczane automatycznie jako
załączniki multimedialne w odpowiedzi agenta.

<Note>
Narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca
generowania obrazów. Jeśli nie widzisz `image_generate` w narzędziach agenta,
skonfiguruj `agents.defaults.imageGenerationModel`, ustaw klucz API dostawcy
albo zaloguj się za pomocą OpenAI Codex OAuth.
</Note>

## Szybki start

<Steps>
  <Step title="Skonfiguruj uwierzytelnianie">
    Ustaw klucz API dla co najmniej jednego dostawcy (na przykład `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) albo zaloguj się za pomocą OpenAI Codex OAuth.
  </Step>
  <Step title="Wybierz model domyślny (opcjonalnie)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth używa tego samego odwołania do modelu `openai/gpt-image-2`. Gdy
    skonfigurowany jest profil OAuth `openai-codex`, OpenClaw kieruje żądania obrazów
    przez ten profil OAuth zamiast najpierw próbować użyć
    `OPENAI_API_KEY`. Jawna konfiguracja `models.providers.openai` (klucz API,
    niestandardowy/bazowy adres URL Azure) przywraca bezpośrednią ścieżkę API OpenAI Images.

  </Step>
  <Step title="Poproś agenta">
    _„Wygeneruj obraz przyjaznej maskotki robota.”_

    Agent automatycznie wywołuje `image_generate`. Nie trzeba dodawać
    narzędzia do listy dozwolonych — jest włączone domyślnie, gdy dostawca jest dostępny.

  </Step>
</Steps>

<Warning>
W przypadku zgodnych z OpenAI punktów końcowych LAN, takich jak LocalAI, zachowaj niestandardowe
`models.providers.openai.baseUrl` i jawnie wyraź zgodę przez
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Prywatne i
wewnętrzne punkty końcowe obrazów są domyślnie nadal blokowane.
</Warning>

## Typowe ścieżki

| Cel                                                  | Odwołanie do modelu                                | Uwierzytelnianie                        |
| ---------------------------------------------------- | -------------------------------------------------- | --------------------------------------- |
| Generowanie obrazów OpenAI z rozliczaniem API        | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                        |
| Generowanie obrazów OpenAI z uwierzytelnianiem subskrypcji Codex | `openai/gpt-image-2`                   | OpenAI Codex OAuth                      |
| OpenAI transparent-background PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` lub OpenAI Codex OAuth |
| Generowanie obrazów OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                    |
| Generowanie obrazów LiteLLM                          | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                       |
| Generowanie obrazów Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`   |

To samo narzędzie `image_generate` obsługuje generowanie obrazu z tekstu i
edytowanie z użyciem obrazu referencyjnego. Użyj `image` dla jednego odniesienia lub `images`
dla wielu odniesień. Obsługiwane przez dostawcę wskazówki wyjściowe, takie jak `quality`, `outputFormat` i
`background`, są przekazywane dalej, gdy są dostępne, a gdy dany
dostawca ich nie obsługuje, są zgłaszane jako zignorowane. Wbudowana obsługa
przezroczystego tła jest specyficzna dla OpenAI; inni dostawcy mogą nadal zachować
kanał alfa PNG, jeśli ich backend go generuje.

## Obsługiwani dostawcy

| Dostawca   | Model domyślny                         | Obsługa edycji                     | Uwierzytelnianie                                      |
| ---------- | -------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                             | Tak (1 obraz, konfigurowany przez workflow) | `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY` dla chmury |
| fal        | `fal-ai/flux/dev`                      | Tak                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`       | Tak                                | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                 |
| LiteLLM    | `gpt-image-2`                          | Tak (do 5 obrazów wejściowych)     | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                             | Tak (odniesienie do obiektu)       | `MINIMAX_API_KEY` lub MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                          | Tak (do 4 obrazów)                 | `OPENAI_API_KEY` lub OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview`| Tak (do 5 obrazów wejściowych)     | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                         | Nie                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                   | Tak (do 5 obrazów)                 | `XAI_API_KEY`                                         |

Użyj `action: "list"`, aby sprawdzić dostępnych dostawców i modele w czasie działania:

```text
/tool image_generate action=list
```

## Możliwości dostawców

| Możliwość            | ComfyUI            | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| -------------------- | ------------------ | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Generowanie (maks. liczba) | Definiowane przez workflow | 4         | 4              | 9                     | 4              | 1     | 4              |
| Edycja / odniesienie | 1 obraz (workflow) | 1 obraz           | Do 5 obrazów   | 1 obraz (odniesienie do obiektu) | Do 5 obrazów | —     | Do 5 obrazów   |
| Kontrola rozmiaru    | —                  | ✓                 | ✓              | —                     | Do 4K          | —     | —              |
| Proporcje obrazu     | —                  | ✓ (tylko generowanie) | ✓          | ✓                     | —              | —     | ✓              |
| Rozdzielczość (1K/2K/4K) | —               | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Parametry narzędzia

<ParamField path="prompt" type="string" required>
  Prompt generowania obrazu. Wymagany dla `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Użyj `"list"`, aby sprawdzić dostępnych dostawców i modele w czasie działania.
</ParamField>
<ParamField path="model" type="string">
  Nadpisanie dostawcy/modelu (np. `openai/gpt-image-2`). Użyj
  `openai/gpt-image-1.5` dla przezroczystych teł OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Ścieżka lub URL pojedynczego obrazu referencyjnego dla trybu edycji.
</ParamField>
<ParamField path="images" type="string[]">
  Wiele obrazów referencyjnych dla trybu edycji (do 5 u dostawców, którzy to obsługują).
</ParamField>
<ParamField path="size" type="string">
  Wskazówka rozmiaru: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Proporcje obrazu: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Wskazówka rozdzielczości.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Wskazówka jakości, gdy dostawca ją obsługuje.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Wskazówka formatu wyjściowego, gdy dostawca ją obsługuje.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Wskazówka tła, gdy dostawca ją obsługuje. Użyj `transparent` z
  `outputFormat: "png"` lub `"webp"` dla dostawców obsługujących przezroczystość.
</ParamField>
<ParamField path="count" type="number">Liczba obrazów do wygenerowania (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu żądania dostawcy w milisekundach.</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="openai" type="object">
  Wskazówki tylko dla OpenAI: `background`, `moderation`, `outputCompression` i `user`.
</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. Gdy dostawca zapasowy obsługuje
zbliżoną opcję geometrii zamiast dokładnie żądanej, OpenClaw mapuje ją na
najbliższy obsługiwany rozmiar, proporcje obrazu lub rozdzielczość przed wysłaniem.
Nieobsługiwane wskazówki wyjściowe są odrzucane dla dostawców, którzy nie deklarują
obsługi, i zgłaszane w wyniku narzędzia. Wyniki narzędzia raportują zastosowane
ustawienia; `details.normalization` przechwytuje każde tłumaczenie
z wartości żądanej na zastosowaną.
</Note>

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
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

### Kolejność wyboru dostawców

OpenClaw próbuje dostawców w tej kolejności:

1. **Parametr `model`** z wywołania narzędzia (jeśli agent go określa).
2. **`imageGenerationModel.primary`** z konfiguracji.
3. **`imageGenerationModel.fallbacks`** po kolei.
4. **Autowykrywanie** — tylko domyślni dostawcy obsługiwani przez uwierzytelnianie:
   - najpierw bieżący dostawca domyślny;
   - pozostali zarejestrowani dostawcy generowania obrazów według kolejności identyfikatorów dostawców.

Jeśli dostawca zawiedzie (błąd uwierzytelniania, limit szybkości itp.), automatycznie
próbowany jest kolejny skonfigurowany kandydat. Jeśli zawiodą wszyscy, błąd zawiera szczegóły
z każdej próby.

<AccordionGroup>
  <Accordion title="Nadpisania modelu dla pojedynczego wywołania są dokładne">
    Nadpisanie `model` dla pojedynczego wywołania próbuje tylko tego dostawcy/modelu i
    nie przechodzi dalej do skonfigurowanego głównego/zapasowego ani do dostawców wykrytych automatycznie.
  </Accordion>
  <Accordion title="Autowykrywanie uwzględnia uwierzytelnianie">
    Domyślny dostawca trafia na listę kandydatów tylko wtedy, gdy OpenClaw może
    rzeczywiście uwierzytelnić tego dostawcę. Ustaw
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać tylko
    jawnych wpisów `model`, `primary` i `fallbacks`.
  </Accordion>
  <Accordion title="Limity czasu">
    Ustaw `agents.defaults.imageGenerationModel.timeoutMs` dla wolnych backendów obrazów.
    Parametr narzędzia `timeoutMs` dla pojedynczego wywołania nadpisuje skonfigurowaną
    wartość domyślną.
  </Accordion>
  <Accordion title="Sprawdzanie w czasie działania">
    Użyj `action: "list"`, aby sprawdzić aktualnie zarejestrowanych dostawców,
    ich modele domyślne oraz wskazówki dotyczące zmiennych środowiskowych uwierzytelniania.
  </Accordion>
</AccordionGroup>

### Edytowanie obrazów

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI i xAI obsługują edycję
obrazów referencyjnych. Przekaż ścieżkę lub URL obrazu referencyjnego:

```text
"Wygeneruj akwarelową wersję tego zdjęcia" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google i xAI obsługują do 5 obrazów referencyjnych przez
parametr `images`. fal, MiniMax i ComfyUI obsługują 1.

## Szczegółowe informacje o dostawcach

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (i gpt-image-1.5)">
    Generowanie obrazów OpenAI domyślnie używa `openai/gpt-image-2`. Jeśli skonfigurowany jest
    profil OAuth `openai-codex`, OpenClaw ponownie wykorzystuje ten sam
    profil OAuth używany przez modele czatu subskrypcji Codex i wysyła
    żądanie obrazu przez backend Codex Responses. Starsze bazowe adresy URL Codex,
    takie jak `https://chatgpt.com/backend-api`, są kanonizowane do
    `https://chatgpt.com/backend-api/codex` dla żądań obrazów. OpenClaw
    **nie** przełącza się po cichu na `OPENAI_API_KEY` dla tego żądania —
    aby wymusić bezpośrednie kierowanie do API OpenAI Images, skonfiguruj
    `models.providers.openai` jawnie z kluczem API, niestandardowym bazowym adresem URL
    lub punktem końcowym Azure.

    Modele `openai/gpt-image-1.5`, `openai/gpt-image-1` oraz
    `openai/gpt-image-1-mini` nadal można wybierać jawnie. Użyj
    `gpt-image-1.5` do wyjścia PNG/WebP z przezroczystym tłem; bieżące
    API `gpt-image-2` odrzuca `background: "transparent"`.

    `gpt-image-2` obsługuje zarówno generowanie obrazu z tekstu, jak i
    edytowanie z obrazem referencyjnym przez to samo narzędzie `image_generate`.
    OpenClaw przekazuje do OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat`
    i obrazy referencyjne. OpenAI **nie** otrzymuje
    bezpośrednio `aspectRatio` ani `resolution`; gdy to możliwe, OpenClaw mapuje
    je na obsługiwane `size`, w przeciwnym razie narzędzie zgłasza je jako
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

    `openai.background` akceptuje `transparent`, `opaque` lub `auto`;
    przezroczyste wyjścia wymagają `outputFormat` `png` lub `webp` oraz
    modelu obrazów OpenAI obsługującego przezroczystość. OpenClaw kieruje domyślne
    żądania przezroczystego tła dla `gpt-image-2` do `gpt-image-1.5`.
    `openai.outputCompression` dotyczy wyjść JPEG/WebP.

    Wskazówka najwyższego poziomu `background` jest neutralna względem dostawcy i obecnie mapuje się
    na to samo pole żądania OpenAI `background`, gdy wybrany jest dostawca OpenAI.
    Dostawcy, którzy nie deklarują obsługi tła, zwracają tę wartość w `ignoredOverrides`,
    zamiast otrzymywać nieobsługiwany parametr.

    Aby kierować generowanie obrazów OpenAI przez wdrożenie Azure OpenAI
    zamiast `api.openai.com`, zobacz
    [Punkty końcowe Azure OpenAI](/pl/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modele obrazów OpenRouter">
    Generowanie obrazów OpenRouter używa tego samego `OPENROUTER_API_KEY` i
    kieruje przez API obrazów chat completions OpenRouter. Wybieraj
    modele obrazów OpenRouter z prefiksem `openrouter/`:

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

    OpenClaw przekazuje do OpenRouter `prompt`, `count`, obrazy referencyjne oraz
    wskazówki `aspectRatio` / `resolution` zgodne z Gemini.
    Bieżące wbudowane skróty modeli obrazów OpenRouter obejmują
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` i `openai/gpt-5.4-image-2`. Użyj
    `action: "list"`, aby sprawdzić, co udostępnia skonfigurowany Plugin.

  </Accordion>
  <Accordion title="MiniMax z podwójnym uwierzytelnianiem">
    Generowanie obrazów MiniMax jest dostępne przez obie wbudowane
    ścieżki uwierzytelniania MiniMax:

    - `minimax/image-01` dla konfiguracji z kluczem API
    - `minimax-portal/image-01` dla konfiguracji OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Wbudowany dostawca xAI używa `/v1/images/generations` dla żądań
    opartych wyłącznie na promptach oraz `/v1/images/edits`, gdy obecne jest `image` lub `images`.

    - Modele: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Liczba: do 4
    - Odniesienia: jedno `image` lub do pięciu `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Rozdzielczości: `1K`, `2K`
    - Wyjścia: zwracane jako załączniki obrazów zarządzane przez OpenClaw

    OpenClaw celowo nie udostępnia natywnych dla xAI `quality`, `mask`,
    `user` ani dodatkowych natywnych proporcji obrazu, dopóki te kontrolki
    nie istnieją we współdzielonym międzydostawcowym kontrakcie `image_generate`.

  </Accordion>
</AccordionGroup>

## Przykłady

<Tabs>
  <Tab title="Generowanie (poziom 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Czysty redakcyjny plakat dla generowania obrazów OpenClaw" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generowanie (przezroczysty PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="Prosta naklejka z czerwonym kołem na przezroczystym tle" outputFormat=png background=transparent
```

Równoważne CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Prosta naklejka z czerwonym kołem na przezroczystym tle" \
  --json
```

  </Tab>
  <Tab title="Generowanie (dwa kwadratowe)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Dwa kierunki wizualne dla spokojnej ikony aplikacji produktywności" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edycja (jedno odniesienie)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Zachowaj obiekt, zastąp tło jasną aranżacją studyjną" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edycja (wiele odniesień)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Połącz tożsamość postaci z pierwszego obrazu z paletą kolorów z drugiego" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Te same flagi `--output-format` i `--background` są dostępne w
`openclaw infer image edit`; `--openai-background` pozostaje
aliasem specyficznym dla OpenAI. Wbudowani dostawcy inni niż OpenAI obecnie nie deklarują
jawnej kontroli tła, więc `background: "transparent"` jest dla nich zgłaszane
jako zignorowane.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [ComfyUI](/pl/providers/comfy) — konfiguracja lokalnych workflow ComfyUI i Comfy Cloud
- [fal](/pl/providers/fal) — konfiguracja dostawcy obrazów i wideo fal
- [Google (Gemini)](/pl/providers/google) — konfiguracja dostawcy obrazów Gemini
- [MiniMax](/pl/providers/minimax) — konfiguracja dostawcy obrazów MiniMax
- [OpenAI](/pl/providers/openai) — konfiguracja dostawcy OpenAI Images
- [Vydra](/pl/providers/vydra) — konfiguracja obrazów, wideo i mowy Vydra
- [xAI](/pl/providers/xai) — konfiguracja obrazów, wideo, wyszukiwania, wykonywania kodu i TTS Grok
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `imageGenerationModel`
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
