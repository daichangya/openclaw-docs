---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudane kontrole GitHub Actions
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-23T09:56:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# Potok CI

CI uruchamia się przy każdym pushu do `main` i dla każdego pull requestu. Używa inteligentnego określania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

QA Lab ma dedykowane ścieżki CI poza głównym workflow z inteligentnym określaniem zakresu. Workflow
`Parity gate` uruchamia się dla pasujących zmian w PR oraz ręcznie; buduje
prywatne środowisko uruchomieniowe QA i porównuje agentowe pakiety mock GPT-5.4 i Opus 4.6.
Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` oraz ręcznie;
rozdziela mock parity gate, aktywną ścieżkę Matrix i aktywną ścieżkę Telegram jako zadania równoległe. Zadania aktywne używają środowiska `qa-live-shared`,
a ścieżka Telegram używa dzierżaw Convex. `OpenClaw Release
Checks` również uruchamia te same ścieżki QA Lab przed zatwierdzeniem wydania.

## Przegląd zadań

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze dla pushy i PR-ów, które nie są szkicami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                 | Zawsze dla pushy i PR-ów, które nie są szkicami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem alertów npm                             | Zawsze dla pushy i PR-ów, które nie są szkicami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze dla pushy i PR-ów, które nie są szkicami |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku dla zadań zależnych | Zmiany istotne dla Node            |
| `checks-fast-core`               | Szybkie ścieżki poprawności na Linuksie, takie jak kontrole bundled/plugin-contract/protocol | Zmiany istotne dla Node            |
| `checks-fast-contracts-channels` | Szardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli           | Zmiany istotne dla Node            |
| `checks-node-extensions`         | Pełne szardy testów bundled Pluginów dla całego zestawu rozszerzeń                           | Zmiany istotne dla Node            |
| `checks-node-core-test`          | Szardy testów głównego Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń | Zmiany istotne dla Node            |
| `extension-fast`                 | Ukierunkowane testy tylko dla zmienionych bundled Pluginów                                   | Pull requesty ze zmianami w rozszerzeniach |
| `check`                          | Szardowany odpowiednik głównej lokalnej bramki: typy prod, lint, guardy, typy testowe i ścisły smoke | Zmiany istotne dla Node            |
| `check-additional`               | Architektura, granice, guardy powierzchni rozszerzeń, granice pakietów i szardy gateway-watch | Zmiany istotne dla Node            |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci przy starcie                                     | Zmiany istotne dla Node            |
| `checks`                         | Weryfikator dla testów kanałów na zbudowanych artefaktach plus zgodność z Node 22 tylko dla pushy | Zmiany istotne dla Node            |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrola uszkodzonych linków                               | Zmieniono dokumentację             |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Ścieżki testowe specyficzne dla Windows                                                      | Zmiany istotne dla Windows         |
| `macos-node`                     | Ścieżka testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów          | Zmiany istotne dla macOS           |
| `macos-swift`                    | Lint, build i testy Swift dla aplikacji macOS                                                | Zmiany istotne dla macOS           |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jeden build debug APK                      | Zmiany istotne dla Androida        |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie kontrole kończyły się błędem, zanim uruchomią się kosztowne:

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się szybko, bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` działa równolegle z szybkimi ścieżkami linuksowymi, aby konsumenci zależni mogli wystartować, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platformowe i środowiska wykonawczego rozdzielają się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, tylko-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Edycje workflow CI weryfikują graf Node CI oraz linting workflow, ale same z siebie nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platformowe pozostają ograniczone do zmian w źródłach danej platformy.
Kontrole Windows Node są ograniczone do wrapperów procesów/ścieżek specyficznych dla Windows, pomocników uruchamiania npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które uruchamiają tę ścieżkę; niepowiązane zmiany w kodzie źródłowym, Pluginach, install-smoke i samych testach pozostają na linuksowych ścieżkach Node, aby nie rezerwować 16-vCPU workera Windows dla pokrycia, które jest już wykonywane przez zwykłe szardy testowe.
Osobny workflow `install-smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Oblicza `run_install_smoke` na podstawie węższego sygnału changed-smoke, więc smoke Docker/install uruchamia się dla zmian dotyczących instalacji, pakowania, kontenerów, zmian produkcyjnych w bundled extensions oraz głównych powierzchni Pluginów/kanałów/Gateway/Plugin SDK, które wykonują zadania Docker smoke. Edycje tylko testowe i tylko dokumentacyjne nie rezerwują workerów Dockera. Jego smoke pakietu QR wymusza ponowne uruchomienie warstwy Docker `pnpm install`, zachowując przy tym cache BuildKit pnpm store, więc nadal ćwiczy instalację bez ponownego pobierania zależności przy każdym uruchomieniu. Jego gateway-network e2e ponownie używa obrazu runtime zbudowanego wcześniej w zadaniu, więc dodaje rzeczywiste pokrycie WebSocket między kontenerami bez dodawania kolejnego builda Dockera. Lokalny `test:docker:all` wstępnie buduje jeden współdzielony obraz built-app z `scripts/e2e/Dockerfile` i używa go ponownie we wszystkich runnerach kontenerowego smoke E2E; workflow wielokrotnego użytku live/E2E odwzorowuje ten wzorzec, budując i publikując jeden obraz Docker E2E GHCR oznaczony SHA przed macierzą Dockera, a następnie uruchamia macierz z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Testy Docker QR i installera zachowują własne Dockerfile skoncentrowane na instalacji. Osobne zadanie `docker-e2e-fast` uruchamia ograniczony profil Docker bundled Pluginów z limitem czasu polecenia 120 sekund: naprawa zależności setup-entry oraz izolacja syntetycznego błędu bundled-loader. Pełna macierz bundled update/channel pozostaje ręczna/pełnego zestawu, ponieważ wykonuje powtarzane rzeczywiste przebiegi npm update i doctor repair.

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka jest bardziej rygorystyczna względem granic architektury niż szeroki zakres platform CI: zmiany produkcyjne w core uruchamiają typecheck prod core plus testy core, zmiany tylko testowe w core uruchamiają tylko typecheck/testy core-test, zmiany produkcyjne w rozszerzeniach uruchamiają typecheck prod rozszerzeń plus testy rozszerzeń, a zmiany tylko testowe w rozszerzeniach uruchamiają tylko typecheck/testy rozszerzeń. Zmiany w publicznym Plugin SDK lub plugin-contract rozszerzają walidację na rozszerzenia, ponieważ rozszerzenia zależą od tych kontraktów core. Zmiany tylko w metadanych wydania, takie jak podbicia wersji, uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych. Nieznane zmiany w root/config w bezpieczny sposób uruchamiają wszystkie ścieżki.

Przy pushach macierz `checks` dodaje ścieżkę `compat-node22`, uruchamianą tylko dla pushy. W pull requestach ta ścieżka jest pomijana, a macierz pozostaje skupiona na zwykłych ścieżkach testów/kanałów.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało niewielkie: kontrakty kanałów dzielą pokrycie rejestru i core na łącznie sześć ważonych shardów, testy bundled Pluginów są równoważone na sześciu workerach rozszerzeń, auto-reply działa jako trzy zrównoważone workery zamiast sześciu małych workerów, a agentowe konfiguracje gateway/plugin są rozkładane na istniejące zadania agentic Node dotyczące samych źródeł, zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarki, QA, mediów i różnych Pluginów używają dedykowanych konfiguracji Vitest zamiast współdzielonego zbiorczego zestawu pluginów. Szeroka ścieżka agents używa współdzielonego planisty równoległego dla plików Vitest, ponieważ dominuje w niej import/szeregowanie, a nie pojedynczy wolny plik testowy. `runtime-config` działa z shardem infra core-runtime, aby współdzielony shard runtime nie przejmował końcówki. `check-additional` trzyma razem kompilację/canary granic pakietów i rozdziela architekturę topologii runtime od pokrycia gateway watch; shard boundary guard uruchamia swoje małe niezależne guardy współbieżnie w jednym zadaniu. Gateway watch, testy kanałów i shard granicy wsparcia core działają współbieżnie wewnątrz `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`, zachowując stare nazwy kontroli jako lekkie zadania weryfikujące, a jednocześnie unikając dwóch dodatkowych workerów Blacksmith i drugiej kolejki konsumentów artefaktów.
Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK dla Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje ten wariant z flagami BuildConfig SMS/call-log, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym pushu istotnym dla Androida.
`extension-fast` jest tylko dla PR, ponieważ przebiegi push już wykonują pełne szardy bundled Pluginów. Daje to szybką informację zwrotną dla zmienionych Pluginów w czasie review bez rezerwowania dodatkowego workera Blacksmith na `main` dla pokrycia, które już istnieje w `checks-node-extensions`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi na ten sam PR lub ref `main`. Traktuj to jako szum CI, chyba że najnowszy przebieg dla tego samego refu również kończy się błędem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal zgłaszają normalne błędy shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony.
Klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHub w starej grupie kolejki nie może bezterminowo blokować nowszych przebiegów main.

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protocol/contract/bundled, szardowane kontrole kontraktów kanałów, szardy `check` z wyjątkiem lint, szardy i agregaty `check-additional`, agregaty weryfikujące testy Node, kontrole dokumentacji, Skills w Pythonie, workflow-sanity, labeler, auto-response; preflight install-smoke również używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej trafić do kolejki |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, szardy testów Linux Node, szardy testów bundled Pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, które pozostaje na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało; buildy Docker install-smoke, gdzie koszt czasu oczekiwania w kolejce dla 32 vCPU był większy niż zysk                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

## Lokalni odpowiednicy

```bash
pnpm changed:lanes   # sprawdź lokalny klasyfikator changed-lane dla origin/main...HEAD
pnpm check:changed   # inteligentna lokalna bramka: changed typecheck/lint/testy według ścieżki granicznej
pnpm check          # szybka lokalna bramka: produkcyjny tsgo + szardowany lint + równoległe szybkie guardy
pnpm check:test-types
pnpm check:timed    # ta sama bramka z pomiarem czasu dla każdego etapu
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatowanie dokumentacji + lint + uszkodzone linki
pnpm build          # zbuduj dist, gdy mają znaczenie ścieżki CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # podsumuj czas ścienny, czas oczekiwania w kolejce i najwolniejsze zadania
```
