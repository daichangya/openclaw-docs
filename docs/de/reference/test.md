---
read_when:
    - Tests ausführen oder beheben
summary: Wie man Tests lokal ausführt (Vitest) und wann man Force-/Coverage-Modi verwenden sollte
title: Tests
x-i18n:
    generated_at: "2026-04-23T14:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Tests

- Vollständiges Test-Kit (Suiten, Live, Docker): [Testing](/de/help/testing)

- `pnpm test:force`: Beendet alle verbliebenen Gateway-Prozesse, die den Standard-Control-Port belegen, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt zurückgelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Unit-Coverage-Gate für geladene Dateien, keine All-File-Coverage für das gesamte Repo. Die Schwellenwerte sind 70 % Zeilen/Funktionen/Statements und 55 % Branches. Da `coverage.all` auf false gesetzt ist, misst das Gate Dateien, die von der Unit-Coverage-Suite geladen wurden, statt jede Quelldatei einer aufgeteilten Lane als nicht abgedeckt zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die seit `origin/main` geändert wurden.
- `pnpm test:changed`: erweitert geänderte Git-Pfade in eingegrenzte Vitest-Lanes, wenn der Diff nur routbare Quell-/Testdateien berührt. Änderungen an Konfiguration/Setup fallen weiterhin auf den nativen Root-Projects-Lauf zurück, damit Änderungen am Wiring bei Bedarf breit neu ausgeführt werden.
- `pnpm changed:lanes`: zeigt die architektonischen Lanes an, die durch den Diff gegen `origin/main` ausgelöst werden.
- `pnpm check:changed`: führt das intelligente Changed-Gate für den Diff gegen `origin/main` aus. Es führt Core-Arbeit mit Core-Test-Lanes, Extension-Arbeit mit Extension-Test-Lanes, reine Test-Arbeit nur mit Test-Typecheck/Tests aus, erweitert Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen auf Extension-Validierung und hält reine Versionsanhebungen in Release-Metadaten auf gezielten Prüfungen für Version/Konfiguration/Root-Abhängigkeiten.
- `pnpm test`: leitet explizite Datei-/Verzeichnisziele über eingegrenzte Vitest-Lanes. Nicht zielgerichtete Läufe verwenden feste Shard-Gruppen und erweitern auf Leaf-Konfigurationen für lokale parallele Ausführung; die Extension-Gruppe erweitert immer auf die Shard-Konfigurationen pro Extension statt auf einen riesigen Root-Project-Prozess.
- Vollständige und Extension-Shard-Läufe aktualisieren lokale Zeitdaten in `.artifacts/vitest-shard-timings.json`; spätere Läufe verwenden diese Zeiten, um langsame und schnelle Shards auszubalancieren. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte Testdateien aus `plugin-sdk` und `commands` werden jetzt über dedizierte leichte Lanes geroutet, die nur `test/setup.ts` beibehalten, während laufzeitschwere Fälle auf ihren bestehenden Lanes bleiben.
- Ausgewählte Helper-Quelldateien aus `plugin-sdk` und `commands` ordnen `pnpm test:changed` außerdem expliziten Nachbartests in diesen leichten Lanes zu, sodass kleine Helper-Bearbeitungen keine erneute Ausführung schwerer, laufzeitgestützter Suiten auslösen.
- `auto-reply` ist jetzt ebenfalls in drei dedizierte Konfigurationen aufgeteilt (`core`, `top-level`, `reply`), sodass das Reply-Harness die leichteren Top-Level-Tests für Status/Token/Helper nicht dominiert.
- Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, mit dem gemeinsamen nicht isolierten Runner, der repo-weit in den Konfigurationen aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Extension-/Plugin-Shards aus. Schwere Channel-Extensions und OpenAI laufen als dedizierte Shards; andere Extension-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für die Lane eines einzelnen gebündelten Plugins.
- `pnpm test:perf:imports`: aktiviert Reporting für Vitest-Importdauer + Import-Aufschlüsselung und verwendet weiterhin eingegrenztes Lane-Routing für explizite Datei-/Verzeichnisziele.
- `pnpm test:perf:imports:changed`: dasselbe Import-Profiling, aber nur für Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt den gerouteten Changed-Mode-Pfad gegen den nativen Root-Project-Lauf für denselben festgeschriebenen Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen Worktree-Änderungssatz, ohne ihn zuerst zu committen.
- `pnpm test:perf:profile:main`: schreibt ein CPU-Profil für den Vitest-Hauptthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schreibt CPU- + Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- Gateway-Integration: per Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (mehrere Instanzen, WS/HTTP/Node-Pairing). Verwendet standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; anpassen mit `OPENCLAW_E2E_WORKERS=<n>` und `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Provider-Live-Tests aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder providerspezifisches `*_LIVE_TEST=1`), um das Überspringen aufzuheben.
- `pnpm test:docker:all`: Baut das gemeinsame Live-Test-Image und das Docker-E2E-Image einmal und führt dann die Docker-Smoke-Lanes standardmäßig mit `OPENCLAW_SKIP_DOCKER_BUILD=1` bei Concurrency 4 aus. Anpassen mit `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Der Runner plant nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, sofern `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` nicht gesetzt ist, und jede Lane hat ein 120-Minuten-Timeout, überschreibbar mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Start- oder providerempfindliche Lanes laufen exklusiv nach dem parallelen Pool. Logs pro Lane werden unter `.artifacts/docker-tests/<run-id>/` geschrieben.
- `pnpm test:docker:openwebui`: Startet Dockerisiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen nutzbaren Live-Modell-Schlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open-WebUI-Image und ist nicht dafür gedacht, so CI-stabil wie die normalen Unit-/E2E-Suiten zu sein.
- `pnpm test:docker:mcp-channels`: Startet einen geseedeten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` ausführt, und verifiziert dann geroutete Konversations-Discovery, Transkript-Lesevorgänge, Attachment-Metadaten, Verhalten der Live-Ereignisqueue, Routing ausgehender Sendungen und channel- + berechtigungsbezogene Benachrichtigungen im Claude-Stil über die echte stdio-Bridge. Die Claude-Benachrichtigungs-Assertion liest die rohen stdio-MCP-Frames direkt, sodass der Smoke widerspiegelt, was die Bridge tatsächlich ausgibt.

## Lokales PR-Gate

Für lokale PR-Land/Gate-Prüfungen führen Sie Folgendes aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host flaky ist, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie dann mit `pnpm test <path/to/test>`. Für Hosts mit wenig Speicher verwenden Sie:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Modell-Latenz-Benchmark (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: „Reply with a single word: ok. No punctuation or extra text.“

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## CLI-Startup-Benchmark

Skript: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Verwendung:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: beide Presets

Die Ausgabe enthält `sampleCount`, avg, p50, p95, min/max, Verteilung von Exit-Code/Signal und Zusammenfassungen des max RSS für jeden Befehl. Optionales `--cpu-prof-dir` / `--heap-prof-dir` schreibt V8-Profile pro Lauf, sodass Timing und Profilerfassung denselben Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Artefakt der vollständigen Suite nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert das eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingechecktes Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit dem Fixture vergleichen mit `pnpm test:startup:bench:check`

## Onboarding-E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Cold-Start-Ablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Assistenten über ein Pseudo-TTY, verifiziert Dateien für Konfiguration/Workspace/Sitzung, startet dann das Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass `qrcode-terminal` unter den unterstützten Docker-Node-Laufzeiten geladen wird (Node 24 standardmäßig, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```
