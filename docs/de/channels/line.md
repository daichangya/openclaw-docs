---
read_when:
    - Sie möchten OpenClaw mit LINE verbinden.
    - Sie benötigen die Einrichtung von LINE-Webhooks und Zugangsdaten.
    - Sie möchten LINE-spezifische Nachrichtenoptionen.
summary: Einrichtung, Konfiguration und Verwendung des LINE Messaging API-Plugins
title: LINE
x-i18n:
    generated_at: "2026-04-24T06:27:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE verbindet sich über die LINE Messaging API mit OpenClaw. Das Plugin läuft als Webhook-Empfänger auf dem Gateway und verwendet Ihren Channel Access Token sowie das Channel Secret zur Authentifizierung.

Status: gebündeltes Plugin. Direktnachrichten, Gruppenchats, Medien, Standorte, Flex-Nachrichten, Template-Nachrichten und Quick Replies werden unterstützt. Reactions und Threads werden nicht unterstützt.

## Gebündeltes Plugin

LINE wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher ist bei normalen paketierten Builds keine separate Installation erforderlich.

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
2. Erstellen Sie einen Provider (oder wählen Sie einen aus) und fügen Sie einen **Messaging API**-Channel hinzu.
3. Kopieren Sie den **Channel access token** und das **Channel secret** aus den Channel-Einstellungen.
4. Aktivieren Sie **Use webhook** in den Messaging API-Einstellungen.
5. Setzen Sie die Webhook-URL auf Ihren Gateway-Endpunkt (HTTPS erforderlich):

```text
https://gateway-host/line/webhook
```

Das Gateway antwortet auf die Webhook-Verifizierung von LINE (GET) und auf eingehende Ereignisse (POST).
Wenn Sie einen benutzerdefinierten Pfad benötigen, setzen Sie `channels.line.webhookPath` oder
`channels.line.accounts.<id>.webhookPath` und aktualisieren Sie die URL entsprechend.

Sicherheitshinweis:

- Die LINE-Signaturprüfung ist vom Body abhängig (HMAC über den Roh-Body), daher wendet OpenClaw vor der Verifizierung strikte Body-Limits und Timeouts vor der Authentifizierung an.
- OpenClaw verarbeitet Webhook-Ereignisse anhand der verifizierten Rohbytes der Anfrage. Von Upstream-Middleware transformierte `req.body`-Werte werden aus Gründen der Signaturintegrität ignoriert.

## Konfigurieren

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

Umgebungsvariablen (nur Standardkonto):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Dateien für Token/Secret:

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

Direktnachrichten verwenden standardmäßig Pairing. Unbekannte Absender erhalten einen Pairing-Code, und ihre Nachrichten werden ignoriert, bis sie genehmigt werden.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists und Richtlinien:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: Allowlist mit LINE-Benutzer-IDs für DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: Allowlist mit LINE-Benutzer-IDs für Gruppen
- Überschreibungen pro Gruppe: `channels.line.groups.<groupId>.allowFrom`
- Laufzeithinweis: Wenn `channels.line` vollständig fehlt, verwendet die Laufzeit für Gruppenprüfungen als Fallback `groupPolicy="allowlist"` (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

LINE-IDs sind case-sensitive. Gültige IDs sehen so aus:

- Benutzer: `U` + 32 Hex-Zeichen
- Gruppe: `C` + 32 Hex-Zeichen
- Raum: `R` + 32 Hex-Zeichen

## Nachrichtenverhalten

- Text wird in Blöcke von 5000 Zeichen aufgeteilt.
- Markdown-Formatierung wird entfernt; Codeblöcke und Tabellen werden nach Möglichkeit in Flex-Karten umgewandelt.
- Streaming-Antworten werden gepuffert; LINE erhält vollständige Blöcke mit einer Ladeanimation, während der Agent arbeitet.
- Medien-Downloads sind durch `channels.line.mediaMaxMb` begrenzt (Standard: 10).

## Channel-Daten (Rich Messages)

Verwenden Sie `channelData.line`, um Quick Replies, Standorte, Flex-Karten oder Template-Nachrichten zu senden.

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

Das LINE-Plugin enthält außerdem einen `/card`-Befehl für Flex-Nachrichtenvorlagen:

```text
/card info "Welcome" "Thanks for joining!"
```

## ACP-Unterstützung

LINE unterstützt ACP-Bindungen (Agent Communication Protocol) für Konversationen:

- `/acp spawn <agent> --bind here` bindet den aktuellen LINE-Chat an eine ACP-Sitzung, ohne einen untergeordneten Thread zu erstellen.
- Konfigurierte ACP-Bindungen und aktive ACP-Sitzungen mit Konversationsbindung funktionieren in LINE wie in anderen Konversations-Channels.

Siehe [ACP agents](/de/tools/acp-agents) für Details.

## Ausgehende Medien

Das LINE-Plugin unterstützt das Senden von Bild-, Video- und Audiodateien über das Agent-Nachrichtentool. Medien werden über den LINE-spezifischen Zustellungspfad mit passender Vorschau- und Tracking-Behandlung gesendet:

- **Bilder**: werden als LINE-Bildnachrichten mit automatischer Vorschaubild-Generierung gesendet.
- **Videos**: werden mit expliziter Vorschau- und Content-Type-Behandlung gesendet.
- **Audio**: wird als LINE-Audionachricht gesendet.

URLs für ausgehende Medien müssen öffentliche HTTPS-URLs sein. OpenClaw validiert den Ziel-Hostname, bevor die URL an LINE übergeben wird, und lehnt Loopback-, link-local- und private Netz-Ziele ab.

Generische Mediensendungen fallen auf die bestehende rein bildbasierte Route zurück, wenn kein LINE-spezifischer Pfad verfügbar ist.

## Fehlerbehebung

- **Webhook-Verifizierung schlägt fehl:** Stellen Sie sicher, dass die Webhook-URL HTTPS verwendet und das `channelSecret` mit der LINE-Console übereinstimmt.
- **Keine eingehenden Ereignisse:** Bestätigen Sie, dass der Webhook-Pfad mit `channels.line.webhookPath` übereinstimmt und dass das Gateway von LINE aus erreichbar ist.
- **Fehler beim Medien-Download:** Erhöhen Sie `channels.line.mediaMaxMb`, wenn Medien das Standardlimit überschreiten.

## Verwandt

- [Channels Overview](/de/channels) — alle unterstützten Channels
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/de/channels/groups) — Verhalten in Gruppenchats und Steuerung über Erwähnungen
- [Channel Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/de/gateway/security) — Zugriffsmodell und Härtung
