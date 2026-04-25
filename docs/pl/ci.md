---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione.
    - Debugujesz nieudane kontrole GitHub Actions.
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-25T13:42:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

CI działa przy każdym pushu do `main` oraz dla każdego pull requestu. Używa inteligentnego określania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

QA Lab ma dedykowane ścieżki CI poza głównym workflow z inteligentnym określaniem zakresu. Workflow
`Parity gate` uruchamia się dla pasujących zmian w PR oraz przy ręcznym wywołaniu; buduje
prywatne środowisko uruchomieniowe QA i porównuje agentic packi mock GPT-5.4 oraz Opus 4.6.
Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` oraz przy
ręcznym wywołaniu; rozdziela równolegle mock parity gate, aktywną ścieżkę Matrix oraz aktywną
ścieżkę Telegram. Aktywne zadania używają środowiska `qa-live-shared`,
a ścieżka Telegram używa dzierżaw Convex. `OpenClaw Release
Checks` uruchamia też te same ścieżki QA Lab przed zatwierdzeniem wydania.

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainera do
porządkowania duplikatów po wdrożeniu. Domyślnie działa w trybie dry-run i zamyka tylko jawnie
wymienione PR-y, gdy `apply=true`. Przed modyfikacją GitHub sprawdza,
czy wdrożony PR został scalony i czy każdy duplikat ma albo wspólne powiązane issue,
albo nakładające się zmienione hunki.

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex do utrzymywania
istniejącej dokumentacji w zgodności z ostatnio wdrożonymi zmianami. Nie ma czystego harmonogramu:
może ją wyzwolić udane uruchomienie CI po pushu na `main`, wykonane przez nie-bota,
a ręczne wywołanie może uruchomić ją bezpośrednio. Wywołania przez workflow-run są pomijane,
gdy `main` przesunął się dalej albo gdy inne niepominięte uruchomienie Docs Agent zostało
utworzone w ostatniej godzinie. Gdy się uruchamia,
sprawdza zakres commitów od poprzedniego niepominiętego SHA źródłowego Docs Agent do
bieżącego `main`, więc jedno uruchomienie na godzinę może objąć wszystkie zmiany na main
nagromadzone od ostatniego przebiegu dokumentacji.

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex
dla wolnych testów. Nie ma czystego harmonogramu: może ją wyzwolić udane uruchomienie CI po pushu
na `main`, wykonane przez nie-bota, ale jest pomijana, jeśli inne wywołanie workflow-run
już uruchomiło się lub działa tego dnia UTC. Ręczne wywołanie omija tę
dzienną bramkę aktywności. Ta ścieżka buduje raport wydajności Vitest dla pełnego zestawu testów z grupowaniem,
pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast
szerokich refaktoryzacji, a następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany,
które zmniejszają bazową liczbę zaliczonych testów. Jeśli baza ma nieudane testy,
Codex może naprawić tylko oczywiste błędy, a raport pełnego zestawu po działaniu agenta
musi przejść przed zapisaniem czegokolwiek. Gdy `main` przesunie się przed wdrożeniem pushu bota,
ta ścieżka rebase’uje zweryfikowaną poprawkę, ponownie uruchamia `pnpm check:changed`
i ponawia push; konfliktujące, nieaktualne poprawki są pomijane. Używa Ubuntu hostowanego przez GitHub,
aby akcja Codex mogła zachować tę samą bezpieczną politykę drop-sudo co agent dokumentacji.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Przegląd zadań

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Wykrywanie zmian tylko w dokumentacji, zmienionych zakresów, zmienionych rozszerzeń i budowanie manifestu CI | Zawsze dla pushów i PR-ów niebędących draftami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                 | Zawsze dla pushów i PR-ów niebędących draftami |
| `security-dependency-audit`      | Audyt production lockfile bez zależności względem ostrzeżeń npm                              | Zawsze dla pushów i PR-ów niebędących draftami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze dla pushów i PR-ów niebędących draftami |
| `build-artifacts`                | Budowanie `dist/`, Control UI, kontroli zbudowanych artefaktów i artefaktów wielokrotnego użytku dla dalszych zadań | Zmiany istotne dla Node              |
| `checks-fast-core`               | Szybkie ścieżki poprawności na Linux, takie jak kontrole bundled/plugin-contract/protocol    | Zmiany istotne dla Node              |
| `checks-fast-contracts-channels` | Podzielone na shardy kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli | Zmiany istotne dla Node              |
| `checks-node-extensions`         | Pełne shardy testów dołączonych Pluginów w całym zestawie rozszerzeń                         | Zmiany istotne dla Node              |
| `checks-node-core-test`          | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, dołączonych, kontraktowych i rozszerzeń | Zmiany istotne dla Node              |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych dołączonych Pluginów                               | Pull requesty ze zmianami rozszerzeń |
| `check`                          | Podzielony na shardy odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testów i ścisły smoke | Zmiany istotne dla Node              |
| `check-additional`               | Shardy architektury, granic, guardów powierzchni rozszerzeń, granic pakietów i gateway-watch | Zmiany istotne dla Node              |
| `build-smoke`                    | Smoke testy zbudowanego CLI i smoke pamięci przy starcie                                     | Zmiany istotne dla Node              |
| `checks`                         | Weryfikator dla testów kanałów na zbudowanych artefaktach plus zgodność Node 22 tylko dla pushów | Zmiany istotne dla Node              |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                               | Zmieniona dokumentacja               |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Python Skills     |
| `checks-windows`                 | Ścieżki testowe specyficzne dla Windows                                                      | Zmiany istotne dla Windows           |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów         | Zmiany istotne dla macOS             |
| `macos-swift`                    | Swift lint, build i testy dla aplikacji macOS                                                | Zmiany istotne dla macOS             |
| `android`                        | Testy jednostkowe Android dla obu wariantów plus jedna kompilacja debug APK                  | Zmiany istotne dla Androida          |
| `test-performance-agent`         | Dzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                      | Sukces CI na main lub ręczne wywołanie |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie kontrole kończyły się błędem zanim uruchomią się drogie:

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się szybko błędem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się na szybkie ścieżki Linux, aby zadania zależne mogły zacząć się natychmiast po gotowości współdzielonego buildu.
4. Cięższe ścieżki platformowe i runtime rozchodzą się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, tylko-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest objęta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Edycje workflow CI walidują graf Node CI oraz linting workflow, ale same z siebie nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platformowe nadal pozostają ograniczone do zmian w kodzie źródłowym danej platformy.
Edycje dotyczące wyłącznie routingu CI, wybrane tanie edycje fixture’ów testów rdzenia oraz wąskie edycje helperów/test-routing plugin contract korzystają z szybkiej ścieżki manifestu tylko dla Node: preflight, security oraz pojedyncze zadanie `checks-fast-core`. Ta ścieżka omija build artifacts, zgodność z Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy dołączonych Pluginów oraz dodatkowe macierze guardów, gdy zmienione pliki ograniczają się do powierzchni routingu lub helperów, które szybkie zadanie testuje bezpośrednio.
Kontrole Windows Node są ograniczone do wrapperów procesów/ścieżek specyficznych dla Windows, helperów uruchamiania npm/pnpm/UI, konfiguracji package managera oraz powierzchni workflow CI, które uruchamiają tę ścieżkę; niepowiązane zmiany w kodzie źródłowym, Pluginach, install-smoke i testach pozostają na ścieżkach Linux Node, dzięki czemu nie rezerwują 16-vCPU workera Windows dla pokrycia, które jest już wykonywane przez zwykłe shardy testów.
Osobny workflow `install-smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`. Pull requesty uruchamiają szybką ścieżkę dla powierzchni Docker/pakietów, zmian pakietów/manifestów dołączonych Pluginów oraz powierzchni rdzenia Pluginów/kanałów/Gateway/Plugin SDK, które ćwiczą zadania Docker smoke. Zmiany wyłącznie w kodzie źródłowym dołączonych Pluginów, edycje tylko testów i zmiany tylko w dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje główny obraz Dockerfile raz, sprawdza CLI, uruchamia smoke CLI `agents delete shared-workspace`, uruchamia e2e `container gateway-network`, weryfikuje argument buildu dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonych Pluginów przy łącznym limicie czasu poleceń 240 sekund, z osobnym limitem dla `docker run` w każdym scenariuszu. Pełna ścieżka zachowuje pokrycie instalacji pakietu QR oraz Docker/update instalatora dla nocnych uruchomień według harmonogramu, ręcznych wywołań, kontroli wydań przez workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietów/Docker. Push do `main`, w tym merge commity, nie wymusza pełnej ścieżki; gdy logika changed-scope zażądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki Docker smoke, a pełne install smoke pozostawia nocnej lub wydaniowej walidacji. Wolny smoke dostawcy obrazów dla globalnej instalacji Bun jest osobno bramkowany przez `run_bun_global_install_smoke`; uruchamia się według nocnego harmonogramu oraz z workflow kontroli wydań, a ręczne wywołania `install-smoke` mogą go opcjonalnie włączyć, ale pull requesty i pushe do `main` go nie uruchamiają. Testy Docker QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji. Lokalny `test:docker:all` wstępnie buduje jeden współdzielony obraz live-test i jeden współdzielony obraz built-app z `scripts/e2e/Dockerfile`, a następnie uruchamia ścieżki smoke live/E2E z ważonym schedulerem i `OPENCLAW_SKIP_DOCKER_BUILD=1`; domyślną liczbę slotów 10 dla głównej puli dostroisz przez `OPENCLAW_DOCKER_ALL_PARALLELISM`, a liczbę slotów 10 dla końcowej puli wrażliwej na dostawcę przez `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Limity ciężkich ścieżek domyślnie wynoszą `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` oraz `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, aby ścieżki instalacji npm i wielu usług nie przeciążały Dockera, podczas gdy lżejsze ścieżki nadal wykorzystują dostępne sloty. Starty ścieżek są domyślnie opóźniane o 2 sekundy, aby uniknąć lokalnych fal tworzenia kontenerów przez demona Docker; nadpisz to przez `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` lub inną wartość w milisekundach. Lokalny agregat najpierw sprawdza Docker, usuwa stare kontenery OpenClaw E2E, wypisuje status aktywnych ścieżek, zapisuje czasy ścieżek dla kolejności od najdłuższych i obsługuje `OPENCLAW_DOCKER_ALL_DRY_RUN=1` do inspekcji schedulera. Domyślnie przestaje planować nowe ścieżki puli po pierwszym błędzie, a każda ścieżka ma zapasowy limit czasu 120 minut, który można nadpisać przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; wybrane ścieżki live/tail używają ciaśniejszych limitów per ścieżka. Workflow wielokrotnego użytku live/E2E odzwierciedla wzorzec współdzielonego obrazu, budując i publikując jeden obraz Docker E2E w GHCR oznaczony SHA przed macierzą Docker, a następnie uruchamia macierz z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Workflow harmonogramu live/E2E uruchamia pełny wydaniowy zestaw Docker codziennie. Macierz aktualizacji dołączonych elementów jest podzielona według celu aktualizacji, aby powtarzane przebiegi npm update i doctor repair mogły być shardowane wraz z innymi kontrolami dołączonych elementów.

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platform CI: zmiany produkcyjne rdzenia uruchamiają typecheck prod rdzenia plus testy rdzenia, zmiany tylko w testach rdzenia uruchamiają tylko typecheck/testy testów rdzenia, zmiany produkcyjne rozszerzeń uruchamiają typecheck prod rozszerzeń plus testy rozszerzeń, a zmiany tylko w testach rozszerzeń uruchamiają tylko typecheck/testy testów rozszerzeń. Publiczne zmiany Plugin SDK lub plugin-contract rozszerzają walidację o rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów rdzenia. Podbicia wersji dotyczące wyłącznie metadanych wydań uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych. Nieznane zmiany w katalogu głównym/konfiguracji bezpiecznie kończą się uruchomieniem wszystkich ścieżek.

Przy pushach macierz `checks` dodaje ścieżkę `compat-node22`, uruchamianą tylko przy pushu. W pull requestach ta ścieżka jest pomijana, a macierz pozostaje skupiona na zwykłych ścieżkach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało małe bez nadmiernej rezerwacji runnerów: kontrakty kanałów działają jako trzy ważone shardy, testy dołączonych Pluginów są równoważone na sześciu workerach rozszerzeń, małe ścieżki jednostkowe rdzenia są parowane, auto-reply działa jako trzy zrównoważone workery zamiast sześciu małych workerów, a agentic konfiguracje Gateway/Plugin są rozkładane na istniejące zadania Node agentic tylko dla źródeł zamiast czekać na build artifacts. Szerokie testy przeglądarkowe, QA, multimedialne i różne testy Pluginów używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego ogólnego catch-all dla Pluginów. Zadania shardów rozszerzeń uruchamiają jednocześnie do dwóch grup konfiguracji Pluginów, z jednym workerem Vitest na grupę i większym stertą Node, aby partie Pluginów o ciężkich importach nie tworzyły dodatkowych zadań CI. Szeroka ścieżka agentów używa współdzielonego schedulera równoległego dla plików Vitest, ponieważ dominuje w niej import/scheduling, a nie pojedynczy wolny plik testowy. `runtime-config` działa z shardem infra core-runtime, aby współdzielony shard runtime nie stawał się wąskim gardłem na końcu. `check-additional` utrzymuje razem prace compile/canary dla granic pakietów i rozdziela architekturę topologii runtime od pokrycia gateway watch; shard boundary guard uruchamia swoje małe niezależne guardy współbieżnie w jednym zadaniu. Gateway watch, testy kanałów i shard granicy wsparcia rdzenia działają współbieżnie wewnątrz `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`, zachowując swoje stare nazwy kontroli jako lekkie zadania weryfikujące, jednocześnie unikając dwóch dodatkowych workerów Blacksmith i drugiej kolejki konsumentów artefaktów.
Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK dla Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje ten wariant z flagami SMS/call-log w BuildConfig, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym pushu istotnym dla Androida.
`extension-fast` jest tylko dla PR, ponieważ uruchomienia po pushu i tak wykonują pełne shardy dołączonych Pluginów. Daje to szybką informację zwrotną dla przeglądów przy zmienionych Pluginach bez rezerwowania dodatkowego workera Blacksmith na `main` dla pokrycia, które już istnieje w `checks-node-extensions`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi na ten sam ref PR lub `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się błędem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują zwykłe błędy shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony.
Klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHub w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień main.

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protocol/contract/bundled, podzielone na shardy kontrole kontraktów kanałów, shardy `check` z wyjątkiem lint, shardy i agregaty `check-additional`, agregaty weryfikujące testy Node, kontrole dokumentacji, Python Skills, workflow-sanity, labeler, auto-response; preflight dla install-smoke również używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej trafić do kolejki |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów dołączonych Pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, które nadal jest na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało; buildy Docker dla install-smoke, gdzie czas oczekiwania w kolejce dla 32 vCPU kosztował więcej, niż oszczędzał                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes   # sprawdź lokalny klasyfikator changed-lane dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: changed typecheck/lint/tests według boundary lane
pnpm check          # szybka lokalna bramka: production tsgo + podzielony na shardy lint + równoległe szybkie guardy
pnpm check:test-types
pnpm check:timed    # ta sama bramka z czasami dla każdego etapu
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatowanie dokumentacji + lint + uszkodzone linki
pnpm build          # zbuduj dist, gdy ścieżki CI artifact/build-smoke mają znaczenie
node scripts/ci-run-timings.mjs <run-id>      # podsumuj wall time, czas oczekiwania w kolejce i najwolniejsze zadania
node scripts/ci-run-timings.mjs --recent 10   # porównaj ostatnie udane uruchomienia main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały wydań](/pl/install/development-channels)
