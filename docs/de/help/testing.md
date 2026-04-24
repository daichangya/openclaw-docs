---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionen für Modell-/Anbieterfehler hinzufügen
    - Verhalten von Gateway + Agent debuggen
summary: 'Test-Set: Unit-/E2E-/Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Tests
x-i18n:
    generated_at: "2026-04-24T06:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: b825d25da0eb504dfc19e5dcf18b50e8c3bf07e616d0be82d096f3973dbbd785
    source_path: help/testing.md
    workflow: 15
---

OpenClaw hat drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Menge
an Docker-Runnern. Dieses Dokument ist ein Leitfaden dafür, **wie wir testen**:

- Was jede Suite abdeckt (und was sie absichtlich _nicht_ abdeckt).
- Welche Befehle Sie für gängige Workflows ausführen sollten (lokal, vor dem Push, Debugging).
- Wie Live-Tests Anmeldedaten finden und Modelle/Anbieter auswählen.
- Wie Regressionen für reale Modell-/Anbieterprobleme hinzugefügt werden.

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellere lokale Ausführung der gesamten Suite auf einer leistungsfähigen Maschine: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting von Dateien leitet jetzt auch Pfade für Erweiterungen/Channels weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Läufe, wenn Sie an einem einzelnen Fehler arbeiten.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests anfassen oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debugging realer Anbieter/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Prüfungen): `pnpm test:live`
- Eine einzelne Live-Datei gezielt und leise ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-Live-Model-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Prüfung im Stil eines Dateilesevorgangs aus.
    Modelle, deren Metadaten `image`-Eingabe ankündigen, führen zusätzlich einen kleinen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Prüfungen mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Anbieterfehler isolieren.
  - CI-Abdeckung: Die tägliche Prüfung `OpenClaw Scheduled Live And E2E Checks` und die manuelle
    Prüfung `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, was separate Docker-Live-Model-
    Matrix-Jobs einschließt, die nach Anbieter geshardet sind.
  - Für gezielte CI-Neustarts rufen Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true` auf.
  - Fügen Sie neue hochrelevante Anbieter-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie zu `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    Aufrufern für Zeitplan/Release hinzu.
- Nativer Codex-Bound-Chat-Smoke: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, testet `/codex fast` und
    `/codex permissions` und verifiziert dann, dass eine normale Antwort und ein Bildanhang
    über die native Plugin-Bindung statt über ACP geroutet werden.
- Moonshot/Kimi-Kosten-Smoke: Wenn `MOONSHOT_API_KEY` gesetzt ist, führen Sie
  `openclaw models list --provider moonshot --json` aus und danach ein isoliertes
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistenten-Transcript normalisierte `usage.cost` speichert.

Tipp: Wenn Sie nur einen einzelnen fehlschlagenden Fall benötigen, bevorzugen Sie das Eingrenzen von Live-Tests über die unten beschriebenen Env-Variablen für Allowlists.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupt-Test-Suites zur Verfügung, wenn Sie QA-Lab-Realismus benötigen:

CI führt QA Lab in dedizierten Workflows aus. `Parity gate` läuft auf passenden PRs und
bei manueller Auslösung mit Mock-Anbietern. `QA-Lab - All Lanes` läuft nachts auf
`main` und bei manueller Auslösung mit dem Mock-Parity-Gate, der Live-Matrix-Lane und der von Convex verwalteten Live-Telegram-Lane als parallele Jobs. `OpenClaw Release Checks`
führt dieselben Lanes vor der Release-Freigabe aus.

- `pnpm openclaw qa suite`
  - Führt Repository-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Concurrency 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwenden Sie `--concurrency <count>`, um die Zahl
    der Worker anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Beendet mit einem Fehlercode ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Unterstützt die Anbietermodi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Anbieterserver für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Verhalten bei der Szenarioauswahl wie `qa suite` auf dem Host.
  - Verwendet dieselben Flags zur Auswahl von Anbieter/Modell wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    Env-basierte Anbieter-Schlüssel, den Konfigurationspfad für QA-Live-Anbieter und `CODEX_HOME`, wenn vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Root des Repositorys bleiben, damit der Gast über
    den gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht + Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorähnliche QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut ein npm-Tarball aus dem aktuellen Checkout, installiert es global in
    Docker, führt ein nicht interaktives Onboarding mit OpenAI-API-Schlüssel aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass das Aktivieren des Plugins Laufzeitabhängigkeiten bei Bedarf installiert, führt doctor aus und
    führt einen lokalen Agenten-Turn gegen einen gemockten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Lane für verpackte Installation
    mit Discord auszuführen.
- `pnpm test:docker:npm-telegram-live`
  - Installiert ein veröffentlichtes OpenClaw-Paket in Docker, führt das Onboarding für das installierte Paket aus,
    konfiguriert Telegram über die installierte CLI und verwendet dann die
    Live-Telegram-QA-Lane erneut, wobei das installierte Paket als Gateway des SUT dient.
  - Standardmäßig wird `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` verwendet.
  - Verwendet dieselben Telegram-Env-Anmeldedaten oder dieselbe Convex-Anmeldedatenquelle wie
    `pnpm openclaw qa telegram`.
- `pnpm test:docker:bundled-channel-deps`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Channels/Plugins über
    Konfigurationsänderungen.
  - Verifiziert, dass die Setup-Erkennung unkonfigurierte Plugin-Laufzeitabhängigkeiten
    abwesend lässt, dass der erste konfigurierte Gateway- oder doctor-Lauf die Laufzeitabhängigkeiten jedes gebündelten Plugins bei Bedarf installiert und dass ein zweiter Neustart keine bereits aktivierten Abhängigkeiten erneut installiert.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram, bevor `openclaw update --tag <candidate>` ausgeführt wird, und verifiziert, dass der
    doctor des Kandidaten nach dem Update die Laufzeitabhängigkeiten gebündelter Channels repariert, ohne eine Reparatur per postinstall auf Harness-Seite.
- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Anbieterserver für direktes Protokoll-Smoke-
    Testing.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen wegwerfbaren, Docker-gestützten Tuwunel-Homeserver aus.
  - Dieser QA-Host ist derzeit nur für Repository/Entwicklung gedacht. Paketierte OpenClaw-Installationen liefern
    `qa-lab` nicht aus, daher stellen sie `openclaw qa` nicht bereit.
  - Checkouts des Repositorys laden den gebündelten Runner direkt; kein separater Plugin-Installationsschritt
    ist nötig.
  - Stellt drei temporäre Matrix-Benutzer bereit (`driver`, `sut`, `observer`) sowie einen privaten Raum und startet dann ein untergeordnetes QA-Gateway mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das fest angeheftete stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreiben Sie dies mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn Sie ein anderes Image testen müssen.
  - Matrix stellt keine gemeinsamen Flags für Anmeldedatenquellen bereit, da die Lane lokal temporäre Benutzer anlegt.
  - Schreibt einen Matrix-QA-Bericht, eine Zusammenfassung, ein Artefakt für beobachtete Ereignisse und ein kombiniertes stdout/stderr-Ausgabelog unter `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe aus, wobei Driver- und SUT-Bot-Tokens aus den Env-Variablen verwendet werden.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Anmeldedaten. Verwenden Sie standardmäßig den Env-Modus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu nutzen.
  - Beendet mit einem Fehlercode ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellen muss.
  - Für stabile Beobachtung von Bot-zu-Bot-Verkehr aktivieren Sie den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot Gruppen-Bot-Verkehr beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`. Szenarien mit Antworten enthalten die RTT vom Send-Request des Drivers bis zur beobachteten Antwort des SUT.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht auseinanderlaufen:

`qa-channel` bleibt die umfassende synthetische QA-Suite und ist nicht Teil der Live-
Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Antwort auf oberster Ebene | Wiederaufnahme nach Neustart | Thread-Folgeaktion | Thread-Isolierung | Beobachtung von Reaktionen | Help-Befehl |
| -------- | ------ | -------------- | --------------- | -------------------------- | ---------------------------- | ------------------ | ----------------- | -------------------------- | ------------ |
| Matrix   | x      | x              | x               | x                          | x                            | x                  | x                 | x                          |              |
| Telegram | x      |                |                 |                            |                              |                    |                   |                            | x            |

### Gemeinsame Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, bezieht QA Lab ein exklusives Lease aus einem Convex-gestützten Pool, sendet
Heartbeats für dieses Lease, solange die Lane läuft, und gibt das Lease beim Herunterfahren frei.

Referenzgerüst für ein Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Env-Variablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Anmeldedatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Env-Variablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt Loopback-`http://`-Convex-URLs nur für lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Administrationsbefehle für Maintainer (Pool hinzufügen/entfernen/auflisten) erfordern
speziell `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Hilfsbefehle für Maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-Hilfsprogrammen.

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

Payload-Form für die Telegram-Art:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine Zeichenfolge mit numerischer Telegram-Chat-ID sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

### Einen Channel zu QA hinzufügen

Das Hinzufügen eines Channel zum markdown-basierten QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Channel.
2. Ein Szenario-Pack, das den Vertragsumfang des Channel testet.

Fügen Sie keinen neuen QA-Befehls-Root der obersten Ebene hinzu, wenn der gemeinsame `qa-lab`-Host
den Ablauf übernehmen kann.

`qa-lab` verwaltet die gemeinsamen Host-Mechaniken:

- den Befehls-Root `openclaw qa`
- Start und Beenden der Suite
- Worker-Parallelität
- Schreiben von Artefakten
- Berichtsgenerierung
- Ausführung von Szenarien
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins verwalten den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Root eingebunden wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie die Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen behandelt wird

Die minimale Übernahmeschwelle für einen neuen Channel ist:

1. `qa-lab` als Besitzer des gemeinsamen `qa`-Root beibehalten.
2. Den Transport-Runner am gemeinsamen `qa-lab`-Host-Seam implementieren.
3. Transportspezifische Mechaniken im Runner-Plugin oder Channel-Harness belassen.
4. Den Runner als `openclaw qa <runner>` einbinden, statt einen konkurrierenden Root-Befehl zu registrieren.
   Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren.
   Halten Sie `runtime-api.ts` schlank; Lazy-CLI- und Runner-Ausführung sollten hinter separaten Entry-Points bleiben.
5. Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/` verfassen oder anpassen.
6. Für neue Szenarien die generischen Szenario-Helfer verwenden.
7. Bestehende Kompatibilitätsaliase funktionsfähig halten, sofern das Repository keine absichtliche Migration durchführt.

Die Entscheidungsregel ist streng:

- Wenn ein Verhalten einmalig in `qa-lab` ausgedrückt werden kann, gehört es in `qa-lab`.
- Wenn ein Verhalten von einem Channel-Transport abhängt, bleibt es im jeweiligen Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Channel nutzen kann, fügen Sie einen generischen Helfer hinzu statt eines channel-spezifischen Zweigs in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie dies im Szenariovertrag explizit.

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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar, einschließlich:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Neue Channel-Arbeit sollte die generischen Helfernamen verwenden.
Kompatibilitätsaliase existieren, um eine Flag-Day-Migration zu vermeiden, nicht als Modell für
neue Szenario-Erstellung.

## Test-Suites (was wo läuft)

Betrachten Sie die Suites als „zunehmenden Realismus“ (und zunehmende Fehleranfälligkeit/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: nicht gezielte Läufe verwenden den Satz an Shards `vitest.full-*.config.ts` und können Multi-Projekt-Shards zur parallelen Planung in projektbezogene Konfigurationen aufteilen
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` und die auf die Allowlist gesetzten `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
    <AccordionGroup>
    <Accordion title="Projekte, Shards und scoped Lanes"> - Nicht gezielte `pnpm test`-Läufe verwenden zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines riesigen nativen Root-Project-Prozesses. Das senkt die maximale RSS auf stark ausgelasteten Maschinen und verhindert, dass Arbeit von auto-reply/Erweiterungen nicht verwandte Suites aushungert. - `pnpm test --watch` verwendet weiterhin den nativen Projektgraphen des Root-`vitest.config.ts`, weil eine Watch-Schleife über mehrere Shards nicht praktikabel ist. - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch scoped Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht den vollen Startaufwand des Root-Projekts zahlen muss. - `pnpm test:changed` erweitert geänderte Git-Pfade in dieselben scoped Lanes, wenn die Differenz nur routbare Quell-/Testdateien betrifft; Änderungen an Konfiguration/Setup fallen weiterhin auf den breiten Root-Project-Rerun zurück. - `pnpm check:changed` ist das normale intelligente lokale Gate für eng begrenzte Arbeit. Es klassifiziert die Differenz in Core, Core-Tests, Erweiterungen, Erweiterungstests, Apps, Dokumentation, Release-Metadaten und Tooling und führt dann die passenden Lanes für Typecheck/Lint/Tests aus. Änderungen am öffentlichen Plugin SDK und Plugin-Vertrag enthalten einen Durchlauf zur Validierung einer Erweiterung, weil Erweiterungen von diesen Core-Verträgen abhängen. Reine Versionsanhebungen in Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten statt der gesamten Suite aus, mit einem Schutzmechanismus, der Paketänderungen außerhalb des Versionsfeldes auf oberster Ebene ablehnt. - Import-leichte Unit-Tests aus Agents, Commands, Plugins, Auto-Reply-Helfern, `plugin-sdk` und ähnlichen rein utilitären Bereichen laufen über die Lane `unit-fast`, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/laufzeitschwere Dateien bleiben auf den bestehenden Lanes. - Ausgewählte Quelldateien von Helfern in `plugin-sdk` und `commands` ordnen Läufe im Changed-Modus ebenfalls expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Helper-Änderungen nicht die gesamte schwere Suite für dieses Verzeichnis erneut ausführen. - `auto-reply` hat drei dedizierte Buckets: Core-Helfer auf oberster Ebene, Integrations-Tests `reply.*` auf oberster Ebene und den Teilbaum `src/auto-reply/reply/**`. Dadurch bleibt die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests fern.
    </Accordion>

      <Accordion title="Abdeckung des eingebetteten Runners">
        - Wenn Sie Discovery-Eingaben des Message-Tools oder Kontext der Compaction-Runtime ändern, halten Sie beide Abdeckungsebenen intakt.
        - Fügen Sie fokussierte Regressionen für reine Routing- und Normalisierungsgrenzen von Helfern hinzu.
        - Halten Sie die Integrations-Suites des eingebetteten Runners funktionsfähig:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Diese Suites verifizieren, dass scoped IDs und Compaction-Verhalten weiterhin durch die echten Pfade `run.ts` / `compact.ts` fließen; Tests nur auf Helferebene sind kein ausreichender Ersatz für diese Integrationspfade.
      </Accordion>

      <Accordion title="Vitest-Pool und Standardwerte für Isolation">
        - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
        - Die gemeinsame Vitest-Konfiguration setzt `isolate: false` fest und verwendet den
          nicht isolierten Runner über Root-Projekte, E2E- und Live-Konfigurationen hinweg.
        - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft aber ebenfalls auf dem
          gemeinsamen nicht isolierten Runner.
        - Jeder `pnpm test`-Shard übernimmt dieselben Standardwerte `threads` + `isolate: false`
          aus der gemeinsamen Vitest-Konfiguration.
        - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für Node-Unterprozesse von Vitest
          hinzu, um V8-Kompilieraufwand bei großen lokalen Läufen zu reduzieren.
          Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standardverhalten von V8 zu vergleichen.
      </Accordion>

      <Accordion title="Schnelle lokale Iteration">
        - `pnpm changed:lanes` zeigt, welche architektonischen Lanes durch eine Differenz ausgelöst werden.
        - Der Pre-Commit-Hook formatiert nur. Er staged formatierte Dateien erneut und
          führt weder Lint, Typecheck noch Tests aus.
        - Führen Sie `pnpm check:changed` explizit vor Übergabe oder Push aus, wenn Sie
          das intelligente lokale Gate benötigen. Änderungen am öffentlichen Plugin SDK und Plugin-Vertrag
          enthalten einen Validierungsdurchlauf für eine Erweiterung.
        - `pnpm test:changed` leitet über scoped Lanes, wenn die geänderten Pfade sauber
          auf eine kleinere Suite abgebildet werden können.
        - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-
          Verhalten bei, nur mit höherem Worker-Limit.
        - Die automatische Skalierung lokaler Worker ist absichtlich konservativ und fährt zurück,
          wenn der Lastdurchschnitt des Hosts bereits hoch ist, sodass mehrere gleichzeitige
          Vitest-Läufe standardmäßig weniger Schaden anrichten.
        - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als
          `forceRerunTriggers`, sodass Reruns im Changed-Modus korrekt bleiben, wenn sich die Testverdrahtung ändert.
        - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten
          Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie
          einen expliziten Cache-Ort für direktes Profiling möchten.
      </Accordion>

      <Accordion title="Performance-Debugging">
        - `pnpm test:perf:imports` aktiviert die Berichterstattung zu Importdauern von Vitest plus
          eine Aufschlüsselung der Importe.
        - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf
          Dateien, die seit `origin/main` geändert wurden.
        - Wenn ein einzelner Hot-Test weiterhin den Großteil seiner Zeit in Start-up-Importen verbringt,
          halten Sie schwere Abhängigkeiten hinter einem schmalen lokalen Seam `*.runtime.ts` und
          mocken Sie diesen Seam direkt, statt Runtime-Helfer tief zu importieren, nur um
          sie durch `vi.mock(...)` zu schleusen.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes
          `test:changed` mit dem nativen Root-Project-Pfad für diese committe Differenz und gibt Wall Time sowie maximale RSS unter macOS aus.
        - `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen
          verschmutzten Arbeitsbaum, indem die Liste der geänderten Dateien durch
          `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
        - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für
          Overhead beim Start und bei Transformationen von Vitest/Vite.
        - `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile des Runners für die
          Unit-Suite bei deaktivierter Dateiparallelität.
      </Accordion>
    </AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `vitest.gateway.config.ts`, erzwungen mit nur einem Worker
- Umfang:
  - Startet ein echtes Loopback-Gateway, bei dem Diagnose standardmäßig aktiviert ist
  - Leitet synthetische Churn-Muster für Gateway-Nachrichten, Memory und große Payloads durch den Diagnose-Ereignispfad
  - Fragt `diagnostics.stability` über Gateway-WS-RPC ab
  - Deckt Hilfsfunktionen zur Persistenz von Diagnosestabilitäts-Bundles ab
  - Prüft, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Druckbudget bleiben und die Queue-Tiefen pro Sitzung wieder auf null zurücklaufen
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Schmale Lane für Nachverfolgung von Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Laufzeit-Standards:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repositorys.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im stillen Modus, um den Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten mit mehreren Gateway-Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und komplexeres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet ein isoliertes OpenShell-Gateway auf dem Host über Docker
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-`exec`
  - Verifiziert dateisystembezogenes Verhalten mit Remote als Kanon über die Sandbox-fs-Bridge
- Erwartungen:
  - Nur bei Opt-in; kein Teil des standardmäßigen Laufs `pnpm test:e2e`
  - Erfordert eine lokale `openshell` CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isolierte `HOME` / `XDG_CONFIG_HOME` und zerstört dann Test-Gateway und Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript zu zeigen

### Live (echte Anbieter + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Anbieter/dieses Modell _heute_ tatsächlich mit echten Anmeldedaten?“
  - Erkennt Änderungen am Anbieterformat, Besonderheiten bei Tool-Calls, Auth-Probleme und Verhalten bei Ratenlimits
- Erwartungen:
  - Von Natur aus nicht CI-stabil (echte Netzwerke, echte Anbieterrichtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Ratenlimits
  - Bevorzugen Sie eingegrenzte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen leiseren Modus: Es behält die Fortschrittsausgabe `[live] ...` bei, unterdrückt aber den zusätzlichen Hinweis zu `~/.profile` und dämpft Bootstrap-Logs des Gateway/Bonjour-Chatter. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Start-Logs wiederhaben möchten.
- Rotation von API-Schlüsseln (anbieterspezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder überschreiben Sie pro Live-Lauf mit `OPENCLAW_LIVE_*_KEY`; Tests wiederholen bei Antworten mit Ratenlimit.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen nach stderr aus, sodass lange Anbieter-Aufrufe sichtbar aktiv bleiben, auch wenn die Konsolenerfassung von Vitest still ist.
  - `vitest.live.config.ts` deaktiviert die Vitest-Konsolenabfangung, sodass Fortschrittszeilen von Anbieter/Gateway während Live-Läufen sofort gestreamt werden.
  - Stimmen Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Heartbeats für Gateway/Probes mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Networking / WS-Protokoll / Pairing anfassen: Ergänzen Sie `pnpm test:e2e`
- „Mein Bot ist down“ / anbieterbezogene Fehler / Tool-Calling debuggen: Führen Sie ein eingegrenztes `pnpm test:live` aus

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modellmatrix, CLI-Backend-Smokes, ACP-Smokes, Codex-App-Server-
Harness und alle Live-Tests für Media-Anbieter (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Media-Harness) — plus die Behandlung von Anmeldedaten für Live-Läufe — siehe
[Testing — Live-Suites](/de/help/testing-live).

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre passende Live-Datei mit Profil-Schlüssel im Docker-Image des Repositorys aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Workspace gemountet werden (und `~/.profile` gesourct wird, wenn es gemountet ist). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Begrenzung, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Env-Variablen, wenn Sie
  ausdrücklich den größeren, vollständigen Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Docker-Lanes für Live. Es baut außerdem ein gemeinsames Image `scripts/e2e/Dockerfile` über `test:docker:e2e-build` und verwendet es für die E2E-Container-Smoke-Runner wieder, die die gebaute App testen.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, sodass OAuth externer CLI-Tools Tokens aktualisieren kann, ohne den Auth-Store des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Smoke für npm-Tarball-Onboarding/Channel/Agent: `pnpm test:docker:npm-onboard-channel-agent` installiert das gepackte OpenClaw-Tarball global in Docker, konfiguriert OpenAI über Env-Ref-Onboarding plus standardmäßig Telegram, verifiziert, dass doctor aktivierte Laufzeitabhängigkeiten des Plugins repariert, und führt einen gemockten OpenAI-Agenten-Turn aus. Verwenden Sie mit `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ein vorgebautes Tarball erneut, überspringen Sie den Host-Neubau mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oder wechseln Sie mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` den Channel.
- Smoke für globale Bun-Installation: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Baum, installiert ihn mit `bun install -g` in einem isolierten Home und verifiziert, dass `openclaw infer image providers --json` gebündelte Bildanbieter zurückgibt, statt zu hängen. Verwenden Sie mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ein vorgebautes Tarball erneut, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker-Smoke für Installer: `bash scripts/test-install-sh-docker.sh` teilt sich einen npm-Cache über Root-, Update- und Direkt-npm-Container hinweg. Update-Smoke verwendet standardmäßig npm `latest` als stabile Baseline, bevor auf das Kandidaten-Tarball aktualisiert wird. Nicht-Root-Installer-Prüfungen behalten einen isolierten npm-Cache, damit Root-eigene Cache-Einträge das benutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direkt-npm-Cache über lokale Wiederholungsläufe hinweg zu nutzen.
- Install-Smoke-CI überspringt das doppelte direkte globale npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Env-Variable aus, wenn Abdeckung für direktes `npm install -g` benötigt wird.
- Gateway-Networking (zwei Container, WS-Auth + Integrität): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Minimal-Regression für OpenAI-Responses-`web_search` mit minimalem Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server über Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt dann die Ablehnung des Anbieterschemas und prüft, dass das rohe Detail in den Gateway-Logs erscheint.
- MCP-Channel-Bridge (vorbereitetes Gateway + stdio-Bridge + Smoke für rohe Claude-Benachrichtigungsframes): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebetteter Pi-Profil-Allow/Deny-Smoke): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron-/Unteragenten-MCP-Cleanup (echtes Gateway + Beenden des stdio-MCP-Kindprozesses nach isolierten Cron- und One-Shot-Unteragenten-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-Smoke + Alias `/plugin` + Restart-Semantik für Claude-Bundle): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
- Plugin-Update-Smoke unverändert: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Metadata-Smoke für Config-Reload: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Laufzeitabhängigkeiten gebündelter Plugins: `pnpm test:docker:bundled-channel-deps` baut standardmäßig ein kleines Docker-Runner-Image, baut und packt OpenClaw einmal auf dem Host und mountet dieses Tarball dann in jedes Linux-Installationsszenario. Verwenden Sie das Image erneut mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, überspringen Sie den Host-Neubau nach einem frischen lokalen Build mit `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` oder verweisen Sie mit `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` auf ein vorhandenes Tarball.
- Grenzen Sie die Laufzeitabhängigkeiten gebündelter Plugins während der Iteration ein, indem Sie nicht verwandte Szenarien deaktivieren, zum Beispiel:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Um das gemeinsame Built-App-Image manuell vorzubauen und wiederzuverwenden:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Spezifische Image-Überschreibungen pro Suite wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsames Image zeigt, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die Docker-Tests für QR und Installer behalten ihre eigenen Dockerfiles, da sie Paket-/Installationsverhalten validieren und nicht die gemeinsame Built-App-Runtime.

Die Docker-Runner für Live-Modelle mounten außerdem das aktuelle Checkout schreibgeschützt und
stagen es in ein temporäres Arbeitsverzeichnis innerhalb des Containers. Dadurch bleibt das Runtime-
Image schlank, während Vitest weiterhin gegen genau Ihre lokale Quelle/Konfiguration ausgeführt wird.
Der Staging-Schritt überspringt große lokale Caches und Build-Ausgaben von Apps wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, sodass Docker-Live-Läufe nicht minutenlang maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Channel-Worker für Telegram/Discord/etc. im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, daher sollten Sie auch
`OPENCLAW_LIVE_GATEWAY_*` weiterreichen, wenn Sie die Live-Gateway-Abdeckung in dieser Docker-Lane einschränken oder ausschließen müssen.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke: Es startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen fest angehefteten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann merklich langsamer sein, da Docker möglicherweise zuerst das
Open-WebUI-Image ziehen muss und Open WebUI sein eigenes Cold-Start-Setup abschließen muss.
Diese Lane erwartet einen verwendbaren Schlüssel für ein Live-Modell, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist der primäre Weg, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload aus wie `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen vorbereiteten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` ausführt, und
verifiziert dann Erkennung gerouteter Konversationen, Transcript-Lesevorgänge, Attachment-Metadaten,
Verhalten der Live-Ereigniswarteschlange, Routing ausgehender Nachrichten und Claude-ähnliche Channel- +
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was die
Bridge tatsächlich ausgibt, und nicht nur, was ein bestimmtes Client-SDK zufällig sichtbar macht.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Schlüssel für ein Live-
Modell. Es baut das Docker-Image des Repositorys, startet einen echten stdio-MCP-Probe-Server
im Container, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools behalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie herausfiltern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Schlüssel für ein Live-
Modell. Es startet ein vorbereitetes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen One-Shot-Kindturn über `/subagents spawn` aus und
verifiziert dann, dass der MCP-Kindprozess nach jedem Lauf beendet wird.

Manueller ACP-Smoke für Plain Language in Threads (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debugging-Workflows. Es könnte erneut für die Validierung von ACP-Thread-Routing benötigt werden, daher nicht löschen.

Nützliche Env-Variablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) wird nach `/home/node/.openclaw` gemountet
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) wird nach `/home/node/.openclaw/workspace` gemountet
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) wird nach `/home/node/.profile` gemountet und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Env-Variablen zu prüfen, die aus `OPENCLAW_PROFILE_FILE` stammen, unter Verwendung temporärer Konfigurations-/Workspace-Verzeichnisse und ohne Mounts für externe CLI-Auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) wird nach `/home/node/.npm-global` gemountet für zwischengespeicherte CLI-Installationen innerhalb von Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Kommaliste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Anbieter im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes Image `openclaw:local-live` für Wiederholungsläufe ohne Neubau wiederzuverwenden
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profil-Store stammen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell zu wählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Nonce-Prüf-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um den fest angehefteten Open-WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führen Sie nach Änderungen an der Dokumentation die Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anker-Validierung aus, wenn Sie auch Prüfungen für In-Page-Überschriften benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind „echte Pipeline“-Regressionen ohne echte Anbieter:

- Gateway-Tool-Calling (gemocktes OpenAI, echtes Gateway + Agentenschleife): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Evals zur Agenten-Zuverlässigkeit (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Evals zur Agenten-Zuverlässigkeit“ verhalten:

- Gemocktes Tool-Calling durch die echte Gateway- + Agentenschleife (`src/gateway/gateway.test.ts`).
- End-to-End-Abläufe des Assistenten, die Sitzungsverdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsverhalten:** Wenn Skills im Prompt aufgelistet werden, wählt der Agent dann den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Nutzung `SKILL.md` und befolgt erforderliche Schritte/Argumente?
- **Workflow-Verträge:** Multi-Turn-Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Anbietern, um Tool-Aufrufe + Reihenfolge, Skill-Datei-Lesevorgänge und Sitzungsverdrahtung zu prüfen.
- Eine kleine Suite fokussierter Skill-Szenarien (nutzen vs. vermeiden, Gating, Prompt Injection).
- Optionale Live-Evals (Opt-in, über Env geschützt) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Channel-Form)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder Channel seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle entdeckten Plugins und führen eine Suite von
Assertions zu Form und Verhalten aus. Die Standard-Unit-Lane `pnpm test` überspringt absichtlich diese gemeinsamen Seam- und Smoke-Dateien; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsam genutzte Channel- oder Anbieteroberflächen anfassen.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Channel-Verträge: `pnpm test:contracts:channels`
- Nur Plugin-Verträge: `pnpm test:contracts:plugins`

### Channel-Verträge

Liegen in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundform des Plugins (id, name, capabilities)
- **setup** - Vertragsumfang des Setup-Assistenten
- **session-binding** - Verhalten bei Sitzungsbindung
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Channel-Aktionen
- **threading** - Verarbeitung von Thread-IDs
- **directory** - API für Verzeichnis/Roster
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Anbieter-Statusverträge

Liegen in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Status-Probes für Channel
- **registry** - Form der Plugin-Registry

### Anbieterverträge

Liegen in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertragsumfang des Auth-Ablaufs
- **auth-choice** - Auth-Auswahl/-Selektion
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Anbieter-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an Exports oder Subpfaden von plugin-sdk
- Nach dem Hinzufügen oder Ändern eines Channel- oder Anbieter-Plugins
- Nach Refactoring von Plugin-Registrierung oder Erkennung

Vertragstests laufen in CI und erfordern keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitlinien)

Wenn Sie ein Anbieter-/Modellproblem beheben, das in Live entdeckt wurde:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock/Stub des Anbieters oder Erfassung der exakten Transformation der Request-Form)
- Wenn es von Natur aus nur live auftritt (Ratenlimits, Auth-Richtlinien), halten Sie den Live-Test schmal und aktivieren Sie ihn nur per Opt-in über Env-Variablen
- Bevorzugen Sie die kleinste Ebene, die den Fehler erfasst:
  - Fehler bei Anbieter-Request-Konvertierung/-Replay → direkter Modells-Test
  - Fehler in Gateway-Sitzung/Verlauf/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Guardrail für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet ein gesampeltes Ziel pro SecretRef-Klasse aus Registry-Metadaten ab (`listSecretTargetRegistryEntries()`) und prüft dann, dass Exec-IDs in Traversal-Segmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue SecretRef-Zielfamilie mit `includeInPlan` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Testing live](/de/help/testing-live)
- [CI](/de/ci)
