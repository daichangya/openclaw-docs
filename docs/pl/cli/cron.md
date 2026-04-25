---
read_when:
    - Chcesz zaplanowanych zadań i wybudzeń.
    - Debugujesz wykonywanie Cron i logi.
summary: Dokumentacja CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:43:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla harmonogramu Gateway.

Powiązane:

- Zadania Cron: [Cron jobs](/pl/automation/cron-jobs)

Wskazówka: uruchom `openclaw cron --help`, aby zobaczyć pełną powierzchnię poleceń.

Uwaga: `openclaw cron list` i `openclaw cron show <job-id>` wyświetlają podgląd
rozwiązanej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy
trasa została rozwiązana z sesji głównej/bieżącej, czy zostanie zamknięta bezpiecznie przy błędzie.

Uwaga: izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować
wynik wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.

Uwaga: dostarczanie do czatu dla izolowanego Cron jest współdzielone. `--announce` to rezerwowe
dostarczanie przez wykonawcę dla końcowej odpowiedzi; `--no-deliver` wyłącza to
zachowanie rezerwowe, ale nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Uwaga: zadania jednorazowe (`--at`) są domyślnie usuwane po powodzeniu. Użyj `--keep-after-run`, aby je zachować.

Uwaga: `--session` obsługuje `main`, `isolated`, `current` oraz `session:<id>`.
Użyj `current`, aby powiązać z aktywną sesją w momencie tworzenia, albo `session:<id>` dla
jawnego trwałego klucza sesji.

Uwaga: `--session isolated` tworzy świeży identyfikator transkryptu/sesji dla każdego uruchomienia.
Bezpieczne preferencje i jawne nadpisania modelu/uwierzytelniania wybrane przez użytkownika mogą być przenoszone, ale
otaczający kontekst rozmowy nie jest: routing kanału/grupy, zasady wysyłania/kolejkowania,
eskalacja, pochodzenie i powiązanie środowiska wykonawczego ACP są resetowane dla nowego izolowanego uruchomienia.

Uwaga: dla jednorazowych zadań CLI daty i godziny `--at` bez przesunięcia są traktowane jako UTC, chyba że przekażesz również
`--tz <iana>`, co interpretuje ten lokalny czas ścienny w podanej strefie czasowej.

Uwaga: zadania cykliczne używają teraz wykładniczego opóźnienia ponownych prób po kolejnych błędach (30s → 1m → 5m → 15m → 60m), a następnie wracają do normalnego harmonogramu po kolejnym udanym uruchomieniu.

Uwaga: `openclaw cron run` zwraca teraz wynik, gdy tylko ręczne uruchomienie zostanie zakolejkowane do wykonania. Pomyślne odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`; użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

Uwaga: `openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować
starsze zachowanie „uruchom tylko, jeśli termin już nadszedł”.

Uwaga: izolowane uruchomienia Cron tłumią nieaktualne odpowiedzi zawierające wyłącznie potwierdzenie. Jeśli
pierwszy wynik jest tylko tymczasową aktualizacją statusu i żadne podrzędne uruchomienie subagenta
nie odpowiada za ostateczną odpowiedź, Cron ponownie wyświetla monit raz, aby uzyskać rzeczywisty wynik przed dostarczeniem.

Uwaga: jeśli izolowane uruchomienie zwróci tylko cichy token (`NO_REPLY` /
`no_reply`), Cron tłumi bezpośrednie dostarczanie wychodzące oraz rezerwową ścieżkę
podsumowania w kolejce, więc nic nie zostanie opublikowane z powrotem na czacie.

Uwaga: `cron add|edit --model ...` używa tego wybranego dozwolonego modelu dla zadania.
Jeśli model nie jest dozwolony, Cron ostrzega i wraca do wyboru
modelu agenta/domyślnego dla zadania. Skonfigurowane łańcuchy rezerwowe nadal obowiązują, ale zwykłe
nadpisanie modelu bez jawnej listy rezerwowej per zadanie nie dodaje już głównego modelu agenta jako ukrytego dodatkowego celu ponowienia.

Uwaga: kolejność pierwszeństwa modelu dla izolowanego Cron to najpierw nadpisanie Gmail-hook, potem per-zadanie
`--model`, potem ewentualne zapisane nadpisanie modelu sesji Cron wybrane przez użytkownika, a następnie
zwykły wybór agenta/domyślny.

Uwaga: tryb szybki izolowanego Cron podąża za rozwiązanym wyborem modelu na żywo. Konfiguracja
modelu `params.fastMode` obowiązuje domyślnie, ale zapisane nadpisanie sesji `fastMode` nadal ma pierwszeństwo przed konfiguracją.

Uwaga: jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, Cron zapisuje
przełączonego dostawcę/model (oraz przełączone nadpisanie profilu uwierzytelniania, jeśli występuje) dla
aktywnego uruchomienia przed ponowieniem próby. Zewnętrzna pętla ponowień jest ograniczona do 2 prób przełączenia
po początkowej próbie, a potem przerywa zamiast zapętlać się bez końca.

Uwaga: powiadomienia o niepowodzeniu używają najpierw `delivery.failureDestination`, potem
globalnego `cron.failureDestination`, a na końcu wracają do podstawowego
celu ogłoszenia zadania, gdy nie skonfigurowano jawnego miejsca docelowego błędu.

Uwaga: retencja/przycinanie jest kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina zakończone izolowane sesje uruchomień.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

Uwaga dotycząca aktualizacji: jeśli masz starsze zadania Cron sprzed bieżącego formatu dostarczania/przechowywania, uruchom
`openclaw doctor --fix`. Doctor normalizuje teraz starsze pola Cron (`jobId`, `schedule.cron`,
pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w ładunku) i migruje proste
rezerwowe zadania Webhook `notify: true` do jawnego dostarczania Webhook, gdy `cron.webhook` jest
skonfigurowane.

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

Ogłoś na konkretnym kanale:

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

`--light-context` dotyczy tylko izolowanych uruchomień typu agent-turn. Dla uruchomień Cron tryb lekki pozostawia kontekst bootstrap pusty zamiast wstrzykiwać pełny zestaw bootstrap obszaru roboczego.

Uwaga dotycząca własności dostarczania:

- Dostarczanie do czatu dla izolowanego Cron jest współdzielone. Agent może wysyłać bezpośrednio za pomocą
  narzędzia `message`, gdy dostępna jest trasa czatu.
- `announce` dostarcza końcową odpowiedź rezerwowo tylko wtedy, gdy agent nie wysłał
  bezpośrednio do rozwiązanego celu. `webhook` publikuje gotowy ładunek pod URL.
  `none` wyłącza rezerwowe dostarczanie przez wykonawcę.

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
rozwiązanym celem, wysłaniami narzędzia message, użyciem mechanizmu rezerwowego i stanem dostarczenia.

Przekierowanie agenta/sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Dostosowanie dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Uwaga dotycząca dostarczania błędów:

- `delivery.failureDestination` jest obsługiwane dla zadań izolowanych.
- Zadania głównej sesji mogą używać `delivery.failureDestination` tylko wtedy, gdy podstawowy
  tryb dostarczania to `webhook`.
- Jeśli nie ustawisz żadnego miejsca docelowego błędu, a zadanie już ogłasza do
  kanału, powiadomienia o błędach wykorzystają ten sam cel ogłoszenia.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Scheduled Tasks](/pl/automation/cron-jobs)
