---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen fehlschlagende GitHub-Actions-Prüfungen
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-09T06:13:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: d104f2510fadd674d7952aa08ad73e10f685afebea8d7f19adc1d428e2bdc908
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI wird bei jedem Push auf `main` und bei jedem Pull Request ausgeführt. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn nur nicht zusammenhängende Bereiche geändert wurden.

## Job-Übersicht

| Job                      | Zweck                                                                                    | Wann er ausgeführt wird             |
| ------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Nur-Doku-Änderungen, geänderte Scopes, geänderte Erweiterungen erkennen und das CI-Manifest erstellen | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-fast`          | Erkennung privater Schlüssel, Workflow-Audit über `zizmor`, Audit von Produktionsabhängigkeiten | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `build-artifacts`        | `dist/` und die Control UI einmal bauen, wiederverwendbare Artefakte für nachgelagerte Jobs hochladen | Für Node relevante Änderungen       |
| `checks-fast-core`       | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für gebündelte/plugin-contract/protocol | Für Node relevante Änderungen       |
| `checks-fast-extensions` | Die Shard-Lanes der Erweiterungen zusammenfassen, nachdem `checks-fast-extensions-shard` abgeschlossen ist | Für Node relevante Änderungen       |
| `extension-fast`         | Gezielte Tests nur für die geänderten gebündelten Plugins                               | Wenn Erweiterungsänderungen erkannt werden |
| `check`                  | Hauptsächliches lokales Gate in CI: `pnpm check` plus `pnpm build:strict-smoke`         | Für Node relevante Änderungen       |
| `check-additional`       | Architektur-, Boundary- und Import-Cycle-Schutzprüfungen plus das Gateway-Watch-Regressions-Harness | Für Node relevante Änderungen       |
| `build-smoke`            | Smoke-Tests für die gebaute CLI und Smoke-Test für den Startup-Speicher                 | Für Node relevante Änderungen       |
| `checks`                 | Schwerere Linux-Node-Lanes: vollständige Tests, Channel-Tests und nur bei Pushes Node-22-Kompatibilität | Für Node relevante Änderungen       |
| `check-docs`             | Doku-Formatierung, Linting und Broken-Link-Prüfungen                                    | Doku geändert                       |
| `skills-python`          | Ruff + pytest für Python-basierte Skills                                                | Für Python-Skills relevante Änderungen |
| `checks-windows`         | Windows-spezifische Test-Lanes                                                          | Für Windows relevante Änderungen    |
| `macos-node`             | macOS-TypeScript-Test-Lane unter Verwendung der gemeinsam genutzten gebauten Artefakte  | Für macOS relevante Änderungen      |
| `macos-swift`            | Swift-Linting, Build und Tests für die macOS-App                                        | Für macOS relevante Änderungen      |
| `android`                | Android-Build- und Test-Matrix                                                          | Für Android relevante Änderungen    |

## Fail-Fast-Reihenfolge

Die Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure ausgeführt werden:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern sich schwerere Plattform- und Runtime-Lanes auf: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er berechnet `run_install_smoke` aus dem engeren Signal changed-smoke, sodass Docker-/Install-Smoke nur für install-, packaging- und containerrelevante Änderungen ausgeführt wird.

Bei Pushes fügt die Matrix `checks` die nur bei Pushes vorhandene Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen, und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

## Runner

| Runner                           | Jobs                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux-Prüfungen, Doku-Prüfungen, Python-Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Lokale Äquivalente

```bash
pnpm check          # Typen + Lint + Format
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # vitest-Tests
pnpm test:channels
pnpm check:docs     # Doku-Format + Lint + defekte Links
pnpm build          # dist bauen, wenn die CI-Lanes für Artefakte/Build-Smoke relevant sind
```
