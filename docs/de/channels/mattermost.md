---
read_when:
    - Mattermost einrichten
    - Mattermost-Routing debuggen
summary: Mattermost-Bot-Einrichtung und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-04-24T06:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

Status: gebündeltes Plugin (Bot-Token + WebSocket-Ereignisse). Kanäle, Gruppen und DMs werden unterstützt.
Mattermost ist eine selbst hostbare Team-Messaging-Plattform; Produktdetails und Downloads finden Sie auf der offiziellen Website unter
[mattermost.com](https://mattermost.com).

## Gebündeltes Plugin

Mattermost wird in aktuellen OpenClaw-Releases als gebündeltes Plugin mitgeliefert, daher ist bei normalen
paketierten Builds keine separate Installation erforderlich.

Wenn Sie eine ältere Version oder eine benutzerdefinierte Installation verwenden, die Mattermost ausschließt,
installieren Sie es manuell:

Installation über die CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/mattermost
```

Lokaler Checkout (bei Ausführung aus einem Git-Repo):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung

1. Stellen Sie sicher, dass das Mattermost-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Erstellen Sie ein Mattermost-Bot-Konto und kopieren Sie das **Bot-Token**.
3. Kopieren Sie die **Basis-URL** von Mattermost (z. B. `https://chat.example.com`).
4. Konfigurieren Sie OpenClaw und starten Sie das Gateway.

Minimale Konfiguration:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Native Slash-Befehle

Native Slash-Befehle sind Opt-in. Wenn sie aktiviert sind, registriert OpenClaw `oc_*`-Slash-Befehle über
die Mattermost-API und empfängt Callback-POSTs auf dem Gateway-HTTP-Server.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Verwenden Sie dies, wenn Mattermost das Gateway nicht direkt erreichen kann (Reverse Proxy/öffentliche URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Hinweise:

- `native: "auto"` ist für Mattermost standardmäßig deaktiviert. Setzen Sie `native: true`, um es zu aktivieren.
- Wenn `callbackUrl` weggelassen wird, leitet OpenClaw eine URL aus Gateway-Host/-Port + `callbackPath` ab.
- Für Multi-Account-Setups kann `commands` auf oberster Ebene oder unter
  `channels.mattermost.accounts.<id>.commands` gesetzt werden (Account-Werte überschreiben Felder der obersten Ebene).
- Befehls-Callbacks werden mit den Befehls-spezifischen Tokens validiert, die von
  Mattermost zurückgegeben werden, wenn OpenClaw `oc_*`-Befehle registriert.
- Slash-Callbacks schlagen fail-closed fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise erfolgte oder
  das Callback-Token nicht mit einem der registrierten Befehle übereinstimmt.
- Erreichbarkeitsanforderung: Der Callback-Endpunkt muss vom Mattermost-Server aus erreichbar sein.
  - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost läuft auf demselben Host/demselben Netzwerk-Namespace wie OpenClaw.
  - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL leitet `/api/channels/mattermost/command` per Reverse Proxy an OpenClaw weiter.
  - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; ein GET sollte `405 Method Not Allowed` von OpenClaw zurückgeben, nicht `404`.
- Mattermost-Egress-Allowlist-Anforderung:
  - Wenn Ihr Callback auf private/Tailnet-/interne Adressen zielt, setzen Sie Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` so, dass der Callback-Host/-Domain enthalten ist.
  - Verwenden Sie Host-/Domain-Einträge, keine vollständigen URLs.
    - Gut: `gateway.tailnet-name.ts.net`
    - Schlecht: `https://gateway.tailnet-name.ts.net`

## Umgebungsvariablen (Standardkonto)

Setzen Sie diese auf dem Gateway-Host, wenn Sie lieber Umgebungsvariablen verwenden:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Umgebungsvariablen gelten nur für das **Standardkonto** (`default`). Andere Konten müssen Konfigurationswerte verwenden.

`MATTERMOST_URL` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Chat-Modi

Mattermost antwortet automatisch auf DMs. Das Verhalten in Kanälen wird durch `chatmode` gesteuert:

- `oncall` (Standard): nur in Kanälen antworten, wenn eine @Erwähnung erfolgt.
- `onmessage`: auf jede Kanalnachricht antworten.
- `onchar`: antworten, wenn eine Nachricht mit einem Trigger-Präfix beginnt.

Konfigurationsbeispiel:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Hinweise:

- `onchar` reagiert weiterhin auf explizite @Erwähnungen.
- `channels.mattermost.requireMention` wird für Legacy-Konfigurationen berücksichtigt, aber `chatmode` wird bevorzugt.

## Threads und Sitzungen

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Antworten in Kanälen und Gruppen im
Hauptkanal bleiben oder einen Thread unter dem auslösenden Beitrag starten.

- `off` (Standard): nur in einem Thread antworten, wenn sich der eingehende Beitrag bereits in einem befindet.
- `first`: bei Kanal-/Gruppenbeiträgen auf oberster Ebene einen Thread unter diesem Beitrag starten und die
  Unterhaltung an eine Thread-spezifische Sitzung routen.
- `all`: aktuell dasselbe Verhalten wie `first` für Mattermost.
- Direktnachrichten ignorieren diese Einstellung und bleiben ohne Thread.

Konfigurationsbeispiel:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Hinweise:

- Thread-spezifische Sitzungen verwenden die ID des auslösenden Beitrags als Thread-Wurzel.
- `first` und `all` sind derzeit gleichwertig, da Mattermost nach Vorhandensein einer Thread-Wurzel
  Folge-Chunks und Medien in demselben Thread fortsetzt.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Pairing-Code).
- Genehmigung über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanäle (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (erwähnungsgesteuert).
- Sender per `channels.mattermost.groupAllowFrom` auf die Allowlist setzen (Benutzer-IDs empfohlen).
- Pro-Kanal-Überschreibungen für Erwähnungen befinden sich unter `channels.mattermost.groups.<channelId>.requireMention`
  oder `channels.mattermost.groups["*"].requireMention` als Standard.
- `@username`-Abgleich ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Offene Kanäle: `channels.mattermost.groupPolicy="open"` (erwähnungsgesteuert).
- Laufzeithinweis: Wenn `channels.mattermost` vollständig fehlt, greift die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

Beispiel:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Ziele für ausgehende Zustellung

Verwenden Sie diese Zielformate mit `openclaw message send` oder Cron/Webhooks:

- `channel:<id>` für einen Kanal
- `user:<id>` für eine DM
- `@username` für eine DM (wird über die Mattermost-API aufgelöst)

Unpräfixierte opake IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID vs. Kanal-ID).

OpenClaw löst sie **zuerst als Benutzer** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` erfolgreich), sendet OpenClaw eine **DM**, indem der direkte Kanal über `/api/v4/channels/direct` aufgelöst wird.
- Andernfalls wird die ID als **Kanal-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).

## Wiederholung für DM-Kanäle

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und dafür zuerst den direkten Kanal auflösen muss,
werden vorübergehende Fehler bei der Erstellung direkter Kanäle standardmäßig wiederholt.

Verwenden Sie `channels.mattermost.dmChannelRetry`, um dieses Verhalten global für das Mattermost-Plugin anzupassen,
oder `channels.mattermost.accounts.<id>.dmChannelRetry` für ein einzelnes Konto.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Hinweise:

- Dies gilt nur für die Erstellung von DM-Kanälen (`/api/v4/channels/direct`), nicht für jeden Mattermost-API-Aufruf.
- Wiederholungen gelten für vorübergehende Fehler wie Ratenlimits, 5xx-Antworten sowie Netzwerk- oder Timeout-Fehler.
- 4xx-Client-Fehler außer `429` werden als dauerhaft behandelt und nicht wiederholt.

## Vorschau-Streaming

Mattermost streamt Denkprozesse, Tool-Aktivitäten und partiellen Antworttext in einen einzigen **Entwurfs-Vorschau-Beitrag**, der direkt an Ort und Stelle finalisiert wird, wenn die endgültige Antwort sicher gesendet werden kann. Die Vorschau wird auf derselben Beitrags-ID aktualisiert, anstatt den Kanal mit Nachrichten pro Chunk zu überfluten. Finale Medien-/Fehlerantworten brechen ausstehende Vorschau-Bearbeitungen ab und verwenden die normale Zustellung, anstatt einen wegwerfbaren Vorschau-Beitrag zu flushen.

Aktivieren über `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Hinweise:

- `partial` ist die übliche Wahl: ein Vorschau-Beitrag, der beim Anwachsen der Antwort bearbeitet und dann mit der vollständigen Antwort finalisiert wird.
- `block` verwendet Entwurfs-Chunks im Append-Stil innerhalb des Vorschau-Beitrags.
- `progress` zeigt während der Generierung eine Statusvorschau und veröffentlicht die endgültige Antwort erst nach Abschluss.
- `off` deaktiviert das Vorschau-Streaming.
- Wenn der Stream nicht direkt an Ort und Stelle finalisiert werden kann (z. B. wenn der Beitrag während des Streams gelöscht wurde), greift OpenClaw auf das Senden eines neuen finalen Beitrags zurück, sodass die Antwort nie verloren geht.
- Reine Reasoning-Nutzlasten werden in Kanalbeiträgen unterdrückt, einschließlich Text, der als Blockquote `> Reasoning:` ankommt. Setzen Sie `/reasoning on`, um Denkprozesse auf anderen Oberflächen zu sehen; der finale Mattermost-Beitrag enthält nur die Antwort.
- Siehe [Streaming](/de/concepts/streaming#preview-streaming-modes) für die Kanalzuordnungsmatrix.

## Reactions (Nachrichten-Tool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Beitrags-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Setzen Sie `remove=true` (Boolean), um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die geroutete Agent-Sitzung weitergeleitet.

Beispiele:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard: true).
- Überschreibung pro Konto: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Schaltflächen (Nachrichten-Tool)

Senden Sie Nachrichten mit anklickbaren Schaltflächen. Wenn ein Benutzer auf eine Schaltfläche klickt, erhält der Agent die
Auswahl und kann darauf antworten.

Aktivieren Sie Schaltflächen, indem Sie `inlineButtons` zu den Kanal-Funktionen hinzufügen:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Verwenden Sie `message action=send` mit einem `buttons`-Parameter. Schaltflächen sind ein 2D-Array (Zeilen aus Schaltflächen):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Felder der Schaltflächen:

- `text` (erforderlich): angezeigte Beschriftung.
- `callback_data` (erforderlich): beim Klicken zurückgesendeter Wert (wird als Aktions-ID verwendet).
- `style` (optional): `"default"`, `"primary"` oder `"danger"`.

Wenn ein Benutzer auf eine Schaltfläche klickt:

1. Alle Schaltflächen werden durch eine Bestätigungszeile ersetzt (z. B. „✓ **Yes** selected by @user“).
2. Der Agent erhält die Auswahl als eingehende Nachricht und antwortet.

Hinweise:

- Schaltflächen-Callbacks verwenden HMAC-SHA256-Verifikation (automatisch, keine Konfiguration erforderlich).
- Mattermost entfernt Callback-Daten aus seinen API-Antworten (Sicherheitsfunktion), daher werden beim Klicken alle Schaltflächen entfernt
  — eine teilweise Entfernung ist nicht möglich.
- Aktions-IDs, die Bindestriche oder Unterstriche enthalten, werden automatisch bereinigt
  (Einschränkung des Mattermost-Routings).

Konfiguration:

- `channels.mattermost.capabilities`: Array von Funktions-Strings. Fügen Sie `"inlineButtons"` hinzu, um
  die Tool-Beschreibung für Schaltflächen im System-Prompt des Agenten zu aktivieren.
- `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Schaltflächen-Callbacks
  (zum Beispiel `https://gateway.example.com`). Verwenden Sie dies, wenn Mattermost das Gateway
  unter seinem Bind-Host nicht direkt erreichen kann.
- In Multi-Account-Setups können Sie dasselbe Feld auch unter
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` setzen.
- Wenn `interactions.callbackBaseUrl` weggelassen wird, leitet OpenClaw die Callback-URL aus
  `gateway.customBindHost` + `gateway.port` ab und greift dann auf `http://localhost:<port>` zurück.
- Erreichbarkeitsregel: Die URL für den Schaltflächen-Callback muss vom Mattermost-Server aus erreichbar sein.
  `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host/im selben Netzwerk-Namespace laufen.
- Wenn Ihr Callback-Ziel privat/Tailnet/intern ist, fügen Sie dessen Host/Domain zu Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections` hinzu.

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Schaltflächen direkt über die Mattermost-REST-API veröffentlichen,
anstatt über das `message`-Tool des Agenten zu gehen. Verwenden Sie nach Möglichkeit `buildButtonAttachments()` aus
dem Plugin; wenn Sie rohes JSON posten, befolgen Sie diese Regeln:

**Payload-Struktur:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // nur alphanumerisch — siehe unten
            type: "button", // erforderlich, sonst werden Klicks stillschweigend ignoriert
            name: "Approve", // angezeigte Beschriftung
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // muss mit der Schaltflächen-ID übereinstimmen (für die Namensauflösung)
                action: "approve",
                // ... beliebige benutzerdefinierte Felder ...
                _token: "<hmac>", // siehe HMAC-Abschnitt unten
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Wichtige Regeln:**

1. Attachments gehören in `props.attachments`, nicht in Top-Level-`attachments` (werden stillschweigend ignoriert).
2. Jede Aktion benötigt `type: "button"` — ohne dies werden Klicks stillschweigend verschluckt.
3. Jede Aktion benötigt ein Feld `id` — Mattermost ignoriert Aktionen ohne IDs.
4. Die Aktions-`id` darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche beschädigen
   Mattermosts serverseitiges Action-Routing (liefert 404 zurück). Entfernen Sie sie vor der Verwendung.
5. `context.action_id` muss mit der `id` der Schaltfläche übereinstimmen, damit die Bestätigungsnachricht den
   Schaltflächennamen (z. B. „Approve“) statt einer rohen ID anzeigt.
6. `context.action_id` ist erforderlich — der Interaction-Handler gibt ohne dieses Feld 400 zurück.

**HMAC-Token-Erzeugung:**

Das Gateway verifiziert Schaltflächen-Klicks mit HMAC-SHA256. Externe Skripte müssen Tokens erzeugen,
die zur Verifikationslogik des Gateways passen:

1. Leiten Sie das Secret aus dem Bot-Token ab:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Erstellen Sie das Kontextobjekt mit allen Feldern **außer** `_token`.
3. Serialisieren Sie mit **sortierten Schlüsseln** und **ohne Leerzeichen** (das Gateway verwendet `JSON.stringify`
   mit sortierten Schlüsseln, was kompakten Output erzeugt).
4. Signieren: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Fügen Sie den resultierenden Hex-Digest als `_token` im Kontext hinzu.

Python-Beispiel:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Häufige HMAC-Fallstricke:

- Python-`json.dumps` fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie
  `separators=(",", ":")`, damit es zu Javascripts kompaktem Output passt (`{"key":"val"}`).
- Signieren Sie immer **alle** Kontextfelder (ohne `_token`). Das Gateway entfernt `_token` und
  signiert dann alles, was übrig bleibt. Das Signieren nur einer Teilmenge führt zu stillschweigender Verifikationsfehlschlag.
- Verwenden Sie `sort_keys=True` — das Gateway sortiert Schlüssel vor dem Signieren, und Mattermost kann
  Kontextfelder beim Speichern der Payload neu anordnen.
- Leiten Sie das Secret aus dem Bot-Token ab (deterministisch), nicht aus zufälligen Bytes. Das Secret
  muss im Prozess, der Schaltflächen erstellt, und im Gateway, das sie verifiziert, identisch sein.

## Directory-Adapter

Das Mattermost-Plugin enthält einen Directory-Adapter, der Kanal- und Benutzernamen
über die Mattermost-API auflöst. Dadurch werden `#channel-name`- und `@username`-Ziele in
`openclaw message send` sowie bei Cron-/Webhook-Zustellungen ermöglicht.

Es ist keine Konfiguration erforderlich — der Adapter verwendet das Bot-Token aus der Konto-Konfiguration.

## Multi-Account

Mattermost unterstützt mehrere Konten unter `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Fehlerbehebung

- Keine Antworten in Kanälen: Stellen Sie sicher, dass sich der Bot im Kanal befindet und erwähnen Sie ihn (oncall), verwenden Sie ein Trigger-Präfix (onchar) oder setzen Sie `chatmode: "onmessage"`.
- Auth-Fehler: Prüfen Sie das Bot-Token, die Basis-URL und ob das Konto aktiviert ist.
- Multi-Account-Probleme: Umgebungsvariablen gelten nur für das Konto `default`.
- Native Slash-Befehle geben `Unauthorized: invalid command token.` zurück: OpenClaw
  hat das Callback-Token nicht akzeptiert. Typische Ursachen:
  - die Registrierung der Slash-Befehle ist fehlgeschlagen oder beim Start nur teilweise abgeschlossen worden
  - das Callback trifft das falsche Gateway/Konto
  - Mattermost hat noch alte Befehle, die auf ein früheres Callback-Ziel zeigen
  - das Gateway wurde neu gestartet, ohne die Slash-Befehle erneut zu aktivieren
- Wenn native Slash-Befehle nicht mehr funktionieren, prüfen Sie die Logs auf
  `mattermost: failed to register slash commands` oder
  `mattermost: native slash commands enabled but no commands could be registered`.
- Wenn `callbackUrl` weggelassen wird und Logs warnen, dass das Callback zu
  `http://127.0.0.1:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn
  Mattermost auf demselben Host/im selben Netzwerk-Namespace wie OpenClaw läuft. Setzen Sie stattdessen eine
  explizite extern erreichbare `commands.callbackUrl`.
- Schaltflächen erscheinen als weiße Kästen: Der Agent sendet möglicherweise fehlerhafte Schaltflächendaten. Prüfen Sie, ob jede Schaltfläche sowohl `text`- als auch `callback_data`-Felder hat.
- Schaltflächen werden gerendert, aber Klicks bewirken nichts: Vergewissern Sie sich, dass `AllowedUntrustedInternalConnections` in der Mattermost-Serverkonfiguration `127.0.0.1 localhost` enthält und dass `EnablePostActionIntegration` in `ServiceSettings` auf `true` gesetzt ist.
- Schaltflächen liefern beim Klicken 404 zurück: Die Schaltflächen-`id` enthält wahrscheinlich Bindestriche oder Unterstriche. Mattermosts Action-Router funktioniert nicht mit nicht alphanumerischen IDs. Verwenden Sie nur `[a-zA-Z0-9]`.
- Gateway-Logs `invalid _token`: HMAC stimmt nicht überein. Prüfen Sie, dass Sie alle Kontextfelder signieren (nicht nur eine Teilmenge), sortierte Schlüssel verwenden und kompaktes JSON (ohne Leerzeichen) nutzen. Siehe den HMAC-Abschnitt oben.
- Gateway-Logs `missing _token in context`: Das Feld `_token` befindet sich nicht im Kontext der Schaltfläche. Stellen Sie sicher, dass es beim Erstellen der Integrations-Payload enthalten ist.
- Die Bestätigung zeigt die rohe ID statt des Schaltflächennamens: `context.action_id` stimmt nicht mit der `id` der Schaltfläche überein. Setzen Sie beide auf denselben bereinigten Wert.
- Der Agent kennt keine Schaltflächen: Fügen Sie `capabilities: ["inlineButtons"]` zur Mattermost-Kanalkonfiguration hinzu.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
