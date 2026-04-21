---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Status, Fähigkeiten und Konfiguration der Discord-Bot-Unterstützung
title: Discord
x-i18n:
    generated_at: "2026-04-21T17:45:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1681315a6c246c4b68347f5e22319e132f30ea4e29a19e7d1da9e83dce7b68d0
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: bereit für DMs und Guild-Kanäle über das offizielle Discord-Gateway.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Discord-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturabläufe.
  </Card>
</CardGroup>

## Schnelle Einrichtung

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Falls Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Eine Discord-Anwendung und einen Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie für Ihren OpenClaw-Agenten verwenden.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Bleiben Sie auf der Seite **Bot**, scrollen Sie nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und Name-zu-ID-Abgleich)
    - **Presence Intent** (optional; nur für Presence-Updates erforderlich)

  </Step>

  <Step title="Ihren Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erster Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie den Token und speichern Sie ihn an einem sicheren Ort. Das ist Ihr **Bot Token**, und Sie werden ihn gleich brauchen.

  </Step>

  <Step title="Eine Einladungs-URL erzeugen und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie werden eine Einladungs-URL mit den richtigen Berechtigungen erzeugen, um den Bot zu Ihrem Server hinzuzufügen.

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

  <Step title="Den Entwicklermodus aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Entwicklermodus aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie mit der rechten Maustaste auf Ihr **Server-Symbol** in der Seitenleiste → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen DMs zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Server-Symbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie diese Option aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Guild-Kanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

  </Step>

  <Step title="Ihren Bot-Token sicher setzen (nicht im Chat senden)">
    Ihr Discord-Bot-Token ist ein Geheimnis (wie ein Passwort). Setzen Sie ihn auf dem Rechner, auf dem OpenClaw läuft, bevor Sie Ihrem Agenten eine Nachricht senden.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App neu oder indem Sie den Prozess `openclaw gateway run` stoppen und erneut starten.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        Chatten Sie mit Ihrem OpenClaw-Agenten auf einem bestehenden Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den CLI-/Konfigurations-Tab.

        > „Ich habe meinen Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließe die Discord-Einrichtung mit der User ID `<user_id>` und der Server ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / Konfiguration">
        Wenn Sie dateibasierte Konfiguration bevorzugen, setzen Sie:

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

        Klartextwerte für `token` werden unterstützt. SecretRef-Werte werden ebenfalls für `channels.discord.token` über Env-/Datei-/Exec-Provider unterstützt. Siehe [Secrets Management](/de/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Erste DM-Kopplung genehmigen">
    Warten Sie, bis das Gateway läuft, und senden Sie dann Ihrem Bot in Discord eine DM. Er antwortet mit einem Kopplungscode.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        Senden Sie den Kopplungscode an Ihren Agenten auf Ihrem bestehenden Kanal:

        > „Genehmige diesen Discord-Kopplungscode: `<CODE>`“
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kopplungscodes laufen nach 1 Stunde ab.

    Sie sollten jetzt per DM mit Ihrem Agenten in Discord chatten können.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Token-Werte aus der Konfiguration haben Vorrang vor dem Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool/Kanalaktionen) wird ein expliziter `token` pro Aufruf für genau diesen Aufruf verwendet. Das gilt für Sende- sowie Lese-/Probe-Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Kontorichtlinie- und Retry-Einstellungen kommen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Einen Guild-Arbeitsbereich einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Arbeitsbereich einrichten, in dem jeder Kanal seine eigene Agent-Sitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot aktiv sind.

<Steps>
  <Step title="Ihren Server zur Guild-Allowlist hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        > „Füge meine Discord-Server-ID `<server_id>` zur Guild-Allowlist hinzu“
      </Tab>
      <Tab title="Konfiguration">

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
    Standardmäßig antwortet Ihr Agent in Guild-Kanälen nur, wenn er mit @ erwähnt wird. Für einen privaten Server möchten Sie wahrscheinlich, dass er auf jede Nachricht antwortet.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        > „Erlaube meinem Agenten, auf diesem Server zu antworten, ohne mit @ erwähnt werden zu müssen“
      </Tab>
      <Tab title="Konfiguration">
        Setzen Sie `requireMention: false` in Ihrer Guild-Konfiguration:

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

  <Step title="Speicherverhalten in Guild-Kanälen planen">
    Standardmäßig wird der Langzeitspeicher (`MEMORY.md`) nur in DM-Sitzungen geladen. Guild-Kanäle laden `MEMORY.md` nicht automatisch.

    <Tabs>
      <Tab title="Fragen Sie Ihren Agenten">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwende `memory_search` oder `memory_get`, wenn du Langzeitkontext aus `MEMORY.md` benötigst.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie gemeinsamen Kontext in jedem Kanal benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung injiziert). Halten Sie Langzeitnotizen in `MEMORY.md` und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie jetzt einige Kanäle auf Ihrem Discord-Server und beginnen Sie zu chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — sodass Sie `#coding`, `#home`, `#research` oder andere für Ihren Workflow passende Kanäle einrichten können.

## Runtime-Modell

- Das Gateway verwaltet die Discord-Verbindung.
- Das Reply-Routing ist deterministisch: Eingehende Discord-Antworten gehen wieder an Discord zurück.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Guild-Kanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), während sie weiterhin `CommandTargetSessionKey` zur weitergeleiteten Unterhaltungssitzung mitführen.

## Forum-Kanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Wege, sie zu erstellen:

- Senden Sie eine Nachricht an das Forum-Parent (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nichtleere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um direkt einen Thread zu erstellen. Übergeben Sie für Forum-Kanäle nicht `--message-id`.

Beispiel: An das Forum-Parent senden, um einen Thread zu erstellen

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Beispiel: Einen Forum-Thread explizit erstellen

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum-Parents akzeptieren keine Discord-Komponenten. Wenn Sie Komponenten benötigen, senden Sie an den Thread selbst (`channel:<threadId>`).

## Interaktive Komponenten

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das Nachrichten-Tool mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten zurück an den Agenten geleitet und folgen den bestehenden Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten nur einmal verwendbar. Setzen Sie `components.reusable=true`, um Schaltflächen, Auswahlen und Formulare mehrfach verwendbar zu machen, bis sie ablaufen.

Um einzuschränken, wer auf eine Schaltfläche klicken kann, setzen Sie `allowedUsers` auf dieser Schaltfläche (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht übereinstimmende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen einen interaktiven Modellwähler mit Dropdowns für Provider und Modell sowie einem Schritt zum Absenden. Die Antwort des Auswahlmenüs ist ephemer, und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Attachment-Referenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (eine einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er der Attachment-Referenz entsprechen soll

Modale Formulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch eine Auslöser-Schaltfläche hinzu

Beispiel:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optionaler Fallback-Text",
  components: {
    reusable: true,
    text: "Wähle einen Pfad",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Genehmigen",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Ablehnen", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Wähle eine Option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Formular öffnen",
      fields: [
        { type: "text", label: "Anfordernde Person" },
        {
          type: "select",
          label: "Priorität",
          options: [
            { label: "Niedrig", value: "low" },
            { label: "Hoch", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.discord.dmPolicy` steuert den DM-Zugriff (Legacy: `channels.discord.dm.policy`):

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält; Legacy: `channels.discord.dm.allowFrom`)
    - `disabled`

    Wenn die DM-Richtlinie nicht offen ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Priorität bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.discord.accounts.default.allowFrom`.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Mention

    Reine numerische IDs sind mehrdeutig und werden abgelehnt, sofern kein expliziter Benutzer-/Kanal-Zieltyp angegeben ist.

  </Tab>

  <Tab title="Guild-Richtlinie">
    Die Behandlung von Guilds wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Baseline, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Die Guild muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Sender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eines davon konfiguriert ist, sind Sender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkter Name-/Tag-Abgleich ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Name-/Tag-Einträge verwendet werden
    - wenn für eine Guild `channels` konfiguriert ist, werden nicht aufgeführte Kanäle abgelehnt
    - wenn eine Guild keinen Block `channels` hat, sind alle Kanäle in dieser allowlisteten Guild erlaubt

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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen Block `channels.discord` erstellen, ist das Runtime-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), selbst wenn `channels.defaults.groupPolicy` `open` ist.

  </Tab>

  <Tab title="Mentions und Gruppen-DMs">
    Guild-Nachrichten sind standardmäßig mention-gesteuert.

    Die Mention-Erkennung umfasst:

    - explizite Bot-Mention
    - konfigurierte Mention-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Reply-to-Bot-Verhalten in unterstützten Fällen

    `requireMention` wird pro Guild/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agent-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder anhand der Rollen-ID an verschiedene Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor rein Guild-basierten Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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
    Aktivieren Sie unter **Bot -> Privileged Gateway Intents**:

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

    Vermeiden Sie `Administrator`, sofern dies nicht ausdrücklich erforderlich ist.

  </Accordion>

  <Accordion title="IDs kopieren">
    Aktivieren Sie den Discord-Entwicklermodus und kopieren Sie dann:

    - Server-ID
    - Kanal-ID
    - Benutzer-ID

    Bevorzugen Sie numerische IDs in der OpenClaw-Konfiguration für zuverlässige Audits und Probes.

  </Accordion>
</AccordionGroup>

## Native Befehle und Befehlsauthentifizierung

- `commands.native` hat standardmäßig den Wert `"auto"` und ist für Discord aktiviert.
- Kanalbezogene Überschreibung: `channels.discord.commands.native`.
- `commands.native=false` entfernt explizit zuvor registrierte native Discord-Befehle.
- Die native Befehlsauthentifizierung verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für Benutzer sichtbar sein, die nicht autorisiert sind; die Ausführung erzwingt dennoch die OpenClaw-Authentifizierung und gibt „nicht autorisiert“ zurück.

Siehe [Slash-Befehle](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

Standardmäßige Einstellungen für Slash-Befehle:

- `ephemeral: true`

## Funktionsdetails

<AccordionGroup>
  <Accordion title="Reply-Tags und native Antworten">
    Discord unterstützt Reply-Tags in der Agent-Ausgabe:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Gesteuert durch `channels.discord.replyToMode`:

    - `off` (Standard)
    - `first`
    - `all`
    - `batched`

    Hinweis: `off` deaktiviert implizites Reply-Threading. Explizite `[[reply_to_*]]`-Tags werden weiterhin berücksichtigt.
    `first` hängt die implizite native Reply-Referenz immer an die erste ausgehende Discord-Nachricht des Turns an.
    `batched` hängt die implizite native Reply-Referenz von Discord nur an, wenn der
    eingehende Turn ein entprellter Stapel aus mehreren Nachrichten war. Dies ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, burstartige Chats möchten, nicht für jeden
    einzelnen Einzelnachrichten-Turn.

    Nachrichten-IDs werden in Kontext/Verlauf sichtbar gemacht, sodass Agenten gezielt bestimmte Nachrichten ansprechen können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Entwurfsantworten streamen, indem eine temporäre Nachricht gesendet und beim Eintreffen von Text bearbeitet wird.

    - `channels.discord.streaming` steuert das Vorschau-Streaming (`off` | `partial` | `block` | `progress`, Standard: `off`).
    - Standardmäßig bleibt `off` gesetzt, weil Discord-Vorschau-Bearbeitungen schnell an Rate Limits stoßen können, insbesondere wenn mehrere Bots oder Gateways dasselbe Konto oder denselben Guild-Traffic verwenden.
    - `progress` wird für kanalübergreifende Konsistenz akzeptiert und in Discord auf `partial` abgebildet.
    - `channels.discord.streamMode` ist ein Legacy-Alias und wird automatisch migriert.
    - `partial` bearbeitet eine einzelne Vorschau-Nachricht, während Tokens eintreffen.
    - `block` gibt Entwurfsblöcke in Chunks aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen).
    - `streaming.preview.toolProgress` steuert, ob Tool-/Fortschrittsaktualisierungen dieselbe Entwurfs-Vorschau-Nachricht wiederverwenden (Standard: `true`). Setzen Sie `false`, um getrennte Tool-/Fortschrittsnachrichten beizubehalten.

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

    `block`-Modus-Chunking-Standards (begrenzt durch `channels.discord.textChunkLimit`):

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

    Vorschau-Streaming ist nur für Text verfügbar; Medienantworten fallen auf normale Zustellung zurück.

    Hinweis: Vorschau-Streaming ist vom Block-Streaming getrennt. Wenn Block-Streaming für Discord explizit
    aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Guild-Verlaufskontext:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    DM-Verlaufskontrollen:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen weitergeleitet
    - Metadaten des Parent-Threads können für Parent-Sitzungs-Verknüpfungen verwendet werden
    - Die Thread-Konfiguration übernimmt die Konfiguration des Parent-Kanals, sofern kein threadspezifischer Eintrag existiert

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext injiziert (nicht als System-Prompt).
    Reply- und zitierter Nachrichtenkontext bleibt derzeit wie empfangen erhalten.
    Discord-Allowlists steuern in erster Linie, wer den Agenten auslösen kann, nicht als vollständige Redaktionsgrenze für zusätzlichen Kontext.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Unteragenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgemeldungen in diesem Thread weiterhin an dieselbe Sitzung weitergeleitet werden (einschließlich Unteragent-Sitzungen).

    Befehle:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Unteragent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Ausführungen und den Bindungsstatus
    - `/session idle <duration|off>` zeigt die Auto-Unfocus-Inaktivität für fokussierte Bindungen an bzw. aktualisiert sie
    - `/session max-age <duration|off>` zeigt das harte Höchstalter für fokussierte Bindungen an bzw. aktualisiert es

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
    - `spawnSubagentSessions` muss auf true gesetzt sein, um Threads für `sessions_spawn({ thread: true })` automatisch zu erstellen/zu binden.
    - `spawnAcpSessions` muss auf true gesetzt sein, um Threads für ACP (`/acp spawn ... --thread ...` oder `sessions_spawn({ runtime: "acp", thread: true })`) automatisch zu erstellen/zu binden.
    - Wenn Thread-Bindings für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Binding-Operationen nicht verfügbar.

    Siehe [Unteragenten](/de/tools/subagents), [ACP-Agenten](/de/tools/acp-agents) und [Configuration Reference](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindings">
    Für stabile, „always-on“ ACP-Arbeitsbereiche konfigurieren Sie typisierte ACP-Bindings auf oberster Ebene, die auf Discord-Unterhaltungen zielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Discord-Kanal oder Thread direkt und sorgt dafür, dass zukünftige Nachrichten weiterhin an dieselbe ACP-Sitzung weitergeleitet werden.
    - Das kann weiterhin bedeuten: „eine frische Codex-ACP-Sitzung starten“, aber es erstellt nicht von selbst einen neuen Discord-Thread. Der bestehende Kanal bleibt die Chat-Oberfläche.
    - Codex kann weiterhin in seinem eigenen `cwd` oder Backend-Arbeitsbereich auf der Festplatte laufen. Dieser Arbeitsbereich ist Runtime-Zustand, nicht ein Discord-Thread.
    - Thread-Nachrichten können die ACP-Bindung des Parent-Kanals übernehmen.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück.
    - Temporäre Thread-Bindings funktionieren weiterhin und können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw einen Child-Thread über `--thread auto|here` erstellen/binden muss. Es ist nicht erforderlich für `/acp spawn ... --bind here` im aktuellen Kanal.

    Siehe [ACP Agents](/de/tools/acp-agents) für Details zum Binding-Verhalten.

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Reaktionsbenachrichtigungsmodus pro Guild:

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und an die weitergeleitete Discord-Sitzung angehängt.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Fallback auf das Emoji der Agent-Identität (`agents.list[].identity.emoji`, sonst "👀")

    Hinweise:

    - Discord akzeptiert Unicode-Emojis oder benutzerdefinierte Emoji-Namen.
    - Verwenden Sie `""`, um die Reaktion für einen Kanal oder ein Konto zu deaktivieren.

  </Accordion>

  <Accordion title="Konfigurationsschreibvorgänge">
    Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert.

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
    Leiten Sie Discord-Gateway-WebSocket-Traffic und REST-Lookups beim Start (Anwendungs-ID + Allowlist-Auflösung) über einen HTTP(S)-Proxy mit `channels.discord.proxy`.

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
    Aktivieren Sie die PluralKit-Auflösung, um weitergeleitete Nachrichten einer Systemmitglied-Identität zuzuordnen:

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
    - Anzeigenamen von Mitgliedern werden nur dann nach Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true` gesetzt ist
    - Lookups verwenden die ursprüngliche Nachrichten-ID und sind durch ein Zeitfenster begrenzt
    - wenn der Lookup fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, außer `allowBots=true`

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

    Aktivitätsbeispiel (Custom Status ist der Standard-Aktivitätstyp):

```json5
{
  channels: {
    discord: {
      activity: "Fokuszeit",
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
      activity: "Live-Coding",
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

    Beispiel für Auto-Presence (Runtime-Health-Signal):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "Token erschöpft",
      },
    },
  },
}
```

    Auto-Presence ordnet die Runtime-Verfügbarkeit dem Discord-Status zu: healthy => online, degraded oder unknown => idle, exhausted oder unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt die Genehmigungsverarbeitung per Schaltfläche in DMs und kann Genehmigungsaufforderungen optional im Ursprungskanal posten.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt ist oder `"auto"` ist und mindestens eine genehmigende Person aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmigende nicht aus Kanal-`allowFrom`, Legacy-`dm.allowFrom` oder Direct-Message-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord explizit als nativen Genehmigungs-Client zu deaktivieren.

    Wenn `target` den Wert `channel` oder `both` hat, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste genehmigende Personen können die Schaltflächen verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, daher sollten Sie die Zustellung an Kanäle nur in vertrauenswürdigen Kanälen aktivieren. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf die Zustellung per DM zurück.

    Discord rendert außerdem die gemeinsamen Genehmigungsschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich das DM-Routing für genehmigende Personen und den Kanal-Fanout.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre UX für Genehmigungen; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Tool-Ergebnis besagt,
    dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

    Die Gateway-Authentifizierung für diesen Handler verwendet denselben gemeinsamen Vertrag zur Credential-Auflösung wie andere Gateway-Clients:

    - env-first lokale Authentifizierung (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, dann `gateway.auth.*`)
    - im lokalen Modus kann `gateway.remote.*` nur dann als Fallback verwendet werden, wenn `gateway.auth.*` nicht gesetzt ist; konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen geschlossen fehl
    - Unterstützung für den Remote-Modus über `gateway.remote.*`, falls anwendbar
    - URL-Überschreibungen sind override-sicher: CLI-Überschreibungen verwenden keine impliziten Credentials wieder, und Env-Überschreibungen verwenden nur Env-Credentials

    Verhalten bei der Genehmigungsauflösung:

    - IDs mit dem Präfix `plugin:` werden über `plugin.approval.resolve` aufgelöst.
    - Andere IDs werden über `exec.approval.resolve` aufgelöst.
    - Discord führt hier keinen zusätzlichen Exec-zu-Plugin-Fallback-Hop aus; das
      ID-Präfix entscheidet, welche Gateway-Methode aufgerufen wird.

    Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab. Wenn Genehmigungen mit
    unbekannten Genehmigungs-IDs fehlschlagen, prüfen Sie die Auflösung der genehmigenden Personen, die Feature-Aktivierung und,
    dass die Art der zugestellten Genehmigungs-ID zur ausstehenden Anfrage passt.

    Zugehörige Dokumentation: [Exec approvals](/de/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools und Action-Gates

Discord-Nachrichtenaktionen umfassen Messaging-, Kanaladministrations-, Moderations-, Presence- und Metadatenaktionen.

Zentrale Beispiele:

- Messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Presence: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses zu setzen.

Action-Gates befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Gates:

| Aktionsgruppe                                                                                                                                                            | Standard |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components-v2-UI

OpenClaw verwendet Discord Components v2 für Exec-Genehmigungen und kontextübergreifende Marker. Discord-Nachrichtenaktionen können außerdem `components` für benutzerdefinierte UI akzeptieren (fortgeschritten; erfordert die Konstruktion einer Component-Payload über das Discord-Tool), während Legacy-`embeds` weiterhin verfügbar, aber nicht empfohlen sind.

- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe, die von Discord-Component-Containern verwendet wird (hex).
- Pro Konto setzen mit `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` werden ignoriert, wenn Components v2 vorhanden sind.

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

OpenClaw kann Discord-Sprachkanälen für Echtzeit- und fortlaufende Unterhaltungen beitreten. Dies ist von Sprach-Nachrichtenanhängen getrennt.

Anforderungen:

- Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
- Konfigurieren Sie `channels.discord.voice`.
- Der Bot benötigt die Berechtigungen Connect + Speak im Ziel-Sprachkanal.

Verwenden Sie den nur für Discord verfügbaren nativen Befehl `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agenten des Kontos und folgt denselben Allowlist- und Group-Policy-Regeln wie andere Discord-Befehle.

Beispiel für Auto-Join:

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
- Turns von Sprachtranskripten leiten den Owner-Status von Discord `allowFrom` (oder `dm.allowFrom`) ab; Sprecher ohne Owner-Status können nicht auf reine Owner-Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Voice ist standardmäßig aktiviert; setzen Sie `channels.discord.voice.enabled=false`, um es zu deaktivieren.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie nicht gesetzt sind.
- OpenClaw überwacht außerdem Entschlüsselungsfehler beim Empfangen und stellt die Verbindung automatisch wieder her, indem es den Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlässt und erneut beitritt.
- Wenn in den Empfangslogs wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` erscheint, könnte dies der Upstream-Receive-Bug von `@discordjs/voice` sein, der in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) verfolgt wird.

## Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Waveform-Vorschau an und erfordern OGG-/Opus-Audio plus Metadaten. OpenClaw erzeugt die Waveform automatisch, benötigt dafür aber `ffmpeg` und `ffprobe`, die auf dem Gateway-Host verfügbar sein müssen, um Audiodateien zu prüfen und zu konvertieren.

Anforderungen und Einschränkungen:

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord erlaubt nicht Text + Sprachnachricht in derselben Payload).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf nach OGG/Opus.

Beispiel:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder der Bot sieht keine Guild-Nachrichten">

    - Message Content Intent aktivieren
    - Server Members Intent aktivieren, wenn Sie von Benutzer-/Mitgliederauflösung abhängen
    - Gateway nach dem Ändern von Intents neu starten

  </Accordion>

  <Accordion title="Guild-Nachrichten unerwartet blockiert">

    - `groupPolicy` prüfen
    - Guild-Allowlist unter `channels.discord.guilds` prüfen
    - wenn die Guild-Map `channels` existiert, sind nur aufgeführte Kanäle erlaubt
    - Verhalten von `requireMention` und Mention-Muster prüfen

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention auf false gesetzt, aber weiterhin blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder im Kanaleintrag stehen)
    - Sender durch Guild-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Handler haben Timeouts oder doppelte Antworten">

    Typische Logs:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Schalter für das Listener-Budget:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Schalter für das Worker-Run-Timeout:

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

    Verwenden Sie `eventQueue.listenerTimeout` für langsames Listener-Setup und `inboundWorker.runTimeoutMs`
    nur dann, wenn Sie ein separates Sicherheitsventil für in die Warteschlange gestellte Agent-Turns möchten.

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Berechtigungsprüfungen mit `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann das Runtime-Matching weiterhin funktionieren, aber die Probe kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="DM- und Kopplungsprobleme">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (Legacy: `channels.discord.dm.policy`)
    - Warten auf Genehmigung der Kopplung im Modus `pairing`

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strenge Mention- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

  </Accordion>

  <Accordion title="Voice-STT-Aussetzer mit DecryptionFailed(...)">

    - Halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für den Empfang von Discord-Voice vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - starten Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie nur bei Bedarf an
    - beobachten Sie die Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn die Fehler nach dem automatischen erneuten Beitritt weiterhin auftreten, sammeln Sie Logs und vergleichen Sie sie mit [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Configuration reference - Discord](/de/gateway/configuration-reference#discord)

Wichtige Discord-Felder:

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Event-Warteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Inbound-Worker: `inboundWorker.runTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (Legacy-Alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` begrenzt ausgehende Discord-Uploads (Standard: `100MB`)
- Aktionen: `actions.*`
- Presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberstes `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn der Bereitstellungs-/Statuszustand von Befehlen veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Kanal-Routing](/de/channels/channel-routing)
- [Sicherheit](/de/gateway/security)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
- [Slash-Befehle](/de/tools/slash-commands)
