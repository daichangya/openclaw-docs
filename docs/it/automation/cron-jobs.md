---
read_when:
    - Pianificazione di processi in background o riattivazioni
    - Collegamento di trigger esterni (Webhook, Gmail) a OpenClaw
    - Decidere tra Heartbeat e Cron per le attività pianificate
summary: Processi pianificati, Webhook e trigger Gmail PubSub per lo scheduler Gateway
title: Attività pianificate
x-i18n:
    generated_at: "2026-04-25T13:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron è lo scheduler integrato del Gateway. Mantiene persistenti i processi, riattiva l'agente al momento giusto e può recapitare l'output a un canale chat o a un endpoint Webhook.

## Avvio rapido

```bash
# Aggiungi un promemoria one-shot
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Controlla i tuoi processi
openclaw cron list
openclaw cron show <job-id>

# Visualizza la cronologia delle esecuzioni
openclaw cron runs --id <job-id>
```

## Come funziona cron

- Cron viene eseguito **all'interno del processo Gateway** (non all'interno del modello).
- Le definizioni dei processi vengono mantenute persistenti in `~/.openclaw/cron/jobs.json`, quindi i riavvii non fanno perdere le pianificazioni.
- Lo stato di esecuzione runtime viene mantenuto persistente accanto, in `~/.openclaw/cron/jobs-state.json`. Se tieni traccia delle definizioni cron in git, traccia `jobs.json` e aggiungi `jobs-state.json` a gitignore.
- Dopo la suddivisione, le versioni più vecchie di OpenClaw possono leggere `jobs.json` ma potrebbero trattare i processi come nuovi, perché i campi runtime ora si trovano in `jobs-state.json`.
- Tutte le esecuzioni cron creano record di [attività in background](/it/automation/tasks).
- I processi one-shot (`--at`) vengono eliminati automaticamente dopo il successo per impostazione predefinita.
- Le esecuzioni cron isolate chiudono, al meglio delle possibilità, schede/processi del browser tracciati per la loro sessione `cron:<jobId>` al completamento dell'esecuzione, così l'automazione del browser scollegata non lascia processi orfani.
- Le esecuzioni cron isolate proteggono anche dalle risposte di conferma obsolete. Se il
  primo risultato è solo un aggiornamento di stato intermedio (`on it`, `pulling everything
together` e suggerimenti simili) e nessuna esecuzione discendente di subagente è ancora
  responsabile della risposta finale, OpenClaw ripropone una volta il prompt per ottenere il risultato
  effettivo prima della consegna.

<a id="maintenance"></a>

La riconciliazione delle attività per cron è di proprietà del runtime: un'attività cron attiva rimane attiva mentre il
runtime cron continua a tracciare quel processo come in esecuzione, anche se esiste ancora una vecchia riga di sessione figlia.
Quando il runtime smette di possedere il processo e scade la finestra di tolleranza di 5 minuti, la manutenzione può
contrassegnare l'attività come `lost`.

## Tipi di pianificazione

| Tipo    | Flag CLI  | Descrizione                                                  |
| ------- | --------- | ------------------------------------------------------------ |
| `at`    | `--at`    | Timestamp one-shot (ISO 8601 o relativo come `20m`)          |
| `every` | `--every` | Intervallo fisso                                             |
| `cron`  | `--cron`  | Espressione cron a 5 o 6 campi con `--tz` facoltativo        |

I timestamp senza fuso orario vengono trattati come UTC. Aggiungi `--tz America/New_York` per una pianificazione basata sull'orario locale.

Le espressioni ricorrenti allo scoccare dell'ora vengono automaticamente sfalsate fino a 5 minuti per ridurre i picchi di carico. Usa `--exact` per imporre una temporizzazione precisa oppure `--stagger 30s` per una finestra esplicita.

### Giorno del mese e giorno della settimana usano la logica OR

Le espressioni cron vengono analizzate da [croner](https://github.com/Hexagon/croner). Quando sia i campi giorno del mese sia giorno della settimana non sono wildcard, croner trova una corrispondenza quando **uno dei due** campi corrisponde, non entrambi. Questo è il comportamento standard di Vixie cron.

```
# Previsto: "9:00 del 15, solo se è lunedì"
# Reale:    "9:00 di ogni 15, E 9:00 di ogni lunedì"
0 9 15 * 1
```

Questo viene eseguito ~5–6 volte al mese invece di 0–1 volte al mese. OpenClaw usa qui il comportamento OR predefinito di Croner. Per richiedere entrambe le condizioni, usa il modificatore giorno-della-settimana `+` di Croner (`0 9 15 * +1`) oppure pianifica su un solo campo e controlla l'altro nel prompt o nel comando del tuo processo.

## Stili di esecuzione

| Stile           | valore `--session`   | Viene eseguito in         | Ideale per                      |
| --------------- | -------------------- | ------------------------- | ------------------------------- |
| Sessione principale | `main`           | Turno Heartbeat successivo | Promemoria, eventi di sistema   |
| Isolata         | `isolated`           | `cron:<jobId>` dedicato   | Report, attività in background  |
| Sessione corrente | `current`          | Vincolata al momento della creazione | Lavoro ricorrente sensibile al contesto |
| Sessione personalizzata | `session:custom-id` | Sessione nominata persistente | Workflow che si basano sulla cronologia |

I processi della **sessione principale** accodano un evento di sistema e facoltativamente riattivano Heartbeat (`--wake now` o `--wake next-heartbeat`). I processi **isolati** eseguono un turno agente dedicato con una sessione nuova. Le **sessioni personalizzate** (`session:xxx`) mantengono il contesto tra le esecuzioni, consentendo workflow come standup giornalieri che si basano su riepiloghi precedenti.

Per i processi isolati, “sessione nuova” significa un nuovo transcript/id di sessione per ogni esecuzione. OpenClaw può mantenere preferenze sicure come impostazioni thinking/fast/verbose, etichette e override espliciti di modello/autenticazione selezionati dall'utente, ma non eredita il contesto conversazionale ambientale da una riga cron più vecchia: instradamento canale/gruppo, criterio di invio o accodamento, elevazione, origine o binding runtime ACP. Usa `current` o `session:<id>` quando un processo ricorrente deve deliberatamente basarsi sullo stesso contesto conversazionale.

Per i processi isolati, lo smantellamento runtime ora include la pulizia del browser al meglio delle possibilità per quella sessione cron. Gli errori di pulizia vengono ignorati in modo che il risultato cron effettivo abbia comunque la precedenza.

Le esecuzioni cron isolate eliminano anche tutte le istanze runtime MCP integrate create per il processo tramite il percorso condiviso di pulizia del runtime. Questo corrisponde al modo in cui i client MCP delle sessioni principali e delle sessioni personalizzate vengono chiusi, così i processi cron isolati non perdono processi figlio stdio o connessioni MCP di lunga durata tra un'esecuzione e l'altra.

Quando le esecuzioni cron isolate orchestrano subagenti, la consegna privilegia anche l'output finale
discendente rispetto al testo intermedio obsoleto del genitore. Se i discendenti sono ancora in
esecuzione, OpenClaw sopprime quell'aggiornamento parziale del genitore invece di annunciarlo.

Per le destinazioni di annuncio Discord solo testo, OpenClaw invia il testo canonico finale
dell'assistente una sola volta invece di riprodurre sia i payload di testo in streaming/intermedi
sia la risposta finale. I payload media e strutturati di Discord vengono comunque consegnati
separatamente, così allegati e componenti non vanno persi.

### Opzioni di payload per i processi isolati

- `--message`: testo del prompt (obbligatorio per gli isolati)
- `--model` / `--thinking`: override di modello e livello di thinking
- `--light-context`: salta l'iniezione del file bootstrap dello spazio di lavoro
- `--tools exec,read`: limita quali strumenti il processo può usare

`--model` usa il modello consentito selezionato per quel processo. Se il modello richiesto
non è consentito, cron registra un avviso e torna invece alla selezione del modello
agente/predefinito del processo. Le catene di fallback configurate continuano ad applicarsi, ma un semplice
override del modello senza un elenco esplicito di fallback per processo non aggiunge più il modello
primario dell'agente come destinazione di nuovo tentativo extra nascosta.

L'ordine di precedenza della selezione del modello per i processi isolati è:

1. Override del modello del hook Gmail (quando l'esecuzione proviene da Gmail e quell'override è consentito)
2. `model` del payload per processo
3. Override del modello della sessione cron memorizzata selezionato dall'utente
4. Selezione del modello agente/predefinito

Anche la modalità fast segue la selezione live risolta. Se la configurazione del modello selezionato
ha `params.fastMode`, cron isolato la usa per impostazione predefinita. Un override `fastMode` della sessione
memorizzata continua comunque ad avere la precedenza rispetto alla configurazione in entrambe le direzioni.

Se un'esecuzione isolata incontra un handoff live di cambio modello, cron ritenta con il
provider/modello cambiato e mantiene persistente quella selezione live per l'esecuzione attiva
prima di ritentare. Quando il cambio comporta anche un nuovo profilo di autenticazione, cron mantiene
persistente anche quell'override del profilo di autenticazione per l'esecuzione attiva. I nuovi tentativi sono limitati:
dopo il tentativo iniziale più 2 nuovi tentativi di cambio, cron interrompe invece di continuare in loop
all'infinito.

## Consegna e output

| Modalità   | Cosa succede                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Consegna in fallback il testo finale alla destinazione se l'agente non lo ha inviato |
| `webhook`  | Esegue un POST del payload dell'evento completato a un URL          |
| `none`     | Nessuna consegna in fallback del runner                             |

Usa `--announce --channel telegram --to "-1001234567890"` per la consegna al canale. Per i topic del forum Telegram, usa `-1001234567890:topic:123`. Le destinazioni Slack/Discord/Mattermost devono usare prefissi espliciti (`channel:<id>`, `user:<id>`).

Per i processi isolati, la consegna chat è condivisa. Se è disponibile un
percorso chat, l'agente può usare lo strumento `message` anche quando il processo usa `--no-deliver`. Se l'
agente invia alla destinazione configurata/corrente, OpenClaw salta l'annuncio di fallback.
Altrimenti `announce`, `webhook` e `none` controllano solo ciò che il
runner fa con la risposta finale dopo il turno agente.

Le notifiche di errore seguono un percorso di destinazione separato:

- `cron.failureDestination` imposta un valore predefinito globale per le notifiche di errore.
- `job.delivery.failureDestination` lo sovrascrive per singolo processo.
- Se nessuno dei due è impostato e il processo consegna già tramite `announce`, le notifiche di errore ora usano come fallback quella destinazione di annuncio primaria.
- `delivery.failureDestination` è supportato solo nei processi `sessionTarget="isolated"` a meno che la modalità di consegna primaria non sia `webhook`.

## Esempi CLI

Promemoria one-shot (sessione principale):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Processo isolato ricorrente con consegna:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Processo isolato con override di modello e thinking:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook

Gateway può esporre endpoint Webhook HTTP per trigger esterni. Abilitali nella configurazione:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autenticazione

Ogni richiesta deve includere il token del hook tramite header:

- `Authorization: Bearer <token>` (consigliato)
- `x-openclaw-token: <token>`

I token nella query string vengono rifiutati.

### POST /hooks/wake

Accoda un evento di sistema per la sessione principale:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (obbligatorio): descrizione dell'evento
- `mode` (facoltativo): `now` (predefinito) o `next-heartbeat`

### POST /hooks/agent

Esegue un turno agente isolato:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Campi: `message` (obbligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hook mappati (POST /hooks/\<name\>)

I nomi dei hook personalizzati vengono risolti tramite `hooks.mappings` nella configurazione. Le mappature possono trasformare payload arbitrari in azioni `wake` o `agent` con template o trasformazioni tramite codice.

### Sicurezza

- Tieni gli endpoint hook dietro loopback, tailnet o un reverse proxy affidabile.
- Usa un token hook dedicato; non riutilizzare i token di autenticazione Gateway.
- Mantieni `hooks.path` su un sottopercorso dedicato; `/` viene rifiutato.
- Imposta `hooks.allowedAgentIds` per limitare il routing esplicito `agentId`.
- Mantieni `hooks.allowRequestSessionKey=false` a meno che tu non richieda sessioni selezionate dal chiamante.
- Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per vincolare le forme consentite delle chiavi di sessione.
- I payload dei hook vengono racchiusi in confini di sicurezza per impostazione predefinita.

## Integrazione Gmail PubSub

Collega i trigger della posta in arrivo Gmail a OpenClaw tramite Google PubSub.

**Prerequisiti**: CLI `gcloud`, `gog` (gogcli), hook OpenClaw abilitati, Tailscale per l'endpoint HTTPS pubblico.

### Configurazione guidata (consigliata)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Questo scrive la configurazione `hooks.gmail`, abilita il preset Gmail e usa Tailscale Funnel per l'endpoint push.

### Avvio automatico del Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` è impostato, il Gateway avvia `gog gmail watch serve` all'avvio e rinnova automaticamente il watch. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disattivarlo.

### Configurazione manuale una tantum

1. Seleziona il progetto GCP che possiede il client OAuth usato da `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Crea il topic e concedi a Gmail l'accesso push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Avvia il watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Override del modello Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Gestione dei processi

```bash
# Elenca tutti i processi
openclaw cron list

# Mostra un processo, inclusa la route di consegna risolta
openclaw cron show <jobId>

# Modifica un processo
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Forza l'esecuzione immediata di un processo
openclaw cron run <jobId>

# Esegui solo se è in scadenza
openclaw cron run <jobId> --due

# Visualizza la cronologia delle esecuzioni
openclaw cron runs --id <jobId> --limit 50

# Elimina un processo
openclaw cron remove <jobId>

# Selezione dell'agente (configurazioni multi-agente)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Nota sull'override del modello:

- `openclaw cron add|edit --model ...` modifica il modello selezionato del processo.
- Se il modello è consentito, quel provider/modello esatto raggiunge l'esecuzione
  dell'agente isolato.
- Se non è consentito, cron emette un avviso e torna alla selezione del modello
  agente/predefinito del processo.
- Le catene di fallback configurate continuano ad applicarsi, ma un semplice override `--model` con
  nessun elenco esplicito di fallback per processo non passa più al modello
  primario dell'agente come destinazione di nuovo tentativo extra silenziosa.

## Configurazione

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Il file sidecar dello stato runtime deriva da `cron.store`: uno store `.json` come
`~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mentre un percorso store
senza suffisso `.json` aggiunge `-state.json`.

Disabilita cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

**Nuovo tentativo one-shot**: gli errori transitori (rate limit, overload, rete, errore server) ritentano fino a 3 volte con backoff esponenziale. Gli errori permanenti vengono disabilitati immediatamente.

**Nuovo tentativo ricorrente**: backoff esponenziale (da 30s a 60m) tra i nuovi tentativi. Il backoff si azzera dopo l'esecuzione successiva andata a buon fine.

**Manutenzione**: `cron.sessionRetention` (predefinito `24h`) elimina le voci di sessione di esecuzione isolate. `cron.runLog.maxBytes` / `cron.runLog.keepLines` eliminano automaticamente i file di log delle esecuzioni.

## Risoluzione dei problemi

### Sequenza di comandi

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron non si attiva

- Controlla `cron.enabled` e la variabile d'ambiente `OPENCLAW_SKIP_CRON`.
- Conferma che il Gateway sia in esecuzione continua.
- Per le pianificazioni `cron`, verifica il fuso orario (`--tz`) rispetto al fuso orario dell'host.
- `reason: not-due` nell'output di esecuzione significa che l'esecuzione manuale è stata verificata con `openclaw cron run <jobId> --due` e il processo non era ancora in scadenza.

### Cron si è attivato ma non c'è stata consegna

- La modalità di consegna `none` significa che non è prevista alcuna consegna di fallback del runner. L'agente può
  comunque inviare direttamente con lo strumento `message` quando è disponibile una route chat.
- Destinazione di consegna mancante/non valida (`channel`/`to`) significa che l'invio in uscita è stato saltato.
- Gli errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che la consegna è stata bloccata dalle credenziali.
- Se l'esecuzione isolata restituisce solo il token silenzioso (`NO_REPLY` / `no_reply`),
  OpenClaw sopprime la consegna diretta in uscita e sopprime anche il percorso
  di riepilogo in coda di fallback, quindi non viene pubblicato nulla nella chat.
- Se l'agente deve inviare un messaggio all'utente direttamente, verifica che il processo abbia una
  route utilizzabile (`channel: "last"` con una chat precedente, oppure un canale/destinazione espliciti).

### Problemi comuni con i fusi orari

- Cron senza `--tz` usa il fuso orario dell'host Gateway.
- Le pianificazioni `at` senza fuso orario vengono trattate come UTC.
- `activeHours` di Heartbeat usa la risoluzione del fuso orario configurata.

## Correlati

- [Automazione e attività](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — registro delle attività per le esecuzioni cron
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [Fuso orario](/it/concepts/timezone) — configurazione del fuso orario
