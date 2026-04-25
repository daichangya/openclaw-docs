---
read_when:
    - Modifica del testo del prompt di sistema, dell'elenco degli strumenti o delle sezioni tempo/Heartbeat
    - Modifica del comportamento del bootstrap dello spazio di lavoro o dell'iniezione di Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-04-25T13:45:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw costruisce un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I Plugin provider possono contribuire con indicazioni per il prompt compatibili con la cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core denominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa contributi di proprietà del provider per la regolazione specifica della famiglia di modelli. Mantieni la mutazione legacy del prompt `before_prompt_build` per compatibilità o per modifiche davvero globali al prompt, non per il normale comportamento del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene piccola la regola core di esecuzione e aggiunge
indicazioni specifiche del modello per aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene degli strumenti terminale.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Tooling**: promemoria della fonte di verità degli strumenti strutturati più indicazioni runtime sull'uso degli strumenti.
- **Execution Bias**: indicazioni compatte di continuità operativa: agire nel turno su
  richieste praticabili, continuare fino al completamento o a un blocco, recuperare da risultati
  deboli degli strumenti, controllare in tempo reale lo stato modificabile e verificare prima di finalizzare.
- **Safety**: breve promemoria di guardrail per evitare comportamenti di ricerca del potere o aggiramento della supervisione.
- **Skills** (quando disponibili): indica al modello come caricare le istruzioni delle Skills su richiesta.
- **OpenClaw Self-Update**: come ispezionare in sicurezza la configurazione con
  `config.schema.lookup`, correggere la configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su esplicita
  richiesta dell'utente. Anche lo strumento `gateway`, riservato al proprietario, rifiuta di riscrivere
  `tools.exec.ask` / `tools.exec.security`, incluse le alias legacy `tools.bash.*`
  che vengono normalizzate in quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentation**: percorso locale alla documentazione OpenClaw (repo o pacchetto npm) e quando leggerla.
- **Workspace Files (injected)**: indica che i file bootstrap sono inclusi qui sotto.
- **Sandbox** (quando abilitata): indica runtime in sandbox, percorsi sandbox e se exec elevato è disponibile.
- **Current Date & Time**: ora locale dell'utente, fuso orario e formato dell'ora.
- **Reply Tags**: sintassi facoltativa dei tag di risposta per i provider supportati.
- **Heartbeats**: prompt Heartbeat e comportamento ack, quando gli heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, node, modello, root del repo (quando rilevata), livello di thinking (una riga).
- **Reasoning**: livello di visibilità corrente + suggerimento per attivare/disattivare `/reasoning`.

La sezione Tooling include anche indicazioni runtime per lavori di lunga durata:

- usare cron per follow-up futuri (`check back later`, promemoria, lavoro ricorrente)
  invece di loop `sleep` con `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usare `exec` / `process` solo per comandi che iniziano subito e continuano a essere eseguiti
  in background
- quando la riattivazione automatica al completamento è abilitata, avviare il comando una sola volta e fare affidamento sul
  percorso di riattivazione push-based quando emette output o fallisce
- usare `process` per log, stato, input o intervento quando è necessario
  ispezionare un comando in esecuzione
- se l'attività è più grande, preferire `sessions_spawn`; il completamento del subagente è
  push-based e viene annunciato automaticamente al richiedente
- non eseguire in loop il polling di `subagents list` / `sessions_list` solo per attendere
  il completamento

Quando lo strumento sperimentale `update_plan` è abilitato, Tooling dice anche al
modello di usarlo solo per lavori non banali a più fasi, mantenere esattamente una
fase `in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di Safety nel prompt di sistema sono indicativi. Guidano il comportamento del modello ma non applicano policy. Per l'applicazione rigorosa usa policy degli strumenti, approvazioni exec, sandboxing e allowlist dei canali; gli operatori possono disabilitarli per progettazione.

Nei canali con card/pulsanti di approvazione nativi, il prompt runtime ora dice all'
agente di fare affidamento prima su quella UI di approvazione nativa. Dovrebbe includere un comando
manuale `/approve` solo quando il risultato dello strumento dice che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può renderizzare prompt di sistema più piccoli per i subagenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non è una configurazione visibile all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i subagenti; omette **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando noto), Runtime e il
  contesto iniettato rimangono disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt aggiuntivi iniettati sono etichettati **Subagent
Context** invece di **Group Chat Context**.

## Iniezione bootstrap dello spazio di lavoro

I file bootstrap vengono rifilati e aggiunti sotto **Project Context** così il modello vede il contesto di identità e profilo senza bisogno di letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo negli spazi di lavoro completamente nuovi)
- `MEMORY.md` quando presente

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno a meno
che non si applichi un controllo specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli heartbeat sono disabilitati per l'agente predefinito oppure
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi
i file iniettati — soprattutto `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente elevato e a Compaction più frequente.

> **Nota:** i file giornalieri `memory/*.md` **non** fanno parte del normale bootstrap
> Project Context. Nei turni ordinari vi si accede su richiesta tramite gli
> strumenti `memory_search` e `memory_get`, quindi non contano nella finestra di
> contesto a meno che il modello non li legga esplicitamente. I turni `/new` e
> `/reset` senza altro contenuto sono l'eccezione: il runtime può anteporre la memoria
> giornaliera recente come blocco one-shot di contesto iniziale per quel primo turno.

I file grandi vengono troncati con un marcatore. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto bootstrap totale iniettato
tra i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marcatore di file mancante. Quando avviene il troncamento,
OpenClaw può iniettare un blocco di avviso in Project Context; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni subagente iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file bootstrap
vengono filtrati per mantenere piccolo il contesto del subagente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per mutare o sostituire
i file bootstrap iniettati (ad esempio sostituire `SOUL.md` con una persona alternativa).

Se vuoi far sembrare l'agente meno generico, inizia dalla
[Guida alla personalità di SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ogni file iniettato (grezzo vs iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Context](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Current Date & Time** quando il
fuso orario dell'utente è noto. Per mantenere stabile la cache del prompt, ora include solo
il **fuso orario** (nessun orologio dinamico né formato dell'ora).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga timestamp. Lo stesso strumento può anche impostare facoltativamente un override
del modello per sessione (`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi del comportamento.

## Skills

Quando esistono Skills idonee, OpenClaw inietta un compatto **elenco delle Skills disponibili**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni Skill. Il
prompt istruisce il modello a usare `read` per caricare il file SKILL.md nella posizione
elencata (workspace, gestita o inclusa). Se non ci sono Skills idonee, la
sezione Skills viene omessa.

L'idoneità include controlli sui metadati della Skill, verifiche dell'ambiente/configurazione runtime
e l'allowlist effettiva delle Skills dell'agente quando `agents.defaults.skills` o
`agents.list[].skills` è configurato.

Le Skills incluse dai Plugin sono idonee solo quando il Plugin proprietario è abilitato.
Questo consente ai tool Plugin di esporre guide operative più approfondite senza incorporare tutta
quella guida direttamente in ogni descrizione dello strumento.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Questo mantiene piccolo il prompt di base pur consentendo un uso mirato delle Skills.

Il budget dell'elenco delle Skills è di proprietà del sottosistema Skills:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici limitati usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene il dimensionamento delle Skills separato dal dimensionamento di lettura/iniezione runtime come
`memory_get`, risultati degli strumenti live e aggiornamenti di AGENTS.md post-Compaction.

## Documentazione

Il prompt di sistema include una sezione **Documentation**. Quando la documentazione locale è disponibile,
punta alla directory locale della documentazione OpenClaw (`docs/` in un checkout Git o nella documentazione inclusa nel
pacchetto npm). Se la documentazione locale non è disponibile, usa come fallback
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del codice sorgente OpenClaw. I checkout Git espongono la root del
codice sorgente locale così l'agente può ispezionare direttamente il codice. Le installazioni del pacchetto includono l'URL del
codice sorgente GitHub e dicono all'agente di esaminarlo lì ogni volta che la documentazione è incompleta o
obsoleta. Il prompt cita anche il mirror pubblico della documentazione, la community Discord e ClawHub
([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle Skills. Dice al modello di
consultare prima la documentazione per comportamento, comandi, configurazione o architettura di OpenClaw, e di
eseguire `openclaw status` direttamente quando possibile (chiedendo all'utente solo quando non ha accesso).

## Correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
