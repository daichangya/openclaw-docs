---
read_when:
    - Arbeiten an Telegram-Funktionen oder Webhooks
summary: Status, Funktionen und Konfiguration der Telegram-Bot-Unterstützung
title: Telegram
x-i18n:
    generated_at: "2026-04-23T13:58:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: produktionsreif für Bot-DMs + Gruppen über grammY. Long Polling ist der Standardmodus; der Webhook-Modus ist optional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für Telegram ist Pairing.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnell einrichten

<Steps>
  <Step title="Bot-Token in BotFather erstellen">
    Öffne Telegram und chatte mit **@BotFather** (prüfe, dass der Handle genau `@BotFather` ist).

    Führe `/newbot` aus, folge den Eingabeaufforderungen und speichere das Token.

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

    Umgebungsvariablen-Fallback: `TELEGRAM_BOT_TOKEN=...` (nur Standardkonto).
    Telegram verwendet **nicht** `openclaw channels login telegram`; konfiguriere das Token in config/env und starte dann das Gateway.

  </Step>

  <Step title="Gateway starten und erste DM freigeben">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing-Codes laufen nach 1 Stunde ab.

  </Step>

  <Step title="Bot zu einer Gruppe hinzufügen">
    Füge den Bot zu deiner Gruppe hinzu und setze dann `channels.telegram.groups` und `groupPolicy` passend zu deinem Zugriffsmodell.
  </Step>
</Steps>

<Note>
Die Auflösungsreihenfolge für Tokens ist kontobewusst. In der Praxis haben Konfigurationswerte Vorrang vor dem Umgebungsvariablen-Fallback, und `TELEGRAM_BOT_TOKEN` gilt nur für das Standardkonto.
</Note>

## Einstellungen auf der Telegram-Seite

<AccordionGroup>
  <Accordion title="Datenschutzmodus und Gruppensichtbarkeit">
    Telegram-Bots verwenden standardmäßig den **Datenschutzmodus**, der einschränkt, welche Gruppennachrichten sie empfangen.

    Wenn der Bot alle Gruppennachrichten sehen muss, dann entweder:

    - deaktiviere den Datenschutzmodus über `/setprivacy`, oder
    - mache den Bot zum Gruppenadministrator.

    Wenn du den Datenschutzmodus umschaltest, entferne den Bot aus jeder Gruppe und füge ihn erneut hinzu, damit Telegram die Änderung übernimmt.

  </Accordion>

  <Accordion title="Gruppenberechtigungen">
    Der Administratorstatus wird in den Telegram-Gruppeneinstellungen gesteuert.

    Administrator-Bots empfangen alle Gruppennachrichten, was für Always-on-Verhalten in Gruppen nützlich ist.

  </Accordion>

  <Accordion title="Hilfreiche BotFather-Schalter">

    - `/setjoingroups`, um das Hinzufügen zu Gruppen zu erlauben/verbieten
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
    Wenn du ein Upgrade durchgeführt hast und deine Konfiguration `@username`-Einträge in der Allowlist enthält, führe `openclaw doctor --fix` aus, um sie aufzulösen (Best Effort; erfordert ein Telegram-Bot-Token).
    Wenn du dich zuvor auf Allowlist-Dateien aus dem Pairing-Store verlassen hast, kann `openclaw doctor --fix` Einträge in Allowlist-Flows nach `channels.telegram.allowFrom` wiederherstellen (zum Beispiel, wenn `dmPolicy: "allowlist"` noch keine expliziten IDs hat).

    Für Bots mit nur einem Besitzer ist `dmPolicy: "allowlist"` mit expliziten numerischen `allowFrom`-IDs zu bevorzugen, damit die Zugriffsrichtlinie dauerhaft in der Konfiguration bleibt (statt von früheren Pairing-Freigaben abzuhängen).

    Häufiges Missverständnis: Die Freigabe des DM-Pairings bedeutet nicht „dieser Absender ist überall autorisiert“.
    Pairing gewährt nur DM-Zugriff. Die Autorisierung von Gruppenabsendern stammt weiterhin aus expliziten Konfigurations-Allowlists.
    Wenn du möchtest, dass „ich einmal autorisiert bin und sowohl DMs als auch Gruppenbefehle funktionieren“, trage deine numerische Telegram-Benutzer-ID in `channels.telegram.allowFrom` ein.

    ### So findest du deine Telegram-Benutzer-ID

    Sicherer (kein Drittanbieter-Bot):

    1. Schreibe deinem Bot per DM.
    2. Führe `openclaw logs --follow` aus.
    3. Lies `from.id`.

    Offizielle Bot-API-Methode:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Methode über Drittanbieter (weniger privat): `@userinfobot` oder `@getidsbot`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Zwei Steuerungen wirken zusammen:

    1. **Welche Gruppen erlaubt sind** (`channels.telegram.groups`)
       - keine `groups`-Konfiguration:
         - mit `groupPolicy: "open"`: jede Gruppe kann die Gruppen-ID-Prüfung bestehen
         - mit `groupPolicy: "allowlist"` (Standard): Gruppen werden blockiert, bis du `groups`-Einträge (oder `"*"`) hinzufügst
       - `groups` konfiguriert: wirkt als Allowlist (explizite IDs oder `"*"`)

    2. **Welche Absender in Gruppen erlaubt sind** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (Standard)
       - `disabled`

    `groupAllowFrom` wird für die Filterung von Gruppenabsendern verwendet. Wenn es nicht gesetzt ist, fällt Telegram auf `allowFrom` zurück.
    `groupAllowFrom`-Einträge sollten numerische Telegram-Benutzer-IDs sein (Präfixe `telegram:` / `tg:` werden normalisiert).
    Trage keine Telegram-Gruppen- oder Supergroup-Chat-IDs in `groupAllowFrom` ein. Negative Chat-IDs gehören unter `channels.telegram.groups`.
    Nicht numerische Einträge werden für die Absenderautorisierung ignoriert.
    Sicherheitsgrenze (`2026.2.25+`): Die Gruppenabsender-Authentifizierung übernimmt **nicht** Freigaben aus dem DM-Pairing-Store.
    Pairing bleibt nur für DMs. Für Gruppen setze `groupAllowFrom` oder `allowFrom` pro Gruppe/pro Thema.
    Wenn `groupAllowFrom` nicht gesetzt ist, fällt Telegram auf `allowFrom` aus der Konfiguration zurück, nicht auf den Pairing-Store.
    Praktisches Muster für Bots mit nur einem Besitzer: Setze deine Benutzer-ID in `channels.telegram.allowFrom`, lasse `groupAllowFrom` ungesetzt und erlaube die Zielgruppen unter `channels.telegram.groups`.
    Laufzeithinweis: Wenn `channels.telegram` vollständig fehlt, verwendet die Laufzeit standardmäßig fail-closed `groupPolicy="allowlist"`, es sei denn, `channels.defaults.groupPolicy` ist explizit gesetzt.

    Beispiel: beliebiges Mitglied in genau einer bestimmten Gruppe erlauben:

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

    Beispiel: nur bestimmte Benutzer innerhalb einer bestimmten Gruppe erlauben:

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

      - Lege negative Telegram-Gruppen- oder Supergroup-Chat-IDs wie `-1001234567890` unter `channels.telegram.groups` ab.
      - Lege Telegram-Benutzer-IDs wie `8734062810` unter `groupAllowFrom` ab, wenn du einschränken möchtest, welche Personen innerhalb einer erlaubten Gruppe den Bot auslösen können.
      - Verwende `groupAllowFrom: ["*"]` nur, wenn jedes Mitglied einer erlaubten Gruppe mit dem Bot sprechen können soll.
    </Warning>

  </Tab>

  <Tab title="Mention-Verhalten">
    Antworten in Gruppen erfordern standardmäßig eine Mention.

    Eine Mention kann kommen von:

    - nativer Mention `@botusername`, oder
    - Mention-Mustern in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Befehlsumschalter auf Sitzungsebene:

    - `/activation always`
    - `/activation mention`

    Diese aktualisieren nur den Sitzungsstatus. Verwende die Konfiguration für dauerhafte Einstellungen.

    Beispiel für dauerhafte Konfiguration:

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

    So erhältst du die Gruppen-Chat-ID:

    - leite eine Gruppennachricht an `@userinfobot` / `@getidsbot` weiter
    - oder lies `chat.id` aus `openclaw logs --follow`
    - oder prüfe Bot-API-`getUpdates`

  </Tab>
</Tabs>

## Laufzeitverhalten

- Telegram wird vom Gateway-Prozess verwaltet.
- Das Routing ist deterministisch: Eingehende Telegram-Antworten gehen zurück an Telegram (das Modell wählt keine Kanäle aus).
- Eingehende Nachrichten werden in das gemeinsame Kanal-Envelope mit Antwortmetadaten und Medienplatzhaltern normalisiert.
- Gruppensitzungen werden nach Gruppen-ID isoliert. Forenthemen hängen `:topic:<threadId>` an, um Themen getrennt zu halten.
- DM-Nachrichten können `message_thread_id` enthalten; OpenClaw routet sie mit threadbewussten Sitzungsschlüsseln und behält die Thread-ID für Antworten bei.
- Long Polling verwendet grammY runner mit Sequenzierung pro Chat/pro Thread. Die gesamte Sink-Konkurrenz des Runners verwendet `agents.defaults.maxConcurrent`.
- Neustarts des Long-Polling-Watchdogs werden standardmäßig nach 120 Sekunden ohne abgeschlossene `getUpdates`-Lebendigkeit ausgelöst. Erhöhe `channels.telegram.pollingStallThresholdMs` nur, wenn deine Bereitstellung weiterhin fälschliche Neustarts wegen Polling-Stillstand während lang laufender Arbeit sieht. Der Wert ist in Millisekunden angegeben und darf zwischen `30000` und `600000` liegen; Überschreibungen pro Konto werden unterstützt.
- Die Telegram Bot API unterstützt keine Lesebestätigungen (`sendReadReceipts` gilt nicht).

## Funktionsreferenz

<AccordionGroup>
  <Accordion title="Live-Streaming-Vorschau (Nachrichtenbearbeitungen)">
    OpenClaw kann partielle Antworten in Echtzeit streamen:

    - Direktchats: Vorschau-Nachricht + `editMessageText`
    - Gruppen/Themen: Vorschau-Nachricht + `editMessageText`

    Voraussetzung:

    - `channels.telegram.streaming` ist `off | partial | block | progress` (Standard: `partial`)
    - `progress` wird auf Telegram auf `partial` abgebildet (Kompatibilität mit kanalübergreifender Benennung)
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe bearbeitete Vorschau-Nachricht wiederverwenden (Standard: `true`). Setze `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.
    - Veraltete Werte `channels.telegram.streamMode` und boolesche `streaming`-Werte werden automatisch zugeordnet

    Für reine Textantworten:

    - DM: OpenClaw behält dieselbe Vorschau-Nachricht und führt eine abschließende Bearbeitung direkt darin aus (keine zweite Nachricht)
    - Gruppe/Thema: OpenClaw behält dieselbe Vorschau-Nachricht und führt eine abschließende Bearbeitung direkt darin aus (keine zweite Nachricht)

    Für komplexe Antworten (zum Beispiel Medien-Payloads) fällt OpenClaw auf die normale endgültige Zustellung zurück und bereinigt dann die Vorschau-Nachricht.

    Vorschau-Streaming ist getrennt von Block-Streaming. Wenn Block-Streaming für Telegram explizit aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

    Wenn der native Entwurfs-Transport nicht verfügbar ist oder abgelehnt wird, fällt OpenClaw automatisch auf `sendMessage` + `editMessageText` zurück.

    Nur für Telegram verfügbarer Reasoning-Stream:

    - `/reasoning stream` sendet Reasoning während der Generierung an die Live-Vorschau
    - die endgültige Antwort wird ohne Reasoning-Text gesendet

  </Accordion>

  <Accordion title="Formatierung und HTML-Fallback">
    Ausgehender Text verwendet Telegram `parse_mode: "HTML"`.

    - Markdown-ähnlicher Text wird in Telegram-sicheres HTML gerendert.
    - Rohes Modell-HTML wird escaped, um Telegram-Parse-Fehler zu verringern.
    - Wenn Telegram geparstes HTML ablehnt, versucht OpenClaw es erneut als Klartext.

    Linkvorschauen sind standardmäßig aktiviert und können mit `channels.telegram.linkPreview: false` deaktiviert werden.

  </Accordion>

  <Accordion title="Native Befehle und benutzerdefinierte Befehle">
    Die Registrierung des Telegram-Befehlsmenüs wird beim Start mit `setMyCommands` verarbeitet.

    Standardwerte für native Befehle:

    - `commands.native: "auto"` aktiviert native Befehle für Telegram

    Benutzerdefinierte Einträge für das Befehlsmenü hinzufügen:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git-Backup" },
        { command: "generate", description: "Ein Bild erstellen" },
      ],
    },
  },
}
```

    Regeln:

    - Namen werden normalisiert (führendes `/` entfernen, Kleinschreibung)
    - gültiges Muster: `a-z`, `0-9`, `_`, Länge `1..32`
    - benutzerdefinierte Befehle können native Befehle nicht überschreiben
    - Konflikte/Duplikate werden übersprungen und protokolliert

    Hinweise:

    - Benutzerdefinierte Befehle sind nur Menüeinträge; sie implementieren kein Verhalten automatisch
    - Plugin-/Skill-Befehle können weiterhin funktionieren, wenn sie eingegeben werden, auch wenn sie nicht im Telegram-Menü angezeigt werden

    Wenn native Befehle deaktiviert sind, werden integrierte Befehle entfernt. Benutzerdefinierte Plugin-Befehle können bei entsprechender Konfiguration weiterhin registriert werden.

    Häufige Einrichtungsfehler:

    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das Telegram-Menü auch nach dem Kürzen noch überfüllt ist; reduziere Plugin-/Skill-/benutzerdefinierte Befehle oder deaktiviere `channels.telegram.commands.native`.
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern bedeutet normalerweise, dass ausgehendes DNS/HTTPS zu `api.telegram.org` blockiert ist.

    ### Device-Pairing-Befehle (`device-pair`-Plugin)

    Wenn das `device-pair`-Plugin installiert ist:

    1. `/pair` erzeugt einen Einrichtungscode
    2. Code in die iOS-App einfügen
    3. `/pair pending` listet ausstehende Anfragen auf (einschließlich Rolle/Scopes)
    4. Anfrage genehmigen:
       - `/pair approve <requestId>` für explizite Genehmigung
       - `/pair approve`, wenn es nur eine ausstehende Anfrage gibt
       - `/pair approve latest` für die neueste Anfrage

    Der Einrichtungscode enthält ein kurzlebiges Bootstrap-Token. Die integrierte Bootstrap-Übergabe hält das primäre Node-Token bei `scopes: []`; jedes übergebene Operator-Token bleibt auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt. Bootstrap-Umfangsprüfungen sind mit einem Rollenpräfix versehen, sodass diese Operator-Allowlist nur Operator-Anfragen erfüllt; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Wenn ein Gerät mit geänderten Auth-Details erneut versucht wird (zum Beispiel Rolle/Scopes/Public Key), wird die vorherige ausstehende Anfrage ersetzt und die neue Anfrage verwendet eine andere `requestId`. Führe `/pair pending` vor der Genehmigung erneut aus.

    Weitere Details: [Pairing](/de/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline-Schaltflächen">
    Scope für die Inline-Tastatur konfigurieren:

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

    Scopes:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (Standard)

    Das veraltete `capabilities: ["inlineButtons"]` wird auf `inlineButtons: "all"` abgebildet.

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

    Callback-Klicks werden als Text an den Agent weitergegeben:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram-Nachrichtenaktionen für Agents und Automatisierung">
    Telegram-Tool-Aktionen umfassen:

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Kanal-Nachrichtenaktionen stellen ergonomische Aliase bereit (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Steuerungen für das Gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (Standard: deaktiviert)

    Hinweis: `edit` und `topic-create` sind derzeit standardmäßig aktiviert und haben keine separaten `channels.telegram.actions.*`-Schalter.
    Laufzeit-Sendungen verwenden den aktiven Snapshot von Konfiguration/Secrets (Start/Reload), daher führen Aktionspfade keine ad-hoc-Neuauflösung von SecretRef pro Sendung durch.

    Semantik zum Entfernen von Reaktionen: [/tools/reactions](/de/tools/reactions)

  </Accordion>

  <Accordion title="Reply-Threading-Tags">
    Telegram unterstützt explizite Reply-Threading-Tags in generierten Ausgaben:

    - `[[reply_to_current]]` antwortet auf die auslösende Nachricht
    - `[[reply_to:<id>]]` antwortet auf eine bestimmte Telegram-Nachrichten-ID

    `channels.telegram.replyToMode` steuert die Behandlung:

    - `off` (Standard)
    - `first`
    - `all`

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

  </Accordion>

  <Accordion title="Forenthemen und Thread-Verhalten">
    Forum-Supergruppen:

    - Topic-Sitzungsschlüssel hängen `:topic:<threadId>` an
    - Antworten und Tippanzeigen zielen auf den Topic-Thread
    - Topic-Konfigurationspfad:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Spezialfall Allgemeines Thema (`threadId=1`):

    - Nachrichtensendungen lassen `message_thread_id` weg (Telegram lehnt `sendMessage(...thread_id=1)` ab)
    - Tippaktionen enthalten weiterhin `message_thread_id`

    Topic-Vererbung: Topic-Einträge erben Gruppeneinstellungen, sofern sie nicht überschrieben werden (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` gilt nur für Topics und wird nicht aus Gruppenstandards geerbt.

    **Agent-Routing pro Topic**: Jedes Topic kann durch Setzen von `agentId` in der Topic-Konfiguration an einen anderen Agent weitergeleitet werden. Dadurch erhält jedes Topic seinen eigenen isolierten Workspace, Speicher und seine eigene Sitzung. Beispiel:

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

    **Persistente ACP-Topic-Bindung**: Forenthemen können ACP-Harness-Sitzungen über typisierte ACP-Bindungen auf oberster Ebene anheften (`bindings[]` mit `type: "acp"` und `match.channel: "telegram"`, `peer.kind: "group"` und einer Topic-qualifizierten ID wie `-1001234567890:topic:42`). Aktuell auf Forenthemen in Gruppen/Supergruppen beschränkt. Siehe [ACP-Agents](/de/tools/acp-agents).

    **Thread-gebundenes ACP-Spawn aus dem Chat**: `/acp spawn <agent> --thread here|auto` bindet das aktuelle Topic an eine neue ACP-Sitzung; Folgeaktionen werden direkt dorthin geleitet. OpenClaw pinnt die Spawn-Bestätigung im Topic. Erfordert `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Der Template-Kontext stellt `MessageThreadId` und `IsForum` bereit. DM-Chats mit `message_thread_id` behalten das DM-Routing bei, verwenden aber threadbewusste Sitzungsschlüssel.

  </Accordion>

  <Accordion title="Audio, Video und Sticker">
    ### Audionachrichten

    Telegram unterscheidet zwischen Sprachnotizen und Audiodateien.

    - Standard: Verhalten für Audiodateien
    - Tag `[[audio_as_voice]]` in der Agent-Antwort erzwingt das Senden als Sprachnotiz

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

    Telegram unterscheidet zwischen Videodateien und Videonotizen.

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

    Videonotizen unterstützen keine Bildunterschriften; bereitgestellter Nachrichtentext wird separat gesendet.

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
    - Reaktionsereignisse respektieren weiterhin die Telegram-Zugriffskontrollen (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nicht autorisierte Absender werden verworfen.
    - Telegram liefert in Reaktions-Updates keine Thread-IDs.
      - Nicht-Forum-Gruppen werden an die Gruppenchat-Sitzung geleitet
      - Forum-Gruppen werden an die Sitzung des allgemeinen Gruppenthemas (`:topic:1`) geleitet, nicht an das genaue Ursprungsthema

    `allowed_updates` für Polling/Webhook enthalten `message_reaction` automatisch.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Identitäts-Emoji des Agenten (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Telegram erwartet Unicode-Emoji (zum Beispiel "👀").
    - Verwende `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge aus Telegram-Ereignissen und -Befehlen">
    Schreibvorgänge in die Kanalkonfiguration sind standardmäßig aktiviert (`configWrites !== false`).

    Zu Telegram ausgelöste Schreibvorgänge gehören:

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
    Standard ist Long Polling. Für den Webhook-Modus setze `channels.telegram.webhookUrl` und `channels.telegram.webhookSecret`; optional `webhookPath`, `webhookHost`, `webhookPort` (Standardwerte `/telegram-webhook`, `127.0.0.1`, `8787`).

    Der lokale Listener bindet an `127.0.0.1:8787`. Für öffentlichen Ingress entweder einen Reverse Proxy vor den lokalen Port setzen oder bewusst `webhookHost: "0.0.0.0"` festlegen.

  </Accordion>

  <Accordion title="Limits, Wiederholungen und CLI-Ziele">
    - Standardwert für `channels.telegram.textChunkLimit` ist 4000.
    - `channels.telegram.chunkMode="newline"` bevorzugt Absatzgrenzen (Leerzeilen) vor einer Aufteilung nach Länge.
    - `channels.telegram.mediaMaxMb` (Standard 100) begrenzt die Größe eingehender und ausgehender Telegram-Medien.
    - `channels.telegram.timeoutSeconds` überschreibt das Timeout des Telegram-API-Clients (wenn nicht gesetzt, gilt der Standard von grammY).
    - `channels.telegram.pollingStallThresholdMs` hat standardmäßig den Wert `120000`; nur bei falsch-positiven Neustarts wegen Polling-Stillstand auf Werte zwischen `30000` und `600000` anpassen.
    - Der Kontextverlauf von Gruppen verwendet `channels.telegram.historyLimit` oder `messages.groupChat.historyLimit` (Standard 50); `0` deaktiviert ihn.
    - Zusätzlicher Kontext für Antworten/Zitate/Weiterleitungen wird derzeit unverändert weitergegeben.
    - Telegram-Allowlists steuern in erster Linie, wer den Agent auslösen kann, nicht eine vollständige Redaktionsgrenze für zusätzlichen Kontext.
    - Verlaufssteuerungen für DMs:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Die Konfiguration `channels.telegram.retry` gilt für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern.

    Das CLI-Sendeziel kann eine numerische Chat-ID oder ein Benutzername sein:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram-Umfragen verwenden `openclaw message poll` und unterstützen Forenthemen:

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
    - `--thread-id` für Forenthemen (oder ein Ziel mit `:topic:` verwenden)

    Telegram-Senden unterstützt außerdem:

    - `--presentation` mit `buttons`-Blöcken für Inline-Tastaturen, wenn `channels.telegram.capabilities.inlineButtons` dies für die Oberfläche erlaubt
    - `--pin` oder `--delivery '{"pin":true}'`, um angeheftete Zustellung anzufordern, wenn der Bot in diesem Chat anheften darf
    - `--force-document`, um ausgehende Bilder und GIFs als Dokumente statt als komprimierte Foto- oder animierte Medien-Uploads zu senden

    Aktions-Gating:

    - `channels.telegram.actions.sendMessage=false` deaktiviert ausgehende Telegram-Nachrichten, einschließlich Umfragen
    - `channels.telegram.actions.poll=false` deaktiviert die Erstellung von Telegram-Umfragen, während normale Sendungen aktiviert bleiben

  </Accordion>

  <Accordion title="Exec-Genehmigungen in Telegram">
    Telegram unterstützt Exec-Genehmigungen in Approver-DMs und kann Eingabeaufforderungen optional im auslösenden Chat oder Topic posten. Approver müssen numerische Telegram-Benutzer-IDs sein.

    Konfigurationspfad:

    - `channels.telegram.execApprovals.enabled` (wird automatisch aktiviert, wenn mindestens ein Approver auflösbar ist)
    - `channels.telegram.execApprovals.approvers` (fällt auf numerische Besitzer-IDs aus `allowFrom` / `defaultTo` zurück)
    - `channels.telegram.execApprovals.target`: `dm` (Standard) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Die Zustellung an den Kanal zeigt den Befehlstext im Chat an; aktiviere `channel` oder `both` nur in vertrauenswürdigen Gruppen/Topics. Wenn die Eingabeaufforderung in einem Forenthema landet, behält OpenClaw das Topic für die Genehmigungsaufforderung und die Folgeaktion bei. Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Inline-Genehmigungsschaltflächen erfordern außerdem, dass `channels.telegram.capabilities.inlineButtons` die Zieloberfläche erlaubt (`dm`, `group` oder `all`). Genehmigungs-IDs mit dem Präfix `plugin:` werden über Plugin-Genehmigungen aufgelöst; andere werden zuerst über Exec-Genehmigungen aufgelöst.

    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Steuerungen für Fehlerantworten

Wenn beim Agent ein Zustell- oder Providerfehler auftritt, kann Telegram entweder mit dem Fehlertext antworten oder ihn unterdrücken. Zwei Konfigurationsschlüssel steuern dieses Verhalten:

| Schlüssel                           | Werte             | Standard | Beschreibung                                                                                     |
| ----------------------------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`  | `reply` sendet eine benutzerfreundliche Fehlermeldung in den Chat. `silent` unterdrückt Fehlerantworten vollständig. |
| `channels.telegram.errorCooldownMs` | Zahl (ms)         | `60000`  | Mindestzeit zwischen Fehlerantworten an denselben Chat. Verhindert Fehler-Spam während Ausfällen. |

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
  <Accordion title="Bot antwortet nicht auf Gruppen-Nachrichten ohne Mention">

    - Wenn `requireMention=false`, muss der Datenschutzmodus von Telegram vollständige Sichtbarkeit erlauben.
      - BotFather: `/setprivacy` -> Disable
      - dann Bot aus der Gruppe entfernen und erneut hinzufügen
    - `openclaw channels status` warnt, wenn die Konfiguration Gruppennachrichten ohne Mention erwartet.
    - `openclaw channels status --probe` kann explizite numerische Gruppen-IDs prüfen; Wildcard `"*"` kann nicht per Mitgliedschaft geprüft werden.
    - schneller Sitzungstest: `/activation always`.

  </Accordion>

  <Accordion title="Bot sieht Gruppennachrichten überhaupt nicht">

    - wenn `channels.telegram.groups` existiert, muss die Gruppe aufgeführt sein (oder `"*"` enthalten)
    - Bot-Mitgliedschaft in der Gruppe überprüfen
    - Logs prüfen: `openclaw logs --follow` für Gründe des Überspringens

  </Accordion>

  <Accordion title="Befehle funktionieren teilweise oder gar nicht">

    - autorisiere deine Absenderidentität (Pairing und/oder numerisches `allowFrom`)
    - die Befehlsautorisierung gilt weiterhin, auch wenn die Gruppenrichtlinie `open` ist
    - `setMyCommands failed` mit `BOT_COMMANDS_TOO_MUCH` bedeutet, dass das native Menü zu viele Einträge hat; reduziere Plugin-/Skill-/benutzerdefinierte Befehle oder deaktiviere native Menüs
    - `setMyCommands failed` mit Netzwerk-/Fetch-Fehlern weist normalerweise auf Probleme bei der Erreichbarkeit von `api.telegram.org` über DNS/HTTPS hin

  </Accordion>

  <Accordion title="Polling- oder Netzwerk-Instabilität">

    - Node 22+ + benutzerdefiniertes Fetch/Proxy kann sofortiges Abbruchverhalten auslösen, wenn AbortSignal-Typen nicht übereinstimmen.
    - Einige Hosts lösen `api.telegram.org` zuerst zu IPv6 auf; fehlerhafter IPv6-Ausgangsverkehr kann zu intermittierenden Telegram-API-Fehlern führen.
    - Wenn die Logs `TypeError: fetch failed` oder `Network request for 'getUpdates' failed!` enthalten, versucht OpenClaw diese jetzt als behebbare Netzwerkfehler erneut.
    - Wenn die Logs `Polling stall detected` enthalten, startet OpenClaw das Polling neu und baut den Telegram-Transport standardmäßig nach 120 Sekunden ohne abgeschlossene Long-Poll-Liveness neu auf.
    - Erhöhe `channels.telegram.pollingStallThresholdMs` nur, wenn lang laufende `getUpdates`-Aufrufe gesund sind, dein Host aber weiterhin falsch-positive Neustarts wegen Polling-Stillstand meldet. Dauerhafte Stillstände deuten normalerweise auf Probleme mit Proxy, DNS, IPv6 oder TLS-Ausgangsverkehr zwischen dem Host und `api.telegram.org` hin.
    - Auf VPS-Hosts mit instabilem direktem Ausgangsverkehr/TLS leite Telegram-API-Aufrufe über `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ verwendet standardmäßig `autoSelectFamily=true` (außer WSL2) und `dnsResultOrder=ipv4first`.
    - Wenn dein Host WSL2 ist oder explizit besser mit einem reinen IPv4-Verhalten funktioniert, erzwinge die Familienauswahl:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Antworten aus dem RFC-2544-Benchmarkbereich (`198.18.0.0/15`) sind für Telegram-Mediendownloads standardmäßig bereits erlaubt. Wenn ein vertrauenswürdiger Fake-IP- oder transparenter Proxy `api.telegram.org` bei Mediendownloads auf eine andere private/interne/Special-Use-Adresse umschreibt, kannst du den nur für Telegram geltenden Bypass aktivieren:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Dasselbe Opt-in ist pro Konto auch unter
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` verfügbar.
    - Wenn dein Proxy Telegram-Medien-Hosts in `198.18.x.x` auflöst, lass das gefährliche Flag zunächst deaktiviert. Telegram-Medien erlauben den RFC-2544-Benchmarkbereich bereits standardmäßig.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` schwächt den SSRF-Schutz für Telegram-Medien.
      Verwende dies nur in vertrauenswürdigen, vom Operator kontrollierten Proxy-Umgebungen
      wie Clash, Mihomo oder Surge Fake-IP-Routing, wenn diese private oder Special-Use-Antworten
      außerhalb des RFC-2544-Benchmarkbereichs synthetisieren. Lass es für normalen öffentlichen
      Internetzugang zu Telegram deaktiviert.
    </Warning>

    - Überschreibungen per Umgebungsvariable (vorübergehend):
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

Weitere Hilfe: [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

## Verweise zur Telegram-Konfigurationsreferenz

Primäre Referenz:

- `channels.telegram.enabled`: Aktiviert/deaktiviert den Kanalstart.
- `channels.telegram.botToken`: Bot-Token (BotFather).
- `channels.telegram.tokenFile`: Token aus einem regulären Dateipfad lesen. Symlinks werden abgelehnt.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.telegram.allowFrom`: DM-Allowlist (numerische Telegram-Benutzer-IDs). `allowlist` erfordert mindestens eine Absender-ID. `open` erfordert `"*"`. `openclaw doctor --fix` kann veraltete `@username`-Einträge zu IDs auflösen und Allowlist-Einträge aus Pairing-Store-Dateien in Allowlist-Migrationsflüssen wiederherstellen.
- `channels.telegram.actions.poll`: Aktiviert oder deaktiviert die Erstellung von Telegram-Umfragen (standardmäßig aktiviert; erfordert weiterhin `sendMessage`).
- `channels.telegram.defaultTo`: Standard-Telegram-Ziel, das von CLI-`--deliver` verwendet wird, wenn kein explizites `--reply-to` angegeben ist.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.telegram.groupAllowFrom`: Allowlist für Gruppenabsender (numerische Telegram-Benutzer-IDs). `openclaw doctor --fix` kann veraltete `@username`-Einträge zu IDs auflösen. Nicht numerische Einträge werden bei der Authentifizierung ignoriert. Die Gruppenauthentifizierung verwendet keinen Fallback über den DM-Pairing-Store (`2026.2.25+`).
- Mehrkonto-Priorität:
  - Wenn zwei oder mehr Konto-IDs konfiguriert sind, setze `channels.telegram.defaultAccount` (oder schließe `channels.telegram.accounts.default` ein), um Standardrouting explizit festzulegen.
  - Wenn keines gesetzt ist, fällt OpenClaw auf die erste normalisierte Konto-ID zurück und `openclaw doctor` gibt eine Warnung aus.
  - `channels.telegram.accounts.default.allowFrom` und `channels.telegram.accounts.default.groupAllowFrom` gelten nur für das Konto `default`.
  - Benannte Konten erben `channels.telegram.allowFrom` und `channels.telegram.groupAllowFrom`, wenn Werte auf Kontoebene nicht gesetzt sind.
  - Benannte Konten erben nicht `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: Standardwerte pro Gruppe + Allowlist (verwende `"*"` für globale Standardwerte).
  - `channels.telegram.groups.<id>.groupPolicy`: Überschreibung pro Gruppe für `groupPolicy` (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: Standard für Mention-Gating.
  - `channels.telegram.groups.<id>.skills`: Skill-Filter (weglassen = alle Skills, leer = keine).
  - `channels.telegram.groups.<id>.allowFrom`: Überschreibung der Absender-Allowlist pro Gruppe.
  - `channels.telegram.groups.<id>.systemPrompt`: zusätzlicher System-Prompt für die Gruppe.
  - `channels.telegram.groups.<id>.enabled`: Deaktiviert die Gruppe, wenn `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: Überschreibungen pro Topic (Gruppenfelder + nur für Topics geltendes `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: Leitet dieses Topic an einen bestimmten Agent weiter (überschreibt Routing auf Gruppenebene und Binding-Routing).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: Überschreibung pro Topic für `groupPolicy` (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: Überschreibung pro Topic für Mention-Gating.
- Top-Level-`bindings[]` mit `type: "acp"` und kanonischer Topic-ID `chatId:topic:topicId` in `match.peer.id`: persistente ACP-Topic-Bindungsfelder (siehe [ACP-Agents](/de/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: Leitet DM-Topics an einen bestimmten Agent weiter (gleiches Verhalten wie bei Forenthemen).
- `channels.telegram.execApprovals.enabled`: Aktiviert Telegram als chatbasierten Exec-Genehmigungs-Client für dieses Konto.
- `channels.telegram.execApprovals.approvers`: Telegram-Benutzer-IDs, die Exec-Anfragen genehmigen oder ablehnen dürfen. Optional, wenn `channels.telegram.allowFrom` oder ein direktes `channels.telegram.defaultTo` den Besitzer bereits identifiziert.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (Standard: `dm`). `channel` und `both` behalten das auslösende Telegram-Topic bei, wenn vorhanden.
- `channels.telegram.execApprovals.agentFilter`: Optionaler Agent-ID-Filter für weitergeleitete Genehmigungsaufforderungen.
- `channels.telegram.execApprovals.sessionFilter`: Optionaler Sitzungsschlüssel-Filter (Teilstring oder Regex) für weitergeleitete Genehmigungsaufforderungen.
- `channels.telegram.accounts.<account>.execApprovals`: Überschreibung pro Konto für Routing von Telegram-Exec-Genehmigungen und Autorisierung von Approvern.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (Standard: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: Überschreibung pro Konto.
- `channels.telegram.commands.nativeSkills`: Aktiviert/deaktiviert native Telegram-Skills-Befehle.
- `channels.telegram.replyToMode`: `off | first | all` (Standard: `off`).
- `channels.telegram.textChunkLimit`: Größe ausgehender Chunks (Zeichen).
- `channels.telegram.chunkMode`: `length` (Standard) oder `newline`, um vor dem Chunking nach Länge an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.telegram.linkPreview`: Schaltet Linkvorschauen für ausgehende Nachrichten ein/aus (Standard: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (Live-Streaming-Vorschau; Standard: `partial`; `progress` wird auf `partial` abgebildet; `block` ist Kompatibilität mit dem veralteten Vorschau-Modus). Die Telegram-Vorschau beim Streaming verwendet eine einzelne Vorschau-Nachricht, die direkt bearbeitet wird.
- `channels.telegram.streaming.preview.toolProgress`: Verwendet die Live-Vorschau-Nachricht für Tool-/Fortschrittsaktualisierungen wieder, wenn Vorschau-Streaming aktiv ist (Standard: `true`). Setze `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.
- `channels.telegram.mediaMaxMb`: Begrenzung für eingehende/ausgehende Telegram-Medien (MB, Standard: 100).
- `channels.telegram.retry`: Wiederholungsrichtlinie für Telegram-Sendehilfen (CLI/Tools/Aktionen) bei behebbaren ausgehenden API-Fehlern (Versuche, `minDelayMs`, `maxDelayMs`, Jitter).
- `channels.telegram.network.autoSelectFamily`: Überschreibt Node `autoSelectFamily` (true=aktivieren, false=deaktivieren). Standardmäßig auf Node 22+ aktiviert, unter WSL2 standardmäßig deaktiviert.
- `channels.telegram.network.dnsResultOrder`: Überschreibt die DNS-Ergebnisreihenfolge (`ipv4first` oder `verbatim`). Standardmäßig `ipv4first` auf Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: Gefährliches Opt-in für vertrauenswürdige Fake-IP- oder transparente Proxy-Umgebungen, in denen Telegram-Mediendownloads `api.telegram.org` zu privaten/internen/Special-Use-Adressen außerhalb der standardmäßigen RFC-2544-Benchmarkbereich-Erlaubnis auflösen.
- `channels.telegram.proxy`: Proxy-URL für Bot-API-Aufrufe (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Aktiviert den Webhook-Modus (erfordert `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: Webhook-Secret (erforderlich, wenn `webhookUrl` gesetzt ist).
- `channels.telegram.webhookPath`: Lokaler Webhook-Pfad (Standard `/telegram-webhook`).
- `channels.telegram.webhookHost`: Lokaler Bind-Host für Webhooks (Standard `127.0.0.1`).
- `channels.telegram.webhookPort`: Lokaler Bind-Port für Webhooks (Standard `8787`).
- `channels.telegram.actions.reactions`: Gating für Reaktionen im Telegram-Tool.
- `channels.telegram.actions.sendMessage`: Gating für Nachrichtensendungen im Telegram-Tool.
- `channels.telegram.actions.deleteMessage`: Gating für Nachrichtenlöschungen im Telegram-Tool.
- `channels.telegram.actions.sticker`: Gating für Telegram-Sticker-Aktionen — senden und suchen (Standard: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — steuert, welche Reaktionen Systemereignisse auslösen (Standard: `own`, wenn nicht gesetzt).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — steuert die Reaktionsfähigkeit des Agenten (Standard: `minimal`, wenn nicht gesetzt).
- `channels.telegram.errorPolicy`: `reply | silent` — steuert das Verhalten von Fehlerantworten (Standard: `reply`). Überschreibungen pro Konto/Gruppe/Topic werden unterstützt.
- `channels.telegram.errorCooldownMs`: Mindestanzahl an ms zwischen Fehlerantworten an denselben Chat (Standard: `60000`). Verhindert Fehler-Spam während Ausfällen.

- [Konfigurationsreferenz - Telegram](/de/gateway/configuration-reference#telegram)

Telegram-spezifische Felder mit hoher Signalwirkung:

- Start/Auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` muss auf eine reguläre Datei zeigen; Symlinks werden abgelehnt)
- Zugriffskontrolle: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, Top-Level-`bindings[]` (`type: "acp"`)
- Exec-Genehmigungen: `execApprovals`, `accounts.*.execApprovals`
- Befehle/Menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- Threading/Antworten: `replyToMode`
- Streaming: `streaming` (Vorschau), `streaming.preview.toolProgress`, `blockStreaming`
- Formatierung/Zustellung: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- Medien/Netzwerk: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- Aktionen/Funktionen: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- Reaktionen: `reactionNotifications`, `reactionLevel`
- Fehler: `errorPolicy`, `errorCooldownMs`
- Schreibvorgänge/Verlauf: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Verwandt

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanalrouting](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
