---
read_when:
    - Vuoi che un agente OpenClaw partecipi a una chiamata Google Meet
    - Vuoi che un agente OpenClaw crei una nuova chiamata Google Meet
    - Stai configurando Chrome, Chrome node o Twilio come trasporto per Google Meet
summary: 'Plugin Google Meet: partecipa a URL Meet espliciti tramite Chrome o Twilio con valori predefiniti vocali realtime'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-26T11:34:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

Supporto al partecipante Google Meet per OpenClaw — il plugin è esplicito per progettazione:

- Partecipa solo a un URL esplicito `https://meet.google.com/...`.
- Può creare un nuovo spazio Meet tramite l'API Google Meet, quindi partecipare all'URL
  restituito.
- La modalità vocale predefinita è `realtime`.
- La voce realtime può richiamare l'agente OpenClaw completo quando servono
  ragionamento più profondo o tool.
- Gli agenti scelgono il comportamento di join con `mode`: usa `realtime` per
  ascolto live / risposta vocale, oppure `transcribe` per partecipare / controllare il browser senza
  il bridge vocale realtime.
- L'auth parte come Google OAuth personale o un profilo Chrome già connesso.
- Non esiste un annuncio automatico del consenso.
- Il backend audio Chrome predefinito è `BlackHole 2ch`.
- Chrome può essere eseguito localmente o su un host node associato.
- Twilio accetta un numero dial-in più una sequenza PIN o DTMF facoltativa.
- Il comando CLI è `googlemeet`; `meet` è riservato a workflow più ampi di
  teleconferenza dell'agente.

## Avvio rapido

Installa le dipendenze audio locali e configura un provider vocale realtime di backend.
OpenAI è il predefinito; anche Google Gemini Live funziona con
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# oppure
export GEMINI_API_KEY=...
```

`blackhole-2ch` installa il dispositivo audio virtuale `BlackHole 2ch`. L'installer
Homebrew richiede un riavvio prima che macOS esponga il dispositivo:

```bash
sudo reboot
```

Dopo il riavvio, verifica entrambe le parti:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Abilita il plugin:

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

L'output di setup è pensato per essere leggibile dagli agenti. Riporta profilo Chrome,
bridge audio, pinning del node, introduzione realtime ritardata e, quando la delega Twilio
è configurata, se il plugin `voice-call` e le credenziali Twilio sono pronti.
Considera qualsiasi controllo `ok: false` come un blocco prima di chiedere a un agente di partecipare.
Usa `openclaw googlemeet setup --json` per script o output leggibile da macchina.
Usa `--transport chrome`, `--transport chrome-node` oppure `--transport twilio`
per fare il preflight di un trasporto specifico prima che un agente lo provi.

Partecipa a una riunione:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oppure lascia che un agente partecipi tramite il tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Crea una nuova riunione e partecipa:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Crea solo l'URL senza partecipare:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ha due percorsi:

- Creazione API: usata quando sono configurate credenziali Google Meet OAuth. Questo è
  il percorso più deterministico e non dipende dallo stato della UI del browser.
- Fallback browser: usato quando le credenziali OAuth non sono presenti. OpenClaw usa il
  Chrome node fissato, apre `https://meet.google.com/new`, attende che Google reindirizzi a un vero
  URL con codice riunione, quindi restituisce quell'URL. Questo percorso richiede
  che il profilo Chrome OpenClaw sul node sia già connesso a Google.
  L'automazione del browser gestisce il prompt iniziale del microfono di Meet; quel prompt
  non viene trattato come un errore di login Google.
  I flussi di join e create provano anche a riutilizzare una scheda Meet esistente prima di aprirne una
  nuova. La corrispondenza ignora stringhe query innocue dell'URL come `authuser`, quindi un
  retry dell'agente dovrebbe mettere a fuoco la riunione già aperta invece di creare una seconda
  scheda Chrome.

L'output del comando/tool include un campo `source` (`api` oppure `browser`) così gli agenti
possono spiegare quale percorso è stato usato. `create` partecipa alla nuova riunione per impostazione predefinita e
restituisce `joined: true` più la sessione di join. Per generare solo l'URL, usa
`create --no-join` nella CLI oppure passa `"join": false` al tool.

Oppure dì a un agente: "Crea un Google Meet, partecipa con voce realtime e inviami
il link." L'agente dovrebbe chiamare `google_meet` con `action: "create"` e
poi condividere il `meetingUri` restituito.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Per un join solo osservazione / controllo browser, imposta `"mode": "transcribe"`. Questo
non avvia il bridge del modello realtime duplex, quindi non parlerà nella
riunione.

Durante le sessioni realtime, lo stato di `google_meet` include browser e audio bridge
come `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, ultimi timestamp di input/output,
contatori di byte e stato di chiusura del bridge. Se compare un prompt sicuro della pagina Meet,
l'automazione del browser lo gestisce quando può. Login, ammissione dell'host e
prompt di permessi browser/OS vengono segnalati come azione manuale con motivo e
messaggio da inoltrare all'agente.

Chrome partecipa come profilo Chrome connesso. In Meet, scegli `BlackHole 2ch` per il
percorso microfono/altoparlante usato da OpenClaw. Per audio duplex pulito, usa
dispositivi virtuali separati o un grafo in stile Loopback; un singolo dispositivo BlackHole è
sufficiente per un primo smoke test ma può produrre eco.

### Gateway locale + Chrome Parallels

Non ti serve un Gateway OpenClaw completo o una API key di modello dentro una VM macOS
solo per far sì che la VM possieda Chrome. Esegui il Gateway e l'agente localmente, poi esegui un
host node nella VM. Abilita il plugin bundled sulla VM una volta così il node
pubblicizza il comando Chrome:

Cosa gira dove:

- Host Gateway: OpenClaw Gateway, workspace dell'agente, chiavi modello/API, provider
  realtime e configurazione del plugin Google Meet.
- VM macOS Parallels: CLI/host node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  e un profilo Chrome connesso a Google.
- Non necessario nella VM: servizio Gateway, configurazione dell'agente, chiave OpenAI/GPT o configurazione del provider di modelli.

Installa le dipendenze della VM:

```bash
brew install blackhole-2ch sox
```

Riavvia la VM dopo aver installato BlackHole così macOS esponga `BlackHole 2ch`:

```bash
sudo reboot
```

Dopo il riavvio, verifica che la VM possa vedere il dispositivo audio e i comandi SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Installa o aggiorna OpenClaw nella VM, poi abilita lì il plugin bundled:

```bash
openclaw plugins enable google-meet
```

Avvia l'host node nella VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` è un IP LAN e non stai usando TLS, il node rifiuta il
WebSocket in chiaro a meno che tu non aderisca esplicitamente per quella rete privata fidata:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la stessa variabile d'ambiente quando installi il node come LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` è un ambiente di processo, non un'impostazione
di `openclaw.json`. `openclaw node install` la memorizza nell'ambiente LaunchAgent
quando è presente nel comando di installazione.

Approva il node dall'host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Conferma che il Gateway veda il node e che pubblicizzi sia `googlemeet.chrome`
sia la capability browser/`browser.proxy`:

```bash
openclaw nodes status
```

Instrada Meet attraverso quel node sull'host Gateway:

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

Ora partecipa normalmente dall'host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oppure chiedi all'agente di usare il tool `google_meet` con `transport: "chrome-node"`.

Per uno smoke test con un solo comando che crea o riusa una sessione, pronuncia una
frase nota e stampa lo stato di salute della sessione:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante il join, l'automazione browser di OpenClaw compila il nome guest, fa clic su Join/Ask
to join e accetta la scelta iniziale di Meet "Use microphone" quando quel prompt
compare. Durante la creazione della riunione solo browser, può anche continuare oltre il
medesimo prompt senza microfono se Meet non espone il pulsante use-microphone.
Se il profilo browser non è connesso, Meet è in attesa di
ammissione dell'host, Chrome richiede permessi microfono/fotocamera, oppure Meet è bloccato su un
prompt che l'automazione non è riuscita a risolvere, il risultato di join/test-speech riporta
`manualActionRequired: true` con `manualActionReason` e
`manualActionMessage`. Gli agenti dovrebbero smettere di ritentare il join,
riportare quel messaggio esatto più `browserUrl`/`browserTitle` correnti e
riprovare solo dopo che l'azione manuale nel browser è stata completata.

Se `chromeNode.node` viene omesso, OpenClaw seleziona automaticamente solo quando esattamente un
node connesso pubblicizza sia `googlemeet.chrome` sia il controllo browser. Se
sono connessi più node compatibili, imposta `chromeNode.node` con l'id del node,
display name o IP remoto.

Controlli comuni in caso di errore:

- `Configured Google Meet node ... is not usable: offline`: il node fissato è
  noto al Gateway ma non disponibile. Gli agenti dovrebbero trattare quel node come
  stato diagnostico, non come host Chrome utilizzabile, e segnalare il blocco di setup
  invece di ripiegare su un altro trasporto a meno che l'utente non lo abbia richiesto.
- `No connected Google Meet-capable node`: avvia `openclaw node run` nella VM,
  approva il pairing e assicurati che `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` siano stati eseguiti nella VM. Conferma anche che l'
  host Gateway consenta entrambi i comandi del node con
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installa `blackhole-2ch` sull'host
  che viene controllato e riavvia prima di usare l'audio Chrome locale.
- `BlackHole 2ch audio device not found on the node`: installa `blackhole-2ch`
  nella VM e riavvia la VM.
- Chrome si apre ma non riesce a partecipare: accedi al profilo browser dentro la VM, oppure
  mantieni `chrome.guestName` impostato per il join guest. L'auto-join guest usa l'automazione browser di OpenClaw tramite il proxy browser del node; assicurati che la configurazione browser del node punti al profilo desiderato, ad esempio
  `browser.defaultProfile: "user"` oppure un profilo existing-session con nome.
- Schede Meet duplicate: lascia `chrome.reuseExistingTab: true` abilitato. OpenClaw
  attiva una scheda esistente per lo stesso URL Meet prima di aprirne una nuova, e la creazione della riunione via browser riusa una scheda `https://meet.google.com/new`
  o una scheda di prompt account Google già in corso prima di aprirne un'altra.
- Nessun audio: in Meet, instrada microfono/altoparlante attraverso il percorso del dispositivo audio virtuale
  usato da OpenClaw; usa dispositivi virtuali separati o routing in stile Loopback
  per audio duplex pulito.

## Note di installazione

Il valore predefinito realtime di Chrome usa due strumenti esterni:

- `sox`: utility audio a riga di comando. Il plugin usa i suoi comandi `rec` e `play`
  per il bridge audio mu-law G.711 predefinito a 8 kHz.
- `blackhole-2ch`: driver audio virtuale macOS. Crea il dispositivo audio
  `BlackHole 2ch` attraverso cui Chrome/Meet può essere instradato.

OpenClaw non include né ridistribuisce nessuno dei due package. La documentazione chiede agli utenti di
installarli come dipendenze host tramite Homebrew. SoX è concesso in licenza come
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole è GPL-3.0. Se crei un
installer o appliance che include BlackHole con OpenClaw, controlla i termini di licenza
upstream di BlackHole oppure ottieni una licenza separata da Existential Audio.

## Trasporti

### Chrome

Il trasporto Chrome apre l'URL Meet in Google Chrome e partecipa come profilo Chrome connesso.
Su macOS, il plugin controlla la presenza di `BlackHole 2ch` prima dell'avvio.
Se configurato, esegue anche un comando di controllo dello stato del bridge audio e un comando di avvio
prima di aprire Chrome. Usa `chrome` quando Chrome/audio sono sull'host Gateway;
usa `chrome-node` quando Chrome/audio sono su un node associato come una VM
macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Instrada l'audio microfono e altoparlante di Chrome attraverso il bridge audio
locale di OpenClaw. Se `BlackHole 2ch` non è installato, il join fallisce con un errore di setup
invece di partecipare silenziosamente senza un percorso audio.

### Twilio

Il trasporto Twilio è un piano di composizione rigoroso delegato al plugin Voice Call. Non
analizza le pagine Meet per trovare numeri di telefono.

Usalo quando la partecipazione Chrome non è disponibile o vuoi un fallback tramite chiamata telefonica.
Google Meet deve esporre un numero dial-in e un PIN per la
riunione; OpenClaw non li rileva dalla pagina Meet.

Abilita il plugin Voice Call sull'host Gateway, non sul Chrome node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // oppure imposta "twilio" se Twilio deve essere il valore predefinito
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

Fornisci le credenziali Twilio tramite ambiente o configurazione. L'ambiente mantiene i
segreti fuori da `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Riavvia o ricarica il Gateway dopo aver abilitato `voice-call`; le modifiche alla configurazione dei plugin
non compaiono in un processo Gateway già in esecuzione finché non viene ricaricato.

Poi verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando la delega Twilio è collegata, `googlemeet setup` include controlli riusciti
`twilio-voice-call-plugin` e `twilio-voice-call-credentials`.

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

OAuth è facoltativo per creare un link Meet perché `googlemeet create` può usare come fallback
l'automazione del browser. Configura OAuth quando vuoi la creazione ufficiale via API,
la risoluzione degli spazi o i controlli di preflight dell'API Meet Media.

L'accesso all'API Google Meet usa OAuth utente: crea un client OAuth Google Cloud,
richiedi gli scope necessari, autorizza un account Google, poi memorizza il
refresh token risultante nella configurazione del plugin Google Meet oppure fornisci le
variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth non sostituisce il percorso di join Chrome. I trasporti Chrome e Chrome-node
continuano a partecipare tramite un profilo Chrome connesso, BlackHole/SoX e un node
connesso quando usi la partecipazione browser. OAuth serve solo per il percorso ufficiale API Google
Meet: creare spazi riunione, risolvere spazi ed eseguire controlli di preflight
dell'API Meet Media.

### Crea credenziali Google

Nella Google Cloud Console:

1. Crea o seleziona un progetto Google Cloud.
2. Abilita **Google Meet REST API** per quel progetto.
3. Configura la schermata di consenso OAuth.
   - **Internal** è la soluzione più semplice per un'organizzazione Google Workspace.
   - **External** funziona per configurazioni personali/di test; mentre l'app è in Testing,
     aggiungi ogni account Google che autorizzerà l'app come utente di test.
4. Aggiungi gli scope richiesti da OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crea un client ID OAuth.
   - Tipo di applicazione: **Web application**.
   - URI di reindirizzamento autorizzato:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copia client ID e client secret.

`meetings.space.created` è richiesto da Google Meet `spaces.create`.
`meetings.space.readonly` consente a OpenClaw di risolvere URL/codici Meet in spazi.
`meetings.conference.media.readonly` serve per il preflight e il lavoro media dell'API Meet Media
; Google potrebbe richiedere l'iscrizione al Developer Preview per l'uso reale dell'API Media.
Se ti servono solo join Chrome basati su browser, salta completamente OAuth.

### Genera il refresh token

Configura `oauth.clientId` e facoltativamente `oauth.clientSecret`, oppure passali come
variabili d'ambiente, poi esegui:

```bash
openclaw googlemeet auth login --json
```

Il comando stampa un blocco di configurazione `oauth` con un refresh token. Usa PKCE,
callback localhost su `http://localhost:8085/oauth2callback` e un flusso manuale
copia/incolla con `--manual`.

Esempi:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Usa la modalità manuale quando il browser non può raggiungere la callback locale:

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

Memorizza l'oggetto `oauth` sotto la configurazione del plugin Google Meet:

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
Se sono presenti sia valori nella configurazione sia nell'ambiente, il plugin risolve prima la configurazione
e poi usa il fallback dell'ambiente.

Il consenso OAuth include creazione di spazi Meet, accesso in lettura agli spazi Meet e accesso in lettura ai media delle conferenze Meet. Se hai eseguito l'autenticazione prima che esistesse il
supporto alla creazione di riunioni, riesegui `openclaw googlemeet auth login --json` così il refresh
token abbia lo scope `meetings.space.created`.

### Verifica OAuth con doctor

Esegui l'OAuth doctor quando vuoi un controllo rapido dello stato di salute senza segreti:

```bash
openclaw googlemeet doctor --oauth --json
```

Questo non carica il runtime Chrome e non richiede un Chrome node connesso. Controlla
che la configurazione OAuth esista e che il refresh token possa generare un access
token. Il report JSON include solo campi di stato come `ok`, `configured`,
`tokenSource`, `expiresAt` e messaggi di controllo; non stampa l'access
token, il refresh token o il client secret.

Risultati comuni:

| Controllo            | Significato                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` più `oauth.refreshToken`, oppure un access token in cache, è presente. |
| `oauth-token`        | L'access token in cache è ancora valido, oppure il refresh token ne ha generato uno nuovo. |
| `meet-spaces-get`    | Il controllo facoltativo `--meeting` ha risolto uno spazio Meet esistente.               |
| `meet-spaces-create` | Il controllo facoltativo `--create-space` ha creato un nuovo spazio Meet.                |

Per verificare anche l'abilitazione dell'API Google Meet e lo scope `spaces.create`, esegui il
controllo di creazione con effetti collaterali:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea un URL Meet usa e getta. Usalo quando devi confermare
che il progetto Google Cloud ha l'API Meet abilitata e che l'account autorizzato
ha lo scope `meetings.space.created`.

Per verificare l'accesso in lettura a uno spazio riunione esistente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` verificano l'accesso in lettura a uno spazio
esistente a cui l'account Google autorizzato può accedere. Un `403` da questi controlli
di solito significa che Google Meet REST API è disabilitata, che nel refresh token
consentito manca lo scope richiesto o che l'account Google non può accedere a quello spazio Meet. Un errore di refresh token significa rieseguire `openclaw googlemeet auth login
--json` e memorizzare il nuovo blocco `oauth`.

Non servono credenziali OAuth per il fallback browser. In quella modalità, l'auth Google
proviene dal profilo Chrome connesso sul node selezionato, non dalla configurazione
OpenClaw.

Queste variabili d'ambiente sono accettate come fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oppure `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` oppure `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oppure `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` oppure `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` oppure
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` oppure `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` oppure `GOOGLE_MEET_PREVIEW_ACK`

Risolvi un URL Meet, un codice o `spaces/{id}` tramite `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Esegui il preflight prima del lavoro sui media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Elenca gli artifact della riunione e le presenze dopo che Meet ha creato i conference record:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` e `attendance` usano come predefinito l'ultimo conference record
. Passa `--all-conference-records` quando vuoi ogni record conservato
per quella riunione.

La ricerca nel calendario può risolvere l'URL della riunione da Google Calendar prima di leggere
gli artifact di Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` cerca nel calendario `primary` di oggi un evento Calendar con un
link Google Meet. Usa `--event <query>` per cercare testo corrispondente nell'evento, e
`--calendar <id>` per un calendario non primario. La ricerca nel calendario richiede un
nuovo login OAuth che includa lo scope readonly per gli eventi Calendar.
`calendar-events` mostra in anteprima gli eventi Meet corrispondenti e contrassegna l'evento che
`latest`, `artifacts`, `attendance` o `export` sceglieranno.

Se conosci già l'id del conference record, indirizzalo direttamente:

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

`artifacts` restituisce metadati del conference record più metadati di risorse per partecipanti,
registrazioni, trascrizioni, voci strutturate della trascrizione e smart note quando
Google li espone per la riunione. Usa `--no-transcript-entries` per saltare
la ricerca delle voci per riunioni molto grandi. `attendance` espande i partecipanti in
righe di sessione-partecipante con orari primo/ultimo avvistamento, durata totale della sessione,
flag di ingresso in ritardo/uscita anticipata e risorse partecipante duplicate unite per utente connesso
o nome visualizzato. Passa `--no-merge-duplicates` per mantenere separate le risorse
partecipante grezze, `--late-after-minutes` per regolare il rilevamento dei ritardi e
`--early-before-minutes` per regolare il rilevamento delle uscite anticipate.

`export` scrive una cartella contenente `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra l'input scelto, le opzioni di export, i conference record,
i file di output, i conteggi, la sorgente del token, l'evento Calendar quando usato ed eventuali
avvisi di recupero parziale. Passa `--zip` per scrivere anche un archivio portabile
accanto alla cartella. Passa `--include-doc-bodies` per esportare il testo dei Google Docs collegati di trascrizione e smart note tramite Google Drive `files.export`; questo richiede un
nuovo login OAuth che includa lo scope readonly Drive Meet. Senza
`--include-doc-bodies`, gli export includono solo metadati Meet e voci strutturate della trascrizione.
Se Google restituisce un fallimento parziale degli artifact, come una smart note
listing, una transcript-entry o un errore del body documento Drive, il riepilogo e il
manifest mantengono l'avviso invece di far fallire l'intero export.
Usa `--dry-run` per recuperare gli stessi dati artifact/attendance e stampare il
manifest JSON senza creare la cartella o lo ZIP. Questo è utile prima di scrivere
un export grande o quando un agente ha bisogno solo di conteggi, record selezionati e
avvisi.

Gli agenti possono creare lo stesso bundle anche tramite il tool `google_meet`:

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

Esegui lo smoke live protetto contro una vera riunione conservata:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ambiente smoke live:

- `OPENCLAW_LIVE_TEST=1` abilita i test live protetti.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` punta a un URL Meet, codice o
  `spaces/{id}` conservato.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oppure `GOOGLE_MEET_CLIENT_ID` fornisce l'OAuth
  client id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oppure `GOOGLE_MEET_REFRESH_TOKEN` fornisce
  il refresh token.
- Facoltativo: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usano gli stessi nomi fallback
  senza il prefisso `OPENCLAW_`.

Lo smoke live base artifact/attendance richiede
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La ricerca nel calendario
richiede `https://www.googleapis.com/auth/calendar.events.readonly`. L'export del
body documento da Drive richiede
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un nuovo spazio Meet:

```bash
openclaw googlemeet create
```

Il comando stampa il nuovo `meeting uri`, la sorgente e la sessione di join. Con credenziali OAuth
usa l'API ufficiale Google Meet. Senza credenziali OAuth usa il profilo browser connesso del Chrome node fissato come fallback. Gli agenti possono
usare il tool `google_meet` con `action: "create"` per creare e partecipare in un solo
passaggio. Per una creazione del solo URL, passa `"join": false`.

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

Se il fallback browser incontra il login Google o un blocco di permessi Meet prima di
poter creare l'URL, il metodo Gateway restituisce una risposta fallita e il
tool `google_meet` restituisce dettagli strutturati invece di una semplice stringa:

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

Quando un agente vede `manualActionRequired: true`, dovrebbe riportare il
`manualActionMessage` più il contesto browser node/tab e smettere di aprire nuove
schede Meet finché l'operatore non completa il passaggio nel browser.

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

La creazione di un Meet partecipa per impostazione predefinita. Il trasporto Chrome o Chrome-node ha comunque bisogno di un profilo Google Chrome connesso per partecipare tramite il browser. Se il
profilo è disconnesso, OpenClaw segnala `manualActionRequired: true` oppure un
errore fallback browser e chiede all'operatore di completare il login Google prima di
riprovare.

Imposta `preview.enrollmentAcknowledged: true` solo dopo aver confermato che il tuo progetto Cloud, il principal OAuth e i partecipanti alla riunione sono iscritti al Google
Workspace Developer Preview Program per le API media Meet.

## Configurazione

Il percorso realtime Chrome comune richiede solo il plugin abilitato, BlackHole, SoX
e una chiave di provider vocale realtime di backend. OpenAI è il predefinito; imposta
`realtime.provider: "google"` per usare Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# oppure
export GEMINI_API_KEY=...
```

Imposta la configurazione del plugin sotto `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: node id/nome/IP facoltativo per `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usato nella schermata guest di Meet
  quando non connesso
- `chrome.autoJoin: true`: compilazione best-effort del nome guest e clic su Join Now
  tramite l'automazione browser OpenClaw su `chrome-node`
- `chrome.reuseExistingTab: true`: attiva una scheda Meet esistente invece di
  aprire duplicati
- `chrome.waitForInCallMs: 20000`: attende che la scheda Meet segnali in-call
  prima che venga attivata l'introduzione realtime
- `chrome.audioInputCommand`: comando SoX `rec` che scrive audio
  mu-law G.711 a 8 kHz su stdout
- `chrome.audioOutputCommand`: comando SoX `play` che legge audio
  mu-law G.711 a 8 kHz da stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: risposte vocali brevi, con
  `openclaw_agent_consult` per risposte più approfondite
- `realtime.introMessage`: breve controllo vocale di disponibilità quando il bridge realtime
  si connette; impostalo su `""` per partecipare in silenzio

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

`voiceCall.enabled` ha come predefinito `true`; con il trasporto Twilio delega la
vera chiamata PSTN e il DTMF al plugin Voice Call. Se `voice-call` non è
abilitato, Google Meet può comunque validare e registrare il piano di composizione, ma non
può effettuare la chiamata Twilio.

## Tool

Gli agenti possono usare il tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Usa `transport: "chrome"` quando Chrome gira sull'host Gateway. Usa
`transport: "chrome-node"` quando Chrome gira su un node associato come una VM
Parallels. In entrambi i casi il modello realtime e `openclaw_agent_consult` girano sull'
host Gateway, quindi le credenziali del modello restano lì.

Usa `action: "status"` per elencare le sessioni attive o ispezionare un session ID. Usa
`action: "speak"` con `sessionId` e `message` per far parlare immediatamente
l'agente realtime. Usa `action: "test_speech"` per creare o riusare la sessione,
attivare una frase nota e restituire lo stato `inCall` quando l'host Chrome può
segnalarlo. Usa `action: "leave"` per contrassegnare una sessione come terminata.

`status` include lo stato di salute di Chrome quando disponibile:

- `inCall`: Chrome sembra essere all'interno della chiamata Meet
- `micMuted`: stato del microfono Meet best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: il
  profilo browser richiede login manuale, ammissione dell'host, permessi o
  riparazione del controllo browser prima che la voce possa funzionare
- `providerConnected` / `realtimeReady`: stato del bridge vocale realtime
- `lastInputAt` / `lastOutputAt`: ultimo audio visto o inviato al bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulto agente realtime

La modalità realtime Chrome è ottimizzata per un loop vocale live. Il provider vocale
realtime ascolta l'audio della riunione e parla attraverso il bridge audio configurato.
Quando il modello realtime ha bisogno di ragionamento più profondo, informazioni attuali o normali
tool OpenClaw, può chiamare `openclaw_agent_consult`.

Il tool di consulto esegue dietro le quinte il normale agente OpenClaw con il contesto
della trascrizione recente della riunione e restituisce una risposta parlata concisa alla sessione vocale realtime. Il modello vocale può quindi pronunciare quella risposta nella riunione.
Usa lo stesso tool di consulto realtime condiviso di Voice Call.

`realtime.toolPolicy` controlla l'esecuzione del consulto:

- `safe-read-only`: espone il tool di consulto e limita l'agente normale a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: espone il tool di consulto e lascia che l'agente normale usi la normale
  policy strumenti dell'agente.
- `none`: non espone il tool di consulto al modello vocale realtime.

La chiave di sessione del consulto ha ambito per sessione Meet, così le chiamate di consulto successive
possono riusare il contesto del consulto precedente durante la stessa riunione.

Per forzare un controllo vocale di disponibilità dopo che Chrome ha completato la partecipazione alla chiamata:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Per lo smoke completo join-and-speak:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist dei test live

Usa questa sequenza prima di affidare una riunione a un agente non supervisionato:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Stato atteso di Chrome-node:

- `googlemeet setup` è tutto verde.
- `googlemeet setup` include `chrome-node-connected` quando `chrome-node` è il
  trasporto predefinito o un node è fissato.
- `nodes status` mostra il node selezionato connesso.
- Il node selezionato pubblicizza sia `googlemeet.chrome` sia `browser.proxy`.
- La scheda Meet entra nella chiamata e `test-speech` restituisce lo stato Chrome con
  `inCall: true`.

Per un host Chrome remoto come una VM macOS Parallels, questo è il controllo
sicuro più breve dopo aver aggiornato il Gateway o la VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Questo dimostra che il plugin Gateway è caricato, che il node VM è connesso con il
token corrente e che il bridge audio Meet è disponibile prima che un agente apra una
vera scheda riunione.

Per uno smoke Twilio, usa una riunione che esponga i dettagli di accesso telefonico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Stato atteso di Twilio:

- `googlemeet setup` include i controlli verdi `twilio-voice-call-plugin` e
  `twilio-voice-call-credentials`.
- `voicecall` è disponibile nella CLI dopo il reload del Gateway.
- La sessione restituita ha `transport: "twilio"` e un `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` chiude la chiamata vocale delegata.

## Risoluzione dei problemi

### L'agente non riesce a vedere il tool Google Meet

Conferma che il plugin sia abilitato nella configurazione del Gateway e ricarica il Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se hai appena modificato `plugins.entries.google-meet`, riavvia o ricarica il Gateway.
L'agente in esecuzione vede solo i tool plugin registrati dal processo Gateway
corrente.

### Nessun node connesso compatibile con Google Meet

Sull'host node, esegui:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sull'host Gateway, approva il node e verifica i comandi:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Il node deve essere connesso ed elencare `googlemeet.chrome` più `browser.proxy`.
La configurazione Gateway deve consentire quei comandi del node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` fallisce su `chrome-node-connected` o il log Gateway riporta
`gateway token mismatch`, reinstalla o riavvia il node con il token Gateway
corrente. Per un Gateway LAN questo di solito significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Poi ricarica il servizio node e riesegui:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Il browser si apre ma l'agente non riesce a partecipare

Esegui `googlemeet test-speech` e ispeziona lo stato Chrome restituito. Se
riporta `manualActionRequired: true`, mostra `manualActionMessage` all'operatore
e smetti di ritentare finché l'azione nel browser non è completata.

Azioni manuali comuni:

- Accedi al profilo Chrome.
- Ammetti l'ospite dall'account host di Meet.
- Concedi i permessi microfono/fotocamera a Chrome quando appare il prompt
  nativo di autorizzazione.
- Chiudi o ripara una finestra di dialogo di permessi Meet bloccata.

Non segnalare "non connesso" solo perché Meet mostra "Do you want people to
hear you in the meeting?" Quella è l'interstiziale di scelta audio di Meet; OpenClaw
fa clic su **Use microphone** tramite automazione browser quando disponibile e continua ad attendere il vero stato della riunione. Per il fallback browser solo create, OpenClaw
può fare clic su **Continue without microphone** perché la creazione dell'URL non richiede
il percorso audio realtime.

### La creazione della riunione fallisce

`googlemeet create` usa prima l'endpoint Google Meet API `spaces.create`
quando sono configurate credenziali OAuth. Senza credenziali OAuth usa come fallback
il browser del Chrome node fissato. Conferma:

- Per la creazione API: `oauth.clientId` e `oauth.refreshToken` sono configurati,
  oppure sono presenti le corrispondenti variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*`.
- Per la creazione API: il refresh token è stato generato dopo che è stato
  aggiunto il supporto create. I token più vecchi potrebbero non avere lo scope `meetings.space.created`; riesegui
  `openclaw googlemeet auth login --json` e aggiorna la configurazione del plugin.
- Per il fallback browser: `defaultTransport: "chrome-node"` e
  `chromeNode.node` puntano a un node connesso con `browser.proxy` e
  `googlemeet.chrome`.
- Per il fallback browser: il profilo Chrome OpenClaw su quel node è connesso
  a Google e può aprire `https://meet.google.com/new`.
- Per il fallback browser: i retry riusano una scheda `https://meet.google.com/new`
  o una scheda di prompt account Google esistente prima di aprirne una nuova. Se un agente va in timeout,
  riprova la chiamata al tool invece di aprire manualmente un'altra scheda Meet.
- Per il fallback browser: se il tool restituisce `manualActionRequired: true`, usa
  `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` restituiti per guidare l'operatore. Non ritentare in loop finché tale
  azione non è completata.
- Per il fallback browser: se Meet mostra "Do you want people to hear you in the
  meeting?", lascia aperta la scheda. OpenClaw dovrebbe fare clic su **Use microphone** oppure, per
  il fallback solo create, su **Continue without microphone** tramite
  automazione browser e continuare ad attendere l'URL Meet generato. Se non ci riesce, il
  messaggio di errore dovrebbe menzionare `meet-audio-choice-required`, non `google-login-required`.

### L'agente partecipa ma non parla

Controlla il percorso realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "realtime"` per ascolto/risposta vocale. `mode: "transcribe"` intenzionalmente
non avvia il bridge vocale realtime duplex.

Verifica anche:

- È disponibile una chiave di provider realtime sull'host Gateway, come
  `OPENAI_API_KEY` oppure `GEMINI_API_KEY`.
- `BlackHole 2ch` è visibile sull'host Chrome.
- `rec` e `play` esistono sull'host Chrome.
- Microfono e altoparlante Meet sono instradati attraverso il percorso audio virtuale usato da
  OpenClaw.

`googlemeet doctor [session-id]` stampa sessione, node, stato in-call,
motivo dell'azione manuale, connessione del provider realtime, `realtimeReady`, attività audio
in ingresso/uscita, ultimi timestamp audio, contatori di byte e URL del browser.
Usa `googlemeet status [session-id]` quando ti serve il JSON grezzo. Usa
`googlemeet doctor --oauth` quando devi verificare l'aggiornamento OAuth Google Meet
senza esporre token; aggiungi `--meeting` o `--create-space` quando ti serve
anche una prova API Google Meet.

Se un agente è andato in timeout e puoi vedere una scheda Meet già aperta, ispeziona quella scheda
senza aprirne un'altra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L'azione tool equivalente è `recover_current_tab`. Mette a fuoco e ispeziona una
scheda Meet esistente per il trasporto selezionato. Con `chrome`, usa il controllo
browser locale tramite il Gateway; con `chrome-node`, usa il Chrome node configurato. Non apre una nuova scheda né crea una nuova sessione; riporta il blocco
corrente, come login, ammissione, permessi o stato della scelta audio.
Il comando CLI parla al Gateway configurato, quindi il Gateway deve essere in esecuzione;
`chrome-node` richiede anche che il Chrome node sia connesso.

### I controlli di setup Twilio falliscono

`twilio-voice-call-plugin` fallisce quando `voice-call` non è consentito o non è abilitato.
Aggiungilo a `plugins.allow`, abilita `plugins.entries.voice-call` e ricarica il
Gateway.

`twilio-voice-call-credentials` fallisce quando nel backend Twilio mancano account
SID, auth token o numero chiamante. Impostali sull'host Gateway:

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

`voicecall smoke` per impostazione predefinita verifica solo la readiness. Per fare un dry-run su un numero specifico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Aggiungi `--yes` solo quando vuoi intenzionalmente effettuare una vera chiamata
notify in uscita:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La chiamata Twilio parte ma non entra mai nella riunione

Conferma che l'evento Meet esponga i dettagli dell'accesso telefonico. Passa il numero
dial-in esatto e il PIN o una sequenza DTMF personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniziali o virgole in `--dtmf-sequence` se il provider ha bisogno di una pausa
prima di inserire il PIN.

## Note

L'API media ufficiale di Google Meet è orientata alla ricezione, quindi parlare in una chiamata
Meet richiede comunque un percorso da partecipante. Questo plugin mantiene visibile quel confine:
Chrome gestisce la partecipazione browser e il routing audio locale; Twilio gestisce
la partecipazione tramite accesso telefonico.

La modalità realtime Chrome richiede una delle seguenti opzioni:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw possiede il
  bridge del modello realtime e instrada audio mu-law G.711 a 8 kHz tra quei
  comandi e il provider vocale realtime selezionato.
- `chrome.audioBridgeCommand`: un comando bridge esterno possiede l'intero percorso audio locale
  e deve terminare dopo aver avviato o convalidato il proprio daemon.

Per audio duplex pulito, instrada l'output Meet e il microfono Meet attraverso
dispositivi virtuali separati o un grafo di dispositivi virtuali in stile Loopback. Un singolo dispositivo BlackHole condiviso può rimandare in eco nella chiamata gli altri partecipanti.

`googlemeet speak` attiva il bridge audio realtime attivo per una sessione
Chrome. `googlemeet leave` arresta quel bridge. Per le sessioni Twilio delegate
tramite il plugin Voice Call, `leave` chiude anche la chiamata vocale sottostante.

## Correlati

- [Plugin Voice Call](/it/plugins/voice-call)
- [Modalità Talk](/it/nodes/talk)
- [Creare plugin](/it/plugins/building-plugins)
