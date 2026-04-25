---
read_when:
    - Stai scegliendo tra Pi, Codex, ACP o un altro runtime nativo per agenti
    - Sei confuso dalle etichette provider/modello/runtime nello stato o nella configurazione
    - Stai documentando la parità di supporto per un harness nativo
summary: Come OpenClaw separa provider di modelli, modelli, canali e runtime degli agenti
title: Runtime degli agenti
x-i18n:
    generated_at: "2026-04-25T13:44:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Un **runtime degli agenti** è il componente che possiede un ciclo di modello preparato: riceve il prompt, guida l'output del modello, gestisce le chiamate native agli strumenti e restituisce a OpenClaw il turno completato.

I runtime sono facili da confondere con i provider perché entrambi compaiono vicino alla configurazione del modello. Sono livelli diversi:

| Livello       | Esempi                                | Significato                                                          |
| ------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Come OpenClaw autentica, individua i modelli e nomina i riferimenti ai modelli. |
| Modello       | `gpt-5.5`, `claude-opus-4-6`          | Il modello selezionato per il turno dell'agente.                     |
| Runtime degli agenti | `pi`, `codex`, runtime basati su ACP | Il ciclo di basso livello che esegue il turno preparato.      |
| Canale        | Telegram, Discord, Slack, WhatsApp    | Da dove i messaggi entrano ed escono da OpenClaw.                    |

Vedrai anche la parola **harness** nel codice e nella configurazione. Un harness è l'implementazione che fornisce un runtime degli agenti. Ad esempio, l'harness Codex incluso implementa il runtime `codex`. La chiave di configurazione si chiama ancora `embeddedHarness` per compatibilità, ma nella documentazione rivolta all'utente e nell'output di stato in generale si dovrebbe usare runtime.

La configurazione Codex più comune usa il provider `openai` con il runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Questo significa che OpenClaw seleziona un riferimento di modello OpenAI, poi chiede al runtime app-server Codex di eseguire il turno dell'agente integrato. Non significa che il canale, il catalogo provider dei modelli o l'archivio delle sessioni di OpenClaw diventino Codex.

Per la suddivisione dei prefissi della famiglia OpenAI, vedi [OpenAI](/it/providers/openai) e [Provider di modelli](/it/concepts/model-providers). Per il contratto di supporto del runtime Codex, vedi [Harness Codex](/it/plugins/codex-harness#v1-support-contract).

## Proprietà del runtime

Runtime diversi possiedono parti diverse del ciclo.

| Superficie                  | PI integrato di OpenClaw                | App-server Codex                                                           |
| --------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Proprietario del ciclo del modello | OpenClaw tramite il runner PI integrato | App-server Codex                                                     |
| Stato canonico del thread   | Trascrizione OpenClaw                   | Thread Codex, più mirror della trascrizione OpenClaw                       |
| Strumenti dinamici OpenClaw | Ciclo strumenti nativo OpenClaw         | Collegati tramite l'adattatore Codex                                       |
| Strumenti shell e file nativi | Percorso PI/OpenClaw                  | Strumenti nativi Codex, collegati tramite hook nativi dove supportati      |
| Motore di contesto          | Assemblaggio nativo del contesto OpenClaw | Contesto assemblato dai progetti OpenClaw nel turno Codex               |
| Compaction                  | OpenClaw o il motore di contesto selezionato | Compaction nativa Codex, con notifiche OpenClaw e manutenzione del mirror |
| Consegna sul canale         | OpenClaw                                | OpenClaw                                                                   |

Questa suddivisione della proprietà è la regola di progettazione principale:

- Se OpenClaw possiede la superficie, OpenClaw può fornire il normale comportamento degli hook del Plugin.
- Se il runtime nativo possiede la superficie, OpenClaw ha bisogno di eventi del runtime o hook nativi.
- Se il runtime nativo possiede lo stato canonico del thread, OpenClaw dovrebbe fare mirror e proiettare il contesto, non riscrivere interni non supportati.

## Selezione del runtime

OpenClaw sceglie un runtime integrato dopo la risoluzione di provider e modello:

1. Ha la precedenza il runtime registrato di una sessione. Le modifiche alla configurazione non cambiano a caldo una trascrizione esistente verso un sistema di thread nativo diverso.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza quel runtime per sessioni nuove o reimpostate.
3. `agents.defaults.embeddedHarness.runtime` o
   `agents.list[].embeddedHarness.runtime` possono impostare `auto`, `pi` o un
   ID runtime registrato come `codex`.
4. In modalità `auto`, i runtime dei Plugin registrati possono reclamare coppie provider/modello supportate.
5. Se nessun runtime reclama un turno in modalità `auto` e `fallback: "pi"` è impostato
   (predefinito), OpenClaw usa PI come fallback di compatibilità. Imposta
   `fallback: "none"` per far fallire invece la selezione non corrispondente in modalità `auto`.

I runtime Plugin espliciti falliscono in modalità chiusa per impostazione predefinita. Ad esempio,
`runtime: "codex"` significa Codex o un chiaro errore di selezione a meno che tu non imposti
`fallback: "pi"` nello stesso ambito di override. Un override del runtime non eredita
un'impostazione di fallback più ampia, quindi un `runtime: "codex"` a livello agente non viene instradato
silenziosamente di nuovo a PI solo perché i valori predefiniti usavano `fallback: "pi"`.

## Contratto di compatibilità

Quando un runtime non è PI, dovrebbe documentare quali superfici di OpenClaw supporta.
Usa questa struttura per la documentazione dei runtime:

| Domanda                               | Perché è importante                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Chi possiede il ciclo del modello?    | Determina dove avvengono retry, continuazione degli strumenti e decisioni sulla risposta finale.    |
| Chi possiede la cronologia canonica del thread? | Determina se OpenClaw può modificare la cronologia o solo farne il mirror.               |
| Gli strumenti dinamici OpenClaw funzionano? | Messaggistica, sessioni, Cron e strumenti posseduti da OpenClaw dipendono da questo.         |
| Gli hook degli strumenti dinamici funzionano? | I Plugin si aspettano `before_tool_call`, `after_tool_call` e middleware attorno agli strumenti posseduti da OpenClaw. |
| Gli hook degli strumenti nativi funzionano? | Shell, patch e strumenti posseduti dal runtime hanno bisogno del supporto degli hook nativi per policy e osservazione. |
| Viene eseguito il ciclo di vita del motore di contesto? | I Plugin di memoria e contesto dipendono dal ciclo di vita di assemble, ingest, after-turn e Compaction. |
| Quali dati di Compaction sono esposti? | Alcuni Plugin hanno bisogno solo di notifiche, mentre altri richiedono metadati kept/dropped.      |
| Cosa è intenzionalmente non supportato? | Gli utenti non dovrebbero presumere equivalenza con PI dove il runtime nativo possiede più stato. |

Il contratto di supporto del runtime Codex è documentato in
[Harness Codex](/it/plugins/codex-harness#v1-support-contract).

## Etichette di stato

L'output di stato può mostrare sia le etichette `Execution` sia `Runtime`. Leggile come
diagnostica, non come nomi di provider.

- Un riferimento di modello come `openai/gpt-5.5` ti dice provider/modello selezionato.
- Un ID runtime come `codex` ti dice quale ciclo sta eseguendo il turno.
- Un'etichetta di canale come Telegram o Discord ti dice dove sta avvenendo la conversazione.

Se una sessione mostra ancora PI dopo aver cambiato la configurazione del runtime, avvia una nuova sessione
con `/new` o cancella quella corrente con `/reset`. Le sessioni esistenti mantengono il runtime registrato
in modo che una trascrizione non venga riprodotta attraverso due sistemi di sessione nativi incompatibili.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [OpenAI](/it/providers/openai)
- [Plugin harness degli agenti](/it/plugins/sdk-agent-harness)
- [Ciclo dell'agente](/it/concepts/agent-loop)
- [Modelli](/it/concepts/models)
- [Stato](/it/cli/status)
