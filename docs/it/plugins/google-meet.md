---
read_when:
    - Vuoi che un agente OpenClaw entri in una chiamata Google Meet
    - Vuoi che un agente OpenClaw crei una nuova chiamata Google Meet
    - Stai configurando Chrome, Chrome Node o Twilio come trasporto Google Meet
summary: 'Plugin Google Meet: entra in URL Meet espliciti tramite Chrome o Twilio con valori predefiniti vocali in tempo reale'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-25T13:52:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

Supporto ai partecipanti Google Meet per OpenClaw — il Plugin è esplicito per progettazione:

- Entra solo in un URL esplicito `https://meet.google.com/...`.
- Può creare un nuovo spazio Meet tramite l'API Google Meet, poi entrare nell'URL restituito.
- La voce `realtime` è la modalità predefinita.
- La voce in tempo reale può richiamare l'agente OpenClaw completo quando servono ragionamento più profondo o strumenti.
- Gli agenti scelgono il comportamento di ingresso con `mode`: usa `realtime` per ascolto/risposta live, oppure `transcribe` per entrare/controllare il browser senza il bridge vocale realtime.
- L'autenticazione parte come OAuth Google personale o come profilo Chrome già autenticato.
- Non c'è alcun annuncio automatico di consenso.
- Il backend audio Chrome predefinito è `BlackHole 2ch`.
- Chrome può essere eseguito localmente o su un host Node associato.
- Twilio accetta un numero dial-in più una sequenza PIN o DTMF opzionale.
- Il comando CLI è `googlemeet`; `meet` è riservato a flussi più ampi di teleconferenza agentica.

## Avvio rapido

Installa le dipendenze audio locali e configura un provider vocale realtime di backend. OpenAI è quello predefinito; Google Gemini Live funziona anche con `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# oppure
export GEMINI_API_KEY=...
```

`blackhole-2ch` installa il dispositivo audio virtuale `BlackHole 2ch`. L'installer Homebrew richiede un riavvio prima che macOS esponga il dispositivo:

```bash
sudo reboot
```

Dopo il riavvio, verifica entrambe le parti:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Abilita il Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Controlla la configurazione:

```bash
openclaw googlemeet setup
```

L'output di setup è pensato per essere leggibile dagli agenti. Riporta profilo Chrome, bridge audio, pinning del Node, intro realtime ritardata e, quando è configurata la delega Twilio, se il Plugin `voice-call` e le credenziali Twilio sono pronti.
Tratta qualsiasi controllo `ok: false` come un blocco prima di chiedere a un agente di entrare.
Usa `openclaw googlemeet setup --json` per script o output leggibile da macchina.

Entra in una riunione:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oppure lascia che un agente entri tramite lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Crea una nuova riunione e unisciti:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Crea solo l'URL senza entrare:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ha due percorsi:

- Creazione API: usata quando sono configurate credenziali OAuth Google Meet. Questo è il percorso più deterministico e non dipende dallo stato della UI del browser.
- Fallback browser: usato quando le credenziali OAuth sono assenti. OpenClaw usa il Chrome Node fissato, apre `https://meet.google.com/new`, attende che Google reindirizzi a un vero URL con codice riunione e poi restituisce quell'URL. Questo percorso richiede che il profilo Chrome OpenClaw sul Node abbia già effettuato l'accesso a Google.
  L'automazione del browser gestisce il prompt iniziale del microfono di Meet; quel prompt non viene trattato come un errore di login Google.
  I flussi di join e create provano anche a riutilizzare una scheda Meet esistente prima di aprirne una nuova. Il matching ignora query string innocue dell'URL come `authuser`, quindi un retry dell'agente dovrebbe focalizzare la riunione già aperta invece di creare una seconda scheda Chrome.

L'output del comando/dello strumento include un campo `source` (`api` o `browser`) così gli agenti possono spiegare quale percorso è stato usato. `create` entra nella nuova riunione per impostazione predefinita e restituisce `joined: true` più la sessione di join. Per generare solo l'URL, usa `create --no-join` nella CLI oppure passa `"join": false` allo strumento.

Oppure dì a un agente: "Crea un Google Meet, entra con voce realtime e mandami il link." L'agente dovrebbe chiamare `google_meet` con `action: "create"` e poi condividere il `meetingUri` restituito.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Per un join solo osservazione/controllo browser, imposta `"mode": "transcribe"`. Questo non avvia il bridge del modello realtime duplex, quindi non risponderà vocalmente nella riunione.

Durante le sessioni realtime, lo stato di `google_meet` include lo stato di salute del browser e del bridge audio come `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp dell'ultimo input/output, contatori di byte e stato di chiusura del bridge. Se compare un prompt sicuro della pagina Meet, l'automazione del browser lo gestisce quando può. Login, ammissione da parte dell'host e prompt di permessi browser/OS vengono riportati come azione manuale con motivo e messaggio da inoltrare dall'agente.

Chrome entra come profilo Chrome autenticato. In Meet, scegli `BlackHole 2ch` per il percorso microfono/altoparlante usato da OpenClaw. Per audio duplex pulito, usa dispositivi virtuali separati o un grafo in stile Loopback; un singolo dispositivo BlackHole basta per un primo smoke test ma può produrre eco.

### Gateway locale + Chrome in Parallels

Non hai bisogno di un Gateway OpenClaw completo o di una chiave API del modello dentro una VM macOS solo per fare in modo che la VM possieda Chrome. Esegui il Gateway e l'agente localmente, poi esegui un host Node nella VM. Abilita una volta il Plugin incluso nella VM così il Node pubblicizza il comando Chrome:

Cosa viene eseguito dove:

- Host Gateway: Gateway OpenClaw, workspace dell'agente, chiavi modello/API, provider realtime e configurazione del Plugin Google Meet.
- VM macOS Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch e un profilo Chrome autenticato su Google.
- Non necessario nella VM: servizio Gateway, configurazione agente, chiave OpenAI/GPT o configurazione del provider di modelli.

Installa le dipendenze nella VM:

```bash
brew install blackhole-2ch sox
```

Riavvia la VM dopo aver installato BlackHole in modo che macOS esponga `BlackHole 2ch`:

```bash
sudo reboot
```

Dopo il riavvio, verifica che la VM possa vedere il dispositivo audio e i comandi SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Installa o aggiorna OpenClaw nella VM, poi abilita lì il Plugin incluso:

```bash
openclaw plugins enable google-meet
```

Avvia l'host Node nella VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` è un IP LAN e non stai usando TLS, il Node rifiuta il WebSocket in chiaro a meno che tu non faccia opt-in per quella rete privata fidata:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la stessa variabile d'ambiente quando installi il Node come LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` è ambiente di processo, non un'impostazione `openclaw.json`. `openclaw node install` lo memorizza nell'ambiente del LaunchAgent quando è presente nel comando di installazione.

Approva il Node dall'host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Conferma che il Gateway veda il Node e che pubblicizzi sia `googlemeet.chrome` sia la capability browser/`browser.proxy`:

```bash
openclaw nodes status
```

Instrada Meet attraverso quel Node sull'host Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Ora entra normalmente dall'host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oppure chiedi all'agente di usare lo strumento `google_meet` con `transport: "chrome-node"`.

Per uno smoke test con un solo comando che crea o riusa una sessione, pronuncia una frase nota e stampa lo stato di salute della sessione:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante il join, l'automazione browser di OpenClaw compila il nome guest, fa clic su Join/Ask to join e accetta la scelta iniziale "Use microphone" di Meet quando compare quel prompt. Durante la creazione della riunione solo browser, può anche continuare oltre lo stesso prompt senza microfono se Meet non espone il pulsante use-microphone.
Se il profilo browser non è autenticato, Meet è in attesa di ammissione da parte dell'host, Chrome necessita del permesso microfono/fotocamera o Meet è bloccato su un prompt che l'automazione non ha potuto risolvere, il risultato di join/test-speech riporta `manualActionRequired: true` con `manualActionReason` e `manualActionMessage`. Gli agenti dovrebbero smettere di ritentare il join, riportare quel messaggio esatto più l'attuale `browserUrl`/`browserTitle`, e ritentare solo dopo il completamento dell'azione manuale nel browser.

Se `chromeNode.node` è omesso, OpenClaw seleziona automaticamente solo quando esattamente un Node connesso pubblicizza sia `googlemeet.chrome` sia il controllo browser. Se sono connessi diversi Node idonei, imposta `chromeNode.node` con l'ID del Node, il nome visualizzato o l'IP remoto.

Controlli comuni in caso di errore:

- `No connected Google Meet-capable node`: avvia `openclaw node run` nella VM, approva il pairing e assicurati che nella VM siano stati eseguiti `openclaw plugins enable google-meet` e `openclaw plugins enable browser`. Conferma anche che l'host Gateway consenta entrambi i comandi Node con `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: installa `blackhole-2ch` nella VM e riavviala.
- Chrome si apre ma non riesce a entrare: accedi al profilo browser nella VM oppure mantieni impostato `chrome.guestName` per il join guest. L'auto-join guest usa l'automazione browser OpenClaw tramite il proxy browser del Node; assicurati che la configurazione browser del Node punti al profilo desiderato, per esempio `browser.defaultProfile: "user"` o un profilo named existing-session.
- Schede Meet duplicate: lascia abilitato `chrome.reuseExistingTab: true`. OpenClaw attiva una scheda esistente per lo stesso URL Meet prima di aprirne una nuova, e la creazione della riunione via browser riusa una scheda `https://meet.google.com/new` o un prompt account Google in corso prima di aprirne un'altra.
- Nessun audio: in Meet, instrada microfono/altoparlante attraverso il percorso del dispositivo audio virtuale usato da OpenClaw; usa dispositivi virtuali separati o routing in stile Loopback per un duplex pulito.

## Note di installazione

Il valore predefinito realtime Chrome usa due strumenti esterni:

- `sox`: utility audio da riga di comando. Il Plugin usa i comandi `rec` e `play` per il bridge audio predefinito G.711 mu-law a 8 kHz.
- `blackhole-2ch`: driver audio virtuale macOS. Crea il dispositivo audio `BlackHole 2ch` attraverso cui Chrome/Meet possono essere instradati.

OpenClaw non include né ridistribuisce nessuno dei due pacchetti. La documentazione chiede agli utenti di installarli come dipendenze host tramite Homebrew. SoX è concesso in licenza come `LGPL-2.0-only AND GPL-2.0-only`; BlackHole è GPL-3.0. Se crei un installer o appliance che include BlackHole con OpenClaw, controlla i termini di licenza upstream di BlackHole oppure ottieni una licenza separata da Existential Audio.

## Trasporti

### Chrome

Il trasporto Chrome apre l'URL Meet in Google Chrome e accede come profilo Chrome autenticato. Su macOS, il Plugin controlla la presenza di `BlackHole 2ch` prima dell'avvio. Se configurato, esegue anche un comando di health del bridge audio e un comando di startup prima di aprire Chrome. Usa `chrome` quando Chrome/audio risiedono sull'host Gateway; usa `chrome-node` quando Chrome/audio risiedono su un Node associato, come una VM macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Instrada l'audio di microfono e altoparlanti di Chrome attraverso il bridge audio locale di OpenClaw. Se `BlackHole 2ch` non è installato, il join fallisce con un errore di configurazione invece di entrare silenziosamente senza un percorso audio.

### Twilio

Il trasporto Twilio è un piano di composizione rigoroso delegato al Plugin Voice Call. Non analizza le pagine Meet per trovare numeri di telefono.

Usalo quando la partecipazione tramite Chrome non è disponibile oppure vuoi un fallback dial-in telefonico. Google Meet deve esporre un numero dial-in e un PIN per la riunione; OpenClaw non li rileva dalla pagina Meet.

Abilita il Plugin Voice Call sull'host Gateway, non sul Chrome Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // oppure imposta "twilio" se Twilio deve essere il predefinito
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Fornisci le credenziali Twilio tramite ambiente o configurazione. L'ambiente mantiene i segreti fuori da `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Riavvia o ricarica il Gateway dopo aver abilitato `voice-call`; le modifiche alla configurazione del Plugin non compaiono in un processo Gateway già in esecuzione finché non viene ricaricato.

Poi verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando la delega Twilio è collegata correttamente, `googlemeet setup` include controlli riusciti `twilio-voice-call-plugin` e `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Usa `--dtmf-sequence` quando la riunione richiede una sequenza personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth e preflight

OAuth è facoltativo per creare un link Meet perché `googlemeet create` può usare come fallback l'automazione del browser. Configura OAuth quando vuoi la creazione ufficiale via API, la risoluzione degli spazi o i controlli preflight della Meet Media API.

L'accesso all'API Google Meet usa OAuth utente: crea un client OAuth Google Cloud, richiedi gli scope necessari, autorizza un account Google, quindi memorizza il refresh token risultante nella configurazione del Plugin Google Meet oppure fornisci le variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth non sostituisce il percorso di join tramite Chrome. I trasporti Chrome e chrome-node continuano a entrare tramite un profilo Chrome autenticato, BlackHole/SoX e un Node connesso quando usi la partecipazione via browser. OAuth serve solo per il percorso ufficiale dell'API Google Meet: creare spazi riunione, risolvere spazi ed eseguire controlli preflight della Meet Media API.

### Crea credenziali Google

In Google Cloud Console:

1. Crea o seleziona un progetto Google Cloud.
2. Abilita **Google Meet REST API** per quel progetto.
3. Configura la schermata di consenso OAuth.
   - **Internal** è la soluzione più semplice per un'organizzazione Google Workspace.
   - **External** funziona per configurazioni personali/di test; mentre l'app è in Testing, aggiungi ogni account Google che autorizzerà l'app come utente di test.
4. Aggiungi gli scope richiesti da OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crea un ID client OAuth.
   - Tipo di applicazione: **Web application**.
   - URI di redirect autorizzato:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copia il client ID e il client secret.

`meetings.space.created` è richiesto da Google Meet `spaces.create`.
`meetings.space.readonly` permette a OpenClaw di risolvere URL/codici Meet in spazi.
`meetings.conference.media.readonly` è per il preflight della Meet Media API e per il lavoro sui media; Google può richiedere l'iscrizione al Developer Preview per l'uso effettivo della Media API.
Se ti servono solo join Chrome via browser, salta completamente OAuth.

### Genera il refresh token

Configura `oauth.clientId` e facoltativamente `oauth.clientSecret`, oppure passali come variabili d'ambiente, poi esegui:

```bash
openclaw googlemeet auth login --json
```

Il comando stampa un blocco di configurazione `oauth` con un refresh token. Usa PKCE, callback localhost su `http://localhost:8085/oauth2callback` e un flusso manuale copia/incolla con `--manual`.

Esempi:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Usa la modalità manuale quando il browser non riesce a raggiungere la callback locale:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

L'output JSON include:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Memorizza l'oggetto `oauth` sotto la configurazione del Plugin Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Preferisci le variabili d'ambiente quando non vuoi il refresh token nella configurazione.
Se sono presenti sia valori in config sia in ambiente, il Plugin risolve prima la configurazione e poi usa l'ambiente come fallback.

Il consenso OAuth include creazione di spazi Meet, accesso in lettura agli spazi Meet e accesso in lettura ai media delle conferenze Meet. Se ti sei autenticato prima che esistesse il supporto alla creazione di riunioni, riesegui `openclaw googlemeet auth login --json` così il refresh token abbia lo scope `meetings.space.created`.

### Verifica OAuth con doctor

Esegui l'OAuth doctor quando vuoi un controllo rapido dello stato senza segreti:

```bash
openclaw googlemeet doctor --oauth --json
```

Questo non carica il runtime Chrome né richiede un Chrome Node connesso. Controlla che la configurazione OAuth esista e che il refresh token possa generare un access token. Il report JSON include solo campi di stato come `ok`, `configured`, `tokenSource`, `expiresAt` e messaggi di controllo; non stampa access token, refresh token o client secret.

Risultati comuni:

| Controllo            | Significato                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | Sono presenti `oauth.clientId` più `oauth.refreshToken`, oppure un access token in cache. |
| `oauth-token`        | L'access token in cache è ancora valido, oppure il refresh token ne ha generato uno nuovo. |
| `meet-spaces-get`    | Il controllo facoltativo `--meeting` ha risolto uno spazio Meet esistente.            |
| `meet-spaces-create` | Il controllo facoltativo `--create-space` ha creato un nuovo spazio Meet.             |

Per dimostrare anche l'abilitazione dell'API Google Meet e lo scope `spaces.create`, esegui il controllo di creazione con effetti collaterali:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea un URL Meet usa e getta. Usalo quando devi confermare che il progetto Google Cloud ha l'API Meet abilitata e che l'account autorizzato ha lo scope `meetings.space.created`.

Per dimostrare l'accesso in lettura a uno spazio riunione esistente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` dimostrano l'accesso in lettura a uno spazio esistente a cui l'account Google autorizzato può accedere. Un `403` da questi controlli in genere significa che Google Meet REST API è disabilitata, che al refresh token approvato manca lo scope richiesto o che l'account Google non può accedere a quello spazio Meet. Un errore sul refresh token significa che devi rieseguire `openclaw googlemeet auth login --json` e memorizzare il nuovo blocco `oauth`.

Non servono credenziali OAuth per il fallback browser. In quella modalità, l'autenticazione Google proviene dal profilo Chrome autenticato sul Node selezionato, non dalla configurazione OpenClaw.

Queste variabili d'ambiente sono accettate come fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

Risolvi un URL Meet, un codice o `spaces/{id}` tramite `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Esegui il preflight prima del lavoro sui media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Elenca artefatti della riunione e presenze dopo che Meet ha creato i conference record:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` e `attendance` usano per impostazione predefinita il conference record più recente. Passa `--all-conference-records` quando vuoi ogni record conservato per quella riunione.

La ricerca nel calendario può risolvere l'URL della riunione da Google Calendar prima di leggere gli artefatti Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` cerca nel calendario `primary` di oggi un evento Calendar con un link Google Meet. Usa `--event <query>` per cercare testo evento corrispondente e `--calendar <id>` per un calendario non primario. La ricerca nel calendario richiede un login OAuth aggiornato che includa lo scope di sola lettura degli eventi Calendar.
`calendar-events` mostra in anteprima gli eventi Meet corrispondenti e contrassegna l'evento che `latest`, `artifacts`, `attendance` o `export` sceglieranno.

Se conosci già l'ID del conference record, indirizzalo direttamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Scrivi un report leggibile:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` restituisce i metadati del conference record più i metadati delle risorse di partecipanti, registrazioni, trascrizioni, voci di trascrizione strutturata e smart note quando Google li espone per la riunione. Usa `--no-transcript-entries` per saltare la ricerca delle voci nelle riunioni grandi. `attendance` espande i partecipanti in righe participant-session con orari della prima/ultima presenza, durata totale della sessione, flag di ingresso tardivo/uscita anticipata e risorse partecipante duplicate unite per utente autenticato o nome visualizzato. Passa `--no-merge-duplicates` per mantenere separate le risorse partecipante grezze, `--late-after-minutes` per regolare il rilevamento dei ritardi e `--early-before-minutes` per regolare il rilevamento delle uscite anticipate.

`export` scrive una cartella contenente `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra l'input scelto, le opzioni di export, i conference record, i file di output, i conteggi, la sorgente del token, l'evento Calendar quando è stato usato e qualsiasi warning di recupero parziale. Passa `--zip` per scrivere anche un archivio portabile accanto alla cartella. Passa `--include-doc-bodies` per esportare il testo dei Google Docs collegati di trascrizione e smart note tramite Google Drive `files.export`; questo richiede un login OAuth aggiornato che includa lo scope Drive Meet readonly. Senza `--include-doc-bodies`, gli export includono solo metadati Meet e voci di trascrizione strutturata. Se Google restituisce un errore parziale sugli artefatti, come un elenco smart note, una voce di trascrizione o un errore del body documento di Drive, il riepilogo e il manifest mantengono il warning invece di far fallire l'intero export.
Usa `--dry-run` per recuperare gli stessi dati di artefatti/presenze e stampare il JSON del manifest senza creare la cartella o lo ZIP. Questo è utile prima di scrivere un export grande oppure quando a un agente servono solo conteggi, record selezionati e warning.

Gli agenti possono anche creare lo stesso bundle tramite lo strumento `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Imposta `"dryRun": true` per restituire solo il manifest di export e saltare la scrittura dei file.

Esegui lo smoke live protetto contro una riunione reale conservata:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ambiente per smoke live:

- `OPENCLAW_LIVE_TEST=1` abilita i test live protetti.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` punta a un URL, codice o `spaces/{id}` Meet conservato.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` fornisce il client id OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN` fornisce il refresh token.
- Facoltativo: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usano gli stessi nomi fallback
  senza il prefisso `OPENCLAW_`.

Lo smoke live base di artefatti/presenze richiede
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La ricerca nel calendario richiede `https://www.googleapis.com/auth/calendar.events.readonly`. L'export del body documento Drive richiede `https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un nuovo spazio Meet:

```bash
openclaw googlemeet create
```

Il comando stampa il nuovo `meeting uri`, la sorgente e la sessione di join. Con credenziali OAuth usa l'API ufficiale Google Meet. Senza credenziali OAuth usa come fallback il profilo browser autenticato del Chrome Node fissato. Gli agenti possono usare lo strumento `google_meet` con `action: "create"` per creare ed entrare in un solo passaggio. Per la sola creazione dell'URL, passa `"join": false`.

Esempio di output JSON dal fallback browser:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Se il fallback browser incontra un login Google o un blocco di permessi Meet prima di poter creare l'URL, il metodo Gateway restituisce una risposta fallita e lo strumento `google_meet` restituisce dettagli strutturati invece di una semplice stringa:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Quando un agente vede `manualActionRequired: true`, dovrebbe riportare il `manualActionMessage` più il contesto browser node/tab e smettere di aprire nuove schede Meet finché l'operatore non completa il passaggio nel browser.

Esempio di output JSON da creazione API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

La creazione di una riunione entra per impostazione predefinita. Il trasporto Chrome o Chrome-node ha comunque bisogno di un profilo Google Chrome autenticato per entrare tramite browser. Se il profilo è disconnesso, OpenClaw segnala `manualActionRequired: true` oppure un errore del fallback browser e chiede all'operatore di completare il login Google prima di riprovare.

Imposta `preview.enrollmentAcknowledged: true` solo dopo aver confermato che il tuo progetto Cloud, il principal OAuth e i partecipanti alla riunione sono iscritti al Google Workspace Developer Preview Program per le Meet media API.

## Configurazione

Il percorso Chrome realtime più comune richiede solo il Plugin abilitato, BlackHole, SoX e una chiave del provider vocale realtime di backend. OpenAI è quello predefinito; imposta `realtime.provider: "google"` per usare Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# oppure
export GEMINI_API_KEY=...
```

Imposta la configurazione del Plugin sotto `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Valori predefiniti:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: ID/nome/IP del Node facoltativo per `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usato nella schermata guest Meet non autenticata
- `chrome.autoJoin: true`: compilazione best-effort del nome guest e clic su Join Now tramite automazione browser OpenClaw su `chrome-node`
- `chrome.reuseExistingTab: true`: attiva una scheda Meet esistente invece di aprire duplicati
- `chrome.waitForInCallMs: 20000`: attende che la scheda Meet segnali in-call prima di attivare l'intro realtime
- `chrome.audioInputCommand`: comando SoX `rec` che scrive audio G.711 mu-law a 8 kHz su stdout
- `chrome.audioOutputCommand`: comando SoX `play` che legge audio G.711 mu-law a 8 kHz da stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: risposte vocali brevi, con `openclaw_agent_consult` per risposte più approfondite
- `realtime.introMessage`: breve controllo vocale di disponibilità quando il bridge realtime si connette; impostalo su `""` per entrare in silenzio

Override facoltativi:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Configurazione solo Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` ha come valore predefinito `true`; con il trasporto Twilio delega la chiamata PSTN e il DTMF effettivi al Plugin Voice Call. Se `voice-call` non è abilitato, Google Meet può comunque convalidare e registrare il piano di composizione, ma non può effettuare la chiamata Twilio.

## Strumento

Gli agenti possono usare lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Usa `transport: "chrome"` quando Chrome è eseguito sull'host Gateway. Usa
`transport: "chrome-node"` quando Chrome è eseguito su un Node associato come una VM Parallels. In entrambi i casi il modello realtime e `openclaw_agent_consult` vengono eseguiti sull'host Gateway, quindi le credenziali del modello restano lì.

Usa `action: "status"` per elencare le sessioni attive o ispezionare un ID sessione. Usa `action: "speak"` con `sessionId` e `message` per far parlare immediatamente l'agente realtime. Usa `action: "test_speech"` per creare o riusare la sessione, attivare una frase nota e restituire lo stato `inCall` quando l'host Chrome può segnalarlo. Usa `action: "leave"` per contrassegnare una sessione come terminata.

`status` include lo stato di salute di Chrome quando disponibile:

- `inCall`: Chrome sembra essere all'interno della chiamata Meet
- `micMuted`: stato del microfono Meet in best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: il profilo browser richiede login manuale, ammissione da parte dell'host, permessi o riparazione del controllo browser prima che la voce possa funzionare
- `providerConnected` / `realtimeReady`: stato del bridge vocale realtime
- `lastInputAt` / `lastOutputAt`: ultimo audio visto o inviato al bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulto dell'agente realtime

La modalità realtime Chrome è ottimizzata per un ciclo vocale live. Il provider vocale realtime ascolta l'audio della riunione e parla attraverso il bridge audio configurato. Quando il modello realtime ha bisogno di ragionamento più profondo, informazioni attuali o normali strumenti OpenClaw, può chiamare `openclaw_agent_consult`.

Lo strumento di consulto esegue dietro le quinte il normale agente OpenClaw con il contesto recente della trascrizione della riunione e restituisce una risposta vocale concisa alla sessione vocale realtime. Il modello vocale può poi pronunciare quella risposta nella riunione. Usa lo stesso strumento di consulto realtime condiviso di Voice Call.

`realtime.toolPolicy` controlla l'esecuzione del consulto:

- `safe-read-only`: espone lo strumento di consulto e limita l'agente normale a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`.
- `owner`: espone lo strumento di consulto e lascia all'agente normale la normale policy degli strumenti dell'agente.
- `none`: non espone lo strumento di consulto al modello vocale realtime.

La chiave di sessione del consulto ha ambito per sessione Meet, quindi le chiamate di consulto successive possono riutilizzare il contesto di consulto precedente durante la stessa riunione.

Per forzare un controllo vocale di disponibilità dopo che Chrome è entrato completamente nella chiamata:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Per lo smoke completo join-and-speak:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist per test live

Usa questa sequenza prima di affidare una riunione a un agente non presidiato:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Stato atteso di Chrome-node:

- `googlemeet setup` è tutto verde.
- `googlemeet setup` include `chrome-node-connected` quando `chrome-node` è il trasporto predefinito o quando un Node è fissato.
- `nodes status` mostra il Node selezionato come connesso.
- Il Node selezionato pubblicizza sia `googlemeet.chrome` sia `browser.proxy`.
- La scheda Meet entra nella chiamata e `test-speech` restituisce lo stato di salute di Chrome con `inCall: true`.

Per un host Chrome remoto come una VM macOS Parallels, questo è il controllo sicuro più breve dopo aver aggiornato il Gateway o la VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Questo dimostra che il Plugin Gateway è caricato, che il Node della VM è connesso con il token corrente e che il bridge audio Meet è disponibile prima che un agente apra una vera scheda riunione.

Per uno smoke test Twilio, usa una riunione che esponga i dettagli del dial-in telefonico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Stato atteso di Twilio:

- `googlemeet setup` include controlli verdi `twilio-voice-call-plugin` e `twilio-voice-call-credentials`.
- `voicecall` è disponibile nella CLI dopo la ricarica del Gateway.
- La sessione restituita ha `transport: "twilio"` e un `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` riaggancia la chiamata vocale delegata.

## Risoluzione dei problemi

### L'agente non vede lo strumento Google Meet

Conferma che il Plugin sia abilitato nella configurazione del Gateway e ricarica il Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se hai appena modificato `plugins.entries.google-meet`, riavvia o ricarica il Gateway.
L'agente in esecuzione vede solo gli strumenti Plugin registrati dal processo Gateway corrente.

### Nessun Node connesso capace di Google Meet

Sull'host Node, esegui:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sull'host Gateway, approva il Node e verifica i comandi:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Il Node deve essere connesso e deve elencare `googlemeet.chrome` più `browser.proxy`.
La configurazione del Gateway deve consentire quei comandi Node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` fallisce su `chrome-node-connected` o il log del Gateway riporta
`gateway token mismatch`, reinstalla o riavvia il Node con il token Gateway corrente. Per un Gateway LAN di solito significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Poi ricarica il servizio Node ed esegui di nuovo:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Il browser si apre ma l'agente non riesce a entrare

Esegui `googlemeet test-speech` e controlla lo stato di salute Chrome restituito. Se
riporta `manualActionRequired: true`, mostra `manualActionMessage` all'operatore
e smetti di ritentare finché l'azione nel browser non è completata.

Azioni manuali comuni:

- Accedere al profilo Chrome.
- Ammettere l'ospite dall'account host Meet.
- Concedere i permessi microfono/fotocamera a Chrome quando compare il prompt nativo di Chrome.
- Chiudere o riparare una finestra di dialogo Meet dei permessi bloccata.

Non segnalare "non autenticato" solo perché Meet mostra "Do you want people to hear you in the meeting?" Quello è l'interstiziale di scelta audio di Meet; OpenClaw fa clic su **Use microphone** tramite automazione del browser quando disponibile e continua ad attendere lo stato reale della riunione. Per il fallback browser solo creazione, OpenClaw può fare clic su **Continue without microphone** perché la creazione dell'URL non richiede il percorso audio realtime.

### La creazione della riunione fallisce

`googlemeet create` usa prima l'endpoint `spaces.create` della Google Meet API
quando sono configurate credenziali OAuth. Senza credenziali OAuth usa come fallback
il browser del Chrome Node fissato. Conferma:

- Per la creazione via API: `oauth.clientId` e `oauth.refreshToken` sono configurati,
  oppure sono presenti le variabili d'ambiente corrispondenti `OPENCLAW_GOOGLE_MEET_*`.
- Per la creazione via API: il refresh token è stato generato dopo l'aggiunta del supporto alla creazione. I token più vecchi potrebbero non avere lo scope `meetings.space.created`; riesegui `openclaw googlemeet auth login --json` e aggiorna la configurazione del Plugin.
- Per il fallback browser: `defaultTransport: "chrome-node"` e
  `chromeNode.node` puntano a un Node connesso con `browser.proxy` e
  `googlemeet.chrome`.
- Per il fallback browser: il profilo Chrome OpenClaw su quel Node è autenticato
  su Google e può aprire `https://meet.google.com/new`.
- Per il fallback browser: i retry riusano una scheda esistente `https://meet.google.com/new`
  o una scheda con prompt account Google prima di aprirne una nuova. Se un agente va in timeout,
  ritenta la chiamata dello strumento invece di aprire manualmente un'altra scheda Meet.
- Per il fallback browser: se lo strumento restituisce `manualActionRequired: true`, usa
  i valori restituiti `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` per guidare l'operatore. Non ritentare in loop finché quell'azione non è completata.
- Per il fallback browser: se Meet mostra "Do you want people to hear you in the meeting?", lascia aperta la scheda. OpenClaw dovrebbe fare clic su **Use microphone** oppure, per il fallback solo creazione, su **Continue without microphone** tramite automazione del browser e continuare ad attendere l'URL Meet generato. Se non può farlo, l'errore dovrebbe menzionare `meet-audio-choice-required`, non `google-login-required`.

### L'agente entra ma non parla

Controlla il percorso realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "realtime"` per ascolto/risposta vocale. `mode: "transcribe"` intenzionalmente
non avvia il bridge vocale realtime duplex.

Verifica anche:

- Una chiave del provider realtime è disponibile sull'host Gateway, come
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` è visibile sull'host Chrome.
- `rec` e `play` esistono sull'host Chrome.
- Microfono e altoparlanti Meet sono instradati attraverso il percorso audio virtuale usato da OpenClaw.

`googlemeet doctor [session-id]` stampa sessione, Node, stato in-call,
motivo dell'azione manuale, connessione del provider realtime, `realtimeReady`, attività di input/output audio, ultimi timestamp audio, contatori di byte e URL browser.
Usa `googlemeet status [session-id]` quando ti serve il JSON grezzo. Usa
`googlemeet doctor --oauth` quando devi verificare il refresh OAuth di Google Meet senza esporre token; aggiungi `--meeting` o `--create-space` quando ti serve anche una prova della Google Meet API.

Se un agente è andato in timeout e puoi vedere una scheda Meet già aperta, ispeziona quella scheda senza aprirne un'altra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L'azione equivalente dello strumento è `recover_current_tab`. Mette a fuoco e ispeziona una scheda Meet esistente sul Chrome Node configurato. Non apre una nuova scheda né crea una nuova sessione; riporta il blocco corrente, come login, ammissione, permessi o stato della scelta audio. Il comando CLI parla al Gateway configurato, quindi il Gateway deve essere in esecuzione e il Chrome Node deve essere connesso.

### I controlli di configurazione Twilio falliscono

`twilio-voice-call-plugin` fallisce quando `voice-call` non è consentito o non è abilitato.
Aggiungilo a `plugins.allow`, abilita `plugins.entries.voice-call` e ricarica il Gateway.

`twilio-voice-call-credentials` fallisce quando al backend Twilio mancano account SID,
auth token o numero chiamante. Imposta questi valori sull'host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Poi riavvia o ricarica il Gateway ed esegui:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` è per impostazione predefinita solo di readiness. Per fare un dry-run di un numero specifico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Aggiungi `--yes` solo quando vuoi intenzionalmente effettuare una vera chiamata notify in uscita:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La chiamata Twilio parte ma non entra mai nella riunione

Conferma che l'evento Meet esponga i dettagli del dial-in telefonico. Passa il numero dial-in esatto e il PIN oppure una sequenza DTMF personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniziali o virgole in `--dtmf-sequence` se il provider ha bisogno di una pausa
prima di inserire il PIN.

## Note

La media API ufficiale di Google Meet è orientata alla ricezione, quindi per parlare in una chiamata Meet serve comunque un percorso di partecipazione. Questo Plugin mantiene visibile quel confine:
Chrome gestisce partecipazione via browser e instradamento audio locale; Twilio gestisce la partecipazione telefonica dial-in.

La modalità realtime Chrome richiede uno dei due:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw possiede il bridge del modello realtime e convoglia audio G.711 mu-law a 8 kHz tra questi comandi e il provider vocale realtime selezionato.
- `chrome.audioBridgeCommand`: un comando bridge esterno possiede l'intero percorso audio locale e deve terminare dopo aver avviato o convalidato il suo demone.

Per audio duplex pulito, instrada l'uscita Meet e il microfono Meet tramite dispositivi virtuali separati o un grafo di dispositivi virtuali in stile Loopback. Un singolo dispositivo BlackHole condiviso può reimmettere l'audio degli altri partecipanti nella chiamata.

`googlemeet speak` attiva il bridge audio realtime attivo per una sessione Chrome.
`googlemeet leave` arresta quel bridge. Per le sessioni Twilio delegate tramite il Plugin Voice Call, `leave` riaggancia anche la chiamata vocale sottostante.

## Correlati

- [Plugin Voice Call](/it/plugins/voice-call)
- [Modalità talk](/it/nodes/talk)
- [Creazione di Plugins](/it/plugins/building-plugins)
