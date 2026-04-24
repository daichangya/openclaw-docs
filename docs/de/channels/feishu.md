---
read_when:
    - Sie möchten einen Feishu-/Lark-Bot verbinden.
    - Sie konfigurieren den Feishu-Kanal.
summary: Feishu-Bot-Überblick, Funktionen und Konfiguration
title: Feishu
x-i18n:
    generated_at: "2026-04-24T06:27:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f68a03c457fb2be7654f298fbad759705983d9e673b7b7b950609694894bdcbc
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark ist eine All-in-one-Kollaborationsplattform, auf der Teams chatten, Dokumente teilen, Kalender verwalten und gemeinsam arbeiten.

**Status:** produktionsbereit für Bot-DMs und Gruppenchats. WebSocket ist der Standardmodus; der Webhook-Modus ist optional.

---

## Schnellstart

> **Erfordert OpenClaw 2026.4.24 oder höher.** Führen Sie `openclaw --version` aus, um dies zu prüfen. Aktualisieren Sie mit `openclaw update`.

<Steps>
  <Step title="Führen Sie den Einrichtungsassistenten für den Kanal aus">
  ```bash
  openclaw channels login --channel feishu
  ```
  Scannen Sie den QR-Code mit Ihrer mobilen Feishu-/Lark-App, um automatisch einen Feishu-/Lark-Bot zu erstellen.
  </Step>
  
  <Step title="Starten Sie nach Abschluss der Einrichtung das Gateway neu, um die Änderungen anzuwenden">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Zugriffskontrolle

### Direktnachrichten

Konfigurieren Sie `dmPolicy`, um zu steuern, wer dem Bot eine Direktnachricht senden kann:

- `"pairing"` — unbekannte Benutzer erhalten einen Pairing-Code; Genehmigung per CLI
- `"allowlist"` — nur in `allowFrom` aufgeführte Benutzer können chatten (Standard: nur der Bot-Eigentümer)
- `"open"` — alle Benutzer zulassen
- `"disabled"` — alle Direktnachrichten deaktivieren

**Eine Pairing-Anfrage genehmigen:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Gruppenchats

**Gruppenrichtlinie** (`channels.feishu.groupPolicy`):

| Wert          | Verhalten                                 |
| ------------- | ----------------------------------------- |
| `"open"`      | Auf alle Nachrichten in Gruppen antworten |
| `"allowlist"` | Nur auf Gruppen in `groupAllowFrom` antworten |
| `"disabled"`  | Alle Gruppennachrichten deaktivieren      |

Standard: `allowlist`

**Erforderliche Erwähnung** (`channels.feishu.requireMention`):

- `true` — @Erwähnung erforderlich (Standard)
- `false` — ohne @Erwähnung antworten
- Überschreibung pro Gruppe: `channels.feishu.groups.<chat_id>.requireMention`

---

## Beispiele für Gruppenkonfigurationen

### Alle Gruppen zulassen, keine @Erwähnung erforderlich

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Alle Gruppen zulassen, @Erwähnung weiterhin erforderlich

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Nur bestimmte Gruppen zulassen

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Gruppen-IDs sehen so aus: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Absender innerhalb einer Gruppe einschränken

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Benutzer-open_ids sehen so aus: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Gruppen-/Benutzer-IDs abrufen

### Gruppen-IDs (`chat_id`, Format: `oc_xxx`)

Öffnen Sie die Gruppe in Feishu/Lark, klicken Sie auf das Menüsymbol oben rechts und gehen Sie zu **Einstellungen**. Die Gruppen-ID (`chat_id`) ist auf der Einstellungsseite aufgeführt.

![Gruppen-ID abrufen](/images/feishu-get-group-id.png)

### Benutzer-IDs (`open_id`, Format: `ou_xxx`)

Starten Sie das Gateway, senden Sie dem Bot eine Direktnachricht und prüfen Sie dann die Logs:

```bash
openclaw logs --follow
```

Suchen Sie in der Log-Ausgabe nach `open_id`. Sie können auch ausstehende Pairing-Anfragen prüfen:

```bash
openclaw pairing list feishu
```

---

## Häufige Befehle

| Befehl    | Beschreibung                     |
| --------- | -------------------------------- |
| `/status` | Bot-Status anzeigen              |
| `/reset`  | Die aktuelle Sitzung zurücksetzen |
| `/model`  | Das KI-Modell anzeigen oder wechseln |

> Feishu/Lark unterstützt keine nativen Slash-Command-Menüs. Senden Sie diese daher als einfache Textnachrichten.

---

## Fehlerbehebung

### Bot antwortet nicht in Gruppenchats

1. Stellen Sie sicher, dass der Bot zur Gruppe hinzugefügt wurde
2. Stellen Sie sicher, dass Sie den Bot mit @ erwähnen (standardmäßig erforderlich)
3. Prüfen Sie, dass `groupPolicy` nicht auf `"disabled"` gesetzt ist
4. Prüfen Sie die Logs: `openclaw logs --follow`

### Bot empfängt keine Nachrichten

1. Stellen Sie sicher, dass der Bot in Feishu Open Platform / Lark Developer veröffentlicht und genehmigt ist
2. Stellen Sie sicher, dass das Event-Abonnement `im.message.receive_v1` umfasst
3. Stellen Sie sicher, dass **persistent connection** (WebSocket) ausgewählt ist
4. Stellen Sie sicher, dass alle erforderlichen Berechtigungsbereiche gewährt wurden
5. Stellen Sie sicher, dass das Gateway läuft: `openclaw gateway status`
6. Prüfen Sie die Logs: `openclaw logs --follow`

### App Secret offengelegt

1. Setzen Sie das App Secret in Feishu Open Platform / Lark Developer zurück
2. Aktualisieren Sie den Wert in Ihrer Konfiguration
3. Starten Sie das Gateway neu: `openclaw gateway restart`

---

## Erweiterte Konfiguration

### Mehrere Konten

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primärer Bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup-Bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` steuert, welches Konto verwendet wird, wenn ausgehende APIs kein `accountId` angeben.

### Nachrichtenlimits

- `textChunkLimit` — Größe der Textblöcke für ausgehende Nachrichten (Standard: `2000` Zeichen)
- `mediaMaxMb` — Upload-/Download-Limit für Medien (Standard: `30` MB)

### Streaming

Feishu/Lark unterstützt Streaming-Antworten über interaktive Karten. Wenn aktiviert, aktualisiert der Bot die Karte in Echtzeit, während er Text generiert.

```json5
{
  channels: {
    feishu: {
      streaming: true, // Streaming-Kartenausgabe aktivieren (Standard: true)
      blockStreaming: true, // Streaming auf Blockebene aktivieren (Standard: true)
    },
  },
}
```

Setzen Sie `streaming: false`, um die vollständige Antwort in einer einzelnen Nachricht zu senden.

### Quotenoptimierung

Reduzieren Sie die Anzahl der Feishu-/Lark-API-Aufrufe mit zwei optionalen Flags:

- `typingIndicator` (Standard `true`): auf `false` setzen, um Aufrufe für Tippreaktionen zu überspringen
- `resolveSenderNames` (Standard `true`): auf `false` setzen, um Abfragen von Absenderprofilen zu überspringen

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### ACP-Sitzungen

Feishu/Lark unterstützt ACP für DMs und Gruppen-Thread-Nachrichten. Feishu/Lark ACP wird über Textbefehle gesteuert — es gibt keine nativen Slash-Command-Menüs, daher verwenden Sie `/acp ...`-Nachrichten direkt in der Unterhaltung.

#### Persistente ACP-Bindung

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### ACP aus dem Chat starten

In einer Feishu-/Lark-DM oder einem Thread:

```text
/acp spawn codex --thread here
```

`--thread here` funktioniert für DMs und Feishu-/Lark-Thread-Nachrichten. Folgende Nachrichten in der gebundenen Unterhaltung werden direkt an diese ACP-Sitzung weitergeleitet.

### Routing für mehrere Agenten

Verwenden Sie `bindings`, um Feishu-/Lark-DMs oder -Gruppen an unterschiedliche Agenten weiterzuleiten.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Routing-Felder:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) oder `"group"` (Gruppenchat)
- `match.peer.id`: Benutzer-Open-ID (`ou_xxx`) oder Gruppen-ID (`oc_xxx`)

Siehe [Gruppen-/Benutzer-IDs abrufen](#get-groupuser-ids) für Tipps zur Ermittlung.

---

## Konfigurationsreferenz

Vollständige Konfiguration: [Gateway-Konfiguration](/de/gateway/configuration)

| Einstellung                                       | Beschreibung                               | Standard         |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Kanal aktivieren/deaktivieren              | `true`           |
| `channels.feishu.domain`                          | API-Domain (`feishu` oder `lark`)          | `feishu`         |
| `channels.feishu.connectionMode`                  | Event-Transport (`websocket` oder `webhook`) | `websocket`    |
| `channels.feishu.defaultAccount`                  | Standardkonto für ausgehendes Routing      | `default`        |
| `channels.feishu.verificationToken`               | Erforderlich für den Webhook-Modus         | —                |
| `channels.feishu.encryptKey`                      | Erforderlich für den Webhook-Modus         | —                |
| `channels.feishu.webhookPath`                     | Pfad der Webhook-Route                     | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Bind-Host für den Webhook                  | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Bind-Port für den Webhook                  | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App-ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Domain-Überschreibung pro Konto            | `feishu`         |
| `channels.feishu.dmPolicy`                        | DM-Richtlinie                              | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM-Allowlist (open_id-Liste)               | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Gruppenrichtlinie                          | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Gruppen-Allowlist                          | —                |
| `channels.feishu.requireMention`                  | @Erwähnung in Gruppen erforderlich         | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Überschreibung der @Erwähnung pro Gruppe   | vererbt          |
| `channels.feishu.groups.<chat_id>.enabled`        | Eine bestimmte Gruppe aktivieren/deaktivieren | `true`        |
| `channels.feishu.textChunkLimit`                  | Größe der Nachrichtenblöcke                | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limit für Mediengröße                      | `30`             |
| `channels.feishu.streaming`                       | Streaming-Kartenausgabe                    | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming auf Blockebene                   | `true`           |
| `channels.feishu.typingIndicator`                 | Tippreaktionen senden                      | `true`           |
| `channels.feishu.resolveSenderNames`              | Anzeigenamen von Absendern auflösen        | `true`           |

---

## Unterstützte Nachrichtentypen

### Empfangen

- ✅ Text
- ✅ Rich Text (Post)
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Sticker

### Senden

- ✅ Text
- ✅ Bilder
- ✅ Dateien
- ✅ Audio
- ✅ Video/Medien
- ✅ Interaktive Karten (einschließlich Streaming-Updates)
- ⚠️ Rich Text (Formatierung im Post-Stil; unterstützt nicht die vollständigen Authoring-Funktionen von Feishu/Lark)

### Threads und Antworten

- ✅ Inline-Antworten
- ✅ Thread-Antworten
- ✅ Medienantworten bleiben threadbewusst, wenn auf eine Thread-Nachricht geantwortet wird

---

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Steuerung über Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
