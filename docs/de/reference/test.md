---
read_when:
    - Tests ausführen oder beheben
summary: Wie man Tests lokal ausführt (Vitest) und wann Force-/Coverage-Modi verwendet werden sollten
title: Tests
x-i18n:
    generated_at: "2026-04-21T06:31:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# Tests

- Vollständiges Test-Kit (Suites, Live, Docker): [Testen](/de/help/testing)

- `pnpm test:force`: Beendet jeden verbliebenen Gateway-Prozess, der den Standard-Control-Port hält, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt zurückgelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Coverage-Gate für geladene Unit-Dateien, keine repo-weite All-File-Coverage. Die Schwellenwerte sind 70 % für Zeilen/Funktionen/Statements und 55 % für Branches. Da `coverage.all` auf false steht, misst das Gate Dateien, die von der Unit-Coverage-Suite geladen wurden, statt jede Quelldatei aus gesplitteten Lanes als ungedeckt zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die sich seit `origin/main` geändert haben.
- `pnpm test:changed`: Erweitert geänderte Git-Pfade in abgegrenzte Vitest-Lanes, wenn der Diff nur routbare Quell-/Testdateien berührt. Änderungen an Konfiguration/Setup fallen weiterhin auf den nativen Root-Projects-Lauf zurück, sodass Änderungen an der Verdrahtung bei Bedarf breit erneut ausgeführt werden.
- `pnpm changed:lanes`: Zeigt die architektonischen Lanes an, die durch den Diff gegen `origin/main` ausgelöst werden.
- `pnpm check:changed`: Führt das intelligente Changed-Gate für den Diff gegen `origin/main` aus. Es führt Core-Arbeit mit Core-Test-Lanes aus, Extension-Arbeit mit Extension-Test-Lanes, reine Test-Arbeit nur mit Test-Typecheck/Tests und erweitert Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen auf die Validierung von Extensions.
- `pnpm test`: Leitet explizite Datei-/Verzeichnisziele durch abgegrenzte Vitest-Lanes. Läufe ohne Ziel verwenden feste Shard-Gruppen und erweitern zu Leaf-Configs für lokale parallele Ausführung; die Extension-Gruppe wird immer zu den Shard-Configs pro Extension erweitert statt in einen riesigen Root-Project-Prozess.
- Vollständige Läufe und Extension-Shard-Läufe aktualisieren lokale Zeitdaten in `.artifacts/vitest-shard-timings.json`; spätere Läufe verwenden diese Zeiten, um langsame und schnelle Shards auszubalancieren. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte Testdateien für `plugin-sdk` und `commands` werden jetzt durch dedizierte leichte Lanes geleitet, die nur `test/setup.ts` beibehalten, während laufzeitintensive Fälle auf ihren bestehenden Lanes bleiben.
- Ausgewählte Hilfsquell-Dateien für `plugin-sdk` und `commands` mappen `pnpm test:changed` ebenfalls auf explizite Geschwistertests in diesen leichten Lanes, damit kleine Helper-Änderungen nicht die schweren laufzeitgestützten Suites erneut ausführen.
- `auto-reply` ist jetzt ebenfalls in drei dedizierte Configs aufgeteilt (`core`, `top-level`, `reply`), sodass das Reply-Harness nicht die leichteren Top-Level-Tests für Status/Token/Helper dominiert.
- Die Basis-Vitest-Config verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner im gesamten Repo über die Configs hinweg aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Extension-/Plugin-Shards aus. Schwere Kanal-Extensions und OpenAI laufen als dedizierte Shards; andere Extension-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für die Lane eines einzelnen gebündelten Plugins.
- `pnpm test:perf:imports`: Aktiviert Vitest-Berichte zu Importdauer + Importaufschlüsselung und verwendet weiterhin abgegrenztes Lane-Routing für explizite Datei-/Verzeichnisziele.
- `pnpm test:perf:imports:changed`: Gleiches Import-Profiling, aber nur für Dateien, die sich seit `origin/main` geändert haben.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt den gerouteten Changed-Mode-Pfad gegen den nativen Root-Project-Lauf für denselben committeten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen Worktree-Änderungssatz, ohne zuerst zu committen.
- `pnpm test:perf:profile:main`: Schreibt ein CPU-Profil für den Vitest-Hauptthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Schreibt CPU- + Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt End-to-End-Smoke-Tests für das Gateway aus (Multi-Instance-WS/HTTP/Node-Pairing). Standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; anpassbar mit `OPENCLAW_E2E_WORKERS=<n>` und setzen Sie `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Live-Tests für Provider aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder provider-spezifisch `*_LIVE_TEST=1`), um das Überspringen aufzuheben.
- `pnpm test:docker:openwebui`: Startet Docker-basiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen nutzbaren Live-Modell-Schlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open-WebUI-Image und ist nicht dafür gedacht, so CI-stabil wie normale Unit-/E2E-Suites zu sein.
- `pnpm test:docker:mcp-channels`: Startet einen Gateway-Container mit Seeds und einen zweiten Client-Container, der `openclaw mcp serve` startet, und verifiziert dann geroutete Konversationserkennung, Transcript-Lesen, Attachment-Metadaten, Verhalten der Live-Ereigniswarteschlange, Routing ausgehender Sendungen und Claude-ähnliche Kanal- + Berechtigungsbenachrichtigungen über die echte stdio-Bridge. Die Claude-Benachrichtigungs-Assertion liest die rohen stdio-MCP-Frames direkt, sodass der Smoke das tatsächlich vom Bridge ausgegebene Verhalten abbildet.

## Lokales PR-Gate

Für lokale PR-Land-/Gate-Prüfungen ausführen:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host flakey ist, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie dann mit `pnpm test <path/to/test>`. Für Hosts mit knappen Speicherressourcen verwenden Sie:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Modell-Latenz-Benchmark (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: „Reply with a single word: ok. No punctuation or extra text.“

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax Median 1279 ms (min 1114, max 2431)
- opus Median 2454 ms (min 1224, max 3170)

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

Die Ausgabe enthält `sampleCount`, avg, p50, p95, min/max, Verteilung von Exit-Code/Signal und Zusammenfassungen des maximalen RSS für jeden Befehl. Optionales `--cpu-prof-dir` / `--heap-prof-dir` schreibt V8-Profile pro Lauf, sodass Timing- und Profil-Erfassung dasselbe Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Artefakt der vollständigen Suite nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
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

Dieses Skript steuert den interaktiven Assistenten über ein Pseudo-TTY, überprüft Konfigurations-/Workspace-/Sitzungsdateien, startet dann das Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass `qrcode-terminal` unter den unterstützten Docker-Node-Laufzeiten geladen wird (Node 24 als Standard, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```
