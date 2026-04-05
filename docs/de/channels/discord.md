---
read_when:
    - Wenn Sie an Funktionen des Discord-Kanals arbeiten
summary: Status, Funktionen und Konfiguration der Discord-Bot-Unterstützung
title: Discord
x-i18n:
    generated_at: "2026-04-05T12:37:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e757d321d80d05642cd9e24b51fb47897bacaf8db19df83bd61a49a8ce51ed3a
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: bereit für DMs und Serverkanäle über das offizielle Discord-Gateway.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Discord-DMs verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Kanalübergreifende Diagnose und Reparaturablauf.
  </Card>
</CardGroup>

## Schnelle Einrichtung

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Wenn Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Eine Discord-Anwendung und einen Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Ihr OpenClaw-Agent verwendet.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Scrollen Sie auf der Seite **Bot** nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und die Zuordnung von Namen zu IDs)
    - **Presence Intent** (optional; nur für Presence-Updates erforderlich)

  </Step>

  <Step title="Ihren Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird damit Ihr erster Token erzeugt – es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie den Token und speichern Sie ihn irgendwo. Das ist Ihr **Bot Token**, und Sie benötigen ihn gleich.

  </Step>

  <Step title="Eine Einladungs-URL erzeugen und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie erzeugen eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

    Scrollen Sie nach unten zu **OAuth2 URL Generator** und aktivieren Sie:

    - `bot`
    - `applications.commands`

    Darunter erscheint ein Abschnitt **Bot Permissions**. Aktivieren Sie:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (optional)

    Kopieren Sie die erzeugte URL unten, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot jetzt im Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** in der Seitenleiste → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token – Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern zulassen">
    Damit Pairing funktioniert, muss Discord Ihrem Bot erlauben, Ihnen DMs zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Damit können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Serverkanäle nutzen möchten, können Sie DMs nach dem Pairing deaktivieren.

  </Step>

  <Step title="Ihren Bot-Token sicher setzen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Setzen Sie ihn auf dem Rechner, auf dem OpenClaw läuft, bevor Sie Ihrem Agenten schreiben.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw Mac-App oder durch Stoppen und erneutes Starten des Prozesses `openclaw gateway run` neu.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ask your agent">
        Chatten Sie mit Ihrem OpenClaw-Agenten auf einem vorhandenen Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / config.

        > „Ich habe meinen Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließe die Discord-Einrichtung mit der User ID `<user_id>` und der Server ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / config">
        Wenn Sie eine dateibasierte Konfiguration bevorzugen, setzen Sie:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Env-Fallback für das Standardkonto:

```bash
DISCORD_BOT_TOKEN=...
```

        Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über env-/file-/exec-Provider unterstützt. Siehe [Secrets Management](/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Erstes DM-Pairing genehmigen">
    Warten Sie, bis das Gateway läuft, und senden Sie dann Ihrem Bot in Discord eine DM. Er antwortet mit einem Pairing-Code.

    <Tabs>
      <Tab title="Ask your agent">
        Senden Sie den Pairing-Code an Ihren Agenten auf Ihrem vorhandenen Kanal:

        > „Genehmige diesen Discord-Pairing-Code: `<CODE>`“
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Pairing-Codes laufen nach 1 Stunde ab.

    Sie sollten jetzt per DM in Discord mit Ihrem Agenten chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontoabhängig. Token-Werte aus der Konfiguration haben Vorrang vor dem Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool/Kanalaktionen) wird ein expliziter aufrufbezogener `token` für diesen Aufruf verwendet. Das gilt für Sende- und Lese-/Probe-artige Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Kontorichtlinien und Wiederholungseinstellungen kommen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Einen Server-Workspace einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Workspace einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Das wird für private Server empfohlen, auf denen nur Sie und Ihr Bot sind.

<Steps>
  <Step title="Ihren Server zur Server-Allowlist hinzufügen">
    Dadurch kann Ihr Agent auf Ihrem Server in jedem Kanal antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ask your agent">
        > „Füge meine Discord Server ID `<server_id>` zur Server-Allowlist hinzu“
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Antworten ohne @mention erlauben">
    Standardmäßig antwortet Ihr Agent in Serverkanälen nur, wenn er mit @ erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    <Tabs>
      <Tab title="Ask your agent">
        > „Erlaube meinem Agenten, auf diesem Server zu antworten, ohne dass er mit @ erwähnt werden muss“
      </Tab>
      <Tab title="Config">
        Setzen Sie `requireMention: false` in Ihrer Serverkonfiguration:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Speichernutzung in Serverkanälen einplanen">
    Standardmäßig wird der Langzeitspeicher (`MEMORY.md`) nur in DM-Sitzungen geladen. Serverkanäle laden `MEMORY.md` nicht automatisch.

    <Tabs>
      <Tab title="Ask your agent">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwende `memory_search` oder `memory_get`, wenn du Langzeitkontext aus `MEMORY.md` benötigst.“
      </Tab>
      <Tab title="Manual">
        Wenn Sie in jedem Kanal gemeinsamen Kontext benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung eingefügt). Bewahren Sie Langzeitnotizen in `MEMORY.md` auf und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung – so können Sie `#coding`, `#home`, `#research` oder alles einrichten, was zu Ihrem Arbeitsablauf passt.

## Runtime-Modell

- Das Gateway verwaltet die Discord-Verbindung.
- Das Antwort-Routing ist deterministisch: Eingehende Discord-Nachrichten werden wieder an Discord beantwortet.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Serverkanäle haben isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), tragen aber weiterhin `CommandTargetSessionKey` zur gerouteten Gesprächssitzung.

## Forum-Kanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Wege, sie zu erstellen:

- Senden Sie eine Nachricht an das Forum-Elternelement (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um einen Thread direkt zu erstellen. Übergeben Sie für Forum-Kanäle nicht `--message-id`.

Beispiel: An das Forum-Elternelement senden, um einen Thread zu erstellen

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Beispiel: Einen Forum-Thread explizit erstellen

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum-Elternelemente akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das Nachrichten-Tool mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agenten zurückgeleitet und folgen den vorhandenen Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Buttons oder ein einzelnes Auswahlmenü
- Auswahlypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten einmalig verwendbar. Setzen Sie `components.reusable=true`, damit Buttons, Auswahlmenüs und Formulare mehrfach verwendet werden können, bis sie ablaufen.

Um einzuschränken, wer auf einen Button klicken kann, setzen Sie `allowedUsers` auf diesem Button (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht passende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen einen interaktiven Modellwähler mit Dropdowns für Provider und Modell sowie einem Submit-Schritt. Die Antwort des Auswählers ist ephemer, und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (eine einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er mit der Anhangsreferenz übereinstimmen soll

Modalformulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch einen Auslöse-Button hinzu

Beispiel:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Zugriffssteuerung und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.discord.dmPolicy` steuert den DM-Zugriff (Legacy: `channels.discord.dm.policy`):

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält; Legacy: `channels.discord.dm.allowFrom`)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zum Pairing aufgefordert).

    Vorrang bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.discord.accounts.default.allowFrom`.

    DM-Zielformat für Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs sind mehrdeutig und werden abgelehnt, sofern keine explizite Art des Benutzer-/Kanalziels angegeben ist.

  </Tab>

  <Tab title="Serverrichtlinie">
    Die Behandlung von Servern wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Sichere Baseline, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Der Server muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Allowlists für Absender: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eine von beiden konfiguriert ist, sind Absender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkter Namens-/Tag-Abgleich ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Kompatibilitätsmodus für Notfälle
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn ein Server `channels` konfiguriert hat, werden nicht aufgeführte Kanäle abgelehnt
    - wenn ein Server keinen `channels`-Block hat, sind alle Kanäle in diesem allowlisteten Server erlaubt

    Beispiel:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist das Runtime-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), selbst wenn `channels.defaults.groupPolicy` auf `open` steht.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Nachrichten in Servern sind standardmäßig erwähnungsgesteuert.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Auf-Bot-Antworten in unterstützten Fällen

    `requireMention` wird pro Server/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ohne @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Servermitglieder anhand der Rollen-ID an verschiedene Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor reinen Server-Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Einrichtung im Developer Portal

<AccordionGroup>
  <Accordion title="App und Bot erstellen">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Bot-Token kopieren

  </Accordion>

  <Accordion title="Privilegierte Intents">
    Unter **Bot -> Privileged Gateway Intents** aktivieren Sie:

    - Message Content Intent
    - Server Members Intent (empfohlen)

    Presence Intent ist optional und nur erforderlich, wenn Sie Presence-Updates empfangen möchten. Das Setzen der Bot-Presence (`setPresence`) erfordert nicht, dass Presence-Updates für Mitglieder aktiviert sind.

  </Accordion>

  <Accordion title="OAuth-Scopes und Basisberechtigungen">
    OAuth-URL-Generator:

    - Scopes: `bot`, `applications.commands`

    Typische Basisberechtigungen:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (optional)

    Vermeiden Sie `Administrator`, sofern es nicht ausdrücklich erforderlich ist.

  </Accordion>

  <Accordion title="IDs kopieren">
    Aktivieren Sie den Discord Developer Mode und kopieren Sie dann:

    - Server-ID
    - Kanal-ID
    - Benutzer-ID

    Bevorzugen Sie numerische IDs in der OpenClaw-Konfiguration für zuverlässige Audits und Prüfungen.

  </Accordion>
</AccordionGroup>

## Native Befehle und Befehlsauthentifizierung

- `commands.native` ist standardmäßig `"auto"` und für Discord aktiviert.
- Kanalbezogene Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` entfernt ausdrücklich zuvor registrierte native Discord-Befehle.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Oberfläche dennoch für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt weiterhin OpenClaw-Authentifizierung und gibt „not authorized“ zurück.

Siehe [Slash commands](/tools/slash-commands) für Befehlskatalog und Verhalten.

Standardmäßige Einstellungen für Slash-Befehle:

- `ephemeral: true`

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Antwort-Tags und native Antworten">
    Discord unterstützt Antwort-Tags in der Agentenausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard)
    - `first`
    - `all`

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.

    Nachrichten-IDs werden im Kontext/Verlauf bereitgestellt, sodass Agenten bestimmte Nachrichten gezielt ansprechen können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Antwortentwürfe streamen, indem es eine temporäre Nachricht sendet und sie bearbeitet, während Text ankommt.

    - `channels.discord.streaming` steuert Vorschau-Streaming (`off` | `partial` | `block` | `progress`, Standard: `off`).
    - Standard bleibt `off`, weil Discord-Vorschaubearbeitungen schnell an Rate Limits stoßen können, besonders wenn mehrere Bots oder Gateways dasselbe Konto oder denselben Serververkehr teilen.
    - `progress` wird für kanalübergreifende Konsistenz akzeptiert und in Discord auf `partial` abgebildet.
    - `channels.discord.streamMode` ist ein Legacy-Alias und wird automatisch migriert.
    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Tokens ankommen.
    - `block` sendet Entwurfsblöcke in Chunk-Größe (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen).

    Beispiel:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Standardwerte für Chunking im Modus `block` (begrenzt durch `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    Vorschau-Streaming ist nur für Text; Medienantworten fallen auf normale Zustellung zurück.

    Hinweis: Vorschau-Streaming ist getrennt von Block-Streaming. Wenn Block-Streaming für Discord explizit
    aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Verlaufskontext für Server:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Steuerung des DM-Verlaufs:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet
    - Metadaten des Eltern-Threads können für die Verknüpfung mit der Elternsitzung verwendet werden
    - Thread-Konfiguration übernimmt die Konfiguration des Elternkanals, sofern kein thread-spezifischer Eintrag existiert

    Kanaltopics werden als **nicht vertrauenswürdiger** Kontext eingefügt (nicht als System-Prompt).
    Antwort- und zitierter Nachrichtenkontext bleiben derzeit wie empfangen.
    Discord-Allowlists steuern primär, wer den Agenten auslösen kann, und sind keine vollständige Grenze zur Redigierung zusätzlichen Kontexts.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folge-Nachrichten in diesem Thread weiterhin an dieselbe Sitzung geroutet werden (einschließlich Subagent-Sitzungen).

    Befehle:

    - `/focus <target>` bindet aktuellen/neuen Thread an ein Subagent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Läufe und Bindungsstatus
    - `/session idle <duration|off>` prüft/aktualisiert automatische Entfokussierung bei Inaktivität für fokussierte Bindungen
    - `/session max-age <duration|off>` prüft/aktualisiert das harte maximale Alter für fokussierte Bindungen

    Konfiguration:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // Opt-in
      },
    },
  },
}
```

    Hinweise:

    - `session.threadBindings.*` setzt globale Standardwerte.
    - `channels.discord.threadBindings.*` überschreibt das Discord-Verhalten.
    - `spawnSubagentSessions` muss `true` sein, um Threads für `sessions_spawn({ thread: true })` automatisch zu erstellen/zu binden.
    - `spawnAcpSessions` muss `true` sein, um Threads für ACP (`/acp spawn ... --thread ...` oder `sessions_spawn({ runtime: "acp", thread: true })`) automatisch zu erstellen/zu binden.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Bindungsoperationen nicht verfügbar.

    Siehe [Sub-agents](/tools/subagents), [ACP Agents](/tools/acp-agents) und [Configuration Reference](/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindungen">
    Für stabile „always-on“-ACP-Workspaces konfigurieren Sie ACP-Bindungen auf oberster Ebene mit Typisierung, die auf Discord-Gespräche zielen.

    Konfigurationspfad:

    - `bindings[]` mit `type: "acp"` und `match.channel: "discord"`

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
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Hinweise:

    - `/acp spawn codex --bind here` bindet den aktuellen Discord-Kanal oder Thread direkt vor Ort und hält zukünftige Nachrichten an dieselbe ACP-Sitzung geroutet.
    - Das kann weiterhin bedeuten: „Eine neue Codex-ACP-Sitzung starten“, aber es erstellt nicht selbst einen neuen Discord-Thread. Der bestehende Kanal bleibt die Chat-Oberfläche.
    - Codex kann weiterhin in seinem eigenen `cwd` oder Backend-Workspace auf der Festplatte laufen. Dieser Workspace ist Runtime-Zustand, nicht ein Discord-Thread.
    - Thread-Nachrichten können die ACP-Bindung des Elternkanals übernehmen.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück.
    - Temporäre Thread-Bindungen funktionieren weiterhin und können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw einen untergeordneten Thread über `--thread auto|here` erstellen/binden muss. Es ist nicht erforderlich für `/acp spawn ... --bind here` im aktuellen Kanal.

    Siehe [ACP Agents](/tools/acp-agents) für Details zum Bindungsverhalten.

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Modus für Reaktionsbenachrichtigungen pro Server:

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und der gerouteten Discord-Sitzung angehängt.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Emoji-Fallback der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emojis oder benutzerdefinierte Emoji-Namen.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge">
    Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert.

    Dies betrifft Abläufe mit `/config set|unset` (wenn Befehlsfunktionen aktiviert sind).

    Deaktivieren:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway-Proxy">
    Leiten Sie Discord-Gateway-WebSocket-Verkehr und REST-Abfragen beim Start (Anwendungs-ID + Auflösung der Allowlist) mit `channels.discord.proxy` durch einen HTTP(S)-Proxy.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Überschreibung pro Konto:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit-Unterstützung">
    Aktivieren Sie die PluralKit-Auflösung, um geproxte Nachrichten einer Systemmitgliedsidentität zuzuordnen:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; für private Systeme erforderlich
      },
    },
  },
}
```

    Hinweise:

    - Allowlists können `pk:<memberId>` verwenden
    - Anzeigenamen von Mitgliedern werden nur nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true` gesetzt ist
    - Nachschlagen verwendet die ursprüngliche Nachrichten-ID und ist zeitfensterbegrenzt
    - wenn die Nachschlageoperation fehlschlägt, werden geproxte Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern nicht `allowBots=true`

  </Accordion>

  <Accordion title="Presence-Konfiguration">
    Presence-Updates werden angewendet, wenn Sie ein Status- oder Aktivitätsfeld setzen oder Auto-Presence aktivieren.

    Beispiel nur für Status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Aktivitätsbeispiel (benutzerdefinierter Status ist der Standard-Aktivitätstyp):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Streaming-Beispiel:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Zuordnung der Aktivitätstypen:

    - 0: Playing
    - 1: Streaming (erfordert `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (verwendet den Aktivitätstext als Statuszustand; Emoji ist optional)
    - 5: Competing

    Beispiel für Auto-Presence (Runtime-Zustandssignal):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Auto-Presence ordnet Runtime-Verfügbarkeit einem Discord-Status zu: healthy => online, degraded oder unknown => idle, exhausted oder unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt buttonbasierte Genehmigungen in DMs und kann Genehmigungsaufforderungen optional im ursprünglichen Kanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; greift nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Ausführungsgenehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmiger aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Ausführungsgenehmiger nicht aus kanalbezogenem `allowFrom`, Legacy-`dm.allowFrom` oder direktem `defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Genehmigungs-Client zu deaktivieren.

    Wenn `target` auf `channel` oder `both` steht, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmiger können die Buttons verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, daher sollten Sie die Zustellung in Kanälen nur in vertrauenswürdigen Kanälen aktivieren. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf DM-Zustellung zurück.

    Discord rendert außerdem die gemeinsam genutzten Genehmigungs-Buttons, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich Genehmiger-DM-Routing und Kanal-Fanout.
    Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur einfügen, wenn das Tool-Ergebnis angibt,
    dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.

    Gateway-Authentifizierung für diesen Handler verwendet denselben gemeinsam genutzten Vertrag zur Auflösung von Anmeldedaten wie andere Gateway-Clients:

    - env-first lokale Authentifizierung (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` dann `gateway.auth.*`)
    - im lokalen Modus kann `gateway.remote.*` nur dann als Fallback verwendet werden, wenn `gateway.auth.*` nicht gesetzt ist; konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen geschlossen fehl
    - Unterstützung für den Remote-Modus über `gateway.remote.*`, wenn anwendbar
    - URL-Überschreibungen sind override-sicher: CLI-Überschreibungen verwenden keine impliziten Anmeldedaten wieder, und Env-Überschreibungen verwenden nur Env-Anmeldedaten

    Verhalten bei der Genehmigungsauflösung:

    - IDs mit Präfix `plugin:` werden über `plugin.approval.resolve` aufgelöst.
    - Andere IDs werden über `exec.approval.resolve` aufgelöst.
    - Discord führt hier keinen zusätzlichen Exec-zu-Plugin-Fallback aus; das ID-Präfix
      entscheidet, welche Gateway-Methode aufgerufen wird.

    Ausführungsgenehmigungen laufen standardmäßig nach 30 Minuten ab. Wenn Genehmigungen mit
    unbekannten Genehmigungs-IDs fehlschlagen, prüfen Sie die Auflösung der Genehmiger, die Aktivierung der Funktion und
    dass die ausgelieferte Art der Genehmigungs-ID zur ausstehenden Anfrage passt.

    Verwandte Dokumentation: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools und Action-Gates

Discord-Nachrichtenaktionen umfassen Messaging, Kanaladministration, Moderation, Presence und Metadatenaktionen.

Zentrale Beispiele:

- Messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Presence: `setPresence`

Action-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Action group                                                                                                                                                             | Standard |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components v2 UI

OpenClaw verwendet Discord components v2 für Ausführungsgenehmigungen und kanalübergreifende Marker. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (erweitert; erfordert das Erstellen einer Komponenten-Payload über das Discord-Tool), während Legacy-`embeds` weiterhin verfügbar, aber nicht empfohlen sind.

- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe, die von Discord-Komponentencontainern verwendet wird (Hex).
- Pro Konto festlegen mit `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` werden ignoriert, wenn components v2 vorhanden sind.

Beispiel:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Sprachkanäle

OpenClaw kann Discord-Sprachkanälen für Echtzeit-Gespräche beitreten. Dies ist getrennt von Sprachnachrichtenanhängen.

Anforderungen:

- Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
- Konfigurieren Sie `channels.discord.voice`.
- Der Bot benötigt die Berechtigungen Connect + Speak im Ziel-Sprachkanal.

Verwenden Sie den Discord-spezifischen nativen Befehl `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standardagenten des Kontos und folgt denselben Allowlist- und Serverrichtlinien wie andere Discord-Befehle.

Beispiel für automatischen Beitritt:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Hinweise:

- `voice.tts` überschreibt `messages.tts` nur für die Sprachwiedergabe.
- Sprachtranskript-Turns leiten den Besitzerstatus aus Discord-`allowFrom` (oder `dm.allowFrom`) ab; Sprecher, die keine Besitzer sind, können nicht auf nur für Besitzer bestimmte Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Voice ist standardmäßig aktiviert; setzen Sie `channels.discord.voice.enabled=false`, um es zu deaktivieren.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn nicht gesetzt.
- OpenClaw überwacht außerdem Fehler bei der Empfangsentschlüsselung und stellt die Verbindung automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitraum verlässt und erneut beitritt.
- Wenn Empfangslogs wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, könnte dies der Upstream-Fehler von `@discordjs/voice` sein, der in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) verfolgt wird.

## Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau und erfordern OGG/Opus-Audio plus Metadaten. OpenClaw erzeugt die Wellenform automatisch, benötigt dafür aber `ffmpeg` und `ffprobe`, die auf dem Gateway-Host verfügbar sein müssen, um Audiodateien zu prüfen und zu konvertieren.

Anforderungen und Einschränkungen:

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord erlaubt keinen Text zusammen mit einer Sprachnachricht in derselben Payload).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf in OGG/Opus.

Beispiel:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder Bot sieht keine Servernachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Benutzer-/Mitgliederauflösung abhängen
    - Gateway nach dem Ändern von Intents neu starten

  </Accordion>

  <Accordion title="Servernachrichten werden unerwartet blockiert">

    - `groupPolicy` prüfen
    - Server-Allowlist unter `channels.discord.guilds` prüfen
    - wenn die Server-`channels`-Map existiert, sind nur aufgeführte Kanäle erlaubt
    - `requireMention`-Verhalten und Erwähnungsmuster prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, aber trotzdem blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Server-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder im Kanaleintrag stehen)
    - Absender durch Server-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Handler verursachen Timeouts oder doppelte Antworten">

    Typische Logs:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Regler für Listener-Budget:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Regler für Worker-Laufzeitlimit:

    - Einzelkonto: `channels.discord.inboundWorker.runTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - Standard: `1800000` (30 Minuten); setzen Sie `0`, um zu deaktivieren

    Empfohlene Baseline:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Verwenden Sie `eventQueue.listenerTimeout` für langsame Listener-Einrichtung und `inboundWorker.runTimeoutMs`
    nur, wenn Sie ein separates Sicherheitsventil für in die Warteschlange eingestellte Agenten-Turns möchten.

  </Accordion>

  <Accordion title="Abweichungen bei Berechtigungs-Audits">
    Berechtigungsprüfungen von `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann die Runtime-Zuordnung weiterhin funktionieren, aber die Prüfung kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM- und Pairing-Probleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (Legacy: `channels.discord.dm.policy`)
    - wartende Pairing-Genehmigung im Modus `pairing`

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strikte Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

  </Accordion>

  <Accordion title="Voice-STT bricht mit DecryptionFailed(...) ab">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für Discord-Spracherfassung vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - beginnen Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie es nur bei Bedarf an
    - beobachten Sie Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn Fehler nach automatischem erneuten Beitritt weiter auftreten, sammeln Sie Logs und vergleichen Sie sie mit [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Hinweise zur Konfigurationsreferenz

Primäre Referenz:

- [Configuration reference - Discord](/gateway/configuration-reference#discord)

Wichtige Discord-Felder:

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Inbound-Worker: `inboundWorker.runTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (Legacy-Alias: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Wiederholung: `mediaMaxMb`, `retry`
  - `mediaMaxMb` begrenzt ausgehende Discord-Uploads (Standard: `8MB`)
- Aktionen: `actions.*`
- Presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberste Ebene `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn die Bereitstellung oder der Zustand von Befehlen veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Channel routing](/channels/channel-routing)
- [Security](/gateway/security)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
- [Slash commands](/tools/slash-commands)
