---
read_when:
    - Arbeiten an Funktionen für den Microsoft Teams-Kanal
summary: Status, Fähigkeiten und Konfiguration der Microsoft Teams-Bot-Unterstützung
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T13:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> „Lasst alle Hoffnung fahren, die ihr hier eintretet.“

Status: Text + DM-Anhänge werden unterstützt; das Senden von Dateien in Kanälen/Gruppen erfordert `sharePointSiteId` + Graph-Berechtigungen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)). Umfragen werden über Adaptive Cards gesendet. Nachrichtenaktionen bieten explizit `upload-file` für Datei-zuerst-Sendungen.

## Bundled Plugin

Microsoft Teams wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher ist in der normalen paketierten Build keine separate Installation erforderlich.

Wenn Sie eine ältere Build oder eine benutzerdefinierte Installation verwenden, die das gebündelte Teams ausschließt, installieren Sie es manuell:

```bash
openclaw plugins install @openclaw/msteams
```

Lokaler Checkout (beim Ausführen aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung (für Einsteiger)

1. Stellen Sie sicher, dass das Microsoft Teams-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstellen Sie einen **Azure Bot** (App-ID + Client Secret + Tenant-ID).
3. Konfigurieren Sie OpenClaw mit diesen Anmeldedaten.
4. Stellen Sie `/api/messages` (standardmäßig Port 3978) über eine öffentliche URL oder einen Tunnel bereit.
5. Installieren Sie das Teams-App-Paket und starten Sie das Gateway.

Minimale Konfiguration (Client Secret):

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

Für Produktionsbereitstellungen sollten Sie [föderierte Authentifizierung](#federated-authentication-certificate--managed-identity) (Zertifikat oder Managed Identity) anstelle von Client Secrets in Betracht ziehen.

Hinweis: Gruppenchats sind standardmäßig blockiert (`channels.msteams.groupPolicy: "allowlist"`). Um Gruppenantworten zuzulassen, setzen Sie `channels.msteams.groupAllowFrom` (oder verwenden Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen, mit Mention-Gating).

## Ziele

- Mit OpenClaw über Teams-DMs, Gruppenchats oder Kanäle sprechen.
- Weiterleitung deterministisch halten: Antworten gehen immer zurück an den Kanal, auf dem sie angekommen sind.
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

- Standard: `channels.msteams.dmPolicy = "pairing"`. Unbekannte Absender werden ignoriert, bis sie genehmigt werden.
- `channels.msteams.allowFrom` sollte stabile AAD-Objekt-IDs verwenden.
- UPNs/Anzeigenamen sind veränderlich; direkter Abgleich ist standardmäßig deaktiviert und wird nur mit `channels.msteams.dangerouslyAllowNameMatching: true` aktiviert.
- Der Assistent kann Namen über Microsoft Graph in IDs auflösen, wenn die Anmeldedaten dies zulassen.

**Gruppenzugriff**

- Standard: `channels.msteams.groupPolicy = "allowlist"` (blockiert, sofern Sie nicht `groupAllowFrom` hinzufügen). Verwenden Sie `channels.defaults.groupPolicy`, um den Standardwert zu überschreiben, wenn er nicht gesetzt ist.
- `channels.msteams.groupAllowFrom` steuert, welche Absender in Gruppenchats/Kanälen Auslöser sein können (fällt auf `channels.msteams.allowFrom` zurück).
- Setzen Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen (standardmäßig weiterhin Mention-Gating).
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
- Wenn `groupPolicy="allowlist"` gesetzt ist und eine Teams-Allowlist vorhanden ist, werden nur aufgelistete Teams/Kanäle akzeptiert (mit Mention-Gating).
- Der Konfigurationsassistent akzeptiert `Team/Channel`-Einträge und speichert sie für Sie.
- Beim Start löst OpenClaw Team-/Kanal- und Benutzer-Allowlist-Namen in IDs auf (wenn Graph-Berechtigungen dies zulassen)
  und protokolliert die Zuordnung; nicht aufgelöste Team-/Kanalnamen bleiben wie eingegeben erhalten, werden aber standardmäßig für die Weiterleitung ignoriert, sofern nicht `channels.msteams.dangerouslyAllowNameMatching: true` aktiviert ist.

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
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstellen Sie einen **Azure Bot** (App-ID + Secret + Tenant-ID).
3. Erstellen Sie ein **Teams-App-Paket**, das auf den Bot verweist und die unten aufgeführten RSC-Berechtigungen enthält.
4. Laden Sie die Teams-App in ein Team hoch/installieren Sie sie dort (oder im persönlichen Bereich für DMs).
5. Konfigurieren Sie `msteams` in `~/.openclaw/openclaw.json` (oder Umgebungsvariablen) und starten Sie das Gateway.
6. Das Gateway lauscht standardmäßig auf Bot-Framework-Webhook-Verkehr unter `/api/messages`.

## Azure Bot Setup (Voraussetzungen)

Bevor Sie OpenClaw konfigurieren, müssen Sie eine Azure-Bot-Ressource erstellen.

### Schritt 1: Azure Bot erstellen

1. Gehen Sie zu [Azure Bot erstellen](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Füllen Sie die Registerkarte **Basics** aus:

   | Feld               | Wert                                                     |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Ihr Bot-Name, z. B. `openclaw-msteams` (muss eindeutig sein) |
   | **Subscription**   | Wählen Sie Ihr Azure-Abonnement aus                      |
   | **Resource group** | Neu erstellen oder vorhandene verwenden                  |
   | **Pricing tier**   | **Free** für Entwicklung/Tests                           |
   | **Type of App**    | **Single Tenant** (empfohlen – siehe Hinweis unten)      |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Hinweis zur Einstellung:** Die Erstellung neuer Multi-Tenant-Bots wurde nach dem 2025-07-31 eingestellt. Verwenden Sie für neue Bots **Single Tenant**.

3. Klicken Sie auf **Review + create** → **Create** (warten Sie ca. 1–2 Minuten)

### Schritt 2: Anmeldedaten abrufen

1. Gehen Sie zu Ihrer Azure-Bot-Ressource → **Configuration**
2. Kopieren Sie **Microsoft App ID** → das ist Ihre `appId`
3. Klicken Sie auf **Manage Password** → gehen Sie zur App Registration
4. Unter **Certificates & secrets** → **New client secret** → kopieren Sie den **Value** → das ist Ihr `appPassword`
5. Gehen Sie zu **Overview** → kopieren Sie **Directory (tenant) ID** → das ist Ihre `tenantId`

### Schritt 3: Messaging-Endpunkt konfigurieren

1. In Azure Bot → **Configuration**
2. Setzen Sie **Messaging endpoint** auf Ihre Webhook-URL:
   - Produktion: `https://your-domain.com/api/messages`
   - Lokale Entwicklung: Verwenden Sie einen Tunnel (siehe [Lokale Entwicklung](#local-development-tunneling) unten)

### Schritt 4: Teams-Kanal aktivieren

1. In Azure Bot → **Channels**
2. Klicken Sie auf **Microsoft Teams** → Konfigurieren → Speichern
3. Akzeptieren Sie die Nutzungsbedingungen

<a id="federated-authentication-certificate--managed-identity"></a>

## Föderierte Authentifizierung (Zertifikat + Managed Identity)

> Hinzugefügt in 2026.3.24

Für Produktionsbereitstellungen unterstützt OpenClaw **föderierte Authentifizierung** als sicherere Alternative zu Client Secrets. Es stehen zwei Methoden zur Verfügung:

### Option A: Zertifikatsbasierte Authentifizierung

Verwenden Sie ein PEM-Zertifikat, das in Ihrer Entra-ID-App-Registrierung registriert ist.

**Einrichtung:**

1. Erzeugen oder beschaffen Sie ein Zertifikat (PEM-Format mit privatem Schlüssel).
2. In Entra ID → App Registration → **Certificates & secrets** → **Certificates** → laden Sie das öffentliche Zertifikat hoch.

**Konfiguration:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Umgebungsvariablen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Option B: Azure Managed Identity

Verwenden Sie Azure Managed Identity für passwortlose Authentifizierung. Das ist ideal für Bereitstellungen auf Azure-Infrastruktur (AKS, App Service, Azure-VMs), bei denen eine Managed Identity verfügbar ist.

**So funktioniert es:**

1. Der Bot-Pod/die VM hat eine Managed Identity (systemzugewiesen oder benutzerzugewiesen).
2. Eine **federated identity credential** verknüpft die Managed Identity mit der Entra-ID-App-Registrierung.
3. Zur Laufzeit verwendet OpenClaw `@azure/identity`, um Tokens vom Azure-IMDS-Endpunkt (`169.254.169.254`) abzurufen.
4. Das Token wird zur Bot-Authentifizierung an das Teams-SDK übergeben.

**Voraussetzungen:**

- Azure-Infrastruktur mit aktivierter Managed Identity (AKS Workload Identity, App Service, VM)
- Auf der Entra-ID-App-Registrierung erstellte Federated Identity Credential
- Netzwerkzugriff vom Pod/von der VM auf IMDS (`169.254.169.254:80`)

**Konfiguration (systemzugewiesene Managed Identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Konfiguration (benutzerzugewiesene Managed Identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Umgebungsvariablen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (nur für benutzerzugewiesene)

### AKS-Workload-Identity-Setup

Für AKS-Bereitstellungen mit Workload Identity:

1. **Aktivieren Sie Workload Identity** auf Ihrem AKS-Cluster.
2. **Erstellen Sie eine Federated Identity Credential** auf der Entra-ID-App-Registrierung:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Kommentieren Sie das Kubernetes-Servicekonto** mit der App-Client-ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Labeln Sie den Pod** für die Workload-Identity-Injektion:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Stellen Sie Netzwerkzugriff** auf IMDS (`169.254.169.254`) sicher — wenn Sie NetworkPolicy verwenden, fügen Sie eine Egress-Regel hinzu, die Datenverkehr zu `169.254.169.254/32` auf Port 80 erlaubt.

### Vergleich der Authentifizierungstypen

| Methode              | Konfiguration                                 | Vorteile                            | Nachteile                             |
| -------------------- | --------------------------------------------- | ----------------------------------- | ------------------------------------- |
| **Client Secret**    | `appPassword`                                 | Einfache Einrichtung                | Secret-Rotation erforderlich, weniger sicher |
| **Zertifikat**       | `authType: "federated"` + `certificatePath`   | Kein gemeinsames Secret über das Netzwerk | Verwaltungsaufwand für Zertifikate    |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Passwortlos, keine Secrets zu verwalten | Azure-Infrastruktur erforderlich      |

**Standardverhalten:** Wenn `authType` nicht gesetzt ist, verwendet OpenClaw standardmäßig Client-Secret-Authentifizierung. Bestehende Konfigurationen funktionieren weiterhin ohne Änderungen.

## Lokale Entwicklung (Tunneling)

Teams kann `localhost` nicht erreichen. Verwenden Sie für die lokale Entwicklung einen Tunnel:

**Option A: ngrok**

```bash
ngrok http 3978
# Kopieren Sie die https-URL, z. B. https://abc123.ngrok.io
# Setzen Sie den Messaging-Endpunkt auf: https://abc123.ngrok.io/api/messages
```

**Option B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Verwenden Sie Ihre Tailscale-Funnel-URL als Messaging-Endpunkt
```

## Teams Developer Portal (Alternative)

Anstatt manuell ein Manifest-ZIP zu erstellen, können Sie das [Teams Developer Portal](https://dev.teams.microsoft.com/apps) verwenden:

1. Klicken Sie auf **+ New app**
2. Füllen Sie die grundlegenden Informationen aus (Name, Beschreibung, Entwicklerinformationen)
3. Gehen Sie zu **App features** → **Bot**
4. Wählen Sie **Enter a bot ID manually** und fügen Sie Ihre Azure-Bot-App-ID ein
5. Aktivieren Sie die Geltungsbereiche: **Personal**, **Team**, **Group Chat**
6. Klicken Sie auf **Distribute** → **Download app package**
7. In Teams: **Apps** → **Manage your apps** → **Upload a custom app** → wählen Sie die ZIP-Datei aus

Das ist oft einfacher als JSON-Manifeste von Hand zu bearbeiten.

## Den Bot testen

**Option A: Azure Web Chat (zuerst Webhook überprüfen)**

1. Im Azure-Portal → Ihre Azure-Bot-Ressource → **Test in Web Chat**
2. Senden Sie eine Nachricht – Sie sollten eine Antwort sehen
3. Das bestätigt, dass Ihr Webhook-Endpunkt funktioniert, bevor Sie Teams einrichten

**Option B: Teams (nach der App-Installation)**

1. Installieren Sie die Teams-App (Sideload oder Organisationskatalog)
2. Suchen Sie den Bot in Teams und senden Sie eine DM
3. Prüfen Sie die Gateway-Logs auf eingehende Aktivitäten

## Einrichtung (minimale reine Textkonfiguration)

1. **Stellen Sie sicher, dass das Microsoft Teams-Plugin verfügbar ist**
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell hinzufügen:
     - Von npm: `openclaw plugins install @openclaw/msteams`
     - Von einem lokalen Checkout: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Bot-Registrierung**
   - Erstellen Sie einen Azure Bot (siehe oben) und notieren Sie:
     - App-ID
     - Client Secret (App-Passwort)
     - Tenant-ID (Single-Tenant)

3. **Teams-App-Manifest**
   - Fügen Sie einen `bot`-Eintrag mit `botId = <App ID>` ein.
   - Geltungsbereiche: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (erforderlich für die Dateiverarbeitung im persönlichen Geltungsbereich).
   - Fügen Sie RSC-Berechtigungen hinzu (unten).
   - Erstellen Sie Icons: `outline.png` (32x32) und `color.png` (192x192).
   - Packen Sie alle drei Dateien zusammen in eine ZIP-Datei: `manifest.json`, `outline.png`, `color.png`.

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

   Sie können auch Umgebungsvariablen statt Konfigurationsschlüsseln verwenden:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (optional: `"secret"` oder `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (föderiert + Zertifikat)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (optional, für Authentifizierung nicht erforderlich)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (föderiert + Managed Identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (nur für benutzerzugewiesene MI)

5. **Bot-Endpunkt**
   - Setzen Sie den Azure-Bot-Messaging-Endpunkt auf:
     - `https://<host>:3978/api/messages` (oder Ihren gewählten Pfad/Port).

6. **Das Gateway ausführen**
   - Der Teams-Kanal startet automatisch, wenn das gebündelte oder manuell installierte Plugin verfügbar ist und die `msteams`-Konfiguration mit Anmeldedaten vorhanden ist.

## Member-info-Aktion

OpenClaw stellt für Microsoft Teams eine Graph-gestützte `member-info`-Aktion bereit, sodass Agenten und Automatisierungen Mitgliederdetails von Kanälen direkt über Microsoft Graph auflösen können (Anzeigename, E-Mail, Rolle).

Anforderungen:

- `Member.Read.Group`-RSC-Berechtigung (bereits im empfohlenen Manifest enthalten)
- Für teamübergreifende Abfragen: `User.Read.All`-Graph-Anwendungsberechtigung mit Admin-Zustimmung

Die Aktion wird durch `channels.msteams.actions.memberInfo` gesteuert (Standard: aktiviert, wenn Graph-Anmeldedaten verfügbar sind).

## Verlaufskontext

- `channels.msteams.historyLimit` steuert, wie viele aktuelle Kanal-/Gruppennachrichten in den Prompt eingebettet werden.
- Fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um dies zu deaktivieren (Standard 50).
- Abgerufener Thread-Verlauf wird nach Absender-Allowlists (`allowFrom` / `groupAllowFrom`) gefiltert, sodass das Seeding des Thread-Kontexts nur Nachrichten von erlaubten Absendern enthält.
- Zitierter Anhangskontext (`ReplyTo*`, abgeleitet aus Teams-Antwort-HTML) wird derzeit wie empfangen weitergegeben.
- Anders gesagt: Allowlists steuern, wer den Agenten auslösen kann; heute werden nur bestimmte ergänzende Kontextpfade gefiltert.
- Der DM-Verlauf kann mit `channels.msteams.dmHistoryLimit` (Benutzer-Turns) begrenzt werden. Pro-Benutzer-Überschreibungen: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktuelle Teams-RSC-Berechtigungen (Manifest)

Dies sind die **bestehenden resourceSpecific-Berechtigungen** in unserem Teams-App-Manifest. Sie gelten nur innerhalb des Teams/Chats, in dem die App installiert ist.

**Für Kanäle (Team-Geltungsbereich):**

- `ChannelMessage.Read.Group` (Application) - alle Kanalnachrichten ohne @Erwähnung empfangen
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Für Gruppenchats:**

- `ChatMessage.Read.Chat` (Application) - alle Gruppenchats-Nachrichten ohne @Erwähnung empfangen

## Beispiel für ein Teams-Manifest (redigiert)

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

### Hinweise zum Manifest (erforderliche Felder)

- `bots[].botId` **muss** mit der Azure-Bot-App-ID übereinstimmen.
- `webApplicationInfo.id` **muss** mit der Azure-Bot-App-ID übereinstimmen.
- `bots[].scopes` muss die Oberflächen enthalten, die Sie verwenden möchten (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` ist für die Dateiverarbeitung im persönlichen Geltungsbereich erforderlich.
- `authorization.permissions.resourceSpecific` muss Lese-/Sendeberechtigungen für Kanäle enthalten, wenn Sie Kanalverkehr möchten.

### Eine bestehende App aktualisieren

Um eine bereits installierte Teams-App zu aktualisieren (z. B. um RSC-Berechtigungen hinzuzufügen):

1. Aktualisieren Sie Ihre `manifest.json` mit den neuen Einstellungen
2. **Erhöhen Sie das Feld `version`** (z. B. `1.0.0` → `1.1.0`)
3. **Packen Sie das Manifest erneut als ZIP** mit den Icons (`manifest.json`, `outline.png`, `color.png`)
4. Laden Sie die neue ZIP-Datei hoch:
   - **Option A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → finden Sie Ihre App → Upload new version
   - **Option B (Sideload):** In Teams → Apps → Manage your apps → Upload a custom app
5. **Für Team-Kanäle:** Installieren Sie die App in jedem Team erneut, damit neue Berechtigungen wirksam werden
6. **Beenden und starten Sie Teams vollständig neu** (nicht nur das Fenster schließen), um zwischengespeicherte App-Metadaten zu löschen

## Fähigkeiten: nur RSC vs. Graph

### Mit **nur Teams-RSC** (App installiert, keine Graph-API-Berechtigungen)

Funktioniert:

- Kanalnachrichten-**Text**inhalt lesen.
- Kanalnachrichten-**Text**inhalt senden.
- **Persönliche (DM)** Dateianhänge empfangen.

Funktioniert NICHT:

- **Bild- oder Dateiinhalte** in Kanälen/Gruppen (Payload enthält nur einen HTML-Stub).
- Herunterladen von Anhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Nachrichtenverlaufs (über das Live-Webhook-Ereignis hinaus).

### Mit **Teams-RSC + Microsoft Graph Application permissions**

Erweitert um:

- Herunterladen gehosteter Inhalte (in Nachrichten eingefügte Bilder).
- Herunterladen von Dateianhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Kanal-/Chat-Nachrichtenverlaufs über Graph.

### RSC vs. Graph-API

| Fähigkeit               | RSC-Berechtigungen   | Graph-API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Echtzeitnachrichten** | Ja (über Webhook)    | Nein (nur Polling)                  |
| **Historische Nachrichten** | Nein             | Ja (Verlauf kann abgefragt werden)  |
| **Komplexität der Einrichtung** | Nur App-Manifest | Erfordert Admin-Zustimmung + Token-Flow |
| **Funktioniert offline** | Nein (muss laufen)  | Ja (jederzeit abfragbar)            |

**Kurz gesagt:** RSC ist für das Zuhören in Echtzeit; die Graph-API ist für den historischen Zugriff. Um verpasste Nachrichten nachzuholen, während Sie offline sind, benötigen Sie die Graph-API mit `ChannelMessage.Read.All` (erfordert Admin-Zustimmung).

## Graph-aktivierte Medien + Verlauf (erforderlich für Kanäle)

Wenn Sie Bilder/Dateien in **Kanälen** benötigen oder **Nachrichtenverlauf** abrufen möchten, müssen Sie Microsoft Graph-Berechtigungen aktivieren und Admin-Zustimmung erteilen.

1. Fügen Sie in der Entra-ID-(Azure AD-)**App Registration** Microsoft Graph-**Application permissions** hinzu:
   - `ChannelMessage.Read.All` (Kanalanhänge + Verlauf)
   - `Chat.Read.All` oder `ChatMessage.Read.All` (Gruppenchats)
2. **Erteilen Sie Admin-Zustimmung** für den Tenant.
3. Erhöhen Sie die **Manifest-Version** der Teams-App, laden Sie sie erneut hoch und **installieren Sie die App in Teams erneut**.
4. **Beenden und starten Sie Teams vollständig neu**, um zwischengespeicherte App-Metadaten zu löschen.

**Zusätzliche Berechtigung für Benutzererwähnungen:** Benutzer-@Erwähnungen funktionieren sofort für Benutzer in der Konversation. Wenn Sie jedoch Benutzer dynamisch suchen und erwähnen möchten, die **nicht in der aktuellen Konversation** sind, fügen Sie die `User.Read.All`-(Application-)Berechtigung hinzu und erteilen Sie Admin-Zustimmung.

## Bekannte Einschränkungen

### Webhook-Timeouts

Teams stellt Nachrichten über HTTP-Webhooks zu. Wenn die Verarbeitung zu lange dauert (z. B. langsame LLM-Antworten), können folgende Probleme auftreten:

- Gateway-Timeouts
- Teams versucht erneut, die Nachricht zuzustellen (was Duplikate verursacht)
- Antworten gehen verloren

OpenClaw behandelt dies, indem es schnell zurückkehrt und Antworten proaktiv sendet, aber sehr langsame Antworten können weiterhin Probleme verursachen.

### Formatierung

Teams-Markdown ist stärker eingeschränkt als Slack oder Discord:

- Grundlegende Formatierung funktioniert: **fett**, _kursiv_, `code`, Links
- Komplexes Markdown (Tabellen, verschachtelte Listen) wird möglicherweise nicht korrekt gerendert
- Adaptive Cards werden für Umfragen und semantische Präsentationssendungen unterstützt (siehe unten)

## Konfiguration

Wichtige Einstellungen (siehe `/gateway/configuration` für gemeinsame Kanalmuster):

- `channels.msteams.enabled`: Kanal aktivieren/deaktivieren.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: Bot-Anmeldedaten.
- `channels.msteams.webhook.port` (Standard `3978`)
- `channels.msteams.webhook.path` (Standard `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing)
- `channels.msteams.allowFrom`: DM-Allowlist (AAD-Objekt-IDs empfohlen). Der Assistent löst während der Einrichtung Namen in IDs auf, wenn Graph-Zugriff verfügbar ist.
- `channels.msteams.dangerouslyAllowNameMatching`: Break-Glass-Schalter, um veränderlichen UPN-/Anzeigenamen-Abgleich und direkte Team-/Kanalnamen-Weiterleitung wieder zu aktivieren.
- `channels.msteams.textChunkLimit`: Chunk-Größe für ausgehenden Text.
- `channels.msteams.chunkMode`: `length` (Standard) oder `newline`, um zuerst an Leerzeilen (Absatzgrenzen) vor der Längenaufteilung zu trennen.
- `channels.msteams.mediaAllowHosts`: Allowlist für Hosts eingehender Anhänge (standardmäßig Microsoft-/Teams-Domains).
- `channels.msteams.mediaAuthAllowHosts`: Allowlist zum Anhängen von Authorization-Headern bei Medien-Wiederholungen (standardmäßig Graph- + Bot-Framework-Hosts).
- `channels.msteams.requireMention`: @Erwähnung in Kanälen/Gruppen verlangen (Standard true).
- `channels.msteams.replyStyle`: `thread | top-level` (siehe [Antwortstil](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.requireMention`: Überschreibung pro Team.
- `channels.msteams.teams.<teamId>.tools`: Standardüberschreibungen der Tool-Richtlinie pro Team (`allow`/`deny`/`alsoAllow`), die verwendet werden, wenn eine Kanalüberschreibung fehlt.
- `channels.msteams.teams.<teamId>.toolsBySender`: Standardüberschreibungen der Tool-Richtlinie pro Team und Absender (`"*"`-Wildcard unterstützt).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: Überschreibung pro Kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: Überschreibungen der Tool-Richtlinie pro Kanal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: Überschreibungen der Tool-Richtlinie pro Kanal und Absender (`"*"`-Wildcard unterstützt).
- `toolsBySender`-Schlüssel sollten explizite Präfixe verwenden:
  `id:`, `e164:`, `username:`, `name:` (ältere Schlüssel ohne Präfix werden weiterhin nur auf `id:` abgebildet).
- `channels.msteams.actions.memberInfo`: die Graph-gestützte Member-info-Aktion aktivieren oder deaktivieren (Standard: aktiviert, wenn Graph-Anmeldedaten verfügbar sind).
- `channels.msteams.authType`: Authentifizierungstyp — `"secret"` (Standard) oder `"federated"`.
- `channels.msteams.certificatePath`: Pfad zur PEM-Zertifikatsdatei (föderiert + Zertifikatsauthentifizierung).
- `channels.msteams.certificateThumbprint`: Zertifikat-Fingerprint (optional, für die Authentifizierung nicht erforderlich).
- `channels.msteams.useManagedIdentity`: Managed-Identity-Authentifizierung aktivieren (föderierter Modus).
- `channels.msteams.managedIdentityClientId`: Client-ID für benutzerzugewiesene Managed Identity.
- `channels.msteams.sharePointSiteId`: SharePoint-Site-ID für Datei-Uploads in Gruppenchats/Kanälen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)).

## Weiterleitung & Sitzungen

- SessionKeys folgen dem Standard-Agent-Format (siehe [/concepts/session](/de/concepts/session)):
  - Direktnachrichten teilen die main-Sitzung (`agent:<agentId>:<mainKey>`).
  - Kanal-/Gruppennachrichten verwenden die Konversations-ID:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwortstil: Threads vs. Beiträge

Teams hat kürzlich zwei Kanal-UI-Stile über demselben zugrunde liegenden Datenmodell eingeführt:

| Stil                     | Beschreibung                                             | Empfohlenes `replyStyle` |
| ------------------------ | -------------------------------------------------------- | ------------------------ |
| **Beiträge** (klassisch) | Nachrichten erscheinen als Karten mit Thread-Antworten darunter | `thread` (Standard)      |
| **Threads** (wie Slack)  | Nachrichten fließen linearer, mehr wie in Slack          | `top-level`              |

**Das Problem:** Die Teams-API stellt nicht bereit, welchen UI-Stil ein Kanal verwendet. Wenn Sie das falsche `replyStyle` verwenden:

- `thread` in einem Kanal im Threads-Stil → Antworten erscheinen ungeschickt verschachtelt
- `top-level` in einem Kanal im Beitragsstil → Antworten erscheinen als separate Top-Level-Beiträge statt im Thread

**Lösung:** Konfigurieren Sie `replyStyle` pro Kanal entsprechend der Einrichtung des Kanals:

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

## Anhänge & Bilder

**Aktuelle Einschränkungen:**

- **DMs:** Bilder und Dateianhänge funktionieren über Teams-Bot-Datei-APIs.
- **Kanäle/Gruppen:** Anhänge liegen im M365-Speicher (SharePoint/OneDrive). Die Webhook-Payload enthält nur einen HTML-Stub, nicht die tatsächlichen Dateibytes. **Graph-API-Berechtigungen sind erforderlich**, um Kanalanhänge herunterzuladen.
- Für explizite Datei-zuerst-Sendungen verwenden Sie `action=upload-file` mit `media` / `filePath` / `path`; optionales `message` wird zum Begleittext/-kommentar, und `filename` überschreibt den hochgeladenen Namen.

Ohne Graph-Berechtigungen werden Kanalnachrichten mit Bildern nur als Text empfangen (auf den Bildinhalt kann der Bot nicht zugreifen).
Standardmäßig lädt OpenClaw Medien nur von Microsoft-/Teams-Hostnamen herunter. Überschreiben Sie dies mit `channels.msteams.mediaAllowHosts` (verwenden Sie `["*"]`, um jeden Host zuzulassen).
Authorization-Header werden nur für Hosts in `channels.msteams.mediaAuthAllowHosts` angehängt (standardmäßig Graph- + Bot-Framework-Hosts). Halten Sie diese Liste strikt (vermeiden Sie Multi-Tenant-Suffixe).

## Dateien in Gruppenchats senden

Bots können Dateien in DMs mit dem FileConsentCard-Ablauf senden (integriert). **Das Senden von Dateien in Gruppenchats/Kanälen** erfordert jedoch zusätzliche Einrichtung:

| Kontext                  | Art des Dateiversands                     | Erforderliche Einrichtung                         |
| ------------------------ | ----------------------------------------- | ------------------------------------------------ |
| **DMs**                  | FileConsentCard → Benutzer akzeptiert → Bot lädt hoch | Funktioniert sofort                              |
| **Gruppenchats/Kanäle**  | Upload nach SharePoint → Link teilen      | Erfordert `sharePointSiteId` + Graph-Berechtigungen |
| **Bilder (jeder Kontext)** | Base64-kodiert inline                   | Funktioniert sofort                              |

### Warum Gruppenchats SharePoint benötigen

Bots haben kein persönliches OneDrive-Laufwerk (der `/me/drive`-Graph-API-Endpunkt funktioniert nicht für Anwendungsidentitäten). Um Dateien in Gruppenchats/Kanälen zu senden, lädt der Bot sie auf eine **SharePoint-Site** hoch und erstellt einen Freigabelink.

### Einrichtung

1. **Fügen Sie Graph-API-Berechtigungen hinzu** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - Dateien nach SharePoint hochladen
   - `Chat.Read.All` (Application) - optional, aktiviert Freigabelinks pro Benutzer

2. **Erteilen Sie Admin-Zustimmung** für den Tenant.

3. **Ermitteln Sie Ihre SharePoint-Site-ID:**

   ```bash
   # Über Graph Explorer oder curl mit einem gültigen Token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Beispiel: für eine Site unter "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Die Antwort enthält: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw konfigurieren:**

   ```json5
   {
     channels: {
       msteams: {
         // ... andere Konfiguration ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Freigabeverhalten

| Berechtigung                            | Freigabeverhalten                                        |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` nur               | Organisationsweiter Freigabelink (jeder in der Organisation hat Zugriff) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Freigabelink pro Benutzer (nur Chat-Mitglieder haben Zugriff) |

Die Freigabe pro Benutzer ist sicherer, da nur die Chat-Teilnehmer auf die Datei zugreifen können. Wenn die Berechtigung `Chat.Read.All` fehlt, fällt der Bot auf organisationsweite Freigabe zurück.

### Fallback-Verhalten

| Szenario                                          | Ergebnis                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| Gruppenchat + Datei + `sharePointSiteId` konfiguriert | Upload nach SharePoint, Freigabelink senden     |
| Gruppenchat + Datei + keine `sharePointSiteId`    | OneDrive-Upload versuchen (kann fehlschlagen), nur Text senden |
| Persönlicher Chat + Datei                         | FileConsentCard-Ablauf (funktioniert ohne SharePoint) |
| Beliebiger Kontext + Bild                         | Base64-kodiert inline (funktioniert ohne SharePoint) |

### Speicherort der Dateien

Hochgeladene Dateien werden in einem Ordner `/OpenClawShared/` in der Standarddokumentbibliothek der konfigurierten SharePoint-Site gespeichert.

## Umfragen (Adaptive Cards)

OpenClaw sendet Teams-Umfragen als Adaptive Cards (es gibt keine native Teams-Umfrage-API).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stimmen werden vom Gateway in `~/.openclaw/msteams-polls.json` erfasst.
- Das Gateway muss online bleiben, um Stimmen aufzuzeichnen.
- Umfragen veröffentlichen derzeit noch keine automatischen Ergebniszusammenfassungen (prüfen Sie bei Bedarf die Speicherdatei).

## Präsentationskarten

Senden Sie semantische Präsentations-Payloads an Teams-Benutzer oder -Konversationen mit dem Tool `message` oder der CLI. OpenClaw rendert sie aus dem generischen Präsentationsvertrag als Teams Adaptive Cards.

Der Parameter `presentation` akzeptiert semantische Blöcke. Wenn `presentation` angegeben ist, ist der Nachrichtentext optional.

**Agent-Tool:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Einzelheiten zum Zielformat finden Sie unten unter [Zielformate](#target-formats).

## Zielformate

MSTeams-Ziele verwenden Präfixe, um zwischen Benutzern und Konversationen zu unterscheiden:

| Zieltyp                | Format                           | Beispiel                                            |
| ---------------------- | -------------------------------- | --------------------------------------------------- |
| Benutzer (nach ID)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Benutzer (nach Name)   | `user:<display-name>`            | `user:John Smith` (erfordert Graph-API)             |
| Gruppe/Kanal           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Gruppe/Kanal (roh)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (wenn `@thread` enthalten ist) |

**CLI-Beispiele:**

```bash
# An einen Benutzer per ID senden
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# An einen Benutzer per Anzeigename senden (löst eine Graph-API-Abfrage aus)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# An einen Gruppenchat oder Kanal senden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Eine Präsentationskarte an eine Konversation senden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Hinweis: Ohne das Präfix `user:` werden Namen standardmäßig als Gruppen-/Teamauflösung behandelt. Verwenden Sie immer `user:`, wenn Sie Personen per Anzeigename ansprechen.

## Proaktives Messaging

- Proaktive Nachrichten sind nur **nach** einer Benutzerinteraktion möglich, da wir erst dann Konversationsreferenzen speichern.
- Siehe `/gateway/configuration` für `dmPolicy` und Allowlist-Gating.

## Team- und Kanal-IDs (häufige Stolperfalle)

Der Abfrageparameter `groupId` in Teams-URLs ist **nicht** die Team-ID, die für die Konfiguration verwendet wird. Extrahieren Sie IDs stattdessen aus dem URL-Pfad:

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
- Den Abfrageparameter `groupId` **ignorieren**

## Private Kanäle

Bots werden in privaten Kanälen nur eingeschränkt unterstützt:

| Funktion                     | Standardkanäle    | Private Kanäle        |
| --------------------------- | ----------------- | --------------------- |
| Bot-Installation            | Ja                | Eingeschränkt         |
| Echtzeitnachrichten (Webhook) | Ja              | Funktioniert evtl. nicht |
| RSC-Berechtigungen          | Ja                | Verhalten evtl. anders |
| @Erwähnungen                | Ja                | Wenn der Bot erreichbar ist |
| Graph-API-Verlauf           | Ja                | Ja (mit Berechtigungen) |

**Workarounds, wenn private Kanäle nicht funktionieren:**

1. Verwenden Sie Standardkanäle für Bot-Interaktionen
2. Verwenden Sie DMs – Benutzer können dem Bot immer direkt schreiben
3. Verwenden Sie die Graph-API für historischen Zugriff (erfordert `ChannelMessage.Read.All`)

## Fehlerbehebung

### Häufige Probleme

- **Bilder werden in Kanälen nicht angezeigt:** Graph-Berechtigungen oder Admin-Zustimmung fehlen. Installieren Sie die Teams-App erneut und beenden/öffnen Sie Teams vollständig neu.
- **Keine Antworten im Kanal:** Erwähnungen sind standardmäßig erforderlich; setzen Sie `channels.msteams.requireMention=false` oder konfigurieren Sie dies pro Team/Kanal.
- **Versionskonflikt (Teams zeigt weiterhin das alte Manifest):** Entfernen Sie die App und fügen Sie sie erneut hinzu; beenden Sie Teams anschließend vollständig, um zu aktualisieren.
- **401 Unauthorized vom Webhook:** Beim manuellen Testen ohne Azure-JWT erwartet – bedeutet, dass der Endpunkt erreichbar ist, aber die Authentifizierung fehlgeschlagen ist. Verwenden Sie Azure Web Chat für einen korrekten Test.

### Fehler beim Hochladen des Manifests

- **"Icon file cannot be empty":** Das Manifest verweist auf Symboldateien mit 0 Byte. Erstellen Sie gültige PNG-Icons (32x32 für `outline.png`, 192x192 für `color.png`).
- **"webApplicationInfo.Id already in use":** Die App ist noch in einem anderen Team/Chat installiert. Deinstallieren Sie sie dort zuerst oder warten Sie 5–10 Minuten auf die Verteilung.
- **"Something went wrong" beim Hochladen:** Laden Sie stattdessen über [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) hoch, öffnen Sie die Browser-DevTools (F12) → Registerkarte Network und prüfen Sie den Response-Body auf den tatsächlichen Fehler.
- **Sideload schlägt fehl:** Versuchen Sie „Upload an app to your org's app catalog“ statt „Upload a custom app“ – das umgeht häufig Sideload-Beschränkungen.

### RSC-Berechtigungen funktionieren nicht

1. Prüfen Sie, dass `webApplicationInfo.id` exakt mit der App-ID Ihres Bots übereinstimmt
2. Laden Sie die App erneut hoch und installieren Sie sie im Team/Chat erneut
3. Prüfen Sie, ob Ihr Organisationsadministrator RSC-Berechtigungen blockiert hat
4. Bestätigen Sie, dass Sie den richtigen Geltungsbereich verwenden: `ChannelMessage.Read.Group` für Teams, `ChatMessage.Read.Chat` für Gruppenchats

## Referenzen

- [Azure Bot erstellen](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Leitfaden zur Azure-Bot-Einrichtung
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-Apps erstellen/verwalten
- [Teams-App-Manifest-Schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanalnachrichten mit RSC empfangen](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC-Berechtigungsreferenz](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams-Bot-Dateiverarbeitung](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (Kanal/Gruppe erfordert Graph)
- [Proaktives Messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Kanalweiterleitung](/de/channels/channel-routing) — Sitzungsweiterleitung für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
