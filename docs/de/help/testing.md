---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Gateway- und Agent-Verhalten debuggen
summary: 'Test-Kit: Unit-/E2E-/Live-Suiten, Docker-Runner und was jeder Test abdeckt'
title: Testen
x-i18n:
    generated_at: "2026-04-12T23:28:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a66ea672c386094ab4a8035a082c8a85d508a14301ad44b628d2a10d9cec3a52
    source_path: help/testing.md
    workflow: 15
---

# Testen

OpenClaw hat drei Vitest-Suiten (Unit/Integration, E2E, Live) und eine kleine Gruppe von Docker-Runnern.

Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt)
- Welche Befehle Sie für typische Workflows ausführen sollten (lokal, vor dem Push, Debugging)
- Wie Live-Tests Credentials erkennen und Modelle/Provider auswählen
- Wie Sie Regressionen für reale Modell-/Provider-Probleme hinzufügen

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm test`
- Schnellere lokale Ausführung der vollständigen Suite auf einer leistungsfähigen Maschine: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting von Dateien leitet jetzt auch Pfade für Erweiterungen/Kanäle weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zunächst gezielte Ausführungen, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests anfassen oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Credentials):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine einzelne Live-Datei ohne viel Ausgabe gezielt ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tipp: Wenn Sie nur einen einzelnen fehlschlagenden Fall brauchen, sollten Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Umgebungsvariablen eingrenzen.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttest-Suiten zur Verfügung, wenn Sie die Realitätsnähe von qa-lab benötigen:

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten
    Gateway-Workern aus, bis zu 64 Worker oder die Anzahl der ausgewählten Szenarien. Verwenden Sie
    `--concurrency <count>`, um die Anzahl der Worker anzupassen, oder `--concurrency 1` für
    die ältere serielle Lane.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer kurzlebigen Multipass-Linux-VM aus.
  - Behält dasselbe Verhalten für die Szenarienauswahl wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Flags zur Provider-/Modellauswahl wie `qa suite`.
  - Live-Ausführungen leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    umgebungsbasierte Provider-Schlüssel, den Konfigurationspfad für den QA-Live-Provider und `CODEX_HOME`,
    falls vorhanden.
  - Ausgabeverzeichnisse müssen unterhalb des Repo-Roots bleiben, damit der Gast über
    den eingebundenen Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht + die Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operator-artige QA-Arbeit.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen kurzlebigen, Docker-gestützten Tuwunel-Homeserver aus.
  - Richtet drei temporäre Matrix-Benutzer (`driver`, `sut`, `observer`) sowie einen privaten Raum ein und startet dann einen QA-Gateway-Child mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das angeheftete stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreiben Sie dies mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn Sie ein anderes Image testen müssen.
  - Schreibt einen Matrix-QA-Bericht, eine Zusammenfassung und ein Artifact mit beobachteten Ereignissen unter `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe aus, wobei die Driver- und SUT-Bot-Tokens aus der Umgebung verwendet werden.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellen muss.
  - Für stabile Bot-zu-Bot-Beobachtung aktivieren Sie in `@BotFather` den Modus für Bot-zu-Bot-Kommunikation für beide Bots und stellen Sie sicher, dass der Driver-Bot den Bot-Verkehr in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artifact mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`.

Live-Transport-Lanes teilen sich einen einheitlichen Standardvertrag, damit neue Transporte nicht auseinanderdriften:

`qa-channel` bleibt die breite synthetische QA-Suite und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Antwort auf oberster Ebene | Fortsetzen nach Neustart | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl |
| -------- | ------ | -------------- | --------------- | -------------------------- | ------------------------ | ---------------- | ---------------- | -------------------- | ----------- |
| Matrix   | x      | x              | x               | x                          | x                        | x                | x                | x                    |             |
| Telegram | x      |                |                 |                            |                          |                  |                  |                      | x           |

### Einen Kanal zu QA hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Kanal.
2. Ein Szenario-Paket, das den Kanalvertrag ausübt.

Fügen Sie keinen kanalspezifischen QA-Runner hinzu, wenn der gemeinsame `qa-lab`-Runner
den Ablauf übernehmen kann.

`qa-lab` ist für die gemeinsamen Mechanismen zuständig:

- Starten und Beenden der Suite
- Worker-Parallelität
- Schreiben von Artifacts
- Berichtserstellung
- Szenarioausführung
- Kompatibilitäts-Aliasse für ältere `qa-channel`-Szenarien

Der Kanal-Adapter ist für den Transportvertrag zuständig:

- wie das Gateway für diesen Transport konfiguriert wird
- wie die Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Aufräumen behandelt wird

Die Mindestanforderung für die Einführung eines neuen Kanals ist:

1. Implementieren Sie den Transport-Adapter auf der gemeinsamen `qa-lab`-Nahtstelle.
2. Registrieren Sie den Adapter in der Transport-Registry.
3. Belassen Sie transportspezifische Mechaniken im Adapter oder im Kanal-Harness.
4. Verfassen oder passen Sie Markdown-Szenarien unter `qa/scenarios/` an.
5. Verwenden Sie die generischen Szenario-Helfer für neue Szenarien.
6. Halten Sie bestehende Kompatibilitäts-Aliasse funktionsfähig, sofern das Repo keine beabsichtigte Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn sich ein Verhalten einmalig in `qa-lab` ausdrücken lässt, platzieren Sie es in `qa-lab`.
- Wenn ein Verhalten von einem Kanaltransport abhängt, belassen Sie es in diesem Adapter oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Kanal verwenden kann, fügen Sie einen generischen Helfer hinzu statt eines kanalspezifischen Zweigs in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie das im Szenariovertrag explizit.

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

Kompatibilitäts-Aliasse bleiben für bestehende Szenarien verfügbar, darunter:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Neue Kanalarbeit sollte die generischen Helfernamen verwenden.
Kompatibilitäts-Aliasse existieren, um eine Flag-Day-Migration zu vermeiden, nicht als Modell für
das Verfassen neuer Szenarien.

## Test-Suiten (was wo läuft)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Instabilität/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: zehn sequenzielle Shard-Läufe (`vitest.full-*.config.ts`) über die vorhandenen eingegrenzten Vitest-Projekte
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
  - Nicht gezieltes `pnpm test` führt jetzt elf kleinere Shard-Konfigurationen (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen riesigen nativen Root-Projekt-Prozesses aus. Das senkt die maximale RSS auf ausgelasteten Maschinen und verhindert, dass Arbeiten an `auto-reply`/Erweiterungen nicht zusammenhängende Suiten ausbremsen.
  - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil eine Multi-Shard-Watch-Schleife nicht praktikabel ist.
  - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele jetzt zuerst durch eingegrenzte Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht den vollen Startup-Aufwand des Root-Projekts bezahlen muss.
  - `pnpm test:changed` erweitert geänderte Git-Pfade auf dieselben eingegrenzten Lanes, wenn der Diff nur routbare Quell-/Testdateien berührt; Änderungen an Konfiguration/Setup fallen weiterhin auf die breite Wiederholung des Root-Projekts zurück.
  - Import-leichte Unit-Tests aus Agents, Commands, Plugins, `auto-reply`-Hilfsmodulen, `plugin-sdk` und ähnlichen reinen Utility-Bereichen werden durch die `unit-fast`-Lane geleitet, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/laufzeitschwere Dateien bleiben auf den vorhandenen Lanes.
  - Ausgewählte `plugin-sdk`- und `commands`-Hilfsquelldateien ordnen Läufe im Changed-Modus in diesen leichten Lanes auch explizit benachbarten Tests zu, sodass Hilfsmodul-Änderungen nicht die gesamte schwere Suite für dieses Verzeichnis erneut ausführen.
  - `auto-reply` hat jetzt drei dedizierte Buckets: Top-Level-Core-Hilfsfunktionen, Top-Level-`reply.*`-Integrationstests und den Teilbaum `src/auto-reply/reply/**`. Dadurch bleibt die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests getrennt.
- Hinweis zum eingebetteten Runner:
  - Wenn Sie Discovery-Eingaben für Nachrichtentools oder den Laufzeitkontext von Compaction ändern,
    halten Sie beide Abdeckungsebenen bei.
  - Fügen Sie fokussierte Hilfsmodul-Regressionen für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halten Sie außerdem die eingebetteten Runner-Integrationssuiten funktionsfähig:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suiten verifizieren, dass eingegrenzte IDs und Compaction-Verhalten weiterhin
    durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Hilfsmodul-Tests sind
    kein ausreichender Ersatz für diese Integrationspfade.
- Hinweis zum Pool:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration setzt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner über die Root-Projekte, E2E- und Live-Konfigurationen hinweg.
  - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft jetzt aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
  - Jeder `pnpm test`-Shard erbt dieselben Standardwerte `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt jetzt standardmäßig auch `--no-maglev` für Vitest-Child-Node-Prozesse hinzu, um V8-Kompilierungsaufwand bei großen lokalen Läufen zu reduzieren. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn Sie mit dem Standardverhalten von V8 vergleichen möchten.
- Hinweis zur schnellen lokalen Iteration:
  - `pnpm test:changed` leitet durch eingegrenzte Lanes, wenn sich die geänderten Pfade sauber einer kleineren Suite zuordnen lassen.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einer höheren Worker-Obergrenze.
  - Die automatische lokale Worker-Skalierung ist jetzt bewusst konservativ und fährt auch dann zurück, wenn die Host-Load-Average bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als `forceRerunTriggers`, damit Wiederholungen im Changed-Modus korrekt bleiben, wenn sich das Test-Wiring ändert.
  - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Pfad für direktes Profiling möchten.
- Hinweis zum Performance-Debugging:
  - `pnpm test:perf:imports` aktiviert die Berichterstattung zu Vitest-Importdauer sowie die Ausgabe der Import-Aufschlüsselung.
  - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht das geroutete `test:changed` mit dem nativen Root-Projekt-Pfad für diesen festgeschriebenen Diff und gibt Wall-Time sowie macOS-Max-RSS aus.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen verschmutzten Tree, indem die Liste geänderter Dateien durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für Vitest/Vite-Startup und Transform-Overhead.
  - `pnpm test:perf:profile:runner` schreibt CPU-+Heap-Profile des Runners für die Unit-Suite bei deaktivierter Dateiparallelität.

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Laufzeitstandardwerte:
  - Verwendet Vitest `threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um den Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Anzahl der Worker zu erzwingen (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten von Gateway mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwereres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `test/openshell-sandbox.e2e.test.ts`
- Umfang:
  - Startet ein isoliertes OpenShell-Gateway auf dem Host über Docker
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Übt OpenClaws OpenShell-Backend über echtes `sandbox ssh-config` + SSH-Exec aus
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur opt-in; nicht Teil des standardmäßigen Laufs `pnpm test:e2e`
  - Erfordert ein lokales `openshell`-CLI sowie einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört dann Test-Gateway und Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript zu verweisen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Credentials?“
  - Erkennt Provider-Formatänderungen, Tool-Calling-Eigenheiten, Auth-Probleme und Verhalten bei Rate Limits
- Erwartungen:
  - Bewusst nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Bevorzugen Sie eingegrenzte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel aufzugreifen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Die Ausgabe des Fortschritts `[live] ...` bleibt erhalten, aber der zusätzliche Hinweis zu `~/.profile` sowie Gateway-Bootstrap-Logs/Bonjour-Ausgaben werden unterdrückt. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startup-Logs wieder sehen möchten.
- API-Key-Rotation (providerspezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder einen Live-spezifischen Override über `OPENCLAW_LIVE_*_KEY`; Tests wiederholen bei Antworten mit Rate Limit.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suiten geben jetzt Fortschrittszeilen auf stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, selbst wenn die Konsolenerfassung von Vitest ruhig ist.
  - `vitest.live.config.ts` deaktiviert die Vitest-Konsoleninterzeption, sodass Fortschrittszeilen von Provider/Gateway bei Live-Läufen sofort gestreamt werden.
  - Stimmen Sie direkte Modell-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Networking / WS-Protokoll / Pairing anfassen: zusätzlich `pnpm test:e2e` ausführen
- „Mein Bot ist down“ / providerspezifische Fehler / Tool-Calling debuggen: ein eingegrenztes `pnpm test:live` ausführen

## Live: Android-Node-Capability-Sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell beworbenen** Befehl eines verbundenen Android-Node aufrufen und das Vertragsverhalten des Befehls validieren.
- Umfang:
  - Voraussetzungen/manuelles Setup (die Suite installiert/startet/pairt die App nicht).
  - Gateway-Validierung von `node.invoke` Befehl für Befehl für den ausgewählten Android-Node.
- Erforderliches Vorab-Setup:
  - Android-App bereits mit dem Gateway verbunden + gepairt.
  - App im Vordergrund halten.
  - Berechtigungen/Erfassungszustimmung für Capabilities erteilen, deren Bestehen Sie erwarten.
- Optionale Ziel-Overrides:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Android-Setup-Details: [Android-App](/de/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit wir Fehler isolieren können:

- „Direct model“ sagt uns, ob der Provider/das Modell mit dem angegebenen Schlüssel überhaupt antworten kann.
- „Gateway smoke“ sagt uns, ob die vollständige Gateway-+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modell-Completion (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - `getApiKeyForModel` verwenden, um Modelle auszuwählen, für die Sie Credentials haben
  - Eine kleine Completion pro Modell ausführen (und gezielte Regressionen, wo nötig)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (Komma-Allowlist)
  - Modern-/All-Sweeps verwenden standardmäßig eine kuratierte Obergrenze mit hohem Signal; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für eine kleinere Obergrenze.
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (Komma-Allowlist)
- Woher Schlüssel kommen:
  - Standardmäßig: Profile Store und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur** den Profile Store zu erzwingen
- Warum es das gibt:
  - Trennt „Provider-API ist kaputt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI Responses/Codex Responses Reasoning-Replay + Tool-Call-Flows)

### Ebene 2: Gateway- + Dev-Agent-Smoke (das, was `@openclaw` tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway starten
  - Eine Sitzung `agent:dev:*` erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit Schlüsseln durchlaufen und Folgendes prüfen:
    - „sinnvolle“ Antwort (ohne Tools)
    - eine echte Tool-Ausführung funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Probe-Details (damit Sie Fehler schnell erklären können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agenten auf, sie zu `read`en und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agenten auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann per `read` wieder zurückzulesen.
  - Image-Probe: Der Test hängt ein generiertes PNG an (Katze + randomisierter Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder Komma-Liste) setzen, um einzugrenzen
  - Moderne/All-Gateway-Sweeps verwenden standardmäßig eine kuratierte Obergrenze mit hohem Signal; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für eine kleinere Obergrenze.
- Providerauswahl (vermeiden Sie „alles über OpenRouter“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (Komma-Allowlist)
- Tool- + Image-Probes sind in diesem Live-Test immer aktiviert:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Image-Probe läuft, wenn das Modell Unterstützung für Bildeingaben bewirbt
  - Ablauf (allgemein):
    - Test generiert ein kleines PNG mit „CAT“ + zufälligem Code (`src/gateway/live-image-probe.ts`)
    - Sendet es über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Der eingebettete Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Assertion: Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler sind erlaubt)

Tipp: Um zu sehen, was Sie auf Ihrer Maschine testen können (und die genauen IDs `provider/model`), führen Sie aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway- + Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu berühren.
- Backend-spezifische Smoke-Standardwerte befinden sich in der Definition `cli-backend.ts` der besitzenden Erweiterung.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardwerte:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Verhalten von Command/Args/Image kommt aus den Metadaten des besitzenden CLI-Backend-Plugin.
- Overrides (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Args statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Image-Args übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Flow zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, um die standardmäßige Kontinuitätsprobe innerhalb derselben Sitzung von Claude Sonnet -> Opus zu deaktivieren (auf `1` setzen, um sie zu erzwingen, wenn das ausgewählte Modell ein Wechselziel unterstützt).

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

- Der Docker-Runner befindet sich unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den Live-CLI-Backend-Smoke im Repo-Docker-Image als nicht-root-Benutzer `node` aus.
- Er löst CLI-Smoke-Metadaten aus der besitzenden Erweiterung auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein gecachtes beschreibbares Prefix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` auf (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable Claude Code Subscription-OAuth über entweder `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es weist zuerst direktes `claude -p` in Docker nach und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-Key-Umgebungsvariablen beizubehalten. Diese Subscription-Lane deaktiviert standardmäßig die Claude-MCP-/Tool- und Image-Probes, da Claude derzeit die Nutzung von Drittanbieter-Apps über zusätzliche Nutzungsabrechnung statt über normale Limits von Subscription-Plänen abrechnet.
- Der Live-CLI-Backend-Smoke übt jetzt denselben End-to-End-Ablauf für Claude, Codex und Gemini aus: Text-Turn, Bildklassifizierungs-Turn, dann MCP-`cron`-Tool-Call, verifiziert über die Gateway-CLI.
- Claudes standardmäßiger Smoke patcht die Sitzung außerdem von Sonnet auf Opus und verifiziert, dass die fortgesetzte Sitzung sich weiterhin an eine frühere Notiz erinnert.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Konversations-Bind-Flow mit einem Live-ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Konversation an Ort und Stelle binden
  - ein normales Follow-up in derselben Konversation senden
  - verifizieren, dass das Follow-up im gebundenen ACP-Sitzungstranskript landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agenten in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Slack-DM-artiger Konversationskontext
  - ACP-Backend: `acpx`
- Overrides:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit admin-only synthetischen Feldern der Originating-Route, damit Tests Message-Channel-Kontext anhängen können, ohne vorzugeben, extern zuzustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die integrierte Agent-Registry des eingebetteten `acpx`-Plugin für den ausgewählten ACP-Harness-Agenten.

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

- Der Docker-Runner befindet sich unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen alle unterstützten Live-CLI-Agenten aus: `claude`, `codex`, dann `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, um die Matrix einzugrenzen.
- Er sourct `~/.profile`, stellt das passende CLI-Auth-Material im Container bereit, installiert `acpx` in ein beschreibbares npm-Prefix und installiert dann das angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`), falls es fehlt.
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit `acpx` Provider-Umgebungsvariablen aus dem gesourcten Profil für das untergeordnete Harness-CLI verfügbar hält.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: das Plugin-eigene Codex-Harness über die normale Gateway-
  `agent`-Methode validieren:
  - das gebündelte `codex`-Plugin laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agent-Turn an `codex/gpt-5.4` senden
  - einen zweiten Turn an dieselbe OpenClaw-Sitzung senden und verifizieren, dass der App-Server-Thread
    fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Command-
    Pfad ausführen
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `codex/gpt-5.4`
- Optionale Image-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Der Smoke setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, sodass ein kaputtes Codex-
  Harness nicht bestehen kann, indem es stillschweigend auf PI zurückfällt.
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

- Der Docker-Runner befindet sich unter `scripts/test-live-codex-harness-docker.sh`.
- Er sourct das eingebundene `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert Codex-CLI-
  Auth-Dateien, falls vorhanden, installiert `@openai/codex` in ein beschreibbares eingebundenes npm-
  Prefix, stellt den Quellbaum bereit und führt dann nur den Live-Test für das Codex-Harness aus.
- Docker aktiviert standardmäßig die Image- und MCP-/Tool-Probes. Setzen Sie
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, wenn Sie einen enger eingegrenzten Debug-Lauf benötigen.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend zur Live-
  Testkonfiguration, damit `openai-codex/*`- oder PI-Fallback einen Codex-Harness-
  Regressionsfehler nicht verbergen kann.

### Empfohlene Live-Rezepte

Enge, explizite Allowlists sind am schnellsten und am wenigsten anfällig:

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
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-artiger Agent-Endpunkt).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf Ihrer Maschine (separate Auth + Tooling-Eigenheiten).
- Gemini-API vs. Gemini-CLI:
  - API: OpenClaw ruft Googles gehostete Gemini-API über HTTP auf (API-Schlüssel / Profil-Auth); das ist es, was die meisten Benutzer mit „Gemini“ meinen.
  - CLI: OpenClaw ruft eine lokale `gemini`-Binärdatei auf; sie hat ihre eigene Authentifizierung und kann sich anders verhalten (Streaming/Tool-Unterstützung/Versionsabweichung).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einer Entwicklermaschine mit Schlüsseln abgedeckt werden sollten.

### Modernes Smoke-Set (Tool-Calling + Bild)

Das ist der Lauf für die „üblichen Modelle“, von dem wir erwarten, dass er weiterhin funktioniert:

- OpenAI (nicht Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini-API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Basislinie: Tool-Calling (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder die neueste verfügbare Version)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell, das Sie aktiviert haben)
- Cerebras: `cerebras/`… (falls Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool-Calling hängt vom API-Modus ab)

### Vision: Bild senden (Anhang → multimodale Nachricht)

Nehmen Sie mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude/Gemini/OpenAI-Varianten mit Vision-Unterstützung usw.), um die Image-Probe auszuüben.

### Aggregatoren / alternative Gateways

Wenn Sie Schlüssel dafür aktiviert haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (hunderte Modelle; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool-+Bild-Unterstützung zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Auth über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Credentials/Konfiguration haben):

- Integriert: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuchen Sie nicht, „alle Modelle“ in der Dokumentation fest zu verdrahten. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrer Maschine zurückgibt + die verfügbaren Schlüssel.

## Credentials (niemals committen)

Live-Tests erkennen Credentials auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „no creds“ meldet, debuggen Sie genauso, wie Sie `openclaw models list` / Modellauswahl debuggen würden.

- Auth-Profile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist es, was in den Live-Tests mit „profile keys“ gemeint ist)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-State-Verzeichnis: `~/.openclaw/credentials/` (wird in das bereitgestellte Live-Test-Home kopiert, wenn vorhanden, ist aber nicht der Hauptspeicher für Profilschlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, `auth-profiles.json`-Dateien pro Agent, das Legacy-Verzeichnis `credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; bereitgestellte Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfad-Overrides für `agents.*.workspace` / `agentDir` werden entfernt, damit Probes nicht Ihren echten Host-Workspace verwenden.

Wenn Sie sich auf Env-Schlüssel verlassen möchten (z. B. in Ihrem `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus oder verwenden Sie die Docker-Runner unten (sie können `~/.profile` in den Container einbinden).

## Deepgram live (Audiotranskription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktivierung: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus Coding-Plan live

- Test: `src/agents/byteplus.live.test.ts`
- Aktivierung: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Optionaler Modell-Override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Übt die gebündelten Bild-, Video- und `music_generate`-Pfade von comfy aus
  - Überspringt jede Capability, sofern `models.providers.comfy.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an comfy-Workflow-Übermittlung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `src/image-generation/runtime.live.test.ts`
- Befehl: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Zählt jedes registrierte Plugin für Bildgenerierungs-Provider auf
  - Lädt vor dem Prüfen fehlende Provider-Umgebungsvariablen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Credentials nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt die Standardvarianten der Bildgenerierung über die gemeinsame Laufzeit-Capability aus:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Profile-Store-Auth zu erzwingen und rein umgebungsbasierte Overrides zu ignorieren

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Übt den gemeinsamen gebündelten Pfad für Musikgenerierungs-Provider aus
  - Deckt derzeit Google und MiniMax ab
  - Lädt vor dem Prüfen Provider-Umgebungsvariablen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Credentials nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt beide deklarierten Laufzeitmodi aus, wenn verfügbar:
    - `generate` mit reiner Prompt-Eingabe
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung in der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Profile-Store-Auth zu erzwingen und rein umgebungsbasierte Overrides zu ignorieren

## Videogenerierung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Übt den gemeinsamen gebündelten Pfad für Videogenerierungs-Provider aus
  - Lädt vor dem Prüfen Provider-Umgebungsvariablen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Credentials nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt beide deklarierten Laufzeitmodi aus, wenn verfügbar:
    - `generate` mit reiner Prompt-Eingabe
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell in dem gemeinsamen Sweep buffer-gestützte lokale Bildeingaben akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell in dem gemeinsamen Sweep buffer-gestützte lokale Videoeingaben akzeptiert
  - Aktuelle im gemeinsamen Sweep deklarierte, aber übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL erfordert
  - Provider-spezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` für Text-zu-Video sowie eine `kling`-Lane aus, die standardmäßig ein Fixture mit Remote-Bild-URL verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - `runway` nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuelle im gemeinsamen Sweep deklarierte, aber übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit Referenz-URLs vom Typ `http(s)` / MP4 erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Lane lokale buffer-gestützte Eingaben verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil der aktuellen gemeinsamen Lane Garantien für organisationsspezifischen Zugriff auf Video-Inpainting/Remix fehlen
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Profile-Store-Auth zu erzwingen und rein umgebungsbasierte Overrides zu ignorieren

## Media-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suiten für Bild, Musik und Video über einen repo-nativen Einstiegspunkt aus
  - Lädt fehlende Provider-Umgebungsvariablen automatisch aus `~/.profile`
  - Grenzt standardmäßig jede Suite automatisch auf Provider ein, die derzeit nutzbare Auth besitzen
  - Verwendet erneut `scripts/test-live.mjs`, sodass Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre jeweils passende Live-Datei mit Profilschlüsseln innerhalb des Repo-Docker-Images aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace eingebunden werden (und `~/.profile` gesourct wird, falls eingebunden). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Env-Variablen, wenn Sie
  ausdrücklich den größeren vollständigen Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Docker-Live-Lanes erneut.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` und `test:docker:plugins` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, damit externes CLI-OAuth Tokens aktualisieren kann, ohne den Auth-Store des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- MCP-Kanal-Bridge (seeded Gateway + stdio-Bridge + roher Claude-Benachrichtigungsframe-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (Install-Smoke + `/plugin`-Alias + Neustartsemantik für Claude-Bundle): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)

Die Docker-Runner für Live-Modelle binden den aktuellen Checkout außerdem schreibgeschützt ein und
stellen ihn innerhalb des Containers in ein temporäres Arbeitsverzeichnis bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest weiterhin gegen Ihren exakten lokalen Quellcode/Ihre Konfiguration ausgeführt wird.
Der Bereitstellungsschritt überspringt große lokale Caches und Build-Ausgaben von Apps wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht Minuten mit dem Kopieren
maschinenspezifischer Artefakte verbringen.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes im Container
keine echten Telegram-/Discord-/usw.-Kanal-Worker starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, also geben Sie
auch `OPENCLAW_LIVE_GATEWAY_*` weiter, wenn Sie die Gateway-
Live-Abdeckung in dieser Docker-Lane eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein Compatibility-Smoke auf höherer Ebene: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen angehefteten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann spürbar langsamer sein, weil Docker möglicherweise das
Open-WebUI-Image ziehen muss und Open WebUI möglicherweise erst seinen eigenen Kaltstart abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist der primäre Weg, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben ein kleines JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist bewusst deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen seeded Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` aufruft, und
verifiziert dann Routing für Konversationserkennung, Lesen von Transkripten, Anhangsmetadaten,
Verhalten der Live-Ereigniswarteschlange, Routing ausgehender Sends sowie Claude-artige Kanal- +
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was die
Bridge tatsächlich ausgibt, und nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.

Manueller ACP-Plain-Language-Thread-Smoke (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows. Es könnte für die Validierung des ACP-Thread-Routings erneut benötigt werden, also nicht löschen.

Nützliche Env-Variablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) eingebunden nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) eingebunden nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) eingebunden nach `/home/node/.profile` und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) eingebunden nach `/home/node/.npm-global` für gecachte CLI-Installationen innerhalb von Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` eingebunden und dann vor dem Start der Tests nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe binden nur die benötigten Verzeichnisse/Dateien ein, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Komma-Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes Image `openclaw:local-live` für Wiederholungsläufe zu verwenden, die keinen Neuaufbau benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Credentials aus dem Profile Store kommen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Prompt für die Nonce-Prüfung zu überschreiben
- `OPENWEBUI_IMAGE=...`, um den angehefteten Tag des Open-WebUI-Images zu überschreiben

## Doku-Sanity

Führen Sie nach Doku-Änderungen Doku-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anchor-Validierung aus, wenn Sie zusätzlich In-Page-Überschriftenprüfungen benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Tool-Calling (Mock OpenAI, echtes Gateway + echte Agent-Schleife): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeitsevals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeitsevals“ verhalten:

- Mock-Tool-Calling über das echte Gateway + die echte Agent-Schleife (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenabläufe, die Sitzungsverdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsverhalten:** Wenn Skills im Prompt aufgelistet sind, wählt der Agent dann den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt erforderliche Schritte/Args?
- **Workflow-Verträge:** Multi-Turn-Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Datei-Lesevorgänge und Sitzungsverdrahtung zu prüfen.
- Eine kleine Suite skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt Injection).
- Optionale Live-Evals (opt-in, env-gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite von
Form- und Verhaltens-Assertions aus. Die standardmäßige Unit-Lane `pnpm test`
überspringt diese gemeinsamen Nahtstellen- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsame Kanal- oder Provider-Oberflächen ändern.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Befinden sich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Capabilities)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten der Sitzungsbindung
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Kanalaktionen
- **threading** - Verarbeitung von Thread-IDs
- **directory** - API für Verzeichnis/Roster
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Statusverträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Status-Probes für Kanäle
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Auth-Flows
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Discovery
- **loader** - Plugin-Laden
- **runtime** - Provider-Laufzeit
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an `plugin-sdk`-Exports oder Subpaths
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugin
- Nach Refactorings an Plugin-Registrierung oder Discovery

Vertragstests laufen in CI und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitfaden)

Wenn Sie ein in Live entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock/Stub-Provider oder erfassen Sie die exakte Transformation der Request-Form)
- Wenn es von Natur aus nur live testbar ist (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test eng eingegrenzt und über Env-Variablen opt-in
- Zielen Sie bevorzugt auf die kleinste Ebene, die den Fehler erkennt:
  - Fehler bei Provider-Request-Konvertierung/-Replay → direkter Modelltst
  - Fehler in Gateway-Sitzung/Verlauf/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Guardrail für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ein Beispielziel pro SecretRef-Klasse ab und prüft dann, dass Exec-IDs von Traversal-Segmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue Ziel-Familie für `includeInPlan`-SecretRef hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.
