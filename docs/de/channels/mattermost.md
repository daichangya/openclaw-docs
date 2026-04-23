---
read_when:
    - Mattermost einrichten
    - Mattermost-Routing debuggen
summary: Einrichtung des Mattermost-Bots und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T13:58:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: gebündeltes Plugin (Bot-Token + WebSocket-Ereignisse). Kanäle, Gruppen und DMs werden unterstützt.
Mattermost ist eine selbst hostbare Team-Messaging-Plattform; Produktdetails und Downloads finden Sie auf der offiziellen Website unter
[mattermost.com](https://mattermost.com).

## Gebündeltes Plugin

Mattermost wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher
benötigen normale paketierte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation ohne Mattermost verwenden,
installieren Sie es manuell:

Über die CLI installieren (npm-Registry):

```bash
openclaw plugins install @openclaw/mattermost
```

Lokaler Checkout (bei Ausführung aus einem git-Repo):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

1. Stellen Sie sicher, dass das Mattermost-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Erstellen Sie ein Mattermost-Bot-Konto und kopieren Sie den **Bot-Token**.
3. Kopieren Sie die Mattermost-**Basis-URL** (z. B. `https://chat.example.com`).
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

Native Slash-Befehle sind optional. Wenn sie aktiviert sind, registriert OpenClaw `oc_*`-Slash-Befehle über
die Mattermost-API und empfängt Callback-POSTs auf dem Gateway-HTTP-Server.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Verwenden, wenn Mattermost das Gateway nicht direkt erreichen kann (Reverse-Proxy/öffentliche URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Hinweise:

- `native: "auto"` ist für Mattermost standardmäßig deaktiviert. Setzen Sie `native: true`, um es zu aktivieren.
- Wenn `callbackUrl` weggelassen wird, leitet OpenClaw eine URL aus Gateway-Host/Port + `callbackPath` ab.
- Für Multi-Account-Setups kann `commands` auf der obersten Ebene oder unter
  `channels.mattermost.accounts.<id>.commands` gesetzt werden (Konto-Werte überschreiben Felder der obersten Ebene).
- Command-Callbacks werden mit den pro Befehl zurückgegebenen Tokens validiert,
  die Mattermost bei der Registrierung von `oc_*`-Befehlen an OpenClaw zurückgibt.
- Slash-Callbacks schlagen fail-closed fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise erfolgreich war oder
  das Callback-Token nicht mit einem der registrierten Befehle übereinstimmt.
- Erreichbarkeitsanforderung: Der Callback-Endpunkt muss vom Mattermost-Server aus erreichbar sein.
  - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost läuft auf demselben Host/im selben Netzwerk-Namespace wie OpenClaw.
  - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL leitet `/api/channels/mattermost/command` per Reverse Proxy an OpenClaw weiter.
  - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; ein GET sollte `405 Method Not Allowed` von OpenClaw zurückgeben, nicht `404`.
- Mattermost-Anforderung für Egress-Positivlisten:
  - Wenn Ihr Callback auf private/tailnet/interne Adressen zielt, setzen Sie in Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` so, dass der Callback-Host/Domain enthalten ist.
  - Verwenden Sie Host-/Domain-Einträge, keine vollständigen URLs.
    - Gut: `gateway.tailnet-name.ts.net`
    - Schlecht: `https://gateway.tailnet-name.ts.net`

## Umgebungsvariablen (Standardkonto)

Setzen Sie diese auf dem Gateway-Host, wenn Sie lieber Umgebungsvariablen verwenden:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Umgebungsvariablen gelten nur für das **Standard**-Konto (`default`). Andere Konten müssen Konfigurationswerte verwenden.

`MATTERMOST_URL` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## Chat-Modi

Mattermost antwortet automatisch auf DMs. Das Verhalten in Kanälen wird durch `chatmode` gesteuert:

- `oncall` (Standard): nur in Kanälen antworten, wenn per @mention erwähnt.
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

- `onchar` antwortet weiterhin auf explizite @mentions.
- `channels.mattermost.requireMention` wird für Legacy-Konfigurationen berücksichtigt, aber `chatmode` wird bevorzugt.

## Threads und Sitzungen

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Antworten in Kanälen und Gruppen im
Hauptkanal bleiben oder einen Thread unter dem auslösenden Beitrag starten.

- `off` (Standard): nur in einem Thread antworten, wenn der eingehende Beitrag bereits in einem ist.
- `first`: bei Kanal-/Gruppenbeiträgen der obersten Ebene einen Thread unter diesem Beitrag starten und die
  Unterhaltung an eine threadbezogene Sitzung weiterleiten.
- `all`: heute für Mattermost dasselbe Verhalten wie `first`.
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

- Threadbezogene Sitzungen verwenden die ID des auslösenden Beitrags als Thread-Wurzel.
- `first` und `all` sind derzeit gleichwertig, weil Mattermost nach Vorhandensein einer Thread-Wurzel
  Folge-Chunks und Medien in demselben Thread weiterführt.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Pairing-Code).
- Genehmigen über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanäle (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (durch Erwähnung eingeschränkt).
- Absender mit `channels.mattermost.groupAllowFrom` auf die Positivliste setzen (Benutzer-IDs empfohlen).
- Kanalbezogene Überschreibungen für Erwähnungen befinden sich unter `channels.mattermost.groups.<channelId>.requireMention`
  oder `channels.mattermost.groups["*"].requireMention` als Standardwert.
- `@username`-Abgleich ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Offene Kanäle: `channels.mattermost.groupPolicy="open"` (durch Erwähnung eingeschränkt).
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
- `@username` für eine DM (über die Mattermost-API aufgelöst)

Einfache opake IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID oder Kanal-ID).

OpenClaw löst sie **zuerst als Benutzer** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` erfolgreich), sendet OpenClaw eine **DM**, indem der Direktkanal über `/api/v4/channels/direct` aufgelöst wird.
- Andernfalls wird die ID als **Kanal-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).

## Wiederholung bei DM-Kanälen

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und zuerst den Direktkanal auflösen muss,
wiederholt es standardmäßig vorübergehende Fehler bei der Erstellung des Direktkanals.

Verwenden Sie `channels.mattermost.dmChannelRetry`, um dieses Verhalten global für das Mattermost-Plugin zu konfigurieren,
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
- Wiederholungen gelten für vorübergehende Fehler wie Rate-Limits, 5xx-Antworten sowie Netzwerk- oder Timeout-Fehler.
- 4xx-Clientfehler außer `429` gelten als dauerhaft und werden nicht wiederholt.

## Vorschau-Streaming

Mattermost streamt Denken, Tool-Aktivität und teilweisen Antworttext in einen einzelnen **Entwurfs-Vorschau-Beitrag**, der an Ort und Stelle finalisiert wird, sobald die endgültige Antwort sicher gesendet werden kann. Die Vorschau wird auf derselben Beitrags-ID aktualisiert, statt den Kanal mit Nachrichten pro Chunk zu überfluten. Finale Medien-/Fehlerantworten brechen ausstehende Vorschau-Bearbeitungen ab und verwenden normale Zustellung, statt einen Wegwerf-Vorschau-Beitrag zu leeren.

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
- `block` verwendet Anhänge-Stil-Entwurfs-Chunks innerhalb des Vorschau-Beitrags.
- `progress` zeigt während der Generierung eine Statusvorschau und postet die endgültige Antwort erst nach Abschluss.
- `off` deaktiviert Vorschau-Streaming.
- Wenn der Stream nicht an Ort und Stelle finalisiert werden kann (zum Beispiel wenn der Beitrag während des Streams gelöscht wurde), sendet OpenClaw stattdessen einen neuen finalen Beitrag, damit die Antwort nie verloren geht.
- Nur-Denken-Payloads werden in Kanalbeiträgen unterdrückt, einschließlich Text, der als `> Reasoning:`-Blockquote ankommt. Setzen Sie `/reasoning on`, um Gedanken in anderen Oberflächen zu sehen; der finale Mattermost-Beitrag enthält nur die Antwort.
- Siehe [Streaming](/de/concepts/streaming#preview-streaming-modes) für die Matrix zur Kanalzuordnung.

## Reaktionen (Nachrichten-Tool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Beitrags-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Setzen Sie `remove=true` (Boolean), um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die weitergeleitete Agent-Sitzung übertragen.

Beispiele:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard: true).
- Konto-spezifische Überschreibung: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Schaltflächen (Nachrichten-Tool)

Senden Sie Nachrichten mit anklickbaren Schaltflächen. Wenn ein Benutzer auf eine Schaltfläche klickt, erhält der Agent die
Auswahl und kann antworten.

Aktivieren Sie Schaltflächen, indem Sie `inlineButtons` zu den Kanalfähigkeiten hinzufügen:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Verwenden Sie `message action=send` mit einem `buttons`-Parameter. Schaltflächen sind ein 2D-Array (Zeilen von Schaltflächen):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Felder für Schaltflächen:

- `text` (erforderlich): angezeigte Beschriftung.
- `callback_data` (erforderlich): bei Klick zurückgesendeter Wert (wird als Aktions-ID verwendet).
- `style` (optional): `"default"`, `"primary"` oder `"danger"`.

Wenn ein Benutzer auf eine Schaltfläche klickt:

1. Alle Schaltflächen werden durch eine Bestätigungszeile ersetzt (z. B. „✓ **Yes** von @user ausgewählt“).
2. Der Agent erhält die Auswahl als eingehende Nachricht und antwortet.

Hinweise:

- Callbacks für Schaltflächen verwenden HMAC-SHA256-Verifizierung (automatisch, keine Konfiguration erforderlich).
- Mattermost entfernt Callback-Daten aus seinen API-Antworten (Sicherheitsfunktion), daher werden bei einem Klick alle Schaltflächen
  entfernt — eine teilweise Entfernung ist nicht möglich.
- Aktions-IDs mit Bindestrichen oder Unterstrichen werden automatisch bereinigt
  (Routing-Einschränkung von Mattermost).

Konfiguration:

- `channels.mattermost.capabilities`: Array von Fähigkeits-Strings. Fügen Sie `"inlineButtons"` hinzu, um
  die Beschreibung des Schaltflächen-Tools im System-Prompt des Agenten zu aktivieren.
- `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Schaltflächen-
  Callbacks (zum Beispiel `https://gateway.example.com`). Verwenden Sie dies, wenn Mattermost das
  Gateway an seinem Bind-Host nicht direkt erreichen kann.
- In Multi-Account-Setups können Sie dasselbe Feld auch unter
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` setzen.
- Wenn `interactions.callbackBaseUrl` weggelassen wird, leitet OpenClaw die Callback-URL aus
  `gateway.customBindHost` + `gateway.port` ab und greift dann auf `http://localhost:<port>` zurück.
- Erreichbarkeitsregel: Die Schaltflächen-Callback-URL muss vom Mattermost-Server aus erreichbar sein.
  `localhost` funktioniert nur, wenn Mattermost und OpenClaw auf demselben Host/im selben Netzwerk-Namespace laufen.
- Wenn Ihr Callback-Ziel privat/tailnet/intern ist, fügen Sie dessen Host/Domain zu Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections` hinzu.

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Schaltflächen direkt über die Mattermost-REST-API posten,
anstatt über das `message`-Tool des Agenten zu gehen. Verwenden Sie nach Möglichkeit `buildButtonAttachments()` aus
dem Plugin; wenn Sie rohes JSON posten, beachten Sie diese Regeln:

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

1. Attachments gehören in `props.attachments`, nicht in das Top-Level-`attachments` (wird stillschweigend ignoriert).
2. Jede Aktion benötigt `type: "button"` — ohne dieses Feld werden Klicks stillschweigend geschluckt.
3. Jede Aktion benötigt ein Feld `id` — Mattermost ignoriert Aktionen ohne IDs.
4. Die Aktions-`id` darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche
   zerstören das serverseitige Aktions-Routing von Mattermost (liefert 404 zurück). Vor der Verwendung entfernen.
5. `context.action_id` muss mit der `id` der Schaltfläche übereinstimmen, damit die Bestätigungsnachricht den
   Schaltflächennamen (z. B. „Approve“) statt einer rohen ID anzeigt.
6. `context.action_id` ist erforderlich — der Interaktions-Handler gibt ohne dieses Feld 400 zurück.

**Erzeugung von HMAC-Tokens:**

Das Gateway verifiziert Schaltflächen-Klicks mit HMAC-SHA256. Externe Skripte müssen Tokens erzeugen,
die der Verifizierungslogik des Gateways entsprechen:

1. Leiten Sie das Secret aus dem Bot-Token ab:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Erstellen Sie das Context-Objekt mit allen Feldern **außer** `_token`.
3. Serialisieren Sie mit **sortierten Schlüsseln** und **ohne Leerzeichen** (das Gateway verwendet `JSON.stringify`
   mit sortierten Schlüsseln, was kompakten Output erzeugt).
4. Signieren: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Fügen Sie den resultierenden Hex-Digest als `_token` zum Context hinzu.

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

- `json.dumps` in Python fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie
  `separators=(",", ":")`, um mit der kompakten JavaScript-Ausgabe übereinzustimmen (`{"key":"val"}`).
- Signieren Sie immer **alle** Context-Felder (ohne `_token`). Das Gateway entfernt `_token` und
  signiert dann alles Verbleibende. Das Signieren nur einer Teilmenge führt zu stillschweigendem Verifizierungsfehler.
- Verwenden Sie `sort_keys=True` — das Gateway sortiert Schlüssel vor dem Signieren, und Mattermost kann
  Context-Felder beim Speichern des Payloads neu anordnen.
- Leiten Sie das Secret aus dem Bot-Token ab (deterministisch), nicht aus zufälligen Bytes. Das Secret
  muss in dem Prozess, der Schaltflächen erstellt, und im Gateway, das sie verifiziert, identisch sein.

## Verzeichnis-Adapter

Das Mattermost-Plugin enthält einen Verzeichnis-Adapter, der Kanal- und Benutzernamen
über die Mattermost-API auflöst. Dadurch werden `#channel-name`- und `@username`-Ziele in
`openclaw message send` sowie bei Cron-/Webhook-Zustellungen ermöglicht.

Keine Konfiguration erforderlich — der Adapter verwendet das Bot-Token aus der Kontokonfiguration.

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

- Keine Antworten in Kanälen: Stellen Sie sicher, dass sich der Bot im Kanal befindet und erwähnen Sie ihn (`oncall`), verwenden Sie ein Trigger-Präfix (`onchar`) oder setzen Sie `chatmode: "onmessage"`.
- Authentifizierungsfehler: Prüfen Sie Bot-Token, Basis-URL und ob das Konto aktiviert ist.
- Probleme mit Multi-Account: Umgebungsvariablen gelten nur für das Konto `default`.
- Native Slash-Befehle geben `Unauthorized: invalid command token.` zurück: OpenClaw
  hat das Callback-Token nicht akzeptiert. Typische Ursachen:
  - die Registrierung des Slash-Befehls ist fehlgeschlagen oder wurde beim Start nur teilweise abgeschlossen
  - der Callback trifft das falsche Gateway/Konto
  - Mattermost hat noch alte Befehle, die auf ein vorheriges Callback-Ziel zeigen
  - das Gateway wurde neu gestartet, ohne die Slash-Befehle erneut zu aktivieren
- Wenn native Slash-Befehle nicht mehr funktionieren, prüfen Sie die Logs auf
  `mattermost: failed to register slash commands` oder
  `mattermost: native slash commands enabled but no commands could be registered`.
- Wenn `callbackUrl` weggelassen wird und die Logs warnen, dass der Callback zu
  `http://127.0.0.1:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn
  Mattermost auf demselben Host/im selben Netzwerk-Namespace wie OpenClaw läuft. Setzen Sie stattdessen eine
  explizite extern erreichbare `commands.callbackUrl`.
- Schaltflächen erscheinen als weiße Kästen: Der Agent sendet möglicherweise fehlerhafte Schaltflächen-Daten. Prüfen Sie, ob jede Schaltfläche sowohl `text`- als auch `callback_data`-Felder hat.
- Schaltflächen werden gerendert, aber Klicks bewirken nichts: Prüfen Sie, ob `AllowedUntrustedInternalConnections` in der Mattermost-Serverkonfiguration `127.0.0.1 localhost` enthält und ob `EnablePostActionIntegration` in `ServiceSettings` auf `true` gesetzt ist.
- Schaltflächen geben bei Klick 404 zurück: Die Schaltflächen-`id` enthält wahrscheinlich Bindestriche oder Unterstriche. Mattermosts Aktions-Router funktioniert nicht mit nicht alphanumerischen IDs. Verwenden Sie nur `[a-zA-Z0-9]`.
- Gateway protokolliert `invalid _token`: HMAC stimmt nicht überein. Prüfen Sie, ob Sie alle Context-Felder signieren (nicht nur eine Teilmenge), sortierte Schlüssel verwenden und kompaktes JSON nutzen (ohne Leerzeichen). Siehe den HMAC-Abschnitt oben.
- Gateway protokolliert `missing _token in context`: Das Feld `_token` befindet sich nicht im Context der Schaltfläche. Stellen Sie sicher, dass es beim Erstellen des Integrations-Payloads enthalten ist.
- Die Bestätigung zeigt eine rohe ID statt des Schaltflächennamens: `context.action_id` stimmt nicht mit der `id` der Schaltfläche überein. Setzen Sie beide auf denselben bereinigten Wert.
- Der Agent kennt keine Schaltflächen: Fügen Sie `capabilities: ["inlineButtons"]` zur Mattermost-Kanalkonfiguration hinzu.

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungs-Gating
- [Channel Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
