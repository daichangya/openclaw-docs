---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen fehlschlagende GitHub-Actions-Checks.
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-23T13:59:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

QA Lab hat eigene CI-Lanes außerhalb des primären intelligent gescopten Workflows. Der
Workflow `Parity gate` läuft bei passenden PR-Änderungen und per manuellem Dispatch; er
baut die private QA-Runtime und vergleicht die agentischen Packs für Mock GPT-5.4 und Opus 4.6.
Der Workflow `QA-Lab - All Lanes` läuft nachts auf `main` und per
manuellem Dispatch; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane und die Live-
Telegram-Lane als parallele Jobs auf. Die Live-Jobs verwenden die Umgebung `qa-live-shared`,
und die Telegram-Lane verwendet Convex-Leases. `OpenClaw Release
Checks` führt vor der Freigabe eines Releases ebenfalls dieselben QA-Lab-Lanes aus.

## Job-Überblick

| Job                              | Zweck                                                                                        | Wann er läuft                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Nur-Doku-Änderungen, geänderte Scopes, geänderte extensions erkennen und das CI-Manifest bauen | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                               | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-dependency-audit`      | Produktions-Lockfile-Audit ohne Abhängigkeiten gegen npm-Advisories                         | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                     | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `build-artifacts`                | `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare nachgelagerte Artefakte bauen | Node-relevante Änderungen           |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für bundled/plugin-contract/protocol        | Node-relevante Änderungen           |
| `checks-fast-contracts-channels` | Geshardete Channel-Contract-Prüfungen mit stabilem aggregiertem Check-Ergebnis              | Node-relevante Änderungen           |
| `checks-node-extensions`         | Vollständige Test-Shards für bundled Plugin über die gesamte Extension-Suite                | Node-relevante Änderungen           |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, bundled-, Contract- und Extension-Lanes              | Node-relevante Änderungen           |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten bundled Plugin                                     | Pull Requests mit Extension-Änderungen |
| `check`                          | Geshardetes Äquivalent zum primären lokalen Gate: Prod-Typen, Lint, Guards, Test-Typen und strikter Smoke | Node-relevante Änderungen           |
| `check-additional`               | Architektur-, Boundary-, Extension-Surface-Guards, Package-Boundary und Gateway-Watch-Shards | Node-relevante Änderungen           |
| `build-smoke`                    | Smoke-Tests für gebaute CLI und Startspeicher-Smoke                                         | Node-relevante Änderungen           |
| `checks`                         | Verifier für Channel-Tests mit gebauten Artefakten plus nur-Push-Node-22-Kompatibilität    | Node-relevante Änderungen           |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                           | Doku geändert                       |
| `skills-python`                  | Ruff + pytest für Python-basierte Skills                                                    | Python-Skill-relevante Änderungen   |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                              | Windows-relevante Änderungen        |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten gebauten Artefakten                  | macOS-relevante Änderungen          |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                               | macOS-relevante Änderungen          |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                              | Android-relevante Änderungen        |

## Reihenfolge für schnelles Fehlschlagen

Die Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure Jobs starten:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern die schwereren Plattform- und Runtime-Lanes auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, das nur-PR-`extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Änderungen an CI-Workflows validieren den Node-CI-Graphen sowie das Workflow-Linting, erzwingen aber für sich allein keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Änderungen an der jeweiligen Plattformquelle beschränkt.
Windows-Node-Prüfungen sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Helfer, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen begrenzt, die diese Lane ausführen; nicht zusammenhängende Source-, Plugin-, Install-Smoke- und nur-Test-Änderungen bleiben auf den Linux-Node-Lanes, damit sie keinen Windows-Worker mit 16 vCPU für Abdeckung reservieren, die bereits durch die normalen Test-Shards ausgeübt wird.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er berechnet `run_install_smoke` aus dem engeren Signal `changed-smoke`, sodass Docker-/Install-Smoke bei Installations-, Packaging-, containerrelevanten Änderungen, Production-Änderungen an gebündelten extensions sowie den Core-Surfaces für Plugin/Channel/Gateway/Plugin SDK läuft, die die Docker-Smoke-Jobs abdecken. Nur-Test- und nur-Doku-Änderungen reservieren keine Docker-Worker. Sein QR-Package-Smoke erzwingt, dass die Docker-Schicht `pnpm install` erneut ausgeführt wird, wobei der BuildKit-pnpm-Store-Cache erhalten bleibt, sodass die Installation weiterhin getestet wird, ohne bei jedem Lauf Abhängigkeiten neu herunterzuladen. Sein Gateway-Network-e2e verwendet das früher im Job gebaute Runtime-Image wieder, sodass echte container-zu-container-WebSocket-Abdeckung hinzukommt, ohne einen weiteren Docker-Build hinzuzufügen. Lokal baut `test:docker:all` ein gemeinsames Live-Test-Image und ein gemeinsames Built-App-Image aus `scripts/e2e/Dockerfile` vor und führt dann die Live-/E2E-Smoke-Lanes parallel mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus; passen Sie die Standard-Parallelität von 4 mit `OPENCLAW_DOCKER_ALL_PARALLELISM` an. Das lokale Aggregat plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, und jede Lane hat ein 120-Minuten-Timeout, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann. Start- oder Provider-sensitive Lanes laufen exklusiv nach dem parallelen Pool. Der wiederverwendbare Live-/E2E-Workflow spiegelt das Muster mit gemeinsamem Image, indem er vor der Docker-Matrix ein SHA-getaggtes GHCR-Docker-E2E-Image baut und pusht und dann die Matrix mit `OPENCLAW_SKIP_DOCKER_BUILD=1` ausführt. Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles. Ein separater Job `docker-e2e-fast` führt das begrenzte Docker-Profil für bundled Plugin unter einem Befehls-Timeout von 120 Sekunden aus: Dependency-Reparatur für setup-entry plus synthetische Isolierung von Fehlern im bundled-loader. Die vollständige Matrix für bundled Update/Channel bleibt manuell/Vollsuite, weil sie wiederholte echte npm-update- und doctor-repair-Durchläufe ausführt.

Die Logik für lokale Changed-Lanes befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an der Core-Production führen Prod-Typecheck für den Core plus Core-Tests aus, reine Core-Test-Änderungen führen nur Test-Typecheck/Tests für den Core aus, Änderungen an der Extension-Production führen Prod-Typecheck für extensions plus Extension-Tests aus, und reine Extension-Test-Änderungen führen nur Test-Typecheck/Tests für extensions aus. Änderungen am öffentlichen Plugin SDK oder an plugin-contract erweitern die Validierung auf extensions, weil extensions von diesen Core-Contracts abhängen. Reine Versions-Bumps an Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten aus. Unbekannte Änderungen an Root/Konfiguration schlagen sicherheitshalber auf alle Lanes durch.

Bei Pushes fügt die Matrix `checks` die nur-Push-Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen, und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt: Channel-Contracts teilen Registry- und Core-Abdeckung in insgesamt sechs gewichtete Shards auf, Tests für bundled Plugin werden über sechs Extension-Worker ausbalanciert, Auto-Reply läuft als drei ausbalancierte Worker statt sechs winziger Worker, und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden agentischen Node-Jobs nur für Source verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre eigenen dedizierten Vitest-Konfigurationen statt des gemeinsamen Catch-all für Plugin. Die breite Agents-Lane verwendet den gemeinsamen dateiparallelen Vitest-Scheduler, weil sie von Imports/Terminierung dominiert ist statt von einer einzelnen langsamen Testdatei. `runtime-config` läuft mit dem Shard `infra core-runtime`, damit der gemeinsame Runtime-Shard nicht das Tail besitzt. `check-additional` hält Compile-/Canary-Arbeit für Package-Boundary zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards gleichzeitig innerhalb eines Jobs aus. Gateway-Watch, Channel-Tests und der Shard `core support-boundary` laufen gleichzeitig innerhalb von `build-artifacts`, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden. So bleiben ihre alten Check-Namen als leichtgewichtige Verifier-Jobs erhalten, während zwei zusätzliche Blacksmith-Worker und eine zweite Artifact-Consumer-Queue vermieden werden.
Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut dann das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source-Set oder Manifest; seine Unit-Test-Lane kompiliert diesen Flavor dennoch mit den SMS-/Call-Log-BuildConfig-Flags, vermeidet dabei aber einen doppelten Packaging-Job für Debug-APKs bei jedem Android-relevanten Push.
`extension-fast` ist nur für PRs, weil Push-Läufe bereits die vollständigen Test-Shards für bundled Plugin ausführen. Das erhält schnelles Feedback zu geänderten Plugin für Reviews, ohne auf `main` einen zusätzlichen Blacksmith-Worker für Abdeckung zu reservieren, die bereits in `checks-node-extensions` vorhanden ist.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder derselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, es sei denn, der neueste Lauf für dieselbe Ref schlägt ebenfalls fehl. Aggregierte Shard-Checks verwenden `!cancelled() && always()`, damit sie normale Shard-Fehler weiterhin melden, aber nicht in die Queue kommen, nachdem der gesamte Workflow bereits ersetzt wurde.
Der CI-Concurrency-Key ist versioniert (`CI-v7-*`), damit ein zombiehafter GitHub-Eintrag in einer alten Queue-Gruppe neuere Main-Läufe nicht auf unbestimmte Zeit blockieren kann.

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Security-Jobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Prüfungen für protocol/contract/bundled, geshardete Channel-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregate, Verifier-Aggregate für Node-Tests, Docs-Prüfungen, Python-Skills, workflow-sanity, labeler, auto-response; der Preflight von install-smoke verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Queue gehen kann |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, Test-Shards für bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, das weiterhin so CPU-sensitiv ist, dass 8 vCPU teurer waren, als sie eingespart haben; install-smoke-Docker-Builds, bei denen die Queue-Zeit für 32 vCPU teurer war, als sie eingespart hat                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                               |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # den lokalen Changed-Lane-Klassifizierer für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderter Typecheck/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: Produktions-tsgo + geshardetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Timing pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Docs-Formatierung + Lint + Broken-Links
pnpm build          # dist bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
node scripts/ci-run-timings.mjs <run-id>  # Wall Time, Queue-Zeit und langsamste Jobs zusammenfassen
```
