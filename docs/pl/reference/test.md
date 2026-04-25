---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-25T13:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- Pełny zestaw testowy (pakiety testów, testy live, Docker): [Testing](/pl/help/testing)

- `pnpm test:force`: Kończy każdy pozostawiony proces Gateway, który trzyma domyślny port Control, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy poprzednie uruchomienie Gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia jednostkowego dla załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla linii/funkcji/instrukcji i 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia jednostkowego zamiast traktować każdy plik źródłowy z podzielonych ścieżek jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:changed`: rozwija zmienione ścieżki git do zakresowych ścieżek Vitest, gdy diff dotyka tylko routowalnych plików źródłowych/testowych. Zmiany konfiguracji/ustawień nadal wracają do natywnego uruchomienia projektów głównych, aby w razie potrzeby szeroko ponownie uruchamiać zmiany w połączeniach.
- `pnpm changed:lanes`: pokazuje ścieżki architektoniczne wyzwolone przez diff względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę zmian dla diffu względem `origin/main`. Uruchamia pracę rdzenia wraz ze ścieżkami testowymi rdzenia, pracę rozszerzeń wraz ze ścieżkami testowymi rozszerzeń, pracę wyłącznie testową tylko z typecheck/testami dla testów, rozszerza publiczne zmiany Plugin SDK lub plugin-contract do jednego przebiegu walidacji rozszerzeń i utrzymuje podbijanie wersji dotyczące wyłącznie metadanych wydania na ukierunkowanych kontrolach wersji/konfiguracji/zależności głównych.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowe ścieżki Vitest. Uruchomienia bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozwija się do konfiguracji shardów dla poszczególnych rozszerzeń zamiast jednego wielkiego procesu projektu głównego.
- Pełne uruchomienia i uruchomienia shardów rozszerzeń aktualizują lokalne dane czasu w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia używają tych czasów do równoważenia wolnych i szybkich shardów. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby ignorować lokalny artefakt czasów.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie ścieżki, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie środowiskowo na istniejących ścieżkach.
- Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` także mapują `pnpm test:changed` do jawnych sąsiednich testów w tych lekkich ścieżkach, dzięki czemu małe zmiany pomocników nie powodują ponownego uruchamiania ciężkich zestawów opartych na środowisku uruchomieniowym.
- `auto-reply` dzieli się teraz także na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), dzięki czemu harness odpowiedzi nie dominuje nad lżejszymi testami najwyższego poziomu dotyczącymi statusu/tokenów/pomocników.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, a współdzielony runner bez izolacji jest włączony w konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie pluginy kanałów, plugin przeglądarkowy i OpenAI działają jako dedykowane shardy; inne grupy pluginów pozostają wsadowe. Użyj `pnpm test extensions/<id>` dla jednej ścieżki zgrupowanego pluginu.
- `pnpm test:perf:imports`: włącza raportowanie czasu importu i rozbicia importów w Vitest, nadal używając zakresowego routingu ścieżek dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje ścieżkę routowaną w trybie changed z natywnym uruchomieniem projektu głównego dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` porównuje bieżący zestaw zmian w worktree bez wcześniejszego commitowania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU i sterty dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia każdą konfigurację liścia Vitest pełnego zestawu seryjnie i zapisuje zgrupowane dane czasów wraz z artefaktami JSON/log dla każdej konfiguracji. Agent wydajności testów używa tego jako bazowego punktu odniesienia przed próbą naprawy wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje zgrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja Gateway: opt-in przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` lub `pnpm test:gateway`.
- `pnpm test:e2e`: uruchamia testy smoke end-to-end Gateway (parowanie wielu instancji WS/HTTP/Node). Domyślnie używa `threads` + `isolate: false` z adaptacyjną liczbą workerów w `vitest.e2e.config.ts`; dostrajaj przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1` dla szczegółowych logów.
- `pnpm test:live`: uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API i `LIVE=1` (lub specyficznego dla dostawcy `*_LIVE_TEST=1`), aby przestać pomijać testy.
- `pnpm test:docker:all`: buduje raz współdzielony obraz testów live i obraz Docker E2E, a następnie uruchamia ścieżki smoke Dockera z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony harmonogram. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje liczbę slotów procesów i domyślnie ma wartość 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje pulę końcową wrażliwą na dostawców i domyślnie ma wartość 10. Limity ciężkich ścieżek domyślnie to `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity dostawców domyślnie pozwalają na jedną ciężką ścieżkę na dostawcę przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Starty ścieżek są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych burz tworzenia w demonie Docker; nadpisz przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Dockera, czyści stare kontenery OpenClaw E2E, emituje status aktywnych ścieżek co 30 sekund, współdzieli pamięci podręczne narzędzi CLI dostawców między zgodnymi ścieżkami, domyślnie ponawia przejściowe błędy dostawców live raz (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i zapisuje czasy ścieżek w `.artifacts/docker-tests/lane-timings.json`, aby późniejsze uruchomienia wykonywać od najdłuższych. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać manifest ścieżek bez uruchamiania Dockera, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wypisywanie statusu, lub `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` dla ścieżek wyłącznie deterministycznych/lokalnych lub `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` dla ścieżek wyłącznie live-provider; aliasami pakietów są `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko-live łączy główne i końcowe ścieżki live w jedną pulę od najdłuższych, aby koszyki dostawców mogły wspólnie upakowywać zadania Claude, Codex i Gemini. Runner przestaje planować nowe ścieżki z puli po pierwszej porażce, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każda ścieżka ma zapasowy limit czasu 120 minut, który można nadpisać przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/tail używają ciaśniejszych limitów dla pojedynczych ścieżek. Polecenia konfiguracji backendu CLI w Dockerze mają własny limit czasu przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi dla poszczególnych ścieżek są zapisywane w `.artifacts/docker-tests/<run-id>/`.
- Proby live backendu CLI w Dockerze można uruchamiać jako ukierunkowane ścieżki, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` lub `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: uruchamia dockerowe OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie wykonuje prawdziwy czat przez proxy przez `/api/chat/completions`. Wymaga działającego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie oczekuje się, że będzie stabilny w CI jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: uruchamia kontener Gateway z zasianymi danymi oraz drugi kontener kliencki, który uruchamia `openclaw mcp serve`, a następnie weryfikuje routowane wykrywanie konwersacji, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routowanie wysyłki wychodzącej oraz powiadomienia o kanałach i uprawnieniach w stylu Claude przez rzeczywisty most stdio. Asercja powiadomienia Claude odczytuje surowe ramki stdio MCP bezpośrednio, aby smoke odzwierciedlał to, co most faktycznie emituje.

## Lokalna bramka PR

Dla lokalnych kontroli land/gate PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` zgłasza flaky na obciążonym hoście, uruchom ponownie raz, zanim uznasz to za regresję, a następnie wyizoluj problem przez `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnienia modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 uruchomień):

- mediana minimax 1279 ms (min 1114, max 2431)
- mediana opus 2454 ms (min 1224, max 3170)

## Benchmark uruchamiania CLI

Skrypt: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Użycie:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presety:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: oba presety

Dane wyjściowe obejmują `sampleCount`, avg, p50, p95, min/max, rozkład exit-code/signal oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisuje profile V8 dla każdego uruchomienia, dzięki czemu pomiar czasu i przechwytywanie profilu używają tego samego harnessu.

Konwencje zapisanych danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje ukierunkowany artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json`, używając `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża śledzony w repozytorium fixture bazowy w `test/fixtures/cli-startup-bench.json`, używając `runs=5` i `warmup=1`

Fixture śledzony w repozytorium:

- `test/fixtures/cli-startup-bench.json`
- Odśwież przez `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture przez `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest potrzebny tylko do kontenerowych testów smoke onboarding.

Pełny przepływ zimnego startu w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-tty, weryfikuje pliki config/workspace/session, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Test smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocnik środowiska uruchomieniowego QR ładuje się w obsługiwanych środowiskach Node w Dockerze (domyślnie Node 24, zgodność z Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testing](/pl/help/testing)
- [Testing live](/pl/help/testing-live)
