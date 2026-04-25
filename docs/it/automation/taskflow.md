---
read_when:
    - Vuoi capire come TaskFlow si relaziona alle attività in background
    - Incontri Task Flow o il flusso di attività di openclaw nelle note di rilascio o nella documentazione
    - Vuoi ispezionare o gestire lo stato persistente del flusso
summary: livello di orchestrazione dei flussi sopra le attività in background
title: flusso di attività
x-i18n:
    generated_at: "2026-04-25T13:41:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

Task Flow è il substrato di orchestrazione dei flussi che si colloca sopra le [attività in background](/it/automation/tasks). Gestisce flussi durevoli a più fasi con un proprio stato, tracciamento delle revisioni e semantiche di sincronizzazione, mentre le singole attività restano l'unità di lavoro scollegata.

## Quando usare Task Flow

Usa Task Flow quando il lavoro si estende su più passaggi sequenziali o ramificati e hai bisogno di un tracciamento durevole dell'avanzamento attraverso i riavvii del Gateway. Per singole operazioni in background, è sufficiente una semplice [attività](/it/automation/tasks).

| Scenario                              | Uso                    |
| ------------------------------------- | ---------------------- |
| Singolo job in background             | Attività semplice      |
| Pipeline a più fasi (A poi B poi C)   | Task Flow (gestito)    |
| Osservare attività create esternamente | Task Flow (rispecchiato) |
| Promemoria one-shot                   | Job Cron               |

## Pattern affidabile per workflow pianificati

Per workflow ricorrenti come briefing di market intelligence, tratta la pianificazione, l'orchestrazione e i controlli di affidabilità come livelli separati:

1. Usa [Scheduled Tasks](/it/automation/cron-jobs) per la pianificazione.
2. Usa una sessione cron persistente quando il workflow deve basarsi sul contesto precedente.
3. Usa [Lobster](/it/tools/lobster) per passaggi deterministici, gate di approvazione e token di ripresa.
4. Usa Task Flow per tracciare l'esecuzione a più fasi tra attività figlie, attese, tentativi ripetuti e riavvii del Gateway.

Esempio di struttura cron:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Usa `session:<id>` invece di `isolated` quando il workflow ricorrente necessita intenzionalmente di cronologia, riepiloghi delle esecuzioni precedenti o contesto persistente. Usa `isolated` quando ogni esecuzione deve iniziare da zero e tutto lo stato necessario è esplicito nel workflow.

All'interno del workflow, inserisci i controlli di affidabilità prima della fase di riepilogo dell'LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Controlli preflight consigliati:

- Disponibilità del browser e scelta del profilo, ad esempio `openclaw` per lo stato gestito o `user` quando è richiesta una sessione Chrome autenticata. Vedi [Browser](/it/tools/browser).
- Credenziali API e quota per ogni sorgente.
- Raggiungibilità di rete per gli endpoint richiesti.
- Strumenti richiesti abilitati per l'agente, come `lobster`, `browser` e `llm-task`.
- Destinazione di errore configurata per cron in modo che gli errori preflight siano visibili. Vedi [Scheduled Tasks](/it/automation/cron-jobs#delivery-and-output).

Campi di provenienza dei dati consigliati per ogni elemento raccolto:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Fai in modo che il workflow rifiuti o contrassegni come obsoleti gli elementi prima della fase di riepilogo. La fase LLM dovrebbe ricevere solo JSON strutturato e dovrebbe essere istruita a preservare `sourceUrl`, `retrievedAt` e `asOf` nel proprio output. Usa [LLM Task](/it/tools/llm-task) quando hai bisogno di una fase del modello con validazione tramite schema all'interno del workflow.

Per workflow riutilizzabili di team o community, impacchetta la CLI, i file `.lobster` e qualsiasi nota di configurazione come skill o plugin e pubblicali tramite [ClawHub](/it/tools/clawhub). Mantieni i guardrail specifici del workflow in quel pacchetto, a meno che all'API del plugin non manchi una capacità generica necessaria.

## Modalità di sincronizzazione

### Modalità gestita

Task Flow possiede l'intero ciclo di vita end-to-end. Crea attività come fasi del flusso, le porta a completamento e fa avanzare automaticamente lo stato del flusso.

Esempio: un flusso di report settimanale che (1) raccoglie i dati, (2) genera il report e (3) lo consegna. Task Flow crea ogni fase come attività in background, attende il completamento e poi passa alla fase successiva.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modalità rispecchiata

Task Flow osserva attività create esternamente e mantiene sincronizzato lo stato del flusso senza assumere la proprietà della creazione delle attività. Questo è utile quando le attività hanno origine da job cron, comandi CLI o altre sorgenti e vuoi una vista unificata del loro avanzamento come flusso.

Esempio: tre job cron indipendenti che insieme formano una routine di "operazioni mattutine". Un flusso rispecchiato tiene traccia del loro avanzamento complessivo senza controllare quando o come vengono eseguiti.

## Stato durevole e tracciamento delle revisioni

Ogni flusso persiste il proprio stato e tiene traccia delle revisioni, così l'avanzamento sopravvive ai riavvii del Gateway. Il tracciamento delle revisioni consente il rilevamento dei conflitti quando più sorgenti tentano di far avanzare contemporaneamente lo stesso flusso.

## Comportamento di annullamento

`openclaw tasks flow cancel` imposta un intento di annullamento persistente sul flusso. Le attività attive all'interno del flusso vengono annullate e non vengono avviate nuove fasi. L'intento di annullamento persiste attraverso i riavvii, quindi un flusso annullato resta annullato anche se il Gateway si riavvia prima che tutte le attività figlie siano terminate.

## Comandi CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrizione                                         |
| --------------------------------- | --------------------------------------------------- |
| `openclaw tasks flow list`        | Mostra i flussi tracciati con stato e modalità di sincronizzazione |
| `openclaw tasks flow show <id>`   | Ispeziona un flusso in base all'id del flusso o alla chiave di lookup |
| `openclaw tasks flow cancel <id>` | Annulla un flusso in esecuzione e le sue attività attive |

## Come i flussi si relazionano alle attività

I flussi coordinano le attività, non le sostituiscono. Un singolo flusso può gestire più attività in background nel corso della sua durata. Usa `openclaw tasks` per ispezionare i singoli record delle attività e `openclaw tasks flow` per ispezionare il flusso di orchestrazione.

## Correlati

- [Attività in background](/it/automation/tasks) — il registro del lavoro scollegato coordinato dai flussi
- [CLI: tasks](/it/cli/tasks) — riferimento dei comandi CLI per `openclaw tasks flow`
- [Panoramica dell'automazione](/it/automation) — tutti i meccanismi di automazione a colpo d'occhio
- [Job Cron](/it/automation/cron-jobs) — job pianificati che possono confluire nei flussi
