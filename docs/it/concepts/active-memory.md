---
read_when:
    - Vuoi capire a cosa serve Active Memory
    - Vuoi attivare Active Memory per un agente conversazionale
    - Vuoi regolare il comportamento di Active Memory senza abilitarlo ovunque
summary: Un sottoagente di memoria bloccante gestito dal Plugin che inserisce la memoria rilevante nelle sessioni di chat interattive
title: Active Memory
x-i18n:
    generated_at: "2026-04-12T23:28:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11665dbc888b6d4dc667a47624cc1f2e4cc71e1d58e1f7d9b5fe4057ec4da108
    source_path: concepts/active-memory.md
    workflow: 15
---

# Active Memory

Active Memory è un sottoagente di memoria bloccante opzionale gestito dal Plugin che viene eseguito
prima della risposta principale per le sessioni conversazionali idonee.

Esiste perché la maggior parte dei sistemi di memoria è capace ma reattiva. Si affida
all’agente principale per decidere quando cercare nella memoria, oppure all’utente per dire cose
come "ricorda questo" o "cerca nella memoria". A quel punto, il momento in cui la memoria
avrebbe reso la risposta naturale è già passato.

Active Memory offre al sistema una possibilità delimitata di far emergere la memoria rilevante
prima che venga generata la risposta principale.

## Incolla questo nel tuo agente

Incolla questo nel tuo agente se vuoi abilitare Active Memory con una
configurazione autonoma e sicura per impostazione predefinita:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          enabled: true,
          agents: ["main"],
          allowedChatTypes: ["direct"],
          modelFallback: "google/gemini-3-flash",
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          persistTranscripts: false,
          logging: true,
        },
      },
    },
  },
}
```

Questo attiva il plugin per l’agente `main`, lo mantiene limitato per impostazione predefinita
alle sessioni in stile messaggio diretto, gli consente prima di ereditare il modello della sessione corrente
e usa il modello di fallback configurato solo se non è disponibile alcun modello esplicito o ereditato.

Dopo, riavvia il Gateway:

```bash
openclaw gateway
```

Per ispezionarlo in tempo reale in una conversazione:

```text
/verbose on
/trace on
```

## Attiva active memory

La configurazione più sicura è:

1. abilitare il plugin
2. scegliere come destinazione un agente conversazionale
3. mantenere il logging attivo solo durante la regolazione

Inizia con questo in `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          allowedChatTypes: ["direct"],
          modelFallback: "google/gemini-3-flash",
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          persistTranscripts: false,
          logging: true,
        },
      },
    },
  },
}
```

Poi riavvia il Gateway:

```bash
openclaw gateway
```

Cosa significa:

- `plugins.entries.active-memory.enabled: true` attiva il plugin
- `config.agents: ["main"]` abilita Active Memory solo per l’agente `main`
- `config.allowedChatTypes: ["direct"]` mantiene Active Memory attiva per impostazione predefinita solo per le sessioni in stile messaggio diretto
- se `config.model` non è impostato, Active Memory eredita prima il modello della sessione corrente
- `config.modelFallback` fornisce facoltativamente il tuo provider/modello di fallback per il richiamo
- `config.promptStyle: "balanced"` usa lo stile di prompt predefinito per uso generale per la modalità `recent`
- Active Memory viene comunque eseguito solo nelle sessioni di chat persistenti e interattive idonee

## Come visualizzarlo

Active Memory inserisce contesto di sistema nascosto per il modello. Non espone
tag grezzi `<active_memory_plugin>...</active_memory_plugin>` al client.

## Attivazione/disattivazione per sessione

Usa il comando del plugin quando vuoi sospendere o riprendere Active Memory per la
sessione di chat corrente senza modificare la configurazione:

```text
/active-memory status
/active-memory off
/active-memory on
```

Questo vale per la sessione corrente. Non cambia
`plugins.entries.active-memory.enabled`, la selezione degli agenti o altra
configurazione globale.

Se vuoi che il comando scriva nella configurazione e sospenda o riprenda Active Memory per
tutte le sessioni, usa la forma globale esplicita:

```text
/active-memory status --global
/active-memory off --global
/active-memory on --global
```

La forma globale scrive `plugins.entries.active-memory.config.enabled`. Lascia
`plugins.entries.active-memory.enabled` attivo in modo che il comando rimanga disponibile per
riattivare Active Memory in seguito.

Se vuoi vedere cosa sta facendo Active Memory in una sessione live, attiva le
opzioni della sessione che corrispondono all’output che vuoi:

```text
/verbose on
/trace on
```

Con queste opzioni abilitate, OpenClaw può mostrare:

- una riga di stato di Active Memory come `Active Memory: ok 842ms recent 34 chars` quando `/verbose on`
- un riepilogo di debug leggibile come `Active Memory Debug: Lemon pepper wings with blue cheese.` quando `/trace on`

Queste righe derivano dallo stesso passaggio di Active Memory che alimenta il contesto di sistema
nascosto, ma sono formattate per gli esseri umani invece di esporre markup di prompt grezzo.
Vengono inviate come messaggio diagnostico di follow-up dopo la normale
risposta dell’assistente, così i client di canale come Telegram non mostrano un fumetto diagnostico
separato prima della risposta.

Per impostazione predefinita, la trascrizione del sottoagente di memoria bloccante è temporanea e viene eliminata
al termine dell’esecuzione.

Flusso di esempio:

```text
/verbose on
/trace on
what wings should i order?
```

Forma prevista della risposta visibile:

```text
...normal assistant reply...

🧩 Active Memory: ok 842ms recent 34 chars
🔎 Active Memory Debug: Lemon pepper wings with blue cheese.
```

## Quando viene eseguito

Active Memory usa due controlli:

1. **Opt-in della configurazione**
   Il plugin deve essere abilitato e l’id dell’agente corrente deve comparire in
   `plugins.entries.active-memory.config.agents`.
2. **Idoneità rigorosa in fase di esecuzione**
   Anche quando è abilitato e selezionato come destinazione, Active Memory viene eseguito solo per
   sessioni di chat persistenti e interattive idonee.

La regola effettiva è:

```text
plugin enabled
+
agent id targeted
+
allowed chat type
+
eligible interactive persistent chat session
=
active memory runs
```

Se uno qualsiasi di questi controlli fallisce, Active Memory non viene eseguito.

## Tipi di sessione

`config.allowedChatTypes` controlla quali tipi di conversazioni possono eseguire Active
Memory.

L’impostazione predefinita è:

```json5
allowedChatTypes: ["direct"]
```

Questo significa che Active Memory viene eseguito per impostazione predefinita nelle sessioni in stile messaggio diretto, ma
non nelle sessioni di gruppo o di canale a meno che tu non le abiliti esplicitamente.

Esempi:

```json5
allowedChatTypes: ["direct"]
```

```json5
allowedChatTypes: ["direct", "group"]
```

```json5
allowedChatTypes: ["direct", "group", "channel"]
```

## Dove viene eseguito

Active Memory è una funzionalità di arricchimento conversazionale, non una
funzionalità di inferenza estesa a tutta la piattaforma.

| Surface                                                             | Active Memory viene eseguito?                           |
| ------------------------------------------------------------------- | ------------------------------------------------------- |
| Sessioni persistenti di Control UI / chat web                       | Sì, se il plugin è abilitato e l’agente è selezionato come destinazione |
| Altre sessioni di canale interattive sullo stesso percorso di chat persistente | Sì, se il plugin è abilitato e l’agente è selezionato come destinazione |
| Esecuzioni headless una tantum                                      | No                                                      |
| Esecuzioni Heartbeat/in background                                  | No                                                      |
| Percorsi interni generici `agent-command`                           | No                                                      |
| Esecuzione di sottoagenti/helper interni                            | No                                                      |

## Perché usarlo

Usa Active Memory quando:

- la sessione è persistente e rivolta all’utente
- l’agente ha una memoria a lungo termine significativa in cui cercare
- continuità e personalizzazione contano più del puro determinismo del prompt

Funziona particolarmente bene per:

- preferenze stabili
- abitudini ricorrenti
- contesto utente a lungo termine che dovrebbe emergere in modo naturale

È poco adatto per:

- automazione
- worker interni
- attività API una tantum
- contesti in cui una personalizzazione nascosta risulterebbe sorprendente

## Come funziona

La struttura di esecuzione è:

```mermaid
flowchart LR
  U["User Message"] --> Q["Build Memory Query"]
  Q --> R["Active Memory Blocking Memory Sub-Agent"]
  R -->|NONE or empty| M["Main Reply"]
  R -->|relevant summary| I["Append Hidden active_memory_plugin System Context"]
  I --> M["Main Reply"]
```

Il sottoagente di memoria bloccante può usare solo:

- `memory_search`
- `memory_get`

Se la connessione è debole, dovrebbe restituire `NONE`.

## Modalità di query

`config.queryMode` controlla quanta parte della conversazione vede il sottoagente di memoria bloccante.

## Stili di prompt

`config.promptStyle` controlla quanto il sottoagente di memoria bloccante sia
propenso o rigoroso nel decidere se restituire memoria.

Stili disponibili:

- `balanced`: impostazione predefinita per uso generale per la modalità `recent`
- `strict`: il meno propenso; ideale quando vuoi pochissima contaminazione dal contesto vicino
- `contextual`: il più favorevole alla continuità; ideale quando la cronologia della conversazione dovrebbe contare di più
- `recall-heavy`: più disposto a far emergere memoria anche con corrispondenze deboli ma comunque plausibili
- `precision-heavy`: preferisce in modo aggressivo `NONE` a meno che la corrispondenza non sia evidente
- `preference-only`: ottimizzato per preferiti, abitudini, routine, gusti e fatti personali ricorrenti

Mappatura predefinita quando `config.promptStyle` non è impostato:

```text
message -> strict
recent -> balanced
full -> contextual
```

Se imposti `config.promptStyle` esplicitamente, questa sostituzione ha la precedenza.

Esempio:

```json5
promptStyle: "preference-only"
```

## Criterio di fallback del modello

Se `config.model` non è impostato, Active Memory prova a risolvere un modello in questo ordine:

```text
explicit plugin model
-> current session model
-> agent primary model
-> optional configured fallback model
```

`config.modelFallback` controlla il passaggio di fallback configurato.

Fallback personalizzato facoltativo:

```json5
modelFallback: "google/gemini-3-flash"
```

Se non viene risolto alcun modello esplicito, ereditato o di fallback configurato, Active Memory
salta il richiamo per quel turno.

`config.modelFallbackPolicy` viene mantenuto solo come campo di compatibilità deprecato per
configurazioni meno recenti. Non modifica più il comportamento in fase di esecuzione.

## Meccanismi avanzati di escape hatch

Queste opzioni intenzionalmente non fanno parte della configurazione consigliata.

`config.thinking` può sostituire il livello di thinking del sottoagente di memoria bloccante:

```json5
thinking: "medium"
```

Predefinito:

```json5
thinking: "off"
```

Non abilitarlo per impostazione predefinita. Active Memory viene eseguito nel percorso della risposta, quindi il tempo
di thinking aggiuntivo aumenta direttamente la latenza visibile all’utente.

`config.promptAppend` aggiunge istruzioni supplementari dell’operatore dopo il prompt predefinito di Active
Memory e prima del contesto della conversazione:

```json5
promptAppend: "Prefer stable long-term preferences over one-off events."
```

`config.promptOverride` sostituisce il prompt predefinito di Active Memory. OpenClaw
continua ad aggiungere successivamente il contesto della conversazione:

```json5
promptOverride: "You are a memory search agent. Return NONE or one compact user fact."
```

La personalizzazione del prompt non è consigliata a meno che tu non stia testando deliberatamente un
contratto di richiamo diverso. Il prompt predefinito è ottimizzato per restituire `NONE`
oppure un contesto compatto di fatti utente per il modello principale.

### `message`

Viene inviato solo l’ultimo messaggio dell’utente.

```text
Latest user message only
```

Usalo quando:

- vuoi il comportamento più veloce
- vuoi il bias più forte verso il richiamo di preferenze stabili
- i turni successivi non richiedono contesto conversazionale

Timeout consigliato:

- inizia da circa `3000` a `5000` ms

### `recent`

Vengono inviati l’ultimo messaggio dell’utente più una piccola coda conversazionale recente.

```text
Recent conversation tail:
user: ...
assistant: ...
user: ...

Latest user message:
...
```

Usalo quando:

- vuoi un bilanciamento migliore tra velocità e ancoraggio conversazionale
- le domande di follow-up dipendono spesso dagli ultimi turni

Timeout consigliato:

- inizia da circa `15000` ms

### `full`

L’intera conversazione viene inviata al sottoagente di memoria bloccante.

```text
Full conversation context:
user: ...
assistant: ...
user: ...
...
```

Usalo quando:

- la massima qualità di richiamo conta più della latenza
- la conversazione contiene una configurazione importante molto indietro nel thread

Timeout consigliato:

- aumentalo in modo sostanziale rispetto a `message` o `recent`
- inizia da circa `15000` ms o più in base alla dimensione del thread

In generale, il timeout dovrebbe aumentare con la dimensione del contesto:

```text
message < recent < full
```

## Persistenza della trascrizione

Le esecuzioni del sottoagente di memoria bloccante di active memory creano una vera
trascrizione `session.jsonl` durante la chiamata del sottoagente di memoria bloccante.

Per impostazione predefinita, questa trascrizione è temporanea:

- viene scritta in una directory temporanea
- viene usata solo per l’esecuzione del sottoagente di memoria bloccante
- viene eliminata immediatamente al termine dell’esecuzione

Se vuoi conservare su disco queste trascrizioni del sottoagente di memoria bloccante per debug o
ispezione, attiva esplicitamente la persistenza:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          persistTranscripts: true,
          transcriptDir: "active-memory",
        },
      },
    },
  },
}
```

Quando è attiva, active memory archivia le trascrizioni in una directory separata sotto la
cartella sessions dell’agente di destinazione, non nel percorso della trascrizione principale
della conversazione dell’utente.

La struttura predefinita è concettualmente:

```text
agents/<agent>/sessions/active-memory/<blocking-memory-sub-agent-session-id>.jsonl
```

Puoi cambiare la sottodirectory relativa con `config.transcriptDir`.

Usalo con cautela:

- le trascrizioni del sottoagente di memoria bloccante possono accumularsi rapidamente nelle sessioni attive
- la modalità di query `full` può duplicare molto contesto della conversazione
- queste trascrizioni contengono contesto di prompt nascosto e memorie richiamate

## Configurazione

Tutta la configurazione di active memory si trova sotto:

```text
plugins.entries.active-memory
```

I campi più importanti sono:

| Key                         | Type                                                                                                 | Significato                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `enabled`                   | `boolean`                                                                                            | Abilita il plugin stesso                                                                               |
| `config.agents`             | `string[]`                                                                                           | ID agente che possono usare active memory                                                              |
| `config.model`              | `string`                                                                                             | Riferimento facoltativo al modello del sottoagente di memoria bloccante; se non impostato, active memory usa il modello della sessione corrente |
| `config.queryMode`          | `"message" \| "recent" \| "full"`                                                                    | Controlla quanta parte della conversazione vede il sottoagente di memoria bloccante                    |
| `config.promptStyle`        | `"balanced" \| "strict" \| "contextual" \| "recall-heavy" \| "precision-heavy" \| "preference-only"` | Controlla quanto il sottoagente di memoria bloccante sia propenso o rigoroso nel decidere se restituire memoria |
| `config.thinking`           | `"off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "adaptive"`                         | Sostituzione avanzata del livello di thinking per il sottoagente di memoria bloccante; valore predefinito `off` per la velocità |
| `config.promptOverride`     | `string`                                                                                             | Sostituzione avanzata dell’intero prompt; non consigliata per l’uso normale                            |
| `config.promptAppend`       | `string`                                                                                             | Istruzioni avanzate aggiuntive accodate al prompt predefinito o sostituito                             |
| `config.timeoutMs`          | `number`                                                                                             | Timeout rigido per il sottoagente di memoria bloccante                                                 |
| `config.maxSummaryChars`    | `number`                                                                                             | Numero massimo totale di caratteri consentiti nel riepilogo di active-memory                           |
| `config.logging`            | `boolean`                                                                                            | Emette log di active memory durante la regolazione                                                     |
| `config.persistTranscripts` | `boolean`                                                                                            | Mantiene su disco le trascrizioni del sottoagente di memoria bloccante invece di eliminare i file temporanei |
| `config.transcriptDir`      | `string`                                                                                             | Directory relativa delle trascrizioni del sottoagente di memoria bloccante sotto la cartella sessions dell’agente |

Campi utili per la regolazione:

| Key                           | Type     | Significato                                                   |
| ----------------------------- | -------- | ------------------------------------------------------------- |
| `config.maxSummaryChars`      | `number` | Numero massimo totale di caratteri consentiti nel riepilogo di active-memory |
| `config.recentUserTurns`      | `number` | Turni utente precedenti da includere quando `queryMode` è `recent` |
| `config.recentAssistantTurns` | `number` | Turni assistente precedenti da includere quando `queryMode` è `recent` |
| `config.recentUserChars`      | `number` | Numero massimo di caratteri per ogni turno utente recente     |
| `config.recentAssistantChars` | `number` | Numero massimo di caratteri per ogni turno assistente recente |
| `config.cacheTtlMs`           | `number` | Riutilizzo della cache per query identiche ripetute           |

## Configurazione consigliata

Inizia con `recent`.

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          logging: true,
        },
      },
    },
  },
}
```

Se vuoi ispezionare il comportamento in tempo reale durante la regolazione, usa `/verbose on` per la
normale riga di stato e `/trace on` per il riepilogo di debug di active-memory invece
di cercare un comando di debug separato per active-memory. Nei canali di chat, queste
righe diagnostiche vengono inviate dopo la risposta principale dell’assistente invece che prima.

Poi passa a:

- `message` se vuoi una latenza inferiore
- `full` se decidi che il contesto aggiuntivo vale il sottoagente di memoria bloccante più lento

## Debug

Se active memory non appare dove te lo aspetti:

1. Conferma che il plugin sia abilitato in `plugins.entries.active-memory.enabled`.
2. Conferma che l’ID dell’agente corrente sia elencato in `config.agents`.
3. Conferma che stai testando tramite una sessione di chat persistente e interattiva.
4. Attiva `config.logging: true` e osserva i log del Gateway.
5. Verifica che la ricerca nella memoria funzioni con `openclaw memory status --deep`.

Se i risultati della memoria sono rumorosi, restringi:

- `maxSummaryChars`

Se active memory è troppo lenta:

- riduci `queryMode`
- riduci `timeoutMs`
- riduci il numero di turni recenti
- riduci i limiti di caratteri per turno

## Problemi comuni

### Il provider di embedding è cambiato in modo inatteso

Active Memory usa la normale pipeline `memory_search` sotto
`agents.defaults.memorySearch`. Questo significa che la configurazione del provider di embedding è un
requisito solo quando la tua configurazione `memorySearch` richiede embedding per il comportamento
che desideri.

In pratica:

- la configurazione esplicita del provider è **necessaria** se vuoi un provider che non sia
  rilevato automaticamente, come `ollama`
- la configurazione esplicita del provider è **necessaria** se il rilevamento automatico non risolve
  alcun provider di embedding utilizzabile per il tuo ambiente
- la configurazione esplicita del provider è **fortemente consigliata** se vuoi una selezione del provider
  deterministica invece di "vince il primo disponibile"
- la configurazione esplicita del provider di solito **non è necessaria** se il rilevamento automatico
  risolve già il provider che vuoi e quel provider è stabile nel tuo deployment

Se `memorySearch.provider` non è impostato, OpenClaw rileva automaticamente il primo
provider di embedding disponibile.

Questo può essere fonte di confusione nei deployment reali:

- una nuova chiave API disponibile può cambiare quale provider usa la ricerca nella memoria
- un comando o una superficie diagnostica possono far sembrare diverso il provider selezionato
  rispetto al percorso che stai effettivamente usando durante la sincronizzazione live della memoria o il
  bootstrap della ricerca
- i provider ospitati possono fallire con errori di quota o rate limit che emergono solo
  quando Active Memory inizia a emettere query di richiamo prima di ogni risposta

Active Memory può comunque essere eseguito senza embedding quando `memory_search` può operare
in modalità degradata solo lessicale, cosa che di solito accade quando non è possibile risolvere
alcun provider di embedding.

Non dare per scontato lo stesso fallback in caso di errori del provider in fase di esecuzione, come esaurimento
della quota, rate limit, errori di rete/provider o modelli locali/remoti mancanti dopo che un provider
è già stato selezionato.

In pratica:

- se non è possibile risolvere alcun provider di embedding, `memory_search` può degradare a
  un recupero solo lessicale
- se un provider di embedding viene risolto e poi fallisce in fase di esecuzione, OpenClaw
  attualmente non garantisce un fallback lessicale per quella richiesta
- se hai bisogno di una selezione deterministica del provider, fissa
  `agents.defaults.memorySearch.provider`
- se hai bisogno di failover del provider in caso di errori in fase di esecuzione, configura
  esplicitamente `agents.defaults.memorySearch.fallback`

Se dipendi da richiamo basato su embedding, indicizzazione multimodale o da uno specifico
provider locale/remoto, fissa esplicitamente il provider invece di affidarti al
rilevamento automatico.

Esempi comuni di pinning:

OpenAI:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Gemini:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "gemini",
        model: "gemini-embedding-001",
      },
    },
  },
}
```

Ollama:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama",
        model: "nomic-embed-text",
      },
    },
  },
}
```

Se ti aspetti il failover del provider in caso di errori in fase di esecuzione come esaurimento della quota,
fissare un provider da solo non basta. Configura anche un fallback esplicito:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        fallback: "gemini",
      },
    },
  },
}
```

### Debug dei problemi del provider

Se Active Memory è lenta, vuota o sembra cambiare provider in modo inatteso:

- osserva i log del Gateway mentre riproduci il problema; cerca righe come
  `active-memory: ... start|done`, `memory sync failed (search-bootstrap)` oppure errori di embedding specifici del provider
- attiva `/trace on` per far emergere nella sessione il riepilogo di debug di Active Memory gestito dal plugin
- attiva `/verbose on` se vuoi anche la normale riga di stato `🧩 Active Memory: ...`
  dopo ogni risposta
- esegui `openclaw memory status --deep` per ispezionare il backend corrente della ricerca nella memoria
  e lo stato dell’indice
- controlla `agents.defaults.memorySearch.provider` e la relativa autenticazione/configurazione per
  assicurarti che il provider che ti aspetti sia davvero quello che può essere risolto in fase di esecuzione
- se usi `ollama`, verifica che il modello di embedding configurato sia installato, per
  esempio `ollama list`

Esempio di ciclo di debug:

```text
1. Avvia il Gateway e osserva i suoi log
2. Nella sessione di chat, esegui /trace on
3. Invia un messaggio che dovrebbe attivare Active Memory
4. Confronta la riga di debug visibile in chat con le righe del log del Gateway
5. Se la scelta del provider è ambigua, fissa esplicitamente agents.defaults.memorySearch.provider
```

Esempio:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama",
        model: "nomic-embed-text",
      },
    },
  },
}
```

Oppure, se vuoi embedding Gemini:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "gemini",
      },
    },
  },
}
```

Dopo aver cambiato il provider, riavvia il Gateway ed esegui un nuovo test con
`/trace on` in modo che la riga di debug di Active Memory rifletta il nuovo percorso di embedding.

## Pagine correlate

- [Memory Search](/it/concepts/memory-search)
- [Riferimento della configurazione della memoria](/it/reference/memory-config)
- [Configurazione di Plugin SDK](/it/plugins/sdk-setup)
