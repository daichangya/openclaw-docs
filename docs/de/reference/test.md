---
read_when:
    - Tests ausführen oder beheben
summary: Wie man Tests lokal ausführt (Vitest) und wann Force-/Coverage-Modi verwendet werden sollten
title: Tests
x-i18n:
    generated_at: "2026-04-24T06:59:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4ad5808ddbc06c704c9bcf9f780b06f9be94ac213ed22e79d880dedcaa6d3b
    source_path: reference/test.md
    workflow: 15
---

- Vollständiges Testing-Kit (Suites, Live, Docker): [Testing](/de/help/testing)

- `pnpm test:force`: Beendet jeden hängen gebliebenen Gateway-Prozess, der den Standard-Control-Port belegt, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, sodass Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt zurückgelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Gate für Unit-Coverage geladener Dateien, nicht Whole-Repo-All-File-Coverage. Die Schwellenwerte sind 70 % für Lines/Functions/Statements und 55 % für Branches. Da `coverage.all` auf false gesetzt ist, misst das Gate Dateien, die von der Unit-Coverage-Suite geladen wurden, statt jede Quell-Datei aus aufgesplitteten Lanes als nicht abgedeckt zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für seit `origin/main` geänderte Dateien aus.
- `pnpm test:changed`: Erweitert geänderte Git-Pfade zu bereichsbezogenen Vitest-Lanes, wenn der Diff nur routbare Quell-/Testdateien betrifft. Änderungen an Konfiguration/Setup fallen weiterhin auf den nativen Root-Projects-Run zurück, damit Änderungen an der Verkabelung bei Bedarf breit erneut ausgeführt werden.
- `pnpm changed:lanes`: Zeigt die Architektur-Lanes an, die durch den Diff gegenüber `origin/main` ausgelöst werden.
- `pnpm check:changed`: Führt das intelligente Changed-Gate für den Diff gegenüber `origin/main` aus. Es führt Core-Arbeit mit Core-Test-Lanes aus, Extension-Arbeit mit Extension-Test-Lanes, test-only-Arbeit nur mit Test-Typecheck/Tests, erweitert Änderungen am öffentlichen Plugin SDK oder am Plugin-Vertrag auf einen Extension-Validierungsdurchlauf und hält release-metadatenbezogene Versions-Bumps auf gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten beschränkt.
- `pnpm test`: Leitet explizite Datei-/Verzeichnisziele über bereichsbezogene Vitest-Lanes. Läufe ohne Ziel verwenden feste Shard-Gruppen und erweitern sich zu Leaf-Konfigurationen für lokale parallele Ausführung; die Extension-Gruppe erweitert sich immer zu den Shard-Konfigurationen pro Extension statt zu einem riesigen Root-Project-Prozess.
- Vollständige Läufe und Läufe mit Extension-Shards aktualisieren lokale Zeitdaten in `.artifacts/vitest-shard-timings.json`; spätere Läufe verwenden diese Zeiten, um langsame und schnelle Shards auszugleichen. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte Testdateien in `plugin-sdk` und `commands` werden jetzt über dedizierte leichte Lanes geroutet, die nur `test/setup.ts` beibehalten; runtime-schwere Fälle bleiben auf ihren bestehenden Lanes.
- Ausgewählte Hilfs-Quelldateien in `plugin-sdk` und `commands` ordnen `pnpm test:changed` nun ebenfalls expliziten benachbarten Tests in diesen leichten Lanes zu, sodass kleine Änderungen an Hilfsfunktionen vermeiden, die schweren runtime-gestützten Suites erneut auszuführen.
- `auto-reply` ist jetzt ebenfalls in drei dedizierte Konfigurationen aufgeteilt (`core`, `top-level`, `reply`), sodass das Reply-Harness nicht die leichteren Top-Level-Status-/Token-/Helper-Tests dominiert.
- Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner über die Repo-Konfigurationen hinweg aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Extension-/Plugin-Shards aus. Schwere Kanal-Plugins, das Browser-Plugin und OpenAI laufen als dedizierte Shards; andere Plugin-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für die Lane eines einzelnen gebündelten Plugins.
- `pnpm test:perf:imports`: Aktiviert Reporting für Vitest-Importdauer + Importaufschlüsselung, verwendet aber weiterhin bereichsbezogenes Lane-Routing für explizite Datei-/Verzeichnisziele.
- `pnpm test:perf:imports:changed`: Dasselbe Import-Profiling, aber nur für seit `origin/main` geänderte Dateien.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt den gerouteten Changed-Mode-Pfad gegen den nativen Root-Project-Run für denselben committeten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen Worktree-Änderungssatz, ohne vorher zu committen.
- `pnpm test:perf:profile:main`: Schreibt ein CPU-Profil für den Vitest-Main-Thread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Schreibt CPU- + Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Führt jede Vitest-Leaf-Konfiguration der Full-Suite seriell aus und schreibt gruppierte Laufzeitdaten plus JSON-/Log-Artefakte pro Konfiguration. Der Test Performance Agent verwendet dies als Baseline, bevor er versucht, langsame Tests zu beheben.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: Vergleicht gruppierte Berichte nach einer performanceorientierten Änderung.
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt End-to-End-Smoke-Tests für das Gateway aus (Multi-Instance WS/HTTP/Node-Pairing). Verwendet standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; anpassbar mit `OPENCLAW_E2E_WORKERS=<n>` und `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Provider-Live-Tests aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder providerspezifisch `*_LIVE_TEST=1`), damit sie nicht übersprungen werden.
- `pnpm test:docker:all`: Baut das gemeinsame Image für Live-Tests und das Docker-E2E-Image einmal, führt dann die Docker-Smoke-Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus, standardmäßig mit Parallelität 8. Stimmen Sie den Haupt-Pool mit `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` und den providersensiblen Tail-Pool mit `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ab; beide sind standardmäßig 8. Der Runner plant nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, außer wenn `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` gesetzt ist, und jede Lane hat ein Timeout von 120 Minuten, überschreibbar mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Logs pro Lane werden unter `.artifacts/docker-tests/<run-id>/` geschrieben.
- `pnpm test:docker:openwebui`: Startet Dockerisiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen nutzbaren Live-Modell-Schlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open-WebUI-Image und ist nicht darauf ausgelegt, so CI-stabil wie die normalen Unit-/E2E-Suites zu sein.
- `pnpm test:docker:mcp-channels`: Startet einen vorbereiteten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` startet, und verifiziert dann Discovery gerouteter Unterhaltungen, Lesen von Transkripten, Anhangsmetadaten, Verhalten der Live-Event-Queue, Routing ausgehender Sendungen und Claude-artige Kanal- + Berechtigungsbenachrichtigungen über die echte stdio-Bridge. Die Claude-Benachrichtigungs-Assertion liest die rohen stdio-MCP-Frames direkt, sodass der Smoke das widerspiegelt, was die Bridge tatsächlich ausgibt.

## Lokales PR-Gate

Für lokale PR-Land-/Gate-Prüfungen führen Sie aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem stark belasteten Host flaky ist, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie dann mit `pnpm test <path/to/test>`. Für Hosts mit wenig Arbeitsspeicher verwenden Sie:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark für Modelllatenz (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Env-Variablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: “Reply with a single word: ok. No punctuation or extra text.”

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## Benchmark für CLI-Startzeit

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

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, min/max, Verteilung von Exit-Code/Signal und Zusammenfassungen des maximalen RSS für jeden Befehl. Optionale `--cpu-prof-dir` / `--heap-prof-dir` schreiben V8-Profile pro Lauf, sodass Timing und Profilerfassung dasselbe Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Full-Suite-Artefakt nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert die eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingecheckte Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit der Fixture vergleichen mit `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Cold-Start-Ablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Assistenten über ein Pseudo-TTY, prüft Konfigurations-/Workspace-/Sitzungsdateien, startet dann das Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass der gepflegte QR-Runtime-Helfer unter den unterstützten Docker-Node-Laufzeiten lädt (Node 24 Standard, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Verwandt

- [Testing](/de/help/testing)
- [Testing live](/de/help/testing-live)
