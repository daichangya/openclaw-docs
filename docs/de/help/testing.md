---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionen für Modell-/Provider-Fehler hinzufügen
    - Gateway- und Agent-Verhalten debuggen
summary: 'Test-Kit: Unit-/E2E-/Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Tests
x-i18n:
    generated_at: "2026-04-23T14:55:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbec4996699577321116c94f60c01d205d7594ed41aca27c821f1c3d65a7dca3
    source_path: help/testing.md
    workflow: 15
---

# Tests

OpenClaw hat drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Gruppe von Docker-Runnern.

Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt)
- Welche Befehle für gängige Workflows auszuführen sind (lokal, vor dem Push, Debugging)
- Wie Live-Tests Anmeldedaten erkennen und Modelle/Provider auswählen
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einem leistungsfähigen Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting von Dateien leitet jetzt auch Erweiterungs-/Kanal-Pfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzuge zuerst gezielte Läufe, wenn du an einem einzelnen Fehler arbeitest.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn du Tests anfasst oder zusätzliche Sicherheit möchtest:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Image-Probes): `pnpm test:live`
- Eine einzelne Live-Datei ohne viel Ausgabe ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Dateilese-artige Probe aus.
    Modelle, deren Metadaten `image`-Eingabe ausweisen, führen auch einen kleinen Image-Turn aus.
    Deaktiviere die zusätzlichen Probes mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn du Provider-Fehler isolierst.
  - CI-Abdeckung: Das tägliche `OpenClaw Scheduled Live And E2E Checks` und die manuell
    ausgelösten `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, der separate Docker-Live-Modell-Matrix-Jobs umfasst,
    geshardet nach Provider.
  - Für gezielte CI-Neustarts dispatch `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Füge neue hochsignifikante Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie zu `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten/Release-Callern hinzu.
- Moonshot/Kimi-Kosten-Smoke: Wenn `MOONSHOT_API_KEY` gesetzt ist, führe
  `openclaw models list --provider moonshot --json` aus und dann ein isoliertes
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifiziere, dass das JSON Moonshot/K2.6 meldet und das
  Assistant-Transkript normalisiertes `usage.cost` speichert.

Tipp: Wenn du nur einen einzelnen fehlschlagenden Fall brauchst, bevorzuge das Eingrenzen von Live-Tests über die unten beschriebenen Allowlist-Umgebungsvariablen.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttest-Suites bereit, wenn du mehr QA-Lab-Realismus brauchst:

CI führt QA Lab in dedizierten Workflows aus. `Parity gate` läuft bei passenden PRs und
bei manuellem Dispatch mit Mock-Providern. `QA-Lab - All Lanes` läuft nachts auf
`main` und bei manuellem Dispatch mit dem Mock-Parity-Gate, der Live-Matrix-Lane und
der Convex-verwalteten Live-Telegram-Lane als parallele Jobs. `OpenClaw Release Checks`
führt dieselben Lanes vor der Release-Freigabe aus.

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Concurrency 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwende `--concurrency <count>`, um die Worker-Anzahl
    anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Beendet sich mit einem Fehlercode ungleich null, wenn irgendein Szenario fehlschlägt. Verwende `--allow-failures`, wenn du
    Artefakte ohne fehlschlagenden Exit-Code möchtest.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite innerhalb einer flüchtigen Multipass-Linux-VM aus.
  - Behält dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    umgebungsvariablenbasierte Provider-Keys, den Pfad zur QA-Live-Provider-Konfiguration und `CODEX_HOME`,
    falls vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über
    den gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht + die Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorartige QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut ein npm-Tarball aus dem aktuellen Checkout, installiert es global in
    Docker, führt nicht-interaktives Onboarding mit OpenAI-API-Key aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass das Aktivieren des Plugins Laufzeitabhängigkeiten bei Bedarf installiert,
    führt doctor aus und führt einen lokalen Agent-Turn gegen einen gemockten OpenAI-Endpunkt aus.
  - Verwende `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Lane für paketierte Installationen
    mit Discord auszuführen.
- `pnpm test:docker:bundled-channel-deps`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Kanal-/Plugins über Konfigurationsänderungen.
  - Verifiziert, dass die Setup-Erkennung die Laufzeitabhängigkeiten nicht konfigurierter Plugins
    nicht installiert, dass der erste konfigurierte Gateway- oder doctor-Lauf jeweils die
    Laufzeitabhängigkeiten gebündelter Plugins bei Bedarf installiert und dass ein zweiter Neustart keine
    bereits aktivierten Abhängigkeiten erneut installiert.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und verifiziert, dass der doctor des Kandidaten nach dem
    Update Laufzeitabhängigkeiten gebündelter Kanäle ohne postinstall-Reparatur auf Harness-Seite repariert.
- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen flüchtigen, Docker-gestützten Tuwunel-Homeserver aus.
  - Dieser QA-Host ist heute nur für Repo/Dev gedacht. Paketierte OpenClaw-Installationen liefern
    `qa-lab` nicht mit aus, daher stellen sie `openclaw qa` nicht bereit.
  - Repo-Checkouts laden den gebündelten Runner direkt; kein separater Plugin-Installationsschritt
    ist nötig.
  - Stellt drei temporäre Matrix-Benutzer (`driver`, `sut`, `observer`) plus einen privaten Raum bereit und startet dann einen QA-Gateway-Child mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das angeheftete stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreibe es mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn du ein anderes Image testen musst.
  - Matrix stellt keine gemeinsamen Credential-Source-Flags bereit, weil die Lane lokal flüchtige Benutzer bereitstellt.
  - Schreibt einen Matrix-QA-Bericht, eine Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes stdout/stderr-Ausgabelog unter `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe aus, unter Verwendung der Driver- und SUT-Bot-Tokens aus der Umgebung.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Anmeldedaten. Verwende standardmäßig den Env-Modus oder setze `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Beendet sich mit einem Fehlercode ungleich null, wenn irgendein Szenario fehlschlägt. Verwende `--allow-failures`, wenn du
    Artefakte ohne fehlschlagenden Exit-Code möchtest.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellen muss.
  - Für stabile Beobachtung von Bot-zu-Bot-Kommunikation aktiviere in `@BotFather` den Bot-to-Bot Communication Mode für beide Bots und stelle sicher, dass der Driver-Bot Bot-Traffic in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten RTT von der Driver-Sendeanfrage bis zur beobachteten SUT-Antwort.

Live-Transport-Lanes verwenden einen gemeinsamen Standardvertrag, damit neue Transports nicht auseinanderdriften:

`qa-channel` bleibt die breite synthetische QA-Suite und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Antwort auf oberster Ebene | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Beobachtung von Reaktionen | Help-Befehl |
| -------- | ------ | -------------- | --------------- | -------------------------- | -------------------- | ---------------- | ---------------- | -------------------------- | ------------ |
| Matrix   | x      | x              | x               | x                          | x                    | x                | x                | x                          |              |
| Telegram | x      |                |                 |                            |                      |                  |                  |                            | x            |

### Gemeinsam genutzte Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, erwirbt QA lab ein exklusives Lease aus einem Convex-gestützten Pool, sendet
Heartbeat für dieses Lease, während die Lane läuft, und gibt das Lease beim Herunterfahren wieder frei.

Referenz-Scaffold für Convex-Projekte:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Credential-Rolle:
  - CLI: `--credential-role maintainer|ci`
  - Standardwert aus der Umgebung: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt loopback-`http://`-Convex-URLs für rein lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Maintainer-Admin-Befehle (Pool hinzufügen/entfernen/listen) erfordern
explizit `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Helfer für Maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwende `--json` für maschinenlesbare Ausgabe in Skripten und CI-Utilities.

Standard-Endpunktvertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (nur mit Maintainer-Secret)
  - Anfrage: `{ kind, actorId, payload, note?, status? }`
  - Erfolg: `{ status: "ok", credential }`
- `POST /admin/remove` (nur mit Maintainer-Secret)
  - Anfrage: `{ credentialId, actorId }`
  - Erfolg: `{ status: "ok", changed, credential }`
  - Schutz bei aktivem Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur mit Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für Telegram-Art:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine numerische Telegram-Chat-ID als String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und weist fehlerhafte Payloads zurück.

### Einen Kanal zu QA hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Kanal.
2. Ein Szenario-Pack, das den Kanalvertrag ausübt.

Füge keinen neuen Top-Level-QA-Befehls-Root hinzu, wenn der gemeinsame `qa-lab`-Host
den Ablauf übernehmen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- den Befehls-Root `openclaw qa`
- Start und Stopp der Suite
- Worker-Concurrency
- Schreiben von Artefakten
- Berichtsgenerierung
- Szenarioausführung
- Kompatibilitäts-Aliasse für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Root eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transport-spezifisches Zurücksetzen oder Cleanup behandelt wird

Die minimale Einstiegshürde für einen neuen Kanal ist:

1. Behalte `qa-lab` als Besitzer des gemeinsamen `qa`-Roots.
2. Implementiere den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Seam.
3. Halte transport-spezifische Mechaniken im Runner-Plugin oder Kanal-Harness.
4. Hänge den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren.
   Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren.
   Halte `runtime-api.ts` schlank; lazy CLI- und Runner-Ausführung sollte hinter separaten Entry-Points bleiben.
5. Verfasse oder passe Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/` an.
6. Verwende die generischen Szenario-Helfer für neue Szenarien.
7. Halte bestehende Kompatibilitäts-Aliasse funktionsfähig, sofern das Repo keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn ein Verhalten einmalig in `qa-lab` ausgedrückt werden kann, gehört es in `qa-lab`.
- Wenn ein Verhalten von einem Kanaltransport abhängt, halte es im zugehörigen Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit braucht, die mehr als ein Kanal nutzen kann, füge einen generischen Helfer hinzu statt eines kanal-spezifischen Zweigs in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halte das Szenario transport-spezifisch und mache das im Szenariovertrag explizit.

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

Neue Kanal-Arbeit sollte die generischen Helfernamen verwenden.
Kompatibilitäts-Aliasse existieren, um eine Flag-Day-Migration zu vermeiden, nicht als Modell für
neue Szenario-Erstellung.

## Test-Suites (was wo läuft)

Betrachte die Suites als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: nicht gezielte Läufe verwenden das Shard-Set `vitest.full-*.config.ts` und können Multi-Project-Shards für parallele Planung in projektweise Konfigurationen aufteilen
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` und die in `vitest.unit.config.ts` zugelassenen `ui`-Node-Tests
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Keys erforderlich
  - Sollte schnell und stabil sein
- Hinweis zu Projekten:
  - Nicht gezieltes `pnpm test` führt jetzt zwölf kleinere Shard-Konfigurationen aus (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines riesigen nativen Root-Project-Prozesses. Das senkt Peak-RSS auf ausgelasteten Rechnern und verhindert, dass Auto-Reply-/Erweiterungs-Arbeit nicht verwandte Suites ausbremst.
  - `pnpm test --watch` verwendet weiterhin den nativen Root-Project-Graphen aus `vitest.config.ts`, weil eine Multi-Shard-Watch-Schleife nicht praktikabel ist.
  - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnis-Targets zuerst durch eingegrenzte Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die gesamten Startup-Kosten des Root-Projekts zahlen muss.
  - `pnpm test:changed` erweitert geänderte Git-Pfade in dieselben eingegrenzten Lanes, wenn der Diff nur routbare Quell-/Testdateien berührt; Konfigurations-/Setup-Änderungen fallen weiterhin auf den breiten Root-Project-Rerun zurück.
  - `pnpm check:changed` ist das normale smarte lokale Gate für enge Änderungen. Es klassifiziert den Diff in Core, Core-Tests, Erweiterungen, Erweiterungstests, Apps, Docs, Release-Metadaten und Tooling und führt dann die passenden Typecheck-/Lint-/Test-Lanes aus. Änderungen an der öffentlichen Plugin SDK und an Plugin-Verträgen umfassen Erweiterungsvalidierung, weil Erweiterungen von diesen Core-Verträgen abhängen. Reine Versionserhöhungen in Release-Metadaten führen gezielte Version-/Konfigurations-/Root-Dependency-Prüfungen aus statt der vollständigen Suite, mit einer Schutzmaßnahme, die Paketänderungen außerhalb des Versionsfelds auf Top-Level zurückweist.
  - Import-leichte Unit-Tests aus Agents, Commands, Plugins, Auto-Reply-Helpern, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen über die Lane `unit-fast`, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/laufzeitintensive Dateien bleiben auf den bestehenden Lanes.
  - Ausgewählte Helper-Quelldateien aus `plugin-sdk` und `commands` mappen Changed-Mode-Läufe auch auf explizite Schwester-Tests in diesen leichten Lanes, sodass Helper-Edits vermeiden, die vollständige schwere Suite für dieses Verzeichnis erneut auszuführen.
  - `auto-reply` hat jetzt drei dedizierte Buckets: Top-Level-Core-Helper, Top-Level-Integrationstests `reply.*` und den Unterbaum `src/auto-reply/reply/**`. Das hält die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests fern.
- Hinweis zum eingebetteten Runner:
  - Wenn du Eingaben für die Message-Tool-Erkennung oder den Laufzeitkontext von Compaction änderst,
    behalte beide Ebenen der Abdeckung bei.
  - Füge fokussierte Helper-Regressionen für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halte auch die eingebetteten Runner-Integrations-Suites gesund:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suites verifizieren, dass gescopte IDs und Compaction-Verhalten weiterhin
    durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Helper-Tests sind kein
    ausreichender Ersatz für diese Integrationspfade.
- Hinweis zu Pools:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration setzt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner über Root-Projekte, E2E- und Live-Konfigurationen hinweg.
  - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer, läuft jetzt aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
  - Jeder `pnpm test`-Shard übernimmt dieselben Standards `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt jetzt standardmäßig auch `--no-maglev` für Vitest-Child-Node-Prozesse hinzu, um V8-Kompilierungs-Churn bei großen lokalen Läufen zu reduzieren. Setze `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn du mit Standard-V8-Verhalten vergleichen musst.
- Hinweis zur schnellen lokalen Iteration:
  - `pnpm changed:lanes` zeigt, welche architektonischen Lanes ein Diff auslöst.
  - Der Pre-Commit-Hook führt `pnpm check:changed --staged` nach Staged-Formatierung/Linting aus, sodass reine Core-Commits keine Kosten für Erweiterungstests verursachen, sofern sie keine öffentlichen, erweiterungsseitigen Verträge berühren. Commits mit nur Release-Metadaten bleiben auf der gezielten Version-/Konfigurations-/Root-Dependency-Lane.
  - Wenn der exakte gestagte Änderungssatz bereits mit gleich starken oder stärkeren Gates validiert wurde, verwende `scripts/committer --fast "<message>" <files...>`, um nur den Changed-Scope-Hook-Rerun zu überspringen. Gestagte Formatierung/Linting laufen weiterhin. Erwähne die abgeschlossenen Gates in deiner Übergabe. Das ist auch akzeptabel, nachdem ein isolierter flaky Hook-Fehler erneut ausgeführt wurde und mit eingegrenztem Nachweis bestanden hat.
  - `pnpm test:changed` routet durch eingegrenzte Lanes, wenn die geänderten Pfade sauber auf eine kleinere Suite abgebildet werden.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einem höheren Worker-Limit.
  - Die automatische Skalierung lokaler Worker ist jetzt absichtlich konservativ und fährt auch zurück, wenn die Host-Load-Average bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als `forceRerunTriggers`, damit Changed-Mode-Reruns korrekt bleiben, wenn sich Test-Verdrahtung ändert.
  - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setze `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn du einen expliziten Cache-Speicherort für direktes Profiling möchtest.
- Hinweis zum Performance-Debugging:
  - `pnpm test:perf:imports` aktiviert Vitest-Importdauer-Reporting plus Ausgabe der Import-Aufschlüsselung.
  - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes `test:changed` mit dem nativen Root-Project-Pfad für diesen festgeschriebenen Diff und gibt Wall Time plus macOS-Max-RSS aus.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen schmutzigen Tree, indem die Liste geänderter Dateien durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für Vitest-/Vite-Startup und Transform-Overhead.
  - `pnpm test:perf:profile:runner` schreibt CPU-+Heap-Profile des Runners für die Unit-Suite bei deaktivierter Dateiparallelität.

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `vitest.gateway.config.ts`, erzwungen auf einen Worker
- Umfang:
  - Startet ein echtes loopback-Gateway mit standardmäßig aktivierter Diagnostik
  - Treibt synthetische Gateway-Nachrichten, Memory- und Large-Payload-Churn über den Diagnostik-Ereignispfad
  - Fragt `diagnostics.stability` über Gateway-WS-RPC ab
  - Deckt Persistenz-Helper für das diagnostische Stabilitäts-Bundle ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Druckbudget bleiben und Queue-Tiefen pro Session wieder auf null zurücklaufen
- Erwartungen:
  - CI-sicher und ohne Keys
  - Schmale Lane zur Nachverfolgung von Stabilitäts-Regressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Laufzeit-Standards:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um den Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Overrides:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um wieder ausführliche Konsolenausgabe zu aktivieren.
- Umfang:
  - End-to-End-Verhalten mit mehreren Gateway-Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwergewichtigere Netzwerkarbeit
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Keys erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet über Docker ein isoliertes OpenShell-Gateway auf dem Host
  - Erstellt aus einem temporären lokalen Dockerfile eine Sandbox
  - Übt OpenClaws OpenShell-Backend über echtes `sandbox ssh-config` + SSH-Exec aus
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur per Opt-in; nicht Teil des standardmäßigen Laufs `pnpm test:e2e`
  - Erfordert ein lokales `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört danach das Test-Gateway und die Sandbox
- Nützliche Overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu zeigen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Anmeldedaten?“
  - Erkennt Änderungen an Provider-Formaten, Tool-Calling-Eigenheiten, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Bevorzuge eingegrenzte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Keys aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures dein echtes `~/.openclaw` nicht verändern können.
- Setze `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests absichtlich dein echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: `[live] ...`-Fortschrittsausgabe bleibt erhalten, aber der zusätzliche Hinweis zu `~/.profile` wird unterdrückt und Gateway-Bootstrap-Logs/Bonjour-Noise werden stummgeschaltet. Setze `OPENCLAW_LIVE_TEST_QUIET=0`, wenn du die vollständigen Startup-Logs zurückhaben möchtest.
- API-Key-Rotation (provider-spezifisch): setze `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder pro Live-Override `OPENCLAW_LIVE_*_KEY`; Tests wiederholen sich bei Antworten mit Rate Limits.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen auf stderr aus, sodass bei stiller Vitest-Konsolenerfassung sichtbar bleibt, dass lange Provider-Aufrufe aktiv sind.
  - `vitest.live.config.ts` deaktiviert Vitest-Konsolenabfangung, sodass Provider-/Gateway-Fortschrittszeilen bei Live-Läufen sofort gestreamt werden.
  - Konfiguriere direkte Modell-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Konfiguriere Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welche Suite soll ich ausführen?

Nutze diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn du viel geändert hast)
- Gateway-Netzwerk / WS-Protokoll / Pairing anfassen: `pnpm test:e2e` ergänzen
- „Mein Bot ist down“ / provider-spezifische Fehler / Tool-Calling debuggen: ein eingegrenztes `pnpm test:live` ausführen

## Live: Android-Node-Capability-Sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell beworbenen Befehl** eines verbundenen Android-Node aufrufen und das Befehlsvertragsverhalten verifizieren.
- Umfang:
  - Vorbedingte/manuelle Einrichtung (die Suite installiert/startet/paart die App nicht).
  - Gateway-Validierung von `node.invoke` Befehl für Befehl für den ausgewählten Android-Node.
- Erforderliche Voreinrichtung:
  - Android-App bereits verbunden + mit dem Gateway gepaart.
  - App im Vordergrund halten.
  - Berechtigungen/Capture-Einwilligungen für Capabilities erteilen, deren Erfolg du erwartest.
- Optionale Ziel-Overrides:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Android-Setup-Details: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profile-Keys)

Live-Tests sind in zwei Ebenen aufgeteilt, damit wir Fehler isolieren können:

- „Direct model“ sagt uns, ob der Provider/das Modell mit dem angegebenen Key überhaupt antworten kann.
- „Gateway smoke“ sagt uns, ob die vollständige Gateway-+Agent-Pipeline für dieses Modell funktioniert (Sessions, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modell-Completion (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle auflisten
  - Mit `getApiKeyForModel` Modelle auswählen, für die du Anmeldedaten hast
  - Eine kleine Completion pro Modell ausführen (und gezielte Regressionen, wo nötig)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setze `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (Komma-Allowlist)
  - Modern-/All-Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setze `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder einen positiven Wert für ein kleineres Limit.
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (Komma-Allowlist)
- Herkunft der Keys:
  - Standardmäßig: Profile-Store und Env-Fallbacks
  - Setze `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur** den Profile-Store zu erzwingen
- Warum das existiert:
  - Trennt „Provider-API ist kaputt / Key ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI-Responses/Codex-Responses-Reasoning-Replay + Tool-Call-Flows)

### Ebene 2: Gateway + Dev-Agent-Smoke (was `@openclaw` tatsächlich macht)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway hochfahren
  - Eine Session `agent:dev:*` erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit Keys iterieren und Folgendes verifizieren:
    - „sinnvolle“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes funktionieren (Exec+Read-Probe)
    - OpenAI-Regression-Pfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Probe-Details (damit du Fehler schnell erklären kannst):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agent auf, sie zu `read`en und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agent auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann wieder zu `read`en.
  - Image-Probe: Der Test hängt ein generiertes PNG an (Katze + randomisierter Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setze `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder Komma-Liste), um einzugrenzen
  - Modern-/All-Gateway-Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setze `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder einen positiven Wert für ein kleineres Limit.
- Providerauswahl (vermeide „OpenRouter alles“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (Komma-Allowlist)
- Tool- und Image-Probes sind in diesem Live-Test immer aktiv:
  - `read`-Probe + `exec+read`-Probe (Tool-Stress)
  - Image-Probe läuft, wenn das Modell Unterstützung für Bildeingaben bewirbt
  - Ablauf (High-Level):
    - Test erzeugt ein winziges PNG mit „CAT“ + zufälligem Code (`src/gateway/live-image-probe.ts`)
    - Sendet es über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Eingebetteter Agent leitet eine multimodale User-Nachricht an das Modell weiter
    - Assertion: Die Antwort enthält `cat` + den Code (OCR-Toleranz: kleinere Fehler erlaubt)

Tipp: Um zu sehen, was du auf deinem Rechner testen kannst (und die exakten IDs `provider/model`), führe aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway-+Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne deine Standardkonfiguration anzufassen.
- Backend-spezifische Smoke-Standards liegen in der `cli-backend.ts`-Definition der besitzenden Erweiterung.
- Aktivieren:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standards:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Befehl/Args/Image-Verhalten stammen aus den Metadaten des besitzenden CLI-Backend-Plugins.
- Overrides (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Args statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bild-Args übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Flow zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, um die standardmäßige Kontinuitäts-Probe Claude Sonnet -> Opus innerhalb derselben Session zu deaktivieren (setze `1`, um sie zu erzwingen, wenn das ausgewählte Modell ein Umschaltziel unterstützt).

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
- Er führt den Live-CLI-Backend-Smoke innerhalb des Repo-Docker-Images als nicht-root `node`-Benutzer aus.
- Er löst CLI-Smoke-Metadaten aus der besitzenden Erweiterung auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein gecachtes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` auf (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable Claude-Code-Subscription-OAuth über entweder `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es prüft zuerst direkt `claude -p` in Docker und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-Key-Umgebungsvariablen beizubehalten. Diese Subscription-Lane deaktiviert standardmäßig die Claude-MCP-/Tool- und Image-Probes, weil Claude die Nutzung durch Drittanbieter-Apps derzeit über Extra-Usage-Billing statt über normale Subscription-Plan-Limits abrechnet.
- Der Live-CLI-Backend-Smoke deckt jetzt denselben vollständigen End-to-End-Flow für Claude, Codex und Gemini ab: Text-Turn, Image-Klassifizierungs-Turn und dann `cron`-Tool-Call über Gateway-CLI verifiziert.
- Claudes standardmäßiger Smoke patcht außerdem die Session von Sonnet auf Opus und verifiziert, dass die fortgesetzte Session sich weiterhin an eine frühere Notiz erinnert.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Conversation-Bind-Flow mit einem Live-ACP-Agent validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Konversation an Ort und Stelle binden
  - ein normales Follow-up in derselben Konversation senden
  - verifizieren, dass das Follow-up im Transkript der gebundenen ACP-Session landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standards:
  - ACP-Agents in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Slack-DM-artiger Konversationskontext
  - ACP-Backend: `acpx`
- Overrides:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit nur für Admin bestimmte synthetische Felder für die Ursprungsroute, sodass Tests Message-Channel-Kontext anhängen können, ohne vorzutäuschen, extern zuzustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die integrierte Agent-Registry des eingebetteten `acpx`-Plugins für den ausgewählten ACP-Harness-Agent.

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

Docker-Rezepte für einzelne Agents:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker-Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen alle unterstützten Live-CLI-Agents aus: `claude`, `codex`, dann `gemini`.
- Verwende `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, um die Matrix einzugrenzen.
- Er sourced `~/.profile`, staged das passende CLI-Auth-Material in den Container, installiert `acpx` in ein beschreibbares npm-Präfix und installiert dann die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`), falls sie fehlt.
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit `acpx` Provider-Umgebungsvariablen aus dem gesourcten Profil für die Child-Harness-CLI verfügbar hält.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: das plugin-eigene Codex-Harness über die normale Gateway-Methode
  `agent` validieren:
  - das gebündelte Plugin `codex` laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agent-Turn an `codex/gpt-5.4` senden
  - einen zweiten Turn an dieselbe OpenClaw-Session senden und verifizieren, dass der App-Server-
    Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehls-
    pfad ausführen
  - optional zwei von Guardian geprüfte eskalierte Shell-Probes ausführen: einen harmlosen
    Befehl, der genehmigt werden sollte, und einen Fake-Secret-Upload, der
    abgelehnt werden sollte, sodass der Agent nachfragt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `codex/gpt-5.4`
- Optionale Image-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionale Guardian-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Der Smoke setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, sodass ein defektes Codex-
  Harness nicht dadurch bestehen kann, dass es stillschweigend auf PI zurückfällt.
- Auth: `OPENAI_API_KEY` aus Shell/Profil sowie optional kopierte
  `~/.codex/auth.json` und `~/.codex/config.toml`

Lokales Rezept:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
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
- Er sourced das gemountete `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert Codex-CLI-
  Auth-Dateien, wenn vorhanden, installiert `@openai/codex` in ein beschreibbares gemountetes npm-
  Präfix, staged den Source-Tree und führt dann nur den Live-Test für das Codex-Harness aus.
- Docker aktiviert standardmäßig die Image-, MCP-/Tool- und Guardian-Probes. Setze
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, wenn du einen engeren Debug-
  Lauf brauchst.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend zur Live-
  Testkonfiguration, sodass `openai-codex/*`- oder PI-Fallback keine Regression
  im Codex-Harness verbergen kann.

### Empfohlene Live-Rezepte

Enge, explizite Allowlists sind am schnellsten und am wenigsten flaky:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Calling über mehrere Provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-Key + Antigravity):
  - Gemini (API-Key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Key).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-artiger Agent-Endpunkt).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf deinem Rechner (separate Auth + Tooling-Eigenheiten).
- Gemini-API vs. Gemini-CLI:
  - API: OpenClaw ruft Googles gehostete Gemini-API über HTTP auf (API-Key / Profil-Auth); das ist, was die meisten Nutzer mit „Gemini“ meinen.
  - CLI: OpenClaw führt ein lokales `gemini`-Binary aus; es hat eigene Auth und kann sich anders verhalten (Streaming/Tool-Support/Versions-Skew).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einem Dev-Rechner mit Keys abgedeckt werden sollten.

### Modernes Smoke-Set (Tool-Calling + Image)

Dies ist der Lauf für die „gängigen Modelle“, den wir funktionsfähig halten wollen:

- OpenAI (nicht-Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini-API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Image ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool-Calling (Read + optional Exec)

Wähle mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder die neueste verfügbare Version)
- Mistral: `mistral/`… (wähle ein „tools“-fähiges Modell, das du aktiviert hast)
- Cerebras: `cerebras/`… (falls du Zugriff hast)
- LM Studio: `lmstudio/`… (lokal; Tool-Calling hängt vom API-Modus ab)

### Vision: Bild senden (Anhang → multimodale Nachricht)

Nimm mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude/Gemini/OpenAI mit Vision-fähigen Varianten usw.), um die Image-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn du aktivierte Keys hast, unterstützen wir außerdem Tests über:

- OpenRouter: `openrouter/...` (hunderte Modelle; verwende `openclaw models scan`, um Kandidaten mit Tool-+Image-Fähigkeit zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Auth über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die du in die Live-Matrix aufnehmen kannst (wenn du Credentials/Konfiguration hast):

- Eingebaut: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (Custom-Endpoints): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuche nicht, „alle Modelle“ in der Dokumentation fest zu verdrahten. Die maßgebliche Liste ist das, was `discoverModels(...)` auf deinem Rechner zurückgibt, plus die verfügbaren Keys.

## Credentials (niemals committen)

Live-Tests erkennen Credentials auf dieselbe Weise wie die CLI. Praktische Folgen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Keys finden.
- Wenn ein Live-Test „keine Credentials“ meldet, debugge ihn so, wie du `openclaw models list` / Modellauswahl debuggen würdest.

- Pro-Agent-Auth-Profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist es, was mit „Profile-Keys“ in den Live-Tests gemeint ist)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-State-Verzeichnis: `~/.openclaw/credentials/` (wird, wenn vorhanden, in das gestagte Live-Home kopiert, ist aber nicht der Hauptspeicher für Profile-Keys)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, pro-Agent-`auth-profiles.json`-Dateien, Legacy-`credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; gestagte Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfad-Overrides `agents.*.workspace` / `agentDir` werden entfernt, damit Probes nicht in deinen echten Host-Workspace geraten.

Wenn du dich auf Env-Keys verlassen willst (z. B. exportiert in deinem `~/.profile`), führe lokale Tests nach `source ~/.profile` aus oder verwende die Docker-Runner unten (sie können `~/.profile` in den Container mounten).

## Deepgram Live (Audio-Transkription)

- Test: `extensions/deepgram/audio.live.test.ts`
- Aktivierung: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus Coding-Plan Live

- Test: `extensions/byteplus/live.test.ts`
- Aktivierung: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionales Modell-Override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien Live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Deckt die gebündelten comfy-Pfade für Bilder, Videos und `music_generate` ab
  - Überspringt jede Capability, sofern `models.providers.comfy.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an comfy-Workflow-Submission, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung Live

- Test: `test/image-generation.runtime.live.test.ts`
- Befehl: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Listet jedes registrierte Plugin für Bildgenerierungs-Provider auf
  - Lädt fehlende Provider-Umgebungsvariablen vor dem Testen aus deiner Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen, damit veraltete Test-Keys in `auth-profiles.json` keine echten Shell-Credentials maskieren
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt die Standardvarianten der Bildgenerierung über die gemeinsame Runtime-Capability aus:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Derzeit abgedeckte gebündelte Provider:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Store zu erzwingen und rein env-basierte Overrides zu ignorieren

## Musikgenerierung Live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Deckt den gemeinsamen gebündelten Pfad für Musikgenerierungs-Provider ab
  - Deckt derzeit Google und MiniMax ab
  - Lädt Provider-Umgebungsvariablen vor dem Testen aus deiner Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen, damit veraltete Test-Keys in `auth-profiles.json` keine echten Shell-Credentials maskieren
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit rein promptbasierter Eingabe
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Derzeitige Abdeckung in der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht Teil dieses gemeinsamen Sweeps
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Store zu erzwingen und rein env-basierte Overrides zu ignorieren

## Videogenerierung Live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Deckt den gemeinsamen gebündelten Pfad für Videogenerierungs-Provider ab
  - Verwendet standardmäßig den release-sicheren Smoke-Pfad: nicht-FAL-Provider, eine Text-zu-Video-Anfrage pro Provider, ein einsekündiger Hummer-Prompt und ein provider-spezifisches Operationslimit aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, weil providerseitige Queue-Latenz die Release-Zeit dominieren kann; übergib `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um es explizit auszuführen
  - Lädt Provider-Umgebungsvariablen vor dem Testen aus deiner Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen, damit veraltete Test-Keys in `auth-profiles.json` keine echten Shell-Credentials maskieren
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt standardmäßig nur `generate` aus
  - Setze `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um auch deklarierte Transform-Modi auszuführen, wenn verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell in diesem gemeinsamen Sweep buffer-gestützte lokale Bildeingabe akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell in diesem gemeinsamen Sweep buffer-gestützte lokale Videoeingabe akzeptiert
  - Derzeit deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL erfordert
  - Provider-spezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` Text-zu-Video sowie standardmäßig eine `kling`-Lane mit einer Fixture für eine Remote-Bild-URL aus
  - Derzeitige `videoToVideo`-Live-Abdeckung:
    - nur `runway`, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Derzeit deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit Remote-Referenz-URLs `http(s)` / MP4 erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Lane lokale buffer-gestützte Eingabe verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil die aktuelle gemeinsame Lane keine Garantien für organisationsspezifischen Zugriff auf Video-Inpaint/Remix hat
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standard-Sweep aufzunehmen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um das Operationslimit pro Provider für einen aggressiven Smoke-Lauf zu reduzieren
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Store zu erzwingen und rein env-basierte Overrides zu ignorieren

## Medien-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suites für Bild, Musik und Video über einen repo-nativen Entry-Point aus
  - Lädt fehlende Provider-Umgebungsvariablen automatisch aus `~/.profile`
  - Grenzt jede Suite standardmäßig automatisch auf Provider ein, die derzeit nutzbare Auth haben
  - Verwendet erneut `scripts/test-live.mjs`, sodass Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-Runner (optionale „funktioniert unter Linux“-Checks)

Diese Docker-Runner sind in zwei Gruppen aufgeteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre jeweils passende Live-Datei für Profile-Keys innerhalb des Repo-Docker-Images aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei dein lokales Konfigurationsverzeichnis und dein Workspace gemountet werden (und `~/.profile`, falls gemountet, gesourced wird). Die passenden lokalen Entry-Points sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig ein kleineres Smoke-Limit, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreibe diese Env-Variablen, wenn du
  ausdrücklich den größeren vollständigen Scan möchtest.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Docker-Lanes für Live erneut. Es baut außerdem ein gemeinsames Image `scripts/e2e/Dockerfile` über `test:docker:e2e-build` und verwendet es erneut für die E2E-Container-Smoke-Runner, die die gebaute App ausführen.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren höherstufige Integrationspfade.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Auth-Homes per Bind-Mount ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, damit externe CLI-OAuth Tokens aktualisieren kann, ohne den Auth-Store auf dem Host zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding/Kanal/Agent-Smoke: `pnpm test:docker:npm-onboard-channel-agent` installiert das gepackte OpenClaw-Tarball global in Docker, konfiguriert OpenAI per env-ref-Onboarding sowie standardmäßig Telegram, verifiziert, dass das Aktivieren des Plugins seine Runtime-Abhängigkeiten bei Bedarf installiert, führt doctor aus und führt einen gemockten OpenAI-Agent-Turn aus. Verwende ein vorgebautes Tarball erneut mit `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringe den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oder wechsle den Kanal mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Gateway-Netzwerk (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Minimale OpenAI-Responses-`web_search`-Reasoning-Regression: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server durch Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` erhöht, erzwingt dann das Zurückweisen des Provider-Schemas und prüft, dass das rohe Detail in den Gateway-Logs erscheint.
- MCP-Kanal-Bridge (geseedetes Gateway + stdio-Bridge + roher Claude-Benachrichtigungsframe-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebetteter Pi-Profil-Allow/Deny-Smoke): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron-/Subagent-MCP-Cleanup (echtes Gateway + Tear-down des stdio-MCP-Child nach isolierten Cron- und One-Shot-Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Installations-Smoke + `/plugin`-Alias + Neustart-Semantik des Claude-Bundles): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
- Smoke für unverändertes Plugin-Update: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke für Konfigurations-Reload-Metadaten: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-Abhängigkeiten gebündelter Plugins: `pnpm test:docker:bundled-channel-deps` baut standardmäßig ein kleines Docker-Runner-Image, baut und packt OpenClaw einmal auf dem Host und mountet dann dieses Tarball in jedes Linux-Installationsszenario. Verwende das Image erneut mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, überspringe den Host-Rebuild nach einem frischen lokalen Build mit `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` oder zeige auf ein bestehendes Tarball mit `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Grenze Runtime-Abhängigkeiten gebündelter Plugins während der Iteration ein, indem du nicht verwandte Szenarien deaktivierst, zum Beispiel:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Um das gemeinsame Built-App-Image manuell vorzubauen und wiederzuverwenden:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsames Image zeigt, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die Docker-Tests für QR und Installer behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten statt der gemeinsamen Runtime der gebauten App validieren.

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein und
stagen ihn in ein temporäres Workdir innerhalb des Containers. Dadurch bleibt das Runtime-
Image schlank, während Vitest dennoch gegen deinen exakten lokalen Source/Config läuft.
Der Staging-Schritt überspringt große rein lokale Caches und Build-Ausgaben von Apps wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang maschinenspezifische
Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Kanal-Worker für Telegram/Discord/usw. innerhalb des Containers starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus; gib daher bei Bedarf auch
`OPENCLAW_LIVE_GATEWAY_*` weiter, wenn du Gateway-Live-Abdeckung in dieser Docker-Lane
eingrenzen oder ausschließen willst.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen angehefteten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über Open WebUIs Proxy `/api/chat/completions`.
Der erste Lauf kann deutlich langsamer sein, weil Docker möglicherweise erst das
Open-WebUI-Image ziehen muss und Open WebUI sein eigenes Cold-Start-Setup abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modell-Key, und `OPENCLAW_PROFILE_FILE`
(standardmäßig `~/.profile`) ist die primäre Methode, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen geseedeten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` ausführt, und
verifiziert dann geroutete Konversationserkennung, Transkript-Lesevorgänge, Attachment-Metadaten,
Verhalten der Live-Event-Queue, Routing ausgehender Sends sowie Kanal- +
Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was die
Bridge tatsächlich aussendet, nicht nur das, was ein bestimmtes Client-SDK zufällig bereitstellt.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modell-Key. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
innerhalb des Containers, materialisiert diesen Server durch die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools beibehalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie herausfiltern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Modell-
Key. Es startet ein geseedetes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen One-Shot-Child-Turn mit `/subagents spawn` aus und
verifiziert dann, dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Thread-Smoke in Klartext (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalte dieses Skript für Regressions-/Debug-Workflows. Es könnte erneut für die Validierung des ACP-Thread-Routings gebraucht werden, also nicht löschen.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), gemountet nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), gemountet nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`), gemountet nach `/home/node/.profile` und vor dem Testlauf gesourced
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur aus `OPENCLAW_PROFILE_FILE` gesourcte Umgebungsvariablen zu verifizieren, mit temporären Config-/Workspace-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`), gemountet nach `/home/node/.npm-global` für gecachte CLI-Installationen in Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, abgeleitet aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Komma-Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes Image `openclaw:local-live` für Wiederholungsläufe zu verwenden, die keinen Rebuild brauchen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Credentials aus dem Profile-Store kommen (nicht aus der Umgebung)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Prompt zur Nonce-Prüfung zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das angeheftete Open-WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führe nach Änderungen an der Dokumentation die Docs-Checks aus: `pnpm check:docs`.
Führe die vollständige Mintlify-Anker-Validierung aus, wenn du zusätzlich Prüfungen für Überschriften auf der Seite brauchst: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen für „echte Pipelines“ ohne echte Provider:

- Gateway-Tool-Calling (gemocktes OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, erzwingt Schreiben von Config + Auth): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Gemocktes Tool-Calling durch das echte Gateway + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Assistenten-Flows, die Session-Verdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wählt der Agent, wenn Skills im Prompt aufgeführt sind, den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Verwendung und befolgt erforderliche Schritte/Args?
- **Workflow-Verträge:** Multi-Turn-Szenarien, die Tool-Reihenfolge, Übernahme des Session-Verlaufs und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, der Tool-Calls + Reihenfolge, Skill-Datei-Lesevorgänge und Session-Verdrahtung prüft.
- Eine kleine Suite skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, env-gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests prüfen, dass jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle entdeckten Plugins und führen eine Suite von
Assertions zur Form und zum Verhalten aus. Die standardmäßige Unit-Lane `pnpm test`
überspringt diese gemeinsam genutzten Seam- und Smoke-Dateien absichtlich; führe die Vertragsbefehle explizit
aus, wenn du gemeinsame Kanal- oder Provider-Oberflächen änderst.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Zu finden unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Capabilities)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten der Session-Bindung
- **outbound-payload** - Struktur der Message-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Kanalaktionen
- **threading** - Umgang mit Thread-IDs
- **directory** - API für Verzeichnis/Roster
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Status-Verträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanal-Status-Probes
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Auth-Flows
- **auth-choice** - Auswahl/Selektion von Auth
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an Plugin-SDK-Exporten oder Subpaths
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactorings an Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und benötigen keine echten API-Keys.

## Regressionen hinzufügen (Leitlinien)

Wenn du ein in Live entdecktes Provider-/Modellproblem behebst:

- Füge wenn möglich eine CI-sichere Regression hinzu (Mock/Stub-Provider oder erfasse die exakte Transformation der Request-Form)
- Wenn es von Natur aus nur live auftritt (Rate Limits, Auth-Richtlinien), halte den Live-Test eng eingegrenzt und per Umgebungsvariablen auf Opt-in
- Ziele bevorzugt auf die kleinste Ebene, die den Fehler erkennt:
  - Fehler bei Provider-Request-Konvertierung/-Replay → Test für direkte Modelle
  - Fehler in Gateway-Session-/Verlauf-/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Schutzmaßnahme für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet ein gesampeltes Ziel pro SecretRef-Klasse aus Registry-Metadaten ab (`listSecretTargetRegistryEntries()`) und prüft dann, dass Traversal-Segment-Exec-IDs zurückgewiesen werden.
  - Wenn du eine neue SecretRef-Zielfamilie `includeInPlan` in `src/secrets/target-registry-data.ts` hinzufügst, aktualisiere `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.
