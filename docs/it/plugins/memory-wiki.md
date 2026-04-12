---
read_when:
    - Vuoi una conoscenza persistente che vada oltre le semplici note in `MEMORY.md`
    - Stai configurando il Plugin integrato memory-wiki
    - Vuoi capire `wiki_search`, `wiki_get` o la modalità bridge
summary: 'memory-wiki: archivio di conoscenza compilato con provenienza, affermazioni, dashboard e modalità bridge'
title: Memory Wiki
x-i18n:
    generated_at: "2026-04-12T23:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44d168a7096f744c56566ecac57499192eb101b4dd8a78e1b92f3aa0d6da3ad1
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Memory Wiki

`memory-wiki` è un Plugin integrato che trasforma la memoria durevole in un archivio di conoscenza compilato.

Non sostituisce il Plugin di Active Memory. Il Plugin di Active Memory continua a
gestire richiamo, promozione, indicizzazione e Dreaming. `memory-wiki` si affianca
a esso e compila la conoscenza durevole in un wiki navigabile con pagine
deterministiche, affermazioni strutturate, provenienza, dashboard e digest leggibili dalle macchine.

Usalo quando vuoi che la memoria si comporti più come un livello di conoscenza
manutenuto e meno come un mucchio di file Markdown.

## Cosa aggiunge

- Un archivio wiki dedicato con layout di pagina deterministico
- Metadati strutturati per affermazioni ed evidenze, non solo testo in prosa
- Provenienza, confidenza, contraddizioni e domande aperte a livello di pagina
- Digest compilati per consumatori agente/runtime
- Strumenti wiki nativi di ricerca/lettura/applicazione/lint
- Modalità bridge opzionale che importa artefatti pubblici dal Plugin di Active Memory
- Modalità di rendering opzionale compatibile con Obsidian e integrazione CLI

## Come si integra con la memoria

Pensa alla separazione in questo modo:

| Livello                                                 | Gestisce                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin di Active Memory (`memory-core`, QMD, Honcho, ecc.) | Richiamo, ricerca semantica, promozione, Dreaming, runtime della memoria                   |
| `memory-wiki`                                           | Pagine wiki compilate, sintesi ricche di provenienza, dashboard, ricerca/lettura/applicazione specifiche del wiki |

Se il Plugin di Active Memory espone artefatti di richiamo condivisi, OpenClaw può cercare
in entrambi i livelli in un unico passaggio con `memory_search corpus=all`.

Quando hai bisogno di ranking specifico del wiki, provenienza o accesso diretto alle pagine,
usa invece gli strumenti nativi del wiki.

## Pattern ibrido consigliato

Un'impostazione predefinita solida per configurazioni local-first è:

- QMD come backend di Active Memory per richiamo e ricerca semantica ampia
- `memory-wiki` in modalità `bridge` per pagine di conoscenza durevole sintetizzate

Questa separazione funziona bene perché ogni livello resta focalizzato:

- QMD mantiene ricercabili note grezze, esportazioni di sessione e raccolte aggiuntive
- `memory-wiki` compila entità stabili, affermazioni, dashboard e pagine sorgente

Regola pratica:

- usa `memory_search` quando vuoi un unico passaggio di richiamo ampio sulla memoria
- usa `wiki_search` e `wiki_get` quando vuoi risultati wiki con consapevolezza della provenienza
- usa `memory_search corpus=all` quando vuoi che la ricerca condivisa copra entrambi i livelli

Se la modalità bridge segnala zero artefatti esportati, il Plugin di Active Memory
al momento non sta ancora esponendo input bridge pubblici. Esegui prima `openclaw wiki doctor`,
poi conferma che il Plugin di Active Memory supporti gli artefatti pubblici.

## Modalità dell'archivio

`memory-wiki` supporta tre modalità dell'archivio:

### `isolated`

Archivio proprio, sorgenti proprie, nessuna dipendenza da `memory-core`.

Usa questa modalità quando vuoi che il wiki sia un archivio di conoscenza curato autonomamente.

### `bridge`

Legge artefatti di memoria pubblici ed eventi di memoria dal Plugin di Active Memory
tramite le interfacce pubbliche del Plugin SDK.

Usa questa modalità quando vuoi che il wiki compili e organizzi gli
artefatti esportati dal Plugin di memoria senza accedere agli interni privati del Plugin.

La modalità bridge può indicizzare:

- artefatti di memoria esportati
- report di Dreaming
- note giornaliere
- file radice della memoria
- log degli eventi di memoria

### `unsafe-local`

Via di fuga esplicita sulla stessa macchina per percorsi locali privati.

Questa modalità è intenzionalmente sperimentale e non portabile. Usala solo quando
comprendi il confine di fiducia e hai bisogno in modo specifico di accesso al filesystem locale che
la modalità bridge non può fornire.

## Layout dell'archivio

Il Plugin inizializza un archivio così:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Il contenuto gestito resta all'interno dei blocchi generati. I blocchi di note umane vengono preservati.

I gruppi di pagine principali sono:

- `sources/` per materiale grezzo importato e pagine supportate da bridge
- `entities/` per cose durevoli, persone, sistemi, progetti e oggetti
- `concepts/` per idee, astrazioni, pattern e policy
- `syntheses/` per riepiloghi compilati e rollup manutenuti
- `reports/` per dashboard generate

## Affermazioni ed evidenze strutturate

Le pagine possono contenere frontmatter `claims` strutturato, non solo testo libero.

Ogni affermazione può includere:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Le voci di evidenza possono includere:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Questo è ciò che fa sì che il wiki si comporti più come un livello di convinzioni che come un semplice
deposito di note passive. Le affermazioni possono essere tracciate, valutate,
contestate e ricondotte alle sorgenti.

## Pipeline di compilazione

Il passaggio di compilazione legge le pagine del wiki, normalizza i riepiloghi ed emette
artefatti stabili rivolti alle macchine sotto:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Questi digest esistono affinché gli agenti e il codice runtime non debbano analizzare
le pagine Markdown.

L'output compilato alimenta anche:

- l'indicizzazione wiki di primo passaggio per i flussi di ricerca/lettura
- la ricerca dell'id delle affermazioni fino alla pagina proprietaria
- supplementi di prompt compatti
- la generazione di report/dashboard

## Dashboard e report di stato

Quando `render.createDashboards` è abilitato, la compilazione mantiene le dashboard sotto `reports/`.

I report integrati includono:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Questi report tracciano elementi come:

- cluster di note di contraddizione
- cluster di affermazioni concorrenti
- affermazioni prive di evidenze strutturate
- pagine e affermazioni a bassa confidenza
- elementi obsoleti o con freschezza sconosciuta
- pagine con domande irrisolte

## Ricerca e recupero

`memory-wiki` supporta due backend di ricerca:

- `shared`: usa il flusso di ricerca memoria condivisa quando disponibile
- `local`: cerca nel wiki in locale

Supporta inoltre tre corpora:

- `wiki`
- `memory`
- `all`

Comportamento importante:

- `wiki_search` e `wiki_get` usano i digest compilati come primo passaggio quando possibile
- gli id delle affermazioni possono essere risolti fino alla pagina proprietaria
- affermazioni contestate/obsolete/fresche influenzano il ranking
- le etichette di provenienza possono sopravvivere nei risultati

Regola pratica:

- usa `memory_search corpus=all` per un unico passaggio di richiamo ampio
- usa `wiki_search` + `wiki_get` quando ti interessano ranking specifico del wiki,
  provenienza o struttura di convinzioni a livello di pagina

## Strumenti agente

Il Plugin registra questi strumenti:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Cosa fanno:

- `wiki_status`: modalità attuale dell'archivio, stato, disponibilità della CLI di Obsidian
- `wiki_search`: cerca pagine wiki e, quando configurato, corpora di memoria condivisa
- `wiki_get`: legge una pagina wiki per id/percorso o ripiega sul corpus di memoria condivisa
- `wiki_apply`: mutazioni ristrette di sintesi/metadati senza chirurgia libera della pagina
- `wiki_lint`: controlli strutturali, lacune di provenienza, contraddizioni, domande aperte

Il Plugin registra anche un supplemento di corpus di memoria non esclusivo, così
`memory_search` e `memory_get` condivisi possono raggiungere il wiki quando il Plugin di Active Memory
supporta la selezione del corpus.

## Comportamento di prompt e contesto

Quando `context.includeCompiledDigestPrompt` è abilitato, le sezioni di prompt della memoria
aggiungono un'istantanea compilata compatta da `agent-digest.json`.

Quell'istantanea è intenzionalmente piccola e ad alto segnale:

- solo pagine principali
- solo affermazioni principali
- conteggio delle contraddizioni
- conteggio delle domande
- qualificatori di confidenza/freschezza

Questa opzione è opt-in perché cambia la forma del prompt ed è utile soprattutto per motori di contesto
o assemblaggio legacy del prompt che consumano esplicitamente supplementi di memoria.

## Configurazione

Inserisci la configurazione sotto `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Interruttori principali:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` oppure `obsidian`
- `bridge.readMemoryArtifacts`: importa artefatti pubblici del Plugin di Active Memory
- `bridge.followMemoryEvents`: include i log degli eventi in modalità bridge
- `search.backend`: `shared` oppure `local`
- `search.corpus`: `wiki`, `memory` oppure `all`
- `context.includeCompiledDigestPrompt`: aggiunge un'istantanea digest compatta alle sezioni di prompt della memoria
- `render.createBacklinks`: genera blocchi correlati deterministici
- `render.createDashboards`: genera pagine dashboard

### Esempio: QMD + modalità bridge

Usa questa configurazione quando vuoi QMD per il richiamo e `memory-wiki` per un livello di
conoscenza manutenuto:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Questo mantiene:

- QMD responsabile del richiamo di Active Memory
- `memory-wiki` focalizzato su pagine compilate e dashboard
- la forma del prompt invariata finché non abiliti intenzionalmente i prompt digest compilati

## CLI

`memory-wiki` espone anche una superficie CLI di primo livello:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Vedi [CLI: wiki](/cli/wiki) per il riferimento completo dei comandi.

## Supporto Obsidian

Quando `vault.renderMode` è `obsidian`, il Plugin scrive Markdown compatibile con Obsidian
e può opzionalmente usare la CLI ufficiale `obsidian`.

I flussi di lavoro supportati includono:

- verifica dello stato
- ricerca nel vault
- apertura di una pagina
- invocazione di un comando Obsidian
- salto alla nota giornaliera

Questo è facoltativo. Il wiki funziona comunque in modalità nativa senza Obsidian.

## Flusso di lavoro consigliato

1. Mantieni il tuo Plugin di Active Memory per richiamo/promozione/Dreaming.
2. Abilita `memory-wiki`.
3. Inizia con la modalità `isolated`, a meno che tu non voglia esplicitamente la modalità bridge.
4. Usa `wiki_search` / `wiki_get` quando la provenienza è importante.
5. Usa `wiki_apply` per sintesi ristrette o aggiornamenti dei metadati.
6. Esegui `wiki_lint` dopo modifiche significative.
7. Attiva le dashboard se vuoi visibilità su obsolescenza/contraddizioni.

## Documentazione correlata

- [Panoramica sulla memoria](/it/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
