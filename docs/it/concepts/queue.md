---
read_when:
    - Modifica dell'esecuzione della risposta automatica o della concorrenza
summary: Progettazione della coda dei comandi che serializza le esecuzioni di risposta automatica in ingresso
title: Coda dei comandi
x-i18n:
    generated_at: "2026-04-25T13:45:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

Serializziamo le esecuzioni di risposta automatica in ingresso (tutti i canali) tramite una piccola coda in-process per evitare che più esecuzioni dell'agente entrino in collisione, consentendo comunque un parallelismo sicuro tra sessioni.

## Perché

- Le esecuzioni di risposta automatica possono essere costose (chiamate LLM) e possono entrare in collisione quando più messaggi in ingresso arrivano a distanza ravvicinata.
- La serializzazione evita la competizione per risorse condivise (file di sessione, log, stdin della CLI) e riduce la probabilità di rate limit upstream.

## Come funziona

- Una coda FIFO consapevole delle lane svuota ogni lane con un limite di concorrenza configurabile (predefinito 1 per lane non configurate; `main` usa per impostazione predefinita 4, `subagent` 8).
- `runEmbeddedPiAgent` accoda per **chiave di sessione** (lane `session:<key>`) per garantire una sola esecuzione attiva per sessione.
- Ogni esecuzione di sessione viene poi accodata in una **lane globale** (`main` per impostazione predefinita) così il parallelismo complessivo è limitato da `agents.defaults.maxConcurrent`.
- Quando il logging verboso è abilitato, le esecuzioni in coda emettono un breve avviso se hanno atteso più di ~2 s prima di partire.
- Gli indicatori di digitazione vengono comunque attivati immediatamente al momento dell'accodamento (quando supportati dal canale), quindi l'esperienza utente non cambia mentre aspettiamo il nostro turno.

## Modalità della coda (per canale)

I messaggi in ingresso possono indirizzare l'esecuzione corrente, attendere un turno successivo, o fare entrambe le cose:

- `steer`: inietta immediatamente nell'esecuzione corrente (annulla le chiamate di strumenti in sospeso dopo il successivo confine di strumento). Se non è in streaming, usa come fallback `followup`.
- `followup`: accoda per il turno agente successivo dopo la fine dell'esecuzione corrente.
- `collect`: coalesca tutti i messaggi accodati in un **singolo** turno successivo (predefinito). Se i messaggi puntano a canali/thread diversi, vengono svuotati singolarmente per preservare l'instradamento.
- `steer-backlog` (alias `steer+backlog`): indirizza ora **e** conserva il messaggio per un turno successivo.
- `interrupt` (legacy): interrompe l'esecuzione attiva per quella sessione, poi esegue il messaggio più recente.
- `queue` (alias legacy): uguale a `steer`.

Steer-backlog significa che puoi ottenere una risposta successiva dopo l'esecuzione indirizzata, quindi
le superfici di streaming possono sembrare duplicate. Preferisci `collect`/`steer` se vuoi
una risposta per ogni messaggio in ingresso.
Invia `/queue collect` come comando standalone (per sessione) oppure imposta `messages.queue.byChannel.discord: "collect"`.

Valori predefiniti (quando non impostati nella configurazione):

- Tutte le superfici → `collect`

Configura globalmente o per canale tramite `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opzioni della coda

Le opzioni si applicano a `followup`, `collect` e `steer-backlog` (e a `steer` quando usa `followup` come fallback):

- `debounceMs`: attende un periodo di quiete prima di avviare un turno successivo (evita “continua, continua”).
- `cap`: massimo numero di messaggi accodati per sessione.
- `drop`: criterio di overflow (`old`, `new`, `summarize`).

Summarize mantiene un breve elenco puntato dei messaggi scartati e lo inietta come prompt sintetico di followup.
Valori predefiniti: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Override per sessione

- Invia `/queue <mode>` come comando standalone per memorizzare la modalità per la sessione corrente.
- Le opzioni possono essere combinate: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` oppure `/queue reset` cancella l'override della sessione.

## Ambito e garanzie

- Si applica alle esecuzioni dell'agente in risposta automatica su tutti i canali in ingresso che usano la pipeline di risposta del gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, ecc.).
- La lane predefinita (`main`) è a livello di processo per ingressi + Heartbeat principali; imposta `agents.defaults.maxConcurrent` per consentire più sessioni in parallelo.
- Possono esistere lane aggiuntive (ad esempio `cron`, `subagent`) così i job in background possono essere eseguiti in parallelo senza bloccare le risposte in ingresso. Queste esecuzioni distaccate vengono tracciate come [attività in background](/it/automation/tasks).
- Le lane per sessione garantiscono che una sola esecuzione dell'agente tocchi una determinata sessione alla volta.
- Nessuna dipendenza esterna o thread worker in background; puro TypeScript + promise.

## Risoluzione dei problemi

- Se i comandi sembrano bloccati, abilita i log verbosi e cerca righe “queued for …ms” per confermare che la coda si sta svuotando.
- Se ti serve la profondità della coda, abilita i log verbosi e osserva le righe di temporizzazione della coda.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Criteri di retry](/it/concepts/retry)
