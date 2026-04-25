---
read_when:
    - Regolazione della cadenza o della messaggistica di Heartbeat
    - Decidere tra Heartbeat e Cron per le attività pianificate
summary: Messaggi di polling Heartbeat e regole di notifica
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:47:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat o Cron?** Vedi [Automazione e attività](/it/automation) per indicazioni su quando usare ciascuno.

Heartbeat esegue **turni periodici dell'agente** nella sessione principale così il modello può
far emergere ciò che richiede attenzione senza fare spam.

Heartbeat è un turno pianificato della sessione principale — **non** crea record di [attività in background](/it/automation/tasks).
I record delle attività sono per lavoro scollegato (esecuzioni ACP, subagenti, processi cron isolati).

Risoluzione dei problemi: [Attività pianificate](/it/automation/cron-jobs#troubleshooting)

## Avvio rapido (principianti)

1. Lascia gli heartbeat abilitati (il valore predefinito è `30m`, oppure `1h` per auth Anthropic OAuth/token, incluso il riuso di Claude CLI) o imposta la tua cadenza.
2. Crea una piccola checklist `HEARTBEAT.md` o un blocco `tasks:` nello spazio di lavoro dell'agente (facoltativo ma consigliato).
3. Decidi dove devono andare i messaggi heartbeat (`target: "none"` è il valore predefinito; imposta `target: "last"` per instradare all'ultimo contatto).
4. Facoltativo: abilita la consegna del reasoning dell'heartbeat per maggiore trasparenza.
5. Facoltativo: usa un contesto bootstrap leggero se le esecuzioni heartbeat richiedono solo `HEARTBEAT.md`.
6. Facoltativo: abilita sessioni isolate per evitare di inviare l'intera cronologia della conversazione a ogni heartbeat.
7. Facoltativo: limita gli heartbeat alle ore attive (ora locale).

Esempio di configurazione:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // consegna esplicita all'ultimo contatto (il valore predefinito è "none")
        directPolicy: "allow", // predefinito: allow direct/DM targets; imposta "block" per sopprimere
        lightContext: true, // facoltativo: inietta solo HEARTBEAT.md dai file bootstrap
        isolatedSession: true, // facoltativo: sessione nuova a ogni esecuzione (nessuna cronologia conversazione)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // facoltativo: invia anche un messaggio separato `Reasoning:`
      },
    },
  },
}
```

## Valori predefiniti

- Intervallo: `30m` (oppure `1h` quando la modalità auth rilevata è Anthropic OAuth/token, incluso il riuso di Claude CLI). Imposta `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` per agente; usa `0m` per disabilitare.
- Corpo del prompt (configurabile tramite `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Il prompt heartbeat viene inviato **verbatim** come messaggio utente. Il prompt di
  sistema include una sezione “Heartbeat” solo quando gli heartbeat sono abilitati per l'
  agente predefinito, e l'esecuzione è contrassegnata internamente.
- Quando gli heartbeat sono disabilitati con `0m`, anche le esecuzioni normali omettono `HEARTBEAT.md`
  dal contesto bootstrap così il modello non vede istruzioni solo-heartbeat.
- Le ore attive (`heartbeat.activeHours`) vengono controllate nel fuso orario configurato.
  Fuori dalla finestra, gli heartbeat vengono saltati fino al tick successivo dentro la finestra.

## A cosa serve il prompt heartbeat

Il prompt predefinito è intenzionalmente ampio:

- **Attività in background**: “Consider outstanding tasks” spinge l'agente a rivedere
  i follow-up (posta in arrivo, calendario, promemoria, lavoro in coda) e a far emergere tutto ciò che è urgente.
- **Controllo umano**: “Checkup sometimes on your human during day time” spinge a un
  occasionale leggero “hai bisogno di qualcosa?”, ma evita spam notturno
  usando il tuo fuso orario locale configurato (vedi [/concepts/timezone](/it/concepts/timezone)).

Heartbeat può reagire alle [attività in background](/it/automation/tasks) completate, ma un'esecuzione heartbeat di per sé non crea un record attività.

Se vuoi che un heartbeat faccia qualcosa di molto specifico (ad esempio “controlla le statistiche Gmail PubSub”
oppure “verifica lo stato del gateway”), imposta `agents.defaults.heartbeat.prompt` (o
`agents.list[].heartbeat.prompt`) su un corpo personalizzato (inviato verbatim).

## Contratto di risposta

- Se nulla richiede attenzione, rispondi con **`HEARTBEAT_OK`**.
- Durante le esecuzioni heartbeat, OpenClaw tratta `HEARTBEAT_OK` come ack quando appare
  all'**inizio o alla fine** della risposta. Il token viene rimosso e la risposta viene
  scartata se il contenuto rimanente è **≤ `ackMaxChars`** (predefinito: 300).
- Se `HEARTBEAT_OK` appare nel **mezzo** di una risposta, non viene trattato
  in modo speciale.
- Per gli avvisi, **non** includere `HEARTBEAT_OK`; restituisci solo il testo dell'avviso.

Fuori dagli heartbeat, un `HEARTBEAT_OK` accidentale all'inizio/fine di un messaggio viene rimosso
e registrato nei log; un messaggio che contiene solo `HEARTBEAT_OK` viene scartato.

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
        isolatedSession: false, // predefinito: false; true esegue ogni heartbeat in una sessione nuova (nessuna cronologia conversazione)
        target: "last", // predefinito: none | opzioni: last | none | <channel id> (core o Plugin, ad esempio "bluebubbles")
        to: "+15551234567", // override facoltativo specifico del canale
        accountId: "ops-bot", // id canale multi-account facoltativo
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max caratteri consentiti dopo HEARTBEAT_OK
      },
    },
  },
}
```

### Ambito e precedenza

- `agents.defaults.heartbeat` imposta il comportamento heartbeat globale.
- `agents.list[].heartbeat` viene unito sopra; se un qualsiasi agente ha un blocco `heartbeat`, **solo quegli agenti** eseguono heartbeat.
- `channels.defaults.heartbeat` imposta i valori predefiniti di visibilità per tutti i canali.
- `channels.<channel>.heartbeat` sovrascrive i valori predefiniti del canale.
- `channels.<channel>.accounts.<id>.heartbeat` (canali multi-account) sovrascrive le impostazioni per canale.

### Heartbeat per agente

Se una qualsiasi voce `agents.list[]` include un blocco `heartbeat`, **solo quegli agenti**
eseguono heartbeat. Il blocco per agente viene unito sopra `agents.defaults.heartbeat`
(così puoi impostare una sola volta valori predefiniti condivisi e sovrascriverli per agente).

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

Fuori da questa finestra (prima delle 9 o dopo le 22 Eastern), gli heartbeat vengono saltati. Il tick pianificato successivo dentro la finestra verrà eseguito normalmente.

### Configurazione 24/7

Se vuoi che gli heartbeat vengano eseguiti tutto il giorno, usa uno di questi pattern:

- Ometti del tutto `activeHours` (nessuna restrizione a finestra temporale; questo è il comportamento predefinito).
- Imposta una finestra di giornata intera: `activeHours: { start: "00:00", end: "24:00" }`.

Non impostare lo stesso orario per `start` ed `end` (ad esempio `08:00` a `08:00`).
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
          to: "12345678:topic:42", // facoltativo: instrada a uno specifico topic/thread
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

- `every`: intervallo heartbeat (stringa durata; unità predefinita = minuti).
- `model`: override facoltativo del modello per le esecuzioni heartbeat (`provider/model`).
- `includeReasoning`: quando abilitato, consegna anche il messaggio separato `Reasoning:` quando disponibile (stessa forma di `/reasoning on`).
- `lightContext`: quando true, le esecuzioni heartbeat usano contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file bootstrap dello spazio di lavoro.
- `isolatedSession`: quando true, ogni heartbeat viene eseguito in una sessione nuova senza cronologia delle conversazioni precedenti. Usa lo stesso pattern di isolamento del cron `sessionTarget: "isolated"`. Riduce drasticamente il costo in token per heartbeat. Combinalo con `lightContext: true` per il massimo risparmio. L'instradamento di consegna usa comunque il contesto della sessione principale.
- `session`: chiave di sessione facoltativa per le esecuzioni heartbeat.
  - `main` (predefinito): sessione principale dell'agente.
  - Chiave di sessione esplicita (copiala da `openclaw sessions --json` o dalla [CLI delle sessioni](/it/cli/sessions)).
  - Formati delle chiavi di sessione: vedi [Sessioni](/it/concepts/session) e [Gruppi](/it/channels/groups).
- `target`:
  - `last`: consegna all'ultimo canale esterno usato.
  - canale esplicito: qualsiasi canale configurato o id Plugin, ad esempio `discord`, `matrix`, `telegram` o `whatsapp`.
  - `none` (predefinito): esegue l'heartbeat ma **non lo consegna** esternamente.
- `directPolicy`: controlla il comportamento di consegna diretta/DM:
  - `allow` (predefinito): consente la consegna diretta/DM dell'heartbeat.
  - `block`: sopprime la consegna diretta/DM (`reason=dm-blocked`).
- `to`: override facoltativo del destinatario (id specifico del canale, ad esempio E.164 per WhatsApp o un chat id Telegram). Per topic/thread Telegram, usa `<chatId>:topic:<messageThreadId>`.
- `accountId`: id account facoltativo per canali multi-account. Quando `target: "last"`, l'id account si applica all'ultimo canale risolto se supporta account; altrimenti viene ignorato. Se l'id account non corrisponde a un account configurato per il canale risolto, la consegna viene saltata.
- `prompt`: sovrascrive il corpo del prompt predefinito (non viene unito).
- `ackMaxChars`: max caratteri consentiti dopo `HEARTBEAT_OK` prima della consegna.
- `suppressToolErrorWarnings`: quando true, sopprime i payload di avviso di errore degli strumenti durante le esecuzioni heartbeat.
- `activeHours`: limita le esecuzioni heartbeat a una finestra temporale. Oggetto con `start` (HH:MM, inclusivo; usa `00:00` per l'inizio giornata), `end` (HH:MM esclusivo; `24:00` consentito per fine giornata) e `timezone` facoltativo.
  - Ometti o `"user"`: usa `agents.defaults.userTimezone` se impostato, altrimenti usa come fallback il fuso orario del sistema host.
  - `"local"`: usa sempre il fuso orario del sistema host.
  - Qualsiasi identificatore IANA (ad esempio `America/New_York`): usato direttamente; se non valido, usa come fallback il comportamento `"user"` sopra.
  - `start` ed `end` non devono essere uguali per una finestra attiva; valori uguali sono trattati come larghezza zero (sempre fuori finestra).
  - Fuori dalla finestra attiva, gli heartbeat vengono saltati fino al tick successivo dentro la finestra.

## Comportamento di consegna

- Gli heartbeat vengono eseguiti nella sessione principale dell'agente per impostazione predefinita (`agent:<id>:<mainKey>`),
  oppure in `global` quando `session.scope = "global"`. Imposta `session` per sovrascrivere con una
  sessione di canale specifica (Discord/WhatsApp/ecc.).
- `session` influisce solo sul contesto dell'esecuzione; la consegna è controllata da `target` e `to`.
- Per consegnare a un canale/destinatario specifico, imposta `target` + `to`. Con
  `target: "last"`, la consegna usa l'ultimo canale esterno per quella sessione.
- Le consegne heartbeat consentono per impostazione predefinita destinazioni dirette/DM. Imposta `directPolicy: "block"` per sopprimere gli invii a destinazioni dirette continuando comunque a eseguire il turno heartbeat.
- Se la coda principale è occupata, l'heartbeat viene saltato e ritentato più tardi.
- Se `target` non risolve alcuna destinazione esterna, l'esecuzione avviene comunque ma non
  viene inviato alcun messaggio in uscita.
- Se `showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati, l'esecuzione viene saltata subito con `reason=alerts-disabled`.
- Se è disabilitata solo la consegna degli avvisi, OpenClaw può comunque eseguire l'heartbeat, aggiornare i timestamp delle attività in scadenza, ripristinare il timestamp di inattività della sessione e sopprimere il payload dell'avviso verso l'esterno.
- Se la destinazione heartbeat risolta supporta l'indicatore di digitazione, OpenClaw mostra che sta digitando mentre
  l'esecuzione heartbeat è attiva. Questo usa la stessa destinazione a cui l'heartbeat
  invierebbe l'output chat, ed è disabilitato da `typingMode: "never"`.
- Le risposte solo-heartbeat **non** mantengono viva la sessione; l'ultimo `updatedAt`
  viene ripristinato così la scadenza per inattività si comporta normalmente.
- La cronologia di Control UI e WebChat nasconde i prompt heartbeat e gli ack
  contenenti solo OK. Il transcript della sessione sottostante può comunque contenere quei
  turni per audit/replay.
- Le [attività in background](/it/automation/tasks) scollegate possono accodare un evento di sistema e riattivare Heartbeat quando la sessione principale deve notare qualcosa rapidamente. Questa riattivazione non rende l'esecuzione Heartbeat un'attività in background.

## Controlli di visibilità

Per impostazione predefinita, gli ack `HEARTBEAT_OK` vengono soppressi mentre il contenuto degli avvisi viene
consegnato. Puoi regolarlo per canale o per account:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Nasconde HEARTBEAT_OK (predefinito)
      showAlerts: true # Mostra i messaggi di avviso (predefinito)
      useIndicator: true # Emette eventi indicatore (predefinito)
  telegram:
    heartbeat:
      showOk: true # Mostra gli ack OK su Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Sopprime la consegna degli avvisi per questo account
```

Precedenza: per-account → per-channel → valori predefiniti del canale → valori predefiniti integrati.

### Cosa fa ciascun flag

- `showOk`: invia un ack `HEARTBEAT_OK` quando il modello restituisce una risposta contenente solo OK.
- `showAlerts`: invia il contenuto dell'avviso quando il modello restituisce una risposta non-OK.
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

### Pattern comuni

| Obiettivo                                | Configurazione                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento predefinito (OK silenziosi, avvisi attivi) | _(nessuna configurazione necessaria)_                                      |
| Completamente silenzioso (nessun messaggio, nessun indicatore) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicatore (nessun messaggio)       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OK in un solo canale                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facoltativo)

Se nello spazio di lavoro esiste un file `HEARTBEAT.md`, il prompt predefinito dice all'
agente di leggerlo. Pensalo come alla tua “checklist heartbeat”: piccola, stabile e
sicura da includere ogni 30 minuti.

Nelle esecuzioni normali, `HEARTBEAT.md` viene iniettato solo quando la guida heartbeat è
abilitata per l'agente predefinito. Disabilitando la cadenza heartbeat con `0m` oppure
impostando `includeSystemPromptSection: false` lo si omette dal normale bootstrap
context.

Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e header markdown
come `# Heading`), OpenClaw salta l'esecuzione heartbeat per risparmiare chiamate API.
Questo salto viene segnalato come `reason=empty-heartbeat-file`.
Se il file manca, l'heartbeat viene comunque eseguito e il modello decide cosa fare.

Tienilo piccolo (checklist breve o promemoria) per evitare di gonfiare il prompt.

Esempio di `HEARTBEAT.md`:

```md
# Checklist heartbeat

- Scansione rapida: c'è qualcosa di urgente nelle inbox?
- Se è giorno, fai un leggero check-in se non c'è altro in sospeso.
- Se un'attività è bloccata, annota _cosa manca_ e chiedilo a Peter la prossima volta.
```

### Blocchi `tasks:`

`HEARTBEAT.md` supporta anche un piccolo blocco strutturato `tasks:` per controlli basati su intervalli
all'interno dello stesso heartbeat.

Esempio:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Istruzioni aggiuntive

- Mantieni brevi gli avvisi.
- Se nulla richiede attenzione dopo tutte le attività in scadenza, rispondi HEARTBEAT_OK.
```

Comportamento:

- OpenClaw analizza il blocco `tasks:` e controlla ogni attività rispetto al proprio `interval`.
- Solo le attività **in scadenza** vengono incluse nel prompt heartbeat per quel tick.
- Se nessuna attività è in scadenza, l'heartbeat viene saltato del tutto (`reason=no-tasks-due`) per evitare una chiamata al modello sprecata.
- Il contenuto non-task in `HEARTBEAT.md` viene mantenuto e aggiunto come contesto aggiuntivo dopo l'elenco delle attività in scadenza.
- I timestamp dell'ultima esecuzione delle attività vengono memorizzati nello stato di sessione (`heartbeatTaskState`), così gli intervalli sopravvivono ai normali riavvii.
- I timestamp delle attività avanzano solo dopo che un'esecuzione heartbeat completa il normale percorso di risposta. Le esecuzioni saltate `empty-heartbeat-file` / `no-tasks-due` non contrassegnano le attività come completate.

La modalità attività è utile quando vuoi che un solo file heartbeat contenga diversi controlli periodici senza pagare per tutti a ogni tick.

### L'agente può aggiornare HEARTBEAT.md?

Sì — se glielo chiedi.

`HEARTBEAT.md` è semplicemente un file normale nello spazio di lavoro dell'agente, quindi puoi dire all'
agente (in una normale chat) qualcosa come:

- “Aggiorna `HEARTBEAT.md` per aggiungere un controllo quotidiano del calendario.”
- “Riscrivi `HEARTBEAT.md` in modo che sia più corto e focalizzato sui follow-up della inbox.”

Se vuoi che questo avvenga in modo proattivo, puoi anche includere una riga esplicita nel
tuo prompt heartbeat come: “Se la checklist diventa obsoleta, aggiorna HEARTBEAT.md
con una versione migliore.”

Nota di sicurezza: non inserire segreti (chiavi API, numeri di telefono, token privati) in
`HEARTBEAT.md` — diventa parte del contesto del prompt.

## Riattivazione manuale (on-demand)

Puoi accodare un evento di sistema e attivare immediatamente un heartbeat con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se più agenti hanno `heartbeat` configurato, una riattivazione manuale esegue immediatamente gli heartbeat di ciascuno di quegli
agenti.

Usa `--mode next-heartbeat` per attendere il prossimo tick pianificato.

## Consegna del reasoning (facoltativa)

Per impostazione predefinita, gli heartbeat consegnano solo il payload finale della “risposta”.

Se vuoi trasparenza, abilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando è abilitato, gli heartbeat consegneranno anche un messaggio separato con prefisso
`Reasoning:` (stessa forma di `/reasoning on`). Questo può essere utile quando l'agente
gestisce più sessioni/codex e vuoi vedere perché ha deciso di inviarti un ping
— ma può anche esporre più dettagli interni di quanti tu ne voglia. È preferibile lasciarlo
disattivato nelle chat di gruppo.

## Attenzione ai costi

Gli heartbeat eseguono turni completi dell'agente. Intervalli più brevi consumano più token. Per ridurre il costo:

- Usa `isolatedSession: true` per evitare di inviare l'intera cronologia della conversazione (~100K token ridotti a ~2-5K per esecuzione).
- Usa `lightContext: true` per limitare i file bootstrap al solo `HEARTBEAT.md`.
- Imposta un `model` più economico (ad esempio `ollama/llama3.2:1b`).
- Mantieni piccolo `HEARTBEAT.md`.
- Usa `target: "none"` se vuoi solo aggiornamenti di stato interni.

## Correlati

- [Automazione e attività](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — come viene tracciato il lavoro scollegato
- [Fuso orario](/it/concepts/timezone) — come il fuso orario influisce sulla pianificazione di Heartbeat
- [Risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting) — debug dei problemi di automazione
