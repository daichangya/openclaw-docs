---
read_when:
    - Chcesz zmniejszyć koszty tokenów promptów przez utrzymywanie cache
    - Potrzebujesz zachowania cache per agent w konfiguracjach wielu agentów
    - Dostrajasz Heartbeat i przycinanie cache-ttl jednocześnie
summary: Ustawienia prompt caching, kolejność scalania, zachowanie providerów i wzorce dostrajania
title: Prompt caching
x-i18n:
    generated_at: "2026-04-25T13:57:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

Prompt caching oznacza, że provider modelu może ponownie używać niezmienionych prefiksów promptu (zwykle instrukcji system/developer i innego stabilnego kontekstu) między turami zamiast przetwarzać je od nowa za każdym razem. OpenClaw normalizuje użycie providera do `cacheRead` i `cacheWrite`, gdy upstream API udostępnia te liczniki bezpośrednio.

Powierzchnie statusu mogą również odzyskiwać liczniki cache z najnowszego logu
użycia w transkrypcie, gdy ich brakuje w migawce live sesji, dzięki czemu `/status` może nadal
pokazywać wiersz cache po częściowej utracie metadanych sesji. Istniejące niezerowe wartości live
cache nadal mają pierwszeństwo przed wartościami fallback z transkryptu.

Dlaczego to ma znaczenie: niższy koszt tokenów, szybsze odpowiedzi i bardziej przewidywalna wydajność w długotrwałych sesjach. Bez cache powtarzane prompty płacą pełny koszt promptu przy każdej turze, nawet jeśli większość wejścia się nie zmieniła.

Poniższe sekcje obejmują wszystkie ustawienia związane z cache, które wpływają na ponowne użycie promptów i koszt tokenów.

Dokumentacja providerów:

- Prompt caching Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Prompt caching OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Nagłówki API OpenAI i identyfikatory żądań: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Identyfikatory żądań i błędy Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Główne ustawienia

### `cacheRetention` (domyślnie globalnie, dla modelu i per agent)

Ustaw retencję cache jako globalną wartość domyślną dla wszystkich modeli:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Nadpisanie per model:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Nadpisanie per agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Kolejność scalania konfiguracji:

1. `agents.defaults.params` (globalna wartość domyślna — dotyczy wszystkich modeli)
2. `agents.defaults.models["provider/model"].params` (nadpisanie per model)
3. `agents.list[].params` (pasujący identyfikator agenta; nadpisuje po kluczu)

### `contextPruning.mode: "cache-ttl"`

Przycina stary kontekst wyników narzędzi po oknach TTL cache, dzięki czemu żądania po okresie bezczynności nie zapisują ponownie zbyt dużej historii do cache.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Pełne zachowanie znajdziesz w [Przycinanie sesji](/pl/concepts/session-pruning).

### Heartbeat keep-warm

Heartbeat może utrzymywać okna cache w stanie warm i ograniczać powtarzane zapisy do cache po przerwach bezczynności.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agent jest obsługiwany pod `agents.list[].heartbeat`.

## Zachowanie providerów

### Anthropic (bezpośrednie API)

- `cacheRetention` jest obsługiwane.
- W przypadku profili uwierzytelniania kluczem API Anthropic OpenClaw ustawia domyślnie `cacheRetention: "short"` dla referencji modeli Anthropic, jeśli ta wartość nie jest ustawiona.
- Natywne odpowiedzi Anthropic Messages udostępniają zarówno `cache_read_input_tokens`, jak i `cache_creation_input_tokens`, więc OpenClaw może pokazywać zarówno `cacheRead`, jak i `cacheWrite`.
- Dla natywnych żądań Anthropic `cacheRetention: "short"` mapuje się do domyślnego 5-minutowego ephemeral cache, a `cacheRetention: "long"` podnosi TTL do 1 godziny tylko na bezpośrednich hostach `api.anthropic.com`.

### OpenAI (bezpośrednie API)

- Prompt caching jest automatyczny w obsługiwanych nowszych modelach. OpenClaw nie musi wstrzykiwać znaczników cache na poziomie bloków.
- OpenClaw używa `prompt_cache_key`, aby utrzymać stabilny routing cache między turami, i używa `prompt_cache_retention: "24h"` tylko wtedy, gdy wybrane jest `cacheRetention: "long"` na bezpośrednich hostach OpenAI.
- Providery OpenAI-compatible Completions otrzymują `prompt_cache_key` tylko wtedy, gdy konfiguracja modelu jawnie ustawia `compat.supportsPromptCacheKey: true`; `cacheRetention: "none"` nadal to wycisza.
- OpenAI udostępnia tokeny cache promptu przez `usage.prompt_tokens_details.cached_tokens` (albo `input_tokens_details.cached_tokens` w zdarzeniach Responses API). OpenClaw mapuje to do `cacheRead`.
- OpenAI nie udostępnia osobnego licznika tokenów zapisu do cache, więc `cacheWrite` pozostaje równe `0` na ścieżkach OpenAI, nawet gdy provider rozgrzewa cache.
- OpenAI zwraca przydatne nagłówki śledzenia i limitów szybkości, takie jak `x-request-id`, `openai-processing-ms` i `x-ratelimit-*`, ale rozliczanie trafień cache powinno pochodzić z ładunku usage, a nie z nagłówków.
- W praktyce OpenAI często zachowuje się jak cache początkowego prefiksu, a nie jak pełne ponowne użycie całej historii w stylu Anthropic. Stabilne tury tekstowe z długim prefiksem mogą w bieżących sondach live osiągać plateau bliskie `4864` cached tokens, podczas gdy transkrypty z dużą liczbą narzędzi lub w stylu MCP często stabilizują się w okolicach `4608` cached tokens nawet przy dokładnych powtórzeniach.

### Anthropic Vertex

- Modele Anthropic na Vertex AI (`anthropic-vertex/*`) obsługują `cacheRetention` tak samo jak bezpośredni Anthropic.
- `cacheRetention: "long"` mapuje się do rzeczywistego 1-godzinnego TTL prompt-cache na endpointach Vertex AI.
- Domyślna retencja cache dla `anthropic-vertex` odpowiada bezpośrednim ustawieniom domyślnym Anthropic.
- Żądania Vertex są kierowane przez cache shaping uwzględniający granice, dzięki czemu ponowne użycie cache pozostaje zgodne z tym, co providery faktycznie otrzymują.

### Amazon Bedrock

- Referencje modeli Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) obsługują jawne przekazywanie `cacheRetention`.
- Modele Bedrock inne niż Anthropic są wymuszane w runtime do `cacheRetention: "none"`.

### Modele OpenRouter

Dla referencji modeli `openrouter/anthropic/*` OpenClaw wstrzykuje Anthropic
`cache_control` do bloków promptu system/developer, aby poprawić ponowne użycie
prompt-cache tylko wtedy, gdy żądanie nadal trafia do zweryfikowanej trasy OpenRouter
(`openrouter` na domyślnym endpointcie albo dowolny provider/base URL rozwiązujący się
do `openrouter.ai`).

Dla referencji modeli `openrouter/deepseek/*`, `openrouter/moonshot*/*` i `openrouter/zai/*`
dozwolone jest `contextPruning.mode: "cache-ttl"`, ponieważ OpenRouter
automatycznie obsługuje prompt caching po stronie providera. OpenClaw nie wstrzykuje
znaczników Anthropic `cache_control` do tych żądań.

Tworzenie cache DeepSeek działa w trybie best-effort i może potrwać kilka sekund. Natychmiastowy
follow-up może nadal pokazać `cached_tokens: 0`; zweryfikuj to przez powtórzone żądanie
z tym samym prefiksem po krótkim opóźnieniu i użyj `usage.prompt_tokens_details.cached_tokens`
jako sygnału trafienia cache.

Jeśli przekierujesz model na dowolny adres URL arbitralnego proxy zgodnego z OpenAI, OpenClaw
przestaje wstrzykiwać te znaczniki cache Anthropic specyficzne dla OpenRouter.

### Inni providery

Jeśli provider nie obsługuje tego trybu cache, `cacheRetention` nie ma żadnego efektu.

### Bezpośrednie API Google Gemini

- Bezpośredni transport Gemini (`api: "google-generative-ai"`) raportuje trafienia cache
  przez upstream `cachedContentTokenCount`; OpenClaw mapuje to do `cacheRead`.
- Gdy `cacheRetention` jest ustawione dla bezpośredniego modelu Gemini, OpenClaw automatycznie
  tworzy, ponownie używa i odświeża zasoby `cachedContents` dla promptów systemowych
  w przebiegach Google AI Studio. Oznacza to, że nie musisz już ręcznie tworzyć
  uchwytu cached-content.
- Nadal możesz przekazać istniejący uchwyt Gemini cached-content jako
  `params.cachedContent` (lub starsze `params.cached_content`) na skonfigurowanym
  modelu.
- To jest oddzielne od prompt-prefix caching Anthropic/OpenAI. W przypadku Gemini
  OpenClaw zarządza natywnym dla providera zasobem `cachedContents` zamiast
  wstrzykiwać znaczniki cache do żądania.

### Użycie JSON Gemini CLI

- Wyjście JSON Gemini CLI może również pokazywać trafienia cache przez `stats.cached`;
  OpenClaw mapuje to do `cacheRead`.
- Jeśli CLI pomija bezpośrednią wartość `stats.input`, OpenClaw wyprowadza tokeny wejściowe
  z `stats.input_tokens - stats.cached`.
- To tylko normalizacja usage. Nie oznacza to, że OpenClaw tworzy
  znaczniki prompt-cache w stylu Anthropic/OpenAI dla Gemini CLI.

## Granica cache promptu systemowego

OpenClaw dzieli prompt systemowy na **stabilny prefiks** i **zmienny
sufiks** oddzielone wewnętrzną granicą cache-prefiksu. Zawartość ponad
granicą (definicje narzędzi, metadane Skills, pliki obszaru roboczego i inny
względnie statyczny kontekst) jest uporządkowana tak, aby pozostawała
identyczna bajt po bajcie między turami. Zawartość poniżej granicy (na przykład `HEARTBEAT.md`, znaczniki czasu runtime i inne
metadane per tura) może się zmieniać bez unieważniania zapisanego w cache
prefiksu.

Kluczowe decyzje projektowe:

- Stabilne pliki kontekstu projektu w obszarze roboczym są porządkowane przed `HEARTBEAT.md`, tak aby
  zmiany Heartbeat nie psuły stabilnego prefiksu.
- Granica jest stosowana w shapingu cache dla rodzin Anthropic, OpenAI, Google i
  transportów CLI, dzięki czemu wszyscy obsługiwani providery korzystają z tej samej stabilności prefiksu.
- Żądania Codex Responses i Anthropic Vertex są kierowane przez
  cache shaping uwzględniający granice, dzięki czemu ponowne użycie cache pozostaje zgodne z tym, co providery rzeczywiście otrzymują.
- Odciski promptów systemowych są normalizowane (białe znaki, końce linii,
  kontekst dodany przez hooki, kolejność capability runtime), dzięki czemu
  semantycznie niezmienione prompty współdzielą KV/cache między turami.

Jeśli widzisz nieoczekiwane skoki `cacheWrite` po zmianie konfiguracji lub obszaru roboczego,
sprawdź, czy zmiana trafia powyżej czy poniżej granicy cache. Przeniesienie
zmiennej zawartości poniżej granicy (albo jej ustabilizowanie) często rozwiązuje
problem.

## Osłony stabilności cache OpenClaw

OpenClaw utrzymuje również deterministyczny kształt kilku ładunków wrażliwych na cache
zanim żądanie trafi do providera:

- Katalogi narzędzi bundle MCP są sortowane deterministycznie przed
  rejestracją narzędzi, dzięki czemu zmiany kolejności `listTools()` nie powodują zmian w bloku narzędzi i nie psują prefiksów prompt-cache.
- Starsze sesje z utrwalonymi blokami obrazów zachowują **3 najnowsze
  ukończone tury** bez zmian; starsze już przetworzone bloki obrazów mogą być
  zastępowane znacznikiem, tak aby follow-upy z dużą liczbą obrazów nie wysyłały ponownie dużych
  przestarzałych ładunków.

## Wzorce dostrajania

### Ruch mieszany (zalecana domyślna konfiguracja)

Utrzymuj długowieczną bazę na głównym agencie, a wyłącz cache na agentach powiadomień o gwałtownym ruchu:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Baza nastawiona na koszt

- Ustaw bazowe `cacheRetention: "short"`.
- Włącz `contextPruning.mode: "cache-ttl"`.
- Utrzymuj Heartbeat poniżej swojego TTL tylko dla agentów, które korzystają z warm caches.

## Diagnostyka cache

OpenClaw udostępnia dedykowaną diagnostykę śledzenia cache dla osadzonych uruchomień agentów.

W przypadku zwykłej diagnostyki widocznej dla użytkownika `/status` i inne podsumowania użycia mogą używać
najnowszego wpisu usage w transkrypcie jako fallbackowego źródła `cacheRead` /
`cacheWrite`, gdy wpis live sesji nie ma tych liczników.

## Testy regresji live

OpenClaw utrzymuje jedną wspólną bramkę regresji live dla powtarzanych prefiksów, tur narzędzi, tur obrazów, transkryptów narzędzi w stylu MCP oraz kontroli no-cache Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Uruchom wąską bramkę live przez:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Plik bazowy przechowuje ostatnio zaobserwowane liczby live oraz progi regresji specyficzne dla providerów używane przez test.
Runner używa również nowych identyfikatorów sesji i przestrzeni nazw promptów dla każdego uruchomienia, dzięki czemu poprzedni stan cache nie zanieczyszcza bieżącej próbki regresji.

Te testy celowo nie używają identycznych kryteriów powodzenia dla wszystkich providerów.

### Oczekiwania live dla Anthropic

- Oczekuj jawnych zapisów rozgrzewających przez `cacheWrite`.
- Oczekuj niemal pełnego ponownego użycia historii w powtarzanych turach, ponieważ kontrola cache Anthropic przesuwa punkt graniczny cache przez całą konwersację.
- Bieżące asercje live nadal używają wysokich progów trafień dla stabilnych ścieżek, narzędzi i obrazów.

### Oczekiwania live dla OpenAI

- Oczekuj tylko `cacheRead`. `cacheWrite` pozostaje równe `0`.
- Traktuj ponowne użycie cache w powtarzanych turach jako plateau specyficzne dla providera, a nie jako przesuwające się pełne ponowne użycie historii w stylu Anthropic.
- Bieżące asercje live używają zachowawczych progów minimalnych wyprowadzonych z zaobserwowanego zachowania live na `gpt-5.4-mini`:
  - stabilny prefiks: `cacheRead >= 4608`, współczynnik trafień `>= 0.90`
  - transkrypt narzędzia: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`
  - transkrypt obrazu: `cacheRead >= 3840`, współczynnik trafień `>= 0.82`
  - transkrypt w stylu MCP: `cacheRead >= 4096`, współczynnik trafień `>= 0.85`

Świeża wspólna weryfikacja live z 2026-04-04 zakończyła się wartościami:

- stabilny prefiks: `cacheRead=4864`, współczynnik trafień `0.966`
- transkrypt narzędzia: `cacheRead=4608`, współczynnik trafień `0.896`
- transkrypt obrazu: `cacheRead=4864`, współczynnik trafień `0.954`
- transkrypt w stylu MCP: `cacheRead=4608`, współczynnik trafień `0.891`

Ostatni lokalny czas wall-clock dla wspólnej bramki wynosił około `88s`.

Dlaczego asercje się różnią:

- Anthropic udostępnia jawne punkty graniczne cache i przesuwające się ponowne użycie historii konwersacji.
- Prompt caching OpenAI nadal jest wrażliwy na dokładny prefiks, ale efektywny prefiks nadający się do ponownego użycia w ruchu live Responses może osiągnąć plateau wcześniej niż pełny prompt.
- Z tego powodu porównywanie Anthropic i OpenAI jednym wspólnym progiem procentowym między providerami powoduje fałszywe regresje.

### Konfiguracja `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opcjonalne
    includeMessages: false # domyślnie true
    includePrompt: false # domyślnie true
    includeSystem: false # domyślnie true
```

Wartości domyślne:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Przełączniki env (jednorazowe debugowanie)

- `OPENCLAW_CACHE_TRACE=1` włącza śledzenie cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` nadpisuje ścieżkę wyjściową.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` przełącza przechwytywanie pełnego ładunku wiadomości.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` przełącza przechwytywanie tekstu promptu.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` przełącza przechwytywanie promptu systemowego.

### Co sprawdzać

- Zdarzenia śledzenia cache mają format JSONL i zawierają etapowe migawki, takie jak `session:loaded`, `prompt:before`, `stream:context` i `session:after`.
- Wpływ tokenów cache per tura jest widoczny w zwykłych powierzchniach usage przez `cacheRead` i `cacheWrite` (na przykład `/usage full` i podsumowania usage sesji).
- Dla Anthropic oczekuj zarówno `cacheRead`, jak i `cacheWrite`, gdy cache jest aktywne.
- Dla OpenAI oczekuj `cacheRead` przy trafieniach cache, a `cacheWrite` powinno pozostać równe `0`; OpenAI nie publikuje osobnego pola tokenów zapisu do cache.
- Jeśli potrzebujesz śledzenia żądań, loguj identyfikatory żądań i nagłówki limitów szybkości osobno od metryk cache. Bieżące wyjście śledzenia cache OpenClaw koncentruje się na kształcie promptu/sesji i znormalizowanym usage tokenów, a nie na surowych nagłówkach odpowiedzi providera.

## Szybkie rozwiązywanie problemów

- Wysokie `cacheWrite` w większości tur: sprawdź zmienne wejścia promptu systemowego i zweryfikuj, czy model/provider obsługuje Twoje ustawienia cache.
- Wysokie `cacheWrite` w Anthropic: często oznacza, że punkt graniczny cache trafia na treść, która zmienia się przy każdym żądaniu.
- Niskie `cacheRead` w OpenAI: sprawdź, czy stabilny prefiks znajduje się na początku, powtarzany prefiks ma co najmniej 1024 tokeny i dla tur, które mają współdzielić cache, ponownie używany jest ten sam `prompt_cache_key`.
- Brak efektu `cacheRetention`: potwierdź, że klucz modelu pasuje do `agents.defaults.models["provider/model"]`.
- Żądania Bedrock Nova/Mistral z ustawieniami cache: oczekiwane wymuszenie runtime do `none`.

Powiązana dokumentacja:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Dokumentacja konfiguracji Gateway](/pl/gateway/configuration-reference)

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
