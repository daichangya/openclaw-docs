---
read_when:
    - Projektowanie lub refaktoryzacja rozumienia multimediów
    - Dostrajanie wstępnego przetwarzania przychodzącego audio/wideo/obrazów
summary: Rozumienie przychodzących obrazów/audio/wideo (opcjonalne) z providerem i ścieżkami zapasowymi CLI
title: Rozumienie multimediów
x-i18n:
    generated_at: "2026-04-23T10:03:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Rozumienie multimediów - przychodzących (2026-01-17)

OpenClaw może **podsumowywać przychodzące multimedia** (obraz/audio/wideo) przed uruchomieniem potoku odpowiedzi. Automatycznie wykrywa, kiedy dostępne są lokalne narzędzia lub klucze providerów, i może zostać wyłączone albo dostosowane. Jeśli rozumienie jest wyłączone, modele nadal jak zwykle otrzymują oryginalne pliki/URL-e.

Zachowanie multimediów specyficzne dla vendora jest rejestrowane przez Pluginy vendorów, podczas gdy
rdzeń OpenClaw odpowiada za współdzieloną konfigurację `tools.media`, kolejność ścieżek zapasowych i
integrację z potokiem odpowiedzi.

## Cele

- Opcjonalność: wstępne streszczanie przychodzących multimediów do krótkiego tekstu dla szybszego routingu i lepszego parsowania poleceń.
- Zachowanie dostarczania oryginalnych multimediów do modelu (zawsze).
- Obsługa **API providerów** i **zapasowych ścieżek CLI**.
- Umożliwienie wielu modeli z uporządkowaną ścieżką zapasową (błąd/rozmiar/limit czasu).

## Zachowanie na wysokim poziomie

1. Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Dla każdej włączonej możliwości (obraz/audio/wideo) wybierz załączniki zgodnie z zasadami (domyślnie: **pierwszy**).
3. Wybierz pierwszy kwalifikujący się wpis modelu (rozmiar + możliwość + auth).
4. Jeśli model zawiedzie albo multimedia są zbyt duże, **przejdź do następnego wpisu**.
5. Po sukcesie:
   - `Body` staje się blokiem `[Image]`, `[Audio]` albo `[Video]`.
   - Dla audio ustawiane jest `{{Transcript}}`; parsowanie poleceń używa tekstu podpisu, jeśli jest obecny,
     w przeciwnym razie transkryptu.
   - Podpisy są zachowywane jako `User text:` wewnątrz bloku.

Jeśli rozumienie zawiedzie albo jest wyłączone, **przepływ odpowiedzi jest kontynuowany** z oryginalnym body i załącznikami.

## Przegląd konfiguracji

`tools.media` obsługuje **współdzielone modele** oraz nadpisania per możliwość:

- `tools.media.models`: współdzielona lista modeli (użyj `capabilities`, aby je ograniczać).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - wartości domyślne (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - nadpisania providera (`baseUrl`, `headers`, `providerOptions`)
  - opcje audio Deepgram przez `tools.media.audio.providerOptions.deepgram`
  - kontrolki echa transkryptu audio (`echoTranscript`, domyślnie `false`; `echoFormat`)
  - opcjonalna lista `models` **per możliwość** (preferowana przed współdzielonymi modelami)
  - zasady `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (opcjonalne ograniczanie według channel/chatType/session key)
- `tools.media.concurrency`: maksymalna liczba równoległych uruchomień per możliwość (domyślnie **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Wpisy modeli

Każdy wpis `models[]` może być typu **provider** albo **CLI**:

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Szablony CLI mogą też używać:

- `{{MediaDir}}` (katalog zawierający plik multimedialny)
- `{{OutputDir}}` (katalog roboczy utworzony dla tego uruchomienia)
- `{{OutputBase}}` (ścieżka bazowa pliku roboczego, bez rozszerzenia)

## Ustawienia domyślne i limity

Zalecane ustawienia domyślne:

- `maxChars`: **500** dla obrazu/wideo (krótkie, przyjazne dla poleceń)
- `maxChars`: **nieustawione** dla audio (pełny transkrypt, chyba że ustawisz limit)
- `maxBytes`:
  - obraz: **10MB**
  - audio: **20MB**
  - wideo: **50MB**

Reguły:

- Jeśli multimedia przekraczają `maxBytes`, ten model jest pomijany i **próbowany jest następny model**.
- Pliki audio mniejsze niż **1024 bajty** są traktowane jako puste/uszkodzone i pomijane przed transkrypcją przez provider/CLI.
- Jeśli model zwróci więcej niż `maxChars`, wynik jest przycinany.
- `prompt` domyślnie używa prostego „Describe the {media}.” plus wskazówki `maxChars` (tylko obraz/wideo).
- Jeśli aktywny główny model obrazu już natywnie obsługuje vision, OpenClaw
  pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do
  modelu.
- Jawne żądania `openclaw infer image describe --model <provider/model>` są inne: uruchamiają bezpośrednio tego providera/model obsługującego obraz, w tym
  odwołania Ollama takie jak `ollama/qwen2.5vl:7b`.
- Jeśli `<capability>.enabled: true`, ale nie skonfigurowano modeli, OpenClaw próbuje
  użyć **aktywnego modelu odpowiedzi**, gdy jego provider obsługuje daną możliwość.

### Automatyczne wykrywanie rozumienia multimediów (domyślne)

Jeśli `tools.media.<capability>.enabled` **nie** jest ustawione na `false` i nie
skonfigurowano modeli, OpenClaw wykrywa je automatycznie w tej kolejności i **zatrzymuje się przy pierwszej
działającej opcji**:

1. **Aktywny model odpowiedzi**, jeśli jego provider obsługuje daną możliwość.
2. Główne/zapasowe odwołania **`agents.defaults.imageModel`** (tylko obraz).
3. **Lokalne CLI** (tylko audio; jeśli są zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; używa `WHISPER_CPP_MODEL` albo bundlowanego modelu tiny)
   - `whisper` (Python CLI; automatycznie pobiera modele)
4. **Gemini CLI** (`gemini`) z użyciem `read_many_files`
5. **Auth providera**
   - Skonfigurowane wpisy `models.providers.*`, które obsługują daną możliwość,
     są próbowane przed bundlowaną kolejnością zapasową.
   - Providerzy z konfiguracji tylko dla obrazu z modelem obsługującym obraz rejestrują się automatycznie dla
     rozumienia multimediów nawet wtedy, gdy nie są bundlowanym Pluginem vendora.
   - Rozumienie obrazów przez Ollama jest dostępne po jawnym wybraniu, na
     przykład przez `agents.defaults.imageModel` albo
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Bundlowana kolejność zapasowa:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Obraz: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Wideo: Google → Qwen → Moonshot

Aby wyłączyć automatyczne wykrywanie, ustaw:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Uwaga: wykrywanie binarne działa best-effort na macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką do polecenia.

### Obsługa środowiska proxy (modele providerów)

Gdy włączone jest rozumienie multimediów **audio** i **wideo** oparte na providerach, OpenClaw
respektuje standardowe zmienne środowiskowe wychodzącego proxy dla wywołań HTTP do providerów:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jeśli nie ustawiono żadnych zmiennych środowiskowych proxy, rozumienie multimediów używa bezpośredniego wyjścia.
Jeśli wartość proxy jest nieprawidłowo sformatowana, OpenClaw zapisuje ostrzeżenie do logów i wraca do bezpośredniego
pobierania.

## Możliwości (opcjonalnie)

Jeśli ustawisz `capabilities`, wpis będzie uruchamiany tylko dla tych typów multimediów. Dla współdzielonych
list OpenClaw może wywnioskować wartości domyślne:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Dowolny katalog `models.providers.<id>.models[]` z modelem obsługującym obraz:
  **image**

Dla wpisów CLI **ustaw `capabilities` jawnie**, aby uniknąć zaskakujących dopasowań.
Jeśli pominiesz `capabilities`, wpis kwalifikuje się dla listy, w której się znajduje.

## Macierz obsługi providerów (integracje OpenClaw)

| Możliwość | Integracja providera                                                                   | Uwagi                                                                                                                                      |
| --------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Obraz     | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, providerzy config | Pluginy vendorów rejestrują obsługę obrazów; MiniMax i MiniMax OAuth używają `MiniMax-VL-01`; providerzy config obsługujący obraz rejestrują się automatycznie. |
| Audio     | OpenAI, Groq, Deepgram, Google, Mistral                                                | Transkrypcja przez providerów (Whisper/Deepgram/Gemini/Voxtral).                                                                           |
| Wideo     | Google, Qwen, Moonshot                                                                 | Rozumienie wideo przez providera za pomocą Pluginów vendorów; rozumienie wideo Qwen używa standardowych endpointów DashScope.             |

Uwaga dotycząca MiniMax:

- Rozumienie obrazów `minimax` i `minimax-portal` pochodzi z należącego do Pluginu
  providera multimediów `MiniMax-VL-01`.
- Bundlowany katalog tekstowy MiniMax nadal zaczyna się jako tekstowy;
  jawne wpisy `models.providers.minimax` materializują odwołania czatu M2.7 obsługujące obraz.

## Wskazówki dotyczące wyboru modelu

- Preferuj najmocniejszy model najnowszej generacji dostępny dla każdej możliwości multimedialnej, gdy liczą się jakość i bezpieczeństwo.
- Dla agentów z włączonymi narzędziami, obsługujących niezaufane dane wejściowe, unikaj starszych/słabszych modeli multimedialnych.
- Zachowaj co najmniej jedną ścieżkę zapasową per możliwość dla dostępności (model jakościowy + szybszy/tańszy model).
- Zapasowe ścieżki CLI (`whisper-cli`, `whisper`, `gemini`) są przydatne, gdy API providerów są niedostępne.
- Uwaga `parakeet-mlx`: z `--output-dir` OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy format wyjściowy to `txt` (albo nie został określony); formaty inne niż `txt` wracają do stdout.

## Zasady załączników

Per możliwość `attachments` kontroluje, które załączniki są przetwarzane:

- `mode`: `first` (domyślnie) albo `all`
- `maxAttachments`: limit liczby przetwarzanych załączników (domyślnie **1**)
- `prefer`: `first`, `last`, `path`, `url`

Gdy `mode: "all"`, wyniki są oznaczane jako `[Image 1/2]`, `[Audio 2/2]` itd.

Zachowanie ekstrakcji załączników plikowych:

- Wyekstrahowany tekst pliku jest opakowywany jako **niezaufana treść zewnętrzna**, zanim
  zostanie dołączony do promptu multimedialnego.
- Wstrzykiwany blok używa jawnych znaczników granicznych, takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera
  wiersz metadanych `Source: External`.
- Ta ścieżka ekstrakcji załączników celowo pomija długi baner
  `SECURITY NOTICE:`, aby nie rozdymać promptu multimedialnego; znaczniki
  graniczne i metadane nadal pozostają.
- Jeśli plik nie ma tekstu możliwego do wyekstrahowania, OpenClaw wstrzykuje `[No extractable text]`.
- Jeśli PDF na tej ścieżce wraca zapasowo do renderowanych obrazów stron, prompt multimedialny zachowuje
  placeholder `[PDF content rendered to images; images not forwarded to model]`,
  ponieważ ten krok ekstrakcji załączników przekazuje bloki tekstowe, a nie wyrenderowane obrazy PDF.

## Przykłady konfiguracji

### 1) Współdzielona lista modeli + nadpisania

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Tylko audio + wideo (obraz wyłączony)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Opcjonalne rozumienie obrazów

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Pojedynczy wpis multimodalny (jawne capabilities)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Wynik statusu

Gdy działa rozumienie multimediów, `/status` zawiera krótki wiersz podsumowania:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Pokazuje to wyniki per możliwość oraz wybrany provider/model, gdy ma to zastosowanie.

## Uwagi

- Rozumienie działa w trybie **best-effort**. Błędy nie blokują odpowiedzi.
- Załączniki są nadal przekazywane do modeli, nawet gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć, gdzie działa rozumienie (np. tylko DM-y).

## Powiązana dokumentacja

- [Configuration](/pl/gateway/configuration)
- [Image & Media Support](/pl/nodes/images)
