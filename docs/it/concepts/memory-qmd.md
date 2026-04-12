---
read_when:
    - Vuoi configurare QMD come backend di memoria
    - Vuoi funzionalità di memoria avanzate come il reranking o percorsi indicizzati aggiuntivi
summary: Sidecar di ricerca local-first con BM25, vettori, reranking ed espansione della query
title: Motore di memoria QMD
x-i18n:
    generated_at: "2026-04-12T23:28:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27afc996b959d71caed964a3cae437e0e29721728b30ebe7f014db124c88da04
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# Motore di memoria QMD

[QMD](https://github.com/tobi/qmd) è un sidecar di ricerca local-first che viene eseguito
insieme a OpenClaw. Combina BM25, ricerca vettoriale e reranking in un unico
binario, e può indicizzare contenuti oltre ai file di memoria del tuo workspace.

## Cosa aggiunge rispetto al motore integrato

- **Reranking ed espansione della query** per un recupero migliore.
- **Indicizza directory aggiuntive** -- documentazione del progetto, note del team, qualsiasi cosa su disco.
- **Indicizza le trascrizioni delle sessioni** -- richiama conversazioni precedenti.
- **Completamente locale** -- viene eseguito tramite Bun + node-llama-cpp, scarica automaticamente i modelli GGUF.
- **Fallback automatico** -- se QMD non è disponibile, OpenClaw torna senza problemi al motore integrato.

## Per iniziare

### Prerequisiti

- Installa QMD: `npm install -g @tobilu/qmd` oppure `bun install -g @tobilu/qmd`
- Build di SQLite che consenta le estensioni (`brew install sqlite` su macOS).
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

OpenClaw crea una home QMD autonoma in
`~/.openclaw/agents/<agentId>/qmd/` e gestisce automaticamente il ciclo di vita
del sidecar -- raccolte, aggiornamenti ed esecuzioni di embedding sono gestiti per te.
Preferisce le forme correnti delle raccolte QMD e delle query MCP, ma continua a usare il fallback verso
i flag legacy delle raccolte `--mask` e i vecchi nomi degli strumenti MCP quando necessario.

## Come funziona il sidecar

- OpenClaw crea raccolte a partire dai file di memoria del tuo workspace e da qualsiasi
  `memory.qmd.paths` configurato, quindi esegue `qmd update` + `qmd embed` all'avvio
  e periodicamente (per impostazione predefinita ogni 5 minuti).
- La raccolta predefinita del workspace tiene traccia di `MEMORY.md` più l'albero
  `memory/`. `memory.md` in minuscolo rimane un fallback di bootstrap, non una raccolta QMD
  separata.
- L'aggiornamento all'avvio viene eseguito in background così l'avvio della chat non viene bloccato.
- Le ricerche usano il `searchMode` configurato (predefinito: `search`; supporta anche
  `vsearch` e `query`). Se una modalità fallisce, OpenClaw riprova con `qmd query`.
- Se QMD fallisce completamente, OpenClaw torna al motore SQLite integrato.

<Info>
La prima ricerca può essere lenta -- QMD scarica automaticamente i modelli GGUF (~2 GB) per
il reranking e l'espansione della query alla prima esecuzione di `qmd query`.
</Info>

## Override dei modelli

Le variabili d'ambiente dei modelli QMD vengono propagate inalterate dal processo
gateway, quindi puoi regolare QMD globalmente senza aggiungere nuova configurazione di OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Dopo aver cambiato il modello di embedding, riesegui gli embedding in modo che l'indice corrisponda al
nuovo spazio vettoriale.

## Indicizzazione di percorsi aggiuntivi

Indirizza QMD verso directory aggiuntive per renderle ricercabili:

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

Gli snippet dai percorsi aggiuntivi appaiono come `qmd/<collection>/<relative-path>` nei
risultati di ricerca. `memory_get` riconosce questo prefisso e legge dalla corretta
radice della raccolta.

## Indicizzazione delle trascrizioni delle sessioni

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

Le trascrizioni vengono esportate come turni User/Assistant sanitizzati in una raccolta QMD
dedicata in `~/.openclaw/agents/<id>/qmd/sessions/`.

## Ambito di ricerca

Per impostazione predefinita, i risultati di ricerca QMD vengono mostrati nelle sessioni dirette e di canale
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

Quando `memory.citations` è `auto` oppure `on`, gli snippet di ricerca includono un
piè di pagina `Source: <path#line>`. Imposta `memory.citations = "off"` per omettere il piè di pagina
continuando comunque a passare internamente il percorso all'agente.

## Quando usarlo

Scegli QMD quando hai bisogno di:

- Reranking per risultati di qualità superiore.
- Cercare documentazione di progetto o note al di fuori del workspace.
- Richiamare conversazioni di sessioni passate.
- Ricerca completamente locale senza chiavi API.

Per configurazioni più semplici, il [motore integrato](/it/concepts/memory-builtin) funziona bene
senza dipendenze aggiuntive.

## Risoluzione dei problemi

**QMD non trovato?** Assicurati che il binario sia nel `PATH` del gateway. Se OpenClaw
viene eseguito come servizio, crea un link simbolico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Prima ricerca molto lenta?** QMD scarica i modelli GGUF al primo utilizzo. Preriscaldalo
con `qmd query "test"` usando le stesse directory XDG usate da OpenClaw.

**La ricerca va in timeout?** Aumenta `memory.qmd.limits.timeoutMs` (predefinito: 4000ms).
Impostalo a `120000` per hardware più lento.

**Risultati vuoti nelle chat di gruppo?** Controlla `memory.qmd.scope` -- per impostazione predefinita
consente solo sessioni dirette e di canale.

**Repo temporanei visibili dal workspace che causano `ENAMETOOLONG` o indicizzazione non funzionante?**
L'attraversamento QMD attualmente segue il comportamento dello scanner QMD sottostante invece delle
regole sui collegamenti simbolici del motore integrato di OpenClaw. Mantieni i checkout temporanei di monorepo in
directory nascoste come `.tmp/` o fuori dalle radici QMD indicizzate finché QMD non esporrà
un attraversamento sicuro rispetto ai cicli o controlli di esclusione espliciti.

## Configurazione

Per l'intera superficie di configurazione (`memory.qmd.*`), le modalità di ricerca, gli intervalli di aggiornamento,
le regole di ambito e tutti gli altri controlli, consulta il
[Riferimento della configurazione della memoria](/it/reference/memory-config).
