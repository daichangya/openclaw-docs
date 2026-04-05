---
read_when:
    - Beim Einrichten des BlueBubbles-Kanals
    - Bei der Fehlerbehebung für Webhook-Pairing
    - Beim Konfigurieren von iMessage auf macOS
summary: iMessage über den BlueBubbles-macOS-Server (REST-Senden/-Empfangen, Tippen, Reaktionen, Pairing, erweiterte Aktionen).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-05T12:35:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed8e59a165bdfb8fd794ee2ad6e4dacd44aa02d512312c5f2fd7d15f863380bb
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Status: gebündeltes Plugin, das über HTTP mit dem BlueBubbles-macOS-Server kommuniziert. **Empfohlen für die iMessage-Integration** aufgrund der umfangreicheren API und der einfacheren Einrichtung im Vergleich zum Legacy-imsg-Kanal.

## Gebündeltes Plugin

Aktuelle OpenClaw-Releases enthalten BlueBubbles gebündelt, daher benötigen normale
gepackte Builds keinen separaten Schritt `openclaw plugins install`.

## Überblick

- Läuft auf macOS über die BlueBubbles-Hilfs-App ([bluebubbles.app](https://bluebubbles.app)).
- Empfohlen/getestet: macOS Sequoia (15). macOS Tahoe (26) funktioniert; Bearbeiten ist auf Tahoe derzeit defekt, und Aktualisierungen des Gruppensymbols können Erfolg melden, aber nicht synchronisiert werden.
- OpenClaw kommuniziert damit über dessen REST-API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Eingehende Nachrichten kommen über Webhooks an; ausgehende Antworten, Tippindikatoren, Lesebestätigungen und Tapbacks sind REST-Aufrufe.
- Anhänge und Sticker werden als eingehende Medien aufgenommen (und wenn möglich dem Agent zur Verfügung gestellt).
- Pairing/Allowlist funktioniert wie bei anderen Kanälen (`/channels/pairing` usw.) mit `channels.bluebubbles.allowFrom` + Pairing-Codes.
- Reaktionen werden genau wie bei Slack/Telegram als Systemereignisse bereitgestellt, sodass Agents sie vor dem Antworten „erwähnen“ können.
- Erweiterte Funktionen: Bearbeiten, Zurückziehen, Antwort-Threading, Nachrichteneffekte, Gruppenverwaltung.

## Schnellstart

1. Installieren Sie den BlueBubbles-Server auf Ihrem Mac (folgen Sie den Anweisungen unter [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Aktivieren Sie in der BlueBubbles-Konfiguration die Web-API und legen Sie ein Passwort fest.
3. Führen Sie `openclaw onboard` aus und wählen Sie BlueBubbles aus, oder konfigurieren Sie es manuell:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Leiten Sie BlueBubbles-Webhooks an Ihr Gateway weiter (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Starten Sie das Gateway; es registriert den Webhook-Handler und startet das Pairing.

Sicherheitshinweis:

- Legen Sie immer ein Webhook-Passwort fest.
- Webhook-Authentifizierung ist immer erforderlich. OpenClaw lehnt BlueBubbles-Webhook-Anfragen ab, sofern sie kein Passwort/keine GUID enthalten, das bzw. die mit `channels.bluebubbles.password` übereinstimmt (zum Beispiel `?password=<password>` oder `x-password`), unabhängig von der Loopback-/Proxy-Topologie.
- Die Passwortauthentifizierung wird geprüft, bevor vollständige Webhook-Bodys gelesen/geparst werden.

## Messages.app aktiv halten (VM-/Headless-Setups)

Einige macOS-VM-/Always-on-Setups können dazu führen, dass Messages.app in einen „Leerlauf“ gerät (eingehende Ereignisse stoppen, bis die App geöffnet/in den Vordergrund gebracht wird). Eine einfache Umgehung besteht darin, **Messages alle 5 Minuten anzustoßen**, mithilfe eines AppleScript + LaunchAgent.

### 1) Das AppleScript speichern

Speichern Sie dies als:

- `~/Scripts/poke-messages.scpt`

Beispielskript (nicht interaktiv; stiehlt nicht den Fokus):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Einen LaunchAgent installieren

Speichern Sie dies als:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Hinweise:

- Dies wird **alle 300 Sekunden** und **bei der Anmeldung** ausgeführt.
- Der erste Lauf kann macOS-**Automation**-Aufforderungen auslösen (`osascript` → Messages). Bestätigen Sie diese in derselben Benutzersitzung, in der der LaunchAgent ausgeführt wird.

Laden Sie ihn:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles ist im interaktiven Onboarding verfügbar:

```
openclaw onboard
```

Der Assistent fragt nach:

- **Server-URL** (erforderlich): Adresse des BlueBubbles-Servers (z. B. `http://192.168.1.100:1234`)
- **Passwort** (erforderlich): API-Passwort aus den BlueBubbles-Servereinstellungen
- **Webhook-Pfad** (optional): Standard ist `/bluebubbles-webhook`
- **DM-Richtlinie**: pairing, allowlist, open oder disabled
- **Allowlist**: Telefonnummern, E-Mail-Adressen oder Chat-Ziele

Sie können BlueBubbles auch über die CLI hinzufügen:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Zugriffskontrolle (DMs + Gruppen)

DMs:

- Standard: `channels.bluebubbles.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie genehmigt werden (Codes verfallen nach 1 Stunde).
- Genehmigung über:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Pairing ist der Standard-Tokenaustausch. Details: [Pairing](/channels/pairing)

Gruppen:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (Standard: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` steuert, wer in Gruppen auslösen kann, wenn `allowlist` gesetzt ist.

### Anreicherung von Kontaktnamen (macOS, optional)

BlueBubbles-Gruppen-Webhooks enthalten oft nur rohe Teilnehmeradressen. Wenn der Kontext `GroupMembers` stattdessen lokale Kontaktnamen anzeigen soll, können Sie optional die lokale Kontakte-Anreicherung auf macOS aktivieren:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aktiviert die Suche. Standard: `false`.
- Suchen werden erst ausgeführt, nachdem Gruppenzugriff, Befehlsautorisierung und Mention-Gating die Nachricht durchgelassen haben.
- Nur unbenannte Teilnehmer mit Telefonnummern werden angereichert.
- Rohe Telefonnummern bleiben die Fallback-Option, wenn keine lokale Übereinstimmung gefunden wird.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention-Gating (Gruppen)

BlueBubbles unterstützt Mention-Gating für Gruppenchats und entspricht damit dem Verhalten von iMessage/WhatsApp:

- Verwendet `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`) zur Erkennung von Erwähnungen.
- Wenn `requireMention` für eine Gruppe aktiviert ist, antwortet der Agent nur, wenn er erwähnt wird.
- Steuerbefehle von autorisierten Absendern umgehen Mention-Gating.

Konfiguration pro Gruppe:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // Standard für alle Gruppen
        "iMessage;-;chat123": { requireMention: false }, // Überschreibung für bestimmte Gruppe
      },
    },
  },
}
```

### Command-Gating

- Steuerbefehle (z. B. `/config`, `/model`) erfordern eine Autorisierung.
- Verwendet `allowFrom` und `groupAllowFrom`, um die Befehlsautorisierung zu bestimmen.
- Autorisierte Absender können Steuerbefehle auch ohne Erwähnung in Gruppen ausführen.

## ACP-Konversationsbindungen

BlueBubbles-Chats können in dauerhafte ACP-Workspaces umgewandelt werden, ohne die Transportebene zu ändern.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben BlueBubbles-Konversation werden an die gestartete ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden ebenfalls über Top-Level-Einträge `bindings[]` mit `type: "acp"` und `match.channel: "bluebubbles"` unterstützt.

`match.peer.id` kann jede unterstützte BlueBubbles-Zielform verwenden:

- normalisierter DM-Identifier wie `+15555550123` oder `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Für stabile Gruppenbindungen sollten Sie `chat_id:*` oder `chat_identifier:*` bevorzugen.

Beispiel:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Siehe [ACP-Agents](/tools/acp-agents) für das gemeinsame ACP-Bindungsverhalten.

## Tippindikatoren + Lesebestätigungen

- **Tippindikatoren**: Werden automatisch vor und während der Antwortgenerierung gesendet.
- **Lesebestätigungen**: Gesteuert durch `channels.bluebubbles.sendReadReceipts` (Standard: `true`).
- **Tippindikatoren**: OpenClaw sendet Tippstart-Ereignisse; BlueBubbles entfernt die Tippanzeige beim Senden oder nach einem Timeout automatisch (manuelles Stoppen per DELETE ist unzuverlässig).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // Lesebestätigungen deaktivieren
    },
  },
}
```

## Erweiterte Aktionen

BlueBubbles unterstützt erweiterte Nachrichtenaktionen, wenn sie in der Konfiguration aktiviert sind:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // Tapbacks (Standard: true)
        edit: true, // gesendete Nachrichten bearbeiten (macOS 13+, auf macOS 26 Tahoe defekt)
        unsend: true, // Nachrichten zurückziehen (macOS 13+)
        reply: true, // Antwort-Threading per Nachrichten-GUID
        sendWithEffect: true, // Nachrichteneffekte (slam, loud usw.)
        renameGroup: true, // Gruppenchats umbenennen
        setGroupIcon: true, // Gruppenchatsymbol/-foto setzen (unzuverlässig auf macOS 26 Tahoe)
        addParticipant: true, // Teilnehmer zu Gruppen hinzufügen
        removeParticipant: true, // Teilnehmer aus Gruppen entfernen
        leaveGroup: true, // Gruppenchats verlassen
        sendAttachment: true, // Anhänge/Medien senden
      },
    },
  },
}
```

Verfügbare Aktionen:

- **react**: Tapback-Reaktionen hinzufügen/entfernen (`messageId`, `emoji`, `remove`)
- **edit**: Eine gesendete Nachricht bearbeiten (`messageId`, `text`)
- **unsend**: Eine Nachricht zurückziehen (`messageId`)
- **reply**: Auf eine bestimmte Nachricht antworten (`messageId`, `text`, `to`)
- **sendWithEffect**: Mit iMessage-Effekt senden (`text`, `to`, `effectId`)
- **renameGroup**: Einen Gruppenchat umbenennen (`chatGuid`, `displayName`)
- **setGroupIcon**: Das Symbol/Foto eines Gruppenchats setzen (`chatGuid`, `media`) — unzuverlässig auf macOS 26 Tahoe (API kann Erfolg zurückgeben, aber das Symbol wird nicht synchronisiert).
- **addParticipant**: Jemanden zu einer Gruppe hinzufügen (`chatGuid`, `address`)
- **removeParticipant**: Jemanden aus einer Gruppe entfernen (`chatGuid`, `address`)
- **leaveGroup**: Einen Gruppenchat verlassen (`chatGuid`)
- **upload-file**: Medien/Dateien senden (`to`, `buffer`, `filename`, `asVoice`)
  - Sprachnachrichten: Setzen Sie `asVoice: true` mit **MP3**- oder **CAF**-Audio, um als iMessage-Sprachnachricht zu senden. BlueBubbles konvertiert MP3 → CAF beim Senden von Sprachnachrichten.
- Legacy-Alias: `sendAttachment` funktioniert weiterhin, aber `upload-file` ist der kanonische Aktionsname.

### Nachrichten-IDs (kurz vs. vollständig)

OpenClaw kann _kurze_ Nachrichten-IDs (z. B. `1`, `2`) bereitstellen, um Tokens zu sparen.

- `MessageSid` / `ReplyToId` können kurze IDs sein.
- `MessageSidFull` / `ReplyToIdFull` enthalten die vollständigen IDs des Providers.
- Kurze IDs sind im Speicher; sie können nach Neustart oder Cache-Eviction ablaufen.
- Aktionen akzeptieren kurze oder vollständige `messageId`, aber kurze IDs führen zu Fehlern, wenn sie nicht mehr verfügbar sind.

Verwenden Sie vollständige IDs für dauerhafte Automatisierungen und Speicherung:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontext: `MessageSidFull` / `ReplyToIdFull` in eingehenden Payloads

Siehe [Konfiguration](/gateway/configuration) für Template-Variablen.

## Block-Streaming

Steuern Sie, ob Antworten als einzelne Nachricht gesendet oder in Blöcken gestreamt werden:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // Block-Streaming aktivieren (standardmäßig deaktiviert)
    },
  },
}
```

## Medien + Limits

- Eingehende Anhänge werden heruntergeladen und im Medien-Cache gespeichert.
- Medienlimit über `channels.bluebubbles.mediaMaxMb` für eingehende und ausgehende Medien (Standard: 8 MB).
- Ausgehender Text wird auf `channels.bluebubbles.textChunkLimit` aufgeteilt (Standard: 4000 Zeichen).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/gateway/configuration)

Provider-Optionen:

- `channels.bluebubbles.enabled`: Kanal aktivieren/deaktivieren.
- `channels.bluebubbles.serverUrl`: Basis-URL der BlueBubbles-REST-API.
- `channels.bluebubbles.password`: API-Passwort.
- `channels.bluebubbles.webhookPath`: Webhook-Endpunktpfad (Standard: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: `pairing`).
- `channels.bluebubbles.allowFrom`: DM-Allowlist (Handles, E-Mail-Adressen, E.164-Nummern, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (Standard: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Allowlist für Gruppenabsender.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Auf macOS optional unbenannte Gruppenteilnehmer aus lokalen Kontakten anreichern, nachdem das Gating erfolgreich war. Standard: `false`.
- `channels.bluebubbles.groups`: Konfiguration pro Gruppe (`requireMention` usw.).
- `channels.bluebubbles.sendReadReceipts`: Lesebestätigungen senden (Standard: `true`).
- `channels.bluebubbles.blockStreaming`: Block-Streaming aktivieren (Standard: `false`; erforderlich für Streaming-Antworten).
- `channels.bluebubbles.textChunkLimit`: Größe ausgehender Blöcke in Zeichen (Standard: 4000).
- `channels.bluebubbles.chunkMode`: `length` (Standard) teilt nur, wenn `textChunkLimit` überschritten wird; `newline` teilt an Leerzeilen (Absatzgrenzen) vor der Längenaufteilung.
- `channels.bluebubbles.mediaMaxMb`: Limit für eingehende/ausgehende Medien in MB (Standard: 8).
- `channels.bluebubbles.mediaLocalRoots`: Explizite Allowlist absoluter lokaler Verzeichnisse, die für ausgehende lokale Medienpfade erlaubt sind. Das Senden lokaler Pfade ist standardmäßig verweigert, sofern dies nicht konfiguriert ist. Überschreibung pro Account: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: Maximale Anzahl von Gruppennachrichten für den Kontext (0 deaktiviert).
- `channels.bluebubbles.dmHistoryLimit`: DM-Verlaufslimit.
- `channels.bluebubbles.actions`: Bestimmte Aktionen aktivieren/deaktivieren.
- `channels.bluebubbles.accounts`: Multi-Account-Konfiguration.

Verwandte globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (oder `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressierung / Zustellziele

Bevorzugen Sie `chat_guid` für stabiles Routing:

- `chat_guid:iMessage;-;+15555550123` (bevorzugt für Gruppen)
- `chat_id:123`
- `chat_identifier:...`
- Direkte Handles: `+15555550123`, `user@example.com`
  - Wenn für ein direktes Handle kein bestehender DM-Chat vorhanden ist, erstellt OpenClaw einen über `POST /api/v1/chat/new`. Dafür muss die BlueBubbles-Private-API aktiviert sein.

## Sicherheit

- Webhook-Anfragen werden authentifiziert, indem Query-Parameter oder Header `guid`/`password` mit `channels.bluebubbles.password` verglichen werden.
- Halten Sie das API-Passwort und den Webhook-Endpunkt geheim (behandeln Sie sie wie Anmeldeinformationen).
- Es gibt keinen localhost-Bypass für die BlueBubbles-Webhook-Authentifizierung. Wenn Sie Webhook-Datenverkehr per Proxy weiterleiten, halten Sie das BlueBubbles-Passwort in der Anfrage durchgehend bei. `gateway.trustedProxies` ersetzt hier nicht `channels.bluebubbles.password`. Siehe [Gateway-Sicherheit](/gateway/security#reverse-proxy-configuration).
- Aktivieren Sie HTTPS + Firewall-Regeln auf dem BlueBubbles-Server, wenn Sie ihn außerhalb Ihres LAN bereitstellen.

## Fehlerbehebung

- Wenn Tipp-/Leseereignisse nicht mehr funktionieren, prüfen Sie die BlueBubbles-Webhook-Logs und verifizieren Sie, dass der Gateway-Pfad mit `channels.bluebubbles.webhookPath` übereinstimmt.
- Pairing-Codes verfallen nach einer Stunde; verwenden Sie `openclaw pairing list bluebubbles` und `openclaw pairing approve bluebubbles <code>`.
- Reaktionen erfordern die BlueBubbles-Private-API (`POST /api/v1/message/react`); stellen Sie sicher, dass die Serverversion sie bereitstellt.
- Bearbeiten/Zurückziehen erfordern macOS 13+ und eine kompatible BlueBubbles-Serverversion. Unter macOS 26 (Tahoe) ist Bearbeiten derzeit aufgrund von Änderungen an der Private-API defekt.
- Aktualisierungen des Gruppensymbols können auf macOS 26 (Tahoe) unzuverlässig sein: Die API kann Erfolg melden, aber das neue Symbol wird nicht synchronisiert.
- OpenClaw blendet bekannte defekte Aktionen basierend auf der macOS-Version des BlueBubbles-Servers automatisch aus. Wenn Bearbeiten auf macOS 26 (Tahoe) weiterhin angezeigt wird, deaktivieren Sie es manuell mit `channels.bluebubbles.actions.edit=false`.
- Für Status-/Health-Informationen: `openclaw status --all` oder `openclaw status --deep`.

Für allgemeine Referenzen zum Kanal-Workflow siehe [Kanäle](/channels) und den Leitfaden [Plugins](/tools/plugin).

## Verwandt

- [Kanäle im Überblick](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/channels/groups) — Verhalten von Gruppenchats und Mention-Gating
- [Kanal-Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/gateway/security) — Zugriffsmodell und Härtung
