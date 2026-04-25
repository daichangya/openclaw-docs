---
read_when:
    - Vuoi capire la Compaction automatica e `/compact`
    - Stai eseguendo il debug di sessioni lunghe che raggiungono i limiti di contesto
summary: Come OpenClaw riassume le conversazioni lunghe per restare entro i limiti del modello
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:44:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

Ogni modello ha una finestra di contesto, ovvero il numero massimo di token che può elaborare.
Quando una conversazione si avvicina a quel limite, OpenClaw esegue la **Compaction** dei messaggi più vecchi
in un riepilogo, così la chat può continuare.

## Come funziona

1. I turni meno recenti della conversazione vengono riassunti in una voce compatta.
2. Il riepilogo viene salvato nella trascrizione della sessione.
3. I messaggi recenti vengono mantenuti intatti.

Quando OpenClaw suddivide la cronologia in blocchi di Compaction, mantiene le
chiamate agli strumenti dell'assistente abbinate alle corrispondenti voci `toolResult`. Se un punto di divisione cade
all'interno di un blocco di strumenti, OpenClaw sposta il confine in modo che la coppia resti unita e
la coda corrente non riassunta venga preservata.

La cronologia completa della conversazione resta su disco. La Compaction cambia solo ciò che il
modello vede al turno successivo.

## Compaction automatica

La Compaction automatica è attiva per impostazione predefinita. Viene eseguita quando la sessione si avvicina al limite di contesto
oppure quando il modello restituisce un errore di overflow del contesto (in quel caso
OpenClaw esegue la Compaction e riprova). Le firme tipiche di overflow includono
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` e `ollama error: context length
exceeded`.

<Info>
Prima della Compaction, OpenClaw ricorda automaticamente all'agente di salvare le
note importanti nei file di [memoria](/it/concepts/memory). Questo previene la perdita di contesto.
</Info>

Usa l'impostazione `agents.defaults.compaction` nel tuo `openclaw.json` per configurare il comportamento della Compaction (modalità, token di destinazione, ecc.).
La sintesi della Compaction preserva per impostazione predefinita gli identificatori opachi (`identifierPolicy: "strict"`). Puoi sovrascrivere questo comportamento con `identifierPolicy: "off"` oppure fornire testo personalizzato con `identifierPolicy: "custom"` e `identifierInstructions`.

Puoi facoltativamente specificare un modello diverso per la sintesi della Compaction tramite `agents.defaults.compaction.model`. Questo è utile quando il tuo modello primario è locale o piccolo e vuoi che i riepiloghi di Compaction siano prodotti da un modello più capace. L'override accetta qualsiasi stringa `provider/model-id`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Questo funziona anche con modelli locali, ad esempio un secondo modello Ollama dedicato alla sintesi o uno specialista di Compaction fine-tuned:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Quando non è impostato, la Compaction usa il modello primario dell'agente.

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction personalizzato tramite `registerCompactionProvider()` sull'API del Plugin. Quando un provider è registrato e configurato, OpenClaw gli delega la sintesi invece di usare la pipeline LLM integrata.

Per usare un provider registrato, imposta l'id del provider nella tua configurazione:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

L'impostazione di un `provider` forza automaticamente `mode: "safeguard"`. I provider ricevono le stesse istruzioni di Compaction e la stessa policy di preservazione degli identificatori del percorso integrato, e OpenClaw continua a preservare il contesto del suffisso dei turni recenti e dei turni suddivisi dopo l'output del provider. Se il provider fallisce o restituisce un risultato vuoto, OpenClaw torna alla sintesi LLM integrata.

## Compaction automatica (attiva per impostazione predefinita)

Quando una sessione si avvicina o supera la finestra di contesto del modello, OpenClaw attiva la Compaction automatica e può riprovare la richiesta originale usando il contesto compattato.

Vedrai:

- `🧹 Auto-compaction complete` in modalità dettagliata
- `/status` che mostra `🧹 Compactions: <count>`

Prima della Compaction, OpenClaw può eseguire un turno di **memory flush silenzioso** per archiviare
note persistenti su disco. Vedi [Memoria](/it/concepts/memory) per dettagli e configurazione.

## Compaction manuale

Digita `/compact` in qualsiasi chat per forzare una Compaction. Aggiungi istruzioni per guidare
il riepilogo:

```
/compact Focus on the API design decisions
```

Quando `agents.defaults.compaction.keepRecentTokens` è impostato, la Compaction manuale
rispetta quel punto di taglio Pi e mantiene la coda recente nel contesto ricostruito. Senza
un budget esplicito di mantenimento, la Compaction manuale si comporta come un checkpoint netto e
prosegue dal solo nuovo riepilogo.

## Uso di un modello diverso

Per impostazione predefinita, la Compaction usa il modello primario del tuo agente. Puoi usare un modello più
capace per ottenere riepiloghi migliori:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Avvisi di Compaction

Per impostazione predefinita, la Compaction viene eseguita in modo silenzioso. Per mostrare brevi avvisi quando la Compaction
inizia e quando viene completata, abilita `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Quando è abilitato, l'utente vede brevi messaggi di stato attorno a ogni esecuzione di Compaction
(ad esempio, "Compacting context..." e "Compaction complete").

## Compaction vs pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Cosa fa**      | Riassume la conversazione meno recente | Elimina vecchi risultati degli strumenti |
| **Salvato?**     | Sì (nella trascrizione della sessione) | No (solo in memoria, per richiesta) |
| **Ambito**       | Intera conversazione          | Solo risultati degli strumenti   |

Il [pruning della sessione](/it/concepts/session-pruning) è un complemento più leggero che
riduce l'output degli strumenti senza riassumerlo.

## Risoluzione dei problemi

**La Compaction avviene troppo spesso?** La finestra di contesto del modello potrebbe essere piccola, oppure gli
output degli strumenti potrebbero essere grandi. Prova ad abilitare il
[pruning della sessione](/it/concepts/session-pruning).

**Il contesto sembra obsoleto dopo la Compaction?** Usa `/compact Focus on <topic>` per
guidare il riepilogo, oppure abilita il [memory flush](/it/concepts/memory) così le note
vengono conservate.

**Hai bisogno di ripartire da zero?** `/new` avvia una nuova sessione senza eseguire la Compaction.

Per la configurazione avanzata (token riservati, preservazione degli identificatori, motori di
contesto personalizzati, Compaction lato server OpenAI), vedi
l'[Approfondimento sulla gestione della sessione e sulla Compaction](/it/reference/session-management-compaction).

## Correlati

- [Sessione](/it/concepts/session) — gestione e ciclo di vita della sessione
- [Pruning della sessione](/it/concepts/session-pruning) — riduzione dei risultati degli strumenti
- [Contesto](/it/concepts/context) — come viene costruito il contesto per i turni dell'agente
- [Hook](/it/automation/hooks) — hook del ciclo di vita della Compaction (before_compaction, after_compaction)
