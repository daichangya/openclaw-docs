---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI uruchomiło się lub nie uruchomiło.
    - Debugujesz nieudane kontrole GitHub Actions.
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-23T13:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# Potok CI

CI uruchamia się przy każdym pushu do `main` oraz dla każdego pull requesta. Wykorzystuje inteligentne zawężanie zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

QA Lab ma dedykowane ścieżki CI poza głównym workflow z inteligentnym zawężaniem zakresu. Workflow `Parity gate` uruchamia się dla pasujących zmian w PR oraz ręcznie; buduje prywatne środowisko uruchomieniowe QA i porównuje agentowe pakiety mock GPT-5.4 oraz Opus 4.6. Workflow `QA-Lab - All Lanes` uruchamia się co noc na `main` oraz ręcznie; rozdziela równolegle zadania mock parity gate, żywą ścieżkę Matrix i żywą ścieżkę Telegram. Zadania live używają środowiska `qa-live-shared`, a ścieżka Telegram używa dzierżaw Convex. `OpenClaw Release Checks` uruchamia również te same ścieżki QA Lab przed zatwierdzeniem wydania.

## Przegląd zadań

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze dla pushy i PR, które nie są szkicami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                 | Zawsze dla pushy i PR, które nie są szkicami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem ostrzeżeń npm                           | Zawsze dla pushy i PR, które nie są szkicami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze dla pushy i PR, które nie są szkicami |
| `build-artifacts`                | Buduje `dist/`, Control UI, sprawdzenia zbudowanych artefaktów i współdzielone artefakty podrzędne | Zmiany istotne dla Node             |
| `checks-fast-core`               | Szybkie ścieżki poprawności na Linuxie, takie jak sprawdzenia bundled/plugin-contract/protocol | Zmiany istotne dla Node             |
| `checks-fast-contracts-channels` | Szardowane sprawdzenia kontraktów kanałów ze stabilnym zagregowanym wynikiem                 | Zmiany istotne dla Node             |
| `checks-node-extensions`         | Pełne szardy testów bundled pluginów w całym zestawie rozszerzeń                             | Zmiany istotne dla Node             |
| `checks-node-core-test`          | Szardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń | Zmiany istotne dla Node             |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych bundled pluginów                                   | Pull requesty ze zmianami w rozszerzeniach |
| `check`                          | Szardowany odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testów i ścisły smoke | Zmiany istotne dla Node             |
| `check-additional`               | Guardy architektury, granic, powierzchni rozszerzeń, granic pakietów i szardy gateway-watch | Zmiany istotne dla Node             |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke zużycia pamięci przy starcie                             | Zmiany istotne dla Node             |
| `checks`                         | Weryfikator dla testów kanałów opartych na zbudowanych artefaktach oraz zgodności z Node 22 tylko dla pushy | Zmiany istotne dla Node             |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzanie uszkodzonych linków                            | Zmieniona dokumentacja              |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Python Skills    |
| `checks-windows`                 | Ścieżki testowe specyficzne dla Windows                                                      | Zmiany istotne dla Windows          |
| `macos-node`                     | Ścieżka testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów         | Zmiany istotne dla macOS            |
| `macos-swift`                    | Lint, build i testy Swift dla aplikacji macOS                                                | Zmiany istotne dla macOS            |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jeden build debug APK                      | Zmiany istotne dla Androida         |

## Kolejność Fail-Fast

Zadania są uporządkowane tak, aby tanie sprawdzenia kończyły się niepowodzeniem przed uruchomieniem drogich zadań:

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się szybko bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się na szybkie ścieżki Linux, aby odbiorcy podrzędni mogli zacząć, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platformowe i uruchomieniowe rozgałęziają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, tylko-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Edycje workflow CI walidują graf Node CI oraz linting workflow, ale same nie wymuszają natywnych buildów Windows, Androida ani macOS; te ścieżki platformowe nadal są zawężane do zmian w kodzie danej platformy.
Sprawdzenia Windows Node są zawężane do wrapperów procesów/ścieżek specyficznych dla Windows, helperów uruchomieniowych npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które uruchamiają tę ścieżkę; niepowiązane zmiany w kodzie źródłowym, pluginach, install-smoke oraz zmiany tylko w testach pozostają na ścieżkach Linux Node, aby nie rezerwować 16-vCPU workera Windows dla pokrycia, które i tak zapewniają normalne szardy testów.
Osobny workflow `install-smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Oblicza `run_install_smoke` na podstawie węższego sygnału changed-smoke, więc smoke Docker/install uruchamia się dla zmian związanych z instalacją, pakowaniem, kontenerami, produkcyjnymi zmianami bundled extension oraz powierzchniami rdzenia plugin/channel/gateway/Plugin SDK, które wykorzystują zadania Docker smoke. Edycje tylko testów i tylko dokumentacji nie rezerwują workerów Dockera. Jego smoke dla pakietu QR wymusza ponowne uruchomienie warstwy Docker `pnpm install`, zachowując jednocześnie cache BuildKit pnpm store, więc nadal testuje instalację bez ponownego pobierania zależności przy każdym uruchomieniu. Jego gateway-network e2e ponownie używa obrazu runtime zbudowanego wcześniej w zadaniu, więc dodaje rzeczywiste pokrycie WebSocket między kontenerami bez dokładania kolejnego buildu Dockera. Lokalnie `test:docker:all` wstępnie buduje jeden współdzielony obraz live-test i jeden współdzielony obraz built-app z `scripts/e2e/Dockerfile`, a następnie uruchamia równolegle ścieżki smoke live/E2E z `OPENCLAW_SKIP_DOCKER_BUILD=1`; domyślną współbieżność 4 można dostroić przez `OPENCLAW_DOCKER_ALL_PARALLELISM`. Lokalny agregat domyślnie przestaje planować nowe ścieżki z puli po pierwszym błędzie, a każda ścieżka ma limit czasu 120 minut, który można nadpisać przez `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Ścieżki wrażliwe na start lub providera uruchamiają się wyłącznie po puli równoległej. Workflow wielokrotnego użytku live/E2E odzwierciedla wzorzec współdzielonego obrazu, budując i wypychając jeden obraz Docker E2E z tagiem SHA do GHCR przed macierzą Dockera, a następnie uruchamiając macierz z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Dockera dla ścieżki wydaniowej. Testy Docker dla QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji. Osobne zadanie `docker-e2e-fast` uruchamia ograniczony profil bundled pluginów w Dockerze z limitem czasu polecenia 120 sekund: naprawa zależności setup-entry oraz izolacja syntetycznych awarii bundled-loader. Pełna macierz aktualizacji bundled i kanałów pozostaje ręczna/pełny zestaw, ponieważ wykonuje powtarzane rzeczywiste przebiegi npm update i napraw przez doctor.

Lokalna logika zmienionych ścieżek znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna względem granic architektury niż szeroki zakres platform CI: produkcyjne zmiany w rdzeniu uruchamiają typecheck prod rdzenia oraz testy rdzenia, zmiany tylko w testach rdzenia uruchamiają tylko typecheck/testy testowe rdzenia, produkcyjne zmiany rozszerzeń uruchamiają typecheck prod rozszerzeń oraz testy rozszerzeń, a zmiany tylko w testach rozszerzeń uruchamiają tylko typecheck/testy testowe rozszerzeń. Publiczne zmiany Plugin SDK lub plugin-contract rozszerzają walidację na rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów rdzenia. Podbicia wersji ograniczone wyłącznie do metadanych wydania uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności głównych. Nieznane zmiany w root/config w trybie bezpiecznym uruchamiają wszystkie ścieżki.

Przy pushach macierz `checks` dodaje ścieżkę `compat-node22` tylko dla pushy. Dla pull requestów ta ścieżka jest pomijana, a macierz pozostaje skupiona na zwykłych ścieżkach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało małe: kontrakty kanałów dzielą pokrycie rejestru i rdzenia na łącznie sześć ważonych szardów, testy bundled pluginów są równoważone na sześciu workerach rozszerzeń, auto-reply działa jako trzech zrównoważonych workerów zamiast sześciu małych workerów, a agentowe konfiguracje gateway/plugin są rozkładane na istniejące zadania agentic Node tylko ze źródeł zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarki, QA, mediów i różnych pluginów używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonej ogólnej konfiguracji pluginów. Szeroka ścieżka agents używa współdzielonego planisty równoległości plików Vitest, ponieważ dominuje w niej import/schedulowanie, a nie pojedynczy wolny plik testowy. `runtime-config` działa z szardem infra core-runtime, aby współdzielony szard runtime nie był właścicielem końcowego ogona. `check-additional` utrzymuje razem prace compile/canary dla granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; szard boundary guard uruchamia swoje małe niezależne guardy współbieżnie w ramach jednego zadania. Gateway watch, testy kanałów i szard granicy wsparcia rdzenia uruchamiają się współbieżnie w `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`, zachowując swoje stare nazwy sprawdzeń jako lekkie zadania weryfikujące, a jednocześnie unikając dwóch dodatkowych workerów Blacksmith i drugiej kolejki odbiorców artefaktów.
Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK dla Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje ten wariant z flagami SMS/call-log w BuildConfig, jednocześnie unikając duplikowania zadania pakowania debug APK przy każdym pushu istotnym dla Androida.
`extension-fast` jest tylko dla PR, ponieważ przebiegi push i tak wykonują pełne szardy bundled pluginów. Dzięki temu recenzje dostają szybką informację zwrotną dla zmienionych pluginów bez rezerwowania dodatkowego workera Blacksmith na `main` dla pokrycia już obecnego w `checks-node-extensions`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi do tego samego PR lub refa `main`. Traktuj to jako szum CI, chyba że najnowszy przebieg dla tego samego refa również kończy się błędem. Zagregowane sprawdzenia szardów używają `!cancelled() && always()`, więc nadal zgłaszają zwykłe błędy szardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony.
Klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHub w starej grupie kolejki nie mogło bezterminowo blokować nowszych przebiegów na main.

## Runery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie sprawdzenia protocol/contract/bundled, szardowane sprawdzenia kontraktów kanałów, szardy `check` z wyjątkiem lint, szardy i agregaty `check-additional`, zagregowane weryfikatory testów Node, sprawdzenia dokumentacji, Python Skills, workflow-sanity, labeler, auto-response; preflight dla install-smoke również używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej trafić do kolejki |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, szardy testów Linux Node, szardy testów bundled pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, które pozostaje na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało; buildy Docker dla install-smoke, gdzie czas oczekiwania w kolejce dla 32 vCPU kosztował więcej, niż oszczędzał                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` na `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` na `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes   # sprawdź lokalny klasyfikator zmienionych ścieżek dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: zmienione typecheck/lint/testy według ścieżki granicznej
pnpm check          # szybka lokalna bramka: produkcyjne tsgo + szardowany lint + równoległe szybkie guardy
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
node scripts/ci-run-timings.mjs <run-id>  # podsumuj czas wykonania, czas w kolejce i najwolniejsze zadania
```
