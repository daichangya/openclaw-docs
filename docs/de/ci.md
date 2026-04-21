---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen fehlschlagende GitHub-Actions-Checks.
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-21T06:23:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

## Job-Übersicht

| Job                              | Zweck                                                                                        | Wann er ausgeführt wird            |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Erkennt reine Doku-Änderungen, geänderte Scopes, geänderte Extensions und erstellt das CI-Manifest | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                               | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-dependency-audit`      | Audit der produktiven Lockfile ohne Abhängigkeitsinstallation gegen npm-Advisories          | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-fast`                  | Erforderliche Aggregation für die schnellen Sicherheitsjobs                                  | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `build-artifacts`                | Baut `dist/` und die Control UI einmal und lädt wiederverwendbare Artefakte für nachgelagerte Jobs hoch | Bei Node-relevanten Änderungen     |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Bundled-/Plugin-Contract-/Protocol-Prüfungen          | Bei Node-relevanten Änderungen     |
| `checks-fast-contracts-channels` | Gesplittete Channel-Contract-Prüfungen mit stabilem aggregiertem Check-Ergebnis             | Bei Node-relevanten Änderungen     |
| `checks-node-extensions`         | Vollständige Test-Shards für Bundled-Plugins über die gesamte Extension-Suite                | Bei Node-relevanten Änderungen     |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, Bundled-, Contract- und Extension-Lanes               | Bei Node-relevanten Änderungen     |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten Bundled-Plugins                                     | Wenn Extension-Änderungen erkannt werden |
| `check`                          | Gesplittetes Äquivalent zum wichtigsten lokalen Gate: produktive Typen, Lint, Guards, Test-Typen und strikter Smoke-Test | Bei Node-relevanten Änderungen     |
| `check-additional`               | Architecture-, Boundary-, Extension-Surface-Guards, Package-Boundary- und Gateway-Watch-Shards | Bei Node-relevanten Änderungen     |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                     | Bei Node-relevanten Änderungen     |
| `checks`                         | Verbleibende Linux-Node-Lanes: Channel-Tests und nur bei Pushes Node-22-Kompatibilität      | Bei Node-relevanten Änderungen     |
| `check-docs`                     | Doku-Formatierung, Lint und Broken-Link-Prüfungen                                            | Wenn sich Doku geändert hat        |
| `skills-python`                  | Ruff + pytest für Python-basierte Skills                                                     | Bei Python-Skill-relevanten Änderungen |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                               | Bei Windows-relevanten Änderungen  |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten Build-Artefakten                      | Bei macOS-relevanten Änderungen    |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                | Bei macOS-relevanten Änderungen    |
| `android`                        | Android-Build- und Test-Matrix                                                               | Bei Android-relevanten Änderungen  |

## Fail-Fast-Reihenfolge

Die Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure Jobs ausgeführt werden:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern sich die schwereren Plattform- und Runtime-Lanes auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik liegt in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.  
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er berechnet `run_install_smoke` aus dem engeren Signal `changed-smoke`, sodass Docker-/Install-Smoke nur bei install-, paketierungs- und containerrelevanten Änderungen ausgeführt wird.

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an der Core-Production führen Core-Prod-Typecheck plus Core-Tests aus, reine Core-Test-Änderungen führen nur Core-Test-Typecheck/-Tests aus, Änderungen an der Extension-Production führen Extension-Prod-Typecheck plus Extension-Tests aus, und reine Extension-Test-Änderungen führen nur Extension-Test-Typecheck/-Tests aus. Änderungen am öffentlichen Plugin SDK oder an Plugin-Contracts erweitern auf Extension-Validierung, weil Extensions von diesen Core-Contracts abhängen. Unbekannte Root-/Config-Änderungen fallen aus Sicherheitsgründen auf alle Lanes zurück.

Bei Pushes ergänzt die `checks`-Matrix die nur bei Pushes ausgeführte Lane `compat-node22`. Bei Pull Requests wird diese Lane übersprungen und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

Die langsamsten Node-Testfamilien werden in Include-File-Shards aufgeteilt, damit jeder Job klein bleibt: Channel-Contracts teilen Registry- und Core-Abdeckung in jeweils acht gewichtete Shards auf, Auto-Reply-Reply-Command-Tests werden in vier Include-Pattern-Shards aufgeteilt, und die anderen großen Auto-Reply-Reply-Prefix-Gruppen werden jeweils in zwei Shards aufgeteilt. `check-additional` trennt außerdem Package-Boundary-Compile-/Canary-Arbeit von Runtime-Topology-Gateway-/Architecture-Arbeit.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder demselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, es sei denn, der neueste Lauf für denselben Ref schlägt ebenfalls fehl. Die aggregierten Shard-Checks weisen explizit auf diesen Abbruchfall hin, damit er leichter von einem Testfehler zu unterscheiden ist.

## Runner

| Runner                           | Jobs                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-Checks, Doku-Checks, Python-Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                            |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # lokalen Changed-Lane-Klassifizierer für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderte Typechecks/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: produktives tsgo + gesplittetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Zeitmessungen pro Stufe
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Doku-Formatierung + Lint + Broken-Links
pnpm build          # `dist` bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
```
