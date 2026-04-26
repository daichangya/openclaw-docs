---
read_when:
    - Chcesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonanie cron i logi
summary: Dokumentacja referencyjna CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:25:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Zarządzaj zadaniami cron dla harmonogramu Gateway.

Powiązane:

- Zadania cron: [Zadania cron](/pl/automation/cron-jobs)

Wskazówka: uruchom `openclaw cron --help`, aby zobaczyć pełną powierzchnię poleceń.

Uwaga: `openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd
rozstrzygniętej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy
trasa została rozstrzygnięta z sesji głównej/bieżącej, czy zostanie bezpiecznie zablokowana.

Uwaga: izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować
wynik wewnętrznie. `--deliver` pozostaje przestarzałym aliasem `--announce`.

Uwaga: dostarczanie do czatu w izolowanym cron jest współdzielone. `--announce` to zastępcze
dostarczanie końcowej odpowiedzi przez wykonawcę; `--no-deliver` wyłącza to zastępcze działanie, ale
nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Uwaga: zadania jednorazowe (`--at`) są domyślnie usuwane po pomyślnym zakończeniu. Użyj `--keep-after-run`, aby je zachować.

Uwaga: `--session` obsługuje `main`, `isolated`, `current` i `session:<id>`.
Użyj `current`, aby powiązać z aktywną sesją w chwili tworzenia, lub `session:<id>` dla
jawnego trwałego klucza sesji.

Uwaga: `--session isolated` tworzy nowy identyfikator transkryptu/sesji dla każdego uruchomienia.
Bezpieczne preferencje i jawnie wybrane przez użytkownika nadpisania modelu/auth mogą zostać przeniesione, ale
kontekst otaczającej rozmowy nie: routing kanału/grupy, polityka wysyłki/kolejkowania,
podwyższenie uprawnień, pochodzenie i powiązanie runtime ACP są resetowane dla nowego izolowanego uruchomienia.

Uwaga: dla jednorazowych zadań CLI wartości daty i czasu `--at` bez przesunięcia strefy są traktowane jako UTC, chyba że podasz także
`--tz <iana>`, co interpretuje ten lokalny czas ścienny w podanej strefie czasowej.

Uwaga: zadania cykliczne używają teraz wykładniczego backoff ponowień po kolejnych błędach (30 s → 1 min → 5 min → 15 min → 60 min), a potem wracają do normalnego harmonogramu po następnym pomyślnym uruchomieniu.

Uwaga: `openclaw cron run` zwraca wynik, gdy tylko ręczne uruchomienie zostanie umieszczone w kolejce do wykonania. Pomyślne odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`; użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

Uwaga: `openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować
starsze zachowanie „uruchom tylko, jeśli już pora”.

Uwaga: izolowane cykle cron pomijają nieaktualne odpowiedzi zawierające tylko potwierdzenie. Jeśli
pierwszy wynik to jedynie tymczasowa aktualizacja stanu i żadne podrzędne uruchomienie subagenta nie
odpowiada za końcową odpowiedź, cron ponawia prompt jeden raz, aby uzyskać właściwy wynik
przed dostarczeniem.

Uwaga: jeśli izolowane uruchomienie cron zwraca tylko cichy token (`NO_REPLY` /
`no_reply`), cron pomija zarówno bezpośrednie dostarczanie wychodzące, jak i zastępczą ścieżkę
podsumowania w kolejce, więc nic nie zostanie opublikowane z powrotem na czacie.

Uwaga: `cron add|edit --model ...` używa tego wybranego dozwolonego modelu dla zadania.
Jeśli model nie jest dozwolony, cron wyświetla ostrzeżenie i zamiast tego wraca do wyboru
modelu agenta/domyślnego dla zadania. Skonfigurowane łańcuchy fallback nadal obowiązują, ale zwykłe
nadpisanie modelu bez jawnej listy fallback per zadanie nie dodaje już podstawowego modelu
agenta jako ukrytego dodatkowego celu ponowień.

Uwaga: kolejność pierwszeństwa modelu w izolowanym cron to najpierw nadpisanie hooka Gmail,
potem `--model` per zadanie, następnie nadpisanie modelu zapisanej sesji cron wybrane przez użytkownika,
a potem zwykły wybór agenta/domyślny.

Uwaga: tryb fast w izolowanym cron podąża za rozstrzygniętym wyborem modelu na żywo. Konfiguracja modelu
`params.fastMode` jest stosowana domyślnie, ale zapisane nadpisanie `fastMode` sesji
nadal ma pierwszeństwo nad konfiguracją.

Uwaga: jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, cron utrwala
przełączonego providera/model (oraz nadpisanie przełączonego profilu auth, jeśli występuje) dla
aktywnego uruchomienia przed ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do 2
ponowień po przełączeniu po początkowej próbie, a następnie przerywa zamiast zapętlać się bez końca.

Uwaga: powiadomienia o niepowodzeniu używają najpierw `delivery.failureDestination`, potem
globalnego `cron.failureDestination`, a na końcu wracają do głównego celu
ogłoszeń zadania, gdy nie skonfigurowano jawnego celu powiadomień o błędzie.

Uwaga: retencja/przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

Uwaga dotycząca aktualizacji: jeśli masz starsze zadania cron sprzed obecnego formatu dostarczania/magazynu, uruchom
`openclaw doctor --fix`. Doctor normalizuje teraz starsze pola cron (`jobId`, `schedule.cron`,
pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w payloadzie) i migruje proste
zadania zastępczego Webhook z `notify: true` do jawnego dostarczania Webhook, gdy skonfigurowano `cron.webhook`.

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

`--light-context` dotyczy tylko izolowanych zadań typu cykl agenta. W przypadku uruchomień cron tryb lekki pozostawia kontekst bootstrap pusty zamiast wstrzykiwać pełny zestaw bootstrap obszaru roboczego.

Uwaga dotycząca własności dostarczania:

- Dostarczanie do czatu w izolowanym cron jest współdzielone. Agent może wysyłać bezpośrednio za pomocą narzędzia
  `message`, gdy dostępna jest trasa czatu.
- `announce` zastępczo dostarcza końcową odpowiedź tylko wtedy, gdy agent nie wysłał jej
  bezpośrednio do rozstrzygniętego celu. `webhook` wysyła końcowy payload metodą POST na URL.
  `none` wyłącza zastępcze dostarczanie przez wykonawcę.
- Przypomnienia utworzone z aktywnego czatu zachowują aktywny cel dostarczania czatu
  dla zastępczego dostarczania announce. Wewnętrzne klucze sesji mogą być zapisane małymi literami; nie
  używaj ich jako źródła prawdy dla identyfikatorów providera wrażliwych na wielkość liter, takich jak identyfikatory
  pokojów Matrix.

## Typowe polecenia administracyjne

Ręczne uruchomienie:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem cron,
rozstrzygniętym celem, wysyłkami przez narzędzie message, użyciem fallback i stanem dostarczenia.

Przekierowanie agenta/sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Dostosowania dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Uwaga dotycząca dostarczania błędów:

- `delivery.failureDestination` jest obsługiwane dla zadań izolowanych.
- Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy główny
  tryb dostarczania to `webhook`.
- Jeśli nie ustawisz żadnego celu powiadomień o błędach, a zadanie już ogłasza do
  kanału, powiadomienia o niepowodzeniu ponownie użyją tego samego celu announce.

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
