---
read_when:
    - Vuoi capire come OpenClaw assembla il contesto del modello
    - Stai passando dal motore legacy a un motore Plugin
    - Stai creando un Plugin del motore di contesto
sidebarTitle: Context engine
summary: 'Motore di contesto: assemblaggio del contesto collegabile, Compaction e ciclo di vita dei sottoagenti'
title: Motore di contesto
x-i18n:
    generated_at: "2026-04-26T11:26:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

Un **motore di contesto** controlla il modo in cui OpenClaw costruisce il contesto del modello per ogni esecuzione: quali messaggi includere, come riassumere la cronologia meno recente e come gestire il contesto attraverso i confini dei sottoagenti.

OpenClaw include un motore integrato `legacy` e lo usa per impostazione predefinita: la maggior parte degli utenti non deve mai cambiarlo. Installa e seleziona un motore Plugin solo quando vuoi un diverso comportamento di assemblaggio, Compaction o richiamo tra sessioni.

## Avvio rapido

<Steps>
  <Step title="Controlla quale motore è attivo">
    ```bash
    openclaw doctor
    # oppure ispeziona direttamente la configurazione:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installa un motore Plugin">
    I Plugin del motore di contesto si installano come qualsiasi altro Plugin OpenClaw.

    <Tabs>
      <Tab title="Da npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Da un percorso locale">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Abilita e seleziona il motore">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // deve corrispondere all'id del motore registrato dal Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // La configurazione specifica del Plugin va qui (vedi la documentazione del Plugin)
          },
        },
      },
    }
    ```

    Riavvia il Gateway dopo l'installazione e la configurazione.

  </Step>
  <Step title="Torna a legacy (facoltativo)">
    Imposta `contextEngine` su `"legacy"` (oppure rimuovi completamente la chiave — `"legacy"` è il valore predefinito).
  </Step>
</Steps>

## Come funziona

Ogni volta che OpenClaw esegue un prompt del modello, il motore di contesto partecipa in quattro punti del ciclo di vita:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Chiamato quando un nuovo messaggio viene aggiunto alla sessione. Il motore può archiviare o indicizzare il messaggio nel proprio archivio dati.
  </Accordion>
  <Accordion title="2. Assemble">
    Chiamato prima di ogni esecuzione del modello. Il motore restituisce un insieme ordinato di messaggi (e un eventuale `systemPromptAddition`) che rientrano nel budget di token.
  </Accordion>
  <Accordion title="3. Compact">
    Chiamato quando la finestra di contesto è piena o quando l'utente esegue `/compact`. Il motore riassume la cronologia meno recente per liberare spazio.
  </Accordion>
  <Accordion title="4. Dopo il turno">
    Chiamato dopo il completamento di un'esecuzione. Il motore può rendere persistente lo stato, attivare Compaction in background o aggiornare gli indici.
  </Accordion>
</AccordionGroup>

Per l'harness Codex non-ACP incluso, OpenClaw applica lo stesso ciclo di vita proiettando il contesto assemblato nelle istruzioni sviluppatore di Codex e nel prompt del turno corrente. Codex continua comunque a gestire la propria cronologia nativa del thread e il proprio compattatore nativo.

### Ciclo di vita del sottoagente (facoltativo)

OpenClaw chiama due hook facoltativi del ciclo di vita del sottoagente:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara lo stato del contesto condiviso prima che inizi un'esecuzione figlia. L'hook riceve chiavi di sessione padre/figlio, `contextMode` (`isolated` o `fork`), ID/file di trascrizione disponibili e TTL facoltativo. Se restituisce un handle di rollback, OpenClaw lo chiama quando lo spawn fallisce dopo che la preparazione è riuscita.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Esegue la pulizia quando una sessione di sottoagente viene completata o rimossa.
</ParamField>

### Aggiunta al prompt di sistema

Il metodo `assemble` può restituire una stringa `systemPromptAddition`. OpenClaw la antepone al prompt di sistema per l'esecuzione. Questo consente ai motori di iniettare indicazioni dinamiche di richiamo, istruzioni di recupero o suggerimenti sensibili al contesto senza richiedere file statici nel workspace.

## Il motore legacy

Il motore integrato `legacy` preserva il comportamento originale di OpenClaw:

- **Ingest**: no-op (il gestore di sessione si occupa direttamente della persistenza dei messaggi).
- **Assemble**: pass-through (la pipeline esistente sanitize → validate → limit nel runtime gestisce l'assemblaggio del contesto).
- **Compact**: delega alla Compaction di riepilogo integrata, che crea un singolo riepilogo dei messaggi meno recenti e mantiene intatti i messaggi recenti.
- **Dopo il turno**: no-op.

Il motore legacy non registra strumenti e non fornisce `systemPromptAddition`.

Quando `plugins.slots.contextEngine` non è impostato (oppure è impostato su `"legacy"`), questo motore viene usato automaticamente.

## Motori Plugin

Un Plugin può registrare un motore di contesto usando l'API Plugin:

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
      // Archivia il messaggio nel tuo archivio dati
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Restituisce i messaggi che rientrano nel budget
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
      // Riassume il contesto meno recente
      return { ok: true, compacted: true };
    },
  }));
}
```

Poi abilitalo nella configurazione:

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

Membri obbligatori:

| Membro             | Tipo     | Scopo                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Proprietà | ID, nome, versione del motore e se gestisce Compaction |
| `ingest(params)`   | Metodo   | Archivia un singolo messaggio                            |
| `assemble(params)` | Metodo   | Costruisce il contesto per un'esecuzione del modello (restituisce `AssembleResult`) |
| `compact(params)`  | Metodo   | Riassume/riduce il contesto                              |

`assemble` restituisce un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  I messaggi ordinati da inviare al modello.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La stima del motore del totale dei token nel contesto assemblato. OpenClaw la usa per decisioni sulla soglia di Compaction e per la reportistica diagnostica.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Anteposto al prompt di sistema.
</ParamField>

Membri facoltativi:

| Membro                         | Tipo   | Scopo                                                                                                         |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metodo | Inizializza lo stato del motore per una sessione. Chiamato una volta quando il motore vede una sessione per la prima volta (ad esempio, importa la cronologia). |
| `ingestBatch(params)`          | Metodo | Acquisisce un turno completato come batch. Chiamato dopo il completamento di un'esecuzione, con tutti i messaggi di quel turno in una volta sola. |
| `afterTurn(params)`            | Metodo | Lavoro del ciclo di vita post-esecuzione (rendere persistente lo stato, attivare Compaction in background). |
| `prepareSubagentSpawn(params)` | Metodo | Imposta lo stato condiviso per una sessione figlia prima che inizi.                                          |
| `onSubagentEnded(params)`      | Metodo | Esegue la pulizia dopo la fine di un sottoagente.                                                            |
| `dispose()`                    | Metodo | Rilascia le risorse. Chiamato durante lo spegnimento del Gateway o il ricaricamento del Plugin — non per sessione. |

### ownsCompaction

`ownsCompaction` controlla se la auto-Compaction integrata di Pi durante il tentativo resta abilitata per l'esecuzione:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Il motore possiede il comportamento di Compaction. OpenClaw disabilita l'auto-Compaction integrata di Pi per quell'esecuzione e l'implementazione `compact()` del motore è responsabile di `/compact`, della Compaction di recupero da overflow e di qualsiasi Compaction proattiva che voglia eseguire in `afterTurn()`. OpenClaw può comunque eseguire la protezione pre-prompt contro l'overflow; quando prevede che la trascrizione completa provocherà overflow, il percorso di recupero chiama `compact()` del motore attivo prima di inviare un altro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false o non impostato">
    L'auto-Compaction integrata di Pi può comunque essere eseguita durante l'esecuzione del prompt, ma il metodo `compact()` del motore attivo viene comunque chiamato per `/compact` e per il recupero da overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **non** significa che OpenClaw torni automaticamente al percorso di Compaction del motore legacy.
</Warning>

Questo significa che esistono due pattern Plugin validi:

<Tabs>
  <Tab title="Modalità proprietaria">
    Implementa il tuo algoritmo di Compaction e imposta `ownsCompaction: true`.
  </Tab>
  <Tab title="Modalità delegata">
    Imposta `ownsCompaction: false` e fai in modo che `compact()` chiami `delegateCompactionToRuntime(...)` da `openclaw/plugin-sdk/core` per usare il comportamento di Compaction integrato di OpenClaw.
  </Tab>
</Tabs>

Un `compact()` no-op non è sicuro per un motore attivo non proprietario perché disabilita il normale percorso di Compaction `/compact` e di recupero da overflow per quello slot del motore.

## Riferimento della configurazione

```json5
{
  plugins: {
    slots: {
      // Seleziona il motore di contesto attivo. Predefinito: "legacy".
      // Imposta un ID Plugin per usare un motore Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Lo slot è esclusivo a runtime: per una determinata esecuzione o operazione di Compaction viene risolto un solo motore di contesto registrato. Altri Plugin abilitati `kind: "context-engine"` possono comunque essere caricati ed eseguire il loro codice di registrazione; `plugins.slots.contextEngine` seleziona solo quale ID motore registrato OpenClaw risolve quando ha bisogno di un motore di contesto.
</Note>

<Note>
**Disinstallazione del Plugin:** quando disinstalli il Plugin attualmente selezionato come `plugins.slots.contextEngine`, OpenClaw reimposta lo slot al valore predefinito (`legacy`). Lo stesso comportamento di reset si applica a `plugins.slots.memory`. Non è richiesta alcuna modifica manuale della configurazione.
</Note>

## Relazione con Compaction e memoria

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction è una delle responsabilità del motore di contesto. Il motore legacy delega al riepilogo integrato di OpenClaw. I motori Plugin possono implementare qualsiasi strategia di Compaction (riepiloghi DAG, recupero vettoriale, ecc.).
  </Accordion>
  <Accordion title="Plugin di memoria">
    I Plugin di memoria (`plugins.slots.memory`) sono separati dai motori di contesto. I Plugin di memoria forniscono ricerca/recupero; i motori di contesto controllano ciò che il modello vede. Possono lavorare insieme — un motore di contesto potrebbe usare i dati del Plugin di memoria durante l'assemblaggio. I motori Plugin che vogliono il percorso di prompt della memoria attiva dovrebbero preferire `buildMemorySystemPromptAddition(...)` da `openclaw/plugin-sdk/core`, che converte le sezioni del prompt della memoria attiva in un `systemPromptAddition` pronto da anteporre. Se un motore ha bisogno di un controllo di livello inferiore, può comunque recuperare righe grezze da `openclaw/plugin-sdk/memory-host-core` tramite `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Potatura della sessione">
    Il trimming dei vecchi risultati degli strumenti in memoria continua a essere eseguito indipendentemente da quale motore di contesto sia attivo.
  </Accordion>
</AccordionGroup>

## Suggerimenti

- Usa `openclaw doctor` per verificare che il tuo motore venga caricato correttamente.
- Se cambi motore, le sessioni esistenti continuano con la loro cronologia attuale. Il nuovo motore subentra per le esecuzioni future.
- Gli errori del motore vengono registrati nei log e mostrati nella diagnostica. Se un motore Plugin non riesce a registrarsi o l'ID del motore selezionato non può essere risolto, OpenClaw non esegue fallback automatico; le esecuzioni falliscono finché non correggi il Plugin o non riporti `plugins.slots.contextEngine` a `"legacy"`.
- Per lo sviluppo, usa `openclaw plugins install -l ./my-engine` per collegare una directory Plugin locale senza copiarla.

## Correlati

- [Compaction](/it/concepts/compaction) — riepilogo delle conversazioni lunghe
- [Contesto](/it/concepts/context) — come viene costruito il contesto per i turni dell'agente
- [Architettura Plugin](/it/plugins/architecture) — registrazione dei Plugin del motore di contesto
- [Manifest Plugin](/it/plugins/manifest) — campi del manifest del Plugin
- [Plugin](/it/tools/plugin) — panoramica dei Plugin
