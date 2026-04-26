---
read_when:
    - Vuoi capire l'instradamento e l'isolamento delle sessioni
    - Vuoi configurare l'ambito dei DM per configurazioni multiutente
    - Stai eseguendo il debug dei reset di sessione giornalieri o per inattività
summary: Come OpenClaw gestisce le sessioni di conversazione
title: Gestione delle sessioni
x-i18n:
    generated_at: "2026-04-26T11:27:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organizza le conversazioni in **sessioni**. Ogni messaggio viene instradato a una
sessione in base alla sua origine -- DM, chat di gruppo, processi Cron, ecc.

## Come vengono instradati i messaggi

| Origine         | Comportamento                 |
| --------------- | ----------------------------- |
| Messaggi diretti | Sessione condivisa per impostazione predefinita |
| Chat di gruppo  | Isolate per gruppo            |
| Stanze/canali   | Isolate per stanza            |
| Processi Cron   | Nuova sessione per ogni esecuzione |
| Webhook         | Isolate per hook              |

## Isolamento DM

Per impostazione predefinita, tutti i DM condividono una sessione per garantire continuità. Questo va bene per
configurazioni con un solo utente.

<Warning>
Se più persone possono inviare messaggi al tuo agente, abilita l'isolamento DM. Senza di esso, tutti gli
utenti condividono lo stesso contesto della conversazione -- i messaggi privati di Alice sarebbero
visibili a Bob.
</Warning>

**La soluzione:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isola per canale + mittente
  },
}
```

Altre opzioni:

- `main` (predefinito) -- tutti i DM condividono una sessione.
- `per-peer` -- isola per mittente (tra canali diversi).
- `per-channel-peer` -- isola per canale + mittente (consigliato).
- `per-account-channel-peer` -- isola per account + canale + mittente.

<Tip>
Se la stessa persona ti contatta da più canali, usa
`session.identityLinks` per collegare le sue identità in modo che condividano una sola sessione.
</Tip>

Verifica la configurazione con `openclaw security audit`.

## Ciclo di vita della sessione

Le sessioni vengono riutilizzate finché non scadono:

- **Reset giornaliero** (predefinito) -- nuova sessione alle 4:00 del mattino, ora locale, sull'host
  del gateway. La freschezza giornaliera si basa su quando è iniziato il `sessionId` corrente, non
  su scritture successive dei metadati.
- **Reset per inattività** (facoltativo) -- nuova sessione dopo un periodo di inattività. Imposta
  `session.reset.idleMinutes`. La freschezza per inattività si basa sull'ultima reale
  interazione utente/canale, quindi Heartbeat, Cron ed eventi di sistema exec non
  mantengono attiva la sessione.
- **Reset manuale** -- digita `/new` o `/reset` in chat. `/new <model>` cambia anche
  modello.

Quando sono configurati sia il reset giornaliero sia quello per inattività, prevale quello che scade per primo.
Heartbeat, Cron, exec e altri turni di eventi di sistema possono scrivere metadati della sessione,
ma queste scritture non estendono la freschezza del reset giornaliero o per inattività. Quando un reset
fa avanzare la sessione, gli avvisi di eventi di sistema in coda per la vecchia sessione vengono
scartati in modo che aggiornamenti in background obsoleti non vengano anteposti al primo prompt della
nuova sessione.

Le sessioni con una sessione CLI attiva di proprietà del provider non vengono interrotte dal valore predefinito
giornaliero implicito. Usa `/reset` o configura `session.reset` esplicitamente quando tali
sessioni devono scadere in base a un timer.

## Dove risiede lo stato

Tutto lo stato della sessione è di proprietà del **gateway**. I client UI interrogano il gateway per
i dati della sessione.

- **Archivio:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Trascrizioni:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantiene timestamp separati del ciclo di vita:

- `sessionStartedAt`: quando è iniziato il `sessionId` corrente; il reset giornaliero usa questo valore.
- `lastInteractionAt`: ultima interazione utente/canale che estende la durata per inattività.
- `updatedAt`: ultima mutazione della riga nell'archivio; utile per elencazione e potatura, ma non
  autorevole per la freschezza del reset giornaliero/per inattività.

Le righe più vecchie senza `sessionStartedAt` vengono risolte dall'intestazione della sessione JSONL della trascrizione
quando disponibile. Se una riga più vecchia non ha anche `lastInteractionAt`,
la freschezza per inattività ricade sull'ora di inizio della sessione, non su scritture contabili successive.

## Manutenzione delle sessioni

OpenClaw limita automaticamente nel tempo l'archiviazione delle sessioni. Per impostazione predefinita, viene eseguito
in modalità `warn` (riporta ciò che verrebbe pulito). Imposta `session.maintenance.mode`
su `"enforce"` per la pulizia automatica:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Anteprima con `openclaw sessions cleanup --dry-run`.

## Ispezione delle sessioni

- `openclaw status` -- percorso dell'archivio delle sessioni e attività recente.
- `openclaw sessions --json` -- tutte le sessioni (filtra con `--active <minutes>`).
- `/status` in chat -- uso del contesto, modello e toggle.
- `/context list` -- cosa è presente nel prompt di sistema.

## Approfondimenti

- [Session Pruning](/it/concepts/session-pruning) -- potatura dei risultati degli strumenti
- [Compaction](/it/concepts/compaction) -- riepilogo delle conversazioni lunghe
- [Session Tools](/it/concepts/session-tool) -- strumenti dell'agente per il lavoro tra sessioni
- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction) --
  schema dell'archivio, trascrizioni, criterio di invio, metadati di origine e configurazione avanzata
- [Multi-Agent](/it/concepts/multi-agent) — instradamento e isolamento delle sessioni tra agenti
- [Attività in background](/it/automation/tasks) — come il lavoro scollegato crea record di attività con riferimenti di sessione
- [Instradamento dei canali](/it/channels/channel-routing) — come i messaggi in ingresso vengono instradati alle sessioni

## Correlati

- [Session pruning](/it/concepts/session-pruning)
- [Session tools](/it/concepts/session-tool)
- [Coda dei comandi](/it/concepts/queue)
