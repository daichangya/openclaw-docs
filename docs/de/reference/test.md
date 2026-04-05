---
read_when:
    - Beim Ausführen oder Beheben von Tests
summary: Wie Tests lokal ausgeführt werden (vitest) und wann Force-/Coverage-Modi verwendet werden sollten
title: Tests
x-i18n:
    generated_at: "2026-04-05T12:55:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# Tests

- Vollständiges Test-Kit (Suites, Live, Docker): [Testing](/de/help/testing)

- `pnpm test:force`: Beendet alle noch laufenden Gateway-Prozesse, die den Standard-Control-Port belegen, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt zurückgelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Globale Schwellenwerte sind 70 % für Zeilen/Branches/Funktionen/Statements. Coverage schließt integrationslastige Einstiegspunkte aus (CLI-Wiring, Gateway-/Telegram-Bridges, statischer Server für Webchat), damit das Ziel auf unit-testbare Logik fokussiert bleibt.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die seit `origin/main` geändert wurden.
- `pnpm test:changed`: führt die native Vitest-Projektkonfiguration mit `--changed origin/main` aus. Die Basiskonfiguration behandelt die Projekt-/Konfigurationsdateien als `forceRerunTriggers`, sodass Änderungen am Wiring bei Bedarf weiterhin breit neu ausgeführt werden.
- `pnpm test`: führt die native Root-Projektkonfiguration von Vitest direkt aus. Dateifilter funktionieren nativ über die konfigurierten Projekte hinweg.
- Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner über die Repo-Konfigurationen hinweg aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` führt `vitest.extensions.config.ts` aus.
- `pnpm test:extensions`: führt Erweiterungs-/Plugin-Suites aus.
- `pnpm test:perf:imports`: aktiviert Berichte zu Vitest-Importdauer und Importaufschlüsselung für den nativen Root-Projektlauf.
- `pnpm test:perf:imports:changed`: dasselbe Import-Profiling, aber nur für Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:profile:main`: schreibt ein CPU-Profil für den Vitest-Hauptthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance-WS/HTTP/Node-Pairing). Verwendet standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; anpassbar mit `OPENCLAW_E2E_WORKERS=<n>` und `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Live-Tests für Provider aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder providerspezifisch `*_LIVE_TEST=1`), um sie nicht zu überspringen.
- `pnpm test:docker:openwebui`: Startet Dockerisiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen nutzbaren Live-Modellschlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open WebUI-Image und ist nicht dafür gedacht, CI-stabil wie die normalen Unit-/E2E-Suites zu sein.
- `pnpm test:docker:mcp-channels`: Startet einen vorbefüllten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` ausführt, und überprüft dann das geroutete Erkennen von Unterhaltungen, das Lesen von Transkripten, Metadaten von Anhängen, das Verhalten der Live-Event-Queue, ausgehendes Send-Routing und Claude-artige Kanal- und Berechtigungsbenachrichtigungen über die echte stdio-Bridge. Die Claude-Benachrichtigungsprüfung liest die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test widerspiegelt, was die Bridge tatsächlich ausgibt.

## Lokales PR-Gate

Führen Sie für lokale PR-Land/Gate-Prüfungen Folgendes aus:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host flakey ist, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie dann mit `pnpm test <path/to/test>`. Für Hosts mit begrenztem Speicher verwenden Sie:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Modell-Latenz-Benchmark (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Umgebungsvariablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: „Antworten Sie mit einem einzelnen Wort: ok. Keine Satzzeichen oder zusätzlicher Text.“

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax Median 1279 ms (min. 1114, max. 2431)
- opus Median 2454 ms (min. 1224, max. 3170)

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

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, min./max., Exit-Code-/Signalverteilung und Zusammenfassungen des maximalen RSS für jeden Befehl. Optionales `--cpu-prof-dir` / `--heap-prof-dir` schreibt V8-Profile pro Lauf, sodass Timing und Profilerfassung denselben Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Artefakt der vollständigen Suite nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert die eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingecheckte Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit der Fixture vergleichen über `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Cold-Start-Ablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Wizard über ein Pseudo-TTY, überprüft Konfigurations-/Workspace-/Session-Dateien, startet dann das Gateway und führt `openclaw health` aus.

## QR-Import-Smoketest (Docker)

Stellt sicher, dass `qrcode-terminal` unter den unterstützten Docker-Node-Laufzeiten geladen wird (Node 24 standardmäßig, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```
