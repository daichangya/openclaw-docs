---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI uruchomiło się lub nie uruchomiło.
    - Diagnozujesz nieudane kontrole GitHub Actions.
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-23T14:55:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# Potok CI

CI uruchamia się przy każdym wypchnięciu do `main` i przy każdym pull requeście. Używa inteligentnego zawężania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

QA Lab ma dedykowane ścieżki CI poza głównym workflow z inteligentnym zawężaniem zakresu. Workflow
`Parity gate` uruchamia się przy pasujących zmianach w PR oraz ręcznie; buduje
prywatne środowisko uruchomieniowe QA i porównuje agentowe pakiety mock GPT-5.4 i Opus 4.6. Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` oraz
ręcznie; rozdziela równolegle mock parity gate, aktywną ścieżkę Matrix i aktywną
ścieżkę Telegram. Zadania aktywne używają środowiska `qa-live-shared`,
a ścieżka Telegram używa dzierżaw Convex. `OpenClaw Release
Checks` uruchamia również te same ścieżki QA Lab przed zatwierdzeniem wydania.

## Przegląd zadań

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia               |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze przy niedraftowych pushach i PR |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                 | Zawsze przy niedraftowych pushach i PR |
| `security-dependency-audit`      | Niezależny od zależności audyt produkcyjnego lockfile względem ostrzeżeń npm                 | Zawsze przy niedraftowych pushach i PR |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze przy niedraftowych pushach i PR |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku dla zadań podrzędnych | Zmiany istotne dla Node |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak kontrole bundled/plugin-contract/protocol   | Zmiany istotne dla Node |
| `checks-fast-contracts-channels` | Szardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli           | Zmiany istotne dla Node |
| `checks-node-extensions`         | Pełne szardy testów bundled-plugin w całym zestawie rozszerzeń                               | Zmiany istotne dla Node |
| `checks-node-core-test`          | Szardy testów rdzenia Node, z wyłączeniem kanałów, bundled, kontraktów i ścieżek rozszerzeń | Zmiany istotne dla Node |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych bundled plugins                                    | Pull requesty ze zmianami w rozszerzeniach |
| `check`                          | Szardowany odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testowe i ścisły smoke | Zmiany istotne dla Node |
| `check-additional`               | Architektura, granice, guardy powierzchni rozszerzeń, granice pakietów i szardy gateway-watch | Zmiany istotne dla Node |
| `build-smoke`                    | Smoke testy zbudowanego CLI i smoke pamięci przy uruchamianiu                                | Zmiany istotne dla Node |
| `checks`                         | Weryfikator dla testów kanałów na zbudowanych artefaktach oraz zgodności tylko dla pushy z Node 22 | Zmiany istotne dla Node |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole niedziałających linków                            | Zmieniona dokumentacja |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Python Skills |
| `checks-windows`                 | Ścieżki testowe specyficzne dla Windows                                                      | Zmiany istotne dla Windows |
| `macos-node`                     | Ścieżka testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów          | Zmiany istotne dla macOS |
| `macos-swift`                    | Lint, build i testy Swift dla aplikacji macOS                                                | Zmiany istotne dla macOS |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jeden build debug APK                      | Zmiany istotne dla Androida |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie kontrole kończyły się niepowodzeniem przed uruchomieniem droższych:

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` działa równolegle z szybkimi linuksowymi ścieżkami, aby zadania podrzędne mogły ruszyć, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platformowe i runtime rozdzielają się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, tylko-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest objęta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Edycje workflow CI weryfikują graf Node CI oraz lint workflow, ale same w sobie nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platformowe nadal są zawężone do zmian w kodzie danej platformy.
Kontrole Node dla Windows są zawężone do wrapperów procesów/ścieżek specyficznych dla Windows, helperów uruchamiania npm/pnpm/UI, konfiguracji menedżera pakietów i powierzchni workflow CI, które uruchamiają tę ścieżkę; niepowiązane zmiany w kodzie źródłowym, plugin, install-smoke i samych testach pozostają w linuksowych ścieżkach Node, aby nie rezerwować 16-vCPU workera Windows dla pokrycia, które jest już wykonywane przez zwykłe szardy testowe.
Osobny workflow `install-smoke` używa ponownie tego samego skryptu zakresu przez własne zadanie `preflight`. Wylicza `run_install_smoke` z węższego sygnału changed-smoke, więc smoke Docker/install uruchamia się dla zmian związanych z instalacją, pakowaniem, kontenerami, zmian produkcyjnych bundled extension oraz głównych powierzchni plugin/channel/gateway/Plugin SDK, które wykonują zadania smoke Dockera. Edycje tylko testów i tylko dokumentacji nie rezerwują workerów Docker. Jego smoke pakietu QR wymusza ponowne uruchomienie warstwy Docker `pnpm install`, zachowując cache magazynu pnpm BuildKit, więc nadal wykonuje instalację bez ponownego pobierania zależności przy każdym uruchomieniu. Jego gateway-network e2e ponownie używa obrazu runtime zbudowanego wcześniej w zadaniu, więc dodaje rzeczywiste pokrycie WebSocket między kontenerami bez dodawania kolejnego builda Docker. Lokalne `test:docker:all` buduje wcześniej jeden współdzielony obraz live-test i jeden współdzielony obraz built-app z `scripts/e2e/Dockerfile`, a następnie uruchamia równolegle ścieżki smoke live/E2E z `OPENCLAW_SKIP_DOCKER_BUILD=1`; domyślną współbieżność 4 można dostroić przez `OPENCLAW_DOCKER_ALL_PARALLELISM`. Lokalny agregat domyślnie przestaje planować nowe ścieżki z puli po pierwszym niepowodzeniu, a każda ścieżka ma limit czasu 120 minut, który można nadpisać przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Ścieżki wrażliwe na uruchamianie lub dostawców działają wyłącznie po zakończeniu puli równoległej. Workflow live/E2E wielokrotnego użytku odwzorowuje wzorzec współdzielonego obrazu, budując i wypychając jeden obraz Docker E2E GHCR oznaczony SHA przed macierzą Docker, a następnie uruchamiając macierz z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker dla ścieżki wydaniowej. Testy Docker QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji. Osobne zadanie `docker-e2e-fast` uruchamia ograniczony profil Docker bundled-plugin z limitem czasu polecenia 120 sekund: naprawa zależności setup-entry oraz izolacja syntetycznej awarii bundled-loader. Pełna macierz aktualizacji bundled i kanałów pozostaje ręczna/pełnego zestawu, ponieważ wykonuje powtarzane rzeczywiste przebiegi npm update i naprawy doctor.

Lokalna logika zmienionych ścieżek znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platform CI: zmiany produkcyjne rdzenia uruchamiają typecheck prod rdzenia oraz testy rdzenia, zmiany tylko w testach rdzenia uruchamiają tylko typecheck/testy testowe rdzenia, zmiany produkcyjne rozszerzeń uruchamiają typecheck prod rozszerzeń oraz testy rozszerzeń, a zmiany tylko w testach rozszerzeń uruchamiają tylko typecheck/testy testowe rozszerzeń. Zmiany w publicznym Plugin SDK lub plugin-contract rozszerzają walidację na rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów rdzenia. Zmiany wyłącznie w metadanych wydania, takie jak podbicie wersji, uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych. Nieznane zmiany w root/config w trybie bezpiecznym uruchamiają wszystkie ścieżki.

Przy pushach macierz `checks` dodaje ścieżkę `compat-node22`, uruchamianą tylko przy pushach. Przy pull requestach ta ścieżka jest pomijana, a macierz pozostaje skupiona na zwykłych ścieżkach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone lub równoważone, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone szardy, testy bundled plugin są równoważone między sześcioma workerami rozszerzeń, małe ścieżki jednostkowe rdzenia są łączone w pary, auto-reply działa na trzech zrównoważonych workerach zamiast sześciu małych, a konfiguracje agentic gateway/plugin są rozłożone między istniejące zadania agentic Node tylko ze źródeł zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, mediów i różnych plugin używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego ogólnego zestawu pluginów. Szeroka ścieżka agents używa współdzielonego planisty równoległego plików Vitest, ponieważ dominuje w niej import/szeregowanie, a nie pojedynczy wolny plik testowy. `runtime-config` działa z szardem infra core-runtime, aby współdzielony szard runtime nie pozostawał właścicielem końcówki. `check-additional` trzyma razem kompilację/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; szard boundary guard uruchamia swoje małe niezależne guardy współbieżnie w ramach jednego zadania. Gateway watch, testy kanałów i szard granicy wsparcia rdzenia działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane, zachowując swoje stare nazwy kontroli jako lekkie zadania weryfikujące, a jednocześnie unikając dwóch dodatkowych workerów Blacksmith i drugiej kolejki konsumentów artefaktów.
Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje ten wariant z flagami BuildConfig dla SMS/call-log, jednocześnie unikając zduplikowanego zadania pakowania debug APK przy każdym pushu istotnym dla Androida.
`extension-fast` jest tylko dla PR, ponieważ uruchomienia push już wykonują pełne szardy bundled plugin. Dzięki temu recenzje dostają szybki feedback dla zmienionych pluginów bez rezerwowania dodatkowego workera Blacksmith na `main` dla pokrycia już obecnego w `checks-node-extensions`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi na ten sam ref PR lub `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego ref również kończy się niepowodzeniem. Zagregowane kontrole shardów używają `!cancelled() && always()`, dzięki czemu nadal raportują zwykłe awarie shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony.
Klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHub w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień na main.

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protocol/contract/bundled, szardowane kontrole kontraktów kanałów, szardy `check` z wyjątkiem lint, szardy i agregaty `check-additional`, zagregowane weryfikatory testów Node, kontrole dokumentacji, Python Skills, workflow-sanity, labeler, auto-response; preflight install-smoke również używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej trafić do kolejki |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, szardy testów Linux Node, szardy testów bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, które nadal jest na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało; buildy Docker dla install-smoke, gdzie czas oczekiwania w kolejce dla 32 vCPU kosztował więcej, niż oszczędzał                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes   # sprawdź lokalny klasyfikator zmienionych ścieżek dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: zmienione typecheck/lint/testy według ścieżki granicznej
pnpm check          # szybka lokalna bramka: produkcyjny tsgo + szardowany lint + równoległe szybkie guardy
pnpm check:test-types
pnpm check:timed    # ta sama bramka z pomiarami czasu dla każdego etapu
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatowanie dokumentacji + lint + niedziałające linki
pnpm build          # zbuduj dist, gdy mają znaczenie ścieżki CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # podsumuj czas całkowity, czas w kolejce i najwolniejsze zadania
node scripts/ci-run-timings.mjs --recent 10   # porównaj ostatnie udane uruchomienia CI na main
```
