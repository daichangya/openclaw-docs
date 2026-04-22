---
read_when:
    - Regolazione della cadenza o dei messaggi di Heartbeat
    - Decidere tra Heartbeat e Cron per le attività pianificate
summary: Messaggi di polling Heartbeat e regole di notifica
title: Heartbeat
x-i18n:
    generated_at: "2026-04-22T08:20:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat o Cron?** Consulta [Automazione e attività](/it/automation) per indicazioni su quando usare ciascuno.

Heartbeat esegue **turni periodici dell'agente** nella sessione principale così il modello può
far emergere tutto ciò che richiede attenzione senza inviarti spam.

Heartbeat è un turno pianificato della sessione principale — **non** crea record di [attività in background](/it/automation/tasks).
I record delle attività sono per lavoro scollegato (esecuzioni ACP, subagenti, processi Cron isolati).

Risoluzione dei problemi: [Attività pianificate](/it/automation/cron-jobs#troubleshooting)

## Guida rapida (principianti)

1. Lascia attivi gli heartbeat (il valore predefinito è `30m`, oppure `1h` per l'autenticazione Anthropic OAuth/token, incluso il riutilizzo di Claude CLI) oppure imposta una cadenza personalizzata.
2. Crea una piccola checklist `HEARTBEAT.md` o un blocco `tasks:` nello spazio di lavoro dell'agente (facoltativo ma consigliato).
3. Decidi dove devono andare i messaggi di heartbeat (`target: "none"` è il valore predefinito; imposta `target: "last"` per instradare verso l'ultimo contatto).
4. Facoltativo: abilita la consegna del ragionamento di heartbeat per maggiore trasparenza.
5. Facoltativo: usa un contesto bootstrap leggero se le esecuzioni di heartbeat richiedono solo `HEARTBEAT.md`.
6. Facoltativo: abilita sessioni isolate per evitare di inviare l'intera cronologia della conversazione a ogni heartbeat.
7. Facoltativo: limita gli heartbeat alle ore attive (ora locale).

Configurazione di esempio:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // consegna esplicita all'ultimo contatto (il valore predefinito è "none")
        directPolicy: "allow", // predefinito: consenti destinazioni dirette/DM; imposta "block" per sopprimere
        lightContext: true, // facoltativo: inietta solo HEARTBEAT.md dai file bootstrap
        isolatedSession: true, // facoltativo: nuova sessione a ogni esecuzione (senza cronologia conversazione)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // facoltativo: invia anche un messaggio separato `Reasoning:`
      },
    },
  },
}
```

## Valori predefiniti

- Intervallo: `30m` (oppure `1h` quando la modalità di autenticazione rilevata è Anthropic OAuth/token, incluso il riutilizzo di Claude CLI). Imposta `agents.defaults.heartbeat.every` oppure `agents.list[].heartbeat.every`; usa `0m` per disabilitare.
- Corpo del prompt (configurabile tramite `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Il prompt di heartbeat viene inviato **testualmente** come messaggio utente. Il prompt
  di sistema include una sezione “Heartbeat” solo quando gli heartbeat sono abilitati per l'agente
  predefinito e l'esecuzione è contrassegnata internamente.
- Quando gli heartbeat sono disabilitati con `0m`, le esecuzioni normali omettono anche `HEARTBEAT.md`
  dal contesto bootstrap così il modello non vede istruzioni riservate agli heartbeat.
- Le ore attive (`heartbeat.activeHours`) vengono controllate nel fuso orario configurato.
  Fuori dalla finestra, gli heartbeat vengono saltati fino al tick successivo all'interno della finestra.

## A cosa serve il prompt di heartbeat

Il prompt predefinito è intenzionalmente ampio:

- **Attività in background**: “Consider outstanding tasks” spinge l'agente a rivedere
  i follow-up (posta in arrivo, calendario, promemoria, lavoro in coda) e a far emergere tutto ciò che è urgente.
- **Controllo con la persona**: “Checkup sometimes on your human during day time” incoraggia un
  leggero messaggio occasionale del tipo “hai bisogno di qualcosa?”, ma evita lo spam notturno
  usando il tuo fuso orario locale configurato (vedi [/concepts/timezone](/it/concepts/timezone)).

Heartbeat può reagire alle [attività in background](/it/automation/tasks) completate, ma un'esecuzione heartbeat di per sé non crea un record attività.

Se vuoi che un heartbeat faccia qualcosa di molto specifico (ad esempio “controlla le statistiche Gmail PubSub”
o “verifica lo stato del Gateway”), imposta `agents.defaults.heartbeat.prompt` (oppure
`agents.list[].heartbeat.prompt`) su un corpo personalizzato (inviato testualmente).

## Contratto di risposta

- Se nulla richiede attenzione, rispondi con **`HEARTBEAT_OK`**.
- Durante le esecuzioni heartbeat, OpenClaw tratta `HEARTBEAT_OK` come conferma quando compare
  all'**inizio o alla fine** della risposta. Il token viene rimosso e la risposta viene
  scartata se il contenuto rimanente è **≤ `ackMaxChars`** (predefinito: 300).
- Se `HEARTBEAT_OK` compare **nel mezzo** di una risposta, non viene trattato
  in modo speciale.
- Per gli avvisi, **non** includere `HEARTBEAT_OK`; restituisci solo il testo dell'avviso.

Fuori dagli heartbeat, un `HEARTBEAT_OK` accidentale all'inizio/fine di un messaggio viene rimosso
e registrato; un messaggio che è solo `HEARTBEAT_OK` viene scartato.

## Configurazione

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // predefinito: 30m (0m disabilita)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // predefinito: false (consegna un messaggio separato Reasoning: quando disponibile)
        lightContext: false, // predefinito: false; true mantiene solo HEARTBEAT.md dai file bootstrap dello spazio di lavoro
        isolatedSession: false, // predefinito: false; true esegue ogni heartbeat in una sessione nuova (senza cronologia conversazione)
        target: "last", // predefinito: none | opzioni: last | none | <id canale> (core o Plugin, ad es. "bluebubbles")
        to: "+15551234567", // facoltativo, override specifico del canale
        accountId: "ops-bot", // id canale multi-account facoltativo
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // numero massimo di caratteri consentiti dopo HEARTBEAT_OK
      },
    },
  },
}
```

### Ambito e precedenza

- `agents.defaults.heartbeat` imposta il comportamento globale di heartbeat.
- `agents.list[].heartbeat` viene unito sopra; se un agente ha un blocco `heartbeat`, **solo quegli agenti** eseguono heartbeat.
- `channels.defaults.heartbeat` imposta i valori predefiniti di visibilità per tutti i canali.
- `channels.<channel>.heartbeat` sovrascrive i valori predefiniti del canale.
- `channels.<channel>.accounts.<id>.heartbeat` (canali multi-account) sovrascrive le impostazioni per canale.

### Heartbeat per agente

Se un qualsiasi elemento `agents.list[]` include un blocco `heartbeat`, **solo quegli agenti**
eseguono heartbeat. Il blocco per agente viene unito sopra `agents.defaults.heartbeat`
(così puoi impostare una volta valori predefiniti condivisi e sovrascriverli per singolo agente).

Esempio: due agenti, solo il secondo agente esegue heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // consegna esplicita all'ultimo contatto (il valore predefinito è "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Esempio di ore attive

Limita gli heartbeat all'orario lavorativo in un fuso orario specifico:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // consegna esplicita all'ultimo contatto (il valore predefinito è "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // facoltativo; usa userTimezone se impostato, altrimenti il fuso orario dell'host
        },
      },
    },
  },
}
```

Fuori da questa finestra (prima delle 9:00 o dopo le 22:00 Eastern), gli heartbeat vengono saltati. Il tick pianificato successivo all'interno della finestra verrà eseguito normalmente.

### Configurazione 24/7

Se vuoi che gli heartbeat vengano eseguiti tutto il giorno, usa uno di questi modelli:

- Ometti completamente `activeHours` (nessuna limitazione di finestra oraria; è il comportamento predefinito).
- Imposta una finestra di un'intera giornata: `activeHours: { start: "00:00", end: "24:00" }`.

Non impostare la stessa ora per `start` ed `end` (ad esempio da `08:00` a `08:00`).
Questo viene trattato come una finestra di ampiezza zero, quindi gli heartbeat vengono sempre saltati.

### Esempio multi-account

Usa `accountId` per puntare a un account specifico su canali multi-account come Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // facoltativo: instrada a un topic/thread specifico
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Note sui campi

- `every`: intervallo heartbeat (stringa di durata; unità predefinita = minuti).
- `model`: override facoltativo del modello per le esecuzioni heartbeat (`provider/model`).
- `includeReasoning`: quando abilitato, consegna anche il messaggio separato `Reasoning:` quando disponibile (stessa struttura di `/reasoning on`).
- `lightContext`: quando è true, le esecuzioni heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file bootstrap dello spazio di lavoro.
- `isolatedSession`: quando è true, ogni heartbeat viene eseguito in una sessione nuova senza cronologia della conversazione precedente. Usa lo stesso schema di isolamento di Cron `sessionTarget: "isolated"`. Riduce drasticamente il costo in token per heartbeat. Combinalo con `lightContext: true` per il massimo risparmio. L'instradamento della consegna continua comunque a usare il contesto della sessione principale.
- `session`: chiave sessione facoltativa per le esecuzioni heartbeat.
  - `main` (predefinito): sessione principale dell'agente.
  - Chiave sessione esplicita (copiala da `openclaw sessions --json` o dalla [CLI sessions](/cli/sessions)).
  - Formati della chiave sessione: vedi [Sessioni](/it/concepts/session) e [Gruppi](/it/channels/groups).
- `target`:
  - `last`: consegna all'ultimo canale esterno usato.
  - canale esplicito: qualsiasi id di canale o Plugin configurato, per esempio `discord`, `matrix`, `telegram` o `whatsapp`.
  - `none` (predefinito): esegui l'heartbeat ma **non consegnarlo** esternamente.
- `directPolicy`: controlla il comportamento di consegna diretta/DM:
  - `allow` (predefinito): consenti la consegna heartbeat diretta/DM.
  - `block`: sopprimi la consegna diretta/DM (`reason=dm-blocked`).
- `to`: override facoltativo del destinatario (id specifico del canale, ad es. E.164 per WhatsApp o un id chat di Telegram). Per topic/thread di Telegram, usa `<chatId>:topic:<messageThreadId>`.
- `accountId`: id account facoltativo per canali multi-account. Quando `target: "last"`, l'id account si applica all'ultimo canale risolto se supporta account; altrimenti viene ignorato. Se l'id account non corrisponde a un account configurato per il canale risolto, la consegna viene saltata.
- `prompt`: sovrascrive il corpo del prompt predefinito (non viene unito).
- `ackMaxChars`: numero massimo di caratteri consentiti dopo `HEARTBEAT_OK` prima della consegna.
- `suppressToolErrorWarnings`: quando è true, sopprime i payload di avviso di errore degli strumenti durante le esecuzioni heartbeat.
- `activeHours`: limita le esecuzioni heartbeat a una finestra oraria. Oggetto con `start` (HH:MM, inclusivo; usa `00:00` per l'inizio del giorno), `end` (HH:MM esclusivo; `24:00` consentito per la fine del giorno) e `timezone` facoltativo.
  - Ometti o `"user"`: usa `agents.defaults.userTimezone` se impostato, altrimenti ripiega sul fuso orario del sistema host.
  - `"local"`: usa sempre il fuso orario del sistema host.
  - Qualsiasi identificatore IANA (ad es. `America/New_York`): usato direttamente; se non valido, ripiega sul comportamento `"user"` descritto sopra.
  - `start` ed `end` non devono essere uguali per una finestra attiva; valori uguali vengono trattati come ampiezza zero (sempre fuori finestra).
  - Fuori dalla finestra attiva, gli heartbeat vengono saltati fino al tick successivo all'interno della finestra.

## Comportamento di consegna

- Per impostazione predefinita gli heartbeat vengono eseguiti nella sessione principale dell'agente (`agent:<id>:<mainKey>`),
  oppure in `global` quando `session.scope = "global"`. Imposta `session` per sovrascrivere verso una
  sessione di canale specifica (Discord/WhatsApp/ecc.).
- `session` influisce solo sul contesto di esecuzione; la consegna è controllata da `target` e `to`.
- Per consegnare a un canale/destinatario specifico, imposta `target` + `to`. Con
  `target: "last"`, la consegna usa l'ultimo canale esterno di quella sessione.
- Le consegne heartbeat consentono per impostazione predefinita destinazioni dirette/DM. Imposta `directPolicy: "block"` per sopprimere gli invii a destinazioni dirette continuando comunque a eseguire il turno heartbeat.
- Se la coda principale è occupata, l'heartbeat viene saltato e ritentato in seguito.
- Se `target` non si risolve in alcuna destinazione esterna, l'esecuzione avviene comunque ma non
  viene inviato alcun messaggio in uscita.
- Se `showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati, l'esecuzione viene saltata subito con `reason=alerts-disabled`.
- Se è disabilitata solo la consegna degli avvisi, OpenClaw può comunque eseguire l'heartbeat, aggiornare i timestamp delle attività in scadenza, ripristinare il timestamp di inattività della sessione e sopprimere il payload dell'avviso verso l'esterno.
- Se la destinazione heartbeat risolta supporta l'indicatore di digitazione, OpenClaw mostra la digitazione mentre
  l'esecuzione heartbeat è attiva. Questo usa la stessa destinazione a cui l'heartbeat
  invierebbe l'output della chat, ed è disabilitato da `typingMode: "never"`.
- Le risposte solo-heartbeat **non** mantengono attiva la sessione; l'ultimo `updatedAt`
  viene ripristinato così la scadenza per inattività si comporta normalmente.
- Le [attività in background](/it/automation/tasks) scollegate possono accodare un evento di sistema e riattivare heartbeat quando la sessione principale deve notare rapidamente qualcosa. Questa riattivazione non fa dell'esecuzione heartbeat un'attività in background.

## Controlli di visibilità

Per impostazione predefinita, le conferme `HEARTBEAT_OK` vengono soppresse mentre il contenuto degli avvisi viene
consegnato. Puoi regolare questo comportamento per canale o per account:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Nasconde HEARTBEAT_OK (predefinito)
      showAlerts: true # Mostra i messaggi di avviso (predefinito)
      useIndicator: true # Emette eventi indicatore (predefinito)
  telegram:
    heartbeat:
      showOk: true # Mostra le conferme OK su Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Sopprime la consegna degli avvisi per questo account
```

Precedenza: per-account → per-canale → valori predefiniti del canale → valori predefiniti integrati.

### Cosa fa ciascun flag

- `showOk`: invia una conferma `HEARTBEAT_OK` quando il modello restituisce una risposta di solo OK.
- `showAlerts`: invia il contenuto dell'avviso quando il modello restituisce una risposta diversa da OK.
- `useIndicator`: emette eventi indicatore per le superfici UI di stato.

Se **tutti e tre** sono false, OpenClaw salta completamente l'esecuzione heartbeat (nessuna chiamata al modello).

### Esempi per canale e per account

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # tutti gli account Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # sopprime gli avvisi solo per l'account ops
  telegram:
    heartbeat:
      showOk: true
```

### Modelli comuni

| Obiettivo | Configurazione |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento predefinito (OK silenziosi, avvisi attivi) | _(nessuna configurazione necessaria)_ |
| Completamente silenzioso (nessun messaggio, nessun indicatore) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicatore (nessun messaggio) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OK in un solo canale | `channels.telegram.heartbeat: { showOk: true }` |

## HEARTBEAT.md (facoltativo)

Se nello spazio di lavoro esiste un file `HEARTBEAT.md`, il prompt predefinito dice all'agente di
leggerlo. Pensalo come la tua “checklist heartbeat”: piccola, stabile e
sicura da includere ogni 30 minuti.

Nelle esecuzioni normali, `HEARTBEAT.md` viene iniettato solo quando la guida heartbeat è
abilitata per l'agente predefinito. Disabilitare la cadenza heartbeat con `0m` oppure
impostare `includeSystemPromptSection: false` lo omette dal normale contesto bootstrap.

Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni
markdown come `# Heading`), OpenClaw salta l'esecuzione heartbeat per risparmiare chiamate API.
Questo salto viene riportato come `reason=empty-heartbeat-file`.
Se il file manca, l'heartbeat viene comunque eseguito e il modello decide cosa fare.

Mantienilo piccolo (checklist breve o promemoria) per evitare di appesantire il prompt.

Esempio di `HEARTBEAT.md`:

```md
# Checklist Heartbeat

- Scansione rapida: c'è qualcosa di urgente nelle caselle di posta?
- Se è giorno, fai un rapido check-in se non c'è altro in sospeso.
- Se un'attività è bloccata, annota _che cosa manca_ e chiedilo a Peter la prossima volta.
```

### Blocchi `tasks:`

`HEARTBEAT.md` supporta anche un piccolo blocco strutturato `tasks:` per
controlli a intervallo all'interno di heartbeat stesso.

Esempio:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Controlla se ci sono email urgenti non lette e segnala tutto ciò che è sensibile al fattore tempo."
- name: calendar-scan
  interval: 2h
  prompt: "Controlla le riunioni imminenti che richiedono preparazione o follow-up."

# Istruzioni aggiuntive

- Mantieni gli avvisi brevi.
- Se nulla richiede attenzione dopo tutte le attività in scadenza, rispondi HEARTBEAT_OK.
```

Comportamento:

- OpenClaw analizza il blocco `tasks:` e controlla ciascuna attività rispetto al proprio `interval`.
- Solo le attività **in scadenza** vengono incluse nel prompt heartbeat per quel tick.
- Se non ci sono attività in scadenza, l'heartbeat viene saltato completamente (`reason=no-tasks-due`) per evitare una chiamata al modello sprecata.
- Il contenuto non relativo alle attività in `HEARTBEAT.md` viene preservato e aggiunto come contesto supplementare dopo l'elenco delle attività in scadenza.
- I timestamp dell'ultima esecuzione delle attività vengono archiviati nello stato della sessione (`heartbeatTaskState`), così gli intervalli sopravvivono ai normali riavvii.
- I timestamp delle attività vengono avanzati solo dopo che un'esecuzione heartbeat completa il normale percorso di risposta. Le esecuzioni saltate `empty-heartbeat-file` / `no-tasks-due` non segnano le attività come completate.

La modalità attività è utile quando vuoi che un solo file heartbeat contenga diversi controlli periodici senza pagare per tutti a ogni tick.

### L'agente può aggiornare HEARTBEAT.md?

Sì — se glielo chiedi.

`HEARTBEAT.md` è solo un normale file nello spazio di lavoro dell'agente, quindi puoi dire all'agente
(in una chat normale) qualcosa come:

- “Aggiorna `HEARTBEAT.md` per aggiungere un controllo giornaliero del calendario.”
- “Riscrivi `HEARTBEAT.md` in modo che sia più breve e focalizzato sui follow-up della posta in arrivo.”

Se vuoi che questo avvenga in modo proattivo, puoi anche includere una riga esplicita nel
prompt heartbeat, come: “Se la checklist diventa obsoleta, aggiorna HEARTBEAT.md
con una migliore.”

Nota di sicurezza: non inserire segreti (chiavi API, numeri di telefono, token privati) in
`HEARTBEAT.md` — diventa parte del contesto del prompt.

## Riattivazione manuale (su richiesta)

Puoi accodare un evento di sistema e attivare immediatamente un heartbeat con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se più agenti hanno `heartbeat` configurato, una riattivazione manuale esegue immediatamente gli
heartbeat di ciascuno di questi agenti.

Usa `--mode next-heartbeat` per attendere il tick pianificato successivo.

## Consegna del ragionamento (facoltativa)

Per impostazione predefinita, gli heartbeat consegnano solo il payload finale di “risposta”.

Se vuoi trasparenza, abilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando è abilitato, gli heartbeat consegneranno anche un messaggio separato con prefisso
`Reasoning:` (stessa struttura di `/reasoning on`). Può essere utile quando l'agente
gestisce più sessioni/codex e vuoi capire perché ha deciso di inviarti un ping
— ma può anche esporre più dettagli interni di quanti tu ne voglia. È preferibile tenerlo
disattivato nelle chat di gruppo.

## Attenzione ai costi

Gli heartbeat eseguono turni completi dell'agente. Intervalli più brevi consumano più token. Per ridurre i costi:

- Usa `isolatedSession: true` per evitare di inviare l'intera cronologia della conversazione (~100K token ridotti a ~2-5K per esecuzione).
- Usa `lightContext: true` per limitare i file bootstrap al solo `HEARTBEAT.md`.
- Imposta un `model` più economico (ad es. `ollama/llama3.2:1b`).
- Mantieni `HEARTBEAT.md` piccolo.
- Usa `target: "none"` se vuoi solo aggiornamenti dello stato interno.

## Correlati

- [Automazione e attività](/it/automation) — panoramica di tutti i meccanismi di automazione
- [Attività in background](/it/automation/tasks) — come viene tracciato il lavoro scollegato
- [Fuso orario](/it/concepts/timezone) — come il fuso orario influisce sulla pianificazione di heartbeat
- [Risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting) — debug dei problemi di automazione
