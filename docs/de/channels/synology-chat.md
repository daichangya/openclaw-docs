---
read_when:
    - Synology Chat mit OpenClaw einrichten
    - Debugging des Synology Chat-Webhooks-Routings
summary: Einrichtung des Synology Chat-Webhooks und OpenClaw-Konfiguration
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T13:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: gebündelter Plugin-Direktnachrichtenkanal mit Synology Chat-Webhooks.
Das Plugin akzeptiert eingehende Nachrichten aus ausgehenden Webhooks von Synology Chat und sendet Antworten
über einen eingehenden Webhook von Synology Chat.

## Gebündeltes Plugin

Synology Chat wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher ist bei normalen
Paket-Builds keine separate Installation erforderlich.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Synology Chat ausschließt,
installieren Sie es manuell:

Aus einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung

1. Stellen Sie sicher, dass das Synology Chat-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell aus einem Source-Checkout mit dem obigen Befehl hinzufügen.
   - `openclaw onboard` zeigt Synology Chat jetzt in derselben Liste zur Kanaleinrichtung wie `openclaw channels add`.
   - Nicht interaktive Einrichtung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. In den Synology Chat-Integrationen:
   - Erstellen Sie einen eingehenden Webhook und kopieren Sie seine URL.
   - Erstellen Sie einen ausgehenden Webhook mit Ihrem geheimen Token.
3. Richten Sie die URL des ausgehenden Webhooks auf Ihr OpenClaw-Gateway:
   - Standardmäßig `https://gateway-host/webhook/synology`.
   - Oder Ihren benutzerdefinierten `channels.synology-chat.webhookPath`.
4. Schließen Sie die Einrichtung in OpenClaw ab.
   - Geführt: `openclaw onboard`
   - Direkt: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Starten Sie das Gateway neu und senden Sie eine DM an den Synology Chat-Bot.

Details zur Webhook-Authentifizierung:

- OpenClaw akzeptiert das Token des ausgehenden Webhooks zuerst aus `body.token`, dann
  aus `?token=...`, dann aus Headern.
- Akzeptierte Header-Formen:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Leere oder fehlende Tokens werden fail-closed behandelt.

Minimale Konfiguration:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Umgebungsvariablen

Für das Standardkonto können Sie Umgebungsvariablen verwenden:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (durch Kommas getrennt)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Konfigurationswerte überschreiben Umgebungsvariablen.

`SYNOLOGY_CHAT_INCOMING_URL` kann nicht aus einer Workspace-`.env` gesetzt werden; siehe [Workspace-`.env`-Dateien](/de/gateway/security).

## DM-Richtlinie und Zugriffskontrolle

- `dmPolicy: "allowlist"` ist die empfohlene Standardeinstellung.
- `allowedUserIds` akzeptiert eine Liste (oder eine durch Kommas getrennte Zeichenfolge) von Synology-Benutzer-IDs.
- Im Modus `allowlist` wird eine leere `allowedUserIds`-Liste als Fehlkonfiguration behandelt und die Webhook-Route wird nicht gestartet (verwenden Sie `dmPolicy: "open"` für Alle-zulassen).
- `dmPolicy: "open"` erlaubt jeden Absender.
- `dmPolicy: "disabled"` blockiert DMs.
- Die Bindung des Antwortempfängers bleibt standardmäßig an stabile numerische `user_id` gebunden. `channels.synology-chat.dangerouslyAllowNameMatching: true` ist ein Break-Glass-Kompatibilitätsmodus, der das Nachschlagen über veränderbare Benutzernamen/Spitznamen für die Zustellung von Antworten wieder aktiviert.
- Pairing-Genehmigungen funktionieren mit:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Ausgehende Zustellung

Verwenden Sie numerische Synology Chat-Benutzer-IDs als Ziele.

Beispiele:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Das Senden von Medien wird über URL-basierte Dateizustellung unterstützt.
Ausgehende Datei-URLs müssen `http` oder `https` verwenden, und private oder anderweitig blockierte Netzwerkziele werden abgelehnt, bevor OpenClaw die URL an den NAS-Webhook weiterleitet.

## Mehrere Konten

Mehrere Synology Chat-Konten werden unter `channels.synology-chat.accounts` unterstützt.
Jedes Konto kann Token, eingehende URL, Webhook-Pfad, DM-Richtlinie und Limits überschreiben.
Direktnachrichtensitzungen sind pro Konto und Benutzer isoliert, sodass dieselbe numerische `user_id`
auf zwei verschiedenen Synology-Konten keinen gemeinsamen Transkriptstatus hat.
Geben Sie jedem aktivierten Konto einen eigenen `webhookPath`. OpenClaw lehnt jetzt doppelte exakte Pfade ab
und startet benannte Konten nicht, die in Multi-Konto-Setups nur einen gemeinsam genutzten Webhook-Pfad erben.
Wenn Sie absichtlich eine Legacy-Vererbung für ein benanntes Konto benötigen, setzen Sie
`dangerouslyAllowInheritedWebhookPath: true` für dieses Konto oder unter `channels.synology-chat`,
aber doppelte exakte Pfade werden weiterhin fail-closed abgelehnt. Bevorzugen Sie explizite Pfade pro Konto.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Sicherheitshinweise

- Halten Sie `token` geheim und rotieren Sie es, falls es offengelegt wurde.
- Lassen Sie `allowInsecureSsl: false`, außer wenn Sie einem lokalen NAS-Zertifikat mit Selbstsignierung ausdrücklich vertrauen.
- Eingehende Webhook-Anfragen werden tokenverifiziert und pro Absender ratenbegrenzt.
- Prüfungen auf ungültige Tokens verwenden einen Secret-Vergleich in konstanter Zeit und behandeln Fehler fail-closed.
- Bevorzugen Sie für den Produktionseinsatz `dmPolicy: "allowlist"`.
- Lassen Sie `dangerouslyAllowNameMatching` deaktiviert, außer wenn Sie ausdrücklich die Legacy-Antwortzustellung auf Basis von Benutzernamen benötigen.
- Lassen Sie `dangerouslyAllowInheritedWebhookPath` deaktiviert, außer wenn Sie das Routing-Risiko gemeinsam genutzter Pfade in einem Multi-Konto-Setup ausdrücklich akzeptieren.

## Fehlerbehebung

- `Missing required fields (token, user_id, text)`:
  - der Payload des ausgehenden Webhooks enthält eines der erforderlichen Felder nicht
  - wenn Synology das Token in Headern sendet, stellen Sie sicher, dass das Gateway/der Proxy diese Header beibehält
- `Invalid token`:
  - das Secret des ausgehenden Webhooks stimmt nicht mit `channels.synology-chat.token` überein
  - die Anfrage trifft auf das falsche Konto/den falschen Webhook-Pfad
  - ein Reverse-Proxy hat den Token-Header entfernt, bevor die Anfrage OpenClaw erreicht hat
- `Rate limit exceeded`:
  - zu viele ungültige Token-Versuche von derselben Quelle können diese Quelle vorübergehend sperren
  - authentifizierte Absender haben außerdem ein separates Nachrichten-Ratenlimit pro Benutzer
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` ist aktiviert, aber es sind keine Benutzer konfiguriert
- `User not authorized`:
  - die numerische `user_id` des Absenders ist nicht in `allowedUserIds`

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Steuerung über Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
