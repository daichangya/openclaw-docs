---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionen für Modell-/Provider-Fehler hinzufügen
    - Gateway- und Agent-Verhalten debuggen
summary: 'Test-Kit: Unit-/E2E-/Live-Suiten, Docker-Runner und was die einzelnen Tests abdecken'
title: Tests
x-i18n:
    generated_at: "2026-04-07T06:17:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77c61126344d03c7b04ccf1f9aba0381cf8c7c73042d69b2d9f3f07a5eba70d3
    source_path: help/testing.md
    workflow: 15
---

# Tests

OpenClaw hat drei Vitest-Suiten (Unit/Integration, E2E, Live) und eine kleine Anzahl von Docker-Runnern.

Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt)
- Welche Befehle für typische Workflows ausgeführt werden sollen (lokal, vor dem Push, Debugging)
- Wie Live-Tests Anmeldedaten erkennen und Modelle/Provider auswählen
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einem leistungsfähigen Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting von Dateien leitet jetzt auch Erweiterungs-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Docker-gestützte QA-Site: `pnpm qa:lab:up`

Wenn Sie Tests anfassen oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen realer Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine einzelne Live-Datei ohne viel Ausgabe ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tipp: Wenn Sie nur einen fehlschlagenden Fall benötigen, schränken Sie Live-Tests vorzugsweise über die unten beschriebenen Allowlist-Umgebungsvariablen ein.

## Test-Suiten (was wo läuft)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Fehleranfälligkeit/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: zehn sequentielle Shard-Läufe (`vitest.full-*.config.ts`) über die vorhandenen bereichsspezifischen Vitest-Projekte
- Dateien: Kern-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` und die per Allowlist freigegebenen `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Soll schnell und stabil sein
- Hinweis zu Projekten:
  - Nicht zielgerichtetes `pnpm test` führt jetzt zehn kleinere Shard-Konfigurationen aus (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzelnen großen nativen Root-Project-Prozesses. Das senkt den Spitzen-RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Erweiterungsarbeit andere Suiten verdrängt.
  - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil eine Watch-Schleife mit mehreren Shards nicht praktikabel ist.
  - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch bereichsspezifische Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht den vollständigen Startup-Overhead des Root-Projekts zahlen muss.
  - `pnpm test:changed` erweitert geänderte Git-Pfade in dieselben bereichsspezifischen Lanes, wenn der Diff nur routbare Quell-/Testdateien betrifft; Änderungen an Konfiguration/Setup fallen weiterhin auf den breiten Root-Project-Neustart zurück.
  - Ausgewählte `plugin-sdk`- und `commands`-Tests werden zusätzlich durch dedizierte leichte Lanes geleitet, die `test/setup-openclaw-runtime.ts` überspringen; zustandsbehaftete/laufzeitschwere Dateien bleiben auf den vorhandenen Lanes.
  - Ausgewählte `plugin-sdk`- und `commands`-Hilfsquelldateien ordnen Läufe im geänderten Modus ebenfalls expliziten Nachbartests in diesen leichten Lanes zu, sodass Hilfsänderungen nicht die gesamte schwere Suite für dieses Verzeichnis erneut ausführen.
  - `auto-reply` hat jetzt drei dedizierte Buckets: Top-Level-Kernhilfen, Top-Level-`reply.*`-Integrationstests und den Teilbaum `src/auto-reply/reply/**`. Dadurch bleibt die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests getrennt.
- Hinweis zum eingebetteten Runner:
  - Wenn Sie Eingaben für die Discovery von Nachrichten-Tools oder den Laufzeitkontext der Kompaktierung ändern,
    behalten Sie beide Ebenen der Abdeckung bei.
  - Fügen Sie fokussierte Hilfsregressionen für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halten Sie außerdem die eingebetteten Runner-Integrationssuiten gesund:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suiten verifizieren, dass bereichsspezifische IDs und Kompaktierungsverhalten weiterhin
    durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Hilfstests sind
    kein ausreichender Ersatz für diese Integrationspfade.
- Hinweis zum Pool:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration setzt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner für Root-Projekte, E2E- und Live-Konfigurationen.
  - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer, läuft jetzt aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
  - Jeder `pnpm test`-Shard übernimmt dieselben Standards `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt standardmäßig jetzt auch `--no-maglev` für Vitest-Node-Child-Prozesse hinzu, um V8-Kompilierungs-Churn bei großen lokalen Läufen zu verringern. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn Sie mit dem Standardverhalten von V8 vergleichen müssen.
- Hinweis zur schnellen lokalen Iteration:
  - `pnpm test:changed` leitet durch bereichsspezifische Lanes, wenn die geänderten Pfade sauber einer kleineren Suite zugeordnet werden können.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einer höheren Worker-Obergrenze.
  - Die automatische lokale Worker-Skalierung ist jetzt absichtlich konservativer und fährt auch zurück, wenn die Host-Load-Average bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als `forceRerunTriggers`, damit Wiederholungen im geänderten Modus korrekt bleiben, wenn sich die Testverdrahtung ändert.
  - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Speicherort für direktes Profiling möchten.
- Hinweis zum Performance-Debugging:
  - `pnpm test:perf:imports` aktiviert Vitest-Berichte zur Importdauer sowie eine Aufschlüsselung der Importe.
  - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf Dateien, die sich seit `origin/main` geändert haben.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes `test:changed` mit dem nativen Root-Project-Pfad für diesen commiteten Diff und gibt Laufzeit sowie maximalen RSS unter macOS aus.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen nicht commiteten Baum, indem die Liste geänderter Dateien durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für Vitest/Vite-Startup und Transform-Overhead.
  - `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile des Runners für die Unit-Suite mit deaktivierter Dateiparallelisierung.

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Laufzeitstandards:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um den Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Anzahl der Worker zu erzwingen (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um die ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten von Multi-Instance-Gateways
  - WebSocket-/HTTP-Oberflächen, Node-Kopplung und schwereres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `test/openshell-sandbox.e2e.test.ts`
- Umfang:
  - Startet über Docker ein isoliertes OpenShell-Gateway auf dem Host
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Exec
  - Verifiziert kanonisches Remote-Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur per Opt-in; nicht Teil des Standardlaufs `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI sowie einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend Test-Gateway und Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test beim manuellen Ausführen der breiteren E2E-Suite zu aktivieren
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript zu zeigen

### Live (reale Provider + reale Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Anmeldedaten?“
  - Erfasst Provider-Formatänderungen, Tool-Calling-Eigenheiten, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Absichtlich nicht CI-stabil (reale Netzwerke, reale Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Bevorzugt eingegrenzte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel aufzugreifen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Es behält die Fortschrittsausgabe `[live] ...` bei, unterdrückt aber den zusätzlichen Hinweis zu `~/.profile` und schaltet Gateway-Bootstrap-Logs/Bonjour-Chatter stumm. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startup-Logs wieder sehen möchten.
- Rotation von API-Schlüsseln (provider-spezifisch): setzen Sie `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder pro Live-Override `OPENCLAW_LIVE_*_KEY`; Tests wiederholen bei Rate-Limit-Antworten.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suiten geben jetzt Fortschrittszeilen an stderr aus, sodass bei langen Provider-Aufrufen sichtbar bleibt, dass sie noch aktiv sind, selbst wenn die Vitest-Konsolenerfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert das Abfangen der Vitest-Konsole, sodass Provider-/Gateway-Fortschrittszeilen bei Live-Läufen sofort gestreamt werden.
  - Passen Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS` an.
  - Passen Sie Heartbeats für Gateway/Probe mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` an.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Networking / WS-Protokoll / Kopplung anfassen: `pnpm test:e2e` hinzufügen
- „Mein Bot ist down“ / provider-spezifische Fehler / Tool Calling debuggen: ein eingegrenztes `pnpm test:live` ausführen

## Live: Android-Node-Capability-Sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell angekündigten Befehl** eines verbundenen Android-Nodes aufrufen und das Befehlsvertragsverhalten prüfen.
- Umfang:
  - Manuelle Einrichtung als Voraussetzung (die Suite installiert/startet/koppelt die App nicht).
  - Gateway-`node.invoke`-Validierung pro Befehl für den ausgewählten Android-Node.
- Erforderliche Voreinrichtung:
  - Android-App bereits mit dem Gateway verbunden und gekoppelt.
  - App im Vordergrund halten.
  - Berechtigungen/Erfassungszustimmung für die Fähigkeiten erteilt, die erfolgreich sein sollen.
- Optionale Zielüberschreibungen:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zur Android-Einrichtung: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit Fehler isoliert werden können:

- „Direct model“ zeigt, dass Provider/Modell mit dem angegebenen Schlüssel grundsätzlich antworten kann.
- „Gateway smoke“ zeigt, dass die vollständige Gateway-+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modellvervollständigung (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - Mit `getApiKeyForModel` Modelle auswählen, für die Anmeldedaten vorhanden sind
  - Pro Modell eine kleine Vervollständigung ausführen (und gezielte Regressionen, wo nötig)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (Komma-Allowlist)
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (Komma-Allowlist)
- Herkunft der Schlüssel:
  - Standardmäßig: Profilspeicher und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur** den Profilspeicher zu erzwingen
- Warum es das gibt:
  - Trennt „Provider-API ist kaputt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (zum Beispiel OpenAI-Responses/Codex-Responses-Reasoning-Replay + Tool-Call-Flows)

### Ebene 2: Gateway + Dev-Agent-Smoke (was "@openclaw" tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway hochfahren
  - Eine Sitzung `agent:dev:*` erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit Schlüsseln durchlaufen und prüfen:
    - „sinnvolle“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes funktionieren (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Details zu den Probes (damit Fehler schnell erklärt werden können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und bittet den Agenten, sie zu `read`en und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test bittet den Agenten, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann wieder zu `read`en.
  - Bild-Probe: Der Test hängt ein generiertes PNG an (Katze + zufälliger Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder Komma-Liste) setzen, um einzugrenzen
- Providerauswahl (vermeidet „OpenRouter alles“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (Komma-Allowlist)
- Tool- und Bild-Probes sind in diesem Live-Test immer aktiv:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Bild-Probe läuft, wenn das Modell Unterstützung für Bildeingaben ankündigt
  - Ablauf (überblicksartig):
    - Test erzeugt ein kleines PNG mit „CAT“ + zufälligem Code (`src/gateway/live-image-probe.ts`)
    - Sendet es per `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Eingebetteter Agent leitet eine multimodale Nutzernachricht an das Modell weiter
    - Prüfung: Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler sind erlaubt)

Tipp: Um zu sehen, was Sie auf Ihrer Maschine testen können (und die genauen `provider/model`-IDs), führen Sie Folgendes aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Codex CLI oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: Die Gateway-+Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu berühren.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standards:
  - Modell: `codex-cli/gpt-5.4`
  - Befehl: `codex`
  - Argumente: `["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- Überschreibungen (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade statt per Prompt-Injektion als CLI-Argumente zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bildargumente übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Flow zu validieren.

Beispiel:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker-Rezept:

```bash
pnpm test:docker:live-cli-backend
```

Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den Live-CLI-Backend-Smoke im Docker-Image des Repos als Nicht-Root-Nutzer `node` aus.
- Für `codex-cli` installiert er das Linux-Paket `@openai/codex` in ein gecachtes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: Den echten ACP-Konversations-Bind-Flow mit einem Live-ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Nachricht-Kanal-Konversation direkt vor Ort binden
  - ein normales Follow-up in derselben Konversation senden
  - verifizieren, dass das Follow-up im gebundenen ACP-Sitzungstranskript landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standards:
  - ACP-Agenten in Docker: `claude,codex`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Slack-DM-ähnlicher Konversationskontext
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit nur für Admins bestimmten synthetischen Feldern für die Ursprungsroute, damit Tests Nachricht-Kanal-Kontext anhängen können, ohne vorzutäuschen, dass extern zugestellt wird.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test das eingebettete `acpx`-Plugin mit dessen eingebauter Agent-Registry für den ausgewählten ACP-Harness-Agenten.

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

Docker-Rezepte für einzelne Agenten:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
```

Docker-Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen beide unterstützten Live-CLI-Agenten aus: `claude`, dann `codex`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, um die Matrix einzugrenzen.
- Er sourct `~/.profile`, staged das passende CLI-Auth-Material in den Container, installiert `acpx` in ein beschreibbares npm-Präfix und installiert anschließend die gewünschte Live-CLI (`@anthropic-ai/claude-code` oder `@openai/codex`), falls sie fehlt.
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit `acpx` die Provider-Env-Variablen aus dem gesourcten Profil für die Child-Harness-CLI verfügbar hält.

### Empfohlene Live-Rezepte

Schmale, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool Calling über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus auf Google (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-ähnlicher Agent-Endpunkt).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf Ihrer Maschine (separate Authentifizierung + Tooling-Eigenheiten).
- Gemini-API vs. Gemini-CLI:
  - API: OpenClaw ruft Googles gehostete Gemini-API über HTTP auf (API-Schlüssel-/Profil-Auth); das ist es, was die meisten Nutzer mit „Gemini“ meinen.
  - CLI: OpenClaw führt ein lokales `gemini`-Binary aus; dieses hat eine eigene Authentifizierung und kann sich anders verhalten (Streaming/Tool-Unterstützung/Versionsabweichungen).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einer Entwickler-Maschine mit Schlüsseln abgedeckt werden sollten.

### Modernes Smoke-Set (Tool Calling + Bild)

Das ist der Lauf mit den „gängigen Modellen“, den wir funktionsfähig halten wollen:

- OpenAI (ohne Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool Calling (Read + optional Exec)

Wählen Sie mindestens eins pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder neueste verfügbare Version)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell, das bei Ihnen aktiviert ist)
- Cerebras: `cerebras/`… (falls Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool Calling hängt vom API-Modus ab)

### Vision: Bild senden (Anhang → multimodale Nachricht)

Nehmen Sie mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude/Gemini/OpenAI mit Vision-Unterstützung usw.), um die Bild-Probe auszuführen.

### Aggregatoren / alternative Gateways

Falls Sie entsprechende Schlüssel aktiviert haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (hunderte Modelle; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Bildfähigkeit zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (falls Sie Anmeldedaten/Konfiguration haben):

- Eingebaut: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuchen Sie nicht, „alle Modelle“ in der Dokumentation fest zu kodieren. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrer Maschine zurückgibt, plus die verfügbaren Schlüssel.

## Anmeldedaten (niemals committen)

Live-Tests erkennen Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „keine Anmeldedaten“ meldet, debuggen Sie ihn so, wie Sie auch `openclaw models list` / Modellauswahl debuggen würden.

- Authentifizierungsprofile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist gemeint, wenn Live-Tests von „Profilschlüsseln“ sprechen)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Veraltetes Zustandsverzeichnis: `~/.openclaw/credentials/` (wird bei Vorhandensein in das gestagte Live-Home kopiert, ist aber nicht der Hauptspeicher für Profilschlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, die `auth-profiles.json`-Dateien pro Agent, veraltete `credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; `agents.*.workspace` / `agentDir`-Pfadüberschreibungen werden in dieser gestagten Konfiguration entfernt, damit Probes nicht in Ihrem echten Host-Workspace landen.

Wenn Sie auf Env-Schlüssel setzen möchten (zum Beispiel aus Ihrem `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus oder verwenden Sie die Docker-Runner unten (diese können `~/.profile` in den Container mounten).

## Deepgram live (Audio-Transkription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktivierung: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus Coding-Plan live

- Test: `src/agents/byteplus.live.test.ts`
- Aktivierung: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Optionales Modell-Override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Testet die gebündelten Bild-, Video- und `music_generate`-Pfade von Comfy
  - Überspringt jede Fähigkeit, sofern `models.providers.comfy.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an Comfy-Workflow-Übermittlung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `src/image-generation/runtime.live.test.ts`
- Befehl: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Zählt jedes registrierte Provider-Plugin für Bildgenerierung auf
  - Lädt vor den Probes fehlende Provider-Env-Variablen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profile/Modelle
  - Führt die Standardvarianten für Bildgenerierung über die gemeinsame Runtime-Fähigkeit aus:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Profilspeicher-Authentifizierung zu erzwingen und rein Env-basierte Overrides zu ignorieren

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Testet den gemeinsam genutzten gebündelten Providerpfad für Musikgenerierung
  - Deckt derzeit Google und MiniMax ab
  - Lädt vor den Probes Provider-Env-Variablen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profile/Modelle
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit Eingabe nur per Prompt
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung in der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Profilspeicher-Authentifizierung zu erzwingen und rein Env-basierte Overrides zu ignorieren

## Videogenerierung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Testet den gemeinsam genutzten gebündelten Providerpfad für Videogenerierung
  - Lädt vor den Probes Provider-Env-Variablen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profile/Modelle
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit Eingabe nur per Prompt
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep lokale bufferbasierte Bildeingaben akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep lokale bufferbasierte Videoeingaben akzeptiert
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine entfernte Bild-URL erfordert
  - Provider-spezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` für Text-zu-Video sowie standardmäßig eine `kling`-Lane aus, die eine entfernte Bild-URL-Fixture verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - nur `runway`, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit entfernte Referenz-URLs mit `http(s)` / MP4 erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Lane lokale bufferbasierte Eingabe verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil der aktuellen gemeinsamen Lane die Garantie für organisationsspezifischen Zugriff auf Video-Inpaint/Remix fehlt
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Profilspeicher-Authentifizierung zu erzwingen und rein Env-basierte Overrides zu ignorieren

## Media-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsam genutzten Live-Suiten für Bild, Musik und Video über einen repo-nativen Entry-Point aus
  - Lädt fehlende Provider-Env-Variablen automatisch aus `~/.profile`
  - Grenzt jede Suite standardmäßig automatisch auf Provider ein, die aktuell nutzbare Auth haben
  - Verwendet `scripts/test-live.mjs` wieder, damit Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen auf:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre jeweilige Live-Datei für Profilschlüssel im Docker-Image des Repos aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und der Workspace gemountet werden (und `~/.profile` gesourct wird, falls gemountet). Die entsprechenden lokalen Entry-Points sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Env-Variablen, wenn Sie
  ausdrücklich den größeren vollständigen Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Docker-Live-Lanes wieder.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` und `test:docker:plugins` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle mounten außerdem nur die benötigten externen CLI-Auth-Homes (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, sodass externe CLI-OAuth Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffold): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- MCP-Kanal-Bridge (vorgesätes Gateway + stdio-Bridge + roher Claude-Benachrichtigungsframe-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (Install-Smoke + `/plugin`-Alias + Claude-Bundle-Neustartsemantik): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)

Die Docker-Runner für Live-Modelle mounten den aktuellen Checkout außerdem schreibgeschützt und
stagen ihn in ein temporäres Workdir innerhalb des Containers. Dadurch bleibt das Runtime-
Image schlank, während Vitest dennoch gegen genau Ihren lokalen Quellcode/Ihre lokale Konfiguration läuft.
Der Staging-Schritt überspringt große, nur lokal benötigte Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes nicht
echte Worker für Telegram/Discord/usw. im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus; reichen Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie die Gateway-
Live-Abdeckung in dieser Docker-Lane eingrenzen oder ausschließen möchten.
`test:docker:openwebui` ist ein Smoke-Test für Kompatibilität auf höherer Ebene: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` verfügbar macht, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann deutlich langsamer sein, weil Docker möglicherweise erst das
Open-WebUI-Image ziehen muss und Open WebUI möglicherweise seine eigene Cold-Start-Einrichtung abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist der primäre Weg, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload aus wie `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen vorgesäten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` startet, und
verifiziert dann geroutete Konversationserkennung, Transkriptlesevorgänge, Anhangsmetadaten,
Verhalten der Live-Ereigniswarteschlange, Routing ausgehender Sendungen sowie Claude-artige Kanal- und
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, sodass der Smoke das validiert, was die
Bridge tatsächlich ausgibt, und nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.

Manueller ACP-Thread-Smoke in Klartext (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows bei. Es könnte erneut für die Validierung des ACP-Thread-Routings benötigt werden, also nicht löschen.

Nützliche Env-Variablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) gemountet nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) gemountet nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) gemountet nach `/home/node/.profile` und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) gemountet nach `/home/node/.npm-global` für gecachte CLI-Installationen in Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor dem Start der Tests nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Komma-Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profilspeicher kommen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das Modell auszuwählen, das vom Gateway für den Open-WebUI-Smoke bereitgestellt wird
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Nonce-Prüf-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das gepinnte Open-WebUI-Image-Tag zu überschreiben

## Plausibilitätsprüfung der Dokumentation

Führen Sie nach Dokumentationsänderungen die Doku-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anchor-Validierung aus, wenn Sie zusätzlich Prüfungen für In-Page-Überschriften benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind „reale Pipeline“-Regressionen ohne reale Provider:

- Gateway-Tool-Calling (Mock-OpenAI, echtes Gateway + Agent-Schleife): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeitsevals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeitsevals“ verhalten:

- Mock-Tool-Calling über die echte Gateway-+Agent-Schleife (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenflüsse, die Sitzungsverdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgeführt sind, wählt der Agent den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt erforderliche Schritte/Argumente?
- **Workflow-Verträge:** Mehrturn-Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Lesen von Skill-Dateien und Sitzungsverdrahtung zu prüfen.
- Eine kleine Suite von skillfokussierten Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, Env-gesteuert) erst dann, wenn die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle gefundenen Plugins und führen eine Suite von
Form- und Verhaltensprüfungen aus. Die Standard-Unit-Lane `pnpm test`
überspringt diese gemeinsamen Seam- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsame Kanal- oder Provider-Oberflächen anfassen.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Liegen unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (id, name, capabilities)
- **setup** - Vertrag für den Setup-Assistenten
- **session-binding** - Verhalten der Sitzungsbindung
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Behandlung eingehender Nachrichten
- **actions** - Handler für Kanalaktionen
- **threading** - Behandlung von Thread-IDs
- **directory** - Directory-/Roster-API
- **group-policy** - Durchsetzung der Gruppenrichtlinie

### Provider-Statusverträge

Liegen unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanalstatus-Probes
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Liegen unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Authentifizierungsflusses
- **auth-choice** - Authentifizierungswahl/-auswahl
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Laufzeit
- **shape** - Plugin-Form/-Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an `plugin-sdk`-Exporten oder Subpaths
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactorings an Plugin-Registrierung oder Discovery

Vertragstests laufen in CI und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Richtlinien)

Wenn Sie ein in Live entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock/Stub-Provider oder exakte Erfassung der Transformation der Request-Form)
- Wenn es inhärent nur live reproduzierbar ist (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test schmal und per Env-Variablen opt-in
- Zielen Sie bevorzugt auf die kleinste Ebene, die den Fehler erkennt:
  - Fehler bei Provider-Request-Konvertierung/Replay → Direktmodell-Test
  - Fehler in Gateway-Sitzung/Verlauf/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Schutz:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus Registry-Metadaten ein gesampeltes Ziel pro SecretRef-Klasse ab (`listSecretTargetRegistryEntries()`) und prüft dann, dass Exec-IDs von Traversal-Segmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue `includeInPlan`-SecretRef-Zielfamilie hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden.
