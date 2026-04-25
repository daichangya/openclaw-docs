---
read_when:
    - Vuoi capire come OpenClaw assembla il contesto del modello
    - Stai passando dal motore legacy a un motore Plugin
    - Stai creando un Plugin del motore di contesto
summary: 'Motore di contesto: assemblaggio del contesto collegabile, Compaction e ciclo di vita dei subagenti'
title: Motore di contesto
x-i18n:
    generated_at: "2026-04-25T13:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

Un **motore di contesto** controlla come OpenClaw costruisce il contesto del modello per ogni esecuzione:
quali messaggi includere, come riassumere la cronologia meno recente e come gestire
il contesto attraverso i confini dei subagenti.

OpenClaw include un motore `legacy` integrato e lo usa per impostazione predefinita: la maggior parte
degli utenti non deve mai cambiarlo. Installa e seleziona un motore Plugin solo quando
vuoi un comportamento diverso per assemblaggio, Compaction o richiamo tra sessioni.

## Avvio rapido

Controlla quale motore è attivo:

```bash
openclaw doctor
# oppure ispeziona direttamente la configurazione:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Installazione di un Plugin motore di contesto

I Plugin motore di contesto vengono installati come qualsiasi altro Plugin OpenClaw. Installa
prima il Plugin, poi seleziona il motore nello slot:

```bash
# Installa da npm
openclaw plugins install @martian-engineering/lossless-claw

# Oppure installa da un percorso locale (per sviluppo)
openclaw plugins install -l ./my-context-engine
```

Quindi abilita il Plugin e selezionalo come motore attivo nella tua configurazione:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // deve corrispondere all'id del motore registrato dal plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // La configurazione specifica del Plugin va qui (vedi la documentazione del plugin)
      },
    },
  },
}
```

Riavvia il gateway dopo l'installazione e la configurazione.

Per tornare al motore integrato, imposta `contextEngine` su `"legacy"` (oppure
rimuovi completamente la chiave: `"legacy"` è il valore predefinito).

## Come funziona

Ogni volta che OpenClaw esegue un prompt del modello, il motore di contesto partecipa in
quattro punti del ciclo di vita:

1. **Ingest** — chiamato quando un nuovo messaggio viene aggiunto alla sessione. Il motore
   può memorizzare o indicizzare il messaggio nel proprio archivio dati.
2. **Assemble** — chiamato prima di ogni esecuzione del modello. Il motore restituisce un insieme
   ordinato di messaggi (e un eventuale `systemPromptAddition`) che rientrano
   nel budget di token.
3. **Compact** — chiamato quando la finestra di contesto è piena o quando l'utente esegue
   `/compact`. Il motore riassume la cronologia meno recente per liberare spazio.
4. **After turn** — chiamato dopo il completamento di un'esecuzione. Il motore può persistere lo stato,
   attivare una Compaction in background o aggiornare gli indici.

Per l'harness Codex non-ACP incluso, OpenClaw applica lo stesso ciclo di vita proiettando il
contesto assemblato nelle istruzioni sviluppatore di Codex e nel prompt del turno corrente. Codex
continua comunque a gestire la propria cronologia nativa dei thread e il proprio compattatore nativo.

### Ciclo di vita del subagente (facoltativo)

OpenClaw chiama due hook facoltativi del ciclo di vita del subagente:

- **prepareSubagentSpawn** — prepara lo stato del contesto condiviso prima che inizi
  un'esecuzione figlia. L'hook riceve le chiavi di sessione genitore/figlio, `contextMode`
  (`isolated` o `fork`), gli id/file di trascrizione disponibili e un TTL facoltativo.
  Se restituisce un handle di rollback, OpenClaw lo chiama quando lo spawn fallisce dopo
  che la preparazione è riuscita.
- **onSubagentEnded** — esegue la pulizia quando una sessione subagente termina o viene rimossa.

### Aggiunta al system prompt

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw
la antepone al system prompt dell'esecuzione. Questo consente ai motori di iniettare
indicazioni dinamiche di richiamo, istruzioni di retrieval o suggerimenti consapevoli del contesto
senza richiedere file statici del workspace.

## Il motore legacy

Il motore `legacy` integrato preserva il comportamento originale di OpenClaw:

- **Ingest**: no-op (il gestore di sessione gestisce direttamente la persistenza dei messaggi).
- **Assemble**: pass-through (la pipeline esistente sanitize → validate → limit
  nel runtime gestisce l'assemblaggio del contesto).
- **Compact**: delega alla Compaction di riepilogo integrata, che crea
  un singolo riepilogo dei messaggi meno recenti e mantiene intatti i messaggi recenti.
- **After turn**: no-op.

Il motore legacy non registra strumenti e non fornisce `systemPromptAddition`.

Quando `plugins.slots.contextEngine` non è impostato (oppure è impostato su `"legacy"`), questo
motore viene usato automaticamente.

## Motori Plugin

Un Plugin può registrare un motore di contesto usando l'API del plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Quindi abilitalo nella configurazione:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### L'interfaccia ContextEngine

Membri richiesti:

| Membro             | Tipo proprietà | Scopo                                                    |
| ------------------ | -------------- | -------------------------------------------------------- |
| `info`             | Proprietà      | Id, nome, versione del motore e se possiede la Compaction |
| `ingest(params)`   | Metodo         | Memorizza un singolo messaggio                           |
| `assemble(params)` | Metodo         | Costruisce il contesto per un'esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Metodo         | Riassume/riduce il contesto                              |

`assemble` restituisce un `AssembleResult` con:

- `messages` — i messaggi ordinati da inviare al modello.
- `estimatedTokens` (obbligatorio, `number`) — la stima del motore del totale
  dei token nel contesto assemblato. OpenClaw la usa per le decisioni sulla soglia di Compaction
  e per la reportistica diagnostica.
- `systemPromptAddition` (facoltativo, `string`) — anteposto al system prompt.

Membri facoltativi:

| Membro                         | Tipo   | Scopo                                                                                                              |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------ |
| `bootstrap(params)`            | Metodo | Inizializza lo stato del motore per una sessione. Chiamato una volta quando il motore vede una sessione per la prima volta (ad esempio importando la cronologia). |
| `ingestBatch(params)`          | Metodo | Ingerisce un turno completato come batch. Chiamato dopo il completamento di un'esecuzione, con tutti i messaggi di quel turno in una volta sola. |
| `afterTurn(params)`            | Metodo | Attività del ciclo di vita post-esecuzione (persistenza dello stato, attivazione della Compaction in background). |
| `prepareSubagentSpawn(params)` | Metodo | Configura lo stato condiviso per una sessione figlia prima che inizi.                                              |
| `onSubagentEnded(params)`      | Metodo | Esegue la pulizia dopo la fine di un subagente.                                                                    |
| `dispose()`                    | Metodo | Rilascia risorse. Chiamato durante l'arresto del gateway o il ricaricamento del Plugin, non per sessione.        |

### ownsCompaction

`ownsCompaction` controlla se l'auto-Compaction integrata di Pi durante il tentativo resta
abilitata per l'esecuzione:

- `true` — il motore gestisce il comportamento di Compaction. OpenClaw disabilita l'auto-Compaction
  integrata di Pi per quell'esecuzione, e l'implementazione `compact()` del motore è
  responsabile di `/compact`, della Compaction di recupero da overflow e di qualsiasi Compaction
  proattiva voglia eseguire in `afterTurn()`. OpenClaw può comunque eseguire la
  protezione pre-prompt contro l'overflow; quando prevede che la trascrizione completa
  andrà in overflow, il percorso di recupero chiama `compact()` del motore attivo prima
  di inviare un altro prompt.
- `false` o non impostato — l'auto-Compaction integrata di Pi può ancora essere eseguita durante l'esecuzione
  del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per
  `/compact` e per il recupero da overflow.

`ownsCompaction: false` **non** significa che OpenClaw torni automaticamente
al percorso di Compaction del motore legacy.

Questo significa che esistono due modelli validi di Plugin:

- **Modalità proprietaria** — implementa il tuo algoritmo di Compaction e imposta
  `ownsCompaction: true`.
- **Modalità delegata** — imposta `ownsCompaction: false` e fai in modo che `compact()` chiami
  `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per usare
  il comportamento di Compaction integrato di OpenClaw.

Un `compact()` no-op non è sicuro per un motore attivo non proprietario perché
disabilita il normale percorso di Compaction per `/compact` e per il recupero da overflow per quello
slot motore.

## Riferimento configurazione

```json5
{
  plugins: {
    slots: {
      // Seleziona il motore di contesto attivo. Predefinito: "legacy".
      // Imposta un id plugin per usare un motore Plugin.
      contextEngine: "legacy",
    },
  },
}
```

Lo slot è esclusivo a runtime: per una determinata esecuzione o operazione di Compaction
viene risolto un solo motore di contesto registrato. Altri
Plugin `kind: "context-engine"` abilitati possono comunque caricarsi ed eseguire il proprio codice
di registrazione; `plugins.slots.contextEngine` seleziona solo quale id motore registrato
OpenClaw risolve quando ha bisogno di un motore di contesto.

## Relazione con Compaction e memoria

- **Compaction** è una delle responsabilità del motore di contesto. Il motore legacy
  delega al riepilogo integrato di OpenClaw. I motori Plugin possono implementare
  qualsiasi strategia di Compaction (riepiloghi DAG, vector retrieval, ecc.).
- **Plugin di memoria** (`plugins.slots.memory`) sono separati dai motori di contesto.
  I Plugin di memoria forniscono search/retrieval; i motori di contesto controllano ciò che
  il modello vede. Possono lavorare insieme: un motore di contesto potrebbe usare dati
  del Plugin di memoria durante l'assemblaggio. I motori Plugin che vogliono il percorso
  del prompt di memoria attiva dovrebbero preferire `buildMemorySystemPromptAddition(...)` da
  `openclaw/plugin-sdk/core`, che converte le sezioni attive del prompt di memoria
  in un `systemPromptAddition` pronto da anteporre. Se un motore ha bisogno di un controllo
  di livello inferiore, può comunque ottenere righe grezze da
  `openclaw/plugin-sdk/memory-host-core` tramite
  `buildActiveMemoryPromptSection(...)`.
- **Session pruning** (rimozione in memoria dei vecchi risultati degli strumenti) continua a essere eseguito
  indipendentemente dal motore di contesto attivo.

## Suggerimenti

- Usa `openclaw doctor` per verificare che il tuo motore venga caricato correttamente.
- Se cambi motore, le sessioni esistenti continuano con la loro cronologia corrente.
  Il nuovo motore prende il controllo per le esecuzioni future.
- Gli errori del motore vengono registrati nei log e mostrati nella diagnostica. Se un motore Plugin
  non riesce a registrarsi o l'id del motore selezionato non può essere risolto, OpenClaw
  non esegue fallback automatici; le esecuzioni falliscono finché non correggi il Plugin oppure
  non riporti `plugins.slots.contextEngine` a `"legacy"`.
- Per lo sviluppo, usa `openclaw plugins install -l ./my-engine` per collegare una
  directory locale del Plugin senza copiarla.

Vedi anche: [Compaction](/it/concepts/compaction), [Contesto](/it/concepts/context),
[Plugin](/it/tools/plugin), [Manifest del Plugin](/it/plugins/manifest).

## Correlati

- [Contesto](/it/concepts/context) — come viene costruito il contesto per i turni dell'agente
- [Architettura dei Plugin](/it/plugins/architecture) — registrazione dei Plugin motore di contesto
- [Compaction](/it/concepts/compaction) — riepilogo delle conversazioni lunghe
