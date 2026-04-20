---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Gateway- und Agentenverhalten debuggen
summary: 'Test-Kit: Unit-/E2E-/Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Testen
x-i18n:
    generated_at: "2026-04-20T06:29:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88457038e2e2c7940d0348762d0ece187111a8c61fa9bad54b39eade4217ddbc
    source_path: help/testing.md
    workflow: 15
---

# Testen

OpenClaw verfügt über drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Auswahl an Docker-Runnern.

Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt)
- Welche Befehle für gängige Workflows auszuführen sind (lokal, vor dem Push, Debugging)
- Wie Live-Tests Anmeldedaten erkennen und Modelle/Provider auswählen
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm test`
- Schnellere lokale Ausführung der vollständigen Suite auf einem leistungsstarken Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Datei-Targeting leitet jetzt auch Erweiterungs-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzuge zuerst gezielte Ausführungen, wenn du an einem einzelnen Fehler arbeitest.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn du Tests anfasst oder zusätzliche Sicherheit möchtest:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine einzelne Live-Datei leise anvisieren: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tipp: Wenn du nur einen einzelnen fehlschlagenden Fall brauchst, schränke Live-Tests möglichst über die unten beschriebenen Allowlist-Umgebungsvariablen ein.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupt-Test-Suites zur Verfügung, wenn du den Realismus von QA-lab brauchst:

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig eine Parallelität von 4 (begrenzt durch die Anzahl der ausgewählten Szenarien). Mit `--concurrency <count>` kannst du die Anzahl der Worker anpassen, oder mit `--concurrency 1` die ältere serielle Lane verwenden.
  - Beendet sich mit einem Fehlercode ungleich null, wenn irgendein Szenario fehlschlägt. Verwende `--allow-failures`, wenn du Artefakte ohne fehlerhaften Exit-Code haben möchtest.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste `mock-openai`-Lane zu ersetzen.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite innerhalb einer flüchtigen Multipass-Linux-VM aus.
  - Behält dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Flags zur Provider-/Modellauswahl wie `qa suite`.
  - Live-Ausführungen leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktisch sind:
    umgebungsbasierte Provider-Schlüssel, den Pfad zur QA-Live-Provider-Konfiguration und `CODEX_HOME`, wenn vorhanden.
  - Ausgabeverzeichnisse müssen unterhalb des Repo-Roots bleiben, damit der Gast über den eingebundenen Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht + die Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorartige QA-Arbeit.
- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direktes Protokoll-Smoketesting.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen flüchtigen Docker-gestützten Tuwunel-Homeserver aus.
  - Dieser QA-Host ist derzeit nur für Repo/Entwicklung gedacht. Paketierte OpenClaw-Installationen liefern `qa-lab` nicht mit, daher stellen sie `openclaw qa` nicht bereit.
  - Repo-Checkouts laden den gebündelten Runner direkt; kein separater Plugin-Installationsschritt ist erforderlich.
  - Richtet drei temporäre Matrix-Benutzer (`driver`, `sut`, `observer`) sowie einen privaten Raum ein und startet dann ein QA-Gateway-Kind mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das gepinnte stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreibe dies mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn du ein anderes Image testen musst.
  - Matrix stellt keine gemeinsamen Flags für Credential-Quellen bereit, da die Lane lokal flüchtige Benutzer provisioniert.
  - Schreibt einen Matrix-QA-Bericht, eine Zusammenfassung, ein Beobachtete-Ereignisse-Artefakt und ein kombiniertes stdout/stderr-Ausgabelog unter `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe mit den Driver- und SUT-Bot-Tokens aus der Umgebung aus.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Anmeldedaten. Verwende standardmäßig den Umgebungsmodus oder setze `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Beendet sich mit einem Fehlercode ungleich null, wenn irgendein Szenario fehlschlägt. Verwende `--allow-failures`, wenn du Artefakte ohne fehlerhaften Exit-Code haben möchtest.
  - Erfordert zwei verschiedene Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Für stabile Bot-zu-Bot-Beobachtung aktiviere den Modus Bot-to-Bot Communication in `@BotFather` für beide Bots und stelle sicher, dass der Driver-Bot Bot-Verkehr in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Beobachtete-Nachrichten-Artefakt unter `.artifacts/qa-e2e/...`.

Live-Transport-Lanes teilen sich einen einheitlichen Standardvertrag, damit neue Transporte nicht auseinanderdriften:

`qa-channel` bleibt die breite synthetische QA-Suite und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Erwähnungs-Gating | Allowlist-Block | Antwort auf oberster Ebene | Fortsetzung nach Neustart | Thread-Nachverfolgung | Thread-Isolation | Reaktionsbeobachtung | Hilfe-Befehl |
| -------- | ------ | ----------------- | --------------- | -------------------------- | ------------------------- | --------------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x                 | x               | x                          | x                         | x                     | x                | x                    |              |
| Telegram | x      |                   |                 |                            |                           |                       |                  |                      | x            |

### Gemeinsame Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, beschafft QA lab ein exklusives Lease aus einem Convex-gestützten Pool, sendet Heartbeats für dieses Lease, während die Lane läuft, und gibt das Lease beim Herunterfahren frei.

Referenzgerüst für ein Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Anmeldedatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Standard per Umgebung: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt loopback-`http://`-Convex-URLs für ausschließlich lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Administratorbefehle für Maintainer (Pool hinzufügen/entfernen/auflisten) erfordern ausdrücklich
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Hilfsbefehle für Maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwende `--json` für maschinenlesbare Ausgaben in Skripten und CI-Hilfsprogrammen.

Standard-Endpoint-Vertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Anfrage: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Erfolg: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Erschöpft/wiederholbar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Erfolg: `{ status: "ok" }` (oder leeres `2xx`)
- `POST /release`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Erfolg: `{ status: "ok" }` (oder leeres `2xx`)
- `POST /admin/add` (nur Maintainer-Secret)
  - Anfrage: `{ kind, actorId, payload, note?, status? }`
  - Erfolg: `{ status: "ok", credential }`
- `POST /admin/remove` (nur Maintainer-Secret)
  - Anfrage: `{ credentialId, actorId }`
  - Erfolg: `{ status: "ok", changed, credential }`
  - Schutz vor aktivem Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für Telegram-Art:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss ein numerischer Telegram-Chat-ID-String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

### Einen Kanal zu QA hinzufügen

Das Hinzufügen eines Kanals zum markdownbasierten QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Kanal.
2. Ein Szenario-Paket, das den Kanalvertrag testet.

Füge keinen neuen Top-Level-QA-Befehlsstamm hinzu, wenn der gemeinsame `qa-lab`-Host
den Ablauf übernehmen kann.

`qa-lab` besitzt die gemeinsame Host-Mechanik:

- den `openclaw qa`-Befehlsstamm
- Start und Herunterfahren der Suite
- Worker-Parallelität
- Schreiben von Artefakten
- Berichterstellung
- Szenarioausführung
- Kompatibilitäts-Aliasse für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Stamm eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie die Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand offengelegt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transport-spezifisches Zurücksetzen oder Aufräumen behandelt wird

Die minimale Hürde für die Übernahme eines neuen Kanals ist:

1. `qa-lab` muss Eigentümer des gemeinsamen `qa`-Stamms bleiben.
2. Implementiere den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam.
3. Belasse transportspezifische Mechanik im Runner-Plugin oder Channel-Harness.
4. Hänge den Runner als `openclaw qa <runner>` ein, anstatt einen konkurrierenden Root-Befehl zu registrieren.
   Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren.
   Halte `runtime-api.ts` schlank; Lazy-CLI- und Runner-Ausführung sollten hinter separaten Entry Points bleiben.
5. Erstelle oder passe Markdown-Szenarien unter den thematischen `qa/scenarios/`-Verzeichnissen an.
6. Verwende die generischen Szenario-Helfer für neue Szenarien.
7. Halte bestehende Kompatibilitäts-Aliasse funktionsfähig, sofern das Repo keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn sich ein Verhalten einmalig in `qa-lab` ausdrücken lässt, gehört es in `qa-lab`.
- Wenn ein Verhalten von einem Kanaltransport abhängt, belasse es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Kanal nutzen kann, füge einen generischen Helfer hinzu statt eines kanalspezifischen Zweigs in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halte das Szenario transportspezifisch und mache das im Szenariovertrag ausdrücklich.

Bevorzugte generische Helfernamen für neue Szenarien sind:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Kompatibilitäts-Aliasse bleiben für bestehende Szenarien verfügbar, einschließlich:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Neue Kanal-Arbeit sollte die generischen Helfernamen verwenden.
Kompatibilitäts-Aliasse existieren, um eine Flag-Day-Migration zu vermeiden, nicht als Modell für
das Verfassen neuer Szenarien.

## Test-Suites (was wo läuft)

Betrachte die Suites als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: zehn sequenzielle Shard-Ausführungen (`vitest.full-*.config.ts`) über die vorhandenen begrenzten Vitest-Projekte
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` sowie die per Allowlist zugelassenen `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
- Hinweis zu Projekten:
  - Nicht zielgerichtetes `pnpm test` führt jetzt elf kleinere Shard-Konfigurationen aus (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzelnen riesigen nativen Root-Project-Prozesses. Das reduziert den Spitzen-RSS auf ausgelasteten Maschinen und verhindert, dass `auto-reply`-/Erweiterungsarbeit nicht zusammenhängende Suites ausbremst.
  - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil eine Multi-Shard-Watch-Schleife nicht praktikabel ist.
  - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch begrenzte Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die vollen Startup-Kosten des Root-Projekts zahlen muss.
  - `pnpm test:changed` erweitert geänderte Git-Pfade in dieselben begrenzten Lanes, wenn der Diff nur routbare Quell-/Testdateien betrifft; Änderungen an Konfiguration/Setup fallen weiterhin auf die breite Root-Project-Neuausführung zurück.
  - Import-leichte Unit-Tests aus Agents, Commands, Plugins, `auto-reply`-Hilfsfunktionen, `plugin-sdk` und ähnlichen rein utilitären Bereichen werden durch die `unit-fast`-Lane geleitet, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den vorhandenen Lanes.
  - Ausgewählte Quell-Hilfsdateien aus `plugin-sdk` und `commands` ordnen Läufe im Changed-Modus ebenfalls expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Hilfsänderungen nicht die vollständige schwere Suite für dieses Verzeichnis neu ausführen.
  - `auto-reply` hat jetzt drei dedizierte Buckets: Core-Hilfsfunktionen auf oberster Ebene, Integrations-Tests der obersten Ebene `reply.*` und den Teilbaum `src/auto-reply/reply/**`. Dadurch bleibt die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests getrennt.
- Hinweis zum eingebetteten Runner:
  - Wenn du Eingaben für die Message-Tool-Erkennung oder den Laufzeitkontext von Compaction änderst,
    halte beide Ebenen der Abdeckung aufrecht.
  - Füge gezielte Hilfs-Regressionen für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halte auch die eingebetteten Runner-Integrations-Suites intakt:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suites verifizieren, dass begrenzte IDs und Compaction-Verhalten weiterhin
    durch die echten `run.ts`- / `compact.ts`-Pfade fließen; reine Hilfs-Tests sind kein
    ausreichender Ersatz für diese Integrationspfade.
- Hinweis zum Pool:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration setzt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner über die Root-Projekte sowie die e2e- und live-Konfigurationen hinweg.
  - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer, läuft jetzt aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
  - Jeder `pnpm test`-Shard übernimmt dieselben Standardwerte `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt für Vitest-Child-Node-Prozesse jetzt standardmäßig ebenfalls `--no-maglev` hinzu, um V8-Kompilierungs-Churn bei großen lokalen Läufen zu reduzieren. Setze `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn du mit dem Standardverhalten von V8 vergleichen musst.
- Hinweis zur schnellen lokalen Iteration:
  - `pnpm test:changed` leitet durch begrenzte Lanes, wenn sich die geänderten Pfade sauber auf eine kleinere Suite abbilden lassen.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einem höheren Worker-Limit.
  - Die automatische lokale Worker-Skalierung ist jetzt bewusst konservativ und fährt auch zurück, wenn die Last des Hosts bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als `forceRerunTriggers`, damit Neuausführungen im Changed-Modus korrekt bleiben, wenn sich das Test-Wiring ändert.
  - Die Konfiguration hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setze `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn du einen expliziten Cache-Speicherort für direktes Profiling verwenden möchtest.
- Hinweis zum Perf-Debugging:
  - `pnpm test:perf:imports` aktiviert Vitest-Berichte zur Importdauer sowie Ausgaben zur Import-Aufschlüsselung.
  - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht das geroutete `test:changed` mit dem nativen Root-Project-Pfad für diesen eingecheckten Diff und gibt Wall-Time sowie den maximalen RSS unter macOS aus.
- `pnpm test:perf:changed:bench -- --worktree` führt Benchmarks des aktuellen verschmutzten Baums aus, indem die Liste der geänderten Dateien durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für Vitest/Vite-Startup- und Transform-Overhead.
  - `pnpm test:perf:profile:runner` schreibt Runner-CPU- und Heap-Profile für die Unit-Suite, wobei die Dateiparallelisierung deaktiviert ist.

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Laufzeit-Standards:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im stillen Modus, um den Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten von Gateway mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und umfangreicheres Networking
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
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Ausführung
  - Verifiziert kanonisches Remote-Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur per Opt-in; nicht Teil des standardmäßigen Laufs `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI sowie einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend das Test-Gateway und die Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript zu verweisen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`
- Standard: per `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Anmeldedaten?“
  - Erkennt Änderungen am Provider-Format, Eigenheiten beim Tool-Calling, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Von Haus aus nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Bevorzuge eingegrenzte Teilmengen statt „alles“
- Live-Läufe beziehen `~/.profile` ein, um fehlende API-Schlüssel aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures dein echtes `~/.openclaw` nicht verändern können.
- Setze `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn du absichtlich möchtest, dass Live-Tests dein echtes Home-Verzeichnis verwenden.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Es behält die Fortschrittsausgabe `[live] ...` bei, unterdrückt aber den zusätzlichen Hinweis zu `~/.profile` und schaltet Gateway-Bootstrap-Logs/Bonjour-Chattern stumm. Setze `OPENCLAW_LIVE_TEST_QUIET=0`, wenn du die vollständigen Startup-Logs wiederhaben möchtest.
- API-Schlüsselrotation (providerspezifisch): Setze `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder eine per-Live-Überschreibung über `OPENCLAW_LIVE_*_KEY`; Tests versuchen bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben Fortschrittszeilen jetzt auf stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, auch wenn die Vitest-Konsolenerfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert die Vitest-Konsolenabfangung, sodass Fortschrittszeilen von Provider/Gateway bei Live-Läufen sofort gestreamt werden.
  - Passe direkte Modell-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` an.
  - Passe Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` an.

## Welche Suite sollte ich ausführen?

Verwende diese Entscheidungstabelle:

- Logik/Tests bearbeiten: Führe `pnpm test` aus (und `pnpm test:coverage`, wenn du viel geändert hast)
- Gateway-Networking / WS-Protokoll / Pairing anfassen: ergänze `pnpm test:e2e`
- „Mein Bot ist down“ debuggen / providerspezifische Fehler / Tool-Calling: führe ein eingegrenztes `pnpm test:live` aus

## Live: Android-Node-Capability-Sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell angekündigten Befehl** eines verbundenen Android-Node aufrufen und das Befehlsvertragsverhalten verifizieren.
- Umfang:
  - Vorausgesetztes/manuelles Setup (die Suite installiert/startet/paart die App nicht).
  - Gateway-Validierung von `node.invoke` für den ausgewählten Android-Node, Befehl für Befehl.
- Erforderliches Vorab-Setup:
  - Android-App bereits mit dem Gateway verbunden und gepairt.
  - App im Vordergrund halten.
  - Berechtigungen/Erfassungseinwilligung für Capabilities erteilen, bei denen du erwartest, dass sie erfolgreich sind.
- Optionale Zielüberschreibungen:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zum Android-Setup: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen unterteilt, damit wir Fehler isolieren können:

- „Direktes Modell“ sagt uns, ob der Provider/das Modell mit dem angegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke“ sagt uns, ob die vollständige Gateway-+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modell-Completion (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - `getApiKeyForModel` verwenden, um Modelle auszuwählen, für die du Anmeldedaten hast
  - Pro Modell eine kleine Completion ausführen (und gezielte Regressionen, wo nötig)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setze `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), damit diese Suite tatsächlich ausgeführt wird; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (Komma-Allowlist)
  - Moderne/alle Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setze `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder einen positiven Wert für ein kleineres Limit.
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (Komma-Allowlist)
- Woher Schlüssel kommen:
  - Standardmäßig: Profilspeicher und Umgebungs-Fallbacks
  - Setze `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur** den Profilspeicher zu erzwingen
- Warum es das gibt:
  - Trennt „Provider-API ist kaputt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI-Responses/Codex-Responses-Reasoning-Replay + Tool-Call-Flows)

### Ebene 2: Gateway + Dev-Agent-Smoke (das, was "@openclaw" tatsächlich macht)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway starten
  - Eine Sitzung `agent:dev:*` erstellen/patchen (Modellüberschreibung pro Lauf)
  - Modelle mit Schlüsseln durchlaufen und Folgendes verifizieren:
    - „sinnvolle“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Probe-Details (damit du Fehler schnell erklären kannst):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agenten auf, sie zu `read`en und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agenten auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann zurück zu `read`en.
  - Bild-Probe: Der Test hängt eine generierte PNG-Datei an (Katze + zufälliger Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setze `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder Komma-Liste), um einzugrenzen
  - Moderne/alle Gateway-Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setze `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder einen positiven Wert für ein kleineres Limit.
- Providerauswahl (vermeide „OpenRouter alles“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (Komma-Allowlist)
- Tool- + Bild-Probes sind in diesem Live-Test immer aktiviert:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Bild-Probe wird ausgeführt, wenn das Modell Unterstützung für Bildeingaben ankündigt
  - Ablauf (allgemein):
    - Test generiert eine kleine PNG mit „CAT“ + zufälligem Code (`src/gateway/live-image-probe.ts`)
    - Sendet sie über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Eingebetteter Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Verifikation: Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler sind erlaubt)

Tipp: Um zu sehen, was du auf deinem Rechner testen kannst (und die genauen IDs `provider/model`), führe Folgendes aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway- + Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne deine Standardkonfiguration anzufassen.
- Backend-spezifische Smoke-Standards liegen in der Definition `cli-backend.ts` der jeweiligen Erweiterung.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardwerte:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Befehls-/Args-/Bildverhalten stammen aus den Metadaten des jeweiligen CLI-Backend-Plugins.
- Überschreibungen (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Argumente statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bildargumente übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Flow zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, um die standardmäßige Claude-Sonnet-→-Opus-Kontinuitätsprobe in derselben Sitzung zu deaktivieren (setze auf `1`, um sie zu erzwingen, wenn das ausgewählte Modell ein Umschaltziel unterstützt).

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

Docker-Rezepte für einzelne Provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den Live-CLI-Backend-Smoke innerhalb des Repo-Docker-Images als nicht-root-Benutzer `node` aus.
- Er löst CLI-Smoke-Metadaten aus der jeweiligen Erweiterung auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein gecachtes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable Claude-Code-Subscription-OAuth über entweder `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es verifiziert zuerst direkt `claude -p` in Docker und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-Key-Umgebungsvariablen beizubehalten. Diese Subscription-Lane deaktiviert standardmäßig die Claude-MCP-/Tool- und Bild-Probes, weil Claude derzeit die Nutzung durch Drittanbieter-Apps über Extra-Usage-Abrechnung statt über normale Limits des Subscription-Plans abrechnet.
- Der Live-CLI-Backend-Smoke testet jetzt denselben End-to-End-Ablauf für Claude, Codex und Gemini: Text-Turn, Bildklassifizierungs-Turn, dann MCP-`cron`-Tool-Call, verifiziert über die Gateway-CLI.
- Claudes Standard-Smoke patcht außerdem die Sitzung von Sonnet zu Opus und verifiziert, dass sich die fortgesetzte Sitzung weiterhin eine frühere Notiz merkt.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Conversation-Bind-Flow mit einem Live-ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Konversation direkt daran binden
  - eine normale Folge-Nachricht in derselben Konversation senden
  - verifizieren, dass die Folge-Nachricht im gebundenen ACP-Sitzungstranskript landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agenten in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Slack-DM-artiger Konversationskontext
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit admin-only synthetischen Feldern für die Ursprungsroute, damit Tests Message-Channel-Kontext anhängen können, ohne vorzutäuschen, extern zuzustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die integrierte Agent-Registry des eingebetteten `acpx`-Plugins für den ausgewählten ACP-Harness-Agenten.

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
pnpm test:docker:live-acp-bind:gemini
```

Docker-Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen alle unterstützten Live-CLI-Agenten aus: `claude`, `codex`, dann `gemini`.
- Verwende `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, um die Matrix einzugrenzen.
- Er bezieht `~/.profile` ein, stellt das passende CLI-Authentifizierungsmaterial in den Container bereit, installiert `acpx` in ein beschreibbares npm-Präfix und installiert dann die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`), falls sie fehlt.
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit `acpx` die Provider-Umgebungsvariablen aus dem bezogenen Profil für die untergeordnete Harness-CLI verfügbar hält.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: den Plugin-eigenen Codex-Harness über die normale Gateway-
  `agent`-Methode validieren:
  - das gebündelte `codex`-Plugin laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agent-Turn an `codex/gpt-5.4` senden
  - einen zweiten Turn an dieselbe OpenClaw-Sitzung senden und verifizieren, dass der App-Server-
    Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehlspfad
    ausführen
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `codex/gpt-5.4`
- Optionale Bild-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Der Smoke setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, damit ein kaputter Codex-
  Harness nicht bestehen kann, indem er stillschweigend auf PI zurückfällt.
- Auth: `OPENAI_API_KEY` aus Shell/Profil sowie optional kopierte
  `~/.codex/auth.json` und `~/.codex/config.toml`

Lokales Rezept:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-Rezept:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker-Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-codex-harness-docker.sh`.
- Er bezieht das eingebundene `~/.profile` ein, übergibt `OPENAI_API_KEY`, kopiert Codex-CLI-
  Auth-Dateien, wenn vorhanden, installiert `@openai/codex` in ein beschreibbares eingebundenes npm-
  Präfix, stellt den Quellbaum bereit und führt dann nur den Live-Test des Codex-Harness aus.
- Docker aktiviert die Bild- und MCP-/Tool-Probes standardmäßig. Setze
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, wenn du einen enger eingegrenzten Debug-Lauf benötigst.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend zur Live-
  Testkonfiguration, damit ein Fallback auf `openai-codex/*` oder PI keine Regression des Codex-Harness
  verbergen kann.

### Empfohlene Live-Rezepte

Enge, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Calling über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-ähnlicher Agent-Endpoint).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf deinem Rechner (separate Auth + besondere Tooling-Eigenheiten).
- Gemini-API vs. Gemini-CLI:
  - API: OpenClaw ruft Googles gehostete Gemini-API über HTTP auf (API-Schlüssel / Profil-Auth); das ist in der Regel gemeint, wenn Nutzer „Gemini“ sagen.
  - CLI: OpenClaw ruft ein lokales `gemini`-Binary auf; es hat seine eigene Auth und kann sich anders verhalten (Streaming/Tool-Support/Versionsabweichungen).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einer Entwickler-Maschine mit Schlüsseln abgedeckt werden sollten.

### Modernes Smoke-Set (Tool-Calling + Bild)

Das ist der Lauf mit den „gängigen Modellen“, den wir funktionsfähig halten wollen:

- OpenAI (nicht-Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini-API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Basis: Tool-Calling (Read + optional Exec)

Wähle mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder die neueste verfügbare Version)
- Mistral: `mistral/`… (wähle ein „tools“-fähiges Modell, das du aktiviert hast)
- Cerebras: `cerebras/`… (wenn du Zugriff hast)
- LM Studio: `lmstudio/`… (lokal; Tool-Calling hängt vom API-Modus ab)

### Vision: Bild senden (Anhang → multimodale Nachricht)

Nimm mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude/Gemini/OpenAI-Varianten mit Vision-Fähigkeit usw.), um die Bild-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn du Schlüssel aktiviert hast, unterstützen wir Tests auch über:

- OpenRouter: `openrouter/...` (Hunderte Modelle; verwende `openclaw models scan`, um Kandidaten mit Tool- + Bildfähigkeit zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Auth über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die du in die Live-Matrix aufnehmen kannst (wenn du Anmeldedaten/Konfiguration hast):

- Integriert: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpoints): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuche nicht, „alle Modelle“ in der Dokumentation fest zu kodieren. Die maßgebliche Liste ist das, was `discoverModels(...)` auf deinem Rechner zurückgibt + welche Schlüssel verfügbar sind.

## Anmeldedaten (niemals committen)

Live-Tests erkennen Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Folgen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „keine Anmeldedaten“ meldet, debugge ihn genauso, wie du `openclaw models list` / Modellauswahl debuggen würdest.

- Pro-Agent-Auth-Profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist es, was in den Live-Tests mit „Profilschlüssel“ gemeint ist)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-Zustandsverzeichnis: `~/.openclaw/credentials/` (wird in das vorbereitete Live-Home kopiert, wenn vorhanden, aber nicht in den Hauptspeicher für Profilschlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, pro-Agent-`auth-profiles.json`-Dateien, das Legacy-`credentials/` sowie unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; vorbereitete Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfadüberschreibungen für `agents.*.workspace` / `agentDir` werden entfernt, damit Probes nicht in deinem echten Host-Workspace landen.

Wenn du dich auf Umgebungsschlüssel verlassen möchtest (z. B. exportiert in deinem `~/.profile`), führe lokale Tests nach `source ~/.profile` aus oder verwende die Docker-Runner unten (sie können `~/.profile` in den Container einbinden).

## Deepgram live (Audio-Transkription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktivierung: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus Coding-Plan live

- Test: `src/agents/byteplus.live.test.ts`
- Aktivierung: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Optionale Modellüberschreibung: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Testet die gebündelten Comfy-Pfade für Bild, Video und `music_generate`
  - Überspringt jede Capability, außer `models.providers.comfy.<capability>` ist konfiguriert
  - Nützlich nach Änderungen an Comfy-Workflow-Einreichung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `src/image-generation/runtime.live.test.ts`
- Befehl: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Zählt jedes registrierte Plugin für Bildgenerierungs-Provider auf
  - Lädt fehlende Provider-Umgebungsvariablen vor dem Prüfen aus deiner Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt die Standardvarianten der Bildgenerierung über die gemeinsame Runtime-Capability aus:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Derzeit abgedeckte gebündelte Provider:
  - `openai`
  - `google`
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um die Auth über den Profilspeicher zu erzwingen und reine Umgebungsüberschreibungen zu ignorieren

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Testet den gemeinsamen gebündelten Provider-Pfad für Musikgenerierung
  - Deckt derzeit Google und MiniMax ab
  - Lädt Provider-Umgebungsvariablen vor dem Prüfen aus deiner Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit Eingabe nur per Prompt
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle gemeinsame Lane-Abdeckung:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um die Auth über den Profilspeicher zu erzwingen und reine Umgebungsüberschreibungen zu ignorieren

## Videogenerierung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Testet den gemeinsamen gebündelten Provider-Pfad für Videogenerierung
  - Verwendet standardmäßig den release-sicheren Smoke-Pfad: keine FAL-Provider, eine Text-zu-Video-Anfrage pro Provider, einsekündiger Lobster-Prompt und ein Provider-spezifisches Operationslimit aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, weil die Queue-Latenz auf Provider-Seite die Release-Zeit dominieren kann; übergib `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um es explizit auszuführen
  - Lädt Provider-Umgebungsvariablen vor dem Prüfen aus deiner Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt standardmäßig nur `generate` aus
  - Setze `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um auch deklarierte Transform-Modi auszuführen, wenn verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep pufferbasierte lokale Bildeingaben akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep pufferbasierte lokale Videoeingaben akzeptiert
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL erfordert
  - Provider-spezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` Text-zu-Video sowie standardmäßig eine `kling`-Lane aus, die eine Fixture mit Remote-Bild-URL verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - nur `runway`, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit Remote-Referenz-URLs per `http(s)` / MP4 erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Lane lokale pufferbasierte Eingaben verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil die aktuelle gemeinsame Lane keine Garantien für organisationsspezifischen Zugriff auf Video-Inpaint/Remix bietet
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standard-Sweep aufzunehmen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um das Operationslimit pro Provider für einen aggressiven Smoke-Lauf zu verkürzen
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um die Auth über den Profilspeicher zu erzwingen und reine Umgebungsüberschreibungen zu ignorieren

## Media-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suites für Bild, Musik und Video über einen repo-nativen Einstiegspunkt aus
  - Lädt fehlende Provider-Umgebungsvariablen automatisch aus `~/.profile`
  - Schränkt jede Suite standardmäßig automatisch auf Provider ein, die aktuell nutzbare Auth haben
  - Verwendet erneut `scripts/test-live.mjs`, damit Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-Runner (optionale „funktioniert unter Linux“-Checks)

Diese Docker-Runner sind in zwei Kategorien aufgeteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre jeweils passende Live-Datei für Profilschlüssel innerhalb des Repo-Docker-Images aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei dein lokales Konfigurationsverzeichnis und dein Workspace eingebunden werden (und `~/.profile` eingebunden und bezogen wird, wenn vorhanden). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig ein kleineres Smoke-Limit, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreibe diese Umgebungsvariablen, wenn du
  ausdrücklich den größeren vollständigen Scan möchtest.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Docker-Lanes für Live erneut.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` und `test:docker:plugins` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Live-Modell-Docker-Runner binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, sodass OAuth externer CLIs Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- MCP-Channel-Bridge (Seeded Gateway + stdio-Bridge + roher Claude-Notification-Frame-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (Installations-Smoke + `/plugin`-Alias + Neustartsemantik des Claude-Bundles): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)

Die Live-Modell-Docker-Runner binden außerdem den aktuellen Checkout schreibgeschützt ein und
stellen ihn in einem temporären Arbeitsverzeichnis innerhalb des Containers bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest weiterhin gegen deinen exakten lokalen Quellcode/deine Konfiguration ausgeführt wird.
Der Bereitstellungsschritt überspringt große lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang maschinenspezifische Artefakte
kopieren.
Außerdem setzen sie `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes im Container
keine echten Kanal-Worker für Telegram/Discord/etc. starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, gib daher
auch `OPENCLAW_LIVE_GATEWAY_*` weiter, wenn du die Gateway-Live-Abdeckung in dieser Docker-Lane
eingrenzen oder ausschließen musst.
`test:docker:openwebui` ist ein Kompatibilitäts-Smoke auf höherer Ebene: Es startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpoints,
startet einen gepinnten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über Open WebUIs Proxy `/api/chat/completions`.
Der erste Lauf kann deutlich langsamer sein, weil Docker möglicherweise erst das
Open-WebUI-Image ziehen muss und Open WebUI möglicherweise erst sein eigenes Cold-Start-Setup abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist der primäre Weg, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist bewusst deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen Seeded-Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` ausführt, und
verifiziert dann geroutete Konversationserkennung, Transkript-Lesezugriffe, Anhang-Metadaten,
Verhalten der Live-Ereigniswarteschlange, Routing ausgehender Sendungen sowie Claude-artige Kanal- +
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Notification-Prüfung
untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was die
Bridge tatsächlich ausgibt, und nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.

Manueller ACP-Thread-Smoke in Klartext (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewahre dieses Skript für Regressions-/Debug-Workflows auf. Es könnte für die Validierung des ACP-Thread-Routings erneut benötigt werden, also nicht löschen.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), eingebunden nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), eingebunden nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`), eingebunden nach `/home/node/.profile` und vor dem Ausführen der Tests bezogen
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Umgebungsvariablen zu verifizieren, die aus `OPENCLAW_PROFILE_FILE` bezogen werden, mit temporären Konfigurations-/Workspace-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`), eingebunden nach `/home/node/.npm-global` für gecachte CLI-Installationen innerhalb von Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` eingebunden und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe binden nur die benötigten Verzeichnisse/Dateien ein, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuelles Überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Komma-Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes Image `openclaw:local-live` für erneute Läufe zu verwenden, die keinen Neuaufbau benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profilspeicher kommen (nicht aus der Umgebung)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das Modell auszuwählen, das das Gateway für den Open-WebUI-Smoke bereitstellt
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Nonce-Prüf-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um den gepinnten Open-WebUI-Image-Tag zu überschreiben

## Plausibilitätsprüfung der Dokumentation

Führe nach Änderungen an der Dokumentation die Doku-Prüfungen aus: `pnpm check:docs`.
Führe die vollständige Mintlify-Anchor-Validierung aus, wenn du auch In-Page-Heading-Prüfungen brauchst: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Tool-Calling (Mock-OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + erzwungene Auth): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Mock-Tool-Calling durch das echte Gateway + den Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Assistenten-Flows, die Sitzungsverkabelung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgeführt sind, wählt der Agent den richtigen Skill aus (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Mehrturn-Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen verifizieren.

Zukünftige Evals sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Datei-Lesevorgänge und Sitzungsverkabelung zu verifizieren.
- Eine kleine Suite mit skillfokussierten Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, per Umgebung gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder registrierte Kanal
seinem Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen
eine Suite aus Form- und Verhaltensverifikationen aus. Die standardmäßige Unit-Lane `pnpm test`
überspringt diese gemeinsam genutzten Seam- und Smoke-Dateien bewusst; führe die Vertragsbefehle explizit aus,
wenn du gemeinsam genutzte Kanal- oder Provider-Oberflächen anfasst.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Zu finden unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Capabilities)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten bei Sitzungsbindung
- **outbound-payload** - Struktur der Nachrichtennutzlast
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Kanalaktionen
- **threading** - Handhabung von Thread-IDs
- **directory** - Verzeichnis-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Statusverträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probes für Kanalstatus
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Auth-Flows
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach dem Ändern von `plugin-sdk`-Exporten oder -Subpaths
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactorings bei Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und erfordern keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitfaden)

Wenn du ein Provider-/Modellproblem behebst, das in Live entdeckt wurde:

- Füge nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder Erfassen der exakten Transformation der Anfrageform)
- Wenn es inhärent nur live testbar ist (Rate Limits, Auth-Richtlinien), halte den Live-Test eng eingegrenzt und per Umgebungsvariablen opt-in
- Bevorzuge die kleinste Schicht, die den Fehler erkennt:
  - Bug bei Konvertierung/Wiedergabe von Provider-Anfragen → direkter Modelltest
  - Bug in Gateway-Sitzungs-/Verlaufs-/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Grenzschutz:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus Registry-Metadaten pro SecretRef-Klasse ein Beispielziel ab (`listSecretTargetRegistryEntries()`) und verifiziert dann, dass Traversal-Segment-Exec-IDs abgelehnt werden.
  - Wenn du eine neue SecretRef-Zielfamilie `includeInPlan` in `src/secrets/target-registry-data.ts` hinzufügst, aktualisiere `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.
