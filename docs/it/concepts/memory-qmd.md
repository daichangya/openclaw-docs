---
read_when:
    - Vuoi configurare QMD come backend di memoria
    - Vuoi funzionalità di memoria avanzate come il reranking o percorsi indicizzati aggiuntivi
summary: Sidecar di ricerca local-first con BM25, vettori, reranking ed espansione delle query
title: Motore di memoria QMD
x-i18n:
    generated_at: "2026-04-25T13:45:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) è un sidecar di ricerca local-first che viene eseguito
insieme a OpenClaw. Combina BM25, ricerca vettoriale e reranking in un unico
binario, e può indicizzare contenuti oltre ai file di memoria del tuo spazio di lavoro.

## Cosa aggiunge rispetto al motore integrato

- **Reranking ed espansione delle query** per un recupero migliore.
- **Indicizzazione di directory aggiuntive** -- documentazione di progetto, note del team, qualsiasi contenuto su disco.
- **Indicizzazione dei transcript di sessione** -- per richiamare conversazioni precedenti.
- **Completamente locale** -- viene eseguito con il pacchetto runtime facoltativo node-llama-cpp e
  scarica automaticamente i modelli GGUF.
- **Fallback automatico** -- se QMD non è disponibile, OpenClaw torna al
  motore integrato senza interruzioni.

## Per iniziare

### Prerequisiti

- Installa QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Build SQLite che consenta le estensioni (`brew install sqlite` su macOS).
- QMD deve essere nel `PATH` del gateway.
- macOS e Linux funzionano subito. Windows è supportato al meglio tramite WSL2.

### Abilitazione

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea una home QMD autonoma sotto
`~/.openclaw/agents/<agentId>/qmd/` e gestisce automaticamente il ciclo di vita del sidecar
-- raccolte, aggiornamenti ed esecuzioni degli embedding vengono gestiti per te.
Privilegia le attuali forme di raccolta QMD e query MCP, ma continua a usare il fallback verso
i flag di raccolta legacy `--mask` e i nomi degli strumenti MCP meno recenti quando necessario.
La riconciliazione all'avvio ricrea anche le raccolte gestite obsolete riportandole ai loro
pattern canonici quando è ancora presente una raccolta QMD meno recente con lo stesso nome.

## Come funziona il sidecar

- OpenClaw crea raccolte a partire dai file di memoria del tuo spazio di lavoro e da tutti i
  `memory.qmd.paths` configurati, poi esegue `qmd update` + `qmd embed` all'avvio
  e periodicamente (predefinito ogni 5 minuti).
- La raccolta predefinita dello spazio di lavoro tiene traccia di `MEMORY.md` più l'albero
  `memory/`. `memory.md` in minuscolo non viene indicizzato come file di memoria root.
- L'aggiornamento all'avvio viene eseguito in background così l'avvio della chat non viene bloccato.
- Le ricerche usano il `searchMode` configurato (predefinito: `search`; supporta anche
  `vsearch` e `query`). Se una modalità fallisce, OpenClaw ritenta con `qmd query`.
- Se QMD fallisce del tutto, OpenClaw usa il fallback al motore SQLite integrato.

<Info>
La prima ricerca potrebbe essere lenta -- QMD scarica automaticamente i modelli GGUF (~2 GB) per
reranking ed espansione delle query alla prima esecuzione di `qmd query`.
</Info>

## Override del modello

Le variabili d'ambiente del modello QMD passano inalterate dal processo gateway,
quindi puoi regolare QMD globalmente senza aggiungere nuova configurazione OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Dopo aver cambiato il modello di embedding, riesegui gli embedding così l'indice corrisponde
al nuovo spazio vettoriale.

## Indicizzazione di percorsi aggiuntivi

Indica a QMD directory aggiuntive per renderle ricercabili:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Gli snippet dai percorsi aggiuntivi compaiono come `qmd/<collection>/<relative-path>` nei
risultati di ricerca. `memory_get` comprende questo prefisso e legge dalla corretta
root della raccolta.

## Indicizzazione dei transcript di sessione

Abilita l'indicizzazione delle sessioni per richiamare conversazioni precedenti:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

I transcript vengono esportati come turni User/Assistant sanitizzati in una raccolta QMD
dedicata sotto `~/.openclaw/agents/<id>/qmd/sessions/`.

## Ambito di ricerca

Per impostazione predefinita, i risultati di ricerca QMD vengono mostrati nelle sessioni dirette e nei canali
(non nei gruppi). Configura `memory.qmd.scope` per modificarlo:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Quando l'ambito nega una ricerca, OpenClaw registra un avviso con il canale derivato e
il tipo di chat, così i risultati vuoti sono più facili da diagnosticare.

## Citazioni

Quando `memory.citations` è `auto` o `on`, gli snippet di ricerca includono un
footer `Source: <path#line>`. Imposta `memory.citations = "off"` per omettere il footer
continuando comunque a passare internamente il percorso all'agente.

## Quando usarlo

Scegli QMD quando hai bisogno di:

- Reranking per risultati di qualità superiore.
- Cercare documentazione di progetto o note fuori dallo spazio di lavoro.
- Richiamare conversazioni di sessioni passate.
- Ricerca completamente locale senza chiavi API.

Per configurazioni più semplici, il [motore integrato](/it/concepts/memory-builtin) funziona bene
senza dipendenze aggiuntive.

## Risoluzione dei problemi

**QMD non trovato?** Assicurati che il binario sia nel `PATH` del gateway. Se OpenClaw
viene eseguito come servizio, crea un symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Prima ricerca molto lenta?** QMD scarica i modelli GGUF al primo utilizzo. Esegui il pre-warm
con `qmd query "test"` usando le stesse directory XDG usate da OpenClaw.

**La ricerca va in timeout?** Aumenta `memory.qmd.limits.timeoutMs` (predefinito: 4000ms).
Impostalo a `120000` per hardware più lento.

**Risultati vuoti nelle chat di gruppo?** Controlla `memory.qmd.scope` -- per impostazione predefinita
consente solo sessioni dirette e di canale.

**La ricerca nella memoria root è improvvisamente diventata troppo ampia?** Riavvia il gateway o attendi la prossima riconciliazione all'avvio. OpenClaw ricrea le raccolte gestite obsolete
riportandole ai pattern canonici `MEMORY.md` e `memory/` quando rileva un conflitto
di stesso nome.

**Repo temporanei visibili nello spazio di lavoro che causano `ENAMETOOLONG` o indicizzazione non funzionante?**
L'attraversamento QMD attualmente segue il comportamento dello scanner QMD sottostante invece
delle regole di symlink integrate di OpenClaw. Mantieni i checkout temporanei di monorepo sotto
directory nascoste come `.tmp/` o fuori dalle root QMD indicizzate finché QMD non espone
attraversamento sicuro rispetto ai cicli o controlli di esclusione espliciti.

## Configurazione

Per l'intera superficie di configurazione (`memory.qmd.*`), modalità di ricerca, intervalli
di aggiornamento, regole di ambito e tutte le altre opzioni, vedi il
[Riferimento della configurazione della memoria](/it/reference/memory-config).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
