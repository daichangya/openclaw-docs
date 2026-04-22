---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi capire cosa fa ciascuna fase di Dreaming
    - Vuoi regolare il consolidamento senza inquinare MEMORY.md
summary: Consolidamento della memoria in background con fasi leggere, profonde e REM più un Diario dei sogni
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`.
Aiuta OpenClaw a spostare segnali forti di breve termine nella memoria durevole, mantenendo il processo spiegabile e verificabile.

Dreaming è **opt-in** ed è disabilitato per impostazione predefinita.

## Cosa scrive Dreaming

Dreaming mantiene due tipi di output:

- **Stato macchina** in `memory/.dreams/` (archivio di richiamo, segnali di fase, checkpoint di ingestione, lock).
- **Output leggibile da esseri umani** in `DREAMS.md` (o nell'esistente `dreams.md`) e file di report facoltativi per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine continua a scrivere solo in `MEMORY.md`.

## Modello delle fasi

Dreaming usa tre fasi cooperative:

| Fase | Scopo                                     | Scrittura durevole |
| ----- | ----------------------------------------- | ------------------ |
| Light | Ordina e prepara il materiale recente di breve termine | No                 |
| Deep  | Valuta e promuove i candidati durevoli    | Sì (`MEMORY.md`)   |
| REM   | Riflette su temi e idee ricorrenti        | No                 |

Queste fasi sono dettagli di implementazione interni, non "modalità" separate configurabili dall'utente.

### Fase Light

La fase Light acquisisce segnali di memoria giornalieri recenti e tracce di richiamo, li deduplica e prepara le righe candidate.

- Legge dallo stato di richiamo a breve termine, dai file di memoria giornalieri recenti e dalle trascrizioni di sessione redatte quando disponibili.
- Scrive un blocco gestito `## Light Sleep` quando l'archiviazione include output inline.
- Registra segnali di rinforzo per la successiva classificazione deep.
- Non scrive mai in `MEMORY.md`.

### Fase Deep

La fase Deep decide cosa diventa memoria a lungo termine.

- Classifica i candidati usando punteggi pesati e soglie di controllo.
- Richiede il superamento di `minScore`, `minRecallCount` e `minUniqueQueries`.
- Reidrata gli snippet dai file giornalieri live prima della scrittura, così gli snippet obsoleti/eliminati vengono saltati.
- Aggiunge le voci promosse a `MEMORY.md`.
- Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e facoltativamente scrive `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM estrae schemi e segnali riflessivi.

- Costruisce riepiloghi di temi e riflessioni dalle recenti tracce di breve termine.
- Scrive un blocco gestito `## REM Sleep` quando l'archiviazione include output inline.
- Registra segnali di rinforzo REM usati dalla classificazione deep.
- Non scrive mai in `MEMORY.md`.

## Ingestione delle trascrizioni di sessione

Dreaming può acquisire trascrizioni di sessione redatte nel corpus di Dreaming. Quando le trascrizioni sono disponibili, vengono inviate alla fase Light insieme ai segnali di memoria giornalieri e alle tracce di richiamo. I contenuti personali e sensibili vengono redatti prima dell'ingestione.

## Diario dei sogni

Dreaming mantiene anche un narrativo **Diario dei sogni** in `DREAMS.md`.
Dopo che ogni fase dispone di materiale sufficiente, `memory-core` esegue un turno di sottoagente in background best-effort (usando il modello runtime predefinito) e aggiunge una breve voce di diario.

Questo diario è destinato alla lettura umana nell'interfaccia Dreams, non è una fonte di promozione.
Gli artefatti di diario/report generati da Dreaming sono esclusi dalla
promozione a breve termine. Solo gli snippet di memoria fondati sono idonei alla promozione in
`MEMORY.md`.

Esiste anche un percorso di backfill storico fondato per il lavoro di revisione e recupero:

- `memory rem-harness --path ... --grounded` mostra in anteprima l'output del diario fondato dalle note storiche `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` scrive voci di diario fondate e reversibili in `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidati durevoli fondati nello stesso archivio di evidenze a breve termine che la normale fase deep usa già.
- `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono quegli artefatti di backfill preparati senza toccare le normali voci di diario o il richiamo live a breve termine.

L'interfaccia di controllo espone lo stesso flusso di backfill/reset del diario così puoi ispezionare
i risultati nella scena Dreams prima di decidere se i candidati fondati
meritano la promozione. La scena mostra anche un percorso fondato distinto così puoi vedere
quali voci preparate a breve termine provengono dal replay storico, quali elementi promossi
sono stati guidati dal fondamento e cancellare solo le voci preparate solo-fondate senza
toccare il normale stato live a breve termine.

## Segnali di classificazione deep

La classificazione deep usa sei segnali di base pesati più il rinforzo di fase:

| Segnale             | Peso | Descrizione                                        |
| ------------------- | ---- | -------------------------------------------------- |
| Frequenza           | 0.24 | Quanti segnali a breve termine ha accumulato la voce |
| Rilevanza           | 0.30 | Qualità media di recupero per la voce              |
| Diversità delle query | 0.15 | Contesti distinti di query/giorno che l'hanno fatta emergere |
| Recenza             | 0.15 | Punteggio di freschezza con decadimento temporale  |
| Consolidation       | 0.10 | Forza di ricorrenza su più giorni                  |
| Ricchezza concettuale | 0.06 | Densità di tag concettuali da snippet/percorso     |

Gli hit della fase Light e REM aggiungono un piccolo incremento con decadimento della recenza da
`memory/.dreams/phase-signals.json`.

## Pianificazione

Quando abilitato, `memory-core` gestisce automaticamente un processo Cron per una sweep completa di Dreaming. Ogni sweep esegue le fasi in ordine: light -> REM -> deep.

Comportamento della cadenza predefinita:

| Impostazione         | Predefinito |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Avvio rapido

Abilitare Dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Abilitare Dreaming con una cadenza di sweep personalizzata:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Comando slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flusso di lavoro CLI

Usa la promozione CLI per l'anteprima o l'applicazione manuale:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Il comando manuale `memory promote` usa per impostazione predefinita le soglie della fase deep, a meno che non vengano sovrascritte
con flag CLI.

Spiegare perché un candidato specifico verrebbe o non verrebbe promosso:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Anteprima di riflessioni REM, verità candidate e output della promozione deep senza
scrivere nulla:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valori predefiniti principali

Tutte le impostazioni si trovano in `plugins.entries.memory-core.config.dreaming`.

| Chiave      | Predefinito |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

I criteri di fase, le soglie e il comportamento di archiviazione sono dettagli di implementazione
interni (non configurazione visibile all'utente).

Vedi [Riferimento configurazione Memory](/it/reference/memory-config#dreaming)
per l'elenco completo delle chiavi.

## Interfaccia Dreams

Quando abilitata, la scheda **Dreams** del Gateway mostra:

- stato attuale di Dreaming abilitato
- stato a livello di fase e presenza di sweep gestita
- conteggi di breve termine, fondati, segnali e promossi oggi
- tempistica della prossima esecuzione pianificata
- un percorso Scene fondato distinto per le voci di replay storico preparate
- un lettore espandibile del Diario dei sogni supportato da `doctor.memory.dreamDiary`

## Risoluzione dei problemi

### Dreaming non viene mai eseguito (lo stato mostra blocked)

Il Cron Dreaming gestito usa l'Heartbeat dell'agente predefinito. Se l'Heartbeat non viene attivato per quell'agente, il Cron accoda un evento di sistema che nessuno consuma e Dreaming silenziosamente non viene eseguito. Sia `openclaw memory status` sia `/dreaming status` segnaleranno `blocked` in quel caso e indicheranno l'agente il cui Heartbeat è il blocco.

Due cause comuni:

- Un altro agente dichiara un blocco `heartbeat:` esplicito. Quando qualsiasi voce in `agents.list` ha il proprio blocco `heartbeat`, solo quegli agenti eseguono l'Heartbeat — i valori predefiniti smettono di applicarsi a tutti gli altri, quindi l'agente predefinito può restare silenzioso. Sposta le impostazioni di Heartbeat in `agents.defaults.heartbeat`, oppure aggiungi un blocco `heartbeat` esplicito all'agente predefinito. Vedi [Ambito e precedenza](/it/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` è `0`, vuoto o non analizzabile. Il Cron non ha alcun intervallo rispetto a cui pianificare, quindi l'Heartbeat è di fatto disabilitato. Imposta `every` su una durata positiva come `30m`. Vedi [Valori predefiniti](/it/gateway/heartbeat#defaults).

## Correlati

- [Heartbeat](/it/gateway/heartbeat)
- [Memory](/it/concepts/memory)
- [Memory Search](/it/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Riferimento configurazione Memory](/it/reference/memory-config)
