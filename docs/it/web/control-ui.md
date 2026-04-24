---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi l'accesso Tailnet senza tunnel SSH
summary: Interfaccia di controllo basata su browser per il Gateway (chat, Node, configurazione)
title: Interfaccia di controllo
x-i18n:
    generated_at: "2026-04-24T09:55:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

L'Interfaccia di controllo è una piccola app a pagina singola **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad esempio `/openclaw`)

Comunica **direttamente con il Gateway WebSocket** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- intestazioni di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- intestazioni di identità del proxy attendibile quando `gateway.auth.mode: "trusted-proxy"`

Il pannello delle impostazioni della dashboard conserva un token per la sessione
della scheda corrente del browser e l'URL del gateway selezionato; le password non vengono mantenute. L'onboarding di solito
genera un token del gateway per l'autenticazione con secret condiviso alla prima connessione, ma
anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Associazione del dispositivo (prima connessione)

Quando ti connetti all'Interfaccia di controllo da un nuovo browser o dispositivo, il Gateway
richiede una **approvazione di associazione una tantum** — anche se sei sulla stessa Tailnet
con `gateway.auth.allowTailscale: true`. Questa è una misura di sicurezza per prevenire
accessi non autorizzati.

**Cosa vedrai:** "disconnected (1008): pairing required"

**Per approvare il dispositivo:**

```bash
# Elenca le richieste in sospeso
openclaw devices list

# Approva tramite ID richiesta
openclaw devices approve <requestId>
```

Se il browser riprova l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e cambi l'accesso da sola lettura a
accesso in scrittura/amministratore, questo viene trattato come un aggiornamento di approvazione, non come una riconnessione silenziosa.
OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione più ampia
e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno
che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Consulta
[Devices CLI](/it/cli/devices) per la rotazione e la revoca dei token.

**Note:**

- Le connessioni dirette del browser in local loopback (`127.0.0.1` / `localhost`) vengono
  approvate automaticamente.
- Le connessioni del browser da Tailnet e LAN richiedono comunque un'approvazione esplicita, anche quando
  provengono dalla stessa macchina.
- Ogni profilo del browser genera un ID dispositivo univoco, quindi cambiare browser o
  cancellare i dati del browser richiederà una nuova associazione.

## Identità personale (locale al browser)

L'Interfaccia di controllo supporta un'identità personale per browser (nome visualizzato e
avatar) allegata ai messaggi in uscita per l'attribuzione nelle sessioni condivise. Rimane
nell'archiviazione del browser, è limitata al profilo browser corrente e non viene
sincronizzata con altri dispositivi né salvata lato server oltre ai normali metadati
di paternità nel transcript dei messaggi che invii effettivamente. Cancellare i dati del sito o
cambiare browser la reimposta a vuota.

## Endpoint di configurazione runtime

L'Interfaccia di controllo recupera le proprie impostazioni runtime da
`/__openclaw/control-ui-config.json`. Tale endpoint è protetto dalla stessa
autenticazione del gateway usata dal resto della superficie HTTP: i browser non autenticati non possono
recuperarlo, e un recupero riuscito richiede un token/password del gateway già validi,
identità Tailscale Serve o identità di un proxy attendibile.

## Supporto delle lingue

L'Interfaccia di controllo può localizzarsi al primo caricamento in base alla lingua del tuo browser.
Per sostituirla in seguito, apri **Overview -> Gateway Access -> Language**. Il
selettore della lingua si trova nella scheda Gateway Access, non in Appearance.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Le traduzioni non inglesi vengono caricate in modo lazy nel browser.
- La lingua selezionata viene salvata nell'archiviazione del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ricadono sull'inglese.

## Cosa può fare (oggi)

- Chattare con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Comunicare direttamente con OpenAI Realtime dal browser tramite WebRTC. Il Gateway
  genera un secret client Realtime a breve durata con `talk.realtime.session`; il
  browser invia l'audio del microfono direttamente a OpenAI e inoltra le chiamate
  allo strumento `openclaw_agent_consult` tramite `chat.send` per il modello OpenClaw
  configurato di dimensioni maggiori.
- Trasmettere chiamate agli strumenti + schede di output live degli strumenti in Chat (eventi dell'agente)
- Canali: stato dei canali integrati più quelli dei Plugin inclusi/esterni, accesso QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`)
- Istanze: elenco presenze + aggiornamento (`system-presence`)
- Sessioni: elenco + override per sessione di modello/ragionamento/veloce/verboso/traccia/ragionamento (`sessions.list`, `sessions.patch`)
- Dreams: stato di Dreaming, attivazione/disattivazione e lettore del Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- processi Cron: elencare/aggiungere/modificare/eseguire/attivare/disattivare + cronologia esecuzioni (`cron.*`)
- Skills: stato, attivazione/disattivazione, installazione, aggiornamenti della chiave API (`skills.*`)
- Node: elenco + limiti (`node.list`)
- Approvazioni exec: modifica delle allowlist del gateway o dei Node + policy ask per `exec host=gateway/node` (`exec.approvals.*`)
- Configurazione: visualizzare/modificare `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configurazione: applicare + riavviare con validazione (`config.apply`) e riattivare l'ultima sessione attiva
- Le scritture della configurazione includono una protezione con hash di base per evitare di sovrascrivere modifiche concorrenti
- Le scritture della configurazione (`config.set`/`config.apply`/`config.patch`) eseguono anche un preflight sulla risoluzione attiva di SecretRef per i riferimenti nel payload di configurazione inviato; i riferimenti attivi inviati che non possono essere risolti vengono rifiutati prima della scrittura
- Schema della configurazione + rendering dei moduli (`config.schema` / `config.schema.lookup`,
  inclusi `title` / `description` dei campi, suggerimenti UI corrispondenti, riepiloghi
  immediati degli elementi figli, metadati della documentazione su nodi oggetto annidati/wildcard/array/composizione,
  più schemi di Plugin + canali quando disponibili); l'editor Raw JSON è
  disponibile solo quando lo snapshot ha un round-trip raw sicuro
- Se uno snapshot non può eseguire in sicurezza il round-trip del testo raw, l'Interfaccia di controllo forza la modalità Form e disabilita la modalità Raw per quello snapshot
- Il comando "Reset to saved" dell'editor Raw JSON mantiene la forma creata in raw (formattazione, commenti, layout di `$include`) invece di rieseguire il rendering di uno snapshot appiattito, così le modifiche esterne sopravvivono a un reset quando lo snapshot può eseguire in sicurezza il round-trip
- I valori di oggetti SecretRef strutturati vengono mostrati in sola lettura negli input di testo del modulo per evitare la corruzione accidentale da oggetto a stringa
- Debug: snapshot di stato/integrità/modelli + registro eventi + chiamate RPC manuali (`status`, `health`, `models.list`)
- Log: tail live dei log file del gateway con filtro/esportazione (`logs.tail`)
- Aggiornamento: eseguire un aggiornamento package/git + riavvio (`update.run`) con un report di riavvio

Note del pannello processi Cron:

- Per i processi isolati, la consegna predefinita è l'annuncio del riepilogo. Puoi passare a none se vuoi esecuzioni solo interne.
- I campi canale/destinazione vengono visualizzati quando è selezionato announce.
- La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL Webhook HTTP(S) valido.
- Per i processi della sessione principale, sono disponibili le modalità di consegna webhook e none.
- I controlli di modifica avanzati includono delete-after-run, clear agent override, opzioni exact/stagger del cron,
  override di modello/ragionamento dell'agente e opzioni di consegna best-effort.
- La validazione del modulo è inline con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
- Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il webhook viene inviato senza intestazione di autenticazione.
- Fallback deprecato: i processi legacy archiviati con `notify: true` possono ancora usare `cron.webhook` fino alla migrazione.

## Comportamento della chat

- `chat.send` è **non bloccante**: conferma immediatamente con `{ runId, status: "started" }` e la risposta viene trasmessa tramite eventi `chat`.
- Reinviare con la stessa `idempotencyKey` restituisce `{ status: "in_flight" }` durante l'esecuzione e `{ status: "ok" }` dopo il completamento.
- Le risposte di `chat.history` sono limitate in dimensione per la sicurezza dell'interfaccia. Quando le voci del transcript sono troppo grandi, il Gateway può troncare i campi di testo lunghi, omettere blocchi di metadati pesanti e sostituire i messaggi troppo grandi con un segnaposto (`[chat.history omitted: message too large]`).
- Le immagini dell'assistente/generate vengono mantenute come riferimenti a media gestiti e servite di nuovo tramite URL media autenticati del Gateway, quindi i ricaricamenti non dipendono dal fatto che i payload immagine raw base64 restino nella risposta della cronologia chat.
- `chat.history` rimuove anche i tag direttiva inline solo visualizzazione dal testo visibile dell'assistente (ad esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), i payload XML in testo semplice delle chiamate agli strumenti (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata agli strumenti troncati), e i token di controllo del modello ASCII/a larghezza piena trapelati, e omette le voci dell'assistente il cui intero testo visibile è solo l'esatto token silenzioso `NO_REPLY` / `no_reply`.
- `chat.inject` aggiunge una nota dell'assistente al transcript della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione dell'agente, nessuna consegna del canale).
- I selettori di modello e ragionamento nell'intestazione della chat applicano patch alla sessione attiva immediatamente tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio limitate a un solo turno.
- La modalità Talk usa un provider vocale realtime registrato che supporta sessioni WebRTC nel browser. Configura OpenAI con `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure riutilizza la configurazione del provider realtime di Voice Call. Il browser non riceve mai la normale chiave API OpenAI; riceve
  solo il secret client Realtime effimero. La voce realtime Google Live è
  supportata per il backend Voice Call e i bridge Google Meet, ma non ancora per questo percorso
  WebRTC nel browser. Il prompt della sessione Realtime viene assemblato dal Gateway;
  `talk.realtime.session` non accetta override delle istruzioni forniti dal chiamante.
- Nel composer della Chat, il controllo Talk è il pulsante con le onde accanto al
  pulsante di dettatura del microfono. Quando Talk si avvia, la riga di stato del composer mostra
  `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure
  `Asking OpenClaw...` mentre una chiamata realtime a uno strumento consulta il modello
  OpenClaw configurato di dimensioni maggiori tramite `chat.send`.
- Arresto:
  - Fai clic su **Stop** (chiama `chat.abort`)
  - Mentre un'esecuzione è attiva, i normali follow-up vengono accodati. Fai clic su **Steer** in un messaggio accodato per inserire quel follow-up nel turno in esecuzione.
  - Digita `/stop` (oppure frasi di interruzione standalone come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per interrompere fuori banda
  - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per interrompere tutte le esecuzioni attive di quella sessione
- Conservazione parziale all'interruzione:
  - Quando un'esecuzione viene interrotta, il testo parziale dell'assistente può comunque essere mostrato nell'interfaccia
  - Il Gateway mantiene il testo parziale interrotto dell'assistente nella cronologia del transcript quando esiste output bufferizzato
  - Le voci mantenute includono metadati di interruzione in modo che i consumer del transcript possano distinguere i parziali interrotti dall'output di completamento normale

## Embed ospitati

I messaggi dell'assistente possono eseguire il rendering di contenuti web ospitati inline con lo shortcode `[embed ...]`.
La policy sandbox dell'iframe è controllata da
`gateway.controlUi.embedSandbox`:

- `strict`: disabilita l'esecuzione di script negli embed ospitati
- `scripts`: consente embed interattivi mantenendo l'isolamento dell'origine; questo è
  il valore predefinito e di solito è sufficiente per giochi/widget browser
  autosufficienti
- `trusted`: aggiunge `allow-same-origin` oltre a `allow-scripts` per documenti
  dello stesso sito che richiedono intenzionalmente privilegi più elevati

Esempio:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Usa `trusted` solo quando il documento incorporato ha realmente bisogno del
comportamento same-origin. Per la maggior parte dei giochi generati dall'agente e delle tele interattive, `scripts` è la scelta più sicura.

Gli URL di embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se
vuoi intenzionalmente consentire a `[embed url="https://..."]` di caricare pagine di terze parti, imposta
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Accesso Tailnet (consigliato)

### Tailscale Serve integrato (preferito)

Mantieni il Gateway su loopback e lascia che Tailscale Serve lo esponga tramite HTTPS:

```bash
openclaw gateway --tailscale serve
```

Apri:

- `https://<magicdns>/` (oppure il tuo `gateway.controlUi.basePath` configurato)

Per impostazione predefinita, le richieste Control UI/WebSocket Serve possono autenticarsi tramite intestazioni di identità Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw
verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con
`tailscale whois` e confrontandolo con l'intestazione, e accetta queste intestazioni solo quando la
richiesta raggiunge il loopback con le intestazioni `x-forwarded-*` di Tailscale. Imposta
`gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con secret condiviso
anche per il traffico Serve. In tal caso usa `gateway.auth.mode: "token"` oppure
`"password"`.
Per questo percorso asincrono di identità Serve, i tentativi di autenticazione falliti per lo stesso IP client
e ambito di autenticazione vengono serializzati prima delle scritture del rate limit.
I retry errati concorrenti dallo stesso browser possono quindi mostrare `retry later` alla seconda richiesta
invece di due semplici mismatch in competizione in parallelo.
L'autenticazione Serve senza token presume che l'host del gateway sia attendibile. Se su quell'host
può essere eseguito codice locale non attendibile, richiedi l'autenticazione con token/password.

### Bind a tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Poi apri:

- `http://<tailscale-ip>:18789/` (oppure il tuo `gateway.controlUi.basePath` configurato)

Incolla il secret condiviso corrispondente nelle impostazioni della UI (inviato come
`connect.params.auth.token` oppure `connect.params.auth.password`).

## HTTP non sicuro

Se apri la dashboard tramite HTTP semplice (`http://<lan-ip>` oppure `http://<tailscale-ip>`),
il browser viene eseguito in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita,
OpenClaw **blocca** le connessioni alla Control UI senza identità del dispositivo.

Eccezioni documentate:

- compatibilità localhost-only con HTTP non sicuro tramite `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita dell'operatore alla Control UI tramite `gateway.auth.mode: "trusted-proxy"`
- modalità di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host del gateway)

**Comportamento del toggle di autenticazione non sicura:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` è solo un toggle di compatibilità locale:

- Consente alle sessioni della Control UI su localhost di procedere senza identità del dispositivo in
  contesti HTTP non sicuri.
- Non bypassa i controlli di associazione.
- Non allenta i requisiti di identità del dispositivo per connessioni remote (non localhost).

**Solo per emergenze:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della Control UI ed è un
grave peggioramento della sicurezza. Ripristinalo rapidamente dopo l'uso di emergenza.

Nota su trusted-proxy:

- un'autenticazione trusted-proxy riuscita può ammettere sessioni **operatore** della Control UI senza
  identità del dispositivo
- questo **non** si estende alle sessioni della Control UI con ruolo Node
- i reverse proxy loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; consulta
  [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth)

Consulta [Tailscale](/it/gateway/tailscale) per le indicazioni di configurazione HTTPS.

## Content Security Policy

La Control UI viene distribuita con una policy `img-src` restrittiva: sono consentite solo risorse **same-origin** e URL `data:`. Gli URL di immagine remoti `http(s)` e protocol-relative vengono rifiutati dal browser e non generano richieste di rete.

Cosa significa in pratica:

- Gli avatar e le immagini serviti tramite percorsi relativi (ad esempio `/avatars/<id>`) continuano a essere renderizzati.
- Gli URL inline `data:image/...` continuano a essere renderizzati (utile per i payload nel protocollo).
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della Control UI e sostituiti con il logo/badge integrato, così un canale compromesso o malevolo non può forzare richieste arbitrarie di immagini remote dal browser di un operatore.

Non devi modificare nulla per ottenere questo comportamento: è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del gateway è configurata, l'endpoint avatar della Control UI richiede lo stesso token gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati dell'avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route sibling assistant-media). Questo impedisce alla route avatar di esporre l'identità dell'agente su host altrimenti protetti.
- La stessa Control UI inoltra il token gateway come intestazione bearer durante il recupero degli avatar e usa URL blob autenticati così l'immagine continua a essere renderizzata nelle dashboard.

Se disabiliti l'autenticazione del gateway (non consigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del gateway.

## Compilazione della UI

Il Gateway serve file statici da `dist/control-ui`. Compilali con:

```bash
pnpm ui:build
```

Base assoluta facoltativa (quando vuoi URL delle risorse fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server di sviluppo separato):

```bash
pnpm ui:dev
```

Poi punta la UI al tuo URL Gateway WS (ad esempio `ws://127.0.0.1:18789`).

## Debug/test: server di sviluppo + Gateway remoto

La Control UI è composta da file statici; la destinazione WebSocket è configurabile e può essere
diversa dall'origine HTTP. Questo è utile quando vuoi il server di sviluppo Vite
in locale ma il Gateway è in esecuzione altrove.

1. Avvia il server di sviluppo della UI: `pnpm ui:dev`
2. Apri un URL come:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticazione facoltativa una tantum (se necessaria):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Note:

- `gatewayUrl` viene salvato in localStorage dopo il caricamento e rimosso dall'URL.
- `token` dovrebbe essere passato tramite il frammento URL (`#token=...`) quando possibile. I frammenti non vengono inviati al server, evitando così perdite nei log delle richieste e nell'header Referer. I parametri legacy `?token=` della query vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi immediatamente dopo il bootstrap.
- `password` viene mantenuta solo in memoria.
- Quando `gatewayUrl` è impostato, la UI non ricade sulle credenziali di configurazione o ambiente.
  Fornisci `token` (o `password`) esplicitamente. L'assenza di credenziali esplicite è un errore.
- Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
- `gatewayUrl` viene accettato solo in una finestra di livello superiore (non incorporata) per prevenire il clickjacking.
- Le distribuzioni della Control UI non loopback devono impostare `gateway.controlUi.allowedOrigins`
  esplicitamente (origini complete). Questo include le configurazioni di sviluppo remoto.
- Non usare `gateway.controlUi.allowedOrigins: ["*"]` se non per test locali strettamente controllati.
  Significa consentire qualsiasi origine del browser, non “corrispondere a qualunque host io stia
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita
  la modalità di fallback dell'origine basata sull'intestazione Host, ma è una modalità di sicurezza pericolosa.

Esempio:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Dettagli sulla configurazione dell'accesso remoto: [Remote access](/it/gateway/remote).

## Correlati

- [Dashboard](/it/web/dashboard) — dashboard del gateway
- [WebChat](/it/web/webchat) — interfaccia di chat basata su browser
- [TUI](/it/web/tui) — interfaccia utente terminale
- [Health Checks](/it/gateway/health) — monitoraggio dell'integrità del gateway
