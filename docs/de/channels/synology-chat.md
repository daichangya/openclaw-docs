---
read_when:
    - Synology Chat mit OpenClaw einrichten
    - Routing von Synology-Chat-Webhooks debuggen
summary: Einrichtung des Synology-Chat-Webhooks und OpenClaw-Konfiguration
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T06:28:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

Status: gebündelter Plugin-Direktnachrichtenkanal mit Synology-Chat-Webhooks.
Das Plugin akzeptiert eingehende Nachrichten von ausgehenden Synology-Chat-Webhooks und sendet Antworten
über einen eingehenden Synology-Chat-Webhook.

## Gebündeltes Plugin

Synology Chat wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, daher benötigen normale
paketierte Builds keine separate Installation.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation verwenden, die Synology Chat ausschließt,
installieren Sie es manuell:

Aus einem lokalen Checkout installieren:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung

1. Stellen Sie sicher, dass das Synology-Chat-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit dem obigen Befehl manuell aus einem Source-Checkout hinzufügen.
   - `openclaw onboard` zeigt Synology Chat jetzt in derselben Kanaleinrichtungsliste wie `openclaw channels add` an.
   - Nicht-interaktive Einrichtung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. In den Synology-Chat-Integrationen:
   - Erstellen Sie einen eingehenden Webhook und kopieren Sie dessen URL.
   - Erstellen Sie einen ausgehenden Webhook mit Ihrem geheimen Token.
3. Richten Sie die URL des ausgehenden Webhooks auf Ihr OpenClaw-Gateway:
   - Standardmäßig `https://gateway-host/webhook/synology`.
   - Oder Ihr benutzerdefinierter `channels.synology-chat.webhookPath`.
4. Schließen Sie die Einrichtung in OpenClaw ab.
   - Geführt: `openclaw onboard`
   - Direkt: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Starten Sie das Gateway neu und senden Sie eine DM an den Synology-Chat-Bot.

Details zur Webhook-Authentifizierung:

- OpenClaw akzeptiert das Token des ausgehenden Webhooks aus `body.token`, dann
  `?token=...`, dann aus Headern.
- Akzeptierte Header-Formen:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Leere oder fehlende Token werden Fail-Closed behandelt.

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

- `dmPolicy: "allowlist"` ist der empfohlene Standard.
- `allowedUserIds` akzeptiert eine Liste (oder eine durch Kommas getrennte Zeichenfolge) von Synology-Benutzer-IDs.
- Im Modus `allowlist` wird eine leere `allowedUserIds`-Liste als Fehlkonfiguration behandelt, und die Webhook-Route startet nicht (verwenden Sie `dmPolicy: "open"` für Alle-erlauben).
- `dmPolicy: "open"` erlaubt beliebige Absender.
- `dmPolicy: "disabled"` blockiert DMs.
- Die Bindung des Antwortempfängers bleibt standardmäßig an die stabile numerische `user_id` gebunden. `channels.synology-chat.dangerouslyAllowNameMatching: true` ist ein Break-Glass-Kompatibilitätsmodus, der die veränderliche Suche nach Benutzername/Spitzname für die Antwortzustellung wieder aktiviert.
- Kopplungsgenehmigungen funktionieren mit:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Ausgehende Zustellung

Verwenden Sie numerische Synology-Chat-Benutzer-IDs als Ziele.

Beispiele:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Das Senden von Medien wird durch URL-basierte Dateizustellung unterstützt.
Ausgehende Datei-URLs müssen `http` oder `https` verwenden, und private oder anderweitig blockierte Netzwerkziele werden abgewiesen, bevor OpenClaw die URL an den NAS-Webhook weiterleitet.

## Multi-Account

Mehrere Synology-Chat-Konten werden unter `channels.synology-chat.accounts` unterstützt.
Jedes Konto kann Token, eingehende URL, Webhook-Pfad, DM-Richtlinie und Limits überschreiben.
Direktnachrichten-Sitzungen sind pro Konto und Benutzer isoliert, sodass dieselbe numerische `user_id`
auf zwei verschiedenen Synology-Konten keinen gemeinsamen Transkriptstatus hat.
Geben Sie jedem aktivierten Konto einen eindeutigen `webhookPath`. OpenClaw weist jetzt doppelte exakte Pfade zurück
und verweigert den Start benannter Konten, die in Multi-Account-Setups nur einen gemeinsamen Webhook-Pfad erben.
Wenn Sie absichtlich eine ältere Vererbung für ein benanntes Konto benötigen, setzen Sie
`dangerouslyAllowInheritedWebhookPath: true` auf diesem Konto oder auf `channels.synology-chat`,
aber doppelte exakte Pfade werden weiterhin Fail-Closed abgewiesen. Bevorzugen Sie explizite Pfade pro Konto.

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
- Behalten Sie `allowInsecureSsl: false` bei, es sei denn, Sie vertrauen einem selbstsignierten lokalen NAS-Zertifikat ausdrücklich.
- Eingehende Webhook-Anfragen werden per Token verifiziert und pro Absender rate-begrenzt.
- Prüfungen auf ungültige Token verwenden einen Constant-Time-Secret-Vergleich und werden Fail-Closed behandelt.
- Bevorzugen Sie `dmPolicy: "allowlist"` für produktive Umgebungen.
- Lassen Sie `dangerouslyAllowNameMatching` deaktiviert, es sei denn, Sie benötigen ausdrücklich die ältere antwortbasierte Zustellung per Benutzername.
- Lassen Sie `dangerouslyAllowInheritedWebhookPath` deaktiviert, es sei denn, Sie akzeptieren ausdrücklich das Routing-Risiko gemeinsamer Pfade in einem Multi-Account-Setup.

## Fehlerbehebung

- `Missing required fields (token, user_id, text)`:
  - der Payload des ausgehenden Webhooks enthält eines der erforderlichen Felder nicht
  - wenn Synology das Token in Headern sendet, stellen Sie sicher, dass das Gateway/der Proxy diese Header beibehält
- `Invalid token`:
  - das Secret des ausgehenden Webhooks stimmt nicht mit `channels.synology-chat.token` überein
  - die Anfrage trifft das falsche Konto/den falschen Webhook-Pfad
  - ein Reverse-Proxy hat den Token-Header entfernt, bevor die Anfrage OpenClaw erreicht hat
- `Rate limit exceeded`:
  - zu viele Versuche mit ungültigem Token aus derselben Quelle können diese Quelle vorübergehend aussperren
  - authentifizierte Absender haben außerdem ein separates Nachrichten-Rate-Limit pro Benutzer
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` ist aktiviert, aber es sind keine Benutzer konfiguriert
- `User not authorized`:
  - die numerische `user_id` des Absenders ist nicht in `allowedUserIds`

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungs-Gating
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
