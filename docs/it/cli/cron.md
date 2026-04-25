---
read_when:
    - Vuoi attività pianificate e riattivazioni
    - Stai eseguendo il debug dell'esecuzione di Cron e dei log
summary: Riferimento CLI per `openclaw cron` (pianificare ed eseguire attività in background)
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gestisci i Cron jobs per il pianificatore del Gateway.

Correlati:

- Cron jobs: [Cron jobs](/it/automation/cron-jobs)

Suggerimento: esegui `openclaw cron --help` per la superficie completa dei comandi.

Nota: `openclaw cron list` e `openclaw cron show <job-id>` mostrano in anteprima il
percorso di consegna risolto. Per `channel: "last"`, l'anteprima mostra se il
percorso è stato risolto dalla sessione principale/corrente o se fallirà in modalità fail-closed.

Nota: i job `cron add` isolati usano per impostazione predefinita la consegna `--announce`. Usa `--no-deliver` per mantenere
l'output interno. `--deliver` resta disponibile come alias deprecato di `--announce`.

Nota: la consegna alla chat per i Cron job isolati è condivisa. `--announce` è la consegna
di fallback del runner per la risposta finale; `--no-deliver` disabilita quel fallback ma non
rimuove lo strumento `message` dell'agente quando è disponibile un percorso chat.

Nota: i job one-shot (`--at`) vengono eliminati dopo l'esecuzione riuscita per impostazione predefinita. Usa `--keep-after-run` per mantenerli.

Nota: `--session` supporta `main`, `isolated`, `current` e `session:<id>`.
Usa `current` per associarti alla sessione attiva al momento della creazione, oppure `session:<id>` per
una chiave di sessione persistente esplicita.

Nota: `--session isolated` crea un nuovo id transcript/sessione per ogni esecuzione.
Le preferenze sicure e gli override espliciti di modello/autenticazione selezionati dall'utente possono essere mantenuti, ma
il contesto conversazionale ambientale no: l'instradamento canale/gruppo, la policy di invio/coda,
l'elevazione, l'origine e il binding runtime ACP vengono reimpostati per la nuova esecuzione isolata.

Nota: per i job CLI one-shot, i datetime `--at` senza offset vengono trattati come UTC a meno che tu non passi anche
`--tz <iana>`, che interpreta quell'ora locale nel fuso orario indicato.

Nota: i job ricorrenti ora usano un backoff di retry esponenziale dopo errori consecutivi (30s → 1m → 5m → 15m → 60m), poi tornano alla pianificazione normale dopo l'esecuzione riuscita successiva.

Nota: `openclaw cron run` ora restituisce appena l'esecuzione manuale viene messa in coda. Le risposte riuscite includono `{ ok: true, enqueued: true, runId }`; usa `openclaw cron runs --id <job-id>` per seguire l'esito finale.

Nota: `openclaw cron run <job-id>` forza l'esecuzione per impostazione predefinita. Usa `--due` per mantenere il
vecchio comportamento "esegui solo se dovuto".

Nota: i turni Cron isolati sopprimono le risposte obsolete di solo riconoscimento. Se il
primo risultato è solo un aggiornamento di stato intermedio e nessuna esecuzione discendente di subagente è
responsabile della risposta finale, Cron riformula il prompt una volta per ottenere il risultato reale
prima della consegna.

Nota: se un'esecuzione Cron isolata restituisce solo il token silenzioso (`NO_REPLY` /
`no_reply`), Cron sopprime sia la consegna diretta in uscita sia il percorso di riepilogo
accodato di fallback, quindi non viene pubblicato nulla in chat.

Nota: `cron add|edit --model ...` usa per il job quel modello consentito selezionato.
Se il modello non è consentito, Cron avvisa e torna invece alla selezione del
modello dell'agente/predefinito del job. Le catene di fallback configurate continuano ad applicarsi, ma un semplice
override del modello senza un elenco di fallback esplicito per job non aggiunge più il
primario dell'agente come destinazione di retry extra nascosta.

Nota: la precedenza del modello Cron isolato è prima l'override Gmail-hook, poi `--model` per job,
poi qualsiasi override di modello della sessione Cron memorizzato selezionato dall'utente, quindi la
normale selezione agente/predefinita.

Nota: la modalità veloce Cron isolata segue la selezione del modello live risolta. La config del
modello `params.fastMode` si applica per impostazione predefinita, ma un override `fastMode`
della sessione memorizzata ha comunque la precedenza sulla config.

Nota: se un'esecuzione isolata genera `LiveSessionModelSwitchError`, Cron persiste il
provider/modello cambiato (e l'override del profilo auth cambiato quando presente) per
l'esecuzione attiva prima di ritentare. Il ciclo di retry esterno è limitato a 2 retry di cambio
dopo il tentativo iniziale, poi interrompe invece di continuare all'infinito.

Nota: le notifiche di errore usano prima `delivery.failureDestination`, poi
`cron.failureDestination` globale e infine fanno fallback alla destinazione primaria
di announce del job quando non è configurata alcuna destinazione di errore esplicita.

Nota: retention/pruning è controllato nella config:

- `cron.sessionRetention` (predefinito `24h`) elimina le sessioni completate delle esecuzioni isolate.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` eliminano `~/.openclaw/cron/runs/<jobId>.jsonl`.

Nota di aggiornamento: se hai vecchi Cron job precedenti all'attuale formato di consegna/store, esegui
`openclaw doctor --fix`. Doctor ora normalizza i campi Cron legacy (`jobId`, `schedule.cron`,
campi di consegna top-level inclusi i legacy `threadId`, alias di consegna `provider` del payload) e migra i semplici
job di fallback webhook `notify: true` alla consegna webhook esplicita quando `cron.webhook` è
configurato.

## Modifiche comuni

Aggiorna le impostazioni di consegna senza cambiare il messaggio:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Disabilita la consegna per un job isolato:

```bash
openclaw cron edit <job-id> --no-deliver
```

Abilita un contesto bootstrap leggero per un job isolato:

```bash
openclaw cron edit <job-id> --light-context
```

Annuncia su un canale specifico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crea un job isolato con contesto bootstrap leggero:

```bash
openclaw cron add \
  --name "Briefing mattutino leggero" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Riassumi gli aggiornamenti della notte." \
  --light-context \
  --no-deliver
```

`--light-context` si applica solo ai job turn-based isolati dell'agente. Per le esecuzioni Cron, la modalità leggera mantiene vuoto il contesto bootstrap invece di iniettare l'intero set bootstrap dello spazio di lavoro.

Nota sulla proprietà della consegna:

- La consegna alla chat per i Cron job isolati è condivisa. L'agente può inviare direttamente con lo
  strumento `message` quando è disponibile un percorso chat.
- `announce` consegna in fallback la risposta finale solo quando l'agente non ha inviato
  direttamente alla destinazione risolta. `webhook` pubblica il payload completato a un URL.
  `none` disabilita la consegna di fallback del runner.

## Comandi amministrativi comuni

Esecuzione manuale:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Le voci di `cron runs` includono diagnostica di consegna con la destinazione Cron prevista,
la destinazione risolta, gli invii con lo strumento message, l'uso del fallback e lo stato di consegna.

Reindirizzamento agente/sessione:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Modifiche alla consegna:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Nota sulla consegna degli errori:

- `delivery.failureDestination` è supportato per i job isolati.
- I job della sessione principale possono usare `delivery.failureDestination` solo quando la
  modalità di consegna primaria è `webhook`.
- Se non imposti alcuna destinazione di errore e il job già annuncia su un
  canale, le notifiche di errore riusano la stessa destinazione di announce.

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività pianificate](/it/automation/cron-jobs)
