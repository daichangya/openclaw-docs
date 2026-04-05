---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden
    - Sie benötigen die Einrichtung von LINE-Webhook + Anmeldedaten
    - Sie möchten LINE-spezifische Nachrichtenoptionen verwenden
summary: Einrichtung, Konfiguration und Nutzung des LINE Messaging API-Plugins
title: LINE
x-i18n:
    generated_at: "2026-04-05T12:35:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4782b2aa3e8654505d7f1fd6fc112adf125b5010fc84d655d033688ded37414
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE verbindet sich über die LINE Messaging API mit OpenClaw. Das Plugin läuft als Webhook-Empfänger auf dem Gateway und verwendet Ihren Channel access token + Channel secret zur Authentifizierung.

Status: gebündeltes Plugin. Direct Messages, Gruppenchats, Medien, Standorte, Flex-Nachrichten, Vorlagennachrichten und Quick Replies werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Gebündeltes Plugin

LINE wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte Builds keine separate Installation.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation ohne LINE verwenden, installieren Sie es manuell:

```bash
openclaw plugins install @openclaw/line
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Einrichtung

1. Erstellen Sie ein LINE Developers-Konto und öffnen Sie die Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Erstellen Sie einen Provider (oder wählen Sie einen vorhandenen aus) und fügen Sie einen **Messaging API**-Kanal hinzu.
3. Kopieren Sie den **Channel access token** und das **Channel secret** aus den Kanaleinstellungen.
4. Aktivieren Sie **Use webhook** in den Messaging API-Einstellungen.
5. Setzen Sie die Webhook-URL auf Ihren Gateway-Endpunkt (HTTPS erforderlich):

```
https://gateway-host/line/webhook
```

Das Gateway antwortet auf die Webhook-Verifizierung von LINE (GET) und auf eingehende Ereignisse (POST).
Wenn Sie einen benutzerdefinierten Pfad benötigen, setzen Sie `channels.line.webhookPath` oder
`channels.line.accounts.<id>.webhookPath` und aktualisieren Sie die URL entsprechend.

Sicherheitshinweis:

- Die Signaturprüfung von LINE ist Body-abhängig (HMAC über den rohen Body), daher wendet OpenClaw vor der Verifizierung strenge Größenlimits und Timeouts für die Vorabauthentifizierung an.
- OpenClaw verarbeitet Webhook-Ereignisse anhand der verifizierten rohen Request-Bytes. Von Upstream-Middleware transformierte `req.body`-Werte werden aus Sicherheitsgründen zur Signaturintegrität ignoriert.

## Konfiguration

Minimale Konfiguration:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Env vars (nur Standardkonto):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token-/Secret-Dateien:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` und `secretFile` müssen auf reguläre Dateien verweisen. Symlinks werden abgelehnt.

Mehrere Konten:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Zugriffskontrolle

Direct Messages verwenden standardmäßig Pairing. Unbekannte Absender erhalten einen Pairing-Code und ihre Nachrichten werden ignoriert, bis sie freigegeben werden.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists und Richtlinien:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: Allowlist von LINE-Benutzer-IDs für DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: Allowlist von LINE-Benutzer-IDs für Gruppen
- Überschreibungen pro Gruppe: `channels.line.groups.<groupId>.allowFrom`
- Laufzeithinweis: Wenn `channels.line` vollständig fehlt, fällt die Laufzeit bei Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

LINE-IDs sind case-sensitive. Gültige IDs sehen so aus:

- Benutzer: `U` + 32 Hex-Zeichen
- Gruppe: `C` + 32 Hex-Zeichen
- Raum: `R` + 32 Hex-Zeichen

## Nachrichtenverhalten

- Text wird in Blöcke von 5000 Zeichen aufgeteilt.
- Markdown-Formatierung wird entfernt; Codeblöcke und Tabellen werden nach Möglichkeit in Flex-Karten umgewandelt.
- Streaming-Antworten werden gepuffert; LINE erhält vollständige Blöcke mit einer Ladeanimation, während der Agent arbeitet.
- Mediendownloads sind durch `channels.line.mediaMaxMb` begrenzt (Standard: 10).

## Kanaldaten (Rich Messages)

Verwenden Sie `channelData.line`, um Quick Replies, Standorte, Flex-Karten oder Vorlagennachrichten zu senden.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Das LINE-Plugin enthält außerdem einen `/card`-Befehl für Flex-Nachrichten-Voreinstellungen:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP-Unterstützung

LINE unterstützt ACP-Bindungen (Agent Communication Protocol) für Unterhaltungen:

- `/acp spawn <agent> --bind here` bindet den aktuellen LINE-Chat an eine ACP-Sitzung, ohne einen untergeordneten Thread zu erstellen.
- Konfigurierte ACP-Bindungen und aktive unterhaltungsgebundene ACP-Sitzungen funktionieren in LINE wie in anderen Unterhaltungskanälen.

Siehe [ACP agents](/tools/acp-agents) für Details.

## Ausgehende Medien

Das LINE-Plugin unterstützt das Senden von Bildern, Videos und Audiodateien über das Agenten-Nachrichtentool. Medien werden über den LINE-spezifischen Zustellpfad mit geeigneter Vorschau- und Tracking-Behandlung gesendet:

- **Bilder**: werden als LINE-Bildnachrichten mit automatischer Vorschauerstellung gesendet.
- **Videos**: werden mit expliziter Vorschau- und Content-Type-Behandlung gesendet.
- **Audio**: wird als LINE-Audionachrichten gesendet.

Generische Mediensendungen fallen auf die bestehende Route nur für Bilder zurück, wenn kein LINE-spezifischer Pfad verfügbar ist.

## Fehlerbehebung

- **Webhook-Verifizierung schlägt fehl:** Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet und das `channelSecret` mit der LINE-Console übereinstimmt.
- **Keine eingehenden Ereignisse:** Stellen Sie sicher, dass der Webhook-Pfad mit `channels.line.webhookPath` übereinstimmt und das Gateway von LINE aus erreichbar ist.
- **Fehler beim Mediendownload:** Erhöhen Sie `channels.line.mediaMaxMb`, wenn Medien das Standardlimit überschreiten.

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
