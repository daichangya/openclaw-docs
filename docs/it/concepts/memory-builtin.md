---
read_when:
    - Vuoi capire il backend di memoria predefinito
    - Vuoi configurare provider di embedding o la ricerca ibrida
summary: Il backend di memoria predefinito basato su SQLite con ricerca per parole chiave, vettoriale e ibrida
title: Motore di memoria integrato
x-i18n:
    generated_at: "2026-04-25T13:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Il motore integrato è il backend di memoria predefinito. Memorizza l'indice della memoria in
un database SQLite per agente e non richiede dipendenze aggiuntive per iniziare.

## Cosa offre

- **Ricerca per parole chiave** tramite indicizzazione full-text FTS5 (punteggio BM25).
- **Ricerca vettoriale** tramite embedding da qualsiasi provider supportato.
- **Ricerca ibrida** che combina entrambe per risultati migliori.
- **Supporto CJK** tramite tokenizzazione trigram per cinese, giapponese e coreano.
- **Accelerazione sqlite-vec** per query vettoriali nel database (opzionale).

## Per iniziare

Se hai una chiave API per OpenAI, Gemini, Voyage o Mistral, il motore integrato
la rileva automaticamente e abilita la ricerca vettoriale. Nessuna configurazione necessaria.

Per impostare esplicitamente un provider:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Senza un provider di embedding, è disponibile solo la ricerca per parole chiave.

Per forzare il provider di embedding locale integrato, installa il pacchetto
runtime opzionale `node-llama-cpp` accanto a OpenClaw, quindi punta `local.modelPath`
a un file GGUF:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Provider di embedding supportati

| Provider | ID        | Rilevato automaticamente | Note                                |
| -------- | --------- | ------------------------ | ----------------------------------- |
| OpenAI   | `openai`  | Sì                       | Predefinito: `text-embedding-3-small`   |
| Gemini   | `gemini`  | Sì                       | Supporta multimodale (immagine + audio) |
| Voyage   | `voyage`  | Sì                       |                                     |
| Mistral  | `mistral` | Sì                       |                                     |
| Ollama   | `ollama`  | No                       | Locale, da impostare esplicitamente |
| Local    | `local`   | Sì (per primo)          | Runtime opzionale `node-llama-cpp`  |

Il rilevamento automatico sceglie il primo provider la cui chiave API può essere risolta, nell'ordine
mostrato. Imposta `memorySearch.provider` per sovrascrivere.

## Come funziona l'indicizzazione

OpenClaw indicizza `MEMORY.md` e `memory/*.md` in blocchi (~400 token con
sovrapposizione di 80 token) e li memorizza in un database SQLite per agente.

- **Posizione dell'indice:** `~/.openclaw/memory/<agentId>.sqlite`
- **Monitoraggio dei file:** le modifiche ai file di memoria attivano una reindicizzazione con debounce (1,5 s).
- **Reindicizzazione automatica:** quando cambiano il provider di embedding, il modello o la configurazione di chunking,
  l'intero indice viene ricostruito automaticamente.
- **Reindicizzazione su richiesta:** `openclaw memory index --force`

<Info>
Puoi anche indicizzare file Markdown esterni allo spazio di lavoro con
`memorySearch.extraPaths`. Vedi il
[riferimento della configurazione](/it/reference/memory-config#additional-memory-paths).
</Info>

## Quando usarlo

Il motore integrato è la scelta giusta per la maggior parte degli utenti:

- Funziona subito senza dipendenze aggiuntive.
- Gestisce bene la ricerca per parole chiave e quella vettoriale.
- Supporta tutti i provider di embedding.
- La ricerca ibrida combina il meglio di entrambi gli approcci di recupero.

Valuta di passare a [QMD](/it/concepts/memory-qmd) se hai bisogno di reranking, espansione
della query o vuoi indicizzare directory esterne allo spazio di lavoro.

Valuta [Honcho](/it/concepts/memory-honcho) se vuoi memoria cross-sessione con
modellazione automatica dell'utente.

## Risoluzione dei problemi

**Ricerca nella memoria disabilitata?** Controlla `openclaw memory status`. Se non viene
rilevato alcun provider, impostane uno esplicitamente o aggiungi una chiave API.

**Provider locale non rilevato?** Conferma che il percorso locale esista ed esegui:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sia i comandi CLI standalone sia il Gateway usano lo stesso id provider `local`.
Se il provider è impostato su `auto`, gli embedding locali vengono considerati per primi solo
quando `memorySearch.local.modelPath` punta a un file locale esistente.

**Risultati obsoleti?** Esegui `openclaw memory index --force` per ricostruire. Il watcher
può perdere modifiche in rari casi limite.

**sqlite-vec non si carica?** OpenClaw torna automaticamente al calcolo in-process della similarità coseno.
Controlla i log per l'errore di caricamento specifico.

## Configurazione

Per la configurazione del provider di embedding, la regolazione della ricerca ibrida (pesi, MMR, decadimento
temporale), indicizzazione in batch, memoria multimodale, sqlite-vec, percorsi extra e tutte
le altre opzioni di configurazione, vedi il
[riferimento della configurazione della memoria](/it/reference/memory-config).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Active Memory](/it/concepts/active-memory)
