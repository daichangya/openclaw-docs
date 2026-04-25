---
read_when:
    - Vuoi una guida per principianti alla TUI
    - Hai bisogno dell'elenco completo delle funzionalità, dei comandi e delle scorciatoie della TUI
summary: 'Interfaccia terminale (TUI): connettersi al Gateway o eseguire localmente in modalità incorporata'
title: TUI
x-i18n:
    generated_at: "2026-04-25T14:00:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## Avvio rapido

### Modalità Gateway

1. Avvia il Gateway.

```bash
openclaw gateway
```

2. Apri la TUI.

```bash
openclaw tui
```

3. Scrivi un messaggio e premi Invio.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Usa `--password` se il tuo Gateway usa autenticazione con password.

### Modalità locale

Esegui la TUI senza Gateway:

```bash
openclaw chat
# oppure
openclaw tui --local
```

Note:

- `openclaw chat` e `openclaw terminal` sono alias per `openclaw tui --local`.
- `--local` non può essere combinato con `--url`, `--token` o `--password`.
- La modalità locale usa direttamente il runtime dell'agente incorporato. La maggior parte degli strumenti locali funziona, ma le funzionalità solo-Gateway non sono disponibili.
- Anche `openclaw` e `openclaw crestodian` usano questa shell TUI, con Crestodian come backend di chat locale per setup e riparazione.

## Cosa vedi

- Intestazione: URL di connessione, agente corrente, sessione corrente.
- Log chat: messaggi utente, risposte dell'assistente, avvisi di sistema, card degli strumenti.
- Riga di stato: stato di connessione/esecuzione (connecting, running, streaming, idle, error).
- Footer: stato della connessione + agente + sessione + modello + think/fast/verbose/trace/reasoning + conteggi token + deliver.
- Input: editor di testo con autocomplete.

## Modello mentale: agenti + sessioni

- Gli agenti sono slug univoci (es. `main`, `research`). Il Gateway espone l'elenco.
- Le sessioni appartengono all'agente corrente.
- Le chiavi di sessione sono memorizzate come `agent:<agentId>:<sessionKey>`.
  - Se scrivi `/session main`, la TUI lo espande in `agent:<currentAgent>:main`.
  - Se scrivi `/session agent:other:main`, passi esplicitamente a quella sessione agente.
- Ambito della sessione:
  - `per-sender` (predefinito): ogni agente ha molte sessioni.
  - `global`: la TUI usa sempre la sessione `global` (il selettore potrebbe essere vuoto).
- L'agente corrente + la sessione sono sempre visibili nel footer.

## Invio + consegna

- I messaggi vengono inviati al Gateway; la consegna ai provider è disattivata per impostazione predefinita.
- Attiva la consegna:
  - `/deliver on`
  - oppure dal pannello Settings
  - oppure avvia con `openclaw tui --deliver`

## Selettori + overlay

- Selettore modello: elenca i modelli disponibili e imposta l'override di sessione.
- Selettore agente: scegli un agente diverso.
- Selettore sessione: mostra solo le sessioni dell'agente corrente.
- Settings: attiva/disattiva deliver, espansione dell'output degli strumenti e visibilità del thinking.

## Scorciatoie da tastiera

- Invio: invia messaggio
- Esc: interrompe l'esecuzione attiva
- Ctrl+C: cancella l'input (premi due volte per uscire)
- Ctrl+D: esci
- Ctrl+L: selettore modello
- Ctrl+G: selettore agente
- Ctrl+P: selettore sessione
- Ctrl+O: attiva/disattiva l'espansione dell'output degli strumenti
- Ctrl+T: attiva/disattiva la visibilità del thinking (ricarica la cronologia)

## Comandi slash

Core:

- `/help`
- `/status`
- `/agent <id>` (oppure `/agents`)
- `/session <key>` (oppure `/sessions`)
- `/model <provider/model>` (oppure `/models`)

Controlli di sessione:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Ciclo di vita della sessione:

- `/new` oppure `/reset` (reimposta la sessione)
- `/abort` (interrompe l'esecuzione attiva)
- `/settings`
- `/exit`

Solo modalità locale:

- `/auth [provider]` apre il flusso di autenticazione/accesso del provider dentro la TUI.

Gli altri comandi slash del Gateway (per esempio `/context`) vengono inoltrati al Gateway e mostrati come output di sistema. Vedi [Slash commands](/it/tools/slash-commands).

## Comandi shell locali

- Anteponi `!` a una riga per eseguire un comando shell locale sull'host della TUI.
- La TUI chiede una volta per sessione di consentire l'esecuzione locale; se rifiuti, `!` resta disabilitato per la sessione.
- I comandi vengono eseguiti in una shell fresca e non interattiva nella directory di lavoro della TUI (nessun `cd`/env persistente).
- I comandi shell locali ricevono `OPENCLAW_SHELL=tui-local` nel loro ambiente.
- Un `!` da solo viene inviato come messaggio normale; gli spazi iniziali non attivano exec locale.

## Riparare configurazioni dalla TUI locale

Usa la modalità locale quando la configurazione corrente è già valida e vuoi che l'agente
incorporato la ispezioni sulla stessa macchina, la confronti con la documentazione
e ti aiuti a riparare derive senza dipendere da un Gateway in esecuzione.

Se `openclaw config validate` sta già fallendo, inizia con `openclaw configure`
oppure `openclaw doctor --fix`. `openclaw chat` non aggira il guard
di configurazione non valida.

Loop tipico:

1. Avvia la modalità locale:

```bash
openclaw chat
```

2. Chiedi all'agente cosa vuoi controllare, per esempio:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Usa i comandi shell locali per prove esatte e validazione:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Applica modifiche limitate con `openclaw config set` o `openclaw configure`, poi riesegui `!openclaw config validate`.
5. Se Doctor consiglia una migrazione o riparazione automatica, rivedila ed esegui `!openclaw doctor --fix`.

Suggerimenti:

- Preferisci `openclaw config set` o `openclaw configure` alla modifica manuale di `openclaw.json`.
- `openclaw docs "<query>"` cerca l'indice della documentazione live dalla stessa macchina.
- `openclaw config validate --json` è utile quando vuoi errori strutturati di schema e SecretRef/risolvibilità.

## Output degli strumenti

- Le chiamate agli strumenti vengono mostrate come card con argomenti + risultati.
- Ctrl+O alterna tra vista compressa/espansa.
- Mentre gli strumenti vengono eseguiti, gli aggiornamenti parziali confluiscono nella stessa card.

## Colori del terminale

- La TUI mantiene il testo del corpo dell'assistente nel foreground predefinito del tuo terminale così i terminali scuri e chiari restano entrambi leggibili.
- Se il tuo terminale usa uno sfondo chiaro e il rilevamento automatico è errato, imposta `OPENCLAW_THEME=light` prima di avviare `openclaw tui`.
- Per forzare invece la palette scura originale, imposta `OPENCLAW_THEME=dark`.

## Cronologia + streaming

- Alla connessione, la TUI carica la cronologia più recente (predefinito 200 messaggi).
- Le risposte in streaming si aggiornano sul posto fino alla finalizzazione.
- La TUI ascolta anche gli eventi degli strumenti dell'agente per card degli strumenti più ricche.

## Dettagli di connessione

- La TUI si registra presso il Gateway come `mode: "tui"`.
- Le riconnessioni mostrano un messaggio di sistema; gli intervalli mancanti negli eventi vengono mostrati nel log.

## Opzioni

- `--local`: Esegui contro il runtime locale dell'agente incorporato
- `--url <url>`: URL WebSocket del Gateway (predefinito dalla configurazione o `ws://127.0.0.1:<port>`)
- `--token <token>`: token del Gateway (se richiesto)
- `--password <password>`: password del Gateway (se richiesta)
- `--session <key>`: chiave di sessione (predefinito: `main`, oppure `global` quando l'ambito è globale)
- `--deliver`: Consegna le risposte dell'assistente al provider (predefinito off)
- `--thinking <level>`: Override del livello di thinking per gli invii
- `--message <text>`: Invia un messaggio iniziale dopo la connessione
- `--timeout-ms <ms>`: timeout dell'agente in ms (predefinito da `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: voci di cronologia da caricare (predefinito `200`)

Nota: quando imposti `--url`, la TUI non usa come fallback le credenziali della configurazione o dell'ambiente.
Passa `--token` o `--password` esplicitamente. L'assenza di credenziali esplicite è un errore.
In modalità locale, non passare `--url`, `--token` o `--password`.

## Risoluzione dei problemi

Nessun output dopo l'invio di un messaggio:

- Esegui `/status` nella TUI per confermare che il Gateway sia connesso e idle/busy.
- Controlla i log del Gateway: `openclaw logs --follow`.
- Conferma che l'agente possa essere eseguito: `openclaw status` e `openclaw models status`.
- Se ti aspetti messaggi in un canale chat, abilita la consegna (`/deliver on` o `--deliver`).

## Risoluzione dei problemi di connessione

- `disconnected`: assicurati che il Gateway sia in esecuzione e che `--url/--token/--password` siano corretti.
- Nessun agente nel selettore: controlla `openclaw agents list` e la tua configurazione di instradamento.
- Selettore sessione vuoto: potresti essere in ambito globale o non avere ancora sessioni.

## Correlati

- [Control UI](/it/web/control-ui) — interfaccia di controllo basata sul web
- [Config](/it/cli/config) — ispeziona, valida e modifica `openclaw.json`
- [Doctor](/it/cli/doctor) — controlli guidati di riparazione e migrazione
- [CLI Reference](/it/cli) — riferimento completo dei comandi CLI
