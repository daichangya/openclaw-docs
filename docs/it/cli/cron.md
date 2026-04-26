---
read_when:
    - Vuoi processi pianificati e riattivazioni
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire processi in background)
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:25:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gestisci i processi Cron per lo scheduler del Gateway.

Correlati:

- Processi Cron: [Processi Cron](/it/automation/cron-jobs)

Suggerimento: esegui `openclaw cron --help` per la superficie completa dei comandi.

Nota: `openclaw cron list` e `openclaw cron show <job-id>` mostrano in anteprima la route di consegna risolta. Per `channel: "last"`, l'anteprima mostra se la route è stata risolta dalla sessione principale/corrente o se verrà chiusa in fail closed.

Nota: i processi `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere l'output interno. `--deliver` rimane come alias deprecato di `--announce`.

Nota: la consegna chat Cron isolata è condivisa. `--announce` è la consegna di fallback del runner per la risposta finale; `--no-deliver` disabilita quel fallback ma non rimuove lo strumento `message` dell'agente quando è disponibile una route chat.

Nota: i processi one-shot (`--at`) vengono eliminati dopo il successo per impostazione predefinita. Usa `--keep-after-run` per mantenerli.

Nota: `--session` supporta `main`, `isolated`, `current` e `session:<id>`.
Usa `current` per associare la sessione attiva al momento della creazione, oppure `session:<id>` per una chiave di sessione persistente esplicita.

Nota: `--session isolated` crea un nuovo transcript/id sessione per ogni esecuzione.
Le preferenze sicure e le override esplicite di modello/auth selezionate dall'utente possono essere mantenute, ma il contesto conversazionale ambientale no: routing canale/gruppo, policy di invio/queue, elevazione, origine e binding runtime ACP vengono reimpostati per la nuova esecuzione isolata.

Nota: per i processi CLI one-shot, i datetime `--at` senza offset vengono trattati come UTC a meno che non passi anche `--tz <iana>`, che interpreta quell'ora locale nella timezone specificata.

Nota: i processi ricorrenti ora usano un backoff di retry esponenziale dopo errori consecutivi (30s → 1m → 5m → 15m → 60m), poi tornano alla pianificazione normale dopo l'esecuzione successiva riuscita.

Nota: `openclaw cron run` ora ritorna non appena l'esecuzione manuale viene messa in coda per l'esecuzione. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`; usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

Nota: `openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il vecchio comportamento "esegui solo se è il momento".

Nota: i turni Cron isolati sopprimono le risposte obsolete di solo acknowledgement. Se il primo risultato è solo un aggiornamento di stato intermedio e nessuna esecuzione discendente di sottoagente è responsabile della risposta finale, Cron ripropone una volta per il risultato reale prima della consegna.

Nota: se un'esecuzione Cron isolata restituisce solo il token silenzioso (`NO_REPLY` / `no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo in coda di fallback, quindi non viene pubblicato nulla nella chat.

Nota: `cron add|edit --model ...` usa quel modello consentito selezionato per il processo.
Se il modello non è consentito, Cron avvisa e ripiega invece sulla selezione del modello dell'agente/predefinita del processo. Le catene di fallback configurate continuano ad applicarsi, ma una semplice override di modello senza un elenco di fallback esplicito per processo non aggiunge più il primario dell'agente come target di retry extra nascosto.

Nota: la precedenza del modello Cron isolato è: prima override Gmail-hook, poi `--model` per processo, poi eventuale override di modello della sessione Cron memorizzata selezionata dall'utente, quindi la normale selezione agente/predefinita.

Nota: la modalità veloce Cron isolata segue la selezione del modello live risolta. La configurazione del modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode` della sessione memorizzata continua ad avere la precedenza sulla configurazione.

Nota: se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron persiste il provider/modello cambiato (e l'eventuale override del profilo auth cambiato quando presente) per l'esecuzione attiva prima di ritentare. Il ciclo di retry esterno è limitato a 2 retry di switch dopo il tentativo iniziale, poi interrompe invece di continuare all'infinito.

Nota: le notifiche di errore usano prima `delivery.failureDestination`, poi `cron.failureDestination` globale e infine ripiegano sul target announce primario del processo quando non è configurata alcuna destinazione di errore esplicita.

Nota: retention/pruning è controllato nella configurazione:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni completate delle esecuzioni isolate.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` eliminano `~/.openclaw/cron/runs/<jobId>.jsonl`.

Nota di aggiornamento: se hai processi Cron meno recenti precedenti all'attuale formato di consegna/store, esegui `openclaw doctor --fix`. Doctor ora normalizza i campi Cron legacy (`jobId`, `schedule.cron`,
campi di consegna di livello superiore inclusi i legacy `threadId`, alias di consegna `provider` nel payload) e migra i semplici processi di fallback Webhook `notify: true` verso una consegna Webhook esplicita quando `cron.webhook` è configurato.

## Modifiche comuni

Aggiorna le impostazioni di consegna senza cambiare il messaggio:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Disabilita la consegna per un processo isolato:

```bash
openclaw cron edit <job-id> --no-deliver
```

Abilita un contesto bootstrap leggero per un processo isolato:

```bash
openclaw cron edit <job-id> --light-context
```

Annuncia su un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crea un processo isolato con contesto bootstrap leggero:

```bash
openclaw cron add \
  --name "Brief mattutino leggero" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Riassumi gli aggiornamenti notturni." \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai processi turno-agente isolati. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto bootstrap invece di iniettare l'intero set bootstrap del workspace.

Nota sulla proprietà della consegna:

- La consegna chat Cron isolata è condivisa. L'agente può inviare direttamente con lo strumento `message` quando è disponibile una route chat.
- `announce` consegna in fallback la risposta finale solo quando l'agente non ha inviato direttamente al target risolto. `webhook` pubblica il payload completato a un URL. `none` disabilita la consegna di fallback del runner.
- I promemoria creati da una chat attiva conservano il target di consegna della chat live per la consegna announce di fallback. Le chiavi di sessione interne possono essere in minuscolo; non usarle come fonte di verità per ID provider case-sensitive come gli ID stanza Matrix.

## Comandi amministrativi comuni

Esecuzione manuale:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Le voci di `cron runs` includono diagnostica di consegna con il target Cron previsto, il target risolto, gli invii dello strumento message, l'uso del fallback e lo stato di consegna.

Reindirizzamento agente/sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Modifiche di consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Nota sulla consegna degli errori:

- `delivery.failureDestination` è supportato per i processi isolati.
- I processi della sessione principale possono usare `delivery.failureDestination` solo quando la modalità di consegna primaria è `webhook`.
- Se non imposti alcuna destinazione di errore e il processo annuncia già su un canale, le notifiche di errore riutilizzano lo stesso target announce.

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
