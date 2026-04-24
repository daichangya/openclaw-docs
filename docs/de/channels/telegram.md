---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-04-24T06:29:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdd6ea0277e074f90306f91d51fd329c6914de85dde0ae09a731713f1bba98d9
    source_path: channels/telegram.md
    workflow: 15
---

Produktionsreif für Bot-DMs und Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/de/gateway/configuration">
    Vollständige Channel-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffnen Sie Telegram und chatten Sie mit **@BotFather** (prüfen Sie, dass der Handle genau `@BotFather` ist).

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
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfigurieren Sie das Token in config/env und starten Sie dann das Gateway.

  </Step>

  <Step title="Gateway starten und erste DM genehmigen">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing-Codes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Bot zu einer Gruppe hinzufügen">
    Fügen Sie den Bot zu Ihrer Gruppe hinzu und setzen Sie dann `channels.telegram.groups` und `groupPolicy` passend zu Ihrem Zugriffsmodell.
  </Step>
</Steps>

<Note>
Die Token-Auflösungsreihenfolge ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Env-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Einstellungen auf der Telegram-Seite

<AccordionGroup>
  <Accordion title="Privacy Mode und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Privacy Mode**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, gehen Sie wie folgt vor:

    - Deaktivieren Sie den Privacy Mode über `/setprivacy`, oder
    - machen Sie den Bot zu einem Gruppenadministrator.

    Wenn Sie den Privacy Mode umschalten, entfernen Sie den Bot aus jeder Gruppe und fügen Sie ihn erneut hinzu, damit Telegram die Änderung anwendet.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Admin-Status wird in den Telegram-Gruppeneinstellungen gesteuert.

    Admin-Bots empfangen alle Gruppennachrichten, was für ein immer aktives Gruppenverhalten nützlich ist.

  </Accordion>

  <Accordion title="Nützliche BotFather-Umschalter">

    - `/setjoingroups`, um das Hinzufügen zu Gruppen zu erlauben oder zu verweigern
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
    Das Setup fragt nur nach numerischen Benutzer-IDs.
    Wenn Sie ein Upgrade durchgeführt haben und Ihre Konfiguration `@username`-Einträge in der Allowlist enthält, führen Sie `openclaw doctor --fix` aus, um sie aufzulösen (Best Effort; erfordert ein Telegram-Bot-Token).
    Wenn Sie zuvor auf Allowlist-Dateien aus dem Pairing-Store angewiesen waren, kann `openclaw doctor --fix` Einträge in `channels.telegram.allowFrom` für Allowlist-Abläufe wiederherstellen (zum Beispiel wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit nur einem Besitzer bevorzugen Sie `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration erhalten bleibt (statt von früheren Pairing-Genehmigungen abzuhängen).

    Häufiges Missverständnis: Die Genehmigung des DM-Pairings bedeutet nicht „dieser Absender ist überall autorisiert“.
    Pairing gewährt nur DM-Zugriff. Die Autorisierung von Gruppenabsendern kommt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn Sie möchten: „Ich bin einmal autorisiert und sowohl DMs als auch Gruppenbefehle funktionieren“, tragen Sie Ihre numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein.

    ### Ihre Telegram-Benutzer-ID finden

    Sicherer (ohne Drittanbieter-Bot):

    1. Schreiben Sie Ihrem Bot eine DM.
    2. Führen Sie `openclaw logs --follow` aus.
    3. Lesen Sie `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Methode mit Drittanbieter (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen gelten zusammen:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: jede Gruppe kann die Gruppen-ID-Prüfungen bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis Sie `groups`-Einträge (oder `"*"`) hinzufügen
       - `groups` konfiguriert: wirkt als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn es nicht gesetzt ist, greift Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (`telegram:` / `tg:`-Präfixe werden normalisiert).
    Tragen Sie keine Telegram-Gruppen- oder Supergroup-Chat-IDs in `groupAllowFrom` ein. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Autorisierung von Gruppenabsendern übernimmt **nicht** Genehmigungen aus dem DM-Pairing-Store.
    Pairing bleibt nur für DMs. Für Gruppen setzen Sie `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Topic.
    Wenn `groupAllowFrom` nicht gesetzt ist, greift Telegram auf die Konfiguration `allowFrom` zurück, nicht auf den Pairing-Store.
    Praktisches Muster für Bots mit nur einem Besitzer: Setzen Sie Ihre Benutzer-ID in `channels.telegram.allowFrom`, lassen Sie `groupAllowFrom` ungesetzt und erlauben Sie die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, sofern nicht `channels.defaults.groupPolicy` explizit gesetzt ist.

    Beispiel: Jedes Mitglied in einer bestimmten Gruppe erlauben:

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

    Beispiel: Nur bestimmte Benutzer innerhalb einer bestimmten Gruppe erlauben:

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
      Häufiger Fehler: `groupAllowFrom` ist keine Gruppen-Allowlist für Telegram.

      - Legen Sie negative Telegram-Gruppen- oder Supergroup-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Legen Sie Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn Sie einschränken möchten, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwenden Sie `groupAllowFrom: ["*"]` nur, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.
    </Warning>

  </Tab>

  <Tab title="Erwähnungsverhalten">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Eine Erwähnung kann kommen von:

    - einer nativen `@botusername`-Erwähnung, oder
    - Erwähnungsmustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschalter auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungszustand. Verwenden Sie die Konfiguration für Persistenz.

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

    Die Gruppen-Chat-ID abrufen:

    - leiten Sie eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lesen Sie `chat.id` aus `openclaw logs --follow`
    - oder prüfen Sie `getUpdates` der Bot API

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram wird vom Gateway-Prozess verwaltet.
- Das Routing ist deterministisch: Eingehende Telegram-Nachrichten antworten wieder an Telegram (das Modell wählt keine Channel aus).
- Eingehende Nachrichten werden in den gemeinsamen Channel-Umschlag mit Antwortmetadaten und Medien-Platzhaltern normalisiert.
- Gruppensitzungen sind nach Gruppen-ID isoliert. Forum-Topics hängen `:topic:<threadId>` an, damit Topics isoliert bleiben.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw routet sie mit threadbewussten Sitzungsschlüsseln und bewahrt die Thread-ID für Antworten.
- Long Polling verwendet grammY runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Runner-Sink-Parallelität verwendet `agents.defaults.maxConcurrent`.
- Neustarts durch den Long-Polling-Watchdog werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Liveness ausgelöst. Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur, wenn Ihr Deployment weiterhin falsche Polling-Stall-Neustarts bei lang laufender Arbeit sieht. Der Wert ist in Millisekunden angegeben und von `30000` bis `600000` zulässig; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Vorschau des Live-Streams (Nachrichtenbearbeitungen)">
    OpenClaw kann partielle Antworten in Echtzeit streamen:

    - Direktchats: Vorschaunachricht + `editMessageText`
    - Gruppen/Topics: Vorschaunachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` wird auf Telegram auf `partial` abgebildet (Kompatibilität mit channelübergreifender Benennung)
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschaunachricht wiederverwenden (Standard: `true`). Setzen Sie `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.
    - Legacy-`channels.telegram.streamMode` und boolesche `streaming`-Werte werden automatisch zugeordnet

    Für rein textbasierte Antworten:

    - DM: OpenClaw behält dieselbe Vorschaunachricht und führt eine abschließende Bearbeitung direkt aus (keine zweite Nachricht)
    - Gruppe/Topic: OpenClaw behält dieselbe Vorschaunachricht und führt eine abschließende Bearbeitung direkt aus (keine zweite Nachricht)

    Für komplexe Antworten (zum Beispiel Media-Payloads) greift OpenClaw auf die normale finale Zustellung zurück und räumt dann die Vorschaunachricht auf.

    Vorschau-Streaming ist vom Block-Streaming getrennt. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Wenn der native Entwurfstransport nicht verfügbar ist oder abgelehnt wird, greift OpenClaw automatisch auf `sendMessage` + `editMessageText` zurück.

    Nur auf Telegram verfügbarer Reasoning-Stream:

    - `/reasoning stream` sendet das Reasoning während der Generierung an die Live-Vorschau
    - die endgültige Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird in Telegram-sicheres HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Parse-Fehler in Telegram zu reduzieren.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Linkvorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` verarbeitet.

    Standardeinstellungen für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Benutzerdefinierte Einträge für das Befehlsmenü hinzufügen:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git-Sicherung" },
        { command: "generate", description: "Ein Bild erstellen" },
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

    - benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skills-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte/Plugin-Befehle können sich weiterhin registrieren, wenn sie entsprechend konfiguriert sind.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü auch nach dem Kürzen noch überfüllt ist; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet in der Regel, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Gerätepaarungsbefehle (`device-pair` Plugin)

    Wenn das Plugin `device-pair` installiert ist:

    1. `/pair` erzeugt einen Einrichtungscode
    2. fügen Sie den Code in die iOS-App ein
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. genehmigen Sie die Anfrage:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe belässt das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Scopes-Prüfungen sind mit Rollenpräfix versehen, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Rollen, die keine Operatoren sind, benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät es mit geänderten Authentifizierungsdetails erneut versucht (zum Beispiel Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führen Sie vor der Genehmigung erneut `/pair pending` aus.

    Weitere Details: [Pairing](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Geltungsbereiche:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Legacy-`capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

    Beispiel für eine Nachrichtenaktion:

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

    Callback-Klicks werden als Text an den Agenten weitergegeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agenten und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Channel-Nachrichtenaktionen stellen ergonomische Aliasse bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Steuerung über Gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Laufzeit-Sendungen verwenden den aktiven Snapshot von Konfiguration/Secrets (Start/Reload), daher führen Aktionspfade keine ad-hoc-Neuauflösung von SecretRef pro Sendevorgang durch.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Antwort-Threading-Tags">
    Telegram unterstützt explizite Antwort-Threading-Tags in generierter Ausgabe:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Verarbeitung:

    - `off` (Standard)
    - `first`
    - `all`

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forum-Topics und Thread-Verhalten">
    Forum-Supergroups:

    - Sitzungsschlüssel für Topics hängen `:topic:<threadId>` an
    - Antworten und Tippindikatoren zielen auf den Topic-Thread
    - Konfigurationspfad für Topics:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Sonderfall Allgemeines Topic (`threadId=1`):

    - beim Senden von Nachrichten wird `message_thread_id` weggelassen (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Topic-Vererbung: Topic-Einträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` ist nur für Topics und wird nicht von Gruppenvorgaben geerbt.

    **Agenten-Routing pro Topic**: Jedes Topic kann durch Setzen von `agentId` in der Topic-Konfiguration an einen anderen Agenten weiterleiten. So erhält jedes Topic seinen eigenen isolierten Workspace, Memory und seine eigene Sitzung. Beispiel:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Allgemeines Topic → Hauptagent
                "3": { agentId: "zu" },        // Dev-Topic → Agent zu
                "5": { agentId: "coder" }      // Code-Review → Agent coder
              }
            }
          }
        }
      }
    }
    ```

    Jedes Topic hat dann seinen eigenen Sitzungsschlüssel: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistente ACP-Topic-Bindung**: Forum-Topics können ACP-Harness-Sitzungen über typisierte ACP-Bindungen auf oberster Ebene anheften (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` sowie einer Topic-qualifizierten ID wie `-1001234567890:topic:42`). Derzeit auf Forum-Topics in Gruppen/Supergroups beschränkt. Siehe [ACP Agents](/de/tools/acp-agents).

    **Thread-gebundener ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Topic an eine neue ACP-Sitzung; Folgeaktionen werden direkt dorthin geroutet. OpenClaw pinnt die Spawn-Bestätigung im Topic. Erfordert `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten das DM-Routing bei, verwenden aber threadbewusste Sitzungsschlüssel.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnotizen und Audiodateien.

    - Standard: Verhalten als Audiodatei
    - Tag `[[audio_as_voice]]` in der Agentenantwort, um das Senden als Sprachnotiz zu erzwingen

    Beispiel für eine Nachrichtenaktion:

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

    Telegram unterscheidet zwischen Videodateien und Video-Notizen.

    Beispiel für eine Nachrichtenaktion:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video-Notizen unterstützen keine Beschriftungen; angegebener Nachrichtentext wird separat gesendet.

    ### Sticker

    Verarbeitung eingehender Sticker:

    - statisches WEBP: wird heruntergeladen und verarbeitet (Platzhalter `<media:sticker>`)
    - animiertes TGS: wird übersprungen
    - Video-WEBM: wird übersprungen

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

    Sticker-Aktion zum Senden:

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

  <Accordion title="Benachrichtigungen über Reaktionen">
    Telegram-Reaktionen kommen als Updates vom Typ `message_reaction` an (getrennt von Nachrichten-Payloads).

    Wenn aktiviert, reiht OpenClaw Systemereignisse ein wie:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguration:

    - `channels.telegram.reactionNotifications`: `off | own | all` (Standard: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (Standard: `minimal`)

    Hinweise:

    - `own` bedeutet nur Benutzerreaktionen auf vom Bot gesendete Nachrichten (Best Effort über den Cache gesendeter Nachrichten).
    - Reaktionsereignisse beachten weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram liefert in Reaktions-Updates keine Thread-IDs.
      - Nicht-Forum-Gruppen werden an die Gruppenchatsitzung geroutet
      - Forum-Gruppen werden an die Gruppensitzung des allgemeinen Topics (`:topic:1`) geroutet, nicht an das genaue ursprüngliche Topic

    `allowed_updates` für Polling/Webhook enthalten `message_reaction` automatisch.

  </Accordion>

  <Accordion title="Ack-Reaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Emoji-Fallback aus der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwenden Sie `""`, um die Reaktion für einen Channel oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge in die Channel-Konfiguration sind standardmäßig aktiviert (`configWrites !== false`).

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

  <Accordion title="Long Polling vs. Webhook">
    Standard ist Long Polling. Für den Webhook-Modus setzen Sie `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret`; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress schalten Sie entweder einen Reverse Proxy vor den lokalen Port oder setzen absichtlich `webhookHost: "0.0.0.0"`.

  </Accordion>

  <Accordion title="Limits, Retry und CLI-Ziele">
    - Der Standardwert für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor einer Aufteilung nach Länge.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der grammY-Standard).
    - `channels.telegram.pollingStallThresholdMs` hat standardmäßig den Wert `120000`; passen Sie ihn nur zwischen `30000` und `600000` an, um falsch positive Polling-Stall-Neustarts zu beheben.
    - Der Verlauf des Gruppenkontexts verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext aus Antworten/Zitaten/Weiterleitungen wird derzeit unverändert weitergegeben.
    - Telegram-Allowlists steuern in erster Linie, wer den Agenten auslösen kann, nicht eine vollständige Grenze zur Schwärzung von Zusatzkontext.
    - Steuerungen für den DM-Verlauf:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern.

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

    Nur für Telegram verfügbare Umfrage-Flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` für Forum-Topics (oder ein `:topic:`-Ziel verwenden)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften kann
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Foto- oder animierte Medien-Uploads zu senden

    Aktions-Gating:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Umfragen
    - `channels.telegram.actions.poll=false` deaktiviert das Erstellen von Telegram-Umfragen, während reguläre Sendungen aktiviert bleiben

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Approver-DMs und kann Aufforderungen optional im ursprünglichen Chat oder Topic posten. Approver müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (wird automatisch aktiviert, wenn mindestens ein Approver auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (greift auf numerische Eigentümer-IDs aus `allowFrom` / `defaultTo` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Bei Channel-Zustellung wird der Befehlstext im Chat angezeigt; aktivieren Sie `channel` oder `both` nur in vertrauenswürdigen Gruppen/Topics. Wenn die Aufforderung in einem Forum-Topic landet, bewahrt OpenClaw das Topic für die Genehmigungsaufforderung und die Folgeaktion. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche erlaubt (`dm`, `group` oder `all`). Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerung von Fehlerantworten

Wenn beim Agenten ein Zustellungs- oder Anbieterfehler auftritt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                          |
| ----------------------------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine freundliche Fehlermeldung an den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam bei Ausfällen.        |

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
  <Accordion title="Bot antwortet nicht auf Gruppennachrichten ohne Erwähnung">

    - Wenn `requireMention=false`, muss der Telegram-Privacy-Mode vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Deaktivieren
      - dann Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Erwähnung erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; der Platzhalter `"*"` kann nicht per Mitgliedschaft geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht Gruppennachrichten überhaupt nicht">

    - wenn `channels.telegram.groups` existiert, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - prüfen Sie die Bot-Mitgliedschaft in der Gruppe
    - prüfen Sie die Logs: `openclaw logs --follow` auf Gründe für das Überspringen

  </Accordion>

  <Accordion title="Befehle funktionieren nur teilweise oder gar nicht">

    - autorisieren Sie Ihre Absenderidentität (Pairing und/oder numerisches `allowFrom`)
    - die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduzieren Sie Plugin-/Skills-/benutzerdefinierte Befehle oder deaktivieren Sie native Menüs
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern weist normalerweise auf DNS-/HTTPS-Erreichbarkeitsprobleme zu `api.telegram.org` hin

  </Accordion>

  <Accordion title="Polling- oder Netzwerk-Instabilität">

    - Node 22+ + benutzerdefiniertes fetch/Proxy kann sofortiges Abbruchverhalten auslösen, wenn `AbortSignal`-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst auf IPv6 auf; fehlerhafter IPv6-Egress kann zu sporadischen Telegram-API-Fehlern führen.
    - Wenn die Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, versucht OpenClaw diese jetzt als behebbare Netzwerkfehler erneut.
    - Wenn die Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - Erhöhen Sie `channels.telegram.pollingStallThresholdMs` nur dann, wenn lang laufende `getUpdates`-Aufrufe fehlerfrei sind, Ihr Host aber weiterhin falsche Polling-Stall-Neustarts meldet. Anhaltende Stalls weisen normalerweise auf Proxy-, DNS-, IPv6- oder TLS-Egress-Probleme zwischen dem Host und `api.telegram.org` hin.
    - Auf VPS-Hosts mit instabilem direktem Egress/TLS leiten Sie Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2) und `dnsResultOrder=ipv4first`.
    - Wenn Ihr Host WSL2 ist oder explizit besser mit reinem IPv4-Verhalten funktioniert, erzwingen Sie die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmarkbereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` bei Mediendownloads auf eine andere private/interne/Special-Use-Adresse umschreibt, können Sie den nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dieselbe Aktivierung ist pro Konto verfügbar unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Wenn Ihr Proxy Telegram-Media-Hosts in `198.18.x.x` auflöst, lassen Sie das gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-Benchmarkbereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt den SSRF-Schutz für Telegram-Medien. Verwenden Sie dies nur in vertrauenswürdigen, vom Operator kontrollierten Proxy-Umgebungen wie Clash, Mihomo oder Surge mit Fake-IP-Routing, wenn diese private oder Special-Use-Antworten außerhalb des RFC-2544-Benchmarkbereichs synthetisieren. Lassen Sie es für normalen öffentlichen Telegram-Internetzugriff deaktiviert.
    </Warning>

    - Umgebungsüberschreibungen (temporär):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS-Antworten prüfen:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Weitere Hilfe: [Channel troubleshooting](/de/channels/troubleshooting).

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Telegram](/de/gateway/config-channels#telegram).

<Accordion title="Wichtige Telegram-Felder">

- Start/Auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, oberste Ebene `bindings[]` (`type: "acp"`)
- Exec-Genehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehl/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Fähigkeiten: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorität bei mehreren Konten: Wenn zwei oder mehr Konto-IDs konfiguriert sind, setzen Sie `channels.telegram.defaultAccount` (oder fügen Sie `channels.telegram.accounts.default` ein), um das Standard-Routing explizit festzulegen. Andernfalls greift OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` gibt eine Warnung aus. Benannte Konten erben `channels.telegram.allowFrom` / `groupAllowFrom`, aber keine Werte aus `accounts.default.*`.
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Einen Telegram-Benutzer mit dem Gateway koppeln.
  </Card>
  <Card title="Groups" icon="users" href="/de/channels/groups">
    Verhalten von Gruppen- und Topic-Allowlists.
  </Card>
  <Card title="Channel routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
  </Card>
  <Card title="Security" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/de/concepts/multi-agent">
    Gruppen und Topics Agenten zuordnen.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnose.
  </Card>
</CardGroup>
