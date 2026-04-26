---
read_when:
    - Decidere come automatizzare il lavoro con OpenClaw
    - Scegliere tra Heartbeat, Cron, hook e ordini permanenti
    - Alla ricerca del punto di ingresso di automazione giusto
summary: 'Panoramica dei meccanismi di automazione: attività, Cron, hook, ordini permanenti e TaskFlow'
title: Automazione e attività
x-i18n:
    generated_at: "2026-04-26T11:22:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d2a2d3ef58830133e07b34f33c611664fc1032247e9dd81005adf7fc0c43cdb
    source_path: automation/index.md
    workflow: 15
---

OpenClaw esegue il lavoro in background tramite attività, lavori pianificati, hook di eventi e istruzioni permanenti. Questa pagina ti aiuta a scegliere il meccanismo giusto e a capire come si integrano tra loro.

## Guida rapida alla scelta

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
```

| Caso d'uso                               | Consigliato           | Perché                                           |
| ---------------------------------------- | --------------------- | ------------------------------------------------ |
| Inviare un report giornaliero alle 9:00 in punto | Attività pianificate (Cron) | Tempistiche esatte, esecuzione isolata           |
| Ricordarmelo tra 20 minuti               | Attività pianificate (Cron) | Esecuzione singola con tempistica precisa (`--at`) |
| Eseguire un'analisi approfondita settimanale | Attività pianificate (Cron) | Attività autonoma, può usare un modello diverso  |
| Controllare la posta in arrivo ogni 30 min | Heartbeat             | Raggruppa con altri controlli, sensibile al contesto |
| Monitorare il calendario per eventi imminenti | Heartbeat             | Adatto in modo naturale alla consapevolezza periodica |
| Ispezionare lo stato di un subagente o di un'esecuzione ACP | Attività in background | Il registro delle attività tiene traccia di tutto il lavoro scollegato |
| Verificare cosa è stato eseguito e quando | Attività in background | `openclaw tasks list` e `openclaw tasks audit` |
| Ricerca in più passaggi e poi riepilogo  | TaskFlow              | Orchestrazione durevole con tracciamento delle revisioni |
| Eseguire uno script al reset della sessione | Hook                  | Basato su eventi, si attiva sugli eventi del ciclo di vita |
| Eseguire codice a ogni chiamata di strumento | Hook del Plugin       | Gli hook in-process possono intercettare le chiamate agli strumenti |
| Controllare sempre la conformità prima di rispondere | Ordini permanenti     | Iniettati automaticamente in ogni sessione       |

### Attività pianificate (Cron) vs Heartbeat

| Dimensione      | Attività pianificate (Cron)         | Heartbeat                            |
| --------------- | ----------------------------------- | ------------------------------------ |
| Tempistiche     | Esatte (espressioni cron, esecuzione singola) | Approssimative (predefinito ogni 30 min) |
| Contesto della sessione | Nuovo (isolato) o condiviso         | Contesto completo della sessione principale |
| Record attività | Sempre creati                       | Mai creati                           |
| Consegna        | Canale, Webhook o silenziosa        | Inline nella sessione principale     |
| Ideale per      | Report, promemoria, lavori in background | Controlli posta in arrivo, calendario, notifiche |

Usa Attività pianificate (Cron) quando ti servono tempistiche precise o un'esecuzione isolata. Usa Heartbeat quando il lavoro beneficia del contesto completo della sessione e tempistiche approssimative vanno bene.

## Concetti fondamentali

### Attività pianificate (Cron)

Cron è il pianificatore integrato del Gateway per tempistiche precise. Mantiene i lavori, riattiva l'agente al momento giusto e può recapitare l'output a un canale di chat o a un endpoint Webhook. Supporta promemoria one-shot, espressioni ricorrenti e trigger Webhook in ingresso.

Vedi [Attività pianificate](/it/automation/cron-jobs).

### Attività

Il registro delle attività in background tiene traccia di tutto il lavoro scollegato: esecuzioni ACP, avvii di subagenti, esecuzioni Cron isolate e operazioni CLI. Le attività sono record, non pianificatori. Usa `openclaw tasks list` e `openclaw tasks audit` per ispezionarle.

Vedi [Attività in background](/it/automation/tasks).

### Task Flow

TaskFlow è il substrato di orchestrazione dei flussi al di sopra delle attività in background. Gestisce flussi durevoli in più passaggi con modalità di sincronizzazione gestita e specchiata, tracciamento delle revisioni e `openclaw tasks flow list|show|cancel` per l'ispezione.

Vedi [TaskFlow](/it/automation/taskflow).

### Ordini permanenti

Gli ordini permanenti concedono all'agente un'autorità operativa permanente per programmi definiti. Risiedono in file dell'area di lavoro (in genere `AGENTS.md`) e vengono iniettati in ogni sessione. Combinali con Cron per l'applicazione basata sul tempo.

Vedi [Ordini permanenti](/it/automation/standing-orders).

### Hook

Gli hook interni sono script basati su eventi attivati da eventi del ciclo di vita dell'agente
(`/new`, `/reset`, `/stop`), Compaction della sessione, avvio del gateway e flusso
dei messaggi. Vengono rilevati automaticamente dalle directory e possono essere gestiti
con `openclaw hooks`. Per l'intercettazione in-process delle chiamate agli strumenti, usa
[gli hook del Plugin](/it/plugins/hooks).

Vedi [Hook](/it/automation/hooks).

### Heartbeat

Heartbeat è un turno periodico della sessione principale (predefinito ogni 30 minuti). Raggruppa più controlli (posta in arrivo, calendario, notifiche) in un unico turno dell'agente con contesto completo della sessione. I turni Heartbeat non creano record attività e non estendono la freschezza del reset giornaliero/inattivo della sessione. Usa `HEARTBEAT.md` per una piccola checklist, oppure un blocco `tasks:` quando vuoi controlli periodici solo-se-scaduti all'interno di Heartbeat stesso. I file heartbeat vuoti vengono saltati come `empty-heartbeat-file`; la modalità attività solo-se-scaduti viene saltata come `no-tasks-due`.

Vedi [Heartbeat](/it/gateway/heartbeat).

## Come lavorano insieme

- **Cron** gestisce pianificazioni precise (report giornalieri, revisioni settimanali) e promemoria one-shot. Tutte le esecuzioni Cron creano record attività.
- **Heartbeat** gestisce il monitoraggio di routine (posta in arrivo, calendario, notifiche) in un unico turno raggruppato ogni 30 minuti.
- **Hook** reagiscono a eventi specifici (reset della sessione, Compaction, flusso dei messaggi) con script personalizzati. Gli hook del Plugin coprono le chiamate agli strumenti.
- **Ordini permanenti** forniscono all'agente contesto persistente e limiti di autorità.
- **TaskFlow** coordina flussi in più passaggi al di sopra delle singole attività.
- **Attività** tengono automaticamente traccia di tutto il lavoro scollegato, così puoi ispezionarlo e verificarlo.

## Correlati

- [Attività pianificate](/it/automation/cron-jobs) — pianificazione precisa e promemoria one-shot
- [Attività in background](/it/automation/tasks) — registro delle attività per tutto il lavoro scollegato
- [TaskFlow](/it/automation/taskflow) — orchestrazione durevole di flussi in più passaggi
- [Hook](/it/automation/hooks) — script del ciclo di vita basati su eventi
- [Hook del Plugin](/it/plugins/hooks) — hook in-process per strumenti, prompt, messaggi e ciclo di vita
- [Ordini permanenti](/it/automation/standing-orders) — istruzioni persistenti per l'agente
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [Riferimento della configurazione](/it/gateway/configuration-reference) — tutte le chiavi di configurazione
