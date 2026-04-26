---
read_when:
    - Esegui openclaw senza comandi e vuoi capire Crestodian
    - Ti serve un modo sicuro senza configurazione per ispezionare o riparare OpenClaw
    - Stai progettando o abilitando la modalità di recupero del canale messaggi
summary: Riferimento CLI e modello di sicurezza per Crestodian, l'assistente di configurazione e riparazione sicuro senza configurazione
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian è l'assistente locale di OpenClaw per configurazione iniziale, riparazione e configurazione. È progettato per restare raggiungibile quando il normale percorso dell'agente è guasto.

Eseguire `openclaw` senza comandi avvia Crestodian in un terminale interattivo.
Eseguire `openclaw crestodian` avvia esplicitamente lo stesso assistente.

## Cosa mostra Crestodian

All'avvio, Crestodian interattivo apre la stessa shell TUI usata da
`openclaw tui`, con un backend chat Crestodian. Il log della chat inizia con un breve
messaggio di benvenuto:

- quando avviare Crestodian
- il modello o il percorso del planner deterministico che Crestodian sta effettivamente usando
- la validità della configurazione e l'agente predefinito
- la raggiungibilità del Gateway dalla prima sonda di avvio
- la prossima azione di debug che Crestodian può eseguire

Non scarica segreti né carica comandi CLI dei Plugin solo per avviarsi. La TUI
fornisce comunque la normale intestazione, il log della chat, la riga di stato, il piè di pagina, l'autocompletamento
e i controlli dell'editor.

Usa `status` per l'inventario dettagliato con percorso della configurazione, percorsi docs/source,
sonde CLI locali, presenza delle chiavi API, agenti, modello e dettagli del Gateway.

Crestodian usa la stessa individuazione dei riferimenti OpenClaw dei normali agenti. In un checkout Git,
punta a `docs/` locale e all'albero sorgente locale. In un'installazione di pacchetto npm,
usa la documentazione inclusa nel pacchetto e collega a
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con indicazioni esplicite
a esaminare il sorgente ogni volta che la documentazione non è sufficiente.

## Esempi

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

All'interno della TUI Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Avvio sicuro

Il percorso di avvio di Crestodian è volutamente ridotto. Può funzionare quando:

- `openclaw.json` manca
- `openclaw.json` non è valido
- il Gateway è inattivo
- la registrazione dei comandi Plugin non è disponibile
- non è stato ancora configurato alcun agente

`openclaw --help` e `openclaw --version` usano comunque i normali percorsi rapidi.
`openclaw` non interattivo esce con un breve messaggio invece di stampare l'help root,
perché il prodotto senza comando è Crestodian.

## Operazioni e approvazione

Crestodian usa operazioni tipizzate invece di modificare la configurazione in modo ad hoc.

Le operazioni di sola lettura possono essere eseguite immediatamente:

- mostrare la panoramica
- elencare gli agenti
- mostrare lo stato di modello/backend
- eseguire controlli di stato o integrità
- verificare la raggiungibilità del Gateway
- eseguire doctor senza correzioni interattive
- validare la configurazione
- mostrare il percorso del log di audit

Le operazioni persistenti richiedono l'approvazione conversazionale in modalità interattiva, a meno
che non venga passato `--yes` per un comando diretto:

- scrivere la configurazione
- eseguire `config set`
- impostare valori SecretRef supportati tramite `config set-ref`
- eseguire il bootstrap di configurazione iniziale/onboarding
- cambiare il modello predefinito
- avviare, arrestare o riavviare il Gateway
- creare agenti
- eseguire riparazioni doctor che riscrivono configurazione o stato

Le scritture applicate vengono registrate in:

```text
~/.openclaw/audit/crestodian.jsonl
```

L'individuazione non viene sottoposta ad audit. Solo le operazioni applicate e le scritture vengono registrate.

`openclaw onboard --modern` avvia Crestodian come anteprima del moderno onboarding.
Il semplice `openclaw onboard` esegue ancora l'onboarding classico.

## Bootstrap di configurazione

`setup` è il bootstrap di onboarding chat-first. Scrive solo tramite operazioni
di configurazione tipizzate e chiede prima l'approvazione.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Quando nessun modello è configurato, setup seleziona il primo backend utilizzabile in questo
ordine e ti dice cosa ha scelto:

- modello esplicito esistente, se già configurato
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Se nessuno è disponibile, setup scrive comunque il workspace predefinito e lascia il
modello non impostato. Installa o accedi a Codex/Claude Code, oppure esponi
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, poi esegui di nuovo setup.

## Planner assistito dal modello

Crestodian si avvia sempre in modalità deterministica. Per i comandi fuzzy che il
parser deterministico non comprende, Crestodian locale può eseguire un turno di planner limitato
attraverso i normali percorsi runtime di OpenClaw. Prima usa il
modello OpenClaw configurato. Se nessun modello configurato è ancora utilizzabile,
può usare come fallback runtime locali già presenti sulla macchina:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness app-server Codex: `openai/gpt-5.5` con `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Il planner assistito dal modello non può modificare direttamente la configurazione. Deve tradurre la
richiesta in uno dei comandi tipizzati di Crestodian, quindi si applicano le normali regole di
approvazione e audit. Crestodian stampa il modello usato e il comando interpretato prima
di eseguire qualsiasi cosa. I turni di planner fallback senza configurazione sono
temporanei, con strumenti disabilitati dove il runtime lo supporta, e usano un
workspace/sessione temporaneo.

La modalità di recupero del canale messaggi non usa il planner assistito dal modello. Il
recupero remoto resta deterministico così che un percorso normale dell'agente guasto o compromesso non
possa essere usato come editor di configurazione.

## Passaggio a un agente

Usa un selettore in linguaggio naturale per uscire da Crestodian e aprire la normale TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` continuano ad aprire direttamente la normale
TUI dell'agente. Non avviano Crestodian.

Dopo il passaggio alla normale TUI, usa `/crestodian` per tornare a Crestodian.
Puoi includere una richiesta di follow-up:

```text
/crestodian
/crestodian restart gateway
```

I passaggi di agente all'interno della TUI lasciano una traccia che indica che `/crestodian` è disponibile.

## Modalità di recupero messaggi

La modalità di recupero messaggi è il punto di ingresso di Crestodian per il canale messaggi. Serve per
il caso in cui il tuo normale agente sia inattivo, ma un canale attendibile come WhatsApp
riceva ancora comandi.

Comando testuale supportato:

- `/crestodian <request>`

Flusso operatore:

```text
Tu, in un DM owner attendibile: /crestodian status
OpenClaw: Modalità di recupero Crestodian. Gateway raggiungibile: no. Configurazione valida: no.
Tu: /crestodian restart gateway
OpenClaw: Piano: riavviare il Gateway. Rispondi /crestodian yes per applicare.
Tu: /crestodian yes
OpenClaw: Applicato. Voce di audit scritta.
```

La creazione di agenti può anche essere messa in coda dal prompt locale o dalla modalità di recupero:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

La modalità di recupero remota è una superficie amministrativa. Deve essere trattata come riparazione
remota della configurazione, non come normale chat.

Contratto di sicurezza per il recupero remoto:

- Disabilitata quando il sandboxing è attivo. Se un agente/sessione è in sandbox,
  Crestodian deve rifiutare il recupero remoto e spiegare che è necessaria la riparazione CLI locale.
- Lo stato effettivo predefinito è `auto`: consenti il recupero remoto solo in operazioni YOLO attendibili,
  dove il runtime ha già autorità locale non sandboxata.
- Richiedi un'identità owner esplicita. Il recupero non deve accettare regole wildcard per il mittente,
  group policy aperta, Webhook non autenticati o canali anonimi.
- Solo DM owner per impostazione predefinita. Il recupero in gruppi/canali richiede opt-in esplicito.
- Il recupero remoto non può aprire la TUI locale né passare a una sessione agente interattiva.
  Usa `openclaw` locale per il handoff all'agente.
- Le scritture persistenti richiedono comunque approvazione, anche in modalità di recupero.
- Esegui audit di ogni operazione di recupero applicata. Il recupero del canale messaggi registra canale,
  account, mittente e metadati dell'indirizzo sorgente. Le operazioni che modificano la configurazione
  registrano anche gli hash della configurazione prima e dopo.
- Non ripetere mai i segreti. L'ispezione SecretRef deve riportare la disponibilità, non i
  valori.
- Se il Gateway è attivo, preferisci le operazioni tipizzate del Gateway. Se il Gateway è
  inattivo, usa solo la superficie minima di riparazione locale che non dipende dal
  normale loop dell'agente.

Forma della configurazione:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` dovrebbe accettare:

- `"auto"`: predefinito. Consenti solo quando il runtime effettivo è YOLO e
  il sandboxing è disattivato.
- `false`: non consentire mai il recupero del canale messaggi.
- `true`: consenti esplicitamente il recupero quando i controlli owner/canale sono superati. Questo
  non deve comunque bypassare il rifiuto dovuto al sandboxing.

La postura YOLO predefinita `"auto"` è:

- la modalità sandbox viene risolta su `off`
- `tools.exec.security` viene risolto su `full`
- `tools.exec.ask` viene risolto su `off`

Il recupero remoto è coperto dalla lane Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Il fallback locale del planner senza configurazione è coperto da:

```bash
pnpm test:docker:crestodian-planner
```

Un controllo smoke opt-in della superficie dei comandi sul canale live verifica `/crestodian status` più un
roundtrip di approvazione persistente attraverso l'handler di recupero:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configurazione iniziale senza configurazione tramite Crestodian è coperta da:

```bash
pnpm test:docker:crestodian-first-run
```

Questa lane parte con una dir di stato vuota, instrada `openclaw` senza argomenti a Crestodian,
imposta il modello predefinito, crea un agente aggiuntivo, configura Discord tramite
abilitazione del Plugin più token SecretRef, valida la configurazione e controlla il log di audit.
QA Lab ha anche uno scenario basato sul repository per lo stesso flusso Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/cli/doctor)
- [TUI](/it/cli/tui)
- [Sandbox](/it/cli/sandbox)
- [Sicurezza](/it/cli/security)
