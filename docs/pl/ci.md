---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI uruchomiło się lub nie uruchomiło.
    - Debugujesz nieudane kontrole GitHub Actions
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-26T11:25:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

CI działa przy każdym pushu do `main` i przy każdym pull requeście. Używa inteligentnego zakresowania, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

QA Lab ma dedykowane ścieżki CI poza głównym workflow z inteligentnym zakresowaniem. Workflow
`Parity gate` uruchamia się przy pasujących zmianach w PR oraz przy ręcznym wywołaniu; buduje
prywatne środowisko wykonawcze QA i porównuje agentowe pakiety mock GPT-5.5 oraz Opus 4.6.
Workflow `QA-Lab - All Lanes` uruchamia się co noc na `main` oraz przy ręcznym wywołaniu; rozdziela
mock parity gate, aktywną ścieżkę Matrix i aktywną ścieżkę Telegram jako zadania równoległe.
Aktywne zadania używają środowiska `qa-live-shared`, a ścieżka Telegram używa dzierżaw Convex.
`OpenClaw Release Checks` uruchamia również te same ścieżki QA Lab przed zatwierdzeniem wydania.

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainera do porządkowania duplikatów po
wdrożeniu zmian. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR-y, gdy
`apply=true`. Przed modyfikacją GitHub weryfikuje, że wdrożony PR jest scalony oraz że każdy duplikat
ma albo wspólne referencjonowane issue, albo nakładające się fragmenty zmian.

Workflow `Docs Agent` to oparta na zdarzeniach ścieżka utrzymaniowa Codex do utrzymywania
istniejącej dokumentacji w zgodzie z ostatnio wdrożonymi zmianami. Nie ma czystego harmonogramu:
może ją wyzwolić udane uruchomienie CI na `main` po pushu niebędącym botem, a ręczne wywołanie może
uruchomić ją bezpośrednio. Wywołania typu workflow-run są pomijane, gdy `main` zdążył już pójść
dalej albo gdy w ciągu ostatniej godziny utworzono już inne niepominięte uruchomienie Docs Agent.
Gdy się uruchamia, przegląda zakres commitów od poprzedniego źródłowego SHA niepominiętego Docs Agent
do bieżącego `main`, więc jedno godzinne uruchomienie może objąć wszystkie zmiany na main
nagromadzone od ostatniego przebiegu dokumentacji.

Workflow `Test Performance Agent` to oparta na zdarzeniach ścieżka utrzymaniowa Codex dla wolnych
testów. Nie ma czystego harmonogramu: może ją wyzwolić udane uruchomienie CI na `main` po pushu
niebędącym botem, ale jest pomijana, jeśli inna wywołana przez workflow-run instancja już uruchomiła
się lub jest uruchomiona tego dnia UTC. Ręczne wywołanie omija tę dzienną bramkę aktywności.
Ścieżka buduje raport wydajności Vitest dla pełnego zestawu testów pogrupowany według kategorii,
pozwala Codexowi wykonywać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast
szerokich refaktorów, a następnie ponownie uruchamia raport dla pełnego zestawu i odrzuca zmiany,
które obniżają bazową liczbę przechodzących testów. Jeśli baza ma nieprzechodzące testy, Codex może
naprawić tylko oczywiste błędy, a raport pełnego zestawu po działaniu agenta musi przejść, zanim
cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się do przodu przed wdrożeniem pushu bota,
ścieżka rebase’uje zweryfikowaną poprawkę, ponownie uruchamia `pnpm check:changed` i ponawia push;
konfliktujące, nieaktualne poprawki są pomijane. Używa GitHub-hosted Ubuntu, aby akcja Codex mogła
zachować tę samą bezpieczną postawę drop-sudo co agent dokumentacji.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Omówienie zadań

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze przy pushach i PR-ach, które nie są draftami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                 | Zawsze przy pushach i PR-ach, które nie są draftami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem ostrzeżeń npm                           | Zawsze przy pushach i PR-ach, które nie są draftami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze przy pushach i PR-ach, które nie są draftami |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku dla zadań podrzędnych | Zmiany istotne dla Node |
| `checks-fast-core`               | Szybkie ścieżki poprawności na Linux, takie jak kontrole bundled/plugin-contract/protocol    | Zmiany istotne dla Node |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli           | Zmiany istotne dla Node |
| `checks-node-extensions`         | Pełne shardy testów bundled-plugin dla całego zestawu rozszerzeń                             | Zmiany istotne dla Node |
| `checks-node-core-test`          | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń | Zmiany istotne dla Node |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych dołączonych pluginów                               | Pull requesty ze zmianami w rozszerzeniach |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testów i ścisły smoke | Zmiany istotne dla Node |
| `check-additional`               | Shardy architektury, granic, guardów powierzchni rozszerzeń, granic pakietów i gateway-watch | Zmiany istotne dla Node |
| `build-smoke`                    | Testy smoke dla zbudowanego CLI i smoke pamięci przy starcie                                 | Zmiany istotne dla Node |
| `checks`                         | Weryfikator dla testów kanałów na zbudowanych artefaktach plus zgodność Node 22 tylko dla pushów | Zmiany istotne dla Node |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                               | Gdy zmieniła się dokumentacja |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Ścieżki testowe specyficzne dla Windows                                                      | Zmiany istotne dla Windows |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów          | Zmiany istotne dla macOS |
| `macos-swift`                    | Lint, build i testy Swift dla aplikacji macOS                                                | Zmiany istotne dla macOS |
| `android`                        | Testy jednostkowe Androida dla obu wariantów plus jedna kompilacja debug APK                 | Zmiany istotne dla Androida |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                    | Sukces CI na main lub ręczne wywołanie |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie kontrole kończyły się błędem przed uruchomieniem kosztownych:

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się szybko bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się na szybkie ścieżki Linux, aby zadania podrzędne mogły zacząć się natychmiast po gotowości wspólnej kompilacji.
4. Cięższe ścieżki platformowe i wykonawcze rozdzielają się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, tylko-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresowania znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Edycje workflow CI walidują graf Node CI oraz linting workflow, ale same w sobie nie wymuszają natywnych kompilacji Windows, Android ani macOS; te ścieżki platformowe pozostają ograniczone do zmian w kodzie źródłowym danej platformy.
Edycje dotyczące wyłącznie routingu CI, wybrane tanie edycje fixture testów rdzenia oraz wąskie edycje helperów/test-routing plugin contract używają szybkiej ścieżki manifestu tylko dla Node: preflight, security i pojedynczego zadania `checks-fast-core`. Ta ścieżka omija build artifacts, zgodność z Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy bundled-plugin oraz dodatkowe macierze guardów, gdy zmienione pliki ograniczają się do powierzchni routingu lub helperów, które szybkie zadanie ćwiczy bezpośrednio.
Kontrole Windows Node są ograniczone do wrapperów procesów/ścieżek specyficznych dla Windows, helperów uruchamiania npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które uruchamiają tę ścieżkę; niepowiązane zmiany w kodzie źródłowym, pluginach, install-smoke i samych testach pozostają na ścieżkach Linux Node, aby nie rezerwować 16-vCPU workera Windows dla pokrycia, które jest już realizowane przez normalne shardy testów.
Oddzielny workflow `install-smoke` ponownie używa tego samego skryptu zakresowania przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`. Pull requesty uruchamiają szybką ścieżkę dla powierzchni Docker/package, zmian pakietów/manifestów bundled plugin oraz powierzchni rdzenia plugin/channel/Gateway/Plugin SDK, które wykonują zadania Docker smoke. Zmiany tylko w źródłach bundled plugin, edycje tylko testów i edycje tylko dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje główny obraz Dockerfile raz, sprawdza CLI, uruchamia smoke CLI `agents delete shared-workspace`, uruchamia kontenerowe e2e gateway-network, weryfikuje argument build dla dołączonego rozszerzenia i uruchamia ograniczony profil Docker bundled-plugin z łącznym limitem czasu poleceń 240 sekund oraz osobno ograniczonym uruchomieniem Docker dla każdego scenariusza. Pełna ścieżka zachowuje pokrycie instalacji pakietów QR oraz coverage Docker/update instalatora dla nocnych uruchomień harmonogramu, ręcznych wywołań, kontroli wydania workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/package/Docker. Push do `main`, w tym commity merge, nie wymuszają pełnej ścieżki; gdy logika changed-scope zażądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki Docker smoke i pozostawia pełny install smoke dla nocnej lub wydaniowej walidacji. Wolny smoke dostawcy obrazów przy globalnej instalacji Bun jest osobno bramkowany przez `run_bun_global_install_smoke`; uruchamia się w nocnym harmonogramie i z workflow kontroli wydania, a ręczne wywołania `install-smoke` mogą go opcjonalnie włączyć, ale pull requesty i pushe do `main` go nie uruchamiają. Testy Docker QR i instalatora zachowują własne Dockerfile zorientowane na instalację. Lokalny `test:docker:all` buduje wstępnie jeden współdzielony obraz live-test i jeden współdzielony obraz built-app z `scripts/e2e/Dockerfile`, a następnie uruchamia ścieżki smoke live/E2E z użyciem ważonego harmonogramu i `OPENCLAW_SKIP_DOCKER_BUILD=1`; dostrój domyślną liczbę slotów głównej puli 10 przez `OPENCLAW_DOCKER_ALL_PARALLELISM` oraz liczbę slotów puli końcowej wrażliwej na dostawców 10 przez `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Limity ciężkich ścieżek domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, aby ścieżki instalacji npm i wielousługowe nie przeciążały Dockera, podczas gdy lżejsze ścieżki nadal wypełniają dostępne sloty. Starty ścieżek są domyślnie rozłożone co 2 sekundy, aby uniknąć lokalnych burz tworzenia w demonie Docker; nadpisz przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` lub inną wartość w milisekundach. Lokalny agregat wykonuje preflight Dockera, usuwa nieaktualne kontenery OpenClaw E2E, emituje status aktywnych ścieżek, zapisuje czasy ścieżek dla kolejności od najdłuższych i obsługuje `OPENCLAW_DOCKER_ALL_DRY_RUN=1` do inspekcji harmonogramu. Domyślnie przestaje planować nowe ścieżki współdzielone po pierwszym błędzie, a każda ścieżka ma zapasowy limit czasu 120 minut z możliwością nadpisania przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/tail używają ciaśniejszych limitów per ścieżka. Workflow wielokrotnego użytku live/E2E odzwierciedla wzorzec współdzielonego obrazu, budując i wypychając jeden obraz Docker E2E z tagiem SHA do GHCR przed macierzą Docker, a następnie uruchamia macierz z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Zaplanowany workflow live/E2E uruchamia pełny wydaniowy zestaw Docker codziennie. Macierz bundled update jest dzielona według celu aktualizacji, aby powtarzane przebiegi npm update i doctor repair mogły shardować się wraz z innymi kontrolami bundled.

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna w kwestii granic architektury niż szeroki zakres platform CI: zmiany produkcyjne rdzenia uruchamiają typecheck prod rdzenia plus testy rdzenia, zmiany tylko w testach rdzenia uruchamiają tylko typecheck/testy testów rdzenia, zmiany produkcyjne rozszerzeń uruchamiają typecheck prod rozszerzeń plus testy rozszerzeń, a zmiany tylko w testach rozszerzeń uruchamiają tylko typecheck/testy testów rozszerzeń. Zmiany publicznego Plugin SDK lub plugin-contract rozszerzają walidację na rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów rdzenia. Podniesienia wersji dotyczące wyłącznie metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych. Nieznane zmiany w katalogu głównym/konfiguracji bezpiecznie kończą się uruchomieniem wszystkich ścieżek.

Przy pushach macierz `checks` dodaje ścieżkę `compat-node22` tylko dla pushów. W pull requestach ta ścieżka jest pomijana, a macierz pozostaje skupiona na normalnych ścieżkach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy, testy bundled plugin są równoważone na sześciu workerach rozszerzeń, małe ścieżki jednostkowe rdzenia są parowane, auto-reply działa na czterech zrównoważonych workerach z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch oraz commands/state-routing, a agentowe konfiguracje Gateway/plugin są rozkładane po istniejących zadaniach agentic Node tylko dla źródeł zamiast czekać na build artifacts. Szerokie testy browser, QA, media i miscellaneous plugin używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego ogólnego zestawu plugin. Zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji plugin jednocześnie z jednym workerem Vitest na grupę i większym stosem Node, tak aby partie pluginów ciężkie importowo nie tworzyły dodatkowych zadań CI. Szeroka ścieżka agents używa współdzielonego harmonogramu równoległości plików Vitest, ponieważ dominuje w niej import/harmonogramowanie, a nie pojedynczy wolny plik testowy. `runtime-config` działa razem z shardem infra core-runtime, aby współdzielony shard runtime nie brał na siebie końcowego ogona. Shardy wzorców include zapisują wpisy czasowe z użyciem nazwy sharda CI, dzięki czemu `.artifacts/vitest-shard-timings.json` może odróżniać całą konfigurację od filtrowanego sharda. `check-additional` utrzymuje razem kompilację/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; shard boundary guard uruchamia swoje małe niezależne guardy współbieżnie w obrębie jednego zadania. Gateway watch, testy kanałów i shard granic wsparcia rdzenia działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane, zachowując stare nazwy kontroli jako lekkie zadania weryfikacyjne, a jednocześnie unikając dwóch dodatkowych workerów Blacksmith i drugiej kolejki konsumentów artefaktów.
Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje ten wariant z flagami SMS/call-log w BuildConfig, jednocześnie unikając duplikowania zadania pakowania debug APK przy każdym pushu istotnym dla Androida.
`extension-fast` jest tylko dla PR, ponieważ uruchomienia push już wykonują pełne shardy bundled plugin. To zapewnia szybki feedback dla zmienionych pluginów podczas review bez rezerwowania dodatkowego workera Blacksmith na `main` dla pokrycia, które już istnieje w `checks-node-extensions`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi na ten sam PR lub ref `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego ref także kończy się błędem. Zagregowane kontrole shardów używają `!cancelled() && always()`, dzięki czemu nadal raportują normalne błędy shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony.
Klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby „zombie” po stronie GitHub w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień na main.

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protocol/contract/bundled, shardowane kontrole kontraktów kanałów, shardy `check` z wyjątkiem lint, shardy i agregaty `check-additional`, zagregowane weryfikatory testów Node, kontrole dokumentacji, Skills w Pythonie, workflow-sanity, labeler, auto-response; preflight install-smoke również używa GitHub-hosted Ubuntu, aby macierz Blacksmith mogła wcześniej ustawić się w kolejce |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, które nadal jest na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało; kompilacje Docker install-smoke, gdzie koszt czasu oczekiwania w kolejce dla 32 vCPU był wyższy niż uzyskana oszczędność                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes   # sprawdza lokalny klasyfikator changed-lane dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: changed typecheck/lint/tests według ścieżki granic
pnpm check          # szybka lokalna bramka: produkcyjne tsgo + shardowany lint + równoległe szybkie guardy
pnpm check:test-types
pnpm check:timed    # ta sama bramka z czasami dla poszczególnych etapów
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatowanie dokumentacji + lint + uszkodzone linki
pnpm build          # buduje dist, gdy mają znaczenie ścieżki CI artifact/build-smoke
pnpm ci:timings                               # podsumowuje ostatnie uruchomienie push CI dla origin/main
pnpm ci:timings:recent                        # porównuje ostatnie udane uruchomienia CI na main
node scripts/ci-run-timings.mjs <run-id>      # podsumowuje czas całkowity, czas kolejkowania i najwolniejsze zadania
node scripts/ci-run-timings.mjs --latest-main # ignoruje szum issue/comment i wybiera push CI dla origin/main
node scripts/ci-run-timings.mjs --recent 10   # porównuje ostatnie udane uruchomienia CI na main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały wydań](/pl/install/development-channels)
