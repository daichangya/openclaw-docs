---
read_when:
    - Arbeiten an Channel-Funktionen für Microsoft Teams
summary: Supportstatus, Funktionen und Konfiguration des Microsoft Teams-Bots
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T06:28:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

Text und DM-Anhänge werden unterstützt; das Senden von Dateien in Channels und Gruppen erfordert `sharePointSiteId` + Graph-Berechtigungen (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats)). Umfragen werden über Adaptive Cards gesendet. Nachrichtenaktionen stellen explizit `upload-file` für dateibasierte Sendungen bereit.

## Gebündeltes Plugin

Microsoft Teams wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher ist bei normalen paketierten Builds keine separate Installation erforderlich.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation ohne gebündeltes Teams verwenden, installieren Sie es manuell:

```bash
openclaw plugins install @openclaw/msteams
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung (Einsteiger)

1. Stellen Sie sicher, dass das Microsoft Teams-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Erstellen Sie einen **Azure Bot** (App ID + Client Secret + Tenant ID).
3. Konfigurieren Sie OpenClaw mit diesen Zugangsdaten.
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

Für Produktionsbereitstellungen sollten Sie [föderierte Authentifizierung](#federated-authentication) (Zertifikat oder Managed Identity) anstelle von Client Secrets in Betracht ziehen.

Hinweis: Gruppenchats sind standardmäßig blockiert (`channels.msteams.groupPolicy: "allowlist"`). Um Gruppenantworten zu erlauben, setzen Sie `channels.msteams.groupAllowFrom` (oder verwenden Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen, standardmäßig gated durch Erwähnungen).

## Config-Schreibzugriffe

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
- Verlassen Sie sich nicht auf UPN-/Anzeigenamen-Abgleich für Allowlists — sie können sich ändern. OpenClaw deaktiviert direkten Namensabgleich standardmäßig; aktivieren Sie ihn nur ausdrücklich mit `channels.msteams.dangerouslyAllowNameMatching: true`.
- Der Assistent kann Namen über Microsoft Graph zu IDs auflösen, wenn die Zugangsdaten dies erlauben.

**Gruppenzugriff**

- Standard: `channels.msteams.groupPolicy = "allowlist"` (blockiert, sofern Sie nicht `groupAllowFrom` hinzufügen). Verwenden Sie `channels.defaults.groupPolicy`, um den Standard zu überschreiben, wenn nicht gesetzt.
- `channels.msteams.groupAllowFrom` steuert, welche Absender in Gruppenchats/Channels auslösen können (Fallback auf `channels.msteams.allowFrom`).
- Setzen Sie `groupPolicy: "open"`, um jedes Mitglied zuzulassen (standardmäßig weiterhin gated durch Erwähnungen).
- Um **keine Channels** zuzulassen, setzen Sie `channels.msteams.groupPolicy: "disabled"`.

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

**Teams + Channel-Allowlist**

- Begrenzen Sie Gruppen-/Channel-Antworten, indem Sie Teams und Channels unter `channels.msteams.teams` auflisten.
- Schlüssel sollten stabile Team-IDs und Konversations-IDs der Channels verwenden.
- Wenn `groupPolicy="allowlist"` gesetzt ist und eine Teams-Allowlist vorhanden ist, werden nur aufgelistete Teams/Channels akzeptiert (gated durch Erwähnungen).
- Der Konfigurationsassistent akzeptiert Einträge im Format `Team/Channel` und speichert sie für Sie.
- Beim Start löst OpenClaw Team-/Channel- und Benutzer-Allowlist-Namen zu IDs auf (wenn Graph-Berechtigungen dies erlauben)
  und protokolliert die Zuordnung; nicht aufgelöste Team-/Channel-Namen bleiben wie eingegeben erhalten, werden aber standardmäßig für das Routing ignoriert, außer `channels.msteams.dangerouslyAllowNameMatching: true` ist aktiviert.

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

## Azure-Bot-Einrichtung

Bevor Sie OpenClaw konfigurieren, erstellen Sie eine Azure-Bot-Ressource und erfassen Sie deren Zugangsdaten.

<Steps>
  <Step title="Azure Bot erstellen">
    Gehen Sie zu [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) und füllen Sie den Reiter **Basics** aus:

    | Feld               | Wert                                                     |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | Ihr Bot-Name, z. B. `openclaw-msteams` (muss eindeutig sein) |
    | **Subscription**   | Ihr Azure-Abonnement                                     |
    | **Resource group** | Neu erstellen oder vorhandene verwenden                  |
    | **Pricing tier**   | **Free** für Entwicklung/Tests                           |
    | **Type of App**    | **Single Tenant** (empfohlen)                            |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    Neue Multi-Tenant-Bots wurden nach dem 2025-07-31 eingestellt. Verwenden Sie **Single Tenant** für neue Bots.
    </Note>

    Klicken Sie auf **Review + create** → **Create** (warten Sie etwa 1–2 Minuten).

  </Step>

  <Step title="Zugangsdaten erfassen">
    In der Azure-Bot-Ressource → **Configuration**:

    - kopieren Sie **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → kopieren Sie den Wert → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Messaging-Endpunkt konfigurieren">
    Azure Bot → **Configuration** → setzen Sie **Messaging endpoint**:

    - Produktion: `https://your-domain.com/api/messages`
    - Lokale Entwicklung: Verwenden Sie einen Tunnel (siehe [Lokale Entwicklung](#local-development-tunneling))

  </Step>

  <Step title="Teams-Channel aktivieren">
    Azure Bot → **Channels** → klicken Sie auf **Microsoft Teams** → Configure → Save. Akzeptieren Sie die Terms of Service.
  </Step>
</Steps>

## Föderierte Authentifizierung

> Hinzugefügt in 2026.3.24

Für Produktionsbereitstellungen unterstützt OpenClaw **föderierte Authentifizierung** als sicherere Alternative zu Client Secrets. Es stehen zwei Methoden zur Verfügung:

### Option A: Zertifikatsbasierte Authentifizierung

Verwenden Sie ein PEM-Zertifikat, das in Ihrer Entra ID-App-Registrierung registriert ist.

**Einrichtung:**

1. Erzeugen Sie ein Zertifikat oder beschaffen Sie eines (PEM-Format mit privatem Schlüssel).
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

Verwenden Sie Azure Managed Identity für passwortlose Authentifizierung. Das ist ideal für Bereitstellungen auf Azure-Infrastruktur (AKS, App Service, Azure VMs), bei denen eine Managed Identity verfügbar ist.

**Funktionsweise:**

1. Der Bot-Pod/die VM verfügt über eine Managed Identity (systemzugewiesen oder benutzerzugewiesen).
2. Eine **federated identity credential** verknüpft die Managed Identity mit der Entra ID-App-Registrierung.
3. Zur Laufzeit verwendet OpenClaw `@azure/identity`, um Tokens vom Azure-IMDS-Endpunkt (`169.254.169.254`) zu beziehen.
4. Das Token wird zur Bot-Authentifizierung an das Teams SDK übergeben.

**Voraussetzungen:**

- Azure-Infrastruktur mit aktivierter Managed Identity (AKS workload identity, App Service, VM)
- Auf der Entra ID-App-Registrierung erstellte federated identity credential
- Netzwerkzugriff auf IMDS (`169.254.169.254:80`) vom Pod/von der VM

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

### Einrichtung von AKS workload identity

Für AKS-Bereitstellungen mit workload identity:

1. **Aktivieren Sie workload identity** auf Ihrem AKS-Cluster.
2. **Erstellen Sie eine federated identity credential** auf der Entra ID-App-Registrierung:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annotieren Sie das Kubernetes-Servicekonto** mit der App-Client-ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Beschriften Sie den Pod** für die Injektion von workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Stellen Sie Netzwerkzugriff** auf IMDS (`169.254.169.254`) sicher — wenn Sie NetworkPolicy verwenden, fügen Sie eine Egress-Regel hinzu, die Datenverkehr zu `169.254.169.254/32` auf Port 80 erlaubt.

### Vergleich der Authentifizierungstypen

| Methode              | Konfiguration                                   | Vorteile                           | Nachteile                            |
| -------------------- | ----------------------------------------------- | ---------------------------------- | ------------------------------------ |
| **Client secret**    | `appPassword`                                   | Einfache Einrichtung               | Secret-Rotation erforderlich, weniger sicher |
| **Certificate**      | `authType: "federated"` + `certificatePath`     | Kein gemeinsames Secret über das Netzwerk | Verwaltungsaufwand für Zertifikate   |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity`  | Passwortlos, keine Secrets zu verwalten | Azure-Infrastruktur erforderlich     |

**Standardverhalten:** Wenn `authType` nicht gesetzt ist, verwendet OpenClaw standardmäßig Client-Secret-Authentifizierung. Bestehende Konfigurationen funktionieren unverändert weiter.

## Lokale Entwicklung (Tunneling)

Teams kann `localhost` nicht erreichen. Verwenden Sie für lokale Entwicklung einen Tunnel:

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
4. Wählen Sie **Enter a bot ID manually** und fügen Sie Ihre Azure Bot App ID ein
5. Aktivieren Sie die Scopes: **Personal**, **Team**, **Group Chat**
6. Klicken Sie auf **Distribute** → **Download app package**
7. In Teams: **Apps** → **Manage your apps** → **Upload a custom app** → wählen Sie die ZIP-Datei aus

Das ist oft einfacher als JSON-Manifeste von Hand zu bearbeiten.

## Den Bot testen

**Option A: Azure Web Chat (zuerst Webhook verifizieren)**

1. Im Azure Portal → Ihre Azure-Bot-Ressource → **Test in Web Chat**
2. Senden Sie eine Nachricht — Sie sollten eine Antwort sehen
3. Damit wird bestätigt, dass Ihr Webhook-Endpunkt funktioniert, bevor Sie Teams einrichten

**Option B: Teams (nach der App-Installation)**

1. Installieren Sie die Teams-App (Sideload oder Organisationskatalog)
2. Suchen Sie den Bot in Teams und senden Sie eine DM
3. Prüfen Sie die Gateway-Logs auf eingehende Aktivitäten

<Accordion title="Überschreibungen per Umgebungsvariable">

Jeder der Bot-/Authentifizierungs-Konfigurationsschlüssel kann auch über Umgebungsvariablen gesetzt werden:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` oder `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (föderiert + Zertifikat)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (föderiert + Managed Identity; Client-ID nur für benutzerzugewiesene)

</Accordion>

## Aktion für Mitgliederinformationen

OpenClaw stellt für Microsoft Teams eine Graph-gestützte Aktion `member-info` bereit, damit Agents und Automatisierungen Mitgliederdetails eines Channels (Anzeigename, E-Mail, Rolle) direkt aus Microsoft Graph auflösen können.

Anforderungen:

- `Member.Read.Group`-RSC-Berechtigung (bereits im empfohlenen Manifest enthalten)
- Für teamübergreifende Abfragen: `User.Read.All`-Graph-Application-Berechtigung mit Admin-Zustimmung

Die Aktion wird durch `channels.msteams.actions.memberInfo` gesteuert (Standard: aktiviert, wenn Graph-Zugangsdaten verfügbar sind).

## Verlaufs-Kontext

- `channels.msteams.historyLimit` steuert, wie viele aktuelle Channel-/Gruppennachrichten in den Prompt eingebettet werden.
- Fallback ist `messages.groupChat.historyLimit`. Setzen Sie `0`, um dies zu deaktivieren (Standard 50).
- Abgerufener Thread-Verlauf wird nach Absender-Allowlists gefiltert (`allowFrom` / `groupAllowFrom`), sodass die Initialisierung des Thread-Kontexts nur Nachrichten von erlaubten Absendern enthält.
- Zitierter Anhangskontext (`ReplyTo*`, abgeleitet aus Teams-Reply-HTML) wird derzeit unverändert weitergegeben.
- Anders ausgedrückt: Allowlists steuern, wer den Agent auslösen kann; heute werden nur bestimmte ergänzende Kontextpfade gefiltert.
- Der DM-Verlauf kann mit `channels.msteams.dmHistoryLimit` begrenzt werden (Benutzer-Turns). Überschreibungen pro Benutzer: `channels.msteams.dms["<user_id>"].historyLimit`.

## Aktuelle Teams-RSC-Berechtigungen

Dies sind die **bestehenden resourceSpecific permissions** in unserem Teams-App-Manifest. Sie gelten nur innerhalb des Teams/Chats, in dem die App installiert ist.

**Für Channels (Team-Bereich):**

- `ChannelMessage.Read.Group` (Application) - alle Channel-Nachrichten ohne @Erwähnung empfangen
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Für Gruppenchats:**

- `ChatMessage.Read.Chat` (Application) - alle Gruppenchats-Nachrichten ohne @Erwähnung empfangen

## Beispiel für ein Teams-Manifest

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

- `bots[].botId` **muss** mit der Azure Bot App ID übereinstimmen.
- `webApplicationInfo.id` **muss** mit der Azure Bot App ID übereinstimmen.
- `bots[].scopes` muss die Oberflächen enthalten, die Sie verwenden möchten (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` ist für die Dateiverarbeitung im persönlichen Bereich erforderlich.
- `authorization.permissions.resourceSpecific` muss Lese-/Sendeberechtigungen für Channels enthalten, wenn Sie Channel-Verkehr möchten.

### Vorhandene App aktualisieren

So aktualisieren Sie eine bereits installierte Teams-App (z. B. um RSC-Berechtigungen hinzuzufügen):

1. Aktualisieren Sie Ihre `manifest.json` mit den neuen Einstellungen
2. **Erhöhen Sie das Feld `version`** (z. B. `1.0.0` → `1.1.0`)
3. **Zippen Sie** das Manifest mit den Icons erneut (`manifest.json`, `outline.png`, `color.png`)
4. Laden Sie die neue ZIP hoch:
   - **Option A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → finden Sie Ihre App → Upload new version
   - **Option B (Sideload):** In Teams → Apps → Manage your apps → Upload a custom app
5. **Für Team-Channels:** Installieren Sie die App in jedem Team neu, damit die neuen Berechtigungen wirksam werden
6. **Beenden und starten Sie Teams vollständig neu** (nicht nur das Fenster schließen), um zwischengespeicherte App-Metadaten zu leeren

## Funktionen: nur RSC vs. Graph

### Nur Teams RSC (keine Graph-API-Berechtigungen)

Funktioniert:

- Channel-Nachrichteninhalt als **Text** lesen.
- Channel-Nachrichteninhalt als **Text** senden.
- **Dateianhänge** in persönlichen Nachrichten (DM) empfangen.

Funktioniert NICHT:

- **Bild- oder Dateiinhalte** in Channels/Gruppen (Payload enthält nur einen HTML-Stub).
- Herunterladen von Anhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Nachrichtenverlaufs (über das Live-Webhook-Ereignis hinaus).

### Teams RSC plus Microsoft Graph-Application-Berechtigungen

Zusätzlich möglich:

- Herunterladen gehosteter Inhalte (in Nachrichten eingefügte Bilder).
- Herunterladen von Dateianhängen, die in SharePoint/OneDrive gespeichert sind.
- Lesen des Channel-/Chat-Nachrichtenverlaufs über Graph.

### RSC vs. Graph API

| Fähigkeit               | RSC-Berechtigungen   | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Echtzeitnachrichten** | Ja (über Webhook)    | Nein (nur Polling)                  |
| **Verlaufsnachrichten** | Nein                 | Ja (Verlauf kann abgefragt werden)  |
| **Einrichtungsaufwand** | Nur App-Manifest     | Erfordert Admin-Zustimmung + Token-Flow |
| **Funktioniert offline**| Nein (muss laufen)   | Ja (jederzeit abfragbar)            |

**Kurz gesagt:** RSC ist für das Zuhören in Echtzeit; Graph API ist für den Zugriff auf den Verlauf. Um verpasste Nachrichten im Offline-Betrieb nachzuholen, benötigen Sie Graph API mit `ChannelMessage.Read.All` (erfordert Admin-Zustimmung).

## Graph-aktivierte Medien + Verlauf (für Channels erforderlich)

Wenn Sie Bilder/Dateien in **Channels** benötigen oder den **Nachrichtenverlauf** abrufen möchten, müssen Sie Microsoft-Graph-Berechtigungen aktivieren und Admin-Zustimmung erteilen.

1. Fügen Sie in Entra ID (Azure AD) **App Registration** Microsoft Graph-**Application permissions** hinzu:
   - `ChannelMessage.Read.All` (Channel-Anhänge + Verlauf)
   - `Chat.Read.All` oder `ChatMessage.Read.All` (Gruppenchats)
2. **Erteilen Sie Admin-Zustimmung** für den Tenant.
3. Erhöhen Sie die **Manifest-Version** der Teams-App, laden Sie sie erneut hoch und **installieren Sie die App in Teams neu**.
4. **Beenden und starten Sie Teams vollständig neu**, um zwischengespeicherte App-Metadaten zu leeren.

**Zusätzliche Berechtigung für Benutzererwähnungen:** @Erwähnungen von Benutzern funktionieren sofort für Benutzer in der Konversation. Wenn Sie jedoch Benutzer dynamisch suchen und erwähnen möchten, die **nicht in der aktuellen Konversation** sind, fügen Sie die `User.Read.All`-Application-Berechtigung hinzu und erteilen Sie Admin-Zustimmung.

## Bekannte Einschränkungen

### Webhook-Timeouts

Teams liefert Nachrichten über einen HTTP-Webhook. Wenn die Verarbeitung zu lange dauert (z. B. langsame LLM-Antworten), kann Folgendes auftreten:

- Gateway-Timeouts
- Teams versucht erneut, die Nachricht zuzustellen (verursacht Duplikate)
- Antworten gehen verloren

OpenClaw behandelt dies, indem es schnell antwortet und Antworten proaktiv sendet, aber sehr langsame Antworten können weiterhin Probleme verursachen.

### Formatierung

Teams-Markdown ist eingeschränkter als Slack oder Discord:

- Grundlegende Formatierung funktioniert: **fett**, _kursiv_, `code`, Links
- Komplexes Markdown (Tabellen, verschachtelte Listen) wird möglicherweise nicht korrekt gerendert
- Adaptive Cards werden für Umfragen und semantische Präsentationssendungen unterstützt (siehe unten)

## Konfiguration

Gruppierte Einstellungen (siehe `/gateway/configuration` für gemeinsame Channel-Muster).

<AccordionGroup>
  <Accordion title="Kern und Webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: Bot-Zugangsdaten
    - `channels.msteams.webhook.port` (Standard `3978`)
    - `channels.msteams.webhook.path` (Standard `/api/messages`)
  </Accordion>

  <Accordion title="Authentifizierung">
    - `authType`: `"secret"` (Standard) oder `"federated"`
    - `certificatePath`, `certificateThumbprint`: föderierte + zertifikatbasierte Authentifizierung (Thumbprint optional)
    - `useManagedIdentity`, `managedIdentityClientId`: föderierte + Managed-Identity-Authentifizierung
  </Accordion>

  <Accordion title="Zugriffskontrolle">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing)
    - `allowFrom`: DM-Allowlist, bevorzugt AAD-Objekt-IDs; der Assistent löst Namen auf, wenn Graph-Zugriff verfügbar ist
    - `dangerouslyAllowNameMatching`: Break-Glass-Option für veränderliche UPN-/Anzeigenamen und Team-/Channel-Namensrouting
    - `requireMention`: @Erwähnung in Channels/Gruppen erforderlich (Standard `true`)
  </Accordion>

  <Accordion title="Überschreibungen für Teams und Channels">
    All dies überschreibt die Top-Level-Standards:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: Standardrichtlinie für Tools pro Team
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    `toolsBySender`-Schlüssel akzeptieren die Präfixe `id:`, `e164:`, `username:`, `name:` (Schlüssel ohne Präfix werden auf `id:` abgebildet). `"*"` ist ein Wildcard.

  </Accordion>

  <Accordion title="Zustellung, Medien und Aktionen">
    - `textChunkLimit`: Chunk-Größe für ausgehenden Text
    - `chunkMode`: `length` (Standard) oder `newline` (vor der Längenprüfung an Absatzgrenzen aufteilen)
    - `mediaAllowHosts`: Allowlist für Hostnamen eingehender Anhänge (standardmäßig Microsoft-/Teams-Domains)
    - `mediaAuthAllowHosts`: Hosts, die bei Wiederholungen Authorization-Header empfangen dürfen (standardmäßig Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (siehe [Antwortstil](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: Graph-gestützte Aktion für Mitgliederinformationen umschalten (standardmäßig an, wenn Graph verfügbar ist)
    - `sharePointSiteId`: erforderlich für Datei-Uploads in Gruppenchats/Channels (siehe [Dateien in Gruppenchats senden](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Routing und Sitzungen

- Sitzungsschlüssel folgen dem Standard-Agent-Format (siehe [/concepts/session](/de/concepts/session)):
  - Direktnachrichten teilen die Hauptsitzung (`agent:<agentId>:<mainKey>`).
  - Channel-/Gruppennachrichten verwenden die Konversations-ID:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwortstil: Threads vs. Beiträge

Teams hat kürzlich zwei Channel-UI-Stile über demselben zugrunde liegenden Datenmodell eingeführt:

| Stil                     | Beschreibung                                              | Empfohlener `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (klassisch)    | Nachrichten erscheinen als Karten mit Thread-Antworten darunter | `thread` (Standard)      |
| **Threads** (wie Slack)  | Nachrichten fließen linear, ähnlich wie in Slack          | `top-level`              |

**Das Problem:** Die Teams-API legt nicht offen, welchen UI-Stil ein Channel verwendet. Wenn Sie den falschen `replyStyle` verwenden:

- `thread` in einem Threads-ähnlichen Channel → Antworten erscheinen ungeschickt verschachtelt
- `top-level` in einem Posts-ähnlichen Channel → Antworten erscheinen als separate Top-Level-Beiträge statt im Thread

**Lösung:** Konfigurieren Sie `replyStyle` pro Channel basierend darauf, wie der Channel eingerichtet ist:

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

- **DMs:** Bilder und Dateianhänge funktionieren über die Teams-Bot-Datei-APIs.
- **Channels/Gruppen:** Anhänge liegen im M365-Speicher (SharePoint/OneDrive). Die Webhook-Payload enthält nur einen HTML-Stub, nicht die eigentlichen Dateibytes. **Graph-API-Berechtigungen sind erforderlich**, um Channel-Anhänge herunterzuladen.
- Für explizite dateibasierte Sendungen verwenden Sie `action=upload-file` mit `media` / `filePath` / `path`; optionales `message` wird zum begleitenden Text/Kommentar, und `filename` überschreibt den hochgeladenen Namen.

Ohne Graph-Berechtigungen werden Channel-Nachrichten mit Bildern nur als Text empfangen (der Bildinhalt ist für den Bot nicht zugänglich).
Standardmäßig lädt OpenClaw Medien nur von Microsoft-/Teams-Hostnamen herunter. Überschreiben Sie dies mit `channels.msteams.mediaAllowHosts` (verwenden Sie `["*"]`, um jeden Host zuzulassen).
Authorization-Header werden nur für Hosts in `channels.msteams.mediaAuthAllowHosts` angehängt (standardmäßig Graph- + Bot-Framework-Hosts). Halten Sie diese Liste strikt (vermeiden Sie Multi-Tenant-Suffixe).

## Dateien in Gruppenchats senden

Bots können Dateien in DMs über den FileConsentCard-Ablauf senden (integriert). Das **Senden von Dateien in Gruppenchats/Channels** erfordert jedoch zusätzliche Einrichtung:

| Kontext                  | Wie Dateien gesendet werden                 | Erforderliche Einrichtung                       |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → Benutzer akzeptiert → Bot lädt hoch | Funktioniert sofort                          |
| **Gruppenchats/Channels**| Upload nach SharePoint → Link teilen        | Erfordert `sharePointSiteId` + Graph-Berechtigungen |
| **Bilder (jeder Kontext)** | Base64-kodiert inline                    | Funktioniert sofort                             |

### Warum Gruppenchats SharePoint benötigen

Bots haben kein persönliches OneDrive-Laufwerk (der Graph-API-Endpunkt `/me/drive` funktioniert nicht für Application-Identitäten). Um Dateien in Gruppenchats/Channels zu senden, lädt der Bot nach **einer SharePoint-Site** hoch und erstellt einen Freigabelink.

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

   # Antwort enthält: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Konfigurieren Sie OpenClaw:**

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

Hochgeladene Dateien werden in einem Ordner `/OpenClawShared/` in der Standard-Dokumentbibliothek der konfigurierten SharePoint-Site gespeichert.

## Umfragen (Adaptive Cards)

OpenClaw sendet Teams-Umfragen als Adaptive Cards (es gibt keine native Teams-API für Umfragen).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stimmen werden vom Gateway in `~/.openclaw/msteams-polls.json` aufgezeichnet.
- Das Gateway muss online bleiben, um Stimmen aufzuzeichnen.
- Umfragen veröffentlichen derzeit noch keine Ergebniszusammenfassungen automatisch (prüfen Sie bei Bedarf die Store-Datei).

## Präsentationskarten

Senden Sie semantische Präsentations-Payloads an Teams-Benutzer oder Konversationen mit dem `message`-Tool oder der CLI. OpenClaw rendert sie aus dem generischen Präsentationsvertrag als Teams Adaptive Cards.

Der Parameter `presentation` akzeptiert semantische Blöcke. Wenn `presentation` angegeben wird, ist der Nachrichtentext optional.

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

Details zum Zielformat finden Sie unten unter [Zielformate](#target-formats).

## Zielformate

MSTeams-Ziele verwenden Präfixe, um zwischen Benutzern und Konversationen zu unterscheiden:

| Zieltyp               | Format                           | Beispiel                                            |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Benutzer (nach ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Benutzer (nach Name)  | `user:<display-name>`            | `user:John Smith` (erfordert Graph API)            |
| Gruppe/Channel        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Gruppe/Channel (roh)  | `<conversation-id>`              | `19:abc123...@thread.tacv2` (wenn `@thread` enthalten ist) |

**CLI-Beispiele:**

```bash
# An einen Benutzer per ID senden
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# An einen Benutzer per Anzeigename senden (löst Graph-API-Abfrage aus)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# An einen Gruppenchat oder Channel senden
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

Hinweis: Ohne das Präfix `user:` werden Namen standardmäßig als Gruppen-/Team-Auflösung behandelt. Verwenden Sie immer `user:`, wenn Sie Personen über ihren Anzeigenamen ansprechen.

## Proaktive Nachrichten

- Proaktive Nachrichten sind nur möglich, **nachdem** ein Benutzer interagiert hat, da wir erst dann Konversationsreferenzen speichern.
- Siehe `/gateway/configuration` für `dmPolicy` und Allowlist-Steuerung.

## Team- und Channel-IDs

Der Query-Parameter `groupId` in Teams-URLs ist **nicht** die Team-ID, die für die Konfiguration verwendet wird. Extrahieren Sie IDs stattdessen aus dem URL-Pfad:

**Team-URL:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team-ID (URL-dekodieren)
```

**Channel-URL:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel-ID (URL-dekodieren)
```

**Für die Konfiguration:**

- Team-ID = Pfadsegment nach `/team/` (URL-dekodiert, z. B. `19:Bk4j...@thread.tacv2`)
- Channel-ID = Pfadsegment nach `/channel/` (URL-dekodiert)
- Den Query-Parameter `groupId` **ignorieren**

## Private Channels

Bots werden in privaten Channels nur eingeschränkt unterstützt:

| Funktion                     | Standard-Channels | Private Channels      |
| ---------------------------- | ----------------- | --------------------- |
| Bot-Installation             | Ja                | Eingeschränkt         |
| Echtzeitnachrichten (Webhook)| Ja                | Funktioniert ggf. nicht |
| RSC-Berechtigungen           | Ja                | Verhalten ggf. anders |
| @Erwähnungen                 | Ja                | Falls Bot erreichbar ist |
| Graph-API-Verlauf            | Ja                | Ja (mit Berechtigungen) |

**Workarounds, falls private Channels nicht funktionieren:**

1. Verwenden Sie Standard-Channels für Bot-Interaktionen
2. Verwenden Sie DMs - Benutzer können dem Bot immer direkt schreiben
3. Verwenden Sie Graph API für den historischen Zugriff (erfordert `ChannelMessage.Read.All`)

## Fehlerbehebung

### Häufige Probleme

- **Bilder werden in Channels nicht angezeigt:** Graph-Berechtigungen oder Admin-Zustimmung fehlen. Installieren Sie die Teams-App neu und beenden/öffnen Sie Teams vollständig neu.
- **Keine Antworten im Channel:** Erwähnungen sind standardmäßig erforderlich; setzen Sie `channels.msteams.requireMention=false` oder konfigurieren Sie dies pro Team/Channel.
- **Versionskonflikt (Teams zeigt weiterhin altes Manifest):** Entfernen Sie die App und fügen Sie sie erneut hinzu, und beenden Sie Teams vollständig, um die Aktualisierung zu erzwingen.
- **401 Unauthorized vom Webhook:** Beim manuellen Testen ohne Azure-JWT zu erwarten - bedeutet, dass der Endpunkt erreichbar ist, aber die Authentifizierung fehlgeschlagen ist. Verwenden Sie Azure Web Chat, um korrekt zu testen.

### Fehler beim Hochladen des Manifests

- **"Icon file cannot be empty":** Das Manifest verweist auf Icon-Dateien mit 0 Bytes. Erstellen Sie gültige PNG-Icons (32x32 für `outline.png`, 192x192 für `color.png`).
- **"webApplicationInfo.Id already in use":** Die App ist noch in einem anderen Team/Chat installiert. Finden Sie sie und deinstallieren Sie sie zuerst, oder warten Sie 5–10 Minuten auf die Verteilung.
- **"Something went wrong" beim Upload:** Laden Sie stattdessen über [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) hoch, öffnen Sie die DevTools des Browsers (F12) → Tab „Network“ und prüfen Sie den Response-Body auf den tatsächlichen Fehler.
- **Sideload schlägt fehl:** Versuchen Sie „Upload an app to your org's app catalog“ anstelle von „Upload a custom app“ - das umgeht häufig Sideload-Beschränkungen.

### RSC-Berechtigungen funktionieren nicht

1. Prüfen Sie, dass `webApplicationInfo.id` exakt mit der App ID Ihres Bots übereinstimmt
2. Laden Sie die App erneut hoch und installieren Sie sie im Team/Chat neu
3. Prüfen Sie, ob Ihr Organisationsadministrator RSC-Berechtigungen blockiert hat
4. Bestätigen Sie, dass Sie den richtigen Scope verwenden: `ChannelMessage.Read.Group` für Teams, `ChatMessage.Read.Chat` für Gruppenchats

## Referenzen

- [Azure Bot erstellen](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Leitfaden zur Einrichtung von Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-Apps erstellen/verwalten
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Channel-Nachrichten mit RSC empfangen](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referenz zu RSC-Berechtigungen](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Dateiverarbeitung für Teams-Bots](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (für Channel/Gruppen ist Graph erforderlich)
- [Proaktive Nachrichten](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Verwandt

<CardGroup cols={2}>
  <Card title="Channels overview" icon="list" href="/de/channels">
    Alle unterstützten Channels.
  </Card>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    DM-Authentifizierung und Pairing-Ablauf.
  </Card>
  <Card title="Groups" icon="users" href="/de/channels/groups">
    Verhalten in Gruppenchats und Steuerung über Erwähnungen.
  </Card>
  <Card title="Channel routing" icon="route" href="/de/channels/channel-routing">
    Sitzungsrouting für Nachrichten.
  </Card>
  <Card title="Security" icon="shield" href="/de/gateway/security">
    Zugriffsmodell und Härtung.
  </Card>
</CardGroup>
