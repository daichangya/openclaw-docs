---
read_when:
    - Vuoi che gli agent trasformino correzioni o procedure riutilizzabili in Skills del workspace
    - Stai configurando la memoria procedurale delle Skills
    - Stai eseguendo il debug del comportamento del tool `skill_workshop`
    - Stai decidendo se abilitare la creazione automatica delle Skills
summary: Acquisizione sperimentale di procedure riutilizzabili come Skills del workspace con revisione, approvazione, quarantena e aggiornamento a caldo delle Skills
title: Plugin Skill Workshop
x-i18n:
    generated_at: "2026-04-22T04:26:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Plugin Skill Workshop

Skill Workshop è **sperimentale**. È disabilitato per impostazione predefinita, le sue
euristiche di acquisizione e i prompt del reviewer possono cambiare tra una release e l'altra, e le
scritture automatiche dovrebbero essere usate solo in workspace fidati dopo aver prima esaminato l'output in modalità pending.

Skill Workshop è memoria procedurale per le Skills del workspace. Consente a un agent di trasformare
workflow riutilizzabili, correzioni dell'utente, fix faticosamente ottenuti e problemi ricorrenti
in file `SKILL.md` sotto:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Questo è diverso dalla memoria a lungo termine:

- **Memory** memorizza fatti, preferenze, entità e contesto passato.
- **Skills** memorizzano procedure riutilizzabili che l'agent dovrebbe seguire nei task futuri.
- **Skill Workshop** è il ponte da un turno utile a una Skill durevole del workspace,
  con controlli di sicurezza e approvazione facoltativa.

Skill Workshop è utile quando l'agent apprende una procedura come:

- come validare risorse GIF animate provenienti da fonti esterne
- come sostituire risorse screenshot e verificarne le dimensioni
- come eseguire uno scenario QA specifico del repository
- come eseguire il debug di un errore ricorrente di un provider
- come riparare una nota obsoleta di workflow locale

Non è pensato per:

- fatti come “all'utente piace il blu”
- memoria autobiografica ampia
- archiviazione grezza del transcript
- secret, credenziali o testo nascosto del prompt
- istruzioni one-shot che non si ripeteranno

## Stato predefinito

Il Plugin incluso è **sperimentale** e **disabilitato per impostazione predefinita** a meno che non sia
esplicitamente abilitato in `plugins.entries.skill-workshop`.

Il manifest del Plugin non imposta `enabledByDefault: true`. Il valore predefinito `enabled: true`
all'interno dello schema di configurazione del Plugin si applica solo dopo che la voce del Plugin è già stata selezionata e caricata.

Sperimentale significa:

- il Plugin è supportato abbastanza per test opt-in e dogfooding
- l'archiviazione delle proposte, le soglie del reviewer e le euristiche di acquisizione possono evolvere
- l'approvazione pending è la modalità iniziale consigliata
- l'applicazione automatica è per configurazioni personali/di workspace fidate, non per ambienti condivisi o ostili con molti input

## Abilitazione

Configurazione minima sicura:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Con questa configurazione:

- il tool `skill_workshop` è disponibile
- le correzioni esplicite riutilizzabili vengono messe in coda come proposte pending
- i passaggi del reviewer basati su soglia possono proporre aggiornamenti alle Skills
- nessun file Skill viene scritto finché una proposta pending non viene applicata

Usa scritture automatiche solo in workspace fidati:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` usa comunque lo stesso scanner e lo stesso percorso di quarantena. Non
applica proposte con findings critici.

## Configurazione

| Key                  | Default     | Range / values                              | Meaning                                                              |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Abilita il Plugin dopo che la voce del Plugin è stata caricata.      |
| `autoCapture`        | `true`      | boolean                                     | Abilita acquisizione/review post-turno sui turni agent riusciti.     |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Mette in coda le proposte o scrive automaticamente quelle sicure.    |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Sceglie acquisizione di correzioni esplicite, reviewer LLM, entrambi o nessuno. |
| `reviewInterval`     | `15`        | `1..200`                                    | Esegue il reviewer dopo questo numero di turni riusciti.             |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Esegue il reviewer dopo questo numero di chiamate tool osservate.    |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Timeout per l'esecuzione del reviewer incorporato.                   |
| `maxPending`         | `50`        | `1..200`                                    | Numero massimo di proposte pending/in quarantena mantenute per workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Dimensione massima del file Skill/di supporto generato.              |

Profili consigliati:

```json5
// Conservativo: solo uso esplicito del tool, nessuna acquisizione automatica.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: acquisizione automatica, ma richiede approvazione.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Automazione fidata: scrive subito le proposte sicure.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Basso costo: nessuna chiamata reviewer LLM, solo frasi esplicite di correzione.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Percorsi di acquisizione

Skill Workshop ha tre percorsi di acquisizione.

### Suggerimenti del tool

Il modello può chiamare direttamente `skill_workshop` quando rileva una procedura riutilizzabile
o quando l'utente gli chiede di salvare/aggiornare una Skill.

Questo è il percorso più esplicito e funziona anche con `autoCapture: false`.

### Acquisizione euristica

Quando `autoCapture` è abilitato e `reviewMode` è `heuristic` o `hybrid`, il
Plugin analizza i turni riusciti alla ricerca di frasi esplicite di correzione dell'utente:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

L'euristica crea una proposta a partire dall'ultima istruzione utente corrispondente. Usa
hint di argomento per scegliere i nomi delle Skills per i workflow comuni:

- task con GIF animate -> `animated-gif-workflow`
- task con screenshot o risorse -> `screenshot-asset-workflow`
- task QA o di scenario -> `qa-scenario-workflow`
- task GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

L'acquisizione euristica è intenzionalmente limitata. Serve per correzioni chiare e note di processo ripetibili, non per la sintesi generale del transcript.

### Reviewer LLM

Quando `autoCapture` è abilitato e `reviewMode` è `llm` o `hybrid`, il Plugin
esegue un reviewer incorporato compatto una volta raggiunte le soglie.

Il reviewer riceve:

- il testo recente del transcript, limitato agli ultimi 12.000 caratteri
- fino a 12 Skills esistenti del workspace
- fino a 2.000 caratteri da ogni Skill esistente
- istruzioni solo-JSON

Il reviewer non ha tool:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Può restituire:

```json
{ "action": "none" }
```

oppure una proposta di Skill:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Workflow riutilizzabile di accettazione dei contenuti multimediali animati",
  "description": "Validare contenuti multimediali animati provenienti da fonti esterne prima dell'uso nel prodotto.",
  "body": "## Workflow\n\n- Verificare la reale animazione.\n- Registrare l'attribuzione.\n- Salvare una copia locale approvata.\n- Verificare nella UI del prodotto prima della risposta finale."
}
```

Può anche aggiungere contenuto a una Skill esistente:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "La QA dei contenuti multimediali animati richiede controlli riutilizzabili",
  "description": "Workflow di scenario QA.",
  "section": "Workflow",
  "body": "- Per i task con GIF animate, verificare il conteggio dei frame e l'attribuzione prima di procedere."
}
```

Oppure sostituire testo esatto in una Skill esistente:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "La vecchia validazione non includeva l'ottimizzazione dell'immagine",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

Preferisci `append` o `replace` quando esiste già una Skill pertinente. Usa `create`
solo quando nessuna Skill esistente è adatta.

## Ciclo di vita della proposta

Ogni aggiornamento generato diventa una proposta con:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` facoltativo
- `sessionId` facoltativo
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` o `reviewer`
- `status`
- `change`
- `scanFindings` facoltativo
- `quarantineReason` facoltativo

Stati della proposta:

- `pending` - in attesa di approvazione
- `applied` - scritta in `<workspace>/skills`
- `rejected` - rifiutata da operator/model
- `quarantined` - bloccata da findings critici dello scanner

Lo stato viene memorizzato per workspace sotto la directory di stato del Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Le proposte pending e in quarantena vengono deduplicate per nome della Skill e payload
della modifica. Lo store mantiene le proposte pending/in quarantena più recenti fino a
`maxPending`.

## Riferimento del tool

Il Plugin registra un tool agent:

```text
skill_workshop
```

### `status`

Conta le proposte per stato nel workspace attivo.

```json
{ "action": "status" }
```

Forma del risultato:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Elenca le proposte pending.

```json
{ "action": "list_pending" }
```

Per elencare un altro stato:

```json
{ "action": "list_pending", "status": "applied" }
```

Valori `status` validi:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Elenca le proposte in quarantena.

```json
{ "action": "list_quarantine" }
```

Usalo quando l'acquisizione automatica sembra non fare nulla e i log menzionano
`skill-workshop: quarantined <skill>`.

### `inspect`

Recupera una proposta tramite id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Crea una proposta. Con `approvalPolicy: "pending"`, per impostazione predefinita viene messa in coda.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "L'utente ha definito regole riutilizzabili di validazione delle GIF.",
  "description": "Validare le risorse GIF animate prima di usarle.",
  "body": "## Workflow\n\n- Verificare che l'URL si risolva in image/gif.\n- Confermare che abbia più frame.\n- Registrare attribuzione e licenza.\n- Evitare hotlinking quando è necessaria una risorsa locale."
}
```

Forza una scrittura sicura:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validare le risorse GIF animate prima di usarle.",
  "body": "## Workflow\n\n- Verificare la reale animazione.\n- Registrare l'attribuzione."
}
```

Forza pending anche con `approvalPolicy: "auto"`:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Workflow di sostituzione degli screenshot.",
  "body": "## Workflow\n\n- Verificare le dimensioni.\n- Ottimizzare il PNG.\n- Eseguire il gate pertinente."
}
```

Aggiunge a una sezione:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "Workflow di scenario QA.",
  "body": "- Per la QA dei contenuti multimediali, verificare che le risorse generate vengano renderizzate e superino le asserzioni finali."
}
```

Sostituisce testo esatto:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

Applica una proposta pending.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` rifiuta le proposte in quarantena:

```text
quarantined proposal cannot be applied
```

### `reject`

Contrassegna una proposta come rifiutata.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Scrive un file di supporto all'interno di una directory di Skill esistente o proposta.

Directory di supporto di primo livello consentite:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Esempio:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Checklist di release\n\n- Eseguire la documentazione di release.\n- Verificare il changelog.\n"
}
```

I file di supporto hanno scope del workspace, vengono controllati nel percorso, limitati in byte da
`maxSkillBytes`, analizzati dallo scanner e scritti atomicamente.

## Scritture delle Skills

Skill Workshop scrive solo sotto:

```text
<workspace>/skills/<normalized-skill-name>/
```

I nomi delle Skills vengono normalizzati:

- in minuscolo
- le sequenze non `[a-z0-9_-]` diventano `-`
- i caratteri non alfanumerici iniziali/finali vengono rimossi
- la lunghezza massima è 80 caratteri
- il nome finale deve corrispondere a `[a-z0-9][a-z0-9_-]{1,79}`

Per `create`:

- se la Skill non esiste, Skill Workshop scrive un nuovo `SKILL.md`
- se esiste già, Skill Workshop aggiunge il body a `## Workflow`

Per `append`:

- se la Skill esiste, Skill Workshop aggiunge alla sezione richiesta
- se non esiste, Skill Workshop crea una Skill minima e poi aggiunge

Per `replace`:

- la Skill deve già esistere
- `oldText` deve essere presente esattamente
- viene sostituita solo la prima corrispondenza esatta

Tutte le scritture sono atomiche e aggiornano immediatamente lo snapshot delle Skills in memoria, così
la Skill nuova o aggiornata può diventare visibile senza riavviare il Gateway.

## Modello di sicurezza

Skill Workshop dispone di uno scanner di sicurezza sul contenuto generato di `SKILL.md` e sui file di supporto.

I findings critici mettono in quarantena le proposte:

| Rule id                                | Blocca contenuti che...                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | dicono all'agent di ignorare istruzioni precedenti/di livello superiore |
| `prompt-injection-system`              | fanno riferimento a system prompt, messaggi developer o istruzioni nascoste |
| `prompt-injection-tool`                | incoraggiano l'aggiramento dei permessi/dell'approvazione dei tool  |
| `shell-pipe-to-shell`                  | includono `curl`/`wget` piped in `sh`, `bash` o `zsh`               |
| `secret-exfiltration`                  | sembrano inviare dati env/process env sulla rete                    |

I findings di warning vengono conservati ma da soli non bloccano:

| Rule id              | Avvisa su...                         |
| -------------------- | ------------------------------------ |
| `destructive-delete` | comandi ampi in stile `rm -rf`       |
| `unsafe-permissions` | uso di permessi in stile `chmod 777` |

Le proposte in quarantena:

- mantengono `scanFindings`
- mantengono `quarantineReason`
- compaiono in `list_quarantine`
- non possono essere applicate tramite `apply`

Per recuperare da una proposta in quarantena, crea una nuova proposta sicura con il
contenuto non sicuro rimosso. Non modificare a mano il JSON dello store.

## Guida del prompt

Quando abilitato, Skill Workshop inietta una breve sezione di prompt che dice all'agent
di usare `skill_workshop` per la memoria procedurale durevole.

La guida enfatizza:

- procedure, non fatti/preferenze
- correzioni dell'utente
- procedure riuscite non ovvie
- problemi ricorrenti
- riparazione di Skills obsolete/sottili/errate tramite append/replace
- salvataggio di procedure riutilizzabili dopo lunghi loop di tool o fix difficili
- testo della Skill breve e imperativo
- nessun dump del transcript

Il testo della modalità di scrittura cambia con `approvalPolicy`:

- modalità pending: mette in coda i suggerimenti; applica solo dopo approvazione esplicita
- modalità auto: applica aggiornamenti sicuri alle Skills del workspace quando sono chiaramente riutilizzabili

## Costi e comportamento runtime

L'acquisizione euristica non chiama alcun modello.

La review LLM usa un'esecuzione incorporata sul modello agent attivo/predefinito. È
basata su soglia, quindi per impostazione predefinita non viene eseguita a ogni turno.

Il reviewer:

- usa lo stesso contesto provider/modello configurato quando disponibile
- fa fallback ai valori predefiniti dell'agent runtime
- ha `reviewTimeoutMs`
- usa contesto bootstrap leggero
- non ha tool
- non scrive nulla direttamente
- può solo emettere una proposta che passa attraverso il normale scanner e il
  percorso di approvazione/quarantena

Se il reviewer fallisce, va in timeout o restituisce JSON non valido, il Plugin registra un
messaggio warning/debug e salta quel passaggio di review.

## Modelli operativi

Usa Skill Workshop quando l'utente dice:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

Buon testo di Skill:

```markdown
## Workflow

- Verificare che l'URL della GIF si risolva in `image/gif`.
- Confermare che il file abbia più frame.
- Registrare URL sorgente, licenza e attribuzione.
- Salvare una copia locale quando la risorsa verrà distribuita con il prodotto.
- Verificare che la risorsa locale venga renderizzata nella UI di destinazione prima della risposta finale.
```

Cattivo testo di Skill:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Motivi per cui la versione scadente non dovrebbe essere salvata:

- ha forma di transcript
- non è imperativa
- include dettagli rumorosi e one-shot
- non dice al prossimo agent cosa fare

## Debug

Controlla se il Plugin è caricato:

```bash
openclaw plugins list --enabled
```

Controlla il conteggio delle proposte da un contesto agent/tool:

```json
{ "action": "status" }
```

Ispeziona le proposte pending:

```json
{ "action": "list_pending" }
```

Ispeziona le proposte in quarantena:

```json
{ "action": "list_quarantine" }
```

Sintomi comuni:

| Symptom                               | Likely cause                                                                        | Check                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool is unavailable                   | La voce del Plugin non è abilitata                                                  | `plugins.entries.skill-workshop.enabled` e `openclaw plugins list` |
| No automatic proposal appears         | `autoCapture: false`, `reviewMode: "off"` oppure soglie non raggiunte              | Configurazione, stato delle proposte, log del Gateway                |
| Heuristic did not capture             | La formulazione dell'utente non corrispondeva ai pattern di correzione             | Usa `skill_workshop.suggest` esplicito o abilita il reviewer LLM     |
| Reviewer did not create a proposal    | Il reviewer ha restituito `none`, JSON non valido o è andato in timeout            | Log del Gateway, `reviewTimeoutMs`, soglie                           |
| Proposal is not applied               | `approvalPolicy: "pending"`                                                         | `list_pending`, poi `apply`                                          |
| Proposal disappeared from pending     | Riutilizzo di proposta duplicata, pruning per max pending, oppure è stata applicata/rifiutata/messa in quarantena | `status`, `list_pending` con filtri di stato, `list_quarantine` |
| Skill file exists but model misses it | Lo snapshot della Skill non è stato aggiornato o il gating della Skill la esclude  | stato `openclaw skills` e idoneità delle Skills del workspace        |

Log rilevanti:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Scenari QA

Scenari QA supportati dal repository:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Esegui la copertura deterministica:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Esegui la copertura del reviewer:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Lo scenario reviewer è intenzionalmente separato perché abilita
`reviewMode: "llm"` ed esercita il passaggio del reviewer incorporato.

## Quando non abilitare l'applicazione automatica

Evita `approvalPolicy: "auto"` quando:

- il workspace contiene procedure sensibili
- l'agent sta lavorando su input non fidati
- le Skills sono condivise da un team ampio
- stai ancora regolando prompt o regole dello scanner
- il modello gestisce spesso contenuti web/email ostili

Usa prima la modalità pending. Passa alla modalità auto solo dopo aver esaminato il tipo di
Skills che l'agent propone in quel workspace.

## Documentazione correlata

- [Skills](/it/tools/skills)
- [Plugins](/it/tools/plugin)
- [Testing](/it/reference/test)
