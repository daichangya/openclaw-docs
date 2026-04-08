---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkryptu lub pola sessions.json
    - Zmieniasz zachowanie auto-kompaktowania lub dodajesz porządki „przed kompaktowaniem”
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Szczegółowe omówienie: store sesji i transkrypty, cykl życia oraz mechanizmy (auto)kompaktowania'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-04-08T02:18:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1a4048646486693db8943a9e9c6c5bcb205f0ed532b34842de3d0346077454
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Zarządzanie sesjami i kompaktowanie (szczegółowe omówienie)

Ten dokument wyjaśnia, jak OpenClaw zarządza sesjami od początku do końca:

- **Routowanie sesji** (jak wiadomości przychodzące mapują się na `sessionKey`)
- **Store sesji** (`sessions.json`) i co śledzi
- **Trwałość transkryptu** (`*.jsonl`) i jego struktura
- **Higiena transkryptu** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu vs śledzone tokeny)
- **Kompaktowanie** (ręczne + automatyczne kompaktowanie) i gdzie podpiąć pracę wykonywaną przed kompaktowaniem
- **Ciche porządki** (np. zapisy do pamięci, które nie powinny generować widocznego dla użytkownika wyjścia)

Jeśli najpierw chcesz zobaczyć omówienie na wyższym poziomie, zacznij od:

- [/concepts/session](/pl/concepts/session)
- [/concepts/compaction](/pl/concepts/compaction)
- [/concepts/memory](/pl/concepts/memory)
- [/concepts/memory-search](/pl/concepts/memory-search)
- [/concepts/session-pruning](/pl/concepts/session-pruning)
- [/reference/transcript-hygiene](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw został zaprojektowany wokół pojedynczego **procesu Gateway**, który zarządza stanem sesji.

- Interfejsy użytkownika (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzanie lokalnych plików na Macu” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy trwałości

OpenClaw zapisuje sesje w dwóch warstwach:

1. **Store sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, mutowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnią aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt typu append-only o strukturze drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą konwersację + wywołania narzędzi + podsumowania kompaktowania
   - Służy do odbudowy kontekstu modelu dla przyszłych tur

---

## Lokalizacje na dysku

Dla każdego agenta, na hoście Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje te ścieżki przez `src/config/sessions.ts`.

---

## Utrzymanie store i kontrola dysku

Trwałość sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json` i artefaktów transkryptów:

- `mode`: `warn` (domyślnie) lub `enforce`
- `pruneAfter`: próg wieku dla starych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `rotateBytes`: rotacja `sessions.json`, gdy plik jest zbyt duży (domyślnie `10mb`)
- `resetArchiveRetention`: retencja dla archiwów transkryptów `*.reset.<timestamp>` (domyślnie: taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny limit budżetu katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Kolejność egzekwowania przy czyszczeniu limitu dysku (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane lub osierocone artefakty transkryptów.
2. Jeśli nadal jest powyżej celu, usuń najstarsze wpisy sesji i ich pliki transkryptów.
3. Kontynuuj, aż użycie spadnie do `highWaterBytes` lub niżej.

W trybie `mode: "warn"` OpenClaw zgłasza potencjalne usunięcia, ale nie modyfikuje store ani plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje cron i logi uruchomień

Izolowane uruchomienia cron również tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) usuwa stare sesje izolowanych uruchomień cron ze store sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` linii).

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _który koszyk konwersacji_ jest używany (routowanie + izolacja).

Typowe wzorce:

- Główny/bezpośredni czat (per agent): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` lub `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Kanoniczne zasady są udokumentowane w [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje na bieżący `sessionId` (plik transkryptu, który kontynuuje konwersację).

Praktyczne zasady:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Codzienny reset** (domyślnie o 4:00 czasu lokalnego na hoście gatewaya) tworzy nowy `sessionId` przy następnej wiadomości po przekroczeniu granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` lub starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po oknie bezczynności. Gdy skonfigurowano jednocześnie reset dzienny i bezczynność, wygrywa ten, który wygaśnie wcześniej.
- **Zabezpieczenie przed rozwidleniem z rodzica dla wątków** (`session.parentForkMaxTokens`, domyślnie `100000`) pomija forking transkryptu rodzica, gdy sesja nadrzędna jest już zbyt duża; nowy wątek zaczyna się od zera. Ustaw `0`, aby wyłączyć.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat store sesji (`sessions.json`)

Typ wartości store to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista niepełna):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest z niego wyprowadzana, chyba że ustawiono `sessionFile`)
- `updatedAt`: znacznik czasu ostatniej aktywności
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga interfejsom użytkownika i polityce wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane do etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie per sesja)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często auto-kompaktowanie zakończyło się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego opróżnienia pamięci przed kompaktowaniem
- `memoryFlushCompactionCount`: licznik kompaktowań, przy którym uruchomiono ostatnie opróżnienie

Store można bezpiecznie edytować, ale Gateway jest autorytetem: może przepisywać lub odtwarzać wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkrypty są zarządzane przez `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik ma format JSONL:

- Pierwsza linia: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Istotne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzykiwane przez rozszerzenie, które _wchodzą_ do kontekstu modelu (mogą być ukryte w UI)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu
- `compaction`: zapisane podsumowanie kompaktowania z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: zapisane podsumowanie przy nawigacji po gałęzi drzewa

OpenClaw celowo **nie** „naprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu i zapisu.

---

## Okna kontekstu vs śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit per model (tokeny widoczne dla modelu)
2. **Liczniki store sesji**: statystyki kroczące zapisywane do `sessions.json` (używane przez /status i dashboardy)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może być nadpisane przez konfigurację).
- `contextTokens` w store to wartość szacunkowa/raportowana przez runtime; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji znajdziesz w [/token-use](/pl/reference/token-use).

---

## Kompaktowanie: czym jest

Kompaktowanie podsumowuje starszą część konwersacji do zapisanego wpisu `compaction` w transkrypcie i zachowuje nienaruszone ostatnie wiadomości.

Po kompaktowaniu przyszłe tury widzą:

- Podsumowanie kompaktowania
- Wiadomości po `firstKeptEntryId`

Kompaktowanie jest **trwałe** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice chunków kompaktowania i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na chunki do kompaktowania, utrzymuje
sparowanie wywołań narzędzi asystenta z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do wiadomości asystenta z wywołaniem narzędzia zamiast rozdzielać
  parę.
- Jeśli końcowy blok z wynikiem narzędzia w przeciwnym razie przekroczyłby docelowy rozmiar chunku,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niepodsumowany ogon
  bez zmian.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują oczekującego podziału otwartego.

---

## Kiedy następuje auto-kompaktowanie (runtime Pi)

W osadzonym agencie Pi auto-kompaktowanie uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty zależne od dostawcy) → kompaktuj → ponów próbę.
2. **Utrzymanie progu**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

To semantyka runtime Pi (OpenClaw konsumuje zdarzenia, ale Pi decyduje, kiedy kompaktować).

---

## Ustawienia kompaktowania (`reserveTokens`, `keepRecentTokens`)

Ustawienia kompaktowania Pi znajdują się w ustawieniach Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw wymusza też minimalny bezpieczny próg dla uruchomień osadzonych:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny próg minimalny to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć ten próg.
- Jeśli wartość jest już wyższa, OpenClaw pozostawia ją bez zmian.

Dlaczego: aby zostawić wystarczający zapas na wieloturowe „porządki” (takie jak zapisy do pamięci), zanim kompaktowanie stanie się nieuniknione.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Wymienni dostawcy kompaktowania

Wtyczki mogą rejestrować dostawcę kompaktowania przez `registerCompactionProvider()` w API wtyczek. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, rozszerzenie safeguard deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanej wtyczki dostawcy kompaktowania. Pozostaw nieustawione dla domyślnego podsumowywania przez LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje kompaktowania i politykę zachowywania identyfikatorów co ścieżka wbudowana.
- Safeguard nadal zachowuje kontekst ostatnich tur i końcówki podzielonej tury po wyjściu dostawcy.
- Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania przez LLM.
- Sygnały przerwania/timeoutu są ponownie rzucane (nie są przechwytywane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Kompaktowanie i stan sesji można obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb szczegółowy: `🧹 Auto-compaction complete` + liczba kompaktowań

---

## Ciche porządki (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań działających w tle, gdy użytkownik nie powinien widzieć pośredniego wyjścia.

Konwencja:

- Asystent rozpoczyna wyjście od dokładnego cichego tokena `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Tłumienie dokładnego cichego tokena nie rozróżnia wielkości liter, więc `NO_REPLY` i
  `no_reply` liczą się tak samo, gdy cały ładunek to tylko ten cichy token.
- Służy to wyłącznie do prawdziwych tur działających w tle / bez dostarczenia; nie jest to skrót
  dla zwykłych, wymagających działania żądań użytkownika.

Od wersji `2026.1.10` OpenClaw tłumi także **streaming wersji roboczych/pisania**, gdy
częściowy chunk zaczyna się od `NO_REPLY`, aby ciche operacje nie ujawniały częściowego
wyjścia w połowie tury.

---

## „Opróżnianie pamięci” przed kompaktowaniem (zaimplementowane)

Cel: zanim nastąpi auto-kompaktowanie, uruchomić cichą agentową turę, która zapisze trwały
stan na dysk (np. `memory/YYYY-MM-DD.md` w obszarze roboczym agenta), aby kompaktowanie nie mogło
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **opróżniania przed progiem**:

1. Monitoruje użycie kontekstu sesji.
2. Gdy przekroczy ono „miękki próg” (poniżej progu kompaktowania Pi), uruchamia cichą
   dyrektywę „zapisz pamięć teraz” do agenta.
3. Używa dokładnego cichego tokena `NO_REPLY` / `no_reply`, aby użytkownik niczego
   nie widział.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury opróżniania)
- `systemPrompt` (dodatkowy prompt systemowy dołączany dla tury opróżniania)

Uwagi:

- Domyślny prompt/system prompt zawierają wskazówkę `NO_REPLY`, aby tłumić
  dostarczanie.
- Opróżnianie uruchamia się raz na cykl kompaktowania (śledzone w `sessions.json`).
- Opróżnianie działa tylko dla sesji osadzonego Pi (backendy CLI je pomijają).
- Opróżnianie jest pomijane, gdy obszar roboczy sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików obszaru roboczego i wzorce zapisu.

Pi udostępnia też hook `session_before_compact` w API rozszerzeń, ale logika
opróżniania OpenClaw znajduje się obecnie po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Nieprawidłowy klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność store i transkryptu? Potwierdź host Gateway i ścieżkę store z `openclaw status`.
- Spam kompaktowania? Sprawdź:
  - okno kontekstu modelu (za małe)
  - ustawienia kompaktowania (`reserveTokens` zbyt wysokie względem okna modelu mogą powodować wcześniejsze kompaktowanie)
  - nadmiar `toolResult`: włącz/dostrój przycinanie sesji
- Wyciekają ciche tury? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token, bez rozróżniania wielkości liter) i że używasz kompilacji zawierającej poprawkę tłumienia streamingu.
