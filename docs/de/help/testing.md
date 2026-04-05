---
read_when:
    - Ausführen von Tests lokal oder in CI
    - Hinzufügen von Regressionen für Modell-/Provider-Fehler
    - Fehlerbehebung bei Gateway- und Agentenverhalten
summary: 'Test-Toolkit: Unit-/E2E-/Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Tests
x-i18n:
    generated_at: "2026-04-05T12:47:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854a39ae261d8749b8d8d82097b97a7c52cf2216d1fe622e302d830a888866ab
    source_path: help/testing.md
    workflow: 15
---

# Tests

OpenClaw hat drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Gruppe von Docker-Runnern.

Diese Dokumentation ist ein Leitfaden zu „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt)
- Welche Befehle für gängige Abläufe ausgeführt werden sollten (lokal, vor dem Push, Debugging)
- Wie Live-Tests Anmeldedaten erkennen und Modelle/Provider auswählen
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm test`
- Schnellere lokale Ausführung der gesamten Suite auf einem leistungsfähigen Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife (modernes Projekts-Config): `pnpm test:watch`
- Direktes Dateitargeting leitet jetzt auch Erweiterungs-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Wenn Sie Tests berühren oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen realer Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine einzelne Live-Datei gezielt und ruhig ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tipp: Wenn Sie nur einen einzelnen fehlschlagenden Fall benötigen, grenzen Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Env-Variablen ein.

## Test-Suites (was wo läuft)

Betrachten Sie die Suites als „zunehmenden Realismus“ (und zunehmende Instabilität/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: natives Vitest-`projects` über `vitest.config.ts`
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` sowie die auf der Allowlist stehenden `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
- Hinweis zu Projekten:
  - `pnpm test`, `pnpm test:watch` und `pnpm test:changed` verwenden jetzt alle dieselbe native Vitest-Root-`projects`-Konfiguration.
  - Direkte Dateifilter laufen nativ durch den Root-Projektgraphen, daher funktioniert `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ohne benutzerdefinierten Wrapper.
- Hinweis zum Embedded-Runner:
  - Wenn Sie Discovery-Eingaben des Message-Tools oder den Runtime-Kontext der Kompaktierung ändern,
    halten Sie beide Ebenen der Abdeckung aufrecht.
  - Fügen Sie fokussierte Helper-Regressionen für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halten Sie außerdem die Embedded-Runner-Integrationssuites gesund:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suites verifizieren, dass bereichsbezogene IDs und das Verhalten der Kompaktierung weiterhin
    durch die realen Pfade `run.ts` / `compact.ts` fließen; Helper-only-Tests sind kein
    ausreichender Ersatz für diese Integrationspfade.
- Hinweis zum Pool:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration setzt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner über Root-Projekte, E2E- und Live-Konfigurationen hinweg.
  - Die Root-UI-Lane behält ihre `jsdom`-Einrichtung und Optimierung bei, läuft jetzt aber ebenfalls auf dem gemeinsam genutzten nicht isolierten Runner.
  - `pnpm test` übernimmt dieselben Standardwerte `threads` + `isolate: false` aus der Root-`projects`-Konfiguration in `vitest.config.ts`.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt jetzt standardmäßig auch `--no-maglev` für Vitest-Child-Node-Prozesse hinzu, um V8-Kompilierchurn bei großen lokalen Läufen zu verringern. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn Sie gegen das Standardverhalten von V8 vergleichen müssen.
- Hinweis zur schnellen lokalen Iteration:
  - `pnpm test:changed` führt die native `projects`-Konfiguration mit `--changed origin/main` aus.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dieselbe native `projects`-Konfiguration bei, nur mit einem höheren Worker-Limit.
  - Die automatische lokale Worker-Skalierung ist jetzt bewusst konservativ und fährt auch zurück, wenn die Load Average des Hosts bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert die Projekt-/Konfigurationsdateien als `forceRerunTriggers`, sodass erneute Läufe im Changed-Modus korrekt bleiben, wenn sich die Testverdrahtung ändert.
  - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Ort für direktes Profiling möchten.
- Hinweis zum Performance-Debugging:
  - `pnpm test:perf:imports` aktiviert die Berichterstattung über Vitest-Importdauer sowie eine Aufschlüsselung der Importe.
  - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Sicht auf Dateien, die sich seit `origin/main` geändert haben.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Hauptthreads für Vitest/Vite-Start- und Transform-Overhead.
  - `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile des Runners für die Unit-Suite bei deaktivierter Dateiparallelisierung.

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Runtime-Standardeinstellungen:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im stillen Modus, um den Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Anzahl der Worker zu erzwingen (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten mit mehreren Gateway-Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwereres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `test/openshell-sandbox.e2e.test.ts`
- Umfang:
  - Startet über Docker ein isoliertes OpenShell-Gateway auf dem Host
  - Erstellt aus einem temporären lokalen Dockerfile eine Sandbox
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Exec
  - Verifiziert das Remote-Canonical-Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur opt-in; kein Teil des Standardlaufs `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI und einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME`, zerstört dann das Test-Gateway und die Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test beim manuellen Ausführen der breiteren E2E-Suite zu aktivieren
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript zu verweisen

### Live (reale Provider + reale Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Anmeldedaten?“
  - Erkennt Änderungen im Provider-Format, Tool-Calling-Eigenheiten, Auth-Probleme und Verhalten bei Rate Limits
- Erwartungen:
  - Von Natur aus nicht CI-stabil (reale Netzwerke, reale Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Bevorzugen Sie eingegrenzte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel zu übernehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, sodass Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests bewusst Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Es behält die Fortschrittsausgabe `[live] ...` bei, unterdrückt jedoch den zusätzlichen Hinweis zu `~/.profile` und schaltet Gateway-Bootstrap-Logs/Bonjour-Chattern stumm. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Start-Logs zurück möchten.
- API-Key-Rotation (providerspezifisch): setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder pro Live-Überschreibung `OPENCLAW_LIVE_*_KEY`; Tests versuchen bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen auf stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, auch wenn die Vitest-Konsolenerfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert die Vitest-Konsolenabfangung, sodass Provider-/Gateway-Fortschrittszeilen während Live-Läufen sofort gestreamt werden.
  - Konfigurieren Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Konfigurieren Sie Heartbeats für Gateway/Probe mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welche Suite soll ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Networking / WS-Protokoll / Pairing anfassen: zusätzlich `pnpm test:e2e`
- „Mein Bot ist down“ / providerspezifische Fehler / Tool Calling debuggen: einen eingegrenzten `pnpm test:live` ausführen

## Live: Android-Node-Capability-Sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell beworbenen Befehl** eines verbundenen Android-Nodes aufrufen und das Vertragsverhalten des Befehls bestätigen.
- Umfang:
  - Vorgegebene/manuelle Einrichtung (die Suite installiert/startet/paart die App nicht).
  - Gateway-`node.invoke`-Validierung Befehl für Befehl für den ausgewählten Android-Node.
- Erforderliche Vorab-Einrichtung:
  - Android-App ist bereits mit dem Gateway verbunden und gepaart.
  - App bleibt im Vordergrund.
  - Berechtigungen/Erfassungszustimmung sind für die Fähigkeiten erteilt, die Sie erfolgreich erwarten.
- Optionale Zielüberschreibungen:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Android-Einrichtungsdetails: [Android App](/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, sodass Fehler isoliert werden können:

- „Direktes Modell“ sagt uns, ob der Provider/das Modell mit dem gegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke“ sagt uns, ob die vollständige Gateway+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modell-Completion (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle enumerieren
  - Mit `getApiKeyForModel` Modelle auswählen, für die Sie Anmeldedaten haben
  - Pro Modell eine kleine Completion ausführen (und bei Bedarf gezielte Regressionen)
- So aktivieren Sie es:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- So wählen Sie Modelle aus:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (Komma-Allowlist)
- So wählen Sie Provider aus:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (Komma-Allowlist)
- Woher Schlüssel stammen:
  - Standardmäßig: Profilspeicher und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur den Profilspeicher** zu erzwingen
- Warum das existiert:
  - Trennt „Provider-API ist kaputt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI-Responses/Codex-Responses-Reasoning-Replay + Tool-Call-Flows)

### Ebene 2: Gateway + Dev-Agent-Smoke (was "@openclaw" tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway hochfahren
  - Eine `agent:dev:*`-Sitzung erstellen/patchen (Modellüberschreibung pro Lauf)
  - Modelle mit Schlüsseln durchlaufen und Folgendes bestätigen:
    - „sinnvolle“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Probe-Details (damit Sie Fehler schnell erklären können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agenten auf, sie zu `read`en und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agenten auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann wieder zu `read`en.
  - Bild-Probe: Der Test hängt ein generiertes PNG an (Katze + randomisierter Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- So aktivieren Sie es:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- So wählen Sie Modelle aus:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder Komma-Liste), um einzugrenzen
- So wählen Sie Provider aus (vermeiden Sie „alles über OpenRouter“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (Komma-Allowlist)
- Tool- und Bild-Probes sind in diesem Live-Test immer aktiviert:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Bild-Probe läuft, wenn das Modell Unterstützung für Bildeingaben bewirbt
  - Ablauf (vereinfacht):
    - Test erzeugt ein winziges PNG mit „CAT“ + Zufallscode (`src/gateway/live-image-probe.ts`)
    - Sendet es über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded-Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Assertion: Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler sind erlaubt)

Tipp: Um zu sehen, was Sie auf Ihrem Rechner testen können (und die genauen `provider/model`-IDs), führen Sie Folgendes aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude CLI oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway- + Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu berühren.
- Aktivieren:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardwerte:
  - Modell: `claude-cli/claude-sonnet-4-6`
  - Befehl: `claude`
  - Args: `["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]`
- Überschreibungen (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Args statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bild-Args übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Flow zu validieren.
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`, um die Claude-CLI-MCP-Konfiguration aktiviert zu lassen (standardmäßig wird eine temporäre strikte leere `--mcp-config` injiziert, damit ambient/globale MCP-Server während des Smokes deaktiviert bleiben).

Beispiel:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker-Rezept:

```bash
pnpm test:docker:live-cli-backend
```

Hinweise:

- Der Docker-Runner befindet sich unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den Live-CLI-Backend-Smoke innerhalb des Repo-Docker-Images als Nicht-Root-Benutzer `node` aus, weil Claude CLI `bypassPermissions` ablehnt, wenn es als Root aufgerufen wird.
- Für `claude-cli` installiert er das Linux-Paket `@anthropic-ai/claude-code` in ein zwischengespeichertes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- Für `claude-cli` injiziert der Live-Smoke eine strikte leere MCP-Konfiguration, sofern Sie nicht `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` setzen.
- Er kopiert `~/.claude` in den Container, wenn vorhanden; auf Rechnern, bei denen Claude-Auth durch `ANTHROPIC_API_KEY` gestützt wird, bewahrt er jedoch auch `ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY_OLD` für die Child-Claude-CLI über `OPENCLAW_LIVE_CLI_BACKEND_PRESERVE_ENV`.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den realen ACP-Conversational-Bind-Flow mit einem Live-ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - ein synthetisches Message-Channel-Gespräch direkt vor Ort binden
  - auf genau demselben Gespräch ein normales Follow-up senden
  - verifizieren, dass das Follow-up im Transkript der gebundenen ACP-Sitzung landet
- Aktivieren:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agent: `claude`
  - Synthetischer Kanal: Slack-DM-artiger Gesprächskontext
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=/full/path/to/acpx`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit nur für Admins bestimmten synthetischen Feldern der Ursprungsroute, sodass Tests den Kontext von Message-Kanälen anhängen können, ohne eine externe Zustellung vorzutäuschen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND` nicht gesetzt ist, verwendet der Test den konfigurierten/gebündelten `acpx`-Befehl. Wenn Ihre Harness-Auth von Env-Variablen aus `~/.profile` abhängt, bevorzugen Sie einen benutzerdefinierten `acpx`-Befehl, der Provider-Env beibehält.

Beispiel:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker-Rezept:

```bash
pnpm test:docker:live-acp-bind
```

Hinweise zu Docker:

- Der Docker-Runner befindet sich unter `scripts/test-live-acp-bind-docker.sh`.
- Er sourct `~/.profile`, kopiert das passende CLI-Auth-Home (`~/.claude` oder `~/.codex`) in den Container, installiert `acpx` in ein beschreibbares npm-Präfix und installiert dann die angeforderte Live-CLI (`@anthropic-ai/claude-code` oder `@openai/codex`), falls sie fehlt.
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit `acpx` Provider-Env-Variablen aus dem gesourcten Profil auch für die Child-Harness-CLI verfügbar hält.

### Empfohlene Live-Rezepte

Schmale, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool Calling über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Hinweise:

- `google/...` verwendet die Gemini API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-artiger Agent-Endpunkt).
- `google-gemini-cli/...` verwendet die lokale Gemini CLI auf Ihrem Rechner (separate Auth + Tooling-Eigenheiten).
- Gemini API vs Gemini CLI:
  - API: OpenClaw ruft die gehostete Gemini-API von Google über HTTP auf (API-Key / Profil-Auth); das ist meist gemeint, wenn Nutzer von „Gemini“ sprechen.
  - CLI: OpenClaw shellt zu einer lokalen `gemini`-Binärdatei aus; sie hat ihre eigene Authentifizierung und kann sich anders verhalten (Streaming/Tool-Support/Versionsabweichung).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist opt-in), aber dies sind die **empfohlenen** Modelle, die auf einem Entwicklerrechner mit Schlüsseln regelmäßig abgedeckt werden sollten.

### Modernes Smoke-Set (Tool Calling + Bild)

Dies ist der „gängige Modelle“-Lauf, den wir funktionsfähig halten wollen:

- OpenAI (nicht-Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool Calling (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder die neueste verfügbare Variante)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell aus, das Sie aktiviert haben)
- Cerebras: `cerebras/`… (wenn Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool Calling hängt vom API-Modus ab)

### Vision: Bild senden (Anhang → multimodale Nachricht)

Nehmen Sie mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude-/Gemini-/OpenAI-Varianten mit Vision-Unterstützung usw.), um die Bild-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie aktivierte Schlüssel haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (Hunderte Modelle; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Bildfähigkeit zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Anmeldedaten/Konfiguration haben):

- Integriert: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuchen Sie nicht, in der Dokumentation „alle Modelle“ fest zu kodieren. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrem Rechner zurückgibt + welche Schlüssel verfügbar sind.

## Anmeldedaten (niemals committen)

Live-Tests erkennen Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „keine Anmeldedaten“ meldet, debuggen Sie auf dieselbe Weise wie bei `openclaw models list` / Modellauswahl.

- Pro-Agent-Auth-Profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist mit „Profilschlüssel“ in den Live-Tests gemeint)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-Statusverzeichnis: `~/.openclaw/credentials/` (wird in das vorbereitete Live-Test-Home kopiert, wenn vorhanden, ist aber nicht der Hauptspeicher für Profilschlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, pro-Agent-`auth-profiles.json`-Dateien, Legacy-`credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; Pfadüberschreibungen `agents.*.workspace` / `agentDir` werden in dieser vorbereiteten Konfiguration entfernt, damit Probes nicht in Ihrem echten Host-Workspace laufen.

Wenn Sie sich auf Env-Schlüssel verlassen möchten (z. B. in `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus oder verwenden Sie die Docker-Runner unten (sie können `~/.profile` in den Container einhängen).

## Deepgram live (Audiotranskription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktivieren: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus Coding Plan live

- Test: `src/agents/byteplus.live.test.ts`
- Aktivieren: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Optionale Modellüberschreibung: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Bildgenerierung live

- Test: `src/image-generation/runtime.live.test.ts`
- Befehl: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Umfang:
  - Enumeriert jedes registrierte Plugin für Bildgenerierungs-Provider
  - Lädt fehlende Provider-Env-Variablen aus Ihrer Login-Shell (`~/.profile`), bevor Probes ausgeführt werden
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne verwendbare Auth/Profile/Modelle
  - Führt die Standardvarianten der Bildgenerierung durch die gemeinsam genutzte Runtime-Fähigkeit aus:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Aktuell abgedeckte gebündelte Provider:
  - `openai`
  - `google`
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profilspeicher zu erzwingen und nur-Env-Überschreibungen zu ignorieren

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre jeweilige Live-Datei mit Profilschlüsseln innerhalb des Repo-Docker-Images aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), binden Ihr lokales Konfigurationsverzeichnis und Ihren Workspace ein (und sourcen `~/.profile`, wenn eingehängt). Die passenden lokalen Entry-Points sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig ein kleineres Smoke-Limit, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Env-Variablen, wenn Sie
  ausdrücklich den größeren erschöpfenden Scan möchten.
- `test:docker:all` erstellt das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Live-Docker-Lanes erneut.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` und `test:docker:plugins` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie vor dem Lauf in das Home des Containers, damit externe CLI-OAuth Token aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- MCP-Channel-Bridge (vorgefülltes Gateway + stdio-Bridge + roher Claude-Benachrichtigungsframe-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (Install-Smoke + `/plugin`-Alias + Claude-Bundle-Restart-Semantik): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein und
stagen ihn in ein temporäres Arbeitsverzeichnis innerhalb des Containers. Dadurch bleibt das Runtime-
Image schlank, während Vitest dennoch gegen Ihren exakten lokalen Quellcode/die exakte Konfiguration läuft.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, sodass Gateway-Live-Probes keine
echten Telegram-/Discord-/usw.-Channel-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, geben Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie die Gateway-
Live-Abdeckung in dieser Docker-Lane eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein Smoke-Test auf höherer Kompatibilitätsebene: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen fixierten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann merklich langsamer sein, weil Docker möglicherweise zuerst das
Open-WebUI-Image ziehen muss und Open WebUI möglicherweise seine eigene Cold-Start-Einrichtung abschließen muss.
Diese Lane erwartet einen verwendbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist die primäre Möglichkeit, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist bewusst deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen vorgefüllten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` ausführt, und
verifiziert dann geroutete Discovery von Gesprächen, Transkriptlesevorgänge, Anhangsmetadaten,
Verhalten der Live-Ereigniswarteschlange, Routing ausgehender Sendungen sowie Claude-artige Kanal- +
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
untersucht direkt die rohen stdio-MCP-Frames, sodass der Smoke das validiert, was die
Bridge tatsächlich emittiert, und nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.

Manueller ACP-Smoke für Plain-Language-Threads (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debugging-Abläufe. Es könnte wieder für die Validierung des ACP-Thread-Routings benötigt werden, also nicht löschen.

Nützliche Env-Variablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) wird nach `/home/node/.openclaw` eingehängt
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) wird nach `/home/node/.openclaw/workspace` eingehängt
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) wird nach `/home/node/.profile` eingehängt und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) wird nach `/home/node/.npm-global` eingehängt für zwischengespeicherte CLI-Installationen in Docker
- Externe CLI-Auth-Verzeichnisse unter `$HOME` werden schreibgeschützt unter `/host-auth/...` eingehängt und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standard: alle unterstützten Verzeichnisse einhängen (`.codex`, `.claude`, `.minimax`)
  - Eingegrenzte Provider-Läufe hängen nur die benötigten Verzeichnisse ein, abgeleitet aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Komma-Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profilspeicher stammen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell zu wählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open-WebUI-Smoke verwendeten Nonce-Check-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um den fixierten Open-WebUI-Image-Tag zu überschreiben

## Dokumentationsprüfung

Führen Sie nach Änderungen an der Dokumentation die Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anchor-Validierung aus, wenn Sie zusätzlich Prüfungen für In-Page-Überschriften benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen für „echte Pipelines“ ohne echte Provider:

- Gateway-Tool-Calling (Mock-OpenAI, echtes Gateway + Agent-Schleife): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Evaluierungen zur Agenten-Zuverlässigkeit (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Evaluierungen zur Agenten-Zuverlässigkeit“ verhalten:

- Mock-Tool-Calling durch die echte Gateway- + Agent-Schleife (`src/gateway/gateway.test.ts`).
- End-to-End-Wizard-Flows, die Sitzungsverdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgelistet sind, wählt der Agent den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt erforderliche Schritte/Args?
- **Workflow-Verträge:** Szenarien über mehrere Turns hinweg, die Tool-Reihenfolge, Weitergabe des Sitzungsverlaufs und Sandbox-Grenzen bestätigen.

Zukünftige Evaluierungen sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Dateilesen und Sitzungsverdrahtung zu bestätigen.
- Eine kleine Suite mit skillfokussierten Szenarien (verwenden vs vermeiden, Gating, Prompt Injection).
- Optionale Live-Evaluierungen (opt-in, env-gated) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite aus
Form- und Verhaltens-Assertions aus. Die Standard-Unit-Lane `pnpm test`
überspringt diese gemeinsam genutzten Seam- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsam genutzte Kanal- oder Provider-Oberflächen berühren.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Befinden sich unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Fähigkeiten)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten der Sitzungsbindung
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Kanalaktionen
- **threading** - Handhabung von Thread-IDs
- **directory** - Verzeichnis-/Roster-API
- **group-policy** - Durchsetzung der Gruppenrichtlinie

### Provider-Status-Verträge

Befinden sich unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanalstatus-Probes
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Befinden sich unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Auth-Flows
- **auth-choice** - Auth-Auswahl/Auswahlverhalten
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Discovery
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an plugin-sdk-Exports oder Subpfaden
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactorings an Plugin-Registrierung oder Discovery

Vertragstests laufen in CI und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitfaden)

Wenn Sie ein in Live entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock/Stub-Provider oder erfassen Sie die genaue Umformung der Request-Form)
- Wenn es inhärent nur live testbar ist (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test schmal und opt-in über Env-Variablen
- Bevorzugen Sie die kleinste Ebene, die den Fehler erfasst:
  - Fehler bei Request-Konvertierung/Replay des Providers → direkter Modelltest
  - Fehler in Gateway-Sitzung/Verlauf/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Guardrail für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet ein gesampeltes Ziel pro SecretRef-Klasse aus Registry-Metadaten ab (`listSecretTargetRegistryEntries()`) und bestätigt dann, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue SecretRef-Zielfamilie mit `includeInPlan` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden.
