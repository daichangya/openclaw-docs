---
read_when:
    - Beim Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Beim Debuggen von Protokollabweichungen oder Verbindungsfehlern
    - Beim Neugenerieren von Protokoll-Schema/Modellen
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-04-05T12:44:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway-Protokoll (WebSocket)

Das Gateway-WS-Protokoll ist die **einzige Control-Plane + der einzige Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, Headless-
Nodes) verbinden sich über WebSocket und deklarieren ihre **Rolle** + ihren **Scope** zur
Handshake-Zeit.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine Anfrage `connect` sein.

## Handshake (connect)

Gateway → Client (Pre-Connect-Challenge):

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

Wenn ein Device-Token ausgegeben wird, enthält `hello-ok` außerdem:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Während der vertrauenswürdigen Bootstrap-Übergabe kann `hello-ok.auth` zusätzlich weitere
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

Für den integrierten Bootstrap-Ablauf für Node/Operator bleibt das primäre Node-Token
bei `scopes: []`, und jedes übergebene Operator-Token bleibt auf die Bootstrap-
Operator-Allowlist begrenzt (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-Scope-Prüfungen bleiben
rollenpräfixiert: Operator-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-
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

- **Anfrage**: `{type:"req", id, method, params}`
- **Antwort**: `{type:"res", id, ok, payload|error}`
- **Ereignis**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Seiteneffekten erfordern **Idempotency Keys** (siehe Schema).

## Rollen + Scopes

### Rollen

- `operator` = Control-Plane-Client (CLI/UI/Automatisierung).
- `node` = Capability-Host (camera/screen/canvas/system.run).

### Scopes (operator)

Häufige Scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets`
(oder `operator.admin`).

Per Plugin registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope anfordern, aber
reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methodenscope ist nur das erste Gate. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden zusätzlich strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
Schreibvorgänge von `/config set` und `/config unset` `operator.admin`.

`node.pair.approve` hat zusätzlich zur Basis-Scope-Prüfung der Methode eine weitere
Prüfung zur Genehmigungszeit:

- Anfragen ohne Befehl: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes deklarieren Capability-Claims beim Verbindungsaufbau:

- `caps`: Kategorien auf hoher Ebene für Capabilities.
- `commands`: Allowlist von Befehlen für invoke.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach der Geräteidentität indiziert sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, sodass UIs eine einzelne Zeile pro Gerät anzeigen können,
  selbst wenn es sowohl als **operator** als auch als **node** verbunden ist.

## Häufige RPC-Methodenfamilien

Diese Seite ist kein generierter vollständiger Dump, aber die öffentliche WS-Oberfläche ist breiter
als die obigen Handshake-/Auth-Beispiele. Dies sind die wichtigsten Methodenfamilien, die das
Gateway heute bereitstellt.

`hello-ok.features.methods` ist eine konservative Discovery-Liste, die aus
`src/gateway/server-methods-list.ts` plus geladenen Plugin-/Kanal-Methodenexports aufgebaut wird.
Behandeln Sie sie als Feature-Discovery, nicht als generierten Dump aller aufrufbaren Hilfsfunktionen,
die in `src/gateway/server-methods/*.ts` implementiert sind.

### System und Identität

- `health` gibt den gecachten oder frisch geprüften Gateway-Health-Snapshot zurück.
- `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder
  werden nur für admin-scoped Operator-Clients eingeschlossen.
- `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und
  Pairing-Abläufen verwendet wird.
- `system-presence` gibt den aktuellen Presence-Snapshot für verbundene
  Operator-/Node-Geräte zurück.
- `system-event` hängt ein Systemereignis an und kann den Presence-
  Kontext aktualisieren/broadcasten.
- `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
- `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

### Modelle und Nutzung

- `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück.
- `usage.status` gibt Zusammenfassungen von Provider-Nutzungsfenstern/verbleibendem Kontingent zurück.
- `usage.cost` gibt aggregierte Kosten-Nutzungszusammenfassungen für einen Datumsbereich zurück.
- `doctor.memory.status` gibt die Bereitschaft von Vector-Memory/Embeddings für den
  aktiven Standard-Agent-Workspace zurück.
- `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
- `sessions.usage.timeseries` gibt Zeitreihennutzung für eine Sitzung zurück.
- `sessions.usage.logs` gibt Usage-Log-Einträge für eine Sitzung zurück.

### Kanäle und Login-Hilfsfunktionen

- `channels.status` gibt Statuszusammenfassungen für integrierte und gebündelte Kanäle/Plugins zurück.
- `channels.logout` meldet einen bestimmten Kanal/Account ab, sofern der Kanal
  Logout unterstützt.
- `web.login.start` startet einen QR-/Web-Login-Ablauf für den aktuellen QR-fähigen Web-
  Kanal-Provider.
- `web.login.wait` wartet darauf, dass dieser QR-/Web-Login-Ablauf abgeschlossen wird, und startet
  den Kanal bei Erfolg.
- `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
- `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
- `voicewake.set` aktualisiert Wake-Word-Trigger und broadcastet die Änderung.

### Messaging und Logs

- `send` ist das direkte RPC für ausgehende Zustellung für
  Kanal-/Account-/Thread-gezielte Sends außerhalb des Chat-Runners.
- `logs.tail` gibt den konfigurierten Gateway-Datei-Log-Tail mit Cursor/Limit und
  Max-Byte-Steuerung zurück.

### Talk und TTS

- `talk.config` gibt die effektive Talk-Konfigurations-Payload zurück; `includeSecrets`
  erfordert `operator.talk.secrets` (oder `operator.admin`).
- `talk.mode` setzt/broadcastet den aktuellen Talk-Modus-Status für WebChat-/Control-UI-
  Clients.
- `talk.speak` synthetisiert Sprache über den aktiven Talk-Speech-Provider.
- `tts.status` gibt TTS-Aktivierungsstatus, aktiven Provider, Fallback-Provider
  und Provider-Konfigurationsstatus zurück.
- `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
- `tts.enable` und `tts.disable` schalten den TTS-Präferenzstatus um.
- `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
- `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

### Secrets, Konfiguration, Update und Wizard

- `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Secret-Status
  nur bei vollständigem Erfolg aus.
- `secrets.resolve` löst Secret-Zuweisungen für Befehlsziele für einen bestimmten
  Satz aus Befehl/Ziel auf.
- `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
- `config.set` schreibt eine validierte Konfigurations-Payload.
- `config.patch` führt ein Merge einer partiellen Konfigurationsaktualisierung durch.
- `config.apply` validiert und ersetzt die vollständige Konfigurations-Payload.
- `config.schema` gibt die Live-Konfigurations-Schema-Payload zurück, die von Control UI und
  CLI-Tooling verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten,
  einschließlich Plugin- + Kanal-Schema-Metadaten, wenn die Laufzeit sie laden kann. Das Schema
  enthält Feldmetadaten `title` / `description`, die aus denselben Labels
  und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-,
  Wildcard-, Array-Item- und `anyOf` / `oneOf` / `allOf`-Kompositionszweige, wenn passende Felddokumentation existiert.
- `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurations-
  pfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hint + `hintPath` und
  unmittelbare Zusammenfassungen von Kindknoten für UI-/CLI-Drill-down.
  - Lookup-Schemaknoten behalten die benutzerseitige Dokumentation und gängige Validierungsfelder:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    numerische/String-/Array-/Objekt-Grenzen und boolesche Flags wie
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Zusammenfassungen von Kindknoten zeigen `key`, normalisierten `path`, `type`, `required`,
    `hasChildren` sowie den passenden `hint` / `hintPath`.
- `update.run` führt den Gateway-Update-Ablauf aus und plant einen Neustart nur dann,
  wenn das Update selbst erfolgreich war.
- `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den
  Onboarding-Wizard über WS RPC bereit.

### Bestehende Hauptfamilien

#### Agent- und Workspace-Hilfsfunktionen

- `agents.list` gibt konfigurierte Agent-Einträge zurück.
- `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und
  Workspace-Verdrahtung.
- `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die
  Bootstrap-Workspace-Dateien, die für einen Agent bereitgestellt werden.
- `agent.identity.get` gibt die effektive Assistant-Identität für einen Agent oder
  eine Sitzung zurück.
- `agent.wait` wartet darauf, dass eine Ausführung abgeschlossen wird, und gibt den Terminal-Snapshot zurück,
  wenn verfügbar.

#### Sitzungssteuerung

- `sessions.list` gibt den aktuellen Sitzungsindex zurück.
- `sessions.subscribe` und `sessions.unsubscribe` schalten Sitzungsänderungs-
  Event-Subscriptions für den aktuellen WS-Client um.
- `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten
  Transcript-/Nachrichten-Event-Subscriptions für eine Sitzung um.
- `sessions.preview` gibt begrenzte Transcript-Vorschauen für bestimmte Sitzungsschlüssel zurück.
- `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
- `sessions.create` erstellt einen neuen Sitzungseintrag.
- `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
- `sessions.steer` ist die Variante zum Unterbrechen und Steuern für eine aktive Sitzung.
- `sessions.abort` bricht aktive Arbeit für eine Sitzung ab.
- `sessions.patch` aktualisiert Sitzungsmetadaten/-überschreibungen.
- `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungs-
  Wartung aus.
- `sessions.get` gibt die vollständig gespeicherte Sitzungszeile zurück.
- Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und
  `chat.inject`.
- `chat.history` ist für UI-Clients anzeigebereinigt normalisiert: Inline-Direktiven-Tags werden aus sichtbarem Text entfernt, Klartext-XML-Payloads für Tool-Aufrufe (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und
  abgeschnittener Tool-Call-Blöcke) sowie geleakte ASCII-/vollbreite Modell-
  Control-Tokens werden entfernt, reine Assistant-Zeilen mit Silent-Token wie genau `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

#### Device-Pairing und Device-Tokens

- `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
- `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten
  Device-Pairing-Datensätze.
- `device.token.rotate` rotiert ein gekoppeltes Device-Token innerhalb seiner genehmigten Rollen-
  und Scope-Grenzen.
- `device.token.revoke` widerruft ein gekoppeltes Device-Token.

#### Node-Pairing, Invoke und Pending Work

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` und `node.pair.verify` decken Node-Pairing und Bootstrap-
  Verifikation ab.
- `node.list` und `node.describe` geben bekannten/verbundenen Node-Status zurück.
- `node.rename` aktualisiert ein Label für einen gekoppelten Node.
- `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
- `node.invoke.result` gibt das Ergebnis einer Invoke-Anfrage zurück.
- `node.event` transportiert von Nodes stammende Ereignisse zurück ins Gateway.
- `node.canvas.capability.refresh` aktualisiert scoped Canvas-Capability-Tokens.
- `node.pending.pull` und `node.pending.ack` sind die Queue-APIs für verbundene Nodes.
- `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte Pending-Work
  für Offline-/getrennte Nodes.

#### Genehmigungsfamilien

- `exec.approval.request` und `exec.approval.resolve` decken einmalige Exec-
  Genehmigungsanfragen ab.
- `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt
  die endgültige Entscheidung zurück (oder `null` bei Timeout).
- `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-
  Genehmigungsrichtlinie.
- `exec.approvals.node.get` und `exec.approvals.node.set` verwalten Node-lokale Exec-
  Genehmigungsrichtlinien über Node-Relay-Befehle.
- `plugin.approval.request`, `plugin.approval.waitDecision` und
  `plugin.approval.resolve` decken plugin-definierte Genehmigungsabläufe ab.

#### Andere Hauptfamilien

- Automatisierung:
  - `wake` plant eine sofortige oder zum nächsten Heartbeat erfolgende Wake-Text-Injektion
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/Tools: `skills.*`, `tools.catalog`, `tools.effective`

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Updates wie `chat.inject` und andere nur-Transcript-Chat-
  Ereignisse.
- `session.message` und `session.tool`: Transcript-/Event-Stream-Updates für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten haben sich geändert.
- `presence`: Updates des System-Presence-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Update des Gateway-Health-Snapshots.
- `heartbeat`: Update des Heartbeat-Ereignisstreams.
- `cron`: Ereignisänderung eines Cron-Laufs/Cron-Jobs.
- `shutdown`: Gateway-Shutdown-Benachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus von Node-Pairing.
- `node.invoke.request`: Broadcast einer Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Konfiguration der Wake-Word-Trigger wurde geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus von Exec-
  Genehmigungen.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus von Plugin-
  Genehmigungen.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste von Skill-Executables
  für Auto-Allow-Prüfungen abzurufen.

### Operator-Hilfsmethoden

- Operators können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Tool-Katalog für einen
  Agent abzurufen. Die Antwort enthält gruppierte Tools und Provenance-Metadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Owner, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operators können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit effektive Tool-
  Inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, anstatt
    vom Aufrufer bereitgestellten Auth- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist auf die Sitzung begrenzt und spiegelt wider, was die aktive Unterhaltung aktuell
    verwenden kann, einschließlich Core-, Plugin- und Kanal-Tools.
- Operators können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agent abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operators können `skills.search` und `skills.detail` (`operator.read`) für
  Discovery-Metadaten von ClawHub aufrufen.
- Operators können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des Standard-Agent-Workspaces.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte Aktion `metadata.openclaw.install` auf dem Gateway-Host aus.
- Operators können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen verfolgten Slug oder alle verfolgten ClawHub-Installationen im
    Standard-Agent-Workspace.
  - Der Konfigurationsmodus patched Werte unter `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env`.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage Genehmigung benötigt, broadcastet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies auf, indem sie `exec.approval.resolve` aufrufen (erfordert Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe dieses kanonische
  `systemRunPlan` erneut als maßgeblichen Befehl-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen `prepare` und der endgültig genehmigten Weiterleitung von `system.run` verändert, lehnt das
  Gateway die Ausführung ab, statt der veränderten Payload zu vertrauen.

## Agent-Zustellungs-Fallback

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Zustellziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt einen Fallback auf nur-Sitzungs-Ausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/WebChat-Sitzungen oder mehrdeutige Multi-Channel-Konfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Abweichungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- Gemeinsame Secret-Gateway-Authentifizierung verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Modi mit Identitätsbezug wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder Nicht-Loopback-
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung aus
  Request-Headern statt aus `connect.params.auth.*`.
- Privater Ingress mit `gateway.auth.mode: "none"` überspringt die Connect-Authentifizierung per Shared Secret
  vollständig; dieser Modus darf nicht über öffentlichen/nicht vertrauenswürdigen Ingress exponiert werden.
- Nach dem Pairing gibt das Gateway ein **Device-Token** aus, das auf Verbindungs-
  Rolle + Scopes begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte vom Client
  für zukünftige Verbindungen persistiert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistieren.
- Beim Wiederverbinden mit diesem **gespeicherten** Device-Token sollte auch der gespeicherte
  genehmigte Scope-Satz für dieses Token wiederverwendet werden. Dadurch bleibt bereits gewährter
  Lese-/Probe-/Status-Zugriff erhalten und es wird vermieden, dass Wiederverbindungen stillschweigend auf einen
  engeren impliziten reinen Admin-Scope zusammenfallen.
- Normale Connect-Auth-Priorität ist zuerst explizites Shared Token/Passwort, dann
  explizites `deviceToken`, dann gespeichertes Token pro Gerät, dann Bootstrap-Token.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Übergabetokens.
  Persistieren Sie sie nur, wenn die Verbindung Bootstrap-Auth auf einem vertrauenswürdigen Transport
  wie `wss://` oder Loopback/lokal verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` angibt, bleibt dieser
  vom Aufrufer angeforderte Scope-Satz maßgeblich; gecachte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte gerätespezifische Token wiederverwendet.
- Device-Tokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert Scope `operator.pairing`).
- Ausgabe/Rotation von Tokens bleibt auf den genehmigten Rollensatz begrenzt, der im
  Pairing-Eintrag des Geräts aufgezeichnet ist; das Rotieren eines Tokens kann das Gerät nicht in eine
  Rolle erweitern, die bei der Pairing-Genehmigung nie gewährt wurde.
- Für Sitzungen mit Token gekoppelter Geräte ist die Geräteverwaltung selbstbezogen, sofern der
  Aufrufer nicht zusätzlich `operator.admin` hat: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` prüft außerdem den angeforderten Operator-Scope-Satz gegen die
  aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer können ein Token nicht in einen
  breiteren Operator-Scope-Satz rotieren, als sie bereits besitzen.
- Auth-Fehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients können einen begrenzten Retry mit einem gecachten gerätespezifischen Token versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Wiederverbindungsschleifen stoppen und Hinweise für Operator-Aktionen anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) einschließen, die von einem
  Fingerabdruck eines Schlüsselpaares abgeleitet ist.
- Gateways geben Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale Auto-Genehmigung
  nicht aktiviert ist.
- Die Auto-Genehmigung beim Pairing ist auf direkte lokale Loopback-Verbindungen konzentriert.
- OpenClaw hat außerdem einen engen Self-Connect-Pfad für vertrauenswürdige
  Shared-Secret-Helper-Abläufe im Backend/Container-lokal.
- Verbindungen über Tailnet oder LAN auf demselben Host werden weiterhin als remote behandelt und
  erfordern Genehmigung.
- Alle WS-Clients müssen während `connect` eine Geräteidentität einschließen (operator + node).
  Control UI kann sie nur in diesen Modi weglassen:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only inkompatibilitätsfreundliches unsicheres HTTP.
  - erfolgreiche Operator-Control-UI-Authentifizierung mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, starke Sicherheitsabstufung).
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Migrationsdiagnostik für Device-Auth

Für Legacy-Clients, die noch Signaturverhalten vor der Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                            |
| --------------------------- | -------------------------------- | ------------------------ | ---------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload stimmt nicht mit der v2-Payload überein. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb des zulässigen Skews. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Fingerabdruck des Public Keys überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/Kanonisierung des Public Keys fehlgeschlagen. |

Migrationsziel:

- Immer auf `connect.challenge` warten.
- Die v2-Payload signieren, die die Server-Nonce enthält.
- Dieselbe Nonce in `connect.params.device.nonce` senden.
- Bevorzugte Signatur-Payload ist `v3`, das zusätzlich zu Device-/Client-/Rolle-/Scopes-/Token-/Nonce-Feldern auch `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen bleiben aus Kompatibilitätsgründen akzeptiert, aber das Pinning von Metadaten gekoppelter Geräte steuert weiterhin die Befehlsrichtlinie bei Wiederverbindungen.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Zertifikats-Fingerprint des Gateways pinnen (siehe Konfiguration `gateway.tls`
  plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Umfang

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche ist durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.
