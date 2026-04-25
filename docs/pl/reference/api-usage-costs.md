---
read_when:
    - Chcesz zrozumieć, które funkcje mogą wywoływać płatne interfejsy API
    - Potrzebujesz przeprowadzić audyt kluczy, kosztów i widoczności użycia
    - Wyjaśniasz raportowanie kosztów w `/status` lub `/usage`
summary: Sprawdź, co może generować koszty, które klucze są używane i jak wyświetlić użycie
title: Użycie API i koszty
x-i18n:
    generated_at: "2026-04-25T13:57:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Użycie API i koszty

Ten dokument zawiera listę **funkcji, które mogą wywoływać klucze API** oraz informację, gdzie pojawiają się ich koszty. Skupia się na
funkcjach OpenClaw, które mogą generować użycie dostawców lub płatne wywołania API.

## Gdzie pojawiają się koszty (czat + CLI)

**Migawka kosztów dla sesji**

- `/status` pokazuje bieżący model sesji, użycie kontekstu i tokeny ostatniej odpowiedzi.
- Jeśli model używa **uwierzytelniania kluczem API**, `/status` pokazuje także **szacowany koszt** ostatniej odpowiedzi.
- Jeśli metadane aktywnej sesji są ograniczone, `/status` może odzyskać liczniki
  tokenów/pamięci podręcznej oraz etykietę aktywnego modelu środowiska wykonawczego z najnowszego wpisu użycia w transkrypcji.
  Istniejące niezerowe wartości aktywne nadal mają pierwszeństwo, a sumy transkrypcji o rozmiarze promptu mogą wygrywać, gdy zapisane sumy są nieobecne lub mniejsze.

**Stopka kosztu dla wiadomości**

- `/usage full` dodaje stopkę użycia do każdej odpowiedzi, w tym **szacowany koszt** (tylko klucz API).
- `/usage tokens` pokazuje tylko tokeny; przepływy subskrypcyjne OAuth/token oraz CLI ukrywają koszt w dolarach.
- Uwaga dotycząca Gemini CLI: gdy CLI zwraca dane wyjściowe JSON, OpenClaw odczytuje użycie z
  `stats`, normalizuje `stats.cached` do `cacheRead` i w razie potrzeby wylicza tokeny wejściowe
  z `stats.input_tokens - stats.cached`.

Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest
znów dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako
zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
Anthropic nadal nie udostępnia szacunku kosztu w dolarach dla pojedynczej wiadomości, który OpenClaw mógłby
pokazać w `/usage full`.

**Okna użycia CLI (limity dostawców)**

- `openclaw status --usage` i `openclaw channels list` pokazują **okna użycia** dostawców
  (migawki limitów, a nie koszty pojedynczych wiadomości).
- Dane wyjściowe dla ludzi są normalizowane do postaci `X% left` u wszystkich dostawców.
- Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.
- Uwaga dotycząca MiniMax: surowe pola `usage_percent` / `usagePercent` oznaczają
  pozostały limit, więc OpenClaw odwraca je przed wyświetleniem. Pola oparte na liczbie nadal mają pierwszeństwo,
  jeśli są obecne. Jeśli dostawca zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu,
  w razie potrzeby wyprowadza etykietę okna ze znaczników czasu i
  uwzględnia nazwę modelu w etykiecie planu.
- Uwierzytelnianie użycia dla tych okien limitów pochodzi z hooków specyficznych dla dostawców, jeśli są dostępne;
  w przeciwnym razie OpenClaw wraca do dopasowywania poświadczeń OAuth/klucza API
  z profili uwierzytelniania, środowiska lub konfiguracji.

Szczegóły i przykłady znajdziesz w [Użycie tokenów i koszty](/pl/reference/token-use).

## Jak wykrywane są klucze

OpenClaw może pobierać poświadczenia z:

- **Profili uwierzytelniania** (na agenta, przechowywane w `auth-profiles.json`).
- **Zmiennych środowiskowych** (na przykład `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguracji** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), które mogą eksportować klucze do środowiska procesu skill.

## Funkcje, które mogą zużywać klucze

### 1) Odpowiedzi modelu rdzeniowego (czat + narzędzia)

Każda odpowiedź lub wywołanie narzędzia używa **bieżącego dostawcy modeli** (OpenAI, Anthropic itd.). To
główne źródło użycia i kosztów.

Obejmuje to także hostowanych dostawców w stylu subskrypcyjnym, którzy nadal rozliczają się poza
lokalnym interfejsem OpenClaw, takich jak **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** oraz
ścieżka logowania Anthropic Claude w OpenClaw z włączonym **Extra Usage**.

Zobacz [Modele](/pl/providers/models), aby poznać konfigurację cen, oraz [Użycie tokenów i koszty](/pl/reference/token-use), aby poznać sposób wyświetlania.

### 2) Rozumienie multimediów (audio/obraz/wideo)

Przychodzące multimedia mogą zostać podsumowane lub przetranskrybowane przed wygenerowaniem odpowiedzi. W tym celu używane są API modeli/dostawców.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Obraz: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Wideo: Google / Qwen / Moonshot.

Zobacz [Rozumienie multimediów](/pl/nodes/media-understanding).

### 3) Generowanie obrazów i wideo

Współdzielone możliwości generowania również mogą zużywać klucze dostawców:

- Generowanie obrazów: OpenAI / Google / fal / MiniMax
- Generowanie wideo: Qwen

Generowanie obrazów może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu, gdy
`agents.defaults.imageGenerationModel` nie jest ustawione. Generowanie wideo obecnie
wymaga jawnego `agents.defaults.videoGenerationModel`, takiego jak
`qwen/wan2.6-t2v`.

Zobacz [Generowanie obrazów](/pl/tools/image-generation), [Qwen Cloud](/pl/providers/qwen)
i [Modele](/pl/concepts/models).

### 4) Embeddingi pamięci + wyszukiwanie semantyczne

Semantyczne wyszukiwanie pamięci używa **API embeddingów**, gdy skonfigurowane są zdalne dostawcy:

- `memorySearch.provider = "openai"` → embeddingi OpenAI
- `memorySearch.provider = "gemini"` → embeddingi Gemini
- `memorySearch.provider = "voyage"` → embeddingi Voyage
- `memorySearch.provider = "mistral"` → embeddingi Mistral
- `memorySearch.provider = "lmstudio"` → embeddingi LM Studio (lokalne/samohostowane)
- `memorySearch.provider = "ollama"` → embeddingi Ollama (lokalne/samohostowane; zwykle bez rozliczania hostowanego API)
- Opcjonalny fallback do zdalnego dostawcy, jeśli lokalne embeddingi zawiodą

Możesz pozostać lokalnie z `memorySearch.provider = "local"` (bez użycia API).

Zobacz [Pamięć](/pl/concepts/memory).

### 5) Narzędzie wyszukiwania w sieci

`web_search` może generować opłaty za użycie w zależności od dostawcy:

- **Brave Search API**: `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` lub `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: domyślnie bez klucza, ale wymaga osiągalnego hosta Ollama oraz `ollama signin`; może także ponownie używać zwykłego uwierzytelniania bearer dostawcy Ollama, gdy host tego wymaga
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback bez klucza (bez rozliczania API, ale nieoficjalny i oparty na HTML)
- **SearXNG**: `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (bez klucza/samohostowane; bez rozliczania hostowanego API)

Starsze ścieżki dostawcy `tools.web.search.*` nadal ładują się przez tymczasową warstwę zgodności, ale nie są już zalecaną powierzchnią konfiguracji.

**Darmowy kredyt Brave Search:** Każdy plan Brave zawiera odnawialny
darmowy kredyt w wysokości \$5/miesiąc. Plan Search kosztuje \$5 za 1000 żądań, więc kredyt pokrywa
1000 żądań miesięcznie bez opłat. Ustaw limit użycia w panelu Brave,
aby uniknąć nieoczekiwanych kosztów.

Zobacz [Narzędzia web](/pl/tools/web).

### 5) Narzędzie pobierania stron (Firecrawl)

`web_fetch` może wywoływać **Firecrawl**, gdy obecny jest klucz API:

- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webFetch.apiKey`

Jeśli Firecrawl nie jest skonfigurowany, narzędzie wraca do bezpośredniego pobierania oraz dołączonego Plugin `web-readability` (bez płatnego API). Wyłącz `plugins.entries.web-readability.enabled`, aby pominąć lokalne wyodrębnianie Readability.

Zobacz [Narzędzia web](/pl/tools/web).

### 6) Migawki użycia dostawcy (status/stan zdrowia)

Niektóre polecenia statusu wywołują **punkty końcowe użycia dostawców**, aby wyświetlać okna limitów lub stan uwierzytelniania.
Zwykle są to wywołania o małej liczbie, ale nadal trafiają do API dostawców:

- `openclaw status --usage`
- `openclaw models status --json`

Zobacz [CLI modeli](/pl/cli/models).

### 7) Podsumowanie zabezpieczenia Compaction

Zabezpieczenie Compaction może podsumować historię sesji przy użyciu **bieżącego modelu**, co
wywołuje API dostawców podczas działania.

Zobacz [Zarządzanie sesją + Compaction](/pl/reference/session-management-compaction).

### 8) Skanowanie / sondowanie modeli

`openclaw models scan` może sondować modele OpenRouter i używa `OPENROUTER_API_KEY`, gdy
sondowanie jest włączone.

Zobacz [CLI modeli](/pl/cli/models).

### 9) Talk (mowa)

Tryb Talk może wywoływać **ElevenLabs**, gdy jest skonfigurowany:

- `ELEVENLABS_API_KEY` lub `talk.providers.elevenlabs.apiKey`

Zobacz [Tryb Talk](/pl/nodes/talk).

### 10) Skills (API firm trzecich)

Skills mogą przechowywać `apiKey` w `skills.entries.<name>.apiKey`. Jeśli skill używa tego klucza do zewnętrznych
API, może generować koszty zgodnie z dostawcą danego skill.

Zobacz [Skills](/pl/tools/skills).

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Buforowanie promptów](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
