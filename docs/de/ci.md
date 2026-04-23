---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen fehlgeschlagene GitHub-Actions-Prüfungen
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-23T14:55:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn nur nicht zusammenhängende Bereiche geändert wurden.

QA Lab hat dedizierte CI-Lanes außerhalb des Haupt-Workflows mit intelligentem Scoping. Der
Workflow `Parity gate` läuft bei passenden PR-Änderungen und bei manuellem Dispatch; er
baut die private QA-Laufzeit und vergleicht die agentischen Packs für Mock GPT-5.4 und Opus 4.6.
Der Workflow `QA-Lab - All Lanes` läuft nachts auf `main` und bei
manuellem Dispatch; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane und die Live-
Telegram-Lane als parallele Jobs auf. Die Live-Jobs verwenden die Umgebung `qa-live-shared`,
und die Telegram-Lane verwendet Convex-Leases. `OpenClaw Release
Checks` führt außerdem dieselben QA-Lab-Lanes vor der Release-Freigabe aus.

## Job-Übersicht

| Job                              | Zweck                                                                                        | Wann er läuft                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Erkennt nur-Doku-Änderungen, geänderte Scopes, geänderte Erweiterungen und baut das CI-Manifest | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-dependency-audit`      | Produktions-Lockfile-Audit ohne Abhängigkeiten gegen npm-Advisories                          | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-fast`                  | Erforderliche Aggregation für die schnellen Sicherheitsjobs                                  | Immer bei Nicht-Entwurf-Pushes und PRs |
| `build-artifacts`                | Baut `dist/`, das Control UI, Built-Artifact-Prüfungen und wiederverwendbare nachgelagerte Artefakte | Node-relevante Änderungen           |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für gebündelte Plugins/Plugin-Verträge/Protokoll | Node-relevante Änderungen           |
| `checks-fast-contracts-channels` | Gesplittete Channel-Vertragsprüfungen mit einem stabilen aggregierten Prüfergebnis           | Node-relevante Änderungen           |
| `checks-node-extensions`         | Vollständige Test-Shards für gebündelte Plugins über die gesamte Erweiterungs-Suite          | Node-relevante Änderungen           |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte-, Vertrags- und Erweiterungs-Lanes         | Node-relevante Änderungen           |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten gebündelten Plugins                                 | Pull Requests mit Erweiterungsänderungen |
| `check`                          | Gesplittetes Äquivalent zum wichtigsten lokalen Gate: Prod-Typen, Lint, Guard-Prüfungen, Test-Typen und strenger Smoke-Test | Node-relevante Änderungen           |
| `check-additional`               | Architektur-, Boundary-, Erweiterungsoberflächen-Guards, Package-Boundary- und Gateway-Watch-Shards | Node-relevante Änderungen           |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                     | Node-relevante Änderungen           |
| `checks`                         | Verifier für Channel-Tests auf Built-Artifacts plus nur bei Pushes Node-22-Kompatibilität    | Node-relevante Änderungen           |
| `check-docs`                     | Doku-Formatierung, Lint und Prüfungen auf defekte Links                                      | Doku geändert                       |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                    | Python-Skills-relevante Änderungen  |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                               | Windows-relevante Änderungen        |
| `macos-node`                     | macOS-TypeScript-Test-Lane unter Verwendung der gemeinsam genutzten Built-Artifacts          | macOS-relevante Änderungen          |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                | macOS-relevante Änderungen          |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                | Android-relevante Änderungen        |

## Fail-Fast-Reihenfolge

Die Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure Jobs laufen:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern die schwereren Plattform- und Laufzeit-Lanes auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, das nur für PRs laufende `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik lebt in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Änderungen am CI-Workflow validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber nicht selbst Windows-, Android- oder macOS-native Builds; diese Plattform-Lanes bleiben auf Änderungen im Plattform-Quellcode beschränkt.
Windows-Node-Prüfungen sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Hilfen, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Quellcode-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes, damit sie keinen Windows-Worker mit 16 vCPU für Abdeckung reservieren, die bereits durch die normalen Test-Shards ausgeübt wird.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` erneut. Er berechnet `run_install_smoke` aus dem enger gefassten Signal changed-smoke, sodass Docker/Install-Smoke bei install-, packaging-, container-relevanten Änderungen, Änderungen an der Produktionslogik gebündelter Erweiterungen und an den Core-Oberflächen Plugin/Channel/Gateway/Plugin SDK läuft, die die Docker-Smoke-Jobs ausüben. Reine Test- und reine Doku-Änderungen reservieren keine Docker-Worker. Sein QR-Package-Smoke erzwingt, dass die Docker-Schicht `pnpm install` erneut läuft, wobei der BuildKit-pnpm-Store-Cache erhalten bleibt, sodass die Installation weiter geprüft wird, ohne bei jedem Lauf Abhängigkeiten erneut herunterzuladen. Sein gateway-network-e2e verwendet das früher im Job gebaute Runtime-Image erneut, sodass echte WebSocket-Abdeckung zwischen Containern hinzugefügt wird, ohne einen weiteren Docker-Build hinzuzufügen. Lokal baut `test:docker:all` ein gemeinsames Live-Test-Image und ein gemeinsames Built-App-Image aus `scripts/e2e/Dockerfile` vor und führt dann die Live-/E2E-Smoke-Lanes parallel mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus; passen Sie die Standard-Parallelität von 4 mit `OPENCLAW_DOCKER_ALL_PARALLELISM` an. Das lokale Aggregat plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, und jede Lane hat ein Timeout von 120 Minuten, überschreibbar mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Startup- oder Provider-sensitive Lanes laufen exklusiv nach dem parallelen Pool. Der wiederverwendbare Live-/E2E-Workflow bildet das Muster mit gemeinsamem Image nach, indem er vor der Docker-Matrix ein SHA-getaggtes GHCR-Docker-E2E-Image baut und pusht und dann die Matrix mit `OPENCLAW_SKIP_DOCKER_BUILD=1` ausführt. Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus. QR- und Installer-Docker-Tests behalten ihre eigenen install-fokussierten Dockerfiles. Ein separater Job `docker-e2e-fast` führt das begrenzte gebündelte Plugin-Docker-Profil mit einem Befehls-Timeout von 120 Sekunden aus: setup-entry-Abhängigkeitsreparatur plus synthetische Isolierung von Fehlern im gebündelten Loader. Die vollständige Matrix für gebündelte Updates/Channel bleibt manuell/vollständige Suite, weil sie wiederholt echte npm-Update- und doctor-Reparaturdurchläufe ausführt.

Die lokale Logik für Changed-Lanes lebt in `scripts/changed-lanes.mjs` und wird durch `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an der Core-Produktionslogik führen Core-Prod-Typecheck plus Core-Tests aus, reine Core-Teständerungen führen nur Core-Test-Typecheck/-Tests aus, Änderungen an der Produktionslogik von Erweiterungen führen Erweiterungs-Prod-Typecheck plus Erweiterungstests aus, und reine Erweiterungsteständerungen führen nur Erweiterungstest-Typecheck/-Tests aus. Änderungen an öffentlichem Plugin SDK oder Plugin-Verträgen erweitern die Validierung auf Erweiterungen, weil Erweiterungen von diesen Core-Verträgen abhängen. Reine Versionserhöhungen in Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten aus. Unbekannte Root-/Konfigurationsänderungen fallen aus Sicherheitsgründen auf alle Lanes zurück.

Bei Pushes fügt die Matrix `checks` die nur bei Pushes laufende Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen, und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

Die langsamsten Node-Testfamilien werden aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete Shards, Tests für gebündelte Plugins werden über sechs Erweiterungs-Worker verteilt, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als drei ausbalancierte Worker statt sechs winziger Worker, und agentische Gateway-/Plugin-Konfigurationen werden über die vorhandenen agentischen Node-Quellcode-Jobs verteilt, statt auf Built-Artifacts zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Sammel-Setups. Die breite Agents-Lane verwendet den gemeinsamen Dateiparallel-Scheduler von Vitest, weil sie von Importen/Planung dominiert wird statt von einer einzelnen langsamen Testdatei. `runtime-config` läuft mit dem Shard infra core-runtime, damit nicht der gemeinsame Runtime-Shard den Nachlauf besitzt. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Laufzeittopologie-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs parallel aus. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` gleichzeitig, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden; so bleiben ihre alten Prüfnamen als leichtgewichtige Verifier-Jobs erhalten, während zwei zusätzliche Blacksmith-Worker und eine zweite Warteschlange für Artefakt-Verbraucher vermieden werden.
Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut dann das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source-Set und kein eigenes Manifest; seine Unit-Test-Lane kompiliert diesen Flavor dennoch mit den SMS-/Call-Log-BuildConfig-Flags und vermeidet gleichzeitig einen doppelten Packaging-Job für Debug-APK bei jedem Android-relevanten Push.
`extension-fast` ist nur für PRs, weil Push-Läufe bereits die vollständigen Shards für gebündelte Plugins ausführen. Das sorgt für Feedback zu geänderten Plugins in Reviews, ohne auf `main` einen zusätzlichen Blacksmith-Worker für Abdeckung zu reservieren, die bereits in `checks-node-extensions` vorhanden ist.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder demselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, außer wenn der neueste Lauf für denselben Ref ebenfalls fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie weiterhin normale Shard-Fehler melden, aber nicht in die Queue gestellt werden, nachdem der gesamte Workflow bereits ersetzt wurde.
Der CI-Concurrency-Key ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht auf unbestimmte Zeit blockieren kann.

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Prüfungen für Protokoll/Verträge/gebündelte Plugins, gesplittete Channel-Vertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregate, Aggregate-Verifier für Node-Tests, Doku-Prüfungen, Python-Skills, workflow-sanity, labeler, auto-response; preflight für install-smoke verwendet ebenfalls GitHub-gehostetes Ubuntu, sodass die Blacksmith-Matrix früher in die Queue gestellt werden kann |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, das CPU-sensitiv genug bleibt, dass 8 vCPU mehr Kosten verursachten, als sie einsparten; install-smoke-Docker-Builds, bei denen die Queue-Zeit für 32 vCPU mehr kostete, als sie einsparten                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                          |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # lokalen Changed-Lane-Klassifizierer für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderte Typechecks/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: Produktions-tsgo + gesplittetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Timings pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Doku-Formatierung + Lint + defekte Links
pnpm build          # `dist` bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
node scripts/ci-run-timings.mjs <run-id>      # Laufzeit, Queue-Zeit und langsamste Jobs zusammenfassen
node scripts/ci-run-timings.mjs --recent 10   # aktuelle erfolgreiche main-CI-Läufe vergleichen
```
