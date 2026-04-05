---
read_when:
    - Arbeiten an Microsoft Teams-Kanalfunktionen
summary: Supportstatus, Funktionen und Konfiguration des Microsoft Teams-Bots
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T12:37:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> „Lasst alle Hoffnung fahren, die ihr hier eintretet.“

Aktualisiert: 2026-01-21

Status: Text und DM-Anhänge werden unterstützt; das Senden von Dateien in Kanälen/Gruppen erfordert `sharePointSiteId` + Graph-Berechtigungen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)). Umfragen werden über Adaptive Cards gesendet. Nachrichtenaktionen stellen ein explizites `upload-file` für Datei-zuerst-Sendungen bereit.

## Bundled plugin

Microsoft Teams wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher
ist in der normalen paketierten Build kein separates Installieren erforderlich.

Wenn Sie eine ältere Build oder eine benutzerdefinierte Installation verwenden, die das gebündelte Teams ausschließt,
installieren Sie es manuell:

```bash
openclaw plugins install @openclaw/msteams
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/tools/plugin)

## Schnelleinrichtung (Anfänger)

1. Stellen Sie sicher, dass das Microsoft Teams-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstellen Sie einen **Azure Bot** (App-ID + Client Secret + Tenant-ID).
3. Konfigurieren Sie OpenClaw mit diesen Anmeldedaten.
4. Stellen Sie `/api/messages` (standardmäßig Port 3978) über eine öffentliche URL oder einen Tunnel bereit.
5. Installieren Sie das Teams-App-Paket und starten Sie das Gateway.

Minimale Konfiguration:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Hinweis: Gruppenchats sind standardmäßig blockiert (`channels.msteams.groupPolicy: "allowlist"`). Um Gruppenantworten zuzulassen, setzen Sie `channels.msteams.groupAllowFrom` (oder verwenden Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen, standardmäßig mit Erwähnungs-Gating).

## Ziele

- Mit OpenClaw über Teams-DMs, Gruppenchats oder Kanäle sprechen.
- Deterministisches Routing beibehalten: Antworten gehen immer an den Kanal zurück, aus dem sie eingegangen sind.
- Standardmäßig sicheres Kanalverhalten verwenden (Erwähnungen erforderlich, sofern nicht anders konfiguriert).

## Konfigurationsschreibvorgänge

Standardmäßig darf Microsoft Teams Konfigurationsaktualisierungen schreiben, die durch `/config set|unset` ausgelöst werden (erfordert `commands.config: true`).

Deaktivieren mit:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Zugriffskontrolle (DMs + Gruppen)

**DM-Zugriff**

- Standard: `channels.msteams.dmPolicy = "pairing"`. Unbekannte Absender werden ignoriert, bis sie genehmigt wurden.
- `channels.msteams.allowFrom` sollte stabile AAD-Objekt-IDs verwenden.
- UPNs/Anzeigenamen sind veränderlich; direkter Abgleich ist standardmäßig deaktiviert und wird nur mit `channels.msteams.dangerouslyAllowNameMatching: true` aktiviert.
- Der Assistent kann Namen über Microsoft Graph zu IDs auflösen, wenn die Anmeldedaten dies erlauben.

**Gruppenzugriff**

- Standard: `channels.msteams.groupPolicy = "allowlist"` (blockiert, außer Sie fügen `groupAllowFrom` hinzu). Verwenden Sie `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn er nicht gesetzt ist.
- `channels.msteams.groupAllowFrom` steuert, welche Absender in Gruppenchats/Kanälen auslösen können (Fallback auf `channels.msteams.allowFrom`).
- Setzen Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen (standardmäßig weiterhin mit Erwähnungs-Gating).
- Um **keine Kanäle** zuzulassen, setzen Sie `channels.msteams.groupPolicy: "disabled"`.

Beispiel:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + Kanal-Allowlist**

- Begrenzen Sie Gruppen-/Kanalantworten, indem Sie Teams und Kanäle unter `channels.msteams.teams` auflisten.
- Schlüssel sollten stabile Team-IDs und Kanal-Konversations-IDs verwenden.
- Wenn `groupPolicy="allowlist"` gesetzt ist und eine Teams-Allowlist vorhanden ist, werden nur aufgelistete Teams/Kanäle akzeptiert (mit Erwähnungs-Gating).
- Der Konfigurationsassistent akzeptiert `Team/Kanal`-Einträge und speichert sie für Sie.
- Beim Start löst OpenClaw Team-/Kanal- und Benutzer-Allowlist-Namen zu IDs auf (wenn Graph-Berechtigungen dies erlauben)
  und protokolliert die Zuordnung; nicht aufgelöste Team-/Kanalnamen werden wie eingegeben beibehalten, aber standardmäßig für das Routing ignoriert, sofern `channels.msteams.dangerouslyAllowNameMatching: true` nicht aktiviert ist.

Beispiel:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## So funktioniert es

1. Stellen Sie sicher, dass das Microsoft Teams-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstellen Sie einen **Azure Bot** (App-ID + Secret + Tenant-ID).
3. Erstellen Sie ein **Teams-App-Paket**, das auf den Bot verweist und die unten stehenden RSC-Berechtigungen enthält.
4. Laden Sie die Teams-App in ein Team hoch/installieren Sie sie dort (oder im persönlichen Bereich für DMs).
5. Konfigurieren Sie `msteams` in `~/.openclaw/openclaw.json` (oder über Umgebungsvariablen) und starten Sie das Gateway.
6. Das Gateway lauscht standardmäßig auf Bot-Framework-Webhook-Datenverkehr unter `/api/messages`.

## Azure Bot-Einrichtung (Voraussetzungen)

Bevor Sie OpenClaw konfigurieren, müssen Sie eine Azure-Bot-Ressource erstellen.

### Schritt 1: Azure Bot erstellen

1. Gehen Sie zu [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Füllen Sie die Registerkarte **Basics** aus:

   | Feld               | Wert                                                     |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Ihr Bot-Name, z. B. `openclaw-msteams` (muss eindeutig sein) |
   | **Subscription**   | Wählen Sie Ihr Azure-Abonnement aus                      |
   | **Resource group** | Neu erstellen oder vorhandene verwenden                  |
   | **Pricing tier**   | **Free** für Entwicklung/Tests                           |
   | **Type of App**    | **Single Tenant** (empfohlen – siehe Hinweis unten)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Abkündigungshinweis:** Das Erstellen neuer Multi-Tenant-Bots wurde nach dem 2025-07-31 eingestellt. Verwenden Sie für neue Bots **Single Tenant**.

3. Klicken Sie auf **Review + create** → **Create** (warten Sie etwa 1–2 Minuten)

### Schritt 2: Anmeldedaten abrufen

1. Gehen Sie zu Ihrer Azure-Bot-Ressource → **Configuration**
2. Kopieren Sie die **Microsoft App ID** → das ist Ihre `appId`
3. Klicken Sie auf **Manage Password** → gehen Sie zur App-Registrierung
4. Unter **Certificates & secrets** → **New client secret** → kopieren Sie den **Value** → das ist Ihr `appPassword`
5. Gehen Sie zu **Overview** → kopieren Sie **Directory (tenant) ID** → das ist Ihre `tenantId`

### Schritt 3: Nachrichtenendpunkt konfigurieren

1. In Azure Bot → **Configuration**
2. Setzen Sie den **Messaging endpoint** auf Ihre Webhook-URL:
   - Produktion: `https://your-domain.com/api/messages`
   - Lokale Entwicklung: Verwenden Sie einen Tunnel (siehe unten [Lokale Entwicklung (Tunneling)](#local-development-tunneling))

### Schritt 4: Teams-Kanal aktivieren

1. In Azure Bot → **Channels**
2. Klicken Sie auf **Microsoft Teams** → Configure → Save
3. Akzeptieren Sie die Nutzungsbedingungen

## Lokale Entwicklung (Tunneling)

Teams kann `localhost` nicht erreichen. Verwenden Sie für die lokale Entwicklung einen Tunnel:

**Option A: ngrok**

```bash
ngrok http 3978
# Copy the https URL, e.g., https://abc123.ngrok.io
# Set messaging endpoint to: https://abc123.ngrok.io/api/messages
```

**Option B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Use your Tailscale funnel URL as the messaging endpoint
```

## Teams Developer Portal (Alternative)

Anstatt manuell eine Manifest-ZIP-Datei zu erstellen, können Sie das [Teams Developer Portal](https://dev.teams.microsoft.com/apps) verwenden:

1. Klicken Sie auf **+ New app**
2. Füllen Sie die grundlegenden Informationen aus (Name, Beschreibung, Entwicklerinformationen)
3. Gehen Sie zu **App features** → **Bot**
4. Wählen Sie **Enter a bot ID manually** und fügen Sie Ihre Azure-Bot-App-ID ein
5. Aktivieren Sie die Bereiche: **Personal**, **Team**, **Group Chat**
6. Klicken Sie auf **Distribute** → **Download app package**
7. In Teams: **Apps** → **Manage your apps** → **Upload a custom app** → wählen Sie die ZIP-Datei aus

Das ist oft einfacher, als JSON-Manifeste von Hand zu bearbeiten.

## Den Bot testen

**Option A: Azure Web Chat (Webhook zuerst verifizieren)**

1. Im Azure-Portal → Ihre Azure-Bot-Ressource → **Test in Web Chat**
2. Senden Sie eine Nachricht – Sie sollten eine Antwort sehen
3. Das bestätigt, dass Ihr Webhook-Endpunkt funktioniert, bevor Sie Teams einrichten

**Option B: Teams (nach Installation der App)**

1. Installieren Sie die Teams-App (Sideload oder Organisationskatalog)
2. Suchen Sie den Bot in Teams und senden Sie eine DM
3. Prüfen Sie die Gateway-Logs auf eingehende Aktivität

## Einrichtung (minimal, nur Text)

1. **Stellen Sie sicher, dass das Microsoft Teams-Plugin verfügbar ist**
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell hinzufügen:
     - Von npm: `openclaw plugins install @openclaw/msteams`
     - Aus einem lokalen Checkout: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Bot-Registrierung**
   - Erstellen Sie einen Azure Bot (siehe oben) und notieren Sie:
     - App-ID
     - Client Secret (App-Passwort)
     - Tenant-ID (Single Tenant)

3. **Teams-App-Manifest**
   - Fügen Sie einen `bot`-Eintrag mit `botId = <App ID>` hinzu.
   - Bereiche: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (erforderlich für Dateiverarbeitung im persönlichen Bereich).
   - Fügen Sie RSC-Berechtigungen hinzu (unten).
   - Erstellen Sie Icons: `outline.png` (32x32) und `color.png` (192x192).
   - Zippen Sie alle drei Dateien zusammen: `manifest.json`, `outline.png`, `color.png`.

4. **OpenClaw konfigurieren**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Sie können auch Umgebungsvariablen anstelle von Konfigurationsschlüsseln verwenden:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Bot-Endpunkt**
   - Setzen Sie den Azure-Bot-Messaging-Endpunkt auf:
     - `https://<host>:3978/api/messages` (oder Ihren gewählten Pfad/Port).

6. **Gateway ausführen**
   - Der Teams-Kanal startet automatisch, wenn das gebündelte oder manuell installierte Plugin verfügbar ist und die `msteams`-Konfiguration mit Anmeldedaten vorhanden ist.

## Aktion für Mitgliederinformationen

OpenClaw stellt für Microsoft Teams eine Graph-gestützte `member-info`-Aktion bereit, damit Agenten und Automatisierungen Details zu Kanalmitgliedern (Anzeigename, E-Mail, Rolle) direkt über Microsoft Graph auflösen können.

Anforderungen:

- `Member.Read.Group` RSC-Berechtigung (bereits im empfohlenen Manifest enthalten)
- Für teamübergreifende Abfragen: `User.Read.All` Graph-Application-Berechtigung mit Admin-Zustimmung

Die Aktion wird durch `channels.msteams.actions.memberInfo` gesteuert (Standard: aktiviert, wenn Graph-Anmeldedaten verfügbar sind).

## Verlaufskontext

- `channels.msteams.historyLimit` steuert, wie viele aktuelle Kanal-/Gruppennachrichten in den Prompt eingebettet werden.
- Fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um dies zu deaktivieren (Standard 50).
- Abgerufener Thread-Verlauf wird durch Absender-Allowlists gefiltert (`allowFrom` / `groupAllowFrom`), sodass die Kontextinitialisierung aus Threads derzeit nur Nachrichten von zugelassenen Absendern enthält.
- Zitierter Anhangskontext (`ReplyTo*`, aus Teams-Antwort-HTML abgeleitet) wird derzeit unverändert weitergegeben.
- Anders ausgedrückt: Allowlists steuern, wer den Agenten auslösen kann; nur bestimmte ergänzende Kontextpfade werden heute gefiltert.
- DM-Verlauf kann mit `channels.msteams.dmHistoryLimit` begrenzt werden (Benutzer-Turns). Überschreibungen pro Benutzer: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktuelle Teams-RSC-Berechtigungen (Manifest)

Dies sind die **bestehenden resourceSpecific-Berechtigungen** in unserem Teams-App-Manifest. Sie gelten nur innerhalb des Teams/Chats, in dem die App installiert ist.

**Für Kanäle (Team-Bereich):**

- `ChannelMessage.Read.Group` (Application) - alle Kanalnachrichten ohne @-Erwähnung empfangen
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Für Gruppenchats:**

- `ChatMessage.Read.Chat` (Application) - alle Gruppenchats-Nachrichten ohne @-Erwähnung empfangen

## Beispiel für ein Teams-Manifest (geschwärzt)

Minimales, gültiges Beispiel mit den erforderlichen Feldern. Ersetzen Sie IDs und URLs.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Hinweise zum Manifest (Pflichtfelder)

- `bots[].botId` **muss** exakt mit der Azure-Bot-App-ID übereinstimmen.
- `webApplicationInfo.id` **muss** exakt mit der Azure-Bot-App-ID übereinstimmen.
- `bots[].scopes` muss die Oberflächen enthalten, die Sie verwenden möchten (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` ist für Dateiverarbeitung im persönlichen Bereich erforderlich.
- `authorization.permissions.resourceSpecific` muss Lese-/Sende-Berechtigungen für Kanäle enthalten, wenn Sie Kanalverkehr möchten.

### Aktualisieren einer bestehenden App

So aktualisieren Sie eine bereits installierte Teams-App (z. B. zum Hinzufügen von RSC-Berechtigungen):

1. Aktualisieren Sie Ihre `manifest.json` mit den neuen Einstellungen
2. **Erhöhen Sie das Feld `version`** (z. B. `1.0.0` → `1.1.0`)
3. **Zippen Sie** das Manifest mit den Icons erneut (`manifest.json`, `outline.png`, `color.png`)
4. Laden Sie die neue ZIP-Datei hoch:
   - **Option A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → finden Sie Ihre App → Upload new version
   - **Option B (Sideload):** In Teams → Apps → Manage your apps → Upload a custom app
5. **Für Team-Kanäle:** Installieren Sie die App in jedem Team erneut, damit neue Berechtigungen wirksam werden
6. **Beenden Sie Teams vollständig und starten Sie es neu** (nicht nur das Fenster schließen), um zwischengespeicherte App-Metadaten zu löschen

## Fähigkeiten: nur RSC vs. Graph

### Mit **nur Teams RSC** (App installiert, keine Graph-API-Berechtigungen)

Funktioniert:

- **Textinhalt** von Kanalnachrichten lesen.
- **Textinhalt** von Kanalnachrichten senden.
- Datei-Anhänge in **persönlichen Chats (DMs)** empfangen.

Funktioniert NICHT:

- **Bild- oder Dateiinhalte** in Kanälen/Gruppen (Payload enthält nur einen HTML-Stub).
- Herunterladen von Anhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Nachrichtenverlaufs (über das Live-Webhook-Ereignis hinaus).

### Mit **Teams RSC + Microsoft Graph Application-Berechtigungen**

Zusätzlich möglich:

- Herunterladen gehosteter Inhalte (in Nachrichten eingefügte Bilder).
- Herunterladen von Datei-Anhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Nachrichtenverlaufs von Kanälen/Chats über Graph.

### RSC vs. Graph API

| Fähigkeit              | RSC-Berechtigungen | Graph API                              |
| ---------------------- | ------------------ | -------------------------------------- |
| **Echtzeitnachrichten**| Ja (über Webhook)  | Nein (nur Polling)                     |
| **Historische Nachrichten** | Nein          | Ja (Verlauf kann abgefragt werden)     |
| **Einrichtungskomplexität** | Nur App-Manifest | Erfordert Admin-Zustimmung + Token-Flow |
| **Funktioniert offline** | Nein (muss laufen) | Ja (jederzeit abfragbar)              |

**Kurz gesagt:** RSC ist für Echtzeitüberwachung, Graph API für historischen Zugriff. Um verpasste Nachrichten nachzuholen, während Sie offline waren, benötigen Sie Graph API mit `ChannelMessage.Read.All` (erfordert Admin-Zustimmung).

## Graph-aktivierte Medien + Verlauf (erforderlich für Kanäle)

Wenn Sie Bilder/Dateien in **Kanälen** benötigen oder **Nachrichtenverlauf** abrufen möchten, müssen Sie Microsoft-Graph-Berechtigungen aktivieren und Admin-Zustimmung erteilen.

1. Fügen Sie in Entra ID (Azure AD) **App Registration** Microsoft Graph **Application permissions** hinzu:
   - `ChannelMessage.Read.All` (Kanalanhänge + Verlauf)
   - `Chat.Read.All` oder `ChatMessage.Read.All` (Gruppenchats)
2. **Erteilen Sie Admin-Zustimmung** für den Tenant.
3. Erhöhen Sie die Teams-App-**Manifestversion**, laden Sie sie erneut hoch und **installieren Sie die App in Teams erneut**.
4. **Beenden Sie Teams vollständig und starten Sie es neu**, um zwischengespeicherte App-Metadaten zu löschen.

**Zusätzliche Berechtigung für Benutzererwähnungen:** Benutzer-@-Erwähnungen funktionieren sofort für Benutzer in der Konversation. Wenn Sie jedoch Benutzer dynamisch suchen und erwähnen möchten, die **nicht in der aktuellen Konversation** sind, fügen Sie die Application-Berechtigung `User.Read.All` hinzu und erteilen Sie Admin-Zustimmung.

## Bekannte Einschränkungen

### Webhook-Timeouts

Teams liefert Nachrichten über HTTP-Webhooks. Wenn die Verarbeitung zu lange dauert (z. B. langsame LLM-Antworten), können Sie Folgendes sehen:

- Gateway-Timeouts
- Teams versucht die Nachricht erneut zuzustellen (verursacht Duplikate)
- Verlorene Antworten

OpenClaw behandelt dies, indem es schnell antwortet und Antworten proaktiv sendet, aber sehr langsame Antworten können weiterhin Probleme verursachen.

### Formatierung

Teams-Markdown ist stärker eingeschränkt als Slack oder Discord:

- Grundlegende Formatierung funktioniert: **fett**, _kursiv_, `code`, Links
- Komplexes Markdown (Tabellen, verschachtelte Listen) wird möglicherweise nicht korrekt gerendert
- Adaptive Cards werden für Umfragen und beliebige Card-Sendungen unterstützt (siehe unten)

## Konfiguration

Wichtige Einstellungen (gemeinsame Kanalmuster siehe `/gateway/configuration`):

- `channels.msteams.enabled`: Kanal aktivieren/deaktivieren.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: Bot-Anmeldedaten.
- `channels.msteams.webhook.port` (Standard `3978`)
- `channels.msteams.webhook.path` (Standard `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing)
- `channels.msteams.allowFrom`: DM-Allowlist (AAD-Objekt-IDs empfohlen). Der Assistent löst bei der Einrichtung Namen zu IDs auf, wenn Graph-Zugriff verfügbar ist.
- `channels.msteams.dangerouslyAllowNameMatching`: Break-Glass-Schalter, um veränderlichen UPN-/Anzeigenamen-Abgleich und direktes Team-/Kanalnamen-Routing wieder zu aktivieren.
- `channels.msteams.textChunkLimit`: Chunk-Größe für ausgehenden Text.
- `channels.msteams.chunkMode`: `length` (Standard) oder `newline`, um vor dem Chunking nach Länge an Leerzeilen (Absatzgrenzen) zu teilen.
- `channels.msteams.mediaAllowHosts`: Allowlist für Hosts eingehender Anhänge (standardmäßig Microsoft-/Teams-Domains).
- `channels.msteams.mediaAuthAllowHosts`: Allowlist für das Anhängen von Authorization-Headern bei Medien-Wiederholungsversuchen (standardmäßig Graph- + Bot-Framework-Hosts).
- `channels.msteams.requireMention`: @-Erwähnung in Kanälen/Gruppen erforderlich (Standard true).
- `channels.msteams.replyStyle`: `thread | top-level` (siehe [Antwortstil](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.requireMention`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.tools`: Standardüberschreibungen der Tool-Richtlinie pro Team (`allow`/`deny`/`alsoAllow`), wenn eine Kanalüberschreibung fehlt.
- `channels.msteams.teams.<teamId>.toolsBySender`: Standardüberschreibungen der Tool-Richtlinie pro Team und Absender (`"*"`-Wildcard unterstützt).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: Überschreibungen der Tool-Richtlinie pro Kanal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: Überschreibungen der Tool-Richtlinie pro Kanal und Absender (`"*"`-Wildcard unterstützt).
- `toolsBySender`-Schlüssel sollten explizite Präfixe verwenden:
  `id:`, `e164:`, `username:`, `name:` (veraltete Schlüssel ohne Präfix werden weiterhin nur auf `id:` abgebildet).
- `channels.msteams.actions.memberInfo`: Graph-gestützte Mitgliederinfo-Aktion aktivieren oder deaktivieren (Standard: aktiviert, wenn Graph-Anmeldedaten verfügbar sind).
- `channels.msteams.sharePointSiteId`: SharePoint-Site-ID für Dateiuploads in Gruppenchats/Kanälen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)).

## Routing und Sitzungen

- SessionKeys folgen dem Standard-Agent-Format (siehe [/concepts/session](/concepts/session)):
  - Direktnachrichten teilen die Hauptsitzung (`agent:<agentId>:<mainKey>`).
  - Kanal-/Gruppennachrichten verwenden die Konversations-ID:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwortstil: Threads vs. Beiträge

Teams hat kürzlich zwei Kanal-UI-Stile über dasselbe zugrunde liegende Datenmodell eingeführt:

| Stil                     | Beschreibung                                            | Empfohlener `replyStyle` |
| ------------------------ | ------------------------------------------------------- | ------------------------ |
| **Posts** (klassisch)    | Nachrichten erscheinen als Karten mit Thread-Antworten darunter | `thread` (Standard)      |
| **Threads** (Slack-ähnlich) | Nachrichten fließen linearer, eher wie in Slack      | `top-level`              |

**Das Problem:** Die Teams-API stellt nicht bereit, welchen UI-Stil ein Kanal verwendet. Wenn Sie den falschen `replyStyle` verwenden:

- `thread` in einem Threads-Stil-Kanal → Antworten erscheinen unpassend verschachtelt
- `top-level` in einem Posts-Stil-Kanal → Antworten erscheinen als separate Top-Level-Beiträge statt im Thread

**Lösung:** Konfigurieren Sie `replyStyle` pro Kanal basierend darauf, wie der Kanal eingerichtet ist:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Anhänge und Bilder

**Aktuelle Einschränkungen:**

- **DMs:** Bilder und Datei-Anhänge funktionieren über die Teams-Bot-Datei-APIs.
- **Kanäle/Gruppen:** Anhänge liegen im M365-Speicher (SharePoint/OneDrive). Die Webhook-Payload enthält nur einen HTML-Stub, nicht die eigentlichen Dateibytes. **Graph-API-Berechtigungen sind erforderlich**, um Kanalanhänge herunterzuladen.
- Für explizite Datei-zuerst-Sendungen verwenden Sie `action=upload-file` mit `media` / `filePath` / `path`; optionales `message` wird zum begleitenden Text/Kommentar, und `filename` überschreibt den hochgeladenen Namen.

Ohne Graph-Berechtigungen werden Kanalnachrichten mit Bildern nur als Text empfangen (auf den Bildinhalt kann der Bot nicht zugreifen).
Standardmäßig lädt OpenClaw Medien nur von Microsoft-/Teams-Hostnamen herunter. Überschreiben Sie dies mit `channels.msteams.mediaAllowHosts` (verwenden Sie `["*"]`, um jeden Host zuzulassen).
Authorization-Header werden nur für Hosts in `channels.msteams.mediaAuthAllowHosts` angehängt (standardmäßig Graph- + Bot-Framework-Hosts). Halten Sie diese Liste streng (vermeiden Sie Multi-Tenant-Suffixe).

## Dateien in Gruppenchats senden

Bots können Dateien in DMs mithilfe des FileConsentCard-Ablaufs senden (integriert). Das **Senden von Dateien in Gruppenchats/Kanälen** erfordert jedoch zusätzliche Einrichtung:

| Kontext                 | So werden Dateien gesendet                 | Erforderliche Einrichtung                         |
| ----------------------- | ------------------------------------------ | ------------------------------------------------- |
| **DMs**                 | FileConsentCard → Benutzer akzeptiert → Bot lädt hoch | Funktioniert sofort                              |
| **Gruppenchats/Kanäle** | Zu SharePoint hochladen → Link teilen      | Erfordert `sharePointSiteId` + Graph-Berechtigungen |
| **Bilder (jeder Kontext)** | Base64-kodiert inline                   | Funktioniert sofort                               |

### Warum Gruppenchats SharePoint benötigen

Bots haben kein persönliches OneDrive-Laufwerk (der Graph-API-Endpunkt `/me/drive` funktioniert nicht für Application-Identitäten). Um Dateien in Gruppenchats/Kanälen zu senden, lädt der Bot zu einer **SharePoint-Site** hoch und erstellt einen Freigabelink.

### Einrichtung

1. **Graph-API-Berechtigungen hinzufügen** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - Dateien zu SharePoint hochladen
   - `Chat.Read.All` (Application) - optional, aktiviert benutzerbezogene Freigabelinks

2. **Admin-Zustimmung** für den Tenant erteilen.

3. **SharePoint-Site-ID ermitteln:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw konfigurieren:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Freigabeverhalten

| Berechtigung                            | Freigabeverhalten                                        |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` nur               | Organisationsweiter Freigabelink (jede Person in der Organisation kann zugreifen) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Benutzerbezogener Freigabelink (nur Chat-Mitglieder können zugreifen) |

Benutzerbezogene Freigabe ist sicherer, da nur die Chat-Teilnehmer auf die Datei zugreifen können. Wenn die Berechtigung `Chat.Read.All` fehlt, greift der Bot auf organisationsweite Freigabe zurück.

### Fallback-Verhalten

| Szenario                                        | Ergebnis                                           |
| ----------------------------------------------- | -------------------------------------------------- |
| Gruppenchat + Datei + `sharePointSiteId` konfiguriert | Zu SharePoint hochladen, Freigabelink senden      |
| Gruppenchat + Datei + keine `sharePointSiteId`  | OneDrive-Upload versuchen (kann fehlschlagen), nur Text senden |
| Persönlicher Chat + Datei                       | FileConsentCard-Ablauf (funktioniert ohne SharePoint) |
| Jeder Kontext + Bild                            | Base64-kodiert inline (funktioniert ohne SharePoint) |

### Speicherort der Dateien

Hochgeladene Dateien werden in einem Ordner `/OpenClawShared/` in der Standarddokumentbibliothek der konfigurierten SharePoint-Site gespeichert.

## Umfragen (Adaptive Cards)

OpenClaw sendet Teams-Umfragen als Adaptive Cards (es gibt keine native Teams-Umfrage-API).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stimmen werden vom Gateway in `~/.openclaw/msteams-polls.json` aufgezeichnet.
- Das Gateway muss online bleiben, um Stimmen aufzuzeichnen.
- Umfragen veröffentlichen derzeit noch keine Ergebniszusammenfassungen automatisch (prüfen Sie bei Bedarf die Store-Datei).

## Adaptive Cards (beliebig)

Senden Sie beliebiges Adaptive-Card-JSON mit dem Tool `message` oder der CLI an Teams-Benutzer oder Konversationen.

Der Parameter `card` akzeptiert ein Adaptive-Card-JSON-Objekt. Wenn `card` angegeben ist, ist Nachrichtentext optional.

**Agent-Tool:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Siehe [Adaptive Cards documentation](https://adaptivecards.io/) für Card-Schema und Beispiele. Details zum Zielformat finden Sie unten unter [Zielformate](#target-formats).

## Zielformate

MSTeams-Ziele verwenden Präfixe, um zwischen Benutzern und Konversationen zu unterscheiden:

| Zieltyp               | Format                           | Beispiel                                            |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Benutzer (nach ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Benutzer (nach Name)  | `user:<display-name>`            | `user:John Smith` (erfordert Graph API)            |
| Gruppe/Kanal          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Gruppe/Kanal (roh)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (wenn `@thread` enthalten ist) |

**CLI-Beispiele:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send an Adaptive Card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Beispiele für Agent-Tools:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

Hinweis: Ohne das Präfix `user:` werden Namen standardmäßig als Gruppen-/Team-Auflösung behandelt. Verwenden Sie immer `user:`, wenn Sie Personen über den Anzeigenamen ansprechen.

## Proaktives Messaging

- Proaktive Nachrichten sind erst möglich, **nachdem** ein Benutzer interagiert hat, da wir erst dann Konversationsreferenzen speichern.
- Informationen zu `dmPolicy` und Allowlist-Gating finden Sie unter `/gateway/configuration`.

## Team- und Kanal-IDs (häufiger Stolperstein)

Der Query-Parameter `groupId` in Teams-URLs ist **NICHT** die Team-ID, die für die Konfiguration verwendet wird. Extrahieren Sie IDs stattdessen aus dem URL-Pfad:

**Team-URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team-ID (URL-dekodieren)
```

**Kanal-URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanal-ID (URL-dekodieren)
```

**Für die Konfiguration:**

- Team-ID = Pfadsegment nach `/team/` (URL-dekodiert, z. B. `19:Bk4j...@thread.tacv2`)
- Kanal-ID = Pfadsegment nach `/channel/` (URL-dekodiert)
- Den Query-Parameter `groupId` **ignorieren**

## Private Kanäle

Bots haben in privaten Kanälen nur eingeschränkte Unterstützung:

| Funktion                     | Standardkanäle    | Private Kanäle         |
| --------------------------- | ----------------- | ---------------------- |
| Bot-Installation            | Ja                | Eingeschränkt          |
| Echtzeitnachrichten (Webhook) | Ja              | Funktioniert möglicherweise nicht |
| RSC-Berechtigungen          | Ja                | Können sich anders verhalten |
| @-Erwähnungen               | Ja                | Wenn der Bot erreichbar ist |
| Graph-API-Verlauf           | Ja                | Ja (mit Berechtigungen) |

**Workarounds, wenn private Kanäle nicht funktionieren:**

1. Verwenden Sie Standardkanäle für Bot-Interaktionen
2. Verwenden Sie DMs – Benutzer können dem Bot immer direkt schreiben
3. Verwenden Sie Graph API für historischen Zugriff (erfordert `ChannelMessage.Read.All`)

## Fehlerbehebung

### Häufige Probleme

- **Bilder werden in Kanälen nicht angezeigt:** Graph-Berechtigungen oder Admin-Zustimmung fehlen. Installieren Sie die Teams-App erneut und beenden/öffnen Sie Teams vollständig neu.
- **Keine Antworten im Kanal:** Erwähnungen sind standardmäßig erforderlich; setzen Sie `channels.msteams.requireMention=false` oder konfigurieren Sie dies pro Team/Kanal.
- **Versionskonflikt (Teams zeigt weiterhin altes Manifest):** Entfernen Sie die App, fügen Sie sie erneut hinzu und beenden Sie Teams vollständig, um die Aktualisierung zu erzwingen.
- **401 Unauthorized vom Webhook:** Beim manuellen Testen ohne Azure-JWT erwartet – bedeutet, dass der Endpunkt erreichbar ist, aber die Authentifizierung fehlgeschlagen ist. Verwenden Sie Azure Web Chat für einen korrekten Test.

### Fehler beim Manifest-Upload

- **„Icon file cannot be empty“:** Das Manifest verweist auf Icon-Dateien mit 0 Byte. Erstellen Sie gültige PNG-Icons (32x32 für `outline.png`, 192x192 für `color.png`).
- **„webApplicationInfo.Id already in use“:** Die App ist noch in einem anderen Team/Chat installiert. Suchen Sie sie und deinstallieren Sie sie zuerst oder warten Sie 5–10 Minuten auf die Weitergabe.
- **„Something went wrong“ beim Upload:** Laden Sie stattdessen über [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) hoch, öffnen Sie die DevTools des Browsers (F12) → Registerkarte Network, und prüfen Sie den Response-Body auf den tatsächlichen Fehler.
- **Sideload schlägt fehl:** Versuchen Sie „Upload an app to your org's app catalog“ statt „Upload a custom app“ – das umgeht häufig Sideload-Beschränkungen.

### RSC-Berechtigungen funktionieren nicht

1. Prüfen Sie, ob `webApplicationInfo.id` exakt mit der App-ID Ihres Bots übereinstimmt
2. Laden Sie die App erneut hoch und installieren Sie sie im Team/Chat erneut
3. Prüfen Sie, ob Ihr Organisationsadministrator RSC-Berechtigungen blockiert hat
4. Bestätigen Sie, dass Sie den richtigen Bereich verwenden: `ChannelMessage.Read.Group` für Teams, `ChatMessage.Read.Chat` für Gruppenchats

## Referenzen

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Einrichtungsanleitung für Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-Apps erstellen/verwalten
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (Kanal/Gruppe erfordert Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Verwandt

- [Kanäle - Übersicht](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/gateway/security) — Zugriffsmodell und Härtung
