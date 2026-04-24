---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht ausgeführt wurde
    - Sie debuggen fehlschlagende GitHub-Actions-Checks
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-24T06:30:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e24efec145ff144b007e248ef0f9c56287619eb9af204d45d49984909a6136b
    source_path: ci.md
    workflow: 15
---

Die CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

QA Lab hat dedizierte CI-Lanes außerhalb des smart gescopten Haupt-Workflows. Der
Workflow `Parity gate` läuft bei passenden PR-Änderungen und bei manuellem Dispatch; er
baut die private QA-Laufzeit und vergleicht die agentischen Packs für Mock GPT-5.4 und Opus 4.6.
Der Workflow `QA-Lab - All Lanes` läuft nachts auf `main` und bei
manuellem Dispatch; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane und die Live-
Telegram-Lane als parallele Jobs auf. Die Live-Jobs verwenden die Umgebung
`qa-live-shared`, und die Telegram-Lane verwendet Convex-Leases. `OpenClaw Release
Checks` führt dieselben QA-Lab-Lanes ebenfalls vor der Release-Freigabe aus.

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für
das Bereinigen von Duplikaten nach dem Landen. Er verwendet standardmäßig Dry-Run und schließt
nur ausdrücklich aufgeführte PRs, wenn `apply=true`. Bevor GitHub geändert wird,
prüft er, dass der gelandete PR gemergt ist und dass jeder Duplikat-PR entweder ein gemeinsames referenziertes Issue
oder überlappende geänderte Hunks hat.

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungslane, um
bestehende Dokumentation an kürzlich gelandete Änderungen anzupassen. Er hat keinen reinen Zeitplan:
Ein erfolgreicher CI-Lauf eines nicht von Bots stammenden Pushs auf `main` kann ihn auslösen,
und manueller Dispatch kann ihn direkt ausführen. Aufrufe über Workflow-Run werden übersprungen, wenn
`main` bereits weitergelaufen ist oder wenn in der letzten Stunde bereits ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde.
Wenn er läuft, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Source-SHA bis zum
aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Docs-Durchlauf
angesammelten Änderungen auf `main` abdecken kann.

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungslane
für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher CI-Lauf eines nicht von Bots stammenden Pushs auf
`main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Aufruf per Workflow-Run
gelaufen ist oder läuft. Manueller Dispatch umgeht diese tägliche Aktivitätsschranke.
Die Lane erstellt einen gruppierten Vitest-Leistungsbericht für die vollständige Suite, erlaubt Codex
nur kleine testleistungsbezogene Korrekturen mit Erhalt der Abdeckung statt umfangreicher Refactorings,
führt dann den Bericht für die vollständige Suite erneut aus und weist Änderungen zurück, die
die Anzahl der erfolgreich laufenden Baseline-Tests verringern. Wenn die Baseline fehlschlagende Tests hat, darf
Codex nur offensichtliche Fehler beheben, und der vollständige Suite-Bericht nach dem Agenten muss erfolgreich sein, bevor
irgendetwas committet wird. Wenn `main` weiterläuft, bevor der Bot-Push landet, rebased
die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut;
veraltete widersprüchliche Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-
Aktion dieselbe Drop-Sudo-Sicherheitsposition wie der Docs Agent beibehalten kann.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Job-Überblick

| Job                              | Zweck                                                                                        | Wann er läuft                        |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Nur-Doku-Änderungen, geänderte Scopes, geänderte Extensions erkennen und das CI-Manifest bauen | Immer bei Nicht-Draft-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                               | Immer bei Nicht-Draft-Pushes und PRs |
| `security-dependency-audit`      | Audit der produktionsrelevanten Lockfile ohne Abhängigkeiten gegen npm-Advisories           | Immer bei Nicht-Draft-Pushes und PRs |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Sicherheitsjobs                                   | Immer bei Nicht-Draft-Pushes und PRs |
| `build-artifacts`                | `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare nachgelagerte Artefakte bauen | Bei Node-relevanten Änderungen       |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Bundled-/Plugin-Contract-/Protokoll-Prüfungen         | Bei Node-relevanten Änderungen       |
| `checks-fast-contracts-channels` | Geshardete Kanal-Contract-Prüfungen mit stabilem aggregiertem Prüfergebnis                  | Bei Node-relevanten Änderungen       |
| `checks-node-extensions`         | Vollständige Test-Shards gebündelter Plugins über die gesamte Extension-Suite               | Bei Node-relevanten Änderungen       |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Kanal-, Bundled-, Contract- und Extension-Lanes                | Bei Node-relevanten Änderungen       |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten gebündelten Plugins                                | Pull Requests mit Extension-Änderungen |
| `check`                          | Geshardetes Äquivalent des lokalen Haupt-Gates: Prod-Typen, Lint, Guards, Test-Typen und strikter Smoke | Bei Node-relevanten Änderungen       |
| `check-additional`               | Architektur-, Boundary-, Extension-Surface-Guards, Package-Boundary und Gateway-Watch-Shards | Bei Node-relevanten Änderungen       |
| `build-smoke`                    | Smoke-Tests für gebaute CLI und Speicher-Smoke beim Start                                   | Bei Node-relevanten Änderungen       |
| `checks`                         | Verifier für Kanaltests mit gebauten Artefakten plus nur bei Pushes Node-22-Kompatibilität  | Bei Node-relevanten Änderungen       |
| `check-docs`                     | Doku-Formatierung, Lint und Broken-Link-Prüfungen                                           | Wenn Doku geändert wurde             |
| `skills-python`                  | Ruff + pytest für Python-basierte Skills                                                    | Bei Python-Skills-relevanten Änderungen |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                              | Bei Windows-relevanten Änderungen    |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten gebauten Artefakten                  | Bei macOS-relevanten Änderungen      |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                               | Bei macOS-relevanten Änderungen      |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                               | Bei Android-relevanten Änderungen    |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                | CI-Erfolg auf Main oder manueller Dispatch |

## Fail-Fast-Reihenfolge

Die Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure laufen:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, sodass nachgelagerte Konsumenten starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Laufzeit-Lanes fächern sich danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, das nur für PRs laufende `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik lebt in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Änderungen am CI-Workflow validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber nicht von sich aus Windows-, Android- oder macOS-Native-Builds; diese Plattform-Lanes bleiben auf Änderungen an plattformspezifischem Quellcode beschränkt.
Windows-Node-Prüfungen sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Helfer, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen begrenzt, die diese Lane ausführen; nicht zusammenhängende Source-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes, damit sie keinen Windows-Worker mit 16 vCPUs für Abdeckung reservieren, die bereits durch die normalen Test-Shards ausgeübt wird.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf. Pull Requests führen den schnellen Pfad für Docker-/Package-Oberflächen, Package-/Manifest-Änderungen gebündelter Plugins und Core-Plugin-/Kanal-/Gateway-/Plugin-SDK-Oberflächen aus, die von den Docker-Smoke-Jobs verwendet werden. Reine Source-Änderungen an gebündelten Plugins, reine Teständerungen und reine Doku-Änderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Arg einer gebündelten Extension und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem Befehls-Timeout von 120 Sekunden aus. Der vollständige Pfad behält QR-Package-Install sowie Installer-Docker-/Update-Abdeckung für nächtliche geplante Läufe, manuelle Dispatches, Release-Prüfungen per Workflow-Call und Pull Requests bei, die tatsächlich Installer-/Package-/Docker-Oberflächen berühren. Pushes nach `main`, einschließlich Merge-Commits, erzwingen nicht den vollständigen Pfad; wenn die Logik des Changed-Scope bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung. Der langsame Smoke für globalen Bun-Install des Image-Providers wird separat durch `run_bun_global_install_smoke` gegatet; er läuft im nächtlichen Zeitplan und aus dem Workflow für Release-Checks, und manuelle `install-smoke`-Dispatches können ihn optional einschließen, aber Pull Requests und Pushes nach `main` führen ihn nicht aus. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles. Lokal baut `test:docker:all` ein gemeinsames Live-Test-Image und ein gemeinsames Built-App-Image aus `scripts/e2e/Dockerfile` vor und führt dann die Live-/E2E-Smoke-Lanes parallel mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus; stimmen Sie die standardmäßige Parallelität des Main-Pools von 8 mit `OPENCLAW_DOCKER_ALL_PARALLELISM` und die standardmäßige Parallelität des provider-sensitiven Tail-Pools von 8 mit `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` ab. Das lokale Aggregat plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, und jede Lane hat ein Timeout von 120 Minuten, überschreibbar mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Der wiederverwendbare Live-/E2E-Workflow spiegelt das Muster gemeinsamer Images, indem er vor der Docker-Matrix ein SHA-getaggtes GHCR-Docker-E2E-Image baut und pusht und dann die Matrix mit `OPENCLAW_SKIP_DOCKER_BUILD=1` ausführt. Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus. Die vollständige Matrix für Updates/Kanäle gebündelter Plugins bleibt manuell bzw. Full-Suite, weil sie wiederholte echte npm-Update- und Doctor-Repair-Durchläufe ausführt.

Die Logik geänderter Lanes für lokale Läufe lebt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist hinsichtlich Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an der Core-Produktion führen Core-Prod-Typecheck plus Core-Tests aus, reine Core-Teständerungen führen nur Core-Test-Typecheck/Tests aus, Änderungen an der Extension-Produktion führen Extension-Prod-Typecheck plus Extension-Tests aus, und reine Extension-Teständerungen führen nur Extension-Test-Typecheck/Tests aus. Änderungen am öffentlichen Plugin SDK oder an Plugin-Contracts erweitern auf Extension-Validierung, weil Extensions von diesen Core-Contracts abhängen. Reine Versionssprünge in Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten aus. Unbekannte Root-/Konfigurationsänderungen schlagen sicherheitshalber auf alle Lanes durch.

Bei Pushes fügt die Matrix `checks` die nur bei Pushes laufende Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen und die Matrix bleibt auf die normalen Test-/Kanal-Lanes fokussiert.

Die langsamsten Node-Testfamilien werden aufgeteilt oder ausbalanciert, sodass jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Kanal-Contracts laufen als drei gewichtete Shards, Tests für gebündelte Plugins werden über sechs Extension-Worker ausbalanciert, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als drei ausbalancierte Worker statt sechs winziger Worker, und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden source-only agentischen Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Umfangreiche Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Catch-all für Plugins. Extension-Shard-Jobs führen Plugin-Konfigurationsgruppen seriell mit einem Vitest-Worker und einem größeren Node-Heap aus, damit importlastige Plugin-Batches kleine CI-Runner nicht überbelegen. Die breite Agents-Lane verwendet den gemeinsamen dateiparallelen Vitest-Scheduler, weil sie eher von Importen/Planung dominiert wird als von einer einzelnen langsamen Testdatei. `runtime-config` läuft mit dem Infra-Core-Runtime-Shard, damit das gemeinsame Runtime-Shard nicht das Tail übernimmt. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Laufzeit-Topologie-Architektur von Gateway-Watch-Abdeckung; das Boundary-Guard-Shard führt seine kleinen unabhängigen Guards parallel innerhalb eines Jobs aus. Gateway-Watch, Kanaltests und das Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden, behalten ihre alten Check-Namen als leichtgewichtige Verifier-Jobs bei und vermeiden dabei zwei zusätzliche Blacksmith-Worker und eine zweite Queue für Artefakt-Konsumenten.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source-Set oder Manifest; seine Unit-Test-Lane kompiliert diesen Flavor dennoch mit den BuildConfig-Flags für SMS/Anrufprotokoll, vermeidet dabei aber einen doppelten Debug-APK-Packaging-Job bei jedem Android-relevanten Push.
`extension-fast` ist nur für PRs vorgesehen, weil Push-Läufe bereits die vollständigen Shards für gebündelte Plugins ausführen. Das hält das Feedback zu geänderten Plugins für Reviews aufrecht, ohne auf `main` einen zusätzlichen Blacksmith-Worker für Abdeckung zu reservieren, die bereits in `checks-node-extensions` vorhanden ist.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR oder derselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, es sei denn, der neueste Lauf für dieselbe Ref schlägt ebenfalls fehl. Aggregierte Shard-Checks verwenden `!cancelled() && always()`, sodass sie weiterhin normale Shard-Fehler melden, aber nicht mehr in die Queue kommen, nachdem der gesamte Workflow bereits ersetzt wurde.
Der CI-Concurrency-Key ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann.

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Contract-/Bundled-Prüfungen, geshardete Kanal-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Shards und Aggregate, Aggregate-Verifier für Node-Tests, Doku-Prüfungen, Python-Skills, workflow-sanity, labeler, auto-response; das `install-smoke`-Preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Queue gehen kann |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, das weiterhin so CPU-sensitiv ist, dass 8 vCPU mehr kosten als sparen; `install-smoke`-Docker-Builds, bei denen die Queue-Zeit für 32 vCPU mehr kostete als sie sparte                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                          |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # den lokalen Klassifizierer für geänderte Lanes für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderter Typecheck/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: Produktions-tsgo + geshardetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Zeitmessungen pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Doku-Format + Lint + Broken Links
pnpm build          # `dist` bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
node scripts/ci-run-timings.mjs <run-id>      # Wall Time, Queue Time und langsamste Jobs zusammenfassen
node scripts/ci-run-timings.mjs --recent 10   # aktuelle erfolgreiche Main-CI-Läufe vergleichen
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Verwandt

- [Installationsübersicht](/de/install)
- [Release-Kanäle](/de/install/development-channels)
