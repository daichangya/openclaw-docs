---
read_when:
    - Hai bisogno di eseguire il debug degli ID sessione, del JSONL delle trascrizioni o dei campi di sessions.json
    - Stai modificando il comportamento di Compaction automatica o aggiungendo operazioni preliminari di housekeeping prima della Compaction
    - Vuoi implementare svuotamenti della memoria o turni di sistema silenziosi
summary: 'Approfondimento: archivio delle sessioni + trascrizioni, ciclo di vita e meccanismi interni di Compaction (automatica)'
title: Approfondimento sulla gestione delle sessioni
x-i18n:
    generated_at: "2026-04-26T11:38:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Questa pagina spiega come OpenClaw gestisce le sessioni end-to-end:

- **Instradamento della sessione** (come i messaggi in ingresso vengono mappati a un `sessionKey`)
- **Archivio delle sessioni** (`sessions.json`) e cosa tiene traccia
- **Persistenza della trascrizione** (`*.jsonl`) e la sua struttura
- **Igiene della trascrizione** (correzioni specifiche del provider prima delle esecuzioni)
- **Limiti di contesto** (finestra di contesto vs token tracciati)
- **Compaction** (Compaction manuale + automatica) e dove collegare il lavoro pre-Compaction
- **Housekeeping silenzioso** (ad esempio, scritture in memoria che non dovrebbero produrre output visibile all'utente)

Se vuoi prima una panoramica di livello più alto, inizia da:

- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Sfoltimento delle sessioni](/it/concepts/session-pruning)
- [Igiene della trascrizione](/it/reference/transcript-hygiene)

---

## Fonte di verità: il Gateway

OpenClaw è progettato attorno a un singolo **processo Gateway** che possiede lo stato della sessione.

- Le interfacce utente (app macOS, interfaccia web Control UI, TUI) dovrebbero interrogare il Gateway per ottenere elenchi di sessioni e conteggi di token.
- In modalità remota, i file di sessione si trovano sull'host remoto; “controllare i file sul Mac locale” non rifletterà ciò che il Gateway sta usando.

---

## Due livelli di persistenza

OpenClaw persiste le sessioni su due livelli:

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

Per agente, sull'host Gateway:

- Archivio: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Trascrizioni: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessioni argomento Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw le risolve tramite `src/config/sessions.ts`.

---

## Manutenzione dell'archivio e controlli del disco

La persistenza delle sessioni dispone di controlli di manutenzione automatica (`session.maintenance`) per `sessions.json` e gli artefatti delle trascrizioni:

- `mode`: `warn` (predefinito) o `enforce`
- `pruneAfter`: soglia di età delle voci obsolete (predefinito `30d`)
- `maxEntries`: limite massimo di voci in `sessions.json` (predefinito `500`)
- `rotateBytes`: ruota `sessions.json` quando è troppo grande (predefinito `10mb`)
- `resetArchiveRetention`: retention per gli archivi di trascrizione `*.reset.<timestamp>` (predefinito: uguale a `pruneAfter`; `false` disabilita la pulizia)
- `maxDiskBytes`: budget opzionale per la directory delle sessioni
- `highWaterBytes`: obiettivo opzionale dopo la pulizia (predefinito `80%` di `maxDiskBytes`)

Ordine di applicazione per la pulizia del budget disco (`mode: "enforce"`):

1. Rimuove prima gli artefatti di trascrizione archiviati o orfani più vecchi.
2. Se è ancora sopra l'obiettivo, espelle le voci di sessione più vecchie e i relativi file di trascrizione.
3. Continua finché l'utilizzo non è pari o inferiore a `highWaterBytes`.

In `mode: "warn"`, OpenClaw segnala le potenziali espulsioni ma non modifica archivio/file.

Esegui la manutenzione su richiesta:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessioni Cron e log delle esecuzioni

Anche le esecuzioni Cron isolate creano voci/trascrizioni di sessione e dispongono di controlli di retention dedicati:

- `cron.sessionRetention` (predefinito `24h`) elimina le vecchie sessioni isolate delle esecuzioni Cron dall'archivio delle sessioni (`false` disabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` sfoltiscono i file `~/.openclaw/cron/runs/<jobId>.jsonl` (predefiniti: `2_000_000` byte e `2000` righe).

Quando Cron forza la creazione di una nuova sessione di esecuzione isolata, sanifica la voce di sessione precedente
`cron:<jobId>` prima di scrivere la nuova riga. Mantiene preferenze
sicure come impostazioni di thinking/fast/verbose, etichette e override espliciti
di modello/autenticazione selezionati dall'utente. Elimina il contesto di conversazione ambientale
come instradamento canale/gruppo, criterio di invio o accodamento, elevazione, origine e binding runtime ACP
così una nuova esecuzione isolata non può ereditare consegna o
autorità runtime obsolete da un'esecuzione precedente.

---

## Chiavi di sessione (`sessionKey`)

Un `sessionKey` identifica *in quale bucket di conversazione* ti trovi (instradamento + isolamento).

Schemi comuni:

- Chat principale/diretta (per agente): `agent:<agentId>:<mainKey>` (predefinito `main`)
- Gruppo: `agent:<agentId>:<channel>:group:<id>`
- Stanza/canale (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (salvo override)

Le regole canoniche sono documentate in [/concepts/session](/it/concepts/session).

---

## ID sessione (`sessionId`)

Ogni `sessionKey` punta a un `sessionId` corrente (il file di trascrizione che continua la conversazione).

Regole pratiche:

- **Reset** (`/new`, `/reset`) crea un nuovo `sessionId` per quel `sessionKey`.
- **Reset giornaliero** (predefinito 4:00 AM ora locale sull'host gateway) crea un nuovo `sessionId` al messaggio successivo dopo il confine di reset.
- **Scadenza per inattività** (`session.reset.idleMinutes` o legacy `session.idleMinutes`) crea un nuovo `sessionId` quando arriva un messaggio dopo la finestra di inattività. Quando giornaliero + inattività sono entrambi configurati, prevale quello che scade per primo.
- **Eventi di sistema** (Heartbeat, risvegli Cron, notifiche exec, bookkeeping del gateway) possono modificare la riga di sessione ma non estendono la freschezza del reset giornaliero/per inattività. Il rollover del reset elimina le notifiche di eventi di sistema accodate per la sessione precedente prima che venga costruito il nuovo prompt.
- **Protezione fork del genitore del thread** (`session.parentForkMaxTokens`, predefinito `100000`) salta il fork della trascrizione del genitore quando la sessione genitore è già troppo grande; il nuovo thread parte da zero. Imposta `0` per disabilitare.

Dettaglio implementativo: la decisione avviene in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema dell'archivio delle sessioni (`sessions.json`)

Il tipo valore dell'archivio è `SessionEntry` in `src/config/sessions.ts`.

Campi chiave (non esaustivi):

- `sessionId`: id della trascrizione corrente (il nome file deriva da questo salvo che sia impostato `sessionFile`)
- `sessionStartedAt`: timestamp di inizio per il `sessionId` corrente; la freschezza del reset giornaliero
  usa questo. Le righe legacy possono derivarlo dall'header della sessione JSONL.
- `lastInteractionAt`: timestamp dell'ultima reale interazione utente/canale; la freschezza del reset per inattività
  usa questo così Heartbeat, Cron ed eventi exec non mantengono vive le sessioni.
  Le righe legacy senza questo campo ricadono sull'orario di inizio sessione recuperato
  per la freschezza di inattività.
- `updatedAt`: timestamp dell'ultima modifica della riga dell'archivio, usato per elenco, sfoltimento e
  bookkeeping. Non è l'autorità per la freschezza del reset giornaliero/per inattività.
- `sessionFile`: override opzionale esplicito del percorso della trascrizione
- `chatType`: `direct | group | room` (aiuta interfacce utente e criterio di invio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadati per etichettatura di gruppo/canale
- Interruttori:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessione)
- Selezione del modello:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contatori di token (best-effort / dipendenti dal provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quante volte la Compaction automatica è stata completata per questa chiave di sessione
- `memoryFlushAt`: timestamp dell'ultimo flush della memoria pre-Compaction
- `memoryFlushCompactionCount`: conteggio di Compaction quando è stato eseguito l'ultimo flush

L'archivio è sicuro da modificare, ma il Gateway è l'autorità: può riscrivere o reidratare le voci durante l'esecuzione delle sessioni.

---

## Struttura della trascrizione (`*.jsonl`)

Le trascrizioni sono gestite dal `SessionManager` di `@mariozechner/pi-coding-agent`.

Il file è JSONL:

- Prima riga: header della sessione (`type: "session"`, include `id`, `cwd`, `timestamp`, opzionale `parentSession`)
- Poi: voci della sessione con `id` + `parentId` (albero)

Tipi di voce notevoli:

- `message`: messaggi user/assistant/toolResult
- `custom_message`: messaggi inseriti dalle estensioni che *entrano* nel contesto del modello (possono essere nascosti dall'interfaccia utente)
- `custom`: stato dell'estensione che *non entra* nel contesto del modello
- `compaction`: riepilogo di Compaction persistito con `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: riepilogo persistito durante la navigazione di un ramo dell'albero

OpenClaw intenzionalmente **non** “corregge” le trascrizioni; il Gateway usa `SessionManager` per leggerle/scriverle.

---

## Finestre di contesto vs token tracciati

Contano due concetti diversi:

1. **Finestra di contesto del modello**: limite rigido per modello (token visibili al modello)
2. **Contatori dell'archivio delle sessioni**: statistiche progressive scritte in `sessions.json` (usate per /status e dashboard)

Se stai regolando i limiti:

- La finestra di contesto proviene dal catalogo modelli (e può essere sovrascritta tramite configurazione).
- `contextTokens` nell'archivio è un valore di stima/reporting a runtime; non trattarlo come una garanzia rigorosa.

Per saperne di più, vedi [/token-use](/it/reference/token-use).

---

## Compaction: cos'è

Compaction riassume la conversazione meno recente in una voce `compaction` persistita nella trascrizione e mantiene intatti i messaggi recenti.

Dopo la Compaction, i turni futuri vedono:

- Il riepilogo di Compaction
- I messaggi dopo `firstKeptEntryId`

La Compaction è **persistente** (a differenza dello sfoltimento della sessione). Vedi [/concepts/session-pruning](/it/concepts/session-pruning).

## Confini dei blocchi di Compaction e accoppiamento degli strumenti

Quando OpenClaw suddivide una lunga trascrizione in blocchi di Compaction, mantiene
accoppiate le chiamate agli strumenti dell'assistente con le corrispondenti voci `toolResult`.

- Se la divisione per quota di token cade tra una chiamata a uno strumento e il suo risultato, OpenClaw
  sposta il confine al messaggio dell'assistente con la chiamata allo strumento invece di separare
  la coppia.
- Se un blocco finale di risultati di strumenti altrimenti spingerebbe il blocco oltre l'obiettivo,
  OpenClaw preserva quel blocco di strumenti in sospeso e mantiene intatta la coda non
  riassunta.
- I blocchi di chiamata a strumenti interrotti/in errore non mantengono aperta una divisione in sospeso.

---

## Quando avviene la Compaction automatica (runtime Pi)

Nell'agente Pi incorporato, la Compaction automatica si attiva in due casi:

1. **Recupero da overflow**: il modello restituisce un errore di overflow del contesto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e varianti simili modellate sul provider) → compact → retry.
2. **Manutenzione della soglia**: dopo un turno riuscito, quando:

`contextTokens > contextWindow - reserveTokens`

Dove:

- `contextWindow` è la finestra di contesto del modello
- `reserveTokens` è il margine riservato per i prompt + il prossimo output del modello

Queste sono semantiche del runtime Pi (OpenClaw consuma gli eventi, ma è Pi a decidere quando fare Compaction).

---

## Impostazioni di Compaction (`reserveTokens`, `keepRecentTokens`)

Le impostazioni di Compaction di Pi vivono nelle impostazioni di Pi:

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

- Se `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- La soglia minima predefinita è `20000` token.
- Imposta `agents.defaults.compaction.reserveTokensFloor: 0` per disabilitare la soglia minima.
- Se è già più alto, OpenClaw lo lascia invariato.
- Il comando manuale `/compact` rispetta un `agents.defaults.compaction.keepRecentTokens`
  esplicito e mantiene il punto di taglio della coda recente di Pi. Senza un budget keep esplicito,
  la Compaction manuale resta un checkpoint rigido e il contesto ricostruito parte
  dal nuovo riepilogo.

Perché: lasciare sufficiente margine per un housekeeping multi-turno (come le scritture in memoria) prima che la Compaction diventi inevitabile.

Implementazione: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(chiamato da `src/agents/pi-embedded-runner.ts`).

---

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction tramite `registerCompactionProvider()` sull'API dei plugin. Quando `agents.defaults.compaction.provider` è impostato su un id provider registrato, l'estensione safeguard delega il riepilogo a quel provider invece che alla pipeline integrata `summarizeInStages`.

- `provider`: id di un provider di Compaction registrato da un Plugin. Lascialo non impostato per il riepilogo LLM predefinito.
- L'impostazione di un `provider` forza `mode: "safeguard"`.
- I provider ricevono le stesse istruzioni di Compaction e la stessa policy di preservazione degli identificatori del percorso integrato.
- Il safeguard preserva comunque il contesto del suffisso dei turni recenti e dei turni suddivisi dopo l'output del provider.
- Il riepilogo safeguard integrato ri-distilla i riepiloghi precedenti con i nuovi messaggi
  invece di preservare integralmente il precedente riepilogo verbatim.
- La modalità safeguard abilita per impostazione predefinita i controlli di qualità del riepilogo; imposta
  `qualityGuard.enabled: false` per saltare il comportamento di retry su output malformato.
- Se il provider fallisce o restituisce un risultato vuoto, OpenClaw torna automaticamente al riepilogo LLM integrato.
- I segnali di abort/timeout vengono rilanciati (non ignorati) per rispettare la cancellazione del chiamante.

Sorgente: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superfici visibili all'utente

Puoi osservare la Compaction e lo stato della sessione tramite:

- `/status` (in qualsiasi sessione di chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modalità verbose: `🧹 Auto-compaction complete` + conteggio Compaction

---

## Housekeeping silenzioso (`NO_REPLY`)

OpenClaw supporta turni “silenziosi” per attività in background in cui l'utente non deve vedere output intermedi.

Convenzione:

- L'assistente inizia il proprio output con il token silenzioso esatto `NO_REPLY` /
  `no_reply` per indicare “non consegnare una risposta all'utente”.
- OpenClaw lo rimuove/lo sopprime nel livello di consegna.
- La soppressione del token silenzioso esatto è case-insensitive, quindi `NO_REPLY` e
  `no_reply` valgono entrambi quando l'intero payload è solo il token silenzioso.
- Questo è solo per turni realmente in background/senza consegna; non è una scorciatoia per
  normali richieste utente eseguibili.

A partire da `2026.1.10`, OpenClaw sopprime anche lo **streaming draft/typing** quando un
blocco parziale inizia con `NO_REPLY`, così le operazioni silenziose non lasciano trapelare output
parziali a metà turno.

---

## "Flush della memoria" pre-Compaction (implementato)

Obiettivo: prima che avvenga la Compaction automatica, eseguire un turno agentico silenzioso che scriva uno stato
duraturo su disco (ad esempio `memory/YYYY-MM-DD.md` nello spazio di lavoro dell'agente) così la Compaction non può
cancellare il contesto critico.

OpenClaw usa l'approccio di **flush pre-soglia**:

1. Monitora l'utilizzo del contesto della sessione.
2. Quando supera una “soglia morbida” (al di sotto della soglia di Compaction di Pi), esegue una direttiva silenziosa
   “scrivi ora nella memoria” verso l'agente.
3. Usa il token silenzioso esatto `NO_REPLY` / `no_reply` così l'utente non vede
   nulla.

Configurazione (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predefinito: `true`)
- `softThresholdTokens` (predefinito: `4000`)
- `prompt` (messaggio utente per il turno di flush)
- `systemPrompt` (prompt di sistema aggiuntivo accodato per il turno di flush)

Note:

- Il prompt/prompt di sistema predefinito include un suggerimento `NO_REPLY` per sopprimere
  la consegna.
- Il flush viene eseguito una volta per ciclo di Compaction (tracciato in `sessions.json`).
- Il flush viene eseguito solo per sessioni Pi incorporate (i backend CLI lo saltano).
- Il flush viene saltato quando lo spazio di lavoro della sessione è in sola lettura (`workspaceAccess: "ro"` o `"none"`).
- Vedi [Memory](/it/concepts/memory) per il layout dei file dello spazio di lavoro e i pattern di scrittura.

Pi espone anche un hook `session_before_compact` nell'API delle estensioni, ma oggi la logica di
flush di OpenClaw vive dal lato Gateway.

---

## Checklist per la risoluzione dei problemi

- Chiave di sessione errata? Inizia da [/concepts/session](/it/concepts/session) e conferma il `sessionKey` in `/status`.
- Mancata corrispondenza tra archivio e trascrizione? Conferma l'host Gateway e il percorso dell'archivio da `openclaw status`.
- Spam di Compaction? Controlla:
  - finestra di contesto del modello (troppo piccola)
  - impostazioni di Compaction (`reserveTokens` troppo alto per la finestra del modello può causare una Compaction anticipata)
  - crescita eccessiva dei risultati degli strumenti: abilita/regola lo sfoltimento della sessione
- Perdite dai turni silenziosi? Conferma che la risposta inizi con `NO_REPLY` (token esatto case-insensitive) e che tu stia usando una build che include la correzione della soppressione dello streaming.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Sfoltimento delle sessioni](/it/concepts/session-pruning)
- [Motore di contesto](/it/concepts/context-engine)
