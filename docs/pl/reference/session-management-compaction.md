---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkryptów lub pola `sessions.json`
    - Zmieniasz zachowanie automatycznego Compaction albo dodajesz „pre-compaction” housekeeping
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Szczegółowe omówienie: magazyn sesji + transkrypty, cykl życia i wewnętrzne mechanizmy (auto)Compaction'
title: Szczegółowe omówienie zarządzania sesją
x-i18n:
    generated_at: "2026-04-25T13:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Ta strona wyjaśnia, jak OpenClaw zarządza sesjami end-to-end:

- **Routing sesji** (jak wiadomości przychodzące mapują się na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i co śledzi
- **Trwałość transkryptów** (`*.jsonl`) i ich strukturę
- **Higienę transkryptów** (poprawki specyficzne dla providera przed uruchomieniami)
- **Limity kontekstu** (okno kontekstowe vs śledzone tokeny)
- **Compaction** (ręczny + automatyczny Compaction) oraz miejsca do podpięcia pracy przed Compaction
- **Cichy housekeeping** (np. zapisy pamięci, które nie powinny tworzyć widocznego dla użytkownika wyjścia)

Jeśli najpierw chcesz zobaczyć przegląd wyższego poziomu, zacznij od:

- [Session management](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Memory overview](/pl/concepts/memory)
- [Memory search](/pl/concepts/memory-search)
- [Session pruning](/pl/concepts/session-pruning)
- [Transcript hygiene](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół pojedynczego **procesu Gateway**, który jest właścicielem stanu sesji.

- UI (aplikacja macOS, webowy interfejs Control UI, TUI) powinny pytać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzanie lokalnych plików na Macu” nie odzwierciedla tego, czego używa Gateway.

---

## Dwie warstwy trwałości

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, mutowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnią aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt append-only o strukturze drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą rozmowę + wywołania narzędzi + podsumowania Compaction
   - Używany do odbudowy kontekstu modelu dla przyszłych tur

---

## Lokalizacje na dysku

Per agent, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje te ścieżki przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrola dysku

Trwałość sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json` i artefaktów transkryptów:

- `mode`: `warn` (domyślnie) lub `enforce`
- `pruneAfter`: granica wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `rotateBytes`: rotacja `sessions.json`, gdy jest zbyt duży (domyślnie `10mb`)
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie: taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Kolejność egzekwowania czyszczenia budżetu dysku (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane lub osierocone artefakty transkryptów.
2. Jeśli nadal przekroczono cel, usuwaj najstarsze wpisy sesji i ich pliki transkryptów.
3. Kontynuuj, aż użycie spadnie do `highWaterBytes` lub poniżej.

W `mode: "warn"` OpenClaw raportuje potencjalne usunięcia, ale nie mutuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i logi uruchomień

Izolowane uruchomienia Cron również tworzą wpisy sesji/transkrypty i mają dedykowane kontrolki retencji:

- `cron.sessionRetention` (domyślnie `24h`) usuwa stare izolowane sesje uruchomień Cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` linii).

Gdy Cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanityzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia thinking/fast/verbose, etykiety i jawne
nadpisania modelu/auth wybrane przez użytkownika. Usuwa kontekst ambient rozmowy, taki
jak routing kanału/grupy, politykę wysyłki lub kolejki, elevated, origin i powiązanie runtime ACP,
aby świeże izolowane uruchomienie nie mogło odziedziczyć nieaktualnego dostarczania ani
uprawnień runtime po starszym uruchomieniu.

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _który kubełek rozmowy_ jest używany (routing + izolacja).

Typowe wzorce:

- Główny/czat bezpośredni (per agent): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` lub `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Kanoniczne reguły są opisane w [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkryptu, który kontynuuje rozmowę).

Zasady orientacyjne:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Codzienny reset** (domyślnie 4:00 rano czasu lokalnego na hoście gateway) tworzy nowy `sessionId` przy następnej wiadomości po przekroczeniu granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` lub starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po oknie bezczynności. Gdy skonfigurowane są jednocześnie reset dzienny i bezczynność, wygrywa to, co wygaśnie wcześniej.
- **Ochrona rozwidlenia rodzica wątku** (`session.parentForkMaxTokens`, domyślnie `100000`) pomija forkowanie transkryptu rodzica, gdy sesja nadrzędna jest już zbyt duża; nowy wątek zaczyna od zera. Ustaw `0`, aby wyłączyć.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typ wartości magazynu to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (niepełna lista):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest z niego wyprowadzana, chyba że ustawiono `sessionFile`)
- `updatedAt`: znacznik czasu ostatniej aktywności
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga UI i polityce wysyłki)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane do etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie per sesja)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od providera):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często automatyczny Compaction zakończył się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego opróżnienia pamięci przed Compaction
- `memoryFlushCompactionCount`: licznik Compaction, przy którym wykonano ostatnie opróżnienie

Magazyn można bezpiecznie edytować, ale autorytetem pozostaje Gateway: może przepisywać lub rehydratować wpisy w miarę działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkryptami zarządza `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik ma format JSONL:

- Pierwsza linia: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Warte uwagi typy wpisów:

- `message`: wiadomości user/assistant/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenia, które _wchodzą_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzenia, który _nie_ wchodzi do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie przy nawigacji po gałęzi drzewa

OpenClaw celowo **nie** „naprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstowe vs śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstowe modelu**: twardy limit per model (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: rolling stats zapisywane do `sessions.json` (używane przez /status i pulpity)

Jeśli dostrajasz limity:

- Okno kontekstowe pochodzi z katalogu modeli (i może być nadpisane przez konfigurację).
- `contextTokens` w magazynie to wartość szacunkowa/raportowa runtime; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji: [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą rozmowę do utrwalonego wpisu `compaction` w transkrypcie i zachowuje ostatnie wiadomości bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwały** (w przeciwieństwie do session pruning). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na fragmenty Compaction, utrzymuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do wiadomości asystenta z wywołaniem narzędzia zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyniku narzędzia w przeciwnym razie przekroczyłby cel fragmentu,
  OpenClaw zachowuje ten oczekujący blok narzędzia i utrzymuje niepodsumowany ogon
  bez zmian.
- Przerwane/błędne bloki wywołania narzędzia nie utrzymują otwartego oczekującego podziału.

---

## Kiedy zachodzi automatyczny Compaction (runtime Pi)

W osadzonym agencie Pi automatyczny Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty kształtowane przez providera) → compact → retry.
2. **Utrzymanie progu**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstowe modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

To semantyka runtime Pi (OpenClaw konsumuje zdarzenia, ale Pi decyduje, kiedy wykonać Compaction).

---

## Ustawienia Compaction (`reserveTokens`, `keepRecentTokens`)

Ustawienia Compaction Pi znajdują się w ustawieniach Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw wymusza także minimalny próg bezpieczeństwa dla uruchomień osadzonych:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny próg to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć próg.
- Jeśli wartość jest już wyższa, OpenClaw pozostawia ją bez zmian.
- Ręczne `/compact` honoruje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt cięcia ostatniego ogona Pi. Bez jawnego budżetu zachowania
  ręczny Compaction pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się
  od nowego podsumowania.

Dlaczego: pozostawić wystarczający zapas dla wieloturowego „housekeepingu” (jak zapisy pamięci), zanim Compaction stanie się nieunikniony.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Wymienne providerzy Compaction

Pluginy mogą rejestrować providera Compaction przez `registerCompactionProvider()` w API Plugin. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego providera, rozszerzenie safeguard deleguje podsumowywanie do tego providera zamiast do wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego Plugin providera Compaction. Pozostaw nieustawione dla domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Providerzy otrzymują te same instrukcje Compaction i politykę zachowywania identyfikatorów co ścieżka wbudowana.
- Safeguard nadal zachowuje kontekst sufiksu ostatniej tury i tury podziału po wyniku providera.
- Wbudowane podsumowywanie safeguard ponownie destyluje wcześniejsze podsumowania razem z nowymi wiadomościami
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb safeguard domyślnie włącza audyty jakości podsumowań; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie retry przy nieprawidłowym wyniku.
- Jeśli provider zawiedzie albo zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania LLM.
- Sygnały abort/timeout są ponownie wyrzucane (nie są połykane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Compaction i stan sesji można obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb verbose: `🧹 Auto-compaction complete` + licznik Compaction

---

## Cichy housekeeping (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć pośredniego wyjścia.

Konwencja:

- Asystent rozpoczyna wynik od dokładnego cichego tokenu `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczenia.
- Tłumienie dokładnego cichego tokenu jest nieczułe na wielkość liter, więc `NO_REPLY` i
  `no_reply` oba liczą się wtedy, gdy cały payload jest tylko tym cichym tokenem.
- To jest przeznaczone wyłącznie dla prawdziwie działających w tle / bez dostarczenia tur; nie jest to skrót dla
  zwykłych, możliwych do wykonania żądań użytkownika.

Od wersji `2026.1.10` OpenClaw tłumi również **streaming szkiców/wskaźników pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, aby ciche operacje nie ujawniały
częściowego wyjścia w połowie tury.

---

## „Memory flush” przed Compaction (zaimplementowane)

Cel: zanim nastąpi automatyczny Compaction, uruchomić cichą turę agentyczną, która zapisze trwały
stan na dysku (np. `memory/YYYY-MM-DD.md` w obszarze roboczym agenta), aby Compaction nie mógł
wymazać krytycznego kontekstu.

OpenClaw używa podejścia **pre-threshold flush**:

1. Monitoruje użycie kontekstu sesji.
2. Gdy przekroczy ono „miękki próg” (poniżej progu Compaction Pi), uruchamia cichą
   dyrektywę „zapisz pamięć teraz” dla agenta.
3. Używa dokładnego cichego tokenu `NO_REPLY` / `no_reply`, dzięki czemu użytkownik
   nic nie widzi.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury flush)
- `systemPrompt` (dodatkowy prompt systemowy dołączany do tury flush)

Uwagi:

- Domyślne wartości prompt/systemPrompt zawierają wskazówkę `NO_REPLY`, aby tłumić
  dostarczenie.
- Flush uruchamia się raz na cykl Compaction (śledzone w `sessions.json`).
- Flush uruchamia się tylko dla osadzonych sesji Pi (backendy CLI go pomijają).
- Flush jest pomijany, gdy obszar roboczy sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Układ plików obszaru roboczego i wzorce zapisu: [Memory](/pl/concepts/memory).

Pi udostępnia także hook `session_before_compact` w API rozszerzeń, ale logika
flush OpenClaw żyje dziś po stronie Gateway.

---

## Checklista rozwiązywania problemów

- Nieprawidłowy klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niedopasowanie magazynu i transkryptu? Potwierdź host Gateway i ścieżkę magazynu z `openclaw status`.
- Spam Compaction? Sprawdź:
  - okno kontekstowe modelu (zbyt małe)
  - ustawienia Compaction (`reserveTokens` zbyt wysokie względem okna modelu może powodować wcześniejszy Compaction)
  - rozdęcie wyników narzędzi: włącz/dostrój session pruning
- Ciche tury przeciekają? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token, nieczuły na wielkość liter) i że używasz buildu zawierającego poprawkę tłumienia streamingu.

## Powiązane

- [Session management](/pl/concepts/session)
- [Session pruning](/pl/concepts/session-pruning)
- [Context engine](/pl/concepts/context-engine)
