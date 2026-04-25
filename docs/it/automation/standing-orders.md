---
read_when:
    - Configurazione di flussi di lavoro per agenti autonomi che vengono eseguiti senza prompt per ogni singola attività
    - Definire cosa l'agente può fare in autonomia e cosa richiede l'approvazione umana
    - Strutturare agenti multi-programma con confini chiari e regole di escalation
summary: Definire un'autorità operativa permanente per i programmi di agenti autonomi
title: Ordini permanenti
x-i18n:
    generated_at: "2026-04-25T13:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a18777284a12e99b2e9f1ce660a0dc4d18ba5782d6a6a6673b495ab32b2d8cf
    source_path: automation/standing-orders.md
    workflow: 15
---

Gli ordini permanenti conferiscono al tuo agente **un'autorità operativa permanente** per programmi definiti. Invece di fornire ogni volta istruzioni per singole attività, definisci programmi con ambito, trigger e regole di escalation chiari — e l'agente esegue in autonomia entro questi limiti.

Questa è la differenza tra dire al tuo assistente "invia il report settimanale" ogni venerdì e concedere un'autorità permanente: "Sei responsabile del report settimanale. Compilalo ogni venerdì, invialo ed esegui un'escalation solo se qualcosa non sembra corretto."

## Perché gli ordini permanenti?

**Senza ordini permanenti:**

- Devi inviare un prompt all'agente per ogni attività
- L'agente resta inattivo tra una richiesta e l'altra
- Il lavoro di routine viene dimenticato o ritardato
- Diventi il collo di bottiglia

**Con gli ordini permanenti:**

- L'agente opera in autonomia entro limiti definiti
- Il lavoro di routine avviene secondo programma senza prompt
- Intervieni solo per eccezioni e approvazioni
- L'agente utilizza produttivamente il tempo di inattività

## Come funzionano

Gli ordini permanenti sono definiti nei file del tuo [spazio di lavoro dell'agente](/it/concepts/agent-workspace). L'approccio consigliato è includerli direttamente in `AGENTS.md` (che viene iniettato automaticamente in ogni sessione) così l'agente li ha sempre nel contesto. Per configurazioni più grandi, puoi anche inserirli in un file dedicato come `standing-orders.md` e richiamarlo da `AGENTS.md`.

Ogni programma specifica:

1. **Ambito** — cosa l'agente è autorizzato a fare
2. **Trigger** — quando eseguire (programma, evento o condizione)
3. **Punti di approvazione** — cosa richiede l'approvazione umana prima di agire
4. **Regole di escalation** — quando fermarsi e chiedere aiuto

L'agente carica queste istruzioni a ogni sessione tramite i file bootstrap dello spazio di lavoro (vedi [Agent Workspace](/it/concepts/agent-workspace) per l'elenco completo dei file iniettati automaticamente) e le esegue, insieme ai [Cron jobs](/it/automation/cron-jobs) per l'applicazione basata sul tempo.

<Tip>
Inserisci gli ordini permanenti in `AGENTS.md` per garantire che vengano caricati a ogni sessione. Il bootstrap dello spazio di lavoro inietta automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` — ma non file arbitrari nelle sottodirectory.
</Tip>

## Anatomia di un ordine permanente

```markdown
## Programma: Report settimanale sullo stato

**Autorità:** Compilare dati, generare il report, consegnarlo agli stakeholder
**Trigger:** Ogni venerdì alle 16:00 (applicato tramite Cron job)
**Punto di approvazione:** Nessuno per i report standard. Segnalare le anomalie per la revisione umana.
**Escalation:** Se la fonte dati non è disponibile o le metriche sembrano insolite (>2σ dalla norma)

### Fasi di esecuzione

1. Recupera le metriche dalle fonti configurate
2. Confrontale con la settimana precedente e con gli obiettivi
3. Genera il report in Reports/weekly/YYYY-MM-DD.md
4. Invia un riepilogo tramite il canale configurato
5. Registra il completamento in Agent/Logs/

### Cosa NON fare

- Non inviare report a soggetti esterni
- Non modificare i dati di origine
- Non saltare l'invio se le metriche sono negative — riporta i dati correttamente
```

## Ordini permanenti + Cron jobs

Gli ordini permanenti definiscono **cosa** l'agente è autorizzato a fare. I [Cron jobs](/it/automation/cron-jobs) definiscono **quando** accade. Funzionano insieme:

```
Ordine permanente: "Sei responsabile del triage quotidiano della casella inbox"
    ↓
Cron job (ogni giorno alle 8:00): "Esegui il triage della inbox secondo gli ordini permanenti"
    ↓
Agente: legge gli ordini permanenti → esegue i passaggi → riporta i risultati
```

Il prompt del Cron job dovrebbe fare riferimento all'ordine permanente invece di duplicarlo:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Esegui il triage quotidiano della inbox secondo gli ordini permanenti. Controlla la posta per nuovi avvisi. Analizza, categorizza e persisti ogni elemento. Invia un riepilogo al proprietario. Esegui l'escalation per gli elementi sconosciuti."
```

## Esempi

### Esempio 1: Contenuti e social media (ciclo settimanale)

```markdown
## Programma: Contenuti e social media

**Autorità:** Redigere contenuti, pianificare post, compilare report sul coinvolgimento
**Punto di approvazione:** Tutti i post richiedono la revisione del proprietario per i primi 30 giorni, poi approvazione permanente
**Trigger:** Ciclo settimanale (revisione il lunedì → bozze a metà settimana → briefing il venerdì)

### Ciclo settimanale

- **Lunedì:** Rivedi le metriche della piattaforma e il coinvolgimento del pubblico
- **Martedì–Giovedì:** Prepara bozze di post social, crea contenuti per il blog
- **Venerdì:** Compila il briefing marketing settimanale → consegnalo al proprietario

### Regole sui contenuti

- Il tono deve corrispondere al brand (vedi SOUL.md o la guida al tono del brand)
- Non identificarti mai come AI nei contenuti pubblici
- Includi le metriche quando disponibili
- Concentrati sul valore per il pubblico, non sull'autopromozione
```

### Esempio 2: Operazioni finanziarie (attivato da eventi)

```markdown
## Programma: Elaborazione finanziaria

**Autorità:** Elaborare i dati delle transazioni, generare report, inviare riepiloghi
**Punto di approvazione:** Nessuno per l'analisi. Le raccomandazioni richiedono l'approvazione del proprietario.
**Trigger:** Rilevato un nuovo file di dati OPPURE ciclo mensile programmato

### Quando arrivano nuovi dati

1. Rileva un nuovo file nella directory di input designata
2. Analizza e categorizza tutte le transazioni
3. Confrontale con gli obiettivi di budget
4. Segnala: elementi insoliti, superamenti di soglia, nuovi addebiti ricorrenti
5. Genera il report nella directory di output designata
6. Invia il riepilogo al proprietario tramite il canale configurato

### Regole di escalation

- Singolo elemento > $500: avviso immediato
- Categoria > budget del 20%: segnalazione nel report
- Transazione non riconoscibile: chiedi al proprietario la categorizzazione
- Elaborazione non riuscita dopo 2 tentativi: segnala l'errore, non fare supposizioni
```

### Esempio 3: Monitoraggio e avvisi (continuo)

```markdown
## Programma: Monitoraggio del sistema

**Autorità:** Controllare lo stato del sistema, riavviare servizi, inviare avvisi
**Punto di approvazione:** Riavviare i servizi automaticamente. Eseguire l'escalation se il riavvio fallisce due volte.
**Trigger:** A ogni ciclo Heartbeat

### Controlli

- Endpoint di stato dei servizi rispondono
- Spazio su disco sopra la soglia
- Attività in sospeso non obsolete (>24 ore)
- Canali di consegna operativi

### Matrice di risposta

| Condizione       | Azione                   | Escalation?              |
| ---------------- | ------------------------ | ------------------------ |
| Servizio offline | Riavvia automaticamente  | Solo se il riavvio fallisce 2 volte |
| Spazio disco < 10% | Avvisa il proprietario | Sì                       |
| Attività obsoleta > 24h | Ricorda al proprietario | No                  |
| Canale offline   | Registra e riprova al ciclo successivo | Se offline > 2 ore |
```

## Il modello Esegui-Verifica-Riporta

Gli ordini permanenti funzionano meglio quando sono combinati con una rigorosa disciplina di esecuzione. Ogni attività in un ordine permanente dovrebbe seguire questo ciclo:

1. **Esegui** — Svolgi il lavoro reale (non limitarti a riconoscere l'istruzione)
2. **Verifica** — Conferma che il risultato sia corretto (il file esiste, il messaggio è stato consegnato, i dati sono stati analizzati)
3. **Riporta** — Comunica al proprietario cosa è stato fatto e cosa è stato verificato

```markdown
### Regole di esecuzione

- Ogni attività segue il modello Esegui-Verifica-Riporta. Nessuna eccezione.
- "Lo farò" non è esecuzione. Fallo, poi riportalo.
- "Fatto" senza verifica non è accettabile. Dimostralo.
- Se l'esecuzione fallisce: riprova una volta con un approccio corretto.
- Se fallisce ancora: segnala il problema con una diagnosi. Non fallire mai in silenzio.
- Non riprovare all'infinito — massimo 3 tentativi, poi escalation.
```

Questo modello previene la modalità di errore più comune degli agenti: riconoscere un'attività senza completarla.

## Architettura multi-programma

Per gli agenti che gestiscono più ambiti, organizza gli ordini permanenti come programmi separati con confini chiari:

```markdown
## Programma 1: [Dominio A] (Settimanale)

...

## Programma 2: [Dominio B] (Mensile + su richiesta)

...

## Programma 3: [Dominio C] (Secondo necessità)

...

## Regole di escalation (Tutti i programmi)

- [Criteri di escalation comuni]
- [Punti di approvazione che si applicano a tutti i programmi]
```

Ogni programma dovrebbe avere:

- La propria **cadenza di attivazione** (settimanale, mensile, guidata da eventi, continua)
- I propri **punti di approvazione** (alcuni programmi richiedono più supervisione di altri)
- **Confini** chiari (l'agente deve sapere dove finisce un programma e dove inizia un altro)

## Best practice

### Da fare

- Inizia con un'autorità limitata ed espandila man mano che cresce la fiducia
- Definisci punti di approvazione espliciti per le azioni ad alto rischio
- Includi sezioni "Cosa NON fare" — i confini contano quanto i permessi
- Combina il tutto con Cron jobs per un'esecuzione affidabile nel tempo
- Rivedi settimanalmente i log dell'agente per verificare che gli ordini permanenti vengano seguiti
- Aggiorna gli ordini permanenti man mano che le tue esigenze evolvono — sono documenti vivi

### Da evitare

- Concedere un'autorità ampia fin dal primo giorno ("fai quello che ritieni migliore")
- Saltare le regole di escalation — ogni programma ha bisogno di una clausola "quando fermarsi e chiedere"
- Presumere che l'agente ricordi istruzioni verbali — metti tutto nel file
- Mescolare più ambiti in un unico programma — programmi separati per domini separati
- Dimenticare di applicare tutto con i Cron jobs — gli ordini permanenti senza trigger diventano suggerimenti

## Correlati

- [Automazione e attività](/it/automation) — panoramica di tutti i meccanismi di automazione
- [Cron Jobs](/it/automation/cron-jobs) — applicazione della pianificazione per gli ordini permanenti
- [Hooks](/it/automation/hooks) — script guidati da eventi per gli eventi del ciclo di vita dell'agente
- [Webhooks](/it/automation/cron-jobs#webhooks) — trigger di eventi HTTP in ingresso
- [Agent Workspace](/it/concepts/agent-workspace) — dove risiedono gli ordini permanenti, incluso l'elenco completo dei file bootstrap iniettati automaticamente (AGENTS.md, SOUL.md, ecc.)
