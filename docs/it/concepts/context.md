---
read_when:
    - Vuoi capire cosa significa “contesto” in OpenClaw
    - Stai eseguendo il debug del motivo per cui il modello “sa” qualcosa (o l’ha dimenticato)
    - Vuoi ridurre il sovraccarico del contesto (`/context`, `/status`, `/compact`)
summary: 'Contesto: cosa vede il modello, come viene costruito e come ispezionarlo'
title: Contesto
x-i18n:
    generated_at: "2026-04-12T23:28:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3620db1a8c1956d91a01328966df491388d3a32c4003dc4447197eb34316c77d
    source_path: concepts/context.md
    workflow: 15
---

# Contesto

Il “contesto” è **tutto ciò che OpenClaw invia al modello per un’esecuzione**. È limitato dalla **finestra di contesto** del modello (limite di token).

Modello mentale per principianti:

- **Prompt di sistema** (costruito da OpenClaw): regole, strumenti, elenco delle Skills, ora/runtime e file dell’area di lavoro iniettati.
- **Cronologia della conversazione**: i tuoi messaggi + i messaggi dell’assistente per questa sessione.
- **Chiamate/risultati degli strumenti + allegati**: output dei comandi, letture di file, immagini/audio, ecc.

Il contesto _non è la stessa cosa_ della “memoria”: la memoria può essere archiviata su disco e ricaricata in seguito; il contesto è ciò che si trova nella finestra corrente del modello.

## Avvio rapido (ispezionare il contesto)

- `/status` → vista rapida di “quanto è piena la mia finestra?” + impostazioni della sessione.
- `/context list` → cosa viene iniettato + dimensioni approssimative (per file + totali).
- `/context detail` → suddivisione più approfondita: dimensioni per file, per schema degli strumenti, per voce Skill e dimensione del prompt di sistema.
- `/usage tokens` → aggiunge un piè di pagina con l’utilizzo per risposta alle risposte normali.
- `/compact` → riassume la cronologia meno recente in una voce compatta per liberare spazio nella finestra.

Vedi anche: [Comandi slash](/it/tools/slash-commands), [Uso dei token e costi](/it/reference/token-use), [Compaction](/it/concepts/compaction).

## Esempio di output

I valori variano in base al modello, al provider, alla policy degli strumenti e a ciò che è presente nella tua area di lavoro.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## Cosa conta ai fini della finestra di contesto

Tutto ciò che il modello riceve conta, inclusi:

- Prompt di sistema (tutte le sezioni).
- Cronologia della conversazione.
- Chiamate agli strumenti + risultati degli strumenti.
- Allegati/trascrizioni (immagini/audio/file).
- Riassunti di compattazione e artefatti di potatura.
- “Wrapper” del provider o intestazioni nascoste (non visibili, ma comunque conteggiati).

## Come OpenClaw costruisce il prompt di sistema

Il prompt di sistema è **di proprietà di OpenClaw** e viene ricostruito a ogni esecuzione. Include:

- Elenco degli strumenti + descrizioni brevi.
- Elenco delle Skills (solo metadati; vedi sotto).
- Posizione dell’area di lavoro.
- Ora (UTC + ora utente convertita, se configurata).
- Metadati di runtime (host/OS/modello/ragionamento).
- File bootstrap dell’area di lavoro iniettati sotto **Project Context**.

Suddivisione completa: [Prompt di sistema](/it/concepts/system-prompt).

## File dell’area di lavoro iniettati (Project Context)

Per impostazione predefinita, OpenClaw inietta un insieme fisso di file dell’area di lavoro (se presenti):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo alla prima esecuzione)

I file grandi vengono troncati per file usando `agents.defaults.bootstrapMaxChars` (predefinito `20000` caratteri). OpenClaw applica anche un limite totale di iniezione bootstrap tra tutti i file con `agents.defaults.bootstrapTotalMaxChars` (predefinito `150000` caratteri). `/context` mostra le dimensioni **raw vs injected** e se è avvenuto il troncamento.

Quando si verifica il troncamento, il runtime può iniettare un blocco di avviso nel prompt sotto Project Context. Configuralo con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; predefinito `once`).

## Skills: iniettate vs caricate su richiesta

Il prompt di sistema include un elenco compatto delle **Skills** (nome + descrizione + posizione). Questo elenco ha un overhead reale.

Le istruzioni delle Skill _non_ sono incluse per impostazione predefinita. Ci si aspetta che il modello usi `read` per leggere il file `SKILL.md` della Skill **solo quando necessario**.

## Strumenti: ci sono due costi

Gli strumenti influenzano il contesto in due modi:

1. **Testo dell’elenco degli strumenti** nel prompt di sistema (quello che vedi come “Tooling”).
2. **Schemi degli strumenti** (JSON). Vengono inviati al modello in modo che possa chiamare gli strumenti. Contano ai fini del contesto anche se non li vedi come testo semplice.

`/context detail` suddivide gli schemi degli strumenti più grandi così puoi vedere cosa incide di più.

## Comandi, direttive e "scorciatoie inline"

I comandi slash sono gestiti dal Gateway. Esistono alcuni comportamenti diversi:

- **Comandi standalone**: un messaggio composto solo da `/...` viene eseguito come comando.
- **Direttive**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` vengono rimosse prima che il modello veda il messaggio.
  - I messaggi composti solo da direttive mantengono le impostazioni della sessione.
  - Le direttive inline in un messaggio normale agiscono come suggerimenti per il singolo messaggio.
- **Scorciatoie inline** (solo mittenti consentiti): alcuni token `/...` all’interno di un messaggio normale possono essere eseguiti immediatamente (esempio: “hey /status”) e vengono rimossi prima che il modello veda il testo rimanente.

Dettagli: [Comandi slash](/it/tools/slash-commands).

## Sessioni, compattazione e potatura (cosa persiste)

Ciò che persiste tra i messaggi dipende dal meccanismo:

- La **cronologia normale** persiste nella trascrizione della sessione finché non viene compattata/potata in base alla policy.
- La **compattazione** mantiene un riepilogo nella trascrizione e conserva intatti i messaggi recenti.
- La **potatura** rimuove i vecchi risultati degli strumenti dal prompt _in memoria_ per un’esecuzione, ma non riscrive la trascrizione.

Documentazione: [Sessione](/it/concepts/session), [Compaction](/it/concepts/compaction), [Potatura della sessione](/it/concepts/session-pruning).

Per impostazione predefinita, OpenClaw usa il motore di contesto integrato `legacy` per l’assemblaggio e la
compattazione. Se installi un Plugin che fornisce `kind: "context-engine"` e
lo selezioni con `plugins.slots.contextEngine`, OpenClaw delega invece a quel
motore l’assemblaggio del contesto, `/compact` e i relativi hook del ciclo di vita
del contesto dei sottoagenti. `ownsCompaction: false` non comporta un fallback
automatico al motore legacy; il motore attivo deve comunque implementare
correttamente `compact()`. Vedi
[Context Engine](/it/concepts/context-engine) per l’interfaccia
completa collegabile tramite Plugin, gli hook del ciclo di vita e la configurazione.

## Cosa riporta effettivamente `/context`

`/context` preferisce l’ultimo report del prompt di sistema **costruito per l’esecuzione** quando disponibile:

- `System prompt (run)` = acquisito dall’ultima esecuzione embedded (capace di usare strumenti) e salvato nello store della sessione.
- `System prompt (estimate)` = calcolato al volo quando non esiste alcun report di esecuzione (o quando si usa un backend CLI che non genera il report).

In entrambi i casi, riporta le dimensioni e i principali contributori; **non** mostra l’intero prompt di sistema o gli schemi degli strumenti.

## Correlati

- [Context Engine](/it/concepts/context-engine) — iniezione del contesto personalizzata tramite Plugin
- [Compaction](/it/concepts/compaction) — riepilogo delle conversazioni lunghe
- [Prompt di sistema](/it/concepts/system-prompt) — come viene costruito il prompt di sistema
- [Ciclo dell’agente](/it/concepts/agent-loop) — il ciclo completo di esecuzione dell’agente
