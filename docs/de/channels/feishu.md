---
read_when:
    - Sie möchten einen Feishu-/Lark-Bot verbinden
    - Sie konfigurieren den Feishu-Kanal
summary: Überblick, Funktionen und Konfiguration des Feishu-Bots
title: Feishu
x-i18n:
    generated_at: "2026-04-05T12:35:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e39b6dfe3a3aa4ebbdb992975e570e4f1b5e79f3b400a555fc373a0d1889952
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu-Bot

Feishu (Lark) ist eine Team-Chat-Plattform, die von Unternehmen für Messaging und Zusammenarbeit genutzt wird. Dieses Plugin verbindet OpenClaw mit einem Feishu-/Lark-Bot über das WebSocket-Ereignisabonnement der Plattform, sodass Nachrichten empfangen werden können, ohne eine öffentliche Webhook-URL offenzulegen.

---

## Gebündeltes Plugin

Feishu ist in aktuellen OpenClaw-Versionen gebündelt enthalten, daher ist keine separate Plugin-Installation erforderlich.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die das gebündelte
Feishu nicht enthält, installieren Sie es manuell:

```bash
openclaw plugins install @openclaw/feishu
```

---

## Schnellstart

Es gibt zwei Möglichkeiten, den Feishu-Kanal hinzuzufügen:

### Methode 1: Onboarding (empfohlen)

Wenn Sie OpenClaw gerade installiert haben, führen Sie das Onboarding aus:

```bash
openclaw onboard
```

Der Assistent führt Sie durch folgende Schritte:

1. Eine Feishu-App erstellen und Zugangsdaten erfassen
2. App-Zugangsdaten in OpenClaw konfigurieren
3. Das Gateway starten

✅ **Nach der Konfiguration** prüfen Sie den Gateway-Status:

- `openclaw gateway status`
- `openclaw logs --follow`

### Methode 2: Einrichtung per CLI

Wenn Sie die Erstinstallation bereits abgeschlossen haben, fügen Sie den Kanal über die CLI hinzu:

```bash
openclaw channels add
```

Wählen Sie **Feishu** und geben Sie dann die App ID und das App Secret ein.

✅ **Nach der Konfiguration** verwalten Sie das Gateway:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Schritt 1: Eine Feishu-App erstellen

### 1. Feishu Open Platform öffnen

Besuchen Sie die [Feishu Open Platform](https://open.feishu.cn/app) und melden Sie sich an.

Lark-Mandanten (global) sollten [https://open.larksuite.com/app](https://open.larksuite.com/app) verwenden und in der Feishu-Konfiguration `domain: "lark"` setzen.

### 2. Eine App erstellen

1. Klicken Sie auf **Create enterprise app**
2. Geben Sie den App-Namen und die Beschreibung ein
3. Wählen Sie ein App-Symbol

![Create enterprise app](/images/feishu-step2-create-app.png)

### 3. Zugangsdaten kopieren

Kopieren Sie unter **Credentials & Basic Info**:

- **App ID** (Format: `cli_xxx`)
- **App Secret**

❗ **Wichtig:** Halten Sie das App Secret privat.

![Get credentials](/images/feishu-step3-credentials.png)

### 4. Berechtigungen konfigurieren

Klicken Sie unter **Permissions** auf **Batch import** und fügen Sie Folgendes ein:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](/images/feishu-step4-permissions.png)

### 5. Bot-Funktion aktivieren

Unter **App Capability** > **Bot**:

1. Aktivieren Sie die Bot-Funktion
2. Legen Sie den Bot-Namen fest

![Enable bot capability](/images/feishu-step5-bot-capability.png)

### 6. Ereignisabonnement konfigurieren

⚠️ **Wichtig:** Bevor Sie das Ereignisabonnement einrichten, stellen Sie sicher:

1. Sie haben `openclaw channels add` für Feishu bereits ausgeführt
2. Das Gateway läuft (`openclaw gateway status`)

Unter **Event Subscription**:

1. Wählen Sie **Use long connection to receive events** (WebSocket)
2. Fügen Sie das Ereignis `im.message.receive_v1` hinzu
3. (Optional) Für Drive-Kommentar-Workflows fügen Sie außerdem `drive.notice.comment_add_v1` hinzu

⚠️ Wenn das Gateway nicht läuft, kann die Long-Connection-Einrichtung möglicherweise nicht gespeichert werden.

![Configure event subscription](/images/feishu-step6-event-subscription.png)

### 7. Die App veröffentlichen

1. Erstellen Sie eine Version unter **Version Management & Release**
2. Reichen Sie sie zur Prüfung ein und veröffentlichen Sie sie
3. Warten Sie auf die Admin-Genehmigung (Enterprise-Apps werden normalerweise automatisch genehmigt)

---

## Schritt 2: OpenClaw konfigurieren

### Mit dem Assistenten konfigurieren (empfohlen)

```bash
openclaw channels add
```

Wählen Sie **Feishu** und fügen Sie Ihre App ID und Ihr App Secret ein.

### Über die Konfigurationsdatei konfigurieren

Bearbeiten Sie `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "My AI assistant",
        },
      },
    },
  },
}
```

Wenn Sie `connectionMode: "webhook"` verwenden, setzen Sie sowohl `verificationToken` als auch `encryptKey`. Der Feishu-Webhook-Server bindet standardmäßig an `127.0.0.1`; setzen Sie `webhookHost` nur, wenn Sie absichtlich eine andere Bind-Adresse benötigen.

#### Verification Token und Encrypt Key (Webhook-Modus)

Wenn Sie den Webhook-Modus verwenden, setzen Sie sowohl `channels.feishu.verificationToken` als auch `channels.feishu.encryptKey` in Ihrer Konfiguration. So erhalten Sie die Werte:

1. Öffnen Sie in der Feishu Open Platform Ihre App
2. Gehen Sie zu **Development** → **Events & Callbacks** (开发配置 → 事件与回调)
3. Öffnen Sie den Tab **Encryption** (加密策略)
4. Kopieren Sie **Verification Token** und **Encrypt Key**

Der Screenshot unten zeigt, wo sich der **Verification Token** befindet. Der **Encrypt Key** ist im selben Abschnitt **Encryption** aufgeführt.

![Verification Token location](/images/feishu-verification-token.png)

### Über Umgebungsvariablen konfigurieren

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Lark-Domain (global)

Wenn Ihr Mandant auf Lark (international) läuft, setzen Sie die Domain auf `lark` (oder auf eine vollständige Domain-Zeichenfolge). Sie können dies unter `channels.feishu.domain` oder pro Konto (`channels.feishu.accounts.<id>.domain`) festlegen.

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Flags zur Quotenoptimierung

Sie können die Nutzung der Feishu-API mit zwei optionalen Flags reduzieren:

- `typingIndicator` (Standard `true`): Wenn `false`, werden Aufrufe für Schreibreaktionen übersprungen.
- `resolveSenderNames` (Standard `true`): Wenn `false`, werden Aufrufe zur Abfrage von Senderprofilen übersprungen.

Setzen Sie sie auf oberster Ebene oder pro Konto:

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Schritt 3: Starten und testen

### 1. Das Gateway starten

```bash
openclaw gateway
```

### 2. Eine Testnachricht senden

Suchen Sie in Feishu Ihren Bot und senden Sie eine Nachricht.

### 3. Pairing genehmigen

Standardmäßig antwortet der Bot mit einem Pairing-Code. Genehmigen Sie ihn:

```bash
openclaw pairing approve feishu <CODE>
```

Nach der Genehmigung können Sie normal chatten.

---

## Überblick

- **Feishu-Bot-Kanal**: Vom Gateway verwalteter Feishu-Bot
- **Deterministisches Routing**: Antworten gehen immer an Feishu zurück
- **Sitzungsisolierung**: DMs teilen sich eine Hauptsitzung; Gruppen sind isoliert
- **WebSocket-Verbindung**: Long Connection über das Feishu SDK, keine öffentliche URL erforderlich

---

## Zugriffskontrolle

### Direktnachrichten

- **Standard**: `dmPolicy: "pairing"` (unbekannte Benutzer erhalten einen Pairing-Code)
- **Pairing genehmigen**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Allowlist-Modus**: Setzen Sie `channels.feishu.allowFrom` mit erlaubten Open IDs

### Gruppenchats

**1. Gruppenrichtlinie** (`channels.feishu.groupPolicy`):

- `"open"` = alle in Gruppen zulassen
- `"allowlist"` = nur `groupAllowFrom` zulassen
- `"disabled"` = Gruppennachrichten deaktivieren

Standard: `allowlist`

**2. Mention-Anforderung** (`channels.feishu.requireMention`, überschreibbar über `channels.feishu.groups.<chat_id>.requireMention`):

- explizit `true` = @mention erforderlich
- explizit `false` = ohne Mentions antworten
- wenn nicht gesetzt und `groupPolicy: "open"` = Standard ist `false`
- wenn nicht gesetzt und `groupPolicy` nicht `"open"` ist = Standard ist `true`

---

## Beispiele für Gruppenkonfigurationen

### Alle Gruppen zulassen, keine @mention erforderlich (Standard für offene Gruppen)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Alle Gruppen zulassen, aber weiterhin @mention verlangen

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
      // Feishu-Gruppen-IDs (chat_id) sehen so aus: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Einschränken, welche Absender in einer Gruppe Nachrichten senden dürfen (Absender-Allowlist)

Zusätzlich dazu, dass die Gruppe selbst erlaubt sein muss, werden **alle Nachrichten** in dieser Gruppe durch die Open-ID des Absenders eingeschränkt: Nur Benutzer, die in `groups.<chat_id>.allowFrom` aufgeführt sind, werden verarbeitet; Nachrichten anderer Mitglieder werden ignoriert (dies ist eine vollständige Einschränkung auf Absenderebene, nicht nur für Steuerbefehle wie /reset oder /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Feishu-Benutzer-IDs (open_id) sehen so aus: ou_xxx
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

### Gruppen-IDs (chat_id)

Gruppen-IDs sehen so aus: `oc_xxx`.

**Methode 1 (empfohlen)**

1. Starten Sie das Gateway und @mentionen Sie den Bot in der Gruppe
2. Führen Sie `openclaw logs --follow` aus und suchen Sie nach `chat_id`

**Methode 2**

Verwenden Sie den Feishu-API-Debugger, um Gruppenchats aufzulisten.

### Benutzer-IDs (open_id)

Benutzer-IDs sehen so aus: `ou_xxx`.

**Methode 1 (empfohlen)**

1. Starten Sie das Gateway und senden Sie dem Bot eine DM
2. Führen Sie `openclaw logs --follow` aus und suchen Sie nach `open_id`

**Methode 2**

Prüfen Sie Pairing-Anfragen auf Benutzer-Open-IDs:

```bash
openclaw pairing list feishu
```

---

## Häufige Befehle

| Befehl    | Beschreibung                   |
| --------- | ------------------------------ |
| `/status` | Bot-Status anzeigen            |
| `/reset`  | Die Sitzung zurücksetzen       |
| `/model`  | Modell anzeigen/wechseln       |

> Hinweis: Feishu unterstützt derzeit keine nativen Befehlsmenüs, daher müssen Befehle als Text gesendet werden.

## Gateway-Verwaltungsbefehle

| Befehl                     | Beschreibung                   |
| -------------------------- | ------------------------------ |
| `openclaw gateway status`  | Gateway-Status anzeigen        |
| `openclaw gateway install` | Gateway-Dienst installieren/starten |
| `openclaw gateway stop`    | Gateway-Dienst stoppen         |
| `openclaw gateway restart` | Gateway-Dienst neu starten     |
| `openclaw logs --follow`   | Gateway-Protokolle mitverfolgen |

---

## Fehlerbehebung

### Bot antwortet nicht in Gruppenchats

1. Stellen Sie sicher, dass der Bot zur Gruppe hinzugefügt wurde
2. Stellen Sie sicher, dass Sie den Bot @mentionen (Standardverhalten)
3. Prüfen Sie, ob `groupPolicy` nicht auf `"disabled"` gesetzt ist
4. Prüfen Sie die Protokolle: `openclaw logs --follow`

### Bot empfängt keine Nachrichten

1. Stellen Sie sicher, dass die App veröffentlicht und genehmigt ist
2. Stellen Sie sicher, dass das Ereignisabonnement `im.message.receive_v1` enthält
3. Stellen Sie sicher, dass **long connection** aktiviert ist
4. Stellen Sie sicher, dass die App-Berechtigungen vollständig sind
5. Stellen Sie sicher, dass das Gateway läuft: `openclaw gateway status`
6. Prüfen Sie die Protokolle: `openclaw logs --follow`

### App-Secret offengelegt

1. Setzen Sie das App Secret in der Feishu Open Platform zurück
2. Aktualisieren Sie das App Secret in Ihrer Konfiguration
3. Starten Sie das Gateway neu

### Fehler beim Senden von Nachrichten

1. Stellen Sie sicher, dass die App die Berechtigung `im:message:send_as_bot` hat
2. Stellen Sie sicher, dass die App veröffentlicht ist
3. Prüfen Sie die Protokolle auf detaillierte Fehler

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
          name: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` steuert, welches Feishu-Konto verwendet wird, wenn ausgehende APIs nicht ausdrücklich ein `accountId` angeben.

### Nachrichtenlimits

- `textChunkLimit`: Größe von Textabschnitten für ausgehende Nachrichten (Standard: 2000 Zeichen)
- `mediaMaxMb`: Limit für Upload/Download von Medien (Standard: 30MB)

### Streaming

Feishu unterstützt Streaming-Antworten über interaktive Karten. Wenn aktiviert, aktualisiert der Bot während der Textgenerierung eine Karte.

```json5
{
  channels: {
    feishu: {
      streaming: true, // Streaming-Kartenausgabe aktivieren (Standard true)
      blockStreaming: true, // Streaming auf Blockebene aktivieren (Standard true)
    },
  },
}
```

Setzen Sie `streaming: false`, um auf die vollständige Antwort zu warten, bevor sie gesendet wird.

### ACP-Sitzungen

Feishu unterstützt ACP für:

- DMs
- Gruppen-Topic-Konversationen

Feishu ACP ist textbefehlsgesteuert. Es gibt keine nativen Slash-Command-Menüs, verwenden Sie daher `/acp ...`-Nachrichten direkt in der Konversation.

#### Persistente ACP-Bindings

Verwenden Sie typisierte ACP-Bindings auf oberster Ebene, um eine Feishu-DM oder Topic-Konversation an eine persistente ACP-Sitzung zu binden.

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

#### Thread-gebundener ACP-Spawn aus dem Chat

In einer Feishu-DM oder Topic-Konversation können Sie direkt eine ACP-Sitzung erzeugen und binden:

```text
/acp spawn codex --thread here
```

Hinweise:

- `--thread here` funktioniert für DMs und Feishu-Topics.
- Nachfolgende Nachrichten in der gebundenen DM/im gebundenen Topic werden direkt an diese ACP-Sitzung weitergeleitet.
- v1 zielt nicht auf allgemeine Gruppenchats ohne Topic ab.

### Multi-Agent-Routing

Verwenden Sie `bindings`, um Feishu-DMs oder -Gruppen an unterschiedliche Agenten weiterzuleiten.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
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
- `match.peer.kind`: `"direct"` oder `"group"`
- `match.peer.id`: Benutzer-Open-ID (`ou_xxx`) oder Gruppen-ID (`oc_xxx`)

Siehe [Gruppen-/Benutzer-IDs abrufen](#get-groupuser-ids) für Hinweise zur Ermittlung.

---

## Konfigurationsreferenz

Vollständige Konfiguration: [Gateway-Konfiguration](/gateway/configuration)

Wichtige Optionen:

| Einstellung                                       | Beschreibung                           | Standard         |
| ------------------------------------------------- | -------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Kanal aktivieren/deaktivieren          | `true`           |
| `channels.feishu.domain`                          | API-Domain (`feishu` oder `lark`)      | `feishu`         |
| `channels.feishu.connectionMode`                  | Modus für den Ereignistransport        | `websocket`      |
| `channels.feishu.defaultAccount`                  | Standard-Konto-ID für ausgehendes Routing | `default`     |
| `channels.feishu.verificationToken`               | Erforderlich für den Webhook-Modus     | -                |
| `channels.feishu.encryptKey`                      | Erforderlich für den Webhook-Modus     | -                |
| `channels.feishu.webhookPath`                     | Pfad der Webhook-Route                 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook-Bind-Host                      | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook-Bind-Port                      | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                 | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                             | -                |
| `channels.feishu.accounts.<id>.domain`            | Überschreibung der API-Domain pro Konto | `feishu`        |
| `channels.feishu.dmPolicy`                        | DM-Richtlinie                          | `pairing`        |
| `channels.feishu.allowFrom`                       | DM-Allowlist (open_id-Liste)           | -                |
| `channels.feishu.groupPolicy`                     | Gruppenrichtlinie                      | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Gruppen-Allowlist                      | -                |
| `channels.feishu.requireMention`                  | Standardmäßig @mention erforderlich    | bedingt          |
| `channels.feishu.groups.<chat_id>.requireMention` | Überschreibung für @mention pro Gruppe | vererbt          |
| `channels.feishu.groups.<chat_id>.enabled`        | Gruppe aktivieren                      | `true`           |
| `channels.feishu.textChunkLimit`                  | Größe von Nachrichtenabschnitten       | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Größenlimit für Medien                 | `30`             |
| `channels.feishu.streaming`                       | Streaming-Kartenausgabe aktivieren     | `true`           |
| `channels.feishu.blockStreaming`                  | Block-Streaming aktivieren             | `true`           |

---

## dmPolicy-Referenz

| Wert          | Verhalten                                                       |
| ------------- | --------------------------------------------------------------- |
| `"pairing"`   | **Standard.** Unbekannte Benutzer erhalten einen Pairing-Code und müssen genehmigt werden |
| `"allowlist"` | Nur Benutzer in `allowFrom` können chatten                      |
| `"open"`      | Alle Benutzer zulassen (erfordert `"*"` in `allowFrom`)         |
| `"disabled"`  | DMs deaktivieren                                                |

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
- ✅ Interaktive Karten
- ⚠️ Rich Text (Formatierung im Post-Stil und Karten, nicht beliebige Feishu-Autorenfunktionen)

### Threads und Antworten

- ✅ Inline-Antworten
- ✅ Topic-Thread-Antworten, wenn Feishu `reply_in_thread` bereitstellt
- ✅ Medienantworten bleiben threadbewusst, wenn auf eine Thread-/Topic-Nachricht geantwortet wird

## Drive-Kommentare

Feishu kann den Agenten auslösen, wenn jemand einen Kommentar zu einem Feishu-Drive-Dokument hinzufügt (Docs, Sheets usw.). Der Agent erhält den Kommentartext, den Dokumentkontext und den Kommentar-Thread, damit er im Thread antworten oder Dokumentbearbeitungen vornehmen kann.

Anforderungen:

- Abonnieren Sie `drive.notice.comment_add_v1` in den Ereignisabonnement-Einstellungen Ihrer Feishu-App
  (zusammen mit dem vorhandenen `im.message.receive_v1`)
- Das Drive-Tool ist standardmäßig aktiviert; deaktivieren Sie es mit `channels.feishu.tools.drive: false`

Das Tool `feishu_drive` stellt diese Kommentaraktionen bereit:

| Aktion                 | Beschreibung                            |
| ---------------------- | --------------------------------------- |
| `list_comments`        | Kommentare zu einem Dokument auflisten  |
| `list_comment_replies` | Antworten in einem Kommentar-Thread auflisten |
| `add_comment`          | Einen neuen Kommentar auf oberster Ebene hinzufügen |
| `reply_comment`        | Auf einen vorhandenen Kommentar-Thread antworten |

Wenn der Agent ein Drive-Kommentarereignis verarbeitet, erhält er:

- den Kommentartext und den Absender
- Dokumentmetadaten (Titel, Typ, URL)
- den Kontext des Kommentar-Threads für Antworten im Thread

Nach dem Vornehmen von Dokumentbearbeitungen wird der Agent angewiesen, `feishu_drive.reply_comment` zu verwenden, um den Kommentierenden zu benachrichtigen, und anschließend genau das stille Token `NO_REPLY` / `no_reply` auszugeben, um doppelte Sendungen zu vermeiden.

## Runtime-Aktionsoberfläche

Feishu stellt derzeit diese Runtime-Aktionen bereit:

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- `react` und `reactions`, wenn Reaktionen in der Konfiguration aktiviert sind
- `feishu_drive`-Kommentaraktionen: `list_comments`, `list_comment_replies`, `add_comment`, `reply_comment`

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
