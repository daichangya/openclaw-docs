---
read_when:
    - Kanalrouting oder Posteingangsverhalten ändern
summary: Routing-Regeln pro Kanal (WhatsApp, Telegram, Discord, Slack) und gemeinsamer Kontext
title: Kanalrouting
x-i18n:
    generated_at: "2026-04-24T06:26:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb87a774bb094af15524702c2c4fd17cf0b41fe27ac0943d1008523a43d5553b
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanäle und Routing

OpenClaw leitet Antworten **zurück an den Kanal, aus dem eine Nachricht stammt**. Das
Modell wählt keinen Kanal aus; das Routing ist deterministisch und wird durch die
Host-Konfiguration gesteuert.

## Schlüsselbegriffe

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` sowie Plugin-Kanäle. `webchat` ist der interne WebChat-UI-Kanal und kein konfigurierbarer ausgehender Kanal.
- **AccountId**: kanalbezogene Account-Instanz (falls unterstützt).
- Optionales Kanal-Standardkonto: `channels.<channel>.defaultAccount` legt fest,
  welches Konto verwendet wird, wenn ein ausgehender Pfad keine `accountId` angibt.
  - In Multi-Account-Setups setzen Sie einen expliziten Standardwert (`defaultAccount` oder `accounts.default`), wenn zwei oder mehr Konten konfiguriert sind. Andernfalls kann das Fallback-Routing die erste normalisierte Konto-ID auswählen.
- **AgentId**: ein isolierter Workspace + Sitzungsspeicher („Gehirn“).
- **SessionKey**: der Bucket-Schlüssel, der zum Speichern von Kontext und zur Steuerung der Parallelität verwendet wird.

## SessionKey-Formen (Beispiele)

Direktnachrichten werden standardmäßig in der **Haupt**-Sitzung des Agenten zusammengefasst:

- `agent:<agentId>:<mainKey>` (Standard: `agent:main:main`)

Auch wenn der Direktnachrichten-Konversationsverlauf mit der Hauptsitzung geteilt wird, verwenden Sandbox und
Tool-Richtlinie für externe DMs einen abgeleiteten laufzeitspezifischen Direktchat-Schlüssel pro Konto,
damit kanalursprüngliche Nachrichten nicht wie lokale Hauptsitzungs-Ausführungen behandelt werden.

Gruppen und Kanäle bleiben pro Kanal isoliert:

- Gruppen: `agent:<agentId>:<channel>:group:<id>`
- Kanäle/Räume: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack-/Discord-Threads hängen `:thread:<threadId>` an den Basisschlüssel an.
- Telegram-Forenthemen betten `:topic:<topicId>` in den Gruppenschlüssel ein.

Beispiele:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Anheften der Haupt-DM-Route

Wenn `session.dmScope` auf `main` gesetzt ist, können Direktnachrichten eine gemeinsame Hauptsitzung verwenden.
Damit `lastRoute` der Sitzung nicht durch DMs von Nicht-Eigentümern überschrieben wird,
leitet OpenClaw einen angehefteten Eigentümer aus `allowFrom` ab, wenn alle folgenden Bedingungen erfüllt sind:

- `allowFrom` hat genau einen nicht-Wildcard-Eintrag.
- Der Eintrag kann für diesen Kanal zu einer konkreten Absender-ID normalisiert werden.
- Der eingehende DM-Absender stimmt nicht mit diesem angehefteten Eigentümer überein.

In diesem Fall zeichnet OpenClaw weiterhin eingehende Sitzungsmetadaten auf, überspringt jedoch
das Aktualisieren von `lastRoute` der Hauptsitzung.

## Routing-Regeln (wie ein Agent ausgewählt wird)

Das Routing wählt für jede eingehende Nachricht **einen Agenten** aus:

1. **Exakte Peer-Übereinstimmung** (`bindings` mit `peer.kind` + `peer.id`).
2. **Übereinstimmung des übergeordneten Peers** (Thread-Vererbung).
3. **Guild- + Rollenübereinstimmung** (Discord) über `guildId` + `roles`.
4. **Guild-Übereinstimmung** (Discord) über `guildId`.
5. **Team-Übereinstimmung** (Slack) über `teamId`.
6. **Konto-Übereinstimmung** (`accountId` auf dem Kanal).
7. **Kanal-Übereinstimmung** (beliebiges Konto auf diesem Kanal, `accountId: "*"`).
8. **Standard-Agent** (`agents.list[].default`, andernfalls erster Listeneintrag, Fallback zu `main`).

Wenn ein Binding mehrere Match-Felder enthält (`peer`, `guildId`, `teamId`, `roles`), **müssen alle angegebenen Felder übereinstimmen**, damit dieses Binding angewendet wird.

Der übereinstimmende Agent bestimmt, welcher Workspace und welcher Sitzungsspeicher verwendet werden.

## Broadcast-Gruppen (mehrere Agenten ausführen)

Mit Broadcast-Gruppen können Sie **mehrere Agenten** für denselben Peer ausführen, **wenn OpenClaw normalerweise antworten würde** (zum Beispiel in WhatsApp-Gruppen nach Erwähnungs-/Aktivierungs-Gating).

Konfiguration:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Siehe: [Broadcast-Gruppen](/de/channels/broadcast-groups).

## Konfigurationsüberblick

- `agents.list`: benannte Agent-Definitionen (Workspace, Modell usw.).
- `bindings`: ordnet eingehende Kanäle/Konten/Peers Agenten zu.

Beispiel:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Sitzungsspeicherung

Sitzungsspeicher befinden sich unter dem Zustandsverzeichnis (Standard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-Transkripte befinden sich neben dem Speicher

Sie können den Speicherpfad über `session.store` und `{agentId}`-Templating überschreiben.

Gateway- und ACP-Sitzungserkennung durchsucht auch datenträgergestützte Agent-Speicher unter dem
Standard-Root `agents/` sowie unter templatisierten `session.store`-Roots. Erkannte
Speicher müssen innerhalb dieses aufgelösten Agent-Roots bleiben und eine reguläre
`sessions.json`-Datei verwenden. Symlinks und Pfade außerhalb des Roots werden ignoriert.

## WebChat-Verhalten

WebChat wird an den **ausgewählten Agenten** angehängt und verwendet standardmäßig die
Hauptsitzung des Agenten. Dadurch können Sie in WebChat kanalübergreifenden Kontext für diesen
Agenten an einer Stelle sehen.

## Antwortkontext

Eingehende Antworten enthalten:

- `ReplyToId`, `ReplyToBody` und `ReplyToSender`, wenn verfügbar.
- Zitierter Kontext wird als Block `[Replying to ...]` an `Body` angehängt.

Dies ist kanalübergreifend konsistent.

## Verwandt

- [Gruppen](/de/channels/groups)
- [Broadcast-Gruppen](/de/channels/broadcast-groups)
- [Kopplung](/de/channels/pairing)
