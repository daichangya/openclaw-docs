---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkryptów lub pola `sessions.json`
    - Zmieniasz zachowanie automatycznego Compaction lub dodajesz porządkowanie „pre-compaction”
    - Chcesz wdrożyć opróżnianie pamięci lub ciche tury systemowe
summary: 'Dogłębna analiza: magazyn sesji i transkrypty, cykl życia oraz mechanizmy Compaction i automatycznego Compaction wewnętrznie'
title: Dogłębna analiza zarządzania sesjami
x-i18n:
    generated_at: "2026-04-26T11:40:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Ta strona wyjaśnia, jak OpenClaw zarządza sesjami od początku do końca:

- **Routing sesji** (jak wiadomości przychodzące są mapowane na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i co śledzi
- **Trwałość transkryptów** (`*.jsonl`) i ich struktura
- **Higiena transkryptów** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Compaction** (ręczny + automatyczny Compaction) oraz miejsce do podłączania działań pre-compaction
- **Ciche porządkowanie** (np. zapisy pamięci, które nie powinny generować widocznego dla użytkownika wyjścia)

Jeśli najpierw chcesz zobaczyć przegląd na wyższym poziomie, zacznij od:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkryptów](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół pojedynczego **procesu Gateway**, który zarządza stanem sesji.

- Interfejsy użytkownika (aplikacja macOS, web Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzanie lokalnych plików na Macu” nie odzwierciedla tego, czego używa Gateway.

---

## Dwie warstwy trwałości

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, mutowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnia aktywność, przełączniki, liczniki tokenów itp.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt tylko z dopisywaniem ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje faktyczną rozmowę + wywołania narzędzi + podsumowania Compaction
   - Używany do odbudowy kontekstu modelu dla przyszłych tur

---

## Lokalizacje na dysku

Dla każdego agenta, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegrama: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje te ścieżki przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrola dysku

Trwałość sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json` i artefaktów transkryptów:

- `mode`: `warn` (domyślnie) lub `enforce`
- `pruneAfter`: próg wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `rotateBytes`: rotacja `sessions.json`, gdy plik jest za duży (domyślnie `10mb`)
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie: taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Kolejność wymuszania podczas czyszczenia budżetu dysku (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane lub osierocone artefakty transkryptów.
2. Jeśli nadal przekroczono cel, usuń najstarsze wpisy sesji i ich pliki transkryptów.
3. Kontynuuj, aż użycie spadnie do `highWaterBytes` lub niżej.

W trybie `mode: "warn"` OpenClaw zgłasza potencjalne usunięcia, ale nie modyfikuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i logi uruchomień

Izolowane uruchomienia Cron również tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) przycina stare sesje izolowanych uruchomień Cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` linii).

Gdy Cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanitizuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Zachowuje bezpieczne
preferencje, takie jak ustawienia thinking/fast/verbose, etykiety oraz jawne
nadpisania modelu/auth wybrane przez użytkownika. Usuwa kontekst otaczającej rozmowy, taki
jak routing kanału/grupy, zasady wysyłania lub kolejkowania, podniesione uprawnienia, pochodzenie i powiązanie środowiska wykonawczego ACP,
aby nowe izolowane uruchomienie nie mogło odziedziczyć nieaktualnych ustawień dostarczania lub
uprawnień środowiska wykonawczego ze starszego uruchomienia.

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje, _w którym koszyku rozmowy_ się znajdujesz (routing + izolacja).

Typowe wzorce:

- Główny/bezpośredni czat (na agenta): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` lub `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Kanoniczne reguły są udokumentowane pod adresem [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkryptu, który kontynuuje rozmowę).

Praktyczne zasady:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Codzienny reset** (domyślnie 4:00 czasu lokalnego na hoście Gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` lub starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po oknie bezczynności. Gdy skonfigurowano jednocześnie reset dzienny i bezczynność, wygrywa to, co wygaśnie wcześniej.
- **Zdarzenia systemowe** (Heartbeat, wybudzenia Cron, powiadomienia exec, operacje porządkowe Gateway) mogą modyfikować wiersz sesji, ale nie wydłużają świeżości resetu dziennego/bezczynności. Podczas przejścia resetu porzucane są zakolejkowane powiadomienia o zdarzeniach systemowych dla poprzedniej sesji, zanim zostanie zbudowany świeży prompt.
- **Ochrona rozwidlenia rodzica wątku** (`session.parentForkMaxTokens`, domyślnie `100000`) pomija rozwidlenie transkryptu rodzica, gdy sesja nadrzędna jest już zbyt duża; nowy wątek zaczyna się od zera. Ustaw `0`, aby wyłączyć.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typ wartości magazynu to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista niepełna):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest z niego wyprowadzana, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu rozpoczęcia bieżącego `sessionId`; używa go świeżość resetu dziennego. Starsze wiersze mogą wyprowadzać go z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; używa go świeżość resetu bezczynności, aby zdarzenia Heartbeat, Cron i exec nie utrzymywały sesji przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu rozpoczęcia sesji dla świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej mutacji wiersza magazynu, używany do listowania, przycinania i operacji porządkowych. Nie jest autorytatywnym źródłem świeżości resetu dziennego/bezczynności.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga interfejsom użytkownika i zasadom wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane do etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie per sesja)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często automatyczny Compaction zakończył się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego opróżnienia pamięci przed Compaction
- `memoryFlushCompactionCount`: liczba Compaction w momencie ostatniego opróżnienia

Magazyn można bezpiecznie edytować, ale autorytetem pozostaje Gateway: może przepisywać lub ponownie uwadniać wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkryptami zarządza `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik ma format JSONL:

- Pierwszy wiersz: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Istotne typy wpisów:

- `message`: wiadomości user/assistant/toolResult
- `custom_message`: wiadomości wstrzykiwane przez rozszerzenia, które _wchodzą_ do kontekstu modelu (mogą być ukryte w UI)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigacji po gałęzi drzewa

OpenClaw celowo **nie** „naprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit dla modelu (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: statystyki kroczące zapisywane do `sessions.json` (używane przez /status i pulpity)

Jeśli stroisz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może zostać nadpisane przez konfigurację).
- `contextTokens` w magazynie to wartość szacunkowa/raportowana w czasie działania; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji znajdziesz pod adresem [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą część rozmowy do utrwalonego wpisu `compaction` w transkrypcie i zachowuje nienaruszone ostatnie wiadomości.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwały** (w odróżnieniu od przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice bloków Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na bloki Compaction, utrzymuje
sparowanie wywołań narzędzi asystenta z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do wiadomości asystenta z wywołaniem narzędzia, zamiast rozdzielać tę parę.
- Jeśli końcowy blok wyniku narzędzia w przeciwnym razie wypchnąłby blok ponad cel,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niepodsumowany ogon bez zmian.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują otwartego oczekującego podziału.

---

## Kiedy następuje automatyczny Compaction (środowisko Pi)

W osadzonym agencie Pi automatyczny Compaction jest uruchamiany w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty charakterystyczne dla dostawcy) → Compaction → ponowna próba.
2. **Utrzymanie progu**: po pomyślnej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany dla promptów + kolejnego wyjścia modelu

To semantyka środowiska Pi (OpenClaw konsumuje zdarzenia, ale Pi decyduje, kiedy wykonać Compaction).

---

## Ustawienia Compaction (`reserveTokens`, `keepRecentTokens`)

Ustawienia Compaction w Pi znajdują się w ustawieniach Pi:

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
- Ręczne `/compact` respektuje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona Pi. Bez jawnego budżetu keep
  ręczny Compaction pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się
  od nowego podsumowania.

Dlaczego: pozostawić wystarczający zapas dla wieloturowego „porządkowania” (takiego jak zapisy pamięci), zanim Compaction stanie się nieunikniony.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Wymienni dostawcy Compaction

Pluginy mogą rejestrować dostawcę Compaction przez `registerCompactionProvider()` w API pluginu. Gdy ustawione jest `agents.defaults.compaction.provider` na identyfikator zarejestrowanego dostawcy, rozszerzenie safeguard deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego pipeline `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego pluginu dostawcy Compaction. Pozostaw nieustawione dla domyślnego podsumowywania przez LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i tę samą politykę zachowywania identyfikatorów co ścieżka wbudowana.
- Safeguard nadal zachowuje kontekst ostatnich tur i sufiks podzielonej tury po wyniku dostawcy.
- Wbudowane podsumowywanie safeguard ponownie destyluje wcześniejsze podsumowania wraz z nowymi wiadomościami, zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb safeguard domyślnie włącza audyty jakości podsumowań; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie ponownej próby przy nieprawidłowym wyniku.
- Jeśli dostawca zakończy się błędem lub zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania przez LLM.
- Sygnały abort/timeout są ponownie rzucane (nie są przechwytywane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Możesz obserwować Compaction i stan sesji przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb verbose: `🧹 Auto-compaction complete` + liczba Compaction

---

## Ciche porządkowanie (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć pośredniego wyjścia.

Konwencja:

- Asystent rozpoczyna swoje wyjście od dokładnego cichego tokenu `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Tłumienie dokładnego cichego tokenu jest niewrażliwe na wielkość liter, więc `NO_REPLY` i
  `no_reply` są traktowane tak samo, gdy cały ładunek to tylko cichy token.
- Służy to wyłącznie do prawdziwych tur w tle/bez dostarczania; nie jest to skrót dla
  zwykłych, wymagających działania żądań użytkownika.

Od wersji `2026.1.10` OpenClaw tłumi również **streaming wersji roboczej/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, aby ciche operacje nie ujawniały częściowego
wyjścia w trakcie tury.

---

## „Memory flush” przed Compaction (zaimplementowane)

Cel: zanim nastąpi automatyczny Compaction, uruchomić cichą turę agentową, która zapisze trwały
stan na dysku (np. `memory/YYYY-MM-DD.md` w obszarze roboczym agenta), tak aby Compaction nie mógł
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **flush przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy ono „miękki próg” (poniżej progu Compaction w Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” do agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik niczego
   nie zobaczył.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury flush)
- `systemPrompt` (dodatkowy prompt systemowy dołączany dla tury flush)

Uwagi:

- Domyślny prompt/system prompt zawiera wskazówkę `NO_REPLY`, aby tłumić
  dostarczanie.
- Flush uruchamia się raz na cykl Compaction (śledzone w `sessions.json`).
- Flush działa tylko dla osadzonych sesji Pi (backendy CLI go pomijają).
- Flush jest pomijany, gdy obszar roboczy sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików obszaru roboczego i wzorce zapisu.

Pi udostępnia też hook `session_before_compact` w API rozszerzeń, ale logika
flush w OpenClaw znajduje się dziś po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Nieprawidłowy klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu i transkryptu? Potwierdź host Gateway oraz ścieżkę magazynu z `openclaw status`.
- Spam Compaction? Sprawdź:
  - okno kontekstu modelu (zbyt małe)
  - ustawienia Compaction (`reserveTokens` ustawione zbyt wysoko względem okna modelu może powodować wcześniejszy Compaction)
  - rozrost wyników narzędzi: włącz/dostrój przycinanie sesji
- Ciche tury przeciekają? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token, bez rozróżniania wielkości liter) i że używasz kompilacji zawierającej poprawkę tłumienia streamingu.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
