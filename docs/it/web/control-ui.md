---
read_when:
    - Vuoi gestire il Gateway da un browser
    - Vuoi accesso Tailnet senza tunnel SSH
summary: Control UI basata su browser per il Gateway (chat, Node, configurazione)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T14:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

La Control UI è una piccola single-page app **Vite + Lit** servita dal Gateway:

- predefinito: `http://<host>:18789/`
- prefisso opzionale: imposta `gateway.controlUi.basePath` (ad esempio `/openclaw`)

Parla **direttamente con il Gateway WebSocket** sulla stessa porta.

## Apertura rapida (locale)

Se il Gateway è in esecuzione sullo stesso computer, apri:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (oppure [http://localhost:18789/](http://localhost:18789/))

Se la pagina non si carica, avvia prima il Gateway: `openclaw gateway`.

L'autenticazione viene fornita durante l'handshake WebSocket tramite:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header di identità Tailscale Serve quando `gateway.auth.allowTailscale: true`
- header di identità trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Il pannello impostazioni della dashboard mantiene un token per la sessione della scheda del browser corrente e l'URL del gateway selezionato; le password non vengono mantenute. L'onboarding di solito genera un token gateway per l'autenticazione con segreto condiviso alla prima connessione, ma anche l'autenticazione con password funziona quando `gateway.auth.mode` è `"password"`.

## Pairing del dispositivo (prima connessione)

Quando ti connetti alla Control UI da un nuovo browser o dispositivo, il Gateway richiede una **approvazione di pairing una tantum** — anche se sei sulla stessa Tailnet con `gateway.auth.allowTailscale: true`. Questa è una misura di sicurezza per impedire accessi non autorizzati.

**Cosa vedrai:** "disconnected (1008): pairing required"

**Per approvare il dispositivo:**

```bash
# Elenca le richieste in attesa
openclaw devices list

# Approva tramite request ID
openclaw devices approve <requestId>
```

Se il browser ritenta il pairing con dettagli auth modificati (ruolo/ambiti/chiave pubblica), la precedente richiesta in attesa viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Se il browser è già associato e lo cambi da accesso in lettura ad accesso in scrittura/admin, questo viene trattato come un upgrade di approvazione, non come una riconnessione silenziosa. OpenClaw mantiene attiva la vecchia approvazione, blocca la riconnessione con privilegi più ampi e ti chiede di approvare esplicitamente il nuovo insieme di ambiti.

Una volta approvato, il dispositivo viene ricordato e non richiederà una nuova approvazione a meno che tu non lo revochi con `openclaw devices revoke --device <id> --role <role>`. Vedi [Devices CLI](/it/cli/devices) per rotazione dei token e revoca.

**Note:**

- Le connessioni browser locali dirette su loopback (`127.0.0.1` / `localhost`) vengono auto-approvate.
- Le connessioni browser Tailnet e LAN richiedono comunque approvazione esplicita, anche quando provengono dalla stessa macchina.
- Ogni profilo browser genera un ID dispositivo univoco, quindi cambiare browser o cancellare i dati del browser richiederà un nuovo pairing.

## Identità personale (locale al browser)

La Control UI supporta un'identità personale per browser (nome visualizzato e avatar) allegata ai messaggi in uscita per attribuzione nelle sessioni condivise. Vive nello storage del browser, ha ambito limitato al profilo browser corrente e non viene sincronizzata con altri dispositivi né persistita lato server oltre ai normali metadati di autore della trascrizione sui messaggi che invii davvero. Cancellare i dati del sito o cambiare browser la reimposta a vuota.

## Endpoint della configurazione runtime

La Control UI recupera le proprie impostazioni runtime da
`/__openclaw/control-ui-config.json`. Questo endpoint è protetto dalla stessa autenticazione gateway del resto della superficie HTTP: i browser non autenticati non possono recuperarlo, e un recupero riuscito richiede un token/password gateway già valido, identità Tailscale Serve o identità trusted-proxy.

## Supporto lingua

La Control UI può localizzarsi al primo caricamento in base alla lingua del tuo browser. Per sovrascriverla in seguito, apri **Overview -> Gateway Access -> Language**. Il selettore della lingua si trova nella scheda Gateway Access, non sotto Appearance.

- Lingue supportate: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Le traduzioni non inglesi vengono caricate lazy nel browser.
- La lingua selezionata viene salvata nello storage del browser e riutilizzata nelle visite future.
- Le chiavi di traduzione mancanti ricadono sull'inglese.

## Cosa può fare (oggi)

- Chattare con il modello tramite Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Parlare direttamente con OpenAI Realtime dal browser via WebRTC. Il Gateway genera un secret client Realtime a breve durata con `talk.realtime.session`; il browser invia l'audio del microfono direttamente a OpenAI e inoltra le chiamate strumento `openclaw_agent_consult` di nuovo tramite `chat.send` al modello OpenClaw più grande configurato.
- Fare streaming delle chiamate agli strumenti + schede con output live degli strumenti nella Chat (eventi agente)
- Canali: stato dei canali built-in più quelli dei Plugin inclusi/esterni, login QR e configurazione per canale (`channels.status`, `web.login.*`, `config.patch`)
- Istanze: elenco presence + refresh (`system-presence`)
- Sessioni: elenco + override per sessione di model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Sogni: stato Dreaming, toggle abilita/disabilita e lettore Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Job Cron: elenco/aggiunta/modifica/esecuzione/abilita/disabilita + cronologia delle esecuzioni (`cron.*`)
- Skills: stato, abilita/disabilita, installazione, aggiornamenti chiave API (`skills.*`)
- Node: elenco + capability (`node.list`)
- Approvazioni exec: modifica di allowlist gateway o node + ask policy per `exec host=gateway/node` (`exec.approvals.*`)
- Configurazione: visualizza/modifica `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configurazione: apply + restart con validazione (`config.apply`) e riattivazione dell'ultima sessione attiva
- Le scritture di configurazione includono una protezione base-hash per evitare di sovrascrivere modifiche concorrenti
- Le scritture di configurazione (`config.set`/`config.apply`/`config.patch`) eseguono anche un preflight della risoluzione attiva di SecretRef per i ref nel payload di configurazione inviato; i ref attivi inviati e non risolti vengono rifiutati prima della scrittura
- Schema di configurazione + rendering dei form (`config.schema` / `config.schema.lookup`, inclusi `title` / `description` dei campi, suggerimenti UI corrispondenti, riepiloghi dei figli immediati, metadati docs su nodi oggetto annidato/jolly/array/composizione, più schemi Plugin + canale quando disponibili); l'editor Raw JSON è disponibile solo quando lo snapshot ha un round-trip raw sicuro
- Se uno snapshot non può fare in sicurezza round-trip raw del testo, la Control UI forza la modalità Form e disabilita la modalità Raw per quello snapshot
- Il comando "Reset to saved" dell'editor Raw JSON preserva la forma authored raw (formattazione, commenti, layout `$include`) invece di rirenderizzare uno snapshot appiattito, così le modifiche esterne sopravvivono a un reset quando lo snapshot può fare round-trip raw in sicurezza
- I valori oggetto Structured SecretRef vengono renderizzati in sola lettura negli input testuali del form per prevenire corruzioni accidentali da oggetto a stringa
- Debug: snapshot di status/health/models + log eventi + chiamate RPC manuali (`status`, `health`, `models.list`)
- Log: tail live dei log file del gateway con filtro/export (`logs.tail`)
- Update: esecuzione di un aggiornamento package/git + restart (`update.run`) con report di riavvio

Note sul pannello dei job Cron:

- Per i job isolati, la consegna usa come predefinito il riepilogo announce. Puoi passare a none se vuoi esecuzioni solo interne.
- I campi canale/destinazione compaiono quando è selezionato announce.
- La modalità Webhook usa `delivery.mode = "webhook"` con `delivery.to` impostato su un URL webhook HTTP(S) valido.
- Per i job della sessione principale, sono disponibili le modalità di consegna webhook e none.
- I controlli di modifica avanzata includono delete-after-run, clear agent override, opzioni Cron exact/stagger, override di model/thinking dell'agente e toggle di consegna best-effort.
- La validazione del form è inline con errori a livello di campo; i valori non validi disabilitano il pulsante di salvataggio finché non vengono corretti.
- Imposta `cron.webhookToken` per inviare un bearer token dedicato; se omesso, il webhook viene inviato senza header di autenticazione.
- Fallback deprecato: i job legacy salvati con `notify: true` possono ancora usare `cron.webhook` finché non vengono migrati.

## Comportamento della chat

- `chat.send` è **non bloccante**: conferma subito con `{ runId, status: "started" }` e la risposta arriva in streaming tramite eventi `chat`.
- Reinviare con la stessa `idempotencyKey` restituisce `{ status: "in_flight" }` mentre è in esecuzione e `{ status: "ok" }` dopo il completamento.
- Le risposte `chat.history` sono limitate in dimensione per la sicurezza della UI. Quando le voci della trascrizione sono troppo grandi, il Gateway può troncare campi testuali lunghi, omettere blocchi di metadati pesanti e sostituire messaggi troppo grandi con un placeholder (`[chat.history omitted: message too large]`).
- Le immagini assistant/generate vengono persistite come riferimenti a media gestiti e riservite tramite URL media Gateway autenticati, così i reload non dipendono dal fatto che i payload immagine base64 grezzi restino nella risposta della cronologia chat.
- `chat.history` rimuove anche dal testo assistant visibile i tag di direttiva inline solo display (ad esempio `[[reply_to_*]]` e `[[audio_as_voice]]`), payload XML di chiamata agli strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata agli strumenti troncati) e token di controllo del modello ASCII/full-width fuoriusciti, e omette le voci assistant il cui intero testo visibile è solo l'esatto token silenzioso `NO_REPLY` / `no_reply`.
- Durante un invio attivo e il refresh finale della cronologia, la vista chat mantiene visibili i messaggi utente/assistant optimistic locali se `chat.history` restituisce brevemente uno snapshot più vecchio; la trascrizione canonica sostituisce quei messaggi locali una volta che la cronologia del Gateway si aggiorna.
- `chat.inject` aggiunge una nota assistant alla trascrizione della sessione e trasmette un evento `chat` per aggiornamenti solo UI (nessuna esecuzione agente, nessuna consegna al canale).
- I selettori model e thinking nell'header della chat applicano subito una patch alla sessione attiva tramite `sessions.patch`; sono override persistenti della sessione, non opzioni di invio limitate a un turno.
- Quando i nuovi report d'uso della sessione del Gateway mostrano alta pressione di contesto, l'area del composer della chat mostra un avviso di contesto e, ai livelli di Compaction consigliati, un pulsante compact che esegue il normale percorso di compattazione della sessione. Gli snapshot token obsoleti sono nascosti finché il Gateway non riporta di nuovo un uso aggiornato.
- La modalità Talk usa un provider vocale realtime registrato che supporta sessioni WebRTC da browser. Configura OpenAI con `talk.provider: "openai"` più `talk.providers.openai.apiKey`, oppure riusa la configurazione del provider realtime di Voice Call. Il browser non riceve mai la chiave API OpenAI standard; riceve solo il secret client Realtime effimero. La voce realtime Google Live è supportata per backend Voice Call e bridge Google Meet, ma non ancora per questo percorso WebRTC da browser. Il prompt della sessione Realtime viene assemblato dal Gateway; `talk.realtime.session` non accetta override delle istruzioni forniti dal chiamante.
- Nel composer della Chat, il controllo Talk è il pulsante con le onde accanto al pulsante del microfono per la dettatura. Quando Talk parte, la riga di stato del composer mostra `Connecting Talk...`, poi `Talk live` mentre l'audio è connesso, oppure `Asking OpenClaw...` mentre una chiamata strumento realtime sta consultando il modello più grande configurato tramite `chat.send`.
- Stop:
  - Fai clic su **Stop** (chiama `chat.abort`)
  - Mentre un'esecuzione è attiva, i normali follow-up vengono accodati. Fai clic su **Steer** su un messaggio in coda per iniettare quel follow-up nel turno in esecuzione.
  - Digita `/stop` (oppure frasi di abort standalone come `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) per abortire out-of-band
  - `chat.abort` supporta `{ sessionKey }` (senza `runId`) per abortire tutte le esecuzioni attive per quella sessione
- Conservazione parziale dell'abort:
  - Quando un'esecuzione viene interrotta, il testo assistant parziale può comunque essere mostrato nella UI
  - Il Gateway persiste nella cronologia della trascrizione il testo assistant parziale interrotto quando esiste output bufferizzato
  - Le voci persistite includono metadati di abort così i consumer della trascrizione possono distinguere i parziali abortiti dall'output di completamento normale

## Installazione PWA e web push

La Control UI include un `manifest.webmanifest` e un service worker, quindi i browser moderni possono installarla come PWA standalone. Web Push permette al Gateway di risvegliare la PWA installata con notifiche anche quando la scheda o la finestra del browser non sono aperte.

| Superficie                                            | Cosa fa                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. I browser offrono "Install app" una volta che è raggiungibile. |
| `ui/public/sw.js`                                     | Service worker che gestisce eventi `push` e clic sulle notifiche.  |
| `push/vapid-keys.json` (nella directory di stato OpenClaw) | Coppia di chiavi VAPID generata automaticamente usata per firmare i payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint di sottoscrizione del browser persistiti.                 |

Sovrascrivi la coppia di chiavi VAPID tramite variabili d'ambiente sul processo Gateway quando vuoi fissare le chiavi (per deployment multi-host, rotazione dei segreti o test):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predefinito `mailto:openclaw@localhost`)

La Control UI usa questi metodi Gateway protetti da scope per registrare e testare le sottoscrizioni browser:

- `push.web.vapidPublicKey` — recupera la chiave pubblica VAPID attiva.
- `push.web.subscribe` — registra un `endpoint` più `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — rimuove un endpoint registrato.
- `push.web.test` — invia una notifica di test alla sottoscrizione del chiamante.

Web Push è indipendente dal percorso relay APNS iOS
(vedi [Configurazione](/it/gateway/configuration) per il push con relay) e dal metodo `push.test` esistente, che puntano al pairing mobile nativo.

## Embed ospitati

I messaggi assistant possono renderizzare contenuto web ospitato inline con lo shortcode `[embed ...]`.
La policy sandbox dell'iframe è controllata da
`gateway.controlUi.embedSandbox`:

- `strict`: disabilita l'esecuzione di script negli embed ospitati
- `scripts`: consente embed interattivi mantenendo l'isolamento dell'origine; è il predefinito e di solito basta per giochi/widget browser autocontenuti
- `trusted`: aggiunge `allow-same-origin` sopra `allow-scripts` per documenti dello stesso sito che richiedono intenzionalmente privilegi maggiori

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

Usa `trusted` solo quando il documento incorporato ha davvero bisogno di comportamento same-origin. Per la maggior parte dei giochi generati dagli agenti e delle tele interattive, `scripts` è la scelta più sicura.

Gli URL embed esterni assoluti `http(s)` restano bloccati per impostazione predefinita. Se vuoi intenzionalmente che `[embed url="https://..."]` carichi pagine di terze parti, imposta `gateway.controlUi.allowExternalEmbedUrls: true`.

## Accesso Tailnet (consigliato)

### Tailscale Serve integrato (preferito)

Mantieni il Gateway su loopback e lascia che Tailscale Serve lo proxy con HTTPS:

```bash
openclaw gateway --tailscale serve
```

Apri:

- `https://<magicdns>/` (oppure il tuo `gateway.controlUi.basePath` configurato)

Per impostazione predefinita, le richieste Serve di Control UI/WebSocket possono autenticarsi tramite header di identità Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` è `true`. OpenClaw
verifica l'identità risolvendo l'indirizzo `x-forwarded-for` con
`tailscale whois` e confrontandolo con l'header, e accetta queste richieste solo quando raggiungono il loopback con gli header `x-forwarded-*` di Tailscale. Imposta
`gateway.auth.allowTailscale: false` se vuoi richiedere credenziali esplicite con segreto condiviso anche per il traffico Serve. Poi usa `gateway.auth.mode: "token"` o `"password"`.
Per quel percorso di identità Serve asincrono, i tentativi di autenticazione falliti per lo stesso IP client e lo stesso ambito auth vengono serializzati prima delle scritture di rate limit. I retry concorrenti non validi dallo stesso browser possono quindi mostrare `retry later` alla seconda richiesta invece di due semplici mismatch in gara parallela.
L'autenticazione Serve senza token presume che l'host gateway sia fidato. Se su quell'host può essere eseguito codice locale non fidato, richiedi autenticazione token/password.

### Bind su tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Poi apri:

- `http://<tailscale-ip>:18789/` (oppure il tuo `gateway.controlUi.basePath` configurato)

Incolla il segreto condiviso corrispondente nelle impostazioni della UI (inviato come
`connect.params.auth.token` o `connect.params.auth.password`).

## HTTP non sicuro

Se apri la dashboard su HTTP in chiaro (`http://<lan-ip>` o `http://<tailscale-ip>`),
il browser gira in un **contesto non sicuro** e blocca WebCrypto. Per impostazione predefinita,
OpenClaw **blocca** le connessioni della Control UI senza identità del dispositivo.

Eccezioni documentate:

- compatibilità HTTP non sicura solo localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticazione riuscita dell'operatore Control UI tramite `gateway.auth.mode: "trusted-proxy"`
- opzione di emergenza `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correzione consigliata:** usa HTTPS (Tailscale Serve) oppure apri la UI in locale:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sull'host gateway)

**Comportamento del toggle insecure-auth:**

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

- Permette alle sessioni Control UI localhost di procedere senza identità del dispositivo in contesti HTTP non sicuri.
- Non bypassa i controlli di pairing.
- Non allenta i requisiti di identità del dispositivo remoto (non localhost).

**Solo come opzione di emergenza:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` disabilita i controlli di identità del dispositivo della Control UI ed è un grave downgrade di sicurezza. Ripristinalo rapidamente dopo l'uso in emergenza.

Nota trusted-proxy:

- un'autenticazione trusted-proxy riuscita può ammettere sessioni Control UI **operatore** senza identità del dispositivo
- questo **non** si estende alle sessioni Control UI con ruolo node
- i reverse proxy loopback sullo stesso host continuano a non soddisfare l'autenticazione trusted-proxy; vedi [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth)

Vedi [Tailscale](/it/gateway/tailscale) per indicazioni sulla configurazione HTTPS.

## Content Security Policy

La Control UI distribuisce una policy `img-src` rigorosa: sono consentiti solo asset **same-origin**, URL `data:` e URL `blob:` generati localmente. Gli URL immagine remoti `http(s)` e protocol-relative vengono rifiutati dal browser e non generano fetch di rete.

Cosa significa in pratica:

- Avatar e immagini serviti tramite percorsi relativi (ad esempio `/avatars/<id>`) continuano a essere renderizzati, incluse le route avatar autenticate che la UI recupera e converte in URL `blob:` locali.
- Gli URL inline `data:image/...` continuano a essere renderizzati (utile per payload in-protocol).
- Gli URL `blob:` locali creati dalla Control UI continuano a essere renderizzati.
- Gli URL avatar remoti emessi dai metadati del canale vengono rimossi dagli helper avatar della Control UI e sostituiti con il logo/badge incorporato, così un canale compromesso o malevolo non può forzare fetch di immagini remote arbitrarie dal browser di un operatore.

Non devi cambiare nulla per ottenere questo comportamento — è sempre attivo e non configurabile.

## Autenticazione della route avatar

Quando l'autenticazione del gateway è configurata, l'endpoint avatar della Control UI richiede lo stesso token gateway del resto dell'API:

- `GET /avatar/<agentId>` restituisce l'immagine avatar solo ai chiamanti autenticati. `GET /avatar/<agentId>?meta=1` restituisce i metadati avatar con la stessa regola.
- Le richieste non autenticate a entrambe le route vengono rifiutate (come la route sibling assistant-media). Questo impedisce alla route avatar di esporre l'identità dell'agente su host altrimenti protetti.
- La Control UI stessa inoltra il token gateway come header bearer durante il recupero degli avatar e usa URL blob autenticati in modo che l'immagine continui a essere renderizzata nelle dashboard.

Se disabiliti l'autenticazione del gateway (sconsigliato su host condivisi), anche la route avatar diventa non autenticata, in linea con il resto del gateway.

## Build della UI

Il Gateway serve file statici da `dist/control-ui`. Costruiscili con:

```bash
pnpm ui:build
```

Base assoluta facoltativa (quando vuoi URL degli asset fissi):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Per lo sviluppo locale (server dev separato):

```bash
pnpm ui:dev
```

Poi punta la UI al tuo URL WS del Gateway (ad esempio `ws://127.0.0.1:18789`).

## Debug/testing: dev server + Gateway remoto

La Control UI è costituita da file statici; la destinazione WebSocket è configurabile e può essere diversa dall'origine HTTP. Questo è utile quando vuoi il server di sviluppo Vite in locale ma il Gateway gira altrove.

1. Avvia il server dev della UI: `pnpm ui:dev`
2. Apri un URL come:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticazione one-time facoltativa (se necessaria):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Note:

- `gatewayUrl` viene salvato in localStorage dopo il caricamento e rimosso dall'URL.
- `token` dovrebbe essere passato tramite il fragment dell'URL (`#token=...`) quando possibile. I fragment non vengono inviati al server, evitando così leak nei log delle richieste e nel Referer. I legacy query param `?token=` vengono ancora importati una volta per compatibilità, ma solo come fallback, e vengono rimossi subito dopo il bootstrap.
- `password` viene mantenuta solo in memoria.
- Quando `gatewayUrl` è impostato, la UI non usa credenziali di fallback da configurazione o ambiente.
  Fornisci esplicitamente `token` (o `password`). L'assenza di credenziali esplicite è un errore.
- Usa `wss://` quando il Gateway è dietro TLS (Tailscale Serve, proxy HTTPS, ecc.).
- `gatewayUrl` è accettato solo in una finestra top-level (non incorporata) per prevenire clickjacking.
- I deployment non-loopback della Control UI devono impostare esplicitamente `gateway.controlUi.allowedOrigins` (origini complete). Questo include configurazioni di sviluppo remoto.
- Non usare `gateway.controlUi.allowedOrigins: ["*"]` se non per test locali strettamente controllati. Significa consentire qualsiasi origine browser, non “corrispondi all'host che sto usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` abilita la modalità di fallback dell'origine tramite Host header, ma è una modalità di sicurezza pericolosa.

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

Dettagli sulla configurazione dell'accesso remoto: [Accesso remoto](/it/gateway/remote).

## Correlati

- [Dashboard](/it/web/dashboard) — dashboard del gateway
- [WebChat](/it/web/webchat) — interfaccia chat basata su browser
- [TUI](/it/web/tui) — interfaccia utente da terminale
- [Health check](/it/gateway/health) — monitoraggio dello stato di salute del gateway
