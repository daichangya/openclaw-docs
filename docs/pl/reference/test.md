---
read_when:
    - Uruchamianie lub naprawianie testów
summary: Jak uruchamiać testy lokalnie (`vitest`) i kiedy używać trybów force/coverage
title: Testy
x-i18n:
    generated_at: "2026-04-23T13:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Testy

- Pełny zestaw informacji o testowaniu (zestawy, live, Docker): [Testowanie](/pl/help/testing)

- `pnpm test:force`: Kończy każdy pozostawiony proces gateway, który trzyma domyślny port kontrolny, a następnie uruchamia pełny zestaw Vitest z odizolowanym portem gateway, aby testy serwera nie kolidowały z działającą instancją. Użyj tego, gdy poprzednie uruchomienie gateway pozostawiło zajęty port 18789.
- `pnpm test:coverage`: Uruchamia zestaw testów jednostkowych z pokryciem V8 (przez `vitest.unit.config.ts`). Jest to bramka pokrycia jednostkowego dla załadowanych plików, a nie pokrycie wszystkich plików w całym repozytorium. Progi wynoszą 70% dla linii/funkcji/instrukcji oraz 55% dla gałęzi. Ponieważ `coverage.all` ma wartość false, bramka mierzy pliki załadowane przez zestaw pokrycia jednostkowego zamiast traktować każdy plik źródłowy z podzielonych lane’ów jako niepokryty.
- `pnpm test:coverage:changed`: Uruchamia pokrycie jednostkowe tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:changed`: rozwija zmienione ścieżki gita do zakresowanych lane’ów Vitest, gdy diff dotyczy wyłącznie routowalnych plików źródłowych/testowych. Zmiany konfiguracji/ustawień nadal wracają do natywnego uruchomienia głównych projektów, aby zmiany w okablowaniu uruchamiały testy szerzej, gdy to potrzebne.
- `pnpm changed:lanes`: pokazuje architektoniczne lane’y uruchomione przez diff względem `origin/main`.
- `pnpm check:changed`: uruchamia inteligentną bramkę changed dla diffu względem `origin/main`. Uruchamia pracę core z lane’ami testowymi core, pracę rozszerzeń z lane’ami testowymi rozszerzeń, zmiany tylko w testach wyłącznie z typecheckiem/testami testów, rozszerza zmiany publicznego Plugin SDK lub kontraktu pluginów do walidacji rozszerzeń oraz utrzymuje podbicia wersji tylko w metadanych wydania na ukierunkowanych sprawdzeniach wersji/konfiguracji/zależności głównych.
- `pnpm test`: przekazuje jawne cele plików/katalogów przez zakresowane lane’y Vitest. Uruchomienia bez celu używają stałych grup shardów i rozwijają się do konfiguracji liści dla lokalnego wykonania równoległego; grupa rozszerzeń zawsze rozwija się do konfiguracji shardów poszczególnych rozszerzeń zamiast jednego wielkiego procesu głównego projektu.
- Pełne uruchomienia i uruchomienia shardów rozszerzeń aktualizują lokalne dane czasowe w `.artifacts/vitest-shard-timings.json`; późniejsze uruchomienia używają tych czasów do równoważenia wolnych i szybkich shardów. Ustaw `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, aby zignorować lokalny artefakt czasowy.
- Wybrane pliki testowe `plugin-sdk` i `commands` są teraz kierowane przez dedykowane lekkie lane’y, które zachowują tylko `test/setup.ts`, pozostawiając przypadki ciężkie runtime’owo na ich istniejących lane’ach.
- Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` również mapują `pnpm test:changed` do jawnych testów rodzeństwa w tych lekkich lane’ach, dzięki czemu małe zmiany w helperach nie powodują ponownego uruchamiania ciężkich zestawów wspieranych przez runtime.
- `auto-reply` dzieli się teraz również na trzy dedykowane konfiguracje (`core`, `top-level`, `reply`), aby harness reply nie dominował lżejszych testów statusu/tokenów/helperów na poziomie top-level.
- Bazowa konfiguracja Vitest domyślnie używa teraz `pool: "threads"` i `isolate: false`, z włączonym współdzielonym nieizolowanym runnerem we wszystkich konfiguracjach repozytorium.
- `pnpm test:channels` uruchamia `vitest.channels.config.ts`.
- `pnpm test:extensions` i `pnpm test extensions` uruchamiają wszystkie shardy rozszerzeń/pluginów. Ciężkie rozszerzenia kanałów i OpenAI działają jako dedykowane shardy; pozostałe grupy rozszerzeń pozostają zgrupowane. Użyj `pnpm test extensions/<id>` dla lane’u jednego wbudowanego pluginu.
- `pnpm test:perf:imports`: włącza raportowanie czasu importu + rozbicia importów Vitest, nadal używając zakresowanego routingu lane’ów dla jawnych celów plików/katalogów.
- `pnpm test:perf:imports:changed`: to samo profilowanie importów, ale tylko dla plików zmienionych względem `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` wykonuje benchmark ścieżki routowanej w trybie changed względem natywnego uruchomienia głównych projektów dla tego samego zatwierdzonego diffu gita.
- `pnpm test:perf:changed:bench -- --worktree` wykonuje benchmark bieżącego zestawu zmian w worktree bez wcześniejszego commita.
- `pnpm test:perf:profile:main`: zapisuje profil CPU dla głównego wątku Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: zapisuje profile CPU + heap dla runnera jednostkowego (`.artifacts/vitest-runner-profile`).
- Integracja Gateway: włączana opcjonalnie przez `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` lub `pnpm test:gateway`.
- `pnpm test:e2e`: Uruchamia testy smoke end-to-end gateway (`multi-instance WS/HTTP/node pairing`). Domyślnie używa `threads` + `isolate: false` z adaptacyjną liczbą workerów w `vitest.e2e.config.ts`; dostrój przez `OPENCLAW_E2E_WORKERS=<n>` i ustaw `OPENCLAW_E2E_VERBOSE=1`, aby włączyć szczegółowe logi.
- `pnpm test:live`: Uruchamia testy live providerów (`minimax/zai`). Wymaga kluczy API oraz `LIVE=1` (lub specyficznego dla providera `*_LIVE_TEST=1`), aby zdjąć skip.
- `pnpm test:docker:all`: Buduje raz współdzielony obraz live-test oraz obraz Docker E2E, a następnie uruchamia lane’y smoke Dockera z `OPENCLAW_SKIP_DOCKER_BUILD=1` i domyślną współbieżnością 4. Dostraja się przez `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Runner przestaje planować nowe lane’y z puli po pierwszym błędzie, chyba że ustawiono `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, a każdy lane ma limit czasu 120 minut, który można nadpisać przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lane’y wrażliwe na start lub providera działają wyłącznie po zakończeniu puli równoległej. Logi dla każdego lane’u są zapisywane w `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: Uruchamia Dockerized OpenClaw + Open WebUI, loguje się przez Open WebUI, sprawdza `/api/models`, a następnie wykonuje prawdziwy czat proxied przez `/api/chat/completions`. Wymaga działającego klucza modelu live (na przykład OpenAI w `~/.profile`), pobiera zewnętrzny obraz Open WebUI i nie powinien być traktowany jako stabilny w CI tak jak zwykłe zestawy unit/e2e.
- `pnpm test:docker:mcp-channels`: Uruchamia seedowany kontener Gateway i drugi kontener klienta, który uruchamia `openclaw mcp serve`, a następnie weryfikuje routowane wykrywanie konwersacji, odczyty transkryptów, metadane załączników, zachowanie kolejki zdarzeń live, routowanie wysyłki wychodzącej oraz powiadomienia o kanałach i uprawnieniach w stylu Claude przez prawdziwy most stdio. Asercja powiadomień Claude odczytuje surowe ramki stdio MCP bezpośrednio, aby smoke odzwierciedlał to, co most rzeczywiście emituje.

## Lokalna bramka PR

Do lokalnych sprawdzeń przed scaleniem/bramkowaniem PR uruchom:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jeśli `pnpm test` flaky na obciążonym hoście, uruchom ponownie jeden raz, zanim uznasz to za regresję, a następnie zawęź problem przez `pnpm test <path/to/test>`. Dla hostów z ograniczoną pamięcią użyj:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark opóźnień modeli (lokalne klucze)

Skrypt: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Użycie:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Opcjonalne zmienne środowiskowe: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Domyślny prompt: „Odpowiedz jednym słowem: ok. Bez interpunkcji ani dodatkowego tekstu.”

Ostatnie uruchomienie (2025-12-31, 20 uruchomień):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

## Benchmark startu CLI

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

Dane wyjściowe zawierają `sampleCount`, avg, p50, p95, min/max, rozkład exit code/signal oraz podsumowania maksymalnego RSS dla każdego polecenia. Opcjonalne `--cpu-prof-dir` / `--heap-prof-dir` zapisuje profile V8 dla każdego uruchomienia, aby pomiar czasu i przechwytywanie profili używały tego samego harnessu.

Konwencje zapisu danych wyjściowych:

- `pnpm test:startup:bench:smoke` zapisuje docelowy artefakt smoke w `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` zapisuje artefakt pełnego zestawu w `.artifacts/cli-startup-bench-all.json` z użyciem `runs=5` i `warmup=1`
- `pnpm test:startup:bench:update` odświeża śledzony w repo fixture bazowy w `test/fixtures/cli-startup-bench.json` z użyciem `runs=5` i `warmup=1`

Fixture śledzony w repo:

- `test/fixtures/cli-startup-bench.json`
- Odśwież przez `pnpm test:startup:bench:update`
- Porównaj bieżące wyniki z fixture przez `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker jest opcjonalny; jest to potrzebne tylko do kontenerowych testów smoke onboardingu.

Pełny przepływ cold-start w czystym kontenerze Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Ten skrypt przeprowadza interaktywny kreator przez pseudo-tty, weryfikuje pliki config/workspace/session, a następnie uruchamia gateway i wykonuje `openclaw health`.

## Smoke importu QR (Docker)

Zapewnia, że `qrcode-terminal` ładuje się w obsługiwanych runtime’ach Node w Dockerze (domyślnie Node 24, zgodność z Node 22):

```bash
pnpm test:docker:qr
```
