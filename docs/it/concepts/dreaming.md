---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi capire cosa fa ogni fase di Dreaming
    - Vuoi regolare il consolidamento senza inquinare MEMORY.md
summary: Consolidamento della memoria in background con fasi light, deep e REM più un Diario dei sogni
title: Dreaming (sperimentale)
x-i18n:
    generated_at: "2026-04-15T08:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5882a5068f2eabe54ca9893184e5385330a432b921870c38626399ce11c31e25
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (sperimentale)

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`.
Aiuta OpenClaw a spostare segnali forti a breve termine nella memoria durevole mantenendo
il processo spiegabile e verificabile.

Dreaming è **facoltativo** ed è disattivato per impostazione predefinita.

## Cosa scrive Dreaming

Dreaming mantiene due tipi di output:

- **Stato macchina** in `memory/.dreams/` (archivio di richiamo, segnali di fase, checkpoint di ingestione, lock).
- **Output leggibile da esseri umani** in `DREAMS.md` (o `dreams.md` esistente) e file di report di fase facoltativi in `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine continua a scrivere solo in `MEMORY.md`.

## Modello di fase

Dreaming usa tre fasi cooperative:

| Fase | Scopo                                     | Scrittura durevole |
| ----- | ----------------------------------------- | ------------------ |
| Light | Ordina e prepara il materiale recente a breve termine | No                 |
| Deep  | Valuta e promuove i candidati durevoli    | Sì (`MEMORY.md`)   |
| REM   | Riflette su temi e idee ricorrenti        | No                 |

Queste fasi sono dettagli interni di implementazione, non "modalità"
separate configurabili dall'utente.

### Fase Light

La fase Light acquisisce segnali recenti della memoria giornaliera e tracce di richiamo, li deduplica
e prepara righe candidate.

- Legge dallo stato di richiamo a breve termine, dai file recenti della memoria giornaliera e dalle trascrizioni di sessione redatte quando disponibili.
- Scrive un blocco gestito `## Light Sleep` quando l'archiviazione include output inline.
- Registra segnali di rinforzo per la successiva classificazione deep.
- Non scrive mai in `MEMORY.md`.

### Fase Deep

La fase Deep decide cosa diventa memoria a lungo termine.

- Classifica i candidati usando punteggi ponderati e soglie di accesso.
- Richiede il superamento di `minScore`, `minRecallCount` e `minUniqueQueries`.
- Reidrata gli snippet dai file giornalieri live prima di scrivere, quindi gli snippet obsoleti/eliminati vengono saltati.
- Aggiunge le voci promosse a `MEMORY.md`.
- Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e facoltativamente scrive `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM estrae pattern e segnali riflessivi.

- Costruisce riepiloghi di temi e riflessioni dalle recenti tracce a breve termine.
- Scrive un blocco gestito `## REM Sleep` quando l'archiviazione include output inline.
- Registra segnali di rinforzo REM usati dalla classificazione deep.
- Non scrive mai in `MEMORY.md`.

## Acquisizione delle trascrizioni di sessione

Dreaming può acquisire trascrizioni di sessione redatte nel corpus di dreaming. Quando
le trascrizioni sono disponibili, vengono inviate alla fase Light insieme ai segnali della
memoria giornaliera e alle tracce di richiamo. I contenuti personali e sensibili vengono redatti
prima dell'acquisizione.

## Dream Diary

Dreaming mantiene anche un **Dream Diary** narrativo in `DREAMS.md`.
Dopo che ogni fase ha materiale sufficiente, `memory-core` esegue un turno in background
best-effort del sottoagente (usando il modello di runtime predefinito) e aggiunge una breve voce del diario.

Questo diario è destinato alla lettura umana nella UI Dreams, non è una fonte di promozione.
Gli artefatti di diario/report generati da Dreaming sono esclusi dalla
promozione a breve termine. Solo gli snippet di memoria fondati possono essere promossi in
`MEMORY.md`.

Esiste anche un percorso di backfill storico fondato per il lavoro di revisione e recupero:

- `memory rem-harness --path ... --grounded` mostra in anteprima l'output del diario fondato da note storiche `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` scrive voci reversibili del diario fondato in `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidati durevoli fondati nello stesso archivio di evidenze a breve termine già usato dalla normale fase deep.
- `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono questi artefatti di backfill preparati senza toccare le normali voci del diario o il richiamo live a breve termine.

La Control UI espone lo stesso flusso di backfill/reset del diario così puoi ispezionare
i risultati nella scena Dreams prima di decidere se i candidati fondati
meritano la promozione. La scena mostra anche un percorso fondato distinto così puoi vedere
quali voci a breve termine preparate provengono dal replay storico, quali elementi promossi
sono stati guidati dal fondamento e cancellare solo le voci preparate esclusivamente fondate senza
toccare il normale stato live a breve termine.

## Segnali di classificazione deep

La classificazione deep usa sei segnali base ponderati più il rinforzo di fase:

| Segnale            | Peso | Descrizione                                        |
| ------------------ | ---- | -------------------------------------------------- |
| Frequenza          | 0.24 | Quanti segnali a breve termine ha accumulato la voce |
| Rilevanza          | 0.30 | Qualità media di recupero per la voce              |
| Diversità delle query | 0.15 | Contesti distinti di query/giorno che l'hanno fatta emergere |
| Recenza            | 0.15 | Punteggio di freschezza con decadimento temporale  |
| Consolidamento     | 0.10 | Forza di ricorrenza su più giorni                  |
| Ricchezza concettuale | 0.06 | Densità di tag concettuali da snippet/percorso   |

I riscontri delle fasi Light e REM aggiungono un piccolo incremento con decadimento di recenza da
`memory/.dreams/phase-signals.json`.

## Pianificazione

Quando è abilitato, `memory-core` gestisce automaticamente un job Cron per una sweep completa
di dreaming. Ogni sweep esegue le fasi in ordine: light -> REM -> deep.

Comportamento di cadenza predefinito:

| Impostazione        | Predefinito |
| ------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Avvio rapido

Abilita dreaming:

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

Abilita dreaming con una cadenza di sweep personalizzata:

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

Usa la promozione CLI per anteprima o applicazione manuale:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Il comando manuale `memory promote` usa per impostazione predefinita le soglie della fase deep, salvo override
tramite flag CLI.

Spiega perché un candidato specifico verrebbe o non verrebbe promosso:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Mostra in anteprima riflessioni REM, verità candidate e output della promozione deep senza
scrivere nulla:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valori predefiniti chiave

Tutte le impostazioni si trovano in `plugins.entries.memory-core.config.dreaming`.

| Chiave      | Predefinito |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

La policy di fase, le soglie e il comportamento di archiviazione sono dettagli interni di implementazione
(non configurazione esposta all'utente).

Vedi [Riferimento della configurazione Memory](/it/reference/memory-config#dreaming-experimental)
per l'elenco completo delle chiavi.

## UI Dreams

Quando è abilitato, la scheda **Dreams** del Gateway mostra:

- stato corrente di abilitazione di dreaming
- stato a livello di fase e presenza di sweep gestita
- conteggi di breve termine, fondati, segnali e promossi-oggi
- tempistica della prossima esecuzione pianificata
- un percorso Scene fondato distinto per le voci di replay storico preparate
- un lettore Dream Diary espandibile supportato da `doctor.memory.dreamDiary`

## Correlati

- [Memory](/it/concepts/memory)
- [Memory Search](/it/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Riferimento della configurazione Memory](/it/reference/memory-config)
