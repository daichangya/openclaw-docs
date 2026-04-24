---
read_when:
    - iMessage-Unterstützung einrichten
    - Fehlerbehebung beim Senden/Empfangen mit iMessage
summary: Legacy-iMessage-Unterstützung über imsg (JSON-RPC über stdio). Neue Setups sollten BlueBubbles verwenden.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T06:27:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (Legacy: imsg)

<Warning>
Verwenden Sie für neue iMessage-Bereitstellungen <a href="/de/channels/bluebubbles">BlueBubbles</a>.

Die Integration `imsg` ist veraltet und kann in einer zukünftigen Version entfernt werden.
</Warning>

Status: veraltete externe CLI-Integration. Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port).

<CardGroup cols={3}>
  <Card title="BlueBubbles (empfohlen)" icon="message-circle" href="/de/channels/bluebubbles">
    Bevorzugter iMessage-Pfad für neue Setups.
  </Card>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    iMessage-DMs verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/de/gateway/config-channels#imessage">
    Vollständige iMessage-Feldreferenz.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Pfad)">
    <Steps>
      <Step title="imsg installieren und verifizieren">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClaw konfigurieren">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>

      <Step title="Erstes DM-Pairing genehmigen (Standard-`dmPolicy`)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Pairing-Anfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote-Mac über SSH">
    OpenClaw benötigt nur einen stdio-kompatiblen `cliPath`, daher können Sie `cliPath` auf ein Wrapper-Skript verweisen lassen, das per SSH eine Verbindung zu einem Remote-Mac herstellt und `imsg` ausführt.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Empfohlene Konfiguration, wenn Anhänge aktiviert sind:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // für SCP-Abrufe von Anhängen verwendet
      includeAttachments: true,
      // Optional: zulässige Stammverzeichnisse für Anhänge überschreiben.
      // Standardmäßig enthalten: /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht gesetzt ist, versucht OpenClaw, ihn durch Parsen des SSH-Wrapper-Skripts automatisch zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen).
    OpenClaw verwendet für SCP eine strikte Host-Key-Prüfung, daher muss der Relay-Host-Key bereits in `~/.ssh/known_hosts` vorhanden sein.
    Pfade für Anhänge werden gegen zulässige Stammverzeichnisse validiert (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` ausgeführt wird.
- Full Disk Access ist für den Prozesskontext erforderlich, in dem OpenClaw/`imsg` läuft (Zugriff auf die Messages-Datenbank).
- Die Berechtigung Automation ist erforderlich, um Nachrichten über Messages.app zu senden.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn Gateway headless läuft (LaunchAgent/SSH), führen Sie in genau diesem Kontext einmalig einen interaktiven Befehl aus, um die Abfragen auszulösen:

```bash
imsg chats --limit 1
# oder
imsg send <handle> "test"
```

</Tip>

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Allowlist-Feld: `channels.imessage.allowFrom`.

    Allowlist-Einträge können Handles oder Chat-Ziele sein (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Gruppenrichtlinie + Erwähnungen">
    `channels.imessage.groupPolicy` steuert die Gruppenverarbeitung:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Allowlist für Gruppensender: `channels.imessage.groupAllowFrom`.

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, greifen Prüfungen von iMessage-Gruppensendern, falls verfügbar, auf `allowFrom` zurück.
    Laufzeit-Hinweis: Wenn `channels.imessage` vollständig fehlt, greift die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    Erwähnungs-Gating für Gruppen:

    - iMessage hat keine nativen Metadaten für Erwähnungen
    - die Erkennung von Erwähnungen verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann Erwähnungs-Gating nicht erzwungen werden

    Steuerbefehle von autorisierten Absendern können das Erwähnungs-Gating in Gruppen umgehen.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem Standard `session.dmScope=main` werden iMessage-DMs in die Hauptsitzung des Agenten zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden mithilfe der Metadaten des ursprünglichen Kanals/Ziels zurück an iMessage geroutet.

    Thread-Verhalten mit Gruppencharakter:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` ankommen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppen-Gating + Isolation der Gruppensitzung).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

Veraltete iMessage-Chats können auch an ACP-Sitzungen gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des zulässigen Gruppenchats aus.
- Zukünftige Nachrichten in derselben iMessage-Konversation werden an die erzeugte ACP-Sitzung geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden über Einträge der obersten Ebene `bindings[]` mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

`match.peer.id` kann Folgendes verwenden:

- normalisiertes DM-Handle wie `+15555550123` oder `user@example.com`
- `chat_id:<id>` (empfohlen für stabile Gruppenbindungen)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

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
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Siehe [ACP Agents](/de/tools/acp-agents) für gemeinsames Verhalten von ACP-Bindungen.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)">
    Verwenden Sie eine dedizierte Apple-ID und einen dedizierten macOS-Benutzer, damit Bot-Verkehr von Ihrem persönlichen Messages-Profil getrennt bleibt.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer und melden Sie sich an.
    2. Melden Sie sich in diesem Benutzer bei Messages mit der Apple-ID des Bots an.
    3. Installieren Sie `imsg` für diesen Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` in diesem Benutzerkontext ausführen kann.
    5. Verweisen Sie `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Der erste Lauf kann GUI-Genehmigungen erfordern (Automation + Full Disk Access) in dieser Bot-Benutzersitzung.

  </Accordion>

  <Accordion title="Remote-Mac über Tailscale (Beispiel)">
    Häufige Topologie:

    - Gateway läuft unter Linux/in einer VM
    - iMessage + `imsg` läuft auf einem Mac in Ihrem Tailnet
    - der `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
    - `remoteHost` aktiviert SCP-Abrufe von Anhängen

    Beispiel:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Verwenden Sie SSH-Schlüssel, damit sowohl SSH als auch SCP nicht interaktiv sind.
    Stellen Sie zuerst sicher, dass dem Host-Key vertraut wird (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt wird.

  </Accordion>

  <Accordion title="Muster mit mehreren Accounts">
    iMessage unterstützt Konfiguration pro Account unter `channels.imessage.accounts`.

    Jeder Account kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Allowlists für Stammverzeichnisse von Anhängen überschreiben.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - die Erfassung eingehender Anhänge ist optional: `channels.imessage.includeAttachments`
    - Remote-Pfade für Anhänge können per SCP abgerufen werden, wenn `remoteHost` gesetzt ist
    - Pfade für Anhänge müssen zu zulässigen Stammverzeichnissen passen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (Remote-SCP-Modus)
      - Standardmuster für Stammverzeichnisse: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Host-Key-Prüfung (`StrictHostKeyChecking=yes`)
    - die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)
  </Accordion>

  <Accordion title="Ausgehendes Chunking">
    - Text-Chunk-Limit: `channels.imessage.textChunkLimit` (Standard 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (Absatz-zuerst-Aufteilung)
  </Accordion>

  <Accordion title="Adressierungsformate">
    Bevorzugte explizite Ziele:

    - `chat_id:123` (empfohlen für stabiles Routing)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle-Ziele werden ebenfalls unterstützt:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Konfigurationsschreibvorgänge

iMessage erlaubt standardmäßig vom Kanal initiierte Konfigurationsschreibvorgänge (für `/config set|unset`, wenn `commands.config: true`).

Deaktivieren:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Validieren Sie die Binärdatei und die RPC-Unterstützung:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Wenn die Probe meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`.

  </Accordion>

  <Accordion title="DMs werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - Pairing-Genehmigungen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Gruppennachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - Allowlist-Verhalten von `channels.imessage.groups`
    - Konfiguration der Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote-Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH-/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - der Host-Key existiert in `~/.ssh/known_hosts` auf dem Gateway-Host
    - Lesbarkeit des Remote-Pfads auf dem Mac, auf dem Messages läuft

  </Accordion>

  <Accordion title="macOS-Berechtigungsabfragen wurden verpasst">
    Führen Sie den Vorgang in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext erneut aus und genehmigen Sie die Abfragen:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Bestätigen Sie, dass Full Disk Access + Automation für den Prozesskontext gewährt wurden, in dem OpenClaw/`imsg` läuft.

  </Accordion>
</AccordionGroup>

## Verweise auf die Konfigurationsreferenz

- [Konfigurationsreferenz - iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Pairing](/de/channels/pairing)
- [BlueBubbles](/de/channels/bluebubbles)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
