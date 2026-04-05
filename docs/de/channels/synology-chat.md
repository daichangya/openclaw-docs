---
read_when:
    - Beim Einrichten von Synology Chat mit OpenClaw
    - Beim Debuggen des Synology Chat-Webhook-Routings
summary: Einrichtung von Synology Chat-Webhooks und OpenClaw-Konfiguration
title: Synology Chat
x-i18n:
    generated_at: "2026-04-05T12:36:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb25fc6b53f896f15f43b4936d69ea071a29a91838a5b662819377271e89d81
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: gebündelter Plugin-Kanal für Direktnachrichten mit Synology Chat-Webhooks.
Das Plugin akzeptiert eingehende Nachrichten von ausgehenden Synology Chat-Webhooks und sendet Antworten
über einen eingehenden Synology Chat-Webhook.

## Gebündeltes Plugin

Synology Chat wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin mitgeliefert, daher benötigen normale
Paket-Builds keine separate Installation.

Wenn Sie eine ältere Version oder eine benutzerdefinierte Installation ohne Synology Chat verwenden,
installieren Sie es manuell:

Aus einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Details: [Plugins](/tools/plugin)

## Schnelleinrichtung

1. Stellen Sie sicher, dass das Synology Chat-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit dem obigen Befehl manuell aus einem Source-Checkout hinzufügen.
   - `openclaw onboard` zeigt Synology Chat jetzt in derselben Liste zur Kanaleinrichtung wie `openclaw channels add` an.
   - Nicht interaktive Einrichtung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. In den Synology Chat-Integrationen:
   - Erstellen Sie einen eingehenden Webhook und kopieren Sie dessen URL.
   - Erstellen Sie einen ausgehenden Webhook mit Ihrem geheimen Token.
3. Richten Sie die URL des ausgehenden Webhooks auf Ihr OpenClaw-Gateway:
   - Standardmäßig `https://gateway-host/webhook/synology`.
   - Oder Ihren benutzerdefinierten `channels.synology-chat.webhookPath`.
4. Schließen Sie die Einrichtung in OpenClaw ab.
   - Geführt: `openclaw onboard`
   - Direkt: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Starten Sie das Gateway neu und senden Sie eine DM an den Synology Chat-Bot.

Details zur Webhook-Authentifizierung:

- OpenClaw akzeptiert das Token des ausgehenden Webhooks aus `body.token`, dann
  `?token=...`, dann aus Headern.
- Akzeptierte Header-Formen:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Leere oder fehlende Tokens schlagen fail-closed fehl.

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

## DM-Richtlinie und Zugriffskontrolle

- `dmPolicy: "allowlist"` ist der empfohlene Standard.
- `allowedUserIds` akzeptiert eine Liste (oder eine durch Kommas getrennte Zeichenfolge) von Synology-Benutzer-IDs.
- Im Modus `allowlist` wird eine leere Liste `allowedUserIds` als Fehlkonfiguration behandelt und die Webhook-Route wird nicht gestartet (verwenden Sie `dmPolicy: "open"` für Zulassen-aller).
- `dmPolicy: "open"` erlaubt jeden Absender.
- `dmPolicy: "disabled"` blockiert DMs.
- Die Bindung des Antwortempfängers bleibt standardmäßig an die stabile numerische `user_id` gebunden. `channels.synology-chat.dangerouslyAllowNameMatching: true` ist ein Break-Glass-Kompatibilitätsmodus, der die veränderliche Suche nach Benutzername/Spitzname für die Antwortzustellung wieder aktiviert.
- Kopplungsgenehmigungen funktionieren mit:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Ausgehende Zustellung

Verwenden Sie numerische Synology Chat-Benutzer-IDs als Ziele.

Beispiele:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Das Senden von Medien wird durch URL-basierte Dateizustellung unterstützt.

## Multi-Account

Mehrere Synology Chat-Konten werden unter `channels.synology-chat.accounts` unterstützt.
Jedes Konto kann Token, eingehende URL, Webhook-Pfad, DM-Richtlinie und Limits überschreiben.
Direktnachrichtensitzungen sind pro Konto und Benutzer isoliert, sodass dieselbe numerische `user_id`
auf zwei verschiedenen Synology-Konten keinen gemeinsamen Transkriptzustand teilt.
Geben Sie jedem aktivierten Konto einen eigenen `webhookPath`. OpenClaw lehnt jetzt doppelte exakte Pfade ab
und verweigert den Start benannter Konten, die in Multi-Account-Setups nur einen gemeinsamen Webhook-Pfad erben.
Wenn Sie absichtlich eine veraltete Vererbung für ein benanntes Konto benötigen, setzen Sie
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

- Halten Sie `token` geheim und rotieren Sie es, wenn es offengelegt wurde.
- Lassen Sie `allowInsecureSsl: false`, es sei denn, Sie vertrauen einem selbstsignierten lokalen NAS-Zertifikat ausdrücklich.
- Eingehende Webhook-Anfragen werden tokenverifiziert und pro Absender ratenbegrenzt.
- Prüfungen ungültiger Tokens verwenden einen Vergleich von Geheimnissen in konstanter Zeit und schlagen fail-closed fehl.
- Bevorzugen Sie `dmPolicy: "allowlist"` für den Produktionseinsatz.
- Lassen Sie `dangerouslyAllowNameMatching` deaktiviert, es sei denn, Sie benötigen ausdrücklich die veraltete antwortbasierte Zustellung über Benutzernamen.
- Lassen Sie `dangerouslyAllowInheritedWebhookPath` deaktiviert, es sei denn, Sie akzeptieren ausdrücklich das Risiko gemeinsamen Pfad-Routings in einem Multi-Account-Setup.

## Fehlerbehebung

- `Missing required fields (token, user_id, text)`:
  - in der Nutzlast des ausgehenden Webhooks fehlt eines der erforderlichen Felder
  - wenn Synology das Token in Headern sendet, stellen Sie sicher, dass das Gateway/der Proxy diese Header beibehält
- `Invalid token`:
  - das Geheimnis des ausgehenden Webhooks stimmt nicht mit `channels.synology-chat.token` überein
  - die Anfrage trifft das falsche Konto/den falschen Webhook-Pfad
  - ein Reverse-Proxy hat den Token-Header entfernt, bevor die Anfrage OpenClaw erreicht hat
- `Rate limit exceeded`:
  - zu viele ungültige Token-Versuche aus derselben Quelle können diese Quelle vorübergehend aussperren
  - authentifizierte Absender haben außerdem ein separates Ratenlimit pro Benutzer für Nachrichten
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` ist aktiviert, aber es sind keine Benutzer konfiguriert
- `User not authorized`:
  - die numerische `user_id` des Absenders ist nicht in `allowedUserIds`

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Groups](/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
