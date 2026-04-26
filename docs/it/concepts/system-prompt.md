---
read_when:
    - Modificare il testo del prompt di sistema, l'elenco degli strumenti o le sezioni tempo/Heartbeat
    - Modificare il bootstrap del workspace o il comportamento di iniezione delle Skills
summary: Cosa contiene il prompt di sistema di OpenClaw e come viene assemblato
title: Prompt di sistema
x-i18n:
    generated_at: "2026-04-26T11:27:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw costruisce un prompt di sistema personalizzato per ogni esecuzione dell'agente. Il prompt è **di proprietà di OpenClaw** e non usa il prompt predefinito di pi-coding-agent.

Il prompt viene assemblato da OpenClaw e iniettato in ogni esecuzione dell'agente.

I Plugin provider possono contribuire con indicazioni per il prompt consapevoli della cache senza sostituire
l'intero prompt di proprietà di OpenClaw. Il runtime del provider può:

- sostituire un piccolo insieme di sezioni core nominate (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- iniettare un **prefisso stabile** sopra il confine della cache del prompt
- iniettare un **suffisso dinamico** sotto il confine della cache del prompt

Usa contributi di proprietà del provider per l'ottimizzazione specifica della famiglia di modelli. Mantieni la mutazione legacy del prompt `before_prompt_build` per compatibilità o per modifiche davvero globali al prompt, non per il comportamento normale del provider.

L'overlay della famiglia OpenAI GPT-5 mantiene piccola la regola core di esecuzione e aggiunge
indicazioni specifiche del modello per aggancio della persona, output conciso, disciplina degli strumenti,
ricerca parallela, copertura dei deliverable, verifica, contesto mancante e
igiene degli strumenti terminale.

## Struttura

Il prompt è intenzionalmente compatto e usa sezioni fisse:

- **Tooling**: promemoria della fonte di verità degli strumenti strutturati più indicazioni runtime sull'uso degli strumenti.
- **Execution Bias**: indicazioni compatte di completamento: agire nel turno su
  richieste attuabili, continuare fino al completamento o al blocco, recuperare da risultati deboli
  degli strumenti, controllare live lo stato mutabile e verificare prima di finalizzare.
- **Safety**: breve promemoria di guardrail per evitare comportamenti orientati alla ricerca di potere o all'elusione della supervisione.
- **Skills** (quando disponibili): spiega al modello come caricare su richiesta le istruzioni delle skill.
- **OpenClaw Self-Update**: come ispezionare in sicurezza la configurazione con
  `config.schema.lookup`, correggere la configurazione con `config.patch`, sostituire l'intera
  configurazione con `config.apply` ed eseguire `update.run` solo su richiesta esplicita dell'utente. Lo strumento `gateway`, riservato al proprietario, rifiuta anche di riscrivere
  `tools.exec.ask` / `tools.exec.security`, incluse le alias legacy `tools.bash.*`
  che vengono normalizzate verso quei percorsi exec protetti.
- **Workspace**: directory di lavoro (`agents.defaults.workspace`).
- **Documentation**: percorso locale alla documentazione OpenClaw (repo o pacchetto npm) e quando leggerla.
- **Workspace Files (injected)**: indica che i file bootstrap sono inclusi qui sotto.
- **Sandbox** (quando abilitata): indica runtime sandboxed, percorsi sandbox e se exec elevato è disponibile.
- **Current Date & Time**: ora locale dell'utente, timezone e formato orario.
- **Reply Tags**: sintassi facoltativa dei tag di risposta per i provider supportati.
- **Heartbeats**: prompt Heartbeat e comportamento di ack, quando gli heartbeat sono abilitati per l'agente predefinito.
- **Runtime**: host, OS, node, modello, root del repo (quando rilevata), livello di thinking (una riga).
- **Reasoning**: livello di visibilità corrente + suggerimento per il toggle `/reasoning`.

La sezione Tooling include anche indicazioni runtime per lavori di lunga durata:

- usare Cron per followup futuri (`check back later`, promemoria, lavoro ricorrente)
  invece di cicli sleep `exec`, trucchi di ritardo `yieldMs` o polling ripetuto di `process`
- usare `exec` / `process` solo per comandi che iniziano ora e continuano a essere eseguiti
  in background
- quando è abilitata la riattivazione automatica al completamento, avviare il comando una sola volta e fare affidamento sul
  percorso di wake push-based quando emette output o fallisce
- usare `process` per log, stato, input o intervento quando è necessario
  ispezionare un comando in esecuzione
- se l'attività è più ampia, preferire `sessions_spawn`; il completamento del sottoagente è
  push-based e viene annunciato automaticamente al richiedente
- non eseguire `subagents list` / `sessions_list` in loop solo per aspettare
  il completamento

Quando è abilitato lo strumento sperimentale `update_plan`, Tooling dice anche al
modello di usarlo solo per lavori multi-step non banali, mantenere esattamente un passaggio
`in_progress` ed evitare di ripetere l'intero piano dopo ogni aggiornamento.

I guardrail di sicurezza nel prompt di sistema sono indicativi. Guidano il comportamento del modello ma non applicano policy. Usa policy degli strumenti, approvazioni exec, sandboxing e allowlist di canale per l'applicazione rigida; gli operatori possono disabilitarli per scelta progettuale.

Sui canali con card/pulsanti di approvazione nativi, il prompt di runtime ora dice all'agente di fare
affidamento prima di tutto su quell'UI di approvazione nativa. Dovrebbe includere un comando manuale
`/approve` solo quando il risultato dello strumento dice che le approvazioni via chat non sono disponibili oppure
l'approvazione manuale è l'unico percorso.

## Modalità del prompt

OpenClaw può generare prompt di sistema più piccoli per i sottoagenti. Il runtime imposta una
`promptMode` per ogni esecuzione (non è una configurazione esposta all'utente):

- `full` (predefinita): include tutte le sezioni sopra.
- `minimal`: usata per i sottoagenti; omette **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando noto), Runtime e contesto
  iniettato restano disponibili.
- `none`: restituisce solo la riga di identità di base.

Quando `promptMode=minimal`, i prompt extra iniettati sono etichettati **Subagent
Context** invece di **Group Chat Context**.

## Iniezione del bootstrap del workspace

I file bootstrap vengono ritagliati e aggiunti sotto **Project Context** così il modello vede il contesto di identità e profilo senza bisogno di letture esplicite:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo nei workspace completamente nuovi)
- `MEMORY.md` quando presente

Tutti questi file vengono **iniettati nella finestra di contesto** a ogni turno, a meno che
non si applichi un gate specifico del file. `HEARTBEAT.md` viene omesso nelle esecuzioni normali quando
gli heartbeat sono disabilitati per l'agente predefinito oppure
`agents.defaults.heartbeat.includeSystemPromptSection` è false. Mantieni concisi i
file iniettati — specialmente `MEMORY.md`, che può crescere nel tempo e portare a
un uso del contesto inaspettatamente elevato e a Compaction più frequenti.

> **Nota:** i file giornalieri `memory/*.md` **non** fanno parte del normale bootstrap
> Project Context. Nei turni ordinari vengono consultati su richiesta tramite gli
> strumenti `memory_search` e `memory_get`, quindi non contano contro la finestra di
> contesto a meno che il modello non li legga esplicitamente. I turni solo `/new` e
> `/reset` sono l'eccezione: il runtime può anteporre memoria giornaliera recente
> come blocco one-shot di contesto iniziale per quel primo turno.

I file grandi vengono troncati con un marker. La dimensione massima per file è controllata da
`agents.defaults.bootstrapMaxChars` (predefinito: 12000). Il contenuto bootstrap totale iniettato
su tutti i file è limitato da `agents.defaults.bootstrapTotalMaxChars`
(predefinito: 60000). I file mancanti iniettano un breve marker di file mancante. Quando avviene il troncamento,
OpenClaw può iniettare un blocco di avviso in Project Context; controllalo con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predefinito: `once`).

Le sessioni di sottoagente iniettano solo `AGENTS.md` e `TOOLS.md` (gli altri file bootstrap
vengono filtrati per mantenere piccolo il contesto del sottoagente).

Gli hook interni possono intercettare questo passaggio tramite `agent:bootstrap` per modificare o sostituire
i file bootstrap iniettati (per esempio sostituendo `SOUL.md` con una persona alternativa).

Se vuoi rendere l'agente meno generico nel modo di esprimersi, inizia da
[Guida alla personalità di SOUL.md](/it/concepts/soul).

Per ispezionare quanto contribuisce ciascun file iniettato (grezzo vs iniettato, troncamento, più overhead dello schema degli strumenti), usa `/context list` o `/context detail`. Vedi [Context](/it/concepts/context).

## Gestione del tempo

Il prompt di sistema include una sezione dedicata **Current Date & Time** quando la
timezone dell'utente è nota. Per mantenere stabile la cache del prompt, ora include solo
la **timezone** (nessun orologio dinamico né formato orario).

Usa `session_status` quando l'agente ha bisogno dell'ora corrente; la scheda di stato
include una riga con timestamp. Lo stesso strumento può facoltativamente impostare un
override di modello per sessione (`model=default` lo cancella).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vedi [Data e ora](/it/date-time) per i dettagli completi sul comportamento.

## Skills

Quando esistono skill idonee, OpenClaw inietta una compatta **available skills list**
(`formatSkillsForPrompt`) che include il **percorso del file** per ogni skill. Il
prompt istruisce il modello a usare `read` per caricare lo SKILL.md nella posizione
indicata (workspace, gestita o inclusa nel bundle). Se non ci sono skill idonee, la
sezione Skills viene omessa.

L'idoneità include gate dei metadati della skill, controlli dell'ambiente/configurazione runtime
e l'allowlist effettiva delle skill dell'agente quando `agents.defaults.skills` oppure
`agents.list[].skills` è configurato.

Le skill incluse nel bundle dei Plugin sono idonee solo quando il Plugin proprietario è abilitato.
Questo consente ai tool Plugin di esporre guide operative più approfondite senza incorporare
tutte quelle indicazioni direttamente in ogni descrizione di strumento.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Questo mantiene piccolo il prompt di base pur consentendo un uso mirato delle skill.

Il budget della lista skill appartiene al sottosistema skills:

- Predefinito globale: `skills.limits.maxSkillsPromptChars`
- Override per agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Gli estratti runtime generici limitati usano una superficie diversa:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Questa separazione mantiene distinto il dimensionamento delle skill dal dimensionamento di lettura/iniezione runtime
come `memory_get`, risultati live degli strumenti e refresh post-Compaction di AGENTS.md.

## Documentation

Il prompt di sistema include una sezione **Documentation**. Quando la documentazione locale è disponibile,
punta alla directory locale della documentazione OpenClaw (`docs/` in un checkout Git oppure la documentazione inclusa nel
pacchetto npm). Se la documentazione locale non è disponibile, ripiega su
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La stessa sezione include anche la posizione del sorgente OpenClaw. I checkout Git espongono la root locale
del sorgente così l'agente può ispezionare direttamente il codice. Le installazioni da pacchetto includono l'URL
del sorgente GitHub e dicono all'agente di esaminare il sorgente lì ogni volta che la documentazione è incompleta o
obsoleta. Il prompt menziona anche il mirror pubblico della documentazione, il Discord della community e ClawHub
([https://clawhub.ai](https://clawhub.ai)) per la scoperta delle skill. Dice al modello di
consultare prima la documentazione per comportamento, comandi, configurazione o architettura di OpenClaw e di
eseguire `openclaw status` direttamente quando possibile (chiedendo all'utente solo quando non ha accesso).
Per la configurazione in particolare, indirizza gli agenti verso l'azione dello strumento `gateway`
`config.schema.lookup` per documentazione esatta a livello di campo e relativi vincoli, poi verso
`docs/gateway/configuration.md` e `docs/gateway/configuration-reference.md`
per indicazioni più ampie.

## Correlati

- [Runtime dell'agente](/it/concepts/agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Motore di contesto](/it/concepts/context-engine)
