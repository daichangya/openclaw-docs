---
read_when:
    - Vuoi ispezionare, verificare o annullare i record delle attività in background
    - Stai documentando i comandi di TaskFlow in `openclaw tasks flow`
summary: Riferimento CLI per `openclaw tasks` (registro delle attività in background e stato di TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

Ispeziona le attività in background durevoli e lo stato di TaskFlow. Senza sottocomando,
`openclaw tasks` equivale a `openclaw tasks list`.

Consulta [Background Tasks](/it/automation/tasks) per il ciclo di vita e il modello di recapito.

## Uso

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Opzioni root

- `--json`: output JSON.
- `--runtime <name>`: filtra per tipo: `subagent`, `acp`, `cron` o `cli`.
- `--status <name>`: filtra per stato: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` o `lost`.

## Sottocomandi

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Elenca le attività in background tracciate, dalla più recente.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Mostra un’attività per ID attività, ID esecuzione o chiave di sessione.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Modifica il criterio di notifica per un’attività in esecuzione.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Annulla un’attività in background in esecuzione.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Evidenzia record di attività e TaskFlow obsoleti, lost, con recapito non riuscito o altrimenti incoerenti. Le attività lost conservate fino a `cleanupAfter` sono avvisi; le attività lost scadute o senza marcatura temporale sono errori.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Mostra in anteprima o applica la riconciliazione, la marcatura della pulizia e l’eliminazione per le attività e TaskFlow.
Per le attività Cron, la riconciliazione usa i log persistenti delle esecuzioni e lo stato del processo prima di contrassegnare come `lost` una vecchia attività attiva, così le esecuzioni Cron completate non diventano falsi errori di audit
solo perché lo stato runtime in memoria del Gateway non è più disponibile. L’audit CLI offline
non è autorevole per l’insieme dei processi Cron attivi locale al processo del Gateway.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Ispeziona o annulla lo stato durevole di TaskFlow nel registro delle attività.

## Correlati

- [Riferimento CLI](/it/cli)
- [Attività in background](/it/automation/tasks)
