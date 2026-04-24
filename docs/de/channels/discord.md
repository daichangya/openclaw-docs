---
read_when:
    - Arbeiten an Discord-Kanalfunktionen
summary: Supportstatus, Fähigkeiten und Konfiguration von Discord-Bots
title: Discord
x-i18n:
    generated_at: "2026-04-24T06:26:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce73e0e6995702f3b2453b2e5ab4e55b02190e64fdf5805f53b4002be63140a2
    source_path: channels/discord.md
    workflow: 15
---

Bereit für DMs und Guild-Kanäle über das offizielle Discord-Gateway.

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

## Schnelleinrichtung

Sie müssen eine neue Anwendung mit einem Bot erstellen, den Bot zu Ihrem Server hinzufügen und ihn mit OpenClaw koppeln. Wir empfehlen, Ihren Bot zu Ihrem eigenen privaten Server hinzuzufügen. Falls Sie noch keinen haben, [erstellen Sie zuerst einen](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (wählen Sie **Create My Own > For me and my friends**).

<Steps>
  <Step title="Eine Discord-Anwendung und einen Bot erstellen">
    Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications) und klicken Sie auf **New Application**. Geben Sie ihr einen Namen wie „OpenClaw“.

    Klicken Sie in der Seitenleiste auf **Bot**. Setzen Sie den **Username** auf den Namen, den Sie für Ihren OpenClaw-Agenten verwenden.

  </Step>

  <Step title="Privilegierte Intents aktivieren">
    Scrollen Sie weiterhin auf der Seite **Bot** nach unten zu **Privileged Gateway Intents** und aktivieren Sie:

    - **Message Content Intent** (erforderlich)
    - **Server Members Intent** (empfohlen; erforderlich für Rollen-Allowlists und Namens-zu-ID-Abgleich)
    - **Presence Intent** (optional; nur für Präsenzaktualisierungen erforderlich)

  </Step>

  <Step title="Ihren Bot-Token kopieren">
    Scrollen Sie auf der Seite **Bot** wieder nach oben und klicken Sie auf **Reset Token**.

    <Note>
    Trotz des Namens wird dadurch Ihr erster Token erzeugt — es wird nichts „zurückgesetzt“.
    </Note>

    Kopieren Sie den Token und speichern Sie ihn an einem sicheren Ort. Das ist Ihr **Bot Token** und Sie benötigen ihn gleich.

  </Step>

  <Step title="Eine Einladungs-URL generieren und den Bot zu Ihrem Server hinzufügen">
    Klicken Sie in der Seitenleiste auf **OAuth2**. Sie erstellen eine Einladungs-URL mit den richtigen Berechtigungen, um den Bot zu Ihrem Server hinzuzufügen.

    Scrollen Sie nach unten zu **OAuth2 URL Generator** und aktivieren Sie:

    - `bot`
    - `applications.commands`

    Darunter erscheint ein Abschnitt **Bot Permissions**. Aktivieren Sie mindestens:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (optional)

    Dies ist die Basismenge für normale Textkanäle. Wenn Sie in Discord-Threads posten möchten, einschließlich Forum- oder Medienkanal-Workflows, die einen Thread erstellen oder fortsetzen, aktivieren Sie zusätzlich **Send Messages in Threads**.
    Kopieren Sie die unten generierte URL, fügen Sie sie in Ihren Browser ein, wählen Sie Ihren Server aus und klicken Sie auf **Continue**, um die Verbindung herzustellen. Sie sollten Ihren Bot nun im Discord-Server sehen.

  </Step>

  <Step title="Developer Mode aktivieren und Ihre IDs erfassen">
    Zurück in der Discord-App müssen Sie den Developer Mode aktivieren, damit Sie interne IDs kopieren können.

    1. Klicken Sie auf **User Settings** (Zahnradsymbol neben Ihrem Avatar) → **Advanced** → aktivieren Sie **Developer Mode**
    2. Klicken Sie in der Seitenleiste mit der rechten Maustaste auf Ihr **Serversymbol** → **Copy Server ID**
    3. Klicken Sie mit der rechten Maustaste auf Ihren **eigenen Avatar** → **Copy User ID**

    Speichern Sie Ihre **Server ID** und **User ID** zusammen mit Ihrem Bot Token — Sie senden alle drei im nächsten Schritt an OpenClaw.

  </Step>

  <Step title="DMs von Servermitgliedern erlauben">
    Damit die Kopplung funktioniert, muss Discord Ihrem Bot erlauben, Ihnen DMs zu senden. Klicken Sie mit der rechten Maustaste auf Ihr **Serversymbol** → **Privacy Settings** → aktivieren Sie **Direct Messages**.

    Dadurch können Servermitglieder (einschließlich Bots) Ihnen DMs senden. Lassen Sie dies aktiviert, wenn Sie Discord-DMs mit OpenClaw verwenden möchten. Wenn Sie nur Guild-Kanäle verwenden möchten, können Sie DMs nach der Kopplung deaktivieren.

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

    Wenn OpenClaw bereits als Hintergrunddienst läuft, starten Sie es über die OpenClaw-Mac-App oder durch Stoppen und erneutes Starten des Prozesses `openclaw gateway run` neu.

  </Step>

  <Step title="OpenClaw konfigurieren und koppeln">

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        Chatten Sie mit Ihrem OpenClaw-Agenten über einen vorhandenen Kanal (z. B. Telegram) und teilen Sie es ihm mit. Wenn Discord Ihr erster Kanal ist, verwenden Sie stattdessen den Tab CLI / config.

        > „Ich habe meinen Discord-Bot-Token bereits in der Konfiguration gesetzt. Bitte schließe die Discord-Einrichtung mit der User ID `<user_id>` und der Server ID `<server_id>` ab.“
      </Tab>
      <Tab title="CLI / config">
        Wenn Sie dateibasierte Konfiguration bevorzugen, setzen Sie Folgendes:

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
      <Tab title="Ihren Agenten fragen">
        Senden Sie den Kopplungscode an Ihren Agenten über Ihren vorhandenen Kanal:

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

    Sie sollten jetzt in der Lage sein, per DM in Discord mit Ihrem Agenten zu chatten.

  </Step>
</Steps>

<Note>
Die Token-Auflösung ist kontobewusst. Token-Werte in der Konfiguration haben Vorrang vor Env-Fallback. `DISCORD_BOT_TOKEN` wird nur für das Standardkonto verwendet.
Für erweiterte ausgehende Aufrufe (Nachrichten-Tool-/Kanalaktionen) wird ein expliziter aufrufbezogener `token` für diesen Aufruf verwendet. Das gilt für Sende- sowie Lese-/Probe-artige Aktionen (zum Beispiel read/search/fetch/thread/pins/permissions). Kontorichtlinien/Wiederholungseinstellungen stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
</Note>

## Empfohlen: Einen Guild-Workspace einrichten

Sobald DMs funktionieren, können Sie Ihren Discord-Server als vollständigen Workspace einrichten, in dem jeder Kanal seine eigene Agentensitzung mit eigenem Kontext erhält. Dies wird für private Server empfohlen, auf denen nur Sie und Ihr Bot aktiv sind.

<Steps>
  <Step title="Ihren Server zur Guild-Allowlist hinzufügen">
    Dadurch kann Ihr Agent in jedem Kanal auf Ihrem Server antworten, nicht nur in DMs.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
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
      <Tab title="Ihren Agenten fragen">
        > „Erlaube meinem Agenten, auf diesem Server zu antworten, ohne dass er per @ erwähnt werden muss“
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

  <Step title="Speicher für Guild-Kanäle einplanen">
    Standardmäßig wird der Langzeitspeicher (`MEMORY.md`) nur in DM-Sitzungen geladen. Guild-Kanäle laden `MEMORY.md` nicht automatisch.

    <Tabs>
      <Tab title="Ihren Agenten fragen">
        > „Wenn ich in Discord-Kanälen Fragen stelle, verwende `memory_search` oder `memory_get`, wenn du langfristigen Kontext aus `MEMORY.md` benötigst.“
      </Tab>
      <Tab title="Manuell">
        Wenn Sie in jedem Kanal gemeinsamen Kontext benötigen, legen Sie die stabilen Anweisungen in `AGENTS.md` oder `USER.md` ab (sie werden in jede Sitzung eingefügt). Behalten Sie langfristige Notizen in `MEMORY.md` und greifen Sie bei Bedarf mit Speicher-Tools darauf zu.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Erstellen Sie nun einige Kanäle auf Ihrem Discord-Server und beginnen Sie mit dem Chatten. Ihr Agent kann den Kanalnamen sehen, und jeder Kanal erhält seine eigene isolierte Sitzung — so können Sie `#coding`, `#home`, `#research` oder alles andere einrichten, was zu Ihrem Workflow passt.

## Runtime-Modell

- Das Gateway besitzt die Discord-Verbindung.
- Das Antwort-Routing ist deterministisch: eingehende Discord-Antworten gehen zurück an Discord.
- Standardmäßig (`session.dmScope=main`) teilen direkte Chats die Hauptsitzung des Agenten (`agent:main:main`).
- Guild-Kanäle sind isolierte Sitzungsschlüssel (`agent:<agentId>:discord:channel:<channelId>`).
- Gruppen-DMs werden standardmäßig ignoriert (`channels.discord.dm.groupEnabled=false`).
- Native Slash-Befehle laufen in isolierten Befehlssitzungen (`agent:<agentId>:discord:slash:<userId>`), während weiterhin `CommandTargetSessionKey` zur gerouteten Konversationssitzung mitgeführt wird.

## Forum-Kanäle

Discord-Forum- und Medienkanäle akzeptieren nur Thread-Beiträge. OpenClaw unterstützt zwei Möglichkeiten, diese zu erstellen:

- Senden Sie eine Nachricht an das Forum-Parent (`channel:<forumId>`), um automatisch einen Thread zu erstellen. Der Thread-Titel verwendet die erste nicht-leere Zeile Ihrer Nachricht.
- Verwenden Sie `openclaw message thread create`, um einen Thread direkt zu erstellen. Übergeben Sie für Forum-Kanäle nicht `--message-id`.

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

OpenClaw unterstützt Discord-Komponenten-v2-Container für Agentennachrichten. Verwenden Sie das Nachrichten-Tool mit einer `components`-Payload. Interaktionsergebnisse werden als normale eingehende Nachrichten an den Agenten zurückgeleitet und folgen den vorhandenen Discord-Einstellungen für `replyToMode`.

Unterstützte Blöcke:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Aktionszeilen erlauben bis zu 5 Schaltflächen oder ein einzelnes Auswahlmenü
- Auswahltypen: `string`, `user`, `role`, `mentionable`, `channel`

Standardmäßig sind Komponenten einmalig verwendbar. Setzen Sie `components.reusable=true`, um Schaltflächen, Auswahlen und Formulare mehrfach verwendbar zu machen, bis sie ablaufen.

Um einzuschränken, wer auf eine Schaltfläche klicken darf, setzen Sie `allowedUsers` auf dieser Schaltfläche (Discord-Benutzer-IDs, Tags oder `*`). Wenn dies konfiguriert ist, erhalten nicht passende Benutzer eine ephemere Ablehnung.

Die Slash-Befehle `/model` und `/models` öffnen eine interaktive Modellauswahl mit Dropdowns für Provider und Modell sowie einem Submit-Schritt. Sofern `commands.modelsWrite=false` nicht gesetzt ist, unterstützt `/models add` auch das Hinzufügen eines neuen Provider-/Modelleintrags aus dem Chat heraus, und neu hinzugefügte Modelle erscheinen ohne Neustart des Gateway. Die Antwort der Auswahl ist ephemer, und nur der aufrufende Benutzer kann sie verwenden.

Dateianhänge:

- `file`-Blöcke müssen auf eine Anhangsreferenz zeigen (`attachment://<filename>`)
- Stellen Sie den Anhang über `media`/`path`/`filePath` bereit (einzelne Datei); verwenden Sie `media-gallery` für mehrere Dateien
- Verwenden Sie `filename`, um den Upload-Namen zu überschreiben, wenn er mit der Anhangsreferenz übereinstimmen soll

Modale Formulare:

- Fügen Sie `components.modal` mit bis zu 5 Feldern hinzu
- Feldtypen: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw fügt automatisch eine Trigger-Schaltfläche hinzu

Beispiel:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optionaler Fallback-Text",
  components: {
    reusable: true,
    text: "Wählen Sie einen Pfad",
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
          placeholder: "Wählen Sie eine Option",
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
    `channels.discord.dmPolicy` steuert den DM-Zugriff (veraltet: `channels.discord.dm.policy`):

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.discord.allowFrom` `"*"` enthält; veraltet: `channels.discord.dm.allowFrom`)
    - `disabled`

    Wenn die DM-Richtlinie nicht auf `open` gesetzt ist, werden unbekannte Benutzer blockiert (oder im Modus `pairing` zur Kopplung aufgefordert).

    Vorrang bei mehreren Konten:

    - `channels.discord.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.discord.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.discord.accounts.default.allowFrom`.

    DM-Zielformat für die Zustellung:

    - `user:<id>`
    - `<@id>`-Erwähnung

    Reine numerische IDs sind mehrdeutig und werden abgelehnt, sofern nicht ausdrücklich eine Benutzer-/Kanal-Zielart angegeben wird.

  </Tab>

  <Tab title="Guild-Richtlinie">
    Die Behandlung von Guilds wird durch `channels.discord.groupPolicy` gesteuert:

    - `open`
    - `allowlist`
    - `disabled`

    Die sichere Basislinie, wenn `channels.discord` vorhanden ist, ist `allowlist`.

    Verhalten von `allowlist`:

    - Die Guild muss mit `channels.discord.guilds` übereinstimmen (`id` bevorzugt, Slug akzeptiert)
    - optionale Sender-Allowlists: `users` (stabile IDs empfohlen) und `roles` (nur Rollen-IDs); wenn eine davon konfiguriert ist, sind Sender erlaubt, wenn sie mit `users` ODER `roles` übereinstimmen
    - direkter Namens-/Tag-Abgleich ist standardmäßig deaktiviert; aktivieren Sie `channels.discord.dangerouslyAllowNameMatching: true` nur als Break-Glass-Kompatibilitätsmodus
    - Namen/Tags werden für `users` unterstützt, aber IDs sind sicherer; `openclaw security audit` warnt, wenn Namens-/Tag-Einträge verwendet werden
    - wenn für eine Guild `channels` konfiguriert ist, werden nicht aufgeführte Kanäle verweigert
    - wenn eine Guild keinen `channels`-Block hat, sind alle Kanäle in dieser allowlisteten Guild erlaubt

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

    Wenn Sie nur `DISCORD_BOT_TOKEN` setzen und keinen `channels.discord`-Block erstellen, ist das Runtime-Fallback `groupPolicy="allowlist"` (mit einer Warnung in den Logs), selbst wenn `channels.defaults.groupPolicy` auf `open` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen und Gruppen-DMs">
    Nachrichten in Guilds sind standardmäßig an Erwähnungen gebunden.

    Die Erkennung von Erwähnungen umfasst:

    - explizite Bot-Erwähnung
    - konfigurierte Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Verhalten in unterstützten Fällen

    `requireMention` wird pro Guild/Kanal konfiguriert (`channels.discord.guilds...`).
    `ignoreOtherMentions` verwirft optional Nachrichten, die einen anderen Benutzer/eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).

    Gruppen-DMs:

    - Standard: ignoriert (`dm.groupEnabled=false`)
    - optionale Allowlist über `dm.groupChannels` (Kanal-IDs oder Slugs)

  </Tab>
</Tabs>

### Rollenbasiertes Agenten-Routing

Verwenden Sie `bindings[].match.roles`, um Discord-Guild-Mitglieder anhand der Rollen-ID an unterschiedliche Agenten weiterzuleiten. Rollenbasierte Bindings akzeptieren nur Rollen-IDs und werden nach Peer- oder Parent-Peer-Bindings und vor reinen Guild-Bindings ausgewertet. Wenn ein Binding auch andere Match-Felder setzt (zum Beispiel `peer` + `guildId` + `roles`), müssen alle konfigurierten Felder übereinstimmen.

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

## Native Befehle und Befehlsauthentifizierung

- `commands.native` ist standardmäßig `"auto"` und für Discord aktiviert.
- Überschreibung pro Kanal: `channels.discord.commands.native`.
- `commands.native=false` entfernt ausdrücklich zuvor registrierte native Discord-Befehle.
- Die Authentifizierung nativer Befehle verwendet dieselben Discord-Allowlists/-Richtlinien wie die normale Nachrichtenverarbeitung.
- Befehle können in der Discord-Benutzeroberfläche weiterhin für nicht autorisierte Benutzer sichtbar sein; die Ausführung erzwingt dennoch OpenClaw-Authentifizierung und gibt „not authorized“ zurück.

Siehe [Slash-Befehle](/de/tools/slash-commands) für Befehlskatalog und Verhalten.

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
    - `batched`

    Hinweis: `off` deaktiviert implizites Antwort-Threading. Explizite Tags `[[reply_to_*]]` werden weiterhin berücksichtigt.
    `first` hängt immer die implizite native Antwortreferenz an die erste ausgehende Discord-Nachricht des Turns an.
    `batched` hängt die implizite native Antwortreferenz von Discord nur an, wenn der
    eingehende Turn ein entprellter Stapel aus mehreren Nachrichten war. Das ist nützlich,
    wenn Sie native Antworten hauptsächlich für mehrdeutige, stoßweise Chats möchten und nicht für jeden
    einzelnen Nachrichtenturn.

    Nachrichten-IDs werden im Kontext/Verlauf sichtbar gemacht, damit Agenten bestimmte Nachrichten ansprechen können.

  </Accordion>

  <Accordion title="Live-Stream-Vorschau">
    OpenClaw kann Entwurfsantworten streamen, indem eine temporäre Nachricht gesendet und bearbeitet wird, während Text eintrifft. `channels.discord.streaming` akzeptiert `off` (Standard) | `partial` | `block` | `progress`. `progress` wird auf Discord auf `partial` abgebildet; `streamMode` ist ein veralteter Alias und wird automatisch migriert.

    Der Standard bleibt `off`, weil Vorschau-Bearbeitungen in Discord schnell an Rate-Limits stoßen, wenn mehrere Bots oder Gateways sich ein Konto teilen.

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

    - `partial` bearbeitet eine einzelne Vorschaunachricht, während Tokens eintreffen.
    - `block` gibt Entwurfsblöcke in passender Größe aus (verwenden Sie `draftChunk`, um Größe und Umbruchpunkte anzupassen, begrenzt auf `textChunkLimit`).
    - Medien-, Fehler- und explizite Antwort-Finals brechen ausstehende Vorschau-Bearbeitungen ab.
    - `streaming.preview.toolProgress` (Standard `true`) steuert, ob Tool-/Fortschrittsaktualisierungen die Vorschaunachricht wiederverwenden.

    Vorschau-Streaming ist nur für Text; Medienantworten fallen auf normale Zustellung zurück. Wenn `block`-Streaming ausdrücklich aktiviert ist, überspringt OpenClaw den Vorschau-Stream, um doppeltes Streaming zu vermeiden.

  </Accordion>

  <Accordion title="Verlauf, Kontext und Thread-Verhalten">
    Guild-Verlaufskontext:

    - `channels.discord.historyLimit` Standard `20`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Steuerung des DM-Verlaufs:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread-Verhalten:

    - Discord-Threads werden als Kanalsitzungen geroutet und übernehmen die Konfiguration des übergeordneten Kanals, sofern sie nicht überschrieben wird.
    - `channels.discord.thread.inheritParent` (Standard `false`) aktiviert für neue Auto-Threads die Initialisierung aus dem Transkript des übergeordneten Kanals. Überschreibungen pro Konto befinden sich unter `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaktionen des Nachrichten-Tools können `user:<id>`-DM-Ziele auflösen.
    - `guilds.<guild>.channels.<channel>.requireMention: false` bleibt beim Aktivierungs-Fallback in der Antwortphase erhalten.

    Kanalthemen werden als **nicht vertrauenswürdiger** Kontext eingefügt. Allowlists steuern, wer den Agenten auslösen kann, sind aber keine vollständige Grenze zur Redigierung ergänzender Kontexte.

  </Accordion>

  <Accordion title="Thread-gebundene Sitzungen für Subagenten">
    Discord kann einen Thread an ein Sitzungsziel binden, sodass Folgemeldungen in diesem Thread weiterhin an dieselbe Sitzung geroutet werden (einschließlich Subagenten-Sitzungen).

    Befehle:

    - `/focus <target>` bindet den aktuellen/neuen Thread an ein Subagent-/Sitzungsziel
    - `/unfocus` entfernt die aktuelle Thread-Bindung
    - `/agents` zeigt aktive Ausführungen und den Bindungsstatus an
    - `/session idle <duration|off>` prüft/aktualisiert das automatische Entfokussieren bei Inaktivität für fokussierte Bindungen
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
        spawnSubagentSessions: false, // optional aktivieren
      },
    },
  },
}
```

    Hinweise:

    - `session.threadBindings.*` legt globale Standardwerte fest.
    - `channels.discord.threadBindings.*` überschreibt das Discord-Verhalten.
    - `spawnSubagentSessions` muss auf `true` gesetzt sein, um Threads für `sessions_spawn({ thread: true })` automatisch zu erstellen/zu binden.
    - `spawnAcpSessions` muss auf `true` gesetzt sein, um Threads für ACP (`/acp spawn ... --thread ...` oder `sessions_spawn({ runtime: "acp", thread: true })`) automatisch zu erstellen/zu binden.
    - Wenn Thread-Bindungen für ein Konto deaktiviert sind, sind `/focus` und verwandte Thread-Bindungsvorgänge nicht verfügbar.

    Siehe [Sub-Agents](/de/tools/subagents), [ACP Agents](/de/tools/acp-agents) und [Konfigurationsreferenz](/de/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistente ACP-Kanal-Bindungen">
    Für stabile „always-on“-ACP-Workspaces konfigurieren Sie typisierte ACP-Bindungen auf oberster Ebene, die auf Discord-Konversationen abzielen.

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

    - `/acp spawn codex --bind here` bindet den aktuellen Kanal oder Thread direkt und hält zukünftige Nachrichten in derselben ACP-Sitzung. Thread-Nachrichten übernehmen die Bindung des übergeordneten Kanals.
    - In einem gebundenen Kanal oder Thread setzen `/new` und `/reset` dieselbe ACP-Sitzung direkt zurück. Temporäre Thread-Bindungen können die Zielauflösung überschreiben, solange sie aktiv sind.
    - `spawnAcpSessions` ist nur erforderlich, wenn OpenClaw einen untergeordneten Thread über `--thread auto|here` erstellen/binden muss.

    Siehe [ACP Agents](/de/tools/acp-agents) für Details zum Bindungsverhalten.

  </Accordion>

  <Accordion title="Reaktionsbenachrichtigungen">
    Reaktionsbenachrichtigungsmodus pro Guild:

    - `off`
    - `own` (Standard)
    - `all`
    - `allowlist` (verwendet `guilds.<id>.users`)

    Reaktionsereignisse werden in Systemereignisse umgewandelt und an die geroutete Discord-Sitzung angehängt.

  </Accordion>

  <Accordion title="Bestätigungsreaktionen">
    `ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

    Auflösungsreihenfolge:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - Fallback auf Agenten-Identitäts-Emoji (`agents.list[].identity.emoji`, sonst "👀")

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
    Leiten Sie Discord-Gateway-WebSocket-Datenverkehr und REST-Abfragen beim Start (Anwendungs-ID + Allowlist-Auflösung) mit `channels.discord.proxy` über einen HTTP(S)-Proxy.

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
    Aktivieren Sie die PluralKit-Auflösung, um weitergeleitete Nachrichten der Identität eines Systemmitglieds zuzuordnen:

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
    - Anzeigenamen von Mitgliedern werden nur dann anhand von Name/Slug abgeglichen, wenn `channels.discord.dangerouslyAllowNameMatching: true`
    - Abfragen verwenden die ursprüngliche Nachrichten-ID und sind auf ein Zeitfenster beschränkt
    - wenn die Abfrage fehlschlägt, werden weitergeleitete Nachrichten als Bot-Nachrichten behandelt und verworfen, sofern nicht `allowBots=true`

  </Accordion>

  <Accordion title="Präsenzkonfiguration">
    Präsenzaktualisierungen werden angewendet, wenn Sie einen Status oder ein Aktivitätsfeld setzen oder die automatische Präsenz aktivieren.

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

    Beispiel für automatische Präsenz (Laufzeit-Gesundheitssignal):

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

    Die automatische Präsenz ordnet die Runtime-Verfügbarkeit dem Discord-Status zu: healthy => online, degraded oder unknown => idle, exhausted oder unavailable => dnd. Optionale Textüberschreibungen:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (unterstützt den Platzhalter `{reason}`)

  </Accordion>

  <Accordion title="Genehmigungen in Discord">
    Discord unterstützt schaltflächenbasierte Genehmigungsverarbeitung in DMs und kann Genehmigungsaufforderungen optional im Ursprungskanal veröffentlichen.

    Konfigurationspfad:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein Genehmigender aufgelöst werden kann, entweder aus `execApprovals.approvers` oder aus `commands.ownerAllowFrom`. Discord leitet Exec-Genehmigende nicht aus Kanal-`allowFrom`, veraltetem `dm.allowFrom` oder Direktnachrichten-`defaultTo` ab. Setzen Sie `enabled: false`, um Discord ausdrücklich als nativen Genehmigungs-Client zu deaktivieren.

    Wenn `target` auf `channel` oder `both` gesetzt ist, ist die Genehmigungsaufforderung im Kanal sichtbar. Nur aufgelöste Genehmigende können die Schaltflächen verwenden; andere Benutzer erhalten eine ephemere Ablehnung. Genehmigungsaufforderungen enthalten den Befehlstext, daher sollten Sie die Zustellung im Kanal nur in vertrauenswürdigen Kanälen aktivieren. Wenn die Kanal-ID nicht aus dem Sitzungsschlüssel abgeleitet werden kann, fällt OpenClaw auf DM-Zustellung zurück.

    Discord rendert außerdem die gemeinsamen Genehmigungsschaltflächen, die von anderen Chat-Kanälen verwendet werden. Der native Discord-Adapter ergänzt hauptsächlich das DM-Routing für Genehmigende und das Fanout in Kanäle.
    Wenn diese Schaltflächen vorhanden sind, sind sie die primäre UX für Genehmigungen; OpenClaw
    sollte einen manuellen `/approve`-Befehl nur dann einfügen, wenn das Tool-Ergebnis angibt,
    dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

    Gateway-Authentifizierung und Genehmigungsauflösung folgen dem gemeinsamen Gateway-Client-Vertrag (`plugin:`-IDs werden über `plugin.approval.resolve` aufgelöst; andere IDs über `exec.approval.resolve`). Genehmigungen laufen standardmäßig nach 30 Minuten ab.

    Siehe [Exec approvals](/de/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tools und Aktionsschranken

Discord-Nachrichtenaktionen umfassen Nachrichtenversand, Kanaladministration, Moderation, Präsenz- und Metadatenaktionen.

Zentrale Beispiele:

- Nachrichten: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- Reaktionen: `react`, `reactions`, `emojiList`
- Moderation: `timeout`, `kick`, `ban`
- Präsenz: `setPresence`

Die Aktion `event-create` akzeptiert einen optionalen Parameter `image` (URL oder lokaler Dateipfad), um das Titelbild des geplanten Ereignisses zu setzen.

Aktionsschranken befinden sich unter `channels.discord.actions.*`.

Standardverhalten der Schranken:

| Action group                                                                                                                                                             | Standard |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktiviert |
| roles                                                                                                                                                                    | deaktiviert |
| moderation                                                                                                                                                               | deaktiviert |
| presence                                                                                                                                                                 | deaktiviert |

## Components-v2-UI

OpenClaw verwendet Discord-Komponenten v2 für Exec-Genehmigungen und kanalübergreifende Markierungen. Discord-Nachrichtenaktionen können auch `components` für benutzerdefinierte UI akzeptieren (erweitert; erfordert das Erstellen einer Komponenten-Payload über das Discord-Tool), während veraltete `embeds` weiterhin verfügbar, aber nicht empfohlen sind.

- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe, die für Discord-Komponenten-Container verwendet wird (hex).
- Pro Konto mit `channels.discord.accounts.<id>.ui.components.accentColor` setzen.
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

## Sprache

Discord hat zwei unterschiedliche Sprachoberflächen: Echtzeit-**Sprachkanäle** (fortlaufende Gespräche) und **Sprachnachrichtenanhänge** (das Format mit Wellenformvorschau). Das Gateway unterstützt beide.

### Sprachkanäle

Anforderungen:

- Aktivieren Sie native Befehle (`commands.native` oder `channels.discord.commands.native`).
- Konfigurieren Sie `channels.discord.voice`.
- Der Bot benötigt die Berechtigungen Connect und Speak im Ziel-Sprachkanal.

Verwenden Sie `/vc join|leave|status`, um Sitzungen zu steuern. Der Befehl verwendet den Standard-Agenten des Kontos und folgt denselben Allowlist- und Gruppenrichtlinienregeln wie andere Discord-Befehle.

Beispiel für automatisches Beitreten:

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
- Sprachtranskript-Turns leiten den Eigentümerstatus aus Discord-`allowFrom` (oder `dm.allowFrom`) ab; Sprecher, die nicht Eigentümer sind, können nicht auf nur für Eigentümer bestimmte Tools zugreifen (zum Beispiel `gateway` und `cron`).
- Sprache ist standardmäßig aktiviert; setzen Sie `channels.discord.voice.enabled=false`, um sie zu deaktivieren.
- `voice.daveEncryption` und `voice.decryptionFailureTolerance` werden an die Join-Optionen von `@discordjs/voice` durchgereicht.
- Die Standardwerte von `@discordjs/voice` sind `daveEncryption=true` und `decryptionFailureTolerance=24`, wenn sie nicht gesetzt sind.
- OpenClaw überwacht außerdem Entschlüsselungsfehler beim Empfang und stellt die Verbindung automatisch wieder her, indem der Sprachkanal nach wiederholten Fehlern in einem kurzen Zeitfenster verlassen und erneut betreten wird.
- Wenn Empfangslogs wiederholt `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` anzeigen, kann dies der Upstream-Empfangsfehler von `@discordjs/voice` sein, der in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) verfolgt wird.

### Sprachnachrichten

Discord-Sprachnachrichten zeigen eine Wellenformvorschau an und erfordern OGG/Opus-Audio. OpenClaw erzeugt die Wellenform automatisch, benötigt dafür aber `ffmpeg` und `ffprobe` auf dem Gateway-Host zur Analyse und Konvertierung.

- Geben Sie einen **lokalen Dateipfad** an (URLs werden abgelehnt).
- Lassen Sie Textinhalt weg (Discord lehnt Text + Sprachnachricht in derselben Payload ab).
- Jedes Audioformat wird akzeptiert; OpenClaw konvertiert bei Bedarf zu OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht erlaubte Intents verwendet oder der Bot sieht keine Guild-Nachrichten">

    - aktivieren Sie Message Content Intent
    - aktivieren Sie Server Members Intent, wenn Sie von Benutzer-/Mitgliedsauflösung abhängen
    - starten Sie das Gateway nach dem Ändern der Intents neu

  </Accordion>

  <Accordion title="Guild-Nachrichten unerwartet blockiert">

    - überprüfen Sie `groupPolicy`
    - überprüfen Sie die Guild-Allowlist unter `channels.discord.guilds`
    - wenn die Guild-Map `channels` existiert, sind nur aufgeführte Kanäle erlaubt
    - überprüfen Sie das Verhalten von `requireMention` und Erwähnungsmuster

    Nützliche Prüfungen:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention ist false, aber trotzdem blockiert">
    Häufige Ursachen:

    - `groupPolicy="allowlist"` ohne passende Guild-/Kanal-Allowlist
    - `requireMention` an der falschen Stelle konfiguriert (muss unter `channels.discord.guilds` oder im Kanaleintrag stehen)
    - Absender durch Guild-/Kanal-`users`-Allowlist blockiert

  </Accordion>

  <Accordion title="Lang laufende Handler überschreiten das Zeitlimit oder erzeugen doppelte Antworten">

    Typische Logs:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Stellschraube für das Listener-Budget:

    - Einzelkonto: `channels.discord.eventQueue.listenerTimeout`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Stellschraube für das Worker-Ausführungszeitlimit:

    - Einzelkonto: `channels.discord.inboundWorker.runTimeoutMs`
    - Mehrere Konten: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - Standard: `1800000` (30 Minuten); setzen Sie `0`, um es zu deaktivieren

    Empfohlene Basislinie:

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

    Verwenden Sie `eventQueue.listenerTimeout` für langsame Listener-Initialisierung und `inboundWorker.runTimeoutMs`
    nur dann, wenn Sie ein separates Sicherheitsventil für in die Warteschlange eingereihte Agent-Turns möchten.

  </Accordion>

  <Accordion title="Abweichungen bei der Berechtigungsprüfung">
    Berechtigungsprüfungen von `channels status --probe` funktionieren nur für numerische Kanal-IDs.

    Wenn Sie Slug-Schlüssel verwenden, kann das Runtime-Matching weiterhin funktionieren, aber die Probe kann Berechtigungen nicht vollständig verifizieren.

  </Accordion>

  <Accordion title="Probleme mit DMs und Kopplung">

    - DM deaktiviert: `channels.discord.dm.enabled=false`
    - DM-Richtlinie deaktiviert: `channels.discord.dmPolicy="disabled"` (veraltet: `channels.discord.dm.policy`)
    - ausstehende Kopplungsgenehmigung im Modus `pairing`

  </Accordion>

  <Accordion title="Bot-zu-Bot-Schleifen">
    Standardmäßig werden von Bots verfasste Nachrichten ignoriert.

    Wenn Sie `channels.discord.allowBots=true` setzen, verwenden Sie strikte Erwähnungs- und Allowlist-Regeln, um Schleifenverhalten zu vermeiden.
    Bevorzugen Sie `channels.discord.allowBots="mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen.

  </Accordion>

  <Accordion title="Voice-STT-Aussetzer mit DecryptionFailed(...)">

    - halten Sie OpenClaw aktuell (`openclaw update`), damit die Wiederherstellungslogik für den Empfang von Discord-Sprachdaten vorhanden ist
    - bestätigen Sie `channels.discord.voice.daveEncryption=true` (Standard)
    - starten Sie mit `channels.discord.voice.decryptionFailureTolerance=24` (Upstream-Standard) und passen Sie nur bei Bedarf an
    - beobachten Sie die Logs auf:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - wenn Fehler nach dem automatischen erneuten Beitritt weiterhin auftreten, sammeln Sie Logs und vergleichen Sie sie mit [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Discord](/de/gateway/config-channels#discord).

<Accordion title="Signalstarke Discord-Felder">

- Start/Auth: `enabled`, `token`, `accounts.*`, `allowBots`
- Richtlinie: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- Befehl: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- Ereigniswarteschlange: `eventQueue.listenerTimeout` (Listener-Budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Inbound-Worker: `inboundWorker.runTimeoutMs`
- Antwort/Verlauf: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- Streaming: `streaming` (veralteter Alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- Medien/Wiederholung: `mediaMaxMb` (begrenzt ausgehende Discord-Uploads, Standard `100MB`), `retry`
- Aktionen: `actions.*`
- Präsenz: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- Funktionen: `threadBindings`, oberstes `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicherheit und Betrieb

- Behandeln Sie Bot-Tokens als Geheimnisse (`DISCORD_BOT_TOKEN` wird in überwachten Umgebungen bevorzugt).
- Gewähren Sie Discord-Berechtigungen nach dem Prinzip der geringsten Rechte.
- Wenn Bereitstellung/Zustand von Befehlen veraltet ist, starten Sie das Gateway neu und prüfen Sie erneut mit `openclaw channels status --probe`.

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Discord-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Gruppenchats und Allowlists.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Multi-Agent-Routing" icon="sitemap" href="/de/concepts/multi-agent">
    Ordnen Sie Guilds und Kanäle Agenten zu.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten.
  </Card>
</CardGroup>
