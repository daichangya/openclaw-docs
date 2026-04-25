---
read_when:
    - Devi eseguire il debug degli ID di sessione, del JSONL della trascrizione o dei campi di `sessions.json`
    - Stai modificando il comportamento della Compaction automatica o aggiungendo attività di manutenzione “pre-Compaction”
    - Vuoi implementare scaricamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: archivio delle sessioni + transcript, ciclo di vita e meccanismi interni di Compaction (automatica)'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-04-25T13:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Questa pagina spiega come OpenClaw gestisce le sessioni end-to-end:

- **Instradamento delle sessioni** (come i messaggi in ingresso vengono mappati a una `sessionKey`)
- **Archivio delle sessioni** (`sessions.json`) e cosa tiene traccia
- **Persistenza della trascrizione** (`*.jsonl`) e la sua struttura
- **Igiene della trascrizione** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto rispetto ai token tracciati)
- **Compaction** (Compaction manuale + automatica) e dove collegare il lavoro pre-Compaction
- **Manutenzione silenziosa** (ad esempio scritture in memoria che non dovrebbero produrre output visibile all’utente)

Se vuoi prima una panoramica di livello più alto, inizia da:

- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Igiene della trascrizione](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un unico **processo Gateway** che possiede lo stato della sessione.

- Le UI (app macOS, web Control UI, TUI) dovrebbero interrogare il Gateway per ottenere gli elenchi delle sessioni e i conteggi dei token.
- In modalità remota, i file di sessione si trovano sull’host remoto; “controllare i file del tuo Mac locale” non rifletterà ciò che il Gateway sta utilizzando.

---

## Due livelli di persistenza

OpenClaw rende persistenti le sessioni su due livelli:

1. **Archivio delle sessioni (`sessions.json`)**
   - Mappa chiave/valore: `sessionKey -> SessionEntry`
   - Piccolo, mutabile, sicuro da modificare (o da cui eliminare voci)
   - Tiene traccia dei metadati della sessione (id sessione corrente, ultima attività, interruttori, contatori di token, ecc.)

2. **Trascrizione (`<sessionId>.jsonl`)**
   - Trascrizione append-only con struttura ad albero (le voci hanno `id` + `parentId`)
   - Memorizza la conversazione effettiva + chiamate agli strumenti + riepiloghi di Compaction
   - Usata per ricostruire il contesto del modello per i turni futuri

---

## Posizioni su disco

Per agente, sull’host Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni di argomento Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw le risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dell’archivio e controlli del disco

La persistenza delle sessioni dispone di controlli di manutenzione automatici (`session.maintenance`) per `sessions.json` e gli artefatti delle trascrizioni:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età per le voci obsolete (predefinita `30d`)
- `maxEntries`: limite massimo di voci in `sessions.json` (predefinito `500`)
- `rotateBytes`: ruota `sessions.json` quando è troppo grande (predefinito `10mb`)
- `resetArchiveRetention`: conservazione per gli archivi di trascrizione `*.reset.<timestamp>` (predefinita: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale per la directory delle sessioni
- `highWaterBytes`: obiettivo opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuove prima gli artefatti di trascrizione archiviati o orfani più vecchi.
2. Se è ancora sopra l’obiettivo, espelle le voci di sessione più vecchie e i relativi file di trascrizione.
3. Continua finché l’utilizzo non è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala le possibili espulsioni ma non modifica l’archivio/i file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log di esecuzione

Anche le esecuzioni Cron isolate creano voci di sessione/trascrizioni e hanno controlli di conservazione dedicati:

- `cron.sessionRetention` (predefinito `24h`) elimina dall’archivio delle sessioni le vecchie sessioni di esecuzione Cron isolate (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` eliminano i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la voce di sessione precedente
`cron:<jobId>` prima di scrivere la nuova riga. Mantiene preferenze sicure
come impostazioni di thinking/fast/verbose, etichette e override espliciti
di modello/autenticazione selezionati dall’utente. Elimina il contesto di conversazione
ambientale come instradamento del canale/gruppo, criterio di invio o accodamento, elevazione, origine e binding runtime ACP
così che una nuova esecuzione isolata non possa ereditare autorizzazioni di consegna o
di runtime obsolete da un’esecuzione precedente.

---

## Chiavi di sessione (`sessionKey`)

Una `sessionKey` identifica _in quale contenitore di conversazione_ ti trovi (instradamento + isolamento).

Schemi comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (salvo override)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## Id sessione (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quella `sessionKey`.
- **Reset giornaliero** (predefinito alle 4:00 AM ora locale sull’host Gateway) crea un nuovo `sessionId` al messaggio successivo dopo il confine di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando sono configurati sia giornaliero che inattività, vince quello che scade per primo.
- **Protezione fork del genitore del thread** (`session.parentForkMaxTokens`, predefinito `100000`) salta il fork della trascrizione del genitore quando la sessione padre è già troppo grande; il nuovo thread inizia da zero. Imposta `0` per disabilitare.

Dettaglio implementativo: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell’archivio delle sessioni (`sessions.json`)

Il tipo di valore dell’archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: id della trascrizione corrente (il nome del file deriva da questo salvo che sia impostato `sessionFile`)
- `updatedAt`: timestamp dell’ultima attività
- `sessionFile`: override opzionale esplicito del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta le UI e il criterio di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per l’etichettatura di gruppi/canali
- Interruttori:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la Compaction automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell’ultimo flush di memoria pre-Compaction
- `memoryFlushCompactionCount`: conteggio di Compaction quando è stato eseguito l’ultimo flush

L’archivio è sicuro da modificare, ma il Gateway è l’autorità: può riscrivere o reidratare le voci mentre le sessioni sono in esecuzione.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `@mariozechner/pi-coding-agent`.

Il file è JSONL:

- Prima riga: intestazione della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, `parentSession` opzionale)
- Poi: voci della sessione con `id` + `parentId` (albero)

Tipi di voce rilevanti:

- `message`: messaggi utente/assistente/toolResult
- `custom_message`: messaggi inseriti dalle estensioni che _entrano_ nel contesto del modello (possono essere nascosti dalla UI)
- `custom`: stato dell’estensione che non entra nel contesto del modello
- `compaction`: riepilogo di Compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito durante la navigazione di un ramo dell’albero

OpenClaw intenzionalmente **non** “corregge” le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto rispetto ai token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell’archivio delle sessioni**: statistiche progressive scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo dei modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nell’archivio è un valore di stima/reporting a runtime; non trattarlo come una garanzia rigorosa.

Per maggiori dettagli, vedi [/token-use](/it/reference/token-use).

---

## Compaction: che cos’è

La Compaction riassume la parte più vecchia della conversazione in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la Compaction, i turni futuri vedono:

- Il riepilogo della Compaction
- I messaggi dopo `firstKeptEntryId`

La Compaction è **persistente** (a differenza della potatura delle sessioni). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei blocchi di Compaction e accoppiamento degli strumenti

Quando OpenClaw divide una lunga trascrizione in blocchi di Compaction, mantiene
le chiamate agli strumenti dell’assistente accoppiate con le rispettive voci `toolResult`.

- Se la divisione per quota di token cade tra una chiamata a uno strumento e il suo risultato, OpenClaw
  sposta il confine al messaggio dell’assistente con la chiamata allo strumento invece di separare
  la coppia.
- Se un blocco finale di risultati degli strumenti spingerebbe altrimenti il blocco oltre l’obiettivo,
  OpenClaw preserva quel blocco di strumenti in sospeso e mantiene intatta la coda non riassunta.
- I blocchi di chiamata agli strumenti interrotti/in errore non mantengono aperta una divisione in sospeso.

---

## Quando avviene la Compaction automatica (runtime Pi)

Nell’agente Pi incorporato, la Compaction automatica si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, e varianti simili modellate sul provider) → compact → retry.
2. **Manutenzione per soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per i prompt + il prossimo output del modello

Queste sono semantiche del runtime Pi (OpenClaw consuma gli eventi, ma è Pi a decidere quando eseguire la Compaction).

---

## Impostazioni di Compaction (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di Compaction di Pi si trovano nelle impostazioni di Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applica anche una soglia minima di sicurezza per le esecuzioni incorporate:

- Se `compaction.reserveTokens < reserveTokensFloor`, OpenClaw la aumenta.
- La soglia minima predefinita è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare la soglia minima.
- Se è già più alta, OpenClaw la lascia invariata.
- `/compact` manuale rispetta un valore esplicito di `agents.defaults.compaction.keepRecentTokens`
  e mantiene il punto di taglio della coda recente di Pi. Senza un budget keep esplicito,
  la Compaction manuale rimane un checkpoint rigido e il contesto ricostruito inizia
  dal nuovo riepilogo.

Perché: lasciare abbastanza margine per attività di “manutenzione” multi-turno (come le scritture in memoria) prima che la Compaction diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamata da `src/agents/pi-embedded-runner.ts`).

---

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` nell’API del plugin. Quando `agents.defaults.compaction.provider` è impostato su un id provider registrato, l’estensione safeguard delega il riepilogo a quel provider invece che alla pipeline incorporata `summarizeInStages`.

- `provider`: id di un Plugin provider di Compaction registrato. Lascia non impostato per il riepilogo LLM predefinito.
- Impostare un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa policy di preservazione degli identificatori del percorso incorporato.
- Il safeguard preserva comunque il contesto del suffisso dei turni recenti e dei turni divisi dopo l’output del provider.
- Il riepilogo safeguard incorporato distilla nuovamente i riepiloghi precedenti con i nuovi messaggi
  invece di preservare integralmente il riepilogo precedente alla lettera.
- La modalità safeguard abilita per impostazione predefinita i controlli di qualità del riepilogo; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di nuovo tentativo su output malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw torna automaticamente al riepilogo LLM incorporato.
- I segnali di interruzione/timeout vengono rilanciati (non soppressi) per rispettare l’annullamento richiesto dal chiamante.

Fonte: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfici visibili all’utente

Puoi osservare la Compaction e lo stato della sessione tramite:

- `/status` (in qualsiasi sessione di chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modalità verbose: `🧹 Auto-compaction complete` + conteggio della Compaction

---

## Manutenzione silenziosa (`NO_REPLY`)

OpenClaw supporta turni “silenziosi” per attività in background in cui l’utente non dovrebbe vedere output intermedi.

Convenzione:

- L’assistente inizia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare “non consegnare una risposta all’utente”.
- OpenClaw lo rimuove/lo sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto non distingue tra maiuscole e minuscole, quindi `NO_REPLY` e
  `no_reply` valgono entrambi quando l’intero payload è solo il token silenzioso.
- Questo serve solo per veri turni in background/senza consegna; non è una scorciatoia per
  normali richieste utente attuabili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming bozza/digitazione** quando un
blocco parziale inizia con `NO_REPLY`, così le operazioni silenziose non fanno trapelare
output parziale a metà turno.

---

## "Flush della memoria" pre-Compaction (implementato)

Obiettivo: prima che avvenga la Compaction automatica, eseguire un turno agentico silenzioso che scriva
stato durevole su disco (ad esempio `memory/YYYY-MM-DD.md` nell’area di lavoro dell’agente) in modo che la Compaction non possa
cancellare il contesto critico.

OpenClaw usa l’approccio di **flush pre-soglia**:

1. Monitora l’uso del contesto della sessione.
2. Quando supera una “soglia morbida” (inferiore alla soglia di Compaction di Pi), esegue una direttiva silenziosa
   “scrivi ora in memoria” verso l’agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l’utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema aggiuntivo accodato per il turno di flush)

Note:

- Il prompt/system prompt predefinito include un suggerimento `NO_REPLY` per sopprimere
  la consegna.
- Il flush viene eseguito una volta per ciclo di Compaction (tracciato in `sessions.json`).
- Il flush viene eseguito solo per le sessioni Pi incorporate (i backend CLI lo saltano).
- Il flush viene saltato quando l’area di lavoro della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memoria](/it/concepts/memory) per il layout dei file dell’area di lavoro e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell’API delle estensioni, ma oggi la logica di
flush di OpenClaw si trova dal lato Gateway.

---

## Checklist di risoluzione dei problemi

- Chiave di sessione errata? Inizia da [/concepts/session](/it/concepts/session) e conferma la `sessionKey` in `/status`.
- Disallineamento tra archivio e trascrizione? Conferma l’host Gateway e il percorso dell’archivio da `openclaw status`.
- Spam di Compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto per la finestra del modello può causare una Compaction anticipata)
  - gonfiore di tool-result: abilita/regola la potatura delle sessioni
- I turni silenziosi trapelano? Conferma che la risposta inizi con `NO_REPLY` (token esatto case-insensitive) e che tu stia usando una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
