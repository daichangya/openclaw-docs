---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen fehlschlagende GitHub Actions-Prüfungen
summary: CI-Job-Graph, Bereichs-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-05T12:37:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a95b6e584b4309bc249866ea436b4dfe30e0298ab8916eadbc344edae3d1194
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn nur nicht zusammenhängende Bereiche geändert wurden.

## Job-Übersicht

| Job                      | Zweck                                                                                          | Wann er ausgeführt wird             |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Nur-Doku-Änderungen, geänderte Bereiche und geänderte Extensions erkennen und das CI-Manifest erstellen | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-fast`          | Erkennung privater Schlüssel, Workflow-Audit über `zizmor`, Audit der Produktionsabhängigkeiten | Immer bei Nicht-Entwurf-Pushes und PRs |
| `build-artifacts`        | `dist/` und die Control UI einmal bauen, wiederverwendbare Artefakte für nachgelagerte Jobs hochladen | Node-relevante Änderungen           |
| `checks-fast-core`       | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für Bundles/Plugin-Verträge/Protokolle        | Node-relevante Änderungen           |
| `checks-fast-extensions` | Die Extension-Shard-Lanes aggregieren, nachdem `checks-fast-extensions-shard` abgeschlossen ist | Node-relevante Änderungen           |
| `extension-fast`         | Gezielte Tests nur für die geänderten gebündelten Plugins                                      | Wenn Extension-Änderungen erkannt werden |
| `check`                  | Haupt-lokales Gate in CI: `pnpm check` plus `pnpm build:strict-smoke`                          | Node-relevante Änderungen           |
| `check-additional`       | Architektur- und Boundary-Guards plus das Gateway-Watch-Regression-Harness                     | Node-relevante Änderungen           |
| `build-smoke`            | Smoke-Tests für die gebaute CLI und Startup-Speicher-Smoke                                     | Node-relevante Änderungen           |
| `checks`                 | Schwerere Linux-Node-Lanes: vollständige Tests, Kanaltests und nur bei Pushes Node-22-Kompatibilität | Node-relevante Änderungen           |
| `check-docs`             | Doku-Formatierung, Linting und Prüfungen auf defekte Links                                     | Doku geändert                       |
| `skills-python`          | Ruff + pytest für Python-basierte Skills                                                       | Für Python-Skills relevante Änderungen |
| `checks-windows`         | Windows-spezifische Test-Lanes                                                                  | Windows-relevante Änderungen        |
| `macos-node`             | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten gebauten Artefakten                     | macOS-relevante Änderungen          |
| `macos-swift`            | Swift-Lint, Build und Tests für die macOS-App                                                  | macOS-relevante Änderungen          |
| `android`                | Android-Build- und Testmatrix                                                                   | Android-relevante Änderungen        |

## Fail-Fast-Reihenfolge

Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure ausgeführt werden:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern sich schwerere Plattform- und Laufzeit-Lanes auf: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Bereichslogik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Der separate Workflow `install-smoke` verwendet dasselbe Bereichsskript über seinen eigenen `preflight`-Job wieder. Er berechnet `run_install_smoke` aus dem engeren `changed-smoke`-Signal, sodass Docker-/Install-Smoke nur bei install-, packaging- und containerrelevanten Änderungen läuft.

Bei Pushes fügt die Matrix `checks` die nur bei Pushes ausgeführte Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen, und die Matrix bleibt auf die normalen Test-/Kanal-Lanes fokussiert.

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
pnpm test:gateway:watch-regression
pnpm test           # vitest-Tests
pnpm test:channels
pnpm check:docs     # Doku-Format + Lint + defekte Links
pnpm build          # dist bauen, wenn die CI-Artefakt-/build-smoke-Lanes relevant sind
```
