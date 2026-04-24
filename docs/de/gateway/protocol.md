---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debuggen von Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-04-24T06:39:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway-Protokoll (WebSocket)

Das Gateway-WS-Protokoll ist die **einzige Control Plane + der einzige Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, headless
Nodes) verbinden sich über WebSocket und deklarieren ihre **Rolle** + ihren **Scope** beim
Handshake.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Frames vor `connect` sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Grenzwerte `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Wenn Diagnostik aktiviert ist,
  erzeugen zu große eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse,
  bevor das Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse enthalten
  Größen, Limits, Oberflächen und sichere Reason-Codes. Sie enthalten nicht den Nachrichten-
  Body, Anhangsinhalte, den rohen Frame-Body, Tokens, Cookies oder Secret-Werte.

## Handshake (`connect`)

Gateway → Client (Challenge vor `connect`):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` und `policy` werden vom Schema
(`src/gateway/protocol/schema/frames.ts`) alle verlangt. `canvasHostUrl` ist optional. `auth`
meldet die ausgehandelte Rolle/Scopes, wenn verfügbar, und enthält `deviceToken`,
wenn das Gateway eines ausstellt.

Wenn kein Device-Token ausgestellt wird, kann `hello-ok.auth` dennoch die ausgehandelten
Berechtigungen melden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Wenn ein Device-Token ausgestellt wird, enthält `hello-ok` außerdem:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Während des Trusted-Bootstrap-Handoffs kann `hello-ok.auth` zusätzlich weitere
begrenzte Rolleneinträge in `deviceTokens` enthalten:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Für den integrierten Node-/Operator-Bootstrap-Flow bleibt das primäre Node-Token bei
`scopes: []`, und jedes übergebene Operator-Token bleibt auf die Bootstrap-
Allowlist für Operatoren begrenzt (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-Scope-Prüfungen bleiben
rollenpräfixbasiert: Operator-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-
Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

### Node-Beispiel

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Framing

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Seiteneffekten benötigen **Idempotency Keys** (siehe Schema).

## Rollen + Scopes

### Rollen

- `operator` = Control-Plane-Client (CLI/UI/Automatisierung).
- `node` = Capability-Host (camera/screen/canvas/system.run).

### Scopes (`operator`)

Häufige Scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets`
(oder `operator.admin`).

Von Plugins registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope anfordern, aber
reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methoden-Scope ist nur die erste Hürde. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden darüber hinaus strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
Schreibvorgänge von `/config set` und `/config unset` `operator.admin`.

`node.pair.approve` hat zusätzlich zur Basis-Methoden-Scope-Prüfung auch eine zusätzliche
Prüfung des Scopes zum Genehmigungszeitpunkt:

- Anfragen ohne Befehle: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Commands/Permissions (`node`)

Nodes deklarieren Claims für Capabilities zur Verbindungszeit:

- `caps`: hochrangige Capability-Kategorien.
- `commands`: Command-Allowlist für `invoke`.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Geräteidentität verschlüsselt sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, sodass UIs eine einzelne Zeile pro Gerät anzeigen können,
  selbst wenn es sowohl als **operator** als auch als **node** verbunden ist.

## Scoping von Broadcast-Ereignissen

Vom Server gepushte WebSocket-Broadcast-Ereignisse sind per Scope abgesichert, sodass Sitzungen mit nur Pairing-Scope oder nur Node-Scope keine Sitzungsinhalte passiv empfangen.

- **Chat-, Agent- und Tool-Result-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Call-Ergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** sind auf `operator.write` oder `operator.admin` begrenzt, je nachdem, wie das Plugin sie registriert hat.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Lebenszyklus von Verbindung/Trennung usw.) bleiben uneingeschränkt, damit die Transportintegrität für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** sind standardmäßig scope-gesichert (fail-closed), sofern ein registrierter Handler sie nicht explizit lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client bei, sodass Broadcasts auf diesem Socket monotone Reihenfolge beibehalten, selbst wenn unterschiedliche Clients unterschiedliche scope-gefilterte Teilmengen des Ereignisstroms sehen.

## Häufige Familien von RPC-Methoden

Die öffentliche WS-Oberfläche ist breiter als die obigen Beispiele für Handshake/Authentifizierung. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Exporten von Plugin-/Kanalmethoden aufgebaut wird. Behandeln Sie sie als Feature-Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder frisch geprüften Health-Snapshot des Gateways zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Diagnostik-Stabilitätsrekorder zurück. Er enthält operative Metadaten wie Ereignisnamen, Zähler, Bytegrößen, Speicherwerte, Queue-/Sitzungsstatus, Kanal-/Plugin-Namen und Sitzungs-IDs. Er enthält keine Chat-Texte, Webhook-Bodys, Tool-Ausgaben, rohen Request- oder Response-Body, Tokens, Cookies oder Secret-Werte. `operator.read` ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für Operator-Clients mit Admin-Scope eingeschlossen.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Pairing-Flows verwendet wird.
    - `system-presence` gibt den aktuellen Presence-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann Presence-Kontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt persistent gespeicherte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.
  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück.
    - `usage.status` gibt Provider-Nutzungsfenster/Zusammenfassungen verbleibender Quoten zurück.
    - `usage.cost` gibt aggregierte Zusammenfassungen der Kostennutzung für einen Datumsbereich zurück.
    - `doctor.memory.status` gibt den Status der Bereitschaft von Vektor-Memory/Embeddings für den aktiven Standard-Agent-Workspace zurück.
    - `sessions.usage` gibt Zusammenfassungen der Nutzung pro Sitzung zurück.
    - `sessions.usage.timeseries` gibt Nutzungszeitreihen für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Einträge des Nutzungslogs für eine Sitzung zurück.
  </Accordion>

  <Accordion title="Kanäle und Login-Helfer">
    - `channels.status` gibt Statuszusammenfassungen für integrierte + gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet ein bestimmtes Kanal-/Konto ab, sofern der Kanal Logout unterstützt.
    - `web.login.start` startet einen QR-/Web-Login-Flow für den aktuellen webfähigen Kanal-Provider mit QR.
    - `web.login.wait` wartet darauf, dass dieser QR-/Web-Login-Flow abgeschlossen wird, und startet bei Erfolg den Kanal.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
    - `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.
  </Accordion>

  <Accordion title="Nachrichten und Logs">
    - `send` ist das direkte RPC für ausgehende Zustellung an Kanal-/Konto-/Thread-Ziele außerhalb des Chat-Runners.
    - `logs.tail` gibt den konfigurierten Tail des Gateway-Dateilogs mit Cursor-/Limit- und Max-Byte-Steuerung zurück.
  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.config` gibt die effektive Payload der Talk-Konfiguration zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.mode` setzt/überträgt den aktuellen Status des Talk-Modus für WebChat-/Control-UI-Clients.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprachprovider.
    - `tts.status` gibt den Aktivierungsstatus von TTS, den aktiven Provider, Fallback-Provider und den Status der Provider-Konfiguration zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den Status der TTS-Präferenzen um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.
  </Accordion>

  <Accordion title="Secrets, Konfiguration, Update und Wizard">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Secret-Status nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst Secret-Zuweisungen für Befehle für einen bestimmten Satz aus Befehl/Ziel auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurations-Payload.
    - `config.patch` führt ein Merge einer partiellen Konfigurationsaktualisierung durch.
    - `config.apply` validiert + ersetzt die vollständige Konfigurations-Payload.
    - `config.schema` gibt die Live-Payload des Konfigurationsschemas zurück, die von Control UI und CLI-Werkzeugen verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- + Kanal-Schema-Metadaten, wenn die Laufzeit sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, die aus denselben Labels und Hilfetexten abgeleitet werden wie in der UI, einschließlich verschachtelter Objekte, Wildcards, Array-Elemente und `anyOf` / `oneOf` / `allOf`-Kompositionszweigen, wenn passende Felddokumentation existiert.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hint + `hintPath` und Zusammenfassungen der direkten Child-Knoten für UI-/CLI-Drill-down. Lookup-Schemaknoten behalten die benutzerseitige Dokumentation und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen sowie Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Zusammenfassungen der Child-Knoten enthalten `key`, normalisierten `path`, `type`, `required`, `hasChildren` sowie den passenden `hint` / `hintPath`.
    - `update.run` führt den Gateway-Update-Ablauf aus und plant nur dann einen Neustart, wenn das Update selbst erfolgreich war.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Wizard über WS-RPC bereit.
  </Accordion>

  <Accordion title="Agent- und Workspace-Helfer">
    - `agents.list` gibt konfigurierte Agent-Einträge zurück.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und Workspace-Verkabelung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Workspace-Dateien, die für einen Agenten bereitgestellt werden.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agenten oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Lauf beendet ist, und gibt den finalen Snapshot zurück, wenn verfügbar.
  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Abonnements für Sitzungsänderungsereignisse für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Abonnements für Transkript-/Nachrichtenereignisse für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
    - `sessions.steer` ist die Variante zum Unterbrechen-und-Steuern für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Overrides.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung durch.
    - `sessions.get` gibt die vollständig gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeigebereinigt: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, XML-Payloads für Tool-Calls im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/vollbreite Modell-Steuertokens werden entfernt, reine stille Token-Assistentenzeilen wie exaktes `NO_REPLY` / `no_reply` werden weggelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.
  </Accordion>

  <Accordion title="Geräte-Pairing und Gerätetokens">
    - `device.pair.list` gibt ausstehende und genehmigte gepaarte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Geräte-Pairing-Datensätze.
    - `device.token.rotate` rotiert ein gepaartes Gerätetoken innerhalb seiner genehmigten Rollen- und Scope-Grenzen.
    - `device.token.revoke` widerruft ein gepaartes Gerätetoken.
  </Accordion>

  <Accordion title="Node-Pairing, Invoke und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` und `node.pair.verify` decken Node-Pairing und Bootstrap-Verifikation ab.
    - `node.list` und `node.describe` geben bekannten/verbundenen Node-Status zurück.
    - `node.rename` aktualisiert die Bezeichnung eines gepaarten Nodes.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Invoke-Anfrage zurück.
    - `node.event` trägt von Nodes stammende Ereignisse zurück ins Gateway.
    - `node.canvas.capability.refresh` aktualisiert bereichsbezogene Canvas-Capability-Tokens.
    - `node.pending.pull` und `node.pending.ack` sind die Queue-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhaft ausstehende Arbeit für offline/getrennte Nodes.
  </Accordion>

  <Accordion title="Familien von Genehmigungen">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen sowie Lookup/Wiedergabe ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die finale Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-Genehmigungsrichtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die lokale Exec-Genehmigungsrichtlinie eines Nodes über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken plugin-definierte Genehmigungs-Flows ab.
  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder beim nächsten Heartbeat auszuführende Wake-Text-Injektion; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Updates wie `chat.inject` und andere Chat-
  Ereignisse, die nur das Transkript betreffen.
- `session.message` und `session.tool`: Updates des Transkripts/Ereignisstroms für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten wurden geändert.
- `presence`: Updates des Presence-Snapshots des Systems.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Update des Gateway-Health-Snapshots.
- `heartbeat`: Update des Heartbeat-Ereignisstroms.
- `cron`: Änderungsereignis eines Cron-Laufs/-Jobs.
- `shutdown`: Benachrichtigung über das Herunterfahren des Gateways.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus des Node-Pairings.
- `node.invoke.request`: Broadcast einer Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gepaarter Geräte.
- `voicewake.changed`: Konfiguration von Wake-Word-Triggern wurde geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der Exec-
  Genehmigung.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der Plugin-
  Genehmigung.

### Hilfsmethoden für Nodes

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste von Skill-Executables
  für automatische Allow-Prüfungen abzurufen.

### Hilfsmethoden für Operatoren

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - `scope` steuert, auf welche Oberfläche sich das primäre `name` bezieht:
    - `text` gibt das primäre Text-Befehlstoken ohne führendes `/`
      zurück
    - `native` und der Standardpfad `both` geben providerbewusste native Namen
      zurück, wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den providerbewussten nativen Befehlsnamen, wenn ein solcher existiert.
  - `provider` ist optional und wirkt sich nur auf die native Benennung sowie die Verfügbarkeit nativer Plugin-
    Befehle aus.
  - `includeArgs=false` lässt serialisierte Argument-Metadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Toolkatalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Tools und Herkunftsmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Eigentümer-Plugin, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit effektive Tool-
  Inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, statt
    vom Aufrufer bereitgestellten Auth- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung aktuell nutzen kann,
    einschließlich Core-, Plugin- und Kanal-Tools.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Berechtigungsstatus, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des Standard-Agent-Workspace.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Im ClawHub-Modus wird ein nachverfolgter Slug oder werden alle nachverfolgten ClawHub-Installationen im
    Standard-Agent-Workspace aktualisiert.
  - Im Konfigurationsmodus werden Werte unter `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env` gepatcht.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage eine Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonisches `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe dieses kanonische
  `systemRunPlan` als autoritativen Kontext für Befehl/cwd/Sitzung wieder.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und dem finalen genehmigten `system.run`-Forward verändert, lehnt das
  Gateway den Lauf ab, statt der veränderten Payload zu vertrauen.

## Fallback für Agent-Zustellung

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur intern zustellbare Ziele führen zu `INVALID_REQUEST`.
- `bestEffortDeliver=true` erlaubt Fallback auf reine Sitzungsausführung, wenn kein extern zustellbarer Pfad aufgelöst werden kann (zum Beispiel bei internen/WebChat-Sitzungen oder mehrdeutigen Multi-Channel-Konfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Abweichungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenz-Client in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll v3 hinweg stabil und die erwartete Basis für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                          | Quelle                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Request-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Preauth- / Connect-Challenge-Timeout      | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Clamp `250`–`10_000`) |
| Initiales Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maximales Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp für schnellen Retry nach Device-Token-Close | `250` ms                                      | `src/gateway/client.ts`                                    |
| Grace vor `terminate()` bei Force-Stop    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Close bei Tick-Timeout                    | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Der Server kündigt das effektive `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
beachten und nicht die Standardwerte vor dem Handshake.

## Authentifizierung

- Shared-Secret-Gateway-Authentifizierung verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Identitätstragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die `connect`-Authentifizierungsprüfung über
  Request-Header statt über `connect.params.auth.*`.
- Privater Ingress mit `gateway.auth.mode: "none"` überspringt Shared-Secret-`connect`-Authentifizierung
  vollständig; setzen Sie diesen Modus nicht an öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach dem Pairing stellt das Gateway ein **Gerätetoken** aus, das auf Rolle + Scopes
  der Verbindung begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen persistiert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistieren.
- Eine erneute Verbindung mit diesem **gespeicherten** Gerätetoken sollte auch den gespeicherten
  genehmigten Scope-Satz für dieses Token wiederverwenden. Dadurch bleibt bereits gewährter
  Zugriff auf Lesen/Probe/Status erhalten und es wird vermieden, dass Reconnects stillschweigend auf einen
  engeren impliziten reinen Admin-Scope kollabieren.
- Clientseitige Zusammenstellung der `connect`-Authentifizierung (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn es gesetzt ist.
  - `auth.token` wird in dieser Prioritätsreihenfolge gefüllt: zuerst explizites Shared Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes gerätebezogenes Token (verschlüsselt nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keine der obigen Optionen ein
    `auth.token` aufgelöst hat. Ein Shared Token oder irgendein aufgelöstes Device-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Device-Tokens beim einmaligen
    Retry wegen `AUTH_TOKEN_MISMATCH` ist **nur für vertrauenswürdige Endpunkte** aktiviert —
    Loopback oder `wss://` mit gepinntem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert nicht.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Handoff-Tokens.
  Persistieren Sie sie nur, wenn `connect` Bootstrap-Authentifizierung über einen vertrauenswürdigen Transport verwendet hat
  wie `wss://` oder Loopback/lokales Pairing.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` liefert, bleibt
  dieser vom Aufrufer angeforderte Scope-Satz maßgeblich; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte gerätebezogene Token wiederverwendet.
- Gerätetokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert den Scope `operator.pairing`).
- Ausgabe/Rotation von Tokens bleibt auf den genehmigten Rollensatz begrenzt, der im
  Pairing-Eintrag dieses Geräts gespeichert ist; die Rotation eines Tokens kann das Gerät nicht in eine
  Rolle erweitern, die durch die Pairing-Genehmigung nie erlaubt wurde.
- Für Sitzungen mit gepaarten Gerätetokens ist Gerätemanagement selbstbezogen, sofern der
  Aufrufer nicht auch `operator.admin` hat: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` prüft außerdem den angeforderten Operator-Scope-Satz gegen die
  aktuellen Sitzungs-Scopes des Aufrufers. Nicht-Admin-Aufrufer können ein Token nicht in einen
  breiteren Operator-Scope-Satz rotieren, als sie bereits besitzen.
- Authentifizierungsfehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (Boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten erneuten Versuch mit einem zwischengespeicherten gerätebezogenen Token machen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Reconnect-Schleifen stoppen und Hinweise für Operatoraktionen anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) angeben, die aus einem
  Fingerprint eines Schlüsselpaares abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale Auto-Genehmigung
  nicht aktiviert ist.
- Auto-Genehmigung beim Pairing ist auf direkte lokale Loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen engen backend-/containerlokalen Self-Connect-Pfad für
  vertrauenswürdige Shared-Secret-Helper-Flows.
- Tailnet- oder LAN-Verbindungen auf demselben Host gelten für Pairing weiterhin als remote und
  erfordern Genehmigung.
- Alle WS-Clients müssen beim `connect` eine `device`-Identität angeben (operator + node).
  Die Control UI kann sie nur in diesen Modi weglassen:
  - `gateway.controlUi.allowInsecureAuth=true` für inkompatibilitätsbedingte unsichere HTTP-Nutzung nur auf localhost.
  - erfolgreiche Operator-Control-UI-Authentifizierung mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, starke Sicherheitsverschlechterung).
- Alle Verbindungen müssen die vom Server bereitgestellte Nonce `connect.challenge` signieren.

### Diagnostik zur Migration der Geräteauthentifizierung

Für Legacy-Clients, die weiterhin das Signaturverhalten vor `connect.challenge` verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                   | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Die Signatur-Payload stimmt nicht mit der v2-Payload überein. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Der signierte Zeitstempel liegt außerhalb des erlaubten Skews. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/Kanonisierung des Public Key ist fehlgeschlagen. |

Ziel der Migration:

- Immer auf `connect.challenge` warten.
- Die v2-Payload signieren, die die Server-Nonce enthält.
- Dieselbe Nonce in `connect.params.device.nonce` senden.
- Bevorzugte Signatur-Payload ist `v3`, die `platform` und `deviceFamily`
  zusätzlich zu Feldern für Gerät/Client/Rolle/Scopes/Token/Nonce bindet.
- Legacy-`v2`-Signaturen bleiben aus Kompatibilitätsgründen akzeptiert, aber das Pinning gepaarter Geräte-
  Metadaten steuert weiterhin die Befehlsrichtlinie bei erneuter Verbindung.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Fingerprint des Gateway-Zertifikats pinnen (siehe Konfiguration `gateway.tls`
  sowie `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Umfang

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche ist durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.

## Verwandt

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
