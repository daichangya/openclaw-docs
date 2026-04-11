---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI uruchomiło się albo nie uruchomiło.
    - Debugujesz nieudane sprawdzenia GitHub Actions
summary: Graf zadań CI, bramki zakresu i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-11T02:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca7e355b7f73bfe8ea8c6971e78164b8b2e68cbb27966964955e267fed89fce6
    source_path: ci.md
    workflow: 15
---

# Potok CI

CI uruchamia się przy każdym pushu do `main` i przy każdym pull requeście. Używa inteligentnego określania zakresu, aby pomijać kosztowne zadania, gdy zmieniły się tylko niepowiązane obszary.

## Przegląd zadań

| Zadanie                  | Cel                                                                                      | Kiedy się uruchamia               |
| ------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`              | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze przy pushach i PR-ach, które nie są wersjami roboczymi |
| `security-fast`          | Wykrywanie kluczy prywatnych, audyt workflow przez `zizmor`, audyt zależności produkcyjnych | Zawsze przy pushach i PR-ach, które nie są wersjami roboczymi |
| `build-artifacts`        | Buduje `dist/` i Control UI jeden raz, przesyła artefakty wielokrotnego użytku dla zadań zależnych | Zmiany istotne dla Node           |
| `checks-fast-core`       | Szybkie linie poprawności na Linuksie, takie jak sprawdzenia bundled/plugin-contract/protocol | Zmiany istotne dla Node           |
| `checks-node-extensions` | Pełne shardy testów bundled-plugin w całym zestawie rozszerzeń                           | Zmiany istotne dla Node           |
| `checks-node-core-test`  | Shardy testów głównych Node, z wyłączeniem linii kanałów, bundled, contract i extension  | Zmiany istotne dla Node           |
| `extension-fast`         | Ukierunkowane testy tylko dla zmienionych bundled plugins                                | Gdy wykryto zmiany rozszerzeń     |
| `check`                  | Główna lokalna bramka w CI: `pnpm check` plus `pnpm build:strict-smoke`                  | Zmiany istotne dla Node           |
| `check-additional`       | Zabezpieczenia architektury, granic i cykli importów oraz harness regresji watch gateway | Zmiany istotne dla Node           |
| `build-smoke`            | Testy smoke zbudowanego CLI i smoke zużycia pamięci przy starcie                         | Zmiany istotne dla Node           |
| `checks`                 | Pozostałe linie Linux Node: testy kanałów i zgodność tylko dla pushy z Node 22           | Zmiany istotne dla Node           |
| `check-docs`             | Formatowanie dokumentacji, lint i sprawdzanie uszkodzonych linków                        | Zmieniono dokumentację            |
| `skills-python`          | Ruff + pytest dla Skills opartych na Pythonie                                            | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`         | Linie testowe specyficzne dla Windows                                                    | Zmiany istotne dla Windows        |
| `macos-node`             | Linia testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów        | Zmiany istotne dla macOS          |
| `macos-swift`            | Swift lint, build i testy dla aplikacji macOS                                            | Zmiany istotne dla macOS          |
| `android`                | Macierz buildów i testów Androida                                                        | Zmiany istotne dla Androida       |

## Kolejność fail-fast

Zadania są uporządkowane tak, aby tanie sprawdzenia kończyły się błędem, zanim uruchomią się droższe:

1. `preflight` decyduje, które linie w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się szybko bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się czasowo na szybkie linie Linuksa, aby zadania zależne mogły wystartować, gdy tylko współdzielony build będzie gotowy.
4. Następnie rozgałęziają się cięższe linie platformowe i runtime: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest objęta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`.
Osobny workflow `install-smoke` używa ponownie tego samego skryptu zakresu przez własne zadanie `preflight`. Oblicza `run_install_smoke` na podstawie węższego sygnału changed-smoke, więc smoke Dockera/instalacji uruchamia się tylko dla zmian istotnych dla instalacji, pakietowania i kontenerów.

Przy pushach macierz `checks` dodaje linię `compat-node22`, uruchamianą tylko dla pushy. Przy pull requestach ta linia jest pomijana, a macierz pozostaje skupiona na normalnych liniach testów/kanałów.

## Runnery

| Runner                           | Zadania                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, sprawdzenia Linuksa, sprawdzenia dokumentacji, Skills w Pythonie, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                        |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                             |

## Lokalne odpowiedniki

```bash
pnpm check          # typy + lint + formatowanie
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # testy vitest
pnpm test:channels
pnpm check:docs     # formatowanie dokumentacji + lint + uszkodzone linki
pnpm build          # buduje dist, gdy mają znaczenie linie artefaktów/build-smoke w CI
```
