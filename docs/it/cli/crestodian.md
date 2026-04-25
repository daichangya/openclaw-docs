---
read_when:
    - Esegui openclaw senza comandi e vuoi capire Crestodian
    - Hai bisogno di un modo configless-safe per ispezionare o riparare OpenClaw
    - Stai progettando o abilitando la modalità di recupero del canale dei messaggi
summary: Riferimento CLI e modello di sicurezza per Crestodian, l'assistente di configurazione e riparazione configless-safe
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:43:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian è l'assistente locale di OpenClaw per configurazione, riparazione e setup. È
progettato per rimanere raggiungibile quando il normale percorso dell'agente è guasto.

Eseguire `openclaw` senza comandi avvia Crestodian in un terminale interattivo.
Eseguire `openclaw crestodian` avvia esplicitamente lo stesso assistente.

## Cosa mostra Crestodian

All'avvio, Crestodian interattivo apre la stessa shell TUI usata da
`openclaw tui`, con un backend chat Crestodian. Il log della chat inizia con un breve
messaggio di benvenuto:

- quando avviare Crestodian
- il modello o il percorso planner deterministico che Crestodian sta effettivamente usando
- la validità della configurazione e l'agente predefinito
- la raggiungibilità del Gateway dal primo probe di avvio
- la prossima azione di debug che Crestodian può eseguire

Non espone segreti né carica i comandi CLI del Plugin solo per avviarsi. La TUI
fornisce comunque il normale header, log della chat, riga di stato, footer, completamento automatico
e controlli dell'editor.

Usa `status` per l'inventario dettagliato con percorso della configurazione, percorsi docs/source,
probe CLI locali, presenza delle chiavi API, agenti, modello e dettagli del Gateway.

Crestodian usa lo stesso rilevamento dei riferimenti OpenClaw degli agenti normali. In un checkout Git,
punta a `docs/` locale e all'albero del codice sorgente locale. In un'installazione del pacchetto npm,
usa la documentazione inclusa nel pacchetto e collega a
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con indicazioni esplicite
a esaminare il codice sorgente quando la documentazione non basta.

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

Il percorso di avvio di Crestodian è deliberatamente ridotto. Può essere eseguito quando:

- `openclaw.json` manca
- `openclaw.json` non è valido
- il Gateway è inattivo
- la registrazione dei comandi del Plugin non è disponibile
- non è stato ancora configurato alcun agente

`openclaw --help` e `openclaw --version` usano comunque i normali percorsi rapidi.
`openclaw` non interattivo termina con un breve messaggio invece di stampare l'help
root, perché il prodotto senza comandi è Crestodian.

## Operazioni e approvazione

Crestodian usa operazioni tipizzate invece di modificare la configurazione ad hoc.

Le operazioni di sola lettura possono essere eseguite immediatamente:

- mostrare la panoramica
- elencare gli agenti
- mostrare lo stato del modello/backend
- eseguire controlli di stato o integrità
- verificare la raggiungibilità del Gateway
- eseguire doctor senza correzioni interattive
- convalidare la configurazione
- mostrare il percorso dell'audit log

Le operazioni persistenti richiedono approvazione conversazionale in modalità interattiva, a meno
che non passi `--yes` per un comando diretto:

- scrivere la configurazione
- eseguire `config set`
- impostare valori SecretRef supportati tramite `config set-ref`
- eseguire il bootstrap di setup/onboarding
- cambiare il modello predefinito
- avviare, arrestare o riavviare il Gateway
- creare agenti
- eseguire riparazioni doctor che riscrivono configurazione o stato

Le scritture applicate vengono registrate in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Il rilevamento non viene sottoposto ad audit. Vengono registrate solo le operazioni e le scritture applicate.

`openclaw onboard --modern` avvia Crestodian come anteprima del moderno onboarding.
Il semplice `openclaw onboard` esegue ancora l'onboarding classico.

## Bootstrap di setup

`setup` è il bootstrap di onboarding con approccio chat-first. Scrive solo tramite operazioni
di configurazione tipizzate e chiede prima l'approvazione.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Quando non è configurato alcun modello, setup seleziona il primo backend utilizzabile in questo
ordine e ti dice cosa ha scelto:

- modello esplicito esistente, se già configurato
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Se nessuno è disponibile, setup scrive comunque lo spazio di lavoro predefinito e lascia il
modello non impostato. Installa o accedi a Codex/Claude Code, oppure esponi
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, poi esegui di nuovo setup.

## Planner assistito dal modello

Crestodian si avvia sempre in modalità deterministica. Per comandi fuzzy che il
parser deterministico non comprende, Crestodian locale può eseguire un turno planner limitato
tramite i normali percorsi runtime di OpenClaw. Prima usa il modello OpenClaw
configurato. Se nessun modello configurato è ancora utilizzabile, può usare come fallback i runtime locali
già presenti sulla macchina:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Harness app-server Codex: `openai/gpt-5.5` con `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Il planner assistito dal modello non può modificare direttamente la configurazione. Deve tradurre la
richiesta in uno dei comandi tipizzati di Crestodian, poi si applicano le normali regole
di approvazione e audit. Crestodian stampa il modello usato e il comando interpretato
prima di eseguire qualsiasi operazione. I turni planner di fallback configless sono
temporanei, con strumenti disabilitati dove il runtime lo supporta, e usano uno spazio di lavoro/sessione temporanei.

La modalità di recupero del canale dei messaggi non usa il planner assistito dal modello. Il
recupero remoto rimane deterministico così un normale percorso agente guasto o compromesso non può
essere usato come editor della configurazione.

## Passaggio a un agente

Usa un selettore in linguaggio naturale per uscire da Crestodian e aprire la normale TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` aprono comunque direttamente la normale
TUI dell'agente. Non avviano Crestodian.

Dopo essere passato alla normale TUI, usa `/crestodian` per tornare a Crestodian.
Puoi includere una richiesta successiva:

```text
/crestodian
/crestodian restart gateway
```

I passaggi tra agenti all'interno della TUI lasciano una traccia che indica che `/crestodian` è disponibile.

## Modalità di recupero messaggi

La modalità di recupero messaggi è il punto di ingresso per Crestodian tramite canale messaggi. Serve
quando il normale agente è inattivo, ma un canale affidabile come WhatsApp
riceve ancora comandi.

Comando testuale supportato:

- `/crestodian <request>`

Flusso operativo:

```text
Tu, in una DM proprietario affidabile: /crestodian status
OpenClaw: Modalità di recupero Crestodian. Gateway raggiungibile: no. Configurazione valida: no.
Tu: /crestodian restart gateway
OpenClaw: Piano: riavviare il Gateway. Rispondi /crestodian yes per applicare.
Tu: /crestodian yes
OpenClaw: Applicato. Voce di audit scritta.
```

La creazione di agenti può anche essere accodata dal prompt locale o dalla modalità di recupero:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

La modalità di recupero remoto è una superficie amministrativa. Deve essere trattata come riparazione
remota della configurazione, non come normale chat.

Contratto di sicurezza per il recupero remoto:

- Disabilitata quando il sandboxing è attivo. Se un agente/sessione è in sandbox,
  Crestodian deve rifiutare il recupero remoto e spiegare che è richiesta una riparazione CLI locale.
- Lo stato effettivo predefinito è `auto`: consenti il recupero remoto solo in operatività YOLO affidabile,
  dove il runtime ha già autorità locale non sandboxata.
- Richiede un'identità proprietario esplicita. Il recupero non deve accettare regole wildcard del mittente,
  criteri di gruppo aperti, Webhook non autenticati o canali anonimi.
- Solo DM proprietario per impostazione predefinita. Il recupero in gruppo/canale richiede opt-in esplicito e
  dovrebbe comunque instradare i prompt di approvazione alla DM del proprietario.
- Il recupero remoto non può aprire la TUI locale né passare a una sessione agente interattiva.
  Usa `openclaw` locale per il passaggio all'agente.
- Le scritture persistenti richiedono comunque approvazione, anche in modalità di recupero.
- Sottoponi ad audit ogni operazione di recupero applicata, inclusi canale, account, mittente,
  chiave sessione, operazione, hash della configurazione prima e hash della configurazione dopo.
- Non esporre mai segreti. L'ispezione SecretRef deve riportare la disponibilità, non i valori.
- Se il Gateway è vivo, privilegia le operazioni tipizzate del Gateway. Se il Gateway è
  inattivo, usa solo la superficie minima di riparazione locale che non dipende dal normale loop dell'agente.

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
- `false`: non consentire mai il recupero tramite canale messaggi.
- `true`: consenti esplicitamente il recupero quando i controlli proprietario/canale sono superati. Questo
  non deve comunque bypassare il rifiuto dovuto al sandboxing.

La postura YOLO predefinita `"auto"` è:

- la modalità sandbox viene risolta su `off`
- `tools.exec.security` viene risolto su `full`
- `tools.exec.ask` viene risolto su `off`

Il recupero remoto è coperto dalla lane Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Il fallback planner locale configless è coperto da:

```bash
pnpm test:docker:crestodian-planner
```

Un controllo smoke opt-in della superficie dei comandi del canale live verifica `/crestodian status` più un
roundtrip di approvazione persistente attraverso l'handler di recupero:

```bash
pnpm test:live:crestodian-rescue-channel
```

Il setup iniziale configless tramite Crestodian è coperto da:

```bash
pnpm test:docker:crestodian-first-run
```

Quella lane parte con una directory di stato vuota, instrada `openclaw` senza argomenti a Crestodian,
imposta il modello predefinito, crea un agente aggiuntivo, configura Discord tramite
abilitazione di un Plugin più token SecretRef, convalida la configurazione e controlla l'audit
log. QA Lab ha anche uno scenario basato su repo per lo stesso flusso Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/cli/doctor)
- [TUI](/it/cli/tui)
- [Sandbox](/it/cli/sandbox)
- [Sicurezza](/it/cli/security)
