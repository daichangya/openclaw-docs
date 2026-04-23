---
read_when:
    - Chcesz zrozumieć, jak TaskFlow odnosi się do zadań w tle
    - Natrafiasz na Task Flow lub przepływ zadań openclaw w informacjach o wydaniu albo w dokumentacji
    - Chcesz sprawdzić lub zarządzać trwałym stanem przepływu
summary: Warstwa orkiestracji przepływu Task Flow nad zadaniami w tle
title: Przepływ zadań
x-i18n:
    generated_at: "2026-04-23T09:55:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# Przepływ zadań

Przepływ zadań to warstwa orkiestracji przepływu, która znajduje się ponad [zadaniami w tle](/pl/automation/tasks). Zarządza trwałymi, wieloetapowymi przepływami z własnym stanem, śledzeniem rewizji i semantyką synchronizacji, podczas gdy poszczególne zadania pozostają jednostką odłączonej pracy.

## Kiedy używać przepływu zadań

Używaj przepływu zadań, gdy praca obejmuje wiele sekwencyjnych lub rozgałęzionych kroków i potrzebujesz trwałego śledzenia postępu po restartach Gateway. W przypadku pojedynczych operacji w tle wystarczy zwykłe [zadanie](/pl/automation/tasks).

| Scenariusz                            | Użycie                  |
| ------------------------------------- | ----------------------- |
| Pojedyncze zadanie w tle              | Zwykłe zadanie          |
| Wieloetapowy potok (A, potem B, potem C) | Przepływ zadań (zarządzany) |
| Obserwowanie zadań utworzonych zewnętrznie | Przepływ zadań (odwzorowany) |
| Jednorazowe przypomnienie             | Zadanie Cron            |

## Tryby synchronizacji

### Tryb zarządzany

Przepływ zadań zarządza cyklem życia od początku do końca. Tworzy zadania jako kroki przepływu, doprowadza je do zakończenia i automatycznie przesuwa stan przepływu dalej.

Przykład: cotygodniowy przepływ raportu, który (1) zbiera dane, (2) generuje raport i (3) go dostarcza. Przepływ zadań tworzy każdy krok jako zadanie w tle, czeka na zakończenie, a następnie przechodzi do kolejnego kroku.

```bash
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Tryb odwzorowany

Przepływ zadań obserwuje zadania utworzone zewnętrznie i utrzymuje stan przepływu zsynchronizowany bez przejmowania odpowiedzialności za tworzenie zadań. Jest to przydatne, gdy zadania pochodzą z zadań Cron, poleceń CLI lub innych źródeł, a chcesz mieć ujednolicony widok ich postępu jako przepływu.

Przykład: trzy niezależne zadania Cron, które razem tworzą poranną rutynę operacyjną. Odwzorowany przepływ śledzi ich łączny postęp bez kontrolowania tego, kiedy i jak są uruchamiane.

## Trwały stan i śledzenie rewizji

Każdy przepływ zapisuje własny stan i śledzi rewizje, dzięki czemu postęp przetrwa restarty Gateway. Śledzenie rewizji umożliwia wykrywanie konfliktów, gdy wiele źródeł próbuje jednocześnie przesunąć ten sam przepływ dalej.

## Zachowanie przy anulowaniu

`openclaw tasks flow cancel` ustawia trwały zamiar anulowania na przepływie. Aktywne zadania w ramach przepływu są anulowane i żadne nowe kroki nie są uruchamiane. Zamiar anulowania utrzymuje się po restartach, więc anulowany przepływ pozostaje anulowany, nawet jeśli Gateway zrestartuje się, zanim wszystkie zadania podrzędne zostaną zakończone.

## Polecenia CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Polecenie                         | Opis                                                |
| --------------------------------- | --------------------------------------------------- |
| `openclaw tasks flow list`        | Pokazuje śledzone przepływy ze stanem i trybem synchronizacji |
| `openclaw tasks flow show <id>`   | Sprawdź jeden przepływ według identyfikatora przepływu lub klucza wyszukiwania |
| `openclaw tasks flow cancel <id>` | Anuluj uruchomiony przepływ i jego aktywne zadania  |

## Jak przepływy odnoszą się do zadań

Przepływy koordynują zadania, a nie je zastępują. Pojedynczy przepływ może w trakcie swojego działania obsługiwać wiele zadań w tle. Użyj `openclaw tasks`, aby sprawdzić poszczególne rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzić przepływ orkiestrujący.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — rejestr odłączonej pracy, którą koordynują przepływy
- [CLI: tasks](/pl/cli/tasks) — dokumentacja poleceń CLI dla `openclaw tasks flow`
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania Cron](/pl/automation/cron-jobs) — zaplanowane zadania, które mogą zasilać przepływy
