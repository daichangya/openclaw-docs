---
read_when:
    - Ändern der Kanalweiterleitung oder des Posteingangsverhaltens
summary: Weiterleitungsregeln pro Kanal (WhatsApp, Telegram, Discord, Slack) und gemeinsamer Kontext
title: Kanalweiterleitung
x-i18n:
    generated_at: "2026-04-23T13:57:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad1101d9d3411d9e9f48efd14c0dab09d76e83a6bd93c713d38efc01a14c8391
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanäle & Weiterleitung

OpenClaw leitet Antworten **zurück an den Kanal weiter, aus dem eine Nachricht stammt**. Das
Modell wählt keinen Kanal aus; die Weiterleitung ist deterministisch und wird durch die
Host-Konfiguration gesteuert.

## Schlüsselbegriffe

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` sowie Plugin-Kanäle. `webchat` ist der interne WebChat-UI-Kanal und kein konfigurierbarer ausgehender Kanal.
- **AccountId**: Kanalbezogene Account-Instanz (wenn unterstützt).
- Optionales Kanal-Standardkonto: `channels.<channel>.defaultAccount` legt fest,
  welches Konto verwendet wird, wenn ein ausgehender Pfad kein `accountId` angibt.
  - In Multi-Account-Setups sollten Sie einen expliziten Standard festlegen (`defaultAccount` oder `accounts.default`), wenn zwei oder mehr Konten konfiguriert sind. Andernfalls kann die Fallback-Weiterleitung die erste normalisierte Account-ID auswählen.
- **AgentId**: ein isolierter Arbeitsbereich + Sitzungsspeicher („Gehirn“).
- **SessionKey**: der Bucket-Schlüssel, der zum Speichern von Kontext und zur Steuerung der Nebenläufigkeit verwendet wird.

## SessionKey-Formen (Beispiele)

Direktnachrichten werden standardmäßig zur **main**-Sitzung des Agenten zusammengefasst:

- `agent:<agentId>:<mainKey>` (Standard: `agent:main:main`)

Selbst wenn der Direktnachrichten-Konversationsverlauf mit main geteilt wird, verwenden Sandbox und
Tool-Richtlinie einen abgeleiteten laufzeitspezifischen Direktchat-Schlüssel pro Konto für externe DMs,
damit kanalseitig eingehende Nachrichten nicht wie lokale main-Sitzungsläufe behandelt werden.

Gruppen und Kanäle bleiben pro Kanal isoliert:

- Gruppen: `agent:<agentId>:<channel>:group:<id>`
- Kanäle/Räume: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack-/Discord-Threads hängen `:thread:<threadId>` an den Basisschlüssel an.
- Telegram-Forenthemen betten `:topic:<topicId>` in den Gruppenschlüssel ein.

Beispiele:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## main-DM-Routen-Pinning

Wenn `session.dmScope` auf `main` gesetzt ist, können Direktnachrichten eine gemeinsame main-Sitzung verwenden.
Um zu verhindern, dass die `lastRoute` der Sitzung durch DMs von Nicht-Eigentümern überschrieben wird,
leitet OpenClaw einen angehefteten Eigentümer aus `allowFrom` ab, wenn alle folgenden Bedingungen erfüllt sind:

- `allowFrom` hat genau einen Nicht-Wildcard-Eintrag.
- Der Eintrag kann für diesen Kanal zu einer konkreten Absender-ID normalisiert werden.
- Der Absender der eingehenden DM stimmt nicht mit diesem angehefteten Eigentümer überein.

Im Fall einer solchen Nichtübereinstimmung speichert OpenClaw weiterhin Metadaten zur eingehenden Sitzung,
überspringt aber die Aktualisierung von `lastRoute` der main-Sitzung.

## Weiterleitungsregeln (wie ein Agent ausgewählt wird)

Die Weiterleitung wählt **einen Agenten** für jede eingehende Nachricht aus:

1. **Exakte Peer-Übereinstimmung** (`bindings` mit `peer.kind` + `peer.id`).
2. **Übereinstimmung des übergeordneten Peers** (Thread-Vererbung).
3. **Guild- + Rollen-Übereinstimmung** (Discord) über `guildId` + `roles`.
4. **Guild-Übereinstimmung** (Discord) über `guildId`.
5. **Team-Übereinstimmung** (Slack) über `teamId`.
6. **Konto-Übereinstimmung** (`accountId` auf dem Kanal).
7. **Kanal-Übereinstimmung** (jedes Konto auf diesem Kanal, `accountId: "*"`).
8. **Standard-Agent** (`agents.list[].default`, sonst der erste Listeneintrag, Fallback auf `main`).

Wenn eine Bindung mehrere Abgleichsfelder enthält (`peer`, `guildId`, `teamId`, `roles`), **müssen alle angegebenen Felder übereinstimmen**, damit diese Bindung angewendet wird.

Der abgeglichene Agent bestimmt, welcher Arbeitsbereich und welcher Sitzungsspeicher verwendet werden.

## Broadcast-Gruppen (mehrere Agenten ausführen)

Broadcast-Gruppen erlauben es Ihnen, **mehrere Agenten** für denselben Peer auszuführen, **wenn OpenClaw normalerweise antworten würde** (zum Beispiel: in WhatsApp-Gruppen nach Erwähnungs-/Aktivierungs-Gating).

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

## Konfigurationsübersicht

- `agents.list`: benannte Agent-Definitionen (Arbeitsbereich, Modell usw.).
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

## Sitzungsspeicher

Sitzungsspeicher liegen unter dem Zustandsverzeichnis (Standard `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL-Transkripte liegen neben dem Speicher

Sie können den Speicherpfad über `session.store` und `{agentId}`-Templating überschreiben.

Gateway- und ACP-Sitzungserkennung durchsucht auch festplattenbasierte Agent-Speicher unter dem
Standard-Stammverzeichnis `agents/` und unter per Template erzeugten `session.store`-Wurzeln. Erkannte
Speicher müssen innerhalb dieser aufgelösten Agent-Wurzel bleiben und eine reguläre
`sessions.json`-Datei verwenden. Symlinks und Pfade außerhalb der Wurzel werden ignoriert.

## WebChat-Verhalten

WebChat ist an den **ausgewählten Agenten** gebunden und verwendet standardmäßig die main-Sitzung des
Agenten. Deshalb können Sie in WebChat kanalübergreifenden Kontext für diesen Agenten an einer Stelle sehen.

## Antwortkontext

Eingehende Antworten enthalten:

- `ReplyToId`, `ReplyToBody` und `ReplyToSender`, wenn verfügbar.
- Zitierter Kontext wird als Block `[Replying to ...]` an `Body` angehängt.

Das ist kanalübergreifend konsistent.
