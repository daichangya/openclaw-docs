---
read_when:
    - Wyjaśnianie użycia tokenów, kosztów lub okien kontekstu
    - Debugowanie narastania kontekstu lub zachowania Compaction
summary: Jak OpenClaw buduje kontekst promptu i raportuje użycie tokenów oraz koszty
title: Użycie tokenów i koszty
x-i18n:
    generated_at: "2026-04-26T11:41:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# Użycie tokenów i koszty

OpenClaw śledzi **tokeny**, a nie znaki. Tokeny są zależne od modelu, ale większość
modeli w stylu OpenAI ma średnio około 4 znaków na token dla tekstu angielskiego.

## Jak budowany jest prompt systemowy

OpenClaw składa własny prompt systemowy przy każdym uruchomieniu. Obejmuje on:

- Listę narzędzi + krótkie opisy
- Listę Skills (tylko metadane; instrukcje są ładowane na żądanie przez `read`).
  Zwarty blok Skills jest ograniczony przez `skills.limits.maxSkillsPromptChars`,
  z opcjonalnym nadpisaniem per agent w
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instrukcje samoaktualizacji
- Obszar roboczy + pliki bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, gdy jest nowy, oraz `MEMORY.md`, gdy jest obecny). Małe litery w głównym katalogu `memory.md` nie są wstrzykiwane; to starsze wejście naprawcze dla `openclaw doctor --fix`, gdy występuje razem z `MEMORY.md`. Duże pliki są obcinane przez `agents.defaults.bootstrapMaxChars` (domyślnie: 12000), a całkowite wstrzyknięcie bootstrap jest ograniczone przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). Dzienne pliki `memory/*.md` nie są częścią normalnego promptu bootstrap; pozostają dostępne na żądanie przez narzędzia pamięci w zwykłych turach, ale samo `/new` i `/reset` może poprzedzić pierwszą turę jednorazowym blokiem kontekstu startowego z ostatnią dzienną pamięcią. Ten wstęp startowy jest kontrolowany przez `agents.defaults.startupContext`.
- Czas (UTC + strefa czasowa użytkownika)
- Tagi odpowiedzi + zachowanie Heartbeat
- Metadane środowiska uruchomieniowego (host/OS/model/thinking)

Pełny podział znajdziesz w [Prompt systemowy](/pl/concepts/system-prompt).

## Co liczy się do okna kontekstu

Wszystko, co otrzymuje model, liczy się do limitu kontekstu:

- Prompt systemowy (wszystkie sekcje wymienione powyżej)
- Historia rozmowy (wiadomości użytkownika + asystenta)
- Wywołania narzędzi i wyniki narzędzi
- Załączniki/transkrypcje (obrazy, audio, pliki)
- Podsumowania Compaction i artefakty przycinania
- Opakowania dostawcy lub nagłówki bezpieczeństwa (niewidoczne, ale nadal liczone)

Niektóre powierzchnie intensywnie używane w środowisku uruchomieniowym mają własne jawne limity:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Nadpisania per agent znajdują się w `agents.list[].contextLimits`. Te ustawienia
dotyczą ograniczonych fragmentów środowiska uruchomieniowego i wstrzykiwanych bloków należących do środowiska uruchomieniowego. Są one
oddzielne od limitów bootstrap, limitów kontekstu startowego i limitów promptu
Skills.

W przypadku obrazów OpenClaw skaluje w dół ładunki obrazów z transkryptów/narzędzi przed wywołaniami dostawcy.
Użyj `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`), aby to dostroić:

- Niższe wartości zwykle zmniejszają użycie tokenów wizji i rozmiar ładunku.
- Wyższe wartości zachowują więcej szczegółów wizualnych dla zrzutów ekranu z OCR/interfejsem.

Aby uzyskać praktyczny podział (na wstrzyknięty plik, narzędzia, Skills i rozmiar promptu systemowego), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Jak zobaczyć bieżące użycie tokenów

Użyj tego na czacie:

- `/status` → **karta statusu bogata w emoji** z modelem sesji, użyciem kontekstu,
  tokenami wejścia/wyjścia ostatniej odpowiedzi i **szacowanym kosztem**
  (tylko klucz API).
- `/usage off|tokens|full` → dodaje **stopkę użycia per odpowiedź** do każdej odpowiedzi.
  - Jest trwałe per sesję (zapisywane jako `responseUsage`).
  - Uwierzytelnianie OAuth **ukrywa koszt** (tylko tokeny).
- `/usage cost` → pokazuje lokalne podsumowanie kosztów na podstawie logów sesji OpenClaw.

Inne powierzchnie:

- **TUI/Web TUI:** `/status` i `/usage` są obsługiwane.
- **CLI:** `openclaw status --usage` i `openclaw channels list` pokazują
  znormalizowane okna limitów dostawców (`X% left`, a nie koszty per odpowiedź).
  Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.

Powierzchnie użycia normalizują typowe aliasy pól natywnych dostawców przed wyświetleniem.
Dla ruchu OpenAI-family Responses obejmuje to zarówno `input_tokens` /
`output_tokens`, jak i `prompt_tokens` / `completion_tokens`, tak aby nazwy pól zależne od transportu
nie zmieniały `/status`, `/usage` ani podsumowań sesji.
Użycie JSON Gemini CLI jest również normalizowane: tekst odpowiedzi pochodzi z `response`, a
`stats.cached` mapuje do `cacheRead`, przy czym `stats.input_tokens - stats.cached`
jest używane, gdy CLI pomija jawne pole `stats.input`.
Dla natywnego ruchu OpenAI-family Responses aliasy użycia WebSocket/SSE są
normalizowane w ten sam sposób, a sumy wracają do znormalizowanego wejścia + wyjścia, gdy
`total_tokens` nie występuje lub ma wartość `0`.
Gdy bieżący snapshot sesji jest ubogi, `/status` i `session_status` mogą
również odzyskiwać liczniki tokenów/cache oraz etykietę aktywnego modelu środowiska uruchomieniowego z
najnowszego logu użycia transkryptu. Istniejące niezerowe wartości na żywo nadal mają
pierwszeństwo przed wartościami odzyskanymi z transkryptu, a większe sumy z transkryptu zorientowane na prompt
mogą wygrać, gdy zapisane sumy nie występują lub są mniejsze.
Uwierzytelnianie użycia dla okien limitów dostawców pochodzi z haków specyficznych dla dostawcy, gdy są dostępne;
w przeciwnym razie OpenClaw wraca do dopasowania danych uwierzytelniających OAuth/klucza API
z profili uwierzytelniania, środowiska lub konfiguracji.
Wpisy transkryptu asystenta utrwalają ten sam znormalizowany kształt użycia, w tym
`usage.cost`, gdy aktywny model ma skonfigurowane ceny, a dostawca zwraca metadane użycia.
Dzięki temu `/usage cost` i status sesji oparty na transkryptach mają stabilne źródło nawet po zniknięciu stanu środowiska uruchomieniowego na żywo.

OpenClaw utrzymuje rozliczanie użycia dostawcy oddzielnie od bieżącego snapshotu kontekstu.
`usage.total` dostawcy może obejmować wejście z cache, wyjście i wiele wywołań modelu w pętli narzędzi, więc
jest przydatne do kosztów i telemetrii, ale może zawyżać aktywne okno kontekstu.
Wyświetlanie kontekstu i diagnostyka używają najnowszego snapshotu promptu
(`promptTokens`, albo ostatniego wywołania modelu, gdy snapshot promptu nie jest dostępny) dla `context.used`.

## Szacowanie kosztów (gdy jest wyświetlane)

Koszty są szacowane na podstawie konfiguracji cen modelu:

```
models.providers.<provider>.models[].cost
```

Są to wartości **USD za 1 mln tokenów** dla `input`, `output`, `cacheRead` i
`cacheWrite`. Jeśli brakuje cen, OpenClaw pokazuje tylko tokeny. Tokeny OAuth
nigdy nie pokazują kosztu w dolarach.

## Wpływ TTL cache i przycinania

Cache promptów dostawcy ma zastosowanie tylko w obrębie okna TTL cache. OpenClaw może
opcjonalnie uruchamiać **przycinanie cache-ttl**: przycina sesję po wygaśnięciu TTL
cache, a następnie resetuje okno cache, aby kolejne żądania mogły ponownie używać
świeżo zapisanych w cache kontekstów zamiast ponownego cachowania pełnej historii.
Utrzymuje to niższe koszty zapisu do cache, gdy sesja pozostaje bezczynna po upływie TTL.

Skonfiguruj to w [Konfiguracja Gateway](/pl/gateway/configuration), a szczegóły
zachowania znajdziesz w [Przycinanie sesji](/pl/concepts/session-pruning).

Heartbeat może utrzymywać cache **ciepły** podczas przerw bezczynności. Jeśli TTL cache modelu
wynosi `1h`, ustawienie interwału heartbeat tuż poniżej tej wartości (np. `55m`) może uniknąć
ponownego cachowania pełnego promptu, zmniejszając koszty zapisu do cache.

W konfiguracjach z wieloma agentami możesz zachować jedną współdzieloną konfigurację modelu i dostrajać zachowanie cache
per agent przez `agents.list[].params.cacheRetention`.

Pełny przewodnik po wszystkich ustawieniach znajdziesz w [Prompt Caching](/pl/reference/prompt-caching).

W przypadku cen Anthropic API odczyty z cache są znacznie tańsze niż tokeny wejściowe,
podczas gdy zapisy do cache są rozliczane z wyższym mnożnikiem. Najnowsze stawki i mnożniki TTL
znajdziesz w dokumentacji cen prompt caching Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Przykład: utrzymanie ciepłego cache 1h za pomocą heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Przykład: ruch mieszany ze strategią cache per agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # domyślna baza dla większości agentów
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # utrzymuje ciepły długi cache dla głębokich sesji
    - id: "alerts"
      params:
        cacheRetention: "none" # unika zapisów do cache dla skokowych powiadomień
```

`agents.list[].params` scala się na wierzchu `params` wybranego modelu, więc możesz
nadpisać tylko `cacheRetention` i odziedziczyć pozostałe domyślne wartości modelu bez zmian.

### Przykład: włączenie nagłówka beta Anthropic 1M context

Okno kontekstu 1M Anthropic jest obecnie dostępne tylko w becie. OpenClaw może wstrzyknąć
wymaganą wartość `anthropic-beta`, gdy włączysz `context1m` dla obsługiwanych modeli Opus
lub Sonnet.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Mapuje się to na nagłówek beta Anthropic `context-1m-2025-08-07`.

Dotyczy to tylko sytuacji, gdy `context1m: true` jest ustawione dla tego wpisu modelu.

Wymaganie: dane uwierzytelniające muszą kwalifikować się do użycia długiego kontekstu. Jeśli nie,
Anthropic zwróci dla tego żądania błąd limitu po stronie dostawcy.

Jeśli uwierzytelniasz Anthropic za pomocą tokenów OAuth/subskrypcji (`sk-ant-oat-*`),
OpenClaw pomija nagłówek beta `context-1m-*`, ponieważ Anthropic obecnie
odrzuca takie połączenie kodem HTTP 401.

## Wskazówki dotyczące zmniejszania presji tokenów

- Użyj `/compact`, aby podsumować długie sesje.
- Ograniczaj duże wyniki narzędzi w swoich przepływach pracy.
- Obniż `agents.defaults.imageMaxDimensionPx` dla sesji z dużą liczbą zrzutów ekranu.
- Utrzymuj krótkie opisy Skills (lista Skills jest wstrzykiwana do promptu).
- Preferuj mniejsze modele do rozwlekłej, eksploracyjnej pracy.

Dokładny wzór narzutu listy Skills znajdziesz w [Skills](/pl/tools/skills).

## Powiązane

- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Prompt caching](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
