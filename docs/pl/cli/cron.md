---
read_when:
    - Chcesz mieć zaplanowane zadania i wybudzenia
    - Debugujesz wykonywanie Cron i logi
summary: Dokumentacja CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-04-23T09:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla planisty Gateway.

Powiązane:

- Zadania Cron: [Cron jobs](/pl/automation/cron-jobs)

Wskazówka: uruchom `openclaw cron --help`, aby zobaczyć pełną powierzchnię poleceń.

Uwaga: `openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd
rozwiązanej trasy dostarczenia. Dla `channel: "last"` podgląd pokazuje, czy
trasa została rozwiązana z sesji main/current, czy zakończy się trybem fail-closed.

Uwaga: izolowane zadania `cron add` domyślnie używają dostarczenia `--announce`. Użyj `--no-deliver`, aby zachować
wynik wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.

Uwaga: dostarczanie czatu dla izolowanego Cron jest współdzielone. `--announce` to
zapasowe dostarczenie przez runner dla końcowej odpowiedzi; `--no-deliver` wyłącza to
zachowanie zapasowe, ale nie usuwa narzędzia `message` agenta, gdy trasa czatu jest dostępna.

Uwaga: zadania jednorazowe (`--at`) są domyślnie usuwane po sukcesie. Użyj `--keep-after-run`, aby je zachować.

Uwaga: `--session` obsługuje `main`, `isolated`, `current` i `session:<id>`.
Użyj `current`, aby powiązać z aktywną sesją w chwili tworzenia, albo `session:<id>`, aby użyć
jawnego trwałego klucza sesji.

Uwaga: dla jednorazowych zadań CLI daty i godziny `--at` bez przesunięcia są traktowane jako UTC, chyba że przekażesz także
`--tz <iana>`, co interpretuje ten lokalny czas ścienny w podanej strefie czasowej.

Uwaga: zadania cykliczne używają teraz wykładniczego backoffu ponownych prób po kolejnych błędach (30s → 1m → 5m → 15m → 60m), a następnie wracają do normalnego harmonogramu po kolejnym udanym uruchomieniu.

Uwaga: `openclaw cron run` zwraca teraz wynik, gdy tylko ręczne uruchomienie zostanie dodane do kolejki wykonania. Pomyślne odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`; użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

Uwaga: `openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować
starsze zachowanie „uruchom tylko, jeśli termin już nadszedł”.

Uwaga: izolowane tury Cron pomijają przestarzałe odpowiedzi zawierające tylko potwierdzenie. Jeśli
pierwszy wynik jest jedynie tymczasową aktualizacją stanu i żaden podrzędny przebieg subagenta
nie odpowiada za ostateczną odpowiedź, Cron ponownie zadaje prompt raz o rzeczywisty wynik
przed dostarczeniem.

Uwaga: jeśli izolowany przebieg Cron zwróci tylko cichy token (`NO_REPLY` /
`no_reply`), Cron pomija bezpośrednie dostarczenie wychodzące oraz zapasową ścieżkę
podsumowania z kolejki, więc nic nie zostanie opublikowane z powrotem na czacie.

Uwaga: `cron add|edit --model ...` używa dla zadania tego wybranego dozwolonego modelu.
Jeśli model nie jest dozwolony, Cron ostrzega i wraca do wyboru modelu agenta/domyślnego
dla zadania. Skonfigurowane łańcuchy zapasowe nadal mają zastosowanie, ale zwykłe
nadpisanie modelu bez jawnej listy zapasowej per zadanie nie dołącza już podstawowego modelu agenta jako ukrytego dodatkowego celu ponownej próby.

Uwaga: kolejność pierwszeństwa modelu dla izolowanego Cron to najpierw nadpisanie Gmail-hook, potem per-zadaniowe
`--model`, następnie dowolne zapisane nadpisanie modelu cron-session, a potem zwykły
wybór agenta/domyślny.

Uwaga: tryb szybki izolowanego Cron podąża za rozwiązanym wyborem modelu live. Konfiguracja modelu
`params.fastMode` jest stosowana domyślnie, ale zapisane nadpisanie `fastMode` sesji nadal ma pierwszeństwo nad konfiguracją.

Uwaga: jeśli izolowany przebieg zgłosi `LiveSessionModelSwitchError`, Cron zapisuje
przełączonego dostawcę/model (oraz przełączone nadpisanie profilu uwierzytelniania, jeśli występuje) przed
ponowną próbą. Zewnętrzna pętla ponownych prób jest ograniczona do 2 prób przełączenia po początkowej
próbie, a następnie przerywa zamiast zapętlać się bez końca.

Uwaga: powiadomienia o niepowodzeniu używają najpierw `delivery.failureDestination`, potem
globalnego `cron.failureDestination`, a na końcu wracają do głównego
celu announce zadania, gdy nie skonfigurowano jawnego celu błędów.

Uwaga: retencja/przycinanie jest kontrolowana w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina sesje ukończonych izolowanych przebiegów.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

Uwaga dotycząca aktualizacji: jeśli masz starsze zadania Cron sprzed obecnego formatu dostarczania/przechowywania, uruchom
`openclaw doctor --fix`. Doctor normalizuje teraz starsze pola Cron (`jobId`, `schedule.cron`,
pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w payload) i migruje proste
zadania zapasowe webhook z `notify: true` do jawnego dostarczania webhook, gdy skonfigurowano `cron.webhook`.

## Typowe edycje

Zaktualizuj ustawienia dostarczania bez zmiany wiadomości:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Wyłącz dostarczanie dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --no-deliver
```

Włącz lekki kontekst bootstrap dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --light-context
```

Ogłoś na określonym kanale:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Utwórz izolowane zadanie z lekkim kontekstem bootstrap:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` ma zastosowanie tylko do izolowanych zadań tury agenta. Dla przebiegów Cron
tryb lekki pozostawia kontekst bootstrap pusty zamiast wstrzykiwać pełny zestaw bootstrap workspace.

Uwaga o własności dostarczania:

- Dostarczanie czatu dla izolowanego Cron jest współdzielone. Agent może wysyłać bezpośrednio za pomocą
  narzędzia `message`, gdy trasa czatu jest dostępna.
- `announce` zapasowo dostarcza końcową odpowiedź tylko wtedy, gdy agent nie wysłał
  bezpośrednio do rozwiązanego celu. `webhook` publikuje gotowy payload pod URL.
  `none` wyłącza zapasowe dostarczanie przez runner.

## Typowe polecenia administracyjne

Ręczne uruchomienie:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem Cron,
rozwiązanym celem, wysłaniami przez narzędzie message, użyciem ścieżki zapasowej i stanem dostarczenia.

Przekierowanie agenta/sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Poprawki dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Uwaga o dostarczaniu błędów:

- `delivery.failureDestination` jest obsługiwane dla zadań izolowanych.
- Zadania main-session mogą używać `delivery.failureDestination` tylko wtedy, gdy główny
  tryb dostarczania to `webhook`.
- Jeśli nie ustawisz żadnego celu błędów, a zadanie już ogłasza na
  kanale, powiadomienia o niepowodzeniu ponownie użyją tego samego celu announce.
