---
read_when:
    - Beim Einrichten der iMessage-Unterstützung
    - Beim Debuggen von iMessage-Senden/Empfangen
summary: Veraltete iMessage-Unterstützung über imsg (JSON-RPC über stdio). Neue Setups sollten BlueBubbles verwenden.
title: iMessage
x-i18n:
    generated_at: "2026-04-05T12:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 086d85bead49f75d12ae6b14ac917af52375b6afd28f6af1a0dcbbc7fcb628a0
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (veraltet: imsg)

<Warning>
Verwenden Sie für neue iMessage-Bereitstellungen <a href="/channels/bluebubbles">BlueBubbles</a>.

Die `imsg`-Integration ist veraltet und kann in einer zukünftigen Version entfernt werden.
</Warning>

Status: veraltete externe CLI-Integration. Das Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port).

<CardGroup cols={3}>
  <Card title="BlueBubbles (empfohlen)" icon="message-circle" href="/channels/bluebubbles">
    Bevorzugter iMessage-Pfad für neue Setups.
  </Card>
  <Card title="Kopplung" icon="link" href="/channels/pairing">
    iMessage-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/gateway/configuration-reference#imessage">
    Vollständige iMessage-Feldreferenz.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Pfad)">
    <Steps>
      <Step title="imsg installieren und überprüfen">

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
      dbPath: "/Users/<you>/Library/Messages/chat.db",
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

      <Step title="Erste DM-Kopplung genehmigen (Standard-`dmPolicy`)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Kopplungsanfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Entfernter Mac über SSH">
    OpenClaw benötigt nur einen mit stdio kompatiblen `cliPath`, daher können Sie `cliPath` auf ein Wrapper-Skript verweisen lassen, das sich per SSH mit einem entfernten Mac verbindet und `imsg` ausführt.

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
      // Optional: zulässige Wurzeln für Anhänge überschreiben.
      // Standardmäßig enthalten: /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht gesetzt ist, versucht OpenClaw, ihn automatisch durch Parsen des SSH-Wrapper-Skripts zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen).
    OpenClaw verwendet strikte Host-Key-Prüfung für SCP, daher muss der Host-Schlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden gegen zulässige Wurzeln geprüft (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` läuft.
- Vollzugriff auf die Festplatte ist für den Prozesskontext erforderlich, in dem OpenClaw/`imsg` läuft (Zugriff auf die Messages-Datenbank).
- Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn das Gateway headless läuft (LaunchAgent/SSH), führen Sie in genau diesem Kontext einmalig einen interaktiven Befehl aus, um die Abfragen auszulösen:

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
    `channels.imessage.groupPolicy` steuert die Gruppenbehandlung:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Allowlist für Gruppensender: `channels.imessage.groupAllowFrom`.

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, greifen Prüfungen von iMessage-Gruppensendern auf `allowFrom` zurück, wenn verfügbar.
    Laufzeithinweis: Wenn `channels.imessage` vollständig fehlt, greift die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    Mention-Gating für Gruppen:

    - iMessage hat keine nativen Erwähnungsmetadaten
    - Die Erwähnungserkennung verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - Ohne konfigurierte Muster kann Mention-Gating nicht erzwungen werden

    Kontrollbefehle von autorisierten Absendern können Mention-Gating in Gruppen umgehen.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - DMs verwenden Direkt-Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem Standard `session.dmScope=main` werden iMessage-DMs in die Hauptsitzung des Agent zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden mithilfe der Metadaten des Ursprungkanals/-ziels zurück an iMessage geroutet.

    Gruppenähnliches Thread-Verhalten:

    Manche iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` eintreffen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppen-Gating + isolierte Gruppensitzung).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

Veraltete iMessage-Chats können auch an ACP-Sitzungen gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben iMessage-Konversation werden an die erzeugte ACP-Sitzung geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden über `bindings[]`-Einträge auf oberster Ebene mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

`match.peer.id` kann verwenden:

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

Siehe [ACP Agents](/tools/acp-agents) für gemeinsames ACP-Bindungsverhalten.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)">
    Verwenden Sie eine dedizierte Apple-ID und einen dedizierten macOS-Benutzer, damit Bot-Verkehr von Ihrem persönlichen Messages-Profil isoliert ist.

    Typischer Ablauf:

    1. Einen dedizierten macOS-Benutzer erstellen/anmelden.
    2. In diesem Benutzer bei Messages mit der Bot-Apple-ID anmelden.
    3. `imsg` in diesem Benutzer installieren.
    4. Einen SSH-Wrapper erstellen, damit OpenClaw `imsg` in diesem Benutzerkontext ausführen kann.
    5. `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil verweisen lassen.

    Für den ersten Lauf können GUI-Genehmigungen (Automatisierung + Vollzugriff auf die Festplatte) in dieser Bot-Benutzersitzung erforderlich sein.

  </Accordion>

  <Accordion title="Entfernter Mac über Tailscale (Beispiel)">
    Häufige Topologie:

    - Gateway läuft auf Linux/VM
    - iMessage + `imsg` läuft auf einem Mac in Ihrem Tailnet
    - Der `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
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
    Stellen Sie zuerst sicher, dass dem Host-Schlüssel vertraut wird (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` gefüllt wird.

  </Accordion>

  <Accordion title="Multi-Account-Muster">
    iMessage unterstützt kontoabhängige Konfiguration unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Allowlists für Anhangswurzeln überschreiben.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - die Aufnahme eingehender Anhänge ist optional: `channels.imessage.includeAttachments`
    - entfernte Anhangspfade können per SCP abgerufen werden, wenn `remoteHost` gesetzt ist
    - Anhangspfade müssen zulässigen Wurzeln entsprechen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (entfernter SCP-Modus)
      - Standard-Wurzelmuster: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Host-Key-Prüfung (`StrictHostKeyChecking=yes`)
    - die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)
  </Accordion>

  <Accordion title="Ausgehendes Chunking">
    - Text-Chunk-Limit: `channels.imessage.textChunkLimit` (Standard 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (aufteilung nach Absätzen zuerst)
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

iMessage erlaubt standardmäßig kanalinitiierte Konfigurationsschreibvorgänge (für `/config set|unset`, wenn `commands.config: true`).

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

    Wenn der Probe meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`.

  </Accordion>

  <Accordion title="DMs werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - Kopplungsgenehmigungen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Gruppennachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - Allowlist-Verhalten von `channels.imessage.groups`
    - Konfiguration der Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Entfernte Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH-/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - Host-Schlüssel ist in `~/.ssh/known_hosts` auf dem Gateway-Host vorhanden
    - Lesbarkeit des entfernten Pfads auf dem Mac, auf dem Messages läuft

  </Accordion>

  <Accordion title="macOS-Berechtigungsabfragen wurden verpasst">
    Führen Sie die Befehle erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Abfragen:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Bestätigen Sie, dass Vollzugriff auf die Festplatte + Automatisierung für den Prozesskontext erteilt sind, in dem OpenClaw/`imsg` läuft.

  </Accordion>
</AccordionGroup>

## Hinweise zur Konfigurationsreferenz

- [Konfigurationsreferenz - iMessage](/gateway/configuration-reference#imessage)
- [Gateway-Konfiguration](/gateway/configuration)
- [Kopplung](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)

## Verwandt

- [Kanalübersicht](/channels) — alle unterstützten Kanäle
- [Kopplung](/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kanal-Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/gateway/security) — Zugriffsmodell und Härtung
