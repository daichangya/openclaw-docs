---
read_when:
    - Projektowanie lub refaktoryzacja rozumienia mediów
    - Dostrajanie preprocessingu przychodzącego audio/wideo/obrazu
summary: Rozumienie przychodzących obrazów/audio/wideo (opcjonalne) z fallbackami dostawcy i CLI
title: Rozumienie mediów
x-i18n:
    generated_at: "2026-04-25T13:50:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Rozumienie mediów — przychodzące (2026-01-17)

OpenClaw może **podsumowywać przychodzące media** (obraz/audio/wideo) przed uruchomieniem potoku odpowiedzi. Automatycznie wykrywa, kiedy dostępne są narzędzia lokalne lub klucze dostawców, i może zostać wyłączone albo dostosowane. Jeśli rozumienie jest wyłączone, modele nadal otrzymują oryginalne pliki/URL-e jak zwykle.

Zachowanie mediów specyficzne dla dostawcy jest rejestrowane przez Pluginy dostawców, podczas gdy
rdzeń OpenClaw odpowiada za współdzieloną konfigurację `tools.media`, kolejność fallbacków i integrację z potokiem odpowiedzi.

## Cele

- Opcjonalne: wstępne przetwarzanie przychodzących mediów do krótkiego tekstu dla szybszego routingu i lepszego parsowania poleceń.
- Zachowanie oryginalnego dostarczenia mediów do modelu (zawsze).
- Obsługa **API dostawców** oraz **fallbacków CLI**.
- Umożliwienie użycia wielu modeli z uporządkowanym fallbackiem (błąd/rozmiar/timeout).

## Zachowanie wysokiego poziomu

1. Zbierz przychodzące załączniki (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Dla każdej włączonej możliwości (obraz/audio/wideo) wybierz załączniki zgodnie z polityką (domyślnie: **pierwszy**).
3. Wybierz pierwszy kwalifikujący się wpis modelu (rozmiar + możliwość + uwierzytelnianie).
4. Jeśli model zawiedzie albo media będą zbyt duże, następuje **fallback do następnego wpisu**.
5. Przy powodzeniu:
   - `Body` staje się blokiem `[Image]`, `[Audio]` albo `[Video]`.
   - Dla audio ustawiane jest `{{Transcript}}`; parsowanie poleceń używa tekstu podpisu, jeśli jest obecny, w przeciwnym razie transkryptu.
   - Podpisy są zachowywane jako `User text:` wewnątrz bloku.

Jeśli rozumienie się nie powiedzie albo jest wyłączone, **przepływ odpowiedzi jest kontynuowany** z oryginalnym body + załącznikami.

## Przegląd konfiguracji

`tools.media` obsługuje **współdzielone modele** oraz nadpisania per możliwość:

- `tools.media.models`: współdzielona lista modeli (użyj `capabilities` do bramkowania).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - wartości domyślne (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - nadpisania dostawcy (`baseUrl`, `headers`, `providerOptions`)
  - opcje audio Deepgram przez `tools.media.audio.providerOptions.deepgram`
  - kontrola echa transkryptu audio (`echoTranscript`, domyślnie `false`; `echoFormat`)
  - opcjonalna **lista `models` per możliwość** (preferowana przed modelami współdzielonymi)
  - polityka `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (opcjonalne bramkowanie według kanału/chatType/klucza sesji)
- `tools.media.concurrency`: maksymalna liczba równoległych uruchomień możliwości (domyślnie **2**).

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
  model: "gpt-5.5",
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

Szablony CLI mogą także używać:

- `{{MediaDir}}` (katalog zawierający plik mediów)
- `{{OutputDir}}` (katalog roboczy utworzony dla tego uruchomienia)
- `{{OutputBase}}` (bazowa ścieżka pliku roboczego, bez rozszerzenia)

## Wartości domyślne i limity

Zalecane wartości domyślne:

- `maxChars`: **500** dla obrazu/wideo (krótkie, przyjazne dla poleceń)
- `maxChars`: **nieustawione** dla audio (pełny transkrypt, chyba że ustawisz limit)
- `maxBytes`:
  - obraz: **10MB**
  - audio: **20MB**
  - wideo: **50MB**

Zasady:

- Jeśli media przekraczają `maxBytes`, dany model jest pomijany, a **próbowany jest następny model**.
- Pliki audio mniejsze niż **1024 bajty** są traktowane jako puste/uszkodzone i pomijane przed transkrypcją przez provider/CLI.
- Jeśli model zwróci więcej niż `maxChars`, wynik jest przycinany.
- `prompt` domyślnie przyjmuje prostą postać „Describe the {media}.” wraz ze wskazówką `maxChars` (tylko obraz/wideo).
- Jeśli aktywny główny model obrazu natywnie obsługuje vision, OpenClaw
  pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do
  modelu.
- Jeśli główny model Gateway/WebChat jest wyłącznie tekstowy, załączniki obrazów są
  zachowywane jako odciążone referencje `media://inbound/*`, aby narzędzia obrazu/PDF lub
  skonfigurowany model obrazu nadal mogły je sprawdzić zamiast utracić załącznik.
- Jawne żądania `openclaw infer image describe --model <provider/model>`
  są inne: uruchamiają bezpośrednio tego providera/model obsługujący obrazy, w tym
  referencje Ollama, takie jak `ollama/qwen2.5vl:7b`.
- Jeśli `<capability>.enabled: true`, ale nie skonfigurowano modeli, OpenClaw próbuje użyć
  **aktywnego modelu odpowiedzi**, jeśli jego provider obsługuje daną możliwość.

### Automatyczne wykrywanie rozumienia mediów (domyślne)

Jeśli `tools.media.<capability>.enabled` **nie** jest ustawione na `false` i nie masz
skonfigurowanych modeli, OpenClaw automatycznie wykrywa w tej kolejności i **zatrzymuje się na pierwszej
działającej opcji**:

1. **Aktywny model odpowiedzi**, jeśli jego provider obsługuje daną możliwość.
2. Referencje primary/fallback **`agents.defaults.imageModel`** (tylko obraz).
3. **Lokalne CLI** (tylko audio; jeśli zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; używa `WHISPER_CPP_MODEL` albo dołączonego małego modelu)
   - `whisper` (Python CLI; automatycznie pobiera modele)
4. **Gemini CLI** (`gemini`) używające `read_many_files`
5. **Uwierzytelnianie providera**
   - Skonfigurowane wpisy `models.providers.*` obsługujące daną możliwość są
     wypróbowywane przed dołączoną kolejnością fallbacków.
   - Providerzy skonfigurowani tylko dla obrazów z modelem obsługującym obrazy są automatycznie rejestrowani dla
     rozumienia mediów, nawet jeśli nie są dołączonym Pluginem dostawcy.
   - Rozumienie obrazów przez Ollama jest dostępne przy wyborze jawnym, na
     przykład przez `agents.defaults.imageModel` albo
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Dołączona kolejność fallbacków:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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

Uwaga: wykrywanie binarek jest realizowane metodą best-effort na macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`) albo ustaw jawny model CLI z pełną ścieżką polecenia.

### Obsługa środowiska proxy (modele providerów)

Gdy rozumienie mediów **audio** i **wideo** oparte na providerach jest włączone, OpenClaw
respektuje standardowe zmienne środowiskowe proxy dla wychodzących wywołań HTTP do providerów:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jeśli nie ustawiono żadnych zmiennych środowiskowych proxy, rozumienie mediów używa bezpośredniego wyjścia.
Jeśli wartość proxy jest nieprawidłowa, OpenClaw zapisuje ostrzeżenie w logach i wraca do bezpośredniego
pobierania.

## Możliwości (opcjonalne)

Jeśli ustawisz `capabilities`, wpis działa tylko dla tych typów mediów. Dla list
współdzielonych OpenClaw może wywnioskować wartości domyślne:

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
- Każdy katalog `models.providers.<id>.models[]` z modelem obsługującym obrazy:
  **image**

Dla wpisów CLI **ustaw `capabilities` jawnie**, aby uniknąć zaskakujących dopasowań.
Jeśli pominiesz `capabilities`, wpis kwalifikuje się do listy, w której się pojawia.

## Macierz obsługi providerów (integracje OpenClaw)

| Możliwość | Integracja providera                                                                                                           | Uwagi                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Obraz      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Pluginy dostawców rejestrują obsługę obrazów; `openai-codex/*` używa mechaniki providera OAuth; `codex/*` używa ograniczonej tury Codex app-server; MiniMax i MiniMax OAuth oba używają `MiniMax-VL-01`; providerzy konfiguracji obsługujący obrazy rejestrują się automatycznie. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Transkrypcja przez providera (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                             |
| Wideo      | Google, Qwen, Moonshot                                                                                                       | Rozumienie wideo przez providera za pomocą Pluginów dostawców; rozumienie wideo Qwen używa standardowych endpointów DashScope.                                                                                                       |

Uwaga dotycząca MiniMax:

- Rozumienie obrazów przez `minimax` i `minimax-portal` pochodzi z należącego do Plugin
  providera mediów `MiniMax-VL-01`.
- Dołączony katalog tekstowy MiniMax nadal zaczyna się od modeli tylko tekstowych; jawne
  wpisy `models.providers.minimax` materializują referencje czatu M2.7 obsługujące obrazy.

## Wskazówki dotyczące wyboru modelu

- Preferuj najsilniejszy najnowszej generacji model dostępny dla każdej możliwości mediów, gdy liczy się jakość i bezpieczeństwo.
- Dla agentów z włączonymi narzędziami obsługujących niezaufane dane wejściowe unikaj starszych/słabszych modeli mediów.
- Zachowaj co najmniej jeden fallback na możliwość dla dostępności (model jakościowy + model szybszy/tańszy).
- Fallbacki CLI (`whisper-cli`, `whisper`, `gemini`) są przydatne, gdy API providerów są niedostępne.
- Uwaga dotycząca `parakeet-mlx`: z `--output-dir` OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy format wyjściowy to `txt` (lub nieokreślony); formaty inne niż `txt` wracają do stdout.

## Polityka załączników

Per możliwość `attachments` kontroluje, które załączniki są przetwarzane:

- `mode`: `first` (domyślnie) lub `all`
- `maxAttachments`: ogranicza liczbę przetwarzanych (domyślnie **1**)
- `prefer`: `first`, `last`, `path`, `url`

Gdy `mode: "all"`, wyniki są oznaczane jako `[Image 1/2]`, `[Audio 2/2]` itd.

Zachowanie ekstrakcji załączników plikowych:

- Wyodrębniony tekst pliku jest opakowywany jako **niezaufana treść zewnętrzna**, zanim
  zostanie dołączony do promptu mediów.
- Wstrzykiwany blok używa jawnych znaczników granicznych, takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, i zawiera linię metadanych
  `Source: External`.
- Ta ścieżka ekstrakcji załączników celowo pomija długi baner
  `SECURITY NOTICE:`, aby nie rozdąć promptu mediów; znaczniki graniczne
  i metadane nadal pozostają.
- Jeśli plik nie ma tekstu możliwego do wyodrębnienia, OpenClaw wstrzykuje `[No extractable text]`.
- Jeśli PDF na tej ścieżce wraca do renderowanych obrazów stron, prompt mediów zachowuje
  placeholder `[PDF content rendered to images; images not forwarded to model]`,
  ponieważ ten krok ekstrakcji załączników przekazuje bloki tekstowe, a nie renderowane obrazy PDF.

## Przykłady konfiguracji

### 1) Współdzielona lista modeli + nadpisania

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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
          { provider: "openai", model: "gpt-5.5" },
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

Gdy działa rozumienie mediów, `/status` zawiera krótką linię podsumowania:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Pokazuje to wyniki per możliwość oraz wybrany provider/model, gdy ma to zastosowanie.

## Uwagi

- Rozumienie jest wykonywane metodą **best-effort**. Błędy nie blokują odpowiedzi.
- Załączniki są nadal przekazywane do modeli nawet wtedy, gdy rozumienie jest wyłączone.
- Użyj `scope`, aby ograniczyć miejsca, w których działa rozumienie (np. tylko DM).

## Powiązana dokumentacja

- [Configuration](/pl/gateway/configuration)
- [Image & Media Support](/pl/nodes/images)
