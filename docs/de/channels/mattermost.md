---
read_when:
    - Beim Einrichten von Mattermost
    - Beim Debuggen des Mattermost-Routings
summary: Einrichtung des Mattermost-Bots und OpenClaw-Konfiguration
title: Mattermost
x-i18n:
    generated_at: "2026-04-05T12:36:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f21dc7543176fda0b38b00fab60f0daae38dffcf68fa1cf7930a9f14ec57cb5a
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: gebündeltes Plugin (Bot-Token + WebSocket-Ereignisse). Kanäle, Gruppen und DMs werden unterstützt.
Mattermost ist eine selbst hostbare Team-Messaging-Plattform; siehe die offizielle Website unter
[mattermost.com](https://mattermost.com) für Produktdetails und Downloads.

## Gebündeltes Plugin

Mattermost wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
gepackte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Mattermost ausschließt,
installieren Sie es manuell:

Installation über die CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/mattermost
```

Lokaler Checkout (beim Ausführen aus einem Git-Repo):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Details: [Plugins](/tools/plugin)

## Schnelleinrichtung

1. Stellen Sie sicher, dass das Mattermost-Plugin verfügbar ist.
   - Aktuelle gepackte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Erstellen Sie ein Mattermost-Bot-Konto und kopieren Sie das **Bot-Token**.
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
- Wenn `callbackUrl` fehlt, leitet OpenClaw eine URL aus Gateway-Host/-Port + `callbackPath` ab.
- Für Multi-Account-Setups kann `commands` auf Top-Level-Ebene oder unter
  `channels.mattermost.accounts.<id>.commands` gesetzt werden (Account-Werte überschreiben Top-Level-Felder).
- Befehls-Callbacks werden mit den pro Befehl zurückgegebenen Tokens validiert, die
  Mattermost bereitstellt, wenn OpenClaw `oc_*`-Befehle registriert.
- Slash-Callbacks schlagen fail-closed fehl, wenn die Registrierung fehlgeschlagen ist, der Start nur teilweise erfolgte oder
  das Callback-Token nicht mit einem der registrierten Befehle übereinstimmt.
- Erreichbarkeitsanforderung: Der Callback-Endpunkt muss vom Mattermost-Server aus erreichbar sein.
  - Setzen Sie `callbackUrl` nicht auf `localhost`, es sei denn, Mattermost läuft im selben Host-/Netzwerk-Namespace wie OpenClaw.
  - Setzen Sie `callbackUrl` nicht auf Ihre Mattermost-Basis-URL, es sei denn, diese URL leitet `/api/channels/mattermost/command` per Reverse-Proxy an OpenClaw weiter.
  - Eine schnelle Prüfung ist `curl https://<gateway-host>/api/channels/mattermost/command`; ein GET sollte von OpenClaw `405 Method Not Allowed` und nicht `404` zurückgeben.
- Mattermost-Egress-Allowlist-Anforderung:
  - Wenn Ihr Callback auf private/Tailnet-/interne Adressen zielt, setzen Sie in Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` so, dass der Callback-Host/-Domain enthalten ist.
  - Verwenden Sie Host-/Domain-Einträge, keine vollständigen URLs.
    - Gut: `gateway.tailnet-name.ts.net`
    - Schlecht: `https://gateway.tailnet-name.ts.net`

## Umgebungsvariablen (Standard-Account)

Setzen Sie diese auf dem Gateway-Host, wenn Sie Umgebungsvariablen bevorzugen:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Umgebungsvariablen gelten nur für den **Standard**-Account (`default`). Andere Accounts müssen Konfigurationswerte verwenden.

## Chat-Modi

Mattermost antwortet automatisch auf DMs. Das Verhalten in Kanälen wird durch `chatmode` gesteuert:

- `oncall` (Standard): nur in Kanälen antworten, wenn per @Mention erwähnt.
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

- `onchar` antwortet weiterhin auf explizite @Mentions.
- `channels.mattermost.requireMention` wird für Legacy-Konfigurationen berücksichtigt, aber `chatmode` wird bevorzugt.

## Threading und Sitzungen

Verwenden Sie `channels.mattermost.replyToMode`, um zu steuern, ob Antworten in Kanälen und Gruppen im
Hauptkanal bleiben oder einen Thread unter dem auslösenden Beitrag starten.

- `off` (Standard): nur in einem Thread antworten, wenn der eingehende Beitrag sich bereits in einem befindet.
- `first`: bei Kanal-/Gruppenbeiträgen auf oberster Ebene einen Thread unter diesem Beitrag starten und die
  Konversation an eine threadbezogene Sitzung routen.
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

- Threadbezogene Sitzungen verwenden die ID des auslösenden Beitrags als Thread-Wurzel.
- `first` und `all` sind derzeit äquivalent, weil, sobald Mattermost eine Thread-Wurzel hat,
  Folgeblöcke und Medien im selben Thread fortgesetzt werden.

## Zugriffskontrolle (DMs)

- Standard: `channels.mattermost.dmPolicy = "pairing"` (unbekannte Absender erhalten einen Pairing-Code).
- Genehmigung über:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Öffentliche DMs: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanäle (Gruppen)

- Standard: `channels.mattermost.groupPolicy = "allowlist"` (Mention-Gating).
- Absender mit `channels.mattermost.groupAllowFrom` auf die Allowlist setzen (Benutzer-IDs empfohlen).
- Mention-Überschreibungen pro Kanal befinden sich unter `channels.mattermost.groups.<channelId>.requireMention`
  oder `channels.mattermost.groups["*"].requireMention` als Standard.
- `@username`-Abgleich ist veränderlich und nur aktiviert, wenn `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Offene Kanäle: `channels.mattermost.groupPolicy="open"` (Mention-Gating).
- Laufzeithinweis: Wenn `channels.mattermost` vollständig fehlt, fällt die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

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

## Ziele für die ausgehende Zustellung

Verwenden Sie diese Zielformate mit `openclaw message send` oder Cron/Webhooks:

- `channel:<id>` für einen Kanal
- `user:<id>` für eine DM
- `@username` für eine DM (über die Mattermost-API aufgelöst)

Einfache opake IDs (wie `64ifufp...`) sind in Mattermost **mehrdeutig** (Benutzer-ID vs. Kanal-ID).

OpenClaw löst sie **zuerst als Benutzer** auf:

- Wenn die ID als Benutzer existiert (`GET /api/v4/users/<id>` erfolgreich), sendet OpenClaw eine **DM**, indem es den direkten Kanal über `/api/v4/channels/direct` auflöst.
- Andernfalls wird die ID als **Kanal-ID** behandelt.

Wenn Sie deterministisches Verhalten benötigen, verwenden Sie immer die expliziten Präfixe (`user:<id>` / `channel:<id>`).

## Wiederholung für DM-Kanäle

Wenn OpenClaw an ein Mattermost-DM-Ziel sendet und dafür zuerst den direkten Kanal auflösen muss,
wiederholt es standardmäßig vorübergehende Fehler bei der Erstellung direkter Kanäle.

Verwenden Sie `channels.mattermost.dmChannelRetry`, um dieses Verhalten global für das Mattermost-Plugin anzupassen,
oder `channels.mattermost.accounts.<id>.dmChannelRetry` für einen einzelnen Account.

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
- Wiederholungen gelten für vorübergehende Fehler wie Rate Limits, 5xx-Antworten sowie Netzwerk- oder Timeout-Fehler.
- 4xx-Clientfehler außer `429` werden als dauerhaft behandelt und nicht wiederholt.

## Reaktionen (message-Tool)

- Verwenden Sie `message action=react` mit `channel=mattermost`.
- `messageId` ist die Mattermost-Beitrags-ID.
- `emoji` akzeptiert Namen wie `thumbsup` oder `:+1:` (Doppelpunkte sind optional).
- Setzen Sie `remove=true` (boolean), um eine Reaktion zu entfernen.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden als Systemereignisse an die geroutete Agent-Sitzung weitergeleitet.

Beispiele:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguration:

- `channels.mattermost.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard true).
- Überschreibung pro Account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktive Buttons (message-Tool)

Senden Sie Nachrichten mit anklickbaren Buttons. Wenn ein Benutzer auf einen Button klickt, erhält der Agent die
Auswahl und kann antworten.

Aktivieren Sie Buttons, indem Sie `inlineButtons` zu den Kanalfähigkeiten hinzufügen:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Verwenden Sie `message action=send` mit einem Parameter `buttons`. Buttons sind ein 2D-Array (Zeilen aus Buttons):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Button-Felder:

- `text` (erforderlich): angezeigtes Label.
- `callback_data` (erforderlich): Wert, der beim Klick zurückgesendet wird (wird als Aktions-ID verwendet).
- `style` (optional): `"default"`, `"primary"` oder `"danger"`.

Wenn ein Benutzer auf einen Button klickt:

1. Alle Buttons werden durch eine Bestätigungszeile ersetzt (z. B. „✓ **Yes** selected by @user“).
2. Der Agent erhält die Auswahl als eingehende Nachricht und antwortet.

Hinweise:

- Button-Callbacks verwenden HMAC-SHA256-Validierung (automatisch, keine Konfiguration erforderlich).
- Mattermost entfernt Callback-Daten aus seinen API-Antworten (Sicherheitsfunktion), daher werden beim Klick alle Buttons entfernt — ein teilweises Entfernen ist nicht möglich.
- Aktions-IDs mit Bindestrichen oder Unterstrichen werden automatisch bereinigt
  (Einschränkung des Mattermost-Routings).

Konfiguration:

- `channels.mattermost.capabilities`: Array von Fähigkeits-Strings. Fügen Sie `"inlineButtons"` hinzu, um
  die Tool-Beschreibung für Buttons im System-Prompt des Agenten zu aktivieren.
- `channels.mattermost.interactions.callbackBaseUrl`: optionale externe Basis-URL für Button-Callbacks (zum Beispiel `https://gateway.example.com`). Verwenden Sie dies, wenn Mattermost das Gateway
  nicht direkt über seinen Bind-Host erreichen kann.
- In Multi-Account-Setups können Sie dasselbe Feld auch unter
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` setzen.
- Wenn `interactions.callbackBaseUrl` fehlt, leitet OpenClaw die Callback-URL von
  `gateway.customBindHost` + `gateway.port` ab und fällt dann auf `http://localhost:<port>` zurück.
- Erreichbarkeitsregel: Die Button-Callback-URL muss vom Mattermost-Server aus erreichbar sein.
  `localhost` funktioniert nur, wenn Mattermost und OpenClaw im selben Host-/Netzwerk-Namespace laufen.
- Wenn Ihr Callback-Ziel privat/intern/Tailnet ist, fügen Sie dessen Host/Domain zu Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections` hinzu.

### Direkte API-Integration (externe Skripte)

Externe Skripte und Webhooks können Buttons direkt über die Mattermost-REST-API posten,
anstatt das `message`-Tool des Agenten zu verwenden. Verwenden Sie nach Möglichkeit `buildButtonAttachments()` aus
der Erweiterung; wenn Sie rohes JSON posten, beachten Sie diese Regeln:

**Payload-Struktur:**

```json5
{
  channel_id: "<channelId>",
  message: "Wählen Sie eine Option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // nur alphanumerisch — siehe unten
            type: "button", // erforderlich, sonst werden Klicks stillschweigend ignoriert
            name: "Approve", // angezeigtes Label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // muss mit der Button-ID übereinstimmen (für die Namensauflösung)
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

**Kritische Regeln:**

1. Attachments gehören in `props.attachments`, nicht in Top-Level-`attachments` (wird stillschweigend ignoriert).
2. Jede Aktion benötigt `type: "button"` — ohne dies werden Klicks stillschweigend verschluckt.
3. Jede Aktion benötigt ein Feld `id` — Mattermost ignoriert Aktionen ohne IDs.
4. Die Aktions-`id` darf **nur alphanumerisch** sein (`[a-zA-Z0-9]`). Bindestriche und Unterstriche beschädigen
   Mattermosts serverseitiges Aktionsrouting (liefert 404). Entfernen Sie sie vor der Verwendung.
5. `context.action_id` muss mit der `id` des Buttons übereinstimmen, damit die Bestätigungsnachricht den
   Button-Namen (z. B. „Approve“) statt einer rohen ID anzeigt.
6. `context.action_id` ist erforderlich — der Interaktions-Handler gibt ohne dieses Feld 400 zurück.

**HMAC-Token-Erzeugung:**

Das Gateway verifiziert Button-Klicks mit HMAC-SHA256. Externe Skripte müssen Tokens erzeugen,
die mit der Verifizierungslogik des Gateways übereinstimmen:

1. Das Secret aus dem Bot-Token ableiten:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Das Kontextobjekt mit allen Feldern **außer** `_token` erstellen.
3. Mit **sortierten Schlüsseln** und **ohne Leerzeichen** serialisieren (das Gateway verwendet `JSON.stringify`
   mit sortierten Schlüsseln, was kompakte Ausgabe erzeugt).
4. Signieren: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Den resultierenden Hex-Digest als `_token` im Kontext hinzufügen.

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

- Python `json.dumps` fügt standardmäßig Leerzeichen hinzu (`{"key": "val"}`). Verwenden Sie
  `separators=(",", ":")`, um Javascripts kompakter Ausgabe zu entsprechen (`{"key":"val"}`).
- Signieren Sie immer **alle** Kontextfelder (abzüglich `_token`). Das Gateway entfernt `_token` und
  signiert dann alles Verbleibende. Das Signieren einer Teilmenge führt zu stillem Verifizierungsfehler.
- Verwenden Sie `sort_keys=True` — das Gateway sortiert Schlüssel vor dem Signieren, und Mattermost kann
  Kontextfelder beim Speichern der Payload neu anordnen.
- Leiten Sie das Secret aus dem Bot-Token ab (deterministisch), nicht aus zufälligen Bytes. Das Secret
  muss in dem Prozess, der Buttons erstellt, und im Gateway, das sie verifiziert, identisch sein.

## Verzeichnisadapter

Das Mattermost-Plugin enthält einen Verzeichnisadapter, der Kanal- und Benutzernamen
über die Mattermost-API auflöst. Dadurch werden `#channel-name`- und `@username`-Ziele in
`openclaw message send` und bei Cron-/Webhook-Zustellungen unterstützt.

Keine Konfiguration erforderlich — der Adapter verwendet das Bot-Token aus der Account-Konfiguration.

## Multi-Account

Mattermost unterstützt mehrere Accounts unter `channels.mattermost.accounts`:

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

- Keine Antworten in Kanälen: Stellen Sie sicher, dass der Bot im Kanal ist und erwähnen Sie ihn (oncall), verwenden Sie ein Trigger-Präfix (onchar) oder setzen Sie `chatmode: "onmessage"`.
- Auth-Fehler: Prüfen Sie das Bot-Token, die Basis-URL und ob der Account aktiviert ist.
- Probleme mit Multi-Account: Umgebungsvariablen gelten nur für den `default`-Account.
- Native Slash-Befehle geben `Unauthorized: invalid command token.` zurück: OpenClaw
  hat das Callback-Token nicht akzeptiert. Typische Ursachen:
  - die Registrierung des Slash-Befehls ist fehlgeschlagen oder beim Start nur teilweise abgeschlossen
  - das Callback trifft das falsche Gateway/den falschen Account
  - Mattermost hat noch alte Befehle, die auf ein vorheriges Callback-Ziel zeigen
  - das Gateway wurde neu gestartet, ohne Slash-Befehle erneut zu aktivieren
- Wenn native Slash-Befehle nicht mehr funktionieren, prüfen Sie die Logs auf
  `mattermost: failed to register slash commands` oder
  `mattermost: native slash commands enabled but no commands could be registered`.
- Wenn `callbackUrl` fehlt und Logs warnen, dass das Callback zu
  `http://127.0.0.1:18789/...` aufgelöst wurde, ist diese URL wahrscheinlich nur erreichbar, wenn
  Mattermost im selben Host-/Netzwerk-Namespace wie OpenClaw läuft. Setzen Sie stattdessen eine
  explizite extern erreichbare `commands.callbackUrl`.
- Buttons erscheinen als weiße Kästchen: Der Agent sendet möglicherweise fehlerhafte Button-Daten. Prüfen Sie, ob jeder Button sowohl `text`- als auch `callback_data`-Felder hat.
- Buttons werden gerendert, aber Klicks bewirken nichts: Verifizieren Sie, dass `AllowedUntrustedInternalConnections` in der Mattermost-Serverkonfiguration `127.0.0.1 localhost` enthält und dass `EnablePostActionIntegration` in `ServiceSettings` auf `true` gesetzt ist.
- Buttons geben bei Klick 404 zurück: Die Button-`id` enthält wahrscheinlich Bindestriche oder Unterstriche. Mattermosts Aktionsrouter funktioniert nicht mit nicht alphanumerischen IDs. Verwenden Sie nur `[a-zA-Z0-9]`.
- Gateway protokolliert `invalid _token`: HMAC stimmt nicht überein. Prüfen Sie, dass Sie alle Kontextfelder signieren (nicht nur eine Teilmenge), sortierte Schlüssel verwenden und kompaktes JSON (ohne Leerzeichen) benutzen. Siehe den HMAC-Abschnitt oben.
- Gateway protokolliert `missing _token in context`: Das Feld `_token` fehlt im Kontext des Buttons. Stellen Sie sicher, dass es beim Erstellen der Integrations-Payload enthalten ist.
- In der Bestätigung wird eine rohe ID statt des Button-Namens angezeigt: `context.action_id` stimmt nicht mit der `id` des Buttons überein. Setzen Sie beide auf denselben bereinigten Wert.
- Der Agent kennt Buttons nicht: Fügen Sie `capabilities: ["inlineButtons"]` zur Mattermost-Kanalkonfiguration hinzu.

## Verwandt

- [Kanäle im Überblick](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/channels/groups) — Verhalten von Gruppenchats und Mention-Gating
- [Kanal-Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/gateway/security) — Zugriffsmodell und Härtung
