---
read_when:
    - Sie arbeiten an Telegram-Funktionen oder Webhooks
summary: Status der Telegram-Bot-Unterstützung, Funktionen und Konfiguration
title: Telegram
x-i18n:
    generated_at: "2026-04-05T12:38:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39fbf328375fbc5d08ec2e3eed58b19ee0afa102010ecbc02e074a310ced157e
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: produktionsreif für Bot-DMs und -Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Pairing.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/gateway/configuration">
    Vollständige Kanal-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="Das Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (vergewissern Sie sich, dass der Handle genau `@BotFather` ist).

    Führen Sie `/newbot` aus, folgen Sie den Eingabeaufforderungen und speichern Sie das Token.

  </Step>

  <Step title="Token und DM-Richtlinie konfigurieren">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Env-Fallback: `TELEGRAM_BOT_TOKEN=...` (nur Standardkonto).
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in der Konfiguration/Umgebung und starten Sie dann das Gateway.

  </Step>

  <Step title="Gateway starten und erste DM genehmigen">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing-Codes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Den Bot zu einer Gruppe hinzufügen">
    Fügen Sie den Bot zu Ihrer Gruppe hinzu und setzen Sie dann `channels.telegram.groups` und `groupPolicy` so, dass sie zu Ihrem Zugriffsmodell passen.
  </Step>
</Steps>

<Note>
Die Reihenfolge der Token-Auflösung ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Einstellungen auf Telegram-Seite

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Datenschutzmodus**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen soll, dann entweder:

    - deaktivieren Sie den Datenschutzmodus über `/setprivacy`, oder
    - machen Sie den Bot zum Gruppenadmin.

    Wenn Sie den Datenschutzmodus umschalten, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung übernimmt.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Admin-Status wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für immer aktive Gruppenfunktionen nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Umschalter">

    - `/setjoingroups`, um Gruppenbeitritte zu erlauben/verbieten
    - `/setprivacy` für das Sichtbarkeitsverhalten in Gruppen

  </Accordion>
</AccordionGroup>

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.telegram.dmPolicy` steuert den Zugriff auf Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens eine Absender-ID in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `channels.telegram.allowFrom` akzeptiert numerische Telegram-Benutzer-IDs. Präfixe `telegram:` / `tg:` werden akzeptiert und normalisiert.
    `dmPolicy: "allowlist"` mit leerem `allowFrom` blockiert alle DMs und wird von der Konfigurationsvalidierung abgelehnt.
    Das Onboarding akzeptiert `@username`-Eingaben und löst sie zu numerischen IDs auf.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Allowlist-Einträge enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best-Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie zuvor auf Allowlist-Dateien aus dem Pairing-Store vertraut haben, kann `openclaw doctor --fix` Einträge in `channels.telegram.allowFrom` für Allowlist-Abläufe wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit einem Eigentümer bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (anstatt von vorherigen Pairing-Genehmigungen abzuhängen).

    Häufiges Missverständnis: Die Genehmigung des DM-Pairings bedeutet nicht „dieser Absender ist überall autorisiert“.
    Pairing gewährt nur DM-Zugriff. Die Autorisierung von Gruppenabsendern kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten, dass „ich einmal autorisiert bin und sowohl DMs als auch Gruppenbefehle funktionieren“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (kein Drittanbieter-Bot):

    1. Senden Sie Ihrem Bot eine DM.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Drittanbieter-Methode (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen greifen gemeinsam:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: jede Gruppe kann die Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: wirkt als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn es nicht gesetzt ist, verwendet Telegram `allowFrom` als Fallback.
    Einträge in `groupAllowFrom` sollten numerische Telegram-Benutzer-IDs sein (`telegram:` / `tg:`-Präfixe werden normalisiert).
    Legen Sie keine Telegram-Gruppen- oder Supergroup-Chat-IDs in `groupAllowFrom` ab. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Authentifizierung von Gruppenabsendern übernimmt **nicht** die Genehmigungen aus dem DM-Pairing-Store.
    Pairing bleibt DM-only. Für Gruppen setzen Sie `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Topic.
    Wenn `groupAllowFrom` nicht gesetzt ist, verwendet Telegram die Konfiguration `allowFrom` als Fallback, nicht den Pairing-Store.
    Praktisches Muster für Bots mit einem Eigentümer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Runtime-Hinweis: Wenn `channels.telegram` vollständig fehlt, sind die Runtime-Standards fail-closed mit `groupPolicy="allowlist"`, es sei denn, `channels.defaults.groupPolicy` ist explizit gesetzt.

    Beispiel: Jedes Mitglied in genau einer bestimmten Gruppe zulassen:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Beispiel: Nur bestimmte Benutzer in genau einer bestimmten Gruppe zulassen:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Häufiger Fehler: `groupAllowFrom` ist keine Telegram-Gruppen-Allowlist.

      - Legen Sie negative Telegram-Gruppen- oder Supergroup-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie einschränken möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur dann, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.
    </Warning>

  </Tab>

  <Tab title="Mention-Verhalten">
    Gruppenantworten erfordern standardmäßig eine Mention.

    Eine Mention kann kommen von:

    - einer nativen `@botusername`-Mention, oder
    - Mention-Mustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschalter auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungsstatus. Verwenden Sie die Konfiguration für Persistenz.

    Beispiel für persistente Konfiguration:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Die Gruppen-Chat-ID ermitteln:

    - Leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie Bot-API-`getUpdates`

  </Tab>
</Tabs>

## Runtime-Verhalten

- Telegram wird vom Gateway-Prozess verwaltet.
- Das Routing ist deterministisch: Eingehende Telegram-Nachrichten antworten zurück an Telegram (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in das gemeinsame Kanal-Envelope mit Antwortmetadaten und Medien-Platzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forum-Topics hängen `:topic:<threadId>` an, um Topics isoliert zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw routet sie mit threadbewussten Sitzungsschlüsseln und bewahrt die Thread-ID für Antworten.
- Long Polling verwendet grammY runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Stream-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann partielle Antworten in Echtzeit streamen:

    - Direktchats: Vorschaunachricht + `editMessageText`
    - Gruppen/Topics: Vorschaunachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` wird auf Telegram zu `partial` abgebildet (Kompatibilität mit kanalübergreifender Benennung)
    - veraltete Werte `channels.telegram.streamMode` und boolesche `streaming`-Werte werden automatisch abgebildet

    Für reine Textantworten:

    - DM: OpenClaw behält dieselbe Vorschaunachricht und führt zum Abschluss eine finale Bearbeitung an Ort und Stelle aus (keine zweite Nachricht)
    - Gruppe/Topic: OpenClaw behält dieselbe Vorschaunachricht und führt zum Abschluss eine finale Bearbeitung an Ort und Stelle aus (keine zweite Nachricht)

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf die normale endgültige Zustellung zurück und bereinigt anschließend die Vorschaunachricht.

    Vorschau-Streaming ist getrennt von Block-Streaming. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Wenn der native Draft-Transport nicht verfügbar ist/abgelehnt wird, fällt OpenClaw automatisch auf `sendMessage` + `editMessageText` zurück.

    Nur Telegram-Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die endgültige Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-artiger Text wird in Telegram-sicheres HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parse-Fehler zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Link-Vorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` durchgeführt.

    Standardwerte für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Fügen Sie benutzerdefinierte Befehlsmenüeinträge hinzu:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Regeln:

    - Namen werden normalisiert (führendes `/` entfernen, kleinschreiben)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren Verhalten nicht automatisch
    - Plugin-/Skills-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte Plugin-/Skill-Befehle können bei entsprechender Konfiguration weiterhin registriert werden.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü auch nach dem Kürzen noch überläuft; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet gewöhnlich, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Geräte-Pairing-Befehle (`device-pair`-Plugin)

    Wenn das Plugin `device-pair` installiert ist:

    1. `/pair` erzeugt einen Einrichtungscode
    2. fügen Sie den Code in die iOS-App ein
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. genehmigen Sie die Anfrage:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die zuletzt eingegangene

    Der Einrichtungscode trägt ein kurzlebiges Bootstrap-Token. Das integrierte Bootstrap-Handoff hält das primäre Node-Token bei `scopes: []`; jedes weitergereichte Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scopes werden rollenpräfixiert geprüft, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Rollen ohne Operator-Präfix benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Auth-Details erneut versucht (zum Beispiel Rolle/Scopes/Public Key), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie `/pair pending` erneut aus, bevor Sie genehmigen.

    Weitere Details: [Pairing](/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
    Konfigurieren Sie den Geltungsbereich der Inline-Tastatur:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Überschreibung pro Konto:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Bereiche:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Veraltetes `capabilities: ["inlineButtons"]` wird zu `inlineButtons: "all"` abgebildet.

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Callback-Klicks werden als Text an den Agenten übergeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating-Steuerungen:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Runtime-Sendungen verwenden den aktiven Snapshot von Konfiguration/Secrets (Start/Reload), daher führen Aktionspfade keine ad-hoc-SecretRef-Neuauflösung pro Sendung durch.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Antwort-Threading-Tags">
    Telegram unterstützt explizite Reply-Threading-Tags in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forum-Topics und Thread-Verhalten">
    Forum-Supergroups:

    - Topic-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Typing zielen auf den Topic-Thread
    - Topic-Konfigurationspfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall „General Topic“ (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Typing-Aktionen enthalten weiterhin `message_thread_id`

    Topic-Vererbung: Topic-Einträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` gilt nur für Topics und wird nicht von Gruppenstandards geerbt.

    **Agent-Routing pro Topic**: Jedes Topic kann durch Setzen von `agentId` in der Topic-Konfiguration zu einem anderen Agenten geroutet werden. Dadurch erhält jedes Topic einen eigenen isolierten Workspace, Speicher und eine eigene Sitzung. Beispiel:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Jedes Topic hat dann seinen eigenen Sitzungsschlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Topic-Bindung**: Forum-Topics können ACP-Harness-Sitzungen über typisierte ACP-Bindings auf oberster Ebene fixieren:

    - `bindings[]` mit `type: "acp"` und `match.channel: "telegram"`

    Beispiel:

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
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Dies ist derzeit auf Forum-Topics in Gruppen und Supergroups beschränkt.

    **Thread-gebundener ACP-Spawn aus dem Chat**:

    - `/acp spawn <agent> --thread here|auto` kann das aktuelle Telegram-Topic an eine neue ACP-Sitzung binden.
    - Nachfolgende Topic-Nachrichten werden direkt an die gebundene ACP-Sitzung weitergeleitet (kein `/acp steer` erforderlich).
    - OpenClaw pinnt die Spawn-Bestätigungsnachricht nach erfolgreicher Bindung im Topic.
    - Erfordert `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Der Template-Kontext enthält:

    - `MessageThreadId`
    - `IsForum`

    Verhalten von DM-Threads:

    - private Chats mit `message_thread_id` behalten DM-Routing bei, verwenden aber threadbewusste Sitzungsschlüssel/Antwortziele.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnachrichten und Audiodateien.

    - Standard: Verhalten von Audiodateien
    - Tag `[[audio_as_voice]]` in der Agentenantwort, um das Senden als Sprachnachricht zu erzwingen

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Videonachrichten

    Telegram unterscheidet zwischen Videodateien und Video Notes.

    Beispiel für Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video Notes unterstützen keine Bildunterschriften; bereitgestellter Nachrichtentext wird separat gesendet.

    ### Sticker

    Verarbeitung eingehender Sticker:

    - statisches WEBP: heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`)
    - animiertes TGS: übersprungen
    - Video-WEBM: übersprungen

    Sticker-Kontextfelder:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Sticker-Cache-Datei:

    - `~/.openclaw/telegram/sticker-cache.json`

    Sticker werden einmal beschrieben (wenn möglich) und zwischengespeichert, um wiederholte Vision-Aufrufe zu reduzieren.

    Sticker-Aktionen aktivieren:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Sticker-Sendeaktion:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Zwischengespeicherte Sticker durchsuchen:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Telegram-Reaktionen kommen als `message_reaction`-Updates an (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, reiht OpenClaw Systemereignisse ein wie:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best-Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram stellt in Reaktions-Updates keine Thread-IDs bereit.
      - Nicht-Forum-Gruppen werden zur Gruppenchatsitzung geroutet
      - Forum-Gruppen werden zur General-Topic-Sitzung der Gruppe (`:topic:1`) geroutet, nicht zum genauen Ursprungsthema

    `allowed_updates` für Polling/Webhook enthalten automatisch `message_reaction`.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Reihenfolge der Auflösung:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Agent-Identity-Emoji (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge in die Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

    Durch Telegram ausgelöste Schreibvorgänge umfassen:

    - Gruppenmigrationsereignisse (`migrate_to_chat_id`) zum Aktualisieren von `channels.telegram.groups`
    - `/config set` und `/config unset` (erfordert aktivierte Befehle)

    Deaktivieren:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long Polling vs Webhook">
    Standard: Long Polling.

    Webhook-Modus:

    - setzen Sie `channels.telegram.webhookUrl`
    - setzen Sie `channels.telegram.webhookSecret` (erforderlich, wenn eine Webhook-URL gesetzt ist)
    - optional `channels.telegram.webhookPath` (Standard `/telegram-webhook`)
    - optional `channels.telegram.webhookHost` (Standard `127.0.0.1`)
    - optional `channels.telegram.webhookPort` (Standard `8787`)

    Der lokale Listener im Webhook-Modus bindet standardmäßig an `127.0.0.1:8787`.

    Wenn sich Ihr öffentlicher Endpunkt unterscheidet, platzieren Sie einen Reverse Proxy davor und zeigen Sie mit `webhookUrl` auf die öffentliche URL.
    Setzen Sie `webhookHost` (zum Beispiel `0.0.0.0`), wenn Sie absichtlich externen Ingress benötigen.

  </Accordion>

  <Accordion title="Limits, Wiederholungen und CLI-Ziele">
    - Standard für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen), bevor nach Länge aufgeteilt wird.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard).
    - Der Gruppenkontextverlauf verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - zusätzlicher Kontext für Antwort/Zitat/Weiterleitung wird derzeit unverändert weitergegeben.
    - Telegram-Allowlists steuern in erster Linie, wer den Agenten auslösen kann, nicht eine vollständige Redaktionsgrenze für zusätzlichen Kontext.
    - DM-Verlaufssteuerungen:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern.

    Das CLI-Sendeziel kann eine numerische Chat-ID oder ein Benutzername sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram-Umfragen verwenden `openclaw message poll` und unterstützen Forum-Topics:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Nur-Telegram-Umfrage-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forum-Topics (oder verwenden Sie ein `:topic:`-Ziel)

    Telegram-Senden unterstützt außerdem:

    - `--buttons` für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies für die Zieloberfläche erlaubt
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Fotos oder Uploads animierter Medien zu senden

    Aktions-Gating:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Umfragen
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Umfragen, während normale Sendungen aktiviert bleiben

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Approver-DMs und kann optional Genehmigungsaufforderungen im ursprünglichen Chat oder Topic posten.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (optional; verwendet, wenn möglich, numerische Eigentümer-IDs als Fallback, die aus `allowFrom` und direktem `defaultTo` abgeleitet werden)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`

    Approver müssen numerische Telegram-Benutzer-IDs sein. Telegram aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Approver aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus der numerischen Eigentümerkonfiguration des Kontos (`allowFrom` und Direktnachrichten-`defaultTo`). Setzen Sie `enabled: false`, um Telegram explizit als nativen Genehmigungsclient zu deaktivieren. Genehmigungsanfragen fallen ansonsten auf andere konfigurierte Genehmigungsrouten oder die Fallback-Richtlinie für Exec-Genehmigungen zurück.

    Telegram rendert außerdem die gemeinsamen Genehmigungsschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Telegram-Adapter ergänzt hauptsächlich Approver-DM-Routing, Fanout in Kanal/Topic und Typing-Hinweise vor der Zustellung.
    Wenn diese Schaltflächen vorhanden sind, bilden sie die primäre UX für Genehmigungen; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur dann einschließen, wenn das Tool-Ergebnis angibt,
    dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.

    Zustellregeln:

    - `target: "dm"` sendet Genehmigungsaufforderungen nur an aufgelöste Approver-DMs
    - `target: "channel"` sendet die Aufforderung zurück in den auslösenden Telegram-Chat/das Topic
    - `target: "both"` sendet an Approver-DMs und den auslösenden Chat/das Topic

    Nur aufgelöste Approver können genehmigen oder ablehnen. Nicht-Approver können weder `/approve` verwenden noch Telegram-Genehmigungsschaltflächen nutzen.

    Verhalten bei der Genehmigungsauflösung:

    - IDs mit Präfix `plugin:` werden immer über Plugin-Genehmigungen aufgelöst.
    - Andere Genehmigungs-IDs versuchen zuerst `exec.approval.resolve`.
    - Wenn Telegram auch für Plugin-Genehmigungen autorisiert ist und das Gateway meldet,
      dass die Exec-Genehmigung unbekannt/abgelaufen ist, versucht Telegram es einmal erneut über
      `plugin.approval.resolve`.
    - Echte Ablehnungen/Fehler bei Exec-Genehmigungen fallen nicht stillschweigend auf die Plugin-Genehmigungsauflösung zurück.

    Die Zustellung im Kanal zeigt den Befehlstext im Chat, aktivieren Sie `channel` oder `both` also nur in vertrauenswürdigen Gruppen/Topics. Wenn die Aufforderung in einem Forum-Topic landet, bewahrt OpenClaw das Topic sowohl für die Genehmigungsaufforderung als auch für das Follow-up nach der Genehmigung. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen hängen außerdem davon ab, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche erlaubt (`dm`, `group` oder `all`).

    Zugehörige Dokumentation: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Fehlerantwort-Steuerungen

Wenn der Agent auf einen Zustellungs- oder Provider-Fehler stößt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                      |
| ----------------------------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung in den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam bei Ausfällen.   |

Überschreibungen pro Konto, pro Gruppe und pro Topic werden unterstützt (dieselbe Vererbung wie bei anderen Telegram-Konfigurationsschlüsseln).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // Fehler in dieser Gruppe unterdrücken
        },
      },
    },
  },
}
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Bot antwortet nicht auf Gruppennachrichten ohne Mention">

    - Wenn `requireMention=false`, muss der Telegram-Datenschutzmodus volle Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - dann Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration nicht erwähnte Gruppennachrichten erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; Wildcard `"*"` kann nicht auf Mitgliedschaft geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht Gruppennachrichten überhaupt nicht">

    - wenn `channels.telegram.groups` existiert, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - Bot-Mitgliedschaft in der Gruppe prüfen
    - Protokolle prüfen: `openclaw logs --follow` nach Gründen für das Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - autorisieren Sie Ihre Absenderidentität (Pairing und/oder numerisches `allowFrom`)
    - Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern weist normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Polling- oder Netzwerk-Instabilität">

    - Node 22+ + benutzerdefiniertes Fetch/Proxy kann sofortiges Abort-Verhalten auslösen, wenn `AbortSignal`-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; fehlerhafter IPv6-Egress kann intermittierende Telegram-API-Fehler verursachen.
    - Wenn Protokolle `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, versucht OpenClaw diese nun als behebbare Netzwerkfehler erneut.
    - Auf VPS-Hosts mit instabilem direktem Egress/TLS leiten Sie Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2) und `dnsResultOrder=ipv4first`.
    - Wenn Ihr Host WSL2 ist oder explizit besser mit IPv4-only-Verhalten funktioniert, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmark-Bereich (`198.18.0.0/15`) sind bereits standardmäßig
      für Telegram-Mediendownloads erlaubt. Wenn ein vertrauenswürdiges Fake-IP- oder
      transparenter Proxy `api.telegram.org` bei Mediendownloads auf eine andere
      private/interne/special-use-Adresse umschreibt, können Sie den
      nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Aktivierung ist pro Konto verfügbar unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Wenn Ihr Proxy Telegram-Media-Hosts zu `198.18.x.x` auflöst, lassen Sie das
      gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-
      Benchmark-Bereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt die Telegram-
      Medien-SSRF-Schutzmaßnahmen. Verwenden Sie dies nur für vertrauenswürdige, vom Betreiber kontrollierte Proxy-
      Umgebungen wie Clash, Mihomo oder Surge Fake-IP-Routing, wenn diese private oder Special-Use-Antworten
      außerhalb des RFC-2544-Benchmark-Bereichs synthetisieren. Lassen Sie es für normalen öffentlichen Internetzugang zu Telegram deaktiviert.
    </Warning>

    - Umgebungsüberschreibungen (temporär):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS-Antworten validieren:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Weitere Hilfe: [Kanal-Fehlerbehebung](/channels/troubleshooting).

## Verweise auf die Telegram-Konfigurationsreferenz

Primäre Referenz:

- `channels.telegram.enabled`: Start des Kanals aktivieren/deaktivieren.
- `channels.telegram.botToken`: Bot-Token (BotFather).
- `channels.telegram.tokenFile`: Token aus einem regulären Dateipfad lesen. Symlinks werden abgelehnt.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.telegram.allowFrom`: DM-Allowlist (numerische Telegram-Benutzer-IDs). `allowlist` erfordert mindestens eine Absender-ID. `open` erfordert `"*"`. `openclaw doctor --fix` kann veraltete `@username`-Einträge zu IDs auflösen und Allowlist-Einträge aus Pairing-Store-Dateien in Allowlist-Migrationsabläufen wiederherstellen.
- `channels.telegram.actions.poll`: Erstellung von Telegram-Umfragen aktivieren oder deaktivieren (standardmäßig aktiviert; erfordert weiterhin `sendMessage`).
- `channels.telegram.defaultTo`: Standard-Telegram-Ziel, das von CLI `--deliver` verwendet wird, wenn kein explizites `--reply-to` angegeben wird.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.telegram.groupAllowFrom`: Gruppenabsender-Allowlist (numerische Telegram-Benutzer-IDs). `openclaw doctor --fix` kann veraltete `@username`-Einträge zu IDs auflösen. Nicht numerische Einträge werden zur Auth-Zeit ignoriert. Gruppen-Auth verwendet keinen DM-Pairing-Store-Fallback (`2026.2.25+`).
- Präzedenz bei mehreren Konten:
  - Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder fügen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit zu machen.
  - Wenn keines von beiden gesetzt ist, verwendet OpenClaw als Fallback die erste normalisierte Konto-ID, und `openclaw doctor` warnt.
  - `channels.telegram.accounts.default.allowFrom` und `channels.telegram.accounts.default.groupAllowFrom` gelten nur für das Konto `default`.
  - Benannte Konten erben `channels.telegram.allowFrom` und `channels.telegram.groupAllowFrom`, wenn Werte auf Kontoebene nicht gesetzt sind.
  - Benannte Konten erben nicht `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: Standardwerte pro Gruppe + Allowlist (verwenden Sie `"*"` für globale Standardwerte).
  - `channels.telegram.groups.<id>.groupPolicy`: Überschreibung pro Gruppe für `groupPolicy` (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: Standard für Mention-Gating.
  - `channels.telegram.groups.<id>.skills`: Skill-Filter (weggelassen = alle Skills, leer = keine).
  - `channels.telegram.groups.<id>.allowFrom`: Überschreibung der Absender-Allowlist pro Gruppe.
  - `channels.telegram.groups.<id>.systemPrompt`: zusätzlicher System-Prompt für die Gruppe.
  - `channels.telegram.groups.<id>.enabled`: deaktiviert die Gruppe, wenn `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: Überschreibungen pro Topic (Gruppenfelder + Topic-only `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: dieses Topic an einen bestimmten Agenten routen (überschreibt Routing auf Gruppenebene und Binding-Routing).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: Überschreibung pro Topic für `groupPolicy` (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: Überschreibung des Mention-Gatings pro Topic.
- `bindings[]` auf oberster Ebene mit `type: "acp"` und kanonischer Topic-ID `chatId:topic:topicId` in `match.peer.id`: Felder für persistente ACP-Topic-Bindung (siehe [ACP Agents](/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM-Topics an einen bestimmten Agenten routen (gleiches Verhalten wie Forum-Topics).
- `channels.telegram.execApprovals.enabled`: Telegram als chatbasierten Exec-Genehmigungsclient für dieses Konto aktivieren.
- `channels.telegram.execApprovals.approvers`: Telegram-Benutzer-IDs, die Exec-Anfragen genehmigen oder ablehnen dürfen. Optional, wenn `channels.telegram.allowFrom` oder ein direktes `channels.telegram.defaultTo` den Eigentümer bereits identifiziert.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (Standard: `dm`). `channel` und `both` bewahren vorhandene ursprüngliche Telegram-Topics.
- `channels.telegram.execApprovals.agentFilter`: optionaler Agent-ID-Filter für weitergeleitete Genehmigungsaufforderungen.
- `channels.telegram.execApprovals.sessionFilter`: optionaler Sitzungsschlüssel-Filter (Teilzeichenfolge oder Regex) für weitergeleitete Genehmigungsaufforderungen.
- `channels.telegram.accounts.<account>.execApprovals`: Überschreibung pro Konto für Telegram-Exec-Genehmigungsrouting und Approver-Autorisierung.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (Standard: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: Überschreibung pro Konto.
- `channels.telegram.commands.nativeSkills`: Telegram-native Skills-Befehle aktivieren/deaktivieren.
- `channels.telegram.replyToMode`: `off | first | all` (Standard: `off`).
- `channels.telegram.textChunkLimit`: Größe ausgehender Chunks (Zeichen).
- `channels.telegram.chunkMode`: `length` (Standard) oder `newline`, um an Leerzeilen (Absatzgrenzen) zu teilen, bevor nach Länge gechunked wird.
- `channels.telegram.linkPreview`: Link-Vorschauen für ausgehende Nachrichten umschalten (Standard: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (Live-Stream-Vorschau; Standard: `partial`; `progress` wird auf `partial` abgebildet; `block` ist Kompatibilität für den veralteten Vorschaumodus). Die Telegram-Vorschau verwendet eine einzelne Vorschaunachricht, die an Ort und Stelle bearbeitet wird.
- `channels.telegram.mediaMaxMb`: Begrenzung für eingehende/ausgehende Telegram-Medien (MB, Standard: 100).
- `channels.telegram.retry`: Wiederholungsrichtlinie für Telegram-Sendehelfer (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern (Versuche, `minDelayMs`, `maxDelayMs`, `jitter`).
- `channels.telegram.network.autoSelectFamily`: Node-`autoSelectFamily` überschreiben (true=aktivieren, false=deaktivieren). Standardmäßig aktiviert unter Node 22+, bei WSL2 standardmäßig deaktiviert.
- `channels.telegram.network.dnsResultOrder`: DNS-Ergebnisreihenfolge überschreiben (`ipv4first` oder `verbatim`). Standardmäßig `ipv4first` unter Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: gefährliches Opt-in für vertrauenswürdige Fake-IP- oder transparente Proxy-Umgebungen, in denen Telegram-Mediendownloads `api.telegram.org` zu privaten/internen/special-use-Adressen außerhalb des standardmäßigen RFC-2544-Benchmark-Bereichs auflösen.
- `channels.telegram.proxy`: Proxy-URL für Bot-API-Aufrufe (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Webhook-Modus aktivieren (erfordert `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: Webhook-Secret (erforderlich, wenn `webhookUrl` gesetzt ist).
- `channels.telegram.webhookPath`: lokaler Webhook-Pfad (Standard `/telegram-webhook`).
- `channels.telegram.webhookHost`: lokaler Webhook-Bind-Host (Standard `127.0.0.1`).
- `channels.telegram.webhookPort`: lokaler Webhook-Bind-Port (Standard `8787`).
- `channels.telegram.actions.reactions`: Telegram-Tool-Reaktionen steuern.
- `channels.telegram.actions.sendMessage`: Telegram-Tool-Nachrichtensendungen steuern.
- `channels.telegram.actions.deleteMessage`: Telegram-Tool-Nachrichtenlöschungen steuern.
- `channels.telegram.actions.sticker`: Telegram-Sticker-Aktionen steuern — Senden und Suchen (Standard: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — steuert, welche Reaktionen Systemereignisse auslösen (Standard: `own`, wenn nicht gesetzt).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — steuert die Reaktionsfähigkeit des Agenten (Standard: `minimal`, wenn nicht gesetzt).
- `channels.telegram.errorPolicy`: `reply | silent` — steuert das Verhalten von Fehlerantworten (Standard: `reply`). Überschreibungen pro Konto/Gruppe/Topic werden unterstützt.
- `channels.telegram.errorCooldownMs`: Mindest-ms zwischen Fehlerantworten an denselben Chat (Standard: `60000`). Verhindert Fehler-Spam bei Ausfällen.

- [Konfigurationsreferenz - Telegram](/gateway/configuration-reference#telegram)

Telegram-spezifische Felder mit hohem Signal:

- Start/Auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` auf oberster Ebene (`type: "acp"`)
- Exec-Genehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Verwandt

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Security](/gateway/security)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
