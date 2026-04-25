---
read_when:
    - Chcesz zrozumieć, jak TaskFlow odnosi się do zadań w tle.
    - Natrafiasz na Task Flow lub przepływ zadań openclaw w informacjach o wydaniu albo w dokumentacji
    - Chcesz sprawdzić lub zarządzać trwałym stanem przepływu.
summary: Warstwa orkiestracji przepływu zadań ponad zadaniami w tle
title: Przepływ zadań
x-i18n:
    generated_at: "2026-04-25T13:41:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlow to warstwa orkiestracji przepływu, która znajduje się ponad [zadaniami w tle](/pl/automation/tasks). Zarządza trwałymi, wieloetapowymi przepływami z własnym stanem, śledzeniem rewizji i semantyką synchronizacji, podczas gdy pojedyncze zadania pozostają jednostką pracy odłączonej.

## Kiedy używać TaskFlow

Używaj TaskFlow, gdy praca obejmuje wiele kolejnych lub rozgałęziających się kroków i potrzebujesz trwałego śledzenia postępu między restartami Gateway. W przypadku pojedynczych operacji w tle wystarczy zwykłe [zadanie](/pl/automation/tasks).

| Scenariusz                            | Zastosowanie          |
| ------------------------------------- | --------------------- |
| Pojedyncze zadanie w tle              | Zwykłe zadanie        |
| Wieloetapowy potok (A, potem B, potem C) | TaskFlow (zarządzany) |
| Obserwowanie zadań utworzonych zewnętrznie | TaskFlow (lustrzany)  |
| Jednorazowe przypomnienie             | Zadanie Cron          |

## Niezawodny wzorzec zaplanowanego workflow

W przypadku cyklicznych workflow, takich jak briefingi z analizy rynku, traktuj harmonogram, orkiestrację i kontrole niezawodności jako osobne warstwy:

1. Używaj [Scheduled Tasks](/pl/automation/cron-jobs) do określania czasu.
2. Używaj trwałej sesji Cron, gdy workflow ma bazować na wcześniejszym kontekście.
3. Używaj [Lobster](/pl/tools/lobster) do deterministycznych kroków, bramek zatwierdzania i tokenów wznowienia.
4. Używaj TaskFlow do śledzenia wieloetapowego uruchomienia przez zadania podrzędne, oczekiwania, ponowienia i restarty Gateway.

Przykładowy kształt zadania Cron:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Używaj `session:<id>` zamiast `isolated`, gdy cykliczny workflow wymaga celowo zachowywanej historii, podsumowań poprzednich uruchomień lub stałego kontekstu. Używaj `isolated`, gdy każde uruchomienie ma zaczynać się od nowa, a cały wymagany stan jest jawnie określony w workflow.

Wewnątrz workflow umieść kontrole niezawodności przed krokiem podsumowania przez LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Zalecane kontrole wstępne:

- Dostępność przeglądarki i wybór profilu, na przykład `openclaw` dla zarządzanego stanu albo `user`, gdy wymagane jest zalogowane środowisko Chrome. Zobacz [Browser](/pl/tools/browser).
- Poświadczenia API i limit dla każdego źródła.
- Osiągalność sieciowa wymaganych punktów końcowych.
- Wymagane narzędzia włączone dla agenta, takie jak `lobster`, `browser` i `llm-task`.
- Skonfigurowane miejsce docelowe błędów dla zadania Cron, aby błędy kontroli wstępnej były widoczne. Zobacz [Scheduled Tasks](/pl/automation/cron-jobs#delivery-and-output).

Zalecane pola pochodzenia danych dla każdego zebranego elementu:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Workflow powinien odrzucać lub oznaczać nieaktualne elementy przed podsumowaniem. Krok LLM powinien otrzymywać wyłącznie ustrukturyzowany JSON i powinien mieć polecenie zachowania `sourceUrl`, `retrievedAt` oraz `asOf` w danych wyjściowych. Używaj [LLM Task](/pl/tools/llm-task), gdy potrzebujesz kroku modelu ze schematem walidacji wewnątrz workflow.

W przypadku wielokrotnego użycia przez zespół lub społeczność spakuj CLI, pliki `.lobster` oraz wszelkie notatki konfiguracyjne jako skill albo Plugin i opublikuj je przez [ClawHub](/pl/tools/clawhub). Zachowuj ograniczenia specyficzne dla danego workflow w tym pakiecie, chyba że w API Plugin brakuje potrzebnej ogólnej możliwości.

## Tryby synchronizacji

### Tryb zarządzany

TaskFlow zarządza cyklem życia od początku do końca. Tworzy zadania jako kroki przepływu, prowadzi je do ukończenia i automatycznie przesuwa stan przepływu dalej.

Przykład: przepływ cotygodniowego raportu, który (1) zbiera dane, (2) generuje raport i (3) dostarcza go. TaskFlow tworzy każdy krok jako zadanie w tle, czeka na ukończenie, a następnie przechodzi do kolejnego kroku.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Tryb lustrzany

TaskFlow obserwuje zadania utworzone zewnętrznie i utrzymuje stan przepływu w synchronizacji bez przejmowania odpowiedzialności za tworzenie zadań. Jest to przydatne, gdy zadania pochodzą z zadań Cron, poleceń CLI lub innych źródeł i chcesz mieć ujednolicony widok ich postępu jako przepływu.

Przykład: trzy niezależne zadania Cron, które razem tworzą rutynę „morning ops”. Lustrzany przepływ śledzi ich zbiorczy postęp bez kontrolowania, kiedy i jak są uruchamiane.

## Trwały stan i śledzenie rewizji

Każdy przepływ zachowuje własny stan i śledzi rewizje, dzięki czemu postęp przetrwa restarty Gateway. Śledzenie rewizji umożliwia wykrywanie konfliktów, gdy wiele źródeł próbuje równocześnie przesunąć ten sam przepływ dalej.

## Zachowanie anulowania

`openclaw tasks flow cancel` ustawia trwały zamiar anulowania na przepływie. Aktywne zadania w ramach przepływu są anulowane i żadne nowe kroki nie są uruchamiane. Zamiar anulowania utrzymuje się po restartach, więc anulowany przepływ pozostaje anulowany, nawet jeśli Gateway uruchomi się ponownie, zanim wszystkie zadania podrzędne się zakończą.

## Polecenia CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Polecenie                        | Opis                                          |
| -------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Pokazuje śledzone przepływy ze statusem i trybem synchronizacji |
| `openclaw tasks flow show <id>`   | Sprawdza jeden przepływ według identyfikatora przepływu lub klucza wyszukiwania |
| `openclaw tasks flow cancel <id>` | Anuluje działający przepływ i jego aktywne zadania |

## Jak przepływy odnoszą się do zadań

Przepływy koordynują zadania, a nie je zastępują. Pojedynczy przepływ może w trakcie swojego istnienia obsługiwać wiele zadań w tle. Używaj `openclaw tasks`, aby sprawdzać poszczególne rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzać przepływ orkiestrujący.

## Powiązane

- [Background Tasks](/pl/automation/tasks) — rejestr pracy odłączonej, którą koordynują przepływy
- [CLI: tasks](/pl/cli/tasks) — dokumentacja poleceń CLI dla `openclaw tasks flow`
- [Automation Overview](/pl/automation) — przegląd wszystkich mechanizmów automatyzacji
- [Cron Jobs](/pl/automation/cron-jobs) — zaplanowane zadania, które mogą zasilać przepływy
