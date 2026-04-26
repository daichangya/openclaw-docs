---
read_when:
    - Lavorare sulle funzionalità del canale Microsoft Teams
summary: Stato del supporto, funzionalità e configurazione del bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

Stato: sono supportati testo + allegati DM; l'invio di file in canali/gruppi richiede `sharePointSiteId` + autorizzazioni Graph (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)). I sondaggi vengono inviati tramite Adaptive Cards. Le azioni sui messaggi espongono un `upload-file` esplicito per invii incentrati prima di tutto sui file.

## Plugin incluso

Microsoft Teams è distribuito come Plugin incluso nelle attuali release di OpenClaw, quindi nella normale build pacchettizzata non è richiesta alcuna installazione separata.

Se stai usando una build meno recente o un'installazione personalizzata che esclude Teams incluso, installalo manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

Il [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gestisce registrazione del bot, creazione del manifest e generazione delle credenziali in un unico comando.

**1. Installa ed effettua l'accesso**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verifica di aver effettuato l'accesso e visualizza le informazioni del tenant
```

> **Nota:** la Teams CLI è attualmente in anteprima. Comandi e flag possono cambiare tra una release e l'altra.

**2. Avvia un tunnel** (Teams non può raggiungere localhost)

Installa e autentica la devtunnel CLI se non l'hai già fatto ([guida introduttiva](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Configurazione una tantum (URL persistente tra sessioni):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Per ogni sessione di sviluppo:
devtunnel host my-openclaw-bot
# Il tuo endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **Nota:** `--allow-anonymous` è richiesto perché Teams non può autenticarsi con devtunnels. Ogni richiesta bot in ingresso viene comunque convalidata automaticamente dall'SDK di Teams.

Alternative: `ngrok http 3978` o `tailscale funnel 3978` (ma questi possono cambiare URL a ogni sessione).

**3. Crea l'app**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Questo singolo comando:

- Crea un'applicazione Entra ID (Azure AD)
- Genera un client secret
- Costruisce e carica un manifest dell'app Teams (con icone)
- Registra il bot (gestito da Teams per impostazione predefinita — non serve alcuna sottoscrizione Azure)

L'output mostrerà `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` e un **Teams App ID**: annotali per i passaggi successivi. Offre anche la possibilità di installare direttamente l'app in Teams.

**4. Configura OpenClaw** usando le credenziali dell'output:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Oppure usa direttamente le variabili d'ambiente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Installa l'app in Teams**

`teams app create` ti chiederà di installare l'app: seleziona "Install in Teams". Se hai saltato questo passaggio, puoi recuperare il link in seguito:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifica che tutto funzioni**

```bash
teams app doctor <teamsAppId>
```

Questo esegue la diagnostica su registrazione del bot, configurazione dell'app AAD, validità del manifest e configurazione SSO.

Per le distribuzioni di produzione, valuta l'uso di [autenticazione federata](#federated-authentication-certificate--managed-identity) (certificato o identità gestita) invece dei client secret.

Nota: le chat di gruppo sono bloccate per impostazione predefinita (`channels.msteams.groupPolicy: "allowlist"`). Per consentire le risposte nei gruppi, imposta `channels.msteams.groupAllowFrom` (oppure usa `groupPolicy: "open"` per consentire qualsiasi membro, con controllo tramite menzione).

## Obiettivi

- Parlare con OpenClaw tramite DM, chat di gruppo o canali di Teams.
- Mantenere instradamento deterministico: le risposte tornano sempre al canale da cui sono arrivate.
- Usare per impostazione predefinita un comportamento sicuro nei canali (menzioni richieste, salvo configurazione diversa).

## Scritture della configurazione

Per impostazione predefinita, Microsoft Teams può scrivere aggiornamenti di configurazione attivati da `/config set|unset` (richiede `commands.config: true`).

Disabilita con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controllo degli accessi (DM + gruppi)

**Accesso DM**

- Predefinito: `channels.msteams.dmPolicy = "pairing"`. I mittenti sconosciuti vengono ignorati finché non vengono approvati.
- `channels.msteams.allowFrom` dovrebbe usare ID oggetto AAD stabili.
- Non fare affidamento sulla corrispondenza di UPN/nome visualizzato per le allowlist: possono cambiare. OpenClaw disabilita per impostazione predefinita la corrispondenza diretta per nome; attivala esplicitamente con `channels.msteams.dangerouslyAllowNameMatching: true`.
- La procedura guidata può risolvere i nomi in ID tramite Microsoft Graph quando le credenziali lo consentono.

**Accesso ai gruppi**

- Predefinito: `channels.msteams.groupPolicy = "allowlist"` (bloccato finché non aggiungi `groupAllowFrom`). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non è impostato.
- `channels.msteams.groupAllowFrom` controlla quali mittenti possono attivare il bot nelle chat di gruppo/canali (con fallback a `channels.msteams.allowFrom`).
- Imposta `groupPolicy: "open"` per consentire qualsiasi membro (con controllo tramite menzione per impostazione predefinita).
- Per non consentire **alcun canale**, imposta `channels.msteams.groupPolicy: "disabled"`.

Esempio:

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

**Teams + allowlist dei canali**

- Limita le risposte nei gruppi/canali elencando team e canali sotto `channels.msteams.teams`.
- Le chiavi dovrebbero usare ID team stabili e ID conversazione del canale.
- Quando `groupPolicy="allowlist"` ed è presente una allowlist dei team, vengono accettati solo i team/canali elencati (con controllo tramite menzione).
- La procedura guidata di configurazione accetta voci `Team/Channel` e le memorizza per te.
- All'avvio, OpenClaw risolve i nomi di team/canali e utenti nelle allowlist in ID (quando le autorizzazioni Graph lo consentono)
  e registra la mappatura nei log; i nomi di team/canali non risolti vengono mantenuti come digitati ma ignorati per l'instradamento per impostazione predefinita, salvo che `channels.msteams.dangerouslyAllowNameMatching: true` non sia abilitato.

Esempio:

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

<details>
<summary><strong>Configurazione manuale (senza la Teams CLI)</strong></summary>

Se non puoi usare la Teams CLI, puoi configurare il bot manualmente tramite il Portale di Azure.

### Come funziona

1. Assicurati che il Plugin Microsoft Teams sia disponibile (incluso nelle release attuali).
2. Crea un **Azure Bot** (App ID + secret + tenant ID).
3. Costruisci un **pacchetto app Teams** che faccia riferimento al bot e includa le autorizzazioni RSC indicate sotto.
4. Carica/installa l'app Teams in un team (o in ambito personale per i DM).
5. Configura `msteams` in `~/.openclaw/openclaw.json` (o variabili d'ambiente) e avvia il Gateway.
6. Il Gateway ascolta il traffico webhook Bot Framework su `/api/messages` per impostazione predefinita.

### Passaggio 1: creare Azure Bot

1. Vai a [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Compila la scheda **Basics**:

   | Campo              | Valore                                                   |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nome del bot, ad esempio `openclaw-msteams` (deve essere univoco) |
   | **Subscription**   | Seleziona la tua sottoscrizione Azure                    |
   | **Resource group** | Creane uno nuovo oppure usane uno esistente              |
   | **Pricing tier**   | **Free** per sviluppo/test                               |
   | **Type of App**    | **Single Tenant** (consigliato - vedi nota sotto)        |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Avviso di deprecazione:** la creazione di nuovi bot multi-tenant è stata deprecata dopo il 2025-07-31. Usa **Single Tenant** per i nuovi bot.

3. Fai clic su **Review + create** → **Create** (attendi ~1-2 minuti)

### Passaggio 2: ottenere le credenziali

1. Vai alla risorsa Azure Bot → **Configuration**
2. Copia **Microsoft App ID** → questo è il tuo `appId`
3. Fai clic su **Manage Password** → vai alla registrazione dell'app
4. In **Certificates & secrets** → **New client secret** → copia il **Value** → questo è il tuo `appPassword`
5. Vai a **Overview** → copia **Directory (tenant) ID** → questo è il tuo `tenantId`

### Passaggio 3: configurare l'endpoint di messaggistica

1. In Azure Bot → **Configuration**
2. Imposta **Messaging endpoint** al tuo URL webhook:
   - Produzione: `https://your-domain.com/api/messages`
   - Sviluppo locale: usa un tunnel (vedi [Sviluppo locale](#local-development-tunneling) sotto)

### Passaggio 4: abilitare il canale Teams

1. In Azure Bot → **Channels**
2. Fai clic su **Microsoft Teams** → Configure → Save
3. Accetta i Termini di servizio

### Passaggio 5: costruire il manifest dell'app Teams

- Includi una voce `bot` con `botId = <App ID>`.
- Ambiti: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (richiesto per la gestione dei file in ambito personale).
- Aggiungi autorizzazioni RSC (vedi [Autorizzazioni RSC](#current-teams-rsc-permissions-manifest)).
- Crea le icone: `outline.png` (32x32) e `color.png` (192x192).
- Comprimi insieme tutti e tre i file: `manifest.json`, `outline.png`, `color.png`.

### Passaggio 6: configurare OpenClaw

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

Variabili d'ambiente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Passaggio 7: eseguire il Gateway

Il canale Teams si avvia automaticamente quando il Plugin è disponibile ed esiste una configurazione `msteams` con credenziali.

</details>

## Autenticazione federata (certificato + identità gestita)

> Aggiunto in 2026.3.24

Per le distribuzioni di produzione, OpenClaw supporta **l'autenticazione federata** come alternativa più sicura ai client secret. Sono disponibili due metodi:

### Opzione A: autenticazione basata su certificato

Usa un certificato PEM registrato con la registrazione dell'app Entra ID.

**Configurazione:**

1. Genera o ottieni un certificato (formato PEM con chiave privata).
2. In Entra ID → App Registration → **Certificates & secrets** → **Certificates** → carica il certificato pubblico.

**Config:**

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

**Variabili d'ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opzione B: Azure Managed Identity

Usa Azure Managed Identity per un'autenticazione senza password. È ideale per distribuzioni su infrastruttura Azure (AKS, App Service, VM Azure) in cui è disponibile un'identità gestita.

**Come funziona:**

1. Il pod/VM del bot dispone di un'identità gestita (assegnata dal sistema o dall'utente).
2. Una **federated identity credential** collega l'identità gestita alla registrazione dell'app Entra ID.
3. A runtime, OpenClaw usa `@azure/identity` per acquisire token dall'endpoint Azure IMDS (`169.254.169.254`).
4. Il token viene passato all'SDK di Teams per l'autenticazione del bot.

**Prerequisiti:**

- Infrastruttura Azure con identità gestita abilitata (AKS workload identity, App Service, VM)
- Federated identity credential creata sulla registrazione dell'app Entra ID
- Accesso di rete a IMDS (`169.254.169.254:80`) dal pod/VM

**Config (identità gestita assegnata dal sistema):**

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

**Config (identità gestita assegnata dall'utente):**

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

**Variabili d'ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo per assegnazione utente)

### Configurazione di AKS Workload Identity

Per le distribuzioni AKS che usano workload identity:

1. **Abilita workload identity** sul tuo cluster AKS.
2. **Crea una federated identity credential** sulla registrazione dell'app Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annota il service account Kubernetes** con l'ID client dell'app:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Etichetta il pod** per l'iniezione di workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Assicurati dell'accesso di rete** a IMDS (`169.254.169.254`) — se usi NetworkPolicy, aggiungi una regola egress che consenta traffico verso `169.254.169.254/32` sulla porta 80.

### Confronto tra tipi di autenticazione

| Metodo               | Config                                         | Pro                                  | Contro                                |
| -------------------- | ---------------------------------------------- | ------------------------------------ | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Configurazione semplice              | Richiede rotazione dei secret, meno sicuro |
| **Certificato**      | `authType: "federated"` + `certificatePath`    | Nessun secret condiviso sulla rete   | Sovraccarico di gestione certificati  |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Senza password, nessun secret da gestire | Richiede infrastruttura Azure     |

**Comportamento predefinito:** quando `authType` non è impostato, OpenClaw usa per impostazione predefinita l'autenticazione con client secret. Le configurazioni esistenti continuano a funzionare senza modifiche.

## Sviluppo locale (tunneling)

Teams non può raggiungere `localhost`. Usa un dev tunnel persistente così il tuo URL rimane lo stesso tra una sessione e l'altra:

```bash
# Configurazione una tantum:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Per ogni sessione di sviluppo:
devtunnel host my-openclaw-bot
```

Alternative: `ngrok http 3978` o `tailscale funnel 3978` (gli URL possono cambiare a ogni sessione).

Se l'URL del tunnel cambia, aggiorna l'endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Test del bot

**Esegui la diagnostica:**

```bash
teams app doctor <teamsAppId>
```

Controlla in un solo passaggio registrazione del bot, app AAD, manifest e configurazione SSO.

**Invia un messaggio di test:**

1. Installa l'app Teams (usa il link di installazione da `teams app get <id> --install-link`)
2. Trova il bot in Teams e invia un DM
3. Controlla i log del Gateway per l'attività in ingresso

## Variabili d'ambiente

Tutte le chiavi di configurazione possono essere impostate anche tramite variabili d'ambiente:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (facoltativo: `"secret"` o `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federata + certificato)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (facoltativo, non richiesto per l'autenticazione)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federata + identità gestita)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (solo MI assegnata dall'utente)

## Azione informazioni membro

OpenClaw espone un'azione `member-info` basata su Graph per Microsoft Teams, così agenti e automazioni possono risolvere direttamente da Microsoft Graph i dettagli dei membri del canale (nome visualizzato, email, ruolo).

Requisiti:

- autorizzazione RSC `Member.Read.Group` (già presente nel manifest consigliato)
- per ricerche tra team diversi: autorizzazione applicativa Graph `User.Read.All` con consenso amministratore

L'azione è controllata da `channels.msteams.actions.memberInfo` (predefinita: abilitata quando sono disponibili credenziali Graph).

## Contesto cronologia

- `channels.msteams.historyLimit` controlla quanti messaggi recenti di canale/gruppo vengono inclusi nel prompt.
- Fa fallback a `messages.groupChat.historyLimit`. Imposta `0` per disabilitare (predefinito 50).
- La cronologia dei thread recuperata viene filtrata in base alle allowlist dei mittenti (`allowFrom` / `groupAllowFrom`), quindi il seeding del contesto del thread include solo messaggi da mittenti consentiti.
- Il contesto degli allegati citati (`ReplyTo*` derivato dall'HTML di risposta di Teams) attualmente viene passato così come ricevuto.
- In altre parole, le allowlist controllano chi può attivare l'agente; oggi vengono filtrati solo specifici percorsi di contesto supplementare.
- La cronologia DM può essere limitata con `channels.msteams.dmHistoryLimit` (turni utente). Override per utente: `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorizzazioni RSC Teams attuali (manifest)

Queste sono le **resourceSpecific permissions** esistenti nel nostro manifest dell'app Teams. Si applicano solo all'interno del team/chat in cui l'app è installata.

**Per i canali (ambito team):**

- `ChannelMessage.Read.Group` (Application) - riceve tutti i messaggi del canale senza @menzione
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Per le chat di gruppo:**

- `ChatMessage.Read.Chat` (Application) - riceve tutti i messaggi della chat di gruppo senza @menzione

Per aggiungere autorizzazioni RSC tramite la Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Esempio di manifest Teams (con dati omessi)

Esempio minimo e valido con i campi richiesti. Sostituisci ID e URL.

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

### Note sul manifest (campi obbligatori)

- `bots[].botId` **deve** corrispondere all'App ID di Azure Bot.
- `webApplicationInfo.id` **deve** corrispondere all'App ID di Azure Bot.
- `bots[].scopes` deve includere le superfici che prevedi di usare (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` è richiesto per la gestione dei file nell'ambito personale.
- `authorization.permissions.resourceSpecific` deve includere lettura/invio dei canali se vuoi traffico nei canali.

### Aggiornamento di un'app esistente

Per aggiornare un'app Teams già installata (ad esempio per aggiungere autorizzazioni RSC):

```bash
# Scarica, modifica e ricarica il manifest
teams app manifest download <teamsAppId> manifest.json
# Modifica manifest.json in locale...
teams app manifest upload manifest.json <teamsAppId>
# La versione viene incrementata automaticamente se il contenuto è cambiato
```

Dopo l'aggiornamento, reinstalla l'app in ogni team affinché le nuove autorizzazioni abbiano effetto, quindi **chiudi completamente e riavvia Teams** (non limitarti a chiudere la finestra) per cancellare i metadati dell'app in cache.

<details>
<summary>Aggiornamento manuale del manifest (senza CLI)</summary>

1. Aggiorna `manifest.json` con le nuove impostazioni
2. **Incrementa il campo `version`** (ad esempio `1.0.0` → `1.1.0`)
3. **Ricrea lo zip** del manifest con le icone (`manifest.json`, `outline.png`, `color.png`)
4. Carica il nuovo zip:
   - **Teams Admin Center:** Teams apps → Manage apps → trova la tua app → Upload new version
   - **Sideload:** in Teams → Apps → Manage your apps → Upload a custom app

</details>

## Capacità: solo RSC vs Graph

### Con **solo Teams RSC** (app installata, nessuna autorizzazione Microsoft Graph API)

Funziona:

- Lettura del contenuto **testuale** dei messaggi del canale.
- Invio del contenuto **testuale** dei messaggi del canale.
- Ricezione di allegati file in **ambito personale (DM)**.

NON funziona:

- Contenuti **immagine o file** di canali/gruppi (il payload include solo uno stub HTML).
- Download di allegati archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi (oltre l'evento webhook live).

### Con **Teams RSC + autorizzazioni applicative Microsoft Graph**

Aggiunge:

- Download dei contenuti ospitati (immagini incollate nei messaggi).
- Download di allegati file archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi di canale/chat tramite Graph.

### RSC vs Graph API

| Capacità                | Autorizzazioni RSC   | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Messaggi in tempo reale** | Sì (tramite webhook) | No (solo polling)                |
| **Messaggi storici**    | No                   | Sì (può interrogare la cronologia)  |
| **Complessità di configurazione** | Solo manifest app | Richiede consenso amministratore + flusso token |
| **Funziona offline**    | No (deve essere in esecuzione) | Sì (interrogabile in qualsiasi momento) |

**In sintesi:** RSC serve per l'ascolto in tempo reale; Graph API serve per l'accesso storico. Per recuperare i messaggi persi mentre sei offline, ti serve Graph API con `ChannelMessage.Read.All` (richiede consenso amministratore).

## Contenuti multimediali + cronologia con Graph abilitato (richiesto per i canali)

Se hai bisogno di immagini/file nei **canali** o vuoi recuperare la **cronologia dei messaggi**, devi abilitare le autorizzazioni Microsoft Graph e concedere il consenso amministratore.

1. In Entra ID (Azure AD) **App Registration**, aggiungi autorizzazioni applicative Microsoft Graph:
   - `ChannelMessage.Read.All` (allegati canale + cronologia)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chat di gruppo)
2. **Concedi il consenso amministratore** per il tenant.
3. Incrementa la **versione del manifest** dell'app Teams, ricaricalo e **reinstalla l'app in Teams**.
4. **Chiudi completamente e riavvia Teams** per cancellare i metadati dell'app in cache.

**Autorizzazione aggiuntiva per le menzioni utente:** le @menzioni utente funzionano immediatamente per gli utenti nella conversazione. Tuttavia, se vuoi cercare dinamicamente e menzionare utenti che **non sono nella conversazione corrente**, aggiungi l'autorizzazione applicativa `User.Read.All` e concedi il consenso amministratore.

## Limitazioni note

### Timeout webhook

Teams consegna i messaggi tramite webhook HTTP. Se l'elaborazione richiede troppo tempo (ad esempio risposte LLM lente), potresti vedere:

- timeout del Gateway
- nuovi tentativi di invio del messaggio da parte di Teams (con conseguenti duplicati)
- risposte perse

OpenClaw gestisce questo comportamento restituendo rapidamente una risposta e inviando le repliche in modo proattivo, ma risposte molto lente possono comunque causare problemi.

### Formattazione

Il markdown di Teams è più limitato di quello di Slack o Discord:

- La formattazione di base funziona: **grassetto**, _corsivo_, `code`, link
- Il markdown complesso (tabelle, liste annidate) potrebbe non essere visualizzato correttamente
- Le Adaptive Cards sono supportate per i sondaggi e per gli invii di presentazione semantica (vedi sotto)

## Configurazione

Impostazioni principali (vedi `/gateway/configuration` per i pattern condivisi tra canali):

- `channels.msteams.enabled`: abilita/disabilita il canale.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenziali del bot.
- `channels.msteams.webhook.port` (predefinito `3978`)
- `channels.msteams.webhook.path` (predefinito `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing)
- `channels.msteams.allowFrom`: allowlist DM (consigliati ID oggetto AAD). La procedura guidata risolve i nomi in ID durante la configurazione quando è disponibile l'accesso a Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: interruttore di emergenza per riabilitare la corrispondenza mutabile di UPN/nome visualizzato e l'instradamento diretto per nome di team/canale.
- `channels.msteams.textChunkLimit`: dimensione dei blocchi di testo in uscita.
- `channels.msteams.chunkMode`: `length` (predefinito) oppure `newline` per suddividere sulle righe vuote (confini dei paragrafi) prima della suddivisione per lunghezza.
- `channels.msteams.mediaAllowHosts`: allowlist per gli host degli allegati in ingresso (predefinita ai domini Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist per allegare header Authorization nei nuovi tentativi sui contenuti multimediali (predefinita agli host Graph + Bot Framework).
- `channels.msteams.requireMention`: richiede @menzione nei canali/gruppi (predefinito true).
- `channels.msteams.replyStyle`: `thread | top-level` (vedi [Stile di risposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per team.
- `channels.msteams.teams.<teamId>.requireMention`: override per team.
- `channels.msteams.teams.<teamId>.tools`: override predefiniti del criterio degli strumenti per team (`allow`/`deny`/`alsoAllow`) usati quando manca un override del canale.
- `channels.msteams.teams.<teamId>.toolsBySender`: override predefiniti del criterio degli strumenti per team e mittente (`"*"` wildcard supportato).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override del criterio degli strumenti per canale (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override del criterio degli strumenti per canale e mittente (`"*"` wildcard supportato).
- Le chiavi `toolsBySender` dovrebbero usare prefissi espliciti:
  `id:`, `e164:`, `username:`, `name:` (le chiavi legacy senza prefisso vengono comunque mappate solo a `id:`).
- `channels.msteams.actions.memberInfo`: abilita o disabilita l'azione informazioni membro basata su Graph (predefinita: abilitata quando sono disponibili credenziali Graph).
- `channels.msteams.authType`: tipo di autenticazione — `"secret"` (predefinito) oppure `"federated"`.
- `channels.msteams.certificatePath`: percorso del file certificato PEM (federata + autenticazione con certificato).
- `channels.msteams.certificateThumbprint`: impronta digitale del certificato (facoltativa, non richiesta per l'autenticazione).
- `channels.msteams.useManagedIdentity`: abilita l'autenticazione con identità gestita (modalità federata).
- `channels.msteams.managedIdentityClientId`: ID client per identità gestita assegnata dall'utente.
- `channels.msteams.sharePointSiteId`: ID del sito SharePoint per i caricamenti di file nelle chat di gruppo/canali (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)).

## Instradamento e sessioni

- Le chiavi di sessione seguono il formato standard degli agenti (vedi [/concepts/session](/it/concepts/session)):
  - I messaggi diretti condividono la sessione principale (`agent:<agentId>:<mainKey>`).
  - I messaggi di canale/gruppo usano l'ID conversazione:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Stile di risposta: thread vs post

Teams ha recentemente introdotto due stili di interfaccia per i canali sopra lo stesso modello dati sottostante:

| Stile                    | Descrizione                                              | `replyStyle` consigliato |
| ------------------------ | -------------------------------------------------------- | ------------------------ |
| **Posts** (classico)     | I messaggi appaiono come card con risposte in thread sotto | `thread` (predefinito) |
| **Threads** (simile a Slack) | I messaggi scorrono in modo lineare, più simile a Slack | `top-level`           |

**Il problema:** l'API di Teams non espone quale stile UI usa un canale. Se usi il `replyStyle` sbagliato:

- `thread` in un canale in stile Threads → le risposte appaiono annidate in modo scomodo
- `top-level` in un canale in stile Posts → le risposte appaiono come post separati di livello superiore invece che nel thread

**Soluzione:** configura `replyStyle` per canale in base a come è impostato il canale:

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

## Allegati e immagini

**Limitazioni attuali:**

- **DM:** immagini e allegati file funzionano tramite le API file bot di Teams.
- **Canali/gruppi:** gli allegati risiedono nello storage M365 (SharePoint/OneDrive). Il payload webhook include solo uno stub HTML, non i byte effettivi del file. **Sono richieste autorizzazioni Graph API** per scaricare gli allegati dei canali.
- Per invii espliciti incentrati prima di tutto sui file, usa `action=upload-file` con `media` / `filePath` / `path`; `message` facoltativo diventa il testo/commento di accompagnamento, e `filename` sovrascrive il nome caricato.

Senza autorizzazioni Graph, i messaggi di canale con immagini verranno ricevuti solo come testo (il contenuto dell'immagine non è accessibile al bot).
Per impostazione predefinita, OpenClaw scarica contenuti multimediali solo da hostname Microsoft/Teams. Fai override con `channels.msteams.mediaAllowHosts` (usa `["*"]` per consentire qualsiasi host).
Gli header Authorization vengono allegati solo per gli host in `channels.msteams.mediaAuthAllowHosts` (predefiniti agli host Graph + Bot Framework). Mantieni questo elenco restrittivo (evita suffissi multi-tenant).

## Invio di file nelle chat di gruppo

I bot possono inviare file nei DM usando il flusso FileConsentCard (integrato). Tuttavia, **l'invio di file nelle chat di gruppo/canali** richiede una configurazione aggiuntiva:

| Contesto                 | Modalità di invio dei file                   | Configurazione necessaria                         |
| ------------------------ | -------------------------------------------- | ------------------------------------------------ |
| **DM**                   | FileConsentCard → l'utente accetta → il bot carica | Funziona immediatamente                     |
| **Chat di gruppo/canali** | Caricamento su SharePoint → link di condivisione | Richiede `sharePointSiteId` + autorizzazioni Graph |
| **Immagini (qualsiasi contesto)** | Inline codificate in Base64           | Funziona immediatamente                           |

### Perché le chat di gruppo richiedono SharePoint

I bot non hanno un drive OneDrive personale (l'endpoint Graph API `/me/drive` non funziona per identità applicative). Per inviare file nelle chat di gruppo/canali, il bot carica su un **sito SharePoint** e crea un link di condivisione.

### Configurazione

1. **Aggiungi autorizzazioni Graph API** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - caricare file su SharePoint
   - `Chat.Read.All` (Application) - facoltativo, abilita link di condivisione per utente

2. **Concedi il consenso amministratore** per il tenant.

3. **Ottieni l'ID del tuo sito SharePoint:**

   ```bash
   # Tramite Graph Explorer o curl con un token valido:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Esempio: per un sito in "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # La risposta include: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configura OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... altra configurazione ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento della condivisione

| Autorizzazione                           | Comportamento della condivisione                      |
| ---------------------------------------- | ----------------------------------------------------- |
| `Sites.ReadWrite.All` soltanto           | Link di condivisione a livello organizzazione (chiunque nell'organizzazione può accedere) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Link di condivisione per utente (solo i membri della chat possono accedere) |

La condivisione per utente è più sicura perché solo i partecipanti alla chat possono accedere al file. Se manca l'autorizzazione `Chat.Read.All`, il bot ripiega sulla condivisione a livello organizzazione.

### Comportamento di fallback

| Scenario                                          | Risultato                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat di gruppo + file + `sharePointSiteId` configurato | Carica su SharePoint, invia link di condivisione |
| Chat di gruppo + file + nessun `sharePointSiteId` | Tenta il caricamento su OneDrive (può fallire), invia solo testo |
| Chat personale + file                             | Flusso FileConsentCard (funziona senza SharePoint) |
| Qualsiasi contesto + immagine                     | Inline codificata in Base64 (funziona senza SharePoint) |

### Posizione di archiviazione dei file

I file caricati vengono archiviati in una cartella `/OpenClawShared/` nella raccolta documenti predefinita del sito SharePoint configurato.

## Sondaggi (Adaptive Cards)

OpenClaw invia i sondaggi di Teams come Adaptive Cards (non esiste un'API nativa dei sondaggi di Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- I voti vengono registrati dal Gateway in `~/.openclaw/msteams-polls.json`.
- Il Gateway deve restare online per registrare i voti.
- I sondaggi non pubblicano ancora automaticamente riepiloghi dei risultati (se necessario, ispeziona il file di archiviazione).

## Card di presentazione

Invia payload di presentazione semantica a utenti o conversazioni Teams usando lo strumento `message` o la CLI. OpenClaw li renderizza come Adaptive Cards di Teams a partire dal contratto di presentazione generico.

Il parametro `presentation` accetta blocchi semantici. Quando `presentation` è fornito, il testo del messaggio è facoltativo.

**Strumento agente:**

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

Per i dettagli sul formato del target, vedi [Formati target](#target-formats) sotto.

## Formati target

I target MSTeams usano prefissi per distinguere tra utenti e conversazioni:

| Tipo di target        | Formato                          | Esempio                                             |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Utente (per ID)       | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utente (per nome)     | `user:<display-name>`            | `user:John Smith` (richiede Graph API)              |
| Gruppo/canale         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Gruppo/canale (grezzo) | `<conversation-id>`             | `19:abc123...@thread.tacv2` (se contiene `@thread`) |

**Esempi CLI:**

```bash
# Invia a un utente per ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Invia a un utente per nome visualizzato (attiva una ricerca Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Invia a una chat di gruppo o a un canale
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Invia una card di presentazione a una conversazione
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Esempi di strumento agente:**

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

Nota: senza il prefisso `user:`, i nomi usano come impostazione predefinita la risoluzione di gruppo/team. Usa sempre `user:` quando indirizzi persone tramite nome visualizzato.

## Messaggistica proattiva

- I messaggi proattivi sono possibili solo **dopo** che un utente ha interagito, perché in quel momento archiviamo i riferimenti della conversazione.
- Vedi `/gateway/configuration` per `dmPolicy` e il controllo tramite allowlist.

## ID team e canale (errore comune)

Il parametro di query `groupId` negli URL di Teams **NON** è l'ID team usato per la configurazione. Estrai invece gli ID dal percorso dell'URL:

**URL team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID team (decodifica questo URL)
```

**URL canale:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID canale (decodifica questo URL)
```

**Per la configurazione:**

- ID team = segmento del percorso dopo `/team/` (decodificato URL, ad esempio `19:Bk4j...@thread.tacv2`)
- ID canale = segmento del percorso dopo `/channel/` (decodificato URL)
- **Ignora** il parametro di query `groupId`

## Canali privati

I bot hanno supporto limitato nei canali privati:

| Funzionalità                  | Canali standard   | Canali privati         |
| ----------------------------- | ----------------- | ---------------------- |
| Installazione del bot         | Sì                | Limitata               |
| Messaggi in tempo reale (webhook) | Sì            | Potrebbe non funzionare |
| Autorizzazioni RSC            | Sì                | Potrebbero comportarsi in modo diverso |
| @menzioni                     | Sì                | Se il bot è accessibile |
| Cronologia Graph API          | Sì                | Sì (con autorizzazioni) |

**Soluzioni alternative se i canali privati non funzionano:**

1. Usa canali standard per le interazioni con il bot
2. Usa i DM - gli utenti possono sempre inviare messaggi direttamente al bot
3. Usa Graph API per l'accesso storico (richiede `ChannelMessage.Read.All`)

## Risoluzione dei problemi

### Problemi comuni

- **Le immagini non vengono visualizzate nei canali:** mancano autorizzazioni Graph o consenso amministratore. Reinstalla l'app Teams e chiudi/riapri completamente Teams.
- **Nessuna risposta nel canale:** le menzioni sono richieste per impostazione predefinita; imposta `channels.msteams.requireMention=false` oppure configura per team/canale.
- **Versione non corrispondente (Teams mostra ancora il vecchio manifest):** rimuovi e aggiungi di nuovo l'app, quindi chiudi completamente Teams per aggiornare.
- **401 Unauthorized dal webhook:** previsto durante i test manuali senza Azure JWT - significa che l'endpoint è raggiungibile ma l'autenticazione non è riuscita. Usa Azure Web Chat per testare correttamente.

### Errori di caricamento del manifest

- **"Icon file cannot be empty":** il manifest fa riferimento a file icona di 0 byte. Crea icone PNG valide (32x32 per `outline.png`, 192x192 per `color.png`).
- **"webApplicationInfo.Id already in use":** l'app è ancora installata in un altro team/chat. Trovala e disinstallala prima, oppure attendi 5-10 minuti per la propagazione.
- **"Something went wrong" durante il caricamento:** carica invece tramite [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), apri gli strumenti di sviluppo del browser (F12) → scheda Network, e controlla il corpo della risposta per l'errore reale.
- **Sideload non riuscito:** prova "Upload an app to your org's app catalog" invece di "Upload a custom app" - spesso questo aggira le restrizioni di sideload.

### Autorizzazioni RSC non funzionanti

1. Verifica che `webApplicationInfo.id` corrisponda esattamente all'App ID del tuo bot
2. Ricarica l'app e reinstallala nel team/chat
3. Controlla se l'amministratore dell'organizzazione ha bloccato le autorizzazioni RSC
4. Conferma di usare l'ambito corretto: `ChannelMessage.Read.Group` per i team, `ChatMessage.Read.Chat` per le chat di gruppo

## Riferimenti

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guida alla configurazione di Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - creare/gestire app Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canale/gruppo richiede Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI per la gestione dei bot

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento della chat di gruppo e controllo tramite menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
