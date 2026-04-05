---
read_when:
    - Ändern des Kanal-Routings oder des Inbox-Verhaltens
summary: Routing-Regeln pro Kanal (WhatsApp, Telegram, Discord, Slack) und gemeinsamer Kontext
title: Kanal-Routing
x-i18n:
    generated_at: "2026-04-05T12:34:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63916c4dd0af5fc9bbd12581a9eb15fea14a380c5ade09323ca0c237db61e537
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanäle und Routing

OpenClaw leitet Antworten **an den Kanal zurück, aus dem eine Nachricht stammt**. Das
Modell wählt keinen Kanal aus; das Routing ist deterministisch und wird durch die
Host-Konfiguration gesteuert.

## Schlüsselbegriffe

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` sowie Erweiterungskanäle. `webchat` ist der interne WebChat-UI-Kanal und kein konfigurierbarer ausgehender Kanal.
- **AccountId**: kanalbezogene Kontoinstanz (wenn unterstützt).
- Optionale Standardkontoauswahl pro Kanal: `channels.<channel>.defaultAccount` legt fest,
  welches Konto verwendet wird, wenn ein ausgehender Pfad kein `accountId` angibt.
  - In Multi-Account-Setups legen Sie einen expliziten Standard fest (`defaultAccount` oder `accounts.default`), wenn zwei oder mehr Konten konfiguriert sind. Andernfalls kann das Fallback-Routing die erste normalisierte Konto-ID auswählen.
- **AgentId**: ein isolierter Workspace- und Sitzungsspeicher („Brain“).
- **SessionKey**: der Bucket-Schlüssel, der zum Speichern von Kontext und zur Steuerung der Parallelität verwendet wird.

## SessionKey-Formen (Beispiele)

Direktnachrichten werden auf die **Haupt**-Sitzung des Agenten zusammengeführt:

- `agent:<agentId>:<mainKey>` (Standard: `agent:main:main`)

Gruppen und Kanäle bleiben pro Kanal isoliert:

- Gruppen: `agent:<agentId>:<channel>:group:<id>`
- Kanäle/Räume: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack-/Discord-Threads hängen `:thread:<threadId>` an den Basisschlüssel an.
- Telegram-Forenthemen betten `:topic:<topicId>` in den Gruppenschlüssel ein.

Beispiele:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Anheften der Hauptroute für Direktnachrichten

Wenn `session.dmScope` auf `main` gesetzt ist, können Direktnachrichten eine gemeinsame Hauptsitzung verwenden.
Damit `lastRoute` der Sitzung nicht durch Direktnachrichten von Nicht-Eigentümern überschrieben wird,
leitet OpenClaw aus `allowFrom` einen angehefteten Eigentümer ab, wenn alle folgenden Bedingungen erfüllt sind:

- `allowFrom` hat genau einen nicht mit Wildcard versehenen Eintrag.
- Der Eintrag kann für diesen Kanal zu einer konkreten Absender-ID normalisiert werden.
- Der Absender der eingehenden Direktnachricht stimmt nicht mit diesem angehefteten Eigentümer überein.

Im Fall einer solchen Nichtübereinstimmung zeichnet OpenClaw weiterhin eingehende Sitzungsmetadaten auf, aktualisiert jedoch
`lastRoute` der Hauptsitzung nicht.

## Routing-Regeln (wie ein Agent ausgewählt wird)

Das Routing wählt für jede eingehende Nachricht **einen Agenten** aus:

1. **Exakte Peer-Übereinstimmung** (`bindings` mit `peer.kind` + `peer.id`).
2. **Übereinstimmung des übergeordneten Peers** (Thread-Vererbung).
3. **Übereinstimmung von Guild + Rollen** (Discord) über `guildId` + `roles`.
4. **Guild-Übereinstimmung** (Discord) über `guildId`.
5. **Team-Übereinstimmung** (Slack) über `teamId`.
6. **Konto-Übereinstimmung** (`accountId` auf dem Kanal).
7. **Kanal-Übereinstimmung** (beliebiges Konto auf diesem Kanal, `accountId: "*"`).
8. **Standard-Agent** (`agents.list[].default`, sonst der erste Listeneintrag, Fallback auf `main`).

Wenn ein Binding mehrere Abgleichsfelder enthält (`peer`, `guildId`, `teamId`, `roles`), **müssen alle angegebenen Felder übereinstimmen**, damit dieses Binding angewendet wird.

Der übereinstimmende Agent bestimmt, welcher Workspace- und Sitzungsspeicher verwendet wird.

## Broadcast Groups (mehrere Agenten ausführen)

Mit Broadcast Groups können Sie **mehrere Agenten** für denselben Peer ausführen, **wenn OpenClaw normalerweise antworten würde** (zum Beispiel in WhatsApp-Gruppen nach Erwähnungs-/Aktivierungs-Gating).

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

Siehe: [Broadcast Groups](/channels/broadcast-groups).

## Konfigurationsüberblick

- `agents.list`: benannte Agentdefinitionen (Workspace, Modell usw.).
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

Sitzungsspeicher befinden sich im Statusverzeichnis (Standard: `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-Transkripte liegen neben dem Speicher

Sie können den Speicherpfad über `session.store` und das Templating mit `{agentId}` überschreiben.

Die Gateway- und ACP-Sitzungserkennung durchsucht außerdem festplattenbasierte Agentenspeicher unter dem
Standardstamm `agents/` und unter templatisierten `session.store`-Wurzeln. Erkannte
Speicher müssen innerhalb dieser aufgelösten Agentenwurzel bleiben und eine reguläre
Datei `sessions.json` verwenden. Symlinks und Pfade außerhalb der Wurzel werden ignoriert.

## WebChat-Verhalten

WebChat wird an den **ausgewählten Agenten** angehängt und verwendet standardmäßig die
Hauptsitzung des Agenten. Dadurch können Sie mit WebChat kanalübergreifenden Kontext für diesen
Agenten an einer Stelle sehen.

## Antwortkontext

Eingehende Antworten enthalten:

- `ReplyToId`, `ReplyToBody` und `ReplyToSender`, wenn verfügbar.
- Zitierter Kontext wird als Block `[Replying to ...]` an `Body` angehängt.

Das ist über alle Kanäle hinweg konsistent.
