---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (Vitest) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-26T11:40:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- Pełny zestaw testowy (pakiety, live, Docker): [Testy](/pl/help/testing)

- `pnpm test:force`: Zabija każdy zalegający proces Gateway trzymający domyślny port control, a następnie uruchamia pełny zestaw Vitest z izolowanym portem Gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy poprzednie uruchomienie Gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). To bramka pokrycia jednostkowego dla załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla linii/funkcji/instrukcji oraz 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia jednostkowego zamiast traktować każdy plik źródłowy z podzielonych lane jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:changed`: rozwija zmienione ścieżki git do zakresowanych lane Vitest, gdy diff dotyka tylko routowalnych plików źródłowych/testowych. Zmiany konfiguracji/setup nadal przechodzą awaryjnie do natywnego uruchomienia projektów głównych, aby edycje okablowania uruchamiały szeroki zestaw testów, gdy to potrzebne.
- `pnpm test:changed:focused`: uruchomienie testów zmienionych dla wewnętrznej pętli. Uruchamia tylko precyzyjne cele wynikające z bezpośrednich edycji testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł i lokalnego grafu importów. Szerokie zmiany konfiguracji/pakietów są pomijane zamiast rozwijania do pełnego awaryjnego uruchomienia testów zmienionych.
- `pnpm changed:lanes`: pokazuje lane architektoniczne uruchamiane przez diff względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę changed dla diffu względem `origin/main`. Uruchamia prace core z lane testowymi core, prace rozszerzeń z lane testowymi rozszerzeń, prace wyłącznie testowe tylko z typecheck/testami testów, rozszerza zmiany publicznego Plugin SDK lub kontraktu plugin do jednego przebiegu walidacji rozszerzeń oraz utrzymuje podbicia wersji dotyczące wyłącznie metadanych wydania na ukierunkowanych kontrolach wersji/konfiguracji/zależności głównych.
- `pnpm test`: kieruje jawne cele plików/katalogów przez zakresowane lane Vitest. Uruchomienia bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozwija się do konfiguracji shardów per rozszerzenie zamiast jednego ogromnego procesu projektu głównego.
- Pełne uruchomienia shardów, shardów rozszerzeń i shardów według wzorca include aktualizują lokalne dane czasowe w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia całych konfiguracji używają tych czasów do równoważenia wolnych i szybkich shardów. Shardy CI według wzorca include dopisują nazwę sharda do klucza czasowego, co utrzymuje widoczność czasów shardów filtrowanych bez zastępowania danych czasowych całych konfiguracji. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby ignorować lokalny artefakt czasowy.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie lane, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie runtime na istniejących lane.
- Pliki źródłowe z sąsiednimi testami są mapowane najpierw do tego sąsiedniego testu, zanim nastąpi przejście awaryjne do szerszych globów katalogowych. Edycje pomocników w `test/helpers/channels` i `test/helpers/plugins` używają lokalnego grafu importów do uruchamiania testów importujących zamiast szerokiego uruchamiania każdego sharda, gdy ścieżka zależności jest precyzyjna.
- `auto-reply` jest teraz również podzielone na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby harness odpowiedzi nie dominował lżejszych testów status/token/helper najwyższego poziomu.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, ze współdzielonym nieizolowanym runnerem włączonym w konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/plugin. Ciężkie plugin kanałów, plugin przeglądarki i OpenAI działają jako dedykowane shardy; inne grupy plugin pozostają zbatched. Użyj `pnpm test extensions/<id>` dla lane jednego dołączonego plugin.
- `pnpm test:perf:imports`: włącza raportowanie czasu importu Vitest i rozbicia importów, nadal używając zakresowanego routingu lane dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkuje kierowaną ścieżkę trybu changed względem natywnego uruchomienia projektu głównego dla tego samego zatwierdzonego diffu git.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżący zestaw zmian worktree bez wcześniejszego zatwierdzania.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU + sterty dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: uruchamia każdą konfigurację liścia Vitest pełnego zestawu seryjnie i zapisuje zgrupowane dane czasu trwania oraz artefakty JSON/log per konfiguracja. Agent wydajności testów używa tego jako punktu odniesienia przed próbą naprawy wolnych testów.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: porównuje zgrupowane raporty po zmianie ukierunkowanej na wydajność.
- Integracja Gateway: opcjonalnie przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` lub `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia testy smoke end-to-end Gateway (parowanie wielu instancji WS/HTTP/node). Domyślnie używa `threads` + `isolate: false` z adaptacyjną liczbą workerów w `vitest.e2e.config.ts`; dostrój przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1`, aby uzyskać szczegółowe logi.
- `pnpm test:live`: Uruchamia testy live dostawców (minimax/zai). Wymaga kluczy API i `LIVE=1` (lub specyficznego dla dostawcy `*_LIVE_TEST=1`), aby przestać pomijać testy.
- `pnpm test:docker:all`: Buduje raz współdzielony obraz testów live i obraz Docker E2E, a następnie uruchamia lane smoke Docker z `OPENCLAW_SKIP_DOCKER_BUILD=1` przez ważony scheduler. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kontroluje sloty procesów i domyślnie ma wartość 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kontroluje pulę tail wrażliwą na dostawcę i domyślnie ma wartość 10. Limity ciężkich lane domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; limity dostawców domyślnie ustawiono na jeden ciężki lane na dostawcę przez `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` i `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Użyj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` dla większych hostów. Starty lane są domyślnie rozkładane co 2 sekundy, aby uniknąć lokalnych burz tworzenia w demonie Docker; nadpisz przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner domyślnie wykonuje preflight Dockera, czyści przestarzałe kontenery OpenClaw E2E, emituje status aktywnych lane co 30 sekund, współdzieli cache narzędzi CLI dostawców między zgodnymi lane, domyślnie raz ponawia przejściowe błędy dostawców live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) i zapisuje czasy lane w `.artifacts/docker-tests/lane-timings.json` dla porządkowania od najdłuższych w kolejnych uruchomieniach. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać manifest lane bez uruchamiania Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, aby dostroić wyjście statusu, lub `OPENCLAW_DOCKER_ALL_TIMINGS=0`, aby wyłączyć ponowne użycie czasów. Użyj `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` dla deterministycznych/lokalnych lane albo `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` tylko dla lane dostawców live; aliasy pakietów to `pnpm test:docker:local:all` i `pnpm test:docker:live:all`. Tryb tylko-live łączy główne i tail lane live w jedną pulę od najdłuższych, aby koszyki dostawców mogły pakować razem pracę Claude, Codex i Gemini. Runner przestaje planować nowe lane puli po pierwszym błędzie, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każdy lane ma zapasowy limit czasu 120 minut, który można nadpisać przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane lane live/tail używają ciaśniejszych limitów per lane. Polecenia konfiguracji backendu CLI w Docker mają własny limit czasu przez `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (domyślnie 180). Logi per lane są zapisywane w `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: Buduje kontener źródłowy E2E oparty na Chromium, uruchamia surowe CDP oraz izolowany Gateway, wykonuje `browser doctor --deep` i sprawdza, że snapshoty ról CDP zawierają URL-e linków, klikalne elementy promowane kursorem, odwołania do iframe i metadane ramek.
- Testy live backendu CLI w Docker można uruchamiać jako lane ukierunkowane, na przykład `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` lub `pnpm test:docker:live-cli-backend:codex:mcp`. Claude i Gemini mają odpowiadające aliasy `:resume` i `:mcp`.
- `pnpm test:docker:openwebui`: Uruchamia Dockerized OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie wykonuje rzeczywisty czat proxied przez `/api/chat/completions`. Wymaga działającego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie ma być tak stabilny w CI jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia seedowany kontener Gateway i drugi kontener klienta, który uruchamia `openclaw mcp serve`, a następnie weryfikuje routowane wykrywanie konwersacji, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routowanie wysyłki wychodzącej oraz powiadomienia kanałów i uprawnień w stylu Claude przez rzeczywisty most stdio. Asercja powiadomień Claude odczytuje bezpośrednio surowe ramki stdio MCP, aby test smoke odzwierciedlał to, co most faktycznie emituje.

## Lokalna bramka PR

Dla lokalnych kontroli lądowania/bramkowania PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` daje flaky wyniki na obciążonym hoście, uruchom ponownie raz przed uznaniem tego za regresję, a następnie odizoluj przez `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnienia modelu (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: “Reply with a single word: ok. No punctuation or extra text.”

Ostatnie uruchomienie (2025-12-31, 20 uruchomień):

- minimax mediana 1279 ms (min 1114, max 2431)
- opus mediana 2454 ms (min 1224, max 3170)

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

Dane wyjściowe obejmują `sampleCount`, avg, p50, p95, min/max, rozkład exit-code/signal oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisuje profile V8 dla każdego uruchomienia, dzięki czemu pomiar czasu i przechwytywanie profili używają tego samego harnessu.

Konwencje zapisu danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje ukierunkowany artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json` z użyciem `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża śledzoną w repozytorium bazową fixture w `test/fixtures/cli-startup-bench.json` z użyciem `runs=5` i `warmup=1`

Fixture śledzona w repozytorium:

- `test/fixtures/cli-startup-bench.json`
- Odśwież przez `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture przez `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko dla kontenerowych testów smoke onboardingu.

Pełny przepływ cold start w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt steruje interaktywnym kreatorem przez pseudo-TTY, weryfikuje pliki config/workspace/session, a następnie uruchamia Gateway i wykonuje `openclaw health`.

## Test smoke importu QR (Docker)

Zapewnia, że utrzymywany pomocnik środowiska uruchomieniowego QR ładuje się w obsługiwanych środowiskach uruchomieniowych Docker Node (domyślnie Node 24, zgodny także z Node 22):

```bash
pnpm test:docker:qr
```

## Powiązane

- [Testy](/pl/help/testing)
- [Testy live](/pl/help/testing-live)
